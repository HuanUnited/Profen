package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"profen/internal/data"
	"profen/internal/data/ent"
	"profen/internal/data/ent/migrate"
	"profen/internal/data/hooks"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "github.com/jackc/pgx/v5/stdlib"
)

// Client wraps the Ent client and raw database connection.
type Client struct {
	Ent *ent.Client
	DB  *sql.DB
}

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

func NewClient(cfg Config) (*Client, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s dbname=%s password=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.DBName, cfg.Password, cfg.SSLMode)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open pgx connection: %w", err)
	}

	// Pool Settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	drv := entsql.OpenDB(dialect.Postgres, db)
	entClient := ent.NewClient(ent.Driver(drv))

	// Register Hooks
	entClient.Node.Use(hooks.NodeClosureHook(entClient))
	entClient.Node.Use(hooks.FsrsCardInitHook(entClient))

	// Auto-Migration
	if err := entClient.Schema.Create(
		context.Background(),
		migrate.WithDropIndex(true),
		migrate.WithDropColumn(true),
		migrate.WithForeignKeys(true),
	); err != nil {
		return nil, fmt.Errorf("failed to run schema migration: %w", err)
	}

	// Run Seeder
	// We check/insert default error definitions on startup
	if err := data.SeedErrorDefinitions(context.Background(), entClient); err != nil {
		log.Printf("Warning: Failed to seed error definitions: %v", err)
	}

	log.Println("✅ Database connected, migrated, and seeded.")

	return &Client{
		Ent: entClient,
		DB:  db,
	}, nil
}

func (c *Client) Close() error {
	return c.Ent.Close()
}
