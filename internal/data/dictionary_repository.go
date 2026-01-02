package data

import (
	"context"
	"fmt"

	"profen/internal/data/ent"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"

	"github.com/google/uuid"
)

type DictionaryRepository struct {
	client *ent.Client
}

func NewDictionaryRepository(client *ent.Client) *DictionaryRepository {
	return &DictionaryRepository{client: client}
}

// internal/data/dictionary_repository.go

func (r *DictionaryRepository) CreateTermPair(
	ctx context.Context,
	nativeTerm string,
	foreignTerm string,
	metadata map[string]interface{},
) (*ent.Node, *ent.Node, error) {

	// NO TRANSACTION (for now) to support Hooks using global client

	// 1. Create Native Node
	nativeNode, err := r.client.Node.Create().
		SetType(node.TypeTerm).
		SetBody(nativeTerm).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("creating native term: %w", err)
	}

	// 2. Create Foreign Node
	foreignNode, err := r.client.Node.Create().
		SetType(node.TypeTerm).
		SetBody(foreignTerm).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		// Cleanup native if foreign fails?
		// For MVP, ignore. Ideally, delete nativeNode.
		return nil, nil, fmt.Errorf("creating foreign term: %w", err)
	}

	// 3. Link Foreign -> Native
	_, err = r.client.NodeAssociation.Create().
		SetSourceID(foreignNode.ID).
		SetTargetID(nativeNode.ID).
		SetRelType(nodeassociation.RelTypeTranslationOf).
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("linking foreign->native: %w", err)
	}

	// 4. Link Native -> Foreign
	_, err = r.client.NodeAssociation.Create().
		SetSourceID(nativeNode.ID).
		SetTargetID(foreignNode.ID).
		SetRelType(nodeassociation.RelTypeTranslatedFrom).
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("linking native->foreign: %w", err)
	}

	return nativeNode, foreignNode, nil
}

func (r *DictionaryRepository) GetTranslation(ctx context.Context, nodeID uuid.UUID) ([]*ent.Node, error) {
	// Return nodes where:
	// (They are Target AND Source=Me AND Type='translated_from')
	// OR
	// (They are Source AND Target=Me AND Type='translation_of')

	return r.client.Node.Query().
		Where(
			node.Or(
				// Forward link
				node.HasIncomingAssociationsWith(
					nodeassociation.SourceID(nodeID),
					nodeassociation.RelTypeEQ(nodeassociation.RelTypeTranslatedFrom),
				),
				// Reverse link
				node.HasOutgoingAssociationsWith(
					nodeassociation.TargetID(nodeID),
					nodeassociation.RelTypeEQ(nodeassociation.RelTypeTranslationOf),
				),
			),
		).
		All(ctx)
}
