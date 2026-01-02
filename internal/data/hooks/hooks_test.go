package hooks_test

import (
	"context"
	"testing"

	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeclosure"
	"profen/internal/data/hooks" // Import your hooks package

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNodeClosureHook(t *testing.T) {
	// Adjust connection string to your test DB
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"

	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	ctx := context.Background()

	// 1. Cleanup
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	// 2. REGISTER THE HOOK (Must happen before Create calls)
	client.Node.Use(hooks.NodeClosureHook(client))

	// 3. Create Data
	root, err := client.Node.Create().
		SetType(node.TypeSubject).
		SetBody("Root").
		Save(ctx)
	require.NoError(t, err)

	child, err := client.Node.Create().
		SetType(node.TypeTopic).
		SetParentID(root.ID).
		SetBody("Child").
		Save(ctx)
	require.NoError(t, err)

	grandchild, err := client.Node.Create().
		SetType(node.TypeTheory).
		SetParentID(child.ID).
		SetBody("Grandchild").
		Save(ctx)
	require.NoError(t, err)

	// 4. Validation
	// Check Root descendants
	count, err := client.NodeClosure.Query().
		Where(nodeclosure.AncestorID(root.ID)).
		Count(ctx)
	require.NoError(t, err)
	assert.Equal(t, 3, count, "Root should have 3 descendants (self, child, grandchild)")

	// Check Depth
	path, err := client.NodeClosure.Query().
		Where(
			nodeclosure.AncestorID(root.ID),
			nodeclosure.DescendantID(grandchild.ID),
		).
		Only(ctx)

	// If this fails, require stops the test (No panic)
	require.NoError(t, err, "Closure path from Root to Grandchild missing")
	assert.Equal(t, 2, path.Depth, "Depth should be 2")
}
