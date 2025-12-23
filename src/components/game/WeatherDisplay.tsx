import { WeatherState, getWeatherDescription, getWeatherEffects } from '@/game/worldEventsSystem';
import { Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Sun, Wind } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WeatherDisplayProps {
  weather: WeatherState;
  timeOfDay: string;
  compact?: boolean;
}

export function WeatherDisplay({ weather, timeOfDay, compact = false }: WeatherDisplayProps) {
  const effects = getWeatherEffects(weather);
  
  const getWeatherIcon = () => {
    switch (weather.current) {
      case 'clear':
        return <Sun className={cn("text-yellow-500", compact ? "w-4 h-4" : "w-6 h-6")} />;
      case 'cloudy':
        return <Cloud className={cn("text-gray-400", compact ? "w-4 h-4" : "w-6 h-6")} />;
      case 'rain':
        return <CloudRain className={cn("text-blue-400", compact ? "w-4 h-4" : "w-6 h-6")} />;
      case 'storm':
        return <CloudLightning className={cn("text-purple-400", compact ? "w-4 h-4" : "w-6 h-6")} />;
      case 'snow':
        return <CloudSnow className={cn("text-blue-200", compact ? "w-4 h-4" : "w-6 h-6")} />;
      case 'fog':
        return <CloudFog className={cn("text-gray-300", compact ? "w-4 h-4" : "w-6 h-6")} />;
      default:
        return <Cloud className={cn("text-gray-400", compact ? "w-4 h-4" : "w-6 h-6")} />;
    }
  };

  const getIntensityLabel = () => {
    return weather.intensity.charAt(0).toUpperCase() + weather.intensity.slice(1);
  };

  const hasNegativeEffects = effects.visibilityMod < 0 || effects.outdoorActivityMod < 0 || effects.moodMod < 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
              hasNegativeEffects ? "bg-orange-500/10" : "bg-muted/50"
            )}>
              {getWeatherIcon()}
              <span className="text-xs capitalize">{weather.current}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-semibold">{getIntensityLabel()} {weather.current}</p>
              <p className="text-xs text-muted-foreground">
                {getWeatherDescription(weather, timeOfDay)}
              </p>
              {hasNegativeEffects && (
                <div className="text-xs space-y-1 pt-1 border-t">
                  {effects.visibilityMod < 0 && (
                    <p className="text-orange-400">Visibility: {effects.visibilityMod}%</p>
                  )}
                  {effects.outdoorActivityMod < 0 && (
                    <p className="text-orange-400">Outdoor: {effects.outdoorActivityMod}%</p>
                  )}
                  {effects.moodMod !== 0 && (
                    <p className={effects.moodMod > 0 ? "text-green-400" : "text-orange-400"}>
                      Mood: {effects.moodMod > 0 ? '+' : ''}{effects.moodMod}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getWeatherIcon()}
          <div>
            <p className="font-medium capitalize">
              {getIntensityLabel()} {weather.current}
            </p>
            <p className="text-xs text-muted-foreground">
              ~{weather.duration} hours remaining
            </p>
          </div>
        </div>
        {weather.transitioningTo && (
          <Badge variant="outline" className="text-xs">
            <Wind className="w-3 h-3 mr-1" />
            {weather.transitioningTo} coming
          </Badge>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        {getWeatherDescription(weather, timeOfDay)}
      </p>
      
      {/* Effects */}
      {(effects.visibilityMod !== 0 || effects.outdoorActivityMod !== 0 || effects.moodMod !== 0) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
          {effects.visibilityMod !== 0 && (
            <Badge variant="secondary" className={cn(
              "text-xs",
              effects.visibilityMod < 0 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
            )}>
              Visibility {effects.visibilityMod > 0 ? '+' : ''}{effects.visibilityMod}%
            </Badge>
          )}
          {effects.outdoorActivityMod !== 0 && (
            <Badge variant="secondary" className={cn(
              "text-xs",
              effects.outdoorActivityMod < 0 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
            )}>
              Outdoor {effects.outdoorActivityMod > 0 ? '+' : ''}{effects.outdoorActivityMod}%
            </Badge>
          )}
          {effects.moodMod !== 0 && (
            <Badge variant="secondary" className={cn(
              "text-xs",
              effects.moodMod < 0 ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
            )}>
              Mood {effects.moodMod > 0 ? '+' : ''}{effects.moodMod}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
