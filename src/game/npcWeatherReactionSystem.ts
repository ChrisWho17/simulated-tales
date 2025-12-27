// ============================================
// NPC WEATHER REACTION SYSTEM
// ============================================
// NPCs react to weather with personality-driven preferences,
// mood changes, schedule adjustments, and contextual dialogue

import { WeatherState, WeatherType } from './weatherSystem';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type WeatherPreferenceType = 
  | 'clear' | 'overcast' | 'rain' | 'storm' 
  | 'fog' | 'snow' | 'heatWave' | 'windy';

export interface WeatherPreferences {
  clear: number;      // -1 to 1, most like clear weather
  overcast: number;
  rain: number;
  storm: number;      // most dislike storms typically
  fog: number;
  snow: number;
  heatWave: number;
  windy: number;
}

export interface WeatherTraits {
  weatherSensitive: boolean;  // mood swings with weather
  outdoorsy: boolean;         // tolerates extremes
  romantic: boolean;          // poetic about weather
  complainer: boolean;        // vocalizes discomfort
}

export interface NPCWeatherPersonality {
  preferences: WeatherPreferences;
  traits: WeatherTraits;
}

export interface WeatherImpact {
  moodModifier: number;
  energyModifier: number;
  comfortLevel: number;
  wantsToGoInside: boolean;
  willingToTravel: boolean;
  enjoyingWeather: boolean;
}

export interface ScheduleActivity {
  type: string;
  location?: { isOutdoor: boolean; name?: string };
  requiresTravel?: boolean;
  cancelled?: boolean;
  cancelReason?: string;
  alternative?: ScheduleActivity | null;
  delayed?: boolean;
  delayReason?: string;
  priority?: string;
  reason?: string;
}

export type PhysicalBehavior = 
  | 'wiping_brow' | 'fanning_self' | 'seeking_shade' | 'moving_slowly'
  | 'shivering' | 'rubbing_hands' | 'breath_visible' | 'hunched_posture'
  | 'hurrying' | 'covering_head' | 'looking_up' | 'flinching'
  | 'seeking_shelter' | 'looking_worried' | 'bracing' | 'holding_hat'
  | 'squinting' | 'leaning_into_wind' | 'moving_cautiously' | 'looking_around'
  | 'relaxed_posture' | 'looking_around_happily' | 'normal_posture';

// ═══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ═══════════════════════════════════════════════════════════
// DIALOGUE POOLS
// ═══════════════════════════════════════════════════════════

interface DialoguePool {
  positive: string[];
  negative: string[];
  neutral: string[];
  romantic?: string[];
}

const weatherDialoguePools: Record<WeatherPreferenceType, DialoguePool> = {
  clear: {
    positive: [
      "What a beautiful day! I could stay out here forever.",
      "Finally, some proper sunshine.",
      "Days like this remind me why I love it here.",
      "Perfect weather for being outside.",
      "The sun feels wonderful today."
    ],
    negative: [
      "It's too bright out. Hurts my eyes.",
      "I prefer when there's some clouds, honestly.",
      "Everyone's so chipper when it's sunny. Exhausting.",
      "All this sunlight gives me a headache."
    ],
    neutral: [
      "Nice day, I suppose.",
      "Good weather for getting things done.",
      "Can't complain about the weather today."
    ]
  },
  rain: {
    positive: [
      "I love the sound of rain. So peaceful.",
      "Perfect weather for staying in with a book.",
      "The smell of rain... nothing quite like it.",
      "Rain always puts me at ease.",
      "There's something cleansing about a good rain."
    ],
    negative: [
      "Ugh, everything's soaked. My shoes are ruined.",
      "This damp gets into my bones.",
      "Will this rain ever stop?",
      "I'm sick of being wet all the time.",
      "This weather is miserable."
    ],
    neutral: [
      "Rain again. At least the crops need it.",
      "Better grab something to cover your head.",
      "Mind the puddles."
    ],
    romantic: [
      "There's something melancholy and beautiful about the rain...",
      "The world feels quieter when it rains. More honest, somehow.",
      "Rain makes everything feel like a story."
    ]
  },
  storm: {
    positive: [
      "Listen to that thunder! Magnificent!",
      "I've always loved a good storm. Makes you feel alive.",
      "There's power in the sky tonight!"
    ],
    negative: [
      "I hate storms. Can't sleep, can't think.",
      "Please, I just want to get inside somewhere safe.",
      "Every crack of thunder makes me jump...",
      "I won't feel safe until this passes.",
      "The lightning terrifies me."
    ],
    neutral: [
      "Storm's coming in. Best find shelter.",
      "Wouldn't want to be traveling in this.",
      "We should wait this out."
    ],
    romantic: [
      "The sky is furious tonight. There's a raw beauty in it.",
      "Storms remind us how small we truly are."
    ]
  },
  snow: {
    positive: [
      "Snow! I feel like a child again.",
      "Everything looks so clean and quiet.",
      "Perfect weather for warming up by a fire.",
      "The world becomes a wonderland in snow.",
      "I love how snow muffles all the sounds."
    ],
    negative: [
      "I can't feel my fingers. Or my toes.",
      "Snow is pretty for about five minutes. Then it's just cold.",
      "I'm not built for this weather.",
      "My joints ache in this cold.",
      "I'll freeze to death out here."
    ],
    neutral: [
      "Snow's piling up. Travel will be difficult.",
      "Bundle up if you're heading out.",
      "At least it's not a blizzard."
    ]
  },
  heatWave: {
    positive: [
      "Now THIS is proper weather. Soak it in!",
      "I could bask in this heat all day.",
      "Finally, some warmth!"
    ],
    negative: [
      "I'm melting. Actually melting.",
      "How does anyone get anything done in this heat?",
      "I'd kill for a cold drink right now.",
      "Too hot to think. Too hot to move.",
      "This heat is unbearable."
    ],
    neutral: [
      "Hot one today. Stay hydrated.",
      "The heat's oppressive, but we manage.",
      "Find some shade if you can."
    ]
  },
  fog: {
    positive: [
      "The fog makes everything feel mysterious.",
      "I find fog peaceful. Like the world's taking a breath.",
      "There's magic in the mist."
    ],
    negative: [
      "Can't see a thing in this fog. Makes me nervous.",
      "I don't trust what I can't see.",
      "This fog is unsettling. Anything could be out there.",
      "I keep imagining things in the mist."
    ],
    neutral: [
      "Careful in this fog. Easy to lose your way.",
      "Fog's thick today.",
      "Watch your step in this visibility."
    ],
    romantic: [
      "The fog hides the world, leaving only what's close...",
      "Everything feels intimate in the mist."
    ]
  },
  overcast: {
    positive: [
      "Overcast days are underrated. No squinting.",
      "Nice and cool. I can actually think.",
      "Good working weather, this."
    ],
    negative: [
      "Grey skies again. How dreary.",
      "Would it kill the sun to show itself?",
      "This gloom is depressing."
    ],
    neutral: [
      "Cloudy, but at least it's not raining.",
      "Looks like it could go either way today.",
      "Neither good nor bad weather, really."
    ]
  },
  windy: {
    positive: [
      "Feel that breeze! Invigorating!",
      "Good wind today. Clears the head.",
      "I love a strong wind!"
    ],
    negative: [
      "This wind is driving me mad!",
      "I can barely keep my footing in this.",
      "My hair, my clothes... everything's a mess.",
      "Will this blasted wind ever stop?"
    ],
    neutral: [
      "Bit blustery today.",
      "Hold onto your hat in this wind.",
      "Mind the gusts."
    ]
  }
};

// ═══════════════════════════════════════════════════════════
// PHYSICAL BEHAVIORS BY WEATHER
// ═══════════════════════════════════════════════════════════

const weatherBehaviors: Record<WeatherPreferenceType, PhysicalBehavior[]> = {
  heatWave: ['wiping_brow', 'fanning_self', 'seeking_shade', 'moving_slowly'],
  snow: ['shivering', 'rubbing_hands', 'breath_visible', 'hunched_posture'],
  rain: ['hunched_posture', 'hurrying', 'covering_head', 'looking_up'],
  storm: ['flinching', 'hurrying', 'seeking_shelter', 'looking_worried'],
  windy: ['bracing', 'holding_hat', 'squinting', 'leaning_into_wind'],
  fog: ['squinting', 'moving_cautiously', 'looking_around'],
  clear: ['relaxed_posture', 'looking_around_happily'],
  overcast: ['normal_posture']
};

// Energy drain/gain by weather type
const energyModifiers: Record<WeatherPreferenceType, number> = {
  heatWave: -20,
  storm: -10,
  snow: -10,
  clear: +5,
  overcast: 0,
  rain: -5,
  fog: -5,
  windy: -5
};

// ═══════════════════════════════════════════════════════════
// NPC WEATHER REACTION SYSTEM
// ═══════════════════════════════════════════════════════════

class NPCWeatherReactionSystem {
  
  /**
   * Generate weather personality for an NPC
   * Each NPC gets unique weather preferences and traits
   */
  generateWeatherPersonality(): NPCWeatherPersonality {
    return {
      preferences: {
        clear: randomRange(-0.2, 1),      // most like clear weather
        overcast: randomRange(-0.5, 0.8),
        rain: randomRange(-1, 1),
        storm: randomRange(-1, 0.3),      // most dislike storms
        fog: randomRange(-0.7, 0.5),
        snow: randomRange(-1, 1),
        heatWave: randomRange(-1, 0.5),
        windy: randomRange(-0.6, 0.6)
      },
      traits: {
        weatherSensitive: Math.random() < 0.3,   // mood swings with weather
        outdoorsy: Math.random() < 0.35,         // tolerates extremes
        romantic: Math.random() < 0.15,          // poetic about weather
        complainer: Math.random() < 0.25         // vocalizes discomfort
      }
    };
  }

  /**
   * Generate weather personality with bias towards certain traits
   */
  generateWeatherPersonalityWithBias(bias: {
    likesOutdoors?: boolean;
    moody?: boolean;
    poetic?: boolean;
    grumpy?: boolean;
  }): NPCWeatherPersonality {
    const personality = this.generateWeatherPersonality();
    
    if (bias.likesOutdoors) {
      personality.traits.outdoorsy = true;
      personality.preferences.clear = randomRange(0.3, 1);
      personality.preferences.storm = randomRange(-0.5, 0.5);
    }
    
    if (bias.moody) {
      personality.traits.weatherSensitive = true;
    }
    
    if (bias.poetic) {
      personality.traits.romantic = true;
    }
    
    if (bias.grumpy) {
      personality.traits.complainer = true;
      // Grumpy NPCs dislike more weather types
      Object.keys(personality.preferences).forEach(key => {
        const k = key as WeatherPreferenceType;
        personality.preferences[k] = Math.min(personality.preferences[k], randomRange(-1, 0.3));
      });
    }
    
    return personality;
  }

  /**
   * Map game weather type to preference type
   */
  private mapWeatherType(weather: WeatherType | string): WeatherPreferenceType {
    const mapping: Record<string, WeatherPreferenceType> = {
      'clear': 'clear',
      'sunny': 'clear',
      'partly_cloudy': 'overcast',
      'cloudy': 'overcast',
      'overcast': 'overcast',
      'light_rain': 'rain',
      'rain': 'rain',
      'heavy_rain': 'rain',
      'drizzle': 'rain',
      'thunderstorm': 'storm',
      'storm': 'storm',
      'lightning': 'storm',
      'fog': 'fog',
      'mist': 'fog',
      'haze': 'fog',
      'snow': 'snow',
      'light_snow': 'snow',
      'heavy_snow': 'snow',
      'blizzard': 'snow',
      'heatwave': 'heatWave',
      'heat_wave': 'heatWave',
      'hot': 'heatWave',
      'windy': 'windy',
      'wind': 'windy',
      'gusty': 'windy'
    };
    
    return mapping[weather.toLowerCase()] || 'clear';
  }

  /**
   * Calculate how weather affects this NPC right now
   */
  getWeatherImpact(
    weatherPersonality: NPCWeatherPersonality, 
    currentWeather: WeatherType | string
  ): WeatherImpact {
    const weatherType = this.mapWeatherType(currentWeather);
    const pref = weatherPersonality.preferences[weatherType];
    const traits = weatherPersonality.traits;
    
    let moodModifier = pref * 15; // -15 to +15 mood shift
    let energyModifier = energyModifiers[weatherType] || 0;
    let comfortLevel = 50 + (pref * 30); // 20-80 base comfort
    
    // Trait adjustments
    if (traits.weatherSensitive) {
      moodModifier *= 1.5;
    }
    
    if (traits.outdoorsy && ['storm', 'heatWave', 'snow'].includes(weatherType)) {
      comfortLevel += 15;
      energyModifier = Math.max(energyModifier, -5); // Less energy drain
    }
    
    // Complainers feel worse about bad weather
    if (traits.complainer && pref < 0) {
      moodModifier -= 5;
      comfortLevel -= 10;
    }
    
    return {
      moodModifier: Math.round(moodModifier),
      energyModifier,
      comfortLevel: clamp(comfortLevel, 0, 100),
      wantsToGoInside: comfortLevel < 35,
      willingToTravel: comfortLevel > 40,
      enjoyingWeather: pref > 0.3
    };
  }

  /**
   * Generate contextual weather dialogue based on NPC personality
   */
  getWeatherDialogue(
    weatherPersonality: NPCWeatherPersonality, 
    currentWeather: WeatherType | string
  ): string | null {
    const weatherType = this.mapWeatherType(currentWeather);
    const pref = weatherPersonality.preferences[weatherType];
    const traits = weatherPersonality.traits;
    
    const pool = weatherDialoguePools[weatherType];
    if (!pool) return null;

    // Select based on preference and traits
    let category: keyof DialoguePool;
    
    if (traits.romantic && pool.romantic && Math.random() < 0.4) {
      category = 'romantic';
    } else if (pref > 0.3) {
      category = 'positive';
    } else if (pref < -0.3) {
      category = 'negative';
    } else {
      category = 'neutral';
    }

    const lines = pool[category] || pool.neutral;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  /**
   * Get multiple dialogue options for variety
   */
  getWeatherDialogueOptions(
    weatherPersonality: NPCWeatherPersonality, 
    currentWeather: WeatherType | string,
    count: number = 3
  ): string[] {
    const options: string[] = [];
    const seen = new Set<string>();
    
    for (let i = 0; i < count * 2 && options.length < count; i++) {
      const line = this.getWeatherDialogue(weatherPersonality, currentWeather);
      if (line && !seen.has(line)) {
        seen.add(line);
        options.push(line);
      }
    }
    
    return options;
  }

  /**
   * NPCs adjust their daily behavior based on weather
   */
  modifyScheduleForWeather(
    weatherPersonality: NPCWeatherPersonality,
    schedule: ScheduleActivity[], 
    currentWeather: WeatherType | string,
    npcHasHome: boolean = true
  ): ScheduleActivity[] {
    const weatherType = this.mapWeatherType(currentWeather);
    const impact = this.getWeatherImpact(weatherPersonality, currentWeather);
    const modified = schedule.map(activity => ({ ...activity }));

    // Cancel outdoor activities if too uncomfortable
    if (impact.wantsToGoInside) {
      modified.forEach(activity => {
        if (activity.location?.isOutdoor) {
          activity.cancelled = true;
          activity.cancelReason = `Avoiding the ${weatherType}`;
          activity.alternative = this.findIndoorAlternative(activity);
        }
      });
    }

    // Delay travel in bad conditions
    if (!impact.willingToTravel && ['storm', 'heatWave'].includes(weatherType)) {
      modified.forEach(activity => {
        if (activity.requiresTravel) {
          activity.delayed = true;
          activity.delayReason = "Waiting for better weather";
        }
      });
    }

    // Add weather-specific activities
    if (weatherType === 'rain' && npcHasHome) {
      modified.push({
        type: 'stayIndoors',
        priority: 'preferred',
        reason: 'Sheltering from rain'
      });
    }

    if (weatherType === 'storm') {
      modified.push({
        type: 'seekShelter',
        priority: 'urgent',
        reason: 'Storm safety'
      });
    }

    if (weatherType === 'heatWave') {
      modified.push({
        type: 'restInShade',
        priority: 'preferred',
        reason: 'Escaping the heat'
      });
    }

    return modified;
  }

  /**
   * Find indoor alternative for cancelled outdoor activity
   */
  private findIndoorAlternative(activity: ScheduleActivity): ScheduleActivity | null {
    const alternatives: Record<string, ScheduleActivity> = {
      'patrol': { type: 'guardIndoors', location: { isOutdoor: false, name: 'guardhouse' } },
      'farm': { type: 'repairTools', location: { isOutdoor: false, name: 'barn' } },
      'market': { type: 'inventory', location: { isOutdoor: false, name: 'shop' } },
      'train': { type: 'exercise', location: { isOutdoor: false, name: 'training hall' } },
      'hunt': { type: 'prepareEquipment', location: { isOutdoor: false, name: 'home' } },
      'gather': { type: 'craftItems', location: { isOutdoor: false, name: 'workshop' } },
      'travel': { type: 'waitForWeather', location: { isOutdoor: false, name: 'inn' } }
    };
    
    return alternatives[activity.type] || {
      type: 'waitIndoors',
      location: { isOutdoor: false, name: 'nearby building' }
    };
  }

  /**
   * Get physical behaviors NPCs show based on weather
   */
  getPhysicalBehaviors(
    weatherPersonality: NPCWeatherPersonality,
    currentWeather: WeatherType | string
  ): PhysicalBehavior[] {
    const weatherType = this.mapWeatherType(currentWeather);
    const impact = this.getWeatherImpact(weatherPersonality, currentWeather);
    
    let behaviors = [...(weatherBehaviors[weatherType] || [])];

    // Remove positive behaviors if they hate this weather
    if (impact.comfortLevel < 35) {
      behaviors = behaviors.filter(b => !b.includes('happily'));
    }

    // Add discomfort behaviors if really uncomfortable
    if (impact.comfortLevel < 25) {
      behaviors.push('looking_worried');
    }

    // Outdoorsy people are more relaxed in extreme weather
    if (weatherPersonality.traits.outdoorsy && impact.comfortLevel > 50) {
      behaviors = behaviors.filter(b => 
        !['flinching', 'hurrying', 'looking_worried'].includes(b)
      );
    }

    return behaviors;
  }

  /**
   * Check if NPC wants to discuss weather (for small talk)
   */
  canDiscussWeather(weatherPersonality: NPCWeatherPersonality): boolean {
    const traits = weatherPersonality.traits;
    
    // Complainers always want to discuss it
    if (traits.complainer) return Math.random() < 0.6;
    
    // Weather-sensitive people often bring it up
    if (traits.weatherSensitive) return Math.random() < 0.4;
    
    // Romantic types like discussing weather poetically
    if (traits.romantic) return Math.random() < 0.35;
    
    // Others occasionally mention it
    return Math.random() < 0.15;
  }

  /**
   * Get weather-related greeting or small talk opener
   */
  getWeatherSmallTalk(
    weatherPersonality: NPCWeatherPersonality,
    currentWeather: WeatherType | string
  ): { topic: 'weather'; line: string } | null {
    if (!this.canDiscussWeather(weatherPersonality)) {
      return null;
    }

    const line = this.getWeatherDialogue(weatherPersonality, currentWeather);
    if (!line) return null;

    return {
      topic: 'weather',
      line
    };
  }

  /**
   * Describe NPC's current weather-related state for narrative
   */
  describeWeatherReaction(
    npcName: string,
    weatherPersonality: NPCWeatherPersonality,
    currentWeather: WeatherType | string
  ): string {
    const weatherType = this.mapWeatherType(currentWeather);
    const impact = this.getWeatherImpact(weatherPersonality, currentWeather);
    const behaviors = this.getPhysicalBehaviors(weatherPersonality, currentWeather);
    
    const behaviorDescriptions: Record<PhysicalBehavior, string> = {
      'wiping_brow': 'wipes sweat from their brow',
      'fanning_self': 'fans themselves with their hand',
      'seeking_shade': 'sticks to the shadows',
      'moving_slowly': 'moves sluggishly in the heat',
      'shivering': 'shivers against the cold',
      'rubbing_hands': 'rubs their hands together for warmth',
      'breath_visible': 'watches their breath fog in the air',
      'hunched_posture': 'hunches their shoulders',
      'hurrying': 'hurries along',
      'covering_head': 'covers their head',
      'looking_up': 'glances at the sky',
      'flinching': 'flinches at the thunder',
      'seeking_shelter': 'looks for shelter',
      'looking_worried': 'looks worried',
      'bracing': 'braces against the wind',
      'holding_hat': 'holds onto their hat',
      'squinting': 'squints against the elements',
      'leaning_into_wind': 'leans into the wind',
      'moving_cautiously': 'moves cautiously',
      'looking_around': 'peers into the murk',
      'relaxed_posture': 'seems relaxed',
      'looking_around_happily': 'takes in the pleasant weather',
      'normal_posture': 'goes about their business'
    };

    if (behaviors.length === 0) {
      return `${npcName} seems unaffected by the weather.`;
    }

    const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
    const description = behaviorDescriptions[behavior] || 'reacts to the weather';

    let mood = '';
    if (impact.enjoyingWeather) {
      mood = 'contentedly ';
    } else if (impact.comfortLevel < 30) {
      mood = 'miserably ';
    } else if (impact.comfortLevel < 50) {
      mood = 'reluctantly ';
    }

    return `${npcName} ${mood}${description}.`;
  }
}

// Singleton instance
export const npcWeatherReactionSystem = new NPCWeatherReactionSystem();

// ═══════════════════════════════════════════════════════════
// INTEGRATION HELPER
// ═══════════════════════════════════════════════════════════

/**
 * Update an NPC's state based on current weather
 * Call this in your NPC update loop
 */
export function updateNPCForWeather(
  npc: {
    name?: string;
    mood: number;
    energy: number;
    weatherPersonality?: NPCWeatherPersonality;
    currentBehaviors?: PhysicalBehavior[];
    todaySchedule?: ScheduleActivity[];
    baseSchedule?: ScheduleActivity[];
    smallTalkQueue?: Array<{ topic: string; line: string }>;
    hasHome?: boolean;
  },
  currentWeather: WeatherType | string
): void {
  // Ensure NPC has weather personality
  if (!npc.weatherPersonality) {
    npc.weatherPersonality = npcWeatherReactionSystem.generateWeatherPersonality();
  }

  const impact = npcWeatherReactionSystem.getWeatherImpact(
    npc.weatherPersonality, 
    currentWeather
  );

  // Apply mood/energy changes (scaled down for per-tick updates)
  npc.mood = clamp(npc.mood + impact.moodModifier * 0.1, 0, 100);
  npc.energy = clamp(npc.energy + impact.energyModifier * 0.1, 0, 100);

  // Update visible behavior
  npc.currentBehaviors = npcWeatherReactionSystem.getPhysicalBehaviors(
    npc.weatherPersonality, 
    currentWeather
  );

  // Modify their schedule if they have one
  if (npc.baseSchedule) {
    npc.todaySchedule = npcWeatherReactionSystem.modifyScheduleForWeather(
      npc.weatherPersonality,
      npc.baseSchedule,
      currentWeather,
      npc.hasHome ?? true
    );
  }

  // Queue weather dialogue if they want to chat about it
  if (npc.smallTalkQueue) {
    const smallTalk = npcWeatherReactionSystem.getWeatherSmallTalk(
      npc.weatherPersonality, 
      currentWeather
    );
    
    if (smallTalk) {
      // Avoid duplicate weather talk
      const hasWeatherTalk = npc.smallTalkQueue.some(t => t.topic === 'weather');
      if (!hasWeatherTalk) {
        npc.smallTalkQueue.push(smallTalk);
      }
    }
  }
}
