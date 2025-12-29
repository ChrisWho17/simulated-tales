import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SceneImageRequest {
  sceneDescription: string;
  recentStory?: string[];
  playerAction?: string;
  style?: string;
  mood?: string;
  era?: string;
  location?: string;
}

// Genre-specific style descriptions for scene illustrations
const SCENE_GENRE_STYLES: Record<string, { style: string; atmosphere: string }> = {
  fantasy: {
    style: 'high fantasy oil painting, ethereal lighting, magical atmosphere',
    atmosphere: 'mystical forests, ancient castles, glowing runes, enchanted landscapes'
  },
  medieval: {
    style: 'medieval illuminated manuscript style, rich textures, period-accurate details',
    atmosphere: 'stone castles, village squares, countryside, torchlit halls'
  },
  cyberpunk: {
    style: 'neon-noir cyberpunk, rain-slicked streets, holographic advertisements',
    atmosphere: 'towering megastructures, dark alleys, neon signs, technological decay'
  },
  scifi: {
    style: 'hard science fiction, clean futuristic design, space opera grandeur',
    atmosphere: 'starships, alien worlds, space stations, advanced technology'
  },
  postapoc: {
    style: 'post-apocalyptic wasteland, muted colors, survival aesthetic',
    atmosphere: 'ruined cities, overgrown highways, makeshift settlements, dust storms'
  },
  modern: {
    style: 'contemporary photorealistic, urban photography style',
    atmosphere: 'city streets, modern interiors, everyday locations, natural lighting'
  },
  war: {
    style: 'war photography aesthetic, gritty realism, dramatic shadows, battlefield chaos',
    atmosphere: 'battlefields, military vehicles, explosions, smoke and debris, soldiers'
  },
  ww2: {
    style: 'World War 2 era, period-accurate military equipment, sepia undertones, war documentary',
    atmosphere: '1940s battlefields, tanks, bunkers, wartorn Europe, military combat, period weapons'
  },
  horror: {
    style: 'dark horror atmosphere, unsettling shadows, Gothic elements',
    atmosphere: 'abandoned buildings, fog-shrouded forests, creepy interiors, ominous lighting'
  },
  western: {
    style: 'classic Western cinematography, golden hour lighting, dust-filled air',
    atmosphere: 'frontier towns, desert landscapes, saloons, mountain vistas'
  },
  noir: {
    style: 'film noir style, high contrast, dramatic shadows, venetian blind lighting',
    atmosphere: 'rain-soaked streets, dimly lit offices, jazz clubs, urban nightscapes'
  },
  mystery: {
    style: 'atmospheric mystery, moody lighting, subtle tension',
    atmosphere: 'crime scenes, old mansions, foggy streets, dimly lit interiors'
  },
  pirate: {
    style: 'golden age of piracy, seafaring adventure, weathered textures',
    atmosphere: 'tall ships, tropical islands, port towns, stormy seas'
  },
  survival: {
    style: 'survival thriller aesthetic, raw natural environments',
    atmosphere: 'wilderness, extreme weather, makeshift camps, desolate landscapes'
  },
  steampunk: {
    style: 'Victorian steampunk, brass and copper tones, mechanical details',
    atmosphere: 'airships, clockwork machinery, fog-filled streets, industrial interiors'
  },
  apocalypse: {
    style: 'apocalyptic devastation, dramatic skies, destruction aesthetic',
    atmosphere: 'collapsed buildings, fires, chaos, dramatic weather phenomena'
  },
  vampire: {
    style: 'Gothic vampire aesthetic, romantic darkness, rich deep colors',
    atmosphere: 'Gothic architecture, moonlit scenes, opulent decay, candlelit interiors'
  },
  zombie: {
    style: 'zombie apocalypse, desaturated colors, urban decay',
    atmosphere: 'abandoned cities, barricaded buildings, eerie silence, survival scenarios'
  },
  superhero: {
    style: 'comic book inspired, dynamic composition, vibrant colors',
    atmosphere: 'city skylines, dramatic action scenes, heroic poses, destruction'
  },
  spy: {
    style: 'espionage thriller, sleek modern aesthetic, international intrigue',
    atmosphere: 'exotic locations, high-tech facilities, surveillance, urban sophistication'
  }
};

// Mood modifiers for scene generation
const MOOD_MODIFIERS: Record<string, string> = {
  dramatic: 'dramatic lighting, high contrast, intense atmosphere, emotional impact',
  atmospheric: 'moody ambiance, environmental storytelling, immersive depth',
  tense: 'suspenseful lighting, shadows, anticipation, danger lurking',
  peaceful: 'serene lighting, calm colors, tranquil environment',
  romantic: 'soft lighting, warm tones, intimate atmosphere',
  mysterious: 'fog, shadows, hidden details, enigmatic atmosphere',
  epic: 'grand scale, sweeping vistas, heroic composition',
  dark: 'low key lighting, oppressive shadows, ominous mood',
  hopeful: 'golden hour lighting, warm colors, uplifting composition',
  melancholic: 'muted colors, overcast, emotional weight, solitude',
  intense: 'action scene, explosive energy, dynamic angles, combat intensity',
  combat: 'battlefield chaos, weapons fire, destruction, military action'
};

// Use AI to extract the precise visual scene from story context
async function extractSceneWithAI(
  sceneDescription: string,
  recentStory: string[],
  playerAction: string | undefined,
  genre: string,
  era: string | undefined,
  location: string | undefined,
  apiKey: string
): Promise<string> {
  const storyContext = recentStory.slice(-5).join('\n\n');
  
  const prompt = `You are a scene description extractor for an AI image generator. Analyze the story context and extract the EXACT visual scene that should be illustrated.

GENRE: ${genre}
${era ? `ERA: ${era}` : ''}
${location ? `CURRENT LOCATION: ${location}` : ''}

RECENT STORY:
${storyContext}

${playerAction ? `PLAYER'S LATEST ACTION: ${playerAction}` : ''}

CURRENT SCENE TO ILLUSTRATE:
${sceneDescription}

TASK: Extract a precise, visual description of what is happening RIGHT NOW in this scene. Focus on:
1. The EXACT action taking place (combat, conversation, exploration, etc.)
2. Specific objects, vehicles, weapons being used (tanks, guns, swords, etc.)
3. The environment/setting where this is happening
4. Any characters visible and what they're doing
5. Weather, lighting, time of day

DO NOT describe generic fantasy/castle scenes unless that's actually in the story.
DO NOT add elements not present in the story.
BE SPECIFIC about military equipment, vehicles, weapons if mentioned.

Respond with ONLY a single paragraph (2-4 sentences) describing the exact visual scene. No explanations.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error('AI scene extraction failed:', response.status);
      return sceneDescription;
    }

    const data = await response.json();
    const extractedScene = data.choices?.[0]?.message?.content?.trim();
    
    if (extractedScene && extractedScene.length > 20) {
      console.log('AI extracted scene:', extractedScene.slice(0, 100) + '...');
      return extractedScene;
    }
    
    return sceneDescription;
  } catch (error) {
    console.error('AI scene extraction error:', error);
    return sceneDescription;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sceneDescription, 
      recentStory = [],
      playerAction,
      style = 'fantasy', 
      mood = 'atmospheric',
      era,
      location 
    } = await req.json() as SceneImageRequest;
    
    const TOGETHER_API_KEY = Deno.env.get('TOGETHER_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not configured');
    }

    // Use AI to extract the precise scene if we have context and API key
    let finalSceneDescription = sceneDescription;
    if (LOVABLE_API_KEY && (recentStory.length > 0 || playerAction)) {
      console.log('Using AI to analyze story context for scene extraction...');
      finalSceneDescription = await extractSceneWithAI(
        sceneDescription,
        recentStory,
        playerAction,
        style,
        era,
        location,
        LOVABLE_API_KEY
      );
    }

    // Get genre-specific style or fallback to fantasy
    const genreStyle = SCENE_GENRE_STYLES[style.toLowerCase()] || SCENE_GENRE_STYLES.fantasy;
    const moodModifier = MOOD_MODIFIERS[mood.toLowerCase()] || MOOD_MODIFIERS.atmospheric;

    // Build a detailed prompt for scene illustration
    const imagePrompt = `masterpiece, best quality, ultra detailed digital painting, cinematic scene illustration, wide landscape composition, ${genreStyle.style}, ${moodModifier}

Scene: ${finalSceneDescription}

Environment details: ${genreStyle.atmosphere}
${era ? `Historical era: ${era}` : ''}
${location ? `Location type: ${location}` : ''}

Style: highly detailed background art, concept art quality, professional illustration, volumetric lighting, atmospheric perspective, 16:9 aspect ratio composition, environmental storytelling, immersive scene, scenic vista, establishing shot quality

Negative: blurry, low quality, text, watermark, signature, UI elements, amateur, pixelated, wrong era, anachronistic elements`;

    console.log('Generating scene image with FLUX for style:', style, 'mood:', mood);
    console.log('Final scene description:', finalSceneDescription.slice(0, 150) + '...');
    console.log('Prompt preview:', imagePrompt.slice(0, 200) + '...');

    // Use 16:9 dimensions that are multiples of 32
    const width = 1408;
    const height = 800;
    
    const response = await fetch('https://api.together.xyz/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1.1-pro',
        prompt: imagePrompt,
        width,
        height,
        steps: 28,
        n: 1,
        response_format: 'url',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Together.AI API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded',
          imageUrl: null 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402 || response.status === 401) {
        console.log('API limit or auth issue, returning null gracefully');
        return new Response(JSON.stringify({ 
          error: 'API limit reached',
          imageUrl: null 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Image API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Together.AI scene generation response received');

    // Extract image URL from Together.AI response format
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      console.log('No image URL in response, returning null');
      return new Response(JSON.stringify({ imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Scene image generated successfully');
    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-scene-image:', error);
    return new Response(JSON.stringify({ 
      error: 'Unable to generate scene image at this time',
      imageUrl: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
