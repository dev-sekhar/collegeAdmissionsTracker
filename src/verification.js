const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
export const freshnessDays=7;
export const normalize=value=>String(value||'').replace(/\s+/gu,' ').trim().toLowerCase();
export function programSourceScope(programUrl,sourceUrl,title,mainHeadings,sourceHeadings,linked) {
  if(!linked||!mainHeadings.some(heading=>normalize(heading)===normalize(title)))return false;
  const program=new URL(programUrl);const source=new URL(sourceUrl);
  const base=program.pathname.replace(/\/$/u,'');
  const inProgram=program.origin===source.origin&&(source.pathname.replace(/\/$/u,'')===base||source.pathname.startsWith(`${base}/`));
  return inProgram||sourceHeadings.some(heading=>normalize(heading).includes(normalize(title)));
}
export function recordKey(record) {
  return JSON.stringify([record.stage,record.value,record.context,record.applicantCategory,record.sourceUrl,record.evidence,record.kind,record.extraction].map(normalize));
}
export function publishedIntake(context) {
  const match=String(context||'').match(new RegExp(`\\b(${months.join('|')})\\s+(20\\d{2})\\b`,'iu'));
  return match?`${months.find(month=>normalize(month)===normalize(match[1]))} ${match[2]}`:null;
}
export function fullDate(value) {
  const text=String(value||'').trim();
  let year,month,day;
  let match=text.match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if(match)[,year,month,day]=match.map(Number);
  else {
    match=text.match(new RegExp(`^(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months.join('|')})\\s+(\\d{4})$`,'iu'));
    if(match){day=Number(match[1]);month=months.findIndex(m=>normalize(m)===normalize(match[2]))+1;year=Number(match[3]);}
    else {
      match=text.match(new RegExp(`^(${months.join('|')})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})$`,'iu'));
      if(match){month=months.findIndex(m=>normalize(m)===normalize(match[1]))+1;day=Number(match[2]);year=Number(match[3]);}
    }
  }
  if(!year||!month||!day)return null;
  const date=new Date(Date.UTC(year,month-1,day));
  if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)return null;
  return `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function subtype(record) {
  if(record.stage==='documents') {
    if(/transcript/iu.test(record.evidence))return 'transcript';
    if(/referee|recommendation/iu.test(record.evidence))return 'referee';
  }
  return record.stage;
}
export function publishedRound(record) {
  const direct=`${record.context} ${record.evidence}`.match(/\b(?:round\s+\d+|early round|regular round|final round)\b/iu)?.[0];
  if(direct)return direct;
  const [header,row]=String(record.evidence).split('\n');
  if(!row)return null;
  const index=header.split('|').findIndex(cell=>/^(?:admission\s+)?round$/iu.test(cell.trim()));
  const value=index>=0?row.split('|')[index]?.trim():null;
  return value?`Round ${value}`:null;
}
function conflictGroup(record) {
  const round=publishedRound(record)||'round unspecified';
  return [subtype(record),publishedIntake(record.context),normalize(record.applicantCategory),normalize(round)].join('|');
}
export function assessRecords(records,checks,intake,now=new Date()) {
  const groups=new Map();
  for(const record of records) {
    const proof=checks?.[recordKey(record)];
    const date=fullDate(record.value);
    if(!proof?.evidenceMatched||!proof?.scopeMatched||!date)continue;
    const key=conflictGroup(record);
    if(!groups.has(key))groups.set(key,new Set());
    groups.get(key).add(date);
  }
  return records.map(record=>{
    const proof=checks?.[recordKey(record)];
    let status,reason;
    const sourceIntake=publishedIntake(record.context);
    const date=fullDate(record.value);
    if(!proof){status='Not checked';reason='Run source verification for this exact collected record.';}
    else if(proof.error){status='Source unavailable';reason=proof.error;}
    else if(!proof.scopeMatched){status='Scope review needed';reason='The current program page or its link to this source could not establish program scope.';}
    else if(!proof.evidenceMatched){status='Source changed';reason='The exact stage, date, intake or applicant-category record was not reproduced on the current source.';}
    else if(!Number.isFinite(Date.parse(proof.checkedAt))||now-Date.parse(proof.checkedAt)>freshnessDays*86400000||Date.parse(proof.checkedAt)>+now+300000){status='Stale check';reason=`Recheck source evidence; verification expires after ${freshnessDays} days.`;}
    else if(/OCR|PDF/iu.test(record.extraction)){status='Document review needed';reason='PDF and OCR layout require visual review before publication verification.';}
    else if(!sourceIntake){status='Intake review needed';reason='The source does not identify an exact start month and year in this record.';}
    else if(!publishedIntake(intake)){status='Choose exact intake';reason=`This source names ${sourceIntake}. Select a published month rather than assuming a season matches it.`;}
    else if(normalize(sourceIntake)!==normalize(publishedIntake(intake))){status='Different intake';reason=`This record is for ${sourceIntake}, not ${intake}.`;}
    else if((groups.get(conflictGroup(record))?.size||0)>1){status='Conflicting dates';reason='Rechecked records disagree for the same stage, document type, intake, applicant category and round.';}
    else if(record.kind==='Unpublished'){status='Not yet announced';reason='The rechecked source explicitly says the date is unpublished.';}
    else if(!date){status='Date/rule review needed';reason='A complete, valid single date with an explicit year is required; windows, relative rules and yearless dates remain source text.';}
    else if(Number(date.slice(0,4))<Number(sourceIntake.slice(-4))-2||Number(date.slice(0,4))>Number(sourceIntake.slice(-4))+1){status='Cycle review needed';reason='The date year is outside the expected intake cycle; review rather than rolling it forward.';}
    else {status='Source verified';reason='The current official program source reproduces this record for the selected published intake. Your applicant category and cutoff time remain unconfirmed.';}
    return {...record,assessment:{status,reason,sourceIntake,round:publishedRound(record),isoDate:date,checkedAt:proof?.checkedAt||null,applicantApplicable:false}};
  });
}
