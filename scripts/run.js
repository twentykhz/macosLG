'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,rootKeyFile}=require('../lib/local');
const {connect,exec,luna}=require('../lib/ssh');
const tv=require('./tv');
function parse(args){
 const mode=args.shift()||'Setup';const o={host:'',port:22,username:'root'};
 const values={'--host':'host','--key':'rootKey','--developer-key':'developerKey','--backup-file':'backupFile','--output-dir':'outputDir','--expected-model':'expectedModel','--expected-firmware':'expectedFirmware','--session':'recoverySession'};
 const flags={'--dry-run':'dryRun','--already-rooted':'alreadyRooted','--trust-new-host':'trustNewHost','--no-reboot':'noFinalReboot','--remove-extra-apps':'removeExtraApps','--yes':'confirmRollback'};
 for(let i=0;i<args.length;i++){
  if(values[args[i]]){if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Missing option value');o[values[args[i]]]=args[++i];}
  else if(flags[args[i]])o[flags[args[i]]]=true;
  else throw Error('Unknown option '+args[i]);
 }
 if(!/^[a-zA-Z0-9.-]+$/.test(o.host))throw Error('Enter a TV IPv4 address or hostname');
 if(!['Setup','Restore','Backup','Doctor','Apps','Sync','Disable','Rollback','Debloat'].includes(mode))throw Error('Unknown mode');
 if(mode!=='Rollback'&&(o.recoverySession||o.confirmRollback))throw Error('--session and --yes are only available for Rollback');
 return {mode,o};
}
async function main(args=process.argv.slice(2)){
 if(process.platform!=='win32')process.umask(0o077);
 require('../lib/setup-output').installOutputLog();
 require('../lib/setup-language').installConsole();
 const {mode,o}=parse(args);
 if(mode==='Rollback')return require('../lib/manual-rollback').run(o);
 if(mode==='Setup'){
  const flags=['--host',o.host];
  for(const [k,f] of [['dryRun','--dry-run'],['alreadyRooted','--already-rooted'],['trustNewHost','--trust-new-host'],['noFinalReboot','--no-final-reboot'],['removeExtraApps','--remove-extra-apps']])if(o[k])flags.push(f);
  for(const [k,f] of [['rootKey','--root-key'],['developerKey','--developer-key'],['backupFile','--backup-file']])if(o[k])flags.push(f,path.resolve(o[k]));
  for(const [k,f] of [['expectedModel','--expected-model'],['expectedFirmware','--expected-firmware']])if(o[k])flags.push(f,o[k]);
  return require('./bootstrap').main(flags);
 }
 if(mode==='Restore'){
  const {AutorootSteps}=require('../lib/autoroot');const steps=new AutorootSteps({...o,alreadyRooted:true});
  try{
   await steps.prepare();await steps.connectAndCheck();if(o.dryRun){await steps.plan();return;}
   await steps.captureInitialState();
   await steps.prepareRootReconnect();
   await steps.remindRootSafety();
   if(steps.options.compatibilityMode){await tv.restore(steps.client,{...o,advanced:true,compatibilityMode:true});return;}
   await steps.assertDeveloperModeAbsent();await steps.installApps();await steps.restoreInterface();
   if(!o.noFinalReboot)await steps.rebootAndReconnect('restore');await steps.verifyInstallation();
  }finally{steps.close();}return;
 }
 const key=o.rootKey||rootKeyFile(o.host);const client=await connect({...o,...(fs.existsSync(key)?{key}:{})});
 try{
  if(mode==='Doctor')return await require('../lib/post-install').checkFeatures(client,{...o,readOnly:true});
  const device=await tv.inspect(client,o);
  if(o.dryRun){console.log('Read-only check succeeded; no '+mode+' mutation performed.');return;}
  if(mode==='Debloat'){
   if(!o.recoverySession)o.recoverySession=path.join(state,'debloat-'+Date.now()+'.json');
   await require('../lib/recovery').capture(client,o,device);
   const ensured=await require('../lib/post-install').ensureApps(client,{...o,compatibilityMode:true});device.apps=ensured.apps;
   await require('../lib/dependencies').prepare(client,o);
   const result=await require('../lib/maintenance').install(client,o,device);console.log(JSON.stringify(result,null,2));return result;
  }
  if(mode==='Backup'){
   const result=await tv.backup(client,{...o,backupOnly:true});
   const destination=path.resolve(o.outputDir||path.join(state,'exports'));fs.mkdirSync(destination,{recursive:true});
   const file=path.join(destination,'MAC-WebOSTV-Backup-'+new Date().toISOString().replace(/[:.]/g,'-')+'.tar.gz');
   fs.copyFileSync(result.saved.file,file);fs.writeFileSync(file+'.sha256',result.saved.sha256+'  '+path.basename(file)+'\n');
   fs.copyFileSync(path.join(result.folder,'device.json'),file+'.device.json');
   console.log('OWNER BACKUP: '+file+'\nKeep this private. Use -Mode Setup or Restore -BackupFile with this archive.');
  }else if(mode==='Sync'){await tv.syncApps(client,o);if(!device.compatibility){await exec(client,". /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-lib.sh; conf_set domains.sdp on; /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh",{timeout:90000});await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.discovery',lock:true});}}
  else if(mode==='Apps'){
   if(!device.compatibility){
   await exec(client,". /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-lib.sh; conf_set domains.sdp off; /media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying/init/nospy-apply.sh",{timeout:90000});
   await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.discovery',lock:false});}
   await luna(client,'com.webos.applicationManager/launch',{id:'com.webos.app.discovery'});
   console.log('LG Content Store opened. Install FPT Play/TV360/Netflix using the TV, then run -Mode Sync.');
  }else if(mode==='Disable'){
   const caps=await require('../lib/tv-capabilities').probe(client);if(!caps.nodeFiles&&!caps.python2)throw Error('No safe runtime-stop engine; no disable markers changed');if(caps.nodeFiles)await require('../lib/portable-tv').helper(client);
   await exec(client,"if [ -d /home/root/gathin-home-replacement ]; then touch /home/root/gathin-home-replacement/disabled; fi; touch /home/root/DISABLE-GATHIN-HOME /home/root/DISABLE-GATHIN-HDMI /home/root/DISABLE-GATHIN-YOUTUBE-VOICE /home/root/DISABLE-GATHIN-CONTROLS /home/root/DISABLE-GATHIN-TRIM /home/root/DISABLE-GATHIN-DEBLOAT /home/root/DISABLE-GATHIN-LGWS /home/root/DISABLE-GATHIN-REMOTE /home/root/DISABLE-GATHIN-WALLPAPER");
   await require('../lib/launcher-install').pause(client);
   await luna(client,'com.webos.applicationManager/lockApp',{id:'com.webos.app.voiceview',lock:false});
   console.log('Custom input/voice/control runtimes disabled. Root and installed apps retained. Run Restore to re-enable.');
  }
 }finally{client.end();}
}
module.exports={parse,main};if(require.main===module)main().catch(e=>{console.error('Stopped: '+e.message);process.exitCode=1;});
