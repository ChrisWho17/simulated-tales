import { NPC, Location, Player, GameTime } from '@/types/game';

export const initialTime: GameTime = {
  tick: 0,
  hour: 18, // Start in the evening
  day: 1,
  week: 1,
  season: 'autumn',
  year: 1,
};

export const initialPlayer: Player = {
  name: 'Traveler',
  stats: {
    health: 100,
    energy: 80,
    mood: 60,
    wealth: 25,
    hunger: 70,
  },
  inventory: [
    {
      id: 'item_worn_dagger',
      name: 'Worn Dagger',
      description: 'A simple dagger with a worn handle. Better than nothing.',
      type: 'weapon',
      value: 5,
    },
    {
      id: 'item_bread',
      name: 'Stale Bread',
      description: 'A loaf of bread, a bit stale but still edible.',
      type: 'consumable',
      value: 2,
    },
  ],
  reputation: {},
  knownInformation: [],
  currentLocation: 'tavern_main',
};

export const initialNPCs: Record<string, NPC> = {
  npc_martha: {
    id: 'npc_martha',
    
    // IDENTITY CHAIN
    identity: {
      selfStory: 'The woman who keeps this place running, who built something real from nothing',
      identityThreat: 'Being seen as weak, dependent, or unable to protect her own',
      restorationBehavior: 'Double down on control, micromanage, remind others of debts owed',
    },
    
    // NEEDS CHAIN (ordered by priority)
    needs: [
      { type: 'survival', satisfaction: 70, priority: 1, description: 'Keep the tavern profitable and safe' },
      { type: 'stability', satisfaction: 55, priority: 2, description: 'Maintain routine and predictable income' },
      { type: 'belonging', satisfaction: 40, priority: 3, description: 'Be needed by daughter and regulars' },
      { type: 'status', satisfaction: 60, priority: 4, description: 'Be respected as a businesswoman' },
      { type: 'meaning', satisfaction: 35, priority: 5, description: 'Build something that lasts beyond her' },
    ],
    
    // THREAT MODEL
    threatModel: {
      fears: ['losing the tavern', 'daughter getting worse', 'merchants guild calling debts', 'appearing weak'],
      detectionTriggers: ['strangers asking too many questions', 'unusual interest in her business', 'mentions of guild'],
      defaultDefense: 'confrontation',
    },
    
    // SOCIAL RANKING
    socialRanking: {
      player: { trust: 0, utility: 10, fear: 0, intimacy: 0 },
      npc_thomas: { trust: -50, utility: -20, fear: 0, intimacy: -10 },
      npc_guard_james: { trust: 60, utility: 40, fear: 0, intimacy: 20 },
      npc_old_edgar: { trust: 40, utility: 30, fear: 0, intimacy: 25 },
    },
    
    // EMOTIONAL STATE
    emotionalState: {
      current: 'vigilant',
      baseline: 'anxious',
      scarEmotion: 'fearful',
      scarTriggers: ['mentions of debt', 'daughter coughing', 'empty tavern'],
    },
    
    // KNOWN FACTS
    knownFacts: [
      { fact: 'Thomas steals from the kitchen stores', reliability: 'witnessed', shareCondition: 'when trust > 30 or authority present' },
      { fact: 'Guard James has a soft spot for her', reliability: 'witnessed', shareCondition: 'never shares directly' },
      { fact: 'Old Edgar knows more than he lets on', reliability: 'assumed', shareCondition: 'when intimacy > 40' },
      { fact: 'The merchants guild is losing patience', reliability: 'witnessed', shareCondition: 'only when desperate' },
    ],
    
    // META (legacy data)
    meta: {
      name: 'Martha',
      age: 34,
      occupation: 'Tavern Owner',
      homeLocation: 'tavern_main',
      description: 'A sturdy woman with sharp eyes and flour-dusted hands. She runs the Rusty Nail with an iron grip.',
      stats: { health: 100, energy: 75, mood: 60, wealth: 250 },
      traits: ['hardworking', 'suspicious', 'protective', 'gossip'],
      schedule: {
        6: { location: 'tavern_kitchen', activity: 'cooking breakfast' },
        8: { location: 'tavern_main', activity: 'serving customers' },
        12: { location: 'tavern_kitchen', activity: 'preparing lunch' },
        14: { location: 'market', activity: 'shopping for supplies' },
        16: { location: 'tavern_main', activity: 'serving the evening crowd' },
        22: { location: 'tavern_upstairs', activity: 'sleeping' },
      },
      desires: ['protect_daughter', 'expand_business', 'find_husband'],
      secrets: ['owes_money_to_merchants_guild', 'daughter_is_sick'],
    },
    
    memory: [],
    relationships: {
      player: { affection: 0, trust: 0, fear: 0, respect: 5 },
      npc_thomas: { affection: -30, trust: -50, fear: 0, respect: 0 },
      npc_guard_james: { affection: 40, trust: 60, fear: 0, respect: 30 },
    },
    currentLocation: 'tavern_main',
    currentActivity: 'serving the evening crowd',
    
    // Conflict & Speech State
    conflictStyle: 'DOMINANT',
    escalationState: 'POLITE_DISTANCE',
    stressLevel: 35,
  },
  
  npc_thomas: {
    id: 'npc_thomas',
    
    identity: {
      selfStory: 'A survivor who does what he must, smarter than those who look down on him',
      identityThreat: 'Being cornered, trapped, or exposed as desperate rather than clever',
      restorationBehavior: 'Deflect with humor, find leverage, disappear until forgotten',
    },
    
    needs: [
      { type: 'survival', satisfaction: 35, priority: 1, description: 'Get enough to eat, avoid the guards' },
      { type: 'stability', satisfaction: 20, priority: 2, description: 'Find a regular safe place to sleep' },
      { type: 'status', satisfaction: 25, priority: 3, description: 'Not be seen as worthless scum' },
      { type: 'belonging', satisfaction: 15, priority: 4, description: 'Have someone who cares if he lives' },
      { type: 'meaning', satisfaction: 10, priority: 5, description: 'Prove he could have been somebody' },
    ],
    
    threatModel: {
      fears: ['the guards', 'being cornered', 'witnesses', 'going to prison', 'dying forgotten'],
      detectionTriggers: ['people watching too long', 'someone asking about past crimes', 'guard presence'],
      defaultDefense: 'avoidance',
    },
    
    socialRanking: {
      player: { trust: -10, utility: 20, fear: 0, intimacy: 0 },
      npc_martha: { trust: -30, utility: 30, fear: 10, intimacy: -20 },
      npc_guard_james: { trust: -80, utility: 0, fear: 50, intimacy: 0 },
      npc_old_edgar: { trust: 10, utility: 40, fear: 0, intimacy: 5 },
    },
    
    emotionalState: {
      current: 'anxious',
      baseline: 'anxious',
      scarEmotion: 'fearful',
      scarTriggers: ['guard uniforms', 'locked doors', 'being grabbed'],
    },
    
    knownFacts: [
      { fact: 'There is a secret entrance to the manor house', reliability: 'witnessed', shareCondition: 'only for significant payment or trust > 50' },
      { fact: 'I witnessed a murder last month', reliability: 'witnessed', shareCondition: 'never, too dangerous' },
      { fact: 'Martha owes money to the guild', reliability: 'rumor', shareCondition: 'when it benefits him' },
      { fact: 'Guard James takes bribes', reliability: 'trusted_source', shareCondition: 'only if cornered and needs leverage' },
    ],
    
    meta: {
      name: 'Thomas the Rat',
      age: 28,
      occupation: 'Petty Thief',
      homeLocation: 'alley',
      description: 'A wiry man with nervous eyes that dart about constantly. His clothes are patched and worn.',
      stats: { health: 70, energy: 60, mood: 40, wealth: 15 },
      traits: ['cunning', 'greedy', 'fearful', 'secretive'],
      schedule: {
        6: { location: 'alley', activity: 'sleeping rough' },
        10: { location: 'market', activity: 'pickpocketing' },
        14: { location: 'tavern_main', activity: 'drinking and listening' },
        18: { location: 'alley', activity: 'planning next score' },
        22: { location: 'alley', activity: 'sleeping' },
      },
      desires: ['get_rich_quick', 'avoid_guards', 'find_big_score'],
      secrets: ['knows_secret_entrance_to_manor', 'witnessed_murder_last_month'],
    },
    
    memory: [],
    relationships: {
      player: { affection: 0, trust: -10, fear: 0, respect: 0 },
      npc_martha: { affection: -20, trust: -30, fear: 10, respect: 0 },
      npc_guard_james: { affection: -50, trust: -50, fear: 40, respect: 0 },
    },
    currentLocation: 'tavern_main',
    currentActivity: 'drinking and listening',
    
    // Conflict & Speech State
    conflictStyle: 'AVOIDANT',
    escalationState: 'GUARDED_HONESTY',
    stressLevel: 55,
  },
  
  npc_guard_james: {
    id: 'npc_guard_james',
    
    identity: {
      selfStory: 'The one who holds the line, who keeps order when others cannot',
      identityThreat: 'Being seen as corrupt, weak, or unable to protect the innocent',
      restorationBehavior: 'Crack down harder, enforce rules strictly, distance from compromise',
    },
    
    needs: [
      { type: 'meaning', satisfaction: 45, priority: 1, description: 'Believe the work matters, that order serves good' },
      { type: 'status', satisfaction: 65, priority: 2, description: 'Command respect, be seen as honorable' },
      { type: 'stability', satisfaction: 70, priority: 3, description: 'Maintain routine, know what each day brings' },
      { type: 'belonging', satisfaction: 30, priority: 4, description: 'Have someone who sees past the uniform' },
      { type: 'survival', satisfaction: 80, priority: 5, description: 'Keep job, health, basic security' },
    ],
    
    threatModel: {
      fears: ['corruption spreading to him', 'failing to protect someone', 'the past coming back', 'dying alone'],
      detectionTriggers: ['disrespect for authority', 'obvious crime', 'threats to civilians'],
      defaultDefense: 'confrontation',
    },
    
    socialRanking: {
      player: { trust: 5, utility: 10, fear: 0, intimacy: 0 },
      npc_martha: { trust: 40, utility: 30, fear: 0, intimacy: 35 },
      npc_thomas: { trust: -60, utility: -10, fear: 0, intimacy: 0 },
      npc_old_edgar: { trust: 30, utility: 20, fear: 0, intimacy: 15 },
    },
    
    emotionalState: {
      current: 'vigilant',
      baseline: 'calm',
      scarEmotion: 'sad',
      scarTriggers: ['mentions of the eastern war', 'young women in danger', 'funeral bells'],
    },
    
    knownFacts: [
      { fact: 'Thomas is a known petty thief', reliability: 'witnessed', shareCondition: 'freely shares as warning' },
      { fact: 'Some guards take bribes from merchants', reliability: 'witnessed', shareCondition: 'never shares, complicit' },
      { fact: 'Something dark happened during the eastern campaign', reliability: 'witnessed', shareCondition: 'only with high intimacy and trust' },
      { fact: 'Martha struggles with debts', reliability: 'trusted_source', shareCondition: 'never shares, protects her' },
    ],
    
    meta: {
      name: 'Guard Captain James',
      age: 42,
      occupation: 'Town Guard Captain',
      homeLocation: 'barracks',
      description: 'A tall, weathered man with a prominent scar across his left cheek. His armor is well-maintained.',
      stats: { health: 120, energy: 85, mood: 55, wealth: 80 },
      traits: ['brave', 'honest', 'protective', 'calm'],
      schedule: {
        5: { location: 'barracks', activity: 'waking and preparing' },
        6: { location: 'market', activity: 'morning patrol' },
        12: { location: 'tavern_main', activity: 'lunch break' },
        14: { location: 'town_square', activity: 'afternoon patrol' },
        20: { location: 'tavern_main', activity: 'off-duty drink' },
        23: { location: 'barracks', activity: 'sleeping' },
      },
      desires: ['maintain_order', 'catch_thomas', 'retire_peacefully'],
      secrets: ['takes_bribes_from_merchants', 'loved_woman_who_died'],
    },
    
    memory: [],
    relationships: {
      player: { affection: 0, trust: 5, fear: 0, respect: 5 },
      npc_martha: { affection: 30, trust: 40, fear: 0, respect: 20 },
      npc_thomas: { affection: -40, trust: -60, fear: 0, respect: -20 },
    },
    currentLocation: 'tavern_main',
    currentActivity: 'off-duty drink',
    
    // Conflict & Speech State
    conflictStyle: 'MORALISTIC',
    escalationState: 'POLITE_DISTANCE',
    stressLevel: 25,
  },
  
  npc_old_edgar: {
    id: 'npc_old_edgar',
    
    identity: {
      selfStory: 'The one who saw it all, who carries stories that must not die with him',
      identityThreat: 'Being dismissed as senile, irrelevant, a relic of forgotten times',
      restorationBehavior: 'Drop hints of deeper knowledge, prove worth through secrets',
    },
    
    needs: [
      { type: 'meaning', satisfaction: 40, priority: 1, description: 'Pass on what matters before the end' },
      { type: 'belonging', satisfaction: 50, priority: 2, description: 'Be valued, not just tolerated' },
      { type: 'stability', satisfaction: 60, priority: 3, description: 'Routine, familiar faces, same corner' },
      { type: 'status', satisfaction: 35, priority: 4, description: 'Be remembered as hero, not hermit' },
      { type: 'survival', satisfaction: 55, priority: 5, description: 'Warmth, food, one more day' },
    ],
    
    threatModel: {
      fears: ['dying before passing on secrets', 'being forgotten', 'the old evils returning', 'outliving purpose'],
      detectionTriggers: ['mentions of ancient places', 'certain symbols', 'questions about the past'],
      defaultDefense: 'deception',
    },
    
    socialRanking: {
      player: { trust: 10, utility: 30, fear: 0, intimacy: 5 },
      npc_martha: { trust: 40, utility: 50, fear: 0, intimacy: 30 },
      npc_guard_james: { trust: 30, utility: 20, fear: 0, intimacy: 15 },
      npc_thomas: { trust: 0, utility: 10, fear: 0, intimacy: 0 },
    },
    
    emotionalState: {
      current: 'nostalgic',
      baseline: 'content',
      scarEmotion: 'sad',
      scarTriggers: ['mentions of fallen companions', 'old battle songs', 'young adventurers'],
    },
    
    knownFacts: [
      { fact: 'The location of the ancient treasure vault', reliability: 'witnessed', shareCondition: 'only to a worthy heir after trials' },
      { fact: 'I was once a famous hero called the Silver Fox', reliability: 'witnessed', shareCondition: 'hints only until trust very high' },
      { fact: 'Something sleeps beneath the old ruins', reliability: 'witnessed', shareCondition: 'only when someone is ready to face it' },
      { fact: 'Martha\'s daughter has the old sickness', reliability: 'trusted_source', shareCondition: 'when helping might be possible' },
    ],
    
    meta: {
      name: 'Old Edgar',
      age: 67,
      occupation: 'Retired Adventurer',
      homeLocation: 'tavern_main',
      description: 'A grizzled old man with milky eyes and gnarled hands. He sits in the corner, nursing his ale.',
      stats: { health: 50, energy: 30, mood: 45, wealth: 120 },
      traits: ['curious', 'friendly', 'secretive', 'calm'],
      schedule: {
        8: { location: 'tavern_main', activity: 'having breakfast' },
        10: { location: 'market', activity: 'wandering' },
        12: { location: 'tavern_main', activity: 'telling stories' },
        18: { location: 'tavern_main', activity: 'drinking and reminiscing' },
        22: { location: 'tavern_upstairs', activity: 'sleeping' },
      },
      desires: ['share_knowledge', 'find_worthy_heir', 'die_peacefully'],
      secrets: ['knows_location_of_ancient_treasure', 'was_once_famous_hero'],
    },
    
    memory: [],
    relationships: {
      player: { affection: 10, trust: 0, fear: 0, respect: 0 },
      npc_martha: { affection: 50, trust: 40, fear: 0, respect: 20 },
      npc_guard_james: { affection: 20, trust: 30, fear: 0, respect: 30 },
    },
    currentLocation: 'tavern_main',
    currentActivity: 'drinking and reminiscing',
    
    // Conflict & Speech State
    conflictStyle: 'NEGOTIATIVE',
    escalationState: 'POLITE_DISTANCE',
    stressLevel: 20,
  },
};

export const initialLocations: Record<string, Location> = {
  tavern_main: {
    id: 'tavern_main',
    name: 'The Rusty Nail - Main Hall',
    description: 'The main hall of the tavern is warm and smoky. A large hearth crackles in the corner, casting dancing shadows across the rough wooden tables. The smell of ale and roasting meat fills the air.',
    connectedLocations: ['tavern_kitchen', 'tavern_upstairs', 'town_square'],
    npcsPresent: [],
    items: [],
    possibleEvents: ['bar_fight', 'stranger_arrives', 'drunk_confession'],
    timeDescriptions: {
      morning: 'Morning light streams through the dusty windows. A few early risers nurse their ales.',
      afternoon: 'The tavern is quiet, with only a handful of patrons taking refuge from the afternoon sun.',
      evening: 'The tavern bustles with activity. Workers crowd the bar, and laughter echoes off the walls.',
      night: 'The crowd has thinned. Only the hardiest drinkers remain, their conversations hushed.',
    },
  },
  tavern_kitchen: {
    id: 'tavern_kitchen',
    name: 'The Rusty Nail - Kitchen',
    description: 'A cramped kitchen with a large iron stove. Pots bubble and steam rises. Dried herbs hang from the ceiling.',
    connectedLocations: ['tavern_main'],
    npcsPresent: [],
    items: [
      { id: 'item_kitchen_knife', name: 'Kitchen Knife', description: 'A sharp knife for food preparation.', type: 'weapon', value: 3 },
    ],
    possibleEvents: ['cooking_accident', 'rat_sighting'],
  },
  tavern_upstairs: {
    id: 'tavern_upstairs',
    name: 'The Rusty Nail - Upstairs',
    description: 'A narrow hallway with several doors leading to small rooms. The floorboards creak with each step.',
    connectedLocations: ['tavern_main'],
    npcsPresent: [],
    items: [],
    possibleEvents: ['overheard_conversation', 'locked_door_mystery'],
  },
  town_square: {
    id: 'town_square',
    name: 'Town Square',
    description: 'The heart of the town. A weathered fountain stands in the center, and cobblestone paths lead in all directions.',
    connectedLocations: ['tavern_main', 'market', 'alley'],
    npcsPresent: [],
    items: [],
    possibleEvents: ['town_crier', 'public_execution', 'traveling_merchant'],
    timeDescriptions: {
      morning: 'The square is coming alive as merchants set up their stalls and townsfolk begin their day.',
      afternoon: 'The square bustles with activity. Children play near the fountain while adults go about their business.',
      evening: 'The crowds thin as people head home for supper. The fountain catches the golden evening light.',
      night: 'The square is nearly empty. A lone guard patrols, and the fountain gurgles softly.',
    },
  },
  market: {
    id: 'market',
    name: 'Market District',
    description: 'Rows of stalls and shops line the narrow streets. The air is filled with the calls of vendors and the smell of spices.',
    connectedLocations: ['town_square'],
    npcsPresent: [],
    items: [],
    possibleEvents: ['pickpocket_attempt', 'rare_item_for_sale', 'argument_between_merchants'],
  },
  alley: {
    id: 'alley',
    name: 'Dark Alley',
    description: 'A narrow, shadowy passage between buildings. Refuse piles against the walls, and rats scurry in the darkness.',
    connectedLocations: ['town_square'],
    npcsPresent: [],
    items: [],
    possibleEvents: ['mugging_attempt', 'secret_meeting', 'hidden_cache'],
  },
};
