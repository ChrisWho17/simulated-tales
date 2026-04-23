// ============================================================================
// CROSS-TAB SYNC - BroadcastChannel-based coordination to prevent save conflicts
// ============================================================================

export type TabRole = 'primary' | 'secondary' | 'unknown';
export type SyncEventType = 
  | 'TAB_OPENED'
  | 'TAB_CLOSED'
  | 'TAB_HEARTBEAT'
  | 'SAVE_STARTED'
  | 'SAVE_COMPLETED'
  | 'CAMPAIGN_LOADED'
  | 'CAMPAIGN_DELETED'
  | 'REQUEST_PRIMARY'
  | 'YIELD_PRIMARY';

export interface SyncMessage {
  type: SyncEventType;
  tabId: string;
  timestamp: number;
  data?: {
    campaignId?: string;
    campaignName?: string;
    role?: TabRole;
  };
}

export interface TabInfo {
  id: string;
  role: TabRole;
  lastSeen: number;
  activeCampaignId: string | null;
  activeCampaignName: string | null;
}

export interface ConflictWarning {
  type: 'save_blocked' | 'campaign_in_use' | 'stale_data';
  message: string;
  otherTabId: string;
  campaignId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CHANNEL_NAME = 'untold-stories-sync';
const HEARTBEAT_INTERVAL_MS = 5000; // 5 seconds
const TAB_TIMEOUT_MS = 15000; // 15 seconds = considered dead
const TAB_ID_KEY = 'lwe_tab_id';

// ============================================================================
// CROSS-TAB SYNC CLASS
// ============================================================================

class CrossTabSyncClass {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private role: TabRole = 'unknown';
  private activeCampaignId: string | null = null;
  private activeCampaignName: string | null = null;
  private knownTabs: Map<string, TabInfo> = new Map();
  private heartbeatInterval: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  // Callbacks
  private conflictCallbacks: Set<(warning: ConflictWarning) => void> = new Set();
  private roleChangeCallbacks: Set<(role: TabRole) => void> = new Set();
  private tabCountCallbacks: Set<(count: number) => void> = new Set();

  constructor() {
    this.tabId = this.generateTabId();
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  initialize(): boolean {
    if (this.initialized) return true;

    // Check BroadcastChannel support
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[CrossTabSync] BroadcastChannel not supported');
      this.role = 'primary'; // Assume primary if no sync available
      return false;
    }

    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => this.handleMessage(event.data as SyncMessage);

      // Announce presence
      this.broadcast({ type: 'TAB_OPENED' });

      // Start heartbeat
      this.startHeartbeat();

      // Request primary role if no other tabs respond
      setTimeout(() => this.requestPrimaryRole(), 500);

      // Handle tab close
      window.addEventListener('beforeunload', () => this.handleTabClose());

      this.initialized = true;
      console.log(`[CrossTabSync] Initialized with tab ID: ${this.tabId}`);
      return true;
    } catch (e) {
      console.error('[CrossTabSync] Failed to initialize:', e);
      this.role = 'primary';
      return false;
    }
  }

  shutdown(): void {
    this.handleTabClose();
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.initialized = false;
  }

  private generateTabId(): string {
    // Try to reuse tab ID from sessionStorage (same tab, page refresh)
    try {
      let id = sessionStorage.getItem(TAB_ID_KEY);
      if (!id) {
        id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(TAB_ID_KEY, id);
      }
      return id;
    } catch {
      return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  // ============================================================================
  // MESSAGING
  // ============================================================================

  private broadcast(message: Omit<SyncMessage, 'tabId' | 'timestamp'>): void {
    if (!this.channel) return;

    const fullMessage: SyncMessage = {
      ...message,
      tabId: this.tabId,
      timestamp: Date.now(),
      data: {
        ...message.data,
        role: this.role,
        campaignId: this.activeCampaignId || undefined,
        campaignName: this.activeCampaignName || undefined,
      },
    };

    try {
      this.channel.postMessage(fullMessage);
    } catch (e) {
      console.error('[CrossTabSync] Broadcast failed:', e);
    }
  }

  private handleMessage(message: SyncMessage): void {
    // Ignore our own messages
    if (message.tabId === this.tabId) return;

    // Update known tabs
    this.updateKnownTab(message);

    switch (message.type) {
      case 'TAB_OPENED':
        this.handleTabOpened(message);
        break;
      case 'TAB_CLOSED':
        this.handleTabClosed(message);
        break;
      case 'TAB_HEARTBEAT':
        // Already updated in updateKnownTab
        break;
      case 'SAVE_STARTED':
        this.handleSaveStarted(message);
        break;
      case 'SAVE_COMPLETED':
        this.handleSaveCompleted(message);
        break;
      case 'CAMPAIGN_LOADED':
        this.handleCampaignLoaded(message);
        break;
      case 'CAMPAIGN_DELETED':
        this.handleCampaignDeleted(message);
        break;
      case 'REQUEST_PRIMARY':
        this.handlePrimaryRequest(message);
        break;
      case 'YIELD_PRIMARY':
        this.handlePrimaryYield(message);
        break;
    }
  }

  private updateKnownTab(message: SyncMessage): void {
    const tabInfo: TabInfo = {
      id: message.tabId,
      role: message.data?.role || 'unknown',
      lastSeen: message.timestamp,
      activeCampaignId: message.data?.campaignId || null,
      activeCampaignName: message.data?.campaignName || null,
    };
    this.knownTabs.set(message.tabId, tabInfo);
    this.notifyTabCountChange();
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  private handleTabOpened(message: SyncMessage): void {
    console.log(`[CrossTabSync] New tab detected: ${message.tabId}`);
    
    // If we're primary, respond with heartbeat so new tab knows
    if (this.role === 'primary') {
      this.broadcast({ type: 'TAB_HEARTBEAT' });
    }
  }

  private handleTabClosed(message: SyncMessage): void {
    console.log(`[CrossTabSync] Tab closed: ${message.tabId}`);
    this.knownTabs.delete(message.tabId);
    this.notifyTabCountChange();

    // If primary closed, try to become primary
    if (message.data?.role === 'primary') {
      setTimeout(() => this.requestPrimaryRole(), 100);
    }
  }

  private handleTabClose(): void {
    this.broadcast({ type: 'TAB_CLOSED' });
  }

  private handleSaveStarted(message: SyncMessage): void {
    // Check if we're also working on the same campaign
    if (this.activeCampaignId === message.data?.campaignId) {
      this.notifyConflict({
        type: 'save_blocked',
        message: `Another tab is saving "${message.data?.campaignName || 'this campaign'}". Wait for it to complete.`,
        otherTabId: message.tabId,
        campaignId: message.data?.campaignId,
      });
    }
  }

  private handleSaveCompleted(message: SyncMessage): void {
    // If we have the same campaign loaded, warn about stale data
    if (this.activeCampaignId === message.data?.campaignId) {
      this.notifyConflict({
        type: 'stale_data',
        message: `"${message.data?.campaignName || 'This campaign'}" was saved in another tab. Reload to see changes.`,
        otherTabId: message.tabId,
        campaignId: message.data?.campaignId,
      });
    }
  }

  private handleCampaignLoaded(message: SyncMessage): void {
    // Check if we also have this campaign loaded
    if (this.activeCampaignId === message.data?.campaignId) {
      this.notifyConflict({
        type: 'campaign_in_use',
        message: `"${message.data?.campaignName || 'This campaign'}" is now open in another tab. Be careful of conflicts!`,
        otherTabId: message.tabId,
        campaignId: message.data?.campaignId,
      });
    }
  }

  private handleCampaignDeleted(message: SyncMessage): void {
    if (this.activeCampaignId === message.data?.campaignId) {
      this.notifyConflict({
        type: 'stale_data',
        message: `"${message.data?.campaignName || 'This campaign'}" was deleted in another tab!`,
        otherTabId: message.tabId,
        campaignId: message.data?.campaignId,
      });
    }
  }

  private handlePrimaryRequest(message: SyncMessage): void {
    // If we're already primary, don't yield
    if (this.role === 'primary') {
      this.broadcast({ type: 'TAB_HEARTBEAT' });
    }
  }

  private handlePrimaryYield(message: SyncMessage): void {
    // Another tab yielded primary, we can claim it
    if (this.role !== 'primary') {
      this.requestPrimaryRole();
    }
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  private requestPrimaryRole(): void {
    // Check if any known tab is primary
    const primaryExists = Array.from(this.knownTabs.values()).some(
      tab => tab.role === 'primary' && Date.now() - tab.lastSeen < TAB_TIMEOUT_MS
    );

    if (!primaryExists) {
      this.role = 'primary';
      this.broadcast({ type: 'TAB_HEARTBEAT' });
      this.notifyRoleChange();
      console.log('[CrossTabSync] Became primary tab');
    } else {
      this.role = 'secondary';
      this.notifyRoleChange();
      console.log('[CrossTabSync] Became secondary tab');
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      // Send heartbeat
      this.broadcast({ type: 'TAB_HEARTBEAT' });

      // Clean up stale tabs
      const now = Date.now();
      for (const [tabId, info] of this.knownTabs.entries()) {
        if (now - info.lastSeen > TAB_TIMEOUT_MS) {
          this.knownTabs.delete(tabId);
          console.log(`[CrossTabSync] Tab timed out: ${tabId}`);
          
          // If primary timed out, try to become primary
          if (info.role === 'primary') {
            this.requestPrimaryRole();
          }
        }
      }
      this.notifyTabCountChange();
    }, HEARTBEAT_INTERVAL_MS);
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  getTabId(): string {
    return this.tabId;
  }

  getRole(): TabRole {
    return this.role;
  }

  isPrimary(): boolean {
    return this.role === 'primary';
  }

  getTabCount(): number {
    return this.knownTabs.size + 1; // Include self
  }

  getActiveTabs(): TabInfo[] {
    return [
      {
        id: this.tabId,
        role: this.role,
        lastSeen: Date.now(),
        activeCampaignId: this.activeCampaignId,
        activeCampaignName: this.activeCampaignName,
      },
      ...Array.from(this.knownTabs.values()),
    ];
  }

  // Notify other tabs about campaign actions
  notifyCampaignLoaded(campaignId: string, campaignName: string): void {
    this.activeCampaignId = campaignId;
    this.activeCampaignName = campaignName;
    this.broadcast({ type: 'CAMPAIGN_LOADED' });
  }

  notifySaveStarted(campaignId: string, campaignName: string): void {
    this.activeCampaignId = campaignId;
    this.activeCampaignName = campaignName;
    this.broadcast({ type: 'SAVE_STARTED' });
  }

  notifySaveCompleted(campaignId: string, campaignName: string): void {
    this.broadcast({ type: 'SAVE_COMPLETED', data: { campaignId, campaignName } });
  }

  notifyCampaignDeleted(campaignId: string, campaignName: string): void {
    this.broadcast({ type: 'CAMPAIGN_DELETED', data: { campaignId, campaignName } });
  }

  // Check if it's safe to save
  canSaveCampaign(campaignId: string): { allowed: boolean; reason?: string } {
    // Check if another tab is actively working on this campaign
    for (const tab of this.knownTabs.values()) {
      if (tab.activeCampaignId === campaignId && Date.now() - tab.lastSeen < TAB_TIMEOUT_MS) {
        return {
          allowed: false,
          reason: `Campaign is open in another tab. Close it first to avoid conflicts.`,
        };
      }
    }
    return { allowed: true };
  }

  // ============================================================================
  // CALLBACKS
  // ============================================================================

  onConflict(callback: (warning: ConflictWarning) => void): () => void {
    this.conflictCallbacks.add(callback);
    return () => this.conflictCallbacks.delete(callback);
  }

  onRoleChange(callback: (role: TabRole) => void): () => void {
    this.roleChangeCallbacks.add(callback);
    callback(this.role); // Send current role immediately
    return () => this.roleChangeCallbacks.delete(callback);
  }

  onTabCountChange(callback: (count: number) => void): () => void {
    this.tabCountCallbacks.add(callback);
    callback(this.getTabCount()); // Send current count immediately
    return () => this.tabCountCallbacks.delete(callback);
  }

  private notifyConflict(warning: ConflictWarning): void {
    console.warn(`[CrossTabSync] Conflict: ${warning.message}`);
    this.conflictCallbacks.forEach(cb => cb(warning));
  }

  private notifyRoleChange(): void {
    this.roleChangeCallbacks.forEach(cb => cb(this.role));
  }

  private notifyTabCountChange(): void {
    const count = this.getTabCount();
    this.tabCountCallbacks.forEach(cb => cb(count));
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const CrossTabSync = new CrossTabSyncClass();

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  CrossTabSync.initialize();
}
