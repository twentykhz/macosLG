'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{root,state,quote}=require('./local');
async function prepare(client){
 const challenge=crypto.randomBytes(32).toString('hex'),dir=fs.mkdtempSync(path.join(state,'app-runtime-'));
 try{const file=path.join(dir,'runtime-request.js');fs.writeFileSync(file,'window.MAC_RUNTIME_CHALLENGE='+JSON.stringify(challenge)+';\n',{mode:0o600});await require('./ssh').upload(client,file,'/media/developer/apps/usr/palm/applications/com.gathin.tvhome/runtime-request.js','644');return challenge;}finally{fs.rmSync(dir,{recursive:true,force:true});}
}
function probe(challenge){return `var fs=require('fs'),http=require('http'),token=fs.readFileSync('/var/lib/webosbrew/gathin-controls/bridge.token','utf8').trim(),body=JSON.stringify({action:'app_runtime_status',challenge:${JSON.stringify(challenge)}}),r=http.request({hostname:'127.0.0.1',port:18764,path:'/',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body),'X-Gathin-Token':token}},function(s){var b='';s.on('data',function(x){b+=x;});s.on('end',function(){if(s.statusCode!==200){console.log(JSON.stringify({returnValue:false,httpStatus:s.statusCode}));return;}console.log(b);});});r.setTimeout(2500,function(){r.abort();});r.on('error',function(){process.exitCode=1;});r.end(body);`;}
async function verify(client,challenge){
 const caps=await require('./tv-capabilities').probe(client);let last;
 for(let i=0;i<15;i++){
  let result;try{result=JSON.parse(await require('./ssh').exec(client,quote(caps.node)+' -e '+quote(probe(challenge)),{timeout:5000}));}catch(e){throw Error('WAM verification transport returned no valid evidence; setup is incomplete: '+e.message);}last=result;
  if(result.returnValue===true){const e=result.evidence;if(!e||e.challenge!==challenge||!e.tokenReadable||e.backendProtocol!==2||!e.stagePresent||!e.configReadable||e.errorCount!==0)throw Error('WAM runtime verification failed: unreadable configuration, invalid authenticated response or JavaScript exception');return {feature:'app-runtime',status:'verified',scope:'wam-authenticated-read',testedAt:e.testedAt,detail:'The launcher itself loaded config/token and completed authenticated backend health; no JavaScript exceptions observed during the check.'};}
  if(!result.pending)throw Error('WAM runtime backend rejected verification (HTTP '+(result.httpStatus||'unknown')+')');
  if(i<14)await new Promise(r=>setTimeout(r,1000));
 }
 throw Error('WAM did not complete authenticated startup verification; app opening alone is not setup success');
}
module.exports={prepare,verify,probe};
