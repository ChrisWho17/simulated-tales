// Quest Quick View - Compact quest overview for /quest command
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Circle, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlayOverlayShell } from '@/components/game/PlayOverlayShell';
import { Quest, QuestLog, QuestObjective } from '@/game/questSystem';

interface QuestQuickViewProps {
  questLog: QuestLog;
  onClose: () => void;
  onOpenFullJournal?: () => void;
}

export function QuestQuickView({ questLog, onClose, onOpenFullJournal }: QuestQuickViewProps) {
  const activeQuests = Object.values(questLog.quests).filter(q => q.status === 'active');
  const availableCount = questLog.availableQuests.length;
  
  const getStatusIcon = (status: QuestObjective['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'active':
        return <Circle className="w-3 h-3 text-primary animate-pulse" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getCategoryColor = (category: Quest['category']) => {
    switch (category) {
      case 'main':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'side':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'personal':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
      case 'faction':
        return 'bg-green-500/20 text-green-500 border-green-500/50';
      default:
        return '';
    }
  };

  return (
    <PlayOverlayShell
      open
      onClose={onClose}
      title="Active Quests"
      subtitle={
        activeQuests.length > 0
          ? `${activeQuests.length} in progress`
          : availableCount > 0
            ? `${availableCount} available to start`
            : undefined
      }
      icon={<BookOpen className="w-5 h-5" />}
      size="md"
      headerActions={
        activeQuests.length > 0 ? (
          <Badge variant="secondary">{activeQuests.length}</Badge>
        ) : undefined
      }
      footer={
        onOpenFullJournal ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onClose();
              onOpenFullJournal();
            }}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Open Full Journal
          </Button>
        ) : undefined
      }
    >
            <div className="p-4 space-y-4">
              {activeQuests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No active quests</p>
                  <p className="text-sm mt-1">
                    {availableCount > 0 
                      ? `${availableCount} quest${availableCount > 1 ? 's' : ''} available to start`
                      : 'Explore the world to discover quests'}
                  </p>
                </div>
              ) : (
                activeQuests.map(quest => (
                  <div 
                    key={quest.id}
                    className="bg-muted/30 rounded-lg p-4 space-y-3"
                  >
                    {/* Quest Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{quest.title}</h3>
                          <Badge className={cn("text-xs", getCategoryColor(quest.category))}>
                            {quest.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {quest.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Active Objectives */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Current Objectives
                      </p>
                      {quest.objectives
                        .filter(obj => !obj.isHidden && (obj.status === 'active' || obj.status === 'pending'))
                        .slice(0, 3) // Show max 3 objectives
                        .map(objective => (
                          <div
                            key={objective.id}
                            className="flex items-start gap-2 pl-1"
                          >
                            {getStatusIcon(objective.status)}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm leading-tight">
                                {objective.description}
                              </p>
                              {objective.targetCount > 1 && (
                                <p className="text-xs text-muted-foreground">
                                  {objective.currentCount}/{objective.targetCount}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      {quest.objectives.filter(obj => !obj.isHidden && obj.status === 'active').length > 3 && (
                        <p className="text-xs text-muted-foreground pl-5">
                          +{quest.objectives.filter(obj => !obj.isHidden && obj.status === 'active').length - 3} more...
                        </p>
                      )}
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {quest.objectives.filter(o => o.status === 'completed').length}/
                        {quest.objectives.filter(o => !o.isHidden).length} completed
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </div>
                ))
              )}
              
              {/* Available quests hint */}
              {availableCount > 0 && activeQuests.length > 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  +{availableCount} new quest{availableCount > 1 ? 's' : ''} available
                </p>
              )}
            </div>
    </PlayOverlayShell>
  );
}
