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
  // Extended body modifications
  piercings?: string[];
  tattoos?: string[];
  tattooStyle?: string;
  // Physical modifications
  scars?: string[];
  prosthetics?: string[];
  implants?: string[];
  mutations?: string[];
  // Clothing style
  clothingStyle?: string;
  clothingDetails?: string[];
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
export const DISTINGUISHING_FEATURES = ['Facial scar', 'Body scar', 'Freckles', 'Dimples', 'Beauty mark', 'Eyepatch', 'Burn scars', 'Birthmark'];
export const ACCESSORIES = ['Glasses', 'Sunglasses', 'Earrings', 'Necklace', 'Choker', 'Ring', 'Bracelet', 'Watch', 'Hat', 'Bandana', 'Headband', 'Circlet', 'Mask', 'Goggles'];

// Extended body modification options
export const PIERCING_OPTIONS = [
  // Face
  { value: 'ear_lobe', label: 'Ear Lobe', category: 'face' },
  { value: 'ear_helix', label: 'Ear Helix', category: 'face' },
  { value: 'ear_industrial', label: 'Industrial Bar', category: 'face' },
  { value: 'nose_nostril', label: 'Nostril', category: 'face' },
  { value: 'nose_septum', label: 'Septum', category: 'face' },
  { value: 'lip_labret', label: 'Labret', category: 'face' },
  { value: 'lip_snake_bites', label: 'Snake Bites', category: 'face' },
  { value: 'lip_monroe', label: 'Monroe', category: 'face' },
  { value: 'eyebrow', label: 'Eyebrow', category: 'face' },
  { value: 'tongue', label: 'Tongue', category: 'face' },
  // Body
  { value: 'navel', label: 'Navel/Belly Button', category: 'body' },
  { value: 'nipple', label: 'Nipple', category: 'body' },
  { value: 'dermal_chest', label: 'Chest Dermals', category: 'body' },
  { value: 'dermal_hips', label: 'Hip Dermals', category: 'body' },
  // Intimate (18+)
  { value: 'intimate_male', label: 'Prince Albert', category: 'intimate' },
  { value: 'intimate_female', label: 'VCH', category: 'intimate' },
];

export const TATTOO_OPTIONS = [
  // Face & Neck
  { value: 'face_tribal', label: 'Face Tribal', category: 'face' },
  { value: 'face_tears', label: 'Tear Drops', category: 'face' },
  { value: 'face_makeup', label: 'Cosmetic/Makeup', category: 'face' },
  { value: 'neck_front', label: 'Front Neck', category: 'neck' },
  { value: 'neck_sides', label: 'Side Neck', category: 'neck' },
  { value: 'neck_back', label: 'Back of Neck', category: 'neck' },
  // Arms
  { value: 'arm_sleeve_full', label: 'Full Sleeve', category: 'arms' },
  { value: 'arm_sleeve_half', label: 'Half Sleeve', category: 'arms' },
  { value: 'arm_forearm', label: 'Forearm Only', category: 'arms' },
  { value: 'arm_bicep', label: 'Bicep', category: 'arms' },
  { value: 'hand', label: 'Hand/Finger', category: 'arms' },
  // Torso
  { value: 'chest_full', label: 'Full Chest Piece', category: 'torso' },
  { value: 'chest_side', label: 'Side Chest', category: 'torso' },
  { value: 'sternum', label: 'Sternum', category: 'torso' },
  { value: 'ribs', label: 'Rib Cage', category: 'torso' },
  { value: 'stomach', label: 'Stomach', category: 'torso' },
  // Back
  { value: 'back_full', label: 'Full Back', category: 'back' },
  { value: 'back_upper', label: 'Upper Back', category: 'back' },
  { value: 'back_lower', label: 'Lower Back', category: 'back' },
  { value: 'back_spine', label: 'Spine', category: 'back' },
  { value: 'shoulder_blade', label: 'Shoulder Blade', category: 'back' },
  // Legs
  { value: 'thigh', label: 'Thigh', category: 'legs' },
  { value: 'calf', label: 'Calf', category: 'legs' },
  { value: 'leg_sleeve', label: 'Leg Sleeve', category: 'legs' },
  { value: 'ankle', label: 'Ankle', category: 'legs' },
  // Intimate (18+)
  { value: 'intimate_area', label: 'Intimate Area', category: 'intimate' },
  { value: 'inner_thigh', label: 'Inner Thigh', category: 'intimate' },
];

export const BUST_OPTIONS = [{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'very large', label: 'Very Large' }];
export const HIP_OPTIONS = [{ value: 'narrow', label: 'Narrow' }, { value: 'average', label: 'Average' }, { value: 'wide', label: 'Wide' }, { value: 'very wide', label: 'Very Wide' }];
export const MUSCLE_OPTIONS = [{ value: 'none', label: 'Soft' }, { value: 'toned', label: 'Toned' }, { value: 'defined', label: 'Defined' }, { value: 'very muscular', label: 'Very Muscular' }];
export const BODY_HAIR_OPTIONS = [{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'moderate', label: 'Moderate' }, { value: 'heavy', label: 'Heavy' }];

// Tattoo style options
export const TATTOO_STYLE_OPTIONS = [
  { value: 'traditional', label: 'Traditional/American', description: 'Bold lines, bright colors' },
  { value: 'tribal', label: 'Tribal', description: 'Bold black patterns' },
  { value: 'realistic', label: 'Realistic/Portrait', description: 'Photorealistic designs' },
  { value: 'watercolor', label: 'Watercolor', description: 'Flowing, colorful splashes' },
  { value: 'geometric', label: 'Geometric', description: 'Sacred geometry, patterns' },
  { value: 'blackwork', label: 'Blackwork', description: 'Solid black designs' },
  { value: 'japanese', label: 'Japanese/Irezumi', description: 'Dragons, koi, waves' },
  { value: 'minimalist', label: 'Minimalist', description: 'Simple, fine line' },
  { value: 'neo_traditional', label: 'Neo-Traditional', description: 'Modern take on traditional' },
  { value: 'trash_polka', label: 'Trash Polka', description: 'Red and black chaos' },
];

// Physical modification options
export const SCAR_OPTIONS = [
  { value: 'face_slash', label: 'Facial Slash', category: 'face' },
  { value: 'face_burn', label: 'Facial Burns', category: 'face' },
  { value: 'missing_eye', label: 'Missing Eye', category: 'face' },
  { value: 'missing_ear', label: 'Missing Ear', category: 'face' },
  { value: 'neck_scar', label: 'Neck Scar', category: 'body' },
  { value: 'chest_scars', label: 'Chest Scars', category: 'body' },
  { value: 'back_lashes', label: 'Back Lash Marks', category: 'body' },
  { value: 'bullet_wounds', label: 'Bullet Wound Scars', category: 'body' },
  { value: 'surgical_scars', label: 'Surgical Scars', category: 'body' },
  { value: 'arm_burns', label: 'Arm Burns', category: 'limbs' },
  { value: 'missing_fingers', label: 'Missing Fingers', category: 'limbs' },
  { value: 'leg_scars', label: 'Leg Scars', category: 'limbs' },
];

export const PROSTHETIC_OPTIONS = [
  { value: 'arm_mechanical', label: 'Mechanical Arm', category: 'arms' },
  { value: 'arm_cybernetic', label: 'Cybernetic Arm', category: 'arms' },
  { value: 'hand_prosthetic', label: 'Prosthetic Hand', category: 'arms' },
  { value: 'leg_mechanical', label: 'Mechanical Leg', category: 'legs' },
  { value: 'leg_cybernetic', label: 'Cybernetic Leg', category: 'legs' },
  { value: 'eye_cybernetic', label: 'Cybernetic Eye', category: 'head' },
  { value: 'eye_glass', label: 'Glass Eye', category: 'head' },
  { value: 'jaw_metal', label: 'Metal Jaw', category: 'head' },
];

export const IMPLANT_OPTIONS = [
  { value: 'subdermal_horns', label: 'Subdermal Horns', category: 'cosmetic' },
  { value: 'split_tongue', label: 'Split Tongue', category: 'cosmetic' },
  { value: 'pointed_ears', label: 'Pointed Ears', category: 'cosmetic' },
  { value: 'fangs', label: 'Fang Implants', category: 'cosmetic' },
  { value: 'eye_mods', label: 'Eye Color Implants', category: 'cosmetic' },
  { value: 'neural_jack', label: 'Neural Interface Jack', category: 'tech' },
  { value: 'data_port', label: 'Data Port', category: 'tech' },
  { value: 'reflex_booster', label: 'Reflex Boosters', category: 'tech' },
  { value: 'subdermal_armor', label: 'Subdermal Armor', category: 'tech' },
  { value: 'skill_chip', label: 'Skill Chip Socket', category: 'tech' },
];

export const MUTATION_OPTIONS = [
  { value: 'unusual_skin', label: 'Unusual Skin Color', category: 'visible' },
  { value: 'scales', label: 'Scale Patches', category: 'visible' },
  { value: 'extra_digits', label: 'Extra Fingers/Toes', category: 'visible' },
  { value: 'bioluminescence', label: 'Bioluminescent Markings', category: 'visible' },
  { value: 'unusual_eyes', label: 'Unusual Eye Structure', category: 'visible' },
  { value: 'claws', label: 'Natural Claws', category: 'visible' },
  { value: 'tail', label: 'Tail', category: 'visible' },
  { value: 'horns_natural', label: 'Natural Horns', category: 'visible' },
];

// Clothing style options - can contrast with genre for NPC reactions
export const CLOTHING_STYLE_OPTIONS = [
  { value: 'genre_default', label: 'Genre Appropriate', description: 'Standard for setting' },
  { value: 'formal', label: 'Formal/Business', description: 'Suits, dresses, professional' },
  { value: 'casual', label: 'Casual', description: 'Relaxed everyday wear' },
  { value: 'streetwear', label: 'Streetwear', description: 'Urban, trendy, branded' },
  { value: 'punk', label: 'Punk/Alternative', description: 'Ripped, spikes, patches' },
  { value: 'goth', label: 'Gothic', description: 'Dark, Victorian influence' },
  { value: 'military', label: 'Military/Tactical', description: 'Combat ready, practical' },
  { value: 'athletic', label: 'Athletic/Sporty', description: 'Performance wear' },
  { value: 'bohemian', label: 'Bohemian/Hippie', description: 'Flowing, natural fabrics' },
  { value: 'vintage', label: 'Vintage/Retro', description: 'Past era fashion' },
  { value: 'minimalist', label: 'Minimalist', description: 'Simple, clean lines' },
  { value: 'extravagant', label: 'Extravagant/Flashy', description: 'Bold, attention-grabbing' },
  { value: 'revealing', label: 'Revealing', description: 'Shows more skin' },
  { value: 'modest', label: 'Modest/Conservative', description: 'Full coverage' },
  { value: 'cosplay', label: 'Costume/Cosplay', description: 'Character or themed' },
];

export const CLOTHING_DETAIL_OPTIONS = [
  // Tops
  { value: 't_shirt', label: 'T-Shirt', category: 'tops' },
  { value: 'long_sleeve', label: 'Long Sleeve Shirt', category: 'tops' },
  { value: 'tank_top', label: 'Tank Top', category: 'tops' },
  { value: 'crop_top', label: 'Crop Top', category: 'tops' },
  { value: 'blouse', label: 'Blouse', category: 'tops' },
  { value: 'sweater', label: 'Sweater', category: 'tops' },
  { value: 'hoodie', label: 'Hoodie', category: 'tops' },
  { value: 'jacket', label: 'Jacket', category: 'tops' },
  { value: 'coat', label: 'Coat', category: 'tops' },
  { value: 'vest', label: 'Vest', category: 'tops' },
  // Bottoms
  { value: 'jeans', label: 'Jeans', category: 'bottoms' },
  { value: 'shorts', label: 'Shorts', category: 'bottoms' },
  { value: 'skirt', label: 'Skirt', category: 'bottoms' },
  { value: 'pants', label: 'Pants', category: 'bottoms' },
  { value: 'sweatpants', label: 'Sweatpants', category: 'bottoms' },
  { value: 'leggings', label: 'Leggings', category: 'bottoms' },
  { value: 'cargo_pants', label: 'Cargo Pants', category: 'bottoms' },
  // Full body
  { value: 'dress', label: 'Dress', category: 'full' },
  { value: 'jumpsuit', label: 'Jumpsuit', category: 'full' },
  { value: 'romper', label: 'Romper', category: 'full' },
  { value: 'suit', label: 'Suit', category: 'full' },
  { value: 'overalls', label: 'Overalls', category: 'full' },
  // Footwear
  { value: 'sneakers', label: 'Sneakers', category: 'footwear' },
  { value: 'boots', label: 'Boots', category: 'footwear' },
  { value: 'sandals', label: 'Sandals', category: 'footwear' },
  { value: 'loafers', label: 'Loafers', category: 'footwear' },
  { value: 'heels', label: 'Heels', category: 'footwear' },
  { value: 'flats', label: 'Flats', category: 'footwear' },
  // Accessories
  { value: 'hat', label: 'Hat', category: 'accessories' },
  { value: 'scarf', label: 'Scarf', category: 'accessories' },
  { value: 'gloves', label: 'Gloves', category: 'accessories' },
  { value: 'belt', label: 'Belt', category: 'accessories' },
  { value: 'cape', label: 'Cape/Cloak', category: 'accessories' },
];

export function formatAppearanceForAI(appearance: TieredAppearance, genre: string): string {
  const { simple, detailed, full, detailLevel } = appearance;
  let genderDesc = simple.gender === 'other' && full?.isHermaphrodite ? 'intersex' : simple.gender === 'other' ? 'androgynous' : simple.gender;
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
    // Extended body modifications
    if (full.piercings?.length) {
      const piercingLabels = full.piercings.map(p => {
        const opt = PIERCING_OPTIONS.find(o => o.value === p);
        return opt ? opt.label.toLowerCase() + ' piercing' : p;
      });
      description += `, with ${piercingLabels.join(', ')}`;
    }
    if (full.tattoos?.length) {
      const tattooStyle = full.tattooStyle ? TATTOO_STYLE_OPTIONS.find(s => s.value === full.tattooStyle)?.label || '' : '';
      const tattooLabels = full.tattoos.map(t => {
        const opt = TATTOO_OPTIONS.find(o => o.value === t);
        return opt ? opt.label.toLowerCase() + ' tattoo' : t;
      });
      description += `, with ${tattooStyle ? tattooStyle + ' style ' : ''}${tattooLabels.join(', ')}`;
    }
    // Physical modifications
    if (full.scars?.length) {
      const scarLabels = full.scars.map(s => {
        const opt = SCAR_OPTIONS.find(o => o.value === s);
        return opt ? opt.label.toLowerCase() : s;
      });
      description += `, with ${scarLabels.join(', ')}`;
    }
    if (full.prosthetics?.length) {
      const prostheticLabels = full.prosthetics.map(p => {
        const opt = PROSTHETIC_OPTIONS.find(o => o.value === p);
        return opt ? opt.label.toLowerCase() : p;
      });
      description += `, has ${prostheticLabels.join(', ')}`;
    }
    if (full.implants?.length) {
      const implantLabels = full.implants.map(i => {
        const opt = IMPLANT_OPTIONS.find(o => o.value === i);
        return opt ? opt.label.toLowerCase() : i;
      });
      description += `, with ${implantLabels.join(', ')}`;
    }
    if (full.mutations?.length) {
      const mutationLabels = full.mutations.map(m => {
        const opt = MUTATION_OPTIONS.find(o => o.value === m);
        return opt ? opt.label.toLowerCase() : m;
      });
      description += `, has ${mutationLabels.join(', ')}`;
    }
    // Clothing style
    if (full.clothingStyle && full.clothingStyle !== 'genre_default') {
      const styleOpt = CLOTHING_STYLE_OPTIONS.find(o => o.value === full.clothingStyle);
      description += `. Wearing ${styleOpt?.label || full.clothingStyle} style clothing`;
    }
    if (full.clothingDetails?.length) {
      const clothingLabels = full.clothingDetails.map(c => {
        const opt = CLOTHING_DETAIL_OPTIONS.find(o => o.value === c);
        return opt ? opt.label.toLowerCase() : c;
      });
      description += `, specifically ${clothingLabels.join(', ')}`;
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
export interface CharacterData { basicInfo: CharacterBasicInfo; appearance: CharacterAppearance; background: CharacterBackground; personality: CharacterPersonality; portraitUrl?: string | null; backstory?: any; }
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
