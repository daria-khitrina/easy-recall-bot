const { parsePairs } = require('./parse');
const { newCard, applyGrade, selectSessionCards, GRADES } = require('./srs');

const SESSION_SIZE = 5;

const emptyData = () => ({ cards: [], nextId: 1, lastReminderSlot: null });

// Adds new cards / updates translation+example of existing ones (matched by German word).
function importText(data, text, now = Date.now()) {
  const { pairs, skipped } = parsePairs(text);
  let inserted = 0;
  let updated = 0;
  for (const { de, en, example } of pairs) {
    const existing = data.cards.find((c) => c.de === de);
    if (existing) {
      existing.en = en;
      existing.example = example;
      updated++;
    } else {
      data.cards.push(newCard(data.nextId++, de, en, example, now));
      inserted++;
    }
  }
  return { inserted, updated, skipped, found: pairs.length };
}

// Returns the graded card, or null for an unknown card / stale button (card not currently due).
function gradeCard(data, id, grade, dir = 'en', now = Date.now()) {
  if (!GRADES.includes(grade)) return null;
  const card = data.cards.find((c) => c.id === id);
  if (!card || card.due > now) return null;
  return applyGrade(card, grade, now, dir);
}

const nextCards = (data, size = SESSION_SIZE, now = Date.now()) => selectSessionCards(data.cards, size, now);

module.exports = { importText, gradeCard, nextCards, emptyData };
