package data

import (
	"context"
	"fmt"
	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"
	"profen/internal/data/ent/nodeclosure"

	"github.com/google/uuid"
)

type NodeRepository struct {
	client *ent.Client
}

func NewNodeRepository(client *ent.Client) *NodeRepository {
	return &NodeRepository{client: client}
}

// CreateNode creates a new node with Title.
func (r *NodeRepository) CreateNode(
	ctx context.Context,
	nodeType node.Type,
	parentID uuid.UUID,
	title string, // <--- ADDED
	body string,
	metadata map[string]interface{},
) (*ent.Node, error) {
	builder := r.client.Node.Create().
		SetType(nodeType).
		SetTitle(title). // <--- ADDED
		SetBody(body).
		SetMetadata(metadata)

	if parentID != uuid.Nil {
		builder.SetParentID(parentID)
	}

	return builder.Save(ctx)
}

// UpdateNode updates title, body and metadata.
func (r *NodeRepository) UpdateNode(
	ctx context.Context,
	id uuid.UUID,
	title string, // <--- ADDED
	body string,
	metadata map[string]interface{},
) (*ent.Node, error) {
	return r.client.Node.UpdateOneID(id).
		SetTitle(title). // <--- ADDED
		SetBody(body).
		SetMetadata(metadata).
		Save(ctx)
}

// ... (Rest of the file remains the same: GetDescendants, CreateAssociation, GetSubjects, GetChildren, GetNode, DeleteNode)
func (r *NodeRepository) GetDescendants(ctx context.Context, ancestorID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.HasParentClosuresWith(nodeclosure.AncestorID(ancestorID))).
		All(ctx)
}

func (r *NodeRepository) CreateAssociation(ctx context.Context, sourceID, targetID uuid.UUID, relType nodeassociation.RelType) error {
	if sourceID == targetID {
		return fmt.Errorf("cannot associate node with itself")
	}
	return r.client.NodeAssociation.Create().
		SetSourceID(sourceID).
		SetTargetID(targetID).
		SetRelType(relType).
		Exec(ctx)
}

func (r *NodeRepository) GetSubjects(ctx context.Context) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.TypeEQ(node.TypeSubject)).
		Order(ent.Asc(node.FieldTitle)). // UPDATED: Sort by Title now, not Body
		All(ctx)
}

func (r *NodeRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.ParentIDEQ(parentID)).
		Order(ent.Asc(node.FieldType), ent.Asc(node.FieldTitle)). // UPDATED: Sort by Title
		All(ctx)
}

func (r *NodeRepository) GetNode(ctx context.Context, id uuid.UUID) (*ent.Node, error) {
	return r.client.Node.Get(ctx, id)
}

func (r *NodeRepository) DeleteNode(ctx context.Context, id uuid.UUID) error {
	return r.client.Node.DeleteOneID(id).Exec(ctx)
}
