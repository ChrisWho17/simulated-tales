// ============================================================================
// STORAGE HEALTH INDICATOR - Visual status for storage health
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  CloudOff, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Database,
  Shield,
  Clock
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StorageHealthMonitor, StorageHealth } from '@/systems/StorageHealthMonitor';
import { cn } from '@/lib/utils';

export const StorageHealthIndicator: React.FC = () => {
  const [health, setHealth] = useState<StorageHealth | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Subscribe to health changes
    const unsubscribe = StorageHealthMonitor.onHealthChange(setHealth);
    
    // Get initial health
    const initialHealth = StorageHealthMonitor.getHealth();
    if (initialHealth) {
      setHealth(initialHealth);
    }

    return unsubscribe;
  }, []);

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      await StorageHealthMonitor.triggerManualBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  const getStatusIcon = () => {
    if (!health) return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    
    switch (health.status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'critical':
        return <CloudOff className="h-4 w-4 text-destructive" />;
      default:
        return <HardDrive className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    if (!health) return 'bg-muted';
    switch (health.status) {
      case 'healthy': return 'bg-green-500/10 hover:bg-green-500/20 border-green-500/30';
      case 'warning': return 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30';
      case 'critical': return 'bg-destructive/10 hover:bg-destructive/20 border-destructive/30';
      default: return 'bg-muted';
    }
  };

  const getQuotaColor = (percent: number) => {
    if (percent >= 95) return 'text-destructive';
    if (percent >= 80) return 'text-amber-500';
    return 'text-green-500';
  };

  if (!health) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-border/50 bg-muted/50 text-xs text-muted-foreground">
        <HardDrive className="h-3.5 w-3.5 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors',
            getStatusColor()
          )}
          title="Storage Health"
        >
          {getStatusIcon()}
          <span className="hidden sm:inline capitalize">{health.status}</span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Storage Health</span>
            </div>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className="capitalize"
            >
              {health.status}
            </Badge>
          </div>

          {/* Quota Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Storage Used</span>
              <span className={cn('font-medium', getQuotaColor(health.quotaUsedPercent))}>
                {health.quotaUsedPercent}%
              </span>
            </div>
            <Progress 
              value={health.quotaUsedPercent} 
              className="h-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{StorageHealthMonitor.formatBytes(health.quotaUsedBytes)}</span>
              <span>{StorageHealthMonitor.formatBytes(health.quotaTotalBytes)}</span>
            </div>
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Database className={cn(
                'h-4 w-4',
                health.localStorageAvailable ? 'text-green-500' : 'text-destructive'
              )} />
              <span>Local Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className={cn(
                'h-4 w-4',
                health.indexedDBAvailable ? 'text-green-500' : 'text-amber-500'
              )} />
              <span>IndexedDB</span>
            </div>
          </div>

          {/* Backup Info */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Last Backup
              </span>
              <span className="font-medium">{health.lastBackupAge}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Cached Saves</span>
              <span className="font-medium">{health.cachedSaveCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Backup Snapshots</span>
              <span className="font-medium">{health.backupCount}</span>
            </div>
          </div>

          {/* Issues */}
          {health.issues.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-destructive">Issues</span>
              {health.issues.map((issue, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {health.recommendations.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-primary">Recommendations</span>
              {health.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}

          {/* Manual Backup Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleManualBackup}
            disabled={isBackingUp}
          >
            {isBackingUp ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Backing up...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Backup Now
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StorageHealthIndicator;
