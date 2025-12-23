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

export interface CharacterAppearance {
  bodyType: BodyTypeOption;
  height: HeightOption;
  hairColor: string;
  hairLength: HairLengthOption;
  eyeColor: string;
  skinTone: string;
}

export interface CharacterBackground {
  origin: string;
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
  },
  background: {
    origin: 'Stable upbringing',
  },
  personality: {
    disposition: 'Adaptable',
    socialStyle: 'Charming',
  },
};
