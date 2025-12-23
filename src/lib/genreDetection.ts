// Genre detection utilities for real-time scenario analysis
import { GameGenre, GENRE_DATA } from '@/types/genreData';

export interface GenreDetectionResult {
  genre: GameGenre;
  title: string;
  confidence: 'high' | 'medium' | 'low';
  matchedKeywords: string[];
}

// Extended keyword mapping with weights for better detection
const GENRE_KEYWORDS: Record<GameGenre, { keywords: string[]; weight: number }[]> = {
  fantasy: [
    { keywords: ['magic', 'wizard', 'dragon', 'kingdom', 'quest', 'sword', 'elf', 'dwarf', 'orc', 'goblin'], weight: 3 },
    { keywords: ['castle', 'knight', 'princess', 'prince', 'enchanted', 'spell', 'potion', 'mage', 'sorcerer'], weight: 2 },
    { keywords: ['tavern', 'inn', 'guild', 'dungeon', 'adventure', 'hero', 'legend', 'mythical', 'ancient'], weight: 1 },
  ],
  scifi: [
    { keywords: ['space', 'starship', 'galaxy', 'alien', 'planet', 'spacecraft', 'astronaut', 'mars', 'moon'], weight: 3 },
    { keywords: ['robot', 'android', 'AI', 'artificial intelligence', 'hologram', 'laser', 'teleport', 'warp'], weight: 2 },
    { keywords: ['future', 'colony', 'station', 'quantum', 'nanobots', 'cryo', 'hyper', 'orbital', 'cosmic'], weight: 1 },
  ],
  horror: [
    { keywords: ['horror', 'nightmare', 'haunted', 'demon', 'ghost', 'monster', 'terror', 'undead', 'zombie'], weight: 3 },
    { keywords: ['abandoned', 'asylum', 'cursed', 'evil', 'possessed', 'ritual', 'sacrifice', 'dark', 'fear'], weight: 2 },
    { keywords: ['blood', 'death', 'grave', 'cemetery', 'shadow', 'creep', 'hunt', 'survive', 'trapped'], weight: 1 },
  ],
  mystery: [
    { keywords: ['detective', 'mystery', 'murder', 'investigate', 'noir', 'crime', 'clue', 'evidence'], weight: 3 },
    { keywords: ['suspect', 'witness', 'case', 'solve', 'police', 'private eye', 'interrogate', 'alibi'], weight: 2 },
    { keywords: ['secret', 'hidden', 'conspiracy', 'shadowy', 'undercover', 'trail', 'missing', 'victim'], weight: 1 },
  ],
  pirate: [
    { keywords: ['pirate', 'treasure', 'ship', 'captain', 'sail', 'ocean', 'sea', 'island', 'crew'], weight: 3 },
    { keywords: ['plunder', 'buccaneer', 'corsair', 'cannon', 'deck', 'port', 'harbor', 'compass', 'map'], weight: 2 },
    { keywords: ['storm', 'navy', 'smuggle', 'mutiny', 'parrot', 'rum', 'gold', 'caribbean', 'voyage'], weight: 1 },
  ],
  western: [
    { keywords: ['cowboy', 'western', 'frontier', 'outlaw', 'sheriff', 'saloon', 'gunslinger', 'ranch'], weight: 3 },
    { keywords: ['revolver', 'horse', 'desert', 'dusty', 'bounty', 'wanted', 'duel', 'marshal', 'bandit'], weight: 2 },
    { keywords: ['cattle', 'gold rush', 'prospector', 'native', 'train', 'stagecoach', 'whiskey', 'colt'], weight: 1 },
  ],
  cyberpunk: [
    { keywords: ['cyberpunk', 'hacker', 'neon', 'chrome', 'corporation', 'dystopia', 'implant', 'neural'], weight: 3 },
    { keywords: ['megacity', 'netrunner', 'cyborg', 'augment', 'synthetic', 'street', 'corp', 'data'], weight: 2 },
    { keywords: ['noir', 'rain', 'night', 'underworld', 'tech', 'wire', 'chip', 'jack', 'punk', 'blade'], weight: 1 },
  ],
  postapoc: [
    { keywords: ['apocalypse', 'wasteland', 'survivor', 'radiation', 'fallout', 'nuclear', 'ruins', 'mutant'], weight: 3 },
    { keywords: ['bunker', 'vault', 'scavenger', 'raider', 'tribe', 'settlement', 'collapse', 'plague'], weight: 2 },
    { keywords: ['water', 'gas', 'fuel', 'desert', 'wreck', 'camp', 'salvage', 'supplies', 'survival'], weight: 1 },
  ],
  custom: [], // Fallback, no keywords
};

const GENRE_TITLES: Record<GameGenre, string> = {
  fantasy: 'Fantasy Adventure',
  scifi: 'Sci-Fi Adventure',
  horror: 'Horror Adventure',
  mystery: 'Mystery Adventure',
  pirate: 'Pirate Adventure',
  western: 'Western Adventure',
  cyberpunk: 'Cyberpunk Adventure',
  postapoc: 'Post-Apocalyptic Adventure',
  custom: 'Custom Adventure',
};

export const GENRE_ICONS: Record<GameGenre, string> = {
  fantasy: '🏰',
  scifi: '🚀',
  horror: '💀',
  mystery: '🔍',
  pirate: '🏴‍☠️',
  western: '🤠',
  cyberpunk: '⚡',
  postapoc: '☢️',
  custom: '✨',
};

export function detectGenreFromText(text: string): GenreDetectionResult {
  if (!text.trim()) {
    return {
      genre: 'fantasy',
      title: GENRE_TITLES.fantasy,
      confidence: 'low',
      matchedKeywords: [],
    };
  }

  const lower = text.toLowerCase();
  const scores: Record<GameGenre, { score: number; matches: string[] }> = {
    fantasy: { score: 0, matches: [] },
    scifi: { score: 0, matches: [] },
    horror: { score: 0, matches: [] },
    mystery: { score: 0, matches: [] },
    pirate: { score: 0, matches: [] },
    western: { score: 0, matches: [] },
    cyberpunk: { score: 0, matches: [] },
    postapoc: { score: 0, matches: [] },
    custom: { score: 0, matches: [] },
  };

  // Calculate scores for each genre
  for (const [genre, keywordGroups] of Object.entries(GENRE_KEYWORDS)) {
    if (genre === 'custom') continue;
    
    for (const group of keywordGroups) {
      for (const keyword of group.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          scores[genre as GameGenre].score += group.weight;
          scores[genre as GameGenre].matches.push(keyword);
        }
      }
    }
  }

  // Find the highest scoring genre
  let bestGenre: GameGenre = 'fantasy';
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const [genre, data] of Object.entries(scores)) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestGenre = genre as GameGenre;
      bestMatches = data.matches;
    }
  }

  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (bestScore >= 5) confidence = 'high';
  else if (bestScore >= 2) confidence = 'medium';

  return {
    genre: bestGenre,
    title: GENRE_TITLES[bestGenre],
    confidence,
    matchedKeywords: [...new Set(bestMatches)], // Remove duplicates
  };
}

export function getAllGenres(): { id: GameGenre; name: string; icon: string }[] {
  return [
    { id: 'fantasy', name: 'Fantasy', icon: GENRE_ICONS.fantasy },
    { id: 'scifi', name: 'Sci-Fi', icon: GENRE_ICONS.scifi },
    { id: 'horror', name: 'Horror', icon: GENRE_ICONS.horror },
    { id: 'mystery', name: 'Mystery', icon: GENRE_ICONS.mystery },
    { id: 'pirate', name: 'Pirate', icon: GENRE_ICONS.pirate },
    { id: 'western', name: 'Western', icon: GENRE_ICONS.western },
    { id: 'cyberpunk', name: 'Cyberpunk', icon: GENRE_ICONS.cyberpunk },
    { id: 'postapoc', name: 'Post-Apocalyptic', icon: GENRE_ICONS.postapoc },
  ];
}

export function getGenreTitle(genre: GameGenre): string {
  return GENRE_TITLES[genre];
}
