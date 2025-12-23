import * as React from "react";
import { cn } from "@/lib/utils";

interface StatBarProps {
  value: number;
  max: number;
  type?: 'health' | 'energy' | 'stress' | 'mana' | 'custom';
  customColors?: { start: string; end: string };
  showValue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  critical?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const typeColors = {
  health: { start: '#10b981', end: '#14b8a6', glow: 'rgba(16, 185, 129, 0.5)' },
  energy: { start: '#eab308', end: '#f97316', glow: 'rgba(234, 179, 8, 0.5)' },
  stress: { start: '#ef4444', end: '#f43f5e', glow: 'rgba(239, 68, 68, 0.5)' },
  mana: { start: '#8b5cf6', end: '#6366f1', glow: 'rgba(139, 92, 246, 0.5)' },
  custom: { start: '#8b5cf6', end: '#d946ef', glow: 'rgba(139, 92, 246, 0.5)' },
};

export function StatBar({
  value,
  max,
  type = 'health',
  customColors,
  showValue = false,
  size = 'md',
  animated = true,
  critical = false,
  className,
}: StatBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const typeColor = typeColors[type];
  const colors = customColors 
    ? { ...customColors, glow: typeColor.glow } 
    : typeColor;
  const isCritical = critical || (type === 'health' && percentage < 25);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full bg-black/50 rounded-full overflow-hidden",
          sizeClasses[size],
          isCritical && "animate-[pulse-critical_1.5s_ease-in-out_infinite]"
        )}
        style={{
          boxShadow: isCritical ? `0 0 15px ${colors.glow}` : undefined,
        }}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out relative",
            animated && "overflow-hidden"
          )}
          style={{
            width: `${percentage}%`,
            background: `linear-gradient(90deg, ${colors.start}, ${colors.end})`,
            boxShadow: `0 0 10px ${colors.glow}`,
          }}
        >
          {animated && (
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: 'stat-shine 2s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>
      {showValue && (
        <div className="flex justify-between mt-1 text-xs font-mono text-muted-foreground">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  );
}

interface StatDisplayProps {
  label: string;
  value: number;
  max: number;
  type?: StatBarProps['type'];
  icon?: React.ReactNode;
  size?: StatBarProps['size'];
  className?: string;
}

export function StatDisplay({
  label,
  value,
  max,
  type = 'health',
  icon,
  size = 'md',
  className,
}: StatDisplayProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = typeColors[type];

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <span style={{ color: colors.start }}>{icon}</span>
          )}
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </span>
        </div>
        <span 
          className="text-sm font-mono font-semibold tabular-nums"
          style={{ color: colors.start }}
        >
          {value}/{max}
        </span>
      </div>
      <StatBar value={value} max={max} type={type} size={size} />
    </div>
  );
}

// Circular stat display for compact UIs
interface CircularStatProps {
  value: number;
  max: number;
  type?: StatBarProps['type'];
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function CircularStat({
  value,
  max,
  type = 'health',
  size = 60,
  strokeWidth = 4,
  showValue = true,
  icon,
  className,
}: CircularStatProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = typeColors[type];
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.5)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gradient-${type})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 6px ${colors.glow})`,
          }}
        />
        <defs>
          <linearGradient id={`gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.start} />
            <stop offset="100%" stopColor={colors.end} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {icon ? (
          <span style={{ color: colors.start }}>{icon}</span>
        ) : showValue ? (
          <span 
            className="text-xs font-mono font-bold tabular-nums"
            style={{ color: colors.start }}
          >
            {value}
          </span>
        ) : null}
      </div>
    </div>
  );
}