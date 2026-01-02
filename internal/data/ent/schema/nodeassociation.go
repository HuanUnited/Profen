package schema

import "entgo.io/ent"

// NodeAssociation holds the schema definition for the NodeAssociation entity.
type NodeAssociation struct {
	ent.Schema
}

// Fields of the NodeAssociation.
func (NodeAssociation) Fields() []ent.Field {
	return nil
}

// Edges of the NodeAssociation.
func (NodeAssociation) Edges() []ent.Edge {
	return nil
}
