'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),cp=require('child_process');
const {python}=require('./helpers/host-tools');
function bridge(reply){const calls=[],module={exports:{}};vm.runInNewContext(fs.readFileSync('payload/portable/controls.js','utf8'),{module,Buffer,process:{env:{}},setTimeout(){},require(n){if(n==='./inputs')return require('../payload/portable/inputs');if(n==='fs')return {readFileSync:()=> 'fixture',existsSync:()=>false};if(n==='child_process')return {execFile(f,a,o,cb){const api=a[4].slice(7),data=JSON.parse(a[5]);calls.push({api,data});cb(null,JSON.stringify(reply(api,data)));}};return require(n);}});return {run:(a,d={})=>new Promise(r=>module.exports.run(a,d,r)),calls};}
test('NANO audio uses live speaker volume 10 instead of scenario 100, includes output and verifies readback',async()=>{
 let volume=10,muted=false,output='tv_speaker';const b=bridge((api,d)=>{
  if(api.endsWith('/getVolume'))return {returnValue:true,volume:100,muted:false};
  if(api.endsWith('/getStatus'))return {returnValue:true,volumeStatus:[{soundOutput:output,volume,muted}]};
  if(api.endsWith('/getSoundOutput'))return {returnValue:true,output};
  assert.equal(d.soundOutput,output);if(api.endsWith('/set'))volume=d.volume;if(api.endsWith('/muteSoundOut'))muted=d.mute;return {returnValue:true};
 });
 assert.equal((await b.run('volume')).volume,10);assert.equal((await b.run('volume_step',{delta:1})).volume,11);assert.equal((await b.run('mute_toggle')).muted,true);assert(!b.calls.some(c=>c.api.includes('com.webos.audio/')));
});
test('ambiguous outputs never write; failed setters still read back and never report verified',async()=>{
 const ambiguous=bridge(api=>api.endsWith('/getStatus')?{returnValue:true,volumeStatus:[{soundOutput:'tv_speaker',volume:10,muted:false},{soundOutput:'bt',volume:20,muted:false}]}:{returnValue:true});assert.equal((await ambiguous.run('set_volume',{volume:30})).returnValue,false);assert(!ambiguous.calls.some(c=>c.api.endsWith('/set')));
 let reads=0;const rejected=bridge(api=>{if(api.endsWith('/getStatus')){reads++;return {returnValue:true,volumeStatus:{soundOutput:'tv_speaker',volume:10,muted:false}};}if(api.endsWith('/getSoundOutput'))return {returnValue:true,output:'tv_speaker'};return {returnValue:false};});assert.equal((await rejected.run('set_volume',{volume:30})).verified,false);assert.equal(reads,2);
});
test('inventory excludes ghost HDMI4 and launch validation rechecks live hardware',async()=>{
 const b=bridge(api=>api.endsWith('/getExternalInputList')?{returnValue:true,devices:[1,2,3].map(n=>({id:'HDMI_'+n,connected:true}))}:{returnValue:true});assert.equal((await b.run('inputs')).inputs.length,3);assert.equal((await b.run('launch_input',{appId:'com.webos.app.hdmi4'})).returnValue,false);assert(!b.calls.some(c=>c.api.endsWith('/launch')));assert.equal((await b.run('launch_input',{appId:'com.webos.app.hdmi3'})).returnValue,true);
 const hdmi=require('../payload/portable/hdmi'),ids=[1,2,3].map(n=>'com.webos.app.hdmi'+n),data={seconds:Object.fromEntries(ids.map(i=>[i,0])),appId:null};hdmi.record(data,ids[1],ids[1],15,true,ids);assert.equal(data.appId,ids[1]);hdmi.record(data,'com.webos.app.hdmi4','com.webos.app.hdmi4',15,true,ids);assert.equal(data.appId,ids[1]);
});
test('actual WAM startup script supplies authenticated evidence; missing token and JS exceptions cannot pass',async()=>{
 async function browser(options={}){const b=bridge(()=>({returnValue:false})),listeners={},timers=[],posts=[],challenge='a'.repeat(64),window={MAC_RUNTIME_CHALLENGE:challenge,GATHIN_CONTROL_TOKEN:options.missing?undefined:'fixture',TV_REMOTE_URL:'remote',WALL_URL:'wall',GATHIN_FAMILY:[],WEATHER_LOCATIONS:[{},{}],WALL_STATE:{selected:['wallpaper.jpg']},addEventListener:(k,f)=>listeners[k]=f};const context={window,Array,document:{hidden:false,getElementById:()=>({}),addEventListener(){}},setTimeout:f=>timers.push(f),setInterval(){},XMLHttpRequest:function(){this.open=()=>{};this.setRequestHeader=(k,v)=>{if(k==='X-Gathin-Token')assert.equal(v,'fixture');};this.send=async body=>{const d=JSON.parse(body);posts.push(d);const response=await b.run(d.action,d);this.status=200;this.responseText=JSON.stringify(response);this.onload();};}};vm.runInNewContext(fs.readFileSync('payload/app/runtime-check.js','utf8'),context);if(options.error)listeners.error({message:'fixture exception'});listeners.load();while(timers.length){timers.shift()();await new Promise(r=>setImmediate(r));}return {result:await b.run('app_runtime_status',{challenge}),posts};}
 const okay=await browser();assert.equal(okay.result.returnValue,true);assert.equal(okay.result.evidence.errorCount,0);assert.equal(okay.result.evidence.configReadable,true);assert.equal((await browser({missing:true})).result.pending,true);assert.equal((await browser({error:true})).result.evidence.errorCount,1);
 const b=bridge(()=>({}));assert.equal((await b.run('app_runtime_status',{challenge:'b'.repeat(64)})).pending,true,'root health alone is not WAM evidence');
});
test('HOME observer recognizes both LG states and never redirects HDMI, inputcommon or a changed foreground',{skip:!python},()=>{
 const code=`import runpy,sys,types
# Windows has no fcntl: this test covers pure routing policy, not OS locks or PTY.
if sys.platform=='win32':sys.modules['fcntl']=types.ModuleType('fcntl')
m=runpy.run_path('payload/home/observe-home.py'); assert m['blocked']('com.webos.app.home','launcher'); assert m['blocked']('com.webos.app.home','home')
for app in ['com.webos.app.hdmi1','com.webos.app.inputcommon','youtube.leanback.v4']:assert not m['blocked'](app,'launcher',True)
g=m['redirect'].__globals__; calls=[]; rows=[{'returnValue':True,'appId':'com.webos.app.home'},{'returnValue':True,'appId':'com.webos.app.hdmi1'},{'returnValue':True,'currentState':'launcher'}]
def call(api,data=None):
 calls.append(api)
 return rows.pop(0)
g['call']=call;g['strict_mode']=lambda:False;g['disabled']=lambda:False;g['time'].sleep=lambda s:None;m['redirect']('launcher');assert not any(x.endswith('/launch') for x in calls)
print('observer boundaries verified')`;
 const r=cp.spawnSync(python,['-c',code],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});
test('remote warns about black/dark frames before claiming success or downloading, without asserting DRM',()=>{
 const html=fs.readFileSync('payload/advanced/files/var/lib/webosbrew/gathin-remote/remote.html','utf8'),source=html.slice(html.indexOf('function frameVisible'),html.indexOf('async function inspectBlob'));let pixels=new Uint8ClampedArray(64*36*4);const context={document:{createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:pixels})})})}};vm.runInNewContext(source,context);assert.throws(()=>context.frameVisible({}),/chưa xác minh/);pixels.fill(200);assert.equal(context.frameVisible({}),true);assert(html.indexOf('await inspectBlob(blob)')<html.indexOf("link.download=name"));
});
test('device profile preserves native voice on observed voiceconductor and Node8',()=>{const resolve=require('../lib/device-profile').resolve;assert.equal(resolve({modelName:'55NANO753PR',boardType:'K7LP_DVB_EU',firmwareVersion:'03.53.45'},{nodeVersion:'v8.12.0'}).voiceRouter,false);assert.equal(resolve({}, {voiceFramework:'voiceconductor'}).voiceRouter,false);});

test('dock refresh reuses the renderer, retains selected app and attaches normal tile behavior',()=>{
 const source=fs.readFileSync('payload/app/app.js','utf8'),start=source.indexOf('function refreshDock(){'),end=source.indexOf('window.MacRefreshDock=',start),code=source.slice(start,end);const names=[];
 function el(){return {style:{},classList:{add(){}},appendChild(){}};}const context={x:[{app:{id:'keep'}}],N:0,U:null,g:{innerHTML:'',appendChild:e=>names.push(e)},v:{style:{}},document:{createElement:el},q:()=>[{id:'new',title:'New'},{id:'keep',title:'Keep'}],R:a=>a.title,et(){},nt(){},ct(){},wt(){}};vm.runInNewContext(code,context);context.refreshDock();assert.equal(context.x.length,2);assert.equal(context.N,1);assert.equal(typeof context.x[0].img.onload,'function');assert.equal(names.length,2);
});
