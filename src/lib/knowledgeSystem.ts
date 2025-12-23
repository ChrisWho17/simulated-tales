// NPC Knowledge System - Progressive reveal for stats, inventory, background
import { NPC, Trait } from '@/types/game';

// Knowledge level for individual pieces of information
export type KnowledgeLevel = 'unknown' | 'estimated' | 'known';

// What the player knows about an NPC's stats
export interface NPCStatKnowledge {
  health: KnowledgeLevel;
  energy: KnowledgeLevel;
  mood: KnowledgeLevel;
  strength?: KnowledgeLevel;
  agility?: KnowledgeLevel;
  intelligence?: KnowledgeLevel;
  charisma?: KnowledgeLevel;
  perception?: KnowledgeLevel;
  endurance?: KnowledgeLevel;
}

// What the player knows about an NPC's inventory
export interface NPCInventoryKnowledge {
  visible: string[];     // Items you can see (weapon in hand, etc)
  known: string[];       // Items you know they have
  suspected: string[];   // Items you think they might have
}

// What the player knows about an NPC's background
export interface NPCBackgroundKnowledge {
  occupation: KnowledgeLevel;
  goals: KnowledgeLevel;
  secrets: KnowledgeLevel;
  family: KnowledgeLevel;
  history: KnowledgeLevel;
}

// Intimate knowledge (18+ content when enabled)
export interface NPCIntimateKnowledge {
  orientation: KnowledgeLevel;
  preferences: KnowledgeLevel;
  bodyDetails: KnowledgeLevel;
}

// Complete knowledge entry for an NPC
export interface NPCKnowledgeEntry {
  npcId: string;
  knowsName: boolean;
  knownAs: string;           // Descriptor when name unknown
  interactions: number;       // Number of times interacted
  familiarity: number;        // 0-100, affects what's revealed
  stats: NPCStatKnowledge;
  inventory: NPCInventoryKnowledge;
  background: NPCBackgroundKnowledge;
  intimate: NPCIntimateKnowledge;
  revealedTraits: Trait[];    // Traits discovered through interaction
  lastInteraction: number;    // Timestamp of last interaction
}

// Player's knowledge store
export interface PlayerKnowledgeStore {
  npcs: Record<string, NPCKnowledgeEntry>;
}

// Storage key
const KNOWLEDGE_STORE_KEY = 'living-world-knowledge';

// Initialize empty knowledge store
export function initializeKnowledgeStore(): PlayerKnowledgeStore {
  return { npcs: {} };
}

// Load knowledge from storage
export function loadKnowledgeStore(): PlayerKnowledgeStore {
  try {
    const saved = localStorage.getItem(KNOWLEDGE_STORE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load knowledge store:', e);
  }
  return initializeKnowledgeStore();
}

// Save knowledge to storage
export function saveKnowledgeStore(store: PlayerKnowledgeStore): void {
  try {
    localStorage.setItem(KNOWLEDGE_STORE_KEY, JSON.stringify(store));
  } catch (e) {
    console.error('Failed to save knowledge store:', e);
  }
}

// Generate a descriptor for an unknown NPC
export function generateDescriptor(npc: NPC): string {
  const appearance = (npc as any).appearance;
  const age = npc.meta.age;
  const gender = (npc as any).gender || 'person';
  
  const descriptors: string[] = [];
  
  // Age descriptor
  if (age < 20) descriptors.push('Young');
  else if (age < 30) descriptors.push('');
  else if (age < 50) descriptors.push('');
  else if (age < 65) descriptors.push('Middle-aged');
  else descriptors.push('Elderly');
  
  // Physical descriptors from appearance
  if (appearance) {
    if (appearance.bodyType === 'muscular' || appearance.bodyType === 'athletic') {
      descriptors.push('Athletic');
    } else if (appearance.bodyType === 'heavy' || appearance.bodyType === 'large') {
      descriptors.push('Broad');
    } else if (appearance.bodyType === 'thin' || appearance.bodyType === 'slender') {
      descriptors.push('Slender');
    }
    
    if (appearance.hairColor) {
      const hairMap: Record<string, string> = {
        'black': 'Dark-haired',
        'brown': 'Brown-haired',
        'blonde': 'Blonde',
        'red': 'Red-haired',
        'gray': 'Gray-haired',
        'white': 'White-haired',
        'auburn': 'Auburn-haired',
      };
      if (hairMap[appearance.hairColor]) {
        descriptors.push(hairMap[appearance.hairColor]);
      }
    }
  }
  
  // Gender term
  const genderTerm = gender === 'male' ? 'Man' : gender === 'female' ? 'Woman' : 'Person';
  
  // Filter out empty descriptors and combine
  const validDescriptors = descriptors.filter(d => d.length > 0);
  if (validDescriptors.length === 0) {
    return `Unknown ${genderTerm}`;
  }
  
  return `${validDescriptors.join(' ')} ${genderTerm}`;
}

// Create initial knowledge entry for a new NPC
export function createKnowledgeEntry(npc: NPC): NPCKnowledgeEntry {
  return {
    npcId: npc.id,
    knowsName: false,
    knownAs: generateDescriptor(npc),
    interactions: 0,
    familiarity: 0,
    stats: {
      health: 'unknown',
      energy: 'unknown',
      mood: 'unknown',
      strength: 'unknown',
      agility: 'unknown',
      intelligence: 'unknown',
      charisma: 'unknown',
      perception: 'unknown',
      endurance: 'unknown',
    },
    inventory: {
      visible: [],
      known: [],
      suspected: [],
    },
    background: {
      occupation: 'unknown',
      goals: 'unknown',
      secrets: 'unknown',
      family: 'unknown',
      history: 'unknown',
    },
    intimate: {
      orientation: 'unknown',
      preferences: 'unknown',
      bodyDetails: 'unknown',
    },
    revealedTraits: [],
    lastInteraction: Date.now(),
  };
}

// Get or create knowledge entry for an NPC
export function getOrCreateKnowledge(store: PlayerKnowledgeStore, npc: NPC): NPCKnowledgeEntry {
  if (!store.npcs[npc.id]) {
    store.npcs[npc.id] = createKnowledgeEntry(npc);
  }
  return store.npcs[npc.id];
}

// Interaction types that reveal different information
export type InteractionType = 
  | 'observation'      // Just looking at them
  | 'conversation'     // Talking to them
  | 'combat'           // Fighting with or against them
  | 'trade'            // Trading items
  | 'introduction'     // Formal introduction (reveals name)
  | 'intimate'         // Romantic/intimate interaction
  | 'investigation';   // Actively investigating them

// Update knowledge based on interaction
export function updateKnowledge(
  knowledge: NPCKnowledgeEntry,
  interactionType: InteractionType,
  npc: NPC
): NPCKnowledgeEntry {
  const updated = { ...knowledge };
  updated.interactions += 1;
  updated.lastInteraction = Date.now();
  
  // Increase familiarity based on interaction type
  const familiarityGains: Record<InteractionType, number> = {
    observation: 2,
    conversation: 5,
    combat: 8,
    trade: 4,
    introduction: 10,
    intimate: 15,
    investigation: 6,
  };
  
  updated.familiarity = Math.min(100, updated.familiarity + familiarityGains[interactionType]);
  
  // Reveal information based on interaction type
  switch (interactionType) {
    case 'introduction':
      updated.knowsName = true;
      updated.background.occupation = 'known';
      updated.stats.charisma = 'estimated';
      break;
      
    case 'observation':
      // Physical observations
      updated.stats.health = 'estimated';
      updated.stats.strength = updated.familiarity > 20 ? 'estimated' : updated.stats.strength;
      // See visible items
      if ((npc as any).equippedWeapon) {
        updated.inventory.visible = [...new Set([...updated.inventory.visible, (npc as any).equippedWeapon])];
      }
      break;
      
    case 'conversation':
      updated.stats.charisma = 'estimated';
      updated.stats.intelligence = updated.familiarity > 30 ? 'estimated' : updated.stats.intelligence;
      updated.background.occupation = updated.familiarity > 15 ? 'known' : updated.background.occupation;
      updated.background.goals = updated.familiarity > 40 ? 'estimated' : updated.background.goals;
      
      // Reveal traits through conversation
      const traitChance = updated.familiarity / 100;
      npc.meta.traits.forEach(trait => {
        if (!updated.revealedTraits.includes(trait) && Math.random() < traitChance * 0.5) {
          updated.revealedTraits.push(trait);
        }
      });
      break;
      
    case 'combat':
      updated.stats.strength = 'known';
      updated.stats.agility = 'known';
      updated.stats.endurance = 'estimated';
      updated.stats.health = 'known';
      break;
      
    case 'trade':
      updated.stats.mood = 'estimated';
      // Add traded items to known inventory
      break;
      
    case 'intimate':
      updated.intimate.orientation = 'known';
      updated.intimate.preferences = updated.familiarity > 70 ? 'known' : 'estimated';
      updated.intimate.bodyDetails = 'known';
      updated.stats.mood = 'known';
      break;
      
    case 'investigation':
      updated.background.secrets = updated.familiarity > 60 ? 'estimated' : updated.background.secrets;
      updated.background.history = updated.familiarity > 40 ? 'estimated' : updated.background.history;
      break;
  }
  
  // Familiarity-based automatic upgrades
  if (updated.familiarity >= 30) {
    if (updated.stats.mood === 'unknown') updated.stats.mood = 'estimated';
  }
  if (updated.familiarity >= 50) {
    Object.keys(updated.stats).forEach(key => {
      const statKey = key as keyof NPCStatKnowledge;
      if (updated.stats[statKey] === 'unknown') {
        updated.stats[statKey] = 'estimated';
      }
    });
  }
  if (updated.familiarity >= 80) {
    Object.keys(updated.stats).forEach(key => {
      const statKey = key as keyof NPCStatKnowledge;
      if (updated.stats[statKey] === 'estimated') {
        updated.stats[statKey] = 'known';
      }
    });
  }
  
  return updated;
}

// Handle formal introduction (reveals name)
export function handleIntroduction(
  store: PlayerKnowledgeStore,
  npc: NPC
): PlayerKnowledgeStore {
  const knowledge = getOrCreateKnowledge(store, npc);
  const updated = updateKnowledge(knowledge, 'introduction', npc);
  
  return {
    ...store,
    npcs: {
      ...store.npcs,
      [npc.id]: updated,
    },
  };
}

// Get display name for NPC (real name if known, descriptor if not)
export function getDisplayName(knowledge: NPCKnowledgeEntry | undefined, npc: NPC): string {
  if (!knowledge) {
    return generateDescriptor(npc);
  }
  return knowledge.knowsName ? npc.meta.name : knowledge.knownAs;
}

// Format a stat value based on knowledge level
export function formatStatValue(
  value: number,
  knowledgeLevel: KnowledgeLevel,
  showQuestionMarks: boolean = true
): string {
  switch (knowledgeLevel) {
    case 'unknown':
      return showQuestionMarks ? '???' : '-';
    case 'estimated':
      // Round to nearest 5 for estimated values
      const estimated = Math.round(value / 5) * 5;
      return `~${estimated}`;
    case 'known':
      return String(value);
  }
}

// Check if any intimate knowledge has been gained
export function hasIntimateKnowledge(knowledge: NPCKnowledgeEntry): boolean {
  return (
    knowledge.intimate.orientation !== 'unknown' ||
    knowledge.intimate.preferences !== 'unknown' ||
    knowledge.intimate.bodyDetails !== 'unknown'
  );
}

// Get mystery text for unknown information
export function getMysteryText(knowledgeLevel: KnowledgeLevel): string {
  switch (knowledgeLevel) {
    case 'unknown':
      return '???';
    case 'estimated':
      return '(estimated)';
    case 'known':
      return '';
  }
}
