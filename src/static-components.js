import {deadlineLabel,intakeLabel,statusLabels,stageTypes} from './catalogue-model.js';
// Shared DOM components. Data is always inserted as text, never executable HTML.
export function el(tag,className='',text){const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;}
export function pill(text,tone='neutral'){return el('span',`pill ${tone}`,text);}
export function selectField(labelText,id,options,value,onChange){
  const label=el('label','select-field',labelText);const select=el('select');select.id=id;select.name=id;
  for(const [key,text] of options){const option=el('option','',text);option.value=key;select.append(option);}select.value=value;select.addEventListener('change',()=>onChange(select.value));label.append(select);return label;
}
export function multiField({title,id,options,selected,onChange,onAdd}){
  const field=el('fieldset','multi-field');field.id=id;field.append(el('legend','filter-label',title));const chips=el('div','chips');
  for(const value of options){const label=el('label','chip');const input=document.createElement('input');input.type='checkbox';input.name=id;input.value=value;input.checked=selected.includes(value);input.addEventListener('change',()=>onChange([...chips.querySelectorAll('input:checked')].map(input=>input.value)));label.append(input,document.createTextNode(value));chips.append(label);}field.append(chips);
  const add=el('details','add-option');add.append(el('summary','',`+ Add ${title==='Destinations'?'country':'subject'}`));const row=el('form','add-row');const input=document.createElement('input');input.type='text';input.maxLength=80;input.setAttribute('aria-label',`New ${title==='Destinations'?'country':'subject'}`);input.placeholder=title==='Destinations'?'e.g. Japan':'e.g. Economics';const button=el('button','small-button','Add');button.type='submit';const message=el('p','field-message');message.setAttribute('role','status');row.append(input,button);row.addEventListener('submit',event=>{event.preventDefault();const result=onAdd(input.value);if(result)message.textContent=result;});add.append(row,message);field.append(add);return field;
}
export function metric(value,label){const block=el('div','metric');block.append(el('strong','',String(value)),el('span','',label));return block;}
export function programCard(row,selected,onSelect){
  const button=el('button',`program-card${selected?' selected':''}`);button.type='button';button.setAttribute('aria-pressed',String(selected));
  const top=el('span','card-top');top.append(el('span','country-label',row.country),el('span','card-arrow',selected?'↗':'→'));
  button.append(top,el('strong','university-name',row.universityName),el('span','program-name',row.programName),el('span','card-meta',`${row.degree} · ${row.city}`));
  const bottom=el('span','card-bottom');bottom.append(el('span','',intakeLabel(row.admission.intake)),pill('Fictional program','soft'));button.append(bottom);button.addEventListener('click',onSelect);return button;
}
export function stageRow(stage,index,sources){
  const row=el('li',`stage-row ${stage.deadline?'dated':'undated'}`);const number=el('span','stage-number',String(index+1).padStart(2,'0'));number.setAttribute('aria-hidden','true');const main=el('div','stage-main');const header=el('div','stage-heading');header.append(el('h4','',stageTypes.find(([type])=>type===stage.type)[1]),pill(statusLabels[stage.status],stage.status==='dummy'?'soft':'warning'));main.append(header);
  main.append(el('p','stage-date',deadlineLabel(stage.deadline)));
  const detail=el('details','stage-detail');detail.append(el('summary','','Wording & evidence'),el('p','',stage.wording));
  for(const sourceId of stage.sourceIds){const source=sources.find(item=>item.id===sourceId);detail.append(el('p','source-passage',source.passage),el('p','source-url',source.url),el('p','source-note','Illustrative source only · Not checked against a real institution'));}
  if(!stage.sourceIds.length)detail.append(el('p','source-note','No evidence recorded.'));
  main.append(detail);row.append(number,main);return row;
}
export function timelinePanel(row,routeId,onRouteChange){
  const panel=el('section','timeline-panel');panel.setAttribute('aria-labelledby','timeline-title');
  if(!row){panel.append(el('h2','','No program selected'),el('p','muted','Change your filters or reset them to see the fictional admission timelines.'));return panel;}
  const top=el('div','timeline-top');top.append(el('p','eyebrow','YOUR ADMISSION TIMELINE'),pill('Dummy data','warning'));panel.append(top,el('h2','',row.universityName));panel.querySelector('h2').id='timeline-title';panel.append(el('p','timeline-subtitle',row.programName));
  const meta=el('div','timeline-meta');meta.append(el('span','',`${row.country} · ${row.city}`),el('span','',`${intakeLabel(row.admission.intake)} intake`));panel.append(meta);
  const route=row.admission.routes.find(item=>item.id===routeId)||row.admission.routes[0];
  panel.append(selectField('Applicant route','applicant-route',row.admission.routes.map(route=>[route.id,route.label]),route.id,onRouteChange));
  panel.append(el('p','route-note','Route selection is explicit. Citizenship or residence does not determine a route.'));
  const stageTop=el('div','stage-list-heading');stageTop.append(el('h3','','Every step, in order'),el('span','muted',`${route.stages.length} stages`));panel.append(stageTop);
  const list=el('ol','stage-list');route.stages.forEach((stage,index)=>list.append(stageRow(stage,index,row.admission.sources)));panel.append(list,el('p','timeline-footnote','Dates without a published time remain dates. Relative deadlines are never converted into guessed calendar dates.'));return panel;
}
