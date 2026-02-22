import { z } from 'zod/v4';

export const createDictionarySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  language: z.enum(['en', 'fr', 'de', 'es', 'tr']),
  isPublic: z.boolean().default(false),
});

export type CreateDictionaryInput = z.infer<typeof createDictionarySchema>;
