package schema

import (
	"time"

	"entgo.io/ent"
	"entgo.io/ent/schema/edge"
	"entgo.io/ent/schema/field"
	"github.com/google/uuid"
)

// FsrsCard holds the schema definition for the FsrsCard entity.
type FsrsCard struct {
	ent.Schema
}

// Fields of the FsrsCard.
func (FsrsCard) Fields() []ent.Field {
	return []ent.Field{
		// Primary Key (Auto-generated UUID is fine, or match Node ID)
		field.UUID("id", uuid.UUID{}).
			Default(uuid.New).
			StorageKey("card_id"),

		// FSRS Core State
		field.Float("stability").
			Comment("Memory stability (S). Interval when R=90%.").
			Default(0), // Default 0 for "New" cards

		field.Float("difficulty").
			Comment("Memory difficulty (D). 1 (easiest) to 10 (hardest).").
			Default(0),

		field.Int("elapsed_days").
			Comment("Days since the card was created or last reviewed.").
			Default(0),

		field.Int("scheduled_days").
			Comment("The interval (I) calculated by FSRS for the next review.").
			Default(0),

		field.Int("reps").
			Comment("Total number of reviews.").
			Default(0),

		field.Int("lapses").
			Comment("Times the user forgot the card (rated 'Again').").
			Default(0),

		field.Enum("state").
			Values("new", "learning", "review", "relearning").
			Default("new").
			Comment("Current FSRS state."),

		// Timestamps
		field.Time("last_review").
			Optional().
			Nillable().
			Comment("Last time the user attempted this card."),

		field.Time("due").
			Default(time.Now).
			Comment("Next scheduled review date."),

		// Foreign Key
		field.UUID("node_id", uuid.UUID{}).
			Unique(),

		// Add these fields:
		field.String("card_state").
			Default("new").
			Comment("Current state: new, learning, review, relearning"),

		field.Int("current_step").
			Default(0).
			Comment("Current index in learning/relearning steps"),

		field.Time("next_review").
			Default(time.Now).
			Comment("When this card should be reviewed next"),
	}
}

// Edges of the FsrsCard.
func (FsrsCard) Edges() []ent.Edge {
	return []ent.Edge{
		// 1:1 Relationship: Card belongs to exactly one Node
		edge.From("node", Node.Type).
			Ref("fsrs_card").
			Field("node_id").
			Unique().
			Required(),

		// Block 7: History
		edge.To("attempts", Attempt.Type),
	}
}
