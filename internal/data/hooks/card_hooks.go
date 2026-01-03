package hooks

import (
	"context"
	"fmt"
	"strings"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
)

// FsrsCardInitHook automatically creates an empty FSRS card
// whenever a new Node is created.
func FsrsCardInitHook(c *ent.Client) ent.Hook {
	return func(next ent.Mutator) ent.Mutator {
		return ent.MutateFunc(func(ctx context.Context, m ent.Mutation) (ent.Value, error) {
			// 1. Filter: Only OpCreate on Nodes
			if m.Op() != ent.OpCreate || !strings.EqualFold(m.Type(), node.Label) {
				return next.Mutate(ctx, m)
			}

			// 2. Execute Node Creation First
			v, err := next.Mutate(ctx, m)
			if err != nil {
				return nil, err
			}

			newNode, ok := v.(*ent.Node)
			if !ok {
				return nil, fmt.Errorf("unexpected type %T", v)
			}

			// 3. Conditional Creation: Only for Problem or Theory
			if newNode.Type == node.TypeProblem || newNode.Type == node.TypeTheory {
				err = c.FsrsCard.Create().
					SetNodeID(newNode.ID).
					SetState("new"). // New
					SetStability(0).
					SetDifficulty(0).
					SetElapsedDays(0).
					SetScheduledDays(0).
					SetReps(0).
					SetLapses(0).
					SetDue(time.Now()). // Due Immediately
					Exec(ctx)

				if err != nil {
					// Log error but allow node creation to succeed?
					// Better to fail so we don't have orphaned practice nodes.
					return nil, fmt.Errorf("failed to init fsrs card for practice node: %w", err)
				}
			}

			return v, nil
		})
	}
}
