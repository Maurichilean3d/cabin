import './style.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';

const canvas = document.querySelector('#experience');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x03040a);
scene.fog = new THREE.FogExp2(0x050714, 0.035);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 700);
camera.position.set(0, 1.25, 1.35);

const cabinRig = new THREE.Group();
scene.add(cabinRig);
cabinRig.add(camera);

const thirdPersonTarget = new THREE.Object3D();
thirdPersonTarget.position.set(0, 2.5, 7.5);
cabinRig.add(thirdPersonTarget);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;

const clock = new THREE.Clock();
let speed = 0.055;
let paused = false;
let progress = 0;
let cameraMode = 'cockpit';
const worldUp = new THREE.Vector3(0, 1, 0);
const tangent = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const temp = new THREE.Vector3();
const normal = new THREE.Vector3();
const binormal = new THREE.Vector3();
const matrix = new THREE.Matrix4();
const quaternion = new THREE.Quaternion();

// Ruta sinuosa para dar sensación de montaña rusa.
const points = [];
const trackLength = 170;
for (let i = 0; i < 56; i += 1) {
  const t = i / 55;
  const z = -t * trackLength;
  const x = Math.sin(t * Math.PI * 7.5) * 9 + Math.sin(t * Math.PI * 18) * 1.4;
  const y = 4 + Math.sin(t * Math.PI * 5.5) * 5 + Math.sin(t * Math.PI * 13) * 1.2;
  points.push(new THREE.Vector3(x, y, z));
}
const trackCurve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.22);

function createTube(curve, radius, color, metalness = 0.2, roughness = 0.45) {
  const geometry = new THREE.TubeGeometry(curve, 420, radius, 12, true);
  const material = new THREE.MeshStandardMaterial({ color, metalness, roughness });
  return new THREE.Mesh(geometry, material);
}

// Riel central y rieles laterales.
scene.add(createTube(trackCurve, 0.065, 0x8b93a8, 0.75, 0.28));
const leftRailPoints = points.map((p, i) => {
  const prev = points[Math.max(i - 1, 0)];
  const next = points[Math.min(i + 1, points.length - 1)];
  const dir = next.clone().sub(prev).normalize();
  const side = new THREE.Vector3().crossVectors(worldUp, dir).normalize().multiplyScalar(0.58);
  return p.clone().add(side).add(new THREE.Vector3(0, -0.38, 0));
});
const rightRailPoints = points.map((p, i) => {
  const prev = points[Math.max(i - 1, 0)];
  const next = points[Math.min(i + 1, points.length - 1)];
  const dir = next.clone().sub(prev).normalize();
  const side = new THREE.Vector3().crossVectors(worldUp, dir).normalize().multiplyScalar(-0.58);
  return p.clone().add(side).add(new THREE.Vector3(0, -0.38, 0));
});
scene.add(createTube(new THREE.CatmullRomCurve3(leftRailPoints, true, 'catmullrom', 0.22), 0.045, 0x5f6676, 0.8, 0.35));
scene.add(createTube(new THREE.CatmullRomCurve3(rightRailPoints, true, 'catmullrom', 0.22), 0.045, 0x5f6676, 0.8, 0.35));

// Túnel futurista que refuerza velocidad y profundidad.
const tunnel = new THREE.Group();
scene.add(tunnel);
const ringMaterial = new THREE.MeshStandardMaterial({
  color: 0x11192c,
  emissive: 0x0b2058,
  emissiveIntensity: 0.35,
  metalness: 0.45,
  roughness: 0.55
});
const ringGeometry = new THREE.TorusGeometry(13.8, 0.045, 8, 96);
for (let i = 0; i < 90; i += 1) {
  const u = i / 90;
  const p = trackCurve.getPointAt(u);
  const next = trackCurve.getPointAt((u + 0.004) % 1);
  const dir = next.sub(p).normalize();
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.position.copy(p);
  ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  ring.scale.setScalar(0.9 + Math.sin(i * 0.41) * 0.08);
  tunnel.add(ring);
}

// Partículas luminosas para motion feeling.
const particleCount = 1250;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i += 1) {
  const u = Math.random();
  const p = trackCurve.getPointAt(u);
  positions[i * 3] = p.x + (Math.random() - 0.5) * 34;
  positions[i * 3 + 1] = p.y + (Math.random() - 0.5) * 18;
  positions[i * 3 + 2] = p.z + (Math.random() - 0.5) * 34;
}
const particlesGeometry = new THREE.BufferGeometry();
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particles = new THREE.Points(
  particlesGeometry,
  new THREE.PointsMaterial({
    size: 0.045,
    color: 0x8fc6ff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  })
);
scene.add(particles);

// Iluminación cinematográfica.
scene.add(new THREE.HemisphereLight(0x7db9ff, 0x101018, 0.82));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
keyLight.position.set(6, 12, 9);
scene.add(keyLight);
const movingLight = new THREE.PointLight(0x55aaff, 7, 32, 1.7);
movingLight.position.set(0, 2.0, -2.0);
cabinRig.add(movingLight);
const redAccent = new THREE.PointLight(0xff315f, 3, 9, 2);
redAccent.position.set(-1.5, 0.8, 1.2);
cabinRig.add(redAccent);

function buildFallbackCabin() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x18233d,
    metalness: 0.68,
    roughness: 0.32,
    emissive: 0x07122d,
    emissiveIntensity: 0.25
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x55aaff,
    metalness: 0.4,
    roughness: 0.2,
    emissive: 0x0f5db8,
    emissiveIntensity: 0.9
  });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x08090f, roughness: 0.68 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 3.2), bodyMaterial);
  base.position.y = 0.45;
  group.add(base);

  const front = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.0, 0.18), bodyMaterial);
  front.position.set(0, 0.95, -1.56);
  group.add(front);

  const back = front.clone();
  back.position.z = 1.56;
  group.add(back);

  const left = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.08, 3.1), bodyMaterial);
  left.position.set(-1.33, 0.95, 0);
  group.add(left);
  const right = left.clone();
  right.position.x = 1.33;
  group.add(right);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.4, 1.0), seatMaterial);
  seat.position.set(0, 0.9, 0.55);
  group.add(seat);
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.0, 0.25), seatMaterial);
  backrest.position.set(0, 1.45, 1.04);
  group.add(backrest);

  for (const x of [-1.37, 1.37]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.055, 3.4), trimMaterial);
    strip.position.set(x, 1.54, 0);
    group.add(strip);
  }

  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 2.0, 16), trimMaterial);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, 1.42, 0.05);
  group.add(bar);

  return group;
}

function enhanceCabinMaterials(root) {
  const palette = [0x151d30, 0x1f2f53, 0x2d3d66, 0x08111e];
  let meshIndex = 0;
  root.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.geometry.computeVertexNormals?.();

    const name = `${child.name}`.toLowerCase();
    const isGlass = name.includes('glass') || name.includes('window') || name.includes('visor');
    const isSeat = name.includes('seat') || name.includes('chair') || name.includes('cushion');
    const baseColor = palette[meshIndex % palette.length];
    meshIndex += 1;

    child.material = new THREE.MeshStandardMaterial({
      color: isSeat ? 0x08090f : baseColor,
      metalness: isGlass ? 0.05 : 0.62,
      roughness: isGlass ? 0.05 : 0.32,
      transparent: isGlass,
      opacity: isGlass ? 0.42 : 1,
      emissive: isSeat ? 0x000000 : 0x06132e,
      emissiveIntensity: isSeat ? 0 : 0.12
    });
  });

  const neonMaterial = new THREE.MeshStandardMaterial({
    color: 0x4fb3ff,
    emissive: 0x198cff,
    emissiveIntensity: 1.4,
    roughness: 0.2,
    metalness: 0.2
  });
  const railGeometry = new THREE.BoxGeometry(0.055, 0.045, 2.7);
  const leftNeon = new THREE.Mesh(railGeometry, neonMaterial);
  leftNeon.position.set(-1.05, 1.1, 0.05);
  const rightNeon = leftNeon.clone();
  rightNeon.position.x = 1.05;
  root.add(leftNeon, rightNeon);

  const safetyBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 24), neonMaterial);
  safetyBar.rotation.z = Math.PI / 2;
  safetyBar.position.set(0, 1.05, -0.25);
  root.add(safetyBar);
}

function fitCabinToRig(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const desiredHeight = 2.2;
  const scale = desiredHeight / Math.max(size.y, 0.001);
  root.scale.setScalar(scale);

  const adjustedBox = new THREE.Box3().setFromObject(root);
  adjustedBox.getCenter(center);
  const minY = adjustedBox.min.y;
  root.position.sub(center);
  root.position.y += -minY + 0.05;

  // Muchos FBX salen mirando en un eje distinto; este giro suele alinear la cabina con el avance.
  root.rotation.y += Math.PI;
}

function loadCabin() {
  const loader = new FBXLoader();
  loader.load(
    '/assets/cabin.fbx',
    (fbx) => {
      enhanceCabinMaterials(fbx);
      fitCabinToRig(fbx);
      cabinRig.add(fbx);
      document.body.classList.add('ready');
    },
    undefined,
    (error) => {
      console.warn('No se pudo cargar cabin.fbx, usando cabina procedural.', error);
      const fallback = buildFallbackCabin();
      cabinRig.add(fallback);
      document.body.classList.add('ready');
    }
  );
}
loadCabin();

function setCameraMode(mode) {
  cameraMode = mode;
  controls.enabled = mode === 'inspect';
  if (mode === 'cockpit') {
    cabinRig.add(camera);
    camera.position.set(0, 1.23, 0.55);
    camera.rotation.set(0, 0, 0);
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }
  if (mode === 'chase') {
    cabinRig.add(camera);
    camera.position.set(0, 2.5, 7.5);
    camera.lookAt(0, 1.1, -2.5);
    camera.fov = 68;
    camera.updateProjectionMatrix();
  }
  if (mode === 'inspect') {
    scene.add(camera);
    camera.position.set(4, 4, 7);
    controls.target.copy(cabinRig.position);
    camera.fov = 65;
    camera.updateProjectionMatrix();
  }
}
setCameraMode('cockpit');

function updateRig(delta) {
  if (!paused) {
    progress = (progress + delta * speed) % 1;
  }

  const point = trackCurve.getPointAt(progress);
  tangent.copy(trackCurve.getTangentAt(progress)).normalize();
  lookAt.copy(point).add(tangent);

  // Orientación con banking lateral para simular fuerza centrífuga.
  normal.copy(worldUp).cross(tangent).normalize();
  binormal.copy(tangent).cross(normal).normalize();
  const bank = Math.sin(progress * Math.PI * 18) * 0.22 + Math.sin(progress * Math.PI * 6) * 0.16;
  normal.applyAxisAngle(tangent, bank);
  binormal.crossVectors(tangent, normal).normalize();

  matrix.makeBasis(normal, binormal, tangent.clone().multiplyScalar(-1));
  quaternion.setFromRotationMatrix(matrix);

  // Vibración ligera para sensación de velocidad sin ser demasiado agresiva.
  const rumble = Math.sin(clock.elapsedTime * 41) * 0.018 + Math.sin(clock.elapsedTime * 67) * 0.008;
  temp.copy(point).addScaledVector(binormal, rumble);
  cabinRig.position.copy(temp);
  cabinRig.quaternion.slerp(quaternion, 0.24);

  if (cameraMode === 'inspect') {
    controls.target.lerp(cabinRig.position, 0.08);
  }
}

function animateScene(delta) {
  tunnel.rotation.z += delta * 0.035;
  particles.rotation.y += delta * 0.012;
  movingLight.intensity = 5.5 + Math.sin(clock.elapsedTime * 8) * 1.2;
}

renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.04);
  updateRig(delta);
  animateScene(delta);
  controls.update();
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key === 'w') speed = Math.min(speed + 0.012, 0.22);
  if (key === 's') speed = Math.max(speed - 0.012, 0.006);
  if (key === ' ') paused = !paused;
  if (key === 'c') {
    const next = cameraMode === 'cockpit' ? 'chase' : cameraMode === 'chase' ? 'inspect' : 'cockpit';
    setCameraMode(next);
  }
});
