import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Type, Eye, Zap, Contrast, SunMoon } from 'lucide-react';

export interface AccessibilitySettings {
  textSize: 'small' | 'medium' | 'large' | 'x-large';
  reducedMotion: boolean;
  highContrast: boolean;
  dyslexiaFont: boolean;
  lineSpacing: 'normal' | 'relaxed' | 'loose';
  cursorSize: 'normal' | 'large';
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  textSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  dyslexiaFont: false,
  lineSpacing: 'normal',
  cursorSize: 'normal',
};

const STORAGE_KEY = 'untold-accessibility';

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

export function useAccessibilityOptional() {
  return useContext(AccessibilityContext);
}

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error('Failed to load accessibility settings:', e);
    }
    return { ...DEFAULT_ACCESSIBILITY };
  });

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Text size
    const textSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
      'x-large': '20px',
    };
    root.style.setProperty('--base-font-size', textSizes[settings.textSize]);
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Dyslexia font
    if (settings.dyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }
    
    // Line spacing
    const lineSpacings = {
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    };
    root.style.setProperty('--line-height-base', lineSpacings[settings.lineSpacing]);
    
    // Large cursor
    if (settings.cursorSize === 'large') {
      root.classList.add('large-cursor');
    } else {
      root.classList.remove('large-cursor');
    }
  }, [settings]);

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

// Settings panel component
export function AccessibilitySettingsPanel() {
  const { settings, updateSettings } = useAccessibility();

  const textSizeOptions: Array<{ value: AccessibilitySettings['textSize']; label: string }> = [
    { value: 'small', label: 'Small' },
    { value: 'medium', label: 'Medium' },
    { value: 'large', label: 'Large' },
    { value: 'x-large', label: 'Extra Large' },
  ];

  const lineSpacingOptions: Array<{ value: AccessibilitySettings['lineSpacing']; label: string }> = [
    { value: 'normal', label: 'Normal' },
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'loose', label: 'Loose' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-[var(--accent-secondary)]" />
        <h3 className="text-sm font-medium">Accessibility</h3>
      </div>

      {/* Text Size */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <Label className="text-sm">Text Size</Label>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {textSizeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => updateSettings({ textSize: option.value })}
              className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                settings.textSize === option.value
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Spacing */}
      <div className="space-y-3">
        <Label className="text-sm">Line Spacing</Label>
        <div className="grid grid-cols-3 gap-2">
          {lineSpacingOptions.map(option => (
            <button
              key={option.value}
              onClick={() => updateSettings({ lineSpacing: option.value })}
              className={`px-3 py-2 text-xs rounded-md border transition-colors ${
                settings.lineSpacing === option.value
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-bg)] text-[var(--accent-primary)]'
                  : 'border-border/50 hover:border-border'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reduced Motion */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-sm">Reduced Motion</Label>
            <p className="text-xs text-muted-foreground">Minimize animations</p>
          </div>
        </div>
        <Switch
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => updateSettings({ reducedMotion: checked })}
        />
      </div>

      {/* High Contrast */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Contrast className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-sm">High Contrast</Label>
            <p className="text-xs text-muted-foreground">Increase text contrast</p>
          </div>
        </div>
        <Switch
          checked={settings.highContrast}
          onCheckedChange={(checked) => updateSettings({ highContrast: checked })}
        />
      </div>

      {/* Dyslexia-friendly Font */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-sm">Dyslexia-Friendly Font</Label>
            <p className="text-xs text-muted-foreground">Use OpenDyslexic font</p>
          </div>
        </div>
        <Switch
          checked={settings.dyslexiaFont}
          onCheckedChange={(checked) => updateSettings({ dyslexiaFont: checked })}
        />
      </div>

      {/* Large Cursor */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <SunMoon className="w-4 h-4 text-muted-foreground" />
          <div>
            <Label className="text-sm">Large Cursor</Label>
            <p className="text-xs text-muted-foreground">Increase cursor size</p>
          </div>
        </div>
        <Switch
          checked={settings.cursorSize === 'large'}
          onCheckedChange={(checked) => updateSettings({ cursorSize: checked ? 'large' : 'normal' })}
        />
      </div>
    </div>
  );
}
