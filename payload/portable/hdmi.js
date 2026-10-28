'use strict';
// Same viewing-time rules as the reference tracker, implemented with Node builtins.
var fs=require('fs'),cp=require('child_process'),path=require('path');
var root=process.env.GATHIN_HDMI_DATA||'/var/lib/webosbrew/gathin-hdmi',app=process.env.GATHIN_HDMI_APP||'/media/developer/apps/usr/palm/applications/com.gathin.tvhome',file=root+'/usage.json';
var ports=[1,2,3,4].map(function(n){return 'com.webos.app.hdmi'+n;}),stopping=false;
function load(){var old;try{old=JSON.parse(fs.readFileSync(file,'utf8'));}catch(e){old={};}var seconds={};ports.forEach(function(p){var n=Number((old.seconds||{})[p]||0);seconds[p]=isFinite(n)&&n>=0?n:0;});return {seconds:seconds,appId:ports.indexOf(old.appId)>=0?old.appId:null};}
function record(data,previous,current,elapsed,active){if(active&&previous===current&&ports.indexOf(current)>=0&&elapsed>0&&elapsed<=25)data.seconds[current]+=elapsed;var best=Math.max.apply(Math,ports.map(function(p){return data.seconds[p];}));if(best>0){var winners=ports.filter(function(p){return data.seconds[p]===best;});data.appId=winners.indexOf(data.appId)>=0?data.appId:winners[0];}return data;}
function atomic(p,data){fs.writeFileSync(p+'.new',JSON.stringify(data));fs.renameSync(p+'.new',p);}
function luna(api,done){cp.execFile('/usr/bin/luna-send',['-w','2000','-n','1','luna://'+api,'{}'],{timeout:4000},function(e,out){try{var r=JSON.parse(out);done(!e&&r.returnValue!==false?r:{});}catch(ignore){done({});}});}
function clock(){return Number(fs.readFileSync('/proc/uptime','utf8').split(' ')[0]);}
function main(){var data=load(),previous=null,before=clock(),saved=before,dirty=false;atomic(path.join(app,'hdmi-choice.json'),{appId:data.appId});
 function sample(){if(stopping)return;luna('com.webos.service.tvpower/power/getPowerState',function(power){var active=power.state==='Active';function finish(current){if(stopping)return;var now=clock(),old=data.appId;record(data,previous,current,now-before,active);dirty=dirty||(active&&previous===current&&ports.indexOf(current)>=0);if(data.appId!==old)atomic(path.join(app,'hdmi-choice.json'),{appId:data.appId});if(dirty&&(now-saved>=60||data.appId!==old||ports.indexOf(current)<0)){atomic(file,data);dirty=false;saved=now;}previous=current;before=now;setTimeout(sample,15000);}if(active)luna('com.webos.applicationManager/getForegroundAppInfo',function(r){finish(r.appId||null);});else finish(null);});}
 ['SIGTERM','SIGINT'].forEach(function(s){process.on(s,function(){stopping=true;if(dirty)atomic(file,data);process.exit(0);});});sample();
}
module.exports={record:record,load:load};if(require.main===module)main();
