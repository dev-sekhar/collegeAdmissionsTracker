import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileCatalogue,stageTypes,validDate,catalogueRows,filterRows,deadlineLabel,countryName} from '../src/catalogue-model.js';
import {buildCatalogue,parseYaml} from '../scripts/build-catalogue.mjs';
function fixture(){
  const university={id:'dummy-uni',name:'Fictional University',country:'Singapore',city:'Singapore',programs:[{id:'dummy-cs',name:'Fictional BSc CS',degree:'Bachelor’s',subjects:['Computer Science']}]};
  const admission={programId:'dummy-cs',cycle:2027,intake:{month:8,year:2027},sources:[{id:'sample-source',url:'https://example.org/notice',passage:'Fictional evidence',checkedAt:null}],routes:[{id:'general-route',label:'Dummy route',stages:stageTypes.map(([type])=>({type,status:'dummy',deadline:{kind:'date',date:'2027-01-15'},wording:'Fictional deadline',sourceIds:['sample-source']}))}]};
  return {university,admission};
}
test('real repository YAML produces deterministic JSON with only dummy content',async()=>{
  const result=await buildCatalogue({check:true});assert.equal(result.mode,'dummy');assert.equal(result.universities.length,6);assert.equal(result.programs.length,8);assert.equal(result.admissions.length,8);
  assert.equal(JSON.stringify(result,null,2)+'\n',await readFile(new URL('../data/generated/catalogue.json',import.meta.url),'utf8'));
});
test('YAML parsing rejects duplicate keys, invalid syntax, aliases and excessive input',()=>{
  assert.throws(()=>parseYaml('id: first\nid: second'),/unique/iu);
  assert.throws(()=>parseYaml('broken: [unterminated'),/flow|end/iu);
  assert.throws(()=>parseYaml('one: &one {value: test}\ntwo: *one'),/alias/iu);
  assert.throws(()=>parseYaml('x'.repeat(200001)),/200 KB/);
});
test('duplicate university/program/cycle IDs and dangling program/source references fail',()=>{
  const {university,admission}=fixture();
  assert.throws(()=>compileCatalogue([university,university],[admission]),/duplicate/);
  assert.throws(()=>compileCatalogue([university],[admission,admission]),/duplicate/);
  assert.throws(()=>compileCatalogue([university],[{...admission,programId:'unknown-id'}]),/unknown programId/);
  admission.routes[0].stages[0].sourceIds=['unknown-source'];assert.throws(()=>compileCatalogue([university],[admission]),/unknown source/);
});
test('dummy evidence cannot masquerade as verified or as a real official-source check',()=>{
  const {university,admission}=fixture();admission.routes[0].stages[0].status='verified';assert.throws(()=>compileCatalogue([university],[admission]),/cannot be verified/);
  admission.routes[0].stages[0].status='dummy';admission.sources[0].checkedAt='2026-11-17';assert.throws(()=>compileCatalogue([university],[admission]),/real check date/);
  admission.sources[0].checkedAt=null;admission.sources[0].url='https://real-university.edu/admissions';assert.throws(()=>compileCatalogue([university],[admission]),/reserved example/);
});
test('all eight stages must be explicit and dates cannot coexist with missing-data statuses',()=>{
  const {university,admission}=fixture();admission.routes[0].stages.pop();assert.throws(()=>compileCatalogue([university],[admission]),/eight stages/);
  const clean=fixture();clean.admission.routes[0].stages[0].status='not-researched';assert.throws(()=>compileCatalogue([clean.university],[clean.admission]),/null deadline/);
});
test('calendar validation rejects rollover dates and reversed windows',()=>{
  assert.equal(validDate('2027-02-29'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(validDate('2027-13-01'),false);
  const {university,admission}=fixture();admission.routes[0].stages[0].deadline={kind:'window',start:'2027-02-02',end:'2027-01-01'};assert.throws(()=>compileCatalogue([university],[admission]),/reversed/);
});
test('unknown fields catch authoring typos and programs cannot silently lack cycles',()=>{
  const {university,admission}=fixture();assert.throws(()=>compileCatalogue([{...university,countyr:'Singapore'}],[admission]),/unknown field countyr/);
  assert.throws(()=>compileCatalogue([university],[]),/Every program needs/);
  admission.routes[0].stages[0].deadline={kind:'date',dtae:'2027-01-15'};assert.throws(()=>compileCatalogue([university],[admission]),/unknown field dtae/);
});
test('filters combine country, subject, degree and exact intake without inventing programs',async()=>{
  const rows=catalogueRows(await buildCatalogue({check:true}));const filters={countries:['Singapore'],subjects:['Computer Science'],degree:'Bachelor’s',intake:'2027-08'};
  assert.deepEqual(filterRows(rows,filters).map(row=>row.programId),['harbour-cs']);
  assert.equal(filterRows(rows,{...filters,countries:['Japan']}).length,0);
  assert.equal(filterRows(rows,{...filters,subjects:['Economics']}).length,0);
  assert.equal(filterRows(rows,{...filters,intake:'2027-09'}).length,0);
  assert.equal(filterRows(rows,{...filters,countries:[]}).length,1);
  assert.equal(countryName('Holland'),'Netherlands');
});
test('relative rules stay relative and date display stays independent of machine timezone',()=>{
  assert.equal(deadlineLabel({kind:'relative',rule:'Within 14 days of offer'}),'Within 14 days of offer');assert.equal(deadlineLabel(null),'Date unavailable');assert.equal(deadlineLabel({kind:'date',date:'2027-01-15'}),'15 Jan 2027');
});
