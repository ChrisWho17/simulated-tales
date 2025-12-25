// ========================================================================
// LONG-TERM MEMORY (LTM) - Permanent Facts & World Canon
// ========================================================================

import { MEMORY_PRIORITY } from './MemoryCore';

export interface CoreIdentity {
  id: string;
  name?: string;
  role?: string;
  species?: string;
  gender?: string;
  origin?: string;
  createdAt: number;
  locked?: boolean;
}

export interface CharacterBio {
  characterId: string;
  background: string | null;
  personality: string[];
  skills: string[];
  flaws: string[];
  beliefs: string[];
  fears: string[];
  desires: string[];
  secrets: Array<{
    description: string;
    knownByPlayer?: boolean;
    learnedAt?: number;
  }>;
  history: Array<{
    event: string;
    recordedAt: number;
  }>;
  relationships: string[];
  createdAt: number;
  lastUpdated: number;
}

export interface WorldCanonEntry {
  id: string;
  value?: string;
  description?: string;
  category: string;
  priority: number;
  createdAt: number;
  source: string;
}

export interface DeathRecord {
  characterId: string;
  cause?: string;
  location?: string;
  turn?: number;
  deathTime: number;
  witnesses?: string[];
  confirmed: boolean;
}

export interface Revelation {
  id: string;
  description: string;
  type?: string;
  knownBy: string[];
  revealedAt: number;
}

export interface PlayerCanon {
  choices: Array<{
    description: string;
    timestamp: number;
  }>;
  reputation: Map<string, {
    faction: string;
    value: number;
    history: Array<{
      change: number;
      reason: string;
      timestamp: number;
    }>;
  }>;
  titles: string[];
  achievements: string[];
  crimes: Array<{
    type: string;
    description?: string;
    timestamp: number;
  }>;
  allegiances: Array<{
    faction: string;
    status: string;
    updatedAt?: number;
  }>;
}

export interface LocationChange {
  locationId: string;
  changes: Array<{
    type: string;
    description: string;
    timestamp: number;
  }>;
}

export interface CompletedStoryline {
  id: string;
  name?: string;
  resolution?: string;
  completedAt: number;
}

export class LongTermMemory {
  maxFacts: number;
  
  coreIdentities: Map<string, CoreIdentity> = new Map();
  worldCanon: Map<string, WorldCanonEntry> = new Map();
  characterBios: Map<string, CharacterBio> = new Map();
  relationshipCanon: Map<string, {
    characters: [string, string];
    established: Array<{
      fact: string;
      establishedAt: number;
    }>;
    events: unknown[];
    lastUpdated: number;
  }> = new Map();
  majorEvents: Array<{
    id: string;
    type?: string;
    description: string;
    character?: string;
    characters?: string[];
    location?: string;
    witnesses?: string[];
    significant?: boolean;
    timestamp: number;
    permanent: true;
    turn?: number;
  }> = [];
  establishedRules: Map<string, unknown> = new Map();
  revelations: Revelation[] = [];
  playerCanon: PlayerCanon = {
    choices: [],
    reputation: new Map(),
    titles: [],
    achievements: [],
    crimes: [],
    allegiances: []
  };
  deathRecords: Map<string, DeathRecord> = new Map();
  locationChanges: Map<string, LocationChange> = new Map();
  completedStorylines: CompletedStoryline[] = [];
  worldStateChanges: unknown[] = [];
  validationRules: Map<string, {
    id: string;
    type: string;
    value?: unknown;
    message: string;
    createdAt: number;
  }> = new Map();
  contradictionLog: Array<{
    factId: string;
    existing: unknown;
    proposed: unknown;
    timestamp: number;
  }> = [];

  constructor(config: { maxFacts?: number } = {}) {
    this.maxFacts = config.maxFacts || 2000;
  }

  // ========================================================================
  // CORE IDENTITY MANAGEMENT
  // ========================================================================

  setCoreIdentity(characterId: string, identity: Partial<CoreIdentity>): CoreIdentity {
    const existing = this.coreIdentities.get(characterId);

    const fullIdentity: CoreIdentity = {
      id: characterId,
      ...existing,
      ...identity,
      createdAt: existing?.createdAt || Date.now()
    };

    this.coreIdentities.set(characterId, fullIdentity);
    return fullIdentity;
  }

  getCoreIdentity(characterId: string): CoreIdentity | undefined {
    return this.coreIdentities.get(characterId);
  }

  // ========================================================================
  // CHARACTER BIOGRAPHY MANAGEMENT
  // ========================================================================

  updateCharacterBio(characterId: string, bioData: Partial<CharacterBio>): CharacterBio {
    const existing = this.characterBios.get(characterId) || {
      characterId,
      background: null,
      personality: [],
      skills: [],
      flaws: [],
      beliefs: [],
      fears: [],
      desires: [],
      secrets: [],
      history: [],
      relationships: [],
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    const updated: CharacterBio = {
      ...existing,
      ...bioData,
      lastUpdated: Date.now()
    };

    // Append to arrays rather than replace
    if (bioData.history && Array.isArray(bioData.history)) {
      updated.history = [...existing.history, ...bioData.history];
    }
    if (bioData.secrets && Array.isArray(bioData.secrets)) {
      updated.secrets = [...existing.secrets, ...bioData.secrets];
    }

    this.characterBios.set(characterId, updated);
    return updated;
  }

  addToCharacterHistory(characterId: string, event: string): void {
    const bio = this.characterBios.get(characterId);
    if (bio) {
      bio.history.push({
        event,
        recordedAt: Date.now()
      });
    }
  }

  // ========================================================================
  // WORLD CANON MANAGEMENT
  // ========================================================================

  setWorldCanon(factId: string, fact: Partial<WorldCanonEntry>): WorldCanonEntry {
    const entry: WorldCanonEntry = {
      id: factId,
      ...fact,
      category: fact.category || 'general',
      priority: fact.priority || MEMORY_PRIORITY.ESSENTIAL,
      createdAt: Date.now(),
      source: fact.source || 'world_creation'
    };

    // Check for contradictions
    const contradiction = this.checkContradiction(factId, fact);
    if (contradiction) {
      this.logContradiction(factId, fact, contradiction);
    }

    this.worldCanon.set(factId, entry);
    return entry;
  }

  getWorldCanon(factId: string): WorldCanonEntry | undefined {
    return this.worldCanon.get(factId);
  }

  getWorldCanonByCategory(category: string): WorldCanonEntry[] {
    const results: WorldCanonEntry[] = [];
    for (const [, fact] of this.worldCanon) {
      if (fact.category === category) {
        results.push(fact);
      }
    }
    return results;
  }

  // ========================================================================
  // DEATH RECORDS
  // ========================================================================

  recordDeath(characterId: string, deathData: Partial<DeathRecord>): DeathRecord {
    const record: DeathRecord = {
      characterId,
      ...deathData,
      deathTime: Date.now(),
      confirmed: true
    };

    this.deathRecords.set(characterId, record);

    // Set validation rule
    this.setValidationRule(`${characterId}.alive`, {
      type: 'death',
      value: false,
      message: `${characterId} is DEAD (${deathData.cause || 'unknown cause'}) and cannot appear, speak, or act`
    });

    // Add to major events
    this.addMajorEvent({
      type: 'death',
      character: characterId,
      description: `${characterId} died${deathData.cause ? ` from ${deathData.cause}` : ''}`,
      location: deathData.location,
      witnesses: deathData.witnesses || [],
      significant: true
    });

    return record;
  }

  isCharacterDead(characterId: string): boolean {
    return this.deathRecords.has(characterId);
  }

  getDeathRecord(characterId: string): DeathRecord | undefined {
    return this.deathRecords.get(characterId);
  }

  getAllDeadCharacters(): string[] {
    return [...this.deathRecords.keys()];
  }

  // ========================================================================
  // RELATIONSHIP CANON
  // ========================================================================

  setRelationshipCanon(char1: string, char2: string, relationshipData: {
    fact?: string;
    [key: string]: unknown;
  }): void {
    const key = [char1, char2].sort().join('::');

    const existing = this.relationshipCanon.get(key) || {
      characters: [char1, char2] as [string, string],
      established: [],
      events: [],
      lastUpdated: Date.now()
    };

    const updated = {
      ...existing,
      ...relationshipData,
      lastUpdated: Date.now()
    };

    if (relationshipData.fact) {
      updated.established.push({
        fact: relationshipData.fact,
        establishedAt: Date.now()
      });
    }

    this.relationshipCanon.set(key, updated);
  }

  getRelationshipCanon(char1: string, char2: string): typeof this.relationshipCanon extends Map<string, infer V> ? V : never | undefined {
    const key = [char1, char2].sort().join('::');
    return this.relationshipCanon.get(key);
  }

  // ========================================================================
  // MAJOR EVENTS
  // ========================================================================

  addMajorEvent(event: Partial<typeof this.majorEvents[0]>): typeof this.majorEvents[0] {
    const entry = {
      id: `major_${this.majorEvents.length + 1}`,
      description: event.description || '',
      ...event,
      timestamp: Date.now(),
      permanent: true as const
    };

    this.majorEvents.push(entry);
    return entry;
  }

  getMajorEvents(filter: {
    type?: string;
    character?: string;
    location?: string;
  } = {}): typeof this.majorEvents {
    let results = [...this.majorEvents];

    if (filter.type) {
      results = results.filter(e => e.type === filter.type);
    }
    if (filter.character) {
      results = results.filter(e =>
        e.character === filter.character ||
        (e.characters && e.characters.includes(filter.character!))
      );
    }
    if (filter.location) {
      results = results.filter(e => e.location === filter.location);
    }

    return results;
  }

  // ========================================================================
  // REVELATIONS AND SECRETS
  // ========================================================================

  recordRevelation(revelation: Partial<Revelation>): Revelation {
    const entry: Revelation = {
      id: `revelation_${this.revelations.length + 1}`,
      description: revelation.description || '',
      ...revelation,
      revealedAt: Date.now(),
      knownBy: revelation.knownBy || ['player']
    };

    this.revelations.push(entry);
    return entry;
  }

  getRevelationsKnownBy(characterId: string): Revelation[] {
    return this.revelations.filter(r => r.knownBy.includes(characterId));
  }

  isRevelationKnown(revelationId: string, characterId: string = 'player'): boolean {
    const revelation = this.revelations.find(r => r.id === revelationId);
    return revelation ? revelation.knownBy.includes(characterId) : false;
  }

  // ========================================================================
  // PLAYER CANON
  // ========================================================================

  recordPlayerChoice(choice: { description: string }): void {
    this.playerCanon.choices.push({
      ...choice,
      timestamp: Date.now()
    });
  }

  updatePlayerReputation(faction: string, change: number, reason: string): {
    faction: string;
    value: number;
    history: Array<{ change: number; reason: string; timestamp: number }>;
  } {
    const current = this.playerCanon.reputation.get(faction) || {
      faction,
      value: 0,
      history: []
    };

    current.value += change;
    current.history.push({
      change,
      reason,
      timestamp: Date.now()
    });

    this.playerCanon.reputation.set(faction, current);
    return current;
  }

  addPlayerTitle(title: string): void {
    if (!this.playerCanon.titles.includes(title)) {
      this.playerCanon.titles.push(title);
    }
  }

  recordPlayerCrime(crime: { type: string; description?: string }): void {
    this.playerCanon.crimes.push({
      ...crime,
      timestamp: Date.now()
    });
  }

  setPlayerAllegiance(faction: string, status: string): void {
    const existing = this.playerCanon.allegiances.find(a => a.faction === faction);
    if (existing) {
      existing.status = status;
      existing.updatedAt = Date.now();
    } else {
      this.playerCanon.allegiances.push({
        faction,
        status,
        updatedAt: Date.now()
      });
    }
  }

  // ========================================================================
  // LOCATION CHANGES
  // ========================================================================

  recordLocationChange(locationId: string, change: { type: string; description: string }): LocationChange {
    const existing = this.locationChanges.get(locationId) || {
      locationId,
      changes: []
    };

    existing.changes.push({
      ...change,
      timestamp: Date.now()
    });

    this.locationChanges.set(locationId, existing);
    return existing;
  }

  getLocationChanges(locationId: string): LocationChange | undefined {
    return this.locationChanges.get(locationId);
  }

  isLocationDestroyed(locationId: string): boolean {
    const changes = this.locationChanges.get(locationId);
    if (!changes) return false;
    return changes.changes.some(c => c.type === 'destroyed');
  }

  // ========================================================================
  // COMPLETED STORYLINES
  // ========================================================================

  recordCompletedStoryline(storyline: Partial<CompletedStoryline>): void {
    this.completedStorylines.push({
      id: storyline.id || `storyline_${this.completedStorylines.length + 1}`,
      ...storyline,
      completedAt: Date.now()
    });
  }

  isStorylineCompleted(storylineId: string): boolean {
    return this.completedStorylines.some(s => s.id === storylineId);
  }

  // ========================================================================
  // VALIDATION AND CONTRADICTION DETECTION
  // ========================================================================

  setValidationRule(ruleId: string, rule: { type: string; value?: unknown; message: string }): void {
    this.validationRules.set(ruleId, {
      id: ruleId,
      ...rule,
      createdAt: Date.now()
    });
  }

  validateFact(factId: string, value: unknown): { valid: boolean; reason?: string; expected?: unknown; got?: unknown } {
    const rule = this.validationRules.get(factId);
    if (!rule) return { valid: true };

    switch (rule.type) {
      case 'immutable':
        if (value !== rule.value) {
          return {
            valid: false,
            reason: rule.message,
            expected: rule.value,
            got: value
          };
        }
        break;
      case 'death':
        if (value === true || value === 'alive') {
          return {
            valid: false,
            reason: rule.message,
            expected: 'dead',
            got: value
          };
        }
        break;
    }

    return { valid: true };
  }

  checkContradiction(factId: string, newFact: Partial<WorldCanonEntry>): WorldCanonEntry | null {
    const existing = this.worldCanon.get(factId);
    if (!existing) return null;

    if (existing.value !== newFact.value) {
      return existing;
    }

    return null;
  }

  logContradiction(factId: string, newFact: unknown, contradiction: unknown): void {
    this.contradictionLog.push({
      factId,
      existing: contradiction,
      proposed: newFact,
      timestamp: Date.now()
    });
  }

  // ========================================================================
  // CONTEXT GENERATION
  // ========================================================================

  generateContext(options: {
    characterIds?: string[];
    locationId?: string | null;
    maxLength?: number;
  } = {}): string {
    const lines: string[] = [];
    const { characterIds = [], locationId = null } = options;

    lines.push('=== PERMANENT FACTS (Long-Term Memory - DO NOT CONTRADICT) ===');
    lines.push('');

    // Dead characters - CRITICAL
    if (this.deathRecords.size > 0) {
      lines.push('>> DECEASED CHARACTERS (Cannot appear or speak):');
      for (const [id, record] of this.deathRecords) {
        lines.push(`   ☠ ${id} - DEAD${record.cause ? ` (${record.cause})` : ''}`);
      }
      lines.push('');
    }

    // Relevant character identities
    if (characterIds.length > 0) {
      lines.push('>> ESTABLISHED CHARACTER FACTS:');
      characterIds.forEach(charId => {
        const identity = this.coreIdentities.get(charId);
        const bio = this.characterBios.get(charId);

        if (identity) {
          const parts = [`${charId}:`];
          if (identity.name) parts.push(`name is ${identity.name}`);
          if (identity.role) parts.push(`role: ${identity.role}`);
          if (identity.species) parts.push(`species: ${identity.species}`);
          lines.push(` • ${parts.join(', ')}`);

          if (bio && bio.secrets.length > 0) {
            bio.secrets.forEach(s => {
              if (s.knownByPlayer) {
                lines.push(`   SECRET: ${s.description}`);
              }
            });
          }
        }
      });
      lines.push('');
    }

    // Player status
    if (this.playerCanon.titles.length > 0 || this.playerCanon.crimes.length > 0) {
      lines.push('>> PLAYER STATUS:');
      if (this.playerCanon.titles.length > 0) {
        lines.push(` Titles: ${this.playerCanon.titles.join(', ')}`);
      }
      if (this.playerCanon.crimes.length > 0) {
        lines.push(` Known crimes: ${this.playerCanon.crimes.map(c => c.type).join(', ')}`);
      }
      if (this.playerCanon.allegiances.length > 0) {
        const allied = this.playerCanon.allegiances.filter(a => a.status === 'allied');
        const enemy = this.playerCanon.allegiances.filter(a => a.status === 'enemy');
        if (allied.length > 0) lines.push(` Allied with: ${allied.map(a => a.faction).join(', ')}`);
        if (enemy.length > 0) lines.push(` Enemy of: ${enemy.map(a => a.faction).join(', ')}`);
      }
      lines.push('');
    }

    // Location changes
    if (locationId) {
      const locChanges = this.locationChanges.get(locationId);
      if (locChanges && locChanges.changes.length > 0) {
        lines.push('>> LOCATION CHANGES:');
        locChanges.changes.forEach(c => {
          lines.push(` • ${c.description}`);
        });
        lines.push('');
      }
    }

    // Major events (recent)
    if (this.majorEvents.length > 0) {
      lines.push('>> MAJOR HISTORICAL EVENTS:');
      this.majorEvents.slice(-10).forEach(e => {
        lines.push(` • ${e.description}`);
      });
      lines.push('');
    }

    // Known secrets/revelations
    const playerRevelations = this.getRevelationsKnownBy('player');
    if (playerRevelations.length > 0) {
      lines.push('>> KNOWN SECRETS:');
      playerRevelations.slice(-5).forEach(r => {
        lines.push(` • ${r.description}`);
      });
      lines.push('');
    }

    // Completed storylines
    if (this.completedStorylines.length > 0) {
      lines.push('>> COMPLETED STORYLINES:');
      this.completedStorylines.forEach(s => {
        lines.push(` ✓ ${s.name || s.id}: ${s.resolution || 'completed'}`);
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
      coreIdentities: [...this.coreIdentities.entries()],
      worldCanon: [...this.worldCanon.entries()],
      characterBios: [...this.characterBios.entries()],
      relationshipCanon: [...this.relationshipCanon.entries()],
      majorEvents: this.majorEvents,
      establishedRules: [...this.establishedRules.entries()],
      revelations: this.revelations,
      playerCanon: {
        ...this.playerCanon,
        reputation: [...this.playerCanon.reputation.entries()]
      },
      deathRecords: [...this.deathRecords.entries()],
      locationChanges: [...this.locationChanges.entries()],
      completedStorylines: this.completedStorylines,
      worldStateChanges: this.worldStateChanges,
      validationRules: [...this.validationRules.entries()],
      contradictionLog: this.contradictionLog
    };
  }

  import(data: ReturnType<typeof this.export> & Record<string, unknown>): void {
    this.coreIdentities = new Map(data.coreIdentities as [string, CoreIdentity][]);
    this.worldCanon = new Map(data.worldCanon as [string, WorldCanonEntry][]);
    this.characterBios = new Map(data.characterBios as [string, CharacterBio][]);
    this.relationshipCanon = new Map(data.relationshipCanon as [string, typeof this.relationshipCanon extends Map<string, infer V> ? V : never][]);
    this.majorEvents = (data.majorEvents as typeof this.majorEvents) || [];
    this.establishedRules = new Map(data.establishedRules as [string, unknown][]);
    this.revelations = (data.revelations as Revelation[]) || [];
    
    const pcData = data.playerCanon as { 
      reputation?: [string, { faction: string; value: number; history: Array<{ change: number; reason: string; timestamp: number }> }][]; 
      choices?: typeof this.playerCanon.choices;
      titles?: string[];
      achievements?: string[];
      crimes?: typeof this.playerCanon.crimes;
      allegiances?: typeof this.playerCanon.allegiances;
    };
    this.playerCanon = {
      choices: pcData?.choices || [],
      reputation: new Map(pcData?.reputation || []),
      titles: pcData?.titles || [],
      achievements: pcData?.achievements || [],
      crimes: pcData?.crimes || [],
      allegiances: pcData?.allegiances || []
    };
    
    this.deathRecords = new Map(data.deathRecords as [string, DeathRecord][]);
    this.locationChanges = new Map(data.locationChanges as [string, LocationChange][]);
    this.completedStorylines = (data.completedStorylines as CompletedStoryline[]) || [];
    this.worldStateChanges = (data.worldStateChanges as unknown[]) || [];
    this.validationRules = new Map(data.validationRules as [string, typeof this.validationRules extends Map<string, infer V> ? V : never][]);
    this.contradictionLog = (data.contradictionLog as typeof this.contradictionLog) || [];
  }

  clear(): void {
    this.coreIdentities.clear();
    this.worldCanon.clear();
    this.characterBios.clear();
    this.relationshipCanon.clear();
    this.majorEvents = [];
    this.establishedRules.clear();
    this.revelations = [];
    this.playerCanon = {
      choices: [],
      reputation: new Map(),
      titles: [],
      achievements: [],
      crimes: [],
      allegiances: []
    };
    this.deathRecords.clear();
    this.locationChanges.clear();
    this.completedStorylines = [];
    this.worldStateChanges = [];
    this.validationRules.clear();
    this.contradictionLog = [];
  }
}
