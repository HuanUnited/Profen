package schema

import (
	"entgo.io/ent"
	"entgo.io/ent/dialect/entsql"
	"entgo.io/ent/schema"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"entgo.io/ent/schema/index"
	"github.com/google/uuid"
)

// NodeAssociation holds the schema definition for the NodeAssociation entity.
type NodeAssociation struct {
	ent.Schema
}

// Fields of the NodeAssociation.
func (NodeAssociation) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("source_id", uuid.UUID{}), // [cite: 26]
		field.UUID("target_id", uuid.UUID{}), // [cite: 27]

		// UPDATED ENUM
		field.Enum("rel_type").
			Values(
				"comes_before",    // Prerequisite
				"comes_after",     // Dependent
				"similar_to",      // Bidirectional
				"tests",           // Problem -> Theory
				"defines",         // Theory -> Problem
				"translation_of",  // Term -> Term
				"translated_from", // Term -> Term
				"variant_of",      // Theory -> Theory
				"source_variant",  // Theory -> Theory
			), // [cite: 27, 238]
	}
}

// Edges of the NodeAssociation.
func (NodeAssociation) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("source", Node.Type).
			Ref("outgoing_associations").
			Field("source_id").
			Unique().
			Required(),

		edge.From("target", Node.Type).
			Ref("incoming_associations").
			Field("target_id").
			Unique().
			Required(),
	}
}

// Indexes to prevent duplicate links
func (NodeAssociation) Indexes() []ent.Index {
	return []ent.Index{
		index.Fields("source_id", "target_id", "rel_type").
			Unique(), // Prevents same relationship type between same nodes
	}
}

// Annotations to enforce the CHECK constraint (source < target) defined in Phase 2 [cite: 27]
func (NodeAssociation) Annotations() []schema.Annotation {
	return []schema.Annotation{
		entsql.Checks(map[string]string{
			"source_target_order": "source_id < target_id",
		}),
	}
}
