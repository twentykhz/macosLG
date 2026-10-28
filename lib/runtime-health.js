'use strict';
const {exec}=require('./ssh'),{quote}=require('./local');
// Executed with the TV's ES5 runtime; never print per-TV tokens or remote URLs.
function probe(caps={controls:true,nodeServices:true}){
 return `var fs=require('fs'),vm=require('vm'),http=require('http'),url=require('url'),app='/media/developer/apps/usr/palm/applications/com.gathin.tvhome',caps=${JSON.stringify(caps)},pending=0,failed=false;
function fail(s){failed=true;console.error(s);process.exitCode=1;}
function load(name){var c={window:{}};vm.runInNewContext(fs.readFileSync(app+'/'+name,'utf8'),c);return c.window;}
function request(address,body,headers,done){pending++;headers=headers||{};if(body)headers['Content-Length']=Buffer.byteLength(body);var u=url.parse(address),r=http.request({hostname:u.hostname,port:u.port,path:u.path,method:body?'POST':'GET',headers:headers},function(s){var out='';s.on('data',function(b){out+=b;});s.on('end',function(){pending--;try{if(s.statusCode!==200)throw Error();done(out);}catch(e){fail('Authenticated runtime response invalid');}});});r.setTimeout(4000,function(){r.abort();});r.on('error',function(){fail('Runtime not ready');});r.end(body||'');}
try{
if(caps.controls){var token=fs.readFileSync('/var/lib/webosbrew/gathin-controls/bridge.token','utf8').trim();if(load('control-token.js').GATHIN_CONTROL_TOKEN!==token)throw Error('Controls token mismatch');request('http://127.0.0.1:18764/',JSON.stringify({action:'health'}),{'Content-Type':'application/json','X-Gathin-Token':token},function(s){var a=JSON.parse(s);if(a.returnValue!==true||a.protocol!==2)throw Error();});}
if(caps.nodeServices){var remote=load('remote-access.js').TV_REMOTE_URL,wall=load('wall.js'),state=wall.WALL_STATE,remoteKey=fs.readFileSync('/var/lib/webosbrew/gathin-remote/access-key','utf8').trim(),wallKey=fs.readFileSync('/var/lib/webosbrew/gathin-wallpaper/access-key','utf8').trim();
if(!remote||url.parse(remote).query!=='k='+remoteKey)throw Error('Remote configuration not published');
if(!wall.WALL_URL||url.parse(wall.WALL_URL).query!=='k='+wallKey||!state||!state.selected||!state.selected.length)throw Error('Wallpaper configuration not published');
state.selected.forEach(function(n){if(!/^(wallpaper|wall-[a-f0-9]+)\\.(jpg|png|webp)$/.test(n)||!fs.statSync(app+'/'+n).size)throw Error('Selected wallpaper missing');});
request('http://127.0.0.1:8091/',null,{'Cookie':'tvremote='+remoteKey},function(s){if(!s.length)throw Error();});request('http://127.0.0.1:8090/api/state?k='+wallKey,null,null,function(s){if(!JSON.parse(s).selected.length)throw Error();});}
}catch(e){fail(e.message);}
`;
}
async function verify(client,caps){
 if(!caps.controls&&!caps.nodeServices)return;
 const runtime=await require('./tv-capabilities').probe(client);if(!runtime.node)throw Error('Node runtime unavailable for service verification');
 let last;for(let n=0;n<5;n++){try{await exec(client,quote(runtime.node)+' -e '+quote(probe(caps)),{timeout:15000});console.log('Authenticated controls, QR configuration and selected wallpapers verified.');return;}catch(e){last=e;if(n<4)await new Promise(r=>setTimeout(r,1500));}}
 throw Error('Core runtime verification failed; installation is incomplete. '+last.message);
}
module.exports={probe,verify};
