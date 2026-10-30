import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createJobs} from '../scripts/local-jobs.mjs';
import {intakeEvidence,intakeGroup,emptyStage,retainedEvidence,withIntakeContext} from '../src/coverage.js';
import {sourceDomain} from '../src/catalogue-sources.js';
import {programEvidence} from '../src/discovery.js';

test('official document title confirms a program without h1 but catalogue guesses alone do not',()=>{
  const subjects=['Computer Science'];
  const proof=programEvidence([],'Bachelor of Science (Computer Science) | School of Computing','',subjects,'Bachelor’s');
  assert.equal(proof.heading,'Bachelor of Science (Computer Science)');
  assert.equal(programEvidence(['Computing programmes'],'University homepage','',subjects,'Bachelor’s'),null);
  assert.equal(programEvidence(['Master of Computer Science'],'Master of Computer Science','',subjects,'Bachelor’s'),null);
});

const request={countries:['Singapore'],subjects:['Computer Science'],degree:'Bachelor’s',intake:'August 2027'};
async function settle(jobs){for(let i=0;i<100&&jobs.snapshot().status==='running';i++)await new Promise(resolve=>setTimeout(resolve,10));return jobs.snapshot();}
test('local jobs run discovery, collection and verification in order without forwarding personal fields',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'admissions-test-'));const launches=[];
  const jobs=createJobs(root,(command,args,options)=>{
    launches.push({command,args,options});const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};
    setTimeout(()=>{child.stdout.emit('data','Checked official source');child.emit('exit',0);},10);return child;
  });
  try{
    jobs.start({...request,citizenship:'private',script:'untrusted'});
    assert.throws(()=>jobs.start(request),/already active/);
    assert.equal((await settle(jobs)).status,'completed');
    assert.deepEqual(launches.map(item=>path.basename(item.args[0])),['discover.mjs','collect-deadlines.mjs','verify-deadlines.mjs']);
    assert.deepEqual(JSON.parse(await readFile(path.join(root,'data/local-request.json'),'utf8')),request);
    assert.ok(launches.every(item=>item.options.windowsHide&&item.options.stdio[0]==='ignore'));
  }finally{await rm(root,{recursive:true,force:true});}
});
test('a failed discovery stops later phases and a new request can retry',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'admissions-test-'));let calls=0;
  const jobs=createJobs(root,()=>{calls++;const child=new EventEmitter();child.stdout=new EventEmitter();child.stderr=new EventEmitter();child.kill=()=>{};setTimeout(()=>child.emit('exit',1),1);return child;});
  try{jobs.start(request);assert.equal((await settle(jobs)).status,'failed');assert.equal(calls,1);jobs.start(request);await settle(jobs);assert.equal(calls,2);assert.throws(()=>jobs.start({...request,countries:[]}),/Invalid countries/);}finally{await rm(root,{recursive:true,force:true});}
});
test('intake evidence needs an explicit year and program source; application dates are not start dates',()=>{
  const url='https://www.comp.nus.edu.sg/programmes/ug/cs';const source={sourceUrl:url,checkedAt:'2026-10-30'};
  const blocks=[{text:'Start date:\nAugust 2027'},{text:'Applications close August 2027'},{text:'Annual intake in August'},{text:'Scholarship intake August 2027'}];
  const intakes=intakeEvidence(blocks,source,url);assert.equal(intakes.length,1);
  assert.deepEqual(intakeEvidence(blocks,{...source,sourceUrl:'https://www.nus.edu.sg/calendar'},url),[]);
  assert.equal(intakeGroup({intakes},'August 2027'),'Published intake evidence');
  assert.equal(intakeGroup({intakes},''),'Published intake evidence');
  assert.equal(intakeGroup({intakes},'September 2027'),'Alternative published intake');
  assert.equal(intakeGroup({},'August 2027'),'Intake awaiting confirmation');
});
test('missing evidence separates not checked, incomplete sources and date not found',()=>{
  assert.match(emptyStage(null,'application'),/Not checked/);
  assert.match(emptyStage({candidates:[],failures:[{reason:'403'}]},'application'),/Source unavailable/);
  assert.match(emptyStage({candidates:[],failures:[]},'application'),/Date not found/);
});
test('same-page intake enrichment uses a unique published start, never a deadline year or ambiguous starts',()=>{
  const base={sourceUrl:'https://official/program',blocks:[{type:'text',text:'Start date: September 2027',context:'Computer Science'},{type:'text',text:'Application deadline: 13 January 2027',context:'Computer Science'}]};
  assert.match(withIntakeContext(base).blocks[1].context,/September 2027 Intake/);
  assert.equal(withIntakeContext({...base,blocks:base.blocks.slice(1)}).blocks[0].context,'Computer Science');
  const ambiguous={...base,blocks:[...base.blocks,{text:'Start date: January 2028'}]};
  assert.equal(withIntakeContext(ambiguous),ambiguous);
});
test('subset refresh retains only still-known unselected program evidence without changing timestamps',()=>{
  const previous={programs:[{programId:'retained',programUrl:'https://official/keep',checkedAt:'old'},{programId:'selected',programUrl:'https://official/new'},{programId:'changed',programUrl:'https://official/old'},{programId:'removed',programUrl:'https://official/gone'}]};
  const catalogue={programs:[{id:'retained',sourceUrl:'https://official/keep'},{id:'selected',sourceUrl:'https://official/new'},{id:'changed',sourceUrl:'https://official/changed'}]};
  const result=retainedEvidence(previous,catalogue,new Set(['selected']));
  assert.deepEqual(result,[previous.programs[0]]);assert.equal(result[0].checkedAt,'old');
});
test('source allowlist rejects lookalike and non-HTTPS hosts',()=>{
  assert.equal(sourceDomain('https://admissions.smu.edu.sg/programmes'),'smu.edu.sg');
  assert.equal(sourceDomain('https://smu.edu.sg.attacker.example/'),undefined);
  assert.equal(sourceDomain('http://www.smu.edu.sg'),false);
});
