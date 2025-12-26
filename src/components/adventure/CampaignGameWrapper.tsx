// ============================================================================
// CAMPAIGN GAME WRAPPER
// Wraps AdventureGame with campaign system integration and migration handling
// ============================================================================

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdventureGame } from './AdventureGame';
import { MigrationPrompt } from '@/components/campaign';
import { needsMigration, MigrationResult } from '@/lib/campaignMigration';

export function CampaignGameWrapper() {
  const navigate = useNavigate();
  
  const [showMigration, setShowMigration] = useState(() => needsMigration());
  
  // Handle migration complete
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
  
  // Show migration prompt if needed
  if (showMigration) {
    return (
      <MigrationPrompt
        onComplete={handleMigrationComplete}
        onSkip={handleSkipMigration}
      />
    );
  }
  
  // Render the adventure game directly
  // AdventureGame handles its own phase logic (loading, recovery, scenario, character, playing)
  return <AdventureGame />;
}
