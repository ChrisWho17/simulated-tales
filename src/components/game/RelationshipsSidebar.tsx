// Relationships Sidebar - Shows all known NPCs with enhanced relationship cards
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ChevronRight, ChevronLeft, Search, 
  Heart, Handshake, Shield, X, Filter
} from 'lucide-react';
import { NPC } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EnhancedRelationshipCard } from './EnhancedRelationshipCard';
import { calculateRelationshipDisplay } from '@/lib/relationshipSystem';

interface RelationshipsSidebarProps {
  npcs: NPC[];
  isOpen: boolean;
  onToggle: () => void;
  onTalkToNPC?: (npc: NPC) => void;
  onViewProfile?: (npc: NPC) => void;
  playerLocation?: string;
}

type FilterType = 'all' | 'friends' | 'romantic' | 'neutral' | 'hostile';

export function RelationshipsSidebar({
  npcs,
  isOpen,
  onToggle,
  onTalkToNPC,
  onViewProfile,
  playerLocation,
}: RelationshipsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  
  // Filter and sort NPCs
  const filteredNPCs = useMemo(() => {
    let result = [...npcs];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(npc => 
        npc.meta?.name?.toLowerCase().includes(query) ||
        npc.meta?.occupation?.toLowerCase().includes(query)
      );
    }
    
    // Category filter
    if (activeFilter !== 'all') {
      result = result.filter(npc => {
        const rel = calculateRelationshipDisplay(npc);
        switch (activeFilter) {
          case 'friends':
            return rel.trust > 50 || rel.respect > 50;
          case 'romantic':
            return rel.romanceUnlocked && rel.romance > 20;
          case 'hostile':
            return rel.trust < -30 || rel.respect < -30;
          case 'neutral':
            return Math.abs(rel.trust) <= 30 && Math.abs(rel.respect) <= 30;
          default:
            return true;
        }
      });
    }
    
    // Sort by relationship strength
    result.sort((a, b) => {
      const relA = calculateRelationshipDisplay(a);
      const relB = calculateRelationshipDisplay(b);
      const scoreA = Math.abs(relA.trust) + Math.abs(relA.respect) + (relA.romance || 0);
      const scoreB = Math.abs(relB.trust) + Math.abs(relB.respect) + (relB.romance || 0);
      return scoreB - scoreA;
    });
    
    return result;
  }, [npcs, searchQuery, activeFilter]);
  
  // NPCs at current location
  const npcsHere = useMemo(() => {
    if (!playerLocation) return [];
    return npcs.filter(npc => npc.currentLocation === playerLocation);
  }, [npcs, playerLocation]);
  
  const filters: { id: FilterType; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <Users className="w-3 h-3" /> },
    { id: 'friends', label: 'Friends', icon: <Handshake className="w-3 h-3" /> },
    { id: 'romantic', label: 'Romance', icon: <Heart className="w-3 h-3" /> },
    { id: 'neutral', label: 'Neutral', icon: <Shield className="w-3 h-3" /> },
  ];

  return (
    <>
      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          "fixed top-16 z-50 bg-card/90 backdrop-blur-sm border border-border shadow-lg hover:bg-secondary transition-all",
          isOpen ? "right-80" : "right-2"
        )}
        title="Relationships"
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <Users className="h-4 w-4" />}
      </Button>
      
      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-12 h-[calc(100vh-48px)] w-80 z-40 bg-card border-l border-border overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border bg-gradient-to-b from-muted/30 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Relationships</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search people..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 text-sm bg-background/50"
                />
              </div>
              
              {/* Filters */}
              <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
                {filters.map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                      activeFilter === filter.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {filter.icon}
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-4">
                {/* NPCs at current location */}
                {npcsHere.length > 0 && activeFilter === 'all' && !searchQuery && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Nearby ({npcsHere.length})
                    </h3>
                    <div className="space-y-2">
                      {npcsHere.map(npc => (
                        <EnhancedRelationshipCard
                          key={npc.id}
                          npc={npc}
                          compact
                          onTalk={onTalkToNPC ? () => onTalkToNPC(npc) : undefined}
                          onViewProfile={onViewProfile ? () => onViewProfile(npc) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* All NPCs (or filtered) */}
                <div className="space-y-2">
                  {(npcsHere.length > 0 && activeFilter === 'all' && !searchQuery) && (
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      All Known ({filteredNPCs.length})
                    </h3>
                  )}
                  
                  {filteredNPCs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No one matches your search</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNPCs.map(npc => (
                        <EnhancedRelationshipCard
                          key={npc.id}
                          npc={npc}
                          compact={filteredNPCs.length > 5}
                          onTalk={onTalkToNPC ? () => onTalkToNPC(npc) : undefined}
                          onViewProfile={onViewProfile ? () => onViewProfile(npc) : undefined}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
            
            {/* Footer stats */}
            <div className="p-3 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{npcs.length} people known</span>
                <span>{npcsHere.length} nearby</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
