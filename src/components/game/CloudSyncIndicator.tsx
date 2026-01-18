// ============================================================================
// CLOUD SYNC INDICATOR - Shows save status and Google account info
// Unified with UnifiedSaveArchitecture used by CampaignContext
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  UnifiedSaveArchitecture, 
  UnifiedAccount,
  SyncState,
} from '@/services/unifiedSaveArchitecture';
import { 
  Cloud, 
  CloudOff, 
  Check, 
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

interface CloudSyncIndicatorProps {
  className?: string;
}

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

export function CloudSyncIndicator({ className }: CloudSyncIndicatorProps) {
  const [account, setAccount] = useState<UnifiedAccount>(
    UnifiedSaveArchitecture.getAccount()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(
    account.lastSyncedAt || null
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    // Initialize the architecture
    UnifiedSaveArchitecture.initialize();
    
    // Subscribe to account changes
    const unsubAccount = UnifiedSaveArchitecture.onAccountChange((newAccount) => {
      setAccount(newAccount);
      if (newAccount.lastSyncedAt) {
        setLastSyncTime(newAccount.lastSyncedAt);
      }
    });
    
    // Update relative time every 30 seconds
    const interval = setInterval(() => forceUpdate(n => n + 1), 30000);
    
    return () => {
      unsubAccount();
      clearInterval(interval);
    };
  }, []);

  const handleSync = useCallback(async () => {
    if (account.mode !== 'cloud') return;
    
    setIsSyncing(true);
    setSyncProgress(30);
    
    try {
      const result = await UnifiedSaveArchitecture.syncWithCloud();
      setSyncProgress(100);
      
      if (result.conflicts > 0) {
        toast.warning(`Sync complete with ${result.conflicts} conflict(s)`);
      } else if (result.synced > 0) {
        toast.success(`Synced ${result.synced} campaign(s)`);
      } else {
        toast.success('Everything up to date');
      }
      
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('[CloudSync] Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [account.mode]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await UnifiedSaveArchitecture.signInWithGoogle();
    } catch (error) {
      toast.error('Sign in failed');
    }
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    await UnifiedSaveArchitecture.signOut();
    toast.success('Signed out');
  };

  const isCloud = account.mode === 'cloud';
  const hasConflicts = UnifiedSaveArchitecture.getConflicts().length > 0;

  // Get icon based on state
  const getIcon = () => {
    if (isSigningIn || isSyncing) {
      return <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />;
    }
    if (!isCloud) {
      return <CloudOff className="w-3 h-3 md:w-3.5 md:h-3.5" />;
    }
    if (hasConflicts) {
      return <AlertTriangle className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-500" />;
    }
    if (lastSyncTime && Date.now() - lastSyncTime < 60000) {
      return <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-green-500" />;
    }
    return <Cloud className="w-3 h-3 md:w-3.5 md:h-3.5" />;
  };

  // Get status color
  const getStatusColor = () => {
    if (!isCloud) return 'text-muted-foreground/50';
    if (hasConflicts) return 'text-yellow-500';
    if (lastSyncTime && Date.now() - lastSyncTime < 60000) return 'text-green-500';
    if (isSyncing) return 'text-primary';
    return 'text-muted-foreground';
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!isCloud) return 'Guest mode - Sign in to sync';
    if (isSyncing) return `Syncing...`;
    if (hasConflicts) return 'Sync conflicts detected';
    if (lastSyncTime) return `Synced as ${account.email}`;
    return account.email || 'Cloud sync';
  };

  // Pulsing animation class when syncing
  const getPulseClass = () => {
    if (isSyncing) {
      return 'animate-pulse ring-2 ring-primary/50 ring-offset-1 ring-offset-background';
    }
    return '';
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 md:h-7 md:w-7 flex-shrink-0 frosted-button transition-all duration-300 ${getStatusColor()} ${getPulseClass()} ${className}`}
                disabled={isSigningIn}
              >
                {getIcon()}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56 bg-popover/95 backdrop-blur-sm border-border">
        {/* Account Status */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            {isCloud ? (
              <>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {account.avatarUrl ? (
                    <img 
                      src={account.avatarUrl} 
                      alt="Avatar" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {account.displayName || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {account.email}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <CloudOff className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Guest Mode</p>
                  <p className="text-xs text-muted-foreground">Local saves only</p>
                </div>
              </>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Sync Status with Progress */}
        <div className="px-2 py-1.5 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            {isSyncing ? (
              <>
                <div className="relative">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
                </div>
                <span className="text-primary font-medium">Syncing...</span>
              </>
            ) : hasConflicts ? (
              <>
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span className="text-yellow-500">Conflicts detected</span>
              </>
            ) : lastSyncTime && Date.now() - lastSyncTime < 60000 ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">All changes saved</span>
              </>
            ) : !isCloud ? (
              <>
                <CloudOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Sign in to enable cloud sync</span>
              </>
            ) : (
              <>
                <Cloud className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Ready</span>
              </>
            )}
          </div>
          
          {/* Progress bar when syncing */}
          {isSyncing && syncProgress > 0 && (
            <Progress value={syncProgress} className="h-1.5" />
          )}
        </div>

        {/* Last Sync Time */}
        {isCloud && lastSyncTime && (
          <>
            <div className="px-2 py-1 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Last synced: {formatRelativeTime(lastSyncTime)}</span>
              </div>
            </div>
          </>
        )}

        <DropdownMenuSeparator />

        {/* Actions */}
        {isCloud ? (
          <>
            <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync now
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleSignIn} disabled={isSigningIn}>
            <LogIn className="w-4 h-4 mr-2" />
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
