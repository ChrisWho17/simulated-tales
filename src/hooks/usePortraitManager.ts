// Portrait Manager Hook - Handles lazy loading, CSS fallbacks, and transitions

import { useState, useEffect, useCallback, useRef } from 'react';
import { NPC, EmotionalState } from '@/types/game';
import { EraId } from '@/game/eraSystem';
import {
  EmotionType,
  emotionalStateToEmotion,
  getPortraitForEmotion,
  getCachedPortrait,
  subscribeToPortraitGeneration,
  EMOTION_TO_PORTRAIT
} from '@/game/portraitSystem';

export interface PortraitState {
  currentUrl: string | null;
  previousUrl: string | null;
  currentEmotion: EmotionType;
  isTransitioning: boolean;
  useCSSFallback: boolean;
  fallbackEmotion: EmotionType | null;
  isLoading: boolean;
  isGenerating: boolean;
}

interface UsePortraitManagerOptions {
  npc: NPC;
  genre: string;
  era: EraId;
  autoUpdateOnEmotionChange?: boolean;
}

export function usePortraitManager({
  npc,
  genre,
  era,
  autoUpdateOnEmotionChange = true
}: UsePortraitManagerOptions) {
  const [state, setState] = useState<PortraitState>({
    currentUrl: npc.portrait || null,
    previousUrl: null,
    currentEmotion: 'neutral',
    isTransitioning: false,
    useCSSFallback: false,
    fallbackEmotion: null,
    isLoading: !npc.portrait,
    isGenerating: false
  });
  
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmotionRef = useRef<EmotionType>('neutral');

  // Load portrait for a specific emotion
  const loadPortrait = useCallback(async (targetEmotion: EmotionType) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const result = await getPortraitForEmotion(npc, targetEmotion, genre, era);
    
    setState(prev => {
      // If we got a new URL that's different from current, trigger transition
      if (result.url && result.url !== prev.currentUrl && !result.useCSSFallback) {
        return {
          ...prev,
          previousUrl: prev.currentUrl,
          currentUrl: result.url,
          currentEmotion: targetEmotion,
          isTransitioning: true,
          useCSSFallback: false,
          fallbackEmotion: null,
          isLoading: false,
          isGenerating: false
        };
      }
      
      // Using CSS fallback
      return {
        ...prev,
        currentEmotion: targetEmotion,
        useCSSFallback: result.useCSSFallback,
        fallbackEmotion: result.fallbackEmotion || null,
        isLoading: false,
        isGenerating: result.isGenerating || false
      };
    });
  }, [npc, genre, era]);

  // Watch for NPC emotional state changes
  useEffect(() => {
    if (!autoUpdateOnEmotionChange) return;
    
    const newEmotion = emotionalStateToEmotion(npc.emotionalState.current);
    
    if (newEmotion !== lastEmotionRef.current) {
      lastEmotionRef.current = newEmotion;
      loadPortrait(newEmotion);
    }
  }, [npc.emotionalState.current, autoUpdateOnEmotionChange, loadPortrait]);

  // Subscribe to background portrait generations
  useEffect(() => {
    const unsubscribe = subscribeToPortraitGeneration((event) => {
      if (event.npcId !== npc.id) return;
      
      // Check if this is the emotion we're currently displaying with CSS fallback
      const currentFallbackKey = state.fallbackEmotion;
      
      if (event.emotion === currentFallbackKey || event.emotion === state.currentEmotion) {
        // New portrait ready! Trigger transition
        setState(prev => ({
          ...prev,
          previousUrl: prev.currentUrl,
          currentUrl: event.url,
          isTransitioning: true,
          useCSSFallback: false,
          fallbackEmotion: null,
          isGenerating: false
        }));
      }
    });
    
    return unsubscribe;
  }, [npc.id, state.fallbackEmotion, state.currentEmotion]);

  // Handle transition completion
  useEffect(() => {
    if (state.isTransitioning) {
      transitionTimeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          isTransitioning: false,
          previousUrl: null
        }));
      }, 600); // Match animation duration
    }
    
    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [state.isTransitioning]);

  // Initial load
  useEffect(() => {
    if (!npc.portrait) {
      loadPortrait('neutral');
    } else {
      setState(prev => ({
        ...prev,
        currentUrl: npc.portrait || null,
        isLoading: false
      }));
    }
  }, [npc.id]);

  // Force update to a specific emotion
  const setEmotion = useCallback((emotion: EmotionType) => {
    lastEmotionRef.current = emotion;
    loadPortrait(emotion);
  }, [loadPortrait]);

  // Get CSS class for fallback styling
  const getCSSFallbackClass = useCallback(() => {
    if (!state.useCSSFallback || !state.fallbackEmotion) return '';
    return `portrait-emotion-${state.fallbackEmotion}`;
  }, [state.useCSSFallback, state.fallbackEmotion]);

  return {
    ...state,
    setEmotion,
    getCSSFallbackClass,
    refresh: () => loadPortrait(state.currentEmotion)
  };
}
