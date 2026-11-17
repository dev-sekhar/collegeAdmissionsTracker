export const stageTypes = [
  ['opening','Applications open'],['application','Submit application'],['documents','Supporting documents'],
  ['tests','Tests / scores'],['interview','Interview'],['acceptance','Accept offer'],['deposit','Pay deposit'],['enrolment','Enrolment'],
];
export const optionalStageTypes = [['decision','Admission decision'],['appeal','Appeal']];
export const statusLabels = {'dummy':'Illustrative date','not-researched':'Not researched','not-verified':'Not verified','not-yet-published':'Not yet published','source-unavailable':'Source unavailable','needs-review':'Needs review','verified':'Verified against source'};
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
export function compileCatalogue(universityDocuments,admissionDocuments){
  const universities=[];const programs=[];const admissions=[];
  for(const [index,doc] of universityDocuments.entries()){
    const where=`university[${index}]`;keys(doc,['id','name','country','city','programs','qsRanking'],where);id(doc.id,where);text(doc.name,where);text(doc.country,where);text(doc.city,where);list(doc.programs,`${where}.programs`);
    if(doc.qsRanking)validateRanking(doc.qsRanking);
    universities.push({id:doc.id,name:doc.name,country:countryName(doc.country),city:doc.city,...(doc.qsRanking?{qsRanking:doc.qsRanking}:{})});
    for(const program of doc.programs){keys(program,['id','name','degree','subjects','url','notes'],`${where}.program`);id(program.id,'program');text(program.name,'program.name');requireThat(['Bachelor’s','Master’s','PhD'].includes(program.degree),'program.degree: unsupported level');list(program.subjects,'program.subjects');program.subjects.forEach(subject=>text(subject,'program.subject'));unique(program.subjects.map(s=>s.toLowerCase()),'program.subjects');if(program.url)officialUrl(program.url);if(program.notes)text(program.notes,'program.notes');programs.push({...program,universityId:doc.id});}
  }
  unique(universities.map(item=>item.id),'universities');unique(programs.map(item=>item.id),'programs');
  for(const [index,doc] of admissionDocuments.entries()){
    const where=`admissions[${index}]`;keys(doc,['programId','cycle','intake','routes','sources','dataType'],where);const real=doc.dataType==='real';requireThat(doc.dataType===undefined||['dummy','real'].includes(doc.dataType),`${where}: invalid dataType`);id(doc.programId,`${where}.programId`);requireThat(programs.some(p=>p.id===doc.programId),`${where}: unknown programId ${doc.programId}`);
    requireThat(Number.isInteger(doc.cycle)&&doc.cycle>=2027&&doc.cycle<=2100,`${where}: invalid cycle`);
    keys(doc.intake,['month','year'],`${where}.intake`);requireThat(((real&&doc.intake.month===null)||(Number.isInteger(doc.intake.month)&&doc.intake.month>=1&&doc.intake.month<=12))&&Number.isInteger(doc.intake.year)&&doc.intake.year>=doc.cycle&&doc.intake.year<=doc.cycle+1,`${where}: invalid intake`);
    requireThat(Array.isArray(doc.sources),`${where}.sources: expected list`);
    unique(doc.sources.map(source=>source.id),`${where}.sources`);
    for(const source of doc.sources){keys(source,['id','url','passage','checkedAt'],`${where}.source`);id(source.id,'source.id');text(source.passage,'source.passage');if(real){officialUrl(source.url);requireThat(validDate(source.checkedAt),`${where}: real evidence needs a valid check date`);}else{let url;try{url=new URL(source.url);}catch{throw Error(`${where}: invalid source URL`);}requireThat(url.protocol==='https:'&&/(^|\.)example\.(org|com|net)$/u.test(url.hostname),`${where}: dummy sources must use a reserved example domain`);requireThat(source.checkedAt===null,`${where}: dummy sources cannot claim a real check date`);}}
    list(doc.routes,`${where}.routes`);unique(doc.routes.map(route=>route.id),`${where}.routes`);
    for(const route of doc.routes){keys(route,['id','label','stages'],`${where}.route`);id(route.id,'route.id');text(route.label,'route.label');list(route.stages,'route.stages');unique(route.stages.map(stage=>stage.type),'route.stages');requireThat(stageTypes.every(([type])=>route.stages.some(stage=>stage.type===type))&&route.stages.every(stage=>[...stageTypes,...optionalStageTypes].some(([type])=>type===stage.type)),`${where}: include all eight stages, using an explicit missing-data status where needed`);
      for(const stage of route.stages){keys(stage,['type','status','deadline','wording','sourceIds'],`${where}.stage`);requireThat(Object.hasOwn(statusLabels,stage.status),`${where}: unknown stage status`);requireThat(real||stage.status!=='verified',`${where}: dummy data cannot be verified`);requireThat(!real||stage.status!=='dummy',`${where}: real data cannot contain dummy dates`);deadline(stage.deadline,`${where}.${stage.type}`);text(stage.wording,'stage.wording');requireThat(Array.isArray(stage.sourceIds),`${where}: sourceIds must be a list`);unique(stage.sourceIds,'stage.sourceIds');requireThat(stage.sourceIds.every(sourceId=>doc.sources.some(source=>source.id===sourceId)),`${where}: unknown source reference`);
        if(['not-researched','not-verified','not-yet-published','source-unavailable'].includes(stage.status))requireThat(stage.deadline===null,`${where}: missing-data status must have a null deadline`);
        if(stage.status==='verified')requireThat(stage.deadline!==null&&stage.sourceIds.length>0,`${where}: verified stages need a deadline and checked official evidence`);
        if(stage.status==='dummy')requireThat(stage.deadline!==null&&stage.sourceIds.length>0,`${where}: illustrative dates need a deadline and dummy evidence`);
      }
    }
    admissions.push({...doc,routes:doc.routes.map(route=>({...route,stages:[...stageTypes.slice(0,5),optionalStageTypes[0],...stageTypes.slice(5),optionalStageTypes[1]].map(([type])=>route.stages.find(stage=>stage.type===type)).filter(Boolean)}))});
  }
  unique(admissions.map(item=>`${item.programId}:${item.cycle}:${intakeKey(item.intake)}`),'admission cycles');
  requireThat(programs.every(program=>admissions.some(item=>item.programId===program.id)),'Every program needs an admission cycle');
  const modes=new Set(admissions.map(item=>item.dataType||'dummy'));
  return {schemaVersion:1,mode:modes.size>1?'mixed':[...modes][0]||'dummy',universities:universities.sort((a,b)=>a.id.localeCompare(b.id)),programs:programs.sort((a,b)=>a.id.localeCompare(b.id)),admissions:admissions.sort((a,b)=>`${a.programId}:${a.cycle}:${intakeKey(a.intake)}`.localeCompare(`${b.programId}:${b.cycle}:${intakeKey(b.intake)}`))};
}
const officialHosts=['nus.edu.sg','ntu.edu.sg','smu.edu.sg','suss.edu.sg','sim.edu.sg','kaplan.com.sg','buffalo.edu'];
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
export function catalogueRows(catalogue){return catalogue.admissions.map(admission=>{const program=catalogue.programs.find(p=>p.id===admission.programId);const university=catalogue.universities.find(u=>u.id===program.universityId);return {...program,...university,programId:program.id,universityId:university.id,programName:program.name,universityName:university.name,admission,key:`${program.id}:${admission.cycle}:${intakeKey(admission.intake)}`};});}
export function filterRows(rows,filters){return rows.filter(row=>(!filters.countries.length||filters.countries.includes(row.country))&&(!filters.subjects.length||row.subjects.some(s=>filters.subjects.includes(s)))&&(!filters.degree||row.degree===filters.degree)&&(!filters.intake||intakeKey(row.admission.intake)===filters.intake));}
export const intakeKey=intake=>`${intake.year}-${intake.month===null?'unknown':String(intake.month).padStart(2,'0')}`;
export const intakeLabel=intake=>intake.month===null?`${intake.year} · intake month not verified`:new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(intake.year,intake.month-1,1)));
const dateLabel=value=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`));
export function deadlineLabel(value){if(value===null)return 'Date unavailable';if(value.kind==='date')return dateLabel(value.date);if(value.kind==='window')return `${dateLabel(value.start)} – ${dateLabel(value.end)}`;return value.rule;}
