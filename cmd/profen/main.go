package main

import (
	// Import your root package (the module name in go.mod)

	"profen"
	"profen/internal/app"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func main() {
	// Create an instance of the app structure
	napp := app.NewApp()

	// Create application with options
	err := wails.Run(&options.App{
		Title:  "myproject",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: profen.Assets,
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        napp.Startup,
		Bind: []interface{}{
			napp,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
