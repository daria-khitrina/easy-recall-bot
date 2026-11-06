package handlers

import (
	"context"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/smith3v/tg-word-reminder/pkg/bot/onboarding"
	"github.com/smith3v/tg-word-reminder/pkg/logger"
)

func HandleStart(ctx context.Context, b *bot.Bot, update *models.Update) {
	if update == nil || update.Message == nil || update.Message.From == nil || update.Message.Chat.ID == 0 {
		logger.Error("invalid update in HandleStart")
		return
	}

	if err := onboarding.EnsureDefaultSettings(update.Message.From.ID); err != nil {
		logger.Error("failed to ensure default settings", "user_id", update.Message.From.ID, "error", err)
		b.SendMessage(ctx, &bot.SendMessageParams{ChatID: update.Message.Chat.ID, Text: "Failed to start. Please try again later."})
		return
	}
	b.SendMessage(ctx, &bot.SendMessageParams{
		ChatID: update.Message.Chat.ID,
		Text: "Add words by sending me a message, one card per line:\nGerman word, English translation, example sentence (optional)\n\nExisting words get updated.\n\n" +
			"During /review, rate how easy it was to recall each word:\n- Again: could not recall it\n- Hard: recalled with effort\n- Good: recalled correctly\n- Easy: instant recall\n\n" +
			"I will bring harder cards back sooner and easy ones later.\n\n" +
			"Default settings enabled:\n- 3 sessions: morning, afternoon, evening\n- 5 words per session\n\n" +
			"Use /review to start training.",
	})
}
