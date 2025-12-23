// Color Theme System - Unified color presets and application
export interface ColorPreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  tertiary: string;
  glow: string;
  glowIntense: string;
  border: string;
  bg: string;
  particles: [string, string, string];
}

export const COLOR_PRESETS: ColorPreset[] = [
  { 
    id: 'violet', 
    name: 'Mystic Violet', 
    primary: '#8b5cf6', 
    secondary: '#a78bfa', 
    tertiary: '#c4b5fd',
    glow: 'rgba(139, 92, 246, 0.4)',
    glowIntense: 'rgba(139, 92, 246, 0.6)',
    border: 'rgba(139, 92, 246, 0.2)',
    bg: 'rgba(139, 92, 246, 0.1)',
    particles: ['#8b5cf6', '#a78bfa', '#c4b5fd']
  },
  { 
    id: 'rose', 
    name: 'Rose Gold', 
    primary: '#f43f5e', 
    secondary: '#fb7185', 
    tertiary: '#fda4af',
    glow: 'rgba(244, 63, 94, 0.4)',
    glowIntense: 'rgba(244, 63, 94, 0.6)',
    border: 'rgba(244, 63, 94, 0.2)',
    bg: 'rgba(244, 63, 94, 0.1)',
    particles: ['#f43f5e', '#fb7185', '#fda4af']
  },
  { 
    id: 'cyan', 
    name: 'Cyber Cyan', 
    primary: '#22d3ee', 
    secondary: '#67e8f9', 
    tertiary: '#a5f3fc',
    glow: 'rgba(34, 211, 238, 0.4)',
    glowIntense: 'rgba(34, 211, 238, 0.6)',
    border: 'rgba(34, 211, 238, 0.2)',
    bg: 'rgba(34, 211, 238, 0.1)',
    particles: ['#22d3ee', '#67e8f9', '#a5f3fc']
  },
  { 
    id: 'emerald', 
    name: 'Emerald Dream', 
    primary: '#10b981', 
    secondary: '#34d399', 
    tertiary: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.4)',
    glowIntense: 'rgba(16, 185, 129, 0.6)',
    border: 'rgba(16, 185, 129, 0.2)',
    bg: 'rgba(16, 185, 129, 0.1)',
    particles: ['#10b981', '#34d399', '#6ee7b7']
  },
  { 
    id: 'amber', 
    name: 'Golden Amber', 
    primary: '#f59e0b', 
    secondary: '#fbbf24', 
    tertiary: '#fcd34d',
    glow: 'rgba(245, 158, 11, 0.4)',
    glowIntense: 'rgba(245, 158, 11, 0.6)',
    border: 'rgba(245, 158, 11, 0.2)',
    bg: 'rgba(245, 158, 11, 0.1)',
    particles: ['#f59e0b', '#fbbf24', '#fcd34d']
  },
  { 
    id: 'blue', 
    name: 'Deep Ocean', 
    primary: '#3b82f6', 
    secondary: '#60a5fa', 
    tertiary: '#93c5fd',
    glow: 'rgba(59, 130, 246, 0.4)',
    glowIntense: 'rgba(59, 130, 246, 0.6)',
    border: 'rgba(59, 130, 246, 0.2)',
    bg: 'rgba(59, 130, 246, 0.1)',
    particles: ['#3b82f6', '#60a5fa', '#93c5fd']
  },
  { 
    id: 'pink', 
    name: 'Neon Pink', 
    primary: '#ec4899', 
    secondary: '#f472b6', 
    tertiary: '#f9a8d4',
    glow: 'rgba(236, 72, 153, 0.4)',
    glowIntense: 'rgba(236, 72, 153, 0.6)',
    border: 'rgba(236, 72, 153, 0.2)',
    bg: 'rgba(236, 72, 153, 0.1)',
    particles: ['#ec4899', '#f472b6', '#f9a8d4']
  },
  { 
    id: 'red', 
    name: 'Blood Moon', 
    primary: '#ef4444', 
    secondary: '#f87171', 
    tertiary: '#fca5a5',
    glow: 'rgba(239, 68, 68, 0.4)',
    glowIntense: 'rgba(239, 68, 68, 0.6)',
    border: 'rgba(239, 68, 68, 0.2)',
    bg: 'rgba(239, 68, 68, 0.1)',
    particles: ['#ef4444', '#f87171', '#fca5a5']
  },
  { 
    id: 'indigo', 
    name: 'Midnight Indigo', 
    primary: '#6366f1', 
    secondary: '#818cf8', 
    tertiary: '#a5b4fc',
    glow: 'rgba(99, 102, 241, 0.4)',
    glowIntense: 'rgba(99, 102, 241, 0.6)',
    border: 'rgba(99, 102, 241, 0.2)',
    bg: 'rgba(99, 102, 241, 0.1)',
    particles: ['#6366f1', '#818cf8', '#a5b4fc']
  },
  { 
    id: 'teal', 
    name: 'Teal Frost', 
    primary: '#14b8a6', 
    secondary: '#2dd4bf', 
    tertiary: '#5eead4',
    glow: 'rgba(20, 184, 166, 0.4)',
    glowIntense: 'rgba(20, 184, 166, 0.6)',
    border: 'rgba(20, 184, 166, 0.2)',
    bg: 'rgba(20, 184, 166, 0.1)',
    particles: ['#14b8a6', '#2dd4bf', '#5eead4']
  },
  { 
    id: 'orange', 
    name: 'Sunset Blaze', 
    primary: '#f97316', 
    secondary: '#fb923c', 
    tertiary: '#fdba74',
    glow: 'rgba(249, 115, 22, 0.4)',
    glowIntense: 'rgba(249, 115, 22, 0.6)',
    border: 'rgba(249, 115, 22, 0.2)',
    bg: 'rgba(249, 115, 22, 0.1)',
    particles: ['#f97316', '#fb923c', '#fdba74']
  },
  { 
    id: 'lime', 
    name: 'Toxic Lime', 
    primary: '#84cc16', 
    secondary: '#a3e635', 
    tertiary: '#bef264',
    glow: 'rgba(132, 204, 22, 0.4)',
    glowIntense: 'rgba(132, 204, 22, 0.6)',
    border: 'rgba(132, 204, 22, 0.2)',
    bg: 'rgba(132, 204, 22, 0.1)',
    particles: ['#84cc16', '#a3e635', '#bef264']
  }
];

// Helper to convert hex to HSL for CSS variables
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const COLOR_STORAGE_KEY = 'untold-ui-color-theme';

export function applyColorTheme(color: ColorPreset, isPreview = false): void {
  const root = document.documentElement;
  const hsl = hexToHsl(color.primary);
  
  // Core accent colors (as hex for direct use)
  root.style.setProperty('--accent-primary', color.primary);
  root.style.setProperty('--accent-secondary', color.secondary);
  root.style.setProperty('--accent-tertiary', color.tertiary);
  
  // Update primary HSL for Tailwind integration
  root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  
  // Glow effects
  root.style.setProperty('--accent-glow', color.glow);
  root.style.setProperty('--accent-glow-intense', color.glowIntense);
  root.style.setProperty('--glow-primary', `0 0 20px ${color.glow}`);
  root.style.setProperty('--glow-hover', `0 0 30px ${color.glowIntense}`);
  root.style.setProperty('--glow-intense', `0 0 40px ${color.glowIntense}`);
  
  // Borders and backgrounds
  root.style.setProperty('--accent-border', color.border);
  root.style.setProperty('--accent-bg', color.bg);
  root.style.setProperty('--glass-border', color.border);
  
  // Gradients
  root.style.setProperty('--gradient-start', color.primary);
  root.style.setProperty('--gradient-end', color.secondary);
  root.style.setProperty('--gradient-tertiary', color.tertiary);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${color.primary} 0%, ${color.secondary} 100%)`);
  
  // Particle colors
  root.style.setProperty('--particle-primary', color.particles[0]);
  root.style.setProperty('--particle-secondary', color.particles[1]);
  root.style.setProperty('--particle-tertiary', color.particles[2]);
  
  // Ambient glow colors
  root.style.setProperty('--ambient-primary', color.particles[0]);
  root.style.setProperty('--ambient-secondary', color.particles[1]);
  
  // Shadows
  root.style.setProperty('--shadow-accent', `0 0 20px ${color.glow}, 0 4px 15px rgba(0, 0, 0, 0.3)`);
  root.style.setProperty('--shadow-accent-hover', `0 0 30px ${color.glowIntense}, 0 6px 20px rgba(0, 0, 0, 0.4)`);
  
  // Store preference if not preview
  if (!isPreview) {
    localStorage.setItem(COLOR_STORAGE_KEY, color.id);
  }
}

export function loadColorPreference(): string {
  const savedId = localStorage.getItem(COLOR_STORAGE_KEY);
  if (savedId) {
    const color = COLOR_PRESETS.find(c => c.id === savedId);
    if (color) {
      applyColorTheme(color);
      return savedId;
    }
  }
  // Default to violet
  applyColorTheme(COLOR_PRESETS[0]);
  return 'violet';
}

export function getColorPreset(id: string): ColorPreset {
  return COLOR_PRESETS.find(c => c.id === id) || COLOR_PRESETS[0];
}

export function getSavedColorId(): string | null {
  return localStorage.getItem(COLOR_STORAGE_KEY);
}
