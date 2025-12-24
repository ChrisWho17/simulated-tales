// ============================================================================
// CAMPAIGN MEMORY SYSTEM
// Implements: STM/MTM/LTM, Promotion, Decay, Compression, Contradiction Handling
// ============================================================================

import {
  Campaign,
  CampaignMemoryStore,
  MemoryObject,
  MemoryTier,
  MemoryProvenance,
  MemoryClassification,
  MemoryObjectType,
  EventMemory,
  IdentityAnchor,
  OpenLoop,
  LocationState,
  LocationScar,
  ContradictionRecord,
  AtomicDelta,
  SessionSummary,
  MemoryRetrievalContext,
  StateChange,
  KnowledgeClaim,
  LoopEscalation,
  LoopResolution,
  InvariantViolation,
  LoopState,
} from '@/types/campaignMemory';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_STM_LIMIT = 60;
const DEFAULT_MTM_LIMIT = 30;
const DEFAULT_LTM_LIMIT = 100;

const PROMOTION_THRESHOLDS = {
  stmToMtm: 40,   // Score needed to promote from STM to MTM
  mtmToLtm: 70,   // Score needed to promote from MTM to LTM
};

const DECAY_RATES = {
  stm: 5,         // Points lost per tick
  mtm: 0.5,       // Points lost per tick
  ltm: 0,         // LTM never decays (only reclassifies)
};

const FORGET_THRESHOLD = 10;

// ============================================================================
// CAMPAIGN INITIALIZATION
// ============================================================================

export function createCampaign(
  name: string,
  characterName: string,
  toneProfile: string[] = []
): Campaign {
  const now = Date.now();
  const campaignId = `camp_${now}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: campaignId,
    name,
    characterName,
    createdAt: now,
    lastPlayed: now,
    rulesetVersion: '1.0.0',
    worldSeed: Math.random().toString(36).substr(2, 16),
    toneProfile,
    memoryPolicy: {
      stmLimit: DEFAULT_STM_LIMIT,
      mtmSessions: 8,
      ltmCap: 'unbounded',
    },
    forkPolicy: 'selective',
    crossCampaignLinks: false,
    status: 'active',
    currentBranchId: 'branch_main',
    currentTick: 0,
    currentSession: 1,
  };
}

export function initializeCampaignMemoryStore(campaign: Campaign): CampaignMemoryStore {
  return {
    campaign,
    stm: [],
    mtm: [],
    ltm: [],
    identityAnchors: [],
    openLoops: [],
    locationStates: {},
    contradictions: [],
    deltaJournal: [],
    sessionSummaries: [],
  };
}

// ============================================================================
// MEMORY OBJECT CREATION
// ============================================================================

export function createMemoryObject(
  campaignId: string,
  branchId: string,
  type: MemoryObjectType,
  data: {
    entities: string[];
    location: string;
    summary: string;
    details: string;
    tags?: string[];
    importance?: number;
    emotionalWeight?: number;
    provenance?: MemoryProvenance;
    causalParents?: string[];
  },
  tick: number
): MemoryObject {
  const id = `mem_${tick}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Calculate initial tier based on importance and emotional weight
  const importance = data.importance ?? 50;
  const emotionalWeight = data.emotionalWeight ?? 30;
  const combinedScore = importance * 0.6 + emotionalWeight * 0.4;
  
  let tier: MemoryTier = 'stm';
  if (combinedScore >= PROMOTION_THRESHOLDS.mtmToLtm) {
    tier = 'ltm';
  } else if (combinedScore >= PROMOTION_THRESHOLDS.stmToMtm) {
    tier = 'mtm';
  }
  
  // Determine classification based on provenance
  let classification: MemoryClassification = 'fact';
  if (data.provenance === 'rumor') {
    classification = 'rumor';
  } else if (data.provenance === 'inferred') {
    classification = 'belief';
  }
  
  return {
    id,
    type,
    timestamp: {
      worldTime: tick,
      realTime: Date.now(),
    },
    entities: data.entities,
    location: data.location,
    campaignId,
    branchId,
    tags: data.tags ?? [],
    importance,
    emotionalWeight,
    volatility: 100 - importance, // High importance = low volatility
    confidence: data.provenance === 'observed' ? 95 :
                data.provenance === 'inferred' ? 70 :
                data.provenance === 'reported' ? 50 : 30,
    provenance: data.provenance ?? 'observed',
    classification,
    causalParents: data.causalParents ?? [],
    effects: [],
    contradictions: [],
    tier,
    promotionScore: combinedScore,
    expiryPolicy: tier,
    summary: data.summary,
    details: data.details,
    isCanon: tier === 'ltm',
    isActive: true,
  };
}

export function createEventMemory(
  campaignId: string,
  branchId: string,
  data: {
    action: string;
    result: string;
    entities: string[];
    location: string;
    summary: string;
    details: string;
    stateChanges?: StateChange[];
    knowledgeClaims?: KnowledgeClaim[];
    tags?: string[];
    importance?: number;
    emotionalWeight?: number;
    provenance?: MemoryProvenance;
  },
  tick: number
): EventMemory {
  const base = createMemoryObject(campaignId, branchId, 'event', data, tick);
  
  return {
    ...base,
    type: 'event',
    action: data.action,
    result: data.result,
    stateChanges: data.stateChanges ?? [],
    knowledgeClaims: data.knowledgeClaims ?? [],
    timersAffected: [],
    flagsSet: [],
    flagsCleared: [],
  };
}

// ============================================================================
// ATOMIC DELTA LOGGING
// ============================================================================

export function logAtomicDelta(
  store: CampaignMemoryStore,
  action: string,
  result: string,
  stateChanges: StateChange[],
  tick: number
): CampaignMemoryStore {
  const delta: AtomicDelta = {
    id: `delta_${tick}_${Math.random().toString(36).substr(2, 9)}`,
    tick,
    realTime: Date.now(),
    action,
    result,
    stateChanges,
    knowledgeClaims: [],
    timersStarted: [],
    timersStopped: [],
    flagsSet: [],
    flagsCleared: [],
  };
  
  return {
    ...store,
    deltaJournal: [...store.deltaJournal, delta],
  };
}

// ============================================================================
// MEMORY WRITE PIPELINE
// ============================================================================

export function addMemory(
  store: CampaignMemoryStore,
  memory: MemoryObject
): CampaignMemoryStore {
  let updatedStore = { ...store };
  
  // Step 1: Add to appropriate tier
  switch (memory.tier) {
    case 'stm':
      updatedStore.stm = [memory, ...updatedStore.stm];
      break;
    case 'mtm':
      updatedStore.mtm = [memory, ...updatedStore.mtm];
      break;
    case 'ltm':
      updatedStore.ltm = [memory, ...updatedStore.ltm];
      break;
  }
  
  // Step 2: Handle overflow
  updatedStore = handleMemoryOverflow(updatedStore);
  
  // Step 3: Check for contradictions
  updatedStore = detectContradictions(updatedStore, memory);
  
  return updatedStore;
}

// ============================================================================
// MEMORY OVERFLOW & PROMOTION
// ============================================================================

function handleMemoryOverflow(store: CampaignMemoryStore): CampaignMemoryStore {
  let updatedStore = { ...store };
  const stmLimit = store.campaign.memoryPolicy.stmLimit;
  
  // STM overflow - promote or forget
  while (updatedStore.stm.length > stmLimit) {
    const sorted = [...updatedStore.stm].sort((a, b) => a.promotionScore - b.promotionScore);
    const toProcess = sorted[0];
    
    if (toProcess.promotionScore >= PROMOTION_THRESHOLDS.stmToMtm) {
      // Promote to MTM
      const promoted = { ...toProcess, tier: 'mtm' as MemoryTier };
      updatedStore.mtm = [promoted, ...updatedStore.mtm];
    }
    // Either promoted or forgotten
    updatedStore.stm = updatedStore.stm.filter(m => m.id !== toProcess.id);
  }
  
  // MTM overflow
  while (updatedStore.mtm.length > DEFAULT_MTM_LIMIT) {
    const sorted = [...updatedStore.mtm].sort((a, b) => a.promotionScore - b.promotionScore);
    const toProcess = sorted[0];
    
    if (toProcess.promotionScore >= PROMOTION_THRESHOLDS.mtmToLtm) {
      // Promote to LTM
      const promoted = { ...toProcess, tier: 'ltm' as MemoryTier, isCanon: true };
      updatedStore.ltm = [promoted, ...updatedStore.ltm];
    }
    updatedStore.mtm = updatedStore.mtm.filter(m => m.id !== toProcess.id);
  }
  
  // LTM overflow (rare, careful handling)
  const ltmCap = store.campaign.memoryPolicy.ltmCap;
  if (ltmCap !== 'unbounded' && updatedStore.ltm.length > ltmCap) {
    // Only remove non-essential, low-importance memories
    const removable = updatedStore.ltm
      .filter(m => m.importance < 50 && !m.isCanon)
      .sort((a, b) => a.importance - b.importance);
    
    while (updatedStore.ltm.length > ltmCap && removable.length > 0) {
      const toRemove = removable.shift()!;
      updatedStore.ltm = updatedStore.ltm.filter(m => m.id !== toRemove.id);
    }
  }
  
  return updatedStore;
}

// ============================================================================
// MEMORY DECAY
// ============================================================================

export function decayMemories(store: CampaignMemoryStore, ticksElapsed: number = 1): CampaignMemoryStore {
  const decayMemory = (memory: MemoryObject, tier: MemoryTier): MemoryObject | null => {
    // High importance memories decay slower
    const decayResistance = memory.importance / 100;
    const actualDecay = DECAY_RATES[tier] * ticksElapsed * (1 - decayResistance * 0.5);
    
    const newScore = memory.promotionScore - actualDecay;
    
    if (newScore < FORGET_THRESHOLD && tier !== 'ltm') {
      return null; // Forgotten
    }
    
    return { ...memory, promotionScore: Math.max(0, newScore) };
  };
  
  return {
    ...store,
    stm: store.stm.map(m => decayMemory(m, 'stm')).filter(Boolean) as MemoryObject[],
    mtm: store.mtm.map(m => decayMemory(m, 'mtm')).filter(Boolean) as MemoryObject[],
    // LTM never decays
  };
}

// ============================================================================
// CONTRADICTION DETECTION
// ============================================================================

function detectContradictions(store: CampaignMemoryStore, newMemory: MemoryObject): CampaignMemoryStore {
  const allCanon = store.ltm.filter(m => m.isCanon);
  const contradictions: ContradictionRecord[] = [];
  
  for (const existing of allCanon) {
    // Simple contradiction detection based on same entities and opposing tags
    const sameEntities = newMemory.entities.some(e => existing.entities.includes(e));
    if (!sameEntities) continue;
    
    // Check for opposing claims in summary (very basic - would need NLP for real detection)
    // For now, just flag if same entity but very different emotional weight
    if (Math.abs(existing.emotionalWeight - newMemory.emotionalWeight) > 50 &&
        existing.location === newMemory.location) {
      const contradiction: ContradictionRecord = {
        id: `contr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId: store.campaign.id,
        memoryA: existing.id,
        memoryB: newMemory.id,
        discoveredAt: Date.now(),
        discoveredBy: 'system',
        confidenceA: existing.confidence,
        confidenceB: newMemory.confidence,
        provenanceA: existing.provenance,
        provenanceB: newMemory.provenance,
        resolved: false,
        resolutionReason: '',
      };
      contradictions.push(contradiction);
    }
  }
  
  if (contradictions.length > 0) {
    return {
      ...store,
      contradictions: [...store.contradictions, ...contradictions],
    };
  }
  
  return store;
}

// ============================================================================
// CONTRADICTION RESOLUTION
// ============================================================================

export function resolveContradiction(
  store: CampaignMemoryStore,
  contradictionId: string,
  winnerId: string,
  loserReclassification: MemoryClassification = 'belief'
): CampaignMemoryStore {
  const contradiction = store.contradictions.find(c => c.id === contradictionId);
  if (!contradiction || contradiction.resolved) return store;
  
  const loserId = winnerId === contradiction.memoryA ? contradiction.memoryB : contradiction.memoryA;
  
  // Update memories
  const updateMemory = (m: MemoryObject): MemoryObject => {
    if (m.id === winnerId) {
      return { ...m, isCanon: true, confidence: Math.min(100, m.confidence + 10) };
    }
    if (m.id === loserId) {
      return { ...m, isCanon: false, classification: loserReclassification };
    }
    return m;
  };
  
  // Update contradiction record
  const updatedContradictions = store.contradictions.map(c => 
    c.id === contradictionId
      ? { ...c, resolved: true, winner: winnerId, loserReclassification, resolution: 'promoted' as const }
      : c
  );
  
  return {
    ...store,
    stm: store.stm.map(updateMemory),
    mtm: store.mtm.map(updateMemory),
    ltm: store.ltm.map(updateMemory),
    contradictions: updatedContradictions,
  };
}

// ============================================================================
// IDENTITY ANCHORS
// ============================================================================

export function createIdentityAnchor(
  campaignId: string,
  type: IdentityAnchor['type'],
  anchor: string,
  description: string,
  triggers: string[],
  sourceEvent: string,
  tick: number
): IdentityAnchor {
  return {
    id: `anchor_${tick}_${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    type,
    anchor,
    description,
    triggers,
    importance: type === 'trauma' ? 100 : type === 'vow' ? 90 : 70,
    createdAt: tick,
    source: sourceEvent,
    isActive: true,
    violationCount: 0,
  };
}

export function addIdentityAnchor(store: CampaignMemoryStore, anchor: IdentityAnchor): CampaignMemoryStore {
  return {
    ...store,
    identityAnchors: [...store.identityAnchors, anchor],
  };
}

// ============================================================================
// OPEN LOOPS
// ============================================================================

export function createOpenLoop(
  campaignId: string,
  branchId: string,
  data: {
    name: string;
    description: string;
    trigger: string;
    urgency: OpenLoop['urgency'];
    ticksRemaining: number;
    affectedEntities: string[];
    location: string;
    escalationLadder: LoopEscalation[];
    resolutionPaths: LoopResolution[];
    tags?: string[];
  },
  tick: number
): OpenLoop {
  return {
    id: `loop_${tick}_${Math.random().toString(36).substr(2, 9)}`,
    campaignId,
    branchId,
    name: data.name,
    description: data.description,
    trigger: data.trigger,
    startTick: tick,
    currentTick: tick,
    ticksRemaining: data.ticksRemaining,
    urgency: data.urgency,
    escalationStage: 0,
    escalationLadder: data.escalationLadder,
    resolutionPaths: data.resolutionPaths,
    state: 'active',
    affectedEntities: data.affectedEntities,
    location: data.location,
    tags: data.tags ?? [],
    importance: data.urgency === 'critical' ? 100 : 
                data.urgency === 'high' ? 80 :
                data.urgency === 'medium' ? 60 : 40,
  };
}

export function addOpenLoop(store: CampaignMemoryStore, loop: OpenLoop): CampaignMemoryStore {
  return {
    ...store,
    openLoops: [...store.openLoops, loop],
  };
}

export function progressLoops(store: CampaignMemoryStore, ticksElapsed: number): CampaignMemoryStore {
  const updatedLoops = store.openLoops.map(loop => {
    if (loop.state !== 'active') return loop;
    
    const newTick = loop.currentTick + ticksElapsed;
    let newTicksRemaining = loop.ticksRemaining > 0 ? loop.ticksRemaining - ticksElapsed : -1;
    let newStage = loop.escalationStage;
    let newUrgency = loop.urgency;
    let newState: LoopState = loop.state;
    
    // Check escalation
    const nextEscalation = loop.escalationLadder.find(e => e.stage === newStage + 1);
    if (nextEscalation && (newTick - loop.startTick) >= nextEscalation.tickThreshold) {
      newStage = nextEscalation.stage;
      newUrgency = nextEscalation.urgencyAfter;
      newState = 'escalating';
    }
    
    // Check failure
    if (newTicksRemaining === 0) {
      newState = 'failed';
    }
    
    return {
      ...loop,
      currentTick: newTick,
      ticksRemaining: newTicksRemaining,
      escalationStage: newStage,
      urgency: newUrgency,
      state: newState,
    };
  });
  
  return {
    ...store,
    openLoops: updatedLoops,
  };
}

export function resolveLoop(
  store: CampaignMemoryStore,
  loopId: string,
  resolutionPathId: string
): CampaignMemoryStore {
  const loop = store.openLoops.find(l => l.id === loopId);
  if (!loop) return store;
  
  const resolution = loop.resolutionPaths.find(r => r.id === resolutionPathId);
  if (!resolution) return store;
  
  const resolvedLoop: OpenLoop = {
    ...loop,
    state: resolution.outcome === 'success' ? 'resolved' : 'failed',
  };
  
  return {
    ...store,
    openLoops: store.openLoops.map(l => l.id === loopId ? resolvedLoop : l),
  };
}

// ============================================================================
// LOCATION STATE
// ============================================================================

export function updateLocationState(
  store: CampaignMemoryStore,
  locationId: string,
  updates: Partial<Omit<LocationState, 'id' | 'locationId' | 'campaignId'>>
): CampaignMemoryStore {
  const existing = store.locationStates[locationId];
  
  const updated: LocationState = existing ? {
    ...existing,
    ...updates,
    lastUpdated: Date.now(),
  } : {
    id: `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    locationId,
    campaignId: store.campaign.id,
    structuralDamage: 0,
    damageDescriptions: [],
    populationChange: 0,
    populationNotes: [],
    securityLevel: 'normal',
    securityNotes: [],
    economicModifier: 0,
    priceModifiers: {},
    mood: 'normal',
    moodReason: '',
    activeRumors: [],
    environmentalHazards: [],
    scars: [],
    lastUpdated: Date.now(),
    ...updates,
  };
  
  return {
    ...store,
    locationStates: {
      ...store.locationStates,
      [locationId]: updated,
    },
  };
}

export function addLocationScar(
  store: CampaignMemoryStore,
  locationId: string,
  scar: Omit<LocationScar, 'id'>
): CampaignMemoryStore {
  const newScar: LocationScar = {
    ...scar,
    id: `scar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
  
  const existing = store.locationStates[locationId];
  if (!existing) {
    return updateLocationState(store, locationId, { scars: [newScar] });
  }
  
  return {
    ...store,
    locationStates: {
      ...store.locationStates,
      [locationId]: {
        ...existing,
        scars: [...existing.scars, newScar],
        lastUpdated: Date.now(),
      },
    },
  };
}

// ============================================================================
// MEMORY RETRIEVAL
// ============================================================================

export function retrieveMemoryContext(
  store: CampaignMemoryStore,
  currentLocation: string,
  activeEntities: string[],
  currentTick: number
): MemoryRetrievalContext {
  // Scene now (STM)
  const sceneNow = store.stm.filter(m => 
    m.location === currentLocation ||
    m.entities.some(e => activeEntities.includes(e))
  ).slice(0, 20);
  
  // Identity anchors (always loaded)
  const identityAnchors = store.identityAnchors.filter(a => a.isActive);
  
  // Active loops
  const activeLoops = store.openLoops.filter(l => l.state === 'active' || l.state === 'escalating');
  
  // Relevant MTM events
  const relevantMtmEvents = store.mtm
    .filter(m => 
      m.location === currentLocation ||
      m.entities.some(e => activeEntities.includes(e))
    )
    .sort((a, b) => b.promotionScore - a.promotionScore)
    .slice(0, 10);
  
  // Location state
  const locationState = store.locationStates[currentLocation] || null;
  const locationScars = locationState?.scars.filter(s => s.visibleTo === 'all') ?? [];
  
  // Canon facts
  const canonFacts = store.ltm.filter(m => m.isCanon).slice(0, 20);
  
  // Rumors and claims
  const rumorsAndClaims = [...store.stm, ...store.mtm]
    .filter(m => m.classification === 'rumor' || m.classification === 'belief')
    .slice(0, 10);
  
  return {
    sceneNow,
    identityAnchors,
    activeLoops,
    relevantMtmEvents,
    npcCards: [], // Would be populated by NPC memory system
    locationScars,
    locationState,
    canonFacts,
    rumorsAndClaims,
  };
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

export function endSession(store: CampaignMemoryStore, tick: number): CampaignMemoryStore {
  // Create session summary
  const sessionNumber = store.campaign.currentSession;
  const previousSummary = store.sessionSummaries[store.sessionSummaries.length - 1];
  const startTick = previousSummary?.endTick ?? 0;
  
  // Find key events from this session
  const sessionEvents = [...store.stm, ...store.mtm]
    .filter(m => m.timestamp.worldTime > startTick && m.timestamp.worldTime <= tick)
    .sort((a, b) => b.importance - a.importance);
  
  const summary: SessionSummary = {
    sessionNumber,
    startTick,
    endTick: tick,
    realTimeStart: previousSummary?.realTimeEnd ?? store.campaign.createdAt,
    realTimeEnd: Date.now(),
    keyEvents: sessionEvents.slice(0, 5).map(e => e.id),
    summary: `Session ${sessionNumber}: ${sessionEvents.slice(0, 3).map(e => e.summary).join('; ')}`,
    relationshipChanges: {},
    loopsResolved: store.openLoops.filter(l => l.state === 'resolved').map(l => l.id),
    loopsCreated: store.openLoops.filter(l => l.startTick > startTick).map(l => l.id),
    anchorsCreated: store.identityAnchors.filter(a => a.createdAt > startTick).map(a => a.id),
  };
  
  // Flush STM
  const flushedStore: CampaignMemoryStore = {
    ...store,
    stm: [], // Clear STM
    sessionSummaries: [...store.sessionSummaries, summary],
    campaign: {
      ...store.campaign,
      currentSession: sessionNumber + 1,
      lastPlayed: Date.now(),
    },
  };
  
  return flushedStore;
}

export function startSession(store: CampaignMemoryStore): CampaignMemoryStore {
  return {
    ...store,
    campaign: {
      ...store.campaign,
      status: 'active',
      lastPlayed: Date.now(),
    },
  };
}

// ============================================================================
// CAMPAIGN SWITCHING
// ============================================================================

export function freezeCampaign(store: CampaignMemoryStore): CampaignMemoryStore {
  return {
    ...store,
    stm: [], // Discard STM
    campaign: {
      ...store.campaign,
      status: 'frozen',
      lastPlayed: Date.now(),
    },
  };
}

export function archiveCampaign(store: CampaignMemoryStore): CampaignMemoryStore {
  return {
    ...store,
    stm: [],
    campaign: {
      ...store.campaign,
      status: 'archived',
      lastPlayed: Date.now(),
    },
  };
}

// ============================================================================
// INVARIANT CHECKS
// ============================================================================

export function checkInvariants(store: CampaignMemoryStore): InvariantViolation[] {
  const violations: InvariantViolation[] = [];
  
  // Check for time regressions
  let lastTick = 0;
  for (const delta of store.deltaJournal) {
    if (delta.tick < lastTick) {
      violations.push({
        type: 'time_regression',
        description: `Delta ${delta.id} has tick ${delta.tick} which is before previous tick ${lastTick}`,
        involvedEntities: [],
        tick: delta.tick,
        suggestedFix: 'Correct delta timestamp or remove invalid delta',
      });
    }
    lastTick = delta.tick;
  }
  
  // Check campaign ID consistency
  const allMemories = [...store.stm, ...store.mtm, ...store.ltm];
  for (const memory of allMemories) {
    if (memory.campaignId !== store.campaign.id) {
      violations.push({
        type: 'impossible_state',
        description: `Memory ${memory.id} has campaign ID ${memory.campaignId} but store is for ${store.campaign.id}`,
        involvedEntities: memory.entities,
        tick: memory.timestamp.worldTime,
        suggestedFix: 'Remove foreign campaign memory or correct campaign ID',
      });
    }
  }
  
  return violations;
}

// ============================================================================
// IDENTITY ANCHOR DETECTION FROM ACTIONS
// ============================================================================

const ALIGNMENT_KEYWORDS = {
  good: ['help', 'save', 'protect', 'defend', 'heal', 'rescue', 'comfort', 'forgive', 'spare', 'mercy'],
  evil: ['kill', 'murder', 'betray', 'steal', 'torture', 'deceive', 'destroy', 'corrupt', 'poison', 'curse'],
  lawful: ['obey', 'follow', 'honor', 'duty', 'oath', 'promise', 'contract', 'law', 'order', 'tradition'],
  chaotic: ['rebel', 'break', 'defy', 'freedom', 'chaos', 'random', 'impulse', 'wild', 'anarchy', 'revolt'],
};

const VALUE_KEYWORDS = {
  protective: ['protect', 'shield', 'defend', 'guard', 'save'],
  vengeful: ['revenge', 'avenge', 'payback', 'retribution', 'punish'],
  merciful: ['spare', 'mercy', 'forgive', 'release', 'compassion'],
  ambitious: ['power', 'rule', 'dominate', 'conquer', 'throne'],
  loyal: ['loyal', 'faithful', 'devoted', 'ally', 'friend'],
  independent: ['alone', 'solo', 'independent', 'free', 'self'],
};

export interface AlignmentScore {
  good: number;
  evil: number;
  lawful: number;
  chaotic: number;
}

export interface DetectedTrait {
  type: IdentityAnchor['type'];
  anchor: string;
  description: string;
  triggers: string[];
  confidence: number;
}

export function analyzeActionForTraits(
  action: string,
  narrativeResponse: string,
  existingAnchors: IdentityAnchor[]
): DetectedTrait[] {
  const detected: DetectedTrait[] = [];
  const lowerAction = action.toLowerCase();
  const lowerNarrative = narrativeResponse.toLowerCase();
  const combined = `${lowerAction} ${lowerNarrative}`;
  
  // Check for alignment traits
  for (const [alignment, keywords] of Object.entries(ALIGNMENT_KEYWORDS)) {
    const matches = keywords.filter(k => combined.includes(k));
    if (matches.length >= 2) {
      const existingAlignment = existingAnchors.find(
        a => a.type === 'value' && a.anchor.toLowerCase().includes(alignment)
      );
      if (!existingAlignment) {
        detected.push({
          type: 'value',
          anchor: `${alignment.charAt(0).toUpperCase() + alignment.slice(1)} alignment`,
          description: `Demonstrates ${alignment} tendencies through consistent actions`,
          triggers: matches,
          confidence: Math.min(100, matches.length * 25),
        });
      }
    }
  }
  
  // Check for value-based traits
  for (const [value, keywords] of Object.entries(VALUE_KEYWORDS)) {
    const matches = keywords.filter(k => combined.includes(k));
    if (matches.length >= 1) {
      const existing = existingAnchors.find(
        a => a.anchor.toLowerCase().includes(value)
      );
      if (!existing) {
        detected.push({
          type: 'value',
          anchor: `${value.charAt(0).toUpperCase() + value.slice(1)} nature`,
          description: `Shows ${value} behavior patterns`,
          triggers: matches,
          confidence: Math.min(100, matches.length * 30),
        });
      }
    }
  }
  
  // Detect vows/promises
  const vowPatterns = [
    /(?:i\s+)?(?:swear|vow|promise|pledge)\s+(?:to\s+)?(.{10,50})/i,
    /(?:i\s+will\s+)?never\s+(.{10,40})/i,
    /(?:i\s+will\s+)?always\s+(.{10,40})/i,
  ];
  
  for (const pattern of vowPatterns) {
    const match = combined.match(pattern);
    if (match && match[1]) {
      const existing = existingAnchors.find(
        a => a.type === 'vow' && a.anchor.toLowerCase().includes(match[1].toLowerCase().slice(0, 20))
      );
      if (!existing) {
        detected.push({
          type: 'vow',
          anchor: match[0].trim(),
          description: `A solemn oath made during the adventure`,
          triggers: [match[1].trim()],
          confidence: 80,
        });
      }
    }
  }
  
  return detected.filter(d => d.confidence >= 50);
}

export function processActionForIdentity(
  store: CampaignMemoryStore,
  action: string,
  narrativeResponse: string,
  tick: number
): CampaignMemoryStore {
  const detectedTraits = analyzeActionForTraits(action, narrativeResponse, store.identityAnchors);
  
  let updatedStore = store;
  for (const trait of detectedTraits) {
    if (trait.confidence >= 70) {
      const anchor = createIdentityAnchor(
        store.campaign.id,
        trait.type,
        trait.anchor,
        trait.description,
        trait.triggers,
        `action_${tick}`,
        tick
      );
      updatedStore = addIdentityAnchor(updatedStore, anchor);
      console.log(`[Identity] New anchor detected: ${trait.anchor} (confidence: ${trait.confidence})`);
    }
  }
  
  return updatedStore;
}

// ============================================================================
// MEMORY CONTEXT FORMATTING FOR AI
// ============================================================================

export interface FormattedMemoryContext {
  identitySection: string;
  recentEvents: string;
  activeLoops: string;
  worldState: string;
  fullContext: string;
}

export function formatMemoryContextForAI(
  context: MemoryRetrievalContext | null,
  characterName: string
): FormattedMemoryContext {
  if (!context) {
    return {
      identitySection: '',
      recentEvents: '',
      activeLoops: '',
      worldState: '',
      fullContext: '',
    };
  }
  
  // Format identity anchors
  let identitySection = '';
  if (context.identityAnchors.length > 0) {
    identitySection = `\n\n[${characterName.toUpperCase()}'S IDENTITY & VALUES]`;
    for (const anchor of context.identityAnchors) {
      const typeLabel = anchor.type.toUpperCase();
      identitySection += `\n• [${typeLabel}] ${anchor.anchor}: ${anchor.description}`;
      if (anchor.violationCount > 0) {
        identitySection += ` (violated ${anchor.violationCount}x)`;
      }
    }
    identitySection += `\n\nIMPORTANT: These define ${characterName}'s core identity. Reference them when relevant to choices and consequences.`;
  }
  
  // Format recent events (STM)
  let recentEvents = '';
  if (context.sceneNow.length > 0) {
    recentEvents = '\n\n[RECENT EVENTS (This Scene)]';
    for (const mem of context.sceneNow.slice(0, 5)) {
      recentEvents += `\n• ${mem.summary}`;
    }
  }
  
  // Format active loops (unresolved tensions)
  let activeLoops = '';
  if (context.activeLoops.length > 0) {
    activeLoops = '\n\n[UNRESOLVED TENSIONS]';
    for (const loop of context.activeLoops) {
      const urgencyEmoji = loop.urgency === 'critical' ? '🔴' : 
                           loop.urgency === 'high' ? '🟠' : 
                           loop.urgency === 'medium' ? '🟡' : '🟢';
      activeLoops += `\n• ${urgencyEmoji} ${loop.name}: ${loop.description}`;
      if (loop.ticksRemaining > 0) {
        activeLoops += ` (${loop.ticksRemaining} turns remaining)`;
      }
    }
    activeLoops += '\n\nThese tensions should influence the narrative. Remind the player of urgent matters.';
  }
  
  // Format world state
  let worldState = '';
  if (context.locationState) {
    const loc = context.locationState;
    worldState = '\n\n[LOCATION STATE]';
    if (loc.structuralDamage > 0) {
      worldState += `\nDamage: ${loc.damageDescriptions.join(', ')}`;
    }
    if (loc.mood !== 'normal') {
      worldState += `\nAtmosphere: ${loc.mood} (${loc.moodReason})`;
    }
    if (context.locationScars.length > 0) {
      worldState += '\nScars from past events:';
      for (const scar of context.locationScars.slice(0, 3)) {
        worldState += `\n  - ${scar.description}`;
      }
    }
  }
  
  // Add canon facts and rumors
  if (context.canonFacts.length > 0) {
    worldState += '\n\n[ESTABLISHED FACTS]';
    for (const fact of context.canonFacts.slice(0, 5)) {
      worldState += `\n• ${fact.summary}`;
    }
  }
  
  if (context.rumorsAndClaims.length > 0) {
    worldState += '\n\n[RUMORS & BELIEFS]';
    for (const rumor of context.rumorsAndClaims.slice(0, 3)) {
      const reliability = rumor.provenance === 'observed' ? '(witnessed)' : 
                         rumor.provenance === 'reported' ? '(told)' : '(rumor)';
      worldState += `\n• ${rumor.summary} ${reliability}`;
    }
  }
  
  // Combine full context
  const fullContext = [identitySection, recentEvents, activeLoops, worldState]
    .filter(s => s.length > 0)
    .join('');
  
  return {
    identitySection,
    recentEvents,
    activeLoops,
    worldState,
    fullContext,
  };
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializeCampaignMemory(store: CampaignMemoryStore): string {
  return JSON.stringify(store);
}

export function deserializeCampaignMemory(json: string): CampaignMemoryStore | null {
  try {
    return JSON.parse(json) as CampaignMemoryStore;
  } catch (e) {
    console.error('Failed to deserialize campaign memory:', e);
    return null;
  }
}
