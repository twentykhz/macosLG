(function () {
  'use strict';
  var box=document.createElement('section');box.id='multiWeather';box.setAttribute('aria-label','Thời tiết');
  document.querySelector('header').appendChild(box);
  window.addEventListener('keydown',function(e){var el=document.activeElement;if(!el||!el.classList||!el.classList.contains('mw-count-toggle'))return;if(e.keyCode===13)el.click();else if(e.keyCode===461||e.keyCode===27){if(window.GathinWidgetUI)window.GathinWidgetUI.focus(0);}else return;e.preventDefault();e.stopImmediatePropagation();},true);
  var cards=[],signature='',requests=[],lastRead=0;
  var labels={0:'Quang đãng',1:'Trời quang',2:'Có mây',3:'Nhiều mây',45:'Sương mù',48:'Sương mù',51:'Mưa phùn',53:'Mưa phùn',55:'Mưa phùn dày',56:'Mưa phùn đóng băng',57:'Mưa phùn đóng băng',61:'Mưa nhẹ',63:'Mưa',65:'Mưa to',66:'Mưa đóng băng',67:'Mưa đóng băng lớn',71:'Tuyết nhẹ',73:'Tuyết',75:'Tuyết dày',77:'Mưa tuyết',80:'Mưa rào',81:'Mưa rào',82:'Mưa rào mạnh',85:'Mưa tuyết rào',86:'Mưa tuyết rào mạnh',95:'Mưa giông',96:'Mưa giông có mưa đá',99:'Mưa giông có mưa đá lớn'};
  function icon(code){
    var sun='<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2m0-16-2 2M6 18l-2 2"/>';
    var cloud='<path d="M6 16h12a4 4 0 0 0 0-8 6 6 0 0 0-11-1A4.5 4.5 0 0 0 6 16z"/>';
    var snow=[71,73,75,77,85,86].indexOf(code)>=0;
    return '<svg viewBox="0 0 24 24" class="'+(code<2?'sun':snow?'snow':'cloud')+'" aria-hidden="true">'+(code<2?sun:cloud+(snow?'<path d="M6 20h.1m6 0h.1m6 0h.1"/>':code>=95?'<path d="m12 17-3 4h5l-3 3"/>':code>=51?'<path d="m7 19-1 3m7-3-1 3m7-3-1 3"/>':''))+'</svg>';
  }
  function paint(card,value,stale){
    if(!value){card.querySelector('.mw-status').textContent='Chưa cập nhật được';return;}
    card.querySelector('.mw-temp').textContent=Math.round(value.temp)+'°';
    card.querySelector('.mw-condition').textContent=labels[value.code]||'Thời tiết';
    card.querySelector('.mw-range').textContent='↑'+Math.round(value.high)+'°  ↓'+Math.round(value.low)+'°';
    card.querySelector('.mw-icon').innerHTML=icon(value.code);
    card.querySelector('.mw-status').textContent=stale?'Dữ liệu đã lưu · đang chờ mạng':'';
  }
  function refresh(){
    var configured=window.WEATHER_LOCATIONS||[],count=Number(window.WEATHER_DISPLAY_COUNT)||Math.min(2,configured.length),places=configured.slice(0,count);if(places.length<1||places.length>2)return;
    var key=JSON.stringify(places),changed=signature!==key;
    if(!changed&&Date.now()-lastRead<10*60*1000)return;
    lastRead=Date.now();
    if(changed){requests.forEach(function(r){r.abort();});requests=[];signature=key;box.innerHTML='<article id="weatherCombined" class="mw-card"></article>';var combined=document.getElementById('weatherCombined');combined.setAttribute('aria-label','Thời tiết '+places.length+' địa điểm');combined.className='mw-card mw-count-'+places.length;var toggle=document.createElement('button');toggle.className='mw-count-toggle';toggle.type='button';toggle.textContent=places.length+' địa điểm';toggle.title='Đổi số địa điểm hiển thị';toggle.disabled=configured.length<2;toggle.onclick=function(e){e.stopPropagation();if(!window.MacTvControlRequest)return;toggle.disabled=true;window.MacTvControlRequest('weather_display',{count:places.length===1?2:1},function(r){if(r.returnValue===true){window.WEATHER_DISPLAY_COUNT=r.displayCount;window.WEATHER_LOCATIONS=r.locations;refresh();var next=box.querySelector('.mw-count-toggle');if(next)next.focus();}else{toggle.disabled=false;toggle.title=r.errorText||'Không lưu được cấu hình';}});};box.appendChild(toggle);cards=places.map(function(place){var card=document.createElement('article');card.className='mw-place';card.innerHTML='<div class="mw-location"></div><div class="mw-main"><span class="mw-temp">—°</span><span class="mw-icon"></span></div><div class="mw-bottom"><span class="mw-condition">Đang cập nhật…</span><span class="mw-range">↑—° ↓—°</span></div><div class="mw-status"></div>';var name=window.GathinPlaceName(place);card.querySelector('.mw-location').textContent=name;card.setAttribute('aria-label','Thời tiết '+name);combined.appendChild(card);return card;});}
    requests=[];
    places.forEach(function(place,index){
      var cacheKey='gathin.weather.'+place.latitude+','+place.longitude,cached=null;
      try{cached=JSON.parse(localStorage.getItem(cacheKey));if(cached)paint(cards[index],cached,Date.now()-cached.time>30*60*1000);}catch(e){}
      var xhr=new XMLHttpRequest(),requestKey=key,card=cards[index];requests.push(xhr);
      function fail(){var at=requests.indexOf(xhr);if(at>=0)requests.splice(at,1);if(signature!==requestKey)return;paint(card,cached,true);}
      xhr.open('GET','https://api.open-meteo.com/v1/forecast?latitude='+place.latitude+'&longitude='+place.longitude+'&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto',true);xhr.timeout=15000;
      xhr.onload=function(){var at=requests.indexOf(xhr);if(at>=0)requests.splice(at,1);if(signature!==requestKey)return;if(xhr.status!==200)return fail();try{var d=JSON.parse(xhr.responseText),value={temp:d.current.temperature_2m,code:d.current.weather_code,high:d.daily.temperature_2m_max[0],low:d.daily.temperature_2m_min[0],time:Date.now()};if([value.temp,value.code,value.high,value.low].some(function(v){return typeof v!=='number'||!isFinite(v);}))throw Error('Invalid weather');paint(card,value,false);try{localStorage.setItem(cacheKey,JSON.stringify(value));}catch(e){}}catch(e){fail();}};
      xhr.onerror=xhr.ontimeout=fail;xhr.send();
    });
  }
  window.GathinWeather={refresh:refresh,stop:function(){if(requests.length)lastRead=0;requests.forEach(function(r){r.onload=r.onerror=r.ontimeout=null;r.abort();});requests=[];},icon:icon,describe:function(code){return labels[code]||'Thời tiết';}};refresh();

}());
