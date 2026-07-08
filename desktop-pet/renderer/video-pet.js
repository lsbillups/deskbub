// DeskBub — Transparent video pet (no chroma key needed)
var video = null;
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');

canvas.style.display = 'block';
// Custom right-click paste
input.addEventListener('contextmenu', function(e) {
  e.preventDefault(); e.stopPropagation();
  // Read from clipboard and paste
  navigator.clipboard.readText().then(function(text) {
    if (text) {
      var start = input.selectionStart, end = input.selectionEnd;
      input.value = input.value.slice(0, start) + text + input.value.slice(end);
      input.focus();
      input.setSelectionRange(start + text.length, start + text.length);
      status('📋 Pasted!', 1500);
    }
  }).catch(function() {
    status('⚠ Right-click to paste — make sure clipboard has content', 3000);
  });
});

window.addEventListener('dblclick', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  urlBar.classList.remove('hidden'); hint.style.opacity = '1';
});
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') { urlBar.classList.add('hidden'); hint.style.opacity = '0'; }
});

function status(m, d) {
  statusEl.textContent = m; statusEl.style.display = 'block';
  clearTimeout(status.timer);
  if (d > 0) status.timer = setTimeout(function() { statusEl.style.display = 'none'; }, d);
}

window.loadMedia = function() {
  var url = input.value.trim(); if (!url) return;
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); if (video.parentNode) video.parentNode.removeChild(video); }
  canvas.style.display = 'block';

  video = document.createElement('video');
  video.loop = true; video.muted = true; video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);
  status('Loading...', 0);

  var shown = false;
  function tryShow() {
    if (shown) return;
    if (!video.videoWidth || video.paused) return;
    shown = true;
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    canvas.style.display = 'block';
    status('✅', 2000);
    urlBar.classList.add('hidden'); hint.style.opacity = '0';
    input.style.borderColor = '#4ECDC4';
    startRender();
  }
  video.addEventListener('playing', tryShow);
  video.addEventListener('canplay', function() {
    video.play().then(tryShow).catch(function(){});
  });
  video.addEventListener('error', function() { status('❌ Load error', 5000); });
  // Fallback: force show after 3 seconds regardless
  setTimeout(function() {
    if (!shown) { canvas.style.display = 'block'; startRender(); status('⚠', 1000); }
  }, 3000);
  video.src = url; video.load();
};

window.toggleMode = function(){};

// Pairing code lookup
window.loadByCode = function() {
  var code = document.getElementById('pairingCode').value.trim();
  if (!code || code.length !== 6) { status('Enter 6-digit code from Dashboard', 3000); return; }

  status('Pairing...', 0);
  fetch('https://deskbub.vercel.app/api/pairing/' + code)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.videoUrl) {
        document.getElementById('mediaUrl').value = data.videoUrl;
        status('✅ Found! Loading...', 1500);
        window.loadMedia();
      } else {
        status('❌ ' + (data.error || 'Not found'), 4000);
      }
    })
    .catch(function() {
      // Fallback: try localhost
      fetch('http://localhost:3000/api/pairing/' + code)
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data.videoUrl) {
            document.getElementById('mediaUrl').value = data.videoUrl;
            status('✅ Found! Loading...', 1500);
            window.loadMedia();
          } else {
            status('❌ No pet found for this code', 4000);
          }
        })
        .catch(function() {
          status('❌ Cannot connect. Check your internet.', 5000);
        });
    });
};

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

var rendering = false;
function startRender() {
  if (rendering) return;
  rendering = true;
  function render() {
    requestAnimationFrame(render);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!video || video.paused || !video.videoWidth) return;
    var pad = 25;
    var aw = canvas.width - pad * 2, ah = canvas.height - pad * 2;
    var s = Math.min(aw / video.videoWidth, ah / video.videoHeight);
    var dw = video.videoWidth * s, dh = video.videoHeight * s;
    ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
  }
  render();
}

// Drag
var dragging = false, sx = 0, sy = 0;
document.addEventListener('mousedown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  dragging = true; sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mousemove', function(e) {
  if (!dragging) return;
  window.moveBy(e.screenX - sx, e.screenY - sy);
  sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mouseup', function() { dragging = false; });

// Reminders
var bt = null;
function showBubble(m) { bubble.textContent = m; bubble.classList.add('show'); clearTimeout(bt); bt = setTimeout(function() { bubble.classList.remove('show'); }, 8000); }
setTimeout(function() { showBubble('Stretch break! 🧘'); }, 30000);
setInterval(function() { if (Math.random() < 0.2) showBubble(['Water! 💧', 'Eye break! 👀', 'Stretch! 🧘'][Math.floor(Math.random() * 3)]); }, 60000);

urlBar.classList.remove('hidden');
status('👆 Paste transparent video URL → Load', 10000);
