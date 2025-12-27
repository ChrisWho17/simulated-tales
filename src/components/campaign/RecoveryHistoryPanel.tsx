// ============================================================================
// RECOVERY HISTORY PANEL
// Shows past recovery actions and their outcomes
// ============================================================================

import React, { useState, useEffect } from 'react';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  Wrench, 
  AlertTriangle,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { getRecoveryLog, RecoveryLogEntry } from '@/lib/saveRecovery/pipeline';
import { getRecipeCacheStats, clearRecipeCache, getAllRecipes } from '@/lib/saveRecovery/recipeCache';

// ============================================================================
// TYPES
// ============================================================================

interface RecoveryHistoryPanelProps {
  className?: string;
  compact?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - ts;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function getActionIcon(action: RecoveryLogEntry['action']) {
  switch (action) {
    case 'auto-repair':
      return <Wrench className="h-3.5 w-3.5 text-green-500" />;
    case 'manual-repair':
      return <Wrench className="h-3.5 w-3.5 text-amber-500" />;
    case 'salvage':
      return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
    case 'export':
      return <Download className="h-3.5 w-3.5 text-blue-500" />;
    case 'abort':
      return <XCircle className="h-3.5 w-3.5 text-muted-foreground" />;
    default:
      return <History className="h-3.5 w-3.5" />;
  }
}

function getActionLabel(action: RecoveryLogEntry['action']): string {
  switch (action) {
    case 'auto-repair': return 'Auto Repair';
    case 'manual-repair': return 'Manual Repair';
    case 'salvage': return 'Lossy Salvage';
    case 'export': return 'Exported Report';
    case 'abort': return 'Aborted';
    default: return action;
  }
}

// ============================================================================
// LOG ENTRY COMPONENT
// ============================================================================

function LogEntryCard({ entry, expanded, onToggle }: { 
  entry: RecoveryLogEntry; 
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div 
      className={cn(
        "border rounded-lg p-3 transition-colors cursor-pointer hover:bg-muted/30",
        entry.success ? "border-border/50" : "border-destructive/30 bg-destructive/5"
      )}
      onClick={onToggle}
    >
      <div className="flex items-center gap-2">
        {getActionIcon(entry.action)}
        <span className="font-medium text-sm">{getActionLabel(entry.action)}</span>
        {entry.success ? (
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto" />
        ) : (
          <XCircle className="h-3.5 w-3.5 text-destructive ml-auto" />
        )}
        {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>{formatTimestamp(entry.timestamp)}</span>
        <span>•</span>
        <span>{entry.opsApplied} ops</span>
        {entry.lossyOps && (
          <>
            <span>•</span>
            <Badge variant="destructive" className="text-xs h-4 px-1">Data Loss</Badge>
          </>
        )}
      </div>
      
      {expanded && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Campaign ID:</span>
            <code className="font-mono text-xs bg-muted px-1 rounded truncate max-w-[120px]">
              {entry.campaignId.slice(0, 12)}...
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Signature:</span>
            <code className="font-mono text-xs bg-muted px-1 rounded">
              {entry.signature.slice(0, 8)}...
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Operations:</span>
            <span>{entry.opsApplied}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CACHE STATS COMPONENT
// ============================================================================

function CacheStatsCard() {
  const stats = getRecipeCacheStats();
  const recipes = getAllRecipes();
  const [showRecipes, setShowRecipes] = useState(false);
  
  return (
    <Card className="p-3 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Recipe Cache</span>
        <Badge variant="outline" className="text-xs">
          {stats.recipeCount} recipes
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
        <div>
          <span className="block text-foreground font-medium">{stats.totalApplied}</span>
          <span>Times used</span>
        </div>
        <div>
          <span className="block text-foreground font-medium">v{stats.engineVersion}</span>
          <span>Engine</span>
        </div>
      </div>
      
      {stats.recipeCount > 0 && (
        <Collapsible open={showRecipes} onOpenChange={setShowRecipes}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs h-7">
              {showRecipes ? 'Hide Recipes' : 'Show Recipes'}
              {showRecipes ? <ChevronDown className="h-3 w-3 ml-1" /> : <ChevronRight className="h-3 w-3 ml-1" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-1">
            {recipes.map(recipe => (
              <div 
                key={recipe.signature}
                className="text-xs p-2 bg-muted/30 rounded flex items-center justify-between"
              >
                <div className="min-w-0">
                  <span className="font-medium truncate block">{recipe.humanLabel}</span>
                  <span className="text-muted-foreground">
                    Stage {recipe.stage} • {recipe.ops.length} ops • Used {recipe.appliedCount}x
                  </span>
                </div>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
      
      {stats.recipeCount > 0 && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full text-xs h-7 mt-2 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Recipe Cache?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all {stats.recipeCount} cached recovery recipes. 
                Future recovery operations will need to regenerate fixes from scratch.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearRecipeCache}>
                Clear Cache
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecoveryHistoryPanel({ className, compact = false }: RecoveryHistoryPanelProps) {
  const [log, setLog] = useState<RecoveryLogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  useEffect(() => {
    setLog(getRecoveryLog());
  }, []);
  
  const refresh = () => {
    setLog(getRecoveryLog());
  };
  
  if (compact) {
    const recentCount = log.filter(e => Date.now() - e.timestamp < 86400000).length;
    const successRate = log.length > 0 
      ? Math.round((log.filter(e => e.success).length / log.length) * 100)
      : 100;
    
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <History className="h-3.5 w-3.5" />
        <span>{log.length} recoveries</span>
        {log.length > 0 && (
          <>
            <span>•</span>
            <span className={successRate === 100 ? "text-green-500" : "text-amber-500"}>
              {successRate}% success
            </span>
          </>
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Recovery History
        </h3>
        <Button variant="ghost" size="sm" onClick={refresh} className="h-7 px-2">
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Cache Stats */}
      <CacheStatsCard />
      
      {/* Log Entries */}
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">
          Recent Actions ({log.length})
        </h4>
        
        {log.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recovery actions yet</p>
            <p className="text-xs mt-1">Actions will appear here when saves need repair</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-2">
            <div className="space-y-2">
              {log.map((entry, idx) => (
                <LogEntryCard
                  key={`${entry.timestamp}-${idx}`}
                  entry={entry}
                  expanded={expandedId === idx}
                  onToggle={() => setExpandedId(expandedId === idx ? null : idx)}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      
      {/* Summary */}
      {log.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>
            {log.filter(e => e.success).length} successful / {log.filter(e => !e.success).length} failed
          </span>
          <span>
            {log.filter(e => e.lossyOps).length} with data loss
          </span>
        </div>
      )}
    </div>
  );
}
