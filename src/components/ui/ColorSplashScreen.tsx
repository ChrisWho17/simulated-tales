import { useState, useEffect } from 'react';
import { Check, X, Palette } from 'lucide-react';
import { COLOR_PRESETS, ColorPreset, applyColorTheme, getSavedColorId } from '@/lib/colorTheme';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ColorSplashScreenProps {
  open: boolean;
  onClose: () => void;
}

export function ColorSplashScreen({ open, onClose }: ColorSplashScreenProps) {
  const [selected, setSelected] = useState(() => getSavedColorId() || 'violet');
  const [originalColor, setOriginalColor] = useState<string | null>(null);
  
  // Store original color when opening
  useEffect(() => {
    if (open) {
      setOriginalColor(getSavedColorId() || 'violet');
      setSelected(getSavedColorId() || 'violet');
    }
  }, [open]);
  
  // Apply preview colors temporarily
  useEffect(() => {
    if (!open) return;
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      applyColorTheme(color, true); // Preview mode
    }
  }, [selected, open]);
  
  const handleConfirm = () => {
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      applyColorTheme(color, false); // Permanent
    }
    onClose();
  };
  
  const handleCancel = () => {
    // Restore original color
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="w-full max-w-2xl p-6 sm:p-8"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Palette className="w-8 h-8 text-primary" />
                <h1 className="font-display text-3xl sm:text-4xl text-foreground glow-text">
                  Choose Your Style
                </h1>
              </div>
              <p className="text-muted-foreground">
                Select your interface color theme
              </p>
            </div>
            
            {/* Color Grid */}
            <div className="glass-panel p-6 mb-8">
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-3 sm:gap-4">
                {COLOR_PRESETS.map((color, index) => (
                  <motion.button
                    key={color.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => setSelected(color.id)}
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-full cursor-pointer transition-all duration-300 relative",
                      "border-2 shadow-lg flex items-center justify-center",
                      selected === color.id 
                        ? "border-white scale-110" 
                        : "border-transparent hover:scale-110 hover:border-white/50"
                    )}
                    style={{ 
                      background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                      boxShadow: selected === color.id 
                        ? `0 0 25px ${color.glow}, 0 6px 20px rgba(0, 0, 0, 0.4)` 
                        : `0 4px 12px rgba(0, 0, 0, 0.3)`
                    }}
                    title={color.name}
                  >
                    {selected === color.id && (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white drop-shadow-lg" />
                    )}
                  </motion.button>
                ))}
              </div>
              
              {/* Selected color name */}
              <div className="text-center mt-4">
                <span 
                  className="text-sm font-medium px-4 py-1.5 rounded-full"
                  style={{ 
                    background: previewColor.bg,
                    color: previewColor.primary,
                    border: `1px solid ${previewColor.border}`
                  }}
                >
                  {previewColor.name}
                </span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <button 
                onClick={handleCancel}
                className="px-6 py-3 rounded-xl text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border/30 transition-all duration-200 flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button 
                onClick={handleConfirm}
                className="glow-button px-8 py-3 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Confirm Style
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
