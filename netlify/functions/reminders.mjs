// Imported directly so Netlify's file tracer ships @netlify/blobs (store.js only requires it lazily).
import '@netlify/blobs';
import { Telegram } from 'telegraf';
import { runReminders } from '../../lib/reminders.js';
import { blobStore } from '../../lib/store.js';

// Runs hourly; runReminders only acts at 8:00, 13:00 and 20:00 Berlin time.
export default async () => {
  const userIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const result = await runReminders({
    telegram: new Telegram(process.env.TELEGRAM_BOT_TOKEN),
    store: blobStore(),
    userIds,
  });
  console.log('reminders:', JSON.stringify(result));
};

export const config = { schedule: '0 * * * *' };
