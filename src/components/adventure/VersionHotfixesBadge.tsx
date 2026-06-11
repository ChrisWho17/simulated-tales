import { useState } from 'react';
import { Star, Mail, History, Bug, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { VERSION_STRING, BUILD_NUMBER } from '@/lib/version';
import { CHANGELOG, type ChangelogEntry } from './WhatsNewModal';

/**
 * Top-right floating badge:
 *  - Version number (small)
 *  - Star  -> highlights of the latest patch
 *  - Mail  -> hotfixes of the latest patch; secondary action opens full history
 */
export function VersionHotfixesBadge() {
  const latest = CHANGELOG[0];
  const highlights = latest?.highlights ?? [];
  const fixes = latest?.fixes ?? [];
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selected, setSelected] = useState<ChangelogEntry | null>(null);


  return (
    <div
      data-testid="version-hotfixes-badge"
      className="fixed top-2 right-2 z-40 flex flex-col items-end gap-1 pointer-events-none"
    >
      <span
        data-testid="version-string"
        className="text-[10px] font-mono text-muted-foreground/70 bg-black/40 px-2 py-0.5 rounded border border-border/30 backdrop-blur-sm pointer-events-auto"
        title={`Build: ${BUILD_NUMBER}`}
      >
        {VERSION_STRING}
      </span>

      <div className="flex items-center gap-1 pointer-events-auto">
        {/* Highlights */}
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
          <PopoverContent
            align="end"
            className="w-72 p-3"
            data-testid="highlights-popover"
          >
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

        {/* Hotfixes */}
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
          <PopoverContent
            align="end"
            className="w-72 p-3"
            data-testid="hotfixes-popover"
          >
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
              <p className="text-xs text-muted-foreground">No hotfixes in this patch.</p>
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
          className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-none bg-gradient-to-b from-background via-background to-primary/5"
          data-testid="hotfixes-history-dialog"
        >
          <DialogHeader className="p-5 bg-gradient-to-r from-primary/15 via-amber-500/10 to-orange-500/10">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <History className="w-4 h-4 text-primary" />
              Game Timeline · Origin → Now
            </DialogTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              Every major milestone across all Alpha releases
            </p>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="relative px-6 py-6" data-testid="hotfixes-history-list">
              {/* Vertical timeline rail — themed gradient, no borders */}
              <div
                aria-hidden
                className="absolute left-[26px] top-4 bottom-4 w-[2px] bg-gradient-to-b from-primary/70 via-amber-400/50 to-orange-500/60 rounded-full"
              />

              {(() => {
                const ordered = [...CHANGELOG].sort((a, b) =>
                  a.version.localeCompare(b.version, undefined, { numeric: true })
                );
                return ordered.map((entry, idx) => {
                  // Major = x.y.0, Minor = x.y.z (z>0)
                  const isMajor = /\.\d+\.0$/.test(entry.version);
                  const dotColor = isMajor
                    ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
                  const accent = isMajor ? 'text-primary' : 'text-amber-400';
                  const events = [
                    ...(entry.highlights ?? []).map((h) => ({ kind: 'highlight' as const, text: h })),
                    ...entry.fixes.map((f) => ({ kind: 'fix' as const, text: f })),
                  ];

                  return (
                    <div
                      key={entry.version}
                      data-testid={`history-entry-${entry.version}`}
                      className="relative pl-12 pb-6 last:pb-0"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      {/* Node dot */}
                      <span
                        aria-hidden
                        className={`absolute left-[18px] top-1.5 w-[18px] h-[18px] rounded-full ${dotColor} ring-4 ring-background`}
                      />

                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${accent}`}>
                          v{entry.version}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          {isMajor ? 'Major' : 'Patch'} · {entry.date}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground/90 mt-0.5 mb-2">
                        {entry.title}
                      </p>

                      {events.length ? (
                        <ul className="space-y-1">
                          {events.map((ev, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-foreground/75 flex items-start gap-1.5 leading-relaxed"
                            >
                              {ev.kind === 'highlight' ? (
                                <Star className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
                              ) : (
                                <Bug className="w-3 h-3 mt-0.5 text-orange-400/70 shrink-0" />
                              )}
                              <span>{ev.text}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">
                          Foundational release.
                        </p>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VersionHotfixesBadge;
