// Character Creation Types - Tiered Detail Levels + Legacy Types

// ========== NEW TIERED SYSTEM ==========
export type DetailLevel = 'simple' | 'detailed' | 'all';
export type Gender = 'male' | 'female' | 'other';

export interface SimpleAppearance {
  gender: Gender;
  height: 'short' | 'average' | 'tall' | 'very tall';
  build: 'slim' | 'average' | 'athletic' | 'muscular' | 'heavyset' | 'curvy';
  /** Optional approximate weight in kg (stored canonically as kg). */
  weightKg?: number;
  /** Preferred display unit for height/weight. Defaults to 'imperial'. */
  measurementUnit?: 'imperial' | 'metric';
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
  // Cup sizes for realistic body proportions (AA through K+)
  bustSize?: 'AA' | 'A' | 'B' | 'C' | 'D' | 'DD' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K';
  hipWidth?: 'narrow' | 'average' | 'wide' | 'very wide';
  // Muscle definition - from soft (none) to big (bodybuilder)
  muscleDefinition?: 'soft' | 'toned' | 'fit' | 'defined' | 'muscular' | 'very_muscular' | 'big';
  bodyHair?: 'none' | 'light' | 'moderate' | 'heavy';
  // Male-specific options
  shoulderWidth?: 'narrow' | 'average' | 'broad' | 'very_broad';
  physique?: string; // For male body shape preset tracking
  intimateDetails?: string;
  isHermaphrodite?: boolean;
  // Extended body modifications
  piercings?: string[];
  piercingStyle?: string; // Affects NPC reactions
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
  // Head - Ears
  { value: 'ear_lobe', label: 'Ear Lobe', category: 'ears' },
  { value: 'ear_helix', label: 'Ear Helix', category: 'ears' },
  { value: 'ear_industrial', label: 'Industrial Bar', category: 'ears' },
  { value: 'ear_tragus', label: 'Tragus', category: 'ears' },
  { value: 'ear_conch', label: 'Conch', category: 'ears' },
  { value: 'ear_daith', label: 'Daith', category: 'ears' },
  // Head - Face
  { value: 'nose_nostril', label: 'Nostril', category: 'face' },
  { value: 'nose_septum', label: 'Septum', category: 'face' },
  { value: 'nose_bridge', label: 'Bridge', category: 'face' },
  { value: 'eyebrow', label: 'Eyebrow', category: 'face' },
  { value: 'anti_eyebrow', label: 'Anti-Eyebrow', category: 'face' },
  { value: 'cheek_dermal', label: 'Cheek Dermal', category: 'face' },
  // Head - Mouth
  { value: 'lip_labret', label: 'Labret', category: 'mouth' },
  { value: 'lip_snake_bites', label: 'Snake Bites', category: 'mouth' },
  { value: 'lip_angel_bites', label: 'Angel Bites', category: 'mouth' },
  { value: 'lip_monroe', label: 'Monroe', category: 'mouth' },
  { value: 'lip_medusa', label: 'Medusa', category: 'mouth' },
  { value: 'tongue', label: 'Tongue', category: 'mouth' },
  { value: 'tongue_web', label: 'Tongue Web', category: 'mouth' },
  { value: 'smiley', label: 'Smiley', category: 'mouth' },
  // Body - Torso
  { value: 'navel', label: 'Navel/Belly Button', category: 'torso' },
  { value: 'nipple', label: 'Nipple', category: 'torso' },
  { value: 'dermal_chest', label: 'Chest Dermals', category: 'torso' },
  { value: 'dermal_sternum', label: 'Sternum Dermals', category: 'torso' },
  { value: 'dermal_hips', label: 'Hip Dermals', category: 'torso' },
  { value: 'corset_piercings', label: 'Corset Piercings', category: 'torso' },
  // Intimate (18+)
  { value: 'intimate_male', label: 'Prince Albert', category: 'intimate' },
  { value: 'intimate_female', label: 'VCH', category: 'intimate' },
  { value: 'intimate_other', label: 'Other Intimate', category: 'intimate' },
];

export const TATTOO_OPTIONS = [
  // Head - Face
  { value: 'face_tribal', label: 'Face Tribal', category: 'face' },
  { value: 'face_tears', label: 'Tear Drops', category: 'face' },
  { value: 'face_makeup', label: 'Cosmetic/Makeup', category: 'face' },
  { value: 'face_forehead', label: 'Forehead', category: 'face' },
  { value: 'face_temple', label: 'Temple', category: 'face' },
  // Head - Neck
  { value: 'neck_front', label: 'Front Neck', category: 'neck' },
  { value: 'neck_sides', label: 'Side Neck', category: 'neck' },
  { value: 'neck_back', label: 'Back of Neck', category: 'neck' },
  { value: 'neck_throat', label: 'Throat', category: 'neck' },
  // Head - Scalp
  { value: 'scalp', label: 'Scalp', category: 'head' },
  { value: 'behind_ear', label: 'Behind Ear', category: 'head' },
  // Arms - Upper
  { value: 'arm_sleeve_full', label: 'Full Sleeve', category: 'upper arms' },
  { value: 'arm_sleeve_half', label: 'Half Sleeve', category: 'upper arms' },
  { value: 'arm_bicep', label: 'Bicep', category: 'upper arms' },
  { value: 'shoulder', label: 'Shoulder', category: 'upper arms' },
  // Arms - Lower
  { value: 'arm_forearm', label: 'Forearm', category: 'lower arms' },
  { value: 'arm_inner_forearm', label: 'Inner Forearm', category: 'lower arms' },
  { value: 'wrist', label: 'Wrist', category: 'lower arms' },
  { value: 'hand', label: 'Hand', category: 'lower arms' },
  { value: 'fingers', label: 'Fingers', category: 'lower arms' },
  { value: 'knuckles', label: 'Knuckles', category: 'lower arms' },
  // Torso - Front
  { value: 'chest_full', label: 'Full Chest Piece', category: 'chest' },
  { value: 'chest_side', label: 'Side Chest', category: 'chest' },
  { value: 'sternum', label: 'Sternum', category: 'chest' },
  { value: 'under_breast', label: 'Under Breast', category: 'chest' },
  // Torso - Sides
  { value: 'ribs', label: 'Rib Cage', category: 'sides' },
  { value: 'side_torso', label: 'Side Torso', category: 'sides' },
  // Torso - Abdomen
  { value: 'stomach', label: 'Stomach', category: 'abdomen' },
  { value: 'navel_area', label: 'Navel Area', category: 'abdomen' },
  { value: 'hip_bones', label: 'Hip Bones', category: 'abdomen' },
  // Back - Upper
  { value: 'back_full', label: 'Full Back', category: 'upper back' },
  { value: 'back_upper', label: 'Upper Back', category: 'upper back' },
  { value: 'shoulder_blade', label: 'Shoulder Blade', category: 'upper back' },
  // Back - Lower
  { value: 'back_lower', label: 'Lower Back', category: 'lower back' },
  { value: 'back_spine', label: 'Spine', category: 'lower back' },
  { value: 'sacrum', label: 'Sacrum', category: 'lower back' },
  // Legs - Upper
  { value: 'thigh_front', label: 'Front Thigh', category: 'upper legs' },
  { value: 'thigh_side', label: 'Side Thigh', category: 'upper legs' },
  { value: 'thigh_back', label: 'Back Thigh', category: 'upper legs' },
  // Legs - Lower
  { value: 'calf', label: 'Calf', category: 'lower legs' },
  { value: 'shin', label: 'Shin', category: 'lower legs' },
  { value: 'leg_sleeve', label: 'Leg Sleeve', category: 'lower legs' },
  { value: 'ankle', label: 'Ankle', category: 'lower legs' },
  { value: 'foot', label: 'Foot', category: 'lower legs' },
  // Intimate (18+)
  { value: 'intimate_area', label: 'Intimate Area', category: 'intimate' },
  { value: 'inner_thigh', label: 'Inner Thigh', category: 'intimate' },
  { value: 'buttocks', label: 'Buttocks', category: 'intimate' },
];

// Cup size options - realistic bra sizes from AA to K
export const CUP_SIZE_OPTIONS = [
  { value: 'AA', label: 'AA', description: 'Very petite' },
  { value: 'A', label: 'A', description: 'Petite' },
  { value: 'B', label: 'B', description: 'Small' },
  { value: 'C', label: 'C', description: 'Average' },
  { value: 'D', label: 'D', description: 'Full' },
  { value: 'DD', label: 'DD/E', description: 'Large' },
  { value: 'E', label: 'E', description: 'Very full' },
  { value: 'F', label: 'F', description: 'Very large' },
  { value: 'G', label: 'G', description: 'Extra large' },
  { value: 'H', label: 'H', description: 'Huge' },
  { value: 'I', label: 'I', description: 'Massive' },
  { value: 'J', label: 'J', description: 'Enormous' },
  { value: 'K', label: 'K+', description: 'Extremely large' },
];

// Legacy bust options (mapped internally to cup sizes) - kept for backwards compatibility
export const BUST_OPTIONS = [{ value: 'B', label: 'Small' }, { value: 'C', label: 'Medium' }, { value: 'DD', label: 'Large' }, { value: 'G', label: 'Very Large' }];
export const HIP_OPTIONS = [{ value: 'narrow', label: 'Narrow' }, { value: 'average', label: 'Average' }, { value: 'wide', label: 'Wide' }, { value: 'very wide', label: 'Very Wide' }];

// Extended muscle options - from soft (no muscle) to big (bodybuilder)
export const MUSCLE_OPTIONS = [
  { value: 'soft', label: 'Soft', description: 'No visible muscle definition' },
  { value: 'toned', label: 'Toned', description: 'Light muscle definition' },
  { value: 'fit', label: 'Fit', description: 'Athletic with visible muscles' },
  { value: 'defined', label: 'Defined', description: 'Clear muscle separation' },
  { value: 'muscular', label: 'Muscular', description: 'Significant muscle mass' },
  { value: 'very_muscular', label: 'Very Muscular', description: 'Bodybuilder physique' },
  { value: 'big', label: 'Big', description: 'Extremely muscular, massive build' },
];

export const BODY_HAIR_OPTIONS = [{ value: 'none', label: 'None' }, { value: 'light', label: 'Light' }, { value: 'moderate', label: 'Moderate' }, { value: 'heavy', label: 'Heavy' }];

// Male physique presets
export const MALE_PHYSIQUE_OPTIONS = [
  { value: 'slim', label: 'Slim', description: 'Lean and slender' },
  { value: 'average', label: 'Average', description: 'Normal healthy build' },
  { value: 'athletic', label: 'Athletic', description: 'Fit with toned muscles' },
  { value: 'muscular', label: 'Muscular', description: 'Strong with defined muscles' },
  { value: 'bodybuilder', label: 'Bodybuilder', description: 'Very muscular, competition ready' },
  { value: 'stocky', label: 'Stocky', description: 'Broad and solid' },
  { value: 'dad_bod', label: 'Dad Bod', description: 'Soft with some muscle underneath' },
  { value: 'bear', label: 'Bear', description: 'Large, broad, and hairy' },
];

// Female body shape presets (expanded)
export const FEMALE_BODY_SHAPE_PRESETS = [
  { id: 'hourglass', label: 'Hourglass', bustSize: 'D', hipWidth: 'wide', muscle: 'toned' },
  { id: 'pear', label: 'Pear', bustSize: 'B', hipWidth: 'wide', muscle: 'soft' },
  { id: 'apple', label: 'Apple', bustSize: 'DD', hipWidth: 'narrow', muscle: 'soft' },
  { id: 'athletic', label: 'Athletic', bustSize: 'B', hipWidth: 'narrow', muscle: 'defined' },
  { id: 'rectangle', label: 'Rectangle', bustSize: 'B', hipWidth: 'average', muscle: 'toned' },
  { id: 'inverted_triangle', label: 'Inverted Triangle', bustSize: 'D', hipWidth: 'narrow', muscle: 'defined' },
  { id: 'petite', label: 'Petite', bustSize: 'A', hipWidth: 'narrow', muscle: 'soft' },
  { id: 'curvy', label: 'Curvy', bustSize: 'F', hipWidth: 'very wide', muscle: 'soft' },
  { id: 'fitness_model', label: 'Fitness Model', bustSize: 'C', hipWidth: 'average', muscle: 'muscular' },
  { id: 'amazonian', label: 'Amazonian', bustSize: 'D', hipWidth: 'wide', muscle: 'very_muscular' },
];

// Male body shape presets
export const MALE_BODY_SHAPE_PRESETS = [
  { id: 'slim', label: 'Slim', shoulderWidth: 'narrow', muscle: 'soft', bodyHair: 'light' },
  { id: 'average', label: 'Average', shoulderWidth: 'average', muscle: 'toned', bodyHair: 'moderate' },
  { id: 'athletic', label: 'Athletic', shoulderWidth: 'broad', muscle: 'defined', bodyHair: 'light' },
  { id: 'muscular', label: 'Muscular', shoulderWidth: 'broad', muscle: 'muscular', bodyHair: 'moderate' },
  { id: 'bodybuilder', label: 'Bodybuilder', shoulderWidth: 'very_broad', muscle: 'big', bodyHair: 'light' },
  { id: 'swimmer', label: 'Swimmer', shoulderWidth: 'broad', muscle: 'defined', bodyHair: 'none' },
  { id: 'stocky', label: 'Stocky', shoulderWidth: 'broad', muscle: 'muscular', bodyHair: 'heavy' },
  { id: 'dad_bod', label: 'Dad Bod', shoulderWidth: 'average', muscle: 'soft', bodyHair: 'moderate' },
  { id: 'bear', label: 'Bear', shoulderWidth: 'broad', muscle: 'soft', bodyHair: 'heavy' },
  { id: 'lean', label: 'Lean', shoulderWidth: 'average', muscle: 'fit', bodyHair: 'light' },
];

// Shoulder width options for males
export const SHOULDER_WIDTH_OPTIONS = [
  { value: 'narrow', label: 'Narrow' },
  { value: 'average', label: 'Average' },
  { value: 'broad', label: 'Broad' },
  { value: 'very_broad', label: 'Very Broad' },
];

// Tattoo style options
export const TATTOO_STYLE_OPTIONS = [
  { value: '', label: 'None/Natural', description: 'No specific style applied' },
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
  // ===== FEMALE CLOTHING =====
  { value: 'dress', label: 'Dress', category: 'female', gender: 'female' },
  { value: 'gown', label: 'Evening Gown', category: 'female', gender: 'female' },
  { value: 'skirt', label: 'Skirt', category: 'female', gender: 'female' },
  { value: 'blouse', label: 'Blouse', category: 'female', gender: 'female' },
  { value: 'crop_top', label: 'Crop Top', category: 'female', gender: 'female' },
  { value: 'bodysuit', label: 'Bodysuit', category: 'female', gender: 'female' },
  { value: 'corset', label: 'Corset', category: 'female', gender: 'female' },
  { value: 'sundress', label: 'Sundress', category: 'female', gender: 'female' },
  { value: 'romper', label: 'Romper', category: 'female', gender: 'female' },
  { value: 'camisole', label: 'Camisole', category: 'female', gender: 'female' },
  { value: 'heels', label: 'Heels', category: 'female', gender: 'female' },
  { value: 'flats', label: 'Flats', category: 'female', gender: 'female' },
  { value: 'stockings', label: 'Stockings', category: 'female', gender: 'female' },
  { value: 'miniskirt', label: 'Mini Skirt', category: 'female', gender: 'female' },
  { value: 'pencil_skirt', label: 'Pencil Skirt', category: 'female', gender: 'female' },
  { value: 'maxi_dress', label: 'Maxi Dress', category: 'female', gender: 'female' },
  { value: 'cocktail_dress', label: 'Cocktail Dress', category: 'female', gender: 'female' },
  { value: 'lingerie', label: 'Lingerie', category: 'female', gender: 'female' },
  
  // ===== ANDROGYNOUS / UNISEX CLOTHING =====
  { value: 't_shirt', label: 'T-Shirt', category: 'androgynous', gender: 'other' },
  { value: 'tank_top', label: 'Tank Top', category: 'androgynous', gender: 'other' },
  { value: 'long_sleeve', label: 'Long Sleeve Shirt', category: 'androgynous', gender: 'other' },
  { value: 'sweater', label: 'Sweater', category: 'androgynous', gender: 'other' },
  { value: 'hoodie', label: 'Hoodie', category: 'androgynous', gender: 'other' },
  { value: 'jacket', label: 'Jacket', category: 'androgynous', gender: 'other' },
  { value: 'coat', label: 'Coat', category: 'androgynous', gender: 'other' },
  { value: 'jeans', label: 'Jeans', category: 'androgynous', gender: 'other' },
  { value: 'pants', label: 'Pants', category: 'androgynous', gender: 'other' },
  { value: 'shorts', label: 'Shorts', category: 'androgynous', gender: 'other' },
  { value: 'leggings', label: 'Leggings', category: 'androgynous', gender: 'other' },
  { value: 'sweatpants', label: 'Sweatpants', category: 'androgynous', gender: 'other' },
  { value: 'jumpsuit', label: 'Jumpsuit', category: 'androgynous', gender: 'other' },
  { value: 'overalls', label: 'Overalls', category: 'androgynous', gender: 'other' },
  { value: 'sneakers', label: 'Sneakers', category: 'androgynous', gender: 'other' },
  { value: 'boots', label: 'Boots', category: 'androgynous', gender: 'other' },
  { value: 'sandals', label: 'Sandals', category: 'androgynous', gender: 'other' },
  { value: 'hat', label: 'Hat', category: 'androgynous', gender: 'other' },
  { value: 'scarf', label: 'Scarf', category: 'androgynous', gender: 'other' },
  { value: 'gloves', label: 'Gloves', category: 'androgynous', gender: 'other' },
  { value: 'cape', label: 'Cape/Cloak', category: 'androgynous', gender: 'other' },
  { value: 'vest', label: 'Vest', category: 'androgynous', gender: 'other' },
  { value: 'robe', label: 'Robe', category: 'androgynous', gender: 'other' },
  { value: 'uniform', label: 'Uniform', category: 'androgynous', gender: 'other' },
  
  // ===== MALE CLOTHING =====
  { value: 'suit', label: 'Suit', category: 'male', gender: 'male' },
  { value: 'tuxedo', label: 'Tuxedo', category: 'male', gender: 'male' },
  { value: 'dress_shirt', label: 'Dress Shirt', category: 'male', gender: 'male' },
  { value: 'polo', label: 'Polo Shirt', category: 'male', gender: 'male' },
  { value: 'blazer', label: 'Blazer', category: 'male', gender: 'male' },
  { value: 'cargo_pants', label: 'Cargo Pants', category: 'male', gender: 'male' },
  { value: 'slacks', label: 'Slacks', category: 'male', gender: 'male' },
  { value: 'loafers', label: 'Loafers', category: 'male', gender: 'male' },
  { value: 'dress_shoes', label: 'Dress Shoes', category: 'male', gender: 'male' },
  { value: 'leather_jacket', label: 'Leather Jacket', category: 'male', gender: 'male' },
  { value: 'peacoat', label: 'Peacoat', category: 'male', gender: 'male' },
  { value: 'suspenders', label: 'Suspenders', category: 'male', gender: 'male' },
  { value: 'tie', label: 'Tie', category: 'male', gender: 'male' },
  { value: 'bowtie', label: 'Bow Tie', category: 'male', gender: 'male' },
  { value: 'boxers', label: 'Boxers', category: 'male', gender: 'male' },
  { value: 'briefs', label: 'Briefs', category: 'male', gender: 'male' },
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
      if (full.muscleDefinition && full.muscleDefinition !== 'soft') description += `, ${full.muscleDefinition} muscles`;
      if (full.bodyHair && full.bodyHair !== 'none') description += `, ${full.bodyHair} body hair`;
    }
    // Extended body modifications
    if (full.piercings?.length) {
      const piercingStyle = (full as any).piercingStyle ? ` (${(full as any).piercingStyle} style)` : '';
      const piercingLabels = full.piercings.map(p => {
        const opt = PIERCING_OPTIONS.find(o => o.value === p);
        return opt ? opt.label.toLowerCase() + ' piercing' : p;
      });
      description += `, with${piercingStyle} ${piercingLabels.join(', ')}`;
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

  // ===== PHYSICALITY AWARENESS (for AI + NPC reactivity) =====
  // Tell the narrator how the character's size/build should affect the world
  // and how NPCs perceive and react to them. Applied at every detail level.
  const physicality: string[] = [];

  switch (simple.height) {
    case 'short':
      physicality.push(
        "Short stature (under ~5'4\"): fits easily through low tunnels, crawlspaces, vents, child-sized doors, and cramped hideouts that taller people must duck or squeeze through; often overlooked in crowds; struggles to reach high shelves, see over counters, or grapple taller foes head-on; NPCs may underestimate, condescend, mistake them for younger, or move objects out of reach."
      );
      break;
    case 'tall':
      physicality.push(
        "Tall stature (~5'10\"–6'2\"): commanding presence, easy line of sight over crowds, longer reach in melee; must duck through low doorways, awkward in compact vehicles and cramped quarters; NPCs read them as authoritative or intimidating on first glance."
      );
      break;
    case 'very tall':
      physicality.push(
        "Very tall stature (over 6'2\"): physically dominates a room, intimidating without trying; CANNOT comfortably enter cramped tunnels, low attics, child-sized passages, small vehicles, or coffin-sized hiding spots without stooping, crawling, or getting stuck; bumps head on standard fixtures; immediately memorable to witnesses and hard to disguise; NPCs stare, give wider berth, or feel threatened."
      );
      break;
    case 'average':
    default:
      physicality.push(
        "Average stature: fits standard human-built spaces without special accommodation; blends into crowds; NPCs treat them as unremarkable in size."
      );
      break;
  }

  switch (simple.build) {
    case 'slim':
      physicality.push(
        "Slim build: nimble and quick, slips through narrow gaps, climbs and balances well, fast on their feet; tires faster in raw strength contests and hits lighter in melee; NPCs may read as fragile, non-threatening, or easy to push around."
      );
      break;
    case 'athletic':
      physicality.push(
        "Athletic build: balanced stamina, strength, and agility; NPCs read as capable and healthy without being intimidating."
      );
      break;
    case 'muscular':
      physicality.push(
        "Muscular build: visibly strong, hits hard, can force doors and carry heavy loads; doesn't fit through tight gaps as cleanly as slimmer builds; NPCs treat them as a physical threat and defer in confrontations."
      );
      break;
    case 'heavyset':
      physicality.push(
        "Heavyset build: heavy and solidly grounded — hard to knock down or shove, strong grappler, can absorb hits; SLOWER in sprints and long chases, struggles with narrow alleys, tight squeezes, ladders, climbing, and prolonged stealth; NPCs may underestimate stamina or unfairly judge based on size."
      );
      break;
    case 'curvy':
      physicality.push(
        "Curvy build: pronounced silhouette draws attention in any room; NPCs notice immediately, react with attraction, jealousy, or judgment depending on culture; harder to move unnoticed; certain fitted clothing and tight passages don't accommodate the figure cleanly."
      );
      break;
    case 'average':
    default:
      physicality.push(
        "Average build: unremarkable physical presence; no special advantages or limitations in tight spaces or physical contests."
      );
      break;
  }

  // Weight-based reactivity (optional — only when player set a weight)
  if (typeof simple.weightKg === 'number' && simple.weightKg > 0) {
    const w = simple.weightKg;
    const lb = Math.round(w * 2.20462);
    let weightCue = '';
    if (w < 50) weightCue = `Very light frame (~${w}kg / ${lb}lb): easily lifted, carried, or knocked aside; struggles with heavy gear, recoil, and grappling stronger foes; NPCs may pick them up, shove past, or doubt their physical credibility.`;
    else if (w < 65) weightCue = `Light frame (~${w}kg / ${lb}lb): quick on their feet, low presence in melee impact; standard armor and packs feel heavier on this frame.`;
    else if (w < 85) weightCue = `Average weight (~${w}kg / ${lb}lb): unremarkable physical inertia in NPC perception.`;
    else if (w < 105) weightCue = `Heavier frame (~${w}kg / ${lb}lb): hard to shove off-balance, hits with more momentum; faster fatigue on long climbs and sprints; chairs creak, narrow seating may be tight.`;
    else weightCue = `Very heavy frame (~${w}kg / ${lb}lb): immovable in grapples, intimidating mass, breaks fragile furniture; CANNOT fit into tight crawlspaces, small vehicles, or low-weight rope/ledge scenarios without consequence; NPCs visibly notice and may make assumptions (kind or cruel) based on size.`;
    physicality.push(weightCue);
  }

  description += `\n\nPHYSICALITY AWARENESS (apply continuously in narration and NPC reactions): ${physicality.join(' ')} The narrator MUST respect these physical realities when describing environments, action outcomes, stealth, combat reach, and first impressions, and NPCs MUST react to the character's size and build in a way consistent with their own personality and culture.`;

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
