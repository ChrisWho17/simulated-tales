// Persistence helpers for the Creators Mark (cheat) panel.
// Extracted verbatim from CheatModeSplash.tsx — no behavior changes.
import {
  savePlayerPortraitReference,
  loadPlayerPortraitReference,
} from '@/game/playerPortraitReference';

export const CHARACTER_KEY = 'living-world-character';

// Save character appearance to campaign for consistent image generation
export function saveCharacterAppearanceToCampaign(
  characterData: any,
  genre: string
): void {
  try {
    const portraitReference = loadPlayerPortraitReference();
    
    if (portraitReference && characterData.appearance) {
      const simple = characterData.appearance.simple;
      const detailed = characterData.appearance.detailed;
      const full = characterData.appearance.full;
      
      savePlayerPortraitReference(
        {
          name: characterData.name || portraitReference.name,
          gender: simple?.gender || portraitReference.gender,
          build: simple?.build || portraitReference.build,
          height: simple?.height || portraitReference.height,
          skinTone: detailed?.skinTone || portraitReference.skinTone,
          hairColor: detailed?.hairColor || portraitReference.hairColor,
          hairStyle: detailed?.hairStyle || portraitReference.hairStyle,
          eyeColor: detailed?.eyeColor || portraitReference.eyeColor,
          details: detailed?.distinguishingFeatures || portraitReference.details,
          tieredAppearance: characterData.appearance,
        },
        genre,
        portraitReference.className,
        portraitReference.portraitHints
      );
      
      console.log('[CheatMode] Updated character appearance in campaign');
    }
    
    localStorage.setItem(CHARACTER_KEY, JSON.stringify(characterData));
  } catch (error) {
    console.error('[CheatMode] Failed to save character appearance:', error);
  }
}
