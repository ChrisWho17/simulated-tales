// ============================================================================
// COMPANION CONFLICT SYSTEM - Companions with opposing traits disagree
// ============================================================================

import { CompanionState, PersonalityTrait, PlayerActionType } from './companionSystem';
import { eventBus } from './eventBus';

// ============================================================================
// TYPES
// ============================================================================

export interface TraitConflict {
  trait1: PersonalityTrait;
  trait2: PersonalityTrait;
  severity: 'mild' | 'moderate' | 'severe';
  conflictTopics: string[];
}

export interface CompanionDisagreement {
  id: string;
  timestamp: number;
  companion1: {
    id: string;
    name: string;
    position: string; // What they advocate for
    trait: PersonalityTrait;
  };
  companion2: {
    id: string;
    name: string;
    position: string; // What they advocate for
    trait: PersonalityTrait;
  };
  topic: string;
  severity: 'mild' | 'moderate' | 'severe';
  resolved: boolean;
  resolution?: 'sided_with_1' | 'sided_with_2' | 'compromised' | 'ignored';
  loyaltyConsequences?: {
    companion1Change: number;
    companion2Change: number;
  };
}

export interface ConflictDialogue {
  initiator: string;
  response: string;
  playerOptions: PlayerConflictOption[];
}

export interface PlayerConflictOption {
  id: string;
  text: string;
  favors: 'companion1' | 'companion2' | 'neither' | 'both';
  skillCheck?: {
    skill: string;
    difficulty: number;
  };
  consequence: {
    companion1Loyalty: number;
    companion2Loyalty: number;
    narrativeResult: string;
  };
}

// ============================================================================
// TRAIT CONFLICT DEFINITIONS
// ============================================================================

export const TRAIT_CONFLICTS: TraitConflict[] = [
  // Honor vs Pragmatism
  { trait1: 'honorable', trait2: 'pragmatic', severity: 'moderate', conflictTopics: ['deception', 'theft', 'shortcuts'] },
  { trait1: 'honorable', trait2: 'ruthless', severity: 'severe', conflictTopics: ['violence', 'cruelty', 'betrayal'] },
  
  // Kindness vs Cruelty
  { trait1: 'kind', trait2: 'cruel', severity: 'severe', conflictTopics: ['mercy', 'punishment', 'treatment'] },
  { trait1: 'kind', trait2: 'greedy', severity: 'moderate', conflictTopics: ['charity', 'sharing', 'helping'] },
  
  // Bravery vs Cowardice  
  { trait1: 'brave', trait2: 'cowardly', severity: 'moderate', conflictTopics: ['danger', 'risk', 'confrontation'] },
  
  // Loyalty vs Treachery
  { trait1: 'loyal', trait2: 'treacherous', severity: 'severe', conflictTopics: ['trust', 'promises', 'allies'] },
  
  // Generosity vs Greed
  { trait1: 'generous', trait2: 'greedy', severity: 'moderate', conflictTopics: ['loot', 'rewards', 'payment'] },
  
  // Spiritual vs Skeptical
  { trait1: 'spiritual', trait2: 'skeptical', severity: 'mild', conflictTopics: ['faith', 'omens', 'rituals'] },
  
  // Vengeful vs Forgiving
  { trait1: 'vengeful', trait2: 'forgiving', severity: 'moderate', conflictTopics: ['enemies', 'grudges', 'redemption'] },
  
  // Ambitious vs Humble
  { trait1: 'ambitious', trait2: 'humble', severity: 'mild', conflictTopics: ['power', 'recognition', 'leadership'] },
];

// ============================================================================
// CONFLICT DIALOGUE TEMPLATES
// ============================================================================

const CONFLICT_DIALOGUES: Record<string, {
  trait1Statements: string[];
  trait2Statements: string[];
}> = {
  'honorable_vs_pragmatic': {
    trait1Statements: [
      "There's a right way to do things, and this isn't it.",
      "If we compromise our principles, what's the point?",
      "Honor isn't just for show. It's who we are."
    ],
    trait2Statements: [
      "Honor doesn't fill empty bellies or win wars.",
      "The ends justify the means. Sometimes.",
      "Being practical isn't the same as being evil."
    ]
  },
  'honorable_vs_ruthless': {
    trait1Statements: [
      "You can't just kill everyone who inconveniences you!",
      "There are lines we don't cross. Period.",
      "We're supposed to be better than this."
    ],
    trait2Statements: [
      "Mercy is a luxury we can't afford.",
      "Enemies don't stay down unless you put them down.",
      "Your 'honor' will get us all killed."
    ]
  },
  'kind_vs_cruel': {
    trait1Statements: [
      "They're people too. Show some compassion!",
      "Cruelty begets cruelty. It never ends well.",
      "We can win without becoming monsters."
    ],
    trait2Statements: [
      "Kindness is weakness. They'll exploit it.",
      "Fear is an effective motivator. Don't pretend otherwise.",
      "The world is cruel. I'm just being honest about it."
    ]
  },
  'brave_vs_cowardly': {
    trait1Statements: [
      "We can't run from every fight!",
      "Sometimes you have to stand and face the danger.",
      "Cowardice won't save you forever."
    ],
    trait2Statements: [
      "Living to fight another day isn't cowardice!",
      "I call it tactical retreating, not running.",
      "Dead heroes don't save anyone."
    ]
  },
  'generous_vs_greedy': {
    trait1Statements: [
      "We have more than we need. Share a little.",
      "Gold means nothing if everyone around us suffers.",
      "Generosity builds allies. Greed makes enemies."
    ],
    trait2Statements: [
      "That's OUR loot. We earned it.",
      "Charity starts at home. Our home.",
      "I've seen where generosity leads. Poverty."
    ]
  },
  'vengeful_vs_forgiving': {
    trait1Statements: [
      "After what they did? Never. They pay.",
      "Forgiveness is for priests. I prefer justice.",
      "Let it go? Would you let it go if it was YOUR family?"
    ],
    trait2Statements: [
      "Revenge poisons the soul. Let it go.",
      "Breaking the cycle starts with us.",
      "Holding onto hate only hurts yourself."
    ]
  }
};

// ============================================================================
// CONFLICT DETECTION & GENERATION
// ============================================================================

/**
 * Check if two companions have conflicting traits
 */
export function findTraitConflicts(
  companion1: CompanionState,
  companion2: CompanionState
): TraitConflict[] {
  const conflicts: TraitConflict[] = [];
  
  for (const conflict of TRAIT_CONFLICTS) {
    const c1HasTrait1 = companion1.personality.traits.includes(conflict.trait1);
    const c1HasTrait2 = companion1.personality.traits.includes(conflict.trait2);
    const c2HasTrait1 = companion2.personality.traits.includes(conflict.trait1);
    const c2HasTrait2 = companion2.personality.traits.includes(conflict.trait2);
    
    // Check if they have opposing traits
    if ((c1HasTrait1 && c2HasTrait2) || (c1HasTrait2 && c2HasTrait1)) {
      conflicts.push(conflict);
    }
  }
  
  return conflicts;
}

/**
 * Check if a player action should trigger a companion conflict
 */
export function shouldTriggerConflict(
  companions: CompanionState[],
  playerAction: PlayerActionType,
  context?: string
): { shouldTrigger: boolean; companions: [CompanionState, CompanionState] | null; conflict: TraitConflict | null } {
  
  if (companions.length < 2) {
    return { shouldTrigger: false, companions: null, conflict: null };
  }
  
  // Map actions to conflict topics
  const actionToTopic: Record<PlayerActionType, string[]> = {
    combat_kill: ['violence', 'mercy', 'cruelty'],
    combat_spare: ['mercy', 'redemption', 'weakness'],
    theft: ['deception', 'theft', 'shortcuts'],
    charity: ['charity', 'sharing', 'generosity'],
    lie: ['deception', 'trust', 'shortcuts'],
    truth: ['trust', 'honor'],
    violence: ['violence', 'cruelty'],
    diplomacy: ['shortcuts', 'pragmatism'],
    betrayal: ['trust', 'promises', 'betrayal'],
    loyalty: ['trust', 'promises'],
    cowardice: ['danger', 'risk', 'cowardice'],
    bravery: ['danger', 'risk', 'bravery'],
    romance_flirt: [],
    romance_reject: [],
    insult: ['cruelty'],
    compliment: [],
    greed: ['loot', 'rewards', 'greed'],
    sacrifice: ['sharing', 'generosity'],
    mercy: ['mercy', 'forgiveness', 'redemption'],
    cruelty: ['cruelty', 'punishment', 'violence']
  };
  
  const relevantTopics = actionToTopic[playerAction] || [];
  
  // Check each pair of companions
  for (let i = 0; i < companions.length; i++) {
    for (let j = i + 1; j < companions.length; j++) {
      const conflicts = findTraitConflicts(companions[i], companions[j]);
      
      for (const conflict of conflicts) {
        // Check if this action's topics overlap with conflict topics
        const topicOverlap = conflict.conflictTopics.some(topic => 
          relevantTopics.includes(topic)
        );
        
        if (topicOverlap) {
          // Random chance based on severity (don't trigger every time)
          const triggerChance = conflict.severity === 'severe' ? 0.7 : 
                               conflict.severity === 'moderate' ? 0.4 : 0.2;
          
          if (Math.random() < triggerChance) {
            return { 
              shouldTrigger: true, 
              companions: [companions[i], companions[j]], 
              conflict 
            };
          }
        }
      }
    }
  }
  
  return { shouldTrigger: false, companions: null, conflict: null };
}

/**
 * Generate a disagreement event between two companions
 */
export function generateDisagreement(
  companion1: CompanionState,
  companion2: CompanionState,
  conflict: TraitConflict,
  triggeringAction: PlayerActionType
): CompanionDisagreement {
  // Determine which companion has which trait
  const c1HasTrait1 = companion1.personality.traits.includes(conflict.trait1);
  
  const c1Trait = c1HasTrait1 ? conflict.trait1 : conflict.trait2;
  const c2Trait = c1HasTrait1 ? conflict.trait2 : conflict.trait1;
  
  const positions = getPositionsForAction(triggeringAction, c1Trait, c2Trait);
  
  return {
    id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    companion1: {
      id: companion1.id,
      name: companion1.name,
      position: positions.trait1Position,
      trait: c1Trait
    },
    companion2: {
      id: companion2.id,
      name: companion2.name,
      position: positions.trait2Position,
      trait: c2Trait
    },
    topic: triggeringAction,
    severity: conflict.severity,
    resolved: false
  };
}

/**
 * Get position statements based on the triggering action
 */
function getPositionsForAction(
  action: PlayerActionType,
  trait1: PersonalityTrait,
  trait2: PersonalityTrait
): { trait1Position: string; trait2Position: string } {
  const actionPositions: Record<PlayerActionType, Record<string, string>> = {
    combat_kill: {
      honorable: "We should have tried to take them alive.",
      ruthless: "Dead enemies stay dead. Good riddance.",
      kind: "There had to be another way...",
      cruel: "Finally, some real action.",
      brave: "It was them or us. No regrets.",
      forgiving: "Violence should be the last resort."
    },
    combat_spare: {
      honorable: "Mercy is the mark of a true warrior.",
      ruthless: "Mercy? They'll stab us in the back!",
      kind: "Everyone deserves a second chance.",
      cruel: "Weakness. Pure weakness.",
      vengeful: "After what they did? You can't be serious!"
    },
    theft: {
      honorable: "We're not thieves!",
      pragmatic: "They won't miss it. We need it.",
      kind: "Think about who this hurts.",
      greedy: "Five-finger discount, baby!"
    },
    charity: {
      generous: "It feels good to help others.",
      greedy: "That was OUR money!",
      kind: "We made a real difference today.",
      pragmatic: "We could have used those resources."
    },
    mercy: {
      forgiving: "This is the right thing to do.",
      vengeful: "They don't deserve mercy!",
      kind: "Compassion is never wrong.",
      cruel: "Soft. This is why we keep having problems."
    },
    cruelty: {
      kind: "What is WRONG with you?!",
      cruel: "Sometimes you have to send a message.",
      honorable: "This is beneath us!",
      ruthless: "Effective, if nothing else."
    },
    lie: {
      honorable: "I can't believe you just lied!",
      pragmatic: "It was necessary.",
      loyal: "Deception breeds distrust.",
      treacherous: "Smooth. Very smooth."
    },
    truth: {
      honorable: "Honesty. As it should be.",
      pragmatic: "Sometimes a lie would have served better.",
      loyal: "Trust is built on truth.",
      cowardly: "That was risky. What if they didn't like it?"
    },
    cowardice: {
      brave: "Stand and fight!",
      cowardly: "Living is winning!",
      honorable: "This is shameful...",
      pragmatic: "Sometimes retreat is smart."
    },
    bravery: {
      brave: "That's how it's done!",
      cowardly: "You're going to get us killed!",
      honorable: "Courage in the face of danger.",
      pragmatic: "Brave, but reckless."
    },
    betrayal: {
      loyal: "How could you?!",
      treacherous: "It was inevitable.",
      honorable: "We're better than this!",
      pragmatic: "I understand, but I don't approve."
    },
    greed: {
      greedy: "More for us!",
      generous: "We should share more fairly.",
      pragmatic: "Resources are important.",
      kind: "Think about those with less."
    },
    sacrifice: {
      generous: "A noble act.",
      greedy: "What a waste!",
      kind: "Beautiful. Truly beautiful.",
      pragmatic: "Was that really necessary?"
    },
    violence: { kind: "Was that necessary?", cruel: "Finally!" },
    diplomacy: { brave: "Sometimes talk isn't enough.", pragmatic: "Smart play." },
    loyalty: { loyal: "As it should be.", treacherous: "How boring." },
    romance_flirt: { romantic: "Smooth!", pragmatic: "Focus on the mission." },
    romance_reject: { romantic: "Harsh...", pragmatic: "Good. No distractions." },
    insult: { kind: "That was mean!", cruel: "Ha! Good one." },
    compliment: { kind: "That was sweet.", pragmatic: "Flattery..." }
  };
  
  const positions = actionPositions[action] || {};
  
  return {
    trait1Position: positions[trait1] || `I feel strongly about this.`,
    trait2Position: positions[trait2] || `I disagree.`
  };
}

/**
 * Generate dialogue for a disagreement
 */
export function generateConflictDialogue(
  disagreement: CompanionDisagreement
): ConflictDialogue {
  const key = `${disagreement.companion1.trait}_vs_${disagreement.companion2.trait}`;
  const altKey = `${disagreement.companion2.trait}_vs_${disagreement.companion1.trait}`;
  
  const templates = CONFLICT_DIALOGUES[key] || CONFLICT_DIALOGUES[altKey];
  
  let initiatorStatement: string;
  let responseStatement: string;
  
  if (templates) {
    initiatorStatement = templates.trait1Statements[Math.floor(Math.random() * templates.trait1Statements.length)];
    responseStatement = templates.trait2Statements[Math.floor(Math.random() * templates.trait2Statements.length)];
  } else {
    initiatorStatement = `${disagreement.companion1.position}`;
    responseStatement = `${disagreement.companion2.position}`;
  }
  
  // Generate player options
  const loyaltyChange = disagreement.severity === 'severe' ? 15 : 
                       disagreement.severity === 'moderate' ? 10 : 5;
  
  const playerOptions: PlayerConflictOption[] = [
    {
      id: 'side_with_1',
      text: `Side with ${disagreement.companion1.name}`,
      favors: 'companion1',
      consequence: {
        companion1Loyalty: loyaltyChange,
        companion2Loyalty: -loyaltyChange,
        narrativeResult: `${disagreement.companion1.name} nods appreciatively while ${disagreement.companion2.name} looks away in frustration.`
      }
    },
    {
      id: 'side_with_2',
      text: `Side with ${disagreement.companion2.name}`,
      favors: 'companion2',
      consequence: {
        companion1Loyalty: -loyaltyChange,
        companion2Loyalty: loyaltyChange,
        narrativeResult: `${disagreement.companion2.name} seems vindicated while ${disagreement.companion1.name} falls silent.`
      }
    },
    {
      id: 'find_compromise',
      text: `Try to find middle ground`,
      favors: 'both',
      skillCheck: {
        skill: 'charisma',
        difficulty: disagreement.severity === 'severe' ? 16 : 12
      },
      consequence: {
        companion1Loyalty: Math.floor(loyaltyChange / 2),
        companion2Loyalty: Math.floor(loyaltyChange / 2),
        narrativeResult: `Both companions grudgingly accept the compromise. Not fully satisfied, but the peace holds.`
      }
    },
    {
      id: 'stay_out',
      text: `"Work it out yourselves."`,
      favors: 'neither',
      consequence: {
        companion1Loyalty: -Math.floor(loyaltyChange / 2),
        companion2Loyalty: -Math.floor(loyaltyChange / 2),
        narrativeResult: `Both companions exchange frustrated looks. Your indifference hasn't helped.`
      }
    }
  ];
  
  return {
    initiator: `**${disagreement.companion1.name}:** "${initiatorStatement}"`,
    response: `**${disagreement.companion2.name}:** "${responseStatement}"`,
    playerOptions
  };
}

/**
 * Resolve a disagreement and apply consequences
 */
export function resolveDisagreement(
  disagreement: CompanionDisagreement,
  optionId: string,
  dialogue: ConflictDialogue,
  skillCheckPassed?: boolean
): { 
  resolvedDisagreement: CompanionDisagreement; 
  narrative: string;
  loyaltyChanges: { companion1: number; companion2: number };
} {
  const option = dialogue.playerOptions.find(o => o.id === optionId);
  
  if (!option) {
    return {
      resolvedDisagreement: { ...disagreement, resolved: true },
      narrative: 'The argument fades without resolution.',
      loyaltyChanges: { companion1: 0, companion2: 0 }
    };
  }
  
  let loyaltyChanges = { ...option.consequence };
  let narrative = option.consequence.narrativeResult;
  
  // Handle skill check for compromise
  if (option.skillCheck && skillCheckPassed === false) {
    loyaltyChanges = {
      companion1Loyalty: -5,
      companion2Loyalty: -5,
      narrativeResult: "Your attempt at mediation falls flat. Both companions look disappointed."
    };
    narrative = loyaltyChanges.narrativeResult;
  }
  
  const resolution: 'sided_with_1' | 'sided_with_2' | 'compromised' | 'ignored' = 
    optionId === 'side_with_1' ? 'sided_with_1' :
    optionId === 'side_with_2' ? 'sided_with_2' :
    optionId === 'find_compromise' ? 'compromised' : 'ignored';
  
  const resolvedDisagreement: CompanionDisagreement = {
    ...disagreement,
    resolved: true,
    resolution,
    loyaltyConsequences: {
      companion1Change: loyaltyChanges.companion1Loyalty,
      companion2Change: loyaltyChanges.companion2Loyalty
    }
  };
  
  // Emit event
  eventBus.emit({
    type: 'COMPANION_CONFLICT_RESOLVED',
    tick: 0,
    source: 'companionConflictSystem',
    priority: 'normal',
    data: { disagreement: resolvedDisagreement, resolution }
  } as any);
  
  return {
    resolvedDisagreement,
    narrative,
    loyaltyChanges: {
      companion1: loyaltyChanges.companion1Loyalty,
      companion2: loyaltyChanges.companion2Loyalty
    }
  };
}

// ============================================================================
// CONFLICT STATE MANAGEMENT
// ============================================================================

export interface CompanionConflictState {
  activeDisagreement: CompanionDisagreement | null;
  pastDisagreements: CompanionDisagreement[];
  relationshipTension: Record<string, number>; // pairId -> tension level
}

export function initializeConflictState(): CompanionConflictState {
  return {
    activeDisagreement: null,
    pastDisagreements: [],
    relationshipTension: {}
  };
}

/**
 * Get pair ID for two companions (order-independent)
 */
function getPairId(id1: string, id2: string): string {
  return [id1, id2].sort().join('_');
}

/**
 * Update tension between companions based on disagreements
 */
export function updateTension(
  state: CompanionConflictState,
  companion1Id: string,
  companion2Id: string,
  change: number
): CompanionConflictState {
  const pairId = getPairId(companion1Id, companion2Id);
  const currentTension = state.relationshipTension[pairId] || 0;
  
  return {
    ...state,
    relationshipTension: {
      ...state.relationshipTension,
      [pairId]: Math.max(0, Math.min(100, currentTension + change))
    }
  };
}

// ============================================================================
// SINGLETON MANAGER
// ============================================================================

class CompanionConflictManager {
  private state: CompanionConflictState = initializeConflictState();
  
  getState(): CompanionConflictState {
    return { ...this.state };
  }
  
  checkForConflict(companions: CompanionState[], action: PlayerActionType, context?: string) {
    return shouldTriggerConflict(companions, action, context);
  }
  
  startDisagreement(companion1: CompanionState, companion2: CompanionState, conflict: TraitConflict, action: PlayerActionType) {
    const disagreement = generateDisagreement(companion1, companion2, conflict, action);
    this.state = {
      ...this.state,
      activeDisagreement: disagreement
    };
    return disagreement;
  }
  
  getDialogue() {
    if (!this.state.activeDisagreement) return null;
    return generateConflictDialogue(this.state.activeDisagreement);
  }
  
  resolve(optionId: string, dialogue: ConflictDialogue, skillCheckPassed?: boolean) {
    if (!this.state.activeDisagreement) return null;
    
    const result = resolveDisagreement(this.state.activeDisagreement, optionId, dialogue, skillCheckPassed);
    
    // Update tension
    const pairId = getPairId(
      result.resolvedDisagreement.companion1.id,
      result.resolvedDisagreement.companion2.id
    );
    const tensionChange = result.resolvedDisagreement.resolution === 'compromised' ? -5 :
                         result.resolvedDisagreement.resolution === 'ignored' ? 10 : 5;
    
    this.state = {
      ...this.state,
      activeDisagreement: null,
      pastDisagreements: [...this.state.pastDisagreements, result.resolvedDisagreement],
      relationshipTension: {
        ...this.state.relationshipTension,
        [pairId]: Math.max(0, Math.min(100, (this.state.relationshipTension[pairId] || 0) + tensionChange))
      }
    };
    
    return result;
  }
  
  getTensionLevel(companion1Id: string, companion2Id: string): number {
    const pairId = getPairId(companion1Id, companion2Id);
    return this.state.relationshipTension[pairId] || 0;
  }
  
  loadState(saved: CompanionConflictState) {
    this.state = { ...initializeConflictState(), ...saved };
  }
  
  reset() {
    this.state = initializeConflictState();
  }
}

export const companionConflictManager = new CompanionConflictManager();
