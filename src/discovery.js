// Country-specific public HTML sources. Membership is not accreditation evidence.
export const sources = {
  Canada: {
    directory: 'https://univcan.ca/about-universities-canada/our-members/',
    label: 'Universities Canada member directory',
    selector: '#content li a[href]',
    domainSuffix: '.ca',
  },
  'United Kingdom': {
    directory: 'https://www.universitiesuk.ac.uk/about-us/our-members',
    label: 'Universities UK member directory',
    selector: 'main a[href]',
    domainSuffix: '.ac.uk',
  },
  Singapore: { directory: 'https://www.moe.gov.sg/post-secondary/overview/autonomous-universities', label: 'Singapore MOE autonomous universities', selector: 'a[href*="/post-secondary/overview/autonomous-universities/"]', domainSuffix: '.edu.sg', profiles: true, scope: 'Autonomous universities only.' },
  Australia: { directory: 'https://www.studyaustralia.gov.au/en/plan-your-studies/list-of-australian-universities', label: 'Australian Government Study Australia university directory', selector: '.cmp-accordion__item a[href]', domainSuffix: '.edu.au', scope: 'Listed universities only; other education providers are not covered.' },
  Netherlands: { directory: 'https://www.studyinnl.org/dutch-education/research-universities', label: 'Nuffic Study in NL research university directory', selector: 'main a.ext', domainSuffix: ['.nl', '.edu'], scope: 'Research universities only; universities of applied sciences are not yet covered.' },
  Germany: { directory: 'https://www.hrk.de/hrk/mitglieder/universitaeten/', label: 'German Rectors’ Conference university member directory', selector: 'main a[title*="Website"],main a[title*="Webseite"]', domainSuffix: ['.de', '.edu', '.berlin', '.university'], scope: 'HRK university members only; other institution types are not yet covered.' },
};

export function countryName(value) {
  return /^(holland|the netherlands|netherlands)$/iu.test(value.trim()) ? 'Netherlands' : value.trim();
}

export function canonicalUrl(raw) {
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.protocol = 'https:';
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (key.startsWith('utm_')) url.searchParams.delete(key);
    return url.href.replace(/\/$/u, '');
  } catch { return null; }
}
export function institutionRecords(links, country, source, checkedAt) {
  const records = new Map();
  for (const link of links) {
    const url = canonicalUrl(link.href);
    const name = link.text?.replace(/\(link is external\)|'s website/giu, '').trim().replace(/\s+/gu, ' ');
    if (!url || !name || name.length > 200) continue;
    const host = new URL(url).hostname.replace(/^www\./u, '');
    const suffixes = Array.isArray(source.domainSuffix) ? source.domainSuffix : [source.domainSuffix];
    if (!suffixes.some(suffix => host.endsWith(suffix)) || host === new URL(source.directory).hostname.replace(/^www\./u, '')) continue;
    // Include named directory members, not navigation or social links.
    if (!/(universit|college|polytech|école|institut|hec montr|hochschule|kit karlsruhe|tias school|vu amsterdam)/iu.test(name)) continue;
    const id = `${country}:${name.toLocaleLowerCase()}:${host}:${new URL(url).pathname.replace(/\/$/u, '')}`;
    if (!records.has(id)) records.set(id, { id, name, country, website: url, directoryUrl: source.directory, directoryLabel: source.label, checkedAt, status: 'Directory-listed; recognition not assessed' });
  }
  return [...records.values()];
}
const aliases = { 'Computer Science': ['computer science', 'computing', 'informatics'], Business: ['business', 'management', 'commerce'] };
export function subjectMatches(title, subject) {
  return (aliases[subject] || [subject]).some(alias => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
    return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}([^\\p{L}\\p{N}]|$)`, 'iu').test(title);
  });
}
export function degreeFromTitle(title) {
  if (/\b(master|msc|meng|mba|mphil)\b|\bM\.Sc\./iu.test(title)) return 'Master’s';
  if (/\b(doctor of philosophy|phd|ph\.d\.)\b/iu.test(title)) return 'PhD';
  if (/\b(bachelor|bsc|beng)\b|\bB\.Sc\./iu.test(title)) return 'Bachelor’s';
  return null;
}
export function validateRequest(request) {
  if (!request || !['Master’s', 'Bachelor’s', 'PhD'].includes(request.degree)
    || typeof request.intake !== 'string' || !request.intake.trim()) throw Error('Select a degree and intake.');
  for (const key of ['countries', 'subjects']) {
    if (!Array.isArray(request[key]) || !request[key].length || request[key].length > 30
      || request[key].some(value => typeof value !== 'string' || !value.trim() || value.length > 80)) throw Error(`Invalid ${key}. Select 1–30 names of up to 80 characters.`);
  }
  return request;
}
export function programEvidence(headings,pageTitle,mainText,subjects,degree){
  const titles=[...headings,pageTitle.split('|')[0]].map(text=>text.replace(/\s+/gu,' ').trim());
  const heading=titles.find(text=>subjects.some(subject=>subjectMatches(text,subject))&&(!degreeFromTitle(text)||degreeFromTitle(text)===degree));
  if(!heading)return null;
  const degreePassage=degreeFromTitle(heading)===degree?heading:mainText.slice(0,12000).split('\n').find(line=>degreeFromTitle(line)===degree)?.trim();
  return degreePassage?{heading,degreePassage}:null;
}
export function matchesDiscovery(program, preferences) {
  return preferences.countries.map(countryName).includes(program.country) && program.subjects.some(subject => preferences.subjects.includes(subject)) && program.degree === preferences.degree;
}
