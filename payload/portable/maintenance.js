'use strict';
var fs=require('fs'),cp=require('child_process'),P='/var/lib/webos-debloat/gathin-final',APP='/media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying';
function run(file,args){return new Promise(function(resolve,reject){cp.execFile(file,args,{timeout:90000,maxBuffer:2097152},function(e,out){if(e)reject(e);else resolve(out);});});}
function luna(api,data){return run('/usr/bin/luna-send',['-w','3000','-n','1','luna://com.webos.applicationManager/'+api,JSON.stringify(data||{})]).then(function(out){var r=JSON.parse(out);if(r.returnValue===false)throw Error(r.errorText||api);return r;});}
function lockState(app){for(var i=0;i<3;i++){var value=app[['locked','lock','isLocked'][i]];if(typeof value==='boolean')return value;}return null;}
function allowedDomain(s){return /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(s)&&s.indexOf('.')>0&&!/(?:nextlgsdp\.com|lgsmartplatform\.com|lgeapi\.com|ueiwsp\.com|thinq|quickset|voice|speech|nlp|oauth|auth\.)/.test(s);}
function serial(rows,fn){return rows.reduce(function(p,r){return p.then(function(){return fn(r);});},Promise.resolve());}
function unmountLists(){var mounts=fs.readFileSync('/proc/self/mountinfo','utf8').split('\n');return serial(mounts.filter(function(line){var x=line.split(' '),target=x[4]||'',name=target.slice((APP+'/init/blocklist.d/').length);if(target.indexOf(APP+'/init/blocklist.d/')!==0||!/^\d+-[a-z]+\.txt$/.test(name))return false;try{var source=fs.statSync(P+'/privacy-lists/'+name),mounted=fs.statSync(target);return source.dev===mounted.dev&&source.ino===mounted.ino;}catch(e){return false;}}).map(function(line){return line.split(' ')[4];}).reverse(),function(target){return run('umount',[target]);});}
function applyDebloat(){
 var policy=JSON.parse(fs.readFileSync(P+'/policy.json')),journal=JSON.parse(fs.readFileSync(P+'/journal.json'));
 return luna('listApps',{}).then(function(r){return serial((r.apps||[]).filter(function(a){return policy.optionalApps.indexOf(a.id)>=0&&policy.protectedApps.indexOf(a.id)<0;}),function(a){
  return (lockState(a)===null?luna('getAppInfo',{id:a.id}).then(function(r){var value=lockState(r.appInfo||r);if(value!==null)a.locked=value;}).catch(function(){}):Promise.resolve()).then(function(){
  if(!journal.apps.some(function(x){return x.id===a.id;})){journal.apps.push({id:a.id,locked:lockState(a)});fs.writeFileSync(P+'/journal.json',JSON.stringify(journal));}
  var old=journal.apps.filter(function(x){return x.id===a.id;})[0];
  return (old.locked===false?luna('lockApp',{id:a.id,lock:true}):Promise.resolve()).then(function(){return luna('closeByAppId',{id:a.id}).catch(function(){});}).then(function(){console.log(a.id+': '+(old.locked===false?'locked (reversible)':old.locked===true?'already locked':'closed only; original lock state unavailable'));});
 });});});
}
function privacy(){
 if(fs.existsSync('/home/root/DISABLE-GATHIN-LGWS'))return Promise.resolve();
 var lists=APP+'/init/blocklist.d';if(!fs.existsSync(lists))return Promise.reject(Error('LGWS blocklists missing'));
 // SDP OFF in upstream 0.7.0 still blocks immediately. Filter its list explicitly.
 return run('/bin/sh',[APP+'/init/nospy-remove.sh']).then(unmountLists).then(function(){return serial(fs.readdirSync(lists).filter(function(f){return /^\d+-[a-z]+\.txt$/.test(f);}),function(file){
  var target=lists+'/'+file,filtered=P+'/privacy-lists/'+file;
  var text=fs.readFileSync(target,'utf8').split(/\r?\n/).map(function(x){return x.trim();}).filter(function(x){return file!=='45-sdp.txt'&&allowedDomain(x);}).join('\n')+'\n';fs.writeFileSync(filtered,text);
  return run('mount',['--bind',filtered,target]);
 });}).then(function(){return run('/bin/sh',[APP+'/init/nospy-apply.sh']);});
}
function undo(){var j=JSON.parse(fs.readFileSync(P+'/journal.json'));return run('/bin/sh',[APP+'/init/nospy-remove.sh']).catch(function(){}).then(unmountLists).then(function(){return serial(j.apps.filter(function(a){return typeof a.locked==='boolean';}),function(a){return luna('lockApp',{id:a.id,lock:a.locked});});});}
function main(mode){if(mode==='cleanup')return run('/bin/sh',[APP+'/init/nospy-remove.sh']).then(unmountLists);if(mode==='debloat')return applyDebloat();if(mode==='privacy')return privacy();if(mode==='undo')return undo();throw Error('Unknown maintenance mode');}
module.exports={allowedDomain:allowedDomain,lockState:lockState,main:main};if(require.main===module)main(process.argv[2]).catch(function(e){console.error(e.message);process.exitCode=1;});
