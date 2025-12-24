import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RPGCharacter, getStatModifier } from '@/types/rpgCharacter';
import { GENRE_DATA, GameGenre } from '@/types/genreData';
import { X, Heart, Coins, Shield, Sword, Wand2, Star, Backpack } from 'lucide-react';

interface CharacterSheetProps {
  character: RPGCharacter;
  onClose: () => void;
  onUpdateCharacter: (character: RPGCharacter) => void;
}

// Helper to find class/background across all genres
function findClassAcrossGenres(classId: string) {
  for (const genre of Object.keys(GENRE_DATA) as GameGenre[]) {
    const found = GENRE_DATA[genre].classes.find(c => c.id === classId);
    if (found) return found;
  }
  return null;
}

function findBackgroundAcrossGenres(backgroundId: string) {
  for (const genre of Object.keys(GENRE_DATA) as GameGenre[]) {
    const found = GENRE_DATA[genre].backgrounds.find(b => b.id === backgroundId);
    if (found) return found;
  }
  return null;
}

export function CharacterSheet({ character, onClose, onUpdateCharacter }: CharacterSheetProps) {
  const charClass = findClassAcrossGenres(character.classId);
  const background = findBackgroundAcrossGenres(character.backgroundId);

  const formatMod = (stat: number) => {
    const mod = getStatModifier(stat);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const xpToNextLevel = character.level * 100;
  const xpProgress = (character.experience / xpToNextLevel) * 100;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl h-[85vh] flex flex-col animate-fade-in">
        {/* Header - Fixed */}
        <div className="flex justify-between items-start p-4 md:p-6 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-xl md:text-2xl font-narrative font-bold text-gradient-gold">
              {character.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              Level {character.level} {charClass?.name || 'Adventurer'} • {background?.name || 'Unknown Origin'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 md:p-6 space-y-6">
            {/* Health & Resources */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30">
                <div className="flex items-center gap-1.5 md:gap-2 text-destructive mb-1 md:mb-2">
                  <Heart className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-semibold text-xs md:text-sm">Health</span>
                </div>
                <div className="text-lg md:text-2xl font-bold">
                  {character.currentHealth}/{character.maxHealth}
                </div>
                <div className="h-1.5 md:h-2 bg-muted rounded-full mt-1.5 md:mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${(character.currentHealth / character.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30">
                <div className="flex items-center gap-1.5 md:gap-2 text-warning mb-1 md:mb-2">
                  <Coins className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-semibold text-xs md:text-sm">Gold</span>
                </div>
                <div className="text-lg md:text-2xl font-bold">{character.gold}</div>
              </div>

              <div className="bg-background/50 rounded-lg p-3 md:p-4 border border-border/30">
                <div className="flex items-center gap-1.5 md:gap-2 text-primary mb-1 md:mb-2">
                  <Star className="w-4 h-4 md:w-5 md:h-5" />
                  <span className="font-semibold text-xs md:text-sm">XP</span>
                </div>
                <div className="text-lg md:text-2xl font-bold">{character.experience}/{xpToNextLevel}</div>
                <div className="h-1.5 md:h-2 bg-muted rounded-full mt-1.5 md:mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                <Shield className="w-4 h-4" />
                Attributes
              </h3>
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => (
                  <div 
                    key={stat} 
                    className="bg-background/50 rounded-lg p-2 md:p-3 border border-border/30 text-center"
                  >
                    <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
                      {stat.slice(0, 3)}
                    </div>
                    <div className="text-lg md:text-xl font-bold mt-0.5">{character.stats[stat]}</div>
                    <div className="text-xs md:text-sm text-primary">{formatMod(character.stats[stat])}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traits */}
            {character.traits.length > 0 && (
              <div>
                <h3 className="font-semibold text-primary mb-3 text-sm md:text-base">Personality</h3>
                <div className="flex flex-wrap gap-2">
                  {character.traits.map((trait) => (
                    <span 
                      key={trait}
                      className="px-2 md:px-3 py-1 bg-primary/10 text-primary rounded-full text-xs md:text-sm"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Abilities & Skills */}
            <div className="grid md:grid-cols-2 gap-4">
              {character.abilities.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Wand2 className="w-4 h-4" />
                    Abilities
                  </h3>
                  <div className="space-y-2">
                    {character.abilities.map((ability) => (
                      <div 
                        key={ability}
                        className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                      >
                        {ability}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {character.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                    <Sword className="w-4 h-4" />
                    Skills
                  </h3>
                  <div className="space-y-2">
                    {character.skills.map((skill) => (
                      <div 
                        key={skill}
                        className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                      >
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Inventory */}
            {character.inventory.length > 0 && (
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2 text-sm md:text-base">
                  <Backpack className="w-4 h-4" />
                  Inventory ({character.inventory.length} items)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {character.inventory.map((item) => (
                    <div 
                      key={item.id}
                      className="px-3 py-2 bg-background/50 rounded border border-border/30 text-xs md:text-sm"
                    >
                      {item.name}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom padding for mobile safe area */}
            <div className="h-6 md:h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
