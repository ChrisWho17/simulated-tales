import { Wifi, WifiOff, Cloud, CloudOff, Loader2 } from 'lucide-react';
const CloudCheck = Cloud;
const CloudAlert = CloudOff;



import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { usePwaStatus } from '@/hooks/usePwaStatus';
import { cn } from '@/lib/utils';

function formatRelative(ts: number | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  const m = Math.round(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function PwaStatusIndicator({ className }: { className?: string }) {
  const s = usePwaStatus();

  if (!s.swSupported) return null;

  const offline = !s.online;
  const installing = s.swState === 'installing';
  const waiting = s.swState === 'waiting' || s.updateAvailable;
  const healthy = s.swState === 'active' && s.swControlled && s.cachedEntryCount > 0;

  const Icon = offline ? WifiOff : installing ? Loader2 : waiting ? CloudAlert : healthy ? CloudCheck : Wifi;

  const tone = offline
    ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
    : waiting
      ? 'text-primary border-primary/40 bg-primary/10'
      : healthy
        ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
        : 'text-muted-foreground border-border/60 bg-card/40';

  const label = offline
    ? 'Offline'
    : waiting
      ? 'Update'
      : healthy
        ? 'Ready'
        : s.swControlled
          ? 'Live'
          : 'Online';

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`App status: ${label}`}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium backdrop-blur transition-colors',
              tone,
              className,
            )}
          >
            <Icon className={cn('h-3 w-3', installing && 'animate-spin')} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs space-y-1">
          <div className="font-semibold">App status</div>
          <div>
            Network: <span className="text-foreground">{s.online ? 'online' : 'offline'}</span>
          </div>
          <div>
            Service worker:{' '}
            <span className="text-foreground">
              {s.swState}
              {s.swControlled ? ' (controlling)' : ''}
            </span>
          </div>
          <div>
            Cached files: <span className="text-foreground">{s.cachedEntryCount}</span> across{' '}
            {s.cacheNames.length} caches
          </div>
          <div>
            Update applied:{' '}
            <span className="text-foreground">{formatRelative(s.lastUpdateAppliedAt)}</span>
          </div>
          {s.updateAvailable && (
            <div className="text-primary">A new version is waiting to activate.</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
