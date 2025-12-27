// ============================================================================
// THE UNTOLD STORY ENGINE - Story AI Integration
// Builds player state context for AI narrative generation
// ============================================================================

import { playerStateManager } from './playerStateManager';
import { storyActionValidator, StoryAction, ValidatedChoice } from './storyActionValidator';

// ============================================================================
// AI CONTEXT BUILDER
// ============================================================================

class StoryAIIntegrationClass {
  /**
   * Build complete player state context for AI prompts
   * This should be injected into narrative generation requests
   */
  buildPlayerStateContext(): string {
    const state = playerStateManager.getCompleteState();
    const inventory = playerStateManager.getInventorySummary();

    let context = `
## PLAYER STATE (MUST RESPECT)

### VITALS
- HP: ${state.hp.current}/${state.hp.max} (${playerStateManager.getHPPercentage()}%)
- Level: ${state.xp.level} (${state.xp.current}/${state.xp.toNextLevel} XP to next)
`;

    // Add critical HP warning
    if (playerStateManager.getHPPercentage() <= 20) {
      context += `⚠ CRITICALLY LOW HP - Player is near death!\n`;
    }

    context += `
### CURRENCY
- ${state.currency.currencyName}: ${state.currency.currencySymbol}${state.currency.amount.toLocaleString()}
`;

    // Add low funds warning
    if (state.currency.amount <= 10) {
      context += `⚠ LOW FUNDS - Player is nearly broke!\n`;
    }

    context += `
### INVENTORY (${inventory.slotsUsed}/${inventory.maxSlots} slots, ${inventory.currentWeight.toFixed(1)}/${inventory.maxWeight} weight)
`;

    if (inventory.items.length > 0) {
      // Group items by category
      const categories = new Map<string, typeof inventory.items>();
      for (const item of inventory.items) {
        const cat = item.category || 'misc';
        if (!categories.has(cat)) {
          categories.set(cat, []);
        }
        categories.get(cat)!.push(item);
      }

      for (const [category, items] of categories) {
        context += `\n**${category.toUpperCase()}:**\n`;
        for (const item of items) {
          const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
          context += `- ${item.name}${qty}`;
          if (item.value) {
            context += ` [${state.currency.currencySymbol}${item.value}]`;
          }
          context += '\n';
        }
      }
    } else {
      context += `Inventory is empty.\n`;
    }

    // Cheat mode notice
    if (state.cheatMode) {
      context += `
### ✨ STORY CHEAT MODE ACTIVE
- Player can bypass inventory/currency restrictions
- Items can be summoned without having them
- Actions succeed regardless of requirements
- Still describe proper game logic in narrative
`;
    }

    context += `
## IMPORTANT RULES FOR AI
1. Player can ONLY give/use items they actually have in inventory
2. Player can ONLY spend currency they possess
3. If player tries to use non-existent item, choices should be unavailable OR narrative must acknowledge they don't have it
4. When generating choices with costs/requirements, check against current state
5. Any rewards (items, currency, XP) must be explicitly added through system
6. HP damage/healing must be tracked
7. Death occurs at 0 HP (unless genre prevents death)
${state.cheatMode ? '8. Cheat Mode: Bypass above rules but maintain narrative consistency' : ''}
`;

    return context;
  }

  /**
   * Generate valid choices based on player state
   */
  generateValidChoices(options: StoryAction[]): ValidatedChoice[] {
    return options.map(option => {
      const validated = storyActionValidator.createValidatedChoice(option);
      return {
        ...option,
        ...validated,
        available: validated.validation.canProceed,
        unavailableReason: validated.disabled ? validated.disabledReason : null,
        requirementsMet: validated.validation.valid,
      };
    });
  }

  /**
   * Format choice text with cost/requirement indicators
   */
  formatChoiceText(choice: StoryAction & { available?: boolean }): string {
    let text = choice.text;

    // Add cost indicator
    if (choice.cost) {
      const canAfford = playerStateManager.canAfford(choice.cost);
      const symbol = playerStateManager.getState().currency.currencySymbol;
      text += ` [${symbol}${choice.cost}${!canAfford ? ' - Cannot afford!' : ''}]`;
    }

    // Add item requirement indicator
    if (choice.requiresItem) {
      const itemName = typeof choice.requiresItem === 'string' 
        ? choice.requiresItem 
        : Array.isArray(choice.requiresItem) 
          ? (typeof choice.requiresItem[0] === 'string' ? choice.requiresItem[0] : choice.requiresItem[0]?.name)
          : '';
      
      if (itemName) {
        const hasItem = playerStateManager.hasItem(itemName);
        text += ` [Requires: ${itemName}${!hasItem ? ' - Missing!' : ''}]`;
      }
    }

    // Add unavailable marker
    if (choice.available === false && !playerStateManager.storyCheatMode) {
      text = `[UNAVAILABLE] ${text}`;
    }

    return text;
  }

  /**
   * Process choice result - execute the action
   */
  processChoiceResult(choice: StoryAction) {
    return storyActionValidator.executeAction(choice);
  }

  /**
   * Build compact state summary for inline narrative hints
   */
  buildCompactStateSummary(): string {
    const state = playerStateManager.getCompleteState();
    const items = playerStateManager.getInventorySummary().items;
    
    const itemNames = items.slice(0, 5).map(i => i.name).join(', ');
    const moreItems = items.length > 5 ? ` (+${items.length - 5} more)` : '';

    return `[HP: ${state.hp.current}/${state.hp.max} | ${state.currency.currencySymbol}${state.currency.amount} | Lv.${state.xp.level} | Items: ${itemNames || 'none'}${moreItems}]`;
  }

  /**
   * Debug output for player state
   */
  debugPlayerState(): void {
    console.log('=== PLAYER STATE DEBUG ===');
    console.log('Currency:', playerStateManager.getState().currency);
    console.log('HP:', playerStateManager.getState().hp);
    console.log('XP:', playerStateManager.getState().xp);
    console.log('Inventory:', playerStateManager.getState().inventory.items);
    console.log('Cheat Mode:', playerStateManager.storyCheatMode);
    console.log('=========================');
  }

  /**
   * Parse AI response for state changes
   * Detects rewards/costs mentioned in narrative and applies them
   */
  parseNarrativeStateChanges(narrative: string): { type: string; value: number; description: string }[] {
    const changes: { type: string; value: number; description: string }[] = [];

    // Detect currency gains (e.g., "received 50 gold", "found $100")
    const currencyGainPatterns = [
      /(?:received|found|earned|gained|obtained|got)\s+(\d+)\s*(?:gold|credits|dollars|coins|caps)/gi,
      /\$(\d+)/g,
      /(\d+)\s*(?:gold|credits|coins)/gi,
    ];

    for (const pattern of currencyGainPatterns) {
      const matches = narrative.matchAll(pattern);
      for (const match of matches) {
        const amount = parseInt(match[1], 10);
        if (amount > 0 && amount < 10000) { // Sanity check
          changes.push({ type: 'currency_gain', value: amount, description: match[0] });
        }
      }
    }

    // Detect damage (e.g., "took 10 damage", "lost 5 HP")
    const damagePatterns = [
      /(?:took|received|suffered)\s+(\d+)\s*(?:damage|points? of damage)/gi,
      /(?:lost|lose)\s+(\d+)\s*HP/gi,
    ];

    for (const pattern of damagePatterns) {
      const matches = narrative.matchAll(pattern);
      for (const match of matches) {
        const amount = parseInt(match[1], 10);
        if (amount > 0 && amount < 1000) {
          changes.push({ type: 'damage', value: -amount, description: match[0] });
        }
      }
    }

    // Detect healing (e.g., "healed for 20", "restored 15 HP")
    const healPatterns = [
      /(?:healed|restored|recovered)\s+(?:for\s+)?(\d+)\s*(?:HP|health|hit points)?/gi,
    ];

    for (const pattern of healPatterns) {
      const matches = narrative.matchAll(pattern);
      for (const match of matches) {
        const amount = parseInt(match[1], 10);
        if (amount > 0 && amount < 1000) {
          changes.push({ type: 'heal', value: amount, description: match[0] });
        }
      }
    }

    // Detect XP gains
    const xpPatterns = [
      /(?:gained|earned|received)\s+(\d+)\s*(?:XP|experience|exp)/gi,
    ];

    for (const pattern of xpPatterns) {
      const matches = narrative.matchAll(pattern);
      for (const match of matches) {
        const amount = parseInt(match[1], 10);
        if (amount > 0 && amount < 10000) {
          changes.push({ type: 'xp', value: amount, description: match[0] });
        }
      }
    }

    return changes;
  }

  /**
   * Apply detected state changes
   */
  applyNarrativeStateChanges(changes: { type: string; value: number; description: string }[]): void {
    for (const change of changes) {
      switch (change.type) {
        case 'currency_gain':
          playerStateManager.addCurrency(change.value, 'narrative');
          break;
        case 'damage':
          playerStateManager.takeDamage(Math.abs(change.value), 'narrative');
          break;
        case 'heal':
          playerStateManager.heal(change.value);
          break;
        case 'xp':
          playerStateManager.addXP(change.value, 'narrative');
          break;
      }
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const storyAIIntegration = new StoryAIIntegrationClass();

// ============================================================================
// PROMPT ENHANCEMENT HELPER
// ============================================================================

/**
 * Inject player state context into AI prompt
 */
export function buildStoryPromptWithState(basePrompt: string): string {
  return basePrompt + '\n' + storyAIIntegration.buildPlayerStateContext();
}
