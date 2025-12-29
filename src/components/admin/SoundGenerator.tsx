import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Loader2, CheckCircle, XCircle, Volume2, Cloud, Sun, 
  CloudRain, CloudSnow, CloudFog, Flame, Wind, CloudLightning,
  MousePointer, Package, Shirt, Crosshair, Backpack, Trash2,
  RotateCcw, Check, X, Bell, Coins, Heart, Shield, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════════════════
// WEATHER SOUNDS - Multiple variations per weather type
// ═══════════════════════════════════════════════════════════════════════════
const WEATHER_SOUNDS = {
  clear: {
    icon: Sun,
    color: 'text-yellow-400',
    sounds: [
      { filename: 'clear_day_birds_1', prompt: 'Peaceful sunny day ambient with birds chirping, light breeze through trees, serene outdoor atmosphere, 5 seconds' },
      { filename: 'clear_day_birds_2', prompt: 'Morning songbirds singing on a clear sunny day, nature sounds, cheerful ambient, 5 seconds' },
      { filename: 'clear_day_cicadas', prompt: 'Summer clear day with cicadas buzzing, warm afternoon ambient, peaceful nature, 5 seconds' },
      { filename: 'clear_night_crickets', prompt: 'Clear night sky ambient with crickets chirping, peaceful evening sounds, 5 seconds' },
      { filename: 'clear_breeze_light', prompt: 'Light gentle breeze on a clear day, soft wind through grass, relaxing ambient, 5 seconds' },
    ]
  },
  overcast: {
    icon: Cloud,
    color: 'text-slate-400',
    sounds: [
      { filename: 'overcast_ambient_1', prompt: 'Overcast cloudy day ambient, muted atmosphere, distant traffic, grey sky feeling, 5 seconds' },
      { filename: 'overcast_ambient_2', prompt: 'Cloudy day outdoor ambient, subdued nature sounds, quiet atmosphere, 5 seconds' },
      { filename: 'overcast_wind', prompt: 'Overcast day with moderate wind, clouds passing, atmospheric ambient, 5 seconds' },
    ]
  },
  rain: {
    icon: CloudRain,
    color: 'text-blue-400',
    sounds: [
      { filename: 'rain_light_loop', prompt: 'Light gentle rain falling softly, peaceful drizzle, calming rain ambient loop, 5 seconds' },
      { filename: 'rain_medium_loop', prompt: 'Medium steady rainfall, consistent rain patter, ambient rain sounds, 5 seconds' },
      { filename: 'rain_heavy_loop', prompt: 'Heavy intense rain pouring down, torrential downpour, dramatic rain storm, 5 seconds' },
      { filename: 'rain_on_roof', prompt: 'Rain falling on metal roof, indoor rain ambience, cozy rain sounds, 5 seconds' },
      { filename: 'rain_on_window', prompt: 'Rain hitting window glass, indoor perspective, water droplets on glass, 5 seconds' },
      { filename: 'rain_on_leaves', prompt: 'Rain falling on forest leaves, water dripping through foliage, nature rain, 5 seconds' },
      { filename: 'rain_puddles', prompt: 'Rain splashing in puddles, water collecting on ground, urban rain, 5 seconds' },
    ]
  },
  storm: {
    icon: CloudLightning,
    color: 'text-purple-400',
    sounds: [
      { filename: 'thunder_distant_1', prompt: 'Distant rumbling thunder, far away storm, low rolling thunder boom, 4 seconds' },
      { filename: 'thunder_distant_2', prompt: 'Far away thunder crack and roll, distant storm approaching, 4 seconds' },
      { filename: 'thunder_close_1', prompt: 'Close loud thunder clap, nearby lightning strike, powerful boom, 3 seconds' },
      { filename: 'thunder_close_2', prompt: 'Very close thunder crack, intense lightning strike, house-shaking boom, 3 seconds' },
      { filename: 'thunder_rolling', prompt: 'Long rolling thunder, continuous rumble, storm passing overhead, 5 seconds' },
      { filename: 'storm_rain_wind', prompt: 'Full storm with heavy rain and wind, chaotic weather, intense storm ambient, 5 seconds' },
      { filename: 'lightning_strike', prompt: 'Lightning strike crack, electrical discharge, immediate thunder, 2 seconds' },
    ]
  },
  fog: {
    icon: CloudFog,
    color: 'text-gray-400',
    sounds: [
      { filename: 'fog_ambient_1', prompt: 'Eerie foggy atmosphere, muffled distant sounds, mysterious ambient, 5 seconds' },
      { filename: 'fog_ambient_2', prompt: 'Dense fog soundscape, hushed environment, spooky quiet, 5 seconds' },
      { filename: 'fog_horn', prompt: 'Distant fog horn, maritime warning horn, harbor signal, 3 seconds' },
      { filename: 'fog_drips', prompt: 'Water condensation dripping in fog, moisture droplets, damp atmosphere, 5 seconds' },
    ]
  },
  snow: {
    icon: CloudSnow,
    color: 'text-cyan-300',
    sounds: [
      { filename: 'snow_ambient_1', prompt: 'Quiet snowy landscape, muffled winter silence, peaceful snow falling, 5 seconds' },
      { filename: 'snow_ambient_2', prompt: 'Snow falling silently, winter calm, serene frozen atmosphere, 5 seconds' },
      { filename: 'snow_crunch_footsteps', prompt: 'Footsteps crunching in fresh snow, walking through powder, winter sounds, 3 seconds' },
      { filename: 'blizzard_wind', prompt: 'Blizzard wind howling, intense snowstorm, harsh winter wind, 5 seconds' },
      { filename: 'snow_wind_light', prompt: 'Light winter wind with snow, cold breeze, gentle snowfall, 5 seconds' },
    ]
  },
  heatwave: {
    icon: Flame,
    color: 'text-orange-500',
    sounds: [
      { filename: 'heat_cicadas_1', prompt: 'Scorching hot day with cicadas buzzing loudly, intense summer heat, 5 seconds' },
      { filename: 'heat_cicadas_2', prompt: 'Heat wave ambient with droning insects, oppressive warmth, still air, 5 seconds' },
      { filename: 'heat_shimmer', prompt: 'Hot desert ambient, heat waves shimmer, sparse insect sounds, 5 seconds' },
    ]
  },
  windy: {
    icon: Wind,
    color: 'text-teal-400',
    sounds: [
      { filename: 'wind_light_loop', prompt: 'Light gentle breeze, soft wind through trees, peaceful rustling, 5 seconds' },
      { filename: 'wind_medium_loop', prompt: 'Moderate wind blowing steadily, trees swaying, consistent wind, 5 seconds' },
      { filename: 'wind_strong_loop', prompt: 'Strong powerful wind, intense gusts, dramatic howling wind, 5 seconds' },
      { filename: 'wind_howl', prompt: 'Eerie wind howling through mountains, spooky atmospheric wind, 5 seconds' },
      { filename: 'wind_gust_1', prompt: 'Sudden wind gust, brief powerful burst, quick whoosh, 2 seconds' },
      { filename: 'wind_gust_2', prompt: 'Strong wind gust swooshing by, leaves blowing, 2 seconds' },
      { filename: 'wind_chimes', prompt: 'Wind chimes tinkling in breeze, melodic wind sounds, 4 seconds' },
    ]
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// UI SOUNDS - Button actions, interactions, feedback
// ═══════════════════════════════════════════════════════════════════════════
const UI_SOUNDS = {
  inventory: {
    label: 'Inventory Actions',
    icon: Backpack,
    sounds: [
      { filename: 'item_pickup', prompt: 'Item being picked up, light grabbing sound, collecting loot, 0.5 seconds' },
      { filename: 'item_drop', prompt: 'Item dropping to ground, object landing, dropped item, 0.5 seconds' },
      { filename: 'item_move', prompt: 'Moving item in inventory, sliding object, rearranging, 0.3 seconds' },
      { filename: 'bag_open', prompt: 'Backpack opening, zipper or buckle sound, bag unzipping, 0.5 seconds' },
      { filename: 'bag_close', prompt: 'Backpack closing, bag zipping up, secure click, 0.5 seconds' },
      { filename: 'inventory_full', prompt: 'Inventory full warning, unable to carry more, rejection sound, 0.5 seconds' },
    ]
  },
  equip: {
    label: 'Equip/Unequip',
    icon: Shirt,
    sounds: [
      { filename: 'equip_weapon', prompt: 'Weapon being equipped, drawing weapon, readying gun or blade, 0.5 seconds' },
      { filename: 'unequip_weapon', prompt: 'Weapon being holstered, sheathing blade, putting away gun, 0.5 seconds' },
      { filename: 'equip_armor', prompt: 'Armor being equipped, metal plates clicking, protective gear, 0.7 seconds' },
      { filename: 'equip_clothing', prompt: 'Clothing rustling, fabric sounds, putting on clothes, 0.5 seconds' },
      { filename: 'equip_accessory', prompt: 'Accessory equipped, small click, jewelry or watch, 0.3 seconds' },
      { filename: 'equip_helmet', prompt: 'Helmet being put on, head protection equipped, 0.5 seconds' },
    ]
  },
  buttons: {
    label: 'Button Clicks',
    icon: MousePointer,
    sounds: [
      { filename: 'click_soft', prompt: 'Soft button click, gentle UI tap, subtle click, 0.1 seconds' },
      { filename: 'click_medium', prompt: 'Medium button click, standard UI click, normal press, 0.1 seconds' },
      { filename: 'click_hard', prompt: 'Hard button click, firm press, mechanical click, 0.15 seconds' },
      { filename: 'click_toggle_on', prompt: 'Toggle switch on, enabling click, activation sound, 0.2 seconds' },
      { filename: 'click_toggle_off', prompt: 'Toggle switch off, disabling click, deactivation sound, 0.2 seconds' },
      { filename: 'hover', prompt: 'Subtle hover sound, mouse over element, light whoosh, 0.1 seconds' },
    ]
  },
  feedback: {
    label: 'Feedback Sounds',
    icon: Bell,
    sounds: [
      { filename: 'success', prompt: 'Success chime, positive confirmation, task complete sound, 0.5 seconds' },
      { filename: 'error', prompt: 'Error buzz, failure sound, negative feedback, 0.4 seconds' },
      { filename: 'warning', prompt: 'Warning alert, caution sound, attention needed, 0.5 seconds' },
      { filename: 'notification', prompt: 'Notification ping, alert sound, message received, 0.3 seconds' },
      { filename: 'level_up', prompt: 'Level up fanfare, achievement unlocked, triumphant sound, 1 second' },
      { filename: 'quest_complete', prompt: 'Quest complete sound, mission accomplished, victory chime, 1 second' },
    ]
  },
  resources: {
    label: 'Resources',
    icon: Coins,
    sounds: [
      { filename: 'coins_pickup', prompt: 'Coins being collected, money jingling, gold pickup, 0.5 seconds' },
      { filename: 'coins_drop', prompt: 'Coins dropping, money falling, scattered coins, 0.5 seconds' },
      { filename: 'coins_count', prompt: 'Counting coins, money being handled, coin clicks, 1 second' },
      { filename: 'gem_pickup', prompt: 'Gem or crystal pickup, precious stone collected, magical sparkle, 0.5 seconds' },
      { filename: 'ammo_pickup', prompt: 'Ammunition collected, bullets or shells, military pickup, 0.4 seconds' },
    ]
  },
  health: {
    label: 'Health & Status',
    icon: Heart,
    sounds: [
      { filename: 'heal', prompt: 'Healing sound, health restored, recovery effect, 0.7 seconds' },
      { filename: 'damage_taken', prompt: 'Taking damage sound, hurt impact, pain indicator, 0.3 seconds' },
      { filename: 'shield_activate', prompt: 'Shield activating, protection enabled, barrier up, 0.5 seconds' },
      { filename: 'shield_break', prompt: 'Shield breaking, protection depleted, barrier down, 0.5 seconds' },
      { filename: 'buff_apply', prompt: 'Buff applied, positive effect, enhancement sound, 0.5 seconds' },
      { filename: 'debuff_apply', prompt: 'Debuff applied, negative effect, curse sound, 0.5 seconds' },
    ]
  },
  actions: {
    label: 'General Actions',
    icon: Sparkles,
    sounds: [
      { filename: 'confirm', prompt: 'Confirmation sound, accepting action, proceed click, 0.3 seconds' },
      { filename: 'cancel', prompt: 'Cancel sound, declining action, back out, 0.3 seconds' },
      { filename: 'select', prompt: 'Selection made, choosing option, pick sound, 0.2 seconds' },
      { filename: 'open_menu', prompt: 'Menu opening, UI panel appearing, interface open, 0.3 seconds' },
      { filename: 'close_menu', prompt: 'Menu closing, UI panel disappearing, interface close, 0.3 seconds' },
      { filename: 'tab_switch', prompt: 'Tab switching, changing category, panel swap, 0.2 seconds' },
      { filename: 'scroll', prompt: 'Scrolling through list, content moving, smooth scroll, 0.3 seconds' },
    ]
  },
};

type GenerationStatus = 'pending' | 'generating' | 'success' | 'error';

interface SoundItem {
  filename: string;
  prompt: string;
  status: GenerationStatus;
  error?: string;
  publicUrl?: string;
}

export function SoundGenerator() {
  const [weatherSounds, setWeatherSounds] = useState<Record<string, SoundItem[]>>({});
  const [uiSounds, setUiSounds] = useState<Record<string, SoundItem[]>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentSound, setCurrentSound] = useState('');
  const [progress, setProgress] = useState(0);
  const [totalSounds, setTotalSounds] = useState(0);
  const [completedSounds, setCompletedSounds] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLog(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const generateSound = async (
    category: string, 
    filename: string, 
    prompt: string,
    type: 'weather' | 'ui'
  ): Promise<{ success: boolean; publicUrl?: string; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            duration: prompt.includes('5 seconds') ? 5 : prompt.includes('4 seconds') ? 4 : prompt.includes('3 seconds') ? 3 : prompt.includes('2 seconds') ? 2 : prompt.includes('1 second') ? 1 : 0.5,
            promptInfluence: 0.3,
            filename,
            category: type === 'weather' ? `weather_${category}` : `ui_${category}`,
            forceRegenerate: false,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return { success: true, publicUrl: data.publicUrl };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const generateWeatherCategory = useCallback(async (category: string) => {
    const sounds = WEATHER_SOUNDS[category as keyof typeof WEATHER_SOUNDS];
    if (!sounds) return;

    setIsGenerating(true);
    setCurrentCategory(category);
    setTotalSounds(sounds.sounds.length);
    setCompletedSounds(0);

    // Initialize status
    const initialSounds: SoundItem[] = sounds.sounds.map(s => ({
      ...s,
      status: 'pending' as GenerationStatus
    }));
    setWeatherSounds(prev => ({ ...prev, [category]: initialSounds }));

    addLog(`Starting weather generation: ${category} (${sounds.sounds.length} sounds)`);

    for (let i = 0; i < sounds.sounds.length; i++) {
      const sound = sounds.sounds[i];
      setCurrentSound(sound.filename);
      
      // Update to generating
      setWeatherSounds(prev => ({
        ...prev,
        [category]: prev[category].map((s, idx) => 
          idx === i ? { ...s, status: 'generating' } : s
        )
      }));

      addLog(`Generating: ${sound.filename}`);
      const result = await generateSound(category, sound.filename, sound.prompt, 'weather');

      // Update result
      setWeatherSounds(prev => ({
        ...prev,
        [category]: prev[category].map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: result.success ? 'success' : 'error',
            publicUrl: result.publicUrl,
            error: result.error
          } : s
        )
      }));

      setCompletedSounds(i + 1);
      setProgress(((i + 1) / sounds.sounds.length) * 100);
      
      if (result.success) {
        addLog(`✓ ${sound.filename} generated`);
      } else {
        addLog(`✗ ${sound.filename} failed: ${result.error}`);
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    setIsGenerating(false);
    setCurrentCategory('');
    setCurrentSound('');
    addLog(`Completed ${category} weather sounds`);
  }, []);

  const generateUICategory = useCallback(async (category: string) => {
    const sounds = UI_SOUNDS[category as keyof typeof UI_SOUNDS];
    if (!sounds) return;

    setIsGenerating(true);
    setCurrentCategory(category);
    setTotalSounds(sounds.sounds.length);
    setCompletedSounds(0);

    // Initialize status
    const initialSounds: SoundItem[] = sounds.sounds.map(s => ({
      ...s,
      status: 'pending' as GenerationStatus
    }));
    setUiSounds(prev => ({ ...prev, [category]: initialSounds }));

    addLog(`Starting UI generation: ${sounds.label} (${sounds.sounds.length} sounds)`);

    for (let i = 0; i < sounds.sounds.length; i++) {
      const sound = sounds.sounds[i];
      setCurrentSound(sound.filename);
      
      // Update to generating
      setUiSounds(prev => ({
        ...prev,
        [category]: prev[category].map((s, idx) => 
          idx === i ? { ...s, status: 'generating' } : s
        )
      }));

      addLog(`Generating: ${sound.filename}`);
      const result = await generateSound(category, sound.filename, sound.prompt, 'ui');

      // Update result
      setUiSounds(prev => ({
        ...prev,
        [category]: prev[category].map((s, idx) => 
          idx === i ? { 
            ...s, 
            status: result.success ? 'success' : 'error',
            publicUrl: result.publicUrl,
            error: result.error
          } : s
        )
      }));

      setCompletedSounds(i + 1);
      setProgress(((i + 1) / sounds.sounds.length) * 100);
      
      if (result.success) {
        addLog(`✓ ${sound.filename} generated`);
      } else {
        addLog(`✗ ${sound.filename} failed: ${result.error}`);
      }

      // Small delay between requests
      await new Promise(r => setTimeout(r, 500));
    }

    setIsGenerating(false);
    setCurrentCategory('');
    setCurrentSound('');
    addLog(`Completed ${sounds.label} sounds`);
  }, []);

  const generateAllWeather = useCallback(async () => {
    const categories = Object.keys(WEATHER_SOUNDS);
    for (const category of categories) {
      await generateWeatherCategory(category);
    }
    addLog('=== All weather sounds complete ===');
  }, [generateWeatherCategory]);

  const generateAllUI = useCallback(async () => {
    const categories = Object.keys(UI_SOUNDS);
    for (const category of categories) {
      await generateUICategory(category);
    }
    addLog('=== All UI sounds complete ===');
  }, [generateUICategory]);

  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const getStatusIcon = (status: GenerationStatus) => {
    switch (status) {
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full border border-muted-foreground/30" />;
    }
  };

  const countTotalSounds = (type: 'weather' | 'ui') => {
    if (type === 'weather') {
      return Object.values(WEATHER_SOUNDS).reduce((acc, cat) => acc + cat.sounds.length, 0);
    }
    return Object.values(UI_SOUNDS).reduce((acc, cat) => acc + cat.sounds.length, 0);
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Sound Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="weather" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather ({countTotalSounds('weather')})
              </TabsTrigger>
              <TabsTrigger value="ui" className="flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                UI Actions ({countTotalSounds('ui')})
              </TabsTrigger>
            </TabsList>

            {/* Weather Tab */}
            <TabsContent value="weather" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Generate ambient weather sounds for different conditions
                </p>
                <Button 
                  onClick={generateAllWeather} 
                  disabled={isGenerating}
                  size="sm"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Generate All Weather
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(WEATHER_SOUNDS).map(([key, weather]) => {
                  const Icon = weather.icon;
                  const categoryResults = weatherSounds[key] || [];
                  const successCount = categoryResults.filter(s => s.status === 'success').length;
                  const isActive = currentCategory === key;

                  return (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all hover:border-primary/50 ${isActive ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      onClick={() => !isGenerating && generateWeatherCategory(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg bg-muted ${weather.color}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium capitalize text-sm">{key}</p>
                            <p className="text-xs text-muted-foreground">
                              {successCount}/{weather.sounds.length} sounds
                            </p>
                          </div>
                          {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Weather sounds list */}
              {Object.entries(weatherSounds).map(([category, sounds]) => (
                sounds.length > 0 && (
                  <Card key={category} className="mt-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2 capitalize">
                        {React.createElement(WEATHER_SOUNDS[category as keyof typeof WEATHER_SOUNDS]?.icon || Cloud, { 
                          className: `h-4 w-4 ${WEATHER_SOUNDS[category as keyof typeof WEATHER_SOUNDS]?.color}` 
                        })}
                        {category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-1">
                        {sounds.map((sound, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50">
                            {getStatusIcon(sound.status)}
                            <span className="flex-1 text-sm font-mono">{sound.filename}</span>
                            {sound.publicUrl && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); playSound(sound.publicUrl!); }}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {sound.error && (
                              <span className="text-xs text-destructive truncate max-w-32">{sound.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </TabsContent>

            {/* UI Tab */}
            <TabsContent value="ui" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Generate UI interaction sounds for buttons, inventory, and feedback
                </p>
                <Button 
                  onClick={generateAllUI} 
                  disabled={isGenerating}
                  size="sm"
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                  Generate All UI
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(UI_SOUNDS).map(([key, ui]) => {
                  const Icon = ui.icon;
                  const categoryResults = uiSounds[key] || [];
                  const successCount = categoryResults.filter(s => s.status === 'success').length;
                  const isActive = currentCategory === key;

                  return (
                    <Card 
                      key={key} 
                      className={`cursor-pointer transition-all hover:border-primary/50 ${isActive ? 'border-primary ring-2 ring-primary/20' : ''}`}
                      onClick={() => !isGenerating && generateUICategory(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{ui.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {successCount}/{ui.sounds.length} sounds
                            </p>
                          </div>
                          {isActive && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* UI sounds list */}
              {Object.entries(uiSounds).map(([category, sounds]) => (
                sounds.length > 0 && (
                  <Card key={category} className="mt-4">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {React.createElement(UI_SOUNDS[category as keyof typeof UI_SOUNDS]?.icon || MousePointer, { 
                          className: 'h-4 w-4 text-primary' 
                        })}
                        {UI_SOUNDS[category as keyof typeof UI_SOUNDS]?.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="space-y-1">
                        {sounds.map((sound, idx) => (
                          <div key={idx} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-muted/50">
                            {getStatusIcon(sound.status)}
                            <span className="flex-1 text-sm font-mono">{sound.filename}</span>
                            {sound.publicUrl && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => { e.stopPropagation(); playSound(sound.publicUrl!); }}
                              >
                                <Play className="h-3 w-3" />
                              </Button>
                            )}
                            {sound.error && (
                              <span className="text-xs text-destructive truncate max-w-32">{sound.error}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </TabsContent>
          </Tabs>

          {/* Progress indicator */}
          {isGenerating && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Generating: <span className="text-foreground font-medium">{currentSound}</span>
                </span>
                <span className="text-muted-foreground">
                  {completedSounds}/{totalSounds}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Generation Log</h4>
                <Button variant="ghost" size="sm" onClick={() => setLog([])}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="h-40 border rounded-md p-3 bg-muted/30">
                {log.map((entry, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground py-0.5">
                    {entry}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
