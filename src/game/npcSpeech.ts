// NPC Speech System - Verbal Budget, Truth Strategy, Motivation Vectors, Conflict & Escalation

import { NPC, SocialRankEntry, EmotionalState, ConflictStyle, EscalationState } from '@/types/game';

// ============= VERBAL BUDGET SYSTEM =============

export type VerbalBudgetTier = 'MICRO' | 'SHORT' | 'NORMAL' | 'LONG' | 'HUGE';

export type SpeechModule = 
  | 'observation'      // What they notice
  | 'interpretation'   // What it means to them
  | 'personalStake'    // Why they care
  | 'constraint'       // Why they can't act freely
  | 'prediction'       // What they think will happen
  | 'askOffer'         // What they want from player
  | 'warning'          // Consequence
  | 'memoryHook';      // Past shaping belief

export interface VerbalBudgetContext {
  safetyLevel: number;        // 0-100, how safe they feel
  authorityPresent: boolean;  // Is an authority figure present?
  stressLevel: number;        // 0-100, current stress
  wantsSomething: boolean;    // Do they want something from the player?
  relationshipTrust: number;  // -100 to 100
  scarTriggered: boolean;     // Is their trauma activated?
}

const BUDGET_MODULE_COUNTS: Record<VerbalBudgetTier, number> = {
  MICRO: 1,
  SHORT: 2,
  NORMAL: 3,
  LONG: 5,
  HUGE: 6,
};

export function calculateVerbalBudget(context: VerbalBudgetContext): VerbalBudgetTier {
  let score = 0;
  
  // Safety increases budget
  score += context.safetyLevel * 0.3;
  
  // Trust increases budget
  score += (context.relationshipTrust + 100) * 0.15;
  
  // Wanting something increases budget (they need to communicate)
  if (context.wantsSomething) score += 15;
  
  // Authority presence decreases budget (careful speech)
  if (context.authorityPresent) score -= 20;
  
  // High stress decreases budget (focused, tense)
  score -= context.stressLevel * 0.2;
  
  // Triggered scar dramatically changes speech
  if (context.scarTriggered) score -= 30;
  
  // Map score to tier
  if (score < 20) return 'MICRO';
  if (score < 40) return 'SHORT';
  if (score < 60) return 'NORMAL';
  if (score < 80) return 'LONG';
  return 'HUGE';
}

export function selectSpeechModules(budget: VerbalBudgetTier, npc: NPC, context: VerbalBudgetContext): SpeechModule[] {
  const moduleCount = BUDGET_MODULE_COUNTS[budget];
  const modules: SpeechModule[] = [];
  
  // Priority order based on NPC state and context
  const prioritizedModules: SpeechModule[] = [];
  
  // If they want something, lead with ask/offer
  if (context.wantsSomething) {
    prioritizedModules.push('askOffer');
  }
  
  // If stressed/scared, add warning
  if (context.stressLevel > 50 || context.scarTriggered) {
    prioritizedModules.push('warning');
  }
  
  // Always include observation as base
  prioritizedModules.push('observation');
  
  // Add interpretation based on personality
  if (npc.meta.traits.includes('curious') || npc.meta.traits.includes('suspicious')) {
    prioritizedModules.push('interpretation');
  }
  
  // Add personal stake for emotional characters
  if (npc.meta.traits.includes('protective') || npc.meta.traits.includes('greedy')) {
    prioritizedModules.push('personalStake');
  }
  
  // Add constraint for trapped/fearful characters
  if (npc.threatModel.defaultDefense === 'avoidance' || context.authorityPresent) {
    prioritizedModules.push('constraint');
  }
  
  // Add prediction for strategic thinkers
  if (npc.meta.traits.includes('cunning') || npc.meta.traits.includes('ambitious')) {
    prioritizedModules.push('prediction');
  }
  
  // Add memory hook for nostalgic/secretive characters
  if (npc.meta.traits.includes('secretive') || npc.emotionalState.current === 'nostalgic') {
    prioritizedModules.push('memoryHook');
  }
  
  // Fill remaining with defaults
  const defaults: SpeechModule[] = ['observation', 'interpretation', 'personalStake', 'constraint', 'prediction', 'askOffer', 'warning', 'memoryHook'];
  for (const mod of defaults) {
    if (!prioritizedModules.includes(mod)) {
      prioritizedModules.push(mod);
    }
  }
  
  // Select up to moduleCount
  for (let i = 0; i < Math.min(moduleCount, prioritizedModules.length); i++) {
    modules.push(prioritizedModules[i]);
  }
  
  return modules;
}

// ============= TRUTH STRATEGY SYSTEM =============

export type TruthStrategy = 
  | 'TRANSPARENT'     // Rare, only with high intimacy
  | 'SELECTIVE'       // Most common, shares some, withholds some
  | 'PERFORMATIVE'    // Says what wins social outcome
  | 'DEFENSIVE'       // Withholds, asks questions back
  | 'MANIPULATIVE'    // Truth as weapon
  | 'MYTHIC'          // Speaks in beliefs and symbols
  | 'INSTITUTIONAL';  // Policy voice, official lines

export interface TruthContext {
  fearLevel: number;        // 0-100
  authorityPresent: boolean;
  intimacyWithPlayer: number; // -100 to 100
  identityThreatened: boolean;
  topicSensitivity: 'low' | 'medium' | 'high' | 'critical';
}

export function determineTruthStrategy(npc: NPC, context: TruthContext): TruthStrategy {
  // High intimacy + low fear = Transparent
  if (context.intimacyWithPlayer > 60 && context.fearLevel < 20 && !context.identityThreatened) {
    return 'TRANSPARENT';
  }
  
  // Authority present = Institutional (for guards, officials)
  if (context.authorityPresent && npc.meta.traits.includes('honest')) {
    return 'INSTITUTIONAL';
  }
  
  // Identity threatened = Defensive
  if (context.identityThreatened) {
    return 'DEFENSIVE';
  }
  
  // High fear = varies by personality
  if (context.fearLevel > 60) {
    if (npc.threatModel.defaultDefense === 'deception') return 'MANIPULATIVE';
    if (npc.threatModel.defaultDefense === 'avoidance') return 'DEFENSIVE';
    return 'PERFORMATIVE';
  }
  
  // Secretive or nostalgic characters lean mythic
  if (npc.meta.traits.includes('secretive') && npc.emotionalState.current === 'nostalgic') {
    return 'MYTHIC';
  }
  
  // Cunning characters are performative
  if (npc.meta.traits.includes('cunning') || npc.meta.traits.includes('greedy')) {
    return 'PERFORMATIVE';
  }
  
  // Default to selective
  return 'SELECTIVE';
}

export function filterFactsByTruthStrategy(
  npc: NPC, 
  strategy: TruthStrategy, 
  playerTrust: number
): { fact: string; willShare: boolean; framing: 'direct' | 'vague' | 'misleading' | 'symbolic' }[] {
  return npc.knownFacts.map(kf => {
    let willShare = false;
    let framing: 'direct' | 'vague' | 'misleading' | 'symbolic' = 'direct';
    
    switch (strategy) {
      case 'TRANSPARENT':
        willShare = kf.reliability !== 'invented';
        framing = 'direct';
        break;
        
      case 'SELECTIVE':
        willShare = kf.reliability === 'witnessed' || kf.reliability === 'trusted_source';
        framing = 'vague';
        break;
        
      case 'PERFORMATIVE':
        // Only share if it benefits them
        willShare = true;
        framing = 'vague';
        break;
        
      case 'DEFENSIVE':
        willShare = false;
        framing = 'vague';
        break;
        
      case 'MANIPULATIVE':
        willShare = true;
        framing = 'misleading';
        break;
        
      case 'MYTHIC':
        willShare = kf.reliability === 'witnessed';
        framing = 'symbolic';
        break;
        
      case 'INSTITUTIONAL':
        willShare = kf.shareCondition.includes('freely');
        framing = 'direct';
        break;
    }
    
    return { fact: kf.fact, willShare, framing };
  });
}

// ============= MOTIVATION VECTOR SYSTEM =============

export type MotivationVector = 
  | 'ACQUIRE'   // Wants resources, allies, information
  | 'DEFEND'    // Protecting status, territory, reputation
  | 'RELIEVE'   // Reducing stress, guilt, loneliness
  | 'ASSERT'    // Establishing control, dominance, validation
  | 'OBSERVE'   // Gathering data quietly
  | 'ESCAPE';   // Exit danger or obligation

export interface MotivationContext {
  playerPresent: boolean;
  recentStressEvent: boolean;
  needsSatisfaction: Record<string, number>; // type -> satisfaction 0-100
  currentThreatLevel: number; // 0-100
  socialRankOfPlayer: SocialRankEntry;
}

export function calculateMotivation(npc: NPC, context: MotivationContext): MotivationVector {
  // Escape if high threat
  if (context.currentThreatLevel > 70) {
    return 'ESCAPE';
  }
  
  // Find lowest need
  const lowestNeed = npc.needs.reduce((lowest, current) => 
    current.satisfaction < lowest.satisfaction ? current : lowest
  );
  
  // Map needs to motivations
  if (lowestNeed.satisfaction < 30) {
    switch (lowestNeed.type) {
      case 'survival':
        return 'ACQUIRE';
      case 'stability':
        return context.currentThreatLevel > 30 ? 'ESCAPE' : 'DEFEND';
      case 'status':
        return 'ASSERT';
      case 'belonging':
        return 'RELIEVE';
      case 'meaning':
        return context.socialRankOfPlayer.intimacy > 20 ? 'RELIEVE' : 'OBSERVE';
    }
  }
  
  // If stressed, seek relief
  if (context.recentStressEvent) {
    return 'RELIEVE';
  }
  
  // Default behaviors by personality
  if (npc.meta.traits.includes('suspicious') || npc.meta.traits.includes('secretive')) {
    return 'OBSERVE';
  }
  if (npc.meta.traits.includes('greedy') || npc.meta.traits.includes('ambitious')) {
    return 'ACQUIRE';
  }
  if (npc.meta.traits.includes('protective')) {
    return 'DEFEND';
  }
  if (npc.meta.traits.includes('aggressive')) {
    return 'ASSERT';
  }
  
  // Default to observation
  return 'OBSERVE';
}

export function getMotivationBehavior(motivation: MotivationVector): {
  wordChoice: string;
  sentenceLength: 'short' | 'medium' | 'long';
  continueWillingness: number; // 0-100
  informationVolunteer: 'low' | 'medium' | 'high';
} {
  switch (motivation) {
    case 'ACQUIRE':
      return {
        wordChoice: 'transactional, probing questions',
        sentenceLength: 'medium',
        continueWillingness: 80,
        informationVolunteer: 'medium',
      };
    case 'DEFEND':
      return {
        wordChoice: 'justifications, hedging, blame shifting',
        sentenceLength: 'long',
        continueWillingness: 60,
        informationVolunteer: 'low',
      };
    case 'RELIEVE':
      return {
        wordChoice: 'emotional leakage, over-sharing',
        sentenceLength: 'long',
        continueWillingness: 90,
        informationVolunteer: 'high',
      };
    case 'ASSERT':
      return {
        wordChoice: 'firm tone, testing boundaries',
        sentenceLength: 'short',
        continueWillingness: 50,
        informationVolunteer: 'low',
      };
    case 'OBSERVE':
      return {
        wordChoice: 'short answers, deflection',
        sentenceLength: 'short',
        continueWillingness: 40,
        informationVolunteer: 'low',
      };
    case 'ESCAPE':
      return {
        wordChoice: 'rushed, topic changes',
        sentenceLength: 'short',
        continueWillingness: 10,
        informationVolunteer: 'low',
      };
  }
}

// ============= COMBINED NPC RESPONSE GENERATION =============

export interface NPCResponseContext {
  playerInput: string;
  playerLocation: string;
  presentNPCs: string[];
  timeOfDay: string;
  recentEvents: string[];
  playerTrust: number;
  authorityPresent: boolean;
}

export interface NPCResponseData {
  verbalBudget: VerbalBudgetTier;
  selectedModules: SpeechModule[];
  truthStrategy: TruthStrategy;
  motivation: MotivationVector;
  motivationBehavior: ReturnType<typeof getMotivationBehavior>;
  shareableFacts: { fact: string; willShare: boolean; framing: string }[];
}

export function generateNPCResponseContext(npc: NPC, context: NPCResponseContext): NPCResponseData {
  // Get social ranking for player
  const playerRanking = npc.socialRanking.player || { trust: 0, utility: 0, fear: 0, intimacy: 0 };
  
  // Calculate safety and stress
  const safetyLevel = 100 - playerRanking.fear - (context.authorityPresent && npc.id !== 'npc_guard_james' ? 20 : 0);
  const stressLevel = 100 - npc.needs.reduce((sum, n) => sum + n.satisfaction, 0) / npc.needs.length;
  
  // Check if scar is triggered
  const scarTriggered = npc.emotionalState.scarTriggers.some(trigger => 
    context.playerInput.toLowerCase().includes(trigger.toLowerCase()) ||
    context.recentEvents.some(evt => evt.toLowerCase().includes(trigger.toLowerCase()))
  );
  
  // Check if identity is threatened
  const identityThreatened = context.playerInput.toLowerCase().includes(npc.identity.identityThreat.toLowerCase().split(' ')[0]);
  
  // Calculate verbal budget
  const budgetContext: VerbalBudgetContext = {
    safetyLevel: Math.max(0, Math.min(100, safetyLevel)),
    authorityPresent: context.authorityPresent,
    stressLevel: Math.max(0, Math.min(100, stressLevel)),
    wantsSomething: npc.meta.desires.length > 0,
    relationshipTrust: playerRanking.trust,
    scarTriggered,
  };
  
  const verbalBudget = calculateVerbalBudget(budgetContext);
  const selectedModules = selectSpeechModules(verbalBudget, npc, budgetContext);
  
  // Determine truth strategy
  const truthContext: TruthContext = {
    fearLevel: playerRanking.fear,
    authorityPresent: context.authorityPresent,
    intimacyWithPlayer: playerRanking.intimacy,
    identityThreatened,
    topicSensitivity: scarTriggered ? 'critical' : 'medium',
  };
  
  const truthStrategy = determineTruthStrategy(npc, truthContext);
  const shareableFacts = filterFactsByTruthStrategy(npc, truthStrategy, context.playerTrust);
  
  // Calculate motivation
  const needsSatisfaction: Record<string, number> = {};
  npc.needs.forEach(n => { needsSatisfaction[n.type] = n.satisfaction; });
  
  const motivationContext: MotivationContext = {
    playerPresent: true,
    recentStressEvent: context.recentEvents.length > 0,
    needsSatisfaction,
    currentThreatLevel: playerRanking.fear,
    socialRankOfPlayer: playerRanking,
  };
  
  const motivation = calculateMotivation(npc, motivationContext);
  const motivationBehavior = getMotivationBehavior(motivation);
  
  return {
    verbalBudget,
    selectedModules,
    truthStrategy,
    motivation,
    motivationBehavior,
    shareableFacts,
  };
}

// ============= CONFLICT & ESCALATION SYSTEM (Prompt 1.5) =============

export interface ConflictBehavior {
  responseStyle: string;
  escalationTendency: 'quick' | 'slow' | 'none';
  deescalationMethod: string;
  dialogueModifiers: string[];
}

export function getConflictBehavior(style: ConflictStyle): ConflictBehavior {
  switch (style) {
    case 'AVOIDANT':
      return {
        responseStyle: 'delays, dodges, minimizes',
        escalationTendency: 'slow',
        deescalationMethod: 'changes topic, agrees superficially',
        dialogueModifiers: ['vague answers', 'topic changes', 'nervous laughter'],
      };
    case 'PASSIVE_AGGRESSIVE':
      return {
        responseStyle: 'indirect jabs, sarcasm, backhanded compliments',
        escalationTendency: 'slow',
        deescalationMethod: 'retreats while maintaining deniability',
        dialogueModifiers: ['sarcastic tone', 'subtle insults', 'forced smiles'],
      };
    case 'NEGOTIATIVE':
      return {
        responseStyle: 'bargains, reframes, seeks compromise',
        escalationTendency: 'none',
        deescalationMethod: 'offers alternatives, finds common ground',
        dialogueModifiers: ['diplomatic language', 'offers', 'questions'],
      };
    case 'DOMINANT':
      return {
        responseStyle: 'sets terms, escalates quickly, demands compliance',
        escalationTendency: 'quick',
        deescalationMethod: 'only deescalates when opponent submits',
        dialogueModifiers: ['commands', 'ultimatums', 'firm tone'],
      };
    case 'MORALISTIC':
      return {
        responseStyle: 'frames as right vs wrong, appeals to principles',
        escalationTendency: 'slow',
        deescalationMethod: 'requires acknowledgment of moral position',
        dialogueModifiers: ['moral appeals', 'principle references', 'disappointment'],
      };
    case 'RESIGNED':
      return {
        responseStyle: 'expects loss, complies bitterly, martyrdom',
        escalationTendency: 'none',
        deescalationMethod: 'gives up before conflict peaks',
        dialogueModifiers: ['sighs', 'bitter acceptance', 'fatalistic comments'],
      };
  }
}

export interface EscalationModifiers {
  toneShift: string;
  cooperationLevel: number; // 0-100
  informationWillingness: 'none' | 'minimal' | 'guarded' | 'normal' | 'open';
  bodyLanguage: string;
}

export function getEscalationModifiers(state: EscalationState): EscalationModifiers {
  switch (state) {
    case 'POLITE_DISTANCE':
      return {
        toneShift: 'neutral, professional',
        cooperationLevel: 70,
        informationWillingness: 'normal',
        bodyLanguage: 'relaxed but reserved',
      };
    case 'GUARDED_HONESTY':
      return {
        toneShift: 'careful, measured',
        cooperationLevel: 55,
        informationWillingness: 'guarded',
        bodyLanguage: 'slightly tense, watchful',
      };
    case 'IRRITATION':
      return {
        toneShift: 'clipped, impatient',
        cooperationLevel: 40,
        informationWillingness: 'minimal',
        bodyLanguage: 'crossed arms, frowning',
      };
    case 'DEFENSIVE_JUSTIFICATION':
      return {
        toneShift: 'defensive, explaining, justifying',
        cooperationLevel: 25,
        informationWillingness: 'minimal',
        bodyLanguage: 'backing away, hands up',
      };
    case 'OPEN_HOSTILITY':
      return {
        toneShift: 'aggressive, threatening',
        cooperationLevel: 10,
        informationWillingness: 'none',
        bodyLanguage: 'aggressive stance, glaring',
      };
    case 'WITHDRAWAL_OR_CONFRONTATION':
      return {
        toneShift: 'final, ultimatum or silence',
        cooperationLevel: 0,
        informationWillingness: 'none',
        bodyLanguage: 'turning away or squaring up',
      };
  }
}

export interface EscalationTrigger {
  type: 'identity_challenge' | 'need_threat' | 'boundary_violation' | 'unresolved_tension' | 'validation' | 'offering' | 'vulnerability' | 'time_passage';
  delta: number; // positive = escalate, negative = deescalate
}

export function evaluateEscalationTriggers(
  npc: NPC,
  playerInput: string,
  context: { recentEvents: string[]; timeSinceLastConflict: number }
): EscalationTrigger[] {
  const triggers: EscalationTrigger[] = [];
  const input = playerInput.toLowerCase();
  
  // Check identity challenge
  const identityWords = npc.identity.identityThreat.toLowerCase().split(' ');
  if (identityWords.some(word => word.length > 3 && input.includes(word))) {
    triggers.push({ type: 'identity_challenge', delta: 2 });
  }
  
  // Check need threats (mentions of their fears or weak points)
  const fearWords = npc.threatModel.fears.flatMap(f => f.toLowerCase().split(' '));
  if (fearWords.some(word => word.length > 3 && input.includes(word))) {
    triggers.push({ type: 'need_threat', delta: 1 });
  }
  
  // Check for validation (positive words, agreement)
  const validationWords = ['agree', 'right', 'understand', 'sorry', 'thank', 'appreciate', 'respect'];
  if (validationWords.some(word => input.includes(word))) {
    triggers.push({ type: 'validation', delta: -1 });
  }
  
  // Check for offering (help, give, offer)
  const offeringWords = ['help', 'give', 'offer', 'share', 'support'];
  if (offeringWords.some(word => input.includes(word))) {
    triggers.push({ type: 'offering', delta: -1 });
  }
  
  // Check for vulnerability (personal disclosure)
  const vulnerabilityWords = ['feel', 'struggle', 'afraid', 'worried', 'hope'];
  if (vulnerabilityWords.some(word => input.includes(word))) {
    triggers.push({ type: 'vulnerability', delta: -1 });
  }
  
  // Time passage helps deescalation
  if (context.timeSinceLastConflict > 5) {
    triggers.push({ type: 'time_passage', delta: -1 });
  }
  
  // Check for boundary violations (demands, commands)
  const boundaryWords = ['must', 'demand', 'tell me', 'now', 'immediately'];
  if (boundaryWords.some(word => input.includes(word))) {
    triggers.push({ type: 'boundary_violation', delta: 1 });
  }
  
  return triggers;
}

export function calculateEscalationDelta(
  npc: NPC,
  triggers: EscalationTrigger[]
): number {
  let baseDelta = triggers.reduce((sum, t) => sum + t.delta, 0);
  
  // Modify by conflict style
  const conflictBehavior = getConflictBehavior(npc.conflictStyle);
  switch (conflictBehavior.escalationTendency) {
    case 'quick':
      baseDelta = baseDelta > 0 ? baseDelta * 1.5 : baseDelta * 0.5;
      break;
    case 'slow':
      baseDelta = baseDelta > 0 ? baseDelta * 0.5 : baseDelta * 1.5;
      break;
    case 'none':
      baseDelta = baseDelta > 0 ? 0 : baseDelta;
      break;
  }
  
  // High stress makes escalation easier
  if (npc.stressLevel > 60) {
    baseDelta += 0.5;
  }
  
  return Math.round(baseDelta);
}

export function getEscalationDialoguePrefix(state: EscalationState, style: ConflictStyle): string {
  const modifiers = getEscalationModifiers(state);
  const behavior = getConflictBehavior(style);
  
  switch (state) {
    case 'POLITE_DISTANCE':
      return '';
    case 'GUARDED_HONESTY':
      if (style === 'AVOIDANT') return '*glances away* ';
      if (style === 'PASSIVE_AGGRESSIVE') return '*thin smile* ';
      return '*pauses carefully* ';
    case 'IRRITATION':
      if (style === 'DOMINANT') return '*jaw tightens* ';
      if (style === 'MORALISTIC') return '*sighs disapprovingly* ';
      return '*frowns* ';
    case 'DEFENSIVE_JUSTIFICATION':
      if (style === 'AVOIDANT') return '*backs up slightly* ';
      if (style === 'RESIGNED') return '*shoulders slump* ';
      return '*voice rises* ';
    case 'OPEN_HOSTILITY':
      if (style === 'DOMINANT') return '*steps forward aggressively* ';
      if (style === 'PASSIVE_AGGRESSIVE') return '*cold stare* ';
      return '*voice hardens* ';
    case 'WITHDRAWAL_OR_CONFRONTATION':
      if (style === 'AVOIDANT' || style === 'RESIGNED') return '*turns away* ';
      return '*final warning tone* ';
  }
}

export function updateNPCStress(npc: NPC, triggers: EscalationTrigger[]): number {
  let stressChange = 0;
  
  for (const trigger of triggers) {
    switch (trigger.type) {
      case 'identity_challenge':
        stressChange += 15;
        break;
      case 'need_threat':
        stressChange += 10;
        break;
      case 'boundary_violation':
        stressChange += 8;
        break;
      case 'validation':
        stressChange -= 5;
        break;
      case 'offering':
        stressChange -= 3;
        break;
      case 'vulnerability':
        stressChange -= 5;
        break;
      case 'time_passage':
        stressChange -= 2;
        break;
    }
  }
  
  return Math.max(0, Math.min(100, npc.stressLevel + stressChange));
}
