package schema

// error_resolutions

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// ErrorResolution tracks a specific error instance on a node (Problem).
// It acts as a "Todo" item for the suggestion engine.
type ErrorResolution struct {
	ent.Schema
}

func (ErrorResolution) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("resolution_id"),

		// Who: The node where the error happened (e.g., the Problem)
		field.UUID("node_id", uuid.UUID{}),

		// What: The type of error (e.g., "Calculation", "Syntax")
		// For simplicity, we can use a string or Enum. Let's use string for flexibility now.
		field.String("error_type").
			NotEmpty().
			Comment("Category: 'calc', 'concept', 'memory'"),

		// Impact: How much this error weighs in the algorithm
		field.Float("weight_impact").
			Default(1.0).
			Comment("Higher value = higher priority to fix"),

		// Status: Is it fixed?
		field.Bool("is_resolved").
			Default(false).
			Comment("False = Active Gap. True = History."),

		field.Time("created_at").
			Default(time.Now),

		field.Time("resolved_at").
			Optional().
			Nillable(),
	}
}

func (ErrorResolution) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("node", Node.Type).
			Ref("error_resolutions").
			Field("node_id").
			Unique().
			Required(),
	}
}
