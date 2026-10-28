'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,quote,sha256}=require('./local');
const {exec,upload,luna}=require('./ssh');
function entries(){
 const map=JSON.parse(fs.readFileSync(path.join(root,'payload/advanced/map.json')));
 return map.map((x,i)=>({...x,stage:'files/'+i,sha256:sha256(fs.readFileSync(path.join(root,x.local))),mode:(x.remote.endsWith('.py')||x.remote.endsWith('.sh')||x.remote.includes('/init.d/'))?'755':'644'}));
}
async function installAdvanced(client,options={}){
 const list=entries(),stage='/tmp/gathin-advanced-setup';
 const yt=await luna(client,'com.webos.applicationManager/getAppInfo',{id:'youtube.leanback.v4'});
 if((yt.appInfo||yt).version!=='0.5.3')throw Error('Full voice integration requires pinned YouTube AdFree 0.5.3; other versions are not overwritten.');
 for(const entry of list)await upload(client,path.join(root,entry.local),stage+'/'+entry.stage,entry.mode);
 const manifest=path.join(root,'.local/advanced-manifest.json');fs.mkdirSync(path.dirname(manifest),{recursive:true});fs.writeFileSync(manifest,JSON.stringify(list));await upload(client,manifest,stage+'/manifest.json');
 await upload(client,path.join(root,'scripts/install-advanced.py'),stage+'/install.py','755');
 if(options.backupFile){
  const file=path.resolve(options.backupFile);if(!fs.existsSync(file))throw Error('Owner backup not found');
  const decoded=path.join(root,'.local/owner-backup.json');
  fs.writeFileSync(decoded,JSON.stringify(require('./backup-reader').readBackup(file)));
  try{await upload(client,decoded,stage+'/owner-backup.json');}finally{fs.unlinkSync(decoded);}
 }
 try{
  console.log(await exec(client,'python '+quote(stage+'/install.py')+' '+quote(stage),{timeout:90000}));
  for(const name of ['35-gathin-debloat','36-gathin-trim','37-gathin-hdmi','38-gathin-controls','39-gathin-wallpaper','41-gathin-home-keyhook','42-gathin-youtube-voice','43-gathin-voice-results','45-gathin-remote','50-lifesgoodwithoutspying']){
   console.log('Start '+name);await exec(client,quote('/var/lib/webosbrew/init.d/'+name),{timeout:60000});
  }
  await exec(client,'luna-send -w 3000 -n 1 luna://com.webos.applicationManager/closeByAppId '+quote(JSON.stringify({id:'com.gathin.tvhome'})));
  await luna(client,'com.webos.applicationManager/launch',{id:'com.gathin.tvhome'});
 }finally{
  // Only this fixed temporary directory is removed.
  await exec(client,"python -c "+quote("import os,shutil; p='/tmp/gathin-advanced-setup'; assert os.path.realpath(p)==p; shutil.rmtree(p) if os.path.isdir(p) else None")).catch(()=>{});
 }
 const {apps}=await luna(client,'com.webos.applicationManager/listApps');
 const required=['com.fpt.fptplay','com.viettel.media.tv360','netflix'];const missing=required.filter(id=>!apps.some(a=>a.id===id));
 if(missing.length)console.log('Install/sign in using LG Content Store for: '+missing.join(', ')+'. Run -Mode Apps to open the store, then -Mode Sync.');
 if(options.removeExtraApps){
  await upload(client,path.join(root,'scripts/remove-extra-apps.py'),'/tmp/gathin-remove-extra.py');
  console.log(await exec(client,'python /tmp/gathin-remove-extra.py',{timeout:300000}));
  await exec(client,'rm -f /tmp/gathin-remove-extra.py');
 }
 return {missing};
}
module.exports={entries,installAdvanced};
