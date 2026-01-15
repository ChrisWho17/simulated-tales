// Combat Achievement Bridge
// Detects combat outcomes from narrative text and emits events for achievements

import { eventBus, CombatEvent } from '@/game/eventBus';

// Patterns to detect combat victories in narrative
const VICTORY_PATTERNS = [
  /(?:you|player)\s+(?:defeat|defeated|slew|killed|vanquished|destroyed|eliminated|overcame|bested|conquered)\s+(?:the\s+)?(\w+)/gi,
  /(\w+)\s+(?:falls|fell|collapses|collapsed|dies|died|is\s+(?:dead|defeated|slain|killed))/gi,
  /combat\s+(?:ends|ended|concludes)\s+(?:with\s+(?:your|the\s+player['']s)\s+)?victory/gi,
  /you\s+(?:emerge|emerged)\s+victorious/gi,
  /(?:enemy|opponent|foe)\s+(?:is|has\s+been)\s+(?:defeated|vanquished|slain)/gi,
];

// Patterns to detect de-escalation
const DEESCALATION_PATTERNS = [
  /(?:you|player)\s+(?:convince|convinced|persuade|persuaded|talk|talked)\s+(?:them|the\s+\w+)\s+(?:to\s+)?(?:stand\s+down|back\s+off|leave|stop|cease)/gi,
  /tension\s+(?:dissolves|dissipates|fades|eases)/gi,
  /(?:conflict|combat|fight|confrontation)\s+(?:is\s+)?(?:avoided|averted|prevented|defused)/gi,
  /(?:you|player)\s+(?:defuse|defused|de-escalate|de-escalated)\s+(?:the\s+)?(?:situation|conflict|tension)/gi,
  /(?:they|the\s+\w+)\s+(?:lower|lowers|lowered)\s+(?:their\s+)?weapons?/gi,
  /(?:peaceful|diplomatic)\s+(?:resolution|solution|outcome)/gi,
  /(?:you|player)\s+(?:negotiate|negotiated)\s+(?:a\s+)?(?:truce|peace|ceasefire)/gi,
];

// Patterns to detect fleeing
const FLEE_PATTERNS = [
  /(?:you|player)\s+(?:flee|fled|escape|escaped|run|ran)\s+(?:away|from)/gi,
  /(?:you|player)\s+(?:retreat|retreated|withdraw|withdrew)/gi,
  /(?:you|player)\s+(?:make|made)\s+(?:a\s+)?(?:hasty\s+)?(?:escape|retreat|exit)/gi,
];

// Patterns to detect taking no damage (for flawless victory)
const FLAWLESS_PATTERNS = [
  /without\s+(?:taking\s+)?(?:a\s+)?(?:single\s+)?(?:scratch|hit|damage|wound)/gi,
  /unscathed/gi,
  /flawless(?:ly)?/gi,
  /untouched/gi,
  /(?:you|player)\s+(?:emerge|emerged)\s+(?:completely\s+)?unharmed/gi,
];

interface CombatDetectionResult {
  type: 'won' | 'deescalated' | 'fled' | null;
  flawless?: boolean;
  method?: string;
  target?: string;
}

/**
 * Analyze narrative text to detect combat outcomes
 */
export function detectCombatOutcome(narrativeText: string): CombatDetectionResult {
  const text = narrativeText.toLowerCase();
  
  // Check for victory
  for (const pattern of VICTORY_PATTERNS) {
    pattern.lastIndex = 0; // Reset regex
    const match = pattern.exec(text);
    if (match) {
      // Check if it was flawless
      const flawless = FLAWLESS_PATTERNS.some(p => {
        p.lastIndex = 0;
        return p.test(text);
      });
      
      return {
        type: 'won',
        flawless,
        target: match[1] || 'enemy',
      };
    }
  }
  
  // Check for de-escalation
  for (const pattern of DEESCALATION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      // Determine method
      let method = 'diplomacy';
      if (/persuad/i.test(text)) method = 'persuasion';
      if (/intimidat/i.test(text)) method = 'intimidation';
      if (/negotiat/i.test(text)) method = 'negotiation';
      if (/brib/i.test(text)) method = 'bribery';
      
      return {
        type: 'deescalated',
        method,
      };
    }
  }
  
  // Check for fleeing
  for (const pattern of FLEE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) {
      return { type: 'fled' };
    }
  }
  
  return { type: null };
}

/**
 * Emit combat event based on detection result
 */
export function emitCombatOutcomeEvent(result: CombatDetectionResult, tick: number = 0): void {
  if (!result.type) return;
  
  const baseEventData = {
    targetEntity: result.target || 'enemy',
    flawlessVictory: result.flawless,
    method: result.method,
  };
  
  switch (result.type) {
    case 'won':
      eventBus.emit<CombatEvent>({
        type: 'COMBAT_WON',
        tick,
        source: 'narrative_detection',
        priority: 'normal',
        data: baseEventData,
      });
      console.log('[CombatAchievements] Emitted COMBAT_WON event', { flawless: result.flawless });
      break;
      
    case 'deescalated':
      eventBus.emit<CombatEvent>({
        type: 'COMBAT_DEESCALATED',
        tick,
        source: 'narrative_detection',
        priority: 'normal',
        data: baseEventData,
      });
      console.log('[CombatAchievements] Emitted COMBAT_DEESCALATED event', { method: result.method });
      break;
      
    case 'fled':
      eventBus.emit<CombatEvent>({
        type: 'COMBAT_FLED',
        tick,
        source: 'narrative_detection',
        priority: 'normal',
        data: baseEventData,
      });
      console.log('[CombatAchievements] Emitted COMBAT_FLED event');
      break;
  }
}

/**
 * Process narrative text and emit any combat-related events
 * Call this after receiving narrator responses
 */
export function processNarrativeForCombatAchievements(narrativeText: string, tick?: number): CombatDetectionResult {
  const result = detectCombatOutcome(narrativeText);
  if (result.type) {
    emitCombatOutcomeEvent(result, tick);
  }
  return result;
}

export default processNarrativeForCombatAchievements;
