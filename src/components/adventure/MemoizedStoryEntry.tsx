// Memoized Story Entry component for performance optimization
// Prevents re-rendering of story entries unless their content changes

import React, { memo, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ImageIcon, RotateCcw, Bookmark, BookmarkCheck } from 'lucide-react';
import { CoreMoodType, MOOD_COLORS, getAnchorWords, MAX_ANCHORS_PER_PARAGRAPH } from '@/game/moodSystem';
import { cleanNarrativeForDisplay } from '@/lib/narrativeFilter';
import { parseTextForNPCLinks } from './NPCNameLink';
import { RegisteredNPC } from '@/game/npcIdentityRegistry';
import { TypewriterText } from '@/components/ui/TypewriterText';
import { BookmarkButton } from '@/components/ui/BookmarkButton';
import { SystemBadgesSummary } from '@/components/game/SystemHighlight';
import { findSystemReferences, SYSTEM_CONFIG, SystemType } from '@/lib/systemReferenceHighlighter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Type alias for the NPC name map
type NPCNameMap = Map<string, RegisteredNPC>;
import { processDialogueForNameReveals, resolveNPCId } from '@/game/npcIdentityRegistry';
import { Modifier } from '@/game/buffDebuffSystem';

interface StoryEntry {
  id: string;
  role: 'user' | 'narrator';
  content: string;
  timestamp: number;
  imageUrl?: string;
  difficulty?: string;
}

interface MemoizedStoryEntryProps {
  entry: StoryEntry;
  index: number;
  isLatest: boolean;
  currentMood: CoreMoodType;
  recentModifiers: Modifier[];
  npcNameMap: NPCNameMap;
  playerName: string;
  openCharacterSheet: () => void;
  onGenerateImage: (id: string) => void;
  generatingImageFor: string | null;
  isLoading: boolean;
  canRegenerateWorld: boolean;
  onRegenerateWorld?: () => void;
  storyLength: number;
  onTapEvent: (index: number) => void;
  tapFeedback: { index: number; count: number } | null;
  rollbackSplash: { index: number } | null;
  showRollbackHint: boolean;
  // New polish features
  enableTypewriter?: boolean;
  textSpeed?: 'slow' | 'normal' | 'fast' | 'instant';
  campaignId?: string;
  characterName?: string;
  // System highlighting
  enableSystemHighlight?: boolean;
}

// Get modifier color class based on type
const getModifierBadgeClass = (modifier: Modifier): string => {
  if (modifier.type === 'buff') return 'text-modifier-buff';
  if (modifier.severity >= 0.7) return 'text-modifier-critical';
  if (modifier.category === 'injury' || modifier.severity >= 0.4) return 'text-modifier-injury';
  return 'text-modifier-neutral';
};

// System highlight inline component
const SystemHighlightInline = memo(function SystemHighlightInline({
  text,
  keyPrefix,
}: {
  text: string;
  keyPrefix: string;
}): React.ReactElement {
  const refs = useMemo(() => findSystemReferences(text), [text]);
  
  if (refs.length === 0) {
    return <>{text}</>;
  }
  
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  
  refs.forEach((ref, i) => {
    // Add text before this reference
    if (ref.startIndex > lastIndex) {
      result.push(<span key={`${keyPrefix}-t-${i}`}>{text.slice(lastIndex, ref.startIndex)}</span>);
    }
    
    // Add highlighted reference
    const config = SYSTEM_CONFIG[ref.system];
    result.push(
      <TooltipProvider key={`${keyPrefix}-h-${i}`} delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="relative inline cursor-help transition-all duration-200 hover:brightness-110"
              style={{
                color: config.color,
                backgroundColor: config.bgColor,
                borderBottom: `2px solid ${config.borderColor}`,
                padding: '0 2px',
                borderRadius: '2px',
                textShadow: `0 0 8px ${config.bgColor}`,
              }}
            >
              {ref.keyword}
            </span>
          </TooltipTrigger>
          <TooltipContent 
            side="top" 
            className="flex items-center gap-2 font-sans text-sm border"
            style={{
              backgroundColor: 'hsl(var(--popover))',
              borderColor: config.borderColor,
            }}
          >
            <span className="text-base">{config.icon}</span>
            <span className="font-medium" style={{ color: config.color }}>{config.label} System</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    
    lastIndex = ref.endIndex;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    result.push(<span key={`${keyPrefix}-end`}>{text.slice(lastIndex)}</span>);
  }
  
  return <>{result}</>;
});

// Memoized text segment formatter
const FormatTextSegment = memo(function FormatTextSegment({
  text,
  keyPrefix,
  moodConfig,
  tintableWords,
  npcNameMap,
  playerName,
  openCharacterSheet,
  enableSystemHighlight,
}: {
  text: string;
  keyPrefix: string;
  moodConfig: typeof MOOD_COLORS[CoreMoodType] | null;
  tintableWords?: Set<string>;
  npcNameMap: NPCNameMap;
  playerName: string;
  openCharacterSheet: () => void;
  enableSystemHighlight?: boolean;
}): React.ReactElement {
  const result: React.ReactNode[] = [];
  
  // Split by bold markers first
  const boldParts = text.split(/\*\*(.+?)\*\*/g);
  
  boldParts.forEach((part, i) => {
    if (i % 2 === 1) {
      // Bold text - check for NPC names first, then apply mood color
      const npcParsed = parseTextForNPCLinks(part, npcNameMap, `${keyPrefix}-b-${i}`, playerName, openCharacterSheet);
      result.push(
        <strong 
          key={`${keyPrefix}-b-${i}`} 
          className="font-semibold"
          style={{ 
            color: moodConfig?.primary || 'hsl(var(--primary))',
            textShadow: moodConfig 
              ? `0 0 ${moodConfig.glowRadius}px ${moodConfig.glow}` 
              : undefined
          }}
        >
          {npcParsed}
        </strong>
      );
    } else if (part) {
      // Check for italic within non-bold text
      const italicParts = part.split(/\*(.+?)\*/g);
      italicParts.forEach((iPart, j) => {
        if (j % 2 === 1) {
          // Italic text
          const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-i-${i}-${j}`, playerName, openCharacterSheet);
          result.push(<em key={`${keyPrefix}-i-${i}-${j}`} className="text-muted-foreground">{npcParsed}</em>);
        } else if (iPart) {
          // Regular text - apply system highlighting if enabled
          if (enableSystemHighlight) {
            result.push(
              <SystemHighlightInline 
                key={`${keyPrefix}-t-${i}-${j}`}
                text={iPart}
                keyPrefix={`${keyPrefix}-sys-${i}-${j}`}
              />
            );
          } else {
            const npcParsed = parseTextForNPCLinks(iPart, npcNameMap, `${keyPrefix}-t-${i}-${j}`, playerName, openCharacterSheet);
            result.push(<span key={`${keyPrefix}-t-${i}-${j}`}>{npcParsed}</span>);
          }
        }
      });
    }
  });
  
  return <>{result}</>;
});

// Memoized paragraph component
const NarrativeParagraph = memo(function NarrativeParagraph({
  paragraph,
  paragraphIndex,
  moodConfig,
  tintableWords,
  npcNameMap,
  playerName,
  openCharacterSheet,
  enableSystemHighlight,
}: {
  paragraph: string;
  paragraphIndex: number;
  moodConfig: typeof MOOD_COLORS[CoreMoodType] | null;
  tintableWords?: Set<string>;
  npcNameMap: NPCNameMap;
  playerName: string;
  openCharacterSheet: () => void;
  enableSystemHighlight?: boolean;
}): React.ReactElement | null {
  if (!paragraph.trim()) return null;
  
  const dialogueMatch = paragraph.match(/^\*\*(.+?)\*\*:\s*"(.+)"$/);
  
  if (dialogueMatch) {
    const speakerName = dialogueMatch[1];
    const dialogueText = dialogueMatch[2];
    const speakerNpcId = resolveNPCId(speakerName, { occupation: speakerName });
    const nameReveal = processDialogueForNameReveals(dialogueText, speakerNpcId);
    
    const nameFrostStyle = moodConfig ? {
      textShadow: `0 0 ${moodConfig.glowRadius}px ${moodConfig.glowStrong}, 0 0 ${moodConfig.glowRadius * 2}px ${moodConfig.glow}`,
      color: moodConfig.primary,
    } : {};
    
    return (
      <div 
        className="my-4 pl-4 border-l-2 border-primary/50 glass-panel-subtle py-3 pr-4 rounded-r-lg transition-all duration-300"
      >
        <span 
          className="font-semibold transition-all duration-300" 
          style={moodConfig ? nameFrostStyle : { color: 'hsl(var(--primary))' }}
        >
          {parseTextForNPCLinks(speakerName, npcNameMap, `dialogue-speaker-${paragraphIndex}`, playerName, openCharacterSheet)}:
        </span>
        <span className="italic ml-2 text-foreground/90">
          {enableSystemHighlight ? (
            <SystemHighlightInline text={dialogueText} keyPrefix={`dialogue-${paragraphIndex}`} />
          ) : (
            <>&ldquo;{dialogueText}&rdquo;</>
          )}
        </span>
        {nameReveal && (
          <span className="ml-2 text-xs text-accent animate-fade-in">
            ✨ {nameReveal.type === 'name' ? 'Name revealed!' : 
               nameReveal.type === 'callsign' ? 'Callsign revealed!' : 
               nameReveal.type === 'title' ? 'Title revealed!' : 'Nickname revealed!'}
          </span>
        )}
      </div>
    );
  }

  return (
    <p className="my-4 leading-relaxed text-foreground/90 transition-all duration-300">
      <FormatTextSegment
        text={paragraph}
        keyPrefix={`p-${paragraphIndex}`}
        moodConfig={moodConfig}
        tintableWords={tintableWords}
        npcNameMap={npcNameMap}
        playerName={playerName}
        openCharacterSheet={openCharacterSheet}
        enableSystemHighlight={enableSystemHighlight}
      />
    </p>
  );
});

// Main memoized story entry component
export const MemoizedStoryEntry = memo(function MemoizedStoryEntry({
  entry,
  index,
  isLatest,
  currentMood,
  recentModifiers,
  npcNameMap,
  playerName,
  openCharacterSheet,
  onGenerateImage,
  generatingImageFor,
  isLoading,
  canRegenerateWorld,
  onRegenerateWorld,
  storyLength,
  onTapEvent,
  tapFeedback,
  rollbackSplash,
  showRollbackHint,
  enableTypewriter = false,
  textSpeed = 'normal',
  campaignId = 'default',
  characterName = 'Player',
  enableSystemHighlight = false,
}: MemoizedStoryEntryProps): React.ReactElement {
  // Typewriter state
  const [typewriterComplete, setTypewriterComplete] = useState(!enableTypewriter || !isLatest);
  
  // Memoize the cleaned content
  const cleanedContent = useMemo(() => 
    cleanNarrativeForDisplay(entry.content),
    [entry.content]
  );
  
  // Memoize mood config
  const moodConfig = useMemo(() => 
    currentMood !== 'neutral' && isLatest ? MOOD_COLORS[currentMood] : null,
    [currentMood, isLatest]
  );
  
  // Memoize tintable words
  const tintableWords = useMemo(() => 
    moodConfig ? getAnchorWords(cleanedContent, currentMood, MAX_ANCHORS_PER_PARAGRAPH) : undefined,
    [moodConfig, cleanedContent, currentMood]
  );
  
  // Memoize paragraphs split
  const paragraphs = useMemo(() => 
    cleanedContent.split('\n').filter(p => p.trim()),
    [cleanedContent]
  );
  
  const showModifiers = isLatest && recentModifiers.length > 0;
  
  if (entry.role === 'user') {
    return (
      <div className="flex justify-end">
        <Card className="p-4 max-w-[85%] bg-primary/20 border-primary/40 glass-panel rounded-2xl rounded-br-md">
          <p className="font-narrative text-foreground leading-relaxed">
            {entry.content}
          </p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex justify-start w-full">
      <Card 
        className="w-full glass-panel relative py-4 px-5 rounded-2xl rounded-bl-md cursor-pointer select-none"
        onClick={() => onTapEvent(index)}
      >
        {/* Tap feedback overlay */}
        {tapFeedback?.index === index && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl bg-warning/15 animate-pulse flex items-center justify-center z-10">
            <span className="text-sm font-bold text-warning">
              Tap {3 - tapFeedback.count} more time{tapFeedback.count === 2 ? '' : 's'} to rollback
            </span>
          </div>
        )}
        
        {/* Rollback splash effect */}
        {rollbackSplash?.index === index && (
          <div className="absolute inset-0 pointer-events-none rounded-2xl bg-destructive/25 animate-ping z-10" />
        )}
        
        {/* Hint for rollback feature */}
        {showRollbackHint && index === 1 && storyLength > 1 && (
          <div className="text-xs text-muted-foreground/60 mb-2 italic">
            (Triple-tap any narrator entry to rollback)
          </div>
        )}
        
        {/* Image if available */}
        {entry.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden">
            <img 
              src={entry.imageUrl} 
              alt="Scene illustration" 
              className="w-full h-auto"
              loading="lazy"
            />
          </div>
        )}
        
        {/* Narrative content */}
        <div className="font-narrative text-base sm:text-lg text-foreground leading-relaxed break-words overflow-wrap-anywhere">
          {/* System badges summary for latest entry */}
          {isLatest && enableSystemHighlight && (
            <SystemBadgesSummary text={cleanedContent} className="mb-3" />
          )}
          
          {paragraphs.map((paragraph, idx) => (
            <NarrativeParagraph
              key={`${entry.id}-p-${idx}`}
              paragraph={paragraph}
              paragraphIndex={idx}
              moodConfig={moodConfig}
              tintableWords={tintableWords}
              npcNameMap={npcNameMap}
              playerName={playerName}
              openCharacterSheet={openCharacterSheet}
              enableSystemHighlight={enableSystemHighlight}
            />
          ))}
          
          {/* Modifier badges */}
          {showModifiers && (
            <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
              {recentModifiers.map((mod, i) => (
                <span 
                  key={`${mod.id}-${i}`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${getModifierBadgeClass(mod)} border-current/30 bg-current/10`}
                >
                  {mod.type === 'buff' ? '↑' : '↓'} {mod.name}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex justify-between items-center flex-wrap gap-2">
          {/* Left side - Bookmark button */}
          <div className="flex items-center gap-2">
            <BookmarkButton
              entryId={entry.id}
              entryIndex={index}
              entryContent={cleanedContent.slice(0, 200)}
              campaignId={campaignId}
              characterName={characterName}
              size="sm"
              className="opacity-60 hover:opacity-100"
            />
          </div>
          
          {/* Right side - Action buttons (only on latest entry) */}
          {index === storyLength - 1 && (
            <div className="flex gap-2 flex-wrap">
              {canRegenerateWorld && storyLength === 1 && onRegenerateWorld && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegenerateWorld();
                  }}
                  disabled={isLoading}
                  className="border-warning/50 text-warning hover:bg-warning/10 hover:border-warning"
                  title="Generate a new opening scene"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Regenerate World
                    </>
                  )}
                </Button>
              )}
              
              {!entry.imageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenerateImage(entry.id);
                  }}
                  disabled={!!generatingImageFor}
                >
                  {generatingImageFor === entry.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Illustrate Scene
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these specific props change
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.content === nextProps.entry.content &&
    prevProps.entry.imageUrl === nextProps.entry.imageUrl &&
    prevProps.isLatest === nextProps.isLatest &&
    prevProps.currentMood === nextProps.currentMood &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.generatingImageFor === nextProps.generatingImageFor &&
    prevProps.storyLength === nextProps.storyLength &&
    prevProps.tapFeedback?.index === nextProps.tapFeedback?.index &&
    prevProps.tapFeedback?.count === nextProps.tapFeedback?.count &&
    prevProps.rollbackSplash?.index === nextProps.rollbackSplash?.index &&
    prevProps.enableSystemHighlight === nextProps.enableSystemHighlight &&
    // Only compare modifiers for latest entry
    (prevProps.isLatest === nextProps.isLatest && 
     (!nextProps.isLatest || prevProps.recentModifiers.length === nextProps.recentModifiers.length))
  );
});
