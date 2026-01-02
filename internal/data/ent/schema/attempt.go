package schema

import "entgo.io/ent"

// Attempt holds the schema definition for the Attempt entity.
type Attempt struct {
	ent.Schema
}

// Fields of the Attempt.
func (Attempt) Fields() []ent.Field {
	return nil
}

// Edges of the Attempt.
func (Attempt) Edges() []ent.Edge {
	return nil
}
