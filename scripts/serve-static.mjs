import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {readWriterCredentials,checkWriterPassword} from './writer-auth.mjs';
import {createDateStore,WriterError} from './writer-store.mjs';
const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const allowed=new Set(['index.html','styles.css','src/static-app.js','src/static-components.js','src/catalogue-browser.js','src/browse-components.js','src/upcoming-deadlines.js','src/catalogue-model.js','src/applicant-routes.js','src/writer-ui.js','data/generated/catalogue.json']);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
const cookieName='admissions_writer';
async function body(request){
  if(request.headers['content-type']?.split(';')[0]!=='application/json')throw new WriterError(415,'JSON input required');
  if(Number(request.headers['content-length'])>16000)throw new WriterError(413,'Request is too large');
  let text='';for await(const chunk of request){text+=chunk;if(Buffer.byteLength(text)>16000)throw new WriterError(413,'Request is too large');}
  try{return JSON.parse(text);}catch{throw new WriterError(400,'Invalid JSON');}
}
export function createAdmissionsServer({rootDir=projectRoot,credentialsProvider=()=>readWriterCredentials(rootDir),clock=()=>Date.now(),sessionLifetime=30*60*1000}={}){
  const sessions=new Map();const attempts=new Map();const store=createDateStore(rootDir);
  return http.createServer(async(request,response)=>{
    response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');
    const json=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json; charset=utf-8'}).end(JSON.stringify(value));};
    try{
      const host=request.headers.host||'';if(!/^(127\.0\.0\.1|localhost):\d+$/u.test(host))throw new WriterError(421,'Use the local preview host');
      const url=new URL(request.url,`http://${host}`);const pathname=decodeURIComponent(url.pathname);
      if(pathname.startsWith('/writer/')){
        if(!['GET','POST'].includes(request.method))throw new WriterError(405,'Method not allowed');
        if(request.method==='POST'&&request.headers.origin!==`http://${host}`)throw new WriterError(403,'Same-origin requests required');
        const credentials=await credentialsProvider();
        for(const [id,session] of sessions)if(session.expires<=clock()||session.credentialHash!==credentials?.hash)sessions.delete(id);
        const token=(request.headers.cookie||'').split(';').map(part=>part.trim()).find(part=>part.startsWith(`${cookieName}=`))?.slice(cookieName.length+1);
        const session=sessions.get(token);
        if(pathname==='/writer/session'&&request.method==='GET'){json(200,{role:session?'writer':'reader',configured:!!credentials,username:session?.username||null,csrf:session?.csrf||null});return;}
        if(pathname==='/writer/login'&&request.method==='POST'){
          if(!credentials)throw new WriterError(503,'Writer login is not configured. Run npm run writer:setup privately in your terminal.');
          const address=request.socket.remoteAddress;const previous=attempts.get(address);const attempt=previous&&previous.reset>clock()?previous:{count:0,reset:clock()+15*60*1000};
          if(attempt.count>=5)throw new WriterError(429,'Too many login attempts. Try again in 15 minutes.');attempt.count++;attempts.set(address,attempt);
          const input=await body(request);if(!await checkWriterPassword(credentials,input?.username,input?.password))throw new WriterError(401,'Writer name or password is incorrect');
          attempts.delete(address);const id=randomBytes(32).toString('hex');const csrf=randomBytes(32).toString('hex');sessions.set(id,{username:credentials.username,csrf,expires:clock()+sessionLifetime,credentialHash:credentials.hash});if(sessions.size>64)sessions.delete(sessions.keys().next().value);
          response.setHeader('Set-Cookie',`${cookieName}=${id}; HttpOnly; SameSite=Strict; Path=/writer; Max-Age=${Math.floor(sessionLifetime/1000)}`);json(200,{role:'writer',username:credentials.username,csrf,configured:true});return;
        }
        if(!session)throw new WriterError(401,'Writer authentication required');
        if(request.method==='POST'&&request.headers['x-writer-csrf']!==session.csrf)throw new WriterError(403,'Writer request token is invalid');
        if(pathname==='/writer/logout'&&request.method==='POST'){sessions.delete(token);response.setHeader('Set-Cookie',`${cookieName}=; HttpOnly; SameSite=Strict; Path=/writer; Max-Age=0`);json(200,{role:'reader'});return;}
        if(pathname==='/writer/record'&&request.method==='GET'){json(200,await store.getRecord(url.searchParams.get('key')));return;}
        if(pathname==='/writer/save-date'&&request.method==='POST'){json(200,await store.save(await body(request),session.username));return;}
        throw new WriterError(404,'Writer action not found');
      }
      if(!['GET','HEAD'].includes(request.method))throw new WriterError(405,'Method not allowed');
      const file=pathname==='/'?'index.html':pathname.slice(1);if(!allowed.has(file))throw new WriterError(404,'Not found');
      const content=await readFile(path.join(rootDir,'dist',file));response.writeHead(200,{'Content-Type':mime[path.extname(file)]}).end(request.method==='HEAD'?undefined:content);
    }catch(error){if(!response.headersSent)json(error instanceof WriterError?error.status:error.code==='ENOENT'?404:500,{error:error instanceof WriterError?error.message:'The request could not be completed. No access to private files is provided.'});else response.end();}
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  createAdmissionsServer().listen(4180,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4180/ · Public reader access; authenticated YAML writer available after private setup.'));
}
