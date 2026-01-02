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

			// 2. Execute Node Creation First (need the ID)
			v, err := next.Mutate(ctx, m)
			if err != nil {
				return nil, err
			}

			newNode, ok := v.(*ent.Node)
			if !ok {
				return nil, fmt.Errorf("unexpected type %T", v)
			}

			// 3. Create the Default FSRS Card
			// Default State is "New", Stability=0, Due=Now
			err = c.FsrsCard.Create().
				SetNodeID(newNode.ID).
				SetState("new").
				SetStability(0).
				SetDifficulty(0).
				SetDue(time.Now()). // Due immediately
				Exec(ctx)

			if err != nil {
				return nil, fmt.Errorf("failed to init fsrs card: %w", err)
			}

			return v, nil
		})
	}
}
