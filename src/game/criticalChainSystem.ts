// ============================================================================
// CRITICAL CHAIN SYSTEM - Consecutive crits/fails create escalating effects
// ============================================================================

import { eventBus } from './eventBus';

// ============================================================================
// TYPES
// ============================================================================

export type ChainType = 'fortune' | 'desperation' | 'neutral';

export interface CriticalChainState {
  chainType: ChainType;
  chainLength: number;
  
  // Fortune Favor (consecutive successes/crits)
  fortuneFavor: number; // 0-100, builds with successes
  fortuneTier: FortuneTier;
  
  // Desperation Mode (consecutive failures)
  desperationLevel: number; // 0-100, builds with failures
  desperationTier: DesperationTier;
  
  // History
  lastFiveRolls: RollOutcome[];
  
  // Active effects
  activeBonus: number; // Current modifier to next roll
  narrativeEffect: string; // Current narrative description
  
  // Stats
  longestFortune: number;
  longestDesperation: number;
  comebacksTriggered: number; // Breaking desperation with success
}

export type FortuneTier = 'none' | 'lucky' | 'blessed' | 'fated' | 'legendary';
export type DesperationTier = 'none' | 'unlucky' | 'cursed' | 'doomed' | 'forsaken';

export interface RollOutcome {
  timestamp: number;
  naturalRoll: number;
  wasCrit: boolean;
  wasCritFail: boolean;
  wasSuccess: boolean;
  actionType: string;
}

// ============================================================================
// FORTUNE TIERS
// ============================================================================

export const FORTUNE_TIERS: Record<FortuneTier, {
  minChain: number;
  bonus: number;
  color: string;
  icon: string;
  description: string;
  narrativeEffects: string[];
}> = {
  none: {
    minChain: 0,
    bonus: 0,
    color: '#64748b',
    icon: '',
    description: '',
    narrativeEffects: []
  },
  lucky: {
    minChain: 2,
    bonus: 1,
    color: '#22c55e',
    icon: '🍀',
    description: 'Luck is on your side',
    narrativeEffects: [
      'A surge of confidence fills you.',
      'Things seem to be going your way.',
      'Fortune smiles upon your efforts.'
    ]
  },
  blessed: {
    minChain: 4,
    bonus: 2,
    color: '#3b82f6',
    icon: '✨',
    description: 'Fortune\'s Favor',
    narrativeEffects: [
      'An almost supernatural luck guides your actions.',
      'The universe seems to bend in your favor.',
      'Everything you touch turns to gold.'
    ]
  },
  fated: {
    minChain: 6,
    bonus: 3,
    color: '#8b5cf6',
    icon: '⚡',
    description: 'Fated to Succeed',
    narrativeEffects: [
      'Destiny itself seems to carry you forward.',
      'You move with the certainty of prophecy.',
      'The threads of fate weave in your favor.'
    ]
  },
  legendary: {
    minChain: 8,
    bonus: 5,
    color: '#f59e0b',
    icon: '👑',
    description: 'Legendary Streak',
    narrativeEffects: [
      'You have entered a state of pure flow.',
      'Stories will be told of this moment.',
      'Even the gods take notice of your streak.'
    ]
  }
};

// ============================================================================
// DESPERATION TIERS
// ============================================================================

export const DESPERATION_TIERS: Record<DesperationTier, {
  minChain: number;
  penalty: number;
  comebackBonus: number;
  color: string;
  icon: string;
  description: string;
  narrativeEffects: string[];
}> = {
  none: {
    minChain: 0,
    penalty: 0,
    comebackBonus: 0,
    color: '#64748b',
    icon: '',
    description: '',
    narrativeEffects: []
  },
  unlucky: {
    minChain: 2,
    penalty: -1,
    comebackBonus: 2,
    color: '#f59e0b',
    icon: '😬',
    description: 'Bad luck streak',
    narrativeEffects: [
      'Doubt creeps into your mind.',
      'Nothing seems to work right.',
      'A string of misfortune plagues you.'
    ]
  },
  cursed: {
    minChain: 4,
    penalty: -2,
    comebackBonus: 4,
    color: '#ef4444',
    icon: '💀',
    description: 'Cursed Streak',
    narrativeEffects: [
      'A dark cloud hangs over your every action.',
      'Even simple tasks become treacherous.',
      'It feels as though the world is against you.'
    ]
  },
  doomed: {
    minChain: 6,
    penalty: -2,
    comebackBonus: 6,
    color: '#7c2d12',
    icon: '⚰️',
    description: 'Doom Approaches',
    narrativeEffects: [
      'Despair threatens to overwhelm you.',
      'Everything that can go wrong, does.',
      'You wonder if you\'ll ever succeed again.'
    ]
  },
  forsaken: {
    minChain: 8,
    penalty: -3,
    comebackBonus: 10,
    color: '#1e1b4b',
    icon: '🕳️',
    description: 'Forsaken by Fortune',
    narrativeEffects: [
      'Rock bottom. There\'s nowhere to go but up.',
      'In your darkest hour, a spark remains.',
      'The world has abandoned you... but has it?'
    ]
  }
};

// ============================================================================
// CHAIN STATE MANAGEMENT
// ============================================================================

// LIMITS to prevent unbounded growth
const MAX_ROLL_HISTORY = 10;

export function initializeCriticalChainState(): CriticalChainState {
  return {
    chainType: 'neutral',
    chainLength: 0,
    fortuneFavor: 0,
    fortuneTier: 'none',
    desperationLevel: 0,
    desperationTier: 'none',
    lastFiveRolls: [],
    activeBonus: 0,
    narrativeEffect: '',
    longestFortune: 0,
    longestDesperation: 0,
    comebacksTriggered: 0
  };
}

/**
 * Process a new dice roll and update the chain state
 */
export function processRollForChain(
  state: CriticalChainState,
  roll: {
    naturalRoll: number;
    wasSuccess: boolean;
    actionType: string;
  }
): { newState: CriticalChainState; narrative: string | null; comeback: boolean } {
  const wasCrit = roll.naturalRoll === 20;
  const wasCritFail = roll.naturalRoll === 1;
  
  // Add to history
  const outcome: RollOutcome = {
    timestamp: Date.now(),
    naturalRoll: roll.naturalRoll,
    wasCrit,
    wasCritFail,
    wasSuccess: roll.wasSuccess,
    actionType: roll.actionType
  };
  
  // Add to history with limit
  const newHistory = [outcome, ...state.lastFiveRolls].slice(0, MAX_ROLL_HISTORY);
  
  let newState = { ...state, lastFiveRolls: newHistory };
  let narrative: string | null = null;
  let comeback = false;
  
  // Determine if this continues or breaks a chain
  if (roll.wasSuccess || wasCrit) {
    // Success - builds fortune, breaks desperation
    
    if (state.desperationTier !== 'none') {
      // COMEBACK! Breaking out of desperation with success
      const comebackBonus = DESPERATION_TIERS[state.desperationTier].comebackBonus;
      narrative = generateComebackNarrative(state.desperationTier, wasCrit);
      comeback = true;
      
      // Reset desperation, start fortune chain
      newState = {
        ...newState,
        chainType: 'fortune',
        chainLength: 1,
        fortuneFavor: 20 + comebackBonus * 5,
        fortuneTier: 'lucky',
        desperationLevel: 0,
        desperationTier: 'none',
        comebacksTriggered: state.comebacksTriggered + 1,
        activeBonus: comebackBonus,
        narrativeEffect: 'Comeback! Your fortune has turned!'
      };
      
      eventBus.emit({ type: 'COMEBACK_TRIGGERED', tick: 0, source: 'criticalChainSystem', priority: 'high', data: { tier: state.desperationTier, wasCrit } } as any);
    } else {
      // Building fortune chain
      const newChainLength = state.chainType === 'fortune' ? state.chainLength + 1 : 1;
      const newFortune = Math.min(100, state.fortuneFavor + (wasCrit ? 25 : 15));
      const newTier = calculateFortuneTier(newChainLength);
      
      // Check if tier increased
      if (newTier !== state.fortuneTier && newTier !== 'none') {
        narrative = FORTUNE_TIERS[newTier].narrativeEffects[
          Math.floor(Math.random() * FORTUNE_TIERS[newTier].narrativeEffects.length)
        ];
      }
      
      newState = {
        ...newState,
        chainType: 'fortune',
        chainLength: newChainLength,
        fortuneFavor: newFortune,
        fortuneTier: newTier,
        longestFortune: Math.max(state.longestFortune, newChainLength),
        activeBonus: FORTUNE_TIERS[newTier].bonus,
        narrativeEffect: FORTUNE_TIERS[newTier].description
      };
    }
  } else {
    // Failure - builds desperation, breaks fortune
    
    if (state.fortuneTier !== 'none' && state.chainLength >= 3) {
      // Breaking a good streak with failure
      narrative = 'Your lucky streak comes to an abrupt end.';
    }
    
    // Reset fortune, build desperation
    const newChainLength = state.chainType === 'desperation' ? state.chainLength + 1 : 1;
    const newDesperation = Math.min(100, state.desperationLevel + (wasCritFail ? 30 : 20));
    const newTier = calculateDesperationTier(newChainLength);
    
    // Check if tier increased
    if (newTier !== state.desperationTier && newTier !== 'none') {
      narrative = DESPERATION_TIERS[newTier].narrativeEffects[
        Math.floor(Math.random() * DESPERATION_TIERS[newTier].narrativeEffects.length)
      ];
    }
    
    newState = {
      ...newState,
      chainType: 'desperation',
      chainLength: newChainLength,
      fortuneFavor: Math.max(0, state.fortuneFavor - 20),
      fortuneTier: 'none',
      desperationLevel: newDesperation,
      desperationTier: newTier,
      longestDesperation: Math.max(state.longestDesperation, newChainLength),
      activeBonus: DESPERATION_TIERS[newTier].penalty,
      narrativeEffect: DESPERATION_TIERS[newTier].description
    };
  }
  
  return { newState, narrative, comeback };
}

/**
 * Calculate fortune tier based on chain length
 */
function calculateFortuneTier(chainLength: number): FortuneTier {
  if (chainLength >= 8) return 'legendary';
  if (chainLength >= 6) return 'fated';
  if (chainLength >= 4) return 'blessed';
  if (chainLength >= 2) return 'lucky';
  return 'none';
}

/**
 * Calculate desperation tier based on chain length
 */
function calculateDesperationTier(chainLength: number): DesperationTier {
  if (chainLength >= 8) return 'forsaken';
  if (chainLength >= 6) return 'doomed';
  if (chainLength >= 4) return 'cursed';
  if (chainLength >= 2) return 'unlucky';
  return 'none';
}

/**
 * Generate narrative for breaking out of desperation
 */
function generateComebackNarrative(desperationTier: DesperationTier, wasCrit: boolean): string {
  const comebacks: Record<DesperationTier, string[]> = {
    none: [],
    unlucky: [
      'Finally, a break in the clouds!',
      'Your luck turns at last.',
      'Perseverance pays off!'
    ],
    cursed: [
      'Against all odds, you break the curse!',
      'The dark cloud lifts from your shoulders.',
      'When you least expected it, fortune returns!'
    ],
    doomed: [
      'From the depths of despair, you rise!',
      'A miraculous turnaround defies destiny.',
      'Just when all seemed lost, hope returns!'
    ],
    forsaken: [
      wasCrit 
        ? 'A LEGENDARY COMEBACK! The forsaken become the favored!'
        : 'Against impossible odds, you claw your way back from oblivion!',
      'The story will tell of how you rose from absolute ruin.',
      'Even fate itself could not keep you down!'
    ]
  };
  
  const options = comebacks[desperationTier];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get the current modifier to apply to dice rolls
 */
export function getChainModifier(state: CriticalChainState): {
  modifier: number;
  source: string;
  icon: string;
  color: string;
} {
  if (state.fortuneTier !== 'none') {
    const tier = FORTUNE_TIERS[state.fortuneTier];
    return {
      modifier: tier.bonus,
      source: `${tier.description} (${state.chainLength} streak)`,
      icon: tier.icon,
      color: tier.color
    };
  }
  
  if (state.desperationTier !== 'none') {
    const tier = DESPERATION_TIERS[state.desperationTier];
    return {
      modifier: tier.penalty,
      source: `${tier.description} (${state.chainLength} streak)`,
      icon: tier.icon,
      color: tier.color
    };
  }
  
  return { modifier: 0, source: '', icon: '', color: '' };
}

/**
 * Format chain state for display
 */
export function formatChainStatus(state: CriticalChainState): string {
  if (state.fortuneTier !== 'none') {
    const tier = FORTUNE_TIERS[state.fortuneTier];
    return `${tier.icon} ${tier.description} (${state.chainLength}x) +${tier.bonus}`;
  }
  
  if (state.desperationTier !== 'none') {
    const tier = DESPERATION_TIERS[state.desperationTier];
    return `${tier.icon} ${tier.description} (${state.chainLength}x) ${tier.penalty}`;
  }
  
  return '';
}

/**
 * Check if player is due for a "mercy" bonus after long desperation
 */
export function getMercyBonus(state: CriticalChainState): number {
  // After 5+ failures, start giving hidden small bonuses
  if (state.desperationTier !== 'none' && state.chainLength >= 5) {
    return Math.min(3, Math.floor((state.chainLength - 4) / 2));
  }
  return 0;
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

class CriticalChainManager {
  private state: CriticalChainState = initializeCriticalChainState();
  
  getState(): CriticalChainState {
    return { ...this.state };
  }
  
  processRoll(roll: { naturalRoll: number; wasSuccess: boolean; actionType: string }) {
    const result = processRollForChain(this.state, roll);
    this.state = result.newState;
    return result;
  }
  
  getModifier() {
    return getChainModifier(this.state);
  }
  
  getMercy() {
    return getMercyBonus(this.state);
  }
  
  reset() {
    this.state = initializeCriticalChainState();
  }
  
  // Load from save with validation
  loadState(saved: CriticalChainState) {
    if (!saved || typeof saved !== 'object') {
      this.state = initializeCriticalChainState();
      return;
    }
    this.state = { 
      ...initializeCriticalChainState(), 
      ...saved,
      // Limit arrays on load
      lastFiveRolls: Array.isArray(saved.lastFiveRolls) 
        ? saved.lastFiveRolls.slice(0, MAX_ROLL_HISTORY)
        : []
    };
  }
}

export const criticalChainManager = new CriticalChainManager();
