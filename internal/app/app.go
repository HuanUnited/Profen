package app

import (
	"context"
	"fmt"

	"profen/internal/app/service"
	"profen/internal/data"
	"profen/internal/data/ent"
)

// App struct
type App struct {
	ctx    context.Context
	client *ent.Client

	// Services (Logic)
	fsrsService     *service.FSRSService
	snapshotService *service.SnapshotService

	// Repositories (Data Access)
	nodeRepo       *data.NodeRepository
	suggestionRepo *data.SuggestionRepository
}

// NewApp creates a new App application struct
func NewApp(client *ent.Client) *App {
	return &App{
		client:          client,
		fsrsService:     service.NewFSRSService(client),
		snapshotService: service.NewSnapshotService(client),
		nodeRepo:        data.NewNodeRepository(client),
		suggestionRepo:  data.NewSuggestionRepository(client),
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// --- EXPOSED METHODS (Callable from JS) ---

// Greet returns a greeting for the given name (Example)
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// GetDueCards returns cards ready for review
func (a *App) GetDueCards(limit int) ([]*ent.Node, error) {
	// Note: Ent structs are JSON-serializable by default, but circular refs
	// (edges) might need handling. Wails handles basic JSON.
	return a.suggestionRepo.GetDueCards(a.ctx, limit)
}

// ReviewCard processes a user answer
func (a *App) ReviewCard(cardIDStr string, grade int, durationMs int) (*ent.FsrsCard, error) {
	// Frontend sends ID as string, Grade as int
	// Convert logic here or in service? Service expects UUID/FSRSGrade
	// Let's keep the conversion layer here in App (Controller).

	// Import uuid and service packages to convert types...
	// For brevity: implementation details depend on strict types.
	return nil, fmt.Errorf("not implemented yet")
}
