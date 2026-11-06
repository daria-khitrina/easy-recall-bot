// Bulk-load words from a text file ("German, English, example" per line) for one Telegram user.
// Usage: NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... node scripts/seed.js <telegramUserId> words.txt
const fs = require('node:fs');
const { blobStore } = require('../lib/store');
const { importText } = require('../lib/words');

(async () => {
  const [userId, file] = process.argv.slice(2);
  if (!userId || !file) {
    console.error('Usage: node scripts/seed.js <telegramUserId> <file>');
    process.exit(1);
  }
  const store = blobStore();
  const data = await store.load(userId);
  const r = importText(data, fs.readFileSync(file, 'utf8'));
  await store.save(userId, data);
  console.log(`Imported ${r.inserted} new cards, updated ${r.updated}, skipped ${r.skipped}.`);
})().catch((e) => { console.error(e); process.exit(1); });
