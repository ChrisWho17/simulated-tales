// Core game types for The Untold Story Engine

import { LifeSimPlayerState } from './lifeSim';

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
  gold: number;
}

export interface ScheduleEntry {
  location: string;
  activity: string;
}

export interface Memory {
  id: string;
  tick: number;
  type: 'witnessed' | 'experienced' | 'heard' | 'caused';
  event: string;
  involvedEntities: string[];
  emotionalImpact: number; // -100 to 100
  sentiment: 'grateful' | 'angry' | 'fearful' | 'curious' | 'neutral' | 'happy' | 'sad';
  reliability: 'certain' | 'probable' | 'uncertain' | 'false';
  decayRate: number;
  sharable: boolean;
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

// ============= NPC CHAIN ARCHITECTURE =============

// IDENTITY CHAIN - Who the NPC believes they are
export interface NPCIdentity {
  selfStory: string; // Who they believe they are
  identityThreat: string; // What threatens their self-image
  restorationBehavior: string; // What they do when identity is threatened
}

// NEEDS CHAIN - Hierarchical needs with satisfaction levels
export interface NPCNeed {
  type: 'survival' | 'stability' | 'status' | 'belonging' | 'meaning';
  satisfaction: number; // 0-100
  priority: number; // Lower = higher priority
  description: string;
}

// THREAT MODEL - How the NPC perceives and responds to danger
export type DefenseType = 'avoidance' | 'appeasement' | 'confrontation' | 'deception';

export interface NPCThreatModel {
  fears: string[];
  detectionTriggers: string[];
  defaultDefense: DefenseType;
}

// SOCIAL RANKING - How the NPC views other entities
export interface SocialRankEntry {
  trust: number; // -100 to 100
  utility: number; // How useful they are
  fear: number; // How afraid of them
  intimacy: number; // Emotional closeness
}

// EMOTIONAL STATE - Multi-layered emotional system
export type EmotionalState = 
  | 'calm' | 'anxious' | 'angry' | 'fearful' | 'happy' 
  | 'sad' | 'hopeful' | 'desperate' | 'numb' | 'vigilant'
  | 'content' | 'bitter' | 'nostalgic' | 'suspicious';

export interface NPCEmotionalState {
  current: EmotionalState; // Moment-to-moment emotion
  baseline: EmotionalState; // Weeks-level default mood
  scarEmotion: EmotionalState; // Years-level trauma anchor
  scarTriggers: string[]; // What activates the scar
}

// KNOWN FACTS - What the NPC knows and how they share it
export type FactReliability = 'witnessed' | 'trusted_source' | 'rumor' | 'assumed' | 'invented';

export interface KnownFact {
  fact: string;
  reliability: FactReliability;
  shareCondition: string; // When they'll share this
}

// META - Original NPC properties (legacy structure preserved)
export interface NPCMeta {
  name: string;
  age: number;
  occupation: string;
  homeLocation: string;
  description: string;
  stats: Stats;
  traits: Trait[];
  schedule: Record<number, ScheduleEntry>;
  desires: string[];
  secrets: string[];
}

// SPEECH SYSTEM TYPES
export type VerbalBudgetTier = 'MICRO' | 'SHORT' | 'NORMAL' | 'LONG' | 'HUGE';
export type TruthStrategy = 'TRANSPARENT' | 'SELECTIVE' | 'PERFORMATIVE' | 'DEFENSIVE' | 'MANIPULATIVE' | 'MYTHIC' | 'INSTITUTIONAL';
export type MotivationVector = 'ACQUIRE' | 'DEFEND' | 'RELIEVE' | 'ASSERT' | 'OBSERVE' | 'ESCAPE';
export type ConflictStyle = 'AVOIDANT' | 'PASSIVE_AGGRESSIVE' | 'NEGOTIATIVE' | 'DOMINANT' | 'MORALISTIC' | 'RESIGNED';
export type EscalationState = 'POLITE_DISTANCE' | 'GUARDED_HONESTY' | 'IRRITATION' | 'DEFENSIVE_JUSTIFICATION' | 'OPEN_HOSTILITY' | 'WITHDRAWAL_OR_CONFRONTATION';

// FULL NPC TYPE - Chain-driven cognitive system
export interface NPC {
  id: string;
  
  // Core identity and personality
  identity: NPCIdentity;
  
  // Hierarchical needs system
  needs: NPCNeed[];
  
  // Threat perception and response
  threatModel: NPCThreatModel;
  
  // Social relationships with trust/utility/fear/intimacy
  socialRanking: Record<string, SocialRankEntry>;
  
  // Multi-layered emotional state
  emotionalState: NPCEmotionalState;
  
  // What this NPC knows
  knownFacts: KnownFact[];
  
  // Legacy/meta information
  meta: NPCMeta;
  
  // Dynamic state
  memory: Memory[];
  relationships: Record<string, Relationship>; // Keep for compatibility
  currentLocation: string;
  currentActivity: string;
  
  // Dynamic speech state (recalculated on interaction)
  currentMotivation?: MotivationVector;
  currentTruthStrategy?: TruthStrategy;
  currentVerbalBudget?: VerbalBudgetTier;
  
  // Conflict system (Prompt 1.5)
  conflictStyle: ConflictStyle;
  escalationState: EscalationState;
  stressLevel: number; // 0-100
  
  // AI-generated portrait
  portrait?: string;
}

// ============= OTHER CORE TYPES =============

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
  npcPortrait?: string; // AI-generated portrait URL for dialogue events
}

export interface WorldEventLog {
  id: string;
  tick: number;
  type: string;
  description: string;
  involvedEntities: string[];
  location: string;
}

export interface GameState {
  time: GameTime;
  player: Player;
  npcs: Record<string, NPC>;
  locations: Record<string, Location>;
  events: GameEvent[];
  flags: Record<string, boolean>;
  eventQueue: GameEvent[];
  worldEvents: WorldEventLog[]; // Off-screen events that happened
  
  // Phase 9: Life Sim State
  lifeSim?: LifeSimPlayerState;
  
  // Extended state from Phase 6-8
  narratorVoice?: 'OBJECTIVE' | 'LITERARY' | 'SARDONIC' | 'UNRELIABLE' | 'OMNISCIENT' | 'NOIR';
  worldEvolution?: {
    economicHealth: number;
    socialStability: number;
    resourceAvailability: Record<string, number>;
  };
  breakpoints?: {
    id: string;
    type: string;
    description: string;
    tick: number;
  }[];
  debugMode?: boolean;
}

export type ActionType = 'look' | 'talk' | 'say' | 'end_conversation' | 'go' | 'take' | 'use' | 'wait' | 'inventory' | 'help' | 'eat' | 'drink' | 'sleep' | 'bathe' | 'status';

export interface Action {
  type: ActionType;
  target?: string;
  args?: string[];
}
