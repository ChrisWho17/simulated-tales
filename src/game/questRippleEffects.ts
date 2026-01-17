// ============================================================================
// QUEST RIPPLE EFFECTS - Completed quests visibly change the world
// ============================================================================

import { Quest, QuestStatus } from './questSystem';
import { eventBus } from './eventBus';

// ============================================================================
// TYPES
// ============================================================================

export interface QuestWorldChange {
  questId: string;
  questTitle: string;
  outcome: 'completed' | 'failed' | 'abandoned';
  timestamp: number;
  
  // Location changes
  locationChanges: LocationChange[];
  
  // NPC changes  
  npcChanges: NPCChange[];
  
  // World state changes
  worldStateFlags: Record<string, boolean>;
  
  // Narrative description of changes
  changeDescription: string;
}

export interface LocationChange {
  locationId: string;
  changeType: 'atmosphere' | 'description' | 'availability' | 'population' | 'danger';
  before: string;
  after: string;
  narrativeDescription: string;
}

export interface NPCChange {
  npcId: string;
  npcName: string;
  changeType: 'attitude' | 'dialogue' | 'location' | 'availability' | 'appearance';
  change: string;
  dialogueCallback?: string; // Reference text NPC will mention
}

// Dialogue callbacks NPCs can reference
export interface MemoryCallback {
  id: string;
  npcId: string;
  npcName: string;
  triggerContext: string[]; // Topics that trigger this memory
  positiveDialogue: string[];
  negativeDialogue: string[];
  neutralDialogue: string[];
  sentiment: 'grateful' | 'resentful' | 'neutral' | 'complex';
  expiresAfterDays?: number;
  alreadyMentioned: boolean;
}

// ============================================================================
// QUEST RIPPLE DEFINITIONS
// ============================================================================

export interface QuestRippleDefinition {
  completedChanges: {
    locationChanges?: LocationChange[];
    npcChanges?: NPCChange[];
    worldFlags?: Record<string, boolean>;
    description: string;
    memoryCallbacks?: Omit<MemoryCallback, 'id' | 'alreadyMentioned'>[];
  };
  failedChanges?: {
    locationChanges?: LocationChange[];
    npcChanges?: NPCChange[];
    worldFlags?: Record<string, boolean>;
    description: string;
    memoryCallbacks?: Omit<MemoryCallback, 'id' | 'alreadyMentioned'>[];
  };
  abandonedChanges?: {
    npcChanges?: NPCChange[];
    description: string;
  };
}

// Pre-defined ripple effects for common quest types
export const QUEST_RIPPLE_TEMPLATES: Record<string, QuestRippleDefinition> = {
  // Saved a village/location from threat
  save_location: {
    completedChanges: {
      locationChanges: [
        {
          locationId: '{location}',
          changeType: 'atmosphere',
          before: 'tense and fearful',
          after: 'peaceful and grateful',
          narrativeDescription: 'The people here move freely, no longer afraid.'
        },
        {
          locationId: '{location}',
          changeType: 'population',
          before: 'sparse, hiding',
          after: 'bustling with activity',
          narrativeDescription: 'Life has returned to normal.'
        }
      ],
      description: 'Thanks to your actions, {location} thrives once more.',
      memoryCallbacks: [
        {
          npcId: '{saved_npc}',
          npcName: '{saved_npc_name}',
          triggerContext: ['hero', 'help', 'save', 'thank'],
          positiveDialogue: [
            "You saved us all. I'll never forget that.",
            "Because of you, my family is safe. Thank you.",
            "The hero who saved {location}! We owe you everything."
          ],
          negativeDialogue: [],
          neutralDialogue: ["I heard what you did for {location}. Good work."],
          sentiment: 'grateful'
        }
      ]
    },
    failedChanges: {
      locationChanges: [
        {
          locationId: '{location}',
          changeType: 'atmosphere',
          before: 'threatened but hopeful',
          after: 'devastated and mourning',
          narrativeDescription: 'The aftermath of tragedy hangs heavy in the air.'
        },
        {
          locationId: '{location}',
          changeType: 'population',
          before: 'normal',
          after: 'decimated',
          narrativeDescription: 'Many faces you once saw are gone.'
        }
      ],
      description: '{location} bears the scars of what happened. The survivors remember.',
      memoryCallbacks: [
        {
          npcId: '{failed_npc}',
          npcName: '{failed_npc_name}',
          triggerContext: ['help', 'trust', 'hero'],
          positiveDialogue: [],
          negativeDialogue: [
            "You were supposed to save us. Where were you?",
            "I lost everything because you failed.",
            "Don't speak to me about heroism. I know what you did. Nothing."
          ],
          neutralDialogue: ["Some things can't be forgiven."],
          sentiment: 'resentful'
        }
      ]
    }
  },

  // Helped an NPC personally
  help_individual: {
    completedChanges: {
      npcChanges: [
        {
          npcId: '{helped_npc}',
          npcName: '{helped_npc_name}',
          changeType: 'attitude',
          change: 'deeply grateful, friendly',
          dialogueCallback: 'Remember when you helped me? I do.'
        }
      ],
      description: '{helped_npc_name} remembers your kindness.',
      memoryCallbacks: [
        {
          npcId: '{helped_npc}',
          npcName: '{helped_npc_name}',
          triggerContext: ['friend', 'help', 'need', 'favor'],
          positiveDialogue: [
            "After what you did for me, I'd do anything to help you.",
            "You helped me when no one else would. What do you need?",
            "A friend in need is a friend indeed - and you proved that."
          ],
          negativeDialogue: [],
          neutralDialogue: [],
          sentiment: 'grateful'
        }
      ]
    },
    abandonedChanges: {
      npcChanges: [
        {
          npcId: '{helped_npc}',
          npcName: '{helped_npc_name}',
          changeType: 'attitude',
          change: 'disappointed, distrustful',
          dialogueCallback: 'You said you would help. But you didn\'t.'
        }
      ],
      description: '{helped_npc_name} feels let down by your broken promise.'
    }
  },

  // Defeated a threat/enemy
  defeat_threat: {
    completedChanges: {
      worldFlags: {
        '{threat}_defeated': true,
        '{location}_safe': true
      },
      locationChanges: [
        {
          locationId: '{location}',
          changeType: 'danger',
          before: 'dangerous, threatened',
          after: 'safe, peaceful',
          narrativeDescription: 'The threat that once loomed here is gone.'
        }
      ],
      description: 'The {threat} is no more. Peace returns to {location}.',
      memoryCallbacks: [
        {
          npcId: 'guards',
          npcName: 'Local Guards',
          triggerContext: ['threat', 'danger', 'safe', '{threat}'],
          positiveDialogue: [
            "You're the one who dealt with the {threat}? The whole town's grateful.",
            "Thanks to you, we can sleep safely again.",
            "I heard about what you did. Impressive work."
          ],
          negativeDialogue: [],
          neutralDialogue: [],
          sentiment: 'grateful'
        }
      ]
    },
    failedChanges: {
      worldFlags: {
        '{threat}_remains': true,
        '{location}_endangered': true
      },
      locationChanges: [
        {
          locationId: '{location}',
          changeType: 'danger',
          before: 'threatened',
          after: 'extremely dangerous',
          narrativeDescription: 'The failed attempt has made the threat bolder.'
        }
      ],
      description: 'The {threat} grows stronger. Your failure has consequences.'
    }
  },

  // Made a moral choice
  moral_choice: {
    completedChanges: {
      description: 'Your choice echoes through the community. People remember which side you took.',
      memoryCallbacks: [
        {
          npcId: '{supported_npc}',
          npcName: '{supported_npc_name}',
          triggerContext: ['choice', 'decision', 'side'],
          positiveDialogue: [
            "You stood by me when it mattered. I won't forget.",
            "It takes courage to make the hard choice. Thank you for supporting me.",
            "Not everyone would have done what you did. I'm grateful."
          ],
          negativeDialogue: [],
          neutralDialogue: [],
          sentiment: 'grateful'
        },
        {
          npcId: '{opposed_npc}',
          npcName: '{opposed_npc_name}',
          triggerContext: ['choice', 'decision', 'side'],
          positiveDialogue: [],
          negativeDialogue: [
            "You chose them over me. I see how it is.",
            "I thought I could count on you. I was wrong.",
            "We could have been allies. But you made your choice."
          ],
          neutralDialogue: [],
          sentiment: 'resentful'
        }
      ]
    }
  }
};

// ============================================================================
// RIPPLE STATE MANAGEMENT
// ============================================================================

export interface WorldRippleState {
  activeRipples: QuestWorldChange[];
  memoryCallbacks: MemoryCallback[];
  worldFlags: Record<string, boolean>;
  locationModifiers: Record<string, LocationChange[]>;
  npcModifiers: Record<string, NPCChange[]>;
}

export function initializeWorldRippleState(): WorldRippleState {
  return {
    activeRipples: [],
    memoryCallbacks: [],
    worldFlags: {},
    locationModifiers: {},
    npcModifiers: {}
  };
}

/**
 * Process quest completion/failure and generate world changes
 */
export function processQuestRipple(
  state: WorldRippleState,
  quest: Quest,
  outcome: 'completed' | 'failed' | 'abandoned',
  templateKey?: string,
  variables?: Record<string, string>
): { newState: WorldRippleState; changes: QuestWorldChange; narrative: string } {
  
  // Try to find a matching template or use generic
  const template = templateKey ? QUEST_RIPPLE_TEMPLATES[templateKey] : undefined;
  
  let changes: QuestWorldChange;
  let narrative = '';
  
  if (template) {
    const rippleData = outcome === 'completed' 
      ? template.completedChanges 
      : outcome === 'failed' 
        ? template.failedChanges 
        : template.abandonedChanges;
    
    if (rippleData) {
      // Replace variables in the template
      const processedDescription = replaceVariables(rippleData.description, variables || {});
      
      changes = {
        questId: quest.id,
        questTitle: quest.title,
        outcome,
        timestamp: Date.now(),
        locationChanges: (rippleData as any).locationChanges?.map((lc: LocationChange) => ({
          ...lc,
          locationId: replaceVariables(lc.locationId, variables || {}),
          narrativeDescription: replaceVariables(lc.narrativeDescription, variables || {})
        })) || [],
        npcChanges: (rippleData as any).npcChanges?.map((nc: NPCChange) => ({
          ...nc,
          npcId: replaceVariables(nc.npcId, variables || {}),
          npcName: replaceVariables(nc.npcName || '', variables || {}),
          dialogueCallback: nc.dialogueCallback ? replaceVariables(nc.dialogueCallback, variables || {}) : undefined
        })) || [],
        worldStateFlags: Object.fromEntries(
          Object.entries((rippleData as any).worldFlags || {}).map(([k, v]) => [
            replaceVariables(k, variables || {}),
            v
          ])
        ),
        changeDescription: processedDescription
      };
      
      narrative = processedDescription;
      
      // Process memory callbacks if present
      const callbacks = (rippleData as any).memoryCallbacks;
      if (callbacks) {
        const newCallbacks = callbacks.map((cb: any) => ({
          ...cb,
          id: `callback_${quest.id}_${cb.npcId}_${Date.now()}`,
          npcId: replaceVariables(cb.npcId, variables || {}),
          npcName: replaceVariables(cb.npcName, variables || {}),
          triggerContext: cb.triggerContext.map((t: string) => replaceVariables(t, variables || {})),
          positiveDialogue: cb.positiveDialogue.map((d: string) => replaceVariables(d, variables || {})),
          negativeDialogue: cb.negativeDialogue.map((d: string) => replaceVariables(d, variables || {})),
          neutralDialogue: cb.neutralDialogue.map((d: string) => replaceVariables(d, variables || {})),
          alreadyMentioned: false
        }));
        
        state = {
          ...state,
          memoryCallbacks: [...state.memoryCallbacks, ...newCallbacks]
        };
      }
    } else {
      changes = createGenericRipple(quest, outcome);
      narrative = changes.changeDescription;
    }
  } else {
    changes = createGenericRipple(quest, outcome);
    narrative = changes.changeDescription;
  }
  
  // Apply changes to state
  const newState: WorldRippleState = {
    ...state,
    activeRipples: [...state.activeRipples, changes],
    worldFlags: { ...state.worldFlags, ...changes.worldStateFlags },
    locationModifiers: {
      ...state.locationModifiers,
      ...Object.fromEntries(
        changes.locationChanges.map(lc => [lc.locationId, [...(state.locationModifiers[lc.locationId] || []), lc]])
      )
    },
    npcModifiers: {
      ...state.npcModifiers,
      ...Object.fromEntries(
        changes.npcChanges.map(nc => [nc.npcId, [...(state.npcModifiers[nc.npcId] || []), nc]])
      )
    }
  };
  
  // Emit event
  eventBus.emit({
    type: 'quest_ripple',
    payload: { questId: quest.id, outcome, changes }
  });
  
  return { newState, changes, narrative };
}

/**
 * Create generic ripple effects when no template exists
 */
function createGenericRipple(quest: Quest, outcome: 'completed' | 'failed' | 'abandoned'): QuestWorldChange {
  const descriptions = {
    completed: [
      `Your success in "${quest.title}" hasn't gone unnoticed. The world remembers.`,
      `The completion of "${quest.title}" has changed things, subtly but surely.`,
      `"${quest.title}" is now part of your legend.`
    ],
    failed: [
      `The failure of "${quest.title}" leaves a mark on your reputation.`,
      `"${quest.title}" ended poorly. Some will not forget.`,
      `The aftermath of "${quest.title}" weighs on those affected.`
    ],
    abandoned: [
      `Walking away from "${quest.title}" disappointed those counting on you.`,
      `"${quest.title}" remains unfinished. The need still exists.`,
      `Some promises were made and broken with "${quest.title}".`
    ]
  };
  
  const description = descriptions[outcome][Math.floor(Math.random() * descriptions[outcome].length)];
  
  return {
    questId: quest.id,
    questTitle: quest.title,
    outcome,
    timestamp: Date.now(),
    locationChanges: [],
    npcChanges: quest.giverNpcId ? [{
      npcId: quest.giverNpcId,
      npcName: '',
      changeType: 'attitude',
      change: outcome === 'completed' ? 'grateful' : outcome === 'failed' ? 'disappointed' : 'resentful'
    }] : [],
    worldStateFlags: {
      [`quest_${quest.id}_${outcome}`]: true
    },
    changeDescription: description
  };
}

/**
 * Replace template variables like {location} with actual values
 */
function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Get memory callbacks that should trigger based on conversation context
 */
export function getTriggeredMemoryCallbacks(
  state: WorldRippleState,
  npcId: string,
  conversationContext: string[]
): MemoryCallback[] {
  const lowerContext = conversationContext.map(c => c.toLowerCase());
  
  return state.memoryCallbacks.filter(callback => {
    if (callback.npcId !== npcId && callback.npcId !== 'guards') return false;
    if (callback.alreadyMentioned) return false;
    
    // Check if any trigger context matches
    return callback.triggerContext.some(trigger => 
      lowerContext.some(ctx => ctx.includes(trigger.toLowerCase()))
    );
  });
}

/**
 * Mark a memory callback as mentioned (so NPC doesn't repeat it)
 */
export function markCallbackMentioned(
  state: WorldRippleState,
  callbackId: string
): WorldRippleState {
  return {
    ...state,
    memoryCallbacks: state.memoryCallbacks.map(cb => 
      cb.id === callbackId ? { ...cb, alreadyMentioned: true } : cb
    )
  };
}

/**
 * Get random dialogue from a callback based on sentiment
 */
export function getCallbackDialogue(callback: MemoryCallback): string {
  let dialoguePool: string[];
  
  if (callback.sentiment === 'grateful' && callback.positiveDialogue.length > 0) {
    dialoguePool = callback.positiveDialogue;
  } else if (callback.sentiment === 'resentful' && callback.negativeDialogue.length > 0) {
    dialoguePool = callback.negativeDialogue;
  } else if (callback.neutralDialogue.length > 0) {
    dialoguePool = callback.neutralDialogue;
  } else {
    // Fallback
    dialoguePool = [...callback.positiveDialogue, ...callback.negativeDialogue, ...callback.neutralDialogue];
  }
  
  if (dialoguePool.length === 0) return '';
  return dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
}

/**
 * Get location description modifiers based on active ripples
 */
export function getLocationRippleDescription(
  state: WorldRippleState,
  locationId: string
): string[] {
  const modifiers = state.locationModifiers[locationId] || [];
  return modifiers.map(m => m.narrativeDescription);
}

// ============================================================================
// SINGLETON MANAGER
// ============================================================================

class QuestRippleManager {
  private state: WorldRippleState = initializeWorldRippleState();
  
  getState(): WorldRippleState {
    return { ...this.state };
  }
  
  processQuest(quest: Quest, outcome: 'completed' | 'failed' | 'abandoned', templateKey?: string, variables?: Record<string, string>) {
    const result = processQuestRipple(this.state, quest, outcome, templateKey, variables);
    this.state = result.newState;
    return result;
  }
  
  getMemoryCallbacks(npcId: string, context: string[]) {
    return getTriggeredMemoryCallbacks(this.state, npcId, context);
  }
  
  markMentioned(callbackId: string) {
    this.state = markCallbackMentioned(this.state, callbackId);
  }
  
  getLocationDescriptions(locationId: string) {
    return getLocationRippleDescription(this.state, locationId);
  }
  
  checkWorldFlag(flag: string): boolean {
    return this.state.worldFlags[flag] || false;
  }
  
  loadState(saved: WorldRippleState) {
    this.state = { ...initializeWorldRippleState(), ...saved };
  }
  
  reset() {
    this.state = initializeWorldRippleState();
  }
}

export const questRippleManager = new QuestRippleManager();
