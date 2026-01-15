// System Highlight Component
// Renders highlighted text with system reference indicators

import React, { memo, useMemo } from 'react';
import { SystemType, SYSTEM_CONFIG, findSystemReferences } from '@/lib/systemReferenceHighlighter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SystemHighlightProps {
  text: string;
  enabled?: boolean;
  className?: string;
}

interface HighlightedSegment {
  type: 'text' | 'highlight';
  content: string;
  system?: SystemType;
}

/**
 * Parse text into segments with highlights
 */
function parseTextWithHighlights(text: string): HighlightedSegment[] {
  const references = findSystemReferences(text);
  
  if (references.length === 0) {
    return [{ type: 'text', content: text }];
  }
  
  const segments: HighlightedSegment[] = [];
  let lastIndex = 0;
  
  for (const ref of references) {
    // Add text before this reference
    if (ref.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, ref.startIndex),
      });
    }
    
    // Add the highlighted reference
    segments.push({
      type: 'highlight',
      content: ref.keyword,
      system: ref.system,
    });
    
    lastIndex = ref.endIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  return segments;
}

// Individual highlight span with tooltip
const HighlightSpan = memo(function HighlightSpan({ 
  content, 
  system 
}: { 
  content: string; 
  system: SystemType;
}) {
  const config = SYSTEM_CONFIG[system];
  
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "relative inline-block cursor-help transition-all duration-200",
              "hover:scale-[1.02]"
            )}
            style={{
              color: config.color,
              backgroundColor: config.bgColor,
              borderBottom: `2px solid ${config.borderColor}`,
              padding: '0 2px',
              borderRadius: '2px',
              textShadow: `0 0 8px ${config.bgColor}`,
            }}
          >
            {content}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="flex items-center gap-2 font-sans text-sm"
          style={{
            backgroundColor: config.bgColor,
            borderColor: config.borderColor,
            color: config.color,
          }}
        >
          <span className="text-base">{config.icon}</span>
          <span className="font-medium">{config.label} System</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
});

// Main component
export const SystemHighlight = memo(function SystemHighlight({
  text,
  enabled = true,
  className,
}: SystemHighlightProps) {
  const segments = useMemo(() => {
    if (!enabled) {
      return [{ type: 'text' as const, content: text }];
    }
    return parseTextWithHighlights(text);
  }, [text, enabled]);
  
  if (!enabled || segments.length === 1 && segments[0].type === 'text') {
    return <span className={className}>{text}</span>;
  }
  
  return (
    <span className={className}>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return <span key={i}>{segment.content}</span>;
        }
        return (
          <HighlightSpan
            key={`${i}-${segment.system}`}
            content={segment.content}
            system={segment.system!}
          />
        );
      })}
    </span>
  );
});

// Summary badge showing which systems are referenced
interface SystemBadgesSummaryProps {
  text: string;
  className?: string;
}

export const SystemBadgesSummary = memo(function SystemBadgesSummary({
  text,
  className,
}: SystemBadgesSummaryProps) {
  const systems = useMemo(() => {
    const refs = findSystemReferences(text);
    const uniqueSystems = [...new Set(refs.map(r => r.system))];
    return uniqueSystems.slice(0, 5); // Limit to 5 for display
  }, [text]);
  
  if (systems.length === 0) return null;
  
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {systems.map(system => {
        const config = SYSTEM_CONFIG[system];
        return (
          <span
            key={system}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-transform hover:scale-105"
            style={{
              backgroundColor: config.bgColor,
              color: config.color,
              border: `1px solid ${config.borderColor}`,
            }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </span>
        );
      })}
    </div>
  );
});
