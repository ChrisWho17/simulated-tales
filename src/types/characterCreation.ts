// Character Creation Types - Tiered Detail Levels + Legacy Types

// ========== NEW TIERED SYSTEM ==========
export type DetailLevel = 'simple' | 'detailed' | 'all';
export type Gender = 'male' | 'female' | 'other';

export interface SimpleAppearance {
  gender: Gender;
  height: 'short' | 'average' | 'tall' | 'very tall';
  build: 'slim' | 'average' | 'athletic' | 'muscular' | 'heavyset' | 'curvy';
}

export interface DetailedAppearance {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
  distinguishingFeatures: string[];
  accessories: string[];
}

export interface FullAppearance {
  bustSize?: 'small' | 'medium' | 'large' | 'very large';
  hipWidth?: 'narrow' | 'average' | 'wide' | 'very wide';
  muscleDefinition?: 'none' | 'toned' | 'defined' | 'very muscular';
  bodyHair?: 'none' | 'light' | 'moderate' | 'heavy';
  intimateDetails?: string;
  isHermaphrodite?: boolean;
}

export interface TieredAppearance {
  detailLevel: DetailLevel;
  simple: SimpleAppearance;
  detailed?: DetailedAppearance;
  full?: FullAppearance;
}

export const HEIGHT_OPTIONS = [
  { value: 'short', label: 'Short', description: 'Under 5\'4"' },
  { value: 'average', label: 'Average', description: '5\'4" - 5\'9"' },
  { value: 'tall', label: 'Tall', description: '5\'10" - 6\'2"' },
  { value: 'very tall', label: 'Very Tall', description: 'Over 6\'2"' },
];

export const BUILD_OPTIONS = [
  { value: 'slim', label: 'Slim' },
  { value: 'average', label: 'Average' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'muscular', label: 'Muscular' },
  { value: 'heavyset', label: 'Heavyset' },
  { value: 'curvy', label: 'Curvy' },
];

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const SKIN_TONES = ['Porcelain', 'Ivory', 'Fair', 'Light', 'Medium', 'Olive', 'Tan', 'Caramel', 'Brown', 'Dark Brown', 'Ebony', 'Pale Blue', 'Green', 'Purple', 'Gray', 'Silver'];
export const HAIR_STYLES = ['Bald', 'Buzz Cut', 'Short', 'Medium', 'Long', 'Very Long', 'Ponytail', 'Braided', 'Dreadlocks', 'Mohawk', 'Undercut', 'Curly', 'Wavy', 'Afro', 'Bun', 'Spiky', 'Messy'];
export const HAIR_COLORS = ['Black', 'Dark Brown', 'Brown', 'Light Brown', 'Auburn', 'Red', 'Blonde', 'Platinum Blonde', 'White', 'Gray', 'Blue', 'Purple', 'Pink', 'Green', 'Silver'];
export const EYE_COLORS = ['Brown', 'Dark Brown', 'Hazel', 'Amber', 'Green', 'Blue', 'Gray', 'Violet', 'Heterochromia', 'Red', 'Golden', 'Silver'];
export const FACE_SHAPES = [{ value: 'oval', label: 'Oval' }, { value: 'round', label: 'Round' }, { value: 'square', label: 'Square' }, { value: 'heart', label: 'Heart' }, { value: 'oblong', label: 'Oblong' }, { value: 'diamond', label: 'Diamond' }];
export const DISTINGUISHING_FEATURES = ['Facial scar', 'Body scar', 'Neck tattoo', 'Face tattoo', 'Arm tattoos', 'Full sleeve', 'Ear piercings', 'Nose piercing', 'Lip piercing', 'Freckles', 'Dimples', 'Beauty mark', 'Eyepatch', 'Burn scars'];
export const ACCESSORIES = ['Glasses', 'Sunglasses', 'Earrings', 'Necklace', 'Choker', 'Ring', 'Bracelet', 'Watch', 'Hat', 'Bandana', 'Headband', 'Circlet', 'Eyepatch', 'Mask', 'Goggles'];
export const BUST_OPTIONS = [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'very large', label: 'Very Large' }];
export const HIP_OPTIONS = [{ value: 'narrow', label: 'Narrow' }, { value: 'average', label: 'Average' }, { value: 'wide', label: 'Wide' }, { value: 'very wide', label: 'Very Wide' }];
export const MUSCLE_OPTIONS = [{ value: 'none', label: 'Soft' }, { value: 'toned', label: 'Toned' }, { value: 'defined', label: 'Defined' }, { value: 'very muscular', label: 'Very Muscular' }];
export const BODY_HAIR_OPTIONS = [{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'moderate', label: 'Moderate' }, { value: 'heavy', label: 'Heavy' }];

export function formatAppearanceForAI(appearance: TieredAppearance, genre: string): string {
  const { simple, detailed, full, detailLevel } = appearance;
  let genderDesc = simple.gender === 'other' && full?.isHermaphrodite ? 'hermaphrodite' : simple.gender === 'other' ? 'androgynous' : simple.gender;
  let description = `${genderDesc}, ${simple.height} height, ${simple.build} build`;
  if ((detailLevel === 'detailed' || detailLevel === 'all') && detailed) {
    description += `, ${detailed.skinTone} skin, ${detailed.hairStyle} ${detailed.hairColor} hair, ${detailed.eyeColor} eyes`;
    if (detailed.distinguishingFeatures?.length) description += `, with ${detailed.distinguishingFeatures.join(', ')}`;
    if (detailed.accessories?.length) description += `, wearing ${detailed.accessories.join(', ')}`;
  }
  if (detailLevel === 'all' && full) {
    if (simple.gender === 'female' || simple.gender === 'other') {
      if (full.bustSize) description += `, ${full.bustSize} bust`;
      if (full.hipWidth) description += `, ${full.hipWidth} hips`;
    }
    if (simple.gender === 'male' || simple.gender === 'other') {
      if (full.muscleDefinition && full.muscleDefinition !== 'none') description += `, ${full.muscleDefinition} muscles`;
      if (full.bodyHair && full.bodyHair !== 'none') description += `, ${full.bodyHair} body hair`;
    }
    if (full.intimateDetails) description += `. ${full.intimateDetails}`;
  }
  return description;
}

// ========== LEGACY TYPES (for game/CharacterCreation.tsx) ==========
export type BodyTypeOption = 'slim' | 'average' | 'athletic' | 'curvy' | 'heavy';
export type HeightOption = 'short' | 'average' | 'tall';
export type HairLengthOption = 'short' | 'medium' | 'long';
export type DispositionOption = 'Bold' | 'Cautious' | 'Adaptable';
export type SocialStyleOption = 'Charming' | 'Reserved' | 'Blunt';
export type BustSizeOption = 'small' | 'medium' | 'large' | 'very large';
export type CurvinessOption = 'subtle' | 'moderate' | 'pronounced' | 'very curvy';
export type MuscleOption = 'lean' | 'toned' | 'muscular' | 'very muscular';
export type BodyHairOption = 'none' | 'light' | 'moderate' | 'heavy';

export interface CharacterBasicInfo { name: string; age: number; gender: string; }
export interface CharacterAppearance { bodyType: BodyTypeOption; height: HeightOption; hairColor: string; hairLength: HairLengthOption; eyeColor: string; skinTone: string; bustSize?: BustSizeOption; curviness?: CurvinessOption; muscles?: MuscleOption; bodyHair?: BodyHairOption; customDescription?: string; }
export type SpawnPointType = 'college' | 'home' | 'homeless';
export interface CharacterBackground { origin: string; spawnPoint: SpawnPointType; }
export interface CharacterPersonality { disposition: DispositionOption; socialStyle: SocialStyleOption; }
export interface CharacterData { basicInfo: CharacterBasicInfo; appearance: CharacterAppearance; background: CharacterBackground; personality: CharacterPersonality; }
export interface BackgroundEffect { startingStress: number; startingMoney: number; skills: string[]; traumaSeeds: string[]; }
export interface SpawnPointData { id: SpawnPointType; name: string; startingLocation: string; housing: string; money: number; stress: number; socialCapital: string[]; schedule: string; narrativeHook: string; uniqueEvents: string[]; }

export const SPAWN_POINTS: Record<SpawnPointType, SpawnPointData> = {
  college: { id: 'college', name: 'College Student', startingLocation: 'University District', housing: 'Dorm room (shared)', money: 500, stress: 20, socialCapital: ['academic connections', 'student ID'], schedule: 'Class timetable (9AM-4PM)', narrativeHook: 'Student loans, academic pressure, campus politics', uniqueEvents: ['Exams week', 'Fraternity rush', 'Professor office hours', 'Library all-nighter'] },
  home: { id: 'home', name: 'Living at Home', startingLocation: 'Mid-Income Residential', housing: 'Family home', money: 1000, stress: 10, socialCapital: ['family support', 'local reputation'], schedule: 'Flexible but family obligations', narrativeHook: 'Family dynamics, neighborhood watch, suburban ennui', uniqueEvents: ['Family dinner conflicts', 'Neighborhood BBQs', 'Local council meetings', 'Home maintenance crises'] },
  homeless: { id: 'homeless', name: 'Street Survivor', startingLocation: 'Decaying Sector/Underbridge', housing: 'Makeshift shelter', money: 50, stress: 60, socialCapital: ['street network', 'survival skills'], schedule: 'Day-to-day survival', narrativeHook: 'System avoidance, resource scavenging, invisible population dynamics', uniqueEvents: ['Shelter lotteries', 'Soup kitchen lines', 'Police sweeps', 'Squatting opportunities'] },
};

export const BACKGROUND_EFFECTS: Record<string, BackgroundEffect> = {
  'Stable upbringing': { startingStress: 0, startingMoney: 1000, skills: ['basic education', 'social etiquette'], traumaSeeds: [] },
  'Turbulent past': { startingStress: 30, startingMoney: 300, skills: ['street smarts', 'resilience'], traumaSeeds: ['trust issues', 'survival guilt'] },
  'Sheltered life': { startingStress: 10, startingMoney: 1500, skills: ['academic knowledge', 'creativity'], traumaSeeds: ['naivety', 'dependency'] },
  'Street survivor': { startingStress: 40, startingMoney: 100, skills: ['scavenging', 'negotiation', 'stealth'], traumaSeeds: ['violence exposure', 'abandonment'] },
};

export const DEFAULT_CHARACTER: CharacterData = {
  basicInfo: { name: '', age: 25, gender: '' },
  appearance: { bodyType: 'average', height: 'average', hairColor: 'brown', hairLength: 'medium', eyeColor: 'brown', skinTone: 'medium', bustSize: 'medium', curviness: 'moderate', muscles: 'toned', bodyHair: 'light' },
  background: { origin: 'Stable upbringing', spawnPoint: 'home' },
  personality: { disposition: 'Adaptable', socialStyle: 'Charming' },
};
