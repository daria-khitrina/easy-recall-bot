const test = require('node:test');
const assert = require('node:assert');
const { applyGrade, selectSessionCards, newCard, MIN, DAY } = require('../lib/srs');

const NOW = 1_000_000_000_000;
const card = (over = {}) => ({ ...newCard(1, 'a', 'b', '', NOW), rank: 1, ...over });

test('new card: again/hard/good/easy', () => {
  assert.strictEqual(applyGrade(card(), 'again', NOW).due, NOW + 10 * MIN);
  assert.strictEqual(applyGrade(card(), 'hard', NOW).due, NOW + 10 * MIN);
  const good = applyGrade(card(), 'good', NOW);
  assert.deepStrictEqual([good.state, good.step, good.due], ['learning', 1, NOW + DAY]);
  const easy = applyGrade(card(), 'easy', NOW);
  assert.deepStrictEqual([easy.state, easy.interval, easy.due], ['review', 4, NOW + 4 * DAY]);
});

test('learning: good on last step graduates to 1 day, again resets', () => {
  const g = applyGrade(card({ state: 'learning', step: 1 }), 'good', NOW);
  assert.deepStrictEqual([g.state, g.interval, g.step], ['review', 1, -1]);
  const a = applyGrade(card({ state: 'learning', step: 1 }), 'again', NOW);
  assert.deepStrictEqual([a.step, a.due], [0, NOW + 10 * MIN]);
});

test('review grades', () => {
  const base = { state: 'review', interval: 10, ease: 2.5, step: -1 };
  assert.strictEqual(applyGrade(card(base), 'hard', NOW).interval, 12);
  assert.strictEqual(applyGrade(card(base), 'good', NOW).interval, 25);
  const easy = applyGrade(card(base), 'easy', NOW);
  assert.strictEqual(easy.interval, Math.round(10 * 2.65 * 1.3));
  const again = applyGrade(card(base), 'again', NOW);
  assert.deepStrictEqual([again.state, again.ease], ['learning', 2.3]);
});

test('ease never drops below floor', () => {
  const c = applyGrade(card({ state: 'review', interval: 3, ease: 1.35 }), 'again', NOW);
  assert.strictEqual(c.ease, 1.3);
});

test('selection: due before new, new ordered by rank, fills with fresh cards', () => {
  const cards = [
    card({ id: 1, state: 'new', rank: 5 }),
    card({ id: 2, state: 'review', due: NOW - DAY, interval: 3 }),
    card({ id: 3, state: 'new', rank: 2 }),
    card({ id: 4, state: 'review', due: NOW + DAY }),
  ];
  assert.deepStrictEqual(selectSessionCards(cards, 3, NOW).map((c) => c.id), [2, 3, 1]);
  assert.deepStrictEqual(selectSessionCards(cards, 1, NOW).map((c) => c.id), [2]);
});
