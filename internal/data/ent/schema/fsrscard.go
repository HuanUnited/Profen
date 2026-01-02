package schema

import "entgo.io/ent"

// FsrsCard holds the schema definition for the FsrsCard entity.
type FsrsCard struct {
	ent.Schema
}

// Fields of the FsrsCard.
func (FsrsCard) Fields() []ent.Field {
	return nil
}

// Edges of the FsrsCard.
func (FsrsCard) Edges() []ent.Edge {
	return nil
}
