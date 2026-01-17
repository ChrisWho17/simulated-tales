import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap, Bug, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VERSION_STRING, APP_VERSION, BUILD_NUMBER } from '@/lib/version';

// Storage key for tracking last seen version
const LAST_SEEN_VERSION_KEY = 'untold-last-seen-version';

// Changelog entries - add new entries at the top
interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.4.2",
    date: "January 2026",
    title: "Companion Loyalty & Relationship Events",
    highlights: [
      "New companion loyalty quest system with 4 tiers",
      "Relationship events that trigger based on affinity/trust",
      "Version tracking with auto-increment build numbers"
    ],
    features: [
      "Loyalty quests unlock when companions reach trust thresholds (60/75/85/95)",
      "Relationship milestone events with meaningful choices",
      "Visual loyalty quest progress tracker in companion sheet",
      "Quest notifications with accept/defer options",
      "Build version display for easier testing coordination"
    ],
    improvements: [
      "Better companion interaction feedback",
      "Enhanced quest tracking UI",
      "Improved mobile layout for companion panels"
    ],
    fixes: [
      "Fixed companion mood persistence",
      "Resolved quest trigger timing issues"
    ]
  },
  {
    version: "0.4.1",
    date: "January 2026",
    title: "Companion System Enhancements",
    highlights: [
      "Dynamic companion commentary during gameplay",
      "Companion equipment management",
      "Relationship event system foundation"
    ],
    features: [
      "Companions react to player actions and story events",
      "Equipment sharing between player and companions",
      "Trust, affinity, and respect tracking"
    ],
    improvements: [
      "Smoother companion dialogue generation",
      "Better party management UI"
    ],
    fixes: [
      "Fixed companion stat calculations",
      "Resolved dialogue duplication issues"
    ]
  }
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewVersion, setHasNewVersion] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    
    if (lastSeenVersion !== APP_VERSION) {
      // New version detected - show modal after a short delay
      const timer = setTimeout(() => {
        setHasNewVersion(true);
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
    setHasNewVersion(false);
  };

  const currentChangelog = CHANGELOG[0]; // Most recent version

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-card border border-primary/30 rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-r from-primary/20 via-primary/10 to-transparent p-6 border-b border-border/50">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
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
                    {VERSION_STRING} • Build {BUILD_NUMBER}
                  </p>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-primary mt-3">
                {currentChangelog.title}
              </h3>
              <p className="text-xs text-muted-foreground">{currentChangelog.date}</p>
            </div>

            {/* Content */}
            <ScrollArea className="max-h-[50vh]">
              <div className="p-6 space-y-5">
                {/* Highlights */}
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

                {/* New Features */}
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

                {/* Improvements */}
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

                {/* Bug Fixes */}
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
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-border/50 bg-muted/20">
              <Button 
                onClick={handleClose}
                className="w-full"
              >
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

// Export a hook to manually trigger the modal
export function useWhatsNew() {
  const clearLastSeen = () => {
    localStorage.removeItem(LAST_SEEN_VERSION_KEY);
  };
  
  return { clearLastSeen };
}
