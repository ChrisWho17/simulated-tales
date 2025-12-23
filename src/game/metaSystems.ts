// Phase 8: Meta Systems & Polish
// Save system, debug mode, simulation depth display, and game settings

import { GameState, NPC, GameEvent } from '@/types/game';
import { NarratorState, NarratorVoice } from './narratorSystem';
import { WorldEvolutionState } from './advancedDynamics';

// ============= SAVE SYSTEM =============

export interface SaveData {
  version: string;
  timestamp: number;
  gameState: GameState;
  narratorState?: NarratorState;
  worldEvolution?: WorldEvolutionState;
  debugMode: boolean;
  settings: GameSettings;
  playtime: number; // in minutes
  checksum: string;
}

export interface SaveSlot {
  id: string;
  name: string;
  timestamp: number;
  preview: SavePreview;
  isAutoSave: boolean;
}

export interface SavePreview {
  playerLocation: string;
  day: number;
  season: string;
  playerHealth: number;
  eventCount: number;
}

const SAVE_VERSION = '1.0.0';
const STORAGE_KEY = 'living_world_rpg_saves';
const AUTOSAVE_KEY = 'living_world_rpg_autosave';

function generateChecksum(data: Partial<SaveData>): string {
  // Simple checksum for save validation
  const str = JSON.stringify({
    time: data.gameState?.time,
    player: data.gameState?.player.name,
    eventCount: data.gameState?.events.length,
  });
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

export function createSaveData(
  gameState: GameState,
  narratorState?: NarratorState,
  worldEvolution?: WorldEvolutionState,
  settings?: GameSettings,
  debugMode: boolean = false,
  playtime: number = 0
): SaveData {
  const saveData: Partial<SaveData> = {
    version: SAVE_VERSION,
    timestamp: Date.now(),
    gameState,
    narratorState,
    worldEvolution,
    debugMode,
    settings: settings || getDefaultSettings(),
    playtime,
  };
  
  return {
    ...saveData,
    checksum: generateChecksum(saveData),
  } as SaveData;
}

export function saveGame(saveData: SaveData, slotId: string): boolean {
  try {
    const saves = loadSaveSlots();
    const preview: SavePreview = {
      playerLocation: saveData.gameState.locations[saveData.gameState.player.currentLocation]?.name || 'Unknown',
      day: saveData.gameState.time.day,
      season: saveData.gameState.time.season,
      playerHealth: saveData.gameState.player.stats.health,
      eventCount: saveData.gameState.events.length,
    };
    
    const slot: SaveSlot = {
      id: slotId,
      name: `Save ${slotId}`,
      timestamp: saveData.timestamp,
      preview,
      isAutoSave: slotId === 'autosave',
    };
    
    // Store slot metadata
    saves[slotId] = slot;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    
    // Store actual save data
    localStorage.setItem(`${STORAGE_KEY}_${slotId}`, JSON.stringify(saveData));
    
    return true;
  } catch (error) {
    console.error('Failed to save game:', error);
    return false;
  }
}

export function loadGame(slotId: string): SaveData | null {
  try {
    const rawData = localStorage.getItem(`${STORAGE_KEY}_${slotId}`);
    if (!rawData) return null;
    
    const saveData: SaveData = JSON.parse(rawData);
    
    // Validate checksum
    const expectedChecksum = generateChecksum(saveData);
    if (saveData.checksum !== expectedChecksum) {
      console.warn('Save data checksum mismatch - data may be corrupted');
    }
    
    // Version migration could happen here
    if (saveData.version !== SAVE_VERSION) {
      console.log(`Migrating save from version ${saveData.version} to ${SAVE_VERSION}`);
      // Add migration logic here as needed
    }
    
    return saveData;
  } catch (error) {
    console.error('Failed to load game:', error);
    return null;
  }
}

export function loadSaveSlots(): Record<string, SaveSlot> {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    return rawData ? JSON.parse(rawData) : {};
  } catch {
    return {};
  }
}

export function deleteSave(slotId: string): boolean {
  try {
    const saves = loadSaveSlots();
    delete saves[slotId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
    localStorage.removeItem(`${STORAGE_KEY}_${slotId}`);
    return true;
  } catch {
    return false;
  }
}

export function autoSave(gameState: GameState): void {
  const saveData = createSaveData(gameState, undefined, undefined, undefined, false, 0);
  saveGame(saveData, 'autosave');
}

// ============= DEBUG MODE =============

export interface DebugState {
  enabled: boolean;
  showNPCInternals: boolean;
  showWorldTick: boolean;
  showRelationships: boolean;
  showMemories: boolean;
  showConsequences: boolean;
  godMode: boolean;
  timeControl: boolean;
  logLevel: 'none' | 'errors' | 'warnings' | 'all';
}

export const defaultDebugState: DebugState = {
  enabled: false,
  showNPCInternals: false,
  showWorldTick: false,
  showRelationships: false,
  showMemories: false,
  showConsequences: false,
  godMode: false,
  timeControl: false,
  logLevel: 'errors',
};

export type DebugCommand = 
  | { type: 'SET_TIME'; hour: number; day?: number }
  | { type: 'SET_STAT'; stat: keyof GameState['player']['stats']; value: number }
  | { type: 'TELEPORT'; location: string }
  | { type: 'SPAWN_NPC'; npcId: string }
  | { type: 'SET_RELATIONSHIP'; npcId: string; field: string; value: number }
  | { type: 'TRIGGER_EVENT'; eventType: string }
  | { type: 'DUMP_STATE' }
  | { type: 'RESET_NPC'; npcId: string };

export function executeDebugCommand(
  command: DebugCommand,
  state: GameState
): { newState: GameState; output: string } {
  let newState = { ...state };
  let output = '';
  
  switch (command.type) {
    case 'SET_TIME':
      newState.time = {
        ...newState.time,
        hour: command.hour,
        day: command.day ?? newState.time.day,
      };
      output = `Time set to ${command.hour}:00, Day ${newState.time.day}`;
      break;
      
    case 'SET_STAT':
      newState.player = {
        ...newState.player,
        stats: {
          ...newState.player.stats,
          [command.stat]: command.value,
        },
      };
      output = `Set ${command.stat} to ${command.value}`;
      break;
      
    case 'TELEPORT':
      if (newState.locations[command.location]) {
        newState.player = {
          ...newState.player,
          currentLocation: command.location,
        };
        output = `Teleported to ${newState.locations[command.location].name}`;
      } else {
        output = `Unknown location: ${command.location}`;
      }
      break;
      
    case 'SET_RELATIONSHIP':
      if (newState.npcs[command.npcId]) {
        const npc = newState.npcs[command.npcId];
        newState.npcs = {
          ...newState.npcs,
          [command.npcId]: {
            ...npc,
            relationships: {
              ...npc.relationships,
              player: {
                ...npc.relationships.player,
                [command.field]: command.value,
              },
            },
          },
        };
        output = `Set ${command.npcId} ${command.field} to ${command.value}`;
      }
      break;
      
    case 'DUMP_STATE':
      console.log('Game State Dump:', newState);
      output = 'State dumped to console';
      break;
      
    case 'RESET_NPC':
      if (newState.npcs[command.npcId]) {
        const npc = newState.npcs[command.npcId];
        newState.npcs = {
          ...newState.npcs,
          [command.npcId]: {
            ...npc,
            stressLevel: 0,
            escalationState: 'POLITE_DISTANCE',
            emotionalState: {
              ...npc.emotionalState,
              current: npc.emotionalState.baseline,
            },
            memory: [],
          },
        };
        output = `Reset ${npc.meta.name} to baseline`;
      }
      break;
      
    default:
      output = 'Unknown debug command';
  }
  
  return { newState, output };
}

export function parseDebugInput(input: string): DebugCommand | null {
  const parts = input.toLowerCase().split(' ');
  const cmd = parts[0];
  
  switch (cmd) {
    case 'time':
      return { type: 'SET_TIME', hour: parseInt(parts[1]) || 12 };
    case 'health':
    case 'energy':
    case 'mood':
    case 'hunger':
      return { type: 'SET_STAT', stat: cmd as any, value: parseInt(parts[1]) || 100 };
    case 'tp':
    case 'teleport':
      return { type: 'TELEPORT', location: parts[1] || '' };
    case 'dump':
      return { type: 'DUMP_STATE' };
    case 'reset':
      return { type: 'RESET_NPC', npcId: parts[1] || '' };
    default:
      return null;
  }
}

// ============= GAME SETTINGS =============

export interface GameSettings {
  narratorVoice: NarratorVoice;
  textSpeed: 'instant' | 'fast' | 'normal' | 'slow';
  autoSaveInterval: number; // in ticks, 0 = disabled
  showHints: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  volume: number;
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
}

export function getDefaultSettings(): GameSettings {
  return {
    narratorVoice: 'LITERARY',
    textSpeed: 'normal',
    autoSaveInterval: 24, // Every in-game day
    showHints: true,
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.7,
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
  };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem('living_world_rpg_settings', JSON.stringify(settings));
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem('living_world_rpg_settings');
    return raw ? { ...getDefaultSettings(), ...JSON.parse(raw) } : getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
}

// ============= SIMULATION DEPTH DISPLAY =============

export interface SimulationStats {
  totalNPCs: number;
  activeNPCs: number;
  totalMemories: number;
  totalRelationships: number;
  worldEventsThisTick: number;
  averageNPCStress: number;
  averageNeedSatisfaction: number;
  pendingConsequences: number;
  activeRumors: number;
}

export function calculateSimulationStats(state: GameState): SimulationStats {
  const npcs = Object.values(state.npcs);
  
  let totalMemories = 0;
  let totalRelationships = 0;
  let totalStress = 0;
  let totalNeeds = 0;
  let needCount = 0;
  
  npcs.forEach(npc => {
    totalMemories += npc.memory.length;
    totalRelationships += Object.keys(npc.relationships).length;
    totalStress += npc.stressLevel;
    npc.needs.forEach(need => {
      totalNeeds += need.satisfaction;
      needCount++;
    });
  });
  
  return {
    totalNPCs: npcs.length,
    activeNPCs: npcs.filter(npc => npc.currentActivity !== 'sleeping').length,
    totalMemories,
    totalRelationships,
    worldEventsThisTick: state.worldEvents?.filter(e => e.tick === state.time.tick).length || 0,
    averageNPCStress: npcs.length > 0 ? Math.round(totalStress / npcs.length) : 0,
    averageNeedSatisfaction: needCount > 0 ? Math.round(totalNeeds / needCount) : 0,
    pendingConsequences: 0, // Would be filled by consequence system
    activeRumors: state.worldEvents?.filter(e => e.type === 'social').length || 0,
  };
}

export function formatSimulationStats(stats: SimulationStats): string {
  return `
**Simulation Depth**
• NPCs Active: ${stats.activeNPCs}/${stats.totalNPCs}
• Total Memories: ${stats.totalMemories}
• Relationships Tracked: ${stats.totalRelationships}
• World Events This Tick: ${stats.worldEventsThisTick}
• Average NPC Stress: ${stats.averageNPCStress}%
• Average Need Satisfaction: ${stats.averageNeedSatisfaction}%
• Active Rumors: ${stats.activeRumors}
`.trim();
}

// ============= GAME STATE EXPORT/IMPORT =============

export function exportGameState(state: GameState): string {
  const exportData = {
    version: SAVE_VERSION,
    exportedAt: new Date().toISOString(),
    gameState: state,
  };
  
  return btoa(JSON.stringify(exportData));
}

export function importGameState(encoded: string): GameState | null {
  try {
    const decoded = atob(encoded);
    const data = JSON.parse(decoded);
    
    if (!data.gameState) return null;
    
    return data.gameState;
  } catch {
    return null;
  }
}

// ============= NPC DEBUG INFO =============

export interface NPCDebugInfo {
  name: string;
  location: string;
  activity: string;
  stressLevel: number;
  escalationState: string;
  conflictStyle: string;
  currentEmotion: string;
  lowestNeed: { type: string; satisfaction: number };
  recentMemories: string[];
  playerRelation: {
    trust: number;
    affection: number;
    fear: number;
    respect: number;
  };
}

export function getNPCDebugInfo(npc: NPC): NPCDebugInfo {
  const lowestNeed = npc.needs.reduce((lowest, current) =>
    current.satisfaction < lowest.satisfaction ? current : lowest
  );
  
  return {
    name: npc.meta.name,
    location: npc.currentLocation,
    activity: npc.currentActivity,
    stressLevel: npc.stressLevel,
    escalationState: npc.escalationState,
    conflictStyle: npc.conflictStyle,
    currentEmotion: npc.emotionalState.current,
    lowestNeed: { type: lowestNeed.type, satisfaction: lowestNeed.satisfaction },
    recentMemories: npc.memory.slice(-3).map(m => m.event),
    playerRelation: npc.relationships.player || { trust: 0, affection: 0, fear: 0, respect: 0 },
  };
}

export function formatNPCDebugInfo(info: NPCDebugInfo): string {
  return `
**${info.name}**
Location: ${info.location} | Activity: ${info.activity}
Stress: ${info.stressLevel}% | Escalation: ${info.escalationState}
Conflict Style: ${info.conflictStyle} | Emotion: ${info.currentEmotion}
Lowest Need: ${info.lowestNeed.type} (${info.lowestNeed.satisfaction}%)
Player Relations: Trust ${info.playerRelation.trust}, Affection ${info.playerRelation.affection}
Recent Memories: ${info.recentMemories.length > 0 ? info.recentMemories.join('; ') : 'None'}
`.trim();
}
