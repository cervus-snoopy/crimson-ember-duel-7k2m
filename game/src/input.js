// Ember Duel — mouse and keyboard input.
// Click a card to play it; keys 1-7 play a hand card, E ends the turn,
// R restarts, M mutes. Hit-testing reuses the renderer's layout.
import { getHitZones, W, H } from './renderer.js';
import { playCard, endTurn, restart } from './state.js';
import { sfx, toggleMute } from './sound.js';

function inside(rect, x, y) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function attachInput(canvas, getState, setState, ui, render) {
  function scalePos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * W,
      y: ((event.clientY - rect.top) / rect.height) * H,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const pos = scalePos(event);
    const state = getState();
    const zones = getHitZones(state);
    ui.hoverIndex = -1;
    if (state.screen === 'battle') {
      for (const zone of zones.cards) {
        if (inside(zone, pos.x, pos.y)) ui.hoverIndex = zone.index;
      }
    }
    render();
  });

  canvas.addEventListener('click', (event) => {
    const pos = scalePos(event);
    const state = getState();
    const zones = getHitZones(state);
    if (state.screen === 'title') {
      if (inside(zones.play, pos.x, pos.y)) {
        sfx.click();
        state.screen = 'battle';
        render();
      }
      return;
    }
    if (state.screen === 'battle') {
      for (const zone of zones.cards) {
        if (inside(zone, pos.x, pos.y)) {
          if (playCard(state, zone.index)) {
            const card = state.discard[state.discard.length - 1];
            if (card && card.id === 'guard') sfx.guard();
            else if (card && card.id === 'mend') sfx.heal();
            else if (card && card.id === 'ember') sfx.burn();
            else sfx.hit();
            if (state.screen === 'win') sfx.win();
            if (state.screen === 'loss') sfx.loss();
          }
          render();
          return;
        }
      }
      if (inside(zones.endTurn, pos.x, pos.y)) {
        sfx.turn();
        endTurn(state);
        if (state.screen === 'win') sfx.win();
        if (state.screen === 'loss') sfx.loss();
        render();
        return;
      }
      if (inside(zones.restart, pos.x, pos.y)) {
        restart(state);
        render();
      }
      return;
    }
    // Win / loss screens: any click on the button restarts.
    if (inside(zones.restart, pos.x, pos.y)) {
      sfx.click();
      restart(state);
      render();
    }
  });

  window.addEventListener('keydown', (event) => {
    const state = getState();
    const key = event.key.toLowerCase();
    if (key === 'm') {
      const nowMuted = toggleMute();
      state.log = nowMuted ? 'Sound muted.' : 'Sound on.';
      render();
      return;
    }
    if (key === 'r') {
      restart(state);
      render();
      return;
    }
    if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
      state.screen = 'battle';
      render();
      return;
    }
    if (state.screen !== 'battle') return;
    if (key === 'e') {
      sfx.turn();
      endTurn(state);
      if (state.screen === 'win') sfx.win();
      if (state.screen === 'loss') sfx.loss();
      render();
      return;
    }
    const n = parseInt(key, 10);
    if (n >= 1 && n <= 7 && n <= state.hand.length) {
      if (playCard(state, n - 1)) {
        sfx.hit();
        if (state.screen === 'win') sfx.win();
        if (state.screen === 'loss') sfx.loss();
      }
      render();
    }
  });
}
