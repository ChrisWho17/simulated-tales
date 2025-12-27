// Event Bus Debug Panel - Shows timeline of system events for troubleshooting

import { useState, useEffect, useCallback } from 'react';
import { eventBus, GameBusEvent, GameEventType } from '@/game/eventBus';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, ChevronDown, ChevronUp, Trash2, Pause, Play, Filter, AlertTriangle, Shield } from 'lucide-react';
import { getRecentViolations, ConsistencyViolation } from '@/game/consistencyLayer';
import { getDirectorState } from '@/game/directorSystem';

interface EventDisplayProps {
  event: GameBusEvent;
}

function EventDisplay({ event }: EventDisplayProps) {
  const data = (event as any).data || {};
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'low': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  const getEventIcon = (type: GameEventType) => {
    if (type.startsWith('ITEM_')) return '📦';
    if (type.startsWith('DAMAGE_') || type.startsWith('WOUND_')) return '⚔️';
    if (type === 'DEATH' || type === 'KNOCKOUT') return '💀';
    if (type.startsWith('RELATIONSHIP_') || type.startsWith('TRUST_')) return '💬';
    if (type.startsWith('NEED_')) return '❤️';
    if (type.startsWith('REPUTATION_')) return '⭐';
    if (type.startsWith('FACT_') || type.startsWith('SECRET_')) return '🔍';
    return '📌';
  };
  
  const formatData = () => {
    const entries = Object.entries(data).filter(([k]) => 
      !['itemId', 'id'].includes(k)
    );
    if (entries.length === 0) return null;
    return entries.map(([k, v]) => `${k}: ${v}`).join(' | ');
  };

  return (
    <div className="border border-border/50 rounded-md p-2 mb-1 bg-background/50 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{getEventIcon(event.type)}</span>
        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${getPriorityColor(event.priority)}`}>
          {event.priority}
        </Badge>
        <span className="font-mono font-semibold text-foreground">{event.type}</span>
        <span className="text-muted-foreground ml-auto">t:{event.tick}</span>
      </div>
      {formatData() && (
        <div className="text-muted-foreground font-mono text-[10px] pl-6 break-all">
          {formatData()}
        </div>
      )}
      <div className="text-muted-foreground/60 text-[9px] pl-6">
        src: {event.source} | {new Date(event.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
}

interface EventBusDebugPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function EventBusDebugPanel({ isOpen = false, onClose }: EventBusDebugPanelProps) {
  const [events, setEvents] = useState<GameBusEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState<string>('');
  const [expanded, setExpanded] = useState(isOpen);
  const [violations, setViolations] = useState<ConsistencyViolation[]>([]);
  const [activeTab, setActiveTab] = useState<'events' | 'consistency' | 'director'>('events');
  
  // Subscribe to all events
  useEffect(() => {
    if (isPaused) return;
    
    const unsubscribe = eventBus.subscribe('*', (event) => {
      setEvents(prev => [...prev.slice(-99), event]); // Keep last 100
    });
    
    // Initial load of recent events
    setEvents(eventBus.getRecentEvents(50));
    
    return unsubscribe;
  }, [isPaused]);
  
  // Periodically refresh violations
  useEffect(() => {
    const interval = setInterval(() => {
      setViolations(getRecentViolations(20));
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  
  const clearEvents = useCallback(() => {
    eventBus.clear();
    setEvents([]);
  }, []);
  
  const togglePause = useCallback(() => {
    if (isPaused) {
      eventBus.resume();
    } else {
      eventBus.pause();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);
  
  const filteredEvents = filter
    ? events.filter(e => 
        e.type.toLowerCase().includes(filter.toLowerCase()) ||
        e.source.toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify((e as any).data || {}).toLowerCase().includes(filter.toLowerCase())
      )
    : events;
  
  // Event type summary
  const typeCounts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  if (!expanded) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-background/90 backdrop-blur border-primary/50"
        onClick={() => setExpanded(true)}
      >
        <Activity className="w-4 h-4 mr-2" />
        Events ({events.length})
      </Button>
    );
  }

  // Get director state for display
  const directorState = getDirectorState();
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[420px] max-h-[550px] bg-background/95 backdrop-blur border border-border rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">System Debug</span>
          {violations.filter(v => v.severity === 'error').length > 0 && (
            <Badge variant="destructive" className="text-[9px] px-1">
              {violations.filter(v => v.severity === 'error').length} errors
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={togglePause}>
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearEvents}>
            <Trash2 className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-8 rounded-none border-b border-border">
          <TabsTrigger value="events" className="text-xs h-7">
            Events ({events.length})
          </TabsTrigger>
          <TabsTrigger value="consistency" className="text-xs h-7">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Consistency
          </TabsTrigger>
          <TabsTrigger value="director" className="text-xs h-7">
            <Shield className="w-3 h-3 mr-1" />
            Director
          </TabsTrigger>
        </TabsList>
        
        {/* Events Tab */}
        <TabsContent value="events" className="mt-0">
          {/* Filter */}
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter events..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs focus:outline-none"
              />
            </div>
          </div>
          
          {/* Type summary */}
      <Collapsible>
        <CollapsibleTrigger className="w-full p-2 flex items-center justify-between text-xs text-muted-foreground hover:bg-muted/50">
          <span>Event Types Summary</span>
          <ChevronDown className="w-3 h-3" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-2 pb-2">
          <div className="flex flex-wrap gap-1">
            {Object.entries(typeCounts).map(([type, count]) => (
              <Badge 
                key={type} 
                variant="outline" 
                className="text-[9px] cursor-pointer hover:bg-primary/20"
                onClick={() => setFilter(type)}
              >
                {type}: {count}
              </Badge>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Event list */}
      <ScrollArea className="h-[300px] p-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center text-muted-foreground text-xs py-8">
            No events {filter ? 'matching filter' : 'yet'}
          </div>
        ) : (
          [...filteredEvents].reverse().map((event) => (
            <EventDisplay key={event.id} event={event} />
          ))
        )}
      </ScrollArea>
      
        </TabsContent>
        
        {/* Consistency Tab */}
        <TabsContent value="consistency" className="mt-0">
          <ScrollArea className="h-[350px] p-2">
            {violations.length === 0 ? (
              <div className="text-center text-muted-foreground text-xs py-8">
                ✓ No consistency violations
              </div>
            ) : (
              violations.map((v) => (
                <div key={v.id} className={`border rounded-md p-2 mb-1 text-xs ${
                  v.severity === 'critical' ? 'border-red-500/50 bg-red-500/10' :
                  v.severity === 'error' ? 'border-orange-500/50 bg-orange-500/10' :
                  'border-yellow-500/50 bg-yellow-500/10'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-[9px] px-1 ${
                      v.severity === 'critical' ? 'text-red-400' :
                      v.severity === 'error' ? 'text-orange-400' : 'text-yellow-400'
                    }`}>
                      {v.severity}
                    </Badge>
                    <span className="font-mono font-semibold">{v.type}</span>
                    <span className="text-muted-foreground ml-auto">t:{v.tick}</span>
                  </div>
                  <div className="text-muted-foreground text-[10px]">
                    {v.description}
                  </div>
                  {v.entities.length > 0 && (
                    <div className="text-muted-foreground/60 text-[9px] mt-1">
                      Entities: {v.entities.join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </TabsContent>
        
        {/* Director Tab */}
        <TabsContent value="director" className="mt-0">
          <div className="p-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="border border-border rounded p-2">
                <div className="text-muted-foreground text-[10px]">Priority</div>
                <div className="font-semibold">{directorState.currentPriority}</div>
              </div>
              <div className="border border-border rounded p-2">
                <div className="text-muted-foreground text-[10px]">Escalation</div>
                <div className="font-semibold">{directorState.escalationLevel}%</div>
              </div>
            </div>
            
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground text-[10px] mb-1">Active Cooldowns</div>
              {directorState.cooldowns.length === 0 ? (
                <div className="text-xs text-muted-foreground">None active</div>
              ) : (
                <div className="space-y-1">
                  {directorState.cooldowns.slice(0, 5).map((cd, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span>{cd.system}</span>
                      <span className="text-muted-foreground">{cd.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border border-border rounded p-2">
              <div className="text-muted-foreground text-[10px] mb-1">Recent Beats</div>
              {directorState.recentBeats.length === 0 ? (
                <div className="text-xs text-muted-foreground">No recent beats</div>
              ) : (
                <div className="space-y-1">
                  {directorState.recentBeats.slice(-5).map((beat, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span>{beat.name}</span>
                      <span className="text-muted-foreground">t:{beat.triggeredAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Footer status */}
      <div className="p-2 border-t border-border text-[10px] text-muted-foreground flex justify-between">
        <span>{isPaused ? '⏸️ Paused' : '▶️ Live'}</span>
        <span>Last: {events.length > 0 ? events[events.length - 1].type : 'none'}</span>
      </div>
    </div>
  );
}
