import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STRICT CHARACTER PORTRAIT PROMPT SYSTEM
// Precise literal descriptions - minimal AI interpretation
// ============================================================================

// STRICT framing - exact composition requirements
const PORTRAIT_FRAMING = `Photographic portrait, three-quarter length, framed from knees to top of head. Subject centered, body angled 15 degrees, face and eyes looking directly at camera. Sharp focus on subject, background blurred`;

// Quality - emphasize accuracy to description
const QUALITY_TAGS = `Photorealistic, sharp details, accurate to description, 8K, professional lighting`;

// STRICT negative - prevent AI from changing described features
const NEGATIVE_PROMPT = `anime, cartoon, illustration, 3d render, painting, sketch, stylized, artistic interpretation, looking away, profile view, side view, extra limbs, deformed, cropped, close-up only, headshot only, bust only, full body, feet visible, plain solid background, added accessories not in description, changed clothing from description, different hair than described, wrong eye color, wrong skin tone, artistic license`;

// ============================================================================
// GENRE DATA - Environment, lighting, colors, clothing defaults
// ============================================================================

interface GenreData {
  settings: string[];
  lighting: string;
  colors: string;
  mood: string;
  clothing: string; // Default genre-appropriate clothing
  style: string;
}

const GENRES: Record<string, GenreData> = {
  fantasy: {
    settings: ['medieval tavern', 'ancient library', 'mystical forest', 'castle throne room', 'magical workshop'],
    lighting: 'warm candlelight and magical glow',
    colors: 'burgundy, forest green, royal purple, aged gold',
    mood: 'enchanting and mysterious',
    clothing: 'medieval fantasy attire with leather and cloth, practical adventurer gear',
    style: 'high fantasy',
  },
  medieval: {
    settings: ['castle great hall', 'village tavern', 'monastery', 'blacksmith forge', 'market square'],
    lighting: 'torchlight and fireplace glow',
    colors: 'stone gray, wood brown, iron black, heraldic red and blue',
    mood: 'historical and grounded',
    clothing: 'period-appropriate medieval clothing, wool and linen, leather belts',
    style: 'historical medieval',
  },
  dark_fantasy: {
    settings: ['cursed castle', 'dead forest', 'necromancer tower', 'haunted battlefield', 'dark cathedral'],
    lighting: 'sickly magical glow and moonlight',
    colors: 'deep black, charcoal, sickly green, blood red, corrupt purple',
    mood: 'ominous and dread-filled',
    clothing: 'dark worn armor, tattered cloaks, bone accessories, corrupted materials',
    style: 'dark souls aesthetic',
  },
  high_fantasy: {
    settings: ['crystal palace', 'elven forest city', 'magical academy', 'celestial temple'],
    lighting: 'magical radiance and divine light',
    colors: 'royal blue, elven green, celestial gold, pure white',
    mood: 'wonder and heroic',
    clothing: 'elegant robes, enchanted armor, fine elven craft, magical accessories',
    style: 'Tolkien-esque high fantasy',
  },
  scifi: {
    settings: ['spaceship interior', 'futuristic laboratory', 'space station', 'high-tech command center'],
    lighting: 'LED strips and holographic projections',
    colors: 'metallic gray, space black, neon cyan, electric blue',
    mood: 'advanced and clinical',
    clothing: 'sleek jumpsuit, tactical space gear, tech-enhanced uniform, utility vest',
    style: 'hard sci-fi',
  },
  sci_fi: {
    settings: ['spaceship bridge', 'orbital station', 'alien planet surface', 'research facility'],
    lighting: 'cool blue LEDs and screen glow',
    colors: 'steel blue, chrome silver, warning orange, space black',
    mood: 'futuristic and mysterious',
    clothing: 'form-fitting space suit, utility harness, tech accessories, rank insignia',
    style: 'space opera',
  },
  space_opera: {
    settings: ['starship bridge', 'alien planet', 'galactic senate', 'space station promenade'],
    lighting: 'dramatic starship lighting and alien suns',
    colors: 'deep space black, starship silver, nebula purple, energy gold',
    mood: 'epic and adventurous',
    clothing: 'starship uniform, adventure gear, alien-influenced fashion, practical spacer outfit',
    style: 'Star Wars aesthetic',
  },
  cyberpunk: {
    settings: ['neon-lit alley with rain', 'high-tech nightclub', 'megacorp interior', 'hacker den', 'rooftop cityscape'],
    lighting: 'neon signs pink cyan purple, wet reflections',
    colors: 'deep black, neon magenta, cyan, toxic green, chrome',
    mood: 'dystopian high-tech low-life',
    clothing: 'tech-enhanced street fashion, leather jacket with LED trim, tactical urban wear, chrome accessories',
    style: 'Blade Runner aesthetic',
  },
  horror: {
    settings: ['abandoned asylum', 'decrepit mansion', 'dark forest', 'foggy graveyard', 'haunted church'],
    lighting: 'harsh shadows and flickering light',
    colors: 'deep black, charcoal, blood red, sickly green',
    mood: 'dread and unease',
    clothing: 'everyday clothes showing wear, practical survival gear, period-appropriate attire',
    style: 'gothic horror',
  },
  vampire: {
    settings: ['gothic castle interior', 'moonlit cemetery', 'Victorian mansion', 'candlelit crypt'],
    lighting: 'candlelight contrasting with moonlight',
    colors: 'deep crimson, black velvet, midnight purple, bone white',
    mood: 'aristocratic darkness',
    clothing: 'elegant Victorian attire, velvet coat, lace details, aristocratic finery',
    style: 'gothic vampire romance',
  },
  lovecraft: {
    settings: ['1920s New England study', 'misty coastal town', 'ancient library', 'foggy docks'],
    lighting: 'dim gas lamps and unnatural shadows',
    colors: 'sea-gray, aged brown, eldritch green, cosmic purple',
    mood: 'cosmic dread',
    clothing: '1920s period attire, tweed jacket, practical investigator wear, weathered coat',
    style: 'Lovecraftian cosmic horror',
  },
  mystery: {
    settings: ['detective office with venetian blinds', 'noir alley with rain', 'upscale study', 'foggy street'],
    lighting: 'dramatic single-source creating shadows',
    colors: 'deep brown, charcoal, slate gray, warm amber',
    mood: 'mysterious and contemplative',
    clothing: 'trench coat, fedora, period-appropriate detective attire, practical investigator wear',
    style: 'film noir',
  },
  noir: {
    settings: ['rain-slicked city street', 'smoky jazz club', 'detective office', 'dark alley'],
    lighting: 'extreme chiaroscuro, neon signs',
    colors: 'black, dark gray, neon accents, cigarette ember orange',
    mood: 'fatalistic and dangerous',
    clothing: 'sharp suit, trench coat, fedora, 1940s period attire',
    style: 'classic film noir',
  },
  pirate: {
    settings: ['ship captain cabin', 'tropical beach', 'port tavern', 'ship deck with rigging'],
    lighting: 'lantern light and tropical sun',
    colors: 'ocean blue, weathered wood brown, treasure gold, sail cream',
    mood: 'adventurous and free',
    clothing: 'pirate coat, loose shirt, bandana, leather boots, sailor gear',
    style: 'golden age of piracy',
  },
  western: {
    settings: ['old west saloon', 'dusty main street', 'desert landscape', 'ranch homestead'],
    lighting: 'harsh desert sun and warm oil lamp light',
    colors: 'desert tan, weathered brown, dusty orange, faded denim blue',
    mood: 'rugged frontier spirit',
    clothing: 'cowboy hat, duster coat, vest, leather chaps, work boots',
    style: 'classic western',
  },
  postapoc: {
    settings: ['ruined city', 'desert wasteland', 'abandoned bunker', 'survivor settlement'],
    lighting: 'harsh sunlight through dust and fire glow',
    colors: 'desert tan, rust brown, concrete gray, toxic green',
    mood: 'desolate and survivalist',
    clothing: 'scavenged armor, practical survival gear, gas mask, worn tactical clothing',
    style: 'Fallout/Mad Max aesthetic',
  },
  post_apocalyptic: {
    settings: ['collapsed buildings', 'wasteland road', 'makeshift shelter', 'overgrown ruins'],
    lighting: 'harsh wasteland sun with dust haze',
    colors: 'rust orange, dead brown, ash gray, warning yellow',
    mood: 'desperate survival',
    clothing: 'improvised armor, scavenged gear, protective wraps, tactical salvage',
    style: 'post-apocalypse survival',
  },
  fallout: {
    settings: ['retro-futuristic bunker', 'nuclear wasteland', 'ruined 1950s suburb', 'vault interior'],
    lighting: 'harsh wasteland sun and vault fluorescents',
    colors: 'vault blue, rust orange, nuclear green, chrome',
    mood: 'retro-apocalypse',
    clothing: 'vault suit, wasteland scrap armor, retro-futuristic gear, radiation suit',
    style: 'Fallout games aesthetic',
  },
  zombie: {
    settings: ['barricaded building', 'overrun city', 'abandoned mall', 'survivor camp'],
    lighting: 'harsh emergency lighting',
    colors: 'gray, dried blood brown, sickly pale',
    mood: 'desperate survival',
    clothing: 'practical survival clothes, improvised protection, tactical gear',
    style: 'Walking Dead survival horror',
  },
  war: {
    settings: ['military trench', 'command center', 'bombed building', 'military base'],
    lighting: 'harsh daylight and explosion flashes',
    colors: 'military olive, field gray, khaki, steel gray',
    mood: 'intense and gritty',
    clothing: 'military uniform, combat gear, tactical vest, helmet',
    style: 'realistic war drama',
  },
  ww1: {
    settings: ['WWI trench', 'no mans land', 'field hospital', 'command tent'],
    lighting: 'overcast and harsh',
    colors: 'mud brown, khaki, gray, dried blood',
    mood: 'grim and brutal',
    clothing: 'WWI uniform, greatcoat, puttees, period military gear',
    style: '1917 film aesthetic',
  },
  ww2: {
    settings: ['WWII battlefield', 'bombed city', 'military bunker', 'resistance hideout'],
    lighting: 'harsh wartime lighting',
    colors: 'olive drab, field gray, army khaki, gunmetal',
    mood: 'wartime intensity',
    clothing: 'WWII military uniform, appropriate insignia, period-accurate gear',
    style: 'Band of Brothers aesthetic',
  },
  modern: {
    settings: ['urban apartment', 'city street', 'coffee shop', 'office building', 'nightclub'],
    lighting: 'natural daylight and modern lighting',
    colors: 'neutral grays, denim blue, contemporary urban palette',
    mood: 'contemporary and relatable',
    clothing: 'modern casual wear, jeans and shirt, contemporary fashion',
    style: 'modern day realism',
  },
  contemporary: {
    settings: ['modern home', 'urban street', 'shopping district', 'restaurant'],
    lighting: 'natural and artificial modern lighting',
    colors: 'contemporary neutral palette with personal accents',
    mood: 'everyday life',
    clothing: 'current fashion trends, casual contemporary outfit',
    style: 'present day',
  },
  steampunk: {
    settings: ['Victorian factory with brass machinery', 'airship interior', 'clockwork laboratory'],
    lighting: 'gas lamps and furnace glow',
    colors: 'brass gold, copper brown, leather tan, iron gray',
    mood: 'inventive and adventurous',
    clothing: 'Victorian with brass goggles, gears, leather straps, clockwork accessories',
    style: 'Victorian retro-futurism',
  },
  victorian: {
    settings: ['London street with gas lamps', 'Victorian parlor', 'industrial factory', 'foggy docks'],
    lighting: 'gas lamp and foggy daylight',
    colors: 'dark brown, black, deep red, gray',
    mood: 'mysterious and elegant',
    clothing: 'period Victorian attire, top hat, corset, layered clothing',
    style: 'Sherlock Holmes aesthetic',
  },
  superhero: {
    settings: ['city rooftop at night', 'secret base', 'urban skyline'],
    lighting: 'dramatic backlighting and city lights',
    colors: 'bold primary colors, dramatic darks',
    mood: 'heroic and powerful',
    clothing: 'hero suit with emblem, cape optional, dramatic design',
    style: 'comic book superhero',
  },
  samurai: {
    settings: ['Japanese castle', 'bamboo forest', 'Zen garden', 'feudal village'],
    lighting: 'natural Japanese light and paper lanterns',
    colors: 'black, red, white, gold, nature green',
    mood: 'honorable and disciplined',
    clothing: 'samurai armor or hakama, katana, traditional Japanese attire',
    style: 'feudal Japan',
  },
  wuxia: {
    settings: ['Chinese mountain temple', 'bamboo forest', 'martial arts school', 'teahouse'],
    lighting: 'dramatic natural light and lanterns',
    colors: 'red, gold, white, black, jade green',
    mood: 'martial excellence and honor',
    clothing: 'flowing martial arts robes, traditional Chinese attire, silk garments',
    style: 'Crouching Tiger aesthetic',
  },
  urban_fantasy: {
    settings: ['modern city with hidden magic', 'supernatural bar', 'magical shop in alley'],
    lighting: 'modern urban with magical accents',
    colors: 'urban gray with magical blue and purple highlights',
    mood: 'secret supernatural world',
    clothing: 'modern clothes with magical accessories, hidden enchanted items',
    style: 'Dresden Files modern supernatural',
  },
  grimdark: {
    settings: ['brutal medieval battlefield', 'corrupt castle', 'plague-ridden city'],
    lighting: 'overcast harsh natural light',
    colors: 'mud brown, blood red, steel gray, black',
    mood: 'brutal and hopeless',
    clothing: 'blood-stained armor, practical brutal gear, worn warrior attire',
    style: 'Game of Thrones dark',
  },
  romance: {
    settings: ['romantic restaurant', 'sunset beach', 'garden party', 'elegant ballroom'],
    lighting: 'soft warm golden hour',
    colors: 'soft pink, cream, gold, white',
    mood: 'romantic and intimate',
    clothing: 'elegant dress or suit, romantic attire, formal wear',
    style: 'romantic drama',
  },
  slice_of_life: {
    settings: ['cozy home', 'neighborhood street', 'local cafe', 'park'],
    lighting: 'warm natural daylight',
    colors: 'warm comfortable naturals',
    mood: 'warm and relatable',
    clothing: 'comfortable everyday clothes, casual relaxed wear',
    style: 'everyday realism',
  },
  spy: {
    settings: ['luxury casino', 'secret base', 'embassy gala', 'exotic location'],
    lighting: 'elegant dramatic lighting',
    colors: 'black, midnight blue, silver, gold',
    mood: 'sophisticated danger',
    clothing: 'tailored suit or elegant dress, concealed weapon hints, sophisticated attire',
    style: 'James Bond espionage',
  },
  crime: {
    settings: ['dark alley', 'interrogation room', 'crime scene', 'underworld bar'],
    lighting: 'harsh unflattering lighting',
    colors: 'black, gray, blood red, neon',
    mood: 'dangerous and gritty',
    clothing: 'street clothes, leather jacket, urban criminal attire',
    style: 'crime drama neo-noir',
  },
  mecha: {
    settings: ['giant robot hangar', 'cockpit interior', 'military base', 'destroyed city'],
    lighting: 'industrial and dramatic',
    colors: 'military colors, steel, unit accent colors',
    mood: 'epic scale military drama',
    clothing: 'pilot suit, military flight gear, interface equipment',
    style: 'Gundam mecha anime',
  },
  dystopia: {
    settings: ['oppressive city', 'propaganda plaza', 'surveillance state', 'resistance hideout'],
    lighting: 'harsh clinical oppressive',
    colors: 'gray, concrete, uniform colors, propaganda red',
    mood: 'oppressive and paranoid',
    clothing: 'utilitarian uniform, resistance symbols hidden, functional oppression-era attire',
    style: '1984 dystopia',
  },
  comedy: {
    settings: ['bright everyday location', 'colorful environment'],
    lighting: 'bright even flattering',
    colors: 'bright cheerful colors',
    mood: 'lighthearted and fun',
    clothing: 'casual colorful expressive clothes',
    style: 'comedy sitcom',
  },
  heist: {
    settings: ['museum at night', 'bank vault', 'casino floor', 'planning room'],
    lighting: 'dramatic thriller lighting',
    colors: 'black, dark blue, silver, gold targets',
    mood: 'tense and clever',
    clothing: 'tactical black outfit, formal disguise wear, heist gear',
    style: 'Oceans Eleven heist thriller',
  },
  supervillain: {
    settings: ['villainous lair', 'destroyed cityscape', 'dark throne room'],
    lighting: 'dramatic underlighting and energy effects',
    colors: 'black, dark purple, blood red, silver',
    mood: 'powerful and menacing',
    clothing: 'dramatic villain costume, power symbols, theatrical evil attire',
    style: 'comic book villain',
  },
  survival: {
    settings: ['wilderness camp', 'mountain terrain', 'forest shelter'],
    lighting: 'natural harsh outdoor light',
    colors: 'natural greens, earth browns, sky colors',
    mood: 'determination against nature',
    clothing: 'outdoor survival gear, hiking clothes, practical wilderness attire',
    style: 'survival realism',
  },
  cold_war: {
    settings: ['Berlin Wall', 'Soviet office', 'CIA safe house', 'Eastern European street'],
    lighting: 'cold institutional lighting',
    colors: 'gray, brown, muted Soviet colors, American blue',
    mood: 'paranoid and tense',
    clothing: 'period Cold War attire, trench coat, institutional uniform',
    style: 'Cold War thriller',
  },
  mythology: {
    settings: ['divine realm', 'ancient temple', 'mythic landscape', 'celestial plane'],
    lighting: 'divine radiance and mystical glow',
    colors: 'divine gold, celestial colors, pantheon-specific',
    mood: 'mythic and legendary',
    clothing: 'divine robes, mythic armor, god-like attire, sacred vestments',
    style: 'classical mythology',
  },
  renaissance: {
    settings: ['Italian palazzo', 'art studio', 'court gathering', 'Renaissance street'],
    lighting: 'Renaissance painting light, golden',
    colors: 'rich red, gold, green, Renaissance palette',
    mood: 'artistic and political intrigue',
    clothing: 'Renaissance finery, velvet doublet, period noble attire',
    style: 'Italian Renaissance',
  },
  ancient: {
    settings: ['Roman forum', 'Greek temple', 'Egyptian palace', 'ancient battlefield'],
    lighting: 'Mediterranean sun and torchlight',
    colors: 'marble white, bronze, terracotta, imperial purple',
    mood: 'classical and epic',
    clothing: 'toga, Greek chiton, gladiator armor, ancient period attire',
    style: 'Gladiator classical epic',
  },
  dieselpunk: {
    settings: ['1930s-40s retro-futuristic city', 'art deco factory', 'wartime tech'],
    lighting: 'dramatic industrial shadows',
    colors: 'art deco gold, industrial gray, propaganda red',
    mood: 'industrial power and art deco elegance',
    clothing: 'art deco influenced military gear, leather flight jacket, period retro-futurism',
    style: 'art deco retro-futurism',
  },
  exploration: {
    settings: ['uncharted wilderness', 'ancient ruins', 'expedition camp', 'mysterious island'],
    lighting: 'adventure natural lighting',
    colors: 'jungle green, ancient stone, adventure khaki',
    mood: 'discovery and wonder',
    clothing: 'expedition gear, explorer outfit, practical adventure wear, pith helmet optional',
    style: 'Indiana Jones adventure',
  },
};

// ============================================================================
// ROLE/CLASS DEFINITIONS
// ============================================================================

// Role clothing by genre - role + genre = specific outfit
const ROLE_GENRE_CLOTHING: Record<string, Record<string, string>> = {
  // Cyberpunk roles
  solo: {
    cyberpunk: 'tactical black jacket with armored plates, cargo pants, combat boots, chrome cybernetic arm',
    default: 'tactical combat gear, body armor, military-grade equipment',
  },
  netrunner: {
    cyberpunk: 'tech-enhanced hoodie with LED strips, neural interface headgear, fingerless gloves with circuits',
    default: 'casual tech-wear with visible interface ports',
  },
  fixer: {
    cyberpunk: 'expensive street fashion suit, chrome accessories, designer tech-wear',
    default: 'sharp business casual with hidden tech',
  },
  techie: {
    cyberpunk: 'work coveralls with tool belt, cybernetic eye lens, utility vest',
    default: 'practical work clothes with tech accessories',
  },
  nomad: {
    cyberpunk: 'dusty leather jacket with tribal patches, road-worn boots, desert goggles',
    postapoc: 'scavenged leather armor, dust mask, tribal tattoos visible',
    default: 'rugged travel gear, weather-worn clothing',
  },
  corpo: {
    cyberpunk: 'sleek designer suit, subtle chrome implants, expensive watch',
    default: 'high-end business attire',
  },
  // Fantasy roles
  knight: {
    fantasy: 'polished plate armor with heraldic surcoat, sword at hip',
    dark_fantasy: 'battle-worn dark steel armor, scratched and dented',
    medieval: 'chainmail and tabard with lord\'s colors',
    default: 'plate armor with sword',
  },
  mage: {
    fantasy: 'flowing arcane robes with glowing runes, mystical staff',
    dark_fantasy: 'tattered dark robes, skull ornaments, corrupted magic traces',
    high_fantasy: 'elegant elven-style robes with crystalline accents',
    default: 'magical robes with arcane symbols',
  },
  rogue: {
    fantasy: 'dark leather armor, hooded cloak, visible daggers',
    medieval: 'practical leather jerkin, dark wool cloak',
    urban_fantasy: 'modern black tactical clothing, hidden weapons',
    default: 'leather armor with hood and daggers',
  },
  warrior: {
    fantasy: 'battle-worn plate and chainmail, greatsword on back',
    grimdark: 'blood-stained heavy armor, brutal weapons',
    default: 'practical heavy armor with weapons',
  },
  // Horror roles
  survivor: {
    horror: 'everyday clothes showing wear and blood stains, improvised weapons',
    zombie: 'torn civilian clothes, makeshift armor pieces, survival gear',
    postapoc: 'scavenged clothing, protective layers, survival equipment',
    default: 'worn everyday clothes with survival gear',
  },
  investigator: {
    horror: '1920s suit and overcoat, fedora, leather satchel',
    lovecraft: 'period-accurate 1920s attire, academic accessories',
    noir: 'detective trench coat, fedora, cigarette',
    default: 'investigator attire with period-appropriate accessories',
  },
  // Western roles
  gunslinger: {
    western: 'dusty duster coat, cowboy hat, dual revolvers in holsters, spurred boots',
    default: 'western gunslinger attire with revolvers',
  },
  sheriff: {
    western: 'tan vest with sheriff badge, cowboy hat, lever-action rifle, leather boots',
    default: 'lawman attire with badge and rifle',
  },
  // Sci-Fi roles
  captain: {
    scifi: 'starship command uniform with rank insignia, communicator badge',
    space_opera: 'military-style captain\'s coat with medals, command sash',
    default: 'captain\'s uniform with command insignia',
  },
  bounty_hunter: {
    scifi: 'worn bounty hunter armor with helmet, utility belt, blaster',
    space_opera: 'Mandalorian-style armor, jetpack, multiple weapons',
    default: 'bounty hunter armor with weapons',
  },
};

const ROLES: Record<string, string> = {
  // Military
  soldier: 'professional soldier',
  medic: 'combat medic',
  sniper: 'precision sniper',
  officer: 'military officer',
  spec_ops: 'special operations operator',
  pilot: 'aircraft pilot',
  
  // Fantasy
  knight: 'armored knight',
  rogue: 'stealthy rogue',
  mage: 'powerful mage',
  wizard: 'learned wizard',
  warlock: 'dark warlock',
  paladin: 'holy paladin',
  warrior: 'battle-hardened warrior',
  cleric: 'divine cleric',
  druid: 'nature druid',
  monk: 'disciplined monk',
  barbarian: 'tribal barbarian',
  archer: 'skilled archer',
  assassin: 'deadly assassin',
  necromancer: 'dark necromancer',
  berserker: 'fierce berserker',
  
  // Cyberpunk
  solo: 'elite mercenary',
  netrunner: 'hacker specialist',
  fixer: 'connected fixer',
  techie: 'tech specialist',
  nomad: 'road warrior',
  corpo: 'corporate agent',
  
  // Sci-Fi
  captain: 'starship captain',
  bounty_hunter: 'bounty hunter',
  smuggler: 'spacer smuggler',
  android: 'synthetic android',
  cyborg: 'cybernetic cyborg',
  
  // Horror
  survivor: 'survivor',
  investigator: 'investigator',
  hunter: 'monster hunter',
  
  // Noir/Crime
  detective: 'hardboiled detective',
  criminal: 'street criminal',
  gangster: 'period gangster',
  thief: 'skilled thief',
  hitman: 'professional hitman',
  
  // Western
  gunslinger: 'fast-draw gunslinger',
  sheriff: 'frontier sheriff',
  outlaw: 'wanted outlaw',
  
  // General
  mercenary: 'professional mercenary',
  rebel: 'resistance fighter',
  noble: 'aristocratic noble',
  scholar: 'learned scholar',
  merchant: 'wealthy merchant',
};

// Get role-specific clothing for genre
function getRoleClothing(role: string, genre: string): string | null {
  const roleKey = role.toLowerCase().replace(/[\s-]/g, '_');
  const genreKey = genre.toLowerCase().replace(/[\s-]/g, '_');
  
  const roleClothes = ROLE_GENRE_CLOTHING[roleKey];
  if (!roleClothes) return null;
  
  return roleClothes[genreKey] || roleClothes['default'] || null;
}

// ============================================================================
// PHYSICAL ATTRIBUTES
// ============================================================================

const PHYSICAL = {
  gender: { male: 'man', female: 'woman', nonbinary: 'androgynous person', other: 'person' } as Record<string, string>,
  
  build: {
    athletic: 'athletic muscular build',
    lean: 'lean agile build',
    muscular: 'heavily muscular build',
    average: 'average build',
    slim: 'slim slender build',
    stocky: 'stocky sturdy build',
    large: 'large imposing build',
    heavyset: 'heavyset substantial build',
    curvy: 'curvy hourglass figure',
    petite: 'petite small frame',
    thick: 'thick curvy build',
    lithe: 'lithe graceful build',
  } as Record<string, string>,

  height: {
    'very short': 'very short stature',
    'short': 'short stature',
    'average': 'average height',
    'tall': 'tall stature',
    'very tall': 'very tall imposing stature',
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
    black: 'black hair',
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
    blue: 'blue dyed hair',
    pink: 'pink dyed hair',
    purple: 'purple dyed hair',
    green: 'green dyed hair',
  } as Record<string, string>,

  hairStyle: {
    short: 'short cropped hair',
    medium: 'medium length hair',
    long: 'long flowing hair',
    military: 'military buzz cut',
    shaved: 'shaved head',
    bald: 'bald head',
    ponytail: 'ponytail',
    braided: 'braided hair',
    undercut: 'undercut hairstyle',
    messy: 'messy tousled hair',
    slicked: 'slicked back hair',
    curly: 'curly hair',
    dreads: 'dreadlocks',
    wavy: 'wavy hair',
    mohawk: 'mohawk',
    pixie: 'pixie cut',
    bob: 'bob cut',
  } as Record<string, string>,

  eyeColor: {
    brown: 'brown eyes',
    blue: 'blue eyes',
    green: 'green eyes',
    hazel: 'hazel eyes',
    gray: 'gray eyes',
    amber: 'amber eyes',
    heterochromia: 'heterochromia eyes',
    violet: 'violet eyes',
    golden: 'golden eyes',
    cybernetic: 'cybernetic glowing eyes',
  } as Record<string, string>,

  faceShape: {
    oval: 'oval face',
    round: 'round face',
    square: 'square face with strong jaw',
    heart: 'heart-shaped face',
    long: 'long face',
    angular: 'angular face',
    diamond: 'diamond face',
  } as Record<string, string>,
};

// ============================================================================
// FEATURES AND ACCESSORIES
// ============================================================================

const FEATURES: Record<string, string> = {
  'Facial scar': 'facial scar',
  'Scar across eye': 'scar across eye',
  'Burn scars': 'burn scars',
  'Freckles': 'freckles across nose and cheeks',
  'Dimples': 'dimples',
  'Beauty mark': 'beauty mark',
  'Cleft chin': 'cleft chin',
  'High cheekbones': 'high prominent cheekbones',
  'Strong jaw': 'strong defined jawline',
  'Weathered face': 'weathered experienced face',
  'Beard': 'full beard',
  'Stubble': 'rugged stubble',
  'Mustache': 'mustache',
  'Goatee': 'goatee',
  'Eyepatch': 'eyepatch',
};

const ACCESSORIES: Record<string, string> = {
  'Glasses': 'wearing glasses',
  'Sunglasses': 'wearing sunglasses',
  'Goggles': 'goggles on head',
  'Earrings': 'earrings',
  'Necklace': 'necklace',
  'Choker': 'choker',
  'Dog tags': 'dog tags',
  'Ring': 'ring on finger',
  'Watch': 'watch on wrist',
  'Hat': 'wearing hat',
  'Bandana': 'bandana',
  'Headband': 'headband',
  'Hood': 'hood',
  'Scarf': 'scarf',
  'Mask': 'mask',
};

// ============================================================================
// EXPRESSION MAPPING
// ============================================================================

const EXPRESSIONS: Record<string, string> = {
  'Bold': 'confident assertive expression',
  'Cautious': 'alert watchful expression',
  'Adaptable': 'calm collected expression',
  'Charming': 'charming warm smile',
  'Reserved': 'reserved composed expression',
  'Blunt': 'direct intense gaze',
  'neutral': 'neutral calm expression',
  'happy': 'warm genuine smile',
  'sad': 'melancholy sorrowful expression',
  'angry': 'fierce angry expression',
  'fearful': 'wide-eyed fearful expression',
  'surprised': 'surprised expression',
  'disgusted': 'disgusted expression',
  'confident': 'confident self-assured expression',
  'thoughtful': 'thoughtful contemplative expression',
  'determined': 'determined resolute expression',
  'tired': 'weary tired expression',
  'amused': 'amused smirking expression',
  'serious': 'serious focused expression',
  'playful': 'playful mischievous expression',
};

// ============================================================================
// HELPER: Get value from map
// ============================================================================

function lookup(map: Record<string, string>, key: string | undefined, fallback: string): string {
  if (!key) return fallback;
  if (map[key]) return map[key];
  const lowerKey = key.toLowerCase();
  for (const k of Object.keys(map)) {
    if (k.toLowerCase() === lowerKey) return map[k];
  }
  return key;
}

// ============================================================================
// BUILD GENRE DESCRIPTION
// ============================================================================

function buildGenreDescription(genreKey: string): { environment: string; clothing: string } {
  const genre = GENRES[genreKey] || GENRES['fantasy'];
  const setting = genre.settings[Math.floor(Math.random() * genre.settings.length)];
  
  const environment = `${setting}, ${genre.lighting}, ${genre.colors}, ${genre.mood}, ${genre.style}`;
  const clothing = genre.clothing;
  
  return { environment, clothing };
}

// ============================================================================
// MAIN PROMPT BUILDER
// ============================================================================

function buildPrompt(body: any): { prompt: string; negative_prompt: string } {
  const {
    gender, age, height, build, skinTone, hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, tattooStyle, scars, implants, prosthetics, mutations,
    clothingStyle, clothingDetails,
    disposition, socialStyle, emotionVariant,
  } = body;

  console.log("=== BUILDING STRICT PROMPT ===");
  console.log("Input - Role:", characterClass, "| Genre:", genre, "| Origin:", origin);
  
  // User additionals - HIGHEST PRIORITY, check for ethnicity/nationality override
  const userAdditionals = additionalDetails || characterAdditionals || customDescription || '';
  const userAdditionalsLower = userAdditionals.toLowerCase();
  const hasUserClothing = userAdditionalsLower.match(/wearing|dressed|clothing|outfit|uniform|armor|suit|jacket|coat|dress|robe|shirt|pants|boots/);
  const hasUserEthnicity = userAdditionalsLower.match(/asian|african|hispanic|latino|latina|middle eastern|indian|european|british|german|french|italian|japanese|chinese|korean|russian|brazilian|mexican|american/);
  
  // Genre processing
  const genreKey = genre?.toLowerCase().replace(/[\s-]/g, '_') || 'fantasy';
  const { environment, clothing: genreClothing } = buildGenreDescription(genreKey);
  
  // Role processing
  const roleKey = characterClass?.toLowerCase().replace(/[\s-]/g, '_') || '';
  const roleStr = ROLES[roleKey] || characterClass || '';
  
  // =========================================================================
  // ETHNICITY/NATIONALITY - Default to American Caucasian unless specified
  // =========================================================================
  
  let ethnicityStr = '';
  if (hasUserEthnicity) {
    // User specified in additionals - don't add default
    ethnicityStr = '';
  } else if (ethnicity) {
    ethnicityStr = ethnicity;
  } else if (nationality) {
    ethnicityStr = nationality;
  } else if (origin) {
    ethnicityStr = origin;
  } else {
    // DEFAULT: American Caucasian
    ethnicityStr = 'American Caucasian';
  }
  
  // =========================================================================
  // PHYSICAL ATTRIBUTES - Exact descriptions
  // =========================================================================
  
  const genderStr = lookup(PHYSICAL.gender, gender, 'person');
  const ageStr = age ? `${age} years old` : 'adult';
  const heightStr = height ? lookup(PHYSICAL.height, height, '') : '';
  const buildStr = lookup(PHYSICAL.build, build, '');
  const skinStr = lookup(PHYSICAL.skin, skinTone, '');
  const faceStr = faceShape ? lookup(PHYSICAL.faceShape, faceShape, '') : '';
  const eyeStr = lookup(PHYSICAL.eyeColor, eyeColor, '');
  const hairColorStr = lookup(PHYSICAL.hairColor, hairColor, '');
  const hairStyleStr = lookup(PHYSICAL.hairStyle, hairStyle, '');
  
  // =========================================================================
  // CLOTHING - Priority: User > Explicit clothingStyle > Role+Genre > Genre default
  // =========================================================================
  
  let clothingStr = '';
  if (hasUserClothing) {
    // User specified in additionals - will be in MUST INCLUDE section
    clothingStr = '';
  } else if (clothingDetails?.length) {
    clothingStr = clothingDetails.join(', ');
  } else if (clothingStyle && clothingStyle !== 'genre_default') {
    clothingStr = clothingStyle;
  } else if (roleKey) {
    // Get role-specific clothing for this genre
    const roleClothing = getRoleClothing(roleKey, genreKey);
    if (roleClothing) {
      clothingStr = roleClothing;
    } else {
      // Fall back to genre clothing
      clothingStr = genreClothing;
    }
  } else {
    // No role - use genre default
    clothingStr = genreClothing;
  }
  
  console.log("Clothing resolved:", clothingStr);
  
  // =========================================================================
  // FEATURES - Explicit list
  // =========================================================================
  
  const featureParts: string[] = [];
  if (details && Array.isArray(details)) {
    details.forEach((d: string) => {
      const mapped = FEATURES[d] || ACCESSORIES[d] || d;
      if (mapped) featureParts.push(mapped);
    });
  }
  if (distinguishingFeatures && Array.isArray(distinguishingFeatures)) {
    distinguishingFeatures.forEach((f: string) => {
      const mapped = FEATURES[f] || f;
      if (!featureParts.includes(mapped)) featureParts.push(mapped);
    });
  }
  if (accessories && Array.isArray(accessories)) {
    accessories.forEach((a: string) => {
      const mapped = ACCESSORIES[a] || a;
      if (!featureParts.includes(mapped)) featureParts.push(mapped);
    });
  }
  
  // Body modifications
  const modParts: string[] = [];
  if (tattoos?.length) modParts.push(`visible tattoos: ${tattooStyle || ''} style on ${tattoos.join(' and ')}`);
  if (piercings?.length) modParts.push(`visible piercings on ${piercings.join(' and ')}`);
  if (scars?.length) modParts.push(`visible scars on ${scars.join(' and ')}`);
  if (implants?.length) modParts.push(`visible cybernetic implants: ${implants.join(' and ')}`);
  if (prosthetics?.length) modParts.push(`visible prosthetics: ${prosthetics.join(' and ')}`);
  if (mutations?.length) modParts.push(`visible mutations: ${mutations.join(' and ')}`);
  
  // Expression
  let expressionStr = 'neutral expression, eyes looking directly at camera';
  if (emotionVariant && EXPRESSIONS[emotionVariant]) {
    expressionStr = `${EXPRESSIONS[emotionVariant]}, eyes at camera`;
  } else if (disposition && EXPRESSIONS[disposition]) {
    expressionStr = `${EXPRESSIONS[disposition]}, eyes at camera`;
  } else if (socialStyle && EXPRESSIONS[socialStyle]) {
    expressionStr = `${EXPRESSIONS[socialStyle]}, eyes at camera`;
  }
  
  // =========================================================================
  // PROMPT ASSEMBLY - Structured sections for AI precision
  // =========================================================================
  
  const sections: string[] = [];
  
  // 1. Composition
  sections.push(`[COMPOSITION] ${PORTRAIT_FRAMING}`);
  
  // 2. Subject with ethnicity
  const subjectParts = [ageStr, ethnicityStr, genderStr].filter(Boolean);
  sections.push(`[SUBJECT] Single ${subjectParts.join(' ')}`);
  
  // 3. Physical attributes
  const physicalList: string[] = [];
  if (buildStr) physicalList.push(buildStr);
  if (heightStr) physicalList.push(heightStr);
  if (skinStr) physicalList.push(`skin: ${skinStr}`);
  if (faceStr) physicalList.push(`face: ${faceStr}`);
  if (eyeStr) physicalList.push(`eyes: ${eyeStr}`);
  if (hairColorStr || hairStyleStr) physicalList.push(`hair: ${hairColorStr} ${hairStyleStr}`.trim());
  
  if (physicalList.length) {
    sections.push(`[PHYSICAL] ${physicalList.join('. ')}`);
  }
  
  // 4. User specified details - HIGHEST PRIORITY
  if (userAdditionals.trim()) {
    sections.push(`[MUST INCLUDE] ${userAdditionals.trim()}`);
    console.log("MUST INCLUDE user details:", userAdditionals.trim());
  }
  
  // 5. Distinguishing features
  if (featureParts.length) {
    sections.push(`[FEATURES] ${featureParts.join('. ')}`);
  }
  
  // 6. Body modifications
  if (modParts.length) {
    sections.push(`[MODIFICATIONS] ${modParts.join('. ')}`);
  }
  
  // 7. Role (without clothing - clothing is separate)
  if (roleStr && !hasUserClothing) {
    sections.push(`[ROLE] ${roleStr}`);
  }
  
  // 8. Clothing - ALWAYS include unless user specified
  if (clothingStr && !hasUserClothing) {
    sections.push(`[ATTIRE] ${clothingStr}`);
  }
  
  // 9. Expression
  sections.push(`[EXPRESSION] ${expressionStr}`);
  
  // 10. Environment (genre-specific)
  sections.push(`[BACKGROUND] Blurred ${environment}`);
  
  // 11. Quality
  sections.push(`[QUALITY] ${QUALITY_TAGS}`);
  
  const finalPrompt = sections.join('. ');
  
  console.log("Strict prompt assembled, length:", finalPrompt.length);
  console.log("Full prompt:", finalPrompt);
  
  return { prompt: finalPrompt, negative_prompt: NEGATIVE_PROMPT };
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

function buildLegacyPrompt(body: any) {
  const { appearance, characterClass, genre } = body;
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

  return buildPrompt({ gender, build, characterClass, genre: genre || 'fantasy' });
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================

async function generateImage(prompt: string, negativePrompt: string): Promise<string> {
  const TOGETHER_API_KEY = Deno.env.get("TOGETHER_API_KEY");
  if (!TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY not configured");

  console.log("Generating portrait with FLUX.1-dev");

  const response = await fetch('https://api.together.xyz/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'black-forest-labs/FLUX.1-dev',
      prompt,
      width: 832,
      height: 1216,
      steps: 28,
      n: 1,
      response_format: 'b64_json',
      negative_prompt: negativePrompt,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Together.ai error:", response.status, error);
    if (response.status === 429) throw new Error("Rate limit exceeded");
    if (response.status === 402 || response.status === 401) throw new Error("API key issue or credits exhausted");
    throw new Error(`Image generation failed: ${response.status}`);
  }

  const result = await response.json();
  const b64 = result?.data?.[0]?.b64_json;
  if (!b64) throw new Error("No image generated");

  return `data:image/png;base64,${b64}`;
}

// ============================================================================
// HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { name, gender, emotionVariant } = body;

    console.log("Portrait request:", name || "Unknown");
    
    const promptData = gender ? buildPrompt(body) : buildLegacyPrompt(body);
    const imageUrl = await generateImage(promptData.prompt, promptData.negative_prompt);

    console.log("Portrait generated for:", name);

    return new Response(JSON.stringify({ 
      imageUrl,
      characterName: name,
      emotion: emotionVariant || 'neutral',
      success: true 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Portrait generation failed",
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
