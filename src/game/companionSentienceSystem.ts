// ============================================================================
// COMPANION SENTIENCE SYSTEM
// Autonomous companion decision-making - they choose whether to join
// ============================================================================

import { PersonalityTrait, CompanionState, PlayerActionType } from './companionSystem';
import { RPGCharacter } from '@/types/rpgCharacter';

// ============================================================================
// IMPRESSION LEVELS - Expanded 5-tier system
// ============================================================================

export type ImpressionLevel = 'critical' | 'bad' | 'neutral' | 'good' | 'praised';

export interface FirstImpression {
  level: ImpressionLevel;
  score: number; // -100 to +100
  factors: ImpressionFactor[];
  willingToJoin: boolean;
  overrideRequested: boolean;
  narratorCanOverride: boolean;
}

export interface ImpressionFactor {
  source: string;
  description: string;
  value: number; // -20 to +20 per factor
  category: 'personality' | 'traits' | 'beliefs' | 'appearance' | 'reputation' | 'context';
}

// ============================================================================
// BELIEF SYSTEMS - What companions fundamentally value
// ============================================================================

export type BeliefSystem = 
  | 'honor_code'      // Bound by personal code, respects those with principles
  | 'survivalist'     // Respects strength and pragmatism
  | 'idealist'        // Believes in causes, justice, greater good
  | 'mercenary'       // Follows gold and opportunity
  | 'loyalist'        // Values bonds above all else
  | 'chaotic'         // Unpredictable, values freedom and spontaneity
  | 'spiritual'       // Guided by faith or cosmic forces
  | 'intellectual'    // Values knowledge, cunning, strategy;

export interface CompanionBeliefs {
  primaryBelief: BeliefSystem;
  secondaryBelief?: BeliefSystem;
  dealbreakers: PlayerActionType[]; // Actions that cause instant refusal
  valueAlignment: {
    violence: number;      // -100 (pacifist) to +100 (loves violence)
    honesty: number;       // -100 (loves deception) to +100 (absolute truth)
    wealth: number;        // -100 (ascetic) to +100 (greedy)
    authority: number;     // -100 (anarchist) to +100 (authoritarian)
    compassion: number;    // -100 (ruthless) to +100 (bleeding heart)
  };
}

// ============================================================================
// TRAIT-BASED BELIEF DERIVATION
// ============================================================================

export function deriveBeliefSystem(traits: PersonalityTrait[]): CompanionBeliefs {
  // Determine primary belief based on trait combinations
  let primaryBelief: BeliefSystem = 'survivalist';
  let secondaryBelief: BeliefSystem | undefined;
  
  if (traits.includes('honorable') && traits.includes('brave')) {
    primaryBelief = 'honor_code';
  } else if (traits.includes('spiritual') || traits.includes('forgiving')) {
    primaryBelief = 'spiritual';
  } else if (traits.includes('kind') && traits.includes('generous')) {
    primaryBelief = 'idealist';
  } else if (traits.includes('greedy') && traits.includes('pragmatic')) {
    primaryBelief = 'mercenary';
  } else if (traits.includes('loyal')) {
    primaryBelief = 'loyalist';
  } else if (traits.includes('skeptical') && traits.includes('ambitious')) {
    primaryBelief = 'intellectual';
  } else if (traits.includes('cowardly') || traits.includes('treacherous')) {
    primaryBelief = 'chaotic';
  }
  
  // Secondary belief from remaining traits
  if (traits.includes('pragmatic') && primaryBelief !== 'mercenary') {
    secondaryBelief = 'survivalist';
  } else if (traits.includes('romantic') && primaryBelief !== 'loyalist') {
    secondaryBelief = 'loyalist';
  } else if (traits.includes('vengeful')) {
    secondaryBelief = 'honor_code';
  }
  
  // Derive dealbreakers
  const dealbreakers: PlayerActionType[] = [];
  if (traits.includes('honorable')) dealbreakers.push('betrayal', 'lie', 'cowardice');
  if (traits.includes('kind')) dealbreakers.push('cruelty', 'violence');
  if (traits.includes('loyal')) dealbreakers.push('betrayal', 'treacherous' as any);
  if (traits.includes('brave')) dealbreakers.push('cowardice');
  if (traits.includes('spiritual')) dealbreakers.push('cruelty', 'greed');
  if (traits.includes('generous')) dealbreakers.push('greed', 'theft');
  
  // Calculate value alignment
  const valueAlignment = {
    violence: traits.includes('ruthless') ? 60 : traits.includes('kind') ? -60 : 0,
    honesty: traits.includes('honorable') ? 80 : traits.includes('treacherous') ? -80 : 0,
    wealth: traits.includes('greedy') ? 90 : traits.includes('generous') ? -40 : 0,
    authority: traits.includes('humble') ? -30 : traits.includes('ambitious') ? 50 : 0,
    compassion: traits.includes('kind') ? 80 : traits.includes('cruel') ? -80 : 0,
  };
  
  return {
    primaryBelief,
    secondaryBelief,
    dealbreakers,
    valueAlignment,
  };
}

// ============================================================================
// IMPRESSION THRESHOLDS
// ============================================================================

const IMPRESSION_THRESHOLDS = {
  critical: { min: -100, max: -50 },  // Will never join, may become hostile
  bad: { min: -49, max: -20 },        // Very unlikely to join
  neutral: { min: -19, max: 19 },     // May join if convinced
  good: { min: 20, max: 49 },         // Likely to join
  praised: { min: 50, max: 100 },     // Eager to join, enthusiastic
};

export function getImpressionLevel(score: number): ImpressionLevel {
  if (score <= IMPRESSION_THRESHOLDS.critical.max) return 'critical';
  if (score <= IMPRESSION_THRESHOLDS.bad.max) return 'bad';
  if (score <= IMPRESSION_THRESHOLDS.neutral.max) return 'neutral';
  if (score <= IMPRESSION_THRESHOLDS.good.max) return 'good';
  return 'praised';
}

// ============================================================================
// JOINING DECISION SYSTEM
// ============================================================================

export interface JoiningDecision {
  willJoin: boolean;
  reason: string;
  dialogueResponse: string;
  alternativeCondition?: string; // What could change their mind
  requiresNarratorOverride: boolean;
}

/**
 * Companion autonomously decides whether to join based on their beliefs,
 * first impression, and the player's known actions/reputation.
 */
export function evaluateJoiningDecision(
  companion: CompanionState,
  beliefs: CompanionBeliefs,
  impression: FirstImpression,
  playerReputation?: { honor?: number; infamy?: number; kindness?: number },
  recentPlayerActions?: PlayerActionType[],
): JoiningDecision {
  const { level, score, factors } = impression;
  
  // Check for dealbreakers first
  if (recentPlayerActions) {
    const dealbreaker = recentPlayerActions.find(a => beliefs.dealbreakers.includes(a));
    if (dealbreaker) {
      return {
        willJoin: false,
        reason: `Player committed a dealbreaker action: ${dealbreaker}`,
        dialogueResponse: generateRefusalDialogue(companion, 'dealbreaker', dealbreaker),
        alternativeCondition: 'Only the Narrator can change their mind through roleplay.',
        requiresNarratorOverride: true,
      };
    }
  }
  
  // Critical impression - refuses outright
  if (level === 'critical') {
    return {
      willJoin: false,
      reason: 'Critical first impression - companion refuses to associate with player',
      dialogueResponse: generateRefusalDialogue(companion, 'critical'),
      alternativeCondition: 'Only the Narrator can change their mind through significant story events.',
      requiresNarratorOverride: true,
    };
  }
  
  // Bad impression - very hesitant, needs convincing
  if (level === 'bad') {
    const beliefFactor = getBeliefBasedChance(beliefs);
    const willJoin = Math.random() < (0.15 + beliefFactor); // 15% base + belief modifier
    
    return {
      willJoin,
      reason: willJoin 
        ? `Despite reservations, ${beliefs.primaryBelief} beliefs led them to take a chance`
        : 'Bad first impression - companion is unwilling to join',
      dialogueResponse: willJoin 
        ? generateHesitantAcceptance(companion, beliefs)
        : generateRefusalDialogue(companion, 'bad'),
      alternativeCondition: willJoin ? undefined : 'Ask the Narrator to roleplay a convincing argument.',
      requiresNarratorOverride: !willJoin,
    };
  }
  
  // Neutral impression - 50/50 chance, depends on belief system
  if (level === 'neutral') {
    const beliefFactor = getBeliefBasedChance(beliefs);
    const reputationBonus = playerReputation 
      ? (playerReputation.honor || 0) * 0.01 + (playerReputation.kindness || 0) * 0.01
      : 0;
    const willJoin = Math.random() < (0.5 + beliefFactor + reputationBonus);
    
    return {
      willJoin,
      reason: willJoin 
        ? 'Neutral impression but saw enough potential'
        : 'Neutral impression - companion decided to wait and see',
      dialogueResponse: willJoin 
        ? generateNeutralAcceptance(companion, beliefs)
        : generatePoliteDecline(companion, beliefs),
      alternativeCondition: willJoin ? undefined : 'They might reconsider if you prove yourself.',
      requiresNarratorOverride: !willJoin,
    };
  }
  
  // Good impression - likely to join
  if (level === 'good') {
    // 85% chance to join with good impression
    const willJoin = Math.random() < 0.85;
    
    return {
      willJoin,
      reason: 'Good first impression - companion is favorably inclined',
      dialogueResponse: willJoin 
        ? generateEnthusiasticAcceptance(companion, beliefs)
        : generateUnexpectedDecline(companion),
      alternativeCondition: willJoin ? undefined : 'Something personal holds them back temporarily.',
      requiresNarratorOverride: !willJoin,
    };
  }
  
  // Praised impression - eager to join
  return {
    willJoin: true,
    reason: 'Praised impression - companion is eager and honored to join',
    dialogueResponse: generateEagerAcceptance(companion, beliefs),
    requiresNarratorOverride: false,
  };
}

function getBeliefBasedChance(beliefs: CompanionBeliefs): number {
  // Certain belief systems are more/less likely to take chances
  switch (beliefs.primaryBelief) {
    case 'chaotic': return 0.2;      // Unpredictable, might say yes for fun
    case 'mercenary': return 0.15;   // Will join if there's profit
    case 'idealist': return 0.1;     // Might see potential for good
    case 'loyalist': return -0.1;    // Cautious about new bonds
    case 'honor_code': return 0;     // Follows strict criteria
    case 'survivalist': return 0.05; // Pragmatic assessment
    case 'spiritual': return 0.1;    // Guided by signs
    case 'intellectual': return 0;   // Calculated decision
    default: return 0;
  }
}

// ============================================================================
// FIRST IMPRESSION CALCULATION
// ============================================================================

export function calculateFirstImpression(
  companionTraits: PersonalityTrait[],
  beliefs: CompanionBeliefs,
  playerCharacter?: RPGCharacter,
  playerReputation?: { honor?: number; infamy?: number; kindness?: number; wealth?: number },
  contextualFactors?: { inCombat?: boolean; recentVictory?: boolean; playerInjured?: boolean },
): FirstImpression {
  const factors: ImpressionFactor[] = [];
  let totalScore = 0;
  
  // ====== PERSONALITY FACTORS ======
  // Companion's own personality affects how they view others
  if (companionTraits.includes('skeptical')) {
    factors.push({
      source: 'Skeptical Nature',
      description: 'Naturally distrustful of strangers',
      value: -10,
      category: 'personality',
    });
    totalScore -= 10;
  }
  
  if (companionTraits.includes('kind')) {
    factors.push({
      source: 'Kind Heart',
      description: 'Gives everyone a fair chance',
      value: 10,
      category: 'personality',
    });
    totalScore += 10;
  }
  
  if (companionTraits.includes('cowardly')) {
    factors.push({
      source: 'Cautious Disposition',
      description: 'Hesitant to commit to dangerous company',
      value: -8,
      category: 'personality',
    });
    totalScore -= 8;
  }
  
  if (companionTraits.includes('brave')) {
    factors.push({
      source: 'Bold Spirit',
      description: 'Respects those who take action',
      value: 5,
      category: 'personality',
    });
    totalScore += 5;
  }
  
  if (companionTraits.includes('romantic')) {
    factors.push({
      source: 'Romantic Soul',
      description: 'Drawn to adventure and connection',
      value: 8,
      category: 'personality',
    });
    totalScore += 8;
  }
  
  // ====== BELIEF SYSTEM FACTORS ======
  if (beliefs.primaryBelief === 'mercenary' && playerReputation?.wealth) {
    const wealthBonus = Math.min(15, Math.floor(playerReputation.wealth / 100));
    factors.push({
      source: 'Mercenary Interest',
      description: `Sees potential for profit (${playerReputation.wealth} gold)`,
      value: wealthBonus,
      category: 'beliefs',
    });
    totalScore += wealthBonus;
  }
  
  if (beliefs.primaryBelief === 'honor_code' && playerReputation?.honor) {
    const honorFactor = Math.floor(playerReputation.honor / 5);
    factors.push({
      source: 'Honor Recognition',
      description: 'Respects an honorable reputation',
      value: honorFactor,
      category: 'beliefs',
    });
    totalScore += honorFactor;
  }
  
  if (beliefs.primaryBelief === 'idealist' && playerReputation?.kindness) {
    const kindnessFactor = Math.floor(playerReputation.kindness / 5);
    factors.push({
      source: 'Kindred Spirit',
      description: 'Sees a fellow do-gooder',
      value: kindnessFactor,
      category: 'beliefs',
    });
    totalScore += kindnessFactor;
  }
  
  if (playerReputation?.infamy && playerReputation.infamy > 30) {
    const infamyPenalty = -Math.floor(playerReputation.infamy / 3);
    factors.push({
      source: 'Dark Reputation',
      description: 'Your infamy precedes you',
      value: infamyPenalty,
      category: 'reputation',
    });
    totalScore += infamyPenalty;
    
    // Exception: Some belief systems don't mind
    if (beliefs.primaryBelief === 'chaotic' || beliefs.primaryBelief === 'mercenary') {
      factors.push({
        source: beliefs.primaryBelief === 'chaotic' ? 'Thrives in Chaos' : 'Business is Business',
        description: 'Infamy doesn\'t bother them',
        value: Math.abs(infamyPenalty) / 2,
        category: 'beliefs',
      });
      totalScore += Math.abs(infamyPenalty) / 2;
    }
  }
  
  // ====== CONTEXTUAL FACTORS ======
  if (contextualFactors?.inCombat) {
    // Meeting during combat - heightened emotions
    if (companionTraits.includes('brave')) {
      factors.push({
        source: 'Battle Introduction',
        description: 'Impressed by seeing you fight',
        value: 12,
        category: 'context',
      });
      totalScore += 12;
    } else if (companionTraits.includes('cowardly')) {
      factors.push({
        source: 'Dangerous Situation',
        description: 'Terrified by the combat',
        value: -15,
        category: 'context',
      });
      totalScore -= 15;
    }
  }
  
  if (contextualFactors?.recentVictory) {
    factors.push({
      source: 'Victor\'s Aura',
      description: 'Success breeds respect',
      value: 8,
      category: 'context',
    });
    totalScore += 8;
  }
  
  if (contextualFactors?.playerInjured) {
    if (companionTraits.includes('kind') || companionTraits.includes('generous')) {
      factors.push({
        source: 'Compassionate Response',
        description: 'Wants to help someone in need',
        value: 10,
        category: 'context',
      });
      totalScore += 10;
    } else if (beliefs.primaryBelief === 'survivalist') {
      factors.push({
        source: 'Weakness Assessment',
        description: 'Sees a wounded potential ally as liability',
        value: -8,
        category: 'context',
      });
      totalScore -= 8;
    }
  }
  
  // ====== CHARACTER SHEET FACTORS ======
  if (playerCharacter) {
    // High charisma helps first impressions
    if (playerCharacter.stats.charisma >= 14) {
      const charismaBonus = Math.floor((playerCharacter.stats.charisma - 10) / 2);
      factors.push({
        source: 'Personal Magnetism',
        description: `Charisma ${playerCharacter.stats.charisma} creates a good impression`,
        value: charismaBonus,
        category: 'appearance',
      });
      totalScore += charismaBonus;
    }
    
    // Level/experience commands respect
    if (playerCharacter.level >= 5) {
      const levelBonus = Math.min(10, playerCharacter.level);
      factors.push({
        source: 'Experienced Adventurer',
        description: `Level ${playerCharacter.level} speaks to your experience`,
        value: levelBonus,
        category: 'reputation',
      });
      totalScore += levelBonus;
    }
  }
  
  // Clamp score
  totalScore = Math.max(-100, Math.min(100, totalScore));
  
  const level = getImpressionLevel(totalScore);
  const willingToJoin = level === 'good' || level === 'praised';
  
  return {
    level,
    score: totalScore,
    factors,
    willingToJoin,
    overrideRequested: false,
    narratorCanOverride: level !== 'praised', // Can always try to convince unless already eager
  };
}

// ============================================================================
// DIALOGUE GENERATION
// ============================================================================

function generateRefusalDialogue(companion: CompanionState, reason: 'critical' | 'bad' | 'dealbreaker', dealbreaker?: string): string {
  const name = companion.name;
  const traits = companion.personality.traits;
  
  if (reason === 'dealbreaker' && dealbreaker) {
    const dealbreakersDialogue: Record<string, string[]> = {
      betrayal: [
        `*${name}'s eyes narrow* "I know what you did. I don't associate with traitors."`,
        `"Word travels fast about betrayers. We have nothing to discuss."`,
      ],
      cruelty: [
        `*${name} steps back* "I've heard of your... methods. I want no part of this."`,
        `"The suffering you've caused speaks louder than any offer you could make."`,
      ],
      lie: [
        `"I can see the lies in your eyes. Trust is everything to me."`,
        `*${name} shakes their head* "Liars don't get second chances with me."`,
      ],
      cowardice: [
        `"I've heard you run when things get difficult. I need someone I can count on."`,
        `*${name} looks disappointed* "Cowards make dangerous allies."`,
      ],
    };
    const options = dealbreakersDialogue[dealbreaker] || [`*${name} refuses firmly* "I cannot associate with someone who would do that."`];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (reason === 'critical') {
    const criticalDialogue = [
      `*${name}'s expression hardens* "Stay away from me. I want nothing to do with you."`,
      `"I've made up my mind. Don't waste your breath."`,
      `*${name} turns away coldly* "We're done here. Permanently."`,
      `"Not if you were the last soul alive. Find someone else."`,
    ];
    return criticalDialogue[Math.floor(Math.random() * criticalDialogue.length)];
  }
  
  // Bad impression refusal
  const badDialogue = traits.includes('kind')
    ? [`*${name} hesitates* "I... I'm sorry, but I don't think this is right for me."`, `"Something feels off. I need to decline."`]
    : traits.includes('skeptical')
    ? [`*${name} studies you* "I don't trust this. No."`, `"My instincts say no. I'm going to listen to them."`]
    : [`*${name} shakes their head* "I don't think so."`, `"Not interested. Maybe try someone else."`];
  
  return badDialogue[Math.floor(Math.random() * badDialogue.length)];
}

function generateHesitantAcceptance(companion: CompanionState, beliefs: CompanionBeliefs): string {
  const name = companion.name;
  
  const hesitantDialogue: Record<BeliefSystem, string[]> = {
    honor_code: [`*${name} considers carefully* "...Against my better judgment, I'll give you a chance. Don't make me regret it."`],
    survivalist: [`"Fine. But if things go south, I'm looking out for myself first."`],
    idealist: [`*${name} sighs* "Maybe you deserve a chance to prove yourself. I hope you do."`],
    mercenary: [`"This better be worth my time. What's the pay?"`],
    loyalist: [`"I'll... try. But loyalty is earned, not given."`],
    chaotic: [`*${name} grins unexpectedly* "You know what? Why not. This could be fun."`],
    spiritual: [`*${name} closes their eyes* "...The signs say yes. I hope they're right."`],
    intellectual: [`"The logical choice would be to refuse. But... very well. Consider this an experiment."`],
  };
  
  const options = hesitantDialogue[beliefs.primaryBelief];
  return options[Math.floor(Math.random() * options.length)];
}

function generateNeutralAcceptance(companion: CompanionState, beliefs: CompanionBeliefs): string {
  const name = companion.name;
  
  return `*${name} nods slowly* "Alright. I don't see a reason to refuse... yet. Let's see where this goes."`;
}

function generatePoliteDecline(companion: CompanionState, beliefs: CompanionBeliefs): string {
  const name = companion.name;
  
  return `*${name} offers a respectful nod* "I appreciate the offer, but I need more time to decide. Perhaps our paths will cross again."`;
}

function generateEnthusiasticAcceptance(companion: CompanionState, beliefs: CompanionBeliefs): string {
  const name = companion.name;
  
  const enthusiasticDialogue: Record<BeliefSystem, string[]> = {
    honor_code: [`*${name} clasps your arm* "You have my blade. Let's do this honorably."`],
    survivalist: [`"Smart choice teaming up. Together we'll make it through anything."`],
    idealist: [`*${name}'s eyes light up* "Finally! Someone who might actually make a difference. Count me in!"`],
    mercenary: [`*${name} grins* "Now we're talking. This partnership will be profitable for both of us."`],
    loyalist: [`*${name} meets your eyes* "If you'll have me, I'll stand with you. That's a promise."`],
    chaotic: [`*${name} laughs* "Oh, this is going to be interesting! Let's cause some trouble together!"`],
    spiritual: [`*${name} smiles serenely* "The fates have brought us together. I accept with gratitude."`],
    intellectual: [`"Your proposition is sound. I look forward to seeing how this develops."`],
  };
  
  const options = enthusiasticDialogue[beliefs.primaryBelief];
  return options[Math.floor(Math.random() * options.length)];
}

function generateUnexpectedDecline(companion: CompanionState): string {
  const name = companion.name;
  
  return `*${name} looks conflicted* "I... I wish I could. But there's something I need to handle first. Maybe later."`;
}

function generateEagerAcceptance(companion: CompanionState, beliefs: CompanionBeliefs): string {
  const name = companion.name;
  
  const eagerDialogue = [
    `*${name}'s face breaks into a genuine smile* "I was hoping you'd ask! Absolutely, yes!"`,
    `"You're exactly who I've been looking for. It would be my honor!"`,
    `*${name} extends their hand eagerly* "Partners? I couldn't think of anything better!"`,
    `"Finally! Someone worth following. I'm with you, whatever comes."`,
  ];
  
  return eagerDialogue[Math.floor(Math.random() * eagerDialogue.length)];
}

// ============================================================================
// NARRATOR OVERRIDE SYSTEM
// ============================================================================

export interface NarratorOverride {
  companionId: string;
  previousDecision: JoiningDecision;
  overrideReason: string;
  narrativeJustification: string;
  wasSuccessful: boolean;
}

/**
 * When the player asks the Narrator in-game to convince a companion,
 * the Narrator can attempt an override based on roleplay quality.
 */
export function attemptNarratorOverride(
  companion: CompanionState,
  beliefs: CompanionBeliefs,
  impression: FirstImpression,
  narrativeContext: string,
): NarratorOverride {
  const previousDecision = evaluateJoiningDecision(companion, beliefs, impression);
  
  // Critical impressions are very hard to override (20% chance)
  // Bad impressions can be overridden with good roleplay (50% chance)
  // Neutral is easy (80% chance)
  let overrideChance: number;
  switch (impression.level) {
    case 'critical': overrideChance = 0.20; break;
    case 'bad': overrideChance = 0.50; break;
    case 'neutral': overrideChance = 0.80; break;
    default: overrideChance = 1.0; break;
  }
  
  // Narrative context quality can boost the chance
  // (In practice, the AI would evaluate this - here we simulate)
  const hasCompellingArgument = narrativeContext.length > 50;
  if (hasCompellingArgument) {
    overrideChance = Math.min(0.9, overrideChance + 0.2);
  }
  
  const wasSuccessful = Math.random() < overrideChance;
  
  return {
    companionId: companion.id,
    previousDecision,
    overrideReason: wasSuccessful 
      ? 'Narrator intervention convinced the companion through roleplay'
      : 'The companion remains unconvinced despite the attempt',
    narrativeJustification: narrativeContext,
    wasSuccessful,
  };
}

// ============================================================================
// COMPANION DISPLAY NAME SYSTEM
// For distinguishing important companions from regular NPCs
// ============================================================================

export interface CompanionIdentity {
  fullName: string;           // e.g., "Marcus Stormwind"
  displayName: string;        // e.g., "Marcus" (what player sees in dialogue)
  title?: string;             // e.g., "Sir", "the Wanderer", "of Ironforge"
  characterSheetName: string; // Full formal name for character sheet
  isImportantNPC: boolean;    // true for companions, false for regular NPCs
}

export function buildCompanionIdentity(
  name: string,
  isCompanion: boolean = true,
  title?: string,
): CompanionIdentity {
  const parts = name.split(' ');
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
  
  let characterSheetName = name;
  if (title) {
    characterSheetName = title.includes(name) ? title : `${title} ${name}`;
  }
  
  return {
    fullName: name,
    displayName: firstName,
    title,
    characterSheetName,
    isImportantNPC: isCompanion,
  };
}

// ============================================================================
// IMPRESSION LEVEL DESCRIPTIONS
// ============================================================================

export const IMPRESSION_DESCRIPTIONS: Record<ImpressionLevel, {
  label: string;
  color: string;
  bgColor: string;
  description: string;
  emoji: string;
}> = {
  critical: {
    label: 'Critical',
    color: 'text-red-600',
    bgColor: 'bg-red-500/20',
    description: 'Hostile, refuses all interaction',
    emoji: '💢',
  },
  bad: {
    label: 'Bad',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/20',
    description: 'Distrustful, unlikely to cooperate',
    emoji: '😠',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/30',
    description: 'Undecided, could go either way',
    emoji: '😐',
  },
  good: {
    label: 'Good',
    color: 'text-green-500',
    bgColor: 'bg-green-500/20',
    description: 'Favorable, open to partnership',
    emoji: '😊',
  },
  praised: {
    label: 'Praised',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    description: 'Impressed, eager to join',
    emoji: '🌟',
  },
};

console.log('[CompanionSentience] Autonomous companion decision system initialized');
