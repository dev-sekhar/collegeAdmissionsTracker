import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sources, canonicalUrl, institutionRecords, subjectMatches, degreeFromTitle, validateRequest, countryName,programEvidence } from '../src/discovery.js';
import {catalogueSources,sourceDomain} from '../src/catalogue-sources.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const requestPath = process.argv[2];
if (!requestPath) { console.error('Usage: npm run discover -- <path-to-discovery-request.json>'); process.exit(1); }
const request = validateRequest(JSON.parse(await readFile(path.resolve(requestPath), 'utf8')));
const startedAt = new Date().toISOString();
const report = { version: 1, startedAt, request, latestRequest: request, institutions: [], programs: [], coverage: [], failures: [] };
// Reuse other countries only for the same subject/degree query; their evidence times remain unchanged.
try {
  const previous = JSON.parse(await readFile(path.join(root, 'data/latest.json'), 'utf8'));
  if (previous.version === 1 && previous.request.degree === request.degree && JSON.stringify([...previous.request.subjects].sort()) === JSON.stringify([...request.subjects].sort())) {
    const selected = request.countries.map(countryName);
    for (const key of ['institutions', 'programs', 'coverage', 'failures']) report[key] = previous[key].filter(item => !selected.includes(item.country));
    report.request = { ...request, countries: [...new Set([...report.coverage.map(item => item.country), ...selected])] };
  }
} catch { /* No compatible previous catalogue. */ }
// Explicit catalogue adapter: expand supported campuses here after checking their HTML.
const adapters = [
  ...catalogueSources,
  { domain: 'ubc.ca', country: 'Canada', campus: 'Vancouver', url: 'https://www.grad.ubc.ca/prospective-students/graduate-degree-programs', programPath: '/prospective-students/graduate-degree-programs/', selector: 'table td a[href]' },
  { domain: 'nus.edu.sg', country: 'Singapore', url: 'https://www.comp.nus.edu.sg/programmes/', programPath: '/programmes/pg/', selector: 'a[href*="/programmes/pg/"]' },
  { domain: 'utwente.nl', country: 'Netherlands', url: 'https://www.utwente.nl/en/education/master/programmes/', programPath: '/en/education/master/programmes/', selector: 'main a[href*="/en/education/master/programmes/"]', directChildren: true, degreeHint: 'Master’s' },
  { domain: 'tum.de', country: 'Germany', url: 'https://www.tum.de/en/studies/degree-programs', programPath: '/en/studies/degree-programs/detail/', selector: '.c-in2studyfinderlist-filter__searchautocompleteitemlink' },
  { domain: 'anu.edu.au', country: 'Australia', url: 'https://programsandcourses.anu.edu.au/Catalogue', programPath: '/program/', selector: 'table a[href*="/program/"]', search: true },
];
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ userAgent: 'AdmissionsExplorer/0.2 (bounded public-page catalogue discovery)' });
const page = await context.newPage();
page.setDefaultTimeout(20000);
let lastVisit = 0;
async function visit(url, selector) {
  // Only configured public sources and links on their configured host are visited.
  await new Promise(resolve => setTimeout(resolve, Math.max(0, 1200 - (Date.now() - lastVisit))));
  lastVisit = Date.now();
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  if (!response?.ok()) throw Error(`HTTP ${response?.status() ?? 'unavailable'}`);
  const text = await page.locator('body').innerText();
  if (/just a moment|verify you are human|performing security verification|access denied/iu.test(text.slice(0,1800))) throw Error('Access check encountered; no bypass attempted.');
  await page.locator(selector).first().waitFor({ state: 'attached', timeout: 15000 });
  return { url: page.url(), title: await page.title(), text, checkedAt: new Date().toISOString() };
}
try {
  for (const country of [...new Set(request.countries.map(countryName))]) {
    const source = sources[country];
    if (!source) { report.coverage.push({ country, status: 'Source setup needed', institutions: 0, cataloguesChecked: 0 }); continue; }
    const coverage = { country, status: 'Partial coverage', source: source.directory, institutions: 0, cataloguesChecked: 0 };
    report.coverage.push(coverage);
    let institutions=[];
    try {
      console.log(`Reading ${source.label}`);
      const evidence = await visit(source.directory, source.selector);
      if (new URL(evidence.url).hostname !== new URL(source.directory).hostname) throw Error('Unexpected directory redirect; review required.');
      const links = await page.locator(source.selector).evaluateAll(nodes => nodes.map(a => ({ text: a.textContent, href: a.href })));
      if (source.profiles) {
        institutions = [];
        for (const url of [...new Set(links.map(link => link.href))].slice(0,6)) {
          try {
            if (new URL(url).hostname !== new URL(source.directory).hostname) continue;
            const profile = await visit(url, 'main h1');
            const name = await page.locator('main h1').innerText();
            const websites = await page.locator('main a[href]').evaluateAll(nodes => nodes.map(a => ({ href: a.href })));
            const website = websites.find(link => new URL(link.href).hostname.endsWith('.edu.sg'));
            if (!website) throw Error('No university website found on MOE profile.');
            institutions.push(...institutionRecords([{ text: name, href: new URL(website.href).origin }], country, { ...source, directory: profile.url }, profile.checkedAt));
          } catch (error) { report.failures.push({ country, url, reason: error.message }); }
        }
      } else institutions = institutionRecords(links, country, source, evidence.checkedAt);
      if (!institutions.length) throw Error('No institution links matched; directory layout requires review.');
      report.institutions.push(...institutions);
      coverage.institutions = institutions.length;
      coverage.checkedAt = evidence.checkedAt;
      coverage.scope = source.scope || 'Directory members only; not a complete accreditation register.';
    } catch (error) { coverage.status = 'Directory unavailable; configured catalogues still checked'; report.failures.push({ country, url: source.directory, reason: error.message }); }
      for (const adapter of adapters.filter(adapter => adapter.country === country&&(!adapter.degreeHint||adapter.degreeHint===request.degree))) {
        console.log(`Checking catalogue: ${adapter.url}`);
        if(adapter.institution&&!institutions.some(item=>sourceDomain(item.website)===adapter.domain)){
          const item={id:`${country}:${adapter.domain}`,name:adapter.institution,country,website:new URL(adapter.url).origin,directoryUrl:adapter.url,directoryLabel:'Configured official catalogue; directory corroboration unavailable',checkedAt:null,status:'Configured official institution; directory corroboration not captured'};
          institutions.push(item);report.institutions.push(item);
        }
        const institution = institutions.find(institution => {
          const host = new URL(institution.website).hostname;
          return host === adapter.domain || host.endsWith(`.${adapter.domain}`);
        });
        if (!institution) { report.failures.push({ country, url: adapter.url, reason: 'Institution not found in the directory; catalogue not trusted.' }); continue; }
        try {
          const queue = adapter.keyword?request.subjects.slice(0,5).map(subject=>({url:adapter.url,subject})):[{url:adapter.url}]; const visited = new Set(); const programLinks = new Map();
          // Bounded HTML pagination. Never query a site's hidden endpoints.
          while (queue.length && visited.size < 5) {
            const {url,subject}=queue.shift();const key=`${url}|${subject||''}`;
            if (visited.has(key)) continue;
            visited.add(key);
            const evidence = await visit(url, adapter.selector);
            if ((sourceDomain(evidence.url)||new URL(evidence.url).hostname) !== (sourceDomain(adapter.url)||new URL(adapter.url).hostname)) throw Error('Unexpected catalogue redirect.');
            if (adapter.search) {
              await page.locator('#search-box').fill(request.subjects[0] === 'Computer Science' ? 'computing' : request.subjects[0]);
              await page.locator('#btnSearchCatalogue').click();
              await page.locator('h1').filter({ hasText: 'Search results for' }).waitFor({ state: 'visible' });
              await page.locator('table a[href*="/program/"]').filter({ hasText: /Master|Bachelor|Doctor/ }).first().waitFor({ state: 'attached' });
            }
            if(adapter.keyword&&subject){
              try{
                await page.locator(adapter.keyword).fill(subject);await page.locator(adapter.keyword).press('Enter');
                const escaped=subject.replace(/[.*+?^${}()|[\]\\]/gu,'\\$&');
                await page.locator(`a[href*="${adapter.programPath}"]`).filter({hasText:new RegExp(escaped,'iu')}).first().waitFor({state:'attached',timeout:15000});
              }catch(error){report.failures.push({country,url,reason:`Keyword search for ${subject}: ${error.message}`});continue;}
            }
            const rows = await page.locator(adapter.selector).evaluateAll(nodes => nodes.map(a => ({ text: a.querySelector('.studyfinder__programme__title__text') ? `${a.querySelector('.studyfinder__programme__title__text').textContent} ${a.querySelector('.degree')?.textContent || ''}` : (a.innerText || a.textContent)?.trim(), href: a.href })));
            for (const row of rows) {
              const href = canonicalUrl(row.href);
              const pathname = href && new URL(href).pathname;
              if (href && (sourceDomain(href)||new URL(href).hostname)===(sourceDomain(adapter.url)||new URL(adapter.url).hostname) && (adapter.search ? /\/\d{4}\/program\//u.test(pathname) : pathname.startsWith(adapter.programPath)) && (!adapter.directChildren || pathname.slice(adapter.programPath.length).split('/').filter(Boolean).length === 1)) {
                const current = programLinks.get(href);
                if (!current || row.text.length > current.text.length) programLinks.set(href, { ...row, href, catalogueUrl: page.url(), checkedAt: evidence.checkedAt });
              }
            }
            const nextLink=page.getByRole('link',{name:/^(Next page|Next)$/iu});
            const next=await nextLink.count()?await nextLink.first().getAttribute('href'):null;
            if (next) { const href = new URL(next, evidence.url); if (href.hostname === new URL(adapter.url).hostname && href.pathname === new URL(adapter.url).pathname) queue.push({url:href.href}); }
          }
          coverage.cataloguesChecked++;
          let detailVisits = 0;
          for (const row of programLinks.values()) {
            const subjects = request.subjects.filter(subject => subjectMatches(row.text, subject));
            if (!subjects.length || (degreeFromTitle(row.text) || adapter.degreeHint) !== request.degree) continue;
            if (detailVisits++ >= 25) { coverage.limitReached = true; break; }
            // Confirm the detail page's own heading; a catalogue/search hit is insufficient.
            try {
              const detail = await visit(row.href, 'body');
              if ((sourceDomain(detail.url)||new URL(detail.url).hostname)!==(sourceDomain(adapter.url)||new URL(adapter.url).hostname)) throw Error('Unexpected program redirect.');
              const headings = await page.locator('h1').allTextContents();
              const main=page.locator('main, #main-content, #main');
              const mainText = await (await main.count()?main.first():page.locator('body')).innerText();
              const proof=programEvidence(headings,detail.title,mainText,subjects,request.degree);
              if(!proof)throw Error('Program page title/heading and degree evidence do not confirm the catalogue match.');
              const {heading,degreePassage}=proof;
              const url = canonicalUrl(detail.url);
              if (report.programs.some(program => program.sourceUrl === url)) continue;
              report.programs.push({ id: createHash('sha256').update(url).digest('hex').slice(0,16), institution: institution.name, institutionId: institution.id, country, campus: adapter.campus || null, title: heading, degree: request.degree, subjects, intake: null, requestedIntake: request.intake, status: 'Program page confirmed; intake unconfirmed', sourceUrl: url, catalogueUrl: row.catalogueUrl, directoryUrl: institution.directoryUrl, checkedAt: detail.checkedAt, evidence: heading, degreeEvidence: degreePassage });
            } catch (error) { report.failures.push({ country, url: row.href, reason: error.message }); }
          }
          coverage.note = `${coverage.cataloguesChecked} configured catalogues checked (max 5 pages and 25 detail visits each). Other institutions are not yet searched for programs.${adapter.search ? ' ANU search uses the first requested subject only.' : ''}`;
          console.log(`Catalogue checked; ${report.programs.filter(item=>item.country===country).length} program matches so far in ${country}.`);
        } catch (error) { console.log(`Catalogue unavailable: ${adapter.url}: ${error.message}`);report.failures.push({ country, url: adapter.url, reason: error.message }); }
      }
      if (!coverage.cataloguesChecked) coverage.note = 'Institution directory read; no program catalogue adapter completed.';
  }
} finally { await browser.close(); }
report.finishedAt = new Date().toISOString();
await mkdir(path.join(root, 'data/runs'), { recursive: true });
const json = JSON.stringify(report, null, 2);
const temporary = path.join(root, 'data/latest.json.tmp');
await writeFile(path.join(root, `data/runs/${startedAt.replace(/[:.]/gu, '-')}.json`), json);
await writeFile(temporary, json); await rename(temporary, path.join(root, 'data/latest.json'));
console.log(`Saved ${report.institutions.length} institutions, ${report.programs.length} program matches, ${report.failures.length} source failures. Reload the dashboard.`);
