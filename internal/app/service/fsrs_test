package service_test

import (
	"context"
	"testing"

	"profen/internal/app/service"
	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReviewCard_Flow(t *testing.T) {
	// 1. Setup Database
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// Register Hooks
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()
	// Clear previous data
	client.Attempt.Delete().Exec(ctx)
	client.ErrorResolution.Delete().Exec(ctx)
	client.ErrorDefinition.Delete().Exec(ctx)
	client.FsrsCard.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	// 2. Initialize Service
	fsrsService := service.NewFSRSService(client)

	// 3. Create Node
	problem, err := client.Node.Create().
		SetType(node.TypeProblem).
		SetBody("Test Problem").
		Save(ctx)
	require.NoError(t, err)

	card, err := client.FsrsCard.Query().
		Where(fsrscard.NodeID(problem.ID)).
		Only(ctx)
	require.NoError(t, err)

	// Test Case 1: Good (Grade 3)
	// New Argument: userAnswer = "Correct Answer"
	updatedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeGood, 1000, "Correct Answer", nil)
	require.NoError(t, err)
	assert.Equal(t, 1, updatedCard.Reps)

	// Test Case 2: Bad (Grade 1 - Again)
	// New Argument: userAnswer = "Wrong Answer"

	// Create Definition
	errDef, err := client.ErrorDefinition.Create().
		SetLabel("Test Error").
		SetBaseWeight(2.5).
		Save(ctx)
	require.NoError(t, err, "Failed to create error definition")

	failedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeAgain, 5000, "Wrong Answer", &errDef.ID)
	require.NoError(t, err)
	assert.Equal(t, 2, failedCard.Reps)

	// Verify Attempt Log
	attempts, err := client.Attempt.Query().
		Where(attempt.CardID(card.ID)).
		Order(ent.Asc(attempt.FieldCreatedAt)).
		All(ctx)
	require.NoError(t, err)

	require.Len(t, attempts, 2)

	// Check First Attempt (Good)
	firstAttempt := attempts[0]
	assert.Equal(t, "Correct Answer", firstAttempt.UserAnswer)

	// Check Second Attempt (Bad)
	lastAttempt := attempts[1]
	require.NotNil(t, lastAttempt.ErrorTypeID)
	assert.Equal(t, errDef.ID, *lastAttempt.ErrorTypeID)
	assert.Equal(t, "Wrong Answer", lastAttempt.UserAnswer) // Verify storage
}
