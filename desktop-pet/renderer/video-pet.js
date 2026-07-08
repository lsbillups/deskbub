// DeskBub — zero-flash video pet
var video = null;           // Created fresh each time
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');

// Start with canvas completely hidden
canvas.style.display = 'none';
canvas.style.opacity = '0';

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

  // Destroy old video element completely
  if (video) { video.pause(); video.removeAttribute('src'); video.load(); if (video.parentNode) video.parentNode.removeChild(video); }
  videoReady = false;
  canvas.style.display = 'none'; // HIDE until first clean frame

  // Create FRESH video element
  video = document.createElement('video');
  video.loop = true; video.muted = true; video.playsInline = true;
  video.style.display = 'none';
  document.body.appendChild(video);

  status('Loading...', 0);
  video.addEventListener('canplay', function() {
    video.play().then(function() {
      setTimeout(function() { videoReady = true; }, 200);
    }).catch(function(e) { status('Play error: ' + e.message, 5000); });
  });
  video.addEventListener('playing', function() {
    status('✅', 2000); urlBar.classList.add('hidden'); hint.style.opacity = '0';
    input.style.borderColor = '#4ECDC4';
  });
  video.addEventListener('error', function() { status('❌ Cannot load video', 5000); });
  video.src = url;
  video.load();
};

window.toggleMode = function(){};

// Chroma key
function isGreen(r, g, b) {
  if (g < 50) return false;        // Too dark
  if (g <= r || g <= b) return false; // Green not dominant
  return g > (r + b) * 0.54;       // Green > 54% of sum
}

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

var offscreen = document.createElement('canvas');
var offCtx = offscreen.getContext('2d');
var shown = false;

function showCanvas() {
  if (shown) return;
  shown = true;
  canvas.style.display = 'block';
  canvas.style.opacity = '1';
}

function hideCanvas() {
  shown = false;
  canvas.style.display = 'none';
  canvas.style.opacity = '0';
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!video || !videoReady || !video.videoWidth || video.paused) return;
  if (video.readyState < 2) return; // Haven't decoded first frame yet

  var pad = 15;
  var aw = canvas.width - pad * 2, ah = canvas.height - pad * 2;
  var s = Math.min(aw / video.videoWidth, ah / video.videoHeight);
  var dw = video.videoWidth * s, dh = video.videoHeight * s;
  var dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;

  offscreen.width = canvas.width; offscreen.height = canvas.height;
  offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
  offCtx.drawImage(video, dx, dy, dw, dh);

  var imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
  var d = imgData.data;

  // Also detect overall green frame - if video is mostly green, it's still transitioning
  var greenCount = 0;
  for (var i = 0; i < d.length; i += 4) {
    if (isGreen(d[i], d[i+1], d[i+2])) {
      var dom = d[i+1] / Math.max((d[i] + d[i+2]) / 2, 1);
      d[i+3] = dom > 1.3 ? 0 : Math.max(0, Math.round((1.3 - dom) * 510));
      if (d[i+3] < 10) greenCount++;
    }
  }

  // Only show if frame has substantial non-green content (pet is visible)
  var totalPixels = d.length / 4;
  if (greenCount / totalPixels < 0.85) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imgData, 0, 0);
    if (!shown) showCanvas();
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
