// ============================================================================
// LIVING WORLD ENGINE - Universal Systems
// "The world doesn't revolve around you. Make it."
// ============================================================================

export { PropertySystem } from './propertySystem';
export type {
  WorldProperty,
  PropertyTemplate,
  PropertyTenant,
  PropertyThreat,
  PropertyEvent,
  PropertyType,
  PropertyUse,
  ConditionState,
  ThreatType,
  AcquireMethod
} from './propertySystem';

export { RivalSystem } from './rivalSystem';
export type {
  WorldRival,
  RivalryState,
  RivalMove,
  RivalEvent,
  RivalType,
  DispositionLevel,
  RivalPersonality,
  RivalResources,
  ActiveConflict,
  Truce
} from './rivalSystem';

export { FactionSystem } from './factionSystem';
export type {
  WorldFaction,
  PlayerFactionStanding,
  FactionEvent,
  FactionType,
  FactionRelation,
  ReputationTier,
  FactionPower,
  FactionValues,
  FactionMemory
} from './factionSystem';

export { LivingWorldEngine, buildLivingWorldContext } from './livingWorldEngine';
export type { LivingWorldState } from './livingWorldEngine';
