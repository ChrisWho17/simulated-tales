// ============================================================================
// CAMPAIGN SYNC STATUS - Real-time sync status badge for individual campaigns
// Uses UnifiedSaveArchitecture for consistent state
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UnifiedSaveArchitecture, 
  SyncState,
  CampaignSyncStatus as SyncStatusType 
} from '@/services/unifiedSaveArchitecture';
import { Cloud, CloudOff, Upload, Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignSyncStatusProps {
  campaignId: string;
  variant?: 'badge' | 'icon' | 'compact';
  showUpload?: boolean;
  className?: string;
}

const STATE_CONFIG: Record<SyncState, {
  icon: React.ReactNode;
  color: string;
  label: string;
  tooltip: string;
}> = {
  synced: {
    icon: <Cloud className="h-3 w-3" />,
    color: 'text-green-500',
    label: 'Synced',
    tooltip: 'Saved to cloud',
  },
  pending: {
    icon: <RefreshCw className="h-3 w-3 animate-spin" />,
    color: 'text-yellow-500',
    label: 'Syncing...',
    tooltip: 'Syncing to cloud...',
  },
  conflict: {
    icon: <AlertCircle className="h-3 w-3" />,
    color: 'text-orange-500',
    label: 'Conflict',
    tooltip: 'Sync conflict detected - resolve in settings',
  },
  error: {
    icon: <AlertCircle className="h-3 w-3" />,
    color: 'text-red-500',
    label: 'Error',
    tooltip: 'Sync failed - will retry',
  },
  offline: {
    icon: <CloudOff className="h-3 w-3" />,
    color: 'text-muted-foreground',
    label: 'Local',
    tooltip: 'Sign in to enable cloud sync',
  },
};

export function CampaignSyncStatus({ 
  campaignId, 
  variant = 'badge',
  showUpload = true,
  className 
}: CampaignSyncStatusProps) {
  const [syncState, setSyncState] = useState<SyncState>('offline');
  const [isUploading, setIsUploading] = useState(false);
  const [isCloudMode, setIsCloudMode] = useState(false);

  useEffect(() => {
    // Check initial state
    const account = UnifiedSaveArchitecture.getAccount();
    setIsCloudMode(account.mode === 'cloud');
    
    // Get initial sync status
    const status = UnifiedSaveArchitecture.getSyncStatus(campaignId);
    if (status) {
      setSyncState(status.state);
    } else if (account.mode === 'cloud') {
      setSyncState('synced'); // Assume synced if no specific status
    } else {
      setSyncState('offline');
    }
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((newAccount) => {
      setIsCloudMode(newAccount.mode === 'cloud');
      if (newAccount.mode !== 'cloud') {
        setSyncState('offline');
      }
    });
    
    // Subscribe to sync status changes for this campaign
    const unsubSync = UnifiedSaveArchitecture.onSyncStatusChange((status) => {
      if (status.campaignId === campaignId) {
        setSyncState(status.state);
      }
    });
    
    return () => {
      unsubAccount();
      unsubSync();
    };
  }, [campaignId]);

  const handleForceSync = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCloudMode) return;
    
    setIsUploading(true);
    setSyncState('pending');
    
    try {
      const campaign = await UnifiedSaveArchitecture.loadCampaign(campaignId);
      if (campaign) {
        const result = await UnifiedSaveArchitecture.saveCampaign(campaign);
        if (result.syncedToCloud) {
          setSyncState('synced');
        } else if (result.error) {
          setSyncState('error');
        }
      }
    } catch {
      setSyncState('error');
    } finally {
      setIsUploading(false);
    }
  }, [campaignId, isCloudMode]);

  const config = STATE_CONFIG[syncState];

  // Compact variant - just a small icon
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex', config.color, className)}>
              {isUploading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                config.icon
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Icon variant with optional upload button
  if (variant === 'icon') {
    if (!isCloudMode) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <CloudOff className={cn('h-4 w-4 text-muted-foreground', className)} />
            </TooltipTrigger>
            <TooltipContent>
              <p>Sign in to enable cloud sync</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex', className)}>
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : syncState === 'pending' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-yellow-500" />
              ) : syncState === 'synced' ? (
                <Cloud className="h-4 w-4 text-green-500" />
              ) : syncState === 'conflict' || syncState === 'error' ? (
                showUpload ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleForceSync}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                ) : (
                  <AlertCircle className={cn('h-4 w-4', config.color)} />
                )
              ) : (
                <CloudOff className="h-4 w-4 text-muted-foreground" />
              )}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default badge variant
  if (!isCloudMode) {
    return (
      <Badge variant="outline" className={cn('text-xs text-muted-foreground gap-1', className)}>
        <CloudOff className="h-3 w-3" />
        Local
      </Badge>
    );
  }

  if (syncState === 'synced') {
    return (
      <Badge variant="secondary" className={cn('text-xs gap-1', className)}>
        <Cloud className="h-3 w-3 text-green-500" />
        Cloud
      </Badge>
    );
  }

  if (syncState === 'pending') {
    return (
      <Badge variant="secondary" className={cn('text-xs gap-1', className)}>
        <RefreshCw className="h-3 w-3 animate-spin text-yellow-500" />
        Syncing
      </Badge>
    );
  }

  if (syncState === 'conflict') {
    return (
      <Badge variant="outline" className={cn('text-xs gap-1 border-orange-500/50 text-orange-400', className)}>
        <AlertCircle className="h-3 w-3" />
        Conflict
      </Badge>
    );
  }

  if (syncState === 'error' && showUpload) {
    return (
      <Badge 
        variant="outline" 
        className={cn('text-xs gap-1 cursor-pointer hover:bg-muted', className)}
        onClick={handleForceSync}
      >
        {isUploading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
        Retry
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={cn('text-xs gap-1 text-muted-foreground', className)}>
      <CloudOff className="h-3 w-3" />
      Local
    </Badge>
  );
}