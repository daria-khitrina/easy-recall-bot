// Port of the Go scheduler: learning steps 10 min -> 1 day, then SM-2-like reviews.
const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;
const LEARNING_STEPS = [10 * MIN, DAY];
const EASE_FLOOR = 1.3;
const GRADES = ['again', 'hard', 'good', 'easy'];

const clampStep = (s) => Math.min(Math.max(s, 0), LEARNING_STEPS.length - 1);
const maxEase = (e) => Math.max(e, EASE_FLOOR);
const addDays = (now, n) => now + n * DAY;
// Go's math.Round rounds half away from zero; JS Math.round does not for negatives, but values here are positive.
const round = Math.round;

function graduate(card, now, days) {
  card.state = 'review';
  card.step = -1;
  card.interval = Math.max(1, days);
  card.due = addDays(now, card.interval);
  card.last = now;
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
    default:
      throw new Error(`unknown grade ${grade}`);
  }
  card.last = now;
}

function applyReview(card, grade, now) {
  switch (grade) {
    case 'again':
      card.lapses++;
      card.ease = maxEase(card.ease - 0.2);
      card.state = 'learning';
      card.step = 0;
      card.due = now + LEARNING_STEPS[0];
      card.last = now;
      return;
    case 'hard':
      card.ease = maxEase(card.ease - 0.15);
      card.interval = Math.max(1, round(card.interval * 1.2));
      break;
    case 'good':
      card.interval = Math.max(1, round(card.interval * card.ease));
      break;
    case 'easy':
      card.ease += 0.15;
      card.interval = Math.max(1, round(card.interval * card.ease * 1.3));
      break;
    default:
      throw new Error(`unknown grade ${grade}`);
  }
  card.state = 'review';
  card.step = -1;
  card.due = addDays(now, card.interval);
  card.reps++;
  card.last = now;
}

// Mutates and returns the card. Times are epoch milliseconds.
function applyGrade(card, grade, now = Date.now()) {
  if (card.state === 'learning') applyLearning(card, grade, now, false);
  else if (card.state === 'review') applyReview(card, grade, now);
  else applyLearning(card, grade, now, true);
  return card;
}

// Due cards first (new ones after learned ones, by rank), then fresh new cards to fill the session.
function selectSessionCards(cards, size, now = Date.now()) {
  const isNew = (c) => c.state === 'new';
  const due = cards
    .filter((c) => c.due <= now)
    .sort((a, b) => isNew(a) - isNew(b) || (isNew(a) ? a.rank - b.rank : 0) || a.due - b.due || a.id - b.id)
    .slice(0, size);
  if (due.length >= size) return due;
  const taken = new Set(due.map((c) => c.id));
  const fresh = cards
    .filter((c) => isNew(c) && !taken.has(c.id))
    .sort((a, b) => a.rank - b.rank || a.id - b.id)
    .slice(0, size - due.length);
  return [...due, ...fresh];
}

function newCard(id, de, en, example, now = Date.now()) {
  return {
    id, de, en, example: example || '', state: 'new', step: 0, due: now, interval: 0,
    ease: 2.5, reps: 0, lapses: 0, rank: Math.floor(Math.random() * 1_000_000_000) + 1, last: null,
  };
}

module.exports = { applyGrade, selectSessionCards, newCard, GRADES, LEARNING_STEPS, MIN, DAY };
