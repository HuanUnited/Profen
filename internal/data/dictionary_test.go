package data_test

import (
	"context"
	"testing"

	"profen/internal/data"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestDictionary_DualCreation(t *testing.T) {
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// ✅ Register Hooks BEFORE any operations
	client.Node.Use(hooks.NodeClosureHook(client))
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()
	// Clean in correct order (foreign key dependencies)
	client.Attempt.Delete().ExecX(ctx) // ✅ FIRST
	client.NodeAssociation.Delete().ExecX(ctx)
	client.FsrsCard.Delete().ExecX(ctx)
	client.NodeClosure.Delete().ExecX(ctx)
	client.Node.Delete().ExecX(ctx)

	repo := data.NewDictionaryRepository(client)

	// 1. Create Pair
	src, target, err := repo.CreateTermPair(ctx, "Dog", "Sobaka", nil)
	require.NoError(t, err)

	// 2. Verify Cards Created (Hook Check)
	hasCardSrc, _ := client.FsrsCard.Query().Where(fsrscard.NodeID(src.ID)).Exist(ctx)
	assert.True(t, hasCardSrc, "Source term should have an FSRS card")

	hasCardTgt, _ := client.FsrsCard.Query().Where(fsrscard.NodeID(target.ID)).Exist(ctx)
	assert.True(t, hasCardTgt, "Target term should have an FSRS card")

	// 3. Verify Link
	links, err := repo.GetTranslation(ctx, src.ID)
	require.NoError(t, err)
	require.Len(t, links, 1)
	assert.Equal(t, target.Body, links[0].Body)
}
