# Ember Duel

[![make.fun](https://img.shields.io/badge/make.fun-bounty-orange)](https://make.fun/bounty/best-card-game-20261122-1826)
[![Rank](https://img.shields.io/badge/rank-coming_soon-blue)](https://github.com/cervus-snoopy/crimson-ember-duel-7k2m)
[![Reward](https://img.shields.io/badge/reward-%2450-green)](https://github.com/cervus-snoopy/crimson-ember-duel-7k2m)

A turn-based battle card game. You duel the **Ember Warden** on a dark green
felt table with ember-orange accents. Both fighters start at 30 life. Each
turn you gain 3 energy and draw up to a 5-card hand. The Warden shows its
intent before you act, so you can Guard or race it. Block absorbs damage
until your next turn; Burn eats away at the start of the afflicted fighter's
turn. Reduce the Warden to 0 life to win.

## Cards

| Card | Cost | Effect |
| --- | --- | --- |
| Strike | 1 | Deal 3 damage. |
| Heavy Blow | 2 | Deal 6 damage. |
| Guard | 1 | Gain 5 Block. |
| Ember Burst | 2 | Deal 4 damage and apply Burn 2 for 2 turns. |
| Mend | 2 | Restore 5 life. |
| Spark Chain | 1 | Deal 2 damage and draw 1 card. |

## Controls

- **Mouse:** click a card to play it; click END TURN to end your turn.
- **Keys:** 1–7 play a hand card, **E** ends turn, **R** restarts, **M** mutes.
- **Sound:** short synthesized tones via Web Audio only — no audio files, no
  network requests.

## Play

Open `game/index.html` in a browser, or serve the `game` folder with any
static server. Staged scenes for screenshots: `?scene=title`, `?scene=play`,
`?scene=win`, `?scene=loss`.

`main.ts` (Node 22+) copies the game and screenshots into the output
directory and writes `dossier.json` describing the entry.

## License

MIT — see [LICENSE](LICENSE).
