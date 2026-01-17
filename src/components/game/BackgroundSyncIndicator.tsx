// ============================================================================
// BACKGROUND SYNC INDICATOR - Shows sync status in game UI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2, AlertCircle, Check, Wifi, WifiOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BackgroundSyncManager, type BackgroundSyncStatus } from '@/services/backgroundSyncManager';
import { cn } from '@/lib/utils';

interface BackgroundSyncIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const BackgroundSyncIndicator: React.FC<BackgroundSyncIndicatorProps> = ({
  className,
  showDetails = false,
  compact = false,
}) => {
  const [status, setStatus] = useState<BackgroundSyncStatus>(BackgroundSyncManager.getStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = BackgroundSyncManager.onStatusChange(setStatus);
    return unsubscribe;
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await BackgroundSyncManager.forceSyncNow();
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return <WifiOff className="h-4 w-4 text-muted-foreground" />;
    }
    
    if (status.progress.inProgress || isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    }
    
    if (status.queueSize > 0) {
      return <Cloud className="h-4 w-4 text-amber-500" />;
    }
    
    if (status.isPaused) {
      return <CloudOff className="h-4 w-4 text-muted-foreground" />;
    }
    
    return <Check className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.progress.inProgress) {
      const current = status.progress.currentOperation || 'syncing';
      return `Syncing: ${current}`;
    }
    
    if (isSyncing) {
      return 'Syncing...';
    }
    
    if (status.queueSize > 0) {
      return `${status.queueSize} pending`;
    }
    
    if (status.isPaused) {
      return 'Sync paused';
    }
    
    if (status.lastSyncTime) {
      const ago = Date.now() - status.lastSyncTime;
      if (ago < 60000) return 'Synced just now';
      if (ago < 3600000) return `Synced ${Math.floor(ago / 60000)}m ago`;
      return `Synced ${Math.floor(ago / 3600000)}h ago`;
    }
    
    return 'All synced';
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-muted';
    if (status.progress.inProgress || isSyncing) return 'bg-primary/10';
    if (status.queueSize > 0) return 'bg-amber-500/10';
    if (status.isPaused) return 'bg-muted';
    return 'bg-green-500/10';
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', className)}>
              {getStatusIcon()}
              {status.queueSize > 0 && (
                <span className="text-xs text-muted-foreground">{status.queueSize}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getStatusText()}</p>
            {status.queueSize > 0 && !status.isOnline && (
              <p className="text-xs text-muted-foreground">
                Will sync when back online
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge variant="outline" className={cn('gap-1.5 px-2 py-1', getStatusColor())}>
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {showDetails && (
        <>
          {status.progress.inProgress && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{status.progress.completed}/{status.progress.total}</span>
              {status.progress.failed > 0 && (
                <span className="text-destructive">({status.progress.failed} failed)</span>
              )}
            </div>
          )}
          
          {status.queueSize > 0 && status.isOnline && !status.progress.inProgress && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleForceSync}
              disabled={isSyncing}
              className="h-6 px-2 text-xs"
            >
              Sync now
            </Button>
          )}
        </>
      )}
    </div>
  );
};

// ============================================================================
// Offline Queue Panel - Shows pending operations
// ============================================================================

export const OfflineQueuePanel: React.FC<{ className?: string }> = ({ className }) => {
  const [status, setStatus] = useState<BackgroundSyncStatus>(BackgroundSyncManager.getStatus());
  const [operations, setOperations] = useState(BackgroundSyncManager.getQueuedOperations());

  useEffect(() => {
    const unsubscribe = BackgroundSyncManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setOperations(BackgroundSyncManager.getQueuedOperations());
    });
    return unsubscribe;
  }, []);

  if (operations.length === 0) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        <Cloud className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No pending sync operations</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium">Pending Sync</h3>
        <Badge variant="secondary" className="text-xs">
          {operations.length} items
        </Badge>
      </div>
      
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {operations.map((op) => (
          <div
            key={op.id}
            className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
          >
            {op.type === 'save' && <Cloud className="h-4 w-4 text-primary" />}
            {op.type === 'delete' && <AlertCircle className="h-4 w-4 text-destructive" />}
            
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">
                {op.metadata?.campaignName || op.campaignId}
              </p>
              <p className="text-xs text-muted-foreground">
                {op.type} • {op.retryCount > 0 ? `Retry ${op.retryCount}` : 'Pending'}
              </p>
            </div>
            
            {op.lastError && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-xs">{op.lastError}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        ))}
      </div>
      
      {!status.isOnline && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 text-amber-600">
          <WifiOff className="h-4 w-4" />
          <p className="text-xs">You're offline. Changes will sync when connection is restored.</p>
        </div>
      )}
    </div>
  );
};

export default BackgroundSyncIndicator;
