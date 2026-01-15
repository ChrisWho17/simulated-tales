// ============================================================================
// CAMPAIGN GAME WRAPPER - Cloud-first, no migration prompts
// ============================================================================

import { useState, useEffect } from 'react';
import { AdventureGame } from './AdventureGame';
import { SaveSystemDiagnostics } from '@/components/debug/SaveSystemDiagnostics';

export function CampaignGameWrapper() {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  
  // Register keyboard shortcut for diagnostics (Ctrl+Shift+D)
  useEffect(() => {
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
      
      {/* Save system diagnostics (toggle with Ctrl+Shift+D) */}
      <SaveSystemDiagnostics 
        isOpen={showDiagnostics} 
        onClose={() => setShowDiagnostics(false)} 
      />
    </>
  );
}
