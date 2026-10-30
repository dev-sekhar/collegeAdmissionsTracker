import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCandidates, stageFor, dateExpressions } from '../src/deadlines.js';
const meta={sourceUrl:'https://example.edu/apply',checkedAt:'2026-10-30T00:00:00Z',extraction:'HTML'};
test('separates intake, applicant category and cross-year stage dates',()=>{
  const result=extractCandidates([{type:'field',label:'Application Deadline',value:'15 December 2026',context:'September 2027 Intake',category:'International Applicants'},{type:'field',label:'Transcript Deadline',value:'16 December 2026',context:'September 2027 Intake',category:'Canadian Applicants'}],meta);
  assert.equal(result.length,2); assert.equal(result[0].applicantCategory,'International Applicants'); assert.deepEqual(result[0].years,['2027','2026']); assert.equal(result[1].stage,'documents'); assert.equal(result[0].status,'Needs verification'); assert.equal(result[0].timezone,null);
});
test('opening and closing dates in intake tables stay separate',()=>{
  const result=extractCandidates([{type:'table',headers:['Intake','Opening Date','Closing Date'],cells:['August 2027','1 October 2026','31 January 2027']}],meta);
  assert.deepEqual(result.map(item=>item.stage),['opening','application']); assert.ok(result.every(item=>item.context==='August 2027'));
});
test('does not turn webinars or scholarships into admission dates',()=>{
  assert.equal(extractCandidates([{type:'text',text:'Programme briefing webinar: 17 November 2026',context:'Application Information'}],meta).length,0);
  assert.equal(stageFor('Scholarship application deadline 1 May 2027'),null);
});
test('relative rules retain original wording, missing years stay missing',()=>{
  assert.deepEqual(dateExpressions('Application deadline 15 May'),['15 May']);
  const result=extractCandidates([{type:'text',text:'Accept your offer within 14 days of receiving it.',context:'Offer instructions'}],meta);
  assert.equal(result[0].kind,'Relative rule / rolling'); assert.deepEqual(result[0].years,[]);
});
test('month/year intake labels cannot become opening dates',()=>{
  assert.deepEqual(dateExpressions('September 2027 Intake'),[]);
  assert.deepEqual(dateExpressions('January 2028'),[]);
  assert.deepEqual(dateExpressions('September 15, 2026'),['September 15, 2026']);
  assert.equal(extractCandidates([{type:'table',headers:['Application Open Date 15 September 2026','Other'],cells:['September 2027 Intake','']}],meta).length,0);
});
