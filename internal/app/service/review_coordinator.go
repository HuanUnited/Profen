// internal/app/service/review_coordinator.go
package service

import (
	"context"

	"profen/internal/data/ent"
	"profen/internal/data/ent/fsrscard"

	"github.com/google/uuid"
)

// ReviewCoordinator orchestrates learning steps and FSRS
type ReviewCoordinator struct {
	learningService *LearningStepsService
	fsrsService     *FSRSService
	client          *ent.Client
}

// NewReviewCoordinator creates a coordinator
func NewReviewCoordinator(
	learningService *LearningStepsService,
	fsrsService *FSRSService,
	client *ent.Client,
) *ReviewCoordinator {
	return &ReviewCoordinator{
		learningService: learningService,
		fsrsService:     fsrsService,
		client:          client,
	}
}

// ReviewResult combines both service results
type ReviewResult struct {
	NextReviewDisplay string    `json:"next_review_display"`
	CardState         CardState `json:"card_state"`
	Graduated         bool      `json:"graduated"`
}

// ProcessReview handles a card review using appropriate service
func (rc *ReviewCoordinator) ProcessReview(
	ctx context.Context,
	nodeID uuid.UUID,
	grade int,
) (*ReviewResult, error) {

	// Get or create card
	card, err := rc.getOrCreateCard(ctx, nodeID)
	if err != nil {
		return nil, err
	}

	// Determine which service to use
	if rc.learningService.ShouldUseLearningSteps(card) {
		return rc.processWithLearningSteps(ctx, card, grade)
	}

	return rc.processWithFSRS(ctx, card, FSRSGrade(grade))
}

func (rc *ReviewCoordinator) processWithLearningSteps(
	ctx context.Context,
	card *ent.FsrsCard,
	grade int,
) (*ReviewResult, error) {

	stepResult, err := rc.learningService.ProcessReview(ctx, card, grade)
	if err != nil {
		return nil, err
	}

	// If graduated, initialize FSRS
	if stepResult.ShouldGraduate {
		fsrsResult, err := rc.fsrsService.GraduateCard(
			ctx,
			card,
			FSRSGrade(grade),
			rc.learningService.config.GraduatingInterval,
		)
		if err != nil {
			return nil, err
		}

		return &ReviewResult{
			NextReviewDisplay: fsrsResult.IntervalDisplay,
			CardState:         StateReview,
			Graduated:         true,
		}, nil
	}

	return &ReviewResult{
		NextReviewDisplay: stepResult.IntervalDisplay,
		CardState:         stepResult.NextState,
		Graduated:         false,
	}, nil
}

func (rc *ReviewCoordinator) processWithFSRS(
	ctx context.Context,
	card *ent.FsrsCard,
	grade FSRSGrade,
) (*ReviewResult, error) {

	fsrsResult, err := rc.fsrsService.ReviewCard(ctx, card, grade)
	if err != nil {
		return nil, err
	}

	return &ReviewResult{
		NextReviewDisplay: fsrsResult.IntervalDisplay,
		CardState:         StateReview,
		Graduated:         false,
	}, nil
}

// GetSchedulingInfo returns intervals for all 4 buttons
func (rc *ReviewCoordinator) GetSchedulingInfo(
	ctx context.Context,
	nodeID uuid.UUID,
) (map[int]string, error) {

	card, err := rc.getOrCreateCard(ctx, nodeID)
	if err != nil {
		return nil, err
	}

	if rc.learningService.ShouldUseLearningSteps(card) {
		return rc.learningService.GetNextIntervals(card), nil
	}

	return rc.fsrsService.GetNextIntervals(card), nil
}

func (rc *ReviewCoordinator) getOrCreateCard(
	ctx context.Context,
	nodeID uuid.UUID,
) (*ent.FsrsCard, error) {
	// Try to find existing card
	card, err := rc.client.FsrsCard.Query().
		Where(fsrscard.NodeID(nodeID)).
		Only(ctx)

	if err == nil {
		return card, nil
	}

	if !ent.IsNotFound(err) {
		return nil, err
	}

	// Create new card
	return rc.client.FsrsCard.Create().
		SetNodeID(nodeID).
		SetCardState(string(StateNew)).
		SetStability(0.0).
		SetDifficulty(5.0).
		SetElapsedDays(0).
		SetScheduledDays(0).
		SetReps(0).
		SetLapses(0).
		SetCurrentStep(0).
		Save(ctx)
}

// GetCard retrieves a card (for attempt recording)
func (rc *ReviewCoordinator) GetCard(
	ctx context.Context,
	nodeID uuid.UUID,
) (*ent.FsrsCard, error) {
	return rc.getOrCreateCard(ctx, nodeID)
}
