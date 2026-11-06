package importexport

import (
	"context"
	"fmt"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/smith3v/tg-word-reminder/pkg/logger"
)

// HandleTextImport imports cards typed straight into the chat. It reports
// whether the message was treated as an import (at least one valid line).
func HandleTextImport(ctx context.Context, b *bot.Bot, update *models.Update) bool {
	pairs, skipped := ParseTextPairs(update.Message.Text)
	if len(pairs) == 0 || update.Message.From == nil {
		return false
	}
	inserted, updated, err := UpsertWordPairs(update.Message.From.ID, pairs)
	text := fmt.Sprintf("Imported %d new cards, updated %d cards, skipped %d lines.", inserted, updated, skipped)
	if err != nil {
		logger.Error("failed to import text word pairs", "user_id", update.Message.From.ID, "error", err)
		text = "Failed to import your cards. Please try again later."
	}
	b.SendMessage(ctx, &bot.SendMessageParams{ChatID: update.Message.Chat.ID, Text: text})
	return true
}
