CREATE TYPE "public"."dictionary_editor_status" AS ENUM('PENDING', 'ACCEPTED');--> statement-breakpoint
ALTER TABLE "dictionary_editors" DROP CONSTRAINT "dictionary_editors_dict_user_unique";--> statement-breakpoint
ALTER TABLE "words" DROP CONSTRAINT "words_added_by_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "dictionary_editors" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "dictionary_editors" ALTER COLUMN "status" SET DATA TYPE "public"."dictionary_editor_status" USING "status"::text::"public"."dictionary_editor_status";--> statement-breakpoint
ALTER TABLE "dictionary_editors" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
ALTER TABLE "dictionaries" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "dictionaries" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "dictionaries" ADD COLUMN "seo_description" text;--> statement-breakpoint
ALTER TABLE "dictionaries" ADD COLUMN "seo_generated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dictionaries" ADD COLUMN "last_daily_update_sent_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "dictionary_editors" ADD COLUMN "invite_token" text;--> statement-breakpoint
ALTER TABLE "dictionary_editors" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "words" ADD COLUMN "last_modified_by_id" uuid;--> statement-breakpoint
ALTER TABLE "words" ADD CONSTRAINT "words_last_modified_by_id_users_id_fk" FOREIGN KEY ("last_modified_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dictionaries_slug_idx" ON "dictionaries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "dictionary_editors_token_idx" ON "dictionary_editors" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "words_last_modified_by_id_idx" ON "words" USING btree ("last_modified_by_id");--> statement-breakpoint
ALTER TABLE "dictionary_editors" DROP COLUMN "invited_at";--> statement-breakpoint
ALTER TABLE "words" DROP COLUMN "added_by_id";--> statement-breakpoint
ALTER TABLE "dictionaries" ADD CONSTRAINT "dictionaries_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "dictionary_editors" ADD CONSTRAINT "dictionary_editors_unique" UNIQUE("dictionary_id","user_id");--> statement-breakpoint
DROP TYPE "public"."editor_status";