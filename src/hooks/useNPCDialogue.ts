// Hook for managing AI-generated NPC dialogue

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { NPC, Relationship } from '@/types/game';
import { DialogueEntry, ConversationResponse } from '@/components/conversation/ConversationUI';
import { toast } from 'sonner';

interface UseNPCDialogueProps {
  npc: NPC;
  genre: string;
  era: string;
  playerRelationship?: Relationship;
}

interface DialogueIndicators {
  memoryTriggered: boolean;
  traumaTriggered: boolean;
  contradictionDetected: boolean;
  emotionalShift?: string;
}

export function useNPCDialogue({ npc, genre, era, playerRelationship }: UseNPCDialogueProps) {
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
  ): Promise<string | null> => {
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
          isFirstMessage
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

      return data.dialogue;
    } catch (err) {
      console.error('Error generating dialogue:', err);
      toast.error('Failed to connect to dialogue service');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [npc, relationship, dialogueHistory, genre, era]);

  const startConversation = useCallback(async () => {
    const greeting = await generateDialogue(undefined, true);
    if (greeting) {
      const entry: DialogueEntry = {
        id: `npc-${Date.now()}`,
        speaker: 'npc',
        content: greeting,
        timestamp: Date.now(),
        emotion: npc.emotionalState.current as any
      };
      setDialogueHistory([entry]);
    }
  }, [generateDialogue, npc.emotionalState.current]);

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
    const response = await generateDialogue(message, false);
    if (response) {
      const npcEntry: DialogueEntry = {
        id: `npc-${Date.now()}`,
        speaker: 'npc',
        content: response,
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
