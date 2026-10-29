'use strict';
// SlopBro SSAP launcher adapter, AGPL-3.0-or-later; upstream/slopbro/COPYING.
const fs=require('node:fs'),path=require('node:path'),WebSocket=require('ws');
const manifest={manifestVersion:1,appVersion:'1.0',appId:'lol.slopbro',vendorId:'throwaway96',localizedAppNames:{'':'MAC-WebOSTV SlopBro'},localizedVendorNames:{'':'throwaway96'},permissions:['LAUNCH','CLOSE','READ_APP_STATUS','READ_INSTALLED_APPS','READ_RUNNING_APPS']};
async function connect({host,folder,port=3001,WebSocketClass=WebSocket}){
 const socket=new WebSocketClass('wss://'+host+':'+port,{rejectUnauthorized:false,handshakeTimeout:7000,maxPayload:1024*1024});
 const pending=new Map();let sequence=0,closed=false;
 function finish(error){closed=true;for(const [id,p]of pending){clearTimeout(p.timer);p.reject(Object.assign(Error(error),{uncertain:p.launch}));}pending.clear();}
 socket.on('message',bytes=>{let m;try{m=JSON.parse(bytes.toString());}catch{return;}const p=pending.get(m.id);if(!p)return;if(p.register&&m.type==='response'&&m.payload?.pairingType)return;if(p.register&&m.type!=='registered'&&m.type!=='error')return;pending.delete(m.id);clearTimeout(p.timer);if(m.type==='error'||m.payload?.returnValue===false)return p.reject(Object.assign(Error(p.register?'TV refused SSAP pairing':'TV explicitly rejected target launch'),{cancelled:p.register}));p.resolve(m.payload||{});});
 socket.on('close',()=>finish('SSAP connection closed; launch result may be unknown'));
 socket.on('error',()=>finish('SSAP transport unavailable'));
 try{await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',()=>reject(Error('SSAP TLS connection unavailable')));});}catch(e){socket.terminate();throw e;}
 function request(message,{register=false,launch=false,timeout=20000}={}){return new Promise((resolve,reject)=>{if(closed)return reject(Error('SSAP connection unavailable'));const id='mac-'+(++sequence),timer=setTimeout(()=>{pending.delete(id);reject(Object.assign(Error(register?'Accept the pairing prompt on the TV and rerun Setup':'SSAP launch response timed out; no further method will run'),{uncertain:launch}));},timeout);pending.set(id,{resolve,reject,timer,register,launch});socket.send(JSON.stringify({...message,id}),e=>{if(e){pending.delete(id);clearTimeout(timer);reject(Object.assign(Error('SSAP send failed'),{uncertain:launch}));}});});}
 const keyFile=path.join(folder,'slopbro-ssap.json');let key;try{const saved=JSON.parse(fs.readFileSync(keyFile));if(saved.host===host&&typeof saved.key==='string')key=saved.key;}catch{}
 try{const result=await request({type:'register',payload:{forcePairing:false,pairingType:'PROMPT',manifest,...(key?{'client-key':key}:{})}},{register:true,timeout:90000});const next=result['client-key'];if(typeof next==='string'&&next.length&&next.length<=4096){fs.writeFileSync(keyFile+'.new',JSON.stringify({host,key:next}),{mode:0o600});fs.renameSync(keyFile+'.new',keyFile);fs.chmodSync(keyFile,0o600);}}
 catch(e){socket.terminate();throw e;}
 return {async apps(){const r=await request({type:'request',uri:'ssap://com.webos.applicationManager/listApps',payload:{}});if(!Array.isArray(r.apps))throw Error('SSAP installed-app inventory unavailable');return r.apps;},async launch(id,params){return request({type:'request',uri:'ssap://system.launcher/launch',payload:{id,params}},{launch:true});},close(){finish('SSAP session finished');socket.close();socket.terminate();}};
}
module.exports={connect,manifest};
