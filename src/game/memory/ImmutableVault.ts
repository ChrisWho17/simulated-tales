// ========================================================================
// IMMUTABLE FACT VAULT
// Facts stored here are PERMANENT and UNCHANGEABLE
// Always included in AI context, no matter what
// ========================================================================

export const IMMUTABLE_FACT_TYPES = {
  CHARACTER_NAME: {
    id: 'character_name',
    description: 'The canonical name of a character',
    immutable: true,
    alwaysInclude: true,
    critical: true,
    format: (fact: ImmutableFact) => `${fact.characterId}'s name is "${fact.value}" (PERMANENT)`
  },
  CHARACTER_TRUE_NAME: {
    id: 'character_true_name',
    description: 'The true/birth name if different from known name',
    immutable: true,
    alwaysInclude: true,
    critical: true,
    format: (fact: ImmutableFact) => `${fact.characterId}'s true name is "${fact.value}"`
  },
  CHARACTER_SPECIES: {
    id: 'character_species',
    description: 'The species of a character',
    immutable: true,
    alwaysInclude: false,
    format: (fact: ImmutableFact) => `${fact.characterId} is a ${fact.value}`
  },
  CHARACTER_GENDER: {
    id: 'character_gender',
    description: 'The gender of a character',
    immutable: true,
    alwaysInclude: false,
    format: (fact: ImmutableFact) => `${fact.characterId} is ${fact.value}`
  },
  CHARACTER_BIRTHDATE: {
    id: 'character_birthdate',
    description: 'When a character was born',
    immutable: true,
    alwaysInclude: false,
    format: (fact: ImmutableFact) => `${fact.characterId} was born ${fact.value}`
  },
  CHARACTER_BIRTHPLACE: {
    id: 'character_birthplace',
    description: 'Where a character was born',
    immutable: true,
    alwaysInclude: false,
    format: (fact: ImmutableFact) => `${fact.characterId} was born in ${fact.value}`
  },
  CHARACTER_DEATH: {
    id: 'character_death',
    description: 'A character has died - PERMANENT',
    immutable: true,
    alwaysInclude: true,
    critical: true,
    format: (fact: ImmutableFact) => `☠ ${fact.characterId} is DEAD (cause: ${fact.cause || 'unknown'}) - CANNOT appear, speak, or act`
  },
  PLAYER_NAME: {
    id: 'player_name',
    description: 'The player character\'s name',
    immutable: true,
    alwaysInclude: true,
    critical: true,
    format: (fact: ImmutableFact) => `Player character name: "${fact.value}"`
  },
  PLAYER_ORIGIN: {
    id: 'player_origin',
    description: 'The player\'s origin/background',
    immutable: true,
    alwaysInclude: true,
    format: (fact: ImmutableFact) => `Player origin: ${fact.value}`
  },
  WORLD_NAME: {
    id: 'world_name',
    description: 'The name of the world',
    immutable: true,
    alwaysInclude: true,
    format: (fact: ImmutableFact) => `World: ${fact.value}`
  },
  WORLD_RULE: {
    id: 'world_rule',
    description: 'A fundamental rule of the world',
    immutable: true,
    alwaysInclude: true,
    format: (fact: ImmutableFact) => `World Rule: ${fact.value}`
  },
  FAMILY_RELATION: {
    id: 'family_relation',
    description: 'A permanent family relationship',
    immutable: true,
    alwaysInclude: true,
    format: (fact: ImmutableFact) => `${fact.char1} is the ${fact.relationType} of ${fact.char2}`
  },
  MAJOR_PLOT_POINT: {
    id: 'major_plot_point',
    description: 'A major story event that cannot be undone',
    immutable: true,
    alwaysInclude: true,
    critical: true,
    format: (fact: ImmutableFact) => fact.value
  }
} as const;

export type ImmutableFactType = keyof typeof IMMUTABLE_FACT_TYPES;

export interface ImmutableFact {
  id: string;
  type: ImmutableFactType;
  typeInfo: typeof IMMUTABLE_FACT_TYPES[ImmutableFactType];
  characterId?: string;
  char1?: string;
  char2?: string;
  relationType?: string;
  value?: string;
  cause?: string;
  location?: string;
  turn?: number;
  deathTimestamp?: number;
  storedAt: number;
  immutable: true;
  locked: true;
}

export class ImmutableFactVault {
  private vault: Map<string, ImmutableFact> = new Map();
  private characterIndex: Map<string, string[]> = new Map();
  private typeIndex: Map<string, string[]> = new Map();
  private deathRegistry: Set<string> = new Set();
  private nameRegistry: Map<string, string> = new Map();
  private aliasRegistry: Map<string, string> = new Map();
  private validationLog: Array<{
    type: string;
    factType?: string;
    data?: unknown;
    existingFact?: ImmutableFact;
    timestamp: number;
  }> = [];
  private createdAt: number = Date.now();
  private lastValidation: {
    timestamp: number;
    issues: unknown[];
    totalFacts: number;
    totalCharacters: number;
    totalDeaths: number;
  } | null = null;
  private factCounter: number = 0;

  // ========================================================================
  // CORE OPERATIONS
  // ========================================================================

  storeFact(factType: ImmutableFactType, data: Partial<ImmutableFact>): ImmutableFact | null {
    const typeInfo = IMMUTABLE_FACT_TYPES[factType];
    if (!typeInfo) {
      console.error(`Unknown immutable fact type: ${factType}`);
      return null;
    }

    // Generate unique ID
    const factId = `${factType}_${++this.factCounter}_${Date.now()}`;

    // Check for conflicts before storing
    const conflict = this.checkConflict(factType, data);
    if (conflict) {
      this.validationLog.push({
        type: 'conflict_prevented',
        factType,
        data,
        existingFact: conflict,
        timestamp: Date.now()
      });
      return conflict;
    }

    const fact: ImmutableFact = {
      id: factId,
      type: factType,
      typeInfo,
      ...data,
      storedAt: Date.now(),
      immutable: true,
      locked: true
    } as ImmutableFact;

    this.vault.set(factId, fact);
    this.updateIndexes(fact);
    this.handleSpecialTypes(fact);

    return fact;
  }

  private checkConflict(factType: ImmutableFactType, data: Partial<ImmutableFact>): ImmutableFact | null {
    switch (factType) {
      case 'CHARACTER_NAME':
      case 'CHARACTER_TRUE_NAME':
        const existingName = this.getCharacterName(data.characterId || '');
        if (existingName && existingName.value !== data.value) {
          return existingName;
        }
        break;

      case 'CHARACTER_DEATH':
        if (this.isCharacterDead(data.characterId || '')) {
          return this.getDeathRecord(data.characterId || '');
        }
        break;

      case 'CHARACTER_SPECIES':
        const facts = this.getCharacterFacts(data.characterId || '');
        const existingSpecies = facts.find(f => f.type === 'CHARACTER_SPECIES');
        if (existingSpecies && existingSpecies.value !== data.value) {
          return existingSpecies;
        }
        break;
    }
    return null;
  }

  private updateIndexes(fact: ImmutableFact): void {
    // Character index
    if (fact.characterId) {
      if (!this.characterIndex.has(fact.characterId)) {
        this.characterIndex.set(fact.characterId, []);
      }
      this.characterIndex.get(fact.characterId)!.push(fact.id);
    }

    // Also index by char1/char2 for relationships
    if (fact.char1) {
      if (!this.characterIndex.has(fact.char1)) {
        this.characterIndex.set(fact.char1, []);
      }
      this.characterIndex.get(fact.char1)!.push(fact.id);
    }

    if (fact.char2) {
      if (!this.characterIndex.has(fact.char2)) {
        this.characterIndex.set(fact.char2, []);
      }
      this.characterIndex.get(fact.char2)!.push(fact.id);
    }

    // Type index
    if (!this.typeIndex.has(fact.type)) {
      this.typeIndex.set(fact.type, []);
    }
    this.typeIndex.get(fact.type)!.push(fact.id);
  }

  private handleSpecialTypes(fact: ImmutableFact): void {
    switch (fact.type) {
      case 'CHARACTER_NAME':
      case 'PLAYER_NAME':
        this.nameRegistry.set(fact.characterId || 'player', fact.value || '');
        break;

      case 'CHARACTER_DEATH':
        this.deathRegistry.add(fact.characterId || '');
        break;
    }
  }

  // ========================================================================
  // NAME MANAGEMENT
  // ========================================================================

  getCanonicalName(characterId: string): string | null {
    return this.nameRegistry.get(characterId) || null;
  }

  registerAlias(characterId: string, alias: string): void {
    this.aliasRegistry.set(alias.toLowerCase(), characterId);
  }

  resolveAlias(nameOrAlias: string): string | null {
    const resolved = this.aliasRegistry.get(nameOrAlias.toLowerCase());
    if (resolved) return resolved;

    for (const [charId, name] of this.nameRegistry) {
      if (name.toLowerCase() === nameOrAlias.toLowerCase()) {
        return charId;
      }
    }
    return null;
  }

  getCharacterName(characterId: string): ImmutableFact | null {
    const facts = this.getCharacterFacts(characterId);
    return facts.find(f => f.type === 'CHARACTER_NAME' || f.type === 'CHARACTER_TRUE_NAME') || null;
  }

  getAllNames(): Array<{
    characterId: string;
    canonicalName: string;
    aliases: string[];
  }> {
    const names: Array<{
      characterId: string;
      canonicalName: string;
      aliases: string[];
    }> = [];
    
    for (const [charId, name] of this.nameRegistry) {
      names.push({
        characterId: charId,
        canonicalName: name,
        aliases: [...this.aliasRegistry.entries()]
          .filter(([, id]) => id === charId)
          .map(([alias]) => alias)
      });
    }
    return names;
  }

  // ========================================================================
  // DEATH MANAGEMENT
  // ========================================================================

  isCharacterDead(characterId: string): boolean {
    return this.deathRegistry.has(characterId);
  }

  getDeathRecord(characterId: string): ImmutableFact | null {
    if (!this.isCharacterDead(characterId)) return null;
    const facts = this.getCharacterFacts(characterId);
    return facts.find(f => f.type === 'CHARACTER_DEATH') || null;
  }

  getAllDeadCharacters(): string[] {
    return [...this.deathRegistry];
  }

  recordDeath(characterId: string, cause: string, location: string | null = null, turn: number | null = null): ImmutableFact | null {
    return this.storeFact('CHARACTER_DEATH', {
      characterId,
      cause,
      location: location || undefined,
      turn: turn || undefined,
      deathTimestamp: Date.now()
    });
  }

  // ========================================================================
  // QUERY METHODS
  // ========================================================================

  getCharacterFacts(characterId: string): ImmutableFact[] {
    const factIds = this.characterIndex.get(characterId) || [];
    return factIds.map(id => this.vault.get(id)).filter(Boolean) as ImmutableFact[];
  }

  getFactsByType(factType: ImmutableFactType): ImmutableFact[] {
    const factIds = this.typeIndex.get(factType) || [];
    return factIds.map(id => this.vault.get(id)).filter(Boolean) as ImmutableFact[];
  }

  getAlwaysIncludeFacts(): ImmutableFact[] {
    const results: ImmutableFact[] = [];
    for (const [, fact] of this.vault) {
      if (fact.typeInfo && fact.typeInfo.alwaysInclude) {
        results.push(fact);
      }
    }
    return results;
  }

  getCriticalFacts(): ImmutableFact[] {
    const results: ImmutableFact[] = [];
    for (const [, fact] of this.vault) {
      if (fact.typeInfo && 'critical' in fact.typeInfo && fact.typeInfo.critical) {
        results.push(fact);
      }
    }
    return results;
  }

  searchFacts(query: string): ImmutableFact[] {
    const results: ImmutableFact[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [, fact] of this.vault) {
      if (fact.value && fact.value.toLowerCase().includes(lowerQuery)) {
        results.push(fact);
        continue;
      }
      if (fact.characterId && fact.characterId.toLowerCase().includes(lowerQuery)) {
        results.push(fact);
        continue;
      }
    }
    return results;
  }

  // ========================================================================
  // VALIDATION
  // ========================================================================

  validateAction(action: { characterId?: string; type: string }): {
    valid: boolean;
    violations: Array<{
      type: string;
      severity: string;
      message: string;
      fact?: ImmutableFact | null;
    }>;
  } {
    const violations: Array<{
      type: string;
      severity: string;
      message: string;
      fact?: ImmutableFact | null;
    }> = [];

    if (action.characterId && this.isCharacterDead(action.characterId)) {
      if (['speak', 'act', 'move', 'appear'].includes(action.type)) {
        violations.push({
          type: 'dead_character_action',
          severity: 'critical',
          message: `${action.characterId} is DEAD and cannot ${action.type}`,
          fact: this.getDeathRecord(action.characterId)
        });
      }
    }

    if (action.type === 'rename' && action.characterId) {
      const existingName = this.getCharacterName(action.characterId);
      if (existingName) {
        violations.push({
          type: 'name_change_blocked',
          severity: 'critical',
          message: `${action.characterId}'s name is permanently "${existingName.value}" and cannot be changed`,
          fact: existingName
        });
      }
    }

    return {
      valid: violations.length === 0,
      violations
    };
  }

  runConsistencyCheck(): {
    timestamp: number;
    issues: unknown[];
    totalFacts: number;
    totalCharacters: number;
    totalDeaths: number;
  } {
    const issues: Array<{
      type: string;
      severity: string;
      message: string;
      characters?: string[];
      fact?: ImmutableFact;
    }> = [];

    // Check for duplicate names
    const namesSeen = new Map<string, string>();
    for (const [charId, name] of this.nameRegistry) {
      if (namesSeen.has(name.toLowerCase())) {
        issues.push({
          type: 'duplicate_name',
          severity: 'warning',
          message: `Name "${name}" used by multiple characters`,
          characters: [namesSeen.get(name.toLowerCase())!, charId]
        });
      }
      namesSeen.set(name.toLowerCase(), charId);
    }

    // Check for orphaned facts
    for (const [id, fact] of this.vault) {
      if (fact.characterId && !this.nameRegistry.has(fact.characterId)) {
        issues.push({
          type: 'orphaned_fact',
          severity: 'info',
          message: `Fact ${id} references unknown character ${fact.characterId}`,
          fact
        });
      }
    }

    this.lastValidation = {
      timestamp: Date.now(),
      issues,
      totalFacts: this.vault.size,
      totalCharacters: this.characterIndex.size,
      totalDeaths: this.deathRegistry.size
    };

    return this.lastValidation;
  }

  // ========================================================================
  // CONTEXT GENERATION
  // ========================================================================

  generateContext(options: {
    characterIds?: string[];
    includeAll?: boolean;
  } = {}): string {
    const lines: string[] = [];
    const { characterIds = [], includeAll = false } = options;

    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('  IMMUTABLE FACTS - THESE CANNOT BE CONTRADICTED');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('');

    // Dead characters first - CRITICAL
    const dead = this.getAllDeadCharacters();
    if (dead.length > 0) {
      lines.push('☠ DECEASED CHARACTERS (CANNOT appear, speak, or act):');
      dead.forEach(charId => {
        const name = this.getCanonicalName(charId) || charId;
        const record = this.getDeathRecord(charId);
        lines.push(`  ☠ ${name} - DEAD${record?.cause ? ` (${record.cause})` : ''}`);
      });
      lines.push('');
    }

    // Character names
    lines.push('📋 CHARACTER NAMES (Use these exact names):');
    const playerName = this.nameRegistry.get('player');
    if (playerName) {
      lines.push(`  ⭐ PLAYER: "${playerName}"`);
    }
    for (const [charId, name] of this.nameRegistry) {
      if (charId !== 'player') {
        lines.push(`  • ${charId}: "${name}"`);
      }
    }
    lines.push('');

    // Other facts
    const relevantCharIds = includeAll 
      ? [...this.characterIndex.keys()]
      : characterIds;

    if (relevantCharIds.length > 0) {
      lines.push('📌 ESTABLISHED FACTS:');
      relevantCharIds.forEach(charId => {
        const facts = this.getCharacterFacts(charId);
        facts.forEach(fact => {
          if (fact.type !== 'CHARACTER_NAME' && fact.type !== 'CHARACTER_DEATH') {
            lines.push(`  • ${fact.typeInfo.format(fact)}`);
          }
        });
      });
      lines.push('');
    }

    lines.push('⚠ RULES: Do NOT contradict any facts above. Dead characters CANNOT appear.');
    lines.push('');

    return lines.join('\n');
  }

  generateCompactContext(): string {
    const lines: string[] = [];

    lines.push('=== IMMUTABLE ===');

    const dead = this.getAllDeadCharacters();
    if (dead.length > 0) {
      const deadNames = dead.map(id => this.getCanonicalName(id) || id);
      lines.push(`DEAD: ${deadNames.join(', ')}`);
    }

    const names: string[] = [];
    for (const [charId, name] of this.nameRegistry) {
      names.push(`${charId}="${name}"`);
    }
    if (names.length > 0) {
      lines.push(`NAMES: ${names.join(', ')}`);
    }

    return lines.join('\n');
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  export(): {
    vault: [string, ImmutableFact][];
    characterIndex: [string, string[]][];
    typeIndex: [string, string[]][];
    deathRegistry: string[];
    nameRegistry: [string, string][];
    aliasRegistry: [string, string][];
    validationLog: typeof this.validationLog;
    createdAt: number;
    factCounter: number;
  } {
    return {
      vault: [...this.vault.entries()],
      characterIndex: [...this.characterIndex.entries()],
      typeIndex: [...this.typeIndex.entries()],
      deathRegistry: [...this.deathRegistry],
      nameRegistry: [...this.nameRegistry.entries()],
      aliasRegistry: [...this.aliasRegistry.entries()],
      validationLog: this.validationLog,
      createdAt: this.createdAt,
      factCounter: this.factCounter
    };
  }

  import(data: ReturnType<typeof this.export>): void {
    this.vault = new Map(data.vault || []);
    this.characterIndex = new Map(data.characterIndex || []);
    this.typeIndex = new Map(data.typeIndex || []);
    this.deathRegistry = new Set(data.deathRegistry || []);
    this.nameRegistry = new Map(data.nameRegistry || []);
    this.aliasRegistry = new Map(data.aliasRegistry || []);
    this.validationLog = data.validationLog || [];
    this.createdAt = data.createdAt || Date.now();
    this.factCounter = data.factCounter || 0;
  }

  getStats(): {
    totalFacts: number;
    totalCharacters: number;
    totalNames: number;
    totalDeaths: number;
    totalAliases: number;
    validationIssues: number;
    createdAt: number;
    lastValidation: typeof this.lastValidation;
  } {
    return {
      totalFacts: this.vault.size,
      totalCharacters: this.characterIndex.size,
      totalNames: this.nameRegistry.size,
      totalDeaths: this.deathRegistry.size,
      totalAliases: this.aliasRegistry.size,
      validationIssues: this.validationLog.length,
      createdAt: this.createdAt,
      lastValidation: this.lastValidation
    };
  }

  clear(): void {
    this.vault.clear();
    this.characterIndex.clear();
    this.typeIndex.clear();
    this.deathRegistry.clear();
    this.nameRegistry.clear();
    this.aliasRegistry.clear();
    this.validationLog = [];
    this.factCounter = 0;
  }
}

// ========================================================================
// SINGLETON INSTANCE
// ========================================================================

let vaultInstance: ImmutableFactVault | null = null;

export const getImmutableVault = (): ImmutableFactVault => {
  if (!vaultInstance) {
    vaultInstance = new ImmutableFactVault();
  }
  return vaultInstance;
};

export const resetImmutableVault = (): ImmutableFactVault => {
  vaultInstance = new ImmutableFactVault();
  return vaultInstance;
};
