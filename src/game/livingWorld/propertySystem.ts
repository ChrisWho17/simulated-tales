// ============================================================================
// PROPERTY SYSTEM - Deep ownership, tenants, condition, threats
// Properties live, decay, attract, and repel
// ============================================================================

export type PropertyType = 'residential' | 'residential_multi' | 'commercial' | 'industrial' | 'entertainment' | 'land';

export type PropertyUse = 
  | 'residential' | 'stash' | 'safehouse' | 'grow_op' | 'mixed'
  | 'retail' | 'front' | 'legitimate' | 'storage' | 'chop_shop'
  | 'distribution' | 'manufacturing' | 'office' | 'club'
  | 'development' | 'parking' | 'dumping';

export type ConditionState = 'pristine' | 'good' | 'fair' | 'poor' | 'condemned';
export type ThreatType = 'debt' | 'rival' | 'legal' | 'fire' | 'robbery' | 'foreclosure';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AcquireMethod = 'bought' | 'inherited' | 'won' | 'stolen' | 'squatted' | 'gifted';

export interface PropertyTemplate {
  type: PropertyType;
  baseValue: number;
  maxTenants: number;
  maintenanceCost: number;
  possibleUses: PropertyUse[];
}

export interface PropertyTenant {
  id: string;
  npcId?: string;
  name: string;
  rentAmount: number;
  satisfaction: number;
  moveInDate: number;
  lastPayment: number;
  missedPayments: number;
  issues: Array<{ type: string; date: number }>;
  traits: string[];
}

export interface PropertyThreat {
  id: string;
  type: ThreatType;
  severity: ThreatSeverity;
  source?: string;
  description: string;
  deadline?: number;
  created: number;
  resolved: boolean;
  resolution?: string;
  resolvedDate?: number;
}

export interface PropertyViolation {
  id: string;
  type: string;
  description: string;
  fine: number;
  deadline: number;
  created: number;
}

export interface PropertyUpgrade {
  type: string;
  name: string;
  level: number;
  installedDate: number;
  lastUpgrade: number;
}

export interface PropertyReputation {
  safety: number;
  desirability: number;
  notoriety: number;
  history: Array<{
    type: string;
    description: string;
    date: number;
    witnesses: string[];
    publicKnowledge: boolean;
  }>;
}

export interface PropertyMortgage {
  amount: number;
  monthlyPayment: number;
  remainingMonths: number;
  lender: string;
  missedPayments: number;
}

export interface WorldProperty {
  id: string;
  name: string;
  template: string;
  type: PropertyType;
  address?: string;
  
  // Ownership
  owner: string | null;
  previousOwners: Array<{
    owner: string;
    from: number;
    to: number;
    method: string;
  }>;
  acquiredMethod: AcquireMethod | null;
  acquiredDate: number | null;
  mortgage: PropertyMortgage | null;
  
  // Value
  baseValue: number;
  currentValue: number;
  valueModifiers: Array<{ reason: string; multiplier: number; expiry?: number }>;
  
  // Condition
  condition: number;
  conditionState: ConditionState;
  lastMaintenance: number | null;
  maintenanceCost: number;
  
  // Use
  currentUse: PropertyUse;
  possibleUses: PropertyUse[];
  illicitUse: PropertyUse | null;
  businessId: string | null;
  
  // Tenants
  maxTenants: number;
  tenants: PropertyTenant[];
  
  // Reputation
  reputation: PropertyReputation;
  
  // Upgrades
  upgrades: PropertyUpgrade[];
  possibleUpgrades: string[];
  
  // Threats
  threats: PropertyThreat[];
  violations: PropertyViolation[];
  
  // State
  isContested: boolean;
  contestedBy: string | null;
  isForSale: boolean;
  listingPrice: number;
  
  // Meta
  created: number;
  lastUpdate: number;
  flags: Set<string>;
}

export interface PropertySystemState {
  properties: Map<string, WorldProperty>;
  playerProperties: Set<string>;
}

export type PropertyEvent = 
  | { type: 'ownership_transferred'; propertyId: string; previousOwner: string | null; newOwner: string | null; method: string; details?: Record<string, unknown> }
  | { type: 'condition_changed'; propertyId: string; oldState: ConditionState; newState: ConditionState; condition: number }
  | { type: 'maintenance_performed'; propertyId: string; maintenanceType: string; cost: number; newCondition: number }
  | { type: 'tenant_added'; propertyId: string; tenant: PropertyTenant }
  | { type: 'tenant_removed'; propertyId: string; tenant: PropertyTenant; reason: string }
  | { type: 'tenant_complaint'; propertyId: string; tenant: PropertyTenant; reason: string }
  | { type: 'tenant_issue'; propertyId: string; tenant: PropertyTenant; issue: string }
  | { type: 'rent_collected'; propertyId: string; total: number; results: Array<{ tenant: string; paid: boolean; amount?: number; missedPayments?: number }> }
  | { type: 'threat_added'; propertyId: string; threat: PropertyThreat }
  | { type: 'threat_resolved'; propertyId: string; threat: PropertyThreat; resolution: string }
  | { type: 'threat_deadline_passed'; propertyId: string; threat: PropertyThreat }
  | { type: 'violation_added'; propertyId: string; violation: PropertyViolation }
  | { type: 'mortgage_due'; propertyId: string; amount: number };

// ============================================================================
// PROPERTY TEMPLATES
// ============================================================================

const PROPERTY_TEMPLATES: Record<string, PropertyTemplate> = {
  apartment: {
    type: 'residential',
    baseValue: 50000,
    maxTenants: 1,
    maintenanceCost: 200,
    possibleUses: ['residential', 'stash', 'safehouse']
  },
  house: {
    type: 'residential',
    baseValue: 150000,
    maxTenants: 1,
    maintenanceCost: 500,
    possibleUses: ['residential', 'stash', 'safehouse', 'grow_op']
  },
  apartment_building: {
    type: 'residential_multi',
    baseValue: 500000,
    maxTenants: 8,
    maintenanceCost: 2000,
    possibleUses: ['residential', 'mixed']
  },
  storefront: {
    type: 'commercial',
    baseValue: 200000,
    maxTenants: 1,
    maintenanceCost: 800,
    possibleUses: ['retail', 'front', 'legitimate']
  },
  warehouse: {
    type: 'industrial',
    baseValue: 300000,
    maxTenants: 0,
    maintenanceCost: 600,
    possibleUses: ['storage', 'chop_shop', 'distribution', 'manufacturing']
  },
  office_space: {
    type: 'commercial',
    baseValue: 250000,
    maxTenants: 1,
    maintenanceCost: 700,
    possibleUses: ['office', 'front', 'legitimate']
  },
  nightclub: {
    type: 'entertainment',
    baseValue: 400000,
    maxTenants: 0,
    maintenanceCost: 1500,
    possibleUses: ['club', 'front', 'distribution']
  },
  vacant_lot: {
    type: 'land',
    baseValue: 75000,
    maxTenants: 0,
    maintenanceCost: 100,
    possibleUses: ['development', 'parking', 'dumping']
  }
};

const UPGRADE_DEFINITIONS: Record<string, {
  name: string;
  maxLevel: number;
  baseCost: number;
  effects: {
    condition?: number;
    safety?: number;
    desirability?: number;
    notoriety?: number;
    maxTenants?: number;
    baseValue?: number;
  };
}> = {
  security: {
    name: 'Security System',
    maxLevel: 3,
    baseCost: 2000,
    effects: { safety: 10, notoriety: -5 }
  },
  renovation: {
    name: 'Renovation',
    maxLevel: 3,
    baseCost: 5000,
    effects: { condition: 20, desirability: 10 }
  },
  expansion: {
    name: 'Expansion',
    maxLevel: 2,
    baseCost: 20000,
    effects: { maxTenants: 1, baseValue: 0.1 }
  },
  hidden_room: {
    name: 'Hidden Room',
    maxLevel: 1,
    baseCost: 10000,
    effects: {}
  },
  reinforced: {
    name: 'Reinforced Structure',
    maxLevel: 2,
    baseCost: 8000,
    effects: { safety: 5 }
  }
};

const REPUTATION_EFFECTS: Record<string, { safety?: number; desirability?: number; notoriety?: number }> = {
  murder: { safety: -30, notoriety: 40 },
  robbery: { safety: -20, notoriety: 20 },
  fight: { safety: -10, notoriety: 10 },
  fire: { safety: -15, desirability: -20 },
  party: { notoriety: 5, desirability: -5 },
  renovation: { desirability: 15 },
  charity: { desirability: 10, safety: 5 },
  arrest: { notoriety: 15, desirability: -10 }
};

// ============================================================================
// PROPERTY SYSTEM
// ============================================================================

class PropertySystemClass {
  private properties: Map<string, WorldProperty> = new Map();
  private playerProperties: Set<string> = new Set();
  private listeners: Array<(event: PropertyEvent) => void> = [];

  // ========== PROPERTY CREATION ==========
  
  createProperty(data: Partial<WorldProperty> & { name: string; template?: string }): WorldProperty {
    const template = PROPERTY_TEMPLATES[data.template || 'apartment'] || PROPERTY_TEMPLATES.apartment;
    
    const property: WorldProperty = {
      id: data.id || `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      template: data.template || 'apartment',
      type: template.type,
      address: data.address || undefined,
      
      owner: data.owner || null,
      previousOwners: [],
      acquiredMethod: null,
      acquiredDate: null,
      mortgage: null,
      
      baseValue: data.baseValue || template.baseValue,
      currentValue: data.currentValue || template.baseValue,
      valueModifiers: [],
      
      condition: data.condition ?? 80,
      conditionState: 'good',
      lastMaintenance: null,
      maintenanceCost: template.maintenanceCost,
      
      currentUse: data.currentUse || template.possibleUses[0],
      possibleUses: [...template.possibleUses],
      illicitUse: null,
      businessId: null,
      
      maxTenants: template.maxTenants,
      tenants: [],
      
      reputation: {
        safety: 50,
        desirability: 50,
        notoriety: 0,
        history: []
      },
      
      upgrades: [],
      possibleUpgrades: ['security', 'renovation', 'expansion', 'hidden_room', 'reinforced'],
      
      threats: [],
      violations: [],
      
      isContested: false,
      contestedBy: null,
      isForSale: data.isForSale ?? true,
      listingPrice: data.listingPrice || template.baseValue,
      
      created: Date.now(),
      lastUpdate: Date.now(),
      flags: new Set(data.flags || [])
    };

    this.updateConditionState(property);
    this.properties.set(property.id, property);
    
    return property;
  }

  // ========== OWNERSHIP ==========

  transferOwnership(
    propertyId: string, 
    newOwner: string | null, 
    method: string, 
    details: Record<string, unknown> = {}
  ): { success: boolean; reason?: string; property?: WorldProperty } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, reason: 'Property not found' };

    const previousOwner = property.owner;

    if (previousOwner) {
      property.previousOwners.push({
        owner: previousOwner,
        from: property.acquiredDate || property.created,
        to: Date.now(),
        method: property.acquiredMethod || 'unknown'
      });
    }

    if (previousOwner === 'player') {
      this.playerProperties.delete(propertyId);
    }
    if (newOwner === 'player') {
      this.playerProperties.add(propertyId);
    }

    property.owner = newOwner;
    property.acquiredMethod = method as AcquireMethod;
    property.acquiredDate = Date.now();
    property.lastUpdate = Date.now();

    if (method === 'bought' && details.mortgage) {
      const mortgage = details.mortgage as { amount: number; monthlyPayment: number; term: number; lender?: string };
      property.mortgage = {
        amount: mortgage.amount,
        monthlyPayment: mortgage.monthlyPayment,
        remainingMonths: mortgage.term,
        lender: mortgage.lender || 'bank',
        missedPayments: 0
      };
    }

    if (method === 'bought' || method === 'stolen') {
      property.isForSale = false;
    }

    this.notify({
      type: 'ownership_transferred',
      propertyId,
      previousOwner,
      newOwner,
      method,
      details
    });

    return { success: true, property };
  }

  playerAcquire(propertyId: string, method: AcquireMethod, details: Record<string, unknown> = {}) {
    return this.transferOwnership(propertyId, 'player', method, details);
  }

  playerLose(propertyId: string, reason: string, newOwner: string | null = null) {
    const property = this.properties.get(propertyId);
    if (!property || property.owner !== 'player') {
      return { success: false, reason: 'Not player owned' };
    }
    return this.transferOwnership(propertyId, newOwner, reason);
  }

  // ========== CONDITION & MAINTENANCE ==========

  private updateConditionState(property: WorldProperty): void {
    if (property.condition >= 90) property.conditionState = 'pristine';
    else if (property.condition >= 70) property.conditionState = 'good';
    else if (property.condition >= 50) property.conditionState = 'fair';
    else if (property.condition >= 25) property.conditionState = 'poor';
    else property.conditionState = 'condemned';
  }

  degradeCondition(propertyId: string, amount: number = 1): void {
    const property = this.properties.get(propertyId);
    if (!property) return;

    const oldState = property.conditionState;
    property.condition = Math.max(0, property.condition - amount);
    this.updateConditionState(property);
    this.recalculateValue(propertyId);

    if (oldState !== property.conditionState) {
      this.notify({
        type: 'condition_changed',
        propertyId,
        oldState,
        newState: property.conditionState,
        condition: property.condition
      });
    }

    if (property.condition < 30 && Math.random() < 0.1) {
      this.addViolation(propertyId, 'code_violation', 'Building code violation');
    }
  }

  performMaintenance(
    propertyId: string, 
    type: 'basic' | 'standard' | 'full' | 'renovation' = 'basic'
  ): { success: boolean; reason?: string; cost?: number; newCondition?: number } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, reason: 'Property not found' };

    const costs: Record<string, { cost: number; restoration: number }> = {
      basic: { cost: property.maintenanceCost, restoration: 10 },
      standard: { cost: property.maintenanceCost * 2, restoration: 25 },
      full: { cost: property.maintenanceCost * 5, restoration: 50 },
      renovation: { cost: property.baseValue * 0.1, restoration: 100 }
    };

    const maintenance = costs[type] || costs.basic;

    property.condition = Math.min(100, property.condition + maintenance.restoration);
    property.lastMaintenance = Date.now();
    this.updateConditionState(property);
    this.recalculateValue(propertyId);

    this.notify({
      type: 'maintenance_performed',
      propertyId,
      maintenanceType: type,
      cost: maintenance.cost,
      newCondition: property.condition
    });

    return {
      success: true,
      cost: maintenance.cost,
      newCondition: property.condition
    };
  }

  // ========== VALUE ==========

  recalculateValue(propertyId: string): void {
    const property = this.properties.get(propertyId);
    if (!property) return;

    let value = property.baseValue;

    // Condition modifier
    const conditionMod = 0.25 + (property.condition / 100) * 0.75;
    value *= conditionMod;

    // Reputation modifiers
    value *= 0.8 + (property.reputation.desirability / 100) * 0.4;
    value *= 1 - (property.reputation.notoriety / 100) * 0.3;

    // Upgrades add value
    for (const upgrade of property.upgrades) {
      value *= 1 + (upgrade.level * 0.05);
    }

    // Temporary modifiers
    const now = Date.now();
    property.valueModifiers = property.valueModifiers.filter(m => !m.expiry || m.expiry > now);
    for (const mod of property.valueModifiers) {
      value *= mod.multiplier;
    }

    // Threats reduce value
    if (property.threats.length > 0) {
      value *= 0.9 - (property.threats.length * 0.05);
    }

    property.currentValue = Math.round(value);
    property.lastUpdate = Date.now();
  }

  // ========== TENANTS ==========

  addTenant(propertyId: string, tenantData: Partial<PropertyTenant> & { name: string }): { success: boolean; reason?: string; tenant?: PropertyTenant } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, reason: 'Property not found' };
    if (property.tenants.length >= property.maxTenants) {
      return { success: false, reason: 'Property full' };
    }

    const tenant: PropertyTenant = {
      id: tenantData.id || `tenant_${Date.now()}`,
      npcId: tenantData.npcId,
      name: tenantData.name,
      rentAmount: tenantData.rentAmount || 500,
      satisfaction: tenantData.satisfaction ?? 70,
      moveInDate: Date.now(),
      lastPayment: Date.now(),
      missedPayments: 0,
      issues: [],
      traits: tenantData.traits || []
    };

    property.tenants.push(tenant);

    this.notify({
      type: 'tenant_added',
      propertyId,
      tenant
    });

    return { success: true, tenant };
  }

  removeTenant(propertyId: string, tenantId: string, reason: string = 'left'): { success: boolean; reason?: string; tenant?: PropertyTenant } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, reason: 'Property not found' };

    const idx = property.tenants.findIndex(t => t.id === tenantId);
    if (idx === -1) return { success: false, reason: 'Tenant not found' };

    const tenant = property.tenants.splice(idx, 1)[0];

    this.notify({
      type: 'tenant_removed',
      propertyId,
      tenant,
      reason
    });

    return { success: true, tenant };
  }

  updateTenantSatisfaction(propertyId: string, tenantId: string, delta: number, reason: string): void {
    const property = this.properties.get(propertyId);
    if (!property) return;

    const tenant = property.tenants.find(t => t.id === tenantId);
    if (!tenant) return;

    tenant.satisfaction = Math.max(0, Math.min(100, tenant.satisfaction + delta));

    if (tenant.satisfaction < 20) {
      tenant.issues.push({ type: 'considering_leaving', date: Date.now() });
    }

    if (tenant.satisfaction < 30 && Math.random() < 0.1) {
      this.notify({
        type: 'tenant_complaint',
        propertyId,
        tenant,
        reason
      });
    }
  }

  collectRent(propertyId: string): { success: boolean; total: number; results: Array<{ tenant: string; paid: boolean; amount?: number; missedPayments?: number }> } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, total: 0, results: [] };

    let total = 0;
    const results: Array<{ tenant: string; paid: boolean; amount?: number; missedPayments?: number }> = [];

    for (const tenant of property.tenants) {
      let payChance = 0.9;
      if (tenant.satisfaction < 50) payChance -= 0.2;
      if (tenant.satisfaction < 30) payChance -= 0.2;
      if (tenant.traits.includes('reliable')) payChance += 0.1;
      if (tenant.traits.includes('troublemaker')) payChance -= 0.15;

      if (Math.random() < payChance) {
        total += tenant.rentAmount;
        tenant.lastPayment = Date.now();
        tenant.missedPayments = 0;
        results.push({ tenant: tenant.id, paid: true, amount: tenant.rentAmount });
      } else {
        tenant.missedPayments++;
        results.push({ tenant: tenant.id, paid: false, missedPayments: tenant.missedPayments });

        if (tenant.missedPayments >= 3) {
          tenant.issues.push({ type: 'eviction_candidate', date: Date.now() });
        }
      }
    }

    this.notify({
      type: 'rent_collected',
      propertyId,
      total,
      results
    });

    return { success: true, total, results };
  }

  // ========== THREATS & VIOLATIONS ==========

  addThreat(propertyId: string, type: ThreatType, data: Partial<PropertyThreat> = {}): PropertyThreat | null {
    const property = this.properties.get(propertyId);
    if (!property) return null;

    const threat: PropertyThreat = {
      id: `threat_${Date.now()}`,
      type,
      severity: data.severity || 'medium',
      source: data.source,
      description: data.description || '',
      deadline: data.deadline,
      created: Date.now(),
      resolved: false
    };

    property.threats.push(threat);
    property.isContested = type === 'rival';
    if (type === 'rival') property.contestedBy = data.source || null;

    this.recalculateValue(propertyId);

    this.notify({
      type: 'threat_added',
      propertyId,
      threat
    });

    return threat;
  }

  resolveThreat(propertyId: string, threatId: string, resolution: string): { success: boolean } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false };

    const threat = property.threats.find(t => t.id === threatId);
    if (!threat) return { success: false };

    threat.resolved = true;
    threat.resolution = resolution;
    threat.resolvedDate = Date.now();

    property.threats = property.threats.filter(t => t.id !== threatId);

    if (property.threats.filter(t => t.type === 'rival').length === 0) {
      property.isContested = false;
      property.contestedBy = null;
    }

    this.recalculateValue(propertyId);

    this.notify({
      type: 'threat_resolved',
      propertyId,
      threat,
      resolution
    });

    return { success: true };
  }

  addViolation(propertyId: string, type: string, description: string): void {
    const property = this.properties.get(propertyId);
    if (!property) return;

    const violation: PropertyViolation = {
      id: `viol_${Date.now()}`,
      type,
      description,
      fine: Math.floor(Math.random() * 500) + 100,
      deadline: Date.now() + (30 * 24 * 60 * 60 * 1000),
      created: Date.now()
    };

    property.violations.push(violation);

    this.notify({
      type: 'violation_added',
      propertyId,
      violation
    });
  }

  // ========== UPGRADES ==========

  installUpgrade(propertyId: string, upgradeType: string): { success: boolean; reason?: string; cost?: number } {
    const property = this.properties.get(propertyId);
    if (!property) return { success: false, reason: 'Property not found' };

    const def = UPGRADE_DEFINITIONS[upgradeType];
    if (!def) return { success: false, reason: 'Unknown upgrade type' };

    const existing = property.upgrades.find(u => u.type === upgradeType);
    const currentLevel = existing?.level || 0;

    if (currentLevel >= def.maxLevel) {
      return { success: false, reason: 'Already at max level' };
    }

    const cost = def.baseCost * (currentLevel + 1);

    if (existing) {
      existing.level++;
      existing.lastUpgrade = Date.now();
    } else {
      property.upgrades.push({
        type: upgradeType,
        name: def.name,
        level: 1,
        installedDate: Date.now(),
        lastUpgrade: Date.now()
      });
    }

    // Apply effects
    if (def.effects.condition) {
      property.condition = Math.min(100, property.condition + def.effects.condition);
      this.updateConditionState(property);
    }
    if (def.effects.safety) {
      property.reputation.safety = Math.min(100, property.reputation.safety + def.effects.safety);
    }
    if (def.effects.desirability) {
      property.reputation.desirability = Math.min(100, property.reputation.desirability + def.effects.desirability);
    }
    if (def.effects.notoriety) {
      property.reputation.notoriety = Math.max(0, property.reputation.notoriety + def.effects.notoriety);
    }
    if (def.effects.maxTenants) {
      property.maxTenants += def.effects.maxTenants;
    }
    if (def.effects.baseValue) {
      property.baseValue = Math.round(property.baseValue * (1 + def.effects.baseValue));
    }

    this.recalculateValue(propertyId);

    return { success: true, cost };
  }

  // ========== REPUTATION & HISTORY ==========

  recordEvent(propertyId: string, event: { type: string; description: string; witnesses?: string[]; publicKnowledge?: boolean }): void {
    const property = this.properties.get(propertyId);
    if (!property) return;

    property.reputation.history.push({
      type: event.type,
      description: event.description,
      date: Date.now(),
      witnesses: event.witnesses || [],
      publicKnowledge: event.publicKnowledge ?? false
    });

    if (property.reputation.history.length > 50) {
      property.reputation.history = property.reputation.history.slice(-50);
    }

    const effects = REPUTATION_EFFECTS[event.type];
    if (effects) {
      if (effects.safety) {
        property.reputation.safety = Math.max(0, Math.min(100, property.reputation.safety + effects.safety));
      }
      if (effects.desirability) {
        property.reputation.desirability = Math.max(0, Math.min(100, property.reputation.desirability + effects.desirability));
      }
      if (effects.notoriety) {
        property.reputation.notoriety = Math.max(0, Math.min(100, property.reputation.notoriety + effects.notoriety));
      }
    }

    this.recalculateValue(propertyId);
  }

  // ========== QUERIES ==========

  getProperty(id: string): WorldProperty | undefined {
    return this.properties.get(id);
  }

  getPlayerProperties(): WorldProperty[] {
    return Array.from(this.playerProperties).map(id => this.properties.get(id)).filter(Boolean) as WorldProperty[];
  }

  getPropertiesForSale(filters: { type?: PropertyType; maxPrice?: number; minCondition?: number; zone?: string } = {}): WorldProperty[] {
    return Array.from(this.properties.values()).filter(p => {
      if (!p.isForSale) return false;
      if (filters.type && p.type !== filters.type) return false;
      if (filters.maxPrice && p.listingPrice > filters.maxPrice) return false;
      if (filters.minCondition && p.condition < filters.minCondition) return false;
      return true;
    });
  }

  getPropertiesByOwner(ownerId: string): WorldProperty[] {
    return Array.from(this.properties.values()).filter(p => p.owner === ownerId);
  }

  // ========== SIMULATION ==========

  // Limits to prevent unbounded growth
  private static readonly MAX_TENANT_ISSUES = 10;
  private static readonly MAX_THREATS = 15;
  private static readonly MAX_VIOLATIONS = 10;
  private static readonly MAX_VALUE_MODIFIERS = 10;
  private static readonly MAX_PREVIOUS_OWNERS = 20;

  processTick(deltaTime: number = 1): void {
    for (const property of this.properties.values()) {
      // Degrade condition slowly
      if (Math.random() < 0.1 * deltaTime) {
        this.degradeCondition(property.id, 1);
      }

      // Tenant satisfaction drift
      for (const tenant of property.tenants) {
        if (property.condition < 50) {
          this.updateTenantSatisfaction(property.id, tenant.id, -2, 'poor_condition');
        }

        if (Math.random() < 0.02) {
          const events = ['noise_complaint', 'maintenance_request', 'neighbor_dispute'];
          const event = events[Math.floor(Math.random() * events.length)];
          tenant.issues.push({ type: event, date: Date.now() });
          this.notify({ type: 'tenant_issue', propertyId: property.id, tenant, issue: event });
        }
        
        // Prune tenant issues
        if (tenant.issues.length > PropertySystemClass.MAX_TENANT_ISSUES) {
          tenant.issues = tenant.issues.slice(-PropertySystemClass.MAX_TENANT_ISSUES);
        }
      }

      // Process threats and prune
      const activeThreats: PropertyThreat[] = [];
      for (const threat of property.threats) {
        if (threat.deadline && Date.now() > threat.deadline && !threat.resolved) {
          this.notify({
            type: 'threat_deadline_passed',
            propertyId: property.id,
            threat
          });
        }
        // Keep unresolved threats, limit resolved ones
        if (!threat.resolved) {
          activeThreats.push(threat);
        }
      }
      // Cap threats
      if (property.threats.length > PropertySystemClass.MAX_THREATS) {
        const resolved = property.threats.filter(t => t.resolved).slice(-5);
        property.threats = [...activeThreats.slice(0, PropertySystemClass.MAX_THREATS - 5), ...resolved];
      }
      
      // Prune violations
      if (property.violations.length > PropertySystemClass.MAX_VIOLATIONS) {
        property.violations = property.violations.slice(-PropertySystemClass.MAX_VIOLATIONS);
      }
      
      // Prune value modifiers (remove expired ones first)
      const now = Date.now();
      property.valueModifiers = property.valueModifiers
        .filter(m => !m.expiry || m.expiry > now)
        .slice(-PropertySystemClass.MAX_VALUE_MODIFIERS);
      
      // Prune previous owners
      if (property.previousOwners.length > PropertySystemClass.MAX_PREVIOUS_OWNERS) {
        property.previousOwners = property.previousOwners.slice(-PropertySystemClass.MAX_PREVIOUS_OWNERS);
      }

      // Mortgage payments
      if (property.mortgage && property.owner === 'player') {
        this.notify({
          type: 'mortgage_due',
          propertyId: property.id,
          amount: property.mortgage.monthlyPayment
        });
      }
    }
  }

  // ========== EVENTS ==========

  addEventListener(callback: (event: PropertyEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notify(event: PropertyEvent): void {
    for (const listener of this.listeners) {
      try { listener(event); } catch (e) { console.error('[PropertySystem]', e); }
    }
  }

  // ========== SERIALIZATION ==========

  serialize(): PropertySystemState {
    return {
      properties: new Map(Array.from(this.properties.entries()).map(([id, p]) => [
        id,
        { ...p, flags: new Set(p.flags) }
      ])),
      playerProperties: new Set(this.playerProperties)
    };
  }

  deserialize(data: { properties?: Array<[string, WorldProperty]>; playerProperties?: string[] }): void {
    this.properties.clear();
    this.playerProperties.clear();

    if (data.properties) {
      for (const [id, p] of data.properties) {
        p.flags = new Set(p.flags || []);
        this.properties.set(id, p);
      }
    }

    for (const id of data.playerProperties || []) {
      this.playerProperties.add(id);
    }
  }

  // ========== AI CONTEXT ==========

  buildPropertyContext(): string {
    const playerProps = this.getPlayerProperties();
    if (playerProps.length === 0) return '';

    const lines = ['PLAYER PROPERTIES:'];
    for (const p of playerProps) {
      lines.push(`- ${p.name} (${p.type}): Condition ${p.conditionState}, Value $${p.currentValue.toLocaleString()}`);
      if (p.tenants.length > 0) {
        lines.push(`  Tenants: ${p.tenants.map(t => `${t.name} (satisfaction: ${t.satisfaction}%)`).join(', ')}`);
      }
      if (p.threats.length > 0) {
        lines.push(`  THREATS: ${p.threats.map(t => `${t.type} (${t.severity})`).join(', ')}`);
      }
      if (p.mortgage) {
        lines.push(`  Mortgage: $${p.mortgage.monthlyPayment}/month, ${p.mortgage.remainingMonths} months remaining`);
      }
    }
    return lines.join('\n');
  }
}

export const PropertySystem = new PropertySystemClass();
export default PropertySystem;
