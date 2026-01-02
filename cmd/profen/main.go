package main

import (
	"log"
	"profen/internal/data/postgres"
)

func main() {
	cfg := postgres.Config{
		Host:     "localhost",
		Port:     5173,
		User:     "postgres",
		Password: "054625565",
		DBName:   "profen",
		SSLMode:  "disable",
	}

	// Initialize DB
	dbClient, err := postgres.NewClient(cfg)
	if err != nil {
		log.Fatalf("Fatal DB Error: %v", err)
	}
	defer dbClient.Close()

	// Pass dbClient.Ent to your Repositories/Services
	// nodeRepo := data.NewNodeRepository(dbClient.Ent)
}
