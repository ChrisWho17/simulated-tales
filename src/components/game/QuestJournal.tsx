import { useState } from 'react';
import { Quest, QuestLog, QuestObjective } from '@/game/questSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, CheckCircle, XCircle, Circle, Star, Clock, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestJournalProps {
  questLog: QuestLog;
  onClose: () => void;
  onStartQuest?: (questId: string) => void;
  onAbandonQuest?: (questId: string) => void;
}

export function QuestJournal({ questLog, onClose, onStartQuest, onAbandonQuest }: QuestJournalProps) {
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('active');

  const activeQuests = Object.values(questLog.quests).filter(q => q.status === 'active');
  const completedQuests = Object.values(questLog.quests).filter(q => q.status === 'completed');
  const failedQuests = Object.values(questLog.quests).filter(q => q.status === 'failed' || q.status === 'abandoned');
  const availableQuests = questLog.availableQuests;

  const selectedQuest = selectedQuestId ? questLog.quests[selectedQuestId] : null;

  const getStatusIcon = (status: QuestObjective['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'active':
        return <Circle className="w-4 h-4 text-primary animate-pulse" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground" />;
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
      case 'repeatable':
        return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col">
        <CardHeader className="flex-row items-center justify-between border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            Quest Journal
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 flex overflow-hidden p-0">
          {/* Quest List */}
          <div className="w-1/3 border-r flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid grid-cols-3 m-2">
                <TabsTrigger value="active" className="text-xs">
                  Active ({activeQuests.length})
                </TabsTrigger>
                <TabsTrigger value="available" className="text-xs">
                  New ({availableQuests.length})
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">
                  Done ({completedQuests.length})
                </TabsTrigger>
              </TabsList>
              
              <ScrollArea className="flex-1">
                <TabsContent value="active" className="m-0 p-2 space-y-1">
                  {activeQuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active quests
                    </p>
                  ) : (
                    activeQuests.map(quest => (
                      <QuestListItem
                        key={quest.id}
                        quest={quest}
                        selected={selectedQuestId === quest.id}
                        onClick={() => setSelectedQuestId(quest.id)}
                        getCategoryColor={getCategoryColor}
                      />
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="available" className="m-0 p-2 space-y-1">
                  {availableQuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No new quests available
                    </p>
                  ) : (
                    availableQuests.map(questId => (
                      <div
                        key={questId}
                        className="p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer"
                        onClick={() => onStartQuest?.(questId)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{questId}</span>
                          <Badge variant="outline" className="text-xs">Start</Badge>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="m-0 p-2 space-y-1">
                  {completedQuests.length === 0 && failedQuests.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No completed quests
                    </p>
                  ) : (
                    <>
                      {completedQuests.map(quest => (
                        <QuestListItem
                          key={quest.id}
                          quest={quest}
                          selected={selectedQuestId === quest.id}
                          onClick={() => setSelectedQuestId(quest.id)}
                          getCategoryColor={getCategoryColor}
                        />
                      ))}
                      {failedQuests.map(quest => (
                        <QuestListItem
                          key={quest.id}
                          quest={quest}
                          selected={selectedQuestId === quest.id}
                          onClick={() => setSelectedQuestId(quest.id)}
                          getCategoryColor={getCategoryColor}
                        />
                      ))}
                    </>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
          
          {/* Quest Details */}
          <div className="flex-1 p-4 overflow-auto">
            {selectedQuest ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{selectedQuest.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={cn("text-xs", getCategoryColor(selectedQuest.category))}>
                        {selectedQuest.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {selectedQuest.status}
                      </Badge>
                    </div>
                  </div>
                  {selectedQuest.status === 'active' && onAbandonQuest && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => onAbandonQuest(selectedQuest.id)}
                    >
                      Abandon
                    </Button>
                  )}
                </div>
                
                <p className="text-muted-foreground">{selectedQuest.description}</p>
                
                {/* Objectives */}
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Objectives
                  </h4>
                  <div className="space-y-2">
                    {selectedQuest.objectives
                      .filter(obj => !obj.isHidden)
                      .map(objective => (
                        <div
                          key={objective.id}
                          className={cn(
                            "flex items-start gap-3 p-2 rounded-lg",
                            objective.status === 'active' && "bg-primary/5",
                            objective.status === 'completed' && "bg-green-500/5"
                          )}
                        >
                          {getStatusIcon(objective.status)}
                          <div className="flex-1">
                            <p className={cn(
                              "text-sm",
                              objective.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {objective.description}
                            </p>
                            {objective.targetCount > 1 && (
                              <p className="text-xs text-muted-foreground">
                                Progress: {objective.currentCount}/{objective.targetCount}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                
                {/* Rewards */}
                {selectedQuest.rewards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Rewards</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedQuest.rewards.map((reward, i) => (
                        <Badge key={i} variant="secondary">
                          {reward.description}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Journal Entries */}
                {selectedQuest.journalEntries.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Journal
                    </h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedQuest.journalEntries.map((entry, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          {entry.text}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a quest to view details
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuestListItem({
  quest,
  selected,
  onClick,
  getCategoryColor,
}: {
  quest: Quest;
  selected: boolean;
  onClick: () => void;
  getCategoryColor: (category: Quest['category']) => string;
}) {
  const completedObjectives = quest.objectives.filter(o => o.status === 'completed').length;
  const totalObjectives = quest.objectives.filter(o => !o.isHidden).length;
  
  return (
    <div
      className={cn(
        "p-2 rounded-lg cursor-pointer transition-colors",
        selected ? "bg-primary/10 border border-primary/30" : "bg-muted/50 hover:bg-muted"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium truncate">{quest.title}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between mt-1">
        <Badge className={cn("text-xs", getCategoryColor(quest.category))}>
          {quest.category}
        </Badge>
        {quest.status === 'active' && (
          <span className="text-xs text-muted-foreground">
            {completedObjectives}/{totalObjectives}
          </span>
        )}
        {quest.status === 'completed' && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        {quest.status === 'failed' && (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
}
