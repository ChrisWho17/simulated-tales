import { GameState, GameEvent, Action, NPC, GameTime } from '@/types/game';
import { initialTime, initialPlayer, initialNPCs, initialLocations } from './initialData';

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const WEEKS_PER_SEASON = 4;

export function createInitialGameState(): GameState {
  return {
    time: { ...initialTime },
    player: { ...initialPlayer },
    npcs: JSON.parse(JSON.stringify(initialNPCs)),
    locations: JSON.parse(JSON.stringify(initialLocations)),
    events: [],
    flags: {},
    eventQueue: [],
  };
}

export function formatTime(time: GameTime): string {
  const period = time.hour >= 6 && time.hour < 12 ? 'morning' :
                 time.hour >= 12 && time.hour < 18 ? 'afternoon' :
                 time.hour >= 18 && time.hour < 22 ? 'evening' : 'night';
  
  const hourDisplay = time.hour % 12 || 12;
  const ampm = time.hour >= 12 ? 'PM' : 'AM';
  
  return `${hourDisplay}:00 ${ampm} - Day ${time.day}, ${time.season.charAt(0).toUpperCase() + time.season.slice(1)}, Year ${time.year}`;
}

export function getTimePeriod(hour: number): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

export function advanceTime(state: GameState, hours: number = 1): GameState {
  const newState = { ...state };
  newState.time = { ...state.time };
  
  for (let i = 0; i < hours; i++) {
    newState.time.tick++;
    newState.time.hour++;
    
    if (newState.time.hour >= HOURS_PER_DAY) {
      newState.time.hour = 0;
      newState.time.day++;
      
      if (newState.time.day > DAYS_PER_WEEK) {
        newState.time.day = 1;
        newState.time.week++;
        
        if (newState.time.week > WEEKS_PER_SEASON) {
          newState.time.week = 1;
          const seasons: GameTime['season'][] = ['spring', 'summer', 'autumn', 'winter'];
          const currentIdx = seasons.indexOf(newState.time.season);
          if (currentIdx === 3) {
            newState.time.season = 'spring';
            newState.time.year++;
          } else {
            newState.time.season = seasons[currentIdx + 1];
          }
        }
      }
    }
    
    // Run world simulation for each tick
    newState.npcs = simulateNPCs(newState);
    
    // Decay player stats
    newState.player = {
      ...newState.player,
      stats: {
        ...newState.player.stats,
        hunger: Math.max(0, newState.player.stats.hunger - 2),
        energy: Math.max(0, newState.player.stats.energy - 1),
      },
    };
  }
  
  return newState;
}

function simulateNPCs(state: GameState): Record<string, NPC> {
  const npcs = { ...state.npcs };
  
  for (const npcId in npcs) {
    const npc = { ...npcs[npcId] };
    
    // Find the appropriate schedule entry from meta
    const scheduleHours = Object.keys(npc.meta.schedule).map(Number).sort((a, b) => a - b);
    let currentSchedule = npc.meta.schedule[scheduleHours[0]];
    
    for (const hour of scheduleHours) {
      if (state.time.hour >= hour) {
        currentSchedule = npc.meta.schedule[hour];
      }
    }
    
    // Update NPC location and activity
    if (currentSchedule) {
      npc.currentLocation = currentSchedule.location;
      npc.currentActivity = currentSchedule.activity;
    }
    
    // Update NPC stats slightly (in meta)
    npc.meta = {
      ...npc.meta,
      stats: {
        ...npc.meta.stats,
        energy: Math.min(100, Math.max(0, npc.meta.stats.energy + (npc.currentActivity.includes('sleep') ? 10 : -1))),
        mood: Math.min(100, Math.max(0, npc.meta.stats.mood + (Math.random() > 0.5 ? 1 : -1))),
      },
    };
    
    npcs[npcId] = npc;
  }
  
  return npcs;
}

export function updateLocationNPCs(state: GameState): GameState {
  const newLocations = { ...state.locations };
  
  // Clear all NPC lists
  for (const locId in newLocations) {
    newLocations[locId] = { ...newLocations[locId], npcsPresent: [] };
  }
  
  // Assign NPCs to their current locations
  for (const npcId in state.npcs) {
    const npc = state.npcs[npcId];
    if (newLocations[npc.currentLocation]) {
      newLocations[npc.currentLocation] = {
        ...newLocations[npc.currentLocation],
        npcsPresent: [...newLocations[npc.currentLocation].npcsPresent, npcId],
      };
    }
  }
  
  return { ...state, locations: newLocations };
}

export function getNPCsAtLocation(state: GameState, locationId: string): NPC[] {
  return Object.values(state.npcs).filter(npc => npc.currentLocation === locationId);
}

export function getCurrentLocation(state: GameState) {
  return state.locations[state.player.currentLocation];
}

export function processAction(state: GameState, action: Action): { newState: GameState; events: GameEvent[] } {
  let newState = { ...state };
  const events: GameEvent[] = [];
  
  switch (action.type) {
    case 'look': {
      const location = getCurrentLocation(newState);
      const npcsHere = getNPCsAtLocation(newState, location.id);
      const timePeriod = getTimePeriod(newState.time.hour);
      const timeDesc = location.timeDescriptions?.[timePeriod] || '';
      
      let description = location.description;
      if (timeDesc) description += '\n\n' + timeDesc;
      
      if (npcsHere.length > 0) {
        description += '\n\nYou see: ' + npcsHere.map(npc => `${npc.meta.name} (${npc.currentActivity})`).join(', ') + '.';
      }
      
      if (location.connectedLocations.length > 0) {
        const connections = location.connectedLocations.map(id => newState.locations[id]?.name || id);
        description += '\n\nExits: ' + connections.join(', ') + '.';
      }
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'observation',
        content: description,
        timestamp: newState.time.tick,
      });
      break;
    }
    
    case 'talk': {
      if (!action.target) {
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: 'Talk to whom? Try: talk [name]',
          timestamp: newState.time.tick,
        });
        break;
      }
      
      const targetName = action.target.toLowerCase();
      const npcsHere = getNPCsAtLocation(newState, newState.player.currentLocation);
      const targetNPC = npcsHere.find(npc => npc.meta.name.toLowerCase().includes(targetName));
      
      if (!targetNPC) {
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: `You don't see anyone named "${action.target}" here.`,
          timestamp: newState.time.tick,
        });
        break;
      }
      
      // Generate dialogue based on NPC personality and relationship
      const relationship = targetNPC.relationships.player || { affection: 0, trust: 0, fear: 0, respect: 0 };
      const greeting = generateNPCGreeting(targetNPC, relationship);
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'dialogue',
        content: `**${targetNPC.meta.name}**: "${greeting}"`,
        timestamp: newState.time.tick,
        involvedNPCs: [targetNPC.id],
      });
      
      // Slightly improve relationship on interaction
      newState.npcs = {
        ...newState.npcs,
        [targetNPC.id]: {
          ...targetNPC,
          relationships: {
            ...targetNPC.relationships,
            player: {
              ...relationship,
              affection: Math.min(100, relationship.affection + 1),
            },
          },
        },
      };
      
      newState = advanceTime(newState, 1);
      break;
    }
    
    case 'go': {
      if (!action.target) {
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: 'Go where? Try: go [location]',
          timestamp: newState.time.tick,
        });
        break;
      }
      
      const currentLoc = getCurrentLocation(newState);
      const targetName = action.target.toLowerCase();
      
      const targetLocId = currentLoc.connectedLocations.find(id => {
        const loc = newState.locations[id];
        return loc && loc.name.toLowerCase().includes(targetName);
      });
      
      if (!targetLocId) {
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: `You can't go to "${action.target}" from here. Available exits: ${currentLoc.connectedLocations.map(id => newState.locations[id]?.name).join(', ')}.`,
          timestamp: newState.time.tick,
        });
        break;
      }
      
      newState.player = { ...newState.player, currentLocation: targetLocId };
      const newLoc = newState.locations[targetLocId];
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'observation',
        content: `You travel to **${newLoc.name}**.\n\n${newLoc.description}`,
        timestamp: newState.time.tick,
      });
      
      newState = advanceTime(newState, 1);
      break;
    }
    
    case 'wait': {
      const hours = action.target ? parseInt(action.target) || 1 : 1;
      const clampedHours = Math.min(Math.max(hours, 1), 12);
      
      newState = advanceTime(newState, clampedHours);
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'system',
        content: `You wait for ${clampedHours} hour${clampedHours > 1 ? 's' : ''}. Time passes...`,
        timestamp: newState.time.tick,
      });
      break;
    }
    
    case 'inventory': {
      const items = newState.player.inventory;
      if (items.length === 0) {
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: 'Your inventory is empty.',
          timestamp: newState.time.tick,
        });
      } else {
        const itemList = items.map(item => `• **${item.name}** - ${item.description}`).join('\n');
        events.push({
          id: `evt_${Date.now()}`,
          type: 'system',
          content: `**Your Inventory:**\n${itemList}`,
          timestamp: newState.time.tick,
        });
      }
      break;
    }
    
    case 'help': {
      events.push({
        id: `evt_${Date.now()}`,
        type: 'system',
        content: `**Available Commands:**
• **look** - Examine your surroundings
• **talk [name]** - Speak with someone
• **go [place]** - Travel to a connected location
• **wait [hours]** - Pass time (1-12 hours)
• **inventory** - Check your belongings
• **help** - Show this message`,
        timestamp: newState.time.tick,
      });
      break;
    }
    
    default: {
      events.push({
        id: `evt_${Date.now()}`,
        type: 'system',
        content: 'Unknown command. Type "help" for available actions.',
        timestamp: newState.time.tick,
      });
    }
  }
  
  // Update location NPC lists
  newState = updateLocationNPCs(newState);
  
  // Add events to history
  newState.events = [...newState.events, ...events];
  
  return { newState, events };
}

function generateNPCGreeting(npc: NPC, relationship: { affection: number; trust: number; fear: number; respect: number }): string {
  const greetings: Record<string, string[]> = {
    npc_martha: [
      relationship.affection > 20 
        ? "Ah, good to see you again, friend. What can I get you?"
        : "Welcome to the Rusty Nail. Mind your manners and pay your tab.",
      "Busy night tonight. Everyone's on edge about something...",
      "Don't cause trouble in my establishment, stranger.",
    ],
    npc_thomas: [
      relationship.trust > 0
        ? "Psst... you looking for something? I might know a thing or two."
        : "What do you want? I'm busy.",
      "Keep your voice down, will you? Walls have ears around here.",
      "*glances around nervously* You didn't see me, got it?",
    ],
    npc_guard_james: [
      "Evening, citizen. Staying out of trouble, I hope?",
      relationship.respect > 20 
        ? "Good to see someone decent around here."
        : "Watch yourself. I've got my eye on everyone.",
      "Quiet night so far. Let's keep it that way.",
    ],
    npc_old_edgar: [
      "Ah, young one! Sit, sit. Let me tell you a tale...",
      "*coughs* These old bones... but my memory is still sharp as ever.",
      "You remind me of someone I knew, long ago. An adventurer, like yourself.",
    ],
  };
  
  const npcGreetings = greetings[npc.id] || ["Hello there."];
  return npcGreetings[Math.floor(Math.random() * npcGreetings.length)];
}

export function parseCommand(input: string): Action {
  const parts = input.toLowerCase().trim().split(/\s+/);
  const command = parts[0];
  const target = parts.slice(1).join(' ');
  
  switch (command) {
    case 'look':
    case 'l':
    case 'examine':
      return { type: 'look', target: target || undefined };
    case 'talk':
    case 'speak':
    case 't':
      return { type: 'talk', target: target || undefined };
    case 'go':
    case 'move':
    case 'walk':
    case 'travel':
      return { type: 'go', target: target || undefined };
    case 'wait':
    case 'w':
    case 'rest':
      return { type: 'wait', target: target || undefined };
    case 'inventory':
    case 'inv':
    case 'i':
      return { type: 'inventory' };
    case 'help':
    case 'h':
    case '?':
      return { type: 'help' };
    default:
      return { type: 'help' };
  }
}
