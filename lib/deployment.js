'use strict';
const fs=require('fs'),path=require('path'),{root,sha256,walk,profile}=require('./local'),ROOTS=require('../config/recovery-roots.json');
const DIRECTORIES=new Set(ROOTS.filter(r=>r==='/media/developer/apps/usr/palm/applications/com.gathin.tvhome'||r.startsWith('/media/developer/temp/')||['/home/root/gathin-home-replacement','/home/root/gathin-lgws'].includes(r)||(/^\/var\/lib\/(webosbrew\/gathin-|webos-debloat\/)/.test(r)&&!r.endsWith('.conf'))));
function destination(remote){
 if(typeof remote!=='string'||!remote.startsWith('/')||/[\x00-\x1f\x7f\\]/.test(remote)||path.posix.normalize(remote)!==remote||remote.split('/').some(s=>s==='.'||s==='..'))throw Error('Unexpected upload destination: noncanonical path');
 const managed=ROOTS.find(r=>remote===r||(DIRECTORIES.has(r)&&remote.startsWith(r+'/')));
 if(managed)return managed;
 if(/^\/(tmp|media\/developer\/temp)\/[^/]/.test(remote))return 'staging';
 throw Error('Unexpected upload destination outside recovery roots');
}
function entry(source,remote,mode='644',runtime='data',generated=false){const recoveryRoot=destination(remote);if(!/^[0-7]{3,4}$/.test(mode))throw Error('Invalid deployment mode');const bytes=fs.readFileSync(path.join(root,source));return {source,remote,mode,runtime,recoveryRoot,...(generated?{generatorSha256:sha256(bytes)}:{sha256:sha256(bytes)}),generated};}
function plan(caps,options={}){
 const entries=[];for(const file of walk(path.join(root,'payload/app'))){const source=path.relative(root,file).split(path.sep).join('/');entries.push(entry(source,'/media/developer/apps/usr/palm/applications/com.gathin.tvhome/'+source.slice('payload/app/'.length),'644','app'));}
 const map=JSON.parse(fs.readFileSync(path.join(root,'payload/advanced/map.json')));for(const e of map.filter(x=>x.remote.includes('/gathin-wallpaper/')||x.remote.includes('/gathin-remote/')||/\/(39-gathin-wallpaper|45-gathin-remote)$/.test(x.remote)))entries.push(entry(e.local,e.remote,e.remote.includes('/init.d/')?'755':'644','node'));
 for(const [source,remote,runtime]of [['payload/portable/controls.js','/var/lib/webosbrew/gathin-controls/bridge.js','node'],['payload/portable/hdmi.js','/var/lib/webosbrew/gathin-hdmi/track.js','node'],['payload/portable/voice.js','/var/lib/webosbrew/gathin-youtube-voice/voice.js','node'],['payload/portable/maintenance.js','/var/lib/webos-debloat/gathin-final/maintenance.js','node'],['payload/home/home-keyhook.py','/home/root/gathin-home-keyhook.py','python-input'],['config/setup-policy.json','/var/lib/webos-debloat/gathin-final/policy.json','data'],['payload/advanced/youtube-userScript.js','/media/developer/apps/usr/palm/applications/youtube.leanback.v4/webOSUserScripts/userScript.js','app']])entries.push(entry(source,remote,source.endsWith('.py')?'755':'644',runtime,source==='config/setup-policy.json'));
 for(const dir of ['gathin-controls','gathin-hdmi','gathin-youtube-voice'])entries.push(entry('payload/portable/inputs.js','/var/lib/webosbrew/'+dir+'/inputs.js'));
 if(caps.python2||caps.python3)entries.push(entry('payload/home/observe-home.py','/home/root/gathin-home-replacement/observe-home.py','755','python-observer'));
 const native=require('./native-runtime').asset(caps);if(native)entries.push(entry(path.relative(root,native.file),'/var/lib/webosbrew/gathin-controls/input-helper','755','static-'+native.arch));
 for(const remote of ['/home/root/gathin-home-replacement/observer.sh','/home/root/gathin-home-launch.sh','/home/root/gathin-home-replacement/boot.sh','/var/lib/webosbrew/init.d/40-gathin-home','/var/lib/webosbrew/init.d/42-gathin-youtube-voice','/var/lib/webosbrew/init.d/43-gathin-voice-results'])entries.push(entry('lib/full-features.js',remote,'755','shell',true));
 for(const name of ['35-gathin-debloat','50-lifesgoodwithoutspying'])entries.push(entry('lib/maintenance.js','/var/lib/webosbrew/init.d/'+name,'755','shell',true));
 for(const name of ['37-gathin-hdmi','38-gathin-controls'])entries.push(entry('lib/rooted-compat.js','/var/lib/webosbrew/init.d/'+name,'755','shell',true));
 entries.push(entry('lib/home-relay.js','/var/lib/webosbrew/init.d/41-gathin-home-keyhook','755','shell',true));
 for(const [source,remote,mode]of [['lib/app-runtime.js','/media/developer/apps/usr/palm/applications/com.gathin.tvhome/runtime-request.js','644'],['lib/full-features.js','/media/developer/apps/usr/palm/applications/com.gathin.tvhome/feature-flags.js','644'],['lib/rooted-compat.js','/var/lib/webosbrew/gathin-controls/bridge.token','600'],['lib/maintenance.js','/var/lib/webosbrew/lifesgoodwithoutspying.conf','600'],['lib/maintenance.js','/var/lib/webos-debloat/gathin-final/journal.json','600']]){const at=entries.findIndex(e=>e.remote===remote);if(at>=0)entries.splice(at,1);entries.push(entry(source,remote,mode,'generated-config',true));}
 entries.push(entry('lib/rooted-compat.js','/media/developer/apps/usr/palm/applications/com.gathin.tvhome/control-token.js','644','app-config',true));
 return {format:1,modelIndependent:true,entries,notes:['Generated artifact digests are verified by upload before atomic promotion; generator digests identify their source.']};
}
module.exports={destination,entry,plan};
