// MarkdownV2: everything outside spoilers/italics must be escaped.
const escapeMd = (s) => String(s).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');

// Direction is random. DE->EN shows the example openly; EN->DE hides the German word and its example.
function buildPrompt(card, rand = Math.random) {
  const de = escapeMd(card.de);
  const en = `_${escapeMd(card.en)}_`;
  const example = escapeMd(card.example);
  if (rand() < 0.5) {
    return `${de} → ||${en}||` + (example ? `\n${example}` : '');
  }
  return `${en} → ||${de}||` + (example ? `\n||${example}||` : '');
}

module.exports = { buildPrompt, escapeMd };
