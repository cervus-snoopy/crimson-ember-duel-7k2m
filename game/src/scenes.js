// Ember Duel — staged screenshot scenes.
// Each scene is built from the real rules (newGame) and painted by the real
// renderer — no mock pixels. The URL parameter ?scene=title|play|win|loss
// picks one; the page sets window.__sceneReady once the scene is painted.
import { newGame } from './state.js';
import { CARDS } from './cards.js';

function handOf(...ids) {
  return ids.map((id) => ({ ...CARDS[id] }));
}

export function buildScene(name) {
  if (name === 'title') {
    const state = newGame(7);
    state.screen = 'title';
    state.sampleHand = handOf('strike', 'heavy', 'guard', 'ember', 'mend');
    return state;
  }
  if (name === 'play') {
    const state = newGame(7);
    state.screen = 'battle';
    state.turn = 2;
    state.stats.turns = 2;
    state.player.hp = 30;
    state.player.maxHp = 30;
    state.warden.hp = 30;
    state.warden.maxHp = 30;
    state.playerEnergy = 3;
    state.hand = handOf('strike', 'heavy', 'guard', 'ember', 'mend');
    state.deck = handOf('strike', 'spark', 'guard', 'heavy', 'mend', 'spark',
      'strike', 'ember', 'guard', 'strike', 'heavy');
    state.discard = [];
    state.intent = { kind: 'attack', value: 6, text: 'Attack 6', weight: 3 };
    state.log = 'Turn 2 — the Warden bares its fangs. Guard, or race it.';
    return state;
  }
  if (name === 'win') {
    const state = newGame(7);
    state.screen = 'win';
    state.result = 'win';
    state.warden.hp = 0;
    state.player.hp = 14;
    state.stats = { turns: 9, cardsPlayed: 21, damageDealt: 34, damageTaken: 16 };
    state.log = 'The Ember Warden crumbles to ash. You win!';
    return state;
  }
  if (name === 'loss') {
    const state = newGame(7);
    state.screen = 'loss';
    state.result = 'loss';
    state.player.hp = 0;
    state.warden.hp = 11;
    state.stats = { turns: 8, cardsPlayed: 17, damageDealt: 19, damageTaken: 31 };
    state.log = 'The embers take you. You fall.';
    return state;
  }
  return null;
}
