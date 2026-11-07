// MarkdownV2: everything outside spoilers/italics must be escaped.
const escapeMd = (s) => String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');

const pickDirection = (rand = Math.random) => (rand() < 0.5 ? 'de' : 'en');

// DE->EN ('de') shows the example openly; EN->DE ('en') hides the German word and its example.
function buildPrompt(card, dir) {
  const de = escapeMd(card.de);
  const en = `_${escapeMd(card.en)}_`;
  const example = escapeMd(card.example);
  if (dir === 'de') {
    return `${de} → ||${en}||` + (example ? `\n${example}` : '');
  }
  return `${en} → ||${de}||` + (example ? `\n||${example}||` : '');
}

module.exports = { buildPrompt, pickDirection };
