import { useState, useEffect } from 'react';
import { User, Check } from 'lucide-react';
import { COLOR_PRESETS, ColorPreset, applyColorTheme } from '@/lib/colorTheme';
import { cn } from '@/lib/utils';

interface ColorSelectionScreenProps {
  onSelect: (colorId: string) => void;
  currentSelection?: string;
}

export function ColorSelectionScreen({ onSelect, currentSelection }: ColorSelectionScreenProps) {
  const [selected, setSelected] = useState(currentSelection || 'violet');
  const [previewColor, setPreviewColor] = useState<ColorPreset>(
    COLOR_PRESETS.find(c => c.id === selected) || COLOR_PRESETS[0]
  );
  
  // Apply preview colors temporarily
  useEffect(() => {
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      setPreviewColor(color);
      applyColorTheme(color, true); // Preview mode
    }
  }, [selected]);
  
  const handleConfirm = () => {
    const color = COLOR_PRESETS.find(c => c.id === selected);
    if (color) {
      applyColorTheme(color, false); // Permanent
    }
    onSelect(selected);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-background to-background-secondary">
      <div className="max-w-xl w-full text-center animate-fade-in">
        
        <h1 className="font-display text-3xl sm:text-4xl text-foreground mb-3 glow-text">
          Choose Your Style
        </h1>
        <p className="text-muted-foreground mb-8">
          Select your interface color theme
        </p>
        
        {/* Color Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-4 sm:gap-5 p-6 glass-panel mb-8">
          {COLOR_PRESETS.map(color => (
            <div key={color.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => setSelected(color.id)}
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-full cursor-pointer transition-all duration-300 relative",
                  "border-3 shadow-lg flex items-center justify-center",
                  selected === color.id 
                    ? "border-white scale-110" 
                    : "border-transparent hover:scale-115 hover:border-white/50"
                )}
                style={{ 
                  background: `linear-gradient(135deg, ${color.primary}, ${color.secondary})`,
                  boxShadow: selected === color.id 
                    ? `0 0 30px ${color.glow}, 0 8px 25px rgba(0, 0, 0, 0.4)` 
                    : `0 4px 15px rgba(0, 0, 0, 0.3)`
                }}
                aria-label={color.name}
              >
                {selected === color.id && (
                  <Check className="w-5 h-5 text-white drop-shadow-lg" />
                )}
              </button>
              <span className={cn(
                "text-xs transition-opacity duration-200 whitespace-nowrap",
                selected === color.id ? "text-foreground opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"
              )}>
                {color.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
        
        {/* Live Preview Panel */}
        <div className="glass-panel p-6 mb-8">
          <h3 className="font-display text-lg mb-5" style={{ color: previewColor.primary }}>
            Preview
          </h3>
          
          <div className="flex flex-col items-center gap-5">
            {/* Preview portrait frame */}
            <div 
              className="w-20 h-24 rounded-xl flex items-center justify-center"
              style={{ 
                border: `2px solid ${previewColor.primary}`,
                background: 'rgba(0, 0, 0, 0.3)',
                boxShadow: `0 0 20px ${previewColor.glow}`
              }}
            >
              <User className="w-8 h-8" style={{ color: previewColor.secondary }} />
            </div>
            
            {/* Preview stats */}
            <div className="w-full max-w-xs space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="w-14 text-muted-foreground">Health</span>
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: '75%',
                      background: 'linear-gradient(90deg, #dc2626, #ef4444)'
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="w-14 text-muted-foreground">Energy</span>
                <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: '60%',
                      background: `linear-gradient(90deg, ${previewColor.primary}, ${previewColor.secondary})`,
                      boxShadow: `0 0 8px ${previewColor.glow}`
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* Preview buttons */}
            <div className="flex gap-3">
              <button 
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ 
                  background: `linear-gradient(135deg, ${previewColor.primary}, ${previewColor.secondary})`,
                  boxShadow: `0 0 15px ${previewColor.glow}`
                }}
              >
                Action
              </button>
              <button 
                className="px-5 py-2.5 rounded-xl text-sm font-medium"
                style={{ 
                  background: 'transparent',
                  border: `1px solid ${previewColor.border}`,
                  color: previewColor.secondary
                }}
              >
                Cancel
              </button>
            </div>
            
            {/* Preview text sample */}
            <div className="flex items-center gap-4">
              <span 
                className="text-sm border-b border-dotted pb-0.5"
                style={{ 
                  color: previewColor.secondary,
                  borderColor: previewColor.primary
                }}
              >
                Character Name
              </span>
              <span 
                className="px-3 py-1 rounded-full text-xs"
                style={{ 
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: `1px solid ${previewColor.border}`,
                  color: previewColor.tertiary
                }}
              >
                😊 Happy
              </span>
            </div>
          </div>
        </div>
        
        {/* Confirm button */}
        <button 
          onClick={handleConfirm}
          className="glow-button text-lg px-12 py-4 animate-glow-pulse"
        >
          Confirm Style
        </button>
        
      </div>
    </div>
  );
}
