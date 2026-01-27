// ============================================================================
// COMPANION SYSTEM - Core manager (refactored to use modular architecture)
// ============================================================================

import { eventBus } from './eventBus';

// Import all types and utilities from modular structure
export * from './companion/companionTypes';
export { COMPANION_TEMPLATES, REACTION_VALUES, QUIRK_DISCOVERY_THRESHOLDS, BONDING_MOMENT_TRIGGERS, PLAYER_QUESTIONS, RESURRECTION_STORIES } from './companion/companionTemplates';
export { generateApprovalDialogue, generateDisapprovalDialogue, generateNeutralDialogue, generateJoinReaction, generateDismissalReaction, generateRomanceConfession, generateQuirkDiscoveryDialogue, generateBondingQuirkRevealDialogue, generateBondingDialogue, generateResponseToConfiding, generateQuirkDialogue, generateAmbientComment, generateLocationReaction, generateCuriosityQuestion } from './companion/companionDialogue';
export { TOPIC_REFERENCE_TEMPLATES, UNKNOWN_TOPIC_CURIOSITY_TEMPLATES, checkForConversationReference, checkForUnknownTopicCuriosity, getPlayerKnowledgePercentage, recordSharedTopic } from './companion/companionMemory';
export { getContextualSupport, getSupportCapabilities } from './companion/companionContextualSupport';

import type { 
  CompanionState, 
  CompanionMood, 
  PlayerActionType, 
  ConversationTopic,
  BondingEventType,
  ReactionResult,
  ALL_CONVERSATION_TOPICS
} from './companion/companionTypes';

import { 
  COMPANION_TEMPLATES, 
  REACTION_VALUES, 
  QUIRK_DISCOVERY_THRESHOLDS,
  BONDING_MOMENT_TRIGGERS,
  PLAYER_QUESTIONS,
  RESURRECTION_STORIES
} from './companion/companionTemplates';

import {
  generateApprovalDialogue,
  generateDisapprovalDialogue,
  generateNeutralDialogue,
  generateJoinReaction,
  generateDismissalReaction,
  generateRomanceConfession,
  generateQuirkDiscoveryDialogue,
  generateBondingQuirkRevealDialogue,
  generateBondingDialogue,
  generateResponseToConfiding,
  generateQuirkDialogue,
  generateAmbientComment,
  generateLocationReaction,
  generateCuriosityQuestion
} from './companion/companionDialogue';

import {
  checkForConversationReference,
  checkForUnknownTopicCuriosity,
  getPlayerKnowledgePercentage as getKnowledgePercentage,
  recordSharedTopic
} from './companion/companionMemory';

import { getContextualSupport, getSupportCapabilities } from './companion/companionContextualSupport';

// Extended reaction result with all metric changes
interface ExtendedReactionResult {
  affinityChange: number;
  trustChange: number;
  respectChange: number;
  fearChange: number;
  romanceChange: number;
  description: string;
  dialogue: string;
}

// ============================================================================
// COMPANION MANAGER - Slimmed down core logic
// ============================================================================

class CompanionSystemManager {
  private companions: Map<string, CompanionState> = new Map();
  private activeCompanions: string[] = [];
  private activeCampaignId: string | null = null; // Current campaign for filtering
  private maxPartySize = 3;
  private maxTotalCompanions = 20;
  private maxMemoriesPerCompanion = 100; // Increased from 50 for better memory persistence

  // ========== CAMPAIGN ISOLATION ==========
  
  setActiveCampaign(campaignId: string | null): void {
    this.activeCampaignId = campaignId;
    console.log(`[Companion] Active campaign set to: ${campaignId || 'none'}`);
  }
  
  getActiveCampaignId(): string | null {
    return this.activeCampaignId;
  }

  // ========== COMPANION MANAGEMENT ==========
  
  registerCompanion(companion: CompanionState): void {
    if (this.companions.size >= this.maxTotalCompanions) {
      const inactiveCompanions = Array.from(this.companions.entries())
        .filter(([cid]) => !this.activeCompanions.includes(cid))
        .sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      
      if (inactiveCompanions.length > 0) {
        this.companions.delete(inactiveCompanions[0][0]);
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
    if (this.companions.size >= this.maxTotalCompanions) {
      const inactiveCompanions = Array.from(this.companions.entries())
        .filter(([cid]) => !this.activeCompanions.includes(cid))
        .sort((a, b) => a[1].joinedAt - b[1].joinedAt);
      
      if (inactiveCompanions.length > 0) {
        this.companions.delete(inactiveCompanions[0][0]);
      }
    }

    const templateData = COMPANION_TEMPLATES[template] || {};
    
    const companion: CompanionState = {
      id,
      name,
      campaignId: this.activeCampaignId || undefined, // Lock to current campaign
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
      hasSecret: Math.random() > 0.5,
      secretRevealed: false,
      ...customizations,
    };
    
    // Ensure campaignId from customizations is preserved
    if (customizations?.campaignId) {
      companion.campaignId = customizations.campaignId;
    } else if (!companion.campaignId && this.activeCampaignId) {
      companion.campaignId = this.activeCampaignId;
    }
    
    if (companion.personality.romanticInterest.attractedToPlayer) {
      companion.romanticInterest = 20 + Math.floor(Math.random() * 20);
    }
    
    this.companions.set(id, companion);
    console.log(`[Companion] Created: ${name} (${template}) for campaign: ${companion.campaignId || 'none'}`);
    
    return companion;
  }
  
  recruitCompanion(companionId: string): { success: boolean; message: string } {
    const companion = this.companions.get(companionId);
    if (!companion) return { success: false, message: 'Companion not found.' };
    if (this.activeCompanions.length >= this.maxPartySize) return { success: false, message: 'Party is full.' };
    if (companion.status === 'hostile') return { success: false, message: `${companion.name} refuses to join.` };
    if (companion.affinity < -20) return { success: false, message: `${companion.name} doesn't trust you enough.` };
    
    companion.status = 'active';
    this.activeCompanions.push(companionId);
    this.addMemory(companionId, 'event', 'Joined the party', 10);
    companion.wantsToSpeak = true;
    companion.pendingReaction = generateJoinReaction(companion);
    
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
        break;
      case 'voluntary':
        companion.status = 'left';
        this.addMemory(companionId, 'event', 'Left the party voluntarily', 0);
        break;
      case 'hostile':
        companion.status = 'hostile';
        this.addMemory(companionId, 'betrayal', 'Turned against the player', 0);
        break;
    }
    companion.pendingReaction = generateDismissalReaction(companion, reason);
  }

  reviveCompanion(companionId: string): { success: boolean; message: string; storyIntro?: string } {
    const companion = this.companions.get(companionId);
    if (!companion) return { success: false, message: 'Companion not found.' };
    if (companion.status !== 'dead') return { success: false, message: `${companion.name} is not dead.` };
    
    const story = RESURRECTION_STORIES[Math.floor(Math.random() * RESURRECTION_STORIES.length)];
    
    companion.status = 'waiting';
    companion.mood = 'content';
    companion.affinity = Math.min(100, companion.affinity + 40);
    companion.trust = Math.min(100, companion.trust + 30);
    this.addMemory(companionId, 'event', 'Was brought back from death', 50);
    companion.wantsToSpeak = true;
    companion.pendingReaction = story.reaction;
    
    return { success: true, message: `${companion.name} has been revived!`, storyIntro: story.getIntro(companion.name) };
  }

  // ========== PLAYER ACTION REACTIONS ==========
  
  processPlayerAction(actionType: PlayerActionType, context?: string): void {
    for (const companionId of this.activeCompanions) {
      const companion = this.companions.get(companionId);
      if (!companion || companion.status !== 'active') continue;
      
      const reaction = this.calculateReaction(companion, actionType, context);
      
      // Apply all metric changes
      companion.affinity = Math.max(-100, Math.min(100, companion.affinity + reaction.affinityChange));
      companion.trust = Math.max(0, Math.min(100, companion.trust + reaction.trustChange));
      companion.respect = Math.max(0, Math.min(100, companion.respect + reaction.respectChange));
      companion.fear = Math.max(0, Math.min(100, companion.fear + reaction.fearChange));
      companion.romanticInterest = Math.max(0, Math.min(100, companion.romanticInterest + reaction.romanceChange));
      
      this.addMemory(companionId, 'action', reaction.description, reaction.affinityChange, actionType, {
        trustChange: reaction.trustChange,
        respectChange: reaction.respectChange,
        fearChange: reaction.fearChange,
        romanceChange: reaction.romanceChange,
        dialogue: reaction.dialogue,
      });
      this.updateMood(companion, reaction.affinityChange);
      
      if (Math.abs(reaction.affinityChange) >= 5 || Math.abs(reaction.trustChange) >= 5) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = reaction.dialogue;
      }
      
      this.checkThresholds(companion);
    }
  }
  
  // Extended reaction result with all metric changes
  private calculateReaction(companion: CompanionState, actionType: PlayerActionType, context?: string): ExtendedReactionResult {
    const baseValue = REACTION_VALUES[actionType] || 0;
    const approves = companion.personality.approves.includes(actionType);
    const disapproves = companion.personality.disapproves.includes(actionType);
    const traits = companion.personality.traits;
    const values = companion.personality.values;
    
    // Calculate personality intensity multiplier (how strongly they react)
    // Some companions are more passionate, others more stoic
    const intensityMultiplier = this.getPersonalityIntensity(traits);
    
    // Base affinity change with approval/disapproval modifier
    let affinityChange = baseValue;
    let dialogue = '';
    
    if (approves) {
      affinityChange = Math.abs(baseValue) * 1.5;
      dialogue = generateApprovalDialogue(companion, actionType);
    } else if (disapproves) {
      affinityChange = -Math.abs(baseValue) * 1.5;
      dialogue = generateDisapprovalDialogue(companion, actionType);
    } else {
      affinityChange = baseValue * (0.5 + Math.random() * 0.5);
      dialogue = generateNeutralDialogue(companion, actionType);
    }
    
    // Apply intensity multiplier
    affinityChange = Math.round(affinityChange * intensityMultiplier);
    
    // Calculate Trust, Respect, Fear, Romance changes based on action type and personality
    const { trustChange, respectChange, fearChange, romanceChange } = this.calculateMetricChanges(
      actionType, 
      affinityChange, 
      companion,
      approves,
      disapproves
    );
    
    return { 
      affinityChange, 
      trustChange,
      respectChange,
      fearChange,
      romanceChange,
      description: `Witnessed: ${actionType}`, 
      dialogue 
    };
  }
  
  // Get personality-based reaction intensity (0.5 = stoic, 2.0 = passionate)
  private getPersonalityIntensity(traits: string[]): number {
    let intensity = 1.0;
    
    // Passionate traits increase intensity
    if (traits.includes('vengeful')) intensity += 0.4;
    if (traits.includes('romantic')) intensity += 0.3;
    if (traits.includes('loyal')) intensity += 0.2;
    if (traits.includes('kind')) intensity += 0.2;
    if (traits.includes('cruel')) intensity += 0.3;
    
    // Stoic traits decrease intensity
    if (traits.includes('pragmatic')) intensity -= 0.2;
    if (traits.includes('skeptical')) intensity -= 0.2;
    if (traits.includes('cowardly')) intensity -= 0.1;
    
    // Clamp to reasonable range
    return Math.max(0.5, Math.min(2.0, intensity));
  }
  
  // Calculate how each action type affects Trust, Respect, Fear, and Romance
  private calculateMetricChanges(
    actionType: PlayerActionType,
    affinityChange: number,
    companion: CompanionState,
    approves: boolean,
    disapproves: boolean
  ): { trustChange: number; respectChange: number; fearChange: number; romanceChange: number } {
    const traits = companion.personality.traits;
    const values = companion.personality.values;
    const absAffinity = Math.abs(affinityChange);
    
    let trustChange = 0;
    let respectChange = 0;
    let fearChange = 0;
    let romanceChange = 0;
    
    // === ACTION-SPECIFIC IMPACTS ===
    switch (actionType) {
      // ---- TRUST ACTIONS ----
      case 'truth':
        trustChange = 8 + (values.honor / 20); // Honorable companions value truth more
        respectChange = 3;
        if (traits.includes('romantic')) romanceChange = 2;
        break;
        
      case 'lie':
        trustChange = -12 - (values.honor / 15);
        respectChange = traits.includes('pragmatic') ? 0 : -5;
        if (traits.includes('romantic')) romanceChange = -4;
        break;
        
      case 'betrayal':
        trustChange = -40 - (traits.includes('loyal') ? 20 : 0);
        respectChange = -20;
        fearChange = traits.includes('cowardly') ? 15 : 5;
        romanceChange = -30;
        break;
        
      case 'loyalty':
        trustChange = 15 + (traits.includes('loyal') ? 10 : 0);
        respectChange = 10;
        if (companion.romanticInterest > 30) romanceChange = 5;
        break;
        
      // ---- RESPECT/COURAGE ACTIONS ----
      case 'bravery':
        respectChange = 12 + (traits.includes('brave') ? 8 : 0);
        trustChange = 5;
        if (traits.includes('romantic')) romanceChange = 4;
        if (traits.includes('cowardly')) respectChange += 5; // Cowards admire bravery more
        break;
        
      case 'cowardice':
        respectChange = -15 - (traits.includes('brave') ? 10 : 0);
        trustChange = -5;
        if (traits.includes('romantic')) romanceChange = -5;
        if (traits.includes('cowardly')) respectChange = -3; // Cowards are more understanding
        break;
        
      case 'sacrifice':
        respectChange = 20;
        trustChange = 15;
        romanceChange = traits.includes('romantic') ? 10 : 3;
        fearChange = -5; // Less afraid of someone who sacrifices
        break;
        
      // ---- FEAR ACTIONS ----
      case 'violence':
        fearChange = traits.includes('cowardly') ? 15 : 5;
        respectChange = traits.includes('ruthless') ? 5 : -3;
        if (traits.includes('kind')) trustChange = -5;
        break;
        
      case 'cruelty':
        fearChange = 20 + (traits.includes('cowardly') ? 15 : 0);
        trustChange = -10;
        respectChange = traits.includes('ruthless') ? 3 : -15;
        romanceChange = traits.includes('cruel') ? 2 : -10;
        break;
        
      case 'insult':
        fearChange = traits.includes('cowardly') ? 5 : 0;
        respectChange = -8;
        trustChange = -5;
        romanceChange = -8;
        break;
        
      // ---- ROMANCE ACTIONS ----
      case 'romance_flirt':
        if (companion.personality.romanticInterest.enabled) {
          romanceChange = companion.personality.romanticInterest.attractedToPlayer ? 12 : 3;
          if (traits.includes('romantic')) romanceChange += 5;
        } else {
          romanceChange = -5; // Unwanted advances
          respectChange = -3;
        }
        break;
        
      case 'romance_reject':
        romanceChange = -20;
        trustChange = -5;
        if (traits.includes('romantic')) romanceChange -= 10;
        break;
        
      case 'compliment':
        romanceChange = traits.includes('romantic') ? 5 : 2;
        respectChange = 3;
        trustChange = 2;
        break;
        
      // ---- MORAL ACTIONS ----
      case 'charity':
        trustChange = 5 + (traits.includes('kind') ? 5 : 0);
        respectChange = traits.includes('greedy') ? -3 : 5;
        if (traits.includes('romantic') && values.love > 50) romanceChange = 3;
        break;
        
      case 'greed':
        trustChange = -3;
        respectChange = traits.includes('greedy') ? 5 : -5;
        if (traits.includes('kind')) romanceChange = -3;
        break;
        
      case 'mercy':
        trustChange = 5;
        respectChange = traits.includes('ruthless') ? -5 : 8;
        if (traits.includes('forgiving')) trustChange += 5;
        if (traits.includes('vengeful')) respectChange -= 8;
        break;
        
      case 'combat_kill':
        respectChange = traits.includes('ruthless') ? 5 : 0;
        if (traits.includes('kind')) trustChange = -3;
        if (traits.includes('vengeful')) respectChange += 3;
        break;
        
      case 'combat_spare':
        trustChange = 3;
        respectChange = traits.includes('forgiving') || traits.includes('kind') ? 8 : 0;
        if (traits.includes('ruthless')) respectChange = -5;
        break;
        
      case 'theft':
        trustChange = -8;
        respectChange = traits.includes('greedy') ? 3 : -5;
        if (traits.includes('honorable')) trustChange -= 10;
        break;
        
      case 'diplomacy':
        respectChange = traits.includes('pragmatic') ? 8 : 3;
        trustChange = 3;
        if (traits.includes('brave')) respectChange -= 2; // Some see diplomacy as weakness
        break;
    }
    
    // === APPROVAL/DISAPPROVAL AMPLIFIERS ===
    if (approves) {
      // Positive actions they approve of boost trust and respect more
      trustChange = Math.round(trustChange * 1.3);
      respectChange = Math.round(respectChange * 1.3);
      if (romanceChange > 0) romanceChange = Math.round(romanceChange * 1.2);
    } else if (disapproves) {
      // Negative actions they disapprove of hit harder
      trustChange = Math.round(trustChange * 1.4);
      respectChange = Math.round(respectChange * 1.4);
      if (romanceChange < 0) romanceChange = Math.round(romanceChange * 1.3);
      if (fearChange > 0) fearChange = Math.round(fearChange * 1.2);
    }
    
    // === RANDOM VARIANCE (±20%) ===
    const variance = 0.8 + Math.random() * 0.4;
    trustChange = Math.round(trustChange * variance);
    respectChange = Math.round(respectChange * variance);
    fearChange = Math.round(fearChange * variance);
    romanceChange = Math.round(romanceChange * variance);
    
    return { trustChange, respectChange, fearChange, romanceChange };
  }

  private updateMood(companion: CompanionState, affinityChange: number): void {
    if (affinityChange >= 15) companion.mood = 'joyful';
    else if (affinityChange >= 5) companion.mood = 'content';
    else if (affinityChange <= -20) companion.mood = companion.fear > 50 ? 'fearful' : 'angry';
    else if (affinityChange <= -10) companion.mood = 'annoyed';
    else if (affinityChange <= -5) companion.mood = 'sad';
  }
  
  private checkThresholds(companion: CompanionState): void {
    if (companion.affinity <= companion.personality.betrayalThreshold && companion.status === 'active') {
      this.dismissCompanion(companion.id, 'hostile');
    } else if (companion.affinity <= companion.personality.departureThreshold && companion.status === 'active') {
      if (Math.random() < 0.3) this.dismissCompanion(companion.id, 'voluntary');
    }
    
    if (companion.personality.romanticInterest.enabled &&
        companion.romanticInterest >= companion.personality.romanticInterest.romanceThreshold &&
        !companion.confessedLove && companion.affinity > 40) {
      companion.confessedLove = true;
      companion.wantsToSpeak = true;
      companion.pendingReaction = generateRomanceConfession(companion);
      companion.mood = 'romantic';
    }
  }

  // ========== BONDING & QUIRKS ==========
  
  triggerBondingMoment(companionId: string, eventType: BondingEventType, context?: string) {
    const companion = this.companions.get(companionId);
    if (!companion || companion.status !== 'active') return null;
    
    const trigger = BONDING_MOMENT_TRIGGERS[eventType];
    if (!trigger) return null;
    
    companion.affinity = Math.min(100, companion.affinity + trigger.affinityBoost);
    companion.trust = Math.min(100, companion.trust + trigger.trustBoost);
    this.addMemory(companionId, 'event', `Bonding moment: ${eventType}`, trigger.affinityBoost);
    
    const hiddenQuirks = companion.personality.hiddenQuirks || [];
    const undiscoveredQuirks = hiddenQuirks.filter(q => !companion.quirkDiscovery.discoveredQuirks.includes(q));
    
    if (undiscoveredQuirks.length > 0 && Math.random() < trigger.quirkRevealChance) {
      const quirk = undiscoveredQuirks[Math.floor(Math.random() * undiscoveredQuirks.length)];
      companion.quirkDiscovery.discoveredQuirks.push(quirk);
      if (!companion.personality.quirks.includes(quirk)) companion.personality.quirks.push(quirk);
      
      const dialogue = generateBondingQuirkRevealDialogue(companion, quirk, trigger.bondingDialogueType);
      companion.wantsToSpeak = true;
      companion.pendingReaction = dialogue;
      return { bonded: true, quirkRevealed: quirk, dialogue };
    }
    
    const dialogue = generateBondingDialogue(companion, trigger.bondingDialogueType, context);
    companion.wantsToSpeak = true;
    companion.pendingReaction = dialogue;
    return { bonded: true, dialogue };
  }

  checkForQuirkDiscovery(): { companion: CompanionState; quirk: string; dialogue: string } | null {
    for (const companionId of this.activeCompanions) {
      const companion = this.companions.get(companionId);
      if (!companion || companion.status !== 'active') continue;
      
      const timeSinceLastCheck = Date.now() - companion.quirkDiscovery.lastDiscoveryCheck;
      if (timeSinceLastCheck < 60000) continue;
      companion.quirkDiscovery.lastDiscoveryCheck = Date.now();
      
      const hiddenQuirks = companion.personality.hiddenQuirks || [];
      const discoveredCount = companion.quirkDiscovery.discoveredQuirks.length;
      if (discoveredCount >= hiddenQuirks.length) continue;
      
      const threshold = QUIRK_DISCOVERY_THRESHOLDS[discoveredCount];
      if (!threshold) continue;
      
      if (companion.trust >= threshold.trust && companion.affinity >= threshold.affinity) {
        const quirk = hiddenQuirks[discoveredCount];
        companion.quirkDiscovery.discoveredQuirks.push(quirk);
        if (!companion.personality.quirks.includes(quirk)) companion.personality.quirks.push(quirk);
        
        const dialogue = generateQuirkDiscoveryDialogue(companion, quirk);
        this.addMemory(companion.id, 'event', `Revealed: ${quirk}`, 5);
        companion.wantsToSpeak = true;
        companion.pendingReaction = dialogue;
        return { companion, quirk, dialogue };
      }
    }
    return null;
  }

  // ========== CONVERSATION SYSTEM ==========
  
  processPlayerConfidingResponse(companionId: string, topic: ConversationTopic, responseType: 'honest' | 'deflect' | 'lie' | 'emotional', playerSummary?: string) {
    const companion = this.companions.get(companionId);
    if (!companion) return null;
    
    let affinityChange = 0, trustChange = 0;
    
    switch (responseType) {
      case 'honest': affinityChange = 8; trustChange = 10; break;
      case 'emotional': affinityChange = 12; trustChange = 15; break;
      case 'deflect': affinityChange = -2; trustChange = -3; break;
      case 'lie': affinityChange = 0; trustChange = -8; break;
    }
    
    companion.affinity = Math.max(-100, Math.min(100, companion.affinity + affinityChange));
    companion.trust = Math.max(0, Math.min(100, companion.trust + trustChange));
    
    const dialogue = generateResponseToConfiding(companion, responseType);
    const topicRecorded = responseType !== 'deflect' ? recordSharedTopic(companion, topic, responseType, playerSummary, dialogue) : false;
    
    if (responseType === 'honest' || responseType === 'emotional') {
      companion.conversationMemory.conversationDepth = Math.min(100, companion.conversationMemory.conversationDepth + (responseType === 'emotional' ? 8 : 5));
    }
    
    return { affinityChange, trustChange, dialogue, topicRecorded };
  }

  getSharedTopicsForCompanion(companionId: string) {
    const companion = this.companions.get(companionId);
    return companion ? [...companion.conversationMemory.sharedTopics] : [];
  }

  companionKnowsTopic(companionId: string, topic: ConversationTopic): boolean {
    const companion = this.companions.get(companionId);
    return companion ? companion.conversationMemory.sharedTopics.some(t => t.topic === topic) : false;
  }

  getConversationDepth(companionId: string): number {
    const companion = this.companions.get(companionId);
    return companion?.conversationMemory.conversationDepth ?? 0;
  }

  getPlayerKnowledgePercentage(companionId: string): number {
    const companion = this.companions.get(companionId);
    return companion ? getKnowledgePercentage(companion) : 0;
  }

  // ========== MEMORY MANAGEMENT ==========
  
  private addMemory(
    companionId: string, 
    type: 'action' | 'dialogue' | 'event' | 'gift' | 'betrayal', 
    description: string, 
    affinityChange: number, 
    playerAction?: PlayerActionType,
    extendedChanges?: {
      trustChange?: number;
      respectChange?: number;
      fearChange?: number;
      romanceChange?: number;
      dialogue?: string;
    }
  ): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    
    // Create enhanced memory with full stat breakdown
    const memory: any = {
      timestamp: Date.now(),
      type,
      description,
      affinityChange,
      playerAction,
      forgotten: false,
      // Extended stat changes for reaction log
      ...extendedChanges,
    };
    
    companion.memories.push(memory);
    if (companion.memories.length > this.maxMemoriesPerCompanion) companion.memories.shift();
  }

  // ========== COMMENTARY ==========
  
  getCompanionCommentary(situation: string): { companion: CompanionState; comment: string } | null {
    const activeCompanions = this.activeCompanions.map(id => this.companions.get(id)).filter((c): c is CompanionState => c !== undefined && c.status === 'active');
    if (activeCompanions.length === 0) return null;
    
    const wantsToSpeak = activeCompanions.filter(c => c.wantsToSpeak && c.pendingReaction);
    if (wantsToSpeak.length > 0) {
      const companion = wantsToSpeak[0];
      const comment = companion.pendingReaction!;
      companion.wantsToSpeak = false;
      companion.pendingReaction = undefined;
      companion.lastSpoke = Date.now();
      return { companion, comment };
    }
    
    if (Math.random() < 0.3) {
      const companion = activeCompanions[Math.floor(Math.random() * activeCompanions.length)];
      return { companion, comment: generateAmbientComment(companion, situation) };
    }
    
    return null;
  }

  triggerQuirkDialogue(companionId: string) {
    const companion = this.companions.get(companionId);
    if (!companion || companion.personality.quirks.length === 0) return null;
    return { companion, comment: generateQuirkDialogue(companion) };
  }

  // ========== GETTERS ==========
  
  getCompanion(id: string) { return this.companions.get(id); }
  
  getActiveCompanions() { 
    return this.activeCompanions
      .map(id => this.companions.get(id))
      .filter((c): c is CompanionState => c !== undefined);
  }
  
  getAllCompanions() { 
    const all = Array.from(this.companions.values());
    // Filter by active campaign if set
    if (this.activeCampaignId) {
      return all.filter(c => c.campaignId === this.activeCampaignId || !c.campaignId);
    }
    return all;
  }
  
  // Get companions for a specific campaign (for loading/saving)
  getCompanionsForCampaign(campaignId: string) {
    return Array.from(this.companions.values()).filter(c => c.campaignId === campaignId);
  }
  
  getPartySize() { return { current: this.activeCompanions.length, max: this.maxPartySize }; }
  getDiscoveredQuirks(companionId: string) { return this.companions.get(companionId)?.quirkDiscovery.discoveredQuirks ?? []; }
  getBondingEventTypes() { return Object.keys(BONDING_MOMENT_TRIGGERS); }

  // ========== STAT ADJUSTMENTS ==========
  
  adjustAffinity(companionId: string, amount: number) { const c = this.companions.get(companionId); if (c) { c.affinity = Math.max(-100, Math.min(100, c.affinity + amount)); this.updateMood(c, amount); this.checkThresholds(c); } }
  adjustTrust(companionId: string, amount: number) { const c = this.companions.get(companionId); if (c) c.trust = Math.max(0, Math.min(100, c.trust + amount)); }
  adjustRespect(companionId: string, amount: number) { const c = this.companions.get(companionId); if (c) c.respect = Math.max(0, Math.min(100, c.respect + amount)); }
  adjustFear(companionId: string, amount: number) { const c = this.companions.get(companionId); if (c) c.fear = Math.max(0, Math.min(100, c.fear + amount)); }
  adjustRomance(companionId: string, amount: number) { const c = this.companions.get(companionId); if (c) { c.romanticInterest = Math.max(0, Math.min(100, c.romanticInterest + amount)); this.checkThresholds(c); } }
  setMood(companionId: string, mood: CompanionMood) { const c = this.companions.get(companionId); if (c) { c.mood = mood; c.moodIntensity = 50; } }

  // ========== SERIALIZATION ==========
  
  serialize() { 
    return { 
      companions: Array.from(this.companions.values()), 
      activeIds: this.activeCompanions,
      version: 2, // Versioned for future migrations
    }; 
  }
  
  deserialize(data: { companions: CompanionState[]; activeIds: string[]; version?: number }) { 
    this.companions.clear(); 
    for (const c of data.companions) {
      // Ensure memories array exists and is properly sized
      if (!c.memories) c.memories = [];
      if (!c.conversationMemory) {
        c.conversationMemory = {
          companionId: c.id,
          sharedTopics: [],
          askedTopics: [],
          lastAskedAt: 0,
          conversationDepth: 0,
        };
      }
      if (!c.quirkDiscovery) {
        c.quirkDiscovery = {
          discoveredQuirks: [],
          lastDiscoveryCheck: Date.now(),
        };
      }
      this.companions.set(c.id, c);
    }
    this.activeCompanions = data.activeIds; 
  }
}

// Singleton export
export const companionSystem = new CompanionSystemManager();

// Event bus subscriptions
eventBus.subscribe(['COMBAT_WON'], (e) => { if ((e as any).data?.flawlessVictory) companionSystem.processPlayerAction('bravery'); });
eventBus.subscribe(['COMBAT_FLED'], () => companionSystem.processPlayerAction('cowardice'));
eventBus.subscribe(['COMBAT_DEESCALATED'], () => companionSystem.processPlayerAction('diplomacy'));
eventBus.subscribe(['BETRAYAL'], () => companionSystem.processPlayerAction('betrayal'));
eventBus.subscribe(['FAVOR'], () => companionSystem.processPlayerAction('loyalty'));
eventBus.subscribe(['DEATH'], (e) => { if ((e as any).data?.sourceEntity === 'player') companionSystem.processPlayerAction('combat_kill'); });

console.log('[CompanionSystem] Core manager initialized with modular architecture');
