// DeskBub — Video pet with foolproof transparency
var video = document.getElementById('petVideo');
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');

canvas.style.display = 'block';
canvas.style.opacity = '0'; // Start invisible
video.style.display = 'none';

// Enable right-click paste on the input
input.addEventListener('contextmenu', function(e) { e.stopPropagation(); });

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

var videoReady = false;

window.loadMedia = function() {
  var url = input.value.trim(); if (!url) return;
  videoReady = false;
  canvas.style.opacity = '0'; // Hide until first clean frame
  status('Loading...', 0);

  // Reload video element to clear old state
  video.pause();
  video.removeAttribute('src');
  video.load();

  video.src = url; video.loop = true; video.muted = true; video.playsInline = true;
  video.load();
  var p = video.play();
  if (p && p.then) {
    p.then(function() {
      setTimeout(function() {
        videoReady = true;
        status('✅', 2000);
        urlBar.classList.add('hidden'); hint.style.opacity = '0';
        input.style.borderColor = '#4ECDC4';
      }, 300);
    }).catch(function(e) { status('❌ ' + e.message, 5000); });
  }
};
window.toggleMode = function(){};

// Chroma key
function isGreen(r,g,b) {
  if (g < 60) return false;
  if (g <= r || g <= b) return false;
  var avg = (r + b) / 2;
  return avg < 1 ? (g > 80) : (g / avg > 1.12);
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

var offscreen = document.createElement('canvas');
var offCtx = offscreen.getContext('2d');
var firstCleanFrameShown = false;

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!videoReady || !video.videoWidth || video.paused) return;

  var pad = 15;
  var aw = canvas.width - pad * 2, ah = canvas.height - pad * 2;
  var s = Math.min(aw / video.videoWidth, ah / video.videoHeight);
  var dw = video.videoWidth * s, dh = video.videoHeight * s;
  var dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;

  // Process on offscreen canvas
  offscreen.width = canvas.width; offscreen.height = canvas.height;
  offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
  offCtx.drawImage(video, dx, dy, dw, dh);

  var imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  var d = imgData.data;
  for (var i = 0; i < d.length; i += 4) {
    if (isGreen(d[i], d[i+1], d[i+2])) {
      var dom = d[i+1] / Math.max((d[i] + d[i+2]) / 2, 1);
      d[i+3] = dom > 1.35 ? 0 : Math.max(0, Math.round((1.35 - dom) * 510));
    }
  }

  // Draw clean frame
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.putImageData(imgData, 0, 0);

  // SHOW canvas only after first clean frame is rendered
  if (!firstCleanFrameShown) {
    firstCleanFrameShown = true;
    canvas.style.opacity = '1';
  }
}
renderFrame();

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
status('👆 Paste video URL → Load', 10000);
