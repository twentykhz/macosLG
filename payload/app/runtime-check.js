(function(){
 'use strict';var errors=0,attempts=0;
 window.addEventListener('error',function(e){if(e.error||e.message)errors++;});
 window.addEventListener('unhandledrejection',function(){errors++;});
 function request(action,data,done){var x=new XMLHttpRequest();data=data||{};data.action=action;x.open('POST','http://127.0.0.1:18764/',true);x.setRequestHeader('Content-Type','application/json');x.setRequestHeader('X-Gathin-Token',window.GATHIN_CONTROL_TOKEN||'');x.timeout=4000;x.onload=function(){var r;try{r=JSON.parse(x.responseText);}catch(e){r={returnValue:false};}done(x.status===200?r:{returnValue:false});};x.onerror=x.ontimeout=function(){done({returnValue:false});};x.send(JSON.stringify(data));}
 function check(){
  if(!/^[a-f0-9]{64}$/.test(window.MAC_RUNTIME_CHALLENGE||''))return;
  if(!window.GATHIN_CONTROL_TOKEN){if(++attempts<15)setTimeout(check,1000);return;}
  request('health',{},function(r){if(r.returnValue!==true||r.protocol!==2){if(++attempts<15)setTimeout(check,1000);return;}
   var config=!!(window.TV_REMOTE_URL&&window.WALL_URL&&Array.isArray(window.GATHIN_FAMILY)&&Array.isArray(window.WEATHER_LOCATIONS)&&window.WEATHER_LOCATIONS.length===2&&window.WALL_STATE&&window.WALL_STATE.selected&&window.WALL_STATE.selected.length);
   if(!config&&++attempts<15){setTimeout(check,1000);return;}
   request('app_runtime',{challenge:window.MAC_RUNTIME_CHALLENGE,tokenReadable:true,backendProtocol:r.protocol,stagePresent:!!document.getElementById('stage'),configReadable:config,errorCount:errors},function(){});
  });
 }
 window.addEventListener('load',function(){setTimeout(check,1000);});
 document.addEventListener('visibilitychange',function(){if(!document.hidden)check();});
 setInterval(function(){if(!document.hidden)check();},15000);
}());
