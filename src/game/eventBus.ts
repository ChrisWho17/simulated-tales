// ============================================================================
// EVENT BUS - Central Event Ledger for Game Systems
// All systems emit events here, other systems subscribe and react
// This prevents direct coupling between systems and provides a debug timeline
// ============================================================================

// ============= EVENT TYPES =============

export type GameEventType =
  // Item events
  | 'ITEM_TRANSFERRED'
  | 'ITEM_CREATED'
  | 'ITEM_DESTROYED'
  | 'ITEM_USED'
  | 'ITEM_EQUIPPED'
  | 'ITEM_GIFTED'
  | 'ITEM_STOLEN'
  | 'ITEM_DROPPED'
  | 'ITEM_PICKED_UP'
  // Relationship events
  | 'RELATIONSHIP_CHANGED'
  | 'TRUST_CHANGED'
  | 'RESPECT_CHANGED'
  | 'ATTACHMENT_CHANGED'
  | 'ROMANCE_PROGRESSED'
  | 'INSULT'
  | 'COMPLIMENT'
  | 'BETRAYAL'
  | 'FAVOR'
  // Combat/Damage events
  | 'DAMAGE_DEALT'
  | 'DAMAGE_RECEIVED'
  | 'WOUND_INFLICTED'
  | 'WOUND_REVEALED'
  | 'WOUND_TREATED'
  | 'DEATH'
  | 'KNOCKOUT'
  | 'COMBAT_WON'
  | 'COMBAT_DEESCALATED'
  | 'COMBAT_FLED'
  // Weapon events
  | 'WEAPON_JAM'
  | 'WEAPON_DESTROYED'
  | 'WEAPON_REPAIRED'
  // Knowledge/Memory events
  | 'FACT_LEARNED'
  | 'FACT_REVEALED'
  | 'SECRET_SHARED'
  | 'RUMOR_SPREAD'
  | 'REVELATION'
  // Need events
  | 'NEED_CRITICAL'
  | 'NEED_LOW'
  | 'NEED_RESTORED'
  | 'ACTIVITY_PERFORMED'
  // Reputation events
  | 'REPUTATION_CHANGED'
  | 'FACTION_STANDING_CHANGED'
  // Location events
  | 'LOCATION_ENTERED'
  | 'LOCATION_LEFT'
  // Quest/Story events
  | 'QUEST_STARTED'
  | 'QUEST_COMPLETED'
  | 'QUEST_FAILED'
  | 'QUEST_RIPPLE'
  | 'STORY_BEAT'
  // System events
  | 'GAME_TICK'
  | 'SAVE_CREATED'
  | 'GAME_LOADED'
  // Move sync events
  | 'MOVE_SYNC_COMPLETE'
  | 'ENVIRONMENT_CHANGED'
  | 'PLAYER_STATE_CHANGED'
  | 'GENRE_VIOLATION_DETECTED'
  // Trade/Commerce events
  | 'TRADE_COMPLETED'
  | 'ITEM_SOLD'
  | 'ITEM_PURCHASED'
  // Collector events
  | 'RARE_ITEM_FOUND'
  | 'LEGENDARY_ITEM_FOUND'
  | 'INVENTORY_CHANGED'
  // Diplomat events
  | 'ALLIANCE_FORMED'
  | 'CONFLICT_RESOLVED'
  | 'FACTION_REPUTATION_CHANGED'
  // Critical Chain events
  | 'CRITICAL_CHAIN_UPDATED'
  | 'FORTUNE_FAVOR_ACTIVATED'
  | 'DESPERATION_MODE_ACTIVATED'
  | 'COMEBACK_TRIGGERED'
  // Companion events
  | 'COMPANION_CONFLICT_STARTED'
  | 'COMPANION_CONFLICT_RESOLVED';

// ============= EVENT PAYLOAD INTERFACES =============

export interface BaseEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
  tick: number;
  source: string; // Which system emitted this
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface ItemEvent extends BaseEvent {
  type: 'ITEM_TRANSFERRED' | 'ITEM_CREATED' | 'ITEM_DESTROYED' | 'ITEM_USED' | 
        'ITEM_EQUIPPED' | 'ITEM_GIFTED' | 'ITEM_STOLEN' | 'ITEM_DROPPED' | 'ITEM_PICKED_UP';
  data: {
    itemId: string;
    itemName: string;
    fromEntity?: string;
    toEntity?: string;
    reason?: string;
  };
}

export interface RelationshipEvent extends BaseEvent {
  type: 'RELATIONSHIP_CHANGED' | 'TRUST_CHANGED' | 'RESPECT_CHANGED' | 
        'ATTACHMENT_CHANGED' | 'ROMANCE_PROGRESSED' | 'INSULT' | 'COMPLIMENT' | 
        'BETRAYAL' | 'FAVOR';
  data: {
    sourceEntity: string;
    targetEntity: string;
    metric?: 'trust' | 'respect' | 'attachment' | 'fear' | 'affection' | 'romance';
    previousValue?: number;
    newValue?: number;
    delta?: number;
    reason?: string;
  };
}

export interface CombatEvent extends BaseEvent {
  type: 'DAMAGE_DEALT' | 'DAMAGE_RECEIVED' | 'WOUND_INFLICTED' | 
        'WOUND_REVEALED' | 'WOUND_TREATED' | 'DEATH' | 'KNOCKOUT' |
        'COMBAT_WON' | 'COMBAT_DEESCALATED' | 'COMBAT_FLED';
  data: {
    sourceEntity?: string;
    targetEntity: string;
    amount?: number;
    woundType?: string;
    location?: string;
    isHidden?: boolean;
    flawlessVictory?: boolean; // No damage taken during combat
    method?: string; // How combat was resolved (persuasion, intimidation, etc.)
  };
}

export interface WeaponEvent extends BaseEvent {
  type: 'WEAPON_JAM' | 'WEAPON_DESTROYED' | 'WEAPON_REPAIRED';
  data: {
    weaponId: string;
    weaponType: string;
    condition?: number;
    playerDamage?: number;
    wasCriticalFailure?: boolean;
  };
}

export interface NeedEvent extends BaseEvent {
  type: 'NEED_CRITICAL' | 'NEED_LOW' | 'NEED_RESTORED' | 'ACTIVITY_PERFORMED';
  data: {
    entity: string;
    need?: string;
    previousValue?: number;
    newValue?: number;
    activityType?: string;
  };
}

export interface ReputationEvent extends BaseEvent {
  type: 'REPUTATION_CHANGED' | 'FACTION_STANDING_CHANGED';
  data: {
    entity: string;
    locationId?: string;
    factionId?: string;
    previousValue: number;
    newValue: number;
    reason?: string;
  };
}

export interface KnowledgeEvent extends BaseEvent {
  type: 'FACT_LEARNED' | 'FACT_REVEALED' | 'SECRET_SHARED' | 'RUMOR_SPREAD' | 'REVELATION';
  data: {
    learnerEntity: string;
    sourceEntity?: string;
    fact: string;
    factType?: string;
    reliability?: number;
  };
}

export type GameBusEvent = 
  | ItemEvent 
  | RelationshipEvent 
  | CombatEvent 
  | WeaponEvent
  | NeedEvent 
  | ReputationEvent 
  | KnowledgeEvent
  | BaseEvent;

// ============= SUBSCRIBER TYPES =============

export type EventHandler<T extends GameBusEvent = GameBusEvent> = (event: T) => void;

export interface Subscription {
  id: string;
  eventTypes: GameEventType[] | '*';
  handler: EventHandler;
  priority: number; // Higher priority handlers run first
}

// ============= EVENT BUS CLASS =============

class GameEventBus {
  private subscriptions: Subscription[] = [];
  private eventLog: GameBusEvent[] = [];
  private maxLogSize = 500;
  private currentTick = 0;
  private paused = false;
  
  // ============= EMIT =============
  
  emit<T extends GameBusEvent>(event: Omit<T, 'id' | 'timestamp'>): void {
    if (this.paused) return;
    
    const fullEvent: GameBusEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
    } as GameBusEvent;
    
    // Add to log
    this.eventLog.push(fullEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
    
    // Get matching subscriptions sorted by priority
    const matching = this.subscriptions
      .filter(sub => sub.eventTypes === '*' || sub.eventTypes.includes(event.type))
      .sort((a, b) => b.priority - a.priority);
    
    // Dispatch to handlers
    for (const sub of matching) {
      try {
        sub.handler(fullEvent);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${event.type}:`, error);
      }
    }
  }
  
  // ============= SUBSCRIBE =============
  
  subscribe(
    eventTypes: GameEventType[] | '*',
    handler: EventHandler,
    priority: number = 0
  ): () => void {
    const subscription: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      eventTypes,
      handler,
      priority,
    };
    
    this.subscriptions.push(subscription);
    
    // Return unsubscribe function
    return () => {
      this.subscriptions = this.subscriptions.filter(s => s.id !== subscription.id);
    };
  }
  
  // ============= CONVENIENCE EMITTERS =============
  
  emitItemTransferred(
    itemId: string,
    itemName: string,
    fromEntity: string | undefined,
    toEntity: string,
    reason: string,
    tick: number
  ): void {
    this.emit<ItemEvent>({
      type: 'ITEM_TRANSFERRED',
      tick,
      source: 'objectRegistry',
      priority: 'normal',
      data: { itemId, itemName, fromEntity, toEntity, reason },
    });
  }
  
  emitRelationshipChanged(
    sourceEntity: string,
    targetEntity: string,
    metric: RelationshipEvent['data']['metric'],
    previousValue: number,
    newValue: number,
    reason: string,
    tick: number
  ): void {
    this.emit<RelationshipEvent>({
      type: 'RELATIONSHIP_CHANGED',
      tick,
      source: 'relationshipStore',
      priority: 'normal',
      data: { 
        sourceEntity, 
        targetEntity, 
        metric, 
        previousValue, 
        newValue, 
        delta: newValue - previousValue,
        reason 
      },
    });
  }
  
  emitItemGifted(
    itemId: string,
    itemName: string,
    fromEntity: string,
    toEntity: string,
    tick: number
  ): void {
    this.emit<ItemEvent>({
      type: 'ITEM_GIFTED',
      tick,
      source: 'socialInteraction',
      priority: 'normal',
      data: { itemId, itemName, fromEntity, toEntity, reason: 'gift' },
    });
  }
  
  emitItemStolen(
    itemId: string,
    itemName: string,
    fromEntity: string,
    toEntity: string,
    tick: number
  ): void {
    this.emit<ItemEvent>({
      type: 'ITEM_STOLEN',
      tick,
      source: 'socialInteraction',
      priority: 'high',
      data: { itemId, itemName, fromEntity, toEntity, reason: 'theft' },
    });
  }
  
  emitNeedCritical(entity: string, need: string, value: number, tick: number): void {
    this.emit<NeedEvent>({
      type: 'NEED_CRITICAL',
      tick,
      source: 'needsSystem',
      priority: 'high',
      data: { entity, need, newValue: value },
    });
  }
  
  emitDamageReceived(
    targetEntity: string,
    amount: number,
    woundType: string | undefined,
    isHidden: boolean,
    tick: number
  ): void {
    this.emit<CombatEvent>({
      type: 'DAMAGE_RECEIVED',
      tick,
      source: 'combatSystem',
      priority: 'high',
      data: { targetEntity, amount, woundType, isHidden },
    });
  }
  
  emitReputationChanged(
    entity: string,
    locationId: string,
    previousValue: number,
    newValue: number,
    reason: string,
    tick: number
  ): void {
    this.emit<ReputationEvent>({
      type: 'REPUTATION_CHANGED',
      tick,
      source: 'reputationSystem',
      priority: 'normal',
      data: { entity, locationId, previousValue, newValue, reason },
    });
  }
  
  // ============= QUERIES =============
  
  getRecentEvents(count: number = 20): GameBusEvent[] {
    return this.eventLog.slice(-count);
  }
  
  getEventsByType(type: GameEventType, count: number = 20): GameBusEvent[] {
    return this.eventLog.filter(e => e.type === type).slice(-count);
  }
  
  getEventsForEntity(entityId: string, count: number = 20): GameBusEvent[] {
    return this.eventLog.filter(e => {
      const data = (e as any).data;
      if (!data) return false;
      return data.sourceEntity === entityId || 
             data.targetEntity === entityId ||
             data.fromEntity === entityId ||
             data.toEntity === entityId ||
             data.entity === entityId;
    }).slice(-count);
  }
  
  // ============= CONTROL =============
  
  setTick(tick: number): void {
    this.currentTick = tick;
  }
  
  pause(): void {
    this.paused = true;
  }
  
  resume(): void {
    this.paused = false;
  }
  
  clear(): void {
    this.eventLog = [];
  }
  
  // ============= SERIALIZATION =============
  
  serialize(): GameBusEvent[] {
    return this.eventLog;
  }
  
  deserialize(events: GameBusEvent[]): void {
    this.eventLog = events;
  }
  
  // ============= DEBUG =============
  
  getDebugTimeline(): string[] {
    return this.eventLog.slice(-20).map(e => {
      const data = (e as any).data || {};
      const details = Object.entries(data)
        .filter(([k]) => k !== 'itemId' && k !== 'sourceEntity')
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      return `[${e.tick}] ${e.type}: ${details}`;
    });
  }
}

// ============= SINGLETON INSTANCE =============

export const eventBus = new GameEventBus();

// ============= HELPER: BUILD EVENT CONTEXT FOR AI =============

export function buildEventContextForAI(recentCount: number = 10): string {
  const events = eventBus.getRecentEvents(recentCount);
  if (events.length === 0) return '';
  
  const lines: string[] = ['## RECENT WORLD EVENTS'];
  
  for (const event of events) {
    const data = (event as any).data || {};
    switch (event.type) {
      case 'ITEM_GIFTED':
        lines.push(`- ${data.fromEntity} gave ${data.itemName} to ${data.toEntity}`);
        break;
      case 'ITEM_STOLEN':
        lines.push(`- ${data.toEntity} stole ${data.itemName} from ${data.fromEntity}`);
        break;
      case 'RELATIONSHIP_CHANGED':
        const direction = (data.delta || 0) > 0 ? 'increased' : 'decreased';
        lines.push(`- ${data.sourceEntity}'s ${data.metric} with ${data.targetEntity} ${direction} (${data.reason})`);
        break;
      case 'DAMAGE_RECEIVED':
        if (!data.isHidden) {
          lines.push(`- ${data.targetEntity} took ${data.amount} damage`);
        }
        break;
      case 'REPUTATION_CHANGED':
        lines.push(`- Reputation at ${data.locationId} changed: ${data.reason}`);
        break;
      case 'NEED_CRITICAL':
        lines.push(`- ${data.entity}'s ${data.need} is critically low`);
        break;
    }
  }
  
  return lines.length > 1 ? lines.join('\n') : '';
}
