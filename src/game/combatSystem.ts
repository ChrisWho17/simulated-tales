// Combat & Action Resolution System - Turn-based with skill checks
// Handles physical confrontations, stealth, and contested actions

import { NPC, GameState } from '@/types/game';
import { LifeSimPlayerState } from '@/types/lifeSim';
import { eventBus, CombatEvent } from './eventBus';
import { 
  performSkillCheck, 
  performContestedCheck,
  SkillCheckResult,
  ContestedCheckResult,
  SkillModifier,
  DifficultyLevel,
  SuccessDegree
} from './skillCheckSystem';

// ============= COMBAT TYPES =============

export type CombatAction = 
  | 'attack' 
  | 'defend' 
  | 'dodge' 
  | 'flee' 
  | 'intimidate' 
  | 'talk_down' 
  | 'submit'
  | 'grapple'
  | 'disarm';

export type CombatOutcome = 'victory' | 'defeat' | 'fled' | 'de_escalated' | 'standoff' | 'interrupted';

export interface CombatantStats {
  health: number;
  maxHealth: number;
  energy: number;
  combatSkill: number;
  dodgeSkill: number;
  intimidationSkill: number;
  persuasionSkill: number;
  weaponDamage: number;
  armorProtection: number;
  stressLevel: number;
}

export interface CombatRound {
  roundNumber: number;
  playerAction: CombatAction;
  npcAction: CombatAction;
  playerResult: SkillCheckResult | ContestedCheckResult;
  npcResult?: SkillCheckResult;
  damageDealt: number;
  damageTaken: number;
  narrative: string;
  stateChanges: CombatStateChange[];
}

export interface CombatStateChange {
  target: 'player' | string; // 'player' or NPC id
  type: 'health' | 'energy' | 'stress' | 'status';
  oldValue: number;
  newValue: number;
  cause: string;
}

export interface CombatEncounter {
  id: string;
  location: string;
  participants: string[]; // NPC ids
  rounds: CombatRound[];
  currentRound: number;
  isActive: boolean;
  outcome?: CombatOutcome;
  
  playerStats: CombatantStats;
  npcStats: Record<string, CombatantStats>;
  
  // Combat modifiers
  environmentModifiers: SkillModifier[];
  witnesses: string[];
  canFlee: boolean;
  fleeAttempts: number;
  maxFleeAttempts: number;
}

// ============= CLOTHING INTEGRATION =============

/**
 * Get clothing combat modifiers (lazy loaded to avoid circular deps)
 */
function getClothingCombatStats(): {
  armorBonus: number;
  intimidationBonus: number;
  persuasionBonus: number;
  dodgeBonus: number;
} {
  try {
    const { wardrobeManager } = require('./wardrobeSystem');
    const { fashionReputationManager } = require('./fashionReputationSystem');
    
    const clothingStats = wardrobeManager.getCurrentStats();
    const fashionBonuses = fashionReputationManager.getStatBonuses();
    
    return {
      armorBonus: (clothingStats.defense || 0) * 2,
      intimidationBonus: ((clothingStats.intimidation || 0) + (fashionBonuses.charisma || 0)) * 2,
      persuasionBonus: ((clothingStats.charisma || 0) + (fashionBonuses.charisma || 0)) * 2,
      dodgeBonus: clothingStats.stealth || 0,
    };
  } catch (e) {
    return { armorBonus: 0, intimidationBonus: 0, persuasionBonus: 0, dodgeBonus: 0 };
  }
}

// ============= WEAPON INTEGRATION =============

/**
 * Get equipped weapon stats from inventory (lazy loaded to avoid circular deps)
 */
function getEquippedWeaponStats(): {
  weaponDamage: number;
  weaponAccuracy: number;
  weaponRange: number;
  weaponName: string | null;
} {
  try {
    // Try to get inventory state from localStorage (where it's persisted)
    const inventoryJson = localStorage.getItem('living-world-inventory');
    if (!inventoryJson) {
      return { weaponDamage: 10, weaponAccuracy: 60, weaponRange: 10, weaponName: null };
    }
    
    const inventoryState = JSON.parse(inventoryJson);
    const equippedWeaponId = inventoryState.equipped?.primaryWeapon || inventoryState.equipped?.sidearm;
    
    if (!equippedWeaponId) {
      return { weaponDamage: 10, weaponAccuracy: 60, weaponRange: 10, weaponName: null };
    }
    
    const weapon = inventoryState.items?.find((item: any) => item.instanceId === equippedWeaponId);
    
    if (!weapon || weapon.category !== 'weapons') {
      return { weaponDamage: 10, weaponAccuracy: 60, weaponRange: 10, weaponName: null };
    }
    
    // Get base stats
    let damage = weapon.stats?.damage || 20;
    let accuracy = weapon.stats?.accuracy || 60;
    let range = weapon.stats?.range || 30;
    
    // Apply condition penalty if weapon has condition tracking
    if (weapon.condition) {
      const conditionPercent = (
        (100 - (weapon.condition.barrelWear || 0)) * 0.3 +
        (100 - (weapon.condition.riflingWear || 0)) * 0.3 +
        (100 - (weapon.condition.carbonBuildup || 0)) * 0.2 +
        (100 - (weapon.condition.springFatigue || 0)) * 0.2
      ) / 100;
      
      // Reduce damage/accuracy based on condition
      damage = Math.round(damage * conditionPercent);
      accuracy = Math.round(accuracy * conditionPercent);
    }
    
    console.log(`[Combat] Using equipped weapon: ${weapon.name} (DMG: ${damage}, ACC: ${accuracy})`);
    
    return { 
      weaponDamage: damage, 
      weaponAccuracy: accuracy, 
      weaponRange: range,
      weaponName: weapon.name 
    };
  } catch (e) {
    console.warn('[Combat] Failed to get weapon stats:', e);
    return { weaponDamage: 10, weaponAccuracy: 60, weaponRange: 10, weaponName: null };
  }
}

// ============= COMBAT INITIALIZATION =============

// Helper to clamp stat values to valid ranges
function clampStat(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value || 0));
}

export function initializeCombat(
  playerState: LifeSimPlayerState,
  npc: NPC,
  location: string,
  environmentMods: SkillModifier[] = []
): CombatEncounter {
  // Validate inputs
  if (!playerState || !npc) {
    throw new Error('[Combat] Cannot initialize combat without player state and NPC');
  }
  
  // Get clothing bonuses (safely)
  const clothingBonuses = getClothingCombatStats();
  
  // Get weapon stats from inventory
  const weaponStats = getEquippedWeaponStats();
  
  // Safely extract player stats with fallbacks
  const playerHealth = clampStat(playerState.needs?.physical?.health ?? 100);
  const playerEnergy = clampStat(playerState.needs?.physical?.energy ?? 100);
  const playerCombat = clampStat(playerState.skills?.physical?.combat ?? 20);
  const playerAthletics = clampStat(playerState.skills?.physical?.athletics ?? 20);
  const playerIntimidation = clampStat(playerState.skills?.social?.intimidation ?? 10);
  const playerPersuasion = clampStat(playerState.skills?.social?.persuasion ?? 10);
  const playerStress = clampStat(playerState.needs?.psychological?.stress ?? 0);
  
  // Calculate combat skill with weapon accuracy bonus
  const weaponAccuracyBonus = Math.floor((weaponStats.weaponAccuracy - 50) / 5); // +/-10 based on accuracy
  
  const playerStats: CombatantStats = {
    health: playerHealth,
    maxHealth: 100,
    energy: playerEnergy,
    combatSkill: clampStat(playerCombat + weaponAccuracyBonus), // Apply weapon accuracy
    dodgeSkill: clampStat(playerAthletics + clothingBonuses.dodgeBonus),
    intimidationSkill: clampStat(playerIntimidation + clothingBonuses.intimidationBonus),
    persuasionSkill: clampStat(playerPersuasion + clothingBonuses.persuasionBonus),
    weaponDamage: weaponStats.weaponDamage, // Use actual weapon damage
    armorProtection: clampStat(clothingBonuses.armorBonus, 0, 50), // Cap armor at 50%
    stressLevel: playerStress,
  };
  
  // Safely extract NPC stats with fallbacks
  const npcHealth = clampStat(npc.meta?.stats?.health ?? 50);
  const npcEnergy = clampStat(npc.meta?.stats?.energy ?? 50);
  const npcCombatSkill = clampStat(30 + Math.floor(npcHealth / 3));
  
  const npcStats: CombatantStats = {
    health: npcHealth,
    maxHealth: 100,
    energy: npcEnergy,
    combatSkill: npcCombatSkill,
    dodgeSkill: clampStat(npcCombatSkill - 10, 0),
    intimidationSkill: npc.meta?.traits?.includes('calm') ? 20 : npcCombatSkill,
    persuasionSkill: 30,
    weaponDamage: 10,
    armorProtection: npc.meta?.occupation?.includes('Guard') ? 15 : 0,
    stressLevel: clampStat(npc.stressLevel ?? 0),
  };
  
  return {
    id: `combat_${Date.now()}`,
    location: location || 'unknown',
    participants: [npc.id],
    rounds: [],
    currentRound: 0,
    isActive: true,
    playerStats,
    npcStats: { [npc.id]: npcStats },
    environmentModifiers: environmentMods || [],
    witnesses: [],
    canFlee: true,
    fleeAttempts: 0,
    maxFleeAttempts: 3,
  };
}

// ============= NPC COMBAT AI =============

function determineNPCAction(
  npc: NPC,
  npcStats: CombatantStats,
  playerStats: CombatantStats,
  roundNumber: number
): CombatAction {
  // NPCs choose based on their conflict style and situation
  const healthPercent = npcStats.health / npcStats.maxHealth;
  const playerHealthPercent = playerStats.health / playerStats.maxHealth;
  
  // Low health or high stress - consider fleeing or submitting
  if (healthPercent < 0.25 || npcStats.stressLevel > 80) {
    if (npc.conflictStyle === 'AVOIDANT' || npc.conflictStyle === 'RESIGNED') {
      return Math.random() < 0.6 ? 'flee' : 'submit';
    }
  }
  
  // Dominant NPCs prefer intimidation early
  if (npc.conflictStyle === 'DOMINANT' && roundNumber < 2) {
    return 'intimidate';
  }
  
  // Moralistic NPCs try to talk down first
  if (npc.conflictStyle === 'MORALISTIC' && roundNumber === 0) {
    return 'talk_down';
  }
  
  // If player is weak, press advantage
  if (playerHealthPercent < 0.3) {
    return 'attack';
  }
  
  // Default combat behavior
  const roll = Math.random();
  if (roll < 0.6) return 'attack';
  if (roll < 0.8) return 'defend';
  return 'dodge';
}

// ============= COMBAT RESOLUTION =============

export function resolveCombatRound(
  encounter: CombatEncounter,
  playerAction: CombatAction,
  playerSkills: LifeSimPlayerState['skills'],
  npc: NPC
): { 
  encounter: CombatEncounter; 
  narrative: string; 
  combatEnded: boolean;
  outcome?: CombatOutcome;
} {
  // Validate inputs to prevent crashes
  if (!encounter || !npc) {
    console.error('[Combat] Invalid encounter or NPC in resolveCombatRound');
    return {
      encounter: encounter || {} as CombatEncounter,
      narrative: 'Combat error: Invalid state',
      combatEnded: true,
      outcome: 'interrupted',
    };
  }
  
  const npcId = npc.id;
  const npcStats = encounter.npcStats[npcId];
  
  // Guard against missing NPC stats
  if (!npcStats) {
    console.error('[Combat] NPC stats not found for:', npcId);
    return {
      encounter,
      narrative: `${npc.meta?.name || 'Enemy'} has fled the battle!`,
      combatEnded: true,
      outcome: 'victory',
    };
  }
  
  const playerStats = encounter.playerStats;
  
  if (!playerStats) {
    console.error('[Combat] Player stats not found');
    return {
      encounter,
      narrative: 'Combat error: Player state missing',
      combatEnded: true,
      outcome: 'interrupted',
    };
  }
  
  const npcAction = determineNPCAction(npc, npcStats, playerStats, encounter.currentRound);
  
  let narrative = '';
  let damageDealt = 0;
  let damageTaken = 0;
  const stateChanges: CombatStateChange[] = [];
  let combatEnded = false;
  let outcome: CombatOutcome | undefined;
  
  // Resolve player action
  const playerResult = resolvePlayerAction(
    playerAction,
    playerStats,
    npcStats,
    playerSkills,
    encounter.environmentModifiers
  );
  
  // Apply player action effects
  switch (playerAction) {
    case 'attack':
      if (playerResult.success) {
        const baseDamage = playerStats.weaponDamage;
        const multiplier = playerResult.degree === 'critical_success' ? 2 : 1;
        damageDealt = Math.max(1, (baseDamage * multiplier) - npcStats.armorProtection);
        
        narrative += generateCombatNarrative('player_attack', playerResult.degree, npc.meta.name, damageDealt);
      } else {
        narrative += generateCombatNarrative('player_miss', playerResult.degree, npc.meta.name, 0);
      }
      break;
      
    case 'dodge':
      // Dodge affects the NPC's attack this round
      narrative += `You prepare to evade ${npc.meta.name}'s attack.`;
      break;
      
    case 'defend':
      narrative += `You take a defensive stance against ${npc.meta.name}.`;
      break;
      
    case 'flee':
      encounter.fleeAttempts++;
      if (playerResult.success && encounter.fleeAttempts <= encounter.maxFleeAttempts) {
        combatEnded = true;
        outcome = 'fled';
        narrative += `You manage to escape from ${npc.meta.name}!`;
      } else {
        narrative += `Your escape attempt fails! ${npc.meta.name} blocks your path.`;
      }
      break;
      
    case 'intimidate':
      if (playerResult.success) {
        if (playerResult.degree === 'critical_success') {
          combatEnded = true;
          outcome = 'de_escalated';
          narrative += `Your intimidating presence causes ${npc.meta.name} to back down completely!`;
        } else {
          npcStats.stressLevel = Math.min(100, npcStats.stressLevel + 20);
          narrative += `${npc.meta.name} seems shaken by your threat.`;
        }
      } else {
        narrative += `${npc.meta.name} is unimpressed by your attempt at intimidation.`;
      }
      break;
      
    case 'talk_down':
      if (playerResult.success) {
        if (playerResult.degree === 'critical_success') {
          combatEnded = true;
          outcome = 'de_escalated';
          narrative += `Your words reach ${npc.meta.name}. They lower their guard and the fight ends.`;
        } else {
          npcStats.stressLevel = Math.max(0, npcStats.stressLevel - 15);
          narrative += `${npc.meta.name} seems to be listening to reason.`;
        }
      } else {
        narrative += `${npc.meta.name} isn't interested in talking.`;
      }
      break;
      
    case 'submit':
      combatEnded = true;
      outcome = 'defeat';
      narrative += `You surrender to ${npc.meta.name}.`;
      break;
  }
  
  // Resolve NPC action (if combat continues)
  if (!combatEnded) {
    narrative += '\n\n';
    
    const npcAttackMod = playerAction === 'dodge' ? -20 : playerAction === 'defend' ? -10 : 0;
    const npcResult = resolveNPCAction(npcAction, npcStats, playerStats, npcAttackMod);
    
    switch (npcAction) {
      case 'attack':
        if (npcResult.success) {
          const baseDamage = npcStats.weaponDamage;
          const multiplier = npcResult.degree === 'critical_success' ? 2 : 1;
          damageTaken = Math.max(1, (baseDamage * multiplier) - playerStats.armorProtection);
          
          if (playerAction === 'defend') damageTaken = Math.floor(damageTaken * 0.5);
          if (playerAction === 'dodge' && !npcResult.success) damageTaken = 0;
          
          narrative += generateCombatNarrative('npc_attack', npcResult.degree, npc.meta.name, damageTaken);
        } else {
          narrative += generateCombatNarrative('npc_miss', npcResult.degree, npc.meta.name, 0);
        }
        break;
        
      case 'flee':
        if (npcResult.success) {
          combatEnded = true;
          outcome = 'victory'; // NPC fled counts as player victory
          narrative += `${npc.meta.name} turns and flees!`;
        } else {
          narrative += `${npc.meta.name} tries to run but you block their escape.`;
        }
        break;
        
      case 'submit':
        combatEnded = true;
        outcome = 'victory';
        narrative += `${npc.meta.name} surrenders!`;
        break;
        
      case 'defend':
      case 'dodge':
        narrative += `${npc.meta.name} takes a defensive stance.`;
        break;
        
      case 'intimidate':
        if (npcResult.success) {
          playerStats.stressLevel = Math.min(100, playerStats.stressLevel + 15);
          narrative += `${npc.meta.name}'s threatening stance makes you nervous.`;
        }
        break;
    }
    
    // Apply damage
    if (damageDealt > 0) {
      const newNpcHealth = Math.max(0, npcStats.health - damageDealt);
      stateChanges.push({
        target: npcId,
        type: 'health',
        oldValue: npcStats.health,
        newValue: newNpcHealth,
        cause: 'player_attack',
      });
      npcStats.health = newNpcHealth;
      
      // Emit DAMAGE_DEALT event
      eventBus.emit<CombatEvent>({
        type: 'DAMAGE_DEALT',
        tick: encounter.currentRound,
        source: 'combatSystem',
        priority: 'normal',
        data: {
          sourceEntity: 'player',
          targetEntity: npcId,
          amount: damageDealt,
        },
      });
      
      if (newNpcHealth <= 0) {
        combatEnded = true;
        outcome = 'victory';
        narrative += `\n\n**${npc.meta.name} collapses, defeated!**`;
        
        // Emit death event
        eventBus.emit<CombatEvent>({
          type: 'DEATH',
          tick: encounter.currentRound,
          source: 'combatSystem',
          priority: 'critical',
          data: {
            targetEntity: npcId,
            sourceEntity: 'player',
          },
        });
      }
    }
    
    if (damageTaken > 0) {
      const newPlayerHealth = Math.max(0, playerStats.health - damageTaken);
      stateChanges.push({
        target: 'player',
        type: 'health',
        oldValue: playerStats.health,
        newValue: newPlayerHealth,
        cause: 'npc_attack',
      });
      playerStats.health = newPlayerHealth;
      
      // Emit DAMAGE_RECEIVED event for adrenaline system
      eventBus.emit<CombatEvent>({
        type: 'DAMAGE_RECEIVED',
        tick: encounter.currentRound,
        source: 'combatSystem',
        priority: 'high',
        data: {
          targetEntity: 'player',
          sourceEntity: npcId,
          amount: damageTaken,
          woundType: 'combat_damage',
          isHidden: false,
        },
      });
      
      if (newPlayerHealth <= 0) {
        combatEnded = true;
        outcome = 'defeat';
        narrative += `\n\n**You collapse, unable to continue fighting!**`;
        
        // Emit knockout event
        eventBus.emit<CombatEvent>({
          type: 'KNOCKOUT',
          tick: encounter.currentRound,
          source: 'combatSystem',
          priority: 'critical',
          data: {
            targetEntity: 'player',
            sourceEntity: npcId,
          },
        });
      }
    }
  }
  
  // Create round record
  const round: CombatRound = {
    roundNumber: encounter.currentRound + 1,
    playerAction,
    npcAction,
    playerResult,
    damageDealt,
    damageTaken,
    narrative,
    stateChanges,
  };
  
  return {
    encounter: {
      ...encounter,
      rounds: [...encounter.rounds, round],
      currentRound: encounter.currentRound + 1,
      isActive: !combatEnded,
      outcome,
      playerStats: { ...playerStats },
      npcStats: { ...encounter.npcStats, [npcId]: { ...npcStats } },
    },
    narrative,
    combatEnded,
    outcome,
  };
}

function resolvePlayerAction(
  action: CombatAction,
  playerStats: CombatantStats,
  npcStats: CombatantStats,
  playerSkills: LifeSimPlayerState['skills'],
  envMods: SkillModifier[]
): SkillCheckResult {
  const actionSkillMap: Record<CombatAction, { category: 'physical' | 'social'; skill: string; difficulty: DifficultyLevel }> = {
    attack: { category: 'physical', skill: 'combat', difficulty: 'moderate' },
    defend: { category: 'physical', skill: 'combat', difficulty: 'easy' },
    dodge: { category: 'physical', skill: 'athletics', difficulty: 'moderate' },
    flee: { category: 'physical', skill: 'athletics', difficulty: 'hard' },
    intimidate: { category: 'social', skill: 'intimidation', difficulty: 'moderate' },
    talk_down: { category: 'social', skill: 'persuasion', difficulty: 'hard' },
    submit: { category: 'physical', skill: 'combat', difficulty: 'trivial' },
    grapple: { category: 'physical', skill: 'combat', difficulty: 'hard' },
    disarm: { category: 'physical', skill: 'combat', difficulty: 'very_hard' },
  };
  
  const mapping = actionSkillMap[action];
  
  // Add stress modifier
  const stressMod: SkillModifier = {
    source: 'Combat Stress',
    value: -Math.floor(playerStats.stressLevel / 10),
  };
  
  // Add energy modifier
  const energyMod: SkillModifier = {
    source: 'Fatigue',
    value: playerStats.energy < 30 ? -15 : playerStats.energy < 50 ? -5 : 0,
  };
  
  return performSkillCheck(
    playerSkills,
    mapping.category,
    mapping.skill,
    mapping.difficulty,
    [...envMods, stressMod, energyMod]
  );
}

function resolveNPCAction(
  action: CombatAction,
  npcStats: CombatantStats,
  playerStats: CombatantStats,
  modifier: number
): SkillCheckResult {
  // Simplified NPC roll
  const skillValue = action === 'attack' ? npcStats.combatSkill :
                     action === 'dodge' ? npcStats.dodgeSkill :
                     action === 'intimidate' ? npcStats.intimidationSkill : 30;
  
  const roll = Math.floor(Math.random() * 100) + 1;
  const targetNumber = Math.min(95, Math.max(5, skillValue + modifier));
  const margin = targetNumber - roll;
  const success = roll <= targetNumber;
  
  const degree: SuccessDegree = roll <= 5 ? 'critical_success' :
                                 roll >= 96 ? 'critical_fail' :
                                 margin >= 20 ? 'critical_success' :
                                 margin >= 0 ? 'success' :
                                 margin >= -10 ? 'partial' :
                                 margin >= -30 ? 'fail' : 'critical_fail';
  
  return {
    success,
    degree,
    roll,
    targetNumber,
    totalModifier: modifier,
    margin,
    skillUsed: 'npc_combat',
    narrativeHint: '',
    xpGained: 0,
  };
}

// ============= NARRATIVE GENERATION =============

function generateCombatNarrative(
  type: 'player_attack' | 'player_miss' | 'npc_attack' | 'npc_miss',
  degree: SuccessDegree,
  npcName: string,
  damage: number
): string {
  const narratives: Record<string, Record<SuccessDegree, string[]>> = {
    player_attack: {
      critical_success: [
        `Your strike finds a critical weak point! ${npcName} staggers from the devastating blow. (${damage} damage)`,
        `A perfect hit! ${npcName} reels from the impact. (${damage} damage)`,
      ],
      success: [
        `You land a solid blow on ${npcName}. (${damage} damage)`,
        `Your attack connects! ${npcName} grunts in pain. (${damage} damage)`,
      ],
      partial: [
        `You graze ${npcName} with a glancing blow. (${damage} damage)`,
      ],
      fail: [
        `Your attack misses ${npcName}.`,
        `${npcName} evades your strike.`,
      ],
      critical_fail: [
        `Your attack goes wide, leaving you off balance!`,
        `You stumble, completely missing your target!`,
      ],
    },
    npc_attack: {
      critical_success: [
        `${npcName} lands a devastating blow! (${damage} damage)`,
        `A critical hit from ${npcName}! (${damage} damage)`,
      ],
      success: [
        `${npcName} hits you! (${damage} damage)`,
        `${npcName}'s attack connects. (${damage} damage)`,
      ],
      partial: [
        `${npcName} barely clips you. (${damage} damage)`,
      ],
      fail: [
        `${npcName}'s attack misses you.`,
        `You avoid ${npcName}'s strike.`,
      ],
      critical_fail: [
        `${npcName} stumbles, their attack going completely wide!`,
        `${npcName} overextends and misses badly!`,
      ],
    },
    player_miss: {
      critical_success: [], success: [], partial: [],
      fail: [`Your attack fails to connect.`],
      critical_fail: [`You stumble badly, leaving yourself vulnerable!`],
    },
    npc_miss: {
      critical_success: [], success: [], partial: [],
      fail: [`${npcName} misses.`],
      critical_fail: [`${npcName} stumbles badly!`],
    },
  };
  
  const options = narratives[type][degree];
  return options[Math.floor(Math.random() * options.length)] || '';
}

// ============= COMBAT AFTERMATH =============

export interface CombatAftermath {
  playerHealthLost: number;
  playerEnergyLost: number;
  playerStressGained: number;
  xpGained: number;
  reputationChange: number;
  npcRelationshipChange: number;
  consequences: string[];
}

export function calculateCombatAftermath(
  encounter: CombatEncounter,
  npc: NPC,
  outcome: CombatOutcome
): CombatAftermath {
  const playerHealthLost = encounter.playerStats.maxHealth - encounter.playerStats.health;
  const playerEnergyLost = Math.min(30, encounter.rounds.length * 5);
  
  let playerStressGained = 0;
  let xpGained = 0;
  let reputationChange = 0;
  let npcRelationshipChange = 0;
  const consequences: string[] = [];
  
  switch (outcome) {
    case 'victory':
      xpGained = 10 + encounter.rounds.length * 2;
      playerStressGained = 10;
      reputationChange = npc.meta.occupation.includes('Guard') ? -15 : 5;
      npcRelationshipChange = -30;
      consequences.push(`${npc.meta.name} will remember this.`);
      if (encounter.witnesses.length > 0) {
        consequences.push('There were witnesses to this fight.');
      }
      break;
      
    case 'defeat':
      playerStressGained = 30;
      npcRelationshipChange = -20;
      consequences.push('You have been defeated. This may have lasting consequences.');
      break;
      
    case 'fled':
      playerStressGained = 15;
      xpGained = 2;
      consequences.push(`You escaped from ${npc.meta.name}.`);
      break;
      
    case 'de_escalated':
      xpGained = 15; // Bonus for peaceful resolution
      playerStressGained = 5;
      npcRelationshipChange = 10; // Slight improvement for not fighting
      consequences.push('The situation was resolved without violence.');
      break;
  }
  
  return {
    playerHealthLost,
    playerEnergyLost,
    playerStressGained,
    xpGained,
    reputationChange,
    npcRelationshipChange,
    consequences,
  };
}

export function formatCombatOptions(): string {
  return `**Combat Actions:**
• **attack** - Strike your opponent
• **defend** - Take a defensive stance (reduces damage)
• **dodge** - Try to avoid attacks (may avoid damage entirely)
• **intimidate** - Attempt to scare your opponent into backing down
• **talk** - Try to de-escalate with words
• **flee** - Attempt to escape (limited attempts)
• **submit** - Surrender`;
}
