'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {provision}=require('../lib/provision');
const {parse}=require('../scripts/bootstrap');
const stages=['prepare','connectAndCheck','plan','runAutoroot','verifyRootBridge','provisionRootSSH','connectRoot','prepareRootReconnect','removeDeveloperMode','assertDeveloperModeAbsent','rebootAndReconnect','installApps','restoreInterface','verifyInstallation'];
function fake({rooted=false,fail}={}){
 const calls=[];const steps={isRooted:()=>rooted};
 for(const name of stages)steps[name]=async arg=>{calls.push([name,arg]);if(name===fail)throw new Error('failed '+name);};
 return {calls,steps};
}
test('Developer Mode onboarding reaches interface with removal before either reboot',async()=>{
 const {steps,calls}=fake();assert.deepEqual(await provision(steps),{complete:true});
 const names=calls.map(([name])=>name);
 assert(names.indexOf('verifyRootBridge')<names.indexOf('provisionRootSSH'));
 assert(names.indexOf('connectRoot')<names.indexOf('removeDeveloperMode'));
 assert(names.indexOf('prepareRootReconnect')<names.indexOf('removeDeveloperMode'));
 assert(names.indexOf('assertDeveloperModeAbsent')<names.indexOf('rebootAndReconnect'));
 assert.deepEqual(calls.filter(([name])=>name==='rebootAndReconnect').map(([,why])=>why),['root','interface']);
 assert(names.indexOf('installApps')<names.indexOf('restoreInterface'));
});
test('dry run only prepares, authenticates and reports a plan',async()=>{
 const {steps,calls}=fake();await provision(steps,{dryRun:true});
 assert.deepEqual(calls.map(([name])=>name),['prepare','connectAndCheck','plan']);
});
test('already rooted resume never runs exploit and still checks reconnect/removal',async()=>{
 const {steps,calls}=fake({rooted:true});await provision(steps);
 assert(!calls.some(([name])=>['runAutoroot','verifyRootBridge','provisionRootSSH','connectRoot'].includes(name)));
 assert(calls.some(([name])=>name==='prepareRootReconnect'));
 assert(calls.some(([name])=>name==='assertDeveloperModeAbsent'));
});

test('root obtained through a guided connection fallback is provisioned without rerunning the exploit',async()=>{
 const {steps,calls}=fake({rooted:true});steps.rootAcquiredDuringConnect=true;steps.options={compatibilityMode:true};
 const result=await provision(steps);assert(result.complete&&result.compatibilityMode);
 const names=calls.map(([name])=>name);assert(!names.includes('runAutoroot'));assert(names.includes('verifyRootBridge'));assert(names.includes('provisionRootSSH'));assert(names.indexOf('removeDeveloperMode')<names.indexOf('rebootAndReconnect'));assert(names.includes('restoreInterface'));assert(!names.includes('installApps'));
});
for(const failed of ['connectAndCheck','runAutoroot','verifyRootBridge','provisionRootSSH','connectRoot','prepareRootReconnect','removeDeveloperMode','assertDeveloperModeAbsent']){
 test(failed+' failure prevents reboot and interface installation',async()=>{
  const {steps,calls}=fake({fail:failed});await assert.rejects(provision(steps),new RegExp('failed '+failed));
  assert(!calls.some(([name])=>['rebootAndReconnect','installApps','restoreInterface'].includes(name)));
  assert.equal(calls.filter(([name])=>name==='runAutoroot').length,failed==='connectAndCheck'?0:1);
 });
}
test('reboot reconnect failure blocks remaining installation and never retries exploit',async()=>{
 const {steps,calls}=fake({fail:'rebootAndReconnect'});await assert.rejects(provision(steps),/failed rebootAndReconnect/);
 assert.equal(calls.filter(([name])=>name==='runAutoroot').length,1);
 assert(!calls.some(([name])=>name==='restoreInterface'));
});
test('bootstrap has no password argument, blind firmware override or version bypass',()=>{
 assert.throws(()=>parse(['--password','secret']),/Unknown option/);
 assert.throws(()=>parse(['--allow-firmware-mismatch']),/Unknown option/);
 assert.throws(()=>parse(['--skip-version-check']),/Unknown option/);
 assert.throws(()=>parse(['--host','192.168.1.11/other']),/IPv4/);
 const options=parse(['--host','192.168.1.11','--already-rooted','--dry-run']);
 assert(options.alreadyRooted&&options.dryRun);
});
