'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const calls=[];let version='0.5.3',failApply=false;
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={
 async upload(c,f,d){calls.push(['upload',d]);},
 async exec(c,cmd){calls.push(['exec',cmd]);if(cmd.includes('GATHIN_CAPABILITIES_V1'))return require('./helpers/tv-profiles').transcript();if(failApply&&cmd.startsWith("'/usr/bin/python' ")&&cmd.includes('/install.py'))throw Error('stage verification failed');return '';},
 async luna(c,url){calls.push(['luna',url]);if(url.endsWith('getSystemInfo'))return require('../lib/local').profile;if(url.endsWith('getAppInfo'))return {appInfo:{version}};if(url.endsWith('listApps'))return {apps:[]};return {returnValue:true};}
};
const {entries,installAdvanced}=require('../lib/advanced');
test('current feature mapping includes voice, controls, boot notification and no device tokens',()=>{
 const list=entries();for(const part of ['/commands.py','/gathin-controls/bridge.py','/LGWS.qml','/43-gathin-voice-results'])assert(list.some(x=>x.remote.endsWith(part)));
 assert(!list.some(x=>/\.token$|control-token|authorized_keys|shadow|router\.log/.test(x.remote)));
});
test('wrong YouTube version aborts before advanced uploads or runtime changes',async()=>{
 calls.length=0;version='9.0.0';try{await assert.rejects(installAdvanced({}),/0.5.3/);assert(!calls.some(c=>c[0]==='upload'));assert(!calls.some(c=>c[0]==='exec'&&!c[1].includes('GATHIN_CAPABILITIES_V1')));}finally{version='0.5.3';}
});
test('failed staged validation never starts a boot runtime and cleans only its fixed staging folder',async()=>{
 calls.length=0;failApply=true;try{await assert.rejects(installAdvanced({}),/stage verification/);assert(!calls.some(c=>c[0]==='exec'&&c[1].startsWith("'/var/lib/webosbrew/init.d/")));assert(calls.some(c=>c[0]==='exec'&&c[1].includes('shutil.rmtree')&&c[1].includes('/tmp/gathin-advanced-setup')));}finally{failApply=false;}
});
test('advanced apply completes before services start; core runtimes precede notification worker',async()=>{
 calls.length=0;await installAdvanced({});const apply=calls.findIndex(c=>c[0]==='exec'&&c[1].startsWith("'/usr/bin/python' ")&&c[1].includes('/install.py'));
 const hooks=calls.map((c,i)=>({c,i})).filter(x=>x.c[0]==='exec'&&x.c[1].startsWith("'/var/lib/webosbrew/init.d/"));assert(hooks.every(x=>x.i>apply));assert(hooks[0].c[1].includes('35-gathin'));assert(hooks.at(-1).c[1].includes('50-lifesgoodwithoutspying'));
});
