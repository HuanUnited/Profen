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

// ReviewCard processes a user's attempt.
// UPDATED SIGNATURE: Added userAnswer string
func (s *FSRSService) ReviewCard(
	ctx context.Context,
	cardID uuid.UUID,
	grade FSRSGrade,
	durationMs int64, // Changed to int64 to match App
	userAnswer string, // <--- NEW ARGUMENT
	metadata map[string]interface{}, // NEW
	errorDefID *uuid.UUID,

) (*ent.FsrsCard, error) {

	// 1. Fetch Card
	card, err := s.client.FsrsCard.Query().
		Where(fsrscard.IDEQ(cardID)).
		Only(ctx)
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
