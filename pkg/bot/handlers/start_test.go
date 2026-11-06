package handlers

import (
	"context"
	"strings"
	"testing"

	"github.com/smith3v/tg-word-reminder/pkg/db"
	"github.com/smith3v/tg-word-reminder/pkg/internal/testutil"
	"github.com/smith3v/tg-word-reminder/pkg/logger"
)

func TestHandleStartCreatesDefaultSettingsAndAsksForWords(t *testing.T) {
	testutil.SetupTestDB(t)
	logger.SetLogLevel(logger.ERROR)

	client := newMockClient()
	b := newTestTelegramBot(t, client)

	HandleStart(context.Background(), b, newTestUpdate("/start", 202))

	var settings db.UserSettings
	if err := db.DB.Where("user_id = ?", 202).First(&settings).Error; err != nil {
		t.Fatalf("expected default settings: %v", err)
	}
	if got := client.lastMessageText(t); !strings.Contains(got, "German word") {
		t.Fatalf("expected words prompt, got %q", got)
	}
}
