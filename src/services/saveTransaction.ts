// ============================================================================
// SAVE TRANSACTION SYSTEM - Write-ahead logging with atomic operations
// Phase 3 Enhanced: Transactional saves with verification and sync bus integration
// ============================================================================

import { CampaignData } from '@/types/campaign';
import { STORAGE_KEYS, getCampaignKey, getWALKey } from '@/lib/storageKeys';
import { StateSyncBus } from './stateSyncBus';
import { checkAndCleanupStorage, performCleanup } from '@/lib/storageCleanup';
import { getBig, setBig, delBig } from '@/lib/bigKVStore';


// Transaction states
export type TransactionState = 'pending' | 'committed' | 'rolled_back' | 'failed' | 'verified';

export interface SaveTransaction {
  id: string;
  campaignId: string;
  state: TransactionState;
  createdAt: number;
  completedAt?: number;
  checksum: string;
  previousChecksum?: string;
  dataSize: number;
  error?: string;
  verificationPassed?: boolean;
  retryCount?: number;
}

export interface WriteAheadLogEntry {
  transactionId: string;
  campaignId: string;
  operation: 'save' | 'delete';
  timestamp: number;
  data?: string; // Compressed campaign data
  checksum: string;
  version?: number; // Schema version
}

export interface TransactionVerificationResult {
  success: boolean;
  checksumMatch: boolean;
  dataIntact: boolean;
  sizeMatch: boolean;
  error?: string;
}

const WAL_KEY = STORAGE_KEYS.WAL_PREFIX.slice(0, -1); // Remove trailing underscore for base key
const TRANSACTION_LOG_KEY = 'lwe_transaction_log';
const MAX_WAL_ENTRIES = 10;
const MAX_TRANSACTION_LOG = 50;
const MAX_RETRY_ATTEMPTS = 3;

// ============================================================================
// CHECKSUM GENERATION (SHA-256)
// ============================================================================

async function generateChecksum(data: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback to simple hash if crypto.subtle unavailable
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// ============================================================================
// TRANSACTION MANAGER
// ============================================================================

class SaveTransactionManager {
  private static instance: SaveTransactionManager;
  private activeTransactions: Map<string, SaveTransaction> = new Map();
  
  static getInstance(): SaveTransactionManager {
    if (!SaveTransactionManager.instance) {
      SaveTransactionManager.instance = new SaveTransactionManager();
    }
    return SaveTransactionManager.instance;
  }
  
  // Create a new transaction
  async beginTransaction(campaignId: string, campaignData: CampaignData): Promise<SaveTransaction> {
    const dataString = JSON.stringify(campaignData);
    const checksum = await generateChecksum(dataString);
    
    const transaction: SaveTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      state: 'pending',
      createdAt: Date.now(),
      checksum,
      dataSize: dataString.length,
    };
    
    // Get previous checksum for rollback
    const existingData = getBig(`lwe_campaign_${campaignId}`);
    if (existingData) {
      transaction.previousChecksum = await generateChecksum(existingData);
    }
    
    this.activeTransactions.set(transaction.id, transaction);
    
    // Write to WAL
    await this.writeToWAL({
      transactionId: transaction.id,
      campaignId,
      operation: 'save',
      timestamp: Date.now(),
      data: dataString,
      checksum,
    });
    
    console.log(`[Transaction] Started: ${transaction.id} for campaign ${campaignId}`);
    return transaction;
  }
  
  // Commit transaction (make changes permanent)
  async commit(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      console.error(`[Transaction] Not found: ${transactionId}`);
      return false;
    }
    
    try {
      // Get data from WAL
      const walEntry = await this.getWALEntry(transactionId);
      if (!walEntry || !walEntry.data) {
        throw new Error('WAL entry not found or empty');
      }
      
      // Verify checksum before commit
      const currentChecksum = await generateChecksum(walEntry.data);
      if (currentChecksum !== transaction.checksum) {
        throw new Error('Data corruption detected - checksum mismatch');
      }
      
      // Write campaign blob via BigKV (IndexedDB-backed, no quota)
      const key = getCampaignKey(transaction.campaignId);

      try {
        setBig(key, walEntry.data!);
      } catch (commitError: any) {
        if (commitError?.name === 'QuotaExceededError') {
          console.warn('[Transaction] Quota exceeded during commit, cleaning up...');
          performCleanup(0.4);
          setBig(key, walEntry.data!); // Retry after cleanup
        } else {
          throw commitError;
        }
      }

      // Verify write with full verification
      const verification = await this.verifyWrite(key, transaction.checksum, walEntry.data.length);
      if (!verification.success) {
        throw new Error(`Write verification failed: ${verification.error}`);
      }
      
      // Update transaction state to verified
      transaction.state = 'verified';
      transaction.completedAt = Date.now();
      transaction.verificationPassed = true;
      
      // Log transaction
      this.logTransaction(transaction);
      
      // Clean up WAL
      await this.removeFromWAL(transactionId);
      
      this.activeTransactions.delete(transactionId);
      
      // Emit success event via StateSyncBus
      StateSyncBus.emit('campaign:saved', {
        campaignId: transaction.campaignId,
        timestamp: Date.now(),
        syncedToCloud: false, // Will be updated by cloud sync
      }, 'SaveTransaction');
      
      console.log(`[Transaction] Committed and verified: ${transactionId}`);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      transaction.state = 'failed';
      transaction.error = errorMessage;
      transaction.completedAt = Date.now();
      transaction.retryCount = (transaction.retryCount || 0) + 1;
      
      this.logTransaction(transaction);
      
      // Emit failure event via StateSyncBus
      StateSyncBus.emit('error:save-failed', {
        campaignId: transaction.campaignId,
        error: errorMessage,
        recoverable: (transaction.retryCount || 0) < MAX_RETRY_ATTEMPTS,
      }, 'SaveTransaction');
      
      console.error(`[Transaction] Commit failed: ${transactionId}`, error);
      return false;
    }
  }
  
  // Verify a write was successful
  private async verifyWrite(
    key: string,
    expectedChecksum: string,
    expectedSize: number
  ): Promise<TransactionVerificationResult> {
    try {
      const written = getBig(key);
      
      if (!written) {
        return {
          success: false,
          checksumMatch: false,
          dataIntact: false,
          sizeMatch: false,
          error: 'No data found after write',
        };
      }
      
      const writtenChecksum = await generateChecksum(written);
      const checksumMatch = writtenChecksum === expectedChecksum;
      const sizeMatch = Math.abs(written.length - expectedSize) < 10; // Allow small variance
      
      // Verify JSON is parseable
      let dataIntact = false;
      try {
        JSON.parse(written);
        dataIntact = true;
      } catch {
        dataIntact = false;
      }
      
      return {
        success: checksumMatch && dataIntact,
        checksumMatch,
        dataIntact,
        sizeMatch,
        error: !checksumMatch ? 'Checksum mismatch' : !dataIntact ? 'Data corruption' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        checksumMatch: false,
        dataIntact: false,
        sizeMatch: false,
        error: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }
  
  // Rollback transaction
  async rollback(transactionId: string): Promise<boolean> {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`[Transaction] Rollback requested for unknown tx: ${transactionId}`);
      return false;
    }
    
    try {
      // Remove from WAL without applying
      await this.removeFromWAL(transactionId);
      
      transaction.state = 'rolled_back';
      transaction.completedAt = Date.now();
      
      this.logTransaction(transaction);
      this.activeTransactions.delete(transactionId);
      
      console.log(`[Transaction] Rolled back: ${transactionId}`);
      return true;
    } catch (error) {
      console.error(`[Transaction] Rollback failed: ${transactionId}`, error);
      return false;
    }
  }
  
  // ============================================================================
  // WRITE-AHEAD LOG OPERATIONS
  // ============================================================================
  
  private async writeToWAL(entry: WriteAheadLogEntry): Promise<void> {
    // Proactive cleanup before write attempt
    checkAndCleanupStorage();
    
    const attemptWrite = () => {
      const walRaw = getBig(WAL_KEY);
      const wal: WriteAheadLogEntry[] = walRaw ? JSON.parse(walRaw) : [];
      
      wal.push(entry);
      
      // Trim old entries
      while (wal.length > MAX_WAL_ENTRIES) {
        wal.shift();
      }
      
      setBig(WAL_KEY, JSON.stringify(wal));
    };
    
    try {
      attemptWrite();
    } catch (error: any) {
      if (error?.name === 'QuotaExceededError') {
        console.warn('[WAL] Quota exceeded, performing aggressive cleanup...');
        performCleanup(0.4); // Aggressive cleanup - free 40%
        
        try {
          attemptWrite();
          console.log('[WAL] Write succeeded after cleanup');
        } catch (retryError) {
          console.error('[WAL] Write failed even after cleanup:', retryError);
          throw retryError;
        }
      } else {
        console.error('[WAL] Write failed:', error);
        throw error;
      }
    }
  }
  
  private async getWALEntry(transactionId: string): Promise<WriteAheadLogEntry | null> {
    try {
      const walRaw = getBig(WAL_KEY);
      if (!walRaw) return null;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      return wal.find(e => e.transactionId === transactionId) || null;
    } catch {
      return null;
    }
  }
  
  private async removeFromWAL(transactionId: string): Promise<void> {
    try {
      const walRaw = getBig(WAL_KEY);
      if (!walRaw) return;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      const filtered = wal.filter(e => e.transactionId !== transactionId);
      
      setBig(WAL_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('[WAL] Remove failed:', error);
    }
  }
  
  // ============================================================================
  // RECOVERY - Replay uncommitted WAL entries
  // ============================================================================
  
  async recoverFromWAL(): Promise<{ recovered: number; failed: number }> {
    const result = { recovered: 0, failed: 0 };
    
    try {
      const walRaw = getBig(WAL_KEY);
      if (!walRaw) return result;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      
      for (const entry of wal) {
        // Check if already committed
        const existingData = getBig(`lwe_campaign_${entry.campaignId}`);
        if (existingData) {
          const existingChecksum = await generateChecksum(existingData);
          if (existingChecksum === entry.checksum) {
            // Already committed, clean up WAL
            await this.removeFromWAL(entry.transactionId);
            continue;
          }
        }
        
        // Try to recover uncommitted transaction
        if (entry.data) {
          try {
            setBig(`lwe_campaign_${entry.campaignId}`, entry.data);
            await this.removeFromWAL(entry.transactionId);
            result.recovered++;
            console.log(`[WAL] Recovered transaction: ${entry.transactionId}`);
          } catch {
            result.failed++;
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('[WAL] Recovery failed:', error);
      return result;
    }
  }
  
  // ============================================================================
  // TRANSACTION LOG
  // ============================================================================
  
  private logTransaction(transaction: SaveTransaction): void {
    try {
      const logRaw = localStorage.getItem(TRANSACTION_LOG_KEY);
      const log: SaveTransaction[] = logRaw ? JSON.parse(logRaw) : [];
      
      log.unshift({
        ...transaction,
        // Don't store full data in log
      });
      
      while (log.length > MAX_TRANSACTION_LOG) {
        log.pop();
      }
      
      localStorage.setItem(TRANSACTION_LOG_KEY, JSON.stringify(log));
    } catch (error) {
      console.error('[Transaction] Log failed:', error);
    }
  }
  
  getTransactionLog(): SaveTransaction[] {
    try {
      const logRaw = localStorage.getItem(TRANSACTION_LOG_KEY);
      return logRaw ? JSON.parse(logRaw) : [];
    } catch {
      return [];
    }
  }
  
  getActiveTransactions(): SaveTransaction[] {
    return Array.from(this.activeTransactions.values());
  }
}

export const TransactionManager = SaveTransactionManager.getInstance();
export { generateChecksum };
