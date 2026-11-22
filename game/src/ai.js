// Ember Duel — the Ember Warden's AI.
// The Warden shows its intent before you act, then carries it out on its turn.
// It leans aggressive when you are weak, and tends its wounds when it is hurt.
import { INTENTS } from './state.js';

export function chooseIntent(state) {
  const options = INTENTS.map((intent) => ({ ...intent }));
  for (const option of options) {
    // Hurt Warden nurses itself more often.
    if (option.kind === 'heal' && state.warden.hp <= 12) option.weight += 2;
    // A wounded player invites the heavy swing.
    if (option.kind === 'attack' && option.value === 9 && state.player.hp <= 9) {
      option.weight += 2;
    }
    // No point guarding when it already sits behind a thick wall.
    if (option.kind === 'guard' && state.warden.block >= 8) option.weight = 1;
    // No point healing at full life.
    if (option.kind === 'heal' && state.warden.hp >= state.warden.maxHp) {
      option.weight = 0;
    }
  }
  const total = options.reduce((s, o) => s + o.weight, 0);
  let roll = state.rng() * total;
  for (const option of options) {
    roll -= option.weight;
    if (roll <= 0) return option;
  }
  return options[0];
}

export function describeIntent(intent) {
  if (!intent) return '';
  return intent.text;
}
