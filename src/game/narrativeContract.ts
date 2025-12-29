// ============================================================================
// THE UNTOLD STORY ENGINE - Universal Narrative Contract
// Fixes "one-liner syndrome" by enforcing deep, immersive scene generation
// ============================================================================

import { GENRE_CLASSES } from './storyInventoryBridge';
import { 
  FANTASY_DEFINITION, 
  SCIFI_DEFINITION, 
  HORROR_DEFINITION, 
  MYSTERY_DEFINITION, 
  PIRATE_DEFINITION, 
  WESTERN_DEFINITION, 
  CYBERPUNK_DEFINITION, 
  POSTAPOC_DEFINITION, 
  WAR_DEFINITION 
} from './worldBible/genreDefinitions';

// ============================================================================
// UNIVERSAL NARRATIVE RULES - Hard rules for every scene
// ============================================================================

export const UNIVERSAL_NARRATIVE_RULES = `
===== STORY ENGINE NARRATIVE CONTRACT =====

YOU ARE THE STORY ENGINE. Every response must be a complete scene, not a blurb.

NON-NEGOTIABLE OUTPUT MINIMUMS:
- Minimum: 6-8 paragraphs, each 2-4 sentences.
- Must include: sensory detail (sight, sound, smell, temperature), character internal state, and world motion.
- Must include: (1) a clear immediate objective, (2) an immediate obstacle, (3) a looming consequence if delayed.
- Must include: 3 concrete environmental details that fit the genre.
- Must include: at least 1 named NPC OR 1 named faction/organization presence when appropriate.
- Must include: 2 hooks (unresolved questions or threats) that persist after the scene.

ROLE LOCK:
- Write from the character's lived role lens (soldier, detective, explorer, etc.).
- Show what the role notices first, fears most, and prioritizes under pressure.
- Do NOT narrate like a neutral encyclopedia; stay grounded in what the character experiences.
- Every piece of starting inventory should be felt, mentioned, or visible through the character's awareness.

GENRE LOCK:
- Every detail must reinforce the chosen genre's tone, hazards, and logic.
- Do not introduce genre-breaking elements unless explicitly triggered by the scenario.
- Use the genre's vocabulary, idioms, and cultural references.

STATE + INVENTORY LOCK (NO DRIFT):
- Starting inventory is authoritative.
- You may NOT add items unless the character acquires them in-scene via a clear event.
- You may NOT remove items unless used, lost, or traded in-scene.

FAIL-SAFE:
- If you are unsure whether something exists in inventory: assume it does NOT and ask via an in-world check.
- Never contradict earlier established facts. If a contradiction would occur, reconcile it in-scene.
`;

// ============================================================================
// GENRE BIBLE - Concise genre-tight rails
// ============================================================================

export const GENRE_BIBLE: Record<string, string> = {
  fantasy: 'Fantasy Quest: wonder + danger; magic feels costly; ancient forces; moral weight; travel hardship; mythic clues. Torchlight on dungeon walls, the weight of chainmail, the clink of coin purses.',
  scifi: 'Space Explorer: isolation + awe; tech constraints; ship procedure; unknown phenomena; environmental hazards; eerie silence. The hum of life support, the void outside the viewport, the blink of warning lights.',
  mystery: 'Detective Mystery: evidence over vibes; motives, alibis, contradictions; noir atmosphere; social pressure; "truth has a price." Rain on windows, cigarette smoke, the tick of a clock.',
  noir: 'Mystery Noir: shadows and moral ambiguity; every face hides a motive; rain always about to fall. Hard-boiled observations, cynical wit, dangerous dames.',
  horror: 'Survival Horror: scarcity; limited visibility; sound matters; danger uncertain; safety is temporary; dread escalates with delay. Creaking floorboards, labored breathing, shapes in the dark.',
  pirate: 'High Seas Adventure: salt, wind, risk; loyalties shift; navigation and storms; greed and legend; ship as home and prison. The crack of sails, rum and gunpowder, the endless horizon.',
  cyberpunk: 'Neon Dystopia: corporate control; surveillance; desperation; tech as power; street codes; consequences and heat. Neon reflections, chrome and rain, the hum of neural interfaces.',
  war: 'Theater of War: objective + chaos; chain of command; ammo/med reality; noise and fear; comradeship; fog of war. Thunder of artillery, mud and blood, the weight of duty.',
  western: 'Frontier Justice: law is fragile; distance and scarcity; honor vs survival; reputation matters; dust, heat, hard choices. The creak of leather, distant coyotes, the weight of iron.',
  modern_life: 'Modern Life: social stakes; time pressure; money, work, relationships; consequences are real but grounded; quiet tension. Traffic hum, phone notifications, the smell of coffee.',
  postapoc: 'Post-Apocalyptic: harsh survival; scarcity of everything; trust is earned; radiation and ruin; hope is rare but precious. Dust and ash, rusted metal, the click of a Geiger counter.',
  cosmic_horror: 'Cosmic Horror: insignificance before vast entities; forbidden knowledge corrupts; sanity is fragile; truth destroys. Impossible geometries, whispers from beyond, the weight of knowing.',
};

// ============================================================================
// SPAWN PACKET - Locks role + gear + immediate context
// ============================================================================

export interface SpawnPacket {
  scenarioName: string;
  genreTag: string;
  roleTitle: string;
  coreDrive: string;
  immediateProblem: string;
  startingLocation: string;
  timeContext: string;
  inventory: string[];
  carriageNotes: string;
  constraints?: string[];
}

export function buildSpawnPacket(
  scenarioName: string,
  genre: string,
  characterClass: string,
  characterName: string,
  inventory: Array<{ name: string; quantity?: number }>,
  startingLocation: string = 'Unknown'
): SpawnPacket {
  const genreClasses = GENRE_CLASSES[genre] || GENRE_CLASSES['fantasy'] || [];
  const roleInfo = genreClasses.find(c => c.id === characterClass) || genreClasses[0];
  
  // Generate carriage notes based on inventory
  const carriageNotes = generateCarriageNotes(inventory, genre);
  
  // Generate immediate problem based on genre
  const immediateProblem = generateImmediateProblem(genre, characterClass);
  
  // Generate core drive based on role
  const coreDrive = generateCoreDrive(genre, characterClass);
  
  // Generate time context
  const timeContext = generateTimeContext();
  
  return {
    scenarioName,
    genreTag: genre.toUpperCase(),
    roleTitle: roleInfo?.name || 'Adventurer',
    coreDrive,
    immediateProblem,
    startingLocation,
    timeContext,
    inventory: inventory.map(i => i.quantity && i.quantity > 1 ? `${i.name} (x${i.quantity})` : i.name),
    carriageNotes,
    constraints: [],
  };
}

function generateCarriageNotes(inventory: Array<{ name: string; quantity?: number }>, genre: string): string {
  const notes: string[] = [];
  
  for (const item of inventory) {
    const itemLower = item.name.toLowerCase();
    
    // Weapons
    if (itemLower.includes('sword') || itemLower.includes('blade')) {
      notes.push(`${item.name} - belted at hip, leather-wrapped grip`);
    } else if (itemLower.includes('rifle') || itemLower.includes('longbow')) {
      notes.push(`${item.name} - slung across back`);
    } else if (itemLower.includes('pistol') || itemLower.includes('revolver')) {
      notes.push(`${item.name} - holstered at side`);
    } else if (itemLower.includes('dagger') || itemLower.includes('knife')) {
      notes.push(`${item.name} - sheathed at belt or boot`);
    } else if (itemLower.includes('staff')) {
      notes.push(`${item.name} - carried in hand or strapped to pack`);
    }
    // Armor
    else if (itemLower.includes('armor') || itemLower.includes('vest') || itemLower.includes('chainmail')) {
      notes.push(`${item.name} - worn, weight felt with each step`);
    } else if (itemLower.includes('helmet') || itemLower.includes('hat') || itemLower.includes('hood')) {
      notes.push(`${item.name} - worn on head`);
    } else if (itemLower.includes('boots') || itemLower.includes('shoes')) {
      notes.push(`${item.name} - worn, mud/dust on soles`);
    }
    // Supplies
    else if (itemLower.includes('medkit') || itemLower.includes('potion') || itemLower.includes('aid')) {
      notes.push(`${item.name} - secured in pouch at belt`);
    } else if (itemLower.includes('pack') || itemLower.includes('bag')) {
      notes.push(`${item.name} - carried on back, straps over shoulders`);
    } else if (itemLower.includes('ammo') || itemLower.includes('rounds') || itemLower.includes('magazine')) {
      notes.push(`${item.name} - in ammo pouch or bandolier`);
    }
    // Other
    else if (itemLower.includes('map') || itemLower.includes('document') || itemLower.includes('book')) {
      notes.push(`${item.name} - tucked in inner pocket or pack`);
    }
  }
  
  if (notes.length === 0) {
    return 'All gear secured in pack or on person.';
  }
  
  return notes.slice(0, 6).join('; ') + '.';
}

function generateImmediateProblem(genre: string, characterClass: string): string {
  const problems: Record<string, string[]> = {
    fantasy: [
      'Strange lights in the distance demand investigation',
      'The road ahead is blocked by fallen trees - recent, deliberate',
      'You smell smoke on the wind - a village may be burning',
      'An injured traveler calls for help from the roadside',
    ],
    scifi: [
      'Ship sensors detect an anomaly that defies classification',
      'A distress beacon, old and weak, pulses from the dark',
      'Life support warnings flicker - something needs attention',
      'Contact with the main fleet was lost hours ago',
    ],
    horror: [
      'Something moved in the dark - you only caught the shadow',
      'Your phone is dead and the last road sign pointed nowhere',
      'The silence is wrong - no birds, no insects, nothing',
      'You cannot remember how you got here',
    ],
    mystery: [
      'A client waits in your office with a case that stinks',
      'The body was found this morning - you have 24 hours',
      'Someone left an envelope with your name - no return address',
      'Your informant missed the meet - that never happens',
    ],
    cyberpunk: [
      'The job went sideways and now you have heat',
      'A fixer called with a gig - high pay, higher risk',
      'Your neural link is glitching - bad timing',
      'Someone flatlined your contact last night',
    ],
    war: [
      'Command ordered a push - intel may be bad',
      'Your squad is down to half strength and ammo is low',
      'Artillery starts soon - you need to move now',
      'The silence after the barrage is the worst part',
    ],
    western: [
      'A wanted poster with your face just rode into town',
      'The stagecoach is late - could be trouble on the road',
      'A stranger in a black hat has been asking about you',
      'The mine has gone silent and no one knows why',
    ],
    pirate: [
      'A rival ship was spotted on the horizon at dawn',
      'The crew is restless - been too long since prize money',
      'Your map shows an island that is not on any other chart',
      'The hold is taking water and the storm is not done',
    ],
    postapoc: [
      'Your water ration runs out tomorrow',
      'Raiders were seen near the settlement - too many to fight',
      'The Geiger counter is clicking faster than it should',
      'A caravan never arrived - supplies are running short',
    ],
    modern_life: [
      'Your phone buzzes with a message that changes everything',
      'The rent is due and your account is short',
      'Someone from your past just walked into your life again',
      'An opportunity appeared - but the timing is impossible',
    ],
    cosmic_horror: [
      'The book should not exist - yet you hold it',
      'Your dreams have become too real to ignore',
      'The angles of the room feel wrong when you look away',
      'Someone left a message in a language that should not exist',
    ],
  };
  
  const genreProblems = problems[genre] || problems['fantasy'];
  return genreProblems[Math.floor(Math.random() * genreProblems.length)];
}

function generateCoreDrive(genre: string, characterClass: string): string {
  const drives: Record<string, Record<string, string>> = {
    fantasy: {
      default: 'To prove yourself worthy of the prophecy that named you',
      warrior: 'To test your blade against worthy foes',
      mage: 'To unlock the deeper mysteries of the arcane',
      rogue: 'To claim what others think is theirs',
      cleric: 'To carry the light into dark places',
      ranger: 'To protect the wild places from corruption',
    },
    scifi: {
      default: 'To explore what lies beyond the known',
      marine: 'To complete the mission at any cost',
      scientist: 'To understand what others fear',
      pilot: 'To push the limits of what a ship can do',
      engineer: 'To fix what cannot be fixed',
    },
    horror: {
      default: 'To survive until dawn',
      investigator: 'To understand what hunts in the dark',
      occultist: 'To use forbidden knowledge before it uses you',
      medic: 'To keep others alive when death circles',
    },
    cyberpunk: {
      default: 'To carve a name in the neon',
      netrunner: 'To go deeper into the Net than anyone has survived',
      solo: 'To be the last one standing when the chrome clears',
      techie: 'To build something that will outlast the corps',
      fixer: 'To be the one everyone needs but no one trusts',
    },
    war: {
      default: 'To bring your squad home alive',
      medic: 'To keep them breathing when everything says otherwise',
      sniper: 'To complete the shot no one else can take',
      officer: 'To make the calls that others cannot',
      engineer: 'To build and destroy as the mission requires',
    },
    western: {
      default: 'To settle a score that has waited too long',
      sheriff: 'To bring law where there is none',
      outlaw: 'To stay free, no matter the cost',
      bounty_hunter: 'To bring them in dead or alive',
    },
  };
  
  const genreDrives = drives[genre] || drives['fantasy'];
  return genreDrives[characterClass] || genreDrives['default'] || 'To survive and make your mark on the world';
}

function generateTimeContext(): string {
  const times = [
    'Early morning - cold mist, first light',
    'Mid-morning - sun climbing, shadows shortening',
    'High noon - sun overhead, no shadow to hide in',
    'Late afternoon - long shadows, golden light',
    'Dusk - light fading, the in-between hour',
    'Night - darkness full, stars visible',
    'Midnight - the dead hours, when the world sleeps',
    'Pre-dawn - darkest before light, anticipation in the air',
  ];
  
  return times[Math.floor(Math.random() * times.length)];
}

export function formatSpawnPacket(packet: SpawnPacket): string {
  return `
===== SPAWN PACKET (AUTHORITATIVE) =====

SCENARIO: ${packet.scenarioName} [${packet.genreTag}]
ROLE: ${packet.roleTitle}
CORE DRIVE: ${packet.coreDrive}
IMMEDIATE PROBLEM: ${packet.immediateProblem}
STARTING LOCATION: ${packet.startingLocation}
TIME CONTEXT: ${packet.timeContext}

STARTING INVENTORY (AUTHORITATIVE LIST):
${packet.inventory.map(item => `  - ${item}`).join('\n')}

CARRIAGE NOTES (where items are carried/holstered/packed):
${packet.carriageNotes}

${packet.constraints && packet.constraints.length > 0 ? `CONSTRAINTS: ${packet.constraints.join(', ')}` : ''}

CRITICAL: This inventory is LOCKED. Items can only be added if acquired in-scene. Items can only be removed if used, lost, or traded in-scene.
`;
}

// ============================================================================
// DELTA LEDGER - Inventory drift killer
// ============================================================================

export const DELTA_LEDGER_INSTRUCTIONS = `
===== DELTA LEDGER (REQUIRED AT END OF EVERY RESPONSE) =====

At the end of EVERY response, you MUST output this exact structure:

---INVENTORY_DELTA---
Added: (none OR list items acquired this scene)
Removed: (none OR list items lost/given away)
Used/Consumed: (none OR list items expended)
Notes: (brief context if any changes occurred)

---STATE_DELTA---
New facts: (established world/character truths)
Injuries/Conditions: (physical state changes)
Relationships/Reputation: (social changes)
Flags/Clocks: (story triggers, time pressure)

---NEXT_HOOKS---
1) [immediate hook - what must be addressed now]
2) [looming hook - consequence if delayed]

If NOTHING changed, you must still output the structure with "(none)" entries.
This is MANDATORY. No exceptions. No empty sections.
`;

// ============================================================================
// GRAND OPENING SCENE TEMPLATE - Guarantees depth for first scene
// ============================================================================

export const GRAND_OPENING_TEMPLATE = `
===== SCENE STRUCTURE REQUIREMENTS (GRAND OPENING) =====

Write Scene 1 using the RULES + GENRE_BIBLE + SPAWN_PACKET.

Structure requirements:
1) COLD OPEN (1 paragraph): Drop into motion or tension immediately. No throat-clearing.
2) GROUNDING (2 paragraphs): Environment + sensory + genre details; show the world moving.
3) ROLE LENS (1 paragraph): What the role notices, what they fear, what they plan.
4) IMMEDIATE OBJECTIVE (1 paragraph): What must be done in the next 5 minutes and why.
5) OBSTACLE/THREAT (2 paragraphs): A direct complication + a looming consequence.
6) HOOKS (1 paragraph): Reveal 2 unresolved threads that persist.

CRITICAL: Mention each starting inventory item at least once in natural context (seeing, carrying, checking, counting). Show the weight and presence of gear. Do not add new items.

Example of role-locked, sensory, inventory-anchored writing:

BAD: "You have a rifle."
GOOD: "Your rifle's sling bites your shoulder through wet fabric. You thumb the mag, feel the rounds seated, then realize your hands are shaking anyway."

BAD: "You wait in the forest."
GOOD: "Rainwater drips from oak leaves onto your hood, each drop a cold tap of patience. Somewhere ahead, where the mist thickens between black trees, something moves without the rhythm of wind."
`;

// ============================================================================
// CONTINUATION SCENE TEMPLATE - For ongoing scenes
// ============================================================================

export const CONTINUATION_TEMPLATE = `
===== SCENE STRUCTURE REQUIREMENTS (CONTINUATION) =====

Continue the story using the RULES + GENRE_BIBLE.

Structure requirements:
1) CONSEQUENCE (1 paragraph): Show immediate result of player action.
2) WORLD MOTION (1-2 paragraphs): The world reacts; NPCs act; environment shifts.
3) COMPLICATION (1-2 paragraphs): New obstacle or escalation emerges.
4) CHOICE MOMENT (1 paragraph): Present the new decision point.
5) HOOKS UPDATE (1 paragraph): Which threads advance, which simmer.

Keep role lens active. Show inventory items when relevant (reloading, checking supplies, equipment status).
`;

// ============================================================================
// BUILD COMPLETE NARRATIVE CONTRACT
// ============================================================================

export function buildNarrativeContract(
  genre: string,
  spawnPacket?: SpawnPacket,
  isOpening: boolean = false
): string {
  let contract = UNIVERSAL_NARRATIVE_RULES;
  
  // Add genre bible
  const genreBible = GENRE_BIBLE[genre] || GENRE_BIBLE['fantasy'];
  contract += `\n\n===== GENRE BIBLE =====\n${genreBible}`;
  
  // Add spawn packet if provided
  if (spawnPacket) {
    contract += '\n\n' + formatSpawnPacket(spawnPacket);
  }
  
  // Add appropriate scene template
  contract += '\n\n' + (isOpening ? GRAND_OPENING_TEMPLATE : CONTINUATION_TEMPLATE);
  
  // Delta ledger removed - it was cluttering the display
  
  return contract;
}

// Default export for convenience
export default buildNarrativeContract;
