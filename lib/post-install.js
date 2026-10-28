'use strict';
const fs=require('node:fs'),path=require('node:path'),net=require('node:net');
const {root,state,quote,sha256}=require('./local');const {exec,luna,installPackage}=require('./ssh');
const repository='https://raw.githubusercontent.com/lewisdoesstuff/lifesgoodwithoutspying/main/repo.json';
const HostWebSocket=globalThis.WebSocket||require('ws');
async function addHomebrewRepository(client){
 if(typeof client.forwardOut!=='function')throw Error('SSH inspector forwarding unavailable; add repository manually');
 // Homebrew stores repository configuration in its own origin's localStorage.
 // Change it through that application's inspector, never overwrite its database.
 await luna(client,'com.webos.applicationManager/launch',{id:'org.webosbrew.hbchannel'});
 const sockets=new Set(),server=net.createServer(socket=>{sockets.add(socket);socket.on('close',()=>sockets.delete(socket));client.forwardOut('127.0.0.1',0,'127.0.0.1',9998,(err,stream)=>{if(err)return socket.destroy();stream.on('error',()=>socket.destroy());socket.on('error',()=>stream.destroy());socket.pipe(stream).pipe(socket);});});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});let ws;
 try{
  const port=server.address().port;let page;
  for(let i=0;i<12&&!page;i++){const pages=await fetch('http://127.0.0.1:'+port+'/json',{signal:AbortSignal.timeout(4000)}).then(r=>r.json());page=pages.find(p=>(p.url||'').includes('org.webosbrew.hbchannel'));if(!page)await new Promise(r=>setTimeout(r,500));}
  if(!page)throw Error('Homebrew inspector unavailable; add repository manually');
  ws=new HostWebSocket('ws://127.0.0.1:'+port+'/devtools/page/'+page.id);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Homebrew inspector timeout')),5000);ws.addEventListener('error',()=>{clearTimeout(timer);reject(Error('Homebrew inspector unavailable'));},{once:true});ws.addEventListener('open',()=>{const expression="(function(){var c=JSON.parse(localStorage.getItem('repositoriesConfig')||'{}');c.repositories=c.repositories||[];if(!c.repositories.some(function(r){return r.url==="+JSON.stringify(repository)+";}))c.repositories.push({name:'Life’s Good Without Spying',url:"+JSON.stringify(repository)+"});localStorage.setItem('repositoriesConfig',JSON.stringify(c));return c.repositories.some(function(r){return r.url==="+JSON.stringify(repository)+";});}())";ws.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));});ws.addEventListener('message',e=>{const r=JSON.parse(e.data);if(r.id!==1)return;clearTimeout(timer);if(r.error||r.result?.exceptionDetails||r.result?.result?.value!==true)reject(Error('Homebrew repository was not saved'));else resolve();});});
 }finally{if(ws)ws.close();for(const socket of sockets)socket.destroy();server.close();}
}
async function ensureApps(client,options={}){
 const report=[],config=JSON.parse(fs.readFileSync(path.join(root,'config/bootstrap.json')));
 let {apps=[]}=await luna(client,'com.webos.applicationManager/listApps');
 for(const asset of [config.homebrew,...config.apps]){
  if(apps.some(a=>a.id===asset.id)){report.push({feature:asset.id,status:'present'});continue;}
  if(asset.id==='org.webosbrew.hbchannel'){
   const caps=await require('./tv-capabilities').probe(client);
   if(!require('../config/component-support.json')[asset.id].architectures.includes(caps.arch)){report.push({feature:asset.id,status:'skipped',detail:'Pinned IPK has ARM32 ELF binaries; not deployed on '+caps.arch});continue;}
   if(options.compatibilityMode){report.push({feature:asset.id,status:'skipped',detail:'Conservative mode retains existing root SSH; no new native Homebrew package installed outside the reference profile'});continue;}
  }
  if(options.compatibilityMode&&asset.id==='ooo.lew.lifesgoodwithoutspying'){report.push({feature:asset.id,status:'skipped',detail:'Privacy configuration is managed by the TV owner; no reference tuning applied'});continue;}
  const file=path.join(root,'upstream',asset.name),remote='/media/developer/temp/gathin-optional-'+asset.name;
  try{
   const bytes=fs.readFileSync(file);if(sha256(bytes)!==asset.sha256)throw Error('Pinned package checksum mismatch');
   await require('./ssh').upload(client,file,remote,'600');
   require('./recovery').markMutation(options,'optional app '+asset.id);
   try{await installPackage(client,remote);}catch(directError){
    if(asset.id!=='ooo.lew.lifesgoodwithoutspying')throw directError;
    let repoStatus='';try{await addHomebrewRepository(client);repoStatus='custom repository added';}catch(e){repoStatus=e.message;}
    console.log('LGWS direct install failed: '+directError.message+'. '+repoStatus);
    // Verified pinned download through Homebrew's root service. Registration checked below.
    await luna(client,'org.webosbrew.hbchannel.service/install',{ipkUrl:asset.url,ipkHash:asset.sha256});
   }
   for(let attempt=0;attempt<30;attempt++){({apps=[]}=await luna(client,'com.webos.applicationManager/listApps'));if(apps.some(a=>a.id===asset.id))break;await new Promise(r=>setTimeout(r,1000));}
   if(!apps.some(a=>a.id===asset.id))throw Error('App registration not confirmed; install from Homebrew manually');
   report.push({feature:asset.id,status:'installed',detail:asset.id==='ooo.lew.lifesgoodwithoutspying'?'Package registered. Upstream declares webOS 5+; privacy switches were not enabled by this step.':undefined});
  }catch(e){report.push({feature:asset.id,status:'needs-attention',detail:e.message,repository:asset.id==='ooo.lew.lifesgoodwithoutspying'?repository:undefined});console.log('Optional app '+asset.id+': '+e.message);}
  finally{await exec(client,'rm -f '+quote(remote)).catch(()=>{});}
 }
 // Installing LGWS does not turn on Voice Services/ThinQ blocking.
 return {apps,report};
}
async function checkFeatures(client,options={},installation=[]){
 const nodeCommand=()=>{if(!compatibility?.probes.node)throw Error('No supported Node runtime on this TV');return quote(compatibility.probes.node)+' -e ';};
 const results=installation.slice(),folder=path.join(state,'feature-reports');fs.mkdirSync(folder,{recursive:true});
 let compatibility=null;try{const caps=await require('./tv-capabilities').probe(client),info=await luna(client,'com.webos.service.tv.systemproperty/getSystemInfo',{keys:['modelName','boardType','firmwareVersion','sdkVersion']}),all=await luna(client,'com.webos.applicationManager/listApps');compatibility=await require('./rooted-compat').detect(client,all.apps||[],info);require('./rooted-compat').printCapabilities(caps,info);const f=compatibility.features;const catalog={'Homebrew Channel':compatibility.probes.homebrew?'PRESENT':'NOT REGISTERED (existing root SSH retained)','Launcher':f.rollback?'SUPPORTED':'NO VERIFIED INSTALL/ROLLBACK PATH','Action Center':f.controls?'SUPPORTED (API-dependent)':'UNSUPPORTED','Wallpaper / remote / HDMI learning':f.nodeServices?'SUPPORTED':'UNSUPPORTED','Basic native voice launch':f.voiceBasic?'SUPPORTED (native app API-dependent)':'USE NATIVE MICROPHONE','Backup':f.backup?'SUPPORTED':'UNSUPPORTED','Rollback':f.rollback?'SUPPORTED':'UNSUPPORTED','Native HOME interception':require('./tv-capabilities').legacyHome(caps,info)?'REFERENCE PROFILE; INPUT PROBE REQUIRED':'UNSUPPORTED','Python2 voice helper':require('./tv-capabilities').legacyHome(caps,info)?'REFERENCE PROFILE ONLY':'SKIPPED','SK8000 tuning':require('./tv-capabilities').legacyHome(caps,info)?'REFERENCE PROFILE ONLY':'SKIPPED'};compatibility.catalog=catalog;console.log('COMPATIBILITY REPORT');for(const [name,value]of Object.entries(catalog))console.log(name.padEnd(38)+' '+value);}catch(e){results.push({feature:'capabilities',status:'needs-attention',detail:e.message});}
 async function check(feature,fn){try{const detail=await fn();results.push({feature,status:'verified',detail});}catch(e){results.push({feature,status:'needs-attention',detail:e.message});}}
 await check('root',async()=>{const uid=(await exec(client,'id -u')).trim();if(uid!=='0')throw Error('Root UID not confirmed');return 'UID 0';});
 await check('launcher',async()=>{const {apps=[]}=await luna(client,'com.webos.applicationManager/listApps');if(!apps.some(a=>a.id==='com.gathin.tvhome'))throw Error('Launcher not registered');return 'App registered';});
 for(const [feature,port] of [['remote-http',8091],['settings-http',8090]])await check(feature,()=>exec(client,nodeCommand()+quote("var h=require('http');var r=h.get('http://127.0.0.1:"+port+"/',function(s){if([200,403].indexOf(s.statusCode)<0)process.exitCode=1;s.resume();});r.setTimeout(5000,function(){r.abort();process.exitCode=1;});r.on('error',function(){process.exitCode=1;});"),{timeout:8000}));
 if(options.readOnly)results.push({feature:'stream-capture',status:'manual-check-required',detail:'Doctor does not write capture files to the TV. Capture is checked during installation.'});
 else await check('stream-capture',async()=>{
  const file='/tmp/gathin-setup-probe.jpg';let last;
  try{for(const api of ['com.webos.service.tv.capture/executeOneShot','com.webos.service.capture/executeOneShot'])for(const format of ['JPEG','JPG','PNG']){try{await exec(client,'rm -f '+quote(file));await luna(client,api,{path:file,method:'DISPLAY',format,width:640,height:360});await exec(client,'test -s '+quote(file));return {api,format,resolution:'640x360',note:'Single capture only; sustained FPS not measured'};}catch(e){last=e;}}throw last||Error('Capture unavailable');}finally{await exec(client,'rm -f '+quote(file)).catch(()=>{});}
 });
 await check('network-input-service',()=>luna(client,'com.webos.service.networkinput/getServiceInfo',{}));
 for(const [feature,method,params] of [
  ['audio-read','com.webos.audio/getVolume',{}],
  ['brightness-read','com.webos.service.settings/getSystemSettings',{category:'picture',keys:['backlight']}],
  ['picture-mode-read','com.webos.service.settings/getSystemSettings',{category:'picture',keys:['pictureMode']}],
  ['network-read','com.palm.connectionmanager/getStatus',{}],
  ['bluetooth-read','com.webos.service.bluetooth2/device/getStatus',{}]
 ])await check(feature,()=>luna(client,method,params));
 let network=[];
 await check('wake-helper',async()=>{
  network=JSON.parse(await exec(client,nodeCommand()+quote("var os=require('os'),fs=require('fs'),rows=[];Object.keys(os.networkInterfaces()).forEach(function(n){os.networkInterfaces()[n].forEach(function(a){if(a.family==='IPv4'&&!a.internal){var mac=a.mac;try{mac=fs.readFileSync('/sys/class/net/'+n+'/address','utf8').trim();}catch(e){}rows.push({interface:n,ip:a.address,netmask:a.netmask,mac:mac});}});});console.log(JSON.stringify(rows));")));
  if(!network.some(n=>/^(?!00:00:00:00:00:00)[0-9a-f:]{17}$/i.test(n.mac||'')))throw Error('No LAN MAC available; configure Wake-TV.ps1 manually');
  for(const n of network){if(!/^(?!00:00:00:00:00:00)[0-9a-f:]{17}$/i.test(n.mac||''))continue;const ip=n.ip.split('.').map(Number),mask=n.netmask.split('.').map(Number),broadcast=ip.map((v,i)=>(v|(~mask[i]&255))>>>0).join('.');if(process.platform==='win32'){const script=fs.readFileSync(path.join(root,'Wake-TV.ps1'),'utf8').replace(/\[Parameter\(Mandatory=\$true\)\]\[string\]\$MacAddress/,"[string]$MacAddress = '"+n.mac+"'").replace(/\[Parameter\(Mandatory=\$true\)\]\[string\]\$TvAddress/,"[string]$TvAddress = '"+n.ip+"'").replace(/192\.168\.1\.255/g,broadcast);fs.writeFileSync(path.join(folder,'Wake-TV-'+n.ip+'.ps1'),'\uFEFF'+script.replace(/\r?\n/g,'\r\n'));}else{const helper="'use strict';\nconst dgram=require('node:dgram'),mac="+JSON.stringify(n.mac)+",address="+JSON.stringify(broadcast)+";\nconst bytes=Buffer.from(mac.replace(/:/g,''),'hex'),packet=Buffer.concat([Buffer.alloc(6,255),...Array(16).fill(bytes)]),s=dgram.createSocket('udp4');s.on('error',e=>{console.error(e.message);s.close();process.exitCode=1;});s.bind(()=>{s.setBroadcast(true);s.send(packet,9,address,()=>s.close());});\n";fs.writeFileSync(path.join(folder,'Wake-TV-'+n.ip+'.js'),helper,{mode:0o600});}}return 'Helpers saved in '+folder;
 });
 for(const feature of ['HOME','BACK','arrows-OK','mouse','volume-mute','power-restart','voice','weather-tabs','calendar-family'])results.push({feature,status:'manual-check-required',detail:'Test on this TV with physical remote and remote-control page; no synthetic input or power cycle sent by diagnostics.'});
 results.push({feature:'Wake-on-LAN',status:'manual-check-required',detail:'Enable Mobile TV On / Turn on via Wi-Fi or LAN in LG settings. Test from another powered-on LAN device while TV is in standby. An offline TV cannot host its own wake page.'});
 const report={at:new Date().toISOString(),host:options.host,capabilities:compatibility,results};const file=path.join(folder,'features-'+Date.now()+'.json');fs.writeFileSync(file,JSON.stringify(report,null,2));fs.writeFileSync(file.replace('.json','.txt'),results.map(r=>r.status.toUpperCase()+' | '+r.feature+' | '+(typeof r.detail==='string'?r.detail:JSON.stringify(r.detail||''))).join('\r\n'));console.log('FEATURE REPORT: '+file);for(const r of results)console.log(r.status.toUpperCase()+' '+r.feature);return report;
}
module.exports={ensureApps,checkFeatures,addHomebrewRepository};
