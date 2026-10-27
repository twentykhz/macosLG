'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),EventEmitter=require('node:events');
const path=require('node:path'),{root}=require('../lib/local');
test('capture falls back from JPEG to JPG, cleans files and reuses working strategy',async()=>{
 const files=new Map(),calls=[];const jpeg=Buffer.from([255,216,255,224,0,0,0,0,255,217]);
 const fakeFs={readFileSync(p){if(!files.has(p))throw Error('missing');return files.get(p);},writeFileSync(p,b){files.set(p,b);},renameSync(a,b){files.set(b,files.get(a));files.delete(a);},unlinkSync(p){files.delete(p);},readFile(p,cb){cb(null,files.get(p));}};
 const sandbox={Buffer,setTimeout,console,require(n){if(n==='fs')return fakeFs;if(n==='os')return {networkInterfaces:()=>({})};if(n==='http')return {createServer:()=>({listen(){}})};if(n==='child_process')return {execFile(file,args,cb){const data=JSON.parse(args[5]);calls.push(data.format);if(data.format==='JPEG')return cb(null,JSON.stringify({returnValue:false,errorText:'Unsupported format'}));files.set(data.path,jpeg);cb(null,'{"returnValue":true}');}};return require(n);}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'payload/advanced/files/var/lib/webosbrew/gathin-remote/server.js'),'utf8'),sandbox);
 const shot=()=>new Promise((resolve,reject)=>sandbox.captureFrame([640,360],false,(e,bytes,mime)=>e?reject(e):resolve({bytes,mime})));
 assert.equal((await shot()).mime,'image/jpeg');assert.deepEqual(calls,['JPEG','JPG']);assert(![...files.keys()].some(p=>p.startsWith('/tmp/')));await shot();assert.deepEqual(calls,['JPEG','JPG','JPG']);
});
test('family endpoint rejects invalid dates and persists edited members without touching gallery',()=>{
 const files=new Map(),data='/data',app='/app';let route;
 files.set(data+'/access-key','testkey');files.set(data+'/desktop-pin','123456');
 const defaults={family:[{name:'Sample',day:1,month:1,year:2000}],weatherLocations:[],slideshow:{enabled:false,interval:30}};
 const fakeFs={readFileSync(p){if(!files.has(p))throw Error('missing');return files.get(p);},writeFileSync(p,b){files.set(p,b);},renameSync(a,b){files.set(b,files.get(a));files.delete(a);},readdirSync(){return ['wallpaper.jpg'];},statSync(){return {mtime:new Date(0)};}};
 const sandbox={Buffer,process:{env:{WALL_DATA:data,WALL_APP:app}},require(n){if(n==='fs')return fakeFs;if(n==='path')return path.posix;if(n==='./defaults.json')return defaults;if(n==='./place-names.js')return p=>p.name;if(n==='os')return {networkInterfaces:()=>({})};if(n==='http')return {createServer(fn){route=fn;return {listen(port,host,cb){cb();}};}};return require(n);}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'payload/advanced/files/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js'),'utf8'),sandbox);
 function post(family){const req=new EventEmitter();Object.assign(req,{method:'POST',url:'/api/family?k=testkey',headers:{}});let status,body;route(req,{writeHead(s){status=s;},end(b){body=JSON.parse(b);}});req.emit('data',Buffer.from(JSON.stringify({family})));req.emit('end');return {status,body};}
 assert.equal(post([{name:'Invalid',year:2001,month:2,day:29}]).status,400);
 assert.equal(post([{name:'Nguyệt',year:1977,month:6,day:18},{name:'Hoàng',year:2004,month:6,day:18}]).status,200);
 const state=JSON.parse(files.get(data+'/slideshow.json'));assert.equal(state.family.length,2);assert.equal(state.family[0].name,'Nguyệt');assert.deepEqual(state.gallery,['wallpaper.jpg']);assert.match(files.get(app+'/family-config.js'),/Hoàng/);
});
