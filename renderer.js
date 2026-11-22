// Ember Duel — canvas renderer. Draws every screen from the live game state.
export const W = 1280;
export const H = 800;
export const CARD_W = 150;
export const CARD_H = 210;
export const HAND_OVERLAP = 30;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fitFont(ctx, text, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `bold ${size}px sans-serif`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `bold ${size}px sans-serif`;
  }
  return size;
}

export function handLayout(state) {
  const n = state.hand.length;
  const totalW = n * CARD_W - (n - 1) * HAND_OVERLAP;
  const startX = (W - totalW) / 2;
  // Raised so the bottom HUD strip (life bar, deck counts, energy, END TURN)
  // sits fully below the hand instead of hiding behind it.
  const y = H - CARD_H - 110;
  return state.hand.map((card, i) => ({
    card,
    index: i,
    x: startX + i * (CARD_W - HAND_OVERLAP),
    y,
    w: CARD_W,
    h: CARD_H,
    // The width of this card not covered by its neighbour.
    visibleW: i === n - 1 ? CARD_W : CARD_W - HAND_OVERLAP,
  }));
}

export function getHitZones(state) {
  const zones = { cards: [], endTurn: null, play: null, restart: null };
  if (state.screen === 'title') {
    zones.play = { x: W / 2 - 110, y: 560, w: 220, h: 64 };
    return zones;
  }
  if (state.screen === 'battle') {
    zones.cards = handLayout(state).map((c) => ({
      x: c.x, y: c.y, w: c.w, h: c.h, index: c.index,
    }));
    zones.endTurn = { x: W - 210, y: H - 84, w: 170, h: 56 };
    return zones;
  }
  zones.restart = { x: W / 2 - 110, y: 560, w: 220, h: 64 };
  return zones;
}

function drawFelt(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0d3b26');
  g.addColorStop(0.55, '#0a2f1f');
  g.addColorStop(1, '#071f15');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(230,126,34,0.55)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 560, 330, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(230,126,34,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, 520, 300, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLifeBar(ctx, x, y, w, label, fighter) {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, x - 6, y - 6, w + 12, 62, 10);
  ctx.fill();
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y + 14);
  ctx.fillStyle = '#3a0d0d';
  roundRect(ctx, x, y + 22, w, 18, 9);
  ctx.fill();
  const frac = Math.max(0, fighter.hp / fighter.maxHp);
  ctx.fillStyle = frac > 0.5 ? '#27ae60' : frac > 0.25 ? '#e67e22' : '#c0392b';
  if (frac > 0) {
    roundRect(ctx, x, y + 22, w * frac, 18, 9);
    ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${fighter.hp} / ${fighter.maxHp}`, x + w / 2, y + 36);
  ctx.textAlign = 'left';
  let extra = '';
  if (fighter.block > 0) extra += `Block ${fighter.block}  `;
  if (fighter.burnTurns > 0) extra += `Burn ${fighter.burnDmg} x${fighter.burnTurns}`;
  if (extra) {
    ctx.fillStyle = '#ffd9a0';
    ctx.font = '13px sans-serif';
    ctx.fillText(extra, x, y + 58);
  }
}

export function drawCard(ctx, card, x, y, w, h, faceUp, hover, opts) {
  // visibleW: the width of this card not covered by its neighbour. Text and
  // the glyph are laid out inside it so nothing is ever clipped by overlap.
  const visibleW = (opts && opts.visibleW) || CARD_W;
  const scale = w / CARD_W;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (hover) ctx.translate(0, -12);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, 4, 6, CARD_W, CARD_H, 12);
  ctx.fill();
  if (!faceUp) {
    ctx.fillStyle = '#7b2d0e';
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
    ctx.fill();
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 3;
    roundRect(ctx, 8, 8, CARD_W - 16, CARD_H - 16, 8);
    ctx.stroke();
    ctx.fillStyle = '#f39c12';
    ctx.font = '44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u2600', CARD_W / 2, CARD_H / 2 + 16);
    ctx.restore();
    return;
  }
  // Face-up card: cream face, coloured border.
  ctx.fillStyle = '#f7f0dc';
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fill();
  ctx.strokeStyle = card.color;
  ctx.lineWidth = 5;
  roundRect(ctx, 2, 2, CARD_W - 4, CARD_H - 4, 10);
  ctx.stroke();
  // Cost pip, top-left.
  ctx.fillStyle = '#1d4e89';
  ctx.beginPath();
  ctx.arc(24, 24, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), 24, 31);
  // Element glyph, top-right — kept inside the visible strip.
  ctx.fillStyle = card.color;
  ctx.font = '26px sans-serif';
  ctx.fillText(card.glyph, Math.min(CARD_W - 24, visibleW - 24), 33);
  // Name — fitted to the visible width so a neighbour never clips it.
  const nameMax = visibleW - 14;
  const nameSize = fitFont(ctx, card.name, nameMax, 19, 14);
  ctx.fillStyle = '#222';
  ctx.font = `bold ${nameSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(card.name, 10, 66);
  // Divider.
  ctx.strokeStyle = card.color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(10, 76);
  ctx.lineTo(CARD_W - 10, 76);
  ctx.stroke();
  // Big value number and label.
  ctx.fillStyle = card.color;
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.value), CARD_W / 2, 138);
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#555';
  ctx.fillText(card.label, CARD_W / 2, 160);
  // Effect text, wrapped inside the visible strip, centred on it.
  ctx.fillStyle = '#333';
  ctx.font = '12px sans-serif';
  wrapText(ctx, card.text, visibleW / 2, 180, visibleW - 20, 15);
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yy = y;
  ctx.textAlign = 'center';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, cx, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, cx, yy);
}

function drawButton(ctx, rect, label, accent) {
  ctx.fillStyle = accent || '#e67e22';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 7);
  ctx.textAlign = 'left';
}

function drawWarden(ctx, state) {
  const cx = W / 2;
  const cy = 108;
  // Flame emblem in a ring.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#f39c12';
  ctx.font = '56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u2600', cx, cy + 20);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Ember Warden', cx, cy + 82);
  // Face-down hand.
  for (let i = 0; i < 3; i++) {
    drawCard(ctx, null, cx - 120 + i * 52, 210, 86, 120, false, false);
  }
  ctx.textAlign = 'left';
}

function drawTitle(ctx, state) {
  drawFelt(ctx);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 84px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMBER DUEL', W / 2, 210);
  ctx.fillStyle = '#f39c12';
  ctx.font = '24px sans-serif';
  ctx.fillText('Outwit the Ember Warden — burn bright, guard well, strike true.', W / 2, 256);
  // Sample fanned hand.
  const sample = state.sampleHand || [];
  const n = sample.length;
  const totalW = n * CARD_W - (n - 1) * HAND_OVERLAP;
  const startX = (W - totalW) / 2;
  sample.forEach((card, i) => {
    const visibleW = i === n - 1 ? CARD_W : CARD_W - HAND_OVERLAP;
    drawCard(ctx, card, startX + i * (CARD_W - HAND_OVERLAP), 330, CARD_W, CARD_H, true, false, { visibleW });
  });
  drawButton(ctx, { x: W / 2 - 110, y: 560, w: 220, h: 64 }, 'PLAY', '#e67e22');
  ctx.fillStyle = '#cfe3d4';
  ctx.font = '15px sans-serif';
  ctx.fillText('Click a card to play it  •  Keys 1–7 play  •  E end turn  •  R restart  •  M mute', W / 2, 668);
  ctx.textAlign = 'left';
}

function drawBattle(ctx, state, ui) {
  drawFelt(ctx);
  drawLifeBar(ctx, 32, 24, 300, 'Ember Warden', state.warden);
  // Turn counter, top center.
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Turn ${state.turn}`, W / 2, 34);
  // Intent, top-right.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, W - 332, 18, 300, 56, 10);
  ctx.fill();
  ctx.fillStyle = '#ffd9a0';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Warden intends:', W - 316, 40);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 19px sans-serif';
  ctx.fillText(state.intent ? state.intent.text : '', W - 316, 64);
  drawWarden(ctx, state);
  // Player life bar, bottom-left (in the freed bottom strip).
  drawLifeBar(ctx, 32, H - 84, 300, 'You', state.player);
  // Deck / discard counts, center-bottom.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, W / 2 - 110, H - 78, 220, 40, 10);
  ctx.fill();
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Deck ${state.deck.length}    Discard ${state.discard.length}`, W / 2, H - 52);
  // Energy pips, bottom-right.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f5f0e1';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Energy', W - 330, H - 88);
  for (let i = 0; i < state.playerMaxEnergy; i++) {
    ctx.fillStyle = i < state.playerEnergy ? '#2e86ff' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(W - 300 + i * 34, H - 58, 13, 0, Math.PI * 2);
    ctx.fill();
  }
  // Battle log, one line above the hand.
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'italic 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(state.log || '', W / 2, H - CARD_H - 136);
  ctx.textAlign = 'left';
  // Hand.
  const layout = handLayout(state);
  for (const slot of layout) {
    const playable = slot.card.cost <= state.playerEnergy;
    const hover = ui && ui.hoverIndex === slot.index;
    ctx.globalAlpha = playable ? 1 : 0.55;
    drawCard(ctx, slot.card, slot.x, slot.y, slot.w, slot.h, true, hover, { visibleW: slot.visibleW });
    ctx.globalAlpha = 1;
  }
  drawButton(ctx, { x: W - 210, y: H - 84, w: 170, h: 56 }, 'END TURN', '#c0392b');
  ctx.fillStyle = '#cfe3d4';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('R restart   M mute', W - 125, H - 94);
  ctx.textAlign = 'left';
}

function drawEndScreen(ctx, state, won) {
  drawFelt(ctx);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = won ? '#f39c12' : '#c0392b';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(won ? 'VICTORY' : 'DEFEAT', W / 2, 190);
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '22px sans-serif';
  ctx.fillText(
    won ? 'The Ember Warden crumbles to ash.' : 'The embers take you. The Warden endures.',
    W / 2, 236,
  );
  // Match statistics panel.
  const s = state.stats;
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(ctx, W / 2 - 260, 280, 520, 220, 14);
  ctx.fill();
  ctx.strokeStyle = '#e67e22';
  ctx.lineWidth = 2;
  roundRect(ctx, W / 2 - 260, 280, 520, 220, 14);
  ctx.stroke();
  ctx.fillStyle = '#f5f0e1';
  ctx.font = '20px sans-serif';
  const rows = [
    `Turns played: ${s.turns}`,
    `Cards played: ${s.cardsPlayed}`,
    `Damage dealt: ${s.damageDealt}`,
    `Damage taken: ${s.damageTaken}`,
  ];
  rows.forEach((row, i) => ctx.fillText(row, W / 2, 330 + i * 40));
  drawButton(ctx, { x: W / 2 - 110, y: 560, w: 220, h: 64 }, 'PLAY AGAIN', '#e67e22');
  ctx.textAlign = 'left';
}

export function draw(ctx, state, ui) {
  ctx.clearRect(0, 0, W, H);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'battle') drawBattle(ctx, state, ui);
  else if (state.screen === 'win') drawEndScreen(ctx, state, true);
  else if (state.screen === 'loss') drawEndScreen(ctx, state, false);
}
