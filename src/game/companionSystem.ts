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
      companion.affinity = Math.max(-100, Math.min(100, companion.affinity + reaction.affinityChange));
      
      if (reaction.affinityChange > 0) {
        companion.trust = Math.min(100, companion.trust + Math.abs(reaction.affinityChange) * 0.5);
        companion.respect = Math.min(100, companion.respect + Math.abs(reaction.affinityChange) * 0.3);
      } else if (reaction.affinityChange < 0) {
        companion.trust = Math.max(0, companion.trust - Math.abs(reaction.affinityChange) * 0.5);
        if (actionType === 'cruelty' || actionType === 'violence') {
          companion.fear = Math.min(100, companion.fear + Math.abs(reaction.affinityChange) * 0.3);
        }
      }
      
      this.addMemory(companionId, 'action', reaction.description, reaction.affinityChange, actionType);
      this.updateMood(companion, reaction.affinityChange);
      
      if (Math.abs(reaction.affinityChange) >= 5) {
        companion.wantsToSpeak = true;
        companion.pendingReaction = reaction.dialogue;
      }
      
      this.checkThresholds(companion);
    }
  }
  
  private calculateReaction(companion: CompanionState, actionType: PlayerActionType, context?: string): ReactionResult {
    let affinityChange = REACTION_VALUES[actionType] || 0;
    const approves = companion.personality.approves.includes(actionType);
    const disapproves = companion.personality.disapproves.includes(actionType);
    let dialogue = '';
    
    if (approves) {
      affinityChange = Math.abs(affinityChange) * 1.5;
      dialogue = generateApprovalDialogue(companion, actionType);
    } else if (disapproves) {
      affinityChange = -Math.abs(affinityChange) * 1.5;
      dialogue = generateDisapprovalDialogue(companion, actionType);
    } else {
      affinityChange = affinityChange * (0.5 + Math.random() * 0.5);
      dialogue = generateNeutralDialogue(companion, actionType);
    }
    
    return { affinityChange: Math.round(affinityChange), description: `Witnessed: ${actionType}`, dialogue };
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
  
  private addMemory(companionId: string, type: 'action' | 'dialogue' | 'event' | 'gift' | 'betrayal', description: string, affinityChange: number, playerAction?: PlayerActionType): void {
    const companion = this.companions.get(companionId);
    if (!companion) return;
    
    companion.memories.push({ timestamp: Date.now(), type, description, affinityChange, playerAction, forgotten: false });
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
