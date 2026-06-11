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
          className="w-[calc(100vw-1rem)] sm:w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] p-0 overflow-hidden border-none bg-gradient-to-b from-background via-background to-primary/5"
          data-testid="hotfixes-history-dialog"
        >
          <DialogHeader className="p-3 sm:p-5 bg-gradient-to-r from-primary/15 via-amber-500/10 to-orange-500/10">
            <DialogTitle className="flex items-center gap-2 text-foreground text-sm sm:text-base">
              <History className="w-4 h-4 text-primary" />
              Game Timeline · Origin → Now
            </DialogTitle>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1">
              Tap a node for that release's full event & fixes history
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

              {(() => {
                // Chronological order: origin (oldest patch) → now.
                // Every patch is included with no skipping.
                const ordered = [...CHANGELOG].sort((a, b) =>
                  a.version.localeCompare(b.version, undefined, { numeric: true })
                );
                return ordered.map((entry, idx) => {
                  const isMajor = /\.\d+\.0$/.test(entry.version);
                  const dotColor = isMajor
                    ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary)/0.8)]'
                    : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]';
                  const accent = isMajor ? 'text-primary' : 'text-amber-400';
                  const events = [
                    ...(entry.highlights ?? []).map((h) => ({ kind: 'highlight' as const, text: h })),
                    ...entry.fixes.map((f) => ({ kind: 'fix' as const, text: f })),
                  ];
                  const preview = events.slice(0, 2);
                  const remaining = events.length - preview.length;

                  return (
                    <button
                      key={entry.version}
                      type="button"
                      onClick={() => setSelected(entry)}
                      data-testid={`history-entry-${entry.version}`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                      className="group relative w-full text-left pl-9 sm:pl-12 pb-5 sm:pb-6 last:pb-0 focus:outline-none"
                    >
                      <span
                        aria-hidden
                        className={`absolute left-[10px] sm:left-[18px] top-1 w-[18px] h-[18px] rounded-full ${dotColor} ring-4 ring-background transition-transform group-hover:scale-125 group-focus-visible:scale-125`}
                      />

                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className={`text-sm font-bold ${accent} group-hover:underline underline-offset-2`}>
                          v{entry.version}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                          {isMajor ? 'Major' : 'Patch'} · {entry.date}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-foreground/90 mt-0.5 mb-1.5 break-words">
                        {entry.title}
                      </p>

                      {preview.length ? (
                        <ul className="space-y-1">
                          {preview.map((ev, i) => (
                            <li
                              key={i}
                              className="text-[11px] text-foreground/75 flex items-start gap-1.5 leading-snug break-words"
                            >
                              {ev.kind === 'highlight' ? (
                                <Star className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
                              ) : (
                                <Bug className="w-3 h-3 mt-0.5 text-orange-400/70 shrink-0" />
                              )}
                              <span className="min-w-0">{ev.text}</span>
                            </li>
                          ))}
                          {remaining > 0 && (
                            <li className="text-[10px] text-primary/80 pl-[18px]">
                              +{remaining} more · tap to expand
                            </li>
                          )}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">
                          Foundational release.
                        </p>
                      )}
                    </button>
                  );
                });
              })()}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent
          side="right"
          data-testid="release-detail-panel"
          className="w-[92vw] sm:w-[440px] sm:max-w-[440px] p-0 border-none bg-gradient-to-b from-background via-background to-primary/5"
        >
          {selected && (() => {
            const isMajor = /\.\d+\.0$/.test(selected.version);
            const accent = isMajor ? 'text-primary' : 'text-amber-400';
            const highlights = selected.highlights ?? [];
            return (
              <>
                <SheetHeader className="p-4 bg-gradient-to-r from-primary/15 via-amber-500/10 to-orange-500/10">
                  <SheetTitle className="flex items-center gap-2 text-foreground text-sm">
                    <span className={`font-bold ${accent}`}>v{selected.version}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      {isMajor ? 'Major' : 'Patch'} · {selected.date}
                    </span>
                  </SheetTitle>
                  <p className="text-xs text-foreground/85 mt-1 break-words">
                    {selected.title}
                  </p>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-7rem)]">
                  <div className="p-4 space-y-5">
                    <section>
                      <h4 className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-400 mb-2">
                        <Star className="w-3 h-3" /> Highlights ({highlights.length})
                      </h4>
                      {highlights.length ? (
                        <ul className="space-y-1.5">
                          {highlights.map((h, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground/85 flex items-start gap-1.5 leading-snug break-words"
                            >
                              <Star className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
                              <span className="min-w-0">{h}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">No highlights recorded.</p>
                      )}
                    </section>

                    <section>
                      <h4 className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-orange-400 mb-2">
                        <Bug className="w-3 h-3" /> Fixes ({selected.fixes.length})
                      </h4>
                      {selected.fixes.length ? (
                        <ul className="space-y-1.5">
                          {selected.fixes.map((f, i) => (
                            <li
                              key={i}
                              className="text-xs text-foreground/80 flex items-start gap-1.5 leading-snug break-words"
                            >
                              <Bug className="w-3 h-3 mt-0.5 text-orange-400/80 shrink-0" />
                              <span className="min-w-0">{f}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-muted-foreground/60 italic">No fixes in this release.</p>
                      )}
                    </section>
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default VersionHotfixesBadge;
