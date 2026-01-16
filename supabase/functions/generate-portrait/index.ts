import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STYLE LOCK - Realistic art style with texture fidelity
// ============================================================================
const STYLE_LOCK = `highly detailed digital portrait, realistic art style, visible fabric weave, metal micro-scratches, leather grain, skin texture kept tasteful and natural, cinematic lighting with soft key light and subtle rim light, 50mm camera look, eye-level, slight depth of field, sharp face and eyes, clean composition, professional character key art, no text, no watermark`;

// ============================================================================
// PROMPT PRIORITY - AI must follow these rules exactly
// ============================================================================
const PROMPT_RULES = `IMPORTANT: Follow this prompt exactly as written. Build the character from the base description first, then apply all enhancement details. Do not deviate from specified features. Do not add elements not described. Match every detail precisely.`;

// ============================================================================
// HARD LOCK - Appended to every prompt
// ============================================================================
const HARD_LOCK = `do not add new piercings locations, do not add new tattoos placement, do not add new scars, do not add new body modifications, do not add new weapons, do not add new props`;

// ============================================================================
// GENDER CUT OPTIONS - Tailored silhouettes by gender
// ============================================================================
const CUT_OPTIONS: Record<string, string> = {
  female: 'tailored silhouette with fitted waist options, structured shoulders, layered techwear or practical garments, coverage is functional not revealing',
  male: 'tailored silhouette with structured shoulders, fitted or relaxed utility cuts, layered techwear or practical garments, coverage is functional not revealing',
  other: 'tailored silhouette with structured shoulders, versatile fitted cuts, layered techwear or practical garments, coverage is functional not revealing',
};

// ============================================================================
// GENRE STYLING MODULES - Immersive genre-specific details
// ============================================================================
interface GenreStyle {
  background: string;
  clothing: string;
  jewelry: string;
  makeup: string;
  tattooStyle: string;
}

const GENRE_STYLES: Record<string, GenreStyle> = {
  // 🏰 FANTASY
  fantasy: {
    background: 'ancient forest clearing with mystical fog and standing stones',
    clothing: 'layered travel wear: gambeson or jerkin, cloaklet or shawl, belt pouches, bracers, worn leather and wool, hand stitching, practical boots',
    jewelry: 'artisan hammered silver jewelry, small gem studs, subtle chain from helix to lobe',
    makeup: 'minimal and weathered, soft kohl, wind-chapped lips, natural flush',
    tattooStyle: 'old-world ink language: knotwork, runes, botanical sigils, charcoal-faded, aged appearance',
  },
  medieval: {
    background: 'torch-lit stone castle halls with tapestries and heraldic banners',
    clothing: 'layered travel wear: gambeson or jerkin, cloaklet or shawl, belt pouches, bracers, worn leather and wool, hand stitching, practical boots',
    jewelry: 'artisan hammered silver jewelry, small gem studs, subtle chain from helix to lobe',
    makeup: 'minimal and weathered, soft kohl, wind-chapped lips, natural flush',
    tattooStyle: 'old-world ink language: knotwork, runes, botanical sigils, charcoal-faded, aged appearance',
  },
  dark_fantasy: {
    background: 'cursed gothic realm with twisted spires and blood-red sky',
    clothing: 'layered dark travel wear: reinforced gambeson, hooded cloak, belt pouches, spiked bracers, dark leather and wool, practical boots',
    jewelry: 'oxidized silver jewelry with occult motifs, small onyx studs, thorn-shaped chain details',
    makeup: 'moody and dramatic, smoky eyes, deeper lip stain, pallor undertone',
    tattooStyle: 'old-world ink language: sigils, thorns, moths, occult geometry, elegant not messy',
  },
  high_fantasy: {
    background: 'crystalline magical citadel floating among clouds',
    clothing: 'magnificent enchanted robes with glowing sigils, elven-crafted layered garments, royal magical vestments with practical design',
    jewelry: 'enchanted silver and mithril jewelry, small crystalline studs, delicate arcane chains',
    makeup: 'ethereal and luminous, subtle shimmer, soft natural colors',
    tattooStyle: 'magical ink language: arcane runes, starlight patterns, glowing sigils, mystical symbols',
  },

  // 🚀 SCI-FI
  scifi: {
    background: 'sleek starship bridge with holographic displays and viewport to stars',
    clothing: 'clean utility suit or jumpsuit, modular panels, magnetic seams, smart-fabric texture, compact harness straps, geometric lines',
    jewelry: 'ceramic and titanium minimal jewelry, micro-LED pinpoints very subtle',
    makeup: 'future clean: matte finish, precise liner, subtle highlight, sharp grooming',
    tattooStyle: 'crisp data-geometry: hex-grid fades, circuit filigree, barcode-like linework, no readable text',
  },
  sci_fi: {
    background: 'advanced space station with panoramic view of nebula',
    clothing: 'clean utility suit or jumpsuit, modular panels, magnetic seams, smart-fabric texture, compact harness straps, geometric lines',
    jewelry: 'ceramic and titanium minimal jewelry, micro-LED pinpoints very subtle',
    makeup: 'future clean: matte finish, precise liner, subtle highlight, sharp grooming',
    tattooStyle: 'crisp data-geometry: hex-grid fades, circuit filigree, barcode-like linework, no readable text',
  },
  space_opera: {
    background: 'grand imperial starship throne room with galactic map hologram',
    clothing: 'dramatic flowing cape over fitted space uniform, ceremonial jumpsuit with medals, regal cosmic attire with modular panels',
    jewelry: 'polished titanium with gem inlays, status insignia pins, rank chains',
    makeup: 'refined and commanding: defined features, subtle power highlight',
    tattooStyle: 'cosmic ink: constellation maps, nebula patterns, galactic symbols, metallic ink accents',
  },

  // ☠️ HORROR (cinematic, no gore)
  horror: {
    background: 'abandoned asylum corridor with flickering lights and peeling walls',
    clothing: 'long coat or layered dark outfit, distressed textures, asymmetry, rain sheen, heavy fabric drape',
    jewelry: 'oxidized metal jewelry, small thorn motifs, subtle chains',
    makeup: 'moody: smoky eyes, deeper lip stain, under-eye shadow, pallor tone',
    tattooStyle: 'fine sigils, moths, thorns, occult geometry, elegant not messy',
  },
  vampire: {
    background: 'opulent Victorian manor with velvet drapes and candlelit shadows',
    clothing: 'aristocratic gothic layered outfit, high collar elements, ornate waistcoat details, antique elegant formal wear',
    jewelry: 'antique silver with blood-red gems, delicate filigree, cameo pieces',
    makeup: 'pale ethereal: porcelain finish, dramatic eyes, deep rich lips',
    tattooStyle: 'Victorian occult: roses, thorns, memento mori symbols, elegant linework',
  },
  zombie: {
    background: 'barricaded safe house with boarded windows and emergency supplies',
    clothing: 'post-outbreak tactical layers, cargo pants, combat boots, improvised protective gear, practical survivalist outfit',
    jewelry: 'minimal functional pieces, worn dog tags, simple studs',
    makeup: 'survival weathered: dirt smudges, stress lines, minimal',
    tattooStyle: 'faded pre-outbreak ink, worn over time, cracked appearance',
  },

  // 🕵️ MYSTERY (noir)
  mystery: {
    background: 'rain-slicked city alley at night with neon reflections in puddles',
    clothing: 'tailored coat, turtleneck or blouse or shirt, gloves optional, wool and tweed and leather accents, rainy city vibe',
    jewelry: 'refined minimal metal jewelry, small hoops and studs',
    makeup: 'classic noir: clean brows, subtle contour, sharp grooming',
    tattooStyle: 'mostly concealed, visible parts are fine-line, tasteful, clean black ink',
  },
  noir: {
    background: 'smoke-filled 1940s detective office with venetian blind shadows',
    clothing: 'tailored coat, turtleneck or blouse or shirt, gloves optional, wool and tweed and leather accents, rainy city vibe',
    jewelry: 'refined minimal metal jewelry, small hoops and studs',
    makeup: 'classic noir: clean brows, subtle contour, sharp grooming',
    tattooStyle: 'mostly concealed, visible parts are fine-line, tasteful, clean black ink',
  },

  // 🏴‍☠️ PIRATE
  pirate: {
    background: 'deck of a galleon at sea with sails billowing and golden sunset',
    clothing: 'linen shirt, waistcoat or vest, sash belt, worn buckles, leather straps, salt-stained fabric, weathered edges',
    jewelry: 'nautical motifs jewelry, coin charm, rope-knot shaped pieces',
    makeup: 'sun-worn minimal, salt-and-wind weathering, natural tan',
    tattooStyle: 'sailor ink language: swallows, compass rose, waves, daggers, aged ink',
  },

  // 🤠 WESTERN
  western: {
    background: 'dusty frontier town at high noon with saloon and hitching posts',
    clothing: 'duster or fitted jacket, work shirt, leather belt rig, bandana optional, suede textures, dust on hems, rivets',
    jewelry: 'simple studs and hoops, matte metal jewelry',
    makeup: 'practical sun-kissed, rugged natural weathering',
    tattooStyle: 'Americana linework: roses, horseshoe, barbed wire, faded ink',
  },

  // ⚡ CYBERPUNK
  cyberpunk: {
    background: 'rain-soaked neon megacity with holographic advertisements and towering skyscrapers',
    clothing: 'techwear layers, modular straps, matte polymers, subtle neon accent seams, rain reflections, urban grime',
    jewelry: 'industrial titanium jewelry, geometric shapes, micro LEDs very tiny',
    makeup: 'sharper: metallic liner, defined brows, glossy highlight',
    tattooStyle: 'high-contrast blackwork with geometric florals, circuitry framing, no words',
  },

  // ☢️ POST-APOCALYPTIC
  postapoc: {
    background: 'nuclear wasteland with rusted vehicles and collapsed overpasses',
    clothing: 'scavenged layered protection, patchwork plates, stitched repairs, grime, dust, improvised padding, believable materials',
    jewelry: 'mismatched but safe jewelry, worn metals, nothing huge',
    makeup: 'minimal survival: dirt smudges, sunburn tint, glare-reduction kohl',
    tattooStyle: 'faded and cracked ink, worn over time, weathered appearance',
  },
  post_apocalyptic: {
    background: 'overgrown city ruins reclaimed by nature with collapsed buildings',
    clothing: 'scavenged layered protection, patchwork plates, stitched repairs, grime, dust, improvised padding, believable materials',
    jewelry: 'mismatched but safe jewelry, worn metals, nothing huge',
    makeup: 'minimal survival: dirt smudges, sunburn tint, glare-reduction kohl',
    tattooStyle: 'faded and cracked ink, worn over time, weathered appearance',
  },

  // ⚔️ WAR (modern tactical)
  war: {
    background: 'forward operating base with military equipment and tactical vehicles',
    clothing: 'muted tactical uniform elements, plate-carrier style vest, utility belt, reinforced seams, gloves implied, no logos, no flags, no text',
    jewelry: 'low-profile matte studs and rings',
    makeup: 'almost none, functional anti-glare smudge, clean practical grooming',
    tattooStyle: 'realistic service-style shapes, abstract military motifs, no unit text, muted ink',
  },
  ww2: {
    background: 'war-torn European battlefield with trenches and smoke',
    clothing: 'authentic WWII era military uniform elements, combat webbing, period-accurate practical attire',
    jewelry: 'minimal dog tags, simple period-appropriate pieces',
    makeup: 'battle-worn, minimal, weathered',
    tattooStyle: 'period-appropriate military ink, classic designs, aged appearance',
  },

  // 🏙️ MODERN LIFE
  modern: {
    background: 'sleek modern city with glass skyscrapers and clean streets',
    clothing: 'contemporary street fashion, clean layers, neutral palette, tasteful accessories, believable fabrics',
    jewelry: 'trendy minimal metal jewelry',
    makeup: 'natural everyday, clean grooming, subtle skin tone evenness',
    tattooStyle: 'modern fine-line minimalism, abstract lines, small geometric accents',
  },
  modern_life: {
    background: 'trendy urban cafe or stylish apartment interior',
    clothing: 'contemporary street fashion, clean layers, neutral palette, tasteful accessories, believable fabrics',
    jewelry: 'trendy minimal metal jewelry',
    makeup: 'natural everyday, clean grooming, subtle skin tone evenness',
    tattooStyle: 'modern fine-line minimalism, abstract lines, small geometric accents',
  },
  contemporary: {
    background: 'fashionable city district with modern architecture',
    clothing: 'contemporary street fashion, clean layers, neutral palette, tasteful accessories, believable fabrics',
    jewelry: 'trendy minimal metal jewelry',
    makeup: 'natural everyday, clean grooming, subtle skin tone evenness',
    tattooStyle: 'modern fine-line minimalism, abstract lines, small geometric accents',
  },
  slice_of_life: {
    background: 'warm cozy home interior with personal touches',
    clothing: 'comfortable authentic casual wear, loungewear, favorite outfit style, personal and real',
    jewelry: 'personal meaningful pieces, simple everyday jewelry',
    makeup: 'natural relaxed, minimal effort, authentic',
    tattooStyle: 'modern fine-line minimalism, personal meaningful designs',
  },
  romance: {
    background: 'sunset rooftop terrace with city lights below',
    clothing: 'stunning date night attire, elegant tailored outfit, alluring and sophisticated',
    jewelry: 'elegant refined pieces, subtle sparkle',
    makeup: 'polished and attractive, enhanced natural beauty',
    tattooStyle: 'elegant fine-line, romantic motifs, tasteful placement',
  },

  // SPECIAL GENRES
  spy: {
    background: 'Monte Carlo casino with chandeliers and high-stakes atmosphere',
    clothing: 'immaculately tailored formal wear, concealed tactical elements, luxury accessories, deadly elegance',
    jewelry: 'luxury watch, elegant minimal jewelry',
    makeup: 'flawless polished, sophisticated, commanding',
    tattooStyle: 'concealed or none visible, if visible very refined',
  },
  crime: {
    background: 'gritty inner-city street corner at night with graffiti walls',
    clothing: 'expensive streetwear layers, designer elements, intimidating street boss attire',
    jewelry: 'gold chains, statement rings, status pieces',
    makeup: 'sharp and intimidating, power presence',
    tattooStyle: 'bold street ink, gang-neutral abstract patterns, statement pieces',
  },
  superhero: {
    background: 'dramatic city rooftop with lightning storm',
    clothing: 'iconic hero costume with bold colors, cape elements, emblem design, powerful heroic silhouette',
    jewelry: 'hero insignia pieces, power symbols',
    makeup: 'dramatic and iconic, mask-ready features',
    tattooStyle: 'power symbols, hero motifs, bold iconic designs',
  },
  urban_fantasy: {
    background: 'modern city alley with magical graffiti glowing softly',
    clothing: 'street clothes with hidden magical artifacts, enchanted accessories, tattoos that shimmer with subtle power',
    jewelry: 'enchanted modern jewelry, hidden magical pieces',
    makeup: 'modern with subtle magical shimmer',
    tattooStyle: 'magical modern ink, glowing sigil accents, contemporary mystical',
  },
  steampunk: {
    background: 'brass-and-copper workshop filled with whirring clockwork machines',
    clothing: 'leather corset or vest with brass buckles, aviator goggles, mechanical accessories, pocket watch chains, cog-adorned elements',
    jewelry: 'brass and copper gear motifs, clock parts, chain details',
    makeup: 'Victorian industrial, oil smudges optional, period-inspired',
    tattooStyle: 'clockwork designs, gear patterns, Victorian industrial motifs',
  },
  victorian: {
    background: 'fog-shrouded London street with gas lamps and cobblestones',
    clothing: 'impeccable Victorian formal layered wear, top hat elements, tailored coat, cravat, walking cane implied, period-perfect attire',
    jewelry: 'antique filigree, cameos, mourning jewelry',
    makeup: 'period-appropriate subtle, natural Victorian aesthetic',
    tattooStyle: 'Victorian traditional, roses, swallows, script-free classic designs',
  },
};

// ============================================================================
// BUILD PROMPT FUNCTION
// ============================================================================
function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, skinTone,
    hairColor, hairStyle, eyeColor,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, nationality, ethnicity, origin,
    tattoos, piercings, scars, implants, prosthetics, mutations,
    bustSize, hipWidth,
  } = body;

  const parts: string[] = [];
  
  // ========== CHARACTER LOCK: Same identity every image ==========
  const charAge = age || 25;
  const eth = ethnicity || nationality || origin || '';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  
  // Subject line
  parts.push(`adult ${genderWord}, standing portrait, knees-to-head crop, centered, facing camera, neutral confident stance`);
  
  // Core identity that never changes
  parts.push(`${charAge} year old ${eth} ${genderWord}`.trim());
  
  // Face structure and features (LOCKED - never changes)
  if (eyeColor) parts.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) {
    parts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  }
  if (skinTone) parts.push(`${skinTone} skin tone`);
  if (build) parts.push(`${build} build`);
  
  // Body proportions (LOCKED - never changes)
  if (gender === 'female' || gender === 'other') {
    if (bustSize) parts.push(`${bustSize} bust`);
    if (hipWidth) parts.push(`${hipWidth} hips`);
  }
  
  // Modification PLACEMENTS (LOCKED - only style changes)
  if (scars?.length) {
    const scarPlacements = Array.isArray(scars) ? scars.map((s: any) => typeof s === 'string' ? s : s.location).join(', ') : 'visible scars';
    parts.push(`scars at ${scarPlacements}`);
  }
  if (piercings?.length) {
    const piercingPlacements = Array.isArray(piercings) ? piercings.map((p: any) => typeof p === 'string' ? p : p.location).join(', ') : 'piercings';
    parts.push(`piercings at ${piercingPlacements}`);
  }
  if (tattoos?.length) {
    const tattooPlacements = Array.isArray(tattoos) ? tattoos.map((t: any) => typeof t === 'string' ? t : t.location).join(', ') : 'tattoos';
    parts.push(`tattoos at ${tattooPlacements}`);
  }
  if (implants?.length) parts.push('visible cybernetic implants');
  if (prosthetics?.length) parts.push('prosthetic limbs');
  if (mutations?.length) parts.push('visible mutations');
  
  // Role/Class
  if (characterClass) parts.push(characterClass);
  
  // ========== GENDER CUT OPTION ==========
  const cutOption = CUT_OPTIONS[gender || 'other'] || CUT_OPTIONS.other;
  parts.push(cutOption);
  
  // ========== GENRE STYLING MODULE ==========
  const genreKey = (genre || 'modern').toLowerCase().replace(/[\s-]/g, '_');
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  // Apply genre-specific styling
  parts.push(style.clothing);
  parts.push(style.jewelry);
  parts.push(style.makeup);
  
  // Apply tattoo STYLE (not placement - that's locked)
  if (tattoos?.length) {
    parts.push(`tattoo aesthetic: ${style.tattooStyle}`);
  }
  
  // ========== USER ENHANCEMENT DETAILS (PRIORITY - BOLDED) ==========
  // This section takes priority for generative enhancements after base character
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';
  let enhancementBlock = '';
  if (userDesc) {
    enhancementBlock = `[PRIORITY ENHANCEMENT DETAILS - MUST FOLLOW EXACTLY: ${userDesc}]`;
  }
  
  // ========== ASSEMBLE FINAL PROMPT ==========
  const character = parts.join(', ');
  
  // Structure: Rules -> Base Character -> Genre Style -> User Enhancements -> Art Style -> Hard Lock
  const promptParts = [
    PROMPT_RULES,
    `BASE CHARACTER: ${character}`,
    `SCENE: ${style.background}`,
  ];
  
  // Add user enhancements with priority if present
  if (enhancementBlock) {
    promptParts.push(enhancementBlock);
  }
  
  promptParts.push(`ART STYLE: ${STYLE_LOCK}`);
  promptParts.push(`RESTRICTIONS: ${HARD_LOCK}`);
  
  const prompt = promptParts.join('. ');
  
  console.log('Portrait prompt:', prompt);
  
  return {
    prompt,
    negative: 'blurry, watermark, text, low quality, amateur, deformed, bad anatomy, extra limbs, missing limbs, floating limbs, disconnected limbs, mutation, mutated, ugly, disgusting, bad proportions, gross proportions, malformed, poorly drawn, bad hands, missing fingers, extra fingers, fused fingers, too many fingers, long neck, username, signature, words, letters, nsfw, nude, naked, topless, exposed chest, lingerie, underwear, bra, panties',
  };
}

// ============================================================================
// IMAGE GENERATION
// ============================================================================
async function generateImage(prompt: string, negative: string): Promise<string> {
  const apiKey = Deno.env.get("TOGETHER_API_KEY");
  if (!apiKey) throw new Error("TOGETHER_API_KEY not configured");

  console.log("Generating portrait with Together.ai (FLUX.1-dev)");

  const response = await fetch("https://api.together.ai/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "black-forest-labs/FLUX.1-dev",
      prompt: prompt,
      negative_prompt: negative,
      width: 832,
      height: 1216,
      steps: 34,
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

  return `data:image/png;base64,${b64Data}`;
}

// ============================================================================
// SERVER
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Custom prompt mode
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
