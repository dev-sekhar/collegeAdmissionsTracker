import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createCountryCollector} from '../scripts/collect-country.mjs';
import {extractUniversityPage,sameInstitution,officialAddress} from '../scripts/country-collection-model.mjs';
import {publicAddress} from '../scripts/official-html.mjs';
import {readCatalogue} from '../scripts/build-catalogue.mjs';
import {createAdmissionsServer} from '../scripts/serve-static.mjs';
import {configureWriter,readWriterCredentials} from '../scripts/writer-auth.mjs';
async function workspace(t){const root=await mkdtemp(path.join(tmpdir(),'admissions-country-test-'));await cp(new URL('../data',import.meta.url),path.join(root,'data'),{recursive:true});t.after(async()=>{assert.ok(path.resolve(root).startsWith(path.join(path.resolve(tmpdir()),'admissions-country-test-')));await rm(root,{recursive:true,force:true});});return root;}
const html='<html><title>University of Copenhagen</title><body>University of Copenhagen <a href="/admissions/undergraduate">Undergraduate admissions</a><a href="https://other.example/admissions">External admissions</a></body></html>';
const page=async url=>({url,html});
test('fresh official HTML persists university-only YAML, updates JSON and retains previous records on later failure',async t=>{
  const root=await workspace(t);const original=await readFile(path.join(root,'data/admissions/nl-uva/nl-uva-economics/2027.yaml'),'utf8');let blocked=false;let day='2026-11-23';const requested=[];
  const collector=createCountryCollector(root,{fetchPage:async url=>{requested.push(url);if(blocked)throw Error('Access check encountered');return page(url);},clock:()=>new Date(day+'T12:00:00Z')});
  const result=await collector.collect('Denmark','test-writer');assert.equal(result.collection.freshCount,1);assert.equal(result.collection.universities.length,1);assert.equal(result.collection.universities[0].admissionLinks.length,1);assert.match(requested[0],/^https:\/\/www\.ku\.dk\//u);assert.match(await readFile(path.join(root,result.relativeFile),'utf8'),/programmesStatus: not-extracted/);
  const catalogue=await readCatalogue({rootDir:root});assert.equal(catalogue.countryCollections.find(c=>c.country==='Denmark').universities.length,1);assert.equal(catalogue.programs.length,48);assert.equal(await readFile(path.join(root,'data/generated/catalogue.json'),'utf8'),await readFile(path.join(root,'dist/data/generated/catalogue.json'),'utf8'));
  blocked=true;day='2026-11-24';const retry=await collector.collect('Denmark','test-writer');assert.equal(retry.collection.freshCount,0);assert.equal(retry.collection.failures.length,1);assert.equal(retry.collection.universities[0].checkedAt,'2026-11-23T12:00:00.000Z');assert.equal(await readFile(path.join(root,'data/admissions/nl-uva/nl-uva-economics/2027.yaml'),'utf8'),original);
  await assert.rejects(()=>collector.collect('../private','test-writer'),/not configured/);
});
test('blocked, unrelated, redirected and unsafe sources cannot be presented as fresh university data',()=>{
  const seed={name:'University of Copenhagen',country:'Denmark',city:'Copenhagen',url:'https://www.ku.dk/'};
  assert.throws(()=>extractUniversityPage('<title>Just a moment</title>',seed.url,seed,new Date()),/blocked/);assert.throws(()=>extractUniversityPage('<title>Unrelated page</title><body>nothing here</body>',seed.url,seed,new Date()),/identity/);
  assert.equal(sameInstitution('https://ku.dk/english/',seed.url),true);assert.equal(sameInstitution('https://ku.dk.evil.example/',seed.url),false);assert.throws(()=>officialAddress('https://127.0.0.1/'));
  for(const ip of ['127.0.0.1','10.1.1.1','172.16.0.1','192.168.1.1','169.254.169.254','::1','fd00::1','::ffff:127.0.0.1'])assert.equal(publicAddress(ip),false,ip);
});
test('country collection requires writer authentication, correct origin and CSRF, and accepts no submitted URL',async t=>{
  const root=await workspace(t);await configureWriter(root,'writer','TestOnlyLongPassword');const credentials=await readWriterCredentials(root);let requests=0;
  const server=createAdmissionsServer({rootDir:root,credentialsProvider:async()=>credentials,collectionOptions:{fetchPage:async url=>{requests++;return page(url);}}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));const base=`http://127.0.0.1:${server.address().port}`;
  const post=(route,value,headers={})=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...headers},body:JSON.stringify(value)});
  assert.equal((await post('/writer/collect-country',{country:'Denmark'})).status,401);assert.equal(requests,0);
  const login=await post('/writer/login',{username:'writer',password:'TestOnlyLongPassword'});const cookie=login.headers.get('set-cookie').split(';')[0];const {csrf}=await login.json();const headers={Cookie:cookie,'X-Writer-CSRF':csrf};
  assert.equal((await post('/writer/collect-country',{country:'Denmark'},{Cookie:cookie})).status,403);assert.equal((await post('/writer/collect-country',{country:'Denmark',url:'https://127.0.0.1/'},headers)).status,400);assert.equal(requests,0);
  const response=await post('/writer/collect-country',{country:'Denmark'},headers);assert.equal(response.status,200);assert.equal((await response.json()).collection.freshCount,1);assert.equal(requests,1);assert.equal((await fetch(base+'/data/country-universities/denmark.yaml')).status,404);
});

test('US collection visits every configured US target and no other country sites',async t=>{
  const root=await workspace(t);const {parse}=await import('yaml');const configuration=parse(await readFile(path.join(root,'data/official-university-sites.yaml'),'utf8'));const targets=configuration.sites.filter(site=>site.country==='United States');const previousDenmark=await readFile(path.join(root,'data/country-universities/denmark.yaml'),'utf8');const requested=[];
  const collector=createCountryCollector(root,{fetchPage:async url=>{requested.push(url);const seed=targets.find(site=>site.url===url);assert.ok(seed,'Only a US official source is requested');return {url,html:`<title>${seed.name}</title><body>${seed.name}</body>`};}});
  const result=await collector.collect('United States','test-writer');assert.equal(result.collection.attempted,26);assert.equal(result.collection.freshCount,26);assert.equal(result.collection.failures.length,0);assert.deepEqual(new Set(requested),new Set(targets.map(site=>site.url)));assert.ok(result.collection.universities.every(university=>university.country==='United States'));assert.equal(await readFile(path.join(root,'data/country-universities/denmark.yaml'),'utf8'),previousDenmark);
});
