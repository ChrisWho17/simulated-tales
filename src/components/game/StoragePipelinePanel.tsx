// ============================================================================
// STORAGE PIPELINE PANEL
// User-facing control for where saves are persisted: device cache, cloud, or both.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { HardDrive, Cloud, Database, RefreshCw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { loadSettings, saveSettings } from '@/lib/gameSettings';
import { estimateStorage, bigKVStats, listBigKeys, type StorageEstimate } from '@/lib/bigKVStore';
import useCloudSyncStatus from '@/hooks/useCloudSyncStatus';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Pipeline = 'mirror' | 'local' | 'cloud';

const OPTIONS: Array<{ id: Pipeline; label: string; desc: string; icon: React.ReactNode }> = [
  {
    id: 'mirror',
    label: 'Local + Cloud (mirror)',
    desc: 'Save to this device AND your cloud account. Recommended.',
    icon: <Database className="w-4 h-4" />,
  },
  {
    id: 'local',
    label: 'Local-only cache',
    desc: 'Saves stay on this device. Cloud sync disabled.',
    icon: <HardDrive className="w-4 h-4" />,
  },
  {
    id: 'cloud',
    label: 'Cloud-first',
    desc: 'Cloud is primary; device cache only used offline.',
    icon: <Cloud className="w-4 h-4" />,
  },
];

export const StoragePipelinePanel: React.FC = () => {
  const settings = loadSettings();
  const [pipeline, setPipeline] = useState<Pipeline>(settings.storagePipeline ?? 'mirror');
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);
  const [stats, setStats] = useState(bigKVStats());
  const { account, isCloudMode, lastSyncedAt, forceSync, isSyncing, overallState } = useCloudSyncStatus();

  useEffect(() => {
    let active = true;
    estimateStorage().then(e => active && setEstimate(e));
    const t = setInterval(() => {
      if (!active) return;
      setStats(bigKVStats());
      estimateStorage().then(e => active && setEstimate(e));
    }, 5000);
    return () => { active = false; clearInterval(t); };
  }, []);

  const choose = (p: Pipeline) => {
    setPipeline(p);
    saveSettings({ ...loadSettings(), storagePipeline: p });
    toast.success(`Storage pipeline: ${OPTIONS.find(o => o.id === p)?.label}`);
  };

  const usagePct = estimate?.usagePercent ?? 0;
  const usageMB = estimate ? (estimate.usageBytes / (1024 * 1024)).toFixed(1) : '–';
  const quotaMB = estimate ? (estimate.quotaBytes / (1024 * 1024)).toFixed(0) : '–';
  const cacheKB = (stats.bytes / 1024).toFixed(0);

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Database className="w-4 h-4 text-[var(--accent-primary)]" />
          <h3 className="text-sm font-medium">Save Pipeline</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Choose where new saves are written. Existing saves are unaffected.
        </p>

        <div className="space-y-2">
          {OPTIONS.map(opt => {
            const selected = pipeline === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => choose(opt.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all',
                  'bg-black/20 hover:bg-black/30',
                  selected
                    ? 'border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/40'
                    : 'border-white/10'
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 text-[var(--accent-primary)]">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{opt.label}</span>
                      {selected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 break-words">{opt.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Device cache stats */}
      <div className="p-3 rounded-lg border border-white/10 bg-black/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <HardDrive className="w-3.5 h-3.5" /> Device cache (IndexedDB)
          </span>
          <span className="text-muted-foreground">{stats.entries} entries · {cacheKB} KB</span>
        </div>
        <Progress value={Math.min(100, usagePct)} className="h-1.5" />
        <div className="text-[11px] text-muted-foreground">
          Browser storage: {usageMB} MB / {quotaMB} MB ({usagePct.toFixed(1)}%)
        </div>
      </div>

      {/* Cloud status */}
      <div className="p-3 rounded-lg border border-white/10 bg-black/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Cloud className="w-3.5 h-3.5" /> Cloud pipeline
          </span>
          <span className={cn(
            'px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide',
            overallState === 'synced' && 'bg-emerald-500/20 text-emerald-300',
            overallState === 'pending' && 'bg-amber-500/20 text-amber-300',
            overallState === 'conflict' && 'bg-rose-500/20 text-rose-300',
            overallState === 'offline' && 'bg-slate-500/20 text-slate-300',
            overallState === 'error' && 'bg-rose-500/20 text-rose-300',
          )}>{overallState}</span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          {isCloudMode
            ? <>Signed in as <span className="text-foreground">{account.displayName || account.email || 'user'}</span></>
            : <>Not signed in — sign in to enable cloud mirror</>}
        </div>
        {lastSyncedAt && (
          <div className="text-[11px] text-muted-foreground">
            Last sync: {new Date(lastSyncedAt).toLocaleTimeString()}
          </div>
        )}
        {isCloudMode && pipeline !== 'local' && (
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-1 h-8 text-xs"
            disabled={isSyncing}
            onClick={async () => {
              const r = await forceSync();
              if (r?.synced === 0 && r?.conflicts === 0) toast.info('Already in sync');
            }}
          >
            <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing…' : 'Force sync now'}
          </Button>
        )}
      </div>

      {/* Cached campaign list */}
      <div className="p-3 rounded-lg border border-white/10 bg-black/20">
        <div className="text-xs text-muted-foreground mb-2">Cached on this device</div>
        <ul className="space-y-1 max-h-40 overflow-auto">
          {listBigKeys('lwe_campaign_').filter(k => k !== 'lwe_campaign_index').map(k => (
            <li key={k} className="flex items-center justify-between text-[11px]">
              <span className="truncate font-mono text-muted-foreground">{k.replace('lwe_campaign_', '')}</span>
              <span className="text-emerald-400 ml-2 shrink-0">● local</span>
            </li>
          ))}
          {listBigKeys('lwe_campaign_').filter(k => k !== 'lwe_campaign_index').length === 0 && (
            <li className="text-[11px] text-muted-foreground italic">No cached campaigns yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StoragePipelinePanel;
