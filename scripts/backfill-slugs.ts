/**
 * Backfill script: Generate slugs for all existing dictionaries that don't have one.
 * Run with: npx tsx scripts/backfill-slugs.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, isNull } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

function toSlug(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function backfill() {
  console.log('🔄 Starting slug backfill...');

  const dicts = await db.query.dictionaries.findMany({
    where: isNull(schema.dictionaries.slug),
    columns: { id: true, title: true },
  });

  console.log(`📚 Found ${dicts.length} dictionaries without slugs.`);

  const usedSlugs = new Set<string>();

  // Load existing slugs
  const existing = await db.query.dictionaries.findMany({
    columns: { slug: true },
  });
  for (const d of existing) {
    if (d.slug) usedSlugs.add(d.slug);
  }

  let updated = 0;
  for (const dict of dicts) {
    let base = toSlug(dict.title);
    if (!base) base = 'dictionary';

    let candidate = base;
    let suffix = 1;
    while (usedSlugs.has(candidate)) {
      suffix++;
      candidate = `${base}-${suffix}`;
    }

    usedSlugs.add(candidate);

    await db
      .update(schema.dictionaries)
      .set({ slug: candidate })
      .where(eq(schema.dictionaries.id, dict.id));

    updated++;
    console.log(`  ✅ "${dict.title}" → ${candidate}`);
  }

  console.log(`\n🎉 Backfill complete! Updated ${updated} dictionaries.`);
  await client.end();
  process.exit(0);
}

backfill().catch((err) => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
