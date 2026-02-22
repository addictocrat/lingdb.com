import type { Dictionary, Word, ExamplePhrase } from '@/lib/db/schema';

interface DictionaryJsonLdProps {
  dictionary: Dictionary & {
    words: (Word & { examplePhrases: ExamplePhrase[] })[];
    user?: { username: string | null };
    _count?: { forks: number };
  };
}

export default function DictionaryJsonLd({ dictionary }: DictionaryJsonLdProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: dictionary.seoTitle || dictionary.title,
    description: dictionary.seoDescription
      ? dictionary.seoDescription.replace(/<[^>]*>/g, '').slice(0, 300)
      : dictionary.description || `Learn ${dictionary.language} vocabulary`,
    inLanguage: dictionary.language,
    learningResourceType: 'vocabulary list',
    educationalLevel: 'beginner',
    author: {
      '@type': 'Person',
      name: dictionary.user?.username || 'Anonymous',
    },
    numberOfItems: dictionary.words.length,
    dateCreated: dictionary.createdAt,
    dateModified: dictionary.updatedAt,
    provider: {
      '@type': 'Organization',
      name: 'Lingdb',
      url: 'https://lingdb.com',
    },
    hasPart: dictionary.words.slice(0, 20).map((word) => ({
      '@type': 'DefinedTerm',
      name: word.title,
      description: word.translation,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
