// Weather Forecast Modal - Meteorologist-style predictions with inaccuracy

import { useState, useMemo } from 'react';
import { 
  Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog, 
  Sun, Wind, Flame, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Thermometer, Droplets, Eye
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WeatherState, WeatherType, WEATHER_CONFIGS, WEATHER_GAMEPLAY_EFFECTS } from '@/game/weatherSystem';

interface WeatherForecastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weatherState: WeatherState;
}

interface ForecastPeriod {
  label: string;
  weather: WeatherType;
  confidence: number; // 0-100
  tempTrend: 'rising' | 'falling' | 'stable';
  precipitation: number; // 0-100 chance
}

// Generate forecasts with intentional inaccuracy
function generateForecast(weatherState: WeatherState): ForecastPeriod[] {
  const forecasts: ForecastPeriod[] = [];
  const currentWeather = weatherState.current;
  const ticksRemaining = weatherState.ticksRemaining;
  const totalDuration = weatherState.totalDuration;
  
  // Current conditions - high accuracy
  forecasts.push({
    label: 'Now',
    weather: currentWeather,
    confidence: 95 + Math.floor(Math.random() * 5),
    tempTrend: 'stable',
    precipitation: getPrecipitationChance(currentWeather),
  });
  
  // Near future (next few hours) - medium-high accuracy
  const progress = 1 - (ticksRemaining / totalDuration);
  let nextWeather = currentWeather;
  
  // If transitioning, use that
  if (weatherState.transitioningTo) {
    nextWeather = weatherState.transitioningTo;
  } else if (progress > 0.7) {
    // Weather is ending soon, guess at next
    nextWeather = predictNextWeather(currentWeather);
  }
  
  forecasts.push({
    label: 'Next Few Hours',
    weather: nextWeather,
    confidence: weatherState.transitioningTo ? 75 + Math.floor(Math.random() * 15) : 50 + Math.floor(Math.random() * 25),
    tempTrend: getTempTrend(currentWeather, nextWeather),
    precipitation: getPrecipitationChance(nextWeather),
  });
  
  // Later today - medium accuracy with potential for being wrong
  const laterWeather = maybeWrongPrediction(predictNextWeather(nextWeather), 30);
  forecasts.push({
    label: 'Later Today',
    weather: laterWeather,
    confidence: 35 + Math.floor(Math.random() * 30),
    tempTrend: getTempTrend(nextWeather, laterWeather),
    precipitation: getPrecipitationChance(laterWeather),
  });
  
  // Tomorrow - low accuracy, often wrong
  const tomorrowWeather = maybeWrongPrediction(predictNextWeather(laterWeather), 50);
  forecasts.push({
    label: 'Tomorrow',
    weather: tomorrowWeather,
    confidence: 20 + Math.floor(Math.random() * 25),
    tempTrend: getTempTrend(laterWeather, tomorrowWeather),
    precipitation: getPrecipitationChance(tomorrowWeather),
  });
  
  return forecasts;
}

function predictNextWeather(current: WeatherType): WeatherType {
  // Simple weather progression tendencies
  const progressions: Record<WeatherType, WeatherType[]> = {
    clear: ['clear', 'cloudy', 'wind'],
    cloudy: ['rain', 'clear', 'fog', 'cloudy'],
    rain: ['cloudy', 'storm', 'rain', 'clear'],
    storm: ['rain', 'cloudy', 'wind'],
    fog: ['cloudy', 'clear', 'rain'],
    snow: ['cloudy', 'snow', 'clear'],
    heat_wave: ['clear', 'heat_wave', 'cloudy'],
    wind: ['clear', 'cloudy', 'rain'],
  };
  
  const options = progressions[current] || ['clear'];
  return options[Math.floor(Math.random() * options.length)];
}

function maybeWrongPrediction(predicted: WeatherType, wrongChance: number): WeatherType {
  if (Math.random() * 100 < wrongChance) {
    // Return a random different weather
    const allWeather: WeatherType[] = ['clear', 'cloudy', 'rain', 'storm', 'fog', 'snow', 'heat_wave', 'wind'];
    const filtered = allWeather.filter(w => w !== predicted);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }
  return predicted;
}

function getPrecipitationChance(weather: WeatherType): number {
  const chances: Record<WeatherType, number> = {
    clear: 0,
    cloudy: 25,
    rain: 100,
    storm: 100,
    fog: 20,
    snow: 100,
    heat_wave: 0,
    wind: 15,
  };
  // Add some variance
  return Math.max(0, Math.min(100, (chances[weather] || 0) + (Math.random() * 20 - 10)));
}

function getTempTrend(from: WeatherType, to: WeatherType): 'rising' | 'falling' | 'stable' {
  const temps: Record<WeatherType, number> = {
    clear: 75,
    cloudy: 65,
    rain: 58,
    storm: 52,
    fog: 55,
    snow: 25,
    heat_wave: 105,
    wind: 55,
  };
  
  const diff = temps[to] - temps[from];
  if (diff > 5) return 'rising';
  if (diff < -5) return 'falling';
  return 'stable';
}

function getWeatherIcon(weather: WeatherType, className: string = "w-6 h-6") {
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

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-green-400";
  if (confidence >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return "High Confidence";
  if (confidence >= 50) return "Moderate Confidence";
  if (confidence >= 30) return "Low Confidence";
  return "Very Uncertain";
}

const METEOROLOGIST_PHRASES = [
  "Looking at the patterns, I'd say...",
  "My instruments are telling me...",
  "Based on my years of experience...",
  "The signs in the sky suggest...",
  "I've seen this pattern before...",
  "If my calculations are correct...",
  "The winds whisper of...",
];

export function WeatherForecastModal({ open, onOpenChange, weatherState }: WeatherForecastModalProps) {
  const forecasts = useMemo(() => generateForecast(weatherState), [weatherState, open]);
  const randomPhrase = useMemo(() => 
    METEOROLOGIST_PHRASES[Math.floor(Math.random() * METEOROLOGIST_PHRASES.length)], 
  [open]);
  
  const currentConfig = WEATHER_CONFIGS[weatherState.current];
  const currentEffects = WEATHER_GAMEPLAY_EFFECTS[weatherState.current];
  const intensity = weatherState.intensity > 1.2 ? 'Intense' : weatherState.intensity < 0.7 ? 'Mild' : 'Moderate';
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-gradient-to-b from-background to-background/95 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {getWeatherIcon(weatherState.current, "w-7 h-7")}
            <span>Weather Report</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Conditions Card */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">{currentConfig.name}</h3>
                <p className="text-sm text-muted-foreground">{intensity} conditions</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {Math.round(50 + (weatherState.intensity * 20) + (weatherState.current === 'heat_wave' ? 40 : weatherState.current === 'snow' ? -30 : 0))}°F
                </p>
                <p className="text-xs text-muted-foreground">Feels like</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground italic mb-3">
              {currentConfig.ambientText}
            </p>
            
            {/* Current Effects */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={currentEffects.visibilityMod >= 0 ? "text-green-400" : "text-red-400"}>
                  Vis {currentEffects.visibilityMod > 0 ? '+' : ''}{currentEffects.visibilityMod}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{Math.round(getPrecipitationChance(weatherState.current))}%</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{Math.abs(currentEffects.movementMod) < 5 ? 'Calm' : currentEffects.movementMod < -15 ? 'Strong' : 'Light'}</span>
              </div>
            </div>
          </div>
          
          {/* Meteorologist Quote */}
          <div className="bg-primary/5 rounded-lg p-3 border-l-2 border-primary/50">
            <p className="text-sm italic text-muted-foreground">
              "{randomPhrase}"
            </p>
          </div>
          
          {/* Forecast Grid */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Forecast <span className="text-xs text-muted-foreground font-normal">(may be inaccurate)</span>
            </h4>
            
            <div className="grid gap-2">
              {forecasts.slice(1).map((forecast, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between bg-muted/20 rounded-lg p-3 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    {getWeatherIcon(forecast.weather, "w-5 h-5")}
                    <div>
                      <p className="text-sm font-medium">{forecast.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {WEATHER_CONFIGS[forecast.weather].name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Temperature Trend */}
                    <div className="flex items-center gap-1">
                      {forecast.tempTrend === 'rising' && <TrendingUp className="w-4 h-4 text-red-400" />}
                      {forecast.tempTrend === 'falling' && <TrendingDown className="w-4 h-4 text-blue-400" />}
                      {forecast.tempTrend === 'stable' && <Minus className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    
                    {/* Precipitation */}
                    <div className="flex items-center gap-1 w-12">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xs">{Math.round(forecast.precipitation)}%</span>
                    </div>
                    
                    {/* Confidence */}
                    <div className="w-16 text-right">
                      <p className={cn("text-xs font-medium", getConfidenceColor(forecast.confidence))}>
                        {forecast.confidence}%
                      </p>
                      <Progress 
                        value={forecast.confidence} 
                        className="h-1 mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Disclaimer */}
          <p className="text-xs text-center text-muted-foreground italic">
            ⚠️ Forecasts beyond a few hours are notoriously unreliable. Trust at your own risk.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
