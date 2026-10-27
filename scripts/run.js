'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,rootKeyFile}=require('../lib/local');
const {connect,exec,luna}=require('../lib/ssh');
const tv=require('./tv');
function parse(args){
 const mode=args.shift()||'Setup';const o={host:'',port:22,username:'root'};
 const values={'--host':'host','--key':'rootKey','--developer-key':'developerKey','--backup-file':'backupFile','--output-dir':'outputDir'};
 const flags={'--dry-run':'dryRun','--already-rooted':'alreadyRooted','--trust-new-host':'trustNewHost','--no-reboot':'noFinalReboot','--remove-extra-apps':'removeExtraApps'};
 for(let i=0;i<args.length;i++){
  if(values[args[i]]){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing option value');o[values[args[i]]]=args[++i];}
  else if(flags[args[i]])o[flags[args[i]]]=true;
  else throw Error('Unknown option '+args[i]);
 }
 if(!/^[a-zA-Z0-9.-]+$/.test(o.host))throw Error('Enter a TV IPv4 address or hostname');
 if(!['Setup','Restore','Backup','Doctor','Apps','Sync','Disable'].includes(mode))throw Error('Unknown mode');
 return {mode,o};
}
async function main(args=process.argv.slice(2)){
 const {mode,o}=parse(args);
 if(mode==='Setup'){
  const flags=['--host',o.host];
  for(const [k,f] of [['dryRun','--dry-run'],['alreadyRooted','--already-rooted'],['trustNewHost','--trust-new-host'],['noFinalReboot','--no-final-reboot'],['removeExtraApps','--remove-extra-apps']])if(o[k])flags.push(f);
  for(const [k,f] of [['rootKey','--root-key'],['developerKey','--developer-key'],['backupFile','--backup-file']])if(o[k])flags.push(f,path.resolve(o[k]));
  return require('./bootstrap').main(flags);
 }
 if(mode==='Restore'){
  const {AutorootSteps}=require('../lib/autoroot');const steps=new AutorootSteps({...o,alreadyRooted:true});
  try{
   await steps.prepare();await steps.connectAndCheck();if(o.dryRun){await steps.plan();return;}
   if(steps.options.compatibilityMode){await tv.restore(steps.client,{...o,advanced:true,compatibilityMode:true});return;}
   await steps.prepareRootReconnect();await steps.assertDeveloperModeAbsent();await steps.installApps();await steps.restoreInterface();
   if(!o.noFinalReboot)await steps.rebootAndReconnect('restore');await steps.verifyInstallation();
  }finally{steps.close();}return;
 }
 const key=o.rootKey||rootKeyFile(o.host);const client=await connect({...o,...(fs.existsSync(key)?{key}:{})});
 try{
  if(mode==='Doctor')return await require('../lib/post-install').checkFeatures(client,o);
  await tv.inspect(client,o);
  if(o.dryRun){console.log('Read-only check succeeded; no '+mode+' mutation performed.');return;}
  if(mode==='Backup'){
   const result=await tv.backup(client,o);
   const destination=path.resolve(o.outputDir||path.join(state,'exports'));fs.mkdirSync(destination,{recursive:true});
   const file=path.join(destination,'MAC-WebOSTV-Backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.tar.gz');
   fs.copyFileSync(result.saved.file,file);fs.writeFileSync(file+'.sha256',result.saved.sha256+'  '+path.basename(file)+'\n');
   fs.copyFileSync(path.join(result.folder,'device.json'),file+'.device.json');
   console.log('OWNER BACKUP: '+file+'\nKeep this private. Use -Mode Setup or Restore -BackupFile with this archive.');
  }else if(mode==='Sync'){await tv.syncApps(client,o);await exec(client,". /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-lib.sh; conf_set domains.sdp on; /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh",{timeout:90000});await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.discovery',lock:true});}
  else if(mode==='Apps'){
   await exec(client,". /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-lib.sh; conf_set domains.sdp off; /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh",{timeout:90000});
   await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.discovery',lock:false});
   await luna(client,'com.webos.applicationManager/launch',{id:'com.webos.app.discovery'});
   console.log('LG Content Store opened. Install FPT Play/TV360/Netflix using the TV, then run -Mode Sync.');
  }else if(mode==='Disable'){
   await exec(client,"touch /home/root/DISABLE-GATHIN-HOME /home/root/DISABLE-GATHIN-YOUTUBE-VOICE /home/root/DISABLE-GATHIN-CONTROLS /home/root/DISABLE-GATHIN-TRIM /home/root/DISABLE-GATHIN-LGWS /home/root/DISABLE-GATHIN-REMOTE /home/root/DISABLE-GATHIN-WALLPAPER");
   await exec(client,"python -c "+require('../lib/local').quote("import os,signal; targets=['/home/root/gathin-home-keyhook.py','/home/root/gathin-youtube-voice-router.py','/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js','/var/lib/webosbrew/gathin-remote/server.js']; records=[]\nfor name in os.listdir('/proc'):\n if not name.isdigit():continue\n try:\n  args=open('/proc/'+name+'/cmdline').read().split(chr(0))\n  if len(args)>1 and args[1] in targets:records.append(int(name))\n except IOError:pass\nfor pid in records:\n try:os.kill(pid,signal.SIGTERM)\n except OSError:pass"));
   await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.voiceview',lock:false});
   console.log('Custom input/voice/control runtimes disabled. Root and installed apps retained. Run Restore to re-enable.');
  }
 }finally{client.end();}
}
module.exports={parse,main};if(require.main===module)main().catch(e=>{console.error('Stopped: '+e.message);process.exitCode=1;});
