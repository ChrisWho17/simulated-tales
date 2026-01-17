// Quest & Objective System - RPG quest tracking with AI integration
// Supports multi-stage quests, branching paths, and NPC-driven objectives

import { GameState, NPC } from '@/types/game';

// ============= QUEST TYPES =============

export type QuestStatus = 'available' | 'active' | 'completed' | 'failed' | 'abandoned';
export type ObjectiveStatus = 'pending' | 'active' | 'completed' | 'failed' | 'optional';
export type QuestCategory = 'main' | 'side' | 'personal' | 'faction' | 'repeatable';
export type RewardType = 'money' | 'item' | 'skill_xp' | 'reputation' | 'relationship' | 'unlock';

// ============= QUEST STRUCTURES =============

export interface QuestObjective {
  id: string;
  description: string;
  status: ObjectiveStatus;
  isHidden: boolean; // Revealed as player progresses
  
  // Completion conditions
  targetType: 'talk' | 'go' | 'collect' | 'deliver' | 'skill_check' | 'custom';
  targetId?: string; // NPC id, location id, item id
  targetCount: number;
  currentCount: number;
  
  // Branching
  failCondition?: string;
  alternativeObjectives?: string[]; // Alternative ways to complete
  unlocksObjectives?: string[]; // Objectives revealed on completion
}

export interface QuestReward {
  type: RewardType;
  value: number;
  targetId?: string; // Skill name, item id, faction id
  description: string;
}

export interface QuestBranch {
  id: string;
  condition: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  status: QuestStatus;
  
  // Quest giver
  giverNpcId: string | null;
  giverLocation: string;
  
  // Objectives
  objectives: QuestObjective[];
  currentObjectiveIndex: number;
  
  // Branching paths
  branches?: QuestBranch[];
  activeBranchId?: string;
  
  // Requirements
  levelRequirement?: number;
  skillRequirements?: { skill: string; level: number }[];
  prerequisiteQuests?: string[];
  
  // Rewards
  rewards: QuestReward[];
  bonusRewards?: QuestReward[]; // For completing optional objectives
  
  // Timing
  timeLimit?: number; // In ticks, undefined = no limit
  startedAt?: number;
  completedAt?: number;
  
  // Narrative
  journalEntries: QuestJournalEntry[];
  
  // Flags
  isRepeatable: boolean;
  repeatCooldown?: number;
  lastCompletedAt?: number;
}

export interface QuestJournalEntry {
  tick: number;
  text: string;
  isAuto: boolean; // Generated vs manual
}

// ============= QUEST LOG =============

export interface QuestLog {
  quests: Record<string, Quest>;
  completedQuestIds: string[];
  failedQuestIds: string[];
  availableQuests: string[];
  
  // Stats
  totalCompleted: number;
  totalFailed: number;
  currentActiveCount: number;
}

// ============= QUEST DEFINITIONS =============

export const QUEST_DEFINITIONS: Record<string, Omit<Quest, 'status' | 'currentObjectiveIndex' | 'journalEntries'>> = {
  tutorial_explore: {
    id: 'tutorial_explore',
    title: 'Finding Your Feet',
    description: 'Explore your surroundings and get to know the area.',
    category: 'main',
    giverNpcId: null, // Self-given
    giverLocation: 'any',
    objectives: [
      {
        id: 'obj_look_around',
        description: 'Look around your starting location',
        status: 'active',
        isHidden: false,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0,
      },
      {
        id: 'obj_visit_market',
        description: 'Visit the market',
        status: 'pending',
        isHidden: false,
        targetType: 'go',
        targetId: 'market',
        targetCount: 1,
        currentCount: 0,
      },
      {
        id: 'obj_talk_someone',
        description: 'Talk to someone in town',
        status: 'pending',
        isHidden: false,
        targetType: 'talk',
        targetCount: 1,
        currentCount: 0,
      },
    ],
    rewards: [
      { type: 'skill_xp', value: 5, targetId: 'social.charm', description: '+5 Charm XP' },
    ],
    isRepeatable: false,
  },
  
  martha_debt: {
    id: 'martha_debt',
    title: "Martha's Burden",
    description: "Help Martha deal with her debt to the Merchants' Guild.",
    category: 'side',
    giverNpcId: 'npc_martha',
    giverLocation: 'tavern_main',
    prerequisiteQuests: ['tutorial_explore'],
    objectives: [
      {
        id: 'obj_learn_debt',
        description: 'Learn about Martha\'s situation',
        status: 'active',
        isHidden: false,
        targetType: 'talk',
        targetId: 'npc_martha',
        targetCount: 1,
        currentCount: 0,
      },
      {
        id: 'obj_find_thomas',
        description: 'Find Thomas the Rat and ask about earning money',
        status: 'pending',
        isHidden: true,
        targetType: 'talk',
        targetId: 'npc_thomas',
        targetCount: 1,
        currentCount: 0,
        unlocksObjectives: ['obj_negotiate_guild', 'obj_find_treasure'],
      },
      {
        id: 'obj_negotiate_guild',
        description: 'Negotiate with the Merchants\' Guild (requires Persuasion)',
        status: 'pending',
        isHidden: true,
        targetType: 'skill_check',
        targetId: 'social.persuasion',
        targetCount: 1,
        currentCount: 0,
        alternativeObjectives: ['obj_find_treasure'],
      },
      {
        id: 'obj_find_treasure',
        description: 'Help Old Edgar find the ancient treasure',
        status: 'pending',
        isHidden: true,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0,
        alternativeObjectives: ['obj_negotiate_guild'],
      },
    ],
    rewards: [
      { type: 'money', value: 100, description: '100 gold' },
      { type: 'reputation', value: 20, targetId: 'tavern_main', description: '+20 Reputation at the Rusty Nail' },
      { type: 'relationship', value: 30, targetId: 'npc_martha', description: '+30 Trust with Martha' },
    ],
    isRepeatable: false,
  },
  
  guard_patrol: {
    id: 'guard_patrol',
    title: 'Keeping the Peace',
    description: 'Help Guard James maintain order in town.',
    category: 'repeatable',
    giverNpcId: 'npc_guard_james',
    giverLocation: 'town_square',
    objectives: [
      {
        id: 'obj_patrol_market',
        description: 'Patrol the market area',
        status: 'active',
        isHidden: false,
        targetType: 'go',
        targetId: 'market',
        targetCount: 1,
        currentCount: 0,
      },
      {
        id: 'obj_report_activity',
        description: 'Report back to Guard James',
        status: 'pending',
        isHidden: false,
        targetType: 'talk',
        targetId: 'npc_guard_james',
        targetCount: 1,
        currentCount: 0,
      },
    ],
    rewards: [
      { type: 'money', value: 25, description: '25 gold' },
      { type: 'relationship', value: 10, targetId: 'npc_guard_james', description: '+10 Trust with Guard James' },
    ],
    isRepeatable: true,
    repeatCooldown: 24, // hours
  },
  
  edgar_stories: {
    id: 'edgar_stories',
    title: 'Tales of Old',
    description: 'Listen to Old Edgar\'s stories and earn his trust.',
    category: 'personal',
    giverNpcId: 'npc_old_edgar',
    giverLocation: 'tavern_main',
    objectives: [
      {
        id: 'obj_listen_story_1',
        description: 'Listen to Edgar\'s first tale',
        status: 'active',
        isHidden: false,
        targetType: 'talk',
        targetId: 'npc_old_edgar',
        targetCount: 3,
        currentCount: 0,
      },
      {
        id: 'obj_bring_drink',
        description: 'Bring Edgar a drink',
        status: 'pending',
        isHidden: true,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0,
      },
      {
        id: 'obj_hear_secret',
        description: 'Earn enough trust to hear Edgar\'s secret',
        status: 'pending',
        isHidden: true,
        targetType: 'custom',
        targetCount: 1,
        currentCount: 0,
      },
    ],
    rewards: [
      { type: 'unlock', value: 1, targetId: 'treasure_location', description: 'Learn the location of the ancient treasure' },
      { type: 'relationship', value: 50, targetId: 'npc_old_edgar', description: '+50 Trust with Old Edgar' },
    ],
    isRepeatable: false,
  },
};

// ============= QUEST MANAGEMENT FUNCTIONS =============

// Quest log limits to prevent unbounded growth - designed for 100k+ turn games
const QUEST_LOG_LIMITS = {
  maxCompletedHistory: 100,  // Keep last 100 completed quest IDs  
  maxFailedHistory: 50,      // Keep last 50 failed quest IDs
  maxActiveQuests: 20,       // Maximum simultaneous active quests
  maxJournalEntries: 30,     // Max journal entries per quest
  maxQuestsInLog: 200,       // Max total quests stored (active + completed + failed)
  questPruneThreshold: 150,  // Start pruning when we hit this many quests
} as const;

export function initializeQuestLog(): QuestLog {
  return {
    quests: {},
    completedQuestIds: [],
    failedQuestIds: [],
    availableQuests: ['tutorial_explore'], // Start with tutorial
    totalCompleted: 0,
    totalFailed: 0,
    currentActiveCount: 0,
  };
}

export function startQuest(questLog: QuestLog, questId: string): QuestLog {
  const definition = QUEST_DEFINITIONS[questId];
  if (!definition) {
    console.warn(`[QuestSystem] Cannot start quest: Unknown quest ID "${questId}"`);
    return questLog;
  }
  
  // Prevent starting duplicate quests
  if (questLog.quests[questId]?.status === 'active') {
    console.warn(`[QuestSystem] Quest "${questId}" is already active`);
    return questLog;
  }
  
  // Enforce active quest limit
  if (questLog.currentActiveCount >= QUEST_LOG_LIMITS.maxActiveQuests) {
    console.warn(`[QuestSystem] Cannot start quest: Max active quests (${QUEST_LOG_LIMITS.maxActiveQuests}) reached`);
    return questLog;
  }
  
  // Deep clone objectives to prevent shared state issues
  const clonedObjectives = definition.objectives.map(obj => ({ ...obj }));
  
  const quest: Quest = {
    ...definition,
    objectives: clonedObjectives,
    status: 'active',
    currentObjectiveIndex: 0,
    journalEntries: [{
      tick: Date.now(),
      text: `Quest started: ${definition.title}`,
      isAuto: true,
    }],
    startedAt: Date.now(),
  };
  
  return {
    ...questLog,
    quests: { ...questLog.quests, [questId]: quest },
    availableQuests: questLog.availableQuests.filter(id => id !== questId),
    currentActiveCount: Math.max(0, questLog.currentActiveCount + 1),
  };
}

export function updateObjectiveProgress(
  questLog: QuestLog,
  questId: string,
  objectiveId: string,
  increment: number = 1
): { questLog: QuestLog; completed: boolean; questCompleted: boolean; message: string } {
  const quest = questLog.quests[questId];
  if (!quest || quest.status !== 'active') {
    return { questLog, completed: false, questCompleted: false, message: '' };
  }
  
  const objective = quest.objectives.find(o => o.id === objectiveId);
  if (!objective || objective.status !== 'active') {
    return { questLog, completed: false, questCompleted: false, message: '' };
  }
  
  const newCount = Math.min(objective.targetCount, objective.currentCount + increment);
  const completed = newCount >= objective.targetCount;
  
  // Update objective
  const updatedObjectives = quest.objectives.map(o => {
    if (o.id === objectiveId) {
      return { ...o, currentCount: newCount, status: completed ? 'completed' : o.status };
    }
    // Reveal hidden objectives
    if (completed && objective.unlocksObjectives?.includes(o.id)) {
      return { ...o, isHidden: false, status: 'active' };
    }
    return o;
  }) as QuestObjective[];
  
  // Activate next objective if current completed
  const nextPendingIdx = updatedObjectives.findIndex(
    (o, idx) => idx > quest.currentObjectiveIndex && o.status === 'pending' && !o.isHidden
  );
  
  if (completed && nextPendingIdx !== -1) {
    updatedObjectives[nextPendingIdx].status = 'active';
  }
  
  // Check if quest is complete
  const allRequired = updatedObjectives.filter(o => o.status !== 'optional' && !o.alternativeObjectives?.length);
  const questCompleted = allRequired.every(o => o.status === 'completed');
  
  const updatedQuest: Quest = {
    ...quest,
    objectives: updatedObjectives,
    currentObjectiveIndex: completed && nextPendingIdx !== -1 ? nextPendingIdx : quest.currentObjectiveIndex,
    status: questCompleted ? 'completed' : quest.status,
    completedAt: questCompleted ? Date.now() : undefined,
    journalEntries: [
      ...quest.journalEntries,
      ...(completed ? [{ tick: Date.now(), text: `Objective completed: ${objective.description}`, isAuto: true }] : []),
      ...(questCompleted ? [{ tick: Date.now(), text: `Quest completed: ${quest.title}!`, isAuto: true }] : []),
    ],
  };
  
  let message = '';
  if (completed) {
    message = `*Objective completed: ${objective.description}*`;
  }
  if (questCompleted) {
    message = `**Quest Completed: ${quest.title}!**\\n${quest.rewards.map(r => r.description).join(', ')}`;
  }
  
  // Cap completed quest history to prevent unbounded growth
  let newCompletedIds = questCompleted 
    ? [...questLog.completedQuestIds, questId]
    : questLog.completedQuestIds;
  if (newCompletedIds.length > QUEST_LOG_LIMITS.maxCompletedHistory) {
    newCompletedIds = newCompletedIds.slice(-QUEST_LOG_LIMITS.maxCompletedHistory);
  }

  return {
    questLog: {
      ...questLog,
      quests: { ...questLog.quests, [questId]: updatedQuest },
      completedQuestIds: newCompletedIds,
      totalCompleted: questCompleted ? questLog.totalCompleted + 1 : questLog.totalCompleted,
      currentActiveCount: questCompleted ? questLog.currentActiveCount - 1 : questLog.currentActiveCount,
    },
    completed,
    questCompleted,
    message,
  };
}

export function failQuest(questLog: QuestLog, questId: string, reason: string): QuestLog {
  const quest = questLog.quests[questId];
  if (!quest) return questLog;
  
  // Limit journal entries
  const trimmedJournalEntries = quest.journalEntries.slice(-QUEST_LOG_LIMITS.maxJournalEntries + 1);
  
  const updatedQuest: Quest = {
    ...quest,
    status: 'failed',
    journalEntries: [
      ...trimmedJournalEntries,
      { tick: Date.now(), text: `Quest failed: ${reason}`, isAuto: true },
    ],
  };
  
  // Cap failed quest history
  let newFailedIds = [...questLog.failedQuestIds, questId];
  if (newFailedIds.length > QUEST_LOG_LIMITS.maxFailedHistory) {
    newFailedIds = newFailedIds.slice(-QUEST_LOG_LIMITS.maxFailedHistory);
  }
  
  return pruneQuestLog({
    ...questLog,
    quests: { ...questLog.quests, [questId]: updatedQuest },
    failedQuestIds: newFailedIds,
    totalFailed: questLog.totalFailed + 1,
    currentActiveCount: questLog.currentActiveCount - 1,
  });
}

// Prune old quests to prevent unbounded growth in 100k+ turn games
function pruneQuestLog(questLog: QuestLog): QuestLog {
  const questCount = Object.keys(questLog.quests).length;
  
  if (questCount <= QUEST_LOG_LIMITS.questPruneThreshold) {
    return questLog;
  }
  
  // Get quests sorted by completion time (oldest first)
  const questEntries = Object.entries(questLog.quests);
  const completedQuests = questEntries
    .filter(([_, q]) => q.status === 'completed' || q.status === 'failed' || q.status === 'abandoned')
    .sort((a, b) => (a[1].completedAt || 0) - (b[1].completedAt || 0));
  
  // Remove oldest completed quests until we're under limit
  const toRemove = questCount - QUEST_LOG_LIMITS.maxQuestsInLog;
  const removedIds = new Set(completedQuests.slice(0, Math.max(0, toRemove)).map(([id]) => id));
  
  if (removedIds.size === 0) return questLog;
  
  const prunedQuests: Record<string, Quest> = {};
  for (const [id, quest] of questEntries) {
    if (!removedIds.has(id)) {
      prunedQuests[id] = quest;
    }
  }
  
  console.log(`[QuestSystem] Pruned ${removedIds.size} old quests for memory efficiency`);
  
  return {
    ...questLog,
    quests: prunedQuests,
  };
}

export function abandonQuest(questLog: QuestLog, questId: string): QuestLog {
  const quest = questLog.quests[questId];
  if (!quest) return questLog;
  
  const updatedQuest: Quest = {
    ...quest,
    status: 'abandoned',
    journalEntries: [
      ...quest.journalEntries,
      { tick: Date.now(), text: 'Quest abandoned.', isAuto: true },
    ],
  };
  
  return {
    ...questLog,
    quests: { ...questLog.quests, [questId]: updatedQuest },
    currentActiveCount: questLog.currentActiveCount - 1,
  };
}

// ============= QUEST DISCOVERY =============

export function checkQuestAvailability(
  questLog: QuestLog,
  gameState: GameState,
  npcId?: string
): string[] {
  const newlyAvailable: string[] = [];
  
  for (const [questId, definition] of Object.entries(QUEST_DEFINITIONS)) {
    // Skip if already in quest log
    if (questLog.quests[questId] || questLog.availableQuests.includes(questId)) continue;
    
    // Skip if already completed (unless repeatable)
    if (questLog.completedQuestIds.includes(questId)) {
      const quest = questLog.quests[questId];
      if (!definition.isRepeatable) continue;
      if (quest && quest.lastCompletedAt) {
        const cooldownTicks = (definition.repeatCooldown || 0) * 60; // hours to ticks
        if (Date.now() - quest.lastCompletedAt < cooldownTicks) continue;
      }
    }
    
    // Check prerequisites
    if (definition.prerequisiteQuests) {
      const allPrereqsMet = definition.prerequisiteQuests.every(
        prereqId => questLog.completedQuestIds.includes(prereqId)
      );
      if (!allPrereqsMet) continue;
    }
    
    // Check NPC availability
    if (definition.giverNpcId) {
      if (npcId && npcId === definition.giverNpcId) {
        newlyAvailable.push(questId);
      }
    } else {
      newlyAvailable.push(questId);
    }
  }
  
  return newlyAvailable;
}

export function addJournalEntry(questLog: QuestLog, questId: string, text: string): QuestLog {
  const quest = questLog.quests[questId];
  if (!quest) return questLog;
  
  return {
    ...questLog,
    quests: {
      ...questLog.quests,
      [questId]: {
        ...quest,
        journalEntries: [
          ...quest.journalEntries,
          { tick: Date.now(), text, isAuto: false },
        ],
      },
    },
  };
}

// ============= QUEST PROGRESS TRACKING =============

export function checkActionProgress(
  questLog: QuestLog,
  actionType: 'talk' | 'go' | 'collect' | 'deliver' | 'skill_check' | 'custom',
  targetId?: string
): { updates: Array<{ questId: string; objectiveId: string }>; messages: string[] } {
  const updates: Array<{ questId: string; objectiveId: string }> = [];
  
  for (const [questId, quest] of Object.entries(questLog.quests)) {
    if (quest.status !== 'active') continue;
    
    for (const objective of quest.objectives) {
      if (objective.status !== 'active') continue;
      if (objective.targetType !== actionType) continue;
      if (targetId && objective.targetId && objective.targetId !== targetId) continue;
      
      updates.push({ questId, objectiveId: objective.id });
    }
  }
  
  // Apply updates
  let updatedLog = questLog;
  const messages: string[] = [];
  
  for (const update of updates) {
    const result = updateObjectiveProgress(updatedLog, update.questId, update.objectiveId);
    updatedLog = result.questLog;
    if (result.message) {
      messages.push(result.message);
    }
  }
  
  return { updates, messages };
}

// ============= REWARD APPLICATION =============

export function applyQuestRewards(
  rewards: QuestReward[],
  gameState: GameState
): { gameState: GameState; messages: string[] } {
  let updatedState = { ...gameState };
  const messages: string[] = [];
  
  for (const reward of rewards) {
    switch (reward.type) {
      case 'money':
        if (updatedState.lifeSim) {
          updatedState.lifeSim = {
            ...updatedState.lifeSim,
            economy: {
              ...updatedState.lifeSim.economy,
              money: updatedState.lifeSim.economy.money + reward.value,
            },
          };
          updatedState.player = {
            ...updatedState.player,
            stats: { ...updatedState.player.stats, gold: updatedState.player.stats.gold + reward.value },
          };
        }
        messages.push(`+${reward.value} gold`);
        break;
        
      case 'relationship':
        if (reward.targetId && updatedState.npcs[reward.targetId]) {
          const npc = updatedState.npcs[reward.targetId];
          updatedState.npcs = {
            ...updatedState.npcs,
            [reward.targetId]: {
              ...npc,
              relationships: {
                ...npc.relationships,
                player: {
                  ...npc.relationships.player,
                  trust: (npc.relationships.player?.trust || 0) + reward.value,
                },
              },
            },
          };
          messages.push(`+${reward.value} Trust with ${npc.meta.name}`);
        }
        break;
        
      // Other reward types can be implemented as needed
    }
  }
  
  return { gameState: updatedState, messages };
}

// ============= NARRATIVE FORMATTING =============

export function formatQuestForNarrative(quest: Quest): string {
  const statusIcon = {
    available: '📋',
    active: '⚔️',
    completed: '✅',
    failed: '❌',
    abandoned: '🚫',
  }[quest.status];
  
  let text = `${statusIcon} **${quest.title}**\\n${quest.description}\\n\\n`;
  
  text += '**Objectives:**\\n';
  for (const obj of quest.objectives) {
    if (obj.isHidden && obj.status === 'pending') continue;
    
    const icon = obj.status === 'completed' ? '✓' : obj.status === 'active' ? '→' : '○';
    const progress = obj.targetCount > 1 ? ` (${obj.currentCount}/${obj.targetCount})` : '';
    text += `${icon} ${obj.description}${progress}\\n`;
  }
  
  if (quest.status === 'active' && quest.rewards.length > 0) {
    text += '\\n**Rewards:** ' + quest.rewards.map(r => r.description).join(', ');
  }
  
  return text;
}

export function formatQuestLogSummary(questLog: QuestLog): string {
  const activeQuests = Object.values(questLog.quests).filter(q => q.status === 'active');
  const availableQuests = questLog.availableQuests;
  
  let text = '**Quest Journal**\\n\\n';
  
  if (activeQuests.length > 0) {
    text += '**Active Quests:**\\n';
    for (const quest of activeQuests) {
      const activeObj = quest.objectives.find(o => o.status === 'active');
      text += `• ${quest.title}${activeObj ? `: ${activeObj.description}` : ''}\\n`;
    }
  } else {
    text += '*No active quests*\\n';
  }
  
  if (availableQuests.length > 0) {
    text += `\\n*${availableQuests.length} new quest(s) available*`;
  }
  
  text += `\\n\\n📊 Completed: ${questLog.totalCompleted} | Failed: ${questLog.totalFailed}`;
  
  return text;
}
