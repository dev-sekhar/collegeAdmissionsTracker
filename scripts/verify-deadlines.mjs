import {chromium} from 'playwright';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {extractHtmlEvidence} from './html-evidence.mjs';
import {extractCandidates} from '../src/deadlines.js';
import {recordKey,programSourceScope} from '../src/verification.js';
import {canonicalUrl} from '../src/discovery.js';
import {trustedDomains} from '../src/catalogue-sources.js';
import {withIntakeContext} from '../src/coverage.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const catalogue=JSON.parse(await readFile(path.join(root,'data/latest.json'),'utf8'));
const deadlines=JSON.parse(await readFile(path.join(root,'data/deadlines.json'),'utf8'));
const domains=trustedDomains;
const domain=url=>{try{const u=new URL(url);return u.protocol==='https:'&&domains.find(d=>u.hostname===d||u.hostname.endsWith(`.${d}`));}catch{return null;}};
const report={version:1,startedAt:new Date().toISOString(),programs:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage();
page.setDefaultTimeout(10000);
const cache=new Map();
async function fresh(url) {
  const canonical=canonicalUrl(url);
  if(cache.has(canonical))return cache.get(canonical);
  if(!domain(url)||/\.pdf(?:$|\?)/iu.test(url))throw Error('A configured HTTPS HTML source is required; PDFs need visual review.');
  await new Promise(resolve=>setTimeout(resolve,1000));
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:30000});
  if(!response?.ok())throw Error(`HTTP ${response?.status()||'unavailable'}`);
  if(domain(page.url())!==domain(url))throw Error('Unexpected source redirect.');
  if(/just a moment|verify you are human|access denied/iu.test((await page.locator('body').innerText()).slice(0,1500)))throw Error('Access check encountered; no bypass attempted.');
  const content=await page.evaluate(extractHtmlEvidence);
  const result=withIntakeContext({...content,sourceUrl:page.url(),checkedAt:new Date().toISOString(),extraction:'HTML'});
  result.keys=new Set(extractCandidates(result.blocks,result).map(recordKey));
  cache.set(canonical,result);return result;
}
try {
  for(const entry of deadlines.programs) {
    const program=catalogue.programs.find(p=>p.id===entry.programId&&p.sourceUrl===entry.programUrl);
    const result={programId:entry.programId,programUrl:entry.programUrl,checks:{}};
    report.programs.push(result);
    if(!entry.candidates.length)continue;
    console.log(`Rechecking ${entry.title}`);
    let main,scopeError;
    try{main=await fresh(entry.programUrl);}catch(error){scopeError=error.message;}
    for(const record of entry.candidates) {
      const check={checkedAt:new Date().toISOString(),evidenceMatched:false,scopeMatched:false};
      result.checks[recordKey(record)]=check;
      try {
        if(scopeError)throw Error(scopeError);
        const linked=canonicalUrl(record.sourceUrl)===canonicalUrl(entry.programUrl)||main.links.some(link=>canonicalUrl(link.href)===canonicalUrl(record.sourceUrl));
        const source=await fresh(record.sourceUrl);
        check.scopeMatched=Boolean(program&&domain(record.sourceUrl)===domain(entry.programUrl)&&programSourceScope(entry.programUrl,record.sourceUrl,program.title,main.headings,source.headings,linked));
        check.evidenceMatched=source.keys.has(recordKey(record));
        check.checkedAt=source.checkedAt;
      }catch(error){check.error=error.message;}
    }
  }
}finally{await browser.close();}
report.finishedAt=new Date().toISOString();
await mkdir(path.join(root,'data/verification-runs'),{recursive:true});
const json=JSON.stringify(report,null,2);
await writeFile(path.join(root,`data/verification-runs/${report.startedAt.replace(/[:.]/gu,'-')}.json`),json);
const temporary=path.join(root,'data/verification.json.tmp');
await writeFile(temporary,json);await rename(temporary,path.join(root,'data/verification.json'));
console.log('Source checks saved. Reload the dashboard and choose an exact published intake.');
