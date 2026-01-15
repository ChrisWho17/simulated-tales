import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  User, RefreshCw, Loader2, Sparkles, Heart, Shield, 
  Sword, Wand2, Zap, Eye, Palette, ChevronDown, ChevronUp, Trophy
} from 'lucide-react';
import { RPGCharacter } from '@/types/rpgCharacter';
import { GameGenre, GENRE_DATA } from '@/types/genreData';
import { TieredAppearance, formatAppearanceForAI } from '@/types/characterCreation';
import { Backstory, PersonalityTrait, CharacterFlaw } from '@/game/characterDevelopmentSystem';
import { BadgeShowcase, TitleDisplay, frameStyles } from '@/components/game/AchievementBadges';
import { useAchievementRewards } from '@/components/game/AchievementRewards';

interface VisualCharacterCardProps {
  character: RPGCharacter & { 
    portraitUrl?: string;
    tieredAppearance?: TieredAppearance;
    backstory?: Backstory;
    personalityTraits?: PersonalityTrait[];
    flaws?: CharacterFlaw[];
  };
  genre: GameGenre;
  isCompact?: boolean;
  onRegeneratePortrait?: () => Promise<void>;
  onViewDetails?: () => void;
}

export function VisualCharacterCard({
  character,
  genre,
  isCompact = false,
  onRegeneratePortrait,
  onViewDetails,
}: VisualCharacterCardProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { equippedCosmetics, getClaimedByType } = useAchievementRewards();
  
  const genreData = GENRE_DATA[genre];
  const charClass = genreData?.classes.find(c => c.id === character.classId);
  const background = genreData?.backgrounds.find(b => b.id === character.backgroundId);
  
  // Get equipped frame and title
  const equippedFrame = equippedCosmetics.frame;
  const frameStyle = equippedFrame ? frameStyles[equippedFrame] : null;
  const equippedTitle = equippedCosmetics.title;
  const titles = getClaimedByType('title');
  const currentTitle = titles.find(t => t.id === equippedTitle);

  const handleRegenerate = async () => {
    if (!onRegeneratePortrait) return;
    setIsRegenerating(true);
    try {
      await onRegeneratePortrait();
    } finally {
      setIsRegenerating(false);
    }
  };

  // Get stat modifier display
  const getModifier = (stat: number) => {
    const mod = Math.floor((stat - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  // Stat colors based on value
  const getStatColor = (stat: number) => {
    if (stat >= 16) return 'text-emerald-400';
    if (stat >= 14) return 'text-primary';
    if (stat >= 10) return 'text-foreground';
    if (stat >= 8) return 'text-amber-400';
    return 'text-destructive';
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
        {/* Mini Portrait */}
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-primary/30 shrink-0">
          {character.portraitUrl ? (
            <img 
              src={character.portraitUrl} 
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <User className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{character.name}</div>
          <div className="text-xs text-muted-foreground">
            Lvl {character.level} {charClass?.name || 'Adventurer'}
          </div>
        </div>
        
        {/* Health */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 text-sm">
            <Heart className="w-3.5 h-3.5 text-destructive" />
            <span>{character.currentHealth}/{character.maxHealth}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
      {/* Portrait Section */}
      <div className="relative">
        <div className={cn(
          "aspect-[3/4] max-h-[300px] bg-gradient-to-b from-muted to-background rounded-t-xl overflow-hidden",
          frameStyle?.className
        )}>
          {character.portraitUrl ? (
            <img 
              src={character.portraitUrl} 
              alt={character.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-20 h-20 text-muted-foreground/50" />
            </div>
          )}
        </div>
        
        {/* Overlay gradient */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
        
        {/* Achievement Badges - top left */}
        <div className="absolute top-3 left-3">
          <BadgeShowcase maxBadges={3} size="sm" showEmpty={false} />
        </div>
        
        {/* Portrait controls */}
        {onRegeneratePortrait && (
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-3 right-3 h-8 w-8 bg-background/80 backdrop-blur-sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        )}
        
        {/* Name plate */}
        <div className="absolute bottom-0 inset-x-0 p-4">
          {/* Title display */}
          {currentTitle && (
            <p className="text-xs text-amber-400 italic mb-0.5">
              {currentTitle.name}
            </p>
          )}
          <h2 className="text-xl font-narrative font-bold text-gradient-gold">
            {character.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            Level {character.level} {charClass?.name || 'Adventurer'}
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="p-4 border-t border-border/30">
        {/* Health & Resources */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 p-2 rounded-lg bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-xs font-medium">HP</span>
            </div>
            <div className="text-lg font-bold">
              {character.currentHealth}
              <span className="text-sm text-muted-foreground">/{character.maxHealth}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
              <div 
                className="h-full bg-destructive transition-all"
                style={{ width: `${(character.currentHealth / character.maxHealth) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="flex-1 p-2 rounded-lg bg-primary/10 border border-primary/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium">AC</span>
            </div>
            <div className="text-lg font-bold">
              {10 + Math.floor((character.stats.dexterity - 10) / 2)}
            </div>
          </div>
          
          <div className="flex-1 p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium">XP</span>
            </div>
            <div className="text-lg font-bold">
              {character.experience}
              <span className="text-sm text-muted-foreground">/{character.level * 100}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-6 gap-1 text-center">
          {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => {
            const value = character.stats[stat];
            const Icon = stat === 'strength' ? Sword :
                        stat === 'dexterity' ? Zap :
                        stat === 'constitution' ? Shield :
                        stat === 'intelligence' ? Wand2 :
                        stat === 'wisdom' ? Eye :
                        Sparkles;
            
            return (
              <div key={stat} className="p-2 rounded-lg bg-muted/30">
                <Icon className={cn("w-3.5 h-3.5 mx-auto mb-1", getStatColor(value))} />
                <div className={cn("text-sm font-bold", getStatColor(value))}>
                  {value}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  {stat.slice(0, 3)}
                </div>
                <div className={cn("text-xs", getStatColor(value))}>
                  ({getModifier(value)})
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="border-t border-border/30">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full p-3 flex items-center justify-between text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Character Details
          </span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {showDetails && (
          <div className="p-4 pt-0 space-y-4">
            {/* Background */}
            {background && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Background</div>
                <div className="text-sm font-medium">{background.name}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{background.description}</p>
              </div>
            )}

            {/* Appearance */}
            {character.tieredAppearance && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Appearance</div>
                <p className="text-sm">
                  {formatAppearanceForAI(character.tieredAppearance, genre)}
                </p>
              </div>
            )}

            {/* Traits */}
            {character.traits && character.traits.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Traits</div>
                <div className="flex flex-wrap gap-1.5">
                  {character.traits.map((trait, i) => (
                    <span 
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Backstory */}
            {character.backstory && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Origin</div>
                <div className="text-sm font-medium">{character.backstory.origin.name}</div>
                {character.backstory.generatedNarrative && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {character.backstory.generatedNarrative}
                  </p>
                )}
              </div>
            )}

            {/* Motivation */}
            {character.backstory?.motivation && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Motivation</div>
                <div className="text-sm font-medium">{character.backstory.motivation.name}</div>
                <p className="text-xs text-primary/80 italic mt-0.5">
                  "{character.backstory.motivation.drivingQuestion}"
                </p>
              </div>
            )}

            {/* Personality & Flaws */}
            {(character.personalityTraits || character.flaws) && (
              <div className="flex gap-4">
                {character.personalityTraits && character.personalityTraits.length > 0 && (
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Personality</div>
                    <div className="flex flex-wrap gap-1">
                      {character.personalityTraits.map((t, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-muted">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {character.flaws && character.flaws.length > 0 && (
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground mb-1">Flaws</div>
                    <div className="flex flex-wrap gap-1">
                      {character.flaws.map((f, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          {f.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View Full Sheet Button */}
            {onViewDetails && (
              <Button
                variant="outline"
                onClick={onViewDetails}
                className="w-full"
              >
                View Full Character Sheet
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualCharacterCard;
