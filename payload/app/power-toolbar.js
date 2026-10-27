(function(){
  'use strict';
  var host=null,buttons=[],at=2,busy=false,xhr=null;
  function focus(index){at=Math.max(0,Math.min(buttons.length-1,index));buttons[at].focus();}
  function close(){if(host&&host.parentNode)host.parentNode.removeChild(host);host=null;buttons=[];if(xhr&&!busy)xhr.abort();xhr=null;busy=false;if(window.GathinWallpaperResume)window.GathinWallpaperResume();var button=document.getElementById('btnPower');if(button&&!document.hidden)button.focus();}
  function execute(action){if(busy)return;busy=true;buttons.forEach(function(b){b.disabled=true;});document.getElementById('powerMenuMessage').textContent=action==='power_off'?'Đang tắt TV…':'Đang khởi động lại TV…';
    xhr=new XMLHttpRequest();xhr.open('POST','http://127.0.0.1:18764/',true);xhr.setRequestHeader('Content-Type','application/json');xhr.setRequestHeader('X-Gathin-Token',window.GATHIN_CONTROL_TOKEN);xhr.timeout=9000;
    function fail(){busy=false;if(!host)return;buttons.forEach(function(b){b.disabled=false;});document.getElementById('powerMenuMessage').textContent='TV chưa thực hiện được. Hãy thử lại.';focus(2);}
    xhr.onload=function(){var result;try{result=JSON.parse(xhr.responseText);}catch(e){return fail();}if(result.returnValue===false)fail();};xhr.onerror=xhr.ontimeout=fail;xhr.send(JSON.stringify({action:action,confirmed:true}));
  }
  function show(){if(host){close();return;}if(window.GathinWallpaperPause)window.GathinWallpaperPause();host=document.createElement('div');host.id='powerMenuBackdrop';host.innerHTML='<section id="powerMenu" role="dialog" aria-modal="false" aria-label="Nguồn TV"><h2>Nguồn TV</h2><button type="button" id="powerOff">Tắt TV</button><button type="button" id="powerReboot">Khởi động lại TV</button><button type="button" id="powerCancel">Đóng</button><p id="powerMenuMessage" role="status"></p></section>';document.body.appendChild(host);buttons=Array.prototype.slice.call(host.querySelectorAll('button'));buttons[0].onclick=function(){execute('power_off');};buttons[1].onclick=function(){execute('power_reboot');};buttons[2].onclick=close;buttons.forEach(function(b,i){b.onmouseover=function(){if(!busy)focus(i);};});host.onclick=function(e){if(e.target===host&&!busy)close();};focus(2);}
  window.addEventListener('keydown',function(e){if(!host)return;var k=e.keyCode;if(k===461||k===27){if(!busy)close();}else if(k===38||k===37){if(!busy)focus(at-1);}else if(k===40||k===39){if(!busy)focus(at+1);}else if(k===13){if(!busy)buttons[at].click();}else return;e.preventDefault();e.stopImmediatePropagation();},true);
  window.addEventListener('keyup',function(e){if(host&&e.keyCode===13){e.preventDefault();e.stopImmediatePropagation();}},true);
  window.addEventListener('mousedown',function(e){if(host&&!busy&&!host.contains(e.target)&&!document.getElementById('btnPower').contains(e.target))close();},true);
  document.addEventListener('visibilitychange',function(){if(document.hidden&&host)close();});
  window.GathinPowerMenu={toggle:show};
}());
