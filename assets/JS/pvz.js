const choosePvzBtn = document.getElementById('choose-pvz-btn');
const gameOverlay = document.getElementById('game-overlay');
const exitGameBtn = document.getElementById('exit-game-btn');
const pvzCanvas = document.getElementById('pvz-canvas');
const pCtx = pvzCanvas.getContext('2d');
pCtx.imageSmoothingEnabled = false;

const sunAmountEl = document.getElementById('sun-amount');
const scoreCountEl = document.getElementById('score-count');
const cocaCountEl = document.getElementById('coca-count');
const cocaBadgeEl = document.getElementById('coca-badge');
const cocaToastEl = document.getElementById('coca-toast');
const victoryModalEl = document.getElementById('victory-modal');
const playAgainBtn = document.getElementById('play-again-btn');
const victoryGardenBtn = document.getElementById('victory-garden-btn');
const plantCards = document.querySelectorAll('.plant-card');

const ROWS = 5;
const COLS = 9;
const GRID_LEFT = 76;
const GRID_TOP = 54;
const CELL_W = 82;
const CELL_H = 74;
const WIN_SCORE = 5000;

const stressLabels = ['Pendientes', 'Estrés', 'Prisa', 'Mil cosas', 'Cansancio', 'Sobrepensar'];

const pixelPalette = {
  '.': null,
  'o': '#181024',
  'y': '#facc15',
  'Y': '#fef08a',
  'a': '#ea580c',
  'b': '#78350f',
  'B': '#b45309',
  'n': '#d97706',
  'N': '#f59e0b',
  'w': '#ffffff',
  'e': '#0f172a',
  'g': '#22c55e',
  'G': '#4ade80',
  'd': '#15803d',
  'D': '#052e16',
  'z': '#84a98c',
  'Z': '#52796f',
  'c': '#5c4033',
  'C': '#3e2723',
  'r': '#dc2626',
  'p': '#1e293b',
  'm': '#7f1d1d'
};

const spriteMaps = {
  sunflower: [
    '.....oooooo.....',
    '....oYYYYYYo....',
    '..ooYyyyyyyYoo..',
    '.oYyyoooooooyYo.',
    '.oYyobbbbbbbboYo',
    'oYyyobwbbbbwboYy',
    'oYyyobebbbbeboYy',
    'oYyyobbbbbbbboYy',
    '.oYyoboeeeoboYo.',
    '.oYyyoooooooyYo.',
    '..ooYyyyyyyYoo..',
    '....oYYYYYYo....',
    '......oddo......',
    '...oo.oddo.oo...',
    '..oGdooggooodGo.',
    '...oooooooooo...'
  ],
  peashooter: [
    '.....oooooo.....',
    '....oGGGGGGoooo.',
    '..ooGGGGGGGGGGGo',
    '.oGGGGGGGGGGGDo.',
    'oGdGGGGwGGGGGDo.',
    'oGdGGGGeGGGGGDo.',
    '.oGGGGGGGGGGGDo.',
    '..ooGGGGGGGGGGGo',
    '....oGGGGGGoooo.',
    '......oddo......',
    '......oggo......',
    '...oo.oggo.oo...',
    '..oGdooggooodGo.',
    '.oGGddddddddGGGo',
    '..oooooooooooo..',
    '................'
  ],
  wallnut: [
    '.....oooooo.....',
    '...ooNNNNNNoo...',
    '..oNNnnnnnnNNo..',
    '.oNnnnnnnnnnnNo.',
    '.oNnnwwnnwwnnNo.',
    'oNnnnwenewennnNo',
    'oNnnnwwnnwwnnnNo',
    'oNnnnnnnnnnnnnNo',
    'oNnnnnnnnnnnnnNo',
    'oNnnnnnnnnnnnnNo',
    'oNnnnnoeeoonnnNo',
    '.oNnnnnnnnnnnNo.',
    '.oBnnnnnnnnnnBo.',
    '..oBBbbbbbbBBo..',
    '...ooBBBBBBoo...',
    '.....oooooo.....'
  ],
  wallnutCracked: [
    '.....oooooo.....',
    '...ooNNNNNNoo...',
    '..oNNnnoooonNNo.',
    '.oNnnnonnnnnnNo.',
    '.oNnnwwnnwwnnNo.',
    'oNnnnwenewennnNo',
    'oNnnnwwnnwwnnnNo',
    'oNnnnnnnnnnnnnNo',
    'oNnnnnnnnnnonnNo',
    'oNnnnnnnnnonnnNo',
    'oNnnnnoeeoonnnNo',
    '.oNnnnnnnnnnnNo.',
    '.oBnnnnnnnnnnBo.',
    '..oBBbbbbbbBBo..',
    '...ooBBBBBBoo...',
    '.....oooooo.....'
  ],
  zombie: [
    '.....oooooo.....',
    '....ozzzzzzo....',
    '...ozzzzzzzzo...',
    '...ozYYzzYYzo...',
    '...ozeYzzeYzo...',
    '...ozzzzzzzzo...',
    '....ozmmmmzo....',
    '.....oooooo.....',
    '..oooccccccCoo..',
    '.ozzzccwrcCccCo.',
    'ozzz.ccrrcCccCo.',
    '.ooo.ccrrcCccCo.',
    '.....ccccccCoo..',
    '.....opppoppo...',
    '.....opppoppo...',
    '....oooppooopo..'
  ],
  sun: [
    '.......oo.......',
    '......oYYo......',
    '..oo..oYYo..oo..',
    '.oYYooYYYYooYYo.',
    '..oYYYYyyyyYYo..',
    '...oYYyyyyyyYo..',
    'oo.oYYyyyyyyYo.o',
    'YYooYYyyyyyyYoYY',
    'YYooYYyyyyyyYoYY',
    'oo.oYYyyyyyyYo.o',
    '...oYYyyyyyyYo..',
    '..oYYYYyyyyYYo..',
    '.oYYooYYYYooYYo.',
    '..oo..oYYo..oo..',
    '......oYYo......',
    '.......oo.......'
  ]
};

const spriteCache = {};

function bakeSprite(name, scale) {
  const map = spriteMaps[name];
  const h = map.length;
  const w = map[0].length;
  const c = document.createElement('canvas');
  c.width = w * scale;
  c.height = h * scale;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  for (let r = 0; r < h; r++) {
    const rowStr = map[r];
    for (let col = 0; col < w; col++) {
      const ch = rowStr[col];
      const color = pixelPalette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * scale, r * scale, scale, scale);
      }
    }
  }
  return c;
}

function initPixelSprites() {
  const names = Object.keys(spriteMaps);
  for (const name of names) {
    spriteCache[name] = bakeSprite(name, 3);
    spriteCache[name + '_hit'] = bakeSprite(name, 3);
  }

  const hitCanvas = spriteCache['zombie_hit'];
  const hCtx = hitCanvas.getContext('2d');
  hCtx.globalCompositeOperation = 'source-atop';
  hCtx.fillStyle = 'rgba(255, 255, 255, 0.78)';
  hCtx.fillRect(0, 0, hitCanvas.width, hitCanvas.height);
  hCtx.globalCompositeOperation = 'source-over';

  const cardIcons = [
    { id: 'icon-sunflower', sprite: 'sunflower' },
    { id: 'icon-peashooter', sprite: 'peashooter' },
    { id: 'icon-wallnut', sprite: 'wallnut' }
  ];

  for (const item of cardIcons) {
    const cardCanvas = document.getElementById(item.id);
    const cCtx = cardCanvas.getContext('2d');
    cCtx.imageSmoothingEnabled = false;
    const small = bakeSprite(item.sprite, 2);
    cCtx.drawImage(small, 6, 6);
  }
}

initPixelSprites();

let pvzActive = false;
let gameLoopId = null;
let sunEnergy = 125;
let score = 0;
let cocaCount = 0;
let hasWon = false;
let toastTimeout = null;
let selectedPlant = 'sunflower';
let plants = [];
let zombies = [];
let projectiles = [];
let suns = [];
let sparks = [];
let floatingTexts = [];
let lastGameTime = 0;
let zombieSpawnTimer = 0;
let skySunTimer = 0;

const plantCosts = {
  sunflower: 50,
  peashooter: 100,
  wallnut: 50
};

function getCurrentWave() {
  return Math.min(5, Math.floor(score / 1000) + 1);
}

function triggerCocaReward(waveNum) {
  cocaCount++;
  cocaBadgeEl.classList.add('pop');
  setTimeout(() => cocaBadgeEl.classList.remove('pop'), 350);

  cocaToastEl.textContent = `🥤 ¡Ganaste 1 Coca-Cola! · Oleada ${waveNum} (zombies más resistentes)`;
  cocaToastEl.classList.add('show');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    cocaToastEl.classList.remove('show');
  }, 3800);

  spawnSparks(pvzCanvas.width * 0.5, pvzCanvas.height * 0.45, '#ef4444', 32);
  spawnSparks(pvzCanvas.width * 0.5, pvzCanvas.height * 0.45, '#fde047', 26);

  const extraSpawns = Math.min(3, waveNum - 1);
  for (let k = 0; k < extraSpawns; k++) {
    setTimeout(() => {
      if (pvzActive && !hasWon) spawnZombie();
    }, k * 450);
  }
}

function triggerVictory() {
  hasWon = true;
  cocaToastEl.classList.remove('show');
  for (let z of zombies) {
    spawnSparks(z.x, z.y, '#f472b6', 22);
    spawnSparks(z.x, z.y, '#fde047', 16);
  }
  zombies = [];
  victoryModalEl.classList.add('show');
}

function updateHud() {
  sunAmountEl.textContent = sunEnergy;
  scoreCountEl.textContent = score.toLocaleString('es-MX');
  cocaCountEl.textContent = cocaCount;
  plantCards.forEach(card => {
    const type = card.dataset.plant;
    const cost = Number(card.dataset.cost);
    card.classList.toggle('selected', type === selectedPlant);
    card.classList.toggle('disabled', sunEnergy < cost);
  });
}

plantCards.forEach(card => {
  card.addEventListener('click', () => {
    selectedPlant = card.dataset.plant;
    updateHud();
  });
});

function spawnSparks(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 140;
    sparks.push({
      x: Math.round(x),
      y: Math.round(y),
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 1,
      color,
      size: 3 + Math.floor(Math.random() * 4)
    });
  }
}

function spawnFloatingText(x, y, text, color) {
  floatingTexts.push({
    x,
    y,
    text,
    color,
    life: 1
  });
}

function spawnSkySun() {
  const targetX = GRID_LEFT + 40 + Math.random() * (COLS * CELL_W - 80);
  const targetY = GRID_TOP + 35 + Math.random() * (ROWS * CELL_H - 70);
  suns.push({
    x: targetX,
    y: 16,
    targetY,
    vy: 38,
    life: 12,
    pulse: Math.random() * Math.PI * 2
  });
}

function spawnZombie() {
  const row = Math.floor(Math.random() * ROWS);
  const y = GRID_TOP + row * CELL_H + CELL_H * 0.54;
  const wave = getCurrentWave();
  const baseHp = 95 + (wave - 1) * 45;
  zombies.push({
    row,
    x: pvzCanvas.width + 24 + Math.random() * 45,
    y,
    hp: baseHp,
    maxHp: baseHp,
    speed: 9.5 + Math.random() * 4.5 + (wave - 1) * 1.1,
    label: stressLabels[Math.floor(Math.random() * stressLabels.length)],
    wobble: Math.random() * Math.PI * 2,
    hitFlash: 0
  });
}

function resetGame() {
  sunEnergy = 125;
  score = 0;
  cocaCount = 0;
  hasWon = false;
  selectedPlant = 'sunflower';
  plants = [];
  zombies = [];
  projectiles = [];
  suns = [];
  sparks = [];
  floatingTexts = [];
  zombieSpawnTimer = 2.4;
  skySunTimer = 3.0;
  cocaToastEl.classList.remove('show');
  victoryModalEl.classList.remove('show');
  updateHud();
}

function handleCanvasTap(clientX, clientY) {
  if (hasWon) return;
  const rect = pvzCanvas.getBoundingClientRect();
  const scaleX = pvzCanvas.width / rect.width;
  const scaleY = pvzCanvas.height / rect.height;
  const mx = (clientX - rect.left) * scaleX;
  const my = (clientY - rect.top) * scaleY;

  for (let i = suns.length - 1; i >= 0; i--) {
    const s = suns[i];
    if (Math.hypot(mx - s.x, my - s.y) < 36) {
      sunEnergy += 25;
      spawnSparks(s.x, s.y, '#fde047', 14);
      spawnFloatingText(s.x, s.y - 10, '+25', '#fde047');
      suns.splice(i, 1);
      updateHud();
      return;
    }
  }

  const col = Math.floor((mx - GRID_LEFT) / CELL_W);
  const row = Math.floor((my - GRID_TOP) / CELL_H);

  if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
    const occupied = plants.some(p => p.row === row && p.col === col);
    const cost = plantCosts[selectedPlant];
    if (!occupied && sunEnergy >= cost) {
      sunEnergy -= cost;
      const cx = GRID_LEFT + col * CELL_W + CELL_W * 0.5;
      const cy = GRID_TOP + row * CELL_H + CELL_H * 0.52;
      plants.push({
        type: selectedPlant,
        row,
        col,
        x: cx,
        y: cy,
        hp: selectedPlant === 'wallnut' ? 320 : 90,
        maxHp: selectedPlant === 'wallnut' ? 320 : 90,
        timer: selectedPlant === 'sunflower' ? 4.5 : 1.1,
        pulse: Math.random() * Math.PI * 2,
        recoil: 0
      });
      const pColor = selectedPlant === 'sunflower' ? '#fde047' : (selectedPlant === 'peashooter' ? '#34d399' : '#d97706');
      spawnSparks(cx, cy, pColor, 16);
      updateHud();
    }
  }
}

pvzCanvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleCanvasTap(e.clientX, e.clientY);
});

function updateAndDrawGame(timestamp) {
  if (!pvzActive) return;
  gameLoopId = requestAnimationFrame(updateAndDrawGame);

  if (!lastGameTime) lastGameTime = timestamp;
  const dt = Math.min((timestamp - lastGameTime) / 1000, 0.05);
  lastGameTime = timestamp;

  if (!hasWon) {
    skySunTimer -= dt;
    if (skySunTimer <= 0) {
      spawnSkySun();
      skySunTimer = 5.8;
    }

    const wave = getCurrentWave();
    zombieSpawnTimer -= dt;
    if (zombieSpawnTimer <= 0) {
      const batchCount = wave >= 4 ? 3 : (wave >= 2 ? 2 : 1);
      for (let b = 0; b < batchCount; b++) {
        spawnZombie();
      }
      zombieSpawnTimer = Math.max(2.6, 5.4 - (wave - 1) * 0.55);
    }
  }

  pCtx.clearRect(0, 0, pvzCanvas.width, pvzCanvas.height);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = GRID_LEFT + c * CELL_W;
      const y = GRID_TOP + r * CELL_H;
      pCtx.fillStyle = (r + c) % 2 === 0 ? 'rgba(34, 197, 94, 0.07)' : 'rgba(16, 185, 129, 0.04)';
      pCtx.fillRect(x + 3, y + 3, CELL_W - 6, CELL_H - 6);
    }
  }

  for (let i = plants.length - 1; i >= 0; i--) {
    const p = plants[i];
    p.pulse += dt * 4;
    p.timer -= dt;
    p.recoil = Math.max(0, p.recoil - dt * 4);

    if (!hasWon && p.type === 'sunflower' && p.timer <= 0) {
      p.timer = 8.0;
      suns.push({
        x: p.x + (Math.random() - 0.5) * 26,
        y: p.y - 10,
        targetY: p.y + 14,
        vy: 25,
        life: 12,
        pulse: 0
      });
      spawnSparks(p.x, p.y - 12, '#fde047', 10);
    } else if (!hasWon && p.type === 'peashooter' && p.timer <= 0) {
      const hasEnemyInRow = zombies.some(z => z.row === p.row && z.x > p.x);
      if (hasEnemyInRow) {
        p.timer = 1.4;
        p.recoil = 1.0;
        projectiles.push({
          row: p.row,
          x: p.x + 18,
          y: p.y - 8,
          vx: 295
        });
      } else {
        p.timer = 0.3;
      }
    }

    let spriteKey = p.type;
    if (p.type === 'wallnut' && p.hp < p.maxHp * 0.55) {
      spriteKey = 'wallnutCracked';
    }

    const spriteImg = spriteCache[spriteKey];
    const bobOffset = Math.round(Math.sin(p.pulse) * 2);
    const recoilOffset = p.type === 'peashooter' ? Math.round(-p.recoil * 4) : 0;
    const drawX = Math.round(p.x - spriteImg.width * 0.5 + recoilOffset);
    const drawY = Math.round(p.y - spriteImg.height * 0.5 + bobOffset);

    pCtx.drawImage(spriteImg, drawX, drawY);

    if (p.hp < p.maxHp) {
      pCtx.fillStyle = 'rgba(15, 10, 34, 0.8)';
      pCtx.fillRect(Math.round(p.x - 16), Math.round(p.y + 25), 32, 4);
      pCtx.fillStyle = '#4ade80';
      pCtx.fillRect(Math.round(p.x - 16), Math.round(p.y + 25), Math.round(32 * (p.hp / p.maxHp)), 4);
    }
  }

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.x += proj.vx * dt;

    const px = Math.round(proj.x);
    const py = Math.round(proj.y);
    pCtx.fillStyle = '#15803d';
    pCtx.fillRect(px - 6, py - 6, 12, 12);
    pCtx.fillStyle = '#4ade80';
    pCtx.fillRect(px - 4, py - 4, 8, 8);
    pCtx.fillStyle = '#bbf7d0';
    pCtx.fillRect(px - 3, py - 3, 3, 3);

    let hit = false;
    for (let j = zombies.length - 1; j >= 0; j--) {
      const z = zombies[j];
      if (z.row === proj.row && Math.abs(proj.x - z.x) < 22) {
        z.hp -= 24;
        z.hitFlash = 0.12;
        spawnSparks(proj.x, proj.y, '#4ade80', 8);
        hit = true;
        if (z.hp <= 0) {
          score = Math.min(WIN_SCORE, score + 100);
          spawnSparks(z.x, z.y, '#f472b6', 24);
          spawnSparks(z.x, z.y, '#fde047', 14);
          spawnFloatingText(z.x, z.y - 22, '+100', '#fbcfe8');
          zombies.splice(j, 1);

          const earnedCocas = Math.floor(score / 1000);
          if (earnedCocas > cocaCount) {
            triggerCocaReward(getCurrentWave());
          }
          updateHud();

          if (score >= WIN_SCORE && !hasWon) {
            triggerVictory();
          }
        }
        break;
      }
    }

    if (hit || proj.x > pvzCanvas.width + 20) {
      projectiles.splice(i, 1);
    }
  }

  for (let i = zombies.length - 1; i >= 0; i--) {
    const z = zombies[i];
    z.wobble += dt * 5;
    z.hitFlash = Math.max(0, z.hitFlash - dt);

    let blockingPlant = null;
    for (let p of plants) {
      if (p.row === z.row && z.x - p.x > 0 && z.x - p.x < 34) {
        blockingPlant = p;
        break;
      }
    }

    if (blockingPlant) {
      blockingPlant.hp -= 24 * dt;
      if (blockingPlant.hp <= 0) {
        spawnSparks(blockingPlant.x, blockingPlant.y, '#f472b6', 16);
        plants = plants.filter(item => item !== blockingPlant);
      }
    } else {
      z.x -= z.speed * dt;
    }

    const bobY = Math.round(z.y + Math.sin(z.wobble) * 2);
    const zImg = z.hitFlash > 0 ? spriteCache['zombie_hit'] : spriteCache['zombie'];
    const zx = Math.round(z.x - zImg.width * 0.5);
    const zy = Math.round(bobY - zImg.height * 0.5);

    pCtx.drawImage(zImg, zx, zy);

    if (z.hp < z.maxHp) {
      const barW = 34;
      pCtx.fillStyle = 'rgba(15, 10, 34, 0.85)';
      pCtx.fillRect(Math.round(z.x - barW * 0.5), zy - 24, barW, 4);
      pCtx.fillStyle = '#f472b6';
      pCtx.fillRect(Math.round(z.x - barW * 0.5), zy - 24, Math.round(barW * Math.max(0, z.hp / z.maxHp)), 4);
    }

    pCtx.fillStyle = 'rgba(15, 10, 34, 0.82)';
    pCtx.fillRect(Math.round(z.x - 36), zy - 18, 72, 15);
    pCtx.strokeStyle = 'rgba(244, 114, 182, 0.5)';
    pCtx.lineWidth = 1;
    pCtx.strokeRect(Math.round(z.x - 36), zy - 18, 72, 15);

    pCtx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillStyle = '#f8fafc';
    pCtx.fillText(z.label, Math.round(z.x), zy - 7);

    if (z.x < GRID_LEFT - 18) {
      spawnSparks(z.x, bobY, '#84a98c', 20);
      zombies.splice(i, 1);
    }
  }

  for (let i = suns.length - 1; i >= 0; i--) {
    const s = suns[i];
    s.life -= dt;
    s.pulse += dt * 5;
    if (s.y < s.targetY) {
      s.y += s.vy * dt;
    }

    const sunImg = spriteCache['sun'];
    const sx = Math.round(s.x - sunImg.width * 0.5);
    const sy = Math.round(s.y - sunImg.height * 0.5 + Math.sin(s.pulse) * 2);
    pCtx.drawImage(sunImg, sx, sy);

    if (s.life <= 0) {
      suns.splice(i, 1);
    }
  }

  for (let i = sparks.length - 1; i >= 0; i--) {
    const sp = sparks[i];
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.life -= dt * 1.8;
    if (sp.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    pCtx.globalAlpha = Math.max(0, sp.life);
    pCtx.fillStyle = sp.color;
    pCtx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
    pCtx.globalAlpha = 1;
  }

  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y -= 28 * dt;
    ft.life -= dt * 1.2;
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
      continue;
    }
    pCtx.globalAlpha = Math.max(0, ft.life);
    pCtx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    pCtx.textAlign = 'center';
    pCtx.fillStyle = ft.color;
    pCtx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    pCtx.globalAlpha = 1;
  }
}

choosePvzBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('arcade-hub-overlay').classList.remove('active');
  pvzActive = true;
  gameOverlay.classList.add('active');
  resetGame();
  spawnSkySun();
  lastGameTime = 0;
  gameLoopId = requestAnimationFrame(updateAndDrawGame);
});

function backToHubFromPvz() {
  pvzActive = false;
  gameOverlay.classList.remove('active');
  if (gameLoopId) cancelAnimationFrame(gameLoopId);
  document.getElementById('arcade-hub-overlay').classList.add('active');
}

exitGameBtn.addEventListener('click', backToHubFromPvz);
victoryGardenBtn.addEventListener('click', backToHubFromPvz);

playAgainBtn.addEventListener('click', () => {
  resetGame();
  spawnSkySun();
});