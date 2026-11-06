const { schedule } = require('@netlify/functions');
const { Telegram } = require('telegraf');
const { runReminders } = require('../../lib/reminders');
const { blobStore } = require('../../lib/store');

// Runs hourly; runReminders only acts at 8:00, 13:00 and 20:00 Berlin time.
exports.handler = schedule('0 * * * *', async () => {
  const userIds = (process.env.ALLOWED_TELEGRAM_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const result = await runReminders({
    telegram: new Telegram(process.env.TELEGRAM_BOT_TOKEN),
    store: blobStore(),
    userIds,
  });
  console.log('reminders:', JSON.stringify(result));
  return { statusCode: 200 };
});
