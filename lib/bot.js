const { Telegraf, Markup } = require('telegraf');
const { buildPrompt, pickDirection } = require('./prompt');
const { importText, gradeCard, nextCards } = require('./words');

const REVIEW_BUTTON = 'Review 5 cards';
// Always-visible button under the input field; pressing it sends its label as a normal message.
const mainMenu = Markup.keyboard([[REVIEW_BUTTON]]).resize().persistent();

const LABELS = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

const WELCOME =
  'Add words by sending me a message, one card per line:\n' +
  'German word, English translation, example sentence (optional)\n\n' +
  'Existing words get updated.\n\n' +
  'During /review, rate how easy it was to recall each word:\n' +
  '- Again: could not recall it\n- Hard: recalled with effort\n- Good: recalled correctly\n- Easy: instant recall\n\n' +
  'I will bring harder cards back sooner and easy ones later. Cards shown German → English are easy to guess, so only a failure counts fully there; the real test is English → German.\n\n' +
  'Reminders: 3 sessions a day (morning, afternoon, evening), 5 words each.\n\n' +
  'Use /review to start training.';

const keyboard = (card, left, dir) =>
  Markup.inlineKeyboard([
    Object.keys(LABELS).reverse().map((g) => Markup.button.callback(LABELS[g], `g:${card.id}:${g}:${left}:${dir}`)),
  ]);

function sendCard(telegram, chatId, card, left) {
  const dir = pickDirection();
  return telegram.sendMessage(chatId, buildPrompt(card, dir), { parse_mode: 'MarkdownV2', ...keyboard(card, left, dir) });
}

// Starts a session of up to 5 cards. Returns false when there is nothing to review.
async function startSession(telegram, chatId, data) {
  const cards = nextCards(data);
  if (cards.length === 0) return false;
  await sendCard(telegram, chatId, cards[0], cards.length);
  return true;
}

function createBot({ token, store, allowedIds }) {
  const bot = new Telegraf(token);

  // Only the owner may use the bot (no accounts, no per-user isolation needed).
  bot.use((ctx, next) => (allowedIds.includes(String(ctx.from && ctx.from.id)) ? next() : undefined));

  bot.start((ctx) => ctx.reply(WELCOME, mainMenu));

  const review = async (ctx) => {
    const data = await store.load(ctx.from.id);
    if (!(await startSession(ctx.telegram, ctx.chat.id, data))) await ctx.reply('Nothing to review right now.', mainMenu);
  };
  bot.command('review', review);
  bot.hears(REVIEW_BUTTON, review);

  bot.action(/^g:(\d+):(\w+):(\d+)(?::(de|en))?$/, async (ctx) => {
    const [, idStr, grade, leftStr, dir] = ctx.match;
    // Buttons sent before the direction was added carry no direction: treat them as full-weight EN->DE.
    const left = Number(leftStr);
    const data = await store.load(ctx.from.id);
    const card = gradeCard(data, Number(idStr), grade, dir || 'en');
    if (!card) return ctx.answerCbQuery('Not active');
    await store.save(ctx.from.id, data);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([[Markup.button.callback(`✓ ${LABELS[grade]}`, 'noop')]]).reply_markup);
    const next = left > 1 ? nextCards(data, 1)[0] : null;
    if (next) await sendCard(ctx.telegram, ctx.chat.id, next, left - 1);
    else await ctx.reply('Session complete ✅', mainMenu);
  });

  bot.action('noop', (ctx) => ctx.answerCbQuery());

  bot.on('text', async (ctx) => {
    const data = await store.load(ctx.from.id);
    const r = importText(data, ctx.message.text);
    if (r.found === 0) return ctx.reply(WELCOME, mainMenu);
    await store.save(ctx.from.id, data);
    return ctx.reply(`Imported ${r.inserted} new cards, updated ${r.updated} cards, skipped ${r.skipped} lines.`, mainMenu);
  });

  // Without a reply a failed save looks like "the bot is silent" and the user thinks the words were stored.
  bot.catch(async (err, ctx) => {
    console.error(`Unhandled error for update ${ctx.update.update_id}:`, err);
    await ctx.reply('Something went wrong, please send it again.').catch(() => {});
  });
  return bot;
}

module.exports = { createBot, startSession, REVIEW_BUTTON };
