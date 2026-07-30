import { useEffect, useState } from 'react';
import { Star, Mail, History } from 'lucide-react';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import {
  ChangelogEntry,
  chronologicalEntries,
  fetchChangelog,
  getLatestEntry,
} from '@/lib/changelog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const CHANGELOG_UPDATED_EVENT = 'untold-changelog-updated';

export function notifyChangelogUpdated() {
  window.dispatchEvent(new Event(CHANGELOG_UPDATED_EVENT));
}

/**
 * Fixed top-right version + patch highlights/hotfixes badge.
 * Correctly handles patches with fixes: [] (shows empty state, no count badge).
 */
export function VersionHotfixesBadge() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<ChangelogEntry | null>(null);
  const [updateReady, setUpdateReady] = useState(false);

  const latest = getLatestEntry(entries);
  const highlights = latest?.highlights ?? [];
  const fixes = latest?.fixes ?? [];

  useEffect(() => {
    const reload = () => {
      fetchChangelog(true)
        .then(setEntries)
        .catch(() => {});
      setUpdateReady(true);
    };
    window.addEventListener(CHANGELOG_UPDATED_EVENT, reload);
    return () => window.removeEventListener(CHANGELOG_UPDATED_EVENT, reload);
  }, []);

  useEffect(() => {
    fetchChangelog(true).then(setEntries).catch(() => {});
  }, []);

  return (
    <div
      data-testid="version-hotfixes-badge"
      data-update-ready={updateReady || undefined}
      className="fixed top-14 sm:top-2 right-2 z-[240] flex flex-col items-end gap-1 pointer-events-none"
    >
      <span
        data-testid="version-string"
        className={`text-[10px] font-mono px-2 py-0.5 rounded border backdrop-blur-sm pointer-events-auto transition-colors ${
          updateReady
            ? 'text-primary border-primary/60 bg-primary/15 animate-pulse'
            : 'text-muted-foreground/70 border-border/30 bg-black/40'
        }`}
        title={updateReady ? 'New version ready — reload to apply' : `Build: ${BUILD_NUMBER}`}
      >
        {updateReady ? `${VERSION_STRING} • update ready` : VERSION_STRING}
      </span>

      <div className="flex items-center gap-1 pointer-events-auto">
        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Patch highlights"
              data-testid="highlights-trigger"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-black/40 border border-border/30 hover:border-amber-400/60 hover:bg-amber-400/10 transition-colors backdrop-blur-sm"
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3" data-testid="highlights-popover">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">
                Highlights · v{latest?.version}
              </span>
            </div>
            {highlights.length ? (
              <ul className="space-y-1.5" data-testid="highlights-list">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="text-xs text-foreground/90 pl-3 border-l-2 border-amber-400/50"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No highlights for this patch.</p>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button
              aria-label="Patch hotfixes"
              data-testid="hotfixes-trigger"
              className="w-7 h-7 flex items-center justify-center rounded-md bg-black/40 border border-border/30 hover:border-orange-400/60 hover:bg-orange-400/10 transition-colors backdrop-blur-sm relative"
            >
              <Mail className="w-3.5 h-3.5 text-orange-400" />
              {fixes.length > 0 && (
                <span
                  data-testid="hotfixes-count-badge"
                  className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-orange-500 text-[9px] font-bold text-white flex items-center justify-center"
                >
                  {fixes.length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3" data-testid="hotfixes-popover">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-semibold text-orange-400">
                Hotfixes · v{latest?.version}
              </span>
            </div>
            {fixes.length ? (
              <ul className="space-y-1.5" data-testid="hotfixes-list">
                {fixes.map((f, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground pl-3 border-l-2 border-orange-400/40"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground" data-testid="hotfixes-empty">
                No hotfixes in this patch.
              </p>
            )}
            <div className="mt-3 pt-2 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                data-testid="hotfixes-history-trigger"
                onClick={() => setHistoryOpen(true)}
                className="w-full h-7 text-[11px] text-muted-foreground hover:text-orange-400"
              >
                <History className="w-3 h-3 mr-1.5" />
                View full hotfix history
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent
          className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden border-none bg-gradient-to-b from-background via-background to-primary/5"
          data-testid="hotfixes-history-dialog"
        >
          <DialogHeader className="p-3 sm:p-5 bg-gradient-to-r from-primary/15 via-amber-500/10 to-orange-500/10">
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm sm:text-base">
              <History className="w-4 h-4 text-primary" />
              Game Timeline · Origin → Now
            </DialogTitle>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
              Tap a node for that release&apos;s full event &amp; fixes history
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] sm:max-h-[70vh]">
            <div
              className="relative px-3 sm:px-6 py-4 sm:py-6"
              data-testid="hotfixes-history-list"
            >
              <div
                aria-hidden
                className="absolute left-[18px] sm:left-[26px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-primary/70 via-amber-400/50 to-orange-500/60 rounded-full"
              />
              {chronologicalEntries(entries).map((entry, index) => {
                const isMajor = /\.\d+\.0$/.test(entry.version);
                const events = [
                  ...(entry.highlights ?? []).map((t) => ({ kind: 'highlight' as const, text: t })),
                  ...entry.fixes.map((t) => ({ kind: 'fix' as const, text: t })),
                ];
                const preview = events.slice(0, 2);
                const rest = events.length - preview.length;
                return (
                  <button
                    key={entry.version}
                    type="button"
                    onClick={() => setSelected(entry)}
                    data-testid={`history-entry-${entry.version}`}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className="group relative w-full text-left pl-9 sm:pl-12 pb-5 sm:pb-6 last:pb-0 focus:outline-none"
                  >
                    <span
                      aria-hidden
                      className={`absolute left-[10px] sm:left-[18px] top-1 w-[18px] h-[18px] rounded-full ring-4 ring-background transition-transform group-hover:scale-125 ${
                        isMajor
                          ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]'
                          : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      }`}
                    />
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span
                        className={`text-sm font-bold group-hover:underline underline-offset-2 ${
                          isMajor ? 'text-primary' : 'text-amber-400'
                        }`}
                      >
                        v{entry.version}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {isMajor ? 'Major' : 'Patch'} · {entry.date}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-foreground/90 mt-0.5 mb-1.5 break-words">
                      {entry.title}
                    </p>
                    {preview.length > 0 && (
                      <ul className="space-y-1">
                        {preview.map((ev, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground">
                            {ev.kind === 'fix' ? 'Fix: ' : ''}
                            {ev.text}
                          </li>
                        ))}
                        {rest > 0 && (
                          <li className="text-[10px] text-muted-foreground/70">+{rest} more…</li>
                        )}
                      </ul>
                    )}
                    {events.length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No hotfixes in this patch.</p>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md" data-testid="release-detail-dialog">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>
                  v{selected.version} — {selected.title}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{selected.date}</p>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {selected.highlights?.length > 0 && (
                  <section>
                    <h4 className="text-amber-400 font-semibold text-xs mb-1">Highlights</h4>
                    <ul className="space-y-1">
                      {selected.highlights.map((h, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {h}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {selected.fixes.length > 0 ? (
                  <section>
                    <h4 className="text-orange-400 font-semibold text-xs mb-1">Fixes</h4>
                    <ul className="space-y-1" data-testid="release-fixes-list">
                      {selected.fixes.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground">
                          {f}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : (
                  <p className="text-xs text-muted-foreground" data-testid="release-fixes-empty">
                    No hotfixes in this patch.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
