package service_test

import (
	"context"
	"testing"
	"time"

	"profen/internal/app/service"
	"profen/internal/data/ent/attempt"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/errorresolution"
	"profen/internal/data/ent/fsrscard"
	"profen/internal/data/ent/node"
	"profen/internal/data/hooks"

	_ "github.com/lib/pq" // Postgres driver
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestReviewCard_Flow(t *testing.T) {
	// 1. Setup Database
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	defer client.Close()

	// Register Hooks (Important! We need FsrsCardInitHook)
	client.Node.Use(hooks.FsrsCardInitHook(client))

	ctx := context.Background()
	// Clear previous data
	client.FsrsCard.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	// 2. Initialize Service
	fsrsService := service.NewFSRSService(client)

	// 3. Create a Dummy Node (Hook auto-creates the Card)
	problem, err := client.Node.Create().
		SetType(node.TypeProblem).
		SetBody("Test Problem").
		Save(ctx)
	require.NoError(t, err)

	// Retrieve the auto-created card to get its ID
	card, err := client.FsrsCard.Query().
		Where(fsrscard.NodeID(problem.ID)).
		Only(ctx)
	require.NoError(t, err)

	// Verify Initial State
	assert.Equal(t, fsrscard.StateNew, card.State)
	assert.Equal(t, 0.0, card.Stability)
	assert.Equal(t, 0, card.Reps)

	// ======================================================
	// TEST CASE 1: First Review (Grade: Good)
	// ======================================================
	// User sees the card and answers correctly.

	updatedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeGood, 1000, nil)
	require.NoError(t, err)

	// Assertions for First Review
	assert.Equal(t, 1, updatedCard.Reps, "Reps should increment to 1")
	assert.NotEqual(t, fsrscard.StateNew, updatedCard.State, "State should no longer be New")
	// FSRS v5+ logic: First 'Good' usually moves to Learning or Review depending on params.
	// Default params often move straight to Learning/Review with a short interval.

	assert.Greater(t, updatedCard.Stability, 0.0, "Stability should increase")
	assert.True(t, updatedCard.Due.After(time.Now()), "Due date should be in the future")

	// Log the state to see what happened
	t.Logf("After Good: State=%s, Reps=%d, Stability=%.2f", updatedCard.State, updatedCard.Reps, updatedCard.Stability)

	// ======================================================
	// TEST CASE 2: Second Review (Grade: Again / Fail)
	// ======================================================
	// Let's pretend time passed (or we are reviewing immediately).
	// User forgot the answer.

	// 1. Create an Error Definition first (since we need an ID)
	errDef, _ := client.ErrorDefinition.Create().
		SetLabel("Test Error").
		SetBaseWeight(2.5).
		Save(ctx)

	failedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeAgain, 5000, &errDef.ID)
	require.NoError(t, err)

	// Shut up, compiler
	assert.Equal(t, 2, failedCard.Reps)

	// Verify Attempt Log
	attempts, _ := client.Attempt.Query().
		Where(attempt.CardID(card.ID)).
		All(ctx)
	assert.Len(t, attempts, 2, "Should have 2 attempts logged")
	assert.Equal(t, 5000, attempts[1].DurationMs)
	assert.Equal(t, errDef.ID, *attempts[1].ErrorTypeID)

	// Verify Error Resolution (Diagnostic)
	res, _ := client.ErrorResolution.Query().
		Where(errorresolution.NodeID(problem.ID)). // Note: Link to Node, not Card
		Only(ctx)

	assert.Equal(t, 2.5, res.WeightImpact, "Should use the weight from definition")
	assert.False(t, res.IsResolved)
}
