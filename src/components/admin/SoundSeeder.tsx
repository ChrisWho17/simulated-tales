import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, AlertCircle, Play, Loader2, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Essential sounds from your audio system specification
const SOUND_DEFINITIONS = [
  // Weather - Rain
  { category: 'weather_rain', filename: 'rain_light_loop', prompt: 'Light gentle rain falling softly, ambient loop, peaceful drizzle, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_medium_loop', prompt: 'Medium steady rain falling, ambient rain loop, moderate rainfall, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_heavy_loop', prompt: 'Heavy intense rain pouring down, storm rain ambient loop, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_on_roof', prompt: 'Rain falling on a roof, indoor rain sound, pitter patter on rooftop, 5 seconds' },
  
  // Weather - Thunder
  { category: 'weather_thunder', filename: 'thunder_distant_1', prompt: 'Distant thunder rumble, far away thunderstorm, low rolling thunder, 3 seconds' },
  { category: 'weather_thunder', filename: 'thunder_distant_2', prompt: 'Distant thunder crack and rumble, faraway storm thunder, 3 seconds' },
  { category: 'weather_thunder', filename: 'thunder_close_1', prompt: 'Close loud thunder clap, nearby lightning strike thunder, powerful boom, 2 seconds' },
  { category: 'weather_thunder', filename: 'thunder_close_2', prompt: 'Very close thunder crack, intense lightning strike sound, startling thunder boom, 2 seconds' },
  
  // Weather - Wind
  { category: 'weather_wind', filename: 'wind_light_loop', prompt: 'Light gentle breeze blowing, soft wind ambient loop, peaceful wind, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_medium_loop', prompt: 'Medium wind blowing steadily, moderate wind ambient loop, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_strong_loop', prompt: 'Strong powerful wind howling, intense wind ambient loop, gusty wind, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_1', prompt: 'Sudden wind gust, quick burst of strong wind, 2 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_2', prompt: 'Wind gust swooshing by, sudden strong breeze, 2 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_3', prompt: 'Powerful wind gust rushing past, intense momentary wind, 2 seconds' },
  
  // Combat - Guns
  { category: 'gun_pistol', filename: 'gun_pistol_1', prompt: 'Pistol gunshot, handgun firing single shot, sharp crack, 1 second' },
  { category: 'gun_pistol', filename: 'gun_pistol_2', prompt: 'Revolver gunshot, pistol firing, crisp gunshot sound, 1 second' },
  { category: 'gun_rifle', filename: 'gun_rifle_1', prompt: 'Rifle gunshot, loud rifle firing single shot, powerful crack, 1 second' },
  { category: 'gun_rifle', filename: 'gun_rifle_2', prompt: 'Assault rifle single shot, loud rifle gunshot, 1 second' },
  { category: 'gun_shotgun', filename: 'gun_shotgun_1', prompt: 'Shotgun blast, loud shotgun firing, powerful boom, 1 second' },
  { category: 'gun_distant', filename: 'gun_distant_1', prompt: 'Distant gunshot, faraway gunfire, muffled shot, 1 second' },
  { category: 'gun_distant', filename: 'gun_distant_2', prompt: 'Distant rifle shot, far away gunfire echo, 1 second' },
  { category: 'gun_distant', filename: 'gun_distant_3', prompt: 'Multiple distant gunshots, faraway firefight, 2 seconds' },
  
  // Combat - Melee
  { category: 'combat_punch', filename: 'punch_1', prompt: 'Punch hitting face, fist impact on body, melee hit sound, 0.5 seconds' },
  { category: 'combat_punch', filename: 'punch_2', prompt: 'Hard punch landing, heavy fist impact, fighting sound, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_swing_1', prompt: 'Sword swinging through air, blade whoosh, metal swing, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_clash_1', prompt: 'Swords clashing together, metal on metal impact, blade clash, 0.5 seconds' },
  
  // Doors
  { category: 'door_wooden', filename: 'door_open_1', prompt: 'Wooden door opening, door creak and open, 1 second' },
  { category: 'door_wooden', filename: 'door_close_1', prompt: 'Wooden door closing, door shutting firmly, 1 second' },
  { category: 'door_creaky', filename: 'door_creak_1', prompt: 'Creaky door opening slowly, spooky door creak, horror door, 2 seconds' },
  { category: 'door_metal', filename: 'door_metal_1', prompt: 'Heavy metal door opening, industrial door sound, 1 second' },
  { category: 'door_heavy', filename: 'door_slam_1', prompt: 'Door slamming shut loudly, heavy door slam, 0.5 seconds' },
  
  // Human sounds
  { category: 'human_scream', filename: 'scream_1', prompt: 'Person screaming in fear, terrified scream, horror scream, 2 seconds' },
  { category: 'human_scream', filename: 'scream_2', prompt: 'Frightened scream, surprised scream of terror, 1.5 seconds' },
  { category: 'human_gasp', filename: 'gasp_1', prompt: 'Person gasping in surprise, shocked gasp, sudden intake of breath, 0.5 seconds' },
  { category: 'human_cry', filename: 'sobbing_1', prompt: 'Person crying and sobbing, emotional crying, sad sobbing, 3 seconds' },
  { category: 'human_laugh', filename: 'laugh_1', prompt: 'Person laughing heartily, genuine laughter, happy laugh, 2 seconds' },
  { category: 'human_grunt', filename: 'grunt_1', prompt: 'Male grunt of effort, exertion grunt, physical strain sound, 0.5 seconds' },
  { category: 'human_heartbeat', filename: 'heartbeat_loop', prompt: 'Human heartbeat pounding, heart beating rhythm, tense heartbeat loop, 5 seconds' },
  
  // Ambience
  { category: 'ambience_tavern', filename: 'bar_ambient_loop', prompt: 'Busy bar tavern ambient, people talking murmur, glasses clinking, pub atmosphere, 5 seconds' },
  { category: 'ambience_city_day', filename: 'city_traffic_loop', prompt: 'City street ambient, traffic sounds, urban city atmosphere, cars and people, 5 seconds' },
  { category: 'ambience_forest', filename: 'forest_ambient_loop', prompt: 'Forest ambient sounds, birds chirping, leaves rustling, peaceful forest, 5 seconds' },
  { category: 'ambience_cave', filename: 'cave_drips_loop', prompt: 'Cave ambient sounds, water dripping in cave, echoing cave atmosphere, 5 seconds' },
  
  // Elements
  { category: 'element_fire', filename: 'fire_crackle_loop', prompt: 'Fire crackling, campfire burning, flames flickering ambient, 5 seconds' },
  { category: 'element_water', filename: 'stream_loop', prompt: 'Water stream flowing, babbling brook, gentle river sounds, 5 seconds' },
  
  // Objects
  { category: 'glass_break', filename: 'glass_break_1', prompt: 'Glass shattering, window breaking, glass smash impact, 1 second' },
  { category: 'glass_clink', filename: 'glass_clink_1', prompt: 'Glasses clinking together, toast sound, champagne glasses, 0.5 seconds' },
  { category: 'coins_jingle', filename: 'coins_jingle', prompt: 'Coins jingling, money rattling, pouch of coins sound, 1 second' },
  { category: 'coins_drop', filename: 'coin_drop_1', prompt: 'Coins dropping on table, money falling, coins landing, 1 second' },
  { category: 'keys_jingle', filename: 'key_jingle_1', prompt: 'Keys jingling, keyring rattling, bunch of keys sound, 1 second' },
  { category: 'chest_open', filename: 'chest_open_1', prompt: 'Treasure chest opening, wooden chest lid opening, fantasy chest sound, 1 second' },
  
  // Footsteps
  { category: 'footsteps_stone', filename: 'footsteps_walk_1', prompt: 'Footsteps walking on stone floor, shoes on hard ground, 2 seconds' },
  { category: 'footsteps_wood', filename: 'footsteps_wood_1', prompt: 'Footsteps walking on wooden floor, creaky wood footsteps, 2 seconds' },
  { category: 'footsteps_grass', filename: 'footsteps_grass_1', prompt: 'Footsteps walking on grass, soft footsteps in nature, 2 seconds' },
  
  // UI
  { category: 'ui_click', filename: 'ui_click', prompt: 'UI button click, clean interface click, menu select sound, 0.2 seconds' },
  { category: 'ui_notification', filename: 'ui_notification', prompt: 'Notification sound, soft pleasant chime, alert tone, 0.5 seconds' },
  { category: 'ui_success', filename: 'ui_success', prompt: 'Success sound, achievement unlocked, positive confirmation tone, 1 second' },
  { category: 'ui_error', filename: 'ui_error', prompt: 'Error sound, negative feedback buzz, wrong action sound, 0.5 seconds' },
  
  // Creatures
  { category: 'creature_wolf', filename: 'wolf_howl_1', prompt: 'Wolf howling at night, lone wolf howl, wilderness wolf cry, 3 seconds' },
  { category: 'creature_dog', filename: 'dog_bark_1', prompt: 'Dog barking, alert dog bark, guard dog sound, 1 second' },
  { category: 'creature_horse', filename: 'horse_whinny_1', prompt: 'Horse neighing, horse whinny, equine sound, 2 seconds' },
];

interface GenerationResult {
  filename: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

export function SoundSeeder() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentSound, setCurrentSound] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);

  const checkExistingSounds = async () => {
    const { data, error } = await supabase
      .from('generated_sounds')
      .select('filename');
    
    if (!error && data) {
      setExistingCount(data.length);
      return new Set(data.map(s => s.filename));
    }
    return new Set<string>();
  };

  const generateSound = async (def: typeof SOUND_DEFINITIONS[0]): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await supabase.functions.invoke('generate-sfx', {
        body: {
          prompt: def.prompt,
          category: def.category,
          filename: def.filename,
          duration: 5,
          promptInfluence: 0.3
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Generation failed' };
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Check what already exists
    const existingFiles = await checkExistingSounds();
    
    // Filter to only generate missing sounds
    const toGenerate = SOUND_DEFINITIONS.filter(def => !existingFiles.has(def.filename));
    
    if (toGenerate.length === 0) {
      setResults([{ filename: 'All sounds already exist!', status: 'success' }]);
      setIsGenerating(false);
      return;
    }

    // Initialize results
    const initialResults: GenerationResult[] = toGenerate.map(def => ({
      filename: def.filename,
      status: 'pending'
    }));
    setResults(initialResults);

    // Generate sounds one by one (to avoid rate limits)
    for (let i = 0; i < toGenerate.length; i++) {
      const def = toGenerate[i];
      setCurrentSound(def.filename);
      
      // Update status to generating
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));

      const result = await generateSound(def);
      
      // Update status
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { 
          ...r, 
          status: result.success ? 'success' : 'error',
          error: result.error 
        } : r
      ));

      setProgress(((i + 1) / toGenerate.length) * 100);
      
      // Small delay between generations to avoid rate limiting
      if (i < toGenerate.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setCurrentSound('');
    setIsGenerating(false);
    
    // Refresh existing count
    await checkExistingSounds();
  };

  const playTestSound = async (url: string) => {
    if (testAudio) {
      testAudio.pause();
    }
    const audio = new Audio(url);
    setTestAudio(audio);
    await audio.play();
  };

  React.useEffect(() => {
    checkExistingSounds();
  }, []);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display">Sound Seeder</h1>
        <p className="text-muted-foreground">
          Generate essential game sounds using ElevenLabs
        </p>
        <div className="text-sm text-muted-foreground">
          {existingCount} sounds in database | {SOUND_DEFINITIONS.length} defined
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={startGeneration}
          disabled={isGenerating}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Generate Missing Sounds
            </>
          )}
        </Button>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generating: {currentSound}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="text-green-500">✓ {successCount} success</span>
            <span className="text-red-500">✗ {errorCount} errors</span>
          </div>
          
          <ScrollArea className="h-64 rounded-lg border border-border/50 bg-background/50">
            <div className="p-3 space-y-1">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  {result.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  {result.status === 'generating' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {result.status === 'success' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={result.status === 'error' ? 'text-red-400' : ''}>
                    {result.filename}
                  </span>
                  {result.error && (
                    <span className="text-xs text-red-400 ml-auto">
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Sounds are generated via ElevenLabs and stored in Supabase storage.</p>
        <p>This may take several minutes depending on the number of sounds.</p>
      </div>
    </div>
  );
}
