// Ember Duel — make.fun entry program (Node 22+).
// Serves the game for the grader: resolves every path from its own file
// location (never from the working directory), creates the output directory,
// copies the game files and screenshots into it, and writes dossier.json
// describing the entry. Exits 0. Output is deterministic and byte-identical
// across runs.
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? path.resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : path.join(here, 'output');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else if (entry.isFile()) fs.copyFileSync(from, to);
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

fs.mkdirSync(outDir, { recursive: true });
copyDir(path.join(here, 'game'), path.join(outDir, 'game'));
copyDir(path.join(here, 'screenshots'), path.join(outDir, 'screenshots'));
copyFile(path.join(here, 'README.md'), path.join(outDir, 'README.md'));
copyFile(path.join(here, 'LICENSE'), path.join(outDir, 'LICENSE'));

const dossier = {
  title: 'Ember Duel',
  tagline: 'A battle of cards against the Ember Warden',
  bounty: 'best-card-game-20261122-1826',
  players: '1 player vs the Ember Warden (AI)',
  startingLife: 30,
  energyPerTurn: 3,
  handSize: 5,
  cards: [
    { name: 'Strike', cost: 1, effect: 'Deal 3 damage.' },
    { name: 'Heavy Blow', cost: 2, effect: 'Deal 6 damage.' },
    { name: 'Guard', cost: 1, effect: 'Gain 5 Block.' },
    { name: 'Ember Burst', cost: 2, effect: 'Deal 4 damage and apply Burn 2 for 2 turns.' },
    { name: 'Mend', cost: 2, effect: 'Restore 5 life.' },
    { name: 'Spark Chain', cost: 1, effect: 'Deal 2 damage and draw 1 card.' },
  ],
  rules: [
    'Both fighters start at 30 life.',
    'Each of your turns you gain 3 energy and draw up to a 5-card hand.',
    'Playing a card spends its energy cost.',
    'The Warden shows its intent for its next move before you act.',
    'Block absorbs damage until your next turn.',
    'Burn deals damage at the start of the afflicted fighter\'s turn for a set number of turns.',
    'You win by reducing the Warden to 0 life; you lose if your life hits 0.',
  ],
  controls: {
    mouse: 'Click a card to play it; click END TURN to end your turn.',
    keys: '1-7 play a hand card, E ends turn, R restarts, M mutes.',
  },
  sound: 'Short synthesized tones via Web Audio only. No audio files, no network requests.',
  scenes: {
    title: 'game/index.html?scene=title',
    play: 'game/index.html?scene=play',
    win: 'game/index.html?scene=win',
    loss: 'game/index.html?scene=loss',
  },
  screenshots: [
    'screenshots/1-title.png',
    'screenshots/2-play.png',
    'screenshots/3-win.png',
    'screenshots/4-loss.png',
  ],
  entrypoint: 'Open game/index.html in a browser, or serve the game folder with any static server.',
};

fs.writeFileSync(
  path.join(outDir, 'dossier.json'),
  JSON.stringify(dossier, null, 2) + '\n',
  'utf8',
);

console.log(`Ember Duel entry written to ${outDir}`);
