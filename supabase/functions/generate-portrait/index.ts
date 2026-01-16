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

// Build clothing description: let AI be creative within genre + role + origin + user additionals
function buildClothingDescription(
  genreAesthetic: string,
  characterClass?: string,
  originModifier?: string, 
  userAdditionals?: string
): string {
  const parts: string[] = [];
  
  // User additionals come first (highest priority)
  if (userAdditionals && userAdditionals.trim()) {
    parts.push(userAdditionals);
  }
  
  // Character role/class guides the outfit
  if (characterClass) {
    parts.push(`clothing appropriate for a ${characterClass}`);
  }
  
  // Genre aesthetic provides the style direction
  parts.push(genreAesthetic);
  
  // Cultural origin influences the design
  if (originModifier) {
    parts.push(originModifier);
  }
  
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
  
  // Build clothing: genre aesthetic + character role + origin + user additionals (AI is creative)
  const originModifier = getOriginModifier(nationality, ethnicity);
  const clothingDesc = buildClothingDescription(style.aesthetic, characterClass, originModifier, userDesc);
  
  console.log('Genre aesthetic:', style.aesthetic);
  console.log('Origin modifier:', originModifier);
  console.log('Final clothing direction:', clothingDesc);
  
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
