// ============================================================================
// COMPANION WARNING TOAST - Alerts when companions are near departure threshold
// ============================================================================

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Heart, Shield, UserMinus } from 'lucide-react';
import { CompanionState, companionSystem } from '@/game/companionSystem';

// ============================================================================
// TYPES
// ============================================================================

interface WarningState {
  companionId: string;
  lastWarningTime: number;
  warningLevel: 'caution' | 'warning' | 'critical';
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WARNING_COOLDOWN = 60000; // 1 minute between warnings for same companion
const CHECK_INTERVAL = 10000; // Check every 10 seconds

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompanionWarningToast() {
  const warningsRef = useRef<Map<string, WarningState>>(new Map());

  const checkCompanionStatus = useCallback(() => {
    const activeCompanions = companionSystem.getActiveCompanions();
    const now = Date.now();

    for (const companion of activeCompanions) {
      const departureThreshold = companion.personality?.departureThreshold || -30;
      const betrayalThreshold = companion.personality?.betrayalThreshold || -60;
      
      // Calculate warning zones
      const cautionZone = departureThreshold + 30; // 30 points before departure
      const warningZone = departureThreshold + 15; // 15 points before departure
      const criticalZone = departureThreshold + 5; // 5 points before departure

      let currentLevel: 'caution' | 'warning' | 'critical' | null = null;

      if (companion.affinity <= criticalZone) {
        currentLevel = 'critical';
      } else if (companion.affinity <= warningZone) {
        currentLevel = 'warning';
      } else if (companion.affinity <= cautionZone) {
        currentLevel = 'caution';
      }

      if (!currentLevel) {
        // Clear any existing warning state if they've recovered
        warningsRef.current.delete(companion.id);
        continue;
      }

      const existingWarning = warningsRef.current.get(companion.id);
      
      // Check if we should show a warning
      const shouldWarn = !existingWarning || 
        (now - existingWarning.lastWarningTime > WARNING_COOLDOWN) ||
        (currentLevel === 'critical' && existingWarning.warningLevel !== 'critical') ||
        (currentLevel === 'warning' && existingWarning.warningLevel === 'caution');

      if (shouldWarn) {
        showWarningToast(companion, currentLevel, departureThreshold, betrayalThreshold);
        warningsRef.current.set(companion.id, {
          companionId: companion.id,
          lastWarningTime: now,
          warningLevel: currentLevel,
        });
      }
    }
  }, []);

  useEffect(() => {
    // Initial check
    checkCompanionStatus();
    
    // Periodic checks
    const interval = setInterval(checkCompanionStatus, CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [checkCompanionStatus]);

  return null; // This component only handles toasts
}

// ============================================================================
// TOAST DISPLAY
// ============================================================================

function showWarningToast(
  companion: CompanionState,
  level: 'caution' | 'warning' | 'critical',
  departureThreshold: number,
  betrayalThreshold: number
) {
  const pointsFromDeparture = companion.affinity - departureThreshold;
  const pointsFromBetrayal = companion.affinity - betrayalThreshold;

  switch (level) {
    case 'caution':
      toast.warning(`${companion.name} seems distant`, {
        description: `Affinity: ${companion.affinity} (${pointsFromDeparture} points from leaving)`,
        icon: <Heart className="w-4 h-4 text-orange-500" />,
        duration: 5000,
      });
      break;

    case 'warning':
      toast.warning(`${companion.name} is unhappy with you`, {
        description: `Your relationship is strained. Consider improving it soon.`,
        icon: <UserMinus className="w-4 h-4 text-orange-500" />,
        duration: 7000,
      });
      break;

    case 'critical':
      if (pointsFromBetrayal <= 10) {
        toast.error(`${companion.name} may turn hostile!`, {
          description: `They're on the verge of becoming your enemy. Act fast!`,
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          duration: 10000,
        });
      } else {
        toast.error(`${companion.name} is about to leave!`, {
          description: `Just ${pointsFromDeparture} more points and they'll walk away.`,
          icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
          duration: 10000,
        });
      }
      break;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CompanionWarningToast;
