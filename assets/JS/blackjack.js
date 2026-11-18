const chooseBjBtn = document.getElementById('choose-blackjack-btn');
const bjOverlay = document.getElementById('bj-overlay');
const exitBjBtn = document.getElementById('exit-bj-btn');
const bjCanvas = document.getElementById('bj-canvas');
const bCtx = bjCanvas.getContext('2d');
bCtx.imageSmoothingEnabled = false;

const bjBetEl = document.getElementById('bj-bet');
const bjStreakEl = document.getElementById('bj-streak');
const bjScoreEl = document.getElementById('bj-score');
const bjCocaEl = document.getElementById('bj-coca');
const bjCocaBadgeEl = document.getElementById('bj-coca-badge');
const bjCocaToastEl = document.getElementById('bj-coca-toast');
const bjVictoryModalEl = document.getElementById('bj-victory-modal');
const bjEndTitleEl = document.getElementById('bj-end-title');
const bjEndDescEl = document.getElementById('bj-end-desc');
const bjAgainBtn = document.getElementById('bj-again-btn');
const bjHubBtn = document.getElementById('bj-hub-btn');

const bjBetControls = document.getElementById('bj-bet-controls');
const bjPlayControls = document.getElementById('bj-play-controls');
const bjChipBtns = document.querySelectorAll('.bj-chip-btn');
const bjDealBtn = document.getElementById('bj-deal-btn');
const bjHitBtn = document.getElementById('bj-hit-btn');
const bjStandBtn = document.getElementById('bj-stand-btn');
const bjDoubleBtn = document.getElementById('bj-double-btn');

const BJ_WIN_SCORE = 5000;

const suits = [
  { symbol: '♥', color: '#f43f5e' },
  { symbol: '♦', color: '#fb7185' },
  { symbol: '♠', color: '#1e1b4b' },
  { symbol: '♣', color: '#312e81' }
];

const ranks = [
  { label: 'A', val: 11 },
  { label: '2', val: 2 },
  { label: '3', val: 3 },
  { label: '4', val: 4 },
  { label: '5', val: 5 },
  { label: '6', val: 6 },
  { label: '7', val: 7 },
  { label: '8', val: 8 },
  { label: '9', val: 9 },
  { label: '10', val: 10 },
  { label: 'J', val: 10 },
  { label: 'Q', val: 10 },
  { label: 'K', val: 10 }
];

let bjActive = false;
let bjLoopId = null;
let bLastTime = 0;
let deck = [];
let playerHand = [];
let dealerHand = [];
let bjChips = 1000;
let currentBet = 250;
let bjStreak = 0;
let bjCocaCount = 0;
let roundState = 'betting';
let dealerReveal = false;
let bannerText = 'Elige tu apuesta y reparte';
let bannerColor = '#fde047';
let bjSparks = [];
let bjToastTimeout = null;
let dealerTurnTimer = 0;

function createShuffledDeck() {
  const fresh = [];
  for (const s of suits) {
    for (const r of ranks) {
      fresh.push({ suit: s.symbol, color: s.color, label: r.label, val: r.val });
    }
  }
  for (let i = fresh.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }
  return fresh;
}

function drawCardFromDeck() {
  if (deck.length < 12) {
    deck = createShuffledDeck();
  }
  return deck.pop();
}

function calculateHandValue(hand) {
  let total = 0;
  let aces = 0;
  for (const card of hand) {
    total += card.val;
    if (card.label === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function spawnBjSparks(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const ang = Math.random() * Math.PI * 2;
    const spd = 45 + Math.random() * 150;
    bjSparks.push({
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

function triggerBjCoca() {
  bjCocaCount++;
  bjCocaBadgeEl.classList.add('pop');
  setTimeout(() => bjCocaBadgeEl.classList.remove('pop'), 350);

  bjCocaToastEl.textContent = `🥤 ¡Ganaste 1 Coca-Cola! · (${bjCocaCount}/5)`;
  bjCocaToastEl.classList.add('show');
  if (bjToastTimeout) clearTimeout(bjToastTimeout);
  bjToastTimeout = setTimeout(() => {
    bjCocaToastEl.classList.remove('show');
  }, 3600);

  spawnBjSparks(430, 200, '#ef4444', 28);
  spawnBjSparks(430, 200, '#fde047', 24);
}

function updateBjHud() {
  bjBetEl.textContent = currentBet.toLocaleString('es-MX');
  bjStreakEl.textContent = bjStreak;
  bjScoreEl.textContent = bjChips.toLocaleString('es-MX');
  bjCocaEl.textContent = bjCocaCount;

  bjChipBtns.forEach(btn => {
    const val = Number(btn.dataset.bet);
    btn.classList.toggle('active', val === currentBet);
    btn.disabled = bjChips < val && val !== 250;
  });

  if (roundState === 'betting') {
    bjBetControls.classList.remove('hidden');
    bjPlayControls.classList.add('hidden');
  } else {
    bjBetControls.classList.add('hidden');
    bjPlayControls.classList.remove('hidden');
    const canAct = roundState === 'player';
    bjHitBtn.disabled = !canAct;
    bjStandBtn.disabled = !canAct;
    bjDoubleBtn.disabled = !canAct || playerHand.length !== 2 || bjChips < currentBet;
  }
}

function checkBjRewardsAndVictory() {
  const earnedCocas = Math.min(5, Math.floor(bjChips / 1000));
  while (bjCocaCount < earnedCocas) {
    triggerBjCoca();
  }
  updateBjHud();

  if (bjChips >= BJ_WIN_SCORE) {
    bjEndTitleEl.textContent = '✦ ¡Mesa conquistada! ✦';
    bjEndDescEl.innerHTML = 'Llegaste a <strong>5,000 fichas</strong> y desbloqueaste <strong>5 Coca-Colas</strong> bien frías canjeables en la vida real. ¡Gran jugada!';
    bjVictoryModalEl.classList.add('show');
  } else if (bjChips <= 0) {
    bjChips = 500;
    bannerText = '¡Recarga de emergencia +500 fichas!';
    bannerColor = '#38bdf8';
    updateBjHud();
  }
}

function finishRound(outcome, payoutMultiplier, msg, color) {
  roundState = 'betting';
  dealerReveal = true;
  bannerText = msg;
  bannerColor = color;

  if (payoutMultiplier > 0) {
    const winAmount = Math.round(currentBet * payoutMultiplier);
    bjChips += winAmount;
    if (outcome === 'win') {
      bjStreak++;
      spawnBjSparks(430, 260, '#34d399', 26);
      spawnBjSparks(430, 260, '#fde047', 20);
    }
  } else {
    bjStreak = 0;
    spawnBjSparks(430, 260, '#f43f5e', 18);
  }

  if (currentBet > bjChips && bjChips >= 250) {
    currentBet = 250;
  }

  checkBjRewardsAndVictory();
}

function startNewHand() {
  if (roundState !== 'betting') return;
  if (bjChips < currentBet) {
    currentBet = Math.min(250, bjChips);
  }
  bjChips -= currentBet;
  playerHand = [drawCardFromDeck(), drawCardFromDeck()];
  dealerHand = [drawCardFromDeck(), drawCardFromDeck()];
  dealerReveal = false;
  roundState = 'player';
  bannerText = 'Tu turno: ¿Pides carta o te plantas?';
  bannerColor = '#f8fafc';

  spawnBjSparks(430, 200, '#fde047', 12);
  updateBjHud();

  const pVal = calculateHandValue(playerHand);
  if (pVal === 21) {
    const dVal = calculateHandValue(dealerHand);
    if (dVal === 21) {
      finishRound('push', 1, '¡Empate con Blackjack! Recuperas tu apuesta', '#bae6fd');
    } else {
      finishRound('win', 2.5, '✦ ¡BLACKJACK NATURAL! Ganas 2.5x ✦', '#fde047');
    }
  }
}

function playerHit() {
  if (roundState !== 'player') return;
  playerHand.push(drawCardFromDeck());
  spawnBjSparks(430, 285, '#38bdf8', 10);
  const pVal = calculateHandValue(playerHand);
  updateBjHud();

  if (pVal > 21) {
    finishRound('lose', 0, `Te pasaste (${pVal}). Gana el crupier`, '#fb7185');
  } else if (pVal === 21) {
    startDealerTurn();
  }
}

function playerDouble() {
  if (roundState !== 'player' || playerHand.length !== 2 || bjChips < currentBet) return;
  bjChips -= currentBet;
  currentBet *= 2;
  playerHand.push(drawCardFromDeck());
  spawnBjSparks(430, 285, '#e879f9', 16);
  const pVal = calculateHandValue(playerHand);
  updateBjHud();

  if (pVal > 21) {
    finishRound('lose', 0, `Te pasaste al doblar (${pVal})`, '#fb7185');
  } else {
    startDealerTurn();
  }
}

function startDealerTurn() {
  if (roundState !== 'player') return;
  roundState = 'dealer';
  dealerReveal = true;
  dealerTurnTimer = 0.55;
  bannerText = 'Turno del crupier...';
  bannerColor = '#fbcfe8';
  updateBjHud();
}

function resolveDealerWinner() {
  const pVal = calculateHandValue(playerHand);
  const dVal = calculateHandValue(dealerHand);

  if (dVal > 21) {
    finishRound('win', 2, `¡El crupier se pasó (${dVal})! ¡Ganaste!`, '#34d399');
  } else if (pVal > dVal) {
    finishRound('win', 2, `¡Ganaste! ${pVal} contra ${dVal}`, '#34d399');
  } else if (pVal < dVal) {
    finishRound('lose', 0, `Gana el crupier: ${dVal} contra ${pVal}`, '#fb7185');
  } else {
    finishRound('push', 1, `Empate en ${pVal}. Recuperas tu apuesta`, '#bae6fd');
  }
}

function drawPixelCard(x, y, card, hidden = false) {
  const w = 68;
  const h = 96;
  const rx = Math.round(x - w * 0.5);
  const ry = Math.round(y - h * 0.5);

  bCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  bCtx.fillRect(rx + 4, ry + 5, w, h);

  if (hidden) {
    bCtx.fillStyle = '#312e81';
    bCtx.fillRect(rx, ry, w, h);
    bCtx.strokeStyle = '#fde047';
    bCtx.lineWidth = 2;
    bCtx.strokeRect(rx + 1, ry + 1, w - 2, h - 2);

    bCtx.fillStyle = '#4338ca';
    for (let py = ry + 8; py < ry + h - 8; py += 8) {
      for (let px = rx + 8; px < rx + w - 8; px += 8) {
        bCtx.fillRect(px, py, 4, 4);
      }
    }
    bCtx.fillStyle = '#fde047';
    bCtx.font = '700 18px "Plus Jakarta Sans", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('✦', rx + w * 0.5, ry + h * 0.5 + 6);
    return;
  }

  bCtx.fillStyle = '#fffbeb';
  bCtx.fillRect(rx, ry, w, h);
  bCtx.strokeStyle = '#1e1b4b';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(rx + 1, ry + 1, w - 2, h - 2);

  bCtx.fillStyle = card.color;
  bCtx.font = '700 15px "Plus Jakarta Sans", sans-serif';
  bCtx.textAlign = 'left';
  bCtx.fillText(card.label, rx + 7, ry + 19);
  bCtx.fillText(card.suit, rx + 7, ry + 34);

  bCtx.font = '700 28px "Plus Jakarta Sans", sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText(card.suit, rx + w * 0.5, ry + h * 0.5 + 10);
}

function resetBlackjack() {
  deck = createShuffledDeck();
  playerHand = [];
  dealerHand = [];
  bjChips = 1000;
  currentBet = 250;
  bjStreak = 0;
  bjCocaCount = 1;
  roundState = 'betting';
  dealerReveal = false;
  bannerText = 'Elige tu apuesta y reparte';
  bannerColor = '#fde047';
  bjSparks = [];
  bjCocaToastEl.classList.remove('show');
  bjVictoryModalEl.classList.remove('show');
  updateBjHud();
}

function updateAndDrawBlackjack(timestamp) {
  if (!bjActive) return;
  bjLoopId = requestAnimationFrame(updateAndDrawBlackjack);

  if (!bLastTime) bLastTime = timestamp;
  const dt = Math.min((timestamp - bLastTime) / 1000, 0.05);
  bLastTime = timestamp;

  if (roundState === 'dealer') {
    dealerTurnTimer -= dt;
    if (dealerTurnTimer <= 0) {
      const dVal = calculateHandValue(dealerHand);
      if (dVal < 17) {
        dealerHand.push(drawCardFromDeck());
        spawnBjSparks(430, 105, '#f472b6', 10);
        dealerTurnTimer = 0.55;
      } else {
        resolveDealerWinner();
      }
    }
  }

  bCtx.clearRect(0, 0, bjCanvas.width, bjCanvas.height);

  bCtx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
  bCtx.lineWidth = 2;
  bCtx.strokeRect(18, 14, bjCanvas.width - 36, bjCanvas.height - 28);

  const dealerScoreLabel = dealerHand.length === 0
    ? 'Crupier Cósmico'
    : (dealerReveal ? `Crupier Cósmico · ${calculateHandValue(dealerHand)}` : `Crupier Cósmico · ${dealerHand[0].val}`);

  bCtx.fillStyle = 'rgba(245, 238, 255, 0.85)';
  bCtx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  bCtx.textAlign = 'center';
  bCtx.fillText(dealerScoreLabel, bjCanvas.width * 0.5, 38);

  const dSpacing = 78;
  const dStartX = bjCanvas.width * 0.5 - ((dealerHand.length - 1) * dSpacing) * 0.5;
  dealerHand.forEach((card, idx) => {
    const isHidden = idx === 1 && !dealerReveal;
    drawPixelCard(dStartX + idx * dSpacing, 102, card, isHidden);
  });

  bCtx.fillStyle = 'rgba(15, 10, 34, 0.78)';
  bCtx.fillRect(bjCanvas.width * 0.5 - 220, 178, 440, 36);
  bCtx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
  bCtx.lineWidth = 1;
  bCtx.strokeRect(bjCanvas.width * 0.5 - 220, 178, 440, 36);

  bCtx.fillStyle = bannerColor;
  bCtx.font = '700 14px "Plus Jakarta Sans", sans-serif';
  bCtx.fillText(bannerText, bjCanvas.width * 0.5, 201);

  const playerScoreLabel = playerHand.length === 0
    ? 'Tu mano'
    : `Tu mano · ${calculateHandValue(playerHand)}`;

  bCtx.fillStyle = 'rgba(245, 238, 255, 0.9)';
  bCtx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  bCtx.fillText(playerScoreLabel, bjCanvas.width * 0.5, 368);

  const pSpacing = 78;
  const pStartX = bjCanvas.width * 0.5 - ((playerHand.length - 1) * pSpacing) * 0.5;
  playerHand.forEach((card, idx) => {
    drawPixelCard(pStartX + idx * pSpacing, 292, card, false);
  });

  for (let i = bjSparks.length - 1; i >= 0; i--) {
    const sp = bjSparks[i];
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.life -= dt * 1.9;
    if (sp.life <= 0) {
      bjSparks.splice(i, 1);
      continue;
    }
    bCtx.globalAlpha = Math.max(0, sp.life);
    bCtx.fillStyle = sp.color;
    bCtx.fillRect(Math.round(sp.x), Math.round(sp.y), sp.size, sp.size);
    bCtx.globalAlpha = 1;
  }
}

bjChipBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    if (roundState !== 'betting') return;
    const val = Number(btn.dataset.bet);
    if (bjChips >= val) {
      currentBet = val;
      updateBjHud();
    }
  });
});

bjDealBtn.addEventListener('click', startNewHand);
bjHitBtn.addEventListener('click', playerHit);
bjStandBtn.addEventListener('click', startDealerTurn);
bjDoubleBtn.addEventListener('click', playerDouble);

chooseBjBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('arcade-hub-overlay').classList.remove('active');
  bjActive = true;
  bjOverlay.classList.add('active');
  resetBlackjack();
  bLastTime = 0;
  bjLoopId = requestAnimationFrame(updateAndDrawBlackjack);
});

function backToHubFromBj() {
  bjActive = false;
  bjOverlay.classList.remove('active');
  if (bjLoopId) cancelAnimationFrame(bjLoopId);
  document.getElementById('arcade-hub-overlay').classList.add('active');
}

exitBjBtn.addEventListener('click', backToHubFromBj);
bjHubBtn.addEventListener('click', backToHubFromBj);
bjAgainBtn.addEventListener('click', resetBlackjack);