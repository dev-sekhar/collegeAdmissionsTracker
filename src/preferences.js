export const storageKey = 'admissions-custom-options-v1';
export const defaults = { countries: ['Canada', 'United Kingdom', 'Singapore', 'Australia', 'Netherlands', 'Germany'], subjects: ['Computer Science', 'Business'] };
export function normalizeOption(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/gu, ' ') : '';
}
export function validateOption(raw, options) {
  const value = normalizeOption(raw);
  if (!value) return { message: 'Enter a name before adding.' };
  if (value.length > 80) return { message: 'Use 80 characters or fewer.' };
  if (options.some(option => option.toLocaleLowerCase() === value.toLocaleLowerCase())) return { message: 'This option already exists.' };
  return { value };
}
export function loadCustomOptions(storage) {
  const custom = { countries: [], subjects: [] };
  try {
    const saved = JSON.parse(storage.getItem(storageKey));
    for (const name of Object.keys(custom)) {
      if (!Array.isArray(saved?.[name])) continue;
      for (const raw of saved[name]) {
        const result = validateOption(raw, [...defaults[name], ...custom[name]]);
        if (result.value) custom[name].push(result.value);
      }
    }
  } catch { /* Unavailable or malformed storage must not prevent using the dashboard. */ }
  return custom;
}
