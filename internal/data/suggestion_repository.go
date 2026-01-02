package data

import (
	"context"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/errorresolution"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeclosure"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
)

type SuggestionRepository struct {
	client *ent.Client
}

func NewSuggestionRepository(client *ent.Client) *SuggestionRepository {
	return &SuggestionRepository{client: client}
}

// 1. GetDueCards (Stream 1: Maintenance)
// Returns cards where scheduled_days <= today OR state = 'learning'
func (r *SuggestionRepository) GetDueCards(ctx context.Context, limit int) ([]*ent.Node, error) {
	now := time.Now()

	return r.client.Node.Query().
		Where(
			node.HasFsrsCardWith(
				fsrscard.Or(
					// Condition A: Due date is in the past (Overdue)
					fsrscard.DueLTE(now),
					// Condition B: Card is in 'Learning' or 'Relearning' (High Priority)
					fsrscard.StateIn(fsrscard.StateLearning, fsrscard.StateRelearning),
				),
			),
		).
		// Eager Load the Card to show status
		WithFsrsCard().
		// Sort by Due Date (Oldest first)
		Order(func(s *sql.Selector) {
			t := sql.Table(fsrscard.Table)
			s.Join(t).On(s.C(node.FieldID), t.C(fsrscard.FieldNodeID))
			s.OrderBy(t.C(fsrscard.FieldDue))
		}).
		Limit(limit).
		All(ctx)
}

// 2. GetDiagnosticGaps (Stream 2: Error-Led)
// Finds problems under a specific Topic that have UNRESOLVED errors.
// This is complex: Topic -> Closure -> Nodes -> Errors(Unresolved)
// GetDiagnosticGaps finds problems with the highest "Error Gravity" under a topic.
func (r *SuggestionRepository) GetDiagnosticGaps(ctx context.Context, topicID uuid.UUID, limit int) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(
			// Filter 1: Hierarchy (Must be under the Topic)
			node.HasParentClosuresWith(
				nodeclosure.AncestorID(topicID),
			),
			// Filter 2: Only nodes with active errors
			node.HasErrorResolutionsWith(
				errorresolution.IsResolved(false),
			),
		).
		// Custom SQL for Scoring & Sorting
		Modify(func(s *sql.Selector) {
			// Aliases
			tNode := sql.Table(node.Table)
			tErr := sql.Table(errorresolution.Table)

			// JOIN nodes -> error_resolutions
			s.Join(tErr).On(tNode.C(node.FieldID), tErr.C(errorresolution.FieldNodeID))

			// Filter (Redundant with Ent predicate but good for clarity in raw SQL)
			s.Where(sql.EQ(tErr.C(errorresolution.FieldIsResolved), false))

			// GROUP BY node_id to aggregate weights
			s.GroupBy(tNode.C(node.FieldID))

			// ORDER BY SUM(weight_impact) DESC
			s.OrderBy(sql.Desc(sql.Sum(tErr.C(errorresolution.FieldWeightImpact))))
		}).
		Limit(limit).
		All(ctx)
}
