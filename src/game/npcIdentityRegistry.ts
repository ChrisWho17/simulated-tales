// NPC Identity Registry System - Ensures NPC identity persistence
// NPCs have permanent, locked identities and relationships

// ============= TYPES =============

export interface NPCPermanentIdentity {
  id: string;
  createdTurn: number;
  name: string;
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
}

export function createRegisteredNPC(config: CreateNPCConfig): string {
  const id = config.id || `npc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const currentTurn = config.currentTurn || 0;
  
  const npc: RegisteredNPC = {
    permanent: {
      id,
      createdTurn: currentTurn,
      name: config.name,
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
      health: 100,
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
