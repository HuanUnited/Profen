package app

import (
	"context"
	"fmt"
	"profen/internal/app/service"
	"profen/internal/data"
	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"

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
	attemptRepo     *data.AttemptRepository
	statsRepo       *data.StatsRepository
}

// NewApp creates a new App application struct
func NewApp(client *ent.Client) *App {
	return &App{
		client:          client,
		fsrsService:     service.NewFSRSService(client),
		snapshotService: service.NewSnapshotService(client),
		nodeRepo:        data.NewNodeRepository(client),
		suggestionRepo:  data.NewSuggestionRepository(client),
		attemptRepo:     data.NewAttemptRepository(client),
		statsRepo:       data.NewStatsRepository(client),
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
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid card UUID: %w", err)
	}

	if grade < 1 || grade > 4 {
		return nil, fmt.Errorf("grade must be between 1 and 4")
	}

	return a.fsrsService.ReviewCard(
		a.ctx,
		cardID,
		service.FSRSGrade(grade),
		int64(durationMs),
		userAnswer,
		nil,
	)
}

// UpdateNode updates the node's title and body.
func (a *App) UpdateNode(idStr string, title string, body string) (*ent.Node, error) {
	id, err := uuid.Parse(idStr)
	if err != nil {
		return nil, err
	}
	// Pass empty metadata for now
	return a.nodeRepo.UpdateNode(a.ctx, id, title, body, map[string]interface{}{})
}

// CreateNode creates a new node with the specified type, parent, and title.
func (a *App) CreateNode(typeStr string, parentIDStr string, title string) (*ent.Node, error) {
	// 1. Map String to Enum
	var nodeType node.Type
	switch typeStr {
	case "subject":
		nodeType = node.TypeSubject
	case "topic":
		nodeType = node.TypeTopic
	case "problem":
		nodeType = node.TypeProblem
	case "theory":
		nodeType = node.TypeTheory
	case "term":
		nodeType = node.TypeTerm
	default:
		return nil, fmt.Errorf("invalid node type: %s", typeStr)
	}

	// 2. Parse Parent ID (Optional)
	var parentID uuid.UUID
	var err error
	if parentIDStr != "" {
		parentID, err = uuid.Parse(parentIDStr)
		if err != nil {
			return nil, fmt.Errorf("invalid parent UUID: %w", err)
		}
	}

	// 3. Call Repo
	// We pass empty string for body initially.
	return a.nodeRepo.CreateNode(a.ctx, nodeType, parentID, title, "", map[string]interface{}{})
}

// CreateAssociation links two nodes
// Helper function (add to app.go or a utils file)
func parseRelType(relTypeStr string) (nodeassociation.RelType, error) {
	switch relTypeStr {
	case "comes_before":
		return nodeassociation.RelTypeComesBefore, nil
	case "comes_after":
		return nodeassociation.RelTypeComesAfter, nil
	case "similar_to":
		return nodeassociation.RelTypeSimilarTo, nil
	case "tests":
		return nodeassociation.RelTypeTests, nil
	case "defines":
		return nodeassociation.RelTypeDefines, nil
	case "translation_of":
		return nodeassociation.RelTypeTranslationOf, nil
	case "translated_from":
		return nodeassociation.RelTypeTranslatedFrom, nil
	case "variant_of":
		return nodeassociation.RelTypeVariantOf, nil
	case "source_variant":
		return nodeassociation.RelTypeSourceVariant, nil
	default:
		return "", fmt.Errorf("invalid relation type: %s", relTypeStr)
	}
}

// Then use it:
func (a *App) CreateAssociation(sourceIDStr, targetIDStr, relTypeStr string) error {
	sourceID, err := uuid.Parse(sourceIDStr)
	if err != nil {
		return fmt.Errorf("invalid source UUID: %w", err)
	}
	targetID, err := uuid.Parse(targetIDStr)
	if err != nil {
		return fmt.Errorf("invalid target UUID: %w", err)
	}

	relType, err := parseRelType(relTypeStr)
	if err != nil {
		return err
	}

	return a.nodeRepo.CreateAssociation(a.ctx, sourceID, targetID, relType)
}

// SearchNodes finds nodes by title or body
func (a *App) SearchNodes(query string) ([]*ent.Node, error) {
	// We need to implement SearchNodes in NodeRepository first
	return a.nodeRepo.SearchNodes(a.ctx, query)
}

// GetAttemptHistory retrieves attempts for a node
func (a *App) GetAttemptHistory(nodeIDStr string) ([]*ent.Attempt, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid node UUID: %w", err)
	}
	// Now a.attemptRepo exists!
	return a.attemptRepo.GetAttemptsByNode(a.ctx, id)
}

// Add method:
func (a *App) GetDashboardStats() (*data.DashboardStats, error) {
	return a.statsRepo.GetDashboardStats(a.ctx)
}

// GetNodeAssociations returns all associations for a node
func (a *App) GetNodeAssociations(nodeIDStr string) ([]*ent.NodeAssociation, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid node UUID: %w", err)
	}
	return a.nodeRepo.GetNodeAssociations(a.ctx, id)
}

// GetRelatedNodes fetches nodes by relationship type
// direction: "source" or "target"
func (a *App) GetRelatedNodes(nodeIDStr, relTypeStr, direction string) ([]*ent.Node, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid node UUID: %w", err)
	}

	relType, err := parseRelType(relTypeStr)
	if err != nil {
		return nil, err
	}

	asSource := direction == "source"
	return a.nodeRepo.GetRelatedNodesByType(a.ctx, id, relType, asSource)
}

// In app.go
func (a *App) GetNodeMastery(nodeIDStr string) (map[string]interface{}, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	masteryService := data.NewMasteryService(a.client)
	correct, total, mastered, err := masteryService.GetNodeMastery(a.ctx, id)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"correct_count":  correct,
		"total_attempts": total,
		"is_mastered":    mastered,
	}, nil
}
