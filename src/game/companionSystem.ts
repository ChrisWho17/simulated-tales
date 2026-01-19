// ============================================================================
// COMPANION SYSTEM - Sentient NPCs with autonomous behavior
// ============================================================================

import { eventBus } from './eventBus';

// ============================================================================
// TYPES
// ============================================================================

export type CompanionMood = 
  | 'joyful' | 'content' | 'neutral' | 'annoyed' | 'angry' 
  | 'sad' | 'fearful' | 'disgusted' | 'romantic' | 'betrayed';

export type CompanionStatus = 
  | 'active' // In party, traveling with player
  | 'waiting' // Left at a location
  | 'left' // Left voluntarily due to disagreement
  | 'hostile' // Turned on the player
  | 'dead' // Killed in combat or story
  | 'romance' // In a romantic relationship
  | 'rejected'; // Player rejected their advances

export type PersonalityTrait = 
  | 'honorable' | 'ruthless' | 'kind' | 'cruel' | 'brave' | 'cowardly'
  | 'greedy' | 'generous' | 'loyal' | 'treacherous' | 'romantic' | 'pragmatic'
  | 'spiritual' | 'skeptical' | 'vengeful' | 'forgiving' | 'ambitious' | 'humble';

export type PlayerActionType = 
  | 'combat_kill' | 'combat_spare' | 'theft' | 'charity' 
  | 'lie' | 'truth' | 'violence' | 'diplomacy'
  | 'betrayal' | 'loyalty' | 'cowardice' | 'bravery'
  | 'romance_flirt' | 'romance_reject' | 'insult' | 'compliment'
  | 'greed' | 'sacrifice' | 'mercy' | 'cruelty';

export interface CompanionPersonality {
  // Core traits (3-5 per companion)
  traits: PersonalityTrait[];
  
  // What they value (-100 to 100)
  values: {
    honor: number;
    wealth: number;
    power: number;
    love: number;
    freedom: number;
    justice: number;
    knowledge: number;
    family: number;
  };
  
  // What actions they approve/disapprove of
  approves: PlayerActionType[];
  disapproves: PlayerActionType[];
  
  // Romantic preferences
  romanticInterest: {
    enabled: boolean;
    preferredGender?: 'male' | 'female' | 'any';
    attractedToPlayer: boolean;
    romanceThreshold: number; // Affinity needed to confess
  };
  
  // Breaking points
  betrayalThreshold: number; // Affinity below this = they turn hostile
  departureThreshold: number; // Affinity below this = they leave
  
  // Dialogue style
  speechPattern: string;
  catchphrases: string[];
  quirks: string[]; // Known quirks (visible to player)
  hiddenQuirks: string[]; // Quirks that are revealed as relationship deepens
}

// Quirk discovery thresholds - what trust/affinity level reveals each hidden quirk
export interface QuirkDiscoveryState {
  discoveredQuirks: string[]; // Quirks that have been revealed
  pendingDiscovery?: {
    quirk: string;
    discoveryDialogue: string;
  };
  lastDiscoveryCheck: number;
}

// ========== CONVERSATION MEMORY SYSTEM ==========
// Tracks what personal topics the player has shared with EACH companion (isolated per companion)

export type ConversationTopic = 
  | 'dreams' | 'relationships' | 'memories' | 'fears' | 'future'
  | 'loss' | 'origin' | 'philosophy' | 'secrets' | 'regrets'
  | 'motivation' | 'love' | 'courage' | 'peace' | 'wanderlust';

export interface SharedTopicMemory {
  topic: ConversationTopic;
  sharedAt: number; // timestamp
  responseType: 'honest' | 'emotional' | 'deflect' | 'lie';
  playerSummary?: string; // Optional player-provided context
  companionReaction: string; // How they reacted
  referencedCount: number; // How many times companion has referenced this
  lastReferenced?: number; // Last time companion brought it up
}

export interface ConversationMemoryState {
  companionId: string; // Ties memory to specific companion
  sharedTopics: SharedTopicMemory[];
  askedTopics: ConversationTopic[]; // Topics this companion has already asked about
  lastAskedAt: number;
  conversationDepth: number; // 0-100, increases as more is shared
}

export interface CompanionMemory {
  timestamp: number;
  type: 'action' | 'dialogue' | 'event' | 'gift' | 'betrayal';
  description: string;
  affinityChange: number;
  playerAction?: PlayerActionType;
  forgotten: boolean;
}

export interface CompanionState {
  id: string;
  name: string;
  
  // Status
  status: CompanionStatus;
  mood: CompanionMood;
  moodIntensity: number; // 0-100
  
  // Relationship with player
  affinity: number; // -100 to 100 (hate to love)
  trust: number; // 0-100
  respect: number; // 0-100
  fear: number; // 0-100 (if player is cruel)
  romanticInterest: number; // 0-100
  
  // Their personality
  personality: CompanionPersonality;
  
  // Quirk discovery system
  quirkDiscovery: QuirkDiscoveryState;
  
  // Conversation memory - what personal topics player has shared with THIS companion
  conversationMemory: ConversationMemoryState;
  
  // Memories of player actions
  memories: CompanionMemory[];
  
  // Current internal state
  internalThoughts: string; // What they're thinking
  pendingReaction?: string; // Reaction to recent event
  wantsToSpeak: boolean; // Has something to say
  
  // Gameplay
  combatRole?: 'tank' | 'damage' | 'support' | 'ranged';
  skills: string[];
  equipment: string[];
  
  // PERMANENT Combat Attributes (set once on creation, never change)
  combatAttributes?: {
    baseStrength: number;       // 1-100 (permanent)
    baseAgility: number;        // 1-100 (permanent)
    baseEndurance: number;      // 1-100 (permanent)
    baseCombatSkill: number;    // 1-100 (permanent)
    size: 'small' | 'medium' | 'large' | 'huge';  // permanent
  };
  
  // Timers and flags
  joinedAt: number;
  lastSpoke: number;
  confessedLove: boolean;
  wasBetrayed: boolean;
  hasSecret: boolean;
  secretRevealed: boolean;
}

// ============================================================================
// COMPANION TEMPLATES
// ============================================================================

export const COMPANION_TEMPLATES: Record<string, Partial<CompanionState>> = {
  loyal_warrior: {
    personality: {
      traits: ['honorable', 'brave', 'loyal'],
      values: { honor: 80, wealth: 20, power: 40, love: 60, freedom: 50, justice: 70, knowledge: 30, family: 60 },
      approves: ['combat_spare', 'truth', 'loyalty', 'bravery', 'sacrifice'],
      disapproves: ['betrayal', 'cowardice', 'cruelty', 'lie'],
      romanticInterest: { enabled: true, preferredGender: 'any', attractedToPlayer: false, romanceThreshold: 75 },
      betrayalThreshold: -60,
      departureThreshold: -40,
      speechPattern: 'direct, military, formal',
      catchphrases: ['By my blade, I swear it.', 'Honor demands action.', 'We stand together.'],
      quirks: ['polishes weapon when nervous', 'always faces the door'],
      hiddenQuirks: ['never sits with back to entrance', 'writes letters to fallen comrades', 'hums old war songs when anxious'],
    },
    combatRole: 'tank',
    skills: ['shield_wall', 'taunt', 'protect_ally'],
  },
  
  cunning_rogue: {
    personality: {
      traits: ['pragmatic', 'greedy', 'cowardly', 'romantic'],
      values: { honor: 10, wealth: 90, power: 50, love: 70, freedom: 80, justice: 20, knowledge: 40, family: 30 },
      approves: ['theft', 'lie', 'diplomacy', 'romance_flirt', 'greed'],
      disapproves: ['sacrifice', 'bravery', 'charity'],
      romanticInterest: { enabled: true, preferredGender: 'any', attractedToPlayer: true, romanceThreshold: 50 },
      betrayalThreshold: -30, // Quick to turn
      departureThreshold: -20,
      speechPattern: 'witty, sarcastic, flirtatious',
      catchphrases: ['Well, that was unexpected.', 'I\'m not running, I\'m repositioning.', 'Everyone has a price.'],
      quirks: ['counts coins when idle', 'winks too much'],
      hiddenQuirks: ['always has an exit planned', 'keeps a lucky charm from their first heist', 'actually terrible at gambling'],
    },
    combatRole: 'damage',
    skills: ['backstab', 'lockpick', 'distract'],
  },
  
  mysterious_mage: {
    personality: {
      traits: ['skeptical', 'ambitious', 'pragmatic', 'vengeful'],
      values: { honor: 30, wealth: 40, power: 80, love: 20, freedom: 60, justice: 40, knowledge: 95, family: 10 },
      approves: ['diplomacy', 'truth', 'mercy'],
      disapproves: ['violence', 'cruelty', 'betrayal'],
      romanticInterest: { enabled: true, preferredGender: 'any', attractedToPlayer: false, romanceThreshold: 85 },
      betrayalThreshold: -50,
      departureThreshold: -35,
      speechPattern: 'cryptic, intellectual, distant',
      catchphrases: ['Fascinating...', 'The arcane reveals all truths.', 'You cannot comprehend the forces at play.'],
      quirks: ['stares into middle distance', 'mutters incantations'],
      hiddenQuirks: ['never explains fully', 'secretly afraid of losing their magic', 'collects unusual spell components'],
    },
    combatRole: 'support',
    skills: ['heal', 'barrier', 'arcane_blast'],
  },
  
  fierce_huntress: {
    personality: {
      traits: ['brave', 'kind', 'spiritual', 'forgiving'],
      values: { honor: 60, wealth: 10, power: 30, love: 50, freedom: 90, justice: 70, knowledge: 40, family: 80 },
      approves: ['combat_spare', 'charity', 'mercy', 'bravery', 'truth'],
      disapproves: ['cruelty', 'greed', 'betrayal', 'cowardice'],
      romanticInterest: { enabled: true, preferredGender: 'any', attractedToPlayer: false, romanceThreshold: 70 },
      betrayalThreshold: -70,
      departureThreshold: -50,
      speechPattern: 'direct, nature metaphors, spiritual',
      catchphrases: ['The hunt is life.', 'Nature provides for those who respect her.', 'My arrows fly true.'],
      quirks: ['talks to animals', 'sleeps outside'],
      hiddenQuirks: ['uncomfortable in cities', 'secretly loves a specific type of flower', 'still grieves for a lost animal companion'],
    },
    combatRole: 'ranged',
    skills: ['precise_shot', 'track', 'animal_companion'],
  },
};

// ============================================================================
// COMPANION MANAGER
// ============================================================================

class CompanionSystemManager {
  private companions: Map<string, CompanionState> = new Map();
  private activeCompanions: string[] = []; // IDs of companions in party (max 3)
  private maxPartySize = 3;
  private maxTotalCompanions = 20; // Limit total companions to prevent memory bloat
  private maxMemoriesPerCompanion = 50; // Cap memories per companion
  
  // ========== COMPANION MANAGEMENT ==========
  
  createCompanion(
    id: string,
    name: string,
    template: keyof typeof COMPANION_TEMPLATES,
    customizations?: Partial<CompanionState>
  ): CompanionState {
    // Enforce companion limit
    if (this.companions.size >= this.maxTotalCompanions) {
      // Remove oldest inactive companions
      const inactiveCompanions = Array.from(this.companions.entries())
        .filter(([cid]) => !this.activeCompanions.includes(cid))
        .sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      
      if (inactiveCompanions.length > 0) {
        this.companions.delete(inactiveCompanions[0][0]);
        console.log(`[Companion] Removed oldest inactive companion to make room`);
      }
    }

    const templateData = COMPANION_TEMPLATES[template] || {};
    
    const companion: CompanionState = {
      id,
      name,
      status: 'waiting',
      mood: 'neutral',
      moodIntensity: 50,
      affinity: 0,
      trust: 30,
      respect: 30,
      fear: 0,
      romanticInterest: 0,
      personality: {
        ...(templateData.personality || COMPANION_TEMPLATES.loyal_warrior.personality!),
        hiddenQuirks: templateData.personality?.hiddenQuirks || [],
      },
      quirkDiscovery: {
        discoveredQuirks: [],
        lastDiscoveryCheck: Date.now(),
      },
      conversationMemory: {
        companionId: id,
        sharedTopics: [],
        askedTopics: [],
        lastAskedAt: 0,
        conversationDepth: 0,
      },
      memories: [],
      internalThoughts: `I wonder what kind of person ${name} will turn out to be...`,
      wantsToSpeak: false,
      combatRole: templateData.combatRole || 'damage',
      skills: templateData.skills || [],
      equipment: [],
      joinedAt: Date.now(),
      lastSpoke: 0,
      confessedLove: false,
      wasBetrayed: false,
      hasSecret: Math.random() > 0.5, // 50% chance of having a secret
      secretRevealed: false,
      ...customizations,
    };
    
    // Check if they're initially attracted based on personality
    if (companion.personality.romanticInterest.attractedToPlayer) {
      companion.romanticInterest = 20 + Math.floor(Math.random() * 20);
    }
    
    this.companions.set(id, companion);
    console.log(`[Companion] Created: ${name} (${template})`);
    
    return companion;
  }
  
  recruitCompanion(companionId: string): { success: boolean; message: string } {
    const companion = this.companions.get(companionId);
    if (!companion) {
      return { success: false, message: 'Companion not found.' };
    }
    
    if (this.activeCompanions.length >= this.maxPartySize) {
      return { success: false, message: 'Party is full. Dismiss someone first.' };
    }
    
    if (companion.status === 'hostile') {
      return { success: false, message: `${companion.name} refuses to join. They see you as an enemy.` };
    }
    
    if (companion.affinity < -20) {
      return { success: false, message: `${companion.name} doesn't trust you enough to travel together.` };
    }
    
    companion.status = 'active';
    this.activeCompanions.push(companionId);
    
    this.addMemory(companionId, 'event', 'Joined the party', 10);
    companion.wantsToSpeak = true;
    companion.pendingReaction = this.generateJoinReaction(companion);
    
    eventBus.emitRelationshipChanged(
      companion.name,
      'player',
      'affection',
      0,
      10,
      'joined party',
      0
    );
    
    return { success: true, message: `${companion.name} has joined your party!` };
  }
  
  dismissCompanion(companionId: string, reason: 'player' | 'voluntary' | 'hostile'): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    
    this.activeCompanions = this.activeCompanions.filter(id => id !== companionId);
    
    switch (reason) {
      case 'player':
        companion.status = 'waiting';
        this.addMemory(companionId, 'event', 'Was dismissed from the party', -15);
        companion.pendingReaction = this.generateDismissalReaction(companion, 'player');
        break;
      case 'voluntary':
        companion.status = 'left';
        this.addMemory(companionId, 'event', 'Left the party voluntarily', 0);
        companion.pendingReaction = this.generateDismissalReaction(companion, 'voluntary');
        break;
      case 'hostile':
        companion.status = 'hostile';
        this.addMemory(companionId, 'betrayal', 'Turned against the player', 0);
        companion.pendingReaction = this.generateDismissalReaction(companion, 'hostile');
        break;
    }
    
    eventBus.emitRelationshipChanged(
      companion.name,
      'player',
      'affection',
      0,
      -50,
      `companion ${reason}`,
      0
    );
  }
  
  /**
   * Revive a dead companion - cheat mode feature
   * Returns story introduction text for the resurrection event
   */
  reviveCompanion(companionId: string): { success: boolean; message: string; storyIntro?: string } {
    const companion = this.companions.get(companionId);
    if (!companion) {
      return { success: false, message: 'Companion not found.' };
    }
    
    if (companion.status !== 'dead') {
      return { success: false, message: `${companion.name} is not dead.` };
    }
    
    // Resurrection story variations
    const resurrectionStories = [
      {
        intro: `A blinding light erupts from ${companion.name}'s fallen form. Divine energy courses through their body as an ethereal voice whispers, "Your journey is not yet complete." Their eyes flutter open, gasping for breath.`,
        reaction: `I... I saw the other side. It was peaceful, but something pulled me back. I'm not ready to leave you yet.`
      },
      {
        intro: `The air shimmers with arcane power as an ancient spell takes hold. ${companion.name}'s wounds begin to close, color returning to their pallid skin. With a shuddering breath, life returns to their body.`,
        reaction: `*gasps* What... what happened? I remember darkness, then... warmth. I'm alive?`
      },
      {
        intro: `A mysterious figure cloaked in shadows appears beside ${companion.name}'s body. With a whispered incantation, they press a glowing hand to their chest. The figure vanishes as ${companion.name} stirs, their eyes slowly opening.`,
        reaction: `I dreamed of someone... calling me back. The voice said I had unfinished business. With you.`
      },
      {
        intro: `${companion.name}'s spirit, visible as a faint shimmer, is pulled back into their body by an invisible force. Their chest heaves as they draw their first breath in what feels like an eternity. Tears stream down their face.`,
        reaction: `*reaches out with trembling hands* You brought me back. I don't know how, but... thank you. I won't waste this second chance.`
      },
      {
        intro: `The ground beneath ${companion.name} pulses with primal energy. Roots and vines cradle their body as nature itself intervenes, refusing to let their story end here. With a gasp, they return to the world of the living.`,
        reaction: `The earth... it held me. It said my roots were still here, still connected to you. I couldn't leave.`
      }
    ];
    
    const story = resurrectionStories[Math.floor(Math.random() * resurrectionStories.length)];
    
    // Revive the companion
    companion.status = 'waiting';
    companion.mood = 'content';
    companion.moodIntensity = 70;
    
    // Massive affinity boost from being resurrected
    companion.affinity = Math.min(100, companion.affinity + 40);
    companion.trust = Math.min(100, companion.trust + 30);
    companion.romanticInterest = Math.min(100, companion.romanticInterest + 15);
    
    // Add resurrection memory
    this.addMemory(companionId, 'event', 'Was brought back from death', 50);
    
    // Set their reaction dialogue
    companion.wantsToSpeak = true;
    companion.pendingReaction = story.reaction;
    
    // Emit resurrection event
    eventBus.emitRelationshipChanged(
      companion.name,
      'player',
      'affection',
      0,
      40,
      'resurrection',
      0
    );
    
    console.log(`[Companion] ${companion.name} has been revived!`);
    
    return { 
      success: true, 
      message: `${companion.name} has been brought back from death!`,
      storyIntro: story.intro
    };
  }
  
  // ========== PLAYER ACTION REACTIONS ==========
  
  processPlayerAction(actionType: PlayerActionType, context?: string): void {
    for (const companionId of this.activeCompanions) {
      const companion = this.companions.get(companionId);
      if (!companion || companion.status !== 'active') continue;
      
      const reaction = this.calculateReaction(companion, actionType, context);
      
      // Apply affinity change
      companion.affinity = Math.max(-100, Math.min(100, companion.affinity + reaction.affinityChange));
      
      // Update other stats
      if (reaction.affinityChange > 0) {
        companion.trust = Math.min(100, companion.trust + Math.abs(reaction.affinityChange) * 0.5);
        companion.respect = Math.min(100, companion.respect + Math.abs(reaction.affinityChange) * 0.3);
      } else if (reaction.affinityChange < 0) {
        companion.trust = Math.max(0, companion.trust - Math.abs(reaction.affinityChange) * 0.5);
        if (actionType === 'cruelty' || actionType === 'violence') {
          companion.fear = Math.min(100, companion.fear + Math.abs(reaction.affinityChange) * 0.3);
        }
      }
      
      // Romantic interest changes
      if (actionType === 'romance_flirt' && companion.personality.romanticInterest.attractedToPlayer) {
        companion.romanticInterest = Math.min(100, companion.romanticInterest + 10);
      } else if (actionType === 'romance_reject') {
        companion.romanticInterest = Math.max(0, companion.romanticInterest - 30);
      }
      
      // Store memory with limit enforcement
      this.addMemory(companionId, 'action', reaction.description, reaction.affinityChange, actionType);
      
      // Enforce memory limit
      if (companion.memories.length > this.maxMemoriesPerCompanion) {
        // Remove oldest non-significant memories
        const toRemove = companion.memories.length - this.maxMemoriesPerCompanion;
        companion.memories = companion.memories
          .sort((a, b) => Math.abs(b.affinityChange) - Math.abs(a.affinityChange)) // Keep significant
          .slice(0, this.maxMemoriesPerCompanion);
        console.log(`[Companion] Trimmed ${toRemove} memories from ${companion.name}`);
      }
      
      // Update mood based on reaction
      this.updateMood(companion, reaction.affinityChange);
      
      // Set pending reaction for dialogue
      if (Math.abs(reaction.affinityChange) >= 5) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = reaction.dialogue;
      }
      
      // Check for critical thresholds
      this.checkThresholds(companion);
      
      console.log(`[Companion] ${companion.name} reacted to ${actionType}: ${reaction.affinityChange > 0 ? '+' : ''}${reaction.affinityChange}`);
    }
  }
  
  private calculateReaction(
    companion: CompanionState, 
    actionType: PlayerActionType,
    context?: string
  ): { affinityChange: number; description: string; dialogue: string } {
    let affinityChange = 0;
    let description = `Witnessed player action: ${actionType}`;
    let dialogue = '';
    
    // Check if they approve or disapprove
    const approves = companion.personality.approves.includes(actionType);
    const disapproves = companion.personality.disapproves.includes(actionType);
    
    // Base reactions
    const REACTION_VALUES: Record<PlayerActionType, number> = {
      combat_kill: 0, // Neutral unless they have specific opinions
      combat_spare: 5,
      theft: -10,
      charity: 10,
      lie: -5,
      truth: 5,
      violence: -5,
      diplomacy: 5,
      betrayal: -30,
      loyalty: 15,
      cowardice: -10,
      bravery: 10,
      romance_flirt: 5,
      romance_reject: -15,
      insult: -20,
      compliment: 10,
      greed: -5,
      sacrifice: 15,
      mercy: 10,
      cruelty: -20,
    };
    
    affinityChange = REACTION_VALUES[actionType] || 0;
    
    // Modify based on approval/disapproval
    if (approves) {
      affinityChange = Math.abs(affinityChange) * 1.5;
      dialogue = this.generateApprovalDialogue(companion, actionType);
    } else if (disapproves) {
      affinityChange = -Math.abs(affinityChange) * 1.5;
      dialogue = this.generateDisapprovalDialogue(companion, actionType);
    } else {
      // Neutral reaction with slight variation
      affinityChange = affinityChange * (0.5 + Math.random() * 0.5);
      dialogue = this.generateNeutralDialogue(companion, actionType);
    }
    
    // Round the change
    affinityChange = Math.round(affinityChange);
    
    return { affinityChange, description, dialogue };
  }
  
  // ========== DIALOGUE GENERATION ==========
  
  private generateApprovalDialogue(companion: CompanionState, action: PlayerActionType): string {
    const phrases = [
      `Now that's what I like to see!`,
      `I knew I was right about you.`,
      `This is why I follow you.`,
      `Finally, someone who understands.`,
      `*nods approvingly* Well done.`,
    ];
    
    const catchphrase = companion.personality.catchphrases[
      Math.floor(Math.random() * companion.personality.catchphrases.length)
    ] || '';
    
    return Math.random() > 0.3 ? 
      phrases[Math.floor(Math.random() * phrases.length)] : 
      catchphrase;
  }
  
  private generateDisapprovalDialogue(companion: CompanionState, action: PlayerActionType): string {
    const intensity = Math.abs(companion.affinity);
    
    if (intensity > 60) {
      return [
        `This is exactly what I feared you'd become.`,
        `I don't know if I can follow someone who does this.`,
        `You've changed... and not for the better.`,
        `*shakes head in disgust* Is this really who you are?`,
      ][Math.floor(Math.random() * 4)];
    }
    
    return [
      `I... don't agree with this.`,
      `Was that really necessary?`,
      `*frowns* I would have done it differently.`,
      `You and I see things very differently.`,
      `I hope you know what you're doing.`,
    ][Math.floor(Math.random() * 5)];
  }
  
  private generateNeutralDialogue(companion: CompanionState, action: PlayerActionType): string {
    return [
      `Hmm.`,
      `*observes silently*`,
      `Interesting choice.`,
      `I see.`,
      `...`,
    ][Math.floor(Math.random() * 5)];
  }
  
  private generateJoinReaction(companion: CompanionState): string {
    if (companion.affinity > 30) {
      return `I'm honored to travel with you. Together, we'll do great things.`;
    } else if (companion.affinity > 0) {
      return `Alright, let's see where this goes. Don't make me regret this.`;
    } else {
      return `I'll come with you, but I'm watching closely. Trust is earned.`;
    }
  }
  
  private generateDismissalReaction(companion: CompanionState, reason: string): string {
    switch (reason) {
      case 'player':
        if (companion.affinity > 50) {
          return `I understand. I'll be here if you need me. *looks sad*`;
        } else if (companion.affinity > 0) {
          return `Fine. I have other things to attend to anyway.`;
        } else {
          return `Good riddance. Maybe you'll think twice about how you treat people.`;
        }
      case 'voluntary':
        return `I can't do this anymore. Our paths must diverge here. Farewell.`;
      case 'hostile':
        return `You've pushed me too far. We are enemies now. Remember that.`;
      default:
        return `...Goodbye.`;
    }
  }
  
  // ========== MOOD & THRESHOLD MANAGEMENT ==========
  
  private updateMood(companion: CompanionState, affinityChange: number): void {
    const previousMood = companion.mood;
    
    if (affinityChange >= 15) {
      companion.mood = 'joyful';
      companion.moodIntensity = Math.min(100, companion.moodIntensity + 20);
    } else if (affinityChange >= 5) {
      companion.mood = 'content';
      companion.moodIntensity = Math.min(100, companion.moodIntensity + 10);
    } else if (affinityChange <= -20) {
      companion.mood = companion.fear > 50 ? 'fearful' : 'angry';
      companion.moodIntensity = Math.min(100, companion.moodIntensity + 30);
    } else if (affinityChange <= -10) {
      companion.mood = 'annoyed';
      companion.moodIntensity = Math.min(100, companion.moodIntensity + 15);
    } else if (affinityChange <= -5) {
      companion.mood = 'sad';
      companion.moodIntensity = Math.min(100, companion.moodIntensity + 10);
    }
    
    // Decay mood intensity over time (called elsewhere)
    if (previousMood !== companion.mood) {
      console.log(`[Companion] ${companion.name} mood: ${previousMood} -> ${companion.mood}`);
    }
  }
  
  private checkThresholds(companion: CompanionState): void {
    // Check for betrayal (turning hostile)
    if (companion.affinity <= companion.personality.betrayalThreshold) {
      if (companion.status === 'active') {
        console.log(`[Companion] ${companion.name} has turned hostile!`);
        this.dismissCompanion(companion.id, 'hostile');
      }
    }
    // Check for voluntary departure
    else if (companion.affinity <= companion.personality.departureThreshold) {
      if (companion.status === 'active' && !companion.wasBetrayed) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = `I'm... reconsidering whether I should stay. Your choices trouble me.`;
        
        if (Math.random() < 0.3) {
          console.log(`[Companion] ${companion.name} is leaving voluntarily.`);
          this.dismissCompanion(companion.id, 'voluntary');
        }
      }
    }
    
    // Check for romance confession
    if (
      companion.personality.romanticInterest.enabled &&
      companion.romanticInterest >= companion.personality.romanticInterest.romanceThreshold &&
      !companion.confessedLove &&
      companion.affinity > 40
    ) {
      companion.confessedLove = true;
      companion.wantsToSpeak = true;
      companion.pendingReaction = this.generateRomanceConfession(companion);
      companion.mood = 'romantic';
      // Romance confession handled via pending reaction dialogue
    }
  }
  
  private generateRomanceConfession(companion: CompanionState): string {
    const confessions = [
      `I... I need to tell you something. Being with you has changed me. I think I'm falling for you.`,
      `I've tried to ignore these feelings, but I can't anymore. You mean more to me than just a traveling companion.`,
      `Every time you smile, my heart races. I know this complicates things, but... I love you.`,
      `There's something I've been meaning to say. When I look at you, I see my future. Is that... crazy?`,
      `I don't know how to say this properly. *takes a deep breath* I have feelings for you. Real feelings.`,
    ];
    
    return confessions[Math.floor(Math.random() * confessions.length)];
  }
  
  // ========== QUIRK DISCOVERY SYSTEM ==========
  
  // Thresholds for discovering hidden quirks
  private quirkDiscoveryThresholds = [
    { trust: 40, affinity: 20 },  // First hidden quirk
    { trust: 60, affinity: 40 },  // Second hidden quirk  
    { trust: 80, affinity: 60 },  // Third hidden quirk
  ];
  
  /**
   * Check if any companions have hidden quirks ready to be discovered
   * Called periodically during gameplay
   */
  checkForQuirkDiscovery(): { companion: CompanionState; quirk: string; dialogue: string } | null {
    for (const companionId of this.activeCompanions) {
      const companion = this.companions.get(companionId);
      if (!companion || companion.status !== 'active') continue;
      
      // Don't check too frequently
      const timeSinceLastCheck = Date.now() - companion.quirkDiscovery.lastDiscoveryCheck;
      if (timeSinceLastCheck < 60000) continue; // At least 1 minute between checks
      
      companion.quirkDiscovery.lastDiscoveryCheck = Date.now();
      
      const discovery = this.tryDiscoverQuirk(companion);
      if (discovery) {
        return discovery;
      }
    }
    return null;
  }
  
  /**
   * Try to discover a hidden quirk for a specific companion
   */
  private tryDiscoverQuirk(companion: CompanionState): { companion: CompanionState; quirk: string; dialogue: string } | null {
    const hiddenQuirks = companion.personality.hiddenQuirks || [];
    const discoveredCount = companion.quirkDiscovery.discoveredQuirks.length;
    
    // No more quirks to discover
    if (discoveredCount >= hiddenQuirks.length) return null;
    
    // Check if we meet the threshold for the next quirk
    const threshold = this.quirkDiscoveryThresholds[discoveredCount];
    if (!threshold) return null;
    
    if (companion.trust >= threshold.trust && companion.affinity >= threshold.affinity) {
      // Discover the next quirk!
      const quirk = hiddenQuirks[discoveredCount];
      companion.quirkDiscovery.discoveredQuirks.push(quirk);
      
      // Move quirk to visible quirks
      if (!companion.personality.quirks.includes(quirk)) {
        companion.personality.quirks.push(quirk);
      }
      
      // Generate discovery dialogue
      const dialogue = this.generateQuirkDiscoveryDialogue(companion, quirk);
      
      // Add memory of the moment
      this.addMemory(companion.id, 'event', `Revealed a hidden side: ${quirk}`, 5);
      
      // Set pending reaction so they speak about it
      companion.wantsToSpeak = true;
      companion.pendingReaction = dialogue;
      
      console.log(`[Companion] ${companion.name} revealed hidden quirk: ${quirk}`);
      
      // Emit quirk discovery event using SECRET_SHARED type
      eventBus.emit({
        type: 'SECRET_SHARED',
        source: 'companionSystem',
        priority: 'normal',
        tick: 0,
        data: {
          learnerEntity: 'player',
          sourceEntity: companion.id,
          fact: `${companion.name} has quirk: ${quirk}`,
          factType: 'quirk_discovered',
          reliability: 100,
        },
      } as any);
      
      return { companion, quirk, dialogue };
    }
    
    return null;
  }
  
  /**
   * Generate dialogue for when a hidden quirk is discovered
   */
  private generateQuirkDiscoveryDialogue(companion: CompanionState, quirk: string): string {
    const templates = [
      `*${quirk}* I... don't usually let people see this side of me. But with you, it feels safe.`,
      `You might have noticed... *${quirk}* I know it's strange, but it's part of who I am.`,
      `*${quirk}* ...Sorry. I usually hide this, but I suppose there's no point pretending anymore.`,
      `I've been meaning to tell you... *${quirk}* Not many people know about this.`,
      `*${quirk}* I guess after all we've been through, you deserve to know the real me.`,
      `*seems embarrassed* *${quirk}* I've never shown this to anyone before.`,
      `Between us? *${quirk}* ...Please don't laugh. It means something to me.`,
      `You know what? *${quirk}* There. Now you know one of my secrets.`,
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }
  
  /**
   * Get all discovered quirks for a companion
   */
  getDiscoveredQuirks(companionId: string): string[] {
    const companion = this.companions.get(companionId);
    if (!companion) return [];
    return companion.quirkDiscovery.discoveredQuirks;
  }
  
  /**
   * Get discovery progress for a companion
   */
  getQuirkDiscoveryProgress(companionId: string): { 
    discovered: number; 
    total: number; 
    nextThreshold?: { trust: number; affinity: number } 
  } {
    const companion = this.companions.get(companionId);
    if (!companion) return { discovered: 0, total: 0 };
    
    const discovered = companion.quirkDiscovery.discoveredQuirks.length;
    const total = companion.personality.hiddenQuirks?.length || 0;
    const nextThreshold = this.quirkDiscoveryThresholds[discovered];
    
    return { discovered, total, nextThreshold };
  }
  
  /**
   * Force discover all quirks (cheat/debug mode)
   */
  forceDiscoverAllQuirks(companionId: string): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    
    const hiddenQuirks = companion.personality.hiddenQuirks || [];
    for (const quirk of hiddenQuirks) {
      if (!companion.quirkDiscovery.discoveredQuirks.includes(quirk)) {
        companion.quirkDiscovery.discoveredQuirks.push(quirk);
        if (!companion.personality.quirks.includes(quirk)) {
          companion.personality.quirks.push(quirk);
        }
      }
    }
    console.log(`[Companion] Force discovered all quirks for ${companion.name}`);
  }
  
  // ========== BONDING MOMENTS SYSTEM ==========
  
  // Story events that can trigger bonding moments
  private bondingMomentTriggers: Record<string, { 
    minAffinity: number;
    minTrust: number;
    quirkRevealChance: number;
    bondingDialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious';
  }> = {
    'combat_survived_together': { minAffinity: 10, minTrust: 20, quirkRevealChance: 0.4, bondingDialogueType: 'grateful' },
    'player_saved_companion': { minAffinity: 0, minTrust: 10, quirkRevealChance: 0.6, bondingDialogueType: 'grateful' },
    'companion_saved_player': { minAffinity: 20, minTrust: 30, quirkRevealChance: 0.5, bondingDialogueType: 'protective' },
    'shared_campfire': { minAffinity: 15, minTrust: 25, quirkRevealChance: 0.5, bondingDialogueType: 'vulnerable' },
    'witnessed_player_kindness': { minAffinity: 10, minTrust: 15, quirkRevealChance: 0.3, bondingDialogueType: 'curious' },
    'long_journey_together': { minAffinity: 20, minTrust: 30, quirkRevealChance: 0.4, bondingDialogueType: 'vulnerable' },
    'player_confided_in_companion': { minAffinity: 25, minTrust: 35, quirkRevealChance: 0.7, bondingDialogueType: 'vulnerable' },
    'faced_danger_together': { minAffinity: 15, minTrust: 25, quirkRevealChance: 0.45, bondingDialogueType: 'protective' },
    'quiet_moment_alone': { minAffinity: 30, minTrust: 40, quirkRevealChance: 0.6, bondingDialogueType: 'curious' },
    'celebration_victory': { minAffinity: 20, minTrust: 20, quirkRevealChance: 0.35, bondingDialogueType: 'grateful' },
  };
  
  /**
   * Trigger a bonding moment - can reveal a hidden quirk during significant story events
   */
  triggerBondingMoment(
    companionId: string, 
    eventType: string, 
    context?: string
  ): { 
    bonded: boolean; 
    quirkRevealed?: string; 
    dialogue: string;
    dialogueType: 'bonding' | 'quirk_reveal' | 'curiosity';
  } | null {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') return null;
    
    const trigger = this.bondingMomentTriggers[eventType];
    if (!trigger) {
      console.log(`[Companion] Unknown bonding event type: ${eventType}`);
      return null;
    }
    
    // Check if relationship meets minimum thresholds
    if (companion.affinity < trigger.minAffinity || companion.trust < trigger.minTrust) {
      return null;
    }
    
    // Apply affinity/trust boost from bonding
    companion.affinity = Math.min(100, companion.affinity + 5);
    companion.trust = Math.min(100, companion.trust + 3);
    
    this.addMemory(companionId, 'event', `Bonding moment: ${eventType}${context ? ` - ${context}` : ''}`, 5);
    
    // Check if this triggers a quirk reveal
    const hiddenQuirks = companion.personality.hiddenQuirks || [];
    const undiscoveredQuirks = hiddenQuirks.filter(q => !companion.quirkDiscovery.discoveredQuirks.includes(q));
    
    if (undiscoveredQuirks.length > 0 && Math.random() < trigger.quirkRevealChance) {
      // Reveal a quirk through bonding!
      const quirk = undiscoveredQuirks[Math.floor(Math.random() * undiscoveredQuirks.length)];
      companion.quirkDiscovery.discoveredQuirks.push(quirk);
      
      if (!companion.personality.quirks.includes(quirk)) {
        companion.personality.quirks.push(quirk);
      }
      
      const dialogue = this.generateBondingQuirkRevealDialogue(companion, quirk, trigger.bondingDialogueType);
      
      companion.wantsToSpeak = true;
      companion.pendingReaction = dialogue;
      
      console.log(`[Companion] ${companion.name} revealed quirk during bonding moment (${eventType}): ${quirk}`);
      
      return { bonded: true, quirkRevealed: quirk, dialogue, dialogueType: 'quirk_reveal' };
    }
    
    // No quirk revealed, but still a bonding moment
    const dialogue = this.generateBondingDialogue(companion, trigger.bondingDialogueType, context);
    
    // Check if they want to ask about the player (curiosity system)
    if (trigger.bondingDialogueType === 'curious' || 
        (companion.affinity >= 30 && companion.trust >= 40 && Math.random() < 0.4)) {
      const curiosityResult = this.generateCuriosityQuestion(companion);
      companion.wantsToSpeak = true;
      companion.pendingReaction = curiosityResult.dialogue;
      return { bonded: true, dialogue: curiosityResult.dialogue, dialogueType: 'curiosity' };
    }
    
    companion.wantsToSpeak = true;
    companion.pendingReaction = dialogue;
    
    return { bonded: true, dialogue, dialogueType: 'bonding' };
  }
  
  /**
   * Generate dialogue when a quirk is revealed through a bonding moment
   */
  private generateBondingQuirkRevealDialogue(
    companion: CompanionState, 
    quirk: string, 
    dialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious'
  ): string {
    const templates: Record<typeof dialogueType, string[]> = {
      vulnerable: [
        `*${quirk}* ...I've never shown anyone this side of me. But after everything we've been through, it feels right.`,
        `I want to be honest with you. *${quirk}* There. Now you know something real about me.`,
        `Since we're being real with each other... *${quirk}* I don't usually admit that to anyone.`,
      ],
      grateful: [
        `You saved me back there. I think you deserve to know the real me. *${quirk}*`,
        `I owe you my life. The least I can give you is honesty. *${quirk}* ...That's something I usually hide.`,
        `*${quirk}* I guess I trust you enough now to let you see that.`,
      ],
      protective: [
        `I couldn't bear to lose you. Which reminds me... *${quirk}* I've always been like this.`,
        `Keeping you safe matters to me. And since it does... *${quirk}* You should know who I really am.`,
        `*${quirk}* ...If I'm going to protect you, you should know all of me. The strange parts too.`,
      ],
      curious: [
        `I've been wondering about you, and I realized... you barely know me. *${quirk}* There. Something real.`,
        `*${quirk}* ...I figured since I want to know more about you, I should share something too.`,
        `Fair is fair. You've told me things. So... *${quirk}* Now we're even.`,
      ],
    };
    
    const options = templates[dialogueType];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * Generate general bonding dialogue (no quirk revealed)
   */
  private generateBondingDialogue(
    companion: CompanionState, 
    dialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious',
    context?: string
  ): string {
    const templates: Record<typeof dialogueType, string[]> = {
      vulnerable: [
        `*looks at you thoughtfully* I'm glad you're here. Really.`,
        `...It's been a while since I felt like I could rely on someone.`,
        `*sighs* I don't say this often, but... thank you. For everything.`,
        `Moments like this remind me why I stay.`,
      ],
      grateful: [
        `I won't forget what you did. Not ever.`,
        `*smiles genuinely* You have my gratitude. And my loyalty.`,
        `Thank you. Those words don't feel like enough, but... thank you.`,
        `You could have left me. You didn't. That means something.`,
      ],
      protective: [
        `I'll have your back. No matter what comes.`,
        `*determined expression* If anyone tries to hurt you, they go through me.`,
        `I've decided. Keeping you safe is my priority now.`,
        `*watches over you* Rest easy. I'm here.`,
      ],
      curious: [
        `I've been meaning to ask... who were you before all this?`,
        `*tilts head* There's more to you than meets the eye, isn't there?`,
        `Tell me something. Something real. I want to understand you better.`,
        `What drives you? I've watched you, but I still don't quite get it.`,
      ],
    };
    
    const options = templates[dialogueType];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // ========== COMPANION CURIOSITY SYSTEM ==========
  
  // Questions companions ask to learn more about the player
  private playerQuestions = [
    { question: "What did you dream of becoming when you were young?", topic: 'dreams' },
    { question: "Do you have anyone waiting for you? Family? Someone special?", topic: 'relationships' },
    { question: "What's your happiest memory?", topic: 'memories' },
    { question: "What haunts you? What keeps you up at night?", topic: 'fears' },
    { question: "If this was all over tomorrow, what would you do with your life?", topic: 'future' },
    { question: "Have you ever lost someone close to you?", topic: 'loss' },
    { question: "What made you become who you are today?", topic: 'origin' },
    { question: "Do you believe in fate, or do we make our own path?", topic: 'philosophy' },
    { question: "What's something you've never told anyone?", topic: 'secrets' },
    { question: "Is there something you regret? Something you'd do differently?", topic: 'regrets' },
    { question: "What do you fight for? What keeps you going?", topic: 'motivation' },
    { question: "Have you ever been in love?", topic: 'love' },
    { question: "What's the bravest thing you've ever done?", topic: 'courage' },
    { question: "What brings you peace?", topic: 'peace' },
    { question: "If you could go anywhere after this, where would it be?", topic: 'wanderlust' },
  ];
  
  /**
   * Generate a question the companion asks to understand the player better
   * Avoids topics this specific companion has already asked about
   */
  private generateCuriosityQuestion(companion: CompanionState): { dialogue: string; topic: ConversationTopic } {
    // Filter out topics this companion has already asked about
    const askedTopics = companion.conversationMemory?.askedTopics || [];
    const availableQuestions = this.playerQuestions.filter(
      q => !askedTopics.includes(q.topic as ConversationTopic)
    );
    
    // If they've asked all questions, reset to allow re-asking (with different framing)
    const questionPool = availableQuestions.length > 0 ? availableQuestions : this.playerQuestions;
    const questionData = questionPool[Math.floor(Math.random() * questionPool.length)];
    
    const intros = [
      `*settles in close* I've been wanting to ask you something...`,
      `*looks at you with genuine interest* Can I ask you something personal?`,
      `*quiet moment* I realized I don't know much about you. Not really.`,
      `*thoughtful pause* You know a lot about me now. But I want to know you too.`,
      `*meets your eyes* Tell me something about yourself. The real you.`,
    ];
    
    const intro = intros[Math.floor(Math.random() * intros.length)];
    return { 
      dialogue: `${intro} ${questionData.question}`,
      topic: questionData.topic as ConversationTopic
    };
  }
  
  /**
   * Check if a companion wants to ask the player something (healthy relationship check)
   */
  checkCompanionCuriosity(): { companion: CompanionState; question: string; topic: string } | null {
    const curiousCompanions = this.activeCompanions
      .map(id => this.companions.get(id))
      .filter((c): c is CompanionState => 
        c !== undefined && 
        c.status === 'active' &&
        c.affinity >= 25 && // Healthy affinity
        c.trust >= 35 && // Good trust
        c.fear < 30 && // Not afraid of player
        !c.wantsToSpeak // Not already wanting to say something
      );
    
    if (curiousCompanions.length === 0) return null;
    
    // 15% chance per check for curiosity to trigger
    if (Math.random() > 0.15) return null;
    
    const companion = curiousCompanions[Math.floor(Math.random() * curiousCompanions.length)];
    const questionResult = this.generateCuriosityQuestion(companion);
    
    companion.wantsToSpeak = true;
    companion.pendingReaction = questionResult.dialogue;
    
    // Track that this companion asked about this topic
    if (!companion.conversationMemory.askedTopics.includes(questionResult.topic)) {
      companion.conversationMemory.askedTopics.push(questionResult.topic);
    }
    companion.conversationMemory.lastAskedAt = Date.now();
    
    console.log(`[Companion] ${companion.name} wants to know more about player (topic: ${questionResult.topic})`);
    
    return { companion, question: questionResult.dialogue, topic: questionResult.topic };
  }
  
  /**
   * Process player's response to a companion's question
   * This strengthens the bond, records the shared topic, and may trigger quirk reveals
   */
  processPlayerConfidingResponse(
    companionId: string, 
    topic: ConversationTopic,
    responseType: 'honest' | 'deflect' | 'lie' | 'emotional',
    playerSummary?: string // Optional player-provided context for what they shared
  ): { affinityChange: number; trustChange: number; dialogue: string; topicRecorded: boolean } | null {
    const companion = this.companions.get(companionId);
    if (!companion) return null;
    
    let affinityChange = 0;
    let trustChange = 0;
    let dialogue = '';
    let topicRecorded = false;
    
    switch (responseType) {
      case 'honest':
        affinityChange = 8;
        trustChange = 10;
        dialogue = this.generateResponseToConfiding(companion, 'honest');
        // Record the shared topic for this companion
        topicRecorded = this.recordSharedTopic(companionId, topic, responseType, playerSummary, dialogue);
        // Chance to trigger bonding moment
        if (Math.random() < 0.5) {
          this.triggerBondingMoment(companionId, 'player_confided_in_companion');
        }
        break;
      case 'emotional':
        affinityChange = 12;
        trustChange = 15;
        dialogue = this.generateResponseToConfiding(companion, 'emotional');
        // Record the shared topic for this companion
        topicRecorded = this.recordSharedTopic(companionId, topic, responseType, playerSummary, dialogue);
        // Higher chance to trigger bonding moment
        if (Math.random() < 0.7) {
          this.triggerBondingMoment(companionId, 'player_confided_in_companion');
        }
        break;
      case 'deflect':
        affinityChange = -2;
        trustChange = -3;
        dialogue = this.generateResponseToConfiding(companion, 'deflect');
        // Don't record - player didn't share
        break;
      case 'lie':
        affinityChange = 0;
        trustChange = -8; // Companions may sense dishonesty
        dialogue = this.generateResponseToConfiding(companion, 'lie');
        // Record as lie (companion may reference this differently later)
        topicRecorded = this.recordSharedTopic(companionId, topic, responseType, playerSummary, dialogue);
        break;
    }
    
    companion.affinity = Math.max(-100, Math.min(100, companion.affinity + affinityChange));
    companion.trust = Math.max(0, Math.min(100, companion.trust + trustChange));
    
    // Update conversation depth
    if (responseType === 'honest' || responseType === 'emotional') {
      companion.conversationMemory.conversationDepth = Math.min(
        100, 
        companion.conversationMemory.conversationDepth + (responseType === 'emotional' ? 8 : 5)
      );
    }
    
    this.addMemory(companionId, 'dialogue', `Player ${responseType} response about ${topic}`, affinityChange);
    
    return { affinityChange, trustChange, dialogue, topicRecorded };
  }
  
  /**
   * Record a shared topic in the companion's conversation memory
   * Returns true if this was a new topic, false if updating an existing one
   */
  private recordSharedTopic(
    companionId: string,
    topic: ConversationTopic,
    responseType: 'honest' | 'deflect' | 'lie' | 'emotional',
    playerSummary: string | undefined,
    companionReaction: string
  ): boolean {
    const companion = this.companions.get(companionId);
    if (!companion) return false;
    
    // Check if this topic was already shared with THIS companion
    const existingTopic = companion.conversationMemory.sharedTopics.find(t => t.topic === topic);
    
    if (existingTopic) {
      // Update existing topic memory
      existingTopic.responseType = responseType;
      if (playerSummary) existingTopic.playerSummary = playerSummary;
      existingTopic.companionReaction = companionReaction;
      console.log(`[Companion] ${companion.name} - Updated shared topic: ${topic}`);
      return false;
    }
    
    // Add new topic memory
    const newTopicMemory: SharedTopicMemory = {
      topic,
      sharedAt: Date.now(),
      responseType,
      playerSummary,
      companionReaction,
      referencedCount: 0,
    };
    
    companion.conversationMemory.sharedTopics.push(newTopicMemory);
    
    console.log(`[Companion] ${companion.name} - Recorded new shared topic: ${topic}`);
    
    return true;
  }
  
  // ========== CONVERSATION REFERENCE SYSTEM ==========
  // Companions can reference past conversations with the player
  
  /**
   * Topic-specific dialogue templates for when companions reference past conversations
   */
  private topicReferenceTemplates: Record<ConversationTopic, {
    sincere: string[];  // When player was honest/emotional
    suspicious: string[];  // When player lied
    casual: string[];  // General references
  }> = {
    dreams: {
      sincere: [
        `*thoughtful* You know, I've been thinking about what you said about your dreams...`,
        `Remember when you told me about what you wanted to become? That stuck with me.`,
        `*smiles* You opened up about your dreams once. I haven't forgotten.`,
      ],
      suspicious: [
        `*studies you* You told me about your dreams before. Though... I'm not sure I believe all of it.`,
        `*tilts head* Those dreams you mentioned... were they real? Sometimes I wonder.`,
      ],
      casual: [
        `This reminds me of those dreams you mentioned.`,
        `*glances at you* Chasing dreams, are we?`,
      ],
    },
    relationships: {
      sincere: [
        `You told me about the people in your life. I know that wasn't easy.`,
        `*quietly* I remember what you said about the people who matter to you.`,
        `The way you talked about your loved ones... it told me a lot about who you are.`,
      ],
      suspicious: [
        `*watching* You mentioned people who matter to you. I'm still not sure what's true.`,
        `Those relationships you talked about... I wonder what you left out.`,
      ],
      casual: [
        `Relationships are complicated. You'd know that.`,
        `*knowing look* We've talked about this before.`,
      ],
    },
    memories: {
      sincere: [
        `That memory you shared with me... I think about it sometimes.`,
        `*warmly* You trusted me with a piece of your past. I carry that with me.`,
        `Your happiest memory... it says so much about what you value.`,
      ],
      suspicious: [
        `*skeptical* That memory you told me about... was it the whole truth?`,
        `You shared a memory once. I'm still not sure it happened like you said.`,
      ],
      casual: [
        `We all carry our memories with us.`,
        `*reflective* The past shapes us, doesn't it?`,
      ],
    },
    fears: {
      sincere: [
        `*serious* You trusted me with your fears. That takes strength.`,
        `I know what haunts you. And I won't use it against you.`,
        `What you told me about your fears... I'm here if it ever gets too heavy.`,
      ],
      suspicious: [
        `*searching gaze* You told me what scares you. Or did you?`,
        `Those fears you mentioned... were they real, or a mask for something deeper?`,
      ],
      casual: [
        `We all have things that haunt us.`,
        `*quietly* Fear is a universal language.`,
      ],
    },
    future: {
      sincere: [
        `You told me what you'd do if this was all over. I hope you get that chance.`,
        `*hopeful* That future you imagined... I want to see you reach it.`,
        `Remember what you said about tomorrow? I believed every word.`,
      ],
      suspicious: [
        `*doubtful* The future you painted... I wonder if that's really what you want.`,
        `You talked about tomorrow. But something tells me you weren't being honest.`,
      ],
      casual: [
        `The future is uncertain for all of us.`,
        `*gazes ahead* One day at a time, right?`,
      ],
    },
    loss: {
      sincere: [
        `*gently* You told me about someone you lost. I'll never forget that trust.`,
        `I know you've lost people. That kind of pain... it never fully goes away.`,
        `What you shared about loss... I understand you better now.`,
      ],
      suspicious: [
        `You mentioned losing someone. I couldn't tell if the grief was real.`,
        `*careful* That loss you described... I hope it was the truth.`,
      ],
      casual: [
        `Loss is something we all understand eventually.`,
        `*solemn* We carry our ghosts with us.`,
      ],
    },
    origin: {
      sincere: [
        `You told me how you became who you are. That story stays with me.`,
        `*appreciative* Knowing where you came from... it explains a lot.`,
        `Your past shaped you. And you trusted me with it.`,
      ],
      suspicious: [
        `*probing* That origin story you gave... how much was real?`,
        `You told me how you became this. I'm still sorting truth from fiction.`,
      ],
      casual: [
        `We're all products of our past.`,
        `*thoughtful* Everyone has a beginning.`,
      ],
    },
    philosophy: {
      sincere: [
        `Remember when we talked about fate? Your perspective was... illuminating.`,
        `*contemplative* What you believe about the world... it matters to me.`,
        `That philosophical moment we had... I think about it often.`,
      ],
      suspicious: [
        `*skeptical* Those beliefs you shared... were they really yours?`,
        `You talked about fate and choice. I'm not sure you meant it.`,
      ],
      casual: [
        `Big questions require big thinking.`,
        `*musing* Philosophy in the middle of chaos. Classic.`,
      ],
    },
    secrets: {
      sincere: [
        `*quietly* You trusted me with a secret. That bond is sacred.`,
        `What you told me in confidence... it's safe with me. Always.`,
        `I carry your secret like it's my own now.`,
      ],
      suspicious: [
        `*narrowed eyes* That secret you shared... was it the real one?`,
        `You gave me a secret. But I wonder if it was a decoy.`,
      ],
      casual: [
        `We all have secrets.`,
        `*knowing* Some things are best kept hidden.`,
      ],
    },
    regrets: {
      sincere: [
        `You told me about your regrets. That took courage.`,
        `*understanding* We all have things we'd do differently. Yours... I understand.`,
        `What you regret... it makes you human. And I respect you for sharing it.`,
      ],
      suspicious: [
        `*watching* Those regrets you mentioned... or were those someone else's?`,
        `You talked about what you'd change. Something felt off about it.`,
      ],
      casual: [
        `Regret is a heavy companion.`,
        `*sighs* The past is fixed. Only the future can change.`,
      ],
    },
    motivation: {
      sincere: [
        `I know what drives you now. That changes how I see everything you do.`,
        `*admiring* What keeps you going... it's inspiring, honestly.`,
        `You told me your motivation. And I believe in it.`,
      ],
      suspicious: [
        `*cautious* You told me what drives you. I'm still not sure I buy it.`,
        `Your motivation... was that the truth, or what you wanted me to hear?`,
      ],
      casual: [
        `Everyone needs a reason to keep going.`,
        `*determined* Purpose is everything.`,
      ],
    },
    love: {
      sincere: [
        `*softly* You told me about love. Real love. That vulnerability... I treasure it.`,
        `What you said about love... it showed me your heart.`,
        `I know you've loved. And lost. That trust you gave me... I honor it.`,
      ],
      suspicious: [
        `*searching* You talked about love. But was it real?`,
        `That story about love... something in your eyes didn't match.`,
      ],
      casual: [
        `Love makes fools of us all.`,
        `*wistful* The heart wants what it wants.`,
      ],
    },
    courage: {
      sincere: [
        `You told me about the bravest thing you've done. It inspired me.`,
        `*respectful* That act of courage you shared... I see you differently now.`,
        `What you did took guts. And you trusted me with that story.`,
      ],
      suspicious: [
        `*skeptical* That brave act you described... did it really happen that way?`,
        `You told me about courage. I'm still deciding if I believe it.`,
      ],
      casual: [
        `Courage comes in many forms.`,
        `*nods* Bravery isn't the absence of fear.`,
      ],
    },
    peace: {
      sincere: [
        `I know what brings you peace now. And I want to help you find more of it.`,
        `*gentle* What you said about peace... it was beautiful.`,
        `That moment of honesty about what calms you... I remember it.`,
      ],
      suspicious: [
        `*uncertain* You told me what brings you peace. But did you mean it?`,
        `That peace you described... I'm not sure it was real.`,
      ],
      casual: [
        `We all need moments of calm.`,
        `*peaceful* Serenity is hard to find.`,
      ],
    },
    wanderlust: {
      sincere: [
        `You told me where you'd go if you could. Maybe we'll get there together.`,
        `*dreamily* That place you imagined... I want to see it through your eyes.`,
        `Where you'd travel... it tells me so much about your soul.`,
      ],
      suspicious: [
        `*doubtful* That destination you mentioned... was it real or fantasy?`,
        `You talked about where you'd go. I'm not sure you were honest.`,
      ],
      casual: [
        `The road calls to all of us sometimes.`,
        `*wistful* There's always somewhere else to be.`,
      ],
    },
  };
  
  /**
   * Check if a companion should reference a past conversation
   * Only references conversations THEY had with the player (no companion leak)
   */
  checkForConversationReference(
    companionId: string,
    context?: { situation?: string; mood?: string }
  ): { shouldReference: boolean; dialogue: string; topic: ConversationTopic } | null {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') return null;
    
    const sharedTopics = companion.conversationMemory.sharedTopics;
    if (sharedTopics.length === 0) return null;
    
    // Higher chance to reference if relationship is healthy
    const referenceChance = companion.trust >= 50 ? 0.20 : 0.10;
    if (Math.random() > referenceChance) return null;
    
    // Pick a topic that hasn't been referenced recently
    const now = Date.now();
    const REFERENCE_COOLDOWN = 1000 * 60 * 10; // 10 minute cooldown per topic
    
    const eligibleTopics = sharedTopics.filter(t => {
      if (!t.lastReferenced) return true;
      return (now - t.lastReferenced) > REFERENCE_COOLDOWN;
    });
    
    if (eligibleTopics.length === 0) return null;
    
    // Weighted selection - more recently shared topics are more likely
    const sortedByRecency = [...eligibleTopics].sort((a, b) => b.sharedAt - a.sharedAt);
    const weights = sortedByRecency.map((_, i) => Math.max(1, sortedByRecency.length - i));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    let random = Math.random() * totalWeight;
    let selectedTopic: SharedTopicMemory | null = null;
    for (let i = 0; i < sortedByRecency.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        selectedTopic = sortedByRecency[i];
        break;
      }
    }
    
    if (!selectedTopic) selectedTopic = sortedByRecency[0];
    
    // Generate appropriate dialogue based on how the player responded
    const templates = this.topicReferenceTemplates[selectedTopic.topic];
    let dialoguePool: string[];
    
    if (selectedTopic.responseType === 'lie') {
      dialoguePool = templates.suspicious;
    } else if (selectedTopic.responseType === 'honest' || selectedTopic.responseType === 'emotional') {
      dialoguePool = templates.sincere;
    } else {
      dialoguePool = templates.casual;
    }
    
    const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    
    // Update reference count
    selectedTopic.referencedCount++;
    selectedTopic.lastReferenced = now;
    
    console.log(`[Companion] ${companion.name} referencing past conversation about: ${selectedTopic.topic}`);
    
    return { shouldReference: true, dialogue, topic: selectedTopic.topic };
  }
  
  /**
   * Get what topics a specific companion knows about the player
   */
  getSharedTopicsForCompanion(companionId: string): SharedTopicMemory[] {
    const companion = this.companions.get(companionId);
    if (!companion) return [];
    return [...companion.conversationMemory.sharedTopics];
  }
  
  /**
   * Check if a companion knows about a specific topic
   */
  companionKnowsTopic(companionId: string, topic: ConversationTopic): boolean {
    const companion = this.companions.get(companionId);
    if (!companion) return false;
    return companion.conversationMemory.sharedTopics.some(t => t.topic === topic);
  }
  
  /**
   * Get conversation depth with a specific companion
   */
  getConversationDepth(companionId: string): number {
    const companion = this.companions.get(companionId);
    if (!companion) return 0;
    return companion.conversationMemory.conversationDepth;
  }
  
  /**
   * Force a companion to reference a specific past conversation (debug/story use)
   */
  forceConversationReference(companionId: string, topic?: ConversationTopic): string | null {
    const companion = this.companions.get(companionId);
    if (!companion) return null;
    
    const sharedTopics = companion.conversationMemory.sharedTopics;
    if (sharedTopics.length === 0) return null;
    
    let selectedTopic: SharedTopicMemory | undefined;
    
    if (topic) {
      selectedTopic = sharedTopics.find(t => t.topic === topic);
      if (!selectedTopic) return null;
    } else {
      selectedTopic = sharedTopics[Math.floor(Math.random() * sharedTopics.length)];
    }
    
    const templates = this.topicReferenceTemplates[selectedTopic.topic];
    const dialoguePool = selectedTopic.responseType === 'lie' ? templates.suspicious : templates.sincere;
    const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    
    selectedTopic.referencedCount++;
    selectedTopic.lastReferenced = Date.now();
    
    return dialogue;
  }
  
  /**
   * Generate companion's response to player confiding in them
   */
  private generateResponseToConfiding(
    companion: CompanionState, 
    type: 'honest' | 'emotional' | 'deflect' | 'lie'
  ): string {
    const responses: Record<typeof type, string[]> = {
      honest: [
        `*nods slowly* Thank you for telling me that. It means a lot that you trust me.`,
        `*listens intently* I appreciate your honesty. I feel like I understand you better now.`,
        `*touched expression* That took courage to share. I won't forget it.`,
        `*smiles warmly* Thank you. For being real with me.`,
      ],
      emotional: [
        `*reaches out gently* I had no idea you carried that with you. I'm here for you.`,
        `*eyes soften* ...Thank you for trusting me with that. It changes how I see you. In a good way.`,
        `*moved silence* I don't know what to say. Except... I'm glad you told me. I'm glad you're here.`,
        `*wipes eye* That's... that's heavy. I'm honored you shared that with me. Truly.`,
      ],
      deflect: [
        `*slight frown* Alright. I understand if you're not ready to talk about it.`,
        `*looks away* I see. Maybe another time, then.`,
        `*nods, slightly disappointed* Fair enough. When you're ready.`,
        `*pauses* ...Okay. The offer stands, if you ever want to talk.`,
      ],
      lie: [
        `*studies your face* ...Right. Sure.`,
        `*tilts head* If you say so. *seems unconvinced*`,
        `*narrows eyes briefly* I'll take your word for it. For now.`,
        `*quiet moment* Hm. Alright then.`,
      ],
    };
    
    const options = responses[type];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  /**
   * Get available bonding event types
   */
  getBondingEventTypes(): string[] {
    return Object.keys(this.bondingMomentTriggers);
  }
  
  // ========== MEMORY MANAGEMENT ==========
  
  private addMemory(
    companionId: string,
    type: CompanionMemory['type'],
    description: string,
    affinityChange: number,
    playerAction?: PlayerActionType
  ): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    
    companion.memories.push({
      timestamp: Date.now(),
      type,
      description,
      affinityChange,
      playerAction,
      forgotten: false,
    });
    
    // Keep only last 50 memories
    if (companion.memories.length > 50) {
      companion.memories.shift();
    }
  }
  
  // ========== COMPANION COMMENTARY ==========
  
  getCompanionCommentary(situation: string): { companion: CompanionState; comment: string } | null {
    // Get a random active companion who wants to speak or just has something to say
    const speakingCompanions = this.activeCompanions
      .map(id => this.companions.get(id))
      .filter((c): c is CompanionState => c !== undefined && c.status === 'active');
    
    if (speakingCompanions.length === 0) return null;
    
    // Prioritize companions who have pending reactions
    const wantsToSpeak = speakingCompanions.filter(c => c.wantsToSpeak && c.pendingReaction);
    if (wantsToSpeak.length > 0) {
      const companion = wantsToSpeak[0];
      const comment = companion.pendingReaction!;
      companion.wantsToSpeak = false;
      companion.pendingReaction = undefined;
      companion.lastSpoke = Date.now();
      return { companion, comment };
    }
    
    // Otherwise, random ambient commentary (30% chance)
    if (Math.random() < 0.3) {
      const companion = speakingCompanions[Math.floor(Math.random() * speakingCompanions.length)];
      const comment = this.generateAmbientComment(companion, situation);
      companion.lastSpoke = Date.now();
      return { companion, comment };
    }
    
    return null;
  }
  
  private generateAmbientComment(companion: CompanionState, situation: string): string {
    // 40% chance to trigger quirk-based dialogue
    if (Math.random() < 0.4 && companion.personality.quirks.length > 0) {
      return this.generateQuirkDialogue(companion);
    }
    
    // Use personality quirks and catchphrases
    const quirk = companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
    const catchphrase = companion.personality.catchphrases[
      Math.floor(Math.random() * companion.personality.catchphrases.length)
    ];
    
    const comments = [
      `*${quirk}*`,
      catchphrase,
      `This place... it reminds me of something.`,
      `Stay alert. I have a bad feeling.`,
      `*looks around curiously*`,
      `What do you make of all this?`,
    ];
    
    return comments[Math.floor(Math.random() * comments.length)];
  }
  
  /**
   * Generate dialogue that naturally incorporates a companion's personality quirk
   */
  private generateQuirkDialogue(companion: CompanionState): string {
    const quirk = companion.personality.quirks[Math.floor(Math.random() * companion.personality.quirks.length)];
    
    // Quirk-specific dialogue templates that make quirks feel natural
    const quirkDialogueTemplates: Record<string, string[]> = {
      // Nervous habits
      'polishes weapon when nervous': [
        `*absently polishes weapon* Something feels off about this place...`,
        `*running cloth over blade edge* Sorry, it helps me think.`,
        `*inspecting weapon for the third time* Old habit. Can't help it.`,
      ],
      'counts coins when idle': [
        `*jingling coins in pouch* Just making sure we're still solvent.`,
        `*stacking coins quietly* Fifty-two... fifty-three... ah, sorry, were you saying something?`,
        `*thumbing through currency* A little inventory never hurt anyone.`,
      ],
      'talks to animals': [
        `*whispering to a nearby bird* Don't mind me, just asking about the local gossip.`,
        `That stray dog says there's trouble ahead. Animals always know.`,
        `*cooing at an insect* Even the smallest creatures have stories to tell.`,
      ],
      'sleeps outside': [
        `I'll take first watch. Besides, I prefer sleeping under the stars anyway.`,
        `*looking at the sky* Nothing like open air. Walls make me feel trapped.`,
        `Don't worry about finding me a bed - I'll be out here where I belong.`,
      ],
      'stares into middle distance': [
        `*gazing at nothing in particular* ...Hmm? Oh, just thinking.`,
        `*distant look in eyes* The patterns of fate are... intricate.`,
        `*lost in thought* ...What? I was contemplating possibilities.`,
      ],
      'mutters incantations': [
        `*whispering arcane words* Just keeping the magic warm.`,
        `*lips moving silently* Old protective ward. Force of habit.`,
        `*mumbling something mystical* ...What? The words must be spoken daily or they lose power.`,
      ],
      'winks too much': [
        `*winks* Trust me on this one.`,
        `*conspiratorial wink* You know what I mean.`,
        `*double wink* I've got a plan. Don't worry about the details.`,
      ],
      'always has an exit planned': [
        `*glancing at doorways* Just noting our options. Never hurts to be prepared.`,
        `If things go south, there's a window on the east wall. Just saying.`,
        `*studying the room layout* Three exits. Two accessible. We're fine.`,
      ],
      'uncomfortable in cities': [
        `*shifting uneasily* Too many people. Too much stone. Can't breathe.`,
        `*flinching at noise* How does anyone live like this?`,
        `Let's finish our business here quickly. Cities aren't good for the soul.`,
      ],
      'never explains fully': [
        `There are... reasons. Best left unsaid.`,
        `You'll understand. Eventually. Or you won't. Either way.`,
        `*cryptic smile* Some knowledge must be earned, not given.`,
      ],
      'always faces the door': [
        `*positioning self by exit* Old training. Never let them surprise you.`,
        `*taking seat facing entrance* Habit. Can't shake it.`,
        `I'll stand here if you don't mind. Better sightlines.`,
      ],
      'never sits with back to entrance': [
        `*moving to different seat* That spot's exposed. This is safer.`,
        `No offense, but I'll take this chair. Call it paranoia.`,
        `*adjusting position* Old soldier's reflex. Saved my life more than once.`,
      ],
    };
    
    // Check if we have specific dialogue for this quirk
    for (const [quirkKey, dialogues] of Object.entries(quirkDialogueTemplates)) {
      if (quirk.toLowerCase().includes(quirkKey.toLowerCase().split(' ')[0])) {
        return dialogues[Math.floor(Math.random() * dialogues.length)];
      }
    }
    
    // Generic quirk-based dialogue for quirks without specific templates
    const genericQuirkDialogues = [
      `*${quirk}* Sorry, it's just something I do.`,
      `*${quirk}* Don't mind me.`,
      `*${quirk}* Old habit. Can't seem to shake it.`,
      `*${quirk}* It's... a thing. From before.`,
      `*${quirk}* Helps me focus, honestly.`,
    ];
    
    return genericQuirkDialogues[Math.floor(Math.random() * genericQuirkDialogues.length)];
  }
  
  /**
   * Force trigger a quirk-based comment for a specific companion
   * Can be called externally when you want to ensure quirk dialogue happens
   */
  triggerQuirkDialogue(companionId: string): { companion: CompanionState; comment: string } | null {
    const companion = this.companions.get(companionId);
    if (!companion || companion.personality.quirks.length === 0) return null;
    
    const comment = this.generateQuirkDialogue(companion);
    companion.lastSpoke = Date.now();
    return { companion, comment };
  }
  
  /**
   * Get quirk-triggered commentary from a random active companion
   * Higher chance to trigger than regular ambient comments
   */
  getQuirkCommentary(): { companion: CompanionState; comment: string } | null {
    const activeWithQuirks = this.activeCompanions
      .map(id => this.companions.get(id))
      .filter((c): c is CompanionState => 
        c !== undefined && 
        c.status === 'active' && 
        c.personality.quirks.length > 0
      );
    
    if (activeWithQuirks.length === 0) return null;
    
    const companion = activeWithQuirks[Math.floor(Math.random() * activeWithQuirks.length)];
    return this.triggerQuirkDialogue(companion.id);
  }
  
  // ========== PUBLIC GETTERS ==========
  
  getCompanion(id: string): CompanionState | undefined {
    return this.companions.get(id);
  }
  
  getActiveCompanions(): CompanionState[] {
    return this.activeCompanions
      .map(id => this.companions.get(id))
      .filter((c): c is CompanionState => c !== undefined);
  }
  
  getAllCompanions(): CompanionState[] {
    return Array.from(this.companions.values());
  }
  
  getPartySize(): { current: number; max: number } {
    return { current: this.activeCompanions.length, max: this.maxPartySize };
  }
  
  // ========== DIRECT STAT ADJUSTMENTS ==========
  
  adjustAffinity(companionId: string, amount: number): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.affinity = Math.max(-100, Math.min(100, companion.affinity + amount));
    this.updateMood(companion, amount);
    this.checkThresholds(companion);
  }
  
  adjustTrust(companionId: string, amount: number): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.trust = Math.max(0, Math.min(100, companion.trust + amount));
  }
  
  adjustRespect(companionId: string, amount: number): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.respect = Math.max(0, Math.min(100, companion.respect + amount));
  }
  
  adjustFear(companionId: string, amount: number): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.fear = Math.max(0, Math.min(100, companion.fear + amount));
  }
  
  adjustRomance(companionId: string, amount: number): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.romanticInterest = Math.max(0, Math.min(100, companion.romanticInterest + amount));
    this.checkThresholds(companion);
  }
  
  setMood(companionId: string, mood: CompanionMood): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    companion.mood = mood;
    companion.moodIntensity = 50;
  }
  
  // ========== SERIALIZATION ==========
  
  serialize(): { companions: CompanionState[]; activeIds: string[] } {
    return {
      companions: Array.from(this.companions.values()),
      activeIds: this.activeCompanions,
    };
  }
  
  deserialize(data: { companions: CompanionState[]; activeIds: string[] }): void {
    this.companions.clear();
    for (const companion of data.companions) {
      this.companions.set(companion.id, companion);
    }
    this.activeCompanions = data.activeIds;
  }
}

// Singleton export
export const companionSystem = new CompanionSystemManager();

// ============================================================================
// EVENT BUS INTEGRATION - Subscribe to game events
// ============================================================================

// Combat events
eventBus.subscribe(['COMBAT_WON'], (event) => {
  const data = (event as any).data;
  if (data?.flawlessVictory) {
    companionSystem.processPlayerAction('bravery');
  }
});

eventBus.subscribe(['COMBAT_FLED'], () => {
  companionSystem.processPlayerAction('cowardice');
});

eventBus.subscribe(['COMBAT_DEESCALATED'], () => {
  companionSystem.processPlayerAction('diplomacy');
});

// Relationship/Social events - companions react to how player treats others
eventBus.subscribe(['BETRAYAL'], () => {
  companionSystem.processPlayerAction('betrayal');
});

eventBus.subscribe(['FAVOR'], () => {
  companionSystem.processPlayerAction('loyalty');
});

eventBus.subscribe(['INSULT'], (event) => {
  const data = (event as any).data;
  // Companions notice when player insults others (30% chance to react)
  if (data && Math.random() < 0.3) {
    companionSystem.processPlayerAction('insult', `Insulted ${data.targetEntity || 'someone'}`);
  }
});

eventBus.subscribe(['COMPLIMENT'], (event) => {
  const data = (event as any).data;
  // Companions notice kindness (25% chance to react)
  if (data && Math.random() < 0.25) {
    companionSystem.processPlayerAction('compliment', `Complimented ${data.targetEntity || 'someone'}`);
  }
});

eventBus.subscribe(['ROMANCE_PROGRESSED'], (event) => {
  const data = (event as any).data;
  // Companions may react to romance with others (jealousy/approval)
  if (data && Math.random() < 0.4) {
    companionSystem.processPlayerAction('romance_flirt', `Romanced ${data.targetEntity || 'someone'}`);
  }
});

// Item events - companions react to theft, charity
eventBus.subscribe(['ITEM_STOLEN'], (event) => {
  const data = (event as any).data;
  // Companions notice theft (50% chance)
  if (data?.toEntity === 'player' && Math.random() < 0.5) {
    companionSystem.processPlayerAction('theft', `Stole from ${data.fromEntity || 'someone'}`);
  }
});

eventBus.subscribe(['ITEM_GIFTED'], (event) => {
  const data = (event as any).data;
  // Companions notice generosity (40% chance)
  if (data?.fromEntity === 'player' && Math.random() < 0.4) {
    companionSystem.processPlayerAction('charity', `Gave gift to ${data.toEntity || 'someone'}`);
  }
});

// Location events - companions may comment on new places
eventBus.subscribe(['LOCATION_ENTERED'], (event) => {
  const data = (event as any).data;
  // 20% chance for ambient location commentary
  if (data && Math.random() < 0.2) {
    const companions = companionSystem.getActiveCompanions();
    if (companions.length > 0) {
      const companion = companions[Math.floor(Math.random() * companions.length)];
      companion.wantsToSpeak = true;
      companion.pendingReaction = generateLocationReaction(companion, data.location);
    }
  }
});

// Death/knockout - serious events companions always notice
eventBus.subscribe(['DEATH'], (event) => {
  const data = (event as any).data;
  if (data?.sourceEntity === 'player') {
    companionSystem.processPlayerAction('combat_kill', `Killed ${data.targetEntity || 'someone'}`);
  }
});

// Quest events - companions comment on progress
eventBus.subscribe(['QUEST_COMPLETED'], (event) => {
  const data = (event as any).data;
  if (Math.random() < 0.6) {
    const companions = companionSystem.getActiveCompanions();
    if (companions.length > 0) {
      const companion = companions[Math.floor(Math.random() * companions.length)];
      companion.wantsToSpeak = true;
      companion.pendingReaction = generateQuestReaction(companion, 'completed');
    }
  }
});

// Helper functions for autonomous reactions
function generateLocationReaction(companion: CompanionState, location: string): string {
  const reactions = [
    `*looks around ${location || 'this place'}* Hmm, interesting...`,
    `I've heard stories about places like this.`,
    `Stay alert. Something feels... different here.`,
    `*${companion.personality.quirks[0] || 'looks around curiously'}*`,
    `This reminds me of somewhere from my past.`,
  ];
  return reactions[Math.floor(Math.random() * reactions.length)];
}

function generateQuestReaction(companion: CompanionState, type: 'completed' | 'failed'): string {
  if (type === 'completed') {
    const reactions = [
      `Well done! That's another success for us.`,
      `I knew we could do it together.`,
      `*nods approvingly* Good work.`,
      companion.personality.catchphrases[0] || `Excellent.`,
    ];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  return `We'll do better next time.`;
}

console.log('[CompanionSystem] Initialized with enhanced event reactions');
