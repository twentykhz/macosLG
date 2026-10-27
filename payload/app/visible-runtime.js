(function(){
  'use strict';
  var timer=0,last=Date.now(),pending=null,period=600000;
  function jobs(advance){if(window.GathinWallpaperRefresh)window.GathinWallpaperRefresh(false);if(window.GathinWeather)window.GathinWeather.refresh();if(window.GathinLunarRefresh)window.GathinLunarRefresh();}
  function arm(){clearTimeout(timer);if(!document.hidden)timer=setTimeout(refresh,Math.max(1000,period-(Date.now()-last)));}
  function refresh(advance){if(document.hidden||pending)return;last=Date.now();var script=document.createElement('script');pending=script;script.src='wall.js?v='+last;script.onload=script.onerror=function(){if(script.parentNode)script.parentNode.removeChild(script);pending=null;if(!document.hidden){jobs(advance!==false);arm();}};document.head.appendChild(script);}
  document.addEventListener('visibilitychange',function(){clearTimeout(timer);if(document.hidden){if(pending){pending.onload=pending.onerror=null;if(pending.parentNode)pending.parentNode.removeChild(pending);pending=null;}if(window.GathinWeather&&window.GathinWeather.stop)window.GathinWeather.stop();}else refresh(false);});
  window.addEventListener('webOSRelaunch',function(){refresh(false);});
  arm();
}());
