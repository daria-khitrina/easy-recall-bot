const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const url = pathToFileURL(path.join(__dirname, '../netlify/functions/bot.mjs')).href;
const post = (headers = {}) => new Request('http://x', { method: 'POST', headers, body: '{}' });

test('webhook refuses to load without a secret (fail closed)', async () => {
  process.env.TELEGRAM_BOT_TOKEN = '1:test';
  delete process.env.TELEGRAM_WEBHOOK_SECRET;
  await assert.rejects(import(`${url}?nosecret`), /TELEGRAM_WEBHOOK_SECRET is not set/);
});

test('webhook rejects a wrong or missing secret header, accepts the right one', async () => {
  process.env.TELEGRAM_BOT_TOKEN = '1:test';
  process.env.TELEGRAM_WEBHOOK_SECRET = 's3cret';
  process.env.ALLOWED_TELEGRAM_IDS = '1';
  const { default: handler } = await import(`${url}?withsecret`);
  assert.strictEqual((await handler(post())).status, 401);
  assert.strictEqual((await handler(post({ 'x-telegram-bot-api-secret-token': 'nope' }))).status, 401);
  assert.strictEqual((await handler(post({ 'x-telegram-bot-api-secret-token': 's3cret' }))).status, 200);
});
