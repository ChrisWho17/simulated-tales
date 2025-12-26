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
  | 'stranger'
  | 'acquaintance'
  | 'friend'
  | 'close_friend'
  | 'crush'
  | 'romantic_interest'
  | 'dating'
  | 'partner'
  | 'lover'
  | 'committed'
  | 'soulmate'
  | 'rival'
  | 'enemy';

// Trigger types from dialogue system
export type ProgressionTriggerType = 
  | 'confession' 
  | 'intimacy' 
  | 'trust_built' 
  | 'shared_moment' 
  | 'romantic_gesture' 
  | 'commitment' 
  | 'deep_connection';

export interface MilestoneProgression {
  shouldProgress: boolean;
  currentMilestone: MilestoneType;
  suggestedMilestone?: MilestoneType;
  triggerType?: ProgressionTriggerType;
  triggerDescription?: string;
}

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

export interface PersonalNote {
  id: string;
  content: string;
  timestamp: number;
  dateString: string;
}

export interface NPCRelationshipJournal {
  npcId: string;
  npcName: string;
  moments: RelationshipMoment[];
  personalNotes: PersonalNote[];
  currentMilestone: MilestoneType;
  totalMoments: number;
  romanticMoments: number;
}

export interface RelationshipJournalData {
  journals: Record<string, NPCRelationshipJournal>;
  // Index mapping normalized names to npcIds for deduplication
  nameIndex: Record<string, string>;
  lastUpdated: number;
}

const JOURNAL_STORAGE_KEY = 'relationship-journal';

// ============= NPC ID ANCHORING SYSTEM =============

/**
 * Normalize an NPC name into a consistent ID anchor.
 * Strips parenthetical info, trims, lowercases.
 * "Sentry (unknown)" → "sentry"
 * "Sergeant Thompson" → "sergeant_thompson"
 */
export function normalizeNpcName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, '') // Remove parenthetical info like "(unknown)"
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
    .replace(/^_|_$/g, ''); // Trim leading/trailing underscores
}

/**
 * Find or create an NPC ID based on name matching.
 * Checks if a similar name already exists in the journal and returns that ID.
 * Otherwise creates a new ID.
 */
export function findOrCreateNpcId(
  npcId: string | undefined,
  npcName: string,
  data: RelationshipJournalData
): { id: string; isExisting: boolean } {
  // Ensure nameIndex exists (migration)
  if (!data.nameIndex) {
    data.nameIndex = {};
    // Build index from existing journals
    for (const [id, journal] of Object.entries(data.journals)) {
      const normalizedName = normalizeNpcName(journal.npcName);
      if (normalizedName && !data.nameIndex[normalizedName]) {
        data.nameIndex[normalizedName] = id;
      }
    }
  }

  const normalizedName = normalizeNpcName(npcName);
  
  // Check if this normalized name already has an ID
  if (normalizedName && data.nameIndex[normalizedName]) {
    return { id: data.nameIndex[normalizedName], isExisting: true };
  }
  
  // Check if the provided npcId already exists
  if (npcId && data.journals[npcId]) {
    // Update the name index with this name
    if (normalizedName) {
      data.nameIndex[normalizedName] = npcId;
    }
    return { id: npcId, isExisting: true };
  }
  
  // Create new ID - prefer provided ID, otherwise generate from name
  const newId = npcId || `npc-${normalizedName || Date.now()}`;
  if (normalizedName) {
    data.nameIndex[normalizedName] = newId;
  }
  
  return { id: newId, isExisting: false };
}

/**
 * Update the NPC name if the new name is "better" (more complete).
 * "Sentry" is better than "Sentry (unknown)"
 * "Sergeant Thompson" is better than "Sergeant T..."
 */
export function shouldUpdateName(currentName: string, newName: string): boolean {
  if (!currentName || !newName) return !!newName;
  
  // New name without parenthetical is preferred
  const currentHasParens = /\([^)]*\)/.test(currentName);
  const newHasParens = /\([^)]*\)/.test(newName);
  if (currentHasParens && !newHasParens) return true;
  
  // New name without ellipsis is preferred
  const currentHasEllipsis = currentName.includes('...');
  const newHasEllipsis = newName.includes('...');
  if (currentHasEllipsis && !newHasEllipsis) return true;
  
  // Longer complete name is preferred (but not if it's just adding "(unknown)")
  const cleanCurrent = currentName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  const cleanNew = newName.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (cleanNew.length > cleanCurrent.length && !newHasParens) return true;
  
  return false;
}

// ============= END NPC ID ANCHORING SYSTEM =============

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

// Get milestone display info with color coding
export function getMilestoneInfo(milestone: MilestoneType): { icon: string; label: string; color: string; bgColor: string; borderColor: string } {
  const info: Record<MilestoneType, { icon: string; label: string; color: string; bgColor: string; borderColor: string }> = {
    stranger: { icon: '👤', label: 'Stranger', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' },
    acquaintance: { icon: '🤝', label: 'Acquaintance', color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
    friend: { icon: '😊', label: 'Friend', color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    close_friend: { icon: '🫂', label: 'Close Friend', color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
    crush: { icon: '😳', label: 'Crush', color: 'text-pink-300', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/30' },
    romantic_interest: { icon: '💓', label: 'Romantic Interest', color: 'text-pink-400', bgColor: 'bg-pink-500/15', borderColor: 'border-pink-500/40' },
    dating: { icon: '💖', label: 'Dating', color: 'text-rose-400', bgColor: 'bg-rose-500/15', borderColor: 'border-rose-500/40' },
    partner: { icon: '💑', label: 'Partner', color: 'text-rose-500', bgColor: 'bg-rose-500/20', borderColor: 'border-rose-500/50' },
    lover: { icon: '💗', label: 'Lover', color: 'text-red-400', bgColor: 'bg-red-500/20', borderColor: 'border-red-500/50' },
    committed: { icon: '💕', label: 'Committed', color: 'text-pink-500', bgColor: 'bg-pink-500/25', borderColor: 'border-pink-500/60' },
    soulmate: { icon: '💞', label: 'Soulmate', color: 'text-fuchsia-400', bgColor: 'bg-fuchsia-500/25', borderColor: 'border-fuchsia-500/60' },
    rival: { icon: '⚔️', label: 'Rival', color: 'text-orange-400', bgColor: 'bg-orange-500/15', borderColor: 'border-orange-500/40' },
    enemy: { icon: '💢', label: 'Enemy', color: 'text-red-500', bgColor: 'bg-red-500/15', borderColor: 'border-red-500/40' },
  };
  return info[milestone] || { icon: '👤', label: 'Unknown', color: 'text-slate-400', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/30' };
}

// Load journal from storage
export function loadRelationshipJournal(): RelationshipJournalData {
  try {
    const saved = localStorage.getItem(JOURNAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure nameIndex exists (migration from old format)
      if (!parsed.nameIndex) {
        parsed.nameIndex = {};
        // Build index from existing journals
        for (const [id, journal] of Object.entries(parsed.journals)) {
          const j = journal as NPCRelationshipJournal;
          const normalizedName = normalizeNpcName(j.npcName);
          if (normalizedName && !parsed.nameIndex[normalizedName]) {
            parsed.nameIndex[normalizedName] = id;
          }
        }
      }
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load relationship journal:', e);
  }
  return { journals: {}, nameIndex: {}, lastUpdated: Date.now() };
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
  npcId: string | undefined,
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
  
  // Use the anchoring system to find or create consistent NPC ID
  const { id: resolvedNpcId, isExisting } = findOrCreateNpcId(npcId, npcName, data);
  
  // Ensure NPC journal exists
  if (!data.journals[resolvedNpcId]) {
    data.journals[resolvedNpcId] = {
      npcId: resolvedNpcId,
      npcName,
      moments: [],
      personalNotes: [],
      currentMilestone: 'acquaintance',
      totalMoments: 0,
      romanticMoments: 0,
    };
  }
  
  const journal = data.journals[resolvedNpcId];
  
  // Update NPC name if the new name is "better" (clearer, more complete)
  if (isExisting && shouldUpdateName(journal.npcName, npcName)) {
    journal.npcName = npcName;
    journal.npcId = resolvedNpcId; // Keep ID consistent
    // Also update moments to use new name for display consistency
    journal.moments.forEach(m => m.npcName = npcName);
  }
  
  // Create moment
  const moment: RelationshipMoment = {
    id: `${resolvedNpcId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    npcId: resolvedNpcId,
    npcName: journal.npcName, // Use the canonical name from journal
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

// Get all journals (with any content)
export function getAllJournals(): NPCRelationshipJournal[] {
  const data = loadRelationshipJournal();
  return Object.values(data.journals)
    .sort((a, b) => {
      // Sort by milestone level, then by total moments
      const milestoneOrder: MilestoneType[] = ['soulmate', 'committed', 'lover', 'partner', 'dating', 'crush', 'romantic_interest', 'close_friend', 'friend', 'acquaintance', 'stranger', 'rival', 'enemy'];
      const aOrder = milestoneOrder.indexOf(a.currentMilestone);
      const bOrder = milestoneOrder.indexOf(b.currentMilestone);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return b.totalMoments - a.totalMoments;
    });
}

// Get all journals with romantic content
export function getRomanticJournals(): NPCRelationshipJournal[] {
  const data = loadRelationshipJournal();
  return Object.values(data.journals)
    .filter(j => j.romanticMoments > 0 || !['stranger', 'acquaintance', 'friend', 'rival', 'enemy'].includes(j.currentMilestone))
    .sort((a, b) => {
      // Sort by milestone level, then by romantic moments
      const milestoneOrder: MilestoneType[] = ['soulmate', 'committed', 'lover', 'partner', 'dating', 'crush', 'romantic_interest', 'close_friend', 'friend', 'acquaintance', 'stranger'];
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

// Update milestone from dialogue progression
export function updateMilestoneFromProgression(
  npcId: string | undefined,
  npcName: string,
  progression: MilestoneProgression
): void {
  if (!progression.shouldProgress || !progression.suggestedMilestone) return;
  
  const data = loadRelationshipJournal();
  
  // Use the anchoring system to find or create consistent NPC ID
  const { id: resolvedNpcId, isExisting } = findOrCreateNpcId(npcId, npcName, data);
  
  // Ensure NPC journal exists
  if (!data.journals[resolvedNpcId]) {
    data.journals[resolvedNpcId] = {
      npcId: resolvedNpcId,
      npcName,
      moments: [],
      personalNotes: [],
      currentMilestone: 'stranger',
      totalMoments: 0,
      romanticMoments: 0,
    };
  }
  
  const journal = data.journals[resolvedNpcId];
  
  // Update NPC name if the new name is "better"
  if (isExisting && shouldUpdateName(journal.npcName, npcName)) {
    journal.npcName = npcName;
    journal.moments.forEach(m => m.npcName = npcName);
  }
  
  const oldMilestone = journal.currentMilestone;
  const newMilestone = progression.suggestedMilestone;
  
  // Only update if it's an actual progression
  if (oldMilestone === newMilestone) return;
  
  journal.currentMilestone = newMilestone;
  
  // Create a milestone moment
  const triggerLabels: Record<ProgressionTriggerType, string> = {
    confession: 'A heartfelt confession',
    intimacy: 'A moment of intimacy',
    trust_built: 'Trust was established',
    shared_moment: 'A meaningful shared experience',
    romantic_gesture: 'A romantic gesture',
    commitment: 'A commitment was made',
    deep_connection: 'Souls connected deeply',
  };
  
  const milestoneInfo = getMilestoneInfo(newMilestone);
  const description = progression.triggerDescription || 
    (progression.triggerType ? triggerLabels[progression.triggerType] : 'The relationship evolved');
  
  const moment: RelationshipMoment = {
    id: `${resolvedNpcId}-milestone-${Date.now()}`,
    npcId: resolvedNpcId,
    npcName: journal.npcName,
    type: 'milestone',
    description: `${milestoneInfo.icon} ${description} - Now ${milestoneInfo.label}`,
    timestamp: Date.now(),
    dateString: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }),
    emotionalImpact: 50,
    isRomantic: ['crush', 'romantic_interest', 'dating', 'partner', 'lover', 'committed', 'soulmate'].includes(newMilestone),
    isMilestone: true,
    milestoneType: newMilestone,
  };
  
  journal.moments.unshift(moment);
  journal.totalMoments++;
  if (moment.isRomantic) journal.romanticMoments++;
  
  saveRelationshipJournal(data);
}

// Add a personal note to an NPC's journal
export function addPersonalNote(
  npcId: string | undefined,
  npcName: string,
  content: string
): PersonalNote | null {
  if (!content.trim()) return null;
  
  const data = loadRelationshipJournal();
  
  // Use the anchoring system to find or create consistent NPC ID
  const { id: resolvedNpcId, isExisting } = findOrCreateNpcId(npcId, npcName, data);
  
  // Ensure NPC journal exists
  if (!data.journals[resolvedNpcId]) {
    data.journals[resolvedNpcId] = {
      npcId: resolvedNpcId,
      npcName,
      moments: [],
      personalNotes: [],
      currentMilestone: 'stranger',
      totalMoments: 0,
      romanticMoments: 0,
    };
  }
  
  const journal = data.journals[resolvedNpcId];
  
  // Update NPC name if the new name is "better"
  if (isExisting && shouldUpdateName(journal.npcName, npcName)) {
    journal.npcName = npcName;
    journal.moments.forEach(m => m.npcName = npcName);
  }
  
  // Ensure personalNotes array exists (for backward compatibility)
  if (!journal.personalNotes) {
    journal.personalNotes = [];
  }
  
  const note: PersonalNote = {
    id: `note-${resolvedNpcId}-${Date.now()}`,
    content: content.trim().slice(0, 500), // Limit to 500 characters
    timestamp: Date.now(),
    dateString: new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }),
  };
  
  journal.personalNotes.unshift(note);
  
  // Keep only last 20 notes per NPC
  if (journal.personalNotes.length > 20) {
    journal.personalNotes = journal.personalNotes.slice(0, 20);
  }
  
  saveRelationshipJournal(data);
  return note;
}

// Delete a personal note
export function deletePersonalNote(npcId: string, noteId: string): boolean {
  const data = loadRelationshipJournal();
  const journal = data.journals[npcId];
  
  if (!journal || !journal.personalNotes) return false;
  
  const index = journal.personalNotes.findIndex(n => n.id === noteId);
  if (index === -1) return false;
  
  journal.personalNotes.splice(index, 1);
  saveRelationshipJournal(data);
  return true;
}

// Update a personal note
export function updatePersonalNote(npcId: string, noteId: string, newContent: string): boolean {
  if (!newContent.trim()) return false;
  
  const data = loadRelationshipJournal();
  const journal = data.journals[npcId];
  
  if (!journal || !journal.personalNotes) return false;
  
  const note = journal.personalNotes.find(n => n.id === noteId);
  if (!note) return false;
  
  note.content = newContent.trim().slice(0, 500);
  note.dateString = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }) + ' (edited)';
  
  saveRelationshipJournal(data);
  return true;
}

/**
 * Consolidate duplicate NPC journals based on normalized names.
 * Merges moments and personal notes from duplicates into the primary journal.
 * Call this once after update to clean existing data.
 */
export function consolidateDuplicateJournals(): { merged: number; removed: string[] } {
  const data = loadRelationshipJournal();
  const nameToId: Record<string, string> = {};
  const toMerge: Record<string, string[]> = {}; // primary ID -> [duplicate IDs]
  
  // First pass: identify duplicates by normalized name
  for (const [id, journal] of Object.entries(data.journals)) {
    const normalizedName = normalizeNpcName(journal.npcName);
    if (!normalizedName) continue;
    
    if (nameToId[normalizedName]) {
      // This is a duplicate - add to merge list
      const primaryId = nameToId[normalizedName];
      if (!toMerge[primaryId]) toMerge[primaryId] = [];
      toMerge[primaryId].push(id);
    } else {
      nameToId[normalizedName] = id;
    }
  }
  
  // Second pass: merge duplicates into primaries
  const removed: string[] = [];
  for (const [primaryId, duplicateIds] of Object.entries(toMerge)) {
    const primaryJournal = data.journals[primaryId];
    if (!primaryJournal) continue;
    
    for (const dupId of duplicateIds) {
      const dupJournal = data.journals[dupId];
      if (!dupJournal) continue;
      
      // Choose the "better" name
      if (shouldUpdateName(primaryJournal.npcName, dupJournal.npcName)) {
        primaryJournal.npcName = dupJournal.npcName;
      }
      
      // Merge moments (avoid true duplicates by timestamp check)
      const existingTimestamps = new Set(primaryJournal.moments.map(m => m.timestamp));
      for (const moment of dupJournal.moments) {
        if (!existingTimestamps.has(moment.timestamp)) {
          moment.npcId = primaryId;
          moment.npcName = primaryJournal.npcName;
          primaryJournal.moments.push(moment);
        }
      }
      
      // Merge personal notes
      if (dupJournal.personalNotes) {
        if (!primaryJournal.personalNotes) primaryJournal.personalNotes = [];
        const existingNoteTimestamps = new Set(primaryJournal.personalNotes.map(n => n.timestamp));
        for (const note of dupJournal.personalNotes) {
          if (!existingNoteTimestamps.has(note.timestamp)) {
            primaryJournal.personalNotes.push(note);
          }
        }
      }
      
      // Update milestone if duplicate has higher progression
      const milestoneOrder: MilestoneType[] = ['soulmate', 'committed', 'lover', 'partner', 'dating', 'crush', 'romantic_interest', 'close_friend', 'friend', 'acquaintance', 'stranger', 'rival', 'enemy'];
      const primaryMilestoneRank = milestoneOrder.indexOf(primaryJournal.currentMilestone);
      const dupMilestoneRank = milestoneOrder.indexOf(dupJournal.currentMilestone);
      if (dupMilestoneRank < primaryMilestoneRank) {
        primaryJournal.currentMilestone = dupJournal.currentMilestone;
      }
      
      // Delete the duplicate
      delete data.journals[dupId];
      removed.push(dupId);
    }
    
    // Sort moments by timestamp (newest first) and trim
    primaryJournal.moments.sort((a, b) => b.timestamp - a.timestamp);
    if (primaryJournal.moments.length > 50) {
      primaryJournal.moments = primaryJournal.moments.slice(0, 50);
    }
    
    // Recalculate counts
    primaryJournal.totalMoments = primaryJournal.moments.length;
    primaryJournal.romanticMoments = primaryJournal.moments.filter(m => m.isRomantic).length;
  }
  
  // Rebuild name index
  data.nameIndex = {};
  for (const [id, journal] of Object.entries(data.journals)) {
    const normalizedName = normalizeNpcName(journal.npcName);
    if (normalizedName) {
      data.nameIndex[normalizedName] = id;
    }
  }
  
  saveRelationshipJournal(data);
  
  return { merged: Object.keys(toMerge).length, removed };
}
