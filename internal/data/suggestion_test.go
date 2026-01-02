package data_test

import (
	"context"
	"testing"

	"profen/internal/data"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSuggestionEngine_DiagnosticGaps(t *testing.T) {
	dsn := "host=localhost port=5432 user=postgres dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// Register Hooks
	client.Node.Use(hooks.NodeClosureHook(client))
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()

	// Cleanup
	client.ErrorResolution.Delete().Exec(ctx)
	client.FsrsCard.Delete().Exec(ctx)
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	repo := data.NewSuggestionRepository(client)

	// 1. Setup Hierarchy
	// Topic: Math
	topic, _ := client.Node.Create().
		SetType(node.TypeTopic).
		SetBody("Math").
		Save(ctx)

	// Problem A (Small Error)
	probA, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetParentID(topic.ID).
		SetBody("Problem A").
		Save(ctx)

	// Problem B (Big Error)
	probB, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetParentID(topic.ID).
		SetBody("Problem B").
		Save(ctx)

	// Problem C (No Error)
	client.Node.Create().
		SetType(node.TypeProblem).
		SetParentID(topic.ID).
		SetBody("Problem C").
		Save(ctx)

	// 2. Inject Errors
	// Error on A: Weight 1.0
	client.ErrorResolution.Create().
		SetNodeID(probA.ID).
		SetErrorType("calc").
		SetWeightImpact(1.0).
		SetIsResolved(false).
		Save(ctx)

	// Error on B: Weight 5.0 (Critical)
	client.ErrorResolution.Create().
		SetNodeID(probB.ID).
		SetErrorType("concept").
		SetWeightImpact(5.0).
		SetIsResolved(false).
		Save(ctx)

	// Resolved Error on B (Should be ignored)
	client.ErrorResolution.Create().
		SetNodeID(probB.ID).
		SetErrorType("typo").
		SetWeightImpact(10.0).
		SetIsResolved(true). // <--- Resolved!
		Save(ctx)

	// 3. Run Query
	suggestions, err := repo.GetDiagnosticGaps(ctx, topic.ID, 10)
	require.NoError(t, err)

	// 4. Assertions
	require.Len(t, suggestions, 2, "Should return exactly 2 problems (A and B)")

	// Check Order: B should be first because Weight 5.0 > Weight 1.0
	assert.Equal(t, probB.ID, suggestions[0].ID, "Problem B (Critical) should be first")
	assert.Equal(t, probA.ID, suggestions[1].ID, "Problem A (Minor) should be second")
}
