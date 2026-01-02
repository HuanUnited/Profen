package service_test

import (
	"context"
	"testing"
	"time"

	"profen/internal/app/service"
	"profen/internal/data/ent/enttest"
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

	updatedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeGood)
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

	failedCard, err := fsrsService.ReviewCard(ctx, card.ID, service.GradeAgain)
	require.NoError(t, err)

	t.Logf("After Again: State=%s, Reps=%d, Lapses=%d", failedCard.State, failedCard.Reps, failedCard.Lapses)

	// Assertions for Failure
	assert.Equal(t, 2, failedCard.Reps, "Reps should increment to 2")

	// Conditional Assertion: Only check Lapses if we were in Review state
	if updatedCard.State == fsrscard.StateReview {
		assert.Equal(t, 1, failedCard.Lapses, "Lapses should increment if we forgot a Review card")
	} else {
		// If we were in Learning, Lapses might stay 0, but Stability should drop/reset
		assert.LessOrEqual(t, failedCard.Stability, updatedCard.Stability)
	}

	// 'Again' typically resets stability or lowers it significantly
	assert.Less(t, failedCard.Stability, updatedCard.Stability, "Stability should decrease on failure")

	// 'Again' usually schedules very short term (e.g. 5 min or 1 day depending on steps)
	// But definitively check that Due date changed
	assert.NotEqual(t, updatedCard.Due, failedCard.Due)
}
