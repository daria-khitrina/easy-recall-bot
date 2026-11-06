package training

import (
	"fmt"
	"math/rand"

	"github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/smith3v/tg-word-reminder/pkg/db"
)

const ReviewCallbackPrefix = "t:grade:"

// BuildPrompt picks a direction at random. German→English shows the example
// openly; English→German hides both the German word and its example.
func BuildPrompt(pair db.WordPair) string {
	german := formatPromptSide(pair.Word1, false)
	english := formatPromptSide(pair.Word2, true)
	example := bot.EscapeMarkdown(pair.Example)
	if rand.Intn(2) == 0 {
		out := fmt.Sprintf("%s → ||%s||", german, english)
		if example != "" {
			out += "\n" + example
		}
		return out
	}
	out := fmt.Sprintf("%s → ||%s||", english, german)
	if example != "" {
		out += "\n||" + example + "||"
	}
	return out
}

func BuildKeyboard(token string) *models.InlineKeyboardMarkup {
	return &models.InlineKeyboardMarkup{
		InlineKeyboard: [][]models.InlineKeyboardButton{
			{
				{Text: "Again", CallbackData: fmt.Sprintf("%s%s:again", ReviewCallbackPrefix, token)},
				{Text: "Hard", CallbackData: fmt.Sprintf("%s%s:hard", ReviewCallbackPrefix, token)},
				{Text: "Good", CallbackData: fmt.Sprintf("%s%s:good", ReviewCallbackPrefix, token)},
				{Text: "Easy", CallbackData: fmt.Sprintf("%s%s:easy", ReviewCallbackPrefix, token)},
			},
		},
	}
}

func formatPromptSide(text string, italic bool) string {
	escaped := bot.EscapeMarkdown(text)
	if !italic {
		return escaped
	}
	return fmt.Sprintf("_%s_", escaped)
}
