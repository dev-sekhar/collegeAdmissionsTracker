(function(root){
'use strict';
function structureOf(p){if(['joint','double-degree','concentration'].includes(p.kind))return p.kind;if(p.majors.length===2)return p.minors.length?'double-minor':'double';if(p.majors.length===1)return p.minors.length>1?'multiple-minors':p.minors.length?'major-minor':'single';return 'other'}
function matchesSubjects(p,f){const subjects=new Set([...p.majors,...p.minors]);for(const value of [...subjects]){if(value.startsWith('Criminology')||value==='Criminal Behaviour')subjects.add('Criminology');if(value==='Psychological Science')subjects.add('Psychology');if(value==='Politics, Philosophy and Economics')subjects.add('Economics')}return !(f.subjects||[]).length||(f.subjectMode==='all'?f.subjects.every(x=>subjects.has(x)):f.subjects.some(x=>subjects.has(x)))}
function matchesPlan(p,f){return matchesSubjects(p,f)&& (f.majors||[]).every(s=>p.majors.includes(s))&&(f.minors||[]).every(s=>p.minors.includes(s))&&(!f.structure||structureOf(p)===f.structure)&&(!f.minorNumber||(f.minorNumber==='3'?p.minors.length>=3:p.minors.length===Number(f.minorNumber)))&&(!f.documentedOnly||p.evidence==='Documented route')}
function matchingPlans(r,f){return r.plans.filter(p=>matchesPlan(p,f))}
function filterRoutes(data,f){return data.filter(r=>{
 const text=[r.country,r.university,r.degree,r.structure,r.language,r.steps,r.dates,r.start,r.awardingCountry,r.provider,...r.majors,...r.minors].join(' ').toLowerCase();
 return (!(f.countries||[]).length||f.countries.includes(r.country))&&(!f.query||text.includes(f.query.toLowerCase()))&&(!f.country||r.country===f.country)&&(!f.subject||(f.subject==='both'?r.subjects.split(',').includes('Economics')&&r.subjects.split(',').includes('Criminology'):r.subjects.split(',').includes(f.subject)))&&(!f.status||r.status===f.status)&&(!f.delivery||(f.delivery==='international'?r.delivery!=='Domestic institution':r.delivery===f.delivery))&&(!f.awardingCountry||r.awardingCountry===f.awardingCountry)&&(!f.minorOnly||r.plans.some(p=>p.minors.length))&&(!f.savedOnly||(f.saved||[]).includes(r.id))&&(!f.english||r.language.startsWith('English'))&&matchingPlans(r,f).length>0;
})}
const api={structureOf,matchesPlan,matchingPlans,filterRoutes};if(typeof module!=='undefined')module.exports=api;else root.StudyMatch=api;
})(typeof window!=='undefined'?window:this);
