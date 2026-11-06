package importexport

import (
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/smith3v/tg-word-reminder/pkg/db"
	"gorm.io/gorm"
)

type wordPairInput struct {
	Word1   string
	Word2   string
	Example string
}

var (
	srsNewRankRand = rand.New(rand.NewSource(time.Now().UnixNano()))
	srsNewRankMu   sync.Mutex
)

func randomSrsNewRank() int {
	srsNewRankMu.Lock()
	defer srsNewRankMu.Unlock()
	return srsNewRankRand.Intn(db.SrsNewRankMax) + 1
}

func UpsertWordPairs(userID int64, pairs []wordPairInput) (int, int, error) {
	inserted := 0
	updated := 0

	if len(pairs) == 0 {
		return inserted, updated, nil
	}

	err := db.DB.Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		for _, pair := range pairs {
			result := tx.Model(&db.WordPair{}).
				Where("user_id = ? AND word1 = ?", userID, pair.Word1).
				Updates(map[string]any{"word2": pair.Word2, "example": pair.Example})
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected > 0 {
				updated++
				continue
			}

			newPair := db.WordPair{
				UserID:          userID,
				Word1:           pair.Word1,
				Word2:           pair.Word2,
				Example:         pair.Example,
				SrsState:        "new",
				SrsDueAt:        now,
				SrsIntervalDays: 0,
				SrsEase:         2.5,
				SrsStep:         0,
				SrsNewRank:      randomSrsNewRank(),
			}
			if err := tx.Create(&newPair).Error; err != nil {
				return err
			}
			inserted++
		}
		return nil
	})
	if err != nil {
		return 0, 0, err
	}

	return inserted, updated, nil
}

// ParseTextPairs reads "word, translation, example" lines from a chat message.
// Only the first two commas split, so the example may contain commas.
func ParseTextPairs(text string) ([]wordPairInput, int) {
	var pairs []wordPairInput
	skipped := 0
	for _, line := range strings.Split(text, "\n") {
		if strings.TrimSpace(line) == "" {
			continue
		}
		parts := strings.SplitN(line, ",", 3)
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		if len(parts) < 2 || parts[0] == "" || parts[1] == "" {
			skipped++
			continue
		}
		pair := wordPairInput{Word1: parts[0], Word2: parts[1]}
		if len(parts) == 3 {
			pair.Example = parts[2]
		}
		pairs = append(pairs, pair)
	}
	return pairs, skipped
}
