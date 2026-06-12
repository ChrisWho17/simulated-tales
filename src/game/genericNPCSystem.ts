// Generic NPC Generation and Spawning System
// Creates dynamic NPCs for locations based on time of day

import { NPC, NPCNeed, ConflictStyle, EscalationState, Trait, EmotionalState } from '@/types/game';

// Modern occupations for different location types
export interface GenericNPCTemplate {
  occupations: string[];
  traits: Trait[][];
  activities: Record<string, string[]>; // by time period
  ageRange: [number, number];
  wealthRange: [number, number];
}

// Location-specific NPC templates
export const locationNPCTemplates: Record<string, GenericNPCTemplate> = {
  market: {
    occupations: ['Shopper', 'Street Vendor', 'Delivery Driver', 'Food Critic', 'Tourist', 'Freelancer', 'Retiree'],
    traits: [
      ['friendly', 'curious'],
      ['busy', 'distracted'],
      ['grumpy', 'impatient'],
      ['chatty', 'gossip'],
    ] as Trait[][],
    activities: {
      morning: ['grabbing coffee', 'checking produce', 'setting up stall', 'on a jog'],
      afternoon: ['shopping for groceries', 'having lunch', 'browsing vendors', 'meeting a friend'],
      evening: ['picking up dinner', 'closing shop', 'enjoying street food', 'heading home'],
      night: ['bar hopping', 'cleaning up stall', 'walking home late'],
    },
    ageRange: [18, 75],
    wealthRange: [20, 200],
  },
  town_square: {
    occupations: ['Office Worker', 'Tourist', 'Street Performer', 'Dog Walker', 'Jogger', 'Photographer', 'Student'],
    traits: [
      ['curious', 'friendly'],
      ['calm', 'observant'],
      ['ambitious', 'busy'],
      ['artistic', 'dreamy'],
    ] as Trait[][],
    activities: {
      morning: ['commuting to work', 'walking the dog', 'taking photos', 'jogging'],
      afternoon: ['on lunch break', 'feeding pigeons', 'sketching', 'people watching'],
      evening: ['heading home', 'watching street performers', 'meeting up with friends'],
      night: ['taking a late walk', 'stargazing', 'waiting for a ride'],
    },
    ageRange: [16, 80],
    wealthRange: [15, 150],
  },
  university_district: {
    occupations: ['Student', 'Professor', 'Graduate Researcher', 'Barista', 'Bookstore Clerk', 'Teaching Assistant', 'Campus Security'],
    traits: [
      ['curious', 'ambitious'],
      ['studious', 'stressed'],
      ['friendly', 'idealistic'],
      ['cynical', 'tired'],
    ] as Trait[][],
    activities: {
      morning: ['rushing to class', 'getting coffee', 'studying in the quad', 'preparing lecture'],
      afternoon: ['studying in library', 'grabbing lunch', 'discussing thesis', 'office hours'],
      evening: ['attending study group', 'grading papers', 'partying', 'working night shift'],
      night: ['cramming for exam', 'pulling an all-nighter', 'bar hopping', 'walking home from library'],
    },
    ageRange: [18, 65],
    wealthRange: [5, 100],
  },
  tavern_main: {
    occupations: ['Regular', 'Traveler', 'Business Person', 'Off-duty Worker', 'Musician', 'Date Night Couple', 'Lonely Drinker'],
    traits: [
      ['friendly', 'chatty'],
      ['mysterious', 'secretive'],
      ['jovial', 'loud'],
      ['melancholy', 'quiet'],
    ] as Trait[][],
    activities: {
      morning: ['having breakfast', 'nursing hangover', 'reading newspaper', 'waiting for meeting'],
      afternoon: ['having business lunch', 'day drinking', 'passing through', 'meeting old friend'],
      evening: ['unwinding after work', 'on a date', 'watching sports', 'playing darts'],
      night: ['getting drunk', 'having deep conversation', 'flirting at bar', 'about to leave'],
    },
    ageRange: [21, 70],
    wealthRange: [10, 300],
  },
  mid_residential: {
    occupations: ['Neighbor', 'Delivery Person', 'Dog Walker', 'Jogger', 'Mail Carrier', 'Landscaper', 'Parent with Stroller'],
    traits: [
      ['friendly', 'nosy'],
      ['busy', 'distracted'],
      ['protective', 'suspicious'],
      ['calm', 'helpful'],
    ] as Trait[][],
    activities: {
      morning: ['getting mail', 'walking to car', 'taking out trash', 'gardening'],
      afternoon: ['returning from errands', 'working from home', 'supervising kids', 'chatting with neighbor'],
      evening: ['grilling dinner', 'walking the dog', 'sitting on porch', 'returning from work'],
      night: ['checking the mail late', 'smoking on porch', 'coming home from night shift'],
    },
    ageRange: [25, 75],
    wealthRange: [50, 250],
  },
  decaying_sector: {
    occupations: ['Homeless Person', 'Drug Dealer', 'Social Worker', 'Graffiti Artist', 'Urban Explorer', 'Cop on Patrol', 'Runaway'],
    traits: [
      ['desperate', 'wary'],
      ['streetwise', 'cunning'],
      ['kind', 'tired'],
      ['dangerous', 'aggressive'],
    ] as Trait[][],
    activities: {
      morning: ['looking for food', 'sleeping rough', 'on patrol', 'scavenging'],
      afternoon: ['panhandling', 'dealing', 'doing outreach', 'tagging walls'],
      evening: ['finding shelter', 'hanging with crew', 'looking for trouble', 'hiding'],
      night: ['sleeping under bridge', 'doing a deal', 'running from something', 'keeping watch'],
    },
    ageRange: [15, 60],
    wealthRange: [0, 50],
  },
  alley: {
    occupations: ['Homeless Person', 'Drug User', 'Lookout', 'Urban Explorer', 'Lost Person', 'Shady Character'],
    traits: [
      ['desperate', 'fearful'],
      ['cunning', 'suspicious'],
      ['paranoid', 'aggressive'],
    ] as Trait[][],
    activities: {
      morning: ['sleeping', 'waking up', 'scavenging for bottles'],
      afternoon: ['resting', 'waiting for someone', 'hiding'],
      evening: ['meeting contact', 'doing business', 'looking for shelter'],
      night: ['sleeping rough', 'keeping watch', 'doing something shady'],
    },
    ageRange: [16, 55],
    wealthRange: [0, 30],
  },
};

// Names database for random generation
const firstNamesMale = ['James', 'Michael', 'David', 'Chris', 'Alex', 'Ryan', 'Tyler', 'Brandon', 'Kevin', 'Marcus', 'Derek', 'Jason', 'Eric', 'Brian', 'Daniel', 'Omar', 'Carlos', 'Wei', 'Jin', 'Raj'];
const firstNamesFemale = ['Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda', 'Nicole', 'Jennifer', 'Stephanie', 'Melissa', 'Lauren', 'Maria', 'Lisa', 'Angela', 'Priya', 'Mei', 'Yuki', 'Sofia', 'Elena', 'Aisha', 'Fatima'];
const firstNamesNeutral = ['Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Jamie', 'Sam', 'Alex'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Chen', 'Lee', 'Kim', 'Patel', 'Singh', 'O\'Brien', 'Murphy', 'Wilson', 'Anderson', 'Thomas'];

// Appearance descriptors for AI generation
const hairColors = ['black', 'brown', 'blonde', 'red', 'gray', 'white', 'dyed blue', 'dyed pink', 'dyed purple'];
const hairStyles = ['short', 'long', 'curly', 'straight', 'wavy', 'buzz cut', 'ponytail', 'bun', 'messy', 'slicked back', 'braided', 'mohawk'];
const eyeColors = ['brown', 'blue', 'green', 'hazel', 'gray'];
const buildTypes = ['slim', 'athletic', 'average', 'heavyset', 'muscular', 'petite', 'curvy', 'stocky', 'lanky'];
const heightBands = ['very short', 'short', 'average', 'average', 'average', 'tall', 'tall', 'very tall']; // weighted toward average; very short is rare but possible
const clothingStyles = ['casual', 'business casual', 'professional', 'streetwear', 'hipster', 'sporty', 'bohemian', 'goth', 'preppy', 'rugged'];

export interface GeneratedAppearance {
  gender: 'male' | 'female' | 'non-binary';
  hair: string;
  eyes: string;
  build: string;
  height: string;
  /** Approximate weight in kg, rolled from build+height for image/narration consistency. */
  weightKg: number;
  clothing: string;
  distinguishing: string;
}

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Reasonable per-build BMI midpoint, paired with height band to roll a plausible weight.
function rollWeightKg(heightBand: string, build: string): number {
  const heights: Record<string, [number, number]> = {
    'very short': [127, 152], short: [152, 162], average: [163, 178], tall: [178, 188], 'very tall': [188, 200],
  };
  const bmi: Record<string, [number, number]> = {
    slim: [17, 21], athletic: [21, 26], average: [20, 25], heavyset: [28, 38],
    muscular: [24, 30], petite: [17, 21], curvy: [23, 30], stocky: [25, 32], lanky: [17, 22],
  };
  const [hMin, hMax] = heights[heightBand] || heights.average;
  const [bMin, bMax] = bmi[build] || bmi.average;
  const cm = randomInRange(hMin, hMax);
  const m = cm / 100;
  const bmiRoll = bMin + Math.random() * (bMax - bMin);
  return Math.round(bmiRoll * m * m);
}

export function generateAppearance(): GeneratedAppearance {
  const gender = randomFrom(['male', 'female', 'non-binary'] as const);
  const distinguishingFeatures = [
    'a small scar above the eyebrow',
    'a nose piercing',
    'multiple ear piercings',
    'a visible tattoo on their arm',
    'freckles across their nose',
    'thick-rimmed glasses',
    'a friendly smile',
    'tired eyes',
    'a nervous habit of checking their phone',
    'expensive-looking watch',
    'worn-out shoes',
    'a distinctive laugh',
    'always seems distracted',
    'has earbuds in',
    'carrying a large bag',
    'holding a coffee cup',
  ];

  const build = randomFrom(buildTypes);
  const height = randomFrom(heightBands);
  return {
    gender,
    hair: `${randomFrom(hairColors)} ${randomFrom(hairStyles)} hair`,
    eyes: `${randomFrom(eyeColors)} eyes`,
    build,
    height,
    weightKg: rollWeightKg(height, build),
    clothing: randomFrom(clothingStyles),
    distinguishing: randomFrom(distinguishingFeatures),
  };
}

export function generateGenericNPCName(gender: 'male' | 'female' | 'non-binary'): string {
  let firstName: string;
  if (gender === 'male') {
    firstName = randomFrom(firstNamesMale);
  } else if (gender === 'female') {
    firstName = randomFrom(firstNamesFemale);
  } else {
    firstName = randomFrom(firstNamesNeutral);
  }
  return `${firstName} ${randomFrom(lastNames)}`;
}

export function generateGenericNPC(
  locationId: string,
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night',
  existingNPCIds: Set<string>
): NPC | null {
  const template = locationNPCTemplates[locationId];
  if (!template) return null;

  const appearance = generateAppearance();
  const name = generateGenericNPCName(appearance.gender);
  const occupation = randomFrom(template.occupations);
  const activities = template.activities[timePeriod] || template.activities.afternoon;
  const activity = randomFrom(activities);
  const traits = randomFrom(template.traits);
  const age = randomInRange(...template.ageRange);
  const wealth = randomInRange(...template.wealthRange);

  // Generate unique ID
  const baseId = `npc_generic_${name.toLowerCase().replace(/[^a-z]/g, '_')}_${Date.now()}`;
  let id = baseId;
  let counter = 0;
  while (existingNPCIds.has(id)) {
    counter++;
    id = `${baseId}_${counter}`;
  }

  const description = `A ${age}-year-old ${appearance.height} ${appearance.build} ${appearance.gender === 'non-binary' ? 'person' : appearance.gender === 'male' ? 'man' : 'woman'} (~${appearance.weightKg}kg) with ${appearance.hair} and ${appearance.eyes}. Dressed in ${appearance.clothing} style, ${appearance.distinguishing}.`;

  const emotionalStates: EmotionalState[] = ['calm', 'anxious', 'happy', 'sad', 'vigilant', 'content'];
  const conflictStyles: ConflictStyle[] = ['AVOIDANT', 'PASSIVE_AGGRESSIVE', 'NEGOTIATIVE', 'DOMINANT', 'MORALISTIC', 'RESIGNED'];
  const escalationStates: EscalationState[] = ['POLITE_DISTANCE', 'GUARDED_HONESTY'];

  const npc: NPC = {
    id,
    identity: {
      selfStory: `Just a ${occupation.toLowerCase()} going about their day`,
      identityThreat: 'Being disrespected or bothered unnecessarily',
      restorationBehavior: 'Walk away or ignore',
    },
    needs: [
      { type: 'survival', satisfaction: randomInRange(50, 90), priority: 1, description: 'Get through the day' },
      { type: 'stability', satisfaction: randomInRange(40, 80), priority: 2, description: 'Maintain routine' },
      { type: 'belonging', satisfaction: randomInRange(30, 70), priority: 3, description: 'Connect with others' },
    ] as NPCNeed[],
    threatModel: {
      fears: ['confrontation', 'embarrassment', 'being late'],
      detectionTriggers: ['aggressive behavior', 'invasion of personal space'],
      defaultDefense: 'avoidance',
    },
    socialRanking: {
      player: { trust: 0, utility: 0, fear: 0, intimacy: 0 },
    },
    emotionalState: {
      current: randomFrom(emotionalStates),
      baseline: 'calm',
      scarEmotion: 'anxious',
      scarTriggers: [],
    },
    knownFacts: [
      { fact: `Works as a ${occupation.toLowerCase()}`, reliability: 'witnessed', shareCondition: 'freely shares' },
    ],
    meta: {
      name,
      age,
      occupation,
      homeLocation: locationId,
      description,
      stats: { health: 100, energy: randomInRange(40, 90), mood: randomInRange(40, 80), wealth },
      traits: traits as Trait[],
      schedule: {},
      desires: ['finish errands', 'relax', 'meet someone interesting'],
      secrets: [],
    },
    memory: [],
    relationships: {
      player: { affection: 0, trust: 0, fear: 0, respect: 0 },
    },
    currentLocation: locationId,
    currentActivity: activity,
    conflictStyle: randomFrom(conflictStyles),
    escalationState: randomFrom(escalationStates),
    stressLevel: randomInRange(10, 50),
    // Flag to identify as generic NPC
    isGeneric: true,
    appearance,
  } as NPC & { isGeneric: boolean; appearance: GeneratedAppearance };

  return npc;
}

// Spawn rate by location and time (number of generic NPCs)
export const spawnRates: Record<string, Record<string, [number, number]>> = {
  market: {
    morning: [2, 5],
    afternoon: [4, 8],
    evening: [3, 6],
    night: [0, 2],
  },
  town_square: {
    morning: [1, 4],
    afternoon: [3, 7],
    evening: [2, 5],
    night: [0, 2],
  },
  university_district: {
    morning: [3, 6],
    afternoon: [4, 8],
    evening: [2, 5],
    night: [1, 3],
  },
  tavern_main: {
    morning: [0, 2],
    afternoon: [1, 3],
    evening: [4, 8],
    night: [3, 6],
  },
  mid_residential: {
    morning: [1, 3],
    afternoon: [1, 2],
    evening: [2, 4],
    night: [0, 1],
  },
  decaying_sector: {
    morning: [0, 2],
    afternoon: [1, 3],
    evening: [2, 4],
    night: [2, 5],
  },
  alley: {
    morning: [0, 1],
    afternoon: [0, 2],
    evening: [1, 3],
    night: [1, 4],
  },
};

export function getSpawnCount(locationId: string, timePeriod: string): number {
  const rates = spawnRates[locationId]?.[timePeriod] || [0, 2];
  return randomInRange(rates[0], rates[1]);
}

// Random encounter types
export interface RandomEncounter {
  id: string;
  type: 'friendly' | 'neutral' | 'tense' | 'dangerous';
  description: string;
  npc?: NPC;
  options: string[];
}

export const encounterTemplates: Record<string, RandomEncounter[]> = {
  market: [
    { id: 'lost_tourist', type: 'friendly', description: 'A confused-looking tourist approaches you with a map.', options: ['help', 'ignore', 'misdirect'] },
    { id: 'street_vendor', type: 'neutral', description: 'An enthusiastic vendor waves you over to check out their goods.', options: ['browse', 'politely decline', 'ask about rumors'] },
    { id: 'pickpocket', type: 'tense', description: 'You notice someone getting a bit too close to your belongings.', options: ['confront', 'move away', 'grab their wrist'] },
  ],
  town_square: [
    { id: 'street_performer', type: 'friendly', description: 'A talented street performer draws a crowd with their act.', options: ['watch', 'tip', 'walk past'] },
    { id: 'protester', type: 'neutral', description: 'Someone hands you a flyer about a local cause.', options: ['take it', 'refuse', 'ask questions'] },
    { id: 'suspicious_person', type: 'tense', description: 'Someone seems to be following you through the square.', options: ['confront', 'lose them in crowd', 'find a cop'] },
  ],
  university_district: [
    { id: 'survey_student', type: 'friendly', description: 'A student asks if you have time for a quick survey.', options: ['help', 'decline', 'ask what its about'] },
    { id: 'lost_freshman', type: 'friendly', description: 'A wide-eyed freshman asks for directions.', options: ['help', 'shrug', 'walk them there'] },
    { id: 'dealer', type: 'dangerous', description: 'Someone sidles up offering to sell you "study aids."', options: ['decline firmly', 'ask what they have', 'report them'] },
  ],
  decaying_sector: [
    { id: 'homeless_plea', type: 'neutral', description: 'A homeless person asks if you can spare some change.', options: ['give money', 'offer food', 'ignore', 'talk to them'] },
    { id: 'gang_member', type: 'dangerous', description: 'Someone steps out of the shadows, eyeing you suspiciously.', options: ['nod respectfully', 'keep walking', 'run', 'stand your ground'] },
    { id: 'lost_kid', type: 'tense', description: 'A young kid who looks lost and scared catches your eye.', options: ['help them', 'mind your business', 'call authorities'] },
  ],
};

export function generateRandomEncounter(locationId: string): RandomEncounter | null {
  const templates = encounterTemplates[locationId];
  if (!templates || templates.length === 0) return null;
  
  // 30% chance of an encounter
  if (Math.random() > 0.3) return null;
  
  return { ...randomFrom(templates), id: `encounter_${Date.now()}` };
}

// ============= HOSTILE NPC SYSTEM =============

// Locations considered dangerous, especially at night
export const dangerousLocations: Record<string, {
  dangerLevel: number; // 0-100
  nightMultiplier: number; // How much more dangerous at night
  hostileTypes: string[];
  combatChance: number; // Base chance of combat encounter
}> = {
  alley: {
    dangerLevel: 70,
    nightMultiplier: 2.0,
    hostileTypes: ['Mugger', 'Gang Member', 'Desperate Thief', 'Drug Addict'],
    combatChance: 0.4,
  },
  decaying_sector: {
    dangerLevel: 60,
    nightMultiplier: 1.8,
    hostileTypes: ['Gang Member', 'Desperate Criminal', 'Violent Vagrant', 'Thug'],
    combatChance: 0.3,
  },
  abandoned_warehouse: {
    dangerLevel: 80,
    nightMultiplier: 1.5,
    hostileTypes: ['Squatter', 'Gang Enforcer', 'Drug Dealer Guard', 'Hired Muscle'],
    combatChance: 0.5,
  },
  docks: {
    dangerLevel: 50,
    nightMultiplier: 2.2,
    hostileTypes: ['Smuggler', 'Drunken Sailor', 'Dock Thug', 'Gang Lookout'],
    combatChance: 0.25,
  },
};

// Hostile NPC appearance descriptors
const hostileAppearance = {
  builds: ['muscular', 'wiry', 'heavyset', 'scarred'],
  clothing: ['dark hoodie', 'leather jacket', 'worn street clothes', 'gang colors'],
  features: ['cold eyes', 'broken nose', 'facial scars', 'menacing tattoos', 'hardened expression'],
  weapons: ['switchblade', 'brass knuckles', 'pipe', 'broken bottle', 'knife'],
};

export interface HostileEncounter {
  npc: NPC;
  initiativeMessage: string;
  canFlee: boolean;
  canNegotiate: boolean;
  difficultyRating: 'easy' | 'moderate' | 'hard' | 'deadly';
}

export function generateHostileNPC(
  locationId: string,
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night'
): NPC | null {
  const dangerInfo = dangerousLocations[locationId];
  if (!dangerInfo) return null;
  
  const appearance = generateAppearance();
  const hostileType = randomFrom(dangerInfo.hostileTypes);
  const name = generateGenericNPCName(appearance.gender);
  const build = randomFrom(hostileAppearance.builds);
  const clothing = randomFrom(hostileAppearance.clothing);
  const feature = randomFrom(hostileAppearance.features);
  const weapon = randomFrom(hostileAppearance.weapons);
  
  const age = randomInRange(18, 45);
  const description = `A ${appearance.height} ${build} ${appearance.gender === 'non-binary' ? 'person' : appearance.gender === 'male' ? 'man' : 'woman'} (~${appearance.weightKg}kg) with ${feature}, wearing ${clothing}. They carry what looks like a ${weapon}.`;
  
  const id = `npc_hostile_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  
  // Hostile NPCs have aggressive traits
  const hostileTraits: Trait[] = ['aggressive', 'cunning', 'greedy'];
  
  const npc: NPC = {
    id,
    identity: {
      selfStory: `A ${hostileType.toLowerCase()} who takes what they want`,
      identityThreat: 'Being seen as weak or losing face',
      restorationBehavior: 'Violence or intimidation',
    },
    needs: [
      { type: 'survival', satisfaction: 30, priority: 1, description: 'Get money by any means' },
      { type: 'status', satisfaction: 40, priority: 2, description: 'Maintain street cred' },
    ],
    threatModel: {
      fears: ['police', 'stronger opponents', 'witnesses'],
      detectionTriggers: ['easy target', 'visible wealth'],
      defaultDefense: 'confrontation',
    },
    socialRanking: {
      player: { trust: -50, utility: 50, fear: 0, intimacy: 0 },
    },
    emotionalState: {
      current: 'vigilant',
      baseline: 'angry',
      scarEmotion: 'bitter',
      scarTriggers: [],
    },
    knownFacts: [],
    meta: {
      name: `${hostileType} (${name.split(' ')[0]})`,
      age,
      occupation: hostileType,
      homeLocation: locationId,
      description,
      stats: { 
        health: randomInRange(60, 100), 
        energy: randomInRange(50, 80), 
        mood: randomInRange(20, 40), 
        wealth: randomInRange(5, 50) 
      },
      traits: hostileTraits,
      schedule: {},
      desires: ['get money', 'show dominance', 'survive'],
      secrets: [],
    },
    memory: [],
    relationships: {
      player: { affection: -30, trust: -50, fear: 0, respect: 0 },
    },
    currentLocation: locationId,
    currentActivity: timePeriod === 'night' ? 'lurking in shadows' : 'hanging around menacingly',
    conflictStyle: 'DOMINANT' as ConflictStyle,
    escalationState: 'OPEN_HOSTILITY' as EscalationState,
    stressLevel: randomInRange(40, 70),
    isGeneric: true,
    isHostile: true,
    appearance,
  } as NPC & { isGeneric: boolean; isHostile: boolean; appearance: GeneratedAppearance };
  
  return npc;
}

export function shouldTriggerHostileEncounter(
  locationId: string,
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night',
  playerStats?: { health: number; energy: number }
): boolean {
  const dangerInfo = dangerousLocations[locationId];
  if (!dangerInfo) return false;
  
  // Base chance
  let chance = dangerInfo.combatChance;
  
  // Night multiplier
  if (timePeriod === 'night') {
    chance *= dangerInfo.nightMultiplier;
  } else if (timePeriod === 'evening') {
    chance *= 1.3;
  } else if (timePeriod === 'morning') {
    chance *= 0.5; // Safer in daylight
  }
  
  // Low player stats make them look like easier targets
  if (playerStats) {
    if (playerStats.health < 50) chance *= 1.3;
    if (playerStats.energy < 30) chance *= 1.2;
  }
  
  // Cap at 80%
  chance = Math.min(0.8, chance);
  
  return Math.random() < chance;
}

export function generateHostileEncounter(
  locationId: string,
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'night'
): HostileEncounter | null {
  const hostileNPC = generateHostileNPC(locationId, timePeriod);
  if (!hostileNPC) return null;
  
  const dangerInfo = dangerousLocations[locationId];
  
  // Generate initiative message based on time and location
  const nightMessages = [
    `A shadowy figure emerges from the darkness, blocking your path.`,
    `"Hey, you! Stop right there!" A threatening voice calls out from the shadows.`,
    `You hear footsteps behind you. Before you can react, someone is in front of you.`,
    `"Nice night for a walk, huh?" The voice drips with malice as a figure steps forward.`,
  ];
  
  const dayMessages = [
    `Someone approaches you with hostile intent, eyeing your belongings.`,
    `"You don't belong here." A figure moves to intercept you.`,
    `A rough-looking individual steps into your path, sizing you up.`,
  ];
  
  const initiativeMessage = timePeriod === 'night' 
    ? randomFrom(nightMessages)
    : randomFrom(dayMessages);
  
  // Determine difficulty based on danger level
  let difficultyRating: 'easy' | 'moderate' | 'hard' | 'deadly';
  if (dangerInfo.dangerLevel >= 75) {
    difficultyRating = 'hard';
  } else if (dangerInfo.dangerLevel >= 50) {
    difficultyRating = 'moderate';
  } else {
    difficultyRating = 'easy';
  }
  
  // Night encounters are harder to flee from
  const canFlee = timePeriod !== 'night' || Math.random() > 0.3;
  
  // Can negotiate in daytime or if not too aggressive
  const canNegotiate = timePeriod !== 'night' && Math.random() > 0.4;
  
  return {
    npc: hostileNPC,
    initiativeMessage,
    canFlee,
    canNegotiate,
    difficultyRating,
  };
}
