// ============================================================================
// COMPANION RELATIONSHIP EVENTS - Scripted moments based on affinity/trust
// ============================================================================

import { CompanionState, CompanionMood, PlayerActionType } from './companionSystem';

// ============================================================================
// TYPES
// ============================================================================

export type RelationshipEventType = 
  | 'bonding'        // Positive milestone
  | 'conflict'       // Tension or disagreement  
  | 'confession'     // Romantic revelation
  | 'secret'         // Companion reveals something personal
  | 'crisis'         // Companion needs help
  | 'loyalty_test'   // Tests the relationship
  | 'farewell'       // May lead to departure
  | 'reconciliation' // Making up after conflict
  | 'celebration';   // Celebrating an achievement

export interface DialogueChoice {
  id: string;
  text: string;
  emotionalTone: 'supportive' | 'neutral' | 'dismissive' | 'romantic' | 'harsh' | 'humorous';
  requirements?: {
    minAffinity?: number;
    minTrust?: number;
    minRomance?: number;
    playerAction?: PlayerActionType;
  };
  effects: {
    affinity?: number;
    trust?: number;
    respect?: number;
    fear?: number;
    romanticInterest?: number;
    moodChange?: CompanionMood;
    unlockEvent?: string;
    blockEvent?: string;
    specialFlag?: string;
  };
  companionResponse: string;
  internalThought: string;
}

export interface RelationshipEvent {
  id: string;
  name: string;
  type: RelationshipEventType;
  
  // Trigger conditions
  triggers: {
    minAffinity?: number;
    maxAffinity?: number;
    minTrust?: number;
    maxTrust?: number;
    minRomance?: number;
    mood?: CompanionMood[];
    afterEvent?: string;        // Must happen after this event
    blockedByEvent?: string;    // Cannot happen if this event occurred
    minTimeWithPlayer?: number; // Minimum time in party (ms)
    requiredFlags?: string[];   // Special flags required
    chance?: number;            // Random chance (0-1)
  };

  // Event content
  setup: string;           // Narrative setup
  companionDialogue: string;
  companionEmotion: CompanionMood;
  
  // Player choices
  choices: DialogueChoice[];
  
  // Metadata
  isRepeatable: boolean;
  priority: number;        // Higher = more likely to trigger
  tags: string[];
}

// ============================================================================
// EVENT DATABASE
// ============================================================================

export const RELATIONSHIP_EVENTS: RelationshipEvent[] = [
  // ============ BONDING EVENTS ============
  {
    id: 'first_campfire_chat',
    name: 'Campfire Reflections',
    type: 'bonding',
    triggers: {
      minAffinity: 20,
      minTrust: 15,
      minTimeWithPlayer: 600000, // 10 minutes
      chance: 0.3,
    },
    setup: 'As the campfire crackles, your companion sits nearby, staring into the flames with a thoughtful expression.',
    companionDialogue: "You know... I wasn't sure about you at first. But I'm starting to think we make a good team.",
    companionEmotion: 'content',
    choices: [
      {
        id: 'agree_warmly',
        text: "I feel the same way. I'm glad you're here.",
        emotionalTone: 'supportive',
        effects: { affinity: 10, trust: 8, moodChange: 'joyful' },
        companionResponse: '*smiles genuinely* "That... means a lot. Really."',
        internalThought: 'Maybe I found someone I can truly rely on.',
      },
      {
        id: 'professional',
        text: "You're a capable fighter. That's what matters.",
        emotionalTone: 'neutral',
        effects: { respect: 5, affinity: 3 },
        companionResponse: '*nods* "I appreciate the honesty. Actions over words, right?"',
        internalThought: 'Practical. I can respect that.',
      },
      {
        id: 'tease',
        text: "Getting sentimental on me?",
        emotionalTone: 'humorous',
        effects: { affinity: 5, moodChange: 'content' },
        companionResponse: '*chuckles* "Don\'t let it go to your head."',
        internalThought: 'At least they have a sense of humor.',
      },
      {
        id: 'dismiss',
        text: "Let's just focus on the mission.",
        emotionalTone: 'dismissive',
        effects: { affinity: -5, trust: -3, moodChange: 'neutral' },
        companionResponse: '*looks away* "Right. Of course."',
        internalThought: "So that's how it is. Just business.",
      },
    ],
    isRepeatable: false,
    priority: 5,
    tags: ['early_game', 'bonding'],
  },

  {
    id: 'shared_meal',
    name: 'Sharing a Meal',
    type: 'bonding',
    triggers: {
      minAffinity: 35,
      minTrust: 25,
      afterEvent: 'first_campfire_chat',
      chance: 0.25,
    },
    setup: 'Your companion offers to share their rations with you - a rare gesture of goodwill.',
    companionDialogue: "I managed to scrounge up something decent. Figured we could split it. If you want.",
    companionEmotion: 'content',
    choices: [
      {
        id: 'accept_gratefully',
        text: "That's very thoughtful. Thank you.",
        emotionalTone: 'supportive',
        effects: { affinity: 8, trust: 10 },
        companionResponse: '*passes you a portion* "Don\'t mention it. We look out for each other."',
        internalThought: 'This is what comrades do.',
      },
      {
        id: 'share_back',
        text: "Only if you take some of mine too.",
        emotionalTone: 'supportive',
        effects: { affinity: 12, trust: 8, respect: 5 },
        companionResponse: '*surprised but pleased* "Fair trade. I like that."',
        internalThought: 'Equal footing. That\'s... nice.',
      },
      {
        id: 'decline',
        text: "Keep it. You need your strength.",
        emotionalTone: 'neutral',
        effects: { respect: 8, trust: 3 },
        companionResponse: '*hesitates* "If you\'re sure... but the offer stands."',
        internalThought: 'Stubborn, but considerate in their own way.',
      },
    ],
    isRepeatable: false,
    priority: 4,
    tags: ['mid_game', 'bonding'],
  },

  // ============ SECRET EVENTS ============
  {
    id: 'reveal_past',
    name: 'Shadows of the Past',
    type: 'secret',
    triggers: {
      minAffinity: 50,
      minTrust: 45,
      chance: 0.2,
    },
    setup: "Late at night, you notice your companion is awake, troubled by something. They notice you watching.",
    companionDialogue: "*sighs* I... there's something I've never told anyone. About why I'm really out here.",
    companionEmotion: 'sad',
    choices: [
      {
        id: 'listen_compassion',
        text: "I'm here. Take your time.",
        emotionalTone: 'supportive',
        effects: { trust: 15, affinity: 10, moodChange: 'content', specialFlag: 'knows_secret' },
        companionResponse: "*takes a deep breath* \"I... thank you. For listening. For not judging.\"",
        internalThought: 'I\'ve never felt safe enough to share this before.',
      },
      {
        id: 'gentle_probe',
        text: "You don't have to, but I'd like to understand you better.",
        emotionalTone: 'supportive',
        effects: { trust: 12, affinity: 8, romanticInterest: 5, specialFlag: 'knows_secret' },
        companionResponse: '"It\'s... complicated. But you deserve to know who you\'re traveling with."',
        internalThought: 'They actually care about who I am, not just what I can do.',
      },
      {
        id: 'respect_privacy',
        text: "Only share what you're comfortable with.",
        emotionalTone: 'neutral',
        effects: { respect: 10, trust: 5 },
        companionResponse: '"Maybe... maybe another time. But thank you for understanding."',
        internalThought: 'They respect my boundaries. That\'s rare.',
      },
      {
        id: 'brush_off',
        text: "Everyone has baggage. What matters is the present.",
        emotionalTone: 'dismissive',
        effects: { trust: -8, affinity: -5, moodChange: 'annoyed' },
        companionResponse: '"Right. Of course." *turns away*',
        internalThought: 'I thought they might be different. I was wrong.',
      },
    ],
    isRepeatable: false,
    priority: 7,
    tags: ['deep_bonding', 'character_development'],
  },

  // ============ ROMANTIC EVENTS ============
  {
    id: 'romantic_tension',
    name: 'Unspoken Feelings',
    type: 'confession',
    triggers: {
      minAffinity: 60,
      minTrust: 50,
      minRomance: 40,
      chance: 0.15,
    },
    setup: 'You catch your companion watching you with an expression that\'s hard to read. When your eyes meet, they look away quickly.',
    companionDialogue: "*clears throat* I've been... thinking. About us. About what this is.",
    companionEmotion: 'romantic',
    choices: [
      {
        id: 'reciprocate',
        text: "I've been thinking the same thing.",
        emotionalTone: 'romantic',
        requirements: { minRomance: 40 },
        effects: { romanticInterest: 25, affinity: 15, trust: 10, moodChange: 'joyful', unlockEvent: 'first_kiss' },
        companionResponse: '*eyes light up* "You... really? I was afraid I was imagining things."',
        internalThought: 'My heart is racing. This is really happening.',
      },
      {
        id: 'gentle_interest',
        text: "What did you have in mind?",
        emotionalTone: 'neutral',
        effects: { romanticInterest: 10, affinity: 5 },
        companionResponse: '"I... I\'m not sure yet. But I wanted you to know."',
        internalThought: "They didn't reject me. There's still hope.",
      },
      {
        id: 'need_time',
        text: "I care about you, but I need time to think.",
        emotionalTone: 'supportive',
        effects: { trust: 5, romanticInterest: -5, moodChange: 'neutral' },
        companionResponse: '"Of course. I didn\'t mean to put you on the spot."',
        internalThought: "At least they didn't say no. I can wait.",
      },
      {
        id: 'just_friends',
        text: "I value what we have, but as companions.",
        emotionalTone: 'dismissive',
        effects: { romanticInterest: -30, affinity: -10, moodChange: 'sad', blockEvent: 'first_kiss' },
        companionResponse: '*forces a smile* "I understand. Forget I said anything."',
        internalThought: 'I should have known better. I always do this.',
      },
    ],
    isRepeatable: false,
    priority: 8,
    tags: ['romance', 'pivotal'],
  },

  {
    id: 'first_kiss',
    name: 'A Moment Alone',
    type: 'confession',
    triggers: {
      minAffinity: 75,
      minRomance: 65,
      afterEvent: 'romantic_tension',
      chance: 0.4,
    },
    setup: 'Under the starlight, you find a rare moment of privacy with your companion.',
    companionDialogue: '*moves closer, voice soft* "I can\'t stop thinking about you."',
    companionEmotion: 'romantic',
    choices: [
      {
        id: 'kiss_them',
        text: '*lean in for a kiss*',
        emotionalTone: 'romantic',
        effects: { romanticInterest: 30, affinity: 20, trust: 15, moodChange: 'joyful', specialFlag: 'romance_started' },
        companionResponse: '*kisses you back passionately* "I\'ve wanted this for so long..."',
        internalThought: 'Perfect. Absolutely perfect.',
      },
      {
        id: 'hold_hands',
        text: '*take their hand gently*',
        emotionalTone: 'romantic',
        effects: { romanticInterest: 15, affinity: 12, trust: 10, moodChange: 'joyful' },
        companionResponse: '*intertwines fingers with yours* "This is enough. For now."',
        internalThought: 'Taking it slow. I can appreciate that.',
      },
      {
        id: 'express_fear',
        text: "I want this, but I'm scared of losing you.",
        emotionalTone: 'supportive',
        effects: { trust: 20, romanticInterest: 10, affinity: 8 },
        companionResponse: '"Then we\'ll face that fear together. That\'s what we do."',
        internalThought: 'They trust me with their vulnerability. I won\'t betray that.',
      },
    ],
    isRepeatable: false,
    priority: 9,
    tags: ['romance', 'milestone'],
  },

  // ============ CONFLICT EVENTS ============
  {
    id: 'moral_disagreement',
    name: 'Clash of Ideals',
    type: 'conflict',
    triggers: {
      minAffinity: 10,
      maxAffinity: 60,
      chance: 0.2,
    },
    setup: 'A decision you made recently has clearly bothered your companion. The tension is palpable.',
    companionDialogue: "We need to talk. About what happened back there. I don't think I can just... ignore it.",
    companionEmotion: 'annoyed',
    choices: [
      {
        id: 'apologize',
        text: "You're right. I should have handled it differently.",
        emotionalTone: 'supportive',
        effects: { affinity: 10, trust: 5, respect: -3, moodChange: 'content' },
        companionResponse: '*relaxes slightly* "Thank you for understanding. I just... needed to say something."',
        internalThought: 'At least they can admit when they\'re wrong.',
      },
      {
        id: 'explain_reasoning',
        text: "I had my reasons. Let me explain.",
        emotionalTone: 'neutral',
        effects: { respect: 8, affinity: 3 },
        companionResponse: '*listens* "I... I still don\'t fully agree, but I see your point."',
        internalThought: 'At least they respect me enough to explain.',
      },
      {
        id: 'stand_ground',
        text: "I did what I thought was right. I won't apologize for that.",
        emotionalTone: 'harsh',
        effects: { respect: 5, affinity: -8, fear: 5, moodChange: 'angry' },
        companionResponse: '*jaw tightens* "Fine. I know where I stand now."',
        internalThought: 'Stubborn. Just like I feared.',
      },
      {
        id: 'dismiss_concern',
        text: "This isn't up for debate. Drop it.",
        emotionalTone: 'dismissive',
        effects: { affinity: -15, trust: -10, fear: 10, moodChange: 'angry' },
        companionResponse: '*cold stare* "...Understood.",
        internalThought: 'I should have known they\'d be like this. Everyone is.',
      },
    ],
    isRepeatable: true,
    priority: 6,
    tags: ['conflict', 'relationship_test'],
  },

  // ============ CRISIS EVENTS ============
  {
    id: 'companion_wounded',
    name: 'Fallen Comrade',
    type: 'crisis',
    triggers: {
      minAffinity: 30,
      chance: 0.15,
    },
    setup: 'After a brutal encounter, your companion is badly wounded. They look up at you with pain in their eyes.',
    companionDialogue: "*winces* I... I'll be fine. Don't waste supplies on me.",
    companionEmotion: 'fearful',
    choices: [
      {
        id: 'tend_carefully',
        text: '*carefully tend to their wounds* "I'm not leaving you like this."',
        emotionalTone: 'supportive',
        effects: { trust: 20, affinity: 15, romanticInterest: 5, moodChange: 'content' },
        companionResponse: '*lets you help* "...Thank you. I don\'t know what I\'d do without you."',
        internalThought: 'They actually care. They really care.',
      },
      {
        id: 'encourage_strength',
        text: "You're tougher than this. We both know it.",
        emotionalTone: 'supportive',
        effects: { respect: 12, affinity: 8, moraleBonus: 10 },
        companionResponse: '*manages a weak smile* "Damn right I am. Just... give me a moment."',
        internalThought: 'They believe in me. I can\'t let them down.',
      },
      {
        id: 'practical_help',
        text: "Here, use these supplies. We need you fighting fit.",
        emotionalTone: 'neutral',
        effects: { trust: 8, respect: 5 },
        companionResponse: '"Practical as always. I appreciate it."',
        internalThought: 'Not sentimental, but reliable. That counts for something.',
      },
      {
        id: 'leave_behind',
        text: "Can you walk? We can't stay here.",
        emotionalTone: 'dismissive',
        effects: { trust: -15, affinity: -10, fear: 10, moodChange: 'betrayed' },
        companionResponse: '*expression hardens* "...I\'ll manage. Somehow."',
        internalThought: 'I should have known I was just a tool to them.',
      },
    ],
    isRepeatable: false,
    priority: 8,
    tags: ['crisis', 'loyalty_test'],
  },

  // ============ LOYALTY TEST ============
  {
    id: 'betrayal_opportunity',
    name: 'Test of Loyalty',
    type: 'loyalty_test',
    triggers: {
      minAffinity: 45,
      minTrust: 40,
      chance: 0.1,
    },
    setup: 'Your companion comes to you with a difficult choice - someone has offered them a lucrative opportunity to abandon you.',
    companionDialogue: "I was approached with an... offer. To leave. Part of me wondered if I should take it. I wanted to be honest with you.",
    companionEmotion: 'neutral',
    choices: [
      {
        id: 'trust_them',
        text: "I trust you to make the right choice. You're here, telling me.",
        emotionalTone: 'supportive',
        effects: { trust: 25, affinity: 15, moodChange: 'joyful' },
        companionResponse: '*visible relief* "I already made it. I\'m staying. I just... needed you to know."',
        internalThought: 'They trust me. I won\'t betray that trust. Never.',
      },
      {
        id: 'understand',
        text: "I understand the temptation. Thank you for being honest.",
        emotionalTone: 'supportive',
        effects: { trust: 15, affinity: 10, respect: 8 },
        companionResponse: '"Honesty is all I have sometimes. I chose you. Remember that."',
        internalThought: 'No judgment. They really are different.',
      },
      {
        id: 'suspicious',
        text: "Why are you telling me this? Testing me?",
        emotionalTone: 'harsh',
        effects: { trust: -10, affinity: -5, moodChange: 'annoyed' },
        companionResponse: '*hurt flashes in their eyes* "I... I just thought you deserved to know."',
        internalThought: 'Paranoid. Though maybe I earned that suspicion.',
      },
      {
        id: 'threaten',
        text: "And if you had taken it?",
        emotionalTone: 'harsh',
        effects: { fear: 15, trust: -15, affinity: -10, moodChange: 'fearful' },
        companionResponse: '*steps back* "I... didn\'t. I wouldn\'t."',
        internalThought: 'The threat is clear. Maybe I made a mistake coming to them.',
      },
    ],
    isRepeatable: false,
    priority: 7,
    tags: ['loyalty', 'pivotal'],
  },

  // ============ CELEBRATION ============
  {
    id: 'victory_celebration',
    name: 'Celebrating Victory',
    type: 'celebration',
    triggers: {
      minAffinity: 40,
      chance: 0.25,
    },
    setup: 'After a significant victory, your companion is in high spirits, eager to celebrate.',
    companionDialogue: "*laughing* We did it! Can you believe it? We actually did it!",
    companionEmotion: 'joyful',
    choices: [
      {
        id: 'celebrate_together',
        text: '*join in the celebration* "Couldn\'t have done it without you!"',
        emotionalTone: 'supportive',
        effects: { affinity: 12, trust: 8, moodChange: 'joyful' },
        companionResponse: '*claps you on the shoulder* "Partners! Best damn team I\'ve ever been part of!"',
        internalThought: 'This feeling... this is why I fight.',
      },
      {
        id: 'toast',
        text: "To us. And many more victories to come.",
        emotionalTone: 'supportive',
        effects: { affinity: 10, respect: 5, romanticInterest: 3 },
        companionResponse: '*raises an imaginary glass* "To us. I like the sound of that."',
        internalThought: 'A partnership worth toasting to.',
      },
      {
        id: 'stay_humble',
        text: "Good work, but let's not get complacent.",
        emotionalTone: 'neutral',
        effects: { respect: 8, affinity: 2, moodChange: 'content' },
        companionResponse: '*nods, sobering slightly* "Right. Eyes on the next challenge."',
        internalThought: 'Disciplined. A good quality in a leader.',
      },
    ],
    isRepeatable: true,
    priority: 3,
    tags: ['celebration', 'bonding'],
  },
];

// ============================================================================
// EVENT MANAGER
// ============================================================================

class RelationshipEventManager {
  private triggeredEvents: Set<string> = new Set();
  private blockedEvents: Set<string> = new Set();
  private specialFlags: Map<string, Set<string>> = new Map(); // companionId -> flags

  // Check if an event can trigger for a companion
  canTriggerEvent(event: RelationshipEvent, companion: CompanionState): boolean {
    // Check if already triggered (unless repeatable)
    const eventKey = `${companion.id}_${event.id}`;
    if (!event.isRepeatable && this.triggeredEvents.has(eventKey)) {
      return false;
    }

    // Check if blocked
    if (this.blockedEvents.has(eventKey)) {
      return false;
    }

    const t = event.triggers;

    // Affinity check
    if (t.minAffinity !== undefined && companion.affinity < t.minAffinity) return false;
    if (t.maxAffinity !== undefined && companion.affinity > t.maxAffinity) return false;

    // Trust check
    if (t.minTrust !== undefined && companion.trust < t.minTrust) return false;
    if (t.maxTrust !== undefined && companion.trust > t.maxTrust) return false;

    // Romance check
    if (t.minRomance !== undefined && companion.romanticInterest < t.minRomance) return false;

    // Mood check
    if (t.mood && !t.mood.includes(companion.mood)) return false;

    // Prerequisite event check
    if (t.afterEvent) {
      const prereqKey = `${companion.id}_${t.afterEvent}`;
      if (!this.triggeredEvents.has(prereqKey)) return false;
    }

    // Blocking event check
    if (t.blockedByEvent) {
      const blockKey = `${companion.id}_${t.blockedByEvent}`;
      if (this.triggeredEvents.has(blockKey)) return false;
    }

    // Time check
    if (t.minTimeWithPlayer !== undefined) {
      const timeWithPlayer = Date.now() - companion.joinedAt;
      if (timeWithPlayer < t.minTimeWithPlayer) return false;
    }

    // Required flags check
    if (t.requiredFlags) {
      const companionFlags = this.specialFlags.get(companion.id) || new Set();
      if (!t.requiredFlags.every(f => companionFlags.has(f))) return false;
    }

    // Random chance check
    if (t.chance !== undefined && Math.random() > t.chance) return false;

    return true;
  }

  // Get all available events for a companion
  getAvailableEvents(companion: CompanionState): RelationshipEvent[] {
    return RELATIONSHIP_EVENTS
      .filter(event => this.canTriggerEvent(event, companion))
      .sort((a, b) => b.priority - a.priority);
  }

  // Try to get a random available event
  tryGetRandomEvent(companion: CompanionState): RelationshipEvent | null {
    const available = this.getAvailableEvents(companion);
    if (available.length === 0) return null;

    // Weight by priority
    const totalPriority = available.reduce((sum, e) => sum + e.priority, 0);
    let roll = Math.random() * totalPriority;

    for (const event of available) {
      roll -= event.priority;
      if (roll <= 0) return event;
    }

    return available[0];
  }

  // Mark event as triggered
  triggerEvent(companionId: string, eventId: string): void {
    this.triggeredEvents.add(`${companionId}_${eventId}`);
  }

  // Apply choice effects
  applyChoice(
    companionId: string,
    eventId: string,
    choice: DialogueChoice
  ): void {
    this.triggerEvent(companionId, eventId);

    // Handle unlock/block effects
    if (choice.effects.unlockEvent) {
      // Unlocking is just about not blocking
    }
    if (choice.effects.blockEvent) {
      this.blockedEvents.add(`${companionId}_${choice.effects.blockEvent}`);
    }

    // Handle special flags
    if (choice.effects.specialFlag) {
      if (!this.specialFlags.has(companionId)) {
        this.specialFlags.set(companionId, new Set());
      }
      this.specialFlags.get(companionId)!.add(choice.effects.specialFlag);
    }
  }

  // Check if a companion has a special flag
  hasFlag(companionId: string, flag: string): boolean {
    return this.specialFlags.get(companionId)?.has(flag) || false;
  }

  // Serialize state
  serialize(): {
    triggered: string[];
    blocked: string[];
    flags: Record<string, string[]>;
  } {
    return {
      triggered: Array.from(this.triggeredEvents),
      blocked: Array.from(this.blockedEvents),
      flags: Object.fromEntries(
        Array.from(this.specialFlags.entries()).map(([id, flags]) => [id, Array.from(flags)])
      ),
    };
  }

  // Deserialize state
  deserialize(data: {
    triggered?: string[];
    blocked?: string[];
    flags?: Record<string, string[]>;
  }): void {
    this.triggeredEvents = new Set(data.triggered || []);
    this.blockedEvents = new Set(data.blocked || []);
    this.specialFlags = new Map(
      Object.entries(data.flags || {}).map(([id, flags]) => [id, new Set(flags)])
    );
  }

  // Reset
  reset(): void {
    this.triggeredEvents.clear();
    this.blockedEvents.clear();
    this.specialFlags.clear();
  }
}

export const relationshipEventManager = new RelationshipEventManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getEventById(eventId: string): RelationshipEvent | undefined {
  return RELATIONSHIP_EVENTS.find(e => e.id === eventId);
}

export function getEventsByType(type: RelationshipEventType): RelationshipEvent[] {
  return RELATIONSHIP_EVENTS.filter(e => e.type === type);
}
