import { db } from '@/lib/db/client';
import { dictionaries } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Convert a string to a URL-safe slug.
 * Handles unicode, accents, Turkish chars, special characters.
 */
export function toSlug(input: string): string {
  // Explicit mappings for characters that NFD doesn't decompose well
  const charMap: Record<string, string> = {
    'ş': 's', 'Ş': 's', 'ı': 'i', 'İ': 'i', 'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g', 'ü': 'u', 'Ü': 'u', 'ö': 'o', 'Ö': 'o',
    'ä': 'a', 'Ä': 'a', 'ß': 'ss', 'ñ': 'n', 'Ñ': 'n',
    'å': 'a', 'Å': 'a', 'æ': 'ae', 'Æ': 'ae', 'ø': 'o', 'Ø': 'o',
  };

  let mapped = '';
  for (const ch of input) {
    mapped += charMap[ch] || ch;
  }

  return mapped
    .normalize('NFD')                     // Decompose accented chars
    .replace(/[\u0300-\u036f]/g, '')      // Strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')         // Remove non-alphanumeric
    .trim()
    .replace(/[\s_]+/g, '-')              // Spaces/underscores → hyphens
    .replace(/-+/g, '-')                  // Collapse multiple hyphens
    .replace(/^-|-$/g, '');               // Trim leading/trailing hyphens
}

/**
 * Generate a unique slug for a dictionary.
 * If the slug already exists, appends -2, -3, etc.
 * Optionally excludes a specific dictionary ID (for updates).
 */
export async function generateUniqueSlug(
  title: string,
  excludeDictionaryId?: string
): Promise<string> {
  let base = toSlug(title);

  // Fallback for titles that produce empty slugs (e.g. all special characters)
  if (!base) {
    base = 'dictionary';
  }

  let candidate = base;
  let suffix = 1;

  while (true) {
    const existing = await db.query.dictionaries.findFirst({
      where: eq(dictionaries.slug, candidate),
      columns: { id: true },
    });

    if (!existing || (excludeDictionaryId && existing.id === excludeDictionaryId)) {
      return candidate;
    }

    suffix++;
    candidate = `${base}-${suffix}`;
  }
}
