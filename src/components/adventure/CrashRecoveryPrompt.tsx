import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getMostRecentSave, GameSave, loadAllSaves } from '@/lib/saveSystem';
import { Play, RotateCcw, BookOpen, Clock } from 'lucide-react';

interface CrashRecoveryPromptProps {
  onContinue: (save: GameSave) => void;
  onNewGame: () => void;
}

export function CrashRecoveryPrompt({ onContinue, onNewGame }: CrashRecoveryPromptProps) {
  const [recentSave, setRecentSave] = useState<GameSave | null>(null);
  const [allSaves, setAllSaves] = useState<GameSave[]>([]);
  const [showAllSaves, setShowAllSaves] = useState(false);

  useEffect(() => {
    const mostRecent = getMostRecentSave();
    setRecentSave(mostRecent);
    setAllSaves(loadAllSaves().slice(0, 5)); // Top 5 saves
  }, []);

  if (!recentSave) {
    return null;
  }

  const gameData = recentSave.gameData as { story?: unknown[]; character?: { name: string; classId?: string } };
  const storyLength = gameData.story?.length ?? 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-lg w-full glass-panel border-primary/30 p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-gradient-primary">
            Continue Your Adventure?
          </h2>
          <p className="text-muted-foreground text-sm">
            We found a saved adventure waiting for you
          </p>
        </div>

        {/* Recent Save Card */}
        <div className="glass-panel-subtle p-4 rounded-lg border border-primary/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">{recentSave.characterName}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {recentSave.dateFormatted}
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {storyLength > 0 && (
              <span>{storyLength} story entries • </span>
            )}
            <span className={recentSave.id.startsWith('auto-') ? 'text-warning' : 'text-success'}>
              {recentSave.id.startsWith('auto-') ? 'Auto-save' : 'Manual save'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button 
            onClick={() => onContinue(recentSave)}
            className="w-full py-6 text-lg font-semibold"
            size="lg"
          >
            <Play className="w-5 h-5 mr-2" />
            Continue Here
          </Button>
          
          <Button
            variant="outline"
            onClick={onNewGame}
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Fresh
          </Button>
        </div>

        {/* Show Other Saves */}
        {allSaves.length > 1 && (
          <div className="pt-4 border-t border-border/50">
            <button
              onClick={() => setShowAllSaves(!showAllSaves)}
              className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
            >
              {showAllSaves ? 'Hide other saves' : `View ${allSaves.length - 1} other save${allSaves.length > 2 ? 's' : ''}`}
            </button>
            
            {showAllSaves && (
              <div className="mt-3 space-y-2">
                {allSaves.filter(s => s.id !== recentSave.id).map((save) => (
                  <button
                    key={save.id}
                    onClick={() => onContinue(save)}
                    className="w-full text-left p-3 glass-panel-subtle rounded-lg hover:border-primary/50 border border-transparent transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{save.characterName}</span>
                      <span className="text-xs text-muted-foreground">{save.dateFormatted}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
