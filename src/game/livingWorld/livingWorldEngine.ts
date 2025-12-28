// ============================================================================
// LIVING WORLD ENGINE - Central coordination for all living world systems
// Manages Property, Rival, and Faction systems together
// ============================================================================

import { PropertySystem, WorldProperty, PropertyEvent } from './propertySystem';
import { RivalSystem, WorldRival, RivalryState, RivalEvent } from './rivalSystem';
import { FactionSystem, WorldFaction, PlayerFactionStanding, FactionEvent } from './factionSystem';

export interface LivingWorldState {
  properties: ReturnType<typeof PropertySystem.serialize>;
  rivals: ReturnType<typeof RivalSystem.serialize>;
  factions: ReturnType<typeof FactionSystem.serialize>;
  lastTick: number;
}

type LivingWorldEvent = PropertyEvent | RivalEvent | FactionEvent;

class LivingWorldEngineClass {
  private listeners: Array<(event: LivingWorldEvent) => void> = [];
  private lastTick: number = Date.now();
  private propertyUnsubscribe?: () => void;
  private rivalUnsubscribe?: () => void;
  private factionUnsubscribe?: () => void;

  constructor() {
    // Forward events from all systems
    this.propertyUnsubscribe = PropertySystem.addEventListener(event => {
      this.notifyListeners(event);
    });
    this.rivalUnsubscribe = RivalSystem.addEventListener(event => {
      this.notifyListeners(event);
    });
    this.factionUnsubscribe = FactionSystem.addEventListener(event => {
      this.notifyListeners(event);
    });
  }

  // ========== TICK PROCESSING ==========

  processTick(deltaTime: number = 1): void {
    PropertySystem.processTick(deltaTime);
    RivalSystem.processTick(deltaTime);
    FactionSystem.processTick(deltaTime);
    this.lastTick = Date.now();
  }

  // ========== CROSS-SYSTEM QUERIES ==========

  getPlayerAssets(): {
    properties: WorldProperty[];
    factions: WorldFaction[];
    activeRivals: WorldRival[];
    totalPropertyValue: number;
    monthlyRent: number;
    monthlyMortgage: number;
  } {
    const properties = PropertySystem.getPlayerProperties();
    const factions = FactionSystem.getPlayerFactions();
    const activeRivals = RivalSystem.getHostileRivals();

    const totalPropertyValue = properties.reduce((sum, p) => sum + p.currentValue, 0);
    const monthlyRent = properties.reduce((sum, p) => 
      sum + p.tenants.reduce((tSum, t) => tSum + t.rentAmount, 0), 0);
    const monthlyMortgage = properties.reduce((sum, p) => 
      sum + (p.mortgage?.monthlyPayment || 0), 0);

    return {
      properties,
      factions,
      activeRivals,
      totalPropertyValue,
      monthlyRent,
      monthlyMortgage
    };
  }

  getZoneControl(zoneId: string): {
    properties: WorldProperty[];
    rivals: WorldRival[];
    factions: WorldFaction[];
    dominantFaction?: WorldFaction;
  } {
    const factions = FactionSystem.getFactionsInTerritory(zoneId);
    const rivals = RivalSystem.getRivalsInTerritory(zoneId);
    
    // Find faction with most power in this zone
    const dominantFaction = factions.reduce<WorldFaction | undefined>((best, current) => {
      if (!best) return current;
      const bestPower = best.power.military + best.power.political;
      const currentPower = current.power.military + current.power.political;
      return currentPower > bestPower ? current : best;
    }, undefined);

    return {
      properties: [],
      rivals,
      factions,
      dominantFaction
    };
  }

  getPlayerStandingSummary(): Array<{
    type: 'faction' | 'rival';
    name: string;
    status: string;
    reputation?: number;
    disposition?: string;
    isMember?: boolean;
    rank?: string;
  }> {
    const summary: Array<{
      type: 'faction' | 'rival';
      name: string;
      status: string;
      reputation?: number;
      disposition?: string;
      isMember?: boolean;
      rank?: string;
    }> = [];

    // Factions
    for (const faction of FactionSystem.getActiveFactions()) {
      const standing = FactionSystem.getPlayerStanding(faction.id);
      const tier = FactionSystem.getReputationTier(standing.reputation);
      summary.push({
        type: 'faction',
        name: faction.name,
        status: tier,
        reputation: standing.reputation,
        isMember: standing.isMember,
        rank: standing.rank || undefined
      });
    }

    // Rivals
    for (const rival of RivalSystem.getActiveRivals()) {
      const rivalry = RivalSystem.getRivalry(rival.id);
      summary.push({
        type: 'rival',
        name: rival.name,
        status: rivalry.disposition,
        disposition: rivalry.disposition
      });
    }

    return summary;
  }

  // ========== CROSS-SYSTEM INTERACTIONS ==========

  rivalContestProperty(rivalId: string, propertyId: string): void {
    const rival = RivalSystem.getRival(rivalId);
    const property = PropertySystem.getProperty(propertyId);
    if (!rival || !property) return;

    PropertySystem.addThreat(propertyId, 'rival', {
      source: rivalId,
      description: `${rival.name} is contesting ownership`,
      severity: 'high'
    });

    RivalSystem.startConflict(rivalId, 'property', propertyId);
  }

  factionClaimTerritory(factionId: string, zoneId: string): void {
    const faction = FactionSystem.getFaction(factionId);
    if (!faction) return;

    if (!faction.territories.includes(zoneId)) {
      faction.territories.push(zoneId);
    }
  }

  // ========== SERIALIZATION ==========

  serialize(): LivingWorldState {
    return {
      properties: PropertySystem.serialize(),
      rivals: RivalSystem.serialize(),
      factions: FactionSystem.serialize(),
      lastTick: this.lastTick
    };
  }

  deserialize(data: Partial<LivingWorldState>): void {
    if (data.properties) {
      PropertySystem.deserialize({
        properties: Array.from(data.properties.properties?.entries?.() || []),
        playerProperties: Array.from(data.properties.playerProperties || [])
      });
    }
    if (data.rivals) {
      RivalSystem.deserialize(data.rivals);
    }
    if (data.factions) {
      FactionSystem.deserialize(data.factions);
    }
    if (data.lastTick) {
      this.lastTick = data.lastTick;
    }
  }

  // ========== EVENTS ==========

  addEventListener(callback: (event: LivingWorldEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notifyListeners(event: LivingWorldEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch (e) { console.error('[LivingWorldEngine]', e); }
    }
  }

  // ========== AI CONTEXT BUILDING ==========

  buildFullContext(): string {
    const sections: string[] = [];

    const propertyContext = PropertySystem.buildPropertyContext();
    if (propertyContext) sections.push(propertyContext);

    const rivalContext = RivalSystem.buildRivalContext();
    if (rivalContext) sections.push(rivalContext);

    const factionContext = FactionSystem.buildFactionContext();
    if (factionContext) sections.push(factionContext);

    if (sections.length === 0) return '';

    return `=== LIVING WORLD STATE ===\n${sections.join('\n\n')}`;
  }

  // ========== CLEANUP ==========

  destroy(): void {
    this.propertyUnsubscribe?.();
    this.rivalUnsubscribe?.();
    this.factionUnsubscribe?.();
    this.listeners = [];
  }
}

export const LivingWorldEngine = new LivingWorldEngineClass();

// Helper function for AI prompts
export function buildLivingWorldContext(): string {
  return LivingWorldEngine.buildFullContext();
}

export default LivingWorldEngine;
