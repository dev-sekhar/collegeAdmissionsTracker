import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const allowed=new Set(['index.html','styles.css','src/static-app.js','src/static-components.js','src/catalogue-model.js','src/applicant-routes.js','data/generated/catalogue.json']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const port=Number(process.env.ADMISSIONS_PORT||4173);
http.createServer(async(request,response)=>{
  try{
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
    const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);const file=pathname==='/'?'index.html':pathname.slice(1);
    if(!allowed.has(file)){response.writeHead(404).end('Not found');return;}
    const body=await readFile(path.join(root,file));response.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store'}).end(body);
  }catch{response.writeHead(404).end('Not found');}
}).listen(port,'127.0.0.1',()=>console.log(`Preview: http://127.0.0.1:${port}/`));
