package service

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"profen/internal/data/ent"
	"profen/internal/data/ent/attempt"
)

type OptimizerService struct {
	client *ent.Client
}

func NewOptimizerService(client *ent.Client) *OptimizerService {
	return &OptimizerService{client: client}
}

// RunOptimization exports history and calls the Python script.
func (s *OptimizerService) RunOptimization(ctx context.Context) ([]float64, error) {
	// 1. Fetch All Attempts (Revlog)
	attempts, err := s.client.Attempt.Query().
		Order(ent.Asc(attempt.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("fetching attempts: %w", err)
	}

	if len(attempts) < 100 {
		return nil, fmt.Errorf("not enough data to optimize (min 100, have %d)", len(attempts))
	}

	// 2. Export to JSON file
	tempFile := "revlog_export.json"
	file, err := os.Create(tempFile)
	if err != nil {
		return nil, fmt.Errorf("creating temp file: %w", err)
	}
	defer os.Remove(tempFile) // Cleanup

	// Map to simplified struct for JSON
	type exportRow struct {
		CardID    string `json:"card_id"`
		Rating    int    `json:"rating"`
		CreatedAt string `json:"created_at"` // ISO8601
		State     string `json:"state"`
	}

	var rows []exportRow
	for _, a := range attempts {
		rows = append(rows, exportRow{
			CardID:    a.CardID.String(),
			Rating:    a.Rating,
			CreatedAt: a.CreatedAt.Format(time.RFC3339),
			State:     a.State.String(),
		})
	}

	if err := json.NewEncoder(file).Encode(rows); err != nil {
		return nil, fmt.Errorf("writing json: %w", err)
	}
	file.Close()

	// 3. Call Python Script
	// Assuming script is in ./scripts/optimizer.py
	cmd := exec.Command("python", filepath.Join("scripts", "optimizer.py"), tempFile)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("python execution failed: %s", string(output))
	}

	// 4. Parse Result
	var result struct {
		Parameters []float64 `json:"parameters"`
		Status     string    `json:"status"`
		Error      string    `json:"error"`
	}

	if err := json.Unmarshal(output, &result); err != nil {
		return nil, fmt.Errorf("parsing python output: %w. Raw: %s", err, string(output))
	}

	if result.Error != "" {
		return nil, fmt.Errorf("optimizer error: %s", result.Error)
	}

	// 5. Save New Parameters (TODO: Persist to DB Config table)
	// For now, just return them.
	return result.Parameters, nil
}
