// Static data tables for the Creators Mark (cheat) panel.
// Extracted verbatim from CheatModeSplash.tsx — no behavior changes.
import type { PersonalityTrait } from '@/game/companionSystem';

// Available personality traits for companion creation
export const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

export const COMBAT_ROLES = ['tank', 'damage', 'support', 'ranged'] as const;

// Base armor levels (fallback for unrecognized genres)
export const BASE_ARMOR_LEVELS = [
  { id: 'none', label: 'No Armor', description: 'Unarmored, light clothing only' },
  { id: 'light', label: 'Light Armor', description: 'Leather, padded, or cloth protection' },
  { id: 'medium', label: 'Medium Armor', description: 'Chain mail, scale mail, or brigandine' },
  { id: 'heavy', label: 'Heavy Armor', description: 'Plate armor, full mail, heavy protection' },
] as const;

// Genre-specific armor descriptions for portrait generation
export const GENRE_ARMOR_DESCRIPTIONS: Record<string, Record<string, string>> = {
  fantasy: {
    none: 'casual traveler clothes, simple tunic and breeches',
    light: 'leather armor with bracers, ranger-style protection',
    medium: 'chain mail over padded gambeson, adventurer armor',
    heavy: 'full plate armor with metal helmet, heavy knight protection',
  },
  war: {
    none: 'military fatigues, olive drab uniform without armor',
    light: 'tactical vest over combat fatigues, light ballistic protection',
    medium: 'full tactical body armor with combat webbing, military plate carrier',
    heavy: 'heavy combat armor with bomb disposal suit styling, maximum ballistic protection',
  },
  modern: {
    none: 'casual civilian clothes, jeans and shirt',
    light: 'leather jacket, urban tactical style',
    medium: 'tactical vest with knee pads, SWAT-style protection',
    heavy: 'full riot gear with helmet and shield',
  },
  cyberpunk: {
    none: 'neon-accented streetwear, synth-fabric casual clothes',
    light: 'light synth-armor with LED accents, street runner gear',
    medium: 'corporate security armor with tech implants visible',
    heavy: 'full cyber-enhanced power armor, chrome-plated heavy protection',
  },
  scifi: {
    none: 'spacer jumpsuit, utility wear without armor',
    light: 'light enviro-suit with minimal plating',
    medium: 'tactical space marine armor, reinforced suit',
    heavy: 'power armor exosuit, heavy space marine gear',
  },
  western: {
    none: 'cowboy attire with vest and bandana',
    light: 'leather duster coat, frontier ranger style',
    medium: 'reinforced leather with metal studs, outlaw armor',
    heavy: 'steel-reinforced chest plate under duster, heavy frontier protection',
  },
  postapoc: {
    none: 'scavenged rags and patched clothing',
    light: 'leather scraps with improvised padding, wasteland survivor gear',
    medium: 'scrap metal armor bolted together, road warrior style',
    heavy: 'full salvaged power armor, heavy wasteland raider gear',
  },
  pirate: {
    none: 'loose sailor shirt and breeches, bare-chested option',
    light: 'leather vest over billowing shirt, cutlass at hip',
    medium: 'reinforced leather coat with brass buttons, naval officer style',
    heavy: 'conquistador-style breastplate and helmet, heavy naval armor',
  },
  horror: {
    none: 'everyday civilian clothes, survivor attire',
    light: 'motorcycle jacket with protective padding',
    medium: 'improvised armor from sports equipment',
    heavy: 'riot police gear, full protective suit',
  },
  noir: {
    none: 'trench coat over suit, detective attire',
    light: 'leather coat with concealed protection',
    medium: 'bulletproof vest under dress shirt',
    heavy: 'full police tactical gear, vintage style',
  },
  steampunk: {
    none: 'Victorian gentleman/lady attire with goggles',
    light: 'brass-reinforced leather corset/vest, clockwork accessories',
    medium: 'steam-powered mechanical armor pieces, gear-enhanced protection',
    heavy: 'full mechanical exosuit with brass plating and steam pipes',
  },
  mystery: {
    none: 'casual investigator clothes, trench coat',
    light: 'leather jacket, urban explorer style',
    medium: 'tactical vest under jacket',
    heavy: 'full protective tactical gear',
  },
};

// Get genre-appropriate armor description for portrait generation
export function getGenreArmorDescription(genre: string | undefined, armorLevel: string): string {
  const raw = (genre || 'fantasy').toLowerCase().replace(/[_\s-]/g, '');
  
  // Map genre variants to canonical keys
  const genreArmorMap: Record<string, string> = {
    fantasy: 'fantasy',
    modern: 'modern',
    modernlife: 'modern',
    scifi: 'scifi',
    cyberpunk: 'cyberpunk',
    western: 'western',
    noir: 'noir',
    postapoc: 'postapoc',
    postapocalyptic: 'postapoc',
    steampunk: 'steampunk',
    pirate: 'pirate',
    war: 'war',
    horror: 'horror',
    mystery: 'mystery',
  };
  
  const normalizedGenre = genreArmorMap[raw] || 'fantasy';
  const genreDescriptions = GENRE_ARMOR_DESCRIPTIONS[normalizedGenre] || GENRE_ARMOR_DESCRIPTIONS.fantasy;
  return genreDescriptions[armorLevel] || genreDescriptions.light;
}

// Kept for backwards compatibility with UI
export const ARMOR_LEVELS = BASE_ARMOR_LEVELS;

export const ORIGIN_STORIES = [
  { id: 'mentor', label: 'Sent by Mentor', description: 'A trusted mentor sent them to aid you' },
  { id: 'divine', label: 'Divine Intervention', description: 'A higher power guided them to your path' },
  { id: 'old_friend', label: 'Old Friend', description: "A friend from your past has arrived to help" },
  { id: 'stranger', label: 'Mysterious Stranger', description: 'They appeared when you needed them most' },
  { id: 'mutual_enemy', label: 'Mutual Enemy', description: 'United against a common foe' },
  { id: 'debt', label: 'Owes a Debt', description: "They owe you or someone you know" },
] as const;

// When companion appears in the story
export const APPEARANCE_TIMING = [
  { id: 'immediately', label: 'Immediately', description: 'Appears on the very next action' },
  { id: 'next_scene', label: 'Next Scene', description: 'Appears when the next scenario starts' },
  { id: 'contextual', label: 'Later On', description: 'Appears when it makes narrative sense' },
] as const;

// Experience levels with stat ranges
export const EXPERIENCE_LEVELS = [
  { id: 'green', label: 'Green', description: 'Inexperienced, learning the ropes', minStat: 1, maxStat: 4, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { id: 'novice', label: 'Novice', description: 'Some training, still rough around the edges', minStat: 3, maxStat: 6, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'competent', label: 'Competent', description: 'Capable in their role, reliable', minStat: 5, maxStat: 8, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { id: 'skilled', label: 'Skilled', description: 'Above average, proven in combat', minStat: 7, maxStat: 10, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'veteran', label: 'Veteran', description: 'Battle-hardened, elite warrior', minStat: 10, maxStat: 15, color: 'text-red-400', bgColor: 'bg-red-500/20' },
] as const;

// Companion fears based on traits
export const COMPANION_FEARS: Record<PersonalityTrait, string> = {
  'honorable': 'Being forced to break a sworn oath',
  'ruthless': 'Showing weakness to enemies',
  'kind': 'Failing to protect the innocent',
  'cruel': 'Being shown mercy when they dont deserve it',
  'brave': 'Dying without purpose',
  'cowardly': 'Any direct confrontation',
  'greedy': 'Poverty and losing wealth',
  'generous': 'Being unable to help those in need',
  'loyal': 'Betraying a trusted ally',
  'treacherous': 'Being discovered and exposed',
  'romantic': 'Rejection and loneliness',
  'pragmatic': 'Emotional decisions overriding logic',
  'spiritual': 'Losing faith or divine favor',
  'skeptical': 'Being fooled or manipulated',
  'vengeful': 'Enemies escaping justice',
  'forgiving': 'Holding onto bitterness',
  'ambitious': 'Remaining ordinary and forgotten',
  'humble': 'Undeserved praise and attention',
};

// Personality archetypes derived from trait combinations
export const derivePersonalityType = (traits: PersonalityTrait[]): { type: string; icon: string; description: string } => {
  if (traits.includes('honorable') && traits.includes('brave')) {
    return { type: 'Paladin', icon: '⚔️', description: 'Noble warrior bound by code' };
  }
  if (traits.includes('ruthless') && traits.includes('ambitious')) {
    return { type: 'Tyrant', icon: '👑', description: 'Power-hungry and merciless' };
  }
  if (traits.includes('kind') && traits.includes('generous')) {
    return { type: 'Healer', icon: '💚', description: 'Selfless caretaker of others' };
  }
  if (traits.includes('greedy') && traits.includes('pragmatic')) {
    return { type: 'Merchant', icon: '💰', description: 'Profit-driven opportunist' };
  }
  if (traits.includes('romantic') && traits.includes('loyal')) {
    return { type: 'Devoted', icon: '❤️', description: 'Deeply loyal companion' };
  }
  if (traits.includes('skeptical') && traits.includes('pragmatic')) {
    return { type: 'Analyst', icon: '🔍', description: 'Questions everything' };
  }
  if (traits.includes('spiritual') && traits.includes('forgiving')) {
    return { type: 'Mystic', icon: '✨', description: 'Guided by higher purpose' };
  }
  if (traits.includes('vengeful') && traits.includes('brave')) {
    return { type: 'Avenger', icon: '⚡', description: 'Driven by past wrongs' };
  }
  if (traits.includes('cowardly') && traits.includes('greedy')) {
    return { type: 'Scoundrel', icon: '🎭', description: 'Self-serving survivor' };
  }
  if (traits.includes('cruel') && traits.includes('treacherous')) {
    return { type: 'Villain', icon: '💀', description: 'Malicious schemer' };
  }
  // Default based on first trait
  return { type: 'Wanderer', icon: '🌙', description: 'Complex, hard to define' };
};

export const BACKSTORY_TEMPLATES = [
  'A former soldier who left the battlefield seeking redemption.',
  'An exile from a distant land, carrying secrets of their homeland.',
  'A scholar who abandoned their studies for the call of adventure.',
  'Once a thief, now seeking to make amends for past crimes.',
  'A hunter from the wild frontiers, more comfortable with beasts than people.',
  'Survivor of a great tragedy, searching for meaning.',
  'Noble blood runs in their veins, though they hide their heritage.',
  'A wanderer with no memory of their past, piecing together their identity.',
];

// Common spawnable items
export const SPAWNABLE_ITEMS = [
  { id: 'health_potion', name: 'Health Potion', category: 'consumable', icon: '🧪' },
  { id: 'mana_potion', name: 'Mana Potion', category: 'consumable', icon: '💧' },
  { id: 'gold_coins_100', name: 'Gold (100)', category: 'currency', icon: '💰' },
  { id: 'gold_coins_1000', name: 'Gold (1000)', category: 'currency', icon: '💎' },
  { id: 'iron_sword', name: 'Iron Sword', category: 'weapon', icon: '⚔️' },
  { id: 'steel_sword', name: 'Steel Sword', category: 'weapon', icon: '🗡️' },
  { id: 'iron_armor', name: 'Iron Armor', category: 'armor', icon: '🛡️' },
  { id: 'leather_armor', name: 'Leather Armor', category: 'armor', icon: '🥋' },
  { id: 'lockpick', name: 'Lockpick', category: 'tool', icon: '🔓' },
  { id: 'torch', name: 'Torch', category: 'tool', icon: '🔦' },
  { id: 'rope', name: 'Rope', category: 'tool', icon: '🪢' },
  { id: 'rations', name: 'Rations', category: 'consumable', icon: '🍖' },
];

// Teleport locations
export const TELEPORT_LOCATIONS = [
  { id: 'town_square', name: 'Town Square', icon: '🏘️' },
  { id: 'tavern', name: 'The Tavern', icon: '🍺' },
  { id: 'blacksmith', name: 'Blacksmith', icon: '⚒️' },
  { id: 'market', name: 'Market', icon: '🏪' },
  { id: 'castle', name: 'Castle', icon: '🏰' },
  { id: 'forest', name: 'Dark Forest', icon: '🌲' },
  { id: 'cave', name: 'Cave Entrance', icon: '🕳️' },
  { id: 'dungeon', name: 'Dungeon', icon: '⛓️' },
  { id: 'temple', name: 'Temple', icon: '⛪' },
  { id: 'harbor', name: 'Harbor', icon: '⚓' },
];

// Personality quirks - small behavioral traits (1-2 assigned)
export const PERSONALITY_QUIRKS = [
  'hums when nervous',
  'always carries a lucky charm',
  'quotes old proverbs',
  'talks to themselves quietly',
  'cracks knuckles when thinking',
  'never sits with back to door',
  'collects small trinkets',
  'always hungry',
  'overly polite to strangers',
  'distrusts magic/technology',
  'tells stories about "the old days"',
  'laughs at inappropriate moments',
  'fidgets with jewelry or buttons',
  'speaks in third person occasionally',
  'apologizes too much',
  'gives nicknames to everyone',
  'obsessed with cleanliness',
  'terrible with names',
  'snores loudly',
  'early riser, grumpy at night',
  'night owl, slow to wake',
  'superstitious about small things',
  'counts things compulsively',
  'talks too loud',
  'whispers secrets even when alone',
];

// Hidden quirks pool - revealed as relationship deepens
export const HIDDEN_QUIRKS_POOL = [
  'secretly writes poetry',
  'has a phobia they never mention',
  'talks in their sleep',
  'collects pressed flowers',
  'is terrified of a specific animal',
  'has a secret sweet tooth',
  'cries during sad stories',
  'keeps a journal of memories',
  'practices speeches alone',
  'has an imaginary friend from childhood they still think about',
  'secretly believes in old superstitions',
  'hums lullabies when alone',
  'has a hidden talent they never show',
  'keeps a memento from someone lost',
  'is secretly sentimental about gifts',
  'talks to the moon when no one watches',
  'has recurring nightmares they hide',
  'makes up stories about strangers',
  'secretly afraid of being abandoned',
  'has a comfort item they hide from others',
];

// Generate 2-3 hidden quirks based on personality traits
export function generateHiddenQuirks(traits: string[]): string[] {
  const numQuirks = 2 + Math.floor(Math.random() * 2); // 2-3 quirks
  const shuffled = [...HIDDEN_QUIRKS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numQuirks);
}

// Body options for randomization
export const BUST_SIZE_OPTIONS = ['A', 'B', 'C', 'D', 'DD', 'E', 'F'];
export const HIP_WIDTH_OPTIONS = ['narrow', 'average', 'wide', 'very wide'];
export const SHOULDER_WIDTH_OPTIONS = ['narrow', 'average', 'broad', 'very broad'];
export const MALE_PHYSIQUE_OPTIONS = ['slim', 'average', 'athletic', 'muscular', 'stocky', 'dad bod'];
