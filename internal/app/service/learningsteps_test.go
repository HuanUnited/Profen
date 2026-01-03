// internal/app/service/learningsteps_test.go
package service_test

import (
	"context"
	"testing"
	"time"

	"profen/internal/app/service"
	"profen/internal/data/ent"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestDB(t *testing.T) (*ent.Client, context.Context) {
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	ctx := context.Background()

	// Cleanup
	client.Attempt.Delete().Exec(ctx)
	client.FsrsCard.Delete().Exec(ctx)
	client.NodeClosure.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	return client, ctx
}

// internal/app/service/learningsteps_test.go

func TestLearningStepsService_NewCard(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.LearningStepsConfig{
		LearningSteps:      []int{10, 30},
		RelearningSteps:    []int{10},
		GraduatingInterval: 1,
		EasyInterval:       4,
	}
	svc := service.NewLearningStepsService(client, config)

	// Create a new card
	testNode, err := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test Problem").
		SetBody("What is 2+2?").
		Save(ctx)
	require.NoError(t, err)

	card, err := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("new").
		SetCurrentStep(0). // NEW card at step 0
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)
	require.NoError(t, err)

	// ✅ FIX: Grade 3 on NEW card (step 0) moves to step 1 (30m), not step 0 (10m)
	result, err := svc.ProcessReview(ctx, card, 3)
	require.NoError(t, err)

	assert.Equal(t, service.StateLearning, result.NextState)
	assert.Equal(t, 1, result.CurrentStep)         // Step 0 + 1 = 1
	assert.Equal(t, "30m", result.IntervalDisplay) // LearningSteps[1] = 30
	assert.False(t, result.ShouldGraduate)

	// Reload card to verify state
	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, "learning", card.CardState)
	assert.Equal(t, 1, card.CurrentStep)
}

func TestLearningStepsService_GradeAgain_ResetsProgress(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultLearningConfig()
	svc := service.NewLearningStepsService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// Card already in learning at step 1
	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(1).
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Grade 1 (Again) should reset to step 0
	result, err := svc.ProcessReview(ctx, card, 1)
	require.NoError(t, err)

	assert.Equal(t, service.StateLearning, result.NextState)
	assert.Equal(t, 0, result.CurrentStep)
	assert.Equal(t, "10m", result.IntervalDisplay)

	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, 0, card.CurrentStep)
}

func TestLearningStepsService_GradeEasy_ImmediateGraduation(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultLearningConfig()
	svc := service.NewLearningStepsService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(0).
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Grade 4 (Easy) should graduate immediately
	result, err := svc.ProcessReview(ctx, card, 4)
	require.NoError(t, err)

	assert.Equal(t, service.StateReview, result.NextState)
	assert.True(t, result.ShouldGraduate)
	assert.Equal(t, "4d", result.IntervalDisplay)
}

func TestLearningStepsService_CompleteLearningSteps_Graduates(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.LearningStepsConfig{
		LearningSteps:      []int{10, 30},
		GraduatingInterval: 1,
		EasyInterval:       4,
	}
	svc := service.NewLearningStepsService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(1). // Already at last step
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Grade 3 (Good) from last step should graduate
	result, err := svc.ProcessReview(ctx, card, 3)
	require.NoError(t, err)

	assert.Equal(t, service.StateReview, result.NextState)
	assert.True(t, result.ShouldGraduate)
	assert.Equal(t, "1d", result.IntervalDisplay)
}

func TestLearningStepsService_Relearning(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultLearningConfig()
	svc := service.NewLearningStepsService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// Card in relearning state
	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("relearning").
		SetCurrentStep(0).
		SetNextReview(time.Now()).
		SetStability(2.5).
		SetDifficulty(6.0).
		SetLapses(1).
		Save(ctx)

	// Grade 3 (Good) should complete relearning
	result, err := svc.ProcessReview(ctx, card, 3)
	require.NoError(t, err)

	assert.Equal(t, service.StateReview, result.NextState)
	assert.True(t, result.ShouldGraduate)
}

func TestLearningStepsService_GetNextIntervals(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	config := service.DefaultLearningConfig()
	svc := service.NewLearningStepsService(client, config)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(0).
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	intervals := svc.GetNextIntervals(card)

	assert.Equal(t, "10m", intervals[1]) // Again
	assert.Equal(t, "30m", intervals[2]) // Hard
	assert.Equal(t, "30m", intervals[3]) // Good
	assert.Equal(t, "4d", intervals[4])  // Easy
}
