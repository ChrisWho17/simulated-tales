// Environment & Narrative Modifier Integration System
// Bridges environmental conditions and narrative events to the buff/debuff system

import {
  Modifier,
  ModifierState,
  ModifierCategory,
  ModifierTemplate,
  ModifierOccurredAt,
  ModifierTriggerEvent,
  applyModifier,
  createModifierFromTemplate,
  createModifierOccurredAt,
  createModifierTriggerEvent,
  findTemplateByName,
  tickModifiers,
  recomputeInteractions,
  createDefaultModifierState,
  ENVIRONMENT_TEMPLATES,
  INJURY_TEMPLATES,
  FATIGUE_TEMPLATES,
  NUTRITION_TEMPLATES,
  PSYCHOLOGICAL_TEMPLATES,
  ILLNESS_TEMPLATES,
  CHEMICAL_TEMPLATES,
  PHOBIA_TEMPLATES,
} from './buffDebuffSystem';
import {
  PlayerCondition,
  LocationEnvironment,
  calculateEnvironmentalPressure,
  locationEnvironments,
} from './environmentSystem';

// ============================================================================
// ENVIRONMENTAL DETECTION SYSTEM
// ============================================================================

export interface WeatherCondition {
  type: 'clear' | 'rain' | 'storm' | 'snow' | 'fog' | 'heatwave' | 'cold_snap';
  severity: number; // 0-100
  duration: number; // hours
}

export interface TimeOfDay {
  period: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
  hour: number;
}

export interface EnvironmentContext {
  locationId: string;
  locationName: string;
  weather: WeatherCondition;
  timeOfDay: TimeOfDay;
  altitude?: 'sea_level' | 'elevated' | 'high_altitude' | 'extreme_altitude';
  indoors: boolean;
  shelterQuality: number; // 0-100
}

// Trigger thresholds - make modifiers harder to get
const TRIGGER_THRESHOLDS = {
  WEATHER_SEVERITY_MIN: 0.5,    // Weather must be at least 50% severe
  TEMPERATURE_LOW: 25,          // Warmth below this for cold effects
  TEMPERATURE_DANGER: 15,       // Warmth below this for hypothermia
  FATIGUE_THRESHOLD: 75,        // Fatigue must exceed this for late night effects
  HUNGER_THRESHOLD: 20,         // Satiation below this for hunger
  HUNGER_DANGER: 5,             // Satiation below this for starving
  THIRST_THRESHOLD: 25,         // Hydration below this for dehydration
  BUFF_SATIATION_MIN: 80,       // Satiation above this for Well Fed
  BUFF_HYDRATION_MIN: 80,       // Hydration above this for Hydrated
};

// Map weather types to environmental modifier templates
const WEATHER_TO_MODIFIER: Record<string, string[]> = {
  rain: ['Rain Soaked'],
  storm: ['Rain Soaked', 'Poor Visibility'],
  snow: ['Chilled', 'Poor Visibility'],
  fog: ['Poor Visibility'],
  heatwave: ['Heat Stress'],
  cold_snap: ['Chilled'],
};

// Map altitude to modifiers
const ALTITUDE_TO_MODIFIER: Record<string, string[]> = {
  high_altitude: ['Low Oxygen'],
  extreme_altitude: ['Low Oxygen'],
};

/**
 * Detect environmental modifiers based on current context
 */
export function detectEnvironmentalModifiers(
  context: EnvironmentContext,
  playerCondition: PlayerCondition,
  currentTick: number,
  campaignId: string
): Modifier[] {
  const detectedModifiers: Modifier[] = [];
  const location = locationEnvironments[context.locationId] || {
    shelter: 50,
    safety: 50,
    resources: 50,
    infrastructure: 50,
  };

  // Weather-based modifiers (only if outdoors or poor shelter AND severe weather)
  const weatherSeverityNormalized = context.weather.severity / 100;
  if ((!context.indoors || context.shelterQuality < 30) && weatherSeverityNormalized >= TRIGGER_THRESHOLDS.WEATHER_SEVERITY_MIN) {
    const weatherModifiers = WEATHER_TO_MODIFIER[context.weather.type] || [];
    for (const modName of weatherModifiers) {
      const template = findTemplateByName(modName);
      if (template) {
        // Scale severity by weather severity and shelter
        const shelterReduction = context.indoors ? context.shelterQuality / 100 : 0;
        const effectiveSeverity = weatherSeverityNormalized * (1 - shelterReduction * 0.8);
        
        // Require significant severity to apply
        if (effectiveSeverity >= 0.35) {
          const modifier = createModifierFromTemplate(
            template,
            campaignId,
            'player',
            `weather_${context.weather.type}`,
            currentTick
          );
          modifier.severity = Math.min(1, effectiveSeverity);
          detectedModifiers.push(modifier);
        }
      }
    }
  }

  // Temperature-based modifiers (stricter thresholds)
  if (playerCondition.warmth < TRIGGER_THRESHOLDS.TEMPERATURE_LOW) {
    const coldSeverity = (TRIGGER_THRESHOLDS.TEMPERATURE_LOW - playerCondition.warmth) / TRIGGER_THRESHOLDS.TEMPERATURE_LOW;
    const template = playerCondition.warmth < TRIGGER_THRESHOLDS.TEMPERATURE_DANGER
      ? findTemplateByName('Hypothermia Risk')
      : findTemplateByName('Chilled');
    
    if (template && coldSeverity >= 0.3) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'low_warmth',
        currentTick
      );
      modifier.severity = coldSeverity;
      detectedModifiers.push(modifier);
    }
  }

  // Altitude-based modifiers
  if (context.altitude) {
    const altitudeModifiers = ALTITUDE_TO_MODIFIER[context.altitude] || [];
    for (const modName of altitudeModifiers) {
      const template = findTemplateByName(modName);
      if (template) {
        const modifier = createModifierFromTemplate(
          template,
          campaignId,
          'player',
          `altitude_${context.altitude}`,
          currentTick
        );
        detectedModifiers.push(modifier);
      }
    }
  }

  // Fatigue from time of day (stricter threshold)
  if (context.timeOfDay.period === 'late_night' && playerCondition.fatigue > TRIGGER_THRESHOLDS.FATIGUE_THRESHOLD) {
    const template = findTemplateByName('Sleep Deprived');
    const severityCalc = (playerCondition.fatigue - TRIGGER_THRESHOLDS.FATIGUE_THRESHOLD) / (100 - TRIGGER_THRESHOLDS.FATIGUE_THRESHOLD);
    if (template && severityCalc >= 0.3) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'late_night_fatigue',
        currentTick
      );
      modifier.severity = Math.min(1, severityCalc);
      detectedModifiers.push(modifier);
    }
  }

  // Hunger/nutrition modifiers (stricter thresholds)
  if (playerCondition.satiation < TRIGGER_THRESHOLDS.HUNGER_THRESHOLD) {
    const template = playerCondition.satiation < TRIGGER_THRESHOLDS.HUNGER_DANGER
      ? findTemplateByName('Starving')
      : findTemplateByName('Hungry');
    
    const hungerSeverity = (TRIGGER_THRESHOLDS.HUNGER_THRESHOLD - playerCondition.satiation) / TRIGGER_THRESHOLDS.HUNGER_THRESHOLD;
    if (template && hungerSeverity >= 0.3) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'low_satiation',
        currentTick
      );
      modifier.severity = hungerSeverity;
      detectedModifiers.push(modifier);
    }
  } else if (playerCondition.satiation >= TRIGGER_THRESHOLDS.BUFF_SATIATION_MIN) {
    const template = findTemplateByName('Well Fed');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'good_satiation',
        currentTick
      );
      modifier.severity = 0.35;
      detectedModifiers.push(modifier);
    }
  }

  // Hydration modifiers (stricter thresholds)
  if (playerCondition.hydration < TRIGGER_THRESHOLDS.THIRST_THRESHOLD) {
    const template = findTemplateByName('Dehydrated');
    const thirstSeverity = (TRIGGER_THRESHOLDS.THIRST_THRESHOLD - playerCondition.hydration) / TRIGGER_THRESHOLDS.THIRST_THRESHOLD;
    if (template && thirstSeverity >= 0.3) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'low_hydration',
        currentTick
      );
      modifier.severity = thirstSeverity;
      detectedModifiers.push(modifier);
    }
  } else if (playerCondition.hydration >= TRIGGER_THRESHOLDS.BUFF_HYDRATION_MIN) {
    const template = findTemplateByName('Hydrated');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'good_hydration',
        currentTick
      );
      modifier.severity = 0.3;
      detectedModifiers.push(modifier);
    }
  }

  return detectedModifiers;
}

// ============================================================================
// NARRATIVE EVENT PARSER
// ============================================================================

// Keywords that suggest specific modifiers in narrative text
const NARRATIVE_MODIFIER_PATTERNS: Array<{
  patterns: RegExp[];
  modifierName: string;
  severityMultiplier?: number;
  incidentGenerator?: (match: RegExpMatchArray, narrativeText: string) => { incident: string; bodyPart?: string; };
}> = [
  // Injuries with specific body part detection
  { 
    patterns: [/\b(bruise[ds]?|bruising)\b/i], 
    modifierName: 'Bruising',
    incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'bruised')
  },
  { 
    patterns: [/\b(strain(ed)?|pull(ed)? (a )?muscle)\b/i], 
    modifierName: 'Muscle Strain',
    incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'strained')
  },
  { 
    patterns: [/\b(cut[s]?|slice[ds]?|nick(ed)?)\b/i, /\bshallow (wound|cut)\b/i], 
    modifierName: 'Shallow Cut',
    incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'cut')
  },
  { 
    patterns: [/\b(burn(ed|s)?|scorch(ed)?)\b/i, /\bminor burn\b/i], 
    modifierName: 'Minor Burn',
    incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'burned')
  },
  { patterns: [/\b(scrape[ds]?|abrasion)\b/i], modifierName: 'Abrasion', incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'scraped') },
  { patterns: [/\bsprain(ed|s)? (your |the )?ankle\b/i, /\btwist(ed)? (your |the )?ankle\b/i], modifierName: 'Sprained Ankle', incidentGenerator: () => ({ incident: 'Twisted or overstretched ankle', bodyPart: 'ankle' }) },
  { patterns: [/\bsprain(ed|s)? (your |the )?wrist\b/i, /\btwist(ed)? (your |the )?wrist\b/i], modifierName: 'Sprained Wrist', incidentGenerator: () => ({ incident: 'Twisted or overstretched wrist', bodyPart: 'wrist' }) },
  { 
    patterns: [/\b(break|broke|broken|fracture[ds]?) (your |the )?(leg|arm|limb|bone)\b/i], 
    modifierName: 'Broken Limb', 
    severityMultiplier: 0.9,
    incidentGenerator: (match, text) => {
      const part = match[3] || 'limb';
      return { incident: `Bone fracture from trauma`, bodyPart: part };
    }
  },
  { patterns: [/\b(concuss(ed|ion)?|head (injury|trauma))\b/i], modifierName: 'Mild Concussion', incidentGenerator: () => ({ incident: 'Blow to the head causing concussion', bodyPart: 'head' }) },
  { 
    patterns: [/\b(stab(bed)?|pierce[ds]?|impale[ds]?)\b/i], 
    modifierName: 'Laceration', 
    severityMultiplier: 0.7,
    incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'stabbed/pierced')
  },
  { 
    patterns: [/\bshot (in |through )?(the )?(arm|leg|shoulder|chest|side|stomach|hand|foot)\b/i, /\b(shot|bullet|gunshot)\b/i], 
    modifierName: 'Bullet Wound', 
    severityMultiplier: 0.8,
    incidentGenerator: (match, text) => {
      const bodyPartMatch = text.match(/shot (in |through )?(the )?(arm|leg|shoulder|chest|side|stomach|hand|foot)/i);
      const part = bodyPartMatch ? bodyPartMatch[3] : undefined;
      return { incident: part ? `Shot in the ${part}` : 'Gunshot wound from projectile', bodyPart: part };
    }
  },
  { patterns: [/\b(shrapnel|fragment[s]?)\b/i], modifierName: 'Shrapnel Embedded', incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'embedded shrapnel') },
  { patterns: [/\b(infect(ed|ion)?|fester(ing)?)\b/i], modifierName: 'Infection', incidentGenerator: (match, text) => extractInjuryIncident(match[0], text, 'infected') },
  { patterns: [/\b(shock|traumatic shock)\b/i, /\bgo(es|ing)? into shock\b/i], modifierName: 'Shock', incidentGenerator: () => ({ incident: 'Body went into shock from trauma' }) },
  
  // Fatigue
  { patterns: [/\b(winded|out of breath|gasping)\b/i], modifierName: 'Winded', incidentGenerator: () => ({ incident: 'Overexertion causing shortness of breath' }) },
  { patterns: [/\b(tired|fatigue[ds]?|weary)\b/i], modifierName: 'Fatigued', incidentGenerator: () => ({ incident: 'Physical exhaustion from activity' }) },
  { patterns: [/\b(exhaust(ed|ion)?|completely drained)\b/i], modifierName: 'Exhausted', incidentGenerator: () => ({ incident: 'Complete physical and mental exhaustion' }) },
  { patterns: [/\b(overexert(ed)?|push(ed)? (too|yourself) (hard|far))\b/i], modifierName: 'Overexerted', incidentGenerator: () => ({ incident: 'Pushed body beyond safe limits' }) },
  { patterns: [/\b(sleep deprive[ds]?|haven't slept|no sleep)\b/i], modifierName: 'Sleep Deprived', incidentGenerator: () => ({ incident: 'Extended period without proper sleep' }) },
  { patterns: [/\b(second wind|renewed energy|surge of energy)\b/i], modifierName: 'Second Wind', incidentGenerator: () => ({ incident: 'Sudden burst of renewed energy' }) },
  { patterns: [/\b(well[- ]?rested|fully rested|good night'?s? sleep)\b/i], modifierName: 'Well Rested', incidentGenerator: () => ({ incident: 'Fully recovered after quality rest' }) },
  
  // Nutrition
  { patterns: [/\b(hungry|hunger|stomach (growl|rumbl))\b/i], modifierName: 'Hungry', incidentGenerator: () => ({ incident: 'Stomach growling from lack of food' }) },
  { patterns: [/\b(starv(ing|ed)?|famish(ed)?)\b/i], modifierName: 'Starving', incidentGenerator: () => ({ incident: 'Severe hunger from prolonged lack of food' }) },
  { patterns: [/\b(dehydrat(ed|ion)?|parched|thirst(y)?)\b/i], modifierName: 'Dehydrated', incidentGenerator: () => ({ incident: 'Lack of water intake' }) },
  { patterns: [/\b(satisf(ied|ying) meal|ate well|full (stomach|belly))\b/i], modifierName: 'Well Fed', incidentGenerator: () => ({ incident: 'Ate a satisfying, filling meal' }) },
  
  // Psychological
  { patterns: [/\b(panic(k?(ed|ing))?|terror(ized)?)\b/i], modifierName: 'Panic', incidentGenerator: (match, text) => ({ incident: extractPsychologicalCause(text, 'panic') }) },
  { patterns: [/\b(fear(ful)?|afraid|scared|frightened)\b/i], modifierName: 'Fear Triggered', incidentGenerator: (match, text) => ({ incident: extractPsychologicalCause(text, 'fear') }) },
  { patterns: [/\b(calm(ed|ing)?|peaceful|serene|tranquil)\b/i], modifierName: 'Calm', incidentGenerator: () => ({ incident: 'Found moment of peace and tranquility' }) },
  { patterns: [/\b(focus(ed)?|concentrate[ds]?|sharp mind)\b/i], modifierName: 'Focused', incidentGenerator: () => ({ incident: 'Mind locked into complete concentration' }) },
  { patterns: [/\b(determin(ed|ation)|resolv(ed)?|steely resolve)\b/i], modifierName: 'Determined', incidentGenerator: () => ({ incident: 'Steeled resolve to push forward' }) },
  { patterns: [/\b(inspir(ed|ation|ing))\b/i], modifierName: 'Inspired', incidentGenerator: () => ({ incident: 'Found sudden inspiration or motivation' }) },
  { patterns: [/\b(guilt(y)?|remorse(ful)?|ashamed)\b/i], modifierName: 'Guilt', incidentGenerator: (match, text) => ({ incident: extractPsychologicalCause(text, 'guilt') }) },
  { patterns: [/\b(stress(ed)?|overwhelm(ed)?|burden(ed)?)\b/i], modifierName: 'Stress Overload', incidentGenerator: () => ({ incident: 'Overwhelmed by mounting pressures' }) },
  { patterns: [/\b(flashback|ptsd|trauma trigger)\b/i], modifierName: 'PTSD Response', incidentGenerator: (match, text) => ({ incident: extractPsychologicalCause(text, 'trauma') }) },
  
  // Illness
  { patterns: [/\b(fever(ish)?|burning up|high temperature)\b/i], modifierName: 'Fever', incidentGenerator: () => ({ incident: 'Body temperature elevated from illness' }) },
  { patterns: [/\b(food poison(ing|ed)?|sick from (the )?food)\b/i], modifierName: 'Food Poisoning', incidentGenerator: () => ({ incident: 'Ate contaminated or spoiled food' }) },
  { patterns: [/\b(nause(a|ous)|sick to (your |the )?stomach|queasy)\b/i], modifierName: 'Nausea', incidentGenerator: () => ({ incident: 'Stomach upset causing nausea' }) },
  
  // Chemical/Medical
  { patterns: [/\b(painkiller|pain (med(ication)?|relief)|(took|take) (some )?medicine)\b/i], modifierName: 'Pain Suppression', incidentGenerator: () => ({ incident: 'Took pain medication for relief' }) },
  { patterns: [/\b(stimulant|caffeine|energy (drink|boost)|adrenaline (shot|rush))\b/i], modifierName: 'Stimulant Effect', incidentGenerator: () => ({ incident: 'Consumed stimulant for energy boost' }) },
  { patterns: [/\b(drunk|intoxicat(ed)?|inebriat(ed)?)\b/i], modifierName: 'Intoxicated', incidentGenerator: () => ({ incident: 'Consumed too much alcohol' }) },
  { patterns: [/\b(withdraw(al|ing)?|craving|need (a|the) (fix|hit|dose))\b/i], modifierName: 'Withdrawal', incidentGenerator: () => ({ incident: 'Body craving absent substance' }) },
];

// Body parts for injury detection
const BODY_PARTS = ['arm', 'leg', 'hand', 'foot', 'head', 'face', 'chest', 'back', 'shoulder', 'stomach', 'side', 'knee', 'elbow', 'ankle', 'wrist', 'finger', 'toe', 'neck', 'hip', 'thigh', 'calf', 'forearm', 'shin', 'ribs'];

function extractInjuryIncident(matchedWord: string, narrativeText: string, actionWord: string): { incident: string; bodyPart?: string } {
  // Try to find a body part near the matched word
  const lowerText = narrativeText.toLowerCase();
  const matchIndex = lowerText.indexOf(matchedWord.toLowerCase());
  const nearbyText = lowerText.slice(Math.max(0, matchIndex - 40), matchIndex + matchedWord.length + 40);
  
  for (const part of BODY_PARTS) {
    if (nearbyText.includes(part)) {
      return { 
        incident: `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} ${part}`,
        bodyPart: part 
      };
    }
  }
  
  return { incident: `${actionWord.charAt(0).toUpperCase() + actionWord.slice(1)} from incident` };
}

function extractPsychologicalCause(narrativeText: string, emotionType: string): string {
  // Try to extract what caused the psychological state
  const causePatterns = [
    /because of (.+?)[.,!]/i,
    /from seeing (.+?)[.,!]/i,
    /after (.+?)[.,!]/i,
    /when (.+?)[.,!]/i,
    /due to (.+?)[.,!]/i,
  ];
  
  for (const pattern of causePatterns) {
    const match = narrativeText.match(pattern);
    if (match && match[1]) {
      const cause = match[1].trim().slice(0, 50); // Limit length
      return `${emotionType.charAt(0).toUpperCase() + emotionType.slice(1)} triggered by: ${cause}`;
    }
  }
  
  return `${emotionType.charAt(0).toUpperCase() + emotionType.slice(1)} response triggered`;
}

export interface NarrativeModifierResult {
  modifier: Modifier;
  matchedText: string;
  confidence: number;
}

// Minimum confidence threshold for narrative parsing
const NARRATIVE_CONFIDENCE_THRESHOLD = 0.6;
const MAX_NARRATIVE_MODIFIERS_PER_PARSE = 2; // Only apply top 2 most confident modifiers per narrative

export interface NarrativeContext {
  locationName?: string;
  narrativeTime?: string;
  turnId?: number;
  worldTime?: { day: number; hour: number };
}

/**
 * Parse narrative text for implied modifiers (with strict limits)
 */
export function parseNarrativeForModifiers(
  narrativeText: string,
  campaignId: string,
  currentTick: number,
  context?: NarrativeContext
): NarrativeModifierResult[] {
  const results: NarrativeModifierResult[] = [];
  const foundModifiers = new Set<string>(); // Prevent duplicates

  for (const { patterns, modifierName, severityMultiplier = 1, incidentGenerator } of NARRATIVE_MODIFIER_PATTERNS) {
    for (const pattern of patterns) {
      try {
        const match = narrativeText.match(pattern);
        if (match && !foundModifiers.has(modifierName)) {
          foundModifiers.add(modifierName);
          
          const template = findTemplateByName(modifierName);
          if (template) {
            // Adjust severity based on context words
            let contextSeverity = template.baseSeverity * severityMultiplier;
            
            // Intensity modifiers in text
            if (/\b(severe(ly)?|serious(ly)?|bad(ly)?|terrible|horrible|critical|extreme)\b/i.test(narrativeText)) {
              contextSeverity = Math.min(1, contextSeverity * 1.5);
            }
            if (/\b(slight(ly)?|minor|mild(ly)?|barely|little|small)\b/i.test(narrativeText)) {
              contextSeverity = contextSeverity * 0.5;
            }
            
            // Only proceed if severity meets minimum threshold
            if (contextSeverity < 0.25) {
              continue;
            }
            
            const modifier = createModifierFromTemplate(
              template,
              campaignId,
              'player',
              `narrative_${match[0].toLowerCase().replace(/\s+/g, '_')}`,
              currentTick
            );
            
            modifier.severity = contextSeverity;
            
            // NEW: Add structured timestamp
            modifier.occurredAt = createModifierOccurredAt(
              context?.turnId ?? currentTick,
              context?.worldTime
            );
            
            // Determine trigger event type based on category
            let eventType: ModifierTriggerEvent['type'] = 'narrative';
            if (template.category === 'injury') eventType = 'physical_injury';
            else if (template.category === 'psychological') eventType = 'psychological_trigger';
            else if (template.category === 'environment') eventType = 'environmental';
            else if (template.category === 'phobia') eventType = 'phobia_trigger';
            
            // Generate specific incident description
            let incidentInfo: { incident: string; bodyPart?: string } | undefined;
            if (incidentGenerator) {
              incidentInfo = incidentGenerator(match, narrativeText);
              modifier.incidentDescription = incidentInfo.incident;
              if (incidentInfo.bodyPart) {
                modifier.bodyPart = incidentInfo.bodyPart;
              }
            }
            
            // NEW: Add structured trigger event
            modifier.triggerEvent = createModifierTriggerEvent(
              `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              eventType,
              incidentInfo?.incident || match[0],
              {
                stimulus: match[0],
                bodyPart: incidentInfo?.bodyPart,
                location: context?.locationName,
              }
            );
            
            // LEGACY: Keep for backward compatibility
            modifier.originLocation = context?.locationName || 'Unknown Location';
            modifier.originTimestamp = context?.narrativeTime || undefined; // Never set to "Recently"
            
            // Extract a snippet around the match for narrative context
            const matchIndex = narrativeText.indexOf(match[0]);
            const snippetStart = Math.max(0, matchIndex - 30);
            const snippetEnd = Math.min(narrativeText.length, matchIndex + match[0].length + 50);
            let narrativeSnippet = narrativeText.slice(snippetStart, snippetEnd).trim();
            if (snippetStart > 0) narrativeSnippet = '...' + narrativeSnippet;
            if (snippetEnd < narrativeText.length) narrativeSnippet += '...';
            
            // NEW: Use narrativeExcerpt for flavor text
            modifier.narrativeExcerpt = narrativeSnippet;
            modifier.originNarrative = narrativeSnippet; // Keep for backward compat
            
            // Calculate confidence based on pattern specificity
            const confidence = pattern.source.length > 20 ? 0.9 : 0.7;
            
            if (confidence >= NARRATIVE_CONFIDENCE_THRESHOLD) {
              results.push({
                modifier,
                matchedText: match[0],
                confidence,
              });
            }
          }
          break; // Only match first pattern for each modifier
        }
      } catch (e) {
        console.warn(`Failed to parse narrative for modifier: ${modifierName}`, e);
      }
    }
  }

  // Limit to top N most confident/severe modifiers
  return results
    .sort((a, b) => (b.confidence * b.modifier.severity) - (a.confidence * a.modifier.severity))
    .slice(0, MAX_NARRATIVE_MODIFIERS_PER_PARSE);
}

// ============================================================================
// GAME MECHANICS INTEGRATION
// ============================================================================

export interface GameMechanicsEvent {
  type: 'damage' | 'heal' | 'rest' | 'eat' | 'drink' | 'combat' | 'skill_check' | 'discovery' | 'social';
  amount?: number;
  source?: string;
  success?: boolean;
  context?: Record<string, any>;
}

/**
 * Apply modifiers based on game mechanics events
 */
export function applyMechanicsModifiers(
  event: GameMechanicsEvent,
  state: ModifierState,
  campaignId: string,
  currentTick: number
): ModifierState {
  try {
    if (!state || !event) return state;
    let newState = { ...state };

  switch (event.type) {
    case 'damage':
      if (event.amount && event.amount > 0) {
        // Scale injury based on damage amount
        let injuryTemplate: ModifierTemplate | null = null;
        if (event.amount >= 50) {
          injuryTemplate = findTemplateByName('Broken Limb');
        } else if (event.amount >= 30) {
          injuryTemplate = findTemplateByName('Laceration');
        } else if (event.amount >= 15) {
          injuryTemplate = findTemplateByName('Shallow Cut');
        } else if (event.amount >= 5) {
          injuryTemplate = findTemplateByName('Bruising');
        }

        if (injuryTemplate) {
          const modifier = createModifierFromTemplate(
            injuryTemplate,
            campaignId,
            'player',
            event.source || 'damage_taken',
            currentTick
          );
          modifier.severity = Math.min(1, event.amount / 100);
          newState = applyModifier(newState, modifier);
        }

        // High damage causes shock
        if (event.amount >= 40) {
          const shockTemplate = findTemplateByName('Shock');
          if (shockTemplate) {
            const modifier = createModifierFromTemplate(
              shockTemplate,
              campaignId,
              'player',
              'severe_damage_shock',
              currentTick
            );
            newState = applyModifier(newState, modifier);
          }
        }
      }
      break;

    case 'heal':
      // Healing removes some injury modifiers or reduces their severity
      // This is handled by the resolution system
      break;

    case 'rest':
      // Apply Well Rested buff
      const restTemplate = findTemplateByName('Well Rested');
      if (restTemplate) {
        const modifier = createModifierFromTemplate(
          restTemplate,
          campaignId,
          'player',
          'rest_taken',
          currentTick
        );
        newState = applyModifier(newState, modifier);
      }
      break;

    case 'eat':
      // Apply Well Fed buff
      const eatTemplate = findTemplateByName('Well Fed');
      if (eatTemplate) {
        const modifier = createModifierFromTemplate(
          eatTemplate,
          campaignId,
          'player',
          'food_eaten',
          currentTick
        );
        newState = applyModifier(newState, modifier);
      }
      break;

    case 'drink':
      // Apply Hydrated buff
      const drinkTemplate = findTemplateByName('Hydrated');
      if (drinkTemplate) {
        const modifier = createModifierFromTemplate(
          drinkTemplate,
          campaignId,
          'player',
          'water_consumed',
          currentTick
        );
        newState = applyModifier(newState, modifier);
      }
      break;

    case 'combat':
      // Combat can cause fatigue and potentially stress
      const combatFatigueTemplate = findTemplateByName('Fatigued');
      if (combatFatigueTemplate) {
        const modifier = createModifierFromTemplate(
          combatFatigueTemplate,
          campaignId,
          'player',
          'combat_exertion',
          currentTick
        );
        modifier.severity = 0.3;
        newState = applyModifier(newState, modifier);
      }

      // Failed combat can cause fear
      if (event.success === false) {
        const fearTemplate = findTemplateByName('Fear Triggered');
        if (fearTemplate) {
          const modifier = createModifierFromTemplate(
            fearTemplate,
            campaignId,
            'player',
            'combat_fear',
            currentTick
          );
          newState = applyModifier(newState, modifier);
        }
      }
      break;

    case 'skill_check':
      if (event.success) {
        // Success can grant momentum
        const momentumTemplate = findTemplateByName('Momentum');
        if (momentumTemplate) {
          const modifier = createModifierFromTemplate(
            momentumTemplate,
            campaignId,
            'player',
            'skill_success',
            currentTick
          );
          newState = applyModifier(newState, modifier);
        }
      }
      break;

    case 'discovery':
      // Discoveries can inspire
      const inspireTemplate = findTemplateByName('Inspired');
      if (inspireTemplate) {
        const modifier = createModifierFromTemplate(
          inspireTemplate,
          campaignId,
          'player',
          event.source || 'discovery_made',
          currentTick
        );
        newState = applyModifier(newState, modifier);
      }
      break;
  }

  // Always recompute interactions after applying modifiers
    newState = recomputeInteractions(newState);

    return newState;
  } catch (e) {
    console.warn('Error in applyMechanicsModifiers:', e);
    return state; // Return original state on error
  }
}

// ============================================================================
// MODIFIER STATE MANAGER
// ============================================================================

export interface ModifierManagerConfig {
  tickDuration: number; // In-game hours per tick
  autoApplyEnvironmental: boolean;
  narrativeParsingEnabled: boolean;
}

export class ModifierManager {
  private state: ModifierState;
  private config: ModifierManagerConfig;
  private campaignId: string;
  private currentTick: number;

  constructor(
    campaignId: string,
    config: Partial<ModifierManagerConfig> = {}
  ) {
    this.state = createDefaultModifierState();
    this.campaignId = campaignId;
    this.currentTick = 0;
    this.config = {
      tickDuration: 1, // 1 hour per tick default
      autoApplyEnvironmental: true,
      narrativeParsingEnabled: true,
      ...config,
    };
  }

  getState(): ModifierState {
    return this.state;
  }

  setState(state: ModifierState): void {
    this.state = state;
  }

  getCampaignId(): string {
    return this.campaignId;
  }

  getCurrentTick(): number {
    return this.currentTick;
  }

  /**
   * Process a game tick
   */
  tick(hours: number = 1): void {
    this.currentTick += hours;
    this.state = tickModifiers(this.state, hours);
    this.state = recomputeInteractions(this.state);
  }

  /**
   * Apply environmental modifiers based on context
   */
  processEnvironment(
    context: EnvironmentContext,
    playerCondition: PlayerCondition
  ): Modifier[] {
    if (!this.config.autoApplyEnvironmental) return [];

    const envModifiers = detectEnvironmentalModifiers(
      context,
      playerCondition,
      this.currentTick,
      this.campaignId
    );

    for (const modifier of envModifiers) {
      this.state = applyModifier(this.state, modifier);
    }

    this.state = recomputeInteractions(this.state);
    return envModifiers;
  }

  /**
   * Process narrative text for modifiers
   */
  processNarrative(narrativeText: string, context?: NarrativeContext): NarrativeModifierResult[] {
    try {
      if (!this.config.narrativeParsingEnabled || !narrativeText) return [];

      const results = parseNarrativeForModifiers(
        narrativeText,
        this.campaignId,
        this.currentTick,
        context
      );

      for (const result of results) {
        if (result && result.modifier) {
          this.state = applyModifier(this.state, result.modifier);
        }
      }

      this.state = recomputeInteractions(this.state);
      return results;
    } catch (e) {
      console.warn('Error in processNarrative:', e);
      return [];
    }
  }

  /**
   * Apply a game mechanics event
   */
  processMechanicsEvent(event: GameMechanicsEvent): void {
    this.state = applyMechanicsModifiers(
      event,
      this.state,
      this.campaignId,
      this.currentTick
    );
  }

  /**
   * Get active modifiers summary
   */
  getSummary() {
    const buffs = this.state.activeModifiers.filter(m => m.type === 'buff');
    const debuffs = this.state.activeModifiers.filter(m => m.type === 'debuff');

    return {
      buffs: buffs.map(b => ({
        name: b.name,
        severity: b.severity,
        category: b.category,
        remaining: b.duration.remaining,
      })),
      debuffs: debuffs.map(d => ({
        name: d.name,
        severity: d.severity,
        category: d.category,
        remaining: d.duration.remaining,
      })),
      totalBuffStrength: buffs.reduce((sum, b) => sum + b.severity, 0),
      totalDebuffStrength: debuffs.reduce((sum, d) => sum + d.severity, 0),
    };
  }

  /**
   * Export state for saving
   */
  export(): { state: ModifierState; tick: number } {
    return {
      state: this.state,
      tick: this.currentTick,
    };
  }

  /**
   * Import state from save
   */
  import(data: { state: ModifierState; tick: number }): void {
    this.state = data.state;
    this.currentTick = data.tick;
  }
}

// ============================================================================
// HELPER: Create context from game state
// ============================================================================

export function createEnvironmentContext(
  locationId: string,
  locationName: string,
  weatherType: string = 'clear',
  weatherSeverity: number = 0,
  hour: number = 12
): EnvironmentContext {
  // Determine time of day period
  let period: TimeOfDay['period'];
  if (hour >= 5 && hour < 7) period = 'dawn';
  else if (hour >= 7 && hour < 12) period = 'morning';
  else if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 21) period = 'evening';
  else if (hour >= 21 || hour < 1) period = 'night';
  else period = 'late_night';

  // Check if location is indoors based on name/id patterns
  const indoorPatterns = /tavern|inn|house|home|shop|store|temple|church|castle|palace|building|interior|inside|room|hall|chamber/i;
  const indoors = indoorPatterns.test(locationId) || indoorPatterns.test(locationName);

  // Get shelter quality from location environment
  const locationEnv = locationEnvironments[locationId];
  const shelterQuality = locationEnv?.shelter || (indoors ? 80 : 20);

  return {
    locationId,
    locationName,
    weather: {
      type: weatherType as WeatherCondition['type'],
      severity: weatherSeverity,
      duration: 4, // Default 4 hours
    },
    timeOfDay: {
      period,
      hour,
    },
    indoors,
    shelterQuality,
  };
}

// ============================================================================
// PHOBIA CREATION HELPERS
// ============================================================================

// Map phobia IDs from character creation to modifier template names
const PHOBIA_ID_TO_TEMPLATE: Record<string, string> = {
  'fear_heights': 'Fear of Heights',
  'fear_darkness': 'Fear of Darkness',
  'fear_water': 'Fear of Water',
  'fear_crowds': 'Fear of Crowds',
  'fear_enclosed': 'Fear of Enclosed Spaces',
  'fear_spiders': 'Fear of Spiders',
  'fear_blood': 'Fear of Blood',
  'fear_fire': 'Fear of Fire',
  'fear_storms': 'Fear of Storms',
  'fear_dead': 'Fear of the Dead',
  'fear_isolation': 'Fear of Isolation',
  'fear_failure': 'Fear of Failure',
};

/**
 * Create phobia modifiers from character creation selections
 */
export function createPhobiasFromSelection(
  phobiaIds: string[],
  campaignId: string,
  currentTick: number
): Modifier[] {
  const phobias: Modifier[] = [];
  
  // Backstory descriptions for each phobia
  const PHOBIA_BACKSTORIES: Record<string, { incident: string; trigger: string }> = {
    'fear_heights': { incident: 'A childhood fall from a high place', trigger: 'Being near edges or looking down from heights' },
    'fear_darkness': { incident: 'Got lost in the dark as a child', trigger: 'Complete darkness or when lights go out' },
    'fear_water': { incident: 'Nearly drowned once', trigger: 'Deep water or being submerged' },
    'fear_crowds': { incident: 'Traumatic experience in a crowd', trigger: 'Large groups of people or crowded spaces' },
    'fear_enclosed': { incident: 'Got trapped in a small space', trigger: 'Small rooms, closets, or being confined' },
    'fear_spiders': { incident: 'Terrifying spider encounter as a child', trigger: 'Seeing spiders or webs' },
    'fear_blood': { incident: 'Witnessed a bloody accident', trigger: 'Sight of blood or gore' },
    'fear_fire': { incident: 'Survived a fire or got burned', trigger: 'Open flames or fire' },
    'fear_storms': { incident: 'Caught in a dangerous storm', trigger: 'Thunder, lightning, or severe weather' },
    'fear_dead': { incident: 'Encountered a corpse unexpectedly', trigger: 'Dead bodies or talk of death' },
    'fear_isolation': { incident: 'Abandoned or left alone for too long', trigger: 'Being completely alone' },
    'fear_failure': { incident: 'Devastating public failure', trigger: 'High-stakes situations where failure is possible' },
  };
  
  for (const phobiaId of phobiaIds) {
    const templateName = PHOBIA_ID_TO_TEMPLATE[phobiaId];
    const backstory = PHOBIA_BACKSTORIES[phobiaId];
    if (!templateName) continue;
    
    const template = PHOBIA_TEMPLATES.find(t => t.name === templateName);
    if (!template) {
      // Create a generic phobia if template not found
      const phobia: Modifier = {
        id: `phobia_${phobiaId}_${Date.now()}`,
        campaignId,
        entity: 'player',
        type: 'debuff',
        category: 'phobia',
        name: phobiaId.replace('fear_', 'Fear of ').replace(/_/g, ' '),
        description: 'A persistent fear that affects behavior',
        severity: 0.5,
        effects: [], // Phobias don't affect stats
        duration: { type: 'condition', remaining: Infinity, total: Infinity },
        stackingRule: 'exclusive',
        decayModel: 'conditional',
        originEvent: 'character_creation',
        originLocation: 'Character Background',
        originNarrative: 'A fear that has always been part of who you are.',
        incidentDescription: backstory?.incident || 'A fear from your past',
        triggerCause: backstory?.trigger || 'Unknown triggers',
        provenance: 'reported',
        confidence: 1,
        visibility: 'player_only',
        resolutionPaths: ['therapy', 'overcoming_fear'],
        promotionPolicy: 'expire',
        recurrence: 0,
        emotionalWeight: 0.5,
        appliedAt: currentTick,
        stacks: 1,
      };
      phobias.push(phobia);
    } else {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'character_creation',
        currentTick
      );
      modifier.originLocation = 'Character Background';
      modifier.originNarrative = 'A fear that has always been part of who you are.';
      modifier.incidentDescription = backstory?.incident || 'A deep-seated fear from your past';
      modifier.triggerCause = backstory?.trigger || 'Specific situations related to this fear';
      phobias.push(modifier);
    }
  }
  
  return phobias;
}

/**
 * Create a trauma-induced phobia from narrative events
 */
export function createTraumaPhobia(
  phobiaName: string,
  description: string,
  campaignId: string,
  currentTick: number,
  context?: NarrativeContext,
  incidentDetails?: { incident: string; triggerCause?: string; }
): Modifier {
  return {
    id: `trauma_phobia_${Date.now()}`,
    campaignId,
    entity: 'player',
    type: 'debuff',
    category: 'phobia',
    name: phobiaName,
    description,
    severity: 0.6,
    effects: [], // Phobias don't affect stats
    duration: { type: 'condition', remaining: Infinity, total: Infinity },
    stackingRule: 'exclusive',
    decayModel: 'conditional',
    originEvent: 'trauma',
    originLocation: context?.locationName || 'Unknown Location',
    originTimestamp: context?.narrativeTime,
    originNarrative: `A traumatic experience has left you with this lasting fear.`,
    incidentDescription: incidentDetails?.incident || 'A traumatic experience',
    triggerCause: incidentDetails?.triggerCause,
    provenance: 'observed',
    confidence: 1,
    visibility: 'player_only',
    resolutionPaths: ['therapy', 'overcoming_fear', 'time'],
    promotionPolicy: 'expire',
    recurrence: 0,
    emotionalWeight: 0.7,
    appliedAt: currentTick,
    stacks: 1,
  };
}

// Phobia trigger patterns for narrative detection
const PHOBIA_TRIGGER_PATTERNS: Array<{
  phobiaName: string;
  triggers: RegExp[];
  incidentGenerator: (match: RegExpMatchArray, text: string) => { incident: string; triggerCause: string };
}> = [
  {
    phobiaName: 'Fear of Spiders',
    triggers: [/\b(spider[s]?|tarantula|arachnid)\b/i, /\bcrawl(ed|ing|s)? (on|over|across) (your|the|my)/i],
    incidentGenerator: (match, text) => ({
      incident: 'A spider encounter',
      triggerCause: text.match(/spider crawl(ed|ing|s)? (on|in|over) (my |your )?(\w+)/i)?.[0] || 'Spider appeared nearby'
    })
  },
  {
    phobiaName: 'Fear of Heights',
    triggers: [/\b(cliff|ledge|precipice|rooftop|balcony)\b/i, /\blook(ed|ing)? down/i, /\b(vertigo|dizzy from height)/i],
    incidentGenerator: (match, text) => ({
      incident: 'Looking down from a height',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Darkness',
    triggers: [/\b(pitch black|total darkness|can'?t see anything)\b/i, /\blight[s]? (went out|died|failed)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Plunged into darkness',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Water',
    triggers: [/\b(drown(ed|ing)?|underwater|submerge[ds]?)\b/i, /\b(deep water|ocean|river|lake)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Confronted with deep water',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Crowds',
    triggers: [/\b(crowd(ed)?|throng|mob|packed|swarm of people)\b/i, /\btoo many people\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Surrounded by too many people',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Enclosed Spaces',
    triggers: [/\b(trap(ped)?|confine[ds]?|small (room|space)|closet|coffin)\b/i, /\bwalls closing in\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Trapped in an enclosed space',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Blood',
    triggers: [/\b(blood|bleeding|bloody|gore)\b/i, /\b(crimson|scarlet) (pool|puddle)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Sight of blood',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Fire',
    triggers: [/\b(fire|flame[s]?|blaze|inferno|burning)\b/i, /\bengulf(ed)? in (fire|flame)/i],
    incidentGenerator: (match, text) => ({
      incident: 'Confronted with fire',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Storms',
    triggers: [/\b(thunder|lightning|storm)\b/i, /\b(crash of thunder|bolt of lightning)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Storm overhead',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of the Dead',
    triggers: [/\b(corpse[s]?|dead bod(y|ies)|cadaver|zombie|undead)\b/i, /\b(decay(ing|ed)?|rot(ting|ted)?)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Encountered the dead',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Isolation',
    triggers: [/\b(alone|isolated|abandon(ed)?|solitary|no one around)\b/i, /\b(completely alone|all alone)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Left completely alone',
      triggerCause: match[0]
    })
  },
  {
    phobiaName: 'Fear of Failure',
    triggers: [/\b(fail(ed|ure)?|mess(ed)? up|ruin(ed)?|disappoint(ed)?)\b/i],
    incidentGenerator: (match, text) => ({
      incident: 'Faced with potential failure',
      triggerCause: match[0]
    })
  },
];

/**
 * Check narrative for phobia triggers and return triggered phobias
 */
export function checkPhobiaTriggers(
  narrativeText: string,
  activePhobias: Modifier[],
  context?: NarrativeContext
): { phobia: Modifier; triggerCause: string; incidentDescription: string }[] {
  const triggered: { phobia: Modifier; triggerCause: string; incidentDescription: string }[] = [];
  
  for (const phobia of activePhobias) {
    if (phobia.category !== 'phobia') continue;
    
    const triggerConfig = PHOBIA_TRIGGER_PATTERNS.find(p => p.phobiaName === phobia.name);
    if (!triggerConfig) continue;
    
    for (const trigger of triggerConfig.triggers) {
      const match = narrativeText.match(trigger);
      if (match) {
        const { incident, triggerCause } = triggerConfig.incidentGenerator(match, narrativeText);
        triggered.push({
          phobia,
          triggerCause,
          incidentDescription: incident
        });
        break;
      }
    }
  }
  
  return triggered;
}
