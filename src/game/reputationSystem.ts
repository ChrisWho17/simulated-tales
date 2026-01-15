// ============================================================================
// LOCATION REPUTATION SYSTEM - Track player standing per location/faction
// Based on the Interconnected Game Prompt System Design
// ============================================================================

import { eventBus } from './eventBus';

export interface LocationReputation {
  locationId: string;
  locationName: string;
  reputation: number; // -100 to 100
  traits: ReputationTrait[];
  lastVisit: number; // game tick
  significantEvents: ReputationEvent[];
}

export type ReputationTrait = 
  | 'generous'
  | 'cruel'
  | 'heroic'
  | 'villainous'
  | 'mysterious'
  | 'trustworthy'
  | 'untrustworthy'
  | 'wealthy'
  | 'dangerous'
  | 'helpful'
  | 'thief'
  | 'protector'
  | 'destroyer';

export interface ReputationEvent {
  tick: number;
  action: string;
  impact: number;
  trait?: ReputationTrait;
}

export interface FactionReputation {
  factionId: string;
  factionName: string;
  reputation: number;
  isHostile: boolean;
  traits: ReputationTrait[];
}

export interface WorldReputation {
  locations: Record<string, LocationReputation>;
  factions: Record<string, FactionReputation>;
  globalFame: number; // 0-100, how well-known the player is
  globalInfamy: number; // 0-100, notoriety
}

// ============================================================================
// REPUTATION THRESHOLDS
// ============================================================================

export const REPUTATION_LEVELS = {
  REVERED: { min: 80, label: 'Revered', color: 'text-yellow-400' },
  HONORED: { min: 50, label: 'Honored', color: 'text-green-400' },
  FRIENDLY: { min: 20, label: 'Friendly', color: 'text-green-300' },
  NEUTRAL: { min: -20, label: 'Neutral', color: 'text-muted-foreground' },
  UNFRIENDLY: { min: -50, label: 'Unfriendly', color: 'text-orange-400' },
  HOSTILE: { min: -80, label: 'Hostile', color: 'text-red-400' },
  HATED: { min: -100, label: 'Hated', color: 'text-red-600' }
} as const;

export function getReputationLevel(reputation: number): { label: string; color: string } {
  if (reputation >= REPUTATION_LEVELS.REVERED.min) return REPUTATION_LEVELS.REVERED;
  if (reputation >= REPUTATION_LEVELS.HONORED.min) return REPUTATION_LEVELS.HONORED;
  if (reputation >= REPUTATION_LEVELS.FRIENDLY.min) return REPUTATION_LEVELS.FRIENDLY;
  if (reputation >= REPUTATION_LEVELS.NEUTRAL.min) return REPUTATION_LEVELS.NEUTRAL;
  if (reputation >= REPUTATION_LEVELS.UNFRIENDLY.min) return REPUTATION_LEVELS.UNFRIENDLY;
  if (reputation >= REPUTATION_LEVELS.HOSTILE.min) return REPUTATION_LEVELS.HOSTILE;
  return REPUTATION_LEVELS.HATED;
}

// ============================================================================
// REPUTATION EFFECTS ON NARRATIVE
// ============================================================================

export interface ReputationNarrativeEffects {
  npcGreeting: string;
  shopPriceModifier: number; // percentage: -20 = 20% discount, +30 = 30% markup
  questAvailability: 'all' | 'positive_only' | 'negative_only' | 'none';
  canRest: boolean;
  guardsHostile: boolean;
  specialDialogueUnlocked: string[];
}

export function getReputationEffects(reputation: number): ReputationNarrativeEffects {
  if (reputation >= 80) {
    return {
      npcGreeting: 'The townsfolk greet you warmly, some even bowing with respect.',
      shopPriceModifier: -20,
      questAvailability: 'all',
      canRest: true,
      guardsHostile: false,
      specialDialogueUnlocked: ['hero_recognition', 'secret_information', 'faction_invitation']
    };
  }
  if (reputation >= 50) {
    return {
      npcGreeting: 'Familiar faces smile and nod as you pass.',
      shopPriceModifier: -10,
      questAvailability: 'all',
      canRest: true,
      guardsHostile: false,
      specialDialogueUnlocked: ['trusted_access', 'local_gossip']
    };
  }
  if (reputation >= 20) {
    return {
      npcGreeting: 'People acknowledge you with polite nods.',
      shopPriceModifier: 0,
      questAvailability: 'all',
      canRest: true,
      guardsHostile: false,
      specialDialogueUnlocked: []
    };
  }
  if (reputation >= -20) {
    return {
      npcGreeting: 'Strangers eye you with cautious indifference.',
      shopPriceModifier: 0,
      questAvailability: 'all',
      canRest: true,
      guardsHostile: false,
      specialDialogueUnlocked: []
    };
  }
  if (reputation >= -50) {
    return {
      npcGreeting: 'Whispers follow in your wake. Some cross to the other side of the street.',
      shopPriceModifier: 15,
      questAvailability: 'positive_only',
      canRest: true,
      guardsHostile: false,
      specialDialogueUnlocked: ['criminal_contacts']
    };
  }
  if (reputation >= -80) {
    return {
      npcGreeting: 'Mothers pull their children inside. Guards watch you with hands on weapons.',
      shopPriceModifier: 30,
      questAvailability: 'negative_only',
      canRest: false,
      guardsHostile: false,
      specialDialogueUnlocked: ['underworld_access', 'intimidation_options']
    };
  }
  return {
    npcGreeting: 'Your presence causes panic. The streets empty as word of your arrival spreads.',
    shopPriceModifier: 50,
    questAvailability: 'none',
    canRest: false,
    guardsHostile: true,
    specialDialogueUnlocked: ['villain_recognition', 'fear_exploitation']
  };
}

// ============================================================================
// REPUTATION MODIFICATION FUNCTIONS
// ============================================================================

export function createInitialWorldReputation(): WorldReputation {
  return {
    locations: {},
    factions: {},
    globalFame: 0,
    globalInfamy: 0
  };
}

export function modifyLocationReputation(
  world: WorldReputation,
  locationId: string,
  locationName: string,
  amount: number,
  reason: string,
  trait?: ReputationTrait,
  currentTick: number = 0
): WorldReputation {
  const existing = world.locations[locationId] || {
    locationId,
    locationName,
    reputation: 0,
    traits: [],
    lastVisit: currentTick,
    significantEvents: []
  };
  
  const newReputation = Math.max(-100, Math.min(100, existing.reputation + amount));
  
  const event: ReputationEvent = {
    tick: currentTick,
    action: reason,
    impact: amount,
    trait
  };
  
  // Add trait if significant action
  const newTraits = [...existing.traits];
  if (trait && !newTraits.includes(trait) && Math.abs(amount) >= 10) {
    newTraits.push(trait);
  }
  
  // Update global fame/infamy
  let newFame = world.globalFame;
  let newInfamy = world.globalInfamy;
  if (amount >= 15) {
    newFame = Math.min(100, world.globalFame + Math.floor(amount / 3));
  } else if (amount <= -15) {
    newInfamy = Math.min(100, world.globalInfamy + Math.floor(Math.abs(amount) / 3));
  }
  
  const updatedWorld = {
    ...world,
    locations: {
      ...world.locations,
      [locationId]: {
        ...existing,
        reputation: newReputation,
        traits: newTraits,
        lastVisit: currentTick,
        significantEvents: [...existing.significantEvents.slice(-9), event]
      }
    },
    globalFame: newFame,
    globalInfamy: newInfamy
  };

  // Emit EventBus event for play statistics tracking
  eventBus.emit({
    type: 'REPUTATION_CHANGED',
    tick: currentTick,
    source: 'reputationSystem',
    priority: 'normal',
    data: {
      entity: 'player',
      locationId,
      previousValue: existing.reputation,
      newValue: newReputation,
      reason,
    },
  } as any);

  return updatedWorld;
}

export function modifyFactionReputation(
  world: WorldReputation,
  factionId: string,
  factionName: string,
  amount: number,
  trait?: ReputationTrait
): WorldReputation {
  const existing = world.factions[factionId] || {
    factionId,
    factionName,
    reputation: 0,
    isHostile: false,
    traits: []
  };
  
  const newReputation = Math.max(-100, Math.min(100, existing.reputation + amount));
  const isNowHostile = newReputation <= -60;
  
  const newTraits = [...existing.traits];
  if (trait && !newTraits.includes(trait)) {
    newTraits.push(trait);
  }
  
  const updatedWorld = {
    ...world,
    factions: {
      ...world.factions,
      [factionId]: {
        ...existing,
        reputation: newReputation,
        isHostile: isNowHostile,
        traits: newTraits
      }
    }
  };

  // Emit EventBus event for play statistics tracking
  eventBus.emit({
    type: 'FACTION_REPUTATION_CHANGED',
    tick: 0,
    source: 'reputationSystem',
    priority: 'normal',
    data: {
      entity: 'player',
      factionId,
      previousValue: existing.reputation,
      newValue: newReputation,
    },
  } as any);

  return updatedWorld;
}

// ============================================================================
// ACTION TO REPUTATION MAPPING
// ============================================================================

interface ReputationActionEffect {
  amount: number;
  trait?: ReputationTrait;
  affectsFaction?: string;
}

const ACTION_REPUTATION_EFFECTS: Record<string, ReputationActionEffect> = {
  // Positive actions
  'helped_citizen': { amount: 5, trait: 'helpful' },
  'saved_town': { amount: 30, trait: 'heroic' },
  'donated_gold': { amount: 10, trait: 'generous' },
  'defended_innocent': { amount: 15, trait: 'protector' },
  'completed_quest': { amount: 10 },
  'healed_sick': { amount: 8, trait: 'helpful' },
  'shared_resources': { amount: 5, trait: 'generous' },
  
  // Negative actions
  'stole': { amount: -15, trait: 'thief' },
  'murdered': { amount: -40, trait: 'villainous' },
  'destroyed_property': { amount: -20, trait: 'destroyer' },
  'threatened': { amount: -10, trait: 'dangerous' },
  'lied': { amount: -5, trait: 'untrustworthy' },
  'abandoned_quest': { amount: -8 },
  'extorted': { amount: -15, trait: 'cruel' },
  'betrayed_trust': { amount: -25, trait: 'untrustworthy' }
};

export function processActionForReputation(
  world: WorldReputation,
  actionType: string,
  locationId: string,
  locationName: string,
  currentTick: number
): WorldReputation {
  const effect = ACTION_REPUTATION_EFFECTS[actionType];
  if (!effect) return world;
  
  return modifyLocationReputation(
    world,
    locationId,
    locationName,
    effect.amount,
    actionType,
    effect.trait,
    currentTick
  );
}

// ============================================================================
// NARRATIVE FORMATTING
// ============================================================================

export function formatReputationForAI(world: WorldReputation, currentLocationId?: string): string {
  const lines: string[] = ['[WORLD REPUTATION CONTEXT]'];
  
  // Global standing
  if (world.globalFame > 20 || world.globalInfamy > 20) {
    lines.push(`Global Standing: ${world.globalFame > world.globalInfamy ? 'Famous' : 'Infamous'} (Fame: ${world.globalFame}, Infamy: ${world.globalInfamy})`);
  }
  
  // Current location
  if (currentLocationId && world.locations[currentLocationId]) {
    const loc = world.locations[currentLocationId];
    const level = getReputationLevel(loc.reputation);
    const effects = getReputationEffects(loc.reputation);
    
    lines.push(`\nCurrent Location (${loc.locationName}):`);
    lines.push(`- Standing: ${level.label} (${loc.reputation})`);
    lines.push(`- ${effects.npcGreeting}`);
    if (loc.traits.length > 0) {
      lines.push(`- Known for being: ${loc.traits.join(', ')}`);
    }
    if (effects.guardsHostile) {
      lines.push(`- GUARDS ARE HOSTILE ON SIGHT`);
    }
  }
  
  // Notable faction standings
  const hostileFactions = Object.values(world.factions).filter(f => f.isHostile);
  if (hostileFactions.length > 0) {
    lines.push(`\nHostile Factions: ${hostileFactions.map(f => f.factionName).join(', ')}`);
  }
  
  lines.push(`\nNPCs should react to the player's reputation. Modify dialogue, prices, and available options accordingly.`);
  
  return lines.join('\n');
}

// ============================================================================
// GOSSIP SPREADING (reputation bleeds to nearby locations)
// ============================================================================

export function spreadGossip(
  world: WorldReputation,
  fromLocationId: string,
  toLocationId: string,
  toLocationName: string,
  currentTick: number
): WorldReputation {
  const source = world.locations[fromLocationId];
  if (!source || Math.abs(source.reputation) < 30) return world;
  
  // Gossip spreads at reduced intensity
  const gossipAmount = Math.floor(source.reputation * 0.3);
  const strongestTrait = source.traits[source.traits.length - 1];
  
  return modifyLocationReputation(
    world,
    toLocationId,
    toLocationName,
    gossipAmount,
    `gossip_from_${source.locationName}`,
    strongestTrait,
    currentTick
  );
}
