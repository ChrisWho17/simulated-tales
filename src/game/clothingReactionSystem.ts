// ============================================================================
// CLOTHING REACTION SYSTEM
// NPCs react when player clothing style conflicts with genre expectations
// ============================================================================

import { CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS } from '@/types/characterCreation';

// Genre-appropriate clothing mappings
export const GENRE_CLOTHING_EXPECTATIONS: Record<string, {
  appropriate: string[];
  tolerated: string[];
  shocking: string[];
  defaultAppropriate: string[];
}> = {
  fantasy: {
    appropriate: ['genre_default', 'modest', 'vintage', 'bohemian'],
    tolerated: ['formal', 'military', 'minimalist'],
    shocking: ['streetwear', 'punk', 'athletic', 'revealing', 'cosplay'],
    defaultAppropriate: ['tunics', 'robes', 'leather armor', 'cloaks', 'medieval attire']
  },
  scifi: {
    appropriate: ['genre_default', 'military', 'minimalist', 'athletic', 'formal'],
    tolerated: ['streetwear', 'punk', 'revealing'],
    shocking: ['vintage', 'bohemian', 'goth', 'cosplay'],
    defaultAppropriate: ['jumpsuits', 'utility wear', 'synthetic fabrics', 'tech-integrated clothing']
  },
  cyberpunk: {
    appropriate: ['genre_default', 'streetwear', 'punk', 'military', 'revealing', 'goth'],
    tolerated: ['athletic', 'minimalist', 'extravagant'],
    shocking: ['formal', 'vintage', 'bohemian', 'modest', 'cosplay'],
    defaultAppropriate: ['neon accents', 'leather', 'synthetic materials', 'tech-wear']
  },
  horror: {
    appropriate: ['genre_default', 'casual', 'modest', 'vintage'],
    tolerated: ['goth', 'punk', 'military'],
    shocking: ['extravagant', 'revealing', 'cosplay', 'athletic'],
    defaultAppropriate: ['practical clothing', 'everyday wear', 'weather-appropriate']
  },
  mystery: {
    appropriate: ['genre_default', 'formal', 'vintage', 'casual', 'minimalist'],
    tolerated: ['modest', 'military'],
    shocking: ['punk', 'goth', 'revealing', 'extravagant', 'cosplay', 'streetwear'],
    defaultAppropriate: ['trench coats', 'suits', 'professional attire', 'noir fashion']
  },
  western: {
    appropriate: ['genre_default', 'vintage', 'casual', 'modest'],
    tolerated: ['military', 'bohemian'],
    shocking: ['punk', 'goth', 'streetwear', 'athletic', 'formal', 'revealing', 'cosplay'],
    defaultAppropriate: ['cowboy hats', 'boots', 'denim', 'leather vests', 'frontier wear']
  },
  pirate: {
    appropriate: ['genre_default', 'vintage', 'bohemian', 'revealing'],
    tolerated: ['extravagant', 'casual'],
    shocking: ['formal', 'military', 'athletic', 'punk', 'goth', 'streetwear', 'cosplay'],
    defaultAppropriate: ['tricorn hats', 'loose shirts', 'breeches', 'boots', 'sashes']
  },
  postapoc: {
    appropriate: ['genre_default', 'military', 'casual', 'punk'],
    tolerated: ['athletic', 'modest', 'streetwear'],
    shocking: ['formal', 'extravagant', 'goth', 'vintage', 'cosplay', 'bohemian'],
    defaultAppropriate: ['scavenged clothing', 'practical layers', 'weathered gear', 'protective wear']
  },
  war: {
    appropriate: ['genre_default', 'military', 'casual', 'modest'],
    tolerated: ['athletic', 'minimalist'],
    shocking: ['extravagant', 'revealing', 'goth', 'punk', 'cosplay', 'formal'],
    defaultAppropriate: ['uniforms', 'combat gear', 'practical clothing', 'military surplus']
  },
  romance: {
    appropriate: ['genre_default', 'formal', 'casual', 'vintage', 'revealing', 'extravagant'],
    tolerated: ['bohemian', 'minimalist', 'modest', 'goth'],
    shocking: ['military', 'punk', 'athletic', 'cosplay'],
    defaultAppropriate: ['elegant dresses', 'suits', 'fashionable attire', 'romantic styles']
  },
  urban: {
    appropriate: ['genre_default', 'streetwear', 'casual', 'athletic', 'punk', 'formal'],
    tolerated: ['goth', 'minimalist', 'vintage', 'revealing'],
    shocking: ['cosplay', 'extravagant', 'bohemian'],
    defaultAppropriate: ['modern fashion', 'streetwear brands', 'urban casual']
  },
  slice_of_life: {
    appropriate: ['genre_default', 'casual', 'formal', 'athletic', 'minimalist', 'streetwear'],
    tolerated: ['vintage', 'bohemian', 'modest', 'punk', 'goth'],
    shocking: ['cosplay', 'military', 'extravagant'],
    defaultAppropriate: ['everyday clothing', 'comfortable wear', 'situational attire']
  }
};

// Clothing detail shock values - how much each item stands out
export const CLOTHING_SHOCK_VALUES: Record<string, number> = {
  // High shock (revealing/unusual)
  'mesh_top': 3,
  'bodysuit': 2,
  'catsuit': 3,
  'harness': 3,
  'short_shorts': 2,
  'mini_skirt': 2,
  'slit_skirt': 2,
  'backless': 2,
  'deep_v': 2,
  'crop_top': 1,
  'stockings': 1,
  'barefoot': 2,
  'heels': 1,
  'boots_thigh': 2,
  // Medium shock (style-dependent)
  'leather_pants': 1,
  'leather_jacket': 1,
  'corset': 2,
  'collar': 2,
  'gloves_long': 1,
  'cape': 1,
  // Low shock (common)
  'hoodie': 0,
  'cargo_pants': 0,
  'combat_boots': 0,
  'ripped_jeans': 1,
  'tank_top': 1,
  'off_shoulder': 1,
  'jumpsuit': 0,
  'gown': 1,
};

export interface ClothingContext {
  clothingStyle?: string;
  clothingDetails?: string[];
  piercings?: string[];
  tattoos?: string[];
  prosthetics?: string[];
  implants?: string[];
  mutations?: string[];
}

export interface ClothingReaction {
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  trustModifier: number;
  respectModifier: number;
  dialogueModifiers: string[];
  internalThoughts: string[];
  possibleComments: string[];
  npcBehaviorTriggers: string[];
}

// ============================================================================
// CORE REACTION CALCULATION
// ============================================================================

export function evaluateClothingConflict(
  clothing: ClothingContext,
  genre: string,
  npcRole?: string,
  locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred'
): ClothingReaction {
  const genreExpectations = GENRE_CLOTHING_EXPECTATIONS[genre.toLowerCase()] || 
                            GENRE_CLOTHING_EXPECTATIONS['slice_of_life'];
  
  let conflictScore = 0;
  const dialogueModifiers: string[] = [];
  const internalThoughts: string[] = [];
  const possibleComments: string[] = [];
  const npcBehaviorTriggers: string[] = [];

  // Check main clothing style
  const style = clothing.clothingStyle || 'genre_default';
  
  if (genreExpectations.shocking.includes(style)) {
    conflictScore += 30;
    dialogueModifiers.push('visibly_uncomfortable');
    internalThoughts.push(`What are they wearing? That's completely out of place here.`);
    possibleComments.push(
      `"You're not from around here, are you?"`,
      `"That's... an interesting choice of attire."`,
      `"I've never seen anyone dressed quite like that before."`
    );
  } else if (genreExpectations.tolerated.includes(style)) {
    conflictScore += 10;
    dialogueModifiers.push('mildly_curious');
    internalThoughts.push(`Unusual clothing, but not unheard of.`);
  }
  
  // Check clothing details for shock value
  if (clothing.clothingDetails?.length) {
    let detailShock = 0;
    const shockingItems: string[] = [];
    
    for (const detail of clothing.clothingDetails) {
      const shock = CLOTHING_SHOCK_VALUES[detail] || 0;
      detailShock += shock;
      if (shock >= 2) {
        const opt = CLOTHING_DETAIL_OPTIONS.find(o => o.value === detail);
        shockingItems.push(opt?.label || detail);
      }
    }
    
    conflictScore += detailShock * 5;
    
    if (shockingItems.length > 0) {
      internalThoughts.push(`Those ${shockingItems.join(' and ')}... quite bold.`);
      possibleComments.push(
        `"You certainly know how to make an entrance."`,
        `"I see you're not one for subtlety."`
      );
    }
  }

  // Check body modifications for genre appropriateness
  if (clothing.piercings?.length) {
    const genresAcceptingPiercings = ['cyberpunk', 'punk', 'urban', 'scifi'];
    if (!genresAcceptingPiercings.includes(genre.toLowerCase())) {
      conflictScore += clothing.piercings.length * 3;
      if (clothing.piercings.length > 3) {
        internalThoughts.push(`All those piercings... unusual for these parts.`);
        possibleComments.push(`"That must have hurt to get all those."`);
      }
    }
  }

  if (clothing.tattoos?.length) {
    const genresAcceptingTattoos = ['cyberpunk', 'pirate', 'postapoc', 'war', 'urban'];
    if (!genresAcceptingTattoos.includes(genre.toLowerCase())) {
      conflictScore += clothing.tattoos.length * 2;
      if (clothing.tattoos.length > 2) {
        internalThoughts.push(`Heavily marked... wonder what their story is.`);
        possibleComments.push(`"Those marks you carry... they mean something, don't they?"`);
      }
    }
  }

  // Cybernetics/prosthetics in non-tech genres
  if (clothing.prosthetics?.length || clothing.implants?.length) {
    const techGenres = ['cyberpunk', 'scifi', 'postapoc'];
    if (!techGenres.includes(genre.toLowerCase())) {
      conflictScore += (clothing.prosthetics?.length || 0) * 10;
      conflictScore += (clothing.implants?.length || 0) * 8;
      internalThoughts.push(`What manner of sorcery or craft made those... additions?`);
      possibleComments.push(
        `"Your... enhancements. They're unlike anything I've seen."`,
        `"Are you man, machine, or something else entirely?"`
      );
      npcBehaviorTriggers.push('wary_of_unknown');
    }
  }

  // Mutations in most genres
  if (clothing.mutations?.length) {
    const mutationAcceptingGenres = ['postapoc', 'scifi', 'horror', 'fantasy'];
    if (!mutationAcceptingGenres.includes(genre.toLowerCase())) {
      conflictScore += clothing.mutations.length * 15;
      internalThoughts.push(`What happened to them? Is it contagious?`);
      possibleComments.push(
        `"Stay back! What... what ARE you?"`,
        `"I've heard of people like you. Thought they were just stories."`
      );
      npcBehaviorTriggers.push('fear_of_unknown', 'keeps_distance');
    } else if (genre.toLowerCase() === 'postapoc') {
      // Post-apoc accepts mutations more
      conflictScore += clothing.mutations.length * 3;
      possibleComments.push(`"The wasteland changes all of us, one way or another."`);
    }
  }

  // Location formality adjustment
  if (locationFormality) {
    if (locationFormality === 'formal' && (style === 'casual' || style === 'punk' || style === 'streetwear')) {
      conflictScore += 15;
      possibleComments.push(
        `"This is a respectable establishment. Perhaps you didn't get the dress code?"`,
        `"I'm afraid we have... standards here."`
      );
      npcBehaviorTriggers.push('dismissive');
    }
    if (locationFormality === 'sacred' && (style === 'revealing' || style === 'punk' || style === 'extravagant')) {
      conflictScore += 25;
      possibleComments.push(
        `"This is holy ground. Show some respect."`,
        `"Your attire... it's not appropriate for this place."`
      );
      npcBehaviorTriggers.push('offended', 'demands_respect');
    }
    if (locationFormality === 'dangerous' && (style === 'formal' || style === 'extravagant')) {
      conflictScore += 10;
      possibleComments.push(
        `"You look like you've got money. Wrong neighborhood for that."`,
        `"Dressed like that, you're just asking for trouble."`
      );
      npcBehaviorTriggers.push('opportunistic', 'predatory');
    }
  }

  // NPC role adjustments
  if (npcRole) {
    const roleLower = npcRole.toLowerCase();
    if (/guard|soldier|knight|officer|police/i.test(roleLower)) {
      // Guards care more about threatening/unusual appearances
      conflictScore = Math.floor(conflictScore * 1.3);
      if (conflictScore > 20) {
        possibleComments.push(
          `"Hold it. You look suspicious. State your business."`,
          `"I'll be keeping my eye on you."`
        );
        npcBehaviorTriggers.push('suspicious', 'watching');
      }
    }
    if (/noble|lord|lady|aristocrat/i.test(roleLower)) {
      // Nobles are more easily offended by inappropriate dress
      conflictScore = Math.floor(conflictScore * 1.5);
      if (conflictScore > 20) {
        possibleComments.push(
          `"How quaint. Is this some peasant fashion I'm unaware of?"`,
          `"I see standards have fallen since last I ventured among the common folk."`
        );
        npcBehaviorTriggers.push('condescending', 'dismissive');
      }
    }
    if (/merchant|trader|shopkeeper/i.test(roleLower)) {
      // Merchants adjust pricing based on how you look
      if (style === 'extravagant' || style === 'formal') {
        possibleComments.push(`"Ah, a customer of refined tastes! I have just the thing..."`);
        npcBehaviorTriggers.push('markup_prices');
      } else if (conflictScore > 30) {
        possibleComments.push(`"I run a respectable business here..."`);
        npcBehaviorTriggers.push('wary', 'watches_closely');
      }
    }
    if (/criminal|thief|gangster/i.test(roleLower)) {
      // Criminals see vulnerability or kinship
      if (style === 'punk' || style === 'streetwear') {
        conflictScore = Math.max(0, conflictScore - 20);
        possibleComments.push(`"Nice threads. You know the streets."`);
        npcBehaviorTriggers.push('recognizes_kindred');
      } else if (style === 'formal' || style === 'extravagant') {
        possibleComments.push(`"You've got money. Maybe we can do business... one way or another."`);
        npcBehaviorTriggers.push('sees_opportunity');
      }
    }
  }

  // Determine severity
  let severity: 'none' | 'mild' | 'moderate' | 'severe';
  let trustModifier = 0;
  let respectModifier = 0;

  if (conflictScore <= 5) {
    severity = 'none';
  } else if (conflictScore <= 20) {
    severity = 'mild';
    trustModifier = -2;
    respectModifier = -3;
    dialogueModifiers.push('slightly_guarded');
  } else if (conflictScore <= 40) {
    severity = 'moderate';
    trustModifier = -8;
    respectModifier = -10;
    dialogueModifiers.push('noticeably_uncomfortable', 'formal_distance');
  } else {
    severity = 'severe';
    trustModifier = -15;
    respectModifier = -20;
    dialogueModifiers.push('hostile_undertone', 'keeps_distance', 'cuts_conversation_short');
    npcBehaviorTriggers.push('calls_attention', 'refuses_service');
  }

  return {
    severity,
    trustModifier,
    respectModifier,
    dialogueModifiers,
    internalThoughts,
    possibleComments,
    npcBehaviorTriggers
  };
}

// ============================================================================
// AI CONTEXT BUILDING
// ============================================================================

export function buildClothingReactionContext(
  clothing: ClothingContext,
  genre: string,
  activeNPCs?: { name: string; role?: string }[]
): string {
  const baseReaction = evaluateClothingConflict(clothing, genre);
  
  if (baseReaction.severity === 'none') {
    return ''; // No special context needed
  }

  const lines: string[] = [
    '### PLAYER APPEARANCE CONTEXT',
    ''
  ];

  // Describe what player is wearing
  const style = clothing.clothingStyle || 'genre_default';
  const styleLabel = CLOTHING_STYLE_OPTIONS.find(o => o.value === style)?.label || style;
  lines.push(`Player is wearing: ${styleLabel} style clothing`);
  
  if (clothing.clothingDetails?.length) {
    const details = clothing.clothingDetails.map(d => 
      CLOTHING_DETAIL_OPTIONS.find(o => o.value === d)?.label || d
    ).join(', ');
    lines.push(`Notable items: ${details}`);
  }

  // Describe genre expectations
  const expectations = GENRE_CLOTHING_EXPECTATIONS[genre.toLowerCase()];
  if (expectations) {
    lines.push(`Genre (${genre}) expects: ${expectations.defaultAppropriate.slice(0, 3).join(', ')}`);
  }

  // Conflict level
  lines.push('');
  lines.push(`**Appearance Conflict Level: ${baseReaction.severity.toUpperCase()}**`);
  
  if (baseReaction.internalThoughts.length > 0) {
    lines.push(`NPCs are thinking: "${baseReaction.internalThoughts[0]}"`);
  }

  // Reaction guidance
  lines.push('');
  lines.push('**NPC Reaction Guidance:**');
  
  if (baseReaction.severity === 'mild') {
    lines.push('- NPCs may glance twice or pause briefly');
    lines.push('- Slight wariness in initial interactions');
    lines.push('- Some may comment obliquely');
  } else if (baseReaction.severity === 'moderate') {
    lines.push('- NPCs noticeably uncomfortable or curious');
    lines.push('- Guards/authority figures pay extra attention');
    lines.push('- Some may refuse service or keep distance');
    lines.push('- Direct comments about appearance likely');
  } else if (baseReaction.severity === 'severe') {
    lines.push('- NPCs openly hostile, fearful, or fascinated');
    lines.push('- Authority figures likely to intervene');
    lines.push('- Many will refuse interaction entirely');
    lines.push('- Player stands out dramatically - consequences follow');
  }

  // Specific NPC reactions if provided
  if (activeNPCs && activeNPCs.length > 0) {
    lines.push('');
    lines.push('**Specific NPC Reactions:**');
    for (const npc of activeNPCs.slice(0, 3)) {
      const reaction = evaluateClothingConflict(clothing, genre, npc.role);
      if (reaction.possibleComments.length > 0) {
        lines.push(`- ${npc.name}: ${reaction.possibleComments[0]}`);
      }
    }
  }

  return lines.join('\n');
}

// ============================================================================
// DIALOGUE MODIFICATION
// ============================================================================

export function getClothingDialogueModification(
  reaction: ClothingReaction,
  npcPersonality?: string
): { prefix?: string; suffix?: string; toneAdjustment?: string } {
  if (reaction.severity === 'none') {
    return {};
  }

  const modifications: { prefix?: string; suffix?: string; toneAdjustment?: string } = {};

  // Add subtle indicators based on severity
  if (reaction.severity === 'mild') {
    modifications.toneAdjustment = 'slightly guarded, occasional glances at outfit';
  } else if (reaction.severity === 'moderate') {
    modifications.toneAdjustment = 'noticeably uncomfortable, formal and distant';
    modifications.prefix = '*eyes your unusual attire before speaking*';
  } else if (reaction.severity === 'severe') {
    modifications.toneAdjustment = 'hostile or fearful undertone, reluctant to engage';
    modifications.prefix = '*visibly taken aback by your appearance*';
    modifications.suffix = '*keeps one hand near a weapon/door/exit*';
  }

  return modifications;
}

// ============================================================================
// STORAGE & INTEGRATION
// ============================================================================

let currentPlayerClothing: ClothingContext = {};
let currentGenre: string = 'fantasy';

export function setPlayerClothingContext(clothing: ClothingContext): void {
  currentPlayerClothing = clothing;
}

export function setClothingReactionGenre(genre: string): void {
  currentGenre = genre;
}

export function getPlayerClothingReaction(npcRole?: string, locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred'): ClothingReaction {
  return evaluateClothingConflict(currentPlayerClothing, currentGenre, npcRole, locationFormality);
}

export function getCurrentClothingContext(): string {
  return buildClothingReactionContext(currentPlayerClothing, currentGenre);
}
