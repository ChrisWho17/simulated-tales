// ============================================================================
// INVENTORY SYNC DEBUG LOGGER
// Logs all item additions, removals, and matching attempts to the backend
// Tagged with version and timestamp for troubleshooting
// ============================================================================

import { supabase } from '@/integrations/supabase/client';
import { APP_VERSION, BUILD_NUMBER } from '@/lib/version';
import type { Json } from '@/integrations/supabase/types';

// Generate a unique session ID for this browser session
const SESSION_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

// Log queue for batching writes
interface LogEntry {
  session_id: string;
  campaign_id: string | null;
  app_version: string;
  build_number: string;
  event_type: 'pickup' | 'drop' | 'consume' | 'loot_tag' | 'drop_tag' | 'use_tag' | 'match_attempt' | 'warning' | 'error';
  item_name: string | null;
  matched_to: string | null;
  instance_id: string | null;
  confidence: string | null;
  source: string | null;
  pattern_used: string | null;
  success: boolean;
  details: Json | null;
}

let logQueue: LogEntry[] = [];
let flushTimeout: ReturnType<typeof setTimeout> | null = null;
let currentCampaignId: string | null = null;

// Enable/disable logging (can be toggled for debugging)
let loggingEnabled = true;

/**
 * Set the current campaign ID for log context
 */
export function setLogCampaignId(campaignId: string | null): void {
  currentCampaignId = campaignId;
  console.log(`[InventorySyncLogger] Campaign ID set to: ${campaignId}`);
}

/**
 * Enable or disable inventory sync logging
 */
export function setLoggingEnabled(enabled: boolean): void {
  loggingEnabled = enabled;
  console.log(`[InventorySyncLogger] Logging ${enabled ? 'enabled' : 'disabled'}`);
}

/**
 * Get the current session ID
 */
export function getSessionId(): string {
  return SESSION_ID;
}

/**
 * Create a base log entry with common fields
 */
function createLogEntry(partial: Partial<LogEntry>): LogEntry {
  return {
    session_id: SESSION_ID,
    campaign_id: currentCampaignId,
    app_version: APP_VERSION,
    build_number: BUILD_NUMBER,
    event_type: partial.event_type || 'warning',
    item_name: partial.item_name || null,
    matched_to: partial.matched_to || null,
    instance_id: partial.instance_id || null,
    confidence: partial.confidence || null,
    source: partial.source || null,
    pattern_used: partial.pattern_used || null,
    success: partial.success ?? true,
    details: partial.details || null,
  };
}

/**
 * Queue a log entry for batch insertion
 */
function queueLog(entry: LogEntry): void {
  if (!loggingEnabled) return;
  
  logQueue.push(entry);
  
  // Flush after 2 seconds of no new logs, or immediately if queue gets large
  if (flushTimeout) {
    clearTimeout(flushTimeout);
  }
  
  if (logQueue.length >= 20) {
    flushLogs();
  } else {
    flushTimeout = setTimeout(flushLogs, 2000);
  }
}

/**
 * Flush all queued logs to the database
 */
async function flushLogs(): Promise<void> {
  if (logQueue.length === 0) return;
  
  const logsToFlush = [...logQueue];
  logQueue = [];
  
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  try {
    const { error } = await supabase
      .from('inventory_sync_logs')
      .insert(logsToFlush);
    
    if (error) {
      console.error('[InventorySyncLogger] Failed to flush logs:', error);
      // Re-queue failed logs (up to a limit)
      if (logQueue.length < 50) {
        logQueue.unshift(...logsToFlush);
      }
    } else {
      console.log(`[InventorySyncLogger] Flushed ${logsToFlush.length} log entries`);
    }
  } catch (err) {
    console.error('[InventorySyncLogger] Error flushing logs:', err);
  }
}

// ============================================================================
// PUBLIC LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an item pickup (from narrative parsing)
 */
export function logPickup(
  itemName: string,
  confidence: string,
  source: string,
  pattern?: string
): void {
  console.log(`[SYNC-LOG] Pickup: ${itemName} (${confidence} confidence, source: ${source})`);
  
  queueLog(createLogEntry({
    event_type: 'pickup',
    item_name: itemName,
    confidence,
    source,
    pattern_used: pattern || null,
    success: true,
  }));
}

/**
 * Log an item drop (from narrative parsing)
 */
export function logDrop(
  itemName: string,
  instanceId: string,
  confidence: string,
  pattern?: string
): void {
  console.log(`[SYNC-LOG] Drop: ${itemName} (instance: ${instanceId}, ${confidence} confidence)`);
  
  queueLog(createLogEntry({
    event_type: 'drop',
    item_name: itemName,
    instance_id: instanceId,
    confidence,
    pattern_used: pattern || null,
    success: true,
  }));
}

/**
 * Log an item consumption (from narrative parsing)
 */
export function logConsume(
  itemName: string,
  instanceId: string,
  confidence: string,
  pattern?: string
): void {
  console.log(`[SYNC-LOG] Consume: ${itemName} (instance: ${instanceId}, ${confidence} confidence)`);
  
  queueLog(createLogEntry({
    event_type: 'consume',
    item_name: itemName,
    instance_id: instanceId,
    confidence,
    pattern_used: pattern || null,
    success: true,
  }));
}

/**
 * Log an item added via [LOOT:] tag
 */
export function logLootTag(itemName: string, category: string): void {
  console.log(`[SYNC-LOG] Loot Tag: ${itemName} (category: ${category})`);
  
  queueLog(createLogEntry({
    event_type: 'loot_tag',
    item_name: itemName,
    source: 'mechanics_tag',
    success: true,
    details: { category },
  }));
}

/**
 * Log an item removed via [DROP:] tag
 */
export function logDropTag(itemName: string, matchedTo: string | null, instanceId: string | null): void {
  console.log(`[SYNC-LOG] Drop Tag: ${itemName} -> matched: ${matchedTo || 'NOT FOUND'}`);
  
  queueLog(createLogEntry({
    event_type: 'drop_tag',
    item_name: itemName,
    matched_to: matchedTo,
    instance_id: instanceId,
    source: 'mechanics_tag',
    success: !!matchedTo,
  }));
}

/**
 * Log an item consumed via [USE:] tag
 */
export function logUseTag(itemName: string, matchedTo: string | null, instanceId: string | null): void {
  console.log(`[SYNC-LOG] Use Tag: ${itemName} -> matched: ${matchedTo || 'NOT FOUND'}`);
  
  queueLog(createLogEntry({
    event_type: 'use_tag',
    item_name: itemName,
    matched_to: matchedTo,
    instance_id: instanceId,
    source: 'mechanics_tag',
    success: !!matchedTo,
  }));
}

/**
 * Log a matching attempt (when trying to find an item in inventory)
 */
export function logMatchAttempt(
  searchTerm: string,
  inventoryItems: string[],
  matchedTo: string | null,
  matchType: 'exact' | 'contains' | 'word' | 'type' | 'none'
): void {
  console.log(
    `[SYNC-LOG] Match Attempt: "${searchTerm}" -> ${matchedTo || 'NO MATCH'} (${matchType})`
  );
  
  queueLog(createLogEntry({
    event_type: 'match_attempt',
    item_name: searchTerm,
    matched_to: matchedTo,
    success: !!matchedTo,
    details: {
      match_type: matchType,
      inventory_size: inventoryItems.length,
      inventory_sample: inventoryItems.slice(0, 10),
    },
  }));
}

/**
 * Log a warning (non-critical issue)
 */
export function logWarning(message: string, context?: Record<string, unknown>): void {
  console.warn(`[SYNC-LOG] Warning: ${message}`, context || '');
  
  queueLog(createLogEntry({
    event_type: 'warning',
    success: false,
    details: { message, ...context },
  }));
}

/**
 * Log an error (critical issue)
 */
export function logError(message: string, error?: unknown, context?: Record<string, unknown>): void {
  console.error(`[SYNC-LOG] Error: ${message}`, error, context || '');
  
  queueLog(createLogEntry({
    event_type: 'error',
    success: false,
    details: {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    },
  }));
}

/**
 * Force flush any pending logs (call on page unload)
 */
export function forceFlush(): void {
  if (logQueue.length > 0) {
    flushLogs();
  }
}

// Flush logs on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    forceFlush();
  });
}

// Export session info for debugging
export const loggerInfo = {
  sessionId: SESSION_ID,
  appVersion: APP_VERSION,
  buildNumber: BUILD_NUMBER,
};

console.log(`[InventorySyncLogger] Initialized - Session: ${SESSION_ID}, Version: ${APP_VERSION} (${BUILD_NUMBER})`);
