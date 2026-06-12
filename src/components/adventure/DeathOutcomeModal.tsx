// Death Outcome Modal — fires when player HP hits 0.
// Offers: roll for revival, cheat resurrection, or flatline (campaign ends with a life overview).

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skull, Dices, Wand2, Flame, Heart, Trophy, Sword, Coins, Clock } from 'lucide-react';
import { RPGCharacter, getStatModifier } from '@/types/rpgCharacter';
import { StoryEntry } from './types';
import { cn } from '@/lib/utils';

interface DeathOutcomeModalProps {
  open: boolean;
  character: RPGCharacter;
  causeOfDeath: string;        // short prose extracted from last narrator entry
  story: StoryEntry[];
  cheatEnabled: boolean;
  onRevive: (newHealth: number, narrative: string) => void; // soft revive
  onFlatlineConfirmed: () => void;                          // campaign over → main menu
}

type Stage = 'death' | 'rolling' | 'rolled' | 'overview';

const REVIVAL_DC = 15;

export function DeathOutcomeModal({
  open,
  character,
  causeOfDeath,
  story,
  cheatEnabled,
  onRevive,
  onFlatlineConfirmed,
}: DeathOutcomeModalProps) {
  const [stage, setStage] = useState<Stage>('death');
  const [rollResult, setRollResult] = useState<{ raw: number; mod: number; total: number; success: boolean } | null>(null);

  // Reset stage whenever the modal reopens for a new death
  useEffect(() => {
    if (open) {
      setStage('death');
      setRollResult(null);
    }
  }, [open]);

  const conMod = getStatModifier(character.stats.constitution);

  const stats = useMemo(() => {
    const turnCount = story.filter(e => e.role === 'user').length;
    const narratorCount = story.filter(e => e.role === 'narrator').length;
    const wordsWritten = story.reduce((sum, e) => sum + (e.content?.split(/\s+/).length || 0), 0);
    const firstTs = story[0]?.timestamp || Date.now();
    const lastTs = story[story.length - 1]?.timestamp || Date.now();
    const minutesLived = Math.max(1, Math.round((lastTs - firstTs) / 60000));
    return { turnCount, narratorCount, wordsWritten, minutesLived };
  }, [story]);

  const handleRoll = () => {
    setStage('rolling');
    setTimeout(() => {
      const raw = Math.floor(Math.random() * 20) + 1;
      const total = raw + conMod;
      const success = raw === 20 || (raw !== 1 && total >= REVIVAL_DC);
      setRollResult({ raw, mod: conMod, total, success });
      setStage('rolled');
    }, 1100);
  };

  const handleAcceptRoll = () => {
    if (!rollResult) return;
    if (rollResult.success) {
      const restoredHealth = Math.max(1, Math.floor(character.maxHealth * 0.25));
      onRevive(
        restoredHealth,
        `*Against all odds, ${character.name} draws a ragged breath. The void releases its grip — ${restoredHealth} HP restored. The wound remains; the soul does not.*`
      );
    } else {
      setStage('overview');
    }
  };

  const handleCheatRevive = () => {
    onRevive(
      character.maxHealth,
      `*[CHEAT] Reality blinks. The wound that ended ${character.name} unspools backward as if it never happened. Full health restored.*`
    );
  };

  const handleFlatline = () => {
    setStage('overview');
  };

  const handleCloseCampaign = () => {
    onFlatlineConfirmed();
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* non-dismissable */ }}>
      <DialogContent
        className="max-w-lg border-destructive/40 bg-card/95 backdrop-blur-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {stage === 'death' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center animate-pulse">
                <Skull className="w-8 h-8 text-destructive" />
              </div>
              <DialogTitle className="text-center text-2xl text-destructive">
                {character.name} has fallen
              </DialogTitle>
              <DialogDescription className="text-center text-base text-foreground/80 italic pt-2">
                {causeOfDeath}
              </DialogDescription>
            </DialogHeader>

            <Separator className="bg-destructive/20" />

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Your fate is not yet sealed. Choose:
              </p>

              <button
                onClick={handleRoll}
                className="w-full text-left rounded-md border border-primary/40 bg-primary/5 hover:bg-primary/10 p-4 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <Dices className="w-5 h-5 text-primary mt-0.5 group-hover:rotate-12 transition-transform" />
                  <div className="flex-1">
                    <div className="font-semibold">Roll for Revival</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      d20 + CON ({conMod >= 0 ? '+' : ''}{conMod}) vs DC {REVIVAL_DC}. Success: revive at 25% HP. Failure: flatline.
                    </div>
                  </div>
                </div>
              </button>

              {cheatEnabled && (
                <button
                  onClick={handleCheatRevive}
                  className="w-full text-left rounded-md border border-accent/40 bg-accent/5 hover:bg-accent/10 p-4 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <Wand2 className="w-5 h-5 text-accent mt-0.5" />
                    <div className="flex-1">
                      <div className="font-semibold">Cheat Resurrection</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Bend the rules. Full HP restored, story continues.
                      </div>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={handleFlatline}
                className="w-full text-left rounded-md border border-destructive/40 bg-destructive/5 hover:bg-destructive/10 p-4 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <div className="font-semibold">Flatline</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Accept the end. Review {character.name}'s story, then return to the main menu. <span className="text-destructive">Campaign over.</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </>
        )}

        {stage === 'rolling' && (
          <div className="py-10 flex flex-col items-center gap-4">
            <Dices className="w-16 h-16 text-primary animate-spin" />
            <p className="text-muted-foreground">The dice tumble across the void…</p>
          </div>
        )}

        {stage === 'rolled' && rollResult && (
          <>
            <DialogHeader>
              <DialogTitle className={cn(
                "text-center text-2xl",
                rollResult.success ? "text-success" : "text-destructive"
              )}>
                {rollResult.success ? 'The Thread Holds' : 'The Thread Snaps'}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center justify-center gap-3 py-4">
              <div className="text-center">
                <div className="text-5xl font-bold tabular-nums">{rollResult.raw}</div>
                <div className="text-xs text-muted-foreground mt-1">d20</div>
              </div>
              <div className="text-2xl text-muted-foreground">+</div>
              <div className="text-center">
                <div className="text-5xl font-bold tabular-nums">{rollResult.mod >= 0 ? '+' : ''}{rollResult.mod}</div>
                <div className="text-xs text-muted-foreground mt-1">CON</div>
              </div>
              <div className="text-2xl text-muted-foreground">=</div>
              <div className="text-center">
                <div className={cn(
                  "text-5xl font-bold tabular-nums",
                  rollResult.success ? "text-success" : "text-destructive"
                )}>{rollResult.total}</div>
                <div className="text-xs text-muted-foreground mt-1">vs DC {REVIVAL_DC}</div>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground italic">
              {rollResult.success
                ? `${character.name} claws back from the brink, gasping. The world rushes in again.`
                : `No breath returns. ${character.name}'s story ends here.`}
            </p>

            <DialogFooter className="pt-2">
              <Button
                variant={rollResult.success ? 'default' : 'destructive'}
                className="w-full"
                onClick={handleAcceptRoll}
              >
                {rollResult.success ? 'Continue' : 'View Final Story'}
              </Button>
            </DialogFooter>
          </>
        )}

        {stage === 'overview' && (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 w-14 h-14 rounded-full bg-destructive/15 border border-destructive/40 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-destructive" />
              </div>
              <DialogTitle className="text-center text-2xl">
                The Tale of {character.name}
              </DialogTitle>
              <DialogDescription className="text-center italic">
                {causeOfDeath}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[55vh] pr-3">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatRow icon={Heart} label="Final Health" value={`0 / ${character.maxHealth}`} />
                  <StatRow icon={Sword} label="Level" value={String(character.level)} />
                  <StatRow icon={Trophy} label="Experience" value={String(character.experience)} />
                  <StatRow icon={Coins} label="Gold at Death" value={String(character.gold)} />
                  <StatRow icon={Clock} label="Turns Lived" value={String(stats.turnCount)} />
                  <StatRow icon={Clock} label="Time in World" value={`${stats.minutesLived} min`} />
                </div>

                <Separator />

                <section>
                  <h4 className="text-sm font-semibold text-primary mb-2">Traits</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {character.traits.length > 0
                      ? character.traits.map(t => (
                          <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 border border-primary/30">
                            {t}
                          </span>
                        ))
                      : <span className="text-xs text-muted-foreground italic">None recorded</span>}
                  </div>
                </section>

                {character.skills.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-primary mb-2">Skills Earned</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {character.skills.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {character.inventory.length > 0 && (
                  <section>
                    <h4 className="text-sm font-semibold text-primary mb-2">Possessions at Death</h4>
                    <ul className="text-xs text-muted-foreground space-y-0.5">
                      {character.inventory.slice(0, 10).map(item => (
                        <li key={item.id}>• {item.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}</li>
                      ))}
                      {character.inventory.length > 10 && (
                        <li className="italic">…and {character.inventory.length - 10} more</li>
                      )}
                    </ul>
                  </section>
                )}

                <Separator />

                <section>
                  <h4 className="text-sm font-semibold text-primary mb-2">Final Words</h4>
                  <p className="text-xs italic text-muted-foreground leading-relaxed">
                    {story.filter(e => e.role === 'narrator').slice(-1)[0]?.content?.slice(0, 280) || 'A life cut short before it could be remembered.'}
                    {(story.filter(e => e.role === 'narrator').slice(-1)[0]?.content?.length || 0) > 280 ? '…' : ''}
                  </p>
                </section>

                <p className="text-center text-xs text-muted-foreground pt-2">
                  {stats.narratorCount} chapters written · {stats.wordsWritten.toLocaleString()} words of legend
                </p>
              </div>
            </ScrollArea>

            <DialogFooter className="pt-2">
              <Button variant="destructive" className="w-full" onClick={handleCloseCampaign}>
                End Campaign & Return to Main Menu
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-sm font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}
