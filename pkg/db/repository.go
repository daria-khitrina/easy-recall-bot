// pkg/db/repository.go
package db

import (
	"strconv"
	"strings"

	"github.com/smith3v/tg-word-reminder/pkg/config"
	"github.com/smith3v/tg-word-reminder/pkg/logger"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Export DB variable
var DB *gorm.DB

// dsnQuote quotes a libpq key/value so empty or spaced values don't swallow the next key.
func dsnQuote(v string) string {
	return "'" + strings.NewReplacer(`\`, `\\`, "'", `\'`).Replace(v) + "'"
}

func InitDB(cfg config.DatabaseConfig) error {
	var err error
	dsn := strings.Join([]string{
		"host=" + dsnQuote(cfg.Host),
		"user=" + dsnQuote(cfg.User),
		"password=" + dsnQuote(cfg.Password),
		"dbname=" + dsnQuote(cfg.DBName),
		"port=" + strconv.Itoa(cfg.Port),
		"sslmode=" + dsnQuote(cfg.SSLMode),
	}, " ")
	gormLogger, gormErr := newGormLogger(config.AppConfig.Logging.GormLevel)
	if gormErr != nil {
		logger.Error("invalid gorm log level", "value", config.AppConfig.Logging.GormLevel, "error", gormErr)
	}
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{Logger: gormLogger})
	if err != nil {
		logger.Error("failed to connect to database", "error", err)
		return err
	}
	if err := DB.AutoMigrate(
		&WordPair{},
		&InitVocabulary{},
		&UserSettings{},
		&OnboardingState{},
		&GameSessionStatistics{},
		&TrainingSession{},
		&GameSession{},
	); err != nil {
		logger.Error("failed to auto-migrate database", "error", err)
		return err
	}
	if err := migrateNewRanks(DB); err != nil {
		logger.Error("failed to migrate new ranks", "error", err)
		return err
	}
	return nil
}

func migrateNewRanks(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	if !db.Migrator().HasColumn(&WordPair{}, "srs_new_rank") {
		return nil
	}

	switch db.Dialector.Name() {
	case "sqlite":
		return db.Exec(`
UPDATE word_pairs
SET srs_new_rank = abs(random()) % 1000000000 + 1
WHERE srs_new_rank = 0
`).Error
	case "postgres":
		return db.Exec(`
UPDATE word_pairs
SET srs_new_rank = floor(random() * 1000000000)::int + 1
WHERE srs_new_rank = 0
`).Error
	default:
		return db.Exec(`
UPDATE word_pairs
SET srs_new_rank = 1
WHERE srs_new_rank = 0
		`).Error
	}
}
