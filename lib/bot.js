const { Telegraf, Markup } = require('telegraf');
const { buildPrompt } = require('./prompt');
const { importText, gradeCard, nextCards, SESSION_SIZE } = require('./words');

const LABELS = { again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy' };

const WELCOME =
  'Add words by sending me a message, one card per line:\n' +
  'German word, English translation, example sentence (optional)\n\n' +
  'Existing words get updated.\n\n' +
  'During /review, rate how easy it was to recall each word:\n' +
  '- Again: could not recall it\n- Hard: recalled with effort\n- Good: recalled correctly\n- Easy: instant recall\n\n' +
  'I will bring harder cards back sooner and easy ones later.\n\n' +
  'Reminders: 3 sessions a day (morning, afternoon, evening), 5 words each.\n\n' +
  'Use /review to start training.';

const keyboard = (card, left) =>
  Markup.inlineKeyboard([
    Object.keys(LABELS).map((g) => Markup.button.callback(LABELS[g], `g:${card.id}:${g}:${left}`)),
  ]);

function sendCard(telegram, chatId, card, left) {
  return telegram.sendMessage(chatId, buildPrompt(card), { parse_mode: 'MarkdownV2', ...keyboard(card, left) });
}

// Starts a session of up to SESSION_SIZE cards. Returns false when there is nothing to review.
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

  bot.start((ctx) => ctx.reply(WELCOME));

  bot.command('review', async (ctx) => {
    const data = await store.load(ctx.from.id);
    if (!(await startSession(ctx.telegram, ctx.chat.id, data))) await ctx.reply('Nothing to review right now.');
  });

  bot.action(/^g:(\d+):(\w+):(\d+)$/, async (ctx) => {
    const [, idStr, grade, leftStr] = ctx.match;
    const left = Number(leftStr);
    const data = await store.load(ctx.from.id);
    const card = gradeCard(data, Number(idStr), grade);
    if (!card) return ctx.answerCbQuery('Not active');
    await store.save(ctx.from.id, data);
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup(Markup.inlineKeyboard([[Markup.button.callback(`✓ ${LABELS[grade]}`, 'noop')]]).reply_markup);
    const next = left > 1 ? nextCards(data, 1)[0] : null;
    if (next) await sendCard(ctx.telegram, ctx.chat.id, next, left - 1);
    else await ctx.reply('Session complete ✅');
  });

  bot.action('noop', (ctx) => ctx.answerCbQuery());

  bot.on('text', async (ctx) => {
    const data = await store.load(ctx.from.id);
    const r = importText(data, ctx.message.text);
    if (r.found === 0) return ctx.reply(WELCOME);
    await store.save(ctx.from.id, data);
    return ctx.reply(`Imported ${r.inserted} new cards, updated ${r.updated} cards, skipped ${r.skipped} lines.`);
  });

  bot.catch((err, ctx) => console.error(`Unhandled error for update ${ctx.update.update_id}:`, err));
  return bot;
}

module.exports = { createBot, startSession, SESSION_SIZE };
