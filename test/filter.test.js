import test from 'node:test';
import assert from 'node:assert/strict';
import { programs, filterPrograms } from '../src/data.js';
const base = { countries: ['Canada', 'United Kingdom'], subjects: ['Computer Science'], degree: 'Master’s', intake: 'Autumn 2027' };
test('multiple destinations and subjects include all applicable sample programs', () => {
  assert.equal(filterPrograms(programs, base).length, 2);
  assert.equal(filterPrograms(programs, { ...base, subjects: ['Computer Science', 'Business'] }).length, 3);
});
test('country, degree and intake constraints cannot leak unrelated results', () => {
  assert.deepEqual(filterPrograms(programs, { ...base, countries: ['Canada'] }).map(p => p.id), ['northbridge-cs']);
  assert.equal(filterPrograms(programs, { ...base, degree: 'Bachelor’s' }).length, 0);
  assert.equal(filterPrograms(programs, { ...base, intake: 'Spring 2028' }).length, 0);
});
