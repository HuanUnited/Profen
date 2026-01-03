package service

import (
	"context"
	"testing"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test DSN for PostgreSQL (adjust to match your local setup)
const testDSN = "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"

func setupTestClient(t *testing.T) (*ent.Client, context.Context) {
	client := enttest.Open(t, "postgres", testDSN)

	// Register hooks
	client.Node.Use(hooks.NodeClosureHook(client))
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()

	// Cleanup in correct order (delete children before parents)
	client.Attempt.Delete().ExecX(ctx)
	client.ErrorResolution.Delete().ExecX(ctx)
	client.FsrsCard.Delete().ExecX(ctx)
	client.NodeAssociation.Delete().ExecX(ctx)
	client.NodeClosure.Delete().ExecX(ctx)
	client.Node.Delete().ExecX(ctx)

	return client, ctx
}

func TestGetNodeWithCard(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	// Create test node
	testNode := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test Problem").
		SetBody("Solve x^2 = 4").
		SaveX(ctx)

	// Card should be auto-created by hook - verify it exists
	_, err := client.FsrsCard.Query().
		Where(fsrscard.NodeID(testNode.ID)).
		Only(ctx)
	require.NoError(t, err)

	// Test GetNodeWithCard
	result, err := coordinator.GetNodeWithCard(ctx, testNode.ID)
	require.NoError(t, err)

	assert.Equal(t, testNode.ID.String(), result["id"])
	assert.Equal(t, "Test Problem", result["title"])
	assert.Equal(t, "Solve x^2 = 4", result["body"])
	assert.Equal(t, node.TypeProblem, result["type"])
	assert.Equal(t, fsrscard.StateNew, result["card_state"])
	assert.Equal(t, 0, result["current_step"])
	assert.NotNil(t, result["stability"])
}

func TestGetDueCardsQueue(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	// Create 3 problems with different due dates
	now := time.Now()

	problem1 := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Overdue Problem").
		SetBody("Due yesterday").
		SaveX(ctx)

	problem2 := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Due Today").
		SetBody("Due now").
		SaveX(ctx)

	problem3 := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Future Problem").
		SetBody("Due tomorrow").
		SaveX(ctx)

	// Update card due dates
	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem1.ID)).
		SetDue(now.Add(-24 * time.Hour)). // Yesterday
		ExecX(ctx)

	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem2.ID)).
		SetDue(now.Add(-1 * time.Hour)). // 1 hour ago
		ExecX(ctx)

	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem3.ID)).
		SetDue(now.Add(24 * time.Hour)). // Tomorrow
		ExecX(ctx)

	// Get due cards (should return 2: problem1 and problem2)
	ids, err := coordinator.GetDueCardsQueue(ctx, 10)
	require.NoError(t, err)

	assert.Len(t, ids, 2)
	// Should be sorted by due date (oldest first)
	assert.Equal(t, problem1.ID.String(), ids[0])
	assert.Equal(t, problem2.ID.String(), ids[1])
}

func TestGetDueCardsFromNode(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	// Create hierarchy: Subject -> Topic -> Problem
	subject := client.Node.Create().
		SetType(node.TypeSubject).
		SetTitle("Math").
		SetBody("Mathematics").
		SaveX(ctx)

	topic := client.Node.Create().
		SetType(node.TypeTopic).
		SetTitle("Algebra").
		SetBody("Algebraic equations").
		SetParentID(subject.ID).
		SaveX(ctx)

	problem := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Solve quadratic").
		SetBody("x^2 - 5x + 6 = 0").
		SetParentID(topic.ID).
		SaveX(ctx)

	// Make card due
	now := time.Now()
	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem.ID)).
		SetDue(now.Add(-1 * time.Hour)).
		ExecX(ctx)

	// Get due cards from Subject (should include problem via closure)
	ids, err := coordinator.GetDueCardsFromNode(ctx, subject.ID, 10)
	require.NoError(t, err)

	assert.Len(t, ids, 1)
	assert.Equal(t, problem.ID.String(), ids[0])
}

func TestGetDueCardsFromNode_LearningState(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	// Create subject and problem
	subject := client.Node.Create().
		SetType(node.TypeSubject).
		SetTitle("Physics").
		SaveX(ctx)

	problem := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Newton's Law").
		SetParentID(subject.ID).
		SaveX(ctx)

	// Set card to Learning state (even if due date is future)
	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem.ID)).
		SetState(fsrscard.StateLearning).
		SetCurrentStep(1).
		SetDue(time.Now().Add(10 * time.Minute)). // Future date
		ExecX(ctx)

	// Should still be included because of Learning state
	ids, err := coordinator.GetDueCardsFromNode(ctx, subject.ID, 10)
	require.NoError(t, err)

	assert.Len(t, ids, 1)
	assert.Equal(t, problem.ID.String(), ids[0])
}

func TestGetDueCardsQueue_Limit(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	now := time.Now()

	// Create 5 due problems
	for i := 0; i < 5; i++ {
		problem := client.Node.Create().
			SetType(node.TypeProblem).
			SetTitle("Problem " + string(rune(i+'0'))).
			SaveX(ctx)

		client.FsrsCard.Update().
			Where(fsrscard.NodeID(problem.ID)).
			SetDue(now.Add(-1 * time.Hour)).
			ExecX(ctx)
	}

	// Request only 3
	ids, err := coordinator.GetDueCardsQueue(ctx, 3)
	require.NoError(t, err)

	assert.Len(t, ids, 3)
}

func TestGetDueCardsFromNode_OnlyLeafNodes(t *testing.T) {
	client, ctx := setupTestClient(t)
	defer client.Close()

	coordinator := NewStudyCoordinator(client)

	now := time.Now()

	// Create hierarchy: Subject -> Topic -> Problem
	subject := client.Node.Create().
		SetType(node.TypeSubject).
		SetTitle("Science").
		SaveX(ctx)

	topic := client.Node.Create().
		SetType(node.TypeTopic).
		SetTitle("Biology").
		SetParentID(subject.ID).
		SaveX(ctx)

	theory := client.Node.Create().
		SetType(node.TypeTheory).
		SetTitle("Cell Theory").
		SetParentID(topic.ID).
		SaveX(ctx)

	problem := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Mitosis Question").
		SetParentID(topic.ID).
		SaveX(ctx)

	// Make both cards due
	client.FsrsCard.Update().
		Where(fsrscard.NodeID(theory.ID)).
		SetDue(now.Add(-1 * time.Hour)).
		ExecX(ctx)

	client.FsrsCard.Update().
		Where(fsrscard.NodeID(problem.ID)).
		SetDue(now.Add(-1 * time.Hour)).
		ExecX(ctx)

	// Get due cards from Subject
	// Should return both Theory and Problem (both are leaf nodes)
	ids, err := coordinator.GetDueCardsFromNode(ctx, subject.ID, 10)
	require.NoError(t, err)

	assert.Len(t, ids, 2)
	// Verify both leaf nodes are included
	idSet := make(map[string]bool)
	for _, id := range ids {
		idSet[id] = true
	}
	assert.True(t, idSet[theory.ID.String()])
	assert.True(t, idSet[problem.ID.String()])
}
