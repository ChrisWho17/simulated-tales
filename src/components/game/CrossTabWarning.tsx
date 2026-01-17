// ============================================================================
// CROSS-TAB WARNING - Display conflicts and sync status
// ============================================================================

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Monitor, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CrossTabSync, ConflictWarning, TabRole } from '@/systems/CrossTabSync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CrossTabWarningProps {
  className?: string;
}

export const CrossTabWarning: React.FC<CrossTabWarningProps> = ({ className }) => {
  const [tabCount, setTabCount] = useState(1);
  const [role, setRole] = useState<TabRole>('unknown');
  const [latestWarning, setLatestWarning] = useState<ConflictWarning | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const unsubRole = CrossTabSync.onRoleChange(setRole);
    const unsubCount = CrossTabSync.onTabCountChange(setTabCount);
    const unsubConflict = CrossTabSync.onConflict((warning) => {
      setLatestWarning(warning);
      setShowBanner(true);

      // Also show toast for immediate feedback
      if (warning.type === 'stale_data') {
        toast.warning(warning.message, {
          action: {
            label: 'Reload',
            onClick: () => window.location.reload(),
          },
        });
      } else if (warning.type === 'save_blocked') {
        toast.error(warning.message);
      } else {
        toast.warning(warning.message);
      }
    });

    return () => {
      unsubRole();
      unsubCount();
      unsubConflict();
    };
  }, []);

  // Only show if multiple tabs detected or there's an active warning
  if (tabCount <= 1 && !showBanner) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Tab Count Indicator (subtle) */}
      {tabCount > 1 && !showBanner && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
          <Monitor className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400">
            {tabCount} tabs open
            {role === 'secondary' && ' (syncing)'}
          </span>
        </div>
      )}

      {/* Warning Banner */}
      {showBanner && latestWarning && (
        <div className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border',
          latestWarning.type === 'stale_data'
            ? 'bg-amber-500/10 border-amber-500/30'
            : latestWarning.type === 'save_blocked'
            ? 'bg-destructive/10 border-destructive/30'
            : 'bg-muted border-border'
        )}>
          <AlertTriangle className={cn(
            'h-5 w-5 shrink-0',
            latestWarning.type === 'stale_data' ? 'text-amber-500' :
            latestWarning.type === 'save_blocked' ? 'text-destructive' :
            'text-muted-foreground'
          )} />
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {latestWarning.type === 'stale_data' && 'Data Changed in Another Tab'}
              {latestWarning.type === 'save_blocked' && 'Save Blocked'}
              {latestWarning.type === 'campaign_in_use' && 'Campaign Open Elsewhere'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {latestWarning.message}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {latestWarning.type === 'stale_data' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reload
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setShowBanner(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact indicator for header
export const CrossTabIndicator: React.FC = () => {
  const [tabCount, setTabCount] = useState(1);

  useEffect(() => {
    const unsub = CrossTabSync.onTabCountChange(setTabCount);
    return unsub;
  }, []);

  if (tabCount <= 1) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-xs"
      title={`${tabCount} tabs have this game open`}
    >
      <Monitor className="h-3.5 w-3.5 text-amber-500" />
      <span className="text-amber-600 dark:text-amber-400">{tabCount}</span>
    </div>
  );
};

export default CrossTabWarning;
