import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {withinQsLimit,validateQsSnapshot,catalogueRows,filterRows} from '../src/catalogue-model.js';
const catalogue=await buildCatalogue({check:true});
test('official QS snapshot contains the complete top-100 list including both rank-100 ties',()=>{
  const snapshot=catalogue.qsRankings;assert.equal(snapshot.edition,2027);assert.equal(snapshot.checkedAt,'2026-11-22');assert.equal(snapshot.universities.length,102);assert.match(snapshot.universities[0].name,/Massachusetts/);assert.equal(snapshot.universities.filter(entry=>entry.rank==='=100').length,2);assert.equal(snapshot.universities.find(entry=>entry.name==='University of Amsterdam').rank,'60');
  const bad=structuredClone(snapshot);bad.universities.pop();assert.throws(()=>validateQsSnapshot(bad),/Incomplete/);const duplicate=structuredClone(snapshot);duplicate.universities[1].name=duplicate.universities[0].name;assert.throws(()=>validateQsSnapshot(duplicate),/duplicate/);
  assert.ok(snapshot.universities.every(entry=>typeof entry.country==='string'&&entry.country.length>0));const missing=structuredClone(snapshot);delete missing.universities[0].country;assert.throws(()=>validateQsSnapshot(missing),/country/);
  assert.equal(snapshot.universities.find(entry=>entry.name==='Duke University').country,'United States');assert.equal(snapshot.universities.find(entry=>entry.name==='Durham University').country,'United Kingdom');
});
test('QS ceiling is inclusive and conservative for ties, bands and unavailable ranks',()=>{
  const rank=(rank,status='verified')=>({rank,status});assert.equal(withinQsLimit(rank('=100'),'100'),true);assert.equal(withinQsLimit(rank('101'),'100'),false);assert.equal(withinQsLimit(rank('101-150'),'125'),false);assert.equal(withinQsLimit(rank('101-150'),'150'),true);assert.equal(withinQsLimit(rank(null,'not-verified'),'100'),false);assert.equal(withinQsLimit(undefined,''),true);
  const rows=catalogueRows(catalogue);const filters={countries:['Singapore'],subjects:['Economics','Criminology'],degree:'Bachelor’s',intake:'',qsLimit:'100'};assert.deepEqual([...new Set(filterRows(rows,filters).map(row=>row.universityId))].sort(),['sg-ntu','sg-nus']);
});
