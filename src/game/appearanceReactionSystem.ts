// ============================================================================
// APPEARANCE REACTION SYSTEM
// NPCs react to player's piercings, tattoos, and body modifications
// Affects reputation, dialogue, and relationship modifiers
// ============================================================================

import { PIERCING_STYLE_OPTIONS } from '@/components/adventure/AppearanceAccordions';
import { TATTOO_STYLE_OPTIONS } from '@/types/characterCreation';

// ============= REPUTATION TYPES =============

export type AppearanceReputationType = 
  | 'professional'   // Conservative, business-friendly
  | 'sophisticated'  // High-class, refined
  | 'rebellious'     // Counter-culture, punk
  | 'spiritual'      // Traditional, cultural
  | 'intimidating'   // Aggressive, threatening
  | 'futuristic'     // Tech-forward, modern
  | 'artistic'       // Creative, expressive
  | 'criminal'       // Underground, gang-affiliated
  | 'traditional'    // Classic, conservative
  | 'neutral';       // No strong impression

export interface AppearanceReactionModifiers {
  trustModifier: number;
  respectModifier: number;
  fearModifier: number;
  attractionModifier: number;
}

export interface AppearanceReaction {
  type: 'positive' | 'negative' | 'neutral' | 'intimidated' | 'impressed';
  comment: string;
  modifiers: AppearanceReactionModifiers;
  shouldTrigger: boolean;
}

// ============= NPC APPEARANCE PREFERENCES =============

export interface NPCAppearancePreference {
  // How much they care about piercings/tattoos (0-100)
  careLevel: number;
  // Styles they like
  preferredStyles: AppearanceReputationType[];
  // Styles they dislike
  dislikedStyles: AppearanceReputationType[];
  // Are they intimidated by extreme looks?
  intimidatedByExtreme: boolean;
  // Are they impressed by artistic expression?
  appreciatesArt: boolean;
  // Genre context affects tolerance
  genreContext: string;
}

// ============= STYLE REPUTATION MAPPINGS =============

export const PIERCING_REPUTATION_MAP: Record<string, AppearanceReputationType> = {
  minimal: 'professional',
  elegant: 'sophisticated',
  edgy: 'rebellious',
  tribal: 'spiritual',
  extreme: 'intimidating',
  cybernetic: 'futuristic',
};

export const TATTOO_REPUTATION_MAP: Record<string, AppearanceReputationType> = {
  traditional: 'traditional',
  tribal: 'spiritual',
  japanese: 'artistic',
  realistic: 'artistic',
  watercolor: 'artistic',
  geometric: 'sophisticated',
  blackwork: 'rebellious',
  minimalist: 'professional',
  cybernetic: 'futuristic',
  gang: 'criminal',
  prison: 'criminal',
  sleeve: 'rebellious',
  subtle: 'professional',
};

// ============= GENRE TOLERANCE LEVELS =============

export const GENRE_APPEARANCE_TOLERANCE: Record<string, {
  acceptedStyles: AppearanceReputationType[];
  shockedBy: AppearanceReputationType[];
  bonusStyles: AppearanceReputationType[];
}> = {
  fantasy: {
    acceptedStyles: ['traditional', 'spiritual', 'artistic'],
    shockedBy: ['futuristic', 'criminal', 'rebellious'],
    bonusStyles: ['spiritual', 'artistic'],
  },
  cyberpunk: {
    acceptedStyles: ['futuristic', 'rebellious', 'intimidating', 'criminal', 'artistic'],
    shockedBy: ['traditional', 'professional'],
    bonusStyles: ['futuristic', 'rebellious'],
  },
  scifi: {
    acceptedStyles: ['futuristic', 'professional', 'artistic'],
    shockedBy: ['traditional', 'spiritual'],
    bonusStyles: ['futuristic'],
  },
  horror: {
    acceptedStyles: ['traditional', 'spiritual', 'intimidating'],
    shockedBy: ['sophisticated'],
    bonusStyles: ['spiritual'],
  },
  mystery: {
    acceptedStyles: ['professional', 'sophisticated', 'traditional'],
    shockedBy: ['intimidating', 'criminal', 'rebellious'],
    bonusStyles: ['sophisticated'],
  },
  western: {
    acceptedStyles: ['traditional', 'intimidating'],
    shockedBy: ['futuristic', 'sophisticated'],
    bonusStyles: ['traditional'],
  },
  urban: {
    acceptedStyles: ['rebellious', 'artistic', 'futuristic', 'criminal'],
    shockedBy: [],
    bonusStyles: ['artistic', 'rebellious'],
  },
  romance: {
    acceptedStyles: ['sophisticated', 'artistic', 'professional'],
    shockedBy: ['criminal', 'intimidating'],
    bonusStyles: ['sophisticated', 'artistic'],
  },
  postapoc: {
    acceptedStyles: ['intimidating', 'rebellious', 'traditional'],
    shockedBy: ['sophisticated', 'professional'],
    bonusStyles: ['intimidating'],
  },
  war: {
    acceptedStyles: ['intimidating', 'traditional', 'professional'],
    shockedBy: ['sophisticated', 'artistic'],
    bonusStyles: ['intimidating'],
  },
  slice_of_life: {
    acceptedStyles: ['professional', 'artistic', 'traditional', 'sophisticated'],
    shockedBy: ['criminal', 'intimidating'],
    bonusStyles: ['artistic'],
  },
  pirate: {
    acceptedStyles: ['rebellious', 'intimidating', 'traditional', 'criminal'],
    shockedBy: ['professional', 'sophisticated'],
    bonusStyles: ['rebellious', 'intimidating'],
  },
};

// ============= NPC PREFERENCE GENERATION =============

export function generateNPCAppearancePreference(
  occupation: string,
  traits: string[],
  genre: string
): NPCAppearancePreference {
  const preference: NPCAppearancePreference = {
    careLevel: 40,
    preferredStyles: ['neutral'],
    dislikedStyles: [],
    intimidatedByExtreme: false,
    appreciatesArt: false,
    genreContext: genre,
  };

  const occupationLower = occupation.toLowerCase();

  // Occupation-based preferences
  if (occupationLower.includes('artist') || occupationLower.includes('musician') || occupationLower.includes('designer')) {
    preference.careLevel = 70;
    preference.preferredStyles = ['artistic', 'rebellious', 'futuristic'];
    preference.appreciatesArt = true;
  } else if (occupationLower.includes('business') || occupationLower.includes('executive') || occupationLower.includes('lawyer')) {
    preference.careLevel = 80;
    preference.preferredStyles = ['professional', 'sophisticated'];
    preference.dislikedStyles = ['rebellious', 'criminal', 'intimidating'];
  } else if (occupationLower.includes('gang') || occupationLower.includes('criminal') || occupationLower.includes('thug')) {
    preference.careLevel = 60;
    preference.preferredStyles = ['criminal', 'intimidating', 'rebellious'];
    preference.dislikedStyles = ['professional', 'sophisticated'];
  } else if (occupationLower.includes('priest') || occupationLower.includes('monk') || occupationLower.includes('shaman')) {
    preference.careLevel = 70;
    preference.preferredStyles = ['spiritual', 'traditional'];
    preference.dislikedStyles = ['rebellious', 'criminal'];
  } else if (occupationLower.includes('soldier') || occupationLower.includes('guard') || occupationLower.includes('military')) {
    preference.careLevel = 50;
    preference.preferredStyles = ['intimidating', 'professional'];
  } else if (occupationLower.includes('noble') || occupationLower.includes('aristocrat') || occupationLower.includes('lord')) {
    preference.careLevel = 85;
    preference.preferredStyles = ['sophisticated', 'traditional'];
    preference.dislikedStyles = ['rebellious', 'criminal', 'intimidating'];
    preference.intimidatedByExtreme = true;
  } else if (occupationLower.includes('hacker') || occupationLower.includes('netrunner') || occupationLower.includes('tech')) {
    preference.careLevel = 40;
    preference.preferredStyles = ['futuristic', 'rebellious'];
    preference.appreciatesArt = true;
  } else if (occupationLower.includes('merchant') || occupationLower.includes('shopkeeper') || occupationLower.includes('vendor')) {
    preference.careLevel = 50;
    preference.preferredStyles = ['professional', 'neutral'];
    preference.intimidatedByExtreme = true;
  }

  // Trait modifications
  if (traits.some(t => ['fearful', 'nervous', 'timid', 'cowardly'].includes(t.toLowerCase()))) {
    preference.intimidatedByExtreme = true;
    preference.careLevel = Math.min(100, preference.careLevel + 20);
  }
  if (traits.some(t => ['creative', 'artistic', 'bohemian'].includes(t.toLowerCase()))) {
    preference.appreciatesArt = true;
    preference.preferredStyles.push('artistic');
  }
  if (traits.some(t => ['traditional', 'conservative', 'strict'].includes(t.toLowerCase()))) {
    preference.preferredStyles = ['traditional', 'professional'];
    preference.dislikedStyles = ['rebellious', 'criminal', 'intimidating'];
  }
  if (traits.some(t => ['rebellious', 'anarchist', 'punk'].includes(t.toLowerCase()))) {
    preference.preferredStyles = ['rebellious', 'intimidating'];
    preference.dislikedStyles = ['professional', 'sophisticated'];
  }

  return preference;
}

// ============= REACTION GENERATION =============

export function generateAppearanceReaction(
  piercingStyle: string | undefined,
  tattooStyle: string | undefined,
  piercingCount: number,
  tattooCount: number,
  npcPreference: NPCAppearancePreference,
  isFirstMeeting: boolean = false
): AppearanceReaction {
  // If player has no piercings/tattoos, neutral reaction
  if (piercingCount === 0 && tattooCount === 0) {
    return {
      type: 'neutral',
      comment: '',
      modifiers: { trustModifier: 0, respectModifier: 0, fearModifier: 0, attractionModifier: 0 },
      shouldTrigger: false,
    };
  }

  // Check if NPC cares enough to react
  const careRoll = Math.random() * 100;
  if (careRoll > npcPreference.careLevel && !isFirstMeeting) {
    return {
      type: 'neutral',
      comment: '',
      modifiers: { trustModifier: 0, respectModifier: 0, fearModifier: 0, attractionModifier: 0 },
      shouldTrigger: false,
    };
  }

  // Determine player's appearance reputation
  const piercingRep = piercingStyle ? PIERCING_REPUTATION_MAP[piercingStyle] || 'neutral' : 'neutral';
  const tattooRep = tattooStyle ? TATTOO_REPUTATION_MAP[tattooStyle] || 'neutral' : 'neutral';
  
  // Primary reputation (tattoos take precedence if more visible)
  const primaryRep = tattooCount >= piercingCount ? tattooRep : piercingRep;
  const secondaryRep = tattooCount >= piercingCount ? piercingRep : tattooRep;

  // Check genre tolerance
  const genreTolerance = GENRE_APPEARANCE_TOLERANCE[npcPreference.genreContext] || GENRE_APPEARANCE_TOLERANCE.urban;

  // Calculate reaction based on preferences and genre
  let reactionScore = 0;
  let fearIncrease = 0;

  // Check if style is preferred
  if (npcPreference.preferredStyles.includes(primaryRep)) {
    reactionScore += 3;
  }
  if (npcPreference.preferredStyles.includes(secondaryRep)) {
    reactionScore += 1;
  }

  // Check if style is disliked
  if (npcPreference.dislikedStyles.includes(primaryRep)) {
    reactionScore -= 3;
  }
  if (npcPreference.dislikedStyles.includes(secondaryRep)) {
    reactionScore -= 1;
  }

  // Genre bonus/penalty
  if (genreTolerance.bonusStyles.includes(primaryRep)) {
    reactionScore += 2;
  }
  if (genreTolerance.shockedBy.includes(primaryRep)) {
    reactionScore -= 2;
  }

  // Extreme appearance effects
  if ((primaryRep === 'intimidating' || primaryRep === 'criminal') && npcPreference.intimidatedByExtreme) {
    fearIncrease = 10 + (piercingCount + tattooCount);
    reactionScore -= 2;
  }

  // Artistic appreciation
  if (npcPreference.appreciatesArt && (primaryRep === 'artistic' || secondaryRep === 'artistic')) {
    reactionScore += 2;
  }

  // Heavy modification multiplier
  const modCount = piercingCount + tattooCount;
  if (modCount >= 5) {
    reactionScore = Math.floor(reactionScore * 1.5);
    fearIncrease = Math.floor(fearIncrease * 1.3);
  }

  // Generate reaction
  return buildAppearanceReaction(reactionScore, fearIncrease, primaryRep, modCount, npcPreference);
}

function buildAppearanceReaction(
  score: number,
  fear: number,
  primaryStyle: AppearanceReputationType,
  modCount: number,
  preference: NPCAppearancePreference
): AppearanceReaction {
  // Strong intimidation reaction
  if (fear >= 15) {
    return {
      type: 'intimidated',
      comment: getIntimidatedComment(primaryStyle, modCount),
      modifiers: { 
        trustModifier: -5, 
        respectModifier: 5, 
        fearModifier: fear, 
        attractionModifier: -3 
      },
      shouldTrigger: true,
    };
  }

  // Very positive reaction
  if (score >= 4) {
    return {
      type: 'impressed',
      comment: getImpressedComment(primaryStyle, preference.appreciatesArt),
      modifiers: { 
        trustModifier: 5, 
        respectModifier: 8, 
        fearModifier: 0, 
        attractionModifier: 5 
      },
      shouldTrigger: true,
    };
  }

  // Positive reaction
  if (score >= 2) {
    return {
      type: 'positive',
      comment: getPositiveComment(primaryStyle),
      modifiers: { 
        trustModifier: 2, 
        respectModifier: 3, 
        fearModifier: 0, 
        attractionModifier: 2 
      },
      shouldTrigger: Math.random() > 0.3,
    };
  }

  // Negative reaction
  if (score <= -2) {
    return {
      type: 'negative',
      comment: getNegativeComment(primaryStyle, modCount),
      modifiers: { 
        trustModifier: -3, 
        respectModifier: -5, 
        fearModifier: fear, 
        attractionModifier: -3 
      },
      shouldTrigger: Math.random() > 0.4,
    };
  }

  // Neutral/mild reaction
  return {
    type: 'neutral',
    comment: '',
    modifiers: { trustModifier: 0, respectModifier: 0, fearModifier: 0, attractionModifier: 0 },
    shouldTrigger: false,
  };
}

// ============= COMMENT GENERATORS =============

function getIntimidatedComment(style: AppearanceReputationType, modCount: number): string {
  const comments: Record<string, string[]> = {
    intimidating: [
      `*eyes your extensive body modifications nervously*`,
      `*seems unsettled by your aggressive aesthetic*`,
      `"Those are... quite the collection."`,
    ],
    criminal: [
      `*notices your gang-style tattoos and tenses up*`,
      `*glances at your markings with recognition and wariness*`,
      `*takes a small step back upon seeing your ink*`,
    ],
    rebellious: [
      `*eyes your punk aesthetic with uncertainty*`,
      `"You're certainly... making a statement."`,
    ],
    default: [
      `*seems uncomfortable with your appearance*`,
      `*eyes your modifications warily*`,
    ],
  };
  const pool = comments[style] || comments.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getImpressedComment(style: AppearanceReputationType, appreciatesArt: boolean): string {
  const comments: Record<string, string[]> = {
    artistic: [
      `"Your ink is absolutely stunning. Who's your artist?"`,
      `*admires your artwork* "Now that's real craftsmanship."`,
      `"I love the aesthetic. Very expressive."`,
    ],
    sophisticated: [
      `"Very tasteful modifications. Refined."`,
      `*nods approvingly* "Elegant choices."`,
    ],
    futuristic: [
      `"Nice chrome! Those mods are cutting edge."`,
      `"Love the cyber-aesthetic. Very forward-thinking."`,
    ],
    spiritual: [
      `"Beautiful traditional work. It tells a story."`,
      `*looks at your tribal markings with respect*`,
    ],
    default: [
      `"I like your style."`,
      `*nods with approval at your look*`,
    ],
  };
  const pool = comments[style] || comments.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPositiveComment(style: AppearanceReputationType): string {
  const comments = [
    `*gives your modifications an appreciative glance*`,
    `"Nice ink."`,
    `"Cool piercings."`,
    `*seems to approve of your look*`,
  ];
  return comments[Math.floor(Math.random() * comments.length)];
}

function getNegativeComment(style: AppearanceReputationType, modCount: number): string {
  const comments: Record<string, string[]> = {
    rebellious: [
      `*purses lips at your alternative appearance*`,
      `"That's... certainly a choice."`,
    ],
    criminal: [
      `*eyes your markings with distaste*`,
      `*looks uncomfortable at your appearance*`,
    ],
    intimidating: [
      `*seems put off by your aggressive look*`,
      `"Do you have to look so... threatening?"`,
    ],
    default: [
      `*seems unimpressed by your modifications*`,
      `*glances at your appearance disapprovingly*`,
    ],
  };
  const pool = comments[style] || comments.default;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============= AI CONTEXT BUILDER =============

export function buildAppearanceContextForAI(
  piercingStyle: string | undefined,
  tattooStyle: string | undefined,
  piercings: string[],
  tattoos: string[],
  genre: string
): string {
  if (piercings.length === 0 && tattoos.length === 0) {
    return '';
  }

  const lines: string[] = ['PLAYER BODY MODIFICATIONS:'];

  if (piercings.length > 0) {
    lines.push(`Piercings (${piercingStyle || 'mixed'} style): ${piercings.join(', ')}`);
  }
  if (tattoos.length > 0) {
    lines.push(`Tattoos (${tattooStyle || 'mixed'} style): ${tattoos.join(', ')}`);
  }

  const piercingRep = piercingStyle ? PIERCING_REPUTATION_MAP[piercingStyle] : null;
  const tattooRep = tattooStyle ? TATTOO_REPUTATION_MAP[tattooStyle] : null;

  if (piercingRep || tattooRep) {
    const genreTolerance = GENRE_APPEARANCE_TOLERANCE[genre];
    const reps = [piercingRep, tattooRep].filter(Boolean) as AppearanceReputationType[];
    
    const shocking = reps.some(r => genreTolerance?.shockedBy.includes(r));
    const fitting = reps.some(r => genreTolerance?.bonusStyles.includes(r));
    
    if (shocking) {
      lines.push(`\n⚠️ The player's appearance may shock or disturb conservative NPCs in this ${genre} setting.`);
    } else if (fitting) {
      lines.push(`\n✓ The player's modifications fit well with the ${genre} aesthetic.`);
    }
  }

  const modCount = piercings.length + tattoos.length;
  if (modCount >= 5) {
    lines.push(`\nThe player is HEAVILY modified - this is very noticeable and will affect first impressions.`);
  }

  return lines.join('\n');
}

// ============= EXPORTS =============

export const AppearanceReactions = {
  generatePreference: generateNPCAppearancePreference,
  generateReaction: generateAppearanceReaction,
  buildContext: buildAppearanceContextForAI,
  PIERCING_REPUTATION_MAP,
  TATTOO_REPUTATION_MAP,
  GENRE_APPEARANCE_TOLERANCE,
};
