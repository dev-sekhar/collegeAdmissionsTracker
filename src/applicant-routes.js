// Deterministic matching only: this does not assess academic eligibility.
export const boardOptions=[['','Choose board / qualification'],['cbse','CBSE — Class XII'],['isc','ISC — Class XII (CISCE)'],['icse','ICSE — Class X (CISCE)'],['igcse','IGCSE — secondary qualification'],['ib','IB Diploma'],['a-level','Cambridge International A Levels'],['state-other','State board — any Indian state']];
export const finalQualificationOptions=boardOptions.filter(([key])=>!['icse','igcse'].includes(key));
export const emptyApplicant=()=>({board:'',finalQualification:'',stateBoard:'',citizenship:'',singaporePr:'',results:''});
export const applicantBoardKey=applicant=>applicant.board==='state-other'?`state:${(applicant.stateBoard||'').trim().toLowerCase().replace(/[^a-z0-9]+/gu,'-').replace(/^-|-$/gu,'')}`:applicant.board;
export function matchApplicantRoute(row,applicant){
  const unresolved=(reason,status='undetermined')=>({status,reason,route:null,rule:null,sources:[]});
  if(!row)return unresolved('Select a programme first.');
  if(row.country!=='Singapore'||row.degree!=='Bachelor’s'||row.admission.dataType!=='real')return unresolved('Matching in this round covers real Singapore undergraduate programmes only.');
  if(!applicant||!applicant.board||!applicant.citizenship||!applicant.singaporePr||!applicant.results)return unresolved('Complete school board, citizenship, Singapore PR status and Class XII results status.');
  if(['icse','igcse'].includes(applicant.board)){
    if(!applicant.finalQualification)return unresolved('ICSE/IGCSE identifies the earlier school qualification. Select the subsequent Class XII / pre-university qualification; no undergraduate route is inferred from Class X alone.');
    applicant={...applicant,board:applicant.finalQualification};
  }
  if(!['cbse','isc','ib','a-level','state-other'].includes(applicant.board)||!['yes','no'].includes(applicant.singaporePr)||!['pending','available'].includes(applicant.results))return unresolved('One or more applicant details are unsupported.');
  if(applicant.citizenship!=='India')return unresolved('Only Indian citizens are covered by the verified matching rules in this round. No route is inferred from your curriculum.');
  const boardKey=applicantBoardKey(applicant);
  if(applicant.board==='state-other'&&boardKey==='state:')return unresolved('Enter the state board name. State boards are supported only after individual source verification.');
  const policy=row.applicantPolicy;
  if(!policy||policy.cycle!==row.admission.cycle)return unresolved('Board-specific applicant matching has not been verified for this institution and intake. This does not mean you are ineligible.');
  const candidates=policy.rules.filter(rule=>rule.programIds.includes(row.programId)&&(rule.boards.includes(boardKey)||(boardKey.startsWith('state:')&&rule.boards.includes('indian-state-boards')))&&rule.citizenships.includes(applicant.citizenship)&&rule.singaporePr.includes(applicant.singaporePr)&&rule.results.includes(applicant.results));
  if(!candidates.length)return unresolved(applicant.board==='state-other'?`No individually verified rule for ${applicant.stateBoard.trim()} covers these applicant details. This is not a finding of ineligibility.`:'No verified rule covers this combination of board, citizenship, PR status and results status. Check the institution’s official guidance.');
  if(candidates.length!==1)return unresolved('Multiple rules match these details. The conflict needs review; no timeline has been selected.','ambiguous');
  const rule=candidates[0];const sources=policy.sources.filter(source=>rule.sourceIds.includes(source.id));
  if(rule.status!=='verified')return {...unresolved(rule.notes,'needs-review'),rule,sources};
  const route=row.admission.routes.find(route=>route.id===rule.routeId);
  if(!route)return unresolved('The matching rule references a route unavailable for this programme/intake.');
  const board=applicant.board==='state-other'?applicant.stateBoard.trim():applicant.board==='ib'?'IB Diploma':applicant.board==='a-level'?'Cambridge A Levels':applicant.board.toUpperCase();
  const evidence=sources.map(source=>({...source,id:`applicant-${source.id}`}));
  const matchedRoute={...route,stages:route.stages.map(stage=>stage.type==='documents'&&applicant.results==='available'?{...stage,status:'verified',deadline:{kind:'relative',rule:rule.instructions.available},wording:'Your final school/diploma results are already available. Submit them with the application; the future result-release rule is not substituted.',sourceIds:evidence.map(source=>source.id)}:stage)};
  return {status:'matched',route:matchedRoute,rule,sources:evidence,reason:`${board} qualification · Indian citizenship · Singapore PR: ${applicant.singaporePr==='yes'?'yes':'no'} · results ${applicant.results}. ${rule.notes}`,instruction:rule.instructions[applicant.results]};
}
