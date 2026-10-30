import { chromium } from 'playwright';
import { readFile, writeFile, mkdir, rename, readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractCandidates } from '../src/deadlines.js';
import { canonicalUrl, validateRequest, matchesDiscovery } from '../src/discovery.js';
import { extractHtmlEvidence } from './html-evidence.mjs';
import {trustedDomains} from '../src/catalogue-sources.js';
import {intakeEvidence,retainedEvidence,withIntakeContext} from '../src/coverage.js';
const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const catalogue = JSON.parse(await readFile(path.join(root, 'data/latest.json'), 'utf8'));
if (catalogue.version !== 1 || !Array.isArray(catalogue.programs)) throw Error('Run discovery before collecting deadlines.');
const request = process.argv[2] ? validateRequest(JSON.parse(await readFile(path.resolve(process.argv[2]),'utf8'))) : catalogue.request;
const startedAt = new Date().toISOString();
const run = { version: 1, startedAt, programs: [], failures: [] };
const selectedPrograms=catalogue.programs.filter(program=>matchesDiscovery(program,request));
const selectedIds=new Set(selectedPrograms.map(program=>program.id));
try{
  const previous=JSON.parse(await readFile(path.join(root,'data/deadlines.json'),'utf8'));
  run.programs=retainedEvidence(previous,catalogue,selectedIds);
  run.retainedPrograms=run.programs.length;
}catch{run.retainedPrograms=0;}
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage();
page.setDefaultTimeout(10000);
const cache = new Map();
const baseDomain = url => trustedDomains.find(domain => new URL(url).hostname === domain || new URL(url).hostname.endsWith(`.${domain}`));
await mkdir(path.join(root,'data/deadline-files'),{recursive:true});
async function pdfText(url) {
  const token = createHash('sha256').update(url).digest('hex').slice(0,16);
  const file = path.join(root,'data/deadline-files',`${token}.pdf`);
  const pending = page.waitForEvent('download',{timeout:30000});
  // Directly download the linked public document through the browser, not a data API.
  const navigation = page.goto(url,{timeout:30000}).catch(()=>{});
  const download = await pending; await navigation;
  if (baseDomain(download.url())!==baseDomain(url)) throw Error('Unexpected PDF download redirect.');
  await download.saveAs(file);
  const { stdout } = await execute('pdftotext',['-layout','-f','1','-l','10',file,'-'],{maxBuffer:4*1024*1024,timeout:60000});
  if (stdout.trim().length > 80) return { text:stdout, extraction:'PDF text; first 10 pages only' };
  const prefix = path.join(root,'data/deadline-files',token);
  await execute('pdftoppm',['-f','1','-l','3','-scale-to','1800','-png',file,prefix],{timeout:60000});
  let text = '';
  for (const name of (await readdir(path.dirname(file))).filter(name=>name.startsWith(`${token}-`)&&name.endsWith('.png')).sort()) {
    text += (await execute('tesseract',[path.join(path.dirname(file),name),'stdout'],{timeout:60000,maxBuffer:4*1024*1024})).stdout+'\n';
  }
  return { text, extraction:'OCR; first 3 pages only; visual review required' };
}
async function collect(url) {
  if (cache.has(url)) return cache.get(url);
  await new Promise(resolve=>setTimeout(resolve,1000));
  if (!baseDomain(url)) throw Error('Unconfigured source domain.');
  if (/\.pdf(?:$|\?)/iu.test(url)) {
    const extracted = await pdfText(url);
    const value = { checkedAt:new Date().toISOString(),sourceUrl:url,blocks:extracted.text.split(/\n\s*\n/u).map(text=>({type:'text',text,context:'PDF notice; program and intake applicability unconfirmed'})),links:[],extraction:extracted.extraction };
    cache.set(url,value); return value;
  }
  const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  if (!response?.ok()) throw Error(`HTTP ${response?.status() ?? 'unavailable'}`);
  if (baseDomain(page.url())!==baseDomain(url)) throw Error('Unexpected source redirect.');
  const text = await page.locator('body').innerText();
  if (/just a moment|verify you are human|performing security verification|access denied/iu.test(text.slice(0,1800))) throw Error('Access check encountered; no bypass attempted.');
  const content = await page.evaluate(extractHtmlEvidence);
  const result = withIntakeContext({...content,checkedAt:new Date().toISOString(),sourceUrl:page.url(),extraction:'HTML'});
  cache.set(url,result); return result;
}
try {
  for (const program of selectedPrograms) {
    console.log(`Collecting admission stages: ${program.institution} / ${program.title}`);
    const entry = { programId:program.id,programUrl:program.sourceUrl,title:program.title,requestedIntake:request.intake,candidates:[],intakes:[],sources:[],failures:[] };
    run.programs.push(entry);
    try {
      const first = await collect(program.sourceUrl);
      const links = first.links.filter(link=>{
        const url=canonicalUrl(link.href);
        return url && baseDomain(url)===baseDomain(program.sourceUrl) && /(appl|admission|enrol|intake|calendar|important dates)/iu.test(link.text) && !/scholarship|funding|accommodation|financial aid/iu.test(link.text) && !(program.degree!=='Bachelor’s'&&/undergraduate/iu.test(link.text));
      }).sort((a,b)=>Number(/application information/iu.test(b.text))-Number(/application information/iu.test(a.text)));
      const urls = [...new Set([program.sourceUrl,...links.map(link=>canonicalUrl(link.href))])].slice(0,7);
      for (const url of urls) {
        try {
          const source = await collect(url);
          entry.sources.push({url:source.sourceUrl,checkedAt:source.checkedAt,extraction:source.extraction});
          entry.candidates.push(...extractCandidates(source.blocks,source));
          entry.intakes.push(...intakeEvidence(source.blocks,source,program.sourceUrl));
          // One additional link depth, bounded to seven pages for this program.
          for(const link of source.links){const next=canonicalUrl(link.href);if(next&&baseDomain(next)===baseDomain(program.sourceUrl)&&/application|important dates|admission|apply|calendar/iu.test(link.text)&&!/scholarship|funding|accommodation|financial aid|graduate/iu.test(link.text.replace(/undergraduate/giu,''))&&!urls.includes(next)&&urls.length<7)urls.push(next);}
        } catch(error) { entry.failures.push({url,reason:error.message}); }
      }
      const unique = new Map(entry.candidates.map(candidate=>[JSON.stringify([candidate.stage,candidate.value,candidate.context,candidate.applicantCategory,candidate.sourceUrl]),candidate]));
      entry.candidates=[...unique.values()];
    } catch(error) { entry.failures.push({url:program.sourceUrl,reason:error.message}); }
  }
} finally { await browser.close(); }
run.finishedAt=new Date().toISOString();
await mkdir(path.join(root,'data/deadline-runs'),{recursive:true});
const json=JSON.stringify(run,null,2);
await writeFile(path.join(root,`data/deadline-runs/${startedAt.replace(/[:.]/gu,'-')}.json`),json);
const temp=path.join(root,'data/deadlines.json.tmp');
await writeFile(temp,json); await rename(temp,path.join(root,'data/deadlines.json'));
console.log(`Collected ${run.programs.reduce((sum,p)=>sum+p.candidates.length,0)} unverified stage-date records for ${run.programs.length} programs. Reload the dashboard.`);
