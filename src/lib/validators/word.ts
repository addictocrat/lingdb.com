import { z } from 'zod/v4';

export const addWordSchema = z.object({
  title: z.string().min(1, 'Word is required').max(100),
  translation: z.string().min(1, 'Translation is required').max(200),
});

export const examplePhraseSchema = z.object({
  phrase: z.string().min(3, 'Phrase too short').max(500),
  translation: z.string().min(3, 'Translation too short').max(500),
});

export type AddWordInput = z.infer<typeof addWordSchema>;
export type ExamplePhraseInput = z.infer<typeof examplePhraseSchema>;
