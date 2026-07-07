// DeskBub — Desktop Pet Engine (Canvas-based with real pet photo)

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');
const bubble = document.getElementById('bubble');

let petImage = null;       // The user's real pet photo (Image element)
let useRealPet = false;    // Whether we have a real pet loaded

// Animation state
let anim = 'idle';
let animT = 0;
let animDur = Infinity;
let idleT = 0;
let nextIdle = 6000;
let px = 120, py = 120;
let vx = 0, vy = 0, dir = 1;
let breathP = 0;
let blinkT = 0, blinking = false;
let lastTS = 0;

// Reminder bubble
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
      vx = (0.5 + Math.random() * 0.6) * (Math.random() > 0.5 ? 1 : -1);
      vy = (Math.random() - 0.5) * 0.3;
      dir = vx > 0 ? 1 : -1;
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
  bubble.style.left = '60px';
  bubble.style.top = Math.max(0, py - 30) + 'px';
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 8000);
}

// ============================================================
// LOAD PET IMAGE
// ============================================================
window.loadPetImage = function () {
  const url = document.getElementById('imgUrl').value.trim();
  if (!url) return;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    petImage = img;
    useRealPet = true;
    document.getElementById('imgUrl').style.borderColor = '#4ECDC4';
  };
  img.onerror = () => {
    document.getElementById('imgUrl').style.borderColor = '#FF6B6B';
  };
  img.src = url;
};

window.resetPet = function () {
  petImage = null;
  useRealPet = false;
  document.getElementById('imgUrl').value = '';
  document.getElementById('imgUrl').style.borderColor = '#ddd';
};

// ============================================================
// CANVAS RENDER LOOP
// ============================================================
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

  // Auto switch from idle
  if (anim === 'idle' && idleT > nextIdle) {
    idleT = 0; nextIdle = 6000 + Math.random() * 10000;
    triggerRandom();
  }

  // Update
  let scale = 1, bounce = 0, rotate = 0;
  switch (anim) {
    case 'idle':
      breathP += dt * 0.002;
      scale = 1 + Math.sin(breathP) * 0.03;
      break;
    case 'walk':
      px += vx * (dt / 16); py += vy * (dt / 16);
      const ww = canvas.width, wh = canvas.height;
      if (px < -20 || px > ww - 100) vx *= -1;
      if (py < -20 || py > wh - 140) vy *= -1;
      dir = vx > 0 ? 1 : -1;
      bounce = Math.abs(Math.sin(animT * 0.01)) * 8;
      if (animT > animDur) setAnim('idle');
      break;
    case 'sit':
      scale = 1 - Math.min(1, animT / animDur) * 0.08;
      if (animT > animDur + 3500) setAnim('idle');
      break;
    case 'sleep':
      scale = 0.78;
      if (animT > animDur + 6000) setAnim('idle');
      break;
    case 'stretch':
      const t = Math.min(1, animT / animDur);
      scale = 1 + Math.sin(t * Math.PI) * 0.12;
      if (animT > animDur) setAnim('idle');
      break;
    case 'excited':
      bounce = Math.abs(Math.sin(animT * 0.02)) * 12;
      if (animT > animDur) setAnim('idle');
      break;
  }

  // Blink
  blinkT += dt;
  if (blinkT > 2500) { blinkT = 0; blinking = true; setTimeout(() => blinking = false, 120); }

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();

  const cx = px + 65, cy = py + 85 + bounce;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  if (anim === 'walk' && dir === -1) ctx.scale(-1, 1);
  ctx.translate(-65, -85);

  if (useRealPet && petImage) {
    // Draw real pet photo
    const iw = 130, ih = 160;
    // Oval soft clip for a polished look
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(65, 85, 55, 72, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(petImage, 5, 15, iw, ih);
    ctx.restore();

    // Subtle shadow under pet
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(65, 148, 35, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Placeholder emoji cat
    ctx.font = '90px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐱', 65, 85);
  }

  // Sleep Zzz
  if (anim === 'sleep' && animT > 1000) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#636E72';
    ctx.globalAlpha = Math.min(1, (animT - 1000) / 1000);
    ['z', 'Z', 'Z'].forEach((z, i) => {
      ctx.fillText(z, 70 + i * 14, 10 - i * 14);
    });
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  requestAnimationFrame(loop);
}

// ============================================================
// DRAG
// ============================================================
let dragging = false, sx = 0, sy = 0;
document.addEventListener('mousedown', (e) => {
  // Only drag from the pet canvas area, not from input bar
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  dragging = true; sx = e.screenX; sy = e.screenY;
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
requestAnimationFrame(loop);

// Auto reminder
setTimeout(() => showBubble('Hey! Time to stretch! 🧘'), 20000);
setInterval(() => {
  if (Math.random() < 0.25) {
    showBubble(['Water break! 💧', 'Look away from the screen! 👀', 'Stand up and stretch! 🧘'][Math.floor(Math.random() * 3)]);
  }
}, 45000);
