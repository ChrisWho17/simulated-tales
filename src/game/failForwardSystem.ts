// Fail-Forward System - Failures create content, not dead ends
// "Yes, but it costs" philosophy

export type FailureType = 
  | 'skill_check'
  | 'combat'
  | 'social'
  | 'stealth'
  | 'resource'
  | 'time'
  | 'luck';

export type CostCategory = 
  | 'equipment'     // Tool breaks, item lost
  | 'favor'         // Someone wants something later
  | 'exposure'      // Left evidence, seen, tracked
  | 'injury'        // Physical harm
  | 'reputation'    // Word gets around
  | 'relationship'  // Someone's opinion changes
  | 'time'          // Took longer, missed window
  | 'resource'      // Used up supplies
  | 'information'   // Revealed something about yourself
  | 'opportunity';  // Closed a door

export interface FailForwardCost {
  category: CostCategory;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  immediateEffect: string;
  futureHook?: string; // Creates content later
  mechanicalEffect?: {
    stat?: string;
    value?: number;
    duration?: number; // turns
  };
}

export interface FailForwardResult {
  succeeded: boolean;
  wasFailForward: boolean;
  outcomeDescription: string;
  costs: FailForwardCost[];
  narrativeHooks: string[];
  mechanicalChanges: Array<{
    type: string;
    target: string;
    value: number;
  }>;
}

// Cost templates by failure type
const COST_TEMPLATES: Record<FailureType, FailForwardCost[][]> = {
  skill_check: [
    [
      { category: 'equipment', description: 'Your tool snaps at a crucial moment', severity: 'moderate', immediateEffect: 'Tool is broken', futureHook: 'You need to find a replacement or improvise' },
      { category: 'time', description: 'It takes much longer than expected', severity: 'minor', immediateEffect: 'Hours pass', futureHook: 'Someone noticed you were gone' }
    ],
    [
      { category: 'exposure', description: 'You leave clear signs of your attempt', severity: 'moderate', immediateEffect: 'Evidence remains', futureHook: 'Someone will find this and ask questions' },
      { category: 'injury', description: 'A sharp edge catches you', severity: 'minor', immediateEffect: 'Minor wound', mechanicalEffect: { stat: 'health', value: -5, duration: 0 } }
    ]
  ],
  combat: [
    [
      { category: 'injury', description: 'You win, but they got a good hit in', severity: 'moderate', immediateEffect: 'Bleeding wound', futureHook: 'You leave a blood trail', mechanicalEffect: { stat: 'health', value: -15, duration: 0 } },
      { category: 'exposure', description: 'The noise draws attention', severity: 'minor', immediateEffect: 'Someone heard', futureHook: 'Witnesses will talk' }
    ],
    [
      { category: 'equipment', description: 'Your weapon is damaged in the exchange', severity: 'moderate', immediateEffect: 'Weapon condition reduced', futureHook: 'It might fail at a critical moment' },
      { category: 'reputation', description: 'Word spreads about your violent methods', severity: 'minor', immediateEffect: 'People are wary', futureHook: 'Some doors close, others open' }
    ]
  ],
  social: [
    [
      { category: 'favor', description: 'They agree, but theyll want something later', severity: 'moderate', immediateEffect: 'You owe them', futureHook: 'They will call in this favor at the worst time' },
      { category: 'information', description: 'You revealed more than intended to convince them', severity: 'minor', immediateEffect: 'They know something about you now', futureHook: 'This knowledge might spread or be used' }
    ],
    [
      { category: 'relationship', description: 'Your approach rubbed them wrong', severity: 'minor', immediateEffect: 'They helped, but trust decreased', mechanicalEffect: { stat: 'trust', value: -10, duration: 0 } },
      { category: 'reputation', description: 'They will tell others about this exchange', severity: 'minor', immediateEffect: 'Your reputation shifts', futureHook: 'Others hear a version of this story' }
    ]
  ],
  stealth: [
    [
      { category: 'exposure', description: 'You were spotted, but escaped', severity: 'moderate', immediateEffect: 'Someone saw your face', futureHook: 'They might recognize you later' },
      { category: 'time', description: 'You had to take a longer route', severity: 'minor', immediateEffect: 'Significant delay', futureHook: 'You missed something' }
    ],
    [
      { category: 'equipment', description: 'You dropped something in your haste', severity: 'moderate', immediateEffect: 'Item left behind', futureHook: 'This could be traced back to you' },
      { category: 'injury', description: 'A close call left its mark', severity: 'minor', immediateEffect: 'Scrapes and bruises', mechanicalEffect: { stat: 'health', value: -5, duration: 0 } }
    ]
  ],
  resource: [
    [
      { category: 'resource', description: 'You used more than expected', severity: 'moderate', immediateEffect: 'Supplies depleted', futureHook: 'You need to resupply soon' },
      { category: 'favor', description: 'Someone helped, but expects payment', severity: 'minor', immediateEffect: 'Debt incurred', futureHook: 'Collectors will come' }
    ]
  ],
  time: [
    [
      { category: 'opportunity', description: 'The window passed while you struggled', severity: 'moderate', immediateEffect: 'Original plan impossible', futureHook: 'A new approach is needed' },
      { category: 'relationship', description: 'Someone waited and you didnt show', severity: 'minor', immediateEffect: 'Trust damaged', mechanicalEffect: { stat: 'trust', value: -15, duration: 0 } }
    ]
  ],
  luck: [
    [
      { category: 'exposure', description: 'Bad luck draws unwanted attention', severity: 'minor', immediateEffect: 'Eyes turn your way', futureHook: 'Someone remembers you' },
      { category: 'equipment', description: 'Something breaks at the worst moment', severity: 'moderate', immediateEffect: 'Equipment failure', futureHook: 'Need repairs or replacement' }
    ]
  ]
};

// Generate fail-forward result
export function generateFailForward(
  failureType: FailureType,
  originalGoal: string,
  severity: 'easy' | 'normal' | 'hard' = 'normal'
): FailForwardResult {
  const templates = COST_TEMPLATES[failureType];
  const costSet = templates[Math.floor(Math.random() * templates.length)];
  
  // Filter costs by severity
  const applicableCosts = costSet.filter(cost => {
    if (severity === 'easy') return cost.severity !== 'major';
    if (severity === 'hard') return true;
    return cost.severity !== 'major' || Math.random() > 0.5;
  });
  
  // Usually 1-2 costs
  const numCosts = severity === 'hard' ? 2 : severity === 'easy' ? 1 : (Math.random() > 0.5 ? 2 : 1);
  const selectedCosts = applicableCosts.slice(0, numCosts);
  
  // Build narrative hooks
  const narrativeHooks = selectedCosts
    .filter(c => c.futureHook)
    .map(c => c.futureHook!);
  
  // Build mechanical changes
  const mechanicalChanges = selectedCosts
    .filter(c => c.mechanicalEffect)
    .map(c => ({
      type: c.mechanicalEffect!.stat || 'unknown',
      target: 'player',
      value: c.mechanicalEffect!.value || 0
    }));
  
  // Build outcome description
  const outcomeDescription = buildFailForwardNarrative(originalGoal, selectedCosts);
  
  return {
    succeeded: true, // You always succeed with fail-forward
    wasFailForward: true,
    outcomeDescription,
    costs: selectedCosts,
    narrativeHooks,
    mechanicalChanges
  };
}

function buildFailForwardNarrative(goal: string, costs: FailForwardCost[]): string {
  const costDescriptions = costs.map(c => c.description).join('. ');
  return `You manage to ${goal.toLowerCase()}... but ${costDescriptions.toLowerCase()}.`;
}

// Build context for AI prompt
export function buildFailForwardContext(): string {
  return `## FAIL-FORWARD PHILOSOPHY

When the player fails a check or attempt, NEVER block progress. Instead, use "Yes, but it costs."

**COST CATEGORIES:**
- Equipment: Tools break, items damaged, resources consumed
- Favors: Someone helps but wants payment later
- Exposure: Evidence left, witnesses, trails to follow
- Injury: Physical harm that lingers
- Reputation: Word spreads, opinions shift
- Relationships: Trust damaged, respect lost
- Time: Windows close, opportunities pass
- Information: Revealed secrets about yourself
- Opportunity: Some doors close forever

**EXAMPLES:**
- Pick the lock? YES, but your tool snaps inside—now they'll know someone tried.
- Persuade the guard? YES, but he wants a favor—he'll call it in later.
- Win the fight? YES, but you're bleeding and leaving a trail.
- Sneak past? YES, but you dropped your token—someone will find it.
- Find the information? YES, but it took hours—you missed the meeting.

**RULES:**
1. The player always moves forward
2. Costs create future content (favors, evidence, enemies)
3. Higher stakes = bigger costs, not failure
4. Costs should be specific and concrete
5. Always mention what was gained AND what was lost
6. Future hooks should feel like Chekhov's guns`;
}

// Parse narrative for fail-forward opportunities
export function identifyFailForwardMoment(
  narrative: string,
  rollResult?: { success: boolean; margin: number }
): { isFailure: boolean; failureType: FailureType | null; context: string } {
  const failureKeywords = {
    skill_check: ['fail', 'miss', 'cant', 'unable', 'struggle'],
    combat: ['hit', 'wound', 'hurt', 'strike', 'attack'],
    social: ['refuse', 'reject', 'suspicious', 'distrust', 'unconvinced'],
    stealth: ['spotted', 'seen', 'heard', 'noticed', 'caught'],
    resource: ['empty', 'depleted', 'out of', 'none left'],
    time: ['late', 'missed', 'too slow', 'delayed']
  };
  
  if (rollResult && !rollResult.success) {
    // Determine type from narrative
    for (const [type, keywords] of Object.entries(failureKeywords)) {
      if (keywords.some(kw => narrative.toLowerCase().includes(kw))) {
        return {
          isFailure: true,
          failureType: type as FailureType,
          context: narrative
        };
      }
    }
    return { isFailure: true, failureType: 'skill_check', context: narrative };
  }
  
  return { isFailure: false, failureType: null, context: '' };
}

// Active fail-forward consequences that need resolution
export interface ActiveConsequence {
  id: string;
  cost: FailForwardCost;
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
}

export function createActiveConsequence(cost: FailForwardCost): ActiveConsequence {
  return {
    id: `ffwd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    cost,
    createdAt: Date.now()
  };
}

export function getUnresolvedConsequences(consequences: ActiveConsequence[]): ActiveConsequence[] {
  return consequences.filter(c => !c.resolvedAt);
}

export function resolveConsequence(
  consequences: ActiveConsequence[],
  consequenceId: string,
  resolution: string
): ActiveConsequence[] {
  return consequences.map(c => 
    c.id === consequenceId 
      ? { ...c, resolvedAt: Date.now(), resolution }
      : c
  );
}
