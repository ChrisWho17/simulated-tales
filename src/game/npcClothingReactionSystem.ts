// NPC Clothing Reaction System - NPCs comment on player's fashion during dialogue
// Integrates with the fashion reputation system and wardrobe state

import { wardrobeManager, WardrobeState } from './wardrobeSystem';
import { 
  fashionReputationManager, 
  FashionLevel, 
  FASHION_LEVELS 
} from './fashionReputationSystem';
import { ClothingStats, ClothingStyle } from './clothingItemSystem';

// ============= REACTION TYPES =============

export type ClothingReactionType = 
  | 'compliment'       // Positive comment on outfit
  | 'admiration'       // Strong positive (fashion icon level)
  | 'neutral'          // No comment
  | 'subtle_criticism' // Mild negative
  | 'mockery'          // Harsh negative (fashion disaster)
  | 'intimidated'      // Reacting to intimidating outfit
  | 'impressed'        // Noticing high-value items
  | 'style_match'      // NPC shares similar style
  | 'style_clash';     // NPC dislikes the style

export interface ClothingReaction {
  type: ClothingReactionType;
  comment: string;
  shouldInclude: boolean;  // Whether to include in dialogue
  fashionRepChange: number; // How this interaction affects rep
  relationshipBonus: number; // Extra relationship modifier
}

// ============= NPC STYLE PREFERENCES =============

export interface NPCStylePreference {
  preferredStyles: ClothingStyle[];
  dislikedStyles: ClothingStyle[];
  careAboutFashion: number; // 0-100, how much they notice/care
  isIntimidatedByMilitary: boolean;
  impressedByFormal: boolean;
}

/**
 * Generate default style preferences based on NPC traits and occupation
 */
export function generateNPCStylePreference(
  occupation: string,
  traits: string[]
): NPCStylePreference {
  const preference: NPCStylePreference = {
    preferredStyles: ['casual'],
    dislikedStyles: [],
    careAboutFashion: 30,
    isIntimidatedByMilitary: false,
    impressedByFormal: true,
  };

  // Occupation-based preferences
  const occupationLower = occupation.toLowerCase();
  
  if (occupationLower.includes('fashion') || occupationLower.includes('model')) {
    preference.careAboutFashion = 90;
    preference.preferredStyles = ['elegant', 'formal', 'streetwear'];
    preference.dislikedStyles = ['casual'];
  } else if (occupationLower.includes('military') || occupationLower.includes('guard') || occupationLower.includes('soldier')) {
    preference.careAboutFashion = 40;
    preference.preferredStyles = ['military'];
    preference.isIntimidatedByMilitary = false;
  } else if (occupationLower.includes('business') || occupationLower.includes('lawyer') || occupationLower.includes('executive')) {
    preference.careAboutFashion = 70;
    preference.preferredStyles = ['formal', 'elegant'];
    preference.dislikedStyles = ['punk', 'streetwear'];
  } else if (occupationLower.includes('artist') || occupationLower.includes('musician')) {
    preference.careAboutFashion = 60;
    preference.preferredStyles = ['vintage', 'punk', 'streetwear'];
    preference.dislikedStyles = ['formal'];
  } else if (occupationLower.includes('worker') || occupationLower.includes('laborer')) {
    preference.careAboutFashion = 20;
    preference.isIntimidatedByMilitary = true;
  }

  // Trait-based modifications
  if (traits.includes('greedy') || traits.includes('ambitious')) {
    preference.impressedByFormal = true;
    preference.careAboutFashion = Math.min(100, preference.careAboutFashion + 20);
  }
  
  if (traits.includes('fearful') || traits.includes('cowardly') || traits.includes('nervous')) {
    preference.isIntimidatedByMilitary = true;
  }
  
  if (traits.includes('suspicious')) {
    preference.careAboutFashion = Math.min(100, preference.careAboutFashion + 10);
  }

  return preference;
}

// ============= REACTION GENERATION =============

/**
 * Generate NPC's reaction to player's current outfit
 */
export function generateClothingReaction(
  npcPreference: NPCStylePreference,
  npcName: string,
  isFirstMeeting: boolean = false
): ClothingReaction {
  const wardrobeState = wardrobeManager.getState();
  const fashionState = fashionReputationManager.getState();
  const levelInfo = fashionReputationManager.getLevelInfo();
  const clothingStats = wardrobeManager.getCurrentStats();
  
  // Check if NPC even cares enough to comment
  const careThreshold = Math.random() * 100;
  if (careThreshold > npcPreference.careAboutFashion && !isFirstMeeting) {
    return {
      type: 'neutral',
      comment: '',
      shouldInclude: false,
      fashionRepChange: 0,
      relationshipBonus: 0,
    };
  }

  // Check for intimidating outfit
  if (clothingStats.intimidation && clothingStats.intimidation >= 3 && npcPreference.isIntimidatedByMilitary) {
    return generateIntimidatedReaction(npcName, wardrobeState);
  }

  // Check for style match/clash
  const playerStyle = wardrobeState.activeStyle as ClothingStyle;
  if (npcPreference.preferredStyles.includes(playerStyle)) {
    return generateStyleMatchReaction(npcName, playerStyle, fashionState.level);
  }
  if (npcPreference.dislikedStyles.includes(playerStyle)) {
    return generateStyleClashReaction(npcName, playerStyle);
  }

  // Check for formal impression
  if ((playerStyle === 'formal' || playerStyle === 'elegant') && npcPreference.impressedByFormal) {
    return generateFormalImpressionReaction(npcName, clothingStats);
  }

  // Fashion level based reactions
  return generateFashionLevelReaction(npcName, fashionState.level, levelInfo, isFirstMeeting);
}

function generateIntimidatedReaction(npcName: string, state: WardrobeState): ClothingReaction {
  const comments = [
    `*glances nervously at your tactical gear*`,
    `*eyes your imposing outfit warily*`,
    `*takes a step back, noting your military attire*`,
    `"That's... quite an outfit you've got there."`,
    `*seems uncomfortable with your intimidating appearance*`,
  ];

  return {
    type: 'intimidated',
    comment: comments[Math.floor(Math.random() * comments.length)],
    shouldInclude: true,
    fashionRepChange: 2,
    relationshipBonus: -5, // They're scared, not impressed
  };
}

function generateStyleMatchReaction(npcName: string, style: ClothingStyle, level: FashionLevel): ClothingReaction {
  const styleComments: Record<ClothingStyle, string[]> = {
    casual: [`"Nice and relaxed, I like it."`, `"You've got that effortless look going on."`],
    formal: [`"Ah, someone who appreciates proper attire."`, `"Looking sharp! I respect that."`],
    military: [`"A fellow tactical enthusiast, I see."`, `"Nice kit. You know your gear."`],
    streetwear: [`"Love the streetwear vibes!"`, `"That fit is fire."`],
    vintage: [`"Oh, I love your retro style!"`, `"Classic fashion never dies, right?"`],
    athletic: [`"Sporty look! I dig it."`, `"Ready for action, I see."`],
    punk: [`"Hell yeah, nice punk aesthetic!"`, `"Love the rebellious look."`],
    elegant: [`"Such refined taste!"`, `"Absolutely stunning attire."`],
  };

  const comments = styleComments[style] || [`"Nice style!"`];
  
  return {
    type: 'style_match',
    comment: comments[Math.floor(Math.random() * comments.length)],
    shouldInclude: true,
    fashionRepChange: 5,
    relationshipBonus: 5,
  };
}

function generateStyleClashReaction(npcName: string, style: ClothingStyle): ClothingReaction {
  const comments = [
    `*eyes your outfit with barely concealed disapproval*`,
    `"Interesting... fashion choice."`,
    `*raises an eyebrow at your attire*`,
    `"That's certainly... a look."`,
  ];

  return {
    type: 'style_clash',
    comment: comments[Math.floor(Math.random() * comments.length)],
    shouldInclude: Math.random() > 0.5, // Only sometimes mention it
    fashionRepChange: -2,
    relationshipBonus: -2,
  };
}

function generateFormalImpressionReaction(npcName: string, stats: ClothingStats): ClothingReaction {
  const charisma = stats.charisma || 0;
  
  if (charisma >= 5) {
    return {
      type: 'admiration',
      comment: `*is clearly impressed by your impeccable attire* "You certainly know how to dress."`,
      shouldInclude: true,
      fashionRepChange: 5,
      relationshipBonus: 8,
    };
  }

  return {
    type: 'impressed',
    comment: `"You clean up nicely."`,
    shouldInclude: true,
    fashionRepChange: 3,
    relationshipBonus: 3,
  };
}

function generateFashionLevelReaction(
  npcName: string, 
  level: FashionLevel, 
  levelInfo: { icon: string; label: string },
  isFirstMeeting: boolean
): ClothingReaction {
  // Fashion Icon - always get admiration
  if (level === 'fashion_icon') {
    const comments = [
      `*does a double-take at your stunning outfit* "Wow, you look absolutely incredible!"`,
      `"Now THAT is how you dress. I'm impressed."`,
      `*is visibly in awe of your fashion sense*`,
      `"Are you a model or something? That outfit is amazing."`,
    ];
    return {
      type: 'admiration',
      comment: comments[Math.floor(Math.random() * comments.length)],
      shouldInclude: true,
      fashionRepChange: 8,
      relationshipBonus: 10,
    };
  }

  // Fashionable - often get compliments
  if (level === 'fashionable') {
    const comments = [
      `"Looking good! I love your style."`,
      `*nods approvingly at your outfit*`,
      `"Nice outfit!"`,
    ];
    return {
      type: 'compliment',
      comment: comments[Math.floor(Math.random() * comments.length)],
      shouldInclude: Math.random() > 0.3,
      fashionRepChange: 4,
      relationshipBonus: 4,
    };
  }

  // Well Dressed - occasional compliments
  if (level === 'well_dressed') {
    const comments = [
      `"You look nice today."`,
      `*glances at your outfit with approval*`,
    ];
    return {
      type: 'compliment',
      comment: comments[Math.floor(Math.random() * comments.length)],
      shouldInclude: Math.random() > 0.5,
      fashionRepChange: 2,
      relationshipBonus: 2,
    };
  }

  // Average - no comments
  if (level === 'average') {
    return {
      type: 'neutral',
      comment: '',
      shouldInclude: false,
      fashionRepChange: 0,
      relationshipBonus: 0,
    };
  }

  // Poorly Dressed - occasional criticism
  if (level === 'poorly_dressed') {
    const comments = [
      `*eyes your outfit skeptically*`,
      `"Uh... rough morning?"`,
    ];
    return {
      type: 'subtle_criticism',
      comment: comments[Math.floor(Math.random() * comments.length)],
      shouldInclude: Math.random() > 0.6,
      fashionRepChange: -2,
      relationshipBonus: -2,
    };
  }

  // Fashion Disaster - mockery or avoidance
  const comments = [
    `*visibly winces at your outfit*`,
    `"Did you... lose a bet or something?"`,
    `*struggles not to comment on your appearance*`,
    `"That's certainly... brave."`,
  ];
  return {
    type: 'mockery',
    comment: comments[Math.floor(Math.random() * comments.length)],
    shouldInclude: Math.random() > 0.4,
    fashionRepChange: -5,
    relationshipBonus: -5,
  };
}

// ============= AI CONTEXT BUILDING =============

/**
 * Build clothing context for AI dialogue generation
 * This gets injected into the NPC dialogue prompt
 */
export function buildClothingContextForDialogue(): string {
  const wardrobeState = wardrobeManager.getState();
  const fashionState = fashionReputationManager.getState();
  const levelInfo = fashionReputationManager.getLevelInfo();
  const clothingStats = wardrobeManager.getCurrentStats();
  
  const equippedItems = wardrobeManager.getEquippedList();
  
  if (equippedItems.length === 0) {
    return `The player is wearing plain, unremarkable clothing.`;
  }

  const lines: string[] = [
    `PLAYER'S CURRENT OUTFIT:`,
  ];

  // Describe key pieces
  for (const wi of equippedItems.slice(0, 4)) { // Limit to 4 items for brevity
    lines.push(`- ${wi.item.name}: ${wi.item.description}`);
  }

  lines.push(`\nOverall Style: ${wardrobeState.activeStyle}`);
  lines.push(`Fashion Reputation: ${levelInfo.label} (${fashionState.score} points)`);

  // Notable stats that might affect perception
  if (clothingStats.charisma && clothingStats.charisma >= 3) {
    lines.push(`The player's outfit is notably stylish and charismatic.`);
  }
  if (clothingStats.intimidation && clothingStats.intimidation >= 3) {
    lines.push(`The player's attire is intimidating and commands attention.`);
  }
  if (clothingStats.defense && clothingStats.defense >= 3) {
    lines.push(`The player is wearing protective/tactical gear.`);
  }

  // Fashion level hints for AI
  if (fashionState.level === 'fashion_icon') {
    lines.push(`\nThe player is a FASHION ICON - their style is legendary. NPCs should be impressed and potentially comment positively.`);
  } else if (fashionState.level === 'fashion_disaster') {
    lines.push(`\nThe player's outfit is a FASHION DISASTER - they look terrible. NPCs might react negatively or make comments.`);
  }

  return lines.join('\n');
}

/**
 * Record an interaction with an NPC based on clothing reaction
 */
export function recordClothingInteraction(
  npcId: string, 
  reaction: ClothingReaction
): void {
  if (reaction.fashionRepChange !== 0) {
    fashionReputationManager.recordInteraction(
      npcId,
      reaction.fashionRepChange > 0,
      reaction.type
    );
  }
}

// ============= EXPORTS =============

export const NPCClothingReactions = {
  generateReaction: generateClothingReaction,
  generatePreference: generateNPCStylePreference,
  buildDialogueContext: buildClothingContextForDialogue,
  recordInteraction: recordClothingInteraction,
};
