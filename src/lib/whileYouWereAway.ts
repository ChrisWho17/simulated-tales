/**
 * Build living-world “while you were away” lines from existing simulation state.
 * No AI required — atmospheric, specific, spam-guarded by the caller.
 */

export interface AwayRecapInput {
  characterName: string;
  locationName?: string;
  weatherName?: string;
  weatherChanged?: boolean;
  timeLabel?: string; // e.g. "evening"
  hoursAway?: number;
  companionBeats?: Array<{ name: string; mood?: string; note?: string }>;
  ambientHints?: string[];
  lastNarratorSnippet?: string;
}

export interface AwayRecapResult {
  title: string;
  lines: string[];
  tone: 'quiet' | 'uneasy' | 'warm' | 'urgent';
}

export function buildWhileYouWereAwayRecap(input: AwayRecapInput): AwayRecapResult {
  const lines: string[] = [];
  const name = input.characterName || 'You';
  const hours = input.hoursAway ?? 0;
  const place = input.locationName || 'the road';

  if (hours >= 1) {
    lines.push(
      hours >= 24
        ? `A day has moved without ${name}. The world did not wait.`
        : `Roughly ${Math.round(hours)} hour${Math.round(hours) === 1 ? '' : 's'} slipped by while attention wandered.`
    );
  } else {
    lines.push(`The moment resumes around ${name} at ${place}.`);
  }

  if (input.weatherChanged && input.weatherName) {
    lines.push(`The sky has shifted — ${input.weatherName.toLowerCase()} now presses on ${place}.`);
  } else if (input.weatherName && input.timeLabel) {
    lines.push(`${input.timeLabel.charAt(0).toUpperCase()}${input.timeLabel.slice(1)} holds; the weather stays ${input.weatherName.toLowerCase()}.`);
  }

  for (const beat of (input.companionBeats || []).slice(0, 2)) {
    if (beat.note) {
      lines.push(`${beat.name} ${beat.note}`);
    } else if (beat.mood) {
      lines.push(`${beat.name} is ${beat.mood} — watching, not idle.`);
    }
  }

  for (const hint of (input.ambientHints || []).slice(0, 2)) {
    if (hint.trim()) lines.push(hint.trim());
  }

  if (lines.length < 2 && input.lastNarratorSnippet) {
    const snip = input.lastNarratorSnippet.replace(/\s+/g, ' ').trim().slice(0, 160);
    lines.push(`Last clear beat: ${snip}${input.lastNarratorSnippet.length > 160 ? '…' : ''}`);
  }

  if (lines.length < 2) {
    lines.push(`People nearby still have their own hours to keep.`);
  }

  let tone: AwayRecapResult['tone'] = 'quiet';
  const blob = lines.join(' ').toLowerCase();
  if (/storm|blood|leave|warning|fear|urgent|betray/.test(blob)) tone = 'urgent';
  else if (/warm|smile|comfort|love|laugh/.test(blob)) tone = 'warm';
  else if (/watch|shift|press|guard|uneasy|mood/.test(blob)) tone = 'uneasy';

  return {
    title: hours >= 2 ? 'While you were away' : 'The world continues',
    lines: lines.slice(0, 5),
    tone,
  };
}

const LAST_SEEN_KEY = 'untold-last-seen-away';

export function readLastSeenAway(): number {
  try {
    const raw = localStorage.getItem(LAST_SEEN_KEY);
    return raw ? Number(raw) || 0 : 0;
  } catch {
    return 0;
  }
}

export function writeLastSeenAway(ts = Date.now()): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(ts));
  } catch {
    // ignore quota
  }
}

/** True if enough real time passed to justify a recap (default 20 minutes). */
export function shouldShowAwayRecap(now = Date.now(), minAwayMs = 20 * 60 * 1000): boolean {
  const last = readLastSeenAway();
  if (!last) {
    writeLastSeenAway(now);
    return false; // first visit — seed, don't interrupt
  }
  return now - last >= minAwayMs;
}
