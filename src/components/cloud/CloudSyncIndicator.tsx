// ============================================================================
// CLOUD SYNC INDICATOR - Small indicator showing sync status in game UI
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { CloudSyncService, SyncStatus } from '@/services/cloudSyncService';
import { AuthModal } from './AuthModal';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Check, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { formatLastPlayed } from '@/lib/campaignStorage';
import { toast } from 'sonner';

interface CloudSyncIndicatorProps {
  variant?: 'icon' | 'badge';
  className?: string;
}

export function CloudSyncIndicator({ variant = 'icon', className }: CloudSyncIndicatorProps) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    return CloudSyncService.onStatusChange((status) => {
      setSyncStatus(status);
      if (status !== 'syncing') {
        setLastSync(CloudSyncService.getLastSyncTime());
      }
    });
  }, []);

  const handleSync = async () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    setIsSyncing(true);
    const result = await CloudSyncService.fullSync();
    
    if (result.success && result.errors.length === 0) {
      toast.success('Sync complete');
    } else if (result.errors.length > 0) {
      toast.error(result.errors[0]);
    }
    
    setIsSyncing(false);
  };

  const getIcon = () => {
    if (authLoading || isSyncing || syncStatus === 'syncing') {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (!isAuthenticated) {
      return <CloudOff className="h-4 w-4" />;
    }
    switch (syncStatus) {
      case 'synced':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Cloud className="h-4 w-4" />;
    }
  };

  const getTooltipText = () => {
    if (!isAuthenticated) return 'Click to enable cloud sync';
    if (syncStatus === 'syncing' || isSyncing) return 'Syncing...';
    if (syncStatus === 'synced' && lastSync) {
      return `Last synced ${formatLastPlayed(lastSync)}`;
    }
    if (syncStatus === 'error') return 'Sync error - click to retry';
    if (syncStatus === 'conflict') return 'Conflicts detected';
    return 'Click to sync';
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={variant === 'icon' ? 'icon' : 'sm'}
              className={className}
              onClick={handleSync}
              disabled={isSyncing || syncStatus === 'syncing'}
            >
              {getIcon()}
              {variant === 'badge' && (
                <span className="ml-1 text-xs">
                  {!isAuthenticated ? 'Sync' : syncStatus === 'synced' ? 'Synced' : 'Sync'}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </>
  );
}
