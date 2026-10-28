'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {root,state,profile,quote,stamp,verify,assertProfile,rootKeyFile}=require('../lib/local');
const {connect,exec,luna,upload,archive,installPackage}=require('../lib/ssh');

function parse(argv){
  const [command='help',...args]=argv;
  const configPath=path.join(root,'config/device.json');
  const options={host:'',port:22,username:'root',...(fs.existsSync(configPath)?JSON.parse(fs.readFileSync(configPath)): {})};
  const flags={'--host':'host','--port':'port','--key':'key','--backup-file':'backupFile'};
  const switches={'--dry-run':'dryRun','--trust-new-host':'trustNewHost','--allow-firmware-mismatch':'allowFirmwareMismatch','--privacy':'privacy','--advanced':'advanced','--remove-extra-apps':'removeExtraApps'};
  for(let i=0;i<args.length;i++){
    if(flags[args[i]]){if(!args[i+1]||args[i+1].startsWith('--'))throw new Error('Missing value: '+args[i]);options[flags[args[i]]]=args[++i];}
    else if(switches[args[i]])options[switches[args[i]]]=true;
    else throw new Error('Unknown option: '+args[i]);
  }
  if(!['help','doctor','backup','restore','sync-apps','disable','enable','reboot'].includes(command))throw new Error('Unknown command: '+command);
  if(options.dryRun&&!['restore','sync-apps'].includes(command))throw new Error('--dry-run is only supported for restore and sync-apps');
  options.port=Number(options.port);
  if(!options.key&&fs.existsSync(rootKeyFile(options.host)))options.key=rootKeyFile(options.host);
  if(command!=='help'&&(!options.host||options.username!=='root'||!Number.isInteger(options.port)||options.port<1||options.port>65535))throw new Error('Invalid device connection settings');
  if('password' in options)throw new Error('Do not put passwords in config/device.json; use the hidden prompt or --key.');
  if(!['help','doctor','backup','restore','sync-apps','disable','enable','reboot'].includes(command))throw new Error('Unknown command: '+command);
  if(options.dryRun&&!['restore','sync-apps'].includes(command))throw new Error('--dry-run is only supported for restore and sync-apps');
  return {command,options};
}

async function inspect(client,options){
  if((await exec(client,'id -u')).trim()!=='0')throw new Error('Root SSH required; finish rooting first.');
  const info=await luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
  const caps=await require('../lib/tv-capabilities').probe(client);
  const reference=!!options.backupFile&&require('../lib/tv-capabilities').legacyHome(caps,info); // One feature engine for every model; owner backups remain identity-bound.
  if(!reference){const {apps=[]}=await luna(client,'com.webos.applicationManager/listApps');console.log('Rooted compatibility mode: '+info.modelName+'/'+info.boardType);return {info,apps,compatibility:true};}
  const python=(await exec(client,quote(caps.python2)+" -B -c 'import sys,fcntl,select,struct,hashlib,json; print(sys.version_info[0]); print(struct.calcsize(\"llHHi\"))'" )).trim().split(/\r?\n/);
  if(python[0]!=='2'||python[1]!=='16')throw new Error('This relay requires the verified TV Python 2 / 32-bit input ABI.');
  await exec(client,'test -x /var/lib/webosbrew/startup.sh && test -d /var/lib/webosbrew/init.d');
  const {apps=[]}=await luna(client,'com.webos.applicationManager/listApps');
  if(!apps.some(app=>app.id==='org.webosbrew.hbchannel'))throw new Error('Homebrew Channel not registered; finish root setup first.');
  const inputs=await exec(client,'cat /proc/bus/input/devices');
  for(const name of [profile.sourceDeviceName,profile.targetDeviceName])if(!inputs.includes('Name="'+name+'"'))throw new Error('Required Magic Remote input channel missing: '+name);
  return {info,apps};
}

async function doctor(client,options){
  const device=await inspect(client,options);
  const status=await exec(client,"printf 'BOOT/INPUT STATUS\\n'; uptime; df -h /home/root /media/developer; ls -l /var/lib/webosbrew/init.d/40-gathin-home /var/lib/webosbrew/init.d/41-gathin-home-keyhook 2>/dev/null; ps -ef | grep '[g]athin-home' || true; test ! -e /home/root/DISABLE-GATHIN-HOME && echo HOME_enabled || echo HOME_disabled; tail -12 /tmp/gathin-home-input-relay.log 2>/dev/null || true");
  const foreground=await luna(client,'com.webos.applicationManager/getForegroundAppInfo');
  const result={device:device.info,foreground,launcher:device.apps.find(app=>app.id===profile.appId)?.version||'not installed',apps:profile.thirdPartyApps.map(id=>({id,installed:device.apps.some(app=>app.id===id)}))};
  console.log(JSON.stringify(result,null,2)+'\n'+status);
  return result;
}

async function backup(client,options){
  const device=await inspect(client,options);
  return require('../lib/recovery').capture(client,options,device);
}

const stopHook="if [ -f /tmp/gathin-home-keyhook.pid ]; then p=$(cat /tmp/gathin-home-keyhook.pid); case \"$p\" in ''|*[!0-9]*) exit 1;; esac; if [ -r /proc/$p/cmdline ] && tr '\\000' ' ' < /proc/$p/cmdline | grep -F '/home/root/gathin-home-keyhook.py' >/dev/null; then kill -TERM \"$p\"; n=0; while kill -0 \"$p\" 2>/dev/null; do n=$((n+1)); [ \"$n\" -lt 30 ] || exit 1; /bin/usleep 100000; done; fi; fi";

async function runningHook(client){
  return exec(client,"p=$(cat /tmp/gathin-home-keyhook.pid 2>/dev/null) && test -n \"$p\" && test -r /proc/$p/cmdline && tr '\\000' ' ' < /proc/$p/cmdline | grep -F '/home/root/gathin-home-keyhook.py'");
}

async function startHook(client){
  await exec(client,'/var/lib/webosbrew/init.d/41-gathin-home-keyhook');
  // The script can wait up to ten seconds for a held key to be released.
  await exec(client,'sleep 11');
  await runningHook(client);
  const log=await exec(client,'tail -8 /tmp/gathin-home-input-relay.log');
  console.log(log);
}

async function syncApps(client,options){
  const {apps}=await inspect(client,options);
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'payload/app/apps.js'),'utf8'),context,{timeout:1000});
  const baseline=context.window.TV_APPS;
  const installed=new Set(apps.map(app=>app.id));
  const selected=baseline.apps.filter(app=>installed.has(app.id));
  const data=Buffer.from('window.TV_APPS = '+JSON.stringify({...baseline,apps:selected},null,1)+';\n');
  console.log(`Sync baseline tiles: ${selected.length}/${baseline.apps.length} installed apps; absent apps excluded.`);
  if(options.dryRun)return;
  const remote='/media/developer/apps/usr/palm/applications/'+profile.appId+'/apps.js';
  await exec(client,'test -f '+quote(path.posix.dirname(remote)+'/appinfo.json'));
  await exec(client,'cat > '+quote(remote+'.new')+' && chmod 644 '+quote(remote+'.new')+' && mv '+quote(remote+'.new')+' '+quote(remote),{input:data});
  console.log('App tiles updated; changes apply on the next normal launcher load.');
}

async function restorePrivacy(client){
  const app='/media/developer/apps/usr/palm/applications/ooo.lew.lifesgoodwithoutspying';
  await exec(client,'test -x '+quote(app+'/init/nospy-apply.sh'));
  await upload(client,path.join(root,'payload/privacy/lifesgoodwithoutspying.conf'),'/tmp/sk8000-recovery-privacy.conf');
  await exec(client,'cp /tmp/sk8000-recovery-privacy.conf /var/lib/webosbrew/lifesgoodwithoutspying.conf && chmod 644 /var/lib/webosbrew/lifesgoodwithoutspying.conf && ln -sfn '+quote(app+'/init/nospy-apply.sh')+' /var/lib/webosbrew/init.d/50-lifesgoodwithoutspying && '+quote(app+'/init/nospy-apply.sh'),{timeout:90000});
  await exec(client,'rm -f /tmp/sk8000-recovery-privacy.conf');
}

async function restore(client,options){
  if(options.removeExtraApps&&!options.dryRun)throw Error('Uninstalling unrelated apps is blocked in snapshot-protected setup. Their app data is outside the recovery scope.');
  verify();
  const device=await inspect(client,options);const {info,apps}=device;
  if(device.compatibility||options.compatibilityMode)return require('../lib/rooted-compat').install(client,options,device);
  if(options.privacy&&!apps.some(app=>app.id==='ooo.lew.lifesgoodwithoutspying'))throw new Error('Install Life’s Good Without Spying from Homebrew Channel before --privacy.');
  const plan={device:info,app:`${profile.appId} ${profile.appVersion}`,steps:['back up current project files to PC','install launcher through LG appInstallService','install validated HOME relay and boot hooks','sync installed baseline app tiles',...(options.privacy?['restore privacy app configuration']:[]),'start hook and verify process'],reboot:false};
  console.log(JSON.stringify(plan,null,2));
  if(options.dryRun){console.log('Dry run complete: no TV files, apps or settings changed.');return;}
  await backup(client,options);
  const stage='/tmp/sk8000-recovery-stage';
  const packageFile=path.join(root,'packages',`${profile.appId}_${profile.appVersion}_all.ipk`);
  const remotePackage='/media/developer/temp/sk8000-recovery.ipk';
  let paused=false,complete=false;
  const wasDisabled=(await exec(client,'test -e /home/root/DISABLE-GATHIN-HOME && echo yes || echo no')).trim()==='yes';
  try{
    // Probe is read-only except a harmless SYN_REPORT; no key is grabbed.
    await upload(client,path.join(root,'payload/home/home-keyhook.py'),stage+'/home-keyhook.py');
    await exec(client,'python '+quote(stage+'/home-keyhook.py')+' --probe',{timeout:20000});
    await upload(client,packageFile,remotePackage);
    require('../lib/recovery').markMutation(options,'launcher installation');
    paused=true;
    await exec(client,'touch /home/root/DISABLE-GATHIN-HOME && '+stopHook);
    if(options.advanced)await require('../lib/launcher-install').pause(client);
    await require('../lib/launcher-install').install(client,options,apps,remotePackage);
    const result=await luna(client,'com.webos.applicationManager/listApps');
    if(!result.apps.some(app=>app.id===profile.appId&&app.version===profile.appVersion))throw new Error('Launcher installation could not be verified');
    await upload(client,path.join(root,'payload/home/boot.sh'),'/home/root/gathin-home-replacement/boot.sh','755');
    await upload(client,path.join(root,'payload/home/launch.sh'),'/home/root/gathin-home-launch.sh','755');
    await upload(client,path.join(root,'payload/home/home-keyhook.py'),'/home/root/gathin-home-keyhook.py','755');
    await upload(client,path.join(root,'payload/home/41-gathin-home-keyhook'),stage+'/41-gathin-home-keyhook','755');
    await upload(client,path.join(root,'payload/home/disable-home.sh'),'/home/root/disable-gathin-home.sh','755');
    await exec(client,"python -c 'compile(open(\"/home/root/gathin-home-keyhook.py\").read(),\"home-keyhook.py\",\"exec\")' && sh -n /home/root/gathin-home-replacement/boot.sh && sh -n /home/root/gathin-home-launch.sh && sh -n "+quote(stage+'/41-gathin-home-keyhook'));
    await exec(client,'cp '+quote(stage+'/41-gathin-home-keyhook')+' /var/lib/webosbrew/init.d/41-gathin-home-keyhook && chmod 755 /var/lib/webosbrew/init.d/41-gathin-home-keyhook && ln -sfn /home/root/gathin-home-replacement/boot.sh /var/lib/webosbrew/init.d/40-gathin-home');
    await syncApps(client,options);
    if(options.privacy)await restorePrivacy(client);
    if(options.advanced)await require('../lib/advanced').installAdvanced(client,options);
    if(options.advanced)await require('../lib/runtime-health').verify(client);
    await exec(client,'rm -f /home/root/DISABLE-GATHIN-HOME');
    await startHook(client);
    await luna(client,'com.webos.applicationManager/closeByAppId',{id:profile.appId}).catch(()=>{});
    await luna(client,'com.webos.applicationManager/launch',{id:profile.appId});
    await require('../lib/launcher-install').finish(client);
    complete=true;
    console.log('Restore complete. Hooks will run on boot; no reboot or forced HDMI transition performed.');
  }finally{
    await exec(client,'rm -f '+quote(remotePackage)+' '+quote(stage+'/home-keyhook.py')+' '+quote(stage+'/41-gathin-home-keyhook')+'; rmdir '+quote(stage)+' 2>/dev/null || true').catch(error=>console.error('Temporary file cleanup: '+error.message));
    if(paused&&!complete){
      await exec(client,'touch /home/root/DISABLE-GATHIN-HOME').catch(()=>{});
      console.error('Restore incomplete; HOME interception remains disabled so LG input stays available. Use the saved PC backup or rerun restore after fixing the error.');
    }else if(!complete&&!wasDisabled){
      console.error('Restore stopped before changing HOME hooks.');
    }
  }
}

async function main(argv=process.argv.slice(2)){
  const {command,options}=parse(argv);
  if(command==='help'){
    console.log('node scripts/tv.js doctor|backup|restore|sync-apps|disable|enable|reboot [--host IP] [--key PATH] [--trust-new-host]\nrestore: [--dry-run] [--privacy] [--allow-firmware-mismatch]\nPasswords are prompted without echo; never saved. Read README.md before reset/root.');return;
  }
  const client=await connect(options);
  try{
    if(command==='doctor')await doctor(client,options);
    else if(command==='backup')await backup(client,{...options,backupOnly:true});
    else if(command==='restore')await restore(client,options);
    else if(command==='sync-apps'){verify();if(!options.dryRun)await backup(client,options);await syncApps(client,options);}
    else if(command==='disable'){await inspect(client,options);await exec(client,'touch /home/root/DISABLE-GATHIN-HOME && '+stopHook);console.log('HOME interception disabled; stock LG remote input restored.');}
    else if(command==='enable'){await inspect(client,options);await exec(client,'test -x /home/root/gathin-home-keyhook.py && rm -f /home/root/DISABLE-GATHIN-HOME');await startHook(client);}
    else if(command==='reboot'){await inspect(client,options);await exec(client,"sync; (sleep 1; reboot) </dev/null >/dev/null 2>&1 &");console.log('Reboot scheduled. Wait about one minute, then run doctor.');}
  }finally{client.end();}
}
module.exports={parse,inspect,restore,doctor,backup,syncApps,main};
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
