'use strict';
const fs=require('node:fs'),path=require('node:path');
const {root,state,quote}=require('./local'),ssh=require('./ssh'),cap=require('./tv-capabilities');
const SCRIPT='/home/root/gathin-home-keyhook.py',HOOK='/var/lib/webosbrew/init.d/41-gathin-home-keyhook',MARKER='/home/root/DISABLE-GATHIN-HOME',STAGE='/tmp/gathin-home-relay-setup';
async function install(client,options={},caps){
 caps=caps||await cap.probe(client);
 const native=!cap.pythonHomeCandidate(caps)&&client.__gathinNativeInput, script=native?native.path:SCRIPT;
 if(!cap.pythonHomeCandidate(caps)&&!(native&&caps.root&&caps.startup&&caps.homeChannels))return {feature:'home-relay',status:'needs-attention',detail:'Needs root, Homebrew startup, a verified input ABI backend and dual Magic Remote channels; inspect the input devices and dependency report.'};
 if(options.dryRun)return {feature:'home-relay',status:'manual-check-required',detail:'Capability candidate; dry run does not probe input, upload or grab devices.'};
 require('./recovery').markMutation(options,'HOME relay input preflight');
 const folder=fs.mkdtempSync(path.join(state,'home-relay-'));let promoted=false;
 try{
  if(!native)await ssh.upload(client,path.join(root,'payload/home/home-keyhook.py'),STAGE+'/home-keyhook.py','755');
  // No EVIOCGRAB during probe. Match device capabilities and compositor fd first.
  await ssh.exec(client,(native?quote(native.path):quote(caps.python2)+' '+quote(STAGE+'/home-keyhook.py'))+' --probe',{timeout:20000});
  const hook=path.join(folder,'41-gathin-home-keyhook');let body=fs.readFileSync(path.join(root,'payload/home/41-gathin-home-keyhook'),'utf8');body=native?body.replace(SCRIPT,native.path).replace('/usr/bin/python "$SCRIPT"','"$SCRIPT" --home'):body.replace('/usr/bin/python ',quote(caps.python2)+' ');fs.writeFileSync(hook,body);
  await ssh.upload(client,hook,STAGE+'/41-gathin-home-keyhook','755');
  await ssh.exec(client,'sh -n '+quote(STAGE+'/41-gathin-home-keyhook')+(native?'':' && cp '+quote(STAGE+'/home-keyhook.py')+' '+quote(SCRIPT)+' && chmod 755 '+quote(SCRIPT))+' && cp '+quote(STAGE+'/41-gathin-home-keyhook')+' '+quote(HOOK)+' && chmod 755 '+quote(HOOK));
  promoted=true;
  await ssh.exec(client,'rm -f '+quote(MARKER)+" /tmp/gathin-home-keyhook.ready && "+quote(HOOK));
  const active=await ssh.exec(client,"i=0; while [ \"$i\" -lt 12 ]; do p=$(cat /tmp/gathin-home-keyhook.pid 2>/dev/null); r=$(cat /tmp/gathin-home-keyhook.ready 2>/dev/null); case \"$p\" in ''|*[!0-9]*) p=invalid;; esac; if [ \"$p\" = \"$r\" ] && [ -r /proc/$p/cmdline ]; then tr '\\000' ' ' < /proc/$p/cmdline | grep -F "+quote(script)+" && exit 0; fi; sleep 1; i=$((i+1)); done; exit 1",{timeout:16000});
  if(!active.includes(script))throw Error('HOME relay did not remain active');
  client.__gathinHomeRelay={active:true};
  console.log('HOME relay ACTIVE: input/compositor probe passed; verify physical HOME/Back/pointer on this TV.');
  return {feature:'home-relay',status:'verified',detail:'Input/compositor preflight and active process verified. Physical HOME/Back/pointer still need testing.'};
 }catch(e){
  if(promoted)await ssh.exec(client,'touch '+quote(MARKER)).catch(()=>{});
  client.__gathinHomeRelay={active:false,reason:e.message};
  console.log('HOME relay not enabled: '+e.message+'. Native LG input retained; release held buttons/check Magic Remote channels and retry Restore.');
  return {feature:'home-relay',status:'needs-attention',detail:e.message};
 }finally{
  await ssh.exec(client,'rm -f '+quote(STAGE+'/home-keyhook.py')+' '+quote(STAGE+'/41-gathin-home-keyhook')).catch(()=>{});
  fs.rmSync(folder,{recursive:true,force:true});
 }
}
module.exports={install};
