// Body & Clothing System - Physical attributes and exposure mechanics
// Phase 9.2 & 9.3

import {
  BodyAttributes,
  BodyMark,
  BodyInjury,
  BodyScar,
  BodyType,
  ClothingItem,
  ClothingSlot,
  Outfit,
  ExposureLevel,
  createDefaultBodyAttributes,
  createDefaultOutfit,
} from '@/types/lifeSim';

// ============= BODY ATTRIBUTE EFFECTS =============

export interface BodyEffects {
  attractionModifier: number;
  physicalTaskModifier: number;
  socialModifier: number;
  clothingOptions: string[];  // body types that limit options
}

export function calculateBodyEffects(body: BodyAttributes): BodyEffects {
  let attractionModifier = 0;
  let physicalTaskModifier = 0;
  let socialModifier = 0;
  const clothingLimitations: string[] = [];
  
  // Attractiveness direct effect
  attractionModifier += (body.attractiveness - 50) / 2; // -25 to +25
  
  // Fitness affects physical tasks
  physicalTaskModifier += (body.fitness - 50) / 2;
  
  // Body type effects
  switch (body.bodyType) {
    case 'athletic':
      physicalTaskModifier += 15;
      attractionModifier += 10;
      break;
    case 'slim':
      physicalTaskModifier -= 5;
      break;
    case 'heavy':
      physicalTaskModifier += 5; // strength
      clothingLimitations.push('limited_fashion');
      break;
    case 'curvy':
      attractionModifier += 5; // preference-dependent in full system
      break;
  }
  
  // Grooming affects social
  socialModifier += (body.grooming - 50) / 5; // -10 to +10
  
  // Cleanliness affects social strongly
  if (body.cleanliness < 30) {
    socialModifier -= 30;
  } else if (body.cleanliness < 50) {
    socialModifier -= 15;
  } else if (body.cleanliness > 80) {
    socialModifier += 10;
  }
  
  // Visible fatigue and distress
  if (body.visibleFatigue) {
    attractionModifier -= 10;
    socialModifier -= 5;
  }
  
  if (body.visibleDistress) {
    socialModifier -= 10;
  }
  
  // Injuries affect appearance
  const visibleInjuries = body.injuries.filter(i => 
    ['face', 'hands', 'arms', 'neck'].includes(i.location)
  );
  if (visibleInjuries.length > 0) {
    const totalSeverity = visibleInjuries.reduce((sum, i) => sum + i.severity, 0);
    attractionModifier -= Math.min(30, totalSeverity / 3);
    socialModifier -= Math.min(20, totalSeverity / 5);
  }
  
  // Scars can add character or detract
  const facialScars = body.scars.filter(s => s.location === 'face');
  if (facialScars.length > 0) {
    socialModifier += 5; // intimidating or intriguing
  }
  
  return {
    attractionModifier: Math.round(attractionModifier),
    physicalTaskModifier: Math.round(physicalTaskModifier),
    socialModifier: Math.round(socialModifier),
    clothingOptions: clothingLimitations,
  };
}

// ============= BODY CHANGES OVER TIME =============

export interface BodyChange {
  attribute: keyof BodyAttributes | string;
  change: number | string;
  reason: string;
}

export function processBodyTick(body: BodyAttributes, hours: number, activities: string[]): { body: BodyAttributes; changes: BodyChange[] } {
  const changes: BodyChange[] = [];
  let updated = { ...body };
  
  // Fitness changes with activity/inactivity
  if (activities.includes('exercise') || activities.includes('physical_work')) {
    updated.fitness = Math.min(100, updated.fitness + 0.5 * hours);
    changes.push({ attribute: 'fitness', change: 0.5 * hours, reason: 'Physical activity' });
  } else if (activities.includes('rest') || activities.includes('idle')) {
    updated.fitness = Math.max(0, updated.fitness - 0.1 * hours);
    if (hours >= 24) {
      changes.push({ attribute: 'fitness', change: -0.1 * hours, reason: 'Inactivity' });
    }
  }
  
  // Hair grows slowly
  if (hours >= 168) { // weekly
    const hairGrowth: Record<string, string> = {
      'shaved': 'short',
      'short': 'medium',
      'medium': 'long',
      'long': 'very_long',
    };
    if (hairGrowth[updated.hairLength] && Math.random() < 0.3) {
      updated.hairLength = hairGrowth[updated.hairLength] as BodyAttributes['hairLength'];
      changes.push({ attribute: 'hairLength', change: updated.hairLength, reason: 'Natural growth' });
    }
  }
  
  // Marks heal over time
  updated.marks = updated.marks.map(mark => ({
    ...mark,
    duration: mark.duration > 0 ? mark.duration - hours : mark.duration,
  })).filter(mark => mark.duration !== 0);
  
  // Injuries heal
  updated.injuries = updated.injuries.map(injury => ({
    ...injury,
    age: injury.age + hours,
    severity: Math.max(0, injury.severity - (hours / 24) * 2), // ~2 severity per day
  })).filter(injury => injury.severity > 0);
  
  if (updated.injuries.length < body.injuries.length) {
    changes.push({ attribute: 'injuries', change: 'healed', reason: 'Time passing' });
  }
  
  // Cleanliness drops
  let cleanlinessLoss = 1 * hours;
  if (activities.includes('exercise') || activities.includes('physical_work')) {
    cleanlinessLoss += 5 * hours;
  }
  updated.cleanliness = Math.max(0, updated.cleanliness - cleanlinessLoss / 24);
  
  // Grooming drops very slowly
  updated.grooming = Math.max(0, updated.grooming - 0.5 * (hours / 24));
  
  // Update visible states
  updated.visibleFatigue = false; // Reset, should be set by needs system
  updated.visibleDistress = false;
  
  return { body: updated, changes };
}

// ============= INJURY & MARK MANAGEMENT =============

export function addInjury(body: BodyAttributes, location: string, severity: number, description?: string): BodyAttributes {
  const injury: BodyInjury = {
    location,
    severity: Math.min(100, severity),
    age: 0,
    description,
  };
  
  return {
    ...body,
    injuries: [...body.injuries, injury],
  };
}

export function addMark(body: BodyAttributes, location: string, type: string, duration: number): BodyAttributes {
  const mark: BodyMark = {
    location,
    type,
    duration,
  };
  
  return {
    ...body,
    marks: [...body.marks, mark],
  };
}

export function addScar(body: BodyAttributes, location: string, description: string, origin: string): BodyAttributes {
  const scar: BodyScar = {
    location,
    description,
    origin,
  };
  
  return {
    ...body,
    scars: [...body.scars, scar],
  };
}

export function healInjury(body: BodyAttributes, injuryIndex: number): BodyAttributes {
  return {
    ...body,
    injuries: body.injuries.filter((_, i) => i !== injuryIndex),
  };
}

// ============= CLOTHING SYSTEM =============

export function calculateCoverage(outfit: Outfit): number {
  const slotWeights: Record<ClothingSlot, number> = {
    head: 5,
    face: 5,
    neck: 3,
    upper_body: 25,
    lower_body: 25,
    underwear_top: 10,
    underwear_bottom: 10,
    legs: 10,
    feet: 5,
    hands: 2,
    accessories: 0,
  };
  
  let totalCoverage = 0;
  let totalWeight = 0;
  
  for (const [slot, weight] of Object.entries(slotWeights)) {
    totalWeight += weight;
    const item = outfit.slots[slot as ClothingSlot];
    if (item) {
      totalCoverage += (item.coverage * item.opacity / 100) * weight / 100;
    }
  }
  
  return Math.round((totalCoverage / totalWeight) * 100);
}

export function getExposureLevel(outfit: Outfit): ExposureLevel {
  const coverage = calculateCoverage(outfit);
  
  if (coverage >= 70) return 'fully_clothed';
  if (coverage >= 40) return 'partially_covered';
  if (coverage >= 15) return 'minimally_covered';
  return 'unclothed';
}

export function calculateProvocativeness(outfit: Outfit): number {
  let totalProv = 0;
  let itemCount = 0;
  
  for (const item of Object.values(outfit.slots)) {
    if (item) {
      totalProv += item.provocativeness;
      itemCount++;
    }
  }
  
  // Base provocativeness plus exposure bonus
  const baseProv = itemCount > 0 ? totalProv / itemCount : 0;
  const exposureBonus = (100 - calculateCoverage(outfit)) * 0.5;
  
  return Math.min(100, Math.round(baseProv + exposureBonus));
}

export function calculateWarmth(outfit: Outfit): number {
  let totalWarmth = 0;
  
  for (const item of Object.values(outfit.slots)) {
    if (item) {
      totalWarmth += item.warmth;
    }
  }
  
  return Math.min(100, totalWarmth);
}

export function calculateProtection(outfit: Outfit): number {
  let totalProtection = 0;
  
  for (const item of Object.values(outfit.slots)) {
    if (item) {
      totalProtection += item.protection;
    }
  }
  
  return Math.min(100, totalProtection);
}

// ============= OUTFIT MANAGEMENT =============

export function equipItem(outfit: Outfit, item: ClothingItem): Outfit {
  const newOutfit = { ...outfit, slots: { ...outfit.slots } };
  
  // Equip to all slots the item uses
  for (const slot of item.slots) {
    newOutfit.slots[slot as ClothingSlot] = item;
  }
  
  return newOutfit;
}

export function removeItem(outfit: Outfit, slot: ClothingSlot): { outfit: Outfit; removedItem: ClothingItem | null } {
  const removedItem = outfit.slots[slot];
  const newOutfit = { ...outfit, slots: { ...outfit.slots } };
  
  if (removedItem) {
    // Remove from all slots this item occupies
    for (const itemSlot of removedItem.slots) {
      newOutfit.slots[itemSlot as ClothingSlot] = null;
    }
  }
  
  return { outfit: newOutfit, removedItem };
}

export function damageClothing(outfit: Outfit, slot: ClothingSlot, damage: number): Outfit {
  const item = outfit.slots[slot];
  if (!item) return outfit;
  
  const damagedItem: ClothingItem = {
    ...item,
    condition: Math.max(0, item.condition - damage),
    damaged: item.condition - damage < 30,
  };
  
  return equipItem(outfit, damagedItem);
}

export function wetClothing(outfit: Outfit): Outfit {
  const newOutfit = { ...outfit, slots: { ...outfit.slots } };
  
  for (const [slot, item] of Object.entries(newOutfit.slots)) {
    if (item) {
      newOutfit.slots[slot as ClothingSlot] = { ...item, wet: true };
    }
  }
  
  return newOutfit;
}

export function dirtyClothing(outfit: Outfit, slots?: ClothingSlot[]): Outfit {
  const newOutfit = { ...outfit, slots: { ...outfit.slots } };
  
  const targetSlots = slots || Object.keys(newOutfit.slots) as ClothingSlot[];
  
  for (const slot of targetSlots) {
    const item = newOutfit.slots[slot];
    if (item) {
      newOutfit.slots[slot] = { ...item, dirty: true };
    }
  }
  
  return newOutfit;
}

// ============= EXPOSURE EFFECTS =============

export interface ExposureEffects {
  npcAttentionModifier: number;
  vulnerabilityModifier: number;
  confidenceModifier: number;
  locationRestrictions: string[];
}

export function calculateExposureEffects(outfit: Outfit, location?: string): ExposureEffects {
  const exposure = getExposureLevel(outfit);
  const provocativeness = calculateProvocativeness(outfit);
  
  const effects: ExposureEffects = {
    npcAttentionModifier: 0,
    vulnerabilityModifier: 0,
    confidenceModifier: 0,
    locationRestrictions: [],
  };
  
  switch (exposure) {
    case 'fully_clothed':
      effects.confidenceModifier = 10;
      break;
    case 'partially_covered':
      effects.npcAttentionModifier = 20;
      effects.vulnerabilityModifier = 10;
      effects.locationRestrictions = ['formal_venue', 'temple', 'court'];
      break;
    case 'minimally_covered':
      effects.npcAttentionModifier = 50;
      effects.vulnerabilityModifier = 30;
      effects.confidenceModifier = -20;
      effects.locationRestrictions = ['public_street', 'market', 'tavern_main', 'formal_venue', 'temple', 'court'];
      break;
    case 'unclothed':
      effects.npcAttentionModifier = 100;
      effects.vulnerabilityModifier = 50;
      effects.confidenceModifier = -40;
      effects.locationRestrictions = ['public_street', 'market', 'tavern_main', 'tavern_kitchen', 'formal_venue', 'temple', 'court', 'shop'];
      break;
  }
  
  // High provocativeness adds attention
  effects.npcAttentionModifier += provocativeness / 4;
  
  return effects;
}

// ============= CLOTHING CONDITION =============

export function getOutfitFormality(outfit: Outfit): string {
  const formalityOrder = ['underwear', 'casual', 'nice', 'formal', 'work_specific'];
  let highestFormality = 0;
  
  for (const item of Object.values(outfit.slots)) {
    if (item) {
      const formalityIndex = formalityOrder.indexOf(item.formality);
      if (formalityIndex > highestFormality) {
        highestFormality = formalityIndex;
      }
    }
  }
  
  // Check for coverage - underwear only doesn't count as formal
  const coverage = calculateCoverage(outfit);
  if (coverage < 50) {
    return 'underdressed';
  }
  
  return formalityOrder[highestFormality];
}

export function meetsLocationDresscode(outfit: Outfit, requiredFormality: string): boolean {
  const currentFormality = getOutfitFormality(outfit);
  const formalityOrder = ['underwear', 'casual', 'nice', 'formal', 'work_specific'];
  
  return formalityOrder.indexOf(currentFormality) >= formalityOrder.indexOf(requiredFormality);
}

// ============= BODY DESCRIPTION GENERATION =============

export function generateBodyDescription(body: BodyAttributes, detailLevel: 'minimal' | 'moderate' | 'detailed'): string {
  const parts: string[] = [];
  
  // Basic description
  if (detailLevel !== 'minimal') {
    parts.push(`A ${body.bodyType} figure standing about ${body.height}cm tall.`);
  }
  
  // Hair and eyes
  parts.push(`${body.hairLength.replace('_', ' ')} ${body.hairColor} hair and ${body.eyeColor} eyes.`);
  
  if (detailLevel === 'detailed') {
    // Distinctive features
    if (body.distinctiveFeatures.length > 0) {
      parts.push(`Notable features: ${body.distinctiveFeatures.join(', ')}.`);
    }
    
    // Scars
    if (body.scars.length > 0) {
      const scarDesc = body.scars.map(s => `a scar on ${s.location}`).join(', ');
      parts.push(`Bears ${scarDesc}.`);
    }
    
    // Current marks
    if (body.marks.length > 0) {
      const markDesc = body.marks.map(m => `${m.type} on ${m.location}`).join(', ');
      parts.push(`Currently has ${markDesc}.`);
    }
    
    // Injuries
    if (body.injuries.length > 0) {
      const injuryDesc = body.injuries.filter(i => i.severity > 30).map(i => 
        `${i.severity > 60 ? 'serious' : 'visible'} injury on ${i.location}`
      ).join(', ');
      if (injuryDesc) {
        parts.push(`Shows ${injuryDesc}.`);
      }
    }
  }
  
  // Condition
  if (body.cleanliness < 30) {
    parts.push('Appears disheveled and unwashed.');
  } else if (body.cleanliness < 50) {
    parts.push('Could use a bath.');
  }
  
  if (body.visibleFatigue) {
    parts.push('Dark circles under the eyes betray exhaustion.');
  }
  
  if (body.visibleDistress) {
    parts.push('Signs of distress are evident in their bearing.');
  }
  
  return parts.join(' ');
}

export function generateOutfitDescription(outfit: Outfit): string {
  const wornItems: string[] = [];
  
  // Describe visible items
  const visibleSlots: ClothingSlot[] = ['upper_body', 'lower_body', 'feet', 'head', 'accessories'];
  
  for (const slot of visibleSlots) {
    const item = outfit.slots[slot];
    if (item) {
      let desc = item.name;
      if (item.dirty) desc += ' (stained)';
      if (item.wet) desc += ' (wet)';
      if (item.damaged) desc += ' (damaged)';
      wornItems.push(desc);
    }
  }
  
  if (wornItems.length === 0) {
    return 'Wearing nothing at all.';
  }
  
  const exposure = getExposureLevel(outfit);
  let prefix = '';
  
  switch (exposure) {
    case 'partially_covered':
      prefix = 'Barely dressed in ';
      break;
    case 'minimally_covered':
      prefix = 'Wearing only ';
      break;
    case 'unclothed':
      return 'Completely unclothed.';
    default:
      prefix = 'Dressed in ';
  }
  
  return prefix + wornItems.join(', ') + '.';
}
