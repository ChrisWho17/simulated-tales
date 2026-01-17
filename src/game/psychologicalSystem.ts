// Psychological Pressure Systems - Phase 3
// Stress, Trauma, PTSD, and Coping Mechanisms

import { NPC, EmotionalState } from '@/types/game';

// ============= STRESS SYSTEM (3.1) =============

export interface StressState {
  level: number;           // 0-100 current accumulated stress
  threshold: number;       // When effects start showing
  tolerance: number;       // Max before breakdown
  decayRate: number;       // How fast it drops in safety
  recentSources: StressSource[];
}

// LIMITS to prevent unbounded growth
const MAX_RECENT_SOURCES = 20;
const MAX_TRAUMA_SEEDS = 15;

export interface StressSource {
  type: StressSourceType;
  amount: number;
  tick: number;
  description: string;
}

export type StressSourceType = 
  | 'violence_witnessed'
  | 'violence_experienced'
  | 'threat_exposure'
  | 'unmet_needs'
  | 'moral_injury'
  | 'helplessness'
  | 'authority_pressure'
  | 'social_shame'
  | 'loss'
  | 'betrayal';

export const STRESS_AMOUNTS: Record<StressSourceType, number> = {
  violence_witnessed: 20,
  violence_experienced: 35,
  threat_exposure: 15,
  unmet_needs: 5,
  moral_injury: 30,
  helplessness: 20,
  authority_pressure: 10,
  social_shame: 25,
  loss: 40,
  betrayal: 35,
};

export type StressRelief = 
  | 'safety'
  | 'trust'
  | 'routine'
  | 'purpose'
  | 'rest';

export const STRESS_RELIEF_AMOUNTS: Record<StressRelief, number> = {
  safety: 10,
  trust: 8,
  routine: 5,
  purpose: 7,
  rest: 15,
};

export function addStress(current: number, source: StressSourceType, multiplier: number = 1): number {
  const amount = STRESS_AMOUNTS[source] * multiplier;
  return Math.min(100, current + amount);
}

export function relieveStress(current: number, relief: StressRelief, multiplier: number = 1): number {
  const amount = STRESS_RELIEF_AMOUNTS[relief] * multiplier;
  return Math.max(0, current - amount);
}

export function getStressTier(level: number): {
  tier: 'normal' | 'heightened' | 'strained' | 'critical' | 'breakdown';
  effects: string[];
} {
  if (level <= 25) {
    return { tier: 'normal', effects: [] };
  } else if (level <= 50) {
    return { 
      tier: 'heightened', 
      effects: ['shorter patience', 'emotional leakage in speech', 'heightened alertness'] 
    };
  } else if (level <= 75) {
    return { 
      tier: 'strained', 
      effects: ['tunnel vision', 'misinterpretation likely', 'verbal budget shifts down'] 
    };
  } else if (level <= 90) {
    return { 
      tier: 'critical', 
      effects: ['perceptual distortion possible', 'compulsive behaviors', 'fight-or-flight active'] 
    };
  } else {
    return { 
      tier: 'breakdown', 
      effects: ['breakdown imminent', 'hallucination possible', 'loss of control'] 
    };
  }
}

// ============= TRAUMA SEEDS (3.2) =============

export type TraumaSeedCategory = 
  | 'SENSORY'      // Triggered by sounds, smells, visuals
  | 'IDENTITY'     // Survivor guilt, failure, betrayal
  | 'CONTROL'      // Being trapped, ordered, restrained
  | 'ATTACHMENT'   // Losing loved ones, abandonment
  | 'REALITY_FRACTURE'; // Dissociation, time loss

export type TraumaManifestation = 
  | 'flashback'
  | 'avoidance'
  | 'hypervigilance'
  | 'numbing'
  | 'intrusion';

export interface TraumaSeed {
  id: string;
  category: TraumaSeedCategory;
  specificTrigger: string;
  severity: number; // 1-5
  manifestation: TraumaManifestation;
  lastTriggered: number; // tick
  triggerCount: number;
}

export function createTraumaSeed(
  category: TraumaSeedCategory,
  trigger: string,
  severity: number,
  manifestation: TraumaManifestation
): TraumaSeed {
  return {
    id: `trauma_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    category,
    specificTrigger: trigger,
    severity: Math.max(1, Math.min(5, severity)),
    manifestation,
    lastTriggered: 0,
    triggerCount: 0,
  };
}

// Pre-defined trauma seeds for NPCs
export const npcTraumaSeeds: Record<string, TraumaSeed[]> = {
  npc_old_edgar: [
    createTraumaSeed('ATTACHMENT', 'fallen companions', 4, 'flashback'),
    createTraumaSeed('SENSORY', 'battle sounds', 3, 'hypervigilance'),
  ],
  npc_guard_james: [
    createTraumaSeed('IDENTITY', 'failing to protect', 4, 'avoidance'),
    createTraumaSeed('ATTACHMENT', 'young women in danger', 3, 'intrusion'),
  ],
  npc_thomas: [
    createTraumaSeed('CONTROL', 'being cornered', 4, 'hypervigilance'),
    createTraumaSeed('SENSORY', 'guard uniforms', 3, 'avoidance'),
  ],
  npc_martha: [
    createTraumaSeed('ATTACHMENT', 'daughter suffering', 5, 'intrusion'),
    createTraumaSeed('IDENTITY', 'losing the tavern', 4, 'hypervigilance'),
  ],
};

export function checkTraumaTrigger(seed: TraumaSeed, stimulus: string): boolean {
  const lowerStimulus = stimulus.toLowerCase();
  const triggerWords = seed.specificTrigger.toLowerCase().split(' ');
  return triggerWords.some(word => word.length > 3 && lowerStimulus.includes(word));
}

export function rollTraumaResistance(seed: TraumaSeed, stressLevel: number, willpower: number = 50): {
  success: boolean;
  margin: number;
} {
  // Higher stress makes it harder to resist
  // Higher willpower helps
  const difficulty = seed.severity * 15 + stressLevel * 0.3;
  const roll = Math.random() * 100 + willpower * 0.5;
  
  return {
    success: roll > difficulty,
    margin: roll - difficulty,
  };
}

// ============= PTSD EPISODES (3.3) =============

export type EpisodeType = 
  | 'FLASHBACK_OVERLAY'        // Past trauma blends with present
  | 'HALLUCINATORY_SUBSTITUTION' // Neutral things appear threatening
  | 'COMPULSIVE_BEHAVIOR'      // Repetitive actions
  | 'DISSOCIATIVE_DETACHMENT'  // Flat affect, delayed reactions
  | 'COMMAND_HALLUCINATION';   // Hearing orders from absent figures

export interface PTSDEpisode {
  id: string;
  type: EpisodeType;
  severity: number; // 1-5
  duration: number; // ticks remaining
  triggerSource: string;
  perceptionFilter: PerceptionFilter;
  behaviorModifier: BehaviorModifier;
  startTick: number;
}

export interface PerceptionFilter {
  visualDistortion?: string;
  auditoryDistortion?: string;
  identitySubstitution?: Record<string, string>; // real entity -> perceived entity
  threatAmplification: number; // multiplier
}

export interface BehaviorModifier {
  actionRestrictions: string[];
  compulsiveActions: string[];
  speechModifier: 'muted' | 'fragmented' | 'aggressive' | 'dissociated' | 'normal';
  socialWithdrawal: number; // 0-100
}

export function createEpisode(
  type: EpisodeType,
  severity: number,
  triggerSource: string,
  tick: number
): PTSDEpisode {
  const baseDuration = severity * 3;
  
  const filters: Record<EpisodeType, PerceptionFilter> = {
    FLASHBACK_OVERLAY: {
      visualDistortion: 'Past scenes overlay the present',
      auditoryDistortion: 'Echoes of old sounds intrude',
      threatAmplification: 1.5,
    },
    HALLUCINATORY_SUBSTITUTION: {
      visualDistortion: 'Shadows seem to move, faces blur',
      identitySubstitution: {},
      threatAmplification: 2.0,
    },
    COMPULSIVE_BEHAVIOR: {
      threatAmplification: 1.2,
    },
    DISSOCIATIVE_DETACHMENT: {
      visualDistortion: 'Everything seems distant, unreal',
      auditoryDistortion: 'Sounds are muffled',
      threatAmplification: 0.5, // Less aware of danger
    },
    COMMAND_HALLUCINATION: {
      auditoryDistortion: 'Voices give orders that must be obeyed',
      threatAmplification: 1.3,
    },
  };
  
  const behaviors: Record<EpisodeType, BehaviorModifier> = {
    FLASHBACK_OVERLAY: {
      actionRestrictions: ['complex_social'],
      compulsiveActions: [],
      speechModifier: 'fragmented',
      socialWithdrawal: 60,
    },
    HALLUCINATORY_SUBSTITUTION: {
      actionRestrictions: ['trust_actions'],
      compulsiveActions: ['check_surroundings'],
      speechModifier: 'aggressive',
      socialWithdrawal: 40,
    },
    COMPULSIVE_BEHAVIOR: {
      actionRestrictions: [],
      compulsiveActions: ['check_inventory', 'touch_weapon', 'count_exits'],
      speechModifier: 'muted',
      socialWithdrawal: 30,
    },
    DISSOCIATIVE_DETACHMENT: {
      actionRestrictions: ['quick_decisions'],
      compulsiveActions: [],
      speechModifier: 'dissociated',
      socialWithdrawal: 80,
    },
    COMMAND_HALLUCINATION: {
      actionRestrictions: ['disobey_command'],
      compulsiveActions: [],
      speechModifier: 'fragmented',
      socialWithdrawal: 50,
    },
  };
  
  return {
    id: `episode_${Date.now()}`,
    type,
    severity,
    duration: baseDuration,
    triggerSource,
    perceptionFilter: filters[type],
    behaviorModifier: behaviors[type],
    startTick: tick,
  };
}

export function getEpisodeFromManifestation(manifestation: TraumaManifestation, severity: number): EpisodeType {
  switch (manifestation) {
    case 'flashback': return 'FLASHBACK_OVERLAY';
    case 'hypervigilance': return 'HALLUCINATORY_SUBSTITUTION';
    case 'numbing': return 'DISSOCIATIVE_DETACHMENT';
    case 'intrusion': return 'COMMAND_HALLUCINATION';
    case 'avoidance': return 'COMPULSIVE_BEHAVIOR';
    default: return 'DISSOCIATIVE_DETACHMENT';
  }
}

export function processEpisode(episode: PTSDEpisode): PTSDEpisode | null {
  const remaining = episode.duration - 1;
  if (remaining <= 0) return null;
  return { ...episode, duration: remaining };
}

// ============= COPING MECHANISMS (3.5) =============

export type CopingType = 
  | 'ROUTINE'    // Rigid adherence to schedule
  | 'HUMOR'      // Deflection through jokes
  | 'SUBSTANCE'  // Alcohol, drugs
  | 'ISOLATION'  // Avoiding others
  | 'CONTROL'    // Micromanaging environment
  | 'WORK'       // Burying in tasks
  | 'VIOLENCE'   // Externalizing pain
  | 'DENIAL';    // Refusing to acknowledge

export interface CopingEffect {
  stressReduction: number;
  stressIncrease: number; // Delayed cost
  sideEffect: string;
  socialCost: number;
  healthCost: number;
}

export const copingEffects: Record<CopingType, CopingEffect> = {
  ROUTINE: {
    stressReduction: 10,
    stressIncrease: 0,
    sideEffect: 'reduced adaptability',
    socialCost: 5,
    healthCost: 0,
  },
  HUMOR: {
    stressReduction: 8,
    stressIncrease: 0,
    sideEffect: 'reduced intimacy',
    socialCost: 10,
    healthCost: 0,
  },
  SUBSTANCE: {
    stressReduction: 25,
    stressIncrease: 15, // Hangover/withdrawal
    sideEffect: 'dependency risk',
    socialCost: 15,
    healthCost: 10,
  },
  ISOLATION: {
    stressReduction: 15,
    stressIncrease: 5, // Loneliness compounds
    sideEffect: 'belonging need increases',
    socialCost: 20,
    healthCost: 0,
  },
  CONTROL: {
    stressReduction: 12,
    stressIncrease: 0,
    sideEffect: 'relationships suffer',
    socialCost: 15,
    healthCost: 0,
  },
  WORK: {
    stressReduction: 10,
    stressIncrease: 5, // Burnout
    sideEffect: 'health suffers',
    socialCost: 10,
    healthCost: 10,
  },
  VIOLENCE: {
    stressReduction: 20,
    stressIncrease: 10, // Guilt/consequences
    sideEffect: 'major consequences',
    socialCost: 30,
    healthCost: 5,
  },
  DENIAL: {
    stressReduction: 5, // Minimal relief
    stressIncrease: 10, // Compounds over time
    sideEffect: 'stress compounds',
    socialCost: 5,
    healthCost: 0,
  },
};

export const npcCopingStyles: Record<string, { primary: CopingType; secondary: CopingType }> = {
  npc_old_edgar: { primary: 'SUBSTANCE', secondary: 'ROUTINE' },
  npc_guard_james: { primary: 'CONTROL', secondary: 'WORK' },
  npc_thomas: { primary: 'ISOLATION', secondary: 'DENIAL' },
  npc_martha: { primary: 'WORK', secondary: 'CONTROL' },
};

export function applyCoping(
  stressLevel: number,
  copingType: CopingType,
  intensity: number = 1
): { newStress: number; consequences: string[] } {
  const effect = copingEffects[copingType];
  const consequences: string[] = [];
  
  let newStress = stressLevel - (effect.stressReduction * intensity);
  
  // Delayed stress increase (simplified - would track over time in full impl)
  if (effect.stressIncrease > 0 && Math.random() < 0.3) {
    newStress += effect.stressIncrease * 0.5;
    consequences.push(effect.sideEffect);
  }
  
  return {
    newStress: Math.max(0, Math.min(100, newStress)),
    consequences,
  };
}

// ============= PSYCHOLOGICAL STATE FOR ENTITIES =============

export interface PsychologicalState {
  stress: StressState;
  traumaSeeds: TraumaSeed[];
  activeEpisode: PTSDEpisode | null;
  copingStyles: { primary: CopingType; secondary: CopingType };
  willpower: number; // 0-100, affects trauma resistance
  resilienceModifier: number; // -50 to 50, affects recovery
}

export function createDefaultPsychState(
  traumaSeeds: TraumaSeed[] = [],
  copingPrimary: CopingType = 'ROUTINE',
  copingSecondary: CopingType = 'ISOLATION'
): PsychologicalState {
  return {
    stress: {
      level: 20,
      threshold: 30,
      tolerance: 90,
      decayRate: 5,
      recentSources: [],
    },
    traumaSeeds: traumaSeeds.slice(0, MAX_TRAUMA_SEEDS), // Limit on creation
    activeEpisode: null,
    copingStyles: { primary: copingPrimary, secondary: copingSecondary },
    willpower: 50,
    resilienceModifier: 0,
  };
}

export function processPsychologicalTick(state: PsychologicalState, tick: number): PsychologicalState {
  let newState = { ...state };
  
  // Process active episode
  if (newState.activeEpisode) {
    const processed = processEpisode(newState.activeEpisode);
    newState.activeEpisode = processed;
    
    // Episode ending reduces stress slightly (relief)
    if (!processed) {
      newState.stress = {
        ...newState.stress,
        level: Math.max(0, newState.stress.level - 5),
      };
    }
  }
  
  // Natural stress decay (if below threshold)
  if (newState.stress.level < newState.stress.threshold) {
    newState.stress = {
      ...newState.stress,
      level: Math.max(0, newState.stress.level - newState.stress.decayRate * 0.1),
    };
  }
  
  // Clean old stress sources with limit
  let recentSources = newState.stress.recentSources.filter(
    s => tick - s.tick < 50
  );
  
  // Enforce limit
  if (recentSources.length > MAX_RECENT_SOURCES) {
    recentSources = recentSources.slice(-MAX_RECENT_SOURCES);
  }
  
  newState.stress.recentSources = recentSources;
  
  // Limit trauma seeds
  if (newState.traumaSeeds.length > MAX_TRAUMA_SEEDS) {
    // Keep highest severity trauma seeds
    newState.traumaSeeds = [...newState.traumaSeeds]
      .sort((a, b) => b.severity - a.severity)
      .slice(0, MAX_TRAUMA_SEEDS);
  }
  
  return newState;
}
