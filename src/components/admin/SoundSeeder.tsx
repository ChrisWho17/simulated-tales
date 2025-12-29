import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Volume2, RefreshCw, Loader2, CheckCircle,
  Cloud, Sun, CloudRain, CloudSnow, CloudFog, Flame, Wind, CloudLightning,
  MousePointer, Backpack, Shirt, Bell, Coins, Heart, Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedSound {
  id: string;
  filename: string;
  category: string;
  prompt: string;
  public_url: string;
  duration_seconds: number | null;
  created_at: string;
}

// Category icons and colors
const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  // Weather
  weather_clear: { icon: Sun, color: 'text-yellow-400', label: 'Clear Weather' },
  weather_overcast: { icon: Cloud, color: 'text-slate-400', label: 'Overcast' },
  weather_rain: { icon: CloudRain, color: 'text-blue-400', label: 'Rain' },
  weather_storm: { icon: CloudLightning, color: 'text-purple-400', label: 'Storm' },
  weather_fog: { icon: CloudFog, color: 'text-gray-400', label: 'Fog' },
  weather_snow: { icon: CloudSnow, color: 'text-cyan-300', label: 'Snow' },
  weather_heatwave: { icon: Flame, color: 'text-orange-500', label: 'Heatwave' },
  weather_windy: { icon: Wind, color: 'text-teal-400', label: 'Windy' },
  // UI
  ui_inventory: { icon: Backpack, color: 'text-amber-500', label: 'Inventory' },
  ui_equip: { icon: Shirt, color: 'text-indigo-400', label: 'Equip' },
  ui_buttons: { icon: MousePointer, color: 'text-green-400', label: 'Buttons' },
  ui_feedback: { icon: Bell, color: 'text-pink-400', label: 'Feedback' },
  ui_resources: { icon: Coins, color: 'text-yellow-500', label: 'Resources' },
  ui_health: { icon: Heart, color: 'text-red-400', label: 'Health' },
  ui_actions: { icon: Sparkles, color: 'text-violet-400', label: 'Actions' },
};

export function SoundSeeder() {
  const [sounds, setSounds] = useState<GeneratedSound[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const fetchSounds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('generated_sounds')
      .select('*')
      .order('category', { ascending: true })
      .order('filename', { ascending: true });

    if (error) {
      console.error('Error fetching sounds:', error);
    } else {
      setSounds(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSounds();
  }, []);

  const playSound = (sound: GeneratedSound) => {
    // Stop current audio if playing
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    if (playingId === sound.id) {
      setPlayingId(null);
      setAudioElement(null);
      return;
    }

    const audio = new Audio(sound.public_url);
    audio.onended = () => {
      setPlayingId(null);
      setAudioElement(null);
    };
    audio.play();
    setAudioElement(audio);
    setPlayingId(sound.id);
  };

  // Group sounds by category
  const soundsByCategory = sounds.reduce((acc, sound) => {
    if (!acc[sound.category]) {
      acc[sound.category] = [];
    }
    acc[sound.category].push(sound);
    return acc;
  }, {} as Record<string, GeneratedSound[]>);

  const categories = Object.keys(soundsByCategory).sort();
  const weatherCategories = categories.filter(c => c.startsWith('weather_'));
  const uiCategories = categories.filter(c => c.startsWith('ui_'));

  const renderCategory = (category: string) => {
    const config = CATEGORY_CONFIG[category] || { 
      icon: Volume2, 
      color: 'text-muted-foreground', 
      label: category 
    };
    const Icon = config.icon;
    const categorySounds = soundsByCategory[category];

    return (
      <Card key={category} className="mb-4">
        <CardHeader className="py-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className={`h-4 w-4 ${config.color}`} />
            <span>{config.label}</span>
            <Badge variant="secondary" className="ml-auto">
              {categorySounds.length} sounds
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {categorySounds.map(sound => {
              const isPlaying = playingId === sound.id;
              const filename = sound.filename.split('/').pop() || sound.filename;
              
              return (
                <div
                  key={sound.id}
                  className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                    isPlaying ? 'bg-primary/10 border-primary' : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  <Button
                    size="icon"
                    variant={isPlaying ? "default" : "ghost"}
                    className="h-8 w-8 shrink-0"
                    onClick={() => playSound(sound)}
                  >
                    {isPlaying ? (
                      <Volume2 className="h-4 w-4 animate-pulse" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{filename}</p>
                    <p className="text-xs text-muted-foreground truncate">{sound.prompt}</p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Sound Library
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-base">
                {sounds.length} sounds
              </Badge>
              <Badge variant="outline" className="text-base">
                {categories.length} categories
              </Badge>
              <Button variant="outline" size="sm" onClick={fetchSounds} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sounds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Volume2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sounds generated yet.</p>
              <p className="text-sm">Use the Sound Generator to create sounds.</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-250px)]">
              {/* Weather Sounds */}
              {weatherCategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Cloud className="h-5 w-5" />
                    Weather Sounds
                    <Badge variant="secondary">
                      {weatherCategories.reduce((acc, c) => acc + soundsByCategory[c].length, 0)}
                    </Badge>
                  </h3>
                  {weatherCategories.map(renderCategory)}
                </div>
              )}

              {/* UI Sounds */}
              {uiCategories.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MousePointer className="h-5 w-5" />
                    UI Sounds
                    <Badge variant="secondary">
                      {uiCategories.reduce((acc, c) => acc + soundsByCategory[c].length, 0)}
                    </Badge>
                  </h3>
                  {uiCategories.map(renderCategory)}
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
