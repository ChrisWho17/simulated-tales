import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap, Bug, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
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
  const touchStartY = useRef<number | null>(null);

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

  const total = Math.max(1, changelog.length);
  // Slider value: high = newest (index 0). Invert for intuitive top→newer.
  const sliderValue = total - 1 - currentIndex;

  const goNewer = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const goOlder = () => setCurrentIndex((i) => Math.min(changelog.length - 1, i + 1));

  const handleSliderChange = (vals: number[]) => {
    const v = vals[0] ?? sliderValue;
    setCurrentIndex(total - 1 - v);
  };

  // Touch swipe (vertical) — swipe up = older, swipe down = newer
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current == null) return;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > 50) {
      if (dy < 0) goOlder();
      else goNewer();
    }
    touchStartY.current = null;
  };

  const currentChangelog = changelog[currentIndex] ?? CHANGELOG[0];
  const displayVersion = `v${currentChangelog.version}-${APP_STAGE}`;
  const canGoOlder = currentIndex < changelog.length - 1;
  const canGoNewer = currentIndex > 0;

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
            initial={{ opacity: 0, scale: 0.85, y: 40, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 220 }}
            className="relative w-full max-w-lg bg-card border border-primary/40 rounded-xl shadow-2xl overflow-hidden"
            style={{
              boxShadow: '0 0 40px hsl(var(--primary) / 0.35), 0 20px 50px rgba(0,0,0,0.6)',
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {/* Animated shimmer border */}
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                background:
                  'linear-gradient(120deg, transparent 30%, hsl(var(--primary) / 0.25) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
              }}
              animate={{ backgroundPosition: ['0% 0%', '200% 200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative bg-gradient-to-r from-primary/25 via-primary/10 to-transparent p-6 border-b border-border/50">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
                aria-label="Close what's new"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <motion.div
                  className="p-2 rounded-lg bg-primary/20 border border-primary/30"
                  animate={{
                    rotate: [0, -8, 8, -4, 0],
                    scale: [1, 1.08, 1.08, 1.02, 1],
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                </motion.div>
                <div>
                  <motion.h2
                    className="text-xl font-display font-bold text-foreground"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    What's New
                  </motion.h2>
                  <p className="text-sm text-muted-foreground">
                    {displayVersion} • Build {BUILD_NUMBER}
                  </p>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 mt-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-primary truncate">
                    {currentChangelog.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">{currentChangelog.date}</p>
                </div>

                {/* Vertical slider + chevrons */}
                {changelog.length > 1 && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={goNewer}
                        disabled={!canGoNewer}
                        className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/25 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation"
                        aria-label="Newer patch notes"
                      >
                        <ChevronUp className="w-5 h-5 text-primary" />
                      </button>
                      <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {currentIndex + 1}/{changelog.length}
                      </span>
                      <button
                        type="button"
                        onClick={goOlder}
                        disabled={!canGoOlder}
                        className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/25 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-manipulation"
                        aria-label="Older patch notes"
                      >
                        <ChevronDown className="w-5 h-5 text-primary" />
                      </button>
                    </div>

                    {/* Vertical slider — rotate horizontal Radix slider 270deg */}
                    <div
                      className="relative h-24 w-6 flex items-center justify-center"
                      aria-label="Jump to patch version"
                    >
                      <div className="absolute" style={{ transform: 'rotate(-90deg)', width: 96 }}>
                        <Slider
                          value={[sliderValue]}
                          min={0}
                          max={total - 1}
                          step={1}
                          onValueChange={handleSliderChange}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ScrollArea key={refreshKey} className="max-h-[50vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentChangelog.version}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.98 }}
                  transition={{ type: 'spring', damping: 22, stiffness: 260 }}
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
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="text-sm text-foreground/90 pl-4 border-l-2 border-amber-400/50"
                          >
                            {item}
                          </motion.li>
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
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * i }}
                            className="text-sm text-muted-foreground pl-4 border-l-2 border-green-400/30"
                          >
                            {item}
                          </motion.li>
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
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.04 * i }}
                            className="text-sm text-muted-foreground pl-4 border-l-2 border-blue-400/30"
                          >
                            {item}
                          </motion.li>
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
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.03 * i }}
                            className="text-sm text-muted-foreground pl-4 border-l-2 border-orange-400/30"
                          >
                            {item}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </ScrollArea>

            <div className="p-4 border-t border-border/50 bg-muted/20 relative">
              <Button onClick={handleClose} className="w-full group">
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5 }}
                  className="inline-flex"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                </motion.span>
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
