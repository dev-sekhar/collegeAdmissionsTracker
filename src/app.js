import { choiceField, programCard, deadlineStage, element, discoveryPanel, sourceLink, collectedDeadlinePanel, choiceOption } from './components.js';
import { programs, filterPrograms } from './data.js';
import { defaults, loadCustomOptions, storageKey, validateOption } from './preferences.js';
import { matchesDiscovery, countryName, degreeFromTitle } from './discovery.js';
import { admissionStages } from './deadlines.js';
import { publishedIntake } from './verification.js';
import {applicantPanel} from './applicant-panel.js';
import {loadProfile,emptyProfile,applyContext,profileStorageKey} from './applicant.js';
import {collectionProgress,programIntakePanel,intakeMonthField} from './components.js';
import {intakeGroup} from './coverage.js';

const form = document.querySelector('#preferences');
const filterContainer = document.querySelector('#filters');
document.querySelector('#discovery-mount').append(discoveryPanel());
let storage;
try { storage = window.localStorage; } catch { /* Session-only fallback. */ }
const custom = loadCustomOptions(storage);
const localTimezone=Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
const loadedApplicant=loadProfile(storage,localTimezone);
let applicantProfile=loadedApplicant.profile;
let rememberApplicant=loadedApplicant.remember;
function addOption(name, raw) {
  const result = validateOption(raw, [...defaults[name], ...custom[name]], name);
  if (!result.value) return result;
  custom[name].push(result.value);
  let saved = false;
  try { storage.setItem(storageKey, JSON.stringify(custom)); saved = true; } catch { /* Keep the option usable for this session. */ }
  return { value: result.value, message: saved ? 'Added and selected. Saved in this browser. Click Find programs to apply.' : 'Added and selected for this session only; browser storage is unavailable. Click Find programs to apply.' };
}
[
  { name: 'countries', label: 'Study destinations', options: [...defaults.countries, ...custom.countries], selected: defaults.countries, multiple: true, onAdd: value => addOption('countries', value) },
  { name: 'subjects', label: 'Subjects', options: [...defaults.subjects, ...custom.subjects], selected: ['Computer Science'], multiple: true, onAdd: value => addOption('subjects', value) },
  { name: 'degree', label: 'Degree level', options: ['Bachelor’s', 'Master’s', 'PhD'], selected: ['Master’s'] },
  { name: 'intake', label: 'Target intake', options: ['Autumn 2027', 'Spring 2028'], selected: ['Autumn 2027'] },
].forEach(config => filterContainer.append(choiceField(config)));

let selectedId;
let matches = [];
let catalogue = null;
let deadlineReport = null;
let verificationReport = null;
let collectionRunning=false;
let requestedMonth='';
let appliedPreferences;
const discoveryToggle = document.querySelector('#use-discovery');
discoveryToggle.disabled = false;
discoveryToggle.checked = true;
let intakeMode='sample';
const modeIntakes={sample:'Autumn 2027',discovered:''};
function syncIntakeChoices(){
  const mode=discoveryToggle.checked?'discovered':'sample';
  const monthField=document.querySelector('#search-month-field');if(monthField)monthField.hidden=mode==='sample';
  const group=document.querySelector('input[name="intake"]').closest('fieldset');
  modeIntakes[intakeMode]=group.querySelector('input:checked')?.value||'';
  const published=[...new Set((deadlineReport?.programs||[]).flatMap(entry=>entry.candidates.map(record=>publishedIntake(record.context))).filter(Boolean))].sort((a,b)=>Date.parse(`1 ${a}`)-Date.parse(`1 ${b}`));
  const options=mode==='discovered'?['',...new Set(['Spring 2028',...published,...(requestedMonth?[requestedMonth]:[])])]:['Autumn 2027','Spring 2028'];
  let selected=modeIntakes[mode];
  if(!options.includes(selected))selected=mode==='sample'?'Autumn 2027':'';
  const existing=[...group.querySelectorAll('input')].map(input=>input.value);
  if(JSON.stringify(existing)!==JSON.stringify(options))group.querySelector('.choices').replaceChildren(...options.map(value=>choiceOption({name:'intake',value,label:value||'Choose a published intake',checked:value===selected})));
  else if(intakeMode!==mode)group.querySelectorAll('input').forEach(input=>{input.checked=input.value===selected;});
  modeIntakes[mode]=selected;intakeMode=mode;
}
function currentPreferences() {
  const values = new FormData(form);
  return { countries: values.getAll('countries'), subjects: values.getAll('subjects'), degree: values.get('degree'), intake: values.get('intake') };
}
document.querySelector('#download-request').addEventListener('click', () => {
  const request = currentPreferences();
  if (!request.countries.length || !request.subjects.length) { search(); return; }
  if(!request.intake){const error=document.querySelector('#form-error');error.textContent='Choose an intake before downloading a discovery request.';error.hidden=false;return;}
  const url = URL.createObjectURL(new Blob([JSON.stringify(request, null, 2)], { type: 'application/json' }));
  const link = element('a'); link.href = url; link.download = 'discovery-request.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  document.querySelector('#discovery-status').textContent = 'Request downloaded. Run the command with its saved file path, then reload. Adding a country does not configure its source automatically.';
});
discoveryToggle.addEventListener('change', () => search());
async function loadCatalogue() {
  const status = document.querySelector('#discovery-status');
  try {
    // Reads a static local file written by the CLI, not an external API.
    const response = await fetch('./data/latest.json', { cache: 'no-store' });
    if (!response.ok) { status.textContent = 'No collected catalogue yet. Choose filters and Find programs to collect official sources. Samples are available by turning off Show discovered programs.'; return; }
    const data = await response.json();
    if (data.version !== 1 || !Array.isArray(data.programs) || !Array.isArray(data.institutions) || !Array.isArray(data.coverage)) throw Error('Invalid catalogue');
    catalogue = data;
    discoveryToggle.disabled = false;
    discoveryToggle.checked = true;
    status.textContent = `${data.institutions.length} institution records · ${data.programs.length} program matches collected · Last run ${new Date(data.finishedAt).toLocaleString()}. Collected subjects: ${data.request.subjects.join(', ')} · ${data.request.degree}. Partial discovery coverage; institution provenance is listed below. Recognition and personal applicability are not assessed.`;
    const coverage = document.querySelector('#coverage');
    coverage.replaceChildren();
    data.coverage.forEach(item => coverage.append(element('p', 'coverage-item', `${item.country}: ${item.status} · ${item.institutions} institutions · ${item.cataloguesChecked} catalogues checked. ${item.scope || ''} ${item.note || ''}`)));
    const institutions = document.querySelector('#institutions');
    institutions.replaceChildren();
    const list = element('ul', 'institution-list');
    data.institutions.forEach(item => {
    const row = element('li'); row.append(sourceLink(`${item.name} · ${item.country}`, item.website), document.createTextNode(` · ${item.status} · `), sourceLink(item.directoryLabel||'Directory evidence', item.directoryUrl)); list.append(row);
    });
    institutions.append(list);
    (data.failures || []).forEach(item => { const row = element('p', 'source-failure', `${item.country}: ${item.reason} `); row.append(sourceLink('Source', item.url)); institutions.append(row); });
    search();
  } catch { status.textContent = 'The local catalogue could not be read. Run discovery again; sample programs remain available.'; }
}
async function loadDeadlines() {
  const status = document.querySelector('#deadline-status');
  try {
    const response = await fetch('./data/deadlines.json', { cache:'no-store' });
    if (!response.ok) { status.textContent='No stage evidence collected yet. Run collect-deadlines after discovery.'; return; }
    const report=await response.json();
    if (report.version!==1 || !Array.isArray(report.programs)) throw Error('Invalid stage evidence');
    deadlineReport=report;
    const count=report.programs.reduce((sum,entry)=>sum+entry.candidates.length,0);
    status.textContent=`${count} stage-date records for ${report.programs.length} programs · Report finished ${new Date(report.finishedAt).toLocaleString()}. ${report.retainedPrograms||0} program reports retained from earlier runs; individual evidence timestamps remain unchanged. Source verification is assessed per selected intake.`;
    search();
  } catch { status.textContent='Stage evidence could not be loaded. Run the collector again; discovery remains available.'; }
}
async function loadVerification(){
  const status=document.querySelector('#verification-status');
  try{
    const response=await fetch('./data/verification.json',{cache:'no-store'});
    if(!response.ok){status.textContent='No source recheck report yet. Run verify-deadlines; collected dates remain unverified.';return;}
    const report=await response.json();
    if(report.version!==1||!Array.isArray(report.programs))throw Error('Invalid source checks');
    verificationReport=report;
    status.textContent=`Official-source rechecks completed ${new Date(report.finishedAt).toLocaleString()}. Checks expire after 7 days; select an exact published intake to assess records.`;
    renderTimeline();
  }catch{status.textContent='Source checks could not be read. Records remain unverified.';}
}
function renderTimeline() {
  const container = document.querySelector('#timeline');
  const program = matches.find(item => item.id === selectedId);
  container.replaceChildren();
  if (!program) {
    const heading = element('h2', '', 'No program selected');
    heading.id = 'timeline-title';
    container.append(heading, element('p', 'muted', discoveryToggle.checked?'No program selected. Run Find programs and review the coverage and source issues.':'Choose preferences with a matching sample program to see its timeline.'));
    return;
  }
  const heading = element('h2', '', program.institution);
  heading.id = 'timeline-title';
  if (program.sourceUrl) {
    container.append(element('p', 'eyebrow accent', 'DISCOVERED PROGRAM'), heading, element('p', 'program-subtitle', `${program.title} · ${program.campus ? `${program.campus} campus` : 'Campus unconfirmed'}`), element('p', 'category-note', `Requested intake: ${appliedPreferences.intake||'Not selected'} · Availability unconfirmed`));
    container.append(sourceLink('Official program page ↗', program.sourceUrl));
    const entry=deadlineReport?.programs.find(entry=>entry.programId===program.id && entry.programUrl===program.sourceUrl);
    const checks=verificationReport?.programs.find(result=>result.programId===program.id&&result.programUrl===program.sourceUrl)?.checks;
    container.append(programIntakePanel(entry,appliedPreferences.intake));
    container.append(collectedDeadlinePanel(entry,appliedPreferences.intake,admissionStages,checks,{profile:applicantProfile,program,entry}));
    const evidence = element('details', 'evidence');
    const degreeText = program.degreeEvidence || program.evidence;
    const degreePassage = degreeText.split('\n').find(line => degreeFromTitle(line) === program.degree)?.trim() || degreeText;
    evidence.append(element('summary', '', 'Discovery evidence'), element('p', 'muted', `Program page title or heading: “${program.evidence}” · Checked ${new Date(program.checkedAt).toLocaleString()}`), element('p', 'muted', `Degree evidence: ${degreePassage.length > 240 ? `${degreePassage.slice(0,240)}…` : degreePassage}`), sourceLink('Program catalogue', program.catalogueUrl), document.createTextNode(' · '), sourceLink('Institution source', program.directoryUrl));
    container.append(evidence);
    return;
  }
  container.append(element('p', 'eyebrow accent', 'ILLUSTRATIVE ADMISSION TIMELINE'), heading, element('p', 'program-subtitle', `${program.title} · ${program.intake}`), element('p', 'category-note', 'International applicant category · Applicability unconfirmed'));
  const stages = element('ol', 'stages');
  program.stages.forEach(stage => stages.append(deadlineStage(stage)));
  container.append(stages);
  const evidence = element('details', 'evidence');
  evidence.append(element('summary', '', 'Evidence and verification'), element('p', 'muted', 'These are fictional examples, with no source evidence or verification date. Later steps will show official source links, supporting passages and the last successful check. No cutoff times or timezone conversions are inferred.'));
  container.append(evidence);
}
function renderApplicantPanel(forceOpen=false){
  const mount=document.querySelector('#applicant-context-mount');
  const open=forceOpen||Boolean(mount.querySelector('details')?.open);
  const selected=matches.find(item=>item.id===selectedId);
  const program=selected?.sourceUrl?selected:null;
  const entry=deadlineReport?.programs.find(entry=>entry.programId===program?.id&&entry.programUrl===program?.sourceUrl);
  mount.replaceChildren(applicantPanel({profile:applicantProfile,remember:rememberApplicant,program,entry,open,onApply(input,remember){
    const next=applyContext(applicantProfile,input,program,entry);
    applicantProfile=next;rememberApplicant=remember;
    let saved=false;
    try{if(remember){storage.setItem(profileStorageKey,JSON.stringify({version:1,profile:next}));saved=true;}else storage.removeItem(profileStorageKey);}catch{/* Context remains usable in this tab. */}
    renderTimeline();
    return remember?(saved?'Applied and saved in this browser. Category is your declaration, not an eligibility decision.':'Applied for this session; browser storage is unavailable.'):'Applied for this session only. Context is not sent with discovery requests.';
  },onClear(){
    applicantProfile=emptyProfile(localTimezone);rememberApplicant=false;
    try{storage.removeItem(profileStorageKey);}catch{/* No accessible saved context. */}
    renderTimeline();renderApplicantPanel(true);
  }}));
}
function renderCards() {
  const list = document.querySelector('#programs');
  list.replaceChildren();
  for(const group of ['Published intake evidence','Intake awaiting confirmation','Alternative published intake']){
  const grouped=discoveryToggle.checked?matches.filter(program=>intakeGroup(deadlineReport?.programs.find(entry=>entry.programId===program.id),appliedPreferences.intake)===group):group==='Intake awaiting confirmation'?matches:[];
  if(grouped.length&&discoveryToggle.checked)list.append(element('h3','intake-group',group));
  grouped.forEach(program => {
    const card=programCard(program, program.id === selectedId, () => {
    selectedId = program.id;
    // Preserve keyboard focus by updating button state in place.
    list.querySelectorAll('button[aria-pressed]').forEach(button=>button.setAttribute('aria-pressed','false'));
    card.setAttribute('aria-pressed','true');
    renderTimeline();
    renderApplicantPanel();
    });list.append(card);
  });
  }
  if (!matches.length) list.append(element('p', 'empty-state', discoveryToggle.checked ? 'No program confirmed in this bounded collection. Review source coverage and failures above. This does not mean no programs exist; Find programs runs a fresh search.' : 'No sample programs match these preferences. Try another subject, degree or intake.'));
  renderTimeline();
  renderApplicantPanel();
}
function search(event) {
  event?.preventDefault();
  syncIntakeChoices();
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
  const preferences = currentPreferences();
  appliedPreferences = preferences;
  const discovered = discoveryToggle.checked;
  matches = discovered ? (catalogue?.programs||[]).filter(program => matchesDiscovery(program, preferences)) : filterPrograms(programs, preferences);
  document.querySelector('.demo-banner').textContent = discovered ? 'Real source records · Partial coverage. Only records marked Source verified passed publication checks for the selected intake. Personal applicability remains unconfirmed.' : 'Concept preview · Fictional institutions and illustrative dates. No live admissions data.';
  document.querySelector('#data-mode-footer').textContent = discovered ? 'Step 6 · Fresh browser collection · Partial source coverage' : 'Admissions Explorer · Fictional sample programs and dates';
  if (discovered) {
    const missing = countries.filter(country => !catalogue?.coverage.some(item => item.country === countryName(country)));
    const notes = document.querySelector('#coverage');
    notes.querySelectorAll('.missing-country').forEach(node => node.remove());
    missing.forEach(country => notes.append(element('p', 'coverage-item missing-country', `${country}: Not collected in this run. Source setup may be needed.`)));
  }
  if (!matches.some(program => program.id === selectedId)) selectedId = matches[0]?.id;
  document.querySelector('#result-count').textContent = `${matches.length} ${discovered ? 'discovered' : 'sample'} ${matches.length === 1 ? 'program' : 'programs'}`;
  document.querySelector('#result-summary').textContent = `${countries.join(' + ')} · ${subjects.join(', ')} · ${values.get('degree')} · ${values.get('intake')||'Choose an intake'}`;
  document.querySelector('#results-announcement').textContent = `${matches.length} ${discovered ? 'discovered' : 'sample'} programs found.`;
  renderCards();
}
filterContainer.append(intakeMonthField(value=>{const [year,month]=value.split('-').map(Number);requestedMonth=new Intl.DateTimeFormat('en-GB',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(year,month-1,1)));modeIntakes.discovered=requestedMonth;syncIntakeChoices();document.querySelectorAll('input[name="intake"]').forEach(input=>{input.checked=input.value===requestedMonth;});}));
async function pollCollection(){
  const response=await fetch('/local-collection',{cache:'no-store'});if(!response.ok)throw Error('Local collection controller unavailable. Restart npm run dev.');
  const job=await response.json();document.querySelector('#collection-progress').replaceChildren(collectionProgress(job));
  if(job.status==='running'){
    if(!collectionRunning){collectionRunning=true;requestedMonth=job.request.intake;modeIntakes.discovered=requestedMonth;syncIntakeChoices();for(const name of ['countries','subjects','degree','intake'])form.querySelectorAll(`input[name="${name}"]`).forEach(input=>{input.checked=Array.isArray(job.request[name])?job.request[name].includes(input.value):job.request[name]===input.value;});}
    form.querySelectorAll('input,button').forEach(control=>control.disabled=true);
    setTimeout(()=>pollCollection().catch(collectionError),2000);return;
  }
  if(collectionRunning){collectionRunning=false;form.querySelectorAll('input,button').forEach(control=>control.disabled=false);await loadCatalogue();await loadDeadlines();await loadVerification();}
}
function collectionError(error){collectionRunning=false;form.querySelectorAll('input,button').forEach(control=>control.disabled=false);document.querySelector('#collection-progress').textContent=error.message;}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(collectionRunning)return;
  if(!discoveryToggle.checked){search();return;}
  search();const request=currentPreferences();if(!request.countries.length||!request.subjects.length)return;
  if(!request.intake){const error=document.querySelector('#form-error');error.textContent='Choose the target intake or enter a search month.';error.hidden=false;return;}
  try{
    const response=await fetch('/local-collection',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request)});const job=await response.json();if(!response.ok)throw Error(job.error||'Could not start local collection.');
    collectionRunning=true;form.querySelectorAll('input,button').forEach(control=>control.disabled=true);document.querySelector('#collection-progress').replaceChildren(collectionProgress(job));await pollCollection();
  }catch(error){collectionError(error);}
});
search();
loadCatalogue();
loadDeadlines();
loadVerification();
pollCollection().catch(collectionError);
