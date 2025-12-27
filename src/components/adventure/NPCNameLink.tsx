// NPC Name Link - Makes NPC names in narrative text clickable
import { useState, useMemo, useCallback } from 'react';
import { 
  RegisteredNPC, 
  getAllRegisteredNPCs, 
  getSiblings, 
  getRegisteredNPC, 
  loadNPCRegistry, 
  findNPCByNameOrOccupation,
  resolveNPCId
} from '@/game/npcIdentityRegistry';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { User, Users, Briefcase, MapPin, Heart, Camera, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Ensure NPC registry is loaded
loadNPCRegistry();

interface NPCProfileModalProps {
  npc: RegisteredNPC;
  onClose: () => void;
}

function NPCProfileModal({ npc, onClose }: NPCProfileModalProps) {
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  
  const siblings = useMemo(() => getSiblings(npc.permanent.id), [npc.permanent.id]);
  const spouse = useMemo(() => {
    if (npc.semiPermanent.spouse) {
      return getRegisteredNPC(npc.semiPermanent.spouse);
    }
    return null;
  }, [npc.semiPermanent.spouse]);

  const handleGeneratePortrait = useCallback(async () => {
    setIsGeneratingPortrait(true);
    try {
      // Build a description from available NPC data
      const description = [
        npc.permanent.species !== 'human' ? npc.permanent.species : '',
        npc.semiPermanent.occupation !== 'none' ? npc.semiPermanent.occupation : '',
        npc.mutable.mood !== 'neutral' ? `feeling ${npc.mutable.mood}` : '',
      ].filter(Boolean).join(', ');
      
      const { data, error } = await supabase.functions.invoke('generate-npc-portrait', {
        body: {
          npc: {
            id: npc.permanent.id,
            meta: {
              name: npc.permanent.name,
              occupation: npc.semiPermanent.occupation,
              description: description || `A ${npc.permanent.species}`,
            },
            emotionalState: { current: npc.mutable.mood }
          },
          config: {
            genre: 'fantasy',
            emotion: npc.mutable.mood || 'neutral'
          }
        }
      });

      if (error) {
        throw error;
      }

      if (data?.imageUrl) {
        setPortrait(data.imageUrl);
        toast({
          title: "Portrait Generated",
          description: `Created portrait for ${npc.permanent.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to generate portrait:', error);
      toast({
        title: "Portrait Generation Failed",
        description: "Could not generate portrait at this time",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPortrait(false);
    }
  }, [npc]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-md border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            {/* Portrait or Placeholder */}
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
              {portrait ? (
                <img 
                  src={portrait} 
                  alt={npc.permanent.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className="flex-1">
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
            {/* Generate Portrait Button */}
            {!portrait && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGeneratePortrait}
                disabled={isGeneratingPortrait}
                className="w-full gap-2 border-primary/30 hover:border-primary/50"
              >
                {isGeneratingPortrait ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Portrait...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Generate Portrait
                  </>
                )}
              </Button>
            )}

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
          'npc-name-link cursor-pointer font-bold text-primary underline decoration-primary/60 underline-offset-2 hover:decoration-primary hover:text-primary/80 transition-colors duration-200',
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

// ============= PLAYER NAME LINK =============

interface PlayerNameLinkProps {
  playerName: string;
  onShowCharacterSheet: () => void;
  className?: string;
}

export function PlayerNameLink({ playerName, onShowCharacterSheet, className }: PlayerNameLinkProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onShowCharacterSheet();
  }, [onShowCharacterSheet]);

  return (
    <span
      className={cn(
        'player-name-link cursor-pointer font-bold text-accent underline decoration-accent/60 underline-offset-2 hover:decoration-accent hover:text-accent/80 transition-colors duration-200',
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onShowCharacterSheet();
        }
      }}
      aria-label={`View ${playerName}'s character sheet`}
    >
      {playerName}
    </span>
  );
}

// Hook to get all known NPC names for text parsing
// This is called on every render to ensure we have the latest NPCs
export function useRegisteredNPCNames(): Map<string, RegisteredNPC> {
  // Don't use useMemo here - we need to always get fresh data since
  // NPCs can be registered during narrative processing
  const npcs = getAllRegisteredNPCs();
  const nameMap = new Map<string, RegisteredNPC>();
  
  for (const npc of npcs) {
    // Map by lowercase name for case-insensitive matching
    nameMap.set(npc.permanent.name.toLowerCase(), npc);
    
    // Also map by occupation for dialogue matching (e.g., "Squad Leader:")
    const occupation = npc.semiPermanent.occupation;
    if (occupation && occupation !== 'none') {
      nameMap.set(occupation.toLowerCase(), npc);
    }
  }
  
  return nameMap;
}

// Helper to register a dialogue speaker as an NPC if not already registered
function registerDialogueSpeaker(
  speakerName: string, 
  npcNameMap: Map<string, RegisteredNPC>,
  playerName?: string
): void {
  const speakerLower = speakerName.toLowerCase();
  
  // Skip if it's the player name
  if (playerName && speakerLower === playerName.toLowerCase()) return;
  
  // Skip if already in local map
  if (npcNameMap.has(speakerLower)) return;
  
  // Check if this speaker exists in the registry (by name or occupation)
  const existingNPC = findNPCByNameOrOccupation(speakerName);
  if (existingNPC) {
    // Add to our local map for this render
    npcNameMap.set(speakerLower, existingNPC);
    // Also add by occupation if different
    if (existingNPC.semiPermanent.occupation && 
        existingNPC.semiPermanent.occupation.toLowerCase() !== speakerLower) {
      npcNameMap.set(existingNPC.semiPermanent.occupation.toLowerCase(), existingNPC);
    }
  } else {
    // Auto-register this new dialogue speaker via the central registry
    // This ensures consistent IDs across all systems
    const npcId = resolveNPCId(speakerName, { occupation: speakerName });
    
    // Fetch the newly created/resolved NPC and add to map
    const newNPC = getRegisteredNPC(npcId);
    if (newNPC) {
      npcNameMap.set(speakerLower, newNPC);
      console.log(`[NPCNameLink] Auto-registered dialogue speaker: ${speakerName} (ID: ${npcId})`);
    }
  }
}

// Helper function to parse text and insert NPC and Player links
// Also detects dialogue speaker patterns like "Name:" at the start of dialogue
export function parseTextForNPCLinks(
  text: string,
  npcNameMap: Map<string, RegisteredNPC>,
  keyPrefix: string,
  playerName?: string,
  onShowCharacterSheet?: () => void
): React.ReactNode[] {
  // First pass: detect and register any dialogue speakers that aren't in the registry
  // Pattern 1: "Name: (dialogue)" format
  const dialogueSpeakerPattern = /^([A-Z][a-zA-Z\s]+?):\s*(?:\(|["']|[A-Z])/gm;
  let speakerMatch;
  
  while ((speakerMatch = dialogueSpeakerPattern.exec(text)) !== null) {
    const speakerName = speakerMatch[1].trim();
    registerDialogueSpeaker(speakerName, npcNameMap, playerName);
  }
  
  // Pattern 2: If the entire text looks like a character name/title (used for bold speaker names)
  // This handles cases where "Squad Leader" is passed without the colon
  const trimmedText = text.trim();
  if (trimmedText && /^[A-Z][a-zA-Z\s]+$/.test(trimmedText) && trimmedText.length > 2 && trimmedText.length < 50) {
    // This could be a speaker name - check if it looks like a title/name
    const words = trimmedText.split(/\s+/);
    const looksLikeName = words.length <= 4 && words.every(w => /^[A-Z][a-z]*$/.test(w));
    if (looksLikeName) {
      registerDialogueSpeaker(trimmedText, npcNameMap, playerName);
    }
  }

  if (npcNameMap.size === 0 && !playerName) return [text];

  // Build list of all names to match (NPCs + player)
  const allNames: Array<{ name: string; type: 'npc' | 'player'; npc?: RegisteredNPC }> = [];
  
  // Add player name first (higher priority)
  if (playerName && playerName.trim()) {
    allNames.push({ name: playerName.toLowerCase(), type: 'player' });
  }
  
  // Add NPC names AND their occupations for dialogue matching
  for (const [name, npc] of npcNameMap.entries()) {
    // Avoid duplicates
    if (!allNames.some(e => e.name === name && e.type === 'npc')) {
      allNames.push({ name, type: 'npc', npc });
    }
    
    // Also add occupation as a potential match (for "Squad Leader:" style dialogue)
    const occupation = npc.semiPermanent.occupation;
    if (occupation && occupation !== 'none') {
      const occLower = occupation.toLowerCase();
      if (!allNames.some(e => e.name === occLower && e.type === 'npc')) {
        allNames.push({ name: occLower, type: 'npc', npc });
      }
    }
  }
  
  if (allNames.length === 0) return [text];

  // Sort by length (longest first) to avoid partial matches
  allNames.sort((a, b) => b.name.length - a.name.length);
  
  // Build regex pattern - escape special chars and use word boundaries
  const escapedNames = allNames.map(({ name }) => 
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

    // Find what type of match this is
    const matchedName = match[1];
    const matchedLower = matchedName.toLowerCase();
    
    // Check if it's the player name
    if (playerName && matchedLower === playerName.toLowerCase() && onShowCharacterSheet) {
      result.push(
        <PlayerNameLink
          key={`${keyPrefix}-player-${match.index}`}
          playerName={matchedName}
          onShowCharacterSheet={onShowCharacterSheet}
        />
      );
    } else {
      // Check if it's an NPC (by name or occupation)
      const matchingEntry = allNames.find(
        entry => entry.type === 'npc' && entry.name === matchedLower
      );
      
      if (matchingEntry?.npc) {
        result.push(
          <NPCNameLink
            key={`${keyPrefix}-npc-${match.index}`}
            npc={matchingEntry.npc}
          />
        );
      } else {
        result.push(matchedName);
      }
    }

    lastIndex = pattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result.length > 0 ? result : [text];
}
