import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {buildCatalogue} from './build-catalogue.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
await buildCatalogue();
for(const file of ['index.html','styles.css','src/static-app.js','src/static-components.js','src/catalogue-browser.js','src/browse-components.js','src/catalogue-model.js','src/applicant-routes.js','src/writer-ui.js','data/generated/catalogue.json']){
  const destination=path.join(root,'dist',file);await mkdir(path.dirname(destination),{recursive:true});await copyFile(path.join(root,file),destination);
}
console.log('Static dashboard built in dist/. Curated real data and fictional examples are labelled separately.');
