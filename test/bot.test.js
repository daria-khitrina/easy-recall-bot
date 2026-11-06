const test = require('node:test');
const assert = require('node:assert');
const { Telegram } = require('telegraf');
const { createBot } = require('../lib/bot');
const { emptyData } = require('../lib/words');

function setup() {
  const calls = [];
  const db = {};
  const store = { load: async (id) => structuredClone(db[id] || emptyData()), save: async (id, d) => { db[id] = d; } };
  const bot = createBot({ token: '1:test', store, allowedIds: ['42'] });
  bot.botInfo = { id: 1, is_bot: true, first_name: 'b', username: 'b' };
  // Telegraf builds a fresh Telegram client per update, so stub the shared prototype.
  Telegram.prototype.callApi = async function (method, payload) { calls.push({ method, payload }); return { message_id: calls.length }; };
  let uid = 0;
  const from = { id: 42, is_bot: false, first_name: 'u' };
  const chat = { id: 42, type: 'private' };
  const send = (text, extra = {}) => bot.handleUpdate({ update_id: ++uid, message: { message_id: uid, date: 0, chat, from, text, ...extra } });
  const press = (data) => bot.handleUpdate({ update_id: ++uid, callback_query: { id: String(uid), from, chat_instance: 'x', data, message: { message_id: 7, date: 0, chat } } });
  return { calls, send, press, db };
}

const cmd = (name) => ({ entities: [{ type: 'bot_command', offset: 0, length: name.length + 1 }] });

test('import via message, then review a full session', async () => {
  const { calls, send, press } = setup();
  await send('a, A, Satz eins.\nb, B\nc, C');
  assert.match(calls.at(-1).payload.text, /Imported 3 new cards, updated 0 cards, skipped 0 lines/);

  await send('/review', cmd('review'));
  const first = calls.at(-1);
  assert.strictEqual(first.method, 'sendMessage');
  assert.strictEqual(first.payload.parse_mode, 'MarkdownV2');
  const buttons = first.payload.reply_markup.inline_keyboard[0];
  assert.deepStrictEqual(buttons.map((b) => b.text), ['Again', 'Hard', 'Good', 'Easy']);

  await press(buttons[2].callback_data); // Good
  assert.ok(calls.some((c) => c.method === 'editMessageReplyMarkup'));
  const second = calls.at(-1);
  assert.strictEqual(second.method, 'sendMessage');
  assert.match(second.payload.reply_markup.inline_keyboard[0][0].callback_data, /^g:\d+:again:2$/);

  // pressing the same stale button again is rejected
  const before = calls.length;
  await press(buttons[2].callback_data);
  assert.strictEqual(calls[before].method, 'answerCallbackQuery');
  assert.strictEqual(calls[before].payload.text, 'Not active');
});

test('ignores users that are not allowed', async () => {
  const { calls, send } = setup();
  const bot = createBot({ token: '1:test', store: {}, allowedIds: ['1'] });
  bot.botInfo = { id: 1, is_bot: true, first_name: 'b', username: 'b' };
  await bot.handleUpdate({ update_id: 1, message: { message_id: 1, date: 0, chat: { id: 42, type: 'private' }, from: { id: 42, is_bot: false, first_name: 'x' }, text: 'hi' } });
  assert.strictEqual(calls.length, 0);
  void send;
});

test('review with no cards', async () => {
  const { calls, send } = setup();
  await send('/review', cmd('review'));
  assert.strictEqual(calls.at(-1).payload.text, 'Nothing to review right now.');
});

test('the Review 5 cards button starts a session, and replies keep the button visible', async () => {
  const { calls, send } = setup();
  await send('a, A');
  assert.deepStrictEqual(calls.at(-1).payload.reply_markup.keyboard, [['Review 5 cards']]);
  await send('Review 5 cards');
  const card = calls.at(-1);
  assert.strictEqual(card.method, 'sendMessage');
  assert.strictEqual(card.payload.reply_markup.inline_keyboard[0].length, 4);
});
