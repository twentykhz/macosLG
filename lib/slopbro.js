'use strict';
// SlopBro integration, AGPL-3.0-or-later. Upstream notices/source: upstream/slopbro/COPYING.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),net=require('node:net'),dgram=require('node:dgram'),crypto=require('node:crypto');
const {root,sha256}=require('./local');
const config=require('../config/root-methods.json').slopbro;
function assets(){const files=new Map();for(const entry of config.files){const b=fs.readFileSync(path.join(root,'upstream/slopbro',entry.path));if(b.length!==entry.size||sha256(b)!==entry.sha256)throw Error('SlopBro source checksum mismatch: '+entry.path);files.set(entry.path,b);}return files;}
function targets(info,apps){const major=Number(String(info.sdkVersion||'').split('.')[0]);if(!Number.isInteger(major)||major<3)throw Error('SlopBro needs authenticated TV SDK version, not firmware');const ids=new Set(apps.map(a=>a.id));return config.targets.filter(([id,,versions])=>versions.includes(major)&&ids.has(id));}
async function localAddress(host){if(net.isIP(host)!==4)throw Error('SlopBro requires the TV LAN IPv4 address');return new Promise((resolve,reject)=>{const s=dgram.createSocket('udp4');s.once('error',e=>{s.close();reject(e);});s.connect(9,host,()=>{const ip=s.address().address;s.close();if(ip==='0.0.0.0'||ip.startsWith('127.'))reject(Error('No LAN route to TV'));else resolve(ip);});});}
function instrumentMain(source,callback){return source+'\n// MAC-WebOSTV integration: bounded root-execution evidence; no credentials.\n'+`var macHttp=require('http'),macUrl=require('url'),macRun=module.exports.run;
function macReport(state){try{var u=macUrl.parse(${JSON.stringify(callback)}),body=JSON.stringify({state:state,uid:process.getuid()}),r=macHttp.request({hostname:u.hostname,port:u.port,path:u.path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}},function(s){s.resume();});r.setTimeout(2000,function(){r.abort();});r.on('error',function(){});r.end(body);}catch(e){}}
module.exports.run=function(){macReport('running');try{macRun.apply(this,arguments);var log=fs.readFileSync('/tmp/slopbro.log','utf8');macReport(/result: success\\s*$/.test(log)?'complete':'failed');}catch(e){macReport('failed');throw e;}};\n`;}
async function serve({host,localIp,source,hbchannel,onEvidence=()=>{}}){
 const nonce=crypto.randomBytes(24).toString('hex'),prefix='/'+nonce+'/',files=new Map(),seen=new Set();let callback;
 for(const name of ['index.html','autoroot.sh','main.js','package.json'])files.set(name,source.get('wwwroot/'+name));files.set('hbchannel.ipk',hbchannel);
 const server=http.createServer((req,res)=>{
  const peer=(req.socket.remoteAddress||'').replace(/^::ffff:/,'');if(peer!==host){res.writeHead(403);return res.end();}
  let url;try{url=new URL(req.url,'http://localhost');}catch{res.writeHead(400);return res.end();}
  const name=url.pathname.startsWith(prefix)?url.pathname.slice(prefix.length):'';
  if(name==='evidence'&&req.method==='POST'){let bytes='',ended=false;req.setTimeout(4000,()=>req.destroy());req.on('data',b=>{bytes+=b;if(bytes.length>1024){ended=true;res.writeHead(413);res.end();req.destroy();}});req.on('end',()=>{if(ended)return;try{const e=JSON.parse(bytes);if(e.uid!==0||!['running','complete','failed'].includes(e.state))throw Error();onEvidence({state:e.state,uid:0});res.writeHead(204);res.end();}catch{res.writeHead(400);res.end();}});return;}
  if(!['GET','HEAD'].includes(req.method)||!files.has(name)){res.writeHead(404);return res.end();}
  const body=files.get(name);seen.add(name);res.writeHead(200,{'Content-Type':name.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream','Content-Length':body.length,'Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:body);
 });
 server.requestTimeout=10000;server.headersTimeout=5000;server.maxConnections=8;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,localIp,resolve);});const base='http://'+localIp+':'+server.address().port+prefix;callback=base+'evidence';files.set('main.js',Buffer.from(instrumentMain(files.get('main.js').toString('utf8'),callback)));
 return {seen,url:base+'index.html?script=autoroot.sh&files=package.json;main.js;hbchannel.ipk&fake-service-path=/usr/palm/services/com.palm.service.devmode',close:()=>new Promise(r=>{server.close(r);server.closeAllConnections();}),base};
}
async function run({host,info,folder,developer,rootProbe,onRootReported=()=>{},wait=ms=>new Promise(r=>setTimeout(r,ms)),timeout=180000,transportFactory,localIpResolver=localAddress}){
 if(!developer)throw Error('Automatic SlopBro needs the authenticated Developer Mode session to read identity and verify root; enable Dev Mode Status / Key Server and retry');
 const source=assets(),caps=await developer.capabilities();if(!require('../config/component-support.json')['org.webosbrew.hbchannel'].architectures.includes(caps.arch))throw Error('SlopBro bundled Homebrew ABI is not verified for '+caps.arch);
 const hb=require('./assets').configuration().homebrew,hbFile=await require('./assets').downloadPinned(hb),bytes=fs.readFileSync(hbFile);if(sha256(bytes)!==hb.sha256)throw Error('SlopBro Homebrew checksum mismatch');
 let evidence=null,reported=false,launched=false,transport=null,server;
 function record(e){evidence=e;if(!reported){reported=true;onRootReported();}fs.appendFileSync(path.join(folder,'slopbro-events.jsonl'),JSON.stringify({at:new Date().toISOString(),...e})+'\n',{mode:0o600});}
 async function pairing(){if(!transport){console.log(require('./setup-language').text('Accept the MAC-WebOSTV pairing prompt on TV if shown.','Chap nhan thong bao ghep doi MAC-WebOSTV tren TV neu co.'));transport=await (transportFactory||require('./slopbro-ssap').connect)({host,folder});}return transport;}
 try{
  let apps;try{apps=await developer.apps();}catch(e){if(/host key/i.test(e.message))throw e;apps=await (await pairing()).apps();}
  const candidates=targets(info,apps);if(!candidates.length)throw Error('No installed SlopBro target app matches authenticated SDK '+info.sdkVersion);
  const ip=await localIpResolver(host);server=await serve({host,localIp:ip,source,hbchannel:bytes,onEvidence:record});
  let chosen;
  for(const [id,param]of candidates){try{await developer.launch(id,{[param]:server.url});chosen=id;break;}catch(e){if(e.remoteStateUnknown||/timed out|disconnect|closed/i.test(e.message))throw Object.assign(Error('SlopBro launch outcome is uncertain; no other method will run'),{uncertain:true});}}
  if(!chosen){console.log(require('./setup-language').text('Developer Mode cannot launch the target. Accept the MAC-WebOSTV pairing prompt on TV if shown.','Developer Mode khong cho mo app dich. Chap nhan ghep doi MAC-WebOSTV tren TV neu co thong bao.'));await pairing();for(const [id,param]of candidates){try{await transport.launch(id,{[param]:server.url});chosen=id;break;}catch(e){if(e.uncertain||e.cancelled)throw e;}}}
  if(!chosen)throw Error('TV rejected every installed SlopBro target launch');launched=true;
  console.log('SlopBro: '+chosen+'; waiting for TV downloads and verified root. Keep the installer open; allow LAN access if the OS asks.');
  const end=Date.now()+timeout;while(Date.now()<end){
   // A served file or accepted launch is never treated as root success.
   if(evidence&&evidence.state==='failed')throw Object.assign(Error('SlopBro reached UID 0 but its Homebrew payload failed; inspect slopbro-events.jsonl. Do not reroot.'),{rootPending:true});
   try{await rootProbe();if(!reported){reported=true;onRootReported();}if(evidence?.state==='complete')return {rootReported:true,rootVerified:true,method:'slopbro'};}catch(e){if(/host key/i.test(e.message))throw Object.assign(e,{uncertain:true});}
   await wait(2500);
  }
  const message=server.seen.size?'SlopBro started, but root is not verified. Do not start another exploit; check Homebrew/root logs.':'TV accepted launch but could not load the LAN payload. Check firewall, client isolation and same Wi-Fi/LAN; no additional method was started.';
  throw Object.assign(Error(message),reported?{rootPending:true}:{uncertain:true});
 }catch(e){if(reported)e.rootPending=true;else if(launched||server?.seen.size)e.uncertain=true;throw e;}
 finally{if(transport)transport.close();if(server)await server.close();}
}
module.exports={assets,targets,localAddress,instrumentMain,serve,run};
