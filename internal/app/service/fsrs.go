package service

import (
	"context"
	"fmt"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/fsrscard"

	"github.com/google/uuid"
	"github.com/open-spaced-repetition/go-fsrs/v3"
)

// FSRSGrade represents the user's rating of their recall.
type FSRSGrade int

const (
	GradeAgain FSRSGrade = 1
	GradeHard  FSRSGrade = 2
	GradeGood  FSRSGrade = 3
	GradeEasy  FSRSGrade = 4
)

type FSRSService struct {
	client *ent.Client
	params fsrs.Parameters
	fsrs   *fsrs.FSRS
}

func NewFSRSService(client *ent.Client) *FSRSService {
	params := fsrs.DefaultParam()
	return &FSRSService{
		client: client,
		params: params,
		fsrs:   fsrs.NewFSRS(params),
	}
}

// Add to FSRSConfig
type FSRSConfig struct {
	DesiredRetention float64 `json:"desired_retention"`
	MaxInterval      int     `json:"max_interval"`
	LearningSteps    []int   `json:"learning_steps"`   // NEW: minutes (e.g., [10, 30])
	RelearningSteps  []int   `json:"relearning_steps"` // NEW: minutes (e.g., [10])
}

// Default configuration
func DefaultFSRSConfig() FSRSConfig {
	return FSRSConfig{
		DesiredRetention: 0.9,
		MaxInterval:      36500,         // 100 years
		LearningSteps:    []int{10, 30}, // 10m, 30m
		RelearningSteps:  []int{10},     // 10m
	}
}

type CardState int

const (
	StateNew CardState = iota
	StateLearning
	StateReview
	StateRelearning
)

// Add to FSRSCard tracking
type ReviewResult struct {
	Card         *ent.FsrsCard
	NextInterval time.Duration // For review cards
	NextState    CardState
	CurrentStep  int // For learning/relearning cards
}

// Add this method to FSRSService:
func (s *FSRSService) GetOrCreateCard(ctx context.Context, nodeID uuid.UUID) (*ent.FsrsCard, error) {
	// Try to find existing card
	card, err := s.client.FsrsCard.Query().
		Where(fsrscard.NodeID(nodeID)).
		Only(ctx)

	// If card exists, return it
	if err == nil {
		return card, nil
	}

	// If error is not "not found", return the error
	if !ent.IsNotFound(err) {
		return nil, fmt.Errorf("error querying card: %w", err)
	}

	// Card doesn't exist, create a new one with default FSRS parameters
	newCard, err := s.client.FsrsCard.Create().
		SetNodeID(nodeID).
		SetState(fsrscard.StateNew).
		SetStability(0.0).
		SetDifficulty(5.0). // Default difficulty
		SetElapsedDays(0).
		SetScheduledDays(0).
		SetReps(0).
		SetLapses(0).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to create new card: %w", err)
	}

	return newCard, nil
}

// ReviewCard processes a user's attempt.
// UPDATED SIGNATURE: Added userAnswer string
// Update ReviewCard to use GetOrCreateCard
func (s *FSRSService) ReviewCard(
	ctx context.Context,
	cardID uuid.UUID,
	grade FSRSGrade,
	durationMs int64,
	userAnswer string,
	metadata map[string]interface{},
	errorDefID *uuid.UUID,
) (*ent.FsrsCard, error) {

	// Get or create card
	card, err := s.GetOrCreateCard(ctx, cardID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch card: %w", err)
	}

	// 2. Log Attempt (History)
	attemptState := attempt.State(card.State.String())

	attemptBuilder := s.client.Attempt.Create().
		SetCardID(card.ID).
		SetRating(int(grade)).
		SetDurationMs(int(durationMs)).
		SetState(attemptState).
		SetStability(card.Stability).
		SetDifficulty(card.Difficulty).
		SetIsCorrect(grade >= GradeGood).
		SetUserAnswer(userAnswer).
		SetMetadata(metadata)

	if errorDefID != nil {
		attemptBuilder.SetErrorTypeID(*errorDefID)
	}

	_, err = attemptBuilder.Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to log attempt: %w", err)
	}

	// 3. Update Error Resolutions (Diagnostic Stream)
	if errorDefID != nil && grade <= GradeHard {
		def, err := s.client.ErrorDefinition.Get(ctx, *errorDefID)
		weight := 1.0
		if err == nil {
			weight = def.BaseWeight
		}

		_, err = s.client.ErrorResolution.Create().
			SetNodeID(card.NodeID).
			SetErrorTypeID(*errorDefID).
			SetWeightImpact(weight).
			SetIsResolved(false).
			Save(ctx)
		if err != nil {
			// Non-fatal, just log it? For now return error
			return nil, fmt.Errorf("failed to record error resolution: %w", err)
		}
	}

	// 4. Map Ent -> go-fsrs Card
	libCard := fsrs.Card{
		Stability:     card.Stability,
		Difficulty:    card.Difficulty,
		ElapsedDays:   uint64(card.ElapsedDays),
		ScheduledDays: uint64(card.ScheduledDays),
		Reps:          uint64(card.Reps),
		Lapses:        uint64(card.Lapses),
		State:         mapStateToLib(card.State),
		LastReview:    safeTime(card.LastReview),
		Due:           card.Due,
	}

	// 5. Calculate Next Schedule
	now := time.Now()
	scheduledItem := s.fsrs.Repeat(libCard, now)

	nextSchedule, exists := scheduledItem[fsrs.Rating(grade)]
	if !exists {
		return nil, fmt.Errorf("invalid grade provided: %d", grade)
	}

	nextCard := nextSchedule.Card

	// 6. Update DB with New State
	updatedCard, err := s.client.FsrsCard.UpdateOne(card).
		SetStability(nextCard.Stability).
		SetDifficulty(nextCard.Difficulty).
		SetElapsedDays(int(nextCard.ElapsedDays)).
		SetScheduledDays(int(nextCard.ScheduledDays)).
		SetReps(int(nextCard.Reps)).
		SetLapses(int(nextCard.Lapses)).
		SetState(mapStateFromLib(nextCard.State)).
		SetLastReview(nextCard.LastReview).
		SetDue(nextCard.Due).
		Save(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to save card update: %w", err)
	}

	return updatedCard, nil
}

// --- HELPERS ---

func mapStateToLib(s fsrscard.State) fsrs.State {
	switch s {
	case fsrscard.StateNew:
		return fsrs.New
	case fsrscard.StateLearning:
		return fsrs.Learning
	case fsrscard.StateReview:
		return fsrs.Review
	case fsrscard.StateRelearning:
		return fsrs.Relearning
	default:
		return fsrs.New
	}
}

func mapStateFromLib(s fsrs.State) fsrscard.State {
	switch s {
	case fsrs.New:
		return fsrscard.StateNew
	case fsrs.Learning:
		return fsrscard.StateLearning
	case fsrs.Review:
		return fsrscard.StateReview
	case fsrs.Relearning:
		return fsrscard.StateRelearning
	default:
		return fsrscard.StateNew
	}
}

func safeTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
