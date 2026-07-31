// ============================================================================
// VISUAL PROFILE BUILDER
// ----------------------------------------------------------------------------
// Converts loose character-creation / NPC data into the structured
// VisualProfileV2 record. Nothing here invents identity: unknown fields fall
// back to defaults so an established look can never silently drift.
// ============================================================================

import {
  clampScalar,
  createEmptyVisualProfile,
  defaultVisualChest,
  type ChestShape,
  type VisualProfileV2,
} from '@/types/visualProfile';
import { cupLetterToScalar } from '@/lib/chestScale';

/** Loose shape accepted from character creation, NPCs and legacy saves. */
export interface AppearanceInput {
  gender?: string;
  sex?: string;
  species?: string;
  age?: number | string;
  height?: string;
  heightCm?: number;
  weightKg?: number;
  build?: string;
  bodyType?: string;
  shoulderWidth?: string;
  hipWidth?: string;
  muscleDefinition?: string;
  bodyFat?: string;
  posture?: string;
  // chest
  chestSizeValue?: number;
  chestShape?: string;
  chestSpacing?: number;
  chestPosition?: number;
  bustSize?: string;
  // face
  faceShape?: string;
  eyeColor?: string;
  skinTone?: string;
  distinguishingFeatures?: string[];
  piercings?: string[];
  // hair
  hairStyle?: string;
  hairLength?: string;
  hairColor?: string;
  hairSecondaryColor?: string;
  facialHair?: string;
  // body details
  scars?: string[];
  tattoos?: string[];
  tattooStyle?: string;
  prosthetics?: string[];
  implants?: string[];
  currentInjuries?: string[];
  // wardrobe
  clothingStyle?: string;
  currentOutfit?: string;
  accessories?: string[];
  weapons?: string[];
  customDescription?: string;
}

const SCALAR_WORDS: Record<string, number> = {
  none: 0.05,
  narrow: 0.25,
  slim: 0.25,
  soft: 0.2,
  light: 0.3,
  toned: 0.45,
  average: 0.5,
  moderate: 0.5,
  fit: 0.6,
  wide: 0.7,
  broad: 0.7,
  defined: 0.7,
  muscular: 0.82,
  heavy: 0.85,
  very_broad: 0.9,
  'very wide': 0.9,
  very_wide: 0.9,
  very_muscular: 0.92,
  big: 1.0,
};

function wordScalar(word: string | undefined, fallback = 0.5): number {
  if (!word) return fallback;
  const key = String(word).toLowerCase().trim();
  return clampScalar(SCALAR_WORDS[key] ?? fallback, fallback);
}

function ageCategory(age?: number | string): VisualProfileV2['identity']['apparentAgeCategory'] {
  const n = typeof age === 'number' ? age : parseInt(String(age ?? ''), 10);
  if (!Number.isFinite(n)) return 'adult';
  if (n < 13) return 'child';
  if (n < 18) return 'teen';
  if (n < 30) return 'young_adult';
  if (n < 45) return 'adult';
  if (n < 65) return 'middle_aged';
  return 'elderly';
}

function normalizeSex(input?: string): VisualProfileV2['identity']['sex'] {
  const g = (input || '').toLowerCase();
  if (g === 'male' || g === 'man' || g === 'm') return 'male';
  if (g === 'female' || g === 'woman' || g === 'f') return 'female';
  if (g === 'intersex' || g === 'hermaphrodite') return 'intersex';
  return 'unspecified';
}

function normalizeChestShape(input?: string, sizeValue = 0.3): ChestShape {
  const allowed: ChestShape[] = [
    'flat',
    'conical',
    'teardrop',
    'rounded_full',
    'wide_set_round',
    'bell',
    'athletic_flat',
    'pectoral',
  ];
  if (input && allowed.includes(input as ChestShape)) return input as ChestShape;
  if (sizeValue <= 0.05) return 'flat';
  return 'rounded_full';
}

export interface BuildProfileOptions {
  characterId: string;
  name: string;
  isPlayer?: boolean;
  isImportantNpc?: boolean;
  campaignArtStyle?: string;
  /** Mature body customization requires an adult character. */
  matureContentAllowed?: boolean;
}

export function buildVisualProfile(
  appearance: AppearanceInput,
  options: BuildProfileOptions,
  previous?: VisualProfileV2 | null
): VisualProfileV2 {
  const base = previous
    ? { ...previous }
    : createEmptyVisualProfile(options.characterId, options.name);

  const sex = normalizeSex(appearance.sex || appearance.gender);
  const apparentAge = ageCategory(appearance.age);
  const isAdult = ['young_adult', 'adult', 'middle_aged', 'elderly'].includes(apparentAge);

  const chestDefaults = previous?.chest ?? defaultVisualChest();
  const chestSizeValue =
    typeof appearance.chestSizeValue === 'number'
      ? clampScalar(appearance.chestSizeValue)
      : appearance.bustSize
        ? cupLetterToScalar(appearance.bustSize, chestDefaults.chestSizeValue)
        : chestDefaults.chestSizeValue;

  const profile: VisualProfileV2 = {
    ...base,
    schemaVersion: 2,
    visualProfileVersion: (previous?.visualProfileVersion ?? 0) + 1,
    updatedAt: Date.now(),
    identity: {
      characterId: options.characterId,
      name: options.name,
      species: appearance.species || previous?.identity.species || 'human',
      sex,
      genderIdentity: appearance.gender,
      apparentAgeCategory: apparentAge,
      adultOnlyVisualContentEligible: Boolean(options.matureContentAllowed) && isAdult,
      isPlayer: options.isPlayer ?? previous?.identity.isPlayer ?? false,
      isImportantNpc: options.isImportantNpc ?? previous?.identity.isImportantNpc ?? false,
    },
    body: {
      ...base.body,
      heightBand: appearance.height || base.body.heightBand,
      heightCm: appearance.heightCm ?? base.body.heightCm,
      weightKg: appearance.weightKg ?? base.body.weightKg,
      build: appearance.build || appearance.bodyType || base.body.build,
      shoulderWidth: wordScalar(appearance.shoulderWidth, base.body.shoulderWidth),
      hipSize: wordScalar(appearance.hipWidth, base.body.hipSize),
      muscleTone: wordScalar(appearance.muscleDefinition, base.body.muscleTone),
      bodyFatLevel: wordScalar(appearance.bodyFat, base.body.bodyFatLevel),
    },
    chest: {
      chestSizeMode: 'scalar',
      chestSizeValue,
      chestShape: normalizeChestShape(appearance.chestShape, chestSizeValue),
      chestSpacing: clampScalar(appearance.chestSpacing ?? chestDefaults.chestSpacing),
      chestPosition: clampScalar(appearance.chestPosition ?? chestDefaults.chestPosition),
      firmness: chestDefaults.firmness,
      supportGarmentInfluence: chestDefaults.supportGarmentInfluence,
    },
    face: {
      ...base.face,
      faceShape: appearance.faceShape || base.face.faceShape,
      eyeColor: appearance.eyeColor || base.face.eyeColor,
      skinTone: appearance.skinTone || base.face.skinTone,
      piercings: appearance.piercings ?? base.face.piercings,
      facialScars: (appearance.scars || []).filter(s => /face|eye|ear|jaw|cheek/i.test(s)),
    },
    hair: {
      ...base.hair,
      style: appearance.hairStyle || base.hair.style,
      length: appearance.hairLength || base.hair.length,
      color: appearance.hairColor || base.hair.color,
      secondaryColor: appearance.hairSecondaryColor ?? base.hair.secondaryColor,
      facialHair: appearance.facialHair ?? base.hair.facialHair,
    },
    details: {
      ...base.details,
      bodyScars: appearance.scars ?? base.details.bodyScars,
      bodyTattoos: appearance.tattoos ?? base.details.bodyTattoos,
      tattooStyle: appearance.tattooStyle ?? base.details.tattooStyle,
      prosthetics: appearance.prosthetics ?? base.details.prosthetics,
      currentInjuries: appearance.currentInjuries ?? base.details.currentInjuries,
    },
    wardrobe: {
      ...base.wardrobe,
      defaultOutfit: base.wardrobe.defaultOutfit || appearance.clothingStyle,
      currentOutfit: appearance.currentOutfit ?? base.wardrobe.currentOutfit ?? appearance.clothingStyle,
      accessories: appearance.accessories ?? base.wardrobe.accessories,
      weapons: appearance.weapons ?? base.wardrobe.weapons,
    },
    style: {
      ...base.style,
      campaignArtStyle: options.campaignArtStyle ?? base.style.campaignArtStyle,
    },
    references: base.references ?? {},
    lockedTraits: previous?.lockedTraits?.length
      ? previous.lockedTraits
      : buildLockedTraits(appearance, sex),
    permanentDescription:
      previous?.permanentDescription || buildPermanentDescription(options.name, appearance, sex),
  };

  return profile;
}

function buildLockedTraits(appearance: AppearanceInput, sex: string): string[] {
  const traits: string[] = [];
  if (sex !== 'unspecified') traits.push(`${sex} character`);
  if (appearance.eyeColor) traits.push(`${appearance.eyeColor} eyes`);
  if (appearance.hairColor) traits.push(`${appearance.hairColor} hair`);
  if (appearance.skinTone) traits.push(`${appearance.skinTone} skin`);
  if (appearance.faceShape) traits.push(`${appearance.faceShape} face shape`);
  for (const scar of appearance.scars || []) traits.push(`scar: ${scar}`);
  for (const tattoo of appearance.tattoos || []) traits.push(`tattoo: ${tattoo}`);
  return traits;
}

function buildPermanentDescription(name: string, appearance: AppearanceInput, sex: string): string {
  const bits = [
    name,
    sex !== 'unspecified' ? sex : '',
    appearance.height ? `${appearance.height} height` : '',
    appearance.build || appearance.bodyType || '',
    appearance.hairColor ? `${appearance.hairLength || ''} ${appearance.hairColor} hair`.trim() : '',
    appearance.eyeColor ? `${appearance.eyeColor} eyes` : '',
    appearance.skinTone ? `${appearance.skinTone} skin` : '',
  ].filter(Boolean);
  return bits.join(', ');
}

/** Lighter-weight profile for procedurally generated NPCs. */
export function buildNpcVisualProfile(
  npc: { id: string; name: string; gender?: string; age?: number; appearance?: AppearanceInput },
  options: Partial<BuildProfileOptions> = {},
  previous?: VisualProfileV2 | null
): VisualProfileV2 {
  return buildVisualProfile(
    { gender: npc.gender, age: npc.age, ...(npc.appearance || {}) },
    {
      characterId: npc.id,
      name: npc.name,
      isPlayer: false,
      isImportantNpc: true,
      matureContentAllowed: false,
      ...options,
    },
    previous
  );
}
