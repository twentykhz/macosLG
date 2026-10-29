'use strict';
// Portable Luna-only controls. No input grab, QML patch, Python or model tuning.
var fs=require('fs'),http=require('http'),cp=require('child_process');
var inputs=require('./inputs');
var root=process.env.GATHIN_CONTROL_DATA||'/var/lib/webosbrew/gathin-controls',token=fs.readFileSync(root+'/bridge.token','utf8').trim();
if(!token)throw Error('Controls token is missing');
var appRuntime=null;
function luna(api,data,done){cp.execFile('/usr/bin/luna-send',['-w','6000','-n','1','luna://'+api,JSON.stringify(data)],{timeout:8000,maxBuffer:1048576},function(error,out){var r;try{r=JSON.parse(out);}catch(e){r={returnValue:false};}if(error||r.returnValue===false)r={returnValue:false,supported:false,errorText:'API unavailable on this TV'};done(r);});}
function integer(n){return typeof n==='number'&&isFinite(n)&&Math.floor(n)===n&&n>=0&&n<=100;}
function audioRow(r){var muted=typeof r.muted==='boolean'?r.muted:typeof r.mute==='boolean'?r.mute:r.muteStatus;return integer(r.volume)&&typeof muted==='boolean'?{volume:r.volume,muted:muted,soundOutput:r.soundOutput}:null;}
function audioStatus(done){
 luna('com.webos.service.audiooutput/audio/volume/getStatus',{},function(r){
  if(r.returnValue===false)return luna('com.webos.audio/getVolume',{},function(old){var row=audioRow(old.volumeStatus||old);done(old.returnValue===true&&row?{returnValue:true,volume:row.volume,muted:row.muted,engine:'legacy'}:{returnValue:false,supported:false,errorText:'TV volume unavailable'});});
  var values=Array.isArray(r.volumeStatus)?r.volumeStatus:r.volumeStatus?[r.volumeStatus]:[r],rows=values.map(audioRow).filter(function(a){return a&&typeof a.soundOutput==='string'&&a.soundOutput.length;});
  if(!rows.length)return done({returnValue:false,supported:false,errorText:'Audio output inventory has no usable TV volume'});
  luna('com.webos.service.apiadapter/audio/getSoundOutput',{},function(output){var selected=output.output||output.soundOutput,matches=rows.filter(function(a){return a.soundOutput===selected;}),row=matches.length===1?matches[0]:!selected&&rows.length===1?rows[0]:null;if(!row)return done({returnValue:false,supported:false,errorText:'Audio output is ambiguous; no output guessed'});done({returnValue:true,volume:row.volume,muted:row.muted,soundOutput:row.soundOutput,engine:'audiooutput'});});
 });
}
function audioWrite(kind,value,done){
 audioStatus(function(before){if(before.returnValue!==true)return done(before);var volume=kind==='step'?Math.max(0,Math.min(100,before.volume+value)):value,muted=kind==='toggle'?!before.muted:value;
  var isVolume=kind==='volume'||kind==='step',modern=before.engine==='audiooutput',api=modern?'com.webos.service.audiooutput/audio/volume/'+(isVolume?'set':'muteSoundOut'):'com.webos.audio/'+(isVolume?'setVolume':'setMuted'),data={};if(modern)data.soundOutput=before.soundOutput;data[isVolume?'volume':modern?'mute':'muted']=isVolume?volume:muted;
  luna(api,data,function(written){audioStatus(function(after){var okay=after.returnValue===true&&after.engine===before.engine&&after.soundOutput===before.soundOutput&&(isVolume?after.volume===volume:after.muted===muted);after.returnValue=okay&&written.returnValue===true;after.verified=after.returnValue;after.writeAccepted=written.returnValue===true;if(!okay)after.errorText='Audio write/readback mismatch or output changed';done(after);});});
 });
}
function run(action,data,done){
 if(action==='health')return done({returnValue:true,protocol:2,engine:'node',homeInterception:false});
 if(action==='app_runtime'&&/^[a-f0-9]{64}$/.test(data.challenge||'')&&typeof data.errorCount==='number'&&data.errorCount>=0&&data.errorCount<10000){appRuntime={challenge:data.challenge,tokenReadable:data.tokenReadable===true,backendProtocol:data.backendProtocol,stagePresent:data.stagePresent===true,configReadable:data.configReadable===true,errorCount:data.errorCount,testedAt:new Date().toISOString()};return done({returnValue:true});}
 if(action==='app_runtime_status')return done(appRuntime&&appRuntime.challenge===data.challenge?{returnValue:true,evidence:appRuntime}:{returnValue:false,pending:true});
 var methods={wifi_status:['com.webos.service.wifi/getstatus',{}],bluetooth_status:['com.webos.service.bluetooth2/adapter/getStatus',{}],volume:['com.webos.audio/getVolume',{}],backlight:['com.webos.service.settings/getSystemSettings',{category:'picture',keys:['backlight']}],picture:['com.webos.service.settings/getSystemSettings',{category:'picture',keys:['pictureMode']}],modes:['com.webos.service.settings/getSystemSettingValues',{category:'picture',key:'pictureMode'}],bt_devices:['com.webos.service.bluetooth2/device/getStatus',{}],settings_key:['com.webos.applicationManager/launch',{id:'com.palm.app.settings'}],input:['com.webos.surfacemanager/showInputPicker',{}],wifi_settings:['com.webos.applicationManager/launch',{id:'com.palm.app.settings',params:{target:'network'}}],bt_settings:['com.webos.applicationManager/launch',{id:'com.palm.app.settings',params:{target:'sound'}}]};
 if(action==='wifi_status')return luna(methods.wifi_status[0],{},function(r){if(r.returnValue!==false)return done(r);luna('com.palm.connectionmanager/getStatus',{},function(n){var w=n.wifi;if(n.returnValue===false||!w)return done(r);done({returnValue:true,status:w.state==='disabled'||w.state==='off'?'serviceDisabled':'serviceEnabled',networkInfo:{ssid:w.ssid||'',connectState:w.state==='connected'?'connected':'disconnected'}});});});
 if(action==='set_wifi'&&['enabled','disabled'].indexOf(data.state)>=0)return luna('com.webos.service.wifi/setstate',{state:data.state},done);
 if(action==='set_bluetooth'&&typeof data.powered==='boolean')return luna('com.webos.service.bluetooth2/adapter/setState',{powered:data.powered,adapterAddress:data.adapterAddress},done);
 if(action==='volume')return audioStatus(done);
 if(action==='inputs'||action==='launch_input')return luna('com.webos.service.apiadapter/tv/getExternalInputList',{},function(r){var rows=inputs.parse(r);if(rows===null)return done({returnValue:false,supported:false,errorText:'Physical input inventory unavailable; app registry is not a port inventory'});if(action==='inputs')return done({returnValue:true,inputs:rows});if(!rows.some(function(p){return p.appId===data.appId;}))return done({returnValue:false,supported:false,errorText:'HDMI port not reported by this TV'});luna('com.webos.applicationManager/launch',{id:data.appId},done);});
 if(action==='set_volume'&&integer(data.volume))return audioWrite('volume',data.volume,done);
 if(action==='volume_step'&&typeof data.delta==='number'&&Math.abs(data.delta)<=10&&Math.floor(data.delta)===data.delta)return audioWrite('step',data.delta,done);
 if(action==='set_muted'&&typeof data.muted==='boolean')return audioWrite('mute',data.muted,done);
 if(action==='mute_toggle')return audioWrite('toggle',null,done);
 if(action==='set_backlight'&&integer(data.value))return luna(methods.backlight[0],methods.backlight[1],function(r){if(r.returnValue===false||!r.settings||r.settings.backlight===undefined)return done({returnValue:false,supported:false});luna('com.webos.service.settings/setSystemSettings',{category:'picture',settings:{backlight:String(data.value)}},done);});
 if(action==='set_picture')return luna(methods.modes[0],methods.modes[1],function(r){var rows=(r.values||{}).arrayExt||[];if(!rows.some(function(m){return m.value===data.mode&&m.active!==false&&m.visible!==false;}))return done({returnValue:false,supported:false});luna('com.webos.service.settings/setSystemSettings',{category:'picture',settings:{pictureMode:data.mode}},done);});
 if(action==='bt_connect')return luna(methods.bt_devices[0],{},function(r){var rows=r.devices||[],valid=rows.some(function(d){return d.address===data.address&&d.paired&&d.classOfDevice!==7936&&(d.connectedProfiles||[]).indexOf('hid')<0;});if(!valid)return done({returnValue:false,supported:false});luna('com.webos.service.bluetooth2/a2dp/connect',{address:data.address},done);});
 if(action==='voice_search')return luna('com.webos.applicationManager/listApps',{},function(r){var ids=['com.webos.app.voice','com.webos.app.voiceagent'],app=(r.apps||[]).filter(function(a){return ids.indexOf(a.id)>=0;})[0];if(!app){if(fs.existsSync('/usr/palm/applications/com.webos.app.voiceagent/Main.qml'))return luna('com.webos.service.sysuicompmgr/launch',{appId:'com.webos.app.voiceagent',main:'file://usr/palm/applications/com.webos.app.voiceagent/Main.qml',params:{activateType:'mrcu',launchMode:'voice',pressed:true,walkietalkie:false}},done);return done({returnValue:false,supported:false,errorText:'Native microphone API unavailable; use physical microphone button'});}luna('com.webos.applicationManager/launch',{id:app.id},done);});
 if((action==='power_off'||action==='power_reboot')&&data.confirmed===true){if(action==='power_off')return luna('com.webos.service.tvpower/power/powerOff',{reason:'remoteKey'},done);setTimeout(function(){cp.execFile('/sbin/reboot',[],function(){});},1000);return done({returnValue:true});}
 if(Object.prototype.hasOwnProperty.call(methods,action))return luna(methods[action][0],methods[action][1],done);
 done({returnValue:false,supported:false,errorText:'Unsupported action or invalid arguments'});
}
function serve(){return http.createServer(function(req,res){
 function reply(code,data){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type,X-Gathin-Token','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Private-Network':'true'});res.end(JSON.stringify(data));}
 if(req.method==='OPTIONS')return reply(200,{});if(req.method!=='POST')return reply(405,{});if(req.headers['x-gathin-token']!==token)return reply(403,{});
 var body='',ended=false;req.setTimeout(10000,function(){req.destroy();});req.on('data',function(b){if(ended)return;body+=b;if(Buffer.byteLength(body)>16384){ended=true;reply(413,{});}});req.on('end',function(){if(ended)return;var data;try{data=JSON.parse(body);}catch(e){return reply(400,{});}if(!data||typeof data!=='object')return reply(400,{});run(data.action,data,function(r){reply(200,r);});});
 }).listen(Number(process.env.GATHIN_CONTROL_PORT||18764),'127.0.0.1');}
module.exports={run:run,serve:serve,audioRow:audioRow};if(require.main===module)serve();
