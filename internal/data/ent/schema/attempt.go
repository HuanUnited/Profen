package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// Attempt (Revlog) records a single review event.
type Attempt struct {
	ent.Schema
}

func (Attempt) Fields() []ent.Field {
	return []ent.Field{
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("attempt_id"),

		// 1. Grading
		field.Int("rating").
			Comment("1=Again, 2=Hard, 3=Good, 4=Easy"),

		field.Int("duration_ms").
			Default(0).
			Comment("Time taken to answer in milliseconds"),

		// 2. FSRS Context
		field.Enum("state").
			Values("new", "learning", "review", "relearning").
			Comment("State of the card before this attempt"),

		field.Float("stability").Comment("Stability before this attempt"),
		field.Float("difficulty").Comment("Difficulty before this attempt"),

		// 3. Metadata
		field.Time("created_at").
			Default(time.Now).
			Immutable(),

		// Foreign Keys
		field.UUID("card_id", uuid.UUID{}),

		// Solved/Mastered Boolean
		field.Bool("is_correct").
			Comment("Derived from rating. True if Grade >= 3"),

		// Optional Error Type ID
		field.UUID("error_type_id", uuid.UUID{}).
			Optional().
			Nillable(),

		// User Input Field
		field.String("user_answer").
			Optional().
			Comment("Snapshot of what the user typed"),

		// Metadata field for structured data
		field.JSON("metadata", map[string]interface{}{}).
			Optional().
			Comment("Error logs, difficulty rating, and other attempt metadata"),
	}
}

func (Attempt) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("card", FsrsCard.Type).
			Ref("attempts").
			Field("card_id").
			Unique().
			Required(),

		edge.From("error_definition", ErrorDefinition.Type).
			Ref("attempts").
			Field("error_type_id").
			Unique(),
	}
}
