import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Screen shake effect
interface ShakeConfig {
  intensity: 'light' | 'medium' | 'heavy';
  duration: number;
}

// Time of day tinting
type TimeOfDay = 'dawn' | 'morning' | 'noon' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';

// Mood vignette
type MoodLevel = 'calm' | 'tense' | 'anxious' | 'critical';

interface ScreenEffectsState {
  shake: ShakeConfig | null;
  timeOfDay: TimeOfDay;
  mood: MoodLevel;
  weatherOverlay: string | null;
  flashColor: string | null;
}

interface ScreenEffectsContextType extends ScreenEffectsState {
  triggerShake: (intensity?: 'light' | 'medium' | 'heavy', duration?: number) => void;
  setTimeOfDay: (time: TimeOfDay) => void;
  setMood: (mood: MoodLevel) => void;
  setWeatherOverlay: (weather: string | null) => void;
  flashScreen: (color: string, duration?: number) => void;
}

const ScreenEffectsContext = createContext<ScreenEffectsContextType | null>(null);

export function useScreenEffects() {
  const context = useContext(ScreenEffectsContext);
  if (!context) {
    throw new Error('useScreenEffects must be used within ScreenEffectsProvider');
  }
  return context;
}

// Optional hook that doesn't throw
export function useScreenEffectsOptional() {
  return useContext(ScreenEffectsContext);
}

const TIME_TINTS: Record<TimeOfDay, { overlay: string; opacity: number }> = {
  dawn: { overlay: 'bg-gradient-to-b from-orange-500/10 via-pink-500/5 to-transparent', opacity: 0.15 },
  morning: { overlay: 'bg-gradient-to-b from-amber-300/5 via-transparent to-transparent', opacity: 0.08 },
  noon: { overlay: 'bg-gradient-to-b from-yellow-100/5 via-transparent to-transparent', opacity: 0.05 },
  afternoon: { overlay: 'bg-gradient-to-b from-amber-400/8 via-transparent to-transparent', opacity: 0.1 },
  dusk: { overlay: 'bg-gradient-to-b from-orange-600/15 via-pink-600/10 to-purple-900/10', opacity: 0.2 },
  evening: { overlay: 'bg-gradient-to-b from-indigo-900/15 via-purple-900/10 to-transparent', opacity: 0.18 },
  night: { overlay: 'bg-gradient-to-b from-blue-950/20 via-indigo-950/15 to-transparent', opacity: 0.25 },
  midnight: { overlay: 'bg-gradient-to-b from-slate-950/30 via-blue-950/20 to-transparent', opacity: 0.3 },
};

const MOOD_VIGNETTES: Record<MoodLevel, { color: string; intensity: number }> = {
  calm: { color: 'transparent', intensity: 0 },
  tense: { color: 'rgba(251, 146, 60, 0.15)', intensity: 0.3 },
  anxious: { color: 'rgba(239, 68, 68, 0.2)', intensity: 0.5 },
  critical: { color: 'rgba(220, 38, 38, 0.3)', intensity: 0.7 },
};

const SHAKE_INTENSITIES = {
  light: { x: 2, y: 2, rotation: 0.5 },
  medium: { x: 5, y: 5, rotation: 1 },
  heavy: { x: 10, y: 10, rotation: 2 },
};

export function ScreenEffectsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScreenEffectsState>({
    shake: null,
    timeOfDay: 'noon',
    mood: 'calm',
    weatherOverlay: null,
    flashColor: null,
  });

  const triggerShake = (intensity: 'light' | 'medium' | 'heavy' = 'medium', duration = 300) => {
    setState(prev => ({ ...prev, shake: { intensity, duration } }));
    setTimeout(() => {
      setState(prev => ({ ...prev, shake: null }));
    }, duration);
  };

  const flashScreen = (color: string, duration = 200) => {
    setState(prev => ({ ...prev, flashColor: color }));
    setTimeout(() => {
      setState(prev => ({ ...prev, flashColor: null }));
    }, duration);
  };

  const contextValue: ScreenEffectsContextType = {
    ...state,
    triggerShake,
    setTimeOfDay: (time) => setState(prev => ({ ...prev, timeOfDay: time })),
    setMood: (mood) => setState(prev => ({ ...prev, mood: mood })),
    setWeatherOverlay: (weather) => setState(prev => ({ ...prev, weatherOverlay: weather })),
    flashScreen,
  };

  return (
    <ScreenEffectsContext.Provider value={contextValue}>
      <ScreenEffectsLayer state={state} />
      <motion.div
        animate={state.shake ? {
          x: [0, -SHAKE_INTENSITIES[state.shake.intensity].x, SHAKE_INTENSITIES[state.shake.intensity].x, 0],
          y: [0, SHAKE_INTENSITIES[state.shake.intensity].y, -SHAKE_INTENSITIES[state.shake.intensity].y, 0],
          rotate: [0, -SHAKE_INTENSITIES[state.shake.intensity].rotation, SHAKE_INTENSITIES[state.shake.intensity].rotation, 0],
        } : {}}
        transition={state.shake ? {
          duration: state.shake.duration / 1000,
          ease: "easeInOut",
          times: [0, 0.25, 0.75, 1],
        } : {}}
      >
        {children}
      </motion.div>
    </ScreenEffectsContext.Provider>
  );
}

function ScreenEffectsLayer({ state }: { state: ScreenEffectsState }) {
  const timeTint = TIME_TINTS[state.timeOfDay];
  const moodVignette = MOOD_VIGNETTES[state.mood];

  return (
    <>
      {/* Time of day overlay */}
      <div 
        className={cn(
          "fixed inset-0 pointer-events-none z-30 transition-opacity duration-1000",
          timeTint.overlay
        )}
        style={{ opacity: timeTint.opacity }}
      />

      {/* Mood vignette */}
      <AnimatePresence>
        {moodVignette.intensity > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 pointer-events-none z-31"
            style={{
              background: `radial-gradient(ellipse at center, transparent 40%, ${moodVignette.color} 100%)`,
              opacity: moodVignette.intensity,
            }}
          />
        )}
      </AnimatePresence>

      {/* Weather edge effects */}
      <AnimatePresence>
        {state.weatherOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-29"
          >
            <WeatherEdgeEffect weather={state.weatherOverlay} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash effect */}
      <AnimatePresence>
        {state.flashColor && (
          <motion.div
            initial={{ opacity: 0.8 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 pointer-events-none z-50"
            style={{ backgroundColor: state.flashColor }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function WeatherEdgeEffect({ weather }: { weather: string }) {
  const weatherStyles: Record<string, string> = {
    rain: 'from-blue-500/20 via-transparent',
    storm: 'from-purple-600/25 via-transparent',
    snow: 'from-slate-200/20 via-transparent',
    fog: 'from-slate-400/30 via-slate-400/10',
    hot: 'from-orange-500/15 via-transparent',
    cold: 'from-cyan-400/20 via-transparent',
  };

  const gradient = weatherStyles[weather] || 'from-transparent via-transparent';

  return (
    <>
      {/* Top edge */}
      <div className={cn("absolute top-0 left-0 right-0 h-24 bg-gradient-to-b", gradient)} />
      {/* Left edge */}
      <div className={cn("absolute top-0 left-0 bottom-0 w-16 bg-gradient-to-r", gradient)} />
      {/* Right edge */}
      <div className={cn("absolute top-0 right-0 bottom-0 w-16 bg-gradient-to-l", gradient)} />
    </>
  );
}

// Combat hit effect component
export function CombatHitEffect({ 
  type, 
  onComplete 
}: { 
  type: 'hit' | 'miss' | 'critical' | 'block';
  onComplete?: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const effectStyles = {
    hit: 'bg-red-500/30',
    miss: 'bg-slate-500/20',
    critical: 'bg-yellow-500/40',
    block: 'bg-blue-500/25',
  };

  return (
    <motion.div
      initial={{ opacity: 0.8, scale: 1 }}
      animate={{ opacity: 0, scale: 1.2 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        "fixed inset-0 pointer-events-none z-45",
        effectStyles[type]
      )}
    />
  );
}
