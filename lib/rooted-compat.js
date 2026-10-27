'use strict';
// Already-rooted TVs: probe features, never replay a rooting exploit or import reference tuning.
const fs=require('node:fs'),path=require('node:path');
const {root,state,profile,quote,sha256}=require('./local');const {exec,luna,archive,installPackage}=require('./ssh');
const APP='/media/developer/apps/usr/palm/applications/com.gathin.tvhome',STAGE='/tmp/gathin-compatible-setup';
function summarize(probes){
 const python2=probes.pythonMajor===2,pythonInput=python2&&probes.eventSize===16;
 const node=/^v(?:0\.(?:1[2-9]|[2-9]\d)|[1-9]\d*)\./.test(probes.nodeVersion||'');
 const home=pythonInput&&probes.homeChannels&&probes.homeProbe===true&&probes.startup;
 return {launcher:true,nodeServices:node&&probes.startup,controls:python2&&probes.startup,homeRelay:!!home,voice:!!(python2&&probes.voiceAgent&&probes.youtubeVersion==='0.5.3'&&probes.startup),startup:!!probes.startup,python2,nodeVersion:probes.nodeVersion||null};
}
async function detect(client,apps){
 async function read(command,fallback=''){try{return (await exec(client,command,{timeout:12000})).trim();}catch{return fallback;}}
 const probes={};probes.nodeVersion=await read('node --version');
 const py=await read("python -c 'import sys,struct,json,hashlib; print(json.dumps([sys.version_info[0],struct.calcsize(\"llHHi\")]))'");try{[probes.pythonMajor,probes.eventSize]=JSON.parse(py);}catch{}
 const devices=await read('cat /proc/bus/input/devices');probes.homeChannels=[profile.sourceDeviceName,profile.targetDeviceName].every(n=>devices.includes('Name="'+n+'"'));
 probes.startup=(await read('test -x /var/lib/webosbrew/startup.sh && test -d /var/lib/webosbrew/init.d && echo YES'))==='YES';
 probes.voiceAgent=(await read('test -f /usr/palm/applications/com.webos.app.voiceagent/Main.qml && echo YES'))==='YES';
 probes.youtubeVersion=(apps.find(a=>a.id==='youtube.leanback.v4')||{}).version||null;
 return {probes,features:summarize(probes)};
}
async function put(client,file,target,mode='644'){
 if(!target.startsWith(STAGE+'/'))throw Error('Unexpected compatibility staging path');
 const bytes=fs.readFileSync(file);await exec(client,'mkdir -p '+quote(path.posix.dirname(target))+' && cat > '+quote(target)+' && chmod '+mode+' '+quote(target),{input:bytes});
 // No Python/SFTP dependency for core upload on other rooted TV architectures.
 const digest=await exec(client,'sha256sum '+quote(target));if(digest.split(/\s/)[0]!==sha256(bytes))throw Error('Compatibility upload hash mismatch');
}
async function backup(client,options){
 const candidates=[APP,'/var/lib/webosbrew/gathin-controls','/var/lib/webosbrew/gathin-wallpaper','/var/lib/webosbrew/gathin-remote','/home/root/gathin-home-keyhook.py','/var/lib/webosbrew/init.d/40-gathin-home','/var/lib/webosbrew/init.d/41-gathin-home-keyhook'];
 const command=candidates.map(p=>'if [ -e '+quote(p)+' ]; then printf '+quote('%s\n')+' '+quote(p)+'; fi').join('\n');
 const files=(await exec(client,command)).trim().split(/\r?\n/).filter(Boolean);const folder=path.join(state,'backups','compatible-'+Date.now());fs.mkdirSync(folder,{recursive:true});
 if(files.length){const saved=await archive(client,files,path.join(folder,'before-compatible-restore.tar.gz'));console.log('Private backup: '+saved.file);}return folder;
}
async function install(client,options,device){
 if(options.backupFile)throw Error('Owner/reference backup cannot be transplanted to a different TV model; use the portable payload.');
 if(!options.dryRun)await backup(client,options);
 let {apps}=device;const {info}=device;let appReport=[];if(!options.dryRun){const ensured=await require('./post-install').ensureApps(client,options);apps=ensured.apps;appReport=ensured.report;}const caps=await detect(client,apps);const folder=path.join(state,'compatibility');fs.mkdirSync(folder,{recursive:true});
 if(caps.probes.pythonMajor===2&&caps.probes.eventSize===16&&caps.probes.homeChannels&&caps.probes.startup&&!options.dryRun){
  // Probe opens existing descriptors but never grabs a remote or sends a key.
  await put(client,path.join(root,'payload/home/home-keyhook.py'),STAGE+'/home-probe.py','755');
  try{await exec(client,'python '+quote(STAGE+'/home-probe.py')+' --probe',{timeout:20000});caps.probes.homeProbe=true;}catch(e){console.log('HOME relay unavailable; native HOME retained: '+e.message);}caps.features=summarize(caps.probes);
 }
 const report={device:info,features:caps.features,probes:caps.probes,referenceTuning:false};fs.writeFileSync(path.join(folder,sha256(Buffer.from(options.host||'tv')).slice(0,16)+'.json'),JSON.stringify(report,null,2));console.log('COMPATIBILITY REPORT\n'+JSON.stringify(report,null,2));
 console.log('Reference-TV debloat/privacy, firmware-specific patches and arbitrary app removal are skipped on this model.');
 if(options.dryRun){console.log('Read-only compatibility report complete. No installation, input grab or reboot performed.');return report;}
 const packageFile=path.join(root,'packages',profile.appId+'_'+profile.appVersion+'_all.ipk');await put(client,packageFile,STAGE+'/launcher.ipk');await installPackage(client,STAGE+'/launcher.ipk');
 await require('../scripts/tv').syncApps(client,options);
 const map=JSON.parse(fs.readFileSync(path.join(root,'payload/advanced/map.json')));let selected=[];
 if(caps.features.nodeServices)selected.push(...map.filter(x=>x.remote.includes('/gathin-wallpaper/')||x.remote.includes('/gathin-remote/')||/\/(39-gathin-wallpaper|45-gathin-remote)$/.test(x.remote)));
 if(caps.features.controls)selected.push(...map.filter(x=>x.remote.includes('/gathin-controls/')||x.remote.endsWith('/38-gathin-controls')));
 if(caps.features.voice)selected.push(...map.filter(x=>x.remote.includes('/gathin-youtube-voice/')||x.remote==='/home/root/gathin-youtube-voice-router.py'||/\/(42-gathin-youtube-voice|43-gathin-voice-results)$/.test(x.remote)||x.remote.includes('/youtube.leanback.v4/')));
 if(caps.features.homeRelay)selected.push(...[['payload/home/home-keyhook.py','/home/root/gathin-home-keyhook.py'],['payload/home/launch.sh','/home/root/gathin-home-launch.sh'],['payload/home/compatible-boot.sh','/home/root/gathin-home-replacement/boot.sh'],['payload/home/41-gathin-home-keyhook','/var/lib/webosbrew/init.d/41-gathin-home-keyhook']].map(x=>({local:x[0],remote:x[1]})));
 const staged=[];for(let i=0;i<selected.length;i++){const entry=selected[i],mode=entry.remote.endsWith('.py')||entry.remote.endsWith('.sh')||entry.remote.includes('/init.d/')?'755':'644';let file=path.join(root,entry.local);if(entry.remote.endsWith('/bridge.py')&&!caps.features.homeRelay){const rewritten=path.join(folder,'bridge-compatible.py');fs.writeFileSync(rewritten,fs.readFileSync(file,'utf8').replace(' thread.start_new_thread(watch_stock_home,())',' # Native HOME preserved: relay was not validated on this TV.'));file=rewritten;}const stage=STAGE+'/files/'+i;await put(client,file,stage,mode);staged.push({...entry,stage,mode});}
 // Stop only Gathin processes whose exact script path will be replaced.
 if(caps.features.nodeServices||caps.features.controls){const scripts=selected.filter(x=>/\.(js|py)$/.test(x.remote)).map(x=>x.remote);const js="var fs=require('fs'),targets="+JSON.stringify(scripts)+";fs.readdirSync('/proc').forEach(function(p){if(!/^[0-9]+$/.test(p))return;try{var a=fs.readFileSync('/proc/'+p+'/cmdline','utf8').split(String.fromCharCode(0));if(a.length>1&&targets.indexOf(a[1])>=0)process.kill(Number(p),'SIGTERM');}catch(e){}});";
  if(caps.features.nodeServices)await exec(client,'node -e '+quote(js));else if(caps.features.python2){const py='import os,signal\npaths='+JSON.stringify(scripts)+'\nfor p in os.listdir("/proc"):\n if not p.isdigit():continue\n try:\n  a=open("/proc/"+p+"/cmdline").read().split(chr(0))\n  if len(a)>1 and a[1] in paths:os.kill(int(p),signal.SIGTERM)\n except IOError:pass\n except OSError:pass';await exec(client,'python -c '+quote(py));}
 }
 for(const entry of staged)await exec(client,'mkdir -p '+quote(path.posix.dirname(entry.remote))+' && cp '+quote(entry.stage)+' '+quote(entry.remote)+' && chmod '+entry.mode+' '+quote(entry.remote));
 if(caps.features.controls){const token=require('node:crypto').randomBytes(32).toString('hex'),localToken=path.join(folder,'control-token.js');fs.writeFileSync(localToken,'window.GATHIN_CONTROL_TOKEN='+JSON.stringify(token)+';\n');await put(client,localToken,STAGE+'/control-token.js');await exec(client,'printf '+quote('%s')+' '+quote(token)+' > /var/lib/webosbrew/gathin-controls/bridge.token && chmod 600 /var/lib/webosbrew/gathin-controls/bridge.token && cp '+quote(STAGE+'/control-token.js')+' '+quote(APP+'/control-token.js'));fs.unlinkSync(localToken);}
 if(caps.features.homeRelay){await exec(client,'rm -f /home/root/DISABLE-GATHIN-HOME && ln -sfn /home/root/gathin-home-replacement/boot.sh /var/lib/webosbrew/init.d/40-gathin-home');}
 const hooks=['38-gathin-controls','39-gathin-wallpaper','41-gathin-home-keyhook','42-gathin-youtube-voice','43-gathin-voice-results','45-gathin-remote'];
 for(const hook of hooks)if(selected.some(x=>x.remote.endsWith('/'+hook))){await exec(client,quote('/var/lib/webosbrew/init.d/'+hook),{timeout:45000});}
 await luna(client,'com.webos.applicationManager/closeByAppId',{id:profile.appId}).catch(()=>{});await luna(client,'com.webos.applicationManager/launch',{id:profile.appId});
 await exec(client,'rm -f '+quote(STAGE+'/launcher.ipk')+' '+quote(STAGE+'/home-probe.py')+' '+quote(STAGE+'/control-token.js')+' '+staged.map(x=>quote(x.stage)).join(' '));
 await require('./post-install').checkFeatures(client,options,appReport);console.log('Compatible rooted-TV installation complete. No exploit, firmware change, forced reboot or reference-only debloat applied.');if(!caps.features.homeRelay)console.log('Native HOME retained. Open GathinTV from the LG app list.');if(!caps.features.voice)console.log('Voice routing skipped: requires compatible Python 2 Voice Agent and YouTube AdFree 0.5.3.');return report;
}
module.exports={summarize,detect,install};
