package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// ErrorResolution tracks a specific error instance on a node.
type ErrorResolution struct {
	ent.Schema
}

func (ErrorResolution) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("resolution_id"),

		field.UUID("node_id", uuid.UUID{}),
		field.UUID("error_type_id", uuid.UUID{}),

		field.Float("weight_impact").
			Default(1.0).
			Comment("Higher value = higher priority to fix"),

		field.Bool("is_resolved").
			Default(false).
			Comment("False = Active Gap. True = History."),

		// --- NEW FIELD ---
		field.String("resolution_notes").
			Optional().
			Comment("User explanation of the fix"),

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
