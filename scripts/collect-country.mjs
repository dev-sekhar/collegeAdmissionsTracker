import {readFile,mkdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {stringify} from 'yaml';
import {readCatalogue,parseYaml} from './build-catalogue.mjs';
import {atomicBatch,withCatalogueWrite,WriterError} from './writer-store.mjs';
import {readOfficialHtml} from './official-html.mjs';
import {countrySlug,officialAddress,sameInstitution,extractUniversityPage,validateCountryCollection} from './country-collection-model.mjs';
export function createCountryCollector(root,{fetchPage=readOfficialHtml,clock=()=>new Date()}={}){
  const running=new Set();
  return {async collect(country,username){
    if(typeof country!=='string'||country.length>80)throw new WriterError(400,'Choose a configured country');
    const configuration=parseYaml(await readFile(path.join(root,'data/official-university-sites.yaml'),'utf8'));const catalogue=await readCatalogue({rootDir:root});
    const targets=configuration.sites.filter(seed=>seed.country===country).map(seed=>({...seed}));
    if(!targets.length)throw new WriterError(400,'Official university sources are not configured for this country');
    const norm=name=>name.toLowerCase().replace(/\([^)]*\)/gu,'').replace(/[^a-z0-9]/gu,'');
    for(const university of catalogue.universities.filter(item=>item.country===country)){
      if(targets.some(seed=>norm(seed.name).startsWith(norm(university.name))||norm(university.name).startsWith(norm(seed.name))))continue;
      const program=catalogue.programs.find(item=>item.universityId===university.id&&item.url);if(program)targets.push({name:university.name,country,city:university.city,url:program.url});
    }
    for(const seed of targets)officialAddress(seed.url);
    if(targets.length>45)throw new WriterError(400,'Country source scope exceeds this collector limit');
    if(running.has(country)||running.size>=2)throw new WriterError(409,'A collection is already running; wait for it to finish');running.add(country);
    try{
      const successful=[];const failures=[];const pending=[...targets];const started=clock();
      async function worker(){while(pending.length){const seed=pending.shift();try{const page=await fetchPage(seed.url);if(!sameInstitution(page.url,seed.url))throw Error('Official site redirected outside the configured institution');successful.push(extractUniversityPage(page.html,page.url,seed,clock()));}catch(error){failures.push({name:seed.name,url:seed.url,checkedAt:clock().toISOString(),reason:String(error.message).slice(0,300)});}if(pending.length)await new Promise(resolve=>setTimeout(resolve,350));}}
      await Promise.all([worker(),worker(),worker()]);
      return await withCatalogueWrite(root,async()=>{
        const latest=await readCatalogue({rootDir:root});const previous=latest.countryCollections.find(item=>item.country===country);const merged=new Map((previous?.universities||[]).map(item=>[item.id,item]));for(const item of successful)merged.set(item.id,item);
        const collection=validateCountryCollection({country,attemptedAt:clock().toISOString(),startedAt:started.toISOString(),collectedBy:username,scope:'Configured official university sites; university identity and admission links only. Not a complete country directory.',attempted:targets.length,freshCount:successful.length,universities:[...merged.values()].sort((a,b)=>a.name.localeCompare(b.name)),failures:failures.sort((a,b)=>a.name.localeCompare(b.name))});
        const folder=path.join(root,'data/country-universities');await mkdir(folder,{recursive:true});const resolved=await realpath(folder);if(path.relative(await realpath(root),resolved).split(path.sep).includes('..'))throw new WriterError(400,'Collection folder is outside the workspace');
        const file=path.join(folder,`${countrySlug(country)}.yaml`);latest.countryCollections=[...latest.countryCollections.filter(item=>item.country!==country),collection].sort((a,b)=>a.country.localeCompare(b.country));const json=JSON.stringify(latest,null,2)+'\n';
        const yaml=stringify(collection,{lineWidth:100,aliasDuplicateObjects:false});if(Buffer.byteLength(yaml)>200000)throw new WriterError(413,'Collected country data exceeds the YAML size limit; narrow its source scope before saving');
        await atomicBatch([[file,yaml],[path.join(root,'data/generated/catalogue.json'),json],[path.join(root,'dist/data/generated/catalogue.json'),json]]);
        return {ok:true,relativeFile:`data/country-universities/${countrySlug(country)}.yaml`,collection};
      });
    }finally{running.delete(country);}
  }};
}
