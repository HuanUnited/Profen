package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// ErrorDefinition defines types of errors (Calculation, Memory, etc.)
type ErrorDefinition struct {
	ent.Schema
}

func (ErrorDefinition) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("error_type_id"),

		field.String("label").Unique().NotEmpty(),
		field.Float("base_weight").Default(1.0),
		field.Bool("is_system").Default(false),
	}
}

func (ErrorDefinition) Edges() []ent.Edge {
	return []ent.Edge{
		// Inverse edge to Attempts (An attempt can link to this error)
		edge.To("attempts", Attempt.Type),
	}
}
