// DeskBub — Video Desktop Pet (zero dependencies)

const video = document.getElementById('petVideo');
const bubble = document.getElementById('bubble');
const urlBar = document.getElementById('url-bar');
const hint = document.getElementById('hint');
const statusEl = document.getElementById('status');
const input = document.getElementById('mediaUrl');

// Show/hide URL bar
window.addEventListener('dblclick', function (e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  urlBar.classList.remove('hidden');
  hint.style.opacity = '1';
});
window.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    urlBar.classList.add('hidden');
    hint.style.opacity = '0';
  }
});

// Status helper
function status(msg, dur) {
  statusEl.textContent = msg;
  statusEl.style.display = 'block';
  clearTimeout(status.timer);
  if (dur > 0) status.timer = setTimeout(function () { statusEl.style.display = 'none'; }, dur);
}

// Load video
window.loadMedia = function () {
  var url = input.value.trim();
  if (!url) return;

  status('Loading video...', 0);
  video.style.display = 'block';
  video.src = url;
  video.load();

  var p = video.play();
  if (p && p.then) {
    p.then(function () {
      status('✅ Playing', 2000);
      urlBar.classList.add('hidden');
      hint.style.opacity = '0';
      input.style.borderColor = '#4ECDC4';
    }).catch(function (e) {
      status('❌ ' + e.message, 5000);
    });
  }
};

// Toggle mode (stub for 3D later)
window.toggleMode = function () {
  status('3D mode coming soon', 2000);
};

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

// Reminder bubbles
var bubbleTimer = null;
function showBubble(msg) {
  bubble.textContent = msg;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, 8000);
}
setTimeout(function () { showBubble('Hey! Time to stretch! 🧘'); }, 30000);
setInterval(function () {
  if (Math.random() < 0.2) {
    showBubble(['Water break! 💧', 'Rest your eyes! 👀', 'Stand up! 🧘', 'Your pet missed you! 🐾'][Math.floor(Math.random() * 4)]);
  }
}, 60000);

// Start — show URL bar initially
video.style.display = 'none';
urlBar.classList.remove('hidden');
status('👆 Paste video URL and click Load', 10000);
