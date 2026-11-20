import test from 'node:test';
import assert from 'node:assert/strict';
import {admissionsToday,addCalendarDays,upcomingActivities} from '../src/upcoming-deadlines.js';
const date=value=>({kind:'date',date:value});
function stage(type,deadline,status='verified'){return {type,status,deadline};}
function row(stages,{key='p:2027:2027-08',dataType='real',routes}={}){return {key,universityName:'Example institution',programName:'Example programme',admission:{dataType,routes:routes||[{id:'international',label:'International',stages}]}};}
const today='2026-11-20';

test('Netherlands upcoming dates use Amsterdam winter and summer midnight, independently of Singapore',()=>{
  const nl={...row([stage('application',date('2027-01-15'))]),country:'Netherlands'};
  const sg={...row([stage('application',date('2027-01-15'))],{key:'sg'}),country:'Singapore'};
  assert.deepEqual(upcomingActivities([nl,sg],{now:new Date('2027-01-12T17:00:00Z')}).map(a=>[a.row.country,a.daysAway,a.urgent]),[['Netherlands',3,false],['Singapore',2,true]]);
  assert.equal(admissionsToday(new Date('2027-01-14T23:00:00Z'),'Europe/Amsterdam'),'2027-01-15');
  assert.equal(admissionsToday(new Date('2027-07-14T22:00:00Z'),'Europe/Amsterdam'),'2027-07-15');
});
test('includes today through seven days ahead and marks today through two days ahead urgent',()=>{
  const types=['documents','application','tests','interview','acceptance','deposit'];const offsets=[-1,0,2,3,7,8];
  const result=upcomingActivities([row(types.map((type,i)=>stage(type,date(addCalendarDays(today,offsets[i])))))],{today});
  assert.deepEqual(result.map(a=>a.daysAway),[0,2,3,7]);assert.deepEqual(result.map(a=>a.urgent),[true,true,false,false]);
});
test('uses window ends, excludes openings and does not guess relative or missing deadlines',()=>{
  const result=upcomingActivities([row([
    stage('opening',date(today)),stage('documents',{kind:'relative',rule:'Within 3 days of results'}),stage('tests',null,'not-verified'),
    stage('interview',{kind:'window',start:'2026-11-01',end:'2026-11-22'}),
    stage('application',{kind:'window',start:'2026-11-21',end:'2026-12-01'}),
  ])],{today});assert.deepEqual(result.map(a=>[a.stage.type,a.date]),[['interview','2026-11-22']]);
});
test('fictional data is excluded and review/manual entries retain their status',()=>{
  const result=upcomingActivities([row([stage('application',date(today),'dummy')],{dataType:'dummy'}),row([
    stage('application',date(today),'needs-review'),stage('documents',date('2026-11-21'),'manual-unverified'),stage('tests',date(today),'not-verified'),
  ])],{today});assert.deepEqual(result.map(a=>a.stage.status),['needs-review','manual-unverified']);
});
test('duplicates are removed without merging distinct programmes, intakes or applicant categories',()=>{
  const input=row([stage('application',date(today))]);const other=row([stage('application',date(today))],{key:'other:2027:2027-08'});const intake=row([stage('application',date(today))],{key:'p:2027:2027-09'});
  input.admission.routes.push({id:'local',label:'Local',stages:[stage('application',date(today))]});const before=JSON.stringify(input);
  const result=upcomingActivities([input,input,other,intake],{today});assert.equal(result.length,4);assert.equal(JSON.stringify(input),before);
});
test('Singapore date boundaries are independent of the viewer timezone; calendar arithmetic crosses months/years',()=>{
  assert.equal(admissionsToday(new Date('2026-11-20T15:59:59Z')),'2026-11-20');assert.equal(admissionsToday(new Date('2026-11-20T16:00:00Z')),'2026-11-21');
  assert.equal(addCalendarDays('2028-02-27',2),'2028-02-29');assert.equal(addCalendarDays('2026-12-28',7),'2027-01-04');
  assert.throws(()=>upcomingActivities([],{today:'2027-02-30'}),RangeError);
});
