// Ember Duel — game state and rules. Pure logic, no DOM, no canvas.
// A tiny seeded RNG keeps screenshot scenes and autoplay tests deterministic.
import { buildDeck } from './cards.js';
import { chooseIntent } from './ai.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newFighter(hp) {
  return { hp, maxHp: hp, block: 0, burnTurns: 0, burnDmg: 0 };
}

export function newGame(seed) {
  const rng = seed == null ? Math.random : mulberry32(seed);
  const state = {
    screen: 'battle',
    turn: 1,
    rng,
    player: newFighter(30),
    warden: newFighter(30),
    playerEnergy: 0,
    playerMaxEnergy: 3,
    hand: [],
    deck: [],
    discard: [],
    intent: null,
    log: 'The Ember Warden stokes the coals. Your move.',
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, damageTaken: 0 },
    result: null,
  };
  state.deck = buildDeck();
  shuffle(state.deck, rng);
  state.intent = pickIntent(state);
  startPlayerTurn(state);
  return state;
}

export function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function applyBurn(fighter, state, who) {
  if (fighter.burnTurns > 0) {
    const dmg = fighter.burnDmg;
    fighter.hp = Math.max(0, fighter.hp - dmg);
    fighter.burnTurns -= 1;
    if (who === 'player') state.stats.damageTaken += dmg;
    else state.stats.damageDealt += dmg;
    state.log = `${who === 'player' ? 'You burn' : 'The Warden burns'} for ${dmg}.`;
    if (fighter.burnTurns === 0) fighter.burnDmg = 0;
  }
}

export function dealDamage(target, amount, state, byPlayer) {
  let remaining = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, remaining);
    target.block -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) {
    target.hp = Math.max(0, target.hp - remaining);
    if (byPlayer) state.stats.damageDealt += remaining;
    else state.stats.damageTaken += remaining;
  }
  return remaining;
}

export function startPlayerTurn(state) {
  state.stats.turns = state.turn;
  applyBurn(state.player, state, 'player');
  if (checkEnd(state)) return;
  state.player.block = 0;
  state.playerEnergy = state.playerMaxEnergy;
  drawCards(state, 5 - state.hand.length);
  state.log = `Turn ${state.turn} — you gain 3 energy and draw up.`;
}

export function drawCards(state, n) {
  for (let i = 0; i < n; i++) {
    if (state.deck.length === 0) {
      if (state.discard.length === 0) return;
      state.deck = shuffle(state.discard.splice(0), state.rng);
      state.log = 'Your deck runs dry — the discard is reshuffled.';
    }
    state.hand.push(state.deck.pop());
  }
}

export function canPlay(state, index) {
  if (state.screen !== 'battle') return false;
  const card = state.hand[index];
  return !!card && card.cost <= state.playerEnergy;
}

export function playCard(state, index) {
  if (!canPlay(state, index)) return false;
  const card = state.hand[index];
  state.playerEnergy -= card.cost;
  state.hand.splice(index, 1);
  state.discard.push(card);
  state.stats.cardsPlayed += 1;
  switch (card.id) {
    case 'strike':
      dealDamage(state.warden, 3, state, true);
      state.log = `Strike hits the Warden for 3.`;
      break;
    case 'heavy':
      dealDamage(state.warden, 6, state, true);
      state.log = `Heavy Blow crashes into the Warden for 6.`;
      break;
    case 'guard':
      state.player.block += 5;
      state.log = `You raise your guard — +5 Block.`;
      break;
    case 'ember':
      dealDamage(state.warden, 4, state, true);
      state.warden.burnTurns = 2;
      state.warden.burnDmg = 2;
      state.log = `Ember Burst scorches for 4 and sets the Warden burning.`;
      break;
    case 'mend':
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 5);
      state.log = `Mend knits your wounds — +5 life.`;
      break;
    case 'spark':
      dealDamage(state.warden, 2, state, true);
      drawCards(state, 1);
      state.log = `Spark Chain arcs for 2 and draws a card.`;
      break;
    default:
      break;
  }
  checkEnd(state);
  return true;
}

export const INTENTS = [
  { kind: 'attack', value: 6, text: 'Attack 6', weight: 3 },
  { kind: 'attack', value: 9, text: 'Attack 9', weight: 2 },
  { kind: 'ember', value: 4, text: 'Ember 4 + Burn', weight: 2 },
  { kind: 'guard', value: 8, text: 'Guard 8', weight: 2 },
  { kind: 'heal', value: 6, text: 'Heal 6', weight: 1 },
];

export function pickIntent(state) {
  return chooseIntent(state);
}

export function endTurn(state) {
  if (state.screen !== 'battle') return;
  // The Warden acts on its intent.
  applyBurn(state.warden, state, 'warden');
  if (checkEnd(state)) return;
  const intent = state.intent;
  if (intent.kind === 'attack') {
    dealDamage(state.player, intent.value, state, false);
    state.log = `The Warden strikes you for ${intent.value}.`;
  } else if (intent.kind === 'ember') {
    dealDamage(state.player, intent.value, state, false);
    state.player.burnTurns = 2;
    state.player.burnDmg = 2;
    state.log = `The Warden hurls embers — ${intent.value} damage and you burn.`;
  } else if (intent.kind === 'guard') {
    state.warden.block += intent.value;
    state.log = `The Warden banks coals — +${intent.value} Block.`;
  } else if (intent.kind === 'heal') {
    state.warden.hp = Math.min(state.warden.maxHp, state.warden.hp + intent.value);
    state.log = `The Warden drinks from the coals — +${intent.value} life.`;
  }
  if (checkEnd(state)) return;
  state.intent = pickIntent(state);
  state.turn += 1;
  startPlayerTurn(state);
}

export function checkEnd(state) {
  if (state.warden.hp <= 0) {
    state.screen = 'win';
    state.result = 'win';
    state.log = 'The Ember Warden crumbles to ash. You win!';
    return true;
  }
  if (state.player.hp <= 0) {
    state.screen = 'loss';
    state.result = 'loss';
    state.log = 'The embers take you. You fall.';
    return true;
  }
  return false;
}

export function restart(state) {
  const fresh = newGame();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
}
