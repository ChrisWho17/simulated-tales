// In-app PWA debug page: /debug/pwa
// Exercises the update prompt, install-flag persistence, background sync queue,
// and cache health without DevTools — works on real phones too.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  checkForUpdateNow,
  requestBackgroundSync,
  simulateUpdateAvailable,
  PWA_SYNC_FLUSH_EVENT,
} from '@/pwa/registerSW';
import {
  clearInstalledFlag,
  getForceShowInstall,
  setForceShowInstall,
  usePwaInstall,
} from '@/hooks/usePwaInstall';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { useBackgroundSync } from '@/hooks/useBackgroundSync';
import { PwaStatusIndicator } from '@/components/PwaStatusIndicator';
import {
  getConflictPolicy,
  setConflictPolicy,
  type ConflictPolicy,
} from '@/services/conflictResolution';
import { listOperations, getQueueStats } from '@/services/offlineQueueStore';
import type { StoredOperation } from '@/services/offlineQueueStore';

interface CheckResult {
  name: string;
  pass: boolean | null;
  detail: string;
}

const INSTALLED_KEY = 'pwa.installed.v1';

export default function DebugPwa() {
  const status = usePwaStatus(3000);
  const install = usePwaInstall();
  const bg = useBackgroundSync();
  const [results, setResults] = useState<CheckResult[]>([]);
  const [lastFlush, setLastFlush] = useState<number | null>(null);
  const [policy, setPolicyState] = useState<ConflictPolicy>(getConflictPolicy());

  const handlePolicyChange = (next: ConflictPolicy) => {
    setConflictPolicy(next);
    setPolicyState(next);
    pushResult({
      name: 'Set conflict policy',
      pass: true,
      detail: `Server-merge policy is now "${next}"`,
    });
  };

  useEffect(() => {
    const onFlush = (e: Event) => {
      const detail = (e as CustomEvent).detail as { at?: number } | undefined;
      setLastFlush(detail?.at ?? Date.now());
      toast.info('SW requested a background sync flush');
    };
    window.addEventListener(PWA_SYNC_FLUSH_EVENT, onFlush);
    return () => window.removeEventListener(PWA_SYNC_FLUSH_EVENT, onFlush);
  }, []);

  const pushResult = (r: CheckResult) =>
    setResults((prev) => [{ ...r }, ...prev].slice(0, 12));

  const handleSimulateUpdate = () => {
    simulateUpdateAvailable();
    pushResult({
      name: 'Simulate update event',
      pass: true,
      detail: 'Dispatched pwa:update-available — toast should appear',
    });
  };

  const handleCheckForUpdate = async () => {
    const found = await checkForUpdateNow();
    pushResult({
      name: 'Check for SW update',
      pass: status.swSupported ? true : null,
      detail: found ? 'New worker found / installing' : 'No update available right now',
    });
  };

  const handleWriteInstalledFlag = () => {
    try {
      localStorage.setItem(INSTALLED_KEY, '1');
      window.dispatchEvent(new Event('pwa:installed-flag-changed'));
      const persisted = localStorage.getItem(INSTALLED_KEY) === '1';
      pushResult({
        name: 'Persist installed flag',
        pass: persisted,
        detail: persisted
          ? `Wrote ${INSTALLED_KEY}=1 to localStorage`
          : 'Write failed (storage blocked?)',
      });
    } catch (err) {
      pushResult({ name: 'Persist installed flag', pass: false, detail: String(err) });
    }
  };

  const handleVerifyAfterReload = () => {
    const present = localStorage.getItem(INSTALLED_KEY) === '1';
    pushResult({
      name: 'Verify flag survives reload',
      pass: present,
      detail: present
        ? 'Flag still present — Install button stays hidden across sessions'
        : 'Flag missing — run "Persist installed flag" then reload',
    });
  };

  const handleResetInstall = () => {
    clearInstalledFlag();
    pushResult({ name: 'Reset install state', pass: true, detail: 'Cleared installed flag' });
  };

  const handleToggleForceShow = () => {
    const next = !getForceShowInstall();
    setForceShowInstall(next);
    pushResult({ name: 'Force-show install', pass: true, detail: `forceShow=${next}` });
  };

  const handleQueueDummy = async () => {
    try {
      await bg.queueSave({
        id: `debug-${Date.now()}`,
        name: 'PWA Debug Probe',
      } as unknown as Parameters<typeof bg.queueSave>[0]);
      pushResult({
        name: 'Queue offline save probe',
        pass: true,
        detail: `Queue size now: ${bg.pendingCount + 1}`,
      });
    } catch (err) {
      pushResult({ name: 'Queue offline save probe', pass: false, detail: String(err) });
    }
  };

  const handleRequestSync = async () => {
    const ok = await requestBackgroundSync();
    pushResult({
      name: 'Register Background Sync tag',
      pass: ok,
      detail: ok
        ? 'Browser scheduled untold-flush-saves'
        : 'Background Sync API not available (Safari/Firefox) — online-event fallback still works',
    });
  };

  const handleForceFlush = async () => {
    const res = await bg.forceSyncNow();
    pushResult({
      name: 'Force flush queue',
      pass: res.failed === 0,
      detail: `Synced: ${res.synced}, Failed: ${res.failed}`,
    });
  };

  const handleReload = () => window.location.reload();

  const cacheList = useMemo(() => status.cacheNames.slice(0, 8), [status.cacheNames]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">PWA Debug</h1>
            <p className="text-sm text-muted-foreground">
              Exercise updates, install-flag persistence, background sync, and cache health.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PwaStatusIndicator />
            <Button asChild variant="ghost" size="sm">
              <Link to="/">Back</Link>
            </Button>
          </div>
        </header>

        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Live status</h2>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>
              Network: <span className="text-foreground">{status.online ? 'online' : 'offline'}</span>
            </div>
            <div>
              SW state:{' '}
              <span className="text-foreground">
                {status.swState}
                {status.swControlled ? ' (controlling)' : ''}
              </span>
            </div>
            <div>
              Update available:{' '}
              <span className="text-foreground">{status.updateAvailable ? 'yes' : 'no'}</span>
            </div>
            <div>
              Last update applied:{' '}
              <span className="text-foreground">
                {status.lastUpdateAppliedAt
                  ? new Date(status.lastUpdateAppliedAt).toLocaleString()
                  : 'never'}
              </span>
            </div>
            <div>
              Standalone: <span className="text-foreground">{install.isStandalone ? 'yes' : 'no'}</span>
            </div>
            <div>
              Installed flag:{' '}
              <span className="text-foreground">{install.installedFlag ? 'yes' : 'no'}</span>
            </div>
            <div>
              Install prompt ready:{' '}
              <span className="text-foreground">{install.canInstall ? 'yes' : 'no'}</span>
            </div>
            <div>
              Force-show install:{' '}
              <span className="text-foreground">{getForceShowInstall() ? 'yes' : 'no'}</span>
            </div>
            <div>
              Cached files: <span className="text-foreground">{status.cachedEntryCount}</span>
            </div>
            <div>
              Caches: <span className="text-foreground">{status.cacheNames.length}</span>
            </div>
            <div>
              Pending sync ops: <span className="text-foreground">{bg.pendingCount}</span>
            </div>
            <div>
              Last SW flush ping:{' '}
              <span className="text-foreground">
                {lastFlush ? new Date(lastFlush).toLocaleTimeString() : 'never'}
              </span>
            </div>
          </div>
          {cacheList.length > 0 && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-1">Cache buckets:</div>
              <div className="flex flex-wrap gap-1">
                {cacheList.map((n) => (
                  <Badge key={n} variant="outline" className="text-[10px]">
                    {n}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Update flow</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleSimulateUpdate}>
              Simulate update available
            </Button>
            <Button size="sm" variant="outline" onClick={handleCheckForUpdate}>
              Check for SW update
            </Button>
            <Button size="sm" variant="outline" onClick={handleReload}>
              Reload page
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            "Simulate" fires the same custom event the real flow uses — the refresh toast at the
            bottom of the page should appear.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Install-flag persistence</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={handleWriteInstalledFlag}>
              1. Persist installed flag
            </Button>
            <Button size="sm" variant="outline" onClick={handleReload}>
              2. Reload
            </Button>
            <Button size="sm" variant="outline" onClick={handleVerifyAfterReload}>
              3. Verify after reload
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button size="sm" variant="ghost" onClick={handleToggleForceShow}>
              Toggle force-show
            </Button>
            <Button size="sm" variant="destructive" onClick={handleResetInstall}>
              Reset install state
            </Button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Background sync</h2>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleQueueDummy}>
              Queue offline save probe
            </Button>
            <Button size="sm" variant="outline" onClick={handleRequestSync}>
              Register Background Sync
            </Button>
            <Button size="sm" variant="outline" onClick={handleForceFlush}>
              Force flush queue
            </Button>
            <Button size="sm" variant="secondary" onClick={handleExportQueue}>
              Export queue + merge timeline
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: disable network in your browser, click "Queue offline save probe", then re-enable
            network — the queue should drain automatically. Where supported (Chrome/Edge), the SW
            also fires PWA_SYNC_FLUSH when the OS triggers the sync tag.
          </p>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Conflict-resolution policy</h2>
          <p className="text-xs text-muted-foreground">
            Controls how queued offline saves merge with the server when both
            sides have changes. Applied on the next flush.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={policy === 'merge-by-tick' ? 'default' : 'outline'}
              onClick={() => handlePolicyChange('merge-by-tick')}
            >
              Merge by tick
            </Button>
            <Button
              size="sm"
              variant={policy === 'last-write-wins' ? 'default' : 'outline'}
              onClick={() => handlePolicyChange('last-write-wins')}
            >
              Last-write-wins
            </Button>
            <Badge variant="secondary" className="self-center">
              active: {policy}
            </Badge>
          </div>
        </Card>

        <Card className="p-4 space-y-2">
          <h2 className="text-sm font-semibold text-foreground">Results</h2>
          {results.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Run a check above — results will appear here.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs">
                  <Badge
                    variant={r.pass === null ? 'secondary' : r.pass ? 'default' : 'destructive'}
                    className="shrink-0"
                  >
                    {r.pass === null ? 'INFO' : r.pass ? 'PASS' : 'FAIL'}
                  </Badge>
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-muted-foreground break-words">{r.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
