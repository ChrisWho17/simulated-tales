// NPC Name Link - Makes NPC names in narrative text clickable
import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { User, Users, MapPin, Heart, Camera, Loader2, UserCircle2, Shield, Dices } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getStatModifier } from '@/types/rpgCharacter';
import { NPCCharacterStats } from '@/game/npcIdentityRegistry';

// Ensure NPC registry is loaded
loadNPCRegistry();

interface NPCProfileModalProps {
  npc: RegisteredNPC;
  onClose: () => void;
}

function NPCProfileModal({ npc, onClose }: NPCProfileModalProps) {
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState(false);
  const [isLoadingCached, setIsLoadingCached] = useState(true);
  
  const siblings = useMemo(() => getSiblings(npc.permanent.id), [npc.permanent.id]);
  const spouse = useMemo(() => {
    if (npc.semiPermanent.spouse) {
      return getRegisteredNPC(npc.semiPermanent.spouse);
    }
    return null;
  }, [npc.semiPermanent.spouse]);

  // Load cached portrait on mount
  useEffect(() => {
    const loadCachedPortrait = async () => {
      try {
        const { data, error } = await supabase
          .from('npc_portraits')
          .select('portrait_url')
          .eq('npc_id', npc.permanent.id)
          .maybeSingle();
        
        if (data?.portrait_url) {
          setPortrait(data.portrait_url);
          console.log(`[NPCPortrait] Loaded cached portrait for ${npc.permanent.name} (ID: ${npc.permanent.id})`);
        }
      } catch (error) {
        console.error('Error loading cached portrait:', error);
      } finally {
        setIsLoadingCached(false);
      }
    };
    
    loadCachedPortrait();
  }, [npc.permanent.id, npc.permanent.name]);

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
        
        // Cache the portrait URL in the database by NPC ID
        const { error: cacheError } = await supabase
          .from('npc_portraits')
          .upsert({
            npc_id: npc.permanent.id,
            portrait_url: data.imageUrl
          }, {
            onConflict: 'npc_id'
          });
        
        if (cacheError) {
          console.error('Failed to cache portrait:', cacheError);
        } else {
          console.log(`[NPCPortrait] Cached portrait for ${npc.permanent.name} (ID: ${npc.permanent.id})`);
        }
        
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

  // NPC Stats Grid Component
  const NPCStatsGrid = ({ stats }: { stats: NPCCharacterStats }) => {
    const statList: { key: keyof typeof stats.stats; label: string; icon: string }[] = [
      { key: 'strength', label: 'STR', icon: '💪' },
      { key: 'dexterity', label: 'DEX', icon: '🏃' },
      { key: 'constitution', label: 'CON', icon: '❤️' },
      { key: 'intelligence', label: 'INT', icon: '🧠' },
      { key: 'wisdom', label: 'WIS', icon: '👁️' },
      { key: 'charisma', label: 'CHA', icon: '✨' },
    ];

    return (
      <div className="grid grid-cols-3 gap-2">
        {statList.map(({ key, label, icon }) => {
          const value = stats.stats[key];
          const mod = getStatModifier(value);
          return (
            <div key={key} className="flex flex-col items-center p-2 rounded-lg bg-muted/30 border border-border/50">
              <span className="text-xs">{icon}</span>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <span className="text-sm font-bold text-foreground">{value}</span>
              <span className={cn(
                'text-xs',
                mod >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}>
                {mod >= 0 ? '+' : ''}{mod}
              </span>
            </div>
          );
        })}
        {/* Level and Health */}
        <div className="col-span-3 grid grid-cols-2 gap-2 mt-1">
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
            <span className="text-xs text-muted-foreground">Level</span>
            <span className="text-sm font-bold text-primary">{stats.level}</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <span className="text-xs text-muted-foreground">HP</span>
            <span className="text-sm font-bold text-destructive">{stats.currentHealth}/{stats.maxHealth}</span>
          </div>
        </div>
      </div>
    );
  };

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

            {/* Character Stats Section */}
            {npc.permanent.characterStats && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Character Stats
                </h4>
                <NPCStatsGrid stats={npc.permanent.characterStats} />
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
          'npc-name-link inline-flex items-center gap-1 cursor-pointer font-bold text-primary hover:text-primary/80 transition-colors duration-200',
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
        <UserCircle2 className="w-3.5 h-3.5 text-primary/70 shrink-0" />
        <span className="underline decoration-primary/60 underline-offset-2 hover:decoration-primary">
          {npc.permanent.name}
        </span>
      </span>

      {showProfile && (
        <NPCProfileModal npc={npc} onClose={() => setShowProfile(false)} />
      )}
    </>
  );
}

// ============= SKILL CHECK LINK =============
// Displays skill names with a distinct dice icon and yellow/amber styling

interface SkillCheckLinkProps {
  skillName: string;
  className?: string;
}

export function SkillCheckLink({ skillName, className }: SkillCheckLinkProps) {
  return (
    <span
      className={cn(
        'skill-check-link inline-flex items-center gap-1 font-semibold text-warning',
        'underline decoration-warning/50 underline-offset-2',
        className
      )}
      aria-label={`${skillName} skill check`}
    >
      <Dices className="w-3.5 h-3.5 text-warning/80 shrink-0" />
      <span>{skillName}</span>
    </span>
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
// Common words that should NEVER be linked as NPCs (pronouns, common nouns, conjunctions, skills, etc.)
const NEVER_LINK_WORDS = new Set([
  // Pronouns
  'it', 'she', 'he', 'they', 'we', 'you', 'i', 'me', 'her', 'him', 'them', 'us',
  'this', 'that', 'these', 'those', 'who', 'what', 'which', 'where', 'when', 'why', 'how',
  // Articles and conjunctions
  'the', 'a', 'an', 'and', 'or', 'but', 'nor', 'yet', 'so', 'for', 'as', 'if', 'of', 'to', 'in', 'on', 'at', 'by', 'with', 'from',
  // Verbs
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'can', 'must', 'shall', 'get', 'got', 'go', 'goes', 'went', 'come', 'came', 'take', 'took',
  // Common narrative words
  'echo', 'vow', 'soul', 'death', 'life', 'love', 'hate', 'fear', 'hope', 'rage', 'fury',
  'chamber', 'room', 'door', 'wall', 'floor', 'light', 'dark', 'shadow', 'fire', 'water',
  'night', 'day', 'time', 'place', 'way', 'man', 'woman', 'thing', 'hand', 'eye', 'eyes',
  'rain', 'wind', 'sky', 'air', 'city', 'street', 'alley', 'crowd', 'voice', 'sound',
  // Short words that are never names
  'up', 'down', 'out', 'into', 'over', 'under', 'about', 'after', 'before', 'between',
  
  // ===== RPG SKILLS - COMPREHENSIVE LIST =====
  // D&D 5e Skills
  'survival', 'stealth', 'perception', 'athletics', 'acrobatics', 'intimidation', 'persuasion',
  'deception', 'insight', 'investigation', 'medicine', 'nature', 'religion', 'arcana',
  'history', 'performance', 'sleight', 'animal', 'handling',
  // Core Attributes
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'agility', 'endurance', 'willpower', 'luck', 'fortitude', 'reflex',
  // Combat Skills
  'combat', 'melee', 'ranged', 'unarmed', 'martial', 'firearms', 'archery', 'swordsmanship',
  'blocking', 'parrying', 'dodge', 'evasion', 'defense', 'offense', 'tactics', 'strategy',
  // Thief/Rogue Skills
  'lockpicking', 'pickpocket', 'sneak', 'disguise', 'forgery', 'sleightofhand',
  'burglary', 'trapfinding', 'disarmtrap', 'escape', 'hiding',
  // Tech/Modern Skills
  'hacking', 'computers', 'electronics', 'mechanics', 'driving', 'piloting', 'demolitions',
  'security', 'surveillance', 'forensics', 'programming', 'networking',
  // Crafting Skills
  'crafting', 'cooking', 'fishing', 'mining', 'herbalism', 'alchemy', 'enchanting',
  'smithing', 'tailoring', 'leatherworking', 'engineering', 'woodworking', 'brewing',
  'jewelcrafting', 'inscription', 'runecarving',
  // Social Skills
  'diplomacy', 'negotiation', 'leadership', 'bargaining', 'etiquette', 'seduction',
  'bluff', 'charm', 'gather', 'interrogation', 'streetwise',
  // Magic/Supernatural Skills
  'spellcasting', 'channeling', 'ritual', 'divination', 'necromancy', 'evocation',
  'conjuration', 'illusion', 'transmutation', 'abjuration', 'enchantment',
  // Survival/Nature Skills
  'tracking', 'foraging', 'navigation', 'climbing', 'swimming', 'riding',
  'hunting', 'trapping', 'taming', 'veterinary',
  // Knowledge Skills
  'lore', 'geography', 'linguistics', 'appraisal', 'occult', 'science',
  'medicine', 'law', 'theology', 'mythology',
  
  // ===== TEMPORAL/ADVERB WORDS =====
  'now', 'then', 'soon', 'later', 'here', 'there', 'today', 'tonight', 'tomorrow', 'yesterday',
  'always', 'never', 'often', 'sometimes', 'rarely', 'still', 'already', 'just', 'only',
  'maybe', 'perhaps', 'probably', 'certainly', 'definitely', 'possibly', 'likely',
  'again', 'once', 'twice', 'finally', 'eventually', 'immediately', 'suddenly',
  
  // ===== COMMON SOUNDS/INTERJECTIONS =====
  'hhh', 'hmm', 'uhh', 'ahh', 'ohh', 'mmm', 'err', 'umm', 'huh', 'meh', 'bah', 'pah', 'tsk',
  'ugh', 'argh', 'gah', 'oof', 'ooh', 'aah', 'eeh', 'shh', 'psst', 'hey', 'heh', 'hah',
  'wow', 'whoa', 'yay', 'nah', 'yeah', 'yep', 'nope', 'okay',
  
  // ===== MORE COMMON NOUNS/DETERMINERS =====
  'nothing', 'something', 'everything', 'anything', 'someone', 'everyone', 'anyone', 'nobody',
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'first', 'second', 'third', 'last', 'next', 'previous', 'other', 'another', 'each', 'every',
  'all', 'some', 'any', 'none', 'few', 'many', 'most', 'both', 'either', 'neither',
  'self', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  
  // ===== WEAPONS & EQUIPMENT - NEVER NPC NAMES =====
  // Firearms
  'rifle', 'pistol', 'shotgun', 'revolver', 'carbine', 'musket', 'blaster', 'phaser',
  'sniper', 'machinegun', 'submachinegun', 'smg', 'lmg', 'hmg', 'firearm', 'gun', 'cannon',
  // Melee Weapons
  'sword', 'dagger', 'axe', 'mace', 'hammer', 'spear', 'halberd', 'lance', 'pike',
  'staff', 'wand', 'rod', 'club', 'flail', 'morningstar', 'scythe', 'sickle', 'trident',
  'rapier', 'saber', 'sabre', 'katana', 'longsword', 'shortsword', 'greatsword', 'claymore',
  'knife', 'machete', 'cutlass', 'scimitar', 'falchion', 'glaive', 'naginata', 'quarterstaff',
  // Ranged Weapons
  'bow', 'crossbow', 'longbow', 'shortbow', 'sling', 'javelin', 'dart', 'throwing',
  // Armor & Shields
  'armor', 'armour', 'shield', 'helmet', 'helm', 'breastplate', 'chainmail', 'platemail',
  'gauntlet', 'gauntlets', 'greaves', 'boots', 'cloak', 'robe', 'vest', 'jacket',
  // Equipment Modifiers
  'spiked', 'war', 'battle', 'combat', 'tactical', 'military', 'heavy', 'light', 'leather',
  // Common Item Types
  'potion', 'scroll', 'wand', 'ring', 'amulet', 'necklace', 'bracelet', 'belt', 'bag',
  'backpack', 'torch', 'lantern', 'rope', 'key', 'lockpick', 'tool', 'kit', 'pack',
  'food', 'ration', 'rations', 'water', 'flask', 'bottle', 'vial', 'container',
]);

// RPG Skills that should be displayed as skill check links (not NPC links)
export const RPG_SKILL_WORDS = new Set([
  // D&D 5e Skills
  'survival', 'stealth', 'perception', 'athletics', 'acrobatics', 'intimidation', 'persuasion',
  'deception', 'insight', 'investigation', 'medicine', 'nature', 'religion', 'arcana',
  'history', 'performance',
  // Core Attributes
  'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma',
  'agility', 'endurance', 'willpower', 'luck', 'fortitude', 'reflex',
  // Combat Skills
  'combat', 'melee', 'ranged', 'unarmed', 'firearms', 'archery',
  'blocking', 'parrying', 'dodge', 'evasion', 'defense', 'tactics',
  // Thief/Rogue Skills
  'lockpicking', 'pickpocket', 'sneak', 'disguise', 'forgery',
  'burglary', 'trapfinding',
  // Tech/Modern Skills
  'hacking', 'computers', 'electronics', 'mechanics', 'driving', 'piloting', 'demolitions',
  'security', 'forensics', 'programming',
  // Crafting Skills
  'crafting', 'cooking', 'alchemy', 'enchanting', 'smithing', 'engineering',
  // Social Skills
  'diplomacy', 'negotiation', 'leadership', 'bargaining', 'etiquette',
  'bluff', 'charm', 'interrogation', 'streetwise',
  // Magic Skills
  'spellcasting', 'channeling', 'ritual', 'divination',
  // Survival/Nature Skills
  'tracking', 'foraging', 'navigation', 'climbing', 'swimming', 'riding', 'hunting',
]);

// Check if a name looks like an equipment/item name (not a person)
function isEquipmentName(name: string): boolean {
  const nameLower = name.toLowerCase();
  const words = nameLower.split(/\s+/);
  
  // Check if any word in the name is a weapon/equipment word
  for (const word of words) {
    if (NEVER_LINK_WORDS.has(word)) return true;
  }
  
  // Common equipment patterns: "Adjective + Weapon" or "Material + Item"
  // e.g., "Sniper Rifle", "War Club", "Spiked Mace", "Leather Armor"
  const equipmentPatterns = [
    /rifle$/i, /pistol$/i, /shotgun$/i, /gun$/i, /sword$/i, /dagger$/i,
    /axe$/i, /mace$/i, /hammer$/i, /spear$/i, /bow$/i, /crossbow$/i,
    /club$/i, /staff$/i, /wand$/i, /blade$/i, /knife$/i, /armor$/i,
    /armour$/i, /shield$/i, /helmet$/i, /helm$/i, /cloak$/i, /robe$/i,
    /potion$/i, /scroll$/i, /amulet$/i, /ring$/i, /boots$/i, /gloves$/i,
    /gauntlets$/i, /greaves$/i, /vest$/i, /jacket$/i, /weapon$/i,
  ];
  
  for (const pattern of equipmentPatterns) {
    if (pattern.test(nameLower)) return true;
  }
  
  return false;
}

// Check if a name looks like a legitimate NPC name (not a common word or item)
function isLegitimateNPCName(name: string): boolean {
  if (!name || name.length < 3) return false;
  
  const nameLower = name.toLowerCase();
  
  // Must not be in the blocklist
  if (NEVER_LINK_WORDS.has(nameLower)) return false;
  
  // Must not look like equipment
  if (isEquipmentName(name)) return false;
  
  // Must be properly capitalized (start with capital)
  if (!/^[A-Z]/.test(name)) return false;
  
  // Name should be at least 3 chars
  return name.length >= 3;
}

// Check if an NPC ID looks like a real registered NPC (not auto-generated from a common word)
function isValidNPCId(npcId: string): boolean {
  if (!npcId) return false;
  
  const idLower = npcId.toLowerCase();
  
  // Reject if the ID is just a common word
  if (NEVER_LINK_WORDS.has(idLower)) return false;
  
  // Reject if ID looks like equipment
  if (isEquipmentName(npcId)) return false;
  
  // Reject very short IDs
  if (npcId.length <= 3) return false;
  
  // Accept IDs with underscores or hyphens (structured IDs)
  if (npcId.includes('_') || npcId.includes('-')) return true;
  
  // Accept IDs that look like UUIDs
  if (/^[a-f0-9]{8,}/.test(idLower)) return true;
  
  // Accept properly capitalized names
  if (/[A-Z].*[A-Z]/.test(npcId) || npcId.includes(' ')) return true;
  
  // Accept if it has at least 5 characters
  if (npcId.length >= 5) return true;
  
  return false;
}

// Helper to check if an NPC should be linked
function shouldLinkNPC(npc: RegisteredNPC): boolean {
  if (!npc.permanent?.id) return false;
  if (!isValidNPCId(npc.permanent.id)) return false;
  
  const nameLower = npc.permanent.name.toLowerCase();
  if (NEVER_LINK_WORDS.has(nameLower)) return false;
  if (!isLegitimateNPCName(npc.permanent.name)) return false;
  
  return true;
}

// This is called on every render to ensure we have the latest NPCs
export function useRegisteredNPCNames(): Map<string, RegisteredNPC> {
  const npcs = getAllRegisteredNPCs();
  const nameMap = new Map<string, RegisteredNPC>();
  
  for (const npc of npcs) {
    // Only add NPCs that pass validation
    if (!shouldLinkNPC(npc)) continue;
    
    const nameLower = npc.permanent.name.toLowerCase();
    
    // Skip blocklisted names
    if (NEVER_LINK_WORDS.has(nameLower)) continue;
    
    nameMap.set(nameLower, npc);
    
    // Also map by occupation for dialogue matching
    const occupation = npc.semiPermanent.occupation;
    if (occupation && occupation !== 'none') {
      const occLower = occupation.toLowerCase();
      if (!NEVER_LINK_WORDS.has(occLower)) {
        nameMap.set(occLower, npc);
      }
    }
  }
  
  return nameMap;
}

// ============= NAME INTRODUCTION PATTERNS =============
// Instead of blocklisting everything, detect explicit name introductions
// These patterns indicate someone is being introduced as a person
// Covers many genres: fantasy, noir, sci-fi, western, modern, etc.

const NAME_INTRODUCTION_PATTERNS: RegExp[] = [
  // ===== DIRECT SELF-INTRODUCTIONS =====
  // Basic: "My name is X", "I'm X", "I am X"
  /(?:my name is|my name's|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // Casual: "Call me X", "You can call me X", "Just call me X"
  /(?:call me|you can call me|just call me|everyone calls me|folks call me|people call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // Nickname style: "I go by X", "I'm known as X", "Known as X"
  /(?:i go by|i'm known as|known as|also known as|aka|a\.k\.a\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // Formal: "The name's X", "Name's X"
  /(?:the name's|name's|the name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // They/others call me: "They call me X", "Round here they call me X"
  /(?:they call me|'round here they call me|around here they call me|some call me|most call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== NOIR / DETECTIVE GENRE =====
  // "The dame introduced herself as X", "The broad's name was X"
  /(?:introduced (?:himself|herself|themselves|themself) as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:goes by the name of|goes by the name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:working under the name|operating under the alias)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== FANTASY / MEDIEVAL GENRE =====
  // "I am called X", "I am X of House Y", "Sir X at your service"
  /(?:i am called|i'm called|i be called|i be)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i am|i'm)\s+([A-Z][a-z]+)\s+(?:of house|of clan|of the|son of|daughter of)/gi,
  /(?:sir|lady|lord|dame|master|mistress)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at your service|of|the)/gi,
  /(?:you may address me as|address me as|refer to me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i bear the name|i carry the name|my given name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== SCI-FI / CYBERPUNK GENRE =====
  // "Designation: X", "Unit X reporting", "My handle is X"
  /(?:designation[:\s]+|unit\s+)([A-Z][a-z0-9]+(?:[-\s][A-Z][a-z0-9]+)?)/gi,
  /(?:my handle is|handle's|street name is|net name is|alias is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:registered as|ID reads|identification[:\s]+)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== WESTERN GENRE =====
  // "Folks 'round here call me X", "I'm X, fastest gun in..."
  /(?:folks call me|pardner.*call me|stranger.*name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:wanted poster says|bounty on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== MILITARY / WAR GENRE =====
  // "Private X reporting", "Sergeant X", "Callsign X"
  /(?:private|corporal|sergeant|lieutenant|captain|major|colonel|general|commander|admiral)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:callsign[:\s]+|codename[:\s]+|operating under callsign)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:soldier named|marine named|officer named|trooper named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== PIRATE / NAUTICAL GENRE =====
  // "Captain X at yer service", "They call me X the Terrible"
  /(?:captain|first mate|quartermaster|bo'sun|bosun)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:sailed under|crewed with|served under captain)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== HORROR / SUPERNATURAL GENRE =====
  // "The entity known as X", "The spirit of X", "I was once called X"
  /(?:entity known as|being known as|creature called|thing called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:spirit of|ghost of|soul of|shade of|specter of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i was once called|i was once known as|in life.*called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== URBAN / STREET GENRE =====
  // "On the streets they call me X", "My crew knows me as X"
  /(?:on the streets.*call me|streets know me as|hood knows me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:my crew calls me|gang knows me as|boys call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== ROMANCE / SOCIAL GENRE =====
  // "Allow me to introduce myself, I'm X", "Pleased to meet you, I'm X"
  /(?:pleased to meet you.*i'm|pleasure to meet you.*i'm|charmed.*i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:may i introduce myself\??\s*i'm|let me introduce myself.*i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== POST-APOCALYPTIC GENRE =====
  // "Before the bombs I was X", "Used to be called X", "The wasteland knows me as X"
  /(?:before the.*i was|used to be called|used to be known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:wasteland knows me as|survivors call me|scavengers know me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== THIRD PERSON INTRODUCTIONS =====
  // "This is X", "Meet X", "Allow me to introduce X"
  /(?:this is|meet|may i present|allow me to introduce|introducing|let me introduce)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // "X, this is Y" - second name capture
  /[A-Z][a-z]+,\s*(?:this is|meet)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== NARRATIVE INTRODUCTIONS =====
  // "A man/woman named X", "The stranger called X"
  /(?:man|woman|person|stranger|figure|individual|someone|girl|boy|youth|elder)\s+(?:named|called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  // "X introduced himself/herself"
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:introduced|introduces)\s+(?:himself|herself|themselves)/gi,
  // "The bartender, X, poured..."
  /(?:the\s+\w+),\s+([A-Z][a-z]+),/gi,
  
  // ===== DIALOGUE SELF-IDENTIFICATION =====
  // Quoted: "I'm X", "Call me X" inside quotes
  /["'](?:I'm|I am|Call me|Name's|The name's|I go by)\s+([A-Z][a-z]+)/gi,
  // Response to "What's your name?": "X." or "It's X."
  /(?:what's your name|what is your name|who are you)[?"']*\s*["']?(?:It's\s+|I'm\s+)?([A-Z][a-z]+)/gi,
  
  // ===== TITLE + NAME PATTERNS =====
  // "Doctor X", "Professor X", "Father X", "Sister X"
  /(?:doctor|dr\.|professor|prof\.|father|sister|brother|mother|elder|chief|boss|mister|mr\.|miss|ms\.|mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
];

// Extract names from text using introduction patterns
function extractIntroducedNames(text: string): Set<string> {
  const names = new Set<string>();
  
  for (const pattern of NAME_INTRODUCTION_PATTERNS) {
    // Reset regex state
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length >= 2 && !NEVER_LINK_WORDS.has(name.toLowerCase())) {
        names.add(name);
      }
    }
  }
  
  return names;
}

// Helper to register a dialogue speaker as an NPC if not already registered
// Only registers if it looks like a real NPC name, not common words
function registerDialogueSpeaker(
  speakerName: string, 
  npcNameMap: Map<string, RegisteredNPC>,
  playerName?: string,
  confirmedNames?: Set<string>
): void {
  const speakerLower = speakerName.toLowerCase();
  
  // Skip common words that should never be NPCs
  if (NEVER_LINK_WORDS.has(speakerLower)) return;
  
  // Skip equipment names
  if (isEquipmentName(speakerName)) return;
  
  // Skip if it's the player name
  if (playerName && speakerLower === playerName.toLowerCase()) return;
  
  // Skip if already in local map
  if (npcNameMap.has(speakerLower)) return;
  
  // Skip very short names (likely pronouns or abbreviations)
  if (speakerName.length <= 2) return;
  
  // Check if this speaker exists in the registry (by name or occupation)
  const existingNPC = findNPCByNameOrOccupation(speakerName);
  if (existingNPC && shouldLinkNPC(existingNPC)) {
    // Add to our local map for this render
    npcNameMap.set(speakerLower, existingNPC);
    // Also add by occupation if different
    if (existingNPC.semiPermanent.occupation && 
        existingNPC.semiPermanent.occupation.toLowerCase() !== speakerLower) {
      npcNameMap.set(existingNPC.semiPermanent.occupation.toLowerCase(), existingNPC);
    }
  } else if (!existingNPC && speakerName.length >= 3) {
    // For new names, only auto-register if:
    // 1. It was explicitly introduced ("My name is X")
    // 2. OR it's a dialogue speaker pattern ("Name: dialogue")
    // 3. AND it passes all validation
    const isConfirmedName = confirmedNames?.has(speakerName);
    const looksLegitimate = /^[A-Z][a-z]+/.test(speakerName) && 
                           !NEVER_LINK_WORDS.has(speakerLower) &&
                           !isEquipmentName(speakerName);
    
    if (looksLegitimate && (isConfirmedName || speakerName.length >= 4)) {
      // Auto-register this new dialogue speaker via the central registry
      const npcId = resolveNPCId(speakerName, { occupation: speakerName });
      
      // Fetch the newly created/resolved NPC and add to map
      const newNPC = getRegisteredNPC(npcId);
      if (newNPC && shouldLinkNPC(newNPC)) {
        npcNameMap.set(speakerLower, newNPC);
        console.log(`[NPCNameLink] Auto-registered dialogue speaker: ${speakerName} (ID: ${npcId})${isConfirmedName ? ' [confirmed by introduction]' : ''}`);
      }
    }
  }
}

// Helper function to parse text and insert NPC, Player, and Skill links
// Only links NPCs with valid IDs - filters out common words like "It", "She", etc.
// Skill checks are shown with a distinct dice icon
export function parseTextForNPCLinks(
  text: string,
  npcNameMap: Map<string, RegisteredNPC>,
  keyPrefix: string,
  playerName?: string,
  onShowCharacterSheet?: () => void
): React.ReactNode[] {
  // FIRST: Extract names that are explicitly introduced ("My name is X", etc.)
  // These are CONFIRMED to be people, not items
  const confirmedNames = extractIntroducedNames(text);
  
  // Second pass: detect dialogue speakers ("Name: dialogue" format)
  const dialogueSpeakerPattern = /^([A-Z][a-zA-Z\s]+?):\s*(?:\(|["']|[A-Z])/gm;
  let speakerMatch;
  
  while ((speakerMatch = dialogueSpeakerPattern.exec(text)) !== null) {
    const speakerName = speakerMatch[1].trim();
    // Only register if it passes validation
    if (!NEVER_LINK_WORDS.has(speakerName.toLowerCase()) && !isEquipmentName(speakerName)) {
      registerDialogueSpeaker(speakerName, npcNameMap, playerName, confirmedNames);
    }
  }
  
  // Register any explicitly introduced names
  for (const name of confirmedNames) {
    registerDialogueSpeaker(name, npcNameMap, playerName, confirmedNames);
  }
  
  // Pattern 3: If the entire text looks like a character name/title (used for bold speaker names)
  const trimmedText = text.trim();
  if (trimmedText && /^[A-Z][a-zA-Z\s]+$/.test(trimmedText) && trimmedText.length > 2 && trimmedText.length < 50) {
    // Skip common words, skills, AND equipment
    const textLower = trimmedText.toLowerCase();
    if (!NEVER_LINK_WORDS.has(textLower) && !RPG_SKILL_WORDS.has(textLower) && !isEquipmentName(trimmedText)) {
      const words = trimmedText.split(/\s+/);
      const looksLikeName = words.length <= 4 && words.every(w => /^[A-Z][a-z]*$/.test(w));
      if (looksLikeName) {
        registerDialogueSpeaker(trimmedText, npcNameMap, playerName, confirmedNames);
      }
    }
  }

  // Build list of all names to match (Player + NPCs + Skills)
  const allMatches: Array<{ 
    name: string; 
    type: 'npc' | 'player' | 'skill'; 
    npc?: RegisteredNPC;
  }> = [];
  
  // Add player name first (highest priority)
  if (playerName && playerName.trim()) {
    allMatches.push({ name: playerName.toLowerCase(), type: 'player' });
  }
  
  // Add NPC names AND their occupations for dialogue matching
  // ONLY add NPCs with valid IDs - filter out common words
  for (const [name, npc] of npcNameMap.entries()) {
    // Skip common words, skills, and NPCs without valid IDs
    if (NEVER_LINK_WORDS.has(name)) continue;
    if (RPG_SKILL_WORDS.has(name)) continue;
    if (!shouldLinkNPC(npc)) continue;
    
    // Avoid duplicates
    if (!allMatches.some(e => e.name === name && e.type === 'npc')) {
      allMatches.push({ name, type: 'npc', npc });
    }
    
    // Also add occupation as a potential match (for "Squad Leader:" style dialogue)
    const occupation = npc.semiPermanent.occupation;
    if (occupation && occupation !== 'none') {
      const occLower = occupation.toLowerCase();
      // Skip common words and skills for occupations too
      if (!NEVER_LINK_WORDS.has(occLower) && 
          !RPG_SKILL_WORDS.has(occLower) && 
          !allMatches.some(e => e.name === occLower && e.type === 'npc')) {
        allMatches.push({ name: occLower, type: 'npc', npc });
      }
    }
  }
  
  // Add skill names for highlighting (only match capitalized skill names in text)
  // We'll match these with case-insensitive regex but only link if they're capitalized
  for (const skill of RPG_SKILL_WORDS) {
    if (!allMatches.some(e => e.name === skill)) {
      allMatches.push({ name: skill, type: 'skill' });
    }
  }
  
  if (allMatches.length === 0) return [text];

  // Sort by length (longest first) to avoid partial matches
  allMatches.sort((a, b) => b.name.length - a.name.length);
  
  // Build regex pattern - escape special chars and use word boundaries
  const escapedNames = allMatches.map(({ name }) => 
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
    } else if (RPG_SKILL_WORDS.has(matchedLower)) {
      // It's a skill - only show as skill link if capitalized (indicating game usage)
      const isCapitalized = /^[A-Z]/.test(matchedName);
      if (isCapitalized) {
        result.push(
          <SkillCheckLink
            key={`${keyPrefix}-skill-${match.index}`}
            skillName={matchedName}
          />
        );
      } else {
        // Lowercase skill word - just render as plain text
        result.push(matchedName);
      }
    } else {
      // Check if it's an NPC (by name or occupation)
      const matchingEntry = allMatches.find(
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
