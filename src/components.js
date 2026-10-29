export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Shared input component for all dashboard preferences.
export function choiceField({ name, label, options, selected, multiple = false }) {
  const group = element('fieldset', 'choice-field');
  group.append(element('legend', '', label));
  const choices = element('div', 'choices');
  options.forEach(value => {
    const row = element('label', 'choice');
    const input = document.createElement('input');
    input.type = multiple ? 'checkbox' : 'radio';
    input.name = name;
    input.value = value;
    input.checked = selected.includes(value);
    row.append(input, element('span', '', value));
    choices.append(row);
  });
  group.append(choices);
  return group;
}

export function programCard(program, selected, onSelect) {
  const button = element('button', 'program-card');
  button.type = 'button';
  button.setAttribute('aria-pressed', String(selected));
  button.append(element('span', 'program-country', program.country), element('strong', '', program.institution), element('span', '', program.title), element('span', 'muted', `${program.degree} · ${program.intake}`));
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
