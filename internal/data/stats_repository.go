package data

import (
	"context"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/fsrscard"
)

type StatsRepository struct {
	client *ent.Client
}

func NewStatsRepository(client *ent.Client) *StatsRepository {
	return &StatsRepository{client: client}
}

type DashboardStats struct {
	TotalNodes    int `json:"total_nodes"`
	TotalAttempts int `json:"total_attempts"`
	DueCards      int `json:"due_cards"`
}

func (r *StatsRepository) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	// Total nodes (all types)
	totalNodes, err := r.client.Node.Query().Count(ctx)
	if err != nil {
		return nil, err
	}

	// Total attempts
	totalAttempts, err := r.client.Attempt.Query().Count(ctx)
	if err != nil {
		return nil, err
	}

	// Due cards (problems/theories with FSRS cards scheduled for today or earlier)
	now := time.Now()
	dueCards, err := r.client.FsrsCard.Query().
		Where(fsrscard.DueLTE(now)).
		Count(ctx)
	if err != nil {
		return nil, err
	}

	return &DashboardStats{
		TotalNodes:    totalNodes,
		TotalAttempts: totalAttempts,
		DueCards:      dueCards,
	}, nil
}
