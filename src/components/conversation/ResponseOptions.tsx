// Response Options Component with keyboard shortcuts

import { useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  MessageSquare, Heart, Angry, Handshake, Theater, 
  Skull, Shield, Search, ChevronRight
} from 'lucide-react';
import { ConversationResponse } from './ConversationUI';

export type ResponseType = 
  | 'direct' | 'probe' | 'emotional' | 'flirt' 
  | 'threaten' | 'deceive' | 'deflect' | 'friendly' | 'aggressive';

interface ResponseOptionsProps {
  responses: ConversationResponse[];
  onSelect: (response: ConversationResponse) => void;
  disabled?: boolean;
}

const RESPONSE_ICONS: Record<ResponseType, typeof MessageSquare> = {
  direct: MessageSquare,
  probe: Search,
  emotional: Heart,
  flirt: Heart,
  threaten: Skull,
  deceive: Theater,
  deflect: Shield,
  friendly: Handshake,
  aggressive: Angry
};

const RESPONSE_COLORS: Record<ResponseType, string> = {
  direct: 'hover:border-primary/60 hover:bg-primary/10',
  probe: 'hover:border-cyan-500/60 hover:bg-cyan-500/10',
  emotional: 'hover:border-pink-500/60 hover:bg-pink-500/10',
  flirt: 'hover:border-pink-500/60 hover:bg-pink-500/10',
  threaten: 'hover:border-destructive/60 hover:bg-destructive/10',
  deceive: 'hover:border-warning/60 hover:bg-warning/10',
  deflect: 'hover:border-muted-foreground/60 hover:bg-muted/30',
  friendly: 'hover:border-success/60 hover:bg-success/10',
  aggressive: 'hover:border-orange-500/60 hover:bg-orange-500/10'
};

const RESPONSE_ICON_COLORS: Record<ResponseType, string> = {
  direct: 'text-primary',
  probe: 'text-cyan-500',
  emotional: 'text-pink-500',
  flirt: 'text-pink-500',
  threaten: 'text-destructive',
  deceive: 'text-warning',
  deflect: 'text-muted-foreground',
  friendly: 'text-success',
  aggressive: 'text-orange-500'
};

export function ResponseOptions({
  responses,
  onSelect,
  disabled = false
}: ResponseOptionsProps) {
  // Keyboard shortcut handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (disabled) return;
    
    const num = parseInt(e.key);
    if (num >= 1 && num <= responses.length) {
      onSelect(responses[num - 1]);
    }
  }, [responses, onSelect, disabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Format relationship impact
  const formatImpact = (impact?: number) => {
    if (!impact) return null;
    if (impact > 0) return <span className="text-success text-xs">+{impact}</span>;
    if (impact < 0) return <span className="text-destructive text-xs">{impact}</span>;
    return null;
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        Choose your response (or press 1-{responses.length})
      </p>
      
      {responses.map((response, index) => {
        const Icon = RESPONSE_ICONS[response.type] || MessageSquare;
        const colorClass = RESPONSE_COLORS[response.type] || RESPONSE_COLORS.direct;
        const iconColorClass = RESPONSE_ICON_COLORS[response.type] || RESPONSE_ICON_COLORS.direct;
        
        return (
          <button
            key={index}
            onClick={() => onSelect(response)}
            disabled={disabled}
            className={cn(
              "w-full text-left p-3 rounded-lg transition-all duration-200",
              "glass-panel-subtle border border-transparent",
              "group flex items-start gap-3",
              colorClass,
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {/* Keyboard shortcut indicator */}
            <span className="w-6 h-6 rounded bg-black/30 flex items-center justify-center text-xs text-muted-foreground shrink-0">
              {index + 1}
            </span>
            
            {/* Icon */}
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", iconColorClass)} />
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-relaxed">
                {response.text}
              </p>
              
              {/* Relationship impact on hover */}
              <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {formatImpact(response.relationshipImpact)}
                {response.type !== 'direct' && (
                  <span className="text-xs text-muted-foreground capitalize">
                    [{response.type}]
                  </span>
                )}
              </div>
            </div>
            
            {/* Arrow */}
            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </button>
        );
      })}
    </div>
  );
}
