// ValidationEngine - Entity extraction and contract enforcement
import {
  WorldBible,
  ValidationResult,
  ExtractedEntity,
  ValidationLogEntry,
} from './types';
import { getGenreDefinition } from './genreDefinitions';

// Entity patterns for extraction
const ENTITY_PATTERNS: Record<string, { category: ExtractedEntity['category']; patterns: RegExp[] }> = {
  species: {
    category: 'species',
    patterns: [
      /\b(elf|elves|elven|elvish)\b/gi,
      /\b(dwarf|dwarves|dwarven|dwarfish)\b/gi,
      /\b(orc|orcs|orcish)\b/gi,
      /\b(goblin|goblins)\b/gi,
      /\b(dragon|dragons|draconic)\b/gi,
      /\b(vampire|vampires|vampiric)\b/gi,
      /\b(werewolf|werewolves)\b/gi,
      /\b(ghost|ghosts|spectral)\b/gi,
      /\b(demon|demons|demonic)\b/gi,
      /\b(angel|angels|angelic)\b/gi,
      /\b(android|androids)\b/gi,
      /\b(robot|robots|robotic)\b/gi,
      /\b(alien|aliens|extraterrestrial)\b/gi,
      /\b(mutant|mutants|mutated)\b/gi,
      /\b(zombie|zombies|undead)\b/gi,
      /\b(fairy|fairies|fae)\b/gi,
    ],
  },
  tech: {
    category: 'tech',
    patterns: [
      /\b(laser|lasers)\b/gi,
      /\b(computer|computers|computing)\b/gi,
      /\b(robot|robots|robotic)\b/gi,
      /\b(spaceship|spaceships|starship)\b/gi,
      /\b(cybernetic|cybernetics|cyborg)\b/gi,
      /\b(plasma|plasma-based)\b/gi,
      /\b(hologram|holograms|holographic)\b/gi,
      /\b(neural interface|neural link)\b/gi,
      /\b(teleport|teleporter|teleportation)\b/gi,
      /\b(AI|artificial intelligence)\b/gi,
      /\b(nanobot|nanobots|nanotechnology)\b/gi,
      /\b(warp drive|hyperdrive|FTL)\b/gi,
      /\b(energy shield|force field)\b/gi,
    ],
  },
  magic: {
    category: 'magic',
    patterns: [
      /\b(magic|magical|magically)\b/gi,
      /\b(spell|spells|spellcasting)\b/gi,
      /\b(wizard|wizards|wizardry)\b/gi,
      /\b(sorcerer|sorcerers|sorcery)\b/gi,
      /\b(enchant|enchanted|enchantment)\b/gi,
      /\b(curse|curses|cursed)\b/gi,
      /\b(potion|potions)\b/gi,
      /\b(arcane|arcana)\b/gi,
      /\b(conjure|conjured|conjuration)\b/gi,
      /\b(summon|summoned|summoning)\b/gi,
      /\b(mana|magical energy)\b/gi,
      /\b(rune|runes|runic)\b/gi,
    ],
  },
  weapon: {
    category: 'weapon',
    patterns: [
      /\b(sword|swords|blade|blades)\b/gi,
      /\b(gun|guns|firearm|firearms)\b/gi,
      /\b(bow|bows|crossbow)\b/gi,
      /\b(pistol|pistols|revolver)\b/gi,
      /\b(rifle|rifles)\b/gi,
      /\b(cannon|cannons)\b/gi,
      /\b(axe|axes)\b/gi,
      /\b(spear|spears|lance)\b/gi,
      /\b(dagger|daggers)\b/gi,
      /\b(staff|staves)\b/gi,
      /\b(blaster|blasters)\b/gi,
      /\b(lightsaber|energy sword)\b/gi,
    ],
  },
  creature: {
    category: 'creature',
    patterns: [
      /\b(kraken|leviathan)\b/gi,
      /\b(phoenix|phoenixes)\b/gi,
      /\b(unicorn|unicorns)\b/gi,
      /\b(griffin|griffins|gryphon)\b/gi,
      /\b(chimera|chimeras)\b/gi,
      /\b(hydra|hydras)\b/gi,
      /\b(basilisk|basilisks)\b/gi,
      /\b(golem|golems)\b/gi,
      /\b(elemental|elementals)\b/gi,
      /\b(troll|trolls)\b/gi,
      /\b(giant|giants)\b/gi,
    ],
  },
};

// Common words to ignore (not genre-specific)
const IGNORE_LIST = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
]);

export class ValidationEngine {
  /**
   * Extract entities from content for validation
   */
  static extractEntities(content: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const seen = new Set<string>();
    
    for (const [category, config] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of config.patterns) {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
          const text = match[0].toLowerCase();
          
          if (!seen.has(text) && !IGNORE_LIST.has(text)) {
            seen.add(text);
            entities.push({
              text: match[0],
              category: config.category,
              confidence: 0.9, // High confidence for pattern matches
              position: match.index,
            });
          }
        }
      }
    }
    
    // Sort by position in content
    entities.sort((a, b) => a.position - b.position);
    
    return entities;
  }
  
  /**
   * Check if an entity is in the banned list
   */
  static isBanned(entity: ExtractedEntity, worldBible: WorldBible): { banned: boolean; reason: string } {
    const text = entity.text.toLowerCase();
    
    // Check taboo list first (user-defined)
    for (const taboo of worldBible.tabooList) {
      if (text.includes(taboo.toLowerCase()) || taboo.toLowerCase().includes(text)) {
        return { banned: true, reason: 'taboo' };
      }
    }
    
    // Check banned elements (genre-computed)
    for (const banned of worldBible.bannedElements) {
      if (text.includes(banned.toLowerCase()) || banned.toLowerCase().includes(text)) {
        return { banned: true, reason: 'hardBanned' };
      }
    }
    
    return { banned: false, reason: '' };
  }
  
  /**
   * Find a reskin for a banned entity
   */
  static findReskin(entity: ExtractedEntity, worldBible: WorldBible): string | null {
    const text = entity.text.toLowerCase();
    
    // Check exact matches first
    if (worldBible.reskinRules[text]) {
      return worldBible.reskinRules[text];
    }
    
    // Check partial matches
    for (const [pattern, replacement] of Object.entries(worldBible.reskinRules)) {
      if (text.includes(pattern) || pattern.includes(text)) {
        return replacement;
      }
    }
    
    // Check category-based reskins
    const categoryKey = `${entity.category}_default`;
    if (worldBible.reskinRules[categoryKey]) {
      return worldBible.reskinRules[categoryKey];
    }
    
    return null;
  }
  
  /**
   * Apply reskins to content
   */
  static applyReskins(
    content: string,
    reskins: { original: string; replacement: string }[]
  ): string {
    let modified = content;
    
    // Sort by length (longest first) to avoid partial replacements
    const sorted = [...reskins].sort((a, b) => b.original.length - a.original.length);
    
    for (const { original, replacement } of sorted) {
      // Case-insensitive replacement
      const regex = new RegExp(escapeRegExp(original), 'gi');
      modified = modified.replace(regex, replacement);
    }
    
    return modified;
  }
  
  /**
   * Main validation method
   */
  static validateContent(content: string, worldBible: WorldBible): ValidationResult {
    const extractedEntities = this.extractEntities(content);
    
    const violations: ValidationResult['violations'] = [];
    const warnings: ValidationResult['warnings'] = [];
    const reskins: ValidationResult['reskins'] = [];
    
    let intrusionsUsed = 0;
    
    for (const entity of extractedEntities) {
      const { banned, reason } = this.isBanned(entity, worldBible);
      
      if (banned) {
        if (worldBible.hardLock) {
          // HARD LOCK MODE: No intrusions, no reskins - just block or allow based on genre
          // Check if entity is from an allowed genre's vocabulary
          const isAllowedByGenre = this.isAllowedBySelectedGenres(entity, worldBible);
          
          if (isAllowedByGenre) {
            // Entity is from one of the selected genres - allow with warning
            warnings.push({
              entity,
              reason: `Allowed: matches selected genre blend`,
            });
          } else {
            // Block completely - hard lock means strict adherence
            violations.push({
              entity,
              reason: reason as ValidationResult['violations'][0]['reason'],
            });
          }
        } else {
          // Normal mode: Use intrusion budget and reskins
          const budgetRemaining = worldBible.intrusionBudget - worldBible.intrusionsThisChapter - intrusionsUsed;
          
          if (budgetRemaining > 0) {
            // Use intrusion budget
            intrusionsUsed++;
            warnings.push({
              entity,
              reason: `Allowed via intrusion budget (${budgetRemaining - 1} remaining)`,
            });
          } else {
            // Try to reskin
            const reskin = this.findReskin(entity, worldBible);
            
            if (reskin) {
              reskins.push({
                original: entity.text,
                replacement: reskin,
                rule: `${entity.category} reskin`,
              });
            } else {
              // Block
              violations.push({
                entity,
                reason: reason as ValidationResult['violations'][0]['reason'],
              });
            }
          }
        }
      }
    }
    
    // Apply reskins to content
    const modifiedContent = this.applyReskins(content, reskins);
    
    // Determine validity
    const isValid = violations.length === 0;
    
    return {
      isValid,
      extractedEntities,
      violations,
      warnings,
      reskins,
      intrusionsUsed,
      modifiedContent,
      originalContent: content,
    };
  }
  
  /**
   * Check if an entity is allowed by one of the selected genres
   */
  static isAllowedBySelectedGenres(entity: ExtractedEntity, worldBible: WorldBible): boolean {
    const text = entity.text.toLowerCase();
    
    // getGenreDefinition imported statically at top
    
    // Check primary genre
    const primaryDef = getGenreDefinition(worldBible.primaryGenre);
    if (primaryDef) {
      for (const elem of primaryDef.coreElements) {
        if (text.includes(elem.toLowerCase()) || elem.toLowerCase().includes(text)) {
          return true;
        }
      }
    }
    
    // Check secondary genres
    for (const blend of worldBible.secondaryGenres) {
      const secDef = getGenreDefinition(blend.genreId);
      if (secDef) {
        // Check proportional to blend strength
        const elementsToCheck = Math.ceil(secDef.coreElements.length * (blend.blendStrength * 3));
        for (const elem of secDef.coreElements.slice(0, elementsToCheck)) {
          if (text.includes(elem.toLowerCase()) || elem.toLowerCase().includes(text)) {
            return true;
          }
        }
      }
    }
    
    return false;
  }
  
  /**
   * Log validation result for drift analytics
   */
  static logValidation(result: ValidationResult, worldBible: WorldBible): void {
    const timestamp = Date.now();
    
    // Log violations
    for (const violation of result.violations) {
      worldBible.validationLog.push({
        timestamp,
        chapter: worldBible.currentChapter,
        action: 'block',
        element: violation.entity.text,
        details: violation.reason,
      });
    }
    
    // Log reskins
    for (const reskin of result.reskins) {
      worldBible.validationLog.push({
        timestamp,
        chapter: worldBible.currentChapter,
        action: 'reskin',
        element: reskin.original,
        details: `Reskinned to: ${reskin.replacement}`,
      });
    }
    
    // Log intrusions
    if (result.intrusionsUsed > 0) {
      worldBible.validationLog.push({
        timestamp,
        chapter: worldBible.currentChapter,
        action: 'intrusion',
        details: `${result.intrusionsUsed} intrusions used`,
      });
    }
  }
  
  /**
   * Get drift analytics
   */
  static getDriftAnalytics(worldBible: WorldBible, timeWindowMs: number = 3600000): {
    totalViolations: number;
    totalReskins: number;
    totalIntrusions: number;
    driftPressure: 'low' | 'medium' | 'high';
    mostBlockedElements: { element: string; count: number }[];
  } {
    const now = Date.now();
    const recentLogs = worldBible.validationLog.filter(
      log => now - log.timestamp < timeWindowMs
    );
    
    const violations = recentLogs.filter(log => log.action === 'block');
    const reskins = recentLogs.filter(log => log.action === 'reskin');
    const intrusions = recentLogs.filter(log => log.action === 'intrusion');
    
    // Count blocked elements
    const elementCounts = new Map<string, number>();
    for (const v of violations) {
      if (v.element) {
        elementCounts.set(v.element, (elementCounts.get(v.element) || 0) + 1);
      }
    }
    
    const mostBlockedElements = Array.from(elementCounts.entries())
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Determine drift pressure
    const violationCount = violations.length;
    let driftPressure: 'low' | 'medium' | 'high' = 'low';
    if (violationCount > 10) driftPressure = 'high';
    else if (violationCount > 5) driftPressure = 'medium';
    
    return {
      totalViolations: violations.length,
      totalReskins: reskins.length,
      totalIntrusions: intrusions.length,
      driftPressure,
      mostBlockedElements,
    };
  }
  
  /**
   * Generate contract summary for LLM prompts
   */
  static generateContractSummary(worldBible: WorldBible): string {
    const lines: string[] = [
      `GENRE CONTRACT: ${worldBible.campaignName}`,
      ``,
      `PRIMARY GENRE: ${worldBible.primaryGenre} (dominant tone and setting)`,
    ];
    
    if (worldBible.secondaryGenres.length > 0) {
      lines.push(``);
      lines.push(`GENRE BLEND:`);
      for (const sg of worldBible.secondaryGenres) {
        const pct = Math.round(sg.blendStrength * 100);
        lines.push(`- ${sg.genreId}: ${pct}% influence (${pct >= 20 ? 'strong presence' : pct >= 10 ? 'moderate presence' : 'subtle touches'})`);
      }
      lines.push(``);
      lines.push(`BLENDING INSTRUCTIONS:`);
      lines.push(`- The PRIMARY genre (${worldBible.primaryGenre}) sets the main narrative tone, world rules, and atmosphere.`);
      lines.push(`- Secondary genres add flavoring elements proportional to their percentages.`);
      lines.push(`- A 30% blend means roughly 1 in 3 scenes/elements should reflect that genre.`);
      lines.push(`- A 10% blend means occasional subtle references or background elements.`);
      lines.push(`- Blend naturally - don't force jarring combinations.`);
      lines.push(``);
      lines.push(`GENRE LOCK: ${worldBible.hardLock ? 'HARD (strict adherence to selected genres ONLY)' : 'SOFT (allows creative adaptation beyond selected genres)'}`);
    } else {
      lines.push(`GENRE MODE: ${worldBible.hardLock ? 'PURE (single genre, strict adherence)' : 'FLEXIBLE (allows creative elements)'}`);
    }
    
    lines.push(``);
    lines.push(`WORLD RULES:`);
    lines.push(`- Tech Level: ${worldBible.techTier}`);
    lines.push(`- Magic: ${worldBible.magicRule}`);
    lines.push(`- Allowed Species: ${worldBible.speciesAllowed.join(', ')}`);
    
    lines.push(``);
    if (worldBible.hardLock) {
      lines.push(`STRICT MODE ACTIVE: Only include elements from the selected genre(s).`);
      lines.push(`Do NOT introduce elements from other genres or settings.`);
    } else {
      lines.push(`BANNED ELEMENTS (avoid unless dramatically necessary):`);
      lines.push(worldBible.bannedElements.slice(0, 15).join(', '));
    }
    
    if (worldBible.tabooList.length > 0) {
      lines.push(``);
      lines.push(`CONTENT RESTRICTIONS (never include):`);
      lines.push(worldBible.tabooList.join(', '));
    }
    
    lines.push(``);
    lines.push(`ESCALATION MENU (use these to raise stakes):`);
    for (const tier of worldBible.escalationMenu.slice(0, 4)) {
      lines.push(`Tier ${tier.tier}: ${tier.beats.slice(0, 4).join(', ')}`);
    }
    
    lines.push(``);
    if (worldBible.secondaryGenres.length > 0) {
      lines.push(`FOR OPENING NARRATIVE: Establish the primary ${worldBible.primaryGenre} atmosphere first, then naturally weave in ${worldBible.secondaryGenres.map(sg => sg.genreId).join(' and ')} elements.`);
    }
    lines.push(`Choose escalation beats from the menu above to raise tension.`);
    
    return lines.join('\n');
  }
}

// Utility function
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
