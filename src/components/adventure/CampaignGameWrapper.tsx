// ============================================================================
// CAMPAIGN GAME WRAPPER
// Wraps AdventureGame with campaign system integration and migration handling
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdventureGame } from './AdventureGame';
import { MigrationPrompt, LegacyMigrationPrompt } from '@/components/campaign';
import { needsMigration, MigrationResult, cleanupOldData } from '@/lib/campaignMigration';
import { hasLegacyData, MigrationResult as LegacyMigrationResult, cleanupLegacyKeys, isMigrationCompleted } from '@/lib/legacySaveMigration';
import { SaveSystemDiagnostics } from '@/components/debug/SaveSystemDiagnostics';
import { CloudSyncService } from '@/services/cloudSyncService';
import { toast } from 'sonner';

// Keys to clean up when cloud sync is active
const MIGRATION_CLEANUP_KEYS = [
  'simtales_',
  'untold-adventure-',
  'legacy_backup_',
  'lwe_migration_completed',
];

export function CampaignGameWrapper() {
  const navigate = useNavigate();
  
  const [showMigration, setShowMigration] = useState(() => needsMigration());
  const [showLegacyMigration, setShowLegacyMigration] = useState(() => hasLegacyData());
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Auto-cleanup migration data when cloud sync is authenticated
  useEffect(() => {
    const cleanupMigrationDataIfCloudSynced = async () => {
      try {
        const isAuthenticated = await CloudSyncService.isAuthenticated();
        if (!isAuthenticated) return;
        
        // Check if we have cloud saves
        const cloudSaves = await CloudSyncService.listCloudSaves();
        if (cloudSaves.length === 0) return;
        
        console.log('[CampaignGameWrapper] Cloud sync active with saves, checking for migration cleanup...');
        
        // Count keys to clean
        let keysToClean: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && MIGRATION_CLEANUP_KEYS.some(prefix => key.startsWith(prefix))) {
            keysToClean.push(key);
          }
        }
        
        if (keysToClean.length === 0) {
          console.log('[CampaignGameWrapper] No migration data to clean up');
          return;
        }
        
        console.log(`[CampaignGameWrapper] Found ${keysToClean.length} legacy keys to clean up`);
        
        // Clean up old migration data
        let cleaned = 0;
        for (const key of keysToClean) {
          try {
            // Don't remove current campaign data (lwe_campaign_ without migration prefix)
            if (key.startsWith('lwe_campaign_') && !key.includes('migrated')) {
              continue;
            }
            localStorage.removeItem(key);
            cleaned++;
          } catch (e) {
            console.warn(`[CampaignGameWrapper] Failed to remove ${key}:`, e);
          }
        }
        
        // Also clean legacy campaign migration
        cleanupOldData();
        
        // Clean legacy save migration data
        if (isMigrationCompleted()) {
          cleanupLegacyKeys();
        }
        
        if (cleaned > 0) {
          console.log(`[CampaignGameWrapper] Cleaned up ${cleaned} legacy migration keys`);
          toast.success('Storage optimized', {
            description: `Cleaned up ${cleaned} legacy entries. Your saves are safe in the cloud.`,
          });
        }
      } catch (e) {
        console.error('[CampaignGameWrapper] Migration cleanup error:', e);
      }
    };
    
    // Run cleanup after a short delay to let the app initialize
    const timer = setTimeout(cleanupMigrationDataIfCloudSynced, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Register keyboard shortcut for diagnostics (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagnostics(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle campaign migration complete
  const handleMigrationComplete = useCallback((result: MigrationResult) => {
    setShowMigration(false);
    
    // If campaigns were migrated, go to campaign manager to let user pick one
    if (result.migratedCount > 0) {
      navigate('/campaigns');
    }
  }, [navigate]);
  
  // Handle skip migration
  const handleSkipMigration = useCallback(() => {
    setShowMigration(false);
  }, []);
  
  // Handle legacy migration complete
  const handleLegacyMigrationComplete = useCallback(() => {
    setShowLegacyMigration(false);
  }, []);
  
  // Handle legacy migration skip
  const handleLegacyMigrationSkip = useCallback(() => {
    setShowLegacyMigration(false);
  }, []);
  
  // Show campaign migration prompt if needed
  if (showMigration) {
    return (
      <MigrationPrompt
        onComplete={handleMigrationComplete}
        onSkip={handleSkipMigration}
      />
    );
  }
  
  // Render the adventure game with optional overlays
  return (
    <>
      <AdventureGame />
      
      {/* Legacy save migration prompt */}
      {showLegacyMigration && (
        <LegacyMigrationPrompt
          onComplete={handleLegacyMigrationComplete}
          onSkip={handleLegacyMigrationSkip}
        />
      )}
      
      {/* Save system diagnostics (toggle with Ctrl+Shift+D) */}
      <SaveSystemDiagnostics 
        isOpen={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </>
  );
}
