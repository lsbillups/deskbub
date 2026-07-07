// DeskBub — Desktop Pet Core

const pet = document.getElementById('pet');
const bubble = document.getElementById('bubble');

let anim = 'idle';
let animT = 0;
let animDur = Infinity;
let idleT = 0;
let nextIdle = 6000;
let px = 100, py = 100;
let vx = 0, vy = 0;
let lastTS = 0;
let bubbleTimer = null;

// ============================================================
// ANIMATION
// ============================================================
function setAnim(name) {
  anim = name; animT = 0;
  switch (name) {
    case 'idle': animDur = Infinity; break;
    case 'walk':
      animDur = 5000 + Math.random() * 3000;
      vx = (0.4 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1);
      vy = (Math.random() - 0.5) * 0.3;
      break;
    case 'sit': animDur = 1000; break;
    case 'sleep': animDur = 8000; break;
    case 'stretch': animDur = 1500; break;
    case 'excited': animDur = 2000; break;
  }
}

function triggerRandom() {
  const list = ['walk', 'sit', 'sleep', 'stretch', 'excited'];
  setAnim(list[Math.floor(Math.random() * list.length)]);
}

function showBubble(msg) {
  bubble.textContent = msg;
  bubble.style.left = (px + 60) + 'px';
  bubble.style.top = Math.max(0, py - 35) + 'px';
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 8000);
}

// ============================================================
// LOOP
// ============================================================
function loop(ts) {
  if (!lastTS) lastTS = ts;
  const dt = Math.min(ts - lastTS, 100);
  lastTS = ts;
  animT += dt;
  idleT += dt;

  // Auto switch from idle
  if (anim === 'idle' && idleT > nextIdle) {
    idleT = 0; nextIdle = 6000 + Math.random() * 10000;
    triggerRandom();
  }

  // Update
  let scale = 1, bounce = 0, rotate = 0;
  switch (anim) {
    case 'idle':
      scale = 1 + Math.sin(animT * 0.003) * 0.03;
      break;
    case 'walk':
      px += vx * (dt / 16);
      py += vy * (dt / 16);
      const ww = window.innerWidth, wh = window.innerHeight;
      if (px < 0 || px > ww - 120) { vx *= -1; }
      if (py < 0 || py > wh - 150) { vy *= -1; }
      bounce = Math.abs(Math.sin(animT * 0.01)) * 8;
      rotate = vx > 0 ? 3 : -3;
      if (animT > animDur) setAnim('idle');
      break;
    case 'sit':
      scale = 1 - Math.min(1, animT / animDur) * 0.1;
      if (animT > animDur + 3500) setAnim('idle');
      break;
    case 'sleep':
      scale = 0.78;
      if (animT > animDur + 6000) setAnim('idle');
      break;
    case 'stretch':
      scale = 1 + Math.sin(Math.min(1, animT / animDur) * Math.PI) * 0.12;
      if (animT > animDur) setAnim('idle');
      break;
    case 'excited':
      bounce = Math.abs(Math.sin(animT * 0.02)) * 12;
      if (animT > animDur) setAnim('idle');
      break;
  }

  // Flip when walking left
  const flip = (anim === 'walk' && vx < 0) ? 'scaleX(-1)' : 'scaleX(1)';

  // Apply
  pet.style.transform = `${flip} scale(${scale}) rotate(${rotate}deg)`;
  pet.style.left = px + 'px';
  pet.style.top = (py + bounce) + 'px';

  // Sleep Zzz
  if (anim === 'sleep' && animT > 1000) {
    pet.textContent = '😴';
  } else {
    pet.textContent = '🐱';
  }

  requestAnimationFrame(loop);
}

// ============================================================
// DRAG
// ============================================================
let dragging = false, sx = 0, sy = 0;
pet.addEventListener('mousedown', (e) => {
  dragging = true; sx = e.screenX; sy = e.screenY;
  e.preventDefault();
});
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  window.moveBy(e.screenX - sx, e.screenY - sy);
  sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mouseup', () => { dragging = false; });

// ============================================================
// START
// ============================================================
setAnim('idle');
px = window.innerWidth * 0.3;
py = window.innerHeight * 0.3;
pet.style.left = px + 'px';
pet.style.top = py + 'px';
requestAnimationFrame(loop);

// Auto reminder every 30s
setTimeout(() => showBubble('Hey! Time to stretch! 🧘'), 15000);
setInterval(() => {
  if (Math.random() < 0.3) {
    const msgs = [
      'Time for a water break! 💧',
      'Look away from the screen! 👀',
      'Stand up and stretch! 🧘',
      'Your pet says hi! 👋',
    ];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
  }
}, 30000);
