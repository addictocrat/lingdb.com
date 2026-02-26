CREATE TABLE IF NOT EXISTS "blog_translations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blog_id" uuid NOT NULL,
	"locale" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"content" jsonb NOT NULL,
	"keywords" text,
	"seo_title" text,
	"seo_description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_translations_blog_locale_unique" UNIQUE("blog_id","locale")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_translations_blog_id_idx" ON "blog_translations" USING btree ("blog_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "blog_translations_locale_idx" ON "blog_translations" USING btree ("locale");
--> statement-breakpoint
ALTER TABLE "blog_translations" ADD CONSTRAINT "blog_translations_blog_id_blogs_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blogs"("id") ON DELETE cascade ON UPDATE no action;
