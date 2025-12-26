// Life Simulation Social Interactions System

export type InteractionResponse = 
  | 'positive' | 'neutral' | 'negative' 
  | 'busy' | 'engaging' | 'boring' | 'awkward' | 'great'
  | 'flattered' | 'modest' | 'suspicious' | 'reciprocate'
  | 'laughing' | 'polite_laugh' | 'confused' | 'offended'
  | 'accepts' | 'raincheck' | 'declines'
  | 'blushing' | 'confident' | 'deflecting' | 'creeped_out'
  | 'excited_yes' | 'shy_yes' | 'maybe' | 'no_thanks' | 'already_seeing_someone'
  | 'passionate' | 'sweet' | 'rejected' | 'quick_peck' | 'pulls_away'
  | 'says_it_back' | 'speechless_happy' | 'not_ready' | 'awkward_silence'
  | 'yes_crying' | 'yes_excited' | 'need_time' | 'no'
  | 'amazing' | 'good' | 'hurt' | 'angry' | 'insults_back' | 'leaves'
  | 'escalates' | 'backs_down' | 'counter_argue' | 'cries'
  | 'needs_time' | 'rejects' | 'helpful' | 'dismissive' | 'defensive' | 'grateful'
  | 'devastated' | 'relieved' | 'begs'
  | 'agrees' | 'fights_it' | 'admits' | 'denies' | 'deflects' | 'apologize' | 'fights_back'
  | 'loves_it' | 'appreciates' | 'polite' | 'dislikes'
  | 'swooning' | 'touched' | 'allergic' | 'thanks'
  | 'overwhelmed' | 'grateful' | 'uncomfortable';

export interface SocialInteraction {
  id: string;
  name: string;
  icon: string;
  category: 'friendly' | 'romantic' | 'negative' | 'gift';
  requirements: {
    intimacy?: number;
    trust?: number;
    respect?: number;
    attraction?: number;
    romance?: number;
    drama?: number;
    isRomanceable?: boolean;
    romanticType?: string[];
    requiresItem?: string;
  };
  effects: {
    intimacy?: number;
    trust?: number;
    respect?: number;
    attraction?: number;
    romance?: number;
    drama?: number;
  };
  failEffects?: {
    intimacy?: number;
    trust?: number;
    respect?: number;
    attraction?: number;
    romance?: number;
    drama?: number;
  };
  skillCheck?: string;
  skillBoost?: Record<string, number>;
  cooldown: number;  // hours
  duration: number;  // hours
  cost?: number;
  private?: boolean;
  special?: string;
  responses: InteractionResponse[];
}

// Friendly interactions
export const FRIENDLY_INTERACTIONS: SocialInteraction[] = [
  {
    id: 'greet',
    name: 'Say Hello',
    icon: '👋',
    category: 'friendly',
    requirements: { intimacy: -100 },
    effects: { intimacy: 2, trust: 1 },
    cooldown: 0,
    duration: 0.1,
    responses: ['positive', 'neutral', 'busy'],
  },
  {
    id: 'chat',
    name: 'Have a Chat',
    icon: '💬',
    category: 'friendly',
    requirements: { intimacy: 0 },
    effects: { intimacy: 5, trust: 2 },
    skillBoost: { charisma: 1 },
    cooldown: 1,
    duration: 0.5,
    responses: ['engaging', 'boring', 'awkward', 'great'],
  },
  {
    id: 'deep_conversation',
    name: 'Deep Conversation',
    icon: '🗣️',
    category: 'friendly',
    requirements: { intimacy: 30, trust: 40 },
    effects: { intimacy: 12, trust: 8, drama: -5 },
    skillBoost: { charisma: 2 },
    cooldown: 4,
    duration: 1.5,
    responses: ['engaging', 'great', 'awkward'],
  },
  {
    id: 'share_secret',
    name: 'Share a Secret',
    icon: '🤫',
    category: 'friendly',
    requirements: { intimacy: 50, trust: 60 },
    effects: { intimacy: 15, trust: 15 },
    failEffects: { trust: -30 },
    cooldown: 24,
    duration: 0.3,
    special: 'secret_sharing',
    responses: ['grateful', 'suspicious', 'reciprocate'],
  },
  {
    id: 'give_advice',
    name: 'Give Advice',
    icon: '💡',
    category: 'friendly',
    requirements: { intimacy: 25, respect: 40 },
    effects: { intimacy: 5, respect: 8, trust: 3 },
    cooldown: 4,
    duration: 0.5,
    responses: ['grateful', 'defensive', 'appreciates'],
  },
  {
    id: 'ask_advice',
    name: 'Ask for Advice',
    icon: '❓',
    category: 'friendly',
    requirements: { intimacy: 20 },
    effects: { intimacy: 5, trust: 5 },
    cooldown: 4,
    duration: 0.5,
    responses: ['helpful', 'dismissive', 'engaging'],
  },
  {
    id: 'compliment',
    name: 'Give Compliment',
    icon: '⭐',
    category: 'friendly',
    requirements: { intimacy: 5 },
    effects: { intimacy: 4, attraction: 2 },
    cooldown: 2,
    duration: 0.1,
    responses: ['flattered', 'modest', 'suspicious', 'reciprocate'],
  },
  {
    id: 'joke',
    name: 'Tell a Joke',
    icon: '😂',
    category: 'friendly',
    requirements: { intimacy: 10 },
    effects: { intimacy: 6 },
    failEffects: { intimacy: -3, respect: -2 },
    skillCheck: 'comedy',
    cooldown: 1,
    duration: 0.2,
    responses: ['laughing', 'polite_laugh', 'confused', 'offended'],
  },
  {
    id: 'invite_hangout',
    name: 'Invite to Hang Out',
    icon: '🎉',
    category: 'friendly',
    requirements: { intimacy: 25 },
    effects: { intimacy: 10, trust: 5 },
    cooldown: 12,
    duration: 0.2,
    special: 'hangout_event',
    responses: ['accepts', 'busy', 'raincheck', 'declines'],
  },
];

// Romantic interactions
export const ROMANTIC_INTERACTIONS: SocialInteraction[] = [
  {
    id: 'flirt',
    name: 'Flirt',
    icon: '😏',
    category: 'romantic',
    requirements: { intimacy: 15, isRomanceable: true },
    effects: { attraction: 8, romance: 5, intimacy: 3 },
    failEffects: { attraction: -5, intimacy: -3 },
    skillCheck: 'charisma',
    cooldown: 2,
    duration: 0.2,
    responses: ['flattered', 'blushing', 'awkward', 'reciprocate'],
  },
  {
    id: 'compliment_appearance',
    name: 'Compliment Appearance',
    icon: '😍',
    category: 'romantic',
    requirements: { intimacy: 10, isRomanceable: true },
    effects: { attraction: 6, romance: 3, intimacy: 2 },
    cooldown: 3,
    duration: 0.1,
    responses: ['blushing', 'confident', 'deflecting', 'creeped_out'],
  },
  {
    id: 'ask_date',
    name: 'Ask on a Date',
    icon: '💕',
    category: 'romantic',
    requirements: { intimacy: 25, attraction: 20, romance: 15 },
    effects: { romance: 15, attraction: 10 },
    cooldown: 24,
    duration: 0.2,
    special: 'date_invitation',
    responses: ['excited_yes', 'shy_yes', 'maybe', 'no_thanks', 'already_seeing_someone'],
  },
  {
    id: 'hold_hands',
    name: 'Hold Hands',
    icon: '🤝',
    category: 'romantic',
    requirements: { romance: 30, romanticType: ['flirting', 'dating', 'exclusive', 'committed', 'engaged', 'married'] },
    effects: { romance: 5, intimacy: 5, attraction: 3 },
    cooldown: 0,
    duration: 0.1,
    responses: ['accepts', 'passionate', 'pulls_away'],
  },
  {
    id: 'first_kiss',
    name: 'Go for First Kiss',
    icon: '💋',
    category: 'romantic',
    requirements: { romance: 40, attraction: 35, romanticType: ['flirting', 'dating'] },
    effects: { romance: 20, attraction: 15, intimacy: 10 },
    cooldown: 24,
    duration: 0.1,
    special: 'first_kiss',
    responses: ['passionate', 'sweet', 'awkward', 'rejected'],
  },
  {
    id: 'kiss',
    name: 'Kiss',
    icon: '💋',
    category: 'romantic',
    requirements: { romance: 50, romanticType: ['dating', 'exclusive', 'committed', 'engaged', 'married'] },
    effects: { romance: 5, attraction: 5, intimacy: 3 },
    cooldown: 0,
    duration: 0.1,
    responses: ['passionate', 'sweet', 'quick_peck'],
  },
  {
    id: 'say_love',
    name: 'Say "I Love You"',
    icon: '❤️',
    category: 'romantic',
    requirements: { romance: 70, intimacy: 60, romanticType: ['exclusive', 'committed'] },
    effects: { romance: 20, intimacy: 15, trust: 10 },
    failEffects: { romance: -20, intimacy: -10, drama: 20 },
    cooldown: 168,
    duration: 0.1,
    special: 'love_declaration',
    responses: ['says_it_back', 'speechless_happy', 'not_ready', 'awkward_silence'],
  },
  {
    id: 'propose',
    name: 'Propose Marriage',
    icon: '💍',
    category: 'romantic',
    requirements: { romance: 88, intimacy: 80, trust: 75, romanticType: ['committed'], requiresItem: 'engagement_ring' },
    effects: { romance: 30, intimacy: 25, trust: 15 },
    failEffects: { romance: -40, intimacy: -30, drama: 50 },
    cooldown: 720,
    duration: 0.2,
    special: 'proposal_event',
    responses: ['yes_crying', 'yes_excited', 'need_time', 'no'],
  },
  {
    id: 'woohoo',
    name: 'Woohoo',
    icon: '🔥',
    category: 'romantic',
    requirements: { romance: 60, attraction: 50, trust: 40, romanticType: ['dating', 'exclusive', 'committed', 'engaged', 'married'] },
    effects: { romance: 15, attraction: 10, intimacy: 15 },
    cooldown: 8,
    duration: 1,
    private: true,
    responses: ['amazing', 'good', 'awkward'],
  },
  {
    id: 'romantic_dinner',
    name: 'Plan Romantic Dinner',
    icon: '🕯️',
    category: 'romantic',
    requirements: { romance: 40, romanticType: ['dating', 'exclusive', 'committed', 'engaged', 'married'] },
    effects: { romance: 15, intimacy: 10 },
    cooldown: 24,
    duration: 2,
    cost: 100,
    special: 'romantic_dinner',
    responses: ['great', 'positive', 'awkward'],
  },
];

// Negative interactions
export const NEGATIVE_INTERACTIONS: SocialInteraction[] = [
  {
    id: 'argue',
    name: 'Argue',
    icon: '😤',
    category: 'negative',
    requirements: { intimacy: -100 },
    effects: { intimacy: -10, trust: -8, drama: 15 },
    cooldown: 0,
    duration: 0.3,
    special: 'argument',
    responses: ['escalates', 'backs_down', 'counter_argue', 'cries'],
  },
  {
    id: 'insult',
    name: 'Insult',
    icon: '🤬',
    category: 'negative',
    requirements: { intimacy: -100 },
    effects: { intimacy: -15, trust: -15, respect: -20, drama: 20 },
    cooldown: 0,
    duration: 0.1,
    responses: ['hurt', 'angry', 'insults_back', 'leaves'],
  },
  {
    id: 'apologize',
    name: 'Apologize',
    icon: '🙏',
    category: 'negative',
    requirements: { drama: 10 },
    effects: { drama: -20, trust: 5, intimacy: 5 },
    cooldown: 4,
    duration: 0.2,
    responses: ['accepts', 'needs_time', 'rejects'],
  },
  {
    id: 'confront',
    name: 'Confront About Issue',
    icon: '😠',
    category: 'negative',
    requirements: { intimacy: 20 },
    effects: { drama: 15, trust: -5 },
    cooldown: 12,
    duration: 0.5,
    responses: ['admits', 'denies', 'deflects', 'apologize', 'fights_back'],
  },
  {
    id: 'break_up',
    name: 'Break Up',
    icon: '💔',
    category: 'negative',
    requirements: { romanticType: ['dating', 'exclusive', 'committed'] },
    effects: { romance: -80, intimacy: -30, drama: 40 },
    cooldown: 0,
    duration: 0.5,
    special: 'breakup_event',
    responses: ['devastated', 'angry', 'relieved', 'begs'],
  },
  {
    id: 'divorce',
    name: 'Ask for Divorce',
    icon: '📜',
    category: 'negative',
    requirements: { romanticType: ['married'] },
    effects: { romance: -90, intimacy: -50, trust: -40, drama: 60 },
    cooldown: 0,
    duration: 1,
    special: 'divorce_event',
    responses: ['agrees', 'fights_it', 'devastated', 'relieved'],
  },
];

// Gift interactions
export const GIFT_INTERACTIONS: SocialInteraction[] = [
  {
    id: 'give_small_gift',
    name: 'Give Small Gift',
    icon: '🎁',
    category: 'gift',
    requirements: { intimacy: 5 },
    effects: { intimacy: 8, trust: 3 },
    cooldown: 12,
    duration: 0.1,
    cost: 20,
    responses: ['loves_it', 'appreciates', 'polite', 'dislikes'],
  },
  {
    id: 'give_flowers',
    name: 'Give Flowers',
    icon: '💐',
    category: 'gift',
    requirements: { intimacy: 10 },
    effects: { intimacy: 10, romance: 8, attraction: 5 },
    cooldown: 24,
    duration: 0.1,
    cost: 30,
    responses: ['swooning', 'touched', 'allergic', 'thanks'],
  },
  {
    id: 'give_expensive_gift',
    name: 'Give Expensive Gift',
    icon: '💎',
    category: 'gift',
    requirements: { intimacy: 30 },
    effects: { intimacy: 15, trust: 10, respect: 5 },
    cooldown: 72,
    duration: 0.2,
    cost: 200,
    responses: ['overwhelmed', 'grateful', 'suspicious', 'uncomfortable'],
  },
];

// All interactions combined
export const ALL_INTERACTIONS: SocialInteraction[] = [
  ...FRIENDLY_INTERACTIONS,
  ...ROMANTIC_INTERACTIONS,
  ...NEGATIVE_INTERACTIONS,
  ...GIFT_INTERACTIONS,
];

// Get available interactions based on relationship state
export function getAvailableInteractions(
  relationship: {
    intimacy: number;
    trust: number;
    respect: number;
    attraction: number;
    romance: number;
    drama: number;
    isRomanceable: boolean;
    romanticType: string | null;
  },
  cooldowns: Record<string, number> = {}
): SocialInteraction[] {
  const currentTime = Date.now();
  
  return ALL_INTERACTIONS.filter(interaction => {
    // Check cooldown
    if (cooldowns[interaction.id] && cooldowns[interaction.id] > currentTime) {
      return false;
    }
    
    // Check requirements
    const reqs = interaction.requirements;
    
    if (reqs.intimacy !== undefined && relationship.intimacy < reqs.intimacy) return false;
    if (reqs.trust !== undefined && relationship.trust < reqs.trust) return false;
    if (reqs.respect !== undefined && relationship.respect < reqs.respect) return false;
    if (reqs.attraction !== undefined && relationship.attraction < reqs.attraction) return false;
    if (reqs.romance !== undefined && relationship.romance < reqs.romance) return false;
    if (reqs.drama !== undefined && relationship.drama < reqs.drama) return false;
    
    if (reqs.isRomanceable && !relationship.isRomanceable) return false;
    
    if (reqs.romanticType && relationship.romanticType) {
      if (!reqs.romanticType.includes(relationship.romanticType)) return false;
    } else if (reqs.romanticType && !relationship.romanticType) {
      return false;
    }
    
    return true;
  });
}

// Calculate interaction outcome
export function calculateInteractionOutcome(
  interaction: SocialInteraction,
  charismaSkill: number = 0
): { success: boolean; response: InteractionResponse; effects: typeof interaction.effects } {
  // Base success chance
  let successChance = 70 + (charismaSkill * 2);
  
  // Skill check if required
  if (interaction.skillCheck) {
    successChance = 50 + (charismaSkill * 3);
  }
  
  const roll = Math.random() * 100;
  const success = roll < successChance;
  
  // Pick random response from available ones
  const positiveResponses = interaction.responses.filter(r => 
    ['positive', 'accepts', 'great', 'engaging', 'flattered', 'laughing', 
     'passionate', 'sweet', 'says_it_back', 'yes_crying', 'yes_excited',
     'loves_it', 'swooning', 'grateful', 'appreciates'].includes(r)
  );
  const negativeResponses = interaction.responses.filter(r =>
    ['negative', 'declines', 'awkward', 'rejected', 'no', 'creeped_out',
     'hurt', 'angry', 'leaves', 'dislikes'].includes(r)
  );
  
  const responsePool = success ? 
    (positiveResponses.length > 0 ? positiveResponses : interaction.responses) :
    (negativeResponses.length > 0 ? negativeResponses : interaction.responses);
  
  const response = responsePool[Math.floor(Math.random() * responsePool.length)];
  
  const effects = success ? interaction.effects : (interaction.failEffects || {});
  
  return { success, response, effects };
}
