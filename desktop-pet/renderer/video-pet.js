// DeskBub — Multi-video pet with rotation

var video = document.getElementById('petVideo');
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');
var pairingInput = document.getElementById('pairingCode');

canvas.style.display = 'block';
video.style.opacity = '0';

// Multi-video support
var videos = [];        // Array of {url, label}
var currentIdx = 0;
var rotationTimer = null;
var rotationInterval = 180000; // 3 minutes
var autoRotate = true;

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

// IPC: receive tray menu action from main process
if (window.deskBub && window.deskBub.onTrayAction) {
  window.deskBub.onTrayAction(function(action) {
    var idx = parseInt(action);
    if (!isNaN(idx) && idx >= 0 && idx < videos.length) {
      playIdx(idx);
    } else if (action === 'next') {
      playNext();
    } else if (action === 'prev') {
      playPrev();
    }
  });
}

// Send actions to main process for tray menu
function updateTray() {
  if (window.deskBub && window.deskBub.setActions) {
    window.deskBub.setActions(videos);
  }
}

// Rotation
function startRotation() {
  stopRotation();
  if (videos.length <= 1) return;
  rotationTimer = setInterval(function() { playNext(); }, rotationInterval);
}

function stopRotation() {
  if (rotationTimer) { clearInterval(rotationTimer); rotationTimer = null; }
}

function playIdx(idx) {
  if (idx < 0 || idx >= videos.length) return;
  currentIdx = idx;
  videoReady = false;
  canvas.style.display = 'block';
  video.style.display = 'none';
  var v = videos[idx];
  status('✅', 1500);
  video.src = v.url;
  video.load();
  var playP = video.play();
  if (playP && playP.then) {
    playP.then(function() {
      // Video is playing — showVideo will be called by renderFrame
    }).catch(function(e) {
      status('❌ Cannot play video', 5000);
    });
  }
}

// Force show video when it's ready
video.addEventListener('playing', function() {
  if (!videoReady) { showVideo(); videoReady = true; statusEl.style.display = 'none'; }
});
video.addEventListener('error', function() {
  status('❌ Video load error', 5000);
  video.style.opacity = '0';
});

function playNext() {
  playIdx((currentIdx + 1) % videos.length);
}

function playPrev() {
  playIdx((currentIdx - 1 + videos.length) % videos.length);
}

// Load single video URL
function loadVideo(url) {
  videos = [{url: url, label: 'Custom video'}];
  currentIdx = 0;
  playIdx(0);
  stopRotation();
  updateTray();
  if (autoRotate && videos.length > 1) startRotation();
}

// Load multiple videos from pairing API
window.loadByCode = function() {
  var code = pairingInput ? pairingInput.value.trim() : '';
  if (!code || code.length !== 6) { status('Enter 6-digit code', 3000); return; }

  status('Pairing...', 0);
  fetch('http://localhost:3000/api/pairing/' + code)
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.videos && data.videos.length > 0) {
        videos = data.videos;
        currentIdx = 0;
        playIdx(0);
        startRotation();
        updateTray();
        urlBar.classList.add('hidden');
        hint.style.opacity = '0';
      } else if (data.videoUrl) {
        // Backward compat: single video
        loadVideo(data.videoUrl);
        urlBar.classList.add('hidden');
        hint.style.opacity = '0';
      } else {
        status('No pet found', 4000);
      }
    })
    .catch(function() {
      status('Cannot connect', 5000);
    });
};

window.loadMedia = function() {
  var url = input.value.trim();
  if (!url) return;
  loadVideo(url);
  urlBar.classList.add('hidden');
  hint.style.opacity = '0';
  input.style.borderColor = '#4ECDC4';
};

window.toggleMode = function(){};

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resize); resize();

var videoReady = false;

function showVideo() {
  video.style.opacity = '1';
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!video.src || video.paused || !video.videoWidth) return;
  if (!videoReady) { showVideo(); videoReady = true; }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  var pad = 10;
  var aw = canvas.width - pad * 2, ah = canvas.height - pad * 2;
  var s = Math.min(aw / video.videoWidth, ah / video.videoHeight);
  var dw = video.videoWidth * s, dh = video.videoHeight * s;
  ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
}
renderFrame();

// Auto-play rotation when video ends
video.addEventListener('ended', function() {
  if (autoRotate && videos.length > 1) playNext();
});

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
status('👆 Enter pairing code → Pair  or paste URL → Load', 15000);
