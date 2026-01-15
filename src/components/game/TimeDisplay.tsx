// Time Display - Shows in-game time of day with sunrise/sunset info
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Sun, Moon, Sunrise, Sunset, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeDisplayProps {
  gameHour: number; // 0-23
  onClose: () => void;
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

function getTimePhase(hour: number): keyof typeof TIME_PHASES {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 21) return 'dusk';
  return 'night';
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:00 ${period}`;
}

function getTimeUntil(currentHour: number, targetHour: number): number {
  if (targetHour > currentHour) {
    return targetHour - currentHour;
  }
  return (24 - currentHour) + targetHour;
}

function formatDuration(hours: number): string {
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

export function TimeDisplay({ gameHour, onClose }: TimeDisplayProps) {
  const phase = getTimePhase(gameHour);
  const phaseConfig = TIME_PHASES[phase];
  const PhaseIcon = phaseConfig.icon;
  
  // Sunrise is at 6:00, Sunset is at 20:00
  const SUNRISE_HOUR = 6;
  const SUNSET_HOUR = 20;
  
  const hoursUntilSunrise = getTimeUntil(gameHour, SUNRISE_HOUR);
  const hoursUntilSunset = getTimeUntil(gameHour, SUNSET_HOUR);
  
  const isNight = gameHour >= 20 || gameHour < 6;
  const isDaytime = !isNight;
  
  // Calculate day progress (6am = 0%, 8pm = 100%)
  const dayProgress = isDaytime 
    ? Math.min(100, Math.max(0, ((gameHour - 6) / 14) * 100))
    : 0;
  
  // Calculate night progress (8pm = 0%, 6am = 100%)
  const nightProgress = isNight
    ? gameHour >= 20 
      ? ((gameHour - 20) / 10) * 100
      : ((gameHour + 4) / 10) * 100
    : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex-row items-center justify-between border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Time of Day
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Current Time Display */}
          <div className="text-center space-y-2">
            <div className={cn("flex items-center justify-center gap-3", phaseConfig.color)}>
              <PhaseIcon className="w-10 h-10" />
              <div>
                <p className="text-3xl font-bold">{formatHour(gameHour)}</p>
                <p className="text-lg opacity-80">{phaseConfig.label}</p>
              </div>
            </div>
          </div>
          
          {/* Day/Night Progress */}
          <div className="space-y-3">
            {isDaytime ? (
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
        </CardContent>
      </Card>
    </div>
  );
}
