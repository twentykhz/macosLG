'use strict';
// Passive recognized-text router. No microphone recording, shell commands or QML patches.
var fs=require('fs'),cp=require('child_process'),path=require('path');
var ROOT='/var/lib/webosbrew/gathin-youtube-voice',MARKER='/home/root/DISABLE-GATHIN-YOUTUBE-VOICE',HELPER='/var/lib/webosbrew/gathin-controls/input-helper';
var ALIASES={'youtube':'youtube.leanback.v4','you tube':'youtube.leanback.v4','fpt play':'com.fpt.fptplay','fptplay':'com.fpt.fptplay','fpt':'com.fpt.fptplay','tv360':'com.viettel.media.tv360','tv 360':'com.viettel.media.tv360','netflix':'netflix','net flix':'netflix','trinh duyet':'com.webos.app.browser','browser':'com.webos.app.browser','homebrew':'org.webosbrew.hbchannel','lgws':'ooo.lew.lifesgoodwithoutspying','airplay':'airplay','trang chu':'com.gathin.tvhome','launcher':'com.gathin.tvhome','home':'com.gathin.tvhome','cai dat':'com.palm.app.settings','settings':'com.palm.app.settings'};
var extraAliases={'du tube':'youtube.leanback.v4','fpt plei':'com.fpt.fptplay','tv 3 60':'com.viettel.media.tv360','viettel tv':'com.viettel.media.tv360','net flit':'netflix','trinh duyet web':'com.webos.app.browser','safari':'com.webos.app.browser','home brew':'org.webosbrew.hbchannel','lg ws':'ooo.lew.lifesgoodwithoutspying','lg without spying':'ooo.lew.lifesgoodwithoutspying','air play':'airplay'};Object.keys(extraAliases).forEach(function(k){ALIASES[k]=extraAliases[k];});
function norm(s){s=String(s||'').toLowerCase().replace(/đ/g,'d');if(s.normalize)s=s.normalize('NFD').replace(/[\u0300-\u036f]/g,'');else{['àáảãạăằắẳẵặâầấẩẫậ','èéẻẽẹêềếểễệ','ìíỉĩị','òóỏõọôồốổỗộơờớởỡợ','ùúủũụưừứửữự','ỳýỷỹỵ'].forEach(function(chars,i){s=s.replace(new RegExp('['+chars+']','g'),'aeiouy'[i]);});}return s.replace(/[^a-z0-9%\s]/g,' ').replace(/\s+/g,' ').trim();}
function number(s){s=s.replace(/\s*(phan tram|percent|%)$/,'').trim();if(/^\d+$/.test(s))return Number(s);var d={khong:0,mot:1,hai:2,ba:3,bon:4,tu:4,nam:5,lam:5,sau:6,bay:7,tam:8,chin:9},p=s.split(' ');if(s==='mot tram'||s==='tram')return 100;if(p.length===1)return s==='muoi'?10:d[s];if(p[0]==='muoi'&&d[p[1]]!==undefined)return 10+d[p[1]];if(d[p[0]]!==undefined&&(p[1]==='muoi'||p[1]==='chuc'))return d[p[0]]*10+(d[p[2]]||0);return null;}
function parse(raw,searchContext){
 var s=norm(raw),m;if(!s||s.length>500)return null;s=s.replace(/^(?:(?:hay|vui long|lam on)\s+)+/,'').replace(/\s+(giup toi|giup minh|nhe|di)$/,'');
 var explicit=/^(tim|tim kiem|search|find|xem|phat|video|bai hat)\b/.test(s);
 if(!explicit){
  if(/^(mo|bat|vao|open) (tv|tivi|ti vi)$/.test(s))return {action:'open_tv'};
  if(/^(tat|turn off|power off) (tv|tivi|ti vi|television)$/.test(s))return {action:'power_off'};
  if(/^(khoi dong lai|reboot|restart) (tv|tivi|ti vi)$/.test(s))return {action:'reboot'};
  m=s.match(/^(?:(?:mo|bat|chuyen|chon|vao|open|switch to)\s+)?(?:sang\s+)?(?:cong\s+|nguon\s+)?hdmi\s*([1-4]|mot|hai|ba|bon)$/);if(m)return {action:'open',app:'com.webos.app.hdmi'+number(m[1])};
  m=s.match(/^(mo|bat|vao|open|launch) (.+)$/);if(m&&ALIASES[m[2].replace(/^(ung dung|app) /,'')])return {action:'open',app:ALIASES[m[2]]};
  m=s.match(/^(dong|tat|thoat|close|exit) (.+)$/);if(m){if(/^(ung dung|app)( hien tai| dang mo)?$/.test(m[2]))return {action:'close_current'};if(ALIASES[m[2]])return {action:'close',app:ALIASES[m[2]]};}
  if(/^(tat tieng|im lang|mute)$/.test(s))return {action:'mute',muted:true};if(/^(bat tieng|mo tieng|unmute)$/.test(s))return {action:'mute',muted:false};
  m=s.match(/^(?:(tang|giam|dat|chinh|dieu chinh|cho|set|increase|decrease|lower|raise)\s+)?(am luong|volume|do sang man hinh|do sang|den nen|brightness)(?:\s+(.*))?$/);
  if(m){var tail=m[3]||'',relative=/\b(them|bot|di|by)\b/.test(tail),value=number(tail.replace(/^(?:(?:den|ve|len|xuong|la|muc|o muc|bang|to|them|bot|di|by)\s+)+/,'')),down=/^(giam|decrease|lower)$/.test(m[1]);if(!tail&&/^(tang|giam|increase|decrease|lower|raise)$/.test(m[1])){relative=true;value=5;}if(value!==null&&value>=0&&value<=100)return {action:/^(am luong|volume)$/.test(m[2])?'volume':'backlight',relative:relative,value:relative&&down?-value:value};return null;}
 }
 if(/^(tat|tang|giam|dung|tam dung|tiep tuc|turn |volume|mute|pause|stop|resume)/.test(s)||/\b(roi|va|then|and) (tat|tang|giam|turn|switch|pause)\b/.test(s))return null;
 if(!searchContext&&!/\byou\s*tube\b/.test(s)&&!(/\bvideos?\b/.test(s)&&explicit))return null;
 if(searchContext&&/^(thoi tiet|weather|may gio|what time|wifi|network|settings|cai dat|hdmi|kenh|am luong|volume)\b/.test(s))return null;
 // Strip only edge grammar from the original string to retain accented keywords.
 var keyword=String(raw).trim().replace(/^(?:(?:hãy|vui lòng|làm ơn|tìm kiếm|tìm|search for|search|find|xem|watch|phát|play|mở|open|you\s*tube|videos?|bài hát|ca sĩ|nghệ sĩ)\b[\s,:-]*)+/i,'').replace(/(?:\s+(?:trên|on|in|bằng))?\s+you\s*tube[\s.!?]*$/i,'').trim();
 var original=String(raw).trim(),words=original.split(/\s+/);while(words.length&&/^(hay|vui|long|lam|on|tim|kiem|search|for|find|xem|watch|phat|play|mo|open|youtube|video|videos|bai|hat)$/.test(norm(words[0])))words.shift();keyword=words.join(' ').replace(/(?:\s+(?:trên|on|in|bằng))?\s+you\s*tube[\s.!?]*$/i,'').trim();if(!keyword)return null;
 return {action:'youtube',keyword:keyword};
}
function inspect(message){
 if(!message||message.transport!=='TX')return null;var p=message.payload||{};if(typeof p!=='object')return null;
 if(message.type==='call'&&message.destination==='com.webos.service.nlp'&&message.method==='startSearch')return parse(p.query,true);
 if(message.type!=='return'||message.sender!=='com.webos.service.nlp'||p.returnValue===false)return null;
 var result=p.result||p,rows=result.ResponseData||[result],system=false,route=null;if(!Array.isArray(rows))return null;
 rows.forEach(function(row){
  if(!row||typeof row!=='object')return;var labels=[row.ServiceType,row.serviceType,row.domain,row.intent,row.ActionType].map(norm).join(' ');
  if(/\b(tv control|tvcontrol|setvolume|volumeup|volumedown|volume|poweroff|power|settings|input|hdmi|channel|network|wifi|switchinput|changeinput|changechannel|opensettings|pause|stop|resume)\b/.test(labels))system=true;
  var a=row.ActionData||row,kind=norm(row.ActionType||row.intent),media=[a.domain,a.provider,a.contentType,a.mediaType,a.category,a.appId,a.contents_set_id].join(' ');
  if(/search|play|find/.test(kind)&&/youtube|\bvideo\b/.test(media+' '+kind)){var q=a.query||a.keyword||a.searchKeyword||a.intentParam||a.title;if(typeof q==='string'&&q.length&&q.length<=500)route={action:'youtube',keyword:q};}
  if(Array.isArray(a.launch_data))a.launch_data.forEach(function(launch){var params=(launch||{}).params||{},target=(params.params||{}).target;if(params.id!=='youtube.leanback.v4')return;var q;if(target&&typeof target==='object')q=target.intentParam;else if(typeof target==='string'&&target.indexOf('q=')===0){try{q=decodeURIComponent(target.slice(2).replace(/\+/g,' '));}catch(e){}}if(typeof q==='string'&&q.length&&q.length<=500)route={action:'youtube',keyword:q};});
 });
 if(system)return {system:true};if(route)return route;
 if(message.type==='return'&&message.sender==='com.webos.service.nlp'&&p.returnValue!==false&&p.event==='sttResult'&&!((p.sttSymbol||[]).length)){var text=Array.isArray(p.sttResult)?p.sttResult[0]:p.recognizedText||p.text||(p.sttResult||{}).text;return typeof text==='string'?parse(text,true):null;}return null;
}
function call(api,data){return new Promise(function(resolve){var child=cp.execFile('/usr/bin/luna-send',['-w','3000','-n','1','luna://'+api,JSON.stringify(data||{})],{timeout:5000,maxBuffer:1048576},function(e,out){try{var r=JSON.parse(out);resolve(e?{returnValue:false}:r);}catch(x){resolve({returnValue:false});}});child.on('error',function(){resolve({returnValue:false});});});}
function execute(route,luna){
 luna=luna||call;var a=route.action,launch='com.webos.applicationManager/launch';
 if(a==='youtube')return luna(launch,{id:'youtube.leanback.v4',params:{target:'q='+encodeURIComponent(route.keyword)}});
 if(a==='open_tv'){var id;try{id=JSON.parse(fs.readFileSync('/var/lib/webosbrew/gathin-hdmi/usage.json')).appId;}catch(e){}return luna(launch,{id:/^com\.webos\.app\.hdmi[1-4]$/.test(id)?id:'com.webos.app.inputmgr'});}
 if(a==='open'&&(Object.keys(ALIASES).some(function(k){return ALIASES[k]===route.app;})||/^com\.webos\.app\.hdmi[1-4]$/.test(route.app)))return luna(launch,{id:route.app});
 if(a==='mute')return luna('com.webos.audio/setMuted',{muted:route.muted});
 if(a==='volume'||a==='backlight'){
  var get=a==='volume'?'com.webos.audio/getVolume':'com.webos.service.settings/getSystemSettings',data=a==='volume'?{}:{category:'picture',keys:['backlight']};return luna(get,data).then(function(r){var current=a==='volume'?(r.volumeStatus||r).volume:(r.settings||{}).backlight;if(r.returnValue===false||current===undefined)return {returnValue:false};var n=route.relative?Math.max(0,Math.min(100,Number(current)+route.value)):route.value;if(!isFinite(n)||n<0||n>100)return {returnValue:false};return luna(a==='volume'?'com.webos.audio/setVolume':'com.webos.service.settings/setSystemSettings',a==='volume'?{volume:n}:{category:'picture',settings:{backlight:String(n)}});});
 }
 if(a==='close'||a==='close_current')return (a==='close'?Promise.resolve({appId:route.app}):luna('com.webos.applicationManager/getForegroundAppInfo',{})).then(function(r){var id=r.appId;if(!Object.keys(ALIASES).some(function(k){return ALIASES[k]===id;})&&!/^com\.webos\.app\.hdmi[1-4]$/.test(id))return {returnValue:false};return luna(launch,{id:'com.gathin.tvhome'}).then(function(){return id==='com.gathin.tvhome'||/^com\.webos\.app\.hdmi/.test(id)?{returnValue:true}:luna('com.webos.applicationManager/closeByAppId',{id:id});});});
 if(a==='power_off')return luna('com.webos.service.tvpower/power/powerOff',{reason:'remoteKey'});if(a==='reboot')return luna('com.webos.service.sleep/shutdown/machineReboot',{reason:'remoteKey'});return Promise.resolve({returnValue:false});
}
function main(){
 var monitor=null,buffer='',pending=null,timer=0,last='',lastAt=0,retries=0,closed=false;
 function log(s){try{var file=ROOT+'/router.log';if(fs.existsSync(file)&&fs.statSync(file).size>32768)fs.renameSync(file,file+'.previous');fs.appendFileSync(file,new Date().toISOString()+' '+s+'\n');}catch(e){}}
 function finish(){closed=true;clearTimeout(timer);clearInterval(watch);if(monitor)monitor.kill('SIGTERM');try{fs.unlinkSync(ROOT+'/router.ready');}catch(e){}}
 function start(){if(closed||fs.existsSync(MARKER))return finish();buffer='';monitor=cp.spawn(HELPER,['--monitor-nlp'],{stdio:['ignore','pipe','ignore']});monitor.on('error',function(){log('monitor unavailable');finish();});monitor.stdout.on('data',function(b){buffer+=b.toString();if(buffer.length>1048576)buffer='';var at;while((at=buffer.indexOf('\n'))>=0){var line=buffer.slice(0,at).trim();buffer=buffer.slice(at+1);try{var message=JSON.parse(line),route=inspect(message);if((message.payload||{}).event==='sttStart'){pending=null;clearTimeout(timer);}if(route&&route.system){pending=null;clearTimeout(timer);}else if(route){pending=route;clearTimeout(timer);timer=setTimeout(function(){var command=pending;pending=null;if(!command)return;var key=JSON.stringify(command);if(key===last&&Date.now()-lastAt<3000)return;last=key;lastAt=Date.now();call('com.webos.applicationManager/closeByAppId',{id:'com.webos.app.voiceview'}).then(function(){return call('com.webos.service.nlp/cancel',{});}).then(function(){if(fs.existsSync('/usr/palm/applications/com.webos.app.voiceagent/Main.qml'))return call('com.webos.service.sysuicompmgr/launch',{appId:'com.webos.app.voiceagent',main:'file://usr/palm/applications/com.webos.app.voiceagent/Main.qml',params:{activateType:'keyhandler',launchMode:'BACK',pressed:true}});}).then(function(){return execute(command);}).then(function(r){log('action='+command.action+' accepted='+(r.returnValue!==false));}).catch(function(){log('action failed');});},350);}}catch(e){}}});monitor.on('exit',function(){if(closed)return;if(++retries>5)return finish();setTimeout(start,1000);});fs.writeFileSync(ROOT+'/router.ready',String(process.pid));log('recognized-result monitor started');}
 var watch=setInterval(function(){if(fs.existsSync(MARKER))finish();},500);process.on('SIGTERM',finish);process.on('SIGINT',finish);start();
}
module.exports={normalize:norm,number:number,parse:parse,inspect:inspect,execute:execute,main:main};if(require.main===module)main();
