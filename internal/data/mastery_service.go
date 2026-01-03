package data

import (
	"context"
	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"

	"github.com/google/uuid"
)

type MasteryService struct {
	client *ent.Client
}

func NewMasteryService(client *ent.Client) *MasteryService {
	return &MasteryService{client: client}
}

// GetNodeMastery calculates mastery for a leaf node (problem/theory)
// Returns: (correctCount int, totalAttempts int, isMastered bool)
func (s *MasteryService) GetNodeMastery(ctx context.Context, nodeID uuid.UUID) (int, int, bool, error) {
	attempts, err := s.client.Attempt.Query().
		Where(
			attempt.HasCardWith(
				fsrscard.HasNodeWith(node.ID(nodeID)),
			),
		).
		Order(ent.Desc(attempt.FieldCreatedAt)).
		All(ctx)

	if err != nil {
		return 0, 0, false, err
	}

	if len(attempts) == 0 {
		return 0, 0, false, nil
	}

	// Check last 3 attempts
	correctCount := 0
	for i := 0; i < len(attempts) && i < 3; i++ {
		if attempts[i].IsCorrect {
			correctCount++
		}
	}

	isMastered := len(attempts) >= 3 && correctCount == 3
	return correctCount, len(attempts), isMastered, nil
}

// GetContainerMastery calculates recursive mastery for subject/topic
func (s *MasteryService) GetContainerMastery(ctx context.Context, containerID uuid.UUID) (float64, error) {
	// Get all leaf descendants (problems + theories)
	children, err := s.client.Node.Query().
		Where(node.ParentIDEQ(containerID)).
		All(ctx)

	if err != nil {
		return 0, err
	}

	if len(children) == 0 {
		return 0, nil
	}

	totalMastery := 0.0
	count := 0

	for _, child := range children {
		if child.Type == node.TypeProblem || child.Type == node.TypeTheory {
			_, _, mastered, err := s.GetNodeMastery(ctx, child.ID)
			if err != nil {
				continue
			}
			if mastered {
				totalMastery += 1.0
			}
			count++
		} else {
			// Recursive for nested containers
			childMastery, err := s.GetContainerMastery(ctx, child.ID)
			if err != nil {
				continue
			}
			totalMastery += childMastery
			count++
		}
	}

	if count == 0 {
		return 0, nil
	}

	return totalMastery / float64(count), nil
}
