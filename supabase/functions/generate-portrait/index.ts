import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Genre themes - just aesthetic direction, let AI be creative with outfits
const GENRE_STYLES: Record<string, { background: string; aesthetic: string; lighting: string }> = {
  fantasy: { 
    background: 'medieval fantasy setting',
    aesthetic: 'medieval fantasy clothing appropriate for their role',
    lighting: 'warm torchlight, mystical glow'
  },
  medieval: { 
    background: 'stone castle or medieval village',
    aesthetic: 'authentic medieval period clothing befitting their station',
    lighting: 'dramatic candlelight shadows'
  },
  dark_fantasy: { 
    background: 'gothic dark fantasy environment',
    aesthetic: 'dark gothic fantasy attire with ominous undertones',
    lighting: 'moonlight, eerie glow'
  },
  high_fantasy: { 
    background: 'magical realm with ethereal elements',
    aesthetic: 'elegant high fantasy clothing with magical flourishes',
    lighting: 'ethereal magical luminescence'
  },
  cyberpunk: { 
    background: 'neon-lit megacity with holographic ads',
    aesthetic: 'cyberpunk fashion - techwear, neon accents, urban tech style fitting their role',
    lighting: 'harsh neon pink and cyan, rain reflections'
  },
  scifi: { 
    background: 'sleek spaceship or space station interior',
    aesthetic: 'science fiction attire appropriate for space-faring civilization',
    lighting: 'cool blue LED ambient'
  },
  sci_fi: { 
    background: 'futuristic sci-fi environment',
    aesthetic: 'futuristic clothing matching their profession',
    lighting: 'starlight and holographic displays'
  },
  space_opera: { 
    background: 'grand starship or alien world',
    aesthetic: 'dramatic space opera costume - bold, theatrical, epic',
    lighting: 'dramatic space lighting with nebula colors'
  },
  horror: { 
    background: 'abandoned creepy location',
    aesthetic: 'practical survivor or investigator clothing',
    lighting: 'harsh flashlight beam, deep shadows'
  },
  vampire: { 
    background: 'Victorian gothic manor',
    aesthetic: 'gothic elegant attire with Victorian influences',
    lighting: 'candlelit crimson atmosphere'
  },
  zombie: { 
    background: 'post-outbreak survivor camp',
    aesthetic: 'apocalypse survivor gear, practical and worn',
    lighting: 'gritty overcast, emergency lights'
  },
  western: { 
    background: 'Old West frontier town',
    aesthetic: 'authentic Wild West clothing for their role',
    lighting: 'golden hour desert sun'
  },
  pirate: { 
    background: 'wooden ship deck or port town',
    aesthetic: 'age of sail pirate or naval attire',
    lighting: 'sunset over ocean, lantern glow'
  },
  victorian: { 
    background: 'foggy Victorian era street',
    aesthetic: 'period-accurate Victorian clothing for their class',
    lighting: 'atmospheric fog with gaslight'
  },
  steampunk: { 
    background: 'brass and steam industrial setting',
    aesthetic: 'steampunk fashion with gears, goggles, brass accessories',
    lighting: 'warm amber industrial lighting'
  },
  noir: { 
    background: 'rain-slicked 1940s city night',
    aesthetic: 'classic film noir fashion - trench coats, fedoras, elegant evening wear',
    lighting: 'dramatic film noir shadows, streetlight'
  },
  mystery: { 
    background: 'detective office or crime scene',
    aesthetic: 'investigator or suspect clothing appropriate to the mystery',
    lighting: 'desk lamp creating dramatic shadows'
  },
  spy: { 
    background: 'luxury casino or covert location',
    aesthetic: 'sophisticated spy attire - sleek, elegant, deadly',
    lighting: 'glamorous golden casino lighting'
  },
  crime: { 
    background: 'gritty urban environment',
    aesthetic: 'street-smart urban fashion for their criminal role',
    lighting: 'harsh streetlight, urban night'
  },
  postapoc: { 
    background: 'wasteland ruins',
    aesthetic: 'post-apocalyptic scavenged and improvised clothing',
    lighting: 'dusty orange apocalyptic sunset'
  },
  post_apocalyptic: { 
    background: 'collapsed civilization ruins',
    aesthetic: 'survivor clothing - practical, weathered, resourceful',
    lighting: 'overcast wasteland atmosphere'
  },
  war: { 
    background: 'military base or battlefield',
    aesthetic: 'military uniform and gear for their rank and role',
    lighting: 'harsh military lighting'
  },
  ww2: { 
    background: 'WWII era setting',
    aesthetic: 'period-accurate WWII clothing or uniform',
    lighting: 'gritty wartime atmosphere'
  },
  superhero: { 
    background: 'city rooftop at night',
    aesthetic: 'superhero costume matching their powers and persona',
    lighting: 'dramatic moonlight and city lights'
  },
  modern: { 
    background: 'modern urban cityscape',
    aesthetic: 'contemporary modern fashion for their lifestyle',
    lighting: 'natural daylight'
  },
  modern_life: { 
    background: 'contemporary city street',
    aesthetic: 'everyday modern clothing for their occupation',
    lighting: 'bright natural light'
  },
  contemporary: { 
    background: 'trendy urban location',
    aesthetic: 'current fashion trends matching their personality',
    lighting: 'warm cafe ambiance'
  },
  slice_of_life: { 
    background: 'cozy everyday environment',
    aesthetic: 'comfortable casual clothing for daily life',
    lighting: 'soft natural window light'
  },
  romance: { 
    background: 'romantic elegant setting',
    aesthetic: 'romantic attire - elegant, alluring, date-worthy',
    lighting: 'romantic soft golden hour'
  },
  urban_fantasy: { 
    background: 'modern city with hidden magical elements',
    aesthetic: 'modern clothing with subtle magical or supernatural hints',
    lighting: 'urban night with magical glow'
  },
};

// Origin-based clothing styles - PRIMARY fashion direction
const ORIGIN_CLOTHING_STYLES: Record<string, { traditional: string; modern: string; fusion: string }> = {
  // Asian origins
  'japanese': {
    traditional: 'kimono-inspired wrap silhouettes, obi belts, hakama pants, samue workwear',
    modern: 'Tokyo streetwear, minimalist Japanese cuts, layered asymmetric pieces',
    fusion: 'neo-kimono elements, haori-inspired jackets, Japanese punk fusion'
  },
  'chinese': {
    traditional: 'qipao elements, mandarin collars, changshan inspired, silk brocade patterns, knot buttons',
    modern: 'Shanghai fashion, Chinese streetwear, modern tangzhuang styling',
    fusion: 'contemporary hanfu elements, East-meets-West fusion cuts'
  },
  'korean': {
    traditional: 'hanbok-inspired silhouettes, jeogori collar styling, flowing skirt elements',
    modern: 'K-fashion layering, Seoul streetwear, oversized minimalism',
    fusion: 'modern hanbok fusion, Korean avant-garde cuts'
  },
  'indian': {
    traditional: 'kurta and churidar elements, sari draping influences, sherwanis, dupattas',
    modern: 'Mumbai fashion, Indo-Western fusion, contemporary Indian cuts',
    fusion: 'modern lehenga styling, Indo-punk fusion, festival-ready Indian fashion'
  },
  'thai': {
    traditional: 'sabai draping, Thai silk patterns, chut thai elements',
    modern: 'Bangkok fashion forward, tropical elegant cuts',
    fusion: 'modern Thai ceremonial fusion, Southeast Asian contemporary'
  },
  'vietnamese': {
    traditional: 'ao dai inspired long tunics, elegant flowing silhouettes',
    modern: 'Saigon chic, Vietnamese minimalist modern',
    fusion: 'contemporary ao dai elements, Viet-Western fusion'
  },
  // European origins
  'british': {
    traditional: 'Savile Row tailoring, tweed and wool, proper British cuts, waistcoats',
    modern: 'London streetwear, British punk influence, mod styling',
    fusion: 'neo-Victorian elements, British avant-garde'
  },
  'french': {
    traditional: 'Parisian haute couture influences, elegant draped silhouettes, chic tailoring',
    modern: 'French effortless style, Parisian casual elegance',
    fusion: 'contemporary French fashion, artsy Parisian cuts'
  },
  'italian': {
    traditional: 'Milanese tailoring, Mediterranean elegance, quality Italian craftsmanship',
    modern: 'Italian street style, bold Mediterranean fashion',
    fusion: 'Italian designer fusion, contemporary Roman elegance'
  },
  'german': {
    traditional: 'dirndl or lederhosen elements, Bavarian influences, precision tailoring',
    modern: 'Berlin industrial fashion, German minimalist design',
    fusion: 'Germanic futuristic cuts, industrial-meets-elegant'
  },
  'spanish': {
    traditional: 'flamenco-inspired elements, Iberian dramatic flair, matador touches',
    modern: 'Barcelona fashion forward, Spanish contemporary',
    fusion: 'modern Spanish passion, flamenco-punk fusion'
  },
  'russian': {
    traditional: 'fur-trimmed elegance, ornate Russian patterns, kosovorotka elements',
    modern: 'Moscow high fashion, Russian avant-garde',
    fusion: 'neo-Russian imperial elements, Slavic futurism'
  },
  'scandinavian': {
    traditional: 'Viking-inspired elements, runic patterns, Nordic folk motifs',
    modern: 'Scandi minimalism, hygge cozy fashion, Nordic functional design',
    fusion: 'Norse futurism, Scandinavian tech-wear'
  },
  'irish': {
    traditional: 'Celtic knot patterns, Aran knit elements, Irish wool crafts',
    modern: 'Dublin contemporary, Irish casual elegance',
    fusion: 'Celtic-punk fusion, modern Gaelic styling'
  },
  'scottish': {
    traditional: 'tartan patterns, kilt-inspired elements, Highland dress touches',
    modern: 'Edinburgh fashion, Scottish contemporary',
    fusion: 'modern tartan fusion, Scottish punk heritage'
  },
  'greek': {
    traditional: 'Grecian draping, chiton-inspired silhouettes, classical elegance',
    modern: 'Athens fashion, Mediterranean island style',
    fusion: 'neo-Hellenic fashion, modern goddess styling'
  },
  // American origins
  'american': {
    traditional: 'denim heritage, workwear Americana, Western influences',
    modern: 'NYC streetwear, LA casual, American contemporary',
    fusion: 'neo-Americana, US avant-garde fusion'
  },
  'mexican': {
    traditional: 'embroidered huipil elements, charro influences, vibrant Oaxacan patterns',
    modern: 'Mexico City fashion, contemporary Mexican design',
    fusion: 'modern Mexican folk fusion, Dia de los Muertos inspired'
  },
  'brazilian': {
    traditional: 'carnival-inspired elements, capoeira influences, indigenous patterns',
    modern: 'Rio fashion, Brazilian beach-to-street style',
    fusion: 'tropical avant-garde, Brazilian contemporary fusion'
  },
  'caribbean': {
    traditional: 'island patterns, reggae influences, tropical folk elements',
    modern: 'Caribbean island contemporary, tropical urban',
    fusion: 'Caribbean diaspora fusion, island-meets-city'
  },
  // African origins
  'african': {
    traditional: 'kente cloth patterns, ankara prints, dashiki styling, African textiles',
    modern: 'Afropolitan fashion, Lagos streetwear, Johannesburg contemporary',
    fusion: 'Afrofuturism fashion, pan-African modern fusion'
  },
  'nigerian': {
    traditional: 'agbada robes, iro and buba, gele headwrap influences, Yoruba patterns',
    modern: 'Nigerian pop culture fashion, Lagos high fashion',
    fusion: 'modern Nigerian traditional fusion, Naija contemporary'
  },
  'egyptian': {
    traditional: 'ancient Egyptian motifs, pharaonic elegance, lotus and scarab patterns',
    modern: 'Cairo contemporary, Egyptian modern style',
    fusion: 'neo-Egyptian fashion, pyramids-meet-future'
  },
  'moroccan': {
    traditional: 'caftan elegance, djellaba influences, Berber patterns, zellige motifs',
    modern: 'Marrakech fashion, Moroccan bohemian',
    fusion: 'North African fusion, Moroccan-global hybrid'
  },
  'ethiopian': {
    traditional: 'habesha kemis embroidery, Ethiopian cross patterns, shamma draping',
    modern: 'Addis Ababa contemporary, Ethiopian modern',
    fusion: 'Ethiopian diaspora fashion, East African fusion'
  },
  // Middle Eastern origins
  'arabian': {
    traditional: 'thobe elegance, abaya styling, keffiyeh elements, intricate gold embroidery',
    modern: 'Dubai high fashion, Gulf contemporary luxury',
    fusion: 'modern Arabian nights, Middle Eastern futurism'
  },
  'persian': {
    traditional: 'Persian carpet patterns, Iranian royal motifs, Qajar-inspired elegance',
    modern: 'Tehran contemporary, Iranian diaspora fashion',
    fusion: 'neo-Persian luxury, Iranian avant-garde'
  },
  'turkish': {
    traditional: 'Ottoman-inspired elegance, Turkish embroidery, kaftan elements',
    modern: 'Istanbul fashion, Turkish contemporary',
    fusion: 'neo-Ottoman fusion, Anatolian modern'
  },
  'israeli': {
    traditional: 'Mediterranean influences, Middle Eastern heritage elements',
    modern: 'Tel Aviv fashion, Israeli casual chic, desert modern',
    fusion: 'Israeli-global fusion, Mediterranean contemporary'
  },
  // Other
  'australian': {
    traditional: 'outback rugged wear, bush ranger influences, Aboriginal dot patterns',
    modern: 'Sydney fashion, Australian surf-meets-city',
    fusion: 'Australian contemporary fusion, down-under avant-garde'
  },
  'polynesian': {
    traditional: 'tapa cloth patterns, tribal tattoo-inspired prints, island florals',
    modern: 'Pacific Island contemporary, Hawaiian fashion',
    fusion: 'Polynesian futurism, island warrior modern'
  },
  'native american': {
    traditional: 'indigenous beadwork, fringe elements, tribal patterns, natural materials',
    modern: 'Native contemporary, indigenous streetwear',
    fusion: 'Native futurism, First Nations avant-garde'
  },
};

// Get origin-based clothing style
function getOriginClothingStyle(nationality?: string, ethnicity?: string, origin?: string): string {
  const searchStr = (nationality || ethnicity || origin || '').toLowerCase();
  
  for (const [key, styles] of Object.entries(ORIGIN_CLOTHING_STYLES)) {
    if (searchStr.includes(key)) {
      // Randomly pick traditional, modern, or fusion for variety
      const styleType = ['traditional', 'modern', 'fusion'][Math.floor(Math.random() * 3)] as keyof typeof styles;
      return styles[styleType];
    }
  }
  return '';
}

// Build clothing description: user additionals SUPERSEDE all else, then origin drives style, genre provides context
function buildClothingDescription(
  genreAesthetic: string,
  characterClass?: string,
  originClothingStyle?: string, 
  userAdditionals?: string
): string {
  // User additionals completely override everything else
  if (userAdditionals && userAdditionals.trim()) {
    return `EXACTLY AS SPECIFIED: ${userAdditionals} (ignore other clothing suggestions, user has specified the outfit)`;
  }
  
  const parts: string[] = [];
  
  // Origin-based clothing is PRIMARY style driver for diversity
  if (originClothingStyle) {
    parts.push(`unique outfit featuring ${originClothingStyle}`);
    // Add genre context as secondary influence
    parts.push(`adapted for ${genreAesthetic.replace(/clothing|attire|fashion/gi, 'setting').trim()}`);
  } else {
    // No origin specified - use genre aesthetic directly
    parts.push(genreAesthetic);
  }
  
  // Character role adds functional elements
  if (characterClass) {
    parts.push(`with practical elements for a ${characterClass} role`);
  }
  
  // Encourage creativity
  parts.push('creative unique design, avoid generic outfits');
  
  return parts.join(', ');
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
  
  // Build clothing: origin drives style, genre provides context, user additionals supersede all
  const originClothingStyle = getOriginClothingStyle(nationality, ethnicity, origin);
  const clothingDesc = buildClothingDescription(style.aesthetic, characterClass, originClothingStyle, userDesc);
  
  console.log('Genre aesthetic:', style.aesthetic);
  console.log('Origin clothing style:', originClothingStyle);
  console.log('Final clothing direction:', clothingDesc);
  
  // Maximum creative freedom - minimal constraints, let AI interpret freely
  const prompt = `${character}, ${clothingDesc}, ${style.background}, ${style.lighting}`;
  
  console.log('Final prompt:', prompt);
  console.log('Character class for costume:', characterClass);
  
  return {
    prompt,
    negative: 'blurry, watermark, text',
  };
}

async function generateImage(prompt: string, negative: string): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) throw new Error("TOGETHER_API_KEY not configured");

  console.log("Generating portrait with Together.ai (FLUX.1-schnell)");
  console.log("Prompt:", prompt.substring(0, 200) + "...");

  const response = await fetch("https://api.together.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-schnell",
      prompt: prompt,
      negative_prompt: negative,
      width: 832,
      height: 1216,
      steps: 4,
      n: 1,
      response_format: "b64_json"
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Together.ai error:", response.status, error);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    throw new Error(`Generation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const b64Data = data.data?.[0]?.b64_json;
  
  if (!b64Data) {
    console.error("No image in response:", JSON.stringify(data));
    throw new Error("No image returned from Together.ai");
  }

  // Return as base64 data URL
  return `data:image/png;base64,${b64Data}`;
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
