import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateRequest,countryName} from '../src/discovery.js';

export function createJobs(root,launch=spawn){
  let job=null;
  function snapshot(){return job?{...job,request:{...job.request},logs:[...job.logs]}:{status:'idle',logs:[]};}
  function start(input){
    if(job?.status==='running')throw Error('A collection run is already active.');
    const valid=validateRequest(input);
    // Copy only public search fields; applicant context and arbitrary paths never enter child commands.
    const request={countries:[...new Set(valid.countries.map(countryName))],subjects:[...new Set(valid.subjects.map(v=>v.trim()))],degree:valid.degree,intake:valid.intake.trim()};
    job={id:randomUUID(),status:'running',phase:'Starting',startedAt:new Date().toISOString(),request,logs:[]};
    const current=job;
    const log=value=>{current.logs.push(String(value).trim().slice(0,1200));current.logs=current.logs.slice(-35);};
    (async()=>{
      const file=path.join(root,'data','local-request.json');
      await mkdir(path.dirname(file),{recursive:true});await writeFile(file,JSON.stringify(request));
      for(const [phase,script,args] of [['Discovering programs','discover.mjs',[file]],['Collecting admission evidence','collect-deadlines.mjs',[file]],['Rechecking official sources','verify-deadlines.mjs',[]]]){
        current.phase=phase;log(phase);
        await new Promise((resolve,reject)=>{
          const child=launch(process.execPath,[path.join(root,'scripts',script),...args],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
          const timeout=setTimeout(()=>{child.kill();reject(Error(`${phase} exceeded the 12-minute limit. Previous local reports may still be available.`));},12*60*1000);
          child.stdout.on('data',value=>log(value));child.stderr.on('data',value=>log(value));
          child.on('error',error=>{clearTimeout(timeout);reject(error);});
          child.on('exit',code=>{clearTimeout(timeout);code===0?resolve():reject(Error(`${phase} failed (exit ${code}). See collection log.`));});
        });
      }
      current.status='completed';current.phase='Complete';
    })().catch(error=>{current.status='failed';current.phase='Stopped';log(error.message);}).finally(()=>{current.finishedAt=new Date().toISOString();});
    return snapshot();
  }
  return {start,snapshot};
}
