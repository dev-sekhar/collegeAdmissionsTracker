import {el,pill,selectField,evidenceLink,admissionRequirementsPanel} from './static-components.js';
import {deadlineLabel,intakeLabel,statusLabels} from './catalogue-model.js';
export function action(label,onClick,className='text-button'){const button=el('button',className,label);button.type='button';button.addEventListener('click',onClick);return button;}
export function disclosure(label,...content){const details=el('details','supporting-details');details.append(el('summary','',label),...content);return details;}
export function groupUniversities(rows){const groups=new Map();for(const row of rows){if(!groups.has(row.universityId))groups.set(row.universityId,{...row,rows:[]});groups.get(row.universityId).rows.push(row);}return [...groups.values()].sort((a,b)=>a.country.localeCompare(b.country)||a.universityName.localeCompare(b.universityName));}
export function groupProgrammes(rows){const groups=new Map();for(const row of rows){if(!groups.has(row.programId))groups.set(row.programId,{...row,intakes:[]});groups.get(row.programId).intakes.push(row);}return [...groups.values()].sort((a,b)=>a.programName.localeCompare(b.programName));}
export function universityCard(university,selected,onSelect){
  const button=action('',onSelect,`university-card${selected?' selected':''}`);button.id=`university-${university.universityId}`;button.setAttribute('aria-expanded',String(selected));button.setAttribute('aria-controls','programmes-pane');
  const name=el('strong','university-name',university.universityName);const ranking=university.qsRanking;const verified=ranking?.status==='verified';
  const rank=el('span','university-rank',verified?`#${ranking.rank}`:'—');const description=ranking?`${ranking.institution} · QS World ${ranking.edition} · ${verified?`Rank ${ranking.rank}`:'Rank unverified'}`:'Rank unavailable';rank.setAttribute('aria-label',description);rank.title=description;button.append(name,rank);
  if(university.admission.dataType!=='real')button.append(el('span','example-label','Fictional example'));return button;
}
export function universityList(universities,selectedId,onUniversity){
  const list=el('div','university-list');const countries=new Map();for(const university of universities){if(!countries.has(university.country))countries.set(university.country,[]);countries.get(university.country).push(university);}
  let index=0;for(const [country,items] of countries){const section=el('section','university-country-group');const heading=el('h3','country-heading',country);heading.id=`university-country-${index++}`;section.setAttribute('aria-labelledby',heading.id);const cards=el('div','country-universities');for(const university of items)cards.append(universityCard(university,university.universityId===selectedId,()=>onUniversity(university)));section.append(heading,cards);list.append(section);}return list;
}
export function programmeCallout(university,onSelect,onClose){
  const section=el('section','programme-callout');section.id='programme-callout';section.setAttribute('aria-labelledby','programme-title');const heading=el('div','section-top');const title=el('h2','',university.universityName);title.id='programme-title';title.tabIndex=-1;heading.append(title,action('All universities',onClose,'text-button mobile-back'));section.append(heading);const list=el('div','programme-grid');
  for(const programme of groupProgrammes(university.rows)){const button=action('',()=>onSelect(programme),'programme-choice');button.id=`programme-${programme.programId}`;button.setAttribute('aria-haspopup','dialog');const main=el('span','programme-choice-main');main.append(el('strong','',programme.programName),el('span','programme-subjects',programme.subjects.join(' · ')));button.append(main,el('span','programme-intakes',programme.intakes.map(row=>intakeLabel(row.admission.intake)).join(' · ')));list.append(button);}section.append(list);return section;
}
export function splitBrowse(universities,selectedId,onUniversity,onProgramme,onClear){
  const split=el('div',`browse-split compact-universities${selectedId?' has-selection':''}`);
  const left=el('section','university-pane');left.setAttribute('aria-label','Universities');left.append(el('h2','pane-title','Universities'),universityList(universities,selectedId,onUniversity));
  const right=el('section','programmes-pane');right.id='programmes-pane';right.setAttribute('aria-label','Programmes');const selected=universities.find(university=>university.universityId===selectedId);
  if(selected)right.append(programmeCallout(selected,onProgramme,onClear));else right.append(el('p','pane-placeholder',universities.length?'Select a university to see its programmes.':'No programmes match these filters.'));
  split.append(left,right);return split;
}
export function programmeDialog(content,onClose){
  const dialog=el('dialog','programme-dialog');dialog.setAttribute('aria-labelledby','timeline-title');const header=el('div','dialog-heading');header.append(el('strong','','Programme details'),action('Close',onClose,'small-button close-programme'));const body=el('div','dialog-content');body.append(content);dialog.append(header,body);dialog.addEventListener('cancel',event=>{event.preventDefault();onClose();});return dialog;
}
export function navigationTrail(name,onUniversities,onProgrammes){const nav=el('nav','browse-trail');nav.setAttribute('aria-label','Admission navigation');nav.append(action('Universities',onUniversities),el('span','','/'),action(name,onProgrammes),el('span','','/'),el('span','','Timeline'));return nav;}
export function compactStage(stage,index,sources,programUrl){
  const row=el('li',`compact-stage${stage.deadline?' dated':' undated'}`);const marker=el('span','stage-number',String(index+1).padStart(2,'0'));marker.setAttribute('aria-hidden','true');const main=el('div','compact-stage-main');const names={opening:'Applications open',application:'Apply by',documents:'Documents',tests:'Test scores',interview:'Interview',decision:'Admission decision',acceptance:'Accept offer',deposit:'Deposit',enrolment:'Enrolment',appeal:'Appeal'};
  main.append(el('h3','',names[stage.type]||stage.type),el('p','compact-date',stage.deadline?deadlineLabel(stage.deadline):'Date unavailable'),pill(stage.status==='verified'?'Verified':stage.status==='needs-review'?'Needs review':stage.status==='dummy'?'Fictional':stage.status==='manual-unverified'?'Manual · unverified':'Unverified',['verified','dummy'].includes(stage.status)?'soft':'warning'));
  const details=disclosure('Details',el('p','',stage.wording));details.classList.add('compact-stage-details');if(!['verified','needs-review','dummy'].includes(stage.status))details.append(el('p','source-note',statusLabels[stage.status]));
  if(stage.manualEntry)details.append(el('p','source-note',`Entered by ${stage.manualEntry.enteredBy} · ${stage.manualEntry.enteredAt}. ${stage.manualEntry.note}`));
  for(const id of stage.sourceIds){const source=sources.find(source=>source.id===id);if(!source)continue;details.append(el('p','source-passage',source.passage),source.checkedAt?evidenceLink(source.url,'Official source'):el('p','source-note','Fictional evidence'),el('p','source-note',source.checkedAt?`Checked ${source.checkedAt}`:'Not checked against a real institution'));}
  if(!stage.sourceIds.length&&programUrl)details.append(evidenceLink(programUrl,'Official programme page'));main.append(details);row.append(marker,main);return row;
}
export function compactTimeline(row,routeId,intakes,onIntake,onRoute){
  const panel=el('section','compact-timeline');panel.setAttribute('aria-labelledby','timeline-title');panel.append(el('p','eyebrow',row.universityName));const title=el('h1','',row.programName);title.id='timeline-title';title.tabIndex=-1;panel.append(title);const controls=el('div','timeline-controls');
  if(intakes.length>1)controls.append(selectField('Intake','timeline-intake',intakes.map(item=>[item.key,intakeLabel(item.admission.intake)]),row.key,onIntake));else controls.append(el('span','single-intake',intakeLabel(row.admission.intake)));
  controls.append(selectField('Published applicant category','timeline-category',[['','Choose category'],...row.admission.routes.map(route=>[route.id,route.label])],routeId,onRoute));panel.append(controls);
  if(row.admission.dataType!=='real')panel.append(el('p','data-caption','Fictional example · dates are illustrative.'));
  const route=row.admission.routes.find(route=>route.id===routeId);if(route){panel.append(el('p','data-caption',row.personalised?'Based on applicant details · not an eligibility assessment':'Published category · not an eligibility assessment'));const list=el('ol','compact-stages');route.stages.forEach((stage,index)=>list.append(compactStage(stage,index,row.admission.sources,row.url)));panel.append(list);}else panel.append(el('p','category-prompt','Choose a published category to see its dates.'));
  if(row.admission.dateReview)panel.append(el('p','review-date',`Date sources reviewed ${row.admission.dateReview.checkedAt}. Unverified dates remain unavailable.`));
  panel.append(disclosure('Requirements & programme details',el('p','',row.notes||''),row.url?evidenceLink(row.url,'Official programme page'):el('span'),admissionRequirementsPanel(row)));
  const research=el('div','research-sources');for(const source of row.admission.sources)research.append(source.checkedAt?evidenceLink(source.url,'Institution source'):el('span','','Fictional source'),el('p','source-note',`${source.checkedAt?`Checked ${source.checkedAt}`:'Not checked'} · ${source.passage}`));
  if(row.qsRanking)research.append(evidenceLink(row.qsRanking.url,'QS ranking source'),el('p','source-note',`${row.qsRanking.institution} · Checked ${row.qsRanking.checkedAt}. ${row.qsRanking.notes}`));panel.append(disclosure('All sources',research));return panel;
}
