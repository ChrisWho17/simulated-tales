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
// 🎨 GENRE VISUAL LOCK - ATMOSPHERIC FRAMEWORK
// Genre determines background, lighting mood, color palette, and atmospheric effects
// Genre elements SUPPORT character but NEVER override user's Additional Details
// Background remains softly blurred - character is always primary focus
// ============================================================================

interface GenreVisualLock {
  // Background environment
  settings: string[];
  architecture: string;
  genreElements: string;
  props: string;
  // Lighting & atmosphere
  lightSources: string;
  lightQuality: string;
  colorTemperature: string;
  atmosphericEffects: string;
  mood: string;
  // Color palette
  dominantColors: string;
  accentColors: string;
  metalTones: string;
  overallPalette: string;
  // Aesthetic
  style: string;
  textureEmphasis: string;
  eraFeeling: string;
  criticalNotes?: string;
}

const GENRE_VISUAL_LOCKS: Record<string, GenreVisualLock> = {
  // ═══════════════════════════════════════════════════════════════
  // 🏰 FANTASY GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  fantasy: {
    settings: ['medieval tavern interior with wooden beams and stone walls', 'ancient library with towering bookshelves', 'mystical forest clearing with ancient trees', 'castle throne room with tapestries', 'magical workshop with floating artifacts', 'enchanted grove with fairy lights'],
    architecture: 'stone, weathered wood, gothic arches, ornate carvings, aged materials',
    genreElements: 'subtle glowing runes on walls, floating motes of light, ethereal mist, candles with unusual flame colors, enchanted objects softly glowing',
    props: 'leather-bound books, potion bottles, crystals, medieval weapons on walls, mystical symbols',
    lightSources: 'warm candlelight, torches, magical illumination soft blues purples golds, firelight',
    lightQuality: 'warm atmospheric mysterious with pools of light and shadow',
    colorTemperature: 'warm amber golden with cool mystical accent lights',
    atmosphericEffects: 'light fog, dust motes in light beams, subtle magical particle effects',
    mood: 'enchanting, mysterious, timeless, magical',
    dominantColors: 'deep burgundy, forest green, royal purple, midnight blue, aged gold',
    accentColors: 'emerald, sapphire, ruby tones, magical glowing blues and purples',
    metalTones: 'aged bronze, tarnished gold, weathered silver',
    overallPalette: 'rich saturated jewel-toned with warm shadows',
    style: 'high fantasy, medieval fantasy, or dark fantasy depending on character mood',
    textureEmphasis: 'leather, velvet, aged wood, stone, metal with patina',
    eraFeeling: 'timeless medieval renaissance with magical enhancement',
  },
  
  medieval: {
    settings: ['castle great hall with stone walls', 'village tavern with timber beams', 'monastery scriptorium', 'blacksmith forge', 'market square'],
    architecture: 'stone castles, timber frame buildings, thatched roofs, cobblestone',
    genreElements: 'torches, banners, heraldic symbols, period weapons and armor',
    props: 'swords, shields, goblets, scrolls, candles, wooden furniture',
    lightSources: 'torchlight, candlelight, fireplace, window light',
    lightQuality: 'warm flickering, dramatic shadows from flames',
    colorTemperature: 'warm amber and gold from fire sources',
    atmosphericEffects: 'smoke from fires, dust in sunbeams, cool stone atmosphere',
    mood: 'historical, grounded, authentic medieval life',
    dominantColors: 'stone gray, wood brown, iron black, wool cream',
    accentColors: 'heraldic red, royal blue, gold trim',
    metalTones: 'iron, steel, bronze, pewter',
    overallPalette: 'earthy muted tones with rich accent colors',
    style: 'historical medieval realism',
    textureEmphasis: 'rough stone, weathered wood, hammered metal, woven fabric',
    eraFeeling: 'European medieval 1100-1400',
  },

  dark_fantasy: {
    settings: ['cursed castle with crumbling towers', 'dead forest with twisted trees', 'necromancer tower', 'haunted battlefield', 'dark cathedral'],
    architecture: 'gothic decay, corrupted stonework, thorny overgrowth, skull motifs',
    genreElements: 'dark magic auras, ominous shadows, corrupted nature, death imagery',
    props: 'cursed artifacts, bones, dark grimoires, ritual circles',
    lightSources: 'sickly magical glow, moonlight through clouds, eerie bioluminescence',
    lightQuality: 'low key lighting, deep shadows, occasional harsh highlights',
    colorTemperature: 'cold with sickly green or purple accents',
    atmosphericEffects: 'thick fog, ash falling, dark mist, supernatural cold',
    mood: 'ominous, dread, dark beauty, corruption',
    dominantColors: 'deep black, charcoal, dead brown, bruise purple',
    accentColors: 'sickly green, blood red, ghostly blue, corrupt purple',
    metalTones: 'blackened steel, tarnished silver, corroded bronze',
    overallPalette: 'desaturated dark with selective eerie color',
    style: 'dark souls aesthetic, gothic horror fantasy',
    textureEmphasis: 'decay, corruption, thorns, bone, tattered fabric',
    eraFeeling: 'timeless dark medieval with supernatural corruption',
  },

  high_fantasy: {
    settings: ['crystal palace throne room', 'elven forest city', 'magical academy', 'celestial temple', 'enchanted garden'],
    architecture: 'elegant spires, flowing organic forms, crystalline structures, magical construction',
    genreElements: 'bright magical auras, floating objects, enchanted crystals, divine light',
    props: 'magical staves, glowing artifacts, elegant weapons, spellbooks',
    lightSources: 'magical radiance, sunlight through stained glass, enchanted orbs',
    lightQuality: 'bright and luminous, ethereal glow, divine radiance',
    colorTemperature: 'warm golden light with cool magical accents',
    atmosphericEffects: 'magical sparkles, floating light motes, gentle mist',
    mood: 'wonder, heroic, magical, hopeful',
    dominantColors: 'royal blue, elven green, celestial gold, pure white',
    accentColors: 'magical cyan, divine gold, enchanted purple',
    metalTones: 'polished gold, mithril silver, enchanted bronze',
    overallPalette: 'vibrant saturated fantasy colors',
    style: 'Tolkien-esque high fantasy, heroic fantasy',
    textureEmphasis: 'fine fabric, polished metal, magical materials, organic elegance',
    eraFeeling: 'timeless mythic fantasy realm',
  },

  // ═══════════════════════════════════════════════════════════════
  // 🚀 SCI-FI GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  scifi: {
    settings: ['spaceship interior with glowing panels', 'futuristic laboratory', 'space station viewport showing stars', 'high-tech command center', 'cybernetic enhancement facility', 'colony hab module'],
    architecture: 'clean lines, metallic surfaces, LED panels, holographic displays, geometric precision',
    genreElements: 'floating holographic interfaces, blinking status lights, energy conduits visible, computer terminals, robotic elements',
    props: 'data pads, futuristic weapons, scientific equipment, containment pods, star maps',
    lightSources: 'LED strips, holographic projections, bioluminescent panels, harsh fluorescent whites, colored accent lighting cyan blue green purple',
    lightQuality: 'clinical and clean, or darker with accent lighting for dramatic sci-fi',
    colorTemperature: 'cool blues and whites with colored accent lighting',
    atmosphericEffects: 'light lens flares, holographic glitches, energy fields, atmospheric processors creating subtle haze',
    mood: 'advanced, clinical, mysterious, or ominous depending on subgenre',
    dominantColors: 'metallic grays, deep space blacks, stark whites, steel blues',
    accentColors: 'neon cyan, electric blue, plasma green, warning orange, energy purple',
    metalTones: 'chrome, brushed aluminum, polished titanium, gunmetal',
    overallPalette: 'cool high-tech with strategic neon accents',
    style: 'hard sci-fi realism, space opera, or dystopian tech',
    textureEmphasis: 'smooth metals, glass, synthetic materials, LED-lit panels',
    eraFeeling: 'near future 2100s to far future 2400s plus',
  },

  sci_fi: {
    settings: ['spaceship interior with glowing panels', 'futuristic laboratory', 'space station viewport showing stars', 'high-tech command center'],
    architecture: 'clean lines, metallic surfaces, LED panels, holographic displays',
    genreElements: 'floating holographic interfaces, blinking status lights, energy conduits visible',
    props: 'data pads, futuristic weapons, scientific equipment, star maps',
    lightSources: 'LED strips, holographic projections, bioluminescent panels',
    lightQuality: 'clinical and clean with accent lighting',
    colorTemperature: 'cool blues and whites with colored accent lighting',
    atmosphericEffects: 'light lens flares, holographic glitches, energy fields',
    mood: 'advanced, clinical, mysterious',
    dominantColors: 'metallic grays, deep space blacks, stark whites, steel blues',
    accentColors: 'neon cyan, electric blue, plasma green, warning orange',
    metalTones: 'chrome, brushed aluminum, polished titanium',
    overallPalette: 'cool high-tech with strategic neon accents',
    style: 'hard sci-fi realism, space opera',
    textureEmphasis: 'smooth metals, glass, synthetic materials',
    eraFeeling: 'far future space age',
  },

  space_opera: {
    settings: ['starship bridge with panoramic viewport', 'alien planet vista', 'space station promenade', 'galactic senate chamber'],
    architecture: 'grand scale spacecraft, alien architecture, massive viewports',
    genreElements: 'distant stars and planets, starship interiors, diverse alien elements',
    props: 'command consoles, holographic star maps, elegant space weapons',
    lightSources: 'starlight, ship ambient lighting, dramatic spotlights',
    lightQuality: 'cinematic, dramatic, epic scale lighting',
    colorTemperature: 'varied - warm ship interiors, cool space views',
    atmosphericEffects: 'stars visible, nebula colors, atmospheric shields',
    mood: 'epic, adventurous, cosmic wonder, heroic',
    dominantColors: 'deep space black, starship silver, nebula purples',
    accentColors: 'starlight white, plasma blue, energy gold',
    metalTones: 'polished starship chrome, decorative gold trim',
    overallPalette: 'cosmic with rich accent colors',
    style: 'Star Wars/Trek aesthetic, grand space adventure',
    textureEmphasis: 'polished metals, alien materials, sophisticated tech',
    eraFeeling: 'galactic civilization era',
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚡ CYBERPUNK GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  cyberpunk: {
    settings: ['neon-lit urban alley with rain', 'high-tech nightclub', 'megacorporation interior', 'cybernetic enhancement clinic', 'underground hacker den', 'rooftop overlooking neon cityscape'],
    architecture: 'towering skyscrapers, dense urban sprawl, industrial decay mixed with high-tech, Asian-influenced signage',
    genreElements: 'neon signs in Japanese Chinese characters, holographic advertisements, cybernetic enhancement shops, dense cables and wires, steam vents',
    props: 'datapads, cybernetic implants visible, futuristic weapons, tech interfaces, corporate logos',
    lightSources: 'neon signs pink cyan blue purple, LED strips, holographic projections, harsh fluorescents, dramatic rim lighting',
    lightQuality: 'high contrast with deep blacks and glowing neons, wet surfaces reflecting light',
    colorTemperature: 'cool with hot neon accents - cyan magenta purple electric blue toxic green',
    atmosphericEffects: 'rain always present, steam from vents, smoke, light beams through fog, holographic glitches',
    mood: 'dystopian, gritty, high-tech-low-life, dangerous, electric energy',
    dominantColors: 'deep blacks, dark grays, midnight blue, urban concrete',
    accentColors: 'neon pink magenta, cyan electric blue, toxic green, purple, warning orange',
    metalTones: 'chrome, brushed steel, carbon fiber, reflective surfaces',
    overallPalette: 'high contrast neon-saturated wet and reflective',
    style: 'Blade Runner aesthetic, Ghost in the Shell, dark cyberpunk',
    textureEmphasis: 'wet asphalt, chrome, carbon fiber, holographic interfaces, rain-slicked surfaces',
    eraFeeling: 'near-future dystopia 2077-style',
    criticalNotes: 'CRITICAL: Almost always raining or recently rained, neon reflections essential',
  },

  // ═══════════════════════════════════════════════════════════════
  // 💀 HORROR GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  horror: {
    settings: ['abandoned asylum corridor', 'decrepit Victorian mansion', 'dark forest with dead trees', 'dimly lit basement', 'fog-shrouded graveyard', 'decaying hospital', 'haunted church interior'],
    architecture: 'decaying, Gothic, Victorian, industrial decay, peeling walls, broken windows',
    genreElements: 'deep shadows with unsettling shapes, barely visible disturbing details, fog mist, cobwebs, decay',
    props: 'medical equipment aged bloody, occult symbols, candles, chains, damaged religious iconography',
    lightSources: 'single harsh light creating deep shadows, flickering fluorescents, dying candlelight, moonlight through broken windows, lightning flashes',
    lightQuality: 'high contrast with deep blacks, dramatic shadows, rim lighting on edges',
    colorTemperature: 'cold blues, sickly greens, desaturated with strategic colored lighting',
    atmosphericEffects: 'heavy fog, dust in air, volumetric light rays, darkness pressing in',
    mood: 'dread, unease, foreboding, claustrophobic tension',
    dominantColors: 'deep blacks, charcoal grays, dark browns, midnight blues',
    accentColors: 'blood red, sickly green, bruise purple, corpse pale blue',
    metalTones: 'rusted iron, tarnished silver, oxidized copper',
    overallPalette: 'desaturated with selective color for emphasis, heavy shadows',
    style: 'Gothic horror, psychological horror, or survival horror',
    textureEmphasis: 'decay, rust, mold, cracked surfaces, organic corruption',
    eraFeeling: 'Victorian era to modern abandoned locations',
  },

  vampire: {
    settings: ['gothic castle interior', 'moonlit cemetery', 'Victorian mansion parlor', 'candlelit crypt', 'aristocratic ballroom'],
    architecture: 'Gothic architecture, ornate Victorian, castle stonework, elaborate ironwork',
    genreElements: 'candlelight, velvet drapes, antique furniture, mirrors, gothic statuary',
    props: 'wine glasses with red liquid, antique books, candelabras, portraits, roses',
    lightSources: 'candlelight, moonlight, fireplace, dim gas lamps',
    lightQuality: 'romantic yet ominous, warm candlelight with cold moonlight',
    colorTemperature: 'warm fire tones contrasting with cold moonlight blues',
    atmosphericEffects: 'mist, dust motes, flickering shadows, moonbeams',
    mood: 'aristocratic darkness, seductive danger, eternal night, gothic romance',
    dominantColors: 'deep crimson, black velvet, midnight purple, bone white',
    accentColors: 'blood red, moonlight silver, candlelight gold',
    metalTones: 'tarnished silver, antique gold, wrought iron',
    overallPalette: 'rich dark colors with warm and cool contrast',
    style: 'gothic vampire romance, aristocratic horror',
    textureEmphasis: 'velvet, silk, aged stone, polished wood, antique metals',
    eraFeeling: 'Victorian gothic timeless',
  },

  lovecraft: {
    settings: ['1920s New England study', 'misty coastal town', 'ancient library with forbidden tomes', 'decrepit mansion', 'foggy docks at night'],
    architecture: 'colonial New England, weathered wood, strange geometry hints, aged buildings',
    genreElements: 'unsettling angles, mysterious shadows, hints of the unknowable, eldritch symbols',
    props: 'ancient tomes, strange artifacts, nautical equipment, period items',
    lightSources: 'gas lamps, oil lamps, lightning, dim period lighting',
    lightQuality: 'low and atmospheric, with unexplained shadows',
    colorTemperature: 'desaturated, sickly yellow-green undertones',
    atmosphericEffects: 'heavy fog, sea mist, unnatural shadows, cosmic hints',
    mood: 'cosmic dread, intellectual horror, reality questioning, eldritch unease',
    dominantColors: 'sea-gray, aged brown, sickly green, deep shadow',
    accentColors: 'eldritch green, void purple, cosmic blue',
    metalTones: 'tarnished brass, corroded copper, strange alloys',
    overallPalette: 'desaturated period tones with unsettling accents',
    style: 'Lovecraftian cosmic horror, 1920s period',
    textureEmphasis: 'aged paper, weathered wood, barnacles, strange textures',
    eraFeeling: '1920s-1930s New England',
  },

  // ═══════════════════════════════════════════════════════════════
  // 🔍 MYSTERY GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  mystery: {
    settings: ['1920s-40s detective office with venetian blinds', 'noir alley with rain', 'upscale study with dark wood', 'foggy Victorian London street', 'modern crime scene', 'shadowy jazz club'],
    architecture: 'period-appropriate buildings, film noir aesthetic, atmospheric urban or elegant indoor',
    genreElements: 'shadows, silhouettes, clues barely visible, atmospheric smoke fog',
    props: 'detective equipment, newspapers, files, vintage phones, magnifying glass, evidence markers',
    lightSources: 'window blinds creating striped shadows, single desk lamp, street lights in fog, dramatic single-source lighting',
    lightQuality: 'film noir style - high contrast, dramatic shadows, chiaroscuro',
    colorTemperature: 'warm amber for vintage, cool blue for modern, monochromatic feeling',
    atmosphericEffects: 'cigarette smoke, fog, rain visible in light, dust particles',
    mood: 'mysterious, contemplative, noir atmosphere, intellectual intrigue',
    dominantColors: 'deep browns, charcoal blacks, slate grays, sepia tones',
    accentColors: 'warm amber, cool blue-gray, muted gold, burgundy',
    metalTones: 'brass, aged bronze, gunmetal',
    overallPalette: 'low saturation noir-inspired almost monochromatic with strategic color',
    style: 'film noir, Victorian detective, modern thriller',
    textureEmphasis: 'leather, aged paper, wood grain, worn fabrics, wet streets',
    eraFeeling: '1920s-1940s classic noir, Victorian gaslight, or modern urban',
  },

  noir: {
    settings: ['rain-slicked city street at night', 'smoky jazz club', 'detective office with venetian blinds', 'seedy motel room', 'dark alley'],
    architecture: '1940s urban, art deco elements, period signage',
    genreElements: 'venetian blind shadows, neon signs, wet pavement reflections, cigarette smoke',
    props: 'fedoras, trench coats, revolvers, whiskey glasses, newspapers',
    lightSources: 'single harsh light, neon signs, streetlights, venetian blind striped light',
    lightQuality: 'extreme chiaroscuro, film noir lighting',
    colorTemperature: 'predominantly cool with warm accent from signs',
    atmosphericEffects: 'rain, fog, cigarette smoke, steam from manholes',
    mood: 'fatalistic, morally ambiguous, dangerous, romantic cynicism',
    dominantColors: 'black, dark gray, deep shadow',
    accentColors: 'neon sign colors, lipstick red, cigarette ember orange',
    metalTones: 'chrome, gunmetal, brass',
    overallPalette: 'essentially black and white with selective color',
    style: 'classic film noir 1940s',
    textureEmphasis: 'wet surfaces, wool fabric, leather, smoke',
    eraFeeling: '1940s-1950s urban America',
  },

  // ═══════════════════════════════════════════════════════════════
  // ☠️ PIRATE GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  pirate: {
    settings: ['ship captain cabin with maps and treasures', 'tropical beach at sunset', 'port tavern interior', 'ship deck with rigging', 'coastal cliff hideout', 'Caribbean port town'],
    architecture: 'weathered wood, rope rigging, nautical elements, tropical colonial buildings',
    genreElements: 'ship wheels, barrels, ropes, maps, compasses, treasure chests, naval flags',
    props: 'cutlasses, flintlock pistols, treasure, rum bottles, navigation equipment, spyglasses',
    lightSources: 'lantern light, tropical sun, sunset sunrise, moonlight on water, ship lamps',
    lightQuality: 'warm and adventurous, golden hour lighting, or atmospheric low-light aboard ship',
    colorTemperature: 'warm golden sunset tones, or cool moonlit blue for night scenes',
    atmosphericEffects: 'ocean spray, tropical humidity haze, smoke from cannons, sea fog',
    mood: 'adventurous, freedom, danger, tropical paradise or stormy peril',
    dominantColors: 'ocean blues, weathered wood browns, sandy beiges, sail cream',
    accentColors: 'treasure gold, tropical sunset oranges, Caribbean turquoise, blood red',
    metalTones: 'tarnished brass, oxidized copper, weathered iron',
    overallPalette: 'warm and saturated for tropical, or cool and dramatic for stormy seas',
    style: 'golden age of piracy 1650-1730, romantic adventure',
    textureEmphasis: 'weathered wood, rope, canvas sails, sea-worn leather, salt-crusted metal',
    eraFeeling: 'Caribbean 17th-18th century',
  },

  // ═══════════════════════════════════════════════════════════════
  // 🤠 WESTERN GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  western: {
    settings: ['old west saloon interior', 'dusty main street', 'desert landscape with mesas', 'frontier general store', 'ranch homestead', 'canyon landscape'],
    architecture: 'weathered wood buildings, false fronts, log construction, adobe structures',
    genreElements: 'wooden posts, wagon wheels, whiskey barrels, wanted posters, oil lamps',
    props: 'six-shooters, rifles, cowboy hats, lassos, spurs, saddles, playing cards, whiskey bottles',
    lightSources: 'harsh desert sun, saloon oil lamps, golden hour sun, campfire, dim interior light through dusty windows',
    lightQuality: 'high contrast with strong sun, warm interior lighting, dusty atmosphere',
    colorTemperature: 'warm amber and gold, hot desert sun tones',
    atmosphericEffects: 'dust in air, heat shimmer, tumbleweeds, gunsmoke',
    mood: 'rugged, frontier spirit, lawless, dusty, survivalist',
    dominantColors: 'desert tan, weathered wood brown, dusty orange, faded denim blue',
    accentColors: 'sunset red, brass gold, leather brown, faded bandana red',
    metalTones: 'tarnished silver, brass, weathered iron',
    overallPalette: 'warm desaturated dusty with sepia undertones',
    style: 'classic western, spaghetti western, or frontier realism',
    textureEmphasis: 'worn leather, weathered wood, dusty fabric, sun-baked earth',
    eraFeeling: 'American frontier 1860s-1890s',
  },

  // ═══════════════════════════════════════════════════════════════
  // ☢️ POST-APOCALYPTIC GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  postapoc: {
    settings: ['ruined city with collapsed buildings', 'desert wasteland', 'abandoned military bunker', 'overgrown urban decay', 'makeshift survivor settlement', 'desolate highway'],
    architecture: 'crumbling concrete, rusted metal, nature reclaiming buildings, improvised shelters, fortified positions',
    genreElements: 'radiation symbols, destroyed vehicles, scattered supplies, makeshift weapons, warning signs, bones skulls',
    props: 'gas masks, improvised weapons, scavenged equipment, water containers, survival gear, bullet casings',
    lightSources: 'harsh sunlight through dust, fires from barrels, emergency lights red, harsh shadows, nuclear sunset',
    lightQuality: 'harsh and unforgiving, or dim and oppressive in interiors',
    colorTemperature: 'desaturated with sickly yellow green tint, or warm orange from fires and dust',
    atmosphericEffects: 'dust storms, ash falling, toxic fog, heat shimmer, smoke from fires',
    mood: 'desolate, survivalist, harsh, desperate, end-of-world',
    dominantColors: 'desert tan, rust brown, concrete gray, ash black, dead vegetation brown',
    accentColors: 'rust orange, toxic green, radiation yellow, dried blood red, fire orange',
    metalTones: 'heavily rusted, corroded, oxidized everything',
    overallPalette: 'heavily desaturated dusty rust-dominated',
    style: 'Fallout-style wasteland, Mad Max aesthetic, The Last of Us overgrown',
    textureEmphasis: 'rust, decay, cracked concrete, weathered metal, dried earth, tattered fabric',
    eraFeeling: 'post-nuclear war, post-pandemic, or general collapse 10-100 years after',
  },

  post_apocalyptic: {
    settings: ['ruined city with collapsed buildings', 'desert wasteland', 'abandoned military bunker', 'overgrown urban decay'],
    architecture: 'crumbling concrete, rusted metal, nature reclaiming buildings, improvised shelters',
    genreElements: 'radiation symbols, destroyed vehicles, scattered supplies, makeshift weapons',
    props: 'gas masks, improvised weapons, scavenged equipment, survival gear',
    lightSources: 'harsh sunlight through dust, fires from barrels, emergency lights',
    lightQuality: 'harsh and unforgiving',
    colorTemperature: 'desaturated with sickly yellow green tint',
    atmosphericEffects: 'dust storms, ash falling, toxic fog, heat shimmer',
    mood: 'desolate, survivalist, harsh, desperate',
    dominantColors: 'desert tan, rust brown, concrete gray, ash black',
    accentColors: 'rust orange, toxic green, radiation yellow, fire orange',
    metalTones: 'heavily rusted, corroded, oxidized',
    overallPalette: 'heavily desaturated dusty rust-dominated',
    style: 'Fallout-style wasteland, Mad Max aesthetic',
    textureEmphasis: 'rust, decay, cracked concrete, weathered metal',
    eraFeeling: 'post-apocalypse 10-100 years after collapse',
  },

  fallout: {
    settings: ['retro-futuristic bunker', 'nuclear wasteland', 'ruined 1950s suburb', 'vault interior', 'irradiated town'],
    architecture: 'atomic age design, vault-tec aesthetic, ruined Americana',
    genreElements: 'Nuka Cola signs, vault suits, pip-boys, atomic symbols, 1950s robots',
    props: 'laser weapons, stimpaks, bottle caps, retro tech, radiation suits',
    lightSources: 'harsh wasteland sun, vault fluorescents, nuclear glow',
    lightQuality: 'high contrast wasteland, clinical vault interiors',
    colorTemperature: 'sickly yellow-green tint with retro accents',
    atmosphericEffects: 'radiation haze, dust, nuclear sunset colors',
    mood: 'retro-apocalypse, dark humor, survival',
    dominantColors: 'vault blue, rust orange, wasteland tan, nuclear green',
    accentColors: 'Nuka red, radioactive green, chrome silver',
    metalTones: 'chrome and rust together, corroded steel',
    overallPalette: 'retro-futuristic meets wasteland decay',
    style: 'Fallout games aesthetic specifically',
    textureEmphasis: '1950s materials aged and irradiated, chrome and rust',
    eraFeeling: 'alternate history post-nuclear 2077 and after',
  },

  zombie: {
    settings: ['barricaded building', 'overrun city street', 'abandoned mall', 'survivor camp', 'hospital corridors'],
    architecture: 'barricades, boarded windows, improvised fortifications, urban decay',
    genreElements: 'blood stains, abandoned cars, warning signs, makeshift weapons',
    props: 'baseball bats, shotguns, medical supplies, canned food, barbed wire',
    lightSources: 'emergency lighting, flashlights, fires, harsh daylight',
    lightQuality: 'harsh and clinical or dark and threatening',
    colorTemperature: 'desaturated, cold, sickly',
    atmosphericEffects: 'fog, smoke, dust, decay smell implied',
    mood: 'desperate survival, constant threat, horror',
    dominantColors: 'gray, dried blood brown, sickly pale',
    accentColors: 'blood red, warning yellow, zombie pale green',
    metalTones: 'rusted, bloody, industrial',
    overallPalette: 'desaturated survival horror',
    style: 'Walking Dead, Last of Us survival horror',
    textureEmphasis: 'blood, decay, makeshift repairs, weathered',
    eraFeeling: 'modern day collapse, weeks to years into outbreak',
  },

  // ═══════════════════════════════════════════════════════════════
  // ⚔️ WAR GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  war: {
    settings: ['WWI WWII trench', 'military command center', 'battlefield with smoke', 'bombed-out building', 'military base', 'aircraft carrier deck', 'war-torn urban environment'],
    architecture: 'military structures, fortifications, bunkers, destroyed buildings, sandbag positions',
    genreElements: 'military equipment, weapons, ammunition, maps, communication equipment, destroyed vehicles, smoke',
    props: 'weapons era-appropriate, helmets, dog tags, field equipment, rations, medals, military insignia',
    lightSources: 'harsh daylight, explosions illuminating scene, searchlights, muzzle flashes, fire from burning structures',
    lightQuality: 'high contrast, dramatic, documentary-style realism',
    colorTemperature: 'desaturated for historical, cooler tones, or warm from fires and explosions',
    atmosphericEffects: 'smoke from explosions, dust, fog, rain, ash, gunpowder smoke',
    mood: 'intense, gritty, realistic, dangerous, historical weight',
    dominantColors: 'military olive drab, field gray, khaki, mud brown, steel gray',
    accentColors: 'explosive orange, tracer fire, blood red, German gray, Allied green',
    metalTones: 'gunmetal, weathered steel, brass casings, worn aluminum',
    overallPalette: 'desaturated realistic period-accurate color grading',
    style: 'gritty realism, historical accuracy, Saving Private Ryan aesthetic',
    textureEmphasis: 'mud, worn fabric, metal, leather, dirt, weathered equipment',
    eraFeeling: 'WWI 1914-1918, WWII 1939-1945, Vietnam, or modern warfare depending on character equipment',
  },

  ww2: {
    settings: ['1940s European battlefield', 'bombed city', 'military camp', 'bunker interior', 'beach landing'],
    architecture: 'period military structures, European buildings damaged, fortifications',
    genreElements: 'period weapons, vehicles, uniforms, propaganda posters',
    props: 'M1 Garands, Thompson SMGs, German equipment, period gear',
    lightSources: 'harsh daylight, explosions, fires, dim interiors',
    lightQuality: 'documentary realism, Band of Brothers style',
    colorTemperature: 'desaturated, period film stock look',
    atmosphericEffects: 'smoke, mud, rain, dust, explosive debris',
    mood: 'historical gravity, brotherhood, sacrifice, war horror',
    dominantColors: 'olive drab, field gray, khaki, mud brown',
    accentColors: 'blood red, fire orange, muzzle flash yellow',
    metalTones: 'gunmetal, brass, weathered steel',
    overallPalette: 'Saving Private Ryan color grade - desaturated period',
    style: 'WWII historical realism',
    textureEmphasis: 'wool uniforms, leather, mud, aged metal',
    eraFeeling: 'World War II 1939-1945',
  },

  ww1: {
    settings: ['muddy trench', 'no mans land', 'field hospital', 'artillery position', 'gas attack'],
    architecture: 'trenches, sandbags, barbed wire, destroyed landscape',
    genreElements: 'gas masks, artillery shells, barbed wire, mud everywhere',
    props: 'bolt action rifles, bayonets, trench gear, period equipment',
    lightSources: 'overcast sky, artillery flashes, gas lamp, fires',
    lightQuality: 'grim, overcast, oppressive',
    colorTemperature: 'cold, muddy, desaturated',
    atmosphericEffects: 'mustard gas clouds, mud, rain, smoke',
    mood: 'grim, hopeless, industrial horror of war',
    dominantColors: 'mud brown, gray, khaki, blood',
    accentColors: 'mustard yellow gas, fire orange, blood red',
    metalTones: 'corroded, bloody, industrial iron',
    overallPalette: 'brown and gray mud-dominated, desaturated',
    style: '1917 film aesthetic, WWI realism',
    textureEmphasis: 'mud, water-logged fabric, corroded metal, blood',
    eraFeeling: 'World War I 1914-1918 trenches',
  },

  vietnam: {
    settings: ['jungle patrol', 'firebase', 'helicopter interior', 'village', 'river patrol boat'],
    architecture: 'jungle, military base structures, Vietnamese buildings',
    genreElements: 'helicopters, M16s, period equipment, jungle foliage',
    props: 'M16 rifles, grenades, radios, period gear, peace symbols',
    lightSources: 'harsh tropical sun, helicopter searchlights, fires',
    lightQuality: 'humid, harsh, sweaty',
    colorTemperature: 'warm tropical but harsh and unforgiving',
    atmosphericEffects: 'jungle humidity, smoke, helicopter wash',
    mood: 'surreal war, moral ambiguity, survival',
    dominantColors: 'jungle green, mud brown, olive drab',
    accentColors: 'blood red, fire orange, river brown',
    metalTones: 'worn aluminum, weathered steel, brass',
    overallPalette: 'humid tropical green-dominated',
    style: 'Apocalypse Now, Platoon aesthetic',
    textureEmphasis: 'sweat-soaked fabric, mud, jungle rot, worn gear',
    eraFeeling: 'Vietnam War 1965-1975',
  },

  military: {
    settings: ['modern military base', 'tactical operations center', 'barracks', 'training facility', 'deployed position'],
    architecture: 'military structures, modular buildings, tactical setups',
    genreElements: 'modern military equipment, tactical gear, communications',
    props: 'modern weapons, body armor, helmets, tactical equipment',
    lightSources: 'fluorescent base lighting, tactical lights, harsh exterior',
    lightQuality: 'clinical indoors, harsh tactical outdoors',
    colorTemperature: 'neutral to cool military',
    atmosphericEffects: 'dust, controlled environment',
    mood: 'professional, disciplined, tactical',
    dominantColors: 'multicam pattern, coyote tan, olive drab, black',
    accentColors: 'unit colors, American flag',
    metalTones: 'black tactical, gunmetal, anodized',
    overallPalette: 'modern tactical earth tones',
    style: 'modern military realism',
    textureEmphasis: 'tactical nylon, polymer, modern materials',
    eraFeeling: 'modern military 2000s-present',
  },

  // ═══════════════════════════════════════════════════════════════
  // 🏡 MODERN LIFE GENRE LOCK
  // ═══════════════════════════════════════════════════════════════
  modern: {
    settings: ['contemporary urban apartment', 'modern office', 'coffee shop', 'city street', 'suburban home', 'shopping district', 'gym', 'park', 'public transit'],
    architecture: 'contemporary design, clean lines, modern materials, glass and steel, current architectural styles',
    genreElements: 'smartphones visible, laptops, modern furniture, contemporary art, current fashion, branded products generic',
    props: 'coffee cups, phones, headphones, modern bags, contemporary accessories, urban elements',
    lightSources: 'natural window light, LED fluorescent lighting, street lights, neon business signs, smartphone screens',
    lightQuality: 'natural, realistic, contemporary photography aesthetic',
    colorTemperature: 'neutral to warm indoor lighting, natural daylight, urban night lighting',
    atmosphericEffects: 'city haze, rain on urban streets, natural weather, clean air',
    mood: 'contemporary, realistic, relatable, everyday life, urban energy or suburban calm',
    dominantColors: 'neutral grays, whites, blacks, denim blues, urban neutrals',
    accentColors: 'brand colors, fashion trends, natural tones, diverse contemporary colors',
    metalTones: 'brushed steel, aluminum, modern metallics',
    overallPalette: 'natural contemporary realistic color palette',
    style: 'contemporary realism, lifestyle photography, urban documentary',
    textureEmphasis: 'modern fabrics, concrete, glass, contemporary materials',
    eraFeeling: 'present day 2020s, recognizable as current era',
  },

  modern_life: {
    settings: ['apartment living room', 'coffee shop', 'office space', 'city street', 'shopping mall', 'park'],
    architecture: 'modern residential, commercial spaces, urban environment',
    genreElements: 'everyday modern items, technology, contemporary decor',
    props: 'smartphones, coffee cups, laptops, everyday items',
    lightSources: 'natural daylight, interior lighting, screen glow',
    lightQuality: 'natural and realistic, lifestyle photography',
    colorTemperature: 'warm and inviting or cool and urban',
    atmosphericEffects: 'natural weather, city atmosphere',
    mood: 'relatable, comfortable, everyday',
    dominantColors: 'neutrals, natural tones, urban grays',
    accentColors: 'personal style colors, brand colors',
    metalTones: 'modern stainless, aluminum',
    overallPalette: 'natural realistic contemporary',
    style: 'lifestyle photography, slice of life',
    textureEmphasis: 'everyday fabrics, modern materials',
    eraFeeling: 'present day contemporary',
  },

  contemporary: {
    settings: ['modern city', 'contemporary home', 'urban environment', 'business district'],
    architecture: 'current architectural styles, glass and steel',
    genreElements: 'modern technology, contemporary fashion',
    props: 'current technology, modern accessories',
    lightSources: 'natural and artificial modern lighting',
    lightQuality: 'realistic contemporary',
    colorTemperature: 'natural modern',
    atmosphericEffects: 'urban atmosphere',
    mood: 'current, realistic, grounded',
    dominantColors: 'urban neutrals, contemporary palette',
    accentColors: 'modern accent colors',
    metalTones: 'contemporary metals',
    overallPalette: 'realistic modern palette',
    style: 'contemporary realism',
    textureEmphasis: 'modern materials and fabrics',
    eraFeeling: 'current day',
  },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL GENRES
  // ═══════════════════════════════════════════════════════════════
  
  steampunk: {
    settings: ['Victorian factory with brass machinery', 'airship interior', 'clockwork laboratory', 'steam-powered city street'],
    architecture: 'Victorian industrial, brass and copper pipes, gears visible',
    genreElements: 'clockwork mechanisms, steam vents, brass goggles, cogs',
    props: 'goggles, mechanical arms, brass weapons, pocket watches, gears',
    lightSources: 'gas lamps, furnace glow, steam-filtered light',
    lightQuality: 'warm industrial, brass reflections',
    colorTemperature: 'warm brass and copper tones',
    atmosphericEffects: 'steam clouds, coal smoke, industrial haze',
    mood: 'inventive, adventurous, industrial romance',
    dominantColors: 'brass gold, copper brown, leather tan, iron gray',
    accentColors: 'polished brass, copper, emerald green',
    metalTones: 'brass, copper, bronze, iron',
    overallPalette: 'warm metallic Victorian',
    style: 'Victorian science fiction, retro-futurism',
    textureEmphasis: 'brass, leather, wood, gears, rivets',
    eraFeeling: 'alternate Victorian era with steam technology',
  },

  victorian: {
    settings: ['London street with gas lamps', 'Victorian parlor', 'industrial factory', 'foggy docks'],
    architecture: 'Victorian buildings, ornate ironwork, industrial structures',
    genreElements: 'gas lamps, cobblestones, horse carriages, period dress',
    props: 'walking canes, pocket watches, period clothing, newspapers',
    lightSources: 'gas lamps, candles, firelight, foggy daylight',
    lightQuality: 'atmospheric, foggy, romantic',
    colorTemperature: 'warm gas light, cool fog',
    atmosphericEffects: 'London fog, coal smoke, rain',
    mood: 'mysterious, elegant, industrial age',
    dominantColors: 'dark browns, blacks, deep reds, gray',
    accentColors: 'brass, gold trim, deep jewel tones',
    metalTones: 'brass, iron, silver',
    overallPalette: 'dark elegant Victorian',
    style: 'Victorian London, Sherlock Holmes aesthetic',
    textureEmphasis: 'wool, velvet, leather, stone, iron',
    eraFeeling: 'Victorian era 1837-1901',
  },

  superhero: {
    settings: ['city rooftop at night', 'secret base', 'urban skyline', 'dramatic sky backdrop'],
    architecture: 'modern city, dramatic vertical spaces',
    genreElements: 'hero silhouettes, dramatic lighting, action potential',
    props: 'hero gear, dramatic capes, symbols',
    lightSources: 'dramatic backlighting, city lights, lightning',
    lightQuality: 'dramatic, high contrast, heroic',
    colorTemperature: 'bold and dramatic',
    atmosphericEffects: 'dramatic clouds, wind, energy effects',
    mood: 'heroic, powerful, larger than life',
    dominantColors: 'bold primary colors, dramatic darks',
    accentColors: 'hero colors - red, blue, gold',
    metalTones: 'polished hero metals',
    overallPalette: 'bold superhero comic colors',
    style: 'comic book hero, cinematic superhero',
    textureEmphasis: 'hero suit materials, dramatic fabrics',
    eraFeeling: 'modern superhero',
  },

  samurai: {
    settings: ['Japanese castle', 'bamboo forest', 'Zen garden', 'feudal village', 'battlefield'],
    architecture: 'traditional Japanese architecture, castle walls, wooden buildings',
    genreElements: 'cherry blossoms, paper screens, tatami, katanas',
    props: 'katanas, samurai armor, fans, scrolls, tea ceremony items',
    lightSources: 'paper lanterns, natural light, sunset',
    lightQuality: 'soft and atmospheric, or harsh battle light',
    colorTemperature: 'warm natural or cool moonlit',
    atmosphericEffects: 'cherry blossom petals, mist, incense smoke',
    mood: 'honorable, disciplined, beautiful violence',
    dominantColors: 'black, red, white, gold, nature greens',
    accentColors: 'blood red, cherry blossom pink, gold trim',
    metalTones: 'polished steel, gold, lacquered',
    overallPalette: 'Japanese traditional colors',
    style: 'feudal Japan, samurai film aesthetic',
    textureEmphasis: 'silk, lacquer, folded steel, bamboo, paper',
    eraFeeling: 'feudal Japan Sengoku to Edo period',
  },

  wuxia: {
    settings: ['Chinese mountain temple', 'bamboo forest', 'ancient martial arts school', 'teahouse'],
    architecture: 'traditional Chinese architecture, pagodas, bridges',
    genreElements: 'martial arts poses, flowing robes, ancient weapons',
    props: 'jian swords, staffs, tea sets, scrolls, martial arts weapons',
    lightSources: 'dramatic natural light, lanterns, mystical glow',
    lightQuality: 'cinematic, wire-fu dramatic',
    colorTemperature: 'varied dramatic',
    atmosphericEffects: 'mist, cherry blossoms, dramatic wind',
    mood: 'honor, martial excellence, romantic adventure',
    dominantColors: 'red, gold, white, black, jade green',
    accentColors: 'imperial yellow, vermillion red',
    metalTones: 'ancient bronze, jade, gold',
    overallPalette: 'traditional Chinese cinema colors',
    style: 'Wuxia martial arts cinema, Crouching Tiger aesthetic',
    textureEmphasis: 'silk, jade, ancient metals, natural materials',
    eraFeeling: 'mythic ancient China',
  },

  urban_fantasy: {
    settings: ['modern city with hidden magic', 'supernatural bar', 'magical shop in alley', 'urban ritual space'],
    architecture: 'modern buildings with hidden magical elements',
    genreElements: 'hidden magical symbols, supernatural beings in modern clothes',
    props: 'enchanted modern items, hidden weapons, magical talismans',
    lightSources: 'neon mixed with magical glow, urban lighting',
    lightQuality: 'modern with supernatural accents',
    colorTemperature: 'urban cool with magical warm accents',
    atmosphericEffects: 'subtle magic effects, urban weather',
    mood: 'hidden world, modern magic, secret supernatural',
    dominantColors: 'urban grays with magical colors',
    accentColors: 'magical blues, purples, supernatural green',
    metalTones: 'modern and ancient mixed',
    overallPalette: 'modern urban with magical highlights',
    style: 'Dresden Files, modern supernatural',
    textureEmphasis: 'modern clothes with magical accessories',
    eraFeeling: 'modern day with hidden supernatural',
  },

  grimdark: {
    settings: ['brutal medieval battlefield', 'corrupt castle', 'plague-ridden city', 'dark forest'],
    architecture: 'harsh medieval, functional brutality',
    genreElements: 'blood, mud, moral ambiguity, harsh reality',
    props: 'practical weapons, worn armor, survival gear',
    lightSources: 'overcast, fires, harsh natural light',
    lightQuality: 'grim, unforgiving, realistic',
    colorTemperature: 'cold and harsh',
    atmosphericEffects: 'rain, mud, blood, smoke',
    mood: 'brutal, morally gray, survival, hopeless',
    dominantColors: 'mud brown, blood red, steel gray, black',
    accentColors: 'dried blood, rust, sickly pale',
    metalTones: 'weathered steel, rusted iron, blood-stained',
    overallPalette: 'desaturated brutal realism',
    style: 'Game of Thrones dark, grimdark fantasy',
    textureEmphasis: 'blood, mud, worn metal, tattered cloth',
    eraFeeling: 'brutal dark ages fantasy',
  },

  romance: {
    settings: ['romantic restaurant', 'sunset beach', 'garden party', 'cozy cafe', 'elegant ballroom'],
    architecture: 'elegant, romantic, inviting spaces',
    genreElements: 'flowers, soft furnishings, romantic ambiance',
    props: 'flowers, wine glasses, love letters, elegant accessories',
    lightSources: 'candles, golden hour sun, soft ambient',
    lightQuality: 'soft, flattering, warm',
    colorTemperature: 'warm golden, romantic pink',
    atmosphericEffects: 'soft focus, gentle breezes, flower petals',
    mood: 'romantic, intimate, hopeful, emotional',
    dominantColors: 'soft pink, cream, gold, white',
    accentColors: 'rose red, champagne gold, blush',
    metalTones: 'rose gold, polished gold, silver',
    overallPalette: 'soft romantic pastels and warm tones',
    style: 'romantic drama, love story',
    textureEmphasis: 'silk, lace, flowers, soft fabrics',
    eraFeeling: 'timeless romantic',
  },

  slice_of_life: {
    settings: ['home interior', 'neighborhood street', 'local shop', 'park bench', 'school'],
    architecture: 'everyday buildings, comfortable spaces',
    genreElements: 'ordinary life, comfortable normalcy',
    props: 'everyday items, personal belongings',
    lightSources: 'natural daylight, comfortable interior lighting',
    lightQuality: 'natural, warm, inviting',
    colorTemperature: 'warm and comfortable',
    atmosphericEffects: 'natural weather, comfortable atmosphere',
    mood: 'warm, relatable, comfortable, nostalgic',
    dominantColors: 'warm naturals, comfortable tones',
    accentColors: 'personal accent colors',
    metalTones: 'everyday metals',
    overallPalette: 'warm comfortable naturalistic',
    style: 'everyday realism, comfortable normalcy',
    textureEmphasis: 'comfortable everyday materials',
    eraFeeling: 'contemporary everyday life',
  },

  spy: {
    settings: ['luxury casino', 'secret base', 'exotic location', 'high-tech facility', 'embassy gala'],
    architecture: 'elegant international, high-security, luxury',
    genreElements: 'hidden weapons, surveillance equipment, disguises',
    props: 'concealed weapons, gadgets, formal wear, champagne',
    lightSources: 'elegant lighting, dramatic shadows, screen glow',
    lightQuality: 'sophisticated, dramatic, international',
    colorTemperature: 'cool and sophisticated with warm accents',
    atmosphericEffects: 'cigarette smoke, tension',
    mood: 'sophisticated danger, international intrigue, cool competence',
    dominantColors: 'black, midnight blue, silver, gold',
    accentColors: 'blood red, gold, martini clear',
    metalTones: 'polished chrome, gold, gunmetal',
    overallPalette: 'sophisticated international spy',
    style: 'James Bond, modern espionage',
    textureEmphasis: 'fine suits, polished metal, luxury materials',
    eraFeeling: 'modern international spy',
  },

  crime: {
    settings: ['dark alley', 'interrogation room', 'crime scene', 'underworld bar', 'prison'],
    architecture: 'urban decay, institutional, underground',
    genreElements: 'evidence, weapons, criminal elements',
    props: 'guns, money, evidence, criminal tools',
    lightSources: 'harsh interrogation, neon signs, street lights',
    lightQuality: 'harsh, unflattering, dramatic',
    colorTemperature: 'cold and harsh',
    atmosphericEffects: 'smoke, rain, urban grime',
    mood: 'dangerous, gritty, morally complex',
    dominantColors: 'black, gray, blood red, neon',
    accentColors: 'neon, blood red, money green',
    metalTones: 'gunmetal, chrome, rusted',
    overallPalette: 'gritty urban crime',
    style: 'crime drama, neo-noir',
    textureEmphasis: 'leather, concrete, metal, urban grime',
    eraFeeling: 'modern urban crime',
  },

  mecha: {
    settings: ['giant robot hangar', 'cockpit interior', 'military base', 'destroyed city'],
    architecture: 'massive scale industrial, military facilities',
    genreElements: 'giant robots, pilot suits, military tech',
    props: 'pilot suits, interface equipment, military gear',
    lightSources: 'industrial lighting, cockpit glow, dramatic external',
    lightQuality: 'industrial and dramatic',
    colorTemperature: 'cool tech with warm cockpit',
    atmosphericEffects: 'steam, sparks, dramatic lighting',
    mood: 'epic scale, military drama, technological wonder',
    dominantColors: 'military colors, steel, dramatic accents',
    accentColors: 'unit colors, warning colors, energy effects',
    metalTones: 'massive industrial metals',
    overallPalette: 'military industrial with unit accents',
    style: 'Gundam, mecha anime aesthetic',
    textureEmphasis: 'pilot suits, industrial metal, tech interfaces',
    eraFeeling: 'futuristic mecha warfare',
  },

  dystopia: {
    settings: ['oppressive city', 'propaganda plaza', 'surveillance state', 'resistance hideout'],
    architecture: 'brutalist, oppressive, uniform',
    genreElements: 'surveillance, propaganda, control symbols',
    props: 'identification papers, resistance symbols, propaganda',
    lightSources: 'harsh industrial, searchlights, screen glow',
    lightQuality: 'harsh, clinical, oppressive',
    colorTemperature: 'cold and sterile',
    atmosphericEffects: 'smog, industrial haze',
    mood: 'oppressive, resistant, paranoid, hopeful rebellion',
    dominantColors: 'gray, concrete, uniform colors, black',
    accentColors: 'propaganda red, resistance colors',
    metalTones: 'industrial steel, surveillance chrome',
    overallPalette: 'oppressive industrial monotone',
    style: '1984, Hunger Games dystopia',
    textureEmphasis: 'concrete, uniform fabric, industrial',
    eraFeeling: 'totalitarian dystopian future',
  },

  comedy: {
    settings: ['bright everyday location', 'colorful environment', 'casual social space'],
    architecture: 'normal but with comedic potential',
    genreElements: 'everyday absurdity, colorful props',
    props: 'everyday items with comedic potential',
    lightSources: 'bright natural lighting',
    lightQuality: 'bright, even, flattering',
    colorTemperature: 'warm and inviting',
    atmosphericEffects: 'bright and clear',
    mood: 'lighthearted, fun, energetic',
    dominantColors: 'bright, cheerful colors',
    accentColors: 'vibrant accent colors',
    metalTones: 'bright and reflective',
    overallPalette: 'bright cheerful comedy',
    style: 'comedy, sitcom aesthetic',
    textureEmphasis: 'everyday comfortable materials',
    eraFeeling: 'contemporary comedy',
  },

  heist: {
    settings: ['museum at night', 'bank vault', 'casino floor', 'planning room with blueprints'],
    architecture: 'high-security locations, elegant targets',
    genreElements: 'security systems, blueprints, disguises',
    props: 'tools, blueprints, disguises, tech equipment',
    lightSources: 'security lighting, dramatic shadows',
    lightQuality: 'dramatic thriller lighting',
    colorTemperature: 'cool and tense',
    atmosphericEffects: 'tension, laser beams, alarms',
    mood: 'tense, clever, exciting, precise',
    dominantColors: 'black, dark blue, silver, gold targets',
    accentColors: 'laser red, gold, security green',
    metalTones: 'vault steel, gold, chrome',
    overallPalette: 'sophisticated heist thriller',
    style: "Ocean's Eleven, heist thriller",
    textureEmphasis: 'tactical gear, formal wear, high-tech',
    eraFeeling: 'modern sophisticated heist',
  },

  supervillain: {
    settings: ['villainous lair', 'destroyed cityscape', 'dark throne room', 'secret base'],
    architecture: 'dramatic evil aesthetic, intimidating scale',
    genreElements: 'villain iconography, destruction, power symbols',
    props: 'villain weapons, dramatic props, power artifacts',
    lightSources: 'dramatic underlighting, energy effects, ominous',
    lightQuality: 'dramatic villain lighting',
    colorTemperature: 'dramatic and threatening',
    atmosphericEffects: 'smoke, energy effects, destruction',
    mood: 'powerful, menacing, theatrical evil',
    dominantColors: 'black, dark purple, blood red, silver',
    accentColors: 'villain energy colors, power effects',
    metalTones: 'dark metals, chrome, dramatic gold',
    overallPalette: 'dramatic villain aesthetic',
    style: 'comic book villain, theatrical evil',
    textureEmphasis: 'dramatic costume materials, power effects',
    eraFeeling: 'theatrical supervillain',
  },

  survival: {
    settings: ['wilderness camp', 'mountain terrain', 'forest survival shelter', 'harsh environment'],
    architecture: 'natural or improvised shelters',
    genreElements: 'survival gear, natural challenges, resourcefulness',
    props: 'survival tools, improvised equipment, natural materials',
    lightSources: 'natural light, campfire, harsh elements',
    lightQuality: 'natural and harsh',
    colorTemperature: 'natural environment colors',
    atmosphericEffects: 'weather, natural atmosphere',
    mood: 'survival, determination, human vs nature',
    dominantColors: 'natural greens, earth browns, sky colors',
    accentColors: 'survival gear colors, fire orange',
    metalTones: 'survival tools, weathered',
    overallPalette: 'natural wilderness survival',
    style: 'survival realism, man vs wild',
    textureEmphasis: 'outdoor gear, natural materials',
    eraFeeling: 'timeless wilderness survival',
  },

  cold_war: {
    settings: ['Berlin Wall', 'Soviet office', 'CIA safe house', 'Eastern European street'],
    architecture: 'Cold War era buildings, brutalist Soviet',
    genreElements: 'period technology, surveillance equipment, propaganda',
    props: 'period spy equipment, documents, period weapons',
    lightSources: 'harsh fluorescent, period lighting',
    lightQuality: 'cold and institutional',
    colorTemperature: 'cold, institutional',
    atmosphericEffects: 'fog, tension, paranoia',
    mood: 'paranoid, tense, ideological conflict',
    dominantColors: 'gray, brown, muted Soviet colors',
    accentColors: 'red Soviet, American blue',
    metalTones: 'industrial Soviet, period metals',
    overallPalette: 'desaturated Cold War period',
    style: 'Cold War thriller, period espionage',
    textureEmphasis: 'period fabrics, institutional materials',
    eraFeeling: 'Cold War era 1950s-1989',
  },

  // Note: space_opera already defined above, duplicate removed

  mythology: {
    settings: ['divine realm', 'ancient temple', 'mythic landscape', 'celestial plane'],
    architecture: 'divine temples, mythic structures',
    genreElements: 'divine symbols, mythic creatures, sacred objects',
    props: 'divine weapons, sacred artifacts, mythic items',
    lightSources: 'divine light, mythic glow, celestial',
    lightQuality: 'ethereal and divine',
    colorTemperature: 'warm divine or varied by pantheon',
    atmosphericEffects: 'divine mist, celestial light',
    mood: 'mythic, divine, legendary',
    dominantColors: 'divine gold, celestial colors',
    accentColors: 'deity-specific colors',
    metalTones: 'divine gold, mythic metals',
    overallPalette: 'mythic divine palette',
    style: 'classical mythology, divine epic',
    textureEmphasis: 'divine materials, mythic elements',
    eraFeeling: 'timeless mythological',
  },

  renaissance: {
    settings: ['Italian palazzo', 'art studio', 'court gathering', 'Renaissance street'],
    architecture: 'Renaissance architecture, classical revival',
    genreElements: 'art, intrigue, classical revival, humanism',
    props: 'art materials, period weapons, fine clothing',
    lightSources: 'natural light through grand windows, candles',
    lightQuality: 'Renaissance painting light, chiaroscuro',
    colorTemperature: 'warm and golden',
    atmosphericEffects: 'artistic atmosphere, dust motes',
    mood: 'artistic, political intrigue, cultural flowering',
    dominantColors: 'rich reds, golds, greens, Renaissance palette',
    accentColors: 'Medici colors, artistic pigments',
    metalTones: 'Renaissance gold, bronze',
    overallPalette: 'Renaissance painting palette',
    style: 'Italian Renaissance, Borgia aesthetic',
    textureEmphasis: 'velvet, silk, marble, fine materials',
    eraFeeling: 'Italian Renaissance 1400-1600',
  },

  ancient: {
    settings: ['Roman forum', 'Greek temple', 'Egyptian palace', 'ancient battlefield'],
    architecture: 'classical ancient architecture, columns, temples',
    genreElements: 'ancient warfare, classical culture, mythology',
    props: 'ancient weapons, classical items, period artifacts',
    lightSources: 'Mediterranean sun, torches, oil lamps',
    lightQuality: 'classical drama lighting',
    colorTemperature: 'warm Mediterranean',
    atmosphericEffects: 'dust, incense smoke, ancient atmosphere',
    mood: 'classical, epic, foundational',
    dominantColors: 'marble white, bronze, terracotta, deep purple',
    accentColors: 'imperial purple, gold, blood red',
    metalTones: 'bronze, gold, iron',
    overallPalette: 'classical ancient palette',
    style: 'Gladiator, classical epic',
    textureEmphasis: 'marble, bronze, linen, leather',
    eraFeeling: 'classical antiquity, Rome and Greece',
  },

  dieselpunk: {
    settings: ['1930s-40s retro-futuristic city', 'art deco factory', 'wartime technology'],
    architecture: 'art deco, industrial might, massive machines',
    genreElements: 'diesel-powered tech, art deco design, propaganda',
    props: 'retro-futuristic weapons, period technology',
    lightSources: 'industrial lighting, dramatic shadows',
    lightQuality: 'dramatic industrial',
    colorTemperature: 'warm industrial',
    atmosphericEffects: 'diesel smoke, industrial atmosphere',
    mood: 'industrial power, art deco elegance, wartime',
    dominantColors: 'art deco gold, industrial gray, propaganda red',
    accentColors: 'chrome silver, brass, military colors',
    metalTones: 'chrome, brass, industrial steel',
    overallPalette: 'art deco industrial',
    style: 'art deco retro-futurism',
    textureEmphasis: 'chrome, leather, industrial materials',
    eraFeeling: '1930s-1940s alternate history',
  },

  exploration: {
    settings: ['uncharted wilderness', 'ancient ruins discovery', 'expedition camp', 'mysterious island'],
    architecture: 'natural environments, discovered ruins',
    genreElements: 'discovery, adventure, unknown territories',
    props: 'expedition equipment, maps, discovery tools',
    lightSources: 'natural light, campfires, torches',
    lightQuality: 'adventure natural lighting',
    colorTemperature: 'natural environment',
    atmosphericEffects: 'jungle mist, ancient dust, adventure atmosphere',
    mood: 'discovery, adventure, wonder, danger',
    dominantColors: 'jungle greens, ancient stone, adventure khaki',
    accentColors: 'treasure gold, discovery colors',
    metalTones: 'expedition brass, ancient bronze',
    overallPalette: 'adventure exploration palette',
    style: 'Indiana Jones, adventure discovery',
    textureEmphasis: 'expedition gear, natural materials, ancient stone',
    eraFeeling: 'adventure era exploration',
  },
};

// Function to build genre visual description from lock
function buildGenreVisualDescription(genreKey: string): string {
  const lock = GENRE_VISUAL_LOCKS[genreKey] || GENRE_VISUAL_LOCKS['fantasy'];
  
  const setting = lock.settings[Math.floor(Math.random() * lock.settings.length)];
  
  const parts = [
    `BACKGROUND ENVIRONMENT: ${setting}`,
    `Architecture: ${lock.architecture}`,
    `Genre elements: ${lock.genreElements}`,
    `LIGHTING: ${lock.lightSources}, ${lock.lightQuality}`,
    `Color temperature: ${lock.colorTemperature}`,
    `Atmospheric effects: ${lock.atmosphericEffects}`,
    `MOOD: ${lock.mood}`,
    `COLOR PALETTE: Dominant colors ${lock.dominantColors}, accent colors ${lock.accentColors}`,
    `Metal tones: ${lock.metalTones}`,
    `Overall palette: ${lock.overallPalette}`,
    `AESTHETIC: ${lock.style}, texture emphasis ${lock.textureEmphasis}, era feeling ${lock.eraFeeling}`,
  ];

  if (lock.criticalNotes) {
    parts.push(lock.criticalNotes);
  }

  return parts.join('. ');
}

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
  const genreVisualDescription = buildGenreVisualDescription(genreKey);
  
  const backgroundStr = genreVisualDescription;
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
