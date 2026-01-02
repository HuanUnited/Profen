package service

import (
	"context"
	"fmt"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/fsrscard"

	"github.com/google/uuid"
	"github.com/open-spaced-repetition/go-fsrs/v3"
)

// FSRSGrade represents the user's rating of their recall.
type FSRSGrade int

const (
	GradeAgain FSRSGrade = 1 // Forgot
	GradeHard  FSRSGrade = 2 // Remembered, but with difficulty
	GradeGood  FSRSGrade = 3 // Remembered easily
	GradeEasy  FSRSGrade = 4 // Remembered instantly
)

// FSRSService handles the spaced repetition logic.
type FSRSService struct {
	client *ent.Client
	params fsrs.Parameters // Holds weights (w0-w19) and settings
	fsrs   *fsrs.FSRS
}

func NewFSRSService(client *ent.Client) *FSRSService {
	// TODO: Initialize with default parameters (can be loaded from DB/JSON later)
	params := fsrs.DefaultParam()
	return &FSRSService{
		client: client,
		params: params,
		fsrs:   fsrs.NewFSRS(params),
	}
}

// ReviewCard processes a user's attempt and updates the database.
func (s *FSRSService) ReviewCard(ctx context.Context, cardID uuid.UUID, grade FSRSGrade) (*ent.FsrsCard, error) {
	// 1. Fetch the current card from DB
	// Note: We need the ID to be a UUID, assuming cardID is a string.
	// If your service uses uuid.UUID directly, adjust signature.

	// Convert ID if necessary, or pass uuid.UUID
	// id, _ := uuid.Parse(cardID)

	currentEntCard, err := s.client.FsrsCard.Query().
		Where(fsrscard.IDEQ(cardID)).
		Only(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to find card: %w", err)
	}

	// 2. Map Ent -> go-fsrs Card
	libCard := fsrs.Card{
		Stability:     currentEntCard.Stability,
		Difficulty:    currentEntCard.Difficulty,
		ElapsedDays:   uint64(currentEntCard.ElapsedDays),
		ScheduledDays: uint64(currentEntCard.ScheduledDays),
		Reps:          uint64(currentEntCard.Reps),
		Lapses:        uint64(currentEntCard.Lapses),
		State:         mapStateToLib(currentEntCard.State),
		LastReview:    safeTime(currentEntCard.LastReview),
		Due:           currentEntCard.Due,
	}

	// 3. Calculate Next Schedule
	// We need "Now" for calculation.
	now := time.Now()
	scheduledItem := s.fsrs.Repeat(libCard, now)

	// Select the result matching the user's grade
	// go-fsrs returns a map[Rating]SchedulingInfo
	nextSchedule, exists := scheduledItem[fsrs.Rating(grade)]
	if !exists {
		return nil, fmt.Errorf("invalid grade provided: %d", grade)
	}

	nextCard := nextSchedule.Card

	// 4. Update DB with New State
	updatedCard, err := s.client.FsrsCard.UpdateOne(currentEntCard).
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

// Helper: Map Ent Enum string -> fsrs.State int
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

// Helper: Map fsrs.State int -> Ent Enum string
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

// Helper: Handle nil pointer for time (Ent uses *time.Time for nullable)
func safeTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{} // Return zero time
	}
	return *t
}
