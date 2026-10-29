'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),cp=require('child_process');
const voice=require('../payload/portable/voice'),privacy=require('../payload/portable/maintenance'),policy=require('../config/setup-policy.json');
test('portable voice routes accented Vietnamese and prevents search text becoming power commands',async()=>{
 assert.deepEqual(voice.parse('mở HDMI hai'),{action:'open',app:'com.webos.app.hdmi2'});
 assert.deepEqual(voice.parse('tìm kiếm nhạc Trịnh Công Sơn trên YouTube'),{action:'youtube',keyword:'nhạc Trịnh Công Sơn'});
 assert.equal(voice.parse('tìm cách tắt TV trên YouTube').action,'youtube');
 assert.equal(voice.parse('tắt TV').action,'power_off');assert.equal(voice.parse('mở youtube rồi tắt TV'),null);
 assert.equal(voice.parse('tăng âm lượng thêm mười').value,10);
 const calls=[];await voice.execute(voice.parse('mở HDMI hai'),async(api,data)=>{calls.push({api,data});return api.indexOf('getExternalInputList')>=0?{returnValue:true,devices:[{id:'HDMI_2'}]}:{returnValue:true};});assert.equal(calls[1].data.id,'com.webos.app.hdmi2');
 assert.equal(voice.inspect({transport:'TX',type:'return',sender:'com.webos.service.nlp',payload:{result:{ServiceType:'TV_CONTROL',ActionType:'setVolume'}}}).system,true);
});
test('privacy protects functional network endpoints and never disables sample voice/casting services',()=>{
 for(const domain of ['a.nextlgsdp.com','api.lgeapi.com','a.lgsmartplatform.com','a.ueiwsp.com','voice.lg.com','thinq.lg.com','quickset.ueiwsp.com'])assert(!privacy.allowedDomain(domain),domain);
 assert(privacy.allowedDomain('ads.example.com'));assert(!privacy.allowedDomain('$(reboot)'));
 for(const key of ['voice.stop','domains.thinq','domains.quickset','lan.block','dns.filter','purge.boot'])assert.equal(policy.privacy[key],'off');
 for(const id of policy.optionalApps)assert(!policy.protectedApps.includes(id));
 assert.equal(privacy.lockState({}),null);assert.equal(privacy.lockState({locked:false}),false);assert.equal(privacy.lockState({locked:true}),true);
});
test('native adapter assets are source-bound static ELFs for their declared architectures',()=>{
 const crypto=require('crypto'),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),m=require('../payload/portable/native/manifest.json');assert.equal(hash(fs.readFileSync('payload/portable/input-helper.c')),m.sourceSha256);
 for(const entry of m.files){const asset=require('../lib/native-runtime').asset({arch:entry.arch}),b=fs.readFileSync(asset.file);assert.equal(b.length,entry.size);assert.equal(hash(b),entry.sha256);const at=entry.bits===64?Number(b.readBigUInt64LE(32)):b.readUInt32LE(28),size=b.readUInt16LE(entry.bits===64?54:42),count=b.readUInt16LE(entry.bits===64?56:44);for(let i=0;i<count;i++)assert.notEqual(b.readUInt32LE(at+i*size),3);}
 assert.equal(require('../lib/native-runtime').asset({arch:'mips'}),null);
});
test('ARM64 HOME activates the verified native backend without deploying Python',async()=>{
 const ssh=require('../lib/ssh'),recovery=require('../lib/recovery'),saved={upload:ssh.upload,exec:ssh.exec,mark:recovery.markMutation},files=new Map(),commands=[],native='/var/lib/webosbrew/gathin-controls/input-helper';
 ssh.upload=async(c,f,target)=>files.set(target,fs.readFileSync(f));ssh.exec=async(c,command)=>{commands.push(command);return command.startsWith('i=0; while')?native:'';};recovery.markMutation=()=>({createdAt:'fixture'});
 try{const caps=require('../lib/tv-capabilities').parse(require('./helpers/tv-profiles').transcript({arch:'aarch64',python:false})),result=await require('../lib/home-relay').install({__gathinNativeInput:{path:native}},{},caps);assert.equal(result.status,'verified');assert(![...files.keys()].some(p=>p.endsWith('.py')));assert.match(files.get('/tmp/gathin-home-relay-setup/41-gathin-home-keyhook').toString(),/"\$SCRIPT" --home/);assert(commands.some(c=>c.includes(native)&&c.endsWith('--probe')));}finally{ssh.upload=saved.upload;ssh.exec=saved.exec;recovery.markMutation=saved.mark;}
});
test('startup and voice hooks install independently of model and preserve native firmware files',async()=>{
 const ssh=require('../lib/ssh'),recovery=require('../lib/recovery'),saved={upload:ssh.upload,exec:ssh.exec,mark:recovery.markMutation},files=new Map(),commands=[];
 ssh.upload=async(c,f,target)=>files.set(target,fs.readFileSync(f));ssh.exec=async(c,command)=>{commands.push(command);return '';};recovery.markMutation=()=>({createdAt:'fixture'});
 try{
  const report=await require('../lib/full-features').install({__gathinNativeInput:{path:'adapter'}},{},{node:'/usr/bin/node'},[{id:'youtube.leanback.v4',version:'0.5.3'}]);
  assert(report.some(r=>r.feature==='voice-router'));assert(files.has('/var/lib/webosbrew/init.d/40-gathin-home'));assert(files.has('/var/lib/webosbrew/init.d/42-gathin-youtube-voice'));
  const boot=files.get('/home/root/gathin-home-replacement/boot.sh').toString();assert.match(boot,/core-boot-done/);assert.match(boot,/\$i" -lt 45/);assert(!boot.includes('SK8000'));assert(!commands.some(c=>/Qt5|systemUi|killall/.test(c)));
  for(const [name,bytes]of files)if(name.endsWith('.sh')||name.includes('/init.d/')){const shell=require('./helpers/host-tools').requireBash();const r=cp.spawnSync(shell,['-n'],{input:bytes});assert.equal(r.status,0,name+': '+r.stderr);}
 }finally{ssh.upload=saved.upload;ssh.exec=saved.exec;recovery.markMutation=saved.mark;}
});
