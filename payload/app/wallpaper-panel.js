(function () {
  'use strict';
  var dialog = document.createElement('section');
  dialog.id = 'wallpaperDialog';
  dialog.style.display = 'none';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-label', 'Điều khiển từ xa & Thiết lập');
  dialog.innerHTML = '<h2>Quét QR để điều khiển TV</h2><canvas width="328" height="328"></canvas><p>Dùng điện thoại hoặc máy tính cùng mạng LAN.</p><p id="wallpaperAddress"></p><button type="button">Quay lại</button>';
  document.body.appendChild(dialog);
  var previous;
  function close() { dialog.style.display = 'none'; if (previous) previous.focus(); }
  dialog.querySelector('button').onclick = close;
  window.GathinWallpaper = function () {
    var url = window.TV_REMOTE_URL;
    previous = document.activeElement;
    dialog.style.display = 'flex';
    var center = document.getElementById('controlCenter'), height = center.offsetHeight || 680;
    dialog.style.height = height + 'px';
    var canvas = dialog.querySelector('canvas');
    canvas.style.display = url ? 'block' : 'none';
    document.getElementById('wallpaperAddress').textContent = url ? 'Truy cập trực tiếp TV: ' + url.split('/')[2] : 'Kiểm tra kết nối mạng của TV.';
    if (url) {
      var qr = qrcode(0, 'M'); qr.addData(url); qr.make();
      var count = qr.getModuleCount(), cell = Math.max(3, Math.floor(Math.min(328, height - 300) / (count + 8)));
      canvas.width = canvas.height = (count + 8) * cell;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#000';
      for (var y = 0; y < count; y++) for (var x = 0; x < count; x++) {
        if (qr.isDark(y, x)) ctx.fillRect((x + 4) * cell, (y + 4) * cell, cell, cell);
      }
    }
    dialog.querySelector('button').focus();
  };
  window.addEventListener('keydown', function (event) {
    if (dialog.style.display === 'none') return;
    if (event.keyCode === 461 || event.keyCode === 27 || event.keyCode === 13) close();
    event.preventDefault(); event.stopImmediatePropagation();
  }, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden) close(); });
}());
