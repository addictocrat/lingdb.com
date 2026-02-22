CREATE TYPE "public"."editor_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."flashcard_status" AS ENUM('NEW', 'LEARNING', 'REVIEW', 'MASTERED');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."user_tier" AS ENUM('FREE', 'PREMIUM');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dictionaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"language" text NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"active_magic_words" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dictionary_editors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dictionary_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "editor_status" DEFAULT 'PENDING' NOT NULL,
	"invited_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dictionary_editors_dict_user_unique" UNIQUE("dictionary_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "example_phrases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phrase" text NOT NULL,
	"translation" text NOT NULL,
	"word_id" uuid NOT NULL,
	"is_ai_generated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"word_id" uuid NOT NULL,
	"status" "flashcard_status" DEFAULT 'NEW' NOT NULL,
	"leitner_box" integer DEFAULT 1 NOT NULL,
	"next_review_at" timestamp with time zone,
	"last_review_at" timestamp with time zone,
	"review_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "flashcard_progress_user_word_unique" UNIQUE("user_id","word_id")
);
--> statement-breakpoint
CREATE TABLE "forks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_dictionary_id" uuid NOT NULL,
	"forked_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forks_source_user_unique" UNIQUE("source_dictionary_id","forked_by_id")
);
--> statement-breakpoint
CREATE TABLE "quiz_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"dictionary_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"percentage" integer NOT NULL,
	"question_types" jsonb,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"iyzico_sub_id" text,
	"status" "subscription_status" DEFAULT 'TRIAL' NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supabase_id" text NOT NULL,
	"email" text NOT NULL,
	"username" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"tier" "user_tier" DEFAULT 'FREE' NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"ai_credits" integer DEFAULT 30 NOT NULL,
	"credits_reset_at" timestamp with time zone DEFAULT now() NOT NULL,
	"total_words" integer DEFAULT 0 NOT NULL,
	"total_flashcards" integer DEFAULT 0 NOT NULL,
	"total_quizzes" integer DEFAULT 0 NOT NULL,
	"streak_count" integer DEFAULT 0 NOT NULL,
	"last_active_date" timestamp with time zone,
	"last_reminder_sent_at" timestamp with time zone,
	"has_completed_tour" boolean DEFAULT false NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"email_opt_out" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_supabase_id_unique" UNIQUE("supabase_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "words" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"translation" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"dictionary_id" uuid NOT NULL,
	"added_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dictionaries" ADD CONSTRAINT "dictionaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dictionary_editors" ADD CONSTRAINT "dictionary_editors_dictionary_id_dictionaries_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dictionary_editors" ADD CONSTRAINT "dictionary_editors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "example_phrases" ADD CONSTRAINT "example_phrases_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_progress" ADD CONSTRAINT "flashcard_progress_word_id_words_id_fk" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_source_dictionary_id_dictionaries_id_fk" FOREIGN KEY ("source_dictionary_id") REFERENCES "public"."dictionaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forks" ADD CONSTRAINT "forks_forked_by_id_users_id_fk" FOREIGN KEY ("forked_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_history" ADD CONSTRAINT "quiz_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_history" ADD CONSTRAINT "quiz_history_dictionary_id_dictionaries_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_dictionary_id_dictionaries_id_fk" FOREIGN KEY ("dictionary_id") REFERENCES "public"."dictionaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_added_by_id_users_id_fk" FOREIGN KEY ("added_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_user_created_idx" ON "activity_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "dictionaries_user_id_idx" ON "dictionaries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dictionaries_is_public_idx" ON "dictionaries" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "dictionary_editors_user_id_idx" ON "dictionary_editors" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "example_phrases_word_id_idx" ON "example_phrases" USING btree ("word_id");--> statement-breakpoint
CREATE INDEX "flashcard_progress_user_id_idx" ON "flashcard_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "quiz_history_user_id_idx" ON "quiz_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "words_dictionary_id_idx" ON "words" USING btree ("dictionary_id");