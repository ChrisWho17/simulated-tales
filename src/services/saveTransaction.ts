// ============================================================================
// SAVE TRANSACTION SYSTEM - Write-ahead logging with atomic operations
// Phase 2: Transactional saves for data integrity
// ============================================================================

import { CampaignData } from '@/types/campaign';

// Transaction states
export type TransactionState = 'pending' | 'committed' | 'rolled_back' | 'failed';

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
}

export interface WriteAheadLogEntry {
  transactionId: string;
  campaignId: string;
  operation: 'save' | 'delete';
  timestamp: number;
  data?: string; // Compressed campaign data
  checksum: string;
}

const WAL_KEY = 'lwe_write_ahead_log';
const TRANSACTION_LOG_KEY = 'lwe_transaction_log';
const MAX_WAL_ENTRIES = 10;
const MAX_TRANSACTION_LOG = 50;

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
    const existingData = localStorage.getItem(`lwe_campaign_${campaignId}`);
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
      
      // Write to localStorage (atomic)
      const key = `lwe_campaign_${transaction.campaignId}`;
      localStorage.setItem(key, walEntry.data);
      
      // Verify write
      const written = localStorage.getItem(key);
      if (!written) {
        throw new Error('Write verification failed');
      }
      
      const writtenChecksum = await generateChecksum(written);
      if (writtenChecksum !== transaction.checksum) {
        throw new Error('Write checksum verification failed');
      }
      
      // Update transaction state
      transaction.state = 'committed';
      transaction.completedAt = Date.now();
      
      // Log transaction
      this.logTransaction(transaction);
      
      // Clean up WAL
      await this.removeFromWAL(transactionId);
      
      this.activeTransactions.delete(transactionId);
      
      console.log(`[Transaction] Committed: ${transactionId}`);
      return true;
    } catch (error) {
      transaction.state = 'failed';
      transaction.error = error instanceof Error ? error.message : String(error);
      transaction.completedAt = Date.now();
      
      this.logTransaction(transaction);
      console.error(`[Transaction] Commit failed: ${transactionId}`, error);
      return false;
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
    try {
      const walRaw = localStorage.getItem(WAL_KEY);
      const wal: WriteAheadLogEntry[] = walRaw ? JSON.parse(walRaw) : [];
      
      wal.push(entry);
      
      // Trim old entries
      while (wal.length > MAX_WAL_ENTRIES) {
        wal.shift();
      }
      
      localStorage.setItem(WAL_KEY, JSON.stringify(wal));
    } catch (error) {
      console.error('[WAL] Write failed:', error);
      throw error;
    }
  }
  
  private async getWALEntry(transactionId: string): Promise<WriteAheadLogEntry | null> {
    try {
      const walRaw = localStorage.getItem(WAL_KEY);
      if (!walRaw) return null;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      return wal.find(e => e.transactionId === transactionId) || null;
    } catch {
      return null;
    }
  }
  
  private async removeFromWAL(transactionId: string): Promise<void> {
    try {
      const walRaw = localStorage.getItem(WAL_KEY);
      if (!walRaw) return;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      const filtered = wal.filter(e => e.transactionId !== transactionId);
      
      localStorage.setItem(WAL_KEY, JSON.stringify(filtered));
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
      const walRaw = localStorage.getItem(WAL_KEY);
      if (!walRaw) return result;
      
      const wal: WriteAheadLogEntry[] = JSON.parse(walRaw);
      
      for (const entry of wal) {
        // Check if already committed
        const existingData = localStorage.getItem(`lwe_campaign_${entry.campaignId}`);
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
            localStorage.setItem(`lwe_campaign_${entry.campaignId}`, entry.data);
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
