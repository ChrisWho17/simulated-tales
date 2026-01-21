// ============================================================================
// COMPANION AUTONOMY INTEGRATION - Hooks autonomy into main game loop
// ============================================================================

import { CompanionState, PlayerActionType } from './companionTypes';
import { 
  AutonomyState, 
  AutonomousAction,
  evaluateAutonomousActions, 
  createDefaultAutonomyState,
  addGrievance,
  addressGrievance,
  updateGoalProgress,
  generateCompanionGoals
} from './companionAutonomy';
import { companionSystem } from '../companionSystem';

// ============================================================================
// AUTONOMY MANAGER
// ============================================================================

interface CompanionAutonomyData {
  state: AutonomyState;
  lastProcessed: number;
  recentPlayerActions: PlayerActionType[];
}

class CompanionAutonomyManager {
  private autonomyData: Map<string, CompanionAutonomyData> = new Map();
  private pendingAutonomousActions: Map<string, AutonomousAction[]> = new Map();
  private maxRecentActions = 10;
  
  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  
  /**
   * Initialize autonomy for a companion
   */
  initializeAutonomy(companionId: string, traits: string[]): AutonomyState {
    const state = createDefaultAutonomyState(traits as any);
    
    this.autonomyData.set(companionId, {
      state,
      lastProcessed: Date.now(),
      recentPlayerActions: [],
    });
    
    console.log(`[CompanionAutonomy] Initialized for ${companionId}`);
    return state;
  }
  
  /**
   * Get or create autonomy state for a companion
   */
  getAutonomyState(companionId: string): AutonomyState | null {
    const data = this.autonomyData.get(companionId);
    if (data) return data.state;
    
    // Try to load from storage
    try {
      const extras = JSON.parse(localStorage.getItem('companion-extras') || '{}');
      if (extras[companionId]?.autonomy) {
        this.autonomyData.set(companionId, {
          state: extras[companionId].autonomy,
          lastProcessed: Date.now(),
          recentPlayerActions: [],
        });
        return extras[companionId].autonomy;
      }
    } catch (e) {
      console.error('[CompanionAutonomy] Failed to load from storage:', e);
    }
    
    return null;
  }
  
  // ============================================================================
  // ACTION TRACKING
  // ============================================================================
  
  /**
   * Track a player action for all active companions
   */
  trackPlayerAction(actionType: PlayerActionType, context?: string): void {
    const activeCompanions = companionSystem.getActiveCompanions();
    
    for (const companion of activeCompanions) {
      const data = this.autonomyData.get(companion.id);
      if (!data) continue;
      
      // Add to recent actions
      data.recentPlayerActions.push(actionType);
      if (data.recentPlayerActions.length > this.maxRecentActions) {
        data.recentPlayerActions.shift();
      }
      
      // Check if this action should create a grievance
      if (companion.personality.disapproves.includes(actionType)) {
        const severity = this.calculateGrievanceSeverity(companion, actionType);
        if (severity >= 20) {
          data.state = addGrievance(
            data.state,
            actionType,
            `Witnessed player action: ${actionType}`,
            severity
          );
        }
      }
    }
  }
  
  /**
   * Calculate how severely a companion reacts to an action
   */
  private calculateGrievanceSeverity(companion: CompanionState, action: PlayerActionType): number {
    let severity = 30; // Base severity
    
    // Strongly disapproved actions
    const strongDisapproval = ['betrayal', 'cruelty', 'murder'];
    if (strongDisapproval.includes(action)) {
      severity += 30;
    }
    
    // Personality modifiers
    if (companion.personality.traits.includes('honorable') && 
        ['theft', 'lie', 'betrayal'].includes(action)) {
      severity += 20;
    }
    
    if (companion.personality.traits.includes('kind') &&
        ['cruelty', 'violence'].includes(action)) {
      severity += 25;
    }
    
    // Trust affects how much they care
    if (companion.trust < 30) {
      severity += 10; // Low trust = more sensitive
    } else if (companion.trust > 70) {
      severity -= 10; // High trust = more forgiving
    }
    
    return Math.min(100, severity);
  }
  
  // ============================================================================
  // AUTONOMOUS ACTION PROCESSING
  // ============================================================================
  
  /**
   * Process autonomous actions for all active companions
   * Call this periodically (e.g., every turn, every few seconds)
   */
  processAutonomousActions(situationContext?: string): Map<string, AutonomousAction[]> {
    const result = new Map<string, AutonomousAction[]>();
    const activeCompanions = companionSystem.getActiveCompanions();
    
    for (const companion of activeCompanions) {
      const data = this.autonomyData.get(companion.id);
      if (!data) {
        // Initialize if missing
        this.initializeAutonomy(companion.id, companion.personality.traits);
        continue;
      }
      
      // Rate limit processing (at least 5 seconds between checks)
      if (Date.now() - data.lastProcessed < 5000) continue;
      data.lastProcessed = Date.now();
      
      // Evaluate potential autonomous actions
      const actions = evaluateAutonomousActions(
        companion,
        data.state,
        data.recentPlayerActions,
        situationContext
      );
      
      if (actions.length > 0) {
        // Store pending actions
        this.pendingAutonomousActions.set(companion.id, actions);
        result.set(companion.id, actions);
        
        // Handle departure countdown
        if (data.state.departureWarningIssued) {
          data.state.departureCountdown--;
        }
        
        // Set departure warning flag if action includes it
        if (actions.some(a => a.type === 'departure_warning')) {
          data.state.departureWarningIssued = true;
          data.state.departureCountdown = 3;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Get the next pending autonomous action for a companion
   */
  getNextPendingAction(companionId: string): AutonomousAction | null {
    const actions = this.pendingAutonomousActions.get(companionId);
    if (!actions || actions.length === 0) return null;
    return actions[0]; // Return highest priority (already sorted)
  }
  
  /**
   * Consume (resolve) a pending action
   */
  consumePendingAction(companionId: string): AutonomousAction | null {
    const actions = this.pendingAutonomousActions.get(companionId);
    if (!actions || actions.length === 0) return null;
    
    const action = actions.shift();
    if (actions.length === 0) {
      this.pendingAutonomousActions.delete(companionId);
    }
    
    return action || null;
  }
  
  /**
   * Clear all pending actions for a companion
   */
  clearPendingActions(companionId: string): void {
    this.pendingAutonomousActions.delete(companionId);
  }
  
  // ============================================================================
  // GOAL MANAGEMENT
  // ============================================================================
  
  /**
   * Progress a companion's goal
   */
  progressGoal(companionId: string, goalId: string, amount: number): boolean {
    const data = this.autonomyData.get(companionId);
    if (!data) return false;
    
    const goal = data.state.currentGoals.find(g => g.id === goalId);
    if (!goal) return false;
    
    data.state = updateGoalProgress(data.state, goalId, goal.progress + amount);
    this.saveToStorage(companionId);
    
    return true;
  }
  
  /**
   * Block a companion's goal (triggers warnings if will leave)
   */
  blockGoal(companionId: string, goalId: string, reason: string): boolean {
    const data = this.autonomyData.get(companionId);
    if (!data) return false;
    
    const goal = data.state.currentGoals.find(g => g.id === goalId);
    if (!goal) return false;
    
    goal.blockedBy = reason;
    this.saveToStorage(companionId);
    
    return true;
  }
  
  // ============================================================================
  // GRIEVANCE RESOLUTION
  // ============================================================================
  
  /**
   * Address a grievance (player apologizes, explains, etc.)
   */
  resolveGrievance(companionId: string, grievanceId: string, forgive: boolean): boolean {
    const data = this.autonomyData.get(companionId);
    if (!data) return false;
    
    data.state = addressGrievance(data.state, grievanceId, forgive);
    
    // If forgiven, potentially reset departure countdown
    if (forgive) {
      const unresolvedCount = data.state.grievances.filter(g => !g.addressed && !g.forgiven).length;
      if (unresolvedCount === 0) {
        data.state.departureWarningIssued = false;
        data.state.departureCountdown = 3;
      }
    }
    
    this.saveToStorage(companionId);
    return true;
  }
  
  /**
   * Get unresolved grievances for a companion
   */
  getUnresolvedGrievances(companionId: string): { id: string; description: string; severity: number }[] {
    const data = this.autonomyData.get(companionId);
    if (!data) return [];
    
    return data.state.grievances
      .filter(g => !g.addressed && !g.forgiven)
      .map(g => ({ id: g.id, description: g.description, severity: g.severity }));
  }
  
  // ============================================================================
  // PERSISTENCE
  // ============================================================================
  
  /**
   * Save autonomy state to storage
   */
  private saveToStorage(companionId: string): void {
    const data = this.autonomyData.get(companionId);
    if (!data) return;
    
    try {
      const extras = JSON.parse(localStorage.getItem('companion-extras') || '{}');
      if (!extras[companionId]) extras[companionId] = {};
      extras[companionId].autonomy = data.state;
      localStorage.setItem('companion-extras', JSON.stringify(extras));
    } catch (e) {
      console.error('[CompanionAutonomy] Failed to save:', e);
    }
  }
  
  /**
   * Serialize all autonomy data for save
   */
  serialize(): Record<string, AutonomyState> {
    const result: Record<string, AutonomyState> = {};
    this.autonomyData.forEach((data, id) => {
      result[id] = data.state;
    });
    return result;
  }
  
  /**
   * Deserialize autonomy data from save
   */
  deserialize(data: Record<string, AutonomyState>): void {
    this.autonomyData.clear();
    this.pendingAutonomousActions.clear();
    
    Object.entries(data).forEach(([id, state]) => {
      this.autonomyData.set(id, {
        state,
        lastProcessed: Date.now(),
        recentPlayerActions: [],
      });
    });
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const companionAutonomyManager = new CompanionAutonomyManager();

// ============================================================================
// REACT HOOK
// ============================================================================

import { useState, useCallback, useEffect } from 'react';

export function useCompanionAutonomy() {
  const [pendingActions, setPendingActions] = useState<Map<string, AutonomousAction[]>>(new Map());
  
  // Process autonomy periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const actions = companionAutonomyManager.processAutonomousActions();
      if (actions.size > 0) {
        setPendingActions(new Map(actions));
      }
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const trackAction = useCallback((action: PlayerActionType, context?: string) => {
    companionAutonomyManager.trackPlayerAction(action, context);
  }, []);
  
  const getNextAction = useCallback((companionId: string) => {
    return companionAutonomyManager.getNextPendingAction(companionId);
  }, []);
  
  const consumeAction = useCallback((companionId: string) => {
    return companionAutonomyManager.consumePendingAction(companionId);
  }, []);
  
  const resolveGrievance = useCallback((companionId: string, grievanceId: string, forgive: boolean) => {
    return companionAutonomyManager.resolveGrievance(companionId, grievanceId, forgive);
  }, []);
  
  const getGrievances = useCallback((companionId: string) => {
    return companionAutonomyManager.getUnresolvedGrievances(companionId);
  }, []);
  
  return {
    pendingActions,
    trackAction,
    getNextAction,
    consumeAction,
    resolveGrievance,
    getGrievances,
  };
}

console.log('[CompanionAutonomyIntegration] Autonomy integration system loaded');
