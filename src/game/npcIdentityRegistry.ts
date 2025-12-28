// NPC Identity Registry System - Ensures NPC identity persistence
// NPCs have permanent, locked identities and relationships

import { 
  CharacterStats, 
  getStatModifier 
} from '@/types/rpgCharacter';
import { 
  CharacterAppearance, 
  CharacterPersonality,
  DispositionOption,
  SocialStyleOption,
  BodyTypeOption,
  HeightOption,
  HairLengthOption
} from '@/types/characterCreation';
import { generateNPCName, Gender } from './npcNameGenerator';

// ============= TYPES =============

/**
 * NPC Aliases - Multiple ways to refer to an NPC
 * All tied to a single NPC ID for consistency
 */
export interface NPCAliases {
  fullName: string;           // Official full name (e.g., "Marcus Chen")
  nickname?: string;          // Common nickname used in-world (e.g., "Merc")
  callsign?: string;          // Military/professional callsign (e.g., "Viper")
  title?: string;             // Formal title (e.g., "Dr.", "Captain")
  occupation?: string;        // Job title for display (e.g., "Squad Leader")
  form?: string;              // Alternative form/identity (e.g., "The Shadow")
  playerNickname?: string;    // Custom name assigned by the player in character menu
}

/**
 * NPC Character Stats - Same system as player character
 * Generated randomly but weighted by personality/occupation
 */
export interface NPCCharacterStats {
  stats: CharacterStats;
  appearance?: Partial<CharacterAppearance>;
  personality?: Partial<CharacterPersonality>;
  level: number;
  maxHealth: number;
  currentHealth: number;
}

export interface NPCPermanentIdentity {
  id: string;
  createdTurn: number;
  name: string;
  aliases: NPCAliases;
  characterStats?: NPCCharacterStats;
  familyId: string | null;
  biologicalParents: string[];
  biologicalChildren: string[];
  biologicalSiblings: string[];
  birthOrder: number;
  species: string;
  birthDate: string | null;
  birthplace: string | null;
}

export interface NPCSemiPermanentData {
  adoptiveFamily: string | null;
  spouse: string | null;
  legalGuardian: string | null;
  faction: string;
  occupation: string;
}

export interface NPCMutableData {
  currentLocation: string;
  health: number;
  mood: string;
  currentActivity: string;
  inventory: string[]; // Object IDs from objectRegistrySystem
  equipped: Record<string, string | null>;
}

export interface RegisteredNPC {
  permanent: NPCPermanentIdentity;
  semiPermanent: NPCSemiPermanentData;
  mutable: NPCMutableData;
  isLocked: boolean;
  lockReason: string | null;
  lockedOnTurn: number | null;
}

export interface NPCRelationship {
  type: 'sibling' | 'parent-child' | 'spouse' | 'friend' | 'enemy' | 'colleague' | 'acquaintance';
  npc1: string;
  npc2: string;
  established: number;
  locked: boolean;
  lockedReason?: string;
}

export interface NPCFamily {
  id: string;
  name: string;
  members: string[];
}

export interface NPCIdentityRegistry {
  npcs: Record<string, RegisteredNPC>;
  relationships: Record<string, NPCRelationship>; // "npcId1:npcId2" sorted
  families: Record<string, NPCFamily>;
  lockedIds: string[];
}

// ============= REGISTRY STATE =============

let registry: NPCIdentityRegistry = {
  npcs: {},
  relationships: {},
  families: {},
  lockedIds: [],
};

const STORAGE_KEY = 'untold-npc-identity-registry';

// ============= PERSISTENCE =============

export function loadNPCRegistry(): NPCIdentityRegistry {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      registry = JSON.parse(saved);
    }
  } catch (e) {
    console.error('[NPCRegistry] Failed to load:', e);
  }
  return registry;
}

export function saveNPCRegistry(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch (e) {
    console.error('[NPCRegistry] Failed to save:', e);
  }
}

export function getNPCRegistry(): NPCIdentityRegistry {
  return registry;
}

export function setNPCRegistry(newRegistry: NPCIdentityRegistry): void {
  registry = newRegistry;
  saveNPCRegistry();
}

// ============= NPC CREATION =============

export interface CreateNPCConfig {
  id?: string;
  name: string;
  nickname?: string;
  callsign?: string;
  title?: string;
  familyId?: string;
  parents?: string[];
  children?: string[];
  siblings?: string[];
  birthOrder?: number;
  species?: string;
  birthDate?: string;
  birthplace?: string;
  adoptiveFamily?: string;
  spouse?: string;
  faction?: string;
  occupation?: string;
  location?: string;
  currentTurn?: number;
  generateStats?: boolean;  // Whether to generate character stats
}

/**
 * Generate random stats for an NPC, weighted by occupation/personality
 */
export function generateNPCStats(occupation?: string, personality?: string): NPCCharacterStats {
  // Base stats - same as player (8-18 range, averaging around 10-12)
  const rollStat = (): number => {
    // Roll 3d6 drop lowest, like classic D&D
    const rolls = [
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
      Math.floor(Math.random() * 6) + 1,
    ].sort((a, b) => b - a);
    return rolls[0] + rolls[1] + Math.floor(rolls[2] / 2) + 3; // Range: ~6-18
  };

  const stats: CharacterStats = {
    strength: rollStat(),
    dexterity: rollStat(),
    constitution: rollStat(),
    intelligence: rollStat(),
    wisdom: rollStat(),
    charisma: rollStat(),
  };

  // Apply occupation bonuses (similar to class bonuses in player creation)
  const occupationLower = (occupation || '').toLowerCase();
  if (occupationLower.includes('soldier') || occupationLower.includes('guard') || occupationLower.includes('warrior')) {
    stats.strength += 2;
    stats.constitution += 1;
  } else if (occupationLower.includes('leader') || occupationLower.includes('captain') || occupationLower.includes('commander')) {
    stats.charisma += 2;
    stats.wisdom += 1;
  } else if (occupationLower.includes('doctor') || occupationLower.includes('medic') || occupationLower.includes('healer')) {
    stats.intelligence += 2;
    stats.wisdom += 1;
  } else if (occupationLower.includes('thief') || occupationLower.includes('scout') || occupationLower.includes('rogue')) {
    stats.dexterity += 2;
    stats.charisma += 1;
  } else if (occupationLower.includes('scholar') || occupationLower.includes('scientist') || occupationLower.includes('mage')) {
    stats.intelligence += 2;
    stats.wisdom += 1;
  } else if (occupationLower.includes('merchant') || occupationLower.includes('trader') || occupationLower.includes('vendor')) {
    stats.charisma += 2;
    stats.intelligence += 1;
  }

  // Calculate health (same formula as player)
  const conMod = getStatModifier(stats.constitution);
  const level = Math.floor(Math.random() * 3) + 1; // Random level 1-3
  const maxHealth = 10 + (conMod * level) + ((level - 1) * 6);

  // Generate random appearance matching personality
  const bodyTypes: BodyTypeOption[] = ['slim', 'average', 'athletic', 'curvy', 'heavy'];
  const heights: HeightOption[] = ['short', 'average', 'tall'];
  const hairColors = ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'auburn'];
  const hairLengths: HairLengthOption[] = ['short', 'medium', 'long'];
  const eyeColors = ['brown', 'blue', 'green', 'hazel', 'gray', 'amber'];
  const skinTones = ['pale', 'fair', 'light', 'medium', 'tan', 'olive', 'brown', 'dark'];

  const appearance: Partial<CharacterAppearance> = {
    bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
    height: heights[Math.floor(Math.random() * heights.length)],
    hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
    hairLength: hairLengths[Math.floor(Math.random() * hairLengths.length)],
    eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
    skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
  };

  // Generate personality based on stats
  const dispositions: DispositionOption[] = ['Bold', 'Cautious', 'Adaptable'];
  const socialStyles: SocialStyleOption[] = ['Charming', 'Reserved', 'Blunt'];
  
  // High charisma -> Charming, Low -> Reserved
  const socialIndex = stats.charisma >= 14 ? 0 : stats.charisma <= 8 ? 1 : 2;
  // High strength/con -> Bold, High wisdom -> Cautious
  const dispIndex = stats.strength >= 14 || stats.constitution >= 14 ? 0 : 
                    stats.wisdom >= 14 ? 1 : 2;

  const npcPersonality: Partial<CharacterPersonality> = {
    disposition: dispositions[dispIndex],
    socialStyle: socialStyles[socialIndex],
  };

  return {
    stats,
    appearance,
    personality: npcPersonality,
    level,
    maxHealth,
    currentHealth: maxHealth,
  };
}

export function createRegisteredNPC(config: CreateNPCConfig): string {
  const id = config.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentTurn = config.currentTurn || 0;
  
  // Build aliases from config
  const aliases: NPCAliases = {
    fullName: config.name,
    nickname: config.nickname,
    callsign: config.callsign,
    title: config.title,
    occupation: config.occupation,
  };

  // Generate character stats if requested (default true for new NPCs)
  const characterStats = config.generateStats !== false 
    ? generateNPCStats(config.occupation) 
    : undefined;
  
  const npc: RegisteredNPC = {
    permanent: {
      id,
      createdTurn: currentTurn,
      name: config.name,
      aliases,
      characterStats,
      familyId: config.familyId || null,
      biologicalParents: config.parents || [],
      biologicalChildren: config.children || [],
      biologicalSiblings: config.siblings || [],
      birthOrder: config.birthOrder || 1,
      species: config.species || 'human',
      birthDate: config.birthDate || null,
      birthplace: config.birthplace || null,
    },
    semiPermanent: {
      adoptiveFamily: config.adoptiveFamily || null,
      spouse: config.spouse || null,
      legalGuardian: null,
      faction: config.faction || 'civilian',
      occupation: config.occupation || 'none',
    },
    mutable: {
      currentLocation: config.location || 'unknown',
      health: characterStats?.currentHealth ?? 100,
      mood: 'neutral',
      currentActivity: 'idle',
      inventory: [],
      equipped: {},
    },
    isLocked: false,
    lockReason: null,
    lockedOnTurn: null,
  };
  
  registry.npcs[id] = npc;
  
  // Add to family if specified
  if (config.familyId) {
    addToFamily(id, config.familyId);
  }
  
  // Register sibling relationships
  for (const siblingId of config.siblings || []) {
    if (registry.npcs[siblingId]) {
      registerRelationship(id, siblingId, 'sibling', currentTurn);
    }
  }
  
  saveNPCRegistry();
  console.log(`[NPCRegistry] Created: ${id} (${config.name})`);
  return id;
}

// ============= IDENTITY LOCKING =============

export function lockNPCIdentity(
  npcId: string, 
  reason: string = 'established_in_narrative',
  currentTurn: number = 0
): boolean {
  const npc = registry.npcs[npcId];
  if (!npc) return false;
  
  npc.isLocked = true;
  npc.lockReason = reason;
  npc.lockedOnTurn = currentTurn;
  
  if (!registry.lockedIds.includes(npcId)) {
    registry.lockedIds.push(npcId);
  }
  
  saveNPCRegistry();
  console.log(`[NPCRegistry] Identity locked: ${npcId} (${npc.permanent.name})`);
  return true;
}

export function isNPCLocked(npcId: string): boolean {
  return registry.lockedIds.includes(npcId);
}

// ============= RELATIONSHIP MANAGEMENT =============

function getRelationshipKey(npcId1: string, npcId2: string): string {
  return [npcId1, npcId2].sort().join(':');
}

export function registerRelationship(
  npcId1: string,
  npcId2: string,
  type: NPCRelationship['type'],
  currentTurn: number = 0
): boolean {
  // Validate both NPCs exist
  if (!registry.npcs[npcId1] || !registry.npcs[npcId2]) {
    console.error('[NPCRegistry] Cannot register relationship: NPC not found');
    return false;
  }
  
  const key = getRelationshipKey(npcId1, npcId2);
  
  // Check if relationship already exists and is locked
  const existing = registry.relationships[key];
  if (existing?.locked) {
    console.warn(`[NPCRegistry] Relationship ${key} is locked, cannot change`);
    return false;
  }
  
  registry.relationships[key] = {
    type,
    npc1: npcId1,
    npc2: npcId2,
    established: currentTurn,
    locked: false,
  };
  
  // Update NPC records for biological relationships
  if (type === 'sibling') {
    const npc1 = registry.npcs[npcId1];
    const npc2 = registry.npcs[npcId2];
    
    if (!npc1.permanent.biologicalSiblings.includes(npcId2)) {
      npc1.permanent.biologicalSiblings.push(npcId2);
    }
    if (!npc2.permanent.biologicalSiblings.includes(npcId1)) {
      npc2.permanent.biologicalSiblings.push(npcId1);
    }
  } else if (type === 'spouse') {
    registry.npcs[npcId1].semiPermanent.spouse = npcId2;
    registry.npcs[npcId2].semiPermanent.spouse = npcId1;
  }
  
  saveNPCRegistry();
  console.log(`[NPCRegistry] Relationship registered: ${key} (${type})`);
  return true;
}

export function lockRelationship(
  npcId1: string, 
  npcId2: string,
  reason: string = 'established'
): boolean {
  const key = getRelationshipKey(npcId1, npcId2);
  const rel = registry.relationships[key];
  
  if (rel) {
    rel.locked = true;
    rel.lockedReason = reason;
    saveNPCRegistry();
    console.log(`[NPCRegistry] Relationship locked: ${key} (${rel.type})`);
    return true;
  }
  return false;
}

export function removeRelationship(npcId1: string, npcId2: string): boolean {
  const key = getRelationshipKey(npcId1, npcId2);
  const rel = registry.relationships[key];
  
  if (!rel) return false;
  if (rel.locked) {
    console.warn(`[NPCRegistry] Cannot remove locked relationship: ${key}`);
    return false;
  }
  
  // Update NPC records
  const npc1 = registry.npcs[npcId1];
  const npc2 = registry.npcs[npcId2];
  
  if (rel.type === 'sibling' && npc1 && npc2) {
    npc1.permanent.biologicalSiblings = npc1.permanent.biologicalSiblings.filter(id => id !== npcId2);
    npc2.permanent.biologicalSiblings = npc2.permanent.biologicalSiblings.filter(id => id !== npcId1);
  } else if (rel.type === 'spouse') {
    if (npc1) npc1.semiPermanent.spouse = null;
    if (npc2) npc2.semiPermanent.spouse = null;
  }
  
  delete registry.relationships[key];
  saveNPCRegistry();
  
  console.log(`[NPCRegistry] Relationship removed: ${key}`);
  return true;
}

// ============= FAMILY MANAGEMENT =============

export function createFamily(name: string, memberIds: string[] = []): string {
  const id = `family_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  registry.families[id] = {
    id,
    name,
    members: memberIds,
  };
  
  // Update NPC family references
  for (const memberId of memberIds) {
    const npc = registry.npcs[memberId];
    if (npc) {
      npc.permanent.familyId = id;
    }
  }
  
  saveNPCRegistry();
  console.log(`[NPCRegistry] Family created: ${id} (${name})`);
  return id;
}

export function addToFamily(npcId: string, familyId: string): boolean {
  const family = registry.families[familyId];
  const npc = registry.npcs[npcId];
  
  if (!family || !npc) return false;
  
  if (!family.members.includes(npcId)) {
    family.members.push(npcId);
  }
  npc.permanent.familyId = familyId;
  
  saveNPCRegistry();
  return true;
}

// ============= ALIAS MANAGEMENT =============

/**
 * Set a player-assigned nickname for an NPC
 */
export function setPlayerNickname(npcId: string, nickname: string | undefined): boolean {
  const npc = registry.npcs[npcId];
  if (!npc) return false;
  
  npc.permanent.aliases.playerNickname = nickname;
  saveNPCRegistry();
  console.log(`[NPCRegistry] Player nickname set for ${npcId}: "${nickname}"`);
  return true;
}

/**
 * Update any alias field for an NPC
 */
export function updateNPCAliases(npcId: string, updates: Partial<NPCAliases>): boolean {
  const npc = registry.npcs[npcId];
  if (!npc) return false;
  
  npc.permanent.aliases = {
    ...npc.permanent.aliases,
    ...updates,
  };
  saveNPCRegistry();
  console.log(`[NPCRegistry] Aliases updated for ${npcId}:`, updates);
  return true;
}

/**
 * Detect and extract name/callsign reveals from dialogue text.
 * Patterns detected:
 * - "My name is X" / "I'm X" / "Call me X"
 * - "They call me X" / "My callsign is X"
 * - "I go by X" / "You can call me X"
 * 
 * Returns the revealed info if found, null otherwise.
 */
export interface NameRevealResult {
  type: 'name' | 'callsign' | 'nickname' | 'title';
  value: string;
  npcId: string;
}

export function detectNameReveal(
  dialogueText: string, 
  speakerNpcId: string
): NameRevealResult | null {
  const npc = registry.npcs[speakerNpcId];
  if (!npc) return null;
  
  const text = dialogueText.toLowerCase();
  
  // Real name patterns
  const namePatterns = [
    /my (?:real )?name is (?:actually )?["']?([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
    /i'm (?:actually )?([A-Z][a-z]+(?: [A-Z][a-z]+)?)[,\.!\?]/i,
    /call me ([A-Z][a-z]+)[,\.!\? ]/i,
    /i go by ([A-Z][a-z]+)/i,
    /you can call me ([A-Z][a-z]+)/i,
    /the name(?:'s| is) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
  ];
  
  // Callsign patterns
  const callsignPatterns = [
    /my callsign is ["']?([A-Za-z0-9\-]+)/i,
    /they call me ["']?([A-Za-z0-9\-]+)/i,
    /codename[: ]+["']?([A-Za-z0-9\-]+)/i,
    /designation[: ]+["']?([A-Za-z0-9\-]+)/i,
  ];
  
  // Title patterns
  const titlePatterns = [
    /i(?:'m| am) (?:a |the )?(?:doctor|dr\.?|captain|capt\.?|sergeant|sgt\.?|lieutenant|lt\.?|commander|professor|prof\.?)/i,
  ];
  
  // Check for name reveals
  for (const pattern of namePatterns) {
    const match = dialogueText.match(pattern);
    if (match && match[1]) {
      const revealedName = match[1].trim();
      // Don't trigger if it matches the current occupation/alias
      if (revealedName.toLowerCase() !== npc.semiPermanent.occupation?.toLowerCase()) {
        return { type: 'name', value: revealedName, npcId: speakerNpcId };
      }
    }
  }
  
  // Check for callsign reveals
  for (const pattern of callsignPatterns) {
    const match = dialogueText.match(pattern);
    if (match && match[1]) {
      return { type: 'callsign', value: match[1].trim(), npcId: speakerNpcId };
    }
  }
  
  // Check for title reveals
  for (const pattern of titlePatterns) {
    const match = dialogueText.match(pattern);
    if (match) {
      const titleMap: Record<string, string> = {
        'doctor': 'Dr.', 'dr': 'Dr.', 'dr.': 'Dr.',
        'captain': 'Capt.', 'capt': 'Capt.', 'capt.': 'Capt.',
        'sergeant': 'Sgt.', 'sgt': 'Sgt.', 'sgt.': 'Sgt.',
        'lieutenant': 'Lt.', 'lt': 'Lt.', 'lt.': 'Lt.',
        'commander': 'Cmdr.',
        'professor': 'Prof.', 'prof': 'Prof.', 'prof.': 'Prof.',
      };
      const foundTitle = match[0].toLowerCase().split(/\s+/).pop() || '';
      const normalizedTitle = titleMap[foundTitle.replace('.', '')] || foundTitle;
      return { type: 'title', value: normalizedTitle, npcId: speakerNpcId };
    }
  }
  
  return null;
}

/**
 * Process dialogue text for name reveals and auto-update NPC aliases
 * Returns true if a reveal was detected and applied
 */
export function processDialogueForNameReveals(
  dialogueText: string,
  speakerNpcId: string
): NameRevealResult | null {
  const reveal = detectNameReveal(dialogueText, speakerNpcId);
  
  if (reveal) {
    const updates: Partial<NPCAliases> = {};
    
    switch (reveal.type) {
      case 'name':
        updates.fullName = reveal.value;
        // If this was previously an occupation-only NPC, update the name too
        const npc = registry.npcs[speakerNpcId];
        if (npc) {
          npc.permanent.name = reveal.value;
        }
        break;
      case 'callsign':
        updates.callsign = reveal.value;
        break;
      case 'nickname':
        updates.nickname = reveal.value;
        break;
      case 'title':
        updates.title = reveal.value;
        break;
    }
    
    updateNPCAliases(speakerNpcId, updates);
    console.log(`[NPCRegistry] Name reveal detected: ${reveal.type} = "${reveal.value}" for ${speakerNpcId}`);
    return reveal;
  }
  
  return null;
}

/**
 * Get the display name for an NPC based on their aliases and context
 * Priority: playerNickname > nickname > callsign > title+name > occupation > name
 */
export function getNPCDisplayName(npcId: string, context?: 'formal' | 'casual' | 'military'): string {
  const npc = registry.npcs[npcId];
  if (!npc) return 'Unknown';
  
  const aliases = npc.permanent.aliases;
  
  // Player nickname always takes priority
  if (aliases.playerNickname) {
    return aliases.playerNickname;
  }
  
  // Context-specific display
  switch (context) {
    case 'military':
      if (aliases.callsign) return aliases.callsign;
      if (aliases.title) return `${aliases.title} ${aliases.fullName}`;
      break;
    case 'formal':
      if (aliases.title) return `${aliases.title} ${aliases.fullName}`;
      break;
    case 'casual':
      if (aliases.nickname) return aliases.nickname;
      break;
  }
  
  // Default fallback chain
  return aliases.nickname || aliases.callsign || aliases.occupation || aliases.fullName;
}

/**
 * Get all aliases for an NPC
 */
export function getNPCAliases(npcId: string): NPCAliases | null {
  const npc = registry.npcs[npcId];
  return npc?.permanent.aliases || null;
}

// ============= QUERIES =============

export function getRegisteredNPC(npcId: string): RegisteredNPC | null {
  return registry.npcs[npcId] || null;
}

export function findNPCByName(name: string): RegisteredNPC | null {
  const lowerName = name.toLowerCase().trim();
  
  for (const npc of Object.values(registry.npcs)) {
    if (npc.permanent.name.toLowerCase() === lowerName ||
        npc.permanent.name.toLowerCase().includes(lowerName)) {
      return npc;
    }
  }
  
  return null;
}

/**
 * Find an NPC by name OR occupation (for dialogue speakers like "Squad Leader")
 */
export function findNPCByNameOrOccupation(name: string): RegisteredNPC | null {
  const lowerName = name.toLowerCase().trim();
  
  for (const npc of Object.values(registry.npcs)) {
    // Check exact name match
    if (npc.permanent.name.toLowerCase() === lowerName) {
      return npc;
    }
    // Check occupation match
    if (npc.semiPermanent.occupation && 
        npc.semiPermanent.occupation.toLowerCase() === lowerName) {
      return npc;
    }
  }
  
  // Fallback to partial match
  for (const npc of Object.values(registry.npcs)) {
    if (npc.permanent.name.toLowerCase().includes(lowerName) ||
        (npc.semiPermanent.occupation && 
         npc.semiPermanent.occupation.toLowerCase().includes(lowerName))) {
      return npc;
    }
  }
  
  return null;
}

/**
 * Universal NPC ID resolution - finds or creates an NPC and returns their permanent ID.
 * This is the single source of truth for NPC IDs across all systems.
 * 
 * @param name - The NPC name or occupation/title
 * @param options - Additional options for NPC creation if new
 * @returns The permanent NPC ID (always consistent)
 */
export function resolveNPCId(
  name: string, 
  options?: {
    occupation?: string;
    location?: string;
    faction?: string;
    currentTurn?: number;
  }
): string {
  // First, try to find existing NPC by name or occupation
  const existing = findNPCByNameOrOccupation(name);
  if (existing) {
    return existing.permanent.id;
  }
  
  // Create new NPC with consistent ID
  const npcId = createRegisteredNPC({
    name,
    occupation: options?.occupation || name, // Use name as occupation if not provided
    location: options?.location,
    faction: options?.faction,
    currentTurn: options?.currentTurn || 0,
  });
  
  console.log(`[NPCRegistry] Resolved new NPC ID: ${npcId} for "${name}"`);
  return npcId;
}

/**
 * Get NPC ID if exists, otherwise return null (doesn't create)
 */
export function getNPCId(name: string): string | null {
  const existing = findNPCByNameOrOccupation(name);
  return existing?.permanent.id || null;
}

export function getRelationship(npcId1: string, npcId2: string): NPCRelationship | null {
  const key = getRelationshipKey(npcId1, npcId2);
  return registry.relationships[key] || null;
}

export function getSiblings(npcId: string): RegisteredNPC[] {
  const npc = registry.npcs[npcId];
  if (!npc) return [];
  
  return npc.permanent.biologicalSiblings
    .map(id => registry.npcs[id])
    .filter(Boolean) as RegisteredNPC[];
}

export function getFamilyMembers(familyId: string): RegisteredNPC[] {
  const family = registry.families[familyId];
  if (!family) return [];
  
  return family.members
    .map(id => registry.npcs[id])
    .filter(Boolean) as RegisteredNPC[];
}

export function getAllRegisteredNPCs(): RegisteredNPC[] {
  return Object.values(registry.npcs);
}

// ============= VALIDATION =============

export interface NPCValidationError {
  type: 'ASYMMETRIC_SIBLING' | 'MISSING_SIBLING' | 'MISSING_FAMILY' | 'FAMILY_MISMATCH';
  npcId: string;
  relatedId?: string;
  message: string;
}

export function validateNPCRelationships(): NPCValidationError[] {
  const errors: NPCValidationError[] = [];
  
  for (const [npcId, npc] of Object.entries(registry.npcs)) {
    // Check sibling consistency
    for (const siblingId of npc.permanent.biologicalSiblings) {
      const sibling = registry.npcs[siblingId];
      
      if (!sibling) {
        errors.push({
          type: 'MISSING_SIBLING',
          npcId,
          relatedId: siblingId,
          message: `${npc.permanent.name}'s sibling ${siblingId} does not exist`,
        });
        continue;
      }
      
      if (!sibling.permanent.biologicalSiblings.includes(npcId)) {
        errors.push({
          type: 'ASYMMETRIC_SIBLING',
          npcId,
          relatedId: siblingId,
          message: `${npc.permanent.name} claims ${sibling.permanent.name} as sibling, but not vice versa`,
        });
      }
    }
    
    // Check family consistency
    if (npc.permanent.familyId) {
      const family = registry.families[npc.permanent.familyId];
      if (!family) {
        errors.push({
          type: 'MISSING_FAMILY',
          npcId,
          relatedId: npc.permanent.familyId,
          message: `${npc.permanent.name}'s family ${npc.permanent.familyId} does not exist`,
        });
      } else if (!family.members.includes(npcId)) {
        errors.push({
          type: 'FAMILY_MISMATCH',
          npcId,
          relatedId: npc.permanent.familyId,
          message: `${npc.permanent.name} claims family ${npc.permanent.familyId}, but isn't in member list`,
        });
      }
    }
  }
  
  if (errors.length > 0) {
    console.error('[NPCRegistry] Validation errors:', errors);
  }
  
  return errors;
}

export function repairNPCRelationships(errors: NPCValidationError[]): void {
  for (const error of errors) {
    switch (error.type) {
      case 'ASYMMETRIC_SIBLING':
        // Make relationship symmetric
        if (error.relatedId) {
          const sibling = registry.npcs[error.relatedId];
          if (sibling && !sibling.permanent.biologicalSiblings.includes(error.npcId)) {
            sibling.permanent.biologicalSiblings.push(error.npcId);
            console.log(`[NPCRegistry] Repaired: Added ${error.npcId} as sibling of ${error.relatedId}`);
          }
        }
        break;
        
      case 'FAMILY_MISMATCH':
        // Add NPC to family members
        if (error.relatedId) {
          const family = registry.families[error.relatedId];
          if (family && !family.members.includes(error.npcId)) {
            family.members.push(error.npcId);
            console.log(`[NPCRegistry] Repaired: Added ${error.npcId} to family ${error.relatedId}`);
          }
        }
        break;
    }
  }
  
  saveNPCRegistry();
}

// ============= CONTEXT BUILDER FOR AI =============

export function buildNPCIdentityContext(): string {
  const lockedNPCs = Object.values(registry.npcs).filter(n => n.isLocked);
  const lockedRelationships = Object.values(registry.relationships).filter(r => r.locked);
  
  if (lockedNPCs.length === 0 && lockedRelationships.length === 0) {
    return '';
  }
  
  const lines: string[] = [
    '## NPC IDENTITY RULES - DO NOT VIOLATE',
    '',
    'NPC identities and relationships are LOCKED. Do not change these established facts:',
    '',
  ];
  
  // List locked NPCs
  if (lockedNPCs.length > 0) {
    lines.push('### Established Characters:');
    for (const npc of lockedNPCs.slice(0, 15)) { // Limit to avoid prompt bloat
      const siblings = npc.permanent.biologicalSiblings
        .map(id => registry.npcs[id]?.permanent.name)
        .filter(Boolean);
      
      let identity = `- ${npc.permanent.name}: ${npc.semiPermanent.occupation || 'unknown occupation'}`;
      if (siblings.length > 0) {
        identity += ` (siblings: ${siblings.join(', ')})`;
      }
      if (npc.semiPermanent.spouse) {
        const spouse = registry.npcs[npc.semiPermanent.spouse];
        if (spouse) {
          identity += ` (spouse: ${spouse.permanent.name})`;
        }
      }
      lines.push(identity);
    }
    lines.push('');
  }
  
  // List locked relationships
  if (lockedRelationships.length > 0) {
    lines.push('### LOCKED Relationships (cannot change):');
    for (const rel of lockedRelationships.slice(0, 10)) {
      const npc1 = registry.npcs[rel.npc1]?.permanent.name || rel.npc1;
      const npc2 = registry.npcs[rel.npc2]?.permanent.name || rel.npc2;
      lines.push(`- ${npc1} and ${npc2}: ${rel.type}`);
    }
    lines.push('');
  }
  
  lines.push('NEVER contradict these established identities or relationships.');
  
  return lines.join('\n');
}

// ============= INITIALIZATION =============

// Load on module import
loadNPCRegistry();
