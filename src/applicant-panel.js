import {element,sourceLink} from './components.js';
import {declaredCategory,publishedCategories} from './applicant.js';

export function textField({id,label,value='',placeholder=''}){
  const field=element('label','context-field',label);field.htmlFor=id;
  const input=document.createElement('input');input.id=id;input.name=id;input.type='text';input.value=value;input.placeholder=placeholder;input.maxLength=160;
  field.append(input);return field;
}
export function selectField({id,label,options,value='',disabled=false}){
  const field=element('label','context-field',label);field.htmlFor=id;
  const select=document.createElement('select');select.id=id;select.name=id;select.disabled=disabled;
  options.forEach(([value,label])=>{const option=element('option','',label);option.value=value;select.append(option);});select.value=value;
  field.append(select);return field;
}
export function applicantPanel({profile,remember,program,entry,onApply,onClear,open=false}){
  const panel=element('details','applicant-panel');panel.open=open;
  panel.append(element('summary','','Applicant context and display timezone (optional)'));
  const form=element('form');form.setAttribute('aria-label','Applicant context');
  form.append(element('p','muted','These details stay in this browser and are not included in discovery requests. Citizenship, residence and study destination are separate. Apply changes before switching programs.'));
  const fields=element('div','context-fields');
  fields.append(textField({id:'app-citizenships',label:'Citizenship(s)',value:profile.citizenships.join(', '),placeholder:'e.g. India, Germany'}),textField({id:'app-residence',label:'Country of residence',value:profile.residence,placeholder:'Optional'}),textField({id:'app-timezone',label:'Display timezone (IANA)',value:profile.timezone,placeholder:'e.g. Asia/Kolkata'}));
  const categories=publishedCategories(entry);const selected=declaredCategory(profile,program,entry)||'';
  if(program){
    fields.append(selectField({id:'app-residency',label:`Residency status in ${program.country}`,value:profile.residency[program.country]||'',options:[['','Not provided'],['none-declared','No permanent residency declared'],['permanent-resident','Permanent resident'],['other','Other status / unsure']]}));
    fields.append(selectField({id:'app-category',label:'Your declared category for this program',value:selected,disabled:!categories.length,options:[['','Unconfirmed / show all categories'],...categories.map(value=>[value,value])]}));
  }
  form.append(fields);
  form.append(element('p','muted',program?`${program.institution} · ${program.title}. Category choices come from this program's collected records. Definitions vary by institution; no automatic classification is made.`:'Select a discovered program to declare its published applicant category.'));
  if(program)form.append(sourceLink('Review official program and category rules ↗',program.sourceUrl));
  if(program&&!categories.length)form.append(element('p','muted','The collected records do not specify an applicant category. Applicability remains unresolved.'));
  const confirmation=element('label','context-check');const confirm=document.createElement('input');confirm.type='checkbox';confirm.name='confirm-category';confirm.checked=Boolean(selected);confirm.disabled=!categories.length;confirmation.append(confirm,document.createTextNode(' I checked the official rules and confirm my declared category for this program.'));form.append(confirmation);
  fields.querySelectorAll('input:not(#app-timezone),select').forEach(input=>input.addEventListener('input',()=>{confirm.checked=false;}));
  const saving=element('label','context-check');const save=document.createElement('input');save.type='checkbox';save.name='remember-context';save.checked=remember;saving.append(save,document.createTextNode(' Remember applicant context in this browser'));form.append(saving);
  const actions=element('div','context-actions');const apply=element('button','primary-button','Apply applicant context');apply.type='submit';const clear=element('button','add-button','Clear applicant context');clear.type='button';clear.addEventListener('click',onClear);actions.append(apply,clear);form.append(actions);
  const message=element('p','muted');message.setAttribute('role','status');form.append(message);
  form.addEventListener('submit',event=>{
    event.preventDefault();const data=new FormData(form);
    try{const result=onApply({citizenships:data.get('app-citizenships'),residence:data.get('app-residence'),timezone:data.get('app-timezone'),residency:data.get('app-residency')||'',category:data.get('app-category')||'',confirmCategory:data.has('confirm-category')},data.has('remember-context'));message.textContent=result;}catch(error){message.textContent=error.message;}
  });
  panel.append(form);return panel;
}
