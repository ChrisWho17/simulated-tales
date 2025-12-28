// Weather Modal Particles - Compact particle effects for the weather modal
import { useEffect, useRef, useCallback } from 'react';
import { WeatherType } from '@/game/weatherSystem';

interface ModalParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
  rotation?: number;
  rotationSpeed?: number;
  length?: number;
  wobble?: number;
  wobbleSpeed?: number;
  life?: number;
  maxLife?: number;
}

interface WeatherModalParticlesProps {
  weather: WeatherType;
  intensity?: number;
  transitionOpacity?: number; // 0-1, for smooth transitions
}

type WeatherParticleType = 'dust' | 'rain' | 'snow' | 'fog' | 'fire' | 'lightning' | 'wind';

const MODAL_WEATHER_CONFIG: Record<WeatherType, {
  particleCount: number;
  colors: string[];
  type: 'dust' | 'rain' | 'snow' | 'fog' | 'fire' | 'lightning' | 'wind';
}> = {
  clear: {
    particleCount: 15,
    colors: ['#fde047', '#facc15', '#fbbf24'],
    type: 'dust',
  },
  cloudy: {
    particleCount: 12,
    colors: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
    type: 'fog',
  },
  rain: {
    particleCount: 40,
    colors: ['#60a5fa', '#93c5fd', '#bfdbfe'],
    type: 'rain',
  },
  storm: {
    particleCount: 35,
    colors: ['#fde047', '#facc15', '#fbbf24'],
    type: 'lightning',
  },
  fog: {
    particleCount: 15,
    colors: ['#a78bfa', '#8b5cf6', '#c4b5fd'],
    type: 'fog',
  },
  snow: {
    particleCount: 30,
    colors: ['#e0f2fe', '#bae6fd', '#f0f9ff'],
    type: 'snow',
  },
  heat_wave: {
    particleCount: 25,
    colors: ['#ef4444', '#f97316', '#fbbf24'],
    type: 'fire',
  },
  wind: {
    particleCount: 20,
    colors: ['#f1f5f9', '#e2e8f0', '#cbd5e1'],
    type: 'wind',
  },
};

export function WeatherModalParticles({ weather, intensity = 1, transitionOpacity = 1 }: WeatherModalParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ModalParticle[]>([]);
  const animationRef = useRef<number>();
  const lightningFlashRef = useRef<number>(0);
  const currentOpacityRef = useRef<number>(transitionOpacity);

  // Smooth opacity transitions
  useEffect(() => {
    currentOpacityRef.current = transitionOpacity;
  }, [transitionOpacity]);

  const createParticle = useCallback((canvas: HTMLCanvasElement, config: typeof MODAL_WEATHER_CONFIG[WeatherType]): ModalParticle => {
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    const baseParticle = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2,
      opacity: Math.random() * 0.5 + 0.2,
      color,
      speedX: 0,
      speedY: 0,
    };

    switch (config.type) {
      case 'rain':
        return {
          ...baseParticle,
          y: -10 - Math.random() * 50,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: 4 + Math.random() * 3,
          length: 8 + Math.random() * 10,
          opacity: 0.4 + Math.random() * 0.3,
        };
      case 'snow':
        return {
          ...baseParticle,
          y: -5,
          size: 2 + Math.random() * 2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: 0.8 + Math.random() * 0.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.03 + Math.random() * 0.02,
          opacity: 0.6 + Math.random() * 0.3,
        };
      case 'fog':
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * 0.15,
          speedY: (Math.random() - 0.5) * 0.1,
          opacity: 0.03 + Math.random() * 0.05,
          size: 20 + Math.random() * 25,
        };
      case 'fire':
        return {
          ...baseParticle,
          x: Math.random() * canvas.width,
          y: canvas.height + 5,
          size: 2 + Math.random() * 3,
          speedX: (Math.random() - 0.5) * 1,
          speedY: -1.5 - Math.random() * 1.5,
          opacity: 0.5 + Math.random() * 0.4,
          life: 0,
          maxLife: 50 + Math.random() * 30,
        };
      case 'lightning':
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: 0.2 + Math.random() * 0.2,
        };
      case 'wind':
        return {
          ...baseParticle,
          x: -5,
          speedX: 2 + Math.random() * 1.5,
          speedY: (Math.random() - 0.5) * 0.3,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.08,
          opacity: 0.3 + Math.random() * 0.3,
        };
      default: // dust
        return {
          ...baseParticle,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: 0.15 + Math.random() * 0.2,
        };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config = MODAL_WEATHER_CONFIG[weather];

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    const createParticles = () => {
      particlesRef.current = [];
      const count = Math.floor(config.particleCount * intensity);
      for (let i = 0; i < count; i++) {
        particlesRef.current.push(createParticle(canvas, config));
      }
    };

    const drawRain = (p: ModalParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.speedX, p.y + (p.length || 8));
      ctx.stroke();
      ctx.restore();
    };

    const drawSnow = (p: ModalParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawFog = (p: ModalParticle) => {
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

    const drawFire = (p: ModalParticle) => {
      const lifeRatio = (p.life || 0) / (p.maxLife || 80);
      ctx.save();
      ctx.globalAlpha = p.opacity * (1 - lifeRatio);
      ctx.shadowBlur = 12;
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

    const drawLightning = (p: ModalParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawWind = (p: ModalParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-p.size * 3, 0);
      ctx.lineTo(p.size * 3, 0);
      ctx.stroke();
      ctx.restore();
    };

    const drawDust = (p: ModalParticle) => {
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.shadowBlur = 8;
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
        // Reduced max opacity from 0.2 to 0.08 for safety
        ctx.globalAlpha = lightningFlashRef.current * 0.08;
        ctx.fillStyle = '#fef9c3'; // Softer yellow
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
        // Slower fade (was 0.06, now 0.02) for gentler transition
        lightningFlashRef.current -= 0.02;
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (config.type === 'lightning') {
        drawLightningFlash();
        // Reduced flash frequency from 0.008 to 0.003 (much less frequent)
        if (Math.random() < 0.003) {
          // Start at lower intensity (0.6 instead of 1.0)
          lightningFlashRef.current = 0.6;
        }
      }

      particlesRef.current.forEach((p, index) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (config.type === 'snow' && p.wobble !== undefined) {
          p.wobble += p.wobbleSpeed || 0.03;
          p.x += Math.sin(p.wobble) * 0.4;
        }

        if (config.type === 'wind' && p.rotation !== undefined) {
          p.rotation += p.rotationSpeed || 0.05;
        }

        if (config.type === 'fire' && p.life !== undefined) {
          p.life++;
          if (p.life >= (p.maxLife || 80)) {
            particlesRef.current[index] = createParticle(canvas, config);
          }
        }

        // Respawn logic
        if (config.type === 'rain' && p.y > canvas.height) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if (config.type === 'snow' && p.y > canvas.height) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if (config.type === 'wind' && p.x > canvas.width + 10) {
          particlesRef.current[index] = createParticle(canvas, config);
        } else if ((config.type === 'dust' || config.type === 'fog' || config.type === 'lightning') && 
                   (p.x < -30 || p.x > canvas.width + 30 || p.y < -30 || p.y > canvas.height + 30)) {
          p.x = Math.random() * canvas.width;
          p.y = Math.random() * canvas.height;
        }

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
  }, [weather, intensity, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden transition-opacity duration-500"
      style={{ opacity: 0.8 * transitionOpacity }}
    />
  );
}
