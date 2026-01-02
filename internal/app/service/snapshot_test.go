package service_test

import (
	"context"
	"testing"

	"profen/internal/app/service"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"
	"profen/internal/data/ent/nodeassociation"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestExportSnapshot(t *testing.T) {
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	client.Node.Use(hooks.NodeClosureHook(client))
	// client.Node.Use(hooks.FsrsCardInitHook(client)) // Not strictly needed for snapshot but good practice

	ctx := context.Background()
	// Cleanup
	client.ErrorResolution.Delete().Exec(ctx)
	client.NodeAssociation.Delete().Exec(ctx)
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	svc := service.NewSnapshotService(client)

	// 1. Setup Data
	// Subject -> Topic
	subject, _ := client.Node.Create().SetType(node.TypeSubject).SetBody("Math").Save(ctx)
	topic, _ := client.Node.Create().SetType(node.TypeTopic).SetParentID(subject.ID).SetBody("Algebra").Save(ctx)

	// Theory
	theory, _ := client.Node.Create().SetType(node.TypeTheory).SetParentID(topic.ID).SetBody("Linear Eq").Save(ctx)

	// Problem
	problem, _ := client.Node.Create().SetType(node.TypeProblem).SetParentID(topic.ID).SetBody("Solve 2x=4").Save(ctx)

	// Force ID order compliance
	src, tgt := problem.ID, theory.ID
	if src.String() > tgt.String() {
		src, tgt = tgt, src
	}

	// Link Problem -> Theory (Tests)
	client.NodeAssociation.Create().
		SetSourceID(problem.ID).
		SetTargetID(theory.ID).
		SetRelType(nodeassociation.RelTypeTests). // Verify this Enum exists!
		Save(ctx)

	// 2. Run Export
	snap, err := svc.ExportSnapshot(ctx, problem.ID)
	require.NoError(t, err)

	// 3. Validation
	assert.Equal(t, "Solve 2x=4", snap.TargetNode.Body)

	// Ancestry: Should contain "Algebra" and "Math"
	// Note: Order depends on Depth sort. Root (Math) usually deepest?
	// Or Self (0), Parent (1), Root (2).
	assert.Contains(t, snap.AncestryPath, "Algebra")
	assert.Contains(t, snap.AncestryPath, "Math")

	// Related Theory
	require.NotNil(t, snap.RelatedTheory)
	assert.Equal(t, "Linear Eq", snap.RelatedTheory.Body)
}
