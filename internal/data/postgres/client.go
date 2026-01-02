package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/migrate"
	"profen/internal/data/hooks"

	"entgo.io/ent/dialect"
	entsql "entgo.io/ent/dialect/sql"
	_ "github.com/jackc/pgx/v5/stdlib" // Import pgx driver
)

// Client wraps the Ent client and raw database connection.
type Client struct {
	Ent *ent.Client
	DB  *sql.DB
}

// Config holds database connection parameters.
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// NewClient creates a new database connection, registers hooks, and runs migrations.
func NewClient(cfg Config) (*Client, error) {
	// 1. Build DSN (Data Source Name)
	dsn := fmt.Sprintf("host=%s port=%d user=%s dbname=%s password=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.DBName, cfg.Password, cfg.SSLMode)

	// 2. Open Raw SQL Connection (allows for connection pooling config)
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open pgx connection: %w", err)
	}

	// Configure Pool Settings (Optional but recommended)
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	// Verify Connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// 3. Create Ent Driver
	drv := entsql.OpenDB(dialect.Postgres, db)
	entClient := ent.NewClient(ent.Driver(drv))

	// 4. REGISTER HOOKS (Crucial Step)
	// Block 1: Closure Table Automation
	entClient.Node.Use(hooks.NodeClosureHook(entClient))
	// Block 2: FSRS Card Automation
	entClient.Node.Use(hooks.FsrsCardInitHook(entClient))

	// 5. Auto-Migration (Create Tables)
	// In production, you might want to move this to a separate CLI command.
	// For dev/desktop app, running it on startup is fine.
	if err := entClient.Schema.Create(
		context.Background(),
		migrate.WithDropIndex(true),  // Safely handle index changes
		migrate.WithDropColumn(true), // Safely handle column deletions (dev mode)
	); err != nil {
		return nil, fmt.Errorf("failed to run schema migration: %w", err)
	}

	log.Println("✅ Database connected and migrated successfully.")

	return &Client{
		Ent: entClient,
		DB:  db,
	}, nil
}

// Close gracefully shuts down the client.
func (c *Client) Close() error {
	return c.Ent.Close()
}
