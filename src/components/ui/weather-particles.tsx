import { useEffect, useMemo, useRef } from 'react';
import type { WeatherType } from '@/game/weatherSystem';

/**
 * Weather visuals used to be derived from the player's *mood* — clear skies
 * rendered green "happy" motes and a heat wave rendered rising fire. The layer
 * now reads the actual weather state, uses restrained atmospheric palettes that
 * sit behind the theme instead of fighting it, and draws nothing at all when the
 * sky is clear.
 */

interface WeatherParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  length?: number;
  wobble?: number;
  wobbleSpeed?: number;
  drift?: number;
}

type ParticleShape = 'streak' | 'flake' | 'haze' | 'mote' | 'gust';

interface WeatherVisual {
  shape: ParticleShape;
  /** Particle budget at intensity 1. Scaled by intensity and clamped. */
  count: number;
  speed: number;
  size: { min: number; max: number };
  /** rgb triplet — alpha is applied per particle so it stays subtle. */
  rgb: [number, number, number];
  /** Full-canvas wash that sells the condition more cheaply than particles. */
  tint?: string;
  lightning?: boolean;
  /** Overall layer opacity ceiling. */
  maxOpacity: number;
}

const WEATHER_VISUALS: Record<WeatherType, WeatherVisual | null> = {
  // Clear skies get no overlay at all — the cleanest possible read.
  clear: null,
  cloudy: {
    shape: 'haze',
    count: 10,
    speed: 0.12,
    size: { min: 90, max: 190 },
    rgb: [188, 196, 208],
    tint: 'rgba(140, 152, 170, 0.05)',
    maxOpacity: 0.5,
  },
  rain: {
    shape: 'streak',
    count: 90,
    speed: 9,
    size: { min: 0.8, max: 1.4 },
    rgb: [170, 198, 226],
    tint: 'rgba(96, 124, 158, 0.08)',
    maxOpacity: 0.62,
  },
  storm: {
    shape: 'streak',
    count: 150,
    speed: 14,
    size: { min: 1, max: 1.9 },
    rgb: [196, 214, 238],
    tint: 'rgba(58, 72, 100, 0.14)',
    lightning: true,
    maxOpacity: 0.72,
  },
  snow: {
    shape: 'flake',
    count: 70,
    speed: 0.9,
    size: { min: 1.2, max: 3 },
    rgb: [236, 244, 255],
    tint: 'rgba(180, 202, 226, 0.07)',
    maxOpacity: 0.7,
  },
  fog: {
    shape: 'haze',
    count: 16,
    speed: 0.16,
    size: { min: 120, max: 240 },
    rgb: [214, 218, 226],
    tint: 'rgba(198, 204, 214, 0.12)',
    maxOpacity: 0.55,
  },
  heat_wave: {
    // Shimmer rising off hot ground, not flames.
    shape: 'mote',
    count: 34,
    speed: 0.5,
    size: { min: 1, max: 2.6 },
    rgb: [246, 220, 176],
    tint: 'rgba(226, 170, 96, 0.07)',
    maxOpacity: 0.4,
  },
  wind: {
    shape: 'gust',
    count: 42,
    speed: 6,
    size: { min: 1, max: 2.2 },
    rgb: [214, 214, 206],
    tint: 'rgba(168, 164, 150, 0.05)',
    maxOpacity: 0.45,
  },
};

const MAX_PARTICLES = 190;

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

interface WeatherParticlesProps {
  weather: WeatherType;
  /** weatherState.intensity, roughly 0.5–1.5. */
  intensity?: number;
  /** 0–1, drives cross-fades between conditions. */
  transitionOpacity?: number;
  className?: string;
}

export function WeatherParticles({
  weather,
  intensity = 1,
  transitionOpacity = 1,
  className = '',
}: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<WeatherParticle[]>([]);
  const animationRef = useRef<number>();
  const flashRef = useRef<number>(0);

  const visual = WEATHER_VISUALS[weather] ?? null;
  const reducedMotion = useMemo(prefersReducedMotion, []);

  // Clamp so a stacked intensity spike can never flood the canvas.
  const particleCount = useMemo(() => {
    if (!visual) return 0;
    const scaled = visual.count * Math.max(0.3, Math.min(intensity, 1.6));
    return Math.min(MAX_PARTICLES, Math.round(reducedMotion ? scaled * 0.3 : scaled));
  }, [visual, intensity, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !visual || particleCount === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const speedScale = reducedMotion ? 0.35 : 1;
    const [r, g, b] = visual.rgb;

    const spawn = (initial: boolean): WeatherParticle => {
      const size = visual.size.min + Math.random() * (visual.size.max - visual.size.min);
      const base = {
        x: Math.random() * canvas.width,
        y: initial ? Math.random() * canvas.height : -size * 2 - Math.random() * 120,
        size,
        speedX: 0,
        speedY: 0,
        opacity: 0.25 + Math.random() * 0.45,
      };

      switch (visual.shape) {
        case 'streak':
          return {
            ...base,
            speedX: (0.6 + Math.random() * 0.8) * speedScale,
            speedY: (visual.speed + Math.random() * visual.speed * 0.5) * speedScale,
            length: 12 + Math.random() * 20,
            opacity: 0.22 + Math.random() * 0.3,
          };
        case 'flake':
          return {
            ...base,
            speedX: (Math.random() - 0.5) * 0.4 * speedScale,
            speedY: (visual.speed + Math.random() * 0.6) * speedScale,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: (0.012 + Math.random() * 0.018) * speedScale,
            opacity: 0.35 + Math.random() * 0.4,
          };
        case 'haze':
          return {
            ...base,
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speedX: (Math.random() - 0.5) * visual.speed * speedScale,
            speedY: (Math.random() - 0.5) * visual.speed * 0.4 * speedScale,
            opacity: 0.03 + Math.random() * 0.05,
          };
        case 'mote':
          return {
            ...base,
            y: initial ? Math.random() * canvas.height : canvas.height + 10,
            speedX: (Math.random() - 0.5) * 0.3 * speedScale,
            speedY: -(visual.speed + Math.random() * 0.4) * speedScale,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: (0.015 + Math.random() * 0.02) * speedScale,
            opacity: 0.12 + Math.random() * 0.22,
          };
        default: // gust
          return {
            ...base,
            x: initial ? Math.random() * canvas.width : -30,
            speedX: (visual.speed + Math.random() * 3) * speedScale,
            speedY: (Math.random() - 0.5) * 0.6 * speedScale,
            length: 16 + Math.random() * 26,
            drift: Math.random() * Math.PI * 2,
            opacity: 0.14 + Math.random() * 0.2,
          };
      }
    };

    // Backing store stays at CSS-pixel scale: particle bounds are compared
    // against canvas.width/height directly, and a soft-focus atmospheric layer
    // gains nothing from a devicePixelRatio-sized buffer that costs 4x fill.
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const seed = () => {
      particlesRef.current = Array.from({ length: particleCount }, () => spawn(true));
    };

    const rgba = (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

    const drawStreak = (p: WeatherParticle) => {
      ctx.strokeStyle = rgba(p.opacity);
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.speedX * 1.6, p.y - (p.length || 14));
      ctx.stroke();
    };

    const drawFlake = (p: WeatherParticle) => {
      ctx.fillStyle = rgba(p.opacity);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawHaze = (p: WeatherParticle) => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, rgba(p.opacity));
      gradient.addColorStop(1, rgba(0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawMote = (p: WeatherParticle) => {
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
      gradient.addColorStop(0, rgba(p.opacity));
      gradient.addColorStop(1, rgba(0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawGust = (p: WeatherParticle) => {
      ctx.strokeStyle = rgba(p.opacity);
      ctx.lineWidth = p.size * 0.7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - (p.length || 20), p.y + Math.sin(p.drift || 0) * 3);
      ctx.stroke();
    };

    // Kept well under photosensitivity thresholds: infrequent, dim, slow decay.
    const drawFlash = () => {
      if (flashRef.current <= 0) return;
      ctx.save();
      ctx.globalAlpha = flashRef.current * 0.05;
      ctx.fillStyle = '#e8eeff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      flashRef.current -= 0.012;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (visual.lightning && !reducedMotion) {
        drawFlash();
        if (Math.random() < 0.0018) flashRef.current = 0.5;
      }

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.wobble !== undefined) {
          p.wobble += p.wobbleSpeed || 0.02;
          p.x += Math.sin(p.wobble) * 0.45;
        }
        if (p.drift !== undefined) p.drift += 0.04;

        const offscreen =
          visual.shape === 'mote'
            ? p.y < -40
            : visual.shape === 'gust'
              ? p.x > canvas.width + 40
              : p.y > canvas.height + 40 || p.x > canvas.width + 60;

        if (offscreen) {
          particles[i] = spawn(false);
          continue;
        }

        // Haze wraps rather than respawning so the layer never visibly pops.
        if (visual.shape === 'haze') {
          if (p.x < -p.size) p.x = canvas.width + p.size;
          if (p.x > canvas.width + p.size) p.x = -p.size;
          if (p.y < -p.size) p.y = canvas.height + p.size;
          if (p.y > canvas.height + p.size) p.y = -p.size;
        }

        switch (visual.shape) {
          case 'streak': drawStreak(p); break;
          case 'flake': drawFlake(p); break;
          case 'haze': drawHaze(p); break;
          case 'mote': drawMote(p); break;
          default: drawGust(p);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    resize();
    seed();
    animate();

    const handleResize = () => {
      resize();
      seed();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [visual, particleCount, reducedMotion]);

  if (!visual) return null;

  const layerOpacity = visual.maxOpacity * Math.max(0, Math.min(transitionOpacity, 1));

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-[1] transition-opacity duration-700 ${className}`}
      style={{ opacity: layerOpacity }}
      aria-hidden="true"
    >
      {visual.tint && (
        <div className="absolute inset-0" style={{ background: visual.tint }} />
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
