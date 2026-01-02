package data_test

import (
	"context"
	"fmt"
	"testing"
	"time"

	"profen/internal/data"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

func TestBlock1Performance(t *testing.T) {
	// 1. Setup Postgres
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// REGISTER HOOK
	client.Node.Use(hooks.NodeClosureHook(client))

	ctx := context.Background()
	repo := data.NewNodeRepository(client)

	// Clean Start
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	fmt.Println("🌳 Seeding 5-level hierarchy...")

	// 2. Seed Data (Subject -> 5 Topics -> 5 Problems each -> ...)
	// Let's create a deep chain to stress the JOIN
	// Level 1: Subject
	subject, _ := repo.CreateNode(ctx, node.TypeSubject, uuid.Nil, "Math", nil)

	// Level 2: 5 Topics
	for i := 0; i < 5; i++ {
		topic, _ := repo.CreateNode(ctx, node.TypeTopic, subject.ID, fmt.Sprintf("Topic %d", i), nil)

		// Level 3: 5 Theories per Topic
		for j := 0; j < 5; j++ {
			theory, _ := repo.CreateNode(ctx, node.TypeTheory, topic.ID, fmt.Sprintf("Theory %d-%d", i, j), nil)

			// Level 4: 5 Problems per Theory
			for k := 0; k < 5; k++ {
				_, err := repo.CreateNode(ctx, node.TypeProblem, theory.ID, fmt.Sprintf("Problem %d-%d-%d", i, j, k), nil)
				require.NoError(t, err)
			}
		}
	}
	// Total Nodes: 1 (Sub) + 5 (Top) + 25 (Th) + 125 (Prob) = 156 nodes
	// Closure Rows: 156 (self) + 156*Depth ~ 500-600 rows.

	// 3. The Benchmark
	start := time.Now()
	descendants, err := repo.GetDescendants(ctx, subject.ID)
	duration := time.Since(start)

	require.NoError(t, err)

	fmt.Printf("⚡ Retrieved %d nodes in %v\n", len(descendants), duration)

	if duration > 10*time.Millisecond {
		t.Errorf("❌ Performance Fail: Took %v (Limit 10ms)", duration)
	} else {
		fmt.Println("✅ Block 1 Success: Graph Traversal is fast.")
	}
}
