// ============================================================
// DeskBub — Pet Animation Engine
// ============================================================

const canvas = document.getElementById('petCanvas');
const ctx = canvas.getContext('2d');

let petImage = null;
let config = { petSize: 1.0 };

// Animation state
let currentAnimation = 'idle';
let animationTimer = 0;
let animationDuration = 0;
let idleTimer = 0;
let nextIdleSwitch = 8000; // ms until next random animation

// Position & movement
let petX = 50;
let petY = 80;
let velocityX = 0;
let velocityY = 0;
let walkDirection = 1; // 1 = right, -1 = left

// Animation helpers
let breathPhase = 0;
let stretchPhase = 0;
let sitPhase = 0;
let sleepZzzAlpha = 0;
let eyeBlinkTimer = 0;
let isBlinking = false;

// ============================================================
//  INIT
// ============================================================

function init() {
  resizeCanvas();

  // Load default pet image (or placeholder)
  petImage = new Image();
  petImage.crossOrigin = 'anonymous';

  // Try to load a demo cat silhouette first
  petImage.onload = () => {
    startAnimationLoop();
  };
  petImage.onerror = () => {
    // Draw a default cute shape if no image
    petImage = null;
    startAnimationLoop();
  };
  petImage.src = '../assets/default-pet.png';

  window.addEventListener('resize', resizeCanvas);

  // Drag support
  setupDrag();

  // Listen for config updates from main process
  if (window.deskBub) {
    window.deskBub.onConfigUpdated((newConfig) => {
      config = { ...config, ...newConfig };
    });
    window.deskBub.getConfig().then((cfg) => {
      config = { ...config, ...cfg };
    });
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// ============================================================
//  ANIMATION LOOP
// ============================================================

function startAnimationLoop() {
  function loop(timestamp) {
    update(timestamp);
    draw();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function update(timestamp) {
  const dt = Math.min(timestamp - (update._lastTs || timestamp), 100);
  update._lastTs = timestamp;

  // Update animation timers
  animationTimer += dt;
  idleTimer += dt;

  // Random animation switching when idle
  if (currentAnimation === 'idle' && idleTimer > nextIdleSwitch) {
    idleTimer = 0;
    nextIdleSwitch = 8000 + Math.random() * 12000; // 8-20s
    triggerRandomAnimation();
  }

  // Update current animation
  switch (currentAnimation) {
    case 'idle':
      breathPhase += dt * 0.002;
      break;
    case 'walk':
      petX += velocityX * (dt / 16);
      petY += velocityY * (dt / 16);
      // Bounce off edges
      if (petX < 10 || petX > canvas.width - 160) {
        velocityX *= -1;
        walkDirection = velocityX > 0 ? 1 : -1;
      }
      if (petY < 10 || petY > canvas.height - 180) {
        velocityY *= -1;
      }
      if (animationTimer > animationDuration) {
        setAnimation('idle');
      }
      break;
    case 'sit':
      sitPhase = Math.min(1, animationTimer / animationDuration);
      if (animationTimer > animationDuration + 3000) {
        setAnimation('idle');
      }
      break;
    case 'sleep':
      sleepZzzAlpha = Math.min(1, animationTimer / 1000);
      if (animationTimer > animationDuration + 5000) {
        setAnimation('idle');
      }
      break;
    case 'stretch':
      stretchPhase = animationTimer / animationDuration;
      if (animationTimer > animationDuration) {
        setAnimation('idle');
      }
      break;
    case 'excited':
      if (animationTimer > animationDuration) {
        setAnimation('idle');
      }
      break;
  }

  // Blink timer
  eyeBlinkTimer += dt;
  if (eyeBlinkTimer > 2500 + Math.random() * 2000) {
    eyeBlinkTimer = 0;
    isBlinking = true;
    setTimeout(() => (isBlinking = false), 150);
  }
}

function triggerRandomAnimation() {
  const anims = ['walk', 'sit', 'sleep', 'stretch', 'excited'];
  const choice = anims[Math.floor(Math.random() * anims.length)];
  setAnimation(choice);
}

function setAnimation(name) {
  currentAnimation = name;
  animationTimer = 0;

  switch (name) {
    case 'idle':
      animationDuration = Infinity;
      break;
    case 'walk':
      animationDuration = 4000 + Math.random() * 3000;
      velocityX = (0.3 + Math.random() * 0.7) * (Math.random() > 0.5 ? 1 : -1);
      velocityY = (Math.random() - 0.5) * 0.4;
      walkDirection = velocityX > 0 ? 1 : -1;
      break;
    case 'sit':
      animationDuration = 800;
      break;
    case 'sleep':
      animationDuration = 6000 + Math.random() * 4000;
      break;
    case 'stretch':
      animationDuration = 1200;
      break;
    case 'excited':
      animationDuration = 1500;
      break;
  }
}

// ============================================================
//  DRAW
// ============================================================

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseScale = config.petSize || 1.0;
  const cx = petX + 75;
  const cy = petY + 120;

  ctx.save();

  // Current scale based on animation
  let scale = baseScale;

  if (currentAnimation === 'idle') {
    // Gentle breathing
    scale *= 1 + Math.sin(breathPhase) * 0.03;
  } else if (currentAnimation === 'stretch') {
    // Stretch: grow then shrink
    const t = stretchPhase;
    scale *= t < 0.33 ? 1 * (1 - t * 0.3) : 1 - 0.1 + 0.15 * Math.sin((t - 0.33) * Math.PI / 0.67);
  } else if (currentAnimation === 'sit') {
    scale *= 1 - sitPhase * 0.12;
  } else if (currentAnimation === 'sleep') {
    scale *= 0.78;
  } else if (currentAnimation === 'excited') {
    scale *= 1 + Math.abs(Math.sin(animationTimer * 0.015)) * 0.08;
  }

  // Walk bounce
  let bounceY = 0;
  if (currentAnimation === 'walk') {
    bounceY = Math.abs(Math.sin(animationTimer * 0.01)) * 5;
  }

  ctx.translate(cx, cy + bounceY);
  ctx.scale(scale, scale);
  ctx.translate(-75, -120);

  // Draw pet
  if (petImage) {
    // Flip image based on walk direction
    if (currentAnimation === 'walk' && walkDirection === -1) {
      ctx.save();
      ctx.translate(150, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(petImage, 0, 0, 150, 190);
      ctx.restore();
    } else {
      ctx.drawImage(petImage, 0, 0, 150, 190);
    }
  } else {
    // Placeholder: draw a cute silhouette
    drawPlaceholderPet();
  }

  // Draw "Zzz" for sleep
  if (currentAnimation === 'sleep') {
    drawZzz(-30, -60, sleepZzzAlpha);
  }

  // Draw blink overlay
  if (isBlinking && currentAnimation !== 'sleep') {
    drawBlink();
  }

  ctx.restore();
}

function drawPlaceholderPet() {
  // Simple cat-like shape
  const s = 1.0;

  // Body
  ctx.fillStyle = '#FF9F43';
  ctx.beginPath();
  ctx.ellipse(75, 110, 45 * s, 50 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.beginPath();
  ctx.arc(75, 55, 32 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.beginPath();
  ctx.moveTo(50, 35);
  ctx.lineTo(40, 8);
  ctx.lineTo(62, 30);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(100, 35);
  ctx.lineTo(110, 8);
  ctx.lineTo(88, 30);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#2D3436';
  ctx.beginPath();
  ctx.arc(65, 52, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(85, 52, 4, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.moveTo(75, 58);
  ctx.lineTo(72, 62);
  ctx.lineTo(78, 62);
  ctx.fill();
}

function drawZzz(x, y, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#636E72';
  ctx.font = 'bold 16px system-ui, sans-serif';

  const zzz = ['z', 'Z', 'Z'];
  zzz.forEach((z, i) => {
    const ox = i * 14;
    const oy = -i * 14;
    const s = 0.8 + i * 0.3;
    ctx.save();
    ctx.translate(x + ox + 80, y + oy + 30);
    ctx.scale(s, s);
    ctx.fillText(z, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

function drawBlink() {
  ctx.fillStyle = '#FF9F43';
  ctx.fillRect(60, 48, 30, 8);
}

// ============================================================
//  DRAG
// ============================================================

function setupDrag() {
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.screenX;
    dragStartY = e.screenY;

    if (window.deskBub) {
      window.deskBub.setIgnoreMouse(false);
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.screenX - dragStartX;
    const dy = e.screenY - dragStartY;
    dragStartX = e.screenX;
    dragStartY = e.screenY;
    window.moveBy(dx, dy);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
    if (window.deskBub) {
      // Re-enable click-through on transparent areas
      window.deskBub.setIgnoreMouse(true, { forward: true });
    }
  });
}

// Start!
init();
