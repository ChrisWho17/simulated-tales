// Immersive Conversation UI Component

import { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { NPC, EmotionalState, Relationship } from '@/types/game';
import { EraId } from '@/game/eraSystem';
import { EmotionType, emotionalStateToEmotion, getOrGeneratePortrait, PortraitConfig } from '@/game/portraitSystem';
import { PortraitFrame } from './PortraitFrame';
import { DialogueBubble } from './DialogueBubble';
import { ResponseOptions, ResponseType } from './ResponseOptions';
import { MoodIndicator } from './MoodIndicator';
import { CharacterInfoSheet } from './CharacterInfoSheet';
import { npcWeatherReactionSystem, NPCWeatherPersonality } from '@/game/npcWeatherReactionSystem';
import { WeatherType } from '@/game/weatherSystem';
import { 
  MessageSquare, X, Loader2, ChevronRight, Cloud
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogueEntry {
  id: string;
  speaker: 'npc' | 'player';
  content: string;
  timestamp: number;
  emotion?: EmotionType;
  isWeatherComment?: boolean;
}

export interface ConversationResponse {
  text: string;
  type: ResponseType;
  icon?: string;
  relationshipImpact?: number;
  action?: string;
}

// Extended NPC type with weather personality
interface NPCWithWeather extends NPC {
  weatherPersonality?: NPCWeatherPersonality;
  weatherSmallTalk?: { topic: 'weather'; line: string } | null;
}

interface ConversationUIProps {
  npc: NPC;
  dialogueHistory: DialogueEntry[];
  responses: ConversationResponse[];
  onSelectResponse: (response: ConversationResponse) => void;
  onEndConversation: () => void;
  genre: string;
  era: EraId;
  isLoading?: boolean;
  typewriterEffect?: boolean;
  currentWeather?: WeatherType;
}

export function ConversationUI({
  npc,
  dialogueHistory,
  responses,
  onSelectResponse,
  onEndConversation,
  genre,
  era,
  isLoading = false,
  typewriterEffect = true,
  currentWeather = 'clear'
}: ConversationUIProps) {
  const [portrait, setPortrait] = useState<string | null>(null);
  const [isLoadingPortrait, setIsLoadingPortrait] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionType>('neutral');
  const [isEntering, setIsEntering] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [weatherDialogueShown, setWeatherDialogueShown] = useState(false);
  const [weatherDialogue, setWeatherDialogue] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Cast NPC to extended type
  const npcWithWeather = npc as NPCWithWeather;

  // Get relationship
  const relationship: Relationship = npc.relationships?.player || {
    affection: 50,
    trust: 50,
    fear: 0,
    respect: 50
  };

  // Get relationship color
  const getRelationshipColor = (): 'green' | 'yellow' | 'red' | 'pink' | 'cyan' => {
    const rel = npc.relationships?.player;
    if (!rel) return 'cyan'; // mysterious
    
    const score = rel.affection + rel.trust - rel.fear;
    if (score > 50) return 'green'; // friendly
    if (score < -30) return 'red'; // hostile
    if (rel.affection > 30) return 'pink'; // romantic
    return 'yellow'; // neutral
  };

  // Load portrait on mount or emotion change
  useEffect(() => {
    const loadPortrait = async () => {
      setIsLoadingPortrait(true);
      const config: PortraitConfig = {
        genre,
        era,
        emotion: currentEmotion
      };
      
      const portraitUrl = await getOrGeneratePortrait(npc, config);
      setPortrait(portraitUrl);
      setIsLoadingPortrait(false);
    };
    
    loadPortrait();
  }, [npc.id, currentEmotion, genre, era]);

  // Update emotion based on NPC state
  useEffect(() => {
    const emotion = emotionalStateToEmotion(npc.emotionalState.current);
    setCurrentEmotion(emotion);
  }, [npc.emotionalState.current]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [dialogueHistory]);

  // Entry animation
  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Generate weather dialogue on conversation start
  useEffect(() => {
    if (!weatherDialogueShown && currentWeather) {
      // Use existing weather personality or generate one
      let weatherPersonality = npcWithWeather.weatherPersonality;
      if (!weatherPersonality) {
        weatherPersonality = npcWeatherReactionSystem.generateWeatherPersonality();
      }
      
      // Check if NPC wants to discuss weather
      const smallTalk = npcWeatherReactionSystem.getWeatherSmallTalk(weatherPersonality, currentWeather);
      if (smallTalk) {
        setWeatherDialogue(smallTalk.line);
      }
      setWeatherDialogueShown(true);
    }
  }, [currentWeather, weatherDialogueShown, npcWithWeather.weatherPersonality]);

  const handleEndConversation = () => {
    setIsExiting(true);
    setTimeout(onEndConversation, 400);
  };

  const handlePortraitClick = () => {
    setShowCharacterSheet(true);
  };

  const relationshipColor = getRelationshipColor();

  return (
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/80 backdrop-blur-sm",
        isEntering && "animate-fade-in",
        isExiting && "animate-fade-out"
      )}
    >
      {/* Main conversation container */}
      <div 
        className={cn(
          "w-full max-w-5xl h-[90vh] md:h-[85vh]",
          "flex flex-col md:flex-row gap-4 p-4",
          "glass-panel border-[rgba(139,92,246,0.3)]",
          isEntering && "animate-scale-in",
          isExiting && "animate-scale-out"
        )}
      >
        {/* Left side - Portrait (clickable for character sheet) */}
        <div 
          className={cn(
            "w-full md:w-80 shrink-0",
            "flex flex-col items-center",
            isEntering && "animate-slide-in-left"
          )}
          style={{ animationDelay: '0.1s' }}
        >
          <div 
            onClick={handlePortraitClick}
            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
            title="Tap to view character details"
          >
            <PortraitFrame
              portrait={portrait}
              isLoading={isLoadingPortrait}
              relationshipColor={relationshipColor}
              genre={genre}
              npcName={npc.meta.name}
              emotion={currentEmotion}
            />
          </div>
          
          {/* NPC Info */}
          <div className="mt-4 text-center w-full">
            <h2 className="text-xl font-display font-bold text-foreground">
              {npc.meta.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {npc.meta.occupation}
            </p>
            
            {/* Mood Indicator */}
            <div className="mt-3 flex justify-center">
              <MoodIndicator 
                emotion={currentEmotion} 
                emotionalState={npc.emotionalState.current}
              />
            </div>
            
            {/* Relationship bar */}
            <div className="mt-3 px-4">
              <div className="h-1.5 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    relationshipColor === 'green' && "bg-success",
                    relationshipColor === 'yellow' && "bg-warning",
                    relationshipColor === 'red' && "bg-destructive",
                    relationshipColor === 'pink' && "bg-pink-500",
                    relationshipColor === 'cyan' && "bg-cyan-500"
                  )}
                  style={{ 
                    width: `${Math.max(10, Math.min(100, 50 + (npc.relationships?.player?.affection || 0) / 2))}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Dialogue */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Conversation</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEndConversation}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Dialogue history */}
          <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
            <div className="space-y-4 pb-4">
              {/* Weather greeting if NPC wants to discuss weather */}
              {weatherDialogue && dialogueHistory.length === 0 && (
                <div className="flex items-start gap-2 animate-fade-in">
                  <Cloud className="w-4 h-4 text-muted-foreground mt-1 shrink-0" />
                  <DialogueBubble
                    entry={{
                      id: 'weather-greeting',
                      speaker: 'npc',
                      content: weatherDialogue,
                      timestamp: Date.now(),
                      emotion: currentEmotion,
                      isWeatherComment: true
                    }}
                    npcName={npc.meta.name}
                    typewriterEffect={typewriterEffect}
                    accentColor={relationshipColor}
                  />
                </div>
              )}
              
              {dialogueHistory.map((entry, index) => (
                <DialogueBubble
                  key={entry.id}
                  entry={entry}
                  npcName={npc.meta.name}
                  typewriterEffect={typewriterEffect && index === dialogueHistory.length - 1}
                  accentColor={relationshipColor}
                />
              ))}
              
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm italic">{npc.meta.name} is thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Response options */}
          <div className="mt-4 pt-4 border-t border-[rgba(139,92,246,0.2)]">
            {!isLoading && responses.length > 0 && (
              <ResponseOptions
                responses={responses}
                onSelect={onSelectResponse}
                disabled={isLoading}
              />
            )}
            
            {/* Leave conversation button */}
            <Button
              variant="ghost"
              onClick={handleEndConversation}
              className="w-full mt-3 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4 mr-2" />
              End conversation
            </Button>
          </div>
        </div>
      </div>

      {/* Character Info Sheet Modal */}
      {showCharacterSheet && (
        <CharacterInfoSheet
          npc={npc}
          portrait={portrait}
          relationship={relationship}
          emotion={currentEmotion}
          onClose={() => setShowCharacterSheet(false)}
          relationshipColor={relationshipColor}
        />
      )}
    </div>
  );
}
