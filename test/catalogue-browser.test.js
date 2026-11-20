import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {catalogueRows,deadlineLabel} from '../src/catalogue-model.js';
import {groupUniversities,groupProgrammes,universityList} from '../src/browse-components.js';
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
  f.select('intake-filter','2027-09');assert.equal(f.find('#timeline-category'),null);assert.equal(f.all('.university-card').length,1);assert.deepEqual(f.all('dd').map(node=>node.textContent),['1','4']);
  f.select('intake-filter','2099-01');assert.deepEqual(f.all('dd').map(node=>node.textContent),['0','0']);
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
test('upcoming list covers the full catalogue and opens hidden intakes without changing browse filters',t=>{
  const f=fixture(t,{clock:()=>new Date('2026-11-28T04:00:00Z')});assert.ok(f.all('.upcoming-item').length>1);f.select('intake-filter','2027-08');assert.ok(f.all('.upcoming-item').length>1);
  f.select('degree-filter','Master’s');assert.deepEqual(f.all('dd').map(node=>node.textContent),['0','0']);assert.ok(f.all('.upcoming-item').length>1);assert.match(f.find('.upcoming-label').textContent,/All universities/);
  const returnId=f.find('.upcoming-programme').id;f.click(b=>b.className.includes('upcoming-programme'));assert.equal(f.find('dialog').open,true);assert.equal(f.find('#timeline-intake').value,'sim-buffalo-economics:2027:2027-01');assert.equal(f.find('#timeline-category').value,'international');assert.equal(f.find('#intake-filter').value,'2027-08');assert.equal(f.find('#degree-filter').value,'Master’s');
  f.click(b=>b.className.includes('close-programme'));assert.equal(f.find('dialog'),null);assert.equal(document.activeElement.id,returnId);assert.deepEqual(f.all('dd').map(node=>node.textContent),['0','0']);assert.ok(f.all('.upcoming-item').length>1);
});
test('ordinary brand clicks restore the default landing state without document navigation',t=>{
  const f=fixture(t);f.select('intake-filter','2027-08');f.click(b=>b.id==='university-sg-ntu');f.click(b=>b.id==='programme-ntu-economics');f.select('applicant-board','cbse');f.click(b=>b.className.includes('close-programme'));f.find('.filter-panel').open=true;
  let prevented=false;f.find('.brand').events.click({button:0,preventDefault(){prevented=true;}});
  assert.equal(prevented,true);assert.ok(f.find('.pane-overview'));assert.equal(f.all('.selected').length,0);assert.equal(f.find('#timeline-category'),null);assert.equal(f.find('#intake-filter').value,'');assert.equal(f.find('#degree-filter').value,'Bachelor’s');assert.equal(f.find('.filter-panel').open,false);assert.equal(f.find('.university-country-group').open,false);assert.equal(document.activeElement.id,'universities-title');
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
  first.select('degree-filter','Bachelor’s');first.select('intake-filter','2027-09');
  first.find('.university-country-group').open=true;
  const second=fixture(t,{storage});
  assert.deepEqual(second.find('#country-filter').querySelectorAll('input').filter(i=>i.checked).map(i=>i.value),['Singapore','Netherlands']);
  assert.deepEqual(second.find('#subject-filter').querySelectorAll('input').filter(i=>i.checked).map(i=>i.value),['Economics']);
  assert.equal(second.find('#intake-filter').value,'2027-09');assert.equal(second.find('#degree-filter').value,'Bachelor’s');
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
