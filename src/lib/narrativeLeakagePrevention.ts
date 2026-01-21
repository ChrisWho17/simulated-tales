/**
 * Narrative Leakage Prevention System
 * 
 * Prevents story history from bleeding into current generation
 * by managing context windows, summarization, and deduplication.
 * Critical for 24+ hour sessions.
 */

import { StoryEntry } from '@/components/adventure/types';

// ============= CONFIGURATION =============

export interface LeakagePreventionConfig {
  maxHistoryEntries: number;        // Hard cap on entries sent to AI
  maxEntryLength: number;           // Truncate individual entries
  summaryThreshold: number;         // When to generate summary
  dedupeSimilarityThreshold: number; // Block if too similar
  maxContextTokens: number;         // Approximate token limit
}

const DEFAULT_CONFIG: LeakagePreventionConfig = {
  maxHistoryEntries: 16,
  maxEntryLength: 1200,
  summaryThreshold: 24,
  dedupeSimilarityThreshold: 0.45,
  maxContextTokens: 8000,
};

// ============= HISTORY COMPRESSION =============

export interface CompressedHistory {
  entries: Array<{ role: 'user' | 'narrator' | 'system'; content: string }>;
  summary: string | null;
  originalCount: number;
  truncatedCount: number;
}

/**
 * Compress conversation history for AI context
 * Prevents leakage by limiting and summarizing old content
 */
export function compressConversationHistory(
  history: StoryEntry[],
  config: LeakagePreventionConfig = DEFAULT_CONFIG
): CompressedHistory {
  if (!history || history.length === 0) {
    return {
      entries: [],
      summary: null,
      originalCount: 0,
      truncatedCount: 0,
    };
  }

  const originalCount = history.length;
  let summary: string | null = null;
  let workingHistory = [...history];

  // Generate summary if we have too much history
  if (workingHistory.length > config.summaryThreshold) {
    const olderEntries = workingHistory.slice(0, -config.maxHistoryEntries);
    summary = generateHistorySummary(olderEntries);
    workingHistory = workingHistory.slice(-config.maxHistoryEntries);
  }

  // Further trim if still over limit
  if (workingHistory.length > config.maxHistoryEntries) {
    workingHistory = workingHistory.slice(-config.maxHistoryEntries);
  }

  // Truncate individual entries and remove mechanic tags
  const compressedEntries = workingHistory.map(entry => ({
    role: entry.role,
    content: truncateAndCleanEntry(entry.content, config.maxEntryLength),
  }));

  // Deduplicate similar entries (prevents story loops)
  const dedupedEntries = deduplicateEntries(compressedEntries, config.dedupeSimilarityThreshold);

  return {
    entries: dedupedEntries,
    summary,
    originalCount,
    truncatedCount: originalCount - dedupedEntries.length,
  };
}

function truncateAndCleanEntry(content: string, maxLength: number): string {
  if (!content) return '';

  // Remove mechanic tags first
  let cleaned = content
    .replace(/\[[^\]]+\]/g, '')
    .replace(/---[\w_]+---[\s\S]*?(?=---|$)/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Truncate if too long
  if (cleaned.length > maxLength) {
    // Find a good breaking point (end of sentence)
    const truncated = cleaned.slice(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('. '),
      truncated.lastIndexOf('! '),
      truncated.lastIndexOf('? ')
    );

    if (lastSentenceEnd > maxLength * 0.7) {
      cleaned = truncated.slice(0, lastSentenceEnd + 1) + '...';
    } else {
      cleaned = truncated + '...';
    }
  }

  return cleaned;
}

function deduplicateEntries(
  entries: Array<{ role: string; content: string }>,
  threshold: number
): Array<{ role: 'user' | 'narrator' | 'system'; content: string }> {
  const result: Array<{ role: 'user' | 'narrator' | 'system'; content: string }> = [];
  const seenFingerprints = new Set<string>();

  for (const entry of entries) {
    const fingerprint = generateFingerprint(entry.content);

    // Check if too similar to any existing entry
    let isDuplicate = false;
    for (const seen of seenFingerprints) {
      if (calculateFingerprintSimilarity(fingerprint, seen) > threshold) {
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      result.push(entry as { role: 'user' | 'narrator' | 'system'; content: string });
      seenFingerprints.add(fingerprint);
    }
  }

  return result;
}

function generateFingerprint(content: string): string {
  // Extract key words for comparison (skip common words)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'to', 'of', 'in',
    'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'between', 'and',
    'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    'not', 'only', 'own', 'same', 'than', 'too', 'very', 'just',
    'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
    'it', 'its', 'they', 'them', 'their', 'theirs', 'this', 'that',
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  // Take first 20 significant words
  return words.slice(0, 20).sort().join(' ');
}

function calculateFingerprintSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(' '));
  const wordsB = new Set(b.split(' '));

  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return union > 0 ? intersection / union : 0;
}

// ============= SUMMARY GENERATION =============

function generateHistorySummary(entries: StoryEntry[]): string {
  // Extract key events from older history
  const narratorEntries = entries.filter(e => e.role === 'narrator');
  const playerEntries = entries.filter(e => e.role === 'user');

  // Build summary of key actions and events
  const keyMoments: string[] = [];

  // Sample player actions
  for (let i = 0; i < Math.min(3, playerEntries.length); i++) {
    const idx = Math.floor((playerEntries.length / 4) * (i + 1));
    const entry = playerEntries[idx];
    if (entry) {
      const action = entry.content.slice(0, 100).replace(/[.!?,]+$/, '');
      keyMoments.push(`Player action: ${action}`);
    }
  }

  // Sample key narrative beats (look for significant events)
  const significantPatterns = [
    /discovered|found|learned|realized/i,
    /attacked|fought|defeated|killed/i,
    /met|encountered|spoke with/i,
    /arrived|entered|reached|traveled/i,
    /gained|lost|acquired|traded/i,
  ];

  for (const entry of narratorEntries.slice(-10)) {
    for (const pattern of significantPatterns) {
      const match = entry.content.match(pattern);
      if (match) {
        // Extract sentence containing the match
        const sentences = entry.content.split(/[.!?]+/);
        for (const sentence of sentences) {
          if (pattern.test(sentence)) {
            keyMoments.push(sentence.trim().slice(0, 150));
            break;
          }
        }
        break;
      }
    }
  }

  // Limit and format
  const uniqueMoments = [...new Set(keyMoments)].slice(0, 5);

  if (uniqueMoments.length === 0) {
    return 'EARLIER: The adventure has been ongoing for some time.';
  }

  return `STORY RECAP (do NOT repeat these events, they already happened):
${uniqueMoments.map((m, i) => `${i + 1}. ${m}`).join('\n')}

CRITICAL: The above events are PAST. Continue the story from where the recent history ends.`;
}

// ============= REPETITION DETECTION =============

export interface RepetitionCheck {
  isRepetitive: boolean;
  similarity: number;
  matchedContent: string | null;
  suggestions: string[];
}

/**
 * Check if new content is too similar to recent history
 */
export function checkForRepetition(
  newContent: string,
  recentHistory: StoryEntry[],
  threshold: number = 0.35
): RepetitionCheck {
  const newFingerprint = generateFingerprint(newContent);
  const newSentences = newContent.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10);

  let maxSimilarity = 0;
  let matchedContent: string | null = null;

  // Check against recent narrator entries
  const narratorEntries = recentHistory
    .filter(e => e.role === 'narrator')
    .slice(-5);

  for (const entry of narratorEntries) {
    const entryFingerprint = generateFingerprint(entry.content);
    const similarity = calculateFingerprintSimilarity(newFingerprint, entryFingerprint);

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      matchedContent = entry.content.slice(0, 100);
    }

    // Also check for exact sentence matches
    const entrySentences = entry.content.split(/[.!?]+/).map(s => s.trim().toLowerCase());
    for (const newSent of newSentences.slice(0, 3)) { // Check first 3 sentences
      for (const oldSent of entrySentences) {
        const sentSim = calculateFingerprintSimilarity(newSent, oldSent);
        if (sentSim > 0.6) {
          maxSimilarity = Math.max(maxSimilarity, sentSim);
          matchedContent = oldSent.slice(0, 100);
        }
      }
    }
  }

  const isRepetitive = maxSimilarity > threshold;

  const suggestions: string[] = [];
  if (isRepetitive) {
    suggestions.push('Rephrase opening to avoid similarity to previous response');
    suggestions.push('Introduce a new element or complication');
    suggestions.push('Shift perspective or focus to a different aspect');
  }

  return {
    isRepetitive,
    similarity: maxSimilarity,
    matchedContent,
    suggestions,
  };
}

// ============= CONTEXT BUILDING =============

/**
 * Build optimized context for AI generation
 * Prevents leakage while preserving essential information
 */
export function buildOptimizedContext(
  history: StoryEntry[],
  characterName: string,
  config: LeakagePreventionConfig = DEFAULT_CONFIG
): {
  messages: Array<{ role: 'user' | 'narrator' | 'system'; content: string }>;
  contextWarning: string | null;
} {
  const compressed = compressConversationHistory(history, config);

  const messages: Array<{ role: 'user' | 'narrator' | 'system'; content: string }> = [];

  // Add summary as system message if available
  if (compressed.summary) {
    messages.push({
      role: 'system',
      content: compressed.summary,
    });
  }

  // Add compressed history
  messages.push(...compressed.entries);

  // Generate context warning if we truncated a lot
  let contextWarning: string | null = null;
  if (compressed.truncatedCount > 10) {
    contextWarning = `Long session detected (${compressed.originalCount} turns). Focus on recent context.`;
  }

  return { messages, contextWarning };
}

// ============= LONG SESSION DIRECTIVES =============

/**
 * Generate directives specifically for long sessions
 */
export function getLongSessionDirectives(
  turnCount: number,
  hoursPlayed: number = 0
): string[] {
  const directives: string[] = [];

  if (turnCount > 30) {
    directives.push('LONG SESSION: Avoid callback references to events from 20+ turns ago.');
  }

  if (turnCount > 50) {
    directives.push('EXTENDED SESSION: Fresh narrative is critical. Do not rely on ancient context.');
    directives.push('EXTENDED SESSION: Each response must stand alone while advancing the story.');
  }

  if (turnCount > 100) {
    directives.push('MARATHON SESSION: Treat each response as potentially a fresh start for context.');
    directives.push('MARATHON SESSION: Prioritize immediate scene over distant history.');
  }

  if (hoursPlayed > 6) {
    directives.push(`PLAYER HAS BEEN PLAYING FOR ${Math.floor(hoursPlayed)} HOURS. Generate fresh, engaging content.`);
  }

  if (hoursPlayed > 12) {
    directives.push('MARATHON GAMING SESSION: Peak freshness required. Every response must feel new.');
  }

  return directives;
}

// ============= EXPORTS =============

export {
  DEFAULT_CONFIG,
  generateFingerprint,
  generateHistorySummary,
};
