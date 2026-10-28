(function () {
  'use strict';
  var panel, open = false, focusIndex = 0, bridges = [], busy = {}, volumeTimer, brightnessTimer;
  var state = {wifi:null, wifiConnected:false, bluetooth:null, brightness:null, adapter:null, volume:null, muted:false, mode:null, modes:[]};
  var holdTimer=0, held=false, keyPress=false;
  function stopHold(){clearTimeout(holdTimer);holdTimer=0;}
  function holdSettings(kind){held=true;rootCall(kind==='wifi'?'wifi_settings':'bt_settings',{},function(r){if(!failed(r))close();});}
  function startHold(kind){stopHold();held=false;holdTimer=setTimeout(function(){holdSettings(kind);},650);}
  var wifiName = '', bluetoothName = '';
  var unsupported={wifi:false,bluetooth:false,volume:false,brightness:false,mode:false};
  var names = {normal:'Tiêu chuẩn',vivid:'Sống động',eco:'Tiết kiệm điện',cinema:'Điện ảnh',sports:'Thể thao',game:'Trò chơi',hdrEffect:'Hiệu ứng HDR',technicolor:'Technicolor',expert1:'Chuyên gia · sáng',expert2:'Chuyên gia · tối'};
  function $(id) { return document.getElementById(id); }
  function rootCall(action, data, done) {
    var xhr=new XMLHttpRequest();data=data||{};data.action=action;
    xhr.open('POST','http://127.0.0.1:18764/',true);
    xhr.setRequestHeader('Content-Type','application/json');
    xhr.setRequestHeader('X-Gathin-Token',window.GATHIN_CONTROL_TOKEN);
    xhr.timeout=9000;
    xhr.onload=function(){var r;try{r=JSON.parse(xhr.responseText);}catch(e){r={returnValue:false};}if(xhr.status!==200){r.returnValue=false;r.serviceUnavailable=true;}if(done)done(r);};
    xhr.onerror=xhr.ontimeout=function(){if(done)done({returnValue:false,serviceUnavailable:true,errorText:'Local controls unavailable'});};
    xhr.send(JSON.stringify(data));
  }
  window.GathinOpenSettings=function(){rootCall('settings_key',{},function(r){if(r.returnValue===false){var bridge=new PalmServiceBridge();bridges.push(bridge);bridge.onservicecallback=function(){};bridge.call('luna://com.webos.applicationManager/launch',JSON.stringify({id:'com.palm.app.settings'}));}});};
  window.GathinVoiceSearch=function(done){rootCall('voice_search',{},function(r){if(r.returnValue===false)message('Không mở được tìm kiếm giọng nói');if(done)done(r);});};
  window.GathinNativeInput=function(){rootCall('input',{},function(r){if(r.returnValue===false)message('Input menu unavailable');});};
  function call(endpoint, data, done, subscription) {
    var rootActions={'com.webos.service.wifi/getstatus':'wifi_status','com.webos.service.wifi/setstate':'set_wifi','com.webos.service.bluetooth2/adapter/getStatus':'bluetooth_status','com.webos.service.bluetooth2/adapter/setState':'set_bluetooth','com.webos.audio/getVolume':'volume','com.webos.audio/setVolume':'set_volume','com.webos.audio/setMuted':'set_muted'};
    if(rootActions[endpoint]){rootCall(rootActions[endpoint],data||{},done);return;}
    var actions={'com.webos.service.settings/getSystemSettings':'picture','com.webos.service.settings/getSystemSettingValues':'modes','com.webos.service.settings/setSystemSettings':'set_picture'};
    if(actions[endpoint]){rootCall(actions[endpoint],data&&data.settings?{mode:data.settings.pictureMode}:{},done);return;}
    var bridge = new PalmServiceBridge(); bridges.push(bridge);
    bridge.onservicecallback = function (raw) {
      var r; try { r = JSON.parse(raw); } catch (e) { r = {returnValue:false}; }
      if (!subscription) { var i=bridges.indexOf(bridge); if(i>=0)bridges.splice(i,1); }
      if(done)done(r);
    };
    try { bridge.call('luna://'+endpoint,JSON.stringify(data||{})); }
    catch(e) { if(done)done({returnValue:false}); }
  }
  function message(text) { $('ccMessage').textContent = text; }
  function failed(r) { if(r.returnValue===false) {message(r.serviceUnavailable?'Dịch vụ điều khiển chưa sẵn sàng. Bạn có thể mở Cài đặt TV.':r.supported===false?'Tính năng này chưa được hỗ trợ trên TV này.':'TV chưa thực hiện được thao tác này.');return true;}return false; }
  function paint() {
    $('ccWifi').classList.toggle('enabled',state.wifi===true);
    $('ccBluetooth').classList.toggle('enabled',state.bluetooth===true);
    $('ccWifi').classList.toggle('connected',state.wifi===true&&state.wifiConnected);
    $('ccBluetooth').classList.toggle('connected',state.bluetooth===true&&!!bluetoothName);
    if(state.brightness!==null){$('ccBrightness').value=state.brightness;$('ccBrightnessValue').textContent=state.brightness+'%';}
    $('ccWifiState').textContent=unsupported.wifi?'Không hỗ trợ':state.wifi===null?'Đang đọc…':state.wifi?(wifiName||'Đang bật'):'Đã tắt';
    $('ccBluetoothState').textContent=unsupported.bluetooth?'Không hỗ trợ':state.bluetooth===null?'Đang đọc…':state.bluetooth?(bluetoothName||'Đang bật'):'Đã tắt';
    $('ccWifi').setAttribute('aria-pressed',state.wifi===true?'true':'false');
    $('ccBluetooth').setAttribute('aria-pressed',state.bluetooth===true?'true':'false');
    $('ccMode').textContent=unsupported.mode?'Không hỗ trợ':state.mode?(names[state.mode]||state.mode):'Đang đọc…';
    if(state.volume!==null) { $('ccVolume').value=state.volume; $('ccVolumeValue').textContent=state.muted?'Đã tắt tiếng':state.volume+'%'; }
    ['ccBrightness','ccDim','ccBright'].forEach(function(id){$(id).disabled=unsupported.brightness;});
    ['ccVolume','ccMinus','ccPlus','ccMute'].forEach(function(id){$(id).disabled=unsupported.volume;});
    ['ccPrev','ccNext'].forEach(function(id){$(id).disabled=unsupported.mode;});
    if(unsupported.brightness)$('ccBrightnessValue').textContent='Không hỗ trợ';
    if(unsupported.volume)$('ccVolumeValue').textContent='Không hỗ trợ';
    $('ccMute').textContent=state.muted?'Bật tiếng':'Tắt tiếng';
  }
  function readWifi(r) {unsupported.wifi=r.returnValue===false;if(unsupported.wifi){paint();return;}state.wifiConnected=!!r.networkInfo&&['ipConfigured','connected','online'].indexOf(r.networkInfo.connectState)>=0;wifiName=r.networkInfo&&(r.networkInfo.ssid||r.networkInfo.displayName)||'';state.wifi=r.status==='serviceEnabled'||r.status==='connectionStateChanged';paint();}
  function readBluetooth(r) {var a=r.adapters&&r.adapters[0];unsupported.bluetooth=r.returnValue===false||!a;if(a){state.bluetooth=a.powered===true;state.adapter=a.adapterAddress;}paint();}
  function readVolume(r) {unsupported.volume=r.returnValue===false;if(unsupported.volume){state.volume=null;paint();return;}var v=r.volumeStatus||r;if(typeof v.volume==='number')state.volume=v.volume;if(typeof v.muted==='boolean')state.muted=v.muted;paint();}
  function toggle(kind) {
    if(unsupported[kind]){window.GathinOpenSettings();return;}
    if(busy[kind]||state[kind]===null)return;
    busy[kind]=true;message('');var next=!state[kind];
    var endpoint=kind==='wifi'?'com.webos.service.wifi/setstate':'com.webos.service.bluetooth2/adapter/setState';
    var data=kind==='wifi'?{state:next?'enabled':'disabled'}:{powered:next,adapterAddress:state.adapter};
    call(endpoint,data,function(r){busy[kind]=false;if(failed(r))return;state[kind]=next;paint();});
  }
  function mode(delta) {
    if(busy.mode||!state.modes.length||!state.mode)return;
    var i=state.modes.indexOf(state.mode), next=state.modes[(Math.max(0,i)+delta+state.modes.length)%state.modes.length];
    busy.mode=true;
    call('com.webos.service.settings/setSystemSettings',{category:'picture',settings:{pictureMode:next}},function(r){busy.mode=false;if(!failed(r)){state.mode=next;paint();readBrightness();}});
  }
  function readBrightness(){rootCall('backlight',{},function(r){unsupported.brightness=r.returnValue===false||!r.settings||r.settings.backlight===undefined;if(unsupported.brightness){state.brightness=null;paint();return;}var value=Number((r.settings||{}).backlight);if(isFinite(value)){state.brightness=value;paint();}});}
  function brightness(value){
    if(state.brightness===null)return;
    value=Math.max(0,Math.min(100,Math.round(value)));state.brightness=value;paint();
    clearTimeout(brightnessTimer);brightnessTimer=setTimeout(function(){rootCall('set_backlight',{value:value},function(r){if(failed(r))readBrightness();});},180);
  }
  function volume(value) {
    value=Math.max(0,Math.min(100,Math.round(value)));state.volume=value;paint();
    clearTimeout(volumeTimer);volumeTimer=setTimeout(function(){call('com.webos.audio/setVolume',{volume:value},function(r){if(!failed(r))call('com.webos.audio/getVolume',{},readVolume);});},100);
  }
  function mute() {call('com.webos.audio/setMuted',{muted:!state.muted},function(r){if(!failed(r)){state.muted=!state.muted;paint();}});}
  function targets(){return [$('ccWifi'),$('ccBluetooth'),$('ccPicture'),$('ccBrightness'),$('ccVolume'),$('ccMute'),$('ccWallpaper'),$('ccClose')];}
  function focus(index){focusIndex=Math.max(0,Math.min(targets().length-1,index));targets().forEach(function(e,i){e.classList.toggle('cc-focused',i===focusIndex);});targets()[focusIndex].focus();}
  function close() {
    $('ccDevices').classList.add('cc-hidden');
    stopHold();open=false;panel.classList.add('cc-hidden');panel.setAttribute('aria-hidden','true');
    bridges.forEach(function(b){try{b.cancel();}catch(e){}});bridges=[];
    $('btnAction').focus();
  }
  function show() {
    open=true;panel.classList.remove('cc-hidden');panel.setAttribute('aria-hidden','false');message('');busy={};focus(0);paint();readDevices();readBrightness();
    call('com.webos.service.wifi/getstatus',{subscribe:true},readWifi,true);
    call('com.webos.service.bluetooth2/adapter/getStatus',{subscribe:true},readBluetooth,true);
    call('com.webos.audio/getVolume',{subscribe:true},readVolume,true);
    call('com.webos.service.settings/getSystemSettings',{category:'picture',keys:['pictureMode'],subscribe:true},function(r){unsupported.mode=r.returnValue===false||!r.settings;if(!unsupported.mode)state.mode=r.settings.pictureMode;paint();},true);
    call('com.webos.service.settings/getSystemSettingValues',{category:'picture',key:'pictureMode'},function(r){if(!failed(r)){var values=r.values||{};state.modes=(values.arrayExt||[]).filter(function(x){return x.active!==false&&x.visible!==false;}).map(function(x){return x.value;});if(!state.modes.length)message('Chưa đọc được danh sách chế độ hình ảnh.');}});
  }
  function readDevices(done) {
    rootCall('bt_devices',{},function(r){if(r.returnValue!==false){var rows=r.devices||[];bluetoothName=rows.filter(function(d){return (d.connectedProfiles||[]).length>0;}).map(function(d){return d.name||d.address;}).join(', ');paint();if(done)done(rows);}else if(done)done([]);});
  }
  function showBluetooth() {
    var box=$('ccDevices');box.classList.remove('cc-hidden');box.innerHTML='';
    var heading=document.createElement('strong');heading.textContent='Bluetooth';box.appendChild(heading);
    readDevices(function(rows){
      rows.forEach(function(d){var b=document.createElement('button');var profiles=d.connectedProfiles||[];b.textContent=(d.name||d.address)+(profiles.length?' · Đã kết nối':'');b.disabled=profiles.indexOf('hid')>=0||d.classOfDevice===7936||!d.paired;b.onclick=function(){rootCall('bt_connect',{address:d.address},function(r){if(!failed(r)){box.classList.add('cc-hidden');readDevices();}});};box.appendChild(b);});
      var pair=document.createElement('button');pair.textContent='Thêm / ghép nối thiết bị…';pair.onclick=function(){rootCall('bt_settings',{},function(r){if(!failed(r))close();});};box.appendChild(pair);
      var back=document.createElement('button');back.textContent='Quay lại';back.onclick=function(){box.classList.add('cc-hidden');focus(1);};box.appendChild(back);
      var buttons=box.querySelectorAll('button:not(:disabled)');if(buttons.length)buttons[0].focus();
    });
  }
  function build() {
    panel=document.createElement('section');panel.id='controlCenter';panel.className='cc-hidden';panel.setAttribute('aria-label','Trung tâm điều khiển');panel.setAttribute('aria-hidden','true');
    panel.innerHTML='<div class="cc-heading"><h2>Trung tâm điều khiển</h2><button id="ccClose" aria-label="Đóng">×</button></div>'+
      '<div class="cc-toggles"><button id="ccWifi" class="cc-toggle"><span class="cc-symbol" id="ccWifiSymbol"></span><span><strong>Wi-Fi</strong><small id="ccWifiState">Đang đọc…</small></span></button>'+
      '<button id="ccBluetooth" class="cc-toggle"><span class="cc-symbol"><svg viewBox="0 0 24 24"><path d="m7 7 10 10-5 4V3l5 4-10 10"/></svg></span><span><strong>Bluetooth</strong><small id="ccBluetoothState">Đang đọc…</small></span></button></div>'+
      '<div class="cc-block"><div class="cc-label">Chế độ hình ảnh</div><div class="cc-picture"><button id="ccPrev" aria-label="Chế độ trước">‹</button><button id="ccPicture"><svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8m-4-4v4"/></svg><span id="ccMode">Đang đọc…</span></button><button id="ccNext" aria-label="Chế độ tiếp">›</button></div></div>'+
      '<div class="cc-block cc-brightness"><div class="cc-label">Độ sáng <span id="ccBrightnessValue">—</span></div><div class="cc-volume-row"><button id="ccDim" aria-label="Giảm độ sáng">☼</button><input id="ccBrightness" aria-label="Độ sáng màn hình" type="range" min="0" max="100" value="0"><button id="ccBright" aria-label="Tăng độ sáng">☀</button></div></div>'+
      '<div class="cc-block"><div class="cc-label">Âm lượng <span id="ccVolumeValue">—</span></div><div class="cc-volume-row"><button id="ccMinus" aria-label="Giảm âm lượng">−</button><input id="ccVolume" aria-label="Âm lượng" type="range" min="0" max="100" value="0"><button id="ccPlus" aria-label="Tăng âm lượng">+</button></div><button id="ccMute">Tắt tiếng</button></div><button id="ccWallpaper" type="button">Điều khiển từ xa & Thiết lập</button><div id="ccMessage" role="status"></div>';
    document.body.appendChild(panel);var devices=document.createElement('section');devices.id='ccDevices';devices.className='cc-hidden';panel.appendChild(devices);
    $('ccWifiSymbol').innerHTML='<svg viewBox="0 0 24 24"><g class="wifi-mark"><path d="M1.6 7.7a16.3 16.3 0 0 1 20.8 0l-2.3 2.8a12.7 12.7 0 0 0-16.2 0Zm4 4.8a10 10 0 0 1 12.8 0L16 15.4a6.2 6.2 0 0 0-8 0Zm4 4.9a3.8 3.8 0 0 1 4.8 0L12 20.3Z"/></g></svg>';
    ['wifi','bluetooth'].forEach(function(kind){
      var button=$(kind==='wifi'?'ccWifi':'ccBluetooth');
      button.setAttribute('title','Bấm: bật/tắt · Giữ: chọn thiết bị');
      button.onmousedown=function(e){if(e.button===0)startHold(kind);};
      button.onmouseup=stopHold;button.onmouseleave=stopHold;
      button.onclick=function(){stopHold();if(held){held=false;return;}toggle(kind);};
    });
    $('ccPrev').onclick=function(){mode(-1);};$('ccNext').onclick=$('ccPicture').onclick=function(){mode(1);};
    $('ccBrightness').oninput=function(){brightness(Number(this.value));};$('ccDim').onclick=function(){if(state.brightness!==null)brightness(state.brightness-5);};$('ccBright').onclick=function(){if(state.brightness!==null)brightness(state.brightness+5);};
    $('ccVolume').oninput=function(){volume(Number(this.value));};$('ccMinus').onclick=function(){if(state.volume!==null)volume(state.volume-2);};$('ccPlus').onclick=function(){if(state.volume!==null)volume(state.volume+2);};
    $('ccWallpaper').onclick=function(){window.GathinWallpaper();};$('ccMute').onclick=mute;$('ccClose').onclick=close;
    targets().forEach(function(el,i){el.addEventListener('mouseover',function(){if(open)focus(i);});});
    document.addEventListener('keydown',function(e){
      if(!open)return;
      var k=e.keyCode;
      if(!$('ccDevices').classList.contains('cc-hidden')){var rows=Array.prototype.slice.call($('ccDevices').querySelectorAll('button:not(:disabled)')),at=rows.indexOf(document.activeElement);if(k===461||k===27){$('ccDevices').classList.add('cc-hidden');focus(1);}else if(k===38||k===40){if(rows.length)rows[Math.max(0,Math.min(rows.length-1,at+(k===38?-1:1)))].focus();}else if(k===13&&at>=0)rows[at].click();else return;e.preventDefault();e.stopImmediatePropagation();return;}
      if(k===461||k===27){close();}
      else if(k===38)focus(focusIndex-1);
      else if(k===40)focus(focusIndex+1);
      else if(k===37||k===39){if(focusIndex<2)focus(k===37?0:1);else if(focusIndex===2)mode(k===37?-1:1);else if(focusIndex===3&&state.brightness!==null)brightness(state.brightness+(k===37?-5:5));else if(focusIndex===4&&state.volume!==null)volume(state.volume+(k===37?-2:2));}
      else if(k===13){if(focusIndex<2){if(!keyPress){keyPress=true;startHold(focusIndex===0?'wifi':'bluetooth');}}else if(focusIndex===2)mode(1);else if(focusIndex===5)mute();else if(focusIndex===6)window.GathinWallpaper();else if(focusIndex===7)close();}
      else return;
      e.preventDefault();e.stopImmediatePropagation();
    },true);
    document.addEventListener('keyup',function(e){
      if(e.keyCode!==13||!keyPress)return;
      stopHold();keyPress=false;
      if(open&&!held&&focusIndex<2)toggle(focusIndex===0?'wifi':'bluetooth');
      held=false;e.preventDefault();e.stopImmediatePropagation();
    },true);
    document.addEventListener('mousedown',function(e){if(open&&!panel.contains(e.target)&&!$('btnAction').contains(e.target))close();},true);
    document.addEventListener('visibilitychange',function(){if(document.hidden&&open)close();});
  }
  build();window.GathinControlCenter={toggle:function(){if(open)close();else show();}};
}());
