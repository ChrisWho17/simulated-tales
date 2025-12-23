import { useState } from 'react';
import { Palette } from 'lucide-react';

interface ColorOption {
  name: string;
  hue: number;
  saturation: number;
  lightness: number;
  gradient: string;
  particles: [string, string, string]; // primary, secondary, tertiary
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Violet', hue: 262, saturation: 83, lightness: 66, gradient: '#8b5cf6, #d946ef', particles: ['#8b5cf6', '#d946ef', '#22d3ee'] },
  { name: 'Crimson', hue: 350, saturation: 89, lightness: 60, gradient: '#ef4444, #f43f5e', particles: ['#ef4444', '#f43f5e', '#fb923c'] },
  { name: 'Emerald', hue: 160, saturation: 84, lightness: 40, gradient: '#10b981, #14b8a6', particles: ['#10b981', '#14b8a6', '#22d3ee'] },
  { name: 'Ocean', hue: 200, saturation: 90, lightness: 50, gradient: '#0ea5e9, #06b6d4', particles: ['#0ea5e9', '#06b6d4', '#6366f1'] },
  { name: 'Amber', hue: 38, saturation: 92, lightness: 50, gradient: '#f59e0b, #eab308', particles: ['#f59e0b', '#eab308', '#fb923c'] },
  { name: 'Rose', hue: 330, saturation: 80, lightness: 60, gradient: '#ec4899, #f472b6', particles: ['#ec4899', '#f472b6', '#a855f7'] },
  { name: 'Cyan', hue: 187, saturation: 94, lightness: 48, gradient: '#22d3ee, #06b6d4', particles: ['#22d3ee', '#06b6d4', '#3b82f6'] },
  { name: 'Lime', hue: 84, saturation: 85, lightness: 45, gradient: '#84cc16, #a3e635', particles: ['#84cc16', '#a3e635', '#22c55e'] },
];

interface ColorPickerProps {
  onColorChange?: (color: ColorOption) => void;
}

export function ColorPicker({ onColorChange }: ColorPickerProps) {
  const [selectedColor, setSelectedColor] = useState<ColorOption>(COLOR_OPTIONS[0]);
  const [isOpen, setIsOpen] = useState(false);

  const applyColor = (color: ColorOption) => {
    const root = document.documentElement;
    
    // Update CSS variables
    root.style.setProperty('--primary', `${color.hue} ${color.saturation}% ${color.lightness}%`);
    root.style.setProperty('--ring', `${color.hue} ${color.saturation}% ${color.lightness}%`);
    
    // Update gradient colors
    const [gradStart, gradEnd] = color.gradient.split(', ');
    root.style.setProperty('--gradient-start', gradStart);
    root.style.setProperty('--gradient-end', gradEnd);
    
    // Update glow effects
    const glowColor = `rgba(${hslToRgb(color.hue, color.saturation, color.lightness).join(', ')})`;
    root.style.setProperty('--glow-primary', `0 0 20px ${glowColor.replace(')', ', 0.4)')}`);
    root.style.setProperty('--glow-hover', `0 0 30px ${glowColor.replace(')', ', 0.6)')}`);
    root.style.setProperty('--glow-intense', `0 0 40px ${glowColor.replace(')', ', 0.8)')}`);
    
    // Update glass border
    root.style.setProperty('--glass-border', `${glowColor.replace(')', ', 0.2)')}`);
    
    // Update particle colors for background effects
    root.style.setProperty('--particle-primary', color.particles[0]);
    root.style.setProperty('--particle-secondary', color.particles[1]);
    root.style.setProperty('--particle-tertiary', color.particles[2]);
    
    // Update ambient glow colors
    root.style.setProperty('--ambient-primary', color.particles[0]);
    root.style.setProperty('--ambient-secondary', color.particles[1]);
    
    setSelectedColor(color);
    onColorChange?.(color);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-black/30 border border-[rgba(255,255,255,0.1)] hover:border-primary/50 transition-all duration-300 group"
        title="Change theme color"
      >
        <Palette className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <div 
          className="w-5 h-5 rounded-full border border-white/20"
          style={{ background: `linear-gradient(135deg, ${selectedColor.gradient})` }}
        />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 p-3 glass-panel z-50 animate-scale-in">
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Theme Color</p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => applyColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                    selectedColor.name === color.name 
                      ? 'border-white scale-110 shadow-glow' 
                      : 'border-transparent hover:border-white/50'
                  }`}
                  style={{ background: `linear-gradient(135deg, ${color.gradient})` }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
