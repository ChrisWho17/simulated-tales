// ============================================================================
// THE UNTOLD STORY ENGINE - Story Action Validator
// Validates story actions against player state before execution
// ============================================================================

import { playerStateManager } from './playerStateManager';

// ============================================================================
// TYPES
// ============================================================================

export interface StoryAction {
  id?: string;
  text: string;
  cost?: number;
  requiresItem?: string | string[] | { name: string; quantity?: number }[];
  consumesItem?: string | string[] | { name: string; quantity?: number }[];
  requiresHP?: number;
  requiresLevel?: number;
  requiresSkill?: Record<string, number>;
  hpCost?: number;
  rewards?: {
    currency?: number;
    xp?: number;
    items?: { name: string; quantity?: number; description?: string }[];
    hp?: number;
  };
}

export interface ValidationError {
  type: 'insufficient_funds' | 'missing_item' | 'missing_consumable' | 'insufficient_hp' | 'level_too_low' | 'skill_too_low';
  required: number | string;
  available: number | string;
  message: string;
  item?: string;
  skill?: string;
}

export interface ValidationWarning {
  type: 'lethal_hp_cost' | 'dangerous_hp_cost' | 'cheat_mode_bypass';
  message: string;
  cost?: number;
  currentHP?: number;
  remainingHP?: number;
  bypassedErrors?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  canProceed: boolean;
  cheatModeBypassed?: boolean;
  bypassedErrors?: ValidationError[];
}

export interface ActionExecutionResult {
  success: boolean;
  validation: ValidationResult;
  message?: string;
  effects: ActionEffect[];
}

export interface ActionEffect {
  type: string;
  amount?: number;
  item?: string;
  [key: string]: unknown;
}

export interface ValidatedChoice extends StoryAction {
  validation: ValidationResult;
  disabled: boolean;
  disabledReason?: string;
  warnings: ValidationWarning[];
}

// ============================================================================
// STORY ACTION VALIDATOR
// ============================================================================

class StoryActionValidatorClass {
  validateAction(action: StoryAction): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check currency requirements
    if (action.cost !== undefined && action.cost > 0) {
      if (!playerStateManager.canAfford(action.cost)) {
        errors.push({
          type: 'insufficient_funds',
          required: action.cost,
          available: playerStateManager.getState().currency.amount,
          message: `Need ${playerStateManager.getState().currency.currencySymbol}${action.cost} but only have ${playerStateManager.getCurrencyDisplay()}`,
        });
      }
    }

    // Check item requirements
    if (action.requiresItem) {
      const items = this.normalizeItemRequirements(action.requiresItem);
      for (const itemReq of items) {
        if (!playerStateManager.hasItem(itemReq.name, itemReq.quantity)) {
          errors.push({
            type: 'missing_item',
            item: itemReq.name,
            required: itemReq.quantity,
            available: playerStateManager.getItemQuantity(itemReq.name),
            message: `Need ${itemReq.quantity}x ${itemReq.name}`,
          });
        }
      }
    }

    // Check consumable items
    if (action.consumesItem) {
      const items = this.normalizeItemRequirements(action.consumesItem);
      for (const itemReq of items) {
        if (!playerStateManager.hasItem(itemReq.name, itemReq.quantity)) {
          errors.push({
            type: 'missing_consumable',
            item: itemReq.name,
            required: itemReq.quantity,
            available: playerStateManager.getItemQuantity(itemReq.name),
            message: `Need ${itemReq.quantity}x ${itemReq.name} to use`,
          });
        }
      }
    }

    // Check HP requirements
    if (action.requiresHP) {
      const currentHP = playerStateManager.getState().hp.current;
      if (currentHP < action.requiresHP) {
        errors.push({
          type: 'insufficient_hp',
          required: action.requiresHP,
          available: currentHP,
          message: `Need at least ${action.requiresHP} HP`,
        });
      }
    }

    // Check level requirements
    if (action.requiresLevel) {
      const currentLevel = playerStateManager.getState().xp.level;
      if (currentLevel < action.requiresLevel) {
        errors.push({
          type: 'level_too_low',
          required: action.requiresLevel,
          available: currentLevel,
          message: `Need to be level ${action.requiresLevel}`,
        });
      }
    }

    // Check HP cost warnings
    if (action.hpCost && action.hpCost > 0) {
      const currentHP = playerStateManager.getState().hp.current;
      if (currentHP - action.hpCost <= 0) {
        warnings.push({
          type: 'lethal_hp_cost',
          cost: action.hpCost,
          currentHP,
          message: 'This action will kill you!',
        });
      } else if (currentHP - action.hpCost < 20) {
        warnings.push({
          type: 'dangerous_hp_cost',
          cost: action.hpCost,
          remainingHP: currentHP - action.hpCost,
          message: 'This action will leave you critically wounded',
        });
      }
    }

    // Story Cheat Mode bypasses errors
    if (playerStateManager.storyCheatMode && errors.length > 0) {
      warnings.push({
        type: 'cheat_mode_bypass',
        bypassedErrors: errors.length,
        message: `Story Cheat Mode: Bypassing ${errors.length} requirement(s)`,
      });

      return {
        valid: true,
        cheatModeBypassed: true,
        bypassedErrors: errors,
        errors: [],
        warnings,
        canProceed: true,
      };
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      canProceed: errors.length === 0,
    };
  }

  executeAction(action: StoryAction): ActionExecutionResult {
    const validation = this.validateAction(action);

    if (!validation.canProceed) {
      return {
        success: false,
        validation,
        message: validation.errors[0]?.message || 'Action cannot be performed',
        effects: [],
      };
    }

    const effects: ActionEffect[] = [];

    // Apply costs
    if (action.cost && action.cost > 0) {
      const spend = playerStateManager.spendCurrency(action.cost, action.text || 'action');
      effects.push({ type: 'currency_spent', amount: -action.cost, success: spend.success });
    }

    // Consume items
    if (action.consumesItem) {
      const items = this.normalizeItemRequirements(action.consumesItem);
      for (const itemReq of items) {
        const remove = playerStateManager.removeItem(itemReq.name, itemReq.quantity, 'consumed_by_action');
        effects.push({ type: 'item_consumed', item: itemReq.name, amount: itemReq.quantity, success: remove.success });
      }
    }

    // Apply HP cost
    if (action.hpCost && action.hpCost > 0) {
      playerStateManager.takeDamage(action.hpCost, action.text);
      effects.push({ type: 'hp_cost', amount: -action.hpCost });
    }

    // Apply rewards
    if (action.rewards) {
      if (action.rewards.currency) {
        const gain = playerStateManager.addCurrency(action.rewards.currency, action.text);
        effects.push({ type: 'currency_gained', amount: action.rewards.currency, success: gain.success });
      }

      if (action.rewards.xp) {
        const xp = playerStateManager.addXP(action.rewards.xp, action.text);
        effects.push({ type: 'xp_gained', amount: action.rewards.xp, success: xp.success });
      }

      if (action.rewards.items) {
        for (const item of action.rewards.items) {
          const add = playerStateManager.addItem(
            { name: item.name, description: item.description || '' },
            item.quantity || 1
          );
          effects.push({ type: 'item_gained', item: item.name, amount: item.quantity || 1, success: add.success });
        }
      }

      if (action.rewards.hp) {
        playerStateManager.heal(action.rewards.hp);
        effects.push({ type: 'hp_healed', amount: action.rewards.hp });
      }
    }

    return {
      success: true,
      validation,
      effects,
    };
  }

  createValidatedChoice(choice: StoryAction): ValidatedChoice {
    const validation = this.validateAction(choice);

    return {
      ...choice,
      validation,
      disabled: !validation.canProceed && !playerStateManager.storyCheatMode,
      disabledReason: validation.errors[0]?.message,
      warnings: validation.warnings,
    };
  }

  validateChoices(choices: StoryAction[]): ValidatedChoice[] {
    return choices.map(choice => this.createValidatedChoice(choice));
  }

  private normalizeItemRequirements(items: string | string[] | { name: string; quantity?: number }[]): { name: string; quantity: number }[] {
    if (typeof items === 'string') {
      return [{ name: items, quantity: 1 }];
    }

    if (Array.isArray(items)) {
      return items.map(item => {
        if (typeof item === 'string') {
          return { name: item, quantity: 1 };
        }
        return { name: item.name, quantity: item.quantity || 1 };
      });
    }

    return [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const storyActionValidator = new StoryActionValidatorClass();
