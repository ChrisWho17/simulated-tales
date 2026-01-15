// Time Display - Shows in-game time of day with weather forecast and time skip
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  X, Sun, Moon, Sunrise, Sunset, Clock, FastForward, 
  Cloud, CloudRain, CloudLightning, CloudFog, Snowflake, Wind, Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  GameTimeState, 
  formatGameTime, 
  formatGameDate,
  isDaytime,
  getHoursUntilSunrise,
  getHoursUntilSunset,
  getTimeOfDay,
  getExtendedForecast
} from '@/game/timeProgressionSystem';
import { 
  WeatherState, 
  WeatherType, 
  WEATHER_CONFIGS,
  generateWeatherForecast,
  ForecastEntry
} from '@/game/weatherSystem';

interface TimeDisplayProps {
  timeState: GameTimeState;
  weatherState?: WeatherState;
  onClose: () => void;
  onOpenTimeSkip?: () => void;
}

// Time of day phases with their hour ranges
const TIME_PHASES = {
  dawn: { start: 5, end: 7, label: 'Dawn', icon: Sunrise, color: 'text-orange-400' },
  morning: { start: 7, end: 12, label: 'Morning', icon: Sun, color: 'text-yellow-400' },
  afternoon: { start: 12, end: 17, label: 'Afternoon', icon: Sun, color: 'text-yellow-500' },
  evening: { start: 17, end: 20, label: 'Evening', icon: Sunset, color: 'text-orange-500' },
  dusk: { start: 20, end: 21, label: 'Dusk', icon: Sunset, color: 'text-purple-400' },
  night: { start: 21, end: 5, label: 'Night', icon: Moon, color: 'text-blue-400' },
};

const WEATHER_ICONS: Record<WeatherType, React.ReactNode> = {
  clear: <Sun className="w-4 h-4 text-yellow-400" />,
  cloudy: <Cloud className="w-4 h-4 text-gray-400" />,
  rain: <CloudRain className="w-4 h-4 text-blue-400" />,
  storm: <CloudLightning className="w-4 h-4 text-purple-400" />,
  fog: <CloudFog className="w-4 h-4 text-gray-300" />,
  snow: <Snowflake className="w-4 h-4 text-cyan-300" />,
  heat_wave: <Flame className="w-4 h-4 text-orange-500" />,
  wind: <Wind className="w-4 h-4 text-teal-400" />,
};

function formatDuration(hours: number): string {
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export function TimeDisplay({ timeState, weatherState, onClose, onOpenTimeSkip }: TimeDisplayProps) {
  const [activeTab, setActiveTab] = useState<'time' | 'forecast'>('time');
  
  const phase = getTimeOfDay(timeState.hour);
  const phaseConfig = TIME_PHASES[phase];
  const PhaseIcon = phaseConfig.icon;
  
  const hoursUntilSunrise = getHoursUntilSunrise(timeState.hour);
  const hoursUntilSunset = getHoursUntilSunset(timeState.hour);
  
  const isNight = !isDaytime(timeState.hour);
  const isDay = isDaytime(timeState.hour);
  
  // Calculate day progress (6am = 0%, 8pm = 100%)
  const dayProgress = isDay 
    ? Math.min(100, Math.max(0, ((timeState.hour - 6) / 14) * 100))
    : 0;
  
  // Calculate night progress (8pm = 0%, 6am = 100%)
  const nightProgress = isNight
    ? timeState.hour >= 20 
      ? ((timeState.hour - 20) / 10) * 100
      : ((timeState.hour + 4) / 10) * 100
    : 0;
    
  // Get weather forecast
  const weatherForecast = weatherState ? generateWeatherForecast(weatherState) : [];
  
  // Get extended hourly forecast
  const hourlyForecast = getExtendedForecast(timeState.hour, 12);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[85vh] flex flex-col">
        <CardHeader className="flex-row items-center justify-between border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time & Forecast
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden pt-4 flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'time' | 'forecast')} className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="time" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                Forecast
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="time" className="flex-1 space-y-4 mt-0">
              {/* Current Time Display */}
              <div className="text-center space-y-2">
                <div className={cn("flex items-center justify-center gap-3", phaseConfig.color)}>
                  <PhaseIcon className="w-10 h-10" />
                  <div>
                    <p className="text-3xl font-bold">{formatGameTime(timeState)}</p>
                    <p className="text-lg opacity-80">{phaseConfig.label}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatGameDate(timeState)}, Year {timeState.year}
                </p>
              </div>
              
              {/* Day/Night Progress */}
              <div className="space-y-3">
                {isDay ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Sunrise className="w-4 h-4" />
                        Sunrise
                      </span>
                      <span className="flex items-center gap-1 text-orange-500">
                        Sunset
                        <Sunset className="w-4 h-4" />
                      </span>
                    </div>
                    <Progress value={dayProgress} className="h-3" />
                    <p className="text-center text-sm text-muted-foreground">
                      Daylight remaining: ~{formatDuration(hoursUntilSunset)}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1 text-purple-400">
                        <Moon className="w-4 h-4" />
                        Nightfall
                      </span>
                      <span className="flex items-center gap-1 text-orange-400">
                        Dawn
                        <Sunrise className="w-4 h-4" />
                      </span>
                    </div>
                    <Progress value={nightProgress} className="h-3 [&>div]:bg-blue-500" />
                    <p className="text-center text-sm text-muted-foreground">
                      Time until sunrise: ~{formatDuration(hoursUntilSunrise)}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Current Weather Summary */}
              {weatherState && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    {WEATHER_ICONS[weatherState.current]}
                    <span className="text-sm">{WEATHER_CONFIGS[weatherState.current].name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {weatherState.transitioningTo 
                      ? `Changing to ${WEATHER_CONFIGS[weatherState.transitioningTo].name}`
                      : 'Stable'
                    }
                  </Badge>
                </div>
              )}
              
              {/* Time Hints */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm">What's happening now:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {phase === 'dawn' && (
                    <>
                      <li>• Early risers are waking up</li>
                      <li>• Shops will open soon</li>
                      <li>• Night creatures are retreating</li>
                    </>
                  )}
                  {phase === 'morning' && (
                    <>
                      <li>• Most shops are open</li>
                      <li>• Streets are getting busy</li>
                      <li>• Good time for business</li>
                    </>
                  )}
                  {phase === 'afternoon' && (
                    <>
                      <li>• Peak activity hours</li>
                      <li>• Markets are bustling</li>
                      <li>• Taverns serve food</li>
                    </>
                  )}
                  {phase === 'evening' && (
                    <>
                      <li>• Shops are closing</li>
                      <li>• Taverns are filling up</li>
                      <li>• People heading home</li>
                    </>
                  )}
                  {phase === 'dusk' && (
                    <>
                      <li>• Last light fading</li>
                      <li>• Torches being lit</li>
                      <li>• Night patrols beginning</li>
                    </>
                  )}
                  {phase === 'night' && (
                    <>
                      <li>• Most shops closed</li>
                      <li>• Taverns still open</li>
                      <li>• Streets less safe</li>
                    </>
                  )}
                </ul>
              </div>
              
              {/* Time Skip Button */}
              {onOpenTimeSkip && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    onClose();
                    onOpenTimeSkip();
                  }}
                >
                  <FastForward className="w-4 h-4 mr-2" />
                  Skip Time...
                </Button>
              )}
            </TabsContent>
            
            <TabsContent value="forecast" className="flex-1 mt-0">
              <ScrollArea className="h-80">
                <div className="space-y-4 pr-2">
                  {/* Weather Forecast */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Cloud className="w-4 h-4" />
                      Weather Outlook
                    </h4>
                    
                    {weatherForecast.length > 0 ? (
                      <div className="space-y-2">
                        {weatherForecast.map((forecast, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                          >
                            <div className="flex items-center gap-3">
                              {WEATHER_ICONS[forecast.predictedWeather]}
                              <div>
                                <p className="text-sm font-medium">
                                  {WEATHER_CONFIGS[forecast.predictedWeather].name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {forecast.label}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={cn(
                                "text-sm font-medium",
                                forecast.confidence >= 70 ? 'text-green-400' :
                                forecast.confidence >= 45 ? 'text-yellow-400' :
                                'text-red-400'
                              )}>
                                {forecast.confidence}%
                              </p>
                              <Progress 
                                value={forecast.confidence} 
                                className="h-1 w-16 mt-0.5" 
                              />
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-center text-muted-foreground italic">
                          ⚠️ Forecasts become less reliable over time
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No forecast data available
                      </p>
                    )}
                  </div>
                  
                  {/* Hourly Time Progression */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Upcoming Hours
                    </h4>
                    <div className="grid grid-cols-6 gap-2">
                      {hourlyForecast.slice(0, 12).map((hour, idx) => (
                        <div 
                          key={idx}
                          className={cn(
                            "flex flex-col items-center p-2 rounded text-center",
                            hour.isDay ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                          )}
                        >
                          {hour.isDay 
                            ? <Sun className="w-3 h-3 text-yellow-400" />
                            : <Moon className="w-3 h-3 text-blue-400" />
                          }
                          <span className="text-xs mt-1">{hour.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
