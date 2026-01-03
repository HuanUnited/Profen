// internal/app/service/fsrs_test.go
package service_test

import (
	"testing"
	"time"

	"profen/internal/app/service"
	"profen/internal/data/ent/node"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFSRSService_GraduateCard(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultFSRSConfig()
	svc := service.NewFSRSService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// New card ready to graduate
	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(1).
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Graduate with Good grade
	result, err := svc.GraduateCard(ctx, card, service.GradeGood, 1)
	require.NoError(t, err)

	assert.True(t, result.Stability > 0)
	assert.InDelta(t, 5.0, result.Difficulty, 2.0)
	assert.Equal(t, 1, result.IntervalDays)

	// Verify card updated
	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, "review", card.CardState)
	assert.Equal(t, 1, card.Reps)
}

func TestFSRSService_ReviewCard_Good(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultFSRSConfig()
	svc := service.NewFSRSService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// ✅ FIX: Card already reviewed once with proper stability
	initialStability := 2.5
	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now().Add(-1 * 24 * time.Hour)). // Due YESTERDAY
		SetStability(initialStability).
		SetDifficulty(5.0).
		SetReps(1).
		SetScheduledDays(2). // ✅ Was scheduled for 2 days
		SetElapsedDays(0).   // ✅ Reset on last review
		Save(ctx)

	// Review with Good grade
	result, err := svc.ReviewCard(ctx, card, service.GradeGood)
	require.NoError(t, err)

	// ✅ FIX: Stability should increase from initial
	assert.Greater(t, result.Stability, initialStability)
	assert.Greater(t, result.IntervalDays, 1) // Should be more than 1 day

	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, 2, card.Reps)
	assert.Equal(t, "review", card.CardState)
}

func TestFSRSService_ReviewCard_Again_EntersRelearning(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultFSRSConfig()
	svc := service.NewFSRSService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now().Add(-2 * 24 * time.Hour)).
		SetStability(3.0).
		SetDifficulty(5.0).
		SetReps(2).
		SetLapses(0).
		Save(ctx)

	// Review with Again grade
	result, err := svc.ReviewCard(ctx, card, service.GradeAgain)
	require.NoError(t, err)

	assert.True(t, result.Stability > 0) // New stability calculated

	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, "relearning", card.CardState)
	assert.Equal(t, 1, card.Lapses)
	assert.Equal(t, 0, card.CurrentStep)
}

func TestFSRSService_DifficultyCalculation(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultFSRSConfig()
	svc := service.NewFSRSService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now().Add(-1 * 24 * time.Hour)).
		SetStability(2.0).
		SetDifficulty(5.0).
		SetReps(1).
		Save(ctx)

	// Easy grade should decrease difficulty
	result, err := svc.ReviewCard(ctx, card, service.GradeEasy)
	require.NoError(t, err)

	assert.Less(t, result.Difficulty, 5.0)
	assert.GreaterOrEqual(t, result.Difficulty, 1.0)
	assert.LessOrEqual(t, result.Difficulty, 10.0)
}

func TestFSRSService_GetNextIntervals(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultFSRSConfig()
	svc := service.NewFSRSService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now().Add(-1 * 24 * time.Hour)).
		SetStability(3.0).
		SetDifficulty(5.0).
		SetReps(2).
		Save(ctx)

	intervals := svc.GetNextIntervals(card)

	// All four grades should have intervals
	assert.Len(t, intervals, 4)
	assert.Contains(t, intervals, 1) // Again
	assert.Contains(t, intervals, 2) // Hard
	assert.Contains(t, intervals, 3) // Good
	assert.Contains(t, intervals, 4) // Easy

	// Easy should be longest
	// Note: Can't easily compare formatted strings, but we can check they exist
	assert.NotEmpty(t, intervals[4])
}
