'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {utils}=require('ssh2');
const {root,state,profile,quote,sha256,verify,rootKeyFile:rootKeyPath}=require('./local');
const ssh=require('./ssh');
const {prepareAssets,configuration}=require('./assets');
const {restore,doctor}=require('../scripts/tv');
const pause=milliseconds=>new Promise(resolve=>setTimeout(resolve,milliseconds));
const {text}=require('./setup-language');

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
    if(this.options.removeExtraApps&&!this.options.dryRun)throw Error('Uninstalling unrelated apps is blocked in snapshot-protected setup. Their app data is outside the recovery scope.');
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
      try{await this.connectDeveloper();}
      catch(error){
        if(error.cancelled||error.developerPrerequisite)throw error;
        if(this.options.dryRun)throw error;
        if(/host key/i.test(error.message))throw error;
        if(!this.options.expectedModel||!this.options.expectedFirmware)throw Error(text('Automatic TV detection needs authenticated Developer Mode (Dev Mode Status and Key Server ON) or saved root SSH. Enable Developer Mode and retry, or enter the full model and installed Software Version manually. No exploit was run. Connection: ','Tu nhan dien TV can Developer Mode da xac thuc (bat Dev Mode Status va Key Server) hoac SSH root da luu. Bat Developer Mode va thu lai, hoac nhap model va Phien ban phan mem thu cong. Chua chay exploit. Ket noi: ')+error.message);
        this.developerUnavailable=error.message;
        console.log(text('faultmanager prerequisites failed: ','Dieu kien faultmanager chua dat: ')+error.message);
        this.rootability=await require('./rootability').check({modelName:this.options.expectedModel,firmwareVersion:this.options.expectedFirmware});require('./rootability').print(this.rootability);
        if(this.rootability.status!=='rootable')throw Error('Rootability is not confirmed; no fallback was attempted');
        await this.runAutoroot();this.rootAcquiredDuringConnect=true;
      }
    }
    const uid=(await ssh.exec(this.client,'id -u')).trim();
    if(this.rooted&&uid!=='0')throw new Error('Root connection is not uid 0');
    if(this.rooted){
      console.log(text('Already rooted: UID 0 verified. No rooting exploit will be repeated.','TV da root: da xac minh UID 0. Khong chay lai exploit root.'));
      console.log(text('Developer Mode / Key Server: not required for verified root SSH.','Developer Mode / Key Server: khong can cho SSH root da xac minh.'));
    }
    if(!this.rooted&&uid==='0')throw new Error('Unexpected root on Developer Mode connection; use --already-rooted');
    const info=await publicLuna(this.client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
    if(!this.rooted||this.rootAcquiredDuringConnect){
      if(this.options.expectedModel&&require('./rootability').normalizeModel(this.options.expectedModel)!==require('./rootability').normalizeModel(info.modelName))throw Error('Connected TV model differs from the preflight model');
      if(this.options.expectedFirmware&&require('./rootability').version(this.options.expectedFirmware)!==require('./rootability').version(info.firmwareVersion))throw Error('Connected firmware differs from the preflight firmware');
      if(!info.modelName||require('./rootability').version(info.firmwareVersion)===null)throw Error(text('TV did not return a usable model/firmware. Read Software Version in Settings > Support > Software Update and retry; webOS22 / 7.6.0-1901 is not firmware. No exploit was run.','TV khong tra ve model/firmware hop le. Xem Phien ban phan mem trong Cai dat > Ho tro > Cap nhat phan mem va thu lai; webOS22 / 7.6.0-1901 khong phai firmware. Chua chay exploit.'));
      console.log(text('Detected TV: ','Da nhan dien TV: ')+info.modelName+' | Firmware: '+info.firmwareVersion+' | SDK: '+(info.sdkVersion||'?'));
      this.options.expectedModel=this.options.expectedModel||info.modelName;
      this.options.expectedFirmware=this.options.expectedFirmware||info.firmwareVersion;
      this.rootability=await require('./rootability').check(info);require('./rootability').print(this.rootability);
      if(this.rootability.status!=='rootable'&&!this.rootAcquiredDuringConnect)throw Error(text('Rootability is not confirmed; stopped before any exploit.','Chua xac nhan kha nang root; da dung truoc khi chay exploit.'));
    }
    if(info.modelName!==profile.modelName||info.boardType!==profile.boardType||info.firmwareVersion!==profile.firmwareVersion){this.options.compatibilityMode=true;console.log('Capability-based installation; reference-only tuning will be skipped.');}
    this.capabilities=await require('./tv-capabilities').probe(this.client);
    if(this.rooted&&(!this.capabilities.nodeFiles||!require('./tv-capabilities').legacyHome(this.capabilities,info)))this.options.compatibilityMode=true;
    require('./rooted-compat').printCapabilities(this.capabilities,info);
    this.info=info;
    console.log(JSON.stringify(info,null,2));
  }
  async connectDeveloper(){
      const developer=require('./developer-mode');
      const status=await developer.ensure(this.options.host,{localKey:!!this.options.developerKey,onStatus:record=>{this.developerStatus=record;fs.writeFileSync(path.join(this.folder,'developer-mode-check.json'),JSON.stringify(record,null,2));}});
      let privateKey;
      if(this.options.developerKey)privateKey=fs.readFileSync(path.resolve(this.options.developerKey));
      else privateKey=status.keyServer.key;
      const passphrase=await ssh.secret(text('Developer Mode passphrase shown on TV (6 characters, hidden): ','Nhap passphrase Developer Mode tren TV (6 ky tu, an ky tu): '));
      if(passphrase.length!==6)throw new Error('Enter the exact six-character Developer Mode passphrase.');
      const parsed=utils.parseKey(privateKey,passphrase);if(parsed instanceof Error)throw new Error('Developer Mode key/passphrase could not be decrypted.');
      this.developerAuth={privateKey,passphrase};
      try{this.devClient=await ssh.connect({...this.options,port:9922,username:'prisoner',auth:this.developerAuth});}
      catch(error){console.log(text('Developer Mode SSH replied but authentication failed. Check the current six-character passphrase, remaining session and host-key warning; this does not prove the switch is OFF.','SSH Developer Mode co phan hoi nhung xac thuc that bai. Kiem tra passphrase 6 ky tu hien tai, thoi gian phien va canh bao khoa host; khong co nghia cong tac dang TAT.'));throw error;}
      this.client=this.devClient;
      this.developerStatus={...developer.publicStatus(status),authenticated:true};
      fs.writeFileSync(path.join(this.folder,'developer-mode-check.json'),JSON.stringify(this.developerStatus,null,2));
      console.log(text('Dev Mode Status: VERIFIED through authenticated Developer Mode SSH. Reading TV model and installed firmware automatically...','Dev Mode Status: DA XAC MINH qua SSH Developer Mode da xac thuc. Dang tu doc model TV va firmware dang cai...'));
  }
  isRooted(){return this.rooted;}
  async plan(){
    console.log(JSON.stringify({dryRun:true,upstream:this.assets.config.upstream,commit:this.assets.config.commit,rootAlreadyAvailable:this.rooted,steps:['get Developer Mode key and authenticate prisoner@9922','run checksum-pinned faultmanager-autoroot (only if not rooted)','verify uid 0 through Homebrew Channel','enable key-authenticated root SSH','remove and verify absence of LG Developer Mode before reboot','reboot and reconnect automatically',...(this.options.noExtraApps?[]:['install pinned YouTube AdFree, privacy app']),'restore MAC-WebOSTV, Home/Back, Action Center, voice commands, privacy and optional-service tuning','reboot and verify automatic launcher/relay startup']},null,2));
    console.log('Dry run finished. No exploit, TV upload, app removal, setting change or reboot performed.');
  }
  async runAutoroot(){
    if(!this.rootability||this.rootability.status!=='rootable')throw Error('A fresh rootability check is required before rooting');
    try{await this.verifyRootBridge();console.log(text('Root already verified through Homebrew; no exploit needed.','Da xac minh root qua Homebrew; khong can chay exploit.'));return;}catch{}
    const attempts=[];
    await require('./root-methods').runSequence(this.rootability.methods,{
      attempt:async method=>{
        this.mark(text('Root attempt: ','Thu root: ')+method.name);
        return method.key==='faultmanager'?this.runFaultmanager():require('./root-methods').guided(method,this.folder,{info:this.info,host:this.options.host});
      },
      verify:async(method,{attemptError})=>{
        try{await this.verifyRootBridge();return;}catch{}
        if(this.developerAuth){try{const previous=this.devClient;this.devClient=await ssh.connect({...this.options,port:9922,username:'prisoner',auth:this.developerAuth,trustNewHost:false,readyTimeout:5000});if(previous)previous.end();this.client=this.devClient;await this.verifyRootBridge();return;}catch{}}
        let candidate;
        try{
          candidate=await ssh.connect({...this.options,port:22,username:'root',...(attemptError?{auth:{password:'alpine'}}:{}),trustNewHost:this.options.trustNewHost,readyTimeout:5000});
          if((await ssh.exec(candidate,'id -u')).trim()!=='0')throw Error('UID is not 0');
          const actual=await publicLuna(candidate,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
          if(this.options.expectedModel&&require('./rootability').normalizeModel(actual.modelName)!==require('./rootability').normalizeModel(this.options.expectedModel))throw Error('Rooted TV model differs from the preflight model');
          if(this.options.expectedFirmware&&require('./rootability').version(actual.firmwareVersion)!==require('./rootability').version(this.options.expectedFirmware))throw Error('Rooted TV firmware differs from the preflight firmware');
          this.client=candidate;this.rooted=true;
        }
        catch(e){if(candidate)candidate.end();throw e;}
      },
      record:async record=>{
        attempts.push({...record,at:new Date().toISOString()});
        fs.writeFileSync(path.join(this.folder,'root-attempts.json'),JSON.stringify(attempts,null,2));
        const labels={'failed':text('FAILED','THAT BAI'),'root-verified':text('ROOT VERIFIED','DA XAC MINH ROOT'),'skipped':text('SKIPPED','BO QUA'),'cancelled':text('CANCELLED','DA DUNG'),'in-progress':text('STATE UNCERTAIN','CHUA RO TRANG THAI')};
        console.log('['+(labels[record.status]||record.status)+'] '+record.method+(record.error?' - '+record.error:'')+(record.reason?' - '+record.reason:'')+(record.warning?' - '+text('Warning: ','Luu y: ')+record.warning:''));
        console.log(text('Root attempt log: ','Log thu root: ')+path.join(this.folder,'root-attempts.json'));
      }
    });
  }
  async runFaultmanager(){
    this.mark('Run faultmanager-autoroot, keeping upstream version checks enabled');
    if(this.rooted)throw new Error('Refusing to rerun exploit on a rooted connection');
    if(!this.devClient)throw Error('faultmanager requires a working Developer Mode SSH session. '+(this.developerUnavailable||''));
    const caps=await require('./tv-capabilities').probe(this.devClient);
    if(!require('../config/component-support.json')['org.webosbrew.hbchannel'].architectures.includes(caps.arch))throw Error('Pinned Homebrew IPK contains ARM32 native binaries; automatic deployment is not verified for '+caps.arch+'. Use a board-compatible upstream rooting method.');
    this.remoteStage='/tmp/sk8000-faultmanager-'+crypto.randomBytes(6).toString('hex');
    await ssh.upload(this.devClient,this.assets.files[this.assets.config.autoroot.name],this.remoteStage+'/autoroot.sh');
    await ssh.upload(this.devClient,this.assets.files[this.assets.config.homebrew.name],this.remoteStage+'/hbchannel.ipk');
    const log=path.join(this.folder,'faultmanager-console.log');fs.writeFileSync(log,'');
    const live=chunk=>{fs.appendFileSync(log,chunk);process.stdout.write(chunk);};
    let output;
    try{output=await ssh.exec(this.devClient,'sh -c '+quote('echo $$ > '+quote(this.remoteStage+'/attempt.pid')+'; exec sh '+quote(this.remoteStage+'/autoroot.sh')),{timeout:180000,onOutput:live,onErrorOutput:live});}
    catch(e){if(e.remoteStateUnknown||/timed out|closed|disconnected|not connected/i.test(e.message)){e.uncertain=true;e.message+=' '+text('Remote exploit state is uncertain; stop rather than start another method concurrently.','Chua ro trang thai exploit tren TV; dung de khong chay chong phuong phap khac.');}throw e;}
    finally{
      for(const name of ['autoroot.log','autoroot-payload.log'])try{const data=await ssh.exec(this.devClient,'tail -c 1048576 '+quote(this.remoteStage+'/'+name),{timeout:5000});fs.writeFileSync(path.join(this.folder,'faultmanager-'+name),data);}catch{}
    }
    if(!/Payload complete/.test(output))throw new Error('Upstream did not report Payload complete; no reboot or subsequent installation attempted');
  }
  async rootExec(command){
    if(this.rooted)return ssh.exec(this.client,command,{timeout:60000});
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
    const serviceClient=this.rooted?this.client:this.devClient;
    await publicLuna(serviceClient,'org.webosbrew.hbchannel.service/setConfiguration',{sshdEnabled:true,telnetDisabled:true});
    await publicLuna(serviceClient,'org.webosbrew.hbchannel.service/autostart',{});
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
    const previous=this.client;
    this.client=await ssh.connect({...this.options,port:22,username:'root',auth:{privateKey:this.rootKey.privateKey}});
    if((await ssh.exec(this.client,'id -u')).trim()!=='0')throw new Error('Root SSH verification failed');
    this.rooted=true;
    if(previous&&previous!==this.devClient&&previous!==this.client)previous.end();
    if(this.devClient)this.devClient.end();this.devClient=null;
  }
  async captureInitialState(){return require('./recovery').capture(this.client,this.options,{info:this.info,apps:(await ssh.luna(this.client,'com.webos.applicationManager/listApps')).apps});}
  async prepareRootReconnect(){
    this.mark('Verify recovery key authentication for unattended reconnect');
    if(!this.rootKey){
      if(this.options.rootKey){
        const file=path.resolve(this.options.rootKey);const privateKey=fs.readFileSync(file);const parsed=utils.parseKey(privateKey);
        if(parsed instanceof Error)throw parsed;
        this.rootKey={file,privateKey,publicKey:parsed.type+' '+parsed.getPublicSSH().toString('base64')+' sk8000-recovery'};
      }else this.rootKey=loadRootKey(this.options.host);
      if(!this.options.compatibilityMode)await ssh.luna(this.client,'org.webosbrew.hbchannel.service/setConfiguration',{sshdEnabled:true,telnetDisabled:true});
      const key=quote(this.rootKey.publicKey);
      await ssh.exec(this.client,"umask 077; mkdir -p /home/root/.ssh; touch /home/root/.ssh/authorized_keys; grep -qxF "+key+" /home/root/.ssh/authorized_keys || printf '%s\\n' "+key+" >> /home/root/.ssh/authorized_keys; chmod 700 /home/root/.ssh; chmod 600 /home/root/.ssh/authorized_keys");
    }
    const checked=await ssh.connect({...this.options,port:22,username:'root',auth:{privateKey:this.rootKey.privateKey},trustNewHost:false});
    try{if((await ssh.exec(checked,'id -u')).trim()!=='0')throw new Error('Recovery SSH key is not root');}
    finally{checked.end();}
  }
  async removeDeveloperMode(){
    this.mark('Remove LG Developer Mode through the installer service');
    await require('./app-removal').remove(this.client,'com.palmdts.devmode');
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
        const identity=await publicLuna(candidate,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','firmwareVersion','sdkVersion','boardType']});
        for(const key of ['modelName','firmwareVersion','boardType'])if(identity[key]!==this.info[key])throw Error('TV identity changed during reconnect: '+key);
        this.client=candidate;
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
    if(this.options.compatibilityMode)return require('./post-install').checkFeatures(this.client,this.options,this.appReport||[]);
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
      const caps=await require('./tv-capabilities').probe(this.client);
      const check='var fs=require("fs"),expected={"/var/lib/webosbrew/gathin-controls/bridge.pid":"/var/lib/webosbrew/gathin-controls/bridge.py","/var/lib/webosbrew/gathin-youtube-voice/router.pid":"/home/root/gathin-youtube-voice-router.py"};Object.keys(expected).forEach(function(p){var pid=fs.readFileSync(p,"utf8").trim();if(!/^[0-9]+$/.test(pid)||fs.readFileSync("/proc/"+pid+"/cmdline","utf8").split(String.fromCharCode(0))[1]!==expected[p])throw Error("Reference runtime identity not verified");});console.log("Action Center and voice runtimes verified");';
      console.log(await ssh.exec(this.client,quote(caps.node)+' -e '+quote(check)));
    }
    await require('./post-install').checkFeatures(this.client,this.options,this.appReport||[]);
    const result=await doctor(this.client,this.options);
    fs.writeFileSync(path.join(this.folder,'completed.json'),JSON.stringify({at:new Date().toISOString(),result},null,2));
  }
  close(){if(this.client)this.client.end();if(this.devClient&&this.devClient!==this.client)this.devClient.end();}
}
module.exports={AutorootSteps,rootKeyPath,loadRootKey,publicLuna};
