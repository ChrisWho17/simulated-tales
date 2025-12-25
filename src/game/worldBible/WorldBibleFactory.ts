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

/**
 * Create a new World Bible from options
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
  
  // Get primary genre definition
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
  for (const blend of secondaryGenres) {
    const secDef = getGenreDefinition(blend.genreId);
    if (secDef && secDef.blendBehavior === 'additive') {
      for (const species of secDef.speciesDefault) {
        if (!speciesAllowed.includes(species)) {
          speciesAllowed.push(species);
        }
      }
    }
  }
  
  // Compute banned elements
  const secondaryIds = secondaryGenres.map(g => g.genreId);
  const bannedElements = getBannedElements(primaryGenre, secondaryIds);
  
  // Build escalation menu from primary + secondary
  const escalationMenu: EscalationBeat[] = primaryDef?.escalationLadder || [];
  for (const blend of secondaryGenres) {
    const secDef = getGenreDefinition(blend.genreId);
    if (secDef && blend.blendStrength >= 0.15) {
      // Add some secondary escalation beats
      for (const beat of secDef.escalationLadder.slice(0, 3)) {
        const existingTier = escalationMenu.find(e => e.tier === beat.tier);
        if (existingTier) {
          // Merge beats
          for (const b of beat.beats.slice(0, 2)) {
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
  
  // Create the World Bible
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
