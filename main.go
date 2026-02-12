package main

import (
	"embed"
	"log"
	"os"
	"path/filepath"
	"strings"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"profen/internal/app"
	"profen/internal/data/ent"
	"profen/internal/data/postgres"
)

//go:embed all:frontend/dist
var assets embed.FS

func isBindingGeneration() bool {
	for _, arg := range os.Args {
		if arg == "-generate" || strings.Contains(arg, "wailsbindings") {
			return true
		}
	}
	return false
}

func main() {
	var dbClient *postgres.Client
	var err error

	if !isBindingGeneration() {
		// 1. Define Data Path
		// Use os.UserConfigDir() to ensure data persists in the correct OS location
		userConfig, _ := os.UserConfigDir()
		dataDir := filepath.Join(userConfig, "Profen", "data")

		// 2. Configure Embedded Postgres
		postgresConfig := embeddedpostgres.DefaultConfig().
			Username("postgres").
			Password("054625565").
			Database("profen_test").
			Version(embeddedpostgres.V14). // Specify your preferred version
			RuntimePath(filepath.Join(userConfig, "Profen", "runtime")).
			DataPath(dataDir).
			Port(5433) // Use a non-standard port to avoid conflicts with local Postgres

		embeddedDB := embeddedpostgres.NewDatabase(postgresConfig)

		if err := embeddedDB.Start(); err != nil {
			log.Fatalf("Failed to start embedded Postgres: %v", err)
		}

		// Ensure the database stops when the Go program exits
		defer func() {
			if err := embeddedDB.Stop(); err != nil {
				log.Printf("Error stopping embedded Postgres: %v", err)
			}
		}()

		// 3. Connect using your existing internal logic
		cfg := postgres.Config{
			Host:     "localhost",
			Port:     5433,
			User:     "postgres",
			Password: "054625565",
			DBName:   "profen_test",
			SSLMode:  "disable",
		}

		dbClient, err = postgres.NewClient(cfg)
		if err != nil {
			log.Fatalf("Fatal DB Error: %v", err)
		}
		defer dbClient.Close()
	}

	// 4. Initialize App Logic
	// Note: Handle nil dbClient if isBindingGeneration is true
	var entClient *ent.Client
	if dbClient != nil {
		entClient = dbClient.Ent
	}
	myApp := app.NewApp(entClient)

	// 5. Run Wails
	err = wails.Run(&options.App{
		Title:  "Profen",
		Width:  1920,
		Height: 1080,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        myApp.Startup,
		Bind: []interface{}{
			myApp,
		},
		WindowStartState: options.Fullscreen,
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
