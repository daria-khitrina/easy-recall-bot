const test = require('node:test');
const assert = require('node:assert');
const { importText, gradeCard, nextCards, emptyData } = require('../lib/words');

test('import inserts, then updates by German word', () => {
  const data = emptyData();
  assert.deepStrictEqual(importText(data, 'üben, to practise, Ich übe.\nwechseln, to change'), { inserted: 2, updated: 0, skipped: 0, found: 2 });
  const r = importText(data, 'üben, to train, Neu.\nxx');
  assert.deepStrictEqual([r.inserted, r.updated, r.skipped], [0, 1, 1]);
  assert.strictEqual(data.cards[0].en, 'to train');
  assert.strictEqual(data.cards[0].example, 'Neu.');
  assert.strictEqual(data.cards.length, 2);
});

test('grading works once; a stale button for a not-due card is rejected', () => {
  const data = emptyData();
  importText(data, 'üben, to practise');
  const now = Date.now();
  assert.ok(gradeCard(data, 1, 'good', now));
  assert.strictEqual(gradeCard(data, 1, 'good', now), null);
  assert.strictEqual(gradeCard(data, 99, 'good', now), null);
  assert.strictEqual(gradeCard(data, 1, 'bogus', now + 10 ** 12), null);
});

test('session is capped at 5 cards', () => {
  const data = emptyData();
  importText(data, Array.from({ length: 8 }, (_, i) => `w${i}, t${i}`).join('\n'));
  assert.strictEqual(nextCards(data).length, 5);
});
