import { useEffect, useRef, useCallback } from 'react';
import { useCampaignOptional } from '@/contexts/CampaignContext';
import { RPGCharacter } from '@/types/rpgCharacter';
import { StoryEntry } from '@/components/adventure/types';

interface UseCampaignSyncOptions {
  isPlaying: boolean;
  story: StoryEntry[];
  character: RPGCharacter | null;
  setStory: React.Dispatch<React.SetStateAction<StoryEntry[]>>;
  setCharacter: React.Dispatch<React.SetStateAction<RPGCharacter | null>>;
}

interface CampaignSyncReturn {
  syncStoryToCampaign: () => void;
  syncCharacterToCampaign: () => void;
}

/**
 * Custom hook to handle bidirectional campaign synchronization.
 * Manages story and character sync between local state and campaign context.
 * Extracted from AdventureGame.tsx for better maintainability.
 */
export function useCampaignSync({
  isPlaying,
  story,
  character,
  setStory,
  setCharacter,
}: UseCampaignSyncOptions): CampaignSyncReturn {
  const campaignContext = useCampaignOptional();

  // Track synced state for change detection
  const lastSyncedTick = useRef<number>(-1);
  const lastSyncedCampaignId = useRef<string | null>(null);
  const lastSyncedStoryLength = useRef<number>(0);
  const lastSyncedCharacterRef = useRef<string>('');

  // Sync local state from campaign when campaign data changes (rollback detection)
  useEffect(() => {
    if (!isPlaying || !campaignContext?.activeCampaign) return;

    const campaign = campaignContext.activeCampaign;
    const currentTick = campaign.currentTick;

    // Reset sync state when campaign ID changes
    if (lastSyncedCampaignId.current !== campaign.id) {
      lastSyncedCampaignId.current = campaign.id;
      lastSyncedTick.current = currentTick;
      console.log('[Campaign Sync] New campaign detected, initialized sync state');
      return;
    }

    // Initial load case - sync everything
    if (lastSyncedTick.current === -1) {
      lastSyncedTick.current = currentTick;
      setStory(campaign.narrativeHistory);
      setCharacter(campaign.player);
      console.log('[Campaign Sync] Initial sync from campaign');
      return;
    }

    // Only sync if tick DECREASED (indicates checkpoint restore/rollback)
    if (currentTick < lastSyncedTick.current) {
      console.log('[Campaign Sync] Checkpoint restore detected, syncing from campaign');
      lastSyncedTick.current = currentTick;
      setStory(campaign.narrativeHistory);
      setCharacter(campaign.player);
    } else {
      lastSyncedTick.current = currentTick;
    }
  }, [isPlaying, campaignContext?.activeCampaign?.currentTick, setStory, setCharacter]);

  // Sync local story state to campaign before auto-save triggers
  useEffect(() => {
    if (!isPlaying || !campaignContext?.syncNarrativeHistory) return;

    if (story.length !== lastSyncedStoryLength.current && story.length > 0) {
      lastSyncedStoryLength.current = story.length;
      campaignContext.syncNarrativeHistory(story);
      console.log(`[Story Sync] Synced ${story.length} entries to campaign`);
    }
  }, [isPlaying, story, campaignContext]);

  // Sync local character state to campaign when character changes
  useEffect(() => {
    if (!isPlaying || !character || !campaignContext?.updatePlayer) return;

    const characterHash = JSON.stringify({
      currentHealth: character.currentHealth,
      maxHealth: character.maxHealth,
      gold: character.gold,
      experience: character.experience,
      level: character.level,
      inventory: character.inventory.map(i => ({ name: i.name, quantity: i.quantity })),
      stats: character.stats,
    });

    if (characterHash !== lastSyncedCharacterRef.current) {
      lastSyncedCharacterRef.current = characterHash;
      campaignContext.updatePlayer(character);
      console.log(`[Character Sync] Synced character to campaign - HP: ${character.currentHealth}/${character.maxHealth}, Gold: ${character.gold}, XP: ${character.experience}`);
    }
  }, [isPlaying, character, campaignContext]);

  // Manual sync functions for imperative calls
  const syncStoryToCampaign = useCallback(() => {
    if (campaignContext?.syncNarrativeHistory && story.length > 0) {
      campaignContext.syncNarrativeHistory(story);
    }
  }, [campaignContext, story]);

  const syncCharacterToCampaign = useCallback(() => {
    if (campaignContext?.updatePlayer && character) {
      campaignContext.updatePlayer(character);
    }
  }, [campaignContext, character]);

  return {
    syncStoryToCampaign,
    syncCharacterToCampaign,
  };
}
