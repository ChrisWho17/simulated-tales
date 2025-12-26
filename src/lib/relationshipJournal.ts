// Relationship Journal System - Tracks romantic moments and milestones with characters

export type MomentType = 
  | 'first_meeting' 
  | 'first_conversation'
  | 'shared_adventure'
  | 'gift_given'
  | 'gift_received'
  | 'first_flirt'
  | 'first_kiss'
  | 'confession'
  | 'rejection'
  | 'first_date'
  | 'intimate_moment'
  | 'argument'
  | 'reconciliation'
  | 'heartbreak'
  | 'commitment'
  | 'milestone'
  | 'memory';

export type MilestoneType =
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'romantic_interest'
  | 'dating'
  | 'lover'
  | 'committed'
  | 'soulmate';

export interface RelationshipMoment {
  id: string;
  npcId: string;
  npcName: string;
  type: MomentType;
  description: string;
  timestamp: number; // game tick or Date.now()
  dateString: string; // formatted date for display
  emotionalImpact: number; // -100 to 100
  isRomantic: boolean;
  isMilestone: boolean;
  milestoneType?: MilestoneType;
}

export interface NPCRelationshipJournal {
  npcId: string;
  npcName: string;
  moments: RelationshipMoment[];
  currentMilestone: MilestoneType;
  totalMoments: number;
  romanticMoments: number;
}

export interface RelationshipJournalData {
  journals: Record<string, NPCRelationshipJournal>;
  lastUpdated: number;
}

const JOURNAL_STORAGE_KEY = 'relationship-journal';

// Get moment type display info
export function getMomentTypeInfo(type: MomentType): { icon: string; label: string; color: string } {
  const info: Record<MomentType, { icon: string; label: string; color: string }> = {
    first_meeting: { icon: '👋', label: 'First Meeting', color: 'text-blue-400' },
    first_conversation: { icon: '💬', label: 'First Conversation', color: 'text-sky-400' },
    shared_adventure: { icon: '⚔️', label: 'Shared Adventure', color: 'text-amber-400' },
    gift_given: { icon: '🎁', label: 'Gift Given', color: 'text-purple-400' },
    gift_received: { icon: '🎀', label: 'Gift Received', color: 'text-pink-400' },
    first_flirt: { icon: '😏', label: 'First Flirt', color: 'text-rose-400' },
    first_kiss: { icon: '💋', label: 'First Kiss', color: 'text-red-400' },
    confession: { icon: '💝', label: 'Confession', color: 'text-pink-500' },
    rejection: { icon: '💔', label: 'Rejection', color: 'text-gray-400' },
    first_date: { icon: '🌹', label: 'First Date', color: 'text-rose-500' },
    intimate_moment: { icon: '💕', label: 'Intimate Moment', color: 'text-pink-600' },
    argument: { icon: '💢', label: 'Argument', color: 'text-orange-400' },
    reconciliation: { icon: '🤝', label: 'Reconciliation', color: 'text-green-400' },
    heartbreak: { icon: '💔', label: 'Heartbreak', color: 'text-gray-500' },
    commitment: { icon: '💍', label: 'Commitment', color: 'text-yellow-400' },
    milestone: { icon: '⭐', label: 'Milestone', color: 'text-amber-500' },
    memory: { icon: '📝', label: 'Memory', color: 'text-slate-400' },
  };
  return info[type] || { icon: '📝', label: 'Moment', color: 'text-slate-400' };
}

// Get milestone display info
export function getMilestoneInfo(milestone: MilestoneType): { icon: string; label: string; color: string } {
  const info: Record<MilestoneType, { icon: string; label: string; color: string }> = {
    acquaintance: { icon: '👤', label: 'Acquaintance', color: 'text-slate-400' },
    friend: { icon: '🙂', label: 'Friend', color: 'text-green-400' },
    close_friend: { icon: '😊', label: 'Close Friend', color: 'text-emerald-400' },
    romantic_interest: { icon: '💓', label: 'Romantic Interest', color: 'text-pink-400' },
    dating: { icon: '💖', label: 'Dating', color: 'text-rose-400' },
    lover: { icon: '💗', label: 'Lover', color: 'text-red-400' },
    committed: { icon: '💕', label: 'Committed', color: 'text-pink-500' },
    soulmate: { icon: '💞', label: 'Soulmate', color: 'text-pink-600' },
  };
  return info[milestone] || { icon: '👤', label: 'Unknown', color: 'text-slate-400' };
}

// Load journal from storage
export function loadRelationshipJournal(): RelationshipJournalData {
  try {
    const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load relationship journal:', e);
  }
  return { journals: {}, lastUpdated: Date.now() };
}

// Save journal to storage
export function saveRelationshipJournal(data: RelationshipJournalData): void {
  try {
    data.lastUpdated = Date.now();
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save relationship journal:', e);
  }
}

// Add a moment to an NPC's journal
export function addRelationshipMoment(
  npcId: string,
  npcName: string,
  type: MomentType,
  description: string,
  options: {
    emotionalImpact?: number;
    isRomantic?: boolean;
    isMilestone?: boolean;
    milestoneType?: MilestoneType;
    timestamp?: number;
  } = {}
): RelationshipMoment {
  const data = loadRelationshipJournal();
  
  // Ensure NPC journal exists
  if (!data.journals[npcId]) {
    data.journals[npcId] = {
      npcId,
      npcName,
      moments: [],
      currentMilestone: 'acquaintance',
      totalMoments: 0,
      romanticMoments: 0,
    };
  }
  
  const journal = data.journals[npcId];
  
  // Create moment
  const moment: RelationshipMoment = {
    id: `${npcId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    npcId,
    npcName,
    type,
    description,
    timestamp: options.timestamp || Date.now(),
    dateString: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }),
    emotionalImpact: options.emotionalImpact ?? 0,
    isRomantic: options.isRomantic ?? false,
    isMilestone: options.isMilestone ?? false,
    milestoneType: options.milestoneType,
  };
  
  // Add to journal
  journal.moments.unshift(moment); // Add to beginning for newest first
  journal.totalMoments++;
  if (moment.isRomantic) journal.romanticMoments++;
  
  // Update milestone if applicable
  if (moment.isMilestone && moment.milestoneType) {
    journal.currentMilestone = moment.milestoneType;
  }
  
  // Keep only last 50 moments per NPC to prevent bloat
  if (journal.moments.length > 50) {
    journal.moments = journal.moments.slice(0, 50);
  }
  
  saveRelationshipJournal(data);
  return moment;
}

// Get all romantic moments across all NPCs
export function getAllRomanticMoments(): RelationshipMoment[] {
  const data = loadRelationshipJournal();
  const allMoments: RelationshipMoment[] = [];
  
  for (const journal of Object.values(data.journals)) {
    allMoments.push(...journal.moments.filter(m => m.isRomantic));
  }
  
  return allMoments.sort((a, b) => b.timestamp - a.timestamp);
}

// Get all milestones
export function getAllMilestones(): RelationshipMoment[] {
  const data = loadRelationshipJournal();
  const milestones: RelationshipMoment[] = [];
  
  for (const journal of Object.values(data.journals)) {
    milestones.push(...journal.moments.filter(m => m.isMilestone));
  }
  
  return milestones.sort((a, b) => b.timestamp - a.timestamp);
}

// Get journal for a specific NPC
export function getNPCJournal(npcId: string): NPCRelationshipJournal | null {
  const data = loadRelationshipJournal();
  return data.journals[npcId] || null;
}

// Get all journals with romantic content
export function getRomanticJournals(): NPCRelationshipJournal[] {
  const data = loadRelationshipJournal();
  return Object.values(data.journals)
    .filter(j => j.romanticMoments > 0 || j.currentMilestone !== 'acquaintance')
    .sort((a, b) => {
      // Sort by milestone level, then by romantic moments
      const milestoneOrder: MilestoneType[] = ['soulmate', 'committed', 'lover', 'dating', 'romantic_interest', 'close_friend', 'friend', 'acquaintance'];
      const aOrder = milestoneOrder.indexOf(a.currentMilestone);
      const bOrder = milestoneOrder.indexOf(b.currentMilestone);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.romanticMoments - a.romanticMoments;
    });
}

// Clear all journal data
export function clearRelationshipJournal(): void {
  localStorage.removeItem(JOURNAL_STORAGE_KEY);
}
