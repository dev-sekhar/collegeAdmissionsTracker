import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {catalogueRows,deadlineLabel} from '../src/catalogue-model.js';
import {groupUniversities,groupProgrammes,universityList} from '../src/browse-components.js';
import {mountAdmissionsBrowser} from '../src/catalogue-browser.js';
const catalogue=await buildCatalogue({check:true});
const rows=catalogueRows(catalogue);const real=rows.filter(row=>row.admission.dataType==='real');
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
function fixture(t,{clock=()=>new Date('2026-11-20T04:00:00Z')}={}){
  const root=new Element('main');for(const id of ['workspace','announcer','filters','filter-summary','filter-note','reset-filters']){const e=new Element(id==='reset-filters'?'button':'div');e.id=id;root.append(e);}
  globalThis.document={createElement:tag=>new Element(tag),createTextNode:text=>{const node=new Element('text');node.textContent=text;return node;},querySelector:selector=>root.querySelector(selector)};
  t.after(()=>{delete globalThis.document;});const browser=mountAdmissionsBrowser(catalogue,{clock});
  const find=selector=>root.querySelector(selector);const all=selector=>root.querySelectorAll(selector);
  return {root,find,all,browser,click(predicate){const b=all('button').find(predicate);assert.ok(b,'button exists');b.events.click();},select(id,value){const e=find('#'+id);assert.ok(e,`${id} exists`);e.value=value;e.events.change();}};
}
test('university/programme grouping deduplicates intake rows without losing any intake',()=>{
  assert.equal(groupUniversities(real).length,8);assert.equal(groupProgrammes(real).length,31);
  const buffalo=groupProgrammes(real).find(item=>item.programId==='sim-buffalo-economics');assert.equal(buffalo.intakes.length,3);
  assert.equal(groupProgrammes(real).filter(item=>item.universityId==='sg-sim-uol').length,4);
});
test('country sections retain every university and compact ranks do not invent missing values',t=>{
  const f=fixture(t);assert.equal(f.all('.country-heading').length,1);assert.equal(f.find('.country-heading').textContent,'Singapore');
  const list=universityList(groupUniversities(rows),'',()=>{});const groups=list.querySelectorAll('.university-country-group');
  assert.equal(groups.length,new Set(rows.map(row=>row.country)).size);assert.equal(list.querySelectorAll('.university-card').length,groupUniversities(rows).length);
  for(const university of groupUniversities(rows)){
    const card=list.querySelector(`#university-${university.universityId}`);assert.equal(card.querySelector('.university-name').textContent,university.universityName);
    const rank=card.querySelector('.university-rank');assert.equal(rank.textContent,university.qsRanking?.status==='verified'?`#${university.qsRanking.rank}`:'—');
    assert.equal(card.querySelector('.country-label'),null);assert.doesNotMatch(card.textContent,/QS World|awarding university|View programmes/);
  }
});
test('country tiles retain collapsed state across filtering and popup close without a repeated list title',t=>{
  const f=fixture(t);const country=f.find('.university-country-group');assert.equal(country.tag,'details');assert.equal(country.open,true);assert.equal(f.find('.pane-title'),null);
  country.open=false;f.find('#reset-filters').events.click();assert.equal(f.find('.university-country-group').open,false);
  f.find('.university-country-group').open=true;
  f.click(b=>b.id==='university-sg-ntu');f.click(b=>b.id==='programme-ntu-economics');f.click(b=>b.className.includes('close-programme'));
  assert.equal(f.find('.university-country-group').open,true);assert.equal(f.find('.university-name').title,f.find('.university-name').textContent);
});
test('left university list, right programme pane, modal category and intake reset form a complete journey',t=>{
  const f=fixture(t);assert.equal(f.all('.university-card').length,8);assert.equal(f.find('#timeline-category'),null);assert.deepEqual(f.all('dt').map(node=>node.textContent),['Universities','Programs']);assert.deepEqual(f.all('dd').map(node=>node.textContent),['8','31']);assert.match(f.find('.upcoming-empty').textContent,/No recorded activities end/);
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
  assert.doesNotMatch(index,/writer-controls/);assert.doesNotMatch(app,/mountWriter|writer-ui/);assert.equal(catalogue.admissions.length,45);
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
  let now=new Date('2026-11-27T15:59:00Z');const f=fixture(t,{clock:()=>now});assert.equal(f.all('.upcoming-item').length,1);assert.equal(f.all('.urgent').length,0);
  now=new Date('2026-11-27T16:00:00Z');f.browser.refreshDeadlines();assert.equal(f.all('.urgent').length,1);assert.match(f.find('.deadline-timing').textContent,/Urgent · In 2 days/);
  f.click(b=>b.className.includes('upcoming-programme'));assert.equal(f.find('dialog').open,true);assert.equal(f.find('#timeline-category').value,'international');assert.match(f.find('#workspace').textContent,/30 Nov 2026/);assert.equal(f.find('#timeline-intake').value,'sim-buffalo-economics:2027:2027-01');
});
test('upcoming list follows the filtered intake rather than showing unrelated deadlines',t=>{
  const f=fixture(t,{clock:()=>new Date('2026-11-28T04:00:00Z')});assert.equal(f.all('.upcoming-item').length,1);f.select('intake-filter','2027-08');assert.equal(f.all('.upcoming-item').length,0);assert.ok(f.find('.upcoming-empty'));
});
