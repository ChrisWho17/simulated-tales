// Time Skip Modal - Allows players to skip forward in time with consequences
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, Clock, FastForward, AlertTriangle, Sun, Moon, 
  Sunrise, Sunset, Utensils, BedDouble, CloudRain 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  GameTimeState, 
  TimeSkipConsequence, 
  skipTime, 
  formatGameTime,
  isDaytime,
  getTimeOfDay 
} from '@/game/timeProgressionSystem';

interface TimeSkipModalProps {
  open: boolean;
  onClose: () => void;
  currentTimeState: GameTimeState;
  onTimeSkip: (newState: GameTimeState, consequences: TimeSkipConsequence[]) => void;
}

const PRESET_SKIPS = [
  { hours: 1, label: '1 Hour', icon: Clock },
  { hours: 4, label: '4 Hours', icon: FastForward },
  { hours: 8, label: '8 Hours', icon: BedDouble },
  { hours: 12, label: 'Half Day', icon: Sun },
];

export function TimeSkipModal({ 
  open, 
  onClose, 
  currentTimeState, 
  onTimeSkip 
}: TimeSkipModalProps) {
  const [hoursToSkip, setHoursToSkip] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [previewConsequences, setPreviewConsequences] = useState<TimeSkipConsequence[]>([]);
  
  if (!open) return null;
  
  // Calculate preview of resulting time
  const previewState = skipTime(currentTimeState, hoursToSkip);
  const resultingHour = previewState.newState.hour;
  const currentlyDay = isDaytime(currentTimeState.hour);
  const willBeDay = isDaytime(resultingHour);
  const crossesSunrise = !currentlyDay && willBeDay;
  const crossesSunset = currentlyDay && !willBeDay;
  
  const handlePreview = () => {
    const { events } = skipTime(currentTimeState, hoursToSkip);
    setPreviewConsequences(events);
    setShowConfirmation(true);
  };
  
  const handleConfirm = () => {
    const { newState, events } = skipTime(currentTimeState, hoursToSkip);
    onTimeSkip(newState, events);
    setShowConfirmation(false);
    onClose();
  };
  
  const getTimeIcon = (hour: number) => {
    const tod = getTimeOfDay(hour);
    if (tod === 'dawn') return <Sunrise className="w-5 h-5 text-orange-400" />;
    if (tod === 'morning' || tod === 'afternoon') return <Sun className="w-5 h-5 text-yellow-400" />;
    if (tod === 'evening' || tod === 'dusk') return <Sunset className="w-5 h-5 text-orange-500" />;
    return <Moon className="w-5 h-5 text-blue-400" />;
  };
  
  const getSeverityColor = (severity: TimeSkipConsequence['severity']) => {
    switch (severity) {
      case 'minor': return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'moderate': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'major': return 'bg-red-500/20 text-red-400 border-red-500/40';
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex-row items-center justify-between border-b pb-4">
          <CardTitle className="flex items-center gap-2">
            <FastForward className="w-5 h-5" />
            Time Skip
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {!showConfirmation ? (
            <>
              {/* Current Time */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  {getTimeIcon(currentTimeState.hour)}
                  <span className="text-sm">Current Time</span>
                </div>
                <span className="font-mono font-medium">
                  {formatGameTime(currentTimeState)}
                </span>
              </div>
              
              {/* Warning */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-500">The world moves around you</p>
                  <p className="text-muted-foreground mt-1">
                    While time passes, events may unfold, NPCs will go about their routines, 
                    and your character may be affected by hunger, fatigue, or unexpected encounters.
                  </p>
                </div>
              </div>
              
              {/* Time Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Skip Duration</span>
                  <span className="font-mono text-lg font-bold text-primary">
                    {hoursToSkip} hour{hoursToSkip !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <Slider
                  value={[hoursToSkip]}
                  onValueChange={([value]) => setHoursToSkip(value)}
                  min={1}
                  max={24}
                  step={1}
                  className="w-full"
                />
                
                {/* Preset buttons */}
                <div className="flex gap-2">
                  {PRESET_SKIPS.map(preset => (
                    <Button
                      key={preset.hours}
                      variant={hoursToSkip === preset.hours ? "default" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => setHoursToSkip(preset.hours)}
                    >
                      <preset.icon className="w-3 h-3 mr-1" />
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Preview Result */}
              <div className="space-y-2">
                <span className="text-sm text-muted-foreground">Result:</span>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2">
                    {getTimeIcon(resultingHour)}
                    <span className="text-sm font-medium">New Time</span>
                  </div>
                  <span className="font-mono font-bold">
                    {formatGameTime(previewState.newState)}
                  </span>
                </div>
                
                {/* Day/Night transition indicators */}
                {crossesSunrise && (
                  <div className="flex items-center gap-2 text-sm text-orange-400">
                    <Sunrise className="w-4 h-4" />
                    <span>You will witness the sunrise</span>
                  </div>
                )}
                {crossesSunset && (
                  <div className="flex items-center gap-2 text-sm text-purple-400">
                    <Sunset className="w-4 h-4" />
                    <span>Night will fall during this time</span>
                  </div>
                )}
              </div>
              
              <Button className="w-full" onClick={handlePreview}>
                Preview Consequences
              </Button>
            </>
          ) : (
            <>
              {/* Confirmation View */}
              <div className="text-center pb-2">
                <p className="text-lg font-medium">
                  Skip {hoursToSkip} hour{hoursToSkip !== 1 ? 's' : ''}?
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatGameTime(currentTimeState)} → {formatGameTime(previewState.newState)}
                </p>
              </div>
              
              <div className="space-y-2">
                <span className="text-sm font-medium">What happens during this time:</span>
                <ScrollArea className="h-48">
                  <div className="space-y-2 pr-2">
                    {previewConsequences.map((consequence, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border",
                          getSeverityColor(consequence.severity)
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {consequence.type === 'weather_change' && <CloudRain className="w-4 h-4 flex-shrink-0" />}
                          {consequence.type === 'hunger' && <Utensils className="w-4 h-4 flex-shrink-0" />}
                          {consequence.type === 'fatigue' && <BedDouble className="w-4 h-4 flex-shrink-0" />}
                          {!['weather_change', 'hunger', 'fatigue'].includes(consequence.type) && (
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <Badge variant="outline" className="text-xs mb-1">
                              {consequence.severity}
                            </Badge>
                            <p className="text-sm">{consequence.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setShowConfirmation(false)}
                >
                  Go Back
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleConfirm}
                >
                  <FastForward className="w-4 h-4 mr-2" />
                  Confirm Skip
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
