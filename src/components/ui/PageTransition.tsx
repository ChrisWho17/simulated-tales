// ============================================================================
// PAGE TRANSITION - Smooth fade transitions between routes and wizard steps
// ============================================================================

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { ReactNode, useState, useEffect } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Simpler fade-only transition
export function FadeTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale and fade for modals/dialogs
export function ScaleTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================================
// STEP TRANSITION - Direction-aware slide for wizard/setup steps
// ============================================================================

interface StepTransitionProps {
  children: ReactNode;
  stepKey: string | number;
  direction: 'forward' | 'backward';
  className?: string;
  variant?: 'slide' | 'fade' | 'scale' | 'flip';
}

const slideVariants: Variants = {
  enter: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? 60 : -60,
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    x: direction === 'forward' ? -60 : 60,
    opacity: 0,
    scale: 0.98,
  }),
};

const fadeVariants: Variants = {
  enter: {
    opacity: 0,
    y: 12,
  },
  center: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -12,
  },
};

const scaleVariants: Variants = {
  enter: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    scale: direction === 'forward' ? 0.92 : 1.08,
  }),
  center: {
    opacity: 1,
    scale: 1,
  },
  exit: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    scale: direction === 'forward' ? 1.08 : 0.92,
  }),
};

const flipVariants: Variants = {
  enter: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    rotateY: direction === 'forward' ? 15 : -15,
    transformPerspective: 1200,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
  },
  exit: (direction: 'forward' | 'backward') => ({
    opacity: 0,
    rotateY: direction === 'forward' ? -15 : 15,
  }),
};

const variantMap = {
  slide: slideVariants,
  fade: fadeVariants,
  scale: scaleVariants,
  flip: flipVariants,
};

export function StepTransition({ 
  children, 
  stepKey, 
  direction, 
  className,
  variant = 'slide' 
}: StepTransitionProps) {
  const variants = variantMap[variant];

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: 'spring', stiffness: 400, damping: 35 },
          y: { type: 'spring', stiffness: 400, damping: 35 },
          opacity: { duration: 0.2, ease: 'easeOut' },
          scale: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
          rotateY: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================================================
// USE STEP DIRECTION HOOK - Track direction for step transitions
// ============================================================================

export function useStepDirection(currentStep: number) {
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [prevStep, setPrevStep] = useState(currentStep);

  useEffect(() => {
    if (currentStep !== prevStep) {
      setDirection(currentStep > prevStep ? 'forward' : 'backward');
      setPrevStep(currentStep);
    }
  }, [currentStep, prevStep]);

  return direction;
}

// ============================================================================
// STAGGER CHILDREN - Animate children in sequence
// ============================================================================

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
};

export function StaggerChildren({ children, className, staggerDelay = 0.08 }: StaggerChildrenProps) {
  return (
    <motion.div
      variants={{
        ...containerVariants,
        visible: {
          ...containerVariants.visible,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: 0.1,
          },
        },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}
