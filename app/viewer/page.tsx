'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default function ViewerPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modelUrl, setModelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const sceneRef = useRef<{ scene: THREE.Scene; renderer: THREE.WebGLRenderer } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Three.js scene
    const container = containerRef.current;
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(5, 8, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.8);
    fill.position.set(-5, 2, -3);
    scene.add(fill);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 6);
    camera.lookAt(0, 0, 0);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.target.set(0, 0, 0);
    controls.update();

    // Ground reference
    const grid = new THREE.GridHelper(3, 20, 0xcccccc, 0xeeeeee);
    grid.position.y = -1.5;
    scene.add(grid);

    sceneRef.current = { scene, renderer };

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, []);

  const loadModel = async () => {
    if (!modelUrl.trim() || !sceneRef.current) return;
    setLoading(true);
    setError('');

    try {
      // Remove old model
      const { scene } = sceneRef.current;
      scene.children
        .filter((c) => c.type === 'Group' || c.type === 'SkinnedMesh' || c.type === 'Mesh')
        .forEach((c) => scene.remove(c));

      const loader = new GLTFLoader();
      const gltf = await loader.loadAsync(modelUrl.trim());

      const model = gltf.scene;
      // Center and scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 2.5;
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -center.y * scale - 0.5, -center.z * scale);

      scene.add(model);
      setLoading(false);
    } catch (err) {
      setError('Failed to load 3D model. Check the URL and try again.');
      setLoading(false);
    }
  };

  return (
    <main className="h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex gap-3 items-center bg-white/80 backdrop-blur border-b border-gray-100 shrink-0">
        <span className="font-display font-bold text-text-primary">🧊 3D Pet Viewer</span>
        <input
          type="text"
          value={modelUrl}
          onChange={(e) => setModelUrl(e.target.value)}
          placeholder="Paste .glb model URL here..."
          className="flex-1 max-w-xl px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-coral"
        />
        <button
          onClick={loadModel}
          disabled={loading}
          className="px-5 py-2 bg-coral text-white text-sm font-semibold rounded-full hover:bg-coral-dark transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Loading...' : 'Load Model'}
        </button>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      {/* 3D Viewport */}
      <div ref={containerRef} className="flex-1" style={{ background: 'radial-gradient(ellipse at center, #f0f0f0 0%, #FFFBF5 70%)' }} />

      {/* Hint */}
      <div className="text-center text-xs text-text-secondary/60 py-3 shrink-0">
        Mouse: drag to rotate · scroll to zoom · right-drag to pan
      </div>
    </main>
  );
}
