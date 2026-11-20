import {mountAdmissionsBrowser} from './catalogue-browser.js';
try{
  const response=await fetch('./data/generated/catalogue.json');if(!response.ok)throw Error('Catalogue unavailable');const catalogue=await response.json();
  if(catalogue.schemaVersion!==1||!['dummy','real','mixed'].includes(catalogue.mode))throw Error('Unsupported catalogue');
  const browser=mountAdmissionsBrowser(catalogue);document.querySelector('#loading').hidden=true;
  setInterval(()=>browser.refreshDeadlines(),60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)browser.refreshDeadlines();});
}catch(error){document.querySelector('#loading').textContent='The catalogue could not be loaded. Reload the page or restart the preview.';document.querySelector('#loading').setAttribute('role','alert');document.querySelector('#reset-filters').disabled=true;}
