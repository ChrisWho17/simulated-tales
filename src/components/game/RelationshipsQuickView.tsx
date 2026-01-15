// Relationships Quick View - Shows NPC relationships in a modal
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Heart, Handshake, Shield, Skull, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface NPCRelationship {
  id: string;
  name: string;
  occupation?: string;
  trust: number;
  respect: number;
  romance?: number;
  romanceUnlocked?: boolean;
  lastInteraction?: string;
  portraitUrl?: string;
}

interface RelationshipsQuickViewProps {
  open: boolean;
  onClose: () => void;
  relationships: NPCRelationship[];
  onViewFull?: () => void;
}

function getRelationshipIcon(trust: number, respect: number, romance?: number) {
  if (romance && romance > 50) return <Heart className="w-4 h-4 text-pink-400" />;
  if (trust > 50 && respect > 50) return <Handshake className="w-4 h-4 text-emerald-400" />;
  if (trust < -30 || respect < -30) return <Skull className="w-4 h-4 text-red-400" />;
  return <Shield className="w-4 h-4 text-muted-foreground" />;
}

function getRelationshipLabel(trust: number, respect: number, romance?: number): string {
  if (romance && romance > 70) return 'Beloved';
  if (romance && romance > 40) return 'Romantic Interest';
  if (trust > 70 && respect > 70) return 'Close Ally';
  if (trust > 50 || respect > 50) return 'Friend';
  if (trust < -50 || respect < -50) return 'Enemy';
  if (trust < -20 || respect < -20) return 'Rival';
  return 'Acquaintance';
}

function getTrendIcon(value: number) {
  if (value > 20) return <TrendingUp className="w-3 h-3 text-emerald-400" />;
  if (value < -20) return <TrendingDown className="w-3 h-3 text-red-400" />;
  return <Minus className="w-3 h-3 text-muted-foreground" />;
}

export function RelationshipsQuickView({ 
  open, 
  onClose, 
  relationships,
  onViewFull 
}: RelationshipsQuickViewProps) {
  // Sort by relationship strength
  const sortedRelationships = useMemo(() => {
    return [...relationships].sort((a, b) => {
      const scoreA = Math.abs(a.trust) + Math.abs(a.respect) + (a.romance || 0);
      const scoreB = Math.abs(b.trust) + Math.abs(b.respect) + (b.romance || 0);
      return scoreB - scoreA;
    });
  }, [relationships]);
  
  // Stats
  const stats = useMemo(() => {
    const friends = relationships.filter(r => r.trust > 30 || r.respect > 30).length;
    const enemies = relationships.filter(r => r.trust < -30 || r.respect < -30).length;
    const romantic = relationships.filter(r => r.romance && r.romance > 20).length;
    return { friends, enemies, romantic, total: relationships.length };
  }, [relationships]);
  
  if (!open) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden max-h-[80vh] flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Relationships</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Stats bar */}
          <div className="px-4 py-3 border-b border-border bg-muted/20 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{stats.total} Known</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Handshake className="w-4 h-4 text-emerald-400" />
              <span>{stats.friends} Friends</span>
            </div>
            {stats.romantic > 0 && (
              <div className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-pink-400" />
                <span>{stats.romantic} Romance</span>
              </div>
            )}
            {stats.enemies > 0 && (
              <div className="flex items-center gap-1.5">
                <Skull className="w-4 h-4 text-red-400" />
                <span>{stats.enemies} Hostile</span>
              </div>
            )}
          </div>
          
          {/* Relationship list */}
          <ScrollArea className="flex-1 p-4">
            {sortedRelationships.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No relationships yet</p>
                <p className="text-sm mt-1">Meet NPCs to build connections</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedRelationships.map(npc => (
                  <div
                    key={npc.id}
                    className="p-3 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {npc.portraitUrl ? (
                          <img src={npc.portraitUrl} alt={npc.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">{npc.name.charAt(0)}</span>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{npc.name}</span>
                          {getRelationshipIcon(npc.trust, npc.respect, npc.romance)}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {npc.occupation && <span>{npc.occupation}</span>}
                          <span>•</span>
                          <span>{getRelationshipLabel(npc.trust, npc.respect, npc.romance)}</span>
                        </div>
                        
                        {/* Bars */}
                        <div className="mt-2 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-14 text-muted-foreground">Trust</span>
                            <Progress 
                              value={Math.min(100, Math.max(0, npc.trust + 50))} 
                              className="h-1.5 flex-1" 
                            />
                            {getTrendIcon(npc.trust)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-14 text-muted-foreground">Respect</span>
                            <Progress 
                              value={Math.min(100, Math.max(0, npc.respect + 50))} 
                              className="h-1.5 flex-1"
                            />
                            {getTrendIcon(npc.respect)}
                          </div>
                          {npc.romanceUnlocked && npc.romance !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs w-14 text-pink-400">Romance</span>
                              <Progress 
                                value={Math.min(100, Math.max(0, npc.romance))} 
                                className="h-1.5 flex-1 [&>div]:bg-pink-400"
                              />
                              {getTrendIcon(npc.romance - 50)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {/* Footer */}
          {onViewFull && (
            <div className="p-3 border-t border-border bg-muted/20">
              <Button variant="outline" className="w-full" onClick={onViewFull}>
                <Users className="w-4 h-4 mr-2" />
                View Full Relationships Panel
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
