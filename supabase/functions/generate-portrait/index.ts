import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre-specific styling with backgrounds and diverse costume options
const GENRE_STYLES: Record<string, { background: string; costumes: string[]; lighting: string }> = {
  fantasy: { 
    background: 'medieval tavern with wooden beams and candlelight',
    costumes: [
      'worn leather traveling cloak with fur trim, simple linen tunic',
      'ornate mage robes with arcane symbols, crystal pendant',
      'steel plate armor with engraved heraldry, red cape',
      'ranger outfit with hooded green cloak, quiver and bow',
      'barmaid dress with corset and apron',
      'noble silk garments with gold embroidery',
    ],
    lighting: 'warm torchlight, mystical glow'
  },
  medieval: { 
    background: 'stone castle corridor with torches',
    costumes: [
      'peasant tunic with leather belt and simple boots',
      'knight chainmail with surcoat bearing family crest',
      'noble velvet doublet with fur-lined collar',
      'monk brown robes with rope belt',
      'blacksmith leather apron over rough-spun clothes',
      'lady-in-waiting embroidered gown with headdress',
    ],
    lighting: 'dramatic candlelight shadows'
  },
  dark_fantasy: { 
    background: 'gothic cathedral with stained glass',
    costumes: [
      'tattered black cloak with silver skull clasp',
      'dark plate armor with thorny motifs, blood-red accents',
      'witch hunter leather coat with blessed silver weapons',
      'cursed noble attire, once-fine clothes now corrupted',
      'necromancer robes with bone jewelry',
      'fallen paladin dented armor with torn holy symbols',
    ],
    lighting: 'moonlight through stained glass, eerie glow'
  },
  high_fantasy: { 
    background: 'magical elven palace with floating crystals',
    costumes: [
      'flowing elven silk robes with leaf patterns',
      'archmage vestments glowing with enchantments',
      'celestial armor with golden wings motif',
      'druid natural fiber clothes with living vines',
      'royal elven court dress with moonstone jewelry',
      'battle mage reinforced robes with spell components',
    ],
    lighting: 'ethereal magical luminescence'
  },
  cyberpunk: { 
    background: 'neon-lit rain-soaked megacity alley with holographic ads',
    costumes: [
      'tactical techwear jacket with LED strips, cargo pants',
      'corporate exec sleek suit with hidden tech implants',
      'street samurai armored longcoat with neon trim',
      'netrunner hoodie covered in data ports and cables',
      'club kid holographic vinyl outfit with glow accessories',
      'mercenary combat vest with modular gear attachments',
    ],
    lighting: 'harsh neon pink and cyan, rain reflections'
  },
  scifi: { 
    background: 'sleek spaceship corridor with glowing panels',
    costumes: [
      'starship officer uniform with rank insignia',
      'engineer jumpsuit with tool belt and grease stains',
      'scientist lab coat over futuristic bodysuit',
      'pilot flight suit with helmet under arm',
      'diplomat formal robes blending alien cultures',
      'security officer tactical armor with energy shields',
    ],
    lighting: 'cool blue LED ambient'
  },
  sci_fi: { 
    background: 'orbital space station observation deck',
    costumes: [
      'explorer exosuit with environmental sensors',
      'medic sterile white uniform with holographic displays',
      'bounty hunter mismatched armor pieces',
      'colonist practical work clothes with patches',
      'android sleek synthetic skin-tight suit',
      'smuggler worn leather jacket over ship coveralls',
    ],
    lighting: 'starlight and holographic displays'
  },
  space_opera: { 
    background: 'grand starship bridge with view of nebula',
    costumes: [
      'admiral dress uniform with medals and cape',
      'rebel freedom fighter patched military surplus',
      'alien ambassador exotic robes with cultural symbols',
      'space pirate flamboyant coat with energy cutlass',
      'princess elegant gown with royal sash',
      'mystic warrior monk robes with energy blade',
    ],
    lighting: 'dramatic space lighting with nebula colors'
  },
  horror: { 
    background: 'abandoned asylum corridor with peeling walls',
    costumes: [
      'survivor blood-stained casual clothes, torn',
      'investigator rumpled suit with flashlight',
      'nurse dirty medical scrubs',
      'patient hospital gown with restraint marks',
      'paranormal researcher tactical vest with detection gear',
      'cult escapee torn ceremonial robe',
    ],
    lighting: 'harsh flashlight beam, deep shadows'
  },
  vampire: { 
    background: 'Victorian gothic manor with red velvet',
    costumes: [
      'aristocrat velvet coat with lace cravat',
      'hunter leather duster with silver accessories',
      'ancient vampire ornate medieval noble attire',
      'thrall servant simple but elegant uniform',
      'nightclub predator modern goth fashion',
      'scholar dusty academic robes with old books',
    ],
    lighting: 'candlelit crimson atmosphere'
  },
  zombie: { 
    background: 'barricaded survivor camp with debris',
    costumes: [
      'survivor tactical vest over bloody civilian clothes',
      'military deserter torn uniform with scavenged gear',
      'medic bloodstained scrubs with improvised armor',
      'mechanic oil-stained coveralls with tools',
      'hunter camouflage with handmade weapons',
      'former cop tattered police uniform',
    ],
    lighting: 'gritty overcast, emergency lights'
  },
  western: { 
    background: 'dusty saloon with swinging doors',
    costumes: [
      'outlaw dusty duster coat, bandana, worn boots',
      'sheriff star badge, formal vest, gun belt',
      'rancher work-worn jeans, checked shirt, hat',
      'saloon dancer corset dress with feathers',
      'native scout leather and beadwork traditional wear',
      'bounty hunter long coat with multiple holsters',
    ],
    lighting: 'golden hour desert sun'
  },
  pirate: { 
    background: 'wooden ship deck with sails and rigging',
    costumes: [
      'captain ornate coat with tricorn hat, gold buttons',
      'deckhand simple striped shirt, bandana, bare feet',
      'first mate leather vest with navigation tools',
      'naval officer pristine uniform with cutlass',
      'sea witch tattered dress with shells and bones',
      'buccaneer colorful sash, loose shirt, eye patch',
    ],
    lighting: 'sunset over ocean, lantern glow'
  },
  victorian: { 
    background: 'foggy gaslit London street',
    costumes: [
      'gentleman tailored suit with top hat and cane',
      'lady elegant bustle dress with parasol',
      'detective tweed coat with deerstalker cap',
      'street urchin patched clothes, newsboy cap',
      'factory worker soot-stained work clothes',
      'society lady elaborate evening gown with jewels',
    ],
    lighting: 'atmospheric fog with gaslight'
  },
  steampunk: { 
    background: 'brass workshop with gears and steam pipes',
    costumes: [
      'inventor leather apron with brass goggles, tool belt',
      'airship captain military coat with gear accessories',
      'automaton engineer oil-stained vest with mechanical arm',
      'aristocrat corset/vest with clockwork jewelry',
      'sky pirate goggles, aviator jacket, mechanical leg',
      'scientist lab coat with steam-powered gadgets',
    ],
    lighting: 'warm amber industrial lighting'
  },
  noir: { 
    background: 'rain-slicked city street at night',
    costumes: [
      'detective rumpled trench coat, fedora, loose tie',
      'femme fatale slinky evening dress, fur stole',
      'mobster pinstripe suit, silk tie, pocket square',
      'journalist worn suit with press badge',
      'nightclub singer sequined dress, long gloves',
      'dirty cop wrinkled uniform, suspicious bulges',
    ],
    lighting: 'dramatic film noir shadows, streetlight'
  },
  mystery: { 
    background: 'private detective office with case files',
    costumes: [
      'investigator casual blazer with notebook',
      'amateur sleuth cardigan and comfortable shoes',
      'forensic expert lab coat with magnifying glass',
      'suspect nervous formal attire',
      'witness ordinary everyday clothes',
      'police consultant smart casual with badge',
    ],
    lighting: 'desk lamp creating dramatic shadows'
  },
  spy: { 
    background: 'luxury casino with chandeliers',
    costumes: [
      'agent tailored tuxedo with hidden weapons',
      'femme fatale elegant cocktail dress with concealed blade',
      'tech specialist casual genius look with gadgets',
      'handler sophisticated business attire',
      'double agent forgettable grey suit',
      'assassin sleek all-black tactical formal wear',
    ],
    lighting: 'glamorous golden casino lighting'
  },
  crime: { 
    background: 'gritty urban alley with graffiti',
    costumes: [
      'gang member street clothes with colors, chains',
      'undercover cop deliberately casual disguise',
      'dealer flashy jewelry, designer labels',
      'enforcer leather jacket, intimidating presence',
      'informant nervous in hood and sunglasses',
      'crime boss expensive but understated suit',
    ],
    lighting: 'harsh streetlight, urban night'
  },
  postapoc: { 
    background: 'wasteland ruins with rusted vehicles',
    costumes: [
      'wastelander scavenged mismatched armor, gas mask',
      'raider tribal war paint, spiky leather, bones',
      'vault dweller clean blue jumpsuit, pip-boy',
      'caravan guard layered travel clothes with weapons',
      'mutant survivor hooded cloak hiding deformities',
      'tech scavenger goggles, tool bandolier, salvaged tech',
    ],
    lighting: 'dusty orange apocalyptic sunset'
  },
  post_apocalyptic: { 
    background: 'collapsed city overgrown with vegetation',
    costumes: [
      'nature reclaimer vine-wrapped clothes, garden tools',
      'bunker dweller clean preserved pre-war clothes',
      'tribal warrior animal furs with scrap metal armor',
      'medic tattered white coat with precious supplies',
      'wanderer layered weathered traveling clothes',
      'community leader practical leader attire with symbols',
    ],
    lighting: 'overcast wasteland atmosphere'
  },
  war: { 
    background: 'military forward operating base',
    costumes: [
      'infantry soldier full combat uniform, helmet, rifle',
      'officer dress uniform with command insignia',
      'medic red cross armband, medical pack',
      'sniper ghillie elements, camouflage face paint',
      'tank crew coveralls with headset',
      'special forces black tactical gear, night vision',
    ],
    lighting: 'harsh military lighting'
  },
  ww2: { 
    background: 'WWII bunker with sandbags',
    costumes: [
      'GI soldier olive drab uniform, M1 helmet',
      'resistance fighter civilian clothes with hidden weapons',
      'nurse period military nurse uniform',
      'pilot leather bomber jacket, flight goggles',
      'spy period civilian suit blending in',
      'officer period-accurate dress uniform',
    ],
    lighting: 'gritty wartime atmosphere'
  },
  superhero: { 
    background: 'city rooftop at night with skyline',
    costumes: [
      'classic hero bright spandex suit with cape, emblem',
      'dark vigilante armored black suit, utility belt',
      'tech hero powered armor suit with glowing elements',
      'mystic hero robes with magical accessories',
      'speedster aerodynamic suit with lightning motifs',
      'civilian identity glasses, ordinary clothes',
    ],
    lighting: 'dramatic moonlight and city lights'
  },
  modern: { 
    background: 'modern urban cityscape',
    costumes: [
      'business professional tailored suit or blazer',
      'student casual jeans and graphic tee',
      'artist creative eclectic mix of styles',
      'athlete sporty activewear',
      'goth alternative black clothing with silver',
      'hipster vintage thrift store aesthetic',
    ],
    lighting: 'natural daylight'
  },
  modern_life: { 
    background: 'contemporary city sidewalk with shops',
    costumes: [
      'office worker business casual attire',
      'barista apron over trendy clothes',
      'delivery driver uniform with company logo',
      'shopper comfortable casual with bags',
      'jogger athletic wear with earbuds',
      'street performer colorful attention-grabbing outfit',
    ],
    lighting: 'bright natural light'
  },
  contemporary: { 
    background: 'trendy urban cafe interior',
    costumes: [
      'influencer curated instagram-worthy outfit',
      'tech worker hoodie and premium sneakers',
      'creative designer unique handmade pieces',
      'minimalist neutral tones clean lines',
      'maximalist bold patterns and colors mixed',
      'vintage collector retro authentic pieces',
    ],
    lighting: 'warm cafe ambiance'
  },
  slice_of_life: { 
    background: 'cozy modern apartment living room',
    costumes: [
      'homebody comfortable loungewear, fuzzy socks',
      'work from home smart top, pajama pants',
      'weekend casual jeans and favorite sweater',
      'cooking enthusiast apron over casual clothes',
      'gamer gaming headset, band t-shirt',
      'reader cozy cardigan, reading glasses',
    ],
    lighting: 'soft natural window light'
  },
  romance: { 
    background: 'elegant ballroom or garden venue',
    costumes: [
      'date night elegant dress or sharp suit',
      'casual romance sundress or linen shirt',
      'wedding guest formal cocktail attire',
      'first date carefully chosen impressive outfit',
      'anniversary elegant but comfortable favorite outfit',
      'secret admirer ordinary clothes hiding feelings',
    ],
    lighting: 'romantic soft golden hour'
  },
  urban_fantasy: { 
    background: 'modern city alley with magical elements',
    costumes: [
      'hidden mage modern clothes with concealed magical items',
      'vampire modern goth chic with ancient accessories',
      'werewolf rugged casual that can survive transformation',
      'fae glamoured trendy fashion hiding otherworldly nature',
      'witch occult shop owner bohemian with subtle symbols',
      'hunter tactical casual with blessed weapons hidden',
    ],
    lighting: 'urban night with magical glow'
  },
};

// Origin/cultural style modifiers that enhance genre costumes
const ORIGIN_STYLE_MODIFIERS: Record<string, string> = {
  // Asian origins
  'japanese': 'with Japanese aesthetic influences, elegant minimalist details',
  'chinese': 'with Chinese cultural motifs, silk accents, traditional patterns',
  'korean': 'with Korean fashion influences, clean modern lines',
  'indian': 'with Indian textile patterns, rich embroidery, vibrant colors',
  'thai': 'with Thai decorative elements, gold accents',
  'vietnamese': 'with Vietnamese traditional influences, ao dai inspired elements',
  // European origins
  'british': 'with British tailoring, refined classic style',
  'french': 'with French haute couture influences, elegant sophistication',
  'italian': 'with Italian fashion flair, stylish and bold',
  'german': 'with Germanic practical precision, quality craftsmanship',
  'spanish': 'with Spanish flair, dramatic passionate style',
  'russian': 'with Russian influences, fur accents, bold patterns',
  'scandinavian': 'with Scandinavian minimalist design, functional beauty',
  'irish': 'with Celtic influences, earthy tones, knit patterns',
  'scottish': 'with Scottish heritage elements, tartan accents',
  'greek': 'with Grecian draping, classical elegance',
  // American origins
  'american': 'with American style, practical yet bold',
  'mexican': 'with Mexican vibrant colors, traditional embroidery',
  'brazilian': 'with Brazilian flair, colorful and lively',
  'caribbean': 'with Caribbean tropical influences, bright patterns',
  // African origins
  'african': 'with African textile patterns, bold geometric designs',
  'nigerian': 'with Nigerian fashion, rich fabrics, elaborate designs',
  'egyptian': 'with Egyptian motifs, gold accents, ancient elegance',
  'moroccan': 'with Moroccan influences, intricate patterns, jewel tones',
  'ethiopian': 'with Ethiopian traditional elements, woven patterns',
  // Middle Eastern origins
  'arabian': 'with Arabian elegance, flowing fabrics, ornate details',
  'persian': 'with Persian artistic influences, intricate patterns',
  'turkish': 'with Turkish design elements, rich textures',
  'israeli': 'with Israeli modern style, practical elegance',
  // Other
  'australian': 'with Australian outback influences, rugged practicality',
  'polynesian': 'with Polynesian traditional patterns, tropical elements',
  'native american': 'with Native American traditional elements, beadwork, natural materials',
};

// Get cultural style modifier based on ethnicity/nationality only (origin is background story, not culture)
function getOriginModifier(nationality?: string, ethnicity?: string): string {
  // Only use nationality and ethnicity for cultural style - origin is character background story
  const cultureStr = (nationality || ethnicity || '').toLowerCase();
  
  for (const [key, modifier] of Object.entries(ORIGIN_STYLE_MODIFIERS)) {
    if (cultureStr.includes(key)) {
      return modifier;
    }
  }
  return '';
}

// Select a costume based on character class - prioritize class matching
function selectCostume(costumes: string[], characterClass?: string): string {
  if (characterClass) {
    const classLower = characterClass.toLowerCase();
    
    // Direct match first
    const directMatch = costumes.find(c => c.toLowerCase().includes(classLower));
    if (directMatch) return directMatch;
    
    // Keyword mapping for common class types
    const classKeywords: Record<string, string[]> = {
      // Fantasy
      'mage': ['mage', 'wizard', 'robes', 'arcane', 'spell'],
      'wizard': ['mage', 'wizard', 'robes', 'arcane'],
      'warrior': ['armor', 'knight', 'plate', 'combat', 'soldier'],
      'fighter': ['armor', 'knight', 'combat', 'soldier'],
      'rogue': ['leather', 'hood', 'cloak', 'thief', 'shadow'],
      'thief': ['leather', 'hood', 'cloak', 'thief'],
      'healer': ['medic', 'nurse', 'robes', 'white'],
      'cleric': ['robes', 'holy', 'priest'],
      'ranger': ['ranger', 'hood', 'cloak', 'leather', 'bow'],
      'paladin': ['armor', 'plate', 'knight', 'holy'],
      'bard': ['colorful', 'performer', 'elegant'],
      'druid': ['druid', 'natural', 'vine', 'leather'],
      // Cyberpunk
      'netrunner': ['netrunner', 'data port', 'cable', 'hoodie', 'tech'],
      'hacker': ['netrunner', 'data port', 'hoodie', 'tech'],
      'solo': ['combat', 'tactical', 'armor', 'mercenary'],
      'mercenary': ['mercenary', 'combat', 'tactical', 'vest'],
      'fixer': ['suit', 'corporate', 'sleek', 'exec'],
      'techie': ['engineer', 'jumpsuit', 'tool', 'tech'],
      'rockerboy': ['club', 'performer', 'holographic', 'vinyl'],
      'nomad': ['scaveng', 'patch', 'survival', 'road'],
      'corporate': ['corporate', 'suit', 'exec', 'sleek'],
      'exec': ['corporate', 'suit', 'exec', 'sleek'],
      // Sci-fi
      'pilot': ['pilot', 'flight', 'jumpsuit'],
      'engineer': ['engineer', 'jumpsuit', 'tool', 'coverall'],
      'scientist': ['scientist', 'lab coat', 'research'],
      'captain': ['captain', 'officer', 'uniform', 'admiral'],
      'bounty hunter': ['bounty', 'armor', 'hunter', 'tactical'],
      // Horror/Modern
      'detective': ['detective', 'coat', 'investigator', 'suit'],
      'survivor': ['survivor', 'torn', 'bloody', 'tactical'],
      'investigator': ['investigator', 'detective', 'suit'],
      // Western
      'gunslinger': ['outlaw', 'duster', 'holster', 'cowboy'],
      'sheriff': ['sheriff', 'badge', 'vest', 'star'],
      'outlaw': ['outlaw', 'duster', 'bandana'],
    };
    
    const keywords = classKeywords[classLower] || [];
    for (const keyword of keywords) {
      const match = costumes.find(c => c.toLowerCase().includes(keyword));
      if (match) return match;
    }
  }
  // Random selection if no match
  return costumes[Math.floor(Math.random() * costumes.length)];
}

// Build complete clothing description: genre costume + origin style + user additionals
function buildClothingDescription(
  baseCostume: string, 
  originModifier: string, 
  userAdditionals?: string
): string {
  let clothing = baseCostume;
  
  // Add origin cultural influence
  if (originModifier) {
    clothing = `${clothing} ${originModifier}`;
  }
  
  // User additionals enhance and override
  if (userAdditionals && userAdditionals.trim()) {
    clothing = `${userAdditionals}, ${clothing}`;
  }
  
  return clothing;
}

function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, height, skinTone, 
    hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, origin, nationality, ethnicity,
    details, distinguishingFeatures, accessories,
    piercings, tattoos, tattooStyle, scars, implants, prosthetics, mutations,
    // Body shape
    bustSize, hipWidth, muscleDefinition,
  } = body;

  const desc: string[] = [];
  
  // Age defaults to 18
  const charAge = age || 18;
  
  // Demographics
  const eth = ethnicity || nationality || origin || 'American Caucasian';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  desc.push(`${charAge} year old ${eth} ${genderWord}`);
  
  // Body shape for female characters - breasts and butt only
  if (gender === 'female' || gender === 'other') {
    // Bust sizes: small/medium/large/extra
    const bustMap: Record<string, string> = {
      'small': 'small breasts',
      'medium': 'medium breasts',
      'large': 'large breasts',
      'extra': 'extra large breasts',
    };
    const bust = bustSize || 'medium';
    const bustDesc = bustMap[bust.toLowerCase()] || `${bust} breasts`;
    desc.push(bustDesc);
    
    // Hip sizes: small/medium/large/extra
    const hipMap: Record<string, string> = {
      'small': 'small butt',
      'medium': 'medium butt',
      'large': 'large butt',
      'extra': 'extra large butt',
    };
    const hip = hipWidth || 'medium';
    const hipDesc = hipMap[hip.toLowerCase()] || `${hip} butt`;
    desc.push(hipDesc);
  }
  
  // Build and muscle
  if (build) desc.push(`${build} body`);
  if (muscleDefinition && muscleDefinition !== 'none' && muscleDefinition !== 'toned') {
    desc.push(`${muscleDefinition} muscles`);
  }
  if (height) desc.push(`${height} height`);
  if (skinTone) desc.push(`${skinTone} skin`);
  
  // Face
  if (faceShape) desc.push(`${faceShape} face`);
  if (eyeColor) desc.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) {
    desc.push(`${hairColor || ''} ${hairStyle || 'styled'} hair`.trim());
  }
  
  // Features and accessories
  const allFeatures: string[] = [];
  if (details?.length) allFeatures.push(...details);
  if (distinguishingFeatures?.length) allFeatures.push(...distinguishingFeatures);
  if (accessories?.length) allFeatures.push(...accessories);
  if (allFeatures.length) desc.push(allFeatures.join(', '));
  
  // Body modifications
  if (tattoos?.length) {
    const style = tattooStyle ? `${tattooStyle} style ` : '';
    desc.push(`${style}tattoos`);
  }
  if (piercings?.length) desc.push('piercings');
  if (scars?.length) desc.push('scars');
  if (implants?.length) desc.push('cybernetic implants');
  if (prosthetics?.length) desc.push('prosthetic limbs');
  if (mutations?.length) desc.push('mutations');
  
  // Role/class
  if (characterClass) desc.push(characterClass);
  
  // User's custom description - HIGH PRIORITY for clothing/appearance overrides
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  
  // Get genre styling
  const genreKey = (genre || 'fantasy').toLowerCase().replace(/[\s-]/g, '_');
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  const character = desc.join(', ');
  
  console.log('Portrait for:', name, '| Genre:', genre);
  console.log('Genre key:', genreKey);
  console.log('Genre style:', JSON.stringify(style));
  console.log('Additional details:', userDesc);
  console.log('Full description:', character);
  
  // Build clothing: genre costume + origin cultural style + user additionals
  const selectedCostume = selectCostume(style.costumes, characterClass);
  const originModifier = getOriginModifier(nationality, ethnicity);
  const clothingDesc = buildClothingDescription(selectedCostume, originModifier, userDesc);
  
  console.log('Selected costume:', selectedCostume);
  console.log('Origin modifier:', originModifier);
  console.log('Final clothing:', clothingDesc);
  
  // Professional realistic art style prompt - NO cartoon/stylized elements
  const prompt = `Knees-to-head standing character portrait, centered full figure crop at the knees, facing camera, confident neutral stance, clean silhouette, readable design, ${character}, MUST BE WEARING: ${clothingDesc}, High-end digital illustration with realistic rendering: realistic anatomy, realistic materials and fabrics, realistic skin with natural texture and pores, photographic quality lighting, crisp details, polished AAA game character art finish, Cinematic lighting: soft key light + subtle rim light, realistic specular highlights on hard surfaces, gentle bloom, atmospheric depth, background bokeh, Material fidelity: visible fabric weave and stitching, metal reflections and micro-scratches, leather grain, realistic cloth physics, Background: ${style.background}, ${style.lighting}, depth and atmosphere, character is the focus, Camera: 50mm portrait lens, eye-level, slight depth of field, sharp face and eyes, clean professional composition, Design coherence: outfit matches character role and genre, consistent color palette, unified visual language, Quality: correct hands with 5 fingers, correct human proportions, no artifacts, no extra limbs`;
  
  console.log('Final prompt:', prompt);
  console.log('Character class for costume:', characterClass);
  
  return {
    prompt,
    negative: 'cartoon, anime, cel-shaded, stylized, illustrated, painted look, flat colors, lowpoly, pixel art, sketchy, lineart, washed out, over-saturated, muddy lighting, blurry, low-res, jpeg artifacts, watermark, logo, text, extra fingers, extra limbs, deformed hands, asymmetrical eyes, plastic skin, bad anatomy, cropped head, cut-off face, full body with feet, feet visible, ground visible, casual clothes when should be genre-specific, wrong outfit for character class',
  };
}

async function generateImage(prompt: string, negative: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  // Combine prompt with negative prompt instructions
  const fullPrompt = `${prompt}\n\nIMPORTANT - AVOID: ${negative}`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: fullPrompt
        }
      ],
      modalities: ["image", "text"]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Lovable AI error:", error);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    if (response.status === 402) {
      throw new Error("Payment required, please add credits to your workspace");
    }
    throw new Error(`Generation failed: ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    console.error("No image in response:", JSON.stringify(data));
    throw new Error("No image returned from AI");
  }

  return imageUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    if (body.customPrompt && !body.gender) {
      const imageUrl = await generateImage(body.customPrompt, '');
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, negative } = buildPrompt(body);
    const imageUrl = await generateImage(prompt, negative);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
