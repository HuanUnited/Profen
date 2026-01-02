package schema

import "entgo.io/ent"

// ErrorType holds the schema definition for the ErrorType entity.
type ErrorType struct {
	ent.Schema
}

// Fields of the ErrorType.
func (ErrorType) Fields() []ent.Field {
	return nil
}

// Edges of the ErrorType.
func (ErrorType) Edges() []ent.Edge {
	return nil
}
