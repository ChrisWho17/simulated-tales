// ============================================================================
// SYNC STATUS BADGE - Visual indicator for campaign sync state
// Phase 2: Clear sync status display
// ============================================================================

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  WifiOff,
  Check
} from 'lucide-react';
import { SyncState } from '@/services/unifiedSaveArchitecture';
import { cn } from '@/lib/utils';

interface SyncStatusBadgeProps {
  state: SyncState;
  className?: string;
  showLabel?: boolean;
}

const stateConfig: Record<SyncState, {
  icon: React.ReactNode;
  label: string;
  description: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  colorClass: string;
}> = {
  synced: {
    icon: <Check className="w-3 h-3" />,
    label: 'Synced',
    description: 'This campaign is synced with the cloud',
    variant: 'secondary',
    colorClass: 'text-green-500 border-green-500/50',
  },
  pending: {
    icon: <RefreshCw className="w-3 h-3 animate-spin" />,
    label: 'Pending',
    description: 'Changes waiting to sync to cloud',
    variant: 'outline',
    colorClass: 'text-amber-500 border-amber-500/50',
  },
  conflict: {
    icon: <AlertTriangle className="w-3 h-3" />,
    label: 'Conflict',
    description: 'Local and cloud versions differ - action needed',
    variant: 'destructive',
    colorClass: 'text-red-500 border-red-500/50',
  },
  error: {
    icon: <CloudOff className="w-3 h-3" />,
    label: 'Error',
    description: 'Failed to sync with cloud',
    variant: 'destructive',
    colorClass: 'text-red-500 border-red-500/50',
  },
  offline: {
    icon: <WifiOff className="w-3 h-3" />,
    label: 'Offline',
    description: 'No internet connection - saves stored locally',
    variant: 'outline',
    colorClass: 'text-muted-foreground border-muted',
  },
};

export function SyncStatusBadge({ state, className, showLabel = false }: SyncStatusBadgeProps) {
  const config = stateConfig[state];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant={config.variant}
          className={cn(
            'gap-1 cursor-help',
            config.colorClass,
            className
          )}
        >
          {config.icon}
          {showLabel && <span>{config.label}</span>}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Compact version for inline use
export function SyncStatusIcon({ state, className }: { state: SyncState; className?: string }) {
  const config = stateConfig[state];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', config.colorClass, className)}>
          {config.icon}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{config.label}</p>
        <p className="text-xs text-muted-foreground">{config.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}
