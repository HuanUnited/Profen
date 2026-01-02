package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// Node holds the schema definition for the Node entity.
type Node struct {
	ent.Schema
}

// Fields of the Node.
func (Node) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("node_id"), // Maps to 'node_id' in DB [cite: 21]

		field.Enum("type").
			Values("subject", "topic", "problem", "theory", "term"), // [cite: 22]

		field.Text("body").
			Optional().
			Comment("Markdown content, LaTeX, code snippets"), // [cite: 23]

		field.JSON("metadata", map[string]interface{}{}).
			Optional().
			Comment("Image dimensions, code flags, source URLs"), // [cite: 23]

		field.Time("created_at").
			Default(time.Now).
			Immutable(), // [cite: 24]

		// Adjacency List (Parent Pointer)
		field.UUID("parent_id", uuid.UUID{}).
			Optional().
			Nillable(), // [cite: 21]
	}
}

// Edges of the Node.
func (Node) Edges() []ent.Edge {
	return []ent.Edge{
		// 1. Adjacency List Relationship (Keep as is)
		edge.To("children", Node.Type).
			From("parent").
			Field("parent_id").
			Unique(),

		// 2. Closure Table Relationships
		// REMOVE StorageKey here. NodeClosure.Field("ancestor_id") handles this.
		edge.To("child_closures", NodeClosure.Type),

		edge.To("parent_closures", NodeClosure.Type),

		// 3. Graph Association Relationships
		// REMOVE StorageKey here. NodeAssociation.Field("source_id") handles this.
		edge.To("outgoing_associations", NodeAssociation.Type),

		edge.To("incoming_associations", NodeAssociation.Type),

		// 4. FSRS Card Relationship
		edge.To("fsrs_card", FsrsCard.Type).
			Unique(), // Enforces 1:1
		// .CascadeDelete(), TODO: IMPLEMENT

	}
}
