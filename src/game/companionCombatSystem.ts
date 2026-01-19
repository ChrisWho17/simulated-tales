// ============================================================================
// COMPANION COMBAT SYSTEM - Dice-based companion combat integration
// ============================================================================

import { CompanionState } from './companionSystem';
import { eventBus, CombatEvent } from './eventBus';
import { rollD20, DifficultyTier, DIFFICULTY_MODIFIERS, BASE_DC } from './diceSystem';

// ============================================================================
// TYPES
// ============================================================================

export type CompanionCombatOutcome = 
  | 'critical_failure'  // Companion hurts the player
  | 'failure'           // Companion hurts the player (minor)
  | 'neutral'           // No effect
  | 'success'           // Companion helps
  | 'critical_success'; // Companion helps significantly

export interface CompanionCombatStats {
  // Permanent stats (never change) - matches CharacterStats from rpgCharacter.ts
  baseStrength: number;       // Physical power, melee damage (1-15+)
  baseDexterity: number;      // Agility, stealth, ranged attacks (1-15+)
  baseConstitution: number;   // Health, endurance, resistance (1-15+)
  baseIntelligence: number;   // Knowledge, magic, problem-solving (1-15+)
  baseWisdom: number;         // Perception, intuition, willpower (1-15+)
  baseCharisma: number;       // Social influence, persuasion, leadership (1-15+)
  size: 'small' | 'medium' | 'large' | 'huge';
  
  // Current state (can change)
  currentHealth: number;
  maxHealth: number;
  currentEnergy: number;
  
  // Morale System (affected by combat outcomes)
  morale: number;             // 0-100 (affects roll modifier)
  moraleState: 'demoralized' | 'shaken' | 'steady' | 'confident' | 'inspired';
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  
  // Derived
  weaponDamage: number;
  armorProtection: number;
}

export interface CompanionCombatAction {
  companionId: string;
  companionName: string;
  actionType: 'attack' | 'defend' | 'support' | 'special';
  
  // Roll details
  naturalRoll: number;
  statModifier: number;
  sizeModifier: number;
  skillModifier: number;
  totalRoll: number;
  targetDC: number;
  
  // Outcome
  outcome: CompanionCombatOutcome;
  damageDealt: number;       // To enemy if success
  damageToPlayer: number;    // If failure/critical failure
  healToPlayer: number;      // If support success
  
  // Narrative
  narrative: string;
}

export interface CompanionCombatRound {
  roundNumber: number;
  actions: CompanionCombatAction[];
  totalDamageDealt: number;
  totalDamageToPlayer: number;
  totalHealToPlayer: number;
}

// ============================================================================
// SIZE MODIFIERS
// ============================================================================

const SIZE_MODIFIERS: Record<CompanionCombatStats['size'], { damage: number; accuracy: number; protection: number }> = {
  small: { damage: -2, accuracy: +3, protection: -1 },     // Fast but weak
  medium: { damage: 0, accuracy: 0, protection: 0 },       // Balanced
  large: { damage: +3, accuracy: -1, protection: +2 },     // Strong but slower
  huge: { damage: +5, accuracy: -3, protection: +4 },      // Very strong, clumsy
};

// ============================================================================
// COMBAT STAT GENERATION (called once when companion is created)
// ============================================================================

export function generateCompanionCombatStats(
  combatRole: CompanionState['combatRole'],
  skills: string[],
  experienceLevel?: 'green' | 'novice' | 'competent' | 'skilled' | 'veteran'
): CompanionCombatStats {
  // Experience level stat ranges
  const expLevelRanges: Record<string, { min: number; max: number }> = {
    green: { min: 1, max: 4 },
    novice: { min: 3, max: 6 },
    competent: { min: 5, max: 8 },
    skilled: { min: 7, max: 10 },
    veteran: { min: 10, max: 15 },
  };
  
  const expRange = expLevelRanges[experienceLevel || 'competent'] || expLevelRanges.competent;
  const statRange = expRange.max - expRange.min;
  
  // Helper to generate a stat within the experience range
  const genStat = () => expRange.min + Math.floor(Math.random() * (statRange + 1));
  
  // Role-based stat bonuses (added to base roll, clamped to max 15)
  const roleStatBonuses: Record<string, { str: number; dex: number; con: number; int: number; wis: number; cha: number }> = {
    tank: { str: 2, dex: -1, con: 3, int: 0, wis: 1, cha: 0 },
    damage: { str: 2, dex: 2, con: 0, int: 0, wis: 0, cha: 0 },
    support: { str: -1, dex: 0, con: 1, int: 2, wis: 2, cha: 1 },
    ranged: { str: 0, dex: 3, con: 0, int: 1, wis: 2, cha: 0 },
  };
  
  const bonuses = roleStatBonuses[combatRole || 'damage'] || roleStatBonuses.damage;
  
  // Generate base stats with role bonuses
  const clampStat = (val: number) => Math.max(1, Math.min(15, val));
  const baseStrength = clampStat(genStat() + bonuses.str);
  const baseDexterity = clampStat(genStat() + bonuses.dex);
  const baseConstitution = clampStat(genStat() + bonuses.con);
  const baseIntelligence = clampStat(genStat() + bonuses.int);
  const baseWisdom = clampStat(genStat() + bonuses.wis);
  const baseCharisma = clampStat(genStat() + bonuses.cha);
  
  // Calculate derived stats based on role and constitution
  const roleDefaults: Record<string, { baseHealth: number; weaponDamage: number; armorProtection: number; size: CompanionCombatStats['size'] }> = {
    tank: { baseHealth: 100, weaponDamage: 12, armorProtection: 15, size: Math.random() > 0.6 ? 'large' : 'medium' as const },
    damage: { baseHealth: 70, weaponDamage: 18, armorProtection: 5, size: 'medium' },
    support: { baseHealth: 60, weaponDamage: 8, armorProtection: 3, size: Math.random() > 0.7 ? 'small' : 'medium' as const },
    ranged: { baseHealth: 65, weaponDamage: 15, armorProtection: 4, size: 'medium' },
  };
  
  const roleVals = roleDefaults[combatRole || 'damage'] || roleDefaults.damage;
  
  // Constitution bonus to health: +5 HP per point above 5
  const conBonus = Math.max(0, baseConstitution - 5) * 5;
  const maxHealth = roleVals.baseHealth + conBonus;
  
  // Strength bonus to damage
  const strBonus = Math.floor((baseStrength - 5) / 3);
  const weaponDamage = roleVals.weaponDamage + strBonus;
  
  return {
    baseStrength,
    baseDexterity,
    baseConstitution,
    baseIntelligence,
    baseWisdom,
    baseCharisma,
    size: roleVals.size,
    currentHealth: maxHealth,
    maxHealth,
    currentEnergy: 100,
    morale: 50, // Start steady
    moraleState: 'steady',
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
    weaponDamage,
    armorProtection: roleVals.armorProtection,
  };
}

// ============================================================================
// STAT MODIFIER CALCULATION
// ============================================================================

function calculateStatModifier(statValue: number): number {
  // Convert 0-100 stat to -5 to +10 modifier
  if (typeof statValue !== 'number' || isNaN(statValue)) return 0;
  const clampedStat = Math.max(0, Math.min(100, statValue));
  return Math.floor((clampedStat - 50) / 5);
}

function getSizeModifier(size: CompanionCombatStats['size'], type: 'damage' | 'accuracy' | 'protection'): number {
  return SIZE_MODIFIERS[size]?.[type] || 0;
}

// ============================================================================
// MORALE SYSTEM
// ============================================================================

function getMoraleModifier(morale: number): number {
  // Morale affects roll modifier: -4 to +4
  if (morale <= 15) return -4;  // Demoralized
  if (morale <= 30) return -2;  // Shaken
  if (morale <= 70) return 0;   // Steady
  if (morale <= 85) return +2;  // Confident
  return +4;                     // Inspired
}

function getMoraleState(morale: number): CompanionCombatStats['moraleState'] {
  if (morale <= 15) return 'demoralized';
  if (morale <= 30) return 'shaken';
  if (morale <= 70) return 'steady';
  if (morale <= 85) return 'confident';
  return 'inspired';
}

export function updateMoraleAfterAction(
  stats: CompanionCombatStats,
  outcome: CompanionCombatOutcome
): void {
  const isSuccess = outcome === 'success' || outcome === 'critical_success';
  const isFailure = outcome === 'failure' || outcome === 'critical_failure';
  
  if (isSuccess) {
    stats.consecutiveSuccesses++;
    stats.consecutiveFailures = 0;
    
    // Morale boost based on consecutive successes
    const boost = outcome === 'critical_success' ? 12 : 6;
    const streakBonus = Math.min(stats.consecutiveSuccesses, 3) * 2;
    stats.morale = Math.min(100, stats.morale + boost + streakBonus);
    
  } else if (isFailure) {
    stats.consecutiveFailures++;
    stats.consecutiveSuccesses = 0;
    
    // Morale penalty based on consecutive failures
    const penalty = outcome === 'critical_failure' ? 15 : 8;
    const streakPenalty = Math.min(stats.consecutiveFailures, 3) * 3;
    stats.morale = Math.max(0, stats.morale - penalty - streakPenalty);
  }
  
  // Neutral doesn't affect streak but slowly regresses morale towards 50
  if (outcome === 'neutral') {
    if (stats.morale > 50) {
      stats.morale = Math.max(50, stats.morale - 2);
    } else if (stats.morale < 50) {
      stats.morale = Math.min(50, stats.morale + 2);
    }
  }
  
  stats.moraleState = getMoraleState(stats.morale);
}

// ============================================================================
// COMPANION COMBAT ACTION RESOLUTION
// ============================================================================

export function resolveCompanionCombatAction(
  companion: CompanionState,
  combatStats: CompanionCombatStats,
  actionType: 'attack' | 'defend' | 'support' | 'special',
  enemyArmorProtection: number = 0,
  difficulty: DifficultyTier = 'NORMAL'
): CompanionCombatAction {
  // Roll the d20
  const naturalRoll = rollD20();
  
  // Calculate modifiers based on action type
  let relevantStat: number;
  switch (actionType) {
    case 'attack':
      // Use strength + dexterity average for attack
      relevantStat = Math.floor((combatStats.baseStrength + combatStats.baseDexterity) / 2);
      break;
    case 'defend':
      // Use constitution for defense
      relevantStat = combatStats.baseConstitution;
      break;
    case 'support':
      // Use wisdom + intelligence average for support
      relevantStat = Math.floor((combatStats.baseWisdom + combatStats.baseIntelligence) / 2);
      break;
    case 'special':
      // Use intelligence for special abilities
      relevantStat = combatStats.baseIntelligence;
      break;
    default:
      relevantStat = combatStats.baseDexterity;
  }
  
  const statModifier = calculateStatModifier(relevantStat);
  const sizeModifier = getSizeModifier(combatStats.size, 'accuracy');
  // Use dexterity as skill modifier (combat accuracy)
  const skillModifier = calculateStatModifier(combatStats.baseDexterity);
  const difficultyMod = DIFFICULTY_MODIFIERS[difficulty]?.modifier || 0;
  const moraleModifier = getMoraleModifier(combatStats.morale);
  
  const totalModifier = statModifier + sizeModifier + skillModifier + difficultyMod + moraleModifier;
  const totalRoll = naturalRoll + totalModifier;
  const targetDC = BASE_DC;
  
  // Determine outcome
  let outcome: CompanionCombatOutcome;
  if (naturalRoll === 1) {
    outcome = 'critical_failure';
  } else if (naturalRoll === 20) {
    outcome = 'critical_success';
  } else if (totalRoll >= targetDC + 5) {
    outcome = 'critical_success';
  } else if (totalRoll >= targetDC) {
    outcome = 'success';
  } else if (totalRoll >= targetDC - 3) {
    outcome = 'neutral';
  } else if (totalRoll >= targetDC - 7) {
    outcome = 'failure';
  } else {
    outcome = 'critical_failure';
  }
  
  // Update morale based on outcome
  updateMoraleAfterAction(combatStats, outcome);
  
  // Calculate effects
  let damageDealt = 0;
  let damageToPlayer = 0;
  let healToPlayer = 0;
  
  const baseDamage = combatStats.weaponDamage + getSizeModifier(combatStats.size, 'damage');
  
  switch (outcome) {
    case 'critical_success':
      if (actionType === 'attack' || actionType === 'special') {
        damageDealt = Math.max(1, Math.floor(baseDamage * 2) - enemyArmorProtection);
      } else if (actionType === 'support') {
        healToPlayer = 15 + Math.floor(Math.random() * 10);
      }
      break;
      
    case 'success':
      if (actionType === 'attack' || actionType === 'special') {
        damageDealt = Math.max(1, baseDamage - enemyArmorProtection);
      } else if (actionType === 'support') {
        healToPlayer = 8 + Math.floor(Math.random() * 7);
      }
      break;
      
    case 'neutral':
      // No effect
      break;
      
    case 'failure':
      // Minor damage to player from friendly fire or mishap
      if (actionType === 'attack' || actionType === 'special') {
        damageToPlayer = 3 + Math.floor(Math.random() * 5);
      }
      break;
      
    case 'critical_failure':
      // Significant damage to player
      if (actionType === 'attack' || actionType === 'special') {
        damageToPlayer = 8 + Math.floor(Math.random() * 10);
      } else if (actionType === 'support') {
        // Botched heal hurts player
        damageToPlayer = 5 + Math.floor(Math.random() * 5);
      }
      break;
  }
  
  // Generate narrative
  const narrative = generateCompanionCombatNarrative(
    companion.name,
    actionType,
    outcome,
    damageDealt,
    damageToPlayer,
    healToPlayer,
    naturalRoll
  );
  
  return {
    companionId: companion.id,
    companionName: companion.name,
    actionType,
    naturalRoll,
    statModifier,
    sizeModifier,
    skillModifier,
    totalRoll,
    targetDC,
    outcome,
    damageDealt,
    damageToPlayer,
    healToPlayer,
    narrative,
  };
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

function generateCompanionCombatNarrative(
  name: string,
  actionType: string,
  outcome: CompanionCombatOutcome,
  damageDealt: number,
  damageToPlayer: number,
  healToPlayer: number,
  naturalRoll: number
): string {
  const isCrit = naturalRoll === 20 || naturalRoll === 1;
  
  const narratives: Record<CompanionCombatOutcome, Record<string, string[]>> = {
    critical_success: {
      attack: [
        `${name} lands a devastating blow! 💥 (${damageDealt} damage)`,
        `${name}'s attack is perfectly placed, striking true! (${damageDealt} damage)`,
        `With incredible precision, ${name} delivers a crushing hit! (${damageDealt} damage)`,
      ],
      defend: [
        `${name} positions themselves perfectly, shielding you from harm!`,
        `${name} creates an impenetrable defense, protecting the party!`,
      ],
      support: [
        `${name} provides exceptional aid! (+${healToPlayer} HP)`,
        `${name}'s support is masterful, reinvigorating you! (+${healToPlayer} HP)`,
      ],
      special: [
        `${name} executes their special ability flawlessly! (${damageDealt} damage)`,
        `${name}'s signature move devastates the enemy! (${damageDealt} damage)`,
      ],
    },
    success: {
      attack: [
        `${name} strikes the enemy! (${damageDealt} damage)`,
        `${name}'s attack connects solidly. (${damageDealt} damage)`,
        `${name} lands a clean hit! (${damageDealt} damage)`,
      ],
      defend: [
        `${name} takes a protective stance, absorbing an attack.`,
        `${name} successfully shields an incoming blow.`,
      ],
      support: [
        `${name} provides timely support! (+${healToPlayer} HP)`,
        `${name} aids you effectively. (+${healToPlayer} HP)`,
      ],
      special: [
        `${name} uses their special ability! (${damageDealt} damage)`,
        `${name}'s skill pays off! (${damageDealt} damage)`,
      ],
    },
    neutral: {
      attack: [
        `${name}'s attack grazes the enemy but deals no real damage.`,
        `${name} swings but the enemy narrowly deflects.`,
      ],
      defend: [
        `${name} tries to defend but neither helps nor hinders.`,
        `${name}'s defensive maneuver has little effect.`,
      ],
      support: [
        `${name} attempts to help but the timing is off.`,
        `${name}'s support effort has no meaningful effect.`,
      ],
      special: [
        `${name}'s special ability fizzles harmlessly.`,
        `${name} attempts their skill but it misses the mark.`,
      ],
    },
    failure: {
      attack: [
        `⚠️ ${name} swings wildly and accidentally hits you! (${damageToPlayer} damage to you)`,
        `⚠️ ${name}'s attack goes awry, catching you instead! (${damageToPlayer} damage to you)`,
        `⚠️ ${name} misjudges and strikes you by mistake! (${damageToPlayer} damage to you)`,
      ],
      defend: [
        `⚠️ ${name} stumbles trying to defend, leaving you exposed!`,
        `⚠️ ${name}'s defensive stance fails, creating an opening for the enemy!`,
      ],
      support: [
        `⚠️ ${name}'s support attempt backfires slightly.`,
        `⚠️ ${name} tries to help but makes things awkward.`,
      ],
      special: [
        `⚠️ ${name}'s special ability misfires, hitting you! (${damageToPlayer} damage to you)`,
        `⚠️ ${name} loses control of their skill! (${damageToPlayer} damage to you)`,
      ],
    },
    critical_failure: {
      attack: [
        `💀 ${name} CRITICALLY FAILS! Their weapon strikes you hard! (${damageToPlayer} damage to you)`,
        `💀 DISASTER! ${name} completely misjudges and deals a heavy blow to you! (${damageToPlayer} damage to you)`,
        `💀 ${name}'s attack goes horribly wrong, seriously injuring you! (${damageToPlayer} damage to you)`,
      ],
      defend: [
        `💀 ${name} CRITICALLY FAILS to defend, knocking into you and leaving you vulnerable!`,
        `💀 ${name}'s defensive attempt is catastrophic, exposing you to attack!`,
      ],
      support: [
        `💀 ${name}'s support BACKFIRES terribly! (${damageToPlayer} damage to you)`,
        `💀 ${name}'s attempt to help goes disastrously wrong! (${damageToPlayer} damage to you)`,
      ],
      special: [
        `💀 ${name}'s special ability EXPLODES in failure! (${damageToPlayer} damage to you)`,
        `💀 ${name} loses all control, their skill becoming a hazard! (${damageToPlayer} damage to you)`,
      ],
    },
  };
  
  const options = narratives[outcome]?.[actionType] || [`${name} acts with ${outcome} result.`];
  return options[Math.floor(Math.random() * options.length)];
}

// ============================================================================
// RESOLVE ALL COMPANION ACTIONS IN A ROUND
// ============================================================================

export function resolveCompanionCombatRound(
  companions: Array<{ state: CompanionState; combatStats: CompanionCombatStats }>,
  enemyArmorProtection: number = 0,
  roundNumber: number = 1
): CompanionCombatRound {
  const actions: CompanionCombatAction[] = [];
  let totalDamageDealt = 0;
  let totalDamageToPlayer = 0;
  let totalHealToPlayer = 0;
  
  for (const { state, combatStats } of companions) {
    // Skip inactive companions
    if (state.status !== 'active') continue;
    
    // Skip companions with no health
    if (combatStats.currentHealth <= 0) continue;
    
    // Determine action based on role
    let actionType: 'attack' | 'defend' | 'support' | 'special' = 'attack';
    
    switch (state.combatRole) {
      case 'tank':
        actionType = Math.random() > 0.4 ? 'defend' : 'attack';
        break;
      case 'damage':
        actionType = Math.random() > 0.2 ? 'attack' : 'special';
        break;
      case 'support':
        actionType = Math.random() > 0.5 ? 'support' : 'attack';
        break;
      case 'ranged':
        actionType = Math.random() > 0.3 ? 'attack' : 'special';
        break;
    }
    
    const action = resolveCompanionCombatAction(
      state,
      combatStats,
      actionType,
      enemyArmorProtection
    );
    
    actions.push(action);
    totalDamageDealt += action.damageDealt;
    totalDamageToPlayer += action.damageToPlayer;
    totalHealToPlayer += action.healToPlayer;
    
    // Emit events
    if (action.damageDealt > 0) {
      eventBus.emit<CombatEvent>({
        type: 'DAMAGE_DEALT',
        tick: roundNumber,
        source: 'companionCombatSystem',
        priority: 'normal',
        data: {
          sourceEntity: state.id,
          targetEntity: 'enemy',
          amount: action.damageDealt,
        },
      });
    }
    
    if (action.damageToPlayer > 0) {
      eventBus.emit<CombatEvent>({
        type: 'DAMAGE_RECEIVED',
        tick: roundNumber,
        source: 'companionCombatSystem',
        priority: 'high',
        data: {
          targetEntity: 'player',
          sourceEntity: state.id,
          amount: action.damageToPlayer,
          woundType: 'friendly_fire',
          isHidden: false,
        },
      });
    }
  }
  
  return {
    roundNumber,
    actions,
    totalDamageDealt,
    totalDamageToPlayer,
    totalHealToPlayer,
  };
}

// ============================================================================
// COMPANION COMBAT MANAGER
// ============================================================================

class CompanionCombatManager {
  private companionCombatStats: Map<string, CompanionCombatStats> = new Map();
  
  // Initialize or get combat stats for a companion
  getOrCreateCombatStats(companion: CompanionState): CompanionCombatStats {
    let stats = this.companionCombatStats.get(companion.id);
    
    if (!stats) {
      stats = generateCompanionCombatStats(companion.combatRole, companion.skills);
      this.companionCombatStats.set(companion.id, stats);
      console.log(`[CompanionCombat] Generated combat stats for ${companion.name}:`, stats);
    }
    
    return stats;
  }
  
  // Get existing stats (returns undefined if not initialized)
  getCombatStats(companionId: string): CompanionCombatStats | undefined {
    return this.companionCombatStats.get(companionId);
  }
  
  // Update companion health after taking damage
  applyDamage(companionId: string, damage: number): void {
    const stats = this.companionCombatStats.get(companionId);
    if (stats) {
      stats.currentHealth = Math.max(0, stats.currentHealth - damage);
    }
  }
  
  // Heal companion
  heal(companionId: string, amount: number): void {
    const stats = this.companionCombatStats.get(companionId);
    if (stats) {
      stats.currentHealth = Math.min(stats.maxHealth, stats.currentHealth + amount);
    }
  }
  
  // Rest to restore energy
  restoreEnergy(companionId: string, amount: number): void {
    const stats = this.companionCombatStats.get(companionId);
    if (stats) {
      stats.currentEnergy = Math.min(100, stats.currentEnergy + amount);
    }
  }
  
  // Serialize for saving
  serialize(): Record<string, CompanionCombatStats> {
    const data: Record<string, CompanionCombatStats> = {};
    this.companionCombatStats.forEach((stats, id) => {
      data[id] = stats;
    });
    return data;
  }
  
  // Deserialize from save
  deserialize(data: Record<string, CompanionCombatStats>): void {
    this.companionCombatStats.clear();
    for (const [id, stats] of Object.entries(data)) {
      this.companionCombatStats.set(id, stats);
    }
  }
}

export const companionCombatManager = new CompanionCombatManager();

console.log('[CompanionCombatSystem] Initialized');
