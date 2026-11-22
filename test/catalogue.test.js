import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {compileCatalogue,stageTypes,validDate,catalogueRows,filterRows,annualIntakeRows,projectIntakeWording,deadlineLabel,countryName,rankingLabel} from '../src/catalogue-model.js';
import {buildCatalogue,parseYaml} from '../scripts/build-catalogue.mjs';
function fixture(){
  const university={id:'dummy-uni',name:'Fictional University',country:'Singapore',city:'Singapore',programs:[{id:'dummy-cs',name:'Fictional BSc CS',degree:'Bachelor’s',subjects:['Computer Science']}]};
  const admission={programId:'dummy-cs',cycle:2027,intake:{month:8,year:2027},sources:[{id:'sample-source',url:'https://example.org/notice',passage:'Fictional evidence',checkedAt:null}],routes:[{id:'general-route',label:'Dummy route',stages:stageTypes.map(([type])=>({type,status:'dummy',deadline:{kind:'date',date:'2027-01-15'},wording:'Fictional deadline',sourceIds:['sample-source']}))}]};
  return {university,admission};
}

test('teaching-language metadata rejects empty, malformed and duplicate values',()=>{
  const {university,admission}=fixture();const program=university.programs[0];
  for(const value of [[],[''],['English','english'],'Dutch']){program.teachingLanguages=value;assert.throws(()=>compileCatalogue([university],[admission]));}
  program.teachingLanguages=['Dutch'];assert.deepEqual(compileCatalogue([university],[admission]).programs[0].teachingLanguages,['Dutch']);
});

test('annual intake filtering prioritises exact records, references only earlier real calendars and preserves dates',()=>{
  const make=(programId,year,month,dataType='real')=>({programId,key:`${programId}:${year}:${month}`,admission:{dataType,intake:{year,month},routes:[{stages:[{status:'verified',deadline:{kind:'date',date:'2026-12-01'}}]}]}});
  const rows=[make('first',2027,1),make('first',2027,8),make('first',2028,1),make('second',2027,null),make('fake',2027,1,'dummy')];const now=new Date('2026-11-20T00:00:00Z');const before=JSON.stringify(rows);
  const selected=annualIntakeRows(rows,2028,{now});assert.equal(selected.filter(r=>r.programId==='first').length,1);assert.equal(selected.find(r=>r.programId==='first').intakeReference,undefined);
  assert.deepEqual(selected.find(r=>r.programId==='second').intakeReference,{requestedYear:2028,sourceYear:2027});assert.ok(!selected.some(r=>r.programId==='fake'));
  assert.equal(annualIntakeRows(rows,2027,{now}).filter(r=>r.programId==='first').length,2);assert.equal(annualIntakeRows(rows,2025,{now}).length,0);assert.equal(annualIntakeRows(rows,2026,{now:new Date('2027-01-01T00:00:00Z')}).length,0);assert.equal(JSON.stringify(rows),before);
  const far=annualIntakeRows(rows,2030,{now});assert.equal(far.find(r=>r.programId==='first').intakeReference.sourceYear,2028);assert.equal(far.find(r=>r.programId==='first').admission.routes[0].stages[0].deadline.date,'2028-12-01');assert.equal(far.find(r=>r.programId==='first').sourceAdmission.routes[0].stages[0].deadline.date,'2026-12-01');assert.equal(far.find(r=>r.programId==='first').admission.routes[0].stages[0].status,'tentative');
});

test('future-year projections move opening dates into the preceding year and clamp leap days',()=>{
  const source={programId:'sample',key:'sample',admission:{dataType:'real',intake:{year:2027,month:9},routes:[{id:'general',stages:[{type:'opening',status:'verified',deadline:{kind:'date',date:'2026-10-01'}},{type:'application',status:'verified',deadline:{kind:'window',start:'2027-01-01',end:'2027-04-01'}},{type:'tests',status:'verified',deadline:{kind:'relative',rule:'Attend 2 March 2027'}},{type:'acceptance',status:'verified',deadline:{kind:'relative',rule:'Within two weeks of offer'}}]}]}};
  const projected=annualIntakeRows([source],2028,{now:new Date('2026-11-20T00:00:00Z')})[0];const stages=projected.admission.routes[0].stages;
  assert.equal(stages[0].deadline.date,'2027-10-01');assert.deepEqual(stages[1].deadline,{kind:'window',start:'2028-01-01',end:'2028-04-01'});assert.equal(stages[2].deadline,null);assert.equal(stages[2].status,'not-verified');assert.equal(stages[3].deadline.rule,'Within two weeks of offer');assert.equal(projected.admission.intake.year,2028);
  const leap=structuredClone(source);leap.admission.intake.year=2028;leap.admission.routes[0].stages[0].deadline.date='2028-02-29';assert.equal(annualIntakeRows([leap],2029,{now:new Date('2026-11-20T00:00:00Z')})[0].admission.routes[0].stages[0].deadline.date,'2029-02-28');
});

test('projected descriptions and category labels follow the intake year across every programme without altering evidence',async()=>{
  const catalogue=await buildCatalogue({check:true});const rows=catalogueRows(catalogue);const before=JSON.stringify(catalogue);const projected=annualIntakeRows(rows,2028,{now:new Date('2026-11-22T00:00:00Z')});assert.ok(projected.length);
  for(const row of projected){if(!row.intakeReference)continue;for(const route of row.admission.routes){const original=row.sourceAdmission.routes.find(r=>r.id===route.id);assert.equal(route.label,projectIntakeWording(original.label,2027,2028));for(const stage of route.stages){if(!stage.deadline){assert.match(stage.wording,/2028 intake/);continue;}assert.ok(stage.wording.startsWith('Tentative 2028 intake guidance: '));assert.equal(stage.wording,'Tentative 2028 intake guidance: '+projectIntakeWording(original.stages.find(s=>s.type===stage.type).wording,2027,2028));}}}
  const uva=projected.find(row=>row.programId==='nl-uva-economics');assert.match(uva.admission.routes[0].stages.find(s=>s.type==='application').wording,/15 January 2028 for September 2028/);assert.match(uva.sourceAdmission.routes[0].stages.find(s=>s.type==='application').wording,/15 January 2027/);
  assert.equal(projectIntakeWording('Opens October 2026 for AY2027/28; deadline 2027-01-15.',2027,2028),'Opens October 2027 for AY2028/29; deadline 2028-01-15.');assert.equal(projectIntakeWording('2028-02-29',2028,2029),'2029-02-28');assert.equal(JSON.stringify(catalogue),before);
});
test('repository YAML produces deterministic real JSON',async()=>{
  const result=await buildCatalogue({check:true});assert.equal(result.mode,'real');assert.equal(result.universities.length,16);assert.equal(result.programs.length,48);assert.equal(result.admissions.length,54);
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
  const rows=catalogueRows(compileCatalogue([fixture().university],[fixture().admission]));const filters={countries:['Singapore'],subjects:['Computer Science'],degree:'Bachelor’s',intake:'2027-08'};
  assert.deepEqual(filterRows(rows,filters).map(row=>row.programId),['dummy-cs']);
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
  const catalogue=await buildCatalogue({check:true});const real=catalogue.admissions.filter(item=>catalogue.programs.find(p=>p.id===item.programId)?.universityId.startsWith('sg-'));
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
  assert.equal(universities.length,16);
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
