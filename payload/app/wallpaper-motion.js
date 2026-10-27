(function(){
  'use strict';
  var revision=null,index=0,preloadTimer=0,switchTimer=0,fadeTimer=0,image=null,ready='',due=0,lastSwitch=Date.now(),front=null,incoming=null,generation=0;
  var host=document.createElement('div');host.id='wallpaperMotion';host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:hidden;';
  var layers=[document.createElement('div'),document.createElement('div')];layers.forEach(function(l){l.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;background-repeat:no-repeat;opacity:0;visibility:hidden;';host.appendChild(l);});document.body.insertBefore(host,document.body.firstChild);document.body.style.backgroundImage='none';
  function files(){return (window.WALL_STATE&&window.WALL_STATE.selected)||[];}
  function paint(layer,name){if(!/^wall-[0-9a-f]+\.(jpg|png|webp)$/.test(name))return;var crop=(window.WALL_STATE.crops||{})[name];layer.style.backgroundImage='url("'+name+'")';layer.style.backgroundSize=crop?crop.sizeX+'% '+crop.sizeY+'%':'cover';layer.style.backgroundPosition=crop?crop.posX+'% '+crop.posY+'%':'center center';layer.style.visibility='visible';}
  function finish(){clearTimeout(fadeTimer);if(!incoming)return;var old=front;front=incoming;incoming=null;front.style.transition='none';front.style.opacity='1';front.style.zIndex='1';front.style.willChange='auto';if(old){old.style.visibility='hidden';old.style.backgroundImage='none';old.style.opacity='0';old.style.willChange='auto';}}
  function stop(){generation++;clearTimeout(preloadTimer);clearTimeout(switchTimer);clearTimeout(fadeTimer);preloadTimer=switchTimer=fadeTimer=0;finish();if(image){image.onload=image.onerror=null;image.src='data:,';image=null;}ready='';}
  function allowed(){return !document.hidden&&!document.body.classList.contains('widget-detail-open');}
  function change(){if(!allowed()){stop();return;}if(incoming)return;var list=files(),name=list[(index+1)%list.length];if(ready!==name)return;index=(index+1)%list.length;lastSwitch=Date.now();incoming=front===layers[0]?layers[1]:layers[0];var next=incoming,ticket=generation;next.style.transition='none';next.style.opacity='0';next.style.zIndex='2';next.style.willChange='opacity';
    requestAnimationFrame(function(){requestAnimationFrame(function(){if(ticket!==generation||!incoming)return;next.style.transition='opacity 1200ms linear';next.style.opacity='1';fadeTimer=setTimeout(function(){if(ticket!==generation)return;finish();schedule();},1250);});});
  }
  function schedule(){stop();var state=window.WALL_STATE;if(!allowed()||!state||!state.enabled||files().length<2)return;var interval=Math.max(5,Math.min(60,state.interval||30))*1000,remaining=Math.max(0,lastSwitch+interval-Date.now());due=Date.now()+remaining;
    preloadTimer=setTimeout(function(){if(!allowed())return;var name=files()[(index+1)%files().length],back=front===layers[0]?layers[1]:layers[0],ticket=generation;image=new Image();image.onload=function(){if(ticket!==generation)return;paint(back,name);back.style.opacity='0';back.style.zIndex='2';back.style.willChange='opacity';ready=name;if(Date.now()>=due)change();};image.onerror=function(){lastSwitch=Date.now();schedule();};image.src=name;},Math.max(0,remaining-4000));switchTimer=setTimeout(change,remaining);
  }
  function apply(){var state=window.WALL_STATE;if(!state||revision===state.revision)return;stop();revision=state.revision;index=0;var name=files()[0];if(!name)return;front=front||layers[0];paint(front,name);front.style.opacity='1';front.style.zIndex='1';lastSwitch=Date.now();schedule();}
  function resume(){lastSwitch=Date.now();schedule();}
  window.GathinWallpaperRefresh=apply;window.GathinWallpaperPause=stop;window.GathinWallpaperResume=resume;apply();
  document.addEventListener('visibilitychange',function(){if(document.hidden)stop();else resume();});
}());
