import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCatalogue} from '../scripts/build-catalogue.mjs';
import {catalogueRows} from '../src/catalogue-model.js';
import {applicantContextPanel,timelinePanel} from '../src/static-components.js';
import {emptyApplicant} from '../src/applicant-routes.js';

// Minimal DOM adapter exercises shared form callbacks and rendered route states.
class Element {
  constructor(tag){this.tag=tag;this.children=[];this.events={};this.attributes={};this.className='';this.value='';this.text='';}
  set textContent(value){this.text=String(value);this.children=[];}
  get textContent(){return this.text+this.children.map(child=>child.textContent||'').join(' ');}
  append(...children){this.children.push(...children);}
  setAttribute(key,value){this.attributes[key]=value;}
  addEventListener(name,callback){this.events[name]=callback;}
  querySelector(tag){return walk(this).find(node=>node.tag===tag);}
}
function walk(node){return [node,...node.children.flatMap(child=>walk(child))];}
globalThis.document={createElement:tag=>new Element(tag)};
test.after(()=>{delete globalThis.document;});

test('editing several applicant controls preserves all draft values on Apply',()=>{
  let draft=emptyApplicant();let applied;let cleared=false;
  const panel=applicantContextPanel(draft,value=>{draft=value;},()=>{applied={...draft};},()=>{cleared=true;});
  const set=(id,value)=>{const control=walk(panel).find(node=>node.id===id);control.value=value;control.events.change();};
  set('applicant-board','cbse');set('applicant-citizenship','India');set('applicant-pr','no');set('applicant-results','pending');
  assert.equal(applied,undefined);
  panel.querySelector('form').events.submit({preventDefault(){}});
  assert.deepEqual(applied,{board:'cbse',stateBoard:'',citizenship:'India',singaporePr:'no',results:'pending'});
  walk(panel).find(node=>node.tag==='button'&&node.textContent==='Clear applicant details').events.click();assert.equal(cleared,true);
});

test('state board field captures text without presenting it as a verified qualification',()=>{
  let draft={...emptyApplicant(),board:'state-other'};
  const panel=applicantContextPanel(draft,value=>{draft=value;},()=>{},()=>{});
  const input=walk(panel).find(node=>node.id==='applicant-state-board');input.value='Maharashtra HSC';input.events.input();
  assert.equal(draft.stateBoard,'Maharashtra HSC');assert.match(panel.textContent,/not yet individually verified/);
});

test('timeline renders no deadline list before matching or when evidence needs review',async()=>{
  const rows=catalogueRows(await buildCatalogue({check:true}));const get=id=>rows.find(row=>row.programId===id);
  const applicant={board:'cbse',citizenship:'India',singaporePr:'no',results:'pending',stateBoard:''};
  for(const [row,profile] of [[get('ntu-economics'),emptyApplicant()],[get('nus-economics'),applicant],[get('kaplan-criminal-behaviour'),applicant]]){
    const panel=timelinePanel(row,profile);assert.match(panel.textContent,/Route not determined/);assert.equal(walk(panel).filter(node=>node.tag==='ol').length,0);
  }
  const matched=timelinePanel(get('ntu-economics'),applicant);
  assert.match(matched.textContent,/Matched to verified rule/);assert.match(matched.textContent,/19 Mar 2027/);assert.equal(walk(matched).filter(node=>node.tag==='ol').length,1);
  assert.equal(walk(matched).some(node=>node.tag==='select'&&node.id==='applicant-route'),false);
});
