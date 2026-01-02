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
		// 1. Adjacency List Relationship (Parent <-> Children)
		edge.To("children", Node.Type).
			From("parent").
			Field("parent_id").
			Unique(),

		// 2. Closure Table Relationships (Explicit Edge Schema)
		// Nodes acting as Ancestors in the closure table
		edge.To("child_closures", NodeClosure.Type).
			StorageKey(edge.Column("ancestor_id")), 
		
		// Nodes acting as Descendants in the closure table
		edge.To("parent_closures", NodeClosure.Type).
			StorageKey(edge.Column("descendant_id")),

		// 3. Graph Association Relationships (Explicit Edge Schema)
		// Nodes acting as the Source of a link
		edge.To("outgoing_associations", NodeAssociation.Type).
			StorageKey(edge.Column("source_id")),
		
		// Nodes acting as the Target of a link
		edge.To("incoming_associations", NodeAssociation.Type).
			StorageKey(edge.Column("target_id")),
	}
}