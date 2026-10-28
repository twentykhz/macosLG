'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {spawnSync}=require('node:child_process');
test('HDMI tile refreshes its label and destination; no history opens input picker',()=>{
 const names=[{textContent:'TV · HDMI'}],listeners={},requests=[];
 const app={id:'com.webos.app.hdmi3',title:'TV · HDMI 3'};
 const context={window:{TV_APPS:{apps:[app]}},document:{hidden:false,querySelectorAll:()=>names,addEventListener:(k,fn)=>{listeners[k]=fn;}},Date,setInterval(){},XMLHttpRequest:function(){requests.push(this);this.open=()=>{};this.send=()=>{};}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../payload/app/hdmi-shortcut.js'),'utf8'),context);
 assert.equal(context.window.GATHIN_TV_INPUT,'com.webos.app.inputmgr');
 const req=requests[0];req.status=0;req.responseText=JSON.stringify({appId:'com.webos.app.hdmi2'});req.onload();
 assert.equal(app.title,'TV · HDMI 2');assert.equal(names[0].textContent,'TV · HDMI 2');
 assert.equal(context.window.GATHIN_TV_INPUT,'com.webos.app.hdmi2');
 listeners.webOSRelaunch();requests[1].status=200;requests[1].responseText='{"appId":"untrusted.app"}';requests[1].onload();
 assert.equal(context.window.GATHIN_TV_INPUT,'com.webos.app.inputmgr');
});
test('adaptive TV launch preserves explicit HDMI 3 input selection',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../payload/app/app.js'),'utf8');
 const code=source.slice(source.indexOf('function K('),source.indexOf('function j('));const calls=[];
 const context={window:{GATHIN_TV_INPUT:'com.webos.app.hdmi1'},z:(uri,args)=>calls.push(args.id)};
 vm.runInNewContext(code,context);context.K('com.webos.app.hdmi3','TV · HDMI 1');context.K('com.webos.app.hdmi3','HDMI 3');
 assert.deepEqual(calls,['com.webos.app.hdmi1','com.webos.app.hdmi3']);
});
test('viewing duration, standby, failed samples, suspend gaps and voice use the learned port',()=>{
 const code=`import runpy, json, tempfile, os, io
t=runpy.run_path('payload/advanced/files/var/lib/webosbrew/gathin-hdmi/track.py')
p=t['PORTS']; data={'seconds':dict((x,0) for x in p),'appId':None}; record=t['record']
record(data,p[0],p[0],15,True); assert data['appId']==p[0]
record(data,p[1],p[1],20,True); assert data['appId']==p[1]
record(data,p[2],p[2],20,False); record(data,p[2],p[2],1000,True)
record(data,p[2],None,20,True); record(data,p[1],p[2],20,True)
assert data['seconds'][p[2]]==0
record(data,p[0],p[0],5,True); assert data['appId']==p[1]
with tempfile.TemporaryDirectory() as folder:
 file=os.path.join(folder,'usage.json'); t['atomic'](file,data)
 assert json.load(open(file))==data
 t['load'].__globals__['STATE']=file
 assert t['load']()==data
 open(file,'w').write('[]'); assert t['load']()['appId'] is None
v=runpy.run_path('payload/advanced/files/var/lib/webosbrew/gathin-youtube-voice/commands.py')
assert v['parse']('mo ti vi')['command']['action']=='open_tv'
assert v['parse']('mo hdmi 3')['command']['app']==p[2]
calls=[]
def call(uri,args): calls.append(args); return {'returnValue':True}
v['execute']({'action':'open_tv'},call)
assert calls[-1]['id']=='com.webos.app.inputmgr'
v['execute'].__globals__['open']=lambda path:io.StringIO(json.dumps(data))
v['execute']({'action':'open_tv'},call); assert calls[-1]['id']==p[1]
print('HDMI tracking and voice OK')`;
 const result=spawnSync('python',['-c',code],{cwd:path.resolve(__dirname,'..'),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||result.stdout);
});
