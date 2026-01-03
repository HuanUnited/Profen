package service

import (
	"context"
	"fmt"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeclosure"

	"entgo.io/ent/dialect/sql"
	"github.com/google/uuid"
)

// StudyCoordinator manages study session queue generation and card state fetching
type StudyCoordinator struct {
	client *ent.Client
}

// NewStudyCoordinator creates a new StudyCoordinator instance
func NewStudyCoordinator(client *ent.Client) *StudyCoordinator {
	return &StudyCoordinator{client: client}
}

// GetNodeWithCard returns a node with its associated FSRS card data
// Used by frontend to display card state (Learning/Review), step progress, and intervals
func (s *StudyCoordinator) GetNodeWithCard(ctx context.Context, nodeID uuid.UUID) (map[string]interface{}, error) {
	// Fetch node
	node, err := s.client.Node.Query().
		Where(node.ID(nodeID)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("node not found: %w", err)
	}

	// Fetch associated FSRS card
	card, err := s.client.FsrsCard.Query().
		Where(fsrscard.NodeID(nodeID)).
		Only(ctx)
	if err != nil {
		return nil, fmt.Errorf("fsrs card not found: %w", err)
	}

	// Build response map
	return map[string]interface{}{
		"id":             node.ID.String(),
		"title":          node.Title,
		"body":           node.Body,
		"type":           node.Type,
		"metadata":       node.Metadata,
		"card_state":     card.State,
		"current_step":   card.CurrentStep,
		"next_review":    card.Due,
		"stability":      card.Stability,
		"difficulty":     card.Difficulty,
		"reps":           card.Reps,
		"lapses":         card.Lapses,
		"elapsed_days":   card.ElapsedDays,
		"scheduled_days": card.ScheduledDays,
	}, nil
}

// GetDueCardsQueue returns IDs of due cards for study session
// Sorted by due date (oldest first), includes learning cards
func (s *StudyCoordinator) GetDueCardsQueue(ctx context.Context, limit int) ([]string, error) {
	now := time.Now()

	cards, err := s.client.FsrsCard.Query().
		Where(
			fsrscard.Or(
				// Due date is in the past
				fsrscard.DueLTE(now),
				// Or card is in learning/relearning state (high priority)
				fsrscard.StateIn(fsrscard.StateLearning, fsrscard.StateRelearning),
			),
		).
		Order(fsrscard.ByDue()). // Oldest first
		Limit(limit).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch due cards: %w", err)
	}

	// Extract node IDs
	ids := make([]string, len(cards))
	for i, card := range cards {
		ids[i] = card.NodeID.String()
	}

	return ids, nil
}

// GetDueCardsFromNode returns due card IDs from descendants of a specific parent node
// Uses NodeClosure table to find all descendants efficiently
func (s *StudyCoordinator) GetDueCardsFromNode(ctx context.Context, parentID uuid.UUID, limit int) ([]string, error) {
	now := time.Now()

	// Strategy: Query cards that belong to nodes which are descendants of parentID
	// Use nodeclosure.descendant_id to find all child nodes
	cards, err := s.client.FsrsCard.Query().
		Where(
			// Filter 1: Node must be a descendant of parentID (via closure table)
			fsrscard.HasNodeWith(
				node.HasParentClosuresWith(
					nodeclosure.AncestorID(parentID),
				),
				// Filter 2: Only Problems/Theories (leaf nodes)
				node.TypeIn(node.TypeProblem, node.TypeTheory),
			),
			// Filter 3: Card must be due
			fsrscard.Or(
				fsrscard.DueLTE(now),
				fsrscard.StateIn(fsrscard.StateLearning, fsrscard.StateRelearning),
			),
		).
		// Sort by due date using SQL
		Modify(func(s *sql.Selector) {
			s.OrderBy(sql.Asc(s.C(fsrscard.FieldDue)))
		}).
		Limit(limit).
		All(ctx)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch due cards from node: %w", err)
	}

	// Extract node IDs
	ids := make([]string, len(cards))
	for i, card := range cards {
		ids[i] = card.NodeID.String()
	}

	return ids, nil
}
