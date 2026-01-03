// internal/app/app.go
package app

import (
	"context"
	"encoding/json"
	"fmt"
	"profen/internal/app/service"
	"profen/internal/data"
	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx               context.Context
	client            *ent.Client
	reviewCoordinator *service.ReviewCoordinator
	learningService   *service.LearningStepsService
	fsrsService       *service.FSRSService
	snapshotService   *service.SnapshotService
	nodeRepo          *data.NodeRepository
	suggestionRepo    *data.SuggestionRepository
	attemptRepo       *data.AttemptRepository
	statsRepo         *data.StatsRepository
	isFullscreen      bool // Track fullscreen state
}

// NewApp creates a new App application struct
func NewApp(client *ent.Client) *App {
	// Initialize configurations
	learningConfig := service.DefaultLearningConfig()
	fsrsConfig := service.DefaultFSRSConfig()

	// Initialize services
	learningService := service.NewLearningStepsService(client, learningConfig)
	fsrsService := service.NewFSRSService(client, fsrsConfig)
	coordinator := service.NewReviewCoordinator(learningService, fsrsService, client)

	return &App{
		client:            client,
		reviewCoordinator: coordinator,
		learningService:   learningService,
		fsrsService:       fsrsService,
		snapshotService:   service.NewSnapshotService(client),
		nodeRepo:          data.NewNodeRepository(client),
		suggestionRepo:    data.NewSuggestionRepository(client),
		attemptRepo:       data.NewAttemptRepository(client),
		statsRepo:         data.NewStatsRepository(client),
	}
}

// startup is called when the app starts.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// -- Fullscreen methods
// ToggleFullscreen toggles fullscreen mode
func (a *App) ToggleFullscreen() {
	if a.isFullscreen {
		runtime.WindowUnfullscreen(a.ctx)
		a.isFullscreen = false
	} else {
		runtime.WindowFullscreen(a.ctx)
		a.isFullscreen = true
	}
}

// IsFullscreen returns current fullscreen state
func (a *App) IsFullscreen() bool {
	return a.isFullscreen
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

// ReviewCard processes a user answer using the coordinator
func (a *App) ReviewCard(nodeIDStr string, grade int, durationMs int, userAnswer string) error {
	nodeID, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return fmt.Errorf("invalid node UUID: %w", err)
	}

	if grade < 1 || grade > 4 {
		return fmt.Errorf("grade must be between 1 and 4")
	}

	// Parse userAnswer as JSON to extract metadata
	var attemptData map[string]interface{}
	if err := json.Unmarshal([]byte(userAnswer), &attemptData); err != nil {
		// If not JSON, treat as plain text
		attemptData = map[string]interface{}{
			"text": userAnswer,
		}
	}

	// Process review through coordinator
	_, err = a.reviewCoordinator.ProcessReview(a.ctx, nodeID, grade)
	if err != nil {
		return err
	}

	// Create attempt record
	text, _ := attemptData["text"].(string)
	errorLog, _ := attemptData["errorLog"].(string)
	difficultyRating, _ := attemptData["userDifficultyRating"].(float64)

	// Get the card to record attempt
	card, err := a.reviewCoordinator.GetCard(a.ctx, nodeID)
	if err != nil {
		return err
	}

	// Record the attempt
	return a.attemptRepo.CreateAttempt(
		a.ctx,
		card.ID,
		grade,
		int64(durationMs),
		text,
		errorLog,
		int(difficultyRating),
		attemptData,
	)
}

// GetSchedulingInfo returns the intervals for all 4 grade buttons
func (a *App) GetSchedulingInfo(nodeIDStr string) (map[int]string, error) {
	nodeID, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid node UUID: %w", err)
	}

	return a.reviewCoordinator.GetSchedulingInfo(a.ctx, nodeID)
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

// Helper function for parsing relationship types
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

// SearchNodes finds nodes by title or body
func (a *App) SearchNodes(query string) ([]*ent.Node, error) {
	return a.nodeRepo.SearchNodes(a.ctx, query)
}

// GetAttemptHistory retrieves attempts for a node
func (a *App) GetAttemptHistory(nodeIDStr string) ([]*ent.Attempt, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid node UUID: %w", err)
	}
	return a.attemptRepo.GetAttemptsByNode(a.ctx, id)
}

// GetDashboardStats returns dashboard statistics
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

// GetNodeMastery returns mastery statistics for a node
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

// DeleteNode deletes a node and its children
func (a *App) DeleteNode(nodeIDStr string) error {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return fmt.Errorf("invalid node UUID: %w", err)
	}
	return a.nodeRepo.DeleteNode(a.ctx, id)
}

// GetNodeBreadcrumbs returns the path from root to this node
func (a *App) GetNodeBreadcrumbs(nodeIDStr string) ([]*ent.Node, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}
	return a.nodeRepo.GetNodeBreadcrumbs(a.ctx, id)
}

// GetAttemptDetails retrieves a single attempt with parsed metadata
func (a *App) GetAttemptDetails(attemptIDStr string) (map[string]interface{}, error) {
	id, err := uuid.Parse(attemptIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid attempt UUID: %w", err)
	}

	attempt, err := a.attemptRepo.GetAttempt(a.ctx, id)
	if err != nil {
		return nil, err
	}

	// Build response with structured data
	result := map[string]interface{}{
		"id":          attempt.ID.String(),
		"rating":      attempt.Rating,
		"duration_ms": attempt.DurationMs,
		"is_correct":  attempt.IsCorrect,
		"created_at":  attempt.CreatedAt,
		"state":       attempt.State,
		"stability":   attempt.Stability,
		"difficulty":  attempt.Difficulty,
	}

	// Add metadata if exists
	if attempt.Metadata != nil {
		result["error_log"] = attempt.Metadata["errorLog"]
		result["difficulty_rating"] = attempt.Metadata["userDifficultyRating"]
		result["submitted_at"] = attempt.Metadata["submittedAt"]
	}

	// Add user answer
	if attempt.UserAnswer != "" {
		result["user_answer"] = attempt.UserAnswer
	}

	return result, nil
}

// DuplicateNode creates a copy of an existing node
func (a *App) DuplicateNode(nodeIDStr string) (*ent.Node, error) {
	id, err := uuid.Parse(nodeIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid UUID: %w", err)
	}

	original, err := a.nodeRepo.GetNode(a.ctx, id)
	if err != nil {
		return nil, err
	}

	// Create copy with " (Copy)" suffix
	newTitle := original.Title + " (Copy)"

	var parentID uuid.UUID
	if original.ParentID != nil {
		parentID = *original.ParentID
	}

	return a.nodeRepo.CreateNode(
		a.ctx,
		original.Type,
		parentID,
		newTitle,
		original.Body,
		original.Metadata,
	)
}
