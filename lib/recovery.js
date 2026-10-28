'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const {root,state,stamp,sha256,quote,rootKeyFile}=require('./local');
const ssh=require('./ssh');const {readArchive}=require('./backup-reader');
const ROOTS=require('../config/recovery-roots.json');
const RUNTIMES=['/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'];
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
async function capture(client,options={},device){
 if(options.dryRun)return null;
 if(!sessionFile(options))process.env.GATHIN_RECOVERY_SESSION=path.join(state,'sessions',require('node:crypto').randomUUID()+'.json');
 const previous=loadSession(options);if(previous){if(previous.host!==options.host)throw Error('Recovery session belongs to another TV');validateSnapshot(previous);return previous;}
 const info=device?.info||await ssh.luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
 const apps=device?.apps||(await ssh.luna(client,'com.webos.applicationManager/listApps')).apps||[];
 const described=JSON.parse(await ssh.exec(client,'python -c '+quote("import os,json; roots="+JSON.stringify(ROOTS)+"; active=[]\nfor p in roots:\n base='/media/developer/temp' if p.startswith('/media/developer/') else '/home/root' if p.startswith('/home/root/') else '/var/lib'\n parent=os.path.dirname(p)\n while not os.path.exists(parent):parent=os.path.dirname(parent)\n while not os.path.exists(base):base=os.path.dirname(base)\n if os.stat(parent).st_dev!=os.stat(base).st_dev:raise RuntimeError('Recovery staging filesystem unavailable: '+p)\nfor pid in os.listdir('/proc'):\n if not pid.isdigit():continue\n try:\n  a=open('/proc/'+pid+'/cmdline').read().split(chr(0))\n  if len(a)>1 and any(a[1]==r or a[1].startswith(r+'/') for r in roots):active.append(a[1])\n except IOError:pass\nprint(json.dumps({'present':[p for p in roots if os.path.lexists(p)],'active':active,'parents':dict((p,os.path.realpath(os.path.dirname(p))) for p in roots)}))")));
 const folder=path.join(state,'backups',stamp());fs.mkdirSync(folder,{recursive:true});const destination=path.join(folder,'before-restore.tar.gz');
 let saved;if(described.present.length)saved=await ssh.archive(client,described.present,destination);else{fs.writeFileSync(destination,zlib.gzipSync(Buffer.alloc(1024)));saved={file:destination,size:fs.statSync(destination).size,sha256:sha256(fs.readFileSync(destination))};}
 let foreground;try{foreground=(await ssh.luna(client,'com.webos.applicationManager/getForegroundAppInfo')).appId;}catch{}
 const record={format:1,createdAt:new Date().toISOString(),host:options.host,hostFingerprint:client.__macTvHostFingerprint,device:info,apps:apps.map(({id,title,version})=>({id,title,version})),roots:ROOTS,present:described.present,parents:described.parents,active:described.active,foreground,saved,folder,mutationsStarted:false};
 validateSnapshot(record);fs.writeFileSync(path.join(folder,'device.json'),JSON.stringify({info,apps:record.apps,files:described.present},null,2));fs.writeFileSync(path.join(folder,'archive.json'),JSON.stringify(saved,null,2));fs.writeFileSync(path.join(folder,'snapshot.json'),JSON.stringify(record,null,2),{mode:0o600});fs.writeFileSync(saved.file+'.sha256',saved.sha256+'  '+path.basename(saved.file)+'\n');
 writeSession(options,record);console.log('Initial recovery backup: '+folder);return record;
}
function markMutation(options={},kind='installation'){const r=loadSession(options);if(!r)throw Error('Initial recovery backup is required before installation');if(r.host!==options.host)throw Error('Recovery session belongs to another TV');validateSnapshot(r);r.mutationsStarted=true;r.lastMutation=kind;writeSession(options,r);return r;}
async function rollback(options={}){
 const record=loadSession(options);validateSnapshot(record);if(record.host!==options.host||!record.mutationsStarted)throw Error('No changed snapshot for this TV/session');
 const key=options.key||rootKeyFile(options.host),client=await ssh.connect({host:options.host,port:22,username:'root',...(fs.existsSync(key)?{key}:{}),trustNewHost:false});
 try{
  if(record.hostFingerprint&&client.__macTvHostFingerprint!==record.hostFingerprint)throw Error('Recovery SSH host identity mismatch');
  if((await ssh.exec(client,'id -u')).trim()!=='0')throw Error('Recovery needs verified root');
  const info=await ssh.luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','boardType']});for(const k of ['modelName','firmwareVersion','boardType'])if(info[k]!==record.device[k])throw Error('Recovery TV identity mismatch');
  const stage='/tmp/mac-tv-rollback-'+Date.now();const metadata=path.join(record.folder,'rollback-input.json');const entries=validateSnapshot(record).map(e=>{const {data,...rest}=e;return data===undefined?rest:{...rest,sha256:sha256(Buffer.from(data,'base64'))};});fs.writeFileSync(metadata,JSON.stringify({...record,entries}),{mode:0o600});
  await ssh.upload(client,record.saved.file,stage+'/snapshot.tar.gz','600');await ssh.upload(client,metadata,stage+'/snapshot.json','600');await ssh.upload(client,path.join(root,'scripts/rollback-snapshot.py'),stage+'/restore.py','700');
  console.log(await ssh.exec(client,'python '+quote(stage+'/restore.py')+' '+quote(stage),{timeout:180000,onOutput:s=>process.stdout.write(s),onErrorOutput:s=>process.stderr.write(s)}));
  record.rolledBackAt=new Date().toISOString();record.mutationsStarted=false;writeSession(options,record);console.log('Original snapshot restored: '+record.folder);return record;
 }finally{client.end();}
}
module.exports={ROOTS,sessionFile,loadSession,validateSnapshot,capture,markMutation,rollback};
