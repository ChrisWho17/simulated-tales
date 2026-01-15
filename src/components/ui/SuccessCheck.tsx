// ============================================================================
// SUCCESS CHECK - Animated checkmark for confirmation feedback
// ============================================================================

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SuccessCheckProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
};

const strokeWidths = {
  sm: 3,
  md: 2.5,
  lg: 2,
};

export function SuccessCheck({ size = 'md', className }: SuccessCheckProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      className={cn(
        'rounded-full bg-green-500/20 flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidths[size]}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-1/2 h-1/2 text-green-500"
      >
        <motion.path
          d="M5 12l5 5L20 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.2,
            ease: 'easeOut',
          }}
        />
      </motion.svg>
    </motion.div>
  );
}

// Inline success indicator for forms/inputs
export function InlineSuccess({ className }: { className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn('text-green-500', className)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-4 h-4"
      >
        <motion.path
          d="M5 12l5 5L20 7"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </motion.span>
  );
}
