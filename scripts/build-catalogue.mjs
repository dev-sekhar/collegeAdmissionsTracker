import {parseDocument} from 'yaml';
import {readFile,readdir,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compileCatalogue,validateQsSnapshot} from '../src/catalogue-model.js';
const root=fileURLToPath(new URL('../',import.meta.url));
export function parseYaml(source,name='YAML'){
  if(Buffer.byteLength(source)>200000)throw Error(`${name}: file exceeds 200 KB`);
  const doc=parseDocument(source,{uniqueKeys:true,strict:true});
  if(doc.errors.length)throw Error(`${name}: ${doc.errors[0].message}`);
  return doc.toJS({maxAliasCount:0});
}
async function documents(folder,overrides=new Map()){
  const output=[];
  for(const entry of (await readdir(folder,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){const file=path.join(folder,entry.name);if(entry.isSymbolicLink())throw Error('Catalogue symlinks are not supported');if(entry.isDirectory())output.push(...await documents(file,overrides));else if(/\.ya?ml$/u.test(entry.name))output.push(parseYaml(overrides.has(file)?overrides.get(file):await readFile(file,'utf8'),path.relative(root,file)));}
  return output;
}
export async function readCatalogue({rootDir=root,overrides=new Map()}={}){const catalogue=compileCatalogue(await documents(path.join(rootDir,'data/universities'),overrides),await documents(path.join(rootDir,'data/admissions'),overrides),await documents(path.join(rootDir,'data/applicant-rules'),overrides),await documents(path.join(rootDir,'data/admission-details'),overrides));catalogue.qsRankings=validateQsSnapshot(parseYaml(await readFile(path.join(rootDir,'data/rankings/qs-world-2027.yaml'),'utf8')));return catalogue;}
export async function buildCatalogue({check=false,rootDir=root}={}){
  const catalogue=await readCatalogue({rootDir});
  const json=JSON.stringify(catalogue,null,2)+'\n';const destination=path.join(rootDir,'data/generated/catalogue.json');
  if(check){if(await readFile(destination,'utf8')!==json)throw Error('Generated JSON is out of date. Run npm run build:data.');}
  else{await mkdir(path.dirname(destination),{recursive:true});await writeFile(destination+'.tmp',json);await rename(destination+'.tmp',destination);}
  return catalogue;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const data=await buildCatalogue({check:process.argv.includes('--check')});console.log(`Validated ${data.universities.length} institutions/providers, ${data.programs.length} programs and ${data.admissions.length} admission cycles.`);}catch(error){console.error(error.message);process.exitCode=1;}
}
