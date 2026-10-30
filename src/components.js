export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function sourceLink(label, href) {
  const link = element('a', '', label);
  link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
  return link;
}

export function discoveryPanel() {
  const panel = element('section', 'discovery-panel');
  panel.setAttribute('aria-labelledby', 'discovery-title');
  panel.innerHTML = `
    <h2 id="discovery-title">Institution &amp; program discovery</h2>
    <p class="muted">Find programs runs fresh local browser discovery, collects admission evidence and rechecks official sources. Coverage is bounded to configured public catalogues; an empty result does not establish that no programs exist. No external service APIs are used.</p>
    <div class="discovery-actions"><button id="download-request" type="button" class="add-button">Download discovery request</button><label><input type="checkbox" id="use-discovery"> Show discovered programs</label></div>
    <code>npm run discover -- "path/to/discovery-request.json"</code>
    <p class="muted">Collect admission-stage dates after discovery:</p>
    <code>npm run collect-deadlines</code>
    <p class="muted">Recheck official sources before treating dates as verified:</p>
    <code>npm run verify-deadlines</code>
    <p id="verification-status" role="status" class="muted">Loading source checks…</p>
    <p id="deadline-status" role="status" class="muted">Loading local stage evidence…</p>
    <p id="discovery-status" role="status" class="muted">Loading local catalogue…</p>
    <div id="collection-progress"></div>
    <div id="coverage"></div>
    <details><summary>Institution directory &amp; source issues</summary><div id="institutions"></div></details>`;
  return panel;
}

export function collectedDeadlinePanel(entry, intake, stages, checks, applicantContext) {
  const panel = element('section', 'collected-deadlines');
  panel.setAttribute('aria-label', 'Collected admission-stage evidence');
  panel.append(element('h3', '', 'Admission-stage evidence'));
  if (!entry) {
    panel.append(element('p', 'muted', emptyStage(entry)));
    return panel;
  }
  const assessed=assessRecords(entry.candidates,checks,intake);
  const verified=assessed.filter(record=>record.assessment.status==='Source verified').length;
  const targetIntake=publishedIntake(intake);
  const excluded=assessed.filter(record=>targetIntake&&record.assessment.sourceIntake&&record.assessment.sourceIntake!==targetIntake);
  panel.append(element('p','verification-summary',`${verified} source-verified records · ${assessed.length-verified-excluded.length} need review · ${excluded.length} for other intakes`));
  panel.append(element('p', 'review-notice', 'Source verified means the official publication was rechecked for this exact intake. Your applicant category, admission round where unspecified, and cutoff timezone remain unconfirmed. No eligibility decision is made.'));
  const list = element('ol', 'collected-stage-list');
  for (const [id, name] of stages) {
    const row = element('li');
    const records = assessed.filter(record => record.stage === id && !excluded.includes(record));
    row.append(element('h4', '', name));
    if (!records.length) row.append(element('p', 'muted', emptyStage(entry,id)));
    for (const record of records) {
      row.append(verifiedDateRecord(record,applicantContext));
    }
    list.append(row);
  }
  panel.append(list);
  if(excluded.length){const other=element('details','evidence');other.append(element('summary','',`${excluded.length} records excluded: different intake`));excluded.forEach(record=>other.append(verifiedDateRecord(record,applicantContext)));panel.append(other);}
  if (entry.sources.length) {
    const sources = element('details', 'evidence'); sources.append(element('summary','','Sources checked'));
    entry.sources.forEach(source=>{const p=element('p');p.append(sourceLink(source.url,source.url));sources.append(p);});panel.append(sources);
  }
  entry.failures.forEach(failure=>{const p=element('p','source-failure',`Source could not be collected: ${failure.reason} `);p.append(sourceLink('Source',failure.url));panel.append(p);});
  return panel;
}

export function verifiedDateRecord(record,applicantContext) {
  const detail=element('details','date-record');
  detail.append(element('summary','',`${record.assessment.status} · ${record.value.length>160?`${record.value.slice(0,160)}…`:record.value} · ${record.context||'Intake not specified'} · ${record.applicantCategory}${record.assessment.round?` · ${record.assessment.round}`:''}`),element('p','muted',record.assessment.reason),element('p','date-evidence',record.evidence),element('p','muted',`Collected ${new Date(record.checkedAt).toLocaleString()} · Source recheck: ${record.assessment.checkedAt?new Date(record.assessment.checkedAt).toLocaleString():'Not checked'} · ${record.extraction} · Cutoff timezone not established`),sourceLink('Official source ↗',record.sourceUrl));
  if(applicantContext){detail.append(element('p','applicant-record-note',categoryNote(record,applicantContext.profile,applicantContext.program,applicantContext.entry)),element('p','muted',localDeadline(record,applicantContext.profile.timezone)));}
  return detail;
}

export function choiceOption({name,value,label=value,checked=false,multiple=false}) {
  const row=element('label','choice');const input=document.createElement('input');
  input.type=multiple?'checkbox':'radio';input.name=name;input.value=value;input.checked=checked;
  row.append(input,element('span','',label));return row;
}

// Shared input component for all dashboard preferences.
export function choiceField({ name, label, options, selected, multiple = false, onAdd }) {
  const group = element('fieldset', 'choice-field');
  group.append(element('legend', '', label));
  const choices = element('div', 'choices');
  function appendChoice(value, checked) {
    choices.append(choiceOption({name,value,checked,multiple}));
  }
  options.forEach(value => appendChoice(value, selected.includes(value)));
  group.append(choices);
  if (onAdd) group.append(addOptionControl({ name, label: name === 'countries' ? 'country' : 'subject', onAdd(value) {
    const result = onAdd(value);
    if (result.value) appendChoice(result.value, true);
    return result;
  } }));
  return group;
}

export function addOptionControl({ name, label, onAdd }) {
  const container = element('div', 'add-option');
  const inputLabel = element('label', 'add-label', `New ${label}`);
  const input = document.createElement('input');
  input.type = 'text';
  input.id = `new-${name}`;
  input.maxLength = 80;
  input.autocomplete = 'off';
  inputLabel.htmlFor = input.id;
  const row = element('div', 'add-row');
  const button = element('button', 'add-button', 'Add');
  button.type = 'button';
  button.setAttribute('aria-label', `Add ${label}`);
  const message = element('p', 'add-message');
  message.id = `${input.id}-message`;
  message.setAttribute('role', 'status');
  input.setAttribute('aria-describedby', message.id);
  function add() {
    const result = onAdd(input.value);
    message.textContent = result.message;
    input.setAttribute('aria-invalid', String(!result.value));
    if (result.value) input.value = '';
    input.focus();
  }
  button.addEventListener('click', add);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); add(); }
  });
  row.append(input, button);
  container.append(inputLabel, row, message);
  return container;
}

export function programCard(program, selected, onSelect) {
  const button = element('button', 'program-card');
  button.type = 'button';
  button.setAttribute('aria-pressed', String(selected));
  button.append(element('span', 'program-country', program.country), element('strong', '', program.institution), element('span', '', program.title), element('span', 'muted', `${program.degree} · ${program.sourceUrl ? `${program.campus || 'Campus unconfirmed'} · Intake unconfirmed` : program.intake}`));
  button.addEventListener('click', onSelect);
  return button;
}

export function deadlineStage(stage) {
  const item = element('li', 'stage');
  const content = element('div');
  content.append(element('h3', '', stage.name), element('span', 'muted', stage.kind));
  const date = element('div', 'stage-date', stage.value);
  if (stage.iso) {
    const time = element('time', '', stage.value);
    time.dateTime = stage.iso;
    date.replaceChildren(time);
  }
  item.append(content, date);
  return item;
}
import { assessRecords, publishedIntake } from './verification.js';
import {categoryNote,localDeadline} from './applicant.js';
import {emptyStage,intakeGroup} from './coverage.js';

export function programIntakePanel(entry,target){
  const panel=element('details','evidence');panel.append(element('summary','',intakeGroup(entry,target)));
  panel.append(element('p','muted','Program start evidence is separate from deadline verification. A request or university-wide calendar does not establish this program’s intake.'));
  for(const item of entry?.intakes||[]){const row=element('p','',`${item.intake}: ${item.text} · Collected ${new Date(item.checkedAt).toLocaleString()} `);row.append(sourceLink('Official intake passage',item.sourceUrl));panel.append(row);}
  return panel;
}

export function collectionProgress(job){
  const panel=element('section','collection-progress');panel.setAttribute('aria-label','Collection progress');
  const status=element('p','',`${job.status} · ${job.phase||'Waiting'}${job.startedAt?` · Started ${new Date(job.startedAt).toLocaleString()}`:''}`);status.setAttribute('role','status');panel.append(status);
  if(job.request)panel.append(element('p','muted',`${job.request.countries.join(', ')} · ${job.request.subjects.join(', ')} · ${job.request.degree} · ${job.request.intake}`));
  if(job.status==='running')panel.append(element('p','muted','Collection is running. Results below are from previous local reports until this run finishes.'));
  if(job.status==='completed')panel.append(element('p','muted','Collection finished. Coverage remains partial; inspect source issues and unconfirmed intakes before relying on a date.'));
  if(job.logs?.length){const detail=element('details');detail.append(element('summary','','Collection log'));detail.append(element('pre','collection-log',job.logs.join('\n')));panel.append(detail);}
  return panel;
}
export function intakeMonthField(onChange){
  const field=element('label','context-field','Search a different intake month');field.id='search-month-field';
  const input=document.createElement('input');input.type='month';input.id='search-intake-month';input.min='2026-01';input.max='2040-12';
  input.addEventListener('change',()=>{if(input.value)onChange(input.value);});field.append(input);return field;
}
