// ============================================================================
// THE UNTOLD STORY ENGINE - NPC Motivation System
// Every named NPC has: Desire, Fear, Leverage, Line
// NPCs react in ways that are self-protective, not just good/bad
// ============================================================================

import { 
  getPlayerClothingReaction, 
  ClothingReaction 
} from './clothingReactionSystem';

export interface NPCMotivation {
  npcId: string;
  npcName: string;
  
  // Core motivations
  desire: string;     // What they want
  fear: string;       // What they'll avoid
  leverage: string;   // What can move them
  line: string;       // What they won't tolerate
  
  // Behavioral traits
  behaviors: NPCBehavior[];
  currentStance: NPCStance;
  trustLevel: number; // -100 to 100
  
  // Memory of player interactions
  playerInteractions: PlayerInteractionMemory[];
  lastInteraction?: number;
}

export type NPCStance = 
  | 'friendly' 
  | 'neutral' 
  | 'wary' 
  | 'hostile' 
  | 'terrified'
  | 'opportunistic'
  | 'guarded';

export type NPCBehavior = 
  | 'lies_to_protect_self'
  | 'stalls_for_time'
  | 'tests_loyalty'
  | 'changes_prices'
  | 'demands_proof'
  | 'jealous_of_others'
  | 'flatters_for_gain'
  | 'threatens_subtly'
  | 'withholds_info'
  | 'trades_secrets'
  | 'plays_victim'
  | 'shifts_blame';

export interface PlayerInteractionMemory {
  type: 'positive' | 'negative' | 'neutral';
  action: string;
  impact: number; // -10 to 10
  timestamp: number;
  remembers: boolean; // Will they bring this up?
}

// ============================================================================
// MOTIVATION TEMPLATES BY ARCHETYPE
// ============================================================================

export interface MotivationTemplate {
  desires: string[];
  fears: string[];
  leverages: string[];
  lines: string[];
  behaviors: NPCBehavior[];
}

const ARCHETYPE_MOTIVATIONS: Record<string, MotivationTemplate> = {
  merchant: {
    desires: ['wealth', 'exclusive deals', 'reputation', 'rare goods'],
    fears: ['theft', 'bad debts', 'losing customers', 'guild sanctions'],
    leverages: ['gold', 'rare items', 'protection', 'connections'],
    lines: ['selling to known enemies', 'obvious stolen goods (unless paid well)', 'threats to family'],
    behaviors: ['changes_prices', 'stalls_for_time', 'trades_secrets', 'flatters_for_gain']
  },
  guard: {
    desires: ['order', 'respect', 'promotion', 'quiet shifts'],
    fears: ['losing job', 'violence', 'corruption exposure', 'powerful enemies'],
    leverages: ['bribes', 'authority figures', 'evidence', 'fear of superiors'],
    lines: ['harming innocents', 'open treason', 'betraying squad'],
    behaviors: ['demands_proof', 'threatens_subtly', 'withholds_info', 'stalls_for_time']
  },
  criminal: {
    desires: ['power', 'respect', 'territory', 'profit'],
    fears: ['authorities', 'betrayal', 'stronger rivals', 'exposure'],
    leverages: ['money', 'information', 'shared enemies', 'blackmail'],
    lines: ['harming family', 'betraying the crew', 'working with law'],
    behaviors: ['lies_to_protect_self', 'tests_loyalty', 'threatens_subtly', 'shifts_blame']
  },
  noble: {
    desires: ['status', 'legacy', 'power', 'admiration'],
    fears: ['scandal', 'poverty', 'irrelevance', 'loss of title'],
    leverages: ['social standing', 'secrets', 'political alliances', 'wealth'],
    lines: ['public humiliation', "commoner's insolence", 'family dishonor'],
    behaviors: ['flatters_for_gain', 'withholds_info', 'plays_victim', 'jealous_of_others']
  },
  scholar: {
    desires: ['knowledge', 'recognition', 'funding', 'rare texts'],
    fears: ['ignorance', 'plagiarism', 'irrelevance', 'being wrong'],
    leverages: ['research materials', 'academic recognition', 'mysteries', 'students'],
    lines: ['destroying knowledge', 'intellectual dishonesty', 'harming students'],
    behaviors: ['withholds_info', 'trades_secrets', 'stalls_for_time', 'demands_proof']
  },
  survivor: {
    desires: ['safety', 'resources', 'trust', 'escape'],
    fears: ['betrayal', 'starvation', 'violence', 'being found'],
    leverages: ['protection', 'food', 'shelter', 'passage'],
    lines: ['abandoning allies', 'senseless cruelty', 'going back'],
    behaviors: ['lies_to_protect_self', 'tests_loyalty', 'stalls_for_time', 'plays_victim']
  },
  zealot: {
    desires: ['conversion', 'divine favor', 'righteousness', 'holy war'],
    fears: ['heresy', 'doubt', 'damnation', 'irrelevance'],
    leverages: ['faith symbols', 'religious authority', 'sins to absolve', 'enemies of faith'],
    lines: ['blasphemy', 'denying the faith', 'harming the devout'],
    behaviors: ['demands_proof', 'threatens_subtly', 'shifts_blame', 'plays_victim']
  },
  trickster: {
    desires: ['entertainment', 'chaos', 'reputation', 'clever victories'],
    fears: ['boredom', 'being outsmarted', 'consequences', 'commitment'],
    leverages: ['challenges', 'worthy opponents', 'good stories', 'escape routes'],
    lines: ['boring kills', 'being the predictable villain', 'hurting the innocent (usually)'],
    behaviors: ['lies_to_protect_self', 'tests_loyalty', 'stalls_for_time', 'trades_secrets']
  },
  romantic: {
    desires: ['love', 'connection', 'attention', 'validation'],
    fears: ['rejection', 'loneliness', 'abandonment', 'comparison'],
    leverages: ['affection', 'compliments', 'jealousy', 'shared moments'],
    lines: ['public humiliation', 'betraying heart', 'being forgotten'],
    behaviors: ['jealous_of_others', 'tests_loyalty', 'plays_victim', 'flatters_for_gain']
  }
};

// ============================================================================
// MOTIVATION GENERATION
// ============================================================================

/**
 * Generate motivations for an NPC based on archetype
 */
export function generateNPCMotivation(
  npcId: string,
  npcName: string,
  archetype: string = 'survivor'
): NPCMotivation {
  const template = ARCHETYPE_MOTIVATIONS[archetype] || ARCHETYPE_MOTIVATIONS.survivor;
  
  // Pick random elements from template
  const desire = template.desires[Math.floor(Math.random() * template.desires.length)];
  const fear = template.fears[Math.floor(Math.random() * template.fears.length)];
  const leverage = template.leverages[Math.floor(Math.random() * template.leverages.length)];
  const line = template.lines[Math.floor(Math.random() * template.lines.length)];
  
  // Pick 2-3 behaviors
  const behaviorCount = 2 + Math.floor(Math.random() * 2);
  const shuffledBehaviors = [...template.behaviors].sort(() => Math.random() - 0.5);
  const behaviors = shuffledBehaviors.slice(0, behaviorCount);
  
  return {
    npcId,
    npcName,
    desire,
    fear,
    leverage,
    line,
    behaviors,
    currentStance: 'neutral',
    trustLevel: 0,
    playerInteractions: []
  };
}

/**
 * Detect archetype from NPC role/occupation
 */
export function detectArchetype(role: string): string {
  const roleLower = role.toLowerCase();
  
  if (/merchant|trader|vendor|shopkeeper|seller/i.test(roleLower)) return 'merchant';
  if (/guard|soldier|knight|officer|police/i.test(roleLower)) return 'guard';
  if (/thief|criminal|rogue|gangster|smuggler/i.test(roleLower)) return 'criminal';
  if (/noble|lord|lady|duke|princess|prince|king|queen/i.test(roleLower)) return 'noble';
  if (/scholar|wizard|sage|professor|researcher/i.test(roleLower)) return 'scholar';
  if (/priest|cleric|zealot|monk|nun|fanatic/i.test(roleLower)) return 'zealot';
  if (/trickster|jester|con|charlatan/i.test(roleLower)) return 'trickster';
  if (/lover|admirer|romantic/i.test(roleLower)) return 'romantic';
  
  return 'survivor'; // Default archetype
}

// ============================================================================
// REACTION SYSTEM
// ============================================================================

export interface NPCReaction {
  stance: NPCStance;
  behavior: NPCBehavior | null;
  dialogue: string;
  internalThought: string;
  trustChange: number;
  clothingReaction?: ClothingReaction;
}

export interface NPCReactionContext {
  isPublic?: boolean;
  witnesses?: string[];
  playerReputation?: number;
  locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred';
  checkClothing?: boolean;
}

/**
 * Determine how an NPC reacts to a player action
 */
export function calculateNPCReaction(
  motivation: NPCMotivation,
  playerAction: string,
  context: NPCReactionContext = {}
): NPCReaction {
  const actionLower = playerAction.toLowerCase();
  let trustChange = 0;
  let behavior: NPCBehavior | null = null;
  let stance = motivation.currentStance;
  let clothingReaction: ClothingReaction | undefined;

  // Check clothing reaction if enabled
  if (context.checkClothing !== false) {
    // Detect role from motivation or use default
    const npcRole = detectRoleFromMotivation(motivation);
    clothingReaction = getPlayerClothingReaction(npcRole, context.locationFormality);
    
    // Apply clothing reaction modifiers to trust
    if (clothingReaction.severity !== 'none') {
      trustChange += clothingReaction.trustModifier;
    }
  }
  let dialogue = '';
  let internalThought = '';
  
  // Check if action crosses their line
  if (crossesLine(actionLower, motivation.line)) {
    trustChange = -30;
    stance = 'hostile';
    internalThought = `They crossed my line. I won't forget this.`;
    behavior = pickBehavior(motivation.behaviors, ['threatens_subtly', 'lies_to_protect_self']);
    dialogue = generateLineResponse(motivation);
  }
  // Check if action triggers their fear
  else if (triggersFear(actionLower, motivation.fear)) {
    trustChange = -15;
    stance = calculateStance(motivation.trustLevel + trustChange);
    internalThought = `They're bringing what I fear. I need to protect myself.`;
    behavior = pickBehavior(motivation.behaviors, ['lies_to_protect_self', 'stalls_for_time', 'plays_victim']);
    dialogue = generateFearResponse(motivation);
  }
  // Check if action offers their leverage
  else if (offersLeverage(actionLower, motivation.leverage)) {
    trustChange = 15;
    stance = calculateStance(motivation.trustLevel + trustChange);
    internalThought = `Now we're talking. They have something I want.`;
    behavior = pickBehavior(motivation.behaviors, ['flatters_for_gain', 'trades_secrets']);
    dialogue = generateLeverageResponse(motivation);
  }
  // Check if action appeals to their desire
  else if (appealsToDesire(actionLower, motivation.desire)) {
    trustChange = 10;
    stance = calculateStance(motivation.trustLevel + trustChange);
    internalThought = `They understand what I want. Perhaps they're useful.`;
    dialogue = generateDesireResponse(motivation);
  }
  // Neutral interaction
  else {
    // NPCs test, stall, or guard by default
    if (Math.random() < 0.3 && motivation.behaviors.includes('tests_loyalty')) {
      behavior = 'tests_loyalty';
      dialogue = generateTestResponse(motivation);
      internalThought = `Let's see what they're really about.`;
    } else if (Math.random() < 0.3 && motivation.behaviors.includes('withholds_info')) {
      behavior = 'withholds_info';
      dialogue = generateWithholdResponse(motivation);
      internalThought = `I'll keep this close until I know more.`;
    }
  }

  // If clothing caused significant reaction and no other dialogue, use clothing comment
  if (clothingReaction && clothingReaction.severity !== 'none' && !dialogue) {
    if (clothingReaction.possibleComments.length > 0) {
      dialogue = clothingReaction.possibleComments[Math.floor(Math.random() * clothingReaction.possibleComments.length)];
    }
    if (clothingReaction.internalThoughts.length > 0) {
      internalThought = clothingReaction.internalThoughts[0];
    }
    if (clothingReaction.npcBehaviorTriggers.includes('suspicious')) {
      behavior = 'withholds_info';
    } else if (clothingReaction.npcBehaviorTriggers.includes('dismissive')) {
      stance = 'guarded';
    } else if (clothingReaction.npcBehaviorTriggers.includes('opportunistic')) {
      behavior = 'changes_prices';
    }
  }
  
  return {
    stance,
    behavior,
    dialogue,
    internalThought,
    trustChange,
    clothingReaction
  };
}

/**
 * Detect NPC role from their motivation for clothing reactions
 */
function detectRoleFromMotivation(motivation: NPCMotivation): string | undefined {
  // Check behaviors to infer role
  if (motivation.behaviors.includes('changes_prices')) return 'merchant';
  if (motivation.behaviors.includes('demands_proof')) return 'guard';
  if (motivation.behaviors.includes('tests_loyalty')) return 'criminal';
  if (motivation.behaviors.includes('plays_victim')) return 'survivor';
  return undefined;
}

function calculateStance(trustLevel: number): NPCStance {
  if (trustLevel >= 50) return 'friendly';
  if (trustLevel >= 20) return 'neutral';
  if (trustLevel >= -20) return 'wary';
  if (trustLevel >= -50) return 'guarded';
  return 'hostile';
}

function pickBehavior(available: NPCBehavior[], preferred: NPCBehavior[]): NPCBehavior | null {
  const matching = preferred.filter(b => available.includes(b));
  if (matching.length > 0) {
    return matching[Math.floor(Math.random() * matching.length)];
  }
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return null;
}

// Simple keyword matching (would be enhanced with NLP in production)
function crossesLine(action: string, line: string): boolean {
  const lineWords = line.toLowerCase().split(/\s+/);
  return lineWords.some(word => action.includes(word));
}

function triggersFear(action: string, fear: string): boolean {
  const fearWords = fear.toLowerCase().split(/\s+/);
  return fearWords.some(word => word.length > 3 && action.includes(word));
}

function offersLeverage(action: string, leverage: string): boolean {
  const leverageWords = leverage.toLowerCase().split(/\s+/);
  return leverageWords.some(word => word.length > 3 && action.includes(word));
}

function appealsToDesire(action: string, desire: string): boolean {
  const desireWords = desire.toLowerCase().split(/\s+/);
  return desireWords.some(word => word.length > 3 && action.includes(word));
}

// ============================================================================
// DIALOGUE GENERATION
// ============================================================================

function generateLineResponse(motivation: NPCMotivation): string {
  const responses = [
    `"You go too far. That I will not allow."`,
    `"We're done here. Don't come back."`,
    `"You think you can do that to me? To *me*?"`,
    `"There are some things that can't be forgiven."`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateFearResponse(motivation: NPCMotivation): string {
  const responses = [
    `"I... I don't know what you're talking about."`,
    `"Let's not discuss that. Please."`,
    `"Why would you bring that up? What do you want?"`,
    `"Keep your voice down. Someone might hear."`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateLeverageResponse(motivation: NPCMotivation): string {
  const responses = [
    `"Now you have my attention."`,
    `"Perhaps we can come to an arrangement."`,
    `"I knew you were smarter than you looked."`,
    `"Let's talk privately. Away from prying ears."`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateDesireResponse(motivation: NPCMotivation): string {
  const responses = [
    `"You understand what I need. That's... refreshing."`,
    `"Finally, someone who sees the bigger picture."`,
    `"We might have more in common than I thought."`,
    `"Tell me more about how you can help."`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateTestResponse(motivation: NPCMotivation): string {
  const responses = [
    `"Before we continue... prove I can trust you."`,
    `"Words are cheap. What have you done for me lately?"`,
    `"I've heard promises before. Show me."`,
    `"Trust is earned. What are you offering?"`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

function generateWithholdResponse(motivation: NPCMotivation): string {
  const responses = [
    `"There's more to know, but... not yet."`,
    `"I could tell you, but what's in it for me?"`,
    `"Some things are better left unsaid. For now."`,
    `"You're not ready to hear everything."`,
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

// ============================================================================
// CONTEXT BUILDING FOR AI
// ============================================================================

/**
 * Build motivation context for AI prompts
 */
export function buildNPCMotivationContext(
  motivations: NPCMotivation[], 
  options?: { includeClothingReactions?: boolean; locationFormality?: 'casual' | 'formal' | 'dangerous' | 'sacred' }
): string {
  if (motivations.length === 0) return '';
  
  const lines: string[] = ['### NPC MOTIVATIONS (Use for realistic reactions)'];
  
  for (const m of motivations) {
    lines.push(`**${m.npcName}** [Trust: ${m.trustLevel}, Stance: ${m.currentStance}]`);
    lines.push(`  → Desires: ${m.desire}`);
    lines.push(`  → Fears: ${m.fear}`);
    lines.push(`  → Leverage: ${m.leverage}`);
    lines.push(`  → Line: ${m.line}`);
    
    if (m.behaviors.length > 0) {
      lines.push(`  → Tends to: ${m.behaviors.map(b => b.replace(/_/g, ' ')).join(', ')}`);
    }
    
    // Recent interaction memory
    const recentMemory = m.playerInteractions.filter(i => i.remembers).slice(-2);
    if (recentMemory.length > 0) {
      lines.push(`  → Remembers: ${recentMemory.map(i => i.action).join('; ')}`);
    }

    // Add clothing reaction if enabled
    if (options?.includeClothingReactions) {
      const npcRole = detectRoleFromMotivation(m);
      const clothingReaction = getPlayerClothingReaction(npcRole, options.locationFormality);
      
      if (clothingReaction.severity !== 'none') {
        lines.push(`  → Clothing Reaction: ${clothingReaction.severity.toUpperCase()}`);
        if (clothingReaction.internalThoughts.length > 0) {
          lines.push(`    Thinks: "${clothingReaction.internalThoughts[0]}"`);
        }
        if (clothingReaction.npcBehaviorTriggers.length > 0) {
          lines.push(`    Behavior: ${clothingReaction.npcBehaviorTriggers.join(', ')}`);
        }
      }
    }
  }
  
  lines.push('');
  lines.push('*NPCs should act in self-interest, not as simple good/bad characters.*');
  if (options?.includeClothingReactions) {
    lines.push('*NPCs react to player appearance based on genre expectations and their role.*');
  }
  
  return lines.join('\n');
}

// ============================================================================
// STORAGE
// ============================================================================

const motivationStore: Map<string, NPCMotivation> = new Map();

export function getOrCreateMotivation(npcId: string, npcName: string, role?: string): NPCMotivation {
  const existing = motivationStore.get(npcId);
  if (existing) return existing;
  
  const archetype = role ? detectArchetype(role) : 'survivor';
  const motivation = generateNPCMotivation(npcId, npcName, archetype);
  motivationStore.set(npcId, motivation);
  return motivation;
}

export function updateMotivation(npcId: string, updates: Partial<NPCMotivation>): void {
  const existing = motivationStore.get(npcId);
  if (existing) {
    motivationStore.set(npcId, { ...existing, ...updates });
  }
}

export function recordPlayerInteraction(
  npcId: string, 
  action: string, 
  type: 'positive' | 'negative' | 'neutral',
  impact: number
): void {
  const motivation = motivationStore.get(npcId);
  if (motivation) {
    motivation.playerInteractions.push({
      type,
      action,
      impact,
      timestamp: Date.now(),
      remembers: Math.abs(impact) >= 5 // Remember significant interactions
    });
    motivation.trustLevel = Math.max(-100, Math.min(100, motivation.trustLevel + impact));
    motivation.lastInteraction = Date.now();
    motivation.currentStance = calculateStance(motivation.trustLevel);
  }
}

export function getActiveMotivations(): NPCMotivation[] {
  return Array.from(motivationStore.values());
}

export function clearMotivations(): void {
  motivationStore.clear();
}
