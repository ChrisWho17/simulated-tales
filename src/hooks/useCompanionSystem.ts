import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  companionSystem, 
  CompanionState, 
  PlayerActionType,
  COMPANION_TEMPLATES 
} from '@/game/companionSystem';
import { 
  RelationshipEvent, 
  DialogueChoice,
  relationshipEventManager 
} from '@/game/companionRelationshipEvents';
import {
  loyaltyQuestManager,
  LoyaltyQuest,
  LoyaltyQuestOutcome
} from '@/game/companionLoyaltyQuestSystem';
import { toast } from 'sonner';

export interface CompanionComment {
  id: string;
  companion: CompanionState;
  comment: string;
  timestamp: number;
  dialogueType: 'reaction' | 'ambient' | 'event' | 'romance' | 'betrayal' | 'farewell';
}

export interface PendingRelationshipEvent {
  companion: CompanionState;
  event: RelationshipEvent;
}

export interface PendingLoyaltyQuest {
  companion: CompanionState;
  quest: LoyaltyQuest;
}

interface UseCompanionSystemOptions {
  enableAIDialogue?: boolean;
  autoCommentChance?: number; // 0-1, chance of ambient comments
  genre?: string;
}

export function useCompanionSystem(options: UseCompanionSystemOptions = {}) {
  const { 
    enableAIDialogue = true, 
    autoCommentChance = 0.3,
    genre = 'fantasy' 
  } = options;

  const [activeCompanions, setActiveCompanions] = useState<CompanionState[]>([]);
  const [pendingComments, setPendingComments] = useState<CompanionComment[]>([]);
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [pendingRelationshipEvent, setPendingRelationshipEvent] = useState<PendingRelationshipEvent | null>(null);
  const [pendingLoyaltyQuest, setPendingLoyaltyQuest] = useState<PendingLoyaltyQuest | null>(null);
  const lastCommentTime = useRef<number>(0);
  const lastEventCheck = useRef<number>(0);
  const lastLoyaltyCheck = useRef<number>(0);
  const commentCooldown = 10000; // 10 seconds between ambient comments
  const eventCheckCooldown = 30000; // 30 seconds between relationship event checks
  const loyaltyCheckCooldown = 60000; // 60 seconds between loyalty quest checks

  // Refresh active companions
  const refreshCompanions = useCallback(() => {
    setActiveCompanions(companionSystem.getActiveCompanions());
  }, []);

  useEffect(() => {
    refreshCompanions();
    // Set up periodic refresh
    const interval = setInterval(refreshCompanions, 5000);
    return () => clearInterval(interval);
  }, [refreshCompanions]);

  // Generate AI dialogue for a companion
  const generateAIDialogue = useCallback(async (
    companion: CompanionState,
    situation: string,
    dialogueType: 'reaction' | 'ambient' | 'event' | 'romance' | 'betrayal' | 'farewell' = 'ambient',
    playerAction?: string,
    recentEvents?: string[]
  ): Promise<string | null> => {
    if (!enableAIDialogue) {
      // Use fallback dialogue from companion system
      const commentary = companionSystem.getCompanionCommentary(situation);
      return commentary?.comment || null;
    }

    setIsGeneratingDialogue(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-companion-dialogue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companion,
          situation,
          playerAction,
          recentEvents,
          dialogueType,
          genre,
        }),
      });

      if (!response.ok) {
        console.error('AI dialogue generation failed:', response.status);
        // Fallback to local dialogue
        const commentary = companionSystem.getCompanionCommentary(situation);
        return commentary?.comment || null;
      }

      const data = await response.json();
      
      // Apply mood shift if returned
      if (data.moodShift) {
        const comp = companionSystem.getCompanion(companion.id);
        if (comp) {
          comp.mood = data.moodShift;
        }
      }

      // Apply affinity delta if returned
      if (data.affinityDelta) {
        const comp = companionSystem.getCompanion(companion.id);
        if (comp) {
          comp.affinity = Math.max(-100, Math.min(100, comp.affinity + data.affinityDelta));
        }
      }

      refreshCompanions();
      
      // Combine physical action with dialogue if present
      let fullDialogue = data.dialogue || '';
      if (data.physicalAction) {
        fullDialogue = `${data.physicalAction} ${fullDialogue}`;
      }

      return fullDialogue;
    } catch (error) {
      console.error('Error generating AI dialogue:', error);
      // Fallback to local dialogue
      const commentary = companionSystem.getCompanionCommentary(situation);
      return commentary?.comment || null;
    } finally {
      setIsGeneratingDialogue(false);
    }
  }, [enableAIDialogue, genre, refreshCompanions]);

  // Process player action and get companion reactions
  const processPlayerAction = useCallback(async (
    actionType: PlayerActionType,
    context?: string
  ): Promise<CompanionComment[]> => {
    // First, let the local system process the action
    companionSystem.processPlayerAction(actionType, context);
    refreshCompanions();

    const comments: CompanionComment[] = [];
    const companions = companionSystem.getActiveCompanions();

    for (const companion of companions) {
      if (companion.wantsToSpeak && companion.pendingReaction) {
        // Use the pending reaction or generate AI dialogue
        let dialogue = companion.pendingReaction;
        
        if (enableAIDialogue && Math.random() > 0.5) {
          const aiDialogue = await generateAIDialogue(
            companion,
            context || `Player performed: ${actionType}`,
            'reaction',
            actionType
          );
          if (aiDialogue) {
            dialogue = aiDialogue;
          }
        }

        comments.push({
          id: `comment_${companion.id}_${Date.now()}`,
          companion: { ...companion },
          comment: dialogue,
          timestamp: Date.now(),
          dialogueType: 'reaction',
        });

        // Clear the pending reaction
        companion.wantsToSpeak = false;
        companion.pendingReaction = undefined;
      }
    }

    if (comments.length > 0) {
      setPendingComments(prev => [...prev, ...comments]);
    }

    return comments;
  }, [enableAIDialogue, generateAIDialogue, refreshCompanions]);

  // Get ambient commentary (for story moments)
  const getAmbientCommentary = useCallback(async (
    situation: string
  ): Promise<CompanionComment | null> => {
    const now = Date.now();
    if (now - lastCommentTime.current < commentCooldown) {
      return null; // Still in cooldown
    }

    // Check chance for ambient comment
    if (Math.random() > autoCommentChance) {
      return null;
    }

    const companions = companionSystem.getActiveCompanions();
    if (companions.length === 0) return null;

    // Pick a random companion
    const companion = companions[Math.floor(Math.random() * companions.length)];

    let dialogue: string | null = null;
    
    if (enableAIDialogue) {
      dialogue = await generateAIDialogue(companion, situation, 'ambient');
    } else {
      const commentary = companionSystem.getCompanionCommentary(situation);
      dialogue = commentary?.comment || null;
    }

    if (!dialogue) return null;

    lastCommentTime.current = now;

    const comment: CompanionComment = {
      id: `ambient_${companion.id}_${now}`,
      companion: { ...companion },
      comment: dialogue,
      timestamp: now,
      dialogueType: 'ambient',
    };

    setPendingComments(prev => [...prev, comment]);
    return comment;
  }, [autoCommentChance, enableAIDialogue, generateAIDialogue]);

  // Check for relationship events
  const checkForRelationshipEvent = useCallback((): PendingRelationshipEvent | null => {
    const now = Date.now();
    if (now - lastEventCheck.current < eventCheckCooldown) {
      return null; // Still in cooldown
    }

    const companions = companionSystem.getActiveCompanions();
    if (companions.length === 0) return null;

    // Shuffle companions to not always check the same one first
    const shuffled = [...companions].sort(() => Math.random() - 0.5);

    for (const companion of shuffled) {
      const event = relationshipEventManager.tryGetRandomEvent(companion);
      if (event) {
        lastEventCheck.current = now;
        const pendingEvent = { companion, event };
        setPendingRelationshipEvent(pendingEvent);
        return pendingEvent;
      }
    }

    return null;
  }, []);

  // Clear the pending relationship event
  const clearRelationshipEvent = useCallback(() => {
    setPendingRelationshipEvent(null);
  }, []);

  // Handle relationship event choice
  const handleRelationshipChoice = useCallback((
    companion: CompanionState,
    event: RelationshipEvent,
    choice: DialogueChoice
  ) => {
    // Apply all effects
    if (choice.effects.affinity) {
      companionSystem.adjustAffinity(companion.id, choice.effects.affinity);
    }
    if (choice.effects.trust) {
      companionSystem.adjustTrust(companion.id, choice.effects.trust);
    }
    if (choice.effects.respect) {
      companionSystem.adjustRespect(companion.id, choice.effects.respect);
    }
    if (choice.effects.fear) {
      companionSystem.adjustFear(companion.id, choice.effects.fear);
    }
    if (choice.effects.romanticInterest) {
      companionSystem.adjustRomance(companion.id, choice.effects.romanticInterest);
    }
    if (choice.effects.moodChange) {
      companionSystem.setMood(companion.id, choice.effects.moodChange);
    }

    // Register with event manager
    relationshipEventManager.applyChoice(companion.id, event.id, choice);
    
    // Clear and refresh
    clearRelationshipEvent();
    refreshCompanions();

    // Add as a comment for narrative display
    const comment: CompanionComment = {
      id: `event_${companion.id}_${Date.now()}`,
      companion: { ...companion },
      comment: choice.companionResponse,
      timestamp: Date.now(),
      dialogueType: 'event',
    };
    setPendingComments(prev => [...prev, comment]);

    return comment;
  }, [clearRelationshipEvent, refreshCompanions]);

  // Clear a specific comment
  const dismissComment = useCallback((commentId: string) => {
    setPendingComments(prev => prev.filter(c => c.id !== commentId));
  }, []);

  // Clear all pending comments
  const clearAllComments = useCallback(() => {
    setPendingComments([]);
  }, []);

  // Create and recruit a companion
  const createAndRecruitCompanion = useCallback((
    name: string,
    template: keyof typeof COMPANION_TEMPLATES
  ): { success: boolean; message: string; companion?: CompanionState } => {
    const id = `companion_${Date.now()}`;
    const companion = companionSystem.createCompanion(id, name, template);
    const result = companionSystem.recruitCompanion(id);
    
    if (result.success) {
      refreshCompanions();
      toast.success(`${name} has joined your party!`);
      return { success: true, message: result.message, companion };
    }
    
    return { success: false, message: result.message };
  }, [refreshCompanions]);

  // Serialize companion state for saving
  const serialize = useCallback(() => {
    return companionSystem.serialize();
  }, []);

  // Deserialize companion state from save
  const deserialize = useCallback((data: { companions: CompanionState[]; activeIds: string[] }) => {
    companionSystem.deserialize(data);
    refreshCompanions();
  }, [refreshCompanions]);

  // Check for available loyalty quests
  const checkForLoyaltyQuest = useCallback(() => {
    const now = Date.now();
    if (now - lastLoyaltyCheck.current < loyaltyCheckCooldown) return null;
    lastLoyaltyCheck.current = now;

    const companions = companionSystem.getActiveCompanions();
    
    for (const companion of companions) {
      // Generate quests if not already done
      loyaltyQuestManager.generateQuestsForCompanion(companion);
      
      // Check for available quest
      const availableQuest = loyaltyQuestManager.getAvailableLoyaltyQuest(companion);
      if (availableQuest) {
        setPendingLoyaltyQuest({ companion, quest: availableQuest });
        return { companion, quest: availableQuest };
      }
    }
    
    return null;
  }, []);

  // Accept and start a loyalty quest
  const acceptLoyaltyQuest = useCallback(() => {
    if (!pendingLoyaltyQuest) return false;
    
    const success = loyaltyQuestManager.startQuest(
      pendingLoyaltyQuest.companion.id,
      pendingLoyaltyQuest.quest.id
    );
    
    if (success) {
      toast.success(`Loyalty Quest Started: ${pendingLoyaltyQuest.quest.title}`, {
        description: `${pendingLoyaltyQuest.companion.name} has opened up to you.`
      });
    }
    
    setPendingLoyaltyQuest(null);
    return success;
  }, [pendingLoyaltyQuest]);

  // Defer a loyalty quest for later
  const deferLoyaltyQuest = useCallback(() => {
    setPendingLoyaltyQuest(null);
  }, []);

  // Complete a loyalty quest with chosen outcome
  const completeLoyaltyQuest = useCallback((companionId: string, outcomeId: string) => {
    const outcome = loyaltyQuestManager.completeQuest(companionId, outcomeId);
    
    if (outcome) {
      // Apply companion effects
      const effects = outcome.companionEffects;
      if (effects.trustChange) companionSystem.adjustTrust(companionId, effects.trustChange);
      if (effects.affinityChange) companionSystem.adjustAffinity(companionId, effects.affinityChange);
      if (effects.respectChange) companionSystem.adjustRespect(companionId, effects.respectChange);
      if (effects.romanticChange) companionSystem.adjustRomance(companionId, effects.romanticChange);
      if (effects.permanentMoodChange) {
        companionSystem.setMood(companionId, effects.permanentMoodChange as any);
      }
      
      toast.success('Loyalty Quest Completed!', {
        description: outcome.narrativeConclusion.slice(0, 100) + '...'
      });
      
      refreshCompanions();
    }
    
    return outcome;
  }, [refreshCompanions]);

  // Get active loyalty quest for a companion
  const getActiveLoyaltyQuest = useCallback((companionId: string) => {
    return loyaltyQuestManager.getActiveQuest(companionId);
  }, []);

  // Progress a loyalty quest objective
  const progressLoyaltyObjective = useCallback((companionId: string, objectiveId: string) => {
    return loyaltyQuestManager.progressObjective(companionId, objectiveId);
  }, []);

  return {
    activeCompanions,
    pendingComments,
    isGeneratingDialogue,
    pendingRelationshipEvent,
    pendingLoyaltyQuest,
    processPlayerAction,
    getAmbientCommentary,
    generateAIDialogue,
    checkForRelationshipEvent,
    clearRelationshipEvent,
    handleRelationshipChoice,
    checkForLoyaltyQuest,
    acceptLoyaltyQuest,
    deferLoyaltyQuest,
    completeLoyaltyQuest,
    getActiveLoyaltyQuest,
    progressLoyaltyObjective,
    dismissComment,
    clearAllComments,
    createAndRecruitCompanion,
    refreshCompanions,
    serialize,
    deserialize,
    // Direct access to companion system
    getCompanion: companionSystem.getCompanion.bind(companionSystem),
    getPartySize: companionSystem.getPartySize.bind(companionSystem),
    recruitCompanion: (id: string) => {
      const result = companionSystem.recruitCompanion(id);
      refreshCompanions();
      return result;
    },
    dismissCompanion: (id: string, reason: 'player' | 'voluntary' | 'hostile' = 'player') => {
      companionSystem.dismissCompanion(id, reason);
      refreshCompanions();
    },
  };
}
