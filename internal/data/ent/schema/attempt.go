package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// Attempt (Revlog) records a single review event.
// This data is immutable history used for the FSRS Optimizer.
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

		// 2. FSRS Context (State *before* the review)
		// We record this to reconstruct the history if needed.
		field.Enum("state").
			Values("new", "learning", "review", "relearning").
			Comment("State of the card before this attempt"),

		field.Float("stability").
			Comment("Stability before this attempt"),
		field.Float("difficulty").
			Comment("Difficulty before this attempt"),

		// 3. Metadata
		field.Time("created_at").
			Default(time.Now).
			Immutable(),

		// Foreign Keys
		field.UUID("card_id", uuid.UUID{}),

		// NEW: Solved/Mastered Boolean
		// "Solved" usually means "Got it right this time" (Grade >= 3).
		// "Mastered" means "Is now mature" (Stability > 21 days?).
		// Let's call it 'is_correct' for the attempt itself.
		field.Bool("is_correct").
			Comment("Derived from rating. True if Grade >= 3"),

		// NEW: Optional Error Type ID (Foreign Key)
		field.UUID("error_type_id", uuid.UUID{}).
			Optional().
			Nillable(),
	}
}

func (Attempt) Edges() []ent.Edge {
	return []ent.Edge{
		edge.From("card", FsrsCard.Type).
			Ref("attempts").
			Field("card_id").
			Unique().
			Required(),

		// NEW: Link to Error Definition
		edge.From("error_definition", ErrorDefinition.Type).
			Ref("attempts").
			Field("error_type_id").
			Unique(),
	}
}
