import { useEffect, useRef } from 'react';
import { CoreMoodType } from '@/game/moodSystem';
import { WeatherParticles } from './weather-particles';
interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

interface ParticleBackgroundProps {
  particleCount?: number;
  colors?: string[];
  maxSize?: number;
  speed?: number;
  className?: string;
}

function getParticleColors(): string[] {
  const root = getComputedStyle(document.documentElement);
  const primary = root.getPropertyValue('--particle-primary').trim();
  const secondary = root.getPropertyValue('--particle-secondary').trim();
  const tertiary = root.getPropertyValue('--particle-tertiary').trim();
  
  // Return CSS variable colors if set, otherwise defaults
  if (primary && secondary && tertiary) {
    return [primary, secondary, tertiary];
  }
  return ['#8b5cf6', '#d946ef', '#22d3ee'];
}

export function ParticleBackground({
  particleCount = 50,
  colors,
  maxSize = 3,
  speed = 0.3,
  className = '',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const colorsRef = useRef<string[]>(colors || getParticleColors());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    // Update colors from CSS variables
    const updateColors = () => {
      colorsRef.current = colors || getParticleColors();
      // Update existing particles with new colors
      particlesRef.current.forEach(particle => {
        particle.color = colorsRef.current[Math.floor(Math.random() * colorsRef.current.length)];
      });
    };

    const createParticles = () => {
      const currentColors = colorsRef.current;
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * maxSize + 0.5,
          speedX: (Math.random() - 0.5) * speed,
          speedY: (Math.random() - 0.5) * speed,
          opacity: Math.random() * 0.5 + 0.1,
          color: currentColors[Math.floor(Math.random() * currentColors.length)],
        });
      }
    };

    // Listen for CSS variable changes via MutationObserver
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'style') {
          updateColors();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Update position
        particle.x += particle.speedX;
        particle.y += particle.speedY;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        
        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = particle.color;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.fill();
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resizeCanvas();
      createParticles();
    });

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observer.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [particleCount, colors, maxSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: 0.6 }}
    />
  );
}

// Ambient glow orbs that drift slowly - uses CSS variables for colors
export function AmbientGlow() {
  return (
    <>
      <div 
        className="ambient-glow ambient-glow-primary" 
        style={{ 
          background: 'radial-gradient(ellipse at center, var(--ambient-primary, #8b5cf6) 0%, transparent 70%)',
          opacity: 0.15
        }} 
      />
      <div 
        className="ambient-glow ambient-glow-secondary" 
        style={{ 
          background: 'radial-gradient(ellipse at center, var(--ambient-secondary, #d946ef) 0%, transparent 70%)',
          opacity: 0.12
        }} 
      />
    </>
  );
}

// Combined atmospheric background
export function AtmosphericBackground({ mood = 'neutral' }: { mood?: CoreMoodType }) {
  return (
    <>
      <ParticleBackground />
      <AmbientGlow />
      <WeatherParticles mood={mood} />
    </>
  );
}