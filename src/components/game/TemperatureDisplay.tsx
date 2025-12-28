// Temperature Display Component - Shows weather + environmental temp + body temp

import { useMemo } from 'react';
import { 
  Sun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, Wind, Flame, 
  Thermometer, ThermometerSun, ThermometerSnowflake, Droplets
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WeatherType, WeatherState as TurnBasedWeatherState, WEATHER_CONFIGS } from '@/game/weatherSystem';
import { 
  TemperatureState, 
  getBodyTempCondition, 
  getBodyTempLabel, 
  getBodyTempColor,
  formatTemp,
  calculateBodyTemp,
  NORMAL_BODY_TEMP,
  BodyTempModifier
} from '@/game/temperatureSystem';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface TemperatureDisplayProps {
  weatherState?: TurnBasedWeatherState;
  temperatureState?: TemperatureState;
  activeConditions?: string[];
  hasBloodLoss?: boolean;
  isRealismMode?: boolean;
  compact?: boolean;
}

export function TemperatureDisplay({ 
  weatherState, 
  temperatureState,
  activeConditions = [],
  hasBloodLoss = false,
  isRealismMode = false,
  compact = false
}: TemperatureDisplayProps) {
  // Derive environmental temp from weather if no temp state
  const environmentalTemp = useMemo(() => {
    if (temperatureState?.environmental) return temperatureState.environmental;
    if (!weatherState) return 70; // Default
    
    // Estimate from weather type
    const weather = weatherState.current;
    const tempMap: Record<WeatherType, number> = {
      clear: 75,
      cloudy: 65,
      rain: 58,
      storm: 52,
      fog: 55,
      snow: 25,
      heat_wave: 105,
      wind: 55,
    };
    return tempMap[weather] || 70;
  }, [weatherState, temperatureState]);

  // Calculate body temperature with modifiers
  const { temp: bodyTemp, modifiers } = useMemo(() => {
    if (!temperatureState) {
      return calculateBodyTemp(NORMAL_BODY_TEMP, activeConditions, isRealismMode, hasBloodLoss);
    }
    return calculateBodyTemp(temperatureState.bodyTemp, activeConditions, isRealismMode, hasBloodLoss);
  }, [temperatureState, activeConditions, isRealismMode, hasBloodLoss]);

  const bodyCondition = getBodyTempCondition(bodyTemp);
  const bodyTempLabel = getBodyTempLabel(bodyCondition);
  const bodyTempColorClass = getBodyTempColor(bodyCondition);

  const getWeatherIcon = (weather: WeatherType) => {
    const iconClass = compact ? "w-4 h-4" : "w-5 h-5";
    switch (weather) {
      case 'clear': return <Sun className={cn(iconClass, "text-yellow-500")} />;
      case 'cloudy': return <Cloud className={cn(iconClass, "text-gray-400")} />;
      case 'rain': return <CloudRain className={cn(iconClass, "text-blue-400")} />;
      case 'storm': return <CloudLightning className={cn(iconClass, "text-purple-400")} />;
      case 'snow': return <CloudSnow className={cn(iconClass, "text-blue-200")} />;
      case 'fog': return <CloudFog className={cn(iconClass, "text-gray-300")} />;
      case 'heat_wave': return <Flame className={cn(iconClass, "text-orange-500")} />;
      case 'wind': return <Wind className={cn(iconClass, "text-cyan-400")} />;
      default: return <Cloud className={cn(iconClass, "text-gray-400")} />;
    }
  };

  const getBodyTempIcon = () => {
    const iconClass = compact ? "w-4 h-4" : "w-5 h-5";
    if (bodyTemp < 97) return <ThermometerSnowflake className={cn(iconClass, bodyTempColorClass)} />;
    if (bodyTemp > 100) return <ThermometerSun className={cn(iconClass, bodyTempColorClass)} />;
    return <Thermometer className={cn(iconClass, bodyTempColorClass)} />;
  };

  const weatherName = weatherState?.current 
    ? WEATHER_CONFIGS[weatherState.current]?.name || weatherState.current 
    : 'Unknown';

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-3">
          {/* Weather + Environmental Temp */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 cursor-help">
                {weatherState && getWeatherIcon(weatherState.current)}
                <span className="text-xs font-medium">{environmentalTemp}°F</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className="font-medium">{weatherName}</p>
              <p className="text-xs text-muted-foreground">Environmental: {formatTemp(environmentalTemp)}</p>
            </TooltipContent>
          </Tooltip>

          {/* Body Temp */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded-md cursor-help",
                bodyCondition === 'normal' ? "bg-muted/50" : "bg-muted/70"
              )}>
                {getBodyTempIcon()}
                <span className={cn("text-xs font-medium", bodyTempColorClass)}>
                  {formatTemp(bodyTemp)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p className={cn("font-medium", bodyTempColorClass)}>{bodyTempLabel}</p>
              <p className="text-xs text-muted-foreground">Body Temperature</p>
              {modifiers.length > 0 && (
                <div className="mt-1 pt-1 border-t border-border/50 space-y-0.5">
                  {modifiers.map((mod, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {mod.source}: {mod.effect > 0 ? '+' : ''}{mod.effect}°F
                    </p>
                  ))}
                </div>
              )}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  }

  // Full display for character sheet
  return (
    <div className="bg-background/50 rounded-lg p-3 border border-border/30 space-y-3">
      {/* Weather & Environmental Temperature */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {weatherState && getWeatherIcon(weatherState.current)}
          <div>
            <p className="text-sm font-medium">{weatherName}</p>
            <p className="text-xs text-muted-foreground">Current Weather</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{environmentalTemp}°F</p>
          <p className="text-xs text-muted-foreground">{formatTemp(environmentalTemp, 'C')}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/30" />

      {/* Body Temperature */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getBodyTempIcon()}
          <div>
            <p className={cn("text-sm font-medium", bodyTempColorClass)}>{bodyTempLabel}</p>
            <p className="text-xs text-muted-foreground">Body Temperature</p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-lg font-bold", bodyTempColorClass)}>{formatTemp(bodyTemp)}</p>
          <p className="text-xs text-muted-foreground">{formatTemp(bodyTemp, 'C')}</p>
        </div>
      </div>

      {/* Active Modifiers */}
      {modifiers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {modifiers.map((mod, i) => (
            <Badge 
              key={i} 
              variant="secondary" 
              className={cn(
                "text-xs",
                mod.effect > 0 ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
              )}
            >
              {mod.effect > 0 ? <Flame className="w-3 h-3 mr-1" /> : <Droplets className="w-3 h-3 mr-1" />}
              {mod.source}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
