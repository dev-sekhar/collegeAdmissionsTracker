import {validDate} from './catalogue-model.js';
const dayMilliseconds=86400000;
export const deadlineTimeZone=country=>country==='Netherlands'?'Europe/Amsterdam':'Asia/Singapore';
export function admissionsToday(now=new Date(),timeZone='Asia/Singapore'){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=type=>parts.find(part=>part.type===type).value;return `${value('year')}-${value('month')}-${value('day')}`;
}
export function addCalendarDays(date,days){
  if(!validDate(date)||!Number.isInteger(days))throw new RangeError('Use a valid calendar date and whole days');
  return new Date(Date.parse(`${date}T00:00:00Z`)+days*dayMilliseconds).toISOString().slice(0,10);
}
export function addCalendarMonths(date,months){
  if(!validDate(date)||!Number.isInteger(months)||months<0)throw new RangeError('Use a valid calendar date and non-negative whole months');
  const start=new Date(`${date}T00:00:00Z`);const day=start.getUTCDate();start.setUTCDate(1);start.setUTCMonth(start.getUTCMonth()+months);
  const last=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0)).getUTCDate();start.setUTCDate(Math.min(day,last));return start.toISOString().slice(0,10);
}
export function upcomingActivities(rows,{today:override,now=new Date(),months=3,urgentDays=2}={}){
  if((override!==undefined&&!validDate(override))||!Number.isInteger(months)||months<0||!Number.isInteger(urgentDays)||urgentDays<0)throw new RangeError('Invalid upcoming deadline window');
  const output=new Map();
  for(const row of rows){
    if(row.admission.dataType!=='real')continue;
    const today=override??admissionsToday(now,deadlineTimeZone(row.country));const through=addCalendarMonths(today,months);
    for(const route of row.admission.routes)for(const stage of route.stages){
      if(stage.type==='opening'||!['verified','needs-review','manual-unverified'].includes(stage.status))continue;
      const date=stage.deadline?.kind==='date'?stage.deadline.date:stage.deadline?.kind==='window'?stage.deadline.end:null;
      if(!validDate(date)||date<today||date>through)continue;
      const daysAway=Math.round((Date.parse(`${date}T00:00:00Z`)-Date.parse(`${today}T00:00:00Z`))/dayMilliseconds);
      const key=`${row.key}:${route.id}:${stage.type}:${date}`;
      output.set(key,{key,row,routeId:route.id,routeLabel:route.label,stage,date,daysAway,urgent:daysAway<=urgentDays});
    }
  }
  return [...output.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.row.universityName.localeCompare(b.row.universityName)||a.row.programName.localeCompare(b.row.programName)||a.key.localeCompare(b.key));
}
