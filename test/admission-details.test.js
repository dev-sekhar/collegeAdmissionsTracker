import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {compileCatalogue,catalogueRows} from '../src/catalogue-model.js';
const catalogue=await buildCatalogue({check:true});
function universities(){return catalogue.universities.map(university=>({...university,programs:catalogue.programs.filter(program=>program.universityId===university.id).map(({universityId,...program})=>program)}));}
function validate(details){return compileCatalogue(universities(),catalogue.admissions,catalogue.applicantPolicies,details);}

test('every real programme has explicit partial extraction coverage and official links',()=>{
  assert.equal(catalogue.admissionDetails.length,8);
  const rows=catalogueRows(catalogue).filter(row=>row.admission.dataType==='real');
  assert.equal(new Set(rows.map(row=>row.programId)).size,31);
  for(const row of rows){assert.ok(row.admissionDetails);assert.equal(row.admissionDetails.coverage,'partial');assert.ok(row.url);}
});
test('SIM document provenance and update dates stay separate from intake applicability',()=>{
  for(const record of catalogue.admissionDetails){for(const source of record.sources.filter(source=>source.url.includes('amazonaws.com'))){assert.ok(source.linkedFrom.startsWith('https://www.sim.edu.sg/'));assert.ok(source.updatedAt);assert.match(source.applicability,/current|Current/);}}
  const buffalo=catalogue.admissionDetails.find(record=>record.id==='buffalo-admission-details');
  assert.equal(buffalo.sources.find(source=>source.id==='international-criteria').updatedAt,'2026-08');
  assert.match(buffalo.requirements.find(entry=>entry.label.startsWith('India')).text,/70%/);
  assert.ok(buffalo.requirements.some(entry=>entry.status==='not-extracted'));
});
test('unlinked cloud documents, spoofed domains and unsupported extraction claims fail validation',()=>{
  let records=structuredClone(catalogue.admissionDetails);const source=records.find(record=>record.id==='buffalo-admission-details').sources.find(source=>source.id==='international-criteria');source.linkedFrom=null;
  assert.throws(()=>validate(records),/URL|parent/);
  records=structuredClone(catalogue.admissionDetails);records[0].sources[0].url='https://nus.edu.sg.evil.example/requirements';assert.throws(()=>validate(records),/official institution/);
  records=structuredClone(catalogue.admissionDetails);records[0].requirements[0].sourceIds=[];assert.throws(()=>validate(records),/need evidence/);
  records=structuredClone(catalogue.admissionDetails);records.pop();assert.throws(()=>validate(records),/Every real programme/);
});
