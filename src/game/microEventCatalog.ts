// =============================================================================
// MICRO-EVENTS CATALOG - 175 tiny world-flavor events
// Genre-universal, tagged for context-sensitive selection
// =============================================================================

// GameGenre type used for context matching

// =============================================================================
// CONFIGURATION KNOBS
// =============================================================================

export interface MicroEventConfig {
  maxMicroEventWords: { min: number; max: number };
  repeatBlockTurns: number;
  triggerChanceBase: number;
  triggerChancePerTurn: number;
  tensionMultiplier: Record<number, number>;
}

export const MICRO_EVENT_CONFIG: MicroEventConfig = {
  // Word limit for micro-event text (12-25 words ideal)
  maxMicroEventWords: { min: 12, max: 25 },
  // Don't reuse same event ID for this many turns
  repeatBlockTurns: 20,
  // Base chance to trigger (5%)
  triggerChanceBase: 0.05,
  // Additional chance per turn since last micro-event
  triggerChancePerTurn: 0.02,
  // Tension tier affects selection weight
  tensionMultiplier: {
    1: 1.5,  // Low tension = more common events
    2: 1.2,
    3: 1.0,
    4: 0.8,
    5: 0.5,  // High tension = rarer, impactful events
  }
};

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type MicroEventLocation = 
  | 'café' | 'street' | 'apartment' | 'park' | 'shop' | 'transit'
  | 'workplace' | 'building' | 'alley' | 'plaza' | 'market'
  | 'neighborhood' | 'home' | 'hallway' | 'lobby' | 'stairwell'
  | 'storefront' | 'intersection' | 'parking_lot' | 'anywhere';

export type MicroEventTimeOfDay = 
  | 'morning' | 'afternoon' | 'evening' | 'dusk' | 'night' | 'late_night' | 'any';

export type MicroEventTensionTier = 1 | 2 | 3 | 4 | 5;

export type MicroEventGenre = 
  | 'slice_of_life' | 'mystery' | 'noir' | 'thriller' | 'horror_lite'
  | 'comedy' | 'drama' | 'surreal' | 'romance' | 'suspense'
  | 'fantasy_lean' | 'sci_fi_lean' | 'supernatural_lean' | 'adventure'
  | 'wholesome' | 'office' | 'universal';

export type MicroEventCast = 
  | 'player' | 'stranger' | 'barista' | 'neighbor' | 'child' | 'guardian'
  | 'animal' | 'cashier' | 'coworker' | 'busker' | 'vendor' | 'clerk'
  | 'friend' | 'authority' | 'preacher' | 'commuter' | 'bystanders'
  | 'patrons' | 'crowd' | 'unknown';

export interface CatalogMicroEvent {
  id: string;
  text: string;
  location: MicroEventLocation;
  timeOfDay: MicroEventTimeOfDay;
  tensionTier: MicroEventTensionTier;
  genre: MicroEventGenre;
  cast: MicroEventCast[];
  // Optional context hints for weather/mood matching
  contextHints?: string[];
  // For narrator to adapt
  reskinnable?: boolean;
}

// =============================================================================
// GENRE VARIABLE MAPPINGS (for reskinning)
// =============================================================================

export interface GenreVariables {
  stranger: string;
  drink: string;
  currency: string;
  animal: string;
  vehicle: string;
  device: string;
  workplace: string;
  dwelling: string;
  authority: string;
  timeVerb: string;
  mysteryObject: string;
}

export const GENRE_VARIABLES: Record<string, GenreVariables> = {
  fantasy: {
    stranger: 'hooded traveler',
    drink: 'mead',
    currency: 'coin',
    animal: 'raven',
    vehicle: 'cart',
    device: 'charm',
    workplace: 'guild hall',
    dwelling: 'cottage',
    authority: 'guard',
    timeVerb: 'the bells toll',
    mysteryObject: 'amulet',
  },
  scifi: {
    stranger: 'off-worlder',
    drink: 'synth-coffee',
    currency: 'credits',
    animal: 'drone',
    vehicle: 'transport pod',
    device: 'comm-link',
    workplace: 'hab-module',
    dwelling: 'unit',
    authority: 'enforcer',
    timeVerb: 'the shift-change chimes',
    mysteryObject: 'data chip',
  },
  noir: {
    stranger: 'shadowy figure',
    drink: 'whiskey',
    currency: 'cash',
    animal: 'alley cat',
    vehicle: 'sedan',
    device: 'camera',
    workplace: 'office',
    dwelling: 'apartment',
    authority: 'detective',
    timeVerb: 'the clock strikes',
    mysteryObject: 'envelope',
  },
  horror: {
    stranger: 'pale stranger',
    drink: 'bitter tea',
    currency: 'offering',
    animal: 'black dog',
    vehicle: 'old car',
    device: 'radio',
    workplace: 'institution',
    dwelling: 'house',
    authority: 'watcher',
    timeVerb: 'midnight approaches',
    mysteryObject: 'photograph',
  },
  romance: {
    stranger: 'charming newcomer',
    drink: 'coffee',
    currency: 'tip',
    animal: 'stray cat',
    vehicle: 'bicycle',
    device: 'phone',
    workplace: 'studio',
    dwelling: 'flat',
    authority: 'neighbor',
    timeVerb: 'the sun sets',
    mysteryObject: 'letter',
  },
  modern: {
    stranger: 'passerby',
    drink: 'coffee',
    currency: 'change',
    animal: 'pigeon',
    vehicle: 'car',
    device: 'phone',
    workplace: 'office',
    dwelling: 'apartment',
    authority: 'security',
    timeVerb: 'your phone buzzes',
    mysteryObject: 'card',
  },
  western: {
    stranger: 'drifter',
    drink: 'whiskey',
    currency: 'coins',
    animal: 'hound',
    vehicle: 'horse',
    device: 'pocket watch',
    workplace: 'saloon',
    dwelling: 'cabin',
    authority: 'sheriff',
    timeVerb: 'the church bell rings',
    mysteryObject: 'bullet',
  },
  cyberpunk: {
    stranger: 'chrome-faced runner',
    drink: 'stim-drink',
    currency: 'crypto',
    animal: 'cyber-rat',
    vehicle: 'bike',
    device: 'implant',
    workplace: 'megacorp floor',
    dwelling: 'coffin apartment',
    authority: 'corpo security',
    timeVerb: 'the AR overlay flickers',
    mysteryObject: 'data shard',
  },
  postapocalyptic: {
    stranger: 'wanderer',
    drink: 'clean water',
    currency: 'barter goods',
    animal: 'mutant dog',
    vehicle: 'salvaged truck',
    device: 'geiger counter',
    workplace: 'settlement',
    dwelling: 'shelter',
    authority: 'patrol',
    timeVerb: 'the warning siren wails',
    mysteryObject: 'pre-war relic',
  },
  steampunk: {
    stranger: 'goggled inventor',
    drink: 'tea',
    currency: 'brass pennies',
    animal: 'clockwork bird',
    vehicle: 'airship',
    device: 'pocket automaton',
    workplace: 'workshop',
    dwelling: 'townhouse',
    authority: 'constable',
    timeVerb: 'the factory whistle blows',
    mysteryObject: 'gear mechanism',
  },
};

// =============================================================================
// WEATHER/CONTEXT MODIFIERS
// =============================================================================

export interface WeatherModifier {
  weather: string;
  textPrefix?: string;
  textSuffix?: string;
  locationBonus: MicroEventLocation[];
  tensionShift: number;
}

export const WEATHER_MODIFIERS: WeatherModifier[] = [
  {
    weather: 'rain',
    textPrefix: 'Through the rain, ',
    locationBonus: ['street', 'alley', 'transit'],
    tensionShift: 1,
  },
  {
    weather: 'fog',
    textPrefix: 'In the fog, ',
    locationBonus: ['street', 'park', 'neighborhood'],
    tensionShift: 1,
  },
  {
    weather: 'storm',
    textSuffix: ' Thunder rolls in the distance.',
    locationBonus: ['building', 'home', 'apartment'],
    tensionShift: 2,
  },
  {
    weather: 'heat',
    textSuffix: ' The heat makes everything shimmer.',
    locationBonus: ['street', 'plaza', 'market'],
    tensionShift: 0,
  },
  {
    weather: 'cold',
    textPrefix: 'In the bitter cold, ',
    locationBonus: ['café', 'shop', 'transit'],
    tensionShift: 0,
  },
];

// =============================================================================
// THE CATALOG - 175 MICRO-EVENTS
// =============================================================================

export const MICRO_EVENT_CATALOG: CatalogMicroEvent[] = [
  // ===== SLICE OF LIFE / WHOLESOME (Tier 1) =====
  {
    id: 'ME001',
    text: 'Barista remembers your order and adds an extra napkin, like they noticed something on your sleeve.',
    location: 'café',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player', 'barista'],
    reskinnable: true,
  },
  {
    id: 'ME005',
    text: 'Someone holds a door too long, smiling like they\'re waiting for you to say a secret password.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME008',
    text: 'A little kid points at you, whispers to their guardian, and both pretend they didn\'t.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player', 'child', 'guardian'],
    reskinnable: true,
  },
  {
    id: 'ME022',
    text: 'Someone left a single glove on a bench, palm-side up, as if it\'s waiting to be shaken.',
    location: 'park',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME023',
    text: 'A pigeon hops beside you for six steps, then launches straight upward like it received orders.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME027',
    text: 'A car alarm chirps once, politely, then stops, like it changed its mind.',
    location: 'parking_lot',
    timeOfDay: 'evening',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME044',
    text: 'A toddler offers you a sticker, then looks genuinely relieved when you accept it.',
    location: 'park',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'wholesome',
    cast: ['player', 'child'],
    reskinnable: true,
  },
  {
    id: 'ME054',
    text: 'A stranger\'s ringtone matches your alarm tone exactly, and both of you check your phones at once.',
    location: 'café',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME057',
    text: 'Someone says "bless you" before you sneeze, then smiles like they just won a bet.',
    location: 'anywhere',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME014',
    text: 'The vending machine eats your money, then ejects two items, as if apologizing for something bigger.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME034',
    text: 'You step in gum that wasn\'t there a moment ago, and it smells strangely like peppermint.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME140',
    text: 'The smell of rain arrives early, and everyone around you checks the sky like they heard a rumor.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player', 'bystanders'],
    contextHints: ['rain'],
    reskinnable: true,
  },
  {
    id: 'ME049',
    text: 'A bulletin board has an empty rectangle where a flyer was, edges torn like teeth marks.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },

  // ===== ATMOSPHERIC / ENVIRONMENTAL (Tier 2) =====
  {
    id: 'ME002',
    text: 'A muffled argument leaks through the wall, then stops suddenly when your floorboard creaks.',
    location: 'apartment',
    timeOfDay: 'night',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'neighbor'],
    reskinnable: true,
  },
  {
    id: 'ME003',
    text: 'The street poster changed overnight, but the glue is still tacky and smells sharply chemical.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'noir',
    cast: ['player', 'unknown'],
    reskinnable: true,
  },
  {
    id: 'ME004',
    text: 'A stray cat watches from under a car, blinks slow, and vanishes when you look away.',
    location: 'street',
    timeOfDay: 'any',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME012',
    text: 'You catch a familiar scent in the air, then realize it\'s coming from someone you\'ve never met.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'romance',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME013',
    text: 'A coworker laughs too loud at your joke, then checks your reaction like they\'re grading you.',
    location: 'workplace',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'office',
    cast: ['player', 'coworker'],
    reskinnable: true,
  },
  {
    id: 'ME018',
    text: 'A stranger calls you by the wrong name, but it\'s close enough to feel intentional.',
    location: 'transit',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'noir',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME019',
    text: 'A bike chain snaps with a sharp crack, and three people flinch like they expected a gunshot.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'suspense',
    cast: ['player', 'bystanders'],
    reskinnable: true,
  },
  {
    id: 'ME021',
    text: 'Your neighbor\'s door is cracked open a finger\'s width, breathing warm light into the hallway.',
    location: 'apartment',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'neighbor'],
    reskinnable: true,
  },
  {
    id: 'ME026',
    text: 'A cashier hesitates, then asks if you\'ve "been here before," like they\'re not sure you\'re real.',
    location: 'shop',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'cashier'],
    reskinnable: true,
  },
  {
    id: 'ME030',
    text: 'A stranger offers directions you didn\'t ask for, pointing somewhere you were already going.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'noir',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME032',
    text: 'A library book you open falls to a page with a passage underlined in fresh ink.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'unknown'],
    reskinnable: true,
  },
  {
    id: 'ME033',
    text: 'A janitor hums softly, then stops mid-note when you make eye contact.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME036',
    text: 'A friend texts "are you okay?" then immediately says "sorry wrong person," but keeps typing.',
    location: 'anywhere',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'drama',
    cast: ['player', 'friend'],
    reskinnable: true,
  },
  {
    id: 'ME039',
    text: 'The wind flips your collar up, neat and exact, as if a careful hand adjusted you.',
    location: 'street',
    timeOfDay: 'dusk',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME041',
    text: 'A commuter drops a keyring, and every key is identical except one, which is warm.',
    location: 'transit',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'commuter'],
    reskinnable: true,
  },
  {
    id: 'ME048',
    text: 'The cashier hands you your change, then adds a coin that doesn\'t match any currency you know.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'fantasy_lean',
    cast: ['player', 'cashier'],
    reskinnable: true,
  },
  {
    id: 'ME050',
    text: 'You notice someone taking photos of the street, but they never raise the camera to their eye.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME051',
    text: 'The hallway smells like someone baked bread, but every door is closed and the building is quiet.',
    location: 'hallway',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME052',
    text: 'A musician on the train stops playing when you sit down, then resumes when you look away.',
    location: 'transit',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'suspense',
    cast: ['player', 'busker'],
    reskinnable: true,
  },
  {
    id: 'ME055',
    text: 'The power flickers for half a second, and you see everyone\'s faces relax when it returns.',
    location: 'workplace',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'thriller',
    cast: ['player', 'coworker'],
    reskinnable: true,
  },
  {
    id: 'ME062',
    text: 'Someone leaves a seat beside you, but the warmth in the cushion suggests they stood up seconds ago.',
    location: 'transit',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME063',
    text: 'A stray dog follows at a distance, never closer than ten steps, like it\'s respecting a boundary.',
    location: 'street',
    timeOfDay: 'dusk',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME064',
    text: 'A store mannequin has been rotated to face the door, its pose oddly protective.',
    location: 'shop',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME065',
    text: 'A friendly clerk compliments your choice, then pauses like they forgot which choice you made.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'clerk'],
    reskinnable: true,
  },
  {
    id: 'ME128',
    text: 'A coworker asks if you slept well, then adds, "I mean.. today," like they forgot the calendar.',
    location: 'workplace',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'coworker'],
    reskinnable: true,
  },
  {
    id: 'ME129',
    text: 'The street is suddenly quieter, like the city muted itself to hear you think.',
    location: 'street',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME132',
    text: 'A passerby drops their coffee, then laughs like it was planned, watching the spill form shapes.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME133',
    text: 'Your door key sticks, then turns easily, as if the lock decided you\'re allowed in today.',
    location: 'home',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME134',
    text: 'A lost pet flyer has every detail filled out except the pet\'s name, which is scratched into blur.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },

  // ===== MYSTERIOUS / EERIE (Tier 3) =====
  {
    id: 'ME006',
    text: 'The elevator mirror has a fresh fingerprint at eye level, perfectly centered, like a target mark.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME007',
    text: 'A busker plays your favorite tune, then changes key mid-note, as if correcting a mistake in you.',
    location: 'plaza',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'drama',
    cast: ['player', 'busker'],
    reskinnable: true,
  },
  {
    id: 'ME009',
    text: 'Your phone buzzes once with no notification; the screen wakes on a black reflection of your face.',
    location: 'anywhere',
    timeOfDay: 'late_night',
    tensionTier: 2,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME010',
    text: 'A receipt prints with an extra line item you didn\'t buy, labeled only: "REMEMBER."',
    location: 'shop',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player', 'cashier'],
    reskinnable: true,
  },
  {
    id: 'ME011',
    text: 'A dog\'s collar tag jingles nearby, but the leash is empty, dragging softly across concrete.',
    location: 'park',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME015',
    text: 'A security camera swivels a few degrees to follow you, then freezes like it got caught.',
    location: 'storefront',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player', 'authority'],
    reskinnable: true,
  },
  {
    id: 'ME016',
    text: 'Someone scribbled "TURN BACK" in wet chalk; raindrops keep trying to erase it and failing.',
    location: 'alley',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player', 'unknown'],
    contextHints: ['rain'],
    reskinnable: true,
  },
  {
    id: 'ME017',
    text: 'The playlist in the shop skips to a song that matches your mood too precisely.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'drama',
    cast: ['player', 'patrons'],
    reskinnable: true,
  },
  {
    id: 'ME020',
    text: 'The crosswalk signal sticks on "WAIT," even though the street is empty and silent.',
    location: 'intersection',
    timeOfDay: 'late_night',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME024',
    text: 'You overhear your own name in a conversation across the room, then they switch languages.',
    location: 'café',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME025',
    text: 'The light in a stairwell flickers in a rhythm that resembles a slow, deliberate knock.',
    location: 'stairwell',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME028',
    text: 'A missed call appears from a number that matches your own, digit for digit.',
    location: 'anywhere',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME029',
    text: 'A streetlight buzzes louder as you pass, then quiets as soon as you\'re beneath it.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME031',
    text: 'The restroom mirror has a new crack, spidering outward from the spot your face would be.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME035',
    text: 'Someone\'s laughter echoes from an empty stairwell, then becomes a cough, then silence.',
    location: 'stairwell',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME037',
    text: 'The ATM screen shows a brief error: "ACCOUNT NOT FOUND," then proceeds normally.',
    location: 'street',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME038',
    text: 'A street artist paints over their own work with frantic speed, like the old image was wrong.',
    location: 'plaza',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME040',
    text: 'A delivery box sits outside your door with no label, only a strip of tape shaped like a smile.',
    location: 'apartment',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME042',
    text: 'The coffee tastes different today, and the barista says, "yeah.. it does," too softly.',
    location: 'café',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'horror_lite',
    cast: ['player', 'barista'],
    reskinnable: true,
  },
  {
    id: 'ME043',
    text: 'A local headline on a screen shows your neighborhood, then refreshes before you can read it.',
    location: 'storefront',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME045',
    text: 'A door you push swings back harder than expected, like someone on the other side resisted.',
    location: 'building',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player', 'unknown'],
    reskinnable: true,
  },
  {
    id: 'ME046',
    text: 'Someone\'s umbrella bumps you, and they apologize with a phrase you swear you heard in a dream.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player', 'stranger'],
    contextHints: ['rain'],
    reskinnable: true,
  },
  {
    id: 'ME047',
    text: 'A distant siren rises, then dies mid-wail, leaving your ears waiting for a sound that never comes.',
    location: 'neighborhood',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    contextHints: ['rain'],
    reskinnable: true,
  },
  {
    id: 'ME056',
    text: 'A car\'s interior light turns on as you pass, illuminating no one in the driver\'s seat.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME058',
    text: 'A lost-and-found box contains one item: a perfectly folded map with your current location circled.',
    location: 'lobby',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME060',
    text: 'A street vendor offers a sample, then quietly warns, "don\'t eat it near mirrors."',
    location: 'market',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player', 'vendor'],
    reskinnable: true,
  },
  {
    id: 'ME061',
    text: 'A neighbor\'s music switches from upbeat to mournful the moment you set your hand on their doorknob.',
    location: 'apartment',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player', 'neighbor'],
    reskinnable: true,
  },
  {
    id: 'ME066',
    text: 'You hear soft tapping from inside a wall, three beats, pause, three beats again.',
    location: 'home',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME131',
    text: 'A handwritten sign appears on the breakroom fridge: "DO NOT DISCUSS THE NOISE."',
    location: 'workplace',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player', 'coworker'],
    reskinnable: true,
  },
  {
    id: 'ME136',
    text: 'The cashier rings you up, then quietly asks, "should I pretend I didn\'t see that?"',
    location: 'shop',
    timeOfDay: 'evening',
    tensionTier: 4,
    genre: 'noir',
    cast: ['player', 'cashier'],
    reskinnable: true,
  },
  {
    id: 'ME137',
    text: 'A street preacher speaks loudly, then pauses, eyes on you, and says one sentence just for you.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'drama',
    cast: ['player', 'preacher'],
    reskinnable: true,
  },
  {
    id: 'ME138',
    text: 'You find a small toy on your doorstep, and it\'s identical to one you lost years ago.',
    location: 'home',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME139B',
    text: 'A voice on the intercom says "thank you for your patience," but no one is waiting for anything.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player', 'bystanders'],
    reskinnable: true,
  },
  {
    id: 'ME141',
    text: 'A friend laughs at something you didn\'t say out loud, then goes pale when they realize it.',
    location: 'café',
    timeOfDay: 'evening',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player', 'friend'],
    reskinnable: true,
  },
  {
    id: 'ME142',
    text: 'A hallway clock ticks loudly for ten seconds, then stops, leaving the silence feeling newly expensive.',
    location: 'hallway',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME151',
    text: 'A stranger thanks you for "last time," then looks confused when you insist you\'ve never met.',
    location: 'café',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME152',
    text: 'Your grocery bag has one extra item inside, something you didn\'t choose, still cold from a fridge.',
    location: 'shop',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME157',
    text: 'A small puddle reflects a bright moon or sun that isn\'t visible overhead, perfectly crisp.',
    location: 'street',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME158',
    text: 'A cashier hands you a receipt folded into a tiny crane, and their eyes say, don\'t ask.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'noir',
    cast: ['player', 'cashier'],
    reskinnable: true,
  },
  {
    id: 'ME159',
    text: 'You hear your own voice in a distant conversation, repeating something you said hours ago.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME160',
    text: 'A stranger presses a business card into your hand; the blank side slowly reveals ink as you watch.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 4,
    genre: 'mystery',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },

  // ===== HIGH TENSION / THRILLER (Tier 4-5) =====
  {
    id: 'ME059',
    text: 'The elevator stops at a floor that isn\'t listed, opens to darkness, then closes without waiting.',
    location: 'building',
    timeOfDay: 'late_night',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME053',
    text: 'Your reflection in a window lags a fraction behind, like it\'s thinking before it copies you.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME121',
    text: 'A stranger offers to trade seats, insisting yours "isn\'t safe," then refuses to explain further.',
    location: 'transit',
    timeOfDay: 'evening',
    tensionTier: 4,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME122',
    text: 'A store window display has a new item labeled with your first name, handwritten neatly on a tag.',
    location: 'storefront',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME123',
    text: 'A quiet ringtone starts nearby; every person checks their phone, but the ringing continues anyway.',
    location: 'café',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player', 'crowd'],
    reskinnable: true,
  },
  {
    id: 'ME124',
    text: 'A notebook on a bench is open to a page describing exactly what you\'re wearing.',
    location: 'park',
    timeOfDay: 'morning',
    tensionTier: 4,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME125',
    text: 'The elevator voice mispronounces your floor, then apologizes in a whisper only you hear.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME126',
    text: 'A stranger smiles warmly, then tears their own flyer down, like you\'re the reason it can\'t be seen.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'noir',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME127',
    text: 'A friendly clerk offers a loyalty card, but the card already has your signature on it.',
    location: 'shop',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player', 'clerk'],
    reskinnable: true,
  },
  {
    id: 'ME130',
    text: 'A stranger offers you a mint; the wrapper is blank, and the mint tastes faintly metallic.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'noir',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME135',
    text: 'You notice a new lock on a door that used to be unimportant, heavy enough to feel like a warning.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME139',
    text: 'A stranger bumps you, murmurs "too late," then looks genuinely sorry.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME143',
    text: 'A stranger holds out their phone showing a photo taken behind you, timestamped two minutes from now.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 5,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME144',
    text: 'You hear a soft lullaby from a parked car, and the music cuts when you step closer.',
    location: 'parking_lot',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME145',
    text: 'A store employee restocks a shelf with intense care, arranging items into a pattern that resembles a symbol.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME146',
    text: 'The wind carries a whisper of your full name, pronounced perfectly, then scatters into ordinary noise.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'supernatural_lean',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME147',
    text: 'A stranger presses a business card into your hand; the blank side slowly reveals ink as you watch.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'noir',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME148',
    text: 'Your reflection in a dark window shows someone standing behind you, but the street behind is empty.',
    location: 'street',
    timeOfDay: 'late_night',
    tensionTier: 5,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME149',
    text: 'A friendly dog trots up with a note tied to its collar: FOLLOW, IF BRAVE.',
    location: 'neighborhood',
    timeOfDay: 'afternoon',
    tensionTier: 4,
    genre: 'adventure',
    cast: ['player', 'animal', 'unknown'],
    reskinnable: true,
  },
  {
    id: 'ME150',
    text: 'A public announcement repeats twice, then plays backward for a second before returning to normal.',
    location: 'transit',
    timeOfDay: 'evening',
    tensionTier: 4,
    genre: 'surreal',
    cast: ['player', 'crowd'],
    reskinnable: true,
  },
  {
    id: 'ME153',
    text: 'A gentle knock sounds from inside your closet, then a soft shuffle like someone adjusting their stance.',
    location: 'home',
    timeOfDay: 'late_night',
    tensionTier: 5,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME154',
    text: 'A bystander records the street, but their camera is pointed at the sky, tracking something unseen.',
    location: 'street',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'sci_fi_lean',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME155',
    text: 'The elevator doors open to your floor, but the hallway lights are a different color than usual.',
    location: 'building',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME156',
    text: 'A stranger offers you a compliment, then adds, "you look better than the last one," and leaves.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 4,
    genre: 'thriller',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },

  // ===== ADDITIONAL UNIVERSAL EVENTS (filler to 175) =====
  {
    id: 'ME070',
    text: 'A child waves at you through a window, then their parent pulls them away quickly.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'universal',
    cast: ['player', 'child', 'guardian'],
    reskinnable: true,
  },
  {
    id: 'ME071',
    text: 'Someone drops a coin and doesn\'t pick it up, as if leaving it for someone specific.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'universal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME072',
    text: 'The smell of smoke drifts by, but there\'s no fire, no cigarette, no source.',
    location: 'anywhere',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME073',
    text: 'A clock on the wall shows a time exactly one hour ahead, but no one else notices.',
    location: 'workplace',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'coworker'],
    reskinnable: true,
  },
  {
    id: 'ME074',
    text: 'Someone\'s shopping bag rips, spilling items, and every single one is the same product.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME075',
    text: 'A bird lands on a nearby railing and tilts its head, watching you like it\'s been sent.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'universal',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME076',
    text: 'The escalator shudders for just a moment, and the person behind you grabs your shoulder.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'universal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME077',
    text: 'A stranger\'s phone rings with the same ringtone as yours, and both of you answer.',
    location: 'café',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME078',
    text: 'A photo booth flash goes off with no one inside, the curtain still swaying.',
    location: 'plaza',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME079',
    text: 'The barista calls your order before you\'ve given it, then winks like it\'s an inside joke.',
    location: 'café',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'slice_of_life',
    cast: ['player', 'barista'],
    reskinnable: true,
  },
  {
    id: 'ME080',
    text: 'A graffiti tag on a wall looks like it\'s spelling out a question addressed to you.',
    location: 'alley',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME081',
    text: 'An old newspaper blows against your leg, open to an obituary with no photo.',
    location: 'street',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'noir',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME082',
    text: 'A parking meter expires the moment you look at it, as if it was waiting for an audience.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME083',
    text: 'The person ahead of you in line turns around, smiles, then turns back without saying anything.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'universal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME084',
    text: 'A street performer\'s puppet makes eye contact with you and nobody else.',
    location: 'plaza',
    timeOfDay: 'afternoon',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player', 'busker'],
    reskinnable: true,
  },
  {
    id: 'ME085',
    text: 'The cafe door chime rings twice, but only one person walked through.',
    location: 'café',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME086',
    text: 'A stranger ties their shoe at the exact moment you do, matching your movements.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME087',
    text: 'The bus arrives empty except for one passenger in the very back, facing away.',
    location: 'transit',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'suspense',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME088',
    text: 'A child\'s balloon drifts by at eye level, moving against the wind.',
    location: 'park',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME089',
    text: 'The water fountain sputters before you touch it, like it knew you were coming.',
    location: 'building',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'universal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME090',
    text: 'A door you\'ve passed a hundred times has a new handle, chrome and cold.',
    location: 'building',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME091',
    text: 'Someone whispers "excuse me" behind you, but when you turn, no one is there.',
    location: 'anywhere',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME092',
    text: 'A newspaper vending machine shows tomorrow\'s date on the headline.',
    location: 'street',
    timeOfDay: 'morning',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME093',
    text: 'The elevator buttons are all pressed, but you\'re the only one inside.',
    location: 'building',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'horror_lite',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME094',
    text: 'A payphone starts ringing as you pass, and stops the moment you touch the receiver.',
    location: 'street',
    timeOfDay: 'evening',
    tensionTier: 4,
    genre: 'thriller',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME095',
    text: 'Your shoelace comes undone at the exact center of a crosswalk.',
    location: 'intersection',
    timeOfDay: 'afternoon',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME096',
    text: 'A cat meows at you from a high window, then disappears inside like it delivered a message.',
    location: 'neighborhood',
    timeOfDay: 'evening',
    tensionTier: 2,
    genre: 'mystery',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME097',
    text: 'The automatic door opens before you\'re close enough to trigger it.',
    location: 'shop',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME098',
    text: 'A stranger hands you a tissue before you realize you needed one.',
    location: 'transit',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'wholesome',
    cast: ['player', 'stranger'],
    reskinnable: true,
  },
  {
    id: 'ME099',
    text: 'The shadows in the alley seem to lean toward you, curious rather than threatening.',
    location: 'alley',
    timeOfDay: 'dusk',
    tensionTier: 3,
    genre: 'surreal',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME100',
    text: 'A spider descends right in front of your face, pauses, then climbs back up like it reconsidered.',
    location: 'building',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'comedy',
    cast: ['player', 'animal'],
    reskinnable: true,
  },
  {
    id: 'ME101',
    text: 'The streetlight above you flickers once, spelling out a rhythm you almost recognize.',
    location: 'street',
    timeOfDay: 'night',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME102',
    text: 'A book falls off a shelf in a closed bookshop as you walk past.',
    location: 'storefront',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'supernatural_lean',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME103',
    text: 'The crossing guard holds up traffic a beat too long, watching you until you\'re safely across.',
    location: 'intersection',
    timeOfDay: 'morning',
    tensionTier: 1,
    genre: 'slice_of_life',
    cast: ['player', 'authority'],
    reskinnable: true,
  },
  {
    id: 'ME104',
    text: 'A fortune cookie\'s message is blank on one side and has your initials on the other.',
    location: 'café',
    timeOfDay: 'evening',
    tensionTier: 3,
    genre: 'mystery',
    cast: ['player'],
    reskinnable: true,
  },
  {
    id: 'ME105',
    text: 'Someone leaves an umbrella propped against a trash can, angled like an invitation.',
    location: 'street',
    timeOfDay: 'afternoon',
    tensionTier: 2,
    genre: 'universal',
    cast: ['player'],
    contextHints: ['rain'],
    reskinnable: true,
  },
];

// =============================================================================
// REPEAT BLOCK QUEUE MANAGER
// =============================================================================

export class MicroEventRepeatBlocker {
  private recentlyUsedIds: string[] = [];
  private maxQueueSize: number;

  constructor(maxQueueSize: number = MICRO_EVENT_CONFIG.repeatBlockTurns) {
    this.maxQueueSize = maxQueueSize;
  }

  markUsed(eventId: string): void {
    this.recentlyUsedIds.push(eventId);
    if (this.recentlyUsedIds.length > this.maxQueueSize) {
      this.recentlyUsedIds.shift();
    }
  }

  isBlocked(eventId: string): boolean {
    return this.recentlyUsedIds.includes(eventId);
  }

  getBlockedIds(): string[] {
    return [...this.recentlyUsedIds];
  }

  clear(): void {
    this.recentlyUsedIds = [];
  }

  serialize(): string[] {
    return [...this.recentlyUsedIds];
  }

  restore(ids: string[]): void {
    this.recentlyUsedIds = ids.slice(-this.maxQueueSize);
  }
}

// =============================================================================
// SELECTION ENGINE
// =============================================================================

export interface MicroEventContext {
  location: MicroEventLocation;
  timeOfDay: MicroEventTimeOfDay;
  currentTensionTier: MicroEventTensionTier;
  weather?: string;
  gameGenre?: string;
  turnsSinceLastMicroEvent: number;
}

export function selectMicroEventFromCatalog(
  context: MicroEventContext,
  blocker: MicroEventRepeatBlocker
): CatalogMicroEvent | null {
  // Filter by location
  let eligible = MICRO_EVENT_CATALOG.filter(e => 
    e.location === context.location || e.location === 'anywhere'
  );

  // Filter by time of day
  eligible = eligible.filter(e => 
    e.timeOfDay === context.timeOfDay || e.timeOfDay === 'any'
  );

  // Filter out recently used events
  eligible = eligible.filter(e => !blocker.isBlocked(e.id));

  // Filter by weather context hints if weather provided
  if (context.weather) {
    const weatherMatches = eligible.filter(e => 
      e.contextHints?.includes(context.weather!)
    );
    // Boost weather-appropriate events by including them twice
    eligible = [...eligible, ...weatherMatches];
  }

  if (eligible.length === 0) return null;

  // Weight by tension proximity (prefer events matching current tension)
  const weighted: { event: CatalogMicroEvent; weight: number }[] = eligible.map(e => {
    const tensionDiff = Math.abs(e.tensionTier - context.currentTensionTier);
    // Closer tension = higher weight
    const weight = Math.max(0.1, 1 - tensionDiff * 0.2) * 
      (MICRO_EVENT_CONFIG.tensionMultiplier[e.tensionTier] || 1);
    return { event: e, weight };
  });

  // Weighted random selection
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const { event, weight } of weighted) {
    roll -= weight;
    if (roll <= 0) return event;
  }

  return weighted[0]?.event || null;
}

export function shouldTriggerMicroEventFromCatalog(
  turnsSinceLastMicroEvent: number,
  worldPressureLevel: number = 50
): boolean {
  const { triggerChanceBase, triggerChancePerTurn } = MICRO_EVENT_CONFIG;
  const baseChance = Math.min(0.3, triggerChanceBase + turnsSinceLastMicroEvent * triggerChancePerTurn);
  const pressureModifier = worldPressureLevel > 70 ? 1.5 : worldPressureLevel < 30 ? 0.7 : 1.0;
  return Math.random() < baseChance * pressureModifier;
}

// =============================================================================
// RESKINNING ENGINE
// =============================================================================

export function reskinMicroEventText(
  event: CatalogMicroEvent,
  genreKey: string
): string {
  const vars = GENRE_VARIABLES[genreKey] || GENRE_VARIABLES.modern;
  let text = event.text;

  // Simple token replacements
  text = text.replace(/\bcoffee\b/gi, vars.drink);
  text = text.replace(/\bphone\b/gi, vars.device);
  text = text.replace(/\bstranger\b/gi, vars.stranger);
  text = text.replace(/\bcar\b/gi, vars.vehicle);
  text = text.replace(/\bapartment\b/gi, vars.dwelling);
  text = text.replace(/\boffice\b/gi, vars.workplace);
  text = text.replace(/\bsecurity\b/gi, vars.authority);
  text = text.replace(/\bcoin\b/gi, vars.currency);

  return text;
}

// =============================================================================
// AI CONTEXT BUILDER
// =============================================================================

export function buildMicroEventCatalogContext(
  event: CatalogMicroEvent | null,
  genreKey?: string
): string {
  if (!event) return '';

  const text = genreKey && event.reskinnable 
    ? reskinMicroEventText(event, genreKey)
    : event.text;

  return `## MICRO-EVENT (WEAVE INTO NARRATIVE)
"${text}"

INSTRUCTIONS:
- Include this moment naturally, not as an announcement
- Keep it brief (${MICRO_EVENT_CONFIG.maxMicroEventWords.min}-${MICRO_EVENT_CONFIG.maxMicroEventWords.max} words ideal)
- Player notices but may choose to engage or ignore
- Don't over-explain—let the moment breathe`;
}

// =============================================================================
// EXPORTS
// =============================================================================

import { ALL_EXPANSION_EVENTS } from './microEventCatalogExpansion';

// Merge expansion events into main catalog
MICRO_EVENT_CATALOG.push(...ALL_EXPANSION_EVENTS);

export const CATALOG_SIZE = MICRO_EVENT_CATALOG.length;

export function getMicroEventById(id: string): CatalogMicroEvent | undefined {
  return MICRO_EVENT_CATALOG.find(e => e.id === id);
}

export function getMicroEventsByLocation(location: MicroEventLocation): CatalogMicroEvent[] {
  return MICRO_EVENT_CATALOG.filter(e => e.location === location || e.location === 'anywhere');
}

export function getMicroEventsByGenre(genre: MicroEventGenre): CatalogMicroEvent[] {
  return MICRO_EVENT_CATALOG.filter(e => e.genre === genre || e.genre === 'universal');
}

export function getMicroEventsByTensionTier(tier: MicroEventTensionTier): CatalogMicroEvent[] {
  return MICRO_EVENT_CATALOG.filter(e => e.tensionTier === tier);
}
