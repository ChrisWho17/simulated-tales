// ============================================================================
// CAMPAIGN GAME WRAPPER
// Wraps AdventureGame with campaign system integration
// ============================================================================

import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCampaign } from '@/contexts/CampaignContext';
import { useGame } from '@/contexts/GameContext';
import { AdventureGame } from './AdventureGame';
import { MigrationPrompt } from '@/components/campaign';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { needsMigration, MigrationResult } from '@/lib/campaignMigration';

export function CampaignGameWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCampaign } = useCampaign();
  const { restoreWorldBible } = useGame();
  
  const [showMigration, setShowMigration] = useState(() => needsMigration());
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Handle route-based logic
  useEffect(() => {
    const init = async () => {
      // Small delay for smooth transition
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check current route
      const path = location.pathname;
      
      if (path === '/campaigns') {
        // User wants campaign manager - redirect there
        setIsInitializing(false);
        navigate('/campaigns');
        return;
      }
      
      if (path === '/play' && !activeCampaign) {
        // User wants to play but no active campaign - redirect to campaign manager
        navigate('/campaigns');
        return;
      }
      
      setIsInitializing(false);
    };
    
    init();
  }, [location.pathname, activeCampaign, navigate]);
  
  // Handle migration complete
  const handleMigrationComplete = useCallback((result: MigrationResult) => {
    setShowMigration(false);
    
    // If campaigns were migrated, go to campaign manager
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
  
  // Show loading during initialization
  if (isInitializing) {
    return <LoadingScreen isLoading={true} message="Loading..." />;
  }
  
  // Render the adventure game
  // It will handle its own phase logic (scenario selection, character creation, playing)
  return <AdventureGame />;
}
