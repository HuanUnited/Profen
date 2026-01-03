package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"

	"profen/internal/app"
	"profen/internal/data/postgres"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	// 1. DB Setup
	cfg := postgres.Config{
		Host:     "localhost",
		Port:     5173,
		User:     "postgres",
		Password: "054625565", // Consider env vars for prod
		DBName:   "profen_test",
		SSLMode:  "disable",
	}

	dbClient, err := postgres.NewClient(cfg)
	if err != nil {
		log.Fatalf("Fatal DB Error: %v", err)
	}
	defer dbClient.Close()

	// 2. Initialize App Logic
	myApp := app.NewApp(dbClient.Ent)

	// 3. Run Wails
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

		// Start in fullscreen mode
		WindowStartState: options.Fullscreen,

		// Mac-specific: Enable native fullscreen controls
		Mac: &mac.Options{
			TitleBar: mac.TitleBarHiddenInset(),
			// This enables Cmd+Ctrl+F on macOS
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
