'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const cap=require('../lib/tv-capabilities'),{transcript}=require('./helpers/tv-profiles'),{summarize}=require('../lib/rooted-compat');
const caps=cap.parse(transcript()),um={modelName:'55UM7400PTA',boardType:'K5LP_DVB_EU',firmwareVersion:'05.40.97',sdkVersion:'4.10.0'};
test('UM7400 HOME uses runtime/input capabilities instead of an SK8000 model whitelist',()=>{
 assert(cap.homeRelayCandidate(caps));assert(!cap.legacyHome(caps,um));
 const features=summarize({...caps,info:um,homeProbe:true});assert(features.homeRelay&&features.homeRelayCandidate);assert(!features.voice&&!features.referenceTuning);
 for(const changed of [{python2:null},{root:false},{startup:false},{inputModules:false},{homeChannels:false},{eventSize:24},{arch:'aarch64'}])assert(!cap.homeRelayCandidate({...caps,...changed}));
});
async function install({probeFails=false,startFails=false,capabilities=caps,options={}}={}){
 const ssh=require('../lib/ssh'),recovery=require('../lib/recovery'),saved={upload:ssh.upload,exec:ssh.exec,mark:recovery.markMutation};const calls=[],client={};
 ssh.upload=async(c,file,remote)=>calls.push('upload '+remote);
 ssh.exec=async(c,command)=>{calls.push(command);if(command.includes('--probe')&&probeFails)throw Error('compositor is not listening to target');if(command.startsWith('i=0; while'))return startFails?'':'/usr/bin/python /home/root/gathin-home-keyhook.py';return '';};
 recovery.markMutation=()=>calls.push('snapshot-guard');
 try{return {result:await require('../lib/home-relay').install(client,options,capabilities),calls,client};}
 finally{ssh.upload=saved.upload;ssh.exec=saved.exec;recovery.markMutation=saved.mark;}
}
test('compatible HOME installs only after snapshot and input probe, then verifies readiness PID',async()=>{
 const {result,calls,client}=await install();assert.equal(result.status,'verified');assert(client.__gathinHomeRelay.active);
 const probe=calls.findIndex(x=>x.includes('--probe')),promote=calls.findIndex(x=>x.includes('&& cp '));assert(calls.indexOf('snapshot-guard')<probe&&probe<promote);
 assert(calls.some(x=>x.includes('/tmp/gathin-home-keyhook.ready')));assert(!calls.some(x=>/umount|Main.qml|35-gathin|36-gathin/.test(x)));
});
test('a failed compositor probe never installs or activates the HOME hook',async()=>{
 const {result,calls}=await install({probeFails:true});assert.equal(result.status,'needs-attention');assert(!calls.some(x=>x.includes('&& cp ')));assert(!calls.some(x=>x.includes('rm -f \'/home/root/DISABLE-GATHIN-HOME\'')));
});
test('HOME startup failure enables the failsafe and does not claim an active relay',async()=>{
 const {result,calls,client}=await install({startFails:true});assert.equal(result.status,'needs-attention');assert.equal(client.__gathinHomeRelay.active,false);assert(calls.some(x=>x.startsWith("touch '/home/root/DISABLE-GATHIN-HOME'")));
});
test('unsupported input ABI and dry run never upload, grab input or change markers',async()=>{
 const unsupported=await install({capabilities:{...caps,arch:'aarch64'}});assert.equal(unsupported.result.status,'unsupported');assert.deepEqual(unsupported.calls,[]);
 const dry=await install({options:{dryRun:true}});assert.equal(dry.result.status,'manual-check-required');assert.deepEqual(dry.calls,[]);
});
