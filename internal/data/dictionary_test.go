package data_test

import (
	"context"
	"testing"

	"profen/internal/data"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/nodeassociation"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDictionary_DualCreation(t *testing.T) {
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// Register Hooks (Required for FSRS Card creation)
	client.Node.Use(hooks.FsrsCardInitHook(client))
	client.Node.Use(hooks.NodeClosureHook(client))

	ctx := context.Background()
	// Clean
	client.NodeAssociation.Delete().Exec(ctx)
	client.FsrsCard.Delete().Exec(ctx)
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	repo := data.NewDictionaryRepository(client)

	// 1. Create Pair
	src, target, err := repo.CreateTermPair(ctx, "Dog", "Sobaka", nil)
	require.NoError(t, err)

	// 2. Verify Cards Created (Hook Check)
	// Check Source Card
	hasCardSrc, _ := client.FsrsCard.Query().Where(fsrscard.NodeID(src.ID)).Exist(ctx)
	assert.True(t, hasCardSrc, "Source term should have an FSRS card")

	// Check Target Card
	hasCardTgt, _ := client.FsrsCard.Query().Where(fsrscard.NodeID(target.ID)).Exist(ctx)
	assert.True(t, hasCardTgt, "Target term should have an FSRS card")

	// 3. Verify Link (Association Check)
	links, err := repo.GetTranslation(ctx, src.ID)
	require.NoError(t, err)
	require.Len(t, links, 1)
	assert.Equal(t, target.Body, links[0].Body)

	// Robust verification: Check that *some* association exists between them
	// regardless of direction.
	count, _ := client.NodeAssociation.Query().
		Where(
			nodeassociation.RelTypeIn(
				nodeassociation.RelTypeTranslationOf,
				nodeassociation.RelTypeTranslatedFrom,
			),
			nodeassociation.Or(
				nodeassociation.And(
					nodeassociation.SourceID(src.ID),
					nodeassociation.TargetID(target.ID),
				),
				nodeassociation.And(
					nodeassociation.SourceID(target.ID),
					nodeassociation.TargetID(src.ID),
				),
			),
		).
		Count(ctx)

	assert.Equal(t, 1, count, "Should have exactly 1 translation link")
}
