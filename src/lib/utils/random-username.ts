const adjectives = [
  'Bright', 'Swift', 'Clever', 'Bold', 'Calm', 'Eager', 'Fair', 'Gentle', 'Happy', 'Keen',
  'Lucky', 'Noble', 'Quick', 'Sharp', 'Vivid', 'Warm', 'Zesty', 'Grand', 'Cool', 'Brave',
  'Agile', 'Deft', 'Epic', 'Fine', 'Glowy', 'Hazy', 'Icy', 'Jade', 'Kind', 'Lush',
  'Mild', 'Neat', 'Open', 'Pure', 'Rare', 'Sage', 'Tidy', 'Uber', 'Vast', 'Wise',
  'Azure', 'Bliss', 'Cozy', 'Dawn', 'Elite', 'Fresh', 'Glow', 'Hale', 'Iron', 'Jovial',
  'Knack', 'Lite', 'Muse', 'Nova', 'Opal', 'Peak', 'Quest', 'Rise', 'Star', 'True',
  'Unity', 'Valor', 'Wave', 'Xenon', 'Young', 'Zen', 'Alpha', 'Beta', 'Coral', 'Delta',
  'Echo', 'Flame', 'Gold', 'Hazel', 'Ivory', 'Jazz', 'Kite', 'Lotus', 'Maple', 'Neon',
  'Onyx', 'Pearl', 'Ruby', 'Silk', 'Terra', 'Ultra', 'Velvet', 'Wild', 'Xtra', 'Yonder',
  'Zinc', 'Amber', 'Berry', 'Cedar', 'Dune', 'Elm', 'Fern', 'Gem', 'Herb', 'Iris',
];

const nouns = [
  'Fox', 'Owl', 'Bear', 'Wolf', 'Hawk', 'Deer', 'Lynx', 'Crow', 'Dove', 'Swan',
  'Sage', 'Star', 'Moon', 'Dawn', 'Rain', 'Wind', 'Leaf', 'Tree', 'Fern', 'Rose',
  'Lake', 'Wave', 'Peak', 'Vale', 'Glen', 'Cove', 'Bay', 'Isle', 'Reef', 'Dune',
  'Lion', 'Puma', 'Hare', 'Wren', 'Lark', 'Jay', 'Seal', 'Orca', 'Moth', 'Finch',
  'Pike', 'Reed', 'Moss', 'Birch', 'Oak', 'Pine', 'Elm', 'Ivy', 'Sage', 'Opal',
  'Jade', 'Ruby', 'Onyx', 'Pearl', 'Amber', 'Coral', 'Stone', 'Flint', 'Clay', 'Sand',
  'Bolt', 'Spark', 'Blaze', 'Frost', 'Storm', 'Cloud', 'Mist', 'Haze', 'Gale', 'Tide',
  'Rune', 'Echo', 'Flux', 'Pulse', 'Drift', 'Glow', 'Arc', 'Beam', 'Ray', 'Prism',
  'Forge', 'Anvil', 'Helm', 'Blade', 'Crest', 'Seal', 'Crown', 'Shield', 'Torch', 'Scroll',
  'Pixel', 'Byte', 'Node', 'Link', 'Core', 'Chip', 'Grid', 'Loop', 'Hash', 'Code',
];

/**
 * Generate a random username in the format: AdjectiveNoun#### (e.g., BrightFox4821)
 */
export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${adjective}${noun}${number}`;
}
