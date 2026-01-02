package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// NodeClosure holds the schema definition for the NodeClosure entity.
type NodeClosure struct {
	ent.Schema
}

// Fields of the NodeClosure.
func (NodeClosure) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("ancestor_id", uuid.UUID{}),   // [cite: 25]
		field.UUID("descendant_id", uuid.UUID{}), // [cite: 25]
		
		field.Int("depth").
			Comment("Distance between ancestor and descendant. 0 for self."), // [cite: 25]
	}
}

// Edges of the NodeClosure.
func (NodeClosure) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("ancestor", Node.Type).
			Ref("child_closures").   // This name MUST exist in Node.go
			Field("ancestor_id").
			Unique().
			Required(),
		
		edge.From("descendant", Node.Type).
			Ref("parent_closures").  // This name MUST exist in Node.go
			Field("descendant_id").
			Unique().
			Required(),
	}
}


// Indexes ensure uniqueness of paths
func (NodeClosure) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("ancestor_id", "descendant_id").
			Unique(), // [cite: 25]
	}
}