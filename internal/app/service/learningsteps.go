// internal/app/service/learning_steps.go
package service

import (
	"context"
	"fmt"
	"time"

	"profen/internal/data/ent"
)

// CardState represents where the card is in the learning pipeline
type CardState string

const (
	StateNew        CardState = "new"
	StateLearning   CardState = "learning"
	StateReview     CardState = "review"
	StateRelearning CardState = "relearning"
)

// LearningStepsConfig defines the learning pipeline
type LearningStepsConfig struct {
	LearningSteps      []int `json:"learning_steps"`      // minutes: [10, 30]
	RelearningSteps    []int `json:"relearning_steps"`    // minutes: [10]
	GraduatingInterval int   `json:"graduating_interval"` // days: 1
	EasyInterval       int   `json:"easy_interval"`       // days: 4
}

// DefaultLearningConfig returns sensible defaults
func DefaultLearningConfig() LearningStepsConfig {
	return LearningStepsConfig{
		LearningSteps:      []int{10, 30}, // 10 minutes, 30 minutes
		RelearningSteps:    []int{10},     // 10 minutes
		GraduatingInterval: 1,             // 1 day after graduating
		EasyInterval:       4,             // 4 days if marked easy while learning
	}
}

// StepResult contains the outcome of processing a review
type StepResult struct {
	NextReviewAt    time.Time `json:"next_review_at"`
	NextState       CardState `json:"next_state"`
	CurrentStep     int       `json:"current_step"`
	ShouldGraduate  bool      `json:"should_graduate"`
	IntervalDisplay string    `json:"interval_display"`
}

// LearningStepsService handles pre-FSRS learning phase
type LearningStepsService struct {
	client *ent.Client
	config LearningStepsConfig
}

// NewLearningStepsService creates a new service
func NewLearningStepsService(client *ent.Client, config LearningStepsConfig) *LearningStepsService {
	return &LearningStepsService{
		client: client,
		config: config,
	}
}

// GetCurrentState determines what state a card is in
func (s *LearningStepsService) GetCurrentState(card *ent.FsrsCard) CardState {
	return CardState(card.CardState)
}

// ProcessReview handles a review in the learning/relearning phase
func (s *LearningStepsService) ProcessReview(
	ctx context.Context,
	card *ent.FsrsCard,
	grade int, // 1-4 (Again, Hard, Good, Easy)
) (*StepResult, error) {

	state := s.GetCurrentState(card)

	switch state {
	case StateNew, StateLearning:
		return s.processLearning(ctx, card, grade)
	case StateRelearning:
		return s.processRelearning(ctx, card, grade)
	case StateReview:
		// This shouldn't be called for review cards - return error
		return nil, fmt.Errorf("card is in review state, should use FSRS service")
	default:
		return nil, fmt.Errorf("unknown card state: %s", state)
	}
}

// processLearning handles new/learning cards
func (s *LearningStepsService) processLearning(
	ctx context.Context,
	card *ent.FsrsCard,
	grade int,
) (*StepResult, error) {

	steps := s.config.LearningSteps
	currentStep := card.CurrentStep

	// Grade 1 (Again) - restart from beginning
	if grade == 1 {
		nextReview := time.Now().Add(time.Duration(steps[0]) * time.Minute)

		err := card.Update().
			SetCardState(string(StateLearning)).
			SetCurrentStep(0).
			SetNextReview(nextReview).
			Save(ctx)

		if err != nil {
			return nil, err
		}

		return &StepResult{
			NextReviewAt:    nextReview,
			NextState:       StateLearning,
			CurrentStep:     0,
			ShouldGraduate:  false,
			IntervalDisplay: s.formatMinutes(steps[0]),
		}, nil
	}

	// Grade 4 (Easy) - graduate immediately with easy interval
	if grade == 4 {
		return &StepResult{
			NextReviewAt:    time.Now().Add(time.Duration(s.config.EasyInterval) * 24 * time.Hour),
			NextState:       StateReview,
			CurrentStep:     -1,
			ShouldGraduate:  true,
			IntervalDisplay: fmt.Sprintf("%dd", s.config.EasyInterval),
		}, nil
	}

	// Grade 2 (Hard) or 3 (Good) - advance through steps
	nextStep := currentStep + 1

	// Still in learning steps
	if nextStep < len(steps) {
		nextReview := time.Now().Add(time.Duration(steps[nextStep]) * time.Minute)

		err := card.Update().
			SetCardState(string(StateLearning)).
			SetCurrentStep(nextStep).
			SetNextReview(nextReview).
			Save(ctx)

		if err != nil {
			return nil, err
		}

		return &StepResult{
			NextReviewAt:    nextReview,
			NextState:       StateLearning,
			CurrentStep:     nextStep,
			ShouldGraduate:  false,
			IntervalDisplay: s.formatMinutes(steps[nextStep]),
		}, nil
	}

	// Completed all learning steps - graduate!
	return &StepResult{
		NextReviewAt:    time.Now().Add(time.Duration(s.config.GraduatingInterval) * 24 * time.Hour),
		NextState:       StateReview,
		CurrentStep:     -1,
		ShouldGraduate:  true,
		IntervalDisplay: fmt.Sprintf("%dd", s.config.GraduatingInterval),
	}, nil
}

// processRelearning handles cards that failed review
func (s *LearningStepsService) processRelearning(
	ctx context.Context,
	card *ent.FsrsCard,
	grade int,
) (*StepResult, error) {

	steps := s.config.RelearningSteps
	currentStep := card.CurrentStep

	// Grade 1 (Again) - restart relearning
	if grade == 1 {
		nextReview := time.Now().Add(time.Duration(steps[0]) * time.Minute)

		err := card.Update().
			SetCardState(string(StateRelearning)).
			SetCurrentStep(0).
			SetNextReview(nextReview).
			SetLapses(card.Lapses + 1).
			Save(ctx)

		if err != nil {
			return nil, err
		}

		return &StepResult{
			NextReviewAt:    nextReview,
			NextState:       StateRelearning,
			CurrentStep:     0,
			ShouldGraduate:  false,
			IntervalDisplay: s.formatMinutes(steps[0]),
		}, nil
	}

	// Any other grade - complete relearning and return to review
	nextStep := currentStep + 1

	if nextStep < len(steps) {
		nextReview := time.Now().Add(time.Duration(steps[nextStep]) * time.Minute)

		err := card.Update().
			SetCardState(string(StateRelearning)).
			SetCurrentStep(nextStep).
			SetNextReview(nextReview).
			Save(ctx)

		if err != nil {
			return nil, err
		}

		return &StepResult{
			NextReviewAt:    nextReview,
			NextState:       StateRelearning,
			CurrentStep:     nextStep,
			ShouldGraduate:  false,
			IntervalDisplay: s.formatMinutes(steps[nextStep]),
		}, nil
	}

	// Completed relearning - back to review state
	return &StepResult{
		NextReviewAt:    time.Now(), // FSRS will calculate the actual interval
		NextState:       StateReview,
		CurrentStep:     -1,
		ShouldGraduate:  true,
		IntervalDisplay: "Back to Review",
	}, nil
}

// GetNextIntervals returns what the intervals would be for each grade
// This is used to show intervals on buttons BEFORE the user reviews
func (s *LearningStepsService) GetNextIntervals(card *ent.FsrsCard) map[int]string {
	state := s.GetCurrentState(card)
	intervals := make(map[int]string)

	switch state {
	case StateNew, StateLearning:
		steps := s.config.LearningSteps
		currentStep := card.CurrentStep

		// Grade 1: Back to first step
		intervals[1] = s.formatMinutes(steps[0])

		// Grade 2 & 3: Next step or graduate
		if currentStep+1 < len(steps) {
			intervals[2] = s.formatMinutes(steps[currentStep+1])
			intervals[3] = s.formatMinutes(steps[currentStep+1])
		} else {
			intervals[2] = fmt.Sprintf("%dd", s.config.GraduatingInterval)
			intervals[3] = fmt.Sprintf("%dd", s.config.GraduatingInterval)
		}

		// Grade 4: Easy graduation
		intervals[4] = fmt.Sprintf("%dd", s.config.EasyInterval)

	case StateRelearning:
		steps := s.config.RelearningSteps
		currentStep := card.CurrentStep

		// Grade 1: Restart relearning
		intervals[1] = s.formatMinutes(steps[0])

		// Grade 2, 3, 4: Complete relearning
		if currentStep+1 < len(steps) {
			next := s.formatMinutes(steps[currentStep+1])
			intervals[2] = next
			intervals[3] = next
			intervals[4] = next
		} else {
			intervals[2] = "Back to Review"
			intervals[3] = "Back to Review"
			intervals[4] = "Back to Review"
		}
	}

	return intervals
}

// formatMinutes converts minutes to human-readable format
func (s *LearningStepsService) formatMinutes(minutes int) string {
	if minutes < 60 {
		return fmt.Sprintf("%dm", minutes)
	}
	hours := minutes / 60
	remainingMinutes := minutes % 60
	if hours < 24 {
		if remainingMinutes == 0 {
			return fmt.Sprintf("%dh", hours)
		}
		return fmt.Sprintf("%dh%dm", hours, remainingMinutes)
	}
	days := hours / 24
	return fmt.Sprintf("%dd", days)
}

// ShouldUseLearningSteps determines if this card should use learning steps
func (s *LearningStepsService) ShouldUseLearningSteps(card *ent.FsrsCard) bool {
	state := s.GetCurrentState(card)
	return state == StateNew || state == StateLearning || state == StateRelearning
}
