// ============================================================================
// CAMPAIGN GAME WRAPPER
// Wraps AdventureGame with campaign system integration and migration handling
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdventureGame } from './AdventureGame';
import { MigrationPrompt, LegacyMigrationPrompt } from '@/components/campaign';
import { needsMigration, MigrationResult } from '@/lib/campaignMigration';
import { hasLegacyData, MigrationResult as LegacyMigrationResult } from '@/lib/legacySaveMigration';
import { SaveSystemDiagnostics } from '@/components/debug/SaveSystemDiagnostics';

export function CampaignGameWrapper() {
  const navigate = useNavigate();
  
  const [showMigration, setShowMigration] = useState(() => needsMigration());
  const [showLegacyMigration, setShowLegacyMigration] = useState(() => hasLegacyData());
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
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
