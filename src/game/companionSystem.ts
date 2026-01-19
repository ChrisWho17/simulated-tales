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

export type SituationType = 
  | 'combat_start' | 'combat_losing' | 'combat_won' | 'near_death'
  | 'difficult_choice' | 'moral_dilemma' | 'negotiation' | 'intimidation'
  | 'emotional_moment' | 'failure' | 'success' | 'danger_ahead'
  | 'meeting_stranger' | 'facing_enemy' | 'moment_of_doubt' | 'celebration';

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
  
  /**
   * Register a fully-formed companion state directly.
   * Use this when you have a complete CompanionState object (e.g., from cheat mode).
   */
  registerCompanion(companion: CompanionState): void {
    // Enforce companion limit
    if (this.companions.size >= this.maxTotalCompanions) {
      const inactiveCompanions = Array.from(this.companions.entries())
        .filter(([cid]) => !this.activeCompanions.includes(cid))
        .sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      
      if (inactiveCompanions.length > 0) {
        this.companions.delete(inactiveCompanions[0][0]);
        console.log(`[Companion] Removed oldest inactive companion to make room`);
      }
    }
    
    this.companions.set(companion.id, companion);
    console.log(`[Companion] Registered: ${companion.name} (${companion.id})`);
  }
  
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
  
  // ========== UNKNOWN TOPIC CURIOSITY SYSTEM ==========
  // Companions express curiosity about things they DON'T know about the player
  
  /**
   * Templates for when companions express curiosity about topics they haven't asked about
   */
  private unknownTopicCuriosityTemplates: Record<ConversationTopic, {
    musing: string[];  // Wondering aloud
    direct: string[];  // More direct expressions
    wistful: string[]; // Longing to know
  }> = {
    dreams: {
      musing: [
        `*glances at you* I wonder sometimes... what did you want to be when you were young?`,
        `*thoughtful* We've been through so much, but I still don't know what you dreamed of becoming.`,
        `*quietly* Everyone has dreams. I wish I knew yours.`,
      ],
      direct: [
        `You know, you've never told me about your dreams. The real ones.`,
        `*curious* What did you imagine your life would be like?`,
      ],
      wistful: [
        `*gazes into distance* I wonder what you dreamed of, before all this...`,
        `Sometimes I try to picture you as a child, dreaming of the future. But I can't.`,
      ],
    },
    relationships: {
      musing: [
        `*hesitant* Is there... anyone waiting for you somewhere? You never say.`,
        `*wondering* I know so little about the people in your life. Before me, I mean.`,
        `*quietly* Do you have family? Someone special? I've never asked.`,
      ],
      direct: [
        `We've been traveling together, but I don't even know if you have someone back home.`,
        `*carefully* Tell me about your people. If you have any.`,
      ],
      wistful: [
        `*soft sigh* I wish I knew about the people who shaped you.`,
        `Sometimes I feel like I'm traveling with a mystery. Who matters to you?`,
      ],
    },
    memories: {
      musing: [
        `*pensive* What's your happiest memory? I've never thought to ask.`,
        `*watching you* Everyone carries a golden memory. What's yours?`,
        `I wonder what moment you hold onto when things get dark...`,
      ],
      direct: [
        `Tell me something good. Your happiest memory. I want to know.`,
        `*curious* What's the one memory that makes you smile?`,
      ],
      wistful: [
        `*wistful* I'd give a lot to see you truly happy. To know what that looks like for you.`,
        `I imagine you have moments of pure joy in your past. I wish you'd share one.`,
      ],
    },
    fears: {
      musing: [
        `*observing* You're brave. But everyone fears something. I wonder what haunts you.`,
        `*quiet* What keeps you up at night? You've never told me.`,
        `We all have shadows. I wish I knew yours.`,
      ],
      direct: [
        `What are you afraid of? Really afraid of?`,
        `*serious* I should know what scares you. In case I need to protect you from it.`,
      ],
      wistful: [
        `*concerned* I want to understand your fears. So I can stand with you against them.`,
        `Sometimes I see something in your eyes. Fear, maybe. I wish you'd tell me.`,
      ],
    },
    future: {
      musing: [
        `*curious* If this was all over tomorrow... what would you do?`,
        `*wondering* I don't know what you want from life. After all this ends.`,
        `Where do you see yourself when the dust settles?`,
      ],
      direct: [
        `What's the plan? After we're done here. You've never said.`,
        `*tilts head* Do you have a future in mind? Or are you just surviving?`,
      ],
      wistful: [
        `*hopeful* I'd like to imagine your future. If you'd let me in on it.`,
        `Sometimes I wonder if there's a place for me in whatever comes next for you.`,
      ],
    },
    loss: {
      musing: [
        `*gentle* Have you lost someone? You carry a weight I don't understand.`,
        `*observing* There's grief in you. I can sense it. But I don't know the shape of it.`,
        `We've never talked about who you've lost. I wonder about that.`,
      ],
      direct: [
        `Who did you lose? I see it in you sometimes.`,
        `*soft* You don't have to tell me. But if you've lost someone... I'm here.`,
      ],
      wistful: [
        `*sad* I wish I knew who you mourn. So I could mourn them too.`,
        `Loss changes people. I want to understand how it changed you.`,
      ],
    },
    origin: {
      musing: [
        `*curious* How did you become... this? I don't know your story.`,
        `*thoughtful* Everyone has an origin. A moment that made them. What was yours?`,
        `I wonder what path led you here, to this moment with me.`,
      ],
      direct: [
        `Where did you come from? Not the place—the person. How did you become you?`,
        `*interested* Tell me about your beginning. I want to understand.`,
      ],
      wistful: [
        `*musing* I wish I could have seen you become who you are.`,
        `Your past is a mystery to me. And I find myself wanting to solve it.`,
      ],
    },
    philosophy: {
      musing: [
        `*philosophical* Do you believe in fate? Or do we carve our own path? You've never said.`,
        `*pondering* I wonder what you believe. About life, about meaning.`,
        `We've never had that conversation. The big one. About what it all means.`,
      ],
      direct: [
        `What do you believe in? Really believe in?`,
        `*curious* Are we in control, or are we just along for the ride? What do you think?`,
      ],
      wistful: [
        `*contemplative* I'd love to know how you see the world. The philosophy of you.`,
        `Sometimes I try to guess your beliefs. But I'd rather you just told me.`,
      ],
    },
    secrets: {
      musing: [
        `*quiet* Everyone has secrets. I wonder what yours are.`,
        `*thoughtful* There's something you're not telling me. I can feel it.`,
        `We're close now. But there are still walls. Things you haven't shared.`,
      ],
      direct: [
        `What haven't you told me? What's the thing you keep locked away?`,
        `*earnest* I've shared my secrets. Don't you have any for me?`,
      ],
      wistful: [
        `*longing* I want to know all of you. Even the parts you hide.`,
        `Trust takes time. I hope someday you'll share your secrets with me.`,
      ],
    },
    regrets: {
      musing: [
        `*reflective* Do you have regrets? Things you'd do differently?`,
        `*wondering* I wonder what choices haunt you. If any do.`,
        `Nobody gets through life without regrets. What are yours?`,
      ],
      direct: [
        `What do you regret? Don't tell me 'nothing.' Everyone regrets something.`,
        `*searching* If you could go back and change one thing... what would it be?`,
      ],
      wistful: [
        `*gentle* I want to know your regrets. So I can help you carry them.`,
        `Regret is heavy. I wish you'd let me help with the weight.`,
      ],
    },
    motivation: {
      musing: [
        `*curious* What keeps you going? I've never quite figured it out.`,
        `*watching* You push forward no matter what. But I don't know why.`,
        `Everyone needs a reason. I wonder what yours is.`,
      ],
      direct: [
        `Why do you fight? What's driving you?`,
        `*earnest* I need to know what motivates you. It matters to me.`,
      ],
      wistful: [
        `*admiring* You have a fire in you. I wish I knew what lit it.`,
        `Understanding your motivation... that would tell me so much about you.`,
      ],
    },
    love: {
      musing: [
        `*hesitant* Have you ever been in love? You never talk about it.`,
        `*wondering* I wonder what your heart has been through.`,
        `Love changes everyone. I wish I knew how it changed you.`,
      ],
      direct: [
        `Have you loved someone? Really loved them?`,
        `*curious* Tell me about love. Your experience of it.`,
      ],
      wistful: [
        `*softly* I want to know your heart. The parts you protect most.`,
        `Love is the deepest part of us. Someday I hope you'll share that with me.`,
      ],
    },
    courage: {
      musing: [
        `*impressed* You're brave. But what's the bravest thing you've ever done?`,
        `*curious* Everyone has a moment of true courage. What was yours?`,
        `I've seen your bravery. But I wonder what tested it most.`,
      ],
      direct: [
        `Tell me about your bravest moment. I want to know.`,
        `*respectful* What's the hardest thing you've ever faced? And how did you face it?`,
      ],
      wistful: [
        `*admiring* I wish I'd seen you at your bravest. Before we met.`,
        `Your courage inspires me. I want to know where it comes from.`,
      ],
    },
    peace: {
      musing: [
        `*soft* What brings you peace? I've never asked.`,
        `*curious* We live in chaos. But everyone needs calm. What's yours?`,
        `I wonder what quiets your mind. What gives you rest.`,
      ],
      direct: [
        `What calms you? Where do you find peace?`,
        `*genuine* Tell me what brings you serenity. I want to help you find more of it.`,
      ],
      wistful: [
        `*gentle* I want to give you peace. But I don't know what that looks like for you.`,
        `Someday, I hope to see you truly at rest. And know what brought you there.`,
      ],
    },
    wanderlust: {
      musing: [
        `*dreamily* If you could go anywhere... where would it be?`,
        `*wondering* Is there a place you dream of? Somewhere you've always wanted to go?`,
        `We travel so much. But I don't know where you'd choose to be.`,
      ],
      direct: [
        `Where's your dream destination? If you could pick anywhere.`,
        `*curious* What place calls to you? I want to know.`,
      ],
      wistful: [
        `*hopeful* Maybe someday we'll go somewhere you've always dreamed of.`,
        `I'd love to see your eyes light up at a place you've always wanted to visit.`,
      ],
    },
  };
  
  /**
   * Check if a companion should express curiosity about an unknown topic
   * Only triggers for topics they HAVEN'T asked about yet
   */
  checkForUnknownTopicCuriosity(
    companionId: string
  ): { shouldExpress: boolean; dialogue: string; topic: ConversationTopic } | null {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') return null;
    
    // Require healthy relationship for this intimate curiosity
    if (companion.affinity < 20 || companion.trust < 30) return null;
    if (companion.fear > 40) return null; // Afraid companions don't probe
    
    // All possible topics
    const allTopics: ConversationTopic[] = [
      'dreams', 'relationships', 'memories', 'fears', 'future',
      'loss', 'origin', 'philosophy', 'secrets', 'regrets',
      'motivation', 'love', 'courage', 'peace', 'wanderlust'
    ];
    
    // Filter to topics this companion hasn't asked about or had shared
    const askedTopics = companion.conversationMemory.askedTopics;
    const sharedTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
    const knownTopics = [...new Set([...askedTopics, ...sharedTopics])];
    
    const unknownTopics = allTopics.filter(t => !knownTopics.includes(t));
    
    if (unknownTopics.length === 0) return null; // They know everything!
    
    // Probability based on relationship depth and how much they already know
    // More curious when they know some things but not all
    const knowledgeRatio = knownTopics.length / allTopics.length;
    let curiosityChance = 0.08; // Base 8%
    
    // Curiosity peaks at 30-60% knowledge
    if (knowledgeRatio > 0.3 && knowledgeRatio < 0.6) {
      curiosityChance = 0.15; // They know enough to want more
    } else if (knowledgeRatio >= 0.6) {
      curiosityChance = 0.20; // They're close, want to know everything
    }
    
    // Higher trust = more curiosity
    if (companion.trust >= 60) curiosityChance += 0.05;
    
    if (Math.random() > curiosityChance) return null;
    
    // Select a topic to be curious about
    const selectedTopic = unknownTopics[Math.floor(Math.random() * unknownTopics.length)];
    
    // Choose dialogue style based on companion mood and personality
    const templates = this.unknownTopicCuriosityTemplates[selectedTopic];
    let dialoguePool: string[];
    
    // Romantic companions tend to be more wistful
    if (companion.romanticInterest > 40) {
      dialoguePool = templates.wistful;
    } else if (companion.trust >= 60) {
      // High trust = more direct
      dialoguePool = Math.random() < 0.6 ? templates.direct : templates.musing;
    } else {
      // Default to musing (wondering aloud)
      dialoguePool = templates.musing;
    }
    
    const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    
    console.log(`[Companion] ${companion.name} expressing curiosity about unknown topic: ${selectedTopic}`);
    
    return { shouldExpress: true, dialogue, topic: selectedTopic };
  }
  
  /**
   * Get topics a companion doesn't know about yet
   */
  getUnknownTopicsForCompanion(companionId: string): ConversationTopic[] {
    const companion = this.companions.get(companionId);
    if (!companion) return [];
    
    const allTopics: ConversationTopic[] = [
      'dreams', 'relationships', 'memories', 'fears', 'future',
      'loss', 'origin', 'philosophy', 'secrets', 'regrets',
      'motivation', 'love', 'courage', 'peace', 'wanderlust'
    ];
    
    const askedTopics = companion.conversationMemory.askedTopics;
    const sharedTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
    const knownTopics = [...new Set([...askedTopics, ...sharedTopics])];
    
    return allTopics.filter(t => !knownTopics.includes(t));
  }
  
  /**
   * Get a companion's "knowledge percentage" about the player
   */
  getPlayerKnowledgePercentage(companionId: string): number {
    const companion = this.companions.get(companionId);
    if (!companion) return 0;
    
    const allTopics = 15; // Total number of personal topics
    const askedTopics = companion.conversationMemory.askedTopics.length;
    const sharedTopics = companion.conversationMemory.sharedTopics.length;
    const knownCount = new Set([
      ...companion.conversationMemory.askedTopics,
      ...companion.conversationMemory.sharedTopics.map(t => t.topic)
    ]).size;
    
    return Math.round((knownCount / allTopics) * 100);
  }
  
  // ========== KNOWLEDGE-BASED CONTEXTUAL SUPPORT SYSTEM ==========
  // Companions use their knowledge about the player to offer advice, help, or (if hostile) use it against them
  
  // SituationType defined at module level - see line ~85
  
  /**
   * Context-aware support templates based on what the companion knows about the player
   */
  private contextualSupportTemplates: Record<ConversationTopic, {
    supportive: Record<SituationType, string[]>;  // Positive affinity - helpful
    hostile: Record<SituationType, string[]>;     // Negative affinity - uses knowledge against player
  }> = {
    dreams: {
      supportive: {
        combat_start: [`Remember what you're fighting for. Those dreams don't die here.`],
        combat_losing: [`Don't give up! You told me about your dreams—they need you alive!`],
        combat_won: [`One step closer to those dreams you told me about.`],
        near_death: [`Stay with me! Your dreams... they're still waiting for you.`],
        difficult_choice: [`Think about what young you would've wanted. The one who dreamed big.`],
        moral_dilemma: [`Would achieving your dreams this way even matter?`],
        negotiation: [`Remember what you're building toward. Don't sell yourself short.`],
        intimidation: [`They don't know what you've dreamed of becoming. Show them.`],
        emotional_moment: [`*softly* I know what you dreamed of. This moment matters.`],
        failure: [`Dreams don't die from one setback. You taught me that.`],
        success: [`Look at you. Getting closer to everything you ever wanted.`],
        danger_ahead: [`Your dreams are on the other side of this. Let's go.`],
        meeting_stranger: [`Be careful—not everyone deserves to know about your aspirations.`],
        facing_enemy: [`They can't take your dreams from you. Not unless you let them.`],
        moment_of_doubt: [`I remember what you told me about your dreams. They're worth fighting for.`],
        celebration: [`You earned this. One step closer to that dream you shared with me.`],
      },
      hostile: {
        combat_start: [`Still chasing those childish dreams? Let's see how that works out.`],
        combat_losing: [`Maybe those dreams of yours were always just fantasy.`],
        combat_won: [`Lucky. But you're still no closer to what you actually want.`],
        near_death: [`Dying here... so much for those big dreams, huh?`],
        difficult_choice: [`*mocking* What would your 'dreamer' self think of you now?`],
        moral_dilemma: [`Your dreams always were built on sand.`],
        negotiation: [`You're not the person you pretend to dream of being.`],
        intimidation: [`I know what you really want. It's pathetic.`],
        emotional_moment: [`*cold* Those dreams you told me about? They were always foolish.`],
        failure: [`Dreams crumbling. How predictable.`],
        success: [`Enjoy it. We both know it won't last.`],
        danger_ahead: [`Run toward your dreams. Maybe they'll kill you.`],
        meeting_stranger: [`Careful—they might see through you like I did.`],
        facing_enemy: [`I told them what you dream of. They found it amusing.`],
        moment_of_doubt: [`*cruel smile* Those dreams I heard about? You were never good enough.`],
        celebration: [`Celebrating? You're still the same failure with delusions.`],
      },
    },
    fears: {
      supportive: {
        combat_start: [`I know what scares you. This isn't it. You've got this.`],
        combat_losing: [`I remember your fears—this isn't how you fall. Fight back!`],
        combat_won: [`You faced your fear and won. I'm proud of you.`],
        near_death: [`Don't let fear take you now. Breathe. I'm right here.`],
        difficult_choice: [`I know what you're afraid of. Let that guide you away from the wrong path.`],
        moral_dilemma: [`Your fear of becoming something dark... let it protect you now.`],
        negotiation: [`Don't show your fear. I know it's there, but hide it.`],
        intimidation: [`They can't hurt you worse than what you already fear. Use that.`],
        emotional_moment: [`*gently* I know your fears. You don't have to hide them from me.`],
        failure: [`Failure isn't what you truly fear. Get back up.`],
        success: [`You conquered something scarier than this. Well done.`],
        danger_ahead: [`I know this triggers something in you. Breathe. I'm with you.`],
        meeting_stranger: [`Stay calm. Not everyone is a threat.`],
        facing_enemy: [`I know what haunts you. This enemy isn't it. Focus.`],
        moment_of_doubt: [`Your fears are real, but so is your strength. I've seen both.`],
        celebration: [`You deserve to feel safe. Even just for tonight.`],
      },
      hostile: {
        combat_start: [`*cold* I know exactly what terrifies you. Maybe I should tell them.`],
        combat_losing: [`This must feel like your worst nightmare. *smirks* Good.`],
        combat_won: [`You won, but that fear I know about? Still waiting.`],
        near_death: [`*cruel* Dying alone. Isn't that what you told me you feared most?`],
        difficult_choice: [`Choose wrong and face everything you're afraid of.`],
        moral_dilemma: [`Your fears make you weak. This proves it.`],
        negotiation: [`I could mention what you're really afraid of. They'd love to know.`],
        intimidation: [`I know your fears. Don't make me share them.`],
        emotional_moment: [`*mocking* You told me your fears once. Foolish.`],
        failure: [`This is what fear does. Makes you fail. Predictable.`],
        success: [`Success doesn't erase what haunts you.`],
        danger_ahead: [`This looks a lot like what you told me terrifies you...`],
        meeting_stranger: [`Should I tell them what scares you? Could be useful.`],
        facing_enemy: [`I told them your fears. They're... creative with that information.`],
        moment_of_doubt: [`*cruel* Your fears are written all over your face. Pathetic.`],
        celebration: [`Celebrate while you can. Your fears are still out there.`],
      },
    },
    loss: {
      supportive: {
        combat_start: [`Fight for those you've lost. Honor them.`],
        combat_losing: [`You survived losing everything once. You'll survive this.`],
        combat_won: [`Victory. For everyone we've lost along the way.`],
        near_death: [`Stay! The ones you lost—they're not waiting for you yet.`],
        difficult_choice: [`What would they have wanted? The ones you lost?`],
        moral_dilemma: [`I know you've lost people. Don't lose yourself too.`],
        negotiation: [`You've lost before. Don't give away more than you have to.`],
        intimidation: [`You've survived worse losses than anything they can threaten.`],
        emotional_moment: [`*touches your arm* I know about your loss. I'm here.`],
        failure: [`Loss taught you resilience. Use it now.`],
        success: [`I hope somewhere, they're proud of you.`],
        danger_ahead: [`You've lost so much. Don't add to that list today.`],
        meeting_stranger: [`Not everyone will leave you. Give them a chance.`],
        facing_enemy: [`For everyone you've lost—make this count.`],
        moment_of_doubt: [`You carry your losses with dignity. Keep going.`],
        celebration: [`They'd want you to be happy. Even without them.`],
      },
      hostile: {
        combat_start: [`Think of everyone you've lost. Maybe you'll join them.`],
        combat_losing: [`Losing again. It's what you do, isn't it?`],
        combat_won: [`Won the fight. But still alone, aren't you?`],
        near_death: [`*cold* The ones you lost are waiting. Don't keep them.`],
        difficult_choice: [`Your judgment got people killed before. Choose wisely.`],
        moral_dilemma: [`The people you lost... maybe they died because of choices like this.`],
        negotiation: [`You've lost everything before. What's a little more?`],
        intimidation: [`I know about your losses. Want me to add to them?`],
        emotional_moment: [`*mocking* Still grieving? How touching.`],
        failure: [`Another loss. You're collecting them.`],
        success: [`They're not here to see it. That must sting.`],
        danger_ahead: [`More chances to lose people. Exciting for you.`],
        meeting_stranger: [`Everyone leaves you eventually. Or dies.`],
        facing_enemy: [`I told them about your losses. They know your weak points now.`],
        moment_of_doubt: [`The ghosts of your losses are heavy, aren't they?`],
        celebration: [`Celebrating alone. As usual.`],
      },
    },
    motivation: {
      supportive: {
        combat_start: [`Remember why you fight. Hold onto that.`],
        combat_losing: [`Your reason for fighting—focus on it! Don't quit!`],
        combat_won: [`That's what fighting for something real looks like.`],
        near_death: [`Your purpose isn't finished! Stay with me!`],
        difficult_choice: [`What drives you? Let that decide this.`],
        moral_dilemma: [`Stay true to what motivates you. That's your compass.`],
        negotiation: [`Know your worth. You have purpose. Act like it.`],
        intimidation: [`You have something worth fighting for. Let them see that fire.`],
        emotional_moment: [`*warmly* I know what keeps you going. I admire it.`],
        failure: [`Your motivation doesn't vanish with one failure.`],
        success: [`This is why you keep pushing. Look what it earned you.`],
        danger_ahead: [`What you're fighting for is on the other side. Push through.`],
        meeting_stranger: [`Stay grounded in your purpose. Don't get distracted.`],
        facing_enemy: [`They don't have what you have—true motivation.`],
        moment_of_doubt: [`I know why you fight. It's still worth it. Trust me.`],
        celebration: [`You earned this. Your drive made it happen.`],
      },
      hostile: {
        combat_start: [`Fighting for that pathetic 'motivation' of yours?`],
        combat_losing: [`Your motivation wasn't strong enough. Clearly.`],
        combat_won: [`Your 'purpose' won. For now.`],
        near_death: [`*bitter* That motivation you bragged about? Useless now.`],
        difficult_choice: [`Your motivations are selfish. We both know it.`],
        moral_dilemma: [`What drives you is darkness. This proves it.`],
        negotiation: [`I know what you really want. It's not noble.`],
        intimidation: [`I could tell them what really motivates you. The ugly truth.`],
        emotional_moment: [`*cold* Your 'purpose' is a lie you tell yourself.`],
        failure: [`Your motivation led you here. To failure.`],
        success: [`Success doesn't purify your motives.`],
        danger_ahead: [`Running toward danger for your 'cause.' Predictable.`],
        meeting_stranger: [`They'd be disgusted if they knew what really drives you.`],
        facing_enemy: [`I told them your real motivations. They laughed.`],
        moment_of_doubt: [`Doubt is fitting. Your motivations were always questionable.`],
        celebration: [`Celebrating a hollow victory for hollow reasons.`],
      },
    },
    courage: {
      supportive: {
        combat_start: [`You've been braver than this before. You told me. Channel it.`],
        combat_losing: [`Remember your bravest moment—this is another one. Fight!`],
        combat_won: [`Courage wins again. Just like you told me it did before.`],
        near_death: [`The bravest thing you ever did—do it again. Live.`],
        difficult_choice: [`Be as brave now as you were then. You have it in you.`],
        moral_dilemma: [`Courage isn't just physical. Show it here.`],
        negotiation: [`Stand tall. You've faced worse and won.`],
        intimidation: [`You've been brave before. Let them see that same fire.`],
        emotional_moment: [`*proud* I've seen your courage. It's real.`],
        failure: [`Even the bravest fail. It's getting back up that matters.`],
        success: [`That's the courage I knew was in you.`],
        danger_ahead: [`You've done brave things before. One more won't hurt.`],
        meeting_stranger: [`Be confident. You've earned the right to be.`],
        facing_enemy: [`You're braver than they know. I know the stories.`],
        moment_of_doubt: [`You told me about your courage. Don't forget it now.`],
        celebration: [`To bravery—yours especially.`],
      },
      hostile: {
        combat_start: [`Let's see if you're as brave as you claimed.`],
        combat_losing: [`Where's that 'courage' you bragged about?`],
        combat_won: [`Lucky. Not brave.`],
        near_death: [`*sneering* Not so brave now, are you?`],
        difficult_choice: [`Your so-called 'courage' is just recklessness.`],
        moral_dilemma: [`Coward in a brave person's costume.`],
        negotiation: [`I know you're not as brave as you pretend.`],
        intimidation: [`That 'bravest moment' you told me about? I have my doubts.`],
        emotional_moment: [`*mocking* The 'brave' hero, feeling fragile.`],
        failure: [`Failure suits you better than fake courage.`],
        success: [`Courage? Or just dumb luck?`],
        danger_ahead: [`Go on, be 'brave.' See where it gets you.`],
        meeting_stranger: [`They'll see through your brave act eventually.`],
        facing_enemy: [`I told them you're not as courageous as you seem.`],
        moment_of_doubt: [`Doubt is honest. Your 'courage' wasn't.`],
        celebration: [`Celebrating borrowed courage.`],
      },
    },
    love: {
      supportive: {
        combat_start: [`Love gives you something to protect. Use it.`],
        combat_losing: [`Think of love—fight for it!`],
        combat_won: [`Love won today. Your kind of love.`],
        near_death: [`Love is waiting for you. Don't go yet.`],
        difficult_choice: [`What would love tell you to do?`],
        moral_dilemma: [`Let love guide you. Not anger.`],
        negotiation: [`You know what love means. Fight for what matters.`],
        intimidation: [`You've loved deeply. That makes you stronger, not weaker.`],
        emotional_moment: [`*gently* I know about love in your life. It shows.`],
        failure: [`Love survives failure. So will you.`],
        success: [`Love brought you here. Remember that.`],
        danger_ahead: [`Love is worth facing danger for.`],
        meeting_stranger: [`Your capacity for love is a strength. Don't hide it.`],
        facing_enemy: [`They can't understand what love gives you.`],
        moment_of_doubt: [`Love is real. You told me. Hold onto that.`],
        celebration: [`To love—past, present, and future.`],
      },
      hostile: {
        combat_start: [`*cold* Fighting for love? How pathetic.`],
        combat_losing: [`Love can't save you now.`],
        combat_won: [`Love won? Or violence did?`],
        near_death: [`*cruel* Maybe the ones you loved will mourn. Briefly.`],
        difficult_choice: [`Love makes you weak. This proves it.`],
        moral_dilemma: [`Love clouds judgment. Like now.`],
        negotiation: [`I know what you love. Easy leverage.`],
        intimidation: [`Threaten what you love? Don't tempt me.`],
        emotional_moment: [`*mocking* Love. So fragile. So exploitable.`],
        failure: [`Love didn't protect you from failure.`],
        success: [`Success won't bring back what you loved.`],
        danger_ahead: [`Love makes you careless. Perfect.`],
        meeting_stranger: [`Love blinds you to threats.`],
        facing_enemy: [`I told them who you love. They took notes.`],
        moment_of_doubt: [`Love is doubt's favorite weapon.`],
        celebration: [`Love is a cage. Celebrate inside it.`],
      },
    },
    secrets: {
      supportive: {
        combat_start: [`Your secrets are safe with me. Focus on the fight.`],
        combat_losing: [`I know things about you. Fight like they matter!`],
        combat_won: [`Your secrets helped make you who you are. And you won.`],
        near_death: [`Your secrets—I'll protect them. But you have to live.`],
        difficult_choice: [`I know your secrets. This choice is yours alone.`],
        moral_dilemma: [`Your secret self knows the answer. Listen to it.`],
        negotiation: [`I'll never betray your confidence. Use that trust.`],
        intimidation: [`They don't know what I know about you. That's power.`],
        emotional_moment: [`*loyal* Your secrets are safe. Always.`],
        failure: [`Your secrets don't make you a failure. This moment doesn't either.`],
        success: [`Success, and your secrets remain yours.`],
        danger_ahead: [`I'll guard what you've shared with my life.`],
        meeting_stranger: [`Be careful what you reveal. Trust is earned.`],
        facing_enemy: [`They know nothing about the real you. Advantage: ours.`],
        moment_of_doubt: [`Your secrets are part of you. And I accept you.`],
        celebration: [`To secrets kept—and trust honored.`],
      },
      hostile: {
        combat_start: [`*threatening* Fight well, or your secrets might slip out.`],
        combat_losing: [`Losing? Maybe your secrets will be next.`],
        combat_won: [`Won the fight. But your secrets? Still vulnerable.`],
        near_death: [`*cold* Die here and your secrets die with you. Maybe.`],
        difficult_choice: [`Choose wisely, or I might reveal something.`],
        moral_dilemma: [`Decisions have consequences. So do secrets.`],
        negotiation: [`I could mention what you told me in confidence...`],
        intimidation: [`I know your secrets. *smiles* Valuable currency.`],
        emotional_moment: [`*dangerous* Remember what you trusted me with.`],
        failure: [`Failed. What else will you lose? Your secrets, maybe?`],
        success: [`Success. But your secrets are still mine to hold.`],
        danger_ahead: [`Secrets have a way of coming out in dangerous times.`],
        meeting_stranger: [`Interesting new friend. Should I share what I know?`],
        facing_enemy: [`I told them your secrets. Information is power.`],
        moment_of_doubt: [`*cruel* Your secrets weigh on you. I can tell.`],
        celebration: [`Celebrate. While your secrets are still secret.`],
      },
    },
    regrets: {
      supportive: {
        combat_start: [`No new regrets today. Fight clean.`],
        combat_losing: [`Don't add 'giving up' to your regrets!`],
        combat_won: [`No regrets here. You did what you had to.`],
        near_death: [`Live—so you can make peace with your regrets.`],
        difficult_choice: [`Make the choice you won't regret. You know what that is.`],
        moral_dilemma: [`Learn from old regrets. Don't create new ones.`],
        negotiation: [`No regrets. Stand your ground.`],
        intimidation: [`You've faced regret before. This is nothing.`],
        emotional_moment: [`*understanding* I know your regrets. They don't define you.`],
        failure: [`Regret is for things we don't try to fix. Try again.`],
        success: [`One less thing to regret.`],
        danger_ahead: [`Face this. Regret living small, not dying brave.`],
        meeting_stranger: [`New people. New chances. Fewer regrets.`],
        facing_enemy: [`Don't let them add to your regrets.`],
        moment_of_doubt: [`Your regrets taught you wisdom. Use it.`],
        celebration: [`To no regrets—or at least fewer.`],
      },
      hostile: {
        combat_start: [`Add another regret to the pile.`],
        combat_losing: [`This will be a regret. If you survive.`],
        combat_won: [`Won. But regrets pile up regardless.`],
        near_death: [`*cold* Die with your regrets then.`],
        difficult_choice: [`Either choice will add to your regrets.`],
        moral_dilemma: [`You'll regret this. Either way.`],
        negotiation: [`Regret is coming. I can smell it.`],
        intimidation: [`I know your regrets. Want them public?`],
        emotional_moment: [`*mocking* Drowning in regret as usual.`],
        failure: [`Another regret. Predictable.`],
        success: [`Success doesn't erase what you regret.`],
        danger_ahead: [`More chances for regret. Your specialty.`],
        meeting_stranger: [`They'll become a regret eventually.`],
        facing_enemy: [`I mentioned your regrets to them. They were amused.`],
        moment_of_doubt: [`Doubt and regret. Your constant companions.`],
        celebration: [`Celebrating while buried in regrets.`],
      },
    },
    origin: {
      supportive: {
        combat_start: [`Remember where you came from. Fight like it matters.`],
        combat_losing: [`You've overcome your past before. Do it again!`],
        combat_won: [`Your origin forged you for this. Well done.`],
        near_death: [`Your story isn't over. You came from nothing—survive this.`],
        difficult_choice: [`Think of your journey. What would that person choose?`],
        moral_dilemma: [`Your origin taught you values. Use them.`],
        negotiation: [`You know hardship. Don't settle for less than you're worth.`],
        intimidation: [`Your past made you strong. Show them.`],
        emotional_moment: [`*respectful* Knowing where you're from... I understand you.`],
        failure: [`You've risen from worse beginnings.`],
        success: [`Look how far you've come from where you started.`],
        danger_ahead: [`Your origin prepared you for this. Let's go.`],
        meeting_stranger: [`Your past made you who you are. Trust that.`],
        facing_enemy: [`They don't know your story. That's your advantage.`],
        moment_of_doubt: [`You became you despite your origin. That's strength.`],
        celebration: [`To growth—and to how far you've come.`],
      },
      hostile: {
        combat_start: [`Let's see if your 'origin' prepared you for this.`],
        combat_losing: [`Your origin made you weak. Clearly.`],
        combat_won: [`You escaped your origins. For now.`],
        near_death: [`*cruel* Dying far from where you started. Fitting.`],
        difficult_choice: [`Your origin explains this. Poor judgment is genetic.`],
        moral_dilemma: [`Can't escape where you came from, can you?`],
        negotiation: [`I know where you're from. *smirks* Humble beginnings.`],
        intimidation: [`Your origin story is... unimpressive.`],
        emotional_moment: [`*dismissive* Your origin is a weakness.`],
        failure: [`Back to your origins. The gutter.`],
        success: [`Polish doesn't hide origins.`],
        danger_ahead: [`Your origins didn't prepare you for this.`],
        meeting_stranger: [`Should I tell them where you really came from?`],
        facing_enemy: [`I told them your origin. They laughed.`],
        moment_of_doubt: [`Doubt is your birthright. Embrace it.`],
        celebration: [`Celebrating like you're not still who you were.`],
      },
    },
    relationships: {
      supportive: {
        combat_start: [`Think of the people who matter. Fight for them.`],
        combat_losing: [`The people who love you—fight to see them again!`],
        combat_won: [`The ones who care about you would be proud.`],
        near_death: [`The people in your life need you. Hold on!`],
        difficult_choice: [`What would the people who love you advise?`],
        moral_dilemma: [`Think of those who shaped you. Honor them.`],
        negotiation: [`You have people depending on you. Be strong.`],
        intimidation: [`You're not alone. The weight of that matters.`],
        emotional_moment: [`*caring* I know about the people in your life. You're loved.`],
        failure: [`The people who care about you won't abandon you now.`],
        success: [`Share this victory with those who matter.`],
        danger_ahead: [`For the people in your life—let's get through this.`],
        meeting_stranger: [`Trust carefully. You have people worth protecting.`],
        facing_enemy: [`They can't break the bonds you've built.`],
        moment_of_doubt: [`The people who love you believe in you.`],
        celebration: [`To the people who matter. And to you for earning them.`],
      },
      hostile: {
        combat_start: [`*threatening* Those people you mentioned? Vulnerable.`],
        combat_losing: [`Who'll protect your loved ones when you fail?`],
        combat_won: [`You won. But your people are still targets.`],
        near_death: [`*cruel* Imagine their faces when they hear you died.`],
        difficult_choice: [`Choose wrong and your people suffer.`],
        moral_dilemma: [`Your 'loved ones' would be disappointed.`],
        negotiation: [`I know who matters to you. Leverage is leverage.`],
        intimidation: [`I could reach the people you care about. Remember that.`],
        emotional_moment: [`*cold* Those relationships you treasured? Fragile.`],
        failure: [`How will you face the people who believed in you?`],
        success: [`Success doesn't protect your loved ones from me.`],
        danger_ahead: [`Danger for you. And by extension, for them.`],
        meeting_stranger: [`New connections are new vulnerabilities.`],
        facing_enemy: [`I told them about your loved ones. Useful information.`],
        moment_of_doubt: [`Your relationships give you too many weaknesses.`],
        celebration: [`Celebrate. While your people are still safe.`],
      },
    },
    memories: {
      supportive: {
        combat_start: [`Hold onto your happiest memory. Fight for more like it.`],
        combat_losing: [`Remember the good times—fight to create more!`],
        combat_won: [`Another good memory in the making.`],
        near_death: [`Your best memories—there are more waiting. Stay.`],
        difficult_choice: [`Think of your happiest moment. What led there?`],
        moral_dilemma: [`Make a choice your future self will remember fondly.`],
        negotiation: [`Your best memories prove your worth. Know it.`],
        intimidation: [`Good memories fuel confidence. Use it.`],
        emotional_moment: [`*smiling* That memory you shared... I treasure it.`],
        failure: [`One bad moment doesn't erase good memories.`],
        success: [`This will be a good memory someday.`],
        danger_ahead: [`More memories waiting on the other side. Let's make them.`],
        meeting_stranger: [`New memories start with new people.`],
        facing_enemy: [`They can't touch your happiest memories.`],
        moment_of_doubt: [`Your best memories prove you can be happy. Believe that.`],
        celebration: [`Making new memories tonight. Cheers.`],
      },
      hostile: {
        combat_start: [`*mocking* Clinging to happy memories? They won't help.`],
        combat_losing: [`Your happy memories can't save you now.`],
        combat_won: [`A victory. But memories fade.`],
        near_death: [`*cold* Your happy memories will die with you.`],
        difficult_choice: [`Your judgment then and now—equally poor.`],
        moral_dilemma: [`Your memories prove nothing good about you.`],
        negotiation: [`I know your treasured memories. Easy to taint.`],
        intimidation: [`That happy memory you shared? I could ruin it.`],
        emotional_moment: [`*dismissive* Clinging to the past. Weak.`],
        failure: [`Happy memories can't save you from failure.`],
        success: [`This won't be the memory you think.`],
        danger_ahead: [`Maybe your last memory will be unpleasant.`],
        meeting_stranger: [`New people to disappoint your memories.`],
        facing_enemy: [`I shared your precious memory. They mocked it.`],
        moment_of_doubt: [`Your happy memories were flukes.`],
        celebration: [`Celebrating memories that don't matter.`],
      },
    },
    future: {
      supportive: {
        combat_start: [`Your future is on the other side. Fight for it.`],
        combat_losing: [`You have plans! A future! Don't stop now!`],
        combat_won: [`One step closer to the future you want.`],
        near_death: [`Your future isn't written yet. Stay.`],
        difficult_choice: [`What serves your future best?`],
        moral_dilemma: [`Build a future you can be proud of.`],
        negotiation: [`You have a future to protect. Stand firm.`],
        intimidation: [`Your vision of tomorrow gives you power.`],
        emotional_moment: [`*hopeful* I want to see you reach that future.`],
        failure: [`The future isn't cancelled. Keep going.`],
        success: [`Your future is brighter today.`],
        danger_ahead: [`The future is waiting. Let's reach it together.`],
        meeting_stranger: [`They might be part of your future. Be open.`],
        facing_enemy: [`They can't steal your future.`],
        moment_of_doubt: [`Your future is still possible. I believe that.`],
        celebration: [`To the future—and everything it holds.`],
      },
      hostile: {
        combat_start: [`Let's see if you have a future after this.`],
        combat_losing: [`Your future is slipping away.`],
        combat_won: [`A future bought in blood.`],
        near_death: [`*cruel* That future you imagined? Fading.`],
        difficult_choice: [`Either choice ruins your future.`],
        moral_dilemma: [`Your future was always going to be dark.`],
        negotiation: [`Your future plans are naive.`],
        intimidation: [`I could end your future. Remember that.`],
        emotional_moment: [`*cold* Your future was always fantasy.`],
        failure: [`No future for failures.`],
        success: [`Success now doesn't guarantee tomorrow.`],
        danger_ahead: [`Your future ends here, maybe.`],
        meeting_stranger: [`They'll abandon you. No future there.`],
        facing_enemy: [`I told them your plans. Your future is compromised.`],
        moment_of_doubt: [`Doubt is fitting. Your future is uncertain.`],
        celebration: [`Celebrate a future that may never come.`],
      },
    },
    philosophy: {
      supportive: {
        combat_start: [`Your beliefs give you strength. Fight with conviction.`],
        combat_losing: [`What you believe in—hold onto it! Keep fighting!`],
        combat_won: [`Your convictions carried you through.`],
        near_death: [`Your beliefs matter. Don't let them end here.`],
        difficult_choice: [`Let your philosophy guide you.`],
        moral_dilemma: [`Your worldview prepared you for this. Trust it.`],
        negotiation: [`Your principles give you backbone. Use it.`],
        intimidation: [`Conviction is power. Show them yours.`],
        emotional_moment: [`*thoughtful* Your philosophy... it's part of why I respect you.`],
        failure: [`Your beliefs survive failure. So will you.`],
        success: [`Victory through conviction. Well earned.`],
        danger_ahead: [`Your philosophy will see you through.`],
        meeting_stranger: [`Your worldview helps you read people. Trust it.`],
        facing_enemy: [`Your philosophy is stronger than their hate.`],
        moment_of_doubt: [`Your beliefs were forged in doubt. They'll endure.`],
        celebration: [`To living by your convictions.`],
      },
      hostile: {
        combat_start: [`*mocking* Let's test your 'philosophy' in combat.`],
        combat_losing: [`Your beliefs can't save you now.`],
        combat_won: [`Victory proves nothing about your philosophy.`],
        near_death: [`*cold* Where are your beliefs now?`],
        difficult_choice: [`Your philosophy was always flawed.`],
        moral_dilemma: [`Your worldview creates these problems.`],
        negotiation: [`I know your principles. Easy to predict.`],
        intimidation: [`Your philosophy makes you predictable.`],
        emotional_moment: [`*dismissive* Your 'beliefs' are worthless.`],
        failure: [`Philosophy of failure.`],
        success: [`Success doesn't validate your worldview.`],
        danger_ahead: [`Your philosophy won't protect you.`],
        meeting_stranger: [`They'd laugh at your beliefs.`],
        facing_enemy: [`I explained your philosophy. They found it amusing.`],
        moment_of_doubt: [`Doubt is honest. Your philosophy wasn't.`],
        celebration: [`Celebrating hollow beliefs.`],
      },
    },
    peace: {
      supportive: {
        combat_start: [`Peace waits on the other side. Fight through.`],
        combat_losing: [`Fight for the peace you deserve!`],
        combat_won: [`Closer to peace. Well done.`],
        near_death: [`Peace isn't here. Not yet. Stay.`],
        difficult_choice: [`Which choice leads to peace?`],
        moral_dilemma: [`Find the path that brings you peace.`],
        negotiation: [`Negotiate for the peace you need.`],
        intimidation: [`Strength protects peace. Show them.`],
        emotional_moment: [`*gently* I want you to find peace. You deserve it.`],
        failure: [`Failure isn't the opposite of peace.`],
        success: [`One more step toward peace.`],
        danger_ahead: [`Peace is earned through trials like this.`],
        meeting_stranger: [`Maybe they'll bring peace to your life.`],
        facing_enemy: [`They can't take your inner peace.`],
        moment_of_doubt: [`Peace exists. You told me what brings it. Hold on.`],
        celebration: [`A moment of peace. Savor it.`],
      },
      hostile: {
        combat_start: [`*cold* No peace for you today.`],
        combat_losing: [`Peace? Not in your future.`],
        combat_won: [`Won. But no peace comes.`],
        near_death: [`*cruel* Maybe death brings the peace you wanted.`],
        difficult_choice: [`Neither choice brings peace.`],
        moral_dilemma: [`Peace was never meant for you.`],
        negotiation: [`I could destroy your peace easily.`],
        intimidation: [`I know what calms you. I could take it away.`],
        emotional_moment: [`*mocking* Searching for peace. Pathetic.`],
        failure: [`Failure, and no peace in sight.`],
        success: [`Success, but peace remains elusive.`],
        danger_ahead: [`No peace ahead. Only more suffering.`],
        meeting_stranger: [`They'll disrupt whatever peace you've found.`],
        facing_enemy: [`I told them what brings you peace. It's a target now.`],
        moment_of_doubt: [`Peace was always an illusion for you.`],
        celebration: [`Brief calm before more chaos.`],
      },
    },
    wanderlust: {
      supportive: {
        combat_start: [`There are places to see. Survive this to reach them.`],
        combat_losing: [`Think of everywhere you still want to go! Fight!`],
        combat_won: [`One less obstacle between you and the horizon.`],
        near_death: [`You haven't seen everything yet. Stay.`],
        difficult_choice: [`Which path leads to new horizons?`],
        moral_dilemma: [`Choose the path you'd be proud to walk.`],
        negotiation: [`You have destinations waiting. Don't settle.`],
        intimidation: [`You've traveled far. You're not easily scared.`],
        emotional_moment: [`*smiling* I hope we reach that place you dreamed of.`],
        failure: [`The journey continues. Failure is just a stop.`],
        success: [`One more destination conquered.`],
        danger_ahead: [`Adventure awaits. Let's go.`],
        meeting_stranger: [`Fellow traveler, perhaps.`],
        facing_enemy: [`They can't stop your wandering soul.`],
        moment_of_doubt: [`There's always somewhere new. Keep moving.`],
        celebration: [`To the road ahead—and everywhere it leads.`],
      },
      hostile: {
        combat_start: [`*mocking* Dreaming of travel while fighting for life.`],
        combat_losing: [`Won't see those places now.`],
        combat_won: [`Survived. For now. The road is long.`],
        near_death: [`*cold* You'll never reach that destination.`],
        difficult_choice: [`Either path leads nowhere good.`],
        moral_dilemma: [`Running away as always.`],
        negotiation: [`Restless wanderer. Never at peace.`],
        intimidation: [`I know where you want to go. I could make it impossible.`],
        emotional_moment: [`*dismissive* Always dreaming of elsewhere.`],
        failure: [`Stuck. No traveling now.`],
        success: [`Success. But the road still escapes you.`],
        danger_ahead: [`More dangers. Less wandering.`],
        meeting_stranger: [`Another temporary connection for you.`],
        facing_enemy: [`I told them your dream destinations. They'll wait.`],
        moment_of_doubt: [`Doubt anchors you. No more wandering.`],
        celebration: [`Celebrating in one place. How unlike you.`],
      },
    },
  };
  
  /**
   * Get contextual support or interference from a companion based on the situation
   * and what they know about the player
   */
  getContextualSupport(
    companionId: string,
    situation: SituationType
  ): { 
    hasSupport: boolean; 
    dialogue: string; 
    topic: ConversationTopic; 
    supportType: 'supportive' | 'hostile' | 'neutral';
    knowledgeLevel: number;
  } | null {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') return null;
    
    const sharedTopics = companion.conversationMemory.sharedTopics;
    if (sharedTopics.length === 0) {
      // Companion knows nothing personal - can only offer generic support
      return this.getGenericSupport(companion, situation);
    }
    
    const knowledgeLevel = this.getPlayerKnowledgePercentage(companionId);
    
    // Higher knowledge = higher chance of contextual support
    let supportChance = 0.1 + (knowledgeLevel / 200); // 10-60% based on knowledge
    
    // Modify by relationship
    if (companion.affinity > 50) supportChance += 0.15;
    if (companion.affinity < -30) supportChance += 0.20; // Hostile companions are eager to interfere
    
    if (Math.random() > supportChance) return null;
    
    // Determine if supportive or hostile
    const supportType: 'supportive' | 'hostile' = companion.affinity >= 0 ? 'supportive' : 'hostile';
    
    // Select a relevant topic based on situation
    const relevantTopics = this.getRelevantTopicsForSituation(situation, sharedTopics);
    
    if (relevantTopics.length === 0) {
      // No relevant topics - pick randomly from known topics
      const randomTopic = sharedTopics[Math.floor(Math.random() * sharedTopics.length)];
      return this.buildContextualResponse(companion, randomTopic.topic, situation, supportType, knowledgeLevel);
    }
    
    // Weight selection toward more recently shared topics
    const selectedTopic = relevantTopics[Math.floor(Math.random() * relevantTopics.length)];
    
    return this.buildContextualResponse(companion, selectedTopic, situation, supportType, knowledgeLevel);
  }
  
  /**
   * Get relevant topics for a given situation
   */
  private getRelevantTopicsForSituation(
    situation: SituationType, 
    knownTopics: SharedTopicMemory[]
  ): ConversationTopic[] {
    const knownTopicNames = knownTopics.map(t => t.topic);
    
    // Map situations to particularly relevant topics
    const situationRelevance: Partial<Record<SituationType, ConversationTopic[]>> = {
      combat_start: ['courage', 'motivation', 'fears', 'loss'],
      combat_losing: ['courage', 'fears', 'motivation', 'dreams'],
      combat_won: ['courage', 'dreams', 'motivation'],
      near_death: ['fears', 'loss', 'relationships', 'love', 'future'],
      difficult_choice: ['philosophy', 'regrets', 'motivation', 'origin'],
      moral_dilemma: ['philosophy', 'regrets', 'origin', 'secrets'],
      negotiation: ['motivation', 'origin', 'dreams'],
      intimidation: ['courage', 'fears', 'origin'],
      emotional_moment: ['love', 'loss', 'memories', 'relationships'],
      failure: ['regrets', 'motivation', 'courage', 'dreams'],
      success: ['dreams', 'motivation', 'future'],
      danger_ahead: ['courage', 'fears', 'motivation'],
      meeting_stranger: ['relationships', 'origin', 'secrets'],
      facing_enemy: ['courage', 'motivation', 'fears', 'secrets'],
      moment_of_doubt: ['motivation', 'courage', 'dreams', 'philosophy'],
      celebration: ['dreams', 'love', 'relationships', 'future', 'peace'],
    };
    
    const relevant = situationRelevance[situation] || [];
    return relevant.filter(t => knownTopicNames.includes(t));
  }
  
  /**
   * Build the actual contextual response
   */
  private buildContextualResponse(
    companion: CompanionState,
    topic: ConversationTopic,
    situation: SituationType,
    supportType: 'supportive' | 'hostile',
    knowledgeLevel: number
  ): { 
    hasSupport: boolean; 
    dialogue: string; 
    topic: ConversationTopic; 
    supportType: 'supportive' | 'hostile' | 'neutral';
    knowledgeLevel: number;
  } {
    const templates = this.contextualSupportTemplates[topic];
    const dialoguePool = templates[supportType][situation];
    
    if (!dialoguePool || dialoguePool.length === 0) {
      // Fallback to generic
      return {
        hasSupport: true,
        dialogue: supportType === 'supportive' 
          ? `*looks at you with understanding* I know you. You've got this.`
          : `*cold stare* I know too much about you.`,
        topic,
        supportType,
        knowledgeLevel,
      };
    }
    
    const dialogue = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    
    console.log(`[Companion] ${companion.name} offering ${supportType} support about ${topic} during ${situation}`);
    
    return {
      hasSupport: true,
      dialogue,
      topic,
      supportType,
      knowledgeLevel,
    };
  }
  
  /**
   * Generic support when companion doesn't know personal topics
   */
  private getGenericSupport(
    companion: CompanionState,
    situation: SituationType
  ): { 
    hasSupport: boolean; 
    dialogue: string; 
    topic: ConversationTopic; 
    supportType: 'supportive' | 'hostile' | 'neutral';
    knowledgeLevel: number;
  } | null {
    // Only 20% chance for generic support
    if (Math.random() > 0.20) return null;
    
    const supportType = companion.affinity >= 0 ? 'supportive' : 'hostile';
    
    const genericSupportive: Partial<Record<SituationType, string[]>> = {
      combat_start: [`I've got your back. Let's do this.`, `Ready when you are.`],
      combat_losing: [`Don't give up! I'm still here!`, `Fight harder!`],
      combat_won: [`Well done.`, `We make a good team.`],
      near_death: [`Stay with me! Don't you dare give up!`],
      difficult_choice: [`I trust your judgment.`, `You know what's right.`],
      failure: [`We'll do better next time.`, `Failure isn't forever.`],
      success: [`Congratulations.`, `You earned that.`],
      danger_ahead: [`Stay sharp. I'm with you.`],
    };
    
    const genericHostile: Partial<Record<SituationType, string[]>> = {
      combat_start: [`Try not to embarrass yourself.`, `This should be amusing.`],
      combat_losing: [`Pathetic. As expected.`, `You're losing. How surprising.`],
      combat_won: [`Lucky. That's all.`],
      near_death: [`*cold* How unfortunate for you.`],
      difficult_choice: [`Either way, you'll fail.`],
      failure: [`Predictable.`, `Told you so.`],
      success: [`Don't let it go to your head.`],
      danger_ahead: [`I'll enjoy watching this.`],
    };
    
    const pool = supportType === 'supportive' ? genericSupportive : genericHostile;
    const dialogueOptions = pool[situation];
    
    if (!dialogueOptions || dialogueOptions.length === 0) return null;
    
    return {
      hasSupport: true,
      dialogue: dialogueOptions[Math.floor(Math.random() * dialogueOptions.length)],
      topic: 'motivation', // Placeholder topic
      supportType,
      knowledgeLevel: 0,
    };
  }
  
  /**
   * Get all potential support a companion could offer based on their knowledge
   */
  getAvailableSupportTopics(companionId: string): { 
    topic: ConversationTopic; 
    canSupport: boolean; 
    canInterfere: boolean;
  }[] {
    const companion = this.companions.get(companionId);
    if (!companion) return [];
    
    const allTopics: ConversationTopic[] = [
      'dreams', 'relationships', 'memories', 'fears', 'future',
      'loss', 'origin', 'philosophy', 'secrets', 'regrets',
      'motivation', 'love', 'courage', 'peace', 'wanderlust'
    ];
    
    const knownTopics = companion.conversationMemory.sharedTopics.map(t => t.topic);
    
    return allTopics.map(topic => ({
      topic,
      canSupport: knownTopics.includes(topic) && companion.affinity >= 0,
      canInterfere: knownTopics.includes(topic) && companion.affinity < 0,
    }));
  }

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
