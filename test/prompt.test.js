const test = require('node:test');
const assert = require('node:assert');
const { buildPrompt } = require('../lib/prompt');

const card = { de: 'erledigen', en: 'to complete', example: 'Ich erledige es.' };

test('DE->EN: translation hidden, example visible', () => {
  assert.strictEqual(buildPrompt(card, () => 0), 'erledigen → ||_to complete_||\nIch erledige es\\.');
});

test('EN->DE: German word and example hidden', () => {
  assert.strictEqual(buildPrompt(card, () => 0.9), '_to complete_ → ||erledigen||\n||Ich erledige es\\.||');
});

test('no example, special characters escaped', () => {
  assert.strictEqual(buildPrompt({ de: 'a.b', en: 'x', example: '' }, () => 0), 'a\\.b → ||_x_||');
});
