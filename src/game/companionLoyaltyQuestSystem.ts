// ============================================================================
// COMPANION LOYALTY QUEST SYSTEM - Late-game personal quests
// ============================================================================

import { CompanionState } from './companionSystem';
import { Quest, QuestObjective, QuestReward, QuestStatus } from './questSystem';

// ============================================================================
// TYPES
// ============================================================================

export type LoyaltyQuestTier = 'tier1' | 'tier2' | 'tier3' | 'final';

export interface LoyaltyQuestTrigger {
  trustRequired: number;
  affinityRequired: number;
  respectRequired?: number;
  prerequisiteQuestId?: string;
  additionalCondition?: string;
}

export interface LoyaltyQuestOutcome {
  id: string;
  description: string;
  conditions: string[];
  rewards: QuestReward[];
  companionEffects: {
    trustChange: number;
    affinityChange: number;
    respectChange: number;
    romanticChange?: number;
    unlockAbility?: string;
    permanentMoodChange?: string;
    specialStatus?: string;
  };
  narrativeConclusion: string;
}

export interface LoyaltyQuest {
  id: string;
  companionId: string;
  tier: LoyaltyQuestTier;
  title: string;
  description: string;
  backstoryReveal: string;
  
  // Unlock conditions
  trigger: LoyaltyQuestTrigger;
  
  // Quest content
  objectives: QuestObjective[];
  dialoguePrompts: string[];
  
  // Multiple outcomes based on player choices
  possibleOutcomes: LoyaltyQuestOutcome[];
  
  // Rewards for completing
  baseRewards: QuestReward[];
  
  // Status
  status: QuestStatus;
  startedAt?: number;
  completedAt?: number;
  chosenOutcomeId?: string;
}

// ============================================================================
// TIER THRESHOLDS (Late Game)
// ============================================================================

export const LOYALTY_TIER_THRESHOLDS: Record<LoyaltyQuestTier, LoyaltyQuestTrigger> = {
  tier1: { trustRequired: 60, affinityRequired: 50 },
  tier2: { trustRequired: 75, affinityRequired: 65, respectRequired: 50 },
  tier3: { trustRequired: 85, affinityRequired: 80, respectRequired: 70 },
  final: { trustRequired: 95, affinityRequired: 90, respectRequired: 85 }
};

// ============================================================================
// LOYALTY QUEST TEMPLATES
// ============================================================================

export const LOYALTY_QUEST_TEMPLATES: Omit<LoyaltyQuest, 'companionId' | 'status'>[] = [
  // ========== TIER 1 QUESTS ==========
  {
    id: 'shadows_of_the_past',
    tier: 'tier1',
    title: 'Shadows of the Past',
    description: 'Your companion has finally opened up about a dark secret from their past. They need your help to confront it.',
    backstoryReveal: 'They reveal they were once involved in something terrible - perhaps an accident, a betrayal, or a crime they deeply regret.',
    trigger: LOYALTY_TIER_THRESHOLDS.tier1,
    objectives: [
      {
        id: 'listen_confession',
        description: 'Listen to their full confession',
        status: 'active',
        isHidden: false,
        targetType: 'talk',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'investigate_past',
        description: 'Help investigate what really happened',
        status: 'pending',
        isHidden: true,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0,
        unlocksObjectives: ['confront_truth']
      },
      {
        id: 'confront_truth',
        description: 'Confront the truth together',
        status: 'pending',
        isHidden: true,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      }
    ],
    dialoguePrompts: [
      'There is something I have never told anyone... not even myself, truly.',
      'I need to go back. Face what I left behind. Will you come with me?',
      'Whatever we find... please do not think less of me.'
    ],
    possibleOutcomes: [
      {
        id: 'redemption',
        description: 'Help them find redemption and make amends',
        conditions: ['Chose forgiving dialogue options', 'Helped them apologize to those wronged'],
        rewards: [
          { type: 'relationship', value: 25, description: 'Deep bond formed' },
          { type: 'unlock', value: 1, targetId: 'companion_ability_redemption', description: 'Companion gains Redemption ability' }
        ],
        companionEffects: {
          trustChange: 20,
          affinityChange: 25,
          respectChange: 15,
          unlockAbility: 'second_chance',
          permanentMoodChange: 'content'
        },
        narrativeConclusion: 'They stand taller now, the weight of their past finally lifted. Their eyes hold a new light - hope, perhaps, or simply peace.'
      },
      {
        id: 'buried_deeper',
        description: 'Help them bury the secret even deeper',
        conditions: ['Chose pragmatic dialogue options', 'Eliminated witnesses'],
        rewards: [
          { type: 'relationship', value: 15, description: 'Shared secret' }
        ],
        companionEffects: {
          trustChange: 30,
          affinityChange: 10,
          respectChange: -5,
          permanentMoodChange: 'neutral'
        },
        narrativeConclusion: 'The secret is safe, but you both know it lingers between you. An unspoken bond... or an unspoken burden.'
      },
      {
        id: 'abandoned',
        description: 'Refuse to help with their past',
        conditions: ['Rejected their request', 'Showed disgust at their confession'],
        rewards: [],
        companionEffects: {
          trustChange: -40,
          affinityChange: -50,
          respectChange: -20
        },
        narrativeConclusion: 'The light dies in their eyes. They trusted you with their deepest shame, and you turned away.'
      }
    ],
    baseRewards: [
      { type: 'skill_xp', value: 500, targetId: 'insight', description: 'Gained insight into their character' }
    ]
  },

  // ========== TIER 2 QUESTS ==========
  {
    id: 'blood_calls_home',
    tier: 'tier2',
    title: 'Blood Calls Home',
    description: 'Your companion has received word that their family is in danger. They must choose between their life with you and their blood.',
    backstoryReveal: 'They reveal they are not who they claimed - they are heir to something greater, or escaped from somewhere darker.',
    trigger: { ...LOYALTY_TIER_THRESHOLDS.tier2, prerequisiteQuestId: 'shadows_of_the_past' },
    objectives: [
      {
        id: 'receive_message',
        description: 'Witness them receiving the message',
        status: 'active',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'journey_homeland',
        description: 'Journey to their homeland',
        status: 'pending',
        isHidden: false,
        targetType: 'go',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'face_family',
        description: 'Face their family together',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'resolve_conflict',
        description: 'Resolve the family conflict',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      }
    ],
    dialoguePrompts: [
      'My real name... it is not what I told you. I am sorry.',
      'They found me. After all these years, they found me.',
      'I left for a reason. But family is family, even when they are poison.'
    ],
    possibleOutcomes: [
      {
        id: 'reconciliation',
        description: 'Broker peace with their family',
        conditions: ['Used diplomacy', 'Found common ground', 'Defended companion to family'],
        rewards: [
          { type: 'reputation', value: 30, targetId: 'companion_family', description: 'Earned family respect' },
          { type: 'unlock', value: 1, targetId: 'family_resources', description: 'Family resources available' }
        ],
        companionEffects: {
          trustChange: 25,
          affinityChange: 30,
          respectChange: 20,
          romanticChange: 15,
          specialStatus: 'reconnected_with_family'
        },
        narrativeConclusion: 'For the first time in years, they embrace their family without fear. And when they look at you, there is something deeper than gratitude.'
      },
      {
        id: 'severance',
        description: 'Help them cut ties permanently',
        conditions: ['Supported their independence', 'Stood against the family'],
        rewards: [
          { type: 'relationship', value: 35, description: 'Chosen family bond' }
        ],
        companionEffects: {
          trustChange: 35,
          affinityChange: 25,
          respectChange: 30,
          romanticChange: 20,
          specialStatus: 'chose_player_over_blood'
        },
        narrativeConclusion: 'They walk away from their blood, but not from you. You are their family now. They will never forget what you did.'
      },
      {
        id: 'betrayed_to_family',
        description: 'Side with their family against them',
        conditions: ['Agreed with family concerns', 'Tried to convince companion to submit'],
        rewards: [
          { type: 'money', value: 5000, description: 'Family reward' }
        ],
        companionEffects: {
          trustChange: -60,
          affinityChange: -70,
          respectChange: -50,
          permanentMoodChange: 'betrayed'
        },
        narrativeConclusion: 'The look in their eyes... you have seen it in dying animals. Not anger. Just the death of something beautiful.'
      }
    ],
    baseRewards: [
      { type: 'skill_xp', value: 1000, targetId: 'diplomacy', description: 'Learned about family dynamics' }
    ]
  },

  // ========== TIER 3 QUESTS ==========
  {
    id: 'the_old_enemy',
    tier: 'tier3',
    title: 'The Old Enemy',
    description: 'Someone from your companion\'s past has finally caught up with them. This enemy knows their weaknesses, their fears, their secrets.',
    backstoryReveal: 'They reveal the true depth of their history - a nemesis who shaped who they became, for better or worse.',
    trigger: { ...LOYALTY_TIER_THRESHOLDS.tier3, prerequisiteQuestId: 'blood_calls_home' },
    objectives: [
      {
        id: 'enemy_appears',
        description: 'Witness the enemy reveal themselves',
        status: 'active',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'protect_companion',
        description: 'Protect your companion from the first strike',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'hunt_enemy',
        description: 'Hunt down the enemy together',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'final_confrontation',
        description: 'The final confrontation',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      }
    ],
    dialoguePrompts: [
      'I always knew this day would come. I just hoped... I hoped I would not be alone when it did.',
      'You do not have to do this. This is my fight.',
      'If I do not come back from this... there are things I need you to know.'
    ],
    possibleOutcomes: [
      {
        id: 'enemy_destroyed',
        description: 'Destroy the enemy together',
        conditions: ['Fought alongside companion', 'Let companion deliver final blow'],
        rewards: [
          { type: 'unlock', value: 1, targetId: 'companion_ultimate_ability', description: 'Companion ultimate ability unlocked' },
          { type: 'item', value: 1, targetId: 'enemy_trophy', description: 'Trophy from the fallen enemy' }
        ],
        companionEffects: {
          trustChange: 40,
          affinityChange: 45,
          respectChange: 35,
          romanticChange: 30,
          unlockAbility: 'vengeance_fulfilled',
          specialStatus: 'freed_from_past'
        },
        narrativeConclusion: 'They stand over the body of their nemesis, trembling. Then they turn to you, and there are tears. Not of grief - of release. The nightmare is finally over.'
      },
      {
        id: 'enemy_spared',
        description: 'Convince companion to show mercy',
        conditions: ['Argued for mercy', 'Companion chose to spare enemy'],
        rewards: [
          { type: 'skill_xp', value: 2000, targetId: 'persuasion', description: 'Mastery of persuasion' }
        ],
        companionEffects: {
          trustChange: 30,
          affinityChange: 35,
          respectChange: 45,
          romanticChange: 25,
          unlockAbility: 'inner_peace',
          permanentMoodChange: 'content'
        },
        narrativeConclusion: 'They lower their weapon, breathing hard. "You were right," they whisper. "I will not become what I hate." The enemy flees, broken. Your companion stands taller than ever.'
      },
      {
        id: 'companion_sacrificed',
        description: 'Let companion face the enemy alone',
        conditions: ['Did not intervene', 'Let companion fight solo'],
        rewards: [],
        companionEffects: {
          trustChange: -30,
          affinityChange: -25,
          respectChange: -40,
          permanentMoodChange: 'sad'
        },
        narrativeConclusion: 'They won, but barely. And when they look at you now, there is a distance that was not there before. They faced their greatest fear alone, when you could have stood with them.'
      }
    ],
    baseRewards: [
      { type: 'skill_xp', value: 1500, targetId: 'combat', description: 'Hardened by conflict' }
    ]
  },

  // ========== FINAL LOYALTY QUEST ==========
  {
    id: 'souls_entwined',
    tier: 'final',
    title: 'Souls Entwined',
    description: 'After everything you have been through together, your companion has something important to say. This is the culmination of your journey together.',
    backstoryReveal: 'They reveal who they truly are - not just their history, but their hopes, their dreams, and what you mean to them.',
    trigger: { ...LOYALTY_TIER_THRESHOLDS.final, prerequisiteQuestId: 'the_old_enemy' },
    objectives: [
      {
        id: 'private_moment',
        description: 'Find a private moment together',
        status: 'active',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'hear_confession',
        description: 'Hear their final confession',
        status: 'pending',
        isHidden: false,
        targetType: 'talk',
        targetCount: 1,
        currentCount: 0
      },
      {
        id: 'make_choice',
        description: 'Make your choice about the future',
        status: 'pending',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0
      }
    ],
    dialoguePrompts: [
      'I have followed you through fire and shadow. I have bled for you. I have changed for you.',
      'Before I say this, know that whatever you answer, I will stay. I made my choice long ago.',
      'You are home to me. The only home I have ever truly known.'
    ],
    possibleOutcomes: [
      {
        id: 'eternal_bond',
        description: 'Accept their devotion and pledge your own',
        conditions: ['Chose romantic options', 'Declared mutual commitment'],
        rewards: [
          { type: 'unlock', value: 1, targetId: 'soulbound_abilities', description: 'Soulbound abilities unlocked' },
          { type: 'relationship', value: 50, description: 'Eternal bond formed' }
        ],
        companionEffects: {
          trustChange: 100,
          affinityChange: 100,
          respectChange: 50,
          romanticChange: 100,
          unlockAbility: 'soulbound',
          specialStatus: 'soulbound_partner',
          permanentMoodChange: 'joyful'
        },
        narrativeConclusion: 'Words become unnecessary. In this moment, under these stars, two souls find their mirror in each other. Whatever comes next, you will face it together. Always.'
      },
      {
        id: 'sworn_companions',
        description: 'Decline romance but affirm unbreakable friendship',
        conditions: ['Chose platonic options', 'Affirmed deep friendship'],
        rewards: [
          { type: 'unlock', value: 1, targetId: 'sworn_companion_abilities', description: 'Sworn companion abilities unlocked' },
          { type: 'relationship', value: 40, description: 'Brotherhood/sisterhood bond' }
        ],
        companionEffects: {
          trustChange: 80,
          affinityChange: 60,
          respectChange: 70,
          romanticChange: -20,
          unlockAbility: 'sworn_shield',
          specialStatus: 'sworn_companion',
          permanentMoodChange: 'content'
        },
        narrativeConclusion: 'They take a breath, then smile - genuinely. "I understand. And honestly? This is enough. More than enough. You are my family, in the way that matters."'
      },
      {
        id: 'paths_diverge',
        description: 'This is where your paths must diverge',
        conditions: ['Pushed them away', 'Chose to part ways'],
        rewards: [],
        companionEffects: {
          trustChange: -20,
          affinityChange: -30,
          respectChange: 20,
          romanticChange: -50,
          permanentMoodChange: 'sad'
        },
        narrativeConclusion: 'They nod slowly, pain flickering behind their eyes. "I understand. Some journeys... some journeys are meant to be walked alone." They do not look back as they leave.'
      }
    ],
    baseRewards: [
      { type: 'skill_xp', value: 2500, targetId: 'leadership', description: 'Mastery of bonds' },
      { type: 'unlock', value: 1, targetId: 'companion_epilogue', description: 'Companion epilogue unlocked' }
    ]
  }
];

// ============================================================================
// LOYALTY QUEST MANAGER CLASS
// ============================================================================

export class CompanionLoyaltyQuestManager {
  private companionQuests: Map<string, LoyaltyQuest[]> = new Map();
  private activeQuests: Map<string, LoyaltyQuest> = new Map();
  private completedQuests: Set<string> = new Set();
  
  // Callbacks for external integration
  private onQuestStarted?: (companionId: string, quest: LoyaltyQuest) => void;
  private onQuestCompleted?: (companionId: string, quest: LoyaltyQuest, outcome: LoyaltyQuestOutcome) => void;
  private onObjectiveCompleted?: (companionId: string, questId: string, objectiveId: string) => void;

  constructor() {}

  // Register callbacks for external systems
  setCallbacks(callbacks: {
    onQuestStarted?: (companionId: string, quest: LoyaltyQuest) => void;
    onQuestCompleted?: (companionId: string, quest: LoyaltyQuest, outcome: LoyaltyQuestOutcome) => void;
    onObjectiveCompleted?: (companionId: string, questId: string, objectiveId: string) => void;
  }): void {
    this.onQuestStarted = callbacks.onQuestStarted;
    this.onQuestCompleted = callbacks.onQuestCompleted;
    this.onObjectiveCompleted = callbacks.onObjectiveCompleted;
  }

  // Generate quests for a specific companion
  generateQuestsForCompanion(companion: CompanionState): LoyaltyQuest[] {
    const existingQuests = this.companionQuests.get(companion.id);
    if (existingQuests && existingQuests.length > 0) {
      return existingQuests;
    }

    const quests: LoyaltyQuest[] = LOYALTY_QUEST_TEMPLATES.map(template => ({
      ...template,
      id: `${companion.id}_${template.id}`,
      companionId: companion.id,
      status: 'available' as QuestStatus,
      objectives: template.objectives.map(obj => ({ ...obj })),
      possibleOutcomes: template.possibleOutcomes.map(outcome => ({
        ...outcome,
        rewards: [...outcome.rewards],
        companionEffects: { ...outcome.companionEffects }
      })),
      baseRewards: [...template.baseRewards]
    }));

    this.companionQuests.set(companion.id, quests);
    return quests;
  }

  // Check if any quests should be unlocked
  checkQuestUnlocks(companionId: string): LoyaltyQuest | null {
    const quests = this.companionQuests.get(companionId);
    if (!quests) return null;

    // Find first available quest that meets requirements
    for (const quest of quests) {
      if (quest.status !== 'available') continue;
      if (this.activeQuests.has(companionId)) continue; // One active at a time

      // Check prerequisites
      if (quest.trigger.prerequisiteQuestId) {
        const prereqId = `${companionId}_${quest.trigger.prerequisiteQuestId}`;
        if (!this.completedQuests.has(prereqId)) continue;
      }

      // Quest is ready to trigger
      return quest;
    }

    return null;
  }

  // Check if companion meets trigger requirements
  canTriggerQuest(quest: LoyaltyQuest, companion: CompanionState): boolean {
    const { trigger } = quest;
    
    if (companion.trust < trigger.trustRequired) return false;
    if (companion.affinity < trigger.affinityRequired) return false;
    if (trigger.respectRequired && companion.respect < trigger.respectRequired) return false;
    
    // Check prerequisite
    if (trigger.prerequisiteQuestId) {
      const prereqId = `${companion.id}_${trigger.prerequisiteQuestId}`;
      if (!this.completedQuests.has(prereqId)) return false;
    }

    return true;
  }

  // Get available quest for companion (if any)
  getAvailableLoyaltyQuest(companion: CompanionState): LoyaltyQuest | null {
    // First, ensure quests are generated
    this.generateQuestsForCompanion(companion);
    
    const quests = this.companionQuests.get(companion.id);
    if (!quests) return null;

    // Already has active quest
    if (this.activeQuests.has(companion.id)) return null;

    // Find available quest that can trigger
    for (const quest of quests) {
      if (quest.status !== 'available') continue;
      if (this.canTriggerQuest(quest, companion)) {
        return quest;
      }
    }

    return null;
  }

  // Start a loyalty quest
  startQuest(companionId: string, questId: string): boolean {
    const quests = this.companionQuests.get(companionId);
    if (!quests) return false;

    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.status !== 'available') return false;

    quest.status = 'active';
    quest.startedAt = Date.now();
    quest.objectives[0].status = 'active';
    this.activeQuests.set(companionId, quest);

    // Notify via callback
    this.onQuestStarted?.(companionId, quest);

    return true;
  }

  // Get active quest for companion
  getActiveQuest(companionId: string): LoyaltyQuest | null {
    return this.activeQuests.get(companionId) || null;
  }

  // Progress objective
  progressObjective(companionId: string, objectiveId: string): boolean {
    const quest = this.activeQuests.get(companionId);
    if (!quest) return false;

    const objective = quest.objectives.find(o => o.id === objectiveId);
    if (!objective || objective.status !== 'active') return false;

    objective.currentCount++;
    if (objective.currentCount >= objective.targetCount) {
      objective.status = 'completed';

      // Unlock hidden objectives
      if (objective.unlocksObjectives) {
        for (const unlockId of objective.unlocksObjectives) {
          const toUnlock = quest.objectives.find(o => o.id === unlockId);
          if (toUnlock && toUnlock.status === 'pending') {
            toUnlock.status = 'active';
            toUnlock.isHidden = false;
          }
        }
      }

      // Activate next pending objective
      const nextPending = quest.objectives.find(o => o.status === 'pending');
      if (nextPending) {
        nextPending.status = 'active';
      }

      // Notify via callback
      this.onObjectiveCompleted?.(companionId, quest.id, objectiveId);
    }

    return true;
  }

  // Complete quest with chosen outcome
  completeQuest(companionId: string, outcomeId: string): LoyaltyQuestOutcome | null {
    const quest = this.activeQuests.get(companionId);
    if (!quest) return null;

    const outcome = quest.possibleOutcomes.find(o => o.id === outcomeId);
    if (!outcome) return null;

    quest.status = 'completed';
    quest.completedAt = Date.now();
    quest.chosenOutcomeId = outcomeId;

    this.activeQuests.delete(companionId);
    this.completedQuests.add(quest.id);

    // Notify via callback
    this.onQuestCompleted?.(companionId, quest, outcome);

    return outcome;
  }

  // Fail quest
  failQuest(companionId: string, reason: string): void {
    const quest = this.activeQuests.get(companionId);
    if (!quest) return;

    quest.status = 'failed';
    this.activeQuests.delete(companionId);
    
    console.log(`[LoyaltyQuest] Quest failed: ${quest.id} - ${reason}`);
  }

  // Get quest progress summary
  getQuestProgress(companionId: string): {
    completedTiers: LoyaltyQuestTier[];
    currentTier: LoyaltyQuestTier | null;
    nextTier: LoyaltyQuestTier | null;
    totalCompleted: number;
  } {
    const quests = this.companionQuests.get(companionId) || [];
    const completedTiers: LoyaltyQuestTier[] = [];
    let currentTier: LoyaltyQuestTier | null = null;
    let nextTier: LoyaltyQuestTier | null = null;

    const tierOrder: LoyaltyQuestTier[] = ['tier1', 'tier2', 'tier3', 'final'];

    for (const tier of tierOrder) {
      const tierQuest = quests.find(q => q.tier === tier);
      if (!tierQuest) continue;

      if (tierQuest.status === 'completed') {
        completedTiers.push(tier);
      } else if (tierQuest.status === 'active') {
        currentTier = tier;
      } else if (!nextTier && tierQuest.status === 'available') {
        nextTier = tier;
      }
    }

    return {
      completedTiers,
      currentTier,
      nextTier,
      totalCompleted: completedTiers.length
    };
  }

  // Get all quests for companion
  getAllQuestsForCompanion(companionId: string): LoyaltyQuest[] {
    return this.companionQuests.get(companionId) || [];
  }

  // Serialize for save
  serialize(): string {
    return JSON.stringify({
      companionQuests: Array.from(this.companionQuests.entries()),
      activeQuests: Array.from(this.activeQuests.entries()),
      completedQuests: Array.from(this.completedQuests)
    });
  }

  // Deserialize from save
  deserialize(data: string): void {
    try {
      const parsed = JSON.parse(data);
      this.companionQuests = new Map(parsed.companionQuests || []);
      this.activeQuests = new Map(parsed.activeQuests || []);
      this.completedQuests = new Set(parsed.completedQuests || []);
    } catch (e) {
      console.error('Failed to deserialize loyalty quests:', e);
    }
  }

  // Reset all data
  reset(): void {
    this.companionQuests.clear();
    this.activeQuests.clear();
    this.completedQuests.clear();
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const loyaltyQuestManager = new CompanionLoyaltyQuestManager();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getLoyaltyQuestTierName(tier: LoyaltyQuestTier): string {
  switch (tier) {
    case 'tier1': return 'Trust Awakened';
    case 'tier2': return 'Bonds Deepened';
    case 'tier3': return 'Trials Endured';
    case 'final': return 'Souls Entwined';
  }
}

export function getLoyaltyQuestTierDescription(tier: LoyaltyQuestTier): string {
  switch (tier) {
    case 'tier1': return 'Your companion has begun to trust you with their secrets.';
    case 'tier2': return 'The bond between you has grown deep enough to face the past.';
    case 'tier3': return 'Together, you will face the greatest challenge of their life.';
    case 'final': return 'The culmination of your journey together. What will you become?';
  }
}

export function getNextLoyaltyTier(currentTier: LoyaltyQuestTier | null): LoyaltyQuestTier | null {
  if (!currentTier) return 'tier1';
  switch (currentTier) {
    case 'tier1': return 'tier2';
    case 'tier2': return 'tier3';
    case 'tier3': return 'final';
    case 'final': return null;
  }
}
