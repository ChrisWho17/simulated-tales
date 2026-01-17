import { useState, useEffect } from 'react';
import { CombatEncounter, CombatAction, resolveCombatRound, CombatOutcome } from '@/game/combatSystem';
import { NPC } from '@/types/game';
import { LifeSimPlayerState } from '@/types/lifeSim';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Swords, Shield, Wind, MessageCircle, Flag, Skull, Heart, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDiceRoll, combatActionToDiceAction, toDicePlayer } from '@/hooks/useDiceRoll';
import { DiceRollDisplay } from '@/components/game/DiceRollDisplay';
import { useGameOptional } from '@/contexts/GameContext';
import { DiceRollResult } from '@/game/diceSystem';
import { companionSystem } from '@/game/companionSystem';
import { companionCombatManager, resolveCompanionCombatRound, CompanionCombatRound } from '@/game/companionCombatSystem';

interface CombatUIProps {
  encounter: CombatEncounter;
  npc: NPC;
  playerState: LifeSimPlayerState;
  onCombatEnd: (outcome: CombatOutcome, updatedEncounter: CombatEncounter) => void;
  onEncounterUpdate: (encounter: CombatEncounter) => void;
}

const COMBAT_ACTIONS: { action: CombatAction; label: string; icon: React.ReactNode; description: string }[] = [
  { action: 'attack', label: 'Attack', icon: <Swords className="w-4 h-4" />, description: 'Strike your opponent' },
  { action: 'defend', label: 'Defend', icon: <Shield className="w-4 h-4" />, description: 'Reduce incoming damage' },
  { action: 'dodge', label: 'Dodge', icon: <Wind className="w-4 h-4" />, description: 'Evade the next attack' },
  { action: 'intimidate', label: 'Intimidate', icon: <Skull className="w-4 h-4" />, description: 'Try to scare your opponent' },
  { action: 'talk_down', label: 'Talk Down', icon: <MessageCircle className="w-4 h-4" />, description: 'Try to end this peacefully' },
  { action: 'flee', label: 'Flee', icon: <Wind className="w-4 h-4" />, description: 'Attempt to escape' },
  { action: 'submit', label: 'Submit', icon: <Flag className="w-4 h-4" />, description: 'Surrender to your opponent' },
];

export function CombatUI({ encounter, npc, playerState, onCombatEnd, onEncounterUpdate }: CombatUIProps) {
  const [selectedAction, setSelectedAction] = useState<CombatAction | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [roundNarrative, setRoundNarrative] = useState<string | null>(null);
  const [pendingRoll, setPendingRoll] = useState<DiceRollResult | null>(null);
  const [pendingResult, setPendingResult] = useState<{
    encounter: CombatEncounter;
    narrative: string;
    combatEnded: boolean;
    outcome?: CombatOutcome;
  } | null>(null);
  const [companionRound, setCompanionRound] = useState<CompanionCombatRound | null>(null);
  
  const { performRoll, shouldShowRoll, clearRoll } = useDiceRoll();
  const gameContext = useGameOptional();
  const diceMode = gameContext?.diceMode ?? 'story';
  
  // Get active companions for combat
  const activeCompanions = companionSystem.getActiveCompanions();

  const playerHealth = encounter.playerStats.health;
  const playerMaxHealth = encounter.playerStats.maxHealth;
  const npcHealth = encounter.npcStats[npc.id]?.health || 0;
  const npcMaxHealth = encounter.npcStats[npc.id]?.maxHealth || 100;

  const handleExecuteAction = async () => {
    if (!selectedAction) return;
    
    setIsResolving(true);
    
    // Convert combat action to dice action type
    const diceActionType = combatActionToDiceAction(selectedAction);
    
    // Check if we should show dice roll
    if (shouldShowRoll(diceActionType)) {
      // Build player stats for dice roll
      const dicePlayer = toDicePlayer({
        strength: encounter.playerStats.combatSkill,
        agility: encounter.playerStats.dodgeSkill,
        charisma: encounter.playerStats.persuasionSkill,
        endurance: Math.round(encounter.playerStats.health),
        intelligence: 50,
        perception: 50
      });
      
      // Perform the dice roll
      const { diceRoll, shouldDisplay } = await performRoll({
        actionType: diceActionType,
        player: dicePlayer,
        difficulty: 'NORMAL',
        contextModifiers: encounter.environmentModifiers.map(m => ({
          source: m.source,
          value: m.value
        }))
      });
      
      if (shouldDisplay && diceRoll) {
        // Show dice roll modal, then continue after
        const result = resolveCombatRound(
          encounter,
          selectedAction,
          playerState.skills,
          npc
        );
        
        setPendingRoll(diceRoll);
        setPendingResult(result);
        return; // Wait for dice roll modal to close
      }
    }
    
    // No dice display needed, resolve immediately
    await resolveAction();
  };
  
  const resolveAction = async () => {
    if (!selectedAction) return;
    
    // Simulate combat resolution delay for drama
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = resolveCombatRound(
      encounter,
      selectedAction,
      playerState.skills,
      npc
    );
    
    // Resolve companion combat actions if dice mode is not 'story' and companions exist
    let companionResult: CompanionCombatRound | null = null;
    if (diceMode !== 'story' && activeCompanions.length > 0) {
      const companionsWithStats = activeCompanions.map(c => ({
        state: c,
        combatStats: companionCombatManager.getOrCreateCombatStats(c),
      }));
      
      companionResult = resolveCompanionCombatRound(
        companionsWithStats,
        encounter.npcStats[npc.id]?.armorProtection || 0,
        encounter.currentRound + 1
      );
      
      setCompanionRound(companionResult);
      
      // Apply companion damage to enemy
      if (companionResult.totalDamageDealt > 0 && result.encounter.npcStats[npc.id]) {
        result.encounter.npcStats[npc.id].health = Math.max(
          0, 
          result.encounter.npcStats[npc.id].health - companionResult.totalDamageDealt
        );
      }
      
      // Apply companion damage to player (friendly fire)
      if (companionResult.totalDamageToPlayer > 0) {
        result.encounter.playerStats.health = Math.max(
          0,
          result.encounter.playerStats.health - companionResult.totalDamageToPlayer
        );
      }
      
      // Apply companion healing to player
      if (companionResult.totalHealToPlayer > 0) {
        result.encounter.playerStats.health = Math.min(
          result.encounter.playerStats.maxHealth,
          result.encounter.playerStats.health + companionResult.totalHealToPlayer
        );
      }
    }
    
    applyResult(result);
  };
  
  const applyResult = (result: {
    encounter: CombatEncounter;
    narrative: string;
    combatEnded: boolean;
    outcome?: CombatOutcome;
  }) => {
    setRoundNarrative(result.narrative);
    onEncounterUpdate(result.encounter);
    
    if (result.combatEnded && result.outcome) {
      // Wait for player to read the outcome
      setTimeout(() => {
        onCombatEnd(result.outcome!, result.encounter);
      }, 2000);
    }
    
    setSelectedAction(null);
    setIsResolving(false);
  };
  
  const handleDiceRollClose = () => {
    if (pendingResult) {
      applyResult(pendingResult);
    }
    setPendingRoll(null);
    setPendingResult(null);
    clearRoll();
  };

  const getHealthColor = (current: number, max: number) => {
    const percent = (current / max) * 100;
    if (percent > 60) return 'bg-green-500';
    if (percent > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      {/* Dice Roll Modal */}
      {pendingRoll && (
        <DiceRollDisplay
          roll={pendingRoll}
          onClose={handleDiceRollClose}
          autoClose={true}
          autoCloseDelay={3000}
        />
      )}
      
      <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto border-destructive/50">
          <CardHeader className="bg-destructive/10 border-b border-destructive/30">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Swords className="w-6 h-6" />
              Combat - Round {encounter.currentRound + 1}
              {diceMode !== 'story' && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  🎲 {diceMode === 'partial' ? 'Partial' : 'Full'} Dice
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Combatant Status */}
            <div className="grid grid-cols-2 gap-8">
              {/* Player Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">You</h3>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Player
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm w-16">Health</span>
                    <Progress 
                      value={(playerHealth / playerMaxHealth) * 100} 
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16 text-right">
                      {playerHealth}/{playerMaxHealth}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm w-16">Energy</span>
                    <Progress 
                      value={encounter.playerStats.energy} 
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16 text-right">
                      {encounter.playerStats.energy}%
                    </span>
                  </div>
                </div>
              </div>
              
              {/* NPC Status */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">{npc.meta.name}</h3>
                  <Badge variant="outline" className="text-red-500 border-red-500">
                    Opponent
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span className="text-sm w-16">Health</span>
                    <Progress 
                      value={(npcHealth / npcMaxHealth) * 100} 
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16 text-right">
                      {npcHealth}/{npcMaxHealth}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm w-16">Energy</span>
                    <Progress 
                      value={encounter.npcStats[npc.id]?.energy || 0} 
                      className="flex-1"
                    />
                    <span className="text-sm font-mono w-16 text-right">
                      {encounter.npcStats[npc.id]?.energy || 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Combat Narrative */}
            {roundNarrative && (
              <div className="bg-muted/50 rounded-lg p-4 border">
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {roundNarrative}
                </p>
              </div>
            )}
            
            {/* Companion Combat Actions */}
            {companionRound && companionRound.actions.length > 0 && (
              <div className="bg-primary/10 rounded-lg p-4 border border-primary/30">
                <h4 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4" />
                  Companion Actions
                </h4>
                <div className="space-y-2">
                  {companionRound.actions.map((action, i) => (
                    <div key={i} className={cn(
                      "text-sm p-2 rounded",
                      action.outcome === 'critical_success' && "bg-green-500/20 border border-green-500/50",
                      action.outcome === 'success' && "bg-green-500/10",
                      action.outcome === 'neutral' && "bg-muted/50",
                      action.outcome === 'failure' && "bg-yellow-500/20 border border-yellow-500/50",
                      action.outcome === 'critical_failure' && "bg-red-500/20 border border-red-500/50"
                    )}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{action.companionName}</span>
                        <Badge variant="outline" className="text-xs">
                          🎲 {action.naturalRoll} + {action.totalRoll - action.naturalRoll} = {action.totalRoll}
                        </Badge>
                      </div>
                      <p className="text-xs">{action.narrative}</p>
                    </div>
                  ))}
                </div>
                {(companionRound.totalDamageToPlayer > 0 || companionRound.totalHealToPlayer > 0) && (
                  <div className="mt-2 pt-2 border-t border-primary/20 text-xs text-muted-foreground">
                    {companionRound.totalDamageDealt > 0 && (
                      <span className="text-green-500 mr-3">+{companionRound.totalDamageDealt} dmg to enemy</span>
                    )}
                    {companionRound.totalDamageToPlayer > 0 && (
                      <span className="text-red-500 mr-3">-{companionRound.totalDamageToPlayer} friendly fire</span>
                    )}
                    {companionRound.totalHealToPlayer > 0 && (
                      <span className="text-blue-500">+{companionRound.totalHealToPlayer} healed</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Combat Log */}
            {encounter.rounds.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-muted/30 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">Combat Log</h4>
                {encounter.rounds.slice(-3).map((round, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    Round {round.roundNumber}: {round.playerAction} vs {round.npcAction}
                    {round.damageDealt > 0 && ` | Dealt ${round.damageDealt} dmg`}
                    {round.damageTaken > 0 && ` | Took ${round.damageTaken} dmg`}
                  </p>
                ))}
              </div>
            )}
            
            {/* Action Selection */}
            {encounter.isActive && !encounter.outcome && (
              <div className="space-y-4">
                <h4 className="font-semibold">Choose Your Action:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {COMBAT_ACTIONS.map(({ action, label, icon, description }) => (
                    <Button
                      key={action}
                      variant={selectedAction === action ? 'default' : 'outline'}
                      className={cn(
                        "flex flex-col h-auto py-3 gap-1",
                        selectedAction === action && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedAction(action)}
                      disabled={isResolving}
                    >
                      <div className="flex items-center gap-2">
                        {icon}
                        <span>{label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-normal">
                        {description}
                      </span>
                    </Button>
                  ))}
                </div>
                
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleExecuteAction}
                    disabled={!selectedAction || isResolving}
                    className="min-w-[200px]"
                  >
                    {isResolving ? 'Resolving...' : 'Execute Action'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Combat Outcome */}
            {encounter.outcome && (
              <div className={cn(
                "text-center p-6 rounded-lg",
                encounter.outcome === 'victory' && "bg-green-500/20 border border-green-500/50",
                encounter.outcome === 'defeat' && "bg-red-500/20 border border-red-500/50",
                encounter.outcome === 'fled' && "bg-yellow-500/20 border border-yellow-500/50",
                encounter.outcome === 'de_escalated' && "bg-blue-500/20 border border-blue-500/50"
              )}>
                <h3 className="text-2xl font-bold mb-2">
                  {encounter.outcome === 'victory' && '🏆 Victory!'}
                  {encounter.outcome === 'defeat' && '💀 Defeated!'}
                  {encounter.outcome === 'fled' && '🏃 Escaped!'}
                  {encounter.outcome === 'de_escalated' && '🕊️ Peace Restored'}
                </h3>
                <p className="text-muted-foreground">
                  {encounter.outcome === 'victory' && `You have defeated ${npc.meta.name}!`}
                  {encounter.outcome === 'defeat' && `${npc.meta.name} has bested you.`}
                  {encounter.outcome === 'fled' && 'You managed to escape the fight.'}
                  {encounter.outcome === 'de_escalated' && 'The conflict has been resolved peacefully.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
