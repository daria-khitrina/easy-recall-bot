// "word, translation, example" per line; only the first two commas split, so the example may contain commas.
function parsePairs(text) {
  const pairs = [];
  let skipped = 0;
  for (const line of String(text).split('\n')) {
    if (line.trim() === '') continue;
    const first = line.indexOf(',');
    const second = first === -1 ? -1 : line.indexOf(',', first + 1);
    const parts = first === -1
      ? [line]
      : second === -1
        ? [line.slice(0, first), line.slice(first + 1)]
        : [line.slice(0, first), line.slice(first + 1, second), line.slice(second + 1)];
    const [de, en, example = ''] = parts.map((p) => p.trim());
    if (!de || !en) {
      skipped++;
      continue;
    }
    pairs.push({ de, en, example });
  }
  return { pairs, skipped };
}

module.exports = { parsePairs };
