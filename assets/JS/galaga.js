const chooseGalagaBtn = document.getElementById('choose-galaga-btn');
const galagaOverlay = document.getElementById('galaga-overlay');
const exitGalagaBtn = document.getElementById('exit-galaga-btn');
const galagaCanvas = document.getElementById('galaga-canvas');
const gCtx = galagaCanvas.getContext('2d');
gCtx.imageSmoothingEnabled = false;

const gLivesEl = document.getElementById('galaga-lives');
const gWaveEl = document.getElementById('galaga-wave');
const gScoreEl = document.getElementById('galaga-score');
const gCocaEl = document.getElementById('galaga-coca');
const gCocaBadgeEl = document.getElementById('galaga-coca-badge');
const gCocaToastEl = document.getElementById('galaga-coca-toast');
const gVictoryModalEl = document.getElementById('galaga-victory-modal');
const gEndTitleEl = document.getElementById('galaga-end-title');
const gEndDescEl = document.getElementById('galaga-end-desc');
const gAgainBtn = document.getElementById('galaga-again-btn');
const gHubBtn = document.getElementById('galaga-hub-btn');

const G_WIN_SCORE = 5000;

const galagaPalette = {
  '.': null,
  'o': '#090616',
  'w': '#ffffff',
  'c': '#38bdf8',
  'C': '#0284c7',
  'r': '#f43f5e',
  'R': '#be123c',
  'y': '#fde047',
  'Y': '#f59e0b',
  'p': '#e879f9',
  'P': '#a21caf',
  'g': '#34d399',
  'G': '#059669'
};

const galagaMaps = {
  ship: [
    '.......oo.......',
    '......owwo......',
    '......owwo......',
    '.....owccwo.....',
    '.....owccwo.....',
    '....owwccwwo....',
    '...oowwccwwoo...',
    '..orowwwwwwoRo..',
    '.orRowwwwwwoRRo.',
    'orRRowwccwwoRRRo',
    'orooowwccwwoooor',
    'oy..owwwwwwo..yo',
    'oY..oRRooRRo..Yo',
    '....oYY..YYo....',
    '.....oo..oo.....',
    '................'
  ],
  bee: [
    '....oo....oo....',
    '.....oo..oo.....',
    '....oYYYYYYo....',
    '...oYyyyyyyYo...',
    '..oYyooyyooyYo..',
    '.oYyyooyyooyyYo.',
    'oCyyyyyyyyyyyyCo',
    'oCCoyyyyyyyyooCo',
    '.oCooyyyyyyoCo..',
    '..oo.oYYYYo.oo..',
    '....oYYooYYo....',
    '...oYo....oYo...',
    '................',
    '................',
    '................',
    '................'
  ],
  butterfly: [
    '..ooo......ooo..',
    '.oPPPo....oPPPo.',
    'oPpppPo..oPpppPo',
    'oPpppoooooopppPo',
    'oPpppoYYYYopppPo',
    '.oPppoYyyYoPppPo',
    '.oPPpoYYYYoPPPo.',
    '..ooooppppoooo..',
    '...oPpoooopPo...',
    '..oPpo....opPo..',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................'
  ],
  boss: [
    '.....oooooo.....',
    '...ooGGGGGGoo...',
    '..oGGggggggGGo..',
    '.oGggyyyyyyggGo.',
    'oGggoyyyyyyoggGo',
    'oGggoyyyyyyoggGo',
    'oGggggggggggggGo',
    'oCCggggggggggCCo',
    'oCCoGGoGGoGGooCo',
    '.oo.oGo..oGo.oo.',
    '....oo....oo....',
    '................',
    '................',
    '................',
    '................',
    '................'
  ]
};

const galagaSprites = {};

function bakeGalagaSprite(name, scale) {
  const map = galagaMaps[name];
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
      const color = galagaPalette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(col * scale, r * scale, scale, scale);
      }
    }
  }
  return c;
}

function initGalagaSprites() {
  for (const name of Object.keys(galagaMaps)) {
    galagaSprites[name] = bakeGalagaSprite(name, 3);
    galagaSprites[name + '_hit'] = bakeGalagaSprite(name, 3);
    const hc = galagaSprites[name + '_hit'];
    const hctx = hc.getContext('2d');
    hctx.globalCompositeOperation = 'source-atop';
    hctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    hctx.fillRect(0, 0, hc.width, hc.height);
    hctx.globalCompositeOperation = 'source-over';
  }
}

initGalagaSprites();

let galagaActive = false;
let galagaLoopId = null;
let gLastTime = 0;
let gScore = 0;
let gCocaCount = 0;
let gLives = 3;
let gWave = 1;
let gGameOver = false;
let gToastTimeout = null;

const player = {
  x: 430,
  y: 412,
  targetX: 430,
  speed: 440,
  fireTimer: 0,
  invuln: 0,
  doubleShot: 0
};

let gBullets = [];
let gEnemyBullets = [];
let gEnemies = [];
let gSparks = [];
let gTexts = [];
let gPowerups = [];
let gStars = [];
let fleetDir = 1;
let fleetTime = 0;
let diveTimer = 2.5;

const keysPressed = { left: false, right: false };

for (let i = 0; i < 65; i++) {
  gStars.push({
    x: Math.random() * 860,
    y: Math.random() * 460,
    speed: 25 + Math.random() * 75,
    size: Math.random() > 0.7 ? 3 : 2,
    color: Math.random() > 0.5 ? 'rgba(253, 224, 71, 0.65)' : 'rgba(244, 114, 182, 0.55)'
  });
}

function spawnGalagaSparks(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 50 + Math.random() * 170;
    gSparks.push({
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

function spawnGalagaText(x, y, text, color) {
  gTexts.push({ x, y, text, color, life: 1 });
}

function triggerGalagaCoca(waveNum) {
  gCocaCount++;
  gCocaBadgeEl.classList.add('pop');
  setTimeout(() => gCocaBadgeEl.classList.remove('pop'), 350);

  gCocaToastEl.textContent = `🥤 ¡Ganaste 1 Coca-Cola! · Oleada ${waveNum}`;
  gCocaToastEl.classList.add('show');
  if (gToastTimeout) clearTimeout(gToastTimeout);
  gToastTimeout = setTimeout(() => {
    gCocaToastEl.classList.remove('show');
  }, 3600);

  spawnGalagaSparks(430, 220, '#ef4444', 30);
  spawnGalagaSparks(430, 220, '#fde047', 26);
}

function updateGalagaHud() {
  gLivesEl.textContent = gLives;
  gWaveEl.textContent = gWave;
  gScoreEl.textContent = gScore.toLocaleString('es-MX');
  gCocaEl.textContent = gCocaCount;
}

function spawnFleet(waveNum) {
  gEnemies = [];
  const cols = 8;
  const rows = 3;
  const spacingX = 76;
  const spacingY = 48;
  const startX = (galagaCanvas.width - (cols - 1) * spacingX) * 0.5;
  const startY = 58;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let type = 'bee';
      let hp = 1 + Math.floor((waveNum - 1) * 0.5);
      let pts = 100;
      if (r === 0) {
        type = 'boss';
        hp = 2 + Math.floor((waveNum - 1) * 0.8);
        pts = 200;
      } else if (r === 1) {
        type = 'butterfly';
        hp = 1 + Math.floor((waveNum - 1) * 0.6);
        pts = 150;
      }
      const homeX = startX + c * spacingX;
      const homeY = startY + r * spacingY;
      gEnemies.push({
        type,
        homeX,
        homeY,
        x: homeX,
        y: homeY - 160 - r * 35,
        hp,
        pts,
        diving: false,
        diveVx: 0,
        diveVy: 0,
        hitFlash: 0,
        entering: true
      });
    }
  }
}

function endGalagaGame(won) {
  gGameOver = true;
  gCocaToastEl.classList.remove('show');
  if (won) {
    gEndTitleEl.textContent = '✦ ¡Galaxia despejada! ✦';
    gEndDescEl.innerHTML = 'Llegaste a los <strong>5,000 puntos</strong> y desbloqueaste <strong>5 Coca-Colas</strong> bien frías canjeables en la vida real. ¡Mente ligera!';
  } else {
    gEndTitleEl.textContent = '✦ Buen vuelo espacial ✦';
    gEndDescEl.innerHTML = `Conseguiste <strong>${gScore.toLocaleString('es-MX')} puntos</strong> y <strong>${gCocaCount} Coca-Cola(s)</strong>. ¿Intentamos otra ronda?`;
  }
  gVictoryModalEl.classList.add('show');
}

function resetGalaga() {
  gScore = 0;
  gCocaCount = 0;
  gLives = 3;
  gWave = 1;
  gGameOver = false;
  player.x = 430;
  player.targetX = 430;
  player.fireTimer = 0;
  player.invuln = 1.2;
  player.doubleShot = 0;
  gBullets = [];
  gEnemyBullets = [];
  gSparks = [];
  gTexts = [];
  gPowerups = [];
  fleetDir = 1;
  fleetTime = 0;
  diveTimer = 2.6;
  gCocaToastEl.classList.remove('show');
  gVictoryModalEl.classList.remove('show');
  spawnFleet(1);
  updateGalagaHud();
}

function addGalagaScore(amount, x, y) {
  gScore = Math.min(G_WIN_SCORE, gScore + amount);
  spawnGalagaText(x, y - 16, `+${amount}`, '#fde047');

  const earnedCocas = Math.floor(gScore / 1000);
  if (earnedCocas > gCocaCount) {
    triggerGalagaCoca(gWave);
  }
  updateGalagaHud();

  if (gScore >= G_WIN_SCORE && !gGameOver) {
    endGalagaGame(true);
  }
}

function handleGalagaPointer(clientX) {
  if (!galagaActive || gGameOver) return;
  const rect = galagaCanvas.getBoundingClientRect();
  const scaleX = galagaCanvas.width / rect.width;
  const mx = (clientX - rect.left) * scaleX;
  player.targetX = Math.max(32, Math.min(galagaCanvas.width - 32, mx));
}

galagaCanvas.addEventListener('pointermove', (e) => {
  handleGalagaPointer(e.clientX);
});

galagaCanvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleGalagaPointer(e.clientX);
});

window.addEventListener('keydown', (e) => {
  if (!galagaActive) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysPressed.left = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysPressed.right = true;
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysPressed.left = false;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysPressed.right = false;
});

function updateAndDrawGalaga(timestamp) {
  if (!galagaActive) return;
  galagaLoopId = requestAnimationFrame(updateAndDrawGalaga);

  if (!gLastTime) gLastTime = timestamp;
  const dt = Math.min((timestamp - gLastTime) / 1000, 0.05);
  gLastTime = timestamp;

  gCtx.clearRect(0, 0, galagaCanvas.width, galagaCanvas.height);

  for (const st of gStars) {
    st.y += st.speed * dt;
    if (st.y > galagaCanvas.height) {
      st.y = 0;
      st.x = Math.random() * galagaCanvas.width;
    }
    gCtx.fillStyle = st.color;
    gCtx.fillRect(Math.round(st.x), Math.round(st.y), st.size, st.size);
  }

  if (!gGameOver) {
    if (keysPressed.left) player.targetX = Math.max(32, player.x - player.speed * dt);
    if (keysPressed.right) player.targetX = Math.min(galagaCanvas.width - 32, player.x + player.speed * dt);

    player.x += (player.targetX - player.x) * Math.min(1, dt * 14);
    player.invuln = Math.max(0, player.invuln - dt);
    player.doubleShot = Math.max(0, player.doubleShot - dt);

    player.fireTimer -= dt;
    if (player.fireTimer <= 0) {
      player.fireTimer = player.doubleShot > 0 ? 0.22 : 0.28;
      if (player.doubleShot > 0) {
        gBullets.push({ x: player.x - 14, y: player.y - 18, vy: -520 });
        gBullets.push({ x: player.x + 14, y: player.y - 18, vy: -520 });
      } else {
        gBullets.push({ x: player.x, y: player.y - 22, vy: -520 });
      }
    }

    fleetTime += dt * (1.2 + (gWave - 1) * 0.22);
    const swayOffset = Math.sin(fleetTime) * 68;

    diveTimer -= dt;
    if (diveTimer <= 0 && gEnemies.length > 0) {
      diveTimer = Math.max(1.1, 2.7 - (gWave - 1) * 0.3);
      const candidates = gEnemies.filter(en => !en.diving && !en.entering);
      if (candidates.length > 0) {
        const chosen = candidates[Math.floor(Math.random() * candidates.length)];
        chosen.diving = true;
        const dx = player.x - chosen.x;
        const dy = player.y - chosen.y;
        const dist = Math.max(1, Math.hypot(dx, dy));
        const diveSpeed = 195 + (gWave - 1) * 28;
        chosen.diveVx = (dx / dist) * diveSpeed;
        chosen.diveVy = (dy / dist) * diveSpeed;
        gEnemyBullets.push({
          x: chosen.x,
          y: chosen.y + 14,
          vx: (dx / dist) * 210,
          vy: (dy / dist) * 210
        });
      }
    }

    for (let i = gEnemies.length - 1; i >= 0; i--) {
      const en = gEnemies[i];
      en.hitFlash = Math.max(0, en.hitFlash - dt);

      if (en.entering) {
        en.y += (en.homeY - en.y) * Math.min(1, dt * 4.5);
        en.x = en.homeX + swayOffset;
        if (Math.abs(en.homeY - en.y) < 2) {
          en.entering = false;
        }
      } else if (en.diving) {
        en.x += en.diveVx * dt;
        en.y += en.diveVy * dt;
        if (en.y > galagaCanvas.height + 24) {
          en.diving = false;
          en.y = -20;
          en.entering = true;
        }
      } else {
        en.x = en.homeX + swayOffset;
        en.y = en.homeY + Math.cos(fleetTime * 2 + en.homeX * 0.02) * 5;
      }

      if (player.invuln <= 0 && Math.hypot(en.x - player.x, en.y - player.y) < 30) {
        spawnGalagaSparks(player.x, player.y, '#f43f5e', 28);
        gEnemies.splice(i, 1);
        gLives--;
        player.invuln = 2.0;
        updateGalagaHud();
        if (gLives <= 0) {
          endGalagaGame(false);
          break;
        }
      }
    }

    if (gEnemies.length === 0 && !gGameOver) {
      gWave++;
      updateGalagaHud();
      spawnFleet(gWave);
    }
  }

  for (let i = gBullets.length - 1; i >= 0; i--) {
    const b = gBullets[i];
    b.y += b.vy * dt;

    gCtx.fillStyle = '#38bdf8';
    gCtx.fillRect(Math.round(b.x - 3), Math.round(b.y - 10), 6, 14);
    gCtx.fillStyle = '#ffffff';
    gCtx.fillRect(Math.round(b.x - 1), Math.round(b.y - 8), 2, 10);

    let hit = false;
    for (let j = gEnemies.length - 1; j >= 0; j--) {
      const en = gEnemies[j];
      if (Math.abs(b.x - en.x) < 22 && Math.abs(b.y - en.y) < 18) {
        en.hp--;
        en.hitFlash = 0.1;
        spawnGalagaSparks(b.x, b.y, '#38bdf8', 8);
        hit = true;
        if (en.hp <= 0) {
          const color = en.type === 'boss' ? '#34d399' : (en.type === 'butterfly' ? '#e879f9' : '#fde047');
          spawnGalagaSparks(en.x, en.y, color, 22);
          if (Math.random() < 0.16) {
            gPowerups.push({ x: en.x, y: en.y, vy: 115 });
          }
          addGalagaScore(en.pts, en.x, en.y);
          gEnemies.splice(j, 1);
        }
        break;
      }
    }

    if (hit || b.y < -20) {
      gBullets.splice(i, 1);
    }
  }

  for (let i = gEnemyBullets.length - 1; i >= 0; i--) {
    const eb = gEnemyBullets[i];
    eb.x += eb.vx * dt;
    eb.y += eb.vy * dt;

    gCtx.fillStyle = '#f43f5e';
    gCtx.fillRect(Math.round(eb.x - 4), Math.round(eb.y - 4), 8, 8);
    gCtx.fillStyle = '#fde047';
    gCtx.fillRect(Math.round(eb.x - 2), Math.round(eb.y - 2), 4, 4);

    if (!gGameOver && player.invuln <= 0 && Math.hypot(eb.x - player.x, eb.y - player.y) < 22) {
      gEnemyBullets.splice(i, 1);
      spawnGalagaSparks(player.x, player.y, '#f43f5e', 26);
      gLives--;
      player.invuln = 2.0;
      updateGalagaHud();
      if (gLives <= 0) {
        endGalagaGame(false);
      }
      continue;
    }

    if (eb.y > galagaCanvas.height + 20 || eb.x < -20 || eb.x > galagaCanvas.width + 20) {
      gEnemyBullets.splice(i, 1);
    }
  }

  for (let i = gPowerups.length - 1; i >= 0; i--) {
    const pw = gPowerups[i];
    pw.y += pw.vy * dt;

    gCtx.fillStyle = '#fde047';
    gCtx.fillRect(Math.round(pw.x - 10), Math.round(pw.y - 10), 20, 20);
    gCtx.fillStyle = '#090616';
    gCtx.font = '700 11px "Plus Jakarta Sans", sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillText('2X', Math.round(pw.x), Math.round(pw.y + 4));

    if (!gGameOver && Math.hypot(pw.x - player.x, pw.y - player.y) < 30) {
      player.doubleShot = 8.0;
      spawnGalagaSparks(pw.x, pw.y, '#fde047', 16);
      spawnGalagaText(pw.x, pw.y - 12, '¡Disparo Doble!', '#fde047');
      gPowerups.splice(i, 1);
      continue;
    }

    if (pw.y > galagaCanvas.height + 20) {
      gPowerups.splice(i, 1);
    }
  }

  for (const en of gEnemies) {
    const key = en.hitFlash > 0 ? en.type + '_hit' : en.type;
    const img = galagaSprites[key];
    gCtx.drawImage(img, Math.round(en.x - img.width * 0.5), Math.round(en.y - img.height * 0.5));
  }

  if (!gGameOver) {
    const showShip = player.invuln <= 0 || Math.floor(player.invuln * 14) % 2 === 0;
    if (showShip) {
      const shipImg = galagaSprites['ship'];
      gCtx.drawImage(shipImg, Math.round(player.x - shipImg.width * 0.5), Math.round(player.y - shipImg.height * 0.5));
    }
  }

  for (let i = gSparks.length - 1; i >= 0; i--) {
    const sp = gSparks[i];
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.life -= dt * 1.9;
    if (sp.life <= 0) {
      gSparks.splice(i, 1);
      continue;
    }
    gCtx.globalAlpha = Math.max(0, sp.life);
    gCtx.fillStyle = sp.color;
    gCtx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
    gCtx.globalAlpha = 1;
  }

  for (let i = gTexts.length - 1; i >= 0; i--) {
    const ft = gTexts[i];
    ft.y -= 28 * dt;
    ft.life -= dt * 1.25;
    if (ft.life <= 0) {
      gTexts.splice(i, 1);
      continue;
    }
    gCtx.globalAlpha = Math.max(0, ft.life);
    gCtx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    gCtx.textAlign = 'center';
    gCtx.fillStyle = ft.color;
    gCtx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    gCtx.globalAlpha = 1;
  }
}

chooseGalagaBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('arcade-hub-overlay').classList.remove('active');
  galagaActive = true;
  galagaOverlay.classList.add('active');
  resetGalaga();
  gLastTime = 0;
  galagaLoopId = requestAnimationFrame(updateAndDrawGalaga);
});

function backToHubFromGalaga() {
  galagaActive = false;
  galagaOverlay.classList.remove('active');
  if (galagaLoopId) cancelAnimationFrame(galagaLoopId);
  document.getElementById('arcade-hub-overlay').classList.add('active');
}

exitGalagaBtn.addEventListener('click', backToHubFromGalaga);
gHubBtn.addEventListener('click', backToHubFromGalaga);
gAgainBtn.addEventListener('click', resetGalaga);