// ============================================================================
// VISUAL PROFILE SCHEMA (v2)
// ----------------------------------------------------------------------------
// A single structured record of every visual customization choice made for a
// character (player or important NPC). It is the ONLY source of truth used to
// build image prompts, so portraits, profile cards, scene art and chapter art
// all resolve to the same face and body.
//
// Numeric traits are stored as exact scalars on a fixed 0..1 range. UI labels
// are derived for readability, never stored in place of the value.
// ============================================================================

export const VISUAL_PROFILE_SCHEMA_VERSION = 2;

export type ScalarRange = number; // 0..1 inclusive

export interface VisualIdentity {
  characterId: string;
  name: string;
  species: string;
  sex: 'male' | 'female' | 'intersex' | 'unspecified';
  genderIdentity?: string;
  apparentAgeCategory: 'child' | 'teen' | 'young_adult' | 'adult' | 'middle_aged' | 'elderly';
  /** Gate for mature body customization. False for anyone not clearly adult. */
  adultOnlyVisualContentEligible: boolean;
  isPlayer: boolean;
  isImportantNpc: boolean;
}

export interface VisualBody {
  /** Free-form band ("short", "tall") kept for narrative. */
  heightBand: string;
  /** Exact height in cm when known — used for framing/proportion wording. */
  heightCm?: number;
  weightKg?: number;
  build: string;
  shoulderWidth: ScalarRange;
  waistSize: ScalarRange;
  hipSize: ScalarRange;
  legLength: ScalarRange;
  armThickness: ScalarRange;
  muscleTone: ScalarRange;
  bodyFatLevel: ScalarRange;
  posture: 'slouched' | 'relaxed' | 'upright' | 'rigid' | 'proud';
  handSize: ScalarRange;
  footSize: ScalarRange;
}

export type ChestShape =
  | 'flat'
  | 'conical'
  | 'teardrop'
  | 'rounded_full'
  | 'wide_set_round'
  | 'bell'
  | 'athletic_flat'
  | 'pectoral';

export interface VisualChest {
  chestSizeMode: 'scalar';
  /** Continuous 0 (completely flat) .. 1 (extremely large). Exact value is saved. */
  chestSizeValue: ScalarRange;
  chestShape: ChestShape;
  chestSpacing: ScalarRange;
  chestPosition: ScalarRange;
  firmness: ScalarRange;
  /** Clothing/support that visibly changes silhouette. */
  supportGarmentInfluence?: string;
}

export interface VisualFace {
  faceShape: string;
  jawline: string;
  chin: string;
  cheekFullness: ScalarRange;
  cheekboneProminence: ScalarRange;
  noseShape: string;
  lipShape: string;
  lipFullness: ScalarRange;
  eyeShape: string;
  eyeSize: ScalarRange;
  eyeColor: string;
  eyebrowShape: string;
  eyelashStyle?: string;
  earShape: string;
  foreheadShape: string;
  skinTone: string;
  freckles?: string;
  moles?: string[];
  facialScars?: string[];
  facialTattoos?: string[];
  piercings?: string[];
  makeupStyle?: string;
  makeupIntensity?: ScalarRange;
}

export interface VisualHair {
  style: string;
  length: string;
  color: string;
  secondaryColor?: string;
  bangs?: string;
  texture?: string;
  facialHair?: string;
}

export interface VisualBodyDetails {
  skinTexture?: string;
  stretchMarks?: string;
  bodyScars?: string[];
  bodyTattoos?: string[];
  tattooStyle?: string;
  prosthetics?: string[];
  visibleDisabilityTraits?: string[];
  pregnancyState?: string;
  currentInjuries?: string[];
  dirtOrBloodLevel?: 'clean' | 'dusty' | 'dirty' | 'bloodied' | 'drenched';
}

export interface VisualWardrobe {
  defaultOutfit?: string;
  currentOutfit?: string;
  baseLayer?: string;
  outerwear?: string;
  accessories?: string[];
  jewelry?: string[];
  footwear?: string;
  weapons?: string[];
  carriedItems?: string[];
  factionColors?: string;
}

export interface VisualStyle {
  campaignArtStyle?: string;
  renderStyle?: string;
  portraitFraming?: 'headshot' | 'bust' | 'waist_up' | 'knees_up' | 'full_body';
  canonicalLighting?: string;
}

export interface VisualReferences {
  canonicalPortraitUrl?: string;
  fullBodyUrl?: string;
  sideProfileUrl?: string;
  expressionSheetUrl?: string;
  alternateOutfitUrls?: string[];
  lastApprovedPortraitId?: string;
  lastApprovedFullBodyId?: string;
}

export interface VisualProfileV2 {
  schemaVersion: number;
  visualProfileVersion: number;
  updatedAt: number;
  identity: VisualIdentity;
  body: VisualBody;
  chest: VisualChest;
  face: VisualFace;
  hair: VisualHair;
  details: VisualBodyDetails;
  wardrobe: VisualWardrobe;
  style: VisualStyle;
  references: VisualReferences;
  /** Traits that must never drift between illustrations. */
  lockedTraits: string[];
  /** Immutable identity sentence, written once. */
  permanentDescription: string;
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function defaultVisualBody(): VisualBody {
  return {
    heightBand: 'average',
    build: 'average',
    shoulderWidth: 0.5,
    waistSize: 0.5,
    hipSize: 0.5,
    legLength: 0.5,
    armThickness: 0.5,
    muscleTone: 0.45,
    bodyFatLevel: 0.45,
    posture: 'upright',
    handSize: 0.5,
    footSize: 0.5,
  };
}

export function defaultVisualChest(): VisualChest {
  return {
    chestSizeMode: 'scalar',
    chestSizeValue: 0.35,
    chestShape: 'rounded_full',
    chestSpacing: 0.5,
    chestPosition: 0.5,
    firmness: 0.55,
  };
}

export function defaultVisualFace(): VisualFace {
  return {
    faceShape: 'oval',
    jawline: 'soft',
    chin: 'rounded',
    cheekFullness: 0.5,
    cheekboneProminence: 0.5,
    noseShape: 'straight',
    lipShape: 'natural',
    lipFullness: 0.5,
    eyeShape: 'almond',
    eyeSize: 0.5,
    eyeColor: 'brown',
    eyebrowShape: 'natural',
    earShape: 'rounded',
    foreheadShape: 'even',
    skinTone: 'medium',
  };
}

export function defaultVisualHair(): VisualHair {
  return { style: 'short', length: 'short', color: 'brown' };
}

export function defaultVisualStyle(): VisualStyle {
  return { portraitFraming: 'knees_up' };
}

export function createEmptyVisualProfile(
  characterId: string,
  name: string,
  overrides: Partial<VisualProfileV2> = {}
): VisualProfileV2 {
  return {
    schemaVersion: VISUAL_PROFILE_SCHEMA_VERSION,
    visualProfileVersion: 1,
    updatedAt: Date.now(),
    identity: {
      characterId,
      name,
      species: 'human',
      sex: 'unspecified',
      apparentAgeCategory: 'adult',
      adultOnlyVisualContentEligible: false,
      isPlayer: false,
      isImportantNpc: true,
    },
    body: defaultVisualBody(),
    chest: defaultVisualChest(),
    face: defaultVisualFace(),
    hair: defaultVisualHair(),
    details: {},
    wardrobe: {},
    style: defaultVisualStyle(),
    references: {},
    lockedTraits: [],
    permanentDescription: '',
    ...overrides,
  };
}

export function clampScalar(value: unknown, fallback = 0.5): ScalarRange {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(1, Math.max(0, Math.round(n * 1000) / 1000));
}
