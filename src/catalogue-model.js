export const stageTypes = [
  ['opening','Applications open'],['application','Submit application'],['documents','Supporting documents'],
  ['tests','Tests / scores'],['interview','Interview'],['acceptance','Accept offer'],['deposit','Pay deposit'],['enrolment','Enrolment'],
];
export const optionalStageTypes = [['decision','Admission decision'],['appeal','Appeal']];
export const statusLabels = {'dummy':'Illustrative date','not-researched':'Not researched','not-verified':'Not verified','not-yet-published':'Not yet published','source-unavailable':'Source unavailable','needs-review':'Needs review','verified':'Verified against source','manual-unverified':'Manual entry — unverified'};
export const countryName=value=>/^(holland|the netherlands|netherlands)$/iu.test(value.trim())?'Netherlands':value.trim().replace(/\s+/gu,' ');
export function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/u.test(value))return false;
  const [y,m,d]=value.split('-').map(Number);const date=new Date(`${value}T12:00:00Z`);
  return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d;
}
function requireThat(condition,message){if(!condition)throw Error(message);}
function keys(value,allowed,where){requireThat(value&&typeof value==='object'&&!Array.isArray(value),`${where}: expected a mapping`);for(const key of Object.keys(value))requireThat(allowed.includes(key),`${where}: unknown field ${key}`);}
function text(value,where){requireThat(typeof value==='string'&&value.trim().length>0&&value.length<=1600,`${where}: expected non-empty text`);}
function id(value,where){requireThat(typeof value==='string'&&/^[a-z][a-z0-9-]{1,79}$/u.test(value),`${where}: use a lowercase slug ID`);}
function list(value,where){requireThat(Array.isArray(value)&&value.length>0,`${where}: expected a non-empty list`);}
function unique(values,where){requireThat(new Set(values).size===values.length,`${where}: duplicate ID or value`);}
function deadline(value,where){
  if(value===null)return;
  keys(value,['kind','date','start','end','rule'],where);
  if(value.kind==='date'){keys(value,['kind','date'],where);requireThat(validDate(value.date),`${where}: invalid date`);}
  else if(value.kind==='window'){keys(value,['kind','start','end'],where);requireThat(validDate(value.start)&&validDate(value.end)&&value.start<=value.end,`${where}: invalid or reversed date window`);}
  else if(value.kind==='relative'){keys(value,['kind','rule'],where);text(value.rule,`${where}.rule`);}
  else throw Error(`${where}: unsupported deadline kind`);
}
export function compileCatalogue(universityDocuments,admissionDocuments,applicantPolicies=[],admissionDetails=[]){
  const universities=[];const programs=[];const admissions=[];
  for(const [index,doc] of universityDocuments.entries()){
    const where=`university[${index}]`;keys(doc,['id','name','country','city','programs','qsRanking'],where);id(doc.id,where);text(doc.name,where);text(doc.country,where);text(doc.city,where);list(doc.programs,`${where}.programs`);
    if(doc.qsRanking)validateRanking(doc.qsRanking);
    universities.push({id:doc.id,name:doc.name,country:countryName(doc.country),city:doc.city,...(doc.qsRanking?{qsRanking:doc.qsRanking}:{})});
    for(const program of doc.programs){keys(program,['id','name','degree','subjects','url','notes'],`${where}.program`);id(program.id,'program');text(program.name,'program.name');requireThat(['Bachelor’s','Master’s','PhD'].includes(program.degree),'program.degree: unsupported level');list(program.subjects,'program.subjects');program.subjects.forEach(subject=>text(subject,'program.subject'));unique(program.subjects.map(s=>s.toLowerCase()),'program.subjects');if(program.url)officialUrl(program.url);if(program.notes)text(program.notes,'program.notes');programs.push({...program,universityId:doc.id});}
  }
  unique(universities.map(item=>item.id),'universities');unique(programs.map(item=>item.id),'programs');
  for(const [index,doc] of admissionDocuments.entries()){
    const where=`admissions[${index}]`;keys(doc,['programId','cycle','intake','routes','sources','dataType','dateReview'],where);const real=doc.dataType==='real';requireThat(doc.dataType===undefined||['dummy','real'].includes(doc.dataType),`${where}: invalid dataType`);id(doc.programId,`${where}.programId`);requireThat(programs.some(p=>p.id===doc.programId),`${where}: unknown programId ${doc.programId}`);
    requireThat(Number.isInteger(doc.cycle)&&doc.cycle>=2027&&doc.cycle<=2100,`${where}: invalid cycle`);
    keys(doc.intake,['month','year'],`${where}.intake`);requireThat(((real&&doc.intake.month===null)||(Number.isInteger(doc.intake.month)&&doc.intake.month>=1&&doc.intake.month<=12))&&Number.isInteger(doc.intake.year)&&doc.intake.year>=doc.cycle&&doc.intake.year<=doc.cycle+1,`${where}: invalid intake`);
    requireThat(Array.isArray(doc.sources),`${where}.sources: expected list`);
    unique(doc.sources.map(source=>source.id),`${where}.sources`);
    if(doc.dateReview){keys(doc.dateReview,['checkedAt','sourceIds','notes'],'dateReview');requireThat(validDate(doc.dateReview.checkedAt),'dateReview: invalid check date');text(doc.dateReview.notes,'dateReview.notes');list(doc.dateReview.sourceIds,'dateReview.sourceIds');requireThat(doc.dateReview.sourceIds.every(id=>doc.sources.some(source=>source.id===id)),'dateReview: unknown source');}
    for(const source of doc.sources){keys(source,['id','url','passage','checkedAt'],`${where}.source`);id(source.id,'source.id');text(source.passage,'source.passage');if(real){officialUrl(source.url);requireThat(validDate(source.checkedAt),`${where}: real evidence needs a valid check date`);}else{let url;try{url=new URL(source.url);}catch{throw Error(`${where}: invalid source URL`);}requireThat(url.protocol==='https:'&&/(^|\.)example\.(org|com|net)$/u.test(url.hostname),`${where}: dummy sources must use a reserved example domain`);requireThat(source.checkedAt===null,`${where}: dummy sources cannot claim a real check date`);}}
    list(doc.routes,`${where}.routes`);unique(doc.routes.map(route=>route.id),`${where}.routes`);
    for(const route of doc.routes){keys(route,['id','label','stages'],`${where}.route`);id(route.id,'route.id');text(route.label,'route.label');list(route.stages,'route.stages');unique(route.stages.map(stage=>stage.type),'route.stages');requireThat(stageTypes.every(([type])=>route.stages.some(stage=>stage.type===type))&&route.stages.every(stage=>[...stageTypes,...optionalStageTypes].some(([type])=>type===stage.type)),`${where}: include all eight stages, using an explicit missing-data status where needed`);
      for(const stage of route.stages){keys(stage,['type','status','deadline','wording','sourceIds','manualEntry'],`${where}.stage`);requireThat(Object.hasOwn(statusLabels,stage.status),`${where}: unknown stage status`);requireThat(real||stage.status!=='verified',`${where}: dummy data cannot be verified`);requireThat(!real||stage.status!=='dummy',`${where}: real data cannot contain dummy dates`);deadline(stage.deadline,`${where}.${stage.type}`);text(stage.wording,'stage.wording');requireThat(Array.isArray(stage.sourceIds),`${where}: sourceIds must be a list`);unique(stage.sourceIds,'stage.sourceIds');requireThat(stage.sourceIds.every(sourceId=>doc.sources.some(source=>source.id===sourceId)),`${where}: unknown source reference`);
        if(stage.status==='manual-unverified'){requireThat(real&&stage.sourceIds.length===0&&stage.manualEntry,'Manual entries must remain unverified without claimed official evidence');keys(stage.manualEntry,['enteredAt','enteredBy','note'],'manualEntry');requireThat(typeof stage.manualEntry.enteredAt==='string'&&Number.isFinite(Date.parse(stage.manualEntry.enteredAt)),'manualEntry: invalid timestamp');text(stage.manualEntry.enteredBy,'manualEntry.enteredBy');text(stage.manualEntry.note,'manualEntry.note');}else requireThat(stage.manualEntry===undefined,'Only manual-unverified stages may contain manualEntry');
        if(['not-researched','not-verified','not-yet-published','source-unavailable'].includes(stage.status))requireThat(stage.deadline===null,`${where}: missing-data status must have a null deadline`);
        if(stage.status==='verified')requireThat(stage.deadline!==null&&stage.sourceIds.length>0,`${where}: verified stages need a deadline and checked official evidence`);
        if(stage.status==='dummy')requireThat(stage.deadline!==null&&stage.sourceIds.length>0,`${where}: illustrative dates need a deadline and dummy evidence`);
      }
    }
    admissions.push({...doc,routes:doc.routes.map(route=>({...route,stages:[...stageTypes.slice(0,5),optionalStageTypes[0],...stageTypes.slice(5),optionalStageTypes[1]].map(([type])=>route.stages.find(stage=>stage.type===type)).filter(Boolean)}))});
  }
  unique(admissions.map(item=>`${item.programId}:${item.cycle}:${intakeKey(item.intake)}`),'admission cycles');
  requireThat(programs.every(program=>admissions.some(item=>item.programId===program.id)),'Every program needs an admission cycle');
  validateApplicantPolicies(applicantPolicies,universities,programs,admissions);
  validateAdmissionDetails(admissionDetails,programs,admissions);
  const modes=new Set(admissions.map(item=>item.dataType||'dummy'));
  return {schemaVersion:1,mode:modes.size>1?'mixed':[...modes][0]||'dummy',applicantPolicies,admissionDetails,universities:universities.sort((a,b)=>a.id.localeCompare(b.id)),programs:programs.sort((a,b)=>a.id.localeCompare(b.id)),admissions:admissions.sort((a,b)=>`${a.programId}:${a.cycle}:${intakeKey(a.intake)}`.localeCompare(`${b.programId}:${b.cycle}:${intakeKey(b.intake)}`))};
}
function validateAdmissionDetails(details,programs,admissions){
  requireThat(Array.isArray(details),'admissionDetails must be a list');unique(details.map(d=>d.id),'admissionDetails');
  const covered=[];
  for(const record of details){
    keys(record,['id','programIds','coverage','summary','requirements','sources'],'admissionDetails');id(record.id,'admissionDetails.id');list(record.programIds,'admissionDetails.programIds');text(record.summary,'admissionDetails.summary');
    requireThat(['partial','not-extracted'].includes(record.coverage),'admissionDetails: invalid coverage');
    for(const programId of record.programIds){requireThat(programs.some(p=>p.id===programId),'admissionDetails: unknown programme');covered.push(programId);}
    list(record.sources,'admissionDetails.sources');unique(record.sources.map(s=>s.id),'admissionDetails.sources');
    for(const source of record.sources){
      keys(source,['id','url','linkedFrom','checkedAt','updatedAt','applicability','passage'],'details.source');id(source.id,'details.source.id');text(source.passage,'details.source.passage');text(source.applicability,'details.source.applicability');requireThat(validDate(source.checkedAt),'details.source: invalid check date');
      requireThat(source.updatedAt===null||validDate(source.updatedAt)||(typeof source.updatedAt==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/u.test(source.updatedAt)),'details.source: invalid update date');
      let url;try{url=new URL(source.url);}catch{throw Error('details.source: invalid URL');}
      if(url.hostname==='onesim-production.s3.ap-southeast-1.amazonaws.com'){
        requireThat(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname.startsWith('/onesim/media/')&&url.pathname.endsWith('.pdf'),'details.source: invalid SIM document path');
        officialUrl(source.linkedFrom);requireThat(new URL(source.linkedFrom).hostname==='www.sim.edu.sg','details.source: document needs an official SIM parent');
        const parent=source.linkedFrom.split('#')[0];requireThat(record.programIds.some(id=>programs.find(p=>p.id===id).url?.split('#')[0]===parent),'details.source: document parent must be a programme in scope');
      }else{officialUrl(source.url);if(source.linkedFrom)officialUrl(source.linkedFrom);}
    }
    list(record.requirements,'admissionDetails.requirements');
    for(const entry of record.requirements){keys(entry,['label','text','status','sourceIds'],'requirement');text(entry.label,'requirement.label');text(entry.text,'requirement.text');requireThat(['extracted','needs-review','not-extracted'].includes(entry.status),'requirement: invalid status');requireThat(Array.isArray(entry.sourceIds)&&entry.sourceIds.every(id=>record.sources.some(s=>s.id===id)),'requirement: invalid evidence');if(entry.status==='extracted')requireThat(entry.sourceIds.length>0,'extracted requirements need evidence');}
  }
  unique(covered,'admissionDetails programme coverage');
  if(details.length)requireThat(admissions.filter(a=>a.dataType==='real').every(a=>covered.includes(a.programId)),'Every real programme needs an explicit details/extraction record');
}
function validateApplicantPolicies(policies,universities,programs,admissions){
  requireThat(Array.isArray(policies),'Applicant policies must be a list');unique(policies.map(p=>`${p.universityId}:${p.cycle}`),'Applicant policies');
  for(const policy of policies){
    keys(policy,['universityId','cycle','rules','sources'],'applicantPolicy');
    requireThat(universities.some(u=>u.id===policy.universityId&&u.country==='Singapore'),'applicantPolicy: unknown Singapore university');
    requireThat(Number.isInteger(policy.cycle)&&policy.cycle>=2027,'applicantPolicy: invalid cycle');list(policy.sources,'applicantPolicy.sources');list(policy.rules,'applicantPolicy.rules');
    unique(policy.sources.map(s=>s.id),'applicantPolicy.sources');unique(policy.rules.map(r=>r.id),'applicantPolicy.rules');
    for(const source of policy.sources){keys(source,['id','url','passage','checkedAt'],'policy.source');id(source.id,'policy.source.id');officialUrl(source.url);text(source.passage,'policy.source.passage');requireThat(validDate(source.checkedAt),'Policy source needs a valid check date');}
    for(const rule of policy.rules){
      keys(rule,['id','routeId','programIds','boards','citizenships','singaporePr','results','status','sourceIds','notes','instructions'],'applicantRule');id(rule.id,'applicantRule.id');id(rule.routeId,'applicantRule.routeId');
      for(const field of ['programIds','boards','citizenships','singaporePr','results','sourceIds']){list(rule[field],`applicantRule.${field}`);unique(rule[field],`applicantRule.${field}`);}
      requireThat(rule.boards.every(b=>['cbse','isc','ib','a-level','indian-state-boards'].includes(b)||(typeof b==='string'&&/^state:[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(b))),'applicantRule: use an explicit qualification or sourced Indian-state-board group; no generic wildcard');
      requireThat(rule.citizenships.every(c=>c==='India')&&rule.singaporePr.every(v=>['yes','no'].includes(v))&&rule.results.every(v=>['pending','available'].includes(v)),'applicantRule: invalid applicant conditions');
      requireThat(['verified','needs-review'].includes(rule.status),'applicantRule: invalid status');text(rule.notes,'applicantRule.notes');
      keys(rule.instructions,['pending','available'],'applicantRule.instructions');for(const result of rule.results)text(rule.instructions[result],`instructions.${result}`);
      requireThat(rule.sourceIds.every(id=>policy.sources.some(s=>s.id===id)),'applicantRule: unknown source');
      for(const programId of rule.programIds){requireThat(programs.some(p=>p.id===programId&&p.universityId===policy.universityId&&p.degree==='Bachelor’s'),'applicantRule: wrong programme scope');const cycles=admissions.filter(a=>a.programId===programId&&a.cycle===policy.cycle);requireThat(cycles.length>0&&cycles.every(a=>a.dataType==='real'&&a.routes.some(r=>r.id===rule.routeId)),'applicantRule: unavailable route or cycle');}
    }
  }
}
const officialHosts=['nus.edu.sg','ntu.edu.sg','smu.edu.sg','suss.edu.sg','sim.edu.sg','kaplan.com.sg','buffalo.edu','uva.nl','eur.nl','tilburguniversity.edu','rug.nl','maastrichtuniversity.nl','uu.nl','vu.nl','universiteitleiden.nl'];
function validateRanking(ranking){
  keys(ranking,['edition','rank','status','institution','url','checkedAt','notes'],'qsRanking');
  requireThat(Number.isInteger(ranking.edition)&&ranking.edition>=2027&&ranking.edition<=2100,'qsRanking: invalid edition');
  requireThat(['verified','not-verified'].includes(ranking.status),'qsRanking: invalid status');
  text(ranking.institution,'qsRanking.institution');text(ranking.notes,'qsRanking.notes');
  requireThat(validDate(ranking.checkedAt),'qsRanking: invalid check date');
  let url;try{url=new URL(ranking.url);}catch{throw Error('qsRanking: invalid source URL');}
  requireThat(url.protocol==='https:'&&url.hostname==='www.topuniversities.com'&&!url.username&&!url.password,'qsRanking: use the official QS HTTPS source');
  if(ranking.status==='verified')requireThat(typeof ranking.rank==='string'&&/^(?:=?[1-9]\d*|[1-9]\d*-[1-9]\d*)$/u.test(ranking.rank),'qsRanking: verified rank must preserve numeric rank, tie or band');
  else requireThat(ranking.rank===null,'qsRanking: unverified rank must be null');
}
export const rankingLabel=ranking=>`QS World ${ranking.edition} · ${ranking.status==='verified'?`#${ranking.rank}`:'Rank not verified'}`;
function officialUrl(value){let url;try{url=new URL(value);}catch{throw Error('Invalid official source URL');}requireThat(url.protocol==='https:'&&!url.username&&!url.password&&officialHosts.some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`)),'Real evidence must use an approved official institution HTTPS domain');}
export function catalogueRows(catalogue){return catalogue.admissions.map(admission=>{const program=catalogue.programs.find(p=>p.id===admission.programId);const university=catalogue.universities.find(u=>u.id===program.universityId);return {...program,...university,programId:program.id,universityId:university.id,programName:program.name,universityName:university.name,admission,admissionDetails:catalogue.admissionDetails?.find(d=>d.programIds.includes(program.id)),applicantPolicy:catalogue.applicantPolicies?.find(p=>p.universityId===university.id&&p.cycle===admission.cycle),key:`${program.id}:${admission.cycle}:${intakeKey(admission.intake)}`};});}
export function filterRows(rows,filters){return rows.filter(row=>(!filters.countries.length||filters.countries.includes(row.country))&&(!filters.subjects.length||row.subjects.some(s=>filters.subjects.includes(s)))&&(!filters.degree||row.degree===filters.degree)&&(!filters.intake||intakeKey(row.admission.intake)===filters.intake));}
export const intakeKey=intake=>`${intake.year}-${intake.month===null?'unknown':String(intake.month).padStart(2,'0')}`;
export const intakeLabel=intake=>intake.month===null?`${intake.year} · intake month not verified`:new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(intake.year,intake.month-1,1)));
const dateLabel=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
export function deadlineLabel(value){if(value===null)return 'Date unavailable';if(value.kind==='date')return dateLabel(value.date);if(value.kind==='window')return `${dateLabel(value.start)} – ${dateLabel(value.end)}`;return value.rule;}
