(function(){
  'use strict';
  var active=false,index=0,returnDock=null,returnTop=null,pending=0,loading=false;
  function cards(){return [document.getElementById('weatherCombined'),document.getElementById('lunarWidget'),document.getElementById('voiceSearch')].filter(function(c){return !!c;});}
  function focus(i){var list=cards();if(!list.length)return;if(active&&i===index&&document.activeElement===list[i])return;if(!active){returnDock=document.querySelector('.item.focused');returnTop=document.querySelector('.system-button.focused');if(returnDock)returnDock.classList.remove('focused');if(returnTop)returnTop.classList.remove('focused');}active=true;index=Math.max(0,Math.min(list.length-1,i));list.forEach(function(c,n){c.classList.toggle('widget-focused',n===index);});list[index].focus();}
  function leave(){active=false;cards().forEach(function(c){c.classList.remove('widget-focused');c.blur();});if(returnDock)returnDock.classList.add('focused');if(returnTop){returnTop.classList.add('focused');returnTop.focus();}}
  function close(){pending++;if(window.GathinDetails)window.GathinDetails.close();document.body.classList.remove('widget-detail-open');if(window.GathinWallpaperResume)window.GathinWallpaperResume();if(active&&cards()[index])cards()[index].focus();}
  function open(i){focus(i);if(i===2){if(window.GathinStartVoice)window.GathinStartVoice();return;}var ticket=++pending;document.body.classList.add('widget-detail-open');if(window.GathinWallpaperPause)window.GathinWallpaperPause();
    function show(){if(ticket!==pending||document.hidden)return;window.GathinDetails.open(i===1?'lunar':'weather',i===0?0:1,function(){document.body.classList.remove('widget-detail-open');if(active&&cards()[index])cards()[index].focus();});}
    if(window.GathinDetails){show();return;}
    if(loading){document.body.classList.remove('widget-detail-open');return;}loading=true;
    var script=document.createElement('script');script.src='widget-details.js?v=columns-20261027';script.onload=function(){loading=false;script.parentNode.removeChild(script);show();};script.onerror=function(){loading=false;if(script.parentNode)script.parentNode.removeChild(script);document.body.classList.remove('widget-detail-open');};document.head.appendChild(script);
  }
  function bind(){cards().forEach(function(card,i){if(card.getAttribute('data-widget-ready'))return;card.setAttribute('data-widget-ready','1');card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-haspopup','dialog');card.addEventListener('click',function(){open(i);});card.addEventListener('mouseover',function(){if(!document.querySelector('#widgetDetail')&&!document.body.classList.contains('widget-detail-open'))focus(i);});});}
  bind();new MutationObserver(bind).observe(document.getElementById('multiWeather'),{childList:true});
  window.addEventListener('mouseover',function(e){if(!active||document.getElementById('widgetDetail'))return;for(var node=e.target;node&&node!==document.body;node=node.parentNode){if(node.classList&&(node.classList.contains('item')||node.classList.contains('system-button'))){leave();return;}}},true);
  function blocked(){if(document.getElementById('powerMenu'))return true;var cc=document.getElementById('controlCenter'),qr=document.getElementById('wallpaperDialog');return cc&&!cc.classList.contains('cc-hidden')||qr&&qr.style.display!=='none';}
  window.addEventListener('keydown',function(e){var k=e.keyCode,detail=document.getElementById('widgetDetail');if(blocked()&&!detail)return;
    if(detail){if(k===461||k===27){if(!window.GathinDetails.back||!window.GathinDetails.back())close();}else if(k===13||k>=37&&k<=40)window.GathinDetails.key(k);else return;e.preventDefault();e.stopImmediatePropagation();return;}
    if(document.body.classList.contains('widget-detail-open')){if(k===461||k===27)close();e.preventDefault();e.stopImmediatePropagation();return;}
    if(active){if(k===37||k===39)focus(index+(k===37?-1:1));else if(k===13)open(index);else if(k===40||k===461||k===27){var top=!!returnTop;leave();if(k===40&&top)return;}else if(k===38){leave();return;}else return;e.preventDefault();e.stopImmediatePropagation();return;}
    if(k===40&&document.querySelector('.system-button.focused')){focus(1);e.preventDefault();e.stopImmediatePropagation();return;}if(k===38&&!document.body.classList.contains('editing')){focus(1);e.preventDefault();e.stopImmediatePropagation();}
  },true);
  window.addEventListener('keyup',function(e){if((active||document.getElementById('widgetDetail'))&&e.keyCode===13){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('visibilitychange',function(){if(document.hidden){close();leave();}});
  window.addEventListener('webOSRelaunch',close);
  window.GathinWidgetUI={open:open,close:close,focus:focus,leave:leave};
}());
