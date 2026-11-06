const { connectLambda } = require('@netlify/blobs');
const { createBot } = require('../../lib/bot');
const { blobStore } = require('../../lib/store');

const allowedIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = createBot({ token, store: blobStore(), allowedIds });

exports.handler = async (event) => {
  // Classic (Lambda-style) functions must hand their event to Blobs so it can find the site and token.
  connectLambda(event);
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && event.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return { statusCode: 401, body: '' };
  }
  try {
    await bot.handleUpdate(JSON.parse(event.body));
  } catch (err) {
    console.error('Webhook update failed:', err);
  }
  // Always 200 so Telegram does not retry a poisoned update forever.
  return { statusCode: 200, body: '' };
};
