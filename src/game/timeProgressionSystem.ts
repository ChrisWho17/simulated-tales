// Time Progression System - Links narrative turns to in-game time
// Supports configurable time multipliers and time skip with consequences

export type TimeMultiplier = 
  | 'minute_per_turn'    // 1 turn = 1 minute (fast dialogue scenes)
  | 'five_minutes'       // 1 turn = 5 minutes (exploration)
  | 'fifteen_minutes'    // 1 turn = 15 minutes (default)
  | 'thirty_minutes'     // 1 turn = 30 minutes (travel)
  | 'hour_per_turn';     // 1 turn = 1 hour (time montages)

export const TIME_MULTIPLIER_CONFIG: Record<TimeMultiplier, { minutes: number; label: string; description: string }> = {
  minute_per_turn: {
    minutes: 1,
    label: '1 Minute',
    description: 'For tense dialogue or combat'
  },
  five_minutes: {
    minutes: 5,
    label: '5 Minutes',
    description: 'For exploration and conversations'
  },
  fifteen_minutes: {
    minutes: 15,
    label: '15 Minutes',
    description: 'Default pacing for most activities'
  },
  thirty_minutes: {
    minutes: 30,
    label: '30 Minutes',
    description: 'For travel and extended activities'
  },
  hour_per_turn: {
    minutes: 60,
    label: '1 Hour',
    description: 'For montages and long journeys'
  }
};

export interface GameTimeState {
  // Total game minutes since campaign start
  totalMinutes: number;
  // Current game date/time
  hour: number;      // 0-23
  minute: number;    // 0-59
  day: number;       // 1+
  month: number;     // 1-12
  year: number;      // Starting year
  // Time multiplier
  multiplier: TimeMultiplier;
  // Tracking
  turnsElapsed: number;
  lastUpdateTurn: number;
}

export interface TimeSkipEvent {
  type: 'rest' | 'travel' | 'waiting' | 'working' | 'training' | 'custom';
  hoursSkipped: number;
  consequences: TimeSkipConsequence[];
  narrative: string;
}

export interface TimeSkipConsequence {
  type: 'health_change' | 'hunger' | 'fatigue' | 'weather_change' | 'npc_event' | 'world_event' | 'random_encounter';
  severity: 'minor' | 'moderate' | 'major';
  description: string;
  mechanicEffect?: {
    stat?: string;
    change?: number;
  };
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function createInitialTimeState(startingHour: number = 9, startingYear: number = 1): GameTimeState {
  return {
    totalMinutes: startingHour * 60,
    hour: startingHour,
    minute: 0,
    day: 1,
    month: 6, // Start in summer
    year: startingYear,
    multiplier: 'fifteen_minutes',
    turnsElapsed: 0,
    lastUpdateTurn: 0
  };
}

export function advanceTime(state: GameTimeState, turns: number = 1): GameTimeState {
  const minutesPerTurn = TIME_MULTIPLIER_CONFIG[state.multiplier].minutes;
  const totalMinutesToAdd = minutesPerTurn * turns;
  
  return addMinutesToTime(state, totalMinutesToAdd, turns);
}

export function addMinutesToTime(state: GameTimeState, minutesToAdd: number, turnsToAdd: number = 0): GameTimeState {
  let totalMinutes = state.totalMinutes + minutesToAdd;
  let hour = state.hour;
  let minute = state.minute;
  let day = state.day;
  let month = state.month;
  let year = state.year;
  
  // Add minutes
  minute += minutesToAdd;
  
  // Handle minute overflow
  while (minute >= 60) {
    minute -= 60;
    hour++;
  }
  
  // Handle hour overflow (new day)
  while (hour >= 24) {
    hour -= 24;
    day++;
  }
  
  // Handle day overflow (new month)
  while (day > DAYS_IN_MONTH[month - 1]) {
    day -= DAYS_IN_MONTH[month - 1];
    month++;
    
    // Handle month overflow (new year)
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return {
    ...state,
    totalMinutes,
    hour,
    minute,
    day,
    month,
    year,
    turnsElapsed: state.turnsElapsed + turnsToAdd,
    lastUpdateTurn: state.turnsElapsed + turnsToAdd
  };
}

export function skipTime(state: GameTimeState, hours: number): { newState: GameTimeState; events: TimeSkipConsequence[] } {
  const minutesToAdd = hours * 60;
  const newState = addMinutesToTime(state, minutesToAdd);
  
  // Generate consequences based on hours skipped
  const events = generateTimeSkipConsequences(hours, state, newState);
  
  return { newState, events };
}

function generateTimeSkipConsequences(hours: number, oldState: GameTimeState, newState: GameTimeState): TimeSkipConsequence[] {
  const consequences: TimeSkipConsequence[] = [];
  
  // Weather always changes during time skips
  consequences.push({
    type: 'weather_change',
    severity: 'minor',
    description: 'The weather has shifted while time passed.'
  });
  
  // Fatigue recovery if skipping through night
  if (hours >= 4 && (oldState.hour >= 20 || oldState.hour < 4)) {
    consequences.push({
      type: 'fatigue',
      severity: 'minor',
      description: 'You feel somewhat rested after the passage of time.',
      mechanicEffect: { stat: 'fatigue', change: -20 }
    });
  }
  
  // Hunger increase
  if (hours >= 4) {
    consequences.push({
      type: 'hunger',
      severity: hours >= 8 ? 'moderate' : 'minor',
      description: hours >= 8 
        ? 'Your stomach growls insistently. You should eat soon.'
        : 'You feel a bit peckish.',
      mechanicEffect: { stat: 'hunger', change: Math.floor(hours * 5) }
    });
  }
  
  // Random events based on hours skipped
  const eventChance = Math.min(0.8, hours * 0.1); // Max 80% chance
  if (Math.random() < eventChance) {
    const eventTypes = [
      {
        type: 'world_event' as const,
        severity: 'minor' as const,
        descriptions: [
          'Word spreads through town about recent happenings.',
          'The local gossip has new topics to discuss.',
          'You overhear snippets of conversation about the world.',
          'Something has changed in the area while you were occupied.',
        ]
      },
      {
        type: 'npc_event' as const,
        severity: 'minor' as const,
        descriptions: [
          'Someone you know has been looking for you.',
          'An acquaintance passed by but didn\'t find you.',
          'You missed a visitor while you were away.',
          'People went about their business during your absence.',
        ]
      }
    ];
    
    const selectedType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    consequences.push({
      type: selectedType.type,
      severity: selectedType.severity,
      description: selectedType.descriptions[Math.floor(Math.random() * selectedType.descriptions.length)]
    });
  }
  
  // Chance of random encounter for longer skips
  if (hours >= 6 && Math.random() < 0.15) {
    consequences.push({
      type: 'random_encounter',
      severity: 'moderate',
      description: 'Something happened during the passage of time that may affect you...'
    });
  }
  
  return consequences;
}

export function formatGameTime(state: GameTimeState): string {
  const period = state.hour >= 12 ? 'PM' : 'AM';
  const displayHour = state.hour % 12 || 12;
  const displayMinute = state.minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

export function formatGameDate(state: GameTimeState): string {
  return `Day ${state.day}, ${MONTHS[state.month - 1]}`;
}

export function formatFullGameDateTime(state: GameTimeState): string {
  return `${formatGameTime(state)} - ${formatGameDate(state)}, Year ${state.year}`;
}

export function getTimeOfDay(hour: number): 'dawn' | 'morning' | 'afternoon' | 'evening' | 'dusk' | 'night' {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 21) return 'dusk';
  return 'night';
}

export function getHoursUntilSunrise(hour: number): number {
  const SUNRISE_HOUR = 6;
  if (hour >= SUNRISE_HOUR && hour < 20) {
    // It's daytime, calculate until next day's sunrise
    return (24 - hour) + SUNRISE_HOUR;
  }
  // It's night
  return hour >= 20 ? (24 - hour) + SUNRISE_HOUR : SUNRISE_HOUR - hour;
}

export function getHoursUntilSunset(hour: number): number {
  const SUNSET_HOUR = 20;
  if (hour >= 6 && hour < 20) {
    return SUNSET_HOUR - hour;
  }
  // It's night, calculate until next day's sunset
  return hour >= 20 ? (24 - hour) + SUNSET_HOUR : SUNSET_HOUR + (24 - hour);
}

export function isDaytime(hour: number): boolean {
  return hour >= 6 && hour < 20;
}

export function serializeTimeState(state: GameTimeState): string {
  return JSON.stringify(state);
}

export function deserializeTimeState(serialized: string): GameTimeState | null {
  try {
    return JSON.parse(serialized);
  } catch {
    return null;
  }
}

// Calculate how many weather ticks correspond to hours
export function hoursToWeatherTicks(hours: number): number {
  // 1 weather tick = approximately 15-30 minutes of game time
  // So 1 hour ≈ 2-4 ticks
  return Math.floor(hours * 3);
}

// Get climate-adjusted weather forecast
export function getExtendedForecast(currentHour: number, hoursAhead: number): Array<{
  hour: number;
  label: string;
  isDay: boolean;
}> {
  const forecast: Array<{ hour: number; label: string; isDay: boolean }> = [];
  
  for (let h = 1; h <= hoursAhead; h++) {
    const targetHour = (currentHour + h) % 24;
    const isDay = isDaytime(targetHour);
    const period = targetHour >= 12 ? 'PM' : 'AM';
    const displayHour = targetHour % 12 || 12;
    
    forecast.push({
      hour: targetHour,
      label: `${displayHour}${period}`,
      isDay
    });
  }
  
  return forecast;
}
