import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Gift, Zap, Bug, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VERSION_STRING, APP_VERSION, BUILD_NUMBER } from '@/lib/version';

// Storage key for tracking last seen version
const LAST_SEEN_VERSION_KEY = 'untold-last-seen-version';

// Changelog entries - add new entries at the top
export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  features: string[];
  improvements: string[];
  fixes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "0.4.4",
    date: "June 2026",
    title: "PWA Polish & Patch Visibility",
    highlights: [
      "Top-right version badge with patch highlights and hotfix popovers",
      "Full hotfix history dialog browsable from the main menu",
      "PWA install moved into Game Settings for a cleaner main menu"
    ],
    features: [
      "Star popover surfaces the latest patch highlights at a glance",
      "Envelope popover shows hotfix count plus full history dialog",
      "Install App card lives in Game Settings with confirmation animation"
    ],
    improvements: [
      "Cleaner main menu layout — no banner above the title",
      "Patch history ordered chronologically from origin to current alpha"
    ],
    fixes: [
      "Fixed PWA install banner being inconsistent across browsers",
      "Resolved duplicate version display in the title block",
      "Hardened storage bucket policies (service-role writes only)",
      "Sanitized portrait custom prompt input against injection",
      "Enabled HIBP leaked-password protection on auth"
    ]
  },
  {
    version: "0.4.3",
    date: "May 2026",
    title: "Offline Queue & Debug Tooling",
    highlights: [
      "Export offline queue + server merge timeline as JSON",
      "Install button visible on the campaign chooser (incl. iframe preview)",
      "Installed/running status indicator next to Install"
    ],
    features: [
      "DebugPwa: one-click export of queued items, ticks and hashes",
      "Install button fallback dialog with iOS/Android instructions",
      "Standalone-mode detection with status pill"
    ],
    improvements: [
      "More robust service-worker registration guards for previews",
      "Better diagnostics for merge conflicts and offline replays"
    ],
    fixes: [
      "Fixed Install button not appearing inside the Lovable preview iframe",
      "Resolved missing download affordance on the campaign chooser",
      "Fixed offline queue items lost on quick reconnect"
    ]
  },
  {
    version: "0.4.2",
    date: "April 2026",
    title: "Companion Loyalty & Relationship Events",
    highlights: [
      "New companion loyalty quest system with 4 tiers",
      "Relationship events that trigger based on affinity/trust",
      "Version tracking with auto-increment build numbers"
    ],
    features: [
      "Loyalty quests unlock at trust thresholds (60/75/85/95)",
      "Relationship milestone events with meaningful choices",
      "Visual loyalty quest progress tracker in companion sheet"
    ],
    improvements: [
      "Better companion interaction feedback",
      "Improved mobile layout for companion panels"
    ],
    fixes: [
      "Fixed companion mood persistence",
      "Resolved quest trigger timing issues"
    ]
  },
  {
    version: "0.4.1",
    date: "March 2026",
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
  },
  {
    version: "0.4.0",
    date: "February 2026",
    title: "Companion Framework",
    highlights: [
      "Introduced the companion party system",
      "Voice archetypes for distinct companion speech",
      "Sentient autonomy engine for independent reactions"
    ],
    features: [
      "Up to 3 active companions in the party",
      "15 voice archetypes defining speech tempo and traits",
      "Autonomous companion narrative feed"
    ],
    improvements: [
      "Unified companion data structure across systems"
    ],
    fixes: [
      "Fixed party slot leaks when dismissing companions",
      "Resolved companion portrait caching errors"
    ]
  },
  {
    version: "0.3.2",
    date: "January 2026",
    title: "Memory Decay Tuning",
    highlights: [
      "Refined three-tier memory capacities and decay curves",
      "Rumor truth-value calculation more resistant to noise"
    ],
    features: [
      "Ebbinghaus-style decay applied per-memory-tier",
      "NPCs now consolidate short-term into long-term overnight"
    ],
    improvements: [
      "Lower memory footprint for long sessions"
    ],
    fixes: [
      "Fixed NPCs dropping critical memories too early",
      "Resolved rumor truth values getting stuck at 0"
    ]
  },
  {
    version: "0.3.1",
    date: "December 2025",
    title: "Schedule & Grudge Fixes",
    highlights: [
      "Smoother NPC schedule transitions across day boundaries",
      "Grudge decay now follows McCullough's forgiveness research"
    ],
    features: [
      "Per-NPC forgiveness rate based on personality",
      "Schedule conflict resolver for overlapping appointments"
    ],
    improvements: [
      "Faster world tick when many NPCs are co-located"
    ],
    fixes: [
      "Fixed NPCs stuck mid-schedule after a save/load cycle",
      "Resolved grudges never decaying for high-trust NPCs"
    ]
  },
  {
    version: "0.3.0",
    date: "November 2025",
    title: "Living World Simulation",
    highlights: [
      "NPC schedules and autonomous actions",
      "Three-tier NPC memory system",
      "Ambient background events feed"
    ],
    features: [
      "World ticks advance NPCs even when player is idle",
      "Perception filtering for altered states",
      "Grudge and forgiveness modeling for NPCs"
    ],
    improvements: [
      "Faster simulation tick performance",
      "More plausible NPC routines"
    ],
    fixes: [
      "Fixed NPCs forgetting recent interactions",
      "Resolved schedule overlap deadlocks"
    ]
  },
  {
    version: "0.2.2",
    date: "October 2025",
    title: "Difficulty & Correction Polish",
    highlights: [
      "Difficulty presets fully wired into narrator prompts",
      "Player correction commands recognized inline"
    ],
    features: [
      "Hardcore preset enforces strict failure consequences",
      "/retcon, /soften, /harden meta-commands"
    ],
    improvements: [
      "More consistent tone across long sessions"
    ],
    fixes: [
      "Fixed difficulty preset not persisting across saves",
      "Resolved correction commands echoing into prose"
    ]
  },
  {
    version: "0.2.1",
    date: "September 2025",
    title: "Genre Blending Hotfix",
    highlights: [
      "Hard-lock genre option stops unwanted multi-genre blending",
      "Cleaner secondary-genre weight enforcement"
    ],
    features: [
      "Secondary genres capped at 50% total weight",
      "Hard-lock toggle disables multi-select UI"
    ],
    improvements: [
      "Genre tag parser more tolerant of casing"
    ],
    fixes: [
      "Fixed sci-fi bleeding into pure fantasy sessions",
      "Resolved hard-lock being silently ignored"
    ]
  },
  {
    version: "0.2.0",
    date: "August 2025",
    title: "Narrator Contract & Genre Blending",
    highlights: [
      "Strict narrator contract (no guaranteed success, no echoing)",
      "Multi-genre blending with hard-lock option",
      "Tone adaptation system"
    ],
    features: [
      "Genre tag parsing and detection from prose",
      "Player correction meta-commands",
      "Difficulty presets (Casual / Story / Simulation / Hardcore)"
    ],
    improvements: [
      "Cleaner mechanic-tag filtering from displayed prose"
    ],
    fixes: [
      "Fixed narrator echoing player input verbatim",
      "Resolved tone drift across long sessions"
    ]
  },
  {
    version: "0.1.2",
    date: "July 2025",
    title: "Dice & Loot Hotfix",
    highlights: [
      "Diced Out mode probability curves rebalanced",
      "[LOOT:item] tags now stripped from displayed prose"
    ],
    features: [
      "Per-attribute dice modifiers surface in roll preview"
    ],
    improvements: [
      "Inventory tooltips show source roll on hover"
    ],
    fixes: [
      "Fixed loot tags leaking into narrative text",
      "Resolved double-rolling on quick action repeats"
    ]
  },
  {
    version: "0.1.1",
    date: "June 2025",
    title: "Alpha Launch Hotfix",
    highlights: [
      "Stability pass on first-time wizard",
      "Adventure creator no longer loses state on refresh"
    ],
    features: [
      "Onboarding preferences persist to local storage"
    ],
    improvements: [
      "Smoother splash screen transition"
    ],
    fixes: [
      "Fixed wizard crash when selecting custom genre",
      "Resolved theme reset on hard reload"
    ]
  },
  {
    version: "0.1.0",
    date: "June 2025",
    title: "Origin — Untold Stories Alpha",
    highlights: [
      "First playable alpha of the text RPG engine",
      "Core dice and inventory systems",
      "Initial dark fantasy + cyberpunk visual identity"
    ],
    features: [
      "Adventure creator with genre selection",
      "Dice modes: Normal Dice and Diced Out",
      "Loot via [LOOT:item] AI tags"
    ],
    improvements: [
      "Baseline glassmorphism UI and dynamic theme variables"
    ],
    fixes: [
      "Initial release — no prior hotfixes"
    ]
  }
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Only check once per component mount
    if (hasChecked) return;
    
    const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    
    // Immediately mark as checked to prevent double-firing
    setHasChecked(true);
    
    if (lastSeenVersion !== APP_VERSION) {
      // Immediately save the version to prevent showing again on re-render
      localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
      
      // New version detected - show modal after a short delay
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [hasChecked]);

  // Auto-refresh the patch notes section when the SW soft-activates a new
  // version (controllerchange without a forced reload). We remount the
  // changelog body and re-evaluate against the latest stored version so the
  // user can see updated highlights without losing their in-progress state.
  useEffect(() => {
    const onRefresh = () => {
      const lastSeenVersion = localStorage.getItem(LAST_SEEN_VERSION_KEY);
      if (lastSeenVersion !== APP_VERSION) {
        localStorage.setItem(LAST_SEEN_VERSION_KEY, APP_VERSION);
        setIsOpen(true);
      }
      setRefreshKey((k) => k + 1);
    };
    window.addEventListener('patchnotes:update-available', onRefresh);
    return () => window.removeEventListener('patchnotes:update-available', onRefresh);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Version is already saved when modal opens, so just close
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
