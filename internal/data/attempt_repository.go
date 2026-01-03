// internal/data/attempt_repository.go
package data

import (
	"context"
	"fmt"
	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"

	"github.com/google/uuid"
)

type AttemptRepository struct {
	client *ent.Client
}

func NewAttemptRepository(client *ent.Client) *AttemptRepository {
	return &AttemptRepository{client: client}
}

// CreateAttempt records a review attempt with all metadata
func (r *AttemptRepository) CreateAttempt(
	ctx context.Context,
	card *ent.FsrsCard, // Pass the card directly instead of just ID
	rating int,
	durationMs int64,
	userAnswer string,
	metadata map[string]interface{},
) error {
	// Validate rating
	if rating < 1 || rating > 4 {
		return fmt.Errorf("rating must be between 1 and 4, got %d", rating)
	}

	// Determine if correct (Good or Easy = correct)
	isCorrect := rating >= 3

	// Build the attempt
	builder := r.client.Attempt.Create().
		SetCardID(card.ID).
		SetRating(rating).
		SetDurationMs(int(durationMs)).
		SetIsCorrect(isCorrect).
		SetState(attempt.State(card.CardState)).
		SetStability(card.Stability).
		SetDifficulty(card.Difficulty)

	// Add optional user answer
	if userAnswer != "" {
		builder = builder.SetUserAnswer(userAnswer)
	}

	// Add metadata (error logs, difficulty rating, etc.)
	if metadata != nil && len(metadata) > 0 {
		builder = builder.SetMetadata(metadata)
	}

	// Save to database
	_, err := builder.Save(ctx)
	return err
}

// GetAttemptsByNode retrieves all attempts for a specific node (sorted by newest first)
func (r *AttemptRepository) GetAttemptsByNode(ctx context.Context, nodeID uuid.UUID) ([]*ent.Attempt, error) {
	return r.client.Attempt.Query().
		Where(
			attempt.HasCardWith(
				fsrscard.HasNodeWith(node.ID(nodeID)),
			),
		).
		Order(ent.Desc(attempt.FieldCreatedAt)).
		All(ctx)
}

// GetAttempt retrieves a single attempt by ID with all fields
func (r *AttemptRepository) GetAttempt(ctx context.Context, id uuid.UUID) (*ent.Attempt, error) {
	return r.client.Attempt.Get(ctx, id)
}

// GetAttemptsByCard retrieves all attempts for a specific card
func (r *AttemptRepository) GetAttemptsByCard(ctx context.Context, cardID uuid.UUID) ([]*ent.Attempt, error) {
	return r.client.Attempt.Query().
		Where(attempt.CardID(cardID)).
		Order(ent.Desc(attempt.FieldCreatedAt)).
		All(ctx)
}

// GetRecentAttempts retrieves the N most recent attempts across all cards
func (r *AttemptRepository) GetRecentAttempts(ctx context.Context, limit int) ([]*ent.Attempt, error) {
	return r.client.Attempt.Query().
		Order(ent.Desc(attempt.FieldCreatedAt)).
		Limit(limit).
		All(ctx)
}

// GetAttemptStats returns aggregate statistics for a node
func (r *AttemptRepository) GetAttemptStats(ctx context.Context, nodeID uuid.UUID) (map[string]interface{}, error) {
	attempts, err := r.GetAttemptsByNode(ctx, nodeID)
	if err != nil {
		return nil, err
	}

	total := len(attempts)
	if total == 0 {
		return map[string]interface{}{
			"total":        0,
			"correct":      0,
			"incorrect":    0,
			"accuracy":     0.0,
			"avg_duration": 0,
		}, nil
	}

	correct := 0
	totalDuration := int64(0)

	for _, att := range attempts {
		if att.IsCorrect {
			correct++
		}
		totalDuration += int64(att.DurationMs)
	}

	return map[string]interface{}{
		"total":        total,
		"correct":      correct,
		"incorrect":    total - correct,
		"accuracy":     float64(correct) / float64(total) * 100,
		"avg_duration": totalDuration / int64(total),
	}, nil
}
