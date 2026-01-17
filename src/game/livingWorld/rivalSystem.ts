// ============================================================================
// RIVAL SYSTEM - Competition that wants, moves, adapts
// Rivals want things. They notice you. They move.
// ============================================================================

export type RivalType = 'individual' | 'business' | 'gang' | 'corporation';
export type DispositionLevel = 'friendly' | 'neutral' | 'tense' | 'hostile' | 'war';
export type MoveCategory = 'economic' | 'social' | 'direct';

export interface RivalPersonality {
  aggression: number;      // 0-100
  patience: number;        // 0-100
  ruthlessness: number;    // 0-100
  pride: number;           // 0-100
  greed: number;           // 0-100
}

export interface RivalResources {
  money: number;
  muscle: number;          // Combat capability 0-100
  connections: number;     // Social influence 0-100
  intel: number;           // Information network 0-100
}

export interface RivalDomain {
  territories: string[];   // Zone IDs
  businesses: string[];    // Business IDs
  properties: string[];    // Property IDs
  markets: string[];       // Market segments
  influence: number;       // Overall influence 0-100
}

export interface RivalDesire {
  type: 'territory' | 'property' | 'market_share' | 'elimination' | 'respect' | 'revenge';
  target?: string;
  description: string;
  priority: number;        // 1-10
}

export interface RivalVulnerability {
  type: 'debt' | 'secret' | 'addiction' | 'family' | 'legal' | 'rival';
  description: string;
  severity: number;        // 1-10
  knownToPlayer: boolean;
}

export interface WorldRival {
  id: string;
  name: string;
  npcId?: string;          // Link to NPC system
  type: RivalType;
  description?: string;
  
  // What they control/want
  domain: RivalDomain;
  desires: RivalDesire[];
  
  // Resources
  resources: RivalResources;
  
  // Personality
  personality: RivalPersonality;
  
  // Weaknesses
  vulnerabilities: RivalVulnerability[];
  
  // State
  isActive: boolean;
  currentFocus: string | null;
  currentPlan: string | null;
  lastAction: string | null;
  lastActionDate: number | null;
  
  // Meta
  created: number;
  lastUpdate: number;
}

export interface RivalryHistory {
  event: string;
  date: number;
  respectChange?: number;
  fearChange?: number;
  move?: string;
}

export interface ActiveConflict {
  id: string;
  type: 'property' | 'territory' | 'market' | 'personal';
  target: string;
  startDate: number;
  escalationLevel: number;  // 1-5
  playerActions: string[];
  rivalActions: string[];
  resolved?: boolean;
  winner?: string;
  terms?: Record<string, unknown>;
  resolvedDate?: number;
}

export interface Truce {
  id: string;
  terms: Record<string, unknown>;
  startDate: number;
  duration: number | null;
  violations: Array<{ date: number; by: string; description: string }>;
}

export interface RivalryState {
  rivalId: string;
  disposition: DispositionLevel;
  respect: number;         // -100 to 100
  fear: number;            // 0 to 100
  history: RivalryHistory[];
  activeConflicts: ActiveConflict[];
  truces: Truce[];
  lastInteraction: number | null;
}

export interface RivalMove {
  type: string;
  category: MoveCategory;
  aggression: number;
  description: string;
  effects: {
    playerIncome?: number;
    playerMoney?: number;
    playerStaff?: number;
    playerCosts?: number;
    playerReputation?: number;
    playerAllies?: number;
    playerProperty?: number;
    playerHealth?: number;
    playerDeath?: boolean;
    playerFear?: number;
    rivalMoney?: number;
    rivalry?: number;
    mustRespond?: boolean;
  };
}

export type RivalEvent =
  | { type: 'relationship_changed'; rivalId: string; rivalry: RivalryState; changes: Partial<RivalryState> }
  | { type: 'disposition_changed'; rivalId: string; oldDisposition: DispositionLevel; newDisposition: DispositionLevel }
  | { type: 'rival_move'; rivalId: string; rival: WorldRival; moveType: string; move: RivalMove; effects: RivalMove['effects'] }
  | { type: 'conflict_started'; rivalId: string; conflict: ActiveConflict }
  | { type: 'conflict_escalated'; rivalId: string; conflict: ActiveConflict }
  | { type: 'conflict_resolved'; rivalId: string; conflict: ActiveConflict; winner: string; terms?: Record<string, unknown> }
  | { type: 'truce_accepted'; rivalId: string; truce: Truce }
  | { type: 'truce_rejected'; rivalId: string; terms: Record<string, unknown> };

// ============================================================================
// MOVE TYPES
// ============================================================================

const MOVE_TYPES: Record<string, RivalMove> = {
  // Economic
  undercut_prices: {
    type: 'undercut_prices',
    category: 'economic',
    aggression: 20,
    description: 'Lowering prices to steal customers',
    effects: { playerIncome: -0.2, rivalMoney: -500 }
  },
  poach_employee: {
    type: 'poach_employee',
    category: 'economic',
    aggression: 30,
    description: 'Offering your best people more money',
    effects: { playerStaff: -1, rivalMoney: -2000 }
  },
  buyout_supplier: {
    type: 'buyout_supplier',
    category: 'economic',
    aggression: 40,
    description: 'Buying exclusive deals with your suppliers',
    effects: { playerCosts: 0.3, rivalMoney: -5000 }
  },
  hostile_acquisition: {
    type: 'hostile_acquisition',
    category: 'economic',
    aggression: 60,
    description: 'Trying to buy your business or property',
    effects: { rivalry: -20 }
  },
  
  // Social
  spread_rumors: {
    type: 'spread_rumors',
    category: 'social',
    aggression: 30,
    description: 'Talking shit about you',
    effects: { playerReputation: -10 }
  },
  seduce_ally: {
    type: 'seduce_ally',
    category: 'social',
    aggression: 40,
    description: 'Turning your friends/allies',
    effects: { playerAllies: -1 }
  },
  public_challenge: {
    type: 'public_challenge',
    category: 'social',
    aggression: 50,
    description: 'Calling you out publicly',
    effects: { mustRespond: true }
  },
  blackmail: {
    type: 'blackmail',
    category: 'social',
    aggression: 70,
    description: 'Using information against you',
    effects: { playerMoney: -5000, rivalry: -30 }
  },
  
  // Direct
  intimidation: {
    type: 'intimidation',
    category: 'direct',
    aggression: 50,
    description: 'Sending a message',
    effects: { playerFear: 10 }
  },
  sabotage: {
    type: 'sabotage',
    category: 'direct',
    aggression: 60,
    description: 'Damaging your property or operations',
    effects: { playerProperty: -20 }
  },
  robbery: {
    type: 'robbery',
    category: 'direct',
    aggression: 70,
    description: 'Taking what\'s yours',
    effects: { playerMoney: -2000, rivalry: -40 }
  },
  assault: {
    type: 'assault',
    category: 'direct',
    aggression: 80,
    description: 'Physical attack',
    effects: { playerHealth: -30, rivalry: -50 }
  },
  hit: {
    type: 'hit',
    category: 'direct',
    aggression: 100,
    description: 'Attempting to kill',
    effects: { playerDeath: true }
  }
};

// ============================================================================
// RIVAL SYSTEM
// ============================================================================

class RivalSystemClass {
  private rivals: Map<string, WorldRival> = new Map();
  private playerRivalries: Map<string, RivalryState> = new Map();
  private listeners: Array<(event: RivalEvent) => void> = [];

  // ========== RIVAL CREATION ==========

  createRival(data: Partial<WorldRival> & { name: string }): WorldRival {
    const rival: WorldRival = {
      id: data.id || `rival_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      npcId: data.npcId,
      type: data.type || 'individual',
      description: data.description,
      
      domain: data.domain || {
        territories: [],
        businesses: [],
        properties: [],
        markets: [],
        influence: 0
      },
      desires: data.desires || [],
      
      resources: data.resources || {
        money: 10000,
        muscle: 0,
        connections: 0,
        intel: 0
      },
      
      personality: data.personality || {
        aggression: 50,
        patience: 50,
        ruthlessness: 50,
        pride: 50,
        greed: 50
      },
      
      vulnerabilities: data.vulnerabilities || [],
      
      isActive: data.isActive ?? true,
      currentFocus: null,
      currentPlan: null,
      lastAction: null,
      lastActionDate: null,
      
      created: Date.now(),
      lastUpdate: Date.now()
    };

    this.rivals.set(rival.id, rival);
    return rival;
  }

  // ========== PLAYER-RIVAL RELATIONSHIP ==========

  getRivalry(rivalId: string): RivalryState {
    if (!this.playerRivalries.has(rivalId)) {
      this.playerRivalries.set(rivalId, {
        rivalId,
        disposition: 'neutral',
        respect: 50,
        fear: 0,
        history: [],
        activeConflicts: [],
        truces: [],
        lastInteraction: null
      });
    }
    return this.playerRivalries.get(rivalId)!;
  }

  modifyRelationship(rivalId: string, changes: {
    respect?: number;
    fear?: number;
    event?: string;
  }): void {
    const rivalry = this.getRivalry(rivalId);
    
    if (changes.respect !== undefined) {
      rivalry.respect = Math.max(-100, Math.min(100, rivalry.respect + changes.respect));
    }
    if (changes.fear !== undefined) {
      rivalry.fear = Math.max(0, Math.min(100, rivalry.fear + changes.fear));
    }

    this.updateDisposition(rivalId);

    if (changes.event) {
      rivalry.history.push({
        event: changes.event,
        date: Date.now(),
        respectChange: changes.respect || 0,
        fearChange: changes.fear || 0
      });
    }

    rivalry.lastInteraction = Date.now();

    this.notify({
      type: 'relationship_changed',
      rivalId,
      rivalry: { ...rivalry },
      changes
    });
  }

  private updateDisposition(rivalId: string): void {
    const rivalry = this.getRivalry(rivalId);
    const oldDisposition = rivalry.disposition;

    if (rivalry.respect >= 50 && rivalry.activeConflicts.length === 0) {
      rivalry.disposition = 'friendly';
    } else if (rivalry.respect >= 0 && rivalry.activeConflicts.length === 0) {
      rivalry.disposition = 'neutral';
    } else if (rivalry.respect > -30 || rivalry.fear > 60) {
      rivalry.disposition = 'tense';
    } else if (rivalry.respect > -70) {
      rivalry.disposition = 'hostile';
    } else {
      rivalry.disposition = 'war';
    }

    if (oldDisposition !== rivalry.disposition) {
      this.notify({
        type: 'disposition_changed',
        rivalId,
        oldDisposition,
        newDisposition: rivalry.disposition
      });
    }
  }

  // ========== RIVAL ACTIONS ==========

  decideMove(rivalId: string): RivalMove | null {
    const rival = this.rivals.get(rivalId);
    const rivalry = this.getRivalry(rivalId);
    if (!rival || !rival.isActive) return null;

    let aggressionThreshold = rival.personality.aggression;

    switch (rivalry.disposition) {
      case 'friendly': aggressionThreshold = 0; break;
      case 'neutral': aggressionThreshold *= 0.3; break;
      case 'tense': aggressionThreshold *= 0.6; break;
      case 'hostile': aggressionThreshold *= 0.9; break;
      case 'war': aggressionThreshold *= 1.2; break;
    }

    if (rivalry.fear > 50) {
      aggressionThreshold *= 0.5;
    }

    const availableMoves = Object.entries(MOVE_TYPES)
      .filter(([_, move]) => move.aggression <= aggressionThreshold)
      .filter(([_, move]) => this.canAffordMove(rival, move))
      .map(([type, move]) => ({ ...move, type }));

    if (availableMoves.length === 0) return null;

    const weights = availableMoves.map(move => {
      let weight = 1;
      if (move.category === 'economic' && rival.resources.money > 5000) weight *= 1.5;
      if (move.category === 'social' && rival.resources.connections > 30) weight *= 1.5;
      if (move.category === 'direct' && rival.resources.muscle > 30) weight *= 1.5;
      if (rival.personality.ruthlessness > 70) weight *= (move.aggression / 50);
      return weight;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < availableMoves.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return availableMoves[i];
      }
    }

    return availableMoves[0];
  }

  private canAffordMove(rival: WorldRival, move: RivalMove): boolean {
    if (move.effects?.rivalMoney && rival.resources.money < Math.abs(move.effects.rivalMoney)) {
      return false;
    }
    return true;
  }

  executeMove(rivalId: string, moveType: string): { success: boolean; move?: RivalMove; effects?: RivalMove['effects'] } {
    const rival = this.rivals.get(rivalId);
    const move = MOVE_TYPES[moveType];
    if (!rival || !move) return { success: false };

    const rivalry = this.getRivalry(rivalId);

    if (move.effects?.rivalMoney) {
      rival.resources.money += move.effects.rivalMoney;
    }

    rival.lastAction = moveType;
    rival.lastActionDate = Date.now();

    rivalry.history.push({
      event: `rival_${moveType}`,
      date: Date.now(),
      move: moveType
    });

    this.notify({
      type: 'rival_move',
      rivalId,
      rival,
      moveType,
      move,
      effects: move.effects
    });

    return { success: true, move, effects: move.effects };
  }

  // ========== CONFLICT MANAGEMENT ==========

  startConflict(rivalId: string, conflictType: ActiveConflict['type'], target: string): ActiveConflict {
    const rivalry = this.getRivalry(rivalId);

    const conflict: ActiveConflict = {
      id: `conflict_${Date.now()}`,
      type: conflictType,
      target,
      startDate: Date.now(),
      escalationLevel: 1,
      playerActions: [],
      rivalActions: []
    };

    rivalry.activeConflicts.push(conflict);
    this.updateDisposition(rivalId);

    this.notify({
      type: 'conflict_started',
      rivalId,
      conflict
    });

    return conflict;
  }

  escalateConflict(rivalId: string, conflictId: string): void {
    const rivalry = this.getRivalry(rivalId);
    const conflict = rivalry.activeConflicts.find(c => c.id === conflictId);
    if (!conflict) return;

    conflict.escalationLevel = Math.min(5, conflict.escalationLevel + 1);

    this.modifyRelationship(rivalId, {
      respect: -10,
      event: 'conflict_escalated'
    });

    this.notify({
      type: 'conflict_escalated',
      rivalId,
      conflict
    });
  }

  resolveConflict(rivalId: string, conflictId: string, winner: string, terms: Record<string, unknown> = {}): void {
    const rivalry = this.getRivalry(rivalId);
    const idx = rivalry.activeConflicts.findIndex(c => c.id === conflictId);
    if (idx === -1) return;

    const conflict = rivalry.activeConflicts.splice(idx, 1)[0];
    conflict.resolved = true;
    conflict.winner = winner;
    conflict.terms = terms;
    conflict.resolvedDate = Date.now();

    if (winner === 'player') {
      this.modifyRelationship(rivalId, {
        respect: 20,
        fear: 15,
        event: 'conflict_won_by_player'
      });
    } else {
      this.modifyRelationship(rivalId, {
        respect: -20,
        fear: -10,
        event: 'conflict_lost_by_player'
      });
    }

    this.updateDisposition(rivalId);

    this.notify({
      type: 'conflict_resolved',
      rivalId,
      conflict,
      winner,
      terms
    });
  }

  // ========== TRUCES ==========

  proposeTruce(rivalId: string, terms: Record<string, unknown>): { accepted: boolean; truce?: Truce } {
    const rivalry = this.getRivalry(rivalId);
    const rival = this.rivals.get(rivalId);
    if (!rival) return { accepted: false };

    let acceptChance = 0.3;
    if (rivalry.fear > 50) acceptChance += 0.3;
    if (rivalry.respect > 0) acceptChance += 0.2;
    if (rival.personality.patience > 60) acceptChance += 0.1;
    if (rivalry.disposition === 'war') acceptChance -= 0.2;

    const accepted = Math.random() < acceptChance;

    if (accepted) {
      const truce: Truce = {
        id: `truce_${Date.now()}`,
        terms,
        startDate: Date.now(),
        duration: (terms.duration as number) || null,
        violations: []
      };

      rivalry.truces.push(truce);

      if (terms.clearConflicts) {
        rivalry.activeConflicts = [];
      }

      this.updateDisposition(rivalId);

      this.notify({
        type: 'truce_accepted',
        rivalId,
        truce
      });

      return { accepted: true, truce };
    } else {
      this.notify({
        type: 'truce_rejected',
        rivalId,
        terms
      });

      return { accepted: false };
    }
  }

  // ========== SIMULATION ==========

  // Limits to prevent unbounded growth
  private static readonly MAX_HISTORY_ENTRIES = 50;
  private static readonly MAX_TRUCES = 10;
  private static readonly MAX_CONFLICTS = 5;
  private static readonly MAX_DESIRES = 10;
  private static readonly MAX_VULNERABILITIES = 10;

  processTick(deltaTime: number = 1): void {
    for (const rival of this.rivals.values()) {
      if (!rival.isActive) continue;

      const rivalry = this.getRivalry(rival.id);
      
      // Prune history to prevent unbounded growth
      if (rivalry.history.length > RivalSystemClass.MAX_HISTORY_ENTRIES) {
        rivalry.history = rivalry.history.slice(-RivalSystemClass.MAX_HISTORY_ENTRIES);
      }
      
      // Prune old expired truces
      if (rivalry.truces.length > RivalSystemClass.MAX_TRUCES) {
        // Keep active truces, remove oldest expired
        const now = Date.now();
        const active = rivalry.truces.filter(t => !t.duration || now < t.startDate + t.duration);
        const expired = rivalry.truces.filter(t => t.duration && now >= t.startDate + t.duration);
        rivalry.truces = [...active, ...expired.slice(-3)];
      }

      // Skip if truce is active
      if (rivalry.truces.some(t => !t.duration || Date.now() < t.startDate + t.duration)) {
        continue;
      }

      // Chance to make a move based on disposition
      let moveChance = 0;
      switch (rivalry.disposition) {
        case 'tense': moveChance = 0.05; break;
        case 'hostile': moveChance = 0.15; break;
        case 'war': moveChance = 0.30; break;
      }

      // Patience affects frequency
      moveChance *= (100 - rival.personality.patience) / 100;

      if (Math.random() < moveChance * deltaTime) {
        const move = this.decideMove(rival.id);
        if (move) {
          this.executeMove(rival.id, move.type);
        }
      }

      // Passive resource growth
      rival.resources.money += Math.floor(rival.domain.influence * 10 * deltaTime);
      
      // Cap rival desires and vulnerabilities
      if (rival.desires.length > RivalSystemClass.MAX_DESIRES) {
        rival.desires = rival.desires.slice(0, RivalSystemClass.MAX_DESIRES);
      }
      if (rival.vulnerabilities.length > RivalSystemClass.MAX_VULNERABILITIES) {
        rival.vulnerabilities = rival.vulnerabilities.slice(0, RivalSystemClass.MAX_VULNERABILITIES);
      }
    }
  }

  // ========== QUERIES ==========

  getRival(id: string): WorldRival | undefined {
    return this.rivals.get(id);
  }

  getActiveRivals(): WorldRival[] {
    return Array.from(this.rivals.values()).filter(r => r.isActive);
  }

  getRivalsInTerritory(zoneId: string): WorldRival[] {
    return Array.from(this.rivals.values()).filter(r =>
      r.domain.territories.includes(zoneId)
    );
  }

  getHostileRivals(): WorldRival[] {
    return Array.from(this.rivals.values()).filter(r => {
      const rivalry = this.getRivalry(r.id);
      return ['hostile', 'war'].includes(rivalry.disposition);
    });
  }

  // ========== EVENTS ==========

  addEventListener(callback: (event: RivalEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: RivalEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch (e) { console.error('[RivalSystem]', e); }
    }
  }

  // ========== SERIALIZATION ==========

  serialize(): { rivals: Array<[string, WorldRival]>; playerRivalries: Array<[string, RivalryState]> } {
    return {
      rivals: Array.from(this.rivals.entries()),
      playerRivalries: Array.from(this.playerRivalries.entries())
    };
  }

  deserialize(data: { rivals?: Array<[string, WorldRival]>; playerRivalries?: Array<[string, RivalryState]> }): void {
    this.rivals = new Map(data.rivals || []);
    this.playerRivalries = new Map(data.playerRivalries || []);
  }

  // ========== AI CONTEXT ==========

  buildRivalContext(): string {
    const activeRivals = this.getActiveRivals();
    if (activeRivals.length === 0) return '';

    const lines = ['ACTIVE RIVALS:'];
    for (const rival of activeRivals) {
      const rivalry = this.getRivalry(rival.id);
      lines.push(`- ${rival.name} (${rival.type}): ${rivalry.disposition.toUpperCase()}`);
      lines.push(`  Respect: ${rivalry.respect}, Fear: ${rivalry.fear}`);
      
      if (rival.desires.length > 0) {
        lines.push(`  Wants: ${rival.desires.map(d => d.description).join(', ')}`);
      }
      
      if (rivalry.activeConflicts.length > 0) {
        lines.push(`  ACTIVE CONFLICTS: ${rivalry.activeConflicts.map(c => `${c.type} over ${c.target} (escalation: ${c.escalationLevel})`).join(', ')}`);
      }
      
      if (rival.lastAction) {
        lines.push(`  Last action: ${rival.lastAction}`);
      }
    }
    return lines.join('\n');
  }
}

export const RivalSystem = new RivalSystemClass();
export default RivalSystem;
