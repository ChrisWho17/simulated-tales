// Adrenaline & Combat Integration
// Connects the adrenaline/hidden damage system to combat damage flow
// Subscribes to Event Bus for damage events

import { 
  AdrenalineSystemState,
  WoundCategory,
  BodyLocation,
  Wound,
  createAdrenalineState,
  receiveDamage,
  triggerAdrenaline,
  processDecay,
  assessSelf,
  treatWound,
  getAdrenalineStatus,
  getWoundRevealMessage,
  ADRENALINE_TRIGGERS,
  COMBAT_WOUND_MAPPING,
} from './adrenalineSystem';
import { eventBus, CombatEvent } from './eventBus';

// ============================================================================
// ATTACK TYPE TO WOUND MAPPING
// ============================================================================

const ATTACK_WOUND_MAPPING: Record<string, WoundCategory | WoundCategory[]> = {
  // Unarmed
  'punch': 'blunt_trauma',
  'kick': 'blunt_trauma',
  'headbutt': 'blunt_trauma',
  'grapple': 'blunt_trauma',
  
  // Bladed weapons
  'knife_slash': 'cut',
  'knife_stab': 'stab_wound',
  'sword_slash': 'deep_cut',
  'sword_stab': 'stab_wound',
  'dagger': 'stab_wound',
  'axe': 'deep_cut',
  
  // Ranged
  'bullet': ['gunshot_graze', 'gunshot_wound'],
  'arrow': 'stab_wound',
  'crossbow': 'stab_wound',
  
  // Environmental/other
  'explosion': 'blunt_trauma',
  'fall': ['blunt_trauma', 'broken_bone'],
  'crush': ['blunt_trauma', 'broken_bone'],
  
  // Generic
  'attack': 'blunt_trauma',
  'damage': 'blunt_trauma',
  'combat': 'blunt_trauma',
  
  // Also include the standard mappings
  ...COMBAT_WOUND_MAPPING,
};

// ============================================================================
// INTEGRATION FUNCTIONS
// ============================================================================

/**
 * Trigger situational adrenaline based on game events
 */
export function triggerSituationalAdrenaline(
  state: AdrenalineSystemState,
  situation: string,
  source: string = 'event'
): AdrenalineSystemState {
  const amount = ADRENALINE_TRIGGERS[situation] || 10;
  const result = triggerAdrenaline(state, amount, source);
  return result.state;
}

/**
 * Get the wound type for an attack type, handling random selection for arrays
 */
function getWoundTypeForAttack(attackType: string): WoundCategory {
  const mapping = ATTACK_WOUND_MAPPING[attackType.toLowerCase()];
  
  if (!mapping) {
    return 'blunt_trauma';
  }
  
  if (Array.isArray(mapping)) {
    // Random selection - for bullets, 30% graze, 70% wound
    if (attackType.toLowerCase() === 'bullet') {
      return Math.random() < 0.3 ? mapping[0] : mapping[1];
    }
    // For falls/crush, 50/50
    return Math.random() < 0.5 ? mapping[0] : mapping[1];
  }
  
  return mapping;
}

/**
 * Process combat damage through the adrenaline system
 * Returns the updated state and damage result (which may be hidden or revealed)
 */
export function processCombatDamage(
  state: AdrenalineSystemState,
  attackType: string,
  attacker: string,
  location?: BodyLocation,
  gameTick?: number
): {
  state: AdrenalineSystemState;
  result: {
    hidden: boolean;
    actualDamage: number;
    vagueSymptom?: string;
    woundId?: string;
    revealedMessage?: string;
  };
} {
  // First trigger adrenaline from being in combat
  const triggerResult = triggerAdrenaline(state, ADRENALINE_TRIGGERS.being_attacked || 20, 'combat');
  let updatedState = triggerResult.state;
  
  // Determine wound type from attack
  const woundType = getWoundTypeForAttack(attackType);
  
  // Process the damage through the adrenaline system
  const damageResult = receiveDamage(updatedState, woundType, location || null, attacker, gameTick);
  
  return {
    state: damageResult.state,
    result: {
      hidden: damageResult.hidden,
      actualDamage: damageResult.wound?.hpDamage || 0,
      vagueSymptom: damageResult.vagueSymptom,
      woundId: damageResult.wound?.id,
      revealedMessage: !damageResult.hidden && damageResult.wound 
        ? `${damageResult.wound.typeName} to the ${damageResult.wound.locationName}` 
        : undefined,
    },
  };
}

/**
 * Tick the adrenaline system - call this each game tick/minute
 * Handles decay and wound reveals
 */
export function tickAdrenalineSystem(
  state: AdrenalineSystemState,
  deltaSeconds: number
): {
  state: AdrenalineSystemState;
  revealedWounds: Array<{ wound: Wound; message: string; damage: number }>;
} {
  // Process adrenaline decay which also checks for wound reveals
  const decayResult = processDecay(state, deltaSeconds);
  
  // Map revealed wounds to include messages
  const revealedWounds = decayResult.revealedWounds.map(wound => ({
    wound,
    message: getWoundRevealMessage(wound),
    damage: wound.hpDamage,
  }));
  
  return {
    state: decayResult.state,
    revealedWounds,
  };
}

/**
 * Player assesses their condition to discover hidden wounds
 */
export function playerAssessSelf(
  state: AdrenalineSystemState,
  thoroughness: 'quick' | 'careful' | 'thorough',
  medicalSkill: number = 0
): {
  state: AdrenalineSystemState;
  discoveredWounds: Wound[];
  message: string;
  status: 'clean' | 'found' | 'partial' | 'missed';
} {
  return assessSelf(state, thoroughness, medicalSkill);
}

/**
 * Treat a wound
 */
export function playerTreatWound(
  state: AdrenalineSystemState,
  woundId: string,
  treatmentType: 'pressure' | 'bandage' | 'first_aid' | 'medical'
): {
  state: AdrenalineSystemState;
  success: boolean;
  healBonus: number;
  bleedingStopped: boolean;
  error?: string;
} {
  return treatWound(state, woundId, treatmentType);
}

/**
 * Build context string for AI narrative generation
 */
export function buildAdrenalineNarrativeContext(state: AdrenalineSystemState): string {
  const status = getAdrenalineStatus(state);
  
  let context = `\n## ADRENALINE & CONDITION\n\n`;
  context += `Adrenaline: ${status.adrenaline.toFixed(0)}/${status.maxAdrenaline} (${status.thresholdInfo.name})\n`;
  context += `State: ${status.thresholdInfo.description}\n`;
  
  if (status.hiddenWounds > 0) {
    context += `\n⚠️ SOMETHING FEELS WRONG - Player may have unnoticed injuries\n`;
    context += `(${status.hiddenWounds} hidden wound(s), ${status.hiddenDamage} pending damage)\n`;
    context += `NARRATIVE NOTE: Describe vague symptoms (feeling off, warm wetness, numbness) `;
    context += `without revealing exact injuries until adrenaline drops or player assesses themselves.\n`;
  }
  
  if (status.revealedWounds > 0) {
    context += `\n### KNOWN WOUNDS (${status.revealedWounds} untreated)\n`;
    for (const wound of state.hiddenDamage.revealedWounds.filter(w => !w.treated)) {
      context += `- ${wound.typeName} (${wound.locationName}): `;
      context += wound.bleedRate > 0 ? `Bleeding (${wound.bleedRate}/min)\n` : `Not bleeding\n`;
    }
  }
  
  if (status.totalActiveBleeding > 0) {
    context += `\n🩸 ACTIVE BLEEDING: ${status.totalActiveBleeding.toFixed(1)} HP/minute\n`;
  }
  
  return context;
}

/**
 * Create a fresh adrenaline system state
 */
export function initializeAdrenalineSystem(): AdrenalineSystemState {
  return createAdrenalineState();
}

/**
 * Check if adrenaline system should hide damage based on current level
 */
export function shouldHideDamage(state: AdrenalineSystemState, woundSeverity: number): boolean {
  const baseThreshold = 20 + (woundSeverity * 10);
  return state.adrenaline.current >= baseThreshold;
}

// ============================================================================
// EVENT BUS SUBSCRIPTIONS
// ============================================================================

let adrenalineStateRef: AdrenalineSystemState | null = null;
let onStateUpdateCallback: ((state: AdrenalineSystemState) => void) | null = null;

/**
 * Register the adrenaline state for event bus integration
 * The callback is called whenever the state is updated by event bus handlers
 */
export function registerAdrenalineForEventBus(
  state: AdrenalineSystemState,
  onStateUpdate: (state: AdrenalineSystemState) => void
): () => void {
  adrenalineStateRef = state;
  onStateUpdateCallback = onStateUpdate;
  
  // Subscribe to damage events
  const unsubDamage = eventBus.subscribe(['DAMAGE_RECEIVED'], (event) => {
    if (!adrenalineStateRef) return;
    
    const combatEvent = event as CombatEvent;
    if (combatEvent.data.targetEntity !== 'player') return;
    
    // Trigger adrenaline from being attacked
    const triggerResult = triggerAdrenaline(
      adrenalineStateRef, 
      ADRENALINE_TRIGGERS.being_attacked || 20, 
      'combat'
    );
    
    adrenalineStateRef = triggerResult.state;
    
    // Process the damage through adrenaline masking
    if (combatEvent.data.amount && combatEvent.data.amount > 0) {
      const woundType = combatEvent.data.woundType as WoundCategory || 'blunt_trauma';
      const damageResult = receiveDamage(
        adrenalineStateRef,
        woundType,
        null,
        combatEvent.data.sourceEntity || 'combat',
        event.tick
      );
      
      adrenalineStateRef = damageResult.state;
      
      // Emit wound event if wound was created
      if (damageResult.wound) {
        eventBus.emit<CombatEvent>({
          type: 'WOUND_INFLICTED',
          tick: event.tick,
          source: 'adrenalineSystem',
          priority: 'high',
          data: {
            targetEntity: 'player',
            amount: damageResult.wound.hpDamage,
            woundType: damageResult.wound.type,
            location: damageResult.wound.location,
            isHidden: damageResult.hidden,
          },
        });
      }
    }
    
    onStateUpdateCallback?.(adrenalineStateRef);
  });
  
  // Subscribe to death/knockout events for max adrenaline
  const unsubCritical = eventBus.subscribe(['KNOCKOUT'], (event) => {
    if (!adrenalineStateRef) return;
    
    const combatEvent = event as CombatEvent;
    if (combatEvent.data.targetEntity !== 'player') return;
    
    // Max out adrenaline on critical combat events
    const triggerResult = triggerAdrenaline(adrenalineStateRef, 50, 'critical');
    adrenalineStateRef = triggerResult.state;
    onStateUpdateCallback?.(adrenalineStateRef);
  });
  
  // Return cleanup function
  return () => {
    unsubDamage();
    unsubCritical();
    adrenalineStateRef = null;
    onStateUpdateCallback = null;
  };
}

/**
 * Update the registered adrenaline state (call this when state changes externally)
 */
export function updateRegisteredAdrenalineState(state: AdrenalineSystemState): void {
  adrenalineStateRef = state;
}

// Re-export common types and functions for convenience
export type { AdrenalineSystemState, WoundCategory, BodyLocation, Wound };
export { createAdrenalineState, getAdrenalineStatus };
