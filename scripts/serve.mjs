import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {createJobs} from './local-jobs.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const jobs=createJobs(root);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8' };
http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if(pathname==='/local-collection'){
      const origin='http://127.0.0.1:4173';
      if(request.headers.host!=='127.0.0.1:4173'||(request.headers.origin&&request.headers.origin!==origin)){
        response.writeHead(403).end('Same-origin local access only');return;
      }
      response.setHeader('Content-Type','application/json');response.setHeader('Cache-Control','no-store');
      if(request.method==='GET'){response.end(JSON.stringify(jobs.snapshot()));return;}
      if(request.method!=='POST'){response.writeHead(405).end();return;}
      if(request.headers.origin!==origin||request.headers['content-type']!=='application/json'){response.writeHead(403).end();return;}
      let body='';for await(const chunk of request){body+=chunk;if(Buffer.byteLength(body)>12000){response.writeHead(413).end();return;}}
      try{const job=jobs.start(JSON.parse(body));response.writeHead(202).end(JSON.stringify(job));}
      catch(error){response.writeHead(400).end(JSON.stringify({error:error.message}));}return;
    }
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
    const file = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(root, file);
    const allowed = ['index.html','styles.css','data/latest.json','data/deadlines.json','data/verification.json'].includes(relative.replaceAll('\\', '/')) || relative.replaceAll('\\', '/').startsWith('src/');
    if (!allowed || relative.startsWith('..') || path.isAbsolute(relative) || !mime[path.extname(file)]) {
      response.writeHead(404).end('Not found'); return;
    }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[path.extname(file)], 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(404).end('Not found'); }
}).listen(4173, '127.0.0.1', () => console.log('Local: http://127.0.0.1:4173'));
