// internal/app/service/fsrs.go
package service

import (
	"context"
	"fmt"
	"math"
	"time"

	"profen/internal/data/ent"
)

// FSRSGrade represents review grades
type FSRSGrade int

const (
	GradeAgain FSRSGrade = 1
	GradeHard  FSRSGrade = 2
	GradeGood  FSRSGrade = 3
	GradeEasy  FSRSGrade = 4
)

// FSRSConfig for algorithm parameters
type FSRSConfig struct {
	DesiredRetention float64   `json:"desired_retention"`
	MaxInterval      int       `json:"max_interval"`
	W                []float64 `json:"w"` // FSRS weights
}

// DefaultFSRSConfig returns default FSRS v4 parameters
func DefaultFSRSConfig() FSRSConfig {
	return FSRSConfig{
		DesiredRetention: 0.9,
		MaxInterval:      36500, // ~100 years
		W: []float64{
			0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
		},
	}
}

// FSRSService handles spaced repetition calculations
type FSRSService struct {
	client *ent.Client
	config FSRSConfig
}

// NewFSRSService creates a new FSRS service
func NewFSRSService(client *ent.Client, config FSRSConfig) *FSRSService {
	return &FSRSService{
		client: client,
		config: config,
	}
}

// FSRSResult contains the scheduling outcome
type FSRSResult struct {
	Stability       float64   `json:"stability"`
	Difficulty      float64   `json:"difficulty"`
	NextReviewAt    time.Time `json:"next_review_at"`
	IntervalDays    int       `json:"interval_days"`
	IntervalDisplay string    `json:"interval_display"`
}

// ReviewCard processes a review for cards in Review state only
func (s *FSRSService) ReviewCard(
	ctx context.Context,
	card *ent.FsrsCard,
	grade FSRSGrade,
) (*FSRSResult, error) {

	// Ensure card is in review state
	if CardState(card.CardState) != StateReview {
		return nil, fmt.Errorf("card must be in review state to use FSRS")
	}

	// ✅ FIX: Calculate days since scheduled review (not since creation)
	// If NextReview is in the past, card is overdue
	var daysSinceLastReview int
	if time.Now().After(card.NextReview) {
		daysSinceLastReview = int(time.Since(card.NextReview).Hours() / 24)
	} else {
		daysSinceLastReview = 0 // Reviewed early
	}

	// Calculate retrievability
	retrievability := s.calculateRetrievability(
		float64(daysSinceLastReview),
		card.Stability,
	)

	// Calculate new stability
	newStability := s.calculateNewStability(
		card.Difficulty,
		card.Stability,
		retrievability,
		grade,
	)

	// Calculate new difficulty
	newDifficulty := s.calculateNewDifficulty(card.Difficulty, grade)

	// Calculate next interval
	interval := s.calculateInterval(newStability, s.config.DesiredRetention)
	intervalDays := int(math.Round(interval))

	// Cap at max interval
	if intervalDays > s.config.MaxInterval {
		intervalDays = s.config.MaxInterval
	}

	nextReview := time.Now().Add(time.Duration(intervalDays) * 24 * time.Hour)

	// Update card
	// Update card - FIX: Save returns (card, error)
	updateBuilder := card.Update().
		SetStability(newStability).
		SetDifficulty(newDifficulty).
		SetScheduledDays(intervalDays).
		SetElapsedDays(daysSinceLastReview).
		SetNextReview(nextReview).
		SetReps(card.Reps + 1)

	if grade == GradeAgain {
		updateBuilder = updateBuilder.
			SetLapses(card.Lapses + 1).
			SetCardState(string(StateRelearning)).
			SetCurrentStep(0)
	}

	_, err := updateBuilder.Save(ctx) // FIX: Capture both return values
	if err != nil {
		return nil, err
	}

	return &FSRSResult{
		Stability:       newStability,
		Difficulty:      newDifficulty,
		NextReviewAt:    nextReview,
		IntervalDays:    intervalDays,
		IntervalDisplay: s.formatInterval(intervalDays),
	}, nil
}

// GraduateCard initializes a card that completed learning steps
// Line 162 - GraduateCard method
func (s *FSRSService) GraduateCard(
	ctx context.Context,
	card *ent.FsrsCard,
	grade FSRSGrade,
	graduatingInterval int,
) (*FSRSResult, error) {

	stability := s.calculateInitialStability(grade)
	difficulty := s.calculateInitialDifficulty(grade)

	intervalDays := graduatingInterval
	if grade == GradeEasy {
		intervalDays = graduatingInterval * 4
	}

	nextReview := time.Now().Add(time.Duration(intervalDays) * 24 * time.Hour)

	// FIX: Save returns (card, error)
	_, err := card.Update().
		SetCardState(string(StateReview)).
		SetStability(stability).
		SetDifficulty(difficulty).
		SetScheduledDays(intervalDays).
		SetElapsedDays(0).
		SetNextReview(nextReview).
		SetReps(1).
		SetCurrentStep(-1).
		Save(ctx)

	if err != nil {
		return nil, err
	}

	return &FSRSResult{
		Stability:       stability,
		Difficulty:      difficulty,
		NextReviewAt:    nextReview,
		IntervalDays:    intervalDays,
		IntervalDisplay: s.formatInterval(intervalDays),
	}, nil
}

// GetNextIntervals predicts intervals for all grades
func (s *FSRSService) GetNextIntervals(card *ent.FsrsCard) map[int]string {
	intervals := make(map[int]string)

	for grade := 1; grade <= 4; grade++ {
		if grade == 1 {
			// Again goes to relearning, show relearning interval
			intervals[grade] = "10m" // This should come from learning config
			continue
		}

		// Predict stability for this grade
		daysSinceLastReview := int(time.Since(card.NextReview).Hours() / 24)
		if daysSinceLastReview < 0 {
			daysSinceLastReview = 0
		}

		retrievability := s.calculateRetrievability(
			float64(daysSinceLastReview),
			card.Stability,
		)

		newStability := s.calculateNewStability(
			card.Difficulty,
			card.Stability,
			retrievability,
			FSRSGrade(grade),
		)

		interval := s.calculateInterval(newStability, s.config.DesiredRetention)
		intervalDays := int(math.Round(interval))

		if intervalDays > s.config.MaxInterval {
			intervalDays = s.config.MaxInterval
		}

		intervals[grade] = s.formatInterval(intervalDays)
	}

	return intervals
}

// FSRS Algorithm Core Functions

func (s *FSRSService) calculateInitialStability(grade FSRSGrade) float64 {
	return s.config.W[int(grade)-1]
}

func (s *FSRSService) calculateInitialDifficulty(grade FSRSGrade) float64 {
	return s.config.W[4] - (float64(grade)-3)*s.config.W[5]
}

func (s *FSRSService) calculateRetrievability(elapsedDays, stability float64) float64 {
	return math.Pow(1+elapsedDays/(9*stability), -1)
}

func (s *FSRSService) calculateNewStability(
	difficulty, stability, retrievability float64,
	grade FSRSGrade,
) float64 {
	hardPenalty := s.config.W[15]
	easyBonus := s.config.W[16]

	if grade == GradeAgain {
		return s.config.W[11] * math.Pow(difficulty, -s.config.W[12]) *
			(math.Pow(stability+1, s.config.W[13]) - 1) *
			math.Exp(s.config.W[14]*(1-retrievability))
	}

	multiplier := 1.0
	switch grade {
	case GradeHard:
		multiplier = hardPenalty
	case GradeEasy:
		multiplier = easyBonus
	}

	return stability *
		(1 + math.Exp(s.config.W[8])*
			(11-difficulty)*
			math.Pow(stability, -s.config.W[9])*
			(math.Exp(s.config.W[10]*(1-retrievability))-1)*
			multiplier)
}

func (s *FSRSService) calculateNewDifficulty(difficulty float64, grade FSRSGrade) float64 {
	deltaDifficulty := -s.config.W[6] * (float64(grade) - 3)
	newDifficulty := difficulty + deltaDifficulty

	// Clamp between 1 and 10
	if newDifficulty < 1 {
		return 1
	}
	if newDifficulty > 10 {
		return 10
	}
	return newDifficulty
}

func (s *FSRSService) calculateInterval(stability, desiredRetention float64) float64 {
	// ✅ Correct FSRS formula: I = S × 9 × (1/R - 1)
	return stability * 9.0 * (1.0/desiredRetention - 1.0)
}

func (s *FSRSService) formatInterval(days int) string {
	if days < 30 {
		return fmt.Sprintf("%dd", days)
	}
	if days < 365 {
		months := days / 30
		return fmt.Sprintf("%dmo", months)
	}
	years := float64(days) / 365.0
	return fmt.Sprintf("%.1fy", years)
}
