// DeskBub — Desktop Pet Engine

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');
const bubble = document.getElementById('bubble');
const urlBar = document.getElementById('url-bar');

let petImage = null;
let useRealPet = false;

// Animation
let anim = 'idle';
let animT = 0;
let animDur = Infinity;
let idleT = 0;
let nextIdle = 5000;
let px = 100, py = 80;
let vx = 0, vy = 0, dir = 1;
let breathP = 0;
let blinkT = 0, blinking = false;
let lastTS = 0;
let bubbleTimer = null;

// Pet base size — BIGGER
const PET_W = 180;
const PET_H = 240;

function setAnim(name) {
  anim = name; animT = 0;
  switch (name) {
    case 'idle': animDur = Infinity; break;
    case 'walk':
      animDur = 6000 + Math.random() * 4000;
      vx = (0.8 + Math.random() * 1.0) * (Math.random() > 0.5 ? 1 : -1);
      vy = (Math.random() - 0.5) * 0.5;
      dir = vx > 0 ? 1 : -1;
      break;
    case 'sit': animDur = 1000; break;
    case 'sleep': animDur = 10000; break;
    case 'stretch': animDur = 2000; break;
    case 'excited': animDur = 2500; break;
    case 'hop':
      animDur = 1800;
      vx = 0; vy = -3;
      break;
    case 'shake':
      animDur = 800;
      break;
  }
}

function triggerRandom() {
  const list = ['walk', 'sit', 'sleep', 'stretch', 'excited', 'hop', 'shake'];
  setAnim(list[Math.floor(Math.random() * list.length)]);
}

function showBubble(msg) {
  bubble.textContent = msg;
  bubble.style.left = (px + PET_W / 2 - 60) + 'px';
  bubble.style.top = Math.max(0, py - 25) + 'px';
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 8000);
}

// Load pet image
window.loadPetImage = function () {
  const input = document.getElementById('imgUrl');
  const url = input.value.trim();
  if (!url) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    petImage = img;
    useRealPet = true;
    input.style.borderColor = '#4ECDC4';
    // Hide URL bar after successful load
    urlBar.style.opacity = '0';
    urlBar.style.pointerEvents = 'none';
  };
  img.onerror = () => {
    input.style.borderColor = '#FF6B6B';
  };
  img.src = url;
};

// Show URL bar on double-click
window.addEventListener('dblclick', () => {
  urlBar.style.opacity = '1';
  urlBar.style.pointerEvents = 'auto';
});

// Hide URL bar on escape
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    urlBar.style.opacity = '0';
    urlBar.style.pointerEvents = 'none';
    document.getElementById('imgUrl').blur();
  }
});

// Canvas
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function loop(ts) {
  if (!lastTS) lastTS = ts;
  const dt = Math.min(ts - lastTS, 100);
  lastTS = ts;
  animT += dt;
  idleT += dt;

  if (anim === 'idle' && idleT > nextIdle) {
    idleT = 0; nextIdle = 5000 + Math.random() * 12000;
    triggerRandom();
  }

  let scale = 1, bounce = 0, rotate = 0;
  let shadowScale = 1;

  switch (anim) {
    case 'idle':
      breathP += dt * 0.003;
      scale = 1 + Math.sin(breathP) * 0.04;
      break;
    case 'walk':
      px += vx * (dt / 16); py += vy * (dt / 16);
      if (px < -30 || px > canvas.width - PET_W + 30) { vx *= -1; dir = vx > 0 ? 1 : -1; }
      if (py < -10 || py > canvas.height - PET_H + 20) vy *= -1;
      bounce = Math.abs(Math.sin(animT * 0.012)) * 10;
      rotate = dir * 3;
      if (animT > animDur) setAnim('idle');
      break;
    case 'sit':
      scale = 1 - Math.min(1, animT / animDur) * 0.08;
      py = Math.min(py, canvas.height - PET_H + 20);
      if (animT > animDur + 4000) setAnim('idle');
      break;
    case 'sleep':
      scale = 0.78;
      if (animT > animDur + 7000) setAnim('idle');
      break;
    case 'stretch': {
      const t = Math.min(1, animT / animDur);
      scale = 1 + Math.sin(t * Math.PI) * 0.18;
      if (animT > animDur) setAnim('idle');
      break;
    }
    case 'excited':
      bounce = Math.abs(Math.sin(animT * 0.025)) * 16;
      rotate = Math.sin(animT * 0.03) * 5;
      if (animT > animDur) setAnim('idle');
      break;
    case 'hop':
      py += vy * (dt / 16);
      vy += 0.15; // gravity
      if (py > canvas.height - PET_H) { py = canvas.height - PET_H; vy = -2.5; }
      bounce = 0;
      scale = 1 + Math.sin(animT * 0.01) * 0.06;
      if (animT > animDur) { py = Math.max(0, py); setAnim('idle'); }
      break;
    case 'shake':
      rotate = Math.sin(animT * 0.06) * 12;
      if (animT > animDur) setAnim('idle');
      break;
  }

  blinkT += dt;
  if (blinkT > 2500) { blinkT = 0; blinking = true; setTimeout(() => blinking = false, 130); }

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = px + PET_W / 2;
  const cy = py + PET_H * 0.65 + bounce;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  ctx.rotate((rotate * Math.PI) / 180);
  if (anim === 'walk' && dir === -1) ctx.scale(-1, 1);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(0, PET_H * 0.32, PET_W * 0.35 * shadowScale, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  if (useRealPet && petImage) {
    const iw = PET_W, ih = PET_H;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, PET_W * 0.38, PET_H * 0.40, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(petImage, -iw / 2, -ih * 0.55, iw, ih);
    ctx.restore();
  } else {
    ctx.font = `${PET_W * 0.6}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', 0, 0);
  }

  // Sleep Zzz
  if (anim === 'sleep' && animT > 1500) {
    ctx.font = `bold ${PET_W * 0.13}px sans-serif`;
    ctx.fillStyle = '#636E72';
    ctx.globalAlpha = Math.min(1, (animT - 1500) / 1000);
    ['z', 'Z', 'Z'].forEach((z, i) => {
      ctx.fillText(z, PET_W * 0.3 + i * 16, -PET_H * 0.35 - i * 16);
    });
    ctx.globalAlpha = 1;
  }

  ctx.restore();
  requestAnimationFrame(loop);
}

// Drag
let dragging = false, sx = 0, sy = 0;
document.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  dragging = true; sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  window.moveBy(e.screenX - sx, e.screenY - sy);
  sx = e.screenX; sy = e.screenY;
});
window.addEventListener('mouseup', () => { dragging = false; });

// Start
setAnim('idle');
requestAnimationFrame(loop);

// Reminders
setTimeout(() => showBubble('Hey! Time to stretch! 🧘'), 25000);
setInterval(() => {
  if (Math.random() < 0.25) {
    showBubble(['Water break! 💧', 'Rest your eyes! 👀', 'Stand up & stretch! 🧘', 'Your pet missed you! 🐾'][Math.floor(Math.random() * 4)]);
  }
}, 50000);
