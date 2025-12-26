// Game Loop Hook - Processes ripple effects, world state changes, and time-based systems
// Integrates consequence cascades from player actions with location-aware scoping

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ActiveRipple,
  WorldStateChanges,
  createDefaultWorldState,
  createRipple,
  processRipples,
  applyRippleEffect,
  detectActionCategory,
  ActionCategory,
} from '@/game/rippleEffectSystem';
import { Rumor, processRumorSpread, createRumor } from '@/game/unreliableInformationSystem';
import { NPCGrudgeContext, processGrudgeDecay, processDebtDecay } from '@/game/npcGrudgeSystem';
import {
  PlayerLocation,
  LocationHistory,
  ScopedRipple,
  LocationConsequence,
  createDefaultLocation,
  createLocationHistory,
  updatePlayerLocation,
  addLocationHistoryEntry,
  createScopedRipple,
  filterRipplesByLocation,
  getActiveConsequencesForLocation,
  buildLocationContext,
  buildRippleScopeContext,
} from '@/game/locationTrackingSystem';
import { UrbanZone, UrbanLocation } from '@/types/urbanZone';

// ============= STORAGE KEYS =============
const RIPPLES_KEY = 'untold-active-ripples';
const WORLD_STATE_KEY = 'untold-world-state';
const NARRATIVE_QUEUE_KEY = 'untold-narrative-queue';
const RUMORS_KEY = 'untold-active-rumors';
const NPC_CONTEXTS_KEY = 'untold-scene-npcs';
const LOCATION_KEY = 'untold-player-location';
const LOCATION_HISTORY_KEY = 'untold-location-history';

// ============= TYPES =============
export interface GameLoopState {
  activeRipples: ScopedRipple[];
  worldState: WorldStateChanges;
  narrativeQueue: string[];
  activeRumors: Rumor[];
  sceneNPCs: NPCGrudgeContext[];
  currentTurn: number;
  playerLocation: PlayerLocation;
  locationHistory: LocationHistory;
  activeConsequences: LocationConsequence[];
}

export interface GameLoopActions {
  // Core processing
  advanceTurn: (turns?: number) => void;
  processPlayerAction: (action: string, isPublic?: boolean, crowdSize?: number) => void;
  
  // Location tracking
  moveToZone: (zone: UrbanZone, location?: UrbanLocation | null, significantEvents?: string[]) => void;
  getLocationContext: () => string;
  getRippleScopeContext: () => string;
  
  // Ripple management
  addRipple: (ripple: ActiveRipple, connectedZones?: string[]) => void;
  cancelRipple: (rippleId: string, reason: string) => void;
  
  // World state
  updateWorldState: (partial: Partial<WorldStateChanges>) => void;
  resetWorldState: () => void;
  
  // Narrative queue
  consumeNarrativeQueue: () => string[];
  clearNarrativeQueue: () => void;
  
  // Rumors
  addRumor: (content: string, origin: string, truthValue: number, emotionalCharge?: number) => void;
  
  // NPC management
  setSceneNPCs: (npcs: NPCGrudgeContext[]) => void;
  updateNPC: (npcId: string, updates: Partial<NPCGrudgeContext>) => void;
  
  // Persistence
  getSerializedState: () => string;
  restoreState: (serialized: string) => boolean;
}

// ============= HELPER FUNCTIONS =============
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error(`Failed to load ${key}:`, e);
  }
  return defaultValue;
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key}:`, e);
  }
}

// ============= HOOK =============
export function useGameLoop(initialTurn: number = 0): [GameLoopState, GameLoopActions] {
  // State
  const [activeRipples, setActiveRipples] = useState<ScopedRipple[]>(() => 
    loadFromStorage(RIPPLES_KEY, [])
  );
  
  const [worldState, setWorldState] = useState<WorldStateChanges>(() => 
    loadFromStorage(WORLD_STATE_KEY, createDefaultWorldState())
  );
  
  const [narrativeQueue, setNarrativeQueue] = useState<string[]>(() => 
    loadFromStorage(NARRATIVE_QUEUE_KEY, [])
  );
  
  const [activeRumors, setActiveRumors] = useState<Rumor[]>(() => 
    loadFromStorage(RUMORS_KEY, [])
  );
  
  const [sceneNPCs, setSceneNPCs] = useState<NPCGrudgeContext[]>(() => 
    loadFromStorage(NPC_CONTEXTS_KEY, [])
  );
  
  const [playerLocation, setPlayerLocation] = useState<PlayerLocation>(() =>
    loadFromStorage(LOCATION_KEY, createDefaultLocation())
  );
  
  const [locationHistory, setLocationHistory] = useState<LocationHistory>(() =>
    loadFromStorage(LOCATION_HISTORY_KEY, createLocationHistory())
  );
  
  const [currentTurn, setCurrentTurn] = useState(initialTurn);
  
  // Track for debounced saves
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Calculate active consequences for current location
  const activeConsequences = getActiveConsequencesForLocation(
    activeRipples,
    playerLocation,
    currentTurn
  );
  
  // Debounced save effect
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(RIPPLES_KEY, activeRipples);
      saveToStorage(WORLD_STATE_KEY, worldState);
      saveToStorage(NARRATIVE_QUEUE_KEY, narrativeQueue);
      saveToStorage(RUMORS_KEY, activeRumors);
      saveToStorage(NPC_CONTEXTS_KEY, sceneNPCs);
      saveToStorage(LOCATION_KEY, playerLocation);
      saveToStorage(LOCATION_HISTORY_KEY, locationHistory);
    }, 500);
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [activeRipples, worldState, narrativeQueue, activeRumors, sceneNPCs, playerLocation, locationHistory]);
  
  // ============= LOCATION TRACKING =============
  
  const moveToZone = useCallback((
    zone: UrbanZone,
    location: UrbanLocation | null = null,
    significantEvents: string[] = []
  ) => {
    // Add current location to history before moving
    if (playerLocation.zoneId !== zone.id || playerLocation.locationId !== location?.id) {
      setLocationHistory(prev => 
        addLocationHistoryEntry(prev, playerLocation, currentTurn, significantEvents)
      );
    }
    
    // Update to new location
    setPlayerLocation(prev => updatePlayerLocation(prev, zone, location, currentTurn));
    
    console.log(`[GameLoop] Moved to ${zone.name}${location ? ` / ${location.name}` : ''}`);
  }, [playerLocation, currentTurn]);
  
  const getLocationContext = useCallback(() => {
    return buildLocationContext(playerLocation, locationHistory, activeConsequences);
  }, [playerLocation, locationHistory, activeConsequences]);
  
  const getRippleScopeContext = useCallback(() => {
    return buildRippleScopeContext(activeRipples, playerLocation, currentTurn);
  }, [activeRipples, playerLocation, currentTurn]);
  
  // ============= CORE PROCESSING =============
  
  const advanceTurn = useCallback((turns: number = 1) => {
    const newTurn = currentTurn + turns;
    setCurrentTurn(newTurn);
    
    // Filter ripples relevant to current location before processing
    const relevantRipples = filterRipplesByLocation(activeRipples, playerLocation, newTurn);
    
    // Process ripples for this turn
    const rippleResult = processRipples(relevantRipples, newTurn);
    
    if (rippleResult.triggeredEffects.length > 0) {
      console.log(`[GameLoop] Turn ${newTurn}: ${rippleResult.triggeredEffects.length} ripple effects triggered at ${playerLocation.zoneName}`);
      
      // Apply world state changes from triggered effects
      let updatedWorldState = { ...worldState };
      for (const effect of rippleResult.triggeredEffects) {
        updatedWorldState = applyRippleEffect(effect, updatedWorldState);
      }
      setWorldState(updatedWorldState);
      
      // Add to narrative queue
      setNarrativeQueue(prev => [...prev, ...rippleResult.narrativeQueue]);
    }
    
    // Update ripples (merge back with non-relevant ones)
    const nonRelevantRipples = activeRipples.filter(r => !relevantRipples.includes(r));
    setActiveRipples([...nonRelevantRipples, ...rippleResult.updatedRipples] as ScopedRipple[]);
    
    // Process rumor spread (every 6 turns = roughly every 6 hours in-game)
    if (newTurn % 6 === 0 && activeRumors.length > 0) {
      const npcProfiles: Record<string, any> = {};
      const updatedRumors = processRumorSpread(activeRumors, npcProfiles, 6);
      setActiveRumors(updatedRumors);
    }
    
    // Process NPC grudge/debt decay (every 12 turns = roughly every 12 hours)
    if (newTurn % 12 === 0 && sceneNPCs.length > 0) {
      setSceneNPCs(prev => prev.map(npc => ({
        ...npc,
        grudges: processGrudgeDecay(npc.grudges, 12),
        debts: processDebtDecay(npc.debts, 12),
      })));
    }
    
    // Decay world state over time
    if (newTurn % 24 === 0) {
      setWorldState(prev => ({
        ...prev,
        guardAlertLevel: Math.max(0, prev.guardAlertLevel - 5),
        publicMood: prev.publicMood === 'panicked' ? 'fearful' : 
                    prev.publicMood === 'fearful' ? 'uneasy' : 
                    prev.publicMood === 'uneasy' ? 'peaceful' : prev.publicMood,
        securityLevel: prev.securityLevel === 'lockdown' && prev.guardAlertLevel < 50 ? 'high' :
                       prev.securityLevel === 'high' && prev.guardAlertLevel < 30 ? 'elevated' :
                       prev.securityLevel === 'elevated' && prev.guardAlertLevel < 15 ? 'normal' : prev.securityLevel,
        activeInvestigations: prev.activeInvestigations
          .map(inv => ({ ...inv, hoursRemaining: inv.hoursRemaining - 24 }))
          .filter(inv => inv.hoursRemaining > 0),
      }));
    }
  }, [currentTurn, activeRipples, worldState, activeRumors, sceneNPCs, playerLocation]);
  
  const processPlayerAction = useCallback((
    action: string,
    isPublic: boolean = false,
    crowdSize: number = 1
  ) => {
    const detection = detectActionCategory(action, { isPublic, crowdSize });
    
    if (detection) {
      console.log(`[GameLoop] Detected action at ${playerLocation.zoneName}: ${detection.category}/${detection.templateKey} (${detection.witnesses} witnesses)`);
      
      const baseRipple = createRipple(
        action,
        detection.category,
        detection.templateKey,
        playerLocation.zoneName,
        currentTurn,
        'player',
        detection.witnesses
      );
      
      if (baseRipple) {
        // Scope the ripple to the current location
        const scopedRipple = createScopedRipple(
          baseRipple,
          playerLocation,
          [] // Connected zones would come from zone data
        );
        
        setActiveRipples(prev => [...prev, scopedRipple]);
        console.log(`[GameLoop] Created scoped ripple: ${scopedRipple.id} with scope ${scopedRipple.scope.level}`);
        
        // Major actions might also start rumors
        if (scopedRipple.severity === 'major' || scopedRipple.severity === 'severe' || scopedRipple.severity === 'catastrophic') {
          const rumorContent = `Someone ${action.slice(0, 50)}... in ${playerLocation.zoneName}`;
          const emotionalCharge = scopedRipple.severity === 'catastrophic' ? 9 : scopedRipple.severity === 'severe' ? 7 : 5;
          const newRumor = createRumor(rumorContent, 'witness', 85, emotionalCharge);
          setActiveRumors(prev => [...prev, newRumor]);
        }
      }
    }
  }, [currentTurn, playerLocation]);
  
  // ============= RIPPLE MANAGEMENT =============
  
  const addRipple = useCallback((ripple: ActiveRipple, connectedZones: string[] = []) => {
    const scopedRipple = createScopedRipple(ripple, playerLocation, connectedZones);
    setActiveRipples(prev => [...prev, scopedRipple]);
  }, [playerLocation]);
  
  const cancelRipple = useCallback((rippleId: string, reason: string) => {
    setActiveRipples(prev => prev.map(r => 
      r.id === rippleId && r.interruptible 
        ? { ...r, expired: true, interruptedBy: reason }
        : r
    ));
  }, []);
  
  // ============= WORLD STATE =============
  
  const updateWorldState = useCallback((partial: Partial<WorldStateChanges>) => {
    setWorldState(prev => ({ ...prev, ...partial }));
  }, []);
  
  const resetWorldState = useCallback(() => {
    setWorldState(createDefaultWorldState());
  }, []);
  
  // ============= NARRATIVE QUEUE =============
  
  const consumeNarrativeQueue = useCallback(() => {
    const queue = [...narrativeQueue];
    setNarrativeQueue([]);
    return queue;
  }, [narrativeQueue]);
  
  const clearNarrativeQueue = useCallback(() => {
    setNarrativeQueue([]);
  }, []);
  
  // ============= RUMORS =============
  
  const addRumor = useCallback((content: string, origin: string, truthValue: number, emotionalCharge: number = 5) => {
    const rumor = createRumor(content, origin, truthValue, emotionalCharge);
    setActiveRumors(prev => [...prev, rumor]);
  }, []);
  
  // ============= NPC MANAGEMENT =============
  
  const updateNPC = useCallback((npcId: string, updates: Partial<NPCGrudgeContext>) => {
    setSceneNPCs(prev => prev.map(npc => 
      npc.npcId === npcId ? { ...npc, ...updates } : npc
    ));
  }, []);
  
  // ============= PERSISTENCE =============
  
  const getSerializedState = useCallback(() => {
    return JSON.stringify({
      activeRipples,
      worldState,
      narrativeQueue,
      activeRumors,
      sceneNPCs,
      currentTurn,
      playerLocation,
      locationHistory,
    });
  }, [activeRipples, worldState, narrativeQueue, activeRumors, sceneNPCs, currentTurn, playerLocation, locationHistory]);
  
  const restoreState = useCallback((serialized: string): boolean => {
    try {
      const parsed = JSON.parse(serialized);
      if (parsed.activeRipples) setActiveRipples(parsed.activeRipples);
      if (parsed.worldState) setWorldState(parsed.worldState);
      if (parsed.narrativeQueue) setNarrativeQueue(parsed.narrativeQueue);
      if (parsed.activeRumors) setActiveRumors(parsed.activeRumors);
      if (parsed.sceneNPCs) setSceneNPCs(parsed.sceneNPCs);
      if (typeof parsed.currentTurn === 'number') setCurrentTurn(parsed.currentTurn);
      if (parsed.playerLocation) setPlayerLocation(parsed.playerLocation);
      if (parsed.locationHistory) setLocationHistory(parsed.locationHistory);
      return true;
    } catch (e) {
      console.error('Failed to restore game loop state:', e);
      return false;
    }
  }, []);
  
  // ============= RETURN =============
  
  const state: GameLoopState = {
    activeRipples,
    worldState,
    narrativeQueue,
    activeRumors,
    sceneNPCs,
    currentTurn,
    playerLocation,
    locationHistory,
    activeConsequences,
  };
  
  const actions: GameLoopActions = {
    advanceTurn,
    processPlayerAction,
    moveToZone,
    getLocationContext,
    getRippleScopeContext,
    addRipple,
    cancelRipple,
    updateWorldState,
    resetWorldState,
    consumeNarrativeQueue,
    clearNarrativeQueue,
    addRumor,
    setSceneNPCs,
    updateNPC,
    getSerializedState,
    restoreState,
  };
  
  return [state, actions];
}
