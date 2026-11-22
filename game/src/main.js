// Ember Duel — bootstrap. Wires state, renderer, input and sound together,
// serves the staged scenes (?scene=...) and the autoplay playtest hook
// (?autoplay=win|loss&seed=N). Signals readiness with window.__sceneReady.
import { newGame, playCard, endTurn, canPlay } from './state.js';
import { CARDS } from './cards.js';
import { draw, W, H } from './renderer.js';
import { attachInput } from './input.js';
import { buildScene } from './scenes.js';

window.__errors = [];
window.addEventListener('error', (event) => {
  window.__errors.push(String(event.message || event.error || 'unknown error'));
});
window.addEventListener('unhandledrejection', (event) => {
  window.__errors.push(`unhandled: ${String(event.reason)}`);
});

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seedParam = params.get('seed');
const seed = seedParam == null ? null : parseInt(seedParam, 10);

let game;
const sceneName = params.get('scene');
if (sceneName) {
  game = buildScene(sceneName);
} else {
  game = newGame(seed);
  game.screen = 'title';
  const ids = ['strike', 'heavy', 'guard', 'ember', 'mend'];
  game.sampleHand = ids.map((id) => ({ ...CARDS[id] }));
}

const ui = { hoverIndex: -1 };
let state = game;

function render() {
  draw(ctx, state, ui);
}

attachInput(canvas, () => state, (s) => { state = s; }, ui, render);
render();

function reportTest(result) {
  const el = document.getElementById('test-result');
  if (el) {
    el.textContent = JSON.stringify({
      result,
      screen: state.screen,
      turns: state.stats.turns,
      cardsPlayed: state.stats.cardsPlayed,
      damageDealt: state.stats.damageDealt,
      damageTaken: state.stats.damageTaken,
      playerHp: state.player.hp,
      wardenHp: state.warden.hp,
      errors: window.__errors,
    });
  }
  window.__playtest = {
    result, screen: state.screen, errors: window.__errors,
  };
}

async function autoplay(mode) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  state.screen = 'battle';
  render();
  for (let step = 0; step < 400 && state.screen === 'battle'; step++) {
    if (mode === 'win') {
      // Play damage first, then utility, then guard/mend as needed.
      const priority = ['ember', 'heavy', 'strike', 'spark', 'mend', 'guard'];
      let played = true;
      while (played && state.screen === 'battle') {
        played = false;
        for (const want of priority) {
          const idx = state.hand.findIndex((c) => c.id === want && canPlay(state, state.hand.indexOf(c)));
          if (idx >= 0) {
            if (want === 'mend' && state.player.hp > 20) continue;
            if (want === 'guard' && (!state.intent || state.intent.kind !== 'attack')) continue;
            playCard(state, idx);
            played = true;
            render();
            await sleep(15);
            break;
          }
        }
      }
    }
    if (state.screen !== 'battle') break;
    endTurn(state);
    render();
    await sleep(15);
  }
  reportTest(state.screen);
}

const autoplayMode = params.get('autoplay');
if (autoplayMode) {
  autoplay(autoplayMode).catch((e) => {
    window.__errors.push(String(e));
    reportTest('error');
  });
}

requestAnimationFrame(() => {
  render();
  window.__sceneReady = true;
});
