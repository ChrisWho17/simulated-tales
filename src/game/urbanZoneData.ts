// Urban Zone Data - Predefined zones for the game world

import { UrbanZone, UrbanLocation } from '@/types/urbanZone';

// ============= CORE URBAN ZONES =============

export const URBAN_ZONES: Record<string, UrbanZone> = {
  financial_district: {
    id: 'financial_district',
    name: 'Financial District',
    type: 'financial',
    description: 'Gleaming towers of glass and steel house the city\'s economic engines.',
    ownership: 'corporate',
    controllingFaction: 'Business Council',
    surveillance: {
      level: 85,
      types: ['facial_recognition', 'license_plate', 'cctv', 'keycard_logs'],
      responseTime: 3,
      escapeRoutes: 2
    },
    accessLevel: 'semi_public',
    accessRules: [
      {
        timeOfDay: 'day',
        requirements: ['business_attire'],
        modifiers: {
          attireBonus: 'formal',
          backgroundPenalty: 'homeless',
          reputationThreshold: 0
        }
      },
      {
        timeOfDay: 'night',
        requirements: ['keycard', 'authorization'],
        modifiers: {
          attireBonus: 'formal',
          backgroundPenalty: 'homeless',
          reputationThreshold: 20
        }
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 60, consequence: 'Security questions your presence', severityLevel: 'warning' },
      { timeThresholdMinutes: 120, consequence: 'Police called for loitering', severityLevel: 'minor' },
      { timeThresholdMinutes: 240, consequence: 'Escorted out, flagged in system', severityLevel: 'moderate' }
    ],
    atmosphere: {
      crowdDensity: 'busy',
      noiseLevel: 'moderate',
      cleanliness: 'pristine',
      lighting: 'bright',
      socialTone: 'indifferent'
    },
    npcReactions: {
      appearance: {
        formal: 15,
        casual: -5,
        disheveled: -30,
        uniform: 0
      },
      background: {
        college: 5,
        home: 0,
        homeless: -40
      },
      timeOfDay: {
        day: 0,
        night: -20
      },
      surveillanceAwareness: 15
    },
    narrativeFunctions: [
      'Economic power center',
      'Class contrast opportunities',
      'Corporate espionage setting',
      'Wealth display'
    ],
    possibleEvents: [
      'corporate_meeting', 'market_crash', 'protest', 'security_incident'
    ],
    connectedZones: ['downtown', 'transit_hub', 'residential_high'],
    travelTime: {
      downtown: 10,
      transit_hub: 5,
      residential_high: 20
    }
  },

  downtown: {
    id: 'downtown',
    name: 'Downtown Core',
    type: 'downtown',
    description: 'The bustling heart of the city where commerce and culture collide.',
    ownership: 'government',
    surveillance: {
      level: 70,
      types: ['cctv', 'license_plate', 'movement_heatmap'],
      responseTime: 5,
      escapeRoutes: 4
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: [],
        modifiers: {}
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 180, consequence: 'Police patrol takes notice', severityLevel: 'warning' },
      { timeThresholdMinutes: 360, consequence: 'Asked to move along', severityLevel: 'minor' }
    ],
    atmosphere: {
      crowdDensity: 'crowded',
      noiseLevel: 'loud',
      cleanliness: 'average',
      lighting: 'well_lit',
      socialTone: 'neutral'
    },
    npcReactions: {
      appearance: {
        formal: 5,
        casual: 0,
        disheveled: -15,
        uniform: 5
      },
      background: {
        college: 0,
        home: 0,
        homeless: -20
      },
      timeOfDay: {
        day: 0,
        night: -10
      },
      surveillanceAwareness: 10
    },
    narrativeFunctions: [
      'Central meeting point',
      'Random encounters',
      'Public events',
      'Street performance'
    ],
    possibleEvents: [
      'street_performance', 'pickpocket', 'protest', 'festival'
    ],
    connectedZones: ['financial_district', 'commercial', 'entertainment', 'transit_hub'],
    travelTime: {
      financial_district: 10,
      commercial: 8,
      entertainment: 12,
      transit_hub: 5
    }
  },

  commercial: {
    id: 'commercial',
    name: 'Commercial Strip',
    type: 'commercial',
    description: 'Shops, restaurants, and services line these busy streets.',
    ownership: 'private',
    surveillance: {
      level: 55,
      types: ['cctv', 'purchase_tracking'],
      responseTime: 8,
      escapeRoutes: 5
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'day',
        requirements: [],
        modifiers: {}
      },
      {
        timeOfDay: 'night',
        requirements: [],
        modifiers: {
          backgroundPenalty: 'homeless'
        }
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 120, consequence: 'Shop owners eye you suspiciously', severityLevel: 'warning' }
    ],
    atmosphere: {
      crowdDensity: 'moderate',
      noiseLevel: 'moderate',
      cleanliness: 'clean',
      lighting: 'well_lit',
      socialTone: 'welcoming'
    },
    npcReactions: {
      appearance: {
        formal: 10,
        casual: 5,
        disheveled: -10,
        uniform: 0
      },
      background: {
        college: 5,
        home: 5,
        homeless: -15
      },
      timeOfDay: {
        day: 5,
        night: -5
      },
      surveillanceAwareness: 5
    },
    narrativeFunctions: [
      'Shopping opportunities',
      'Service acquisition',
      'Social encounters',
      'Job hunting'
    ],
    possibleEvents: [
      'sale_event', 'shoplifting', 'job_offer', 'chance_meeting'
    ],
    connectedZones: ['downtown', 'residential_mid', 'entertainment'],
    travelTime: {
      downtown: 8,
      residential_mid: 15,
      entertainment: 10
    }
  },

  residential_low: {
    id: 'residential_low',
    name: 'Low-Income Neighborhood',
    type: 'residential_low',
    description: 'Crowded apartments and struggling families make do in this forgotten corner.',
    ownership: 'disputed',
    surveillance: {
      level: 25,
      types: ['utility_usage', 'cctv'],
      responseTime: 25,
      escapeRoutes: 6
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: [],
        modifiers: {}
      }
    ],
    overstayConsequences: [],
    atmosphere: {
      crowdDensity: 'moderate',
      noiseLevel: 'loud',
      cleanliness: 'dirty',
      lighting: 'dim',
      socialTone: 'suspicious'
    },
    npcReactions: {
      appearance: {
        formal: -10,
        casual: 5,
        disheveled: 0,
        uniform: -15
      },
      background: {
        college: -5,
        home: 10,
        homeless: 5
      },
      timeOfDay: {
        day: 0,
        night: -15
      },
      surveillanceAwareness: -5
    },
    narrativeFunctions: [
      'Community solidarity',
      'Resource scarcity stories',
      'Informal economy',
      'Gentrification conflict'
    ],
    possibleEvents: [
      'community_event', 'eviction', 'gang_activity', 'neighborhood_watch'
    ],
    connectedZones: ['industrial', 'underground', 'transit_hub'],
    travelTime: {
      industrial: 10,
      underground: 5,
      transit_hub: 20
    }
  },

  residential_mid: {
    id: 'residential_mid',
    name: 'Suburban Neighborhood',
    type: 'residential_mid',
    description: 'Cookie-cutter houses and manicured lawns stretch in orderly rows.',
    ownership: 'private',
    controllingFaction: 'HOA',
    surveillance: {
      level: 45,
      types: ['social_media', 'cctv'],
      responseTime: 12,
      escapeRoutes: 4
    },
    accessLevel: 'semi_public',
    accessRules: [
      {
        timeOfDay: 'day',
        requirements: [],
        modifiers: {
          backgroundPenalty: 'homeless'
        }
      },
      {
        timeOfDay: 'night',
        requirements: [],
        modifiers: {
          backgroundPenalty: 'homeless',
          reputationThreshold: -10
        }
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 60, consequence: 'Neighbors notice an unfamiliar face', severityLevel: 'warning' },
      { timeThresholdMinutes: 120, consequence: 'Someone calls the police about a "suspicious person"', severityLevel: 'minor' }
    ],
    atmosphere: {
      crowdDensity: 'sparse',
      noiseLevel: 'quiet',
      cleanliness: 'clean',
      lighting: 'well_lit',
      socialTone: 'suspicious'
    },
    npcReactions: {
      appearance: {
        formal: 0,
        casual: 5,
        disheveled: -25,
        uniform: 10
      },
      background: {
        college: 5,
        home: 15,
        homeless: -35
      },
      timeOfDay: {
        day: 5,
        night: -20
      },
      surveillanceAwareness: 20
    },
    narrativeFunctions: [
      'Suburban drama',
      'Keeping up appearances',
      'Class anxiety',
      'Family dynamics'
    ],
    possibleEvents: [
      'neighborhood_bbq', 'hoa_meeting', 'domestic_dispute', 'block_party'
    ],
    connectedZones: ['commercial', 'residential_high', 'transit_hub'],
    travelTime: {
      commercial: 15,
      residential_high: 10,
      transit_hub: 15
    }
  },

  residential_high: {
    id: 'residential_high',
    name: 'Gated Community',
    type: 'residential_high',
    description: 'Mansion-lined streets behind security gates and manicured hedges.',
    ownership: 'private',
    controllingFaction: 'Residents Association',
    surveillance: {
      level: 90,
      types: ['biometric', 'cctv', 'keycard_logs', 'license_plate'],
      responseTime: 2,
      escapeRoutes: 1
    },
    accessLevel: 'secured',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: ['resident_id', 'guest_pass', 'service_authorization'],
        modifiers: {
          attireBonus: 'formal',
          backgroundPenalty: 'homeless',
          reputationThreshold: 50
        }
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 30, consequence: 'Security approaches for verification', severityLevel: 'warning' },
      { timeThresholdMinutes: 60, consequence: 'Escorted to gate with warning', severityLevel: 'minor' },
      { timeThresholdMinutes: 90, consequence: 'Police called, trespassing charges', severityLevel: 'severe' }
    ],
    atmosphere: {
      crowdDensity: 'empty',
      noiseLevel: 'silent',
      cleanliness: 'pristine',
      lighting: 'well_lit',
      socialTone: 'suspicious'
    },
    npcReactions: {
      appearance: {
        formal: 20,
        casual: -10,
        disheveled: -50,
        uniform: 5
      },
      background: {
        college: -5,
        home: 10,
        homeless: -60
      },
      timeOfDay: {
        day: 0,
        night: -30
      },
      surveillanceAwareness: 30
    },
    narrativeFunctions: [
      'Elite social climbing',
      'Hidden scandals',
      'Power networking',
      'Wealth display'
    ],
    possibleEvents: [
      'charity_gala', 'scandal_reveal', 'exclusive_party', 'security_breach'
    ],
    connectedZones: ['residential_mid', 'financial_district'],
    travelTime: {
      residential_mid: 10,
      financial_district: 20
    }
  },

  industrial: {
    id: 'industrial',
    name: 'Industrial District',
    type: 'industrial',
    description: 'Warehouses and factories line streets empty of pedestrians.',
    ownership: 'corporate',
    surveillance: {
      level: 40,
      types: ['cctv', 'keycard_logs'],
      responseTime: 15,
      escapeRoutes: 5
    },
    accessLevel: 'restricted',
    accessRules: [
      {
        timeOfDay: 'day',
        requirements: ['worker_id'],
        modifiers: {
          attireBonus: 'uniform'
        }
      },
      {
        timeOfDay: 'night',
        requirements: ['authorization'],
        modifiers: {}
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 30, consequence: 'Workers question your presence', severityLevel: 'warning' },
      { timeThresholdMinutes: 60, consequence: 'Security called', severityLevel: 'minor' }
    ],
    atmosphere: {
      crowdDensity: 'sparse',
      noiseLevel: 'loud',
      cleanliness: 'dirty',
      lighting: 'dim',
      socialTone: 'indifferent'
    },
    npcReactions: {
      appearance: {
        formal: -15,
        casual: 0,
        disheveled: -5,
        uniform: 20
      },
      background: {
        college: -10,
        home: 5,
        homeless: -10
      },
      timeOfDay: {
        day: 0,
        night: -25
      },
      surveillanceAwareness: 5
    },
    narrativeFunctions: [
      'Manual labor opportunities',
      'Illegal activities',
      'Hidden meetings',
      'Workplace drama'
    ],
    possibleEvents: [
      'workplace_accident', 'labor_dispute', 'illegal_dumping', 'night_shift_encounter'
    ],
    connectedZones: ['residential_low', 'underground', 'transit_hub'],
    travelTime: {
      residential_low: 10,
      underground: 8,
      transit_hub: 15
    }
  },

  entertainment: {
    id: 'entertainment',
    name: 'Entertainment District',
    type: 'entertainment',
    description: 'Neon signs and pounding music mark this nightlife hub.',
    ownership: 'private',
    surveillance: {
      level: 50,
      types: ['cctv', 'facial_recognition'],
      responseTime: 10,
      escapeRoutes: 4
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: [],
        modifiers: {
          attireBonus: 'fashionable'
        }
      }
    ],
    overstayConsequences: [],
    atmosphere: {
      crowdDensity: 'crowded',
      noiseLevel: 'deafening',
      cleanliness: 'average',
      lighting: 'dim',
      socialTone: 'welcoming'
    },
    npcReactions: {
      appearance: {
        formal: 5,
        casual: 10,
        disheveled: -5,
        uniform: -5
      },
      background: {
        college: 10,
        home: 0,
        homeless: -10
      },
      timeOfDay: {
        day: -10,
        night: 15
      },
      surveillanceAwareness: 0
    },
    narrativeFunctions: [
      'Social opportunities',
      'Romance encounters',
      'Drug/alcohol access',
      'Underground contacts'
    ],
    possibleEvents: [
      'bar_fight', 'live_show', 'vip_access', 'drug_deal', 'romantic_encounter'
    ],
    connectedZones: ['downtown', 'commercial', 'underground'],
    travelTime: {
      downtown: 12,
      commercial: 10,
      underground: 5
    }
  },

  underground: {
    id: 'underground',
    name: 'The Underground',
    type: 'underground',
    description: 'Abandoned tunnels and forgotten spaces where the system doesn\'t reach.',
    ownership: 'abandoned',
    surveillance: {
      level: 5,
      types: ['none'],
      responseTime: 60,
      escapeRoutes: 8
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: [],
        modifiers: {}
      }
    ],
    overstayConsequences: [],
    atmosphere: {
      crowdDensity: 'sparse',
      noiseLevel: 'quiet',
      cleanliness: 'decrepit',
      lighting: 'dark',
      socialTone: 'hostile'
    },
    npcReactions: {
      appearance: {
        formal: -25,
        casual: -10,
        disheveled: 10,
        uniform: -30
      },
      background: {
        college: -20,
        home: -15,
        homeless: 20
      },
      timeOfDay: {
        day: 5,
        night: 0
      },
      surveillanceAwareness: -20
    },
    narrativeFunctions: [
      'Black market access',
      'Hiding from authorities',
      'Homeless community',
      'Criminal activity'
    ],
    possibleEvents: [
      'black_market', 'gang_encounter', 'shelter_sharing', 'police_sweep'
    ],
    connectedZones: ['residential_low', 'industrial', 'entertainment'],
    travelTime: {
      residential_low: 5,
      industrial: 8,
      entertainment: 5
    }
  },

  transit_hub: {
    id: 'transit_hub',
    name: 'Central Transit Hub',
    type: 'transit',
    description: 'Trains, buses, and crowds converge in this nexus of movement.',
    ownership: 'government',
    surveillance: {
      level: 75,
      types: ['cctv', 'facial_recognition', 'movement_heatmap'],
      responseTime: 4,
      escapeRoutes: 6
    },
    accessLevel: 'public',
    accessRules: [
      {
        timeOfDay: 'always',
        requirements: [],
        modifiers: {}
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 120, consequence: 'Transit police take notice', severityLevel: 'warning' },
      { timeThresholdMinutes: 240, consequence: 'Asked to show ticket or leave', severityLevel: 'minor' }
    ],
    atmosphere: {
      crowdDensity: 'crowded',
      noiseLevel: 'loud',
      cleanliness: 'average',
      lighting: 'bright',
      socialTone: 'indifferent'
    },
    npcReactions: {
      appearance: {
        formal: 0,
        casual: 0,
        disheveled: -15,
        uniform: 10
      },
      background: {
        college: 0,
        home: 0,
        homeless: -25
      },
      timeOfDay: {
        day: 0,
        night: -10
      },
      surveillanceAwareness: 15
    },
    narrativeFunctions: [
      'Travel nexus',
      'Random encounters',
      'Commuter stories',
      'Escape routes'
    ],
    possibleEvents: [
      'missed_train', 'chance_reunion', 'pickpocket', 'delay_drama'
    ],
    connectedZones: ['financial_district', 'downtown', 'residential_low', 'residential_mid', 'industrial'],
    travelTime: {
      financial_district: 5,
      downtown: 5,
      residential_low: 20,
      residential_mid: 15,
      industrial: 15
    }
  },

  university_district: {
    id: 'university_district',
    name: 'University District',
    type: 'institutional',
    description: 'Ivy-covered halls and bustling quads filled with students and academics.',
    ownership: 'private',
    controllingFaction: 'University Administration',
    surveillance: {
      level: 60,
      types: ['cctv', 'keycard_logs', 'social_media'],
      responseTime: 8,
      escapeRoutes: 5
    },
    accessLevel: 'semi_public',
    accessRules: [
      {
        timeOfDay: 'day',
        requirements: [],
        modifiers: {
          attireBonus: 'casual'
        }
      },
      {
        timeOfDay: 'night',
        requirements: ['student_id'],
        modifiers: {
          reputationThreshold: 0
        }
      }
    ],
    overstayConsequences: [
      { timeThresholdMinutes: 180, consequence: 'Campus security notices you', severityLevel: 'warning' }
    ],
    atmosphere: {
      crowdDensity: 'busy',
      noiseLevel: 'moderate',
      cleanliness: 'clean',
      lighting: 'well_lit',
      socialTone: 'welcoming'
    },
    npcReactions: {
      appearance: {
        formal: -5,
        casual: 15,
        disheveled: 0,
        uniform: -10
      },
      background: {
        college: 25,
        home: 5,
        homeless: -15
      },
      timeOfDay: {
        day: 5,
        night: -5
      },
      surveillanceAwareness: 5
    },
    narrativeFunctions: [
      'Academic advancement',
      'Social networking',
      'Research opportunities',
      'Youth culture'
    ],
    possibleEvents: [
      'exam_stress', 'party_invite', 'study_group', 'professor_meeting', 'campus_protest'
    ],
    connectedZones: ['downtown', 'residential_mid', 'entertainment'],
    travelTime: {
      downtown: 15,
      residential_mid: 10,
      entertainment: 12
    }
  }
};

// ============= SPECIFIC LOCATIONS WITHIN ZONES =============

export const URBAN_LOCATIONS: Record<string, UrbanLocation> = {
  // Financial District Locations
  corporate_lobby: {
    id: 'corporate_lobby',
    name: 'Meridian Tower Lobby',
    zoneId: 'financial_district',
    description: 'Marble floors reflect the cold fluorescent lights of corporate power.',
    services: ['reception', 'security_desk', 'elevator_access'],
    hazards: ['security_scrutiny', 'id_checks'],
    opportunities: ['corporate_contacts', 'job_applications'],
    typicalNPCs: ['receptionist', 'security_guard', 'executive', 'intern'],
    timeDescriptions: {
      morning: 'The lobby bustles with suits clutching coffee cups, rushing toward elevators.',
      afternoon: 'A steady stream of meetings comes and goes through the revolving doors.',
      evening: 'The crowd thins as workers flee for the exits.',
      night: 'Security guards patrol the empty marble expanse.',
      late_night: 'A lone janitor pushes a mop across the gleaming floor.'
    }
  },

  // Underground Locations
  abandoned_subway: {
    id: 'abandoned_subway',
    name: 'Abandoned Subway Station',
    zoneId: 'underground',
    description: 'Graffiti-covered tiles and broken turnstiles mark this forgotten station.',
    surveillanceOverride: {
      level: 0,
      types: ['none'],
      responseTime: 120,
      escapeRoutes: 3
    },
    services: ['shelter', 'privacy'],
    hazards: ['structural_danger', 'territorial_disputes', 'rats'],
    opportunities: ['black_market', 'safe_house', 'community'],
    typicalNPCs: ['homeless_veteran', 'runaway', 'dealer', 'urban_explorer'],
    timeDescriptions: {
      morning: 'Pale light filters through grates above, waking the station\'s inhabitants.',
      afternoon: 'The darkness persists, broken only by scattered campfires.',
      evening: 'More bodies drift in, seeking shelter for the night.',
      night: 'Shadows move between makeshift shelters as the underground comes alive.',
      late_night: 'Silence blankets the station, broken only by dripping water and distant trains.'
    }
  },

  // University District Locations
  campus_quad: {
    id: 'campus_quad',
    name: 'Central Quad',
    zoneId: 'university_district',
    description: 'Manicured lawns stretch between historic buildings and modern structures.',
    services: ['wifi', 'benches', 'food_trucks'],
    hazards: ['campus_police', 'social_judgment'],
    opportunities: ['study_groups', 'social_events', 'club_recruitment'],
    typicalNPCs: ['student', 'professor', 'campus_tour_guide', 'activist'],
    timeDescriptions: {
      morning: 'Students hurry to early classes, coffee in hand, eyes half-closed.',
      afternoon: 'The quad fills with students lounging, studying, and socializing.',
      evening: 'Study groups form under the lamplight as the sky darkens.',
      night: 'Scattered students cross the empty quad between library and dorm.',
      late_night: 'Security patrols the deserted paths, checking IDs.'
    }
  },

  dorm_common_room: {
    id: 'dorm_common_room',
    name: 'Dorm Common Room',
    zoneId: 'university_district',
    description: 'Worn couches and a perpetually on TV define this student gathering space.',
    surveillanceOverride: {
      level: 30,
      types: ['cctv'],
      responseTime: 5,
      escapeRoutes: 2
    },
    atmosphereOverride: {
      socialTone: 'welcoming',
      crowdDensity: 'moderate'
    },
    services: ['tv', 'vending_machines', 'study_space'],
    hazards: ['noise', 'social_drama'],
    opportunities: ['friendships', 'study_partners', 'party_invites'],
    typicalNPCs: ['roommate', 'floor_mate', 'ra', 'visitor'],
    timeDescriptions: {
      morning: 'Early risers grab breakfast from the vending machine.',
      afternoon: 'The room fills with post-class decompression.',
      evening: 'Movie nights and group study sessions compete for couch space.',
      night: 'The party crowd gathers before heading out.',
      late_night: 'Only the most dedicated studiers remain, surrounded by coffee cups.'
    }
  }
};

// Helper to get zone by ID
export function getZone(zoneId: string): UrbanZone | undefined {
  return URBAN_ZONES[zoneId];
}

// Helper to get all locations in a zone
export function getLocationsInZone(zoneId: string): UrbanLocation[] {
  return Object.values(URBAN_LOCATIONS).filter(loc => loc.zoneId === zoneId);
}

// Helper to get spawn zone based on character origin
export function getSpawnZone(origin: 'college' | 'home' | 'homeless'): string {
  const spawnZones: Record<string, string> = {
    college: 'university_district',
    home: 'residential_mid',
    homeless: 'underground'
  };
  return spawnZones[origin] || 'downtown';
}
