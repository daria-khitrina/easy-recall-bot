// Usage: TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set-webhook.js https://<your-site>.netlify.app
// Stop any other process polling this bot first (e.g. the old Go bot), or Telegram reports a conflict.
const { Telegram } = require('telegraf');

(async () => {
  const [site] = process.argv.slice(2);
  const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret } = process.env;
  if (!site || !token || !secret) {
    console.error('Need site URL argument and TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET env vars.');
    process.exit(1);
  }
  const url = `${site.replace(/\/$/, '')}/.netlify/functions/bot`;
  const tg = new Telegram(token);
  await tg.setWebhook(url, { secret_token: secret, allowed_updates: ['message', 'callback_query'] });
  console.log('Webhook set to', url);
  console.log(JSON.stringify(await tg.getWebhookInfo(), null, 2));
})().catch((e) => { console.error(e); process.exit(1); });
