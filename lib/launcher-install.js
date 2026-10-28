'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,quote,profile}=require('./local');
const ssh=require('./ssh');
async function legacyInstall(client,options,apps,packageRemote){
 if(!apps.some(a=>a.id===profile.appId&&a.version===profile.appVersion)){
  const stage='/tmp/gathin-app-upgrade-'+Date.now();
  (client.__macTvAppStages||(client.__macTvAppStages=[])).push(stage);
  await ssh.upload(client,path.join(root,'scripts/preserve-app.py'),stage+'/preserve.py');
  await ssh.exec(client,python(client)+' '+quote(stage+'/preserve.py')+' '+quote(stage)+' save');
  await ssh.installPackage(client,packageRemote);
  await ssh.exec(client,python(client)+' '+quote(stage+'/preserve.py')+' '+quote(stage)+' restore');
  return;
 }
 const packed=require('./app-archive').packApp(path.join(root,'payload/app'));
 const folder=fs.mkdtempSync(path.join(state,'app-upgrade-')),stage='/tmp/gathin-app-upgrade-'+Date.now();
 (client.__macTvAppStages||(client.__macTvAppStages=[])).push(stage);
 try{
  fs.writeFileSync(path.join(folder,'app.tar.gz'),packed.bytes);fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(packed.files));
  await ssh.upload(client,path.join(folder,'app.tar.gz'),stage+'/app.tar.gz');await ssh.upload(client,path.join(folder,'manifest.json'),stage+'/manifest.json');await ssh.upload(client,path.join(root,'scripts/promote-app.py'),stage+'/promote.py');
  console.log(await ssh.exec(client,python(client)+' '+quote(stage+'/promote.py')+' '+quote(stage),{timeout:90000}));
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
}
async function legacyFinish(client){
 const script="import os,shutil; p='/media/developer/temp/gathin-app-upgrade-previous'; assert os.path.realpath(p)==p; shutil.rmtree(p) if os.path.isdir(p) else None";
 await ssh.exec(client,python(client)+' -c '+quote(script));
 for(const stage of client.__macTvAppStages||[]){
  if(!/^\/tmp\/gathin-app-upgrade-\d+$/.test(stage))throw Error('Unexpected app staging path');
  await ssh.exec(client,python(client)+' -c '+quote('import os,shutil; p='+JSON.stringify(stage)+'; assert os.path.realpath(p)==p; shutil.rmtree(p) if os.path.isdir(p) else None'));
 }
 client.__macTvAppStages=[];
}
async function legacyPause(client){await ssh.exec(client,python(client)+' -',{input:fs.readFileSync(path.join(root,'scripts/pause-runtimes.py')),timeout:20000});}
function python(client){return quote(client.__gathinLegacyPython);}
async function install(client,options,apps,packageRemote){
 const caps=await require('./tv-capabilities').probe(client);client.__gathinLegacyPython=caps.python2;
 if(!caps.nodeFiles){if(!caps.python2)throw Error('No verified launcher installation/recovery runtime');return legacyInstall(client,options,apps,packageRemote);}
 const stage='/tmp/gathin-app-upgrade-'+Date.now(),portable=require('./portable-tv');(client.__macTvAppStages||(client.__macTvAppStages=[])).push(stage);
 if(!apps.some(a=>a.id===profile.appId&&a.version===profile.appVersion)){
  await portable.run(client,'preserve-save',{stage});await ssh.installPackage(client,packageRemote);await portable.run(client,'preserve-restore',{stage});return;
 }
 const packed=require('./app-archive').packApp(path.join(root,'payload/app')),folder=fs.mkdtempSync(path.join(state,'app-upgrade-'));
 try{fs.writeFileSync(path.join(folder,'app.tar.gz'),packed.bytes);fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(packed.files));await ssh.upload(client,path.join(folder,'app.tar.gz'),stage+'/app.tar.gz');await ssh.upload(client,path.join(folder,'manifest.json'),stage+'/manifest.json');await portable.run(client,'promote',{stage,tar:caps.tar});}finally{fs.rmSync(folder,{recursive:true,force:true});}
}
async function finish(client){const caps=await require('./tv-capabilities').probe(client);client.__gathinLegacyPython=caps.python2;if(!caps.nodeFiles){if(!caps.python2)throw Error('No cleanup runtime available');return legacyFinish(client);}const paths=['/media/developer/temp/gathin-app-upgrade-previous',...(client.__macTvAppStages||[])];await require('./portable-tv').run(client,'cleanup',{paths});client.__macTvAppStages=[];}
async function pause(client){const caps=await require('./tv-capabilities').probe(client);client.__gathinLegacyPython=caps.python2;if(caps.nodeFiles)return require('./portable-tv').run(client,'pause');if(caps.python2)return legacyPause(client);throw Error('No verified runtime-stop/rollback engine; no launcher files replaced');}
module.exports={install,finish,pause};
