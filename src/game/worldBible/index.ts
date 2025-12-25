// World Bible System - Genre Contract Enforcement
// Exports all World Bible functionality

// Types
export type {
  WorldBible,
  WorldBibleOptions,
  ValidationResult,
  ExtractedEntity,
  ValidationLogEntry,
  GenreDefinition,
  GenreBlend,
  EscalationBeat,
  ReskinRule,
  MagicRule,
  TechTier,
  AllowedSpecies,
  BlendBehavior,
} from './types';

// Genre Definitions
export {
  GENRE_DEFINITIONS,
  getGenreDefinition,
  getCoreElements,
  getBannedElements,
  FANTASY_DEFINITION,
  SCIFI_DEFINITION,
  HORROR_DEFINITION,
  MYSTERY_DEFINITION,
  PIRATE_DEFINITION,
  WESTERN_DEFINITION,
  CYBERPUNK_DEFINITION,
  POSTAPOC_DEFINITION,
  WAR_DEFINITION,
  COSMIC_HORROR_DEFINITION,
} from './genreDefinitions';

// Validation Engine
export { ValidationEngine } from './ValidationEngine';

// Factory and utilities
export {
  createWorldBible,
  startNewChapter,
  unlockElement,
  addTaboo,
  removeTaboo,
  setIntrusionBudget,
  getEscalationOptions,
  getEnhancedPrompt,
  validateAndProcess,
  serializeWorldBible,
  deserializeWorldBible,
  getAvailableGenres,
} from './WorldBibleFactory';
