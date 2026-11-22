import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {catalogueRows,deadlineLabel} from '../src/catalogue-model.js';
import {groupUniversities,groupProgrammes,universityList,nonEnglishLanguages} from '../src/browse-components.js';
import {mountAdmissionsBrowser} from '../src/catalogue-browser.js';
const catalogue=await buildCatalogue({check:true});
const rows=catalogueRows(catalogue);const real=rows.filter(row=>row.admission.dataType==='real'&&row.country==='Singapore');
class Element{
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.attributes={};this.className='';this.text='';this.value='';this.classList={add:name=>{this.className+=' '+name;}};}
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return this.text+this.children.map(child=>child.textContent||'').join(' ');}
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=children;this.text='';}
  setAttribute(key,value){this.attributes[key]=value;}
  getAttribute(key){return this.attributes[key]??null;}
  addEventListener(name,callback){this.events[name]=callback;}
  focus(){document.activeElement=this;}
  showModal(){this.open=true;}
  querySelectorAll(selector){return walk(this).filter(node=>selector.startsWith('#')?node.id===selector.slice(1):selector.startsWith('.')?node.className.split(' ').includes(selector.slice(1)):selector==='input:checked'?node.tag==='input'&&node.checked:node.tag===selector);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
const walk=node=>[node,...node.children.flatMap(walk)];
const memoryStorage=()=>{const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};};
function chooseCountries(f,values){const inputs=f.find('#country-filter').querySelectorAll('input');inputs.forEach(input=>{input.checked=values.includes(input.value);});inputs[0].events.change();}
function fixture(t,{clock=()=>new Date('2026-11-20T04:00:00Z'),storage=null,inputCatalogue=catalogue}={}){
  const root=new Element('main');for(const id of ['workspace','announcer','filters','filter-summary','filter-note','reset-filters']){const e=new Element(id==='reset-filters'?'button':'div');e.id=id;root.append(e);}
  const brand=new Element('a');brand.className='brand';root.append(brand);const filterPanel=new Element('details');filterPanel.className='filter-panel';root.append(filterPanel);
  globalThis.document={createElement:tag=>new Element(tag),createTextNode:text=>{const node=new Element('text');node.textContent=text;return node;},querySelector:selector=>root.querySelector(selector)};
  t.after(()=>{delete globalThis.document;});const browser=mountAdmissionsBrowser(inputCatalogue,{clock,storage});
  const find=selector=>root.querySelector(selector);const all=selector=>root.querySelectorAll(selector);
  return {root,find,all,browser,click(predicate){const b=all('button').find(predicate);assert.ok(b,'button exists');b.events.click();},select(id,value){const e=find('#'+id);assert.ok(e,`${id} exists`);e.value=value;e.events.change();}};
}

test('Netherlands journey preserves every published category, language and source without Singapore controls',t=>{
  const f=fixture(t);const countryInputs=f.find('#country-filter').querySelectorAll('input');
  const sg=countryInputs.find(input=>input.value==='Singapore');sg.checked=false;sg.events.change();
  const nl=countryInputs.find(input=>input.value==='Netherlands');nl.checked=true;nl.events.change();
  assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','17']);
  assert.deepEqual(f.all('.university-rank').map(node=>node.textContent),['#60','#113','#119','#148','#157','#185','#254','#429']);
  const before=JSON.stringify(catalogue);
  for(const row of rows.filter(row=>row.country==='Netherlands')){
    f.click(b=>b.id===`university-${row.universityId}`);f.click(b=>b.id===`programme-${row.programId}`);
    assert.equal(f.find('#applicant-context'),null);
    if(row.subjects.includes('Criminology'))assert.match(row.programName,/Dutch-taught/);
    for(const route of row.admission.routes){f.select('timeline-category',route.id);assert.equal(f.all('.compact-stage').length,route.stages.length);route.stages.forEach((stage,i)=>assert.ok(f.all('.compact-stage')[i].textContent.includes(deadlineLabel(stage.deadline))));}
    f.click(b=>b.className.includes('close-programme'));
  }
  assert.equal(JSON.stringify(catalogue),before);
});
test('university/programme grouping deduplicates intake rows without losing any intake',()=>{
  assert.equal(groupUniversities(real).length,8);assert.equal(groupProgrammes(real).length,31);
  const buffalo=groupProgrammes(real).find(item=>item.programId==='sim-buffalo-economics');assert.equal(buffalo.intakes.length,3);
  assert.equal(groupProgrammes(real).filter(item=>item.universityId==='sg-sim-uol').length,4);
});
test('Singapore university cards display best QS rank first with unavailable ranks at the bottom',t=>{
  const f=fixture(t);assert.deepEqual(f.all('.university-card').map(card=>card.id),[
    'university-sg-nus','university-sg-ntu','university-sg-sim-rmit','university-sg-smu','university-sg-sim-buffalo','university-sg-kaplan-murdoch','university-sg-sim-uol','university-sg-suss',
  ]);assert.deepEqual(f.all('.university-rank').map(rank=>rank.textContent),['#10','#12','#119','#411','#416','#422','—','—']);
});
test('rank ordering is numeric, preserves country groups, and handles ties, bands and unverified data',()=>{
  const make=(universityName,rank,status='verified',country='Singapore')=>({universityId:universityName,universityName,country,qsRanking:rank===undefined?undefined:{rank,status}});
  const input=[make('Missing'),make('Unverified','1','not-verified'),make('Ten','10'),make('Tie B','=2'),make('Tie A','2'),make('Band','101-150'),make('Two hundred','200'),make('Canadian','999','verified','Canada')];
  assert.deepEqual(groupUniversities(input).map(university=>university.universityName),['Canadian','Tie A','Tie B','Ten','Band','Two hundred','Missing','Unverified']);
});
test('country sections retain every university and compact ranks do not invent missing values',t=>{
  const f=fixture(t);assert.equal(f.all('.country-heading').length,1);assert.equal(f.find('.country-heading').textContent,'Singapore');
  const list=universityList(groupUniversities(rows),'',()=>{});const groups=list.querySelectorAll('.university-country-group');
  assert.equal(groups.length,new Set(rows.map(row=>row.country)).size);assert.equal(list.querySelectorAll('.university-card').length,groupUniversities(rows).length);
  for(const university of groupUniversities(rows)){
    const card=list.querySelector(`#university-${university.universityId}`);assert.equal(card.querySelector('.university-name').textContent,university.universityName);
    const rank=card.querySelector('.university-rank');assert.equal(rank.textContent,university.qsRanking?.status==='verified'?`#${university.qsRanking.rank.replace(/^=/u,'')}`:'—');
    assert.equal(card.querySelector('.country-label'),null);assert.doesNotMatch(card.textContent,/QS World|awarding university|View programmes/);
  }
});
test('country tiles retain collapsed state across filtering and popup close without a repeated list title',t=>{
  const f=fixture(t);const country=f.find('.university-country-group');assert.equal(country.tag,'details');assert.equal(country.open,false);assert.equal(f.find('.pane-title'),null);
  country.open=false;f.find('#reset-filters').events.click();assert.equal(f.find('.university-country-group').open,false);
  f.find('.university-country-group').open=true;
  f.click(b=>b.id==='university-sg-ntu');f.click(b=>b.id==='programme-ntu-economics');f.click(b=>b.className.includes('close-programme'));
  assert.equal(f.find('.university-country-group').open,true);assert.equal(f.find('.university-name').title,f.find('.university-name').textContent);
});
test('minimising the selected country clears university selection and restores the summary',t=>{
  const f=fixture(t);f.click(b=>b.id==='university-sg-ntu');assert.equal(f.all('.programme-choice').length,15);
  const group=f.find('.university-country-group');const summaryId=group.querySelector('summary').id;group.open=false;group.events.toggle();
  assert.ok(f.find('.pane-overview'));assert.equal(f.all('.programme-choice').length,0);assert.equal(f.all('.selected').length,0);assert.equal(f.find('.university-country-group').open,false);assert.equal(document.activeElement.id,summaryId);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);assert.ok(f.find('.upcoming-deadlines'));
  f.find('.university-country-group').open=true;f.find('.university-country-group').events.toggle();assert.ok(f.find('.pane-overview'));assert.equal(f.all('.selected').length,0);
});
test('collapsing an unrelated country or receiving a detached tile event does not clear the selected university',t=>{
  const f=fixture(t);const canada=f.find('#country-filter').querySelectorAll('input').find(input=>input.value==='Netherlands');canada.checked=true;canada.events.change();
  const detached=f.all('.university-country-group').find(group=>group.getAttribute('data-country')==='Singapore');f.click(b=>b.id==='university-sg-ntu');
  const other=f.all('.university-country-group').find(group=>group.getAttribute('data-country')==='Netherlands');other.open=false;other.events.toggle();assert.equal(f.all('.programme-choice').length,15);
  detached.isConnected=false;detached.open=false;detached.events.toggle();assert.equal(f.all('.programme-choice').length,15);assert.equal(f.find('.pane-overview'),null);
});
test('left university list, right programme pane, modal category and intake reset form a complete journey',t=>{
  const f=fixture(t);assert.equal(f.all('.university-card').length,8);assert.equal(f.find('#timeline-category'),null);assert.deepEqual(f.all('dt').map(node=>node.textContent),['Universities','Programs']);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);assert.match(f.find('.upcoming-label').textContent,/Next 3 months/);
  f.click(b=>b.className==='university-card'&&b.textContent.includes('University at Buffalo'));
  assert.equal(f.all('.programme-choice').length,1);assert.equal(document.activeElement.id,'programme-title');assert.equal(f.find('.pane-overview'),null);
  f.click(b=>b.className==='programme-choice');assert.equal(f.all('.compact-stage').length,0);
  const august=real.find(r=>r.programId==='sim-buffalo-economics'&&r.admission.intake.month===8);
  f.select('timeline-intake',august.key);f.select('timeline-category','international');assert.match(f.find('#workspace').textContent,/28 Jun 2027/);
  f.select('timeline-category','local');assert.match(f.find('#workspace').textContent,/12 Jul 2027/);
  const may=real.find(r=>r.programId===august.programId&&r.admission.intake.month===5);f.select('timeline-intake',may.key);assert.equal(f.all('.compact-stage').length,0);
  f.select('timeline-category','international');assert.match(f.find('#workspace').textContent,/29 Mar 2027/);
  f.click(b=>b.className.includes('close-programme'));assert.equal(f.all('.university-card').length,8);assert.equal(f.find('#timeline-category'),null);assert.equal(f.all('.programme-choice').length,1);
});
test('all 31 programmes and 75 published category timelines reproduce existing YAML dates',t=>{
  const f=fixture(t);let count=0;const before=JSON.stringify(catalogue);
  for(const row of real){
    f.click(b=>b.className.includes('university-card')&&b.textContent.includes(row.universityName));
    f.click(b=>b.className==='programme-choice'&&b.children[0].children[0].textContent===row.programName);
    if(f.find('#timeline-intake'))f.select('timeline-intake',row.key);
    for(const route of row.admission.routes){
      f.select('timeline-category',route.id);const stages=f.all('.compact-stage');assert.equal(stages.length,route.stages.length);
      route.stages.forEach((stage,i)=>{assert.ok(stages[i].textContent.includes(stage.deadline?deadlineLabel(stage.deadline):'Date unavailable'),`${row.key} ${stage.type}`);assert.equal(stages[i].querySelector('details').open,undefined);});count++;
    }
    f.click(b=>b.className.includes('close-programme'));
  }
  assert.equal(count,75);assert.equal(JSON.stringify(catalogue),before);
});
test('filter changes cannot leave stale programmes/categories and reset restores universities',t=>{
  const f=fixture(t);f.click(b=>b.className==='university-card'&&b.textContent.includes('Nanyang'));f.click(b=>b.className==='programme-choice'&&b.textContent.includes('BSocSci'));f.select('timeline-category','india-standard-12');
  f.select('intake-filter','2027');assert.equal(f.find('#timeline-category'),null);assert.equal(f.all('.university-card').length,8);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);
  f.select('intake-filter','2025');assert.deepEqual(f.all('dd').map(node=>node.textContent),['0','0']);
  f.find('#reset-filters').events.click();assert.equal(f.all('.university-card').length,8);assert.equal(f.all('.compact-stage').length,0);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);
});
test('optional applicant form preserves matching and available-result instructions without hiding evidence',t=>{
  const f=fixture(t);f.click(b=>b.className==='university-card'&&b.textContent.includes('Nanyang'));f.click(b=>b.className==='programme-choice'&&b.textContent.includes('BSocSci'));
  assert.equal(f.find('#applicant-context').open,undefined);
  for(const [id,value]of [['applicant-board','cbse'],['applicant-citizenship','India'],['applicant-pr','no'],['applicant-results','available']])f.select(id,value);
  f.find('#applicant-context').querySelector('form').events.submit({preventDefault(){}});
  assert.equal(f.find('#timeline-category').value,'india-standard-12');assert.equal(f.find('#applicant-context').open,true);assert.match(f.find('#workspace').textContent,/already available/);assert.match(f.find('#workspace').textContent,/Applicant-rule source/);
});
test('reader/writer controls are deferred and current catalogue data stays unchanged',async()=>{
  const index=await readFile(new URL('../index.html',import.meta.url),'utf8');const app=await readFile(new URL('../src/static-app.js',import.meta.url),'utf8');
  assert.doesNotMatch(index,/writer-controls/);assert.doesNotMatch(app,/mountWriter|writer-ui/);assert.equal(catalogue.admissions.length,54);
});
test('programme popup closes on button or Escape and preserves selection, pane scroll and keyboard focus',t=>{
  const f=fixture(t);assert.ok(f.find('.university-pane'));assert.ok(f.find('.programmes-pane'));assert.equal(f.find('dialog'),null);
  f.find('.university-list').scrollTop=210;
  f.click(b=>b.className==='university-card'&&b.textContent.includes('Nanyang'));
  assert.equal(f.find('.university-list').scrollTop,210);assert.equal(f.all('.programme-choice').length,15);
  f.find('.programme-grid').scrollTop=140;
  f.click(b=>b.id==='programme-ntu-economics');assert.equal(f.find('dialog').open,true);assert.equal(f.all('.university-card').length,8);assert.equal(f.all('.programme-choice').length,15);
  f.find('dialog').events.cancel({preventDefault(){}});
  assert.equal(f.find('dialog'),null);assert.equal(f.find('.university-list').scrollTop,210);assert.equal(f.find('.programme-grid').scrollTop,140);assert.equal(document.activeElement.id,'programme-ntu-economics');
  f.click(b=>b.id==='programme-ntu-economics');f.click(b=>b.className.includes('close-programme'));assert.equal(f.find('dialog'),null);assert.equal(document.activeElement.id,'programme-ntu-economics');
});
test('upcoming dates turn red at the two-day boundary and open the exact programme/intake/category',t=>{
  let now=new Date('2026-11-27T15:59:00Z');const f=fixture(t,{clock:()=>now});assert.ok(f.all('.upcoming-item').length>1);assert.equal(f.all('.urgent').length,0);
  now=new Date('2026-11-27T16:00:00Z');f.browser.refreshDeadlines();assert.equal(f.all('.urgent').length,1);assert.match(f.find('.deadline-timing').textContent,/Urgent · In 2 days/);
  f.click(b=>b.className.includes('upcoming-programme'));const popup=f.find('dialog');assert.equal(popup.open,true);assert.equal(f.find('#timeline-category').value,'international');assert.match(f.find('#workspace').textContent,/30 Nov 2026/);assert.equal(f.find('#timeline-intake').value,'sim-buffalo-economics:2027:2027-01');
  now=new Date('2026-11-28T16:00:00Z');f.browser.refreshDeadlines();assert.equal(f.find('dialog'),popup,'midnight refresh must not replace an open global-deadline popup');
});
test('upcoming list honors main criteria and opens matching deadlines without changing them',t=>{
  const f=fixture(t,{clock:()=>new Date('2026-11-28T04:00:00Z')});assert.ok(f.all('.upcoming-item').length>1);f.select('intake-filter','2027');assert.ok(f.all('.upcoming-item').length>1);
  f.select('degree-filter','Master’s');assert.deepEqual(f.all('dd').map(node=>node.textContent),['0','0']);assert.equal(f.all('.upcoming-item').length,0);assert.ok(f.find('.upcoming-empty'));
  f.select('degree-filter','Bachelor’s');const returnId=f.find('.upcoming-programme').id;f.click(b=>b.className.includes('upcoming-programme'));assert.equal(f.find('dialog').open,true);assert.equal(f.find('#timeline-intake').value,'sim-buffalo-economics:2027:2027-01');assert.equal(f.find('#timeline-category').value,'international');assert.equal(f.find('#intake-filter').value,'2027');assert.equal(f.find('#degree-filter').value,'Bachelor’s');
  f.click(b=>b.className.includes('close-programme'));assert.equal(f.find('dialog'),null);assert.equal(document.activeElement.id,returnId);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);assert.ok(f.all('.upcoming-item').length>1);
});
test('ordinary brand clicks restore landing selection while preserving criteria',t=>{
  const f=fixture(t);f.select('intake-filter','2027');f.click(b=>b.id==='university-sg-ntu');f.click(b=>b.id==='programme-ntu-economics');f.select('applicant-board','cbse');f.click(b=>b.className.includes('close-programme'));f.find('.filter-panel').open=true;
  let prevented=false;f.find('.brand').events.click({button:0,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.ok(f.find('.pane-overview'));assert.equal(f.all('.selected').length,0);assert.equal(f.find('#timeline-category'),null);assert.equal(f.find('#intake-filter').value,'2027');assert.equal(f.find('#degree-filter').value,'Bachelor’s');assert.equal(f.find('.filter-panel').open,false);assert.equal(f.find('.university-country-group').open,false);assert.equal(document.activeElement.id,'universities-title');
  f.click(b=>b.id==='university-sg-ntu');f.click(b=>b.id==='programme-ntu-economics');assert.equal(f.find('#applicant-board').value,'');
});
test('modified and non-primary brand clicks keep native link behaviour',t=>{
  const f=fixture(t);f.click(b=>b.id==='university-sg-ntu');
  for(const options of [{ctrlKey:true},{metaKey:true},{shiftKey:true},{altKey:true},{button:1},{defaultPrevented:true}]){
    let prevented=false;f.find('.brand').events.click({button:0,...options,preventDefault(){prevented=true;}});assert.equal(prevented,false);assert.equal(f.all('.programme-choice').length,15);
  }
});

test('criteria survive a new browser mount while countries start collapsed and no university is selected',t=>{
  const storage=memoryStorage();const first=fixture(t,{storage});
  const country=first.find('#country-filter').querySelectorAll('input').find(input=>input.value==='Netherlands');country.checked=true;country.events.change();
  const subject=first.find('#subject-filter').querySelectorAll('input').find(input=>input.value==='Criminology');subject.checked=false;subject.events.change();
  first.select('degree-filter','Bachelor’s');first.select('intake-filter','2027');
  first.find('.university-country-group').open=true;
  const second=fixture(t,{storage});
  assert.deepEqual(second.find('#country-filter').querySelectorAll('input').filter(i=>i.checked).map(i=>i.value),['Singapore','Netherlands']);
  assert.deepEqual(second.find('#subject-filter').querySelectorAll('input').filter(i=>i.checked).map(i=>i.value),['Economics']);
  assert.equal(second.find('#intake-filter').value,'2027');assert.equal(second.find('#degree-filter').value,'Bachelor’s');
  assert.ok(second.find('.pane-overview'));assert.ok(second.all('.university-country-group').every(group=>group.open===false));
  second.find('#reset-filters').events.click();const third=fixture(t,{storage});assert.equal(third.find('#intake-filter').value,'');assert.deepEqual(third.all('dd').map(n=>n.textContent),['8','31']);
});

test('saved custom criteria and all-destination selections survive restart without creating programme data',t=>{
  const storage=memoryStorage();storage.setItem('admissions-atlas.criteria.v1',JSON.stringify({version:1,countries:[],subjects:['My subject'],degree:'',intake:''}));
  const f=fixture(t,{storage});assert.equal(f.find('#degree-filter').value,'');assert.match(f.find('#filter-summary').textContent,/All destinations/);
  assert.ok(f.find('#subject-filter').querySelectorAll('input').some(i=>i.value==='My subject'&&i.checked));assert.equal(f.all('.university-card').length,0);
});

test('corrupt, unavailable and quota-limited storage leave browsing usable',t=>{
  for(const storage of [{getItem:()=>'{bad',setItem(){}},{getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('quota');}},{getItem:()=>JSON.stringify({version:1,countries:'bad'}),setItem(){}}]){
    const f=fixture(t,{storage});assert.deepEqual(f.all('dd').map(n=>n.textContent),['8','31']);assert.equal(f.find('.university-country-group').open,false);
  }
});

test('a stale mixed catalogue cannot expose fictional university cards or deadlines',t=>{
  const inputCatalogue=structuredClone(catalogue);const original=inputCatalogue.programs.find(p=>p.id==='nus-economics');
  inputCatalogue.universities.push({id:'harbour',name:'Harbour University',country:'Singapore',city:'Singapore'});
  inputCatalogue.programs.push({...original,id:'harbour-economics',universityId:'harbour'});
  inputCatalogue.admissions.push({...structuredClone(inputCatalogue.admissions.find(a=>a.programId===original.id)),programId:'harbour-economics',dataType:'dummy'});
  const f=fixture(t,{inputCatalogue});assert.equal(f.find('#university-harbour'),null);assert.doesNotMatch(f.find('#workspace').textContent,/Harbour|Fictional/);assert.deepEqual(f.all('dd').map(n=>n.textContent),['8','31']);
});

test('deadline controls further narrow main criteria and persist',t=>{
  const storage=memoryStorage();const f=fixture(t,{storage});chooseCountries(f,['Singapore','Netherlands']);const allCount=f.all('.upcoming-item').length;assert.ok(allCount>0);
  f.select('deadline-country','Netherlands');const nlNames=new Set(rows.filter(row=>row.country==='Netherlands').map(row=>row.universityName));
  assert.ok(f.all('.upcoming-item').length>0);assert.ok(f.all('.upcoming-university').every(node=>nlNames.has(node.textContent)));
  const options=f.find('#deadline-university').children;assert.ok(options.every(option=>!option.value||option.value.startsWith('nl-')));
  f.select('deadline-university','nl-uva');assert.ok(f.all('.upcoming-university').every(node=>node.textContent==='University of Amsterdam'));assert.ok(f.all('.upcoming-item').length>0);
  assert.equal(f.find('#degree-filter').value,'Bachelor’s');assert.deepEqual(f.all('dd').map(node=>node.textContent),['16','48']);
  f.click(b=>b.className.includes('upcoming-programme'));assert.ok(f.find('dialog').open);assert.match(f.find('#timeline-category').value,/programme-route/);
  f.click(b=>b.className.includes('close-programme'));assert.equal(f.find('#deadline-university').value,'nl-uva');
  const next=fixture(t,{storage});assert.equal(next.find('#deadline-country').value,'Netherlands');assert.equal(next.find('#deadline-university').value,'nl-uva');
  next.select('deadline-country','Singapore');assert.equal(next.find('#deadline-university').value,'');assert.ok(next.find('#deadline-university').children.every(option=>!option.value||option.value.startsWith('sg-')));
  next.select('deadline-university','sg-suss');assert.ok(next.find('.upcoming-empty'));assert.equal(next.all('.upcoming-item').length,0);
  next.select('deadline-country','');assert.equal(next.find('#deadline-university').value,'sg-suss');next.select('deadline-university','');assert.equal(next.all('.upcoming-item').length,allCount);
});

test('unknown saved deadline filters safely reset to all countries and universities',t=>{
  const storage=memoryStorage();storage.setItem('admissions-atlas.criteria.v1',JSON.stringify({version:1,countries:['Singapore'],subjects:['Economics'],degree:'Bachelor’s',intake:'',deadlineFilters:{country:'Missing country',universityId:'deleted-university'}}));
  const f=fixture(t,{storage});assert.equal(f.find('#deadline-country').value,'');assert.equal(f.find('#deadline-university').value,'');assert.ok(f.all('.upcoming-item').length>0);
});

test('compact deadline filters combine stage and verification, preserve expansion and restore choices',t=>{
  const storage=memoryStorage();const f=fixture(t,{storage});chooseCountries(f,['Singapore','Netherlands']);assert.equal(f.find('.deadline-filter-panel').open,false);
  f.find('.deadline-filter-panel').open=true;f.select('deadline-stage','application');assert.ok(f.all('.upcoming-item').length>0);
  assert.ok(f.all('.upcoming-item').every(item=>item.querySelector('strong').textContent==='Submit application'));
  f.select('deadline-verification','verified');assert.ok(f.all('.upcoming-item').length>0);assert.equal(f.find('.deadline-filter-panel').open,true);assert.match(f.find('.deadline-filter-panel').querySelector('summary').textContent,/2 active/);
  f.select('deadline-country','Netherlands');assert.equal(f.find('#deadline-stage').value,'application');assert.equal(f.find('#deadline-verification').value,'verified');
  const second=fixture(t,{storage});assert.equal(second.find('#deadline-stage').value,'application');assert.equal(second.find('#deadline-verification').value,'verified');assert.equal(second.find('.deadline-filter-panel').open,false);
  second.select('deadline-verification','tentative');assert.equal(second.all('.upcoming-item').length,0);assert.ok(second.find('.upcoming-empty'));
  second.select('deadline-verification','');second.select('deadline-stage','documents');assert.ok(second.all('.upcoming-item').every(item=>item.querySelector('strong').textContent==='Supporting documents'));
});

test('review and manual status filters distinguish actual dated records without promoting verification',t=>{
  const inputCatalogue=structuredClone(catalogue);const admission=inputCatalogue.admissions.find(a=>a.programId==='sim-buffalo-economics'&&a.intake.month===1);
  const stage=admission.routes.find(r=>r.id==='international').stages.find(s=>s.type==='application');stage.status='needs-review';
  const f=fixture(t,{inputCatalogue});f.select('deadline-verification','needs-review');assert.ok(f.all('.upcoming-item').length>0);assert.ok(f.all('.upcoming-item').every(item=>item.textContent.includes('Needs review')));
  f.select('deadline-verification','manual-unverified');assert.equal(f.all('.upcoming-item').length,0);assert.ok(f.find('.upcoming-empty'));
});

test('known non-English programmes use a coloured card and explicit label in cards, timelines and deadlines',t=>{
  const f=fixture(t);const nl=f.find('#country-filter').querySelectorAll('input').find(i=>i.value==='Netherlands');nl.checked=true;nl.events.change();
  for(const university of ['nl-leiden','nl-erasmus','nl-vu']){
    f.click(b=>b.id===`university-${university}`);const card=f.find(`#programme-${university}-criminology`);assert.match(card.className,/non-english-programme/);assert.equal(card.querySelector('.language-notice').textContent,'Taught in Dutch');
    f.click(b=>b.id===card.id);assert.match(f.find('#timeline-title').className,/non-english-title/);assert.equal(f.find('.compact-timeline').querySelector('.language-notice').textContent,'Taught in Dutch');f.click(b=>b.className.includes('close-programme'));
  }
  f.find('.brand').events.click({preventDefault(){}});f.select('deadline-country','Netherlands');f.select('deadline-university','nl-leiden');assert.ok(f.all('.upcoming-item').length>0);assert.ok(f.all('.upcoming-item').every(item=>item.querySelector('.language-notice')?.textContent==='Taught in Dutch'));
  assert.deepEqual(nonEnglishLanguages({}),[]);assert.deepEqual(nonEnglishLanguages({teachingLanguages:['English','Dutch']}),[]);assert.deepEqual(nonEnglishLanguages({teachingLanguages:['Dutch']}),['Dutch']);
});

test('annual selection includes every entry period and future intake shows shifted tentative dates with originals',t=>{
  const storage=memoryStorage();const f=fixture(t,{storage});const before=JSON.stringify(catalogue);
  assert.equal(f.find('#intake-filter').type,'number');f.select('intake-filter','2027');assert.deepEqual(f.all('dd').map(n=>n.textContent),['8','31']);
  f.click(b=>b.id==='university-sg-sim-buffalo');f.click(b=>b.id==='programme-sim-buffalo-economics');assert.equal(f.find('#timeline-intake').children.length,3);f.click(b=>b.className.includes('close-programme'));
  f.select('intake-filter','2028');assert.match(f.find('.intake-reference-note').textContent,/Tentative 2028/);assert.match(f.find('.intake-reference-note').textContent,/2027 academic-year/);
  f.click(b=>b.id==='university-sg-ntu');assert.match(f.find('#programme-ntu-economics').textContent,/2028 · Tentative/);f.click(b=>b.id==='programme-ntu-economics');f.select('timeline-category','india-standard-12');
  assert.match(f.find('.compact-timeline').textContent,/19 Mar 2028/);assert.match(f.find('.compact-timeline').textContent,/19 Mar 2027/);assert.equal(f.find('#applicant-context'),null);assert.ok(f.all('.compact-stage').filter(stage=>stage.querySelector('.compact-date').textContent!=='Date unavailable').every(stage=>stage.querySelector('.pill').textContent==='Tentative'));
  const next=fixture(t,{storage});assert.equal(next.find('#intake-filter').value,'2028');assert.equal(JSON.stringify(catalogue),before);
});

test('saved month-based criteria migrate to annual intake without losing other preferences',t=>{
  const storage=memoryStorage();storage.setItem('admissions-atlas.criteria.v1',JSON.stringify({version:1,countries:['Singapore'],subjects:['Economics'],degree:'Bachelor’s',intake:'2027-09'}));const f=fixture(t,{storage});assert.equal(f.find('#intake-filter').value,'2027');assert.ok(f.all('.university-card').length>1);
});

test('removing a main destination removes its deadlines, clears incompatible subfilters and saves the result',t=>{
  const storage=memoryStorage();const f=fixture(t,{storage});chooseCountries(f,['Singapore','Netherlands']);f.select('deadline-country','Netherlands');f.select('deadline-university','nl-leiden');f.select('deadline-stage','application');f.select('deadline-verification','verified');assert.ok(f.all('.upcoming-item').length>0);
  chooseCountries(f,['Singapore']);assert.equal(f.find('#deadline-country').value,'');assert.equal(f.find('#deadline-university').value,'');assert.equal(f.find('#deadline-stage').value,'application');assert.equal(f.find('#deadline-verification').value,'verified');
  const sg=new Set(rows.filter(row=>row.country==='Singapore').map(row=>row.universityName));assert.ok(f.all('.upcoming-item').length>0);assert.ok(f.all('.upcoming-university').every(node=>sg.has(node.textContent)));assert.ok(f.find('#deadline-country').children.every(option=>option.value!=='Netherlands'));
  const next=fixture(t,{storage});assert.deepEqual(next.find('#country-filter').querySelectorAll('input').filter(input=>input.checked).map(input=>input.value),['Singapore']);assert.equal(next.find('#deadline-country').value,'');assert.ok(next.all('.upcoming-university').every(node=>sg.has(node.textContent)));
});

test('home preserves saved search and deadline criteria; a typed year saves before blur',t=>{
  const storage=memoryStorage();const f=fixture(t,{storage});chooseCountries(f,['Netherlands']);f.select('deadline-university','nl-leiden');f.select('deadline-stage','application');f.select('deadline-verification','verified');
  const year=f.find('#intake-filter');year.value='2027';year.events.input();f.find('.brand').events.click({preventDefault(){}});
  assert.equal(f.find('#intake-filter').value,'2027');assert.equal(f.find('#deadline-university').value,'nl-leiden');assert.ok(f.find('.pane-overview'));
  const next=fixture(t,{storage});assert.equal(next.find('#intake-filter').value,'2027');assert.equal(next.find('#deadline-university').value,'nl-leiden');assert.equal(next.find('#deadline-stage').value,'application');assert.equal(next.find('#deadline-verification').value,'verified');assert.deepEqual(next.find('#country-filter').querySelectorAll('input').filter(input=>input.checked).map(input=>input.value),['Netherlands']);
  const note=fixture(t,{storage:{getItem:()=>null,setItem:()=>{throw Error('blocked');}}});assert.match(note.find('#filter-note').textContent,/cannot save/);
});

test('subject and intake criteria constrain deadlines as well as universities',t=>{
  const f=fixture(t);chooseCountries(f,['Netherlands']);const subjectInputs=f.find('#subject-filter').querySelectorAll('input');subjectInputs.forEach(input=>{input.checked=input.value==='Criminology';});subjectInputs[0].events.change();
  assert.ok(f.all('.upcoming-item').length>0);assert.ok(f.all('.upcoming-programme').every(node=>node.textContent.includes('Criminologie')));
  f.select('intake-filter','2025');assert.equal(f.all('.upcoming-item').length,0);assert.ok(f.find('.upcoming-empty'));
});

test('projected timeline displays selected-year guidance above separately labelled original evidence',t=>{
  const f=fixture(t);chooseCountries(f,['Netherlands']);f.select('intake-filter','2028');f.click(b=>b.id==='university-nl-uva');f.click(b=>b.id==='programme-nl-uva-economics');f.select('timeline-category','programme-route');
  const application=f.all('.compact-stage').find(stage=>stage.querySelector('h3').textContent==='Apply by');const details=application.querySelector('.compact-stage-details');assert.match(details.children[1].textContent,/15 January 2028 for September 2028/);
  const evidence=details.children.find(child=>child.tag==='details');assert.match(evidence.querySelector('summary').textContent,/Original 2027 source evidence/);assert.match(evidence.textContent,/15 January 2027/);assert.match(evidence.textContent,/Checked 2026-11-20/);assert.match(document.title,/2028/);
});
