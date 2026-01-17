// ============================================================================
// STARTUP INTEGRITY CHECK - Silent background scan with notification on issues
// ============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { DataIntegrityService, IntegrityReport } from '@/services/dataIntegrityService';
import { toast } from 'sonner';

interface StartupIntegrityResult {
  hasRun: boolean;
  report: IntegrityReport | null;
  isScanning: boolean;
  hasIssues: boolean;
  openIntegrityPanel: () => void;
}

// Global flag to ensure we only run once per session
let hasRunThisSession = false;

export function useStartupIntegrityCheck(
  onOpenIntegrityPanel?: () => void
): StartupIntegrityResult {
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasRun, setHasRun] = useState(hasRunThisSession);
  const panelOpenerRef = useRef(onOpenIntegrityPanel);
  
  useEffect(() => {
    panelOpenerRef.current = onOpenIntegrityPanel;
  }, [onOpenIntegrityPanel]);

  const openIntegrityPanel = useCallback(() => {
    panelOpenerRef.current?.();
  }, []);

  useEffect(() => {
    // Only run once per session
    if (hasRunThisSession) {
      return;
    }
    
    // Delay startup check to not interfere with initial app load
    const timeout = setTimeout(async () => {
      hasRunThisSession = true;
      setHasRun(true);
      setIsScanning(true);
      
      try {
        console.log('[StartupIntegrity] Running background integrity check...');
        const result = await DataIntegrityService.runFullScan();
        setReport(result);
        
        const issueCount = result.corrupted + result.unrecoverable;
        
        if (issueCount > 0) {
          // Show notification for issues
          const message = result.unrecoverable > 0
            ? `${result.unrecoverable} campaign(s) may have data issues that need attention`
            : `${result.corrupted} campaign(s) were automatically repaired`;
          
          toast.warning('Save Data Check Complete', {
            description: message,
            duration: 8000,
            action: {
              label: 'View Details',
              onClick: () => panelOpenerRef.current?.(),
            },
          });
          
          console.log(`[StartupIntegrity] Found issues: ${result.corrupted} corrupted, ${result.unrecoverable} unrecoverable`);
        } else if (result.repaired > 0) {
          // Silent success for repairs
          console.log(`[StartupIntegrity] Auto-repaired ${result.repaired} campaigns`);
        } else {
          console.log(`[StartupIntegrity] All ${result.valid} campaigns healthy`);
        }
      } catch (error) {
        console.error('[StartupIntegrity] Check failed:', error);
      } finally {
        setIsScanning(false);
      }
    }, 3000); // 3 second delay to let app initialize
    
    return () => clearTimeout(timeout);
  }, []);

  const hasIssues = report 
    ? (report.corrupted > 0 || report.unrecoverable > 0) 
    : false;

  return {
    hasRun,
    report,
    isScanning,
    hasIssues,
    openIntegrityPanel,
  };
}
