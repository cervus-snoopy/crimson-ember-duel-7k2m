// Ember Duel — card definitions.
// Every card: id, display name, energy cost, accent colour, element glyph,
// the big number shown on the card, its label, and one line of effect text.
export const CARDS = {
  strike: {
    id: 'strike', name: 'Strike', cost: 1, color: '#c0392b', glyph: '\u2694',
    value: 3, label: 'DAMAGE', text: 'Deal 3 damage.',
  },
  heavy: {
    id: 'heavy', name: 'Heavy Blow', cost: 2, color: '#8e44ad', glyph: '\u2692',
    value: 6, label: 'DAMAGE', text: 'Deal 6 damage.',
  },
  guard: {
    id: 'guard', name: 'Guard', cost: 1, color: '#2471a3', glyph: '\u26e8',
    value: 5, label: 'BLOCK', text: 'Gain 5 Block.',
  },
  ember: {
    id: 'ember', name: 'Ember Burst', cost: 2, color: '#e67e22', glyph: '\u2600',
    value: 4, label: 'DAMAGE', text: 'Deal 4 damage. Burn 2 for 2 turns.',
  },
  mend: {
    id: 'mend', name: 'Mend', cost: 2, color: '#27ae60', glyph: '\u2764',
    value: 5, label: 'HEAL', text: 'Restore 5 life.',
  },
  spark: {
    id: 'spark', name: 'Spark Chain', cost: 1, color: '#d4ac0d', glyph: '\u26a1',
    value: 2, label: 'DAMAGE', text: 'Deal 2 damage. Draw 1 card.',
  },
};

// The starting deck: 16 cards, shuffled at the start of every duel.
export function buildDeck() {
  const ids = [
    'strike', 'strike', 'strike', 'strike',
    'heavy', 'heavy', 'heavy',
    'guard', 'guard', 'guard',
    'ember', 'ember',
    'mend', 'mend',
    'spark', 'spark',
  ];
  return ids.map((id) => ({ ...CARDS[id] }));
}

export function cardById(id) {
  return CARDS[id];
}
