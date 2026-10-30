import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalUrl, institutionRecords, sources, subjectMatches, degreeFromTitle, validateRequest, matchesDiscovery, countryName } from '../src/discovery.js';
test('directory parsing deduplicates entries while preserving distinct campus paths', () => {
  const links = [{ text: 'Example University', href: 'https://www.example.ca/' }, { text: 'Example University', href: 'https://example.ca/#top' }, { text: 'Example College', href: 'https://example.ca/college' }, { text: 'Facebook', href: 'https://facebook.com/' }];
  assert.equal(institutionRecords(links, 'Canada', sources.Canada, '2026-10-29').length, 2);
  assert.equal(canonicalUrl('javascript:alert(1)'), null);
});
test('subject matching respects words, aliases and literal punctuation', () => {
  assert.equal(subjectMatches('Master of Science in Computer Science', 'Computer Science'), true);
  assert.equal(subjectMatches('MSc Computing', 'Computer Science'), true);
  assert.equal(subjectMatches('Master of Science in Geophysics', 'Physics'), false);
  assert.equal(subjectMatches('Master in C++', 'C++'), true);
  assert.equal(degreeFromTitle('Master of Science in Computer Science (MSc)'), 'Master’s');
  assert.equal(degreeFromTitle('Graduate Certificate in Computing'), null);
});
test('invalid requests rejected and unconfirmed intake remains unset', () => {
  assert.throws(() => validateRequest({ countries: [], subjects: ['Physics'], degree: 'Master’s', intake: 'Autumn 2027' }));
  const preferences = { countries: ['Canada'], subjects: ['Physics'], degree: 'Master’s', intake: 'Autumn 2027' };
  const program = { country: 'Canada', subjects: ['Physics'], degree: 'Master’s', intake: null };
  assert.equal(matchesDiscovery(program, preferences), true);
  assert.equal(program.intake, null);
});
test('new countries have configured sources and Holland maps to the Netherlands', () => {
  for (const country of ['Singapore', 'Australia', 'Netherlands', 'Germany']) assert.ok(sources[country].directory.startsWith('https://'));
  assert.equal(countryName('Holland'), 'Netherlands');
  assert.equal(matchesDiscovery({ country: 'Netherlands', subjects: ['Physics'], degree: 'Master’s' }, { countries: ['Holland'], subjects: ['Physics'], degree: 'Master’s' }), true);
});
