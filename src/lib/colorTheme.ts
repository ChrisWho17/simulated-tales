// Color Theme System - Unified color presets and application

/**
 * Picker grouping. `category` (below) predates this and describes subject matter;
 * `tone` describes how a palette *feels* on the page, which is what a player is
 * actually choosing between.
 */
export type ColorTone = 'warm' | 'cool' | 'editorial' | 'neon' | 'shadow';

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
  /** One-line atmosphere note shown beside the swatch. */
  blurb?: string;
  /** Filter rail grouping in the picker. Defaults to a guess from `category`. */
  tone?: ColorTone;
  /**
   * Far end of the hero gradient. Lets a preset pair two hues (copper into
   * verdigris, terracotta into dusk violet) instead of only tinting one.
   * Defaults to `secondary`.
   */
  gradientEnd?: string;
  /** Wash behind raised surfaces and overlay backdrops. Defaults to `bg`. */
  surfaceTint?: string;
  /** Halo behind narrative prose and scene chrome. Defaults to `glow`. */
  narrativeGlow?: string;
  /** Leads the first-run picker; the rest stay available in Settings. */
  featured?: boolean;
}

export const COLOR_PRESETS: ColorPreset[] = [
  // === EDITORIAL ===
  // Default. Warm brass on deep ink — deliberately lower glow alphas than the
  // other presets so the play chrome reads as editorial rather than neon.
  {
    id: 'ink',
    name: 'Ink & Ember',
    primary: '#d0a05f',
    secondary: '#e3c48d',
    tertiary: '#f2e2c4',
    glow: 'rgba(208, 160, 95, 0.26)',
    glowIntense: 'rgba(208, 160, 95, 0.4)',
    border: 'rgba(208, 160, 95, 0.22)',
    bg: 'rgba(208, 160, 95, 0.09)',
    particles: ['#d0a05f', '#e3c48d', '#f2e2c4'],
    category: 'classic',
    tone: 'editorial',
    effect: 'shimmer',
    blurb: 'Warm brass on deep ink. The house style.',
    featured: true,
  },
  {
    id: 'manuscript',
    name: 'Manuscript',
    primary: '#9c7f56',
    secondary: '#c4a87c',
    tertiary: '#ece0c8',
    glow: 'rgba(156, 127, 86, 0.24)',
    glowIntense: 'rgba(196, 168, 124, 0.38)',
    border: 'rgba(156, 127, 86, 0.24)',
    bg: 'rgba(156, 127, 86, 0.09)',
    particles: ['#9c7f56', '#c4a87c', '#ece0c8'],
    category: 'classic',
    tone: 'editorial',
    effect: 'shimmer',
    surfaceTint: 'rgba(196, 168, 124, 0.06)',
    narrativeGlow: 'rgba(236, 224, 200, 0.16)',
    blurb: 'Sepia and foxed paper. Quietest of the set.',
    featured: true,
  },
  {
    id: 'iron-quill',
    name: 'Iron & Quill',
    primary: '#7d8794',
    secondary: '#a9b3c0',
    tertiary: '#e4e9ef',
    glow: 'rgba(125, 135, 148, 0.28)',
    glowIntense: 'rgba(169, 179, 192, 0.44)',
    border: 'rgba(125, 135, 148, 0.26)',
    bg: 'rgba(125, 135, 148, 0.1)',
    particles: ['#7d8794', '#a9b3c0', '#e4e9ef'],
    category: 'classic',
    tone: 'editorial',
    effect: 'pulse',
    gradientEnd: '#5c6572',
    blurb: 'Cold iron and paper. Bureaucratic dread.',
  },
  {
    id: 'reliquary',
    name: 'Holy Ivory',
    primary: '#efe7d2',
    secondary: '#d9c9a3',
    tertiary: '#fffdf6',
    glow: 'rgba(239, 231, 210, 0.3)',
    glowIntense: 'rgba(255, 253, 246, 0.46)',
    border: 'rgba(239, 231, 210, 0.24)',
    bg: 'rgba(239, 231, 210, 0.08)',
    particles: ['#efe7d2', '#d9c9a3', '#fffdf6'],
    category: 'classic',
    tone: 'editorial',
    effect: 'sparkle',
    narrativeGlow: 'rgba(255, 253, 246, 0.2)',
    blurb: 'Bone, candlewax and gilt. Sacred and severe.',
    featured: true,
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
    tone: 'editorial',
    effect: 'pulse',
    gradientEnd: '#fbbf24',
    blurb: 'Slate cloud split by a lightning gold.',
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
    tone: 'editorial',
    effect: 'shimmer',
    blurb: 'Volcanic glass. Almost no colour at all.',
  },

  // === WARM ===
  {
    id: 'forge',
    name: 'Ember & Forge',
    primary: '#e2622b',
    secondary: '#f59e42',
    tertiary: '#ffd9a0',
    glow: 'rgba(226, 98, 43, 0.38)',
    glowIntense: 'rgba(245, 158, 66, 0.56)',
    border: 'rgba(226, 98, 43, 0.24)',
    bg: 'rgba(226, 98, 43, 0.11)',
    particles: ['#e2622b', '#f59e42', '#ffd9a0'],
    category: 'elemental',
    tone: 'warm',
    effect: 'flame',
    narrativeGlow: 'rgba(245, 158, 66, 0.22)',
    blurb: 'Hot iron on the anvil. Smiths and sieges.',
    featured: true,
  },
  {
    id: 'desert-dusk',
    name: 'Desert Dusk',
    primary: '#c97b5a',
    secondary: '#e0a878',
    tertiary: '#f6d9b0',
    glow: 'rgba(201, 123, 90, 0.34)',
    glowIntense: 'rgba(224, 168, 120, 0.5)',
    border: 'rgba(201, 123, 90, 0.24)',
    bg: 'rgba(201, 123, 90, 0.1)',
    particles: ['#c97b5a', '#e0a878', '#8a6a9c'],
    category: 'nature',
    tone: 'warm',
    effect: 'shimmer',
    gradientEnd: '#8a6a9c',
    surfaceTint: 'rgba(138, 106, 156, 0.07)',
    blurb: 'Terracotta bleeding into a violet horizon.',
    featured: true,
  },
  {
    id: 'copper-ruin',
    name: 'Copper Ruin',
    primary: '#b87333',
    secondary: '#d9a05b',
    tertiary: '#e6cfae',
    glow: 'rgba(184, 115, 51, 0.34)',
    glowIntense: 'rgba(110, 160, 138, 0.5)',
    border: 'rgba(184, 115, 51, 0.24)',
    bg: 'rgba(184, 115, 51, 0.1)',
    particles: ['#b87333', '#6ea08a', '#e6cfae'],
    category: 'elemental',
    tone: 'warm',
    effect: 'shimmer',
    gradientEnd: '#6ea08a',
    surfaceTint: 'rgba(110, 160, 138, 0.07)',
    blurb: 'Copper going green. Dead empires, wet stone.',
    featured: true,
  },
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
    tone: 'warm',
    effect: 'ember',
    blurb: 'Last light on the road out of town.',
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
    tone: 'warm',
    effect: 'flame',
    blurb: 'Rebirth by burning. Loud on purpose.',
  },
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
    tone: 'warm',
    effect: 'flame',
    gradientEnd: '#fbbf24',
    blurb: 'Magma under a thin crust.',
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
    tone: 'warm',
    effect: 'flame',
    blurb: 'Deep furnace red. No cool notes anywhere.',
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
    tone: 'warm',
    effect: 'sparkle',
    blurb: 'Lamplit taverns and honey light.',
  },
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
    tone: 'warm',
    effect: 'sparkle',
    blurb: 'Hoard gold. For treasure-hunt campaigns.',
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
    tone: 'warm',
    effect: 'pulse',
    blurb: 'Courtly romance with a knife behind it.',
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
    tone: 'warm',
    effect: 'sparkle',
    blurb: 'Petals and paper screens. Soft and brief.',
  },

  // === COOL ===
  {
    id: 'frost-steel',
    name: 'Frost & Steel',
    primary: '#8fa8bf',
    secondary: '#c6d8e6',
    tertiary: '#eef5fa',
    glow: 'rgba(143, 168, 191, 0.32)',
    glowIntense: 'rgba(198, 216, 230, 0.48)',
    border: 'rgba(143, 168, 191, 0.26)',
    bg: 'rgba(143, 168, 191, 0.1)',
    particles: ['#8fa8bf', '#c6d8e6', '#eef5fa'],
    category: 'elemental',
    tone: 'cool',
    effect: 'frost',
    gradientEnd: '#5f7791',
    narrativeGlow: 'rgba(198, 216, 230, 0.18)',
    blurb: 'Breath on a blade. Hard winters, hard people.',
    featured: true,
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
    tone: 'cool',
    effect: 'wave',
    blurb: 'Pressure and dark water. Nothing surfaces.',
    featured: true,
  },
  {
    id: 'moss-lantern',
    name: 'Moss & Lantern',
    primary: '#6b8a4e',
    secondary: '#a8bd6f',
    tertiary: '#e8d9a0',
    glow: 'rgba(107, 138, 78, 0.32)',
    glowIntense: 'rgba(217, 169, 79, 0.5)',
    border: 'rgba(107, 138, 78, 0.24)',
    bg: 'rgba(107, 138, 78, 0.1)',
    particles: ['#6b8a4e', '#a8bd6f', '#d9a94f'],
    category: 'nature',
    tone: 'cool',
    effect: 'shimmer',
    gradientEnd: '#d9a94f',
    surfaceTint: 'rgba(217, 169, 79, 0.06)',
    blurb: 'Damp green woods, one warm light in them.',
    featured: true,
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
    tone: 'cool',
    effect: 'shimmer',
    blurb: 'Old growth. Something is watching.',
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
    tone: 'cool',
    effect: 'shimmer',
    blurb: 'Bright jade. Fae bargains and clean magic.',
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
    tone: 'cool',
    effect: 'aurora',
    gradientEnd: '#a78bfa',
    blurb: 'Three hues sliding across a cold sky.',
    featured: true,
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
    tone: 'cool',
    effect: 'frost',
    blurb: 'Ice with blue depth to it.',
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
    tone: 'cool',
    effect: 'frost',
    blurb: 'Pale, bright, almost white. High contrast.',
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
    tone: 'cool',
    effect: 'wave',
    blurb: 'Straightforward blue. Reads well everywhere.',
  },

  // === NEON ===
  {
    id: 'neon-alley',
    name: 'Neon Alley',
    primary: '#ff2d78',
    secondary: '#22d3ee',
    tertiary: '#ffe066',
    glow: 'rgba(255, 45, 120, 0.42)',
    glowIntense: 'rgba(34, 211, 238, 0.62)',
    border: 'rgba(255, 45, 120, 0.26)',
    bg: 'rgba(255, 45, 120, 0.11)',
    particles: ['#ff2d78', '#22d3ee', '#ffe066'],
    category: 'classic',
    tone: 'neon',
    effect: 'pulse',
    gradientEnd: '#22d3ee',
    surfaceTint: 'rgba(34, 211, 238, 0.07)',
    blurb: 'Wet asphalt, sign glare, magenta and cyan.',
    featured: true,
  },
  {
    id: 'acid-rain',
    name: 'Acid Rain',
    primary: '#a3e635',
    secondary: '#34d399',
    tertiary: '#d9f99d',
    glow: 'rgba(163, 230, 53, 0.38)',
    glowIntense: 'rgba(52, 211, 153, 0.56)',
    border: 'rgba(163, 230, 53, 0.24)',
    bg: 'rgba(163, 230, 53, 0.1)',
    particles: ['#a3e635', '#34d399', '#0ea5e9'],
    category: 'elemental',
    tone: 'neon',
    effect: 'wave',
    gradientEnd: '#0ea5e9',
    blurb: 'Toxic lime under sodium light. Terminal green.',
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
    tone: 'neon',
    effect: 'wave',
    blurb: 'Clean HUD cyan. Ships and server rooms.',
  },
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
    tone: 'neon',
    effect: 'shimmer',
    blurb: 'The old default. Arcane and familiar.',
    featured: true,
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
    tone: 'neon',
    effect: 'pulse',
    blurb: 'One hue, turned all the way up.',
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
    tone: 'neon',
    effect: 'aurora',
    gradientEnd: '#e879f9',
    blurb: 'Gas clouds and starbirth. Deep space opera.',
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
    tone: 'neon',
    effect: 'sparkle',
    blurb: 'Glitter on black. Unashamedly pretty.',
  },

  // === SHADOW ===
  {
    id: 'void-silver',
    name: 'Void Silver',
    primary: '#9aa3b8',
    secondary: '#cfd6e6',
    tertiary: '#f2f4fa',
    glow: 'rgba(154, 163, 184, 0.3)',
    glowIntense: 'rgba(207, 214, 230, 0.46)',
    border: 'rgba(154, 163, 184, 0.24)',
    bg: 'rgba(154, 163, 184, 0.09)',
    particles: ['#9aa3b8', '#cfd6e6', '#6d5fa0'],
    category: 'cosmic',
    tone: 'shadow',
    effect: 'shimmer',
    gradientEnd: '#3b3455',
    surfaceTint: 'rgba(109, 95, 160, 0.07)',
    blurb: 'Starlight on nothing. Cold, indifferent silver.',
    featured: true,
  },
  {
    id: 'ashfall',
    name: 'Ashfall',
    primary: '#8a8378',
    secondary: '#b3a898',
    tertiary: '#efe6d8',
    glow: 'rgba(138, 131, 120, 0.3)',
    glowIntense: 'rgba(212, 116, 74, 0.5)',
    border: 'rgba(138, 131, 120, 0.26)',
    bg: 'rgba(138, 131, 120, 0.1)',
    particles: ['#8a8378', '#d4744a', '#efe6d8'],
    category: 'elemental',
    tone: 'shadow',
    effect: 'ember',
    gradientEnd: '#d4744a',
    surfaceTint: 'rgba(212, 116, 74, 0.06)',
    blurb: 'Grey fall with embers still in it. Post-collapse.',
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
    tone: 'shadow',
    effect: 'ember',
    blurb: 'Red hunting light. Horror and the hunt.',
    featured: true,
  },
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
    tone: 'shadow',
    effect: 'shimmer',
    blurb: 'Deep indigo. The hour nothing good happens.',
  },
];

/** Preset applied when the player has never picked a color. */
export const DEFAULT_COLOR_ID = COLOR_PRESETS[0].id;

const CATEGORY_TONE_FALLBACK: Record<ColorPreset['category'], ColorTone> = {
  classic: 'editorial',
  nature: 'cool',
  cosmic: 'shadow',
  elemental: 'warm',
};

export function getPresetTone(preset: ColorPreset): ColorTone {
  return preset.tone ?? CATEGORY_TONE_FALLBACK[preset.category];
}

export const COLOR_TONES: { id: ColorTone; label: string; hint: string }[] = [
  { id: 'editorial', label: 'Editorial', hint: 'Ink, paper, restrained metal' },
  { id: 'warm', label: 'Warm', hint: 'Fire, copper, low sun' },
  { id: 'cool', label: 'Cool', hint: 'Water, frost, deep green' },
  { id: 'neon', label: 'Neon', hint: 'Signage, screens, arcane light' },
  { id: 'shadow', label: 'Shadow', hint: 'Near-monochrome and after-dark' },
];

export function getPresetsByTone(tone: ColorTone): ColorPreset[] {
  return COLOR_PRESETS.filter(preset => getPresetTone(preset) === tone);
}

/** Curated short list for the first-run picker, where 37 swatches would stall the flow. */
export function getFeaturedPresets(): ColorPreset[] {
  const featured = COLOR_PRESETS.filter(preset => preset.featured);
  return featured.length > 0 ? featured : COLOR_PRESETS.slice(0, 12);
}

/** The three hues a swatch should show, in gradient order. */
export function getPresetSwatch(preset: ColorPreset): [string, string, string] {
  return [preset.primary, preset.secondary, preset.gradientEnd ?? preset.tertiary];
}

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

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

/** Accept #RGB / #RRGGBB (with or without #). Returns #rrggbb or null. */
export function normalizeHex(input: string): string | null {
  const raw = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toLowerCase()}`;
  }
  return null;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(208, 160, 95, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function lightenHex(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  const l = Math.min(96, Math.max(0, hsl.l + amount));
  return hslToHex(hsl.h, hsl.s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toByte = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

/**
 * Optional chrome overrides layered on top of a catalog preset.
 * Null means “follow the active preset” for that slot.
 */
export interface CustomUiColors {
  /** Hairlines, active tabs, primary chrome accent. */
  accent: string | null;
  /** Atmospheric wash over HUD / overlay surfaces. */
  panel: string | null;
  /** Secondary accent used for icons, labels, softer chrome text. */
  text: string | null;
}

export const DEFAULT_CUSTOM_UI_COLORS: CustomUiColors = {
  accent: null,
  panel: null,
  text: null,
};

export function hasCustomUiColors(colors: CustomUiColors | null | undefined): boolean {
  if (!colors) return false;
  return Boolean(colors.accent || colors.panel || colors.text);
}

export function normalizeCustomUiColors(
  partial: Partial<CustomUiColors> | null | undefined
): CustomUiColors {
  return {
    accent: partial?.accent ? normalizeHex(partial.accent) : null,
    panel: partial?.panel ? normalizeHex(partial.panel) : null,
    text: partial?.text ? normalizeHex(partial.text) : null,
  };
}

const COLOR_STORAGE_KEY = 'untold-ui-color-theme';
const CUSTOM_COLORS_STORAGE_KEY = 'untold-ui-custom-colors';

function writePresetVars(color: ColorPreset): void {
  const root = document.documentElement;
  const hsl = hexToHsl(color.primary);
  const gradientEnd = color.gradientEnd ?? color.secondary;
  const surfaceTint = color.surfaceTint ?? color.bg;
  const narrativeGlow = color.narrativeGlow ?? color.glow;

  root.style.setProperty('--accent-primary', color.primary);
  root.style.setProperty('--accent-secondary', color.secondary);
  root.style.setProperty('--accent-tertiary', color.tertiary);

  root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
  root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);

  root.style.setProperty('--accent-glow', color.glow);
  root.style.setProperty('--accent-glow-intense', color.glowIntense);
  root.style.setProperty('--glow-primary', `0 0 20px ${color.glow}`);
  root.style.setProperty('--glow-hover', `0 0 30px ${color.glowIntense}`);
  root.style.setProperty('--glow-intense', `0 0 40px ${color.glowIntense}`);

  root.style.setProperty('--accent-border', color.border);
  root.style.setProperty('--accent-bg', color.bg);
  root.style.setProperty('--glass-border', color.border);

  root.style.setProperty('--surface-tint', surfaceTint);
  root.style.setProperty('--overlay-wash', surfaceTint);
  root.style.setProperty('--narrative-glow', narrativeGlow);

  root.style.setProperty('--gradient-start', color.primary);
  root.style.setProperty('--gradient-end', gradientEnd);
  root.style.setProperty('--gradient-tertiary', color.tertiary);
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${color.primary} 0%, ${gradientEnd} 100%)`);

  root.style.setProperty('--particle-primary', color.particles[0]);
  root.style.setProperty('--particle-secondary', color.particles[1]);
  root.style.setProperty('--particle-tertiary', color.particles[2]);

  root.style.setProperty('--ambient-primary', color.particles[0]);
  root.style.setProperty('--ambient-secondary', color.particles[1]);

  root.style.setProperty('--shadow-accent', `0 0 20px ${color.glow}, 0 4px 15px rgba(0, 0, 0, 0.3)`);
  root.style.setProperty('--shadow-accent-hover', `0 0 30px ${color.glowIntense}, 0 6px 20px rgba(0, 0, 0, 0.4)`);
}

/** Tint CSS vars after a preset write. Only non-null slots override. */
function writeCustomUiColorOverrides(colors: CustomUiColors): void {
  const root = document.documentElement;

  if (colors.accent) {
    const accent = colors.accent;
    const hsl = hexToHsl(accent);
    const glow = rgbaFromHex(accent, 0.28);
    const glowIntense = rgbaFromHex(accent, 0.45);
    const border = rgbaFromHex(accent, 0.24);
    const bg = rgbaFromHex(accent, 0.1);
    const secondary = colors.text ?? lightenHex(accent, 14);
    const tertiary = lightenHex(accent, 28);
    const gradientEnd = colors.text ?? secondary;

    root.style.setProperty('--accent-primary', accent);
    root.style.setProperty('--accent-secondary', secondary);
    root.style.setProperty('--accent-tertiary', tertiary);
    root.style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
    root.style.setProperty('--accent-glow', glow);
    root.style.setProperty('--accent-glow-intense', glowIntense);
    root.style.setProperty('--glow-primary', `0 0 20px ${glow}`);
    root.style.setProperty('--glow-hover', `0 0 30px ${glowIntense}`);
    root.style.setProperty('--glow-intense', `0 0 40px ${glowIntense}`);
    root.style.setProperty('--accent-border', border);
    root.style.setProperty('--accent-bg', bg);
    root.style.setProperty('--glass-border', border);
    root.style.setProperty('--narrative-glow', glow);
    root.style.setProperty('--gradient-start', accent);
    root.style.setProperty('--gradient-end', gradientEnd);
    root.style.setProperty('--gradient-tertiary', tertiary);
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accent} 0%, ${gradientEnd} 100%)`);
    root.style.setProperty('--particle-primary', accent);
    root.style.setProperty('--particle-secondary', secondary);
    root.style.setProperty('--particle-tertiary', tertiary);
    root.style.setProperty('--ambient-primary', accent);
    root.style.setProperty('--ambient-secondary', secondary);
    root.style.setProperty('--shadow-accent', `0 0 20px ${glow}, 0 4px 15px rgba(0, 0, 0, 0.3)`);
    root.style.setProperty('--shadow-accent-hover', `0 0 30px ${glowIntense}, 0 6px 20px rgba(0, 0, 0, 0.4)`);

    if (!colors.panel) {
      root.style.setProperty('--surface-tint', bg);
      root.style.setProperty('--overlay-wash', rgbaFromHex(accent, 0.07));
    }
  }

  if (colors.panel) {
    const wash = rgbaFromHex(colors.panel, 0.1);
    const overlay = rgbaFromHex(colors.panel, 0.08);
    root.style.setProperty('--surface-tint', wash);
    root.style.setProperty('--overlay-wash', overlay);
  }

  if (colors.text) {
    const text = colors.text;
    root.style.setProperty('--accent-secondary', text);
    root.style.setProperty('--accent-tertiary', lightenHex(text, 16));
    root.style.setProperty('--gradient-end', text);
    root.style.setProperty('--particle-secondary', text);
    root.style.setProperty('--ambient-secondary', text);
    const primary = root.style.getPropertyValue('--accent-primary').trim() || text;
    root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${primary} 0%, ${text} 100%)`);
  }
}

export function loadCustomUiColors(): CustomUiColors {
  try {
    const raw = localStorage.getItem(CUSTOM_COLORS_STORAGE_KEY);
    if (raw) {
      return normalizeCustomUiColors(JSON.parse(raw));
    }
  } catch {
    // fall through
  }
  return { ...DEFAULT_CUSTOM_UI_COLORS };
}

export function saveCustomUiColors(colors: CustomUiColors): void {
  try {
    localStorage.setItem(CUSTOM_COLORS_STORAGE_KEY, JSON.stringify(normalizeCustomUiColors(colors)));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Apply a catalog preset. When not previewing, layers any saved custom chrome
 * colours on top so ThemeGrid presets stay intact while Accent/Panel/Text can tint.
 */
export function applyColorTheme(color: ColorPreset, isPreview = false): void {
  writePresetVars(color);

  if (!isPreview) {
    localStorage.setItem(COLOR_STORAGE_KEY, color.id);
    writeCustomUiColorOverrides(loadCustomUiColors());
  }
}

/** Re-write preset + custom overrides after the player edits Accent / Panel / Text. */
export function applyThemeWithCustomColors(
  color: ColorPreset,
  custom: CustomUiColors,
  isPreview = false
): void {
  const normalized = normalizeCustomUiColors(custom);
  writePresetVars(color);
  writeCustomUiColorOverrides(normalized);

  if (!isPreview) {
    localStorage.setItem(COLOR_STORAGE_KEY, color.id);
    saveCustomUiColors(normalized);
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
  applyColorTheme(COLOR_PRESETS[0]);
  return COLOR_PRESETS[0].id;
}

export function getColorPreset(id: string): ColorPreset {
  return COLOR_PRESETS.find(c => c.id === id) || COLOR_PRESETS[0];
}

export function getSavedColorId(): string | null {
  return localStorage.getItem(COLOR_STORAGE_KEY);
}
