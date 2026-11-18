import {el,pill,selectField,textField,textAreaField} from './static-components.js';
import {catalogueRows,intakeLabel,stageTypes,optionalStageTypes} from './catalogue-model.js';
export async function mountWriter(catalogue,onCatalogueChanged){
  const host=document.querySelector('#writer-controls');if(!host)return;
  let session={role:'reader',configured:false};let message='';let busy=false;let record=null;let key='';let routeId='';let stageType='';let draft=null;let loadVersion=0;
  let rows=catalogueRows(catalogue).filter(row=>row.admission.dataType==='real'&&row.country==='Singapore');
  async function request(url,options={}){const response=await fetch(url,{credentials:'same-origin',...options});let value;try{value=await response.json();}catch{throw Error('The writer service is unavailable on this server. Reader access remains available.');}if(!response.ok){if(response.status===401)session={role:'reader',configured:true};throw Error(value.error||'Writer request failed');}return value;}
  const post=(url,value)=>request(url,{method:'POST',headers:{'Content-Type':'application/json','X-Writer-CSRF':session.csrf||''},body:JSON.stringify(value)});
  function setStage(value){stageType=value;const stage=record?.doc.routes.find(route=>route.id===routeId)?.stages.find(stage=>stage.type===stageType);draft=stage?{kind:stage.deadline?.kind||'unavailable',date:stage.deadline?.date||'',start:stage.deadline?.start||'',end:stage.deadline?.end||'',rule:stage.deadline?.rule||'',wording:stage.wording,note:''}:null;render();}
  async function load(value){const version=++loadVersion;key=value;record=null;routeId='';stageType='';draft=null;if(!key){render();return;}busy=true;message='Loading the YAML record…';render();try{const result=await request(`/writer/record?key=${encodeURIComponent(key)}`);if(version===loadVersion){record=result;message='';}}catch(error){if(version===loadVersion)message=error.message;}finally{if(version===loadVersion){busy=false;render();}}}
  function render(){
    const panel=el('section','filter-panel writer-panel');const heading=el('div','section-top');heading.append(el('h2','','Date maintenance'),pill(session.role==='writer'?`Writer · ${session.username}`:'Reader · no login required',session.role==='writer'?'soft':'neutral'));panel.append(heading);
    const feedback=el('p','filter-note',message);feedback.setAttribute('role','status');
    if(session.role!=='writer'){
      const details=el('details');details.append(el('summary','','Writer sign-in'));
      const form=el('form','writer-form');form.append(textField('Writer name','writer-name','writer',()=>{},{maxLength:60}),textField('Password','writer-password','',()=>{},{type:'password',maxLength:512}));
      const button=el('button','small-button',busy?'Signing in…':'Sign in as writer');button.type='submit';button.disabled=busy||!session.configured;form.append(button);
      if(!session.configured)details.append(el('p','route-note','Writer sign-in has not been configured on this server. An administrator must complete private writer setup. Reading does not require an account.'));
      form.addEventListener('submit',async event=>{event.preventDefault();busy=true;const username=form.querySelector('#writer-name').value;const password=form.querySelector('#writer-password').value;message='';render();try{session=await post('/writer/login',{username,password});message='Signed in. Select the exact programme, intake, category and stage to update its YAML date.';}catch(error){message=error.message;}finally{busy=false;render();}});
      details.append(form);panel.append(details,feedback);host.replaceChildren(panel);return;
    }
    const logout=el('button','text-button','Sign out');logout.type='button';logout.disabled=busy;logout.addEventListener('click',async()=>{busy=true;try{await post('/writer/logout',{});session={role:'reader',configured:true};record=null;draft=null;message='Signed out. You are now a reader.';}catch(error){message=error.message;}finally{busy=false;render();}});panel.append(logout);
    const form=el('form','writer-form');form.append(selectField('Programme and intake','writer-programme',[['','Choose programme / intake'],...rows.map(row=>[row.key,`${row.universityName} · ${row.programName} · ${intakeLabel(row.admission.intake)}`])],key,load));
    if(record){
      form.append(el('p','route-note',`Saves directly to ${record.relativeFile}. Existing requirements, sources, rankings and other stages are preserved.`));
      form.append(selectField('Published applicant category','writer-route',[['','Choose category'],...record.doc.routes.map(route=>[route.id,route.label])],routeId,value=>{routeId=value;setStage('');}));
      const route=record.doc.routes.find(route=>route.id===routeId);
      if(route)form.append(selectField('Admission stage','writer-stage',[['','Choose stage'],...route.stages.map(stage=>[stage.type,[...stageTypes,...optionalStageTypes].find(([type])=>type===stage.type)?.[1]||stage.type])],stageType,setStage));
      if(draft){
        form.append(selectField('Deadline format','writer-kind',[['date','Calendar date'],['window','Date window'],['relative','Relative / conditional rule'],['unavailable','No date available']],draft.kind,value=>{draft.kind=value;render();}));
        if(draft.kind==='date')form.append(textField('Date','writer-date',draft.date,value=>draft.date=value,{type:'date'}));
        if(draft.kind==='window')form.append(textField('Start date','writer-start',draft.start,value=>draft.start=value,{type:'date'}),textField('End date','writer-end',draft.end,value=>draft.end=value,{type:'date'}));
        if(draft.kind==='relative')form.append(textAreaField('Relative or conditional deadline','writer-rule',draft.rule,value=>draft.rule=value));
        form.append(textAreaField('Description and conditions','writer-wording',draft.wording,value=>draft.wording=value),textAreaField('Manual-entry note (required; include your source or reason)','writer-note',draft.note,value=>draft.note=value),el('p','route-note','Saving marks this stage Manual entry — unverified. It does not claim official verification. An audit history retains the previous value.'));
        const button=el('button','small-button',busy?'Saving…':'Save date to YAML');button.type='submit';button.disabled=busy;form.append(button);
      }
    }
    form.addEventListener('submit',async event=>{event.preventDefault();if(!draft||!record||busy)return;const deadline=draft.kind==='unavailable'?null:draft.kind==='date'?{kind:'date',date:draft.date}:draft.kind==='window'?{kind:'window',start:draft.start,end:draft.end}:{kind:'relative',rule:draft.rule};busy=true;message='Saving the YAML date…';render();try{
      const result=await post('/writer/save-date',{key,routeId,stageType,deadline,wording:draft.wording,note:draft.note,expectedRevision:record.revision});
      rows=catalogueRows(result.catalogue).filter(row=>row.admission.dataType==='real'&&row.country==='Singapore');onCatalogueChanged(result.catalogue);record=await request(`/writer/record?key=${encodeURIComponent(key)}`);message=`Saved to ${result.relativeFile}. The reader catalogue now shows this as a manual, unverified entry.`;draft.note='';
    }catch(error){message=error.message;}finally{busy=false;render();}});
    for(const control of form.querySelectorAll('input,select,textarea,button'))control.disabled=busy;
    panel.append(form,feedback);host.replaceChildren(panel);
  }
  render();try{session=await request('/writer/session');}catch(error){message=error.message;}render();
}
