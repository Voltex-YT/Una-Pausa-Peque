const chooseTetrisBtn = document.getElementById('choose-tetris-btn');
const tetrisOverlay = document.getElementById('tetris-overlay');
const exitTetrisBtn = document.getElementById('exit-tetris-btn');
const tetrisCanvas = document.getElementById('tetris-canvas');
const tCtx = tetrisCanvas.getContext('2d');
tCtx.imageSmoothingEnabled = false;

const nextCanvas = document.getElementById('tetris-next-canvas');
const nCtx = nextCanvas.getContext('2d');
nCtx.imageSmoothingEnabled = false;

const tLinesEl = document.getElementById('tetris-lines');
const tLevelEl = document.getElementById('tetris-level');
const tScoreEl = document.getElementById('tetris-score');
const tCocaEl = document.getElementById('tetris-coca');
const tCocaBadgeEl = document.getElementById('tetris-coca-badge');
const tCocaToastEl = document.getElementById('tetris-coca-toast');
const tVictoryModalEl = document.getElementById('tetris-victory-modal');
const tEndTitleEl = document.getElementById('tetris-end-title');
const tEndDescEl = document.getElementById('tetris-end-desc');
const tAgainBtn = document.getElementById('tetris-again-btn');
const tHubBtn = document.getElementById('tetris-hub-btn');

const tLeftBtn = document.getElementById('t-left-btn');
const tRightBtn = document.getElementById('t-right-btn');
const tRotateBtn = document.getElementById('t-rotate-btn');
const tDownBtn = document.getElementById('t-down-btn');
const tDropBtn = document.getElementById('t-drop-btn');

const T_COLS = 10;
const T_ROWS = 20;
const T_BLOCK = 22;
const T_OFFSET_X = 10;
const T_OFFSET_Y = 0;
const T_WIN_SCORE = 5000;

const tetrominoes = {
  I: {
    matrix: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    main: '#38bdf8',
    light: '#bae6fd',
    dark: '#0284c7'
  },
  J: {
    matrix: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    main: '#818cf8',
    light: '#c7d2fe',
    dark: '#4338ca'
  },
  L: {
    matrix: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    main: '#fb923c',
    light: '#fed7aa',
    dark: '#c2410c'
  },
  O: {
    matrix: [
      [1, 1],
      [1, 1]
    ],
    main: '#facc15',
    light: '#fef08a',
    dark: '#ca8a04'
  },
  S: {
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    main: '#34d399',
    light: '#a7f3d0',
    dark: '#059669'
  },
  T: {
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    main: '#e879f9',
    light: '#f5d0fe',
    dark: '#a21caf'
  },
  Z: {
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    main: '#f43f5e',
    light: '#fecdd3',
    dark: '#be123c'
  }
};

const pieceKeys = Object.keys(tetrominoes);

let tetrisActive = false;
let tetrisLoopId = null;
let tLastTime = 0;
let dropCounter = 0;
let board = [];
let currentPiece = null;
let nextPieceType = null;
let tScore = 0;
let tLines = 0;
let tLevel = 1;
let tCocaCount = 0;
let tGameOver = false;
let tToastTimeout = null;
let tSparks = [];
let tTexts = [];

function createEmptyBoard() {
  return Array.from({ length: T_ROWS }, () => Array(T_COLS).fill(null));
}

function randomPieceType() {
  return pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
}

function createPiece(type) {
  const def = tetrominoes[type];
  const matrix = def.matrix.map(row => [...row]);
  return {
    type,
    matrix,
    x: Math.floor(T_COLS / 2) - Math.ceil(matrix[0].length / 2),
    y: 0
  };
}

function spawnTetrisSparks(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 45 + Math.random() * 140;
    tSparks.push({
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

function spawnTetrisText(x, y, text, color) {
  tTexts.push({ x, y, text, color, life: 1 });
}

function triggerTetrisCoca(lvl) {
  tCocaCount++;
  tCocaBadgeEl.classList.add('pop');
  setTimeout(() => tCocaBadgeEl.classList.remove('pop'), 350);

  tCocaToastEl.textContent = `🥤 ¡Ganaste 1 Coca-Cola! · Nivel ${lvl}`;
  tCocaToastEl.classList.add('show');
  if (tToastTimeout) clearTimeout(tToastTimeout);
  tToastTimeout = setTimeout(() => {
    tCocaToastEl.classList.remove('show');
  }, 3600);

  spawnTetrisSparks(120, 220, '#ef4444', 28);
  spawnTetrisSparks(120, 220, '#fde047', 24);
}

function updateTetrisHud() {
  tLinesEl.textContent = tLines;
  tLevelEl.textContent = tLevel;
  tScoreEl.textContent = tScore.toLocaleString('es-MX');
  tCocaEl.textContent = tCocaCount;
}

function collides(piece, offsetX = 0, offsetY = 0, testMatrix = piece.matrix) {
  for (let r = 0; r < testMatrix.length; r++) {
    for (let c = 0; c < testMatrix[r].length; c++) {
      if (!testMatrix[r][c]) continue;
      const newX = piece.x + c + offsetX;
      const newY = piece.y + r + offsetY;
      if (newX < 0 || newX >= T_COLS || newY >= T_ROWS) {
        return true;
      }
      if (newY >= 0 && board[newY][newX]) {
        return true;
      }
    }
  }
  return false;
}

function rotateMatrix(matrix) {
  const N = matrix.length;
  const result = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function playerRotate() {
  if (!currentPiece || tGameOver) return;
  const rotated = rotateMatrix(currentPiece.matrix);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collides(currentPiece, kick, 0, rotated)) {
      currentPiece.matrix = rotated;
      currentPiece.x += kick;
      return;
    }
  }
}

function playerMove(dir) {
  if (!currentPiece || tGameOver) return;
  if (!collides(currentPiece, dir, 0)) {
    currentPiece.x += dir;
  }
}

function mergePiece() {
  for (let r = 0; r < currentPiece.matrix.length; r++) {
    for (let c = 0; c < currentPiece.matrix[r].length; c++) {
      if (currentPiece.matrix[r][c]) {
        const by = currentPiece.y + r;
        const bx = currentPiece.x + c;
        if (by >= 0 && by < T_ROWS && bx >= 0 && bx < T_COLS) {
          board[by][bx] = currentPiece.type;
        }
      }
    }
  }
}

function addTetrisScore(points, textX, textY) {
  tScore = Math.min(T_WIN_SCORE, tScore + points);
  if (points >= 100) {
    spawnTetrisText(textX, textY, `+${points}`, '#fde047');
  }

  const earnedCocas = Math.floor(tScore / 1000);
  if (earnedCocas > tCocaCount) {
    tLevel = Math.min(5, earnedCocas + 1);
    triggerTetrisCoca(tLevel);
  }
  updateTetrisHud();

  if (tScore >= T_WIN_SCORE && !tGameOver) {
    endTetrisGame(true);
  }
}

function sweepLines() {
  let cleared = 0;
  for (let r = T_ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== null)) {
      const rowY = T_OFFSET_Y + r * T_BLOCK + T_BLOCK * 0.5;
      spawnTetrisSparks(120, rowY, '#f472b6', 18);
      spawnTetrisSparks(120, rowY, '#fde047', 14);
      board.splice(r, 1);
      board.unshift(Array(T_COLS).fill(null));
      cleared++;
      r++;
    }
  }

  if (cleared > 0) {
    tLines += cleared;
    const linePoints = [0, 250, 600, 1000, 1500][cleared] || 1500;
    addTetrisScore(linePoints, 120, 210);
  } else {
    addTetrisScore(25, 120, 210);
  }
}

function spawnNextPiece() {
  currentPiece = createPiece(nextPieceType || randomPieceType());
  nextPieceType = randomPieceType();
  drawNextPreview();
  if (collides(currentPiece, 0, 0)) {
    endTetrisGame(false);
  }
}

function dropStep() {
  if (!currentPiece || tGameOver) return;
  if (!collides(currentPiece, 0, 1)) {
    currentPiece.y++;
  } else {
    mergePiece();
    sweepLines();
    if (!tGameOver) {
      spawnNextPiece();
    }
  }
  dropCounter = 0;
}

function hardDrop() {
  if (!currentPiece || tGameOver) return;
  let dropped = 0;
  while (!collides(currentPiece, 0, 1)) {
    currentPiece.y++;
    dropped++;
  }
  if (dropped > 0) {
    const cx = T_OFFSET_X + (currentPiece.x + 1.5) * T_BLOCK;
    const cy = T_OFFSET_Y + (currentPiece.y + 1) * T_BLOCK;
    spawnTetrisSparks(cx, cy, tetrominoes[currentPiece.type].main, 12);
  }
  dropStep();
}

function drawPixelBlock(ctx, px, py, size, type, alpha = 1) {
  const def = tetrominoes[type];
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = def.main;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);

  ctx.fillStyle = def.light;
  ctx.fillRect(px + 1, py + 1, size - 2, 3);
  ctx.fillRect(px + 1, py + 1, 3, size - 2);

  ctx.fillStyle = def.dark;
  ctx.fillRect(px + 1, py + size - 4, size - 2, 3);
  ctx.fillRect(px + size - 4, py + 1, 3, size - 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillRect(px + 5, py + 5, 3, 3);
  ctx.restore();
}

function drawNextPreview() {
  nCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!nextPieceType) return;
  const def = tetrominoes[nextPieceType];
  const m = def.matrix;
  const blockSize = 20;
  const rows = m.length;
  const cols = m[0].length;
  const startX = Math.floor((nextCanvas.width - cols * blockSize) * 0.5);
  const startY = Math.floor((nextCanvas.height - rows * blockSize) * 0.5);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (m[r][c]) {
        drawPixelBlock(nCtx, startX + c * blockSize, startY + r * blockSize, blockSize, nextPieceType);
      }
    }
  }
}

function endTetrisGame(won) {
  tGameOver = true;
  tCocaToastEl.classList.remove('show');
  if (won) {
    tEndTitleEl.textContent = '✦ ¡Todo en orden! ✦';
    tEndDescEl.innerHTML = 'Llegaste a los <strong>5,000 puntos</strong> y desbloqueaste <strong>5 Coca-Colas</strong> bien frías canjeables en la vida real. ¡Mente despejada!';
  } else {
    tEndTitleEl.textContent = '✦ Buena partida ✦';
    tEndDescEl.innerHTML = `Conseguiste <strong>${tScore.toLocaleString('es-MX')} puntos</strong> y <strong>${tCocaCount} Coca-Cola(s)</strong>. ¿Juegas otra ronda?`;
  }
  tVictoryModalEl.classList.add('show');
}

function resetTetris() {
  board = createEmptyBoard();
  tScore = 0;
  tLines = 0;
  tLevel = 1;
  tCocaCount = 0;
  tGameOver = false;
  dropCounter = 0;
  tSparks = [];
  tTexts = [];
  nextPieceType = randomPieceType();
  tCocaToastEl.classList.remove('show');
  tVictoryModalEl.classList.remove('show');
  spawnNextPiece();
  updateTetrisHud();
}

function updateAndDrawTetris(timestamp) {
  if (!tetrisActive) return;
  tetrisLoopId = requestAnimationFrame(updateAndDrawTetris);

  if (!tLastTime) tLastTime = timestamp;
  const dt = Math.min((timestamp - tLastTime) / 1000, 0.05);
  tLastTime = timestamp;

  if (!tGameOver) {
    const dropInterval = Math.max(0.18, 0.72 - (tLevel - 1) * 0.11);
    dropCounter += dt;
    if (dropCounter >= dropInterval) {
      dropStep();
    }
  }

  tCtx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

  tCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let r = 0; r < T_ROWS; r++) {
    for (let c = 0; c < T_COLS; c++) {
      if ((r + c) % 2 === 0) {
        tCtx.fillRect(T_OFFSET_X + c * T_BLOCK, T_OFFSET_Y + r * T_BLOCK, T_BLOCK, T_BLOCK);
      }
    }
  }

  for (let r = 0; r < T_ROWS; r++) {
    for (let c = 0; c < T_COLS; c++) {
      const cell = board[r][c];
      if (cell) {
        drawPixelBlock(tCtx, T_OFFSET_X + c * T_BLOCK, T_OFFSET_Y + r * T_BLOCK, T_BLOCK, cell);
      }
    }
  }

  if (currentPiece && !tGameOver) {
    let ghostY = currentPiece.y;
    while (!collides(currentPiece, 0, ghostY - currentPiece.y + 1)) {
      ghostY++;
    }
    for (let r = 0; r < currentPiece.matrix.length; r++) {
      for (let c = 0; c < currentPiece.matrix[r].length; c++) {
        if (currentPiece.matrix[r][c]) {
          drawPixelBlock(
            tCtx,
            T_OFFSET_X + (currentPiece.x + c) * T_BLOCK,
            T_OFFSET_Y + (ghostY + r) * T_BLOCK,
            T_BLOCK,
            currentPiece.type,
            0.22
          );
          drawPixelBlock(
            tCtx,
            T_OFFSET_X + (currentPiece.x + c) * T_BLOCK,
            T_OFFSET_Y + (currentPiece.y + r) * T_BLOCK,
            T_BLOCK,
            currentPiece.type,
            1
          );
        }
      }
    }
  }

  for (let i = tSparks.length - 1; i >= 0; i--) {
    const sp = tSparks[i];
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.life -= dt * 1.9;
    if (sp.life <= 0) {
      tSparks.splice(i, 1);
      continue;
    }
    tCtx.globalAlpha = Math.max(0, sp.life);
    tCtx.fillStyle = sp.color;
    tCtx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
    tCtx.globalAlpha = 1;
  }

  for (let i = tTexts.length - 1; i >= 0; i--) {
    const ft = tTexts[i];
    ft.y -= 28 * dt;
    ft.life -= dt * 1.25;
    if (ft.life <= 0) {
      tTexts.splice(i, 1);
      continue;
    }
    tCtx.globalAlpha = Math.max(0, ft.life);
    tCtx.font = '700 13px "Plus Jakarta Sans", sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillStyle = ft.color;
    tCtx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
    tCtx.globalAlpha = 1;
  }
}

window.addEventListener('keydown', (e) => {
  if (!tetrisActive || tGameOver) return;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    e.preventDefault();
    playerMove(-1);
  } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    e.preventDefault();
    playerMove(1);
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    e.preventDefault();
    dropStep();
  } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    e.preventDefault();
    playerRotate();
  } else if (e.key === ' ') {
    e.preventDefault();
    hardDrop();
  }
});

tLeftBtn.addEventListener('click', () => playerMove(-1));
tRightBtn.addEventListener('click', () => playerMove(1));
tRotateBtn.addEventListener('click', () => playerRotate());
tDownBtn.addEventListener('click', () => dropStep());
tDropBtn.addEventListener('click', () => hardDrop());

chooseTetrisBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('arcade-hub-overlay').classList.remove('active');
  tetrisActive = true;
  tetrisOverlay.classList.add('active');
  resetTetris();
  tLastTime = 0;
  tetrisLoopId = requestAnimationFrame(updateAndDrawTetris);
});

function backToHubFromTetris() {
  tetrisActive = false;
  tetrisOverlay.classList.remove('active');
  if (tetrisLoopId) cancelAnimationFrame(tetrisLoopId);
  document.getElementById('arcade-hub-overlay').classList.add('active');
}

exitTetrisBtn.addEventListener('click', backToHubFromTetris);
tHubBtn.addEventListener('click', backToHubFromTetris);
tAgainBtn.addEventListener('click', resetTetris);