import {publishedIntake} from './verification.js';
export function intakeEvidence(blocks,source,programUrl){
  // A generic university calendar cannot by itself establish a program's intake.
  if(source.sourceUrl.replace(/\/$/u,'')!==programUrl.replace(/\/$/u,''))return [];
  return blocks.flatMap(block=>{
    const text=(block.text||'').replace(/\s+/gu,' ').trim();
    if(!/\b(start date|starts? in|commences?|intake|entry in)\b/iu.test(text)||/application|deadline|closing|scholarship|funding|accommodation|financial aid/iu.test(text))return [];
    const intake=publishedIntake(text);
    return intake?[{intake,text,sourceUrl:source.sourceUrl,checkedAt:source.checkedAt}]:[];
  });
}
export function intakeGroup(entry,target){
  const evidence=entry?.intakes||[];
  if(evidence.some(item=>item.intake===target))return 'Published intake evidence';
  if(evidence.length)return 'Alternative published intake';
  return 'Intake awaiting confirmation';
}
export function emptyStage(entry,stage){
  if(!entry)return 'Not checked: no collection report for this program.';
  if(entry.candidates.some(record=>record.stage===stage))return 'No collected record for this selected intake; other-intake evidence is retained below.';
  if(entry.failures.length)return 'Source unavailable or incomplete: some pages could not be checked; no date captured for this stage.';
  return 'Date not found in the bounded sources checked. This does not establish that no deadline exists.';
}
export function retainedEvidence(previous,catalogue,selectedIds){
  return (previous.programs||[]).filter(entry=>!selectedIds.has(entry.programId)&&catalogue.programs.some(program=>program.id===entry.programId&&program.sourceUrl===entry.programUrl));
}
