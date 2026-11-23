import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
import {readFile,mkdir,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
const scrypt=promisify(scryptCallback);
export async function makeWriterCredentials(username,password){
  if(typeof username!=='string'||!/^[a-zA-Z0-9_.-]{1,60}$/u.test(username))throw Error('Use a writer name of 1–60 letters, digits, dots, underscores or hyphens.');
  if(typeof password!=='string'||!/^[a-zA-Z0-9]{6,512}$/u.test(password))throw Error('Use 6–512 characters, letters and digits only.');
  const salt=randomBytes(32).toString('hex');const hash=Buffer.from(await scrypt(password,salt,64)).toString('hex');
  return {version:1,username,salt,hash};
}
export async function readWriterCredentials(root){
  try{const value=JSON.parse(await readFile(path.join(root,'.local-writer/credentials.json'),'utf8'));if(value.version!==1||typeof value.username!=='string'||!/^[a-zA-Z0-9_.-]{1,60}$/u.test(value.username)||!(/^[a-f0-9]{64}$/u.test(value.salt))||!(/^[a-f0-9]{128}$/u.test(value.hash)))return null;return value;}catch{return null;}
}
export async function checkWriterPassword(credentials,username,password){
  if(!credentials||typeof password!=='string'||!/^[a-zA-Z0-9]{6,512}$/u.test(password))return false;
  const candidate=Buffer.from(await scrypt(password,credentials.salt,64));
  return timingSafeEqual(candidate,Buffer.from(credentials.hash,'hex'))&&username===credentials.username;
}
export async function configureWriter(root,username,password){
  const credentials=await makeWriterCredentials(username,password);const folder=path.join(root,'.local-writer');await mkdir(folder,{recursive:true});
  const temporary=path.join(folder,`credentials-${randomBytes(8).toString('hex')}.tmp`);await writeFile(temporary,JSON.stringify(credentials)+'\n',{mode:0o600,flag:'wx'});await rename(temporary,path.join(folder,'credentials.json'));
}
