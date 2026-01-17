// Bridge component that connects EventBus game events to SessionStats tracking
// This component should be placed inside SessionStatsProvider

import { useEffect, useRef } from 'react';
import { useSessionStatsOptional } from './SessionStats';
import { eventBus, GameBusEvent, GameEventType } from '@/game/eventBus';

/**
 * SessionStatsBridge subscribes to the EventBus and updates session stats
 * based on game events like combat, item usage, reputation changes, etc.
 */
export function SessionStatsBridge() {
  const sessionStats = useSessionStatsOptional();
  // Use stable ref to track subscription - don't reset on cleanup
  const subscriptionRef = useRef<(() => void) | null>(null);
  const hasInitializedRef = useRef(false);
  
  useEffect(() => {
    // Skip if no context or already subscribed
    if (!sessionStats) return;
    if (subscriptionRef.current) return;
    
    // Only log on first initialization, not re-mounts
    if (!hasInitializedRef.current) {
      console.log('[SessionStatsBridge] Initializing event subscriptions');
      hasInitializedRef.current = true;
    }
    
    // Subscribe to all relevant events
    subscriptionRef.current = eventBus.subscribe(
      '*', // Subscribe to all events
      (event: GameBusEvent) => {
        handleGameEvent(event, sessionStats);
      },
      0 // Normal priority
    );
    
    return () => {
      // Only unsubscribe when truly unmounting, not on re-renders
      if (subscriptionRef.current) {
        subscriptionRef.current();
        subscriptionRef.current = null;
      }
    };
  }, [sessionStats]);
  
  // No UI - this is just a bridge component
  return null;
}

function handleGameEvent(
  event: GameBusEvent,
  sessionStats: NonNullable<ReturnType<typeof useSessionStatsOptional>>
) {
  const data = (event as any).data || {};
  
  switch (event.type as GameEventType) {
    // === COMBAT EVENTS ===
    case 'COMBAT_WON':
      sessionStats.incrementStat('combatEncounters');
      sessionStats.incrementStat('enemiesDefeated');
      console.log('[SessionStatsBridge] Combat won tracked');
      break;
      
    case 'DAMAGE_DEALT':
      if (typeof data.amount === 'number') {
        sessionStats.incrementStat('damageDealt', data.amount);
      }
      break;
      
    case 'DAMAGE_RECEIVED':
      if (typeof data.amount === 'number') {
        sessionStats.incrementStat('damageTaken', data.amount);
      }
      break;
      
    case 'DEATH':
      sessionStats.incrementStat('deathCount');
      console.log('[SessionStatsBridge] Death tracked');
      break;
      
    // === ITEM EVENTS ===
    case 'ITEM_CREATED':
      sessionStats.incrementStat('itemsCrafted');
      console.log('[SessionStatsBridge] Item crafted tracked');
      break;
      
    case 'ITEM_TRANSFERRED':
    case 'ITEM_PICKED_UP':
      sessionStats.incrementStat('itemsAcquired');
      break;
      
    case 'ITEM_USED':
      sessionStats.incrementStat('itemsUsed');
      break;
      
    case 'ITEM_PURCHASED':
      // Track gold spent when purchasing
      if (typeof data.cost === 'number') {
        sessionStats.incrementStat('goldSpent', data.cost);
      }
      sessionStats.incrementStat('itemsAcquired');
      break;
      
    case 'ITEM_SOLD':
      // Track gold earned when selling
      if (typeof data.value === 'number') {
        sessionStats.incrementStat('goldEarned', data.value);
      }
      break;
      
    case 'TRADE_COMPLETED':
      // Track trade transactions
      if (typeof data.goldSpent === 'number') {
        sessionStats.incrementStat('goldSpent', data.goldSpent);
      }
      if (typeof data.goldReceived === 'number') {
        sessionStats.incrementStat('goldEarned', data.goldReceived);
      }
      break;
      
    // === REPUTATION EVENTS ===
    case 'REPUTATION_CHANGED':
    case 'FACTION_STANDING_CHANGED':
      const repDelta = (data.newValue || 0) - (data.previousValue || 0);
      if (repDelta > 0) {
        sessionStats.incrementStat('reputationGained', repDelta);
      } else if (repDelta < 0) {
        sessionStats.incrementStat('reputationLost', Math.abs(repDelta));
      }
      // Track faction encounters
      if (data.factionId) {
        sessionStats.addFactionEncounter(data.factionId);
      }
      break;
      
    case 'FACTION_REPUTATION_CHANGED':
      if (data.factionId) {
        sessionStats.addFactionEncounter(data.factionId);
      }
      const factionDelta = (data.newValue || 0) - (data.previousValue || 0);
      if (factionDelta > 0) {
        sessionStats.incrementStat('reputationGained', factionDelta);
      } else if (factionDelta < 0) {
        sessionStats.incrementStat('reputationLost', Math.abs(factionDelta));
      }
      break;
      
    // === RELATIONSHIP EVENTS ===
    case 'RELATIONSHIP_CHANGED':
    case 'TRUST_CHANGED':
    case 'RESPECT_CHANGED':
      sessionStats.incrementStat('dialogueExchanges');
      break;
      
    // === QUEST EVENTS ===
    case 'QUEST_COMPLETED':
      sessionStats.incrementStat('questsCompleted');
      console.log('[SessionStatsBridge] Quest completed tracked');
      break;
      
    case 'QUEST_STARTED':
      // Could track quests started if needed
      break;
      
    // === LOCATION EVENTS ===
    case 'LOCATION_ENTERED':
      if (data.locationName) {
        sessionStats.addLocationVisit(data.locationName);
      } else if (data.locationId) {
        sessionStats.addLocationVisit(data.locationId);
      }
      break;
      
    // === KNOWLEDGE EVENTS ===
    case 'SECRET_SHARED':
    case 'REVELATION':
      sessionStats.incrementStat('secretsDiscovered');
      console.log('[SessionStatsBridge] Secret discovered tracked');
      break;
      
    // === HEALING ===
    case 'WOUND_TREATED':
      if (typeof data.healAmount === 'number') {
        sessionStats.incrementStat('healingReceived', data.healAmount);
      }
      break;
      
    case 'NEED_RESTORED':
      // Could track needs restoration if desired
      break;
      
    // === COLLECTOR EVENTS ===
    case 'RARE_ITEM_FOUND':
    case 'LEGENDARY_ITEM_FOUND':
      sessionStats.incrementStat('itemsAcquired');
      sessionStats.incrementStat('secretsDiscovered');
      break;
      
    default:
      // Unhandled event type - ignore silently
      break;
  }
}

export default SessionStatsBridge;
