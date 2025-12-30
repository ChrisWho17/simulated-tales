// Portrait Prompt Builder for FLUX.1 Schnell
// Optimized for realistic, waist-up character portraits with detailed environments

// Core style - realistic digital art, knees-up framing with visible environment
export const STYLE_BASE = `masterpiece, best quality, ultra detailed digital painting, realistic style, cinematic lighting, dramatic atmosphere, three-quarter body shot from knees up, full environment visible in background, character in foreground with detailed background scenery, looking at viewer, highly detailed face and eyes, intricate clothing and gear details, professional illustration, 8k resolution, volumetric lighting, depth of field, wide shot composition`;

export const NEGATIVE_PROMPT = `worst quality, low quality, blurry, bad anatomy, bad hands, missing fingers, extra fingers, watermark, signature, text, logo, cropped, out of frame, duplicate, deformed, disfigured, ugly, anime, cartoon, 3d render, plastic, cgi, simple background, plain background, white background`;

export const GENRE_STYLES: Record<string, { style: string; backgrounds: string[] }> = {
  modern: {
    style: 'modern contemporary casual clothing, everyday civilian attire, realistic modern fashion, comfortable everyday wear, stylish casual outfit',
    backgrounds: ['modern city street with shops and cafes', 'contemporary urban park with trees', 'modern office building interior', 'cozy coffee shop interior', 'suburban neighborhood street'],
  },
  'modern-life': {
    style: 'modern contemporary casual clothing, everyday civilian attire, realistic modern fashion, comfortable everyday wear, stylish casual outfit',
    backgrounds: ['modern city street with shops and cafes', 'contemporary urban park with trees', 'modern office building interior', 'cozy coffee shop interior', 'suburban neighborhood street'],
  },
  war: {
    style: 'military combat uniform, tactical body armor, ammunition pouches, combat webbing, military radio equipment, dog tags, battle-worn gear',
    backgrounds: ['epic warzone battlefield with explosions and black smoke', 'burning urban combat zone with destroyed vehicles', 'intense firefight scene with tracer rounds', 'military base under attack with dramatic lighting', 'trench warfare with artillery explosions'],
  },
  cyberpunk: {
    style: 'cyberpunk tactical gear, glowing cybernetic augmentations, high-tech body armor with neon accents, holographic HUD elements, chrome cybernetic limbs',
    backgrounds: ['neon-lit cyberpunk megacity at night with rain and holograms', 'dark cyberpunk alleyway with neon signs and steam', 'high-tech corporate facility with holographic displays', 'dystopian cityscape with massive neon advertisements'],
  },
  postapoc: {
    style: 'post-apocalyptic scavenged armor, makeshift tactical gear, weathered leather and metal, survival equipment, gas mask, improvised weapons',
    backgrounds: ['desolate wasteland with ruined city skyline', 'overgrown abandoned city with nature reclaiming buildings', 'dusty desert wasteland with wrecked vehicles', 'radioactive ruins with ominous sky'],
  },
  scifi: {
    style: 'advanced sci-fi power armor, futuristic tactical suit, energy shields, high-tech helmet with HUD, sleek military equipment, glowing power cells',
    backgrounds: ['massive spaceship bridge with holographic displays', 'alien planet surface with strange atmosphere', 'futuristic space station interior', 'epic space battle visible through viewport'],
  },
  ww2: {
    style: '1940s military uniform, period-accurate combat gear, M1 helmet, vintage military equipment, leather boots, canvas webbing',
    backgrounds: ['World War 2 European battlefield with trenches', 'bombed French village with rubble', 'D-Day beach with obstacles', 'underground bunker with maps and radio equipment'],
  },
  medieval: {
    style: 'realistic medieval plate armor, chainmail underneath, leather straps and buckles, heraldic symbols, battle-damaged metal, sword and shield',
    backgrounds: ['epic medieval castle siege with catapults', 'dark enchanted forest with mystical fog', 'bloody medieval battlefield with fallen warriors', 'grand castle throne room with banners'],
  },
  fantasy: {
    style: 'high fantasy armor and robes, magical enchanted equipment, glowing runes and symbols, mystical accessories, elaborate fantasy weapons',
    backgrounds: ['ancient magical forest with glowing particles', 'epic fantasy castle with dramatic sky', 'mystical realm with floating islands', 'dragon lair with treasure'],
  },
  horror: {
    style: 'survival horror gear, blood-stained clothing, improvised weapons, torn and dirty attire, flashlight or lantern',
    backgrounds: ['abandoned hospital corridor with flickering lights', 'fog-shrouded graveyard at night', 'decrepit haunted mansion interior', 'dark forest with ominous shadows'],
  },
  western: {
    style: 'authentic wild west attire, dusty leather duster, cowboy hat, period-accurate revolvers, worn boots, bandolier',
    backgrounds: ['dusty frontier town main street at high noon', 'dramatic desert canyon at sunset', 'old western saloon interior', 'vast prairie with storm approaching'],
  },
  noir: {
    style: 'classic film noir attire, 1940s fedora and trench coat, dramatic shadows on face, vintage firearms, cigarette smoke',
    backgrounds: ['rainy noir city street with neon signs', 'smoky detective office with venetian blinds', 'dimly lit jazz bar', 'dark alleyway with single streetlight'],
  },
  mystery: {
    style: 'classic film noir attire, 1940s fedora and trench coat, dramatic shadows on face, vintage firearms',
    backgrounds: ['rainy noir city street with neon signs', 'smoky detective office with venetian blinds', 'dimly lit jazz bar', 'dark alleyway with single streetlight'],
  },
  pirate: {
    style: 'golden age pirate attire, weathered captain coat, tricorn hat, cutlass and flintlock pistol, sea-worn appearance',
    backgrounds: ['ship deck during dramatic storm', 'tropical island cove at sunset', 'port tavern with candlelight', 'treasure cave with gold'],
  },
  survival: {
    style: 'rugged survival gear, weathered outdoor clothing, backpack with supplies, hunting equipment, practical tools',
    backgrounds: ['wilderness campsite in dense forest', 'abandoned mountain cabin', 'harsh winter environment', 'dense jungle with ancient ruins'],
  },
  steampunk: {
    style: 'Victorian steampunk attire, brass goggles, clockwork mechanisms, leather and copper accessories, steam-powered gadgets',
    backgrounds: ['Victorian industrial city with steam and smoke', 'airship deck above clouds', 'clockwork laboratory with gears', 'steampunk factory interior'],
  },
  apocalypse: {
    style: 'post-apocalyptic survivor gear, scavenged armor pieces, makeshift weapons, gas mask, weathered practical clothing',
    backgrounds: ['nuclear wasteland with ruined buildings', 'abandoned highway with wrecked vehicles', 'survivor camp in ruins', 'toxic environment with hazmat zones'],
  },
  vampire: {
    style: 'gothic vampire aristocrat attire, Victorian dark elegance, pale complexion, blood-red accents, mysterious dangerous',
    backgrounds: ['gothic castle interior at night', 'moonlit graveyard with mist', 'Victorian ballroom with candles', 'dark forest with pale moonlight'],
  },
  zombie: {
    style: 'zombie apocalypse survivor gear, reinforced clothing, improvised armor, blood-stained, desperate determined',
    backgrounds: ['overrun city streets with abandoned cars', 'barricaded building interior', 'deserted shopping mall', 'foggy highway with shambling figures'],
  },
  superhero: {
    style: 'superhero costume with cape or tactical suit, symbol on chest, dramatic heroic pose, powerful confident',
    backgrounds: ['city skyline at sunset', 'rooftop overlooking metropolis', 'secret base interior', 'dramatic sky with clouds'],
  },
  spy: {
    style: 'sleek spy attire, tailored suit or tactical stealth gear, concealed weapons, sophisticated gadgets, mysterious',
    backgrounds: ['casino interior with lights', 'secret underground base', 'exotic foreign location', 'high-tech surveillance room'],
  },
};

export const ROLE_STYLES: Record<string, string> = {
  soldier: 'infantry soldier holding assault rifle, full tactical vest with ammunition pouches, combat helmet with goggles, dog tags visible, knee pads, combat boots, military radio on shoulder',
  medic: 'combat medic with red cross armband, large medical backpack with supplies visible, first aid pouches on vest, blood-stained tactical gloves, medical scissors in pouch, radio equipment',
  sniper: 'sniper specialist in ghillie suit elements, holding scoped sniper rifle, camouflage face paint, spotting scope, tactical vest with spare magazines, low profile helmet',
  heavy: 'heavy weapons specialist carrying large machine gun, ammunition belts draped across chest, reinforced body armor with extra plating, heavy duty gloves, knee and elbow pads',
  engineer: 'combat engineer with tool belt and equipment, welding goggles pushed up on forehead, grease-stained tactical uniform, explosives pouches, multitool on belt',
  pilot: 'fighter pilot in full flight suit, aviator helmet with visor, oxygen mask around neck, flight patches on shoulders, survival vest with emergency gear',
  tank: 'tank commander in tanker helmet with built-in goggles, leather tanker jacket with oil stains, intercom headset, binoculars around neck, pistol holster',
  officer: 'military officer in decorated tactical uniform, command insignia visible, medals on chest, command radio, pistol in thigh holster, authoritative posture',
  scout: 'recon scout in lightweight tactical gear, compact binoculars, suppressed carbine, camouflage pattern uniform, minimal equipment for mobility, range finder',
  spec_ops: 'special forces operator in all-black tactical gear, night vision goggles mounted on helmet, suppressed rifle with attachments, tactical mask, advanced communication gear',
  knight: 'armored knight in realistic battle-worn plate armor, chainmail visible at joints, family crest on breastplate, sword at hip, shield with heraldic design, noble bearing',
  rogue: 'rogue assassin in dark leather armor with hood, multiple hidden blade sheaths, throwing knives on belt, grappling hook, lockpicks visible, mysterious dangerous appearance',
  mage: 'battle mage in enchanted armored robes, glowing arcane symbols on clothing, ornate magical staff with crystal, mystical energy around hands, arcane tome at belt',
  survivor: 'post-apocalyptic survivor in scavenged mismatched armor, makeshift weapon, gas mask hanging from neck, water canteen, survival tools, weathered determined appearance',
  mercenary: 'professional mercenary in mixed high-quality tactical gear, no unit insignia, multiple weapons visible, expensive equipment, cold professional demeanor',
  ranger: 'wilderness ranger with longbow and quiver, hooded forest cloak with animal fur trim, leather armor with leaf patterns, hunting knife, tracking equipment',
  paladin: 'holy paladin in ornate blessed plate armor with divine symbols, glowing holy aura, sacred weapon, religious iconography, righteous determined expression',
  berserker: 'berserker warrior with tribal war paint, massive two-handed weapon, scarred muscular exposed arms, bone and tooth trophies, fierce battle-ready expression',
  detective: 'hardboiled detective in long trench coat, fedora hat, badge visible on belt, revolver in shoulder holster, cigarette, world-weary experienced expression',
  criminal: 'hardened criminal in street clothes with concealed weapon bulge, facial scars, tattoos visible on neck and hands, dangerous intimidating presence',
  scientist: 'field scientist in lab coat over tactical gear, data pad in hand, protective goggles, sample containers on belt, analytical focused expression',
  rebel: 'resistance fighter in improvised tactical gear with revolutionary symbols, modified civilian weapons, passionate defiant expression, worn but determined appearance',
  // Class name mappings for common RPG classes
  'infantry grunt': 'infantry soldier holding assault rifle, full tactical vest with ammunition pouches, combat helmet, dog tags, military radio, combat boots',
  'combat medic': 'combat medic with red cross armband, large medical backpack, first aid pouches, blood-stained gloves, medical equipment visible',
  'heavy gunner': 'heavy weapons specialist carrying large machine gun, ammunition belts across chest, reinforced body armor, heavy gloves',
  adventurer: 'adventurer in practical traveling gear, versatile equipment, worn leather armor, various pouches and tools, ready for anything expression',
};

export const EMOTION_STYLES: Record<string, string> = {
  neutral: 'neutral confident expression, steady professional gaze, calm composure',
  determined: 'determined fierce expression, intense focused eyes, set jaw, unwavering resolve',
  combat: 'combat ready aggressive expression, battle stance, fierce warrior intensity, adrenaline',
  wounded: 'wounded pained expression, blood on face, exhausted but fighting, battle damage visible',
  confident: 'confident slight smirk, self-assured victorious expression, knowing superiority',
  angry: 'angry furious expression, snarling rage, intense burning eyes, aggressive',
  serious: 'serious stoic expression, professional unreadable, military bearing',
  cold: 'cold emotionless expression, calculating predatory gaze, dangerous calm',
  smirk: 'confident smirk, cocky knowing expression, playful danger',
  happy: 'warm genuine smile, bright happy expression, relaxed posture',
  sad: 'melancholic expression, distant thousand-yard stare, deep sorrow',
  scared: 'fearful expression, wide eyes, tense body language, survival instinct',
  tired: 'exhausted tired expression, bags under eyes, weary but determined',
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
  // Full appearance (18+) options
  bustSize?: string;
  hipWidth?: string;
  muscleDefinition?: string;
  intimateDetails?: string;
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
  
  // Gender with more realistic descriptors
  const gender = character.gender?.toLowerCase() === 'female'
    ? 'female, beautiful feminine features, detailed realistic face, soft cheekbones, full lips'
    : character.gender?.toLowerCase() === 'nonbinary'
    ? 'androgynous features, ambiguous gender presentation, attractive face'
    : 'male, handsome masculine features, strong jawline, detailed realistic face';
  
  // Physical attributes with more detail - expanded build types
  const build = character.build || 'athletic';
  const BUILD_DESCRIPTIONS: Record<string, string> = {
    muscular: 'muscular athletic build, toned physique, strong arms, defined muscles',
    slim: 'slim athletic build, lean physique, slender frame',
    large: 'large powerful build, imposing physique, broad frame',
    heavyset: 'heavyset large build, broad heavy frame, imposing presence',
    curvy: 'curvy hourglass figure, full bust, wide hips, narrow waist, voluptuous feminine silhouette',
    thick: 'thick curvy build, full figured, soft curves',
    lithe: 'lithe graceful build, elegant slender, dancer physique',
    athletic: 'athletic fit build, toned physique',
    average: 'average build, normal proportions',
    stocky: 'stocky sturdy build, compact powerful',
    petite: 'petite small frame, delicate build',
  };
  const buildDesc = BUILD_DESCRIPTIONS[build] || BUILD_DESCRIPTIONS.athletic;
  
  const hairColor = character.hairColor || 'brown';
  const hairStyle = character.hairStyle || character.hairLength || 'short';
  const eyeColor = character.eyeColor ? `striking ${character.eyeColor} eyes with detail` : '';
  const skinTone = character.skinTone ? `${character.skinTone} skin tone` : '';
  
  // Optional details - enhanced for realism
  const details: string[] = [];
  if (character.hasTattoos || character.details?.includes('tattoos')) {
    details.push('detailed realistic tattoos, sleeve tattoos on arms, military or meaningful tattoo designs');
  }
  if (character.hasScars || character.details?.includes('scars')) {
    details.push('realistic battle scars, healed wounds visible on skin');
  }
  if (character.hasCybernetics || character.details?.includes('cybernetics')) {
    details.push('detailed cybernetic augmentations, chrome mechanical parts, glowing tech elements');
  }
  if (character.hasBeard || character.details?.includes('beard')) {
    details.push('well-groomed tactical beard, facial hair with detail');
  }
  
  // Full appearance (18+) customizations - bust, hips, muscle, intimate details
  if (character.bustSize && character.bustSize !== 'medium') {
    const bustDescriptions: Record<string, string> = {
      'flat': 'flat chest, small bust',
      'small': 'small bust, petite chest',
      'large': 'large bust, full chest, prominent cleavage',
      'very large': 'very large bust, huge breasts, prominent cleavage, voluptuous',
      'very_large': 'very large bust, huge breasts, prominent cleavage, voluptuous',
    };
    if (bustDescriptions[character.bustSize]) {
      details.push(bustDescriptions[character.bustSize]);
    }
  }
  
  if (character.hipWidth && character.hipWidth !== 'average') {
    const hipDescriptions: Record<string, string> = {
      'narrow': 'narrow hips, slim waist',
      'wide': 'wide hips, curvy waist, hourglass figure',
      'very wide': 'very wide hips, extremely curvy, thick thighs, voluptuous hourglass',
      'very_wide': 'very wide hips, extremely curvy, thick thighs, voluptuous hourglass',
    };
    if (hipDescriptions[character.hipWidth]) {
      details.push(hipDescriptions[character.hipWidth]);
    }
  }
  
  if (character.muscleDefinition && character.muscleDefinition !== 'toned') {
    const muscleDescriptions: Record<string, string> = {
      'none': 'soft body, no visible muscle',
      'light': 'lightly toned, subtle muscle definition',
      'defined': 'defined muscles, visible abs, toned arms',
      'athletic': 'athletic muscular, visible abs, toned arms',
      'very muscular': 'heavily muscular, bodybuilder physique, prominent muscles',
      'bodybuilder': 'heavily muscular, bodybuilder physique, prominent muscles',
    };
    if (muscleDescriptions[character.muscleDefinition]) {
      details.push(muscleDescriptions[character.muscleDefinition]);
    }
  }
  
  // Custom intimate details - clothing, features, etc. (PRIORITIZED - user's custom input)
  if (character.intimateDetails && character.intimateDetails.trim()) {
    details.push(character.intimateDetails.trim());
  }
  
  if (character.customDescription) {
    details.push(character.customDescription);
  }
  
  return [
    STYLE_BASE,
    gender,
    buildDesc,
    skinTone,
    `${hairColor} ${hairStyle} hair with realistic detail`,
    eyeColor,
    roleStyle,
    genreConfig.style,
    emotionStyle,
    details.join(', '),
    `dramatic background: ${background}`,
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
