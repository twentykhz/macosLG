'use strict';
// Runs on TV Node >=0.12. ES5 and built-in modules only; no Python/native addon.
var fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process'),zlib=require('zlib');
var ROOTS=typeof GATHIN_ROOTS!=='undefined'?GATHIN_ROOTS:require('../config/recovery-roots.json');
var APP='/media/developer/apps/usr/palm/applications/com.gathin.tvhome';
var TARGETS=['/home/root/gathin-home-replacement/observe-home.py','/var/lib/webosbrew/gathin-controls/input-helper','/var/lib/webosbrew/gathin-youtube-voice/voice.js','/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-controls/bridge.js','/var/lib/webosbrew/gathin-hdmi/track.py','/var/lib/webosbrew/gathin-hdmi/track.js','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js'];
function assert(ok,message){if(!ok)throw Error(message);}
function exists(p){try{fs.lstatSync(p);return true;}catch(e){if(e.code==='ENOENT'||e.code==='ENOTDIR')return false;throw e;}}
function mkdir(p){if(exists(p)){assert(fs.statSync(p).isDirectory(),'Not a directory: '+p);return;}mkdir(path.dirname(p));fs.mkdirSync(p,448);}
function real(p){var rest=[];while(!exists(p)){rest.unshift(path.basename(p));p=path.dirname(p);}return path.join.apply(path,[fs.realpathSync(p)].concat(rest));}
function sha(p){return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');}
function json(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function base(p){return p.indexOf('/media/developer/')===0?'/media/developer/temp':p.indexOf('/home/root/')===0?'/home/root':'/var/lib';}
function owned(p){return ROOTS.some(function(r){return p===r||p.indexOf(r+'/')===0;});}
function scope(p){assert(owned(p)&&path.normalize(p)===p,'Path outside recovery scope');}
function copy(source,destination){
 var st=fs.lstatSync(source);mkdir(path.dirname(destination));
 if(st.isSymbolicLink()){fs.symlinkSync(fs.readlinkSync(source),destination);if(fs.lchownSync)fs.lchownSync(destination,st.uid,st.gid);return;}
 if(st.isDirectory()){fs.mkdirSync(destination,448);fs.readdirSync(source).forEach(function(n){copy(source+'/'+n,destination+'/'+n);});}
 else{assert(st.isFile(),'Unsupported file type');fs.writeFileSync(destination,fs.readFileSync(source),{flag:'wx',mode:384});}
 fs.chownSync(destination,st.uid,st.gid);fs.chmodSync(destination,st.mode&511);
}
function remove(p){
 assert((/^\/tmp\/gathin-(portable|app-upgrade)-[a-zA-Z0-9-]+(?:\/.*)?$/.test(p)||p==='/media/developer/temp/gathin-app-upgrade-previous'||p.indexOf('/media/developer/temp/gathin-app-upgrade-previous/')===0)&&real(path.dirname(p))===path.dirname(p),'Unsafe cleanup path');
 if(!exists(p))return;var s=fs.lstatSync(p);if(s.isDirectory()&&!s.isSymbolicLink()){fs.readdirSync(p).forEach(function(n){remove(p+'/'+n);});fs.rmdirSync(p);}else fs.unlinkSync(p);
}
function processes(){var list=[];fs.readdirSync('/proc').forEach(function(pid){if(!/^\d+$/.test(pid))return;try{var args=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').split('\0');var script=args[0]==='/var/lib/webosbrew/gathin-controls/input-helper'&&args[1]==='--home'?args[0]:args[1];if(TARGETS.indexOf(script)>=0)list.push({pid:Number(pid),script:script});}catch(e){}});return list;}
function pause(done){
 ['HOME','CONTROLS','HDMI','YOUTUBE-VOICE','REMOTE','WALLPAPER'].forEach(function(n){fs.writeFileSync('/home/root/DISABLE-GATHIN-'+n,'',{mode:384});});
 var list=processes();list.forEach(function(p){try{process.kill(p.pid,'SIGTERM');}catch(e){if(e.code!=='ESRCH')throw e;}});
 var until=Date.now()+10000;(function wait(){if(!processes().length)return done();if(Date.now()>until)return done(Error('Previous project runtime did not stop; refusing file replacement'));setTimeout(wait,100);}());
}
function describe(){var present=[],parents={},active=processes().map(function(p){return p.script;});ROOTS.forEach(function(r){if(exists(r))present.push(r);var p=path.dirname(r),b=base(r);parents[r]=real(p);while(!exists(p))p=path.dirname(p);while(!exists(b))b=path.dirname(b);assert(fs.statSync(p).dev===fs.statSync(b).dev,'Recovery staging filesystem unavailable: '+r);});return {present:present,parents:parents,active:active};}
function safeRelative(p){return p&&p[0]!=='/'&&p.indexOf('\\')<0&&p.split('/').every(function(n){return n&&n!=='.'&&n!=='..';});}
function members(file){
 var tar=zlib.gunzipSync(fs.readFileSync(file)),items=[],longName=null,pax={};assert(tar.length<=134217728,'Archive exceeds recovery limit');
 function str(b){return b.toString('utf8').replace(/\0[\s\S]*$/,'');}function oct(b){var s=str(b).trim();assert(/^[0-7]*$/.test(s),'Invalid tar number');return parseInt(s||'0',8);}
 for(var p=0;p+512<=tar.length;){var h=tar.slice(p,p+512),zero=true;for(var j=0;j<512;j++)if(h[j])zero=false;if(zero)break;var sum=0;for(j=0;j<512;j++)sum+=(j>=148&&j<156)?32:h[j];assert(sum===oct(h.slice(148,156)),'Tar checksum mismatch');var size=oct(h.slice(124,136)),type=String.fromCharCode(h[156]),data=tar.slice(p+512,p+512+size);assert(size<=33554432&&p+512+size<=tar.length,'Invalid tar member size');p+=512+Math.ceil(size/512)*512;
  if(type==='L'){longName=str(data);continue;}if(type==='x'){pax={};for(var at=0;at<data.length;){var space=data.indexOf?data.indexOf(32,at):-1;if(space<0){for(space=at;space<data.length&&data[space]!==32;space++);}var len=Number(data.slice(at,space).toString());assert(len>0&&at+len<=data.length,'Invalid PAX record');var item=data.slice(space+1,at+len-1).toString(),eq=item.indexOf('=');pax[item.slice(0,eq)]=item.slice(eq+1);at+=len;}continue;}
  var prefix=str(h.slice(345,500)),name=pax.path||longName||(prefix?prefix+'/':'')+str(h.slice(0,100));pax={};longName=null;name=name.replace(/^\.\//,'').replace(/^\//,'').replace(/\/$/,'');assert(safeRelative(name),'Unsafe tar path');assert(['0','\0','2','5'].indexOf(type)>=0,'Unsupported tar type');items.push({name:name,type:type,target:str(h.slice(157,257))});
 }
 return items;
}
function extract(file,destination,tarCommand,allowed){
 var entries=members(file),seen={};entries.forEach(function(e){assert(!seen[e.name]&&allowed(e),'Unexpected archive member: '+e.name);seen[e.name]=true;});
 entries.forEach(function(e){assert(!entries.some(function(link){return link.type==='2'&&e.name.indexOf(link.name+'/')===0;}),'Archive descends through symlink');});
 assert(!exists(destination),'Extraction directory already exists');mkdir(destination);
 // Node handles gzip; the TV tar needs only standard uncompressed extraction.
 var plain=file+'.tar';assert(!exists(plain),'Recovery tar work file already exists');fs.writeFileSync(plain,zlib.gunzipSync(fs.readFileSync(file)),{flag:'wx',mode:384});
 try{cp.execFileSync(tarCommand[0],tarCommand.slice(1).concat(['-xf',plain,'-C',destination]));}finally{fs.unlinkSync(plain);}return entries;
}
function appStage(p){assert(/^\/tmp\/gathin-app-upgrade-[a-zA-Z0-9-]+$/.test(p)&&real(p)===p,'Unsafe app staging directory');mkdir(p);}
function userFile(n){return ['control-token.js','remote-access.js','wall.js','family-config.js','apps.js','wallpaper.jpg'].indexOf(n)>=0||/^wall-[a-f0-9]+\.(jpg|png|webp)$/.test(n);}
function preserve(data,restore){appStage(data.stage);var folder=data.stage+'/user-files',manifest=data.stage+'/user-files.json';if(!restore){mkdir(folder);var list=[];(exists(APP)?fs.readdirSync(APP):[]).forEach(function(n){if(!userFile(n))return;assert(fs.lstatSync(APP+'/'+n).isFile(),'Unsafe preserved user file');copy(APP+'/'+n,folder+'/'+n);list.push({name:n,sha256:sha(folder+'/'+n)});});fs.writeFileSync(manifest,JSON.stringify(list),{mode:384});}
 else{var entries=json(manifest);entries.forEach(function(e){assert(userFile(e.name)&&e.name.indexOf('/')<0&&sha(folder+'/'+e.name)===e.sha256,'Preserved file checksum mismatch');});entries.forEach(function(e){var dest=APP+'/'+e.name,temp=dest+'.upgrade-preserve';assert(!exists(temp)&&(!exists(dest)||!fs.lstatSync(dest).isSymbolicLink()),'Unsafe preserved destination');copy(folder+'/'+e.name,temp);fs.renameSync(temp,dest);});}}
function promote(data){appStage(data.stage);var manifest=json(data.stage+'/manifest.json'),expected={};manifest.forEach(function(e){assert(safeRelative(e.path),'Invalid app member');expected[e.path]=e.sha256;});var extractAt=data.stage+'/app';extract(data.stage+'/app.tar.gz',extractAt,data.tar,function(e){return e.type==='0'&&!!expected[e.name];});manifest.forEach(function(e){assert(sha(extractAt+'/'+e.path)===e.sha256,'Staged app hash mismatch');});assert(json(extractAt+'/appinfo.json').id==='com.gathin.tvhome','Wrong launcher ID');
 var next='/media/developer/temp/gathin-app-upgrade-new',old='/media/developer/temp/gathin-app-upgrade-previous';assert(!exists(next)&&!exists(old),'Previous app upgrade needs recovery');mkdir(path.dirname(next));assert(fs.statSync(APP).dev===fs.statSync(path.dirname(next)).dev,'App staging filesystem mismatch');copy(extractAt,next);fs.readdirSync(APP).forEach(function(n){if(userFile(n)){assert(fs.lstatSync(APP+'/'+n).isFile(),'Unsafe user asset');if(exists(next+'/'+n))fs.unlinkSync(next+'/'+n);copy(APP+'/'+n,next+'/'+n);}});fs.renameSync(APP,old);try{fs.renameSync(next,APP);}catch(e){fs.renameSync(old,APP);throw e;}}
function verifyRollback(data){
 var record=data.record,stage=data.stage;assert(/^\/tmp\/mac-tv-rollback-[a-zA-Z0-9-]+$/.test(stage)&&real(stage)===stage,'Unsafe recovery staging path');assert(JSON.stringify(record.roots)===JSON.stringify(ROOTS),'Invalid recovery roots');assert(sha(stage+'/snapshot.tar.gz')===record.saved.sha256,'Recovery archive checksum mismatch');
 var expected={};record.entries.forEach(function(e){scope(e.path);assert(!expected[e.path],'Duplicate recovery path');expected[e.path]=e;});
 if(!exists(stage+'/extracted'))extract(stage+'/snapshot.tar.gz',stage+'/extracted',data.tar,function(e){var saved=expected['/'+e.name];return !!saved&&((e.type==='2'&&saved.type==='symlink'&&saved.target===e.target)||(e.type==='5'&&saved.type==='directory')||((e.type==='0'||e.type==='\0')&&saved.type==='file'));});
 record.entries.forEach(function(e){var p=stage+'/extracted'+e.path,s=fs.lstatSync(p);if(e.type==='file'){assert(s.isFile()&&!s.isSymbolicLink()&&sha(p)===e.sha256,'Snapshot file checksum mismatch');if(/\.sh$/.test(p)||p.indexOf('/init.d/')>=0)cp.execFileSync('/bin/sh',['-n',p]);}else if(e.type==='symlink')assert(s.isSymbolicLink()&&fs.readlinkSync(p)===e.target,'Snapshot symlink mismatch');});
 ROOTS.forEach(function(r){assert(real(path.dirname(r))===record.parents[r],'Recovery parent identity mismatch: '+r);var p=path.dirname(r),b=base(r);while(!exists(p))p=path.dirname(p);while(!exists(b))b=path.dirname(b);assert(fs.statSync(p).dev===fs.statSync(b).dev,'Recovery filesystem mismatch');});return stage+'/extracted';
}
function rollback(data,done){var record=data.record,extractAt=verifyRollback(data);pause(function(error){if(error)return done(error);var journal=[];
 try{ROOTS.forEach(function(r,i){var work=base(r)+'/.mac-tv-recovery-'+path.basename(data.stage);mkdir(work);var old=work+'/entry-'+i,next=old+'.new',source=extractAt+r;assert(!exists(old)&&!exists(next),'Recovery work path already exists');var has=exists(r);if(exists(source))copy(source,next);if(has)fs.renameSync(r,old);journal.push({root:r,old:old,has:has});if(exists(next)){mkdir(path.dirname(r));fs.renameSync(next,r);}});
  record.entries.forEach(function(e){if(e.type==='file')assert(sha(e.path)===e.sha256,'Restored file checksum mismatch');});
 }catch(e){journal.reverse().forEach(function(j){if(exists(j.root))fs.renameSync(j.root,j.old+'.failed');if(j.has)fs.renameSync(j.old,j.root);});return done(e);}
 ROOTS.forEach(function(r){if(r.indexOf('/var/lib/webosbrew/gathin-')===0&&exists(r)&&fs.lstatSync(r).isDirectory())fs.readdirSync(r).forEach(function(n){if(/\.pid$/.test(n)&&fs.lstatSync(r+'/'+n).isFile())fs.unlinkSync(r+'/'+n);});});if(exists('/tmp/gathin-home-keyhook.pid'))fs.unlinkSync('/tmp/gathin-home-keyhook.pid');
 if(exists('/usr/sbin/ls-control'))['scan-services','scan-volatile-dirs'].forEach(function(arg){try{cp.execFileSync('/usr/sbin/ls-control',[arg]);}catch(e){}});
 var pairs=[['observe-home.py','/home/root/gathin-home-replacement/observer.sh'],['input-helper','41-gathin-home-keyhook'],['voice.js','42-gathin-youtube-voice'],['track.py','37-gathin-hdmi'],['track.js','37-gathin-hdmi'],['bridge.py','38-gathin-controls'],['bridge.js','38-gathin-controls'],['wallpaper-service.js','39-gathin-wallpaper'],['gathin-youtube-voice-router.py','42-gathin-youtube-voice'],['server.js','45-gathin-remote'],['gathin-home-keyhook.py','41-gathin-home-keyhook']],hooks=[];
 pairs.forEach(function(pair){if(record.active.some(function(p){return path.basename(p)===pair[0];})&&hooks.indexOf(pair[1])<0)hooks.push(pair[1]);});
 function start(){if(!hooks.length)return check();var name=hooks.shift(),hook=name[0]==='/'?name:'/var/lib/webosbrew/init.d/'+name;cp.execFile('/bin/sh',[hook],{timeout:45000},function(e){if(e)return done(Error('Snapshot restored but original boot hook failed'));start();});}
 var until=Date.now()+10000;function check(){var running=processes().map(function(p){return p.script;});if(record.active.every(function(p){return running.filter(function(s){return s===p;}).length===1;}))return done();if(Date.now()>until)return done(Error('Snapshot files restored but original runtime did not restart'));setTimeout(check,100);}start();
 });}
function main(operation,data,done){assert(process.getuid&&process.getuid()===0,'Verified root required');
 if(operation==='pause')return pause(done);if(operation==='rollback')return rollback(data,done);
 if(operation==='describe')return done(null,describe());if(operation==='rollback-verify')verifyRollback(data);
 else if(operation==='preserve-save')preserve(data,false);else if(operation==='preserve-restore')preserve(data,true);else if(operation==='promote')promote(data);
 else if(operation==='cleanup'){(data.paths||[]).forEach(remove);}else if(operation!=='describe')throw Error('Unknown portable operation');done(null,{complete:true});
}
module.exports={main:main,describe:describe,verifyRollback:verifyRollback,members:members,TARGETS:TARGETS};
if(require.main===module)try{var input=process.argv[3];assert(/^\/tmp\/gathin-portable-[a-zA-Z0-9-]+\/input-[a-zA-Z0-9-]+\.json$/.test(input),'Unsafe runtime input');main(process.argv[2],json(input),function(error,value){if(error){console.error(error.message);process.exitCode=1;}else console.log(JSON.stringify(value||{complete:true}));});}catch(e){console.error(e.message);process.exitCode=1;}
