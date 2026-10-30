import test from 'node:test';
import assert from 'node:assert/strict';
import {assessRecords,recordKey,fullDate,publishedIntake,publishedRound,programSourceScope} from '../src/verification.js';
const now=new Date('2026-10-30T04:00:00Z');
const base={stage:'application',value:'15 December 2026',context:'September 2027 Intake',applicantCategory:'International Applicants',sourceUrl:'https://example.edu/apply',evidence:'Application Deadline: 15 December 2026',kind:'Published date text',extraction:'HTML'};
const proof={evidenceMatched:true,scopeMatched:true,checkedAt:now.toISOString()};
const checks=records=>Object.fromEntries(records.map(record=>[recordKey(record),proof]));
const status=(record=base,intake='September 2027',check=proof)=>assessRecords([record],{[recordKey(record)]:check},intake,now)[0].assessment;
test('verifies source publication for exact intake without deciding applicant eligibility',()=>{
  assert.equal(status().status,'Source verified');assert.equal(status().applicantApplicable,false);assert.equal(status().isoDate,'2026-12-15');
  assert.equal(status(base,'Autumn 2027').status,'Choose exact intake');assert.equal(status(base,'January 2028').status,'Different intake');
});
test('changed, blocked, stale and unscoped sources cannot verify',()=>{
  assert.equal(status(base,undefined,{...proof,evidenceMatched:false}).status,'Source changed');
  assert.equal(status(base,undefined,{...proof,error:'HTTP 403'}).status,'Source unavailable');
  assert.equal(status(base,undefined,{...proof,scopeMatched:false}).status,'Scope review needed');
  assert.equal(status(base,undefined,{...proof,checkedAt:'2026-10-01T00:00:00Z'}).status,'Stale check');
});
test('requires valid calendar date and explicit intake/year, without shifting old cycles',()=>{
  assert.equal(fullDate('31 February 2027'),null);assert.equal(fullDate('February 29, 2028'),'2028-02-29');assert.equal(fullDate('15 December'),null);
  assert.equal(publishedIntake('September 2027\nIntake'),'September 2027');assert.equal(publishedIntake('Autumn 2027'),null);
  assert.equal(status({...base,value:'15 December'}).status,'Date/rule review needed');
  assert.equal(status({...base,value:'15 December 2020'}).status,'Cycle review needed');
});
test('conflicting dates for the same scoped stage block both records',()=>{
  const other={...base,value:'16 December 2026',evidence:'Application Deadline: 16 December 2026'};
  assert.deepEqual(assessRecords([base,other],checks([base,other]),'September 2027',now).map(r=>r.assessment.status),['Conflicting dates','Conflicting dates']);
});
test('transcript/referee, applicant categories and distinct rounds do not create false conflicts',()=>{
  const transcript={...base,stage:'documents',evidence:'Transcript Deadline: 15 December 2026'};
  const referee={...transcript,value:'15 January 2027',evidence:'Referee Deadline: 15 January 2027'};
  assert.ok(assessRecords([transcript,referee],checks([transcript,referee]),'September 2027',now).every(r=>r.assessment.status==='Source verified'));
  const domestic={...base,value:'16 December 2026',applicantCategory:'Canadian Applicants'};
  assert.ok(assessRecords([base,domestic],checks([base,domestic]),'September 2027',now).every(r=>r.assessment.status==='Source verified'));
  const round1={...base,evidence:'Round 1 application deadline: 15 December 2026'};
  const round2={...base,value:'16 December 2026',evidence:'Round 2 application deadline: 16 December 2026'};
  assert.ok(assessRecords([round1,round2],checks([round1,round2]),'September 2027',now).every(r=>r.assessment.status==='Source verified'));
  assert.equal(publishedRound({...base,evidence:'Intake | Round | Closing Date\nSeptember 2027 | 2 | 15 December 2026'}),'Round 2');
});
test('document text and changed evidence need review rather than inheriting a check',()=>{
  assert.equal(status({...base,extraction:'PDF text; first 10 pages only'}).status,'Document review needed');
  const changed={...base,evidence:'Different stage context'};
  assert.equal(assessRecords([changed],checks([base]),'September 2027',now)[0].assessment.status,'Not checked');
});
test('a generic linked deadline page cannot establish program scope by itself',()=>{
  const url='https://example.edu/programs/computing';const title='Master of Computing';
  assert.equal(programSourceScope(url,`${url}/application`,title,[title],['Application information'],true),true);
  assert.equal(programSourceScope(url,'https://example.edu/general-deadlines',title,[title],['General deadlines'],true),false);
  assert.equal(programSourceScope(url,'https://example.edu/admission-notice',title,[title],[`${title} application dates`],true),true);
  assert.equal(programSourceScope(url,`${url}/application`,title,['Different program'],[title],true),false);
});
