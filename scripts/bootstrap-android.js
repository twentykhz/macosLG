'use strict';
// Inlined into the published shell bootstrap, together with the archive reader.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const pin=__RELEASE_PIN__;
const archive=(()=>{const module={exports:{}};__ARCHIVE_READER__;return module.exports;})();
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function launcher(base,target){
 const quote=s=>"'"+s.replace(/'/g,"'\"'\"'")+"'";
 const file=path.join(base,'GathinTV-AutoSetup.sh'),temp=file+'.new-'+crypto.randomUUID();
 fs.writeFileSync(temp,'#!/usr/bin/env bash\nset -Eeuo pipefail\nexec bash '+quote(path.join(target,'GathinTV-AutoSetup.sh'))+' "$@"\n',{mode:0o700});fs.renameSync(temp,file);
}
function verify(directory){
 const file=path.join(directory,'runtime-manifest.json');if(hash(fs.readFileSync(file))!==pin.manifestSha256)throw Error('Runtime manifest checksum mismatch');
 const manifest=JSON.parse(fs.readFileSync(file));if(manifest.version!==pin.version)throw Error('Runtime version mismatch');
 const expected=new Set(['runtime-manifest.json',...manifest.files.map(e=>archive.safeName(e.path))]);
 function walk(folder,prefix=''){for(const item of fs.readdirSync(folder,{withFileTypes:true})){const name=prefix+item.name;if(item.isSymbolicLink())throw Error('Symlink in cached runtime');if(item.isDirectory())walk(path.join(folder,item.name),name+'/');else if(!item.isFile()||!expected.has(name))throw Error('Unexpected cached runtime file: '+name);}}
 walk(directory);
 for(const entry of manifest.files){const name=archive.safeName(entry.path);let p=directory;for(const part of name.split('/')){p=path.join(p,part);if(fs.lstatSync(p).isSymbolicLink())throw Error('Symlink in installed runtime');}if(hash(fs.readFileSync(p))!==entry.sha256)throw Error('Runtime file checksum mismatch: '+name);}
}
async function main(){
 const base=path.join(os.homedir(),'.gathintv'),releases=path.join(base,'releases'),target=path.join(releases,pin.version+'-'+pin.sha256.slice(0,12));
 for(const folder of [base,releases]){fs.mkdirSync(folder,{recursive:true,mode:0o700});if(fs.lstatSync(folder).isSymbolicLink())throw Error('Unsafe installation directory');fs.chmodSync(folder,0o700);}
 if(fs.existsSync(target)){
  if(fs.lstatSync(target).isSymbolicLink())throw Error('Unsafe release directory');
  let valid=false;try{verify(target);valid=true;}catch{console.error('Cached release failed verification; downloading a clean copy.');}
  if(valid){launcher(base,target);process.stdout.write(target);return;}
 }
 console.error('Downloading pinned GathinTV '+pin.version+' (SHA-256 verified before extraction).');
 const response=await fetch(pin.url,{signal:AbortSignal.timeout(600000)});if(!response.ok)throw Error('Release download HTTP '+response.status);
 const chunks=[];let length=0;for await(const chunk of response.body){length+=chunk.length;if(length>pin.size)throw Error('Download exceeds pinned size');chunks.push(chunk);}const bytes=Buffer.concat(chunks);
 if(length!==pin.size||hash(bytes)!==pin.sha256)throw Error('Release checksum mismatch; nothing executed');
 const incoming=fs.mkdtempSync(path.join(releases,'.incoming-'));let promoted=false;
 try{
  archive.extractTarGzip(bytes,incoming);verify(incoming);
  if(fs.existsSync(target))fs.renameSync(target,target+'.invalid-'+crypto.randomUUID());
  fs.renameSync(incoming,target);promoted=true;launcher(base,target);process.stdout.write(target);
 }finally{if(!promoted)fs.rmSync(incoming,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
