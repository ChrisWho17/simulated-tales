import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2, X, Save, RefreshCw, Loader2, User, Heart, Shield, Sword, 
  Brain, Zap, Star, Coins, ChevronDown, ChevronUp, AlertTriangle,
  Shirt, Sparkles, Activity, Database, ShieldCheck, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Users, Plus, Trash2, Edit3, Package,
  Flame, Clock, MapPin, Infinity, Crown, Skull, Eye, Volume2, VolumeX,
  Crosshair, Target, Dices, RotateCcw, Settings, Gauge, Navigation,
  FastForward, Rewind, Sun, Moon, Backpack, Swords, PlusCircle, Timer,
  SkipForward, Play, Pause, MessageSquare, HeartPulse, Sparkle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAchievementsOptional } from '@/components/game/Achievements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DataIntegrityService, IntegrityReport } from '@/services/dataIntegrityService';
import { EventBusDebugPanel } from '@/components/game/EventBusDebugPanel';
import { RPGCharacter, CharacterStats } from '@/types/rpgCharacter';
import { 
  TieredAppearance, 
  SimpleAppearance, 
  DetailedAppearance, 
  FullAppearance,
  SKIN_TONES,
  HAIR_STYLES,
  HAIR_COLORS,
  EYE_COLORS,
  BUILD_OPTIONS,
  HEIGHT_OPTIONS,
  GENDER_OPTIONS,
  CLOTHING_STYLE_OPTIONS,
  Gender,
} from '@/types/characterCreation';
import { 
  PlayerPortraitReference, 
  savePlayerPortraitReference, 
  loadPlayerPortraitReference 
} from '@/game/playerPortraitReference';
import { 
  companionSystem,
  CompanionState,
  CompanionMood,
  CompanionStatus,
  COMPANION_TEMPLATES,
  PersonalityTrait,
} from '@/game/companionSystem';
import { wardrobeManager, WardrobeState, WardrobeItem } from '@/game/wardrobeSystem';
import { getStarterClothingForGenre, buildClothingDescriptionForAI } from '@/game/starterClothingSystem';
import { ClothingSlot } from '@/game/clothingItemSystem';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InventoryEditor } from './InventoryEditor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CHARACTER_KEY = 'living-world-character';

// Hook for detecting cheat mode commands
export function useCheatModeCommand() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<DevPanelMode>('cheat');
  
  const checkCommand = useCallback((input: string): boolean => {
    const trimmed = input.trim().toLowerCase();
    
    // Handle all cheat command variants
    if (trimmed === '/iamacheater' || trimmed === '/imacheater' || trimmed === '/cheat') {
      setInitialMode('cheat');
      setIsOpen(true);
      return true;
    }
    
    if (trimmed === '/events' || trimmed === '/eventbus') {
      setInitialMode('events');
      setIsOpen(true);
      return true;
    }
    
    if (trimmed === '/integrity' || trimmed === '/scan') {
      setInitialMode('integrity');
      setIsOpen(true);
      return true;
    }
    
    return false;
  }, []);
  
  return {
    isOpen,
    setIsOpen,
    initialMode,
    checkCommand,
  };
}

// Screen types for navigation
type EditorScreen = 'cheats' | 'character' | 'inventory' | 'companions';

const SCREENS: { id: EditorScreen; label: string; icon: React.ReactNode }[] = [
  { id: 'cheats', label: 'Cheats', icon: <Wand2 className="w-4 h-4" /> },
  { id: 'character', label: 'Character', icon: <User className="w-4 h-4" /> },
  { id: 'inventory', label: 'Inventory', icon: <Package className="w-4 h-4" /> },
  { id: 'companions', label: 'Companions', icon: <Users className="w-4 h-4" /> },
];

// Available personality traits for companion creation
const PERSONALITY_TRAITS: PersonalityTrait[] = [
  'honorable', 'ruthless', 'kind', 'cruel', 'brave', 'cowardly',
  'greedy', 'generous', 'loyal', 'treacherous', 'romantic', 'pragmatic',
  'spiritual', 'skeptical', 'vengeful', 'forgiving', 'ambitious', 'humble'
];

const COMBAT_ROLES = ['tank', 'damage', 'support', 'ranged'] as const;
const ARMOR_LEVELS = [
  { id: 'none', label: 'No Armor', description: 'Unarmored, light clothing only' },
  { id: 'light', label: 'Light Armor', description: 'Leather, padded, or cloth protection' },
  { id: 'medium', label: 'Medium Armor', description: 'Chain mail, scale mail, or brigandine' },
  { id: 'heavy', label: 'Heavy Armor', description: 'Plate armor, full mail, heavy protection' },
] as const;

const ORIGIN_STORIES = [
  { id: 'mentor', label: 'Sent by Mentor', description: 'A trusted mentor sent them to aid you' },
  { id: 'divine', label: 'Divine Intervention', description: 'A higher power guided them to your path' },
  { id: 'old_friend', label: 'Old Friend', description: "A friend from your past has arrived to help" },
  { id: 'stranger', label: 'Mysterious Stranger', description: 'They appeared when you needed them most' },
  { id: 'mutual_enemy', label: 'Mutual Enemy', description: 'United against a common foe' },
  { id: 'debt', label: 'Owes a Debt', description: "They owe you or someone you know" },
] as const;

// Experience levels with stat ranges
const EXPERIENCE_LEVELS = [
  { id: 'green', label: 'Green', description: 'Inexperienced, learning the ropes', minStat: 1, maxStat: 4, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { id: 'novice', label: 'Novice', description: 'Some training, still rough around the edges', minStat: 3, maxStat: 6, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { id: 'competent', label: 'Competent', description: 'Capable in their role, reliable', minStat: 5, maxStat: 8, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { id: 'skilled', label: 'Skilled', description: 'Above average, proven in combat', minStat: 7, maxStat: 10, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { id: 'veteran', label: 'Veteran', description: 'Battle-hardened, elite warrior', minStat: 10, maxStat: 15, color: 'text-red-400', bgColor: 'bg-red-500/20' },
] as const;

// Companion fears based on traits
const COMPANION_FEARS: Record<PersonalityTrait, string> = {
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
const derivePersonalityType = (traits: PersonalityTrait[]): { type: string; icon: string; description: string } => {
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

// Genre-specific name pools by gender
const GENRE_NAMES: Record<string, { male: string[]; female: string[]; other: string[] }> = {
  fantasy: {
    male: ['Marcus', 'Aldric', 'Gareth', 'Theron', 'Roland', 'Cedric', 'Edmund', 'Gideon', 'Hadrian', 'Leander'],
    female: ['Elena', 'Lyra', 'Seraphina', 'Celeste', 'Diana', 'Freya', 'Helena', 'Iris', 'Luna', 'Ophelia'],
    other: ['Rowan', 'Sage', 'Ash', 'Morgan', 'Raven', 'Quinn', 'Wren', 'Phoenix', 'River', 'Storm'],
  },
  modern: {
    male: ['James', 'Michael', 'David', 'Ryan', 'Alex', 'Chris', 'Daniel', 'Marcus', 'Jason', 'Kevin'],
    female: ['Sarah', 'Emily', 'Jessica', 'Amanda', 'Nicole', 'Rachel', 'Megan', 'Lauren', 'Natalie', 'Samantha'],
    other: ['Jordan', 'Alex', 'Taylor', 'Casey', 'Riley', 'Morgan', 'Avery', 'Quinn', 'Jamie', 'Drew'],
  },
  scifi: {
    male: ['Zane', 'Marcus', 'Rex', 'Cole', 'Jax', 'Kane', 'Dex', 'Orion', 'Atlas', 'Cyrus'],
    female: ['Nova', 'Stella', 'Vera', 'Lyra', 'Zara', 'Kira', 'Mira', 'Astra', 'Cora', 'Vega'],
    other: ['Seren', 'Kai', 'Sol', 'Phoenix', 'Onyx', 'Rune', 'Cipher', 'Nova', 'Echo', 'Argo'],
  },
  cyberpunk: {
    male: ['Dex', 'Kane', 'Raze', 'Jax', 'Cole', 'Viktor', 'Rex', 'Nero', 'Zeke', 'Mack'],
    female: ['Vera', 'Kira', 'Roxy', 'Jade', 'Sasha', 'Nova', 'Mira', 'Zara', 'Nyx', 'Vex'],
    other: ['Zero', 'Rune', 'Cipher', 'Neon', 'Glitch', 'Flux', 'Chrome', 'Pixel', 'Hex', 'Byte'],
  },
  western: {
    male: ['Jack', 'William', 'Samuel', 'Thomas', 'Henry', 'James', 'Wyatt', 'Cole', 'Jesse', 'Eli'],
    female: ['Mary', 'Sarah', 'Emma', 'Grace', 'Rose', 'Clara', 'Annie', 'Lily', 'Ruth', 'Pearl'],
    other: ['Dakota', 'Carson', 'Morgan', 'Riley', 'Jesse', 'Quinn', 'Sage', 'Reese', 'Lane', 'Arden'],
  },
  horror: {
    male: ['Thomas', 'Edward', 'Victor', 'Charles', 'Henry', 'William', 'James', 'Robert', 'Arthur', 'George'],
    female: ['Elizabeth', 'Mary', 'Victoria', 'Catherine', 'Rose', 'Clara', 'Evelyn', 'Margaret', 'Ruth', 'Helen'],
    other: ['Morgan', 'Raven', 'Quinn', 'Ash', 'Blair', 'Salem', 'Shadow', 'Vesper', 'Crow', 'Winter'],
  },
  noir: {
    male: ['Jack', 'Vincent', 'Frank', 'Sam', 'Tony', 'Mickey', 'Lou', 'Eddie', 'Charlie', 'Max'],
    female: ['Vivian', 'Carmen', 'Stella', 'Rose', 'Gloria', 'Vera', 'Dolores', 'Rita', 'Lana', 'Ruby'],
    other: ['Morgan', 'Jackie', 'Lou', 'Sal', 'Bernie', 'Pat', 'Alex', 'Riley', 'Casey', 'Terry'],
  },
  post_apocalyptic: {
    male: ['Max', 'Rex', 'Cole', 'Kane', 'Jax', 'Zeke', 'Ash', 'Stone', 'Flint', 'Hawk'],
    female: ['Max', 'Ripley', 'Sage', 'Raven', 'Storm', 'Wren', 'Ember', 'Rust', 'Vera', 'Thorne'],
    other: ['Ash', 'Raven', 'Storm', 'Rust', 'Bone', 'Slate', 'Flint', 'Ember', 'Echo', 'Ghost'],
  },
  steampunk: {
    male: ['Theodore', 'Archibald', 'Edmund', 'Jasper', 'Oliver', 'Arthur', 'Percival', 'Cornelius', 'Reginald', 'Barnaby'],
    female: ['Adelaide', 'Beatrice', 'Cordelia', 'Eugenia', 'Florence', 'Harriet', 'Imogen', 'Josephine', 'Lavinia', 'Millicent'],
    other: ['Sterling', 'Ashby', 'Emery', 'Morgan', 'Finley', 'Aubrey', 'Bellamy', 'Everett', 'Harper', 'Kendall'],
  },
  default: {
    male: ['Marcus', 'Erik', 'Darius', 'Finn', 'Gareth', 'Roland', 'Theron', 'Vance', 'Aldric', 'Drake'],
    female: ['Elena', 'Lyra', 'Thea', 'Vera', 'Aria', 'Brynn', 'Diana', 'Evelyn', 'Helena', 'Kira'],
    other: ['Rowan', 'Sage', 'River', 'Ash', 'Phoenix', 'Quinn', 'Morgan', 'Raven', 'Storm', 'Wren'],
  },
};

// Helper to get names for current genre
const getGenreNames = (genreStr: string): { male: string[]; female: string[]; other: string[] } => {
  const normalized = (genreStr || 'fantasy').toLowerCase().replace(/[_\s-]/g, '_');
  return GENRE_NAMES[normalized] || GENRE_NAMES.default;
};

const BACKSTORY_TEMPLATES = [
  'A former soldier who left the battlefield seeking redemption.',
  'An exile from a distant land, carrying secrets of their homeland.',
  'A scholar who abandoned their studies for the call of adventure.',
  'Once a thief, now seeking to make amends for past crimes.',
  'A hunter from the wild frontiers, more comfortable with beasts than people.',
  'Survivor of a great tragedy, searching for meaning.',
  'Noble blood runs in their veins, though they hide their heritage.',
  'A wanderer with no memory of their past, piecing together their identity.',
];

interface CheatModeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  character?: RPGCharacter & { portraitUrl?: string };
  onUpdateCharacter?: (character: RPGCharacter & { portraitUrl?: string }) => void;
  genre?: string;
  initialMode?: DevPanelMode;
}

export type DevPanelMode = 'cheat' | 'events' | 'integrity';

// Cheat state interface
interface CheatState {
  godMode: boolean;
  infiniteGold: boolean;
  maxStats: boolean;
  instantKill: boolean;
  noClip: boolean;
  speedMultiplier: number;
  timeScale: number;
  unlockAll: boolean;
  invisibility: boolean;
  infiniteAmmo: boolean;
  // New cheats
  freezeTime: boolean;
  skipToDay: boolean;
  skipToNight: boolean;
  revealMap: boolean;
  noHunger: boolean;
  noFatigue: boolean;
}

// Common spawnable items
const SPAWNABLE_ITEMS = [
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
const TELEPORT_LOCATIONS = [
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
const PERSONALITY_QUIRKS = [
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
const HIDDEN_QUIRKS_POOL = [
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
function generateHiddenQuirks(traits: string[]): string[] {
  const numQuirks = 2 + Math.floor(Math.random() * 2); // 2-3 quirks
  const shuffled = [...HIDDEN_QUIRKS_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, numQuirks);
}

// Enhanced Companion creator state with armor and origin
interface CompanionCreatorState {
  name: string;
  gender: Gender;
  height: string;
  build: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  traits: PersonalityTrait[];
  combatRole: typeof COMBAT_ROLES[number];
  armorLevel: typeof ARMOR_LEVELS[number]['id'];
  originStory: typeof ORIGIN_STORIES[number]['id'];
  experienceLevel: typeof EXPERIENCE_LEVELS[number]['id'];
  backstory: string;
  skills: string[];
  speechPattern: string;
  catchphrases: string[];
  age: string;
  distinguishingFeatures: string[];
  quirks: string[];
  // Body shape - gender specific
  bustSize?: string; // Female
  hipWidth?: string; // Female
  shoulderWidth?: string; // Male
  physique?: string; // Male
  portraitUrl: string | null;
  isGeneratingPortrait: boolean;
}

// Body options for randomization
const BUST_SIZE_OPTIONS = ['A', 'B', 'C', 'D', 'DD', 'E', 'F'];
const HIP_WIDTH_OPTIONS = ['narrow', 'average', 'wide', 'very wide'];
const SHOULDER_WIDTH_OPTIONS = ['narrow', 'average', 'broad', 'very broad'];
const MALE_PHYSIQUE_OPTIONS = ['slim', 'average', 'athletic', 'muscular', 'stocky', 'dad bod'];

const DEFAULT_COMPANION_CREATOR: CompanionCreatorState = {
  name: '',
  gender: 'other',
  height: 'average',
  build: 'average',
  skinTone: 'Medium',
  hairStyle: 'Medium',
  hairColor: 'Brown',
  eyeColor: 'Brown',
  traits: ['loyal', 'brave'],
  combatRole: 'damage',
  armorLevel: 'light',
  originStory: 'stranger',
  experienceLevel: 'competent',
  backstory: '',
  skills: [],
  speechPattern: 'casual, friendly',
  catchphrases: [],
  age: 'adult',
  distinguishingFeatures: [],
  quirks: [],
  bustSize: undefined,
  hipWidth: undefined,
  shoulderWidth: undefined,
  physique: undefined,
  portraitUrl: null,
  isGeneratingPortrait: false,
};

// Save character appearance to campaign for consistent image generation
function saveCharacterAppearanceToCampaign(
  characterData: any,
  genre: string
): void {
  try {
    const portraitReference = loadPlayerPortraitReference();
    
    if (portraitReference && characterData.appearance) {
      const simple = characterData.appearance.simple;
      const detailed = characterData.appearance.detailed;
      const full = characterData.appearance.full;
      
      savePlayerPortraitReference(
        {
          name: characterData.name || portraitReference.name,
          gender: simple?.gender || portraitReference.gender,
          build: simple?.build || portraitReference.build,
          height: simple?.height || portraitReference.height,
          skinTone: detailed?.skinTone || portraitReference.skinTone,
          hairColor: detailed?.hairColor || portraitReference.hairColor,
          hairStyle: detailed?.hairStyle || portraitReference.hairStyle,
          eyeColor: detailed?.eyeColor || portraitReference.eyeColor,
          details: detailed?.distinguishingFeatures || portraitReference.details,
          tieredAppearance: characterData.appearance,
        },
        genre,
        portraitReference.className,
        portraitReference.portraitHints
      );
      
      console.log('[CheatMode] Updated character appearance in campaign');
    }
    
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
  } catch (error) {
    console.error('[CheatMode] Failed to save character appearance:', error);
  }
}

export function CheatModeSplash({ 
  isOpen, 
  onClose, 
  character, 
  onUpdateCharacter,
  genre = 'fantasy',
  initialMode = 'cheat'
}: CheatModeSplashProps) {
  const achievements = useAchievementsOptional();
  const hasUnlockedCheaterAchievement = useRef(false);
  
  // Current screen
  const [currentScreen, setCurrentScreen] = useState<EditorScreen>('cheats');
  
  // Cheat state
  const [cheats, setCheats] = useState<CheatState>({
    godMode: false,
    infiniteGold: false,
    maxStats: false,
    instantKill: false,
    noClip: false,
    speedMultiplier: 1,
    timeScale: 1,
    unlockAll: false,
    invisibility: false,
    infiniteAmmo: false,
    freezeTime: false,
    skipToDay: false,
    skipToNight: false,
    revealMap: false,
    noHunger: false,
    noFatigue: false,
  });
  
  // Spawning state
  const [spawnCategory, setSpawnCategory] = useState<string>('all');
  const [teleportTarget, setTeleportTarget] = useState<string>('');
  
  // Character stats
  const [name, setName] = useState(character?.name || '');
  const [level, setLevel] = useState(character?.level || 1);
  const [gold, setGold] = useState(character?.gold || 0);
  const [currentHealth, setCurrentHealth] = useState(character?.currentHealth || 100);
  const [maxHealth, setMaxHealth] = useState(character?.maxHealth || 100);
  const [experience, setExperience] = useState(character?.experience || 0);
  
  // Stats
  const [stats, setStats] = useState<CharacterStats>(character?.stats || {
    strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10
  });
  
  // Appearance
  const [appearance, setAppearance] = useState<TieredAppearance | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    stats: initialMode === 'cheat',
    appearance: false,
    equipment: false,
    developer: initialMode === 'events' || initialMode === 'integrity',
  });
  
  // Developer tools state
  const [showEventBus, setShowEventBus] = useState(initialMode === 'events');
  const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Wardrobe state
  const [wardrobeState, setWardrobeState] = useState<WardrobeState | null>(null);
  const [clothingDescription, setClothingDescription] = useState<string>('');
  
  // Companion state
  const [companions, setCompanions] = useState<CompanionState[]>([]);
  const [editingCompanion, setEditingCompanion] = useState<CompanionState | null>(null);
  const [showCompanionCreator, setShowCompanionCreator] = useState(false);
  const [companionCreator, setCompanionCreator] = useState<CompanionCreatorState>(DEFAULT_COMPANION_CREATOR);
  const [companionCreatorStep, setCompanionCreatorStep] = useState<'basics' | 'appearance' | 'personality' | 'combat'>('basics');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Handle initialMode changes when panel opens
  useEffect(() => {
    if (isOpen) {
      setExpandedSections({
        stats: initialMode === 'cheat',
        appearance: false,
        equipment: false,
        developer: initialMode === 'events' || initialMode === 'integrity',
      });
      setShowEventBus(initialMode === 'events');
      
      // Reset to cheats screen when opening
      setCurrentScreen('cheats');
      
      // Auto-run integrity scan when opened via /integrity command
      if (initialMode === 'integrity') {
        setIsScanning(true);
        DataIntegrityService.runFullScan().then(report => {
          setIntegrityReport(report);
          if (report.corrupted === 0 && report.unrecoverable === 0) {
            toast.success('All campaigns healthy!');
          } else {
            toast.warning(`Found ${report.corrupted + report.unrecoverable} issues`);
          }
        }).catch(() => {
          toast.error('Scan failed');
        }).finally(() => {
          setIsScanning(false);
        });
      }
    }
  }, [isOpen, initialMode]);
  
  // Unlock cheater achievement when cheat mode is first opened
  useEffect(() => {
    if (isOpen && !hasUnlockedCheaterAchievement.current && achievements) {
      achievements.unlockAchievement('cheater');
      hasUnlockedCheaterAchievement.current = true;
    }
  }, [isOpen, achievements]);
  
  // Load character data when opened
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      const loadData = async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        try {
          const savedChar = localStorage.getItem(CHARACTER_KEY);
          if (savedChar) {
            const parsed = JSON.parse(savedChar);
            setName(parsed.basicInfo?.name || character?.name || '');
            setAppearance(parsed.appearance || null);
          }
          
          if (character) {
            setLevel(character.level);
            setGold(character.gold);
            setCurrentHealth(character.currentHealth);
            setMaxHealth(character.maxHealth);
            setExperience(character.experience);
            setStats(character.stats);
          }
          
          // Load wardrobe state
          const currentWardrobe = wardrobeManager.getState();
          setWardrobeState(currentWardrobe);
          
          // Build clothing description
          const equippedItems = Object.entries(currentWardrobe.equipped)
            .filter(([_, wi]) => wi !== undefined)
            .map(([slot, wi]) => ({
              slot: slot as ClothingSlot,
              name: wi!.item.name,
              description: wi!.item.description,
            }));
          
          const description = buildClothingDescriptionForAI(equippedItems, genre);
          setClothingDescription(description);
          
          // Load all companions (including dead ones for resuscitation)
          setCompanions(companionSystem.getAllCompanions());
        } catch (e) {
          console.error('[CheatMode] Failed to load character:', e);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
    } else {
      setIsLoading(true);
    }
  }, [isOpen, character, genre]);
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };
  
  const handleStatChange = (stat: keyof CharacterStats, value: number) => {
    setStats(prev => ({ ...prev, [stat]: Math.max(1, Math.min(30, value)) }));
  };
  
  const handleAppearanceSimpleChange = (key: keyof SimpleAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        simple: { ...prev.simple, [key]: value }
      };
    });
  };
  
  const handleAppearanceDetailedChange = (key: keyof DetailedAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        detailed: { ...prev.detailed, [key]: value } as DetailedAppearance
      };
    });
  };
  
  const handleAppearanceFullChange = (key: keyof FullAppearance, value: any) => {
    setAppearance(prev => {
      if (!prev) return null;
      return {
        ...prev,
        full: { ...prev.full, [key]: value } as FullAppearance
      };
    });
  };
  
  // Cheat actions
  const applyCheat = (cheatName: keyof CheatState, value: boolean | number) => {
    setCheats(prev => ({ ...prev, [cheatName]: value }));
    
    // Apply immediate effects
    if (cheatName === 'godMode' && value === true) {
      setCurrentHealth(maxHealth);
      toast.success('God Mode enabled! You are invincible.');
    }
    if (cheatName === 'infiniteGold' && value === true) {
      setGold(999999);
      toast.success('Infinite gold enabled!');
    }
    if (cheatName === 'maxStats' && value === true) {
      setStats({
        strength: 30, dexterity: 30, constitution: 30,
        intelligence: 30, wisdom: 30, charisma: 30
      });
      toast.success('All stats maxed to 30!');
    }
    if (cheatName === 'unlockAll' && value === true) {
      toast.success('All items and abilities unlocked!');
    }
  };
  
  const addInstantGold = (amount: number) => {
    setGold(prev => prev + amount);
    toast.success(`Added ${amount.toLocaleString()} gold!`);
  };
  
  const addInstantXP = (amount: number) => {
    setExperience(prev => prev + amount);
    toast.success(`Added ${amount.toLocaleString()} XP!`);
  };
  
  const levelUp = () => {
    setLevel(prev => Math.min(prev + 1, 100));
    toast.success(`Leveled up to ${level + 1}!`);
  };
  
  const fullHeal = () => {
    setCurrentHealth(maxHealth);
    toast.success('Fully healed!');
  };
  
  // Time manipulation functions
  const skipTime = (hours: number) => {
    toast.success(`Skipped ${hours} hour${hours > 1 ? 's' : ''} ahead!`);
    // Store time skip in localStorage for game engine to process
    try {
      const cheatActions = JSON.parse(localStorage.getItem('cheat-pending-actions') || '[]');
      cheatActions.push({ type: 'time_skip', hours, timestamp: Date.now() });
      localStorage.setItem('cheat-pending-actions', JSON.stringify(cheatActions));
    } catch (e) {
      console.error('Failed to queue time skip:', e);
    }
  };
  
  const setTimeOfDay = (time: 'dawn' | 'noon' | 'dusk' | 'midnight') => {
    const timeMap = { dawn: 6, noon: 12, dusk: 18, midnight: 0 };
    toast.success(`Time set to ${time}!`);
    try {
      const cheatActions = JSON.parse(localStorage.getItem('cheat-pending-actions') || '[]');
      cheatActions.push({ type: 'set_time', time, hour: timeMap[time], timestamp: Date.now() });
      localStorage.setItem('cheat-pending-actions', JSON.stringify(cheatActions));
    } catch (e) {
      console.error('Failed to queue time set:', e);
    }
  };
  
  // Teleport function
  const teleportTo = (locationId: string) => {
    const location = TELEPORT_LOCATIONS.find(l => l.id === locationId);
    if (location) {
      toast.success(`Teleported to ${location.name}!`);
      try {
        const cheatActions = JSON.parse(localStorage.getItem('cheat-pending-actions') || '[]');
        cheatActions.push({ type: 'teleport', location: location.name, locationId, timestamp: Date.now() });
        localStorage.setItem('cheat-pending-actions', JSON.stringify(cheatActions));
      } catch (e) {
        console.error('Failed to queue teleport:', e);
      }
    }
    setTeleportTarget('');
  };
  
  // Spawn item function
  const spawnItem = (itemId: string) => {
    const item = SPAWNABLE_ITEMS.find(i => i.id === itemId);
    if (item) {
      toast.success(`Spawned ${item.name}!`);
      
      // Handle gold specially
      if (item.category === 'currency') {
        const amount = itemId.includes('1000') ? 1000 : 100;
        setGold(prev => prev + amount);
      } else {
        // Queue item spawn for inventory system
        try {
          const cheatActions = JSON.parse(localStorage.getItem('cheat-pending-actions') || '[]');
          cheatActions.push({ 
            type: 'spawn_item', 
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            timestamp: Date.now() 
          });
          localStorage.setItem('cheat-pending-actions', JSON.stringify(cheatActions));
        } catch (e) {
          console.error('Failed to queue item spawn:', e);
        }
      }
    }
  };
  
  // Navigation
  const currentScreenIndex = SCREENS.findIndex(s => s.id === currentScreen);
  const canGoLeft = currentScreenIndex > 0;
  const canGoRight = currentScreenIndex < SCREENS.length - 1;
  
  const goToScreen = (screen: EditorScreen) => setCurrentScreen(screen);
  const goLeft = () => canGoLeft && setCurrentScreen(SCREENS[currentScreenIndex - 1].id);
  const goRight = () => canGoRight && setCurrentScreen(SCREENS[currentScreenIndex + 1].id);
  
  // Companion creator
  const createCompanionFromCreator = () => {
    if (!companionCreator.name.trim()) {
      toast.error('Please enter a companion name');
      return;
    }
    
    const companionId = `companion_${Date.now()}`;
    
    // Create custom personality based on selected traits
    const customPersonality = {
      traits: companionCreator.traits,
      values: {
        honor: companionCreator.traits.includes('honorable') ? 80 : companionCreator.traits.includes('ruthless') ? 20 : 50,
        wealth: companionCreator.traits.includes('greedy') ? 90 : companionCreator.traits.includes('generous') ? 20 : 50,
        power: companionCreator.traits.includes('ambitious') ? 80 : companionCreator.traits.includes('humble') ? 20 : 50,
        love: companionCreator.traits.includes('romantic') ? 80 : companionCreator.traits.includes('pragmatic') ? 30 : 50,
        freedom: 60,
        justice: companionCreator.traits.includes('kind') ? 70 : companionCreator.traits.includes('cruel') ? 20 : 50,
        knowledge: 50,
        family: 50,
      },
      approves: companionCreator.traits.includes('honorable') 
        ? ['truth', 'loyalty', 'bravery'] 
        : companionCreator.traits.includes('greedy')
        ? ['theft', 'greed']
        : ['diplomacy', 'mercy'],
      disapproves: companionCreator.traits.includes('kind')
        ? ['cruelty', 'betrayal']
        : companionCreator.traits.includes('ruthless')
        ? ['mercy', 'charity']
        : ['cowardice'],
      romanticInterest: {
        enabled: companionCreator.traits.includes('romantic'),
        preferredGender: 'any' as const,
        attractedToPlayer: companionCreator.traits.includes('romantic'),
        romanceThreshold: 70,
      },
      betrayalThreshold: companionCreator.traits.includes('loyal') ? -80 : -40,
      departureThreshold: companionCreator.traits.includes('loyal') ? -60 : -30,
      speechPattern: companionCreator.speechPattern,
      catchphrases: companionCreator.catchphrases.length > 0 
        ? companionCreator.catchphrases 
        : ['Interesting...', 'I see.'],
      quirks: companionCreator.quirks || [],
      hiddenQuirks: generateHiddenQuirks(companionCreator.traits),
    };
    
    // Build the story introduction
    const storyIntroduction = buildCompanionIntroduction();
    
    const companion: CompanionState = {
      id: companionId,
      name: companionCreator.name.trim(),
      status: 'active',
      mood: 'content',
      moodIntensity: 60,
      affinity: 30,
      trust: 40,
      respect: 40,
      fear: 0,
      romanticInterest: companionCreator.traits.includes('romantic') ? 20 : 0,
      personality: customPersonality as any,
      quirkDiscovery: {
        discoveredQuirks: [],
        lastDiscoveryCheck: Date.now(),
      },
      conversationMemory: {
        companionId: companionId,
        sharedTopics: [],
        askedTopics: [],
        lastAskedAt: 0,
        conversationDepth: 0,
      },
      memories: [{
        timestamp: Date.now(),
        type: 'event' as const,
        description: `Joined the party: ${ORIGIN_STORIES.find(o => o.id === companionCreator.originStory)?.label || 'Mysterious arrival'}`,
        affinityChange: 20,
        forgotten: false,
      }],
      internalThoughts: `Ready to prove myself to this new companion.`,
      wantsToSpeak: true,
      pendingReaction: storyIntroduction,
      combatRole: companionCreator.combatRole,
      skills: companionCreator.skills.length > 0 
        ? companionCreator.skills 
        : ['basic_attack', 'defend'],
      equipment: [],
      joinedAt: Date.now(),
      lastSpoke: 0,
      confessedLove: false,
      wasBetrayed: false,
      hasSecret: Math.random() > 0.5,
      secretRevealed: false,
    };
    
    // Store appearance data with enhanced info
    const companionAppearance = {
      gender: companionCreator.gender,
      height: companionCreator.height,
      build: companionCreator.build,
      skinTone: companionCreator.skinTone,
      hairStyle: companionCreator.hairStyle,
      hairColor: companionCreator.hairColor,
      eyeColor: companionCreator.eyeColor,
      armorLevel: companionCreator.armorLevel,
      age: companionCreator.age,
      portraitUrl: companionCreator.portraitUrl,
      distinguishingFeatures: companionCreator.distinguishingFeatures,
    };
    
    // Save companion appearance to localStorage for portrait generation
    try {
      const companionAppearances = JSON.parse(localStorage.getItem('companion-appearances') || '{}');
      companionAppearances[companionId] = companionAppearance;
      localStorage.setItem('companion-appearances', JSON.stringify(companionAppearances));
      
      // Also save the story introduction to be displayed in game
      const companionIntros = JSON.parse(localStorage.getItem('companion-introductions') || '{}');
      companionIntros[companionId] = storyIntroduction;
      localStorage.setItem('companion-introductions', JSON.stringify(companionIntros));
    } catch (e) {
      console.error('Failed to save companion data:', e);
    }
    
    // Add to companion system
    companionSystem.getAllCompanions().push(companion);
    companionSystem.recruitCompanion(companion.id);
    
    // Queue the companion introduction to be displayed in the story
    try {
      const pendingIntros = JSON.parse(localStorage.getItem('pending-companion-introductions') || '[]');
      pendingIntros.push({
        companionId,
        name: companion.name,
        introduction: storyIntroduction,
        portraitUrl: companionCreator.portraitUrl,
        origin: companionCreator.originStory,
        timestamp: Date.now(),
        displayed: false,
      });
      localStorage.setItem('pending-companion-introductions', JSON.stringify(pendingIntros));
    } catch (e) {
      console.error('Failed to queue companion introduction:', e);
    }
    
    setCompanions(companionSystem.getAllCompanions());
    setShowCompanionCreator(false);
    setCompanionCreator(DEFAULT_COMPANION_CREATOR);
    setCompanionCreatorStep('basics');
    
    toast.success(`${companion.name} has joined your party!`, {
      description: 'Their introduction will appear in the story.',
      duration: 5000,
    });
  };
  
  const handleRemoveCompanion = (companionId: string) => {
    companionSystem.dismissCompanion(companionId, 'player');
    setCompanions(companionSystem.getAllCompanions());
    setEditingCompanion(null);
    toast.success('Companion dismissed');
  };
  
  const handleUpdateCompanion = (updated: CompanionState) => {
    const allCompanions = companionSystem.getAllCompanions();
    const index = allCompanions.findIndex(c => c.id === updated.id);
    if (index !== -1) {
      allCompanions[index] = updated;
      setCompanions(companionSystem.getAllCompanions());
      setEditingCompanion(null);
      toast.success(`${updated.name} updated!`);
    }
  };
  
  const toggleCompanionTrait = (trait: PersonalityTrait) => {
    setCompanionCreator(prev => {
      if (prev.traits.includes(trait)) {
        return { ...prev, traits: prev.traits.filter(t => t !== trait) };
      } else if (prev.traits.length < 5) {
        return { ...prev, traits: [...prev.traits, trait] };
      }
      return prev;
    });
  };
  
  // 18+ adult age categories only
  const ADULT_AGE_CATEGORIES = ['young adult (20s)', 'adult (30s)', 'mature adult (40s)', 'middle-aged (50s)', 'senior (60+)'];
  
  // Genre-based accessories (0-3 items)
  const GENRE_ACCESSORIES: Record<string, string[]> = {
    fantasy: ['amulet', 'ring', 'cloak clasp', 'leather pouch', 'bone necklace', 'rune pendant'],
    modern: ['watch', 'simple earrings', 'thin necklace', 'leather bracelet', 'sunglasses'],
    scifi: ['data chip earpiece', 'holo-band', 'neural link visible', 'tech goggles'],
    western: ['bandana', 'pocket watch', 'sheriff badge', 'leather cord necklace'],
    horror: ['cross pendant', 'protective charm', 'worn locket', 'silver ring'],
    cyberpunk: ['LED earrings', 'data jack', 'mirror shades', 'subdermal glow'],
    steampunk: ['brass goggles', 'pocket watch', 'gear pendant', 'clockwork earring'],
    noir: ['fedora', 'thin tie clip', 'cigarette case', 'simple cufflinks'],
    post_apocalyptic: ['dog tags', 'bottle cap necklace', 'worn goggles', 'crude bracelet'],
    default: ['simple earring', 'thin chain', 'leather bracelet', 'ring'],
  };
  
  // Simple, clean distinguishing features
  const SIMPLE_FEATURES = ['subtle scar', 'dimples', 'freckles', 'beauty mark', 'strong jawline', 'high cheekbones', 'defined brow'];
  
  // Randomize all companion attributes except gender
  const randomizeCompanion = () => {
    const genderKey = companionCreator.gender === 'male' ? 'male' : 
                      companionCreator.gender === 'female' ? 'female' : 'other';
    const genreNamePool = getGenreNames(genre || 'fantasy');
    const randomName = genreNamePool[genderKey][Math.floor(Math.random() * genreNamePool[genderKey].length)];
    const randomBackstory = BACKSTORY_TEMPLATES[Math.floor(Math.random() * BACKSTORY_TEMPLATES.length)];
    
    // Randomly pick 2-3 traits (not too many)
    const traitCount = 2 + Math.floor(Math.random() * 2);
    const shuffledTraits = [...PERSONALITY_TRAITS].sort(() => Math.random() - 0.5);
    const randomTraits = shuffledTraits.slice(0, traitCount);
    
    // 0-3 accessories based on genre
    const normalizedGenre = (genre || 'fantasy').toLowerCase().replace(/[_\s-]/g, '_');
    const genreAccessories = GENRE_ACCESSORIES[normalizedGenre] || GENRE_ACCESSORIES.default;
    const accessoryCount = Math.floor(Math.random() * 4); // 0-3
    const shuffledAccessories = [...genreAccessories].sort(() => Math.random() - 0.5);
    const randomAccessories = shuffledAccessories.slice(0, accessoryCount);
    
    // 0-2 distinguishing features
    const featureCount = Math.floor(Math.random() * 3); // 0-2
    const shuffledFeatures = [...SIMPLE_FEATURES].sort(() => Math.random() - 0.5);
    const randomFeatures = shuffledFeatures.slice(0, featureCount);
    
    // Combine features and accessories
    const allDistinguishing = [...randomFeatures, ...randomAccessories];
    
    // 1-2 personality quirks
    const quirkCount = 1 + Math.floor(Math.random() * 2); // 1-2
    const shuffledQuirks = [...PERSONALITY_QUIRKS].sort(() => Math.random() - 0.5);
    const randomQuirks = shuffledQuirks.slice(0, quirkCount);
    
    // Simple hair styles only (avoid the more exotic ones)
    const SIMPLE_HAIR_STYLES = ['Short', 'Medium', 'Long', 'Ponytail', 'Braided', 'Curly', 'Wavy', 'Bun'];
    const randomHairStyle = SIMPLE_HAIR_STYLES[Math.floor(Math.random() * SIMPLE_HAIR_STYLES.length)];
    
    // Natural hair colors only (avoid fantasy colors for cleaner look)
    const NATURAL_HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Auburn', 'Red', 'Blonde', 'Platinum Blonde', 'Gray', 'White'];
    const randomHairColor = NATURAL_HAIR_COLORS[Math.floor(Math.random() * NATURAL_HAIR_COLORS.length)];
    
    // Natural skin tones only
    const NATURAL_SKIN_TONES = ['Porcelain', 'Ivory', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Caramel', 'Brown', 'Dark Brown', 'Ebony'];
    const randomSkinTone = NATURAL_SKIN_TONES[Math.floor(Math.random() * NATURAL_SKIN_TONES.length)];
    
    // Natural eye colors
    const NATURAL_EYE_COLORS = ['Brown', 'Dark Brown', 'Hazel', 'Amber', 'Green', 'Blue', 'Gray'];
    const randomEyeColor = NATURAL_EYE_COLORS[Math.floor(Math.random() * NATURAL_EYE_COLORS.length)];
    
    // Gender-specific body shape randomization
    const isFemale = companionCreator.gender === 'female';
    const isMale = companionCreator.gender === 'male';
    
    const randomBustSize = isFemale ? BUST_SIZE_OPTIONS[Math.floor(Math.random() * BUST_SIZE_OPTIONS.length)] : undefined;
    const randomHipWidth = isFemale ? HIP_WIDTH_OPTIONS[Math.floor(Math.random() * HIP_WIDTH_OPTIONS.length)] : undefined;
    const randomShoulderWidth = isMale ? SHOULDER_WIDTH_OPTIONS[Math.floor(Math.random() * SHOULDER_WIDTH_OPTIONS.length)] : undefined;
    const randomPhysique = isMale ? MALE_PHYSIQUE_OPTIONS[Math.floor(Math.random() * MALE_PHYSIQUE_OPTIONS.length)] : undefined;
    
    setCompanionCreator(prev => ({
      ...prev,
      name: randomName,
      height: HEIGHT_OPTIONS[Math.floor(Math.random() * HEIGHT_OPTIONS.length)].value,
      build: BUILD_OPTIONS[Math.floor(Math.random() * BUILD_OPTIONS.length)].value,
      skinTone: randomSkinTone,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      eyeColor: randomEyeColor,
      traits: randomTraits,
      combatRole: COMBAT_ROLES[Math.floor(Math.random() * COMBAT_ROLES.length)],
      armorLevel: ARMOR_LEVELS[Math.floor(Math.random() * ARMOR_LEVELS.length)].id,
      originStory: ORIGIN_STORIES[Math.floor(Math.random() * ORIGIN_STORIES.length)].id,
      backstory: randomBackstory,
      speechPattern: ['formal and eloquent', 'casual, friendly', 'gruff, few words', 'mysterious, cryptic', 'jovial, always joking'][Math.floor(Math.random() * 5)],
      age: ADULT_AGE_CATEGORIES[Math.floor(Math.random() * ADULT_AGE_CATEGORIES.length)],
      distinguishingFeatures: allDistinguishing,
      quirks: randomQuirks,
      bustSize: randomBustSize,
      hipWidth: randomHipWidth,
      shoulderWidth: randomShoulderWidth,
      physique: randomPhysique,
      portraitUrl: null,
    }));
    
    toast.success('Companion randomized! Only gender was preserved.');
  };
  
  // Generate AI portrait for companion
  const generateCompanionPortrait = async () => {
    setCompanionCreator(prev => ({ ...prev, isGeneratingPortrait: true }));
    
    try {
      const armorDesc = ARMOR_LEVELS.find(a => a.id === companionCreator.armorLevel)?.description || '';
      
      // Build body shape description based on gender
      let bodyShapeDesc = '';
      if (companionCreator.gender === 'female') {
        const bustDesc = companionCreator.bustSize ? `${companionCreator.bustSize} cup bust` : '';
        const hipDesc = companionCreator.hipWidth ? `${companionCreator.hipWidth} hips` : '';
        bodyShapeDesc = [bustDesc, hipDesc].filter(Boolean).join(', ');
      } else if (companionCreator.gender === 'male') {
        const shoulderDesc = companionCreator.shoulderWidth ? `${companionCreator.shoulderWidth} shoulders` : '';
        const physiqueDesc = companionCreator.physique ? `${companionCreator.physique} physique` : '';
        bodyShapeDesc = [shoulderDesc, physiqueDesc].filter(Boolean).join(', ');
      }
      
      const bodyDesc = bodyShapeDesc ? ` with ${bodyShapeDesc},` : '';
      const prompt = `Semi-realistic digital portrait of a ${companionCreator.age || 'adult'} ${companionCreator.gender} ${companionCreator.build} ${companionCreator.height} character${bodyDesc} with ${companionCreator.skinTone.toLowerCase()} skin, ${companionCreator.hairStyle.toLowerCase()} ${companionCreator.hairColor.toLowerCase()} hair, ${companionCreator.eyeColor.toLowerCase()} eyes. Wearing ${armorDesc.toLowerCase()}. ${companionCreator.traits.slice(0, 2).join(' and ')} personality showing in expression. High quality digital art, game character portrait, neutral expression, soft lighting, detailed face.`;
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-portrait`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ prompt, genre: genre || 'fantasy' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate portrait');
      }
      
      const data = await response.json();
      
      // Check both possible response formats
      const portraitUrl = data.url || data.imageUrl;
      if (portraitUrl) {
        setCompanionCreator(prev => ({ ...prev, portraitUrl, isGeneratingPortrait: false }));
        toast.success('Portrait generated!');
      } else {
        throw new Error('No portrait URL returned');
      }
    } catch (error) {
      console.error('Portrait generation failed:', error);
      setCompanionCreator(prev => ({ ...prev, isGeneratingPortrait: false }));
      toast.error('Failed to generate portrait. Creating companion without one.');
    }
  };
  
  // Build story introduction for companion entry
  const buildCompanionIntroduction = (): string => {
    const origin = ORIGIN_STORIES.find(o => o.id === companionCreator.originStory);
    const armorDesc = ARMOR_LEVELS.find(a => a.id === companionCreator.armorLevel)?.label || 'Light Armor';
    const name = companionCreator.name.trim();
    
    const introTemplates: Record<string, string[]> = {
      mentor: [
        `A figure approaches - ${name}, sent by your mentor to aid you on this journey. Clad in ${armorDesc.toLowerCase()}, they carry themselves with the confidence of one who has been prepared for this moment.`,
        `"Your mentor sent me," says ${name}, stepping forward. Their ${armorDesc.toLowerCase()} gleams as they offer a respectful nod. "I am to assist you."`,
      ],
      divine: [
        `A strange light fades, revealing ${name} standing before you. "The fates have guided me to you," they say, ${armorDesc.toLowerCase()} marking them as a warrior blessed by higher powers.`,
        `${name} appears as if from nowhere, ${armorDesc.toLowerCase()} reflecting an otherworldly shimmer. "I was shown a vision. You need me."`,
      ],
      old_friend: [
        `"It's been too long!" ${name}'s familiar voice calls out. Your old friend approaches, ${armorDesc.toLowerCase()} worn from their own travels. "I heard you might need help."`,
        `${name} emerges from the crowd - a face from your past. In ${armorDesc.toLowerCase()}, they've clearly seen adventures of their own. "Thought I'd find you here."`,
      ],
      stranger: [
        `A stranger steps from the shadows - ${name}, studying you with keen eyes. Their ${armorDesc.toLowerCase()} suggests they're no mere traveler. "You seem like someone who could use capable help."`,
        `${name} blocks your path, ${armorDesc.toLowerCase()} marking them as someone who knows how to handle themselves. "I've been looking for someone like you."`,
      ],
      mutual_enemy: [
        `${name} fights their way to your side, ${armorDesc.toLowerCase()} splattered with evidence of battle. "We share an enemy. Together, we stand a better chance."`,
        `"The enemy of my enemy..." ${name} says, lowering their weapon. Their ${armorDesc.toLowerCase()} shows signs of recent combat. "I propose an alliance."`,
      ],
      debt: [
        `${name} approaches with purpose, ${armorDesc.toLowerCase()} immaculate. "I owe a debt to someone you know. Consider me at your service until it's repaid."`,
        `"You saved someone important to me once," ${name} explains, adjusting their ${armorDesc.toLowerCase()}. "Now I repay that debt. Command me."`,
      ],
    };
    
    const templates = introTemplates[companionCreator.originStory] || introTemplates.stranger;
    return templates[Math.floor(Math.random() * templates.length)];
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (character && onUpdateCharacter) {
        const updatedCharacter: RPGCharacter & { portraitUrl?: string } = {
          ...character,
          name,
          level,
          gold,
          currentHealth: Math.min(currentHealth, maxHealth),
          maxHealth,
          experience,
          stats,
        };
        onUpdateCharacter(updatedCharacter);
      }
      
      const savedChar = localStorage.getItem(CHARACTER_KEY);
      if (savedChar) {
        const parsed = JSON.parse(savedChar);
        const updated = {
          ...parsed,
          basicInfo: { ...parsed.basicInfo, name },
          appearance: appearance || parsed.appearance,
          ...(appearance?.full?.clothingStyle && {
            clothingOverride: appearance.full.clothingStyle
          }),
        };
        
        saveCharacterAppearanceToCampaign(updated, genre);
      }
      
      // Save cheat state
      localStorage.setItem('cheat-mode-state', JSON.stringify(cheats));
      
      toast.success('All changes saved!');
      onClose();
    } catch (error) {
      console.error('[CheatMode] Failed to save:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        if (editingCompanion) {
          setEditingCompanion(null);
        } else if (showCompanionCreator) {
          setShowCompanionCreator(false);
        } else {
          onClose();
        }
      }
      
      if (e.key === 'ArrowLeft' && !editingCompanion && !showCompanionCreator) {
        goLeft();
      }
      if (e.key === 'ArrowRight' && !editingCompanion && !showCompanionCreator) {
        goRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingCompanion, showCompanionCreator]);

  // ==================== RENDER SCREENS ====================

  const renderCheatsScreen = () => (
    <div className="space-y-4">
      {/* Toggle Cheats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">God Mode</span>
          </div>
          <Switch
            checked={cheats.godMode}
            onCheckedChange={(v) => applyCheat('godMode', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">∞ Gold</span>
          </div>
          <Switch
            checked={cheats.infiniteGold}
            onCheckedChange={(v) => applyCheat('infiniteGold', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Max Stats</span>
          </div>
          <Switch
            checked={cheats.maxStats}
            onCheckedChange={(v) => applyCheat('maxStats', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-destructive" />
            <span className="text-sm font-medium">Instant Kill</span>
          </div>
          <Switch
            checked={cheats.instantKill}
            onCheckedChange={(v) => applyCheat('instantKill', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Invisibility</span>
          </div>
          <Switch
            checked={cheats.invisibility}
            onCheckedChange={(v) => applyCheat('invisibility', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium">Unlock All</span>
          </div>
          <Switch
            checked={cheats.unlockAll}
            onCheckedChange={(v) => applyCheat('unlockAll', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium">∞ Ammo</span>
          </div>
          <Switch
            checked={cheats.infiniteAmmo}
            onCheckedChange={(v) => applyCheat('infiniteAmmo', v)}
          />
        </div>
        
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium">No Clip</span>
          </div>
          <Switch
            checked={cheats.noClip}
            onCheckedChange={(v) => applyCheat('noClip', v)}
          />
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="space-y-2">
        <Label className="text-xs uppercase text-muted-foreground">Quick Actions</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantGold(10000)}
            className="text-xs"
          >
            <Coins className="w-3 h-3 mr-1" /> +10K Gold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantXP(5000)}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" /> +5K XP
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={levelUp}
            className="text-xs"
          >
            <Zap className="w-3 h-3 mr-1" /> Level Up
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fullHeal}
            className="text-xs"
          >
            <Heart className="w-3 h-3 mr-1" /> Full Heal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addInstantGold(100000)}
            className="text-xs"
          >
            <Coins className="w-3 h-3 mr-1" /> +100K Gold
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExperience(prev => prev + 50000)}
            className="text-xs"
          >
            <Star className="w-3 h-3 mr-1" /> +50K XP
          </Button>
        </div>
      </div>
      
      {/* Time Manipulation */}
      <div className="space-y-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/30">
        <Label className="text-xs uppercase text-muted-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" /> Time Manipulation
        </Label>
        
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeOfDay('dawn')}
            className="text-xs border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Sun className="w-3 h-3 mr-1 text-orange-400" /> Dawn
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeOfDay('noon')}
            className="text-xs border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Sun className="w-3 h-3 mr-1 text-yellow-400" /> Noon
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeOfDay('dusk')}
            className="text-xs border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Moon className="w-3 h-3 mr-1 text-orange-300" /> Dusk
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTimeOfDay('midnight')}
            className="text-xs border-indigo-500/30 hover:bg-indigo-500/20"
          >
            <Moon className="w-3 h-3 mr-1 text-purple-400" /> Midnight
          </Button>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(1)}
            className="text-xs"
          >
            <FastForward className="w-3 h-3 mr-1" /> +1 Hour
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(6)}
            className="text-xs"
          >
            <FastForward className="w-3 h-3 mr-1" /> +6 Hours
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(24)}
            className="text-xs"
          >
            <SkipForward className="w-3 h-3 mr-1" /> +1 Day
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => skipTime(168)}
            className="text-xs"
          >
            <SkipForward className="w-3 h-3 mr-1" /> +1 Week
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Pause className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium">Freeze Time</span>
          </div>
          <Switch
            checked={cheats.freezeTime}
            onCheckedChange={(v) => {
              setCheats(prev => ({ ...prev, freezeTime: v }));
              toast.success(v ? 'Time frozen!' : 'Time resumed!');
            }}
          />
        </div>
      </div>
      
      {/* Teleport */}
      <div className="space-y-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
        <Label className="text-xs uppercase text-muted-foreground flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" /> Teleport
        </Label>
        
        <div className="grid grid-cols-5 gap-2">
          {TELEPORT_LOCATIONS.map((loc) => (
            <Button
              key={loc.id}
              variant={teleportTarget === loc.id ? "default" : "outline"}
              size="sm"
              onClick={() => teleportTo(loc.id)}
              className="text-xs flex flex-col h-auto py-2 border-cyan-500/30 hover:bg-cyan-500/20"
            >
              <span className="text-base mb-1">{loc.icon}</span>
              <span className="truncate w-full text-[10px]">{loc.name}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Spawn Items */}
      <div className="space-y-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase text-muted-foreground flex items-center gap-2">
            <Backpack className="w-4 h-4 text-amber-400" /> Spawn Items
          </Label>
          <Select value={spawnCategory} onValueChange={setSpawnCategory}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="consumable">Consumables</SelectItem>
              <SelectItem value="weapon">Weapons</SelectItem>
              <SelectItem value="armor">Armor</SelectItem>
              <SelectItem value="tool">Tools</SelectItem>
              <SelectItem value="currency">Currency</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {SPAWNABLE_ITEMS
            .filter(item => spawnCategory === 'all' || item.category === spawnCategory)
            .map((item) => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => spawnItem(item.id)}
                className="text-xs flex flex-col h-auto py-2 border-amber-500/30 hover:bg-amber-500/20"
              >
                <span className="text-base mb-1">{item.icon}</span>
                <span className="truncate w-full text-[10px]">{item.name}</span>
              </Button>
            ))}
        </div>
      </div>
      
      {/* Speed/Time Sliders */}
      <div className="space-y-4 p-3 bg-muted/20 rounded-lg border border-border/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Speed Multiplier
            </Label>
            <span className="font-mono text-sm">{cheats.speedMultiplier}x</span>
          </div>
          <Slider
            value={[cheats.speedMultiplier]}
            onValueChange={([v]) => setCheats(prev => ({ ...prev, speedMultiplier: v }))}
            min={0.5}
            max={4}
            step={0.5}
            className="flex-1"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" /> Time Scale
            </Label>
            <span className="font-mono text-sm">{cheats.timeScale}x</span>
          </div>
          <Slider
            value={[cheats.timeScale]}
            onValueChange={([v]) => setCheats(prev => ({ ...prev, timeScale: v }))}
            min={0.25}
            max={4}
            step={0.25}
            className="flex-1"
          />
        </div>
        
        {/* Additional toggle cheats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-green-400" />
              <span className="text-xs">No Hunger</span>
            </div>
            <Switch
              checked={cheats.noHunger}
              onCheckedChange={(v) => {
                setCheats(prev => ({ ...prev, noHunger: v }));
                if (v) toast.success('Hunger disabled!');
              }}
            />
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-blue-400" />
              <span className="text-xs">No Fatigue</span>
            </div>
            <Switch
              checked={cheats.noFatigue}
              onCheckedChange={(v) => {
                setCheats(prev => ({ ...prev, noFatigue: v }));
                if (v) toast.success('Fatigue disabled!');
              }}
            />
          </div>
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Eye className="w-3 h-3 text-purple-400" />
              <span className="text-xs">Reveal Map</span>
            </div>
            <Switch
              checked={cheats.revealMap}
              onCheckedChange={(v) => {
                setCheats(prev => ({ ...prev, revealMap: v }));
                if (v) toast.success('Map revealed!');
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Current Stats Display */}
      <div className="p-3 bg-primary/10 rounded-lg border border-primary/30">
        <Label className="text-xs uppercase text-muted-foreground mb-2 block">Current Values</Label>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div>
            <div className="font-mono text-lg text-primary">{level}</div>
            <div className="text-xs text-muted-foreground">Level</div>
          </div>
          <div>
            <div className="font-mono text-lg text-amber-400">{gold.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Gold</div>
          </div>
          <div>
            <div className="font-mono text-lg text-green-400">{currentHealth}/{maxHealth}</div>
            <div className="text-xs text-muted-foreground">Health</div>
          </div>
          <div>
            <div className="font-mono text-lg text-blue-400">{experience.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        </div>
      </div>
      
      {/* Developer Tools */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('developer')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-sm">Developer Tools</span>
          </div>
          {expandedSections.developer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.developer && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  Event Bus Monitor
                </Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowEventBus(!showEventBus)}
                >
                  {showEventBus ? 'Hide' : 'Show'}
                </Button>
              </div>
              {showEventBus && (
                <div className="mt-2">
                  <EventBusDebugPanel />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  Data Integrity
                </Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    setIsScanning(true);
                    try {
                      const report = await DataIntegrityService.runFullScan();
                      setIntegrityReport(report);
                    } catch (e) {
                      toast.error('Scan failed');
                    } finally {
                      setIsScanning(false);
                    }
                  }}
                  disabled={isScanning}
                >
                  {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Scan'}
                </Button>
              </div>
              
              {integrityReport && (
                <div className="mt-2 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span>Valid: {integrityReport.valid}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500" />
                    <span>Repaired: {integrityReport.repaired}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span>Corrupted: {integrityReport.corrupted}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span>Unrecoverable: {integrityReport.unrecoverable}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCharacterScreen = () => (
    <div className="space-y-3">
      {/* Name */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">Character Name</Label>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter name..."
          className="bg-background/50 h-8 text-sm"
        />
      </div>
      
      {/* Stats Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('stats')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Stats & Resources</span>
          </div>
          {expandedSections.stats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.stats && (
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Level</Label>
                <Input
                  type="number"
                  value={level}
                  onChange={e => setLevel(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Gold</Label>
                <Input
                  type="number"
                  value={gold}
                  onChange={e => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">HP</Label>
                <Input
                  type="number"
                  value={currentHealth}
                  onChange={e => setCurrentHealth(Math.max(0, parseInt(e.target.value) || 0))}
                  className="h-7 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max HP</Label>
                <Input
                  type="number"
                  value={maxHealth}
                  onChange={e => setMaxHealth(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-7 text-sm"
                />
              </div>
            </div>
            
            {/* Attributes */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase">Attributes</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(stats) as Array<keyof CharacterStats>).map(stat => (
                  <div key={stat} className="flex items-center gap-2">
                    <span className="text-xs capitalize w-12 truncate">{stat.slice(0, 3)}</span>
                    <Slider
                      value={[stats[stat]]}
                      onValueChange={([v]) => handleStatChange(stat, v)}
                      min={1}
                      max={30}
                      step={1}
                      className="flex-1"
                    />
                    <span className="font-mono text-xs w-5 text-right">{stats[stat]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Appearance Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Appearance</span>
          </div>
          {expandedSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.appearance && appearance && (
          <div className="p-4 space-y-4">
            {/* Simple Appearance */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Gender</Label>
                <Select
                  value={appearance.simple?.gender || 'other'}
                  onValueChange={v => handleAppearanceSimpleChange('gender', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map(g => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Height</Label>
                <Select
                  value={appearance.simple?.height || 'average'}
                  onValueChange={v => handleAppearanceSimpleChange('height', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map(h => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Build</Label>
                <Select
                  value={appearance.simple?.build || 'average'}
                  onValueChange={v => handleAppearanceSimpleChange('build', v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILD_OPTIONS.map(b => (
                      <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Detailed Appearance */}
            {appearance.detailed && (
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground uppercase">Detailed Features</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Skin Tone</Label>
                    <Select
                      value={appearance.detailed.skinTone || 'Medium'}
                      onValueChange={v => handleAppearanceDetailedChange('skinTone', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SKIN_TONES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Style</Label>
                    <Select
                      value={appearance.detailed.hairStyle || 'Medium'}
                      onValueChange={v => handleAppearanceDetailedChange('hairStyle', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_STYLES.map(h => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Hair Color</Label>
                    <Select
                      value={appearance.detailed.hairColor || 'Brown'}
                      onValueChange={v => handleAppearanceDetailedChange('hairColor', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HAIR_COLORS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Eye Color</Label>
                    <Select
                      value={appearance.detailed.eyeColor || 'Brown'}
                      onValueChange={v => handleAppearanceDetailedChange('eyeColor', v)}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EYE_COLORS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Equipment Section */}
      <div className="border border-border/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('equipment')}
          className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Shirt className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Equipment & Clothing</span>
          </div>
          {expandedSections.equipment ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {expandedSections.equipment && (
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Shirt className="w-3 h-3" />
                Current Outfit
              </Label>
              <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
                <p className="text-sm text-foreground capitalize">
                  {clothingDescription || 'No clothing data available'}
                </p>
              </div>
            </div>
            
            {wardrobeState && Object.keys(wardrobeState.equipped).length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase">Equipped Items</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(wardrobeState.equipped)
                    .filter(([_, wi]) => wi !== undefined)
                    .map(([slot, wi]) => (
                      <div 
                        key={slot}
                        className="flex items-center gap-2 p-2 bg-background/50 rounded text-xs"
                      >
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {slot}
                        </Badge>
                        <span className="truncate">{wi!.item.name}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderInventoryScreen = () => (
    <InventoryEditor gunNutEnabled={true} />
  );

  const renderCompanionCreator = () => (
    <div className="space-y-4">
      {/* Header with Randomize and Close */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Initiate Companion
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={randomizeCompanion}>
            <Dices className="w-4 h-4 mr-1" /> Randomize
          </Button>
          <Button variant="ghost" size="sm" onClick={() => {
            setShowCompanionCreator(false);
            setCompanionCreatorStep('basics');
            setCompanionCreator(DEFAULT_COMPANION_CREATOR);
          }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Portrait Preview Section */}
      <div className="flex gap-4">
        {/* Portrait */}
        <div className="w-28 flex-shrink-0">
          <div className="aspect-[3/4] rounded-lg overflow-hidden bg-muted/30 border border-border/50 relative">
            {companionCreator.portraitUrl ? (
              <img 
                src={companionCreator.portraitUrl} 
                alt="Companion portrait" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                <User className="w-10 h-10 mb-2 opacity-40" />
                <span className="text-[10px] text-center px-2">No portrait</span>
              </div>
            )}
            {companionCreator.isGeneratingPortrait && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateCompanionPortrait}
            disabled={companionCreator.isGeneratingPortrait || !companionCreator.name.trim()}
            className="w-full mt-2 text-xs"
          >
            {companionCreator.isGeneratingPortrait ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1" /> Generate Portrait</>
            )}
          </Button>
        </div>
        
        {/* Quick Info */}
        <div className="flex-1 space-y-2">
          {/* Gender - User Can Pick */}
          <div className="space-y-1">
            <Label className="text-xs">Gender *</Label>
            <Select
              value={companionCreator.gender}
              onValueChange={v => setCompanionCreator(prev => ({ ...prev, gender: v as Gender, portraitUrl: null }))}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map(g => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Quick Stats Preview */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/20 rounded">
              <span className="text-muted-foreground">Build:</span>
              <span className="ml-1 capitalize">{companionCreator.build}</span>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <span className="text-muted-foreground">Hair:</span>
              <span className="ml-1">{companionCreator.hairColor}</span>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <span className="text-muted-foreground">Role:</span>
              <span className="ml-1 capitalize">{companionCreator.combatRole}</span>
            </div>
            <div className="p-2 bg-muted/20 rounded">
              <span className="text-muted-foreground">Armor:</span>
              <span className="ml-1 capitalize">{companionCreator.armorLevel}</span>
            </div>
            {/* Female body shape */}
            {companionCreator.gender === 'female' && companionCreator.bustSize && (
              <div className="p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground">Bust:</span>
                <span className="ml-1">{companionCreator.bustSize}</span>
              </div>
            )}
            {companionCreator.gender === 'female' && companionCreator.hipWidth && (
              <div className="p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground">Hips:</span>
                <span className="ml-1 capitalize">{companionCreator.hipWidth}</span>
              </div>
            )}
            {/* Male body shape */}
            {companionCreator.gender === 'male' && companionCreator.shoulderWidth && (
              <div className="p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground">Shoulders:</span>
                <span className="ml-1 capitalize">{companionCreator.shoulderWidth}</span>
              </div>
            )}
            {companionCreator.gender === 'male' && companionCreator.physique && (
              <div className="p-2 bg-muted/20 rounded">
                <span className="text-muted-foreground">Physique:</span>
                <span className="ml-1 capitalize">{companionCreator.physique}</span>
              </div>
            )}
          </div>
          
          {/* Traits Preview */}
          {companionCreator.traits.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {companionCreator.traits.slice(0, 3).map(t => (
                <Badge key={t} variant="secondary" className="text-[10px] capitalize">{t}</Badge>
              ))}
              {companionCreator.traits.length > 3 && (
                <Badge variant="outline" className="text-[10px]">+{companionCreator.traits.length - 3}</Badge>
              )}
            </div>
          )}
          
          {/* Quirks Preview */}
          {companionCreator.quirks.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground">Quirks:</span>
              <div className="flex flex-wrap gap-1">
                {companionCreator.quirks.map((q, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-primary/5 border-primary/20">
                    {q}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Tabs for Settings */}
      <Tabs value={companionCreatorStep} onValueChange={(v) => setCompanionCreatorStep(v as any)}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="basics" className="text-xs">Origin</TabsTrigger>
          <TabsTrigger value="appearance" className="text-xs">Armor</TabsTrigger>
          <TabsTrigger value="personality" className="text-xs">Traits</TabsTrigger>
          <TabsTrigger value="combat" className="text-xs">Combat</TabsTrigger>
        </TabsList>
        
        {/* Origin Tab - How they enter the story */}
        <TabsContent value="basics" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Name (auto-generated, editable)</Label>
            <Input
              value={companionCreator.name}
              onChange={e => setCompanionCreator(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Companion name..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>How They Find You</Label>
            <div className="grid grid-cols-1 gap-2">
              {ORIGIN_STORIES.map(origin => (
                <button
                  key={origin.id}
                  onClick={() => setCompanionCreator(prev => ({ ...prev, originStory: origin.id }))}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    companionCreator.originStory === origin.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="font-medium text-sm">{origin.label}</div>
                  <div className="text-xs text-muted-foreground">{origin.description}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-muted/20 rounded-lg border border-dashed border-border/50">
            <Label className="text-xs text-muted-foreground uppercase mb-2 block">Story Preview</Label>
            <p className="text-xs italic text-foreground/80">
              {buildCompanionIntroduction().slice(0, 150)}...
            </p>
          </div>
        </TabsContent>
        
        {/* Armor Tab */}
        <TabsContent value="appearance" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Armor Level</Label>
            <div className="grid grid-cols-1 gap-2">
              {ARMOR_LEVELS.map(armor => (
                <button
                  key={armor.id}
                  onClick={() => setCompanionCreator(prev => ({ ...prev, armorLevel: armor.id }))}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                    companionCreator.armorLevel === armor.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    armor.id === 'none' ? 'bg-blue-500/20' :
                    armor.id === 'light' ? 'bg-green-500/20' :
                    armor.id === 'medium' ? 'bg-amber-500/20' :
                    'bg-red-500/20'
                  }`}>
                    <Shield className={`w-4 h-4 ${
                      armor.id === 'none' ? 'text-blue-400' :
                      armor.id === 'light' ? 'text-green-400' :
                      armor.id === 'medium' ? 'text-amber-400' :
                      'text-red-400'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{armor.label}</div>
                    <div className="text-xs text-muted-foreground">{armor.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Additional appearance preview (read-only, randomized) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Appearance (randomized)</Label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-muted/20 rounded text-center">
                <span className="text-muted-foreground block">Height</span>
                <span className="capitalize">{companionCreator.height}</span>
              </div>
              <div className="p-2 bg-muted/20 rounded text-center">
                <span className="text-muted-foreground block">Skin</span>
                <span>{companionCreator.skinTone}</span>
              </div>
              <div className="p-2 bg-muted/20 rounded text-center">
                <span className="text-muted-foreground block">Eyes</span>
                <span>{companionCreator.eyeColor}</span>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Personality Tab */}
        <TabsContent value="personality" className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Personality Traits (randomized, adjustable)</Label>
              <span className="text-xs text-muted-foreground">{companionCreator.traits.length}/5</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TRAITS.map(trait => (
                <Badge
                  key={trait}
                  variant={companionCreator.traits.includes(trait) ? 'default' : 'outline'}
                  className="cursor-pointer capitalize text-xs"
                  onClick={() => toggleCompanionTrait(trait)}
                >
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Speech Pattern</Label>
            <Input
              value={companionCreator.speechPattern}
              onChange={e => setCompanionCreator(prev => ({ ...prev, speechPattern: e.target.value }))}
              placeholder="e.g., formal, sarcastic, shy..."
              className="text-sm"
            />
          </div>
        </TabsContent>
        
        {/* Combat Tab */}
        <TabsContent value="combat" className="space-y-4 mt-4">
          {/* Experience Level Selection */}
          <div className="space-y-2">
            <Label>Experience Level</Label>
            <p className="text-xs text-muted-foreground">Determines combat stat ranges</p>
            <div className="space-y-2">
              {EXPERIENCE_LEVELS.map((level, idx) => {
                const isSelected = companionCreator.experienceLevel === level.id;
                const prevLevel = EXPERIENCE_LEVELS[idx - 1];
                const nextLevel = EXPERIENCE_LEVELS[idx + 1];
                
                return (
                  <button
                    key={level.id}
                    onClick={() => setCompanionCreator(prev => ({ ...prev, experienceLevel: level.id }))}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${level.bgColor}`} />
                        <span className={`font-medium ${level.color}`}>{level.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{level.description}</span>
                    </div>
                    
                    {/* Stat Range Visual */}
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-xs mb-1">
                        <span className="text-muted-foreground">Stat Range:</span>
                        <span className={`font-mono ${level.color}`}>{level.minStat} - {level.maxStat}</span>
                      </div>
                      <div className="relative h-3 bg-muted/20 rounded-full overflow-hidden">
                        {/* Full scale markers */}
                        <div className="absolute inset-0 flex">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                            <div 
                              key={n} 
                              className="flex-1 border-r border-border/30 last:border-r-0"
                              style={{ opacity: n >= level.minStat && n <= level.maxStat ? 1 : 0.3 }}
                            />
                          ))}
                        </div>
                        {/* Highlighted range */}
                        <div 
                          className={`absolute h-full ${isSelected ? 'bg-primary/50' : level.bgColor} rounded`}
                          style={{ 
                            left: `${((level.minStat - 1) / 14) * 100}%`,
                            width: `${((level.maxStat - level.minStat + 1) / 15) * 100}%`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                      </div>
                    </div>
                    
                    {/* Gap indicator between levels */}
                    {isSelected && nextLevel && (
                      <div className="mt-2 pt-2 border-t border-border/30 text-[10px] text-muted-foreground">
                        Gap to next: <span className="font-mono text-amber-400">{nextLevel.minStat - level.maxStat}</span> stat points
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Combat Role</Label>
            <div className="grid grid-cols-2 gap-2">
              {COMBAT_ROLES.map(role => (
                <button
                  key={role}
                  onClick={() => setCompanionCreator(prev => ({ ...prev, combatRole: role }))}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    companionCreator.combatRole === role
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                    role === 'tank' ? 'bg-blue-500/20' :
                    role === 'damage' ? 'bg-red-500/20' :
                    role === 'support' ? 'bg-green-500/20' :
                    'bg-amber-500/20'
                  }`}>
                    {role === 'tank' && <Shield className="w-4 h-4 text-blue-400" />}
                    {role === 'damage' && <Sword className="w-4 h-4 text-red-400" />}
                    {role === 'support' && <Heart className="w-4 h-4 text-green-400" />}
                    {role === 'ranged' && <Target className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="font-medium text-sm capitalize">{role}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Generated Stats Preview */}
          <div className="p-3 bg-muted/20 rounded-lg border border-border/50">
            <Label className="text-xs text-muted-foreground uppercase mb-2 block">Generated Combat Stats</Label>
            {(() => {
              const level = EXPERIENCE_LEVELS.find(l => l.id === companionCreator.experienceLevel) || EXPERIENCE_LEVELS[2];
              const range = level.maxStat - level.minStat;
              // Generate pseudo-random stats based on name for consistency
              const seed = companionCreator.name.length || 1;
              const strength = level.minStat + Math.floor((seed * 7) % (range + 1));
              const dexterity = level.minStat + Math.floor((seed * 13) % (range + 1));
              const constitution = level.minStat + Math.floor((seed * 11) % (range + 1));
              const intelligence = level.minStat + Math.floor((seed * 5) % (range + 1));
              const wisdom = level.minStat + Math.floor((seed * 17) % (range + 1));
              const charisma = level.minStat + Math.floor((seed * 3) % (range + 1));
              
              return (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">STR</span>
                    <span className={`font-mono ${level.color}`}>{strength}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">DEX</span>
                    <span className={`font-mono ${level.color}`}>{dexterity}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">CON</span>
                    <span className={`font-mono ${level.color}`}>{constitution}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">INT</span>
                    <span className={`font-mono ${level.color}`}>{intelligence}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">WIS</span>
                    <span className={`font-mono ${level.color}`}>{wisdom}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-background/50 rounded">
                    <span className="text-muted-foreground">CHA</span>
                    <span className={`font-mono ${level.color}`}>{charisma}</span>
                  </div>
                </div>
              );
            })()}
          </div>
          
          <div className="p-3 bg-muted/20 rounded-lg">
            <Label className="text-xs text-muted-foreground uppercase mb-2 block">Role Description</Label>
            <p className="text-sm">
              {companionCreator.combatRole === 'tank' && 'Heavy defense, draws enemy attention and protects allies.'}
              {companionCreator.combatRole === 'damage' && 'High damage output, focuses on eliminating threats quickly.'}
              {companionCreator.combatRole === 'support' && 'Healing and buffs, keeps the party alive and enhanced.'}
              {companionCreator.combatRole === 'ranged' && 'Attacks from distance, precise shots and area control.'}
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-border/50">
        <Button 
          variant="outline" 
          onClick={() => {
            setShowCompanionCreator(false);
            setCompanionCreatorStep('basics');
            setCompanionCreator(DEFAULT_COMPANION_CREATOR);
          }} 
          className="flex-1"
        >
          Cancel
        </Button>
        <Button 
          onClick={createCompanionFromCreator} 
          className="flex-1 bg-gradient-to-r from-primary to-primary/80"
          disabled={!companionCreator.name.trim() || companionCreator.traits.length < 2}
        >
          <Sparkles className="w-4 h-4 mr-1" /> Initiate Companion
        </Button>
      </div>
    </div>
  );

  // Handle companion resuscitation
  const handleResuscitateCompanion = useCallback((companionId: string) => {
    const result = companionSystem.reviveCompanion(companionId);
    
    if (result.success) {
      // Queue the resurrection story event
      if (result.storyIntro) {
        const pendingResurrections = JSON.parse(localStorage.getItem('pending-resurrection-events') || '[]');
        pendingResurrections.push({
          companionId,
          storyIntro: result.storyIntro,
          timestamp: Date.now()
        });
        localStorage.setItem('pending-resurrection-events', JSON.stringify(pendingResurrections));
      }
      
      // Refresh the companion list
      setCompanions(companionSystem.getAllCompanions());
      toast.success(result.message, {
        description: 'A miraculous resurrection has occurred...',
        duration: 5000
      });
    } else {
      toast.error(result.message);
    }
  }, []);

  const renderCompanionCard = (companion: CompanionState) => {
    const personalityType = derivePersonalityType(companion.personality.traits);
    const primaryFear = companion.personality.traits[0] ? COMPANION_FEARS[companion.personality.traits[0]] : 'Unknown';
    
    // Calculate percentage for mini progress bars
    const affinityPct = ((companion.affinity + 100) / 200) * 100;
    const trustPct = companion.trust;
    const respectPct = companion.respect;
    
    return (
      <div key={companion.id} className={`border rounded-lg p-4 space-y-3 ${
        companion.status === 'dead' 
          ? 'border-red-500/50 bg-red-500/5' 
          : companion.status === 'romance'
          ? 'border-pink-500/50 bg-pink-500/5'
          : companion.status === 'hostile'
          ? 'border-orange-500/50 bg-orange-500/5'
          : 'border-border/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              companion.status === 'romance' ? 'bg-pink-500/20' :
              companion.status === 'hostile' ? 'bg-red-500/20' :
              companion.status === 'dead' ? 'bg-gray-500/20' :
              'bg-muted'
            }`}>
              <span className="text-xl">{personalityType.icon}</span>
            </div>
            <div>
              <h4 className="font-medium flex items-center gap-2">
                {companion.name}
                {companion.status === 'dead' && <Skull className="w-4 h-4 text-red-400" />}
                {companion.status === 'romance' && <Heart className="w-4 h-4 text-pink-400" />}
                {companion.status === 'hostile' && <AlertTriangle className="w-4 h-4 text-orange-400" />}
              </h4>
              <p className="text-xs text-muted-foreground">
                {personalityType.type} • <span className="capitalize">{companion.combatRole || 'Unknown'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              companion.status === 'active' ? 'default' : 
              companion.status === 'dead' ? 'destructive' : 
              companion.status === 'romance' ? 'default' :
              companion.status === 'hostile' ? 'destructive' :
              'secondary'
            } className={
              companion.status === 'romance' ? 'bg-pink-500' : ''
            }>
              {companion.status}
            </Badge>
            {companion.status === 'dead' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResuscitateCompanion(companion.id)}
                className="text-green-400 border-green-500/50 hover:bg-green-500/10 hover:text-green-300"
              >
                <HeartPulse className="w-4 h-4 mr-1" />
                Revive
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingCompanion(companion)}
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCompanion(companion.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Personality traits & fear */}
        <div className="flex flex-wrap gap-1">
          {companion.personality.traits.slice(0, 4).map(t => (
            <Badge key={t} variant="outline" className="text-[10px] capitalize">{t}</Badge>
          ))}
        </div>
        
        {companion.status === 'dead' && (
          <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/30">
            <p className="text-xs text-red-300 italic">
              This companion has fallen. Use the Revive button to bring them back with a story event.
            </p>
          </div>
        )}
        
        {/* Relationship bars with percentage indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-14 text-muted-foreground">Affinity</span>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden relative">
              {/* Center marker */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border z-10" />
              <div 
                className={`h-full rounded-full transition-all ${
                  companion.affinity > 0 ? 'bg-green-500' : 
                  companion.affinity < 0 ? 'bg-red-500' : 'bg-muted-foreground'
                }`}
                style={{ 
                  width: `${affinityPct}%`,
                  marginLeft: companion.affinity < 0 ? `${affinityPct}%` : '50%',
                  maxWidth: '50%'
                }}
              />
            </div>
            <span className={`w-10 text-right font-mono ${
              companion.affinity > 0 ? 'text-green-400' : 
              companion.affinity < 0 ? 'text-red-400' : ''
            }`}>{companion.affinity > 0 ? '+' : ''}{companion.affinity}</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-14 text-muted-foreground">Trust</span>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${trustPct}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono">{companion.trust}%</span>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
            <span className="w-14 text-muted-foreground">Respect</span>
            <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{ width: `${respectPct}%` }}
              />
            </div>
            <span className="w-10 text-right font-mono">{companion.respect}%</span>
          </div>
          
          {companion.romanticInterest > 20 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-14 text-pink-400">Romance</span>
              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 rounded-full transition-all"
                  style={{ width: `${companion.romanticInterest}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-pink-400">{companion.romanticInterest}%</span>
            </div>
          )}
        </div>
        
        {/* Mood indicator */}
        {companion.status !== 'dead' && (
          <div className="flex items-center gap-2 text-xs pt-1 border-t border-border/30">
            <span className="text-muted-foreground">Current Mood:</span>
            <Badge variant="outline" className="capitalize text-[10px]">
              {companion.mood}
            </Badge>
          </div>
        )}
      </div>
    );
  };

  const renderCompanionEditor = () => {
    if (!editingCompanion) return null;
    
    const comp = editingCompanion;
    const personalityType = derivePersonalityType(comp.personality.traits);
    const primaryFear = comp.personality.traits[0] ? COMPANION_FEARS[comp.personality.traits[0]] : 'Unknown';
    
    // Quick action handlers
    const forceRomance = () => {
      setEditingCompanion({
        ...comp,
        status: 'romance',
        mood: 'romantic',
        affinity: 90,
        trust: 85,
        respect: 80,
        romanticInterest: 100,
        fear: 0,
      });
      toast.success(`Forced romance with ${comp.name}!`);
    };
    
    const makeHostile = () => {
      setEditingCompanion({
        ...comp,
        status: 'hostile',
        mood: 'betrayed',
        affinity: -80,
        trust: 5,
        respect: 10,
        fear: 70,
        romanticInterest: 0,
      });
      toast.warning(`${comp.name} is now hostile!`);
    };
    
    const makeNeutral = () => {
      setEditingCompanion({
        ...comp,
        status: 'waiting',
        mood: 'neutral',
        affinity: 0,
        trust: 50,
        respect: 50,
        fear: 0,
        romanticInterest: 0,
      });
      toast.info(`${comp.name} reset to neutral!`);
    };
    
    const makeLoyal = () => {
      setEditingCompanion({
        ...comp,
        status: 'active',
        mood: 'content',
        affinity: 75,
        trust: 90,
        respect: 85,
        fear: 0,
        romanticInterest: comp.romanticInterest,
      });
      toast.success(`${comp.name} is now deeply loyal!`);
    };
    
    // Percentage renderer for sliders
    const renderRelationshipSlider = (
      label: string,
      value: number,
      onChange: (v: number) => void,
      min: number,
      max: number,
      centerLabel: string,
      leftLabel: string,
      rightLabel: string,
      colorGradient: string
    ) => {
      const percentage = Math.round(((value - min) / (max - min)) * 100);
      const checkpoints = [0, 25, 50, 75, 100];
      
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{label}</Label>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                value > (max + min) / 2 ? 'bg-green-500/20 text-green-400' :
                value < (max + min) / 2 ? 'bg-red-500/20 text-red-400' :
                'bg-muted text-muted-foreground'
              }`}>
                {value > 0 && value !== min ? '+' : ''}{value}
              </span>
              <span className="text-xs text-muted-foreground">({percentage}%)</span>
            </div>
          </div>
          
          {/* Slider with checkpoint markers */}
          <div className="relative pt-2 pb-6">
            <Slider
              value={[value]}
              onValueChange={([v]) => onChange(v)}
              min={min}
              max={max}
              step={1}
              className="flex-1"
            />
            
            {/* Checkpoint markers */}
            <div className="absolute top-full left-0 right-0 flex justify-between mt-1">
              {checkpoints.map((cp) => {
                const actualValue = min + (cp / 100) * (max - min);
                const isNearCurrent = Math.abs(percentage - cp) < 5;
                return (
                  <div key={cp} className="flex flex-col items-center">
                    <div className={`w-0.5 h-2 ${
                      isNearCurrent ? 'bg-primary' : 'bg-border/50'
                    }`} />
                    <span className={`text-[9px] ${
                      isNearCurrent ? 'text-primary font-bold' : 'text-muted-foreground/60'
                    }`}>
                      {cp === 0 ? leftLabel.slice(0, 4) : 
                       cp === 50 ? centerLabel.slice(0, 4) : 
                       cp === 100 ? rightLabel.slice(0, 4) : 
                       `${cp}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              comp.status === 'romance' ? 'bg-pink-500/20' :
              comp.status === 'hostile' ? 'bg-red-500/20' :
              comp.status === 'active' ? 'bg-green-500/20' :
              'bg-muted'
            }`}>
              <span className="text-2xl">{personalityType.icon}</span>
            </div>
            <div>
              <h3 className="font-medium">{comp.name}</h3>
              <p className="text-xs text-muted-foreground">{personalityType.type} - {personalityType.description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditingCompanion(null)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Personality Profile Card */}
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-2">
          <Label className="text-xs text-muted-foreground uppercase">Personality Profile</Label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-background/50 rounded">
              <span className="text-muted-foreground block">Archetype</span>
              <span className="font-medium">{personalityType.icon} {personalityType.type}</span>
            </div>
            <div className="p-2 bg-background/50 rounded">
              <span className="text-muted-foreground block">Combat Role</span>
              <span className="font-medium capitalize">{comp.combatRole || 'Unknown'}</span>
            </div>
            <div className="p-2 bg-background/50 rounded col-span-2">
              <span className="text-muted-foreground block">Primary Fear</span>
              <span className="font-medium italic">"{primaryFear}"</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 pt-2">
            {comp.personality.traits.map(t => (
              <Badge key={t} variant="outline" className="text-[10px] capitalize">{t}</Badge>
            ))}
          </div>
        </div>
        
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={forceRomance}
            className="flex flex-col h-auto py-2 text-pink-400 border-pink-500/30 hover:bg-pink-500/10"
          >
            <Heart className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Romance</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={makeLoyal}
            className="flex flex-col h-auto py-2 text-green-400 border-green-500/30 hover:bg-green-500/10"
          >
            <Shield className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Loyal</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={makeNeutral}
            className="flex flex-col h-auto py-2 text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
          >
            <RotateCcw className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Neutral</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={makeHostile}
            className="flex flex-col h-auto py-2 text-red-400 border-red-500/30 hover:bg-red-500/10"
          >
            <Skull className="w-4 h-4 mb-1" />
            <span className="text-[10px]">Hostile</span>
          </Button>
        </div>
        
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={comp.name}
            onChange={e => setEditingCompanion({ ...comp, name: e.target.value })}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={comp.status}
              onValueChange={v => setEditingCompanion({ ...comp, status: v as CompanionStatus })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['active', 'waiting', 'left', 'hostile', 'dead', 'romance', 'rejected'] as CompanionStatus[]).map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Mood</Label>
            <Select
              value={comp.mood}
              onValueChange={v => setEditingCompanion({ ...comp, mood: v as CompanionMood })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['joyful', 'content', 'neutral', 'annoyed', 'angry', 'sad', 'fearful', 'disgusted', 'romantic', 'betrayed'] as CompanionMood[]).map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Relationship Meters with Percentage Checkpoints */}
        <div className="p-3 rounded-lg bg-muted/10 border border-border/30 space-y-4">
          <Label className="text-xs text-muted-foreground uppercase">Relationship Meters</Label>
          <p className="text-[10px] text-muted-foreground italic">
            Center (50%) = Neutral. Left = Negative. Right = Positive.
          </p>
          
          {renderRelationshipSlider(
            'Affinity (Liking)',
            comp.affinity,
            (v) => setEditingCompanion({ ...comp, affinity: v }),
            -100, 100,
            'Neutral', 'Hate', 'Love',
            'from-red-500 via-gray-500 to-green-500'
          )}
          
          {renderRelationshipSlider(
            'Trust',
            comp.trust,
            (v) => setEditingCompanion({ ...comp, trust: v }),
            0, 100,
            'Cautious', 'Distrust', 'Complete',
            'from-red-500 to-green-500'
          )}
          
          {renderRelationshipSlider(
            'Respect',
            comp.respect,
            (v) => setEditingCompanion({ ...comp, respect: v }),
            0, 100,
            'Neutral', 'Disdain', 'Admire',
            'from-red-500 to-green-500'
          )}
          
          {renderRelationshipSlider(
            'Fear',
            comp.fear,
            (v) => setEditingCompanion({ ...comp, fear: v }),
            0, 100,
            'Cautious', 'Calm', 'Terrified',
            'from-green-500 to-red-500'
          )}
          
          {renderRelationshipSlider(
            'Romantic Interest',
            comp.romanticInterest,
            (v) => setEditingCompanion({ ...comp, romanticInterest: v }),
            0, 100,
            'Curious', 'None', 'In Love',
            'from-gray-500 to-pink-500'
          )}
        </div>
        
        {/* Warning box about stat-based system */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Note:</strong> These stats affect AI behavior. The companion's reactions, dialogue, and decisions are based on their personality and these relationship values. You cannot control the graph during gameplay - it evolves based on your actions and their personality.
            </span>
          </p>
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={() => setEditingCompanion(null)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={() => handleUpdateCompanion(comp)} className="flex-1">
            Save Changes
          </Button>
        </div>
      </div>
    );
  };

  const renderCompanionsScreen = () => {
    const activeCompanions = companions.filter(c => c.status === 'active');
    const deadCompanions = companions.filter(c => c.status === 'dead');
    const otherCompanions = companions.filter(c => c.status !== 'active' && c.status !== 'dead');
    
    return (
      <div className="space-y-4">
        {showCompanionCreator ? (
          renderCompanionCreator()
        ) : editingCompanion ? (
          renderCompanionEditor()
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Party ({activeCompanions.length}/3)</h3>
                <p className="text-xs text-muted-foreground">{companions.length} total companions</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowCompanionCreator(true)}>
                <Plus className="w-4 h-4 mr-1" /> Create New
              </Button>
            </div>
            
            {companions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No companions yet</p>
                <p className="text-xs mb-4">Create a custom companion to join your party</p>
                <Button variant="outline" size="sm" onClick={() => setShowCompanionCreator(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Create Companion
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Companions */}
                {activeCompanions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      <Users className="w-3 h-3" /> Active Party
                    </h4>
                    <div className="space-y-3">
                      {activeCompanions.map(renderCompanionCard)}
                    </div>
                  </div>
                )}
                
                {/* Dead Companions - Highlighted for Resuscitation */}
                {deadCompanions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-red-400 uppercase flex items-center gap-2">
                      <Skull className="w-3 h-3" /> Fallen ({deadCompanions.length})
                    </h4>
                    <div className="space-y-3">
                      {deadCompanions.map(renderCompanionCard)}
                    </div>
                  </div>
                )}
                
                {/* Other companions (waiting, left, etc) */}
                {otherCompanions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase flex items-center gap-2">
                      Other Companions
                    </h4>
                    <div className="space-y-3">
                      {otherCompanions.map(renderCompanionCard)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderCurrentScreen = () => {
    if (isLoading && currentScreen === 'character') {
      return (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      );
    }
    
    switch (currentScreen) {
      case 'cheats':
        return renderCheatsScreen();
      case 'character':
        return renderCharacterScreen();
      case 'inventory':
        return renderInventoryScreen();
      case 'companions':
        return renderCompanionsScreen();
      default:
        return renderCheatsScreen();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-amber-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Cheat Mode</h2>
                  <p className="text-xs text-muted-foreground">Bend the rules to your will</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Screen Navigation - Simple Tabs */}
            <div className="flex items-center justify-center gap-1 px-3 py-2 border-b border-border/50 bg-muted/20">
              {SCREENS.map((screen) => (
                <button
                  key={screen.id}
                  onClick={() => goToScreen(screen.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    currentScreen === screen.id
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {screen.icon}
                </button>
              ))}
            </div>
            
            {/* Content - Native scrolling for mobile compatibility */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain'
              }}
            >
              {renderCurrentScreen()}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Use ← → arrows to navigate
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Save className="w-4 h-4 mr-1" />
                  )}
                  Save All
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
