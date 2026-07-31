import { useEffect, useState } from 'react';
import { Brain, Zap, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AiNarrationConfig,
  DirectorFrequency,
  NARRATOR_MODEL_OPTIONS,
  DIRECTOR_MODEL_OPTIONS,
  FALLBACK_MODEL_OPTIONS,
  NarrationTelemetry,
  getNarrationTelemetry,
  loadAiNarrationConfig,
  saveAiNarrationConfig,
} from '@/game/aiNarrationConfig';
import { storyDirectorService } from '@/services/storyDirectorService';
import { DirectorState } from '@/game/storyDirectorSystem';

const FREQUENCY_OPTIONS: Array<{ id: DirectorFrequency; label: string }> = [
  { id: 'off', label: 'Off (manual only)' },
  { id: 'rare', label: 'Rare (every 16 turns)' },
  { id: 'normal', label: 'Normal (every 8 turns)' },
  { id: 'frequent', label: 'Frequent (every 4 turns)' },
];

const rowClass =
  'flex items-center justify-between p-2.5 rounded-lg border border-border/30 bg-background/30';

export function AiNarrationSettings() {
  const [config, setConfig] = useState<AiNarrationConfig>(() => loadAiNarrationConfig());
  const [telemetry, setTelemetry] = useState<NarrationTelemetry>(() => getNarrationTelemetry());
  const [directorState, setDirectorState] = useState<DirectorState>(() =>
    storyDirectorService.getState()
  );
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const onTelemetry = (e: Event) =>
      setTelemetry((e as CustomEvent<NarrationTelemetry>).detail);
    window.addEventListener('ai-narration-telemetry', onTelemetry);
    const unsubscribe = storyDirectorService.subscribe(setDirectorState);
    return () => {
      window.removeEventListener('ai-narration-telemetry', onTelemetry);
      unsubscribe();
    };
  }, []);

  const update = (patch: Partial<AiNarrationConfig>) => {
    const next = { ...config, ...patch };
    setConfig(next);
    saveAiNarrationConfig(next);
  };

  const handleManualDirector = async () => {
    setRefreshing(true);
    try {
      await storyDirectorService.runDirector('manual');
    } finally {
      setRefreshing(false);
    }
  };

  const brief = directorState.currentDirectorBrief;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <Brain className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        <span className="text-xs font-medium">AI Narration</span>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Live Narrator model</span>
        <Select value={config.narratorModel} onValueChange={(v) => update({ narratorModel: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50 max-h-60">
            {NARRATOR_MODEL_OPTIONS.map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground leading-tight">
          Writes every visible turn. Lightweight models are intentionally not offered.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Story Director model</span>
        <Select value={config.directorModel} onValueChange={(v) => update({ directorModel: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50 max-h-60">
            {DIRECTOR_MODEL_OPTIONS.map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[10px] text-muted-foreground leading-tight">
          The invisible dungeon master. Runs in the background — you never wait on it.
        </p>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Fallback model</span>
        <Select value={config.fallbackModel} onValueChange={(v) => update({ fallbackModel: v })}>
          <SelectTrigger className="w-full h-9 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50 max-h-60">
            {FALLBACK_MODEL_OPTIONS.map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <span className="text-xs text-muted-foreground">Director frequency</span>
        <Select
          value={config.directorFrequency}
          onValueChange={(v) => update({ directorFrequency: v as DirectorFrequency })}
        >
          <SelectTrigger className="w-full h-9 text-xs bg-background/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-background border border-border z-50 max-h-60">
            {FREQUENCY_OPTIONS.map((o) => (
              <SelectItem key={o.id} value={o.id} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={rowClass}>
        <div className="flex flex-col">
          <span className="text-xs">Stream narration</span>
          <span className="text-[10px] text-muted-foreground">Show prose as it is written</span>
        </div>
        <Switch
          checked={config.streaming}
          onCheckedChange={(checked) => update({ streaming: checked })}
        />
      </div>

      <div className={rowClass}>
        <div className="flex flex-col">
          <span className="text-xs">Debug info</span>
          <span className="text-[10px] text-muted-foreground">Latency, model used, brief status</span>
        </div>
        <Switch
          checked={config.debug}
          onCheckedChange={(checked) => update({ debug: checked })}
        />
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full h-8 text-xs"
        onClick={handleManualDirector}
        disabled={refreshing || storyDirectorService.isRunning()}
      >
        <RefreshCw
          className={`w-3 h-3 mr-1.5 ${refreshing ? 'animate-spin' : ''}`}
          aria-hidden="true"
        />
        {refreshing ? 'Director thinking…' : 'Refresh Director Brief'}
      </Button>

      {config.debug && (
        <div className="p-2.5 rounded-lg border border-border/30 bg-background/30 space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Zap className="w-3 h-3" aria-hidden="true" />
            <span>Diagnostics</span>
          </div>
          <p className="text-[10px] text-muted-foreground break-words">
            Narrator: {telemetry.lastModelUsed ?? config.narratorModel}
            {telemetry.lastLatencyMs != null ? ` · ${telemetry.lastLatencyMs}ms` : ''}
            {telemetry.usedFallback ? ' · fallback used' : ''}
          </p>
          <p className="text-[10px] text-muted-foreground break-words">
            Director: {telemetry.directorModelUsed ?? config.directorModel}
            {telemetry.directorLatencyMs != null ? ` · ${telemetry.directorLatencyMs}ms` : ''}
          </p>
          <p className="text-[10px] text-muted-foreground break-words">
            Turns: {directorState.turnCount} ({directorState.meaningfulTurnCount} meaningful) ·
            Memories: {directorState.longTermMemories.length}
          </p>
          <p className="text-[10px] text-muted-foreground break-words">
            Brief:{' '}
            {brief
              ? `${brief.triggerReason} · tension ${brief.tension}/10 · ${brief.unresolvedThreads.length} threads`
              : 'none yet'}
          </p>
          {brief?.storyObjective && (
            <p className="text-[10px] text-muted-foreground break-words">
              Objective: {brief.storyObjective}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AiNarrationSettings;
