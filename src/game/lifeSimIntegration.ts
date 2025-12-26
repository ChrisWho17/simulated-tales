// Life Sim Integration - Connects Phase 9 systems to core game engine
// Phase 9.16

import { GameState } from '@/types/game';
import {
  LifeSimPlayerState,
  PlayerNeeds,
  ContentSettings,
  TensionState,
  createDefaultPlayerNeeds,
  createDefaultTensionState,
  createDefaultBodyAttributes,
  createDefaultOutfit,
  createDefaultPlayerSkills,
  createDefaultEconomyState,
  createDefaultHomeState,
  createDefaultContentSettings,
} from '@/types/lifeSim';
import { processNeedDecay, generateNeedProse, checkDesperation, calculateVisibleNeedState } from './needsSystem';
import { processBodyTick, calculateExposureEffects, getExposureLevel } from './bodyClothingSystem';

// ============= EXTENDED GAME STATE =============

export interface LifeSimGameState extends GameState {
  lifeSim: LifeSimPlayerState;
}

// ============= INITIALIZATION =============

export function initializeLifeSimState(): LifeSimPlayerState {
  return {
    needs: createDefaultPlayerNeeds(),
    body: createDefaultBodyAttributes(),
    outfit: createDefaultOutfit(),
    tension: createDefaultTensionState(),
    skills: createDefaultPlayerSkills(),
    economy: createDefaultEconomyState(),
    home: createDefaultHomeState(),
    job: null,
    jobHistory: [],
    reputation: {},
    contentSettings: createDefaultContentSettings(),
    consequence: null,
  };
}

// ============= TICK PROCESSING =============

export interface LifeSimTickResult {
  updatedState: LifeSimPlayerState;
  proseDescriptions: string[];
  events: string[];
  desperationUnlocks: string[];
}

export function processLifeSimTick(state: LifeSimPlayerState, hours: number = 1, activities: string[] = []): LifeSimTickResult {
  const events: string[] = [];
  let updatedState = { ...state };
  
  // 1. Process need decay
  const activityModifiers: Record<string, number> = {};
  if (activities.includes('physical_work')) {
    activityModifiers.energy = -5;
    activityModifiers.hunger = -3;
    activityModifiers.hygiene = -5;
  }
  if (activities.includes('social')) {
    activityModifiers.social = 10;
    activityModifiers.stress = 5;
  }
  
  updatedState.needs = processNeedDecay(state.needs, hours, activityModifiers);
  
  // 2. Process tension decay
  updatedState.tension = {
    ...state.tension,
    current: Math.max(0, state.tension.current - state.tension.baselineRecovery * hours),
  };
  
  // 3. Process body changes
  const bodyResult = processBodyTick(state.body, hours, activities);
  updatedState.body = bodyResult.body;
  
  // 4. Process economy (rent, income, expenses)
  if (state.economy.housing !== 'homeless' && state.economy.housing !== 'owns_home') {
    // Check if rent is due
    // This would be tick-based in full implementation
  }
  
  // 5. Check for desperation
  const desperation = checkDesperation(updatedState.needs);
  
  // 6. Generate prose descriptions
  const proseDescriptions = generateNeedProse(updatedState.needs);
  
  // 7. Check for critical events
  if (updatedState.needs.physical.health <= 10) {
    events.push('CRITICAL: Health is dangerously low!');
  }
  if (updatedState.needs.physical.hunger <= 10) {
    events.push('You are starving.');
  }
  if (updatedState.needs.psychological.stress >= 90) {
    events.push('You are on the verge of a breakdown.');
  }
  
  return {
    updatedState,
    proseDescriptions,
    events,
    desperationUnlocks: desperation.unlockedOptions,
  };
}

// ============= TENSION SYSTEM =============

export function getTensionLevel(tension: TensionState): string {
  if (tension.current >= tension.overwhelmingAt) return 'overwhelming';
  if (tension.current >= tension.intenseAt) return 'intense';
  if (tension.current >= tension.noticeableAt) return 'noticeable';
  if (tension.current >= tension.distractedAt) return 'distracted';
  return 'calm';
}

export function addTension(state: LifeSimPlayerState, amount: number, source: string): LifeSimPlayerState {
  const sensitivityMultiplier = state.tension.sensitivity / 50;
  const adjustedAmount = amount * sensitivityMultiplier;
  
  return {
    ...state,
    tension: {
      ...state.tension,
      current: Math.min(100, state.tension.current + adjustedAmount),
    },
  };
}

export function releaseTension(state: LifeSimPlayerState, amount: number): LifeSimPlayerState {
  return {
    ...state,
    tension: {
      ...state.tension,
      current: Math.max(0, state.tension.current - amount),
    },
  };
}

// ============= SKILL SYSTEM =============

export function improveSkill(state: LifeSimPlayerState, category: string, skill: string, amount: number): LifeSimPlayerState {
  const skills = { ...state.skills };
  
  if (category in skills && skill in (skills as any)[category]) {
    (skills as any)[category][skill] = Math.min(100, (skills as any)[category][skill] + amount);
  }
  
  return { ...state, skills };
}

export function getSkillLevel(state: LifeSimPlayerState, category: string, skill: string): number {
  if (category in state.skills && skill in (state.skills as any)[category]) {
    return (state.skills as any)[category][skill];
  }
  return 0;
}

// ============= REPUTATION SYSTEM =============

export function modifyReputation(state: LifeSimPlayerState, locationId: string, axis: string, change: number): LifeSimPlayerState {
  const reputation = { ...state.reputation };
  
  if (!reputation[locationId]) {
    reputation[locationId] = {
      locationId,
      tier: 'unknown',
      axes: { romantic: 0, social: 0, moral: 0, danger: 0, wealth: 0 },
      events: [],
    };
  }
  
  const axes = { ...reputation[locationId].axes };
  if (axis in axes) {
    (axes as any)[axis] = Math.max(-100, Math.min(100, (axes as any)[axis] + change));
  }
  
  reputation[locationId] = { ...reputation[locationId], axes };
  
  // Update tier based on event count
  const eventCount = reputation[locationId].events.length;
  if (eventCount >= 20) reputation[locationId].tier = 'notorious';
  else if (eventCount >= 10) reputation[locationId].tier = 'famous';
  else if (eventCount >= 5) reputation[locationId].tier = 'known';
  else if (eventCount >= 2) reputation[locationId].tier = 'noticed';
  
  return { ...state, reputation };
}

// ============= NPC INTERACTION MODIFIERS =============

export function calculateNPCInteractionModifiers(state: LifeSimPlayerState): Record<string, number> {
  const modifiers: Record<string, number> = {};
  
  // Body effects
  const visibleNeeds = calculateVisibleNeedState(state.needs);
  modifiers.needState = visibleNeeds.npcReactionModifier;
  
  // Exposure effects
  const exposureEffects = calculateExposureEffects(state.outfit);
  modifiers.exposure = exposureEffects.npcAttentionModifier;
  modifiers.vulnerability = exposureEffects.vulnerabilityModifier;
  
  // Tension effects
  const tensionLevel = getTensionLevel(state.tension);
  if (tensionLevel === 'noticeable' || tensionLevel === 'intense' || tensionLevel === 'overwhelming') {
    modifiers.tension = 10; // Some NPCs notice
  }
  
  // Attractiveness
  modifiers.attractiveness = (state.body.attractiveness - 50) / 5;
  
  // Cleanliness
  modifiers.hygiene = (state.body.cleanliness - 50) / 5;
  
  return modifiers;
}

// ============= CONTENT SETTINGS =============

export function updateContentSettings(state: LifeSimPlayerState, settings: Partial<ContentSettings>): LifeSimPlayerState {
  return {
    ...state,
    contentSettings: {
      ...state.contentSettings,
      ...settings,
    },
  };
}

// ============= PROSE GENERATION HELPERS =============

export function generateLifeSimStatusProse(state: LifeSimPlayerState): string[] {
  const prose: string[] = [];
  
  // Need prose
  prose.push(...generateNeedProse(state.needs));
  
  // Tension prose
  const tensionLevel = getTensionLevel(state.tension);
  if (tensionLevel === 'intense') {
    prose.push('A persistent distraction clouds your thoughts.');
  } else if (tensionLevel === 'overwhelming') {
    prose.push('It is almost impossible to focus on anything else.');
  }
  
  // Exposure prose
  const exposure = getExposureLevel(state.outfit);
  if (exposure === 'minimally_covered') {
    prose.push('You are acutely aware of how little you are wearing.');
  } else if (exposure === 'unclothed') {
    prose.push('The air against your bare skin reminds you of your vulnerability.');
  }
  
  return prose;
}

// ============= AI CONTEXT BUILDER =============

export interface LifeSimAIContext {
  needsStatus: string;
  careerStatus: string;
  socialStatus: string;
  housingStatus: string;
  moodModifiers: string[];
}

export function buildLifeSimContext(state: LifeSimPlayerState): LifeSimAIContext {
  // Build needs status
  const needDescriptions: string[] = [];
  
  // Physical needs
  const physical = state.needs.physical;
  if (physical.hunger <= 30) needDescriptions.push(`Hunger: ${physical.hunger}% (${physical.hunger <= 15 ? 'STARVING' : 'very hungry'})`);
  if (physical.energy <= 30) needDescriptions.push(`Energy: ${physical.energy}% (${physical.energy <= 15 ? 'EXHAUSTED' : 'tired'})`);
  if (physical.hygiene <= 40) needDescriptions.push(`Hygiene: ${physical.hygiene}% (${physical.hygiene <= 20 ? 'FILTHY' : 'unkempt'})`);
  if (physical.bladder <= 30) needDescriptions.push(`Bladder: ${physical.bladder}% (${physical.bladder <= 15 ? 'DESPERATE' : 'uncomfortable'})`);
  
  // Psychological needs
  const psych = state.needs.psychological;
  if (psych.social <= 40) needDescriptions.push(`Social: ${psych.social}% (${psych.social <= 20 ? 'LONELY' : 'isolated'})`);
  if (psych.fulfillment <= 40) needDescriptions.push(`Fulfillment: ${psych.fulfillment}% (${psych.fulfillment <= 20 ? 'BORED OUT OF MIND' : 'restless'})`);
  if (psych.stress >= 60) needDescriptions.push(`Stress: ${psych.stress}% (${psych.stress >= 80 ? 'OVERWHELMED' : 'anxious'})`);
  if (psych.comfort <= 40) needDescriptions.push(`Comfort: ${psych.comfort}% (${psych.comfort <= 20 ? 'MISERABLE' : 'uncomfortable'})`);
  
  const needsStatus = needDescriptions.length > 0 
    ? `NEEDS REQUIRING ATTENTION:\n${needDescriptions.join('\n')}`
    : 'All needs are currently satisfied.';
  
  // Build career status
  let careerStatus = 'CAREER: Unemployed - looking for opportunities';
  if (state.job) {
    const scheduleType = state.job.schedule?.days?.length && state.job.schedule.days.length < 5 ? 'Part-time' : 'Full-time';
    careerStatus = `CAREER: ${state.job.title} at ${state.job.employer || 'company'}
Performance: ${state.job.performance}/100
Schedule: ${scheduleType}`;
  }
  
  // Build social status
  const reputationEntries = Object.entries(state.reputation);
  let socialStatus = 'SOCIAL STANDING: Unknown in all areas';
  if (reputationEntries.length > 0) {
    const socialDescriptions = reputationEntries.map(([locationId, rep]) => 
      `${locationId}: ${rep.tier} (Social: ${rep.axes.social}, Romantic: ${rep.axes.romantic})`
    );
    socialStatus = `SOCIAL STANDING:\n${socialDescriptions.join('\n')}`;
  }
  
  // Build housing status
  let housingStatus = 'HOUSING: Homeless';
  const housing = state.economy.housing;
  if (housing === 'owns_home') {
    housingStatus = 'HOUSING: Owns home - stable living situation';
  } else if (housing === 'renting_apartment' || housing === 'renting_room') {
    housingStatus = `HOUSING: ${housing === 'renting_apartment' ? 'Renting apartment' : 'Renting room'} - $${state.economy.rent}/month, $${state.economy.money} available`;
  } else if (housing === 'shelter') {
    housingStatus = 'HOUSING: Living in a shelter - temporary situation';
  }
  
  // Build mood modifiers based on needs
  const moodModifiers: string[] = [];
  
  if (physical.hunger <= 20) moodModifiers.push('Irritable from hunger - snappy responses, difficulty concentrating');
  if (physical.energy <= 20) moodModifiers.push('Sluggish and unfocused - yawning, making mistakes');
  if (psych.social <= 25) moodModifiers.push('Craving connection - eager to talk, maybe too eager');
  if (psych.fulfillment <= 25) moodModifiers.push('Desperate for entertainment - easily distracted, impulsive');
  if (psych.stress >= 75) moodModifiers.push('Anxiety-ridden - nervous habits, overthinking everything');
  if (physical.hygiene <= 25) moodModifiers.push('Self-conscious about appearance - avoiding close contact');
  if (physical.bladder <= 20) moodModifiers.push('Urgent bathroom need - distracted, fidgeting');
  
  // Positive modifiers
  if (physical.hunger >= 80 && physical.energy >= 80) moodModifiers.push('Well-rested and fed - sharp and energetic');
  if (psych.social >= 80) moodModifiers.push('Socially fulfilled - confident in interactions');
  if (psych.fulfillment >= 80 && psych.stress <= 30) moodModifiers.push('Relaxed and content - easygoing demeanor');
  
  return {
    needsStatus,
    careerStatus,
    socialStatus,
    housingStatus,
    moodModifiers,
  };
}
