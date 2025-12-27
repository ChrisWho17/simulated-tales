import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Play, Loader2, CheckCircle, XCircle, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Weather sound definitions with 6 variations each
const WEATHER_SOUND_PROMPTS = {
  // RAIN SOUNDS
  rain_light: [
    'Light gentle rain falling on leaves and grass, soft pattering, peaceful ambient loop',
    'Soft drizzle on a window pane, gentle rain sounds, relaxing ambient',
    'Light spring rain in a garden, birds occasionally chirping, gentle patter',
    'Misty light rain on cobblestones, urban gentle precipitation',
    'Soft rain on a tent canvas, camping ambient, gentle drips',
    'Light rain in a forest, water droplets on foliage, serene nature',
  ],
  rain_medium: [
    'Steady moderate rain falling, consistent patter, ambient weather loop',
    'Medium rainfall on rooftops, urban rain ambience, steady precipitation',
    'Persistent rain in a city, puddles forming, moderate intensity',
    'Continuous rainfall on pavement, cars passing occasionally in distance',
    'Medium rain shower on windows, indoor perspective, cozy ambient',
    'Steady rain in the woods, water on leaves and branches',
  ],
  rain_heavy: [
    'Heavy torrential downpour, intense rain, powerful storm ambient',
    'Driving rain storm, heavy precipitation beating down, dramatic weather',
    'Monsoon-like heavy rain, flooding sounds, intense water',
    'Powerful rainstorm with heavy drops, water rushing, storm ambient',
    'Intense heavy rain on metal roof, loud pounding precipitation',
    'Torrential rain in the city, overwhelming water sounds, dramatic storm',
  ],
  rain_on_roof: [
    'Rain on tin roof, metallic patter, cozy indoor ambient',
    'Heavy rain on metal roofing, rhythmic drumming sound',
    'Raindrops on corrugated iron roof, rural ambient',
    'Storm rain on a shed roof, loud metallic pinging',
    'Light rain on slate tiles, gentle roof ambient',
    'Rain pattering on wooden cabin roof, cozy shelter sounds',
  ],
  rain_on_leaves: [
    'Rain falling on forest leaves, natural dripping, jungle ambient',
    'Raindrops on thick foliage, tropical rain forest sounds',
    'Water dripping from leaves to leaves, lush vegetation',
    'Rain in dense woods, drops on ferns and bushes',
    'Garden rain on large leaves, organic dripping sounds',
    'Rainforest precipitation, multiple layers of leaf sounds',
  ],

  // THUNDER SOUNDS
  thunder_distant: [
    'Distant rumbling thunder, far away storm, low rolling sound',
    'Thunder rolling across distant mountains, faraway storm',
    'Subtle distant thunder boom, storm on the horizon',
    'Low rumbling thunder in the distance, atmospheric',
    'Far away thunder crack and roll, distant storm approaching',
    'Horizon thunder, very distant storm sounds, atmospheric rumble',
  ],
  thunder_close: [
    'Close loud thunder crack, powerful boom, nearby lightning strike',
    'Explosive close thunder, sharp crack followed by rumble',
    'Very close lightning strike thunder, intense boom, frightening',
    'Overhead thunderclap, loud crashing sound, immediate storm',
    'Powerful thunder directly above, house-shaking boom',
    'Close lightning and thunder, sharp crack and deep rumble',
  ],

  // WIND SOUNDS
  wind_light: [
    'Gentle breeze through trees, soft wind, peaceful rustling',
    'Light wind in tall grass, meadow ambient, soft whooshing',
    'Soft breeze through leaves, subtle wind sounds',
    'Gentle wind across open field, quiet whooshing',
    'Light coastal breeze, soft wind from the sea',
    'Mild wind through garden, gentle movement of plants',
  ],
  wind_medium: [
    'Moderate wind blowing, steady gusts, tree movement',
    'Medium strength wind, consistent blowing, outdoor ambient',
    'Sustained wind through forest, branches swaying',
    'Steady wind across plains, constant airflow sound',
    'Medium wind around buildings, urban wind tunnel',
    'Persistent moderate wind, flags flapping, leaves blowing',
  ],
  wind_strong: [
    'Strong howling wind, powerful gusts, storm force',
    'Intense wind storm, aggressive blowing, dramatic weather',
    'Gale force wind, loud howling, dangerous conditions',
    'Powerful wind battering against structures, intense gusts',
    'Strong wind through narrow passages, whistling and howling',
    'Hurricane-like wind sounds, overwhelming force of nature',
  ],
  wind_howl: [
    'Eerie wind howling through mountains, spooky atmosphere',
    'Ghost-like wind howl, haunting atmospheric sound',
    'Wind whistling through abandoned building, creepy ambient',
    'Howling winter wind, desolate cold atmosphere',
    'Mournful wind sound, lonely howling in the night',
    'Supernatural wind howl, ethereal and unsettling',
  ],
  wind_gust: [
    'Sudden wind gust, brief powerful burst of air',
    'Sharp wind gust hitting, quick intense blast',
    'Unexpected gust of wind, sudden whoosh',
    'Quick powerful wind burst, things blowing around',
    'Strong sudden gust, papers flying sound',
    'Brief intense wind blast, surprising force',
  ],

  // STORM SOUNDS
  storm_wind: [
    'Violent storm wind, extreme weather, chaotic atmosphere',
    'Storm with heavy wind, turbulent conditions',
    'Fierce storm wind howling, trees bending, intense',
    'Full storm wind sounds, powerful and relentless',
    'Dramatic storm gusts, dangerous wind conditions',
    'Tempest wind sounds, overwhelming storm force',
  ],
  storm_rain: [
    'Storm rain with wind, heavy precipitation in chaos',
    'Rainstorm at peak intensity, wind and rain combined',
    'Violent rain during storm, splashing and rushing',
    'Full storm with driving rain, intense weather',
    'Storm downpour, rain being blown sideways',
    'Extreme storm rainfall, overwhelming precipitation',
  ],
  storm_ambient: [
    'Complete storm ambience, thunder rain wind combined',
    'Full thunderstorm atmosphere, all elements present',
    'Intense storm environment, immersive weather sounds',
    'Peak storm with all effects, dramatic atmosphere',
    'Comprehensive storm soundscape, powerful weather',
    'Ultimate storm ambient, nature at its most powerful',
  ],

  // SNOW SOUNDS
  snow_ambient: [
    'Quiet snowy atmosphere, muffled winter silence, peaceful cold',
    'Snow falling silently, winter quiet, serene atmosphere',
    'Still snowy night, quiet winter ambient, peaceful',
    'Hushed snowy landscape, winter calm, muted sounds',
    'Gentle snowfall atmosphere, quiet winter scene',
    'Peaceful snow ambient, soft winter stillness',
  ],
  snow_crunch: [
    'Footsteps crunching in deep snow, walking in winter',
    'Snow crunching underfoot, stepping through fresh powder',
    'Walking on icy snow, crisp crunching sounds',
    'Footfalls in thick snow, satisfying crunch',
    'Trudging through snow, deep crunching steps',
    'Fresh snow footstep crunch, winter walking sounds',
  ],

  // FOG SOUNDS
  fog_ambient: [
    'Eerie fog atmosphere, muffled distant sounds, mysterious ambient',
    'Dense fog soundscape, hushed and mysterious',
    'Foggy morning ambient, muted sounds, ethereal',
    'Thick mist atmosphere, sounds dampened, spooky quiet',
    'Fog-shrouded environment, muffled and haunting',
    'Mysterious foggy ambient, limited visibility sounds',
  ],

  // AMBIENCE - TIME OF DAY
  amb_birds_light: [
    'Daytime birds singing, cheerful chirping, sunny day ambient',
    'Various birds calling in the morning, nature sounds',
    'Light bird songs in a park, pleasant day ambient',
    'Songbirds in spring, melodic chirping, peaceful',
    'Birds singing in garden, relaxing nature sounds',
    'Cheerful bird chorus, sunny outdoor ambient',
  ],
  amb_breeze_light: [
    'Light daytime breeze, gentle outdoor wind, sunny ambient',
    'Soft air movement, pleasant breeze, calm day',
    'Gentle wind in sunshine, light and airy',
    'Mild breeze on a warm day, comfortable weather',
    'Soft outdoor breeze, trees gently moving',
    'Pleasant light wind, perfect weather ambient',
  ],
  amb_crickets: [
    'Night crickets chirping, summer evening ambient, peaceful',
    'Cricket chorus at night, warm evening sounds',
    'Crickets in the grass, nighttime nature ambient',
    'Summer night crickets, relaxing evening sounds',
    'Cricket sounds under stars, peaceful night ambient',
    'Warm night with crickets, outdoor evening atmosphere',
  ],
  amb_night_breeze: [
    'Cool night breeze, gentle evening wind, peaceful dark',
    'Soft wind at night, darkness ambient, quiet',
    'Nighttime gentle wind, calm evening atmosphere',
    'Cool evening breeze, quiet night ambient',
    'Night air moving softly, peaceful darkness',
    'Gentle night wind, serene evening sounds',
  ],
  amb_birds_dawn: [
    'Dawn chorus birds, early morning singing, sunrise ambient',
    'Birds waking at sunrise, beautiful morning sounds',
    'Early morning bird songs, dawn breaking',
    'Sunrise birds calling, new day beginning',
    'Dawn bird chorus, first light ambient',
    'Morning birds at daybreak, peaceful sunrise',
  ],
  amb_morning_breeze: [
    'Fresh morning breeze, dawn wind, crisp air ambient',
    'Early morning wind, cool and fresh, new day',
    'Sunrise breeze, morning freshness, awakening',
    'Dawn wind gently blowing, morning atmosphere',
    'Cool morning air movement, early day ambient',
    'Fresh breeze at sunrise, invigorating morning',
  ],
  amb_evening_birds: [
    'Evening birds settling, dusk calls, sunset ambient',
    'Twilight bird sounds, day ending, peaceful evening',
    'Birds at dusk, settling for night, sunset calls',
    'Evening bird chorus, day winding down',
    'Sunset bird songs, peaceful evening transition',
    'Dusk birds calling, nightfall approaching',
  ],
  amb_evening_breeze: [
    'Evening breeze, warm dusk wind, sunset ambient',
    'Twilight wind, cooling evening air, peaceful',
    'Dusk breeze blowing gently, day ending',
    'Warm evening wind, sunset atmosphere',
    'End of day breeze, relaxing twilight ambient',
    'Peaceful evening wind, warm and gentle',
  ],

  // HEAT WAVE
  heat_ambient: [
    'Hot summer day, cicadas buzzing, intense heat ambient',
    'Scorching heat waves, insects droning, oppressive warmth',
    'Sweltering heat sounds, buzzing insects, hot day',
    'Extreme heat ambient, cicadas and stillness',
    'Hot afternoon sounds, heat shimmer ambient',
    'Blazing hot day, insects buzzing in the heat',
  ],
};

interface GenerationResult {
  prompt: string;
  filename: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  audioUrl?: string;
  error?: string;
  audioBlob?: Blob;
}

export const SoundGenerator: React.FC = () => {
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');

  const generateSound = async (prompt: string, filename: string): Promise<{ success: boolean; audioBlob?: Blob; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            prompt, 
            duration: 15, // Weather sounds should be longer for looping
            promptInfluence: 0.4,
            filename 
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      
      // Convert base64 to blob
      const byteCharacters = atob(data.audioContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });

      return { success: true, audioBlob };
    } catch (error) {
      console.error('Generation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const generateAllSounds = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Build the full list of sounds to generate
    const soundsToGenerate: { category: string; filename: string; prompt: string }[] = [];
    
    for (const [category, prompts] of Object.entries(WEATHER_SOUND_PROMPTS)) {
      prompts.forEach((prompt, index) => {
        soundsToGenerate.push({
          category,
          filename: `${category}_${index + 1}`,
          prompt,
        });
      });
    }

    // Initialize results
    setResults(soundsToGenerate.map(s => ({
      prompt: s.prompt,
      filename: s.filename,
      status: 'pending',
    })));

    // Generate sounds sequentially to avoid rate limiting
    for (let i = 0; i < soundsToGenerate.length; i++) {
      const sound = soundsToGenerate[i];
      setCurrentCategory(sound.category);
      
      // Update status to generating
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));

      const result = await generateSound(sound.prompt, sound.filename);
      
      // Update with result
      setResults(prev => prev.map((r, idx) => 
        idx === i ? {
          ...r,
          status: result.success ? 'success' : 'error',
          audioBlob: result.audioBlob,
          audioUrl: result.audioBlob ? URL.createObjectURL(result.audioBlob) : undefined,
          error: result.error,
        } : r
      ));

      setProgress(((i + 1) / soundsToGenerate.length) * 100);

      // Small delay between requests to avoid rate limiting
      if (i < soundsToGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
    setCurrentCategory('');
  };

  const playSound = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const downloadSound = (audioBlob: Blob, filename: string) => {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllSounds = async () => {
    const successfulResults = results.filter(r => r.status === 'success' && r.audioBlob);
    
    for (const result of successfulResults) {
      if (result.audioBlob) {
        downloadSound(result.audioBlob, result.filename);
        await new Promise(resolve => setTimeout(resolve, 200)); // Small delay between downloads
      }
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalCount = Object.values(WEATHER_SOUND_PROMPTS).flat().length;

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Weather Sound Generator
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Generate {totalCount} weather sounds using ElevenLabs SFX API (6 variations per category)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex gap-4 items-center">
            <Button 
              onClick={generateAllSounds} 
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate All Sounds'
              )}
            </Button>
            
            {successCount > 0 && (
              <Button 
                onClick={downloadAllSounds}
                variant="outline"
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download All ({successCount})
              </Button>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating: {currentCategory}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Stats */}
          {results.length > 0 && (
            <div className="flex gap-4 text-sm">
              <span className="text-green-500">✓ Success: {successCount}</span>
              <span className="text-red-500">✗ Errors: {errorCount}</span>
              <span className="text-muted-foreground">Pending: {results.filter(r => r.status === 'pending').length}</span>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <ScrollArea className="h-[500px] border rounded-lg p-4">
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      result.status === 'success' ? 'bg-green-500/10 border-green-500/20' :
                      result.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                      result.status === 'generating' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      'bg-muted/50'
                    }`}
                  >
                    {/* Status icon */}
                    <div className="flex-shrink-0">
                      {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                      {result.status === 'generating' && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
                      {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-sm font-medium truncate">{result.filename}</div>
                      <div className="text-xs text-muted-foreground truncate">{result.prompt}</div>
                      {result.error && <div className="text-xs text-red-500">{result.error}</div>}
                    </div>
                    
                    {/* Actions */}
                    {result.status === 'success' && result.audioUrl && result.audioBlob && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => playSound(result.audioUrl!)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => downloadSound(result.audioBlob!, result.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Category breakdown */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">Sound Categories ({Object.keys(WEATHER_SOUND_PROMPTS).length} categories, 6 variations each)</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {Object.keys(WEATHER_SOUND_PROMPTS).map(category => (
                  <div key={category} className="font-mono text-muted-foreground">{category}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoundGenerator;
