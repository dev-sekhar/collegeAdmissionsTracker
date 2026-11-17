import {deadlineLabel,intakeLabel,statusLabels,stageTypes,optionalStageTypes,rankingLabel} from './catalogue-model.js';
import {boardOptions,finalQualificationOptions,matchApplicantRoute} from './applicant-routes.js';
// Shared DOM components. Data is always inserted as text, never executable HTML.
export function el(tag,className='',text){const node=document.createElement(tag);node.className=className;if(text!==undefined)node.textContent=text;return node;}
export function pill(text,tone='neutral'){return el('span',`pill ${tone}`,text);}
export function selectField(labelText,id,options,value,onChange){
  const label=el('label','select-field',labelText);const select=el('select');select.id=id;select.name=id;
  for(const [key,text] of options){const option=el('option','',text);option.value=key;select.append(option);}select.value=value;select.addEventListener('change',()=>onChange(select.value));label.append(select);return label;
}
export function textField(labelText,id,value,onChange){const label=el('label','select-field',labelText);const input=el('input');input.type='text';input.id=id;input.name=id;input.maxLength=100;input.value=value;input.addEventListener('input',()=>onChange(input.value));label.append(input);return label;}
export function applicantContextPanel(draft,onDraftChange,onApply,onClear){
  const panel=el('section','filter-panel');panel.setAttribute('aria-labelledby','applicant-title');const top=el('div','section-top');const title=el('h2','','Your school qualification');title.id='applicant-title';top.append(title);panel.append(top,el('p','route-note','For Indian citizens applying to Singapore undergraduate programmes. Details stay in this page’s memory and are cleared on reload. Curriculum is separate from citizenship and Singapore PR status.'));
  const form=el('form');const fields=el('div','applicant-grid');const update=(key,value)=>{draft={...draft,[key]:value};onDraftChange(draft);};
  fields.append(selectField('School board','applicant-board',boardOptions,draft.board,value=>update('board',value)),selectField('Citizenship','applicant-citizenship',[['','Choose citizenship'],['India','India'],['Singapore','Singapore — outside this round'],['Other','Other — outside this round']],draft.citizenship,value=>update('citizenship',value)),selectField('Singapore permanent resident?','applicant-pr',[['','Choose PR status'],['no','No'],['yes','Yes']],draft.singaporePr,value=>update('singaporePr',value)),selectField('Final school / diploma results','applicant-results',[['','Choose results status'],['pending','Pending'],['available','Available']],draft.results,value=>update('results',value)));
  if(['icse','igcse'].includes(draft.board))fields.append(selectField('Subsequent Class XII / pre-university qualification','applicant-final-qualification',finalQualificationOptions,draft.finalQualification||'',value=>update('finalQualification',value)));
  if(draft.board==='state-other'||(['icse','igcse'].includes(draft.board)&&draft.finalQualification==='state-other'))fields.append(textField('Indian state board name (e.g. Karnataka, Maharashtra)','applicant-state-board',draft.stateBoard,value=>update('stateBoard',value)));
  const actions=el('div','applicant-actions');const apply=el('button','small-button','Apply applicant details');apply.type='submit';const clear=el('button','text-button','Clear applicant details');clear.type='button';clear.addEventListener('click',onClear);actions.append(apply,clear);form.append(fields,actions);form.addEventListener('submit',event=>{event.preventDefault();onApply();});panel.append(form,el('p','filter-note','Changes take effect after Apply. Published dates remain available even when applicant-specific details could not be extracted. This is not an eligibility assessment.'));
  return panel;
}
export function multiField({title,id,options,selected,onChange,onAdd}){
  const field=el('fieldset','multi-field');field.id=id;field.append(el('legend','filter-label',title));const chips=el('div','chips');
  for(const value of options){const label=el('label','chip');const input=document.createElement('input');input.type='checkbox';input.name=id;input.value=value;input.checked=selected.includes(value);input.addEventListener('change',()=>onChange([...chips.querySelectorAll('input:checked')].map(input=>input.value)));label.append(input,document.createTextNode(value));chips.append(label);}field.append(chips);
  const add=el('details','add-option');add.append(el('summary','',`+ Add ${title==='Destinations'?'country':'subject'}`));const row=el('form','add-row');const input=document.createElement('input');input.type='text';input.maxLength=80;input.setAttribute('aria-label',`New ${title==='Destinations'?'country':'subject'}`);input.placeholder=title==='Destinations'?'e.g. Japan':'e.g. Economics';const button=el('button','small-button','Add');button.type='submit';const message=el('p','field-message');message.setAttribute('role','status');row.append(input,button);row.addEventListener('submit',event=>{event.preventDefault();const result=onAdd(input.value);if(result)message.textContent=result;});add.append(row,message);field.append(add);return field;
}
export function metric(value,label){const block=el('div','metric');block.append(el('strong','',String(value)),el('span','',label));return block;}
export function rankingBadge(ranking){return pill(`${rankingLabel(ranking)}${ranking.institution.includes('awarding university')?' · awarding university':''}`,ranking.status==='verified'?'soft':'warning');}
export function programCard(row,selected,onSelect){
  const button=el('button',`program-card${selected?' selected':''}`);button.type='button';button.setAttribute('aria-pressed',String(selected));
  const top=el('span','card-top');top.append(el('span','country-label',row.country),el('span','card-arrow',selected?'↗':'→'));
  button.append(top,el('strong','university-name',row.universityName),el('span','program-name',row.programName),el('span','card-meta',`${row.degree} · ${row.city}`));
  if(row.qsRanking)button.append(rankingBadge(row.qsRanking));
  const bottom=el('span','card-bottom');bottom.append(el('span','',intakeLabel(row.admission.intake)),pill(row.admission.dataType==='real'?'Real programme':'Fictional program','soft'));button.append(bottom);button.addEventListener('click',onSelect);return button;
}
export function evidenceLink(url,label=url){const link=el('a','source-url',label);link.href=url;link.target='_blank';link.rel='noopener noreferrer';return link;}
export function extractionFallback(programUrl,message='Details could not be extracted from the checked sources.'){const block=el('p','route-note',message);if(programUrl)block.append(el('span','',' '),evidenceLink(programUrl,'View details on the official programme page ↗'));return block;}
export function admissionRequirementsPanel(row){
  const section=el('section','admission-requirements');section.append(el('h3','','Published admission requirements'));
  const record=row.admissionDetails;
  if(!record){section.append(extractionFallback(row.url));return section;}
  section.append(pill(record.coverage==='partial'?'Partial details extracted':'Details could not be extracted','warning'),el('p','route-note',record.summary));
  for(const entry of record.requirements){const detail=el('details','stage-detail');detail.append(el('summary','',`${entry.label} · ${entry.status==='extracted'?'Extracted':entry.status==='needs-review'?'Needs review':'Not extracted'}`),el('p','route-note',entry.text));for(const id of entry.sourceIds){const source=record.sources.find(s=>s.id===id);detail.append(evidenceLink(source.url,'Official requirements source ↗'),el('p','source-note',`Checked ${source.checkedAt}${source.updatedAt?` · Document updated ${source.updatedAt}`:''} · ${source.applicability}`));if(source.linkedFrom)detail.append(evidenceLink(source.linkedFrom,'Programme page linking this document ↗'));}section.append(detail);}
  section.append(extractionFallback(row.url,'Additional or applicant-specific details could not be fully extracted. Requirements are shown for reference, not as an eligibility decision.'));return section;
}
export function publishedDeadlinesPanel(row){
  const section=el('section','published-deadlines');const real=row.admission.dataType==='real';section.append(el('h3','',real?'Published deadlines by applicant category':'Illustrative example deadlines'),el('p','route-note',real?'These are the recorded institutional categories, not a selection of your personal route. Check each category and source; unknown dates remain unavailable.':'Fictional examples only. These dates are not official admissions information.'));
  if(!row.admission.routes.some(route=>route.stages.some(stage=>stage.deadline)))section.append(extractionFallback(row.url,'Admission deadline details could not be extracted for this intake.'));
  for(const route of row.admission.routes){const detail=el('details','published-category');const closing=route.stages.find(stage=>stage.type==='application');detail.append(el('summary','',`${route.label} — application: ${deadlineLabel(closing?.deadline??null)}${closing?.status==='needs-review'?' · Needs review':''}`));const list=el('ol','stage-list');route.stages.forEach((stage,index)=>list.append(stageRow(stage,index,row.admission.sources,row.url)));detail.append(list);section.append(detail);}return section;
}
export function stageRow(stage,index,sources,programUrl){
  const row=el('li',`stage-row ${stage.deadline?'dated':'undated'}`);const number=el('span','stage-number',String(index+1).padStart(2,'0'));number.setAttribute('aria-hidden','true');const main=el('div','stage-main');const header=el('div','stage-heading');header.append(el('h4','',[...stageTypes,...optionalStageTypes].find(([type])=>type===stage.type)[1]),pill(statusLabels[stage.status],['dummy','verified'].includes(stage.status)?'soft':'warning'));main.append(header);
  main.append(el('p','stage-date',deadlineLabel(stage.deadline)));
  if(sources.some(source=>source.checkedAt))main.append(el('p','route-note',stage.wording));
  const detail=el('details','stage-detail');detail.append(el('summary','','Wording & evidence'),el('p','',stage.wording));
  for(const sourceId of stage.sourceIds){const source=sources.find(item=>item.id===sourceId);detail.append(el('p','source-passage',source.passage),source.checkedAt?evidenceLink(source.url):el('p','source-url',source.url),el('p','source-note',source.checkedAt?`Official institution source · Checked ${source.checkedAt} · Curated summary`:'Illustrative source only · Not checked against a real institution'));}
  if(!stage.sourceIds.length)detail.append(el('p','source-note','No evidence recorded.'));
  if(stage.deadline===null&&programUrl)main.append(extractionFallback(programUrl,'Exact deadline details could not be extracted. See the available wording and official programme page.'));
  main.append(detail);row.append(number,main);return row;
}
export function timelinePanel(row,applicant){
  const panel=el('section','timeline-panel');panel.setAttribute('aria-labelledby','timeline-title');
  if(!row){panel.append(el('h2','','No program selected'),el('p','muted','Change your filters or reset them to see admission timelines.'));return panel;}
  const real=row.admission.dataType==='real';
  const top=el('div','timeline-top');top.append(el('p','eyebrow','YOUR ADMISSION TIMELINE'),pill(real?'Curated official sources':'Dummy data',real?'soft':'warning'));panel.append(top,el('h2','',row.universityName));panel.querySelector('h2').id='timeline-title';panel.append(el('p','timeline-subtitle',row.programName));
  if(row.notes)panel.append(el('p','route-note',row.notes));
  if(row.url)panel.append(evidenceLink(row.url,'Official programme details ↗'));
  if(row.qsRanking){const ranking=el('div','route-note');ranking.append(rankingBadge(row.qsRanking),el('p','',`${row.qsRanking.institution} · ${row.qsRanking.notes}`),evidenceLink(row.qsRanking.url,'QS World University Rankings source ↗'),el('p','source-note',`QS edition ${row.qsRanking.edition} · Checked ${row.qsRanking.checkedAt}`));panel.append(ranking);}
  const meta=el('div','timeline-meta');meta.append(el('span','',`${row.country} · ${row.city}`),el('span','',`${intakeLabel(row.admission.intake)} intake`));panel.append(meta);
  const match=matchApplicantRoute(row,applicant);const result=el('section','route-result');result.setAttribute('aria-label','Applicant route match');result.setAttribute('role','status');
  const earlierQualification=['icse','igcse'].includes(applicant?.board);const stateBoard=applicant?.board==='state-other'||(earlierQualification&&applicant?.finalQualification==='state-other');
  const incomplete=!applicant?.board||!applicant?.citizenship||!applicant?.singaporePr||!applicant?.results||(earlierQualification&&!applicant?.finalQualification)||(stateBoard&&!applicant?.stateBoard?.trim());
  result.append(el('h3','',match.status==='matched'?`Applicant category: ${match.route.label}`:incomplete?'Complete applicant details to check your category':'Applicant-specific details could not be extracted'),pill(match.status==='matched'?'Matched to verified rule':match.status==='needs-review'?'Needs review':match.status==='ambiguous'?'Conflicting rules':'Check official programme details',match.status==='matched'?'soft':'warning'),el('p','route-note',match.reason));
  if(match.status!=='matched')result.append(extractionFallback(row.url,incomplete?'Published dates and requirements remain available below. Complete the applicant fields and Apply to check for a verified match.':'Please view the official programme page for the missing details. Published information remains available below.'));
  if(match.instruction)result.append(el('p','route-note',match.instruction));
  if(match.status==='matched')result.append(el('p','source-note','This selects an application timeline. Grades, programme prerequisites and admission eligibility are not assessed. Each deadline retains its own verification status.'));
  for(const source of match.sources)result.append(evidenceLink(source.url,'Official applicant-rule source ↗'),el('p','source-note',`Checked ${source.checkedAt} · ${source.passage}`));panel.append(result);
  if(real){const evidence=el('details','stage-detail');evidence.append(el('summary','','Programme and admissions research sources'));for(const source of row.admission.sources)evidence.append(evidenceLink(source.url),el('p','source-note',`Checked ${source.checkedAt} · ${source.passage}`));panel.append(evidence);}
  if(real)panel.append(admissionRequirementsPanel(row));
  if(match.status!=='matched'){panel.append(publishedDeadlinesPanel(row));return panel;}
  const route=match.route;
  const stageTop=el('div','stage-list-heading');stageTop.append(el('h3','','Every step, in order'),el('span','muted',`${route.stages.length} stages`));panel.append(stageTop);
  const list=el('ol','stage-list');route.stages.forEach((stage,index)=>list.append(stageRow(stage,index,[...row.admission.sources,...match.sources],row.url)));panel.append(list,el('p','timeline-footnote','Dates without a published time remain dates. Relative deadlines are never converted into guessed calendar dates.'));panel.append(publishedDeadlinesPanel(row));return panel;
}
