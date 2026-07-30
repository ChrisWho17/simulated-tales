// Types + defaults for the Creators Mark (cheat) panel.
// Extracted verbatim from CheatModeSplash.tsx — no behavior changes.
import type { RPGCharacter } from '@/types/rpgCharacter';
import type { Gender } from '@/types/characterCreation';
import type { PersonalityTrait } from '@/game/companionSystem';
import type { COMBAT_ROLES, ARMOR_LEVELS, ORIGIN_STORIES, EXPERIENCE_LEVELS, APPEARANCE_TIMING } from './cheatConstants';

// Screen types for navigation
export type EditorScreen = 'cheats' | 'character' | 'inventory' | 'companions';

export interface CheatModeSplashProps {
  isOpen: boolean;
  onClose: () => void;
  character?: RPGCharacter & { portraitUrl?: string };
  onUpdateCharacter?: (character: RPGCharacter & { portraitUrl?: string }) => void;
  genre?: string;
  initialMode?: DevPanelMode;
}

export type DevPanelMode = 'cheat' | 'events' | 'integrity';

// Cheat state interface
export interface CheatState {
  godMode: boolean;
  infiniteGold: boolean;
  maxStats: boolean;
  instantKill: boolean;
  noClip: boolean;
  speedMultiplier: number;
  timeScale: number;
  unlockAll: boolean;
  invisibility: boolean;
  infiniteAmmo: boolean;
  // New cheats
  freezeTime: boolean;
  skipToDay: boolean;
  skipToNight: boolean;
  revealMap: boolean;
  noHunger: boolean;
  noFatigue: boolean;
}

// Enhanced Companion creator state with armor and origin
export interface CompanionCreatorState {
  name: string;
  gender: Gender;
  height: string;
  build: string;
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  traits: PersonalityTrait[];
  combatRole: typeof COMBAT_ROLES[number];
  armorLevel: typeof ARMOR_LEVELS[number]['id'];
  originStory: typeof ORIGIN_STORIES[number]['id'];
  experienceLevel: typeof EXPERIENCE_LEVELS[number]['id'];
  appearanceTiming: typeof APPEARANCE_TIMING[number]['id'];
  backstory: string;
  skills: string[];
  speechPattern: string;
  catchphrases: string[];
  age: string;
  distinguishingFeatures: string[];
  quirks: string[];
  // Body shape - gender specific
  bustSize?: string; // Female
  hipWidth?: string; // Female
  shoulderWidth?: string; // Male
  physique?: string; // Male
  portraitUrl: string | null;
  isGeneratingPortrait: boolean;
}

export const DEFAULT_COMPANION_CREATOR: CompanionCreatorState = {
  name: '',
  gender: 'other',
  height: 'average',
  build: 'average',
  skinTone: 'Medium',
  hairStyle: 'Medium',
  hairColor: 'Brown',
  eyeColor: 'Brown',
  traits: ['loyal', 'brave'],
  combatRole: 'damage',
  armorLevel: 'light',
  originStory: 'stranger',
  experienceLevel: 'competent',
  appearanceTiming: 'contextual',
  backstory: '',
  skills: [],
  speechPattern: 'casual, friendly',
  catchphrases: [],
  age: 'adult',
  distinguishingFeatures: [],
  quirks: [],
  bustSize: undefined,
  hipWidth: undefined,
  shoulderWidth: undefined,
  physique: undefined,
  portraitUrl: null,
  isGeneratingPortrait: false,
};
