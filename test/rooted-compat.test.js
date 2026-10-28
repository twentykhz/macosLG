'use strict';
const test=require('node:test'),assert=require('node:assert/strict');const {summarize}=require('../lib/rooted-compat');const {provision}=require('../lib/provision');
test('rooted UK6340 capability selection does not depend on SK8000 model name',()=>{
 const r=summarize({modelName:'55UK6340PTF',boardType:'LM18A_DVB_EU',nodeFiles:true,nodeVersion:'v0.12.2',pythonMajor:2,eventSize:16,homeChannels:true,homeProbe:true,startup:true,voiceAgent:true,youtubeVersion:'0.5.3'});
 assert(r.launcher&&r.nodeServices&&r.controls&&!r.homeRelay&&!r.voice);
});
test('missing or incompatible input channels preserve native HOME but keep portable services',()=>{
 const r=summarize({nodeFiles:true,nodeVersion:'v16.0.0',pythonMajor:2,eventSize:24,startup:true,homeChannels:false});assert(r.launcher&&r.nodeServices&&r.controls);assert.equal(r.homeRelay,false);assert.equal(r.voice,false);
});
test('no Python or Node still permits core launcher while skipping dependent services',()=>{
 const r=summarize({startup:true});assert(r.launcher);assert(!r.nodeServices&&!r.controls&&!r.homeRelay&&!r.voice);
});
test('old Node 0.10 is not treated as a supported web-service runtime',()=>{
 assert.equal(summarize({nodeVersion:'v0.10.48',startup:true}).nodeServices,false);
});
test('compatibility mode on already-rooted TV never replays exploit, removes Developer Mode or reboots',async()=>{
 const calls=[];const steps={options:{compatibilityMode:true},isRooted:()=>true};for(const name of ['prepare','connectAndCheck','plan','restoreInterface','runAutoroot','removeDeveloperMode','rebootAndReconnect','installApps'])steps[name]=async()=>{calls.push(name);};
 assert.deepEqual(await provision(steps),{complete:true,compatibilityMode:true});assert.deepEqual(calls,['prepare','connectAndCheck','restoreInterface']);
});
test('read-only compatible mode stops before interface changes',async()=>{
 const calls=[];const steps={options:{compatibilityMode:true},isRooted:()=>true};for(const name of ['prepare','connectAndCheck','plan','restoreInterface'])steps[name]=async()=>calls.push(name);await provision(steps,{dryRun:true});assert.deepEqual(calls,['prepare','connectAndCheck','plan']);
});
