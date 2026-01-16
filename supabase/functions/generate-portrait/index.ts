import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STRUCTURED LAYERED PROMPT SYSTEM
// Priority: Layer 1 (Identity) → Layer 2 (Physical) → Layer 2.5 (Details) → Layer 3 (Context) → Layer 4 (Style)
// ============================================================================

// LAYER 4: Photography Style - FLUX.1-dev INTENSIFIED for maximum quality
const LAYER_STYLE = {
  // Intensified medium for FLUX.1-dev's capabilities
  medium: 'masterpiece ultra-detailed cinematic portrait, award-winning digital illustration, trending on artstation and CGSociety, concept art quality, AAA game character design, rendered in Unreal Engine 5 with ray-traced global illumination',
  
  // Enhanced quality descriptors
  quality: 'photorealistic skin with subsurface scattering, intricate fabric textures with visible weave patterns, hyper-detailed eyes with realistic iris patterns and light reflections, individual hair strands visible, volumetric atmospheric lighting, film grain, chromatic aberration, professional color grading, 8K UHD resolution, HDR, physically based rendering',
  
  // Intensified framing with cinematographic direction
  framing: 'three-quarter body portrait from knees to head, dynamic slight angle pose, powerful confident stance, direct eye contact with the viewer, cinematic shallow depth of field with bokeh background, rim lighting highlighting silhouette, dramatic chiaroscuro lighting from above-left',
  
  // Additional style layers for FLUX.1-dev
  atmosphere: 'moody atmospheric haze, dust particles catching light, environmental storytelling through background details',
  
  // Artistic direction
  artisticStyle: 'inspired by Craig Mullins, Ruan Jia, Greg Rutkowski, Artgerm, and Alphonse Mucha, blending realism with painterly brush strokes',
};

// Intensified negative prompts with comprehensive exclusions
const NEGATIVE_PROMPT = [
  // Pose exclusions - prevent looking away
  'looking away, looking to the side, turned away, back view, profile view, looking over shoulder',
  'side profile, rear view, from behind, three-quarter back view',
  // Body anomalies
  'extra limbs, extra arms, extra legs, extra fingers, missing fingers, fused fingers, too many fingers, six fingers',
  'deformed hands, malformed hands, bad hands, mutated hands, poorly drawn hands, floating hands',
  'deformed face, ugly face, disfigured, mutation, mutated, deformed body, twisted body',
  'bad anatomy, bad proportions, gross proportions, malformed limbs, missing limbs, floating limbs',
  'long neck, extra head, duplicate, clone, twin, conjoined, double image',
  // Quality issues
  'blurry, out of focus, low quality, jpeg artifacts, watermark, text, signature, logo',
  'cropped, cut off, poorly framed, partial body, out of frame',
  // Style exclusions
  'cartoon, anime, chibi, 3d render, plastic, doll-like, uncanny valley',
  'overexposed, underexposed, flat lighting, harsh shadows on face',
  'amateur, beginner, sketch, rough, unfinished, draft',
  // Composition issues
  'centered composition, passport photo, mugshot, boring pose, stiff pose, t-pose',
  'empty background, plain background, gradient background only',
].join(', ');

// ============================================================================
// LAYER 3: GENRE CONTEXT - Environment and Setting
// ============================================================================

const GENRE_CONTEXT: Record<string, { outfit: string; setting: string }> = {
  // Modern/Contemporary
  modern: { outfit: 'modern tactical gear, body armor, combat clothing', setting: 'urban cityscape, modern architecture' },
  modern_life: { outfit: 'contemporary casual clothing, modern fashion', setting: 'coffee shop, modern apartment' },
  contemporary: { outfit: 'everyday modern clothing', setting: 'city street, modern interior' },
  
  // Sci-Fi
  cyberpunk: { outfit: 'cyberpunk tactical armor, chrome cybernetic arm, neon accents, combat gear, holding futuristic weapon', setting: 'neon-lit cyberpunk city, holographic billboards, rain, dark atmosphere' },
  scifi: { outfit: 'sleek futuristic uniform, advanced materials, tech accessories', setting: 'spaceship interior, space station, futuristic city' },
  space_opera: { outfit: 'space military uniform, insignia, utility belt', setting: 'starship bridge, alien planet vista' },
  mecha: { outfit: 'pilot suit with interface ports, tactical vest', setting: 'hangar bay, giant mecha in background' },
  
  // War/Military
  war: { outfit: 'military combat uniform, tactical vest, dog tags, rifle', setting: 'battlefield, military base' },
  ww2: { outfit: '1940s military uniform, period equipment, vintage weapons', setting: 'wartime Europe, military camp' },
  ww1: { outfit: 'WWI era uniform, trench gear, gas mask on belt', setting: 'muddy trenches, war-torn landscape' },
  vietnam: { outfit: 'jungle fatigues, M16 rifle, dog tags', setting: 'vietnamese jungle, firebase' },
  cold_war: { outfit: 'period military or spy attire, formal suits', setting: 'berlin wall, soviet architecture' },
  
  // Post-Apocalyptic/Survival
  postapoc: { outfit: 'weathered survival gear, patched leather, scavenged clothing, improvised armor', setting: 'wasteland ruins, abandoned buildings' },
  zombie: { outfit: 'apocalypse survivor gear, reinforced clothing, melee weapon', setting: 'overrun city, barricaded building' },
  survival: { outfit: 'outdoor survival gear, hiking clothing, backpack', setting: 'wilderness, forest campsite' },
  fallout: { outfit: 'retro-futuristic wasteland gear, vault suit elements', setting: 'nuclear wasteland, ruined city' },
  
  // Fantasy
  fantasy: { outfit: 'fantasy attire, leather armor, mystical accessories, medieval clothing', setting: 'enchanted forest, ancient castle, fantasy tavern' },
  medieval: { outfit: 'medieval clothing, leather and wool, period armor', setting: 'stone castle, medieval village' },
  dark_fantasy: { outfit: 'dark ornate armor, gothic accessories, dark clothing', setting: 'dark castle, cursed forest' },
  high_fantasy: { outfit: 'elaborate magical robes, enchanted jewelry, fantasy armor', setting: 'magical kingdom, crystal palace' },
  sword_sorcery: { outfit: 'barbarian gear, chainmail, tribal accessories', setting: 'ancient ruins, mystical temple' },
  
  // Horror/Dark
  horror: { outfit: 'worn everyday clothes, survival gear, disheveled appearance', setting: 'abandoned building, foggy night, creepy atmosphere' },
  vampire: { outfit: 'gothic aristocratic attire, dark elegant clothing, cape', setting: 'gothic castle, moonlit cemetery' },
  werewolf: { outfit: 'torn rugged clothing, wild appearance', setting: 'foggy forest, full moon' },
  lovecraft: { outfit: '1920s period clothing, investigator attire', setting: 'eldritch atmosphere, cosmic horror hints' },
  
  // Historical
  western: { outfit: 'wild west attire, duster coat, cowboy hat, holstered revolver', setting: 'dusty frontier town, desert canyon' },
  noir: { outfit: '1940s detective attire, fedora, trench coat', setting: 'rainy night street, dim office' },
  victorian: { outfit: 'victorian era clothing, formal attire', setting: 'london streets, victorian mansion' },
  renaissance: { outfit: 'renaissance clothing, doublet and hose, noble attire', setting: 'italian palazzo, renaissance court' },
  ancient: { outfit: 'ancient robes, roman toga, greek chiton', setting: 'ancient temple, roman forum' },
  
  // Genre Mashups
  steampunk: { outfit: 'victorian steampunk fashion, brass goggles, clockwork accessories, cogs', setting: 'steam-powered factory, airship, victorian street' },
  dieselpunk: { outfit: '1930s-40s retro-futuristic, leather aviator gear', setting: 'art deco city, industrial factory' },
  pirate: { outfit: 'pirate attire, weathered sea clothing, cutlass, tricorn hat', setting: 'ship deck, tropical port' },
  
  // Thriller/Crime
  mystery: { outfit: 'professional attire, investigator look, subtle accessories', setting: 'victorian study, foggy street' },
  spy: { outfit: 'tailored suit, sophisticated attire, concealed weapon', setting: 'luxury casino, secret base' },
  crime: { outfit: 'street clothes, gang attire, urban fashion', setting: 'dark alley, city night' },
  heist: { outfit: 'tactical black clothing, professional thief gear', setting: 'museum night, vault room' },
  
  // Superhero/Power
  superhero: { outfit: 'heroic suit, emblem, powerful presence, cape optional', setting: 'city rooftop, dramatic sky' },
  supervillain: { outfit: 'menacing costume, dramatic accessories', setting: 'villainous lair, destroyed city' },
  
  // Misc
  slice_of_life: { outfit: 'casual everyday clothing, comfortable attire', setting: 'cozy home, neighborhood street' },
  romance: { outfit: 'attractive stylish clothing, date outfit', setting: 'romantic setting, candlelit restaurant' },
  comedy: { outfit: 'expressive casual clothing', setting: 'colorful environment, everyday location' },
};

// ============================================================================
// ORIGIN/BACKGROUND MODIFIERS - How background affects appearance
// ============================================================================

const ORIGIN_MODIFIERS: Record<string, string> = {
  // Legacy spawn points
  'college': 'young student look, casual academic style, backpack',
  'home': 'comfortable casual appearance, well-maintained',
  'homeless': 'weathered appearance, worn clothes, survival hardened',
  
  // Background effects
  'Stable upbringing': 'well-groomed, healthy appearance, confident posture',
  'Turbulent past': 'guarded expression, visible wear, street-smart look',
  'Sheltered life': 'innocent appearance, clean and neat, slightly naive expression',
  'Street survivor': 'hardened expression, survival scars, street-worn appearance',
  
  // Generic fallbacks
  'wealthy': 'expensive clothing, well-groomed, refined appearance',
  'poor': 'worn but maintained clothing, resourceful look',
  'military': 'disciplined posture, fit appearance, military bearing',
  'criminal': 'street smart appearance, edgy style, guarded expression',
  'academic': 'intellectual appearance, glasses optional, thoughtful expression',
  'noble': 'aristocratic bearing, fine clothing, elegant posture',
  'peasant': 'simple working clothes, weathered hands, humble appearance',
  'merchant': 'practical but quality clothing, shrewd expression',
};

// ============================================================================
// CLOTHING STYLE MODIFIERS - Override or enhance genre defaults
// ============================================================================

const CLOTHING_STYLE_MODIFIERS: Record<string, string> = {
  'genre_default': '', // Use genre outfit
  'formal': 'wearing formal business attire, suit or elegant dress',
  'casual': 'wearing casual comfortable clothing',
  'streetwear': 'wearing urban streetwear, trendy branded clothing',
  'punk': 'wearing punk style with ripped clothes, spikes, patches, chains',
  'goth': 'wearing gothic dark clothing, victorian influences, black colors',
  'military': 'wearing military tactical clothing, combat ready',
  'athletic': 'wearing athletic sporty clothing, performance wear',
  'bohemian': 'wearing bohemian flowing clothes, natural fabrics, earthy tones',
  'vintage': 'wearing vintage retro clothing from past era',
  'minimalist': 'wearing minimalist simple clothing, clean lines',
  'extravagant': 'wearing extravagant flashy clothing, bold statement pieces',
  'revealing': 'wearing revealing clothing showing skin',
  'modest': 'wearing modest conservative full coverage clothing',
  'cosplay': 'wearing costume or themed character outfit',
};

// ============================================================================
// LAYER 2: PHYSICAL ATTRIBUTES - Core appearance
// ============================================================================

const PHYSICAL = {
  gender: {
    male: 'man',
    female: 'woman',
    nonbinary: 'person with androgynous features',
    other: 'person',
  } as Record<string, string>,
  
  build: {
    athletic: 'athletic muscular build',
    lean: 'lean agile build',
    muscular: 'heavily muscular build',
    average: 'average build',
    slim: 'slim slender build',
    stocky: 'stocky sturdy build',
    large: 'large imposing build',
    heavyset: 'heavyset large build',
    curvy: 'curvy hourglass figure',
    petite: 'petite small frame',
    tall: 'tall imposing stature',
    thick: 'thick curvy build',
    lithe: 'lithe graceful build',
  } as Record<string, string>,
  
  skin: {
    pale: 'pale fair skin',
    light: 'light skin',
    fair: 'fair skin',
    medium: 'medium skin tone',
    tan: 'tanned skin',
    olive: 'olive skin tone',
    brown: 'brown skin',
    dark: 'dark skin',
    ebony: 'deep ebony skin',
    porcelain: 'porcelain pale skin',
  } as Record<string, string>,
  
  hairColor: {
    black: 'jet black hair',
    brown: 'brown hair',
    darkBrown: 'dark brown hair',
    lightBrown: 'light brown hair',
    blonde: 'blonde hair',
    dirtyBlonde: 'dirty blonde hair',
    platinum: 'platinum blonde hair',
    red: 'red hair',
    auburn: 'auburn hair',
    ginger: 'ginger hair',
    white: 'white hair',
    gray: 'gray hair',
    silver: 'silver hair',
    blue: 'bright blue dyed hair',
    pink: 'pink dyed hair',
    purple: 'purple dyed hair',
    green: 'green dyed hair',
  } as Record<string, string>,
  
  hairStyle: {
    short: 'short cropped hair',
    medium: 'medium length hair',
    military: 'military buzz cut',
    mohawk: 'mohawk hairstyle',
    shaved: 'shaved head',
    bald: 'bald head',
    long: 'long flowing hair',
    ponytail: 'hair in ponytail',
    braided: 'braided hair',
    undercut: 'undercut hairstyle',
    messy: 'messy tousled hair',
    slicked: 'slicked back hair',
    curly: 'curly textured hair',
    dreads: 'dreadlocks',
    wavy: 'wavy hair',
    spiky: 'spiky styled hair',
  } as Record<string, string>,
  
  eyeColor: {
    brown: 'brown eyes',
    blue: 'blue eyes',
    green: 'green eyes',
    hazel: 'hazel eyes',
    gray: 'gray eyes',
    amber: 'amber eyes',
    heterochromia: 'heterochromia different colored eyes',
    cybernetic: 'glowing cybernetic eyes',
    violet: 'violet eyes',
    golden: 'golden eyes',
  } as Record<string, string>,
  
  faceShape: {
    oval: 'oval face shape',
    round: 'round face',
    square: 'square jawline',
    heart: 'heart-shaped face',
    long: 'long face',
    angular: 'angular sharp features',
  } as Record<string, string>,
};

// ============================================================================
// LAYER 2.5: DISTINGUISHING DETAILS - Important visual markers
// ============================================================================

const DETAIL_MAP: Record<string, string> = {
  // Facial features
  'Facial scar': 'prominent facial scar',
  'Dimples': 'cute dimples when smiling',
  'Freckles': 'freckles across face and nose',
  'Beauty mark': 'beauty mark on face',
  'Cleft chin': 'cleft chin',
  'High cheekbones': 'high pronounced cheekbones',
  'Strong jaw': 'strong defined jawline',
  'Soft features': 'soft gentle facial features',
  'Sharp features': 'sharp angular features',
  'Weathered': 'weathered experienced face',
  'Youthful': 'youthful smooth face',
  
  // Facial hair
  'Beard': 'full beard',
  'Stubble': 'stubble facial hair',
  'Mustache': 'mustache',
  'Goatee': 'goatee',
  'Clean shaven': 'clean shaven face',
  
  // Accessories
  'Necklace': 'wearing necklace',
  'Choker': 'wearing choker necklace',
  'Ring': 'wearing rings',
  'Bracelet': 'wearing bracelet',
  'Earrings': 'wearing earrings',
  'Glasses': 'wearing glasses',
  'Sunglasses': 'wearing sunglasses',
  'Eyepatch': 'eyepatch over one eye',
  'Bandana': 'wearing bandana',
  'Headband': 'wearing headband',
  'Hat': 'wearing hat',
  'Scarf': 'wearing scarf',
  
  // Makeup/cosmetic
  'Heavy makeup': 'wearing heavy dramatic makeup',
  'Natural makeup': 'natural subtle makeup',
  'War paint': 'war paint on face',
  'Tattoo face': 'facial tattoos',
};

// ============================================================================
// LAYER 1: ROLE IDENTITY - Character class/role (highest priority)
// ============================================================================

const ROLE_IDENTITY: Record<string, string> = {
  // === MILITARY/COMBAT ROLES ===
  soldier: 'soldier with tactical vest and rifle',
  medic: 'combat medic with medical gear and red cross',
  sniper: 'sniper with scope and ghillie elements',
  heavy: 'heavy weapons specialist with machine gun',
  engineer: 'combat engineer with tools and goggles',
  pilot: 'pilot in flight suit with helmet',
  tank: 'tank commander with tanker helmet',
  officer: 'military officer in decorated uniform',
  scout: 'recon scout in light gear',
  spec_ops: 'special forces operator with night vision',
  commando: 'elite commando in black tactical gear',
  marine: 'marine in combat uniform, USMC',
  ranger: 'army ranger in tactical gear',
  paratrooper: 'paratrooper with jump gear',
  
  // === FANTASY CLASSES ===
  knight: 'armored knight in plate armor with sword and shield',
  rogue: 'rogue in leather armor with daggers, hooded',
  mage: 'mage in magical robes with arcane glow and staff',
  wizard: 'wizard in mystical robes with staff and spellbook',
  sorcerer: 'sorcerer with innate magical energy emanating',
  warlock: 'warlock with dark pact markings and eldritch signs',
  paladin: 'paladin in blessed shining armor with holy symbol',
  berserker: 'berserker with war paint and massive weapon, fierce',
  warrior: 'warrior in practical battle armor',
  cleric: 'cleric in religious vestments with holy symbol',
  priest: 'priest in religious robes',
  bard: 'bard in colorful clothing with musical instrument',
  druid: 'druid in natural robes with wooden staff, nature motifs',
  monk: 'monk in simple robes, martial artist stance',
  barbarian: 'barbarian in tribal gear with massive weapon',
  archer: 'archer with bow and quiver, ranger attire',
  assassin: 'assassin in dark hooded attire with hidden blades',
  necromancer: 'necromancer in dark robes with skull motifs',
  summoner: 'summoner with magical circles and glowing runes',
  alchemist: 'alchemist with potions and vials, leather apron',
  
  // === CYBERPUNK ROLES ===
  solo: 'elite solo mercenary, chrome cybernetic arm, tactical body armor, holding assault rifle, dangerous confident pose',
  netrunner: 'netrunner hacker, glowing neural interface, data cables, holographic displays around head',
  fixer: 'fixer in expensive street fashion, chrome accessories, confident smirk',
  techie: 'techie with cybernetic eye implant, tools, gadgets',
  nomad: 'nomad warrior in road-worn armored gear, dust and chrome',
  corpo: 'corporate agent in sleek tactical business attire, hidden chrome',
  rockerboy: 'rockerboy in flashy stage clothes, cybernetic music implants',
  media: 'media journalist with recording implants, stylish clothes',
  
  // === SCI-FI ROLES ===
  captain: 'starship captain in command uniform with insignia',
  engineer_scifi: 'ship engineer with tools and jumpsuit',
  scientist: 'scientist in lab coat with tech equipment',
  space_marine: 'space marine in powered armor with plasma weapon',
  bounty_hunter: 'bounty hunter in worn armor with various weapons',
  smuggler: 'smuggler in practical spacer clothes with blaster',
  android: 'android with visible synthetic parts, perfect features',
  cyborg: 'cyborg with visible cybernetic enhancements',
  
  // === HORROR ROLES ===
  survivor: 'survivor in torn everyday clothes, frightened but determined',
  investigator: 'occult investigator with flashlight and journal',
  hunter: 'monster hunter with specialized weapons and gear',
  psychic: 'psychic with intense gaze, subtle supernatural aura',
  exorcist: 'exorcist with religious symbols and holy water',
  
  // === NOIR/CRIME ROLES ===
  detective: 'detective in long coat with badge and gun',
  criminal: 'criminal in street clothes with concealed weapon',
  gangster: 'gangster in period suit with tommy gun',
  thief: 'thief in dark stealthy clothing with lockpicks',
  hitman: 'hitman in professional suit with silenced pistol',
  cop: 'police officer in uniform with badge and service weapon',
  
  // === WESTERN ROLES ===
  gunslinger: 'gunslinger with dual revolvers, cowboy hat, duster',
  sheriff: 'sheriff with badge, cowboy hat, lever action rifle',
  outlaw: 'outlaw in dusty clothes with bandana and guns',
  bounty: 'bounty hunter in worn leather with wanted posters',
  
  // === CIVILIAN/OTHER ===
  mercenary: 'mercenary with mixed military gear and weapons',
  rebel: 'resistance fighter in improvised gear with rebel insignia',
  hacker: 'hacker in cyberpunk style with tech gear and laptop',
  merchant: 'merchant in quality clothing with coin purse',
  noble: 'noble in fine aristocratic clothing with jewelry',
  peasant: 'peasant in simple working clothes',
  scholar: 'scholar in academic robes with books and scrolls',
  healer: 'healer with medical supplies and gentle demeanor',
  artisan: 'artisan with tools of their trade',
  entertainer: 'entertainer in performance costume',
};

// ============================================================================
// LAYERED PROMPT BUILDER
// ============================================================================

function buildLayeredPrompt(body: any): { prompt: string; negative_prompt: string } {
  const {
    gender,
    build,
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    faceShape,
    characterClass,
    genre,
    age,
    height,
    // Origin and background
    origin,
    spawnPoint,
    background,
    // Clothing style override
    clothingStyle,
    clothingDetails,
    // Distinguishing details - IMPORTANT
    details,
    distinguishingFeatures,
    accessories,
    facialFeatures,
    distinguishingMarks,
    // Body modifications
    piercings,
    tattoos,
    tattooStyle,
    scars,
    implants,
    prosthetics,
    mutations,
    // Portrait hints from class
    portraitHints,
    // Personality for expression hints
    disposition,
    socialStyle,
  } = body;

  console.log("=== LAYERED PROMPT BUILDER ===");
  console.log("Input:", JSON.stringify({ 
    gender, build, skinTone, hairColor, hairStyle, eyeColor, characterClass, genre, age,
    origin, spawnPoint, clothingStyle,
    detailsCount: details?.length || 0,
    distinguishingFeaturesCount: distinguishingFeatures?.length || 0,
    accessoriesCount: accessories?.length || 0,
  }));

  // Helper: find value in map (case-insensitive)
  const lookup = (map: Record<string, string>, key: string | undefined, fallback: string): string => {
    if (!key) return fallback;
    const directMatch = map[key];
    if (directMatch) return directMatch;
    const lowerKey = key.toLowerCase();
    for (const k of Object.keys(map)) {
      if (k.toLowerCase() === lowerKey) return map[k];
    }
    return key; // Return raw value if no match
  };

  // Get genre context
  const genreKey = genre?.toLowerCase().replace(/[\s-]/g, '_') || 'fantasy';
  const genreCtx = GENRE_CONTEXT[genreKey] || GENRE_CONTEXT[genre] || GENRE_CONTEXT.fantasy;
  console.log("Genre context for:", genreKey, genreCtx);

  // =========================================================================
  // LAYER 1: IDENTITY (Highest Priority - Who is this person?)
  // =========================================================================
  const genderStr = lookup(PHYSICAL.gender, gender, 'person');
  const ageStr = age ? `${age} year old` : 'adult';
  
  // Find role from character class - try exact match first, then partial
  let roleStr = '';
  const classLower = (characterClass || '').toLowerCase().replace(/[\s-]/g, '_');
  
  // Try exact match
  if (ROLE_IDENTITY[classLower]) {
    roleStr = ROLE_IDENTITY[classLower];
  } else {
    // Try partial match
    for (const key of Object.keys(ROLE_IDENTITY)) {
      if (classLower.includes(key) || key.includes(classLower)) {
        roleStr = ROLE_IDENTITY[key];
        break;
      }
    }
  }
  
  // Fallback to class name if no match
  if (!roleStr && characterClass) {
    roleStr = characterClass;
  }
  
  const layer1 = `${ageStr} ${genderStr}${roleStr ? `, ${roleStr}` : ''}`;
  console.log("Layer 1 (Identity):", layer1);

  // =========================================================================
  // LAYER 1.5: ORIGIN/BACKGROUND MODIFIER (Affects demeanor and wear)
  // =========================================================================
  let originModifier = '';
  
  // Check spawn point first (more specific)
  if (spawnPoint && ORIGIN_MODIFIERS[spawnPoint]) {
    originModifier = ORIGIN_MODIFIERS[spawnPoint];
  }
  // Then check origin/background
  else if (origin && ORIGIN_MODIFIERS[origin]) {
    originModifier = ORIGIN_MODIFIERS[origin];
  }
  else if (background && ORIGIN_MODIFIERS[background]) {
    originModifier = ORIGIN_MODIFIERS[background];
  }
  
  if (originModifier) {
    console.log("Layer 1.5 (Origin):", originModifier);
  }

  // =========================================================================
  // LAYER 2: PHYSICAL (Core appearance)
  // =========================================================================
  const buildStr = lookup(PHYSICAL.build, build, 'average build');
  const skinStr = lookup(PHYSICAL.skin, skinTone, 'medium skin tone');
  const hairColorStr = lookup(PHYSICAL.hairColor, hairColor, 'brown hair');
  const hairStyleStr = lookup(PHYSICAL.hairStyle, hairStyle, 'short hair');
  const eyeColorStr = lookup(PHYSICAL.eyeColor, eyeColor, 'brown eyes');
  const faceStr = faceShape ? lookup(PHYSICAL.faceShape, faceShape, '') : '';
  
  const physicalParts = [buildStr, skinStr, `${hairColorStr} in ${hairStyleStr}`, eyeColorStr];
  if (faceStr) physicalParts.push(faceStr);
  if (height) physicalParts.push(`${height} height`);
  
  const layer2 = physicalParts.join(', ');
  console.log("Layer 2 (Physical):", layer2);

  // =========================================================================
  // LAYER 2.5: DISTINGUISHING DETAILS (Important visual markers)
  // =========================================================================
  const detailParts: string[] = [];
  
  // Process details array (combined features + accessories from character creation)
  if (details && Array.isArray(details)) {
    details.forEach((d: string) => {
      const mapped = DETAIL_MAP[d];
      if (mapped) {
        detailParts.push(mapped);
      } else if (d) {
        detailParts.push(d.toLowerCase());
      }
    });
  }
  
  // Process separate distinguishing features
  if (distinguishingFeatures && Array.isArray(distinguishingFeatures)) {
    distinguishingFeatures.forEach((f: string) => {
      const mapped = DETAIL_MAP[f];
      if (mapped && !detailParts.includes(mapped)) {
        detailParts.push(mapped);
      } else if (f && !detailParts.includes(f.toLowerCase())) {
        detailParts.push(f.toLowerCase());
      }
    });
  }
  
  // Process accessories
  if (accessories && Array.isArray(accessories)) {
    accessories.forEach((a: string) => {
      const mapped = DETAIL_MAP[a];
      if (mapped && !detailParts.includes(mapped)) {
        detailParts.push(mapped);
      } else if (a && !detailParts.includes(a.toLowerCase())) {
        detailParts.push(`wearing ${a.toLowerCase()}`);
      }
    });
  }
  
  // Add facial features text
  if (facialFeatures) {
    detailParts.push(facialFeatures);
  }
  
  // Add distinguishing marks text
  if (distinguishingMarks) {
    detailParts.push(distinguishingMarks);
  }
  
  // Add portrait hints from class
  if (portraitHints && Array.isArray(portraitHints)) {
    portraitHints.forEach((hint: string) => {
      if (hint && !detailParts.includes(hint)) {
        detailParts.push(hint);
      }
    });
  }
  
  // Process body modifications if any
  if (scars && Array.isArray(scars) && scars.length > 0) {
    detailParts.push(`visible scars: ${scars.join(', ')}`);
  }
  if (tattoos && Array.isArray(tattoos) && tattoos.length > 0) {
    const tattooDesc = tattooStyle ? `${tattooStyle} style tattoos` : 'tattoos';
    detailParts.push(`${tattooDesc} on ${tattoos.join(', ')}`);
  }
  if (piercings && Array.isArray(piercings) && piercings.length > 0) {
    detailParts.push(`piercings: ${piercings.join(', ')}`);
  }
  if (implants && Array.isArray(implants) && implants.length > 0) {
    detailParts.push(`cybernetic implants: ${implants.join(', ')}`);
  }
  if (prosthetics && Array.isArray(prosthetics) && prosthetics.length > 0) {
    detailParts.push(`prosthetic: ${prosthetics.join(', ')}`);
  }
  if (mutations && Array.isArray(mutations) && mutations.length > 0) {
    detailParts.push(`mutations: ${mutations.join(', ')}`);
  }
  
  const layer25 = detailParts.length > 0 ? `IMPORTANT DETAILS: ${detailParts.join(', ')}` : '';
  console.log("Layer 2.5 (Details):", layer25 || "(none)");

  // =========================================================================
  // LAYER 3: CONTEXT (What are they wearing? Where are they?)
  // =========================================================================
  
  // Determine outfit - clothing style can override genre default
  let outfitStr = genreCtx.outfit;
  
  if (clothingStyle && clothingStyle !== 'genre_default' && CLOTHING_STYLE_MODIFIERS[clothingStyle]) {
    // Override with clothing style
    outfitStr = CLOTHING_STYLE_MODIFIERS[clothingStyle];
    console.log("Clothing style override:", clothingStyle);
  }
  
  // Add specific clothing details if provided
  if (clothingDetails && Array.isArray(clothingDetails) && clothingDetails.length > 0) {
    outfitStr += `, specifically ${clothingDetails.join(', ')}`;
  }
  
  const layer3 = `wearing ${outfitStr}, ${genreCtx.setting} background`;
  console.log("Layer 3 (Context):", layer3);

  // =========================================================================
  // LAYER 3.5: PERSONALITY/EXPRESSION (Demeanor and pose hints)
  // =========================================================================
  let expressionHint = '';
  
  if (disposition) {
    const dispositionExpression: Record<string, string> = {
      'Bold': 'confident assertive expression',
      'Cautious': 'alert watchful expression',
      'Adaptable': 'calm collected expression',
    };
    if (dispositionExpression[disposition]) {
      expressionHint = dispositionExpression[disposition];
    }
  }
  
  if (socialStyle && !expressionHint) {
    const socialExpression: Record<string, string> = {
      'Charming': 'charming slight smile',
      'Reserved': 'reserved composed expression',
      'Blunt': 'direct intense gaze',
    };
    if (socialExpression[socialStyle]) {
      expressionHint = socialExpression[socialStyle];
    }
  }

  // =========================================================================
  // LAYER 4: STYLE (How should this be rendered?) - INTENSIFIED FOR FLUX.1-DEV
  // =========================================================================
  const layer4 = `${LAYER_STYLE.quality}, ${LAYER_STYLE.atmosphere}, ${LAYER_STYLE.artisticStyle}`;
  console.log("Layer 4 (Style):", layer4);

  // =========================================================================
  // ASSEMBLE FINAL PROMPT - INTENSIFIED STRUCTURE FOR FLUX.1-DEV
  // Structure: [Medium] [Artistic] [Framing/Pose] [Identity] [Origin] [Physical] [DETAILS] [Context] [Expression] [Atmosphere] [Quality]
  // =========================================================================
  const promptParts = [
    LAYER_STYLE.medium,           // "masterpiece ultra-detailed cinematic portrait..."
    LAYER_STYLE.framing,          // "three-quarter body, dynamic pose, rim lighting..."
    layer1,                        // WHO: "adult woman solo mercenary"
  ];
  
  // Add origin modifier if present
  if (originModifier) {
    promptParts.push(originModifier); // ORIGIN: "hardened expression, survival scars"
  }
  
  promptParts.push(layer2);        // LOOKS: "athletic build, olive skin, black hair..."
  
  // Add details with emphasis if present
  if (layer25) {
    promptParts.push(layer25);     // DETAILS: "IMPORTANT DETAILS: freckles, scar, necklace..."
  }
  
  promptParts.push(layer3);        // CONTEXT: "wearing futuristic streetwear, neon city"
  
  // Add expression hint if present
  if (expressionHint) {
    promptParts.push(expressionHint); // EXPRESSION: "confident assertive expression"
  }
  
  promptParts.push(layer4);        // QUALITY + ATMOSPHERE + ARTISTIC STYLE

  const finalPrompt = promptParts.join(', ');

  console.log("=== FINAL INTENSIFIED PROMPT ===");
  console.log("Length:", finalPrompt.length);
  console.log("Prompt:", finalPrompt);

  return {
    prompt: finalPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  };
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION
// ============================================================================

async function generateWithTogetherAI(prompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating with FLUX.1-dev (higher quality)");
  console.log("Prompt preview:", prompt.substring(0, 250) + "...");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-dev',
      prompt: prompt,
      width: 832,
      height: 1216,
      steps: 28,
      n: 1,
      response_format: 'b64_json',
      negative_prompt: NEGATIVE_PROMPT,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Together.ai error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later.");
    }
    if (response.status === 402 || response.status === 401) {
      throw new Error("API key issue or credits exhausted.");
    }
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const result = await response.json();
  console.log("Together.ai response received");
  
  const b64Data = result?.data?.[0]?.b64_json;
  if (!b64Data) {
    console.error("No image in response:", JSON.stringify(result).substring(0, 500));
    throw new Error("No image generated");
  }

  return `data:image/png;base64,${b64Data}`;
}

// ============================================================================
// LEGACY PROMPT BUILDER (for backwards compatibility)
// ============================================================================

function buildLegacyPrompt(requestData: any) {
  const { appearance, characterClass, genre } = requestData;
  
  const appearanceLower = (appearance || '').toLowerCase();
  
  // Extract basic attributes from appearance string
  let gender = 'male';
  if (appearanceLower.includes('female') || appearanceLower.includes('woman')) {
    gender = 'female';
  }
  
  let build = 'average';
  for (const key of Object.keys(PHYSICAL.build)) {
    if (appearanceLower.includes(key)) {
      build = key;
      break;
    }
  }

  // Build using layered system
  return buildLayeredPrompt({
    gender,
    build,
    characterClass,
    genre: genre || 'fantasy',
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, gender, characterClass, genre, emotionVariant } = body;

    console.log("Portrait request for:", name || "Unknown");
    console.log("Genre:", genre, "| Class:", characterClass);
    
    let promptData;
    
    // Use layered builder for new-style requests (has gender field)
    if (gender) {
      console.log("Using layered prompt builder");
      promptData = buildLayeredPrompt(body);
    } else {
      // Legacy mode for old requests
      console.log("Using legacy prompt builder");
      promptData = buildLegacyPrompt(body);
    }

    const imageUrl = await generateWithTogetherAI(promptData.prompt);

    console.log("Portrait generated successfully for:", name);

    return new Response(JSON.stringify({ 
      imageUrl,
      characterName: name,
      emotion: emotionVariant || 'neutral',
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating portrait:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unable to generate portrait at this time",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
