// Core game types for the Living World RPG Engine

export interface GameTime {
  tick: number;
  hour: number;
  day: number;
  week: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  year: number;
}

export interface Stats {
  health: number;
  energy: number;
  mood: number;
  wealth: number;
}

export interface PlayerStats extends Stats {
  hunger: number;
}

export interface ScheduleEntry {
  location: string;
  activity: string;
}

export interface Memory {
  tick: number;
  event: string;
  sentiment: 'grateful' | 'angry' | 'fearful' | 'curious' | 'neutral' | 'happy' | 'sad';
  target?: string;
  description?: string;
}

export interface Relationship {
  affection: number;
  trust: number;
  fear: number;
  respect: number;
}

export type Trait = 
  | 'kind' | 'greedy' | 'ambitious' | 'fearful' | 'lustful' 
  | 'hardworking' | 'suspicious' | 'protective' | 'gossip'
  | 'brave' | 'cunning' | 'honest' | 'lazy' | 'friendly'
  | 'aggressive' | 'calm' | 'curious' | 'secretive';

export interface NPC {
  id: string;
  name: string;
  age: number;
  occupation: string;
  homeLocation: string;
  description: string;
  stats: Stats;
  traits: Trait[];
  schedule: Record<number, ScheduleEntry>;
  memory: Memory[];
  relationships: Record<string, Relationship>;
  desires: string[];
  secrets: string[];
  currentLocation: string;
  currentActivity: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'consumable' | 'key' | 'valuable' | 'misc';
  value: number;
  properties?: Record<string, any>;
}

export interface Player {
  name: string;
  stats: PlayerStats;
  inventory: Item[];
  reputation: Record<string, number>;
  knownInformation: string[];
  currentLocation: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  connectedLocations: string[];
  npcsPresent: string[];
  items: Item[];
  possibleEvents: string[];
  timeDescriptions?: Record<string, string>;
}

export interface GameEvent {
  id: string;
  type: 'dialogue' | 'discovery' | 'combat' | 'transaction' | 'observation' | 'system';
  content: string;
  timestamp: number;
  involvedNPCs?: string[];
  involvedItems?: string[];
}

export interface GameState {
  time: GameTime;
  player: Player;
  npcs: Record<string, NPC>;
  locations: Record<string, Location>;
  events: GameEvent[];
  flags: Record<string, boolean>;
  eventQueue: GameEvent[];
}

export type ActionType = 'look' | 'talk' | 'go' | 'take' | 'use' | 'wait' | 'inventory' | 'help';

export interface Action {
  type: ActionType;
  target?: string;
  args?: string[];
}
