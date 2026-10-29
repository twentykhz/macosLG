'use strict';
const fs=require('fs'),path=require('path'),{root,state,quote}=require('./local'),ssh=require('./ssh');
async function install(client,options,caps,apps,info={}){
 const deviceProfile=require('./device-profile').resolve(info,caps);
 require('./recovery').markMutation(options,'model-independent startup and voice');
 const temp=fs.mkdtempSync(path.join(state,'full-features-'));
 async function put(name,body,target,mode='755'){const file=path.join(temp,name);fs.writeFileSync(file,body);await ssh.upload(client,file,target,mode);}
 try{
  await ssh.exec(client,'mkdir -p /home/root/gathin-home-replacement /var/lib/webosbrew/gathin-youtube-voice');
  await ssh.exec(client,'rm -f /home/root/gathin-home-replacement/disabled');
  const launch='#!/bin/sh\n[ -e /home/root/gathin-home-replacement/disabled ] && exit 0\nexec /usr/bin/luna-send -w 3000 -n 1 luna://com.webos.applicationManager/launch '+quote(JSON.stringify({id:'com.gathin.tvhome'}))+'\n';
  await put('launch.sh',launch,'/home/root/gathin-home-launch.sh');
  // Wait for SAM, launch once, then stop. Never steal foreground repeatedly.
  const boot=`#!/bin/sh
[ -e /home/root/gathin-home-replacement/disabled ] && exit 0
b=0
while [ "$b" -lt 20 ]; do
 status=$(/usr/bin/luna-send -w 1000 -n 1 luna://com.webos.bootManager/getBootStatus '{}' 2>/dev/null)
 printf '%s' "$status" | grep -q '"core-boot-done"[[:space:]]*:[[:space:]]*true' && break
 sleep 1
 b=$((b+1))
done
i=0
while [ "$i" -lt 45 ]; do
 [ -e /home/root/gathin-home-replacement/disabled ] && exit 0
 r=$(/usr/bin/luna-send -w 2000 -n 1 luna://com.webos.applicationManager/getAppInfo '{"id":"com.gathin.tvhome"}' 2>/dev/null)
 if printf '%s' "$r" | grep -q '"returnValue"[[:space:]]*:[[:space:]]*true'; then /home/root/gathin-home-launch.sh; exit $?; fi
 sleep 1
 i=$((i+1))
done
exit 1
`;
  await put('boot.sh',boot,'/home/root/gathin-home-replacement/boot.sh');
  await put('40-gathin-home','#!/bin/sh\n/home/root/gathin-home-replacement/boot.sh >> /tmp/gathin-home-boot.log 2>&1 </dev/null &\n','/var/lib/webosbrew/init.d/40-gathin-home');
  await put('feature-flags.js','window.MAC_WEBOSTV_FEATURES='+JSON.stringify({voiceRouter:deviceProfile.voiceRouter&&!!client.__gathinNativeInput,voiceReason:deviceProfile.voiceReason})+';\n','/media/developer/apps/usr/palm/applications/com.gathin.tvhome/feature-flags.js','644');
  if(deviceProfile.homeObserver){
   await ssh.upload(client,path.join(root,'payload/home/observe-home.py'),'/home/root/gathin-home-replacement/observe-home.py','755');
   await put('observer.sh','#!/bin/sh\n[ -e /home/root/gathin-home-replacement/disabled ] && exit 0\nPYTHONDONTWRITEBYTECODE=1 '+quote(deviceProfile.homeObserver)+' /home/root/gathin-home-replacement/observe-home.py >> /tmp/gathin-home-observer.log 2>&1 </dev/null &\n','/home/root/gathin-home-replacement/observer.sh');
   await put('40-gathin-home','#!/bin/sh\n/home/root/gathin-home-replacement/boot.sh >> /tmp/gathin-home-boot.log 2>&1 </dev/null &\n/home/root/gathin-home-replacement/observer.sh\n','/var/lib/webosbrew/init.d/40-gathin-home');
  }
  const report=[{feature:'launcher-startup',status:'installed',detail:'Asynchronous boot hook waits up to 45 attempts for app registration; physical cold boot test required.'}];
  if(client.__gathinNativeInput&&deviceProfile.voiceRouter){
   await ssh.exec(client,'command -v ls-monitor >/dev/null');
   await ssh.upload(client,path.join(root,'payload/portable/voice.js'),'/var/lib/webosbrew/gathin-youtube-voice/voice.js');
   const script='/var/lib/webosbrew/gathin-youtube-voice/voice.js';
   const hook='#!/bin/sh\n[ -e /home/root/DISABLE-GATHIN-YOUTUBE-VOICE ] && exit 0\nroot=/var/lib/webosbrew/gathin-youtube-voice\np=$(cat "$root/router.pid" 2>/dev/null)\ncase "$p" in ""|*[!0-9]*) p=invalid;; esac\nif [ -r /proc/$p/cmdline ] && tr "\\000" " " < /proc/$p/cmdline | grep -F '+quote(script)+' >/dev/null; then exit 0; fi\n'+quote(caps.node)+' '+quote(script)+' >> "$root/router.log" 2>&1 </dev/null &\necho $! > "$root/router.pid"\n';
   await put('42-gathin-youtube-voice',hook,'/var/lib/webosbrew/init.d/42-gathin-youtube-voice');
   // Disable obsolete Python/QML patch worker; Node consumes recognized native NLP results.
   await put('43-gathin-voice-results','#!/bin/sh\nexit 0\n','/var/lib/webosbrew/init.d/43-gathin-voice-results');
   const yt=apps.find(a=>a.id==='youtube.leanback.v4');
   if(yt?.version==='0.5.3'){
    const dest='/media/developer/apps/usr/palm/applications/youtube.leanback.v4/webOSUserScripts';await ssh.exec(client,'mkdir -p '+quote(dest));await ssh.upload(client,path.join(root,'payload/advanced/youtube-userScript.js'),dest+'/userScript.js');
   }
   await ssh.exec(client,'rm -f /home/root/DISABLE-GATHIN-YOUTUBE-VOICE && /var/lib/webosbrew/init.d/42-gathin-youtube-voice');
   report.push({feature:'voice-router',status:'installed',detail:'Portable Node NLP router: YouTube, apps, HDMI, volume, brightness and power. Physical recognition/permissions test required.'});
   try{const nlp=await ssh.luna(client,'com.webos.service.nlp/getNlpStatus',{});report.push({feature:'nlp-status',status:nlp.returnValue===true?'verified':'needs-attention',detail:nlp.returnValue===true?'Native NLP API responds; recognized speech still requires physical test.':'Native NLP status unavailable; inspect Homebrew Luna permissions and voice service.'});}catch(e){report.push({feature:'nlp-status',status:'needs-attention',detail:e.message});}
  }else{
   await put('42-gathin-youtube-voice','#!/bin/sh\n# Native voice is preserved; no unverified recognized-result router is started.\nexit 0\n','/var/lib/webosbrew/init.d/42-gathin-youtube-voice');
   report.push({feature:'voice-router',status:'manual-check-required',detail:deviceProfile.voiceRouter?'Verified PTY adapter missing; repair dependencies and rerun Restore.':deviceProfile.voiceReason});
  }
  return report;
 }finally{fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={install};
