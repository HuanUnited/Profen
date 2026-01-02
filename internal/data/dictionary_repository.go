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

	// LINKING LOGIC (Respecting Check Constraint source < target)
	var sourceID, targetID uuid.UUID
	var relType nodeassociation.RelType

	// Compare UUIDs (Lexicographical string comparison is sufficient for logic)
	if nativeNode.ID.String() < foreignNode.ID.String() {
		sourceID = nativeNode.ID
		targetID = foreignNode.ID
		// Source is Native ("Dog"). Relation: "Dog is translated from Sobaka"?
		// Or "Dog defines Sobaka"?
		// Let's use 'translated_from' as the directed edge from Native -> Foreign
		relType = nodeassociation.RelTypeTranslatedFrom
	} else {
		sourceID = foreignNode.ID
		targetID = nativeNode.ID
		// Source is Foreign ("Sobaka"). Relation: "Sobaka is translation of Dog"
		relType = nodeassociation.RelTypeTranslationOf
	}

	_, err = r.client.NodeAssociation.Create().
		SetSourceID(sourceID).
		SetTargetID(targetID).
		SetRelType(relType).
		Save(ctx)

	if err != nil {
		return nil, nil, fmt.Errorf("linking terms: %w", err)
	}

	return nativeNode, foreignNode, nil
}

func (r *DictionaryRepository) GetTranslation(ctx context.Context, nodeID uuid.UUID) ([]*ent.Node, error) {
	return r.client.Node.Query().
		Where(
			node.Or(
				// Look for partners where I am the Source
				node.HasOutgoingAssociationsWith(
					nodeassociation.RelTypeIn(
						nodeassociation.RelTypeTranslatedFrom,
						nodeassociation.RelTypeTranslationOf,
					),
				),
				// Look for partners where I am the Target
				node.HasIncomingAssociationsWith(
					nodeassociation.RelTypeIn(
						nodeassociation.RelTypeTranslatedFrom,
						nodeassociation.RelTypeTranslationOf,
					),
				),
			),
		).
		All(ctx)
}
