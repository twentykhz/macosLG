'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {root,state,stamp,sha256,quote,rootKeyFile}=require('./local');
const ssh=require('./ssh');const {readArchive}=require('./backup-reader');
const ROOTS=require('../config/recovery-roots.json');
const RUNTIMES=['/home/root/gathin-home-replacement/observe-home.py','/var/lib/webosbrew/gathin-controls/input-helper','/var/lib/webosbrew/gathin-youtube-voice/voice.js','/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-controls/bridge.js','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-hdmi/track.js','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'];
function sessionFile(options={}){return options.recoverySession||process.env.GATHIN_RECOVERY_SESSION;}
function writeSession(options,record){const file=sessionFile(options);if(file){fs.mkdirSync(path.dirname(path.resolve(file)),{recursive:true});fs.writeFileSync(file+'.new',JSON.stringify(record,null,2),{mode:0o600,flush:true});fs.renameSync(file+'.new',file);}return record;}
function loadSession(options={}){const file=sessionFile(options);return file&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):null;}
function validateSnapshot(record){
 if(!record||record.format!==1||!record.saved||JSON.stringify(record.roots)!==JSON.stringify(ROOTS)||!Array.isArray(record.active)||record.active.some(p=>!RUNTIMES.includes(p))||!record.parents||!Array.isArray(record.present)||record.present.some(p=>!ROOTS.includes(p)))throw Error('Invalid recovery snapshot');
 if(sha256(fs.readFileSync(record.saved.file))!==record.saved.sha256)throw Error('Recovery checksum mismatch');
 const entries=readArchive(record.saved.file),links=entries.filter(e=>e.type==='symlink');
 for(const e of entries){if(!record.roots.some(p=>e.path===p||e.path.startsWith(p+'/')))throw Error('Recovery path outside snapshot scope');if(e.type==='symlink'&&(!path.posix.isAbsolute(e.target)||path.posix.normalize(e.target)!==e.target||!(/^\/home\/root\/(gathin-|home-launcher-)/.test(e.target)||e.target.startsWith('/media/developer/apps/usr/palm/applications/')||ROOTS.includes(e.target))))throw Error('Unsafe recovery symlink');if(links.some(link=>e.path.startsWith(link.path+'/')))throw Error('Archive descends through a symlink');}
 return entries;
}
async function describeSnapshot(client,caps,backupOnly){
 if(caps.stat&&caps.readlink){
  const text=await ssh.exec(client,'sh -s -- '+ROOTS.map(quote).join(' '),{input:fs.readFileSync(path.join(root,'scripts/describe-tv.sh'))});
  const value={present:[],active:[],parents:{}};let ended=false;
  for(const line of text.trim().split(/\r?\n/)){const [kind,p,real]=line.split('\t');if(kind==='present')value.present.push(p);else if(kind==='active')value.active.push(p);else if(kind==='parent')value.parents[p]=real;else if(kind==='end'&&p==='GATHIN_SNAPSHOT_V1')ended=true;else throw Error('Invalid snapshot metadata record');}
  if(!ended||ROOTS.some(p=>typeof value.parents[p]!=='string'))throw Error('Incomplete snapshot metadata');return value;
 }
 if(caps.nodeFiles)return JSON.parse(await require('./portable-tv').run(client,'describe'));
 if(!caps.python2){if(!backupOnly)throw Error('Backup needs stat/readlink or a usable Node filesystem runtime');const text=await ssh.exec(client,ROOTS.map(p=>'if [ -e '+quote(p)+' ] || [ -L '+quote(p)+' ]; then printf '+quote('%s\n')+' '+quote(p)+'; fi').join('\n'));return {present:text.trim()?text.trim().split(/\r?\n/):[],active:[],parents:{}};}
 return JSON.parse(await ssh.exec(client,quote(caps.python2)+' -c '+quote("import os,json; roots="+JSON.stringify(ROOTS)+"; targets="+JSON.stringify(RUNTIMES)+"; active=[]\nfor p in roots:\n base='/media/developer/temp' if p.startswith('/media/developer/') else '/home/root' if p.startswith('/home/root/') else '/var/lib'\n parent=os.path.dirname(p)\n while not os.path.exists(parent):parent=os.path.dirname(parent)\n while not os.path.exists(base):base=os.path.dirname(base)\n if os.stat(parent).st_dev!=os.stat(base).st_dev:raise RuntimeError('Recovery staging filesystem unavailable: '+p)\nfor pid in os.listdir('/proc'):\n if not pid.isdigit():continue\n try:\n  a=open('/proc/'+pid+'/cmdline').read().split(chr(0))\n  if len(a)>1 and a[1] in targets:active.append(a[1])\n except IOError:pass\nprint(json.dumps({'present':[p for p in roots if os.path.lexists(p)],'active':active,'parents':dict((p,os.path.realpath(os.path.dirname(p))) for p in roots)}))")));
}
async function capture(client,options={},device){
 if(options.dryRun)return null;
 if(!sessionFile(options))process.env.GATHIN_RECOVERY_SESSION=path.join(state,'sessions',require('node:crypto').randomUUID()+'.json');
 const caps=await require('./tv-capabilities').probe(client);
 if(!caps.root||!caps.tar)throw Error('Backup requires verified root and tar');
 if(!options.backupOnly&&(!caps.hash||(!caps.nodeFiles&&!caps.pythonRecovery)))throw Error('No verified rollback path: SHA-256 and Node filesystem runtime (or legacy Python2) required before changing this TV');
 const previous=loadSession(options);if(previous){if(previous.host!==options.host)throw Error('Recovery session belongs to another TV');validateSnapshot(previous);return previous;}
 if(!options.backupOnly&&caps.nodeFiles)await require('./portable-tv').helper(client);
 const info=device?.info||await ssh.luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
 const apps=device?.apps||(await ssh.luna(client,'com.webos.applicationManager/listApps')).apps||[];
 const described=await describeSnapshot(client,caps,options.backupOnly);
 const folder=path.join(state,'backups',stamp());fs.mkdirSync(folder,{recursive:true});const destination=path.join(folder,'before-restore.tar.gz');
 let saved;if(described.present.length)saved=await ssh.archive(client,described.present,destination);else{fs.writeFileSync(destination,zlib.gzipSync(Buffer.alloc(1024)));saved={file:destination,size:fs.statSync(destination).size,sha256:sha256(fs.readFileSync(destination))};}
 let foreground;try{foreground=(await ssh.luna(client,'com.webos.applicationManager/getForegroundAppInfo')).appId;}catch{}
 const record={format:1,createdAt:new Date().toISOString(),host:options.host,hostFingerprint:client.__macTvHostFingerprint,device:info,apps:apps.map(({id,title,version})=>({id,title,version})),recoveryEngine:caps.nodeFiles?'node':caps.pythonRecovery?'python2':null,roots:ROOTS,present:described.present,parents:described.parents,active:described.active,foreground,saved,folder,mutationsStarted:false};
 validateSnapshot(record);fs.writeFileSync(path.join(folder,'device.json'),JSON.stringify({info,apps:record.apps,files:described.present},null,2));fs.writeFileSync(path.join(folder,'archive.json'),JSON.stringify(saved,null,2));fs.writeFileSync(path.join(folder,'snapshot.json'),JSON.stringify(record,null,2),{mode:0o600});fs.writeFileSync(saved.file+'.sha256',saved.sha256+'  '+path.basename(saved.file)+'\n');
 writeSession(options,record);console.log('Initial recovery backup: '+folder);return record;
}
function markMutation(options={},kind='installation'){const r=loadSession(options);if(!r)throw Error('Initial recovery backup is required before installation');if(r.host!==options.host)throw Error('Recovery session belongs to another TV');validateSnapshot(r);if(!r.recoveryEngine)throw Error('No verified rollback engine; refusing TV mutation');r.mutationsStarted=true;r.lastMutation=kind;writeSession(options,r);return r;}
async function rollback(options={}){
 const record=loadSession(options);validateSnapshot(record);if(record.host!==options.host||(!record.mutationsStarted&&!options.manualRollback))throw Error('No changed snapshot for this TV/session');
 const key=options.key||rootKeyFile(options.host),client=await ssh.connect({host:options.host,port:22,username:'root',...(fs.existsSync(key)?{key}:{}),trustNewHost:false});
 try{
  if(record.hostFingerprint&&client.__macTvHostFingerprint!==record.hostFingerprint)throw Error('Recovery SSH host identity mismatch');
  if((await ssh.exec(client,'id -u')).trim()!=='0')throw Error('Recovery needs verified root');
  const info=await ssh.luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','boardType']});for(const k of ['modelName','firmwareVersion','boardType'])if(info[k]!==record.device[k])throw Error('Recovery TV identity mismatch');
  const caps=await require('./tv-capabilities').probe(client);
  if(!caps.hash||!caps.tar||(!caps.nodeFiles&&!caps.pythonRecovery))throw Error('Recovery needs verified SHA-256, tar and a working rollback engine');
  if(options.dryRun){console.log('Rollback preflight OK. No TV uploads, file changes, app removal or reboot.');return {...record,dryRun:true};}
  const stage='/tmp/mac-tv-rollback-'+Date.now();const metadata=path.join(record.folder,'rollback-input.json');const entries=validateSnapshot(record).map(e=>{const {data,...rest}=e;return data===undefined?rest:{...rest,sha256:sha256(Buffer.from(data,'base64'))};});fs.writeFileSync(metadata,JSON.stringify({...record,entries}),{mode:0o600});
  await ssh.upload(client,record.saved.file,stage+'/snapshot.tar.gz','600');
  await ssh.upload(client,metadata,stage+'/snapshot.json','600');
  if(caps.nodeFiles){
   const data={stage,record:{...record,entries},tar:caps.tar};
   await require('./portable-tv').run(client,'rollback-verify',data);
   await require('./launcher-install').pause(client);
   const maintenance=await require('./maintenance').beforeRollback(client,record);
   await ssh.luna(client,'com.webos.applicationManager/closeByAppId',{id:'com.gathin.tvhome'}).catch(()=>{});
   const {apps=[]}=await ssh.luna(client,'com.webos.applicationManager/listApps');
   for(const app of apps)if(['com.gathin.tvhome','youtube.leanback.v4','ooo.lew.lifesgoodwithoutspying'].includes(app.id)&&!record.apps.some(a=>a.id===app.id))await require('./app-removal').remove(client,app.id);
   console.log(await require('./portable-tv').run(client,'rollback',data,{timeout:180000}));
   if(record.present.includes('/var/lib/webosbrew/init.d/50-lifesgoodwithoutspying'))await ssh.exec(client,'/var/lib/webosbrew/init.d/50-lifesgoodwithoutspying');
   else if(maintenance?.priorPrivacyActive)await ssh.exec(client,'/media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh',{timeout:180000});
   if(record.foreground)await ssh.luna(client,'com.webos.applicationManager/launch',{id:record.foreground});
  }else if(caps.pythonRecovery){
   await ssh.upload(client,path.join(root,'scripts/rollback-snapshot.py'),stage+'/restore.py','700');
   console.log(await ssh.exec(client,quote(caps.python2)+' '+quote(stage+'/restore.py')+' '+quote(stage),{timeout:180000}));
  }else throw Error('No verified rollback engine on this TV; backup retained');
  record.rolledBackAt=new Date().toISOString();record.mutationsStarted=false;writeSession(options,record);console.log('Original snapshot restored: '+record.folder);return record;
 }finally{client.end();}
}
module.exports={ROOTS,sessionFile,loadSession,validateSnapshot,capture,markMutation,rollback};
