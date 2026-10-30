import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyProfile,applyContext,declaredCategory,categoryNote,localDeadline,publishedInstant,loadProfile} from '../src/applicant.js';
const program={id:'ubc',country:'Canada'};const entry={candidates:[{applicantCategory:'Canadian Applicants'},{applicantCategory:'International Applicants'}]};
const input={citizenships:'India',residence:'India',residency:'',timezone:'Asia/Kolkata',category:'',confirmCategory:false};
test('cross-country residence, multiple nationalities and residency never infer a category',()=>{
  const profile=applyContext(emptyProfile(),{...input,citizenships:'India, Germany, india',residency:'permanent-resident'},program,entry);
  assert.deepEqual(profile.citizenships,['India','Germany']);assert.equal(declaredCategory(profile,program,entry),null);
  assert.match(categoryNote({applicantCategory:'International Applicants'},profile,program,entry),/unconfirmed/);
});
test('category declarations require confirmation, apply only to their program and reset after profile changes',()=>{
  assert.throws(()=>applyContext(emptyProfile(),{...input,category:'International Applicants'},program,entry));
  const profile=applyContext(emptyProfile(),{...input,category:'International Applicants',confirmCategory:true},program,entry);
  assert.equal(declaredCategory(profile,program,entry),'International Applicants');assert.equal(declaredCategory(profile,{id:'other'},entry),null);
  const changed=applyContext(profile,{...input,citizenships:'Canada'},program,entry);assert.equal(declaredCategory(changed,program,entry),null);
});
test('unknown source categories and malformed storage stay unresolved',()=>{
  assert.throws(()=>applyContext(emptyProfile(),{...input,category:'International Applicants',confirmCategory:true},program,{candidates:[]}));
  assert.equal(loadProfile({getItem:()=>'{broken'},'Asia/Kolkata').remember,false);
});
test('date-only records do not shift dates or use HTML datetime metadata',()=>{
  assert.match(localDeadline({value:'31 January 2027',datetime:'2027-01-31T00:00:00Z'},'Asia/Kolkata'),/no timezone conversion/);
  assert.equal(publishedInstant('31 January 2027 23:59 CET'),null);assert.equal(publishedInstant('31 February 2027 23:59 UTC+08:00'),null);
});
test('explicit offsets convert across dates and daylight-saving zones without guessing source timezone',()=>{
  const record={value:'31 January 2027 23:59 UTC-08:00'};
  assert.match(localDeadline(record,'Asia/Kolkata'),/1 Feb 2027/);
  assert.match(localDeadline({value:'2027-07-01T12:00:00Z'},'Europe/Berlin'),/14:00/);
  assert.equal(publishedInstant('2027-01-31T24:00:00+08:00'),null);
});
