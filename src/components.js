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
    <p class="muted">Browser collection runs locally. Download your search request, then run the command shown below. Reload after collection to view its results. No external APIs are used.</p>
    <div class="discovery-actions"><button id="download-request" type="button" class="add-button">Download discovery request</button><label><input type="checkbox" id="use-discovery"> Show discovered programs</label></div>
    <code>npm run discover -- "path/to/discovery-request.json"</code>
    <p class="muted">Collect admission-stage dates after discovery:</p>
    <code>npm run collect-deadlines</code>
    <p id="deadline-status" role="status" class="muted">Loading local stage evidence…</p>
    <p id="discovery-status" role="status" class="muted">Loading local catalogue…</p>
    <div id="coverage"></div>
    <details><summary>Institution directory &amp; source issues</summary><div id="institutions"></div></details>`;
  return panel;
}

export function collectedDeadlinePanel(entry, intake, stages) {
  const panel = element('section', 'collected-deadlines');
  panel.setAttribute('aria-label', 'Collected admission-stage evidence');
  panel.append(element('h3', '', 'Admission-stage evidence'));
  if (!entry || entry.requestedIntake !== intake) {
    panel.append(element('p', 'muted', entry ? `Evidence was collected for ${entry.requestedIntake}. Collect again for ${intake}; no dates are shown for this selection.` : 'Stage dates have not been collected for this program. Run the collection command, then reload.'));
    return panel;
  }
  panel.append(element('p', 'review-notice', 'Needs verification · Collected source text is not yet an applicable admission deadline. Check the published intake, year, round and applicant category.'));
  const list = element('ol', 'collected-stage-list');
  for (const [id, name] of stages) {
    const row = element('li');
    const records = entry.candidates.filter(record => record.stage === id);
    row.append(element('h4', '', name));
    if (!records.length) row.append(element('p', 'muted', 'No date collected from the checked sources.'));
    for (const record of records) {
      const detail = element('details', 'date-record');
      detail.append(element('summary', '', `${record.value.length>160 ? `${record.value.slice(0,160)}…` : record.value} · ${record.context || 'Intake not specified'} · ${record.applicantCategory}`), element('p', 'muted', `Needs verification · ${record.kind}`), element('p', 'date-evidence', record.evidence), element('p', 'muted', `Collected ${new Date(record.checkedAt).toLocaleString()} · ${record.extraction} · Cutoff timezone not established`), sourceLink('Official source ↗',record.sourceUrl));
      row.append(detail);
    }
    list.append(row);
  }
  panel.append(list);
  if (entry.sources.length) {
    const sources = element('details', 'evidence'); sources.append(element('summary','','Sources checked'));
    entry.sources.forEach(source=>{const p=element('p');p.append(sourceLink(source.url,source.url));sources.append(p);});panel.append(sources);
  }
  entry.failures.forEach(failure=>{const p=element('p','source-failure',`Source could not be collected: ${failure.reason} `);p.append(sourceLink('Source',failure.url));panel.append(p);});
  return panel;
}

// Shared input component for all dashboard preferences.
export function choiceField({ name, label, options, selected, multiple = false, onAdd }) {
  const group = element('fieldset', 'choice-field');
  group.append(element('legend', '', label));
  const choices = element('div', 'choices');
  function appendChoice(value, checked) {
    const row = element('label', 'choice');
    const input = document.createElement('input');
    input.type = multiple ? 'checkbox' : 'radio';
    input.name = name;
    input.value = value;
    input.checked = checked;
    row.append(input, element('span', '', value));
    choices.append(row);
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
