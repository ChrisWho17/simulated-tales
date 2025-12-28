// ============================================================================
// GENRE WORLD SEEDER - Creates properties, rivals, and factions per genre
// "The world doesn't revolve around you. Make it."
// ============================================================================

import { PropertySystem, WorldProperty } from './propertySystem';
import { RivalSystem, WorldRival, RivalDesire } from './rivalSystem';
import { FactionSystem, WorldFaction, FactionActivity } from './factionSystem';
import { GameGenre } from '@/types/genreData';

export interface GenreWorldSeed {
  properties: Array<Partial<WorldProperty> & { name: string; template?: string }>;
  rivals: Array<Partial<WorldRival> & { name: string }>;
  factions: Array<Partial<WorldFaction> & { name: string }>;
}

// ============================================================================
// NOIR / CRIME GENRE
// ============================================================================

const NOIR_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'Abandoned Warehouse',
      template: 'warehouse',
      address: 'Industrial District',
      isForSale: true,
      listingPrice: 180000,
      condition: 45
    },
    {
      name: 'The Blue Moon Nightclub',
      template: 'nightclub',
      address: 'Entertainment District',
      isForSale: false,
      owner: 'npc_club_owner'
    },
    {
      name: 'Rundown Apartment Building',
      template: 'apartment_building',
      address: 'Eastside Slums',
      isForSale: true,
      listingPrice: 320000,
      condition: 35
    }
  ],
  rivals: [
    {
      name: 'Victor "The Snake" Moretti',
      type: 'individual',
      description: 'A cunning loan shark with political connections',
      resources: { money: 50000, muscle: 40, connections: 70, intel: 60 },
      personality: { aggression: 45, patience: 70, ruthlessness: 80, pride: 65, greed: 90 },
      desires: [
        { type: 'territory', description: 'Control the docks', priority: 8 },
        { type: 'respect', description: 'Be feared by all', priority: 6 }
      ],
      vulnerabilities: [
        { type: 'secret', description: 'Has a hidden family', severity: 7, knownToPlayer: false },
        { type: 'debt', description: 'Owes the Syndicate', severity: 5, knownToPlayer: false }
      ]
    },
    {
      name: 'Diamond Dolly',
      type: 'individual',
      description: 'A glamorous con artist who runs high-stakes scams',
      resources: { money: 25000, muscle: 10, connections: 85, intel: 75 },
      personality: { aggression: 25, patience: 80, ruthlessness: 60, pride: 75, greed: 70 },
      desires: [
        { type: 'market_share', description: 'Control the gambling scene', priority: 7 },
        { type: 'revenge', description: 'Destroy the man who betrayed her', priority: 9 }
      ]
    }
  ],
  factions: [
    {
      name: 'The Syndicate',
      type: 'cartel',
      description: 'The old-money crime family that runs the city from the shadows',
      ranks: ['Associate', 'Soldier', 'Capo', 'Underboss', 'Boss'],
      power: { military: 75, economic: 85, political: 70, intelligence: 60 },
      values: { loyalty: 90, violence: 65, honor: 70, ambition: 50 },
      activities: ['protection', 'gambling', 'smuggling'],
      recruitment: { open: false, requirements: ['Must be sponsored', 'Prove loyalty'], initiation: 'A job that can\'t be refused' }
    },
    {
      name: 'Eastside Crew',
      type: 'gang',
      description: 'Young, hungry, and dangerous street gang rising fast',
      ranks: ['Runner', 'Soldier', 'Lieutenant', 'Captain'],
      power: { military: 55, economic: 30, political: 15, intelligence: 40 },
      values: { loyalty: 60, violence: 85, honor: 30, ambition: 90 },
      activities: ['drugs', 'theft', 'extortion'],
      recruitment: { open: true, requirements: ['Street cred'], initiation: 'Survive a beat-in' }
    },
    {
      name: 'City Police Department',
      type: 'police',
      description: 'Corrupt to the core, but some honest cops remain',
      ranks: ['Officer', 'Detective', 'Sergeant', 'Lieutenant', 'Captain', 'Commissioner'],
      power: { military: 80, economic: 40, political: 60, intelligence: 70 },
      values: { loyalty: 40, violence: 50, honor: 35, ambition: 60 },
      activities: ['legitimate'],
      recruitment: { open: false, requirements: [], initiation: null }
    }
  ]
};

// ============================================================================
// FANTASY GENRE
// ============================================================================

const FANTASY_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'Ruined Watchtower',
      template: 'house',
      address: 'Northern Frontier',
      isForSale: true,
      listingPrice: 5000,
      condition: 25
    },
    {
      name: 'Merchant\'s Townhouse',
      template: 'storefront',
      address: 'Market Quarter',
      isForSale: true,
      listingPrice: 25000,
      condition: 75
    },
    {
      name: 'The Prancing Pony Inn',
      template: 'nightclub',
      address: 'Crossroads Village',
      isForSale: false,
      owner: 'npc_innkeeper'
    }
  ],
  rivals: [
    {
      name: 'Lord Aldric Blackthorn',
      type: 'individual',
      description: 'A ruthless noble seeking to expand his domain',
      resources: { money: 100000, muscle: 60, connections: 80, intel: 50 },
      personality: { aggression: 55, patience: 60, ruthlessness: 75, pride: 90, greed: 70 },
      desires: [
        { type: 'territory', description: 'Claim the eastern lands', priority: 9 },
        { type: 'elimination', description: 'Remove rival claimants', priority: 7 }
      ],
      vulnerabilities: [
        { type: 'family', description: 'His son is a secret rebel', severity: 8, knownToPlayer: false }
      ]
    },
    {
      name: 'Maelith the Collector',
      type: 'individual',
      description: 'A mysterious mage who hoards magical artifacts',
      resources: { money: 30000, muscle: 20, connections: 40, intel: 90 },
      personality: { aggression: 30, patience: 85, ruthlessness: 65, pride: 80, greed: 95 },
      desires: [
        { type: 'property', description: 'Acquire the Staff of Seasons', priority: 10 },
        { type: 'respect', description: 'Be recognized as the greatest wizard', priority: 6 }
      ]
    }
  ],
  factions: [
    {
      name: 'The Adventurers\' Guild',
      type: 'organization',
      description: 'A loose confederation of sellswords, treasure hunters, and heroes',
      ranks: ['Initiate', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Mythril'],
      power: { military: 70, economic: 45, political: 35, intelligence: 55 },
      values: { loyalty: 50, violence: 60, honor: 65, ambition: 70 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Complete a trial quest'], initiation: 'Slay a monster' }
    },
    {
      name: 'The Shadow Court',
      type: 'gang',
      description: 'A network of thieves, spies, and assassins',
      ranks: ['Finger', 'Hand', 'Eye', 'Voice', 'Shadow'],
      power: { military: 40, economic: 60, political: 30, intelligence: 95 },
      values: { loyalty: 75, violence: 45, honor: 20, ambition: 80 },
      activities: ['theft', 'smuggling'],
      recruitment: { open: false, requirements: ['Prove your worth in shadow'], initiation: 'Steal something impossible' },
      isHidden: true
    },
    {
      name: 'The Crown\'s Guard',
      type: 'militia',
      description: 'The official military force of the kingdom',
      ranks: ['Recruit', 'Guard', 'Sergeant', 'Knight', 'Captain', 'Lord Commander'],
      power: { military: 90, economic: 50, political: 75, intelligence: 40 },
      values: { loyalty: 80, violence: 55, honor: 85, ambition: 40 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Pass combat trials', 'Swear oath'], initiation: 'The Vigil' }
    },
    {
      name: 'Circle of the Old Ways',
      type: 'cult',
      description: 'Druids and nature worshippers who guard ancient secrets',
      ranks: ['Acolyte', 'Initiate', 'Keeper', 'Elder', 'Archdruid'],
      power: { military: 35, economic: 25, political: 20, intelligence: 70 },
      values: { loyalty: 85, violence: 25, honor: 90, ambition: 30 },
      activities: ['legitimate'],
      recruitment: { open: false, requirements: ['Nature affinity'], initiation: 'Three moons in the wild' }
    }
  ]
};

// ============================================================================
// SCI-FI GENRE
// ============================================================================

const SCIFI_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'Derelict Cargo Bay',
      template: 'warehouse',
      address: 'Station Ring C',
      isForSale: true,
      listingPrice: 75000,
      condition: 40
    },
    {
      name: 'Hab Module 7-G',
      template: 'apartment',
      address: 'Residential Sector',
      isForSale: true,
      listingPrice: 45000,
      condition: 65
    },
    {
      name: 'Neon Dreams Lounge',
      template: 'nightclub',
      address: 'Entertainment District',
      isForSale: false,
      owner: 'npc_lounge_owner'
    }
  ],
  rivals: [
    {
      name: 'Commissioner Drake',
      type: 'corporation',
      description: 'A corporate executive with shadowy agendas',
      resources: { money: 500000, muscle: 50, connections: 90, intel: 80 },
      personality: { aggression: 40, patience: 75, ruthlessness: 85, pride: 70, greed: 80 },
      desires: [
        { type: 'market_share', description: 'Control the trade routes', priority: 9 },
        { type: 'elimination', description: 'Remove the independent operators', priority: 6 }
      ]
    },
    {
      name: 'Razor',
      type: 'individual',
      description: 'A notorious hacker and information broker',
      resources: { money: 20000, muscle: 15, connections: 60, intel: 95 },
      personality: { aggression: 35, patience: 50, ruthlessness: 55, pride: 65, greed: 60 },
      desires: [
        { type: 'respect', description: 'Be the best in the net', priority: 8 },
        { type: 'revenge', description: 'Expose Nexus Corp\'s crimes', priority: 7 }
      ]
    }
  ],
  factions: [
    {
      name: 'Nexus Corporation',
      type: 'corporation',
      description: 'The megacorp that owns half the station',
      ranks: ['Contractor', 'Employee', 'Manager', 'Director', 'VP', 'Executive'],
      power: { military: 60, economic: 95, political: 85, intelligence: 70 },
      values: { loyalty: 30, violence: 40, honor: 15, ambition: 95 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Sign the contract'], initiation: null }
    },
    {
      name: 'Free Traders Alliance',
      type: 'union',
      description: 'Independent ship captains banding together for survival',
      ranks: ['Crew', 'Captain', 'Fleet Leader', 'Council Member'],
      power: { military: 50, economic: 55, political: 35, intelligence: 45 },
      values: { loyalty: 70, violence: 40, honor: 75, ambition: 60 },
      activities: ['legitimate', 'smuggling'],
      recruitment: { open: true, requirements: ['Own a ship or crew one'], initiation: 'Run the blockade' }
    },
    {
      name: 'The Collective',
      type: 'cult',
      description: 'A techno-religious movement seeking digital transcendence',
      ranks: ['Node', 'Link', 'Hub', 'Core', 'Nexus'],
      power: { military: 25, economic: 40, political: 20, intelligence: 85 },
      values: { loyalty: 95, violence: 20, honor: 60, ambition: 80 },
      activities: ['legitimate'],
      recruitment: { open: false, requirements: ['Neural interface required'], initiation: 'The Upload' },
      isHidden: true
    }
  ]
};

// ============================================================================
// WESTERN GENRE
// ============================================================================

const WESTERN_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'Abandoned Silver Mine',
      template: 'warehouse',
      address: 'The Hills',
      isForSale: true,
      listingPrice: 15000,
      condition: 30
    },
    {
      name: 'The Dusty Saddle Saloon',
      template: 'nightclub',
      address: 'Main Street',
      isForSale: false,
      owner: 'npc_saloon_keeper'
    },
    {
      name: 'General Store',
      template: 'storefront',
      address: 'Main Street',
      isForSale: true,
      listingPrice: 8000,
      condition: 70
    }
  ],
  rivals: [
    {
      name: 'Black Jack McCoy',
      type: 'individual',
      description: 'A notorious outlaw with a gang of desperados',
      resources: { money: 10000, muscle: 75, connections: 30, intel: 40 },
      personality: { aggression: 85, patience: 25, ruthlessness: 90, pride: 70, greed: 80 },
      desires: [
        { type: 'territory', description: 'Control the territory', priority: 8 },
        { type: 'revenge', description: 'Kill the sheriff who killed his brother', priority: 10 }
      ]
    },
    {
      name: 'Cornelius Whitmore III',
      type: 'business',
      description: 'A railroad baron buying up the town',
      resources: { money: 200000, muscle: 30, connections: 85, intel: 60 },
      personality: { aggression: 35, patience: 70, ruthlessness: 75, pride: 90, greed: 95 },
      desires: [
        { type: 'property', description: 'Buy every acre in the valley', priority: 9 },
        { type: 'elimination', description: 'Remove the homesteaders', priority: 7 }
      ]
    }
  ],
  factions: [
    {
      name: 'The Law',
      type: 'police',
      description: 'The sheriff and his deputies trying to keep order',
      ranks: ['Deputy', 'Senior Deputy', 'Sheriff', 'Marshal'],
      power: { military: 50, economic: 20, political: 60, intelligence: 45 },
      values: { loyalty: 70, violence: 55, honor: 80, ambition: 40 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Clean record'], initiation: 'Swear the oath' }
    },
    {
      name: 'McCoy Gang',
      type: 'gang',
      description: 'Outlaws, rustlers, and train robbers',
      ranks: ['Greenhorn', 'Rider', 'Lieutenant', 'Right Hand'],
      power: { military: 65, economic: 35, political: 10, intelligence: 35 },
      values: { loyalty: 50, violence: 90, honor: 25, ambition: 75 },
      activities: ['theft', 'smuggling'],
      recruitment: { open: false, requirements: ['Kill a lawman or prove your mettle'], initiation: 'Ride with us' }
    },
    {
      name: 'Ranchers\' Association',
      type: 'union',
      description: 'The cattle barons who really run the territory',
      ranks: ['Hand', 'Foreman', 'Rancher', 'Baron'],
      power: { military: 45, economic: 75, political: 70, intelligence: 40 },
      values: { loyalty: 65, violence: 45, honor: 55, ambition: 70 },
      activities: ['legitimate'],
      recruitment: { open: false, requirements: ['Own land'], initiation: null }
    }
  ]
};

// ============================================================================
// MODERN LIFE GENRE
// ============================================================================

const MODERN_LIFE_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'Studio Apartment',
      template: 'apartment',
      address: 'Downtown',
      isForSale: true,
      listingPrice: 85000,
      condition: 65
    },
    {
      name: 'Corner Coffee Shop',
      template: 'storefront',
      address: 'Arts District',
      isForSale: true,
      listingPrice: 150000,
      condition: 80
    }
  ],
  rivals: [
    {
      name: 'Marcus Chen',
      type: 'individual',
      description: 'An ambitious coworker gunning for the same promotion',
      resources: { money: 15000, muscle: 10, connections: 60, intel: 55 },
      personality: { aggression: 45, patience: 55, ruthlessness: 50, pride: 75, greed: 65 },
      desires: [
        { type: 'market_share', description: 'Get the promotion', priority: 9 },
        { type: 'respect', description: 'Be seen as the best', priority: 7 }
      ]
    }
  ],
  factions: [
    {
      name: 'The Company',
      type: 'corporation',
      description: 'Your employer - corporate politics at its finest',
      ranks: ['Intern', 'Associate', 'Senior', 'Manager', 'Director', 'VP', 'C-Suite'],
      power: { military: 10, economic: 80, political: 50, intelligence: 60 },
      values: { loyalty: 30, violence: 5, honor: 25, ambition: 85 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Pass the interview'], initiation: null }
    },
    {
      name: 'The Neighborhood Association',
      type: 'organization',
      description: 'Busybodies who control local politics',
      ranks: ['Resident', 'Member', 'Board Member', 'President'],
      power: { military: 5, economic: 30, political: 65, intelligence: 50 },
      values: { loyalty: 40, violence: 5, honor: 55, ambition: 60 },
      activities: ['legitimate'],
      recruitment: { open: true, requirements: ['Live here'], initiation: null }
    }
  ]
};

// ============================================================================
// HORROR GENRE
// ============================================================================

const HORROR_SEED: GenreWorldSeed = {
  properties: [
    {
      name: 'The Old Blackwood Manor',
      template: 'house',
      address: 'Edge of Town',
      isForSale: true,
      listingPrice: 50000,
      condition: 20
    },
    {
      name: 'Abandoned Asylum',
      template: 'apartment_building',
      address: 'Isolation Hill',
      isForSale: false,
      condition: 15
    }
  ],
  rivals: [
    {
      name: 'Dr. Helena Cross',
      type: 'individual',
      description: 'A scientist obsessed with forbidden knowledge',
      resources: { money: 40000, muscle: 15, connections: 50, intel: 90 },
      personality: { aggression: 30, patience: 80, ruthlessness: 70, pride: 85, greed: 40 },
      desires: [
        { type: 'property', description: 'Acquire the Tome of Shadows', priority: 10 },
        { type: 'elimination', description: 'Silence those who know too much', priority: 8 }
      ]
    }
  ],
  factions: [
    {
      name: 'The Watchers',
      type: 'cult',
      description: 'Those who guard against the darkness',
      ranks: ['Witness', 'Keeper', 'Guardian', 'Elder'],
      power: { military: 40, economic: 25, political: 20, intelligence: 80 },
      values: { loyalty: 85, violence: 35, honor: 75, ambition: 30 },
      activities: ['legitimate'],
      recruitment: { open: false, requirements: ['Have seen the truth'], initiation: 'Face your fear' },
      isHidden: true
    },
    {
      name: 'The Congregation',
      type: 'cult',
      description: 'Worshippers of something ancient and hungry',
      ranks: ['Believer', 'Devoted', 'Vessel', 'Voice'],
      power: { military: 35, economic: 45, political: 30, intelligence: 60 },
      values: { loyalty: 95, violence: 60, honor: 10, ambition: 70 },
      activities: ['gambling', 'extortion'],
      recruitment: { open: false, requirements: ['Be chosen'], initiation: 'The Offering' },
      isHidden: true
    }
  ]
};

// ============================================================================
// GENRE SEED MAP
// ============================================================================

const GENRE_SEEDS: Partial<Record<GameGenre, GenreWorldSeed>> = {
  mystery: NOIR_SEED,           // Noir is closest to mystery genre
  fantasy: FANTASY_SEED,
  scifi: SCIFI_SEED,
  cyberpunk: SCIFI_SEED,        // Cyberpunk uses similar scifi elements
  western: WESTERN_SEED,
  modern_life: MODERN_LIFE_SEED,
  horror: HORROR_SEED,
  postapoc: HORROR_SEED         // Post-apocalyptic uses horror elements
};

// Fallback seed for genres without specific content
const DEFAULT_SEED: GenreWorldSeed = {
  properties: [],
  rivals: [],
  factions: []
};

// ============================================================================
// SEEDING FUNCTIONS
// ============================================================================

export function seedWorldForGenre(genre: GameGenre): {
  properties: WorldProperty[];
  rivals: WorldRival[];
  factions: WorldFaction[];
} {
  const seed = GENRE_SEEDS[genre] || DEFAULT_SEED;
  
  const properties: WorldProperty[] = [];
  const rivals: WorldRival[] = [];
  const factions: WorldFaction[] = [];

  // Create properties
  for (const propData of seed.properties) {
    const property = PropertySystem.createProperty(propData);
    properties.push(property);
  }

  // Create rivals
  for (const rivalData of seed.rivals) {
    const rival = RivalSystem.createRival(rivalData);
    rivals.push(rival);
  }

  // Create factions and set up relations
  for (const factionData of seed.factions) {
    const faction = FactionSystem.createFaction(factionData);
    factions.push(faction);
  }

  // Set up faction relations based on genre
  if (genre === 'mystery' && factions.length >= 2) {
    // Syndicate vs Eastside Crew
    const syndicate = factions.find(f => f.name === 'The Syndicate');
    const eastside = factions.find(f => f.name === 'Eastside Crew');
    if (syndicate && eastside) {
      FactionSystem.setRelation(syndicate.id, eastside.id, 'tense', 'Territory disputes');
    }
  }

  if (genre === 'fantasy' && factions.length >= 2) {
    const guild = factions.find(f => f.name === 'The Adventurers\' Guild');
    const shadowCourt = factions.find(f => f.name === 'The Shadow Court');
    if (guild && shadowCourt) {
      FactionSystem.setRelation(guild.id, shadowCourt.id, 'neutral', 'Uneasy coexistence');
    }
  }

  console.log(`[GenreWorldSeeder] Seeded ${genre}: ${properties.length} properties, ${rivals.length} rivals, ${factions.length} factions`);

  return { properties, rivals, factions };
}

export function getGenreSeed(genre: GameGenre): GenreWorldSeed {
  return GENRE_SEEDS[genre] || DEFAULT_SEED;
}

export function hasGenreSeed(genre: GameGenre): boolean {
  return genre in GENRE_SEEDS;
}
