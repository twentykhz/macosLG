'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),net=require('node:net'),http=require('node:http'),vm=require('node:vm'),{spawn}=require('node:child_process');
const {root}=require('../lib/local');
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const p=s.address().port;await new Promise(r=>s.close(r));return p;}
async function until(fn){const deadline=Date.now()+7000;let last;while(Date.now()<deadline){try{if(await fn())return;}catch(e){last=e;}await new Promise(r=>setTimeout(r,80));}throw last||Error('Service did not become ready');}
test('real remote and wallpaper services repair overwritten configuration and reject unauthenticated requests',async()=>{
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'mac-tv-services-')),app=path.join(folder,'app'),remote=path.join(folder,'remote'),wall=path.join(folder,'wall');for(const p of [app,remote,wall])fs.mkdirSync(p);
 fs.writeFileSync(path.join(app,'wallpaper.jpg'),Buffer.from([255,216,255,217]));fs.writeFileSync(path.join(remote,'remote.html'),'<html>test remote</html>');fs.writeFileSync(path.join(wall,'slideshow.json'),JSON.stringify({gallery:['missing.jpg'],selected:['missing.jpg'],interval:17,enabled:false,revision:3}));
 const remotePort=await freePort(),wallPort=await freePort(),children=[];let errors='';
 const controls=http.createServer((req,res)=>{let body='';req.on('data',b=>body+=b);req.on('end',()=>{assert.equal(JSON.parse(body).action,'health');assert.equal(req.headers['x-gathin-token'],'fixture');res.end('{"returnValue":true,"protocol":2}');});});await new Promise(r=>controls.listen(0,'127.0.0.1',r));
 function start(file,env){const child=spawn(process.execPath,[path.join(root,file)],{env:{...process.env,...env},stdio:['ignore','ignore','pipe'],windowsHide:true});child.stderr.on('data',b=>errors+=b);children.push(child);}
 try{
  start('payload/advanced/files/var/lib/webosbrew/gathin-remote/server.js',{GATHIN_REMOTE_DATA:remote,GATHIN_REMOTE_APP:app,GATHIN_REMOTE_PORT:String(remotePort),GATHIN_REMOTE_BIND:'127.0.0.1'});
  start('payload/advanced/files/var/lib/webosbrew/gathin-wallpaper/wallpaper-service.js',{WALL_DATA:wall,WALL_APP:app,WALL_PORT:String(wallPort),WALL_BIND:'127.0.0.1'});
  await until(()=>fs.existsSync(path.join(app,'remote-access.js'))&&fs.existsSync(path.join(app,'wall.js')));
  const rkey=fs.readFileSync(path.join(remote,'access-key'),'utf8').trim(),wkey=fs.readFileSync(path.join(wall,'access-key'),'utf8').trim();
  await until(async()=>{try{return (await fetch('http://127.0.0.1:'+remotePort+'/',{headers:{Cookie:'tvremote='+rkey}})).status===200;}catch{return false;}});
  const landing=await fetch('http://127.0.0.1:'+remotePort+'/?k='+rkey,{redirect:'manual'});assert.equal(landing.status,302);assert.match(landing.headers.get('set-cookie'),/tvremote=/);
  assert.equal((await fetch('http://127.0.0.1:'+remotePort+'/')).status,403);
  assert.equal((await fetch('http://127.0.0.1:'+wallPort+'/api/state')).status,403);
  const post=(route,data)=>fetch('http://127.0.0.1:'+wallPort+route+'?k='+wkey,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const upload=await fetch('http://127.0.0.1:'+wallPort+'/api/images?k='+wkey,{method:'POST',body:Buffer.from([255,216,255,217])}).then(r=>r.json());assert(upload.id);assert(fs.existsSync(path.join(app,upload.id)));assert.equal((await post('/api/settings',{selected:[upload.id],enabled:true,interval:17})).status,200);
  assert.equal((await post('/api/delete',{id:'../access-key'})).status,400);assert.equal((await post('/api/delete',{id:'wallpaper.jpg'})).status,400);assert.equal((await post('/api/delete',{id:upload.id})).status,200);assert(!fs.existsSync(path.join(app,upload.id)));assert(fs.existsSync(path.join(app,'wallpaper.jpg')));
  const saved=JSON.parse(fs.readFileSync(path.join(wall,'slideshow.json')));assert(!saved.gallery.includes(upload.id));assert.deepEqual(saved.selected,['wallpaper.jpg']);
  const state=await fetch('http://127.0.0.1:'+wallPort+'/api/state?k='+wkey).then(r=>r.json());assert.deepEqual(state.selected,['wallpaper.jpg']);assert.equal(state.interval,17);
  const places=[{name:'One',latitude:20,longitude:105},{name:'Two',latitude:21,longitude:106}];
  assert.equal((await post('/api/weather',{locations:places,displayCount:1})).status,200);
  let weather=await fetch('http://127.0.0.1:'+wallPort+'/api/state?k='+wkey).then(r=>r.json());assert.equal(weather.weatherDisplayCount,1);assert.equal(weather.weatherLocations.length,2,'The hidden second location is retained');
  assert.equal((await post('/api/weather',{displayCount:2})).status,200);assert.equal((await post('/api/weather',{displayCount:3})).status,400);assert.equal((await post('/api/weather',{locations:[places[0]],displayCount:2})).status,400);
  weather=JSON.parse(fs.readFileSync(path.join(wall,'slideshow.json')));assert.equal(weather.weatherDisplayCount,2);assert.match(fs.readFileSync(path.join(app,'wall.js'),'utf8'),/WEATHER_DISPLAY_COUNT=2/);
  // Run the production readiness probe against both actual services and a read-only controls fixture.
  fs.writeFileSync(path.join(app,'control-token.js'),'window.GATHIN_CONTROL_TOKEN="fixture";');let completed=0;const outcome={},probeErrors=[];
  function mapped(p){if(p.endsWith('/gathin-controls/bridge.token'))return null;if(p.startsWith('/media/developer/apps/usr/palm/applications/com.gathin.tvhome/'))return path.join(app,path.basename(p));if(p.includes('/gathin-remote/'))return path.join(remote,path.basename(p));if(p.includes('/gathin-wallpaper/'))return path.join(wall,path.basename(p));throw Error('Unexpected probe path');}
  vm.runInNewContext(require('../lib/runtime-health').probe(),{Buffer,process:outcome,console:{error:s=>probeErrors.push(s)},require(name){
   if(name==='fs')return {readFileSync(p,encoding){const file=mapped(p);return file?fs.readFileSync(file,encoding):'fixture';},statSync(p){return fs.statSync(mapped(p));}};
   if(name==='http')return {request(options,callback){options.port={18764:controls.address().port,8090:wallPort,8091:remotePort}[options.port];return http.request(options,res=>{callback(res);res.on('end',()=>completed++);});}};
   return require(name);
  }});
  await until(()=>completed===3);assert.notEqual(outcome.exitCode,1,probeErrors.join('\n'));
  fs.writeFileSync(path.join(app,'remote-access.js'),'window.TV_REMOTE_URL="";');fs.writeFileSync(path.join(app,'wall.js'),'window.WALL_URL="";');
  await until(()=>fs.readFileSync(path.join(app,'remote-access.js'),'utf8').includes(rkey)&&fs.readFileSync(path.join(app,'wall.js'),'utf8').includes(wkey));
 }catch(e){throw Error(e.message+'\n'+errors);}finally{
  await Promise.all(children.map(c=>new Promise(r=>{if(c.exitCode!==null)return r();c.once('exit',r);c.kill();})));await new Promise(r=>controls.close(r));fs.rmSync(folder,{recursive:true,force:true});
 }
});
