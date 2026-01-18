// ============================================================================
// AUTO-SAVE MANAGER - Automatic saving with triggers and rotation
// Integrated with UnifiedSaveArchitecture for cloud sync
// ============================================================================

import { SaveSystem } from './SaveSystem';
import { CampaignData } from '@/types/campaign';
import { UnifiedSaveArchitecture } from '@/services/unifiedSaveArchitecture';

const AUTO_SAVE_PREFIX = 'lwe_autosave_';
const AUTO_SAVE_SLOTS = 3;
const AUTO_SAVE_INTERVAL = 60000; // 60 seconds
const MIN_TIME_BETWEEN_SAVES = 30000; // 30 seconds

type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';
type AutoSaveCallback = (status: SaveStatus, error?: string) => void;

class AutoSaveManagerClass {
  private static instance: AutoSaveManagerClass;
  
  private isEnabled = true;
  private currentSlot = 0;
  private lastSaveTime = 0;
  private lastManualSaveTime = 0;
  private intervalId: NodeJS.Timeout | null = null;
  private campaignId: string | null = null;
  private getStateCallback: (() => CampaignData | null) | null = null;
  private hasUnsavedChanges = false;
  private isInCombat = false;
  private callbacks: AutoSaveCallback[] = [];
  
  private constructor() {
    // Setup beforeunload handler
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }
  
  static getInstance(): AutoSaveManagerClass {
    if (!AutoSaveManagerClass.instance) {
      AutoSaveManagerClass.instance = new AutoSaveManagerClass();
    }
    return AutoSaveManagerClass.instance;
  }
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  initialize(
    campaignId: string,
    getState: () => CampaignData | null,
    options?: { autoSaveInterval?: number }
  ): void {
    this.campaignId = campaignId;
    this.getStateCallback = getState;
    
    // Clear existing interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Determine which slot to use next
    this.determineNextSlot();
    
    // Start interval-based auto-save
    const interval = options?.autoSaveInterval || AUTO_SAVE_INTERVAL;
    this.intervalId = setInterval(() => {
      this.triggerAutoSave('interval');
    }, interval);
    
    console.log(`[AutoSave] Initialized for campaign ${campaignId}`);
  }
  
  shutdown(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Attempt final save
    if (this.hasUnsavedChanges) {
      this.triggerAutoSave('shutdown');
    }
    
    this.campaignId = null;
    this.getStateCallback = null;
    console.log('[AutoSave] Shutdown');
  }
  
  // ============================================================================
  // TRIGGERS
  // ============================================================================
  
  // Call when wave/chapter completes
  onWaveComplete(): void {
    this.triggerAutoSave('wave_complete');
  }
  
  // Call when player pauses game
  onGamePause(): void {
    this.triggerAutoSave('pause');
  }
  
  // Call when purchase/transaction completes
  onTransaction(): void {
    this.triggerAutoSave('transaction');
  }
  
  // Call when game state changes
  markDirty(): void {
    this.hasUnsavedChanges = true;
  }
  
  // Call when manual save completes
  onManualSave(): void {
    this.lastManualSaveTime = Date.now();
    this.hasUnsavedChanges = false;
  }
  
  // Call to set combat state
  setCombatState(inCombat: boolean): void {
    const wasInCombat = this.isInCombat;
    this.isInCombat = inCombat;
    
    // Auto-save when combat ends
    if (wasInCombat && !inCombat) {
      this.triggerAutoSave('combat_end');
    }
  }
  
  // ============================================================================
  // CORE AUTO-SAVE LOGIC
  // ============================================================================
  
  private async triggerAutoSave(reason: string): Promise<void> {
    // Skip if disabled or no state getter
    if (!this.isEnabled || !this.getStateCallback || !this.campaignId) {
      return;
    }
    
    // Skip if no changes
    if (!this.hasUnsavedChanges && reason !== 'shutdown') {
      return;
    }
    
    // Skip if in combat (except for shutdown)
    if (this.isInCombat && reason !== 'shutdown' && reason !== 'combat_end') {
      return;
    }
    
    // Skip if manual save happened recently (except for shutdown)
    if (reason !== 'shutdown') {
      const timeSinceManual = Date.now() - this.lastManualSaveTime;
      if (timeSinceManual < MIN_TIME_BETWEEN_SAVES) {
        return;
      }
    }
    
    // Skip if auto-save happened recently (except for shutdown)
    if (reason !== 'shutdown') {
      const timeSinceLast = Date.now() - this.lastSaveTime;
      if (timeSinceLast < MIN_TIME_BETWEEN_SAVES) {
        return;
      }
    }
    
    // Get current state
    const state = this.getStateCallback();
    if (!state) {
      return;
    }
    
    // Notify callbacks
    this.notifyCallbacks('saving');
    
    try {
      // Get auto-save key for current slot
      const saveKey = this.getAutoSaveKey(this.currentSlot);
      
      // Update campaign metadata
      const updatedState: CampaignData = {
        ...state,
        meta: {
          ...state.meta,
          updatedAt: Date.now(),
        },
      };
      
      // Wrap with metadata for slot-based auto-save
      const autoSaveData = {
        campaignId: this.campaignId,
        slot: this.currentSlot,
        reason,
        savedAt: new Date().toISOString(),
        campaign: updatedState,
      };
      
      // Save to local slot
      const localSuccess = await SaveSystem.saveImmediate(saveKey, autoSaveData);
      
      // Also save to UnifiedSaveArchitecture (handles both local main save AND cloud sync)
      const unifiedResult = await UnifiedSaveArchitecture.saveCampaign(updatedState);
      
      if (localSuccess || unifiedResult.success) {
        this.lastSaveTime = Date.now();
        this.hasUnsavedChanges = false;
        
        // Rotate to next slot
        this.currentSlot = (this.currentSlot + 1) % AUTO_SAVE_SLOTS;
        
        const cloudStatus = unifiedResult.syncedToCloud ? ' (synced to cloud)' : '';
        console.log(`[AutoSave] Saved to slot ${this.currentSlot} (reason: ${reason})${cloudStatus}`);
        this.notifyCallbacks('saved');
      } else {
        console.error('[AutoSave] Save failed');
        this.notifyCallbacks('failed', 'Save operation failed');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[AutoSave] Error:', msg);
      this.notifyCallbacks('failed', msg);
    }
  }
  
  // ============================================================================
  // SLOT MANAGEMENT
  // ============================================================================
  
  private getAutoSaveKey(slot: number): string {
    return `${AUTO_SAVE_PREFIX}${this.campaignId}_${slot}`;
  }
  
  private async determineNextSlot(): Promise<void> {
    let oldestTime = Infinity;
    let oldestSlot = 0;
    
    for (let i = 0; i < AUTO_SAVE_SLOTS; i++) {
      const key = this.getAutoSaveKey(i);
      const data = await SaveSystem.load<{ savedAt: string }>(key);
      
      if (!data) {
        // Empty slot - use this one
        this.currentSlot = i;
        return;
      }
      
      const time = new Date(data.savedAt).getTime();
      if (time < oldestTime) {
        oldestTime = time;
        oldestSlot = i;
      }
    }
    
    // Use oldest slot
    this.currentSlot = oldestSlot;
  }
  
  // ============================================================================
  // RECOVERY
  // ============================================================================
  
  async getAutoSaves(): Promise<Array<{
    slot: number;
    savedAt: Date;
    reason: string;
    campaign: CampaignData;
  }>> {
    if (!this.campaignId) return [];
    
    const saves: Array<{
      slot: number;
      savedAt: Date;
      reason: string;
      campaign: CampaignData;
    }> = [];
    
    for (let i = 0; i < AUTO_SAVE_SLOTS; i++) {
      const key = this.getAutoSaveKey(i);
      const data = await SaveSystem.load<{
        slot: number;
        savedAt: string;
        reason: string;
        campaign: CampaignData;
      }>(key);
      
      if (data) {
        saves.push({
          slot: data.slot,
          savedAt: new Date(data.savedAt),
          reason: data.reason,
          campaign: data.campaign,
        });
      }
    }
    
    // Sort by date, newest first
    saves.sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());
    
    return saves;
  }
  
  async getMostRecentAutoSave(): Promise<CampaignData | null> {
    const saves = await this.getAutoSaves();
    return saves.length > 0 ? saves[0].campaign : null;
  }
  
  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  
  private handleBeforeUnload(e: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      
      // Attempt emergency sync save
      if (this.getStateCallback && this.campaignId) {
        const state = this.getStateCallback();
        if (state) {
          try {
            // Sync save as last resort
            const key = `${AUTO_SAVE_PREFIX}${this.campaignId}_emergency`;
            localStorage.setItem(key, JSON.stringify({
              campaignId: this.campaignId,
              reason: 'emergency',
              savedAt: new Date().toISOString(),
              campaign: state,
            }));
            console.log('[AutoSave] Emergency save completed');
          } catch (err) {
            console.error('[AutoSave] Emergency save failed:', err);
          }
        }
      }
    }
  }
  
  private handleVisibilityChange(): void {
    if (document.hidden) {
      this.triggerAutoSave('visibility_hidden');
    }
  }
  
  // ============================================================================
  // CALLBACKS
  // ============================================================================
  
  private notifyCallbacks(status: SaveStatus, error?: string): void {
    this.callbacks.forEach(cb => cb(status, error));
  }
  
  onStatusChange(callback: AutoSaveCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }
  
  // ============================================================================
  // SETTINGS
  // ============================================================================
  
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`[AutoSave] ${enabled ? 'Enabled' : 'Disabled'}`);
  }
  
  isAutoSaveEnabled(): boolean {
    return this.isEnabled;
  }
  
  hasChanges(): boolean {
    return this.hasUnsavedChanges;
  }
  
  getLastSaveTime(): number {
    return this.lastSaveTime;
  }
}

export const AutoSaveManager = AutoSaveManagerClass.getInstance();
export default AutoSaveManager;
