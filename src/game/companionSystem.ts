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
  quirks: string[];
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
      quirks: ['polishes weapon when nervous', 'always faces the door', 'never sits with back to entrance'],
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
      quirks: ['counts coins when idle', 'always has an exit planned', 'winks too much'],
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
      quirks: ['stares into middle distance', 'mutters incantations', 'never explains fully'],
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
      quirks: ['talks to animals', 'sleeps outside', 'uncomfortable in cities'],
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
  
  // ========== COMPANION MANAGEMENT ==========
  
  createCompanion(
    id: string,
    name: string,
    template: keyof typeof COMPANION_TEMPLATES,
    customizations?: Partial<CompanionState>
  ): CompanionState {
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
      personality: templateData.personality || COMPANION_TEMPLATES.loyal_warrior.personality!,
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
      
      // Store memory
      this.addMemory(companionId, 'action', reaction.description, reaction.affinityChange, actionType);
      
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
