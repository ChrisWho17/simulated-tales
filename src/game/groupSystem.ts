// Group & Faction Intelligence - Phase 4
// Groups as collective entities with emergent behavior

import { NPC, EmotionalState } from '@/types/game';

// ============= GROUP AS NPC (4.1) =============

export interface GroupIdentity {
  originMyth: string;        // Why we exist
  sharedPride: string;       // What makes us better
  sharedShame: string;       // What we hide or deny
  sacredBeliefs: string[];   // What must not be questioned
  tabooActions: string[];    // What marks you as outsider
}

export interface GroupNeed {
  type: 'survival' | 'cohesion' | 'legitimacy' | 'control' | 'meaning';
  satisfaction: number;
  priority: number;
  description: string;
}

export interface GroupThreatModel {
  fears: string[];
  panicTriggers: string[];
  defaultResponse: 'withdraw' | 'expel' | 'attack' | 'appease' | 'deny';
}

export type GroupClimate = 
  | 'calm'
  | 'tense'
  | 'paranoid'
  | 'hopeful'
  | 'desperate'
  | 'aggressive'
  | 'resigned';

export interface Group {
  id: string;
  name: string;
  description: string;
  
  identity: GroupIdentity;
  needs: GroupNeed[];
  threatModel: GroupThreatModel;
  
  emotionalClimate: {
    current: GroupClimate;
    stability: number; // 0-100, how easily it shifts
    pressureLevel: number; // 0-100
  };
  
  members: string[]; // NPC IDs
  leadership: string[]; // NPC IDs with authority
  territory: string[]; // Location IDs
  
  // Reputation with other groups
  groupRelations: Record<string, { trust: number; tension: number }>;
}

// The town as a group entity
export const townGroup: Group = {
  id: 'group_town',
  name: 'Settlementfolk',
  description: 'The people of this small settlement, bound by necessity and suspicion of outsiders.',
  
  identity: {
    originMyth: 'We survived when others fell. We endure.',
    sharedPride: 'We take care of our own. We remember.',
    sharedShame: 'We let the old families die out. We forgot the old ways.',
    sacredBeliefs: [
      'Hospitality to travelers, but trust is earned',
      'The guard keeps us safe',
      'Hard work is virtue',
    ],
    tabooActions: [
      'Stealing from neighbors',
      'Breaking sworn word',
      'Harming children',
      'Disrespecting the dead',
    ],
  },
  
  needs: [
    { type: 'survival', satisfaction: 65, priority: 1, description: 'Enough food, shelter, defense' },
    { type: 'cohesion', satisfaction: 55, priority: 2, description: 'Internal unity, shared purpose' },
    { type: 'legitimacy', satisfaction: 70, priority: 3, description: 'Recognition, not being erased' },
    { type: 'control', satisfaction: 50, priority: 4, description: 'Order within, defense without' },
    { type: 'meaning', satisfaction: 45, priority: 5, description: 'Why we matter, destiny' },
  ],
  
  threatModel: {
    fears: ['raiders', 'plague', 'famine', 'authorities from the city', 'internal betrayal'],
    panicTriggers: ['murder', 'fire', 'soldiers approaching', 'food shortage announced'],
    defaultResponse: 'withdraw',
  },
  
  emotionalClimate: {
    current: 'tense',
    stability: 60,
    pressureLevel: 35,
  },
  
  members: ['npc_martha', 'npc_thomas', 'npc_guard_james', 'npc_old_edgar'],
  leadership: ['npc_guard_james'],
  territory: ['tavern_main', 'tavern_kitchen', 'tavern_upstairs', 'town_square', 'market', 'alley'],
  
  groupRelations: {},
};

// ============= GROUP SPEECH CHANNELS (4.2) =============

export interface GroupSpeechSignals {
  ambientChatter: string[];
  prices: 'low' | 'fair' | 'inflated' | 'gouging';
  serviceQuality: 'welcoming' | 'neutral' | 'reluctant' | 'hostile';
  rumors: string[];
  publicRituals: string[];
  silences: string[]; // Topics NOT discussed
}

export function getGroupSpeechSignals(group: Group): GroupSpeechSignals {
  const climate = group.emotionalClimate.current;
  
  const chatterByClimate: Record<GroupClimate, string[]> = {
    calm: [
      'Friendly greetings exchanged between neighbors.',
      'Children play near the fountain.',
      'Merchants call out their wares cheerfully.',
    ],
    tense: [
      'Conversations are hushed, guarded.',
      'People glance at strangers with suspicion.',
      'Laughter feels forced, cut short.',
    ],
    paranoid: [
      'Whispers stop when you approach.',
      'Eyes follow your every move.',
      'Doors close as you pass.',
    ],
    hopeful: [
      'People smile more readily.',
      'Plans for the future are discussed openly.',
      'There is energy in the air.',
    ],
    desperate: [
      'Hollow eyes and thin faces.',
      'Begging is common.',
      'Arguments break out over small things.',
    ],
    aggressive: [
      'Hostility simmers just below the surface.',
      'Strangers are challenged.',
      'Groups form, watching, waiting.',
    ],
    resigned: [
      'Silence hangs heavy.',
      'People go through motions without energy.',
      'Why bother is the unspoken refrain.',
    ],
  };
  
  const pricesByClimate: Record<GroupClimate, GroupSpeechSignals['prices']> = {
    calm: 'fair',
    tense: 'inflated',
    paranoid: 'inflated',
    hopeful: 'fair',
    desperate: 'gouging',
    aggressive: 'inflated',
    resigned: 'fair',
  };
  
  const serviceByClimate: Record<GroupClimate, GroupSpeechSignals['serviceQuality']> = {
    calm: 'welcoming',
    tense: 'neutral',
    paranoid: 'reluctant',
    hopeful: 'welcoming',
    desperate: 'reluctant',
    aggressive: 'hostile',
    resigned: 'neutral',
  };
  
  return {
    ambientChatter: chatterByClimate[climate],
    prices: pricesByClimate[climate],
    serviceQuality: serviceByClimate[climate],
    rumors: [], // Populated dynamically
    publicRituals: ['Evening prayer at the square', 'Market day traditions'],
    silences: group.identity.sharedShame ? [group.identity.sharedShame] : [],
  };
}

export function applyGroupInfluence(npc: NPC, group: Group): {
  moodModifier: number;
  trustModifier: number;
  behaviorHint: string;
} {
  const climate = group.emotionalClimate.current;
  const pressure = group.emotionalClimate.pressureLevel;
  
  // How much the NPC conforms to group pressure
  const conformity = npc.meta.traits.includes('protective') ? 0.8 :
                     npc.meta.traits.includes('secretive') ? 0.4 :
                     npc.meta.traits.includes('suspicious') ? 0.7 : 0.6;
  
  let moodModifier = 0;
  let trustModifier = 0;
  let behaviorHint = '';
  
  switch (climate) {
    case 'calm':
      moodModifier = 5 * conformity;
      trustModifier = 0;
      behaviorHint = 'Acts naturally';
      break;
    case 'tense':
      moodModifier = -10 * conformity;
      trustModifier = -10 * conformity;
      behaviorHint = 'More guarded than usual';
      break;
    case 'paranoid':
      moodModifier = -20 * conformity;
      trustModifier = -25 * conformity;
      behaviorHint = 'Suspicious of outsiders, conforming to group fear';
      break;
    case 'hopeful':
      moodModifier = 15 * conformity;
      trustModifier = 10 * conformity;
      behaviorHint = 'More open and friendly';
      break;
    case 'desperate':
      moodModifier = -25 * conformity;
      trustModifier = -15 * conformity;
      behaviorHint = 'May act out of desperation';
      break;
    case 'aggressive':
      moodModifier = -15 * conformity;
      trustModifier = -30 * conformity;
      behaviorHint = 'Hostile to perceived threats';
      break;
    case 'resigned':
      moodModifier = -10 * conformity;
      trustModifier = -5 * conformity;
      behaviorHint = 'Apathetic, going through motions';
      break;
  }
  
  // Higher pressure amplifies group influence
  const pressureMultiplier = 1 + (pressure / 100) * 0.5;
  
  return {
    moodModifier: Math.round(moodModifier * pressureMultiplier),
    trustModifier: Math.round(trustModifier * pressureMultiplier),
    behaviorHint,
  };
}

// ============= RUMOR ENGINE (4.3) =============

export interface Rumor {
  id: string;
  originTick: number;
  originEvent: string;
  currentVersion: string;
  truthValue: number; // 0-100
  spreadCount: number;
  carriers: string[];
  emotionalCharge: 'fear' | 'hope' | 'anger' | 'shame' | 'excitement';
  mutations: string[];
  suppressedBy: string[]; // Authority figures trying to stop it
}

export function createRumor(
  event: string,
  emotionalCharge: Rumor['emotionalCharge'],
  truthValue: number,
  originNPC: string,
  tick: number
): Rumor {
  return {
    id: `rumor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    originTick: tick,
    originEvent: event,
    currentVersion: event,
    truthValue,
    spreadCount: 0,
    carriers: [originNPC],
    emotionalCharge,
    mutations: [],
    suppressedBy: [],
  };
}

export function spreadRumor(
  rumor: Rumor,
  fromNPC: NPC,
  toNPC: NPC,
  tick: number
): Rumor {
  // Check if toNPC already knows
  if (rumor.carriers.includes(toNPC.id)) {
    return rumor;
  }
  
  // Mutation chance based on gossip trait and reliability
  const mutationChance = fromNPC.meta.traits.includes('gossip') ? 0.4 :
                         fromNPC.meta.traits.includes('honest') ? 0.1 : 0.25;
  
  let newVersion = rumor.currentVersion;
  const mutations = [...rumor.mutations];
  
  if (Math.random() < mutationChance) {
    const mutationTypes = [
      'exaggerated',
      'detail_changed',
      'source_attributed_wrong',
      'motive_added',
      'consequence_predicted',
    ];
    const mutation = mutationTypes[Math.floor(Math.random() * mutationTypes.length)];
    mutations.push(`${mutation} by ${fromNPC.meta.name}`);
    
    // Reduce truth value with mutation
    const truthReduction = 5 + Math.random() * 10;
    
    return {
      ...rumor,
      currentVersion: newVersion,
      truthValue: Math.max(0, rumor.truthValue - truthReduction),
      spreadCount: rumor.spreadCount + 1,
      carriers: [...rumor.carriers, toNPC.id],
      mutations,
    };
  }
  
  return {
    ...rumor,
    spreadCount: rumor.spreadCount + 1,
    carriers: [...rumor.carriers, toNPC.id],
  };
}

export function processRumorSpread(
  rumors: Rumor[],
  npcs: Record<string, NPC>,
  tick: number
): Rumor[] {
  return rumors.map(rumor => {
    // Each tick, carriers might spread to NPCs in same location
    for (const carrierId of rumor.carriers) {
      const carrier = npcs[carrierId];
      if (!carrier || !carrier.meta.traits.includes('gossip')) continue;
      
      // 30% chance to gossip each tick
      if (Math.random() > 0.3) continue;
      
      // Find NPCs in same location
      const nearby = Object.values(npcs).filter(
        npc => npc.id !== carrierId && npc.currentLocation === carrier.currentLocation
      );
      
      if (nearby.length > 0) {
        const target = nearby[Math.floor(Math.random() * nearby.length)];
        return spreadRumor(rumor, carrier, target, tick);
      }
    }
    return rumor;
  });
}

// ============= REPUTATION VECTORS (4.4) =============

export interface ReputationVector {
  reliability: ReputationEvidence[];    // Do they follow through?
  predictability: ReputationEvidence[]; // Do they behave consistently?
  threat: ReputationEvidence[];         // Do people get hurt around them?
  status: ReputationEvidence[];         // Do powerful people respect them?
  stigma: ReputationEvidence[];         // Are they associated with danger/shame?
  intimacy: ReputationEvidence[];       // Do they form real connections?
}

export interface ReputationEvidence {
  type: 'witnessed' | 'rumor' | 'association';
  description: string;
  weight: number; // -100 to 100
  tick: number;
  source: string;
}

export function createReputationVector(): ReputationVector {
  return {
    reliability: [],
    predictability: [],
    threat: [],
    status: [],
    stigma: [],
    intimacy: [],
  };
}

export function addReputationEvidence(
  vector: ReputationVector,
  category: keyof ReputationVector,
  evidence: ReputationEvidence
): ReputationVector {
  return {
    ...vector,
    [category]: [...vector[category], evidence],
  };
}

export function evaluateReputation(
  vector: ReputationVector,
  category: keyof ReputationVector,
  currentTick: number
): number {
  const evidence = vector[category];
  if (evidence.length === 0) return 0;
  
  // Weight recent evidence more heavily
  let weightedSum = 0;
  let totalWeight = 0;
  
  for (const e of evidence) {
    const age = currentTick - e.tick;
    const recencyMultiplier = Math.max(0.1, 1 - age / 1000);
    const typeMultiplier = e.type === 'witnessed' ? 1.5 :
                           e.type === 'association' ? 0.5 : 1;
    
    const effectiveWeight = Math.abs(e.weight) * recencyMultiplier * typeMultiplier;
    weightedSum += e.weight * recencyMultiplier * typeMultiplier;
    totalWeight += effectiveWeight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight * 50 : 0; // Scale to -50 to 50
}

// ============= PRESSURE WAVES (4.5) =============

export type SocialRole = 
  | 'AMPLIFIER'  // Spreads emotion/rumor faster, adds intensity
  | 'DAMPENER'   // Calms others, rationalizes
  | 'REFLECTOR'  // Echoes pressure back at outsiders
  | 'HUB';       // Connected to many, spreads widely

export function getNPCSocialRole(npc: NPC): SocialRole {
  if (npc.meta.traits.includes('gossip')) return 'AMPLIFIER';
  if (npc.meta.traits.includes('calm')) return 'DAMPENER';
  if (npc.meta.traits.includes('suspicious')) return 'REFLECTOR';
  if (npc.meta.traits.includes('friendly')) return 'HUB';
  return 'REFLECTOR'; // Default
}

export type CascadeType = 
  | 'fear'     // Rapid paranoia spread
  | 'hope'     // Sudden cooperation
  | 'blame'    // Scapegoating emerges
  | 'silence'  // Information shutdown
  | 'violence'; // Mob formation

export interface PressureWave {
  id: string;
  type: CascadeType;
  originTick: number;
  originLocation: string;
  intensity: number; // 0-100
  affectedNPCs: string[];
  dissipation: number; // How much it weakens per tick
}

export function createPressureWave(
  type: CascadeType,
  intensity: number,
  location: string,
  tick: number
): PressureWave {
  return {
    id: `wave_${Date.now()}`,
    type,
    originTick: tick,
    originLocation: location,
    intensity,
    affectedNPCs: [],
    dissipation: type === 'violence' ? 5 : type === 'fear' ? 3 : 2,
  };
}

export function propagatePressureWave(
  wave: PressureWave,
  npcs: Record<string, NPC>,
  locations: Record<string, { connectedLocations: string[] }>
): PressureWave {
  if (wave.intensity <= 0) return wave;
  
  // Find NPCs in affected locations
  const affectedLocations = new Set([wave.originLocation]);
  
  // Add connected locations at reduced intensity
  const origin = locations[wave.originLocation];
  if (origin) {
    for (const connected of origin.connectedLocations) {
      if (wave.intensity > 30) { // Only spread to neighbors if strong
        affectedLocations.add(connected);
      }
    }
  }
  
  const newAffected: string[] = [];
  
  for (const npc of Object.values(npcs)) {
    if (affectedLocations.has(npc.currentLocation) && !wave.affectedNPCs.includes(npc.id)) {
      const role = getNPCSocialRole(npc);
      
      // Role affects how they're impacted
      switch (role) {
        case 'AMPLIFIER':
          newAffected.push(npc.id);
          // Amplifiers don't reduce wave intensity
          break;
        case 'DAMPENER':
          // Dampeners reduce wave intensity
          wave.intensity -= 5;
          newAffected.push(npc.id);
          break;
        case 'REFLECTOR':
        case 'HUB':
          newAffected.push(npc.id);
          break;
      }
    }
  }
  
  return {
    ...wave,
    affectedNPCs: [...wave.affectedNPCs, ...newAffected],
    intensity: Math.max(0, wave.intensity - wave.dissipation),
  };
}

export function checkCascadeThreshold(group: Group): CascadeType | null {
  const pressure = group.emotionalClimate.pressureLevel;
  
  if (pressure < 50) return null;
  
  // Different thresholds for different cascade types
  if (pressure > 90) {
    return group.emotionalClimate.current === 'aggressive' ? 'violence' : 'fear';
  }
  if (pressure > 75) {
    return group.emotionalClimate.current === 'paranoid' ? 'blame' : 
           group.emotionalClimate.current === 'tense' ? 'silence' : null;
  }
  if (pressure > 60 && group.emotionalClimate.current === 'hopeful') {
    return 'hope';
  }
  
  return null;
}

export function applyWaveToNPC(npc: NPC, wave: PressureWave): NPC {
  const stressChange = Math.round(wave.intensity * 0.2);
  
  let moodChange = 0;
  switch (wave.type) {
    case 'fear':
      moodChange = -stressChange;
      break;
    case 'hope':
      moodChange = stressChange * 0.5;
      break;
    case 'blame':
      moodChange = -stressChange * 0.5;
      break;
    case 'violence':
      moodChange = -stressChange;
      break;
    case 'silence':
      moodChange = -stressChange * 0.3;
      break;
  }
  
  return {
    ...npc,
    stressLevel: Math.min(100, npc.stressLevel + stressChange),
    meta: {
      ...npc.meta,
      stats: {
        ...npc.meta.stats,
        mood: Math.max(0, Math.min(100, npc.meta.stats.mood + moodChange)),
      },
    },
  };
}
