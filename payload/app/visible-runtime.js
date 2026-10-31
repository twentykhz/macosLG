(function(){
  'use strict';
  var timer=0,last=Date.now(),pending=null,period=10000,lastLunar=0,familySignature='';
  function jobs(advance){if(window.GathinWallpaperRefresh)window.GathinWallpaperRefresh(false);if(window.GathinWeather)window.GathinWeather.refresh();var family=JSON.stringify(window.GATHIN_FAMILY||[]);if(window.GathinLunarRefresh&&(family!==familySignature||Date.now()-lastLunar>=600000)){familySignature=family;lastLunar=Date.now();window.GathinLunarRefresh();}}
  function arm(){clearTimeout(timer);if(!document.hidden)timer=setTimeout(refresh,Math.max(1000,period-(Date.now()-last)));}
  function refresh(advance){if(document.hidden||pending)return;last=Date.now();var script=document.createElement('script');pending=script;script.src='wall.js?v='+last;script.onload=script.onerror=function(){if(script.parentNode)script.parentNode.removeChild(script);pending=null;if(!document.hidden){jobs(advance!==false);arm();}};document.head.appendChild(script);}
  document.addEventListener('visibilitychange',function(){clearTimeout(timer);if(document.hidden){if(pending){pending.onload=pending.onerror=null;if(pending.parentNode)pending.parentNode.removeChild(pending);pending=null;}if(window.GathinWeather&&window.GathinWeather.stop)window.GathinWeather.stop();}else refresh(false);});
  window.addEventListener('webOSRelaunch',function(){refresh(false);});
  arm();
}());
