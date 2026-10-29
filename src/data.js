const dates = (open, close, documents) => [
  { name: 'Applications open', value: open.label, iso: open.iso, kind: 'Illustrative date' },
  { name: 'Application submission', value: close.label, iso: close.iso, kind: 'Illustrative date · Time unspecified' },
  { name: 'Supporting documents', value: documents.label, iso: documents.iso, kind: 'Illustrative date · Time unspecified' },
  { name: 'Interview', value: 'Not yet announced', kind: 'Sample unpublished stage' },
  { name: 'Offer acceptance', value: 'Within 14 days of offer', kind: 'Illustrative relative rule' },
  { name: 'Deposit payment', value: 'Not yet announced', kind: 'Sample unpublished stage' },
  { name: 'Enrolment', value: 'Not yet announced', kind: 'Sample unpublished stage' },
];
const date = (label, iso) => ({ label, iso });
export const programs = [
  { id: 'northbridge-cs', institution: 'Northbridge University', country: 'Canada', subject: 'Computer Science', degree: 'Master’s', title: 'MSc Computer Science', intake: 'Autumn 2027', stages: dates(date('01 Nov 2026', '2026-11-01'), date('15 Jan 2027', '2027-01-15'), date('01 Feb 2027', '2027-02-01')) },
  { id: 'westhaven-cs', institution: 'Westhaven University', country: 'United Kingdom', subject: 'Computer Science', degree: 'Master’s', title: 'MSc Computing', intake: 'Autumn 2027', stages: dates(date('15 Oct 2026', '2026-10-15'), date('31 Mar 2027', '2027-03-31'), date('15 Apr 2027', '2027-04-15')) },
  { id: 'maple-business', institution: 'Maple Coast College', country: 'Canada', subject: 'Business', degree: 'Bachelor’s', title: 'Bachelor of Business', intake: 'Autumn 2027', stages: dates(date('01 Dec 2026', '2026-12-01'), date('01 Apr 2027', '2027-04-01'), date('15 Apr 2027', '2027-04-15')) },
  { id: 'westhaven-business', institution: 'Westhaven University', country: 'United Kingdom', subject: 'Business', degree: 'Master’s', title: 'MSc Business Management', intake: 'Autumn 2027', stages: dates(date('01 Nov 2026', '2026-11-01'), date('01 May 2027', '2027-05-01'), date('15 May 2027', '2027-05-15')) },
];

export function filterPrograms(data, preferences) {
  return data.filter(program => preferences.countries.includes(program.country)
    && preferences.subjects.includes(program.subject)
    && program.degree === preferences.degree && program.intake === preferences.intake);
}
