// ============================================================
// DeskBub — Pet Animation Engine
// ============================================================

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');

let petImage = null;
let useImage = false;
let config = { petSize: 1.0, opacity: 0.9 };

// Animation state
let currentAnimation = 'idle';
let animationTimer = 0;
let animationDuration = 0;
let idleTimer = 0;
let nextIdleSwitch = 8000;

// Position & movement
let petX = 0;
let petY = 0;
let velocityX = 0;
let velocityY = 0;
let walkDirection = 1;

// Animation helpers
let breathPhase = 0;
let sitPhase = 0;
let sleepZzzAlpha = 0;
let eyeBlinkTimer = 0;
let isBlinking = false;

// ============================================================
// INIT
// ============================================================
function init() {
  resizeCanvas();
  petX = canvas.width * 0.3;
  petY = canvas.height * 0.25;

  // Try loading pet image
  petImage = new Image();
  petImage.onload = () => { useImage = true; };
  petImage.onerror = () => { useImage = false; };
  petImage.src = '../assets/default-pet.png';

  // Listen for config updates
  if (window.deskBub) {
    window.deskBub.onConfigUpdated((newConfig) => {
      config = { ...config, ...newConfig };
    });
    window.deskBub.getConfig().then((cfg) => {
      config = { ...config, ...cfg };
    });
  }

  startAnimationLoop();
  setupDrag();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);

// ============================================================
// ANIMATION LOOP
// ============================================================
function startAnimationLoop() {
  let lastTS = 0;
  function loop(ts) {
    if (!lastTS) lastTS = ts;
    const dt = Math.min(ts - lastTS, 100);
    lastTS = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function update(dt) {
  animationTimer += dt;
  idleTimer += dt;

  if (currentAnimation === 'idle' && idleTimer > nextIdleSwitch) {
    idleTimer = 0;
    nextIdleSwitch = 8000 + Math.random() * 12000;
    triggerRandomAnimation();
  }

  switch (currentAnimation) {
    case 'idle':
      breathPhase += dt * 0.002;
      break;
    case 'walk':
      petX += velocityX * (dt / 16);
      petY += velocityY * (dt / 16);
      if (petX < 10 || petX > canvas.width - 140) { velocityX *= -1; walkDirection = velocityX > 0 ? 1 : -1; }
      if (petY < 10 || petY > canvas.height - 200) velocityY *= -1;
      if (animationTimer > animationDuration) setAnimation('idle');
      break;
    case 'sit':
      sitPhase = Math.min(1, animationTimer / animationDuration);
      if (animationTimer > animationDuration + 3500) setAnimation('idle');
      break;
    case 'sleep':
      sleepZzzAlpha = Math.min(1, animationTimer / 1000);
      if (animationTimer > animationDuration + 6000) setAnimation('idle');
      break;
    case 'excited':
      if (animationTimer > animationDuration) setAnimation('idle');
      break;
    case 'stretch':
      if (animationTimer > animationDuration) setAnimation('idle');
      break;
  }

  eyeBlinkTimer += dt;
  if (eyeBlinkTimer > 2500 + Math.random() * 2000) {
    eyeBlinkTimer = 0;
    isBlinking = true;
    setTimeout(() => { isBlinking = false; }, 150);
  }
}

function triggerRandomAnimation() {
  const anims = ['walk', 'sit', 'sleep', 'stretch', 'excited'];
  setAnimation(anims[Math.floor(Math.random() * anims.length)]);
}

function setAnimation(name) {
  currentAnimation = name;
  animationTimer = 0;
  switch (name) {
    case 'idle': animationDuration = Infinity; break;
    case 'walk':
      animationDuration = 4000 + Math.random() * 3000;
      velocityX = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
      velocityY = (Math.random() - 0.5) * 0.4;
      walkDirection = velocityX > 0 ? 1 : -1;
      break;
    case 'sit': animationDuration = 800; break;
    case 'sleep': animationDuration = 7000; break;
    case 'stretch': animationDuration = 1500; break;
    case 'excited': animationDuration = 2000; break;
  }
}

// ============================================================
// DRAW
// ============================================================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseScale = config.petSize || 1.0;
  let scale = baseScale;
  let bounceY = 0;

  if (currentAnimation === 'idle') {
    scale *= 1 + Math.sin(breathPhase) * 0.03;
  } else if (currentAnimation === 'walk') {
    bounceY = Math.abs(Math.sin(animationTimer * 0.008)) * 6;
  } else if (currentAnimation === 'sit') {
    scale *= 1 - sitPhase * 0.1;
  } else if (currentAnimation === 'sleep') {
    scale *= 0.78;
  } else if (currentAnimation === 'excited') {
    scale *= 1 + Math.abs(Math.sin(animationTimer * 0.012)) * 0.08;
  } else if (currentAnimation === 'stretch') {
    const t = animationTimer / animationDuration;
    scale *= t < 0.4 ? 1 - t * 0.2 : 0.92 + 0.15 * Math.sin((t - 0.4) * Math.PI / 0.6);
  }

  ctx.save();
  const cx = petX + 75;
  const cy = petY + 100 + bounceY;
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // Flip for walk direction
  if (currentAnimation === 'walk' && walkDirection === -1) {
    ctx.scale(-1, 1);
  }
  ctx.translate(-75, -100);

  if (useImage && petImage) {
    ctx.drawImage(petImage, 0, 20, 150, 180);
  } else {
    drawEmojiPet();
  }

  // Sleep Zzz
  if (currentAnimation === 'sleep') {
    ctx.globalAlpha = sleepZzzAlpha;
    ctx.fillStyle = '#636E72';
    ctx.font = 'bold 16px sans-serif';
    ['z', 'Z', 'Z'].forEach((z, i) => {
      ctx.fillText(z, 80 + i * 14, 20 - i * 14);
    });
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawEmojiPet() {
  // Draw a cute cat emoji at large size
  ctx.font = '80px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🐱', 75, 80);
}

// ============================================================
// DRAG
// ============================================================
function setupDrag() {
  let isDragging = false;
  let startX = 0, startY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.screenX;
    startY = e.screenY;
    if (window.deskBub) window.deskBub.setIgnoreMouse(false);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    window.moveBy(e.screenX - startX, e.screenY - startY);
    startX = e.screenX;
    startY = e.screenY;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (window.deskBub) window.deskBub.setIgnoreMouse(true, { forward: true });
  });
}

init();
