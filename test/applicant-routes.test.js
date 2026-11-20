import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {compileCatalogue,catalogueRows,filterRows} from '../src/catalogue-model.js';
import {emptyApplicant,matchApplicantRoute} from '../src/applicant-routes.js';
const applicant={board:'cbse',stateBoard:'',citizenship:'India',singaporePr:'no',results:'pending'};
const catalogue=await buildCatalogue({check:true});const rows=catalogueRows(catalogue);
const get=id=>rows.find(row=>row.programId===id);

test('missing applicant facts never select the first available route',()=>{
  const ntu=get('ntu-economics');assert.equal(ntu.admission.routes[0].id,'india-standard-12');
  assert.equal(matchApplicantRoute(ntu,emptyApplicant()).status,'undetermined');
  for(const key of ['board','citizenship','singaporePr','results']){
    const result=matchApplicantRoute(ntu,{...applicant,[key]:''});assert.equal(result.route,null);
  }
});
test('CBSE and ISC match NTU by qualification and preserve PR form guidance',()=>{
  for(const board of ['cbse','isc'])for(const singaporePr of ['yes','no']){
    const result=matchApplicantRoute(get('ntu-economics'),{...applicant,board,singaporePr});
    assert.equal(result.status,'matched');assert.equal(result.route.id,'india-standard-12');
    assert.equal(result.route.stages.find(s=>s.type==='application').deadline.date,'2027-03-19');
    assert.match(result.reason,/citizen\/PR application form/);
  }
});
test('available and pending results receive different instructions without mutating catalogue dates',()=>{
  const row=get('ntu-economics');const original=JSON.stringify(row);
  const pending=matchApplicantRoute(row,applicant);assert.match(pending.instruction,/within 3 days/);
  const available=matchApplicantRoute(row,{...applicant,results:'available'});
  assert.match(available.route.stages.find(s=>s.type==='documents').deadline.rule,/available.*final marksheet/);
  const sourceIds=available.route.stages.find(s=>s.type==='documents').sourceIds;
  assert.ok(sourceIds.every(id=>available.sources.some(source=>source.id===id)));
  assert.equal(JSON.stringify(row),original);
});
test('matching recomputes across universities, honours review flags and never reuses an old route',()=>{
  assert.equal(matchApplicantRoute(get('ntu-economics'),applicant).status,'matched');
  assert.equal(matchApplicantRoute(get('smu-economics'),applicant).route.id,'international-other');
  assert.equal(matchApplicantRoute(get('nus-economics'),applicant).status,'needs-review');
  assert.equal(matchApplicantRoute(get('nus-economics'),applicant).route,null);
  assert.equal(matchApplicantRoute(get('smu-economics'),{...applicant,singaporePr:'yes'}).status,'needs-review');
  assert.equal(matchApplicantRoute(get('suss-public-safety'),applicant).status,'undetermined');
  assert.equal(matchApplicantRoute(get('kaplan-criminal-behaviour'),applicant).route,null);
});
test('unsupported boards, other citizenships, postgraduate and fictional records never inherit a route',()=>{
  for(const change of [{board:'ib'},{citizenship:'Singapore'},{citizenship:'Other'},{board:'state-other',stateBoard:'Maharashtra HSC'},{board:'state-other',stateBoard:''}]){
    assert.equal(matchApplicantRoute(get('ntu-economics'),{...applicant,...change}).route,null);
  }
  assert.equal(matchApplicantRoute({...get('ntu-economics'),degree:'Master’s'},applicant).route,null);
  assert.equal(matchApplicantRoute({...get('ntu-economics'),admission:{...get('ntu-economics').admission,dataType:'dummy'}},applicant).route,null);
});
test('ambiguous overlapping rules are blocked rather than resolved by array order',()=>{
  const row=structuredClone(get('ntu-economics'));row.applicantPolicy.rules.push({...row.applicantPolicy.rules[0],id:'overlapping-rule'});
  const result=matchApplicantRoute(row,applicant);assert.equal(result.status,'ambiguous');assert.equal(result.route,null);
});
test('named state boards require an exact independently configured rule, never a generic wildcard',()=>{
  const row=structuredClone(get('ntu-economics'));
  const profile={...applicant,board:'state-other',stateBoard:'Example State XII'};
  assert.equal(matchApplicantRoute(row,profile).route,null);
  // Synthetic policy tests future named-board support; not a real admissions assertion.
  row.applicantPolicy.rules.push({...row.applicantPolicy.rules[0],id:'synthetic-state-board',boards:['state:example-state-xii']});
  assert.equal(matchApplicantRoute(row,profile).status,'matched');
  assert.equal(matchApplicantRoute(row,{...profile,stateBoard:'Another State XII'}).route,null);
});
test('all configured programme rules have scoped matching routes and no fabricated board wildcard',()=>{
  assert.equal(catalogue.applicantPolicies.length,4);
  for(const policy of catalogue.applicantPolicies)for(const rule of policy.rules){
    for(const board of rule.boards)assert.ok(['cbse','isc','ib','a-level','indian-state-boards'].includes(board));
    for(const id of rule.programIds){const row=get(id);assert.equal(row.universityId,policy.universityId);assert.ok(row.admission.routes.some(route=>route.id===rule.routeId));}
  }
  const options=filterRows(rows,{countries:['Singapore'],subjects:['Economics'],degree:'Bachelor’s',intake:'2027-08'});
  assert.ok(options.some(row=>matchApplicantRoute(row,applicant).status==='matched'));
});

test('state-board groups require published policy and support all named Indian states',()=>{
  for(const stateBoard of ['Karnataka','Maharashtra','Tamil Nadu','Gujarat','Another Indian state board']){
    const profile={...applicant,board:'state-other',stateBoard};
    assert.equal(matchApplicantRoute(get('smu-economics'),profile).status,'matched');
    assert.equal(matchApplicantRoute(get('sim-buffalo-economics'),{...profile,results:'available'}).route.id,'international');
    assert.equal(matchApplicantRoute(get('ntu-economics'),profile).route,null);
  }
});

test('ICSE/IGCSE alone do not become Class XII routes; follow-on qualification is matched',()=>{
  for(const board of ['icse','igcse']){
    assert.equal(matchApplicantRoute(get('ntu-economics'),{...applicant,board}).route,null);
    assert.equal(matchApplicantRoute(get('ntu-economics'),{...applicant,board,finalQualification:'isc'}).route.id,'india-standard-12');
  }
  assert.equal(matchApplicantRoute(get('ntu-economics'),{...applicant,board:'ib'}).route,null);
  const ib=matchApplicantRoute(get('sim-buffalo-economics'),{...applicant,board:'ib',results:'available'});
  assert.equal(ib.route.id,'international');assert.match(ib.instruction,/IB Diploma/);assert.doesNotMatch(ib.instruction,/state or national/);
});
test('rule validation rejects foreign programme references and missing rule evidence',()=>{
  const university={id:'test-uni',name:'Test University',country:'Singapore',city:'Singapore',programs:[{id:'test-program',name:'Test Economics',degree:'Bachelor’s',subjects:['Economics']}]};
  const existing=get('ntu-economics');const admission={...existing.admission,programId:'test-program'};
  const policy=structuredClone(existing.applicantPolicy);policy.universityId='test-uni';policy.rules[0].programIds=['test-program'];
  assert.equal(compileCatalogue([university],[admission],[policy]).applicantPolicies.length,1);
  policy.rules[0].sourceIds=[];assert.throws(()=>compileCatalogue([university],[admission],[policy]),/sourceIds/);
  policy.rules[0].sourceIds=['india-qualification'];policy.rules[0].programIds=['smu-economics'];
  assert.throws(()=>compileCatalogue([university],[admission],[policy]),/programme scope/);
});
