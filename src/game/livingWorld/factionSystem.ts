// ============================================================================
// FACTION SYSTEM - Power structures with memory
// Power structures that remember, recruit, war
// ============================================================================

export type FactionType = 'gang' | 'cartel' | 'corporation' | 'government' | 'police' | 'family' | 'cult' | 'militia' | 'union' | 'organization';
export type FactionRelation = 'allied' | 'friendly' | 'neutral' | 'tense' | 'hostile' | 'war';
export type ReputationTier = 'revered' | 'respected' | 'liked' | 'neutral' | 'disliked' | 'hated' | 'kill_on_sight';
export type FactionActivity = 'drugs' | 'gambling' | 'protection' | 'theft' | 'legitimate' | 'smuggling' | 'weapons' | 'extortion';

export interface FactionLeadership {
  leader: string | null;        // NPC ID
  lieutenants: string[];        // NPC IDs
  council: string[];            // NPC IDs for decisions
}

export interface FactionPower {
  military: number;             // Combat strength 0-100
  economic: number;             // Financial power 0-100
  political: number;            // Influence/connections 0-100
  intelligence: number;         // Information network 0-100
}

export interface FactionValues {
  loyalty: number;              // How they treat members 0-100
  violence: number;             // Willingness to fight 0-100
  honor: number;                // Code adherence 0-100
  ambition: number;             // Expansion desire 0-100
}

export interface FactionMemoryEntry {
  entityId: string;
  type: 'player' | 'npc' | 'faction';
  reason: string;
  date: number;
  amount?: number;
  severity?: number;
  resolved?: boolean;
  called?: boolean;
  paid?: boolean;
}

export interface FactionMemory {
  allies: FactionMemoryEntry[];
  enemies: FactionMemoryEntry[];
  debts: FactionMemoryEntry[];
  grudges: FactionMemoryEntry[];
  favors: FactionMemoryEntry[];
}

export interface FactionRecruitment {
  open: boolean;
  requirements: string[];
  initiation: string | null;
}

export interface FactionRelationEntry {
  status: FactionRelation;
  history: Array<{ status: FactionRelation; reason: string; date: number }>;
}

export interface WorldFaction {
  id: string;
  name: string;
  type: FactionType;
  description: string;
  
  // Structure
  leadership: FactionLeadership;
  members: string[];            // All member NPC IDs
  ranks: string[];              // e.g., ['Associate', 'Member', 'Captain', 'Lieutenant', 'Boss']
  
  // Territory & Assets
  territories: string[];        // Zone IDs
  properties: string[];         // Property IDs
  businesses: string[];         // Business IDs
  
  // Power
  power: FactionPower;
  
  // Values & Behavior
  values: FactionValues;
  
  // Relations with other factions
  relations: Map<string, FactionRelationEntry>;
  
  // Memory
  memory: FactionMemory;
  
  // Activities
  activities: FactionActivity[];
  activeOperations: string[];
  
  // Recruitment
  recruitment: FactionRecruitment;
  
  // State
  isActive: boolean;
  isHidden: boolean;            // Unknown to player initially
  
  // Meta
  created: number;
  lastUpdate: number;
}

export interface PlayerFactionStanding {
  factionId: string;
  reputation: number;           // -100 to 100
  rank: string | null;          // null = not a member
  isMember: boolean;
  joinDate: number | null;
  contributions: Array<{ reason: string; amount: number; date: number }>;
  offenses: Array<{ reason: string; amount: number; date: number }>;
  knownTo: boolean;             // Has faction noticed player
  lastInteraction: number | null;
}

export type FactionEvent =
  | { type: 'reputation_changed'; factionId: string; oldReputation: number; newReputation: number; change: number; reason: string }
  | { type: 'player_joined_faction'; factionId: string; faction: WorldFaction; rank: string }
  | { type: 'player_left_faction'; factionId: string; faction: WorldFaction; method: string; formerRank: string }
  | { type: 'player_promoted'; factionId: string; faction: WorldFaction; oldRank: string; newRank: string }
  | { type: 'faction_relation_changed'; faction1Id: string; faction2Id: string; oldStatus: FactionRelation; newStatus: FactionRelation; reason: string }
  | { type: 'faction_war_started'; faction1Id: string; faction2Id: string; reason: string }
  | { type: 'territory_captured'; winnerId: string; loserId: string; territory: string };

// ============================================================================
// FACTION SYSTEM
// ============================================================================

class FactionSystemClass {
  private factions: Map<string, WorldFaction> = new Map();
  private playerStanding: Map<string, PlayerFactionStanding> = new Map();
  private listeners: Array<(event: FactionEvent) => void> = [];

  // ========== FACTION CREATION ==========

  createFaction(data: Partial<WorldFaction> & { name: string }): WorldFaction {
    const faction: WorldFaction = {
      id: data.id || `faction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      type: data.type || 'organization',
      description: data.description || '',
      
      leadership: data.leadership || {
        leader: null,
        lieutenants: [],
        council: []
      },
      members: data.members || [],
      ranks: data.ranks || ['Associate', 'Member', 'Captain', 'Lieutenant', 'Boss'],
      
      territories: data.territories || [],
      properties: data.properties || [],
      businesses: data.businesses || [],
      
      power: data.power || {
        military: 50,
        economic: 50,
        political: 50,
        intelligence: 50
      },
      
      values: data.values || {
        loyalty: 50,
        violence: 50,
        honor: 50,
        ambition: 50
      },
      
      relations: new Map(data.relations || []),
      
      memory: data.memory || {
        allies: [],
        enemies: [],
        debts: [],
        grudges: [],
        favors: []
      },
      
      activities: data.activities || [],
      activeOperations: [],
      
      recruitment: data.recruitment || {
        open: false,
        requirements: [],
        initiation: null
      },
      
      isActive: data.isActive ?? true,
      isHidden: data.isHidden ?? false,
      
      created: Date.now(),
      lastUpdate: Date.now()
    };

    this.factions.set(faction.id, faction);
    return faction;
  }

  // ========== PLAYER STANDING ==========

  getPlayerStanding(factionId: string): PlayerFactionStanding {
    if (!this.playerStanding.has(factionId)) {
      this.playerStanding.set(factionId, {
        factionId,
        reputation: 0,
        rank: null,
        isMember: false,
        joinDate: null,
        contributions: [],
        offenses: [],
        knownTo: false,
        lastInteraction: null
      });
    }
    return this.playerStanding.get(factionId)!;
  }

  modifyReputation(factionId: string, amount: number, reason: string): PlayerFactionStanding {
    const standing = this.getPlayerStanding(factionId);
    const faction = this.factions.get(factionId);
    if (!faction) return standing;

    const oldRep = standing.reputation;
    standing.reputation = Math.max(-100, Math.min(100, standing.reputation + amount));

    if (amount > 0) {
      standing.contributions.push({ reason, amount, date: Date.now() });
    } else {
      standing.offenses.push({ reason, amount, date: Date.now() });
    }

    if (Math.abs(standing.reputation) > 10) {
      standing.knownTo = true;
    }

    standing.lastInteraction = Date.now();

    // Update faction memory
    if (amount < -30) {
      faction.memory.enemies.push({
        entityId: 'player',
        type: 'player',
        reason,
        date: Date.now()
      });
    } else if (amount > 30) {
      faction.memory.allies.push({
        entityId: 'player',
        type: 'player',
        reason,
        date: Date.now()
      });
    }

    this.notify({
      type: 'reputation_changed',
      factionId,
      oldReputation: oldRep,
      newReputation: standing.reputation,
      change: amount,
      reason
    });

    return standing;
  }

  getReputationTier(reputation: number): ReputationTier {
    if (reputation >= 80) return 'revered';
    if (reputation >= 50) return 'respected';
    if (reputation >= 20) return 'liked';
    if (reputation >= -20) return 'neutral';
    if (reputation >= -50) return 'disliked';
    if (reputation >= -80) return 'hated';
    return 'kill_on_sight';
  }

  // ========== MEMBERSHIP ==========

  joinFaction(factionId: string): { success: boolean; reason?: string; rank?: string } {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, reason: 'Faction not found' };

    const standing = this.getPlayerStanding(factionId);

    if (!faction.recruitment.open) {
      return { success: false, reason: 'Faction not recruiting' };
    }

    if (standing.reputation < 20) {
      return { success: false, reason: 'Insufficient reputation' };
    }

    if (standing.isMember) {
      return { success: false, reason: 'Already a member' };
    }

    // Check if player is member of enemy faction
    for (const [otherId, otherStanding] of this.playerStanding) {
      if (otherStanding.isMember) {
        const relation = faction.relations.get(otherId);
        if (relation && ['hostile', 'war'].includes(relation.status)) {
          const otherFaction = this.factions.get(otherId);
          return { success: false, reason: `Cannot join while member of ${otherFaction?.name}` };
        }
      }
    }

    standing.isMember = true;
    standing.rank = faction.ranks[0];
    standing.joinDate = Date.now();

    this.notify({
      type: 'player_joined_faction',
      factionId,
      faction,
      rank: standing.rank
    });

    return { success: true, rank: standing.rank };
  }

  leaveFaction(factionId: string, method: 'quit' | 'betrayal' | 'expelled' | 'honorable' = 'quit'): { success: boolean; reason?: string; formerRank?: string } {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, reason: 'Faction not found' };

    const standing = this.getPlayerStanding(factionId);

    if (!standing.isMember) {
      return { success: false, reason: 'Not a member' };
    }

    standing.isMember = false;
    const formerRank = standing.rank || 'Unknown';
    standing.rank = null;

    let repPenalty = 0;
    switch (method) {
      case 'quit': repPenalty = -20; break;
      case 'betrayal': repPenalty = -80; break;
      case 'expelled': repPenalty = -40; break;
      case 'honorable': repPenalty = 0; break;
    }

    if (repPenalty) {
      this.modifyReputation(factionId, repPenalty, `left_faction_${method}`);
    }

    if (method === 'betrayal') {
      faction.memory.grudges.push({
        entityId: 'player',
        type: 'player',
        reason: 'betrayal',
        severity: 100,
        date: Date.now(),
        resolved: false
      });
    }

    this.notify({
      type: 'player_left_faction',
      factionId,
      faction,
      method,
      formerRank
    });

    return { success: true, formerRank };
  }

  promotePlayer(factionId: string): { success: boolean; reason?: string; newRank?: string } {
    const faction = this.factions.get(factionId);
    if (!faction) return { success: false, reason: 'Faction not found' };

    const standing = this.getPlayerStanding(factionId);

    if (!standing.isMember) return { success: false, reason: 'Not a member' };

    const currentIdx = faction.ranks.indexOf(standing.rank || '');
    if (currentIdx >= faction.ranks.length - 1) {
      return { success: false, reason: 'Already at highest rank' };
    }

    const oldRank = standing.rank || faction.ranks[0];
    const newRank = faction.ranks[currentIdx + 1];
    standing.rank = newRank;

    this.notify({
      type: 'player_promoted',
      factionId,
      faction,
      oldRank,
      newRank
    });

    return { success: true, newRank };
  }

  // ========== FACTION RELATIONS ==========

  setRelation(factionId1: string, factionId2: string, status: FactionRelation, reason: string): void {
    const faction1 = this.factions.get(factionId1);
    const faction2 = this.factions.get(factionId2);
    if (!faction1 || !faction2) return;

    const relation1 = faction1.relations.get(factionId2) || { status: 'neutral', history: [] };
    const relation2 = faction2.relations.get(factionId1) || { status: 'neutral', history: [] };

    const oldStatus = relation1.status;

    relation1.status = status;
    relation2.status = status;

    relation1.history.push({ status, reason, date: Date.now() });
    relation2.history.push({ status, reason, date: Date.now() });

    faction1.relations.set(factionId2, relation1);
    faction2.relations.set(factionId1, relation2);

    if (oldStatus !== status) {
      this.notify({
        type: 'faction_relation_changed',
        faction1Id: factionId1,
        faction2Id: factionId2,
        oldStatus,
        newStatus: status,
        reason
      });
    }
  }

  getRelation(factionId1: string, factionId2: string): FactionRelation {
    const faction1 = this.factions.get(factionId1);
    if (!faction1) return 'neutral';

    const relation = faction1.relations.get(factionId2);
    return relation?.status ?? 'neutral';
  }

  startWar(factionId1: string, factionId2: string, reason: string): void {
    this.setRelation(factionId1, factionId2, 'war', reason);

    this.notify({
      type: 'faction_war_started',
      faction1Id: factionId1,
      faction2Id: factionId2,
      reason
    });
  }

  // ========== MEMORY ==========

  addDebt(factionId: string, toEntityId: string, entityType: 'player' | 'npc' | 'faction', amount: number, reason: string): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    faction.memory.debts.push({
      entityId: toEntityId,
      type: entityType,
      amount,
      reason,
      date: Date.now(),
      paid: false
    });
  }

  addGrudge(factionId: string, againstEntityId: string, entityType: 'player' | 'npc' | 'faction', reason: string, severity: number): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    faction.memory.grudges.push({
      entityId: againstEntityId,
      type: entityType,
      reason,
      severity: Math.min(100, severity),
      date: Date.now(),
      resolved: false
    });
  }

  addFavor(factionId: string, owedToEntityId: string, entityType: 'player' | 'npc' | 'faction', reason: string, value: number): void {
    const faction = this.factions.get(factionId);
    if (!faction) return;

    faction.memory.favors.push({
      entityId: owedToEntityId,
      type: entityType,
      reason,
      amount: value,
      date: Date.now(),
      called: false
    });
  }

  hasGrudge(factionId: string, entityId: string): boolean {
    const faction = this.factions.get(factionId);
    if (!faction) return false;

    return faction.memory.grudges.some(g =>
      g.entityId === entityId && !g.resolved
    );
  }

  // ========== SIMULATION ==========

  processTick(deltaTime: number = 1): void {
    for (const faction of this.factions.values()) {
      if (!faction.isActive) continue;

      // Resource growth based on territories and businesses
      const growth = (faction.territories.length + faction.businesses.length) * 10;
      faction.power.economic += growth * 0.01 * deltaTime;

      // Check for wars
      for (const [otherId, relation] of faction.relations) {
        if (relation.status === 'war') {
          const otherFaction = this.factions.get(otherId);
          if (otherFaction) {
            this.simulateConflict(faction.id, otherId, deltaTime);
          }
        }
      }

      // Grudge decay (very slow)
      for (const grudge of faction.memory.grudges) {
        if (!grudge.resolved && Math.random() < 0.001 * deltaTime) {
          grudge.severity = Math.max(0, (grudge.severity || 50) - 1);
          if ((grudge.severity || 0) <= 0) grudge.resolved = true;
        }
      }
    }
  }

  private simulateConflict(factionId1: string, factionId2: string, deltaTime: number): void {
    const f1 = this.factions.get(factionId1);
    const f2 = this.factions.get(factionId2);
    if (!f1 || !f2) return;

    const powerDiff = f1.power.military - f2.power.military;

    // Small chance of territory change per tick
    if (Math.random() < 0.02 * deltaTime) {
      if (powerDiff > 10 && f2.territories.length > 0) {
        const taken = f2.territories.pop()!;
        f1.territories.push(taken);
        this.notify({
          type: 'territory_captured',
          winnerId: factionId1,
          loserId: factionId2,
          territory: taken
        });
      } else if (powerDiff < -10 && f1.territories.length > 0) {
        const taken = f1.territories.pop()!;
        f2.territories.push(taken);
        this.notify({
          type: 'territory_captured',
          winnerId: factionId2,
          loserId: factionId1,
          territory: taken
        });
      }
    }

    // Both lose some power in war
    f1.power.military = Math.max(10, f1.power.military - 0.5 * deltaTime);
    f2.power.military = Math.max(10, f2.power.military - 0.5 * deltaTime);
  }

  // ========== QUERIES ==========

  getFaction(id: string): WorldFaction | undefined {
    return this.factions.get(id);
  }

  getActiveFactions(): WorldFaction[] {
    return Array.from(this.factions.values()).filter(f => f.isActive && !f.isHidden);
  }

  getFactionsInTerritory(zoneId: string): WorldFaction[] {
    return Array.from(this.factions.values()).filter(f =>
      f.territories.includes(zoneId)
    );
  }

  getPlayerFactions(): WorldFaction[] {
    return Array.from(this.factions.values()).filter(f => {
      const standing = this.playerStanding.get(f.id);
      return standing?.isMember;
    });
  }

  // ========== EVENTS ==========

  addEventListener(callback: (event: FactionEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: FactionEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch (e) { console.error('[FactionSystem]', e); }
    }
  }

  // ========== SERIALIZATION ==========

  serialize(): {
    factions: Array<[string, Omit<WorldFaction, 'relations'> & { relations: Array<[string, FactionRelationEntry]> }]>;
    playerStanding: Array<[string, PlayerFactionStanding]>;
  } {
    return {
      factions: Array.from(this.factions.entries()).map(([id, f]) => [
        id,
        { ...f, relations: Array.from(f.relations.entries()) }
      ]),
      playerStanding: Array.from(this.playerStanding.entries())
    };
  }

  deserialize(data: {
    factions?: Array<[string, Omit<WorldFaction, 'relations'> & { relations: Array<[string, FactionRelationEntry]> }]>;
    playerStanding?: Array<[string, PlayerFactionStanding]>;
  }): void {
    this.factions.clear();
    this.playerStanding.clear();

    if (data.factions) {
      for (const [id, f] of data.factions) {
        this.factions.set(id, {
          ...f,
          relations: new Map(f.relations || [])
        });
      }
    }

    if (data.playerStanding) {
      this.playerStanding = new Map(data.playerStanding);
    }
  }

  // ========== AI CONTEXT ==========

  buildFactionContext(): string {
    const visibleFactions = this.getActiveFactions();
    if (visibleFactions.length === 0) return '';

    const lines = ['FACTIONS IN THE WORLD:'];
    for (const faction of visibleFactions) {
      const standing = this.getPlayerStanding(faction.id);
      const tier = this.getReputationTier(standing.reputation);
      
      lines.push(`- ${faction.name} (${faction.type}): Player is ${tier}`);
      
      if (standing.isMember) {
        lines.push(`  MEMBER - Rank: ${standing.rank}`);
      }
      
      if (faction.memory.grudges.some(g => g.entityId === 'player' && !g.resolved)) {
        lines.push(`  ⚠ HAS GRUDGE AGAINST PLAYER`);
      }
      
      if (faction.territories.length > 0) {
        lines.push(`  Controls territories: ${faction.territories.join(', ')}`);
      }
      
      // Show relevant relations
      const hostileRelations = Array.from(faction.relations.entries())
        .filter(([_, r]) => ['hostile', 'war'].includes(r.status))
        .map(([id, r]) => {
          const other = this.factions.get(id);
          return `${other?.name || id} (${r.status})`;
        });
      
      if (hostileRelations.length > 0) {
        lines.push(`  Enemies: ${hostileRelations.join(', ')}`);
      }
    }
    
    return lines.join('\n');
  }
}

export const FactionSystem = new FactionSystemClass();
export default FactionSystem;
