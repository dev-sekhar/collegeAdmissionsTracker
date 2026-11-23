import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {configureWriter,readWriterCredentials,checkWriterPassword} from '../scripts/writer-auth.mjs';
import {createAdmissionsServer} from '../scripts/serve-static.mjs';
import {createDateStore} from '../scripts/writer-store.mjs';

test('local writer passwords accept six or more letters/digits only',async()=>{
  const {makeWriterCredentials}=await import('../scripts/writer-auth.mjs');
  for(const password of ['abc123','abcdef','123456']){const credentials=await makeWriterCredentials('writer',password);assert.equal(await checkWriterPassword(credentials,'writer',password),true);}
  for(const password of ['abc12','abc 123','abc-123','abc123!','éabc123','a'.repeat(513)])await assert.rejects(()=>makeWriterCredentials('writer',password),/letters and digits/);
});

test('authenticated writer saves the exact YAML and generated JSON; readers cannot write',async t=>{
  const root=await mkdtemp(path.join(tmpdir(),'admissions-writer-test-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  await cp(new URL('../data',import.meta.url),path.join(root,'data'),{recursive:true});
  await mkdir(path.join(root,'dist'),{recursive:true});
  const password='TestOnlyPassword2027';
  await configureWriter(root,'.writer',password);
  const credentials=await readWriterCredentials(root);
  assert.equal(credentials.username,'.writer');
  assert.equal(await checkWriterPassword(credentials,'.writer',password),true);
  assert.equal(await checkWriterPassword(credentials,'.writer','wrong-password'),false);
  assert.ok(!JSON.stringify(credentials).includes(password));
  let now=Date.now();
  const server=createAdmissionsServer({rootDir:root,clock:()=>now,sessionLifetime:60000});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const post=(endpoint,data,extra={})=>fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,...extra},body:JSON.stringify(data)});
  assert.equal((await (await fetch(base+'/writer/session')).json()).role,'reader');
  assert.equal((await post('/writer/save-date',{})).status,401);
  assert.equal((await fetch(base+'/.local-writer/credentials.json')).status,404);
  assert.equal((await post('/writer/login',{username:'.writer',password},{Origin:'https://foreign.example'})).status,403);
  const login=await post('/writer/login',{username:'.writer',password});
  assert.equal(login.status,200);
  assert.match(login.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const {csrf}=await login.json();
  const headers={Cookie:cookie,'x-writer-csrf':csrf};
  const key='sim-buffalo-economics:2027:2027-08';
  const store=createDateStore(root);
  const record=await store.getRecord(key);
  const before=structuredClone(record.doc);
  const input={key,routeId:record.doc.routes[0].id,stageType:'application',deadline:{kind:'date',date:'2027-06-27'},wording:'Manually entered date pending official verification',note:'Test-only manual update',expectedRevision:record.revision};
  assert.equal((await post('/writer/save-date',input,{Cookie:cookie})).status,403);
  assert.equal((await post('/writer/save-date',{...input,filename:'../../other.yaml'},headers)).status,400);
  assert.equal((await post('/writer/save-date',{...input,deadline:{kind:'date',date:'2027-02-30'}},headers)).status,400);
  assert.equal((await post('/writer/save-date',input,headers)).status,200);
  const after=await store.getRecord(key);
  assert.notEqual(after.revision,record.revision);
  const stage=after.doc.routes[0].stages.find(s=>s.type==='application');
  assert.equal(stage.status,'manual-unverified');assert.equal(stage.deadline.date,'2027-06-27');
  assert.equal(stage.manualEntry.enteredBy,'.writer');assert.deepEqual(stage.sourceIds,[]);
  before.routes[0].stages[before.routes[0].stages.findIndex(s=>s.type==='application')]=stage;
  assert.deepEqual(after.doc,before,'all other YAML details remain intact');
  const generated=await readFile(path.join(root,'data/generated/catalogue.json'),'utf8');
  assert.equal(generated,await readFile(path.join(root,'dist/data/generated/catalogue.json'),'utf8'));
  assert.equal(JSON.parse(generated).admissions.find(a=>a.programId==='sim-buffalo-economics'&&a.intake.month===8).routes[0].stages.find(s=>s.type==='application').status,'manual-unverified');
  const audit=JSON.parse((await readFile(path.join(root,'.local-writer/audit.jsonl'),'utf8')).trim());
  assert.equal(audit.before.status,'verified');assert.equal(audit.after.status,'manual-unverified');
  assert.equal((await post('/writer/save-date',input,headers)).status,409,'stale forms cannot overwrite newer YAML');
  now+=60001;
  assert.equal((await post('/writer/save-date',input,headers)).status,401,'expired sessions cannot write');
});

test('writer sessions reject forged cookies, survive no credential rotation, and logout revokes access',async t=>{
  const credentials=await (await import('../scripts/writer-auth.mjs')).makeWriterCredentials('writer','TestOnlySecurePassword');
  let current=credentials;
  const server=createAdmissionsServer({credentialsProvider:async()=>current});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const login=()=>fetch(base+'/writer/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'writer',password:'TestOnlySecurePassword'})});
  const forged=await fetch(base+'/writer/record?key=x',{headers:{Cookie:'admissions_writer=writer'}});assert.equal(forged.status,401);
  const first=await login();const cookie=first.headers.get('set-cookie').split(';')[0];const {csrf}=await first.json();
  const logout=await fetch(base+'/writer/logout',{method:'POST',headers:{Origin:base,Cookie:cookie,'x-writer-csrf':csrf}});assert.equal(logout.status,200);
  assert.equal((await (await fetch(base+'/writer/session',{headers:{Cookie:cookie}})).json()).role,'reader');
  const second=await login();const secondCookie=second.headers.get('set-cookie').split(';')[0];
  current={...credentials,hash:'0'.repeat(128)};
  assert.equal((await (await fetch(base+'/writer/session',{headers:{Cookie:secondCookie}})).json()).role,'reader');
  current=null;
  assert.equal((await login()).status,503);
});

test('repeated incorrect passwords are rate limited',async t=>{
  const credentials=await (await import('../scripts/writer-auth.mjs')).makeWriterCredentials('writer','TestOnlySecurePassword');
  const server=createAdmissionsServer({credentialsProvider:async()=>credentials});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.closeAllConnections();server.close(resolve);}));
  const base=`http://127.0.0.1:${server.address().port}`;
  for(let i=0;i<6;i++){
    const response=await fetch(base+'/writer/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({username:'writer',password:'incorrect'})});
    assert.equal(response.status,i<5?401:429);
  }
});
