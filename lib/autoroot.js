'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {utils}=require('ssh2');
const {root,state,profile,quote,sha256,verify,assertProfile,rootKeyFile:rootKeyPath}=require('./local');
const ssh=require('./ssh');
const {prepareAssets,configuration}=require('./assets');
const {restore,doctor}=require('../scripts/tv');
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));

function loadRootKey(host){
  const file=rootKeyPath(host);fs.mkdirSync(path.dirname(file),{recursive:true});
  if(!fs.existsSync(file)){
    const pair=crypto.generateKeyPairSync('rsa',{modulusLength:3072,privateKeyEncoding:{type:'pkcs1',format:'pem'},publicKeyEncoding:{type:'spki',format:'pem'}});
    fs.writeFileSync(file,pair.privateKey,{mode:0o600,flag:'wx'});
  }
  const privateKey=fs.readFileSync(file);const parsed=utils.parseKey(privateKey);
  if(parsed instanceof Error)throw parsed;
  return {file,privateKey,publicKey:parsed.type+' '+parsed.getPublicSSH().toString('base64')+' sk8000-recovery'};
}

async function publicLuna(client,url,payload={},timeout=30000){
  const text=await ssh.exec(client,'/usr/bin/luna-send-pub -n 1 '+quote('luna://'+url)+' '+quote(JSON.stringify(payload)),{timeout});
  let result;try{result=JSON.parse(text);}catch{throw new Error('Invalid public Luna response: '+url);}
  if(result.returnValue===false)throw new Error(url+': '+(result.errorText||JSON.stringify(result)));
  return result;
}

class AutorootSteps{
  constructor(options){
    this.options=options;this.client=null;this.devClient=null;this.rooted=false;
    this.folder=path.join(state,'bootstrap',sha256(Buffer.from(options.host)).slice(0,16));
    fs.mkdirSync(this.folder,{recursive:true});this.history=[];
  }
  mark(stage){
    this.history.push({stage,at:new Date().toISOString()});
    fs.writeFileSync(path.join(this.folder,'status.json'),JSON.stringify({host:this.options.host,history:this.history},null,2));
    console.log('\n['+this.history.length+'] '+stage);
  }
  async prepare(){
    this.mark('Verify recovery payload and pinned upstream assets');verify();
    this.assets=this.options.dryRun?{config:configuration(),files:{}}:await prepareAssets(this.options.noExtraApps);
  }
  async connectAndCheck(){
    this.mark('Connect, verify authentication and detect TV compatibility');
    const rootFile=this.options.rootKey||rootKeyPath(this.options.host);
    if(this.options.rootKey&&!fs.existsSync(rootFile))throw new Error('Root key file does not exist: '+rootFile);
    if(this.options.alreadyRooted){
      this.client=await ssh.connect({...this.options,port:22,username:'root',...(fs.existsSync(rootFile)?{key:rootFile}: {})});this.rooted=true;
    }else if(fs.existsSync(rootFile)){
      try{this.client=await ssh.connect({...this.options,port:22,username:'root',key:rootFile,readyTimeout:5000});this.rooted=true;}
      catch(error){if(/host key/i.test(error.message))throw error;console.log('Saved root key did not connect; checking Developer Mode.');}
    }
    if(!this.rooted){
      let privateKey;
      if(this.options.developerKey)privateKey=fs.readFileSync(path.resolve(this.options.developerKey));
      else{
        const url=new URL('http://'+this.options.host+':9991/webos_rsa');
        let response;
        try{response=await fetch(url,{signal:AbortSignal.timeout(10000)});}
        catch{throw new Error('Key Server is unavailable. In Developer Mode on the TV turn Key Server ON, then rerun.');}
        if(!response.ok)throw new Error('Developer Mode Key Server returned HTTP '+response.status);
        privateKey=Buffer.from(await response.arrayBuffer());
        if(privateKey.length>65536||!privateKey.toString().includes('PRIVATE KEY'))throw new Error('Invalid Developer Mode key response');
      }
      const passphrase=await ssh.secret('Developer Mode passphrase shown on TV (6 characters, hidden): ');
      if(passphrase.length!==6)throw new Error('Enter the exact six-character Developer Mode passphrase.');
      const parsed=utils.parseKey(privateKey,passphrase);if(parsed instanceof Error)throw new Error('Developer Mode key/passphrase could not be decrypted.');
      this.devClient=await ssh.connect({...this.options,port:9922,username:'prisoner',auth:{privateKey,passphrase}});
      this.client=this.devClient;
    }
    const uid=(await ssh.exec(this.client,'id -u')).trim();
    if(this.rooted&&uid!=='0')throw new Error('Root connection is not uid 0');
    if(!this.rooted&&uid==='0')throw new Error('Unexpected root on Developer Mode connection; use --already-rooted');
    const info=await publicLuna(this.client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
    if(!this.rooted)assertProfile(info);
    else if(info.modelName!==profile.modelName||info.boardType!==profile.boardType||info.firmwareVersion!==profile.firmwareVersion){this.options.compatibilityMode=true;console.log('Already-rooted TV: capability-based mode; model name is not a blocker.');}
    this.info=info;
    console.log(JSON.stringify(info,null,2));
  }
  isRooted(){return this.rooted;}
  async plan(){
    console.log(JSON.stringify({dryRun:true,upstream:this.assets.config.upstream,commit:this.assets.config.commit,rootAlreadyAvailable:this.rooted,steps:['get Developer Mode key and authenticate prisoner@9922','run checksum-pinned faultmanager-autoroot (only if not rooted)','verify uid 0 through Homebrew Channel','enable key-authenticated root SSH','remove and verify absence of LG Developer Mode before reboot','reboot and reconnect automatically',...(this.options.noExtraApps?[]:['install pinned YouTube AdFree, privacy app']),'restore MAC-WebOSTV, Home/Back, Action Center, voice commands, privacy and optional-service tuning','reboot and verify automatic launcher/relay startup']},null,2));
    console.log('Dry run finished. No exploit, TV upload, app removal, setting change or reboot performed.');
  }
  async runAutoroot(){
    this.mark('Run faultmanager-autoroot, keeping upstream version checks enabled');
    if(this.rooted)throw new Error('Refusing to rerun exploit on a rooted connection');
    this.remoteStage='/tmp/sk8000-faultmanager-'+crypto.randomBytes(6).toString('hex');
    await ssh.upload(this.devClient,this.assets.files[this.assets.config.autoroot.name],this.remoteStage+'/autoroot.sh');
    await ssh.upload(this.devClient,this.assets.files[this.assets.config.homebrew.name],this.remoteStage+'/hbchannel.ipk');
    const output=await ssh.exec(this.devClient,'sh '+quote(this.remoteStage+'/autoroot.sh'),{timeout:180000,onOutput:chunk=>process.stdout.write(chunk)});
    fs.writeFileSync(path.join(this.folder,'autoroot-console.log'),output);
    if(!/Payload complete/.test(output))throw new Error('Upstream did not report Payload complete; no reboot or subsequent installation attempted');
  }
  async rootExec(command){
    const response=await publicLuna(this.devClient,'org.webosbrew.hbchannel.service/exec',{command},60000);
    if(typeof response.stdoutString!=='string')throw new Error('Homebrew exec did not return command output');
    return response.stdoutString;
  }
  async verifyRootBridge(){
    this.mark('Verify Homebrew root bridge');
    const uid=(await this.rootExec('id -u')).trim();
    if(uid!=='0')throw new Error('Homebrew service is not running as root; stopped before SSH/removal/reboot');
  }
  async provisionRootSSH(){
    this.mark('Enable persistent root SSH and create a local recovery key');
    await publicLuna(this.devClient,'org.webosbrew.hbchannel.service/setConfiguration',{sshdEnabled:true,telnetDisabled:true});
    await publicLuna(this.devClient,'org.webosbrew.hbchannel.service/autostart',{});
    let ready=false;
    for(let n=0;n<60;n++){
      // Wait until Homebrew has configured the root account, before adding a key.
      const status=await this.rootExec('if [ -f /tmp/webosbrew_startup ] && [ ! -e /tmp/webosbrew_startup.lock ]; then echo READY; else echo WAIT; fi');
      if(status.trim()==='READY'){ready=true;break;}await pause(1000);
    }
    if(!ready)throw new Error('Homebrew startup did not finish; stopped before modifying root access');
    // autostart may have run earlier with SSH disabled; the persistent flag
    // alone does not start a daemon in that already-finished startup run.
    await this.rootExec('/media/developer/apps/usr/palm/services/org.webosbrew.hbchannel.service/bin/dropbear -R 2>/dev/null || true');
    this.rootKey=loadRootKey(this.options.host);
    const key=quote(this.rootKey.publicKey);
    await this.rootExec("umask 077; mkdir -p /home/root/.ssh; touch /home/root/.ssh/authorized_keys; grep -qxF "+key+" /home/root/.ssh/authorized_keys || printf '%s\\n' "+key+" >> /home/root/.ssh/authorized_keys; chmod 700 /home/root/.ssh; chmod 600 /home/root/.ssh/authorized_keys");
    console.log('Root key saved locally: '+this.rootKey.file+' (excluded from Git)');
  }
  async connectRoot(){
    this.mark('Connect directly to root SSH before removing Developer Mode');
    this.client=await ssh.connect({...this.options,port:22,username:'root',auth:{privateKey:this.rootKey.privateKey}});
    if((await ssh.exec(this.client,'id -u')).trim()!=='0')throw new Error('Root SSH verification failed');
    this.rooted=true;
    this.devClient.end();this.devClient=null;
  }
  async prepareRootReconnect(){
    this.mark('Verify recovery key authentication for unattended reconnect');
    if(!this.rootKey){
      if(this.options.rootKey){
        const file=path.resolve(this.options.rootKey);const privateKey=fs.readFileSync(file);const parsed=utils.parseKey(privateKey);
        if(parsed instanceof Error)throw parsed;
        this.rootKey={file,privateKey,publicKey:parsed.type+' '+parsed.getPublicSSH().toString('base64')+' sk8000-recovery'};
      }else this.rootKey=loadRootKey(this.options.host);
      await ssh.luna(this.client,'org.webosbrew.hbchannel.service/setConfiguration',{sshdEnabled:true,telnetDisabled:true});
      const key=quote(this.rootKey.publicKey);
      await ssh.exec(this.client,"umask 077; mkdir -p /home/root/.ssh; touch /home/root/.ssh/authorized_keys; grep -qxF "+key+" /home/root/.ssh/authorized_keys || printf '%s\\n' "+key+" >> /home/root/.ssh/authorized_keys; chmod 700 /home/root/.ssh; chmod 600 /home/root/.ssh/authorized_keys");
    }
    const checked=await ssh.connect({...this.options,port:22,username:'root',auth:{privateKey:this.rootKey.privateKey},trustNewHost:false});
    try{if((await ssh.exec(checked,'id -u')).trim()!=='0')throw new Error('Recovery SSH key is not root');}
    finally{checked.end();}
  }
  async removeDeveloperMode(){
    this.mark('Remove LG Developer Mode through the installer service');
    await ssh.exec(this.client,'python -',{input:fs.readFileSync(path.join(root,'scripts/remove-devmode.py')),timeout:75000,onOutput:chunk=>process.stdout.write(chunk)});
  }
  async assertDeveloperModeAbsent(){
    const response=await ssh.luna(this.client,'com.webos.applicationManager/listApps');
    if(!Array.isArray(response.apps)||response.apps.some(app=>app.id==='com.palmdts.devmode'))throw new Error('Developer Mode is still present or cannot be verified; reboot blocked');
  }
  async rebootAndReconnect(reason){
    this.mark('Reboot and reconnect ('+reason+')');
    const oldBoot=(await ssh.exec(this.client,'cat /proc/sys/kernel/random/boot_id')).trim();
    if(!/^[a-f0-9-]{36}$/.test(oldBoot))throw new Error('Cannot identify current boot; refusing unverified reboot');
    const keyFile=this.options.rootKey||this.rootKey?.file||rootKeyPath(this.options.host);
    let auth;
    if(fs.existsSync(keyFile))auth={privateKey:fs.readFileSync(keyFile)};
    else throw new Error('A recovery root key is required for unattended reconnect; use --root-key or provision one before reboot');
    await ssh.exec(this.client,'sync; (sleep 1; reboot) </dev/null >/dev/null 2>&1 &');
    this.client.end();this.client=null;
    await pause(20000);
    let lastError;const deadline=Date.now()+180000;
    while(Date.now()<deadline){
      let candidate;
      try{
        candidate=await ssh.connect({...this.options,port:22,username:'root',auth,trustNewHost:false,readyTimeout:5000});
        const uid=(await ssh.exec(candidate,'id -u')).trim();
        const boot=(await ssh.exec(candidate,'cat /proc/sys/kernel/random/boot_id')).trim();
        if(uid!=='0'||!/^[a-f0-9-]{36}$/.test(boot)||boot===oldBoot){candidate.end();throw new Error('TV has not completed the requested reboot');}
        this.client=candidate;assertProfile(await publicLuna(candidate,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']}));
        return;
      }catch(error){if(candidate)candidate.end();lastError=error;if(/host key/i.test(error.message))throw error;await pause(2000);}
    }
    throw new Error('TV did not reconnect automatically: '+lastError?.message);
  }
  async installApps(){
    if(this.options.noExtraApps)return;
    this.mark('Install pinned homebrew apps if absent');
    this.appReport=(await require('./post-install').ensureApps(this.client,this.options)).report;
  }
  async restoreInterface(){
    this.mark('Restore MAC-WebOSTV interface and no-flash HOME relay');
    await restore(this.client,{...this.options,privacy:!this.options.noExtraApps,advanced:!this.options.noExtraApps});
  }
  async verifyInstallation(){
    this.mark('Verify final launcher and HOME process');
    let confirmed=false;
    for(let attempt=0;attempt<45;attempt++){
      try{
        await ssh.exec(this.client,"p=$(cat /tmp/gathin-home-keyhook.pid); test -r /proc/$p/cmdline && tr '\\000' ' ' < /proc/$p/cmdline | grep -F '/home/root/gathin-home-keyhook.py'");
        const foreground=await ssh.luna(this.client,'com.webos.applicationManager/getForegroundAppInfo');
        if(this.options.noFinalReboot||foreground.appId===profile.appId){confirmed=true;break;}
      }catch{}await pause(2000);
    }
    if(!confirmed)throw new Error('Launcher/relay startup was not confirmed; run doctor to inspect');
    if(!this.options.noExtraApps){
      const check="import os; expected={'/var/lib/webosbrew/gathin-controls/bridge.pid':'/var/lib/webosbrew/gathin-controls/bridge.py','/var/lib/webosbrew/gathin-youtube-voice/router.pid':'/home/root/gathin-youtube-voice-router.py'}\nfor file,target in expected.items():\n pid=int(open(file).read()); args=open('/proc/'+str(pid)+'/cmdline').read().split(chr(0)); assert len(args)>1 and args[1]==target, target\nprint('Action Center and voice runtimes verified')";
      console.log(await ssh.exec(this.client,'python -c '+quote(check)));
    }
    await require('./post-install').checkFeatures(this.client,this.options,this.appReport||[]);
    const result=await doctor(this.client,this.options);
    fs.writeFileSync(path.join(this.folder,'completed.json'),JSON.stringify({at:new Date().toISOString(),result},null,2));
  }
  close(){if(this.client)this.client.end();if(this.devClient&&this.devClient!==this.client)this.devClient.end();}
}
module.exports={AutorootSteps,rootKeyPath,loadRootKey,publicLuna};
