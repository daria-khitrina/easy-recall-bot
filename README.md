# Easy Recall Bot (German → English)

A small Telegram bot for learning German words with spaced repetition. Forked from [smith3v/easy-recall-bot](https://github.com/smith3v/easy-recall-bot) and cut down to the essentials.

## What it does

- **Add words** by sending the bot a message, one card per line:

  ```
  erledigen, to complete, Ich muss heute noch viele Aufgaben erledigen, bevor ich in den Urlaub fahre.
  üben, to practise, Wenn du jeden Tag übst, sprichst du bald besser Deutsch.
  ```

  Format: `German word, English translation, example sentence` (the example is optional and may contain commas). Sending a word that already exists updates it.
- **`/review`** – spaced-repetition session. Each card is shown in a random direction:
  - `erledigen → ||to complete||` with the example visible
  - `to complete → ||erledigen||` with the example hidden

  Rate each card Again / Hard / Good / Easy; harder cards come back sooner.
- **Reminders** – 3 times a day (morning, afternoon, evening) the bot sends 5 cards.
- `/start` – short instructions.

Removed from upstream: quiz game, settings, stats, feedback, onboarding wizard, CSV import/export, multi-language support.

## Run locally

Requires Go 1.26+, PostgreSQL and a bot token from [@BotFather](https://t.me/BotFather).

```bash
createdb recall
cp config.example.json config.json   # set telegram.token and database.*
go run ./cmd/tg-word-reminder
```

`config.json` is git-ignored; never commit your token. The bot must stay running to answer and send reminders (Docker: `docker compose up --build`, see `compose.yml`; note it pulls the upstream image unless you build from this repo).

## Development

```bash
go test ./...
go fmt ./... && go vet ./...
```

## Layout

- `cmd/tg-word-reminder` – entrypoint
- `pkg/bot/handlers` – Telegram handlers (`/start`, `/review`, text import)
- `pkg/bot/importexport` – parsing and saving pasted cards
- `pkg/bot/training` – spaced-repetition logic
- `pkg/bot/reminders` – scheduled reminders
- `pkg/db`, `pkg/config`, `pkg/logger` – storage, config, logging
- `docs/` – upstream design notes for spaced repetition, sessions and logging

## License

MIT, see `LICENSE`.
