import { config } from "dotenv";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

config({ path: ".env.local" });
config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is missing. Set it in .env.local or .env.");
  process.exit(1);
}

const BASELINE_MILLIS = 1772092800000; // 0003_blog_translations

async function ensureBaselineForExistingDb(client: postgres.Sql) {
  await client`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await client`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  const [latestMigration] = await client<[{ created_at: string | null }]>`
    SELECT created_at
    FROM drizzle.__drizzle_migrations
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (latestMigration?.created_at) {
    return;
  }

  const [usersTableExists] = await client<[{ exists: boolean }]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'users'
    ) AS exists
  `;

  if (!usersTableExists?.exists) {
    return;
  }

  await client`
    INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
    VALUES ('baseline_existing_database', ${BASELINE_MILLIS})
  `;

  console.log(
    "ℹ️ Existing database detected. Baseline migration marker inserted.",
  );
}

async function runMigrations() {
  console.log("🔄 Running migrations...");

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  try {
    await ensureBaselineForExistingDb(client);
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
