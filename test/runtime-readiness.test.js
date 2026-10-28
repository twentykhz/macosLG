'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{EventEmitter}=require('node:events');
const {probe}=require('../lib/runtime-health'),{root}=require('../lib/local');
async function health(change={}){
 const token='fixture-token',key='fixture-key',app='/media/developer/apps/usr/palm/applications/com.gathin.tvhome';
 const files=new Map([[app+'/control-token.js','window.GATHIN_CONTROL_TOKEN="'+(change.badToken?'wrong':token)+'";'],['/var/lib/webosbrew/gathin-controls/bridge.token',token],['/var/lib/webosbrew/gathin-remote/access-key',key],['/var/lib/webosbrew/gathin-wallpaper/access-key',key],[app+'/remote-access.js','window.TV_REMOTE_URL="'+(change.emptyQR?'':'http://192.0.2.4:8091/?k='+key)+'";'],[app+'/wall.js','window.WALL_URL="http://192.0.2.4:8090/?k='+key+'";window.WALL_STATE={selected:["wallpaper.jpg"]};']]);
 const messages=[],processState={};let requests=0,posted=0;
 vm.runInNewContext(probe(),{Buffer,process:processState,console:{error:s=>messages.push(s)},require(name){
  if(name==='fs')return {readFileSync(p){assert(files.has(p));return files.get(p);},statSync(){if(change.missingImage)throw Error('Missing selected wallpaper');return {size:9};}};
  if(name!=='http')return require(name);
  return {request(options,callback){requests++;const request=new EventEmitter();request.setTimeout=()=>{};request.end=body=>{setImmediate(()=>{const response=new EventEmitter();response.statusCode=change.forbidden?403:200;callback(response);let data='remote page';if(options.port==='18764'){assert.equal(options.headers['X-Gathin-Token'],token);assert.equal(options.headers['Content-Length'],Buffer.byteLength(body));posted++;data=JSON.stringify({returnValue:true,protocol:change.oldProtocol?1:2});}if(options.port==='8090')data='{"selected":["wallpaper.jpg"]}';response.emit('data',Buffer.from(data));response.emit('end');});};return request;}};
 }});
 await new Promise(r=>setImmediate(r));return {failed:processState.exitCode===1,messages,requests,posted};
}
test('readiness validates authenticated protocol and configuration rather than merely an open port',async()=>{
 const okay=await health();assert.equal(okay.failed,false);assert.equal(okay.requests,3);assert.equal(okay.posted,1);
 for(const issue of ['badToken','emptyQR','missingImage','forbidden','oldProtocol'])assert.equal((await health({[issue]:true})).failed,true,issue);
});
test('default and invalid wallpaper selections retain a visible packaged wallpaper',()=>{
 const source=fs.readFileSync(path.join(root,'payload/app/wallpaper-motion.js'),'utf8');
 for(const selected of [['wallpaper.jpg'],['../unsafe.jpg'],[]]){
  const nodes=[];function element(){const e={style:{},setAttribute(){},appendChild(){}};nodes.push(e);return e;}
  const body=element();body.insertBefore=()=>{};body.classList={contains:()=>false};const window={WALL_STATE:{selected,revision:1,enabled:false}};
  vm.runInNewContext(source,{window,document:{body,createElement:element,addEventListener(){}},setTimeout(){},clearTimeout(){},Date});
  assert.match(body.style.backgroundImage,/wallpaper\.jpg/);assert.equal(nodes[2].style.backgroundImage,'url("wallpaper.jpg")');
 }
});
test('QR publisher repairs an IP arriving late and configuration overwritten during installation',()=>{
 const writes=new Map(),timers=[];let online=false;
 const fakeFs={readFileSync(p){if(!writes.has(p))throw Error('missing');return writes.get(p);},writeFileSync(p,data){writes.set(p,data);},renameSync(a,b){writes.set(b,writes.get(a));writes.delete(a);}};
 const sandbox={Buffer,console,process:{env:{}},setInterval(fn){timers.push(fn);},require(name){if(name==='fs')return fakeFs;if(name==='http')return {createServer:()=>({listen(){}})};if(name==='os')return {networkInterfaces:()=>online?{eth0:[{family:4,internal:false,address:'192.0.2.77'}]}:{}};return require(name);}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'payload/advanced/files/var/lib/webosbrew/gathin-remote/server.js'),'utf8'),sandbox);
 const config='/media/developer/apps/usr/palm/applications/com.gathin.tvhome/remote-access.js';assert.match(writes.get(config),/=""/);online=true;timers[0]();assert.match(writes.get(config),/192\.0\.2\.77/);
 writes.set(config,'window.TV_REMOTE_URL="";');timers[0]();assert.match(writes.get(config),/192\.0\.2\.77/);
});
