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

// CreateTermPair creates a bi-directional translation pair.
func (r *DictionaryRepository) CreateTermPair(
	ctx context.Context,
	nativeTerm string, // e.g., "Dog"
	foreignTerm string, // e.g., "Sobaka"
	metadata map[string]interface{},
) (*ent.Node, *ent.Node, error) {

	tx, err := r.client.Tx(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("starting transaction: %w", err)
	}

	defer func() {
		if v := recover(); v != nil {
			tx.Rollback()
			panic(v) // Propagate panic
		}
		// If normal error occurred, rollback
		if err != nil {
			tx.Rollback()
		}
	}()

	// 1. Create Native Node ("Dog")
	nativeNode, err := tx.Node.Create().
		SetType(node.TypeTerm).
		SetBody(nativeTerm).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("creating native term: %w", err)
	}

	// 2. Create Foreign Node ("Sobaka")
	foreignNode, err := tx.Node.Create().
		SetType(node.TypeTerm).
		SetBody(foreignTerm).
		SetMetadata(metadata).
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("creating foreign term: %w", err)
	}

	// 3. Link: Foreign is a translation OF Native
	// Sobaka -> translation_of -> Dog
	_, err = tx.NodeAssociation.Create().
		SetSourceID(foreignNode.ID).
		SetTargetID(nativeNode.ID).
		SetRelType(nodeassociation.RelTypeTranslationOf). // Use your specific Enum
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("linking foreign->native: %w", err)
	}

	// 4. Link: Native is translated FROM Foreign (Optional, or implies the reverse)
	// Dog -> translated_from -> Sobaka
	// Note: Usually one direction is enough if your queries check both,
	// but explicit bi-direction allows strictly directed graph traversals.
	_, err = tx.NodeAssociation.Create().
		SetSourceID(nativeNode.ID).
		SetTargetID(foreignNode.ID).
		SetRelType(nodeassociation.RelTypeTranslatedFrom). // Use your specific Enum
		Save(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("linking native->foreign: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return nil, nil, fmt.Errorf("committing transaction: %w", err)
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
