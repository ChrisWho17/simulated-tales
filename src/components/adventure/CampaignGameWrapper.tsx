// ============================================================================
// CAMPAIGN GAME WRAPPER - Cloud-first, no migration prompts
// ============================================================================

import { useState, useEffect } from 'react';
import { AdventureGame } from './AdventureGame';
import { SaveSystemDiagnostics } from '@/components/debug/SaveSystemDiagnostics';
import { isDiagnosticsHotkeyEnabled } from '@/lib/devTools';

export function CampaignGameWrapper() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Workshop / Creators Mark only — keeps Ctrl+Shift+D off the public play surface
  useEffect(() => {
    if (!isDiagnosticsHotkeyEnabled()) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDiagnostics(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <>
      <AdventureGame />
      
      {isDiagnosticsHotkeyEnabled() && (
        <SaveSystemDiagnostics 
          isOpen={showDiagnostics} 
          onClose={() => setShowDiagnostics(false)} 
        />
      )}
    </>
  );
}
