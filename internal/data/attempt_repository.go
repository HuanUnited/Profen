// internal/data/attempt_repository.go
package data

import (
	"context"
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

// GetAttemptsByNode - Query through Attempt -> FsrsCard -> Node
func (r *AttemptRepository) GetAttemptsByNode(ctx context.Context, nodeID uuid.UUID) ([]*ent.Attempt, error) {
	return r.client.Attempt.Query().
		Where(
			attempt.HasCardWith( // Exact edge name from attempt.go
				fsrscard.HasNodeWith(node.ID(nodeID)), // Exact edge name from fsrscard.go
			),
		).
		Order(ent.Desc(attempt.FieldCreatedAt)).
		All(ctx)
}
