import https from 'node:https';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {officialAddress,sameInstitution} from './country-collection-model.mjs';
export function publicAddress(address){if(isIP(address)===4){const [a,b]=address.split('.').map(Number);return ![0,10,127,169,224,240,255].includes(a)&&a<224&&!(a===172&&b>=16&&b<=31)&&!(a===192&&b===168)&&!(a===100&&b>=64&&b<=127);}if(isIP(address)===6)return /^2[0-9a-f]{3}:/iu.test(address);return false;}
export async function readOfficialHtml(value,{seed=value,redirects=0}={}){
  const url=officialAddress(value);if(!sameInstitution(url.href,seed)||redirects>3)throw Error('Official-site redirect left the approved institution');
  const addresses=await lookup(url.hostname,{all:true});if(!addresses.length||addresses.some(item=>!publicAddress(item.address)))throw Error('Official hostname did not resolve to a public address');const address=addresses.find(item=>item.family===4)||addresses[0];
  const result=await new Promise((resolve,reject)=>{
    const request=https.get(url,{headers:{'User-Agent':'AdmissionsAtlas/1.0 (bounded official university page collection)','Accept':'text/html'},lookup:(host,options,callback)=>options.all?callback(null,[address]):callback(null,address.address,address.family)},response=>{
      if(response.statusCode>=300&&response.statusCode<400&&response.headers.location){response.resume();resolve({redirect:new URL(response.headers.location,url).href});return;}
      if(response.statusCode!==200||!/^text\/html(?:;|$)/iu.test(response.headers['content-type']||'')){response.resume();reject(Error(`Official page returned HTTP ${response.statusCode} or unsupported content`));return;}
      const chunks=[];let size=0;response.on('data',chunk=>{size+=chunk.length;if(size>1500000){response.destroy(Error('Official page exceeds collection size limit'));return;}chunks.push(chunk);});response.on('end',()=>resolve({html:Buffer.concat(chunks).toString('utf8'),url:url.href}));response.on('error',reject);
    });request.setTimeout(8000,()=>request.destroy(Error('Official page timed out')));request.on('error',reject);
  });return result.redirect?readOfficialHtml(result.redirect,{seed,redirects:redirects+1}):result;
}
