/**
 * Item Reaction System
 * Handles NPC reactions to player weapons, armor, and equipment
 * NPCs react differently based on item type, visibility, and context
 */

import { ItemPrompt, ALL_ITEM_PROMPTS } from './itemPromptCommands';
import { GameGenre } from '@/types/genreData';

// ============= TYPES =============

export type ItemReactionType =
  | 'intimidated'    // NPC is scared of weapon
  | 'impressed'      // NPC admires the equipment
  | 'suspicious'     // NPC wonders why you're armed
  | 'hostile'        // NPC sees you as a threat
  | 'envious'        // NPC wants what you have
  | 'professional'   // NPC recognizes quality gear
  | 'curious'        // NPC asks about unusual item
  | 'neutral';       // No reaction

export interface ItemReaction {
  type: ItemReactionType;
  severity: 'none' | 'mild' | 'moderate' | 'severe';
  comment: string;
  internalThought: string;
  trustModifier: number;
  respectModifier: number;
  behaviorTriggers: string[];
}

export interface NPCItemContext {
  role?: string;
  isMilitary?: boolean;
  isCriminal?: boolean;
  isCivilian?: boolean;
  isNoble?: boolean;
  isMerchant?: boolean;
}

// ============= REACTION COMMENTS =============

const WEAPON_REACTIONS = {
  intimidated: [
    `*eyes your weapon nervously* "That's... quite a piece you've got there."`,
    `*takes a step back upon seeing your armament* "No trouble here, friend."`,
    `"I-I see you're well armed. Please, I don't want any problems."`,
    `*visible unease at the sight of your weapon*`,
  ],
  impressed: [
    `*whistles* "Now that's a fine piece of hardware."`,
    `"Nice weapon. You clearly know your gear."`,
    `*nods approvingly at your armament* "Quality equipment."`,
    `"I can tell you're serious. Good choice of arms."`,
  ],
  suspicious: [
    `*eyes your weapon warily* "What exactly do you need that for?"`,
    `"Heavily armed, I see. What brings you to these parts?"`,
    `*hand moves to their own weapon* "State your business."`,
    `"That's a lot of firepower. You expecting trouble?"`,
  ],
  hostile: [
    `"Put that thing away before someone gets hurt."`,
    `*grips their weapon* "You threatening me with that?"`,
    `"Armed visitors aren't welcome here. Best you move along."`,
    `*calls for backup while keeping eyes on your weapon*`,
  ],
  professional: [
    `"Ah, a fellow practitioner. That's a solid choice."`,
    `"Good kit. You've got the look of someone who knows how to use it."`,
    `*assessing glance at your equipment* "Military grade. Nice."`,
    `"I see we're both professionals here."`,
  ],
};

const ARMOR_REACTIONS = {
  intimidated: [
    `*stares at your imposing armor* "You're expecting a war or something?"`,
    `"All that protection... what are you afraid of?"`,
    `*backs away from your armored form* "I mean no harm..."`,
  ],
  impressed: [
    `"That's some serious protection you've got there."`,
    `*admires your armor* "Now that's quality craftsmanship."`,
    `"You look ready for anything in that gear."`,
  ],
  suspicious: [
    `"Armored up like that... you must be expecting trouble."`,
    `*narrows eyes at your protective gear* "What are you hiding?"`,
    `"That's not everyday wear. What's your story?"`,
  ],
  professional: [
    `"Good choice of protection. You know what you're doing."`,
    `*nods at your armor* "That'll stop most things."`,
    `"Proper kit. You've seen action, haven't you?"`,
  ],
};

const MELEE_REACTIONS = {
  intimidated: [
    `*glances nervously at your blade* "That thing looks sharp..."`,
    `"Is that... is that really necessary to carry around?"`,
    `*keeps distance from your weapon* "Easy there..."`,
  ],
  impressed: [
    `"A blade wielder! You don't see many of those anymore."`,
    `*eyes your weapon with respect* "Classic choice. Reliable."`,
    `"There's something elegant about a good blade."`,
  ],
  curious: [
    `"Interesting weapon choice. Family heirloom?"`,
    `*studies your weapon* "Where'd you pick that up?"`,
    `"That's not something you see every day."`,
  ],
};

// ============= GENRE ITEM EXPECTATIONS =============

const GENRE_WEAPON_NORMS: Record<string, {
  normal: string[];
  unusual: string[];
  shocking: string[];
}> = {
  fantasy: {
    normal: ['sword', 'bow', 'staff', 'dagger', 'axe', 'spear'],
    unusual: ['crossbow', 'exotic weapons'],
    shocking: ['firearms', 'modern tech'],
  },
  scifi: {
    normal: ['plasma weapons', 'lasers', 'modern firearms'],
    unusual: ['melee weapons'],
    shocking: ['primitive weapons'],
  },
  western: {
    normal: ['revolver', 'rifle', 'shotgun'],
    unusual: ['automatic weapons'],
    shocking: ['swords', 'high-tech'],
  },
  postapoc: {
    normal: ['any weapons', 'improvised weapons'],
    unusual: ['pristine weapons'],
    shocking: ['nothing - survival requires arms'],
  },
  war: {
    normal: ['military weapons', 'tactical gear'],
    unusual: ['civilian weapons'],
    shocking: ['no weapons'],
  },
  cyberpunk: {
    normal: ['modern firearms', 'cyber weapons'],
    unusual: ['traditional weapons'],
    shocking: ['primitive weapons'],
  },
  mystery: {
    normal: ['concealed pistols', 'small weapons'],
    unusual: ['visible weapons'],
    shocking: ['heavy weapons'],
  },
  horror: {
    normal: ['improvised weapons', 'flashlights'],
    unusual: ['military gear'],
    shocking: ['heavy armament'],
  },
  pirate: {
    normal: ['cutlass', 'flintlock', 'dagger'],
    unusual: ['modern weapons'],
    shocking: ['high-tech weapons'],
  },
  modern: {
    normal: ['concealed carry', 'legal weapons'],
    unusual: ['visible weapons'],
    shocking: ['military weapons in public'],
  },
};

// ============= REACTION GENERATION =============

/**
 * Generate NPC reaction to a specific item
 */
export function generateItemReaction(
  item: ItemPrompt,
  npcContext: NPCItemContext,
  genre: string,
  isVisible: boolean = true
): ItemReaction {
  // If item isn't visible, no reaction
  if (!isVisible) {
    return {
      type: 'neutral',
      severity: 'none',
      comment: '',
      internalThought: '',
      trustModifier: 0,
      respectModifier: 0,
      behaviorTriggers: [],
    };
  }

  const category = item.category;
  
  // Determine base reaction based on NPC type and item
  if (category === 'firearm') {
    return generateFirearmReaction(item, npcContext, genre);
  } else if (category === 'melee') {
    return generateMeleeReaction(item, npcContext, genre);
  } else if (category === 'armor') {
    return generateArmorReaction(item, npcContext, genre);
  }
  
  // Clothing generally doesn't trigger item reactions (handled by clothing system)
  return {
    type: 'neutral',
    severity: 'none',
    comment: '',
    internalThought: '',
    trustModifier: 0,
    respectModifier: 0,
    behaviorTriggers: [],
  };
}

function generateFirearmReaction(
  item: ItemPrompt,
  npc: NPCItemContext,
  genre: string
): ItemReaction {
  const behaviorTriggers: string[] = [];
  
  // Civilians are usually intimidated by firearms
  if (npc.isCivilian) {
    const comments = WEAPON_REACTIONS.intimidated;
    return {
      type: 'intimidated',
      severity: 'moderate',
      comment: comments[Math.floor(Math.random() * comments.length)],
      internalThought: 'That weapon makes me nervous. Better stay on their good side.',
      trustModifier: -5,
      respectModifier: 5,
      behaviorTriggers: ['nervous', 'compliant'],
    };
  }
  
  // Military/Guards are professional about it
  if (npc.isMilitary) {
    const comments = WEAPON_REACTIONS.professional;
    return {
      type: 'professional',
      severity: 'mild',
      comment: comments[Math.floor(Math.random() * comments.length)],
      internalThought: 'They know their way around weapons. Could be useful, could be trouble.',
      trustModifier: 0,
      respectModifier: 5,
      behaviorTriggers: ['assessing', 'professional'],
    };
  }
  
  // Criminals might see opportunity or threat
  if (npc.isCriminal) {
    if (Math.random() > 0.5) {
      return {
        type: 'suspicious',
        severity: 'moderate',
        comment: `"Heavy artillery. You in the business or just cautious?"`,
        internalThought: 'Either competition or a potential mark... need to figure out which.',
        trustModifier: -3,
        respectModifier: 8,
        behaviorTriggers: ['calculating', 'testing'],
      };
    } else {
      const comments = WEAPON_REACTIONS.professional;
      return {
        type: 'professional',
        severity: 'mild',
        comment: comments[Math.floor(Math.random() * comments.length)],
        internalThought: 'Armed and dangerous. Might be someone I can work with.',
        trustModifier: 2,
        respectModifier: 5,
        behaviorTriggers: ['interested', 'cautious_respect'],
      };
    }
  }
  
  // Nobles are suspicious of armed commoners
  if (npc.isNoble) {
    const comments = WEAPON_REACTIONS.suspicious;
    return {
      type: 'suspicious',
      severity: 'moderate',
      comment: comments[Math.floor(Math.random() * comments.length)],
      internalThought: 'Armed and in my presence? The audacity. Best keep guards close.',
      trustModifier: -8,
      respectModifier: 0,
      behaviorTriggers: ['haughty', 'summons_guards'],
    };
  }
  
  // Merchants see potential customer or threat
  if (npc.isMerchant) {
    return {
      type: 'curious',
      severity: 'mild',
      comment: `"That's a fine piece. Looking to upgrade? I might have something..."`,
      internalThought: 'Armed customer. Probably has coin. Definitely don\'t shortchange them.',
      trustModifier: 0,
      respectModifier: 3,
      behaviorTriggers: ['sales_pitch', 'fair_prices'],
    };
  }
  
  // Default: mild suspicion
  const comments = WEAPON_REACTIONS.suspicious;
  return {
    type: 'suspicious',
    severity: 'mild',
    comment: comments[Math.floor(Math.random() * comments.length)],
    internalThought: 'Armed stranger. Better be careful.',
    trustModifier: -3,
    respectModifier: 2,
    behaviorTriggers: ['wary'],
  };
}

function generateMeleeReaction(
  item: ItemPrompt,
  npc: NPCItemContext,
  genre: string
): ItemReaction {
  // In fantasy, melee weapons are normal
  if (genre.toLowerCase() === 'fantasy' || genre.toLowerCase() === 'medieval') {
    if (npc.isMilitary) {
      return {
        type: 'professional',
        severity: 'none',
        comment: '',
        internalThought: 'Standard armament.',
        trustModifier: 0,
        respectModifier: 2,
        behaviorTriggers: [],
      };
    }
    return {
      type: 'neutral',
      severity: 'none',
      comment: '',
      internalThought: '',
      trustModifier: 0,
      respectModifier: 0,
      behaviorTriggers: [],
    };
  }
  
  // In modern settings, melee weapons are unusual
  if (npc.isCivilian) {
    const comments = MELEE_REACTIONS.curious;
    return {
      type: 'curious',
      severity: 'mild',
      comment: comments[Math.floor(Math.random() * comments.length)],
      internalThought: 'Odd choice of weapon. Collector? Enthusiast? Psycho?',
      trustModifier: -2,
      respectModifier: 0,
      behaviorTriggers: ['curious', 'slightly_nervous'],
    };
  }
  
  if (npc.isCriminal) {
    return {
      type: 'impressed',
      severity: 'mild',
      comment: `"Old school. I can respect that."`,
      internalThought: 'Up close and personal type. Dangerous.',
      trustModifier: 0,
      respectModifier: 5,
      behaviorTriggers: ['respect'],
    };
  }
  
  return {
    type: 'neutral',
    severity: 'none',
    comment: '',
    internalThought: '',
    trustModifier: 0,
    respectModifier: 0,
    behaviorTriggers: [],
  };
}

function generateArmorReaction(
  item: ItemPrompt,
  npc: NPCItemContext,
  genre: string
): ItemReaction {
  // Heavy armor always draws attention
  const isHeavyArmor = ['platecarrier', 'platearmor', 'riotarmor', 'exosuit'].some(
    a => item.command.includes(a)
  );
  
  if (isHeavyArmor) {
    if (npc.isCivilian) {
      const comments = ARMOR_REACTIONS.intimidated;
      return {
        type: 'intimidated',
        severity: 'moderate',
        comment: comments[Math.floor(Math.random() * comments.length)],
        internalThought: 'What is that? Some kind of soldier? Best stay out of their way.',
        trustModifier: -5,
        respectModifier: 5,
        behaviorTriggers: ['nervous', 'avoids'],
      };
    }
    
    if (npc.isMilitary) {
      const comments = ARMOR_REACTIONS.professional;
      return {
        type: 'professional',
        severity: 'mild',
        comment: comments[Math.floor(Math.random() * comments.length)],
        internalThought: 'Professional grade protection. They mean business.',
        trustModifier: 0,
        respectModifier: 8,
        behaviorTriggers: ['professional_courtesy'],
      };
    }
  }
  
  // Light armor is less remarkable
  return {
    type: 'neutral',
    severity: 'none',
    comment: '',
    internalThought: '',
    trustModifier: 0,
    respectModifier: 0,
    behaviorTriggers: [],
  };
}

// ============= CONTEXT BUILDING =============

/**
 * Build AI context for item-based NPC reactions
 */
export function buildItemReactionContext(
  equippedItems: { name: string; category: string; description?: string }[],
  genre: string
): string {
  if (equippedItems.length === 0) {
    return '';
  }
  
  const weapons = equippedItems.filter(i => 
    i.category === 'weapons' || i.category === 'firearm' || i.category === 'melee'
  );
  const armor = equippedItems.filter(i => i.category === 'armor' || i.category === 'apparel');
  
  const lines: string[] = [];
  
  if (weapons.length > 0) {
    lines.push('### PLAYER ARMAMENT');
    lines.push('The player is visibly carrying:');
    weapons.forEach(w => {
      lines.push(`- ${w.name}${w.description ? `: ${w.description}` : ''}`);
    });
    lines.push('');
    lines.push('NPCs should react appropriately to visible weapons:');
    lines.push('- Civilians may be nervous or intimidated');
    lines.push('- Law enforcement may be suspicious or confrontational');
    lines.push('- Criminals may see the player as competition or a threat');
    lines.push('- Military/guards may assess professionally');
    lines.push('');
  }
  
  if (armor.length > 0) {
    lines.push('### PLAYER PROTECTION');
    lines.push('The player is wearing:');
    armor.forEach(a => {
      lines.push(`- ${a.name}${a.description ? `: ${a.description}` : ''}`);
    });
    lines.push('');
    lines.push('Heavy armor or tactical gear should draw attention and reactions.');
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Get NPC context from role string
 */
export function inferNPCContextFromRole(role: string): NPCItemContext {
  const roleLower = role.toLowerCase();
  
  return {
    role,
    isMilitary: /guard|soldier|knight|officer|police|military|warrior|paladin/i.test(roleLower),
    isCriminal: /thief|criminal|gangster|pirate|bandit|raider|smuggler/i.test(roleLower),
    isCivilian: /civilian|citizen|peasant|worker|farmer|shopkeeper|bartender/i.test(roleLower),
    isNoble: /noble|lord|lady|king|queen|prince|princess|aristocrat|duke/i.test(roleLower),
    isMerchant: /merchant|trader|vendor|shopkeeper|dealer|seller/i.test(roleLower),
  };
}

// ============= EXPORTS =============

export const ItemReactions = {
  generate: generateItemReaction,
  buildContext: buildItemReactionContext,
  inferContext: inferNPCContextFromRole,
};
