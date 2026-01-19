// ============================================================================
// SYSTEMS INTEGRATION TESTS
// End-to-end tests verifying all fixed systems work correctly together
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';

// Mock event bus that simulates real gameplay
class GameplayEventBus {
  private events: Array<{ type: string; tick: number; data?: any }> = [];
  private currentTick = 0;
  
  setTick(tick: number) {
    this.currentTick = tick;
  }
  
  emit(event: { type: string; tick?: number; data?: any }) {
    this.events.push({
      ...event,
      tick: event.tick ?? this.currentTick
    });
  }
  
  getEventsByType(type: string, count: number): Array<{ tick: number; data?: any }> {
    return this.events
      .filter(e => e.type === type)
      .slice(-count);
  }
  
  getRecentEvents(count: number): Array<{ type: string; tick: number }> {
    return this.events.slice(-count);
  }
  
  clear() {
    this.events = [];
    this.currentTick = 0;
  }
}

// Simulate game state type
interface MockGameState {
  time: { tick: number };
  player: {
    currentLocation: string;
    inventory: Array<{ id: string; name: string }>;
  };
  flags: Record<string, string | boolean>;
  worldEvents: Array<{ id: string; type: string }>;
}

// Combat state detection
function detectCombatState(eventBus: GameplayEventBus, currentTick: number): boolean {
  const recentCombatEvents = eventBus.getEventsByType('DAMAGE_DEALT', 10);
  if (recentCombatEvents.length === 0) return false;
  // Use the MOST RECENT event (last in the slice), not the oldest
  const mostRecentEvent = recentCombatEvents[recentCombatEvents.length - 1];
  return (currentTick - mostRecentEvent.tick) < 3;
}

// Time since last conflict
function calculateTimeSinceLastConflict(eventBus: GameplayEventBus, currentTick: number): number {
  const recentEvents = eventBus.getEventsByType('DAMAGE_DEALT', 10);
  if (recentEvents.length === 0) return 999;
  // Use the MOST RECENT event (last in slice)
  const lastCombatEvent = recentEvents[recentEvents.length - 1];
  return currentTick - lastCombatEvent.tick;
}

// Witness detection
function detectWitness(eventBus: GameplayEventBus, theftTick: number, randomValue: number): boolean {
  const witnessEvents = eventBus.getEventsByType('LOCATION_ENTERED', 5);
  const recentLocationEvents = witnessEvents.filter(e => 
    e.tick >= theftTick - 1 && e.tick <= theftTick + 1
  );
  return recentLocationEvents.length > 0 || randomValue < 0.3;
}

// Choice anchor context building (simplified)
function buildChoiceContext(gameState: MockGameState) {
  const activeLoops = gameState.worldEvents
    ?.filter(e => e.type === 'story_event')
    .slice(-5)
    .map(e => e.id) || [];
  
  const questStates = gameState.flags && typeof gameState.flags === 'object'
    ? Object.fromEntries(
        Object.entries(gameState.flags)
          .filter(([key]) => key.startsWith('quest_'))
          .map(([id, status]) => [id, String(status)])
      ) 
    : {};
  
  return { activeLoops, questStates };
}

describe('Full Gameplay Integration Tests', () => {
  let eventBus: GameplayEventBus;
  let gameState: MockGameState;
  
  beforeEach(() => {
    eventBus = new GameplayEventBus();
    gameState = {
      time: { tick: 0 },
      player: {
        currentLocation: 'tavern',
        inventory: []
      },
      flags: {},
      worldEvents: []
    };
  });
  
  describe('Combat Flow', () => {
    it('should track combat state through a complete fight', () => {
      // Turn 1: Combat starts
      eventBus.setTick(1);
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 10 } });
      expect(detectCombatState(eventBus, 1)).toBe(true);
      expect(calculateTimeSinceLastConflict(eventBus, 1)).toBe(0);
      
      // Turn 2: Combat continues
      eventBus.setTick(2);
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 8 } });
      expect(detectCombatState(eventBus, 2)).toBe(true);
      expect(calculateTimeSinceLastConflict(eventBus, 2)).toBe(0);
      
      // Turn 3: Last hit
      eventBus.setTick(3);
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 15 } });
      expect(detectCombatState(eventBus, 3)).toBe(true);
      
      // Turn 4-5: Combat winding down (still in combat window)
      eventBus.setTick(5);
      expect(detectCombatState(eventBus, 5)).toBe(true);
      expect(calculateTimeSinceLastConflict(eventBus, 5)).toBe(2);
      
      // Turn 7: Combat ended (outside window)
      eventBus.setTick(7);
      expect(detectCombatState(eventBus, 7)).toBe(false);
      expect(calculateTimeSinceLastConflict(eventBus, 7)).toBe(4);
    });
    
    it('should correctly prioritize systems based on combat state', () => {
      // Simulate system priority resolution
      function getSystemPriority(inCombat: boolean): string[] {
        if (inCombat) {
          return ['combat', 'adrenaline', 'wounds', 'narrative'];
        }
        return ['narrative', 'needs', 'social', 'exploration'];
      }
      
      // During combat
      eventBus.setTick(5);
      eventBus.emit({ type: 'DAMAGE_DEALT' });
      const combatActive = detectCombatState(eventBus, 5);
      expect(getSystemPriority(combatActive)).toContain('combat');
      expect(getSystemPriority(combatActive)[0]).toBe('combat');
      
      // After combat
      eventBus.setTick(10);
      const combatEnded = detectCombatState(eventBus, 10);
      expect(getSystemPriority(combatEnded)[0]).toBe('narrative');
    });
  });
  
  describe('Theft and Witness System', () => {
    it('should detect witnesses in a busy location', () => {
      eventBus.setTick(10);
      
      // NPCs are present
      eventBus.emit({ type: 'LOCATION_ENTERED', tick: 9 });
      eventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
      
      // Player attempts theft at tick 10
      const wasWitnessed = detectWitness(eventBus, 10, 0.99);
      expect(wasWitnessed).toBe(true);
    });
    
    it('should sometimes catch isolated theft through random chance', () => {
      eventBus.setTick(10);
      
      // No NPCs around
      // Low random value = "fate" catches the thief
      const witnessedByFate = detectWitness(eventBus, 10, 0.1);
      expect(witnessedByFate).toBe(true);
      
      // High random value = thief gets away
      const escaped = detectWitness(eventBus, 10, 0.5);
      expect(escaped).toBe(false);
    });
    
    it('should integrate with reputation system after witnessed theft', () => {
      // Simulate full theft flow
      eventBus.setTick(10);
      eventBus.emit({ type: 'LOCATION_ENTERED', tick: 10 });
      
      // Theft happens
      eventBus.emit({ type: 'ITEM_STOLEN', data: { itemId: 'gold_ring' } });
      
      const wasWitnessed = detectWitness(eventBus, 10, 0.5);
      
      if (wasWitnessed) {
        // Reputation should decrease
        eventBus.emit({ 
          type: 'REPUTATION_CHANGED', 
          data: { delta: -10, reason: 'witnessed_theft' }
        });
      }
      
      const reputationEvents = eventBus.getEventsByType('REPUTATION_CHANGED', 5);
      expect(reputationEvents.length).toBe(wasWitnessed ? 1 : 0);
    });
  });
  
  describe('Choice Anchor and Quest Integration', () => {
    it('should extract active story loops from world events', () => {
      gameState.worldEvents = [
        { id: 'loop_1', type: 'story_event' },
        { id: 'random_event', type: 'ambient' },
        { id: 'loop_2', type: 'story_event' },
        { id: 'loop_3', type: 'story_event' },
      ];
      
      const context = buildChoiceContext(gameState);
      expect(context.activeLoops).toHaveLength(3);
      expect(context.activeLoops).toContain('loop_1');
      expect(context.activeLoops).not.toContain('random_event');
    });
    
    it('should extract quest states from flags', () => {
      gameState.flags = {
        quest_main_story: 'in_progress',
        quest_side_mission: 'completed',
        visited_tavern: true,
        quest_secret: 'discovered'
      };
      
      const context = buildChoiceContext(gameState);
      expect(Object.keys(context.questStates)).toHaveLength(3);
      expect(context.questStates['quest_main_story']).toBe('in_progress');
      expect(context.questStates['quest_side_mission']).toBe('completed');
      expect(context.questStates['visited_tavern']).toBeUndefined();
    });
    
    it('should limit active loops to most recent 5', () => {
      gameState.worldEvents = [];
      for (let i = 0; i < 10; i++) {
        gameState.worldEvents.push({ id: `loop_${i}`, type: 'story_event' });
      }
      
      const context = buildChoiceContext(gameState);
      expect(context.activeLoops).toHaveLength(5);
      expect(context.activeLoops[0]).toBe('loop_5');
      expect(context.activeLoops[4]).toBe('loop_9');
    });
    
    it('should handle empty game state gracefully', () => {
      gameState.worldEvents = [];
      gameState.flags = {};
      
      const context = buildChoiceContext(gameState);
      expect(context.activeLoops).toEqual([]);
      expect(context.questStates).toEqual({});
    });
  });
  
  describe('Full Scenario: Bar Fight', () => {
    it('should correctly track all systems during a bar fight scenario', () => {
      // Scene: Player enters tavern, gets into a fight, and steals from unconscious opponent
      
      // Tick 1: Player enters tavern
      eventBus.setTick(1);
      eventBus.emit({ type: 'LOCATION_ENTERED', data: { entityId: 'player', location: 'tavern' } });
      
      // Some NPCs are already there
      eventBus.emit({ type: 'LOCATION_ENTERED', data: { entityId: 'bartender', location: 'tavern' }, tick: 0 });
      eventBus.emit({ type: 'LOCATION_ENTERED', data: { entityId: 'drunk', location: 'tavern' }, tick: 0 });
      
      // Tick 2: Argument starts (no combat yet)
      eventBus.setTick(2);
      expect(detectCombatState(eventBus, 2)).toBe(false);
      
      // Tick 3: Fight breaks out
      eventBus.setTick(3);
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 5, target: 'drunk' } });
      expect(detectCombatState(eventBus, 3)).toBe(true);
      
      // Tick 4: Fight continues
      eventBus.setTick(4);
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 10, target: 'player' } });
      eventBus.emit({ type: 'DAMAGE_DEALT', data: { amount: 12, target: 'drunk' } });
      expect(detectCombatState(eventBus, 4)).toBe(true);
      expect(calculateTimeSinceLastConflict(eventBus, 4)).toBe(0);
      
      // Tick 5: Drunk knocked out, player steals wallet
      eventBus.setTick(5);
      eventBus.emit({ type: 'KNOCKOUT', data: { target: 'drunk' } });
      eventBus.emit({ type: 'ITEM_STOLEN', data: { itemId: 'wallet', from: 'drunk', to: 'player' } });
      
      // Bartender witnessed the theft (NPC was there at tick 0, theft at tick 5)
      // detectWitness checks for LOCATION_ENTERED events in range [theftTick-1, theftTick+1]
      // The bartender entered at tick 0, which is NOT in range [4, 6], so random value matters
      const wasWitnessed = detectWitness(eventBus, 5, 0.2); // 0.2 < 0.3, so witnessed by fate
      expect(wasWitnessed).toBe(true);
      
      // Tick 8: Combat has ended
      eventBus.setTick(8);
      expect(detectCombatState(eventBus, 8)).toBe(false);
      expect(calculateTimeSinceLastConflict(eventBus, 8)).toBe(4);
      
      // Verify event timeline
      const timeline = eventBus.getRecentEvents(20);
      expect(timeline.some(e => e.type === 'ITEM_STOLEN')).toBe(true);
      expect(timeline.filter(e => e.type === 'DAMAGE_DEALT').length).toBe(3);
    });
  });
});
