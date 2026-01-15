import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'paragraph' | 'avatar' | 'card' | 'narrative';
  lines?: number;
}

export function SkeletonLoader({ 
  className, 
  variant = 'text',
  lines = 3 
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-muted/50 rounded";
  
  if (variant === 'text') {
    return (
      <div className={cn(baseClasses, "h-4 w-3/4", className)} />
    );
  }
  
  if (variant === 'paragraph') {
    return (
      <div className={cn("space-y-2", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              baseClasses, 
              "h-4",
              i === lines - 1 ? "w-1/2" : "w-full"
            )} 
          />
        ))}
      </div>
    );
  }
  
  if (variant === 'avatar') {
    return (
      <div className={cn(baseClasses, "w-12 h-12 rounded-full", className)} />
    );
  }
  
  if (variant === 'card') {
    return (
      <div className={cn("p-4 border border-border/50 rounded-lg", className)}>
        <div className="flex items-start gap-4">
          <div className={cn(baseClasses, "w-16 h-20 rounded-lg shrink-0")} />
          <div className="flex-1 space-y-3">
            <div className={cn(baseClasses, "h-5 w-1/3")} />
            <div className={cn(baseClasses, "h-4 w-full")} />
            <div className={cn(baseClasses, "h-4 w-4/5")} />
          </div>
        </div>
      </div>
    );
  }
  
  if (variant === 'narrative') {
    return (
      <div className={cn("space-y-4 p-6", className)}>
        {/* First paragraph */}
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-5 w-full")} />
          <div className={cn(baseClasses, "h-5 w-11/12")} />
          <div className={cn(baseClasses, "h-5 w-4/5")} />
        </div>
        
        {/* Second paragraph */}
        <div className="space-y-2">
          <div className={cn(baseClasses, "h-5 w-full")} />
          <div className={cn(baseClasses, "h-5 w-10/12")} />
          <div className={cn(baseClasses, "h-5 w-3/4")} />
          <div className={cn(baseClasses, "h-5 w-1/2")} />
        </div>
        
        {/* Dialogue indicator */}
        <div className="flex items-start gap-4 pl-4 border-l-2 border-primary/30">
          <div className={cn(baseClasses, "w-12 h-16 rounded-lg shrink-0")} />
          <div className="flex-1 space-y-2">
            <div className={cn(baseClasses, "h-4 w-1/4")} />
            <div className={cn(baseClasses, "h-4 w-full italic")} />
            <div className={cn(baseClasses, "h-4 w-3/4 italic")} />
          </div>
        </div>
      </div>
    );
  }
  
  return <div className={cn(baseClasses, "h-4 w-full", className)} />;
}

// Animated dots for loading states
export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </span>
  );
}

// Typing indicator for AI responses
export function TypingIndicator({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center gap-2 p-4 text-muted-foreground",
      className
    )}>
      <span className="text-sm italic">The narrator is writing</span>
      <LoadingDots />
    </div>
  );
}
