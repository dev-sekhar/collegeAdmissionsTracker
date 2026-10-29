import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOption, loadCustomOptions } from '../src/preferences.js';
test('normalizes spacing and rejects blank or case-insensitive duplicates', () => {
  assert.equal(validateOption('  New   Zealand ', []).value, 'New Zealand');
  assert.equal(validateOption(' canada ', ['Canada']).value, undefined);
  assert.equal(validateOption('   ', []).value, undefined);
});
test('restores valid custom entries and tolerates invalid or blocked storage', () => {
  const storage = { getItem: () => JSON.stringify({ countries: ['Japan', 'japan', 'Canada', null], subjects: ['Physics'] }) };
  assert.deepEqual(loadCustomOptions(storage), { countries: ['Japan'], subjects: ['Physics'] });
  assert.deepEqual(loadCustomOptions({ getItem() { throw Error('blocked'); } }), { countries: [], subjects: [] });
});
