package schema

import "entgo.io/ent"

// NodeClosure holds the schema definition for the NodeClosure entity.
type NodeClosure struct {
	ent.Schema
}

// Fields of the NodeClosure.
func (NodeClosure) Fields() []ent.Field {
	return nil
}

// Edges of the NodeClosure.
func (NodeClosure) Edges() []ent.Edge {
	return nil
}
