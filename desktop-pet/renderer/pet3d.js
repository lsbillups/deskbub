// DeskBub 3D — Three.js rendering for desktop pet
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const bubble = document.getElementById('bubble');
const urlBar = document.getElementById('url-bar');
const hint = document.getElementById('hint');

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
camera.position.set(0, 0.3, 4.5);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
document.body.prepend(renderer.domElement);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 2));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(3, 5, 4);
scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 1.5);
rim.position.set(-3, 2, -3);
scene.add(rim);

// Optional soft ground shadow
const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 1.5),
  new THREE.ShadowMaterial({ opacity: 0.15 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -1.8;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

let model = null;
let mixer = null;

// Animation state
let anim = 'idle';
let animT = 0;
let animDur = Infinity;
let idleT = 0;
let nextIdle = 5000;
let lastTS = 0;
let px = 100, py = 80, vx = 0, vy = 0, dir = 1;

// Bubble
let bubbleTimer = null;

// ============================================================
// LOAD GLB
// ============================================================
window.loadGLB = async () => {
  const url = document.getElementById('glbUrl').value.trim();
  if (!url) return;

  // Remove old model
  if (model) { scene.remove(model); model = null; }

  try {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    model = gltf.scene;

    // Center & scale
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = 2.0 / maxDim;
    model.scale.setScalar(s);
    model.position.set(-center.x * s, -center.y * s - 0.5, -center.z * s);

    // Enable shadows
    model.traverse((child) => {
      if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
    });

    scene.add(model);

    // Hide URL bar
    urlBar.style.opacity = '0';
    urlBar.style.pointerEvents = 'none';
    hint.style.opacity = '0';
    document.getElementById('glbUrl').style.borderColor = '#4ECDC4';
  } catch (e) {
    document.getElementById('glbUrl').style.borderColor = '#FF6B6B';
  }
};

// Show/hide URL bar
window.addEventListener('dblclick', () => {
  urlBar.style.opacity = '1';
  urlBar.style.pointerEvents = 'auto';
  hint.style.opacity = '1';
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    urlBar.style.opacity = '0';
    urlBar.style.pointerEvents = 'none';
    hint.style.opacity = model ? '0' : '1';
  }
});

// ============================================================
// ANIMATION
// ============================================================
function setAnim(name) {
  anim = name; animT = 0;
  switch (name) {
    case 'idle': animDur = Infinity; break;
    case 'walk':
      animDur = 5000 + Math.random() * 3000;
      vx = (0.6 + Math.random() * 0.8) * (Math.random() > 0.5 ? 1 : -1);
      vy = (Math.random() - 0.5) * 0.4;
      dir = vx > 0 ? 1 : -1;
      break;
    case 'sit': animDur = 1000; break;
    case 'sleep': animDur = 10000; break;
    case 'stretch': animDur = 2000; break;
    case 'excited': animDur = 2500; break;
    case 'hop': animDur = 1800; vy = -3; vx = 0; break;
    case 'shake': animDur = 800; break;
  }
}
function triggerRandom() {
  setAnim(['walk', 'sit', 'sleep', 'stretch', 'excited', 'hop', 'shake'][Math.floor(Math.random() * 7)]);
}

function showBubble(msg) {
  bubble.textContent = msg;
  bubble.classList.add('show');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => bubble.classList.remove('show'), 8000);
}

// ============================================================
// RENDER LOOP
// ============================================================
function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

function loop(ts) {
  requestAnimationFrame(loop);
  if (!lastTS) lastTS = ts;
  const dt = Math.min(ts - lastTS, 100);
  lastTS = ts;
  animT += dt;
  idleT += dt;

  if (anim === 'idle' && idleT > nextIdle) {
    idleT = 0; nextIdle = 5000 + Math.random() * 12000;
    triggerRandom();
  }

  let s = 1, bounce = 0, rx = 0, ry = 0;
  switch (anim) {
    case 'idle':
      s = 1 + Math.sin(animT * 0.002) * 0.03;
      ry = Math.sin(animT * 0.0015) * 0.08;
      break;
    case 'walk':
      px += vx * (dt / 16); py += vy * (dt / 16);
      if (px < -100 || px > window.innerWidth + 50) { vx *= -1; dir = vx > 0 ? 1 : -1; }
      if (py < -30 || py > window.innerHeight - 200) vy *= -1;
      bounce = Math.abs(Math.sin(animT * 0.012)) * 0.2;
      ry = dir > 0 ? 0.15 : -0.15;
      if (animT > animDur) setAnim('idle');
      break;
    case 'sit':
      s = 1 - Math.min(1, animT / animDur) * 0.1;
      if (animT > animDur + 4000) setAnim('idle');
      break;
    case 'sleep':
      s = 0.78;
      if (animT > animDur + 7000) setAnim('idle');
      break;
    case 'stretch':
      s = 1 + Math.sin(Math.min(1, animT / animDur) * Math.PI) * 0.15;
      if (animT > animDur) setAnim('idle');
      break;
    case 'excited':
      bounce = Math.abs(Math.sin(animT * 0.025)) * 0.3;
      rx = Math.sin(animT * 0.03) * 0.1;
      if (animT > animDur) setAnim('idle');
      break;
    case 'hop':
      py += vy * (dt / 16); vy += 0.15;
      if (py > 0) { py = 0; vy = -2.5; }
      if (animT > animDur) { py = 0; setAnim('idle'); }
      break;
    case 'shake':
      rx = Math.sin(animT * 0.06) * 0.2;
      if (animT > animDur) setAnim('idle');
      break;
  }

  if (model) {
    model.scale.setScalar(s);
    model.position.x = (px - window.innerWidth / 2) / 200;
    model.position.y = -0.5 - bounce - py / 200;
    model.rotation.x = rx;
    model.rotation.y = (anim !== 'idle' ? ry : ry + 0.3);
  }

  renderer.render(scene, camera);
}
requestAnimationFrame(loop);

// ============================================================
// DRAG
// ============================================================
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

// Reminders
setTimeout(() => showBubble('Hey! Time to stretch! 🧘'), 30000);
setInterval(() => {
  if (Math.random() < 0.2) showBubble(['Water break! 💧', 'Rest your eyes! 👀', 'Stand up! 🧘'][Math.floor(Math.random() * 3)]);
}, 60000);

setAnim('idle');
