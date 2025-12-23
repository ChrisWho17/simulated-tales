import { useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, RotateCcw, Settings, Loader2, User, Heart, Coins, Backpack, Dices, ImageIcon } from 'lucide-react';
import { RPGCharacter, getStatModifier, CHARACTER_CLASSES, CHARACTER_BACKGROUNDS } from '@/types/rpgCharacter';
import { DiceRollModal } from './DiceRollModal';
import { CharacterSheet } from './CharacterSheet';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
}

interface PendingRoll {
  stat: string;
  difficulty: number;
  reason: string;
}

interface GameMechanics {
  rollRequired?: PendingRoll;
  xpGained?: { amount: number; reason: string };
  goldGained?: number;
  lootGained?: string;
  damage?: number;
  heal?: number;
}

interface AdventureDisplayProps {
  story: StoryEntry[];
  onPlayerAction: (action: string, diceRoll?: any) => void;
  onRestart: () => void;
  isLoading: boolean;
  cheatMode: boolean;
  onToggleCheatMode: () => void;
  character: RPGCharacter;
  onUpdateCharacter: (character: RPGCharacter) => void;
  pendingMechanics?: GameMechanics;
  onClearMechanics: () => void;
  onGenerateImage: (entryId: string) => void;
  generatingImageFor?: string;
}

export function AdventureDisplay({
  story,
  onPlayerAction,
  onRestart,
  isLoading,
  cheatMode,
  onToggleCheatMode,
  character,
  onUpdateCharacter,
  pendingMechanics,
  onClearMechanics,
  onGenerateImage,
  generatingImageFor,
}: AdventureDisplayProps) {
  const [input, setInput] = useState('');
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [showDiceRoll, setShowDiceRoll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [story]);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  // Show dice roll modal when mechanics require it
  useEffect(() => {
    if (pendingMechanics?.rollRequired) {
      setShowDiceRoll(true);
    }
  }, [pendingMechanics]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onPlayerAction(input.trim());
      setInput('');
    }
  };

  const handleDiceRollComplete = (roll: any) => {
    setShowDiceRoll(false);
    // Re-send the last action with the dice roll result
    onPlayerAction(`[Dice roll for: ${pendingMechanics?.rollRequired?.reason}]`, roll);
    onClearMechanics();
  };

  const formatNarrativeContent = (content: string) => {
    return content.split('\n').map((paragraph, idx) => {
      if (!paragraph.trim()) return null;
      
      const dialogueMatch = paragraph.match(/^\*\*(.+?)\*\*:\s*"(.+)"$/);
      if (dialogueMatch) {
        return (
          <div key={idx} className="my-3 pl-4 border-l-2 border-primary/40">
            <span className="font-semibold text-primary">{dialogueMatch[1]}:</span>
            <span className="italic ml-2">"{dialogueMatch[2]}"</span>
          </div>
        );
      }

      const formattedParagraph = paragraph.replace(
        /\*\*(.+?)\*\*/g,
        '<strong class="text-primary font-semibold">$1</strong>'
      );

      const fullyFormatted = formattedParagraph.replace(
        /\*(.+?)\*/g,
        '<em>$1</em>'
      );

      return (
        <p
          key={idx}
          className="my-3 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: fullyFormatted }}
        />
      );
    });
  };

  const charClass = CHARACTER_CLASSES.find(c => c.id === character.classId);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-3 border-b border-border/30">
        <h1 className="text-xl font-narrative font-bold text-gradient-gold tracking-wide">
          UNTOLD
        </h1>
        
        {/* Character Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-destructive" />
              <span className={character.currentHealth < character.maxHealth * 0.3 ? 'text-destructive' : ''}>
                {character.currentHealth}/{character.maxHealth}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-gold" />
              <span>{character.gold}</span>
            </div>
            <span className="text-muted-foreground">
              Lv.{character.level} {charClass?.name}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {cheatMode && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                CHEAT
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCharacterSheet(true)}
              className="text-muted-foreground hover:text-foreground"
              title="Character Sheet"
            >
              <Backpack className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCheatMode}
              className="text-muted-foreground hover:text-foreground"
              title="Toggle Cheat Mode"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRestart}
              className="text-muted-foreground hover:text-foreground"
              title="New Adventure"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          {story.map((entry, index) => (
            <div
              key={entry.id}
              className={`animate-fade-in mb-6 ${entry.role === 'user' ? 'text-right' : ''}`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {entry.role === 'user' ? (
                <div className="inline-block max-w-[85%] bg-primary/10 border border-primary/20 rounded-lg px-4 py-3 text-left">
                  <p className="text-sm text-primary/70 mb-1 font-ui">You</p>
                  <p className="font-narrative text-lg">{entry.content}</p>
                </div>
              ) : (
                <div className="font-narrative text-lg text-foreground leading-relaxed">
                  {/* Scene Image */}
                  {entry.imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden border border-border/30">
                      <img 
                        src={entry.imageUrl} 
                        alt="Scene illustration" 
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {formatNarrativeContent(entry.content)}
                  
                  {/* Generate Image Button */}
                  {!entry.imageUrl && index === story.length - 1 && entry.role === 'narrator' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onGenerateImage(entry.id)}
                      disabled={!!generatingImageFor}
                      className="mt-2 text-muted-foreground hover:text-primary"
                    >
                      {generatingImageFor === entry.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Illustrate Scene
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-3 text-muted-foreground animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-narrative italic">The story unfolds...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/30 p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What do you do?"
              className="flex-1 bg-card border-border/50 text-foreground placeholder:text-muted-foreground font-narrative text-lg py-6"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              disabled={isLoading || showDiceRoll}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || showDiceRoll}
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Describe your action, use abilities ({character.abilities.join(', ')}), or explore
          </p>
        </div>
      </div>

      {/* Dice Roll Modal */}
      {showDiceRoll && pendingMechanics?.rollRequired && (
        <DiceRollModal
          stat={pendingMechanics.rollRequired.stat as any}
          difficulty={pendingMechanics.rollRequired.difficulty}
          reason={pendingMechanics.rollRequired.reason}
          characterStats={character.stats}
          onRoll={handleDiceRollComplete}
          onCancel={() => {
            setShowDiceRoll(false);
            onClearMechanics();
          }}
        />
      )}

      {/* Character Sheet Modal */}
      {showCharacterSheet && (
        <CharacterSheet
          character={character}
          onClose={() => setShowCharacterSheet(false)}
          onUpdateCharacter={onUpdateCharacter}
        />
      )}
    </div>
  );
}
