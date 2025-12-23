import { GameState, GameEvent, Action, NPC, GameTime, EscalationState } from '@/types/game';
import { initialTime, initialPlayer, initialNPCs, initialLocations } from './initialData';
import { generateNPCResponseContext, NPCResponseData } from './npcSpeech';

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
      
      // Check for authority presence
      const authorityPresent = npcsHere.some(npc => npc.id === 'npc_guard_james' && npc.id !== targetNPC.id);
      
      // Generate speech context using the new system
      const speechContext = generateNPCResponseContext(targetNPC, {
        playerInput: action.target,
        playerLocation: newState.player.currentLocation,
        presentNPCs: npcsHere.map(n => n.id),
        timeOfDay: getTimePeriod(newState.time.hour),
        recentEvents: newState.events.slice(-3).map(e => e.content),
        playerTrust: targetNPC.socialRanking.player?.trust || 0,
        authorityPresent,
      });
      
      // Generate dialogue based on NPC personality, relationship, and speech context
      const relationship = targetNPC.relationships.player || { affection: 0, trust: 0, fear: 0, respect: 0 };
      const greeting = generateNPCGreeting(targetNPC, relationship, speechContext);
      
      // Build response content with speech metadata
      let dialogueContent = `**${targetNPC.meta.name}**: "${greeting}"`;
      
      // Add subtle cues about NPC state
      if (speechContext.motivation === 'ESCAPE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems eager to end the conversation.*`;
      } else if (speechContext.motivation === 'RELIEVE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems to want to talk.*`;
      } else if (speechContext.truthStrategy === 'DEFENSIVE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems guarded.*`;
      }
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'dialogue',
        content: dialogueContent,
        timestamp: newState.time.tick,
        involvedNPCs: [targetNPC.id],
      });
      
      // Update NPC with current speech state
      const updatedNPC = {
        ...targetNPC,
        currentMotivation: speechContext.motivation,
        currentTruthStrategy: speechContext.truthStrategy,
        currentVerbalBudget: speechContext.verbalBudget,
        relationships: {
          ...targetNPC.relationships,
          player: {
            ...relationship,
            affection: Math.min(100, relationship.affection + 1),
          },
        },
      };
      
      newState.npcs = {
        ...newState.npcs,
        [targetNPC.id]: updatedNPC,
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

function generateNPCGreeting(npc: NPC, relationship: { affection: number; trust: number; fear: number; respect: number }, context?: NPCResponseData): string {
  // Use the speech system to modify greetings
  const budget = context?.verbalBudget || 'NORMAL';
  const motivation = context?.motivation || 'OBSERVE';
  const truthStrategy = context?.truthStrategy || 'SELECTIVE';
  
  // Base greetings by NPC
  const baseGreetings: Record<string, Record<string, string[]>> = {
    npc_martha: {
      ACQUIRE: ["What'll it be? I haven't got all night.", "Looking for something? I might be able to help... for a price."],
      DEFEND: ["Don't start trouble in my establishment.", "I run a clean place here. Remember that."],
      RELIEVE: ["It's been a long day... *sighs* What can I get you?", "You look like you could use a drink. I know I could."],
      OBSERVE: ["Hmm. New face.", "What brings you here?"],
      ASSERT: ["My tavern, my rules. Understand?", "You'll follow my rules or find the door."],
      ESCAPE: ["Can't talk now. Busy.", "*hurries past*"],
    },
    npc_thomas: {
      ACQUIRE: ["Psst... you look like someone with coin. Got a proposition...", "Looking for information? I might know things."],
      DEFEND: ["I didn't do anything. You can't prove nothing.", "*backs away* What do you want?"],
      RELIEVE: ["It's hard, you know? Living like this...", "*looks around nervously* Sometimes I wonder..."],
      OBSERVE: ["...", "*watches silently*"],
      ASSERT: ["I know more than you think.", "Don't underestimate me."],
      ESCAPE: ["Gotta go.", "*eyes dart toward the exit*"],
    },
    npc_guard_james: {
      ACQUIRE: ["Citizen. Seen anything suspicious?", "Keep your eyes open. Report anything unusual."],
      DEFEND: ["I do my job. That's all anyone needs to know.", "Everything's under control here."],
      RELIEVE: ["*stares into his drink* Long day on patrol...", "Sometimes this job... *trails off*"],
      OBSERVE: ["Evening, citizen.", "Quiet tonight."],
      ASSERT: ["I'm watching everyone here. Remember that.", "Law keeps order. Don't forget it."],
      ESCAPE: ["Duty calls.", "*stands abruptly*"],
    },
    npc_old_edgar: {
      ACQUIRE: ["Ah, young one! Perhaps we can help each other...", "I have knowledge. You have... potential."],
      DEFEND: ["I've seen more than you know. Don't test me.", "Age doesn't mean weakness, stranger."],
      RELIEVE: ["Sit, sit. Let me tell you of the old days...", "*coughs* These old bones carry many memories..."],
      OBSERVE: ["Hmm... *peers at you*", "Interesting..."],
      ASSERT: ["Listen well, for I won't repeat myself.", "The young should respect their elders."],
      ESCAPE: ["My bones ache. Another time.", "*waves dismissively*"],
    },
  };
  
  const npcGreetings = baseGreetings[npc.id]?.[motivation] || ["Hello there."];
  let greeting = npcGreetings[Math.floor(Math.random() * npcGreetings.length)];
  
  // Modify by verbal budget
  if (budget === 'MICRO') {
    greeting = greeting.split('.')[0] + '.';
  } else if (budget === 'LONG' || budget === 'HUGE') {
    // Add extra context based on truth strategy
    if (truthStrategy === 'TRANSPARENT' && npc.meta.traits.includes('gossip')) {
      greeting += ` Word is there's trouble brewing in town.`;
    } else if (truthStrategy === 'MYTHIC') {
      greeting += ` In my day, we knew the old ways...`;
    }
  }
  
  // Add stress indicators
  if (npc.stressLevel > 60) {
    greeting = greeting.replace(/\.$/, '... *looks tense*');
  }
  
  return greeting;
}

// Update NPC escalation based on interaction
export function updateNPCEscalation(npc: NPC, delta: number): NPC {
  const escalationLevels: EscalationState[] = [
    'POLITE_DISTANCE',
    'GUARDED_HONESTY', 
    'IRRITATION',
    'DEFENSIVE_JUSTIFICATION',
    'OPEN_HOSTILITY',
    'WITHDRAWAL_OR_CONFRONTATION'
  ];
  
  const currentIndex = escalationLevels.indexOf(npc.escalationState);
  const newIndex = Math.max(0, Math.min(escalationLevels.length - 1, currentIndex + delta));
  
  return {
    ...npc,
    escalationState: escalationLevels[newIndex],
    stressLevel: Math.max(0, Math.min(100, npc.stressLevel + delta * 5)),
  };
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
