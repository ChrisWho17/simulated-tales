// World Bible Types - Single Source of Truth for Genre Contract
import { GameGenre, WarEra } from '@/types/genreData';

// Magic rules determine what level of supernatural exists
export type MagicRule = 'none' | 'subtle' | 'overt' | 'hidden' | 'forbidden';

// Tech tier determines what technology level is available
export type TechTier = 
  | 'primitive'      // Stone age, basic tools
  | 'ancient'        // Bronze/iron age, sailing
  | 'medieval'       // Feudal, castles, horses
  | 'sailing'        // Age of sail, early firearms
  | 'industrial'     // Steam, factories
  | 'modern'         // Contemporary, electronics
  | 'nearfuture'     // Cyberpunk, advanced tech
  | 'spacefaring'    // Interstellar travel
  | 'transcendent';  // Post-singularity, godlike tech

// Species that can appear in the world
export type AllowedSpecies = 
  | 'human'
  | 'elf'
  | 'dwarf'
  | 'orc'
  | 'halfling'
  | 'android'
  | 'alien'
  | 'mutant'
  | 'vampire'
  | 'werewolf'
  | 'ghost'
  | 'demon'
  | 'fae'
  | 'construct'
  | string; // Allow custom species

// Blend behavior determines how secondary genres integrate
export type BlendBehavior = 
  | 'additive'    // Adds entities/elements directly
  | 'modifier';   // Changes tone/atmosphere, not entities

// Secondary genre blend configuration
export interface GenreBlend {
  genreId: GameGenre | string;
  blendStrength: number;  // 0.0 to 0.30 max
  blendBehavior: BlendBehavior;
}

// Escalation beat - a valid way to raise stakes
export interface EscalationBeat {
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  beats: string[];
}

// Reskin rule - how to adapt foreign elements
export interface ReskinRule {
  pattern: string;       // What to look for
  replacement: string;   // What to replace with
  category: 'species' | 'tech' | 'magic' | 'concept' | 'entity';
}

// Genre definition - complete contract for a genre
export interface GenreDefinition {
  id: GameGenre | string;
  name: string;
  
  // World parameters
  techTier: TechTier;
  magicDefault: MagicRule;
  speciesDefault: AllowedSpecies[];
  
  // Core identity - what this genre OWNS
  coreElements: string[];
  
  // Valid escalation paths
  escalationLadder: EscalationBeat[];
  
  // Hard blocks - cannot appear without explicit contract
  hardBanned: string[];
  
  // How to adapt foreign elements
  reskinRules: Record<string, string>;
  
  // Blend behavior when used as secondary
  blendBehavior: BlendBehavior;
  
  // Tone keywords for validation
  toneKeywords: string[];
  
  // Setting-specific vocabulary
  vocabulary: {
    greetings: string[];
    exclamations: string[];
    titles: string[];
    locations: string[];
    items: string[];
  };
}

// World Bible - the single source of truth
export interface WorldBible {
  // Identity
  campaignId: string;
  campaignName: string;
  createdAt: number;
  
  // Genre configuration
  primaryGenre: GameGenre | string;
  secondaryGenres: GenreBlend[];
  
  // World rules
  techTier: TechTier;
  magicRule: MagicRule;
  speciesAllowed: AllowedSpecies[];
  
  // War-specific
  warEra?: WarEra;
  
  // Content controls
  bannedElements: string[];     // Computed from genre definitions
  tabooList: string[];          // User-defined blocks (content warnings)
  hardLock: boolean;            // If true, blocked content regenerates
  
  // Escalation menu - valid ways to raise stakes
  escalationMenu: EscalationBeat[];
  
  // Reskin rules - how to adapt foreign elements
  reskinRules: Record<string, string>;
  
  // Intrusion budget - allows limited cross-genre elements
  intrusionBudget: number;
  intrusionsThisChapter: number;
  
  // Contract summary for LLM prompts
  contractSummary: string;
  
  // Validation log for drift detection
  validationLog: ValidationLogEntry[];
  
  // Chapter tracking
  currentChapter: number;
}

// Validation log entry for drift analytics
export interface ValidationLogEntry {
  timestamp: number;
  chapter: number;
  action: 'allow' | 'block' | 'reskin' | 'intrusion' | 'unlock';
  element?: string;
  details?: string;
}

// Extracted entity from content
export interface ExtractedEntity {
  text: string;
  category: 'species' | 'tech' | 'magic' | 'location' | 'concept' | 'weapon' | 'creature';
  confidence: number;
  position: number;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  
  // What was found
  extractedEntities: ExtractedEntity[];
  
  // What was blocked
  violations: {
    entity: ExtractedEntity;
    reason: 'hardBanned' | 'taboo' | 'techMismatch' | 'speciesMismatch' | 'magicMismatch';
  }[];
  
  // What was allowed with warning
  warnings: {
    entity: ExtractedEntity;
    reason: string;
  }[];
  
  // What was adapted
  reskins: {
    original: string;
    replacement: string;
    rule: string;
  }[];
  
  // How many intrusions were used
  intrusionsUsed: number;
  
  // Modified content (with reskins applied)
  modifiedContent: string;
  
  // Original content
  originalContent: string;
}

// World Bible creation options
export interface WorldBibleOptions {
  campaignName: string;
  primaryGenre: GameGenre | string;
  secondaryGenres?: GenreBlend[];
  hardLock?: boolean;
  tabooList?: string[];
  intrusionBudget?: number;
  warEra?: WarEra;
  customTechTier?: TechTier;
  customMagicRule?: MagicRule;
  customSpecies?: AllowedSpecies[];
}
