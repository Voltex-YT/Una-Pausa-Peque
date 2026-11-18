const container = document.getElementById('canvas-container');
const hintPill = document.getElementById('hint-pill');
const letterCard = document.getElementById('letter-card');
const closeLetterBtn = document.getElementById('close-letter');
const openArcadeBtn = document.getElementById('open-arcade-btn');
const arcadeHubOverlay = document.getElementById('arcade-hub-overlay');
const closeArcadeHubBtn = document.getElementById('close-arcade-hub');

window.isGameOpen = false;

window.openArcadeHub = function () {
  window.isGameOpen = true;
  letterCard.classList.remove('open');
  arcadeHubOverlay.classList.add('active');
};

window.closeArcadeHub = function () {
  window.isGameOpen = false;
  arcadeHubOverlay.classList.remove('active');
  letterCard.classList.add('open');
};

openArcadeBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.openArcadeHub();
});

closeArcadeHubBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  window.closeArcadeHub();
});

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 860;
const isPortrait = () => window.innerHeight > window.innerWidth;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050311, 0.016);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.1, 240);
const defaultCamPos = new THREE.Vector3(0, 7.6, 25.5);
const defaultLookAt = new THREE.Vector3(0, 3.1, 0);
camera.position.copy(defaultCamPos);

const renderer = new THREE.WebGLRenderer({ antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.75 : 2));
renderer.setClearColor(0x04030c, 1);
container.appendChild(renderer.domElement);

function createGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.22, 'rgba(255, 245, 252, 0.88)');
  grad.addColorStop(0.5, 'rgba(255, 190, 230, 0.35)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

const glowTexture = createGlowTexture();

const tulipCount = isMobile ? 95 : 135;
const particlesPerTulip = isMobile ? 380 : 480;
const heroExtraParticles = 80;
const ambientCount = isMobile ? 2500 : 4500;
const totalParticles = tulipCount * particlesPerTulip + heroExtraParticles + ambientCount;

const startPositions = new Float32Array(totalParticles * 3);
const targetPositions = new Float32Array(totalParticles * 3);
const colors = new Float32Array(totalParticles * 3);
const sizes = new Float32Array(totalParticles);
const phases = new Float32Array(totalParticles);
const delays = new Float32Array(totalParticles);
const isHeroAttr = new Float32Array(totalParticles);
const partTypeAttr = new Float32Array(totalParticles);

const heroWorldPos = new THREE.Vector3(0, 0, 6.2);

const tulipConfigs = [];
tulipConfigs.push({
  x: heroWorldPos.x,
  z: heroWorldPos.z,
  scale: 1.54,
  height: 5.3,
  hueShift: 0,
  isHero: true
});

for (let i = 1; i < tulipCount; i++) {
  const ring = Math.pow(i / tulipCount, 0.62);
  const angle = i * 2.3999632;
  const radius = 2.8 + ring * 23.0;
  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 1.4;
  const z = Math.sin(angle) * radius * 0.82 - 2.0 + (Math.random() - 0.5) * 1.4;

  if (Math.hypot(x - heroWorldPos.x, z - heroWorldPos.z) < 2.5) continue;

  tulipConfigs.push({
    x,
    z,
    scale: 0.78 + Math.random() * 0.52,
    height: 3.2 + Math.random() * 1.8,
    hueShift: (Math.random() - 0.5) * 0.14,
    isHero: false
  });
}

const cStem = new THREE.Color();
const cPetalBase = new THREE.Color();
const cPetalTip = new THREE.Color();
const cGold = new THREE.Color(0xffdf78);
const tempColor = new THREE.Color();

let idx = 0;

for (let t = 0; t < tulipConfigs.length; t++) {
  const cfg = tulipConfigs[t];
  const distFromHero = Math.hypot(cfg.x - heroWorldPos.x, cfg.z - heroWorldPos.z);
  const baseDelay = cfg.isHero ? 0.02 : Math.min(0.45, distFromHero * 0.016 + Math.random() * 0.08);
  const currentParticlesForTulip = cfg.isHero ? (particlesPerTulip + heroExtraParticles) : particlesPerTulip;

  if (cfg.isHero) {
    cStem.setHSL(0.43, 0.88, 0.54);
    cPetalBase.setHSL(0.93, 0.96, 0.64);
    cPetalTip.setHSL(0.11, 1.0, 0.82);
  } else {
    cStem.setHSL(0.42 + Math.random() * 0.06, 0.78, 0.36 + Math.random() * 0.1);
    cPetalBase.setHSL((0.91 + cfg.hueShift + 1.0) % 1.0, 0.88, 0.52);
    cPetalTip.setHSL((0.96 + cfg.hueShift + 1.0) % 1.0, 0.95, 0.72);
  }

  const stemCount = Math.floor(currentParticlesForTulip * 0.24);
  const leafCount = Math.floor(currentParticlesForTulip * 0.22);

  for (let p = 0; p < currentParticlesForTulip; p++) {
    if (idx >= totalParticles - ambientCount) break;

    let tx = 0, ty = 0, tz = 0;
    let pType = 1.0;

    if (p < stemCount) {
      const u = p / stemCount;
      const bend = Math.sin(u * Math.PI) * 0.18 * cfg.scale;
      const theta = Math.random() * Math.PI * 2;
      const r = 0.055 * cfg.scale * (1.0 - u * 0.35);
      tx = cfg.x + bend + Math.cos(theta) * r;
      ty = u * cfg.height;
      tz = cfg.z + Math.sin(theta) * r;
      tempColor.copy(cStem).lerp(cGold, u * 0.18);
      pType = 0.0;
    } else if (p < stemCount + leafCount) {
      const leafSide = p % 2 === 0 ? 1 : -1;
      const u = Math.random();
      const v = (Math.random() - 0.5) * 2.0;
      const leafLen = 2.2 * cfg.scale;
      const leafWidth = Math.sin(u * Math.PI) * 0.42 * cfg.scale;
      const lx = leafSide * (u * leafLen * 0.65);
      const ly = cfg.height * 0.16 + Math.sin(u * Math.PI * 0.78) * leafLen * 0.85;
      const lz = v * leafWidth;
      const rotY = cfg.x * 0.4 + leafSide * 0.5;
      tx = cfg.x + lx * Math.cos(rotY) - lz * Math.sin(rotY);
      ty = ly;
      tz = cfg.z + lx * Math.sin(rotY) + lz * Math.cos(rotY);
      tempColor.copy(cStem).offsetHSL(0.02, 0.08, u * 0.14);
      pType = 0.0;
    } else {
      const petalIdx = p % 6;
      const petalAngle = (petalIdx / 6) * Math.PI * 2 + (petalIdx % 2) * 0.18;
      const u = Math.pow(Math.random(), 0.72);
      const v = (Math.random() - 0.5) * 2.0;
      const cupHeight = 1.65 * cfg.scale;
      const profile = Math.sin(u * Math.PI * 0.86);
      const cupRadius = (0.22 + profile * 0.62) * cfg.scale * (petalIdx % 2 === 0 ? 0.94 : 1.04);
      const widthSpread = v * 0.42 * profile;

      const localAngle = petalAngle + widthSpread;
      const px = Math.cos(localAngle) * cupRadius;
      const pz = Math.sin(localAngle) * cupRadius;
      const py = cfg.height - 0.1 + u * cupHeight;

      tx = cfg.x + px;
      ty = py;
      tz = cfg.z + pz;

      tempColor.copy(cPetalBase).lerp(cPetalTip, Math.pow(u, 1.35));
      if (u > 0.82 || (u < 0.25 && Math.random() > 0.72)) {
        tempColor.lerp(cGold, cfg.isHero ? 0.72 : 0.42);
      }
      pType = 1.0;
    }

    targetPositions[idx * 3] = tx;
    targetPositions[idx * 3 + 1] = ty;
    targetPositions[idx * 3 + 2] = tz;

    const swirlAngle = Math.random() * Math.PI * 6;
    const swirlRadius = 4.0 + Math.random() * 24.0;
    startPositions[idx * 3] = Math.cos(swirlAngle) * swirlRadius;
    startPositions[idx * 3 + 1] = 10.0 + Math.random() * 18.0;
    startPositions[idx * 3 + 2] = Math.sin(swirlAngle) * swirlRadius - 4.0;

    colors[idx * 3] = tempColor.r;
    colors[idx * 3 + 1] = tempColor.g;
    colors[idx * 3 + 2] = tempColor.b;

    sizes[idx] = cfg.isHero
      ? (0.27 + Math.random() * 0.18)
      : (0.14 + Math.random() * 0.12);

    phases[idx] = Math.random() * Math.PI * 2;
    delays[idx] = baseDelay + Math.random() * 0.28;
    isHeroAttr[idx] = cfg.isHero ? 1.0 : 0.0;
    partTypeAttr[idx] = pType;

    idx++;
  }
}

const heroSparkleCount = 65;
for (let s = 0; s < heroSparkleCount && idx < totalParticles; s++) {
  const ang = Math.random() * Math.PI * 2;
  const rad = 0.5 + Math.random() * 1.45;
  targetPositions[idx * 3] = heroWorldPos.x + Math.cos(ang) * rad;
  targetPositions[idx * 3 + 1] = 3.2 + Math.random() * 4.4;
  targetPositions[idx * 3 + 2] = heroWorldPos.z + Math.sin(ang) * rad;

  const sAng = Math.random() * Math.PI * 4;
  startPositions[idx * 3] = Math.cos(sAng) * 10.0;
  startPositions[idx * 3 + 1] = 14.0 + Math.random() * 10.0;
  startPositions[idx * 3 + 2] = Math.sin(sAng) * 10.0;

  const spCol = new THREE.Color().setHSL(Math.random() > 0.35 ? 0.12 : 0.93, 1.0, 0.78);
  colors[idx * 3] = spCol.r;
  colors[idx * 3 + 1] = spCol.g;
  colors[idx * 3 + 2] = spCol.b;

  sizes[idx] = 0.2 + Math.random() * 0.18;
  phases[idx] = Math.random() * Math.PI * 2;
  delays[idx] = 0.1 + Math.random() * 0.25;
  isHeroAttr[idx] = 1.0;
  partTypeAttr[idx] = 3.0;
  idx++;
}

while (idx < totalParticles) {
  const rx = (Math.random() - 0.5) * 56;
  const ry = Math.random() * 24;
  const rz = (Math.random() - 0.5) * 48 - 4;

  targetPositions[idx * 3] = rx;
  targetPositions[idx * 3 + 1] = ry;
  targetPositions[idx * 3 + 2] = rz;

  const ang = Math.random() * Math.PI * 4;
  const rad = 8 + Math.random() * 26;
  startPositions[idx * 3] = Math.cos(ang) * rad;
  startPositions[idx * 3 + 1] = 14 + Math.random() * 16;
  startPositions[idx * 3 + 2] = Math.sin(ang) * rad;

  const starColor = new THREE.Color().setHSL(
    Math.random() > 0.45 ? 0.92 : (Math.random() > 0.5 ? 0.12 : 0.52),
    0.85,
    0.72
  );
  colors[idx * 3] = starColor.r;
  colors[idx * 3 + 1] = starColor.g;
  colors[idx * 3 + 2] = starColor.b;

  sizes[idx] = 0.1 + Math.random() * 0.16;
  phases[idx] = Math.random() * Math.PI * 2;
  delays[idx] = Math.random() * 0.55;
  isHeroAttr[idx] = 0.0;
  partTypeAttr[idx] = 2.0;

  idx++;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(targetPositions, 3));
geometry.setAttribute('aStartPos', new THREE.BufferAttribute(startPositions, 3));
geometry.setAttribute('aTargetPos', new THREE.BufferAttribute(targetPositions, 3));
geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
geometry.setAttribute('aDelay', new THREE.BufferAttribute(delays, 1));
geometry.setAttribute('aIsHero', new THREE.BufferAttribute(isHeroAttr, 1));
geometry.setAttribute('aPartType', new THREE.BufferAttribute(partTypeAttr, 1));

const particleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uPixelRatio: { value: renderer.getPixelRatio() },
    uMap: { value: glowTexture },
    uMouse: { value: new THREE.Vector3(999, 999, 999) },
    uLetterOpen: { value: 0 },
    uAuroraWave: { value: 0 }
  },
  vertexShader: `
    attribute vec3 aStartPos;
    attribute vec3 aTargetPos;
    attribute vec3 aColor;
    attribute float aSize;
    attribute float aPhase;
    attribute float aDelay;
    attribute float aIsHero;
    attribute float aPartType;

    uniform float uTime;
    uniform float uProgress;
    uniform float uPixelRatio;
    uniform vec3 uMouse;
    uniform float uLetterOpen;
    uniform float uAuroraWave;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      float localP = clamp((uProgress - aDelay) / max(0.001, 1.0 - aDelay), 0.0, 1.0);
      float ease = 1.0 - pow(1.0 - localP, 3.0);

      float spiralAngle = (1.0 - ease) * 4.5 + aPhase * 0.25;
      float s = sin(spiralAngle);
      float c = cos(spiralAngle);
      vec3 rotatedStart = vec3(
        aStartPos.x * c - aStartPos.z * s,
        aStartPos.y,
        aStartPos.x * s + aStartPos.z * c
      );

      vec3 pos = mix(rotatedStart, aTargetPos, ease);

      if (aPartType < 1.5) {
        float heightFactor = clamp(pos.y / 5.5, 0.0, 1.0);
        float windX = sin(uTime * 1.45 + pos.x * 0.28 + pos.z * 0.22 + aPhase * 0.3) * 0.22 * heightFactor * ease;
        float windZ = cos(uTime * 1.15 + pos.z * 0.25 + aPhase * 0.2) * 0.14 * heightFactor * ease;
        pos.x += windX;
        pos.z += windZ;

        float dMouse = distance(pos.xz, uMouse.xz);
        if (dMouse < 3.6) {
          float push = (1.0 - dMouse / 3.6) * 0.65 * heightFactor * ease;
          vec2 dir = normalize(pos.xz - uMouse.xz + vec2(0.001));
          pos.xz += dir * push;
          pos.y += push * 0.25;
        }
      } else if (aPartType > 2.5) {
        float lift = fract(uTime * 0.28 + aPhase);
        pos.y += lift * 1.9 * ease;
        pos.x += sin(uTime * 1.8 + aPhase * 2.0) * 0.32 * ease;
        pos.z += cos(uTime * 1.6 + aPhase * 2.0) * 0.32 * ease;
      } else {
        pos.y += sin(uTime * 0.9 + aPhase) * 0.45;
        pos.x += cos(uTime * 0.65 + aPhase) * 0.35;
      }

      float idlePulse = 0.5 + 0.5 * sin(uTime * 2.4 + aPhase * 0.3);
      float heroPulse = 0.5 + 0.5 * sin(uTime * 4.4 + aPhase * 0.35);
      float heroBoost = aIsHero * uLetterOpen;

      vec3 col = aColor;
      if (aIsHero > 0.5) {
        float baseHighlight = 1.24 + 0.24 * idlePulse;
        col *= baseHighlight;
        col = mix(col, vec3(1.0, 0.93, 0.72), heroBoost * (0.28 + 0.36 * heroPulse));
        col *= (1.0 + heroBoost * (0.85 + 0.75 * heroPulse));
      } else {
        col *= (0.76 - uLetterOpen * 0.22);
        col += vec3(0.15, 0.45, 0.38) * uAuroraWave * 0.45;
      }

      vColor = col;

      vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPosition;

      float sizeMult = 1.0;
      if (aIsHero > 0.5) {
        sizeMult += 0.22 + 0.14 * idlePulse + heroBoost * (0.5 + 0.42 * heroPulse);
      }

      float twinkle = 0.82 + 0.28 * sin(uTime * 3.0 + aPhase);
      gl_PointSize = aSize * sizeMult * twinkle * uPixelRatio * (190.0 / max(1.0, -mvPosition.z));

      float sparkleFade = aPartType > 2.5 ? sin(fract(uTime * 0.28 + aPhase) * 3.14159) * 0.85 : 1.0;
      vAlpha = smoothstep(0.0, 0.2, localP) * (aPartType > 1.5 && aPartType < 2.5 ? 0.6 : 0.96) * sparkleFade;
    }
  `,
  fragmentShader: `
    uniform sampler2D uMap;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
      vec4 texColor = texture2D(uMap, gl_PointCoord);
      if (texColor.a < 0.02) discard;
      gl_FragColor = vec4(vColor * texColor.rgb, texColor.a * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});

const particleSystem = new THREE.Points(geometry, particleMaterial);
scene.add(particleSystem);

const auroraGeometry = new THREE.PlaneGeometry(64, 24, 96, 24);
const auroraMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 0.16 }
  },
  vertexShader: `
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float wave = sin(pos.x * 0.14 + uTime * 0.85) * 2.2 + cos(pos.x * 0.26 - uTime * 0.6) * 1.1;
      pos.z += wave;
      pos.y += sin(pos.x * 0.1 + uTime * 0.5) * 0.9;
      vWave = wave;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;
    varying float vWave;
    void main() {
      float vertFade = smoothstep(0.0, 0.35, vUv.y) * (1.0 - smoothstep(0.45, 1.0, vUv.y));
      float horizFade = smoothstep(0.0, 0.2, vUv.x) * (1.0 - smoothstep(0.8, 1.0, vUv.x));
      float curtains = 0.55 + 0.45 * sin(vUv.x * 28.0 + uTime * 1.4 + vWave * 0.6);
      float shimmer = 0.65 + 0.35 * cos(vUv.x * 52.0 - uTime * 2.1);

      vec3 emerald = vec3(0.16, 0.92, 0.68);
      vec3 magenta = vec3(0.95, 0.32, 0.72);
      vec3 gold = vec3(1.0, 0.84, 0.44);

      vec3 col = mix(emerald, magenta, smoothstep(0.15, 0.85, vUv.y + sin(vUv.x * 6.0 + uTime * 0.5) * 0.18));
      col = mix(col, gold, curtains * 0.28);

      float alpha = vertFade * horizFade * curtains * shimmer * uIntensity;
      gl_FragColor = vec4(col, alpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide
});

const auroraMesh = new THREE.Mesh(auroraGeometry, auroraMaterial);
auroraMesh.position.set(0, 14.5, -24);
scene.add(auroraMesh);

const hitSphereGeo = new THREE.SphereGeometry(2.8, 16, 16);
const hitSphereMat = new THREE.MeshBasicMaterial({ visible: false });
const heroHitMesh = new THREE.Mesh(hitSphereGeo, hitSphereMat);
heroHitMesh.position.set(heroWorldPos.x, 3.6, heroWorldPos.z);
scene.add(heroHitMesh);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.5);
const mouseWorld = new THREE.Vector3(999, 999, 999);

let isLetterOpen = false;
let letterProgress = 0;
let auroraBoost = 0;
let hintShown = false;

const currentCamPos = defaultCamPos.clone();
const currentLookAt = defaultLookAt.clone();
const targetCamPos = defaultCamPos.clone();
const targetLookAt = defaultLookAt.clone();

function updateCameraTargets() {
  const aspect = window.innerWidth / window.innerHeight;
  if (!isLetterOpen) {
    if (isPortrait()) {
      targetCamPos.set(0, 7.8, 28.5);
      targetLookAt.set(0, 3.0, 0);
    } else {
      targetCamPos.set(0, 7.6, 25.5);
      targetLookAt.set(0, 3.1, 0);
    }
  } else if (isPortrait()) {
    targetCamPos.set(0, 6.2, 23.8);
    targetLookAt.set(0, 1.35, heroWorldPos.z);
  } else {
    const distZ = 20.5;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const visibleHeight = 2 * Math.tan(vFov / 2) * (distZ - heroWorldPos.z);
    const visibleWidth = visibleHeight * aspect;
    const shiftX = visibleWidth * 0.24;

    targetCamPos.set(shiftX, 5.4, distZ);
    targetLookAt.set(shiftX, 3.6, heroWorldPos.z);
  }
}

function openLetter() {
  if (isLetterOpen || window.isGameOpen) return;
  isLetterOpen = true;
  auroraBoost = 1.0;
  letterCard.classList.add('open');
  hintPill.classList.remove('visible');
  hintPill.classList.add('hidden');
  updateCameraTargets();
}

function closeLetter() {
  if (!isLetterOpen) return;
  isLetterOpen = false;
  letterCard.classList.remove('open');
  updateCameraTargets();
}

closeLetterBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  closeLetter();
});

function updatePointerCoords(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function checkHeroClick(clientX, clientY) {
  if (window.isGameOpen) return;
  updatePointerCoords(clientX, clientY);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObject(heroHitMesh);
  if (hits.length > 0) {
    openLetter();
  }
}

renderer.domElement.addEventListener('pointermove', (e) => {
  if (window.isGameOpen) return;
  updatePointerCoords(e.clientX, e.clientY);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, mouseWorld);
  particleMaterial.uniforms.uMouse.value.copy(mouseWorld);

  const hits = raycaster.intersectObject(heroHitMesh);
  renderer.domElement.style.cursor = hits.length > 0 && !isLetterOpen ? 'pointer' : 'default';
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (window.isGameOpen) return;
  updatePointerCoords(e.clientX, e.clientY);
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(groundPlane, mouseWorld);
  particleMaterial.uniforms.uMouse.value.copy(mouseWorld);
  checkHeroClick(e.clientX, e.clientY);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const pr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 860 ? 1.75 : 2);
  renderer.setPixelRatio(pr);
  particleMaterial.uniforms.uPixelRatio.value = pr;
  updateCameraTargets();
});

updateCameraTargets();
currentCamPos.copy(targetCamPos);
currentLookAt.copy(targetLookAt);

const clock = new THREE.Clock();
let morphProgress = 0;

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (morphProgress < 1) {
    morphProgress = Math.min(1, morphProgress + dt * 0.24);
  }

  if (morphProgress > 0.85 && !hintShown && !isLetterOpen && !window.isGameOpen) {
    hintShown = true;
    hintPill.classList.add('visible');
  }

  const targetLetterVal = isLetterOpen ? 1.0 : 0.0;
  letterProgress += (targetLetterVal - letterProgress) * Math.min(1, dt * 3.5);
  auroraBoost = Math.max(0, auroraBoost - dt * 0.35);

  particleMaterial.uniforms.uTime.value = elapsed;
  particleMaterial.uniforms.uProgress.value = morphProgress;
  particleMaterial.uniforms.uLetterOpen.value = letterProgress;
  particleMaterial.uniforms.uAuroraWave.value = Math.max(letterProgress * 0.75, auroraBoost);

  auroraMaterial.uniforms.uTime.value = elapsed;
  const targetAuroraIntensity = 0.16 + letterProgress * 0.56 + auroraBoost * 0.35;
  auroraMaterial.uniforms.uIntensity.value += (targetAuroraIntensity - auroraMaterial.uniforms.uIntensity.value) * Math.min(1, dt * 3.0);

  const swayX = isLetterOpen ? 0 : Math.sin(elapsed * 0.32) * 1.1;
  const swayY = isLetterOpen ? 0 : Math.cos(elapsed * 0.24) * 0.35;

  const desiredPos = targetCamPos.clone().add(new THREE.Vector3(swayX, swayY, 0));
  currentCamPos.lerp(desiredPos, Math.min(1, dt * 2.8));
  currentLookAt.lerp(targetLookAt, Math.min(1, dt * 3.2));

  camera.position.copy(currentCamPos);
  camera.lookAt(currentLookAt);

  renderer.render(scene, camera);
}

animate();