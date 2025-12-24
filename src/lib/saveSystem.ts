// ============================================================================
// SAVE SYSTEM - Auto-save with dated saves and character names
// ============================================================================

export interface GameSave {
  id: string;
  characterName: string;
  timestamp: number;
  dateFormatted: string;
  slotNumber: number;
  gameData: unknown; // The actual game state - typed loosely for flexibility
}

const SAVES_KEY = 'untold-game-saves';
const MAX_AUTO_SAVES = 5;
const MAX_MANUAL_SAVES = 10;

// ============================================================================
// LOAD SAVES
// ============================================================================

export function loadAllSaves(): GameSave[] {
  try {
    const saved = localStorage.getItem(SAVES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load saves:', e);
  }
  return [];
}

// ============================================================================
// SAVE GAME
// ============================================================================

export function saveGame(
  characterName: string, 
  gameData: unknown, 
  isAutoSave: boolean = false
): GameSave {
  const saves = loadAllSaves();
  const now = Date.now();
  
  // Format the date nicely
  const dateFormatted = formatSaveDate(now);
  
  const newSave: GameSave = {
    id: isAutoSave ? `auto-${now}` : `manual-${now}`,
    characterName: characterName || 'Unknown Hero',
    timestamp: now,
    dateFormatted,
    slotNumber: isAutoSave ? -1 : getNextSlotNumber(saves),
    gameData
  };
  
  // Handle auto-save rotation
  if (isAutoSave) {
    const autoSaves = saves.filter(s => s.id.startsWith('auto-'));
    const manualSaves = saves.filter(s => s.id.startsWith('manual-'));
    
    // Keep only the most recent auto-saves
    const sortedAutoSaves = [...autoSaves, newSave]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_AUTO_SAVES);
    
    const allSaves = [...manualSaves, ...sortedAutoSaves];
    savesToStorage(allSaves);
    return newSave;
  } else {
    // Manual save - add to list, enforce max limit
    const updatedSaves = [...saves, newSave]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_AUTO_SAVES + MAX_MANUAL_SAVES);
    
    savesToStorage(updatedSaves);
    return newSave;
  }
}

// ============================================================================
// DELETE SAVE
// ============================================================================

export function deleteSave(saveId: string): void {
  const saves = loadAllSaves();
  const filtered = saves.filter(s => s.id !== saveId);
  savesToStorage(filtered);
}

// ============================================================================
// LOAD SPECIFIC SAVE
// ============================================================================

export function loadSave(saveId: string): GameSave | null {
  const saves = loadAllSaves();
  return saves.find(s => s.id === saveId) || null;
}

// ============================================================================
// GET MOST RECENT SAVE
// ============================================================================

export function getMostRecentSave(): GameSave | null {
  const saves = loadAllSaves();
  if (saves.length === 0) return null;
  
  return saves.sort((a, b) => b.timestamp - a.timestamp)[0];
}

// ============================================================================
// GET AUTO SAVES
// ============================================================================

export function getAutoSaves(): GameSave[] {
  const saves = loadAllSaves();
  return saves
    .filter(s => s.id.startsWith('auto-'))
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================================
// GET MANUAL SAVES
// ============================================================================

export function getManualSaves(): GameSave[] {
  const saves = loadAllSaves();
  return saves
    .filter(s => s.id.startsWith('manual-'))
    .sort((a, b) => b.timestamp - a.timestamp);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function savesToStorage(saves: GameSave[]): void {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  } catch (e) {
    console.error('Failed to save games:', e);
  }
}

function getNextSlotNumber(saves: GameSave[]): number {
  const manualSaves = saves.filter(s => s.id.startsWith('manual-'));
  if (manualSaves.length === 0) return 1;
  
  const maxSlot = Math.max(...manualSaves.map(s => s.slotNumber));
  return maxSlot + 1;
}

function formatSaveDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  // Time portion
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  // Date portion
  if (diffDays === 0) {
    if (diffHours === 0) {
      if (diffMins < 5) return `Just now`;
      return `${diffMins} minutes ago`;
    }
    return `Today at ${timeStr}`;
  } else if (diffDays === 1) {
    return `Yesterday at ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    return `${dayName} at ${timeStr}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    }) + ` at ${timeStr}`;
  }
}

// ============================================================================
// AUTO-SAVE INTERVAL HOOK
// ============================================================================

export function getAutoSaveInterval(): number {
  return 5 * 60 * 1000; // 5 minutes in milliseconds
}
