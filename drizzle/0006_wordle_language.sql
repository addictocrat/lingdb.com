ALTER TABLE "wordle_games"
ADD COLUMN IF NOT EXISTS "language" text NOT NULL DEFAULT 'en';
