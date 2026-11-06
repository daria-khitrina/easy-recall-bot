package handlers

import (
	"context"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/smith3v/tg-word-reminder/pkg/bot/importexport"
	"github.com/smith3v/tg-word-reminder/pkg/logger"
)

func DefaultHandler(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update == nil || update.Message == nil {
		logger.Error("received invalid update in defaultHandler")
		return
	}

	// Check if Chat is zero value
	if update.Message.Chat.ID == 0 {
		logger.Error("chat ID is zero in defaultHandler")
		return
	}

	if update.Message.Text != "" && importexport.HandleTextImport(ctx, b, update) {
		return
	}
	_, err := b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text: "Add words by sending lines like:\nGerman word, English translation, example sentence (optional)\n\n" +
			"Then use /review to practise.",
	})
	if err != nil {
		logger.Error("failed to send message in defaultHandler", "error", err)
	}
}
