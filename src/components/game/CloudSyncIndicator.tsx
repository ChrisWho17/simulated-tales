// ============================================================================
// CLOUD SYNC INDICATOR - Shows save status and Google account info
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  UnifiedSaveService, 
  SaveAccount, 
  SyncStatus 
} from '@/services/unifiedSaveService';
import { 
  Cloud, 
  CloudOff, 
  Check, 
  AlertTriangle,
  Loader2,
  LogIn,
  LogOut,
  User
} from 'lucide-react';
import { toast } from 'sonner';

interface CloudSyncIndicatorProps {
  className?: string;
}

export function CloudSyncIndicator({ className }: CloudSyncIndicatorProps) {
  const [account, setAccount] = useState<SaveAccount>(UnifiedSaveService.getAccount());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(UnifiedSaveService.getStatus());
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubAccount = UnifiedSaveService.onAccountChange(setAccount);
    const unsubStatus = UnifiedSaveService.onStatusChange(setSyncStatus);
    
    return () => {
      unsubAccount();
      unsubStatus();
    };
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await UnifiedSaveService.signInWithGoogle();
    } catch (error) {
      toast.error('Sign in failed');
    }
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    await UnifiedSaveService.signOut();
    toast.success('Signed out');
  };

  const isCloud = account.mode === 'cloud';
  const isSyncing = syncStatus === 'syncing';
  const isSynced = syncStatus === 'synced';
  const hasError = syncStatus === 'error';

  // Get icon based on state
  const getIcon = () => {
    if (isSigningIn || isSyncing) {
      return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    }
    if (!isCloud) {
      return <CloudOff className="w-3.5 h-3.5" />;
    }
    if (hasError) {
      return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
    }
    if (isSynced) {
      return <Check className="w-3.5 h-3.5 text-green-500" />;
    }
    return <Cloud className="w-3.5 h-3.5" />;
  };

  // Get status color
  const getStatusColor = () => {
    if (!isCloud) return 'text-muted-foreground/50';
    if (hasError) return 'text-destructive';
    if (isSynced) return 'text-green-500';
    if (isSyncing) return 'text-primary';
    return 'text-muted-foreground';
  };

  // Get tooltip text
  const getTooltipText = () => {
    if (!isCloud) return 'Guest mode - Sign in to sync';
    if (isSyncing) return 'Syncing...';
    if (isSynced) return `Synced as ${account.email}`;
    if (hasError) return 'Sync error';
    return account.email || 'Cloud sync';
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
                className={`h-7 w-7 flex-shrink-0 frosted-button ${getStatusColor()} ${className}`}
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

      <DropdownMenuContent align="end" className="w-56">
        {/* Account Status */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            {isCloud ? (
              <>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
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

        {/* Sync Status */}
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2 text-xs">
            {isSyncing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-muted-foreground">Syncing...</span>
              </>
            ) : isSynced ? (
              <>
                <Check className="w-3 h-3 text-green-500" />
                <span className="text-muted-foreground">All changes saved</span>
              </>
            ) : hasError ? (
              <>
                <AlertTriangle className="w-3 h-3 text-destructive" />
                <span className="text-destructive">Sync error</span>
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
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        {isCloud ? (
          <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
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
