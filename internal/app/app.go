package app

import (
	"context"
	"fmt"

	"profen/internal/app/service" // Ensure this import exists
	"profen/internal/data"
	"profen/internal/data/ent"

	"github.com/google/uuid"
)

// App struct
type App struct {
	ctx             context.Context
	client          *ent.Client
	fsrsService     *service.FSRSService
	snapshotService *service.SnapshotService
	nodeRepo        *data.NodeRepository
	suggestionRepo  *data.SuggestionRepository
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

// startup is called when the app starts.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// --- NODE EXPLORER METHODS (For Library) ---

// GetSubjects returns all root nodes (Subjects)
func (a *App) GetSubjects() ([]*ent.Node, error) {
	return a.nodeRepo.GetSubjects(a.ctx)
}

// GetChildren returns direct children of a parent (Lazy Load)
func (a *App) GetChildren(parentIDStr string) ([]*ent.Node, error) {
	id, err := uuid.Parse(parentIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}
	return a.nodeRepo.GetChildren(a.ctx, id)
}

// GetNode returns a single node's details
func (a *App) GetNode(idStr string) (*ent.Node, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}
	return a.nodeRepo.GetNode(a.ctx, id)
}

// --- STUDY SESSION METHODS ---

// GetDueCards returns cards ready for review
func (a *App) GetDueCards(limit int) ([]*ent.Node, error) {
	return a.suggestionRepo.GetDueCards(a.ctx, limit)
}

// ReviewCard processes a user answer
func (a *App) ReviewCard(cardIDStr string, grade int, durationMs int, userAnswer string) (*ent.FsrsCard, error) {
	// 1. Parse ID
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid card UUID: %w", err)
	}

	// 2. Validate Grade (1-4)
	if grade < 1 || grade > 4 {
		return nil, fmt.Errorf("grade must be between 1 and 4")
	}

	// 3. Call Service
	// Note: We pass 'nil' for errorDefID for now, because the basic flow doesn't prompt for specific errors yet.
	// In Phase 5.3 (Study Session), if the user selects "Again", we might call a separate API to log the error,
	// OR we update this method to accept an optional error ID.
	return a.fsrsService.ReviewCard(
		a.ctx,
		cardID,
		service.FSRSGrade(grade),
		int64(durationMs),
		userAnswer, // <--- Passed Correctly
		nil,        // <--- errorDefID (Optional, currently nil)
	)
}

func (a *App) UpdateNode(idStr string, body string) (*ent.Node, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, err
	}
	// Pass empty metadata for now, or fetch existing and merge?
	// For MVP, just updating body is fine.
	return a.nodeRepo.UpdateNode(a.ctx, id, body, map[string]interface{}{})
}

func (a *App) CreateNode(typeStr string, parentIDStr string, body string) (*ent.Node, error) {
	// Convert strings to types...
	// Implementation needed here to map string "topic" -> node.TypeTopic
	// ...
	return nil, fmt.Errorf("impl pending")
}
