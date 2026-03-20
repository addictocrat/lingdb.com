CREATE TABLE IF NOT EXISTS "wordle_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution" text NOT NULL,
	"word_length" integer NOT NULL,
	"max_tries" integer DEFAULT 6 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wordle_games_created_at_idx" ON "wordle_games" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wordle_games_expires_at_idx" ON "wordle_games" USING btree ("expires_at");
