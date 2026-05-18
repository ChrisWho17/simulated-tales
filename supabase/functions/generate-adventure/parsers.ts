// ============================================================================
// PURE PARSER HELPERS for generate-adventure edge function.
// Extracted so they can be unit-tested in isolation and shared between the
// streaming and non-streaming code paths.
// ============================================================================

export interface ParsedMechanics {
  xpGained?: { amount: number; reason: string };
  goldGained: number;
  goldLost: number;
  loot: string[];
  drop: string[];
  use: string[];
  damage: number;        // SUM of all [DAMAGE:X] tags in narrative
  heal: number;          // SUM of all [HEAL:X] tags in narrative
  damageCount: number;   // number of damage tags seen
  healCount: number;     // number of heal tags seen
}

/**
 * Parse all mechanic tags from a narrative string.
 *
 * Critical: DAMAGE and HEAL use matchAll so multi-tag turns
 * (ambush + poison, healing potion + bandage) sum correctly. The previous
 * regression used .match() which only returned the first hit.
 */
export function parseMechanicsFromNarrative(narrative: string): ParsedMechanics {
  if (!narrative || typeof narrative !== 'string') {
    return {
      goldGained: 0, goldLost: 0,
      loot: [], drop: [], use: [],
      damage: 0, heal: 0, damageCount: 0, healCount: 0,
    };
  }

  const damageMatches = [...narrative.matchAll(/\[DAMAGE:(\d+)\]/g)];
  const healMatches = [...narrative.matchAll(/\[HEAL:(\d+)\]/g)];
  const damage = damageMatches.reduce((sum, m) => sum + Number(m[1] || 0), 0);
  const heal = healMatches.reduce((sum, m) => sum + Number(m[1] || 0), 0);

  const goldMatches = [...narrative.matchAll(/\[GOLD:\+?(\d+)\]/g)];
  const goldLossMatches = [...narrative.matchAll(/\[GOLD:-(\d+)\]/g)];
  const goldGained = goldMatches.reduce((s, m) => s + Number(m[1] || 0), 0);
  const goldLost = goldLossMatches.reduce((s, m) => s + Number(m[1] || 0), 0);

  const loot = [...narrative.matchAll(/\[LOOT:([^\]]+)\]/g)].map(m => m[1].trim()).filter(Boolean);
  const drop = [...narrative.matchAll(/\[DROP:([^\]]+)\]/g)].map(m => m[1].trim()).filter(Boolean);
  const use  = [...narrative.matchAll(/\[USE:([^\]]+)\]/g)].map(m => m[1].trim()).filter(Boolean);

  const xpMatch = [...narrative.matchAll(/\[XP:(\d+):([^\]]+)\]/g)][0];
  const xpGained = xpMatch ? { amount: Number(xpMatch[1]), reason: xpMatch[2] } : undefined;

  return {
    xpGained, goldGained, goldLost,
    loot, drop, use,
    damage, heal,
    damageCount: damageMatches.length,
    healCount: healMatches.length,
  };
}

/**
 * Word-set Jaccard similarity. Hoisted to module scope so the streaming code
 * path (which historically tried to invoke it before its declaration) cannot
 * regress to the previous "function is not defined" error in Deno.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Pick a stable variance focus given a seed. Used to make narrative variance
 * deterministic during regression testing.
 */
export const VARIANCE_FOCUSES = [
  'sound details and what silence means',
  'visual contrasts and shadows',
  'physical sensations and body language',
  'emotional undercurrents and unspoken tension',
  'NPC micro-expressions and tells',
  'environmental changes and atmosphere shifts',
  'foreshadowing elements and ominous hints',
];

export function pickVarianceFocus(seed: number | string): { index: number; focus: string } {
  let n: number;
  if (typeof seed === 'number') {
    n = Math.abs(Math.floor(seed));
  } else {
    n = 0;
    for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const index = n % VARIANCE_FOCUSES.length;
  return { index, focus: VARIANCE_FOCUSES[index] };
}
