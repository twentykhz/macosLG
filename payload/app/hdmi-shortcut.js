(function () {
  'use strict';
  var slot = 'com.webos.app.hdmi3', title = 'TV · HDMI', busy = false;
  window.GATHIN_TV_INPUT = 'com.webos.app.inputmgr';
  function apply(data) {
    var id = /^com\.webos\.app\.hdmi[1-4]$/.test(data.appId || '') ? data.appId : null;
    window.GATHIN_TV_INPUT = id || 'com.webos.app.inputmgr';
    var next = id ? 'TV · HDMI ' + id.slice(-1) : 'TV · HDMI';
    (window.TV_APPS.apps || []).forEach(function (app) {
      if (app.id === slot) app.title = next;
    });
    var names = document.querySelectorAll('#tiles .name');
    for (var i = 0; i < names.length; i++) {
      if (names[i].textContent === title) names[i].textContent = next;
    }
    title = next;
  }
  function refresh() {
    if (busy || document.hidden) return;
    busy = true;
    var request = new XMLHttpRequest();
    request.open('GET', 'hdmi-choice.json?t=' + Date.now(), true);
    request.timeout = 3000;
    request.onload = function () {
      busy = false;
      try { if (request.status === 0 || request.status === 200) apply(JSON.parse(request.responseText)); } catch (ignore) {}
    };
    request.onerror = request.ontimeout = function () { busy = false; };
    request.send();
  }
  apply({appId: null});
  refresh();
  document.addEventListener('visibilitychange', refresh);
  document.addEventListener('webOSRelaunch', refresh);
  setInterval(refresh, 15000);
}());
