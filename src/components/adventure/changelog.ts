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
    "version": "0.4.7",
    "date": "June 2026",
    "title": "Heights, Weights & Two-Tone Hair",
    "highlights": [
      "Custom height slider (4'2\" – ~7'6\") for characters outside the standard brackets",
      "New Very Short height tier (down to 4'2\") joins the lineup",
      "Weight range expanded to 40–400 lb (imperial) / ~18–181 kg (metric)",
      "Two-tone hair: pick a primary color and an optional secondary streak / tip / underlayer"
    ],
    "features": [
      "More hair styles: Pixie, Bob, Lob, Fade, Crew Cut, Top Knot, Box Braids, Cornrows, Pompadour, Quiff, Twin Tails, Hime Cut, and more",
      "Very short stature now drives imagery framing (low eye-line, oversized environments) and NPC reactions (bending down, condescension, child mistakes)"
    ],
    "improvements": [
      "NPC generation can now roll Very Short builds for more realistic diversity",
      "Two-tone hair flows into portrait prompts and in-game narration"
    ],
    "fixes": []
  },
  {
    "version": "0.4.6",
    "date": "June 2026",
    "title": "Accent Toggle & Director Sync",
    "highlights": [
      "Nationality & languages are now opt-in for full narrative freedom",
      "New England accent replaces New York in the nationality list",
      "Director choice now syncs into your very first scene"
    ],
    "features": [
      "New \"All (Scholar)\" option instantly grants fluency in every language",
      "Toggle hides nationality, primary language, and additional languages when unused"
    ],
    "improvements": [
      "Accent descriptors refined for clearer regional voice"
    ],
    "fixes": [
      "Fixed Choose Your Director settings not reaching the opening narrative",
      "Director tightness, cruelty, and weirdness now influence the very first turn"
    ]
  },
  {
    "version": "0.4.5",
    "date": "June 2026",
    "title": "Hotfix Update Delivery",
    "highlights": [
      "Patch notes now load from a shared no-store changelog source",
      "Version and hotfix UI stays visible during first-time onboarding",
      "Service worker updates wait for the player's reload choice"
    ],
    "features": [
      "Patch notes can refresh their content after service worker activation without a full page reload when possible",
      "The same changelog source powers the What's New modal, version badge, timeline, and release detail panel"
    ],
    "improvements": [
      "New patch-note data bypasses stale cached app bundles by fetching /changelog.json with no-store",
      "Update availability remains visible from the global app shell instead of only the scenario creator"
    ],
    "fixes": [
      "Fixed hotfix notes not appearing when the app version did not advance",
      "Fixed generated service worker activating immediately before the reload toast could be shown",
      "Fixed first-time setup hiding the version badge and What's New modal"
    ]
  },
  {
    "version": "0.4.4",
    "date": "June 2026",
    "title": "PWA Polish & Patch Visibility",
    "highlights": [
      "Top-right version badge with patch highlights and hotfix popovers",
      "Full hotfix history dialog browsable from the main menu",
      "PWA install moved into Game Settings for a cleaner main menu"
    ],
    "features": [
      "Star popover surfaces the latest patch highlights at a glance",
      "Envelope popover shows hotfix count plus full history dialog",
      "Install App card lives in Game Settings with confirmation animation"
    ],
    "improvements": [
      "Cleaner main menu layout \u2014 no banner above the title",
      "Patch history ordered chronologically from origin to current alpha"
    ],
    "fixes": [
      "Fixed PWA install banner being inconsistent across browsers",
      "Resolved duplicate version display in the title block",
      "Hardened storage bucket policies (service-role writes only)",
      "Sanitized portrait custom prompt input against injection",
      "Enabled HIBP leaked-password protection on auth"
    ]
  },
  {
    "version": "0.4.3",
    "date": "May 2026",
    "title": "Offline Queue & Debug Tooling",
    "highlights": [
      "Export offline queue + server merge timeline as JSON",
      "Install button visible on the campaign chooser (incl. iframe preview)",
      "Installed/running status indicator next to Install"
    ],
    "features": [
      "DebugPwa: one-click export of queued items, ticks and hashes",
      "Install button fallback dialog with iOS/Android instructions",
      "Standalone-mode detection with status pill"
    ],
    "improvements": [
      "More robust service-worker registration guards for previews",
      "Better diagnostics for merge conflicts and offline replays"
    ],
    "fixes": [
      "Fixed Install button not appearing inside the Lovable preview iframe",
      "Resolved missing download affordance on the campaign chooser",
      "Fixed offline queue items lost on quick reconnect"
    ]
  },
  {
    "version": "0.4.2",
    "date": "April 2026",
    "title": "Companion Loyalty & Relationship Events",
    "highlights": [
      "New companion loyalty quest system with 4 tiers",
      "Relationship events that trigger based on affinity/trust",
      "Version tracking with auto-increment build numbers"
    ],
    "features": [
      "Loyalty quests unlock at trust thresholds (60/75/85/95)",
      "Relationship milestone events with meaningful choices",
      "Visual loyalty quest progress tracker in companion sheet"
    ],
    "improvements": [
      "Better companion interaction feedback",
      "Improved mobile layout for companion panels"
    ],
    "fixes": [
      "Fixed companion mood persistence",
      "Resolved quest trigger timing issues"
    ]
  },
  {
    "version": "0.4.1",
    "date": "March 2026",
    "title": "Companion System Enhancements",
    "highlights": [
      "Dynamic companion commentary during gameplay",
      "Companion equipment management",
      "Relationship event system foundation"
    ],
    "features": [
      "Companions react to player actions and story events",
      "Equipment sharing between player and companions",
      "Trust, affinity, and respect tracking"
    ],
    "improvements": [
      "Smoother companion dialogue generation",
      "Better party management UI"
    ],
    "fixes": [
      "Fixed companion stat calculations",
      "Resolved dialogue duplication issues"
    ]
  },
  {
    "version": "0.4.0",
    "date": "February 2026",
    "title": "Companion Framework",
    "highlights": [
      "Introduced the companion party system",
      "Voice archetypes for distinct companion speech",
      "Sentient autonomy engine for independent reactions"
    ],
    "features": [
      "Up to 3 active companions in the party",
      "15 voice archetypes defining speech tempo and traits",
      "Autonomous companion narrative feed"
    ],
    "improvements": [
      "Unified companion data structure across systems"
    ],
    "fixes": [
      "Fixed party slot leaks when dismissing companions",
      "Resolved companion portrait caching errors"
    ]
  },
  {
    "version": "0.3.2",
    "date": "January 2026",
    "title": "Memory Decay Tuning",
    "highlights": [
      "Refined three-tier memory capacities and decay curves",
      "Rumor truth-value calculation more resistant to noise"
    ],
    "features": [
      "Ebbinghaus-style decay applied per-memory-tier",
      "NPCs now consolidate short-term into long-term overnight"
    ],
    "improvements": [
      "Lower memory footprint for long sessions"
    ],
    "fixes": [
      "Fixed NPCs dropping critical memories too early",
      "Resolved rumor truth values getting stuck at 0"
    ]
  },
  {
    "version": "0.3.1",
    "date": "December 2025",
    "title": "Schedule & Grudge Fixes",
    "highlights": [
      "Smoother NPC schedule transitions across day boundaries",
      "Grudge decay now follows McCullough's forgiveness research"
    ],
    "features": [
      "Per-NPC forgiveness rate based on personality",
      "Schedule conflict resolver for overlapping appointments"
    ],
    "improvements": [
      "Faster world tick when many NPCs are co-located"
    ],
    "fixes": [
      "Fixed NPCs stuck mid-schedule after a save/load cycle",
      "Resolved grudges never decaying for high-trust NPCs"
    ]
  },
  {
    "version": "0.3.0",
    "date": "November 2025",
    "title": "Living World Simulation",
    "highlights": [
      "NPC schedules and autonomous actions",
      "Three-tier NPC memory system",
      "Ambient background events feed"
    ],
    "features": [
      "World ticks advance NPCs even when player is idle",
      "Perception filtering for altered states",
      "Grudge and forgiveness modeling for NPCs"
    ],
    "improvements": [
      "Faster simulation tick performance",
      "More plausible NPC routines"
    ],
    "fixes": [
      "Fixed NPCs forgetting recent interactions",
      "Resolved schedule overlap deadlocks"
    ]
  },
  {
    "version": "0.2.2",
    "date": "October 2025",
    "title": "Difficulty & Correction Polish",
    "highlights": [
      "Difficulty presets fully wired into narrator prompts",
      "Player correction commands recognized inline"
    ],
    "features": [
      "Hardcore preset enforces strict failure consequences",
      "/retcon, /soften, /harden meta-commands"
    ],
    "improvements": [
      "More consistent tone across long sessions"
    ],
    "fixes": [
      "Fixed difficulty preset not persisting across saves",
      "Resolved correction commands echoing into prose"
    ]
  },
  {
    "version": "0.2.1",
    "date": "September 2025",
    "title": "Genre Blending Hotfix",
    "highlights": [
      "Hard-lock genre option stops unwanted multi-genre blending",
      "Cleaner secondary-genre weight enforcement"
    ],
    "features": [
      "Secondary genres capped at 50% total weight",
      "Hard-lock toggle disables multi-select UI"
    ],
    "improvements": [
      "Genre tag parser more tolerant of casing"
    ],
    "fixes": [
      "Fixed sci-fi bleeding into pure fantasy sessions",
      "Resolved hard-lock being silently ignored"
    ]
  },
  {
    "version": "0.2.0",
    "date": "August 2025",
    "title": "Narrator Contract & Genre Blending",
    "highlights": [
      "Strict narrator contract (no guaranteed success, no echoing)",
      "Multi-genre blending with hard-lock option",
      "Tone adaptation system"
    ],
    "features": [
      "Genre tag parsing and detection from prose",
      "Player correction meta-commands",
      "Difficulty presets (Casual / Story / Simulation / Hardcore)"
    ],
    "improvements": [
      "Cleaner mechanic-tag filtering from displayed prose"
    ],
    "fixes": [
      "Fixed narrator echoing player input verbatim",
      "Resolved tone drift across long sessions"
    ]
  },
  {
    "version": "0.1.2",
    "date": "July 2025",
    "title": "Dice & Loot Hotfix",
    "highlights": [
      "Diced Out mode probability curves rebalanced",
      "[LOOT:item] tags now stripped from displayed prose"
    ],
    "features": [
      "Per-attribute dice modifiers surface in roll preview"
    ],
    "improvements": [
      "Inventory tooltips show source roll on hover"
    ],
    "fixes": [
      "Fixed loot tags leaking into narrative text",
      "Resolved double-rolling on quick action repeats"
    ]
  },
  {
    "version": "0.1.1",
    "date": "June 2025",
    "title": "Alpha Launch Hotfix",
    "highlights": [
      "Stability pass on first-time wizard",
      "Adventure creator no longer loses state on refresh"
    ],
    "features": [
      "Onboarding preferences persist to local storage"
    ],
    "improvements": [
      "Smoother splash screen transition"
    ],
    "fixes": [
      "Fixed wizard crash when selecting custom genre",
      "Resolved theme reset on hard reload"
    ]
  },
  {
    "version": "0.1.0",
    "date": "June 2025",
    "title": "Origin \u2014 Untold Stories Alpha",
    "highlights": [
      "First playable alpha of the text RPG engine",
      "Core dice and inventory systems",
      "Initial dark fantasy + cyberpunk visual identity"
    ],
    "features": [
      "Adventure creator with genre selection",
      "Dice modes: Normal Dice and Diced Out",
      "Loot via [LOOT:item] AI tags"
    ],
    "improvements": [
      "Baseline glassmorphism UI and dynamic theme variables"
    ],
    "fixes": [
      "Initial release \u2014 no prior hotfixes"
    ]
  }
];

const CHANGELOG_URL = "/changelog.json";

function isChangelogEntry(value: unknown): value is ChangelogEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<ChangelogEntry>;
  return (
    typeof entry.version === "string" &&
    typeof entry.date === "string" &&
    typeof entry.title === "string" &&
    Array.isArray(entry.highlights) &&
    Array.isArray(entry.features) &&
    Array.isArray(entry.improvements) &&
    Array.isArray(entry.fixes)
  );
}

export function orderChangelog(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) =>
    a.version.localeCompare(b.version, undefined, { numeric: true })
  );
}

export function latestFirstChangelog(entries: ChangelogEntry[]): ChangelogEntry[] {
  return orderChangelog(entries).reverse();
}

function normalizeChangelog(value: unknown): ChangelogEntry[] | null {
  const maybeEntries = Array.isArray(value)
    ? value
    : value && typeof value === "object" && Array.isArray((value as { entries?: unknown }).entries)
      ? (value as { entries: unknown[] }).entries
      : null;

  if (!maybeEntries?.every(isChangelogEntry)) return null;
  return latestFirstChangelog(maybeEntries);
}

export async function fetchLatestChangelog(cacheBust = false): Promise<ChangelogEntry[]> {
  const suffix = cacheBust ? `?v=${Date.now()}` : "";
  const response = await fetch(`${CHANGELOG_URL}${suffix}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) throw new Error(`Unable to load changelog: ${response.status}`);
  const data = await response.json();
  const normalized = normalizeChangelog(data);
  if (!normalized) throw new Error("Invalid changelog payload");
  return normalized;
}
