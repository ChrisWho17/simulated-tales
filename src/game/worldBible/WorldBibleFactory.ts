// WorldBibleFactory - Creates and manages World Bibles
import {
  WorldBible,
  WorldBibleOptions,
  GenreBlend,
  EscalationBeat,
  TechTier,
  MagicRule,
  AllowedSpecies,
} from './types';
import {
  getGenreDefinition,
  getBannedElements,
  GENRE_DEFINITIONS,
} from './genreDefinitions';
import { ValidationEngine } from './ValidationEngine';
import { WarEra } from '@/types/genreData';

// Track genre conflicts for narrative resolution instead of blocking
export interface GenreConflict {
  rule: string;
  primary: { genre: string; value: unknown };
  secondary: { genre: string; value: unknown };
}

export interface MergeResult {
  merged: Record<string, unknown>;
  conflicts: GenreConflict[];
  activeGenres: string[];
}

/**
 * Create a new World Bible from options
 * Uses priority-based merging with conflict queueing (non-blocking)
 */
export function createWorldBible(options: WorldBibleOptions): WorldBible {
  const {
    campaignName,
    primaryGenre,
    secondaryGenres = [],
    hardLock = false,
    tabooList = [],
    intrusionBudget = 2,
    warEra,
    customTechTier,
    customMagicRule,
    customSpecies,
  } = options;
  
  // Track conflicts for narrative use instead of blocking
  const genreConflicts: GenreConflict[] = [];
  
  // Get primary genre definition (with null safety)
  const primaryDef = getGenreDefinition(primaryGenre);
  
  // Determine tech tier
  let techTier: TechTier = customTechTier || primaryDef?.techTier || 'modern';
  
  // War genre era override
  if (primaryGenre === 'war' && warEra) {
    switch (warEra) {
      case 'past':
        techTier = 'medieval';
        break;
      case 'modern':
        techTier = 'modern';
        break;
      case 'future':
        techTier = 'spacefaring';
        break;
    }
  }
  
  // Determine magic rule
  const magicRule: MagicRule = customMagicRule || primaryDef?.magicDefault || 'none';
  
  // Determine allowed species
  const speciesAllowed: AllowedSpecies[] = customSpecies || 
    primaryDef?.speciesDefault || 
    ['human'];
  
  // Add species from secondary genres with additive behavior
  // Track conflicts instead of blocking
  for (const blend of secondaryGenres) {
    const secDef = getGenreDefinition(blend.genreId);
    if (secDef) {
      // Check for tech tier conflicts
      if (primaryDef && primaryDef.techTier !== secDef.techTier) {
        genreConflicts.push({
          rule: 'techTier',
          primary: { genre: primaryGenre, value: primaryDef.techTier },
          secondary: { genre: blend.genreId, value: secDef.techTier }
        });
      }
      
      // Check for magic rule conflicts  
      if (primaryDef && primaryDef.magicDefault !== secDef.magicDefault) {
        genreConflicts.push({
          rule: 'magicDefault',
          primary: { genre: primaryGenre, value: primaryDef.magicDefault },
          secondary: { genre: blend.genreId, value: secDef.magicDefault }
        });
      }
      
      // Add species from additive genres
      if (secDef.blendBehavior === 'additive') {
        for (const species of secDef.speciesDefault) {
          if (!speciesAllowed.includes(species)) {
            speciesAllowed.push(species);
          }
        }
      }
    }
  }
  
  // Compute banned elements based on hardLock mode
  const secondaryIds = secondaryGenres.map(g => g.genreId);
  let bannedElements: string[];
  
  if (hardLock) {
    // HARD LOCK: Only elements from chosen genres are allowed
    // Collect ALL banned elements from ALL genre definitions that aren't in our allowed set
    const allowedElements = new Set<string>();
    
    // Add primary genre's core elements
    if (primaryDef) {
      primaryDef.coreElements.forEach(e => allowedElements.add(e.toLowerCase()));
    }
    
    // Add secondary genres' core elements (scaled by blend strength)
    for (const blend of secondaryGenres) {
      const secDef = getGenreDefinition(blend.genreId);
      if (secDef) {
        // More blend = more elements allowed
        const elementCount = Math.ceil(secDef.coreElements.length * (blend.blendStrength * 3)); // blendStrength is 0-0.30
        secDef.coreElements.slice(0, elementCount).forEach(e => allowedElements.add(e.toLowerCase()));
      }
    }
    
    // Ban everything from OTHER genres that isn't in our allowed set
    const allBanned = new Set<string>();
    for (const def of Object.values(GENRE_DEFINITIONS)) {
      // Skip our selected genres
      if (def.id === primaryGenre || secondaryIds.includes(def.id)) continue;
      
      // Add this genre's core elements to potential bans
      def.coreElements.forEach(e => {
        if (!allowedElements.has(e.toLowerCase())) {
          allBanned.add(e);
        }
      });
    }
    
    // Also add primary genre's hardBanned (these are always banned)
    if (primaryDef) {
      primaryDef.hardBanned.forEach(e => allBanned.add(e));
    }
    
    bannedElements = [...allBanned];
  } else {
    // Normal mode: use standard banned elements calculation
    bannedElements = getBannedElements(primaryGenre, secondaryIds);
  }
  
  // Build escalation menu from primary + secondary
  const escalationMenu: EscalationBeat[] = primaryDef?.escalationLadder ? 
    JSON.parse(JSON.stringify(primaryDef.escalationLadder)) : [];
  
  for (const blend of secondaryGenres) {
    const secDef = getGenreDefinition(blend.genreId);
    if (secDef && blend.blendStrength >= 0.10) { // Lower threshold for escalation blending
      // Add some secondary escalation beats proportional to blend strength
      const beatsToAdd = blend.blendStrength >= 0.20 ? 4 : blend.blendStrength >= 0.15 ? 3 : 2;
      for (const beat of secDef.escalationLadder.slice(0, beatsToAdd)) {
        const existingTier = escalationMenu.find(e => e.tier === beat.tier);
        if (existingTier) {
          // Merge beats
          const newBeatsCount = blend.blendStrength >= 0.20 ? 3 : 2;
          for (const b of beat.beats.slice(0, newBeatsCount)) {
            if (!existingTier.beats.includes(b)) {
              existingTier.beats.push(b);
            }
          }
        }
      }
    }
  }
  
  // Build reskin rules
  const reskinRules: Record<string, string> = {};
  if (primaryDef) {
    Object.assign(reskinRules, primaryDef.reskinRules);
  }
  for (const blend of secondaryGenres) {
    const secDef = getGenreDefinition(blend.genreId);
    if (secDef) {
      Object.assign(reskinRules, secDef.reskinRules);
    }
  }
  
  // Create the World Bible with conflict tracking
  const activeGenres = [primaryGenre, ...secondaryGenres.map(g => g.genreId)];
  
  const worldBible: WorldBible = {
    campaignId: generateId(),
    campaignName,
    createdAt: Date.now(),
    
    primaryGenre,
    secondaryGenres,
    warEra,
    
    techTier,
    magicRule,
    speciesAllowed,
    
    bannedElements,
    tabooList,
    hardLock,
    
    escalationMenu,
    reskinRules,
    
    // Genre conflict tracking for narrative resolution
    genreConflicts,
    activeGenres,
    
    intrusionBudget,
    intrusionsThisChapter: 0,
    
    contractSummary: '', // Generated below
    validationLog: [],
    currentChapter: 1,
  };
  
  // Generate contract summary
  worldBible.contractSummary = ValidationEngine.generateContractSummary(worldBible);
  
  return worldBible;
}

/**
 * Start a new chapter (reset intrusion budget)
 */
export function startNewChapter(worldBible: WorldBible): void {
  worldBible.currentChapter++;
  worldBible.intrusionsThisChapter = 0;
}

/**
 * Unlock an element (remove from banned list)
 */
export function unlockElement(worldBible: WorldBible, element: string): void {
  const idx = worldBible.bannedElements.indexOf(element);
  if (idx > -1) {
    worldBible.bannedElements.splice(idx, 1);
    worldBible.validationLog.push({
      timestamp: Date.now(),
      chapter: worldBible.currentChapter,
      action: 'unlock',
      element,
      details: 'Element unlocked by game event',
    });
    
    // Regenerate contract summary
    worldBible.contractSummary = ValidationEngine.generateContractSummary(worldBible);
  }
}

/**
 * Add to taboo list
 */
export function addTaboo(worldBible: WorldBible, taboo: string): void {
  if (!worldBible.tabooList.includes(taboo)) {
    worldBible.tabooList.push(taboo);
    worldBible.contractSummary = ValidationEngine.generateContractSummary(worldBible);
  }
}

/**
 * Remove from taboo list
 */
export function removeTaboo(worldBible: WorldBible, taboo: string): void {
  const idx = worldBible.tabooList.indexOf(taboo);
  if (idx > -1) {
    worldBible.tabooList.splice(idx, 1);
    worldBible.contractSummary = ValidationEngine.generateContractSummary(worldBible);
  }
}

/**
 * Adjust intrusion budget
 */
export function setIntrusionBudget(worldBible: WorldBible, budget: number): void {
  worldBible.intrusionBudget = Math.max(0, Math.min(10, budget));
}

/**
 * Get available escalation beats for current tension level
 */
export function getEscalationOptions(
  worldBible: WorldBible,
  currentTier: 1 | 2 | 3 | 4 | 5 | 6 = 1
): string[] {
  const options: string[] = [];
  
  // Can pick from current tier or one above
  for (const escalation of worldBible.escalationMenu) {
    if (escalation.tier >= currentTier && escalation.tier <= currentTier + 1) {
      options.push(...escalation.beats);
    }
  }
  
  return [...new Set(options)];
}

/**
 * Get LLM prompt enhancement with contract
 */
export function getEnhancedPrompt(
  worldBible: WorldBible,
  basePrompt: string
): string {
  return `${worldBible.contractSummary}\n\n---\n\n${basePrompt}`;
}

/**
 * Validate and process content
 */
export function validateAndProcess(
  content: string,
  worldBible: WorldBible
): { success: boolean; content: string; log: string[] } {
  const result = ValidationEngine.validateContent(content, worldBible);
  const log: string[] = [];
  
  if (!result.isValid) {
    log.push(`BLOCKED: ${result.violations.length} violations found`);
    for (const v of result.violations) {
      log.push(`  - "${v.entity.text}" (${v.reason})`);
    }
    return { success: false, content, log };
  }
  
  // Log reskins
  if (result.reskins.length > 0) {
    log.push(`RESKINNED: ${result.reskins.length} elements adapted`);
    for (const r of result.reskins) {
      log.push(`  - "${r.original}" → "${r.replacement}"`);
    }
  }
  
  // Log warnings
  if (result.warnings.length > 0) {
    log.push(`WARNINGS: ${result.warnings.length} intrusions used`);
    for (const w of result.warnings) {
      log.push(`  - "${w.entity.text}" (${w.reason})`);
    }
  }
  
  // Update intrusion count
  worldBible.intrusionsThisChapter += result.intrusionsUsed;
  
  // Log validation
  ValidationEngine.logValidation(result, worldBible);
  
  return {
    success: true,
    content: result.modifiedContent,
    log,
  };
}

/**
 * Serialize World Bible for storage
 */
export function serializeWorldBible(worldBible: WorldBible): string {
  return JSON.stringify(worldBible);
}

/**
 * Deserialize World Bible from storage
 */
export function deserializeWorldBible(json: string): WorldBible | null {
  try {
    const parsed = JSON.parse(json);
    // Validate structure
    if (parsed.campaignId && parsed.primaryGenre && parsed.bannedElements) {
      return parsed as WorldBible;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get all available genre options
 */
export function getAvailableGenres(): { id: string; name: string }[] {
  return Object.values(GENRE_DEFINITIONS).map(def => ({
    id: def.id,
    name: def.name,
  }));
}

// Utility
function generateId(): string {
  return `wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
