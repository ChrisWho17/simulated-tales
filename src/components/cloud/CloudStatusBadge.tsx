// ============================================================================
// CLOUD STATUS BADGE - Compact sync status indicator with last sync time
// ============================================================================

import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  Check,
  Clock
} from 'lucide-react';
import { SyncState } from '@/services/unifiedSaveArchitecture';
import { cn } from '@/lib/utils';

interface CloudStatusBadgeProps {
  state: SyncState;
  lastSyncedAt: number | null;
  conflictCount?: number;
  isSyncing?: boolean;
  onSyncClick?: () => void;
  className?: string;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

const stateConfig: Record<SyncState, {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  pulseClass?: string;
}> = {
  synced: {
    icon: <Check className="w-3.5 h-3.5" />,
    label: 'Synced',
    colorClass: 'text-green-400',
  },
  pending: {
    icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
    label: 'Syncing...',
    colorClass: 'text-amber-400',
    pulseClass: 'animate-pulse',
  },
  conflict: {
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Conflicts',
    colorClass: 'text-red-400',
    pulseClass: 'animate-pulse',
  },
  error: {
    icon: <CloudOff className="w-3.5 h-3.5" />,
    label: 'Sync Error',
    colorClass: 'text-red-400',
  },
  offline: {
    icon: <CloudOff className="w-3.5 h-3.5" />,
    label: 'Local Only',
    colorClass: 'text-muted-foreground',
  },
};

export function CloudStatusBadge({ 
  state, 
  lastSyncedAt, 
  conflictCount = 0,
  isSyncing = false,
  onSyncClick,
  className 
}: CloudStatusBadgeProps) {
  // Override state display when actively syncing
  const displayState = isSyncing ? 'pending' : state;
  const config = stateConfig[displayState];
  
  const tooltipContent = (
    <div className="space-y-1">
      <div className="flex items-center gap-2 font-medium">
        <Cloud className="w-4 h-4" />
        {config.label}
      </div>
      {lastSyncedAt && displayState !== 'offline' && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Last synced: {formatRelativeTime(lastSyncedAt)}
        </div>
      )}
      {conflictCount > 0 && (
        <div className="text-xs text-amber-400">
          {conflictCount} conflict{conflictCount > 1 ? 's' : ''} need resolution
        </div>
      )}
      {displayState === 'offline' && (
        <div className="text-xs text-muted-foreground">
          Sign in to enable cloud sync
        </div>
      )}
    </div>
  );
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onSyncClick}
            disabled={displayState === 'offline' || isSyncing}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200',
              'bg-black/20 border border-border/30',
              'hover:bg-black/30 hover:border-primary/30',
              'disabled:cursor-default disabled:hover:bg-black/20 disabled:hover:border-border/30',
              config.colorClass,
              config.pulseClass,
              className
            )}
          >
            {config.icon}
            {lastSyncedAt && displayState === 'synced' && (
              <span className="text-xs opacity-70">
                {formatRelativeTime(lastSyncedAt)}
              </span>
            )}
            {conflictCount > 0 && (
              <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white">
                {conflictCount}
              </span>
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CloudStatusBadge;
