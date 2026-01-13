// ============================================================================
// GAME SAVES HOOK - High-level save slot management
// ============================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { SaveSystem } from '@/systems/SaveSystem';
import { CampaignData, CampaignMetadata } from '@/types/campaign';

const SAVES_INDEX_KEY = 'lwe_saves_index';
const SAVE_PREFIX = 'lwe_save_';
const MAX_SAVES = 20;

export interface SaveSlot {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  playTime: number;
  chapter: number;
  preview: SavePreview;
}

export interface SavePreview {
  characterName: string;
  characterLevel: number;
  genre: string;
  location?: string;
}

export interface SaveMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  playTime: number;
  chapter: number;
  characterName: string;
}

interface UseGameSavesReturn {
  saves: SaveSlot[];
  currentSaveId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  createSave: (name: string, data: CampaignData) => Promise<string | null>;
  loadSave: (id: string) => Promise<CampaignData | null>;
  deleteSave: (id: string) => Promise<boolean>;
  renameSave: (id: string, newName: string) => Promise<boolean>;
  duplicateSave: (id: string, newName?: string) => Promise<string | null>;
  
  // Import/Export
  exportSave: (id: string) => string | null;
  importSave: (json: string) => Promise<string | null>;
  exportAllSaves: () => string;
  
  // Utilities
  getAllSavesMeta: () => SaveMeta[];
  setCurrentSaveId: (id: string | null) => void;
  refreshSaves: () => Promise<void>;
}

function campaignToPreview(campaign: CampaignData): SavePreview {
  return {
    characterName: campaign.player?.name || 'Unknown',
    characterLevel: campaign.player?.level || 1,
    genre: campaign.meta?.primaryGenre || 'unknown',
    location: campaign.scenario?.substring(0, 50),
  };
}

function metaToSlot(meta: SaveMeta): SaveSlot {
  return {
    id: meta.id,
    name: meta.name,
    createdAt: new Date(meta.createdAt),
    updatedAt: new Date(meta.updatedAt),
    playTime: meta.playTime,
    chapter: meta.chapter,
    preview: {
      characterName: meta.characterName,
      characterLevel: 1,
      genre: 'unknown',
    },
  };
}

export function useGameSaves(): UseGameSavesReturn {
  const [saves, setSaves] = useState<SaveSlot[]>([]);
  const [currentSaveId, setCurrentSaveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMountedRef = useRef(true);
  
  // Load saves index
  const loadSavesIndex = useCallback(async (): Promise<SaveMeta[]> => {
    try {
      const index = await SaveSystem.load<SaveMeta[]>(SAVES_INDEX_KEY);
      return index || [];
    } catch {
      return [];
    }
  }, []);
  
  // Save saves index
  const saveSavesIndex = useCallback(async (index: SaveMeta[]): Promise<boolean> => {
    return SaveSystem.saveImmediate(SAVES_INDEX_KEY, index);
  }, []);
  
  // Refresh saves list
  const refreshSaves = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const index = await loadSavesIndex();
      const slots = index.map(metaToSlot);
      
      if (isMountedRef.current) {
        setSaves(slots);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [loadSavesIndex]);
  
  // Load on mount
  useEffect(() => {
    isMountedRef.current = true;
    refreshSaves();
    
    return () => {
      isMountedRef.current = false;
    };
  }, [refreshSaves]);
  
  // Create save
  const createSave = useCallback(async (name: string, data: CampaignData): Promise<string | null> => {
    try {
      const index = await loadSavesIndex();
      
      if (index.length >= MAX_SAVES) {
        setError(`Maximum ${MAX_SAVES} saves reached`);
        return null;
      }
      
      const saveId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = Date.now();
      
      const meta: SaveMeta = {
        id: saveId,
        name,
        createdAt: now,
        updatedAt: now,
        playTime: data.meta?.playTime || 0,
        chapter: data.currentChapter?.number || 1,
        characterName: data.player?.name || 'Unknown',
      };
      
      // Save the data
      const saveKey = `${SAVE_PREFIX}${saveId}`;
      const success = await SaveSystem.saveImmediate(saveKey, data);
      
      if (!success) {
        setError('Failed to save game data');
        return null;
      }
      
      // Update index
      index.push(meta);
      await saveSavesIndex(index);
      
      await refreshSaves();
      setCurrentSaveId(saveId);
      
      return saveId;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [loadSavesIndex, saveSavesIndex, refreshSaves]);
  
  // Load save
  const loadSave = useCallback(async (id: string): Promise<CampaignData | null> => {
    try {
      const saveKey = `${SAVE_PREFIX}${id}`;
      const data = await SaveSystem.load<CampaignData>(saveKey);
      
      if (data) {
        setCurrentSaveId(id);
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);
  
  // Delete save
  const deleteSave = useCallback(async (id: string): Promise<boolean> => {
    try {
      const saveKey = `${SAVE_PREFIX}${id}`;
      await SaveSystem.delete(saveKey);
      
      const index = await loadSavesIndex();
      const filtered = index.filter(m => m.id !== id);
      await saveSavesIndex(filtered);
      
      await refreshSaves();
      
      if (currentSaveId === id) {
        setCurrentSaveId(null);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [loadSavesIndex, saveSavesIndex, refreshSaves, currentSaveId]);
  
  // Rename save
  const renameSave = useCallback(async (id: string, newName: string): Promise<boolean> => {
    try {
      const index = await loadSavesIndex();
      const meta = index.find(m => m.id === id);
      
      if (!meta) {
        setError('Save not found');
        return false;
      }
      
      meta.name = newName;
      meta.updatedAt = Date.now();
      
      await saveSavesIndex(index);
      await refreshSaves();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    }
  }, [loadSavesIndex, saveSavesIndex, refreshSaves]);
  
  // Duplicate save
  const duplicateSave = useCallback(async (id: string, newName?: string): Promise<string | null> => {
    try {
      const data = await loadSave(id);
      if (!data) {
        setError('Source save not found');
        return null;
      }
      
      const index = await loadSavesIndex();
      const originalMeta = index.find(m => m.id === id);
      const name = newName || `${originalMeta?.name || 'Save'} (Copy)`;
      
      return createSave(name, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [loadSave, loadSavesIndex, createSave]);
  
  // Export save
  const exportSave = useCallback((id: string): string | null => {
    try {
      const saveKey = `${SAVE_PREFIX}${id}`;
      const raw = localStorage.getItem(saveKey);
      
      if (!raw) {
        setError('Save not found');
        return null;
      }
      
      return JSON.stringify({
        _exportedAt: new Date().toISOString(),
        _type: 'game_save',
        data: JSON.parse(raw),
      }, null, 2);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, []);
  
  // Import save
  const importSave = useCallback(async (json: string): Promise<string | null> => {
    try {
      const parsed = JSON.parse(json);
      const data = parsed.data?.data || parsed.data || parsed;
      
      if (!data || typeof data !== 'object') {
        setError('Invalid save data');
        return null;
      }
      
      const name = data.meta?.name || 'Imported Save';
      return createSave(`${name} (Imported)`, data as CampaignData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [createSave]);
  
  // Export all saves
  const exportAllSaves = useCallback((): string => {
    const allSaves: Record<string, unknown> = {};
    
    saves.forEach(slot => {
      const saveKey = `${SAVE_PREFIX}${slot.id}`;
      const raw = localStorage.getItem(saveKey);
      if (raw) {
        try {
          allSaves[slot.id] = JSON.parse(raw);
        } catch {
          allSaves[slot.id] = raw;
        }
      }
    });
    
    return JSON.stringify({
      _exportedAt: new Date().toISOString(),
      _type: 'all_saves',
      _count: Object.keys(allSaves).length,
      saves: allSaves,
    }, null, 2);
  }, [saves]);
  
  // Get all saves meta
  const getAllSavesMeta = useCallback((): SaveMeta[] => {
    return saves.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt.getTime(),
      updatedAt: s.updatedAt.getTime(),
      playTime: s.playTime,
      chapter: s.chapter,
      characterName: s.preview.characterName,
    }));
  }, [saves]);
  
  return {
    saves,
    currentSaveId,
    isLoading,
    error,
    createSave,
    loadSave,
    deleteSave,
    renameSave,
    duplicateSave,
    exportSave,
    importSave,
    exportAllSaves,
    getAllSavesMeta,
    setCurrentSaveId,
    refreshSaves,
  };
}

export default useGameSaves;
