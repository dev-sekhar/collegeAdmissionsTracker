import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
const catalogue=await buildCatalogue({check:true});
const nl=catalogue.programs.filter(p=>p.universityId.startsWith('nl-'));
const admissions=nl.map(p=>catalogue.admissions.find(a=>a.programId===p.id));
test('active YAML has only real records with reviewed Netherlands provenance',async()=>{
  assert.equal(catalogue.mode,'real');assert.equal(nl.length,17);assert.equal(admissions.length,17);
  assert.ok(catalogue.admissions.every(a=>a.dataType==='real'));
  for(const a of admissions){assert.equal(a.dateReview.checkedAt,'2026-11-20');assert.ok(a.sources.every(s=>s.checkedAt==='2026-11-20'&&!s.url.includes('example.')));}
  async function check(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await check(path);else if(/\.ya?ml$/u.test(e.name))assert.doesNotMatch(await readFile(path,'utf8'),/example\.(org|com|net)|\bdummy\b|Fictional/iu,path);}}
  await check(fileURLToPath(new URL('../data/',import.meta.url)));
});
test('2027 evidence boundaries prevent annual-pattern and early-essay dates becoming final deadlines',()=>{
  const get=id=>admissions.find(a=>a.programId===id);const application=(a,i=0)=>a.routes[i].stages.find(s=>s.type==='application');
  for(const id of ['nl-tilburg-economics','nl-tilburg-econometrics','nl-utrecht-economics','nl-vu-economics','nl-vu-econometrics']){assert.equal(application(get(id)).deadline,null);assert.equal(get(id).intake.month,null);}
  assert.equal(application(get('nl-maastricht-economics')).deadline.date,'2027-03-15');
  assert.equal(application(get('nl-maastricht-econometrics')).deadline.date,'2027-04-01');
  assert.equal(application(get('nl-maastricht-econometrics'),1).deadline.date,'2027-05-01');
  assert.equal(application(get('nl-groningen-economics')).deadline.date,'2027-05-01');
});
