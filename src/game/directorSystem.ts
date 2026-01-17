// ============================================================================
// DIRECTOR SYSTEM - Pacing rules, cooldowns, beat scheduling, escalation
// Prevents systems from all firing every turn
// ============================================================================

import { eventBus, GameBusEvent } from './eventBus';

// ============= PRIORITY HIERARCHY =============

export type SystemPriority = 
  | 'SAFETY'      // Player death, critical needs - always wins
  | 'COMBAT'      // Active combat
  | 'CRISIS'      // Urgent non-combat situations
  | 'SOCIAL'      // NPC interactions
  | 'EXPLORATION' // Movement, discovery
  | 'NARRATIVE'   // Story beats
  | 'AMBIENT';    // Background systems

const PRIORITY_ORDER: SystemPriority[] = [
  'SAFETY', 'COMBAT', 'CRISIS', 'SOCIAL', 'EXPLORATION', 'NARRATIVE', 'AMBIENT'
];

// ============= DIRECTOR STATE =============

interface SystemCooldown {
  system: string;
  availableAt: number;  // Tick when system can act again
  reason: string;
}

interface StoryBeat {
  id: string;
  name: string;
  triggeredAt: number;
  cooldownUntil: number;
}

interface DirectorState {
  currentPriority: SystemPriority;
  escalationLevel: number;          // 0-100 scene tension
  cooldowns: SystemCooldown[];
  recentBeats: StoryBeat[];
  actionsThisTurn: string[];        // Systems that acted this turn
  turnsAtPriority: number;          // How long at current priority
  lastTick: number;
}

let directorState: DirectorState = {
  currentPriority: 'AMBIENT',
  escalationLevel: 0,
  cooldowns: [],
  recentBeats: [],
  actionsThisTurn: [],
  turnsAtPriority: 0,
  lastTick: 0,
};

// ============= COOLDOWN CONFIGURATION =============

// Default cooldowns in ticks for different action types
const DEFAULT_COOLDOWNS: Record<string, number> = {
  // Combat actions
  'combat_major': 2,        // Major combat events need spacing
  'combat_critical': 4,     // Critical hits/misses
  
  // Social actions  
  'relationship_shift': 3,  // Significant relationship changes
  'romance_progress': 5,    // Romance milestones
  'betrayal': 10,           // Major betrayals need breathing room
  
  // Narrative
  'quest_start': 5,
  'quest_complete': 3,
  'revelation': 8,          // Major story reveals
  'twist': 15,              // Plot twists need significant spacing
  
  // Environment
  'weather_change': 12,
  'time_skip': 6,
  
  // Needs
  'need_warning': 4,        // Don't spam need warnings
  'desperation_unlock': 10,
};

// Beat type cooldowns (prevent same beat type too often)
const BEAT_COOLDOWNS: Record<string, number> = {
  'combat_encounter': 8,
  'social_confrontation': 6,
  'discovery': 5,
  'quiet_moment': 3,
  'flashback': 12,
  'cliffhanger': 20,
};

// ============= PRIORITY RESOLUTION =============

export interface PriorityContext {
  playerHealth: number;
  inCombat: boolean;
  criticalNeeds: string[];
  activeConversation: boolean;
  recentDamage: boolean;
  pendingQuest: boolean;
  explorationMode: boolean;
}

export function resolveSystemPriority(context: PriorityContext): SystemPriority {
  // SAFETY always wins
  if (context.playerHealth <= 10 || context.criticalNeeds.includes('health')) {
    return 'SAFETY';
  }
  
  // Combat takes precedence
  if (context.inCombat || context.recentDamage) {
    return 'COMBAT';
  }
  
  // Critical non-health needs
  if (context.criticalNeeds.length > 0) {
    return 'CRISIS';
  }
  
  // Active social interactions
  if (context.activeConversation) {
    return 'SOCIAL';
  }
  
  // Active exploration
  if (context.explorationMode) {
    return 'EXPLORATION';
  }
  
  // Pending narrative
  if (context.pendingQuest) {
    return 'NARRATIVE';
  }
  
  return 'AMBIENT';
}

export function updatePriority(context: PriorityContext, tick: number): void {
  const newPriority = resolveSystemPriority(context);
  
  if (newPriority !== directorState.currentPriority) {
    directorState.currentPriority = newPriority;
    directorState.turnsAtPriority = 0;
  } else {
    directorState.turnsAtPriority++;
  }
  
  directorState.lastTick = tick;
  directorState.actionsThisTurn = [];
}

// ============= COOLDOWN MANAGEMENT =============

export function setSystemCooldown(
  system: string, 
  ticks: number, 
  tick: number, 
  reason: string = ''
): void {
  // Remove existing cooldown for this system
  directorState.cooldowns = directorState.cooldowns.filter(c => c.system !== system);
  
  // Add new cooldown
  directorState.cooldowns.push({
    system,
    availableAt: tick + ticks,
    reason,
  });
}

export function isSystemOnCooldown(system: string, tick: number): boolean {
  const cooldown = directorState.cooldowns.find(c => c.system === system);
  return cooldown ? cooldown.availableAt > tick : false;
}

export function getSystemCooldownRemaining(system: string, tick: number): number {
  const cooldown = directorState.cooldowns.find(c => c.system === system);
  if (!cooldown) return 0;
  return Math.max(0, cooldown.availableAt - tick);
}

export function clearExpiredCooldowns(tick: number): void {
  directorState.cooldowns = directorState.cooldowns.filter(c => c.availableAt > tick);
}

// ============= SYSTEM ACTION GATING =============

export function canSystemAct(
  system: string,
  requiredPriority: SystemPriority,
  tick: number
): { allowed: boolean; reason: string } {
  // Check cooldown first
  if (isSystemOnCooldown(system, tick)) {
    const remaining = getSystemCooldownRemaining(system, tick);
    return { 
      allowed: false, 
      reason: `On cooldown for ${remaining} more ticks` 
    };
  }
  
  // Check if already acted this turn
  if (directorState.actionsThisTurn.includes(system)) {
    return {
      allowed: false,
      reason: 'Already acted this turn',
    };
  }
  
  // Check priority hierarchy
  const currentIdx = PRIORITY_ORDER.indexOf(directorState.currentPriority);
  const requiredIdx = PRIORITY_ORDER.indexOf(requiredPriority);
  
  // Higher priority (lower index) can always act
  if (requiredIdx < currentIdx) {
    return { allowed: true, reason: 'Higher priority' };
  }
  
  // Same priority can act
  if (requiredIdx === currentIdx) {
    return { allowed: true, reason: 'Matching priority' };
  }
  
  // Lower priority can only act if current is AMBIENT
  if (directorState.currentPriority === 'AMBIENT') {
    return { allowed: true, reason: 'Ambient mode allows all' };
  }
  
  return {
    allowed: false,
    reason: `Priority too low (need ${requiredPriority}, current ${directorState.currentPriority})`,
  };
}

export function recordSystemAction(system: string, tick: number, cooldownType?: string): void {
  directorState.actionsThisTurn.push(system);
  
  // Apply default cooldown if specified
  if (cooldownType && DEFAULT_COOLDOWNS[cooldownType]) {
    setSystemCooldown(system, DEFAULT_COOLDOWNS[cooldownType], tick, cooldownType);
  }
}

// ============= BEAT SCHEDULING =============

export function canTriggerBeat(beatType: string, tick: number): boolean {
  const cooldown = BEAT_COOLDOWNS[beatType] || 5;
  const recentBeat = directorState.recentBeats.find(b => b.name === beatType);
  
  if (recentBeat && recentBeat.cooldownUntil > tick) {
    return false;
  }
  
  return true;
}

// Limits for director state
const MAX_RECENT_BEATS = 20;
const MAX_COOLDOWNS = 50;

export function recordBeat(beatType: string, tick: number): void {
  const cooldown = BEAT_COOLDOWNS[beatType] || 5;
  
  // Remove old beat of same type
  directorState.recentBeats = directorState.recentBeats.filter(b => b.name !== beatType);
  
  // Add new beat
  directorState.recentBeats.push({
    id: `beat_${tick}_${Math.random().toString(36).substr(2, 6)}`,
    name: beatType,
    triggeredAt: tick,
    cooldownUntil: tick + cooldown,
  });
  
  // Keep only last 20 beats
  if (directorState.recentBeats.length > MAX_RECENT_BEATS) {
    directorState.recentBeats = directorState.recentBeats.slice(-MAX_RECENT_BEATS);
  }
  
  // Also prune cooldowns to prevent unbounded growth
  if (directorState.cooldowns.length > MAX_COOLDOWNS) {
    directorState.cooldowns = directorState.cooldowns
      .sort((a, b) => b.availableAt - a.availableAt)
      .slice(0, MAX_COOLDOWNS);
  }
}

export function getRecentBeats(count: number = 10): StoryBeat[] {
  return directorState.recentBeats.slice(-count);
}

// ============= ESCALATION MANAGEMENT =============

export function adjustEscalation(delta: number): void {
  directorState.escalationLevel = Math.max(0, Math.min(100, 
    directorState.escalationLevel + delta
  ));
}

export function setEscalation(level: number): void {
  directorState.escalationLevel = Math.max(0, Math.min(100, level));
}

export function getEscalationLevel(): number {
  return directorState.escalationLevel;
}

// Natural escalation decay over time
export function decayEscalation(tick: number): void {
  // Decay faster in AMBIENT, slower in combat/crisis
  const decayRate = directorState.currentPriority === 'AMBIENT' ? 2 :
                    directorState.currentPriority === 'COMBAT' ? 0.2 :
                    directorState.currentPriority === 'CRISIS' ? 0.5 : 1;
  
  directorState.escalationLevel = Math.max(0, 
    directorState.escalationLevel - decayRate
  );
}

// ============= STATE ACCESS =============

export function getDirectorState(): DirectorState {
  return { ...directorState };
}

export function resetDirectorState(): void {
  directorState = {
    currentPriority: 'AMBIENT',
    escalationLevel: 0,
    cooldowns: [],
    recentBeats: [],
    actionsThisTurn: [],
    turnsAtPriority: 0,
    lastTick: 0,
  };
}

// ============= TICK PROCESSING =============

export function processDirectorTick(context: PriorityContext, tick: number): void {
  clearExpiredCooldowns(tick);
  updatePriority(context, tick);
  decayEscalation(tick);
}

// ============= CONTEXT FOR AI =============

export function buildDirectorContextForAI(): string {
  const lines: string[] = [
    '## PACING STATE',
    `Current Priority: ${directorState.currentPriority}`,
    `Escalation: ${directorState.escalationLevel}%`,
    `Turns at priority: ${directorState.turnsAtPriority}`,
  ];
  
  const recentBeats = directorState.recentBeats.slice(-5);
  if (recentBeats.length > 0) {
    lines.push('', 'Recent story beats:');
    for (const beat of recentBeats) {
      lines.push(`- ${beat.name} (${directorState.lastTick - beat.triggeredAt} ticks ago)`);
    }
  }
  
  const activeCooldowns = directorState.cooldowns.filter(c => c.availableAt > directorState.lastTick);
  if (activeCooldowns.length > 0) {
    lines.push('', 'System cooldowns:');
    for (const cd of activeCooldowns.slice(0, 5)) {
      lines.push(`- ${cd.system}: ${cd.availableAt - directorState.lastTick} ticks (${cd.reason})`);
    }
  }
  
  return lines.join('\n');
}

// ============= SERIALIZATION =============

export function serializeDirectorState(): string {
  return JSON.stringify(directorState);
}

export function deserializeDirectorState(data: string): void {
  try {
    directorState = JSON.parse(data);
  } catch (e) {
    console.error('[Director] Failed to deserialize:', e);
    resetDirectorState();
  }
}
