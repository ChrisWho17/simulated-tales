import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap, Bug, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { APP_STAGE, APP_VERSION, BUILD_NUMBER } from '@/lib/version';
import { PATCHNOTES_UPDATE_EVENT } from '@/components/PwaUpdatePrompt';
import { CHANGELOG, fetchLatestChangelog, type ChangelogEntry } from './changelog';

export { CHANGELOG } from './changelog';
export type { ChangelogEntry } from './changelog';

const LAST_SEEN_VERSION_KEY = 'untold-last-seen-version';

function getLatestVersion(entries: ChangelogEntry[]): string {
  return entries[0]?.version ?? APP_VERSION;
}

function rememberSeenVersion(version: string): void {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch {
    /* ignore */
  }
}

function readSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [changelog, setChangelog] = useState<ChangelogEntry[]>(CHANGELOG);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const loadInitialPatchNotes = async () => {
      let entries = CHANGELOG;
      try {
        entries = await fetchLatestChangelog(true);
      } catch {
        // Static bundled notes are the fallback when the JSON endpoint is not reachable.
      }

      if (cancelled) return;
      setChangelog(entries);

      const latestVersion = getLatestVersion(entries);
      if (readSeenVersion() !== latestVersion) {
        rememberSeenVersion(latestVersion);
        timer = window.setTimeout(() => {
          if (!cancelled) setIsOpen(true);
        }, 1000);
      }
    };

    void loadInitialPatchNotes();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const onRefresh = () => {
      const refreshFromNetwork = async () => {
        let entries = changelog;
        try {
          entries = await fetchLatestChangelog(true);
          setChangelog(entries);
        } catch {
          // Keep the currently loaded notes if the network refresh fails.
        }

        const latestVersion = getLatestVersion(entries);
        if (readSeenVersion() !== latestVersion) {
          rememberSeenVersion(latestVersion);
          setIsOpen(true);
        }
        setRefreshKey((k) => k + 1);
      };

      void refreshFromNetwork();
    };

    window.addEventListener(PATCHNOTES_UPDATE_EVENT, onRefresh);
    return () => window.removeEventListener(PATCHNOTES_UPDATE_EVENT, onRefresh);
  }, [changelog]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentIndex(0);
  };

  const goNext = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goPrev = () => setCurrentIndex((i) => Math.min(changelog.length - 1, i + 1));

  const currentChangelog = changelog[currentIndex] ?? CHANGELOG[0];
  const displayVersion = `v${currentChangelog.version}-${APP_STAGE}`;
  const canGoPrev = currentIndex < changelog.length - 1;
  const canGoNext = currentIndex > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[260] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card border border-primary/30 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/50">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close what's new"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-display font-bold text-foreground">
                    What's New
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {displayVersion} • Build {BUILD_NUMBER}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div>
                  <h3 className="text-lg font-semibold text-primary">
                    {currentChangelog.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{currentChangelog.date}</p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={goNext}
                    disabled={!canGoNext}
                    className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Newer patch notes"
                  >
                    <ChevronUp className="w-5 h-5 text-primary" />
                  </button>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {currentIndex + 1} / {changelog.length}
                  </span>
                  <button
                    onClick={goPrev}
                    disabled={!canGoPrev}
                    className="p-1 rounded hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Older patch notes"
                  >
                    <ChevronDown className="w-5 h-5 text-primary" />
                  </button>
                </div>
              </div>
            </div>

            <ScrollArea key={refreshKey} className="max-h-[50vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentChangelog.version}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 space-y-5"
                >
                  {currentChangelog.highlights.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-amber-400">Highlights</span>
                      </div>
                      <ul className="space-y-1.5">
                        {currentChangelog.highlights.map((item, i) => (
                          <li key={i} className="text-sm text-foreground/90 pl-4 border-l-2 border-amber-400/50">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentChangelog.features.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-semibold text-green-400">New Features</span>
                      </div>
                      <ul className="space-y-1.5">
                        {currentChangelog.features.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-green-400/30">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentChangelog.improvements.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-semibold text-blue-400">Improvements</span>
                      </div>
                      <ul className="space-y-1.5">
                        {currentChangelog.improvements.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-blue-400/30">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentChangelog.fixes.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Bug className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-semibold text-orange-400">Bug Fixes</span>
                      </div>
                      <ul className="space-y-1.5">
                        {currentChangelog.fixes.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground pl-4 border-l-2 border-orange-400/30">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-muted/20">
              <Button onClick={handleClose} className="w-full">
                <Sparkles className="w-4 h-4 mr-2" />
                Got it, let's play!
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function useWhatsNew() {
  const clearLastSeen = () => {
    try {
      localStorage.removeItem(LAST_SEEN_VERSION_KEY);
    } catch {
      /* ignore */
    }
  };

  return { clearLastSeen };
}
