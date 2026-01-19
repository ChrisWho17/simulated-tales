import { describe, it, expect, beforeEach } from 'vitest';
import {
  createRipple,
  detectActionCategory,
  processRipples,
  buildConsequenceContext,
  buildWorldStateContext,
  createDefaultWorldState,
  pruneWorldState,
  applyRippleEffect,
  ActiveRipple,
  RippleSeverity,
  WorldStateChanges,
} from '../rippleEffectSystem';

describe('Ripple Effect System', () => {
  describe('createRipple', () => {
    it('should create a theft ripple', () => {
      const ripple = createRipple(
        'Player stole bread from merchant',
        'theft',
        'shoplifting',
        'Market Square',
        10,
        'player',
        3
      );

      expect(ripple).not.toBeNull();
      expect(ripple?.triggerEvent).toBe('Player stole bread from merchant');
      expect(ripple?.severity).toBe('minor');
      expect(ripple?.effects.length).toBeGreaterThan(0);
    });

    it('should create a violence ripple', () => {
      const ripple = createRipple(
        'Player attacked guard',
        'violence',
        'assault',
        'City Gate',
        20,
        'player',
        5
      );

      expect(ripple).not.toBeNull();
      expect(ripple?.severity).toBe('moderate');
    });

    it('should create a heroic ripple', () => {
      const ripple = createRipple(
        'Player saved child from fire',
        'heroic',
        'rescue',
        'Village Center',
        30,
        'player',
        10
      );

      expect(ripple).not.toBeNull();
      expect(ripple?.severity).toBe('moderate');
    });

    it('should create an economic ripple', () => {
      const ripple = createRipple(
        'Player made large purchase',
        'economic',
        'major_purchase',
        'Market',
        40,
        'player',
        1
      );

      expect(ripple).not.toBeNull();
      expect(ripple?.severity).toBe('minor');
    });

    it('should return null for unknown template', () => {
      const ripple = createRipple(
        'Unknown action',
        'theft',
        'nonexistent_template',
        'Somewhere',
        0,
        'player',
        1
      );

      expect(ripple).toBeNull();
    });

    it('should scale effects based on witnesses', () => {
      const lowWitnessRipple = createRipple(
        'Theft with few witnesses',
        'theft',
        'shoplifting',
        'Alley',
        0,
        'player',
        1
      );

      const highWitnessRipple = createRipple(
        'Theft with many witnesses',
        'theft',
        'shoplifting',
        'Market Square',
        0,
        'player',
        50
      );

      expect(lowWitnessRipple).not.toBeNull();
      expect(highWitnessRipple).not.toBeNull();

      // High witness count should increase magnitude
      const lowMagnitude = lowWitnessRipple!.effects[0].magnitude;
      const highMagnitude = highWitnessRipple!.effects[0].magnitude;
      expect(highMagnitude).toBeGreaterThan(lowMagnitude);
    });
  });

  describe('detectActionCategory', () => {
    it('should detect violence actions', () => {
      expect(detectActionCategory('I attack the guard')?.category).toBe('violence');
      expect(detectActionCategory('I kill the dragon')?.category).toBe('violence');
      expect(detectActionCategory('I stab the enemy')?.category).toBe('violence');
    });

    it('should detect theft actions', () => {
      expect(detectActionCategory('I steal from the shop')?.category).toBe('theft');
      expect(detectActionCategory('I pickpocket the merchant')?.category).toBe('theft');
    });

    it('should detect heroic actions', () => {
      expect(detectActionCategory('I save the child')?.category).toBe('heroic');
      expect(detectActionCategory('I rescue the villagers')?.category).toBe('heroic');
      expect(detectActionCategory('I protect the innocent')?.category).toBe('heroic');
    });

    it('should scale witnesses based on public context', () => {
      const privateAction = detectActionCategory('I steal from the shop', { isPublic: false });
      const publicAction = detectActionCategory('I steal from the shop', { isPublic: true, crowdSize: 20 });

      expect(privateAction?.witnesses).toBe(1);
      expect(publicAction?.witnesses).toBe(20);
    });

    it('should return null for unrecognized actions', () => {
      const result = detectActionCategory('I walk down the street');
      expect(result).toBeNull();
    });
  });

  describe('processRipples', () => {
    it('should process scheduled ripple effects', () => {
      const ripple = createRipple(
        'Test ripple',
        'theft',
        'pickpocket',
        'Street',
        0,
        'player',
        1
      );

      if (ripple) {
        // Process at turn 0 - immediate effects should trigger
        const result = processRipples([ripple], 0);
        expect(result).toHaveProperty('updatedRipples');
        expect(result).toHaveProperty('triggeredEffects');
        expect(result).toHaveProperty('narrativeQueue');
      }
    });

    it('should trigger effects based on scheduled turn', () => {
      const ripple = createRipple(
        'Delayed effect test',
        'theft',
        'burglary',
        'House',
        0,
        'player',
        1
      );

      expect(ripple).not.toBeNull();
      
      // First effect is delayed by LOCAL_GOSSIP_HOURS (2 hours)
      const firstEffect = ripple!.effects[0];
      expect(firstEffect.delay).toBeGreaterThan(0);
    });

    it('should expire completed ripples', () => {
      const ripple = createRipple(
        'Short ripple',
        'theft',
        'pickpocket',
        'Street',
        0,
        'player',
        1
      );

      if (ripple) {
        // Process at a very high turn to trigger all effects
        const result = processRipples([ripple], 10000);
        expect(Array.isArray(result.updatedRipples)).toBe(true);
      }
    });
  });

  describe('buildConsequenceContext', () => {
    it('should build context from narrative queue', () => {
      const narrativeQueue = [
        'Guards are searching for the thief',
        'Merchants are wary of strangers',
      ];

      const context = buildConsequenceContext(narrativeQueue);
      expect(typeof context).toBe('string');
      expect(context).toContain('Guards are searching');
    });

    it('should handle empty queue', () => {
      const context = buildConsequenceContext([]);
      expect(typeof context).toBe('string');
      expect(context).toBe('');
    });
  });

  describe('buildWorldStateContext', () => {
    it('should build context from world state', () => {
      const worldState = createDefaultWorldState();
      worldState.securityLevel = 'high';
      worldState.guardAlertLevel = 50;
      worldState.publicMood = 'fearful';

      const context = buildWorldStateContext(worldState);
      expect(typeof context).toBe('string');
      expect(context).toContain('SECURITY');
    });

    it('should handle default world state', () => {
      const worldState = createDefaultWorldState();
      const context = buildWorldStateContext(worldState);
      expect(typeof context).toBe('string');
    });
  });

  describe('createDefaultWorldState', () => {
    it('should create default world state', () => {
      const state = createDefaultWorldState();
      expect(state.guardAlertLevel).toBe(0);
      expect(state.securityLevel).toBe('normal');
      expect(state.publicMood).toBe('peaceful');
    });
  });

  describe('pruneWorldState', () => {
    it('should prune oversized arrays', () => {
      const state = createDefaultWorldState();
      // Add many entries
      for (let i = 0; i < 50; i++) {
        state.reputationChanges.push({ target: `target_${i}`, change: i });
      }
      
      const pruned = pruneWorldState(state);
      expect(pruned.reputationChanges.length).toBeLessThanOrEqual(20);
    });
  });

  describe('applyRippleEffect', () => {
    it('should apply authority effects', () => {
      const state = createDefaultWorldState();
      const effect = {
        phase: 1,
        delay: 0,
        type: 'authority' as const,
        target: 'guards',
        effect: 'manhunt',
        magnitude: 80,
        triggered: false,
        description: 'Guards are hunting',
      };

      const updated = applyRippleEffect(effect, state);
      expect(updated.guardAlertLevel).toBeGreaterThan(0);
      expect(updated.activeManhunts.length).toBeGreaterThan(0);
    });

    it('should apply social effects', () => {
      const state = createDefaultWorldState();
      const effect = {
        phase: 1,
        delay: 0,
        type: 'social' as const,
        target: 'public',
        effect: 'panic',
        magnitude: 70,
        triggered: false,
        description: 'People are panicking',
      };

      const updated = applyRippleEffect(effect, state);
      expect(updated.publicMood).toBe('panicked');
    });
  });

  describe('ripple severity levels', () => {
    it('should have correct severity for pickpocket', () => {
      const ripple = createRipple('pickpocket', 'theft', 'pickpocket', 'Street', 0, 'player', 1);
      expect(ripple?.severity).toBe('trivial');
    });

    it('should have correct severity for major heist', () => {
      const ripple = createRipple('heist', 'theft', 'major_heist', 'Bank', 0, 'player', 1);
      expect(ripple?.severity).toBe('major');
    });

    it('should have correct severity for massacre', () => {
      const ripple = createRipple('massacre', 'violence', 'massacre', 'Village', 0, 'player', 1);
      expect(ripple?.severity).toBe('catastrophic');
    });

    it('should have correct severity for small help', () => {
      const ripple = createRipple('help', 'heroic', 'small_help', 'Road', 0, 'player', 1);
      expect(ripple?.severity).toBe('trivial');
    });

    it('should have correct severity for legendary deed', () => {
      const ripple = createRipple('legend', 'heroic', 'legendary_deed', 'Kingdom', 0, 'player', 1);
      expect(ripple?.severity).toBe('severe');
    });
  });

  describe('ripple interruptibility', () => {
    it('should mark some ripples as interruptible', () => {
      const interruptible = createRipple('theft', 'theft', 'shoplifting', 'Market', 0, 'player', 1);
      expect(interruptible?.interruptible).toBe(true);
    });

    it('should mark severe ripples as non-interruptible', () => {
      const nonInterruptible = createRipple('massacre', 'violence', 'massacre', 'Village', 0, 'player', 1);
      expect(nonInterruptible?.interruptible).toBe(false);
    });
  });
});
