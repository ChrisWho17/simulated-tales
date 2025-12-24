import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RPGCharacter, getStatModifier, CHARACTER_CLASSES, CHARACTER_BACKGROUNDS } from '@/types/rpgCharacter';
import { X, Heart, Coins, Shield, Sword, Wand2, Star, Backpack } from 'lucide-react';

interface CharacterSheetProps {
  character: RPGCharacter;
  onClose: () => void;
  onUpdateCharacter: (character: RPGCharacter) => void;
}

export function CharacterSheet({ character, onClose, onUpdateCharacter }: CharacterSheetProps) {
  const charClass = CHARACTER_CLASSES.find(c => c.id === character.classId);
  const background = CHARACTER_BACKGROUNDS.find(b => b.id === character.backgroundId);

  const formatMod = (stat: number) => {
    const mod = getStatModifier(stat);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const xpToNextLevel = character.level * 100;
  const xpProgress = (character.experience / xpToNextLevel) * 100;

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-border flex-shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-2xl font-narrative font-bold text-gradient-gold">
              {character.name}
            </h2>
            <p className="text-muted-foreground">
              Level {character.level} {charClass?.name || 'Adventurer'} • {background?.name || 'Unknown Origin'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6 grid gap-6">
            {/* Health & Resources */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-2 text-destructive mb-2">
                  <Heart className="w-5 h-5" />
                  <span className="font-semibold">Health</span>
                </div>
                <div className="text-2xl font-bold">
                  {character.currentHealth}/{character.maxHealth}
                </div>
                <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all"
                    style={{ width: `${(character.currentHealth / character.maxHealth) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-2 text-gold mb-2">
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">Gold</span>
                </div>
                <div className="text-2xl font-bold">{character.gold}</div>
              </div>

              <div className="bg-background/50 rounded-lg p-4 border border-border/30">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Star className="w-5 h-5" />
                  <span className="font-semibold">Experience</span>
                </div>
                <div className="text-2xl font-bold">{character.experience}/{xpToNextLevel}</div>
                <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${xpProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Attributes
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {(['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'] as const).map((stat) => (
                  <div 
                    key={stat} 
                    className="bg-background/50 rounded-lg p-3 border border-border/30 text-center"
                  >
                    <div className="text-xs text-muted-foreground uppercase tracking-wider">
                      {stat.slice(0, 3)}
                    </div>
                    <div className="text-xl font-bold mt-1">{character.stats[stat]}</div>
                    <div className="text-sm text-primary">{formatMod(character.stats[stat])}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traits */}
            <div>
              <h3 className="font-semibold text-primary mb-3">Personality</h3>
              <div className="flex flex-wrap gap-2">
                {character.traits.map((trait) => (
                  <span 
                    key={trait}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>

            {/* Abilities & Skills */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  Abilities
                </h3>
                <div className="space-y-2">
                  {character.abilities.map((ability) => (
                    <div 
                      key={ability}
                      className="px-3 py-2 bg-background/50 rounded border border-border/30 text-sm"
                    >
                      {ability}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <Sword className="w-4 h-4" />
                  Skills
                </h3>
                <div className="space-y-2">
                  {character.skills.map((skill) => (
                    <div 
                      key={skill}
                      className="px-3 py-2 bg-background/50 rounded border border-border/30 text-sm"
                    >
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <Backpack className="w-4 h-4" />
                Inventory ({character.inventory.length} items)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {character.inventory.map((item) => (
                  <div 
                    key={item.id}
                    className="px-3 py-2 bg-background/50 rounded border border-border/30 text-sm"
                  >
                    {item.name}
                    {item.quantity > 1 && (
                      <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Spacer for safe scrolling on mobile */}
            <div className="h-8 flex-shrink-0" />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
