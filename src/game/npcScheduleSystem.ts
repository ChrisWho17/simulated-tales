// NPC Schedule System - Determines NPC locations and activities based on time of day
// Integrates with the time progression system for dynamic world simulation

import { NPC, ScheduleEntry } from '@/types/game';
import { GameTimeState, TimeOfDayPeriod, getTimeOfDay } from './timeProgressionSystem';
import { RegisteredNPC, getAllRegisteredNPCs } from './npcIdentityRegistry';

export interface NPCScheduleInfo {
  npcId: string;
  npcName: string;
  currentLocation: string;
  currentActivity: string;
  previousLocation?: string;
  nextScheduledHour?: number;
  nextLocation?: string;
  nextActivity?: string;
}

export interface LocationPopulation {
  locationId: string;
  npcsPresent: NPCScheduleInfo[];
  ambientDescription: string;
}

// Get the active schedule entry for an NPC at a given hour
export function getScheduleEntryForHour(schedule: Record<number, ScheduleEntry>, hour: number): ScheduleEntry | null {
  // Find the most recent schedule entry at or before the current hour
  const scheduleHours = Object.keys(schedule)
    .map(Number)
    .sort((a, b) => a - b);
  
  if (scheduleHours.length === 0) return null;
  
  // Find the latest hour that's <= current hour
  let activeHour = scheduleHours[0];
  for (const scheduleHour of scheduleHours) {
    if (scheduleHour <= hour) {
      activeHour = scheduleHour;
    } else {
      break;
    }
  }
  
  // If current hour is before first schedule entry, wrap to last entry (from previous day)
  if (hour < scheduleHours[0]) {
    activeHour = scheduleHours[scheduleHours.length - 1];
  }
  
  return schedule[activeHour] || null;
}

// Get the next scheduled change for an NPC
export function getNextScheduleChange(schedule: Record<number, ScheduleEntry>, currentHour: number): { hour: number; entry: ScheduleEntry } | null {
  const scheduleHours = Object.keys(schedule)
    .map(Number)
    .sort((a, b) => a - b);
  
  if (scheduleHours.length === 0) return null;
  
  // Find next hour after current
  for (const hour of scheduleHours) {
    if (hour > currentHour) {
      return { hour, entry: schedule[hour] };
    }
  }
  
  // Wrap to first entry of next day
  return { hour: scheduleHours[0], entry: schedule[scheduleHours[0]] };
}

// Update a single NPC's location based on current time
export function updateNPCLocation(npc: NPC, timeState: GameTimeState): NPC {
  const schedule = npc.meta?.schedule;
  if (!schedule || Object.keys(schedule).length === 0) {
    return npc; // No schedule defined, NPC stays put
  }
  
  const entry = getScheduleEntryForHour(schedule, timeState.hour);
  if (!entry) return npc;
  
  return {
    ...npc,
    currentLocation: entry.location,
    currentActivity: entry.activity,
  };
}

// Update all NPCs based on current time
export function updateAllNPCLocations(
  npcs: Record<string, NPC>,
  timeState: GameTimeState
): Record<string, NPC> {
  const updatedNPCs: Record<string, NPC> = {};
  
  for (const [npcId, npc] of Object.entries(npcs)) {
    updatedNPCs[npcId] = updateNPCLocation(npc, timeState);
  }
  
  return updatedNPCs;
}

// Get schedule info for a specific NPC
export function getNPCScheduleInfo(npc: NPC, timeState: GameTimeState): NPCScheduleInfo {
  const schedule = npc.meta?.schedule || {};
  const entry = getScheduleEntryForHour(schedule, timeState.hour);
  const nextChange = getNextScheduleChange(schedule, timeState.hour);
  
  return {
    npcId: npc.id,
    npcName: npc.meta?.name || npc.id,
    currentLocation: entry?.location || npc.currentLocation,
    currentActivity: entry?.activity || npc.currentActivity,
    nextScheduledHour: nextChange?.hour,
    nextLocation: nextChange?.entry.location,
    nextActivity: nextChange?.entry.activity,
  };
}

// Get all NPCs at a specific location for a given time
export function getNPCsAtLocation(
  npcs: Record<string, NPC>,
  locationId: string,
  timeState: GameTimeState
): NPCScheduleInfo[] {
  const npcsAtLocation: NPCScheduleInfo[] = [];
  
  for (const npc of Object.values(npcs)) {
    const scheduleInfo = getNPCScheduleInfo(npc, timeState);
    if (scheduleInfo.currentLocation === locationId) {
      npcsAtLocation.push(scheduleInfo);
    }
  }
  
  return npcsAtLocation;
}

// Generate ambient description based on NPCs at location
function generateAmbientDescription(
  npcsPresent: NPCScheduleInfo[],
  timeOfDay: TimeOfDayPeriod
): string {
  if (npcsPresent.length === 0) {
    const emptyDescriptions: Record<TimeOfDayPeriod, string[]> = {
      dawn: ['The place is quiet in the early morning hours.', 'Few souls stir at this hour.'],
      morning: ['The area is relatively quiet.', 'Not many people about yet.'],
      afternoon: ['Things are quiet at the moment.', 'The usual crowd hasn\'t gathered.'],
      evening: ['Surprisingly empty for this time.', 'Quieter than usual tonight.'],
      dusk: ['The area empties as darkness approaches.', 'People have moved on as dusk settles.'],
      night: ['The night has driven most indoors.', 'Few brave the dark hours.'],
      late_night: ['The depths of night leave the place deserted.', 'Only shadows keep you company.'],
    };
    const options = emptyDescriptions[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (npcsPresent.length === 1) {
    const npc = npcsPresent[0];
    return `${npc.npcName} is here, ${npc.currentActivity.toLowerCase()}.`;
  }
  
  if (npcsPresent.length === 2) {
    return `${npcsPresent[0].npcName} and ${npcsPresent[1].npcName} are present.`;
  }
  
  const names = npcsPresent.slice(0, -1).map(n => n.npcName).join(', ');
  const lastName = npcsPresent[npcsPresent.length - 1].npcName;
  return `${names}, and ${lastName} are here.`;
}

// Get complete location population info
export function getLocationPopulation(
  npcs: Record<string, NPC>,
  locationId: string,
  timeState: GameTimeState
): LocationPopulation {
  const npcsPresent = getNPCsAtLocation(npcs, locationId, timeState);
  const timeOfDay = getTimeOfDay(timeState.hour);
  
  return {
    locationId,
    npcsPresent,
    ambientDescription: generateAmbientDescription(npcsPresent, timeOfDay),
  };
}

// Build NPC schedule context for AI prompts
export interface NPCScheduleContext {
  currentLocationNPCs: NPCScheduleInfo[];
  nearbyNPCs: { location: string; npcs: NPCScheduleInfo[] }[];
  scheduleNotes: string[];
}

export function buildNPCScheduleContext(
  npcs: Record<string, NPC>,
  playerLocation: string,
  timeState: GameTimeState,
  connectedLocations: string[] = []
): NPCScheduleContext {
  const currentLocationNPCs = getNPCsAtLocation(npcs, playerLocation, timeState);
  
  const nearbyNPCs: { location: string; npcs: NPCScheduleInfo[] }[] = [];
  for (const locationId of connectedLocations) {
    const npcsAtLocation = getNPCsAtLocation(npcs, locationId, timeState);
    if (npcsAtLocation.length > 0) {
      nearbyNPCs.push({ location: locationId, npcs: npcsAtLocation });
    }
  }
  
  // Generate schedule notes about upcoming NPC movements
  const scheduleNotes: string[] = [];
  const currentHour = timeState.hour;
  
  for (const npcInfo of currentLocationNPCs) {
    if (npcInfo.nextScheduledHour !== undefined && npcInfo.nextLocation) {
      const hoursUntil = npcInfo.nextScheduledHour > currentHour 
        ? npcInfo.nextScheduledHour - currentHour
        : (24 - currentHour) + npcInfo.nextScheduledHour;
      
      if (hoursUntil <= 2) {
        scheduleNotes.push(
          `${npcInfo.npcName} will be leaving soon to go ${npcInfo.nextActivity?.toLowerCase() || 'elsewhere'}.`
        );
      }
    }
  }
  
  return {
    currentLocationNPCs,
    nearbyNPCs,
    scheduleNotes,
  };
}

// Format NPC schedule context for AI prompt injection
export function formatNPCScheduleForAI(context: NPCScheduleContext, locationName: string): string {
  const lines: string[] = ['=== NPC PRESENCE (TIME-BASED) ==='];
  
  if (context.currentLocationNPCs.length > 0) {
    lines.push(`\nNPCs currently at ${locationName}:`);
    for (const npc of context.currentLocationNPCs) {
      lines.push(`• ${npc.npcName}: ${npc.currentActivity}`);
    }
  } else {
    lines.push(`\nNo familiar NPCs are currently at ${locationName}.`);
  }
  
  if (context.nearbyNPCs.length > 0) {
    lines.push('\nNPCs in nearby areas:');
    for (const { location, npcs } of context.nearbyNPCs) {
      const npcNames = npcs.map(n => n.npcName).join(', ');
      lines.push(`• ${location}: ${npcNames}`);
    }
  }
  
  if (context.scheduleNotes.length > 0) {
    lines.push('\nSchedule notes:');
    for (const note of context.scheduleNotes) {
      lines.push(`• ${note}`);
    }
  }
  
  lines.push('\nNPC PRESENCE INSTRUCTIONS:');
  lines.push('- Only include NPCs listed above in your narrative');
  lines.push('- NPCs not at this location should NOT appear unless they arrive');
  lines.push('- Reference NPC activities naturally (e.g., "Martha wipes down the bar...")');
  lines.push('- If an NPC is about to leave, you may hint at their departure');
  
  return lines.join('\n');
}

// Check if an NPC is available for interaction at current time
export function isNPCAvailable(npc: NPC, timeState: GameTimeState): boolean {
  const scheduleInfo = getNPCScheduleInfo(npc, timeState);
  const activity = scheduleInfo.currentActivity.toLowerCase();
  
  // NPCs are unavailable if they're sleeping
  if (activity.includes('sleep')) return false;
  
  return true;
}

// Get NPC availability status
export function getNPCAvailabilityStatus(npc: NPC, timeState: GameTimeState): {
  available: boolean;
  reason?: string;
  availableAt?: number;
} {
  const scheduleInfo = getNPCScheduleInfo(npc, timeState);
  const activity = scheduleInfo.currentActivity.toLowerCase();
  
  if (activity.includes('sleep')) {
    const nextChange = getNextScheduleChange(npc.meta?.schedule || {}, timeState.hour);
    return {
      available: false,
      reason: `${scheduleInfo.npcName} is sleeping`,
      availableAt: nextChange?.hour,
    };
  }
  
  return { available: true };
}

// ============= REGISTERED NPC INTEGRATION =============
// These functions work with the dynamic NPC registry system

/**
 * Build NPC schedule context from the registered NPC system
 * This is the primary integration point for the AI narrative system
 */
export function buildRegisteredNPCScheduleContext(
  playerLocation: string,
  timeState: GameTimeState,
  nearbyLocations: string[] = []
): NPCScheduleContext & { locationName: string } {
  const allNPCs = getAllRegisteredNPCs();
  const timeOfDay = getTimeOfDay(timeState.hour);
  
  // Filter NPCs at player's current location
  const currentLocationNPCs: NPCScheduleInfo[] = [];
  const nearbyNPCsMap: Map<string, NPCScheduleInfo[]> = new Map();
  
  for (const npc of allNPCs) {
    const npcLocation = npc.mutable.currentLocation?.toLowerCase() || '';
    const playerLocLower = playerLocation.toLowerCase();
    
    // Check if NPC is at player's location
    if (npcLocation === playerLocLower || 
        npcLocation.includes(playerLocLower) || 
        playerLocLower.includes(npcLocation)) {
      currentLocationNPCs.push({
        npcId: npc.permanent.id,
        npcName: npc.permanent.name,
        currentLocation: npc.mutable.currentLocation,
        currentActivity: getTimeBasedActivity(npc, timeOfDay),
      });
    } else {
      // Check nearby locations
      for (const nearbyLoc of nearbyLocations) {
        const nearbyLocLower = nearbyLoc.toLowerCase();
        if (npcLocation === nearbyLocLower || 
            npcLocation.includes(nearbyLocLower) || 
            nearbyLocLower.includes(npcLocation)) {
          if (!nearbyNPCsMap.has(nearbyLoc)) {
            nearbyNPCsMap.set(nearbyLoc, []);
          }
          nearbyNPCsMap.get(nearbyLoc)!.push({
            npcId: npc.permanent.id,
            npcName: npc.permanent.name,
            currentLocation: npc.mutable.currentLocation,
            currentActivity: getTimeBasedActivity(npc, timeOfDay),
          });
          break;
        }
      }
    }
  }
  
  const nearbyNPCs: { location: string; npcs: NPCScheduleInfo[] }[] = [];
  for (const [location, npcs] of nearbyNPCsMap) {
    nearbyNPCs.push({ location, npcs });
  }
  
  // Generate schedule notes based on time of day
  const scheduleNotes = generateTimeBasedNotes(timeOfDay);
  
  return {
    currentLocationNPCs,
    nearbyNPCs,
    scheduleNotes,
    locationName: playerLocation,
  };
}

/**
 * Get time-appropriate activity for an NPC
 * Uses the NPC's stored activity or generates a contextual one
 */
function getTimeBasedActivity(npc: RegisteredNPC, timeOfDay: TimeOfDayPeriod): string {
  // If NPC has a current activity set, use it
  if (npc.mutable.currentActivity && npc.mutable.currentActivity !== 'unknown') {
    return npc.mutable.currentActivity;
  }
  
  // Generate time-appropriate activity based on occupation
  const occupation = npc.semiPermanent.occupation?.toLowerCase() || '';
  
  const activities: Record<TimeOfDayPeriod, Record<string, string>> = {
    dawn: {
      merchant: 'setting up their stall for the day',
      guard: 'finishing the night watch',
      innkeeper: 'preparing breakfast',
      bartender: 'cleaning up from last night',
      default: 'starting their day',
    },
    morning: {
      merchant: 'arranging their wares',
      guard: 'patrolling the area',
      innkeeper: 'serving breakfast guests',
      bartender: 'restocking the bar',
      default: 'going about their morning routine',
    },
    afternoon: {
      merchant: 'haggling with customers',
      guard: 'keeping watch',
      innkeeper: 'managing the establishment',
      bartender: 'serving drinks',
      default: 'busy with their work',
    },
    evening: {
      merchant: 'packing up their goods',
      guard: 'changing shifts',
      innkeeper: 'welcoming evening guests',
      bartender: 'serving the evening crowd',
      default: 'winding down for the day',
    },
    dusk: {
      merchant: 'heading home',
      guard: 'beginning night patrol',
      innkeeper: 'lighting the lamps',
      bartender: 'tending to regulars',
      default: 'preparing for nightfall',
    },
    night: {
      merchant: 'resting at home',
      guard: 'on night watch',
      innkeeper: 'managing the night crowd',
      bartender: 'serving late-night patrons',
      default: 'settling in for the night',
    },
    late_night: {
      merchant: 'sleeping',
      guard: 'on vigilant patrol',
      innkeeper: 'keeping an eye on late guests',
      bartender: 'closing up shop',
      default: 'resting',
    },
  };
  
  const timeActivities = activities[timeOfDay];
  
  // Check for matching occupation
  for (const [role, activity] of Object.entries(timeActivities)) {
    if (role !== 'default' && occupation.includes(role)) {
      return activity;
    }
  }
  
  return timeActivities.default;
}

/**
 * Generate general schedule notes based on time of day
 */
function generateTimeBasedNotes(timeOfDay: TimeOfDayPeriod): string[] {
  const notes: string[] = [];
  
  switch (timeOfDay) {
    case 'dawn':
      notes.push('Most people are just waking up; only early risers are about.');
      break;
    case 'morning':
      notes.push('The day is in full swing; shops and businesses are open.');
      break;
    case 'afternoon':
      notes.push('Peak activity hours; most establishments are busy.');
      break;
    case 'evening':
      notes.push('Many shops are closing; taverns and inns are filling up.');
      break;
    case 'dusk':
      notes.push('Transition to night; lamplighters are at work.');
      break;
    case 'night':
      notes.push('Most shops are closed; only taverns and guards remain active.');
      break;
    case 'late_night':
      notes.push('Nearly everyone is asleep; streets are almost empty.');
      break;
  }
  
  return notes;
}
