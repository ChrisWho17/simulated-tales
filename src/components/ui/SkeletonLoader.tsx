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

// Story entry skeleton for loading narrative content
export function StoryEntrySkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4 p-4 animate-in fade-in duration-300", className)}>
      {/* Narrator badge */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
      </div>
      
      {/* First paragraph */}
      <div className="space-y-2 pl-2 border-l-2 border-primary/20">
        <div className="h-5 w-full bg-muted/60 rounded animate-pulse" />
        <div className="h-5 w-11/12 bg-muted/60 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
        <div className="h-5 w-4/5 bg-muted/60 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
      </div>
      
      {/* Second paragraph */}
      <div className="space-y-2 pl-2">
        <div className="h-5 w-full bg-muted/50 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
        <div className="h-5 w-10/12 bg-muted/50 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
        <div className="h-5 w-3/4 bg-muted/50 rounded animate-pulse" style={{ animationDelay: '500ms' }} />
      </div>
      
      {/* Potential dialogue indicator */}
      <div className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg border border-border/30">
        <div className="w-10 h-10 rounded-lg bg-muted/50 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-1/4 bg-muted/40 rounded animate-pulse" />
          <div className="h-4 w-full bg-muted/30 rounded animate-pulse italic" />
          <div className="h-4 w-2/3 bg-muted/30 rounded animate-pulse italic" />
        </div>
      </div>
    </div>
  );
}

// Generating story indicator with skeleton
export function GeneratingStoryIndicator({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <LoadingDots className="scale-150" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
        </div>
        <p className="text-sm text-muted-foreground italic">Weaving your story...</p>
      </div>
      <StoryEntrySkeleton />
    </div>
  );
}

// Campaign save skeleton for loading cloud saves
export function CampaignSaveSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-lg border bg-card animate-pulse",
      className
    )}>
      <div className="flex-1 min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-5 w-16 bg-muted/70 rounded" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-4 w-28 bg-muted/60 rounded" />
          <div className="h-4 w-20 bg-muted/60 rounded" />
          <div className="h-4 w-16 bg-muted/60 rounded" />
        </div>
        <div className="h-3 w-32 bg-muted/40 rounded" />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <div className="h-8 w-8 bg-muted/50 rounded" />
        <div className="h-8 w-8 bg-muted/50 rounded" />
        <div className="h-8 w-8 bg-muted/50 rounded" />
      </div>
    </div>
  );
}

// Multiple campaign skeletons
export function CampaignSaveSkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <CampaignSaveSkeleton key={i} />
      ))}
    </div>
  );
}
