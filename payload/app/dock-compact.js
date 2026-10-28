(function(){
  'use strict';
  var band=document.getElementById('dockBand'),style=document.createElement('style'),timer=0,inside=false,rect=null,pointer=null,frame=0;
  function measure(){var card=document.querySelector('.item .card');if(!card)return;var b=band.getBoundingClientRect(),top=document.getElementById('stage').getBoundingClientRect().top+card.parentNode.offsetTop+card.offsetTop,padding=Math.max(0,top-b.top),height=Math.ceil(card.offsetHeight+padding*2),expanded=Math.max(height+24,Math.round(b.height));
    var dockTop=1080-36-height,closedY=dockTop-b.top,openY=1080-36-expanded-b.top,clock=document.getElementById('clock').getBoundingClientRect(),widgetTop=Math.round((clock.bottom+dockTop-280)/2);
    style.textContent='body:not(.dock-names-visible) #dockBand{height:'+height+'px!important}body.dock-names-visible #dockBand{height:'+expanded+'px!important}body:not(.dock-names-visible) #viewport{transform:translateX(-50%) translateY('+closedY+'px)!important}body.dock-names-visible #viewport{transform:translateX(-50%) translateY('+openY+'px)!important}#multiWeather,#lunarWidget{top:'+widgetTop+'px!important}#viewport{transition:transform 160ms ease}#dockBand{transition:height 150ms ease}body:not(.dock-names-visible) .item .name{opacity:0!important}body.dock-names-visible .item.focused .name{opacity:1!important}';
  }
  function refresh(){rect=band.getBoundingClientRect();}
  function show(){clearTimeout(timer);document.body.classList.add('dock-names-visible');setTimeout(refresh,180);}
  function hide(){clearTimeout(timer);document.body.classList.remove('dock-names-visible');setTimeout(refresh,180);}
  document.head.appendChild(style);requestAnimationFrame(function(){measure();refresh();});window.addEventListener('resize',function(){measure();refresh();});
  document.addEventListener('mousemove',function(e){pointer={x:e.clientX,y:e.clientY};if(frame)return;frame=requestAnimationFrame(function(){frame=0;var r=rect;if(!r||!pointer)return;var over=pointer.x>=r.left&&pointer.x<=r.right&&pointer.y>=r.top&&pointer.y<=r.bottom;if(over&&!inside){inside=true;show();}else if(!over&&inside){inside=false;hide();}});},true);
  window.addEventListener('keydown',function(e){if(document.getElementById('widgetDetail')){hide();return;}if([37,39,13].indexOf(e.keyCode)>=0&&document.querySelector('.item.focused')){show();timer=setTimeout(function(){if(!inside)hide();},2200);}},true);
  document.addEventListener('visibilitychange',function(){if(document.hidden){inside=false;hide();}});
}());
