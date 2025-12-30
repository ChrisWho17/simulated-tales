// ============================================================================
// MOVE SYNC SYSTEM - Per-action state synchronization
// Runs after each player action to keep story, inventory, and world consistent
// Focused on: Environment, Genre, Player State
// ============================================================================

import { GameGenre, GENRE_DATA } from '@/types/genreData';
import { InventoryState } from './inventorySystem';
import { eventBus } from './eventBus';

// ============================================================================
// SYNC STATE INTERFACE
// ============================================================================

export interface MoveSyncState {
  lastSyncTick: number;
  syncCount: number;
  currentEnvironment: EnvironmentState;
  genreConsistency: GenreConsistencyState;
  playerState: PlayerSyncState;
  npcsInScene: string[];
  flags: Record<string, boolean>;
  tags: string[];
}

export interface EnvironmentState {
  currentLocation: string;
  locationType: LocationType;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  lightLevel: LightLevel;
  dangerLevel: DangerLevel;
  ambientFeatures: string[];
  lastUpdated: number;
}

export interface GenreConsistencyState {
  primaryGenre: GameGenre;
  activeSecondaryGenres: Array<{ genre: GameGenre; strength: number }>;
  genreViolations: GenreViolation[];
  elementBudget: {
    primary: number;    // 50-100%
    secondary: number;  // 0-50%
    used: number;
  };
}

export interface PlayerSyncState {
  healthStatus: HealthStatus;
  resourceLevels: Record<string, number>;
  activeEffects: string[];
  currentStance: 'combat' | 'stealth' | 'social' | 'exploration';
  visibility: 'hidden' | 'noticed' | 'visible' | 'exposed';
  fatigue: number; // 0-100
  morale: number;  // 0-100
}

export interface GenreViolation {
  tick: number;
  violation: string;
  severity: 'minor' | 'moderate' | 'major';
  element: string;
  autoCorrection?: string;
}

export type LocationType = 
  | 'interior' | 'exterior' | 'underground' | 'aerial' | 'underwater'
  | 'urban' | 'wilderness' | 'dungeon' | 'vehicle' | 'supernatural';

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';

export type WeatherType = 
  | 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy' 
  | 'snowy' | 'windy' | 'dusty' | 'hazardous';

export type LightLevel = 'bright' | 'normal' | 'dim' | 'dark' | 'pitch_black';

export type DangerLevel = 'safe' | 'low' | 'moderate' | 'high' | 'extreme';

export type HealthStatus = 'healthy' | 'minor_injury' | 'injured' | 'critical' | 'incapacitated';

// ============================================================================
// DEFAULT STATE
// ============================================================================

function createDefaultState(): MoveSyncState {
  return {
    lastSyncTick: 0,
    syncCount: 0,
    currentEnvironment: {
      currentLocation: 'unknown',
      locationType: 'exterior',
      timeOfDay: 'midday',
      weather: 'clear',
      lightLevel: 'normal',
      dangerLevel: 'low',
      ambientFeatures: [],
      lastUpdated: Date.now(),
    },
    genreConsistency: {
      primaryGenre: 'fantasy',
      activeSecondaryGenres: [],
      genreViolations: [],
      elementBudget: { primary: 100, secondary: 0, used: 0 },
    },
    playerState: {
      healthStatus: 'healthy',
      resourceLevels: {},
      activeEffects: [],
      currentStance: 'exploration',
      visibility: 'visible',
      fatigue: 0,
      morale: 75,
    },
    npcsInScene: [],
    flags: {},
    tags: [],
  };
}

// ============================================================================
// SINGLETON STATE
// ============================================================================

let syncState: MoveSyncState = createDefaultState();

// ============================================================================
// ENVIRONMENT DETECTION FROM NARRATIVE
// ============================================================================

const LOCATION_PATTERNS: Array<{ pattern: RegExp; type: LocationType }> = [
  { pattern: /\b(tavern|inn|shop|house|castle|tower|temple|church|library)\b/i, type: 'interior' },
  { pattern: /\b(forest|woods|plains|mountains?|valley|river|lake|ocean|sea)\b/i, type: 'wilderness' },
  { pattern: /\b(dungeon|cave|catacomb|ruins|tomb|crypt)\b/i, type: 'dungeon' },
  { pattern: /\b(city|town|village|street|alley|market|square)\b/i, type: 'urban' },
  { pattern: /\b(ship|boat|vessel|deck|cabin)\b/i, type: 'vehicle' },
  { pattern: /\b(underground|sewers?|tunnels?|basement|cellar)\b/i, type: 'underground' },
  { pattern: /\b(sky|flying|airship|balloon|clouds?)\b/i, type: 'aerial' },
  { pattern: /\b(underwater|depths|beneath the waves)\b/i, type: 'underwater' },
  { pattern: /\b(spirit realm|otherworld|dimension|ethereal|astral)\b/i, type: 'supernatural' },
];

const TIME_PATTERNS: Array<{ pattern: RegExp; time: TimeOfDay }> = [
  { pattern: /\b(dawn|sunrise|first light)\b/i, time: 'dawn' },
  { pattern: /\b(morning|early)\b/i, time: 'morning' },
  { pattern: /\b(midday|noon|high sun)\b/i, time: 'midday' },
  { pattern: /\b(afternoon|late day)\b/i, time: 'afternoon' },
  { pattern: /\b(dusk|sunset|twilight)\b/i, time: 'dusk' },
  { pattern: /\b(evening|nightfall)\b/i, time: 'evening' },
  { pattern: /\b(night|darkness falls|under the stars)\b/i, time: 'night' },
  { pattern: /\b(midnight|witching hour|dead of night)\b/i, time: 'midnight' },
];

const WEATHER_PATTERNS: Array<{ pattern: RegExp; weather: WeatherType }> = [
  { pattern: /\b(rain|raining|downpour|drizzle)\b/i, weather: 'rainy' },
  { pattern: /\b(storm|thunder|lightning|tempest)\b/i, weather: 'stormy' },
  { pattern: /\b(snow|snowing|blizzard|frost)\b/i, weather: 'snowy' },
  { pattern: /\b(fog|mist|haze)\b/i, weather: 'foggy' },
  { pattern: /\b(wind|windy|gale|breeze)\b/i, weather: 'windy' },
  { pattern: /\b(dust|sand|sandstorm)\b/i, weather: 'dusty' },
  { pattern: /\b(clear|sunny|bright|fair)\b/i, weather: 'clear' },
  { pattern: /\b(cloud|overcast|grey sky)\b/i, weather: 'cloudy' },
  { pattern: /\b(toxic|radiation|acid rain|hazard)\b/i, weather: 'hazardous' },
];

const DANGER_PATTERNS: Array<{ pattern: RegExp; level: DangerLevel }> = [
  { pattern: /\b(safe|peaceful|calm|serene|protected)\b/i, level: 'safe' },
  { pattern: /\b(quiet|still|uneventful)\b/i, level: 'low' },
  { pattern: /\b(tense|uneasy|watchful|wary)\b/i, level: 'moderate' },
  { pattern: /\b(dangerous|hostile|threat|enemies)\b/i, level: 'high' },
  { pattern: /\b(lethal|deadly|swarm|ambush|surrounded)\b/i, level: 'extreme' },
];

const PLAYER_HEALTH_PATTERNS: Array<{ pattern: RegExp; status: HealthStatus }> = [
  { pattern: /\b(perfectly fine|unharmed|healthy|in good shape)\b/i, status: 'healthy' },
  { pattern: /\b(minor (wound|cut|bruise)|scratched|slightly hurt)\b/i, status: 'minor_injury' },
  { pattern: /\b(wounded|injured|bleeding|hurt|pain)\b/i, status: 'injured' },
  { pattern: /\b(critical|dying|near death|gravely wounded|severe)\b/i, status: 'critical' },
  { pattern: /\b(unconscious|incapacitated|collapsed|paralyzed)\b/i, status: 'incapacitated' },
];

const STANCE_PATTERNS: Array<{ pattern: RegExp; stance: PlayerSyncState['currentStance'] }> = [
  { pattern: /\b(fight|attack|combat|battle|weapon drawn|strike)\b/i, stance: 'combat' },
  { pattern: /\b(sneak|hide|stealth|creep|shadow|silent)\b/i, stance: 'stealth' },
  { pattern: /\b(talk|speak|negotiate|persuade|charm|conversation)\b/i, stance: 'social' },
  { pattern: /\b(explore|search|investigate|look around|examine)\b/i, stance: 'exploration' },
];

// ============================================================================
// GENRE ELEMENT DETECTION
// ============================================================================

const GENRE_ELEMENTS: Record<GameGenre, string[]> = {
  fantasy: ['magic', 'spell', 'wizard', 'dragon', 'elf', 'dwarf', 'orc', 'enchanted', 'potion', 'quest', 'kingdom', 'sword', 'mythical'],
  scifi: ['spaceship', 'laser', 'robot', 'android', 'alien', 'galaxy', 'planet', 'cybernetic', 'AI', 'hologram', 'warp', 'quantum'],
  horror: ['horror', 'monster', 'ghost', 'demon', 'undead', 'curse', 'nightmare', 'terror', 'blood', 'darkness', 'haunted', 'possessed'],
  mystery: ['clue', 'detective', 'suspect', 'evidence', 'murder', 'investigate', 'case', 'crime', 'alibi', 'witness'],
  pirate: ['ship', 'treasure', 'captain', 'crew', 'sail', 'cannon', 'pirate', 'gold', 'island', 'sea', 'plunder'],
  western: ['cowboy', 'sheriff', 'saloon', 'revolver', 'horse', 'outlaw', 'frontier', 'duel', 'ranch', 'bounty'],
  cyberpunk: ['neon', 'hacker', 'corporation', 'implant', 'cyborg', 'megacity', 'chrome', 'data', 'neural', 'street'],
  postapoc: ['wasteland', 'radiation', 'survivor', 'bunker', 'mutant', 'scavenge', 'ruins', 'fallout', 'supplies'],
  war: ['soldier', 'battle', 'military', 'combat', 'weapon', 'trench', 'enemy', 'mission', 'tactical', 'infantry'],
  modern_life: ['apartment', 'job', 'office', 'relationship', 'city', 'phone', 'car', 'bills', 'social'],
  custom: [],
};

// ============================================================================
// NARRATIVE PARSING
// ============================================================================

export function parseNarrativeForEnvironment(narrative: string): Partial<EnvironmentState> {
  const updates: Partial<EnvironmentState> = {};
  
  // Detect location type
  for (const { pattern, type } of LOCATION_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.locationType = type;
      break;
    }
  }
  
  // Detect time of day
  for (const { pattern, time } of TIME_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.timeOfDay = time;
      break;
    }
  }
  
  // Detect weather
  for (const { pattern, weather } of WEATHER_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.weather = weather;
      break;
    }
  }
  
  // Detect danger level
  for (const { pattern, level } of DANGER_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.dangerLevel = level;
      break;
    }
  }
  
  // Derive light level from time and location
  if (updates.timeOfDay || updates.locationType) {
    updates.lightLevel = deriveLightLevel(
      updates.timeOfDay || syncState.currentEnvironment.timeOfDay,
      updates.locationType || syncState.currentEnvironment.locationType
    );
  }
  
  // Extract location name if mentioned
  const locationMatch = narrative.match(/(?:enter|arrive at|reach|in the|inside|at the)\s+(?:the\s+)?([A-Z][a-zA-Z\s]+?)(?:\.|,|;|\s+and|\s+where)/);
  if (locationMatch) {
    updates.currentLocation = locationMatch[1].trim();
  }
  
  return updates;
}

function deriveLightLevel(time: TimeOfDay, location: LocationType): LightLevel {
  // Underground/dungeon is always dark unless specified
  if (location === 'underground' || location === 'dungeon') {
    return 'dark';
  }
  
  // Time-based for exterior/normal locations
  const timeLevels: Record<TimeOfDay, LightLevel> = {
    dawn: 'dim',
    morning: 'normal',
    midday: 'bright',
    afternoon: 'normal',
    dusk: 'dim',
    evening: 'dim',
    night: 'dark',
    midnight: 'pitch_black',
  };
  
  return timeLevels[time] || 'normal';
}

export function parseNarrativeForPlayerState(narrative: string, playerName: string): Partial<PlayerSyncState> {
  const updates: Partial<PlayerSyncState> = {};
  
  // Check if narrative mentions the player
  const playerMentioned = narrative.toLowerCase().includes(playerName.toLowerCase()) || 
                          narrative.toLowerCase().includes('you ');
  
  if (!playerMentioned) return updates;
  
  // Detect health status
  for (const { pattern, status } of PLAYER_HEALTH_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.healthStatus = status;
      break;
    }
  }
  
  // Detect stance
  for (const { pattern, stance } of STANCE_PATTERNS) {
    if (pattern.test(narrative)) {
      updates.currentStance = stance;
      break;
    }
  }
  
  // Detect visibility
  if (/\b(hidden|concealed|invisible|unnoticed)\b/i.test(narrative)) {
    updates.visibility = 'hidden';
  } else if (/\b(spotted|noticed|seen|discovered)\b/i.test(narrative)) {
    updates.visibility = 'noticed';
  } else if (/\b(exposed|surrounded|center of attention)\b/i.test(narrative)) {
    updates.visibility = 'exposed';
  }
  
  // Detect fatigue changes
  if (/\b(exhausted|tired|fatigued|drained)\b/i.test(narrative)) {
    updates.fatigue = Math.min(100, (syncState.playerState.fatigue || 0) + 20);
  } else if (/\b(rested|refreshed|energized)\b/i.test(narrative)) {
    updates.fatigue = Math.max(0, (syncState.playerState.fatigue || 0) - 30);
  }
  
  // Detect morale changes
  if (/\b(hopeful|confident|victorious|elated)\b/i.test(narrative)) {
    updates.morale = Math.min(100, (syncState.playerState.morale || 75) + 15);
  } else if (/\b(despair|hopeless|demoralized|terrified)\b/i.test(narrative)) {
    updates.morale = Math.max(0, (syncState.playerState.morale || 75) - 20);
  }
  
  return updates;
}

export function parseNarrativeForGenreElements(narrative: string, primaryGenre: GameGenre): GenreViolation[] {
  const violations: GenreViolation[] = [];
  const primaryElements = GENRE_ELEMENTS[primaryGenre] || [];
  const secondaryGenres = syncState.genreConsistency.activeSecondaryGenres.map(s => s.genre);
  
  // Get all allowed elements (primary + secondary genres)
  const allowedElements = new Set<string>([
    ...primaryElements,
    ...secondaryGenres.flatMap(g => GENRE_ELEMENTS[g] || []),
  ]);
  
  // Check for foreign genre elements
  for (const [genre, elements] of Object.entries(GENRE_ELEMENTS)) {
    if (genre === primaryGenre || secondaryGenres.includes(genre as GameGenre)) continue;
    
    for (const element of elements) {
      const regex = new RegExp(`\\b${element}\\b`, 'i');
      if (regex.test(narrative) && !allowedElements.has(element)) {
        violations.push({
          tick: syncState.lastSyncTick,
          violation: `Foreign genre element detected: "${element}" from ${genre}`,
          severity: 'minor',
          element,
          autoCorrection: `Consider rephrasing to fit ${primaryGenre} genre`,
        });
      }
    }
  }
  
  return violations;
}

// ============================================================================
// NPC SCENE TRACKING
// ============================================================================

const NPC_PATTERNS = [
  /(?:(?:a|the|an)\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:says?|asks?|replies?|mutters?|whispers?|shouts?|speaks?)/g,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:turns|looks|steps|walks|approaches|nods|shakes)/g,
  /\"[^\"]*\"\s+(?:says?|asks?|replies?)\s+([A-Z][a-z]+)/g,
];

const GENERIC_NOUNS = new Set([
  'The', 'You', 'Your', 'This', 'That', 'These', 'Those', 'It', 'He', 'She', 'They',
  'Someone', 'Something', 'Nothing', 'Everyone', 'Suddenly', 'Perhaps', 'Finally',
  'Before', 'After', 'Inside', 'Outside', 'Above', 'Below',
]);

export function parseNarrativeForNPCsInScene(narrative: string, playerName: string): string[] {
  const npcs = new Set<string>();
  
  for (const pattern of NPC_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(narrative)) !== null) {
      const name = match[1]?.trim();
      if (name && 
          !GENERIC_NOUNS.has(name) && 
          name !== playerName &&
          name.length > 2 &&
          name.length < 30) {
        npcs.add(name);
      }
    }
  }
  
  return Array.from(npcs);
}

// ============================================================================
// FLAG & TAG EXTRACTION
// ============================================================================

const FLAG_PATTERNS = [
  { pattern: /\[FLAG:\s*(\w+)\]/gi, extract: (m: RegExpMatchArray) => m[1] },
  { pattern: /\[SET:\s*(\w+)\]/gi, extract: (m: RegExpMatchArray) => m[1] },
  { pattern: /discovered\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+secret/gi, extract: (m: RegExpMatchArray) => `secret_${m[1].replace(/\s+/g, '_')}` },
  { pattern: /unlocked\s+(?:the\s+)?(\w+(?:\s+\w+)?)/gi, extract: (m: RegExpMatchArray) => `unlocked_${m[1].replace(/\s+/g, '_')}` },
  { pattern: /completed\s+(?:the\s+)?(\w+(?:\s+\w+)?)\s+(?:quest|mission|objective)/gi, extract: (m: RegExpMatchArray) => `completed_${m[1].replace(/\s+/g, '_')}` },
];

const TAG_PATTERNS = [
  { pattern: /\[TAG:\s*([^\\]]+)\]/gi, extract: (m: RegExpMatchArray) => m[1] },
  { pattern: /\[SCENE:\s*([^\\]]+)\]/gi, extract: (m: RegExpMatchArray) => `scene:${m[1]}` },
  { pattern: /\[MOOD:\s*([^\\]]+)\]/gi, extract: (m: RegExpMatchArray) => `mood:${m[1]}` },
];

export function parseNarrativeForFlags(narrative: string): Record<string, boolean> {
  const flags: Record<string, boolean> = {};
  
  for (const { pattern, extract } of FLAG_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(narrative)) !== null) {
      const flag = extract(match);
      if (flag) {
        flags[flag.toLowerCase()] = true;
      }
    }
  }
  
  // Also check for flag clearing
  const clearPattern = /\[CLEAR:\s*(\w+)\]/gi;
  let clearMatch;
  while ((clearMatch = clearPattern.exec(narrative)) !== null) {
    flags[clearMatch[1].toLowerCase()] = false;
  }
  
  return flags;
}

export function parseNarrativeForTags(narrative: string): string[] {
  const tags: string[] = [];
  
  for (const { pattern, extract } of TAG_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(narrative)) !== null) {
      const tag = extract(match);
      if (tag && !tags.includes(tag.toLowerCase())) {
        tags.push(tag.toLowerCase());
      }
    }
  }
  
  return tags;
}

// ============================================================================
// MAIN SYNC FUNCTION - Called after each player action
// ============================================================================

export interface MoveSyncResult {
  environmentUpdates: Partial<EnvironmentState>;
  playerUpdates: Partial<PlayerSyncState>;
  genreViolations: GenreViolation[];
  npcsDetected: string[];
  flagsSet: Record<string, boolean>;
  tagsAdded: string[];
  syncTick: number;
}

export function runMoveSync(
  narrative: string,
  playerName: string,
  currentTick: number,
  options?: {
    primaryGenre?: GameGenre;
    secondaryGenres?: Array<{ genre: GameGenre; strength: number }>;
  }
): MoveSyncResult {
  // Update genre consistency if provided
  if (options?.primaryGenre) {
    syncState.genreConsistency.primaryGenre = options.primaryGenre;
  }
  if (options?.secondaryGenres) {
    syncState.genreConsistency.activeSecondaryGenres = options.secondaryGenres;
  }
  
  // Parse narrative for all state updates
  const environmentUpdates = parseNarrativeForEnvironment(narrative);
  const playerUpdates = parseNarrativeForPlayerState(narrative, playerName);
  const genreViolations = parseNarrativeForGenreElements(narrative, syncState.genreConsistency.primaryGenre);
  const npcsDetected = parseNarrativeForNPCsInScene(narrative, playerName);
  const flagsSet = parseNarrativeForFlags(narrative);
  const tagsAdded = parseNarrativeForTags(narrative);
  
  // Apply environment updates
  syncState.currentEnvironment = {
    ...syncState.currentEnvironment,
    ...environmentUpdates,
    lastUpdated: Date.now(),
  };
  
  // Apply player state updates
  syncState.playerState = {
    ...syncState.playerState,
    ...playerUpdates,
  };
  
  // Record genre violations
  syncState.genreConsistency.genreViolations.push(...genreViolations);
  // Keep only last 50 violations
  if (syncState.genreConsistency.genreViolations.length > 50) {
    syncState.genreConsistency.genreViolations = syncState.genreConsistency.genreViolations.slice(-50);
  }
  
  // Update NPCs in scene
  syncState.npcsInScene = npcsDetected;
  
  // Update flags (merge with existing)
  syncState.flags = { ...syncState.flags, ...flagsSet };
  
  // Update tags (add new ones)
  for (const tag of tagsAdded) {
    if (!syncState.tags.includes(tag)) {
      syncState.tags.push(tag);
    }
  }
  
  // Keep only last 100 tags
  if (syncState.tags.length > 100) {
    syncState.tags = syncState.tags.slice(-100);
  }
  
  // Update sync metadata
  syncState.lastSyncTick = currentTick;
  syncState.syncCount++;
  
  console.log(`[MoveSync] Tick ${currentTick}: Env=${environmentUpdates.locationType || 'unchanged'}, NPCs=${npcsDetected.length}, Flags=${Object.keys(flagsSet).length}, Violations=${genreViolations.length}`);
  
  return {
    environmentUpdates,
    playerUpdates,
    genreViolations,
    npcsDetected,
    flagsSet,
    tagsAdded,
    syncTick: currentTick,
  };
}

// ============================================================================
// STATE ACCESS
// ============================================================================

export function getMoveSyncState(): MoveSyncState {
  return { ...syncState };
}

export function getCurrentEnvironment(): EnvironmentState {
  return { ...syncState.currentEnvironment };
}

export function getPlayerSyncState(): PlayerSyncState {
  return { ...syncState.playerState };
}

export function getActiveFlags(): Record<string, boolean> {
  return { ...syncState.flags };
}

export function hasFlag(flagName: string): boolean {
  return syncState.flags[flagName.toLowerCase()] === true;
}

export function getActiveTags(): string[] {
  return [...syncState.tags];
}

export function getNPCsInScene(): string[] {
  return [...syncState.npcsInScene];
}

export function getGenreViolations(limit: number = 10): GenreViolation[] {
  return syncState.genreConsistency.genreViolations.slice(-limit);
}

// ============================================================================
// CONTEXT BUILDING FOR AI
// ============================================================================

export function buildMoveSyncContextForAI(): string {
  const lines: string[] = [];
  const env = syncState.currentEnvironment;
  const player = syncState.playerState;
  
  lines.push('## CURRENT STATE SYNC');
  lines.push('');
  
  // Environment
  lines.push('### Environment');
  lines.push(`- Location: ${env.currentLocation} (${env.locationType})`);
  lines.push(`- Time: ${env.timeOfDay}, Light: ${env.lightLevel}`);
  lines.push(`- Weather: ${env.weather}`);
  lines.push(`- Danger Level: ${env.dangerLevel}`);
  if (env.ambientFeatures.length > 0) {
    lines.push(`- Ambient: ${env.ambientFeatures.join(', ')}`);
  }
  lines.push('');
  
  // Player
  lines.push('### Player Status');
  lines.push(`- Health: ${player.healthStatus}`);
  lines.push(`- Stance: ${player.currentStance}`);
  lines.push(`- Visibility: ${player.visibility}`);
  if (player.fatigue > 30) {
    lines.push(`- Fatigue: ${player.fatigue}% (${player.fatigue > 70 ? 'exhausted' : 'tired'})`);
  }
  if (player.morale < 50 || player.morale > 80) {
    lines.push(`- Morale: ${player.morale}% (${player.morale < 50 ? 'low' : 'high'})`);
  }
  if (player.activeEffects.length > 0) {
    lines.push(`- Active Effects: ${player.activeEffects.join(', ')}`);
  }
  lines.push('');
  
  // NPCs in scene
  if (syncState.npcsInScene.length > 0) {
    lines.push('### NPCs Present');
    lines.push(`- ${syncState.npcsInScene.join(', ')}`);
    lines.push('');
  }
  
  // Active story flags
  const activeFlags = Object.entries(syncState.flags).filter(([, v]) => v).map(([k]) => k);
  if (activeFlags.length > 0) {
    lines.push('### Story Flags');
    lines.push(`- Active: ${activeFlags.slice(0, 10).join(', ')}${activeFlags.length > 10 ? ` +${activeFlags.length - 10} more` : ''}`);
    lines.push('');
  }
  
  // Genre consistency
  const recentViolations = syncState.genreConsistency.genreViolations.slice(-3);
  if (recentViolations.length > 0) {
    lines.push('### Genre Warnings');
    for (const v of recentViolations) {
      lines.push(`- ${v.violation}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}

// ============================================================================
// INITIALIZATION & RESET
// ============================================================================

export function initializeMoveSyncState(config: {
  primaryGenre: GameGenre;
  secondaryGenres?: Array<{ genre: GameGenre; strength: number }>;
  startingLocation?: string;
}): void {
  syncState = createDefaultState();
  syncState.genreConsistency.primaryGenre = config.primaryGenre;
  syncState.genreConsistency.activeSecondaryGenres = config.secondaryGenres || [];
  
  if (config.startingLocation) {
    syncState.currentEnvironment.currentLocation = config.startingLocation;
  }
  
  // Calculate element budget
  const secondaryTotal = (config.secondaryGenres || []).reduce((sum, s) => sum + s.strength, 0);
  syncState.genreConsistency.elementBudget = {
    primary: 100 - secondaryTotal,
    secondary: secondaryTotal,
    used: 0,
  };
  
  console.log(`[MoveSync] Initialized for ${config.primaryGenre} with ${config.secondaryGenres?.length || 0} secondary genres`);
}

export function resetMoveSyncState(): void {
  syncState = createDefaultState();
  console.log('[MoveSync] State reset');
}

// ============================================================================
// SERIALIZATION
// ============================================================================

export function serializeMoveSyncState(): string {
  return JSON.stringify(syncState);
}

export function deserializeMoveSyncState(data: string): void {
  try {
    const parsed = JSON.parse(data);
    syncState = { ...createDefaultState(), ...parsed };
    console.log('[MoveSync] State deserialized');
  } catch (e) {
    console.error('[MoveSync] Failed to deserialize:', e);
  }
}

// ============================================================================
// DEBUG
// ============================================================================

if (typeof window !== 'undefined') {
  (window as any).debugMoveSync = {
    getState: getMoveSyncState,
    getEnvironment: getCurrentEnvironment,
    getPlayer: getPlayerSyncState,
    getFlags: getActiveFlags,
    getTags: getActiveTags,
    getNPCs: getNPCsInScene,
    getViolations: getGenreViolations,
    buildContext: buildMoveSyncContextForAI,
  };
}
