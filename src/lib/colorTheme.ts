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
  category: 'classic' | 'nature' | 'cosmic' | 'elemental';
  effect?: 'shimmer' | 'pulse' | 'wave' | 'sparkle' | 'flame' | 'aurora' | 'frost' | 'ember';
}

export const COLOR_PRESETS: ColorPreset[] = [
  // === CLASSIC ===
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
    particles: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    category: 'classic',
    effect: 'shimmer'
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
    particles: ['#f43f5e', '#fb7185', '#fda4af'],
    category: 'classic',
    effect: 'pulse'
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
    particles: ['#22d3ee', '#67e8f9', '#a5f3fc'],
    category: 'classic',
    effect: 'wave'
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
    particles: ['#10b981', '#34d399', '#6ee7b7'],
    category: 'nature',
    effect: 'shimmer'
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
    particles: ['#f59e0b', '#fbbf24', '#fcd34d'],
    category: 'classic',
    effect: 'sparkle'
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
    particles: ['#3b82f6', '#60a5fa', '#93c5fd'],
    category: 'nature',
    effect: 'wave'
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
    particles: ['#ec4899', '#f472b6', '#f9a8d4'],
    category: 'classic',
    effect: 'pulse'
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
    particles: ['#ef4444', '#f87171', '#fca5a5'],
    category: 'elemental',
    effect: 'ember'
  },

  // === COSMIC ===
  { 
    id: 'midnight', 
    name: 'Midnight Abyss', 
    primary: '#312e81', 
    secondary: '#4338ca', 
    tertiary: '#6366f1',
    glow: 'rgba(67, 56, 202, 0.4)',
    glowIntense: 'rgba(67, 56, 202, 0.6)',
    border: 'rgba(67, 56, 202, 0.2)',
    bg: 'rgba(67, 56, 202, 0.1)',
    particles: ['#312e81', '#4338ca', '#6366f1'],
    category: 'cosmic',
    effect: 'shimmer'
  },
  { 
    id: 'nebula', 
    name: 'Nebula Dream', 
    primary: '#7c3aed', 
    secondary: '#c026d3', 
    tertiary: '#e879f9',
    glow: 'rgba(124, 58, 237, 0.4)',
    glowIntense: 'rgba(192, 38, 211, 0.6)',
    border: 'rgba(124, 58, 237, 0.2)',
    bg: 'rgba(124, 58, 237, 0.1)',
    particles: ['#7c3aed', '#c026d3', '#e879f9'],
    category: 'cosmic',
    effect: 'aurora'
  },
  { 
    id: 'stardust', 
    name: 'Stardust', 
    primary: '#a855f7', 
    secondary: '#e879f9', 
    tertiary: '#faf5ff',
    glow: 'rgba(168, 85, 247, 0.4)',
    glowIntense: 'rgba(232, 121, 249, 0.6)',
    border: 'rgba(168, 85, 247, 0.2)',
    bg: 'rgba(168, 85, 247, 0.1)',
    particles: ['#a855f7', '#e879f9', '#faf5ff'],
    category: 'cosmic',
    effect: 'sparkle'
  },

  // === NATURE ===
  { 
    id: 'sunset', 
    name: 'Sunset Blaze', 
    primary: '#f97316', 
    secondary: '#fb923c', 
    tertiary: '#fbbf24',
    glow: 'rgba(249, 115, 22, 0.4)',
    glowIntense: 'rgba(251, 146, 60, 0.6)',
    border: 'rgba(249, 115, 22, 0.2)',
    bg: 'rgba(249, 115, 22, 0.1)',
    particles: ['#f97316', '#fb923c', '#fbbf24'],
    category: 'nature',
    effect: 'ember'
  },
  { 
    id: 'aurora', 
    name: 'Aurora Borealis', 
    primary: '#22d3ee', 
    secondary: '#34d399', 
    tertiary: '#a78bfa',
    glow: 'rgba(34, 211, 238, 0.4)',
    glowIntense: 'rgba(52, 211, 153, 0.6)',
    border: 'rgba(34, 211, 238, 0.2)',
    bg: 'rgba(34, 211, 238, 0.1)',
    particles: ['#22d3ee', '#34d399', '#a78bfa'],
    category: 'nature',
    effect: 'aurora'
  },
  { 
    id: 'forest', 
    name: 'Enchanted Forest', 
    primary: '#166534', 
    secondary: '#22c55e', 
    tertiary: '#86efac',
    glow: 'rgba(22, 101, 52, 0.4)',
    glowIntense: 'rgba(34, 197, 94, 0.6)',
    border: 'rgba(22, 101, 52, 0.2)',
    bg: 'rgba(22, 101, 52, 0.1)',
    particles: ['#166534', '#22c55e', '#86efac'],
    category: 'nature',
    effect: 'shimmer'
  },
  { 
    id: 'ocean', 
    name: 'Deep Sea', 
    primary: '#0369a1', 
    secondary: '#0ea5e9', 
    tertiary: '#7dd3fc',
    glow: 'rgba(3, 105, 161, 0.4)',
    glowIntense: 'rgba(14, 165, 233, 0.6)',
    border: 'rgba(3, 105, 161, 0.2)',
    bg: 'rgba(3, 105, 161, 0.1)',
    particles: ['#0369a1', '#0ea5e9', '#7dd3fc'],
    category: 'nature',
    effect: 'wave'
  },

  // === ELEMENTAL ===
  { 
    id: 'volcanic', 
    name: 'Volcanic Fury', 
    primary: '#dc2626', 
    secondary: '#f97316', 
    tertiary: '#fbbf24',
    glow: 'rgba(220, 38, 38, 0.5)',
    glowIntense: 'rgba(249, 115, 22, 0.7)',
    border: 'rgba(220, 38, 38, 0.25)',
    bg: 'rgba(220, 38, 38, 0.12)',
    particles: ['#dc2626', '#f97316', '#fbbf24'],
    category: 'elemental',
    effect: 'flame'
  },
  { 
    id: 'arctic', 
    name: 'Arctic Frost', 
    primary: '#7dd3fc', 
    secondary: '#bae6fd', 
    tertiary: '#f0f9ff',
    glow: 'rgba(125, 211, 252, 0.4)',
    glowIntense: 'rgba(186, 230, 253, 0.6)',
    border: 'rgba(125, 211, 252, 0.25)',
    bg: 'rgba(125, 211, 252, 0.1)',
    particles: ['#7dd3fc', '#bae6fd', '#f0f9ff'],
    category: 'elemental',
    effect: 'frost'
  },
  { 
    id: 'storm', 
    name: 'Storm Surge', 
    primary: '#475569', 
    secondary: '#94a3b8', 
    tertiary: '#fbbf24',
    glow: 'rgba(71, 85, 105, 0.4)',
    glowIntense: 'rgba(251, 191, 36, 0.6)',
    border: 'rgba(71, 85, 105, 0.2)',
    bg: 'rgba(71, 85, 105, 0.1)',
    particles: ['#475569', '#94a3b8', '#fbbf24'],
    category: 'elemental',
    effect: 'pulse'
  },
  { 
    id: 'inferno', 
    name: 'Inferno', 
    primary: '#b91c1c', 
    secondary: '#dc2626', 
    tertiary: '#f87171',
    glow: 'rgba(185, 28, 28, 0.5)',
    glowIntense: 'rgba(220, 38, 38, 0.7)',
    border: 'rgba(185, 28, 28, 0.25)',
    bg: 'rgba(185, 28, 28, 0.12)',
    particles: ['#b91c1c', '#dc2626', '#f87171'],
    category: 'elemental',
    effect: 'flame'
  },
  { 
    id: 'glacier', 
    name: 'Glacier Blue', 
    primary: '#0891b2', 
    secondary: '#22d3ee', 
    tertiary: '#cffafe',
    glow: 'rgba(8, 145, 178, 0.4)',
    glowIntense: 'rgba(34, 211, 238, 0.6)',
    border: 'rgba(8, 145, 178, 0.2)',
    bg: 'rgba(8, 145, 178, 0.1)',
    particles: ['#0891b2', '#22d3ee', '#cffafe'],
    category: 'elemental',
    effect: 'frost'
  },

  // === SPECIAL ===
  { 
    id: 'gold', 
    name: 'Mythic Gold', 
    primary: '#eab308', 
    secondary: '#facc15', 
    tertiary: '#fef08a',
    glow: 'rgba(234, 179, 8, 0.5)',
    glowIntense: 'rgba(250, 204, 21, 0.7)',
    border: 'rgba(234, 179, 8, 0.25)',
    bg: 'rgba(234, 179, 8, 0.12)',
    particles: ['#eab308', '#facc15', '#fef08a'],
    category: 'classic',
    effect: 'sparkle'
  },
  { 
    id: 'obsidian', 
    name: 'Obsidian Night', 
    primary: '#334155', 
    secondary: '#64748b', 
    tertiary: '#94a3b8',
    glow: 'rgba(51, 65, 85, 0.4)',
    glowIntense: 'rgba(100, 116, 139, 0.6)',
    border: 'rgba(51, 65, 85, 0.3)',
    bg: 'rgba(51, 65, 85, 0.15)',
    particles: ['#334155', '#64748b', '#94a3b8'],
    category: 'cosmic',
    effect: 'shimmer'
  },
  { 
    id: 'phoenix', 
    name: 'Phoenix Fire', 
    primary: '#ea580c', 
    secondary: '#f59e0b', 
    tertiary: '#fcd34d',
    glow: 'rgba(234, 88, 12, 0.5)',
    glowIntense: 'rgba(245, 158, 11, 0.7)',
    border: 'rgba(234, 88, 12, 0.25)',
    bg: 'rgba(234, 88, 12, 0.12)',
    particles: ['#ea580c', '#f59e0b', '#fcd34d'],
    category: 'elemental',
    effect: 'flame'
  },
  { 
    id: 'sakura', 
    name: 'Sakura Bloom', 
    primary: '#f472b6', 
    secondary: '#fbcfe8', 
    tertiary: '#fdf2f8',
    glow: 'rgba(244, 114, 182, 0.4)',
    glowIntense: 'rgba(251, 207, 232, 0.6)',
    border: 'rgba(244, 114, 182, 0.2)',
    bg: 'rgba(244, 114, 182, 0.1)',
    particles: ['#f472b6', '#fbcfe8', '#fdf2f8'],
    category: 'nature',
    effect: 'sparkle'
  },
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
