// ============================================================================
// CLOUD SYNC INDICATOR - Small indicator showing sync status in game UI
// Now unified with UnifiedSaveArchitecture
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  UnifiedSaveArchitecture, 
  UnifiedAccount,
} from '@/services/unifiedSaveArchitecture';
import { AuthModal } from './AuthModal';
import { 
  Cloud, 
  CloudOff, 
  Check, 
  AlertTriangle,
  Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

interface CloudSyncIndicatorProps {
  variant?: 'icon' | 'badge';
  className?: string;
}

export function CloudSyncIndicator({ variant = 'icon', className }: CloudSyncIndicatorProps) {
  const [account, setAccount] = useState<UnifiedAccount>(
    UnifiedSaveArchitecture.getAccount()
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(account.lastSyncedAt || null);

  useEffect(() => {
    // Initialize the architecture
    UnifiedSaveArchitecture.initialize();
    
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((newAccount) => {
      setAccount(newAccount);
      if (newAccount.lastSyncedAt) {
        setLastSync(newAccount.lastSyncedAt);
      }
    });
    
    return () => {
      unsubAccount();
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (account.mode !== 'cloud') {
      setShowAuthModal(true);
      return;
    }

    setIsSyncing(true);
    try {
      const result = await UnifiedSaveArchitecture.syncWithCloud();
      
      if (result.conflicts > 0) {
        toast.warning(`Sync complete with ${result.conflicts} conflict(s)`);
      } else if (result.synced > 0) {
        toast.success(`Synced ${result.synced} campaign(s)`);
      } else {
        toast.success('Everything up to date');
      }
      
      setLastSync(Date.now());
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [account.mode]);

  const isCloud = account.mode === 'cloud';
  const hasConflicts = UnifiedSaveArchitecture.getConflicts().length > 0;
  const isSynced = lastSync && Date.now() - lastSync < 60000;

  const getIcon = () => {
    if (isSyncing) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (!isCloud) {
      return <CloudOff className="h-4 w-4" />;
    }
    if (hasConflicts) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    if (isSynced) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  const getTooltipText = () => {
    if (!isCloud) return 'Click to enable cloud sync';
    if (isSyncing) return 'Syncing...';
    if (hasConflicts) return 'Conflicts detected';
    if (isSynced && lastSync) {
      return `Last synced ${formatRelativeTime(lastSync)}`;
    }
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
              disabled={isSyncing}
            >
              {getIcon()}
              {variant === 'badge' && (
                <span className="ml-1 text-xs">
                  {!isCloud ? 'Sync' : isSynced ? 'Synced' : 'Sync'}
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
