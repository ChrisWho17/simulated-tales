// NPC Name Link - Makes NPC names in narrative text clickable
import { useState, useMemo, useCallback } from 'react';
import { RegisteredNPC, getAllRegisteredNPCs, getSiblings, getRegisteredNPC } from '@/game/npcIdentityRegistry';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Users, Briefcase, MapPin, Heart, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NPCProfileModalProps {
  npc: RegisteredNPC;
  onClose: () => void;
}

function NPCProfileModal({ npc, onClose }: NPCProfileModalProps) {
  const siblings = useMemo(() => getSiblings(npc.permanent.id), [npc.permanent.id]);
  const spouse = useMemo(() => {
    if (npc.semiPermanent.spouse) {
      return getRegisteredNPC(npc.semiPermanent.spouse);
    }
    return null;
  }, [npc.semiPermanent.spouse]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/40">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-gradient-primary">{npc.permanent.name}</span>
              {npc.semiPermanent.occupation !== 'none' && (
                <p className="text-sm text-muted-foreground font-normal mt-0.5">
                  {npc.semiPermanent.occupation}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              {npc.mutable.currentLocation && npc.mutable.currentLocation !== 'unknown' && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Location:</span>
                  <span className="text-foreground capitalize">{npc.mutable.currentLocation.replace(/_/g, ' ')}</span>
                </div>
              )}
              {npc.semiPermanent.faction !== 'civilian' && (
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Faction:</span>
                  <span className="text-foreground capitalize">{npc.semiPermanent.faction}</span>
                </div>
              )}
            </div>

            {/* Current Activity */}
            {npc.mutable.currentActivity && npc.mutable.currentActivity !== 'idle' && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground">Currently:</p>
                <p className="text-foreground italic capitalize">{npc.mutable.currentActivity}</p>
              </div>
            )}

            {/* Mood */}
            {npc.mutable.mood && npc.mutable.mood !== 'neutral' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mood:</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                  npc.mutable.mood === 'happy' && "bg-success/20 text-success",
                  npc.mutable.mood === 'angry' && "bg-destructive/20 text-destructive",
                  npc.mutable.mood === 'sad' && "bg-blue-500/20 text-blue-400",
                  npc.mutable.mood === 'fearful' && "bg-warning/20 text-warning",
                  !['happy', 'angry', 'sad', 'fearful'].includes(npc.mutable.mood) && "bg-muted/50 text-muted-foreground"
                )}>
                  {npc.mutable.mood}
                </span>
              </div>
            )}

            {/* Relationships Section */}
            {(spouse || siblings.length > 0) && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Relationships
                </h4>
                <div className="space-y-1.5 pl-2">
                  {spouse && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Spouse:</span>{' '}
                      <span className="text-foreground font-medium">{spouse.permanent.name}</span>
                    </div>
                  )}
                  {siblings.length > 0 && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {siblings.length === 1 ? 'Sibling:' : 'Siblings:'}
                      </span>{' '}
                      <span className="text-foreground">
                        {siblings.map(s => s.permanent.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Species/Birth info */}
            {(npc.permanent.species !== 'human' || npc.permanent.birthplace) && (
              <div className="space-y-1.5 text-sm">
                {npc.permanent.species !== 'human' && (
                  <div>
                    <span className="text-muted-foreground">Species:</span>{' '}
                    <span className="text-foreground capitalize">{npc.permanent.species}</span>
                  </div>
                )}
                {npc.permanent.birthplace && (
                  <div>
                    <span className="text-muted-foreground">Birthplace:</span>{' '}
                    <span className="text-foreground">{npc.permanent.birthplace}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface NPCNameLinkProps {
  npc: RegisteredNPC;
  className?: string;
}

export function NPCNameLink({ npc, className }: NPCNameLinkProps) {
  const [showProfile, setShowProfile] = useState(false);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(true);
  }, []);

  return (
    <>
      <span
        className={cn(
          'npc-name-link cursor-pointer underline decoration-primary/40 underline-offset-2 hover:decoration-primary hover:text-primary transition-colors duration-200',
          className
        )}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShowProfile(true);
          }
        }}
        aria-label={`View ${npc.permanent.name}'s profile`}
      >
        {npc.permanent.name}
      </span>

      {showProfile && (
        <NPCProfileModal npc={npc} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

// Hook to get all known NPC names for text parsing
export function useRegisteredNPCNames(): Map<string, RegisteredNPC> {
  return useMemo(() => {
    const npcs = getAllRegisteredNPCs();
    const nameMap = new Map<string, RegisteredNPC>();
    
    for (const npc of npcs) {
      // Map by lowercase name for case-insensitive matching
      nameMap.set(npc.permanent.name.toLowerCase(), npc);
    }
    
    return nameMap;
  }, []);
}

// Helper function to parse text and insert NPC links
export function parseTextForNPCLinks(
  text: string,
  npcNameMap: Map<string, RegisteredNPC>,
  keyPrefix: string
): React.ReactNode[] {
  if (npcNameMap.size === 0) return [text];

  // Sort NPC names by length (longest first) to avoid partial matches
  const sortedNames = Array.from(npcNameMap.keys()).sort((a, b) => b.length - a.length);
  
  // Build regex pattern - escape special chars and use word boundaries
  const escapedNames = sortedNames.map(name => 
    name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const pattern = new RegExp(`\\b(${escapedNames.join('|')})\\b`, 'gi');
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    // Find matching NPC (case-insensitive)
    const matchedName = match[1];
    const npc = npcNameMap.get(matchedName.toLowerCase());

    if (npc) {
      result.push(
        <NPCNameLink
          key={`${keyPrefix}-npc-${match.index}`}
          npc={npc}
        />
      );
    } else {
      result.push(matchedName);
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}
