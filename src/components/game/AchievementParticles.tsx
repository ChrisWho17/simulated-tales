// Achievement Unlock Particle Effects
// Creates celebratory particle effects when achievements are unlocked

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  velocityX: number;
  velocityY: number;
  type: 'sparkle' | 'star' | 'circle' | 'confetti';
}

interface AchievementParticlesProps {
  isActive: boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  onComplete?: () => void;
}

const RARITY_COLORS = {
  common: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
  uncommon: ['#4ade80', '#22c55e', '#86efac'],
  rare: ['#60a5fa', '#3b82f6', '#93c5fd'],
  epic: ['#a855f7', '#9333ea', '#c084fc'],
  legendary: ['#fbbf24', '#f59e0b', '#fcd34d', '#fef3c7'],
};

const PARTICLE_SHAPES = {
  sparkle: '✦',
  star: '★',
  circle: '●',
  confetti: '■',
};

function createParticle(id: number, colors: string[]): Particle {
  const types: Particle['type'][] = ['sparkle', 'star', 'circle', 'confetti'];
  return {
    id,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 50 + (Math.random() - 0.5) * 20,
    size: 8 + Math.random() * 12,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    velocityX: (Math.random() - 0.5) * 200,
    velocityY: -50 - Math.random() * 150,
    type: types[Math.floor(Math.random() * types.length)],
  };
}

export function AchievementParticles({ isActive, rarity, onComplete }: AchievementParticlesProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const colors = RARITY_COLORS[rarity];
  const particleCount = rarity === 'legendary' ? 30 : rarity === 'epic' ? 24 : rarity === 'rare' ? 18 : 12;
  
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }
    
    // Create initial burst of particles
    const newParticles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      newParticles.push(createParticle(i, colors));
    }
    setParticles(newParticles);
    
    // Clear particles after animation
    const timeout = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [isActive, particleCount, colors, onComplete]);
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              scale: 0,
              rotate: particle.rotation,
              opacity: 1,
            }}
            animate={{
              left: `${particle.x + particle.velocityX / 5}%`,
              top: `${particle.y + particle.velocityY / 5}%`,
              scale: [0, 1.2, 1, 0.8],
              rotate: particle.rotation + 180,
              opacity: [1, 1, 0.8, 0],
            }}
            transition={{
              duration: 1.5 + Math.random() * 0.5,
              ease: 'easeOut',
            }}
            className="absolute"
            style={{
              color: particle.color,
              fontSize: particle.size,
              textShadow: `0 0 ${particle.size / 2}px ${particle.color}`,
            }}
          >
            {PARTICLE_SHAPES[particle.type]}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Center glow effect */}
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2, 3], opacity: [0, 0.6, 0] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={cn(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
            "w-24 h-24 rounded-full blur-xl",
            rarity === 'legendary' && 'bg-amber-400',
            rarity === 'epic' && 'bg-purple-500',
            rarity === 'rare' && 'bg-blue-500',
            rarity === 'uncommon' && 'bg-green-500',
            rarity === 'common' && 'bg-slate-400',
          )}
        />
      )}
    </div>
  );
}

// Screen-wide celebration for legendary achievements
export function LegendaryAchievementCelebration({ isActive }: { isActive: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  
  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }
    
    const colors = RARITY_COLORS.legendary;
    const newParticles: Particle[] = [];
    
    // Create particles across the screen
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: 110, // Start below screen
        size: 10 + Math.random() * 15,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 100,
        velocityY: -200 - Math.random() * 200,
        type: ['sparkle', 'star', 'circle', 'confetti'][Math.floor(Math.random() * 4)] as Particle['type'],
      });
    }
    setParticles(newParticles);
    
    const timeout = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timeout);
  }, [isActive]);
  
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
          {/* Golden overlay flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"
          />
          
          {/* Rising particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                scale: 0,
                rotate: particle.rotation,
                opacity: 1,
              }}
              animate={{
                top: `${-10}%`,
                scale: [0, 1, 1, 0.5],
                rotate: particle.rotation + 360,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2 + Math.random(),
                ease: 'easeOut',
                delay: Math.random() * 0.5,
              }}
              className="absolute"
              style={{
                color: particle.color,
                fontSize: particle.size,
                textShadow: `0 0 ${particle.size}px ${particle.color}`,
              }}
            >
              {PARTICLE_SHAPES[particle.type]}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AchievementParticles;
