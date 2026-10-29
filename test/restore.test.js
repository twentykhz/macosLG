'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {state,profile}=require('../lib/local');
const calls=[];let failBackup=false,failHookUpload=false;
// Use a fake TV to verify command ordering and failure handling without mutation.
require('../lib/ssh');
require.cache[require.resolve('../lib/ssh')].exports={
  async exec(client,command){
    calls.push(['exec',command]);
    if(command.includes('GATHIN_CAPABILITIES_V1'))return require('./helpers/tv-profiles').transcript();
    if(command==='id -u')return '0\n';
    if(command.includes('sys.version_info'))return '2\n16\n';
    if(command==='cat /proc/bus/input/devices')return `N: Name="${profile.sourceDeviceName}"\nN: Name="${profile.targetDeviceName}"\n`;
    if(command.includes('os.path.lexists'))return '["/home/root/gathin-home-keyhook.py"]';
    if(command.startsWith('i=0; while'))return '/usr/bin/python /home/root/gathin-home-keyhook.py';
    if(command.includes('&& echo yes || echo no'))return 'no\n';
    return '';
  },
  async luna(client,url){
    calls.push(['luna',url]);
    if(url.endsWith('getSystemInfo'))return {...profile,returnValue:true};
    if(url.endsWith('listApps'))return {returnValue:true,apps:[{id:'org.webosbrew.hbchannel'},{id:profile.appId,version:profile.appVersion}]};
    if(url.endsWith('closeByAppId')||url.endsWith('/launch'))return {returnValue:true};
    throw new Error('Unexpected Luna call '+url);
  },
  async archive(){calls.push(['archive']);if(failBackup)throw new Error('Backup transfer failed');return {sha256:'fake-test-archive'};},
  async upload(client,file,remote){calls.push(['upload',remote]);if(failHookUpload&&remote==='/tmp/gathin-home-relay-setup/home-keyhook.py')throw new Error('Hook upload interrupted');},
  async installPackage(){calls.push(['install']);},
};
require('../lib/recovery');require.cache[require.resolve('../lib/recovery')].exports={async capture(){calls.push(['archive']);if(failBackup)throw Error('Backup transfer failed');},markMutation(){calls.push(['journal']);}};
require('../lib/launcher-install');require.cache[require.resolve('../lib/launcher-install')].exports={async install(){calls.push(['install']);},async finish(){},async pause(){calls.push(['pause']);}};
for(const name of ['dependencies','full-features','maintenance','runtime-health','post-install']){require('../lib/'+name);require.cache[require.resolve('../lib/'+name)].exports={async inspect(){return {};},async prepare(){return {};},async install(){return name==='full-features'?[]:{feature:'debloat-privacy',status:'verified'};},async verify(){},async ensureApps(){return {apps:[],report:[]};},async checkFeatures(){}};}
require('../lib/app-runtime');require.cache[require.resolve('../lib/app-runtime')].exports={async prepare(){return 'browser-fixture';},async verify(){return {feature:'app-runtime',status:'verified'};}};
const {restore}=require('../scripts/tv');
test('dry run only reads the TV, creates no backup and does not upload/install',async()=>{
  calls.length=0;
  await restore({}, {dryRun:true});
  assert(!calls.some(([kind])=>['archive','upload','install'].includes(kind)));
  assert(!calls.some(([kind,command])=>kind==='exec'&&!command.includes('GATHIN_CAPABILITIES_V1')&&/touch |mkdir |chmod |rm |mv |cp |kill /.test(command)));
});
test('backup failure aborts before app upload, hook stop or installation',async()=>{
  calls.length=0;failBackup=true;
  try{
    await assert.rejects(restore({},{}),/Backup transfer failed/);
    assert(calls.some(([kind])=>kind==='archive'));
    assert(!calls.some(([kind])=>['upload','install'].includes(kind)));
    assert(!calls.some(([kind,command])=>kind==='exec'&&/touch |kill /.test(command)));
  }finally{failBackup=false;}
});
test('restore backs up before install, then deploys one permanent hook and starts it',async()=>{
  calls.length=0;
  await restore({},{});
  const backupIndex=calls.findIndex(([kind])=>kind==='archive');
  const installIndex=calls.findIndex(([kind])=>kind==='install');
  const pauseIndex=calls.findIndex(([kind])=>kind==='pause');
  assert(backupIndex>=0&&backupIndex<pauseIndex&&pauseIndex<installIndex);
  assert.equal(calls.filter(([kind,remote])=>kind==='upload'&&remote==='/tmp/gathin-home-relay-setup/home-keyhook.py').length,1);
  assert(calls.some(([kind,command])=>kind==='exec'&&command.includes("&& '/var/lib/webosbrew/init.d/41-gathin-home-keyhook'")));
  assert(!calls.some(([kind,command])=>kind==='exec'&&/\breboot\b/.test(command)));
});
test('interrupted hook deployment leaves interception disabled and does not start it',async()=>{
  calls.length=0;failHookUpload=true;
  try{
    const result=await restore({},{});assert.equal(result.home.status,'needs-attention');assert.match(result.home.detail,/Hook upload interrupted/);
    assert(calls.some(([kind])=>kind==='pause'));
    assert(!calls.some(([kind,command])=>kind==='exec'&&command==='/var/lib/webosbrew/init.d/41-gathin-home-keyhook'));
  }finally{failHookUpload=false;}
});
