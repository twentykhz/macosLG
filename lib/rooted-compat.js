'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,profile,quote,sha256}=require('./local');const ssh=require('./ssh'),capabilities=require('./tv-capabilities');
const APP='/media/developer/apps/usr/palm/applications/com.gathin.tvhome',STAGE='/tmp/gathin-compatible-setup';
function summarize(p){
 const services=!!(p.nodeFiles&&p.startup),reference=capabilities.legacyHome(p,p.info||{});
 return {launcher:true,nodeServices:services,hdmi:services,controls:services,homeRelay:reference&&p.homeProbe===true,voice:reference&&p.homeProbe===true&&p.voiceAgent&&p.youtubeVersion==='0.5.3',voiceBasic:services&&!!p.nativeVoice,backup:!!p.root&&!!p.tar,rollback:!!p.root&&!!p.tar&&!!p.hash&&(!!p.nodeFiles||!!p.pythonRecovery),startup:!!p.startup,python2:!!p.python2,nodeVersion:p.nodeVersion||null,referenceTuning:reference};
}
function printCapabilities(caps,info={}){
 console.log('COMPATIBILITY CAPABILITIES\n'+JSON.stringify({TV:info,architecture:caps.arch,Root:caps.root,Node:caps.node,Python:caps.python,Python2:caps.python2,Python3:caps.python3,SHA256:caps.hash?.kind||null,TAR:caps.tar,HomebrewStartup:caps.startup},null,2));
 if(!caps.python2&&!caps.python3)console.log('Python is not available on this TV. Using the Python-free compatibility path.');
 if(!capabilities.legacyHome(caps,info))console.log('SKIPPED native HOME interception and reference voice/tuning: require the verified ARM32/Python2 reference profile.');
}
async function detect(client,apps=[],info={}){const caps=await capabilities.probe(client);const probes={...caps,info,homebrew:apps.some(a=>a.id==='org.webosbrew.hbchannel'),youtubeVersion:apps.find(a=>a.id==='youtube.leanback.v4')?.version,nativeVoice:apps.some(a=>['com.webos.app.voice','com.webos.app.voiceagent'].includes(a.id))};return {probes,features:summarize(probes)};}
async function put(client,file,target,mode='644'){if(!target.startsWith(STAGE+'/'))throw Error('Unexpected compatibility staging path');return ssh.upload(client,file,target,mode);}
async function install(client,options,device){
 if(options.backupFile)throw Error('Owner/reference backup cannot be transplanted to a different TV model; use the portable payload.');
 const {info}=device;let {apps}=device;const caps=await detect(client,apps,info),features=caps.features;
 printCapabilities(caps.probes,info);const report={device:info,features,probes:caps.probes,referenceTuning:false};
 fs.mkdirSync(path.join(state,'compatibility'),{recursive:true});fs.writeFileSync(path.join(state,'compatibility',sha256(Buffer.from(options.host||'tv')).slice(0,16)+'.json'),JSON.stringify(report,null,2));
 if(options.dryRun){console.log('Read-only compatibility report complete. No installation, input grab or reboot performed.');return report;}
 if(!features.rollback||!caps.probes.hash||!caps.probes.tar)throw Error('Managed installation requires verified rollback, SHA-256 and tar. No project mutation performed.');
 client.__gathinPortableMode=!!caps.probes.nodeFiles;
 await require('./recovery').capture(client,options,device);
 // Do not auto-install the pinned ARM32 Homebrew service on an unknown ABI.
 const ensured=await require('./post-install').ensureApps(client,{...options,compatibilityMode:true});apps=ensured.apps;
 await put(client,path.join(root,'packages',profile.appId+'_'+profile.appVersion+'_all.ipk'),STAGE+'/launcher.ipk');
 require('./recovery').markMutation(options,'compatible launcher installation');
 await require('./launcher-install').pause(client);await require('./launcher-install').install(client,{...options,compatibilityMode:true},apps,STAGE+'/launcher.ipk');
 await require('../scripts/tv').syncApps(client,options);
 let selected=[];const map=JSON.parse(fs.readFileSync(path.join(root,'payload/advanced/map.json')));
 if(features.nodeServices){
  selected=map.filter(x=>x.remote.includes('/gathin-wallpaper/')||x.remote.includes('/gathin-remote/')||/\/(39-gathin-wallpaper|45-gathin-remote)$/.test(x.remote));
  selected.push({local:'payload/portable/controls.js',remote:'/var/lib/webosbrew/gathin-controls/bridge.js'},{local:'payload/portable/hdmi.js',remote:'/var/lib/webosbrew/gathin-hdmi/track.js'});
 }
 const temp=fs.mkdtempSync(path.join(state,'compat-stage-'));
 try{
  for(let i=0;i<selected.length;i++){const e=selected[i],staged=STAGE+'/files/'+i;let file=path.join(root,e.local);if(e.remote.includes('/init.d/')){file=path.join(temp,'hook-'+i);fs.writeFileSync(file,fs.readFileSync(path.join(root,e.local),'utf8').replaceAll('/usr/bin/node',quote(caps.probes.node)));}await put(client,file,staged,e.remote.includes('/init.d/')?'755':'644');await ssh.exec(client,'mkdir -p '+quote(path.posix.dirname(e.remote))+' && cp '+quote(staged)+' '+quote(e.remote)+' && chmod '+(e.remote.includes('/init.d/')?'755':'644')+' '+quote(e.remote));}
  if(features.nodeServices){
   for(const [name,script,pid]of [['38-gathin-controls','/var/lib/webosbrew/gathin-controls/bridge.js','bridge.pid'],['37-gathin-hdmi','/var/lib/webosbrew/gathin-hdmi/track.js','track.pid']]){
    const directory=path.posix.dirname(script),disabled=name.startsWith('38')?'CONTROLS':'HDMI';
    const body=`#!/bin/sh
[ -f /home/root/DISABLE-GATHIN-${disabled} ] && exit 0
root=${quote(directory)}
if [ -f "$root/${pid}" ]; then
 p=$(cat "$root/${pid}")
 case "$p" in ''|*[!0-9]*) p=invalid;; esac
 if [ -r "/proc/$p/cmdline" ] && tr '\\000' ' ' < "/proc/$p/cmdline" | grep -F ${quote(script)} >/dev/null; then exit 0; fi
fi
${quote(caps.probes.node)} ${quote(script)} >> "$root/server.log" 2>&1 </dev/null &
echo $! > "$root/${pid}"
`;
    const local=path.join(temp,name);fs.writeFileSync(local,body);await put(client,local,STAGE+'/'+name,'755');await ssh.exec(client,'cp '+quote(STAGE+'/'+name)+' '+quote('/var/lib/webosbrew/init.d/'+name)+' && chmod 755 '+quote('/var/lib/webosbrew/init.d/'+name));
   }
   const token=require('node:crypto').randomBytes(32).toString('hex'),file=path.join(temp,'control-token.js');fs.writeFileSync(file,'window.GATHIN_CONTROL_TOKEN='+JSON.stringify(token)+';\n',{mode:0o600});await put(client,file,STAGE+'/control-token.js');await ssh.exec(client,'umask 077; printf '+quote('%s')+' '+quote(token)+' > /var/lib/webosbrew/gathin-controls/bridge.token && chmod 600 /var/lib/webosbrew/gathin-controls/bridge.token && cp '+quote(STAGE+'/control-token.js')+' '+quote(APP+'/control-token.js'));
   await ssh.exec(client,'rm -f /home/root/DISABLE-GATHIN-CONTROLS /home/root/DISABLE-GATHIN-HDMI /home/root/DISABLE-GATHIN-WALLPAPER /home/root/DISABLE-GATHIN-REMOTE');
   for(const hook of ['37-gathin-hdmi','38-gathin-controls','39-gathin-wallpaper','45-gathin-remote'])await ssh.exec(client,quote('/var/lib/webosbrew/init.d/'+hook),{timeout:45000});
  }
  await require('./runtime-health').verify(client,{controls:features.controls,nodeServices:features.nodeServices});
  await ssh.luna(client,'com.webos.applicationManager/closeByAppId',{id:profile.appId}).catch(()=>{});await ssh.luna(client,'com.webos.applicationManager/launch',{id:profile.appId});
  await require('./launcher-install').finish(client);await require('./post-install').checkFeatures(client,options,ensured.report);
  console.log('Compatible installation complete. Native LG HOME and firmware/model-specific services retained.');return report;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={summarize,detect,install,printCapabilities};
