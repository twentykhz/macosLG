'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,quote,profile}=require('./local');
const ssh=require('./ssh');
async function install(client,options,apps,packageRemote){
 if(!apps.some(a=>a.id===profile.appId&&a.version===profile.appVersion)){
  const stage='/tmp/gathin-app-upgrade-'+Date.now();
  (client.__macTvAppStages||(client.__macTvAppStages=[])).push(stage);
  await ssh.upload(client,path.join(root,'scripts/preserve-app.py'),stage+'/preserve.py');
  await ssh.exec(client,'python '+quote(stage+'/preserve.py')+' '+quote(stage)+' save');
  await ssh.installPackage(client,packageRemote);
  await ssh.exec(client,'python '+quote(stage+'/preserve.py')+' '+quote(stage)+' restore');
  return;
 }
 const packed=require('./app-archive').packApp(path.join(root,'payload/app'));
 const folder=fs.mkdtempSync(path.join(state,'app-upgrade-')),stage='/tmp/gathin-app-upgrade-'+Date.now();
 (client.__macTvAppStages||(client.__macTvAppStages=[])).push(stage);
 try{
  fs.writeFileSync(path.join(folder,'app.tar.gz'),packed.bytes);fs.writeFileSync(path.join(folder,'manifest.json'),JSON.stringify(packed.files));
  await ssh.upload(client,path.join(folder,'app.tar.gz'),stage+'/app.tar.gz');await ssh.upload(client,path.join(folder,'manifest.json'),stage+'/manifest.json');await ssh.upload(client,path.join(root,'scripts/promote-app.py'),stage+'/promote.py');
  console.log(await ssh.exec(client,'python '+quote(stage+'/promote.py')+' '+quote(stage),{timeout:90000}));
 }finally{fs.rmSync(folder,{recursive:true,force:true});}
}
async function finish(client){
 const script="import os,shutil; p='/media/developer/temp/gathin-app-upgrade-previous'; assert os.path.realpath(p)==p; shutil.rmtree(p) if os.path.isdir(p) else None";
 await ssh.exec(client,'python -c '+quote(script));
 for(const stage of client.__macTvAppStages||[]){
  if(!/^\/tmp\/gathin-app-upgrade-\d+$/.test(stage))throw Error('Unexpected app staging path');
  await ssh.exec(client,'python -c '+quote('import os,shutil; p='+JSON.stringify(stage)+'; assert os.path.realpath(p)==p; shutil.rmtree(p) if os.path.isdir(p) else None'));
 }
 client.__macTvAppStages=[];
}
async function pause(client){await ssh.exec(client,'python -',{input:fs.readFileSync(path.join(root,'scripts/pause-runtimes.py')),timeout:20000});}
module.exports={install,finish,pause};
