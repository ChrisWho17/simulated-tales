// ============================================================================
// SAVE SYSTEM - Auto-save with dated saves and character names
// Campaign-specific saves (1 auto + 1 manual per campaign/character)
// ============================================================================

import { CampaignMemoryStore } from '@/types/campaignMemory';
import { serializeCampaignMemory, deserializeCampaignMemory } from '@/game/campaignMemorySystem';

export interface GameSave {
  id: string;
  characterName: string;
  timestamp: number;
  dateFormatted: string;
  slotNumber: number;
  gameData: unknown; // The actual game state - typed loosely for flexibility
  campaignMemory?: string; // Serialized campaign memory (optional for backward compat)
}

const SAVES_KEY = 'untold-game-saves';

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
// GET SAVES FOR CHARACTER (campaign-specific)
// ============================================================================

export function getSavesForCharacter(characterName: string): { autoSave: GameSave | null; manualSave: GameSave | null } {
  const saves = loadAllSaves();
  const normalizedName = characterName.toLowerCase().trim();
  
  const autoSave = saves.find(s => s.id === `auto-${normalizedName}`) || null;
  const manualSave = saves.find(s => s.id === `manual-${normalizedName}`) || null;
  
  return { autoSave, manualSave };
}

// ============================================================================
// SAVE GAME (Campaign-specific: overwrites existing save for same character)
// ============================================================================

export function saveGame(
  characterName: string, 
  gameData: unknown, 
  isAutoSave: boolean = false,
  campaignMemory?: CampaignMemoryStore
): GameSave {
  const saves = loadAllSaves();
  const now = Date.now();
  const normalizedName = (characterName || 'Unknown Hero').toLowerCase().trim();
  
  // Format the date nicely
  const dateFormatted = formatSaveDate(now);
  
  // Create campaign-specific save ID (overwrites previous for same character)
  const saveId = isAutoSave 
    ? `auto-${normalizedName}` 
    : `manual-${normalizedName}`;
  
  const newSave: GameSave = {
    id: saveId,
    characterName: characterName || 'Unknown Hero',
    timestamp: now,
    dateFormatted,
    slotNumber: isAutoSave ? -1 : 1,
    gameData,
    campaignMemory: campaignMemory ? serializeCampaignMemory(campaignMemory) : undefined,
  };
  
  // Remove existing save for this campaign (character) if it exists
  const filteredSaves = saves.filter(s => s.id !== saveId);
  
  // Add the new save
  const updatedSaves = [...filteredSaves, newSave]
    .sort((a, b) => b.timestamp - a.timestamp);
  
  savesToStorage(updatedSaves);
  return newSave;
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
// LOAD CAMPAIGN MEMORY FROM SAVE
// ============================================================================

export function loadCampaignMemoryFromSave(save: GameSave): CampaignMemoryStore | null {
  if (!save.campaignMemory) return null;
  return deserializeCampaignMemory(save.campaignMemory);
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
// GET ALL CHARACTER CAMPAIGNS
// ============================================================================

export function getAllCharacterCampaigns(): string[] {
  const saves = loadAllSaves();
  const characters = new Set<string>();
  
  for (const save of saves) {
    characters.add(save.characterName);
  }
  
  return Array.from(characters);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function savesToStorage(saves: GameSave[]): void {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
  } catch (e) {
    // Handle quota exceeded by trying to clean up old saves
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting cleanup...');
      
      // Keep only the most recent 5 saves and try again
      const trimmedSaves = saves
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
      
      try {
        localStorage.setItem(SAVES_KEY, JSON.stringify(trimmedSaves));
        console.log('Successfully saved after trimming old saves');
      } catch (e2) {
        // If still failing, clear other non-critical localStorage items
        console.error('Still cannot save after trimming, clearing old localStorage...');
        
        // Clear potentially large legacy keys
        const keysToTry = [
          'untold-adventure-story',
          'simtales_campaign_index', 
        ];
        for (const key of keysToTry) {
          try {
            const item = localStorage.getItem(key);
            if (item && item.length > 10000) {
              localStorage.removeItem(key);
              console.log(`Cleared large item: ${key}`);
            }
          } catch {}
        }
        
        // One last attempt
        try {
          localStorage.setItem(SAVES_KEY, JSON.stringify(trimmedSaves.slice(0, 3)));
        } catch (e3) {
          console.error('Failed to save games even after cleanup:', e3);
        }
      }
    } else {
      console.error('Failed to save games:', e);
    }
  }
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
