package hooks_test

import (
	"context"
	"testing"

	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFsrsCardInitHook(t *testing.T) {
	dsn := "host=localhost port=5432 user=postgres dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// Register Hook
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()
	client.FsrsCard.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	// Create a Problem Node
	problem, err := client.Node.Create().
		SetType(node.TypeProblem).
		SetBody("What is 2+2?").
		Save(ctx)
	require.NoError(t, err)

	// Verify Card Exists
	card, err := client.FsrsCard.Query().
		Where(fsrscard.NodeID(problem.ID)).
		Only(ctx)

	require.NoError(t, err, "FSRS Card should be auto-created")
	assert.Equal(t, fsrscard.StateNew, card.State)
	assert.Equal(t, 0.0, card.Stability)
}
