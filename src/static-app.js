import {catalogueRows,filterRows,intakeKey,intakeLabel,countryName} from './catalogue-model.js';
import {el,multiField,selectField,metric,programCard,timelinePanel} from './static-components.js';
const countriesOrder=['Singapore','Canada','United Kingdom','Australia','Netherlands','Germany'];
let rows=[];let countries=[];let subjects=[];let selectedKey='';let selectedRoute='';
let filters={countries:[],subjects:['Computer Science'],degree:'Bachelor’s',intake:''};
let live=true;
function addOption(type,raw){
  const value=type==='countries'?countryName(raw):raw.trim().replace(/\s+/gu,' ');const options=type==='countries'?countries:subjects;
  if(!value||value.length>80)return 'Enter a name of 1–80 characters.';
  if(options.some(item=>item.toLowerCase()===value.toLowerCase()))return 'That option already exists.';
  options.push(value);filters[type]=[...new Set([...filters[type],value])];renderFilters();renderResults();
  document.querySelector('#filter-note').textContent=`${value} added for this session. Options filter the dummy catalogue; add a YAML record and rebuild to supply programs.`;
  return '';
}
function renderFilters(){
  const host=document.querySelector('#filters');host.replaceChildren();
  host.append(multiField({title:'Destinations',id:'country-filter',options:countries,selected:filters.countries,onChange:value=>{filters.countries=value;renderResults();},onAdd:value=>addOption('countries',value)}),multiField({title:'Subjects',id:'subject-filter',options:subjects,selected:filters.subjects,onChange:value=>{filters.subjects=value;renderResults();},onAdd:value=>addOption('subjects',value)}));
  const small=el('div','select-pair');const intakes=[...new Map(rows.map(row=>[intakeKey(row.admission.intake),intakeLabel(row.admission.intake)])).entries()].sort(([a],[b])=>a.localeCompare(b));
  small.append(selectField('Degree level','degree-filter',[['','All degrees'],['Bachelor’s','Bachelor’s'],['Master’s','Master’s'],['PhD','PhD']],filters.degree,value=>{filters.degree=value;renderResults();}),selectField('Intake','intake-filter',[['','All intakes'],...intakes],filters.intake,value=>{filters.intake=value;renderResults();}));host.append(small);
}
function renderTimeline(){
  const row=filterRows(rows,filters).find(row=>row.key===selectedKey);document.querySelector('#timeline').replaceChildren(timelinePanel(row,selectedRoute,value=>{selectedRoute=value;const select=document.querySelector('#applicant-route');const focus=select===document.activeElement;renderTimeline();if(focus)document.querySelector('#applicant-route')?.focus();}));
}
function renderResults(){
  if(!live)return;const matches=filterRows(rows,filters);
  if(!matches.some(row=>row.key===selectedKey)){selectedKey=matches[0]?.key||'';selectedRoute='';}
  const metrics=document.querySelector('#metrics');metrics.replaceChildren(metric(matches.length,'matching programs'),metric(new Set(matches.map(row=>row.country)).size,'destinations'),metric(8,'admission stages'));
  document.querySelector('#result-count').textContent=`${matches.length} ${matches.length===1?'program':'programs'}`;
  const list=document.querySelector('#program-list');list.replaceChildren();
  for(const row of matches){const card=programCard(row,row.key===selectedKey,()=>{selectedKey=row.key;selectedRoute='';list.querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed','false'));list.querySelectorAll('.selected').forEach(button=>button.classList.remove('selected'));card.setAttribute('aria-pressed','true');card.classList.add('selected');renderTimeline();document.querySelector('#announcer').textContent=`Selected ${row.universityName}, ${row.programName}.`;});list.append(card);}
  if(!matches.length)list.append(el('div','empty-state','No dummy programs match these filters. Added countries and subjects need YAML records before results can appear. Try Reset filters.'));
  renderTimeline();document.querySelector('#announcer').textContent=`${matches.length} dummy programs match your filters.`;
}
document.querySelector('#reset-filters').addEventListener('click',()=>{filters={countries:[],subjects:['Computer Science'],degree:'Bachelor’s',intake:''};selectedRoute='';document.querySelector('#filter-note').textContent='No destination selected means all destinations. Filters apply to the dummy catalogue only.';renderFilters();renderResults();});
try{
  const response=await fetch('./data/generated/catalogue.json');if(!response.ok)throw Error('Catalogue unavailable');const catalogue=await response.json();
  if(catalogue.schemaVersion!==1||catalogue.mode!=='dummy')throw Error('Expected the dummy catalogue');
  rows=catalogueRows(catalogue).sort((a,b)=>countriesOrder.indexOf(a.country)-countriesOrder.indexOf(b.country)||a.programName.localeCompare(b.programName));
  countries=[...new Set(rows.map(row=>row.country))];subjects=[...new Set(rows.flatMap(row=>row.subjects))].sort();
  renderFilters();renderResults();document.querySelector('#loading').hidden=true;
}catch(error){live=false;document.querySelector('#loading').textContent='The dummy catalogue could not be loaded. Run npm run build, restart the preview and reload.';document.querySelector('#loading').setAttribute('role','alert');document.querySelector('#reset-filters').disabled=true;}
