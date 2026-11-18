import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileCatalogue,stageTypes,validDate,catalogueRows,filterRows,deadlineLabel,countryName,rankingLabel} from '../src/catalogue-model.js';
import {buildCatalogue,parseYaml} from '../scripts/build-catalogue.mjs';
function fixture(){
  const university={id:'dummy-uni',name:'Fictional University',country:'Singapore',city:'Singapore',programs:[{id:'dummy-cs',name:'Fictional BSc CS',degree:'Bachelor’s',subjects:['Computer Science']}]};
  const admission={programId:'dummy-cs',cycle:2027,intake:{month:8,year:2027},sources:[{id:'sample-source',url:'https://example.org/notice',passage:'Fictional evidence',checkedAt:null}],routes:[{id:'general-route',label:'Dummy route',stages:stageTypes.map(([type])=>({type,status:'dummy',deadline:{kind:'date',date:'2027-01-15'},wording:'Fictional deadline',sourceIds:['sample-source']}))}]};
  return {university,admission};
}
test('repository YAML produces deterministic mixed JSON',async()=>{
  const result=await buildCatalogue({check:true});assert.equal(result.mode,'mixed');assert.equal(result.universities.length,14);assert.equal(result.programs.length,39);assert.equal(result.admissions.length,45);
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
  const rows=catalogueRows(await buildCatalogue({check:true})).filter(row=>row.admission.dataType!=='real');const filters={countries:['Singapore'],subjects:['Computer Science'],degree:'Bachelor’s',intake:'2027-08'};
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

test('Singapore real records have checked official evidence and never use illustrative dates',async()=>{
  const catalogue=await buildCatalogue({check:true});const real=catalogue.admissions.filter(item=>item.dataType==='real');
  assert.equal(real.length,37);assert.equal(new Set(real.map(item=>item.programId)).size,31);
  for(const item of real){
    assert.ok(item.sources.length);assert.ok(item.sources.every(source=>['2026-11-17','2026-11-18'].includes(source.checkedAt)));
    assert.equal(item.dateReview.checkedAt,'2026-11-18');assert.ok(item.dateReview.sourceIds.length);
    for(const route of item.routes)for(const stage of route.stages){
      assert.notEqual(stage.status,'dummy');
      if(stage.status==='verified'){assert.ok(stage.deadline);assert.ok(stage.sourceIds.length);}
      if(stage.status==='not-verified')assert.equal(stage.deadline,null);
    }
  }
});

test('real verification rejects missing evidence, unchecked sources and unofficial domains',()=>{
  const {university,admission}=fixture();admission.dataType='real';
  admission.sources[0]={id:'sample-source',url:'https://nus.edu.sg/oam/admissions/important-dates',passage:'Published admissions dates',checkedAt:'2026-11-17'};
  admission.routes[0].stages.forEach(stage=>stage.status='verified');
  assert.equal(compileCatalogue([university],[admission]).mode,'real');
  admission.routes[0].stages[0].sourceIds=[];
  assert.throws(()=>compileCatalogue([university],[admission]),/checked official evidence/);
  admission.routes[0].stages[0].sourceIds=['sample-source'];admission.sources[0].checkedAt=null;
  assert.throws(()=>compileCatalogue([university],[admission]),/valid check date/);
  admission.sources[0].checkedAt='2026-11-17';admission.sources[0].url='https://nus.edu.sg.evil.example/admissions';
  assert.throws(()=>compileCatalogue([university],[admission]),/official institution/);
});

test('route deadlines, multiple intakes and source conflicts are preserved',async()=>{
  const catalogue=await buildCatalogue({check:true});const get=id=>catalogue.admissions.filter(item=>item.programId===id);
  const stage=(route,type)=>route.stages.find(stage=>stage.type===type);
  const ntu=get('ntu-economics')[0];
  assert.equal(stage(ntu.routes.find(route=>route.id==='india-standard-12'),'application').deadline.date,'2027-03-19');
  assert.equal(stage(ntu.routes.find(route=>route.id==='selected-other-qualifications'),'application').deadline.date,'2027-01-20');
  const buffalo=get('sim-buffalo-economics');assert.deepEqual(buffalo.map(item=>item.intake.month),[1,5,8]);
  const august=buffalo.find(item=>item.intake.month===8);
  assert.equal(stage(august.routes[0],'application').deadline.date,'2027-06-28');
  assert.equal(stage(august.routes[1],'application').deadline.date,'2027-07-12');
  assert.equal(stage(august.routes[0],'enrolment').deadline,null);
  const nus=get('nus-economics')[0];assert.equal(stage(nus.routes[0],'application').status,'needs-review');
  const kaplan=get('kaplan-criminal-behaviour')[0];assert.equal(kaplan.intake.month,null);
  assert.ok(kaplan.routes[0].stages.every(stage=>stage.status==='not-verified'&&stage.deadline===null));
  const rows=catalogueRows(catalogue);assert.equal(new Set(rows.map(row=>row.key)).size,rows.length);
  assert.equal(filterRows(rows,{countries:['Singapore'],subjects:['Criminology'],degree:'Bachelor’s',intake:'2027-08'}).some(row=>row.programId==='kaplan-criminal-behaviour'),false);
});

test('QS ranks retain edition, ties and awarding-university attribution without substituting missing ranks',async()=>{
  const catalogue=await buildCatalogue({check:true});const universities=catalogue.universities.filter(item=>item.qsRanking);
  assert.equal(universities.length,8);
  const smu=universities.find(item=>item.id==='sg-smu').qsRanking;
  assert.equal(rankingLabel(smu),'QS World 2027 · #=411');
  assert.equal(universities.find(item=>item.id==='sg-sim-rmit').qsRanking.rank,'=119');
  assert.match(universities.find(item=>item.id==='sg-sim-buffalo').qsRanking.institution,/awarding university/);
  for(const id of ['sg-suss','sg-sim-uol']){
    const ranking=universities.find(item=>item.id===id).qsRanking;
    assert.equal(ranking.rank,null);assert.equal(ranking.status,'not-verified');assert.match(rankingLabel(ranking),/Rank not verified/);
  }
  const {university,admission}=fixture();university.qsRanking={...smu,rank:null};
  assert.throws(()=>compileCatalogue([university],[admission]),/verified rank/);
  university.qsRanking={...smu,status:'not-verified'};
  assert.throws(()=>compileCatalogue([university],[admission]),/must be null/);
  university.qsRanking={...smu,url:'https://rankings.example.com'};
  assert.throws(()=>compileCatalogue([university],[admission]),/official QS/);
});
