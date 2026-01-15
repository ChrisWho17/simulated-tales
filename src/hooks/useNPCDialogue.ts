// Hook for managing AI-generated NPC dialogue

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NPC, Relationship } from '@/types/game';
import { DialogueEntry, ConversationResponse } from '@/components/conversation/ConversationUI';
import { toast } from 'sonner';
import { 
  updateMilestoneFromProgression, 
  addRelationshipMoment,
  MilestoneProgression,
  MilestoneType 
} from '@/lib/relationshipJournal';

// Player state context for NPC reactions
export interface PlayerStateContext {
  // Armor and clothing
  currentOutfit?: string;
  armorType?: 'none' | 'light' | 'medium' | 'heavy';
  armorCondition?: 'pristine' | 'worn' | 'damaged' | 'destroyed';
  visibleWeapons?: string[];
  
  // Physical state
  wounds?: { location: string; severity: 'minor' | 'moderate' | 'severe' | 'critical' }[];
  bloodVisible?: boolean;
  exhaustionLevel?: number; // 0-100
  
  // Emotional state
  currentMood?: string;
  moodIntensity?: number; // 0-100
  visibleEmotions?: string[]; // trembling, crying, laughing, scowling, etc.
  
  // Environmental effects on player
  wetFromRain?: boolean;
  dirtyCovered?: boolean;
  coldShivering?: boolean;
}

interface UseNPCDialogueProps {
  npc: NPC;
  genre: string;
  era: string;
  playerRelationship?: Relationship;
  relationshipMilestone?: MilestoneType;
  playerState?: PlayerStateContext;
  weatherContext?: string;
}

interface DialogueIndicators {
  memoryTriggered: boolean;
  traumaTriggered: boolean;
  contradictionDetected: boolean;
  emotionalShift?: string;
}

interface DialogueResponse {
  dialogue: string;
  npcId: string;
  importantTopics?: string[];
  indicators?: DialogueIndicators;
  milestoneProgression?: MilestoneProgression;
}

export function useNPCDialogue({ npc, genre, era, playerRelationship, relationshipMilestone, playerState, weatherContext }: UseNPCDialogueProps) {
  const [dialogueHistory, setDialogueHistory] = useState<DialogueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIndicators, setCurrentIndicators] = useState<DialogueIndicators | null>(null);

  const relationship = playerRelationship || npc.relationships?.player || {
    affection: 50,
    trust: 50,
    fear: 0,
    respect: 50
  };

  const generateDialogue = useCallback(async (
    playerMessage?: string,
    isFirstMessage = false
  ): Promise<DialogueResponse | null> => {
    setIsLoading(true);

    try {
      // Build NPC context for the AI
      const npcContext = {
        name: npc.meta.name,
        occupation: npc.meta.occupation,
        age: npc.meta.age,
        traits: npc.meta.traits,
        currentEmotion: npc.emotionalState.current,
        stressLevel: npc.stressLevel,
        conflictStyle: npc.conflictStyle,
        identity: {
          selfStory: npc.identity.selfStory,
          identityThreat: npc.identity.identityThreat
        },
        memories: npc.memory.slice(0, 5).map(m => m.event),
        secrets: npc.meta.secrets,
        desires: npc.meta.desires
      };

      // Build conversation history for context
      const conversationContext = dialogueHistory.map(entry => ({
        speaker: entry.speaker,
        content: entry.content
      }));

      const { data, error } = await supabase.functions.invoke('generate-npc-dialogue', {
        body: {
          npc: npcContext,
          relationship,
          playerMessage,
          conversationHistory: conversationContext,
          genre,
          era,
          isFirstMessage,
          playerState,
          weatherContext
        }
      });

      if (error) {
        console.error('Dialogue generation error:', error);
        toast.error('Failed to generate dialogue');
        return null;
      }

      if (data.error) {
        if (data.error.includes('credits')) {
          toast.error('AI credits exhausted. Please add funds.');
        } else {
          toast.error(data.error);
        }
        return null;
      }

      // Update indicators if present
      if (data.indicators) {
        setCurrentIndicators(data.indicators);
      }

      // Handle milestone progression if present
      if (data.milestoneProgression?.shouldProgress) {
        updateMilestoneFromProgression(
          npc.id,
          npc.meta.name,
          data.milestoneProgression
        );
        
        // Show a subtle toast for milestone progression (only shown in journal, not story)
        const newMilestone = data.milestoneProgression.suggestedMilestone;
        if (newMilestone) {
          toast.success(`Relationship with ${npc.meta.name} evolved!`, {
            description: `Now: ${newMilestone.replace('_', ' ')}`,
            duration: 3000,
          });
        }
      }

      return data as DialogueResponse;
    } catch (err) {
      console.error('Error generating dialogue:', err);
      toast.error('Failed to connect to dialogue service');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [npc, relationship, dialogueHistory, genre, era, playerState, weatherContext]);

  const startConversation = useCallback(async () => {
    const result = await generateDialogue(undefined, true);
    if (result) {
      const entry: DialogueEntry = {
        id: `npc-${Date.now()}`,
        speaker: 'npc',
        content: result.dialogue,
        timestamp: Date.now(),
        emotion: npc.emotionalState.current as any
      };
      setDialogueHistory([entry]);
      
      // Record first conversation moment
      addRelationshipMoment(
        npc.id,
        npc.meta.name,
        'first_conversation',
        `First conversation with ${npc.meta.name}`,
        { emotionalImpact: 10 }
      );
    }
  }, [generateDialogue, npc.emotionalState.current, npc.id, npc.meta.name]);

  const sendPlayerMessage = useCallback(async (message: string, responseType?: string) => {
    // Add player message to history
    const playerEntry: DialogueEntry = {
      id: `player-${Date.now()}`,
      speaker: 'player',
      content: message,
      timestamp: Date.now()
    };
    setDialogueHistory(prev => [...prev, playerEntry]);

    // Generate NPC response
    const result = await generateDialogue(message, false);
    if (result) {
      const npcEntry: DialogueEntry = {
        id: `npc-${Date.now()}`,
        speaker: 'npc',
        content: result.dialogue,
        timestamp: Date.now(),
        emotion: currentIndicators?.emotionalShift as any || npc.emotionalState.current as any
      };
      setDialogueHistory(prev => [...prev, npcEntry]);
    }
  }, [generateDialogue, currentIndicators, npc.emotionalState.current]);

  const generateResponseOptions = useCallback((): ConversationResponse[] => {
    // Generate context-aware response options based on relationship and NPC state
    const options: ConversationResponse[] = [];

    // Always have a neutral option
    options.push({
      text: "Tell me more about yourself.",
      type: 'probe',
      icon: '💬',
      relationshipImpact: 0
    });

    // Friendly option if relationship is decent
    if (relationship.affection > 20) {
      options.push({
        text: "It's good to see you.",
        type: 'friendly',
        icon: '🤝',
        relationshipImpact: 2
      });
    }

    // Flirt option if appropriate
    if (relationship.affection > 40 && relationship.trust > 30) {
      options.push({
        text: "You look good today.",
        type: 'flirt',
        icon: '❤️',
        relationshipImpact: 5
      });
    }

    // Probe for secrets if trust is low
    if (relationship.trust < 40) {
      options.push({
        text: "What are you hiding?",
        type: 'probe',
        icon: '🔍',
        relationshipImpact: -3
      });
    }

    // Aggressive option if fear is high
    if (relationship.fear > 30 || npc.stressLevel > 60) {
      options.push({
        text: "Don't waste my time.",
        type: 'aggressive',
        icon: '😠',
        relationshipImpact: -10
      });
    }

    // Add a deceptive option occasionally
    if (Math.random() > 0.5) {
      options.push({
        text: "I heard something interesting about you...",
        type: 'deceive',
        icon: '🎭',
        relationshipImpact: -5
      });
    }

    return options.slice(0, 5); // Max 5 options
  }, [relationship, npc.stressLevel]);

  const resetConversation = useCallback(() => {
    setDialogueHistory([]);
    setCurrentIndicators(null);
  }, []);

  return {
    dialogueHistory,
    isLoading,
    currentIndicators,
    startConversation,
    sendPlayerMessage,
    generateResponseOptions,
    resetConversation
  };
}
