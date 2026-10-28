'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {root,state,quote}=require('./local');const capabilities=require('./tv-capabilities');
async function helper(client){
 const caps=await capabilities.probe(client);if(!caps.nodeFiles)throw Error('Verified portable recovery requires a working Node filesystem runtime; no TV installation was changed');
 if(!client.__gathinPortable){client.__gathinPortable=(async()=>{
  fs.mkdirSync(state,{recursive:true,mode:0o700});
  const folder=fs.mkdtempSync(path.join(state,'portable-')),stage='/tmp/gathin-portable-'+crypto.randomUUID();
  const file=path.join(folder,'runtime.js');fs.writeFileSync(file,'var GATHIN_ROOTS='+JSON.stringify(require('../config/recovery-roots.json'))+';\n'+fs.readFileSync(path.join(root,'scripts/tv-files.js'),'utf8'),{mode:0o600});
  try{await require('./ssh').upload(client,file,stage+'/runtime.js','600');await require('./ssh').exec(client,quote(caps.node)+' -e '+quote('new Function(require("fs").readFileSync(process.argv[1],"utf8"));')+' '+quote(stage+'/runtime.js'));return stage;}finally{fs.rmSync(folder,{recursive:true,force:true});}
 })().catch(e=>{delete client.__gathinPortable;throw e;});}
 return client.__gathinPortable;
}
async function run(client,operation,data={},options={}){
 const caps=await capabilities.probe(client),stage=await helper(client),folder=fs.mkdtempSync(path.join(state,'portable-input-')),file=path.join(folder,'input.json'),remote=stage+'/input-'+crypto.randomUUID()+'.json';
 fs.writeFileSync(file,JSON.stringify(data),{mode:0o600});
 try{await require('./ssh').upload(client,file,remote,'600');const output=await require('./ssh').exec(client,quote(caps.node)+' '+quote(stage+'/runtime.js')+' '+quote(operation)+' '+quote(remote),{timeout:options.timeout||120000});const result=JSON.parse(output);if(operation==='describe'?!Array.isArray(result.present):result.complete!==true)throw Error('Portable TV operation did not confirm completion: '+operation);return output;}
 finally{fs.rmSync(folder,{recursive:true,force:true});}
}
module.exports={helper,run};
