// Portrait Prompt Builder for FLUX.1 Schnell

// Core style - defines the look
export const STYLE_BASE = `masterpiece, best quality, highly detailed digital illustration, semi-realistic anime style, dramatic cinematic lighting, portrait, upper body shot, looking at viewer, detailed face, intricate details, 8k resolution`;

export const NEGATIVE_PROMPT = `worst quality, low quality, blurry, bad anatomy, bad hands, missing fingers, extra fingers, watermark, signature, text, logo, cropped, out of frame, duplicate, deformed, disfigured, ugly, cartoon, 3d render, plastic`;

export const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern military tactical, urban warfare, kevlar vest, tactical harness, combat gear',
    backgrounds: ['destroyed urban environment with smoke', 'warzone cityscape with fire', 'military base at dawn', 'smoky battlefield'],
  },
  war: {
    style: 'military combat gear, tactical equipment, battle-worn uniform, dog tags, military insignia',
    backgrounds: ['warzone battlefield with smoke', 'military forward operating base', 'destroyed urban combat zone', 'trench warfare scene'],
  },
  cyberpunk: {
    style: 'cyberpunk aesthetic, neon lights, cybernetic augmentations, high-tech armor, holographic elements',
    backgrounds: ['neon-lit megacity at night', 'cyberpunk alleyway with rain', 'high-tech facility'],
  },
  postapoc: {
    style: 'post-apocalyptic, weathered gear, scrap armor, dust and grime, survival equipment',
    backgrounds: ['wasteland desert with ruins', 'ruined overgrown city', 'abandoned facility'],
  },
  scifi: {
    style: 'sci-fi military, futuristic armor, energy weapons, sleek helmet, advanced materials',
    backgrounds: ['spaceship bridge interior', 'alien planet surface', 'space station corridor'],
  },
  ww2: {
    style: '1940s military, world war 2 era, period accurate uniform, vintage equipment',
    backgrounds: ['European battlefield trenches', 'war-torn village', 'bunker interior'],
  },
  medieval: {
    style: 'medieval fantasy, plate armor, chainmail, leather straps, heraldic symbols, battle-worn',
    backgrounds: ['castle courtyard at sunset', 'medieval battlefield', 'dark forest'],
  },
  fantasy: {
    style: 'high fantasy, magical attire, enchanted accessories, mystical aura',
    backgrounds: ['ancient magical forest', 'fantasy castle interior', 'mystical realm'],
  },
  horror: {
    style: 'dark horror aesthetic, survival gear, blood-stained, gritty realism',
    backgrounds: ['abandoned hospital corridor', 'fog-shrouded graveyard', 'decrepit mansion'],
  },
  western: {
    style: 'wild west era, cowboy attire, dusty leather, period weapons',
    backgrounds: ['dusty frontier town', 'desert canyon at sunset', 'saloon interior'],
  },
  noir: {
    style: 'film noir aesthetic, 1940s detective attire, dramatic shadows, moody lighting',
    backgrounds: ['rainy city street at night', 'smoky detective office', 'dimly lit bar'],
  },
  survival: {
    style: 'survival gear, weathered clothing, makeshift equipment, resourceful appearance',
    backgrounds: ['wilderness campsite', 'abandoned shelter', 'harsh environment'],
  },
};

export const ROLE_STYLES: Record<string, string> = {
  soldier: 'infantry soldier, assault rifle, tactical vest, combat helmet, dog tags',
  medic: 'combat medic, red cross armband, medical backpack, first aid equipment, blood-stained gloves',
  sniper: 'sniper specialist, ghillie elements, scoped rifle, camouflage face paint',
  heavy: 'heavy weapons specialist, large machine gun, ammo belts, reinforced armor',
  engineer: 'combat engineer, tool belt, welding goggles, grease-stained uniform',
  pilot: 'fighter pilot, flight suit, aviator helmet, oxygen mask',
  tank: 'tank commander, tanker helmet with goggles, leather jacket, oil stains, intercom headset',
  officer: 'military officer, decorated uniform, medals on chest, command presence',
  scout: 'recon scout, light tactical gear, binoculars, stealth equipment',
  spec_ops: 'special forces operator, night vision on helmet, suppressed weapon, black tactical gear',
  knight: 'armored knight, ornate plate armor, family crest, noble bearing',
  rogue: 'rogue assassin, dark leather armor, hidden blades, hood',
  mage: 'battle mage, arcane symbols glowing, magical staff, armored robes',
  survivor: 'apocalypse survivor, makeshift armor, scavenged gear',
  mercenary: 'professional mercenary, mixed military gear, no insignia',
  ranger: 'wilderness ranger, bow and quiver, forest cloak, animal fur trim',
  paladin: 'holy paladin, ornate blessed armor, divine symbols, righteous aura',
  berserker: 'berserker warrior, war paint, massive weapon, scarred muscular',
  detective: 'hardboiled detective, long coat, badge visible, world-weary',
  criminal: 'hardened criminal, street clothes, concealed weapon, dangerous',
  scientist: 'field scientist, lab coat over tactical gear, data pad, goggles',
  rebel: 'resistance fighter, improvised gear, revolutionary symbols, defiant',
  // Class name mappings for common RPG classes
  'infantry grunt': 'infantry soldier, assault rifle, tactical vest, combat helmet, dog tags',
  'combat medic': 'combat medic, red cross armband, medical backpack, first aid equipment',
  'heavy gunner': 'heavy weapons specialist, large machine gun, ammo belts, reinforced armor',
};

export const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral calm expression, steady professional gaze',
  determined: 'determined fierce expression, intense focused eyes, set jaw',
  combat: 'combat ready expression, aggressive battle stance, fierce',
  wounded: 'wounded pained expression, blood on face, exhausted',
  confident: 'confident slight smile, self-assured, victorious',
  angry: 'angry furious expression, snarling rage',
  serious: 'serious stoic expression, professional unreadable',
  cold: 'cold emotionless expression, calculating predatory',
  smirk: 'confident smirk, cocky expression, knowing look',
  happy: 'warm genuine smile, bright happy expression',
  sad: 'melancholic expression, distant gaze, sorrow',
  scared: 'fearful expression, wide eyes, tense',
  tired: 'exhausted tired expression, bags under eyes, weary',
};

export interface CharacterAppearance {
  gender?: string;
  build?: string;
  height?: string;
  hairColor?: string;
  hairStyle?: string;
  hairLength?: string;
  eyeColor?: string;
  skinTone?: string;
  role?: string;
  details?: string[];
  hasTattoos?: boolean;
  hasScars?: boolean;
  hasCybernetics?: boolean;
  hasBeard?: boolean;
  customDescription?: string;
}

export function buildPortraitPrompt(
  character: CharacterAppearance,
  genre: string = 'modern',
  emotion: string = 'neutral',
  className?: string
): string {
  const genreConfig = GENRE_STYLES[genre.toLowerCase()] || GENRE_STYLES.modern;
  const emotionStyle = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  const background = genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)];
  
  // Determine role style from class name or role
  let roleStyle = '';
  if (className) {
    const classLower = className.toLowerCase();
    roleStyle = ROLE_STYLES[classLower] || ROLE_STYLES[character.role || ''] || '';
  } else if (character.role) {
    roleStyle = ROLE_STYLES[character.role.toLowerCase()] || '';
  }
  
  // Gender
  const gender = character.gender?.toLowerCase() === 'female'
    ? 'female, feminine features, beautiful face, soft cheekbones'
    : character.gender?.toLowerCase() === 'nonbinary'
    ? 'androgynous features, ambiguous gender presentation'
    : 'male, masculine features, strong jawline';
  
  // Physical attributes
  const build = character.build || 'athletic';
  const hairColor = character.hairColor || 'brown';
  const hairStyle = character.hairStyle || character.hairLength || 'short';
  const eyeColor = character.eyeColor ? `${character.eyeColor} eyes` : '';
  const skinTone = character.skinTone ? `${character.skinTone} skin tone` : '';
  
  // Optional details
  const details: string[] = [];
  if (character.hasTattoos || character.details?.includes('tattoos')) {
    details.push('military tattoos, sleeve tattoos');
  }
  if (character.hasScars || character.details?.includes('scars')) {
    details.push('facial scars, battle damage');
  }
  if (character.hasCybernetics || character.details?.includes('cybernetics')) {
    details.push('cybernetic augmentations');
  }
  if (character.hasBeard || character.details?.includes('beard')) {
    details.push('tactical beard, stubble');
  }
  if (character.customDescription) {
    details.push(character.customDescription);
  }
  
  return [
    STYLE_BASE,
    gender,
    `${build} build`,
    skinTone,
    `${hairColor} ${hairStyle} hair`,
    eyeColor,
    roleStyle,
    genreConfig.style,
    emotionStyle,
    details.join(', '),
    `background: ${background}`,
  ].filter(Boolean).join(', ');
}

// Quick prompt builder for simpler use cases
export function quickPortraitPrompt(
  gender: string,
  role: string,
  genre: string = 'modern'
): string {
  const genreConfig = GENRE_STYLES[genre.toLowerCase()] || GENRE_STYLES.modern;
  const roleStyle = ROLE_STYLES[role.toLowerCase()] || ROLE_STYLES.soldier;
  const bg = genreConfig.backgrounds[Math.floor(Math.random() * genreConfig.backgrounds.length)];
  
  const genderStr = gender?.toLowerCase() === 'female'
    ? 'female, feminine features, beautiful face'
    : 'male, masculine features, strong jawline';
  
  return `${STYLE_BASE}, ${genderStr}, athletic build, ${roleStyle}, ${genreConfig.style}, determined expression, background: ${bg}`;
}

// Build emotion variant from base prompt
export function buildEmotionPrompt(basePrompt: string, emotion: string): string {
  const emotionStr = EMOTION_STYLES[emotion] || EMOTION_STYLES.neutral;
  
  // Replace existing emotion or add it
  if (basePrompt.includes('expression')) {
    return basePrompt.replace(/[a-z]+ expression[^,]*/gi, emotionStr);
  } else {
    return basePrompt.replace('background:', `${emotionStr}, background:`);
  }
}
