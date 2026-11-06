// Imported directly so Netlify's file tracer ships telegraf (it only sees dependencies of the entry file).
import 'telegraf';
import '@netlify/blobs';
import { createBot } from '../../lib/bot.js';
import { blobStore } from '../../lib/store.js';

const allowedIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set');
// Fail closed: without the secret anyone could post forged updates as the owner.
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!secret) throw new Error('TELEGRAM_WEBHOOK_SECRET is not set');

const bot = createBot({ token, store: blobStore(), allowedIds });

export default async (req) => {
  if (req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
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
