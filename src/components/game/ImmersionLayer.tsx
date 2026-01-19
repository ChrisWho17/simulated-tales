// ============================================================================
// IMMERSION LAYER - Wrapper component that adds all immersion UI elements
// Includes: ConsequenceFeed, FloatingStatChanges, Screen Effects
// ============================================================================

import { ReactNode } from 'react';
import { ScreenEffectsProvider } from './ScreenEffects';
import { ConsequenceFeed } from './ConsequenceFeed';
import { FloatingStatContainer, StatChange } from './FloatingStatChange';
import { AmbientFeed } from './AmbientFeed';

interface ImmersionLayerProps {
  children: ReactNode;
  // Stat changes to display
  statChanges?: StatChange[];
  onRemoveStatChange?: (id: string) => void;
  // Feature toggles
  showConsequenceFeed?: boolean;
  showFloatingStats?: boolean;
  showAmbientFeed?: boolean;
  // Styling
  consequenceFeedPosition?: 'top-right' | 'top-left';
  floatingStatsPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
}

export function ImmersionLayer({
  children,
  statChanges = [],
  onRemoveStatChange,
  showConsequenceFeed = true,
  showFloatingStats = true,
  showAmbientFeed = false,
  consequenceFeedPosition = 'top-right',
  floatingStatsPosition = 'center',
}: ImmersionLayerProps) {
  return (
    <ScreenEffectsProvider>
      {/* Main content */}
      {children}
      
      {/* Consequence Feed - shows relationship, inventory, combat notifications */}
      {showConsequenceFeed && (
        <ConsequenceFeed 
          maxEntries={6}
          compact
          className={consequenceFeedPosition === 'top-left' ? 'left-4 right-auto' : undefined}
        />
      )}
      
      {/* Floating Stat Changes - gold, XP, health popups */}
      {showFloatingStats && onRemoveStatChange && (
        <FloatingStatContainer
          changes={statChanges}
          onRemove={onRemoveStatChange}
          position={floatingStatsPosition}
        />
      )}
      
      {/* Ambient Feed - micro-events and NPC chatter */}
      {showAmbientFeed && (
        <AmbientFeed
          position="bottom-left"
          maxVisible={3}
          autoHide
          autoHideDelay={10000}
        />
      )}
    </ScreenEffectsProvider>
  );
}

export default ImmersionLayer;
