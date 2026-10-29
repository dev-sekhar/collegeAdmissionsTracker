import { choiceField, programCard, deadlineStage, element } from './components.js';
import { programs, filterPrograms } from './data.js';

const form = document.querySelector('#preferences');
const filterContainer = document.querySelector('#filters');
[
  { name: 'countries', label: 'Study destinations', options: ['Canada', 'United Kingdom'], selected: ['Canada', 'United Kingdom'], multiple: true },
  { name: 'subjects', label: 'Subjects', options: ['Computer Science', 'Business'], selected: ['Computer Science'], multiple: true },
  { name: 'degree', label: 'Degree level', options: ['Bachelor’s', 'Master’s', 'PhD'], selected: ['Master’s'] },
  { name: 'intake', label: 'Target intake', options: ['Autumn 2027', 'Spring 2028'], selected: ['Autumn 2027'] },
].forEach(config => filterContainer.append(choiceField(config)));

let selectedId;
let matches = [];
function renderTimeline() {
  const container = document.querySelector('#timeline');
  const program = matches.find(item => item.id === selectedId);
  container.replaceChildren();
  if (!program) {
    const heading = element('h2', '', 'No program selected');
    heading.id = 'timeline-title';
    container.append(heading, element('p', 'muted', 'Choose preferences with a matching sample program to see its timeline.'));
    return;
  }
  const heading = element('h2', '', program.institution);
  heading.id = 'timeline-title';
  container.append(element('p', 'eyebrow accent', 'ILLUSTRATIVE ADMISSION TIMELINE'), heading, element('p', 'program-subtitle', `${program.title} · ${program.intake}`), element('p', 'category-note', 'International applicant category · Applicability unconfirmed'));
  const stages = element('ol', 'stages');
  program.stages.forEach(stage => stages.append(deadlineStage(stage)));
  container.append(stages);
  const evidence = element('details', 'evidence');
  evidence.append(element('summary', '', 'Evidence and verification'), element('p', 'muted', 'These are fictional examples, with no source evidence or verification date. Later steps will show official source links, supporting passages and the last successful check. No cutoff times or timezone conversions are inferred.'));
  container.append(evidence);
}
function renderCards() {
  const list = document.querySelector('#programs');
  list.replaceChildren();
  matches.forEach(program => list.append(programCard(program, program.id === selectedId, () => {
    selectedId = program.id;
    // Preserve keyboard focus by updating button state in place.
    [...list.children].forEach((card, i) => card.setAttribute('aria-pressed', String(matches[i].id === selectedId)));
    renderTimeline();
  })));
  if (!matches.length) list.append(element('p', 'empty-state', 'No sample programs match these preferences. Try another subject, degree or intake.'));
  renderTimeline();
}
function search(event) {
  event?.preventDefault();
  const values = new FormData(form);
  const countries = values.getAll('countries');
  const subjects = values.getAll('subjects');
  const error = document.querySelector('#form-error');
  if (!countries.length || !subjects.length) {
    error.textContent = 'Select at least one study destination and one subject. Previous results have not changed.';
    error.hidden = false;
    return;
  }
  error.hidden = true;
  matches = filterPrograms(programs, { countries, subjects, degree: values.get('degree'), intake: values.get('intake') });
  if (!matches.some(program => program.id === selectedId)) selectedId = matches[0]?.id;
  document.querySelector('#result-count').textContent = `${matches.length} sample ${matches.length === 1 ? 'program' : 'programs'}`;
  document.querySelector('#result-summary').textContent = `${countries.join(' + ')} · ${subjects.join(', ')} · ${values.get('degree')} · ${values.get('intake')}`;
  document.querySelector('#results-announcement').textContent = `${matches.length} sample programs found.`;
  renderCards();
}
form.addEventListener('submit', search);
search();
