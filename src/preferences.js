export const storageKey = 'admissions-custom-options-v1';
export const defaults = { countries: ['Canada', 'United Kingdom', 'Singapore', 'Australia', 'Netherlands', 'Germany'], subjects: ['Computer Science', 'Business'] };
export function normalizeOption(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : '';
}
export function validateOption(raw, options, type) {
  const normalize = value => type === 'countries' ? countryName(normalizeOption(value)) : normalizeOption(value);
  const value = normalize(raw);
  if (!value) return { message: 'Enter a name before adding.' };
  if (value.length > 80) return { message: 'Use 80 characters or fewer.' };
  if (options.some(option => normalize(option).toLocaleLowerCase() === value.toLocaleLowerCase())) return { message: type === 'countries' && value === 'Netherlands' ? 'Netherlands already exists. Holland is the same destination.' : 'This option already exists.' };
  return { value };
}
export function loadCustomOptions(storage) {
  const custom = { countries: [], subjects: [] };
  try {
    const saved = JSON.parse(storage.getItem(storageKey));
    for (const name of Object.keys(custom)) {
      if (!Array.isArray(saved?.[name])) continue;
      for (const raw of saved[name]) {
        const result = validateOption(raw, [...defaults[name], ...custom[name]], name);
        if (result.value) custom[name].push(result.value);
      }
    }
  } catch { /* Unavailable or malformed storage must not prevent using the dashboard. */ }
  return custom;
}
import { countryName } from './discovery.js';
