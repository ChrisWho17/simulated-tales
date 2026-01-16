import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// ULTIMATE FLUX1.DEV CHARACTER PORTRAIT PROMPT STRUCTURE
// ============================================================================

// [CAMERA & COMPOSITION - LOCKED SPECIFICATIONS]
const CAMERA_COMPOSITION = `
FRAMING - KNEE TO HEAD HEIGHT: Full character portrait extending from knees to top of head, vertical portrait orientation composition, character occupies 70-80% of frame height, knees visible at bottom edge of frame, adequate headroom at top (approximately 10% of frame above head), 3/4 length portrait showing knees thighs hips torso shoulders neck and complete head with hair.

BODY POSITIONING: Character body rotated 15-20 degrees to subject left or right creating dimensional depth and flattering silhouette, hips and shoulders maintain angled position, weight shifted to one leg creating natural hip tilt and relaxed posture, torso shows depth and dimension from the angle.

FACE AND EYE CONTACT CRITICAL: Face turned toward camera despite body angle establishing direct frontal view, eyes looking DIRECTLY into camera lens creating intimate connection with viewer, head may have subtle tilt 5-10 degrees but maintains frontal orientation, NO profile view NO side glance NO looking away, gaze is confident direct and engages viewer.

CAMERA TECHNICAL: 85mm portrait lens equivalent with flattering compression and natural perspective, camera positioned at subject chest solar plexus level for neutral flattering angle, f/1.8 to f/2.8 aperture with subject in sharp focus and background softly blurred, vertical portrait format 9:16 or 2:3 aspect ratio, professional studio setup.

DEPTH OF FIELD: Critical focus plane on eyes and face tack sharp maximum detail, secondary focus on upper body shoulders arms sharp to slightly soft transition, tertiary focus on lower body knees in acceptable focus but slightly softer, background creamy bokeh blur f/1.8-f/2.8 environmental context visible but not distracting.

COMPOSITION RULES: Rule of thirds with eyes positioned in upper third of frame, balanced negative space on sides of subject slightly more above head than below knees, body positioning slightly off-center if angled creating dynamic composition.

POSE DYNAMICS: Stance with weight on back leg front leg slightly bent or extended creating natural stance, arms hanging naturally at sides or one hand on hip or arms crossed loosely avoid stiff soldier pose, shoulders relaxed not hunched or rigid natural slope, posture confident but natural slight S-curve to body.

LIGHTING THREE-POINT STUDIO: Key light at 45-degree angle from camera 1:2 lighting ratio defines face planes and body contours, fill light opposite side from key 1/4 to 1/2 intensity of key softens shadows without eliminating them, rim hair light behind and above subject separates from background creates edge definition and hair highlights, catchlights in eyes at 10 and 2 o'clock positions.

Professional studio portrait photograph knee-to-head framing showing complete character in dimensional space, face engaging viewer directly with confident eye contact, body positioned at flattering angle creating depth, cinematic lighting creating form and separation, magazine editorial quality casting-style headshot meets fashion portrait aesthetic.
`.trim().replace(/\n\n/g, '. ').replace(/\n/g, ' ');

// [QUALITY ASSURANCE TAGS]
const QUALITY_TAGS = `Professional portrait photography, studio quality, magazine editorial standard, high-end retouching, natural beauty enhancement, cinematic lighting, shallow depth of field, bokeh background, sharp focus on subject, professional color grading, award-winning portrait, masterful composition, technically perfect, emotionally resonant, character-driven storytelling, 8K resolution, photorealistic`;

// [NEGATIVE PROMPTS TO AVOID]
const NEGATIVE_PROMPT = `No anime style, no cartoon, no illustration, no 3d render, no CGI, no digital art, no painting, no sketch, no drawing, no watercolor, no oil painting, looking away, back view, profile view, side profile, looking to the side, eyes looking away, averted gaze, extra limbs, extra arms, extra legs, extra fingers, missing fingers, deformed hands, malformed hands, bad hands, deformed face, ugly face, disfigured, mutation, mutated, bad anatomy, bad proportions, cropped at waist, cropped at chest, close-up, closeup, headshot, bust shot, face only, chest up, shoulders up, waist up, zoomed in, too close, tight framing, full body, feet visible, below knees, wide shot`;

// ============================================================================
// GENRE BACKGROUNDS - ATMOSPHERIC CONTEXT
// ============================================================================

const GENRE_BACKGROUNDS: Record<string, { setting: string; atmosphere: string; elements: string }> = {
  // Modern/Contemporary
  modern: { 
    setting: 'contemporary urban cityscape', 
    atmosphere: 'modern metropolitan energy, clean lines', 
    elements: 'glass buildings, city lights, modern architecture' 
  },
  modern_life: { 
    setting: 'contemporary everyday location', 
    atmosphere: 'warm comfortable ambiance', 
    elements: 'coffee shop, modern apartment, street scene' 
  },
  contemporary: { 
    setting: 'modern day setting', 
    atmosphere: 'realistic present-day world', 
    elements: 'urban streets, modern interiors, everyday locations' 
  },
  
  // Sci-Fi
  cyberpunk: { 
    setting: 'neon-lit cyberpunk city at night', 
    atmosphere: 'high-tech low-life, rain-slicked streets, neon glow', 
    elements: 'holographic billboards, chrome and neon, urban decay meets technology' 
  },
  scifi: { 
    setting: 'futuristic environment', 
    atmosphere: 'advanced technology, clean futurism', 
    elements: 'spaceship interior, space station, sleek technology' 
  },
  sci_fi: { 
    setting: 'futuristic environment', 
    atmosphere: 'advanced technology, clean futurism', 
    elements: 'spaceship interior, space station, sleek technology' 
  },
  space_opera: { 
    setting: 'starship bridge or alien vista', 
    atmosphere: 'epic galactic scale, cosmic wonder', 
    elements: 'control panels, viewports to space, distant planets' 
  },
  mecha: { 
    setting: 'giant robot hangar bay', 
    atmosphere: 'massive scale mechanical warfare', 
    elements: 'towering mecha, industrial hangar, pilot interfaces' 
  },
  
  // War/Military
  war: { 
    setting: 'battlefield or military installation', 
    atmosphere: 'tense combat readiness, military precision', 
    elements: 'military equipment, fortifications, combat zone' 
  },
  military: { 
    setting: 'military base or combat zone', 
    atmosphere: 'disciplined military environment', 
    elements: 'barracks, equipment, military vehicles' 
  },
  ww2: { 
    setting: '1940s wartime Europe', 
    atmosphere: 'period-authentic World War 2 setting', 
    elements: 'military camp, vintage equipment, war-era structures' 
  },
  ww1: { 
    setting: 'World War 1 trenches', 
    atmosphere: 'grim trench warfare, muddy desolation', 
    elements: 'muddy trenches, barbed wire, war-torn landscape' 
  },
  vietnam: { 
    setting: 'Vietnamese jungle', 
    atmosphere: 'humid tropical warfare, dense vegetation', 
    elements: 'jungle foliage, firebase, humid environment' 
  },
  cold_war: { 
    setting: 'Cold War era Eastern Europe', 
    atmosphere: 'espionage tension, ideological conflict', 
    elements: 'Berlin Wall, Soviet architecture, period spy aesthetics' 
  },
  
  // Post-Apocalyptic
  postapoc: { 
    setting: 'post-apocalyptic wasteland', 
    atmosphere: 'desolate survival, civilization collapse', 
    elements: 'ruined buildings, overgrown decay, scavenged world' 
  },
  post_apocalyptic: { 
    setting: 'post-apocalyptic wasteland', 
    atmosphere: 'desolate survival, civilization collapse', 
    elements: 'ruined buildings, overgrown decay, scavenged world' 
  },
  zombie: { 
    setting: 'zombie apocalypse city', 
    atmosphere: 'desperate survival horror', 
    elements: 'barricaded buildings, abandoned streets, survival setup' 
  },
  survival: { 
    setting: 'wilderness survival setting', 
    atmosphere: 'harsh nature, human endurance', 
    elements: 'forest camp, makeshift shelter, survival gear' 
  },
  fallout: { 
    setting: 'retro-futuristic nuclear wasteland', 
    atmosphere: 'atomic age post-apocalypse', 
    elements: 'rusted technology, radiation signs, vault structures' 
  },
  
  // Fantasy
  fantasy: { 
    setting: 'enchanted fantasy realm', 
    atmosphere: 'magical mystical wonder', 
    elements: 'ancient castle, enchanted forest, mystical lighting' 
  },
  medieval: { 
    setting: 'medieval castle or village', 
    atmosphere: 'historical medieval authenticity', 
    elements: 'stone walls, timber buildings, period architecture' 
  },
  dark_fantasy: { 
    setting: 'dark gothic fantasy realm', 
    atmosphere: 'ominous dark magic, gothic horror', 
    elements: 'cursed castle, dead trees, eerie fog' 
  },
  high_fantasy: { 
    setting: 'magical fantasy kingdom', 
    atmosphere: 'bright heroic fantasy, magical wonder', 
    elements: 'crystal spires, magical auras, enchanted landscape' 
  },
  sword_sorcery: { 
    setting: 'barbaric ancient world', 
    atmosphere: 'raw primal fantasy, ancient mysteries', 
    elements: 'ancient ruins, mystical temples, savage wilderness' 
  },
  sword_and_sorcery: { 
    setting: 'barbaric ancient world', 
    atmosphere: 'raw primal fantasy, ancient mysteries', 
    elements: 'ancient ruins, mystical temples, savage wilderness' 
  },
  
  // Horror
  horror: { 
    setting: 'haunted location', 
    atmosphere: 'creeping dread, supernatural menace', 
    elements: 'abandoned building, fog, eerie lighting' 
  },
  vampire: { 
    setting: 'gothic castle or cemetery', 
    atmosphere: 'aristocratic darkness, eternal night', 
    elements: 'moonlit architecture, gothic elements, candlelight' 
  },
  werewolf: { 
    setting: 'foggy wilderness under full moon', 
    atmosphere: 'bestial horror, primal fear', 
    elements: 'full moon, dark forest, mist, wild nature' 
  },
  lovecraft: { 
    setting: '1920s New England', 
    atmosphere: 'cosmic horror, eldritch unease', 
    elements: 'old buildings, mysterious shadows, unsettling geometry' 
  },
  lovecraftian: { 
    setting: '1920s New England', 
    atmosphere: 'cosmic horror, eldritch unease', 
    elements: 'old buildings, mysterious shadows, unsettling geometry' 
  },
  cosmic_horror: { 
    setting: 'reality-bending space', 
    atmosphere: 'incomprehensible cosmic dread', 
    elements: 'impossible geometry, stars, void' 
  },
  
  // Historical
  western: { 
    setting: 'wild west frontier', 
    atmosphere: 'dusty frontier lawlessness', 
    elements: 'desert canyon, wooden buildings, dusty streets' 
  },
  noir: { 
    setting: '1940s noir city', 
    atmosphere: 'shadowy mystery, moral ambiguity', 
    elements: 'rain-slicked streets, neon signs, venetian blind shadows' 
  },
  victorian: { 
    setting: 'Victorian era London', 
    atmosphere: 'industrial age elegance and grime', 
    elements: 'gas lamps, cobblestones, period architecture' 
  },
  renaissance: { 
    setting: 'Italian Renaissance city', 
    atmosphere: 'artistic golden age, intrigue', 
    elements: 'palazzo architecture, marble, artistic grandeur' 
  },
  ancient: { 
    setting: 'ancient classical world', 
    atmosphere: 'timeless antiquity, mythic grandeur', 
    elements: 'Roman forum, Greek temples, classical columns' 
  },
  ancient_rome: { 
    setting: 'ancient Roman Empire', 
    atmosphere: 'imperial grandeur, classical civilization', 
    elements: 'Roman architecture, columns, marble' 
  },
  ancient_greece: { 
    setting: 'ancient Greek city-state', 
    atmosphere: 'philosophical golden age', 
    elements: 'Greek temples, olive groves, Mediterranean' 
  },
  
  // Punk genres
  steampunk: { 
    setting: 'steampunk Victorian city', 
    atmosphere: 'brass and steam technology, retro-futurism', 
    elements: 'clockwork machinery, steam pipes, brass and copper' 
  },
  dieselpunk: { 
    setting: '1930s-40s retro-futuristic city', 
    atmosphere: 'art deco industrial power', 
    elements: 'art deco architecture, massive machines, propaganda' 
  },
  atompunk: { 
    setting: '1950s atomic age future', 
    atmosphere: 'retro-futuristic optimism', 
    elements: 'atomic symbols, chrome and fins, Jetsons aesthetic' 
  },
  solarpunk: { 
    setting: 'eco-futuristic utopia', 
    atmosphere: 'sustainable green future', 
    elements: 'vertical gardens, solar panels, nature and technology merged' 
  },
  
  // Adventure
  pirate: { 
    setting: 'Caribbean pirate ship or port', 
    atmosphere: 'swashbuckling high seas adventure', 
    elements: 'ship deck, tropical port, treasure, sails' 
  },
  nautical: { 
    setting: 'maritime setting', 
    atmosphere: 'ocean adventure, seafaring life', 
    elements: 'ships, docks, ocean, maritime equipment' 
  },
  exploration: { 
    setting: 'uncharted wilderness', 
    atmosphere: 'discovery and adventure', 
    elements: 'jungle, ruins, expedition camp' 
  },
  
  // Thriller/Crime
  mystery: { 
    setting: 'atmospheric mystery location', 
    atmosphere: 'puzzling intrigue, hidden secrets', 
    elements: 'study, clues, Victorian or noir aesthetics' 
  },
  spy: { 
    setting: 'sophisticated spy location', 
    atmosphere: 'international intrigue, high stakes', 
    elements: 'luxury casino, secret base, exotic locale' 
  },
  espionage: { 
    setting: 'Cold War spy setting', 
    atmosphere: 'covert operations, danger', 
    elements: 'safe houses, surveillance, hidden weapons' 
  },
  crime: { 
    setting: 'urban crime scene', 
    atmosphere: 'gritty underworld tension', 
    elements: 'dark alley, city night, urban environment' 
  },
  heist: { 
    setting: 'high-security target location', 
    atmosphere: 'precision theft, high stakes', 
    elements: 'museum, vault, security systems, night operation' 
  },
  thriller: { 
    setting: 'tense thriller environment', 
    atmosphere: 'suspense and danger', 
    elements: 'urban setting, shadows, tension' 
  },
  
  // Superhero
  superhero: { 
    setting: 'heroic cityscape', 
    atmosphere: 'larger than life heroism', 
    elements: 'city rooftop, dramatic sky, urban backdrop' 
  },
  supervillain: { 
    setting: 'villainous lair', 
    atmosphere: 'menacing power, dark ambition', 
    elements: 'secret base, technology, destruction' 
  },
  comic_book: { 
    setting: 'dynamic comic scene', 
    atmosphere: 'bold heroic drama', 
    elements: 'city, action, dramatic lighting' 
  },
  
  // Slice of life & Drama
  slice_of_life: { 
    setting: 'everyday comfortable location', 
    atmosphere: 'warm familiar comfort', 
    elements: 'cozy home, neighborhood, everyday spaces' 
  },
  romance: { 
    setting: 'romantic setting', 
    atmosphere: 'intimate warmth, emotional connection', 
    elements: 'soft lighting, elegant venue, romantic ambiance' 
  },
  comedy: { 
    setting: 'bright everyday setting', 
    atmosphere: 'lighthearted fun, vibrant energy', 
    elements: 'colorful environment, casual spaces' 
  },
  drama: { 
    setting: 'emotionally charged setting', 
    atmosphere: 'intense personal drama', 
    elements: 'intimate spaces, meaningful locations' 
  },
  
  // Mythological
  mythology: { 
    setting: 'mythological realm', 
    atmosphere: 'divine legend, ancient power', 
    elements: 'temples, divine symbols, mythic landscape' 
  },
  greek_mythology: { 
    setting: 'Mount Olympus or ancient Greece', 
    atmosphere: 'divine Greek mythology', 
    elements: 'Greek temples, clouds, divine lighting' 
  },
  norse_mythology: { 
    setting: 'Nordic mythological realm', 
    atmosphere: 'Viking mythology, runic power', 
    elements: 'Yggdrasil, runes, Norse architecture' 
  },
  
  // Asian-inspired
  wuxia: { 
    setting: 'ancient Chinese martial world', 
    atmosphere: 'martial arts epic, honor and skill', 
    elements: 'bamboo forests, temples, mountains' 
  },
  xianxia: { 
    setting: 'celestial cultivation realm', 
    atmosphere: 'immortal cultivation, cosmic power', 
    elements: 'floating mountains, mystical clouds, cultivation sect' 
  },
  samurai: { 
    setting: 'feudal Japan', 
    atmosphere: 'bushido honor, Japanese aesthetics', 
    elements: 'Japanese castle, cherry blossoms, traditional architecture' 
  },
  
  // Misc
  urban_fantasy: { 
    setting: 'modern city with hidden magic', 
    atmosphere: 'magic hidden in modern world', 
    elements: 'city streets, hidden magical elements, urban night' 
  },
  grimdark: { 
    setting: 'brutal dark fantasy world', 
    atmosphere: 'grim hopeless darkness, moral gray', 
    elements: 'mud, blood, dark castles, bleak landscape' 
  },
  apocalyptic: { 
    setting: 'world ending catastrophe', 
    atmosphere: 'final days, desperate survival', 
    elements: 'destruction, fire, chaos' 
  },
  dystopia: { 
    setting: 'oppressive dystopian society', 
    atmosphere: 'totalitarian control, resistance', 
    elements: 'propaganda, brutalist architecture, surveillance' 
  },
  utopia: { 
    setting: 'perfect society', 
    atmosphere: 'harmonious idealism', 
    elements: 'gleaming cities, gardens, peace' 
  },
};

// ============================================================================
// ROLE STYLES - Character occupation/class descriptions
// ============================================================================

const ROLE_STYLES: Record<string, string> = {
  // Military/Combat
  soldier: 'professional soldier, tactical vest, combat gear, military bearing',
  medic: 'combat medic, medical gear, red cross insignia, healing focus',
  sniper: 'precision sniper, scope rifle, patient deadly focus',
  heavy: 'heavy weapons specialist, machine gun, imposing presence',
  engineer: 'combat engineer, tools and equipment, tactical goggles',
  pilot: 'aircraft pilot, flight suit, aviator bearing',
  officer: 'military officer, decorated uniform, command presence',
  spec_ops: 'special operations operator, elite tactical gear, lethal efficiency',
  commando: 'elite commando, black tactical equipment, deadly professional',
  marine: 'combat marine, USMC bearing, warrior discipline',

  // Fantasy Classes
  knight: 'armored knight, plate armor, sword and shield, noble bearing',
  rogue: 'stealthy rogue, leather armor, daggers, cunning expression',
  mage: 'powerful mage, mystical robes, arcane energy, wise eyes',
  wizard: 'learned wizard, magical staff, spellbook, ancient knowledge',
  warlock: 'dark warlock, eldritch pact markings, otherworldly power',
  paladin: 'holy paladin, blessed shining armor, righteous aura',
  berserker: 'fierce berserker, war paint, massive weapon, rage barely contained',
  warrior: 'battle-hardened warrior, practical armor, experienced fighter',
  cleric: 'divine cleric, religious vestments, holy symbol, healing grace',
  druid: 'nature druid, organic robes, wooden staff, wild connection',
  monk: 'disciplined monk, simple robes, martial arts stance, inner peace',
  barbarian: 'tribal barbarian, primitive gear, raw physical power',
  archer: 'skilled archer, bow and quiver, keen eyes, steady aim',
  assassin: 'deadly assassin, dark hooded attire, hidden blades, lethal grace',
  necromancer: 'dark necromancer, skull motifs, death magic aura',
  alchemist: 'experimental alchemist, potions and vials, chemical knowledge',

  // Cyberpunk
  solo: 'elite mercenary solo, chrome cybernetics, tactical armor, dangerous',
  netrunner: 'hacker netrunner, neural interface, data cables, digital focus',
  fixer: 'connected fixer, expensive street fashion, chrome accents, smooth operator',
  techie: 'tech specialist, cybernetic eye, tools and gadgets',
  nomad: 'road warrior nomad, dust-worn armor, chrome modifications',
  corpo: 'corporate agent, sleek tactical suit, hidden enhancements',

  // Sci-Fi
  captain: 'starship captain, command uniform, leadership bearing',
  bounty_hunter: 'bounty hunter, worn armor, multiple weapons, hardened tracker',
  smuggler: 'spacer smuggler, practical clothes, blaster, roguish charm',
  android: 'synthetic android, perfect features, visible synthetic elements',
  cyborg: 'cybernetic cyborg, visible mechanical enhancements',

  // Horror
  survivor: 'horror survivor, everyday clothes, frightened determination',
  investigator: 'occult investigator, period clothing, flashlight, journal',
  hunter: 'monster hunter, specialized weapons, experienced killer',

  // Noir/Crime
  detective: 'hardboiled detective, long coat, badge, seen-it-all eyes',
  criminal: 'street criminal, urban clothing, concealed weapon',
  gangster: 'period gangster, sharp suit, dangerous reputation',
  thief: 'skilled thief, dark stealth clothing, nimble',
  hitman: 'professional hitman, clean suit, cold efficiency',

  // Western
  gunslinger: 'fast-draw gunslinger, dual revolvers, duster coat, cowboy hat',
  sheriff: 'frontier sheriff, badge, rifle, law and order',
  outlaw: 'wanted outlaw, dusty clothes, bandana, guns',

  // Civilian
  mercenary: 'professional mercenary, mixed gear, weapons, dangerous for hire',
  rebel: 'resistance fighter, improvised gear, rebel insignia, defiant',
  hacker: 'skilled hacker, tech gear, digital specialist',
  merchant: 'wealthy merchant, quality clothing, shrewd',
  noble: 'aristocratic noble, fine clothing, refined bearing',
  scholar: 'learned scholar, academic robes, books, intellectual',
};

// ============================================================================
// PHYSICAL ATTRIBUTE MAPPINGS
// ============================================================================

const PHYSICAL = {
  gender: {
    male: 'man',
    female: 'woman',
    nonbinary: 'person with androgynous features',
    other: 'person',
  } as Record<string, string>,

  build: {
    athletic: 'athletic muscular build with defined muscle tone, broad shoulders, tapered waist',
    lean: 'lean agile build with wiry muscles, efficient movement suggested',
    muscular: 'heavily muscular build with prominent muscle definition, powerful physique',
    average: 'average healthy build with balanced proportions',
    slim: 'slim slender build with delicate frame, graceful proportions',
    stocky: 'stocky sturdy build with thick frame, solid presence',
    large: 'large imposing build with broad frame, commanding physical presence',
    heavyset: 'heavyset build with substantial frame, powerful mass',
    curvy: 'curvy hourglass figure with pronounced curves, feminine silhouette',
    petite: 'petite small frame with delicate proportions',
    thick: 'thick curvy build with full figure, substantial curves',
    lithe: 'lithe graceful build with elegant proportions, dancer physique',
  } as Record<string, string>,

  height: {
    'very short': 'very short stature creating compact vertical presence',
    'short': 'short stature with smaller frame',
    'average': 'average height with balanced proportions',
    'tall': 'tall stature creating commanding vertical presence',
    'very tall': 'very tall imposing stature with elongated proportions',
  } as Record<string, string>,

  skin: {
    pale: 'pale fair skin with porcelain undertones, visible veins',
    light: 'light skin with warm undertones',
    fair: 'fair skin with neutral undertones',
    medium: 'medium skin tone with warm undertones',
    tan: 'tanned skin with golden undertones',
    olive: 'olive skin tone with Mediterranean warmth',
    brown: 'brown skin with rich warm undertones',
    dark: 'dark skin with deep warm undertones',
    ebony: 'deep ebony skin with rich dark tones',
    porcelain: 'porcelain pale skin with luminous quality',
  } as Record<string, string>,

  hairColor: {
    black: 'jet black hair with blue-black sheen',
    brown: 'brown hair with natural highlights',
    darkBrown: 'dark brown hair with depth',
    lightBrown: 'light brown hair with warm tones',
    blonde: 'blonde hair with golden highlights',
    dirtyBlonde: 'dirty blonde hair with mixed tones',
    platinum: 'platinum blonde hair almost white',
    red: 'vibrant red hair with copper undertones',
    auburn: 'auburn hair with red-brown warmth',
    ginger: 'ginger orange-red hair',
    white: 'pure white hair',
    gray: 'natural gray hair with silver streaks',
    silver: 'metallic silver hair',
    blue: 'bright blue dyed hair',
    pink: 'pink dyed hair',
    purple: 'purple dyed hair',
    green: 'green dyed hair',
  } as Record<string, string>,

  hairStyle: {
    short: 'short cropped hair close to head',
    medium: 'medium length hair falling to shoulders',
    military: 'military buzz cut extremely short',
    mohawk: 'mohawk hairstyle with shaved sides',
    shaved: 'completely shaved head',
    bald: 'naturally bald head, smooth scalp',
    long: 'long flowing hair past shoulders',
    ponytail: 'hair pulled back in ponytail',
    braided: 'hair styled in braids',
    undercut: 'undercut hairstyle with longer top',
    messy: 'messy tousled hair with natural texture',
    slicked: 'slicked back hair with product shine',
    curly: 'naturally curly textured hair with defined curls',
    dreads: 'hair styled in dreadlocks',
    wavy: 'naturally wavy hair with soft waves',
    spiky: 'spiky styled hair with product',
    pixie: 'short pixie cut feminine style',
    bob: 'chin-length bob cut',
  } as Record<string, string>,

  eyeColor: {
    brown: 'deep brown eyes with warm tones and light reflections',
    blue: 'clear blue eyes with depth and catchlights',
    green: 'vivid green eyes with gold flecks',
    hazel: 'hazel eyes shifting between green and brown',
    gray: 'cool gray eyes with silver tones',
    amber: 'striking amber eyes with golden warmth',
    heterochromia: 'heterochromia with two different colored eyes',
    violet: 'rare violet eyes',
    golden: 'unusual golden eyes',
    cybernetic: 'glowing cybernetic eyes with digital elements',
  } as Record<string, string>,

  faceShape: {
    oval: 'oval face shape with balanced proportions',
    round: 'round face with soft contours',
    square: 'square face with strong jawline and angular features',
    heart: 'heart-shaped face with wider forehead tapering to chin',
    long: 'long face with elongated proportions',
    angular: 'angular face with sharp defined bone structure',
    diamond: 'diamond face shape with high cheekbones',
  } as Record<string, string>,
};

// ============================================================================
// DISTINGUISHING FEATURES MAPPINGS
// ============================================================================

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  // Facial scars
  'Facial scar': 'prominent facial scar with healed tissue, telling of past violence',
  'Scar across eye': 'dramatic scar running across eye area, weathered with age',
  'Burn scars': 'burn scar tissue with texture variation, healed but visible',

  // Skin features
  'Freckles': 'freckles scattered across nose and cheeks, natural sun-kissed pattern',
  'Dimples': 'charming dimples in cheeks',
  'Beauty mark': 'distinctive beauty mark on face',
  'Moles': 'natural moles as distinguishing marks',

  // Facial structure
  'Cleft chin': 'defined cleft chin',
  'High cheekbones': 'high prominent cheekbones casting shadows',
  'Strong jaw': 'strong defined jawline with powerful structure',
  'Soft features': 'soft gentle facial features with rounded contours',
  'Sharp features': 'sharp angular features with defined planes',
  'Weathered face': 'weathered experienced face showing life lived',
  'Youthful face': 'youthful smooth face with fresh vitality',

  // Facial hair
  'Beard': 'full beard with natural texture and volume',
  'Stubble': 'rugged stubble across jaw and chin',
  'Mustache': 'styled mustache',
  'Goatee': 'neat goatee beard',
  'Clean shaven': 'clean shaven smooth face',

  // Eye features
  'Eyepatch': 'eyepatch covering one eye, weathered leather or fabric',

  // Body features
  'Body scars': 'visible scars on body telling stories of survival',
  'Birthmark': 'natural birthmark as distinguishing feature',
};

// ============================================================================
// ACCESSORY DESCRIPTIONS
// ============================================================================

const ACCESSORY_DESCRIPTIONS: Record<string, string> = {
  // Eyewear
  'Glasses': 'wearing glasses with visible frames, lens catching light',
  'Sunglasses': 'wearing sunglasses with reflective or tinted lenses',
  'Goggles': 'goggles either worn or resting on head',

  // Earrings
  'Earrings': 'earrings catching light, metal or gemstone',
  'Ear studs': 'subtle ear studs',
  'Hoop earrings': 'hoop earrings of visible size',
  'Dangle earrings': 'dangle earrings with movement',

  // Necklaces
  'Necklace': 'necklace visible against skin or clothing',
  'Choker': 'choker worn close around neck',
  'Pendant': 'pendant necklace with meaningful charm',
  'Chain': 'chain necklace in metal',
  'Dog tags': 'military dog tags on chain',

  // Rings & Bracelets
  'Ring': 'ring on finger, metal band visible',
  'Rings': 'multiple rings on fingers',
  'Bracelet': 'bracelet on wrist',
  'Watch': 'watch on wrist with visible face',
  'Cuff': 'cuff bracelet on wrist',

  // Head accessories
  'Hat': 'wearing appropriate hat for setting',
  'Bandana': 'bandana worn on head or around neck',
  'Headband': 'headband keeping hair in place',
  'Circlet': 'circlet or headpiece across forehead',
  'Crown': 'crown or coronet denoting royalty',
  'Hood': 'hood pulled up or resting on shoulders',

  // Neck & Face
  'Scarf': 'scarf draped around neck',
  'Mask': 'mask covering part of face',
  'Collar': 'distinctive collar on clothing',

  // Other
  'Tattoo face': 'visible facial tattoos with intentional design',
  'War paint': 'war paint or face markings with tribal or combat significance',
  'Heavy makeup': 'dramatic heavy makeup with bold choices',
  'Natural makeup': 'subtle natural makeup enhancing features',
};

// ============================================================================
// BODY MODIFICATIONS
// ============================================================================

const MODIFICATION_DESCRIPTIONS = {
  tattoos: (locations: string[], style?: string) => {
    const styleDesc = style ? `${style} style` : 'detailed';
    return `${styleDesc} tattoos visible on ${locations.join(', ')}, ink work with artistic design`;
  },

  piercings: (locations: string[]) => {
    return `piercings: ${locations.join(', ')}, metal jewelry catching light`;
  },

  scars: (locations: string[]) => {
    return `visible scars on ${locations.join(', ')}, healed tissue showing history`;
  },

  implants: (types: string[]) => {
    return `cybernetic implants: ${types.join(', ')}, technology integrated with flesh`;
  },

  prosthetics: (types: string[]) => {
    return `prosthetic: ${types.join(', ')}, mechanical replacement visible`;
  },

  mutations: (types: string[]) => {
    return `mutations: ${types.join(', ')}, inhuman alterations to form`;
  },
};

// ============================================================================
// EXPRESSION & EMOTION MAPPING
// ============================================================================

const EXPRESSION_MAP: Record<string, string> = {
  // Dispositions
  'Bold': 'confident assertive expression with direct intensity',
  'Cautious': 'alert watchful expression with guarded awareness',
  'Adaptable': 'calm collected expression with easy composure',

  // Social styles
  'Charming': 'charming slight smile with magnetic warmth',
  'Reserved': 'reserved composed expression with quiet dignity',
  'Blunt': 'direct intense gaze with unflinching honesty',

  // Emotions
  'neutral': 'neutral calm expression with quiet confidence',
  'happy': 'genuine warm smile reaching the eyes',
  'angry': 'fierce intense expression with controlled rage',
  'sad': 'melancholy expression with deep emotion in eyes',
  'determined': 'resolute determined expression with steel will',
  'confident': 'self-assured confident expression radiating competence',
  'mysterious': 'enigmatic mysterious expression hiding secrets',
  'fierce': 'fierce aggressive expression ready for conflict',
  'kind': 'gentle kind expression with warmth and empathy',
  'tired': 'weary tired expression showing exhaustion',
  'serious': 'serious focused expression with gravity',
  'playful': 'playful mischievous expression with hints of fun',
};

// ============================================================================
// MAIN PROMPT BUILDER - ULTIMATE STRUCTURE
// ============================================================================

function buildUltimatePrompt(body: any): { prompt: string; negative_prompt: string } {
  const {
    // Core identity
    gender,
    age,
    height,
    // Physical
    build,
    skinTone,
    hairColor,
    hairStyle,
    eyeColor,
    faceShape,
    // Additional details text field - ABSOLUTE PRIORITY
    additionalDetails,
    characterAdditionals,
    customDescription,
    // Role/Class
    characterClass,
    // Genre
    genre,
    // Origin/Background
    origin,
    spawnPoint,
    background,
    // Distinguishing features
    details,
    distinguishingFeatures,
    facialFeatures,
    distinguishingMarks,
    // Accessories
    accessories,
    // Body modifications
    piercings,
    tattoos,
    tattooStyle,
    scars,
    implants,
    prosthetics,
    mutations,
    // Clothing
    clothingStyle,
    clothingDetails,
    // Expression
    disposition,
    socialStyle,
    emotionVariant,
    // Portrait hints
    portraitHints,
  } = body;

  console.log("=== ULTIMATE PROMPT BUILDER ===");
  
  // =========================================================================
  // 🎯 PRIORITY: USER ADDITIONAL DETAILS - ABSOLUTE CONTROL
  // This section FULLY overrides any conflicting base settings
  // =========================================================================
  
  const userAdditionalDetails = additionalDetails || characterAdditionals || customDescription || '';
  console.log("User Additional Details (PRIORITY):", userAdditionalDetails || "(none)");
  
  // =========================================================================
  // [FOUNDATION: CORE PHYSICAL STRUCTURE]
  // =========================================================================
  
  const lookup = (map: Record<string, string>, key: string | undefined, fallback: string): string => {
    if (!key) return fallback;
    const directMatch = map[key];
    if (directMatch) return directMatch;
    const lowerKey = key.toLowerCase();
    for (const k of Object.keys(map)) {
      if (k.toLowerCase() === lowerKey) return map[k];
    }
    return key;
  };
  
  // Gender and age
  const genderStr = lookup(PHYSICAL.gender, gender, 'person');
  const ageStr = age ? `${age} year old` : 'adult';
  const heightStr = height ? lookup(PHYSICAL.height, height, `${height} stature`) : '';
  
  // Build - detailed body architecture
  const buildStr = lookup(PHYSICAL.build, build, 'average healthy build');
  
  // Skin
  const skinStr = lookup(PHYSICAL.skin, skinTone, 'medium skin tone with natural undertones');
  
  // Face
  const faceStr = faceShape ? lookup(PHYSICAL.faceShape, faceShape, '') : '';
  
  // Eyes
  const eyeStr = lookup(PHYSICAL.eyeColor, eyeColor, 'expressive eyes with depth');
  
  // Hair
  const hairColorStr = lookup(PHYSICAL.hairColor, hairColor, 'natural hair');
  const hairStyleStr = lookup(PHYSICAL.hairStyle, hairStyle, 'styled hair');
  
  // Build foundation section
  const foundationParts: string[] = [];
  foundationParts.push(`${ageStr} ${genderStr} presenting individual`);
  if (heightStr) foundationParts.push(heightStr);
  foundationParts.push(`Body Architecture: ${buildStr}`);
  foundationParts.push(`posture: body angled 15 degrees for depth while maintaining frontal presence, confident natural stance`);
  
  const foundationStr = foundationParts.join(', ');
  console.log("Foundation:", foundationStr);
  
  // =========================================================================
  // [FACIAL ARCHITECTURE - MAXIMUM DETAIL]
  // =========================================================================
  
  const facialParts: string[] = [];
  if (faceStr) facialParts.push(`Face Shape: ${faceStr}`);
  facialParts.push(`Skin: ${skinStr}, natural texture with visible pores, natural skin variations`);
  facialParts.push(`Eyes: ${eyeStr}, direct camera gaze with emotional depth, catchlights reflecting`);
  facialParts.push(`Hair: ${hairColorStr} ${hairStyleStr}, natural texture and dimension`);
  
  const facialStr = facialParts.join(', ');
  console.log("Facial Architecture:", facialStr);
  
  // =========================================================================
  // [DISTINGUISHING FEATURES - LAYERED DETAIL]
  // =========================================================================
  
  const featureParts: string[] = [];
  
  // Process details array
  if (details && Array.isArray(details)) {
    details.forEach((d: string) => {
      const mapped = FEATURE_DESCRIPTIONS[d] || ACCESSORY_DESCRIPTIONS[d];
      if (mapped) featureParts.push(mapped);
      else if (d) featureParts.push(d);
    });
  }
  
  // Process distinguishing features
  if (distinguishingFeatures && Array.isArray(distinguishingFeatures)) {
    distinguishingFeatures.forEach((f: string) => {
      const mapped = FEATURE_DESCRIPTIONS[f];
      if (mapped && !featureParts.some(p => p.includes(mapped))) {
        featureParts.push(mapped);
      } else if (f) {
        featureParts.push(f);
      }
    });
  }
  
  // Process accessories
  if (accessories && Array.isArray(accessories)) {
    accessories.forEach((a: string) => {
      const mapped = ACCESSORY_DESCRIPTIONS[a];
      if (mapped && !featureParts.some(p => p.includes(mapped))) {
        featureParts.push(mapped);
      } else if (a) {
        featureParts.push(`wearing ${a}`);
      }
    });
  }
  
  // Add facial features text
  if (facialFeatures) featureParts.push(facialFeatures);
  if (distinguishingMarks) featureParts.push(distinguishingMarks);
  
  // Add portrait hints
  if (portraitHints && Array.isArray(portraitHints)) {
    portraitHints.forEach((hint: string) => {
      if (hint && !featureParts.includes(hint)) featureParts.push(hint);
    });
  }
  
  const featuresStr = featureParts.length > 0 
    ? `Distinguishing Features: ${featureParts.join(', ')}`
    : '';
  console.log("Features:", featuresStr || "(none)");
  
  // =========================================================================
  // [BODY MODIFICATIONS]
  // =========================================================================
  
  const modParts: string[] = [];
  
  if (tattoos && Array.isArray(tattoos) && tattoos.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.tattoos(tattoos, tattooStyle));
  }
  if (piercings && Array.isArray(piercings) && piercings.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.piercings(piercings));
  }
  if (scars && Array.isArray(scars) && scars.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.scars(scars));
  }
  if (implants && Array.isArray(implants) && implants.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.implants(implants));
  }
  if (prosthetics && Array.isArray(prosthetics) && prosthetics.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.prosthetics(prosthetics));
  }
  if (mutations && Array.isArray(mutations) && mutations.length > 0) {
    modParts.push(MODIFICATION_DESCRIPTIONS.mutations(mutations));
  }
  
  const modsStr = modParts.length > 0 
    ? `Body Modifications: ${modParts.join(', ')}`
    : '';
  console.log("Modifications:", modsStr || "(none)");
  
  // =========================================================================
  // [CLOTHING]
  // Check if user additional details contain clothing - if so, use that instead
  // =========================================================================
  
  const userDetailsLower = userAdditionalDetails.toLowerCase();
  const hasUserClothing = [
    'wearing', 'dressed', 'clothing', 'clothes', 'outfit', 'uniform', 'armor', 'suit',
    'military', 'ww1', 'ww2', 'world war', 'victorian', 'medieval', 'modern', 'futuristic',
    'casual', 'formal', 'tactical', 'dress', 'gown', 'jacket', 'coat', 'jeans', 'pants',
    'skirt', 'shirt', 'hoodie', 'leather', 'denim', 'robe', 'cloak', 'cape',
  ].some(keyword => userDetailsLower.includes(keyword));
  
  let clothingStr = '';
  if (!hasUserClothing) {
    // Use clothing details or genre defaults
    if (clothingDetails && Array.isArray(clothingDetails) && clothingDetails.length > 0) {
      clothingStr = `Clothing: ${clothingDetails.join(', ')}`;
    } else if (clothingStyle) {
      clothingStr = `Clothing style: ${clothingStyle}`;
    }
  }
  console.log("Clothing:", clothingStr || "(from user details or genre)");
  
  // =========================================================================
  // [EXPRESSION & EMOTION]
  // =========================================================================
  
  let expressionStr = 'Expression: direct eye contact with camera, engaging the viewer';
  
  if (emotionVariant && EXPRESSION_MAP[emotionVariant]) {
    expressionStr = `Expression: ${EXPRESSION_MAP[emotionVariant]}, direct eye contact with camera`;
  } else if (disposition && EXPRESSION_MAP[disposition]) {
    expressionStr = `Expression: ${EXPRESSION_MAP[disposition]}, direct eye contact with camera`;
  } else if (socialStyle && EXPRESSION_MAP[socialStyle]) {
    expressionStr = `Expression: ${EXPRESSION_MAP[socialStyle]}, direct eye contact with camera`;
  }
  
  console.log("Expression:", expressionStr);
  
  // =========================================================================
  // [ROLE/CLASS IDENTITY]
  // =========================================================================
  
  let roleStr = '';
  if (characterClass) {
    const classLower = characterClass.toLowerCase().replace(/[\s-]/g, '_');
    roleStr = ROLE_STYLES[classLower] || characterClass;
  }
  console.log("Role:", roleStr || "(none)");
  
  // =========================================================================
  // [GENRE BACKGROUND]
  // =========================================================================
  
  const genreKey = genre?.toLowerCase().replace(/[\s-]/g, '_') || 'fantasy';
  const genreData = GENRE_BACKGROUNDS[genreKey] || GENRE_BACKGROUNDS.fantasy;
  
  const backgroundStr = `Background: ${genreData.setting} softly blurred (f/1.8 depth of field), ${genreData.atmosphere}, visible elements: ${genreData.elements}`;
  console.log("Background:", backgroundStr);
  
  // =========================================================================
  // [TECHNICAL SPECIFICATIONS]
  // =========================================================================
  
  const technicalStr = `Camera: 85mm f/1.8 equivalent, three-point studio lighting, sharp focus on eyes and face, body in focus, background bokeh, 8K resolution, photorealistic skin with subsurface scattering, individual hair strands visible, fabric texture detail, professional color grading`;
  
  // =========================================================================
  // ASSEMBLE FINAL PROMPT
  // Priority order:
  // 1. Camera/Composition (locked)
  // 2. USER ADDITIONAL DETAILS (ABSOLUTE PRIORITY - takes over generation)
  // 3. Foundation (gender, age, height, build)
  // 4. Facial Architecture (skin, face, eyes, hair)
  // 5. Distinguishing Features
  // 6. Body Modifications
  // 7. Expression
  // 8. Role/Class (if not overridden)
  // 9. Clothing (if not overridden by user)
  // 10. Background
  // 11. Technical specs
  // 12. Quality tags
  // =========================================================================
  
  const promptParts: string[] = [];
  
  // 1. Camera & Composition - LOCKED
  promptParts.push(CAMERA_COMPOSITION);
  
  // 2. 🎯 USER ADDITIONAL DETAILS - ABSOLUTE PRIORITY (inserted verbatim)
  if (userAdditionalDetails.trim()) {
    promptParts.push(`[PRIORITY - USER SPECIFIED]: ${userAdditionalDetails.trim()}`);
    console.log("*** USER ADDITIONAL DETAILS TAKING PRIORITY ***");
  }
  
  // 3. Foundation
  promptParts.push(foundationStr);
  
  // 4. Facial Architecture
  promptParts.push(facialStr);
  
  // 5. Distinguishing Features
  if (featuresStr) promptParts.push(featuresStr);
  
  // 6. Body Modifications
  if (modsStr) promptParts.push(modsStr);
  
  // 7. Expression
  promptParts.push(expressionStr);
  
  // 8. Role (only if no user override)
  if (roleStr && !hasUserClothing) {
    promptParts.push(`Role: ${roleStr}`);
  }
  
  // 9. Clothing (only if not in user details)
  if (clothingStr && !hasUserClothing) {
    promptParts.push(clothingStr);
  }
  
  // 10. Background
  promptParts.push(backgroundStr);
  
  // 11. Technical
  promptParts.push(technicalStr);
  
  // 12. Quality tags
  promptParts.push(QUALITY_TAGS);
  
  const finalPrompt = promptParts.join('. ');
  
  console.log("=== FINAL PROMPT ===");
  console.log("Length:", finalPrompt.length);
  console.log("Prompt:", finalPrompt);
  
  return {
    prompt: finalPrompt,
    negative_prompt: NEGATIVE_PROMPT,
  };
}

// ============================================================================
// LEGACY PROMPT BUILDER (backwards compatibility)
// ============================================================================

function buildLegacyPrompt(requestData: any) {
  const { appearance, characterClass, genre } = requestData;
  
  const appearanceLower = (appearance || '').toLowerCase();
  
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

  return buildUltimatePrompt({
    gender,
    build,
    characterClass,
    genre: genre || 'fantasy',
  });
}

// ============================================================================
// TOGETHER.AI IMAGE GENERATION
// ============================================================================

async function generateWithTogetherAI(prompt: string, negativePrompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  
  if (!TOGETHER_API_KEY) {
    throw new Error("TOGETHER_API_KEY is not configured");
  }

  console.log("Generating with FLUX.1-dev (photorealistic portrait)");
  console.log("Prompt preview:", prompt.substring(0, 300) + "...");

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
      negative_prompt: negativePrompt,
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
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, gender, emotionVariant } = body;

    console.log("Portrait request for:", name || "Unknown");
    console.log("Request body keys:", Object.keys(body).join(', '));
    
    let promptData;
    
    // Use ultimate builder for new-style requests (has gender field)
    if (gender) {
      console.log("Using ULTIMATE prompt builder");
      promptData = buildUltimatePrompt(body);
    } else {
      // Legacy mode for old requests
      console.log("Using legacy prompt builder");
      promptData = buildLegacyPrompt(body);
    }

    const imageUrl = await generateWithTogetherAI(promptData.prompt, promptData.negative_prompt);

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
