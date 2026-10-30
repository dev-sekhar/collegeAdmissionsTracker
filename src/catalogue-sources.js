// Official public catalogue entry points, not precomputed program results.
// Every match must still pass a fresh detail-page subject and degree check.
export const catalogueSources = [
  {country:'Singapore',domain:'nus.edu.sg',institution:'National University of Singapore',url:'https://www.comp.nus.edu.sg/programmes/',programPath:'/programmes/ug/',degreeHint:'Bachelor’s'},
  {country:'Singapore',domain:'ntu.edu.sg',institution:'Nanyang Technological University',url:'https://www.ntu.edu.sg/computing/admissions/undergraduate-programmes',programPath:'/computing/admissions/undergraduate-programmes/detail/',degreeHint:'Bachelor’s'},
  {country:'Singapore',domain:'smu.edu.sg',institution:'Singapore Management University',url:'https://computing.smu.edu.sg/undergraduate',programPath:'/bsc-',degreeHint:'Bachelor’s'},
  {country:'Netherlands',domain:'utwente.nl',institution:'University of Twente',url:'https://www.utwente.nl/en/education/bachelor/programmes/',programPath:'/en/education/bachelor/programmes/',directChildren:true,degreeHint:'Bachelor’s'},
  {country:'United Kingdom',domain:'ucl.ac.uk',institution:'University College London',url:'https://www.ucl.ac.uk/study/prospective-students/undergraduate/courses',programPath:'/study/prospective-students/undergraduate/courses/',degreeHint:'Bachelor’s'},
  {country:'Germany',domain:'uni-saarland.de',institution:'Saarland University',url:'https://www.uni-saarland.de/en/study/programmes/bachelor.html',programPath:'/en/study/programmes/bachelor/',degreeHint:'Bachelor’s'},
  {country:'Canada',domain:'uwaterloo.ca',institution:'University of Waterloo',url:'https://uwaterloo.ca/future-students/programs',programPath:'/future-students/programs/',degreeHint:'Bachelor’s'},
  {country:'Australia',domain:'monash.edu',institution:'Monash University',url:'https://www.monash.edu/study/courses/find-a-course',programPath:'/study/courses/find-a-course/',degreeHint:'Bachelor’s'},
].map(source=>({...source,selector:'a[href]'}));
export const trustedDomains=[...new Set(['ubc.ca','nus.edu.sg','anu.edu.au','tum.de','utwente.nl',...catalogueSources.map(source=>source.domain)])];
export function sourceDomain(raw){try{const u=new URL(raw);return u.protocol==='https:'&&trustedDomains.find(domain=>u.hostname===domain||u.hostname.endsWith(`.${domain}`));}catch{return null;}}
