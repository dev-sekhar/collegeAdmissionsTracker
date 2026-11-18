import {fileURLToPath} from 'node:url';
import readline from 'node:readline';
import {configureWriter} from './writer-auth.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
function secret(prompt){return new Promise((resolve,reject)=>{
  const input=process.stdin;let value='';process.stdout.write(prompt);readline.emitKeypressEvents(input);input.setRawMode(true);input.resume();
  function finish(){input.off('keypress',pressed);input.setRawMode(false);input.pause();process.stdout.write('\n');}
  function pressed(character,key){if(key?.ctrl&&key.name==='c'){finish();reject(Error('Writer setup cancelled.'));}else if(key?.name==='return'){finish();resolve(value);}else if(key?.name==='backspace'){value=Array.from(value).slice(0,-1).join('');}else if(character&&!key?.ctrl&&!key?.meta){value+=character;}}
  input.on('keypress',pressed);
});}
try{
  if(!process.stdin.isTTY)throw Error('Run writer:setup in your own interactive terminal. Passwords are never accepted as command-line arguments.');
  const username=process.argv[2]||'writer';const password=await secret(`New password for ${username} (minimum 12 characters; input hidden): `);const confirmation=await secret('Repeat password (input hidden): ');
  if(password!==confirmation)throw Error('Passwords did not match. Nothing saved.');
  await configureWriter(root,username,password);console.log(`Writer ${username} configured. Only a salted password hash is stored in the ignored .local-writer folder. Previous sessions are revoked on their next request. Do not share your password in chat.`);
}catch(error){console.error(error.message);process.exitCode=1;}
