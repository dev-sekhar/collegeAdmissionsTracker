import {readFile,readdir,realpath,mkdir,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import path from 'node:path';
import {parseDocument} from 'yaml';
import {readCatalogue,parseYaml} from './build-catalogue.mjs';
import {intakeKey} from '../src/catalogue-model.js';
export const revisionOf=text=>createHash('sha256').update(text).digest('hex');
export class WriterError extends Error{constructor(status,message){super(message);this.status=status;}}
async function optionalRead(file){try{return await readFile(file,'utf8');}catch(error){if(error.code==='ENOENT')return null;throw error;}}
function within(root,file){const relative=path.relative(root,file);if(relative.startsWith('..')||path.isAbsolute(relative))throw new WriterError(400,'File is outside the admissions workspace');}
async function admissionFiles(folder){const output=[];for(const entry of await readdir(folder,{withFileTypes:true})){if(entry.isSymbolicLink())throw new WriterError(400,'Admissions symlinks are not supported');const file=path.join(folder,entry.name);if(entry.isDirectory())output.push(...await admissionFiles(file));else if(/\.ya?ml$/u.test(entry.name))output.push(file);}return output;}
async function atomicBatch(updates){
  const prepared=[];const installed=[];
  try{
    for(const [file,content] of updates){await mkdir(path.dirname(file),{recursive:true});const original=await optionalRead(file);const temporary=`${file}.writer-${randomBytes(12).toString('hex')}.tmp`;await writeFile(temporary,content,{flag:'wx',mode:0o600});prepared.push({file,content,original,temporary});}
    for(const item of prepared){await rename(item.temporary,item.file);installed.push(item);}
  }catch(error){
    for(const item of installed.reverse()){if(item.original===null)await unlink(item.file).catch(()=>{});else{const rollback=`${item.file}.rollback-${randomBytes(8).toString('hex')}.tmp`;await writeFile(rollback,item.original);await rename(rollback,item.file);}}
    throw error;
  }finally{for(const item of prepared)await unlink(item.temporary).catch(()=>{});}
}
export function createDateStore(root){
  let queue=Promise.resolve();
  async function record(key){
    if(typeof key!=='string'||key.length>180)throw new WriterError(400,'Invalid programme/intake key');
    const catalogue=await readCatalogue({rootDir:root});const base=await realpath(path.join(root,'data/admissions'));
    for(const file of await admissionFiles(base)){
      within(base,await realpath(file));const text=await readFile(file,'utf8');const doc=parseYaml(text);const program=catalogue.programs.find(p=>p.id===doc.programId);const university=catalogue.universities.find(u=>u.id===program?.universityId);
      if(`${doc.programId}:${doc.cycle}:${intakeKey(doc.intake)}`===key){if(doc.dataType!=='real'||university?.country!=='Singapore')throw new WriterError(400,'Only real Singapore admission dates can be edited');return {file,text,doc,catalogue,revision:revisionOf(text),relativeFile:path.relative(root,file).split(path.sep).join('/')};}
    }
    throw new WriterError(404,'Programme/intake record was not found');
  }
  async function save(input,username){
    if(!input||typeof input!=='object'||Array.isArray(input)||Object.keys(input).some(key=>!['key','routeId','stageType','deadline','wording','note','expectedRevision'].includes(key)))throw new WriterError(400,'Only date-edit fields are accepted');
    if(typeof input.note!=='string'||!input.note.trim()||input.note.length>1600||typeof input.wording!=='string'||!input.wording.trim()||input.wording.length>1600)throw new WriterError(400,'A description and manual-entry note are required');
    const current=await record(input.key);if(input.expectedRevision!==current.revision)throw new WriterError(409,'This YAML file changed. Reload it before saving.');
    const routeIndex=current.doc.routes.findIndex(route=>route.id===input.routeId);const stageIndex=current.doc.routes[routeIndex]?.stages.findIndex(stage=>stage.type===input.stageType);
    if(routeIndex<0||stageIndex===undefined||stageIndex<0)throw new WriterError(400,'Choose an existing applicant category and stage');
    const before=structuredClone(current.doc.routes[routeIndex].stages[stageIndex]);
    const after={type:before.type,status:'manual-unverified',deadline:input.deadline,wording:input.wording.trim(),sourceIds:[],manualEntry:{enteredAt:new Date().toISOString(),enteredBy:username,note:input.note.trim()}};
    const document=parseDocument(current.text,{uniqueKeys:true,strict:true});if(document.errors.length)throw new WriterError(400,'Source YAML is invalid');document.setIn(['routes',routeIndex,'stages',stageIndex],after);const next=document.toString();
    let catalogue;try{catalogue=await readCatalogue({rootDir:root,overrides:new Map([[current.file,next]])});}catch(error){throw new WriterError(400,`Date change failed validation: ${error.message}`);}
    if(revisionOf(await readFile(current.file,'utf8'))!==current.revision)throw new WriterError(409,'This YAML file changed. Reload it before saving.');
    const json=JSON.stringify(catalogue,null,2)+'\n';const log=path.join(root,'.local-writer/audit.jsonl');const audit=JSON.stringify({at:after.manualEntry.enteredAt,writer:username,file:current.relativeFile,routeId:input.routeId,before,after});
    await atomicBatch([[current.file,next],[path.join(root,'data/generated/catalogue.json'),json],[path.join(root,'dist/data/generated/catalogue.json'),json],[log,(await optionalRead(log)||'')+audit+'\n']]);
    return {ok:true,relativeFile:current.relativeFile,revision:revisionOf(next),catalogue};
  }
  return {async getRecord(key){const item=await record(key);return {doc:item.doc,revision:item.revision,relativeFile:item.relativeFile};},save(input,username){const run=queue.then(()=>save(input,username));queue=run.catch(()=>{});return run;}};
}
