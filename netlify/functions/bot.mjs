import { createBot } from '../../lib/bot.js';
import { blobStore } from '../../lib/store.js';

const allowedIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');

const bot = createBot({ token, store: blobStore(), allowedIds });

export default async (req) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return new Response('', { status: 401 });
  }
  try {
    await bot.handleUpdate(await req.json());
  } catch (err) {
    console.error('Webhook update failed:', err);
  }
  // Always 200 so Telegram does not retry a poisoned update forever.
  return new Response('', { status: 200 });
};
