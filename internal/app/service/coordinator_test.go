// internal/app/service/coordinator_test.go
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

func TestCoordinator_NewCard_UsesLearningSteps(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	learningConfig := service.DefaultLearningConfig()
	fsrsConfig := service.DefaultFSRSConfig()

	learningService := service.NewLearningStepsService(client, learningConfig)
	fsrsService := service.NewFSRSService(client, fsrsConfig)
	coordinator := service.NewReviewCoordinator(learningService, fsrsService, client)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// First review of new card with Good grade
	result, err := coordinator.ProcessReview(ctx, testNode.ID, 3)
	require.NoError(t, err)

	// Should be in learning state
	card, _ := client.FsrsCard.Query().Where( /* match node */ ).First(ctx)
	assert.Equal(t, "learning", card.CardState)
	assert.NotNil(t, result)
}

// internal/app/service/coordinator_test.go

func TestCoordinator_CompleteFlow_NewToReview(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	// ✅ FIX: Use TWO learning steps, not one
	learningConfig := service.LearningStepsConfig{
		LearningSteps:      []int{1, 10}, // Two steps
		RelearningSteps:    []int{10},
		GraduatingInterval: 1,
		EasyInterval:       4,
	}
	fsrsConfig := service.DefaultFSRSConfig()

	learningService := service.NewLearningStepsService(client, learningConfig)
	fsrsService := service.NewFSRSService(client, fsrsConfig)
	coordinator := service.NewReviewCoordinator(learningService, fsrsService, client)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// Step 1: New (step 0) -> Learning (step 1)
	_, err := coordinator.ProcessReview(ctx, testNode.ID, 3)
	require.NoError(t, err)

	card, _ := client.FsrsCard.Query().First(ctx)
	assert.Equal(t, "learning", card.CardState)
	assert.Equal(t, 1, card.CurrentStep) // ✅ Now at step 1

	// Step 2: Learning (step 1) -> Graduate to Review
	_, err = coordinator.ProcessReview(ctx, testNode.ID, 3)
	require.NoError(t, err)

	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Equal(t, "review", card.CardState)
	assert.True(t, card.Stability > 0)
}

func TestCoordinator_ReviewCard_UsesFSRS(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	learningConfig := service.DefaultLearningConfig()
	fsrsConfig := service.DefaultFSRSConfig()

	learningService := service.NewLearningStepsService(client, learningConfig)
	fsrsService := service.NewFSRSService(client, fsrsConfig)
	coordinator := service.NewReviewCoordinator(learningService, fsrsService, client)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// Create card already in review state
	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now().Add(-1 * 24 * time.Hour)).
		SetStability(3.0).
		SetDifficulty(5.0).
		SetReps(2).
		Save(ctx)

	initialStability := card.Stability

	// Process review with Good
	result, err := coordinator.ProcessReview(ctx, testNode.ID, 3)
	require.NoError(t, err)

	card, _ = client.FsrsCard.Get(ctx, card.ID)
	assert.Greater(t, card.Stability, initialStability)
	assert.Equal(t, "review", card.CardState)
	assert.NotNil(t, result)
}

func TestCoordinator_GetSchedulingInfo(t *testing.T) {
	client, ctx := setupTestDB(t)
	defer client.Close()

	learningConfig := service.DefaultLearningConfig()
	fsrsConfig := service.DefaultFSRSConfig()

	learningService := service.NewLearningStepsService(client, learningConfig)
	fsrsService := service.NewFSRSService(client, fsrsConfig)
	coordinator := service.NewReviewCoordinator(learningService, fsrsService, client)

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	// Create learning card
	_, _ = client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("learning").
		SetCurrentStep(0).
		SetNextReview(time.Now()).
		SetStability(0.0).
		SetDifficulty(5.0).
		Save(ctx)

	intervals, err := coordinator.GetSchedulingInfo(ctx, testNode.ID)
	require.NoError(t, err)

	// Should have all 4 grades
	assert.Len(t, intervals, 4)
	assert.NotEmpty(t, intervals[1]) // Again
	assert.NotEmpty(t, intervals[2]) // Hard
	assert.NotEmpty(t, intervals[3]) // Good
	assert.NotEmpty(t, intervals[4]) // Easy
}
