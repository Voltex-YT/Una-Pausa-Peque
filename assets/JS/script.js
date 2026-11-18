const hitSphereGeo = new THREE.SphereGeometry(3.6, 16, 16);
const hitSphereMat = new THREE.MeshBasicMaterial({ visible: false });
const heroHitMesh = new THREE.Mesh(hitSphereGeo, hitSphereMat);
heroHitMesh.position.set(heroWorldPos.x, 3.4, heroWorldPos.z);
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
  camera.updateMatrixWorld();
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

renderer.domElement.addEventListener('click', (e) => {
  checkHeroClick(e.clientX, e.clientY);
});
