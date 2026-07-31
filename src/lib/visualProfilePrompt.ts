// ============================================================================
// VISUAL PROFILE PROMPT BUILDER
// ----------------------------------------------------------------------------
// Image prompts are assembled from structured profile data, never from loose
// concatenated flavour text. Numeric scalars are translated into stable
// descriptive language here while the exact values stay in the save file.
// ============================================================================

import type { ScalarRange, VisualProfileV2 } from '@/types/visualProfile';
import { buildChestPrompt } from '@/lib/chestScale';

function scale(value: ScalarRange, words: [string, string, string, string, string]): string {
  if (value < 0.2) return words[0];
  if (value < 0.4) return words[1];
  if (value < 0.6) return words[2];
  if (value < 0.8) return words[3];
  return words[4];
}

function heightWording(profile: VisualProfileV2): string {
  const { heightBand, heightCm } = profile.body;
  if (heightCm) {
    const feet = Math.floor(heightCm / 30.48);
    const inches = Math.round((heightCm / 2.54) % 12);
    return `${heightBand} height (${feet}'${inches}", ${Math.round(heightCm)}cm), proportions and scale relative to surroundings must match this height`;
  }
  return `${heightBand} height, proportions must match this height`;
}

function bodyWording(profile: VisualProfileV2): string {
  const b = profile.body;
  return [
    heightWording(profile),
    `${b.build} build`,
    `${scale(b.shoulderWidth, ['narrow', 'slim', 'average', 'broad', 'very broad'])} shoulders`,
    `${scale(b.waistSize, ['very slim', 'slim', 'average', 'thick', 'very thick'])} waist`,
    `${scale(b.hipSize, ['narrow', 'slim', 'average', 'wide', 'very wide'])} hips`,
    `${scale(b.legLength, ['short', 'shortish', 'average', 'long', 'very long'])} legs`,
    `${scale(b.armThickness, ['thin', 'slender', 'average', 'thick', 'very thick'])} arms`,
    `${scale(b.muscleTone, ['soft', 'lightly toned', 'toned', 'muscular', 'heavily muscular'])} muscle tone`,
    `${scale(b.bodyFatLevel, ['very lean', 'lean', 'average body fat', 'full-figured', 'heavyset'])}`,
    `${b.posture} posture`,
  ].join(', ');
}

function faceWording(profile: VisualProfileV2): string {
  const f = profile.face;
  const parts = [
    `${f.faceShape} face`,
    `${f.jawline} jawline`,
    `${f.chin} chin`,
    `${scale(f.cheekFullness, ['hollow', 'lean', 'balanced', 'full', 'very full'])} cheeks`,
    `${scale(f.cheekboneProminence, ['soft', 'subtle', 'defined', 'high', 'very high'])} cheekbones`,
    `${f.noseShape} nose`,
    `${f.lipShape} lips, ${scale(f.lipFullness, ['thin', 'slim', 'natural', 'full', 'very full'])}`,
    `${f.eyeShape} ${f.eyeColor} eyes, ${scale(f.eyeSize, ['small', 'smallish', 'average', 'large', 'very large'])}`,
    `${f.eyebrowShape} eyebrows`,
    f.eyelashStyle ? `${f.eyelashStyle} lashes` : '',
    `${f.earShape} ears`,
    `${f.foreheadShape} forehead`,
    `${f.skinTone} skin`,
    f.freckles ? `freckles: ${f.freckles}` : '',
    f.moles?.length ? `moles: ${f.moles.join(', ')}` : '',
    f.facialScars?.length ? `facial scars: ${f.facialScars.join(', ')}` : '',
    f.facialTattoos?.length ? `facial tattoos: ${f.facialTattoos.join(', ')}` : '',
    f.piercings?.length ? `piercings: ${f.piercings.join(', ')}` : '',
    f.makeupStyle
      ? `${f.makeupStyle} makeup${typeof f.makeupIntensity === 'number' ? ` (${scale(f.makeupIntensity, ['barely visible', 'subtle', 'moderate', 'bold', 'dramatic'])})` : ''}`
      : '',
  ];
  return parts.filter(Boolean).join(', ');
}

function hairWording(profile: VisualProfileV2): string {
  const h = profile.hair;
  const parts = [
    `${h.length} ${h.color} hair`,
    h.secondaryColor ? `two-tone with ${h.secondaryColor}` : '',
    `${h.style} style`,
    h.texture || '',
    h.bangs ? `${h.bangs} bangs` : '',
    h.facialHair || '',
  ];
  return parts.filter(Boolean).join(', ');
}

function detailWording(profile: VisualProfileV2): string {
  const d = profile.details;
  const parts = [
    d.skinTexture || '',
    d.stretchMarks || '',
    d.bodyScars?.length ? `body scars: ${d.bodyScars.join(', ')}` : '',
    d.bodyTattoos?.length
      ? `tattoos${d.tattooStyle ? ` (${d.tattooStyle} style)` : ''}: ${d.bodyTattoos.join(', ')}`
      : '',
    d.prosthetics?.length ? `prosthetics: ${d.prosthetics.join(', ')}` : '',
    d.visibleDisabilityTraits?.length ? d.visibleDisabilityTraits.join(', ') : '',
    d.pregnancyState || '',
    d.currentInjuries?.length ? `visible injuries: ${d.currentInjuries.join(', ')}` : '',
    d.dirtOrBloodLevel && d.dirtOrBloodLevel !== 'clean' ? `${d.dirtOrBloodLevel} appearance` : '',
  ];
  return parts.filter(Boolean).join(', ');
}

function wardrobeWording(profile: VisualProfileV2): string {
  const w = profile.wardrobe;
  const parts = [
    w.currentOutfit || w.defaultOutfit || '',
    w.outerwear || '',
    w.footwear || '',
    w.accessories?.length ? `accessories: ${w.accessories.join(', ')}` : '',
    w.jewelry?.length ? `jewelry: ${w.jewelry.join(', ')}` : '',
    w.weapons?.length ? `carrying: ${w.weapons.join(', ')}` : '',
    w.carriedItems?.length ? w.carriedItems.join(', ') : '',
    w.factionColors ? `faction colors: ${w.factionColors}` : '',
  ];
  return parts.filter(Boolean).join(', ');
}

export interface SceneContextInput {
  action?: string;
  emotion?: string;
  location?: string;
  timeOfDay?: string;
  weather?: string;
  lighting?: string;
  cameraFraming?: string;
  artStyle?: string;
  /** Whether the torso is visible in this framing. */
  chestVisible?: boolean;
}

/**
 * Size-ratio and mark-placement contract. Image models get the gist of a body
 * but drift on relative scale and on where a mark actually sits, so scale is
 * restated as head-heights and every mark is pinned to a named landmark.
 */
function proportionAnchors(profile: VisualProfileV2): string {
  const cm = profile.body.heightCm;
  const parts: string[] = [];

  if (cm) {
    const heads = Math.max(6.5, Math.min(8.2, 6.5 + (cm - 150) / 25));
    const relation =
      cm < 155 ? 'noticeably short, clearly smaller than an average adult; doorways, furniture and other characters tower over them'
        : cm < 165 ? 'below average height, slightly smaller than an average adult'
        : cm < 178 ? 'average adult height'
        : cm < 190 ? 'tall, clearly taller than an average adult'
        : 'very tall and towering, looks cramped under normal doorways and low ceilings';
    parts.push(
      `SCALE: ${Math.round(cm)}cm — ${relation}; drawn at about ${heads.toFixed(1)} head-heights, with head size, limb length and torso length matching this exact stature`
    );
  } else {
    parts.push(`SCALE: ${profile.body.heightBand} stature, consistent head-to-body ratio`);
  }

  if (profile.identity.sex !== 'male') {
    parts.push(
      `CHEST RATIO: bust volume locked at ${(Math.min(1, Math.max(0, profile.chest.chestSizeValue)) * 100).toFixed(0)}% of the range, measured against ribcage, shoulder and hip width — do not normalise toward average`
    );
  }

  const marks = [
    profile.face.facialScars?.length ? `facial scars: ${profile.face.facialScars.join('; ')}` : '',
    profile.face.piercings?.length ? `piercings: ${profile.face.piercings.join('; ')}` : '',
    profile.details.bodyScars?.length ? `body scars: ${profile.details.bodyScars.join('; ')}` : '',
    profile.details.bodyTattoos?.length ? `tattoos: ${profile.details.bodyTattoos.join('; ')}` : '',
    profile.details.prosthetics?.length ? `prosthetics: ${profile.details.prosthetics.join('; ')}` : '',
  ].filter(Boolean);

  parts.push(
    marks.length
      ? `PLACEMENT (exact, nowhere else): ${marks.join('. ')}. Anchor each to the named landmark (left/right, above/below the joint) and add no extra marks`
      : 'PLACEMENT: clean skin — no extra tattoos, scars or piercings'
  );

  parts.push('ANATOMY: correct finger count, symmetrical eyes, clothing and jewelry sitting exactly on the body part they belong to');

  return parts.join('\n');
}

/** One structured block per character, in a stable field order. */
export function buildCharacterPromptBlock(
  profile: VisualProfileV2,
  context: SceneContextInput = {}
): string {

  const chest = buildChestPrompt({
    chestSizeValue: profile.chest.chestSizeValue,
    chestShape: profile.chest.chestShape,
    chestSpacing: profile.chest.chestSpacing,
    chestPosition: profile.chest.chestPosition,
    firmness: profile.chest.firmness,
    supportGarmentInfluence: profile.chest.supportGarmentInfluence,
    adultEligible: profile.identity.adultOnlyVisualContentEligible,
    visuallyRelevant: context.chestVisible !== false,
  });

  const lines = [
    `CHARACTER: ${profile.identity.name} (${profile.identity.species}, ${profile.identity.sex}, ${profile.identity.apparentAgeCategory.replace(/_/g, ' ')})`,
    `BODY: ${bodyWording(profile)}`,
    chest ? `CHEST: ${chest}` : '',
    `FACE: ${faceWording(profile)}`,
    `HAIR: ${hairWording(profile)}`,
    detailWording(profile) ? `DETAILS: ${detailWording(profile)}` : '',
    wardrobeWording(profile) ? `OUTFIT AND GEAR: ${wardrobeWording(profile)}` : '',
    profile.lockedTraits.length ? `LOCKED TRAITS (must not change): ${profile.lockedTraits.join('; ')}` : '',
  ];

  return lines.filter(Boolean).join('\n');
}

export interface PortraitPromptResult {
  prompt: string;
  referenceImages: string[];
}

export function buildPortraitPrompt(
  profile: VisualProfileV2,
  context: SceneContextInput = {}
): PortraitPromptResult {
  const framing = context.cameraFraming || profile.style.portraitFraming || 'waist_up';
  const prompt = [
    buildCharacterPromptBlock(profile, context),
    context.emotion ? `EXPRESSION: ${context.emotion}` : '',
    `CAMERA: ${framing.replace(/_/g, ' ')} portrait, character facing viewer`,
    context.location ? `ENVIRONMENT: ${context.location}` : '',
    context.lighting || profile.style.canonicalLighting
      ? `LIGHTING: ${context.lighting || profile.style.canonicalLighting}`
      : '',
    `ART STYLE: ${context.artStyle || profile.style.campaignArtStyle || profile.style.renderStyle || 'realistic cinematic digital painting'}`,
    'CONSISTENCY: this is an established character — reproduce the exact same face, body proportions and marks as the reference.',
  ]
    .filter(Boolean)
    .join('\n');

  const referenceImages = [
    profile.references.canonicalPortraitUrl,
    profile.references.fullBodyUrl,
    profile.references.sideProfileUrl,
  ].filter(Boolean) as string[];

  return { prompt, referenceImages };
}

export function buildScenePrompt(
  profiles: VisualProfileV2[],
  context: SceneContextInput
): PortraitPromptResult {
  const castLine = `CAST (exactly ${profiles.length} character${profiles.length === 1 ? '' : 's'}): ${profiles
    .map(p => `${p.identity.name} (${p.identity.sex})`)
    .join(', ')}`;

  const prompt = [
    castLine,
    ...profiles.map(p => buildCharacterPromptBlock(p, context)),
    context.action ? `ACTION: ${context.action}` : '',
    context.emotion ? `EMOTION: ${context.emotion}` : '',
    context.location ? `LOCATION: ${context.location}` : '',
    [context.timeOfDay, context.weather].filter(Boolean).length
      ? `TIME AND WEATHER: ${[context.timeOfDay, context.weather].filter(Boolean).join(', ')}`
      : '',
    context.lighting ? `LIGHTING: ${context.lighting}` : '',
    `CAMERA: ${context.cameraFraming || 'medium shot, cinematic composition'}`,
    `ART STYLE: ${context.artStyle || profiles[0]?.style.campaignArtStyle || 'realistic cinematic digital painting'}`,
    'CONSISTENCY: established characters — match the supplied reference images exactly. Do not swap identities, genders or body types.',
  ]
    .filter(Boolean)
    .join('\n');

  const referenceImages = Array.from(
    new Set(
      profiles.flatMap(p =>
        [p.references.canonicalPortraitUrl, p.references.fullBodyUrl].filter(Boolean) as string[]
      )
    )
  ).slice(0, 4);

  return { prompt, referenceImages };
}
