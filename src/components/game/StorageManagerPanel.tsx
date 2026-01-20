// ============================================================================
// STORAGE MANAGER PANEL - Monitor and manage localStorage usage
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  HardDrive, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Image,
  FileText,
  Users,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { 
  getStorageStats, 
  performCleanup, 
  formatStorageSize,
  StorageStats 
} from '@/lib/storageCleanup';

interface StorageItem {
  key: string;
  size: number;
  category: string;
  icon: React.ReactNode;
  deletable: boolean;
}

// Categorize storage items
function categorizeStorageItem(key: string): { category: string; icon: React.ReactNode; deletable: boolean } {
  // Protected keys - not deletable
  const protectedPatterns = [
    /^lwe_campaign_/,
    /^lwe_active_campaign_id$/,
    /^lwe_campaign_index$/,
    /^untold-game-settings$/,
    /^living-world-settings$/,
    /^supabase\./,
  ];
  
  if (protectedPatterns.some(p => p.test(key))) {
    return { category: 'Campaign Data', icon: <Database className="w-3.5 h-3.5" />, deletable: false };
  }
  
  // Portrait/Image caches
  if (/portrait|illustration|scene_|image/i.test(key)) {
    return { category: 'Image Cache', icon: <Image className="w-3.5 h-3.5" />, deletable: true };
  }
  
  // Companion data
  if (/companion|npc_/i.test(key)) {
    return { category: 'NPC Cache', icon: <Users className="w-3.5 h-3.5" />, deletable: true };
  }
  
  // Temp/Cache data
  if (/^temp_|^cache_|_tmp$|^streaming_|^generation_/i.test(key)) {
    return { category: 'Temp Data', icon: <Clock className="w-3.5 h-3.5" />, deletable: true };
  }
  
  // Transaction/WAL data
  if (/wal|transaction|backup/i.test(key)) {
    return { category: 'System', icon: <FileText className="w-3.5 h-3.5" />, deletable: true };
  }
  
  // Default
  return { category: 'Other', icon: <FileText className="w-3.5 h-3.5" />, deletable: true };
}

function getStorageItems(): StorageItem[] {
  const items: StorageItem[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    const size = (key.length + value.length) * 2; // UTF-16 encoding
    const { category, icon, deletable } = categorizeStorageItem(key);
    
    items.push({ key, size, category, icon, deletable });
  }
  
  // Sort by size descending
  return items.sort((a, b) => b.size - a.size);
}

function getCategorySummary(items: StorageItem[]): { category: string; size: number; count: number }[] {
  const summary: Record<string, { size: number; count: number }> = {};
  
  for (const item of items) {
    if (!summary[item.category]) {
      summary[item.category] = { size: 0, count: 0 };
    }
    summary[item.category].size += item.size;
    summary[item.category].count++;
  }
  
  return Object.entries(summary)
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.size - a.size);
}

export function StorageManagerPanel() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const refreshStats = useCallback(() => {
    setStats(getStorageStats());
    setItems(getStorageItems());
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleCleanup = async (aggressive: boolean = false) => {
    setIsCleaningUp(true);
    try {
      const freed = performCleanup(aggressive ? 0.4 : 0.2);
      toast.success(`Freed ${formatStorageSize(freed)} of storage`);
      refreshStats();
    } catch (error) {
      toast.error('Cleanup failed');
      console.error('[StorageManager] Cleanup error:', error);
    } finally {
      setIsCleaningUp(false);
    }
  };

  const handleDeleteItem = (key: string) => {
    try {
      localStorage.removeItem(key);
      toast.success('Item deleted');
      refreshStats();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  if (!stats) return null;

  const categorySummary = getCategorySummary(items);
  const usagePercent = Math.round(stats.percentage * 100);
  
  // Determine status color
  const statusColor = stats.isCritical 
    ? 'text-red-500' 
    : stats.isWarning 
      ? 'text-amber-500' 
      : 'text-emerald-500';
  
  const progressColor = stats.isCritical 
    ? 'bg-red-500' 
    : stats.isWarning 
      ? 'bg-amber-500' 
      : 'bg-emerald-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-medium">Storage Manager</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refreshStats}
          className="h-7 px-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Usage Overview */}
      <div className="p-4 rounded-lg bg-muted/20 border border-border/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Storage Used</span>
          <div className="flex items-center gap-2">
            {stats.isCritical ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : stats.isWarning ? (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            )}
            <span className={cn("text-sm font-medium", statusColor)}>
              {usagePercent}%
            </span>
          </div>
        </div>
        
        <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
          <div 
            className={cn("absolute inset-y-0 left-0 rounded-full transition-all", progressColor)}
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatStorageSize(stats.used)} used</span>
          <span>{formatStorageSize(stats.quota)} total</span>
        </div>
        
        {stats.isCritical && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            ⚠️ Storage is critically full. Performance may be affected.
          </div>
        )}
        
        {stats.isWarning && !stats.isCritical && (
          <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
            ⚡ Storage is getting full. Consider cleaning up.
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Storage by Category
        </h4>
        <div className="space-y-2">
          {categorySummary.map(({ category, size, count }) => (
            <div 
              key={category}
              className="flex items-center justify-between p-2 rounded bg-background/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{category}</span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </div>
              <span className="text-sm font-mono">{formatStorageSize(size)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup Actions */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Cleanup Actions
        </h4>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup(false)}
            disabled={isCleaningUp}
            className="text-xs"
          >
            {isCleaningUp ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Quick Cleanup
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCleanup(true)}
            disabled={isCleaningUp}
            className="text-xs text-amber-500 border-amber-500/30 hover:bg-amber-500/10"
          >
            {isCleaningUp ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            )}
            Deep Cleanup
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Cleanup removes cached portraits, scene illustrations, and temporary data.
          Your campaign saves are never deleted.
        </p>
      </div>

      {/* Detailed View Toggle */}
      <div className="space-y-3">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-[var(--accent-primary)] hover:underline"
        >
          {showDetails ? 'Hide Details' : 'Show All Items'}
        </button>
        
        {showDetails && (
          <ScrollArea className="h-48 rounded-md border border-border/30 bg-background/20">
            <div className="p-2 space-y-1">
              {items.slice(0, 50).map((item) => (
                <div 
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted/30 group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {item.icon}
                    <span className="text-xs font-mono truncate" title={item.key}>
                      {item.key.length > 30 ? item.key.slice(0, 30) + '...' : item.key}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatStorageSize(item.size)}
                    </span>
                    {item.deletable && (
                      <button
                        onClick={() => handleDeleteItem(item.key)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-opacity"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {items.length > 50 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  + {items.length - 50} more items
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

export default StorageManagerPanel;
