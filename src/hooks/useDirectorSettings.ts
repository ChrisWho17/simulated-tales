import { useState, useEffect } from 'react';
import { 
  DirectorSettings, 
  DEFAULT_DIRECTOR_SETTINGS 
} from '@/game/directorModeSystem';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { StateSyncBus } from '@/services/stateSyncBus';

interface UseDirectorSettingsOptions {
  isPlaying: boolean;
}

interface DirectorSettingsReturn {
  directorSettings: DirectorSettings;
  setDirectorSettings: React.Dispatch<React.SetStateAction<DirectorSettings>>;
}

/**
 * Custom hook to manage director/narrator settings with campaign synchronization.
 * Uses StateSyncBus for cross-context communication.
 * Extracted from AdventureGame.tsx for better maintainability.
 */
export function useDirectorSettings({
  isPlaying,
}: UseDirectorSettingsOptions): DirectorSettingsReturn {
  const campaignContext = useCampaignOptional();

  // Initialize director settings from campaign or defaults
  const [directorSettings, setDirectorSettings] = useState<DirectorSettings>(() => {
    if (campaignContext?.activeCampaign?.settings?.directorSettings) {
      return campaignContext.activeCampaign.settings.directorSettings;
    }
    return DEFAULT_DIRECTOR_SETTINGS;
  });

  // Subscribe to StateSyncBus for director settings updates
  useEffect(() => {
    const unsubscribe = StateSyncBus.subscribe('settings:director-updated', (event) => {
      if (event.payload.directorSettings) {
        setDirectorSettings(event.payload.directorSettings);
        console.log('[useDirectorSettings] Received director settings update from StateSyncBus');
      }
    });

    return unsubscribe;
  }, []);

  // Sync director settings FROM campaign when campaign changes
  useEffect(() => {
    if (!isPlaying || !campaignContext?.activeCampaign?.settings?.directorSettings) return;

    const campaignSettings = campaignContext.activeCampaign.settings.directorSettings;
    const campaignHash = JSON.stringify(campaignSettings);
    const localHash = JSON.stringify(directorSettings);

    if (campaignHash !== localHash) {
      setDirectorSettings(campaignSettings);
      console.log(`[Director Sync] Synced director settings from campaign: ${campaignSettings.directorType}`);
    }
  }, [isPlaying, campaignContext?.activeCampaign?.settings?.directorSettings]);

  // Restore director settings when campaign ID changes
  useEffect(() => {
    if (!campaignContext?.activeCampaign?.settings?.directorSettings) return;
    setDirectorSettings(campaignContext.activeCampaign.settings.directorSettings);
    console.log('[useDirectorSettings] Restored director settings from campaign');
  }, [campaignContext?.activeCampaign?.id]);

  return {
    directorSettings,
    setDirectorSettings,
  };
}
