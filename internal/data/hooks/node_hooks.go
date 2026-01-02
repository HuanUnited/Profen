package hooks

import (
	"context"
	"fmt"
	"strings"

	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeclosure"
)

// NodeClosureHook enforces the Closure Table logic on every Node creation.
// It ensures that whenever a Node is created:
// 1. A self-referencing closure path (Depth 0) is created.
// 2. If it has a Parent, all of the Parent's ancestor paths are copied and extended to the new Node.
func NodeClosureHook(c *ent.Client) ent.Hook {
	return func(next ent.Mutator) ent.Mutator {
		return ent.MutateFunc(func(ctx context.Context, m ent.Mutation) (ent.Value, error) {
			// Filter: Execute only on Node creation
			if m.Op() != ent.OpCreate || !strings.EqualFold(m.Type(), node.Label) {
				return next.Mutate(ctx, m)
			}

			// 1. Execute the mutation to create the Node first.
			// We need the generated UUID (v.ID) for the closure table.
			v, err := next.Mutate(ctx, m)
			if err != nil {
				return nil, err
			}

			// Cast result to *ent.Node to access ID
			newNode, ok := v.(*ent.Node)
			if !ok {
				return nil, fmt.Errorf("unexpected type %T from Node mutation", v)
			}

			// Cast mutation to *ent.NodeMutation to access ParentID
			nm, ok := m.(*ent.NodeMutation)
			if !ok {
				return nil, fmt.Errorf("unexpected mutation type %T", m)
			}

			// 2. Prepare closure entries
			// Always start with self-reference: (Me, Me, 0)
			closureCreates := []*ent.NodeClosureCreate{
				c.NodeClosure.Create().
					SetAncestorID(newNode.ID).
					SetDescendantID(newNode.ID).
					SetDepth(0),
			}

			// 3. Handle Ancestry propagation
			if parentID, exists := nm.ParentID(); exists {
				// Find all existing paths where the Parent is the descendant.
				// i.e., "Who are the ancestors of my new parent?"
				ancestors, err := c.NodeClosure.Query().
					Where(nodeclosure.DescendantID(parentID)).
					All(ctx)

				if err != nil {
					return nil, fmt.Errorf("failed to query parent ancestors for closure: %w", err)
				}

				// For each ancestor of my parent, link them to me (Depth + 1)
				for _, closure := range ancestors {
					closureCreates = append(closureCreates, c.NodeClosure.Create().
						SetAncestorID(closure.AncestorID).
						SetDescendantID(newNode.ID).
						SetDepth(closure.Depth+1),
					)
				}
			}

			// 4. Bulk Insert
			if _, err := c.NodeClosure.CreateBulk(closureCreates...).Save(ctx); err != nil {
				return nil, fmt.Errorf("failed to save node closure paths: %w", err)
			}

			return v, nil
		})
	}
}
