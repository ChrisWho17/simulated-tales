// Character Creation Types

export type BodyTypeOption = 'slim' | 'average' | 'athletic' | 'curvy' | 'heavy';
export type HeightOption = 'short' | 'average' | 'tall';
export type HairLengthOption = 'short' | 'medium' | 'long';
export type DispositionOption = 'Bold' | 'Cautious' | 'Adaptable';
export type SocialStyleOption = 'Charming' | 'Reserved' | 'Blunt';

export interface CharacterBasicInfo {
  name: string;
  age: number;
  gender: string;
}

export type BustSizeOption = 'small' | 'medium' | 'large' | 'very large';
export type CurvinessOption = 'subtle' | 'moderate' | 'pronounced' | 'very curvy';
export type MuscleOption = 'lean' | 'toned' | 'muscular' | 'very muscular';
export type BodyHairOption = 'none' | 'light' | 'moderate' | 'heavy';

export interface CharacterAppearance {
  bodyType: BodyTypeOption;
  height: HeightOption;
  hairColor: string;
  hairLength: HairLengthOption;
  eyeColor: string;
  skinTone: string;
  // 18+ options (gender-specific)
  bustSize?: BustSizeOption;
  curviness?: CurvinessOption;
  muscles?: MuscleOption;
  bodyHair?: BodyHairOption;
}

export type SpawnPointType = 'college' | 'home' | 'homeless';

export interface CharacterBackground {
  origin: string;
  spawnPoint: SpawnPointType;
}

export interface CharacterPersonality {
  disposition: DispositionOption;
  socialStyle: SocialStyleOption;
}

export interface CharacterData {
  basicInfo: CharacterBasicInfo;
  appearance: CharacterAppearance;
  background: CharacterBackground;
  personality: CharacterPersonality;
}

export interface BackgroundEffect {
  startingStress: number;
  startingMoney: number;
  skills: string[];
  traumaSeeds: string[];
}

export interface SpawnPointData {
  id: SpawnPointType;
  name: string;
  startingLocation: string;
  housing: string;
  money: number;
  stress: number;
  socialCapital: string[];
  schedule: string;
  narrativeHook: string;
  uniqueEvents: string[];
}

export const SPAWN_POINTS: Record<SpawnPointType, SpawnPointData> = {
  college: {
    id: 'college',
    name: 'College Student',
    startingLocation: 'University District',
    housing: 'Dorm room (shared)',
    money: 500,
    stress: 20,
    socialCapital: ['academic connections', 'student ID'],
    schedule: 'Class timetable (9AM-4PM)',
    narrativeHook: 'Student loans, academic pressure, campus politics',
    uniqueEvents: ['Exams week', 'Fraternity rush', 'Professor office hours', 'Library all-nighter'],
  },
  home: {
    id: 'home',
    name: 'Living at Home',
    startingLocation: 'Mid-Income Residential',
    housing: 'Family home',
    money: 1000,
    stress: 10,
    socialCapital: ['family support', 'local reputation'],
    schedule: 'Flexible but family obligations',
    narrativeHook: 'Family dynamics, neighborhood watch, suburban ennui',
    uniqueEvents: ['Family dinner conflicts', 'Neighborhood BBQs', 'Local council meetings', 'Home maintenance crises'],
  },
  homeless: {
    id: 'homeless',
    name: 'Street Survivor',
    startingLocation: 'Decaying Sector/Underbridge',
    housing: 'Makeshift shelter',
    money: 50,
    stress: 60,
    socialCapital: ['street network', 'survival skills'],
    schedule: 'Day-to-day survival',
    narrativeHook: 'System avoidance, resource scavenging, invisible population dynamics',
    uniqueEvents: ['Shelter lotteries', 'Soup kitchen lines', 'Police sweeps', 'Squatting opportunities'],
  },
};

export const BACKGROUND_EFFECTS: Record<string, BackgroundEffect> = {
  'Stable upbringing': {
    startingStress: 0,
    startingMoney: 1000,
    skills: ['basic education', 'social etiquette'],
    traumaSeeds: [],
  },
  'Turbulent past': {
    startingStress: 30,
    startingMoney: 300,
    skills: ['street smarts', 'resilience'],
    traumaSeeds: ['trust issues', 'survival guilt'],
  },
  'Sheltered life': {
    startingStress: 10,
    startingMoney: 1500,
    skills: ['academic knowledge', 'creativity'],
    traumaSeeds: ['naivety', 'dependency'],
  },
  'Street survivor': {
    startingStress: 40,
    startingMoney: 100,
    skills: ['scavenging', 'negotiation', 'stealth'],
    traumaSeeds: ['violence exposure', 'abandonment'],
  },
};

export const DEFAULT_CHARACTER: CharacterData = {
  basicInfo: {
    name: '',
    age: 25,
    gender: '',
  },
  appearance: {
    bodyType: 'average',
    height: 'average',
    hairColor: 'brown',
    hairLength: 'medium',
    eyeColor: 'brown',
    skinTone: 'medium',
    bustSize: 'medium',
    curviness: 'moderate',
    muscles: 'toned',
    bodyHair: 'light',
  },
  background: {
    origin: 'Stable upbringing',
    spawnPoint: 'home',
  },
  personality: {
    disposition: 'Adaptable',
    socialStyle: 'Charming',
  },
};
