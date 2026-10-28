'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');const calls=[],staged=new Map();let allowWrites=false,installed=false;
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={
 async connect(){calls.push('connect');return {end(){}};},
 async exec(c,command,options={}){calls.push(command);if(command.includes('GATHIN_CAPABILITIES_V1'))return require('./helpers/tv-profiles').transcript();if(options.input){assert(allowWrites);const m=command.match(/cat > '([^']+)'/);if(m)staged.set(m[1],options.input);else assert.equal(command,'python -');}if(command.startsWith('sha256sum ')){const p=command.match(/'([^']+)'/)[1];return crypto.createHash('sha256').update(staged.get(p)).digest('hex')+' '+p;}if(command.includes('--probe'))throw Error('Simulated missing compositor input channel');if(command==='id -u')return '0';if(command.includes('luna-send-pub'))return JSON.stringify({returnValue:true,modelName:'55UK6340PTF',boardType:'LM18A_DVB_EU',firmwareVersion:'test',sdkVersion:'4.0.0'});if(command==='node --version')return 'v0.12.2';if(command.includes('sys.version_info'))return '[2,16]';if(command==='cat /proc/bus/input/devices')return 'N: Name="LGE M-RCU - Builtin [0]"\nN: Name="LGE M-RCU - Builtin [1]"';if(command.includes('echo YES'))return 'YES';return '';},
 async luna(c,method){calls.push(method);if(method.endsWith('getSystemInfo'))return {returnValue:true,modelName:'55UK6340PTF',boardType:'LM18A_DVB_EU',firmwareVersion:'test',sdkVersion:'4.0.0'};if(method.endsWith('listApps'))return {apps:[{id:'org.webosbrew.hbchannel'},{id:'youtube.leanback.v4',version:'0.5.3'},{id:'ooo.lew.lifesgoodwithoutspying'},...(installed?[{id:'com.gathin.tvhome',version:'1.4.0'}]:[])]};if(allowWrites)return {returnValue:true};throw Error('Unexpected Luna method');},
 async upload(){assert(allowWrites,'Dry run must not upload');calls.push('upload');},async archive(){assert(allowWrites,'Dry run must not archive');calls.push('archive');},async installPackage(){assert(allowWrites,'Dry run must not install');installed=true;calls.push('installPackage');}
};
require('../lib/recovery');require.cache[require.resolve('../lib/recovery')].exports={async capture(){assert(allowWrites);calls.push('initialSnapshot');},markMutation(){assert(calls.includes('initialSnapshot'));}};
require('../lib/portable-tv');require.cache[require.resolve('../lib/portable-tv')].exports={async run(){assert(allowWrites);return JSON.stringify({complete:true});}};
require('../lib/runtime-health');require.cache[require.resolve('../lib/runtime-health')].exports={async verify(){assert(allowWrites);}};
const {AutorootSteps}=require('../lib/autoroot'),{restore}=require('../scripts/tv');
test('already-rooted UK6340 passes real connectAndCheck path without an SK8000 model assertion',async()=>{
 const steps=new AutorootSteps({host:'192.0.2.27',alreadyRooted:true});await steps.connectAndCheck();assert.equal(steps.options.compatibilityMode,true);assert.equal(steps.info.modelName,'55UK6340PTF');steps.close();
});
test('cross-model restore dry run reports capabilities without writes, installation or exploit',async()=>{
 calls.length=0;const r=await restore({}, {host:'192.0.2.27',dryRun:true});assert.equal(r.device.modelName,'55UK6340PTF');assert(r.features.launcher&&r.features.nodeServices);assert(!calls.some(x=>!x.includes('GATHIN_CAPABILITIES_V1')&&/touch |chmod |rm |kill |autoroot\.sh/.test(x)));
});
test('cross-model installation deploys core/web/control features while a failed HOME probe keeps native input',async()=>{
 calls.length=0;allowWrites=true;
 try{const r=await restore({}, {host:'192.0.2.27'});assert(r.features.launcher&&r.features.nodeServices&&r.features.controls);assert.equal(r.features.homeRelay,false);assert(calls.includes('installPackage'));assert(calls.some(x=>x.includes('/45-gathin-remote')));assert(!calls.some(x=>/35-gathin-debloat|36-gathin-trim|50-lifesgoodwithoutspying|autoroot\.sh|\bumount\b/.test(x)));assert(!calls.some(x=>x.includes('rm -f /home/root/DISABLE-GATHIN-HOME')));}finally{allowWrites=false;}
});
