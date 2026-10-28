'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {AutorootSteps}=require('../lib/autoroot'),ssh=require('../lib/ssh'),{parse}=require('../lib/tv-capabilities'),{transcript}=require('./helpers/tv-profiles');
test('pending root survives a new setup run and is bound to TV and Developer SSH identity',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-root-pending-')),steps=new AutorootSteps({host:'192.0.2.90'});steps.folder=folder;steps.info={modelName:'55UM7400PTA',boardType:'K5LP_DVB_EU',firmwareVersion:'05.40.97'};steps.devClient={__macTvHostFingerprint:'fixture-pin',end(){}};
 try{steps.savePendingRoot();assert(steps.hasPendingRoot(steps.info));assert(!steps.hasPendingRoot({...steps.info,firmwareVersion:'00.00.00'}));steps.devClient.__macTvHostFingerprint='other-pin';assert(!steps.hasPendingRoot(steps.info));steps.devClient.__macTvHostFingerprint='fixture-pin';
  let verified=0;steps.settleReportedRoot=async()=>{verified++;};steps.runFaultmanager=async()=>{throw Error('must not rerun exploit');};steps.rootability={status:'unknown'};await steps.runAutoroot();assert.equal(verified,1);
 }finally{steps.close();fs.rmSync(folder,{recursive:true,force:true});}
});
test('faultmanager Payload complete is persisted as reported success, not inferred from port 22',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-fault-complete-')),steps=new AutorootSteps({host:'192.0.2.91'}),saved={exec:ssh.exec,upload:ssh.upload};steps.folder=folder;steps.info={modelName:'55UM7400PTA',boardType:'K5LP_DVB_EU',firmwareVersion:'05.40.97'};steps.devClient={__gathinCapabilities:Promise.resolve(parse(transcript())),end(){}};steps.assets={config:{autoroot:{name:'autoroot.sh'},homebrew:{name:'homebrew.ipk'}},files:{'autoroot.sh':'fixture','homebrew.ipk':'fixture'}};
 ssh.upload=async()=>{};ssh.exec=async(c,command,o)=>{if(command.startsWith('sh -c ')){o.onOutput('Rooting complete\nPayload complete\n');return 'Rooting complete\nPayload complete\n';}return '';};
 try{const result=await steps.runFaultmanager();assert(result.rootReported);assert(steps.hasPendingRoot(steps.info));assert.equal(JSON.parse(fs.readFileSync(path.join(folder,'root-pending.json'))).method,'faultmanager');}
 finally{ssh.exec=saved.exec;ssh.upload=saved.upload;steps.close();fs.rmSync(folder,{recursive:true,force:true});}
});
test('root SSH recovery must match the authenticated model/firmware even without manual identity arguments',async()=>{
 const steps=new AutorootSteps({host:'192.0.2.92'}),saved={exec:ssh.exec,connect:ssh.connect};let closed=0,wrong=true;
 steps.info={modelName:'55UM7400PTA',firmwareVersion:'05.40.97',boardType:'K5LP_DVB_EU'};
 ssh.connect=async()=>({end(){closed++;}});ssh.exec=async(c,command)=>command==='id -u'?'0':JSON.stringify({...steps.info,modelName:wrong?'55SK8000PTA':steps.info.modelName});
 try{await assert.rejects(steps.verifyRootSSH(),/modelName differs/);assert.equal(steps.rooted,false);assert.equal(closed,1);wrong=false;await steps.verifyRootSSH();assert(steps.rooted);}
 finally{steps.close();ssh.exec=saved.exec;ssh.connect=saved.connect;}
});
