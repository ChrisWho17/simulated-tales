// ============================================================================
// STARTUP INTEGRITY MONITOR - Background component for auto integrity check
// ============================================================================

import React, { useState, useCallback } from 'react';
import { useStartupIntegrityCheck } from '@/hooks/useStartupIntegrityCheck';
import { DataIntegrityPanel } from '@/components/adventure/DataIntegrityPanel';

export const StartupIntegrityMonitor: React.FC = () => {
  const [showPanel, setShowPanel] = useState(false);
  
  const handleOpenPanel = useCallback(() => {
    setShowPanel(true);
  }, []);
  
  // Run the startup check
  useStartupIntegrityCheck(handleOpenPanel);
  
  return (
    <DataIntegrityPanel 
      open={showPanel} 
      onClose={() => setShowPanel(false)} 
    />
  );
};

export default StartupIntegrityMonitor;
