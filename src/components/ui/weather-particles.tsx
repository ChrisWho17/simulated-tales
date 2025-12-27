import { useEffect, useRef, useCallback } from 'react';
import { CoreMoodType } from '@/game/moodSystem';

interface WeatherParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  rotation?: number;
  rotationSpeed?: number;
  length?: number; // For rain
  wobble?: number; // For snow/fog
  wobbleSpeed?: number;
  life?: number; // For lightning
  maxLife?: number;
}

interface WeatherParticlesProps {
  mood: CoreMoodType;
  intensity?: number; // 0-1
  transitionOpacity?: number; // 0-1, for smooth weather transitions
  className?: string;
}

// Weather configuration based on mood
const WEATHER_CONFIG: Record<CoreMoodType, {
  particleCount: number;
  colors: string[];
  type: 'dust' | 'rain' | 'snow' | 'fog' | 'fire' | 'lightning' | 'wind';
  speed: number;
  size: { min: number; max: number };
}> = {
  neutral: {
    particleCount: 30,
    colors: ['#4ade80', '#86efac', '#a7f3d0'],
    type: 'dust',
    speed: 0.3,
    size: { min: 1, max: 3 },
  },
  happy: {
    particleCount: 40,
    colors: ['#4ade80', '#fde047', '#a7f3d0'],
    type: 'dust',
    speed: 0.5,
    size: { min: 1, max: 4 },
  },
  lusty: {
    particleCount: 35,
    colors: ['#f472b6', '#ec4899', '#fb7185'],
    type: 'dust',
    speed: 0.4,
    size: { min: 1, max: 3 },
  },
  determined: {
    particleCount: 25,
    colors: ['#f1f5f9', '#e2e8f0', '#cbd5e1'],
    type: 'wind',
    speed: 1.5,
    size: { min: 1, max: 2 },
  },
  sad: {
    particleCount: 80,
    colors: ['#60a5fa', '#93c5fd', '#bfdbfe'],
    type: 'rain',
    speed: 8,
    size: { min: 1, max: 2 },
  },
  depressed: {
    particleCount: 50,
    colors: ['#a78bfa', '#8b5cf6', '#7c3aed'],
    type: 'fog',
    speed: 0.2,
    size: { min: 20, max: 60 },
  },
  fearful: {
    particleCount: 60,
    colors: ['#fde047', '#facc15', '#fbbf24'],
    type: 'lightning',
    speed: 0.1,
    size: { min: 1, max: 3 },
  },
  mad: {
    particleCount: 45,
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    type: 'fire',
    speed: 2,
    size: { min: 2, max: 5 },
  },
  annoyed: {
    particleCount: 40,
    colors: ['#fb923c', '#fdba74', '#fed7aa'],
    type: 'wind',
    speed: 2,
    size: { min: 1, max: 3 },
  },
  suspicious: {
    particleCount: 50,
    colors: ['#67e8f9', '#a5f3fc', '#cffafe'],
    type: 'snow',
    speed: 1,
    size: { min: 2, max: 4 },
  },
};

export function WeatherParticles({ mood, intensity = 1, transitionOpacity = 1, className = '' }: WeatherParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<WeatherParticle[]>([]);
  const animationRef = useRef<number>();
  const lightningFlashRef = useRef<number>(0);
  const opacityRef = useRef<number>(transitionOpacity);

  // Smooth opacity animation
  useEffect(() => {
    opacityRef.current = transitionOpacity;
  }, [transitionOpacity]);

  const createParticle = useCallback((canvas: HTMLCanvasElement, config: typeof WEATHER_CONFIG[CoreMoodType]): WeatherParticle => {
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];
    const size = Math.random() * (config.size.max - config.size.min) + config.size.min;

    const baseParticle = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size,
      opacity: Math.random() * 0.5 + 0.2,
      color,
      speedX: 0,
      speedY: 0,
    };

    switch (config.type) {
      case 'rain':
        return {
          ...baseParticle,
          y: -20 - Math.random() * 100,
          speedX: (Math.random() - 0.5) * 1,
          speedY: config.speed + Math.random() * 4,
          length: 10 + Math.random() * 15,
          opacity: 0.3 + Math.random() * 0.3,
        };
      case 'snow':
        return {
          ...baseParticle,
          y: -10,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: config.speed + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.02,
          opacity: 0.4 + Math.random() * 0.4,
        };
      case 'fog':
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * config.speed,
          speedY: (Math.random() - 0.5) * config.speed * 0.5,
          opacity: 0.03 + Math.random() * 0.05,
          size: config.size.min + Math.random() * (config.size.max - config.size.min),
        };
      case 'fire':
        return {
          ...baseParticle,
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          speedX: (Math.random() - 0.5) * 1.5,
          speedY: -config.speed - Math.random() * 2,
          opacity: 0.4 + Math.random() * 0.4,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        };
      case 'lightning':
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: 0.2 + Math.random() * 0.2,
        };
      case 'wind':
        return {
          ...baseParticle,
          x: -10,
          speedX: config.speed + Math.random() * 2,
          speedY: (Math.random() - 0.5) * 0.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          opacity: 0.2 + Math.random() * 0.3,
        };
      default: // dust
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * config.speed,
          speedY: (Math.random() - 0.5) * config.speed,
          opacity: 0.1 + Math.random() * 0.3,
        };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = WEATHER_CONFIG[mood];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particlesRef.current = [];
      const count = Math.floor(config.particleCount * intensity);
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(canvas, config));
      }
    };

    const drawRain = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX * 2, p.y + (p.length || 10));
      ctx.stroke();
      ctx.restore();
    };

    const drawSnow = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawFog = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawFire = (p: WeatherParticle) => {
      const lifeRatio = (p.life || 0) / (p.maxLife || 100);
      ctx.save();
      ctx.globalAlpha = p.opacity * (1 - lifeRatio);
      ctx.shadowBlur = 15;
      ctx.shadowColor = p.color;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1 - lifeRatio * 0.5));
      gradient.addColorStop(0, '#fef3c7');
      gradient.addColorStop(0.4, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawLightning = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWind = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-p.size * 2, 0);
      ctx.lineTo(p.size * 2, 0);
      ctx.stroke();
      ctx.restore();
    };

    const drawDust = (p: WeatherParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // Epilepsy-safe lightning flash - gentler, slower, lower opacity
    const drawLightningFlash = () => {
      if (lightningFlashRef.current > 0) {
        ctx.save();
        // Reduced max opacity from 0.15 to 0.06 for safety
        ctx.globalAlpha = lightningFlashRef.current * 0.06;
        ctx.fillStyle = '#fef9c3'; // Softer yellow
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        // Slower fade (was 0.05, now 0.015) for gentler transition
        lightningFlashRef.current -= 0.015;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Epilepsy-safe lightning flash effect
      if (config.type === 'lightning') {
        drawLightningFlash();
        // Reduced flash frequency from 0.005 to 0.002 (much less frequent)
        if (Math.random() < 0.002) {
          // Start at lower intensity (0.5 instead of 1.0)
          lightningFlashRef.current = 0.5;
        }
      }

      particlesRef.current.forEach((p, index) => {
        // Update position
        p.x += p.speedX;
        p.y += p.speedY;

        // Type-specific updates
        if (config.type === 'snow' && p.wobble !== undefined) {
          p.wobble += p.wobbleSpeed || 0.02;
          p.x += Math.sin(p.wobble) * 0.5;
        }

        if (config.type === 'wind' && p.rotation !== undefined) {
          p.rotation += p.rotationSpeed || 0.05;
        }

        if (config.type === 'fire' && p.life !== undefined) {
          p.life++;
          if (p.life >= (p.maxLife || 100)) {
            particlesRef.current[index] = createParticle(canvas, config);
          }
        }

        // Respawn particles
        if (config.type === 'rain' && p.y > canvas.height) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if (config.type === 'snow' && p.y > canvas.height) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if (config.type === 'wind' && p.x > canvas.width + 20) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if ((config.type === 'dust' || config.type === 'fog' || config.type === 'lightning') && 
                   (p.x < -50 || p.x > canvas.width + 50 || p.y < -50 || p.y > canvas.height + 50)) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }

        // Draw based on type
        switch (config.type) {
          case 'rain': drawRain(p); break;
          case 'snow': drawSnow(p); break;
          case 'fog': drawFog(p); break;
          case 'fire': drawFire(p); break;
          case 'lightning': drawLightning(p); break;
          case 'wind': drawWind(p); break;
          default: drawDust(p);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createParticles();
    animate();

    const handleResize = () => {
      resizeCanvas();
      createParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [mood, intensity, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-[1] transition-opacity duration-700 ${className}`}
      style={{ opacity: 0.7 * transitionOpacity }}
    />
  );
}
