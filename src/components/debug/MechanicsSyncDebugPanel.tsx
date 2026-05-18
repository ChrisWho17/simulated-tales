// ============================================================================
// MECHANICS SYNC DEBUG PANEL
// Dev-only floating panel. Compares pendingMechanics (React state) against
// latestMechanicsRef (sync mirror) and flashes a banner when a rollback fires.
// Enable with `?debug=mechanics` or in dev mode.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import type { GameMechanics } from '@/components/adventure/types';

interface MechanicsSyncDebugPanelProps {
  pendingMechanics: GameMechanics | undefined;
  latestMechanicsRef: React.MutableRefObject<GameMechanics | undefined>;
}

function shallowDiffKeys(a: any, b: any): string[] {
  const out: string[] = [];
  const keys = new Set<string>([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) {
    if (JSON.stringify(a?.[k]) !== JSON.stringify(b?.[k])) out.push(k);
  }
  return out;
}

export const MechanicsSyncDebugPanel: React.FC<MechanicsSyncDebugPanelProps> = ({
  pendingMechanics,
  latestMechanicsRef,
}) => {
  const [enabled, setEnabled] = useState(false);
  const [refSnap, setRefSnap] = useState<GameMechanics | undefined>(undefined);
  const [rollbackFlash, setRollbackFlash] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get('debug') === 'mechanics';
    setEnabled(flag || (import.meta as any).env?.DEV === true && url.searchParams.get('debug') === 'mechanics');
  }, []);

  // Poll the ref every 250ms so panel reflects sync-state drift
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setRefSnap(latestMechanicsRef.current), 250);
    return () => clearInterval(id);
  }, [enabled, latestMechanicsRef]);

  useEffect(() => {
    if (!enabled) return;
    const onRollback = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      setRollbackFlash(`Rollback cleared stale mechanics @ entry ${detail.entryIndex ?? '?'}`);
      setTimeout(() => setRollbackFlash(null), 3500);
    };
    window.addEventListener('rollback-cleared-mechanics', onRollback);
    return () => window.removeEventListener('rollback-cleared-mechanics', onRollback);
  }, [enabled]);

  const diffs = useMemo(
    () => shallowDiffKeys(pendingMechanics, refSnap),
    [pendingMechanics, refSnap]
  );
  const inSync = diffs.length === 0;

  if (!enabled) return null;

  return (
    <div
      className="fixed bottom-3 right-3 z-[9999] max-w-sm rounded-lg border border-border bg-background/90 p-3 text-xs font-mono shadow-xl backdrop-blur"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-foreground">Mechanics Sync</span>
        <span
          className={`rounded px-2 py-0.5 text-[10px] ${
            inSync ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
          }`}
        >
          {inSync ? 'IN SYNC' : `DRIFT (${diffs.length})`}
        </span>
      </div>

      {rollbackFlash && (
        <div className="mb-2 rounded border border-warning/40 bg-warning/10 p-2 text-warning">
          ⏪ {rollbackFlash}
        </div>
      )}

      {!inSync && (
        <div className="mb-2 text-destructive">
          Keys differ: {diffs.join(', ')}
        </div>
      )}

      <details className="mb-1">
        <summary className="cursor-pointer text-muted-foreground">pendingMechanics</summary>
        <pre className="mt-1 max-h-32 overflow-auto text-foreground/80">
{JSON.stringify(pendingMechanics ?? null, null, 2)}
        </pre>
      </details>
      <details>
        <summary className="cursor-pointer text-muted-foreground">latestMechanicsRef.current</summary>
        <pre className="mt-1 max-h-32 overflow-auto text-foreground/80">
{JSON.stringify(refSnap ?? null, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default MechanicsSyncDebugPanel;
