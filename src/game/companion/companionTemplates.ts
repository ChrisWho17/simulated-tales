// ============================================================================
// COMPANION TEMPLATES - Predefined companion archetypes and constants
// ============================================================================

import type { CompanionState, PlayerActionType } from './companionTypes';

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

// Base reaction values for player actions
export const REACTION_VALUES: Record<PlayerActionType, number> = {
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

// Quirk discovery thresholds
export const QUIRK_DISCOVERY_THRESHOLDS = [
  { trust: 40, affinity: 20 },  // First hidden quirk
  { trust: 60, affinity: 40 },  // Second hidden quirk  
  { trust: 80, affinity: 60 },  // Third hidden quirk
];

// Bonding moment triggers with their effects
export const BONDING_MOMENT_TRIGGERS: Record<string, {
  affinityBoost: number;
  trustBoost: number;
  quirkRevealChance: number;
  bondingDialogueType: 'vulnerable' | 'grateful' | 'protective' | 'curious';
}> = {
  'survived_combat_together': {
    affinityBoost: 8,
    trustBoost: 10,
    quirkRevealChance: 0.3,
    bondingDialogueType: 'vulnerable',
  },
  'player_saved_companion': {
    affinityBoost: 15,
    trustBoost: 20,
    quirkRevealChance: 0.5,
    bondingDialogueType: 'grateful',
  },
  'companion_saved_player': {
    affinityBoost: 10,
    trustBoost: 15,
    quirkRevealChance: 0.4,
    bondingDialogueType: 'protective',
  },
  'shared_campfire_moment': {
    affinityBoost: 5,
    trustBoost: 8,
    quirkRevealChance: 0.4,
    bondingDialogueType: 'curious',
  },
  'player_confided_in_companion': {
    affinityBoost: 8,
    trustBoost: 12,
    quirkRevealChance: 0.5,
    bondingDialogueType: 'vulnerable',
  },
  'celebrated_victory': {
    affinityBoost: 6,
    trustBoost: 5,
    quirkRevealChance: 0.2,
    bondingDialogueType: 'grateful',
  },
  'mourned_loss_together': {
    affinityBoost: 10,
    trustBoost: 15,
    quirkRevealChance: 0.6,
    bondingDialogueType: 'vulnerable',
  },
  'overcame_challenge': {
    affinityBoost: 7,
    trustBoost: 8,
    quirkRevealChance: 0.3,
    bondingDialogueType: 'protective',
  },
};

// Player questions for curiosity system
export const PLAYER_QUESTIONS = [
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
] as const;

// Resurrection story variations
export const RESURRECTION_STORIES = [
  {
    getIntro: (name: string) => `A blinding light erupts from ${name}'s fallen form. Divine energy courses through their body as an ethereal voice whispers, "Your journey is not yet complete." Their eyes flutter open, gasping for breath.`,
    reaction: `I... I saw the other side. It was peaceful, but something pulled me back. I'm not ready to leave you yet.`
  },
  {
    getIntro: (name: string) => `The air shimmers with arcane power as an ancient spell takes hold. ${name}'s wounds begin to close, color returning to their pallid skin. With a shuddering breath, life returns to their body.`,
    reaction: `*gasps* What... what happened? I remember darkness, then... warmth. I'm alive?`
  },
  {
    getIntro: (name: string) => `A mysterious figure cloaked in shadows appears beside ${name}'s body. With a whispered incantation, they press a glowing hand to their chest. The figure vanishes as ${name} stirs, their eyes slowly opening.`,
    reaction: `I dreamed of someone... calling me back. The voice said I had unfinished business. With you.`
  },
  {
    getIntro: (name: string) => `${name}'s spirit, visible as a faint shimmer, is pulled back into their body by an invisible force. Their chest heaves as they draw their first breath in what feels like an eternity. Tears stream down their face.`,
    reaction: `*reaches out with trembling hands* You brought me back. I don't know how, but... thank you. I won't waste this second chance.`
  },
  {
    getIntro: (name: string) => `The ground beneath ${name} pulses with primal energy. Roots and vines cradle their body as nature itself intervenes, refusing to let their story end here. With a gasp, they return to the world of the living.`,
    reaction: `The earth... it held me. It said my roots were still here, still connected to you. I couldn't leave.`
  }
];

console.log('[CompanionTemplates] Templates module loaded');
