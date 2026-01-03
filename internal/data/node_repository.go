package data

import (
	"context"
	"fmt"
	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/fsrscard"
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
	title string,
	body string,
	metadata map[string]interface{},
) (*ent.Node, error) {
	builder := r.client.Node.Create().
		SetType(nodeType).
		SetTitle(title).
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
	title string,
	body string,
	metadata map[string]interface{},
) (*ent.Node, error) {
	return r.client.Node.UpdateOneID(id).
		SetTitle(title).
		SetBody(body).
		SetMetadata(metadata).
		Save(ctx)
}

// DeleteNode performs a CASCADING delete of the node and all its dependencies
func (r *NodeRepository) DeleteNode(ctx context.Context, id uuid.UUID) error {
	// 1. Start a transaction to ensure atomicity
	tx, err := r.client.Tx(ctx)
	if err != nil {
		return fmt.Errorf("starting transaction: %w", err)
	}

	// 2. Perform recursive delete
	if err := r.deleteNodeRecursive(ctx, tx, id); err != nil {
		if rerr := tx.Rollback(); rerr != nil {
			return fmt.Errorf("rolling back transaction: %v (original error: %w)", rerr, err)
		}
		return err
	}

	// 3. Commit the transaction
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("committing transaction: %w", err)
	}

	return nil
}

// deleteNodeRecursive handles the deletion order: Children -> Closures -> Associations -> Attempts/Cards -> Node
func (r *NodeRepository) deleteNodeRecursive(ctx context.Context, tx *ent.Tx, id uuid.UUID) error {
	// A. Recursively delete children first (Depth-First)
	childIDs, err := tx.Node.Query().
		Where(node.ParentIDEQ(id)).
		IDs(ctx)
	if err != nil {
		return fmt.Errorf("querying children: %w", err)
	}

	for _, childID := range childIDs {
		if err := r.deleteNodeRecursive(ctx, tx, childID); err != nil {
			return err
		}
	}

	// B. Delete Node Closures (where node is Ancestor OR Descendant)
	_, err = tx.NodeClosure.Delete().
		Where(
			nodeclosure.Or(
				nodeclosure.AncestorIDEQ(id),
				nodeclosure.DescendantIDEQ(id),
			),
		).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting node closures: %w", err)
	}

	// C. Delete Node Associations (where node is Source OR Target)
	_, err = tx.NodeAssociation.Delete().
		Where(
			nodeassociation.Or(
				nodeassociation.SourceIDEQ(id),
				nodeassociation.TargetIDEQ(id),
			),
		).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting associations: %w", err)
	}

	// D. Delete FSRS Card and Attempts
	cardID, err := tx.FsrsCard.Query().
		Where(fsrscard.NodeIDEQ(id)).
		OnlyID(ctx)

	if err == nil {
		// Card found: Delete associated attempts first
		_, err = tx.Attempt.Delete().
			Where(attempt.CardIDEQ(cardID)).
			Exec(ctx)
		if err != nil {
			return fmt.Errorf("deleting attempts: %w", err)
		}

		// Delete the Card
		if err := tx.FsrsCard.DeleteOneID(cardID).Exec(ctx); err != nil {
			return fmt.Errorf("deleting fsrs card: %w", err)
		}
	} else if !ent.IsNotFound(err) {
		// Real error occurred
		return fmt.Errorf("querying fsrs card: %w", err)
	}

	// E. Delete the Node itself
	if err := tx.Node.DeleteOneID(id).Exec(ctx); err != nil {
		return fmt.Errorf("deleting node %s: %w", id, err)
	}

	return nil
}

// GetDescendants returns all descendants using closure table
func (r *NodeRepository) GetDescendants(ctx context.Context, ancestorID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.HasParentClosuresWith(nodeclosure.AncestorID(ancestorID))).
		All(ctx)
}

// CreateAssociation links two nodes with automatic ID ordering
func (r *NodeRepository) CreateAssociation(ctx context.Context, sourceID, targetID uuid.UUID, relType nodeassociation.RelType) error {
	if sourceID == targetID {
		return fmt.Errorf("cannot associate node with itself")
	}

	// IMPORTANT: Ensure source_id < target_id to satisfy CHECK constraint
	if sourceID.String() > targetID.String() {
		// Swap if needed
		sourceID, targetID = targetID, sourceID
	}

	return r.client.NodeAssociation.Create().
		SetSourceID(sourceID).
		SetTargetID(targetID).
		SetRelType(relType).
		Exec(ctx)
}

// GetNodeAssociations returns all associations for a given node (both as source and target)
func (r *NodeRepository) GetNodeAssociations(ctx context.Context, nodeID uuid.UUID) ([]*ent.NodeAssociation, error) {
	return r.client.NodeAssociation.Query().
		Where(
			nodeassociation.Or(
				nodeassociation.SourceIDEQ(nodeID),
				nodeassociation.TargetIDEQ(nodeID),
			),
		).
		WithSource().
		WithTarget().
		All(ctx)
}

// GetRelatedNodesByType returns nodes related by specific relationship type
func (r *NodeRepository) GetRelatedNodesByType(
	ctx context.Context,
	nodeID uuid.UUID,
	relType nodeassociation.RelType,
	asSource bool,
) ([]*ent.Node, error) {

	if asSource {
		// Current node is source -> find target nodes
		return r.client.Node.Query().
			Where(
				node.HasIncomingAssociationsWith(
					nodeassociation.And(
						nodeassociation.SourceIDEQ(nodeID),
						nodeassociation.RelTypeEQ(relType),
					),
				),
			).
			All(ctx)
	} else {
		// Current node is target -> find source nodes
		return r.client.Node.Query().
			Where(
				node.HasOutgoingAssociationsWith(
					nodeassociation.And(
						nodeassociation.TargetIDEQ(nodeID),
						nodeassociation.RelTypeEQ(relType),
					),
				),
			).
			All(ctx)
	}
}

// GetSubjects returns all root nodes (Subjects)
func (r *NodeRepository) GetSubjects(ctx context.Context) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.TypeEQ(node.TypeSubject)).
		Order(ent.Asc(node.FieldTitle)).
		All(ctx)
}

// GetChildren returns direct children of a parent
func (r *NodeRepository) GetChildren(ctx context.Context, parentID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(node.ParentIDEQ(parentID)).
		Order(ent.Asc(node.FieldType), ent.Asc(node.FieldTitle)).
		All(ctx)
}

// GetNode returns a single node's details
func (r *NodeRepository) GetNode(ctx context.Context, id uuid.UUID) (*ent.Node, error) {
	return r.client.Node.Get(ctx, id)
}

// SearchNodes finds nodes by title or body
func (r *NodeRepository) SearchNodes(ctx context.Context, query string) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(
			node.Or(
				node.TitleContainsFold(query),
				node.BodyContainsFold(query),
			),
		).
		Limit(20).
		All(ctx)
}

// internal/data/node_repository.go
func (r *NodeRepository) GetNodeBreadcrumbs(ctx context.Context, id uuid.UUID) ([]*ent.Node, error) {
	path := []*ent.Node{}
	currentID := id
	visited := make(map[uuid.UUID]bool) // Prevent cycles

	for depth := 0; depth < 10; depth++ {
		if visited[currentID] {
			break // Circular reference detected
		}
		visited[currentID] = true

		node, err := r.client.Node.Get(ctx, currentID)
		if err != nil {
			return path, nil // Return what we have so far
		}

		// Prepend to reverse order
		path = append([]*ent.Node{node}, path...)

		// 1. Check if the pointer is nil (common for optional fields in ent)
		// 2. Check if the dereferenced value is the "Nil" UUID
		if node.ParentID == nil || *node.ParentID == uuid.Nil {
			break
		}

		// 3. Assign the dereferenced value to currentID
		currentID = *node.ParentID
	}

	return path, nil
}
