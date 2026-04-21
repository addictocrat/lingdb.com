import { Sparkles, Brain, Gamepad2, Users } from "lucide-react";

export const PRICING_PLANS = [
  {
    nameKey: "free_title",
    price: "$0",
    periodKey: "free_period",
    descriptionKey: "free_desc",
    ctaKey: "free_cta",
    ctaVariant: "secondary" as const,
    features: [
      { textKey: "feature_10_dict", included: true },
      { textKey: "feature_30_ai", included: true },
      { textKey: "feature_flashcards", included: true },
      { textKey: "feature_unlimited_dict", included: false },
      { textKey: "feature_100_ai", included: false },
      { textKey: "feature_priority", included: false },
    ],
  },
  {
    nameKey: "premium_title",
    price: "$1.49",
    originalPrice: "$7.45",
    periodKey: "premium_period",
    descriptionKey: "premium_desc",
    ctaKey: "premium_cta",
    ctaVariant: "primary" as const,
    popular: true,
    features: [
      { textKey: "feature_unlimited_dict", included: true },
      { textKey: "feature_100_ai", included: true },
      { textKey: "feature_flashcards", included: true },
      { textKey: "feature_no_ads", included: true },
      { textKey: "feature_priority", included: true },
      { textKey: "feature_early_access", included: true },
    ],
  },
];

export const LANDING_FEATURES = [
  {
    icon: Sparkles,
    titleKey: "feature_dictionaries",
    descKey: "feature_dictionaries_desc",
    color: "text-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    glow: "rgba(234, 179, 8, 0.5)",
  },
  {
    icon: Brain,
    titleKey: "feature_study",
    descKey: "feature_study_desc",
    color: "text-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    glow: "rgba(34, 197, 94, 0.5)",
  },
  {
    icon: Gamepad2,
    titleKey: "feature_minigames",
    descKey: "feature_minigames_desc",
    color: "text-[#a855f7]",
    bg: "bg-[#a855f7]/10 dark:bg-[#a855f7]/20",
    glow: "rgba(168, 85, 247, 0.5)",
  },
  {
    icon: Users,
    titleKey: "feature_community",
    descKey: "feature_community_desc",
    color: "text-accent-500",
    bg: "bg-accent-50 dark:bg-accent-900/20",
    glow: "rgba(247, 123, 85, 0.5)",
  },
];

export const DEMO_LANGUAGE_OPTIONS = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "tr", name: "Turkish" },
] as const;

export type DemoLanguageCode = (typeof DEMO_LANGUAGE_OPTIONS)[number]["code"];

export const DEMO_LANGUAGE_PLACEHOLDERS: Record<DemoLanguageCode, string> = {
  en: "school",
  fr: "fleur",
  de: "küchenchef",
  es: "hermano",
  tr: "harika",
};

export const DEMO_WORDS_DATA = [
  {
    id: "flower",
    languages: {
      en: {
        word: "Flower",
        translation: "Fleur",
        magicWords: [
          { word: "Petal", translation: "Pétale" },
          { word: "Bloom", translation: "Floraison" },
          { word: "Fragrance", translation: "Parfum" },
        ],
        magicPhrase: {
          phrase: "A beautiful flower blooms in the morning sun.",
          translation: "Une belle fleur s'épanouit sous le soleil du matin.",
        },
      },
      fr: {
        word: "Fleur",
        translation: "Flower",
        magicWords: [
          { word: "Pétale", translation: "Petal" },
          { word: "Épanouissement", translation: "Bloom" },
          { word: "Parfum", translation: "Fragrance" },
        ],
        magicPhrase: {
          phrase: "Une belle fleur s'épanouit sous le soleil du matin.",
          translation: "A beautiful flower blooms in the morning sun.",
        },
      },
      de: {
        word: "Blume",
        translation: "Flower",
        magicWords: [
          { word: "Blütenblatt", translation: "Petal" },
          { word: "Blüte", translation: "Bloom" },
          { word: "Duft", translation: "Fragrance" },
        ],
        magicPhrase: {
          phrase: "Eine schöne Blume blüht in der Morgensonne.",
          translation: "A beautiful flower blooms in the morning sun.",
        },
      },
      es: {
        word: "Flor",
        translation: "Flower",
        magicWords: [
          { word: "Pétalo", translation: "Petal" },
          { word: "Floración", translation: "Bloom" },
          { word: "Fragancia", translation: "Fragrance" },
        ],
        magicPhrase: {
          phrase: "Una hermosa flor florece bajo el sol de la mañana.",
          translation: "A beautiful flower blooms in the morning sun.",
        },
      },
      tr: {
        word: "Çiçek",
        translation: "Flower",
        magicWords: [
          { word: "Taç yaprak", translation: "Petal" },
          { word: "Çiçek açmak", translation: "Bloom" },
          { word: "Koku", translation: "Fragrance" },
        ],
        magicPhrase: {
          phrase: "Sabah güneşinde güzel bir çiçek açıyor.",
          translation: "A beautiful flower blooms in the morning sun.",
        },
      },
    },
  },
  {
    id: "mountain",
    languages: {
      en: {
        word: "Mountain",
        translation: "Montagne",
        magicWords: [
          { word: "Summit", translation: "Sommet" },
          { word: "Climb", translation: "Escalader" },
          { word: "Peak", translation: "Pic" },
        ],
        magicPhrase: {
          phrase: "The mountain summit is covered in snow.",
          translation: "Le sommet de la montagne est couvert de neige.",
        },
      },
      fr: {
        word: "Montagne",
        translation: "Mountain",
        magicWords: [
          { word: "Sommet", translation: "Summit" },
          { word: "Escalade", translation: "Climb" },
          { word: "Cîme", translation: "Peak" },
        ],
        magicPhrase: {
          phrase: "Le sommet de la montagne est couvert de neige.",
          translation: "The mountain summit is covered in snow.",
        },
      },
      de: {
        word: "Berg",
        translation: "Mountain",
        magicWords: [
          { word: "Gipfel", translation: "Summit" },
          { word: "Klettern", translation: "Climb" },
          { word: "Spitze", translation: "Peak" },
        ],
        magicPhrase: {
          phrase: "Der Berggipfel ist mit Schnee bedeckt.",
          translation: "The mountain summit is covered in snow.",
        },
      },
      es: {
        word: "Montaña",
        translation: "Mountain",
        magicWords: [
          { word: "Cumbre", translation: "Summit" },
          { word: "Escalar", translation: "Climb" },
          { word: "Pico", translation: "Peak" },
        ],
        magicPhrase: {
          phrase: "La cumbre de la montaña está cubierta de nieve.",
          translation: "The mountain summit is covered in snow.",
        },
      },
      tr: {
        word: "Dağ",
        translation: "Mountain",
        magicWords: [
          { word: "Zirve", translation: "Summit" },
          { word: "Tırmanış", translation: "Climb" },
          { word: "Doruk", translation: "Peak" },
        ],
        magicPhrase: {
          phrase: "Dağın zirvesi karla kaplı.",
          translation: "The mountain summit is covered in snow.",
        },
      },
    },
  },
  {
    id: "book",
    languages: {
      en: {
        word: "Book",
        translation: "Livre",
        magicWords: [
          { word: "Library", translation: "Bibliothèque" },
          { word: "Chapter", translation: "Chapitre" },
          { word: "Author", translation: "Auteur" },
        ],
        magicPhrase: {
          phrase: "I read a fascinating book every night.",
          translation: "Je lis un livre fascinant chaque nuit.",
        },
      },
      fr: {
        word: "Livre",
        translation: "Book",
        magicWords: [
          { word: "Bibliothèque", translation: "Library" },
          { word: "Chapitre", translation: "Chapter" },
          { word: "Auteur", translation: "Author" },
        ],
        magicPhrase: {
          phrase: "Je lis un livre fascinant chaque nuit.",
          translation: "I read a fascinating book every night.",
        },
      },
      de: {
        word: "Buch",
        translation: "Book",
        magicWords: [
          { word: "Bibliothek", translation: "Library" },
          { word: "Kapitel", translation: "Chapter" },
          { word: "Autor", translation: "Autor" },
        ],
        magicPhrase: {
          phrase: "Ich lese jede Nacht ein faszinierendes Buch.",
          translation: "I read a fascinating book every night.",
        },
      },
      es: {
        word: "Libro",
        translation: "Book",
        magicWords: [
          { word: "Biblioteca", translation: "Library" },
          { word: "Capítulo", translation: "Chapter" },
          { word: "Autor", translation: "Autor" },
        ],
        magicPhrase: {
          phrase: "Leo un libro fascinante cada noche.",
          translation: "I read a fascinating book every night.",
        },
      },
      tr: {
        word: "Kitap",
        translation: "Book",
        magicWords: [
          { word: "Kütüphane", translation: "Library" },
          { word: "Bölüm", translation: "Chapter" },
          { word: "Yazar", translation: "Author" },
        ],
        magicPhrase: {
          phrase: "Her gece büyüleyici bir kitap okurum.",
          translation: "I read a fascinating book every night.",
        },
      },
    },
  },
  {
    id: "sea",
    languages: {
      en: {
        word: "Sea",
        translation: "Mer",
        magicWords: [
          { word: "Ocean", translation: "Océan" },
          { word: "Wave", translation: "Vague" },
          { word: "Horizon", translation: "Horizon" },
        ],
        magicPhrase: {
          phrase: "The sea horizon is calm and blue.",
          translation: "L'horizon de la mer est calme et bleu.",
        },
      },
      fr: {
        word: "Mer",
        translation: "Sea",
        magicWords: [
          { word: "Océan", translation: "Ocean" },
          { word: "Vague", translation: "Wave" },
          { word: "Horizon", translation: "Horizon" },
        ],
        magicPhrase: {
          phrase: "L'horizon de la mer est calme et bleu.",
          translation: "The sea horizon is calm and blue.",
        },
      },
      de: {
        word: "Meer",
        translation: "Sea",
        magicWords: [
          { word: "Ozean", translation: "Ocean" },
          { word: "Welle", translation: "Wave" },
          { word: "Horizont", translation: "Horizon" },
        ],
        magicPhrase: {
          phrase: "Der Meereshorizont ist ruhig und blau.",
          translation: "The sea horizon is calm and blue.",
        },
      },
      es: {
        word: "Mar",
        translation: "Sea",
        magicWords: [
          { word: "Océano", translation: "Ocean" },
          { word: "Ola", translation: "Wave" },
          { word: "Horizonte", translation: "Horizon" },
        ],
        magicPhrase: {
          phrase: "El horizonte del mar es tranquilo y azul.",
          translation: "The sea horizon is calm and blue.",
        },
      },
      tr: {
        word: "Deniz",
        translation: "Sea",
        magicWords: [
          { word: "Okyanus", translation: "Ocean" },
          { word: "Dalga", translation: "Wave" },
          { word: "Ufuk", translation: "Horizon" },
        ],
        magicPhrase: {
          phrase: "Deniz ufku sakin ve mavi.",
          translation: "The sea horizon is calm and blue.",
        },
      },
    },
  },
  {
    id: "star",
    languages: {
      en: {
        word: "Star",
        translation: "Étoile",
        magicWords: [
          { word: "Galaxy", translation: "Galaxie" },
          { word: "Shine", translation: "Briller" },
          { word: "Universe", translation: "Univers" },
        ],
        magicPhrase: {
          phrase: "A bright star shines in the night sky.",
          translation: "Une étoile brillante brille dans le ciel nocturne.",
        },
      },
      fr: {
        word: "Étoile",
        translation: "Star",
        magicWords: [
          { word: "Galaxie", translation: "Galaxy" },
          { word: "Briller", translation: "Shine" },
          { word: "Univers", translation: "Universe" },
        ],
        magicPhrase: {
          phrase: "Une étoile brillante brille dans le ciel nocturne.",
          translation: "A bright star shines in the night sky.",
        },
      },
      de: {
        word: "Stern",
        translation: "Star",
        magicWords: [
          { word: "Galaxie", translation: "Galaxy" },
          { word: "Glänzen", translation: "Shine" },
          { word: "Universum", translation: "Universe" },
        ],
        magicPhrase: {
          phrase: "Ein heller Stern leuchtet am Nachthimmel.",
          translation: "A bright star shines in the night sky.",
        },
      },
      es: {
        word: "Estrella",
        translation: "Star",
        magicWords: [
          { word: "Galaxia", translation: "Galaxy" },
          { word: "Brillar", translation: "Shine" },
          { word: "Universo", translation: "Universe" },
        ],
        magicPhrase: {
          phrase: "Una estrella brillante brilla en el cielo nocturno.",
          translation: "A bright star shines in the night sky.",
        },
      },
      tr: {
        word: "Yıldız",
        translation: "Star",
        magicWords: [
          { word: "Galaksi", translation: "Galaxy" },
          { word: "Parlamak", translation: "Shine" },
          { word: "Evren", translation: "Universe" },
        ],
        magicPhrase: {
          phrase: "Gece gökyüzünde parlak bir yıldız parlıyor.",
          translation: "A bright star shines in the night sky.",
        },
      },
    },
  },
];
