// ============================================================================
// COMPANION AUTONOMY SYSTEM - Full autonomous decision-making for companions
// ============================================================================
// Companions can: refuse quests, leave over disagreements, initiate their own goals,
// and make independent decisions based on their beliefs and relationships

import { CompanionState, CompanionMood, PersonalityTrait, PlayerActionType } from './companionTypes';
import { deriveBeliefSystem, CompanionBeliefs } from '../companionSentienceSystem';

// ============================================================================
// AUTONOMY TYPES
// ============================================================================

export type AutonomousDecisionType =
  | 'quest_refusal'        // Refuses to participate in a quest
  | 'departure_warning'    // Warns they may leave soon
  | 'departure'            // Actually leaves the party
  | 'goal_initiation'      // Initiates their own goal/request
  | 'opinion_voiced'       // Voices strong opinion on situation
  | 'confrontation'        // Confronts player about behavior
  | 'secret_reveal'        // Reveals a personal secret
  | 'romance_advance'      // Makes a romantic advance
  | 'betrayal'             // Turns against the player
  | 'sacrifice_offer'      // Offers to sacrifice for player
  | 'intervention'         // Intervenes in player's decision
  | 'alliance_proposal';   // Proposes alliance with NPC/faction

export type AutonomyLevel = 'passive' | 'reactive' | 'proactive' | 'independent';

export interface AutonomousAction {
  type: AutonomousDecisionType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dialogue: string;
  internalReason: string;
  consequences?: string[];
  playerOptions?: PlayerResponseOption[];
  expiresAfterTurns?: number;
  blocksPlayerAction?: boolean;
}

export interface PlayerResponseOption {
  label: string;
  type: 'agree' | 'disagree' | 'negotiate' | 'dismiss' | 'threaten' | 'comfort';
  affinityChange: number;
  trustChange: number;
  outcome: string;
  /** If true, this response triggers full AI story continuation. 
   * Only use for major story-altering responses (betrayal acceptance, departure, etc).
   * Most companion moments should be self-contained and NOT continue the story. */
  continuesNarrative?: boolean;
}

export interface CompanionGoal {
  id: string;
  type: 'personal' | 'revenge' | 'redemption' | 'romance' | 'wealth' | 'power' | 'knowledge' | 'family';
  description: string;
  priority: number; // 1-100
  progress: number; // 0-100
  isSecret: boolean;
  revealedAt?: number;
  completedAt?: number;
  blockedBy?: string; // Player action that blocks this goal
  requiresPlayerHelp: boolean;
  willLeaveIfBlocked: boolean;
}

export interface AutonomyState {
  level: AutonomyLevel;
  currentGoals: CompanionGoal[];
  pendingActions: AutonomousAction[];
  lastAutonomousAction: number;
  departureWarningIssued: boolean;
  departureCountdown: number; // Turns until departure if issues not resolved
  grievances: CompanionGrievance[];
  loyaltyEvents: LoyaltyEvent[];
}

export interface CompanionGrievance {
  id: string;
  cause: PlayerActionType | string;
  description: string;
  severity: number; // 1-100
  occurredAt: number;
  addressed: boolean;
  addressedAt?: number;
  forgiven: boolean;
}

export interface LoyaltyEvent {
  id: string;
  type: 'positive' | 'negative';
  description: string;
  impact: number;
  occurredAt: number;
}

// ============================================================================
// GOAL GENERATION BASED ON PERSONALITY
// ============================================================================

const GOAL_TEMPLATES: Record<string, Partial<CompanionGoal>[]> = {
  vengeful: [
    { type: 'revenge', description: 'Hunt down the one who wronged me', priority: 85, willLeaveIfBlocked: true },
    { type: 'revenge', description: 'Expose the truth about my past betrayal', priority: 70, willLeaveIfBlocked: false },
  ],
  romantic: [
    { type: 'romance', description: 'Win the heart of someone special', priority: 60, willLeaveIfBlocked: false },
    { type: 'romance', description: 'Build a life with someone who understands me', priority: 75, willLeaveIfBlocked: true },
  ],
  greedy: [
    { type: 'wealth', description: 'Accumulate enough wealth to retire', priority: 80, willLeaveIfBlocked: true },
    { type: 'wealth', description: 'Find the legendary treasure', priority: 65, willLeaveIfBlocked: false },
  ],
  ambitious: [
    { type: 'power', description: 'Rise to a position of influence', priority: 85, willLeaveIfBlocked: true },
    { type: 'power', description: 'Prove I am worthy of leadership', priority: 70, willLeaveIfBlocked: false },
  ],
  spiritual: [
    { type: 'redemption', description: 'Atone for my past sins', priority: 90, willLeaveIfBlocked: true },
    { type: 'knowledge', description: 'Understand my divine purpose', priority: 75, willLeaveIfBlocked: false },
  ],
  loyal: [
    { type: 'family', description: 'Protect those I care about', priority: 95, willLeaveIfBlocked: false },
    { type: 'personal', description: 'Prove my worth to my companions', priority: 60, willLeaveIfBlocked: false },
  ],
  honorable: [
    { type: 'redemption', description: 'Restore my family honor', priority: 85, willLeaveIfBlocked: true },
    { type: 'personal', description: 'Live by my code without compromise', priority: 80, willLeaveIfBlocked: true },
  ],
  skeptical: [
    { type: 'knowledge', description: 'Uncover the truth behind the lies', priority: 75, willLeaveIfBlocked: false },
    { type: 'personal', description: 'Learn who can truly be trusted', priority: 65, willLeaveIfBlocked: false },
  ],
};

export function generateCompanionGoals(traits: PersonalityTrait[]): CompanionGoal[] {
  const goals: CompanionGoal[] = [];
  
  for (const trait of traits) {
    const templates = GOAL_TEMPLATES[trait];
    if (templates && templates.length > 0) {
      // Pick one goal from each relevant trait
      const template = templates[Math.floor(Math.random() * templates.length)];
      goals.push({
        id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: template.type || 'personal',
        description: template.description || 'Pursue my destiny',
        priority: template.priority || 50,
        progress: 0,
        isSecret: Math.random() > 0.5,
        requiresPlayerHelp: Math.random() > 0.3,
        willLeaveIfBlocked: template.willLeaveIfBlocked || false,
      });
    }
  }
  
  // Ensure at least one goal
  if (goals.length === 0) {
    goals.push({
      id: `goal_${Date.now()}_default`,
      type: 'personal',
      description: 'Find my place in this world',
      priority: 50,
      progress: 0,
      isSecret: false,
      requiresPlayerHelp: false,
      willLeaveIfBlocked: false,
    });
  }
  
  return goals.slice(0, 3); // Max 3 goals
}

// ============================================================================
// AUTONOMOUS DECISION ENGINE
// ============================================================================

export function evaluateAutonomousActions(
  companion: CompanionState,
  autonomy: AutonomyState,
  recentPlayerActions: PlayerActionType[] = [],
  situationContext?: string
): AutonomousAction[] {
  const actions: AutonomousAction[] = [];
  const beliefs = deriveBeliefSystem(companion.personality.traits);
  
  // Check for departure conditions
  if (companion.affinity < companion.personality.departureThreshold) {
    if (!autonomy.departureWarningIssued) {
      actions.push(generateDepartureWarning(companion, beliefs));
    } else if (autonomy.departureCountdown <= 0) {
      actions.push(generateDepartureAction(companion, beliefs));
    }
  }
  
  // Check for grievances that need addressing
  const unresolvedGrievances = autonomy.grievances.filter(g => !g.addressed && !g.forgiven);
  if (unresolvedGrievances.length >= 2) {
    actions.push(generateConfrontation(companion, unresolvedGrievances, beliefs));
  }
  
  // Check for goal-based actions
  for (const goal of autonomy.currentGoals) {
    if (goal.progress >= 80 && !goal.completedAt) {
      actions.push(generateGoalCompletionRequest(companion, goal));
    } else if (goal.blockedBy && goal.willLeaveIfBlocked) {
      actions.push(generateBlockedGoalWarning(companion, goal));
    }
  }
  
  // Check for romance progression
  if (companion.romanticInterest >= 70 && !companion.confessedLove && companion.trust >= 60) {
    if (Math.random() < 0.3) { // 30% chance per check
      actions.push(generateRomanceAdvance(companion));
    }
  }
  
  // Check for secret reveal conditions
  if (companion.hasSecret && !companion.secretRevealed && companion.trust >= 75) {
    if (Math.random() < 0.2) { // 20% chance per check
      actions.push(generateSecretReveal(companion));
    }
  }
  
  // Opinion voicing on recent player actions (RARE - only ~15% chance to voice opinions)
  // Companions should react sparingly, not comment on every action
  if (recentPlayerActions.length > 0 && Math.random() < 0.15) {
    // Only react to the most recent action, not all of them
    const action = recentPlayerActions[recentPlayerActions.length - 1];
    if (companion.personality.disapproves.includes(action)) {
      actions.push(generateOpinionVoice(companion, action, 'disapprove', beliefs));
    } else if (companion.personality.approves.includes(action)) {
      // Approval is even rarer - companions don't need to praise constantly
      if (Math.random() < 0.5) {
        actions.push(generateOpinionVoice(companion, action, 'approve', beliefs));
      }
    }
  }
  
  return actions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================================
// ACTION GENERATORS
// ============================================================================

function generateDepartureWarning(companion: CompanionState, beliefs: CompanionBeliefs): AutonomousAction {
  const dialogues = {
    honor_code: `*${companion.name} approaches with a heavy expression* "We need to talk. Your recent choices... they go against everything I believe in. I cannot continue like this much longer."`,
    survivalist: `*${companion.name} pulls you aside* "Look, I've been patient, but this isn't working. If things don't change, I'm out."`,
    idealist: `*${companion.name}'s eyes are troubled* "I joined you believing we shared a vision. But I'm starting to wonder if I was wrong about you."`,
    mercenary: `*${companion.name} counts their share* "The pay isn't worth the headache anymore. Consider this my notice."`,
    loyalist: `*${companion.name} struggles to meet your eyes* "I never thought I'd say this, but... I'm questioning whether I should stay."`,
    chaotic: `*${companion.name} laughs, but there's no humor in it* "You know what? This stopped being fun a while ago."`,
    spiritual: `*${companion.name} closes their eyes* "The signs are clear. Our paths may need to diverge."`,
    intellectual: `*${companion.name} speaks matter-of-factly* "I've analyzed our partnership. The data suggests it's no longer viable."`,
  };
  
  return {
    type: 'departure_warning',
    priority: 'high',
    dialogue: dialogues[beliefs.primaryBelief] || dialogues.survivalist,
    internalReason: `Affinity (${companion.affinity}) approaching departure threshold (${companion.personality.departureThreshold})`,
    consequences: ['Companion will leave if issues not addressed within 3 turns'],
    playerOptions: [
      { label: 'Apologize sincerely', type: 'comfort', affinityChange: 15, trustChange: 5, outcome: 'They seem willing to give you another chance', continuesNarrative: false },
      { label: 'Promise to change', type: 'negotiate', affinityChange: 10, trustChange: -5, outcome: 'They nod skeptically but agree to wait and see', continuesNarrative: false },
      { label: 'Dismiss their concerns', type: 'dismiss', affinityChange: -20, trustChange: -15, outcome: 'Their expression hardens. You may have sealed their decision', continuesNarrative: false },
      { label: 'Let them go', type: 'agree', affinityChange: 0, trustChange: 0, outcome: 'They look hurt but nod. "Maybe that is for the best."', continuesNarrative: true },
    ],
    expiresAfterTurns: 3,
    blocksPlayerAction: false,
  };
}

function generateDepartureAction(companion: CompanionState, beliefs: CompanionBeliefs): AutonomousAction {
  return {
    type: 'departure',
    priority: 'critical',
    dialogue: `*${companion.name} gathers their belongings* "I've made my decision. Our journey together ends here. Perhaps in another life, we could have been great allies. But not like this."`,
    internalReason: 'Departure countdown expired without resolution',
    consequences: ['Companion leaves the party permanently', 'May become hostile or neutral NPC'],
    blocksPlayerAction: true,
  };
}

function generateConfrontation(companion: CompanionState, grievances: CompanionGrievance[], beliefs: CompanionBeliefs): AutonomousAction {
  const grievanceList = grievances.map(g => g.description).join(', ');
  
  return {
    type: 'confrontation',
    priority: 'high',
    dialogue: `*${companion.name} blocks your path, their expression serious* "We need to talk. Now. ${grievanceList}... These things have been weighing on me. I need to know where you stand."`,
    internalReason: `${grievances.length} unresolved grievances`,
    playerOptions: [
      { label: 'Acknowledge and apologize', type: 'comfort', affinityChange: 20, trustChange: 10, outcome: 'They seem relieved that you listened', continuesNarrative: false },
      { label: 'Explain your reasoning', type: 'negotiate', affinityChange: 5, trustChange: 5, outcome: 'They consider your words carefully', continuesNarrative: false },
      { label: 'Tell them to deal with it', type: 'dismiss', affinityChange: -25, trustChange: -20, outcome: 'Their jaw tightens. "I see how it is."', continuesNarrative: false },
      { label: 'Threaten consequences', type: 'threaten', affinityChange: -40, trustChange: -30, outcome: 'Fear flickers in their eyes, but so does anger', continuesNarrative: false },
    ],
    blocksPlayerAction: false,
  };
}

function generateGoalCompletionRequest(companion: CompanionState, goal: CompanionGoal): AutonomousAction {
  return {
    type: 'goal_initiation',
    priority: 'medium',
    dialogue: `*${companion.name} approaches you with determination* "I've been working toward something for a long time now. ${goal.description}. I'm so close. Will you help me finish this?"`,
    internalReason: `Goal "${goal.description}" at ${goal.progress}% completion`,
    playerOptions: [
      { label: 'Of course, I\'ll help', type: 'agree', affinityChange: 25, trustChange: 20, outcome: 'Their face lights up with gratitude', continuesNarrative: true },
      { label: 'What\'s in it for me?', type: 'negotiate', affinityChange: -5, trustChange: -10, outcome: 'They hide their disappointment but nod', continuesNarrative: false },
      { label: 'We have other priorities', type: 'disagree', affinityChange: -15, trustChange: -5, outcome: 'They look crestfallen but accept', continuesNarrative: false },
    ],
    blocksPlayerAction: false,
  };
}

function generateBlockedGoalWarning(companion: CompanionState, goal: CompanionGoal): AutonomousAction {
  return {
    type: 'opinion_voiced',
    priority: 'high',
    dialogue: `*${companion.name} pulls you aside, frustration evident* "What you did... it's making my goal impossible. ${goal.description}... If this continues, I'll have no choice but to leave and pursue it alone."`,
    internalReason: `Goal blocked by player action: ${goal.blockedBy}`,
    consequences: ['Companion may leave if blocking action continues'],
    blocksPlayerAction: false,
  };
}

function generateRomanceAdvance(companion: CompanionState): AutonomousAction {
  return {
    type: 'romance_advance',
    priority: 'medium',
    dialogue: `*${companion.name} seems unusually nervous, finding you alone* "I... there's something I need to say. These moments we've shared, the way you look at me... I can't pretend anymore. I have feelings for you."`,
    internalReason: `Romance interest (${companion.romanticInterest}) exceeded threshold with high trust (${companion.trust})`,
    playerOptions: [
      { label: 'I feel the same way', type: 'agree', affinityChange: 40, trustChange: 30, outcome: 'They smile, reaching for your hand', continuesNarrative: false },
      { label: 'I need time to think', type: 'negotiate', affinityChange: 5, trustChange: -5, outcome: 'They nod, trying to hide their anxiety', continuesNarrative: false },
      { label: 'I don\'t feel that way', type: 'disagree', affinityChange: -30, trustChange: 5, outcome: 'Pain flashes across their face, but they compose themselves', continuesNarrative: false },
    ],
    blocksPlayerAction: false,
  };
}

function generateSecretReveal(companion: CompanionState): AutonomousAction {
  return {
    type: 'secret_reveal',
    priority: 'medium',
    dialogue: `*${companion.name} finds you in a quiet moment, their expression vulnerable* "There's something about my past I've never told anyone. I trust you enough now to share it..."`,
    internalReason: `Trust (${companion.trust}) high enough for secret reveal`,
    consequences: ['New dialogue options may unlock', 'Companion becomes more vulnerable'],
    blocksPlayerAction: false,
  };
}

function generateOpinionVoice(
  companion: CompanionState, 
  action: PlayerActionType, 
  sentiment: 'approve' | 'disapprove',
  beliefs: CompanionBeliefs
): AutonomousAction {
  const approvalDialogues = [
    `*${companion.name} nods approvingly* "That's exactly what I would have done."`,
    `*${companion.name} catches your eye* "Well handled. I knew I was right about you."`,
    `*${companion.name} seems pleased* "Now THAT is why I follow you."`,
  ];
  
  const disapprovalDialogues = [
    `*${companion.name}'s expression darkens* "I... did not expect that from you."`,
    `*${companion.name} averts their gaze* "We need to talk about what just happened."`,
    `*${companion.name} mutters* "This isn't who I thought you were."`,
  ];
  
  const dialogues = sentiment === 'approve' ? approvalDialogues : disapprovalDialogues;
  
  return {
    type: 'opinion_voiced',
    priority: sentiment === 'approve' ? 'low' : 'medium',
    dialogue: dialogues[Math.floor(Math.random() * dialogues.length)],
    internalReason: `Reacting to player action: ${action} (${sentiment})`,
    blocksPlayerAction: false,
  };
}

// ============================================================================
// AUTONOMY STATE MANAGEMENT
// ============================================================================

export function createDefaultAutonomyState(traits: PersonalityTrait[]): AutonomyState {
  return {
    level: 'reactive',
    currentGoals: generateCompanionGoals(traits),
    pendingActions: [],
    lastAutonomousAction: Date.now(),
    departureWarningIssued: false,
    departureCountdown: 3,
    grievances: [],
    loyaltyEvents: [],
  };
}

export function addGrievance(
  state: AutonomyState, 
  cause: PlayerActionType | string, 
  description: string, 
  severity: number
): AutonomyState {
  const grievance: CompanionGrievance = {
    id: `grievance_${Date.now()}`,
    cause,
    description,
    severity: Math.max(1, Math.min(100, severity)),
    occurredAt: Date.now(),
    addressed: false,
    forgiven: false,
  };
  
  return {
    ...state,
    grievances: [...state.grievances, grievance],
  };
}

export function addressGrievance(state: AutonomyState, grievanceId: string, forgive: boolean): AutonomyState {
  return {
    ...state,
    grievances: state.grievances.map(g => 
      g.id === grievanceId 
        ? { ...g, addressed: true, addressedAt: Date.now(), forgiven: forgive }
        : g
    ),
  };
}

export function updateGoalProgress(state: AutonomyState, goalId: string, progress: number): AutonomyState {
  return {
    ...state,
    currentGoals: state.currentGoals.map(g =>
      g.id === goalId
        ? { ...g, progress: Math.max(0, Math.min(100, progress)) }
        : g
    ),
  };
}

console.log('[CompanionAutonomy] Autonomous decision system loaded');
