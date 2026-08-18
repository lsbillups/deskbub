// DeskBub desktop pet renderer: local Kaka starter + paired custom pets.
var video = document.getElementById('petVideo');
var canvas = document.getElementById('petCanvas');
var ctx = canvas.getContext('2d');
var bubble = document.getElementById('bubble');
var statusEl = document.getElementById('status');

var videos = [];
var currentIdx = 0;
var currentSource = 'starter';
var starterPet = null;
var rotationTimer = null;
var rotationInterval = 180000;
var fallbackInProgress = false;
var reminderConfig = { sitReminder: 50, waterReminder: 90, remindersPaused: false };
var sitReminderTimer = null;
var waterReminderTimer = null;

function status(message, duration) {
  statusEl.textContent = message;
  statusEl.style.display = message ? 'block' : 'none';
  clearTimeout(status.timer);
  if (message && duration > 0) status.timer = setTimeout(function() { statusEl.style.display = 'none'; }, duration);
}

function reportPairing(result) {
  if (window.deskBub && window.deskBub.reportPairingResult) window.deskBub.reportPairingResult(result);
}

function updateTray() {
  if (window.deskBub && window.deskBub.setActions) window.deskBub.setActions(videos);
}

function updateCurrentAction() {
  if (window.deskBub && window.deskBub.setCurrentAction) window.deskBub.setCurrentAction(videos[currentIdx] || null);
}

function stopRotation() {
  if (rotationTimer) clearInterval(rotationTimer);
  rotationTimer = null;
}

function startRotation() {
  stopRotation();
  if (videos.length > 1) rotationTimer = setInterval(playNext, rotationInterval);
}

function normalizeVideos(nextVideos) {
  return (Array.isArray(nextVideos) ? nextVideos : [])
    .filter(function(item) { return item && typeof item.url === 'string' && item.url; })
    .map(function(item, index) {
      return { id: item.id || String(index), url: item.url, label: item.label || ('Pet action ' + (index + 1)) };
    });
}

function loadPlaylist(nextVideos, source) {
  var normalized = normalizeVideos(nextVideos);
  if (normalized.length === 0) return false;
  videos = normalized;
  currentSource = source || 'starter';
  currentIdx = 0;
  fallbackInProgress = false;
  updateTray();
  playIdx(0);
  startRotation();
  return true;
}

function playIdx(index) {
  if (index < 0 || index >= videos.length) return;
  currentIdx = index;
  var action = videos[index];
  video.src = action.url;
  video.load();
  updateCurrentAction();
  var promise = video.play();
  if (promise && promise.catch) promise.catch(handlePlaybackFailure);
}

function playNext() {
  if (videos.length) playIdx((currentIdx + 1) % videos.length);
}

function playPrev() {
  if (videos.length) playIdx((currentIdx - 1 + videos.length) % videos.length);
}

function handlePlaybackFailure() {
  if (currentSource === 'paired' && starterPet && !fallbackInProgress) {
    fallbackInProgress = true;
    status("Couldn't load your pet. Showing Kaka.", 5000);
    loadPlaylist(starterPet.videos, 'starter');
    return;
  }
  status('This pet animation could not be played.', 5000);
}

video.addEventListener('playing', function() { status('', 0); });
video.addEventListener('error', handlePlaybackFailure);
video.addEventListener('ended', function() {
  if (videos.length > 1) playNext();
  else if (videos.length === 1) playIdx(0);
});

function persistSelection(pet) {
  if (window.deskBub && window.deskBub.savePetSelection) return window.deskBub.savePetSelection(pet);
  return Promise.resolve();
}

function useStarterPet(starterId, persist) {
  var id = starterId || 'kaka';
  var starterPromise = starterPet && starterPet.id === id ? Promise.resolve(starterPet) : window.deskBub.getStarterPet(id);
  return starterPromise.then(function(pet) {
    starterPet = pet;
    if (!loadPlaylist(pet.videos, 'starter')) throw new Error('Kaka has no playable actions.');
    if (persist) {
      return persistSelection({ mode: 'starter', starterId: id, pairingCode: null }).then(function() {
        status('Kaka is back!', 2500);
        reportPairing({ ok: true, mode: 'starter', message: 'Kaka is active. Pairing remains available whenever you want it.' });
        return pet;
      });
    }
    return pet;
  }).catch(function() {
    status('Kaka could not be loaded from this installation.', 7000);
    return null;
  });
}

function pairByCode(rawCode, options) {
  var opts = options || {};
  var code = String(rawCode || '').trim();
  if (!/^\d{6}$/.test(code)) {
    status('Pairing codes contain 6 numbers.', 4000);
    reportPairing({ ok: false, message: 'Enter the 6-digit code from your DeskBub dashboard.' });
    return Promise.resolve(false);
  }
  if (!opts.silent) status('Loading your custom pet…', 0);
  return fetch('https://deskbub.com/api/pairing/' + encodeURIComponent(code))
    .then(function(response) {
      if (!response.ok) throw new Error(response.status === 404 ? 'No custom pet was found for that code.' : 'DeskBub could not check that code.');
      return response.json();
    })
    .then(function(data) {
      var pairedVideos = Array.isArray(data.videos) && data.videos.length
        ? data.videos
        : (data.videoUrl ? [{ url: data.videoUrl, label: 'Custom pet' }] : []);
      if (!loadPlaylist(pairedVideos, 'paired')) throw new Error('No finished pet actions are available yet.');
      return persistSelection({ mode: 'paired', starterId: 'kaka', pairingCode: code }).then(function() {
        status('Your custom pet is here!', 3000);
        reportPairing({ ok: true, mode: 'paired', message: 'Kaka has been replaced with your custom pet.' });
        return true;
      });
    })
    .catch(function(error) {
      var message = error && error.message ? error.message : 'Could not connect to DeskBub.';
      if (!opts.silent) status(message + ' Kaka is still here.', 6000);
      reportPairing({ ok: false, message: message });
      return false;
    });
}

if (window.deskBub) {
  window.deskBub.onTrayAction(function(action) {
    var index = parseInt(action, 10);
    if (!isNaN(index)) playIdx(index);
    else if (action === 'next') playNext();
    else if (action === 'prev') playPrev();
  });
  window.deskBub.onPairPet(function(code) { pairByCode(code); });
  window.deskBub.onUseStarterPet(function(starterId) { useStarterPet(starterId, true); });
  window.deskBub.onConfigUpdated(function(config) { configureReminders(config); });
  window.deskBub.onRemindersToggled(function(enabled) {
    reminderConfig.remindersPaused = !enabled;
    configureReminders(reminderConfig);
  });
  window.deskBub.onTestReminder(function(type) {
    showBubble(type === 'stretch' ? 'Time to stand and stretch 🧘' : 'Water break 💧');
  });
}

function resizeCanvas() {
  var ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(window.innerWidth * ratio);
  canvas.height = Math.round(window.innerHeight * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function renderFrame() {
  requestAnimationFrame(renderFrame);
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (!video.src || video.paused || !video.videoWidth) return;
  var padding = 8;
  var availableWidth = window.innerWidth - padding * 2;
  var availableHeight = window.innerHeight - padding * 2;
  var scale = Math.min(availableWidth / video.videoWidth, availableHeight / video.videoHeight);
  var drawWidth = video.videoWidth * scale;
  var drawHeight = video.videoHeight * scale;
  ctx.drawImage(video, (window.innerWidth - drawWidth) / 2, (window.innerHeight - drawHeight) / 2, drawWidth, drawHeight);
}
renderFrame();

// A short move is a click; a deliberate move drags the pet window.
var pointerDown = false;
var didDrag = false;
var startScreenX = 0;
var startScreenY = 0;
var lastScreenX = 0;
var lastScreenY = 0;
document.addEventListener('mousedown', function(event) {
  if (event.button !== 0) return;
  pointerDown = true;
  didDrag = false;
  startScreenX = lastScreenX = event.screenX;
  startScreenY = lastScreenY = event.screenY;
});
window.addEventListener('mousemove', function(event) {
  if (!pointerDown) return;
  if (Math.hypot(event.screenX - startScreenX, event.screenY - startScreenY) >= 5) {
    didDrag = true;
    document.body.classList.add('dragging');
  }
  if (didDrag) {
    window.moveBy(event.screenX - lastScreenX, event.screenY - lastScreenY);
    lastScreenX = event.screenX;
    lastScreenY = event.screenY;
  }
});
window.addEventListener('mouseup', function(event) {
  if (event.button !== 0 || !pointerDown) return;
  pointerDown = false;
  document.body.classList.remove('dragging');
  if (!didDrag && window.deskBub && window.deskBub.openControlPanel) window.deskBub.openControlPanel();
});

var bubbleTimer = null;
function showBubble(message) {
  bubble.textContent = message;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(function() { bubble.classList.remove('show'); }, 5000);
}
setTimeout(function() { showBubble('Click me for controls 🐾'); }, 12000);

function configureReminders(config) {
  reminderConfig = Object.assign({}, reminderConfig, config || {});
  clearInterval(sitReminderTimer);
  clearInterval(waterReminderTimer);
  sitReminderTimer = null;
  waterReminderTimer = null;
  if (reminderConfig.remindersPaused) return;
  var sitMinutes = Number(reminderConfig.sitReminder) || 50;
  var waterMinutes = Number(reminderConfig.waterReminder) || 90;
  sitReminderTimer = setInterval(function() { showBubble('Time to stand and stretch 🧘'); }, sitMinutes * 60000);
  waterReminderTimer = setInterval(function() { showBubble('Water break 💧'); }, waterMinutes * 60000);
}

// Always show local Kaka first. A remembered custom pet replaces him only after it loads.
useStarterPet('kaka', false).then(function() {
  if (!window.deskBub || !window.deskBub.getConfig) return;
  window.deskBub.getConfig().then(function(config) {
    configureReminders(config);
    if (config.pet && config.pet.mode === 'paired' && config.pet.pairingCode) pairByCode(config.pet.pairingCode, { silent: true });
  });
});
