import { useEffect } from 'react';
import { playerStateManager } from '@/game/playerStateManager';
import { RPGCharacter } from '@/types/rpgCharacter';

interface UsePlayerStateSyncOptions {
  character: RPGCharacter | null;
  isPlaying: boolean;
  setCharacter: React.Dispatch<React.SetStateAction<RPGCharacter | null>>;
}

/**
 * Custom hook to synchronize React character state with playerStateManager.
 * Handles HP, XP, and currency changes from game events.
 * Extracted from AdventureGame.tsx for better maintainability.
 */
export function usePlayerStateSync({
  character,
  isPlaying,
  setCharacter,
}: UsePlayerStateSyncOptions): void {
  useEffect(() => {
    if (!character || !isPlaying) return;

    // Initialize playerStateManager with current character data
    playerStateManager.syncFromCharacter(character);
    console.log('[PlayerStateManager] Initialized with character:', character.name);

    // Subscribe to HP changes
    const unsubHp = playerStateManager.subscribe('hp', (data: any) => {
      console.log('[PlayerStateManager] HP change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        const newHealth = data.newValue ?? prev.currentHealth;
        const maxHealth = data.maxHP ?? prev.maxHealth;
        if (newHealth === prev.currentHealth && maxHealth === prev.maxHealth) return prev;
        return { ...prev, currentHealth: newHealth, maxHealth };
      });
    });

    // Subscribe to XP changes
    const unsubXp = playerStateManager.subscribe('xp', (data: any) => {
      console.log('[PlayerStateManager] XP change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          experience: data.newXP ?? prev.experience,
          level: data.newLevel ?? prev.level,
        };
      });
    });

    // Subscribe to currency changes
    const unsubCurrency = playerStateManager.subscribe('currency', (data: any) => {
      console.log('[PlayerStateManager] Currency change event:', data);
      setCharacter(prev => {
        if (!prev) return prev;
        const newGold = data.newValue ?? prev.gold;
        if (newGold === prev.gold) return prev;
        return { ...prev, gold: newGold };
      });
    });

    return () => {
      unsubHp();
      unsubXp();
      unsubCurrency();
    };
  }, [character?.name, isPlaying, setCharacter]);
}
