'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{EventEmitter}=require('node:events');
function bridge(replies={}){const calls=[],module={exports:{}};let handler,listen;
 vm.runInNewContext(fs.readFileSync('payload/portable/controls.js','utf8'),{module,Buffer,process:{env:{}},setTimeout(){},require(name){if(name==='./dock')return require('../payload/portable/dock');if(name==='./inputs')return require('../payload/portable/inputs');if(name==='fs')return {readFileSync:()=> 'fixture-secret',existsSync:()=>false};if(name==='http')return {createServer(fn){handler=fn;return {listen(...args){listen=args;return this;}};}};if(name==='child_process')return {execFile(file,args,options,done){calls.push({file,args});done(null,JSON.stringify(typeof replies[args[4]]==='function'?replies[args[4]](JSON.parse(args[5])):(replies[args[4]]||{returnValue:true})));}};throw Error(name);}});
 return {calls,run:(action,data={})=>new Promise(r=>module.exports.run(action,data,r)),serve:()=>module.exports.serve(),request(method,body,token){let result;const req=new EventEmitter();Object.assign(req,{method,headers:{'x-gathin-token':token},setTimeout(){},destroy(){}});handler(req,{writeHead(status){result={status};},end(bytes){result.body=JSON.parse(bytes);}});if(body)req.emit('data',Buffer.from(body));req.emit('end');return result;},get listen(){return listen;}};
}
test('portable controls authenticate loopback HTTP and reject invalid input without Luna writes',async()=>{
 let volume=20;const b=bridge({'luna://com.webos.service.audiooutput/audio/volume/getStatus':{returnValue:false},'luna://com.webos.audio/getVolume':()=>({returnValue:true,volume,muted:false}),'luna://com.webos.audio/setVolume':d=>{volume=d.volume;return {returnValue:true};}});b.serve();assert.equal(b.listen[1],'127.0.0.1');assert.equal(b.request('POST','{}','wrong').status,403);assert.equal(b.request('POST','{','fixture-secret').status,400);assert.equal(b.request('POST',JSON.stringify({action:'health'}),'fixture-secret').body.protocol,2);
 for(const [a,d]of [['set_volume',{volume:101}],['set_backlight',{value:-1}],['power_off',{}],['arbitrary-command',{}]])assert.equal((await b.run(a,d)).returnValue,false);assert.equal(b.calls.length,0);
 await b.run('set_volume',{volume:25});assert(b.calls.some(c=>c.args.includes('luna://com.webos.audio/setVolume')));assert.equal(volume,25);
});
test('missing Luna capabilities and unpaired Bluetooth never trigger guessed writes',async()=>{
 const b=bridge({'luna://com.webos.service.settings/getSystemSettings':{returnValue:false},'luna://com.webos.service.bluetooth2/device/getStatus':{devices:[{address:'fixture',paired:false}]}});
 assert.equal((await b.run('set_backlight',{value:50})).supported,false);assert.equal((await b.run('bt_connect',{address:'fixture'})).supported,false);assert.equal((await b.run('voice_search')).supported,false);assert(!b.calls.some(c=>/setSystemSettings|a2dp\/connect/.test(c.args.join(' '))));
});
test('portable HDMI counts active continuous viewing, excludes standby/gaps and keeps ties stable',()=>{
 const hdmi=require('../payload/portable/hdmi'),ids=[1,2,3,4].map(n=>'com.webos.app.hdmi'+n),data={seconds:Object.fromEntries(ids.map(p=>[p,0])),appId:null};
 hdmi.record(data,ids[1],ids[1],15,true);assert.equal(data.appId,ids[1]);hdmi.record(data,ids[0],ids[0],15,true);assert.equal(data.appId,ids[1]);for(const [elapsed,active]of [[30,true],[15,false],[-1,true]])hdmi.record(data,ids[2],ids[2],elapsed,active);assert.equal(data.seconds[ids[2]],0);hdmi.record(data,ids[0],ids[1],15,true);assert.equal(data.seconds[ids[1]],15);
});
