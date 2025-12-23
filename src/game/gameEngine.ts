import { GameState, GameEvent, Action, NPC, GameTime, EscalationState } from '@/types/game';
import { initialTime, initialPlayer, initialNPCs, initialLocations } from './initialData';
import { 
  generateNPCResponseContext, 
  NPCResponseData,
  evaluateEscalationTriggers,
  calculateEscalationDelta,
  getEscalationDialoguePrefix,
  updateNPCStress,
  getEscalationModifiers,
  getConflictBehavior,
} from './npcSpeech';
import { worldTick, generateTickSummary, WorldEvent } from './worldSimulation';
import { 
  NarratorContract, 
  generateLocationProse, 
  generateNarrativeSummary, 
  calculatePerceptionFilter,
  buildAIContext 
} from './narratorSystem';
import { checkPlayerDeath, generateDeathNarrative } from './advancedDynamics';
import { calculateSimulationStats } from './metaSystems';
import { initializeLifeSimState, processLifeSimTick } from './lifeSimIntegration';
import { canPerformActionAtLocation, getLocationTags } from './locationRequirements';

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const WEEKS_PER_SEASON = 4;

// Default narrator contract
const defaultNarratorContract: NarratorContract = {
  voice: 'LITERARY',
  maxDetail: 'MODERATE',
  emotionalLeakage: true,
  timeCompression: true,
  unreliabilityLevel: 0,
};

export function createInitialGameState(): GameState {
  return {
    time: { ...initialTime },
    player: { ...initialPlayer },
    npcs: JSON.parse(JSON.stringify(initialNPCs)),
    locations: JSON.parse(JSON.stringify(initialLocations)),
    events: [],
    flags: {},
    eventQueue: [],
    worldEvents: [],
    narratorVoice: 'LITERARY',
    debugMode: false,
    lifeSim: initializeLifeSimState(),
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
  let currentState = { ...state };
  currentState.time = { ...state.time };
  
  for (let i = 0; i < hours; i++) {
    currentState.time.tick++;
    currentState.time.hour++;
    
    if (currentState.time.hour >= HOURS_PER_DAY) {
      currentState.time.hour = 0;
      currentState.time.day++;
      
      if (currentState.time.day > DAYS_PER_WEEK) {
        currentState.time.day = 1;
        currentState.time.week++;
        
        if (currentState.time.week > WEEKS_PER_SEASON) {
          currentState.time.week = 1;
          const seasons: GameTime['season'][] = ['spring', 'summer', 'autumn', 'winter'];
          const currentIdx = seasons.indexOf(currentState.time.season);
          if (currentIdx === 3) {
            currentState.time.season = 'spring';
            currentState.time.year++;
          } else {
            currentState.time.season = seasons[currentIdx + 1];
          }
        }
      }
    }
    
    // Store previous state for breakpoint detection
    const previousState = { ...currentState };
    
    // Run world simulation for each tick (now includes Phase 6-8 systems)
    const tickResult = worldTick(currentState, previousState);
    currentState = tickResult.updatedState;
    
    // Store world events
    const worldEventLogs = tickResult.worldEvents.map(we => ({
      id: we.id,
      tick: we.tick,
      type: we.type,
      description: we.description,
      involvedEntities: we.involvedEntities,
      location: we.location,
    }));
    currentState.worldEvents = [...(currentState.worldEvents || []), ...worldEventLogs];
    
    // Also run basic NPC schedule simulation
    currentState.npcs = simulateNPCs(currentState);
    
    // Phase 9: Process life sim tick
    if (currentState.lifeSim) {
      const lifeSimResult = processLifeSimTick(currentState.lifeSim, 1, []);
      currentState.lifeSim = lifeSimResult.updatedState;
      
      // Sync life sim needs with player stats
      currentState.player = {
        ...currentState.player,
        stats: {
          ...currentState.player.stats,
          hunger: currentState.lifeSim.needs.physical.hunger,
          energy: currentState.lifeSim.needs.physical.energy,
          health: currentState.lifeSim.needs.physical.health,
          mood: 100 - currentState.lifeSim.needs.psychological.stress,
        },
      };
    } else {
      // Fallback: Decay player stats
      currentState.player = {
        ...currentState.player,
        stats: {
          ...currentState.player.stats,
          hunger: Math.max(0, currentState.player.stats.hunger - 2),
          energy: Math.max(0, currentState.player.stats.energy - 1),
        },
      };
    }
    
    // Check for player death (Phase 7)
    const deathState = checkPlayerDeath(currentState);
    if (deathState.isDead) {
      // Player died - this will be handled by the caller
      currentState.flags = { ...currentState.flags, playerDead: true };
    }
  }
  
  return currentState;
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
      
      // Use narrator system for prose generation (Phase 6)
      const narratorContract: NarratorContract = {
        voice: (newState.narratorVoice as any) || 'LITERARY',
        maxDetail: 'MODERATE',
        emotionalLeakage: true,
        timeCompression: true,
        unreliabilityLevel: 0,
      };
      
      const perceptionFilter = calculatePerceptionFilter(newState);
      const proseFragments = generateLocationProse(newState, narratorContract);
      
      let description = proseFragments.map(f => f.text).join(' ');
      description += '\n\n' + location.description;
      if (timeDesc) description += '\n\n' + timeDesc;
      
      // Apply perception filter distortions
      if (perceptionFilter.emotionalBias === 'pessimistic') {
        description = description.replace(/pleasant/g, 'dreary');
        description = description.replace(/warm/g, 'oppressive');
      } else if (perceptionFilter.emotionalBias === 'fearful') {
        description += '\n\n*Every shadow seems to hide a threat.*';
      }
      
      if (npcsHere.length > 0) {
        const npcDescriptions = npcsHere.map(npc => {
          let desc = `**${npc.meta.name}** (${npc.currentActivity})`;
          // Add stress/emotion indicators based on narrator voice
          if (narratorContract.voice === 'LITERARY' && npc.stressLevel > 50) {
            desc += ' — tension visible in their posture';
          } else if (narratorContract.voice === 'NOIR' && npc.stressLevel > 50) {
            desc += ' — trouble written all over them';
          }
          return desc;
        });
        description += '\n\nPresent: ' + npcDescriptions.join(', ') + '.';
      }
      
      if (location.connectedLocations.length > 0) {
        const connections = location.connectedLocations.map(id => newState.locations[id]?.name || id);
        description += '\n\nExits: ' + connections.join(', ') + '.';
      }
      
      // Add simulation depth if debug mode
      if (newState.debugMode) {
        const stats = calculateSimulationStats(newState);
        description += `\n\n*[DEBUG: ${stats.activeNPCs} NPCs active, ${stats.totalMemories} memories, ${stats.averageNPCStress}% avg stress]*`;
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
      
      // Evaluate escalation triggers from player input
      const escalationTriggers = evaluateEscalationTriggers(targetNPC, action.args?.join(' ') || action.target, {
        recentEvents: newState.events.slice(-5).map(e => e.content),
        timeSinceLastConflict: 0, // TODO: track this properly
      });
      
      // Calculate escalation changes
      const escalationDelta = calculateEscalationDelta(targetNPC, escalationTriggers);
      const newStressLevel = updateNPCStress(targetNPC, escalationTriggers);
      
      // Update escalation state
      const escalationLevels: EscalationState[] = [
        'POLITE_DISTANCE', 'GUARDED_HONESTY', 'IRRITATION', 
        'DEFENSIVE_JUSTIFICATION', 'OPEN_HOSTILITY', 'WITHDRAWAL_OR_CONFRONTATION'
      ];
      const currentEscIndex = escalationLevels.indexOf(targetNPC.escalationState);
      const newEscIndex = Math.max(0, Math.min(escalationLevels.length - 1, currentEscIndex + escalationDelta));
      const newEscalationState = escalationLevels[newEscIndex];
      
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
      
      // Get escalation prefix for dialogue
      const escalationPrefix = getEscalationDialoguePrefix(newEscalationState, targetNPC.conflictStyle);
      const escalationMods = getEscalationModifiers(newEscalationState);
      
      // Build response content with speech metadata and escalation
      let dialogueContent = `**${targetNPC.meta.name}**: ${escalationPrefix}"${greeting}"`;
      
      // Add subtle cues about NPC state based on escalation
      if (newEscalationState === 'WITHDRAWAL_OR_CONFRONTATION') {
        const conflictBehavior = getConflictBehavior(targetNPC.conflictStyle);
        if (targetNPC.conflictStyle === 'AVOIDANT' || targetNPC.conflictStyle === 'RESIGNED') {
          dialogueContent += `\n\n*${targetNPC.meta.name} turns away, ending the conversation.*`;
        } else {
          dialogueContent += `\n\n*${targetNPC.meta.name} looks ready for a confrontation.*`;
        }
      } else if (newEscalationState === 'OPEN_HOSTILITY') {
        dialogueContent += `\n\n*${targetNPC.meta.name} is clearly hostile. Tread carefully.*`;
      } else if (newEscalationState === 'IRRITATION') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems irritated.*`;
      } else if (speechContext.motivation === 'ESCAPE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems eager to end the conversation.*`;
      } else if (speechContext.motivation === 'RELIEVE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems to want to talk.*`;
      } else if (speechContext.truthStrategy === 'DEFENSIVE') {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems guarded.*`;
      }
      
      // Show escalation change if significant
      if (escalationDelta > 0 && newEscIndex > currentEscIndex) {
        dialogueContent += `\n\n*The tension between you increases.*`;
      } else if (escalationDelta < 0 && newEscIndex < currentEscIndex) {
        dialogueContent += `\n\n*${targetNPC.meta.name} seems to relax slightly.*`;
      }
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'dialogue',
        content: dialogueContent,
        timestamp: newState.time.tick,
        involvedNPCs: [targetNPC.id],
      });
      
      // Update NPC with current speech state and escalation
      const updatedNPC: NPC = {
        ...targetNPC,
        currentMotivation: speechContext.motivation,
        currentTruthStrategy: speechContext.truthStrategy,
        currentVerbalBudget: speechContext.verbalBudget,
        escalationState: newEscalationState,
        stressLevel: newStressLevel,
        relationships: {
          ...targetNPC.relationships,
          player: {
            ...relationship,
            affection: Math.min(100, relationship.affection + (escalationDelta >= 0 ? 1 : -1)),
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
      
      const preWaitEventCount = newState.worldEvents?.length || 0;
      newState = advanceTime(newState, clampedHours);
      
      // Get events that happened during the wait
      const newWorldEvents = (newState.worldEvents || []).slice(preWaitEventCount);
      const visibleEvents = newWorldEvents.filter(e => 
        e.location === newState.player.currentLocation || 
        e.type === 'environmental'
      );
      
      let waitSummary = `You wait for ${clampedHours} hour${clampedHours > 1 ? 's' : ''}. Time passes...`;
      
      if (visibleEvents.length > 0) {
        waitSummary += '\n\n**While you waited:**';
        visibleEvents.slice(0, 3).forEach(evt => {
          waitSummary += `\n• ${evt.description}`;
        });
      }
      
      events.push({
        id: `evt_${Date.now()}`,
        type: 'system',
        content: waitSummary,
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
    
    case 'eat': {
      if (!newState.lifeSim) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'Life sim not initialized.', timestamp: newState.time.tick });
        break;
      }
      // Check location requirement
      const eatLocationCheck = canPerformActionAtLocation('eat', newState.player.currentLocation, getLocationTags(newState.player.currentLocation));
      if (!eatLocationCheck.allowed) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: eatLocationCheck.errorMessage || 'You cannot eat here.', timestamp: newState.time.tick });
        break;
      }
      const currentHunger = newState.lifeSim.needs.physical.hunger;
      if (currentHunger >= 90) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'You are not hungry right now.', timestamp: newState.time.tick });
        break;
      }
      const hungerRestored = Math.min(100 - currentHunger, 40);
      newState.lifeSim = {
        ...newState.lifeSim,
        needs: { ...newState.lifeSim.needs, physical: { ...newState.lifeSim.needs.physical, hunger: currentHunger + hungerRestored } },
      };
      newState.player = { ...newState.player, stats: { ...newState.player.stats, hunger: newState.lifeSim.needs.physical.hunger } };
      newState = advanceTime(newState, 1);
      const mealDesc = currentHunger < 30 ? 'You eat ravenously, barely tasting the food.' : 'You enjoy a satisfying meal.';
      events.push({ id: `evt_${Date.now()}`, type: 'observation', content: `${mealDesc}\n\n*Hunger restored by ${hungerRestored}. An hour passes.*`, timestamp: newState.time.tick });
      break;
    }
    
    case 'drink': {
      if (!newState.lifeSim) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'Life sim not initialized.', timestamp: newState.time.tick });
        break;
      }
      // Check location requirement
      const drinkLocationCheck = canPerformActionAtLocation('drink', newState.player.currentLocation, getLocationTags(newState.player.currentLocation));
      if (!drinkLocationCheck.allowed) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: drinkLocationCheck.errorMessage || 'You cannot drink here.', timestamp: newState.time.tick });
        break;
      }
      const currentThirst = newState.lifeSim.needs.physical.thirst;
      if (currentThirst >= 90) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'You are not thirsty right now.', timestamp: newState.time.tick });
        break;
      }
      const thirstRestored = Math.min(100 - currentThirst, 50);
      newState.lifeSim = {
        ...newState.lifeSim,
        needs: { ...newState.lifeSim.needs, physical: { ...newState.lifeSim.needs.physical, thirst: currentThirst + thirstRestored } },
      };
      newState = advanceTime(newState, 1);
      const drinkDesc = currentThirst < 30 ? 'You drink deeply, the water soothing your parched throat.' : 'You take a refreshing drink.';
      events.push({ id: `evt_${Date.now()}`, type: 'observation', content: `${drinkDesc}\n\n*Thirst restored by ${thirstRestored}. An hour passes.*`, timestamp: newState.time.tick });
      break;
    }
    
    case 'sleep': {
      if (!newState.lifeSim) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'Life sim not initialized.', timestamp: newState.time.tick });
        break;
      }
      // Check location requirement
      const sleepLocationCheck = canPerformActionAtLocation('sleep', newState.player.currentLocation, getLocationTags(newState.player.currentLocation));
      if (!sleepLocationCheck.allowed) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: sleepLocationCheck.errorMessage || 'You cannot sleep here.', timestamp: newState.time.tick });
        break;
      }
      const currentEnergy = newState.lifeSim.needs.physical.energy;
      if (currentEnergy >= 90) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'You are not tired enough to sleep.', timestamp: newState.time.tick });
        break;
      }
      const sleepHours = action.target ? Math.min(Math.max(parseInt(action.target) || 6, 1), 12) : 6;
      const energyPerHour = 15;
      const energyRestored = Math.min(100 - currentEnergy, sleepHours * energyPerHour);
      const stressReduced = Math.min(newState.lifeSim.needs.psychological.stress, sleepHours * 5);
      newState.lifeSim = {
        ...newState.lifeSim,
        needs: {
          ...newState.lifeSim.needs,
          physical: { ...newState.lifeSim.needs.physical, energy: currentEnergy + energyRestored },
          psychological: { ...newState.lifeSim.needs.psychological, stress: newState.lifeSim.needs.psychological.stress - stressReduced },
        },
      };
      newState.player = { ...newState.player, stats: { ...newState.player.stats, energy: newState.lifeSim.needs.physical.energy, mood: 100 - newState.lifeSim.needs.psychological.stress } };
      newState = advanceTime(newState, sleepHours);
      const sleepDesc = currentEnergy < 30 ? 'You collapse into a deep, exhausted sleep.' : 'You rest peacefully.';
      events.push({ id: `evt_${Date.now()}`, type: 'observation', content: `${sleepDesc}\n\n*You sleep for ${sleepHours} hours. Energy restored by ${energyRestored}. Stress reduced by ${stressReduced}.*`, timestamp: newState.time.tick });
      break;
    }
    
    case 'bathe': {
      if (!newState.lifeSim) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'Life sim not initialized.', timestamp: newState.time.tick });
        break;
      }
      // Check location requirement
      const batheLocationCheck = canPerformActionAtLocation('bathe', newState.player.currentLocation, getLocationTags(newState.player.currentLocation));
      if (!batheLocationCheck.allowed) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: batheLocationCheck.errorMessage || 'You cannot bathe here.', timestamp: newState.time.tick });
        break;
      }
      const currentHygiene = newState.lifeSim.needs.physical.hygiene;
      if (currentHygiene >= 90) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'You are already clean.', timestamp: newState.time.tick });
        break;
      }
      const hygieneRestored = Math.min(100 - currentHygiene, 60);
      const comfortGain = Math.min(100 - newState.lifeSim.needs.psychological.comfort, 20);
      newState.lifeSim = {
        ...newState.lifeSim,
        needs: {
          ...newState.lifeSim.needs,
          physical: { ...newState.lifeSim.needs.physical, hygiene: currentHygiene + hygieneRestored },
          psychological: { ...newState.lifeSim.needs.psychological, comfort: newState.lifeSim.needs.psychological.comfort + comfortGain },
        },
        body: { ...newState.lifeSim.body, cleanliness: Math.min(100, newState.lifeSim.body.cleanliness + hygieneRestored) },
      };
      newState = advanceTime(newState, 1);
      const bathDesc = currentHygiene < 30 ? 'You scrub away the grime, feeling human again.' : 'The warm water relaxes your muscles.';
      events.push({ id: `evt_${Date.now()}`, type: 'observation', content: `${bathDesc}\n\n*Hygiene restored by ${hygieneRestored}. Comfort increased by ${comfortGain}. An hour passes.*`, timestamp: newState.time.tick });
      break;
    }
    
    case 'status': {
      if (!newState.lifeSim) {
        events.push({ id: `evt_${Date.now()}`, type: 'system', content: 'Life sim not initialized.', timestamp: newState.time.tick });
        break;
      }
      const { physical, psychological } = newState.lifeSim.needs;
      const statusContent = `**Your Condition:**

**Physical:**
• Health: ${physical.health}/100
• Energy: ${physical.energy}/100
• Hunger: ${physical.hunger}/100
• Thirst: ${physical.thirst}/100
• Hygiene: ${physical.hygiene}/100
• Bladder: ${physical.bladder}/100

**Psychological:**
• Stress: ${psychological.stress}/100
• Tension: ${psychological.tension}/100
• Comfort: ${psychological.comfort}/100
• Social: ${psychological.social}/100
• Fulfillment: ${psychological.fulfillment}/100`;
      events.push({ id: `evt_${Date.now()}`, type: 'system', content: statusContent, timestamp: newState.time.tick });
      break;
    }
    
    case 'help': {
      let helpContent = `**Available Commands:**
• **look** - Examine your surroundings
• **talk [name]** - Speak with someone
• **go [place]** - Travel to a connected location
• **wait [hours]** - Pass time (1-12 hours)
• **inventory** - Check your belongings

**Life Sim:**
• **eat** - Consume food to restore hunger
• **drink** - Drink to restore thirst
• **sleep [hours]** - Rest to restore energy (default: 6 hours)
• **bathe** - Clean yourself to restore hygiene
• **status** - View your physical and psychological condition

• **help** - Show this message`;

      if (newState.debugMode) {
        helpContent += `\n\n**Debug Commands:**
• **debug** - Toggle debug mode
• **time [hour]** - Set time of day
• **health/energy/mood/hunger [value]** - Set player stat
• **tp [location]** - Teleport to location`;
      }

      events.push({
        id: `evt_${Date.now()}`,
        type: 'system',
        content: helpContent,
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

export function parseCommand(input: string): Action & { debug?: string } {
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
    // Life sim commands
    case 'eat':
    case 'food':
      return { type: 'eat', target: target || undefined };
    case 'drink':
    case 'water':
      return { type: 'drink', target: target || undefined };
    case 'sleep':
    case 'nap':
      return { type: 'sleep', target: target || undefined };
    case 'bathe':
    case 'wash':
    case 'shower':
    case 'clean':
      return { type: 'bathe', target: target || undefined };
    case 'status':
    case 'needs':
    case 'condition':
      return { type: 'status' };
    // Debug commands
    case 'debug':
      return { type: 'help', debug: 'toggle' };
    case 'time':
    case 'health':
    case 'energy':
    case 'mood':
    case 'hunger':
    case 'tp':
    case 'teleport':
      return { type: 'help', debug: `${command} ${target}` };
    default:
      return { type: 'help' };
  }
}

// Process debug commands
export function processDebugCommand(state: GameState, debugCmd: string): { newState: GameState; message: string } {
  const parts = debugCmd.split(' ');
  const cmd = parts[0];
  const value = parts[1];
  
  let newState = { ...state };
  let message = '';
  
  switch (cmd) {
    case 'toggle':
      newState.debugMode = !newState.debugMode;
      message = `Debug mode ${newState.debugMode ? 'enabled' : 'disabled'}`;
      break;
    case 'time':
      const hour = parseInt(value) || 12;
      newState.time = { ...newState.time, hour: Math.max(0, Math.min(23, hour)) };
      message = `Time set to ${hour}:00`;
      break;
    case 'health':
    case 'energy':
    case 'mood':
    case 'hunger':
      const statValue = parseInt(value) || 100;
      newState.player = {
        ...newState.player,
        stats: { ...newState.player.stats, [cmd]: Math.max(0, Math.min(100, statValue)) },
      };
      message = `${cmd} set to ${statValue}`;
      break;
    case 'tp':
    case 'teleport':
      const locId = Object.keys(newState.locations).find(id => 
        id.includes(value) || newState.locations[id].name.toLowerCase().includes(value)
      );
      if (locId) {
        newState.player = { ...newState.player, currentLocation: locId };
        message = `Teleported to ${newState.locations[locId].name}`;
      } else {
        message = `Location not found: ${value}`;
      }
      break;
    default:
      message = `Unknown debug command: ${cmd}`;
  }
  
  return { newState, message };
}

// Toggle narrator voice
export function setNarratorVoice(state: GameState, voice: GameState['narratorVoice']): GameState {
  return { ...state, narratorVoice: voice };
}
