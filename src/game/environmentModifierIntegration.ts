// Environment & Narrative Modifier Integration System
// Bridges environmental conditions and narrative events to the buff/debuff system

import {
  Modifier,
  ModifierState,
  ModifierCategory,
  ModifierTemplate,
  applyModifier,
  createModifierFromTemplate,
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

  // Weather-based modifiers (only if outdoors or poor shelter)
  if (!context.indoors || context.shelterQuality < 50) {
    const weatherModifiers = WEATHER_TO_MODIFIER[context.weather.type] || [];
    for (const modName of weatherModifiers) {
      const template = findTemplateByName(modName);
      if (template) {
        // Scale severity by weather severity and shelter
        const shelterReduction = context.indoors ? context.shelterQuality / 100 : 0;
        const effectiveSeverity = (context.weather.severity / 100) * (1 - shelterReduction * 0.8);
        
        if (effectiveSeverity > 0.2) {
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

  // Temperature-based modifiers
  if (playerCondition.warmth < 40) {
    const coldSeverity = (40 - playerCondition.warmth) / 40;
    const template = coldSeverity > 0.5 
      ? findTemplateByName('Hypothermia Risk')
      : findTemplateByName('Chilled');
    
    if (template) {
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

  // Fatigue from time of day
  if (context.timeOfDay.period === 'late_night' && playerCondition.fatigue > 60) {
    const template = findTemplateByName('Sleep Deprived');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'late_night_fatigue',
        currentTick
      );
      modifier.severity = Math.min(1, playerCondition.fatigue / 100);
      detectedModifiers.push(modifier);
    }
  }

  // Hunger/nutrition modifiers
  if (playerCondition.satiation < 30) {
    const template = playerCondition.satiation < 10 
      ? findTemplateByName('Starving')
      : findTemplateByName('Hungry');
    
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'low_satiation',
        currentTick
      );
      modifier.severity = (30 - playerCondition.satiation) / 30;
      detectedModifiers.push(modifier);
    }
  } else if (playerCondition.satiation > 70) {
    const template = findTemplateByName('Well Fed');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'good_satiation',
        currentTick
      );
      modifier.severity = 0.3;
      detectedModifiers.push(modifier);
    }
  }

  // Hydration modifiers
  if (playerCondition.hydration < 40) {
    const template = findTemplateByName('Dehydrated');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'low_hydration',
        currentTick
      );
      modifier.severity = (40 - playerCondition.hydration) / 40;
      detectedModifiers.push(modifier);
    }
  } else if (playerCondition.hydration > 70) {
    const template = findTemplateByName('Hydrated');
    if (template) {
      const modifier = createModifierFromTemplate(
        template,
        campaignId,
        'player',
        'good_hydration',
        currentTick
      );
      modifier.severity = 0.2;
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
}> = [
  // Injuries
  { patterns: [/\b(bruise[ds]?|bruising)\b/i], modifierName: 'Bruising' },
  { patterns: [/\b(strain(ed)?|pull(ed)? (a )?muscle)\b/i], modifierName: 'Muscle Strain' },
  { patterns: [/\b(cut[s]?|slice[ds]?|nick(ed)?)\b/i, /\bshallow (wound|cut)\b/i], modifierName: 'Shallow Cut' },
  { patterns: [/\b(burn(ed|s)?|scorch(ed)?)\b/i, /\bminor burn\b/i], modifierName: 'Minor Burn' },
  { patterns: [/\b(scrape[ds]?|abrasion)\b/i], modifierName: 'Abrasion' },
  { patterns: [/\bsprain(ed|s)? (your |the )?ankle\b/i, /\btwist(ed)? (your |the )?ankle\b/i], modifierName: 'Sprained Ankle' },
  { patterns: [/\bsprain(ed|s)? (your |the )?wrist\b/i, /\btwist(ed)? (your |the )?wrist\b/i], modifierName: 'Sprained Wrist' },
  { patterns: [/\b(break|broke|broken|fracture[ds]?) (your |the )?(leg|arm|limb|bone)\b/i], modifierName: 'Broken Limb', severityMultiplier: 0.9 },
  { patterns: [/\b(concuss(ed|ion)?|head (injury|trauma))\b/i], modifierName: 'Mild Concussion' },
  { patterns: [/\b(stab(bed)?|pierce[ds]?|impale[ds]?)\b/i], modifierName: 'Laceration', severityMultiplier: 0.7 },
  { patterns: [/\b(shot|bullet|gunshot)\b/i], modifierName: 'Bullet Wound', severityMultiplier: 0.8 },
  { patterns: [/\b(shrapnel|fragment[s]?)\b/i], modifierName: 'Shrapnel Embedded' },
  { patterns: [/\b(infect(ed|ion)?|fester(ing)?)\b/i], modifierName: 'Infection' },
  { patterns: [/\b(shock|traumatic shock)\b/i, /\bgo(es|ing)? into shock\b/i], modifierName: 'Shock' },
  
  // Fatigue
  { patterns: [/\b(winded|out of breath|gasping)\b/i], modifierName: 'Winded' },
  { patterns: [/\b(tired|fatigue[ds]?|weary)\b/i], modifierName: 'Fatigued' },
  { patterns: [/\b(exhaust(ed|ion)?|completely drained)\b/i], modifierName: 'Exhausted' },
  { patterns: [/\b(overexert(ed)?|push(ed)? (too|yourself) (hard|far))\b/i], modifierName: 'Overexerted' },
  { patterns: [/\b(sleep deprive[ds]?|haven't slept|no sleep)\b/i], modifierName: 'Sleep Deprived' },
  { patterns: [/\b(second wind|renewed energy|surge of energy)\b/i], modifierName: 'Second Wind' },
  { patterns: [/\b(well[- ]?rested|fully rested|good night'?s? sleep)\b/i], modifierName: 'Well Rested' },
  
  // Nutrition
  { patterns: [/\b(hungry|hunger|stomach (growl|rumbl))\b/i], modifierName: 'Hungry' },
  { patterns: [/\b(starv(ing|ed)?|famish(ed)?)\b/i], modifierName: 'Starving' },
  { patterns: [/\b(dehydrat(ed|ion)?|parched|thirst(y)?)\b/i], modifierName: 'Dehydrated' },
  { patterns: [/\b(satisf(ied|ying) meal|ate well|full (stomach|belly))\b/i], modifierName: 'Well Fed' },
  
  // Psychological
  { patterns: [/\b(panic(k?(ed|ing))?|terror(ized)?)\b/i], modifierName: 'Panic' },
  { patterns: [/\b(fear(ful)?|afraid|scared|frightened)\b/i], modifierName: 'Fear Triggered' },
  { patterns: [/\b(calm(ed|ing)?|peaceful|serene|tranquil)\b/i], modifierName: 'Calm' },
  { patterns: [/\b(focus(ed)?|concentrate[ds]?|sharp mind)\b/i], modifierName: 'Focused' },
  { patterns: [/\b(determin(ed|ation)|resolv(ed)?|steely resolve)\b/i], modifierName: 'Determined' },
  { patterns: [/\b(inspir(ed|ation|ing))\b/i], modifierName: 'Inspired' },
  { patterns: [/\b(guilt(y)?|remorse(ful)?|ashamed)\b/i], modifierName: 'Guilt' },
  { patterns: [/\b(stress(ed)?|overwhelm(ed)?|burden(ed)?)\b/i], modifierName: 'Stress Overload' },
  { patterns: [/\b(flashback|ptsd|trauma trigger)\b/i], modifierName: 'PTSD Response' },
  
  // Illness
  { patterns: [/\b(fever(ish)?|burning up|high temperature)\b/i], modifierName: 'Fever' },
  { patterns: [/\b(food poison(ing|ed)?|sick from (the )?food)\b/i], modifierName: 'Food Poisoning' },
  { patterns: [/\b(nause(a|ous)|sick to (your |the )?stomach|queasy)\b/i], modifierName: 'Nausea' },
  
  // Chemical/Medical
  { patterns: [/\b(painkiller|pain (med(ication)?|relief)|(took|take) (some )?medicine)\b/i], modifierName: 'Pain Suppression' },
  { patterns: [/\b(stimulant|caffeine|energy (drink|boost)|adrenaline (shot|rush))\b/i], modifierName: 'Stimulant Effect' },
  { patterns: [/\b(drunk|intoxicat(ed)?|inebriat(ed)?)\b/i], modifierName: 'Intoxicated' },
  { patterns: [/\b(withdraw(al|ing)?|craving|need (a|the) (fix|hit|dose))\b/i], modifierName: 'Withdrawal' },
];

export interface NarrativeModifierResult {
  modifier: Modifier;
  matchedText: string;
  confidence: number;
}

/**
 * Parse narrative text for implied modifiers
 */
export function parseNarrativeForModifiers(
  narrativeText: string,
  campaignId: string,
  currentTick: number
): NarrativeModifierResult[] {
  const results: NarrativeModifierResult[] = [];
  const foundModifiers = new Set<string>(); // Prevent duplicates

  for (const { patterns, modifierName, severityMultiplier = 1 } of NARRATIVE_MODIFIER_PATTERNS) {
    for (const pattern of patterns) {
      try {
        const match = narrativeText.match(pattern);
        if (match && !foundModifiers.has(modifierName)) {
          foundModifiers.add(modifierName);
          
          const template = findTemplateByName(modifierName);
          if (template) {
            const modifier = createModifierFromTemplate(
              template,
              campaignId,
              'player',
              `narrative_${match[0].toLowerCase().replace(/\s+/g, '_')}`,
              currentTick
            );
            
            // Adjust severity based on context words
            let contextSeverity = template.baseSeverity * severityMultiplier;
            
            // Intensity modifiers in text
            if (/\b(severe(ly)?|serious(ly)?|bad(ly)?|terrible|horrible)\b/i.test(narrativeText)) {
              contextSeverity = Math.min(1, contextSeverity * 1.5);
            }
            if (/\b(slight(ly)?|minor|mild(ly)?|barely|little)\b/i.test(narrativeText)) {
              contextSeverity = contextSeverity * 0.5;
            }
            
            modifier.severity = contextSeverity;
            
            results.push({
              modifier,
              matchedText: match[0],
              confidence: 0.8, // High confidence for explicit matches
            });
          }
          break; // Only match first pattern for each modifier
        }
      } catch (e) {
        console.warn(`Failed to parse narrative for modifier: ${modifierName}`, e);
      }
    }
  }

  return results;
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
  processNarrative(narrativeText: string): NarrativeModifierResult[] {
    try {
      if (!this.config.narrativeParsingEnabled || !narrativeText) return [];

      const results = parseNarrativeForModifiers(
        narrativeText,
        this.campaignId,
        this.currentTick
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
