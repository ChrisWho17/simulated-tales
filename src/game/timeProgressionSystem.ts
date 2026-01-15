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

export type TimeOfDayPeriod = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'dusk' | 'night' | 'late_night';

export function getTimeOfDay(hour: number): TimeOfDayPeriod {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 22) return 'dusk';
  if (hour >= 22 || hour < 2) return 'night';
  return 'late_night';
}

// Build time context for AI prompts
export interface TimeContext {
  hour: number;
  minute: number;
  timeOfDay: TimeOfDayPeriod;
  formattedTime: string;
  formattedDate: string;
  day: number;
  month: number;
  year: number;
  isDaytime: boolean;
  lightLevel: 'bright' | 'dim' | 'dark';
  narrativeHint: string;
}

const TIME_NARRATIVE_HINTS: Record<TimeOfDayPeriod, string[]> = {
  dawn: [
    'The first light of dawn paints the sky in soft pinks and golds.',
    'Morning mist clings to the ground as the world slowly awakens.',
    'Birdsong heralds the coming day, the air still cool and fresh.',
  ],
  morning: [
    'Bright morning light floods the scene, casting sharp shadows.',
    'The day has properly begun, activity picking up around you.',
    'Morning energy fills the air as people go about their routines.',
  ],
  afternoon: [
    'The sun sits high, bathing everything in warm light.',
    'Afternoon warmth settles in, the day at its peak.',
    'The midday bustle continues unabated around you.',
  ],
  evening: [
    'Golden hour light casts everything in warm, amber tones.',
    'The day winds down, long shadows stretching across the ground.',
    'Evening approaches, bringing with it a change in atmosphere.',
  ],
  dusk: [
    'Twilight descends, the sky a canvas of deep purples and oranges.',
    'The last rays of sunlight fade, darkness creeping in at the edges.',
    'Dusk settles in, that liminal hour between day and night.',
  ],
  night: [
    'Darkness has fallen, the world transformed by moonlight and shadow.',
    'Night cloaks the land, stars beginning to appear overhead.',
    'The nocturnal hours bring a different character to your surroundings.',
  ],
  late_night: [
    'The deepest hours of the night, when most of the world sleeps.',
    'A profound stillness hangs in the air, the night at its darkest.',
    'These quiet hours before dawn feel suspended in time.',
  ],
};

export function buildTimeContext(state: GameTimeState): TimeContext {
  const timeOfDay = getTimeOfDay(state.hour);
  const hints = TIME_NARRATIVE_HINTS[timeOfDay];
  const narrativeHint = hints[Math.floor(Math.random() * hints.length)];
  
  let lightLevel: 'bright' | 'dim' | 'dark';
  if (state.hour >= 8 && state.hour < 18) {
    lightLevel = 'bright';
  } else if ((state.hour >= 6 && state.hour < 8) || (state.hour >= 18 && state.hour < 21)) {
    lightLevel = 'dim';
  } else {
    lightLevel = 'dark';
  }
  
  return {
    hour: state.hour,
    minute: state.minute,
    timeOfDay,
    formattedTime: formatGameTime(state),
    formattedDate: formatGameDate(state),
    day: state.day,
    month: state.month,
    year: state.year,
    isDaytime: isDaytime(state.hour),
    lightLevel,
    narrativeHint,
  };
}

// Format time context for AI prompt injection
export function formatTimeContextForAI(context: TimeContext): string {
  return `=== CURRENT TIME ===
Time: ${context.formattedTime} (${context.timeOfDay})
Date: ${context.formattedDate}, Year ${context.year}
Light Level: ${context.lightLevel}

TEMPORAL ATMOSPHERE:
${context.narrativeHint}

TIME-BASED NARRATIVE INSTRUCTIONS:
- Weave the ${context.timeOfDay} atmosphere naturally into descriptions
- Reference appropriate lighting (${context.lightLevel} conditions)
- NPCs and locations should reflect the time of day:
  ${context.timeOfDay === 'dawn' ? '• Early risers, bakers working, streets quiet' : ''}
  ${context.timeOfDay === 'morning' ? '• Markets opening, workers commuting, daytime routines' : ''}
  ${context.timeOfDay === 'afternoon' ? '• Peak activity, shops busy, people out and about' : ''}
  ${context.timeOfDay === 'evening' ? '• Shops closing, taverns filling, homeward journeys' : ''}
  ${context.timeOfDay === 'dusk' ? '• Lamplighters working, transition to night life' : ''}
  ${context.timeOfDay === 'night' ? '• Most shops closed, taverns active, guards on patrol' : ''}
  ${context.timeOfDay === 'late_night' ? '• Near-empty streets, only night workers about, eerie quiet' : ''}
- Sensory details should match: ${context.isDaytime ? 'sunlight, warmth, visibility' : 'moonlight, shadows, limited visibility'}`;
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
