package data

import (
	"context"
	"profen/internal/data/ent"
	"profen/internal/data/ent/errordefinition"
)

func SeedErrorDefinitions(ctx context.Context, client *ent.Client) error {
	// Defaults from SDLC
	defaults := []struct {
		Label  string
		Weight float64
	}{
		{"Memory Lapse", 1.0},
		{"Conceptual Gap", 2.5},
		{"Execution/Syntax", 1.2},
		{"Recognition Fail", 1.5},
	}

	for _, d := range defaults {
		// Upsert logic (check if exists)
		exists, _ := client.ErrorDefinition.Query().
			Where(errordefinition.LabelEQ(d.Label)).
			Exist(ctx)

		if !exists {
			client.ErrorDefinition.Create().
				SetLabel(d.Label).
				SetBaseWeight(d.Weight).
				SetIsSystem(true).
				Save(ctx)
		}
	}
	return nil
}
