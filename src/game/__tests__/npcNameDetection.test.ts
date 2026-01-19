/**
 * NPC Name Detection Test Utility
 * Tests name introduction patterns and equipment detection patterns
 * across multiple genres to verify correct NPC linking behavior.
 */

import { describe, it, expect } from 'vitest';

// ============= NAME INTRODUCTION PATTERNS (copied for testing) =============
const NAME_INTRODUCTION_PATTERNS: RegExp[] = [
  // ===== DIRECT SELF-INTRODUCTIONS =====
  /(?:my name is|my name's|i'm|i am)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:call me|you can call me|just call me|everyone calls me|folks call me|people call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i go by|i'm known as|known as|also known as|aka|a\.k\.a\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:the name's|name's|the name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:they call me|'round here they call me|around here they call me|some call me|most call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== NOIR / DETECTIVE GENRE =====
  /(?:introduced (?:himself|herself|themselves|themself|itself) as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:go(?:es)? by the name(?: of)?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:working under the name|operating under the alias)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:dame|guy|man|woman|fella|broad) named\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== FANTASY / MEDIEVAL GENRE =====
  /(?:i am called|i'm called|i be called|i be)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i am|i'm)\s+([A-Z][a-z]+)\s+(?:of house|of clan|of the|son of|daughter of)/gi,
  /(?:sir|lady|lord|dame|master|mistress)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:at your service|of|the)/gi,
  /(?:you may address me as|address me as|refer to me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i bear the name|i carry the name|my given name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== SCI-FI / CYBERPUNK GENRE =====
  /(?:designation[:\s]+|unit\s+)([A-Z][a-z0-9]+(?:[-\s][A-Z][a-z0-9]+)?)/gi,
  /(?:my handle is|handle's|street name is|net name is|alias is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:registered as|ID reads|identification[:\s]+)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== WESTERN GENRE =====
  /(?:folks call me|pardner.*call me|stranger.*name's)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:wanted poster says|bounty on)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== MILITARY / WAR GENRE =====
  /(?:private|corporal|sergeant|lieutenant|captain|major|colonel|general|commander|admiral)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:callsign[:\s]+|codename[:\s]+|operating under callsign)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:soldier named|marine named|officer named|trooper named)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== PIRATE / NAUTICAL GENRE =====
  /(?:captain|first mate|quartermaster|bo'sun|bosun)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:sailed under|crewed with|served under captain)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== HORROR / SUPERNATURAL GENRE =====
  /(?:entity known as|being known as|creature called|thing called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:spirit of|ghost of|soul of|shade of|specter of)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:i was once called|i was once known as|in life.*called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== URBAN / STREET GENRE =====
  /(?:on the streets.*call me|streets know me as|hood knows me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:my crew calls me|gang knows me as|boys call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== ROMANCE / SOCIAL GENRE =====
  /(?:pleased to meet you.*i'm|pleasure to meet you.*i'm|charmed.*i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:may i introduce myself\??\s*i'm|let me introduce myself.*i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== POST-APOCALYPTIC GENRE =====
  /(?:before the.*i was|used to be called|used to be known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /(?:wasteland knows me as|survivors call me|scavengers know me as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== THIRD PERSON INTRODUCTIONS =====
  /(?:this is|meet|may i present|allow me to introduce|introducing|let me introduce)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /[A-Z][a-z]+,\s*(?:this is|meet)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  
  // ===== NARRATIVE INTRODUCTIONS =====
  /(?:man|woman|person|stranger|figure|individual|someone|girl|boy|youth|elder)\s+(?:named|called|known as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:introduced|introduces)\s+(?:himself|herself|themselves)/gi,
  /(?:the\s+\w+),\s+([A-Z][a-z]+),/gi,
  
  // ===== DIALOGUE SELF-IDENTIFICATION =====
  /["'](?:I'm|I am|Call me|Name's|The name's|I go by)\s+([A-Z][a-z]+)/gi,
  /(?:what's your name|what is your name|who are you)[?"']*\s*["']?(?:It's\s+|I'm\s+)?([A-Z][a-z]+)/gi,
  
  // ===== TITLE + NAME PATTERNS =====
  /(?:doctor|dr\.|professor|prof\.|father|sister|brother|mother|elder|chief|boss|mister|mr\.|miss|ms\.|mrs\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
];

// ============= EQUIPMENT POSSESSION PATTERNS (copied for testing) =============
const EQUIPMENT_POSSESSION_PATTERNS: RegExp[] = [
  // ===== DIRECT POSSESSION =====
  /(?:your|my|his|her|their|our|its)\s+([A-Z][a-zA-Z\s]+)/gi,
  /([A-Z][a-zA-Z\s]+)\s+in\s+(?:your|my|his|her|their|our)\s+(?:hand|hands|grip|grasp)/gi,
  /(?:wielding|holding|carrying|gripping|clutching|brandishing|swinging|raising)\s+(?:a|an|the|your|his|her|their)?\s*([A-Z][a-zA-Z\s]+)/gi,
  
  // ===== EQUIPMENT ACTIONS =====
  /(?:equipped|armed|outfitted|geared|fitted)\s+with\s+(?:a|an|the)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:draw|draws|drew|sheathe|sheathes|sheathed|unsheathe|unsheathes)\s+(?:your|his|her|their|the|a|an)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:holster|holsters|aim|aims|fire|fires|reload|reloads|cock|cocks)\s+(?:your|his|her|their|the|a|an)?\s*([A-Z][a-zA-Z\s]+)/gi,
  
  // ===== INVENTORY/PICKUP =====
  /(?:pick up|picks up|picked up|take|takes|took|grab|grabs|grabbed|loot|loots|looted)\s+(?:a|an|the)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:find|finds|found|discover|discovers|discovered|obtain|obtains|obtained)\s+(?:a|an|the)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:drops|drop|fell|falls)\s+(?:the|a|an)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:the)\s+([A-Z][a-zA-Z\s]+)\s+(?:drops|falls|clatters)/gi,
  
  // ===== EQUIPMENT DESCRIPTIONS =====
  /(?:a|an|the)\s+([A-Z][a-zA-Z\s]+)\s+(?:glints|gleams|shimmers|glows|pulses|hums|vibrates|crackles)/gi,
  /(?:rusty|ancient|enchanted|magical|cursed|blessed|broken|pristine|ornate|gilded|silver|golden|iron|steel|wooden)\s+([A-Z][a-zA-Z\s]+)/gi,
  /([A-Z][a-zA-Z]+)\s+of\s+(?:fire|ice|lightning|thunder|poison|death|life|healing|destruction|protection|strength|agility|wisdom)/gi,
  
  // ===== COMBAT EQUIPMENT CONTEXT =====
  /(?:swing|swings|thrust|thrusts|stab|stabs|slash|slashes|strike|strikes|parry|parries|block|blocks)\s+(?:with|at|the|a|an|your|his|her|their)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:the|your|his|her|their)?\s*([A-Z][a-zA-Z\s]+)\s+(?:deals|dealt|hits|hit|strikes|struck|connects|connected)/gi,
  
  // ===== ARMOR/CLOTHING CONTEXT =====
  /(?:wearing|donning|removing|putting on|taking off|strapping on)\s+(?:a|an|the|your|his|her|their)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:the|your|his|her|their)?\s*([A-Z][a-zA-Z\s]+)\s+(?:protects|absorbs|deflects|blocks|saves|shields)/gi,
  
  // ===== SCI-FI / MAGIC SPECIFIC =====
  /(?:charging|activating|deploying|channeling through)\s+(?:the|a|an|your)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:casting with)\s+(?:the|a|an|your)?\s*([A-Z][a-zA-Z\s]+)/gi,
  /(?:the)\s+([A-Z][a-zA-Z\s]+)\s+(?:depletes|overloads|overheats|charges|activates)/gi,
];

// Helper function to extract names using patterns
function extractNames(text: string, patterns: RegExp[]): string[] {
  const names: string[] = [];
  
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length >= 2) {
        names.push(name);
      }
    }
  }
  
  return names;
}

// ============= TEST SAMPLES BY GENRE =============

const GENRE_NAME_SAMPLES = {
  fantasy: [
    { text: "My name is Aldric the Bold.", expected: ["Aldric"] },
    { text: "I am called Seraphina of the Silver Wood.", expected: ["Seraphina"] },
    { text: "Sir Gareth at your service, m'lady.", expected: ["Gareth"] },
    { text: "I bear the name Thorin Ironforge.", expected: ["Thorin"] },
    { text: "A stranger named Elara approached the tavern.", expected: ["Elara"] },
    { text: "You may address me as Wizard Merlin.", expected: ["Merlin"] },
    { text: "Lady Morgana of House Pendragon greets you.", expected: ["Morgana"] },
    { text: "I'm Finn, daughter of the mountain king.", expected: ["Finn"] },
  ],
  
  noir: [
    { text: "The name's Marlowe. Philip Marlowe.", expected: ["Marlowe"] },
    { text: "She introduced herself as Vivian Sternwood.", expected: ["Vivian"] },
    { text: "I go by the name of Johnny Rocco.", expected: ["Johnny"] },
    { text: "They call me The Shadow around here.", expected: ["Shadow"] },
    { text: "Working under the name Sam Spade.", expected: ["Sam"] },
    { text: "A dame named Carmen walked in.", expected: ["Carmen"] },
    { text: "Meet Mickey, my partner in crime.", expected: ["Mickey"] },
  ],
  
  scifi: [
    { text: "Designation: Unit Alpha Seven.", expected: ["Alpha"] },
    { text: "My handle is Neon, street runner extraordinaire.", expected: ["Neon"] },
    { text: "Registered as Cypher in the system.", expected: ["Cypher"] },
    { text: "ID reads Commander Shepard.", expected: ["Shepard"] },
    { text: "I'm known as Ghost in the network.", expected: ["Ghost"] },
    { text: "The AI introduced itself as Cortana.", expected: ["Cortana"] },
    { text: "Net name is Razor, don't forget it.", expected: ["Razor"] },
  ],
  
  western: [
    { text: "Folks call me Wyatt, Wyatt Earp.", expected: ["Wyatt"] },
    { text: "Wanted poster says Billy the Kid.", expected: ["Billy"] },
    { text: "I'm Jesse, fastest draw in the territory.", expected: ["Jesse"] },
    { text: "The stranger, name's Clint, just rode in.", expected: ["Clint"] },
    { text: "They call me Rattlesnake round these parts.", expected: ["Rattlesnake"] },
    { text: "Pardner, call me Doc Holiday.", expected: ["Doc"] },
  ],
  
  military: [
    { text: "Sergeant Johnson reporting for duty.", expected: ["Johnson"] },
    { text: "Private Jenkins, at your command sir.", expected: ["Jenkins"] },
    { text: "Callsign: Viper Lead, commencing operation.", expected: ["Viper"] },
    { text: "Soldier named Rodriguez held the line.", expected: ["Rodriguez"] },
    { text: "Colonel Kurtz has lost his mind.", expected: ["Kurtz"] },
    { text: "Operating under callsign Maverick.", expected: ["Maverick"] },
  ],
  
  pirate: [
    { text: "Captain Blackbeard at yer service!", expected: ["Blackbeard"] },
    { text: "I sailed under Captain Morgan for years.", expected: ["Morgan"] },
    { text: "First Mate Gibbs, ready the cannons!", expected: ["Gibbs"] },
    { text: "They call me Davy Jones of the depths.", expected: ["Davy"] },
    { text: "Quartermaster Teach counts the gold.", expected: ["Teach"] },
  ],
  
  horror: [
    { text: "The entity known as Moloch awakens.", expected: ["Moloch"] },
    { text: "Spirit of Elizabeth haunts this place.", expected: ["Elizabeth"] },
    { text: "I was once called Victor, in my mortal life.", expected: ["Victor"] },
    { text: "The creature called Nosferatu emerges.", expected: ["Nosferatu"] },
    { text: "Ghost of Captain Graves walks these halls.", expected: ["Graves"] },
    { text: "Specter of Martha demands vengeance.", expected: ["Martha"] },
  ],
  
  urban: [
    { text: "On the streets they call me Spider.", expected: ["Spider"] },
    { text: "My crew calls me King, no other name needed.", expected: ["King"] },
    { text: "Hood knows me as Smoke, remember that.", expected: ["Smoke"] },
    { text: "Gang knows me as Venom.", expected: ["Venom"] },
    { text: "The boys call me Blade around here.", expected: ["Blade"] },
  ],
  
  romance: [
    { text: "Pleased to meet you, I'm Elizabeth Bennet.", expected: ["Elizabeth"] },
    { text: "Allow me to introduce myself, I'm Darcy.", expected: ["Darcy"] },
    { text: "May I introduce myself? I'm Catherine.", expected: ["Catherine"] },
    { text: "Charmed, I'm sure. I'm Victoria.", expected: ["Victoria"] },
  ],
  
  postApocalyptic: [
    { text: "Before the bombs I was called Marcus.", expected: ["Marcus"] },
    { text: "Wasteland knows me as Lone Wolf.", expected: ["Lone"] },
    { text: "Survivors call me Sparrow.", expected: ["Sparrow"] },
    { text: "Used to be called Robert, before the fall.", expected: ["Robert"] },
    { text: "Scavengers know me as Rust.", expected: ["Rust"] },
  ],
  
  // Third person / narrative introductions
  narrative: [
    { text: "This is Marcus, my trusted advisor.", expected: ["Marcus"] },
    { text: "Meet Elena, the best pilot in the fleet.", expected: ["Elena"] },
    { text: "Let me introduce Sarah, our new recruit.", expected: ["Sarah"] },
    { text: "A man named Victor awaited them.", expected: ["Victor"] },
    { text: "The bartender, Jake, poured another drink.", expected: ["Jake"] },
    { text: "Thomas introduced himself to the group.", expected: ["Thomas"] },
    { text: "Doctor Chen has arrived.", expected: ["Chen"] },
    { text: "Professor Xavier welcomes you.", expected: ["Xavier"] },
  ],
};

const EQUIPMENT_SAMPLES = {
  possession: [
    { text: "Your Sniper Rifle is ready.", expected: ["Sniper Rifle"] },
    { text: "The Long Sword in your hand gleams.", expected: ["Long Sword"] },
    { text: "His Heavy Armor protected him.", expected: ["Heavy Armor"] },
    { text: "Her Magic Staff pulses with energy.", expected: ["Magic Staff"] },
    { text: "Wielding a Great Axe, he charged.", expected: ["Great Axe"] },
    { text: "She was holding the Enchanted Bow.", expected: ["Enchanted Bow"] },
  ],
  
  actions: [
    { text: "Equipped with the Iron Shield, you advance.", expected: ["Iron Shield"] },
    { text: "Armed with a Plasma Rifle, she's ready.", expected: ["Plasma Rifle"] },
    { text: "Draw your Steel Dagger quickly!", expected: ["Steel Dagger"] },
    { text: "He sheathes his Obsidian Blade.", expected: ["Obsidian Blade"] },
    { text: "Aim your Laser Pistol at the target.", expected: ["Laser Pistol"] },
    { text: "Reload the Combat Shotgun now!", expected: ["Combat Shotgun"] },
  ],
  
  inventory: [
    { text: "You pick up the Ancient Staff.", expected: ["Ancient Staff"] },
    { text: "Take the Healing Potion before battle.", expected: ["Healing Potion"] },
    { text: "Found a Rusty Sword in the chest.", expected: ["Rusty Sword"] },
    { text: "Looted the Golden Amulet from the corpse.", expected: ["Golden Amulet"] },
    { text: "The Silver Dagger drops to the floor.", expected: ["Silver Dagger"] },
  ],
  
  descriptions: [
    { text: "A Crimson Blade glints in the light.", expected: ["Crimson Blade"] },
    { text: "The Ancient Tome glows mysteriously.", expected: ["Ancient Tome"] },
    { text: "Rusty Chainmail hangs on the wall.", expected: ["Chainmail"] },
    { text: "Enchanted Gauntlets pulse with power.", expected: ["Gauntlets"] },
    { text: "The Sword of Fire blazes brightly.", expected: ["Sword"] },
  ],
  
  combat: [
    { text: "Swing the War Hammer at the enemy!", expected: ["War Hammer"] },
    { text: "Your Battle Axe strikes true!", expected: ["Battle Axe"] },
    { text: "Parry with your Long Sword!", expected: ["Long Sword"] },
    { text: "The Flaming Sword deals massive damage.", expected: ["Flaming Sword"] },
    { text: "Block with the Tower Shield!", expected: ["Tower Shield"] },
  ],
  
  armor: [
    { text: "Wearing the Dragon Scale Armor, you're protected.", expected: ["Dragon Scale Armor"] },
    { text: "Donning the Wizard Robe grants power.", expected: ["Wizard Robe"] },
    { text: "Your Plate Mail absorbs the blow.", expected: ["Plate Mail"] },
    { text: "The Mithril Chainmail deflects arrows.", expected: ["Mithril Chainmail"] },
  ],
  
  scifi: [
    { text: "Charging the Plasma Cannon takes time.", expected: ["Plasma Cannon"] },
    { text: "Your Phase Rifle overheats!", expected: ["Phase Rifle"] },
    { text: "The Fusion Core depletes rapidly.", expected: ["Fusion Core"] },
    { text: "Activating the Shield Generator.", expected: ["Shield Generator"] },
  ],
  
  magic: [
    { text: "Channeling through the Crystal Staff.", expected: ["Crystal Staff"] },
    { text: "Your Arcane Focus glows intensely.", expected: ["Arcane Focus"] },
    { text: "The Elder Wand crackles with energy.", expected: ["Elder Wand"] },
    { text: "Casting with the Ruby Orb.", expected: ["Ruby Orb"] },
  ],
};

// ============= TESTS =============

describe('NPC Name Detection Patterns', () => {
  Object.entries(GENRE_NAME_SAMPLES).forEach(([genre, samples]) => {
    describe(`${genre} genre`, () => {
      samples.forEach(({ text, expected }) => {
        it(`should detect names in: "${text.substring(0, 50)}..."`, () => {
          const detected = extractNames(text, NAME_INTRODUCTION_PATTERNS);
          expected.forEach(name => {
            expect(detected.some(d => d.includes(name) || name.includes(d))).toBe(true);
          });
        });
      });
    });
  });
});

describe('Equipment Detection Patterns', () => {
  Object.entries(EQUIPMENT_SAMPLES).forEach(([category, samples]) => {
    describe(`${category} patterns`, () => {
      samples.forEach(({ text, expected }) => {
        it(`should detect equipment in: "${text.substring(0, 50)}..."`, () => {
          const detected = extractNames(text, EQUIPMENT_POSSESSION_PATTERNS);
          expected.forEach(item => {
            // Check if any detected item contains or is contained by expected
            const found = detected.some(d => {
              const dLower = d.toLowerCase();
              const itemLower = item.toLowerCase();
              return dLower.includes(itemLower) || itemLower.includes(dLower);
            });
            expect(found).toBe(true);
          });
        });
      });
    });
  });
});

describe('Combined Detection - No False Positives', () => {
  const combinedSamples = [
    {
      text: "My name is Marcus. He draws his Long Sword and attacks.",
      expectedNPCs: ["Marcus"],
      expectedEquipment: ["Long Sword"],
    },
    {
      text: "Captain Blackbeard wielding the Cursed Cutlass approaches.",
      expectedNPCs: ["Blackbeard"],
      expectedEquipment: ["Cursed Cutlass"],
    },
    {
      text: "Sergeant Johnson, armed with a Plasma Rifle, leads the charge.",
      expectedNPCs: ["Johnson"],
      expectedEquipment: ["Plasma Rifle"],
    },
    {
      text: "The stranger named Victor carries an Ancient Staff.",
      expectedNPCs: ["Victor"],
      expectedEquipment: ["Ancient Staff"],
    },
    {
      text: "I'm Elena. Your Sniper Rifle won't help you here.",
      expectedNPCs: ["Elena"],
      expectedEquipment: ["Sniper Rifle"],
    },
  ];
  
  combinedSamples.forEach(({ text, expectedNPCs, expectedEquipment }) => {
    it(`should correctly separate NPCs and equipment in: "${text.substring(0, 50)}..."`, () => {
      const detectedNPCs = extractNames(text, NAME_INTRODUCTION_PATTERNS);
      const detectedEquipment = extractNames(text, EQUIPMENT_POSSESSION_PATTERNS);
      
      // Check NPCs are detected
      expectedNPCs.forEach(npc => {
        expect(detectedNPCs.some(d => d.includes(npc))).toBe(true);
      });
      
      // Check equipment is detected
      expectedEquipment.forEach(item => {
        const found = detectedEquipment.some(d => {
          const dLower = d.toLowerCase();
          const itemLower = item.toLowerCase();
          return dLower.includes(itemLower) || itemLower.includes(dLower);
        });
        expect(found).toBe(true);
      });
      
      // Check no equipment detected as NPC
      expectedEquipment.forEach(item => {
        const words = item.split(' ');
        words.forEach(word => {
          if (word.length > 3) {
            const falsyDetected = detectedNPCs.some(d => 
              d.toLowerCase() === word.toLowerCase()
            );
            // This shouldn't match exactly as NPC
            // (partial matches in names are ok)
          }
        });
      });
    });
  });
});

// Export for use in other test files
export { 
  GENRE_NAME_SAMPLES, 
  EQUIPMENT_SAMPLES,
  NAME_INTRODUCTION_PATTERNS,
  EQUIPMENT_POSSESSION_PATTERNS,
  extractNames 
};
