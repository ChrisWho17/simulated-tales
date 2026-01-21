// Time Parsing Utilities for shorthand time commands
// Supports formats like: "2h", "30m", "1h30m", "2 hours", "half day"

export interface ParsedTime {
  hours: number;
  minutes: number;
  totalMinutes: number;
  isValid: boolean;
  originalInput: string;
}

// Named time shortcuts
const TIME_SHORTCUTS: Record<string, number> = {
  'rest': 8 * 60,         // 8 hours
  'sleep': 8 * 60,        // 8 hours  
  'nap': 1 * 60,          // 1 hour
  'short rest': 1 * 60,   // 1 hour
  'long rest': 8 * 60,    // 8 hours
  'half day': 12 * 60,    // 12 hours
  'dawn': -1,             // Special: until dawn
  'dusk': -2,             // Special: until dusk
  'morning': -3,          // Special: until morning
  'night': -4,            // Special: until night
};

/**
 * Parse a time string into hours and minutes
 * Supports formats:
 * - "2h", "2hr", "2 hour", "2 hours"
 * - "30m", "30min", "30 minute", "30 minutes"  
 * - "1h30m", "1h 30m", "1 hour 30 minutes"
 * - "90" (interpreted as minutes if < 60, else hours)
 * - Named shortcuts: "rest", "sleep", "nap", "half day"
 */
export function parseTimeString(input: string): ParsedTime {
  const trimmed = input.trim().toLowerCase();
  
  // Check for named shortcuts first
  if (TIME_SHORTCUTS[trimmed] !== undefined) {
    const totalMins = TIME_SHORTCUTS[trimmed];
    if (totalMins > 0) {
      return {
        hours: Math.floor(totalMins / 60),
        minutes: totalMins % 60,
        totalMinutes: totalMins,
        isValid: true,
        originalInput: input,
      };
    }
    // Special cases like "until dawn" - not supported in shorthand, open modal
    return { hours: 0, minutes: 0, totalMinutes: 0, isValid: false, originalInput: input };
  }
  
  // Try to parse numeric time formats
  let totalMinutes = 0;
  let matched = false;
  
  // Pattern: "2h30m" or "2h 30m" or "2hr30min"
  const combinedPattern = /^(\d+)\s*(?:h|hr|hour|hours?)(?:\s*(\d+)\s*(?:m|min|minute|minutes?)?)?$/;
  const combinedMatch = trimmed.match(combinedPattern);
  if (combinedMatch) {
    const hours = parseInt(combinedMatch[1], 10);
    const minutes = combinedMatch[2] ? parseInt(combinedMatch[2], 10) : 0;
    totalMinutes = hours * 60 + minutes;
    matched = true;
  }
  
  // Pattern: just minutes "30m" or "30 minutes"
  if (!matched) {
    const minutesPattern = /^(\d+)\s*(?:m|min|minute|minutes?)$/;
    const minutesMatch = trimmed.match(minutesPattern);
    if (minutesMatch) {
      totalMinutes = parseInt(minutesMatch[1], 10);
      matched = true;
    }
  }
  
  // Pattern: just hours "2h" or "2 hours"
  if (!matched) {
    const hoursPattern = /^(\d+)\s*(?:h|hr|hour|hours?)$/;
    const hoursMatch = trimmed.match(hoursPattern);
    if (hoursMatch) {
      totalMinutes = parseInt(hoursMatch[1], 10) * 60;
      matched = true;
    }
  }
  
  // Pattern: plain number (interpret based on value)
  if (!matched) {
    const plainNumber = /^(\d+)$/;
    const numberMatch = trimmed.match(plainNumber);
    if (numberMatch) {
      const value = parseInt(numberMatch[1], 10);
      // If <= 24, treat as hours; otherwise as minutes
      if (value <= 24) {
        totalMinutes = value * 60;
      } else {
        totalMinutes = value;
      }
      matched = true;
    }
  }
  
  if (!matched || totalMinutes <= 0 || totalMinutes > 24 * 60) {
    return {
      hours: 0,
      minutes: 0,
      totalMinutes: 0,
      isValid: false,
      originalInput: input,
    };
  }
  
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
    isValid: true,
    originalInput: input,
  };
}

/**
 * Format a duration in minutes to a human-readable string
 */
export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Check if a command string is a /wait command with time argument
 * Returns the time portion if valid, null otherwise
 */
export function extractWaitTime(command: string): string | null {
  const trimmed = command.trim().toLowerCase();
  
  // Match /wait or /skip followed by time
  const waitPattern = /^\/(?:wait|skip|rest|sleep)\s+(.+)$/;
  const match = trimmed.match(waitPattern);
  
  if (match) {
    return match[1];
  }
  
  return null;
}
