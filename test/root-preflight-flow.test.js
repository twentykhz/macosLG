'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
let reportStatus='rootable',model='55UK6340PTF',checks=0,uid='1000';
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={async exec(c,cmd){if(cmd.includes('GATHIN_CAPABILITIES_V1'))return require('./helpers/tv-profiles').transcript({root:uid==='0'});if(cmd==='id -u')return uid;if(cmd.includes('getSystemInfo'))return JSON.stringify({modelName:model,firmwareVersion:'05.50.70',sdkVersion:'4.4.0',boardType:'LM18A_DVB_EU'});throw Error('Unexpected operation '+cmd);}};
require('../lib/rootability');const actual=require('../lib/rootability');require.cache[require.resolve('../lib/rootability')].exports={...actual,async check(){checks++;return {status:reportStatus};},print(){}};
const {AutorootSteps}=require('../lib/autoroot');
function steps(options={}){const s=new AutorootSteps({host:'192.0.2.80',expectedModel:'55UK6340PTF',expectedFirmware:'05.50.70',...options});s.connectDeveloper=async()=>{s.devClient={end(){}};s.client=s.devClient;};return s;}
test('unrooted cross-model device requires a fresh rootability result before any exploit',async()=>{
 checks=0;const s=steps();await s.connectAndCheck();assert.equal(checks,1);assert.equal(s.options.compatibilityMode,true);assert.equal(s.rootability.status,'rootable');s.close();
});
test('manual preflight identity must match the authenticated device',async()=>{
 checks=0;const s=steps({expectedModel:'55SK8000PTA'});await assert.rejects(s.connectAndCheck(),/differs from the preflight model/);assert.equal(checks,0);s.close();
});
test('patched or unknown result stops before rooting',async()=>{
 for(const status of ['not-rootable','unknown']){reportStatus=status;const s=steps();await assert.rejects(s.connectAndCheck(),/stopped before any exploit/);s.close();}reportStatus='rootable';
});

test('missing Developer Mode can enter guided alternatives only after confirmed preflight',async()=>{
 const s=steps();s.connectDeveloper=async()=>{throw Error('Key Server unavailable');};let calls=0;s.runAutoroot=async()=>{calls++;uid='0';s.rooted=true;s.client={end(){}};};
 try{await s.connectAndCheck();assert.equal(calls,1);assert.equal(s.rootAcquiredDuringConnect,true);assert.equal(s.options.compatibilityMode,true);}finally{uid='1000';s.close();}
});
test('dry run and changed host key never enter guided rooting',async()=>{
 for(const options of [{dryRun:true},{}]){const s=steps(options);s.connectDeveloper=async()=>{throw Error(options.dryRun?'Key Server unavailable':'Unknown/changed TV host key');};let attempted=false;s.runAutoroot=async()=>{attempted=true;};await assert.rejects(s.connectAndCheck());assert.equal(attempted,false);s.close();}
});
test('auto detection without manual model/firmware pins authenticated TV identity',async()=>{
 const previous=model;model='55QNED80SQA';checks=0;
 const s=steps({expectedModel:undefined,expectedFirmware:undefined});
 try{await s.connectAndCheck();assert.equal(checks,1);assert.equal(s.info.modelName,'55QNED80SQA');assert.equal(s.options.expectedModel,'55QNED80SQA');assert.equal(s.options.expectedFirmware,'05.50.70');}
 finally{model=previous;s.close();}
});
test('skipping manual lookup never bypasses authenticated patched/unknown root checks',async()=>{
 for(const status of ['unknown','not-rootable']){
  reportStatus=status;checks=0;const s=steps({expectedModel:undefined,expectedFirmware:undefined});
  try{await assert.rejects(s.connectAndCheck(),/stopped before any exploit/);assert.equal(checks,1);}finally{s.close();}
 }reportStatus='rootable';
});
test('automatic detection failure explains Developer Mode and never enters a fallback exploit',async()=>{
 const s=steps({expectedModel:undefined,expectedFirmware:undefined});let attempted=false;
 s.connectDeveloper=async()=>{throw Error('Key Server unavailable');};s.runAutoroot=async()=>{attempted=true;};
 try{await assert.rejects(s.connectAndCheck(),/Automatic TV detection needs authenticated Developer Mode/);assert.equal(attempted,false);}finally{s.close();}
});
