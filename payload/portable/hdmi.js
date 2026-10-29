'use strict';
var fs=require('fs'),cp=require('child_process'),path=require('path'),inventory=require('./inputs');
var root=process.env.GATHIN_HDMI_DATA||'/var/lib/webosbrew/gathin-hdmi',app=process.env.GATHIN_HDMI_APP||'/media/developer/apps/usr/palm/applications/com.gathin.tvhome',file=root+'/usage.json';
var stopping=false;
function load(ports){var old;try{old=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){old={};}ports=ports||[];var seconds={};ports.forEach(function(p){var n=Number((old.seconds||{})[p]||0);seconds[p]=isFinite(n)&&n>=0?n:0;});return {seconds:seconds,appId:ports.indexOf(old.appId)>=0?old.appId:null};}
function record(data,previous,current,elapsed,active,ports){ports=ports||Object.keys(data.seconds);if(active&&previous===current&&ports.indexOf(current)>=0&&elapsed>0&&elapsed<=25)data.seconds[current]=(data.seconds[current]||0)+elapsed;var best=Math.max.apply(Math,ports.map(function(p){return data.seconds[p]||0;}));if(best>0){var winners=ports.filter(function(p){return data.seconds[p]===best;});data.appId=winners.indexOf(data.appId)>=0?data.appId:winners[0];}else data.appId=null;return data;}
function atomic(p,data){fs.writeFileSync(p+'.new',JSON.stringify(data));fs.renameSync(p+'.new',p);if(p.indexOf(app+'/')===0)fs.chmodSync(p,420);}
function luna(api,done){cp.execFile('/usr/bin/luna-send',['-w','2000','-n','1','luna://'+api,'{}'],{timeout:4000},function(e,out){try{var r=JSON.parse(out);done(!e&&r.returnValue!==false?r:{});}catch(ignore){done({});}});}
function clock(){return Number(fs.readFileSync('/proc/uptime','utf8').split(' ')[0]);}
function main(){
 var data=null,rows=[],ports=[],previous=null,before=clock(),saved=before,dirty=false;
 function publish(){atomic(path.join(app,'hdmi-choice.json'),{appId:data&&data.appId,inputs:rows});}
 function sample(){if(stopping)return;luna('com.webos.service.apiadapter/tv/getExternalInputList',function(reply){var found=inventory.parse(reply);if(found===null){atomic(path.join(app,'hdmi-choice.json'),{appId:null,inputs:[],available:false});previous=null;before=clock();setTimeout(sample,15000);return;}rows=found;ports=rows.map(function(r){return r.appId;});if(!data){data=load(ports);atomic(file,data);}Object.keys(data.seconds).forEach(function(p){if(ports.indexOf(p)<0)delete data.seconds[p];});ports.forEach(function(p){if(data.seconds[p]===undefined)data.seconds[p]=0;});if(ports.indexOf(data.appId)<0)data.appId=null;
  luna('com.webos.service.tvpower/power/getPowerState',function(power){var active=power.state==='Active';function finish(current){if(stopping)return;var now=clock(),old=data.appId,row=rows.filter(function(p){return p.appId===current;})[0],viewing=active&&!!row&&row.connected!==false;record(data,previous,current,now-before,viewing,ports);dirty=dirty||(viewing&&previous===current&&now-before>0&&now-before<=25);publish();if(dirty&&(now-saved>=60||data.appId!==old||ports.indexOf(current)<0)){atomic(file,data);dirty=false;saved=now;}previous=current;before=now;setTimeout(sample,15000);}if(active)luna('com.webos.applicationManager/getForegroundAppInfo',function(r){finish(r.appId||null);});else finish(null);});
 });}
 ['SIGTERM','SIGINT'].forEach(function(s){process.on(s,function(){stopping=true;if(dirty&&data)atomic(file,data);process.exit(0);});});sample();
}
module.exports={record:record,load:load};if(require.main===module)main();
