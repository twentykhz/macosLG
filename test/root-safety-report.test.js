'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),ssh=require('../lib/ssh'),{AutorootSteps}=require('../lib/autoroot'),{parse}=require('../lib/tv-capabilities'),{transcript}=require('./helpers/tv-profiles');
test('already-rooted compatibility setup reminds removal and persistent SSH without rebooting or uninstalling',async()=>{
 const saved=ssh.luna,log=console.log,calls=[];let output='';
 ssh.luna=async(c,method)=>{calls.push(method);return method.endsWith('listApps')?{apps:[{id:'com.palmdts.devmode'}]}:{sshdEnabled:false};};console.log=(...s)=>{output+=s.join(' ')+'\n';};
 try{await AutorootSteps.prototype.remindRootSafety.call({client:{}});assert.match(output,/still installed/);assert.match(output,/SSH Server/);assert.deepEqual(calls,['com.webos.applicationManager/listApps','org.webosbrew.hbchannel.service/getConfiguration']);}
 finally{ssh.luna=saved;console.log=log;}
});
test('an unavailable getServiceInfo diagnostic is not reported as broken key injection',async()=>{
 const saved={luna:ssh.luna,exec:ssh.exec};const calls=[],caps=parse(transcript());
 ssh.luna=async(c,method)=>{calls.push(method);if(method.includes('networkinput/getServiceInfo'))throw Error('Unknown method "getServiceInfo" for category "/"');if(method.endsWith('getSystemInfo'))return {modelName:'55UM7400PTA',boardType:'K5LP_DVB_EU',firmwareVersion:'05.40.97'};if(method.endsWith('listApps'))return {apps:[{id:'com.gathin.tvhome'},{id:'org.webosbrew.hbchannel'}]};return {returnValue:true};};
 ssh.exec=async(c,cmd)=>{calls.push(cmd);return cmd==='id -u'?'0':cmd.includes('networkInterfaces')?'[]':'';};
 delete require.cache[require.resolve('../lib/post-install')];
 try{const result=await require('../lib/post-install').checkFeatures({__gathinCapabilities:Promise.resolve(caps)},{host:'192.0.2.93',readOnly:true});assert.equal(result.results.find(r=>r.feature==='network-input-service').status,'manual-check-required');assert(!calls.some(c=>/sendKeyCode|reboot|executeOneShot/.test(c)));}
 finally{ssh.luna=saved.luna;ssh.exec=saved.exec;delete require.cache[require.resolve('../lib/post-install')];}
});
