'use strict';
const fs=require('fs'),path=require('path');
const {root,quote,sha256}=require('./local');
const DEST='/var/lib/webosbrew/gathin-controls/input-helper';
function asset(caps){
 const arch=/^armv7/.test(caps.arch)?'armv7l':caps.arch==='aarch64'?'aarch64':null;
 const dir=path.join(root,'payload/portable/native'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))),entry=manifest.files.find(e=>e.arch===arch);
 if(!entry)return null;const file=path.join(dir,entry.file),bytes=fs.readFileSync(file);
 if(sha256(bytes)!==entry.sha256||bytes.readUInt16LE(18)!==entry.elfMachine||bytes[4]!==entry.bits/32)throw Error('Bundled native adapter hash/ABI mismatch');return {...entry,file};
}
async function install(client,options={},caps){
 if(client.__gathinNativeInput)return client.__gathinNativeInput;
 caps=caps||await require('./tv-capabilities').probe(client);const entry=asset(caps);
 if(!entry)throw Error('No verified static input/PTY adapter for architecture '+caps.arch+'; this is a missing dependency, not a model restriction.');
 if(options.dryRun)return {...entry,path:DEST,planned:true};
 const ssh=require('./ssh');require('./recovery').markMutation(options,'private static input/PTY dependency');
 const stage='/tmp/gathin-input-'+require('crypto').randomBytes(8).toString('hex');
 try{
  await ssh.upload(client,entry.file,stage,'755');const abi=JSON.parse(await ssh.exec(client,quote(stage)+' --abi'));
  if(abi.protocol!==1||abi.eventSize!==entry.eventSize||abi.pointerBits!==entry.bits)throw Error('TV rejected bundled adapter ABI; system interpreters were not changed');
  await ssh.exec(client,'mkdir -p '+quote(path.posix.dirname(DEST))+' && cp '+quote(stage)+' '+quote(DEST+'.new')+' && chmod 755 '+quote(DEST+'.new')+' && mv '+quote(DEST+'.new')+' '+quote(DEST));
  client.__gathinNativeInput={path:DEST,arch:entry.arch,eventSize:abi.eventSize};return client.__gathinNativeInput;
 }finally{await ssh.exec(client,'rm -f '+quote(stage)).catch(()=>{});}
}
module.exports={asset,install,DEST};
