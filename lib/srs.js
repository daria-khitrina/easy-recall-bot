// Port of the Go scheduler: learning steps 10 min -> 1 day, then SM-2-like reviews.
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const LEARNING_STEPS = [10 * MIN, DAY];
const EASE_FLOOR = 1.3;
const GRADES = ['again', 'hard', 'good', 'easy'];

const clampStep = (s) => Math.min(Math.max(s, 0), LEARNING_STEPS.length - 1);
const maxEase = (e) => Math.max(e, EASE_FLOOR);
const addDays = (now, n) => now + n * DAY;

function graduate(card, now, days) {
  card.state = 'review';
  card.step = -1;
  card.interval = Math.max(1, days);
  card.due = addDays(now, card.interval);
}

function applyLearning(card, grade, now, fromNew) {
  card.state = 'learning';
  if (fromNew) card.step = 0;
  switch (grade) {
    case 'again':
      card.step = 0;
      card.due = now + LEARNING_STEPS[0];
      break;
    case 'hard':
      card.due = now + LEARNING_STEPS[clampStep(card.step)];
      break;
    case 'good': {
      const step = clampStep(card.step);
      if (step + 1 >= LEARNING_STEPS.length) return graduate(card, now, 1);
      card.step = step + 1;
      card.due = now + LEARNING_STEPS[card.step];
      break;
    }
    case 'easy':
      return graduate(card, now, 4);
    case 'pass': // DE->EN success: weak evidence, repeat the step
      card.due = now + LEARNING_STEPS[clampStep(card.step)];
      break;
    default:
      throw new Error(`unknown grade ${grade}`);
  }
}

function applyReview(card, grade, now) {
  switch (grade) {
    case 'again':
      card.ease = maxEase(card.ease - 0.2);
      card.state = 'learning';
      card.step = 0;
      card.due = now + LEARNING_STEPS[0];
      return;
    case 'hard':
      card.ease = maxEase(card.ease - 0.15);
      card.interval = Math.max(1, Math.round(card.interval * 1.2));
      break;
    case 'good':
      card.interval = Math.max(1, Math.round(card.interval * card.ease));
      break;
    case 'easy':
      card.ease += 0.15;
      card.interval = Math.max(1, Math.round(card.interval * card.ease * 1.3));
      break;
    case 'pass': // DE->EN success: small interval growth, ease untouched
      card.interval = Math.max(1, Math.round(card.interval * 1.2));
      break;
    default:
      throw new Error(`unknown grade ${grade}`);
  }
  card.state = 'review';
  card.step = -1;
  card.due = addDays(now, card.interval);
}

// Mutates and returns the card. Times are epoch milliseconds.
// Reading German is much easier than producing it, so a DE->EN success (dir 'de') only counts as a
// weak 'pass'; only failing ('again') is taken at face value. EN->DE grades are applied in full.
function applyGrade(card, grade, now = Date.now(), dir = 'en') {
  if (dir === 'de' && grade !== 'again') grade = 'pass';
  if (card.state === 'learning') applyLearning(card, grade, now, false);
  else if (card.state === 'review') applyReview(card, grade, now);
  else applyLearning(card, grade, now, true);
  return card;
}

// Cards that are due, learned ones first, then new ones in random (rank) order.
// New cards are due from the moment they are created, so there is no separate "fill with new" step.
function selectSessionCards(cards, size, now = Date.now()) {
  const isNew = (c) => c.state === 'new';
  return cards
    .filter((c) => c.due <= now)
    .sort((a, b) => isNew(a) - isNew(b) || (isNew(a) ? a.rank - b.rank : 0) || a.due - b.due || a.id - b.id)
    .slice(0, size);
}

function newCard(id, de, en, example, now = Date.now()) {
  return {
    id, de, en, example: example || '', state: 'new', step: 0, due: now, interval: 0,
    ease: 2.5, rank: Math.floor(Math.random() * 1_000_000_000) + 1,
  };
}

module.exports = { applyGrade, selectSessionCards, newCard, GRADES, LEARNING_STEPS, MIN, DAY };
