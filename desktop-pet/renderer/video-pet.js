// DeskBub — Green-screen chroma-key video pet

var video = document.getElementById('petVideo');
var canvas = document.getElementById('pet3d');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var urlBar = document.getElementById('url-bar');
var hint = document.getElementById('hint');
var statusEl = document.getElementById('status');
var input = document.getElementById('mediaUrl');
var bgColor = { r: 0, g: 255, b: 0 }; // Pure green to key out
var threshold = 100; // Tolerance for green detection

// Init canvas
canvas.style.display = 'block';
video.style.display = 'none'; // video is hidden, we render to canvas

// Show/hide URL bar
window.addEventListener('dblclick', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  urlBar.classList.remove('hidden');
  hint.style.opacity = '1';
});
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { urlBar.classList.add('hidden'); hint.style.opacity = '0'; }
});

function status(msg, dur) {
  statusEl.textContent = msg; statusEl.style.display = 'block';
  clearTimeout(status.timer);
  if (dur > 0) status.timer = setTimeout(function () { statusEl.style.display = 'none'; }, dur);
}

// Load video
window.loadMedia = function () {
  var url = input.value.trim();
  if (!url) return;
  status('Loading...', 0);
  video.style.display = 'none';
  video.src = url;
  video.loop = true;
  video.muted = true;
  video.load();
  var p = video.play();
  if (p && p.then) {
    p.then(function () {
      status('✅', 2000);
      urlBar.classList.add('hidden');
      hint.style.opacity = '0';
      input.style.borderColor = '#4ECDC4';
    }).catch(function (e) {
      status('❌ ' + e.message, 5000);
    });
  }
};

window.toggleMode = function () {};

// === CHROMA KEY RENDER LOOP ===
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!video.videoWidth || video.paused) return;
  // Draw video frame to canvas, then replace green pixels with transparent
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Scale video to fit nicely in window with padding
  var padX = 20, padY = 20;
  var availW = canvas.width - padX * 2, availH = canvas.height - padY * 2;
  var scale = Math.min(availW / video.videoWidth, availH / video.videoHeight);
  var dw = video.videoWidth * scale, dh = video.videoHeight * scale;
  var dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;

  ctx.drawImage(video, dx, dy, dw, dh);

  // Chroma key: remove green pixels
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;
  for (var i = 0; i < data.length; i += 4) {
    var r = data[i], g = data[i + 1], b = data[i + 2];
    // If pixel is "green enough", make it transparent
    if (g > 120 && g > r * 1.2 && g > b * 1.2) {
      data[i + 3] = 0; // Set alpha to 0
    }
    // Also remove near-black pixels (edges of green screen)
    if (r < 30 && g < 30 && b < 30) {
      data[i + 3] = Math.max(0, data[i + 3] - 80);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
renderFrame();

// Drag
var dragging = false, sx = 0, sy = 0;
document.addEventListener('mousedown', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  dragging = true; sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mousemove', function (e) {
  if (!dragging) return;
  window.moveBy(e.screenX - sx, e.screenY - sy);
  sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mouseup', function () { dragging = false; });

// Reminders
var bubbleTimer = null;
function showBubble(msg) {
  bubble.textContent = msg; bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 8000);
}
setTimeout(function () { showBubble('Stretch break! 🧘'); }, 30000);
setInterval(function () {
  if (Math.random() < 0.2) showBubble(['Water! 💧', 'Eye break! 👀', 'Stretch! 🧘'][Math.floor(Math.random()*3)]);
}, 60000);

video.style.display = 'none';
urlBar.classList.remove('hidden');
canvas.style.display = 'block';
status('👆 Paste video URL and click Load', 10000);
