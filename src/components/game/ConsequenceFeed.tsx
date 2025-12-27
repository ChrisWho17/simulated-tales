// ============================================================================
// CONSEQUENCE FEED - Shows real-time feedback on trust, rep, needs, inventory
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import { eventBus, GameBusEvent, RelationshipEvent, NeedEvent, ReputationEvent, ItemEvent } from '@/game/eventBus';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Heart, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Star,
  Zap,
  AlertTriangle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConsequenceEntry {
  id: string;
  type: 'relationship' | 'need' | 'reputation' | 'inventory' | 'combat';
  icon: React.ReactNode;
  text: string;
  delta?: number;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

interface ConsequenceFeedProps {
  maxEntries?: number;
  className?: string;
  compact?: boolean;
}

export function ConsequenceFeed({ 
  maxEntries = 8, 
  className,
  compact = false 
}: ConsequenceFeedProps) {
  const [entries, setEntries] = useState<ConsequenceEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  
  const addEntry = useCallback((entry: ConsequenceEntry) => {
    setEntries(prev => {
      const updated = [entry, ...prev].slice(0, maxEntries);
      return updated;
    });
  }, [maxEntries]);
  
  useEffect(() => {
    // Subscribe to relevant events
    const unsubscribe = eventBus.subscribe('*', (event: GameBusEvent) => {
      const entry = eventToConsequence(event);
      if (entry) {
        addEntry(entry);
      }
    });
    
    return unsubscribe;
  }, [addEntry]);
  
  // Auto-remove old entries
  useEffect(() => {
    const interval = setInterval(() => {
      const cutoff = Date.now() - 30000; // 30 seconds
      setEntries(prev => prev.filter(e => e.timestamp > cutoff));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  if (entries.length === 0) return null;
  
  return (
    <div className={cn(
      "fixed right-4 top-20 z-40 w-72 pointer-events-auto",
      className
    )}>
      {/* Header */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-1.5 bg-background/90 backdrop-blur border border-border rounded-t-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          Consequences
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
            {entries.length}
          </Badge>
        </span>
        {collapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
      
      {/* Feed */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-background/80 backdrop-blur border-x border-b border-border rounded-b-lg overflow-hidden"
          >
            <ScrollArea className={compact ? "max-h-40" : "max-h-60"}>
              <div className="p-2 space-y-1">
                <AnimatePresence mode="popLayout">
                  {entries.map((entry) => (
                    <ConsequenceItem key={entry.id} entry={entry} compact={compact} />
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ConsequenceItemProps {
  entry: ConsequenceEntry;
  compact?: boolean;
}

function ConsequenceItem({ entry, compact }: ConsequenceItemProps) {
  const getPriorityColor = () => {
    switch (entry.priority) {
      case 'critical': return 'border-red-500/50 bg-red-500/10';
      case 'high': return 'border-orange-500/50 bg-orange-500/10';
      case 'normal': return 'border-border';
      case 'low': return 'border-border/50 bg-muted/30';
    }
  };
  
  const getDeltaColor = () => {
    if (!entry.delta) return 'text-muted-foreground';
    return entry.delta > 0 ? 'text-green-400' : 'text-red-400';
  };
  
  const formatDelta = () => {
    if (!entry.delta) return null;
    const sign = entry.delta > 0 ? '+' : '';
    return `${sign}${entry.delta}`;
  };
  
  return (
    <motion.div
      layout
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -50, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded border",
        getPriorityColor()
      )}
    >
      <span className="text-muted-foreground shrink-0">
        {entry.icon}
      </span>
      <span className={cn(
        "flex-1 truncate",
        compact ? "text-[10px]" : "text-xs"
      )}>
        {entry.text}
      </span>
      {entry.delta !== undefined && (
        <span className={cn(
          "font-mono font-semibold shrink-0",
          compact ? "text-[10px]" : "text-xs",
          getDeltaColor()
        )}>
          {formatDelta()}
        </span>
      )}
    </motion.div>
  );
}

// ============= EVENT CONVERSION =============

function eventToConsequence(event: GameBusEvent): ConsequenceEntry | null {
  const base = {
    id: event.id,
    timestamp: event.timestamp,
    priority: event.priority,
  };
  
  switch (event.type) {
    case 'RELATIONSHIP_CHANGED':
    case 'TRUST_CHANGED':
    case 'RESPECT_CHANGED':
    case 'ATTACHMENT_CHANGED': {
      const data = (event as RelationshipEvent).data;
      const metric = data.metric || 'relationship';
      const delta = data.delta || 0;
      return {
        ...base,
        type: 'relationship',
        icon: <Heart className="w-3 h-3" />,
        text: `${capitalize(metric)} with ${data.targetEntity}`,
        delta,
      };
    }
    
    case 'NEED_CRITICAL': {
      const data = (event as NeedEvent).data;
      return {
        ...base,
        type: 'need',
        icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
        text: `${capitalize(data.need || 'Need')} critical!`,
        priority: 'critical',
      };
    }
    
    case 'NEED_LOW': {
      const data = (event as NeedEvent).data;
      return {
        ...base,
        type: 'need',
        icon: <ShieldAlert className="w-3 h-3 text-orange-400" />,
        text: `${capitalize(data.need || 'Need')} low`,
        priority: 'high',
      };
    }
    
    case 'REPUTATION_CHANGED': {
      const data = (event as ReputationEvent).data;
      const delta = data.newValue - data.previousValue;
      return {
        ...base,
        type: 'reputation',
        icon: <Star className="w-3 h-3" />,
        text: `Reputation at ${data.locationId}`,
        delta,
      };
    }
    
    case 'ITEM_TRANSFERRED':
    case 'ITEM_PICKED_UP': {
      const data = (event as ItemEvent).data;
      const isGain = data.toEntity === 'player';
      return {
        ...base,
        type: 'inventory',
        icon: <Package className="w-3 h-3" />,
        text: isGain ? `+${data.itemName}` : `-${data.itemName}`,
      };
    }
    
    case 'ITEM_GIFTED': {
      const data = (event as ItemEvent).data;
      return {
        ...base,
        type: 'inventory',
        icon: <Heart className="w-3 h-3 text-pink-400" />,
        text: `Gave ${data.itemName} to ${data.toEntity}`,
      };
    }
    
    case 'ITEM_STOLEN': {
      const data = (event as ItemEvent).data;
      return {
        ...base,
        type: 'inventory',
        icon: <AlertTriangle className="w-3 h-3 text-red-400" />,
        text: `Stole ${data.itemName}`,
        priority: 'high',
      };
    }
    
    case 'DAMAGE_RECEIVED': {
      const data = (event as any).data;
      if (data.targetEntity !== 'player') return null;
      return {
        ...base,
        type: 'combat',
        icon: <ShieldAlert className="w-3 h-3 text-red-400" />,
        text: data.woundType ? `${data.woundType} wound` : `Took ${data.amount} damage`,
        delta: -(data.amount || 0),
        priority: data.isHidden ? 'normal' : 'high',
      };
    }
    
    case 'WOUND_REVEALED': {
      const data = (event as any).data;
      return {
        ...base,
        type: 'combat',
        icon: <AlertTriangle className="w-3 h-3 text-orange-400" />,
        text: `Discovered: ${data.woundType || 'wound'}`,
        priority: 'high',
      };
    }
    
    default:
      return null;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
