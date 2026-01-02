package service

import (
	"context"
	"fmt"

	"profen/internal/data/ent"
	"profen/internal/data/ent/errorresolution"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"
	"profen/internal/data/ent/nodeclosure"

	"github.com/google/uuid"
)

// SnapshotService handles the aggregation of data for LLM analysis.
type SnapshotService struct {
	client *ent.Client
}

func NewSnapshotService(client *ent.Client) *SnapshotService {
	return &SnapshotService{client: client}
}

// NodeSnapshot represents the full context of a node for AI analysis.
type NodeSnapshot struct {
	TargetNode    NodeSummary    `json:"target_node"`
	AncestryPath  []string       `json:"ancestry_path"` // e.g. ["Math", "Calculus"]
	RelatedTheory *NodeSummary   `json:"related_theory,omitempty"`
	ActiveErrors  []ErrorSummary `json:"active_errors,omitempty"`
}

type NodeSummary struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Body string `json:"body"`
}

type ErrorSummary struct {
	Type   string  `json:"error_type"`
	Weight float64 `json:"weight"`
}

// ExportSnapshot gathers all context for a specific node (usually a Problem).
func (s *SnapshotService) ExportSnapshot(ctx context.Context, nodeID uuid.UUID) (*NodeSnapshot, error) {
	// 1. Fetch Target Node
	target, err := s.client.Node.Get(ctx, nodeID)
	if err != nil {
		return nil, fmt.Errorf("fetching target node: %w", err)
	}

	snapshot := &NodeSnapshot{
		TargetNode: NodeSummary{
			ID:   target.ID.String(),
			Type: string(target.Type),
			Body: target.Body,
		},
		AncestryPath: []string{},
		ActiveErrors: []ErrorSummary{},
	}

	// 2. Fetch Ancestry (Context)
	// Query: Ancestors of this node, ordered by depth (Root -> Parent)
	ancestors, err := s.client.NodeClosure.Query().
		Where(nodeclosure.DescendantID(nodeID)).
		Order(ent.Desc(nodeclosure.FieldDepth)). // Root has highest depth? No, usually Depth 0 is self.
		// Wait, Depth 0 is self. Parent is 1. Root is N.
		// We want Root -> Parent. So Sort by Depth DESC.
		QueryAncestor(). // Join to get Node details
		All(ctx)

	if err == nil {
		for _, anc := range ancestors {
			// Skip self (Depth 0 usually, but logic depends on closure insert)
			if anc.ID != target.ID {
				snapshot.AncestryPath = append(snapshot.AncestryPath, anc.Body)
			}
		}
	}

	// 3. Fetch Linked Theory (Context)
	// Query: Find a node linked via 'tests' (if this is a problem) or 'defined_by'
	// Usually: Problem -> (tests) -> Theory
	theory, err := s.client.Node.Query().
		Where(
			node.Or(
				// Forward: Problem -> tests -> Theory
				node.HasIncomingAssociationsWith(
					nodeassociation.SourceID(nodeID),
					nodeassociation.RelTypeEQ(nodeassociation.RelTypeTests),
				),
				// Reverse: Theory -> defined_by -> Problem (If you have this enum)
				// If not, maybe just check 'tests' in reverse? (Semantic abuse but works for MVP)
				node.HasOutgoingAssociationsWith(
					nodeassociation.TargetID(nodeID),
					nodeassociation.RelTypeEQ(nodeassociation.RelTypeTests), // Assuming bidirectional usage of 'tests' tag
				),
			),
		).
		First(ctx)

	// If checking bidirectional or other types, expand logic here.
	if err == nil && theory != nil {
		snapshot.RelatedTheory = &NodeSummary{
			ID:   theory.ID.String(),
			Type: string(theory.Type),
			Body: theory.Body,
		}
	}

	// 4. Fetch Unresolved Errors (Diagnostics)
	// We need the ErrorDefinition label, so we join.
	// Ent join syntax can be verbose, or we iterate.
	// Let's iterate over ErrorResolutions and fetch Definitions eagerly.
	errs, err := s.client.ErrorResolution.Query().
		Where(
			errorresolution.NodeID(nodeID),
			errorresolution.IsResolved(false),
		).
		// We need to fetch the definition to get the string Label
		// Eager loading? s.client.ErrorResolution.Query().With... (if edge exists)
		// Since we didn't add "WithErrorDefinition" query edge explicitly in repo logic,
		// we might need to rely on the ID or add the edge to query.
		All(ctx)

	if err == nil {
		for _, e := range errs {
			// Resolve Label (N+1 query is fine for single snapshot export)
			def, _ := s.client.ErrorDefinition.Get(ctx, e.ErrorTypeID)
			label := "Unknown"
			if def != nil {
				label = def.Label
			}

			snapshot.ActiveErrors = append(snapshot.ActiveErrors, ErrorSummary{
				Type:   label,
				Weight: e.WeightImpact,
			})
		}
	}

	return snapshot, nil
}
