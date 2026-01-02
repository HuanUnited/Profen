package data

import (
	"context"
	"fmt"

	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"
	"profen/internal/data/ent/nodeclosure"

	// Import your hooks package

	"github.com/google/uuid"
)

type NodeRepository struct {
	client *ent.Client
}

func NewNodeRepository(client *ent.Client) *NodeRepository {
	return &NodeRepository{client: client}
}

// 1. CreateNode
// The Hook we wrote handles the Closure Table complexity automatically.
// We just need to map the inputs to the Ent builder.
func (r *NodeRepository) CreateNode(
	ctx context.Context,
	nodeType node.Type,
	parentID uuid.UUID,
	body string,
	metadata map[string]interface{},
) (*ent.Node, error) {

	builder := r.client.Node.Create().
		SetType(nodeType).
		SetBody(body).
		SetMetadata(metadata)

	// Only set ParentID if it's not nil (Root nodes have no parent)
	if parentID != uuid.Nil {
		builder.SetParentID(parentID)
	}

	return builder.Save(ctx)
}

// 2. GetDescendants (< 10ms Goal)
// Utilizes the NodeClosure table to fetch the entire subtree in a single query.
func (r *NodeRepository) GetDescendants(ctx context.Context, ancestorID uuid.UUID) ([]*ent.Node, error) {
	// Logic: Find all Nodes that have a "ParentClosure" (incoming closure edge)
	// where the "Ancestor" is our target ID.
	return r.client.Node.Query().
		Where(
			node.HasParentClosuresWith(
				nodeclosure.AncestorID(ancestorID),
			),
		).
		// Optional: Order by Depth so the tree structure is easier to reconstruct
		// You would need to add .Order(...) but raw nodes are fine for now.
		All(ctx)
}

// 3. CreateAssociation
// Creates a lateral link (e.g., Problem -> tests -> Theory)
func (r *NodeRepository) CreateAssociation(
	ctx context.Context,
	sourceID, targetID uuid.UUID,
	relType nodeassociation.RelType,
) error {

	// Validation: Prevent self-loops if needed, though DB might allow it
	if sourceID == targetID {
		return fmt.Errorf("cannot associate node with itself")
	}

	return r.client.NodeAssociation.Create().
		SetSourceID(sourceID).
		SetTargetID(targetID).
		SetRelType(relType).
		Exec(ctx)
}

// GetSubjects returns all nodes with type="subject" (The Roots)
func (r *NodeRepository) GetSubjects(ctx context.Context) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.TypeEQ(node.TypeSubject)).
		Order(ent.Asc(node.FieldBody)). // Alphabetical
		All(ctx)
}

// GetChildren returns direct children of a parent (Lazy Load)
func (r *NodeRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.ParentIDEQ(parentID)).
		Order(ent.Asc(node.FieldType), ent.Asc(node.FieldBody)). // Subjects first, then alphabetical
		All(ctx)
}

// GetNode returns a single node's details
func (r *NodeRepository) GetNode(ctx context.Context, id uuid.UUID) (*ent.Node, error) {
	return r.client.Node.Get(ctx, id)
}
