// Weather Forecast Hover - Shows forecast preview on hover
import React, { useState, useMemo } from 'react';
import { 
  Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, 
  Sun, Wind, Flame, TrendingUp, TrendingDown, Minus,
  Droplets, Eye
} from 'lucide-react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';
import { WeatherState, WeatherType, WEATHER_CONFIGS, WEATHER_GAMEPLAY_EFFECTS } from '@/game/weatherSystem';

interface WeatherForecastHoverProps {
  weatherState: WeatherState;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

interface ForecastPeriod {
  label: string;
  weather: WeatherType;
  confidence: number;
  tempTrend: 'rising' | 'falling' | 'stable';
}

// Generate simplified forecast
function generateQuickForecast(weatherState: WeatherState): ForecastPeriod[] {
  const forecasts: ForecastPeriod[] = [];
  const currentWeather = weatherState.current;
  
  // Next few hours
  let nextWeather = currentWeather;
  if (weatherState.transitioningTo) {
    nextWeather = weatherState.transitioningTo;
  } else if (weatherState.ticksRemaining < weatherState.totalDuration * 0.3) {
    nextWeather = predictNextWeather(currentWeather);
  }
  
  forecasts.push({
    label: 'Soon',
    weather: nextWeather,
    confidence: weatherState.transitioningTo ? 80 : 55,
    tempTrend: getTempTrend(currentWeather, nextWeather),
  });
  
  // Later
  const laterWeather = predictNextWeather(nextWeather);
  forecasts.push({
    label: 'Later',
    weather: Math.random() > 0.3 ? laterWeather : randomWeather(laterWeather),
    confidence: 35,
    tempTrend: getTempTrend(nextWeather, laterWeather),
  });
  
  return forecasts;
}

function predictNextWeather(current: WeatherType): WeatherType {
  const progressions: Record<WeatherType, WeatherType[]> = {
    clear: ['clear', 'cloudy', 'wind'],
    cloudy: ['rain', 'clear', 'fog'],
    rain: ['cloudy', 'storm', 'clear'],
    storm: ['rain', 'cloudy', 'wind'],
    fog: ['cloudy', 'clear'],
    snow: ['cloudy', 'snow', 'clear'],
    heat_wave: ['clear', 'cloudy'],
    wind: ['clear', 'cloudy', 'rain'],
  };
  const options = progressions[current] || ['clear'];
  return options[Math.floor(Math.random() * options.length)];
}

function randomWeather(exclude: WeatherType): WeatherType {
  const all: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'wind'];
  const filtered = all.filter(w => w !== exclude);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

function getTempTrend(from: WeatherType, to: WeatherType): 'rising' | 'falling' | 'stable' {
  const temps: Record<WeatherType, number> = {
    clear: 75, cloudy: 65, rain: 58, storm: 52,
    fog: 55, snow: 25, heat_wave: 105, wind: 55,
  };
  const diff = temps[to] - temps[from];
  if (diff > 5) return 'rising';
  if (diff < -5) return 'falling';
  return 'stable';
}

function getWeatherIcon(weather: WeatherType, className: string = "w-4 h-4") {
  switch (weather) {
    case 'clear': return <Sun className={cn(className, "text-yellow-500")} />;
    case 'cloudy': return <Cloud className={cn(className, "text-gray-400")} />;
    case 'rain': return <CloudRain className={cn(className, "text-blue-400")} />;
    case 'storm': return <CloudLightning className={cn(className, "text-purple-400")} />;
    case 'snow': return <CloudSnow className={cn(className, "text-blue-200")} />;
    case 'fog': return <CloudFog className={cn(className, "text-gray-300")} />;
    case 'heat_wave': return <Flame className={cn(className, "text-orange-500")} />;
    case 'wind': return <Wind className={cn(className, "text-cyan-400")} />;
    default: return <Cloud className={cn(className, "text-gray-400")} />;
  }
}

export function WeatherForecastHover({ weatherState, children, side = 'bottom' }: WeatherForecastHoverProps) {
  const forecasts = useMemo(() => generateQuickForecast(weatherState), [weatherState]);
  const config = WEATHER_CONFIGS[weatherState.current];
  const effects = WEATHER_GAMEPLAY_EFFECTS[weatherState.current];
  const intensity = weatherState.intensity > 1.2 ? 'Intense' : weatherState.intensity < 0.7 ? 'Mild' : 'Moderate';
  
  // Calculate approximate temperature
  const baseTemp = {
    clear: 72, cloudy: 65, rain: 55, storm: 50,
    fog: 52, snow: 28, heat_wave: 98, wind: 58
  }[weatherState.current] || 65;
  const temp = Math.round(baseTemp + (weatherState.intensity - 1) * 10);
  
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side={side} className="w-72 p-0 overflow-hidden">
        {/* Current conditions header */}
        <div className="p-3 bg-gradient-to-b from-muted/50 to-transparent border-b border-border/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getWeatherIcon(weatherState.current, "w-6 h-6")}
              <div>
                <p className="font-semibold text-sm">{config.name}</p>
                <p className="text-xs text-muted-foreground">{intensity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{temp}°F</p>
            </div>
          </div>
        </div>
        
        {/* Effects */}
        <div className="px-3 py-2 border-b border-border/20">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-muted-foreground" />
              <span className={effects.visibilityMod >= 0 ? "text-green-400" : "text-amber-400"}>
                {effects.visibilityMod > 0 ? '+' : ''}{effects.visibilityMod}%
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-blue-400" />
              <span>{weatherState.current === 'rain' || weatherState.current === 'storm' || weatherState.current === 'snow' ? 'Active' : 'None'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-cyan-400" />
              <span>{Math.abs(effects.movementMod) < 5 ? 'Calm' : 'Breezy'}</span>
            </div>
          </div>
        </div>
        
        {/* Quick forecast */}
        <div className="p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
            Forecast <span className="opacity-50">(uncertain)</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {forecasts.map((forecast, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 border border-border/20"
              >
                {getWeatherIcon(forecast.weather, "w-4 h-4")}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{forecast.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {WEATHER_CONFIGS[forecast.weather]?.name || forecast.weather}
                  </p>
                </div>
                <div className="flex items-center">
                  {forecast.tempTrend === 'rising' && <TrendingUp className="w-3 h-3 text-red-400" />}
                  {forecast.tempTrend === 'falling' && <TrendingDown className="w-3 h-3 text-blue-400" />}
                  {forecast.tempTrend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-center text-muted-foreground italic pt-1">
            ⚠️ Forecasts may be inaccurate
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
