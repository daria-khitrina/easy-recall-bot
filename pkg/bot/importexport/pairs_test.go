package importexport

import (
	"testing"

	dbpkg "github.com/smith3v/tg-word-reminder/pkg/db"
	"github.com/smith3v/tg-word-reminder/pkg/internal/testutil"
)

func TestUpsertWordPairs(t *testing.T) {
	testutil.SetupTestDB(t)

	if err := dbpkg.DB.Create(&dbpkg.WordPair{
		UserID: 111,
		Word1:  "hola",
		Word2:  "adios",
	}).Error; err != nil {
		t.Fatalf("failed to seed word pair: %v", err)
	}

	inserted, updated, err := UpsertWordPairs(111, []wordPairInput{
		{Word1: "hola", Word2: "bonjour"},
		{Word1: "ciao", Word2: "hello"},
	})
	if err != nil {
		t.Fatalf("unexpected upsert error: %v", err)
	}
	if inserted != 1 || updated != 1 {
		t.Fatalf("expected 1 insert and 1 update, got %d inserts and %d updates", inserted, updated)
	}

	var pairs []dbpkg.WordPair
	if err := dbpkg.DB.Where("user_id = ?", 111).Order("word1 ASC").Find(&pairs).Error; err != nil {
		t.Fatalf("failed to load pairs: %v", err)
	}
	if len(pairs) != 2 {
		t.Fatalf("expected 2 pairs, got %d", len(pairs))
	}
	if pairs[0].Word1 != "ciao" || pairs[0].Word2 != "hello" {
		t.Fatalf("unexpected pair[0]: %+v", pairs[0])
	}
	if pairs[1].Word1 != "hola" || pairs[1].Word2 != "bonjour" {
		t.Fatalf("unexpected pair[1]: %+v", pairs[1])
	}
	if pairs[0].SrsState != "new" {
		t.Fatalf("expected new pair to have SRS state, got %+v", pairs[0])
	}
	if pairs[0].SrsIntervalDays != 0 || pairs[0].SrsStep != 0 {
		t.Fatalf("expected default SRS interval/step, got %+v", pairs[0])
	}
	if pairs[0].SrsEase != 2.5 {
		t.Fatalf("expected default SRS ease 2.5, got %+v", pairs[0])
	}
	if pairs[0].SrsDueAt.IsZero() {
		t.Fatalf("expected default SRS due date set, got %+v", pairs[0])
	}
	if pairs[0].SrsNewRank == 0 {
		t.Fatalf("expected new pair to have SRS new rank set, got %+v", pairs[0])
	}
}

func TestParseTextPairsKeepsCommasInExample(t *testing.T) {
	text := "erledigen, to complete, Ich muss viele Aufgaben erledigen, bevor ich fahre.\n\nüben, to practise\nbad line\n"
	pairs, skipped := ParseTextPairs(text)
	if len(pairs) != 2 || skipped != 1 {
		t.Fatalf("got %d pairs, %d skipped", len(pairs), skipped)
	}
	if pairs[0].Word1 != "erledigen" || pairs[0].Word2 != "to complete" || pairs[0].Example != "Ich muss viele Aufgaben erledigen, bevor ich fahre." {
		t.Fatalf("unexpected first pair %+v", pairs[0])
	}
	if pairs[1].Example != "" {
		t.Fatalf("expected empty example, got %+v", pairs[1])
	}
}
