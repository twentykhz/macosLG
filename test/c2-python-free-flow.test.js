'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {sandbox,words}=require('./helpers/tv-sandbox'),{transcript,info}=require('./helpers/tv-profiles');
const state=fs.mkdtempSync(path.join(os.tmpdir(),'gathin-c2-session-'));process.env.GATHIN_STATE_DIRECTORY=state;process.env.GATHIN_RECOVERY_SESSION=path.join(state,'session.json');
const tv=sandbox(),calls=[];let version='1.3.0',probes=0,failLaunch=false;
const initialApps=[{id:'org.webosbrew.hbchannel'},{id:'youtube.leanback.v4',version:'0.5.3'},{id:'com.gathin.tvhome',version}];
function client(){return {__macTvHostFingerprint:'SHA256:c2-fixture',end(){}};}
async function execute(c,command,options={}){
 calls.push(command);
 if(command.includes('GATHIN_CAPABILITIES_V1')){probes++;return transcript({arch:'aarch64',python:false,stat:false});}
 if(/(?:^|\s|')python(?:[23])?(?:\s|')/.test(command))throw Error('Remote command failed (127): sh: python: not found');
 if(command==='id -u')return '0';if(command.includes('luna-send-pub')&&command.includes('getSystemInfo'))return JSON.stringify(info);
 if(command.includes('authorized_keys'))return '';
 const args=words(command);
 if(args[0]==='/usr/bin/node'||args[0]==='node'){
  if(args[1]==='-e')return tv.nodeEval(args[2],args.slice(3));
  return tv.operation(args[1],args[2],args[3]);
 }
 if(command.startsWith("'/var/lib/webosbrew/init.d/")){tv.start(args[0]);return '';}
 const put=args.indexOf('>');if(args[0]==='cat'&&put>=0){tv.put(args[put+1],options.input);const mv=args.indexOf('mv');if(mv>=0)tv.io.renameSync(args[mv+1],args[mv+2]);return '';}
 const token=command.match(/printf '%s' '([a-f0-9]+)' > (\S+)/);if(token)tv.put(token[2],token[1]);
 const copy=args.indexOf('cp');if(copy>=0){tv.put(args[copy+2],tv.io.readFileSync(args[copy+1]));return '';}
 if(args[0]==='rm'){args.slice(2).forEach(p=>{if(tv.io.existsSync(p))tv.io.unlinkSync(p);});return '';}
 if(args[0]==='test'){assert(tv.io.existsSync(args[2]),'Missing test file '+args[2]);return '';}
 throw Error('Unexpected C2 command: '+command);
}
require('../lib/ssh');require.cache[require.resolve('../lib/ssh')].exports={
 connect:async()=>client(),exec:execute,
 async upload(c,local,remote){assert(!remote.endsWith('.py'),'Python payload must not be deployed to C2');calls.push('UPLOAD '+remote);tv.put(remote,fs.readFileSync(local));assert.equal(crypto.createHash('sha256').update(tv.io.readFileSync(remote)).digest('hex'),crypto.createHash('sha256').update(fs.readFileSync(local)).digest('hex'));},
 async archive(c,roots,destination){const bytes=tv.archive(roots);fs.writeFileSync(destination,bytes);return {file:destination,size:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')};},
 async installPackage(){calls.push('INSTALL');version='1.4.0';fs.rmSync(tv.physical(tv.APP),{recursive:true,force:true});tv.put(tv.APP+'/appinfo.json',JSON.stringify({id:'com.gathin.tvhome',version}));tv.put(tv.APP+'/wallpaper.jpg',Buffer.from([255,216,255,217]));tv.put(tv.APP+'/new-code.js','new release code');},
 async luna(c,method,data={}){calls.push(method);if(method.endsWith('getSystemInfo'))return {...info};if(method.endsWith('listApps'))return {returnValue:true,apps:initialApps.map(a=>a.id==='com.gathin.tvhome'?{...a,version}:a)};if(method.endsWith('getForegroundAppInfo'))return {returnValue:true,appId:'com.webos.app.home'};if(method.endsWith('/launch')&&data.id==='com.gathin.tvhome'&&failLaunch)throw Error('Injected launcher failure');if(method.includes('executeOneShot'))tv.put(data.path,Buffer.from([255,216,255,217]));return {returnValue:true};}
};
test('real compatibility Setup on O22 survives missing python, installs core and rolls back exact state',{timeout:30000},async()=>{
 const {provision}=require('../lib/provision'),{AutorootSteps}=require('../lib/autoroot'),recovery=require('../lib/recovery');
 const original=tv.io.readFileSync(tv.APP+'/control-token.js');const steps=new AutorootSteps({host:'192.0.2.44',alreadyRooted:true,noFinalReboot:true});
 try{const result=await provision(steps);assert(result.complete&&result.compatibilityMode);assert.equal(probes,1,'Capabilities are probed once per connection');assert(calls.includes('INSTALL'));assert(tv.io.existsSync('/var/lib/webosbrew/gathin-controls/bridge.js'));assert(tv.io.existsSync('/var/lib/webosbrew/gathin-hdmi/track.js'));assert(!tv.io.existsSync('/var/lib/webosbrew/init.d/41-gathin-home-keyhook'));assert(!calls.some(c=>/35-gathin|36-gathin|50-lifesgood|remove-devmode|autoroot\.sh/.test(c)));
  const record=recovery.loadSession();assert.equal(record.recoveryEngine,'node');assert(record.mutationsStarted);assert.equal(record.device.modelName,'OLED65C2PSA');
  await recovery.rollback({host:'192.0.2.44'});assert.equal(recovery.loadSession().mutationsStarted,false);assert.deepEqual(tv.io.readFileSync(tv.APP+'/control-token.js'),original);assert(!tv.io.existsSync(tv.APP+'/new-code.js'));assert(!tv.io.existsSync('/var/lib/webosbrew/gathin-controls/bridge.js'));assert.equal(tv.proc.size,0);assert.deepEqual(tv.io.readdirSync('/var/lib/webosbrew/init.d'),[]);
 }finally{steps.close();}
});
test('compatibility failure after mutation retains a Python-free recoverable snapshot',{timeout:30000},async()=>{
 process.env.GATHIN_RECOVERY_SESSION=path.join(state,'failed-session.json');version='1.3.0';failLaunch=true;
 const {provision}=require('../lib/provision'),{AutorootSteps}=require('../lib/autoroot'),recovery=require('../lib/recovery');const steps=new AutorootSteps({host:'192.0.2.44',alreadyRooted:true,noFinalReboot:true});
 try{await assert.rejects(provision(steps),/Injected launcher failure/);assert(recovery.loadSession().mutationsStarted);assert.equal(recovery.loadSession().recoveryEngine,'node');await recovery.rollback({host:'192.0.2.44'});assert(!recovery.loadSession().mutationsStarted);assert.equal(tv.io.readFileSync(tv.APP+'/control-token.js','utf8'),'window.GATHIN_CONTROL_TOKEN="original";');assert.equal(tv.proc.size,0);}finally{steps.close();failLaunch=false;}
});
test.after(()=>{tv.dispose();fs.rmSync(state,{recursive:true,force:true});});
