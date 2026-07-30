import { useState, useEffect, useMemo } from 'react';
import { Check, X, Palette, Sparkles, Flame, Snowflake, Waves, Zap, Sun, Star } from 'lucide-react';
import {
  COLOR_PRESETS,
  COLOR_TONES,
  ColorPreset,
  ColorTone,
  applyColorTheme,
  getPresetTone,
  getSavedColorId,
  DEFAULT_COLOR_ID,
} from '@/lib/colorTheme';
import { ThemeGrid } from '@/components/ui/ThemeGrid';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorSplashScreenProps {
  open: boolean;
  onClose: () => void;
}

// Effect icons mapping
const EFFECT_ICONS: Record<string, React.ReactNode> = {
  shimmer: <Sparkles className="w-3 h-3" />,
  pulse: <Zap className="w-3 h-3" />,
  wave: <Waves className="w-3 h-3" />,
  sparkle: <Star className="w-3 h-3" />,
  flame: <Flame className="w-3 h-3" />,
  aurora: <Sun className="w-3 h-3" />,
  frost: <Snowflake className="w-3 h-3" />,
  ember: <Flame className="w-3 h-3" />,
};

const TONE_LABELS: Record<ColorTone, string> = COLOR_TONES.reduce(
  (acc, entry) => ({ ...acc, [entry.id]: entry.label }),
  {} as Record<ColorTone, string>
);

// Background effect component
function ThemeEffect({ color, effect }: { color: ColorPreset; effect?: string }) {
  const particles = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 2,
      duration: Math.random() * 3 + 2,
    }));
  }, []);

  const getEffectAnimation = () => {
    switch (effect) {
      case 'flame':
      case 'ember':
        return {
          y: [0, -30, -60],
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.3],
        };
      case 'frost':
        return {
          y: [0, 20, 40],
          opacity: [0, 1, 0],
          rotate: [0, 180, 360],
        };
      case 'wave':
        return {
          x: [0, 20, 0, -20, 0],
          y: [0, -10, 0, -10, 0],
          opacity: [0.3, 1, 0.3],
        };
      case 'aurora':
        return {
          x: [0, 50, 0, -50, 0],
          opacity: [0.2, 0.8, 0.2],
          scale: [1, 1.5, 1],
        };
      case 'sparkle':
        return {
          scale: [0, 1, 0],
          opacity: [0, 1, 0],
          rotate: [0, 180, 360],
        };
      case 'pulse':
        return {
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 1, 0.3],
        };
      default: // shimmer
        return {
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.5],
        };
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[120px]"
        style={{ background: color.primary, opacity: 0.3 }}
      />
      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px]"
        style={{ background: color.secondary, opacity: 0.25 }}
      />

      {/* Particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            background: color.particles[particle.id % 3],
          }}
          animate={getEffectAnimation()}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function ColorSplashScreen({ open, onClose }: ColorSplashScreenProps) {
  const [selected, setSelected] = useState(() => getSavedColorId() || DEFAULT_COLOR_ID);
  const [originalColor, setOriginalColor] = useState<string | null>(null);
  
  // Store original color when opening
  useEffect(() => {
    if (open) {
      setOriginalColor(getSavedColorId() || DEFAULT_COLOR_ID);
      setSelected(getSavedColorId() || DEFAULT_COLOR_ID);
    }
  }, [open]);
  
  // Apply preview colors temporarily
  useEffect(() => {
    if (!open) return;
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      applyColorTheme(color, true);
    }
  }, [selected, open]);
  
  const handleConfirm = () => {
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      applyColorTheme(color, false);
    }
    onClose();
  };
  
  const handleCancel = () => {
    if (originalColor) {
      const color = COLOR_PRESETS.find(c => c.id === originalColor);
      if (color) {
        applyColorTheme(color, false);
      }
    }
    onClose();
  };

  const previewColor = COLOR_PRESETS.find(c => c.id === selected) || COLOR_PRESETS[0];

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dynamic background */}
          <div className="absolute inset-0 bg-background/98" />
          <ThemeEffect color={previewColor} effect={previewColor.effect} />
          
          <motion.div 
            className="relative z-10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide"
            initial={{ scale: 0.9, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 40, opacity: 0 }}
            transition={{ duration: 0.4, type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ background: `linear-gradient(135deg, ${previewColor.primary}, ${previewColor.secondary})` }}
              >
                <Palette className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-display text-3xl sm:text-4xl text-foreground mb-2"
              >
                Choose Your Style
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground"
              >
                Select a theme that defines your experience
              </motion.p>
            </div>
            
            {/* Color Grid — the tone rail and named swatches come from the shared picker */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass-panel p-4 sm:p-6 mb-6 text-left"
            >
              <ThemeGrid value={selected} onSelect={setSelected} />
            </motion.div>
            
            {/* Selected Theme Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-panel p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${previewColor.primary}, ${previewColor.secondary})`,
                      boxShadow: `0 0 20px ${previewColor.glow}`
                    }}
                  />
                  <div>
                    <h3 className="font-display text-lg text-foreground">{previewColor.name}</h3>
                    {previewColor.blurb && (
                      <p className="text-sm text-muted-foreground">{previewColor.blurb}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{TONE_LABELS[getPresetTone(previewColor)]}</span>
                      {previewColor.effect && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 capitalize">
                            {EFFECT_ICONS[previewColor.effect]}
                            {previewColor.effect}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Color swatches preview */}
                <div className="hidden sm:flex items-center gap-2">
                  {[previewColor.primary, previewColor.secondary, previewColor.tertiary].map((c, i) => (
                    <div 
                      key={i}
                      className="w-6 h-6 rounded-full border border-white/20"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex justify-center gap-4"
            >
              <button 
                onClick={handleCancel}
                className="px-6 py-3 rounded-xl text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border/30 transition-all duration-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="px-8 py-3 rounded-xl font-semibold text-white flex items-center gap-2 transition-all duration-300 hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${previewColor.primary}, ${previewColor.secondary})`,
                  boxShadow: `0 0 30px ${previewColor.glow}, 0 4px 20px rgba(0, 0, 0, 0.3)`
                }}
              >
                <Check className="w-4 h-4" />
                Apply Theme
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}