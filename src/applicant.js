import {countryName} from './discovery.js';
import {fullDate} from './verification.js';
export const profileStorageKey='admissions-applicant-context-v1';
export const clean=value=>String(value||'').trim().replace(/\s+/gu,' ').slice(0,160);
export function validTimezone(value){try{new Intl.DateTimeFormat('en',{timeZone:value}).format();return Boolean(value);}catch{return false;}}
export function emptyProfile(timezone='UTC'){
  return {citizenships:[],residence:'',residency:{},declarations:{},timezone:validTimezone(timezone)?timezone:'UTC'};
}
export function profileFingerprint(profile){
  return JSON.stringify({citizenships:profile.citizenships.map(value=>value.toLowerCase()).sort(),residence:profile.residence.toLowerCase(),residency:Object.entries(profile.residency).sort(([a],[b])=>a.localeCompare(b))});
}
export function publishedCategories(entry){return [...new Set((entry?.candidates||[]).map(r=>r.applicantCategory).filter(value=>value&&value!=='Not specified'))].sort();}
export function declaredCategory(profile,program,entry){
  const declaration=profile.declarations[program?.id];
  const categories=publishedCategories(entry);
  return declaration&&declaration.fingerprint===profileFingerprint(profile)&&declaration.categories===JSON.stringify(categories)&&categories.includes(declaration.category)?declaration.category:null;
}
export function applyContext(previous,input,program,entry){
  const names=clean(input.citizenships).split(',').map(value=>countryName(value.trim())).filter(Boolean);
  const citizenships=names.filter((value,index)=>names.findIndex(other=>other.toLowerCase()===value.toLowerCase())===index);
  const profile={...previous,citizenships,residence:countryName(clean(input.residence)),residency:{...previous.residency},declarations:{...previous.declarations},timezone:input.timezone};
  if(!validTimezone(input.timezone))throw Error('Enter a valid IANA timezone, for example Asia/Kolkata or Europe/Berlin.');
  if(program?.country){if(input.residency)profile.residency[program.country]=input.residency;else delete profile.residency[program.country];}
  if(profileFingerprint(profile)!==profileFingerprint(previous))profile.declarations={};
  if(program){
    delete profile.declarations[program.id];
    if(input.category){
      const categories=publishedCategories(entry);
      if(!categories.includes(input.category)||!input.confirmCategory)throw Error('Check the official program rules and confirm your category selection, or leave it unconfirmed.');
      profile.declarations[program.id]={category:input.category,categories:JSON.stringify(categories),fingerprint:profileFingerprint(profile)};
    }
  }
  return profile;
}
export function categoryNote(record,profile,program,entry){
  if(record.applicantCategory==='Not specified')return 'The source does not specify applicant applicability for this record.';
  const category=declaredCategory(profile,program,entry);
  if(!category)return 'Your applicant category is unconfirmed. Citizenship or residence alone does not establish it.';
  return category===record.applicantCategory?'Matches your declared category; classification has not been independently verified.':'Other published category; retained for comparison.';
}
export function loadProfile(storage,timezone){
  const fallback=emptyProfile(timezone);
  try{
    const value=JSON.parse(storage.getItem(profileStorageKey));
    if(value?.version!==1||!Array.isArray(value.profile?.citizenships)||!validTimezone(value.profile.timezone))return {profile:fallback,remember:false};
    const saved=value.profile;
    if(!saved.residency||typeof saved.residency!=='object'||Array.isArray(saved.residency)||!saved.declarations||typeof saved.declarations!=='object'||Array.isArray(saved.declarations))return {profile:fallback,remember:false};
    return {profile:{...fallback,citizenships:saved.citizenships.filter(v=>typeof v==='string').map(clean),residence:clean(saved.residence),residency:saved.residency,declarations:saved.declarations,timezone:saved.timezone},remember:true};
  }catch{return {profile:fallback,remember:false};}
}

// Only explicit publication text is considered; HTML datetime metadata is never a cutoff.
export function publishedInstant(value){
  const text=String(value||'').trim();
  let match=text.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(Z|[+-]\d{2}:\d{2})$/u);
  if(!match){
    const readable=text.match(/^(.+?)\s+(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s+(?:UTC|GMT)?(Z|[+-]\d{2}:\d{2})$/iu);
    if(!readable)return null;
    const date=fullDate(readable[1]);if(!date)return null;
    match=[readable[0],date,readable[2].padStart(2,'0'),readable[3],readable[4],readable[5].toUpperCase()];
  }
  if(!fullDate(match[1])||Number(match[2])>23||Number(match[3])>59||Number(match[4]||0)>59)return null;
  const offset=match[5];
  if(offset!=='Z'&&(Number(offset.slice(1,3))>14||Number(offset.slice(4))>59||(Number(offset.slice(1,3))===14&&Number(offset.slice(4))!==0)))return null;
  const instant=`${match[1]}T${match[2]}:${match[3]}:${match[4]||'00'}${offset}`;
  return Number.isFinite(Date.parse(instant))?instant:null;
}
export function localDeadline(record,timezone){
  const instant=publishedInstant(record.value);
  if(!instant)return 'Date-only or unresolved cutoff time: original source date retained; no timezone conversion.';
  if(!validTimezone(timezone))return 'Display timezone is invalid; original source text retained.';
  const local=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,dateStyle:'medium',timeStyle:'short'}).format(new Date(instant));
  return `Published cutoff in ${timezone}: ${local}. Original source text: ${record.value}`;
}
