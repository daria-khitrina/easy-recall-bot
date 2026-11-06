# Easy Recall Bot (German → English)

A small Telegram bot for learning German words with spaced repetition, running on Netlify (webhook + scheduled function, words stored in Netlify Blobs). Forked from [smith3v/easy-recall-bot](https://github.com/smith3v/easy-recall-bot), rewritten from Go to Node.js and cut down to the essentials.

## What it does

- **Add words** by sending the bot a message, one card per line:

  ```
  erledigen, to complete, Ich muss heute noch viele Aufgaben erledigen, bevor ich in den Urlaub fahre.
  üben, to practise, Wenn du jeden Tag übst, sprichst du bald besser Deutsch.
  ```

  Format: `German word, English translation, example sentence` (example optional, may contain commas). Sending a word that already exists updates it.
- **`/review`** – up to 5 cards per session, shown in a random direction:
  - `erledigen → ||to complete||` with the example visible
  - `to complete → ||erledigen||` with the example hidden

  Rate each card Again / Hard / Good / Easy; harder cards come back sooner.
- **Reminders** – at 8:00, 13:00 and 20:00 Berlin time the bot starts a session if cards are due.
- `/start` – short instructions.

Only the Telegram IDs in `ALLOWED_TELEGRAM_IDS` can use the bot.

## Deploy on Netlify

1. Create a bot with [@BotFather](https://t.me/BotFather) and get your Telegram ID (e.g. from [@userinfobot](https://t.me/userinfobot)).
2. Connect this repo as a new Netlify site (functions live in `netlify/functions`, see `netlify.toml`).
3. Add environment variables in Netlify:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET` – any long random string
   - `ALLOWED_TELEGRAM_IDS` – comma-separated Telegram user IDs
4. After the deploy, register the webhook once:

   ```bash
   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... node scripts/set-webhook.js https://<your-site>.netlify.app
   ```

Never commit tokens; `.env` is git-ignored.

### Bulk-loading words

A single Telegram message is limited to 4096 characters. For a big list, put it in a text file (same format) and run:

```bash
NETLIFY_SITE_ID=... NETLIFY_AUTH_TOKEN=... node scripts/seed.js <your-telegram-id> words.txt
```

## Development

```bash
npm install
npm test
```

## Layout

- `netlify/functions/bot.js` – Telegram webhook
- `netlify/functions/reminders.js` – hourly scheduled function (acts at the 3 reminder hours)
- `lib/srs.js` – spaced-repetition scheduling
- `lib/parse.js`, `lib/words.js` – parsing and saving pasted cards
- `lib/prompt.js` – card text with spoilers
- `lib/bot.js`, `lib/reminders.js`, `lib/store.js` – bot wiring, reminders, Blobs storage

## License

MIT, see `LICENSE`.
