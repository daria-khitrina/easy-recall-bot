const test = require('node:test');
const assert = require('node:assert');
const { parsePairs } = require('../lib/parse');

test('parses the pasted format and keeps commas in the example', () => {
  const text = `erledigen, to complete, Ich muss heute noch viele Aufgaben erledigen, bevor ich in den Urlaub fahre.

gleichzeitig, at the same time / simultaneously, Ich kann nicht gleichzeitig telefonieren.

üben, to practise
kaputt`;
  const { pairs, skipped } = parsePairs(text);
  assert.strictEqual(pairs.length, 3);
  assert.strictEqual(skipped, 1);
  assert.deepStrictEqual(pairs[0], {
    de: 'erledigen', en: 'to complete',
    example: 'Ich muss heute noch viele Aufgaben erledigen, bevor ich in den Urlaub fahre.',
  });
  assert.strictEqual(pairs[1].en, 'at the same time / simultaneously');
  assert.strictEqual(pairs[2].example, '');
});

test('skips lines with an empty side', () => {
  assert.deepStrictEqual(parsePairs(', x\nfoo, ').pairs, []);
});
