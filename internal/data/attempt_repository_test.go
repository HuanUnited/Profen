// internal/data/attempt_repository_test.go
package data_test

import (
	"context"
	"testing"
	"time"

	"profen/internal/data"
	"profen/internal/data/ent"
	"profen/internal/data/ent/enttest"
	"profen/internal/data/ent/node"

	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupAttemptTestDB(t *testing.T) (*data.AttemptRepository, *ent.Client, context.Context) {
	dsn := "host=localhost port=5173 user=postgres password=054625565 dbname=profen_test sslmode=disable"
	client := enttest.Open(t, "postgres", dsn)
	ctx := context.Background()

	client.Attempt.Delete().Exec(ctx)
	client.FsrsCard.Delete().Exec(ctx)
	client.Node.Delete().Exec(ctx)

	repo := data.NewAttemptRepository(client)
	return repo, client, ctx
}

func TestAttemptRepository_CreateAttempt(t *testing.T) {
	repo, client, ctx := setupAttemptTestDB(t)
	defer client.Close()

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now()).
		SetStability(3.0).
		SetDifficulty(5.0).
		Save(ctx)

	metadata := map[string]interface{}{
		"errorLog":             "Forgot formula",
		"userDifficultyRating": 3,
	}

	err := repo.CreateAttempt(ctx, card, 3, 5000, "My answer", metadata)
	require.NoError(t, err)

	// Verify attempt was created
	attempts, err := repo.GetAttemptsByCard(ctx, card.ID)
	require.NoError(t, err)
	require.Len(t, attempts, 1)

	attempt := attempts[0]
	assert.Equal(t, 3, attempt.Rating)
	assert.Equal(t, 5000, attempt.DurationMs)
	assert.True(t, attempt.IsCorrect) // Grade >= 3
	assert.Equal(t, "My answer", attempt.UserAnswer)
	assert.Equal(t, "Forgot formula", attempt.Metadata["errorLog"])
}

func TestAttemptRepository_IsCorrect_Calculation(t *testing.T) {
	repo, client, ctx := setupAttemptTestDB(t)
	defer client.Close()

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now()).
		SetStability(3.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Grade 1 and 2 should be incorrect
	repo.CreateAttempt(ctx, card, 1, 1000, "wrong", nil)
	repo.CreateAttempt(ctx, card, 2, 2000, "hard", nil)

	// Grade 3 and 4 should be correct
	repo.CreateAttempt(ctx, card, 3, 3000, "good", nil)
	repo.CreateAttempt(ctx, card, 4, 4000, "easy", nil)

	attempts, _ := repo.GetAttemptsByCard(ctx, card.ID)

	assert.False(t, attempts[3].IsCorrect) // Grade 1
	assert.False(t, attempts[2].IsCorrect) // Grade 2
	assert.True(t, attempts[1].IsCorrect)  // Grade 3
	assert.True(t, attempts[0].IsCorrect)  // Grade 4
}

func TestAttemptRepository_GetAttemptStats(t *testing.T) {
	repo, client, ctx := setupAttemptTestDB(t)
	defer client.Close()

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now()).
		SetStability(3.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Create 5 attempts: 3 correct, 2 incorrect
	repo.CreateAttempt(ctx, card, 1, 1000, "", nil)
	repo.CreateAttempt(ctx, card, 2, 2000, "", nil)
	repo.CreateAttempt(ctx, card, 3, 3000, "", nil)
	repo.CreateAttempt(ctx, card, 3, 4000, "", nil)
	repo.CreateAttempt(ctx, card, 4, 5000, "", nil)

	stats, err := repo.GetAttemptStats(ctx, testNode.ID)
	require.NoError(t, err)

	assert.Equal(t, 5, stats["total"])
	assert.Equal(t, 3, stats["correct"])
	assert.Equal(t, 2, stats["incorrect"])
	assert.InDelta(t, 60.0, stats["accuracy"], 0.1)     // 3/5 = 60%
	assert.Equal(t, int64(3000), stats["avg_duration"]) // (1+2+3+4+5)/5
}

func TestAttemptRepository_GetRecentAttempts(t *testing.T) {
	repo, client, ctx := setupAttemptTestDB(t)
	defer client.Close()

	testNode, _ := client.Node.Create().
		SetType(node.TypeProblem).
		SetTitle("Test").
		SetBody("Test").
		Save(ctx)

	card, _ := client.FsrsCard.Create().
		SetNodeID(testNode.ID).
		SetCardState("review").
		SetNextReview(time.Now()).
		SetStability(3.0).
		SetDifficulty(5.0).
		Save(ctx)

	// Create 10 attempts
	for i := 0; i < 10; i++ {
		repo.CreateAttempt(ctx, card, 3, int64(i*1000), "", nil)
		time.Sleep(10 * time.Millisecond) // Ensure different timestamps
	}

	// Get recent 5
	recent, err := repo.GetRecentAttempts(ctx, 5)
	require.NoError(t, err)
	assert.Len(t, recent, 5)

	// Should be sorted newest first
	for i := 0; i < len(recent)-1; i++ {
		assert.True(t, recent[i].CreatedAt.After(recent[i+1].CreatedAt) ||
			recent[i].CreatedAt.Equal(recent[i+1].CreatedAt))
	}
}
