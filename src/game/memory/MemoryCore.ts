// ========================================================================
// MEMORY CORE - STM & MTM Classes
// Short-Term Memory (immediate context) and Medium-Term Memory (session level)
// ========================================================================

export const MEMORY_PRIORITY = {
  CRITICAL: 100,    // Deaths, major world events, player identity
  ESSENTIAL: 80,    // Character locations, active quests, relationships
  IMPORTANT: 60,    // Recent events, ongoing conversations, NPC states
  RELEVANT: 40,     // Background details, minor NPCs, flavor
  FLAVOR: 20,       // Atmospheric details, minor dialogue
  EPHEMERAL: 10     // Momentary states, transitional info
} as const;

export const MEMORY_CATEGORY = {
  // Character-related
  CHARACTER_IDENTITY: 'char_identity',
  CHARACTER_LOCATION: 'char_location',
  CHARACTER_STATUS: 'char_status',
  CHARACTER_ACTIVITY: 'char_activity',
  CHARACTER_EMOTION: 'char_emotion',
  CHARACTER_INVENTORY: 'char_inventory',
  CHARACTER_KNOWLEDGE: 'char_knowledge',
  CHARACTER_SECRETS: 'char_secrets',
  CHARACTER_SCHEDULE: 'char_schedule',
  CHARACTER_POSSESSION: 'char_possession',

  // Relationship-related
  RELATIONSHIP_STATUS: 'rel_status',
  RELATIONSHIP_HISTORY: 'rel_history',
  RELATIONSHIP_DEBT: 'rel_debt',
  RELATIONSHIP_CONFLICT: 'rel_conflict',

  // World-related
  WORLD_STATE: 'world_state',
  WORLD_EVENT: 'world_event',
  WORLD_RULE: 'world_rule',
  WORLD_LORE: 'world_lore',

  // Location-related
  LOCATION_STATE: 'loc_state',
  LOCATION_CONTENTS: 'loc_contents',
  LOCATION_HISTORY: 'loc_history',
  LOCATION_ACCESS: 'loc_access',

  // Plot-related
  PLOT_POINT: 'plot_point',
  PLOT_HOOK: 'plot_hook',
  PLOT_REVELATION: 'plot_revelation',
  PLOT_CONSEQUENCE: 'plot_consequence',

  // Player-related
  PLAYER_CHOICE: 'player_choice',
  PLAYER_STATEMENT: 'player_statement',
  PLAYER_PROMISE: 'player_promise',
  PLAYER_REPUTATION: 'player_reputation',

  // Quest-related
  QUEST_ACTIVE: 'quest_active',
  QUEST_COMPLETE: 'quest_complete',
  QUEST_FAILED: 'quest_failed',
  QUEST_DISCOVERED: 'quest_discovered',

  // Dialogue-related
  DIALOGUE_IMPORTANT: 'dialogue_important',
  DIALOGUE_PROMISE: 'dialogue_promise',
  DIALOGUE_LIE: 'dialogue_lie',
  DIALOGUE_SECRET: 'dialogue_secret'
} as const;

export interface DialogueEntry {
  speaker: string;
  text: string;
  timestamp: number;
  turnNumber: number;
  important?: boolean;
}

export interface ActionEntry {
  type: string;
  character?: string;
  method?: string;
  location?: string;
  destination?: string;
  fromLocation?: string;
  description?: string;
  timestamp: number;
  turnNumber: number;
}

export interface TurnData {
  number: number;
  timestamp: number;
  globalTurn?: number;
  significant?: boolean;
  summary?: string;
  description?: string;
  characters?: string[];
  facts: unknown[];
  dialogues: DialogueEntry[];
  actions: ActionEntry[];
}

// ========================================================================
// SHORT-TERM MEMORY (STM) CLASS
// Handles immediate context - last 5-10 turns
// ========================================================================

export class ShortTermMemory {
  maxTurns: number;
  maxEntries: number;

  currentScene: {
    location: string | null;
    timeOfDay: string | null;
    weather: string | null;
    mood: string | null;
    presentCharacters: Set<string>;
    activeConversation: string | null;
    ongoingAction: string | null;
  };

  recentTurns: TurnData[] = [];
  immediateFacts: Map<string, {
    value: unknown;
    setAt: number;
    turnNumber: number;
    priority?: number;
  }> = new Map();
  dialogueBuffer: DialogueEntry[] = [];
  actionChain: ActionEntry[] = [];
  sensoryContext: {
    visible: string[];
    audible: string[];
    notable: string[];
  };

  constructor(config: { maxTurns?: number; maxEntries?: number } = {}) {
    this.maxTurns = config.maxTurns || 10;
    this.maxEntries = config.maxEntries || 100;

    this.currentScene = {
      location: null,
      timeOfDay: null,
      weather: null,
      mood: null,
      presentCharacters: new Set(),
      activeConversation: null,
      ongoingAction: null
    };

    this.sensoryContext = {
      visible: [],
      audible: [],
      notable: []
    };
  }

  recordTurn(turnData: Partial<TurnData>): { recorded: TurnData; expired: TurnData | null } {
    const turn: TurnData = {
      number: this.recentTurns.length + 1,
      timestamp: Date.now(),
      ...turnData,
      facts: turnData.facts || [],
      dialogues: turnData.dialogues || [],
      actions: turnData.actions || []
    };

    this.recentTurns.push(turn);

    // Maintain max turns
    let expired: TurnData | null = null;
    while (this.recentTurns.length > this.maxTurns) {
      expired = this.recentTurns.shift() || null;
    }

    return { recorded: turn, expired };
  }

  updateScene(updates: Partial<typeof this.currentScene>): void {
    Object.assign(this.currentScene, updates);

    if (updates.location) {
      this.setImmediateFact('current_location', updates.location);
    }
    if (updates.presentCharacters) {
      this.setImmediateFact('present_characters', [...updates.presentCharacters]);
    }
  }

  addCharacterToScene(characterId: string, arrivalMethod: string = 'appears'): void {
    this.currentScene.presentCharacters.add(characterId);
    this.recordAction({
      type: 'character_arrival',
      character: characterId,
      method: arrivalMethod,
      location: this.currentScene.location || undefined
    });
  }

  removeCharacterFromScene(characterId: string, departureMethod: string = 'leaves', destination: string | null = null): void {
    this.currentScene.presentCharacters.delete(characterId);
    this.recordAction({
      type: 'character_departure',
      character: characterId,
      method: departureMethod,
      destination: destination || undefined,
      fromLocation: this.currentScene.location || undefined
    });
  }

  setImmediateFact(key: string, value: unknown, metadata: { priority?: number } = {}): void {
    this.immediateFacts.set(key, {
      value,
      setAt: Date.now(),
      turnNumber: this.recentTurns.length,
      ...metadata
    });

    // Maintain max entries
    if (this.immediateFacts.size > this.maxEntries) {
      for (const [k, v] of this.immediateFacts) {
        if (v.priority !== MEMORY_PRIORITY.CRITICAL) {
          this.immediateFacts.delete(k);
          break;
        }
      }
    }
  }

  getImmediateFact(key: string): unknown {
    const fact = this.immediateFacts.get(key);
    return fact ? fact.value : null;
  }

  recordDialogue(dialogue: Partial<DialogueEntry>): DialogueEntry {
    const entry: DialogueEntry = {
      speaker: dialogue.speaker || 'unknown',
      text: dialogue.text || '',
      timestamp: Date.now(),
      turnNumber: this.recentTurns.length,
      ...dialogue
    };

    this.dialogueBuffer.push(entry);

    while (this.dialogueBuffer.length > 20) {
      this.dialogueBuffer.shift();
    }

    return entry;
  }

  recordAction(action: Partial<ActionEntry>): ActionEntry {
    const entry: ActionEntry = {
      type: action.type || 'unknown',
      timestamp: Date.now(),
      turnNumber: this.recentTurns.length,
      ...action
    };

    this.actionChain.push(entry);

    while (this.actionChain.length > 15) {
      this.actionChain.shift();
    }

    return entry;
  }

  updateSensory(type: keyof typeof this.sensoryContext, items: string[]): void {
    if (this.sensoryContext[type]) {
      this.sensoryContext[type] = items;
    }
  }

  getPresentCharacters(): string[] {
    return [...this.currentScene.presentCharacters];
  }

  isCharacterPresent(characterId: string): boolean {
    return this.currentScene.presentCharacters.has(characterId);
  }

  generateContext(): string {
    const lines: string[] = [];

    lines.push('=== IMMEDIATE CONTEXT (Short-Term Memory) ===');
    lines.push('');

    // Current scene
    lines.push('>> CURRENT SCENE:');
    lines.push(`Location: ${this.currentScene.location || 'Unknown'}`);
    if (this.currentScene.timeOfDay) lines.push(`Time: ${this.currentScene.timeOfDay}`);
    if (this.currentScene.weather) lines.push(`Weather: ${this.currentScene.weather}`);
    if (this.currentScene.mood) lines.push(`Atmosphere: ${this.currentScene.mood}`);
    lines.push('');

    // Present characters
    const present = this.getPresentCharacters();
    lines.push('>> CHARACTERS PRESENT (can speak/act):');
    if (present.length > 0) {
      present.forEach(c => lines.push(`  • ${c}`));
    } else {
      lines.push('  (No one else present)');
    }
    lines.push('');

    // Recent dialogue
    if (this.dialogueBuffer.length > 0) {
      lines.push('>> RECENT DIALOGUE:');
      this.dialogueBuffer.slice(-5).forEach(d => {
        lines.push(`  ${d.speaker}: "${d.text}"`);
      });
      lines.push('');
    }

    // Recent actions
    if (this.actionChain.length > 0) {
      lines.push('>> RECENT ACTIONS:');
      this.actionChain.slice(-5).forEach(a => {
        if (a.type === 'character_arrival') {
          lines.push(`  • ${a.character} ${a.method} at ${a.location}`);
        } else if (a.type === 'character_departure') {
          lines.push(`  • ${a.character} ${a.method} to ${a.destination || 'elsewhere'}`);
        } else {
          lines.push(`  • ${a.description || a.type}`);
        }
      });
      lines.push('');
    }

    // Notable items
    if (this.sensoryContext.notable.length > 0) {
      lines.push('>> NOTABLE IN SCENE:');
      this.sensoryContext.notable.forEach(item => {
        lines.push(`  • ${item}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  export(): {
    currentScene: typeof this.currentScene & { presentCharacters: string[] };
    recentTurns: TurnData[];
    immediateFacts: [string, { value: unknown; setAt: number; turnNumber: number; priority?: number }][];
    dialogueBuffer: DialogueEntry[];
    actionChain: ActionEntry[];
    sensoryContext: typeof this.sensoryContext;
  } {
    return {
      currentScene: {
        ...this.currentScene,
        presentCharacters: [...this.currentScene.presentCharacters]
      },
      recentTurns: this.recentTurns,
      immediateFacts: [...this.immediateFacts.entries()],
      dialogueBuffer: this.dialogueBuffer,
      actionChain: this.actionChain,
      sensoryContext: this.sensoryContext
    };
  }

  import(data: ReturnType<typeof this.export>): void {
    this.currentScene = {
      ...data.currentScene,
      presentCharacters: new Set(data.currentScene.presentCharacters)
    };
    this.recentTurns = data.recentTurns || [];
    this.immediateFacts = new Map(data.immediateFacts || []);
    this.dialogueBuffer = data.dialogueBuffer || [];
    this.actionChain = data.actionChain || [];
    this.sensoryContext = data.sensoryContext || { visible: [], audible: [], notable: [] };
  }

  clear(): void {
    this.currentScene = {
      location: null,
      timeOfDay: null,
      weather: null,
      mood: null,
      presentCharacters: new Set(),
      activeConversation: null,
      ongoingAction: null
    };
    this.recentTurns = [];
    this.immediateFacts.clear();
    this.dialogueBuffer = [];
    this.actionChain = [];
    this.sensoryContext = { visible: [], audible: [], notable: [] };
  }
}

// ========================================================================
// MEDIUM-TERM MEMORY (MTM) CLASS
// Handles session/chapter level - active plotlines, ongoing situations
// ========================================================================

export interface CharacterState {
  id: string;
  status: string;
  location: string | null;
  activity: string | null;
  mood: string;
  lastSeen: number;
  lastSpoken: number;
  lastUpdated: number;
  statusHistory: Array<{
    from: string;
    to: string;
    turn: number;
    timestamp: number;
  }>;
  locationHistory: Array<{
    from: string | null;
    to: string | null;
    turn: number;
    reason: string | null;
  }>;
  currentGoal: string | null;
  temporaryTraits: string[];
  activeEffects: string[];
}

export interface LocationState {
  id: string;
  condition: string;
  accessibility: string;
  contents: string[];
  presentNPCs: string[];
  recentEvents: Array<{
    description: string;
    turn: number;
    timestamp: number;
  }>;
  permanentChanges: string[];
  lastUpdated: number;
  discovered?: boolean;
}

export interface Plotline {
  id: string;
  name: string;
  status: string;
  startTurn: number;
  beats: unknown[];
  characters: string[];
  locations: string[];
  hooks: unknown[];
  revelations: unknown[];
  lastUpdated: number;
}

export interface Quest {
  id: string;
  name: string;
  status: string;
  giver: string | null;
  startTurn: number;
  objectives: Array<{
    id: string;
    description: string;
    completed: boolean;
    completedAt?: number;
  }>;
  completedObjectives: string[];
  rewards: unknown[];
  completedAt?: number;
  lastUpdated: number;
}

export interface Relationship {
  characters: [string, string];
  type: string;
  level: number;
  history: Array<{
    type: string;
    from?: string | number;
    to?: string | number;
    turn: number;
    reason: string | null;
  }>;
  debts: unknown[];
  conflicts: unknown[];
  secrets: unknown[];
  lastUpdated: number;
  changeReason?: string;
}

export interface Consequence {
  id: string;
  description: string;
  triggerTurn: number;
  triggerCondition?: string;
  createEvent?: unknown;
  triggered?: boolean;
}

export class MediumTermMemory {
  maxEntries: number;
  compressionThreshold: number;

  characterStates: Map<string, CharacterState> = new Map();
  locationStates: Map<string, LocationState> = new Map();
  activePlotlines: Map<string, Plotline> = new Map();
  ongoingSituations: Map<string, unknown> = new Map();
  sessionEvents: Array<{
    description: string;
    significant: boolean;
    characters: string[];
    turn: number;
    timestamp: number;
  }> = [];
  relationshipMatrix: Map<string, Relationship> = new Map();
  activeQuests: Map<string, Quest> = new Map();
  pendingConsequences: Consequence[] = [];
  knowledgeGraphs: Map<string, {
    characterId: string;
    knows: Map<string, { value: unknown; learnedAt: number; source: string }>;
    suspects: Map<string, { value: unknown; suspectedAt: number }>;
    secrets: Array<{ secret: string; learnedAt: number }>;
    lastUpdated: number;
  }> = new Map();
  npcSchedules: Map<string, {
    npcId: string;
    routine: unknown[];
    exceptions: unknown[];
    lastUpdated: number;
  }> = new Map();
  sceneSummaries: unknown[] = [];
  sessionTurn: number = 0;
  currentChapter: {
    number: number;
    name: string;
    startTurn: number;
    summary: string;
    keyEvents: string[];
  } = {
    number: 1,
    name: 'Beginning',
    startTurn: 0,
    summary: '',
    keyEvents: []
  };

  constructor(config: { maxEntries?: number; compressionThreshold?: number } = {}) {
    this.maxEntries = config.maxEntries || 500;
    this.compressionThreshold = config.compressionThreshold || 400;
  }

  advanceTurn(): { triggered: Consequence[] } {
    this.sessionTurn++;
    
    // Check pending consequences
    const triggered = this.pendingConsequences.filter(c => 
      c.triggerTurn <= this.sessionTurn && !c.triggered
    );
    
    triggered.forEach(c => c.triggered = true);
    
    return { triggered };
  }

  // ========================================================================
  // CHARACTER STATE MANAGEMENT
  // ========================================================================

  updateCharacterState(characterId: string, updates: Partial<CharacterState>): CharacterState {
    const current = this.characterStates.get(characterId) || this.createDefaultCharacterState(characterId);

    const updated: CharacterState = {
      ...current,
      ...updates,
      lastUpdated: this.sessionTurn
    };

    if (updates.status && updates.status !== current.status) {
      updated.statusHistory = [...(current.statusHistory || []), {
        from: current.status,
        to: updates.status,
        turn: this.sessionTurn,
        timestamp: Date.now()
      }];
    }

    if (updates.location && updates.location !== current.location) {
      updated.locationHistory = [...(current.locationHistory || []).slice(-10), {
        from: current.location,
        to: updates.location,
        turn: this.sessionTurn,
        reason: null
      }];
    }

    this.characterStates.set(characterId, updated);
    return updated;
  }

  createDefaultCharacterState(characterId: string): CharacterState {
    return {
      id: characterId,
      status: 'alive',
      location: null,
      activity: null,
      mood: 'neutral',
      lastSeen: 0,
      lastSpoken: 0,
      lastUpdated: this.sessionTurn,
      statusHistory: [],
      locationHistory: [],
      currentGoal: null,
      temporaryTraits: [],
      activeEffects: []
    };
  }

  getCharacterState(characterId: string): CharacterState | undefined {
    return this.characterStates.get(characterId);
  }

  getCharactersAtLocation(location: string): Array<{ id: string } & CharacterState> {
    const result: Array<{ id: string } & CharacterState> = [];
    for (const [id, state] of this.characterStates) {
      if (state.location === location && state.status === 'alive') {
        result.push({ id, ...state });
      }
    }
    return result;
  }

  getCharactersElsewhere(location: string): Array<{ id: string } & CharacterState> {
    const result: Array<{ id: string } & CharacterState> = [];
    for (const [id, state] of this.characterStates) {
      if (state.location !== location && state.status === 'alive') {
        result.push({ id, ...state });
      }
    }
    return result;
  }

  // ========================================================================
  // LOCATION STATE MANAGEMENT
  // ========================================================================

  updateLocationState(locationId: string, updates: Partial<LocationState>): LocationState {
    const current = this.locationStates.get(locationId) || this.createDefaultLocationState(locationId);

    const updated: LocationState = {
      ...current,
      ...updates,
      lastUpdated: this.sessionTurn
    };

    this.locationStates.set(locationId, updated);
    return updated;
  }

  createDefaultLocationState(locationId: string): LocationState {
    return {
      id: locationId,
      condition: 'normal',
      accessibility: 'open',
      contents: [],
      presentNPCs: [],
      recentEvents: [],
      permanentChanges: [],
      lastUpdated: this.sessionTurn
    };
  }

  recordLocationEvent(locationId: string, event: { description: string }): void {
    const locState = this.locationStates.get(locationId) || this.createDefaultLocationState(locationId);
    locState.recentEvents = [...locState.recentEvents.slice(-10), {
      ...event,
      turn: this.sessionTurn,
      timestamp: Date.now()
    }];
    this.locationStates.set(locationId, locState);
  }

  // ========================================================================
  // PLOTLINE MANAGEMENT
  // ========================================================================

  updatePlotline(plotlineId: string, updates: Partial<Plotline>): Plotline {
    const current = this.activePlotlines.get(plotlineId) || {
      id: plotlineId,
      name: plotlineId,
      status: 'active',
      startTurn: this.sessionTurn,
      beats: [],
      characters: [],
      locations: [],
      hooks: [],
      revelations: [],
      lastUpdated: this.sessionTurn
    };

    const updated: Plotline = {
      ...current,
      ...updates,
      lastUpdated: this.sessionTurn
    };

    this.activePlotlines.set(plotlineId, updated);
    return updated;
  }

  // ========================================================================
  // QUEST MANAGEMENT
  // ========================================================================

  updateQuest(questId: string, updates: Partial<Quest>): Quest {
    const current = this.activeQuests.get(questId) || {
      id: questId,
      name: questId,
      status: 'active',
      giver: null,
      startTurn: this.sessionTurn,
      objectives: [],
      completedObjectives: [],
      rewards: [],
      lastUpdated: this.sessionTurn
    };

    const updated: Quest = {
      ...current,
      ...updates,
      lastUpdated: this.sessionTurn
    };

    this.activeQuests.set(questId, updated);
    return updated;
  }

  completeObjective(questId: string, objectiveId: string): void {
    const quest = this.activeQuests.get(questId);
    if (quest) {
      const objective = quest.objectives.find(o => o.id === objectiveId);
      if (objective) {
        objective.completed = true;
        objective.completedAt = this.sessionTurn;
        quest.completedObjectives.push(objectiveId);

        const allComplete = quest.objectives.every(o => o.completed);
        if (allComplete) {
          quest.status = 'completed';
          quest.completedAt = this.sessionTurn;
        }
      }
    }
  }

  // ========================================================================
  // RELATIONSHIP MANAGEMENT
  // ========================================================================

  updateRelationship(char1: string, char2: string, updates: Partial<Relationship>): Relationship {
    const key = [char1, char2].sort().join('::');
    const current = this.relationshipMatrix.get(key) || {
      characters: [char1, char2] as [string, string],
      type: 'stranger',
      level: 0,
      history: [],
      debts: [],
      conflicts: [],
      secrets: [],
      lastUpdated: this.sessionTurn
    };

    const updated: Relationship = {
      ...current,
      ...updates,
      lastUpdated: this.sessionTurn
    };

    if (updates.type && updates.type !== current.type) {
      updated.history.push({
        type: 'type_change',
        from: current.type,
        to: updates.type,
        turn: this.sessionTurn,
        reason: updates.changeReason || null
      });
    }

    if (updates.level !== undefined && updates.level !== current.level) {
      updated.history.push({
        type: 'level_change',
        from: current.level,
        to: updates.level,
        turn: this.sessionTurn,
        reason: null
      });
    }

    this.relationshipMatrix.set(key, updated);
    return updated;
  }

  getRelationship(char1: string, char2: string): Relationship | undefined {
    const key = [char1, char2].sort().join('::');
    return this.relationshipMatrix.get(key);
  }

  getCharacterRelationships(characterId: string): Array<{ other: string } & Relationship> {
    const result: Array<{ other: string } & Relationship> = [];
    for (const [, rel] of this.relationshipMatrix) {
      if (rel.characters.includes(characterId)) {
        const other = rel.characters.find(c => c !== characterId)!;
        result.push({ other, ...rel });
      }
    }
    return result;
  }

  // ========================================================================
  // KNOWLEDGE GRAPH MANAGEMENT
  // ========================================================================

  updateCharacterKnowledge(characterId: string, knowledge: {
    knows?: Record<string, unknown>;
    suspects?: Record<string, unknown>;
    secret?: string;
    source?: string;
  }): void {
    const current = this.knowledgeGraphs.get(characterId) || {
      characterId,
      knows: new Map(),
      suspects: new Map(),
      secrets: [],
      lastUpdated: this.sessionTurn
    };

    if (knowledge.knows) {
      for (const [key, value] of Object.entries(knowledge.knows)) {
        current.knows.set(key, {
          value,
          learnedAt: this.sessionTurn,
          source: knowledge.source || 'unknown'
        });
      }
    }

    if (knowledge.suspects) {
      for (const [key, value] of Object.entries(knowledge.suspects)) {
        current.suspects.set(key, {
          value,
          suspectedAt: this.sessionTurn
        });
      }
    }

    if (knowledge.secret) {
      current.secrets.push({
        secret: knowledge.secret,
        learnedAt: this.sessionTurn
      });
    }

    current.lastUpdated = this.sessionTurn;
    this.knowledgeGraphs.set(characterId, current);
  }

  doesCharacterKnow(characterId: string, factKey: string): boolean {
    const knowledge = this.knowledgeGraphs.get(characterId);
    return knowledge ? knowledge.knows.has(factKey) : false;
  }

  // ========================================================================
  // SESSION EVENTS
  // ========================================================================

  recordSessionEvent(event: {
    description: string;
    significant: boolean;
    characters: string[];
  }): void {
    this.sessionEvents.push({
      ...event,
      turn: this.sessionTurn,
      timestamp: Date.now()
    });

    // Maintain max entries
    while (this.sessionEvents.length > this.maxEntries) {
      this.sessionEvents.shift();
    }
  }

  // ========================================================================
  // CONTEXT GENERATION
  // ========================================================================

  generateContext(options: {
    currentLocation?: string | null;
    maxLength?: number;
  } = {}): string {
    const lines: string[] = [];
    const { currentLocation } = options;

    lines.push('=== SESSION CONTEXT (Medium-Term Memory) ===');
    lines.push('');

    // Current chapter
    lines.push(`>> CHAPTER ${this.currentChapter.number}: ${this.currentChapter.name}`);
    lines.push(`   Turn: ${this.sessionTurn}`);
    lines.push('');

    // Active quests
    const activeQuests = [...this.activeQuests.values()].filter(q => q.status === 'active');
    if (activeQuests.length > 0) {
      lines.push('>> ACTIVE QUESTS:');
      activeQuests.forEach(q => {
        const completed = q.objectives.filter(o => o.completed).length;
        lines.push(`  • ${q.name} (${completed}/${q.objectives.length})`);
      });
      lines.push('');
    }

    // Characters elsewhere (if location provided)
    if (currentLocation) {
      const elsewhere = this.getCharactersElsewhere(currentLocation);
      if (elsewhere.length > 0) {
        lines.push('>> CHARACTERS ELSEWHERE:');
        elsewhere.slice(0, 10).forEach(c => {
          lines.push(`  • ${c.id} at ${c.location}${c.activity ? ` (${c.activity})` : ''}`);
        });
        lines.push('');
      }
    }

    // Recent significant events
    const significantEvents = this.sessionEvents.filter(e => e.significant).slice(-5);
    if (significantEvents.length > 0) {
      lines.push('>> RECENT SIGNIFICANT EVENTS:');
      significantEvents.forEach(e => {
        lines.push(`  • ${e.description}`);
      });
      lines.push('');
    }

    // Active plotlines
    const activePlots = [...this.activePlotlines.values()].filter(p => p.status === 'active');
    if (activePlots.length > 0) {
      lines.push('>> ACTIVE STORYLINES:');
      activePlots.forEach(p => {
        lines.push(`  • ${p.name}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  export(): unknown {
    return {
      characterStates: [...this.characterStates.entries()],
      locationStates: [...this.locationStates.entries()],
      activePlotlines: [...this.activePlotlines.entries()],
      ongoingSituations: [...this.ongoingSituations.entries()],
      sessionEvents: this.sessionEvents,
      relationshipMatrix: [...this.relationshipMatrix.entries()],
      activeQuests: [...this.activeQuests.entries()],
      pendingConsequences: this.pendingConsequences,
      knowledgeGraphs: [...this.knowledgeGraphs.entries()].map(([k, v]) => [k, {
        ...v,
        knows: [...v.knows.entries()],
        suspects: [...v.suspects.entries()]
      }]),
      npcSchedules: [...this.npcSchedules.entries()],
      sceneSummaries: this.sceneSummaries,
      sessionTurn: this.sessionTurn,
      currentChapter: this.currentChapter
    };
  }

  import(data: ReturnType<typeof this.export> & Record<string, unknown>): void {
    this.characterStates = new Map(data.characterStates as [string, CharacterState][]);
    this.locationStates = new Map(data.locationStates as [string, LocationState][]);
    this.activePlotlines = new Map(data.activePlotlines as [string, Plotline][]);
    this.ongoingSituations = new Map(data.ongoingSituations as [string, unknown][]);
    this.sessionEvents = (data.sessionEvents as typeof this.sessionEvents) || [];
    this.relationshipMatrix = new Map(data.relationshipMatrix as [string, Relationship][]);
    this.activeQuests = new Map(data.activeQuests as [string, Quest][]);
    this.pendingConsequences = (data.pendingConsequences as Consequence[]) || [];
    
    // Restore knowledge graphs with Maps
    const kgData = data.knowledgeGraphs as Array<[string, { 
      characterId: string; 
      knows: [string, { value: unknown; learnedAt: number; source: string }][]; 
      suspects: [string, { value: unknown; suspectedAt: number }][]; 
      secrets: Array<{ secret: string; learnedAt: number }>; 
      lastUpdated: number 
    }]>;
    this.knowledgeGraphs = new Map(kgData?.map(([k, v]) => [k, {
      characterId: v.characterId,
      knows: new Map(v.knows) as Map<string, { value: unknown; learnedAt: number; source: string }>,
      suspects: new Map(v.suspects) as Map<string, { value: unknown; suspectedAt: number }>,
      secrets: v.secrets,
      lastUpdated: v.lastUpdated
    }]) || []);
    
    this.npcSchedules = new Map(data.npcSchedules as [string, typeof this.npcSchedules extends Map<string, infer V> ? V : never][]);
    this.sceneSummaries = (data.sceneSummaries as unknown[]) || [];
    this.sessionTurn = (data.sessionTurn as number) || 0;
    this.currentChapter = (data.currentChapter as typeof this.currentChapter) || {
      number: 1,
      name: 'Beginning',
      startTurn: 0,
      summary: '',
      keyEvents: []
    };
  }

  clear(): void {
    this.characterStates.clear();
    this.locationStates.clear();
    this.activePlotlines.clear();
    this.ongoingSituations.clear();
    this.sessionEvents = [];
    this.relationshipMatrix.clear();
    this.activeQuests.clear();
    this.pendingConsequences = [];
    this.knowledgeGraphs.clear();
    this.npcSchedules.clear();
    this.sceneSummaries = [];
    this.sessionTurn = 0;
    this.currentChapter = {
      number: 1,
      name: 'Beginning',
      startTurn: 0,
      summary: '',
      keyEvents: []
    };
  }
}
