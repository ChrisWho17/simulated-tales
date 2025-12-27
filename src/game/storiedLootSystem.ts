// Storied Loot System - Every item answers: Who used it? Why is it here? What does it cost to keep?
// "A ring with the inside worn smooth. Someone kept taking it off. Someone kept putting it back on."

export type LootStoryType = 
  | 'previous_owner'    // Who had this last?
  | 'origin'            // Where/how was it made?
  | 'journey'           // How did it get here?
  | 'cost'              // What does it cost to keep?
  | 'secret'            // What hidden quality does it have?
  | 'connection'        // Who else wants it?
  | 'wear'              // What marks does use leave?
  | 'memory';           // What memories cling to it?

export interface ItemStory {
  itemName: string;
  storyType: LootStoryType;
  narrative: string;
  hook?: string;        // Plot hook this creates
  mechanicalNote?: string; // Any gameplay implications
}

export interface StoriedItem {
  id: string;
  baseName: string;           // "Ring"
  descriptiveName: string;    // "Ring with worn-smooth inside"
  stories: ItemStory[];
  briefDescription: string;   // One-sentence evocative description
  fullDescription?: string;   // Detailed examination text
}

// Story templates by item category
const STORY_TEMPLATES: Record<string, Partial<Record<LootStoryType, string[]>>> = {
  weapon: {
    previous_owner: [
      "The grip is worn smooth in a pattern that doesn't match your hand",
      "Someone carved initials into the pommel, then tried to scratch them out",
      "There's a notch in the blade. Deliberate. A count of something",
      "The balance is wrong for you—perfect for someone shorter",
      "Dried blood in the crevices that won't wash out"
    ],
    wear: [
      "The edge shows more use on one side than the other",
      "Someone sharpened this obsessively. The blade is thin from it",
      "The leather wrap is stained with old sweat and newer fear"
    ],
    cost: [
      "It catches on clothing, eager to be drawn",
      "The weight of it changes how you walk. How you think",
      "Carrying this marks you as someone who expects trouble"
    ],
    secret: [
      "In certain light, the metal shows a faint pattern. Letters? A map?",
      "It hums at a frequency you can feel but not hear",
      "The blade never quite warms to body temperature"
    ]
  },
  jewelry: {
    previous_owner: [
      "The inside is worn smooth. Someone kept taking it off. Someone kept putting it back on",
      "Sized for someone with larger hands. Or swollen knuckles",
      "There's an inscription, but time has made it illegible",
      "A strand of hair caught in the clasp. Gray. Long"
    ],
    memory: [
      "It feels heavier than it should, as if weighted with significance",
      "When you hold it, your fingers curl in patterns that aren't yours",
      "A faint scent clings to it. Perfume someone else wore"
    ],
    connection: [
      "You've seen this design before. On someone else. Recently",
      "The gem is famous, in certain circles. People will recognize it",
      "This was reported stolen. Years ago. From someone important"
    ],
    cost: [
      "Wearing this publicly makes a statement. Not everyone will like it",
      "Insurance for something like this requires questions you can't answer",
      "You'll think about losing it. Every day. Every crowd"
    ]
  },
  book: {
    previous_owner: [
      "Notes in the margins. Angry disagreements with the author",
      "A bookmark: a pressed flower from somewhere far away",
      "The corners are folded on specific pages. A pattern?",
      "Someone underlined the same phrase on every page they could find it"
    ],
    secret: [
      "The binding contains more than just thread",
      "Some pages stick together. They're not damaged—they're hidden",
      "The book is lighter than it should be. Hollow, maybe"
    ],
    cost: [
      "This book is banned somewhere. Possibly everywhere",
      "Knowledge like this comes with expectations",
      "People have killed for copies of this. People have died protecting them"
    ]
  },
  clothing: {
    previous_owner: [
      "It fits too well. Like it was made for someone exactly your size. Exactly",
      "Patches of wear that don't match how you wear things",
      "A faint scent that no washing removes completely"
    ],
    wear: [
      "The pockets are stretched from carrying something heavy",
      "One sleeve is more worn. Left-handed owner. You're not",
      "Reinforced in places that suggest specific dangers"
    ],
    secret: [
      "A hidden pocket. Empty now, but sized for something specific",
      "The lining is wrong. Too thick. Too heavy",
      "Certain movements reveal a glint of metal within"
    ]
  },
  container: {
    origin: [
      "Made from wood that doesn't grow in this region. Or this century",
      "The craftsmanship is wrong for this era. Better. Older",
      "Marks on the inside suggest it held something else. Something alive"
    ],
    journey: [
      "Travel stickers from places that don't exist anymore",
      "Salt damage from a sea voyage. Or tears",
      "Burn marks on the outside. Whatever was inside was protected at cost"
    ],
    previous_owner: [
      "Initials of someone famous. Or infamous",
      "A child's drawing, hidden under the false bottom",
      "It opens with a trick only the previous owner knew"
    ]
  },
  key: {
    origin: [
      "The metal is wrong—too old for the lock it fits",
      "Hand-filed. Someone made this in secret",
      "The pattern is unique. Or supposed to be"
    ],
    connection: [
      "You've seen this keyhole. In a dream, maybe",
      "Someone is looking for this. Has been looking for years",
      "The lock this fits has been destroyed. So what does it open now?"
    ],
    secret: [
      "It unlocks more than one thing. Things the makers didn't intend",
      "The key is warm. It's always warm",
      "Sometimes it vibrates, like a tuning fork for something distant"
    ]
  },
  default: {
    previous_owner: [
      "Someone used this every day. You can tell",
      "There's a story here, worn into the surface",
      "This wasn't lost. It was left. Deliberately"
    ],
    journey: [
      "It's traveled farther than you have. You can feel it",
      "The wear patterns tell of long roads and longer nights",
      "Someone carried this through something terrible"
    ],
    cost: [
      "Owning this means something. To someone",
      "This will be recognized. Remembered",
      "Things like this don't stay hidden"
    ]
  }
};

// Generate a story for an item
export function generateItemStory(
  itemName: string,
  category: string = 'default',
  storyType?: LootStoryType
): ItemStory {
  const templates = STORY_TEMPLATES[category] || STORY_TEMPLATES.default;
  
  // Pick story type
  const types = Object.keys(templates) as LootStoryType[];
  const selectedType = storyType || types[Math.floor(Math.random() * types.length)];
  
  // Get narratives for this type
  const narratives = templates[selectedType] || STORY_TEMPLATES.default.previous_owner!;
  const narrative = narratives[Math.floor(Math.random() * narratives.length)];
  
  return {
    itemName,
    storyType: selectedType,
    narrative
  };
}

// Create a storied item from a base item
export function createStoriedItem(
  baseName: string,
  category: string = 'default',
  numStories: number = 2
): StoriedItem {
  const stories: ItemStory[] = [];
  const usedTypes = new Set<LootStoryType>();
  
  for (let i = 0; i < numStories; i++) {
    const story = generateItemStory(baseName, category);
    if (!usedTypes.has(story.storyType)) {
      stories.push(story);
      usedTypes.add(story.storyType);
    }
  }
  
  // Create evocative name from first story
  const briefDescription = stories[0]?.narrative || `A ${baseName} with history`;
  
  // Extract key imagery for descriptive name
  const descriptiveName = briefDescription.split('.')[0].length < 40 
    ? `${baseName}: ${briefDescription.split('.')[0].toLowerCase()}`
    : baseName;
  
  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    baseName,
    descriptiveName,
    stories,
    briefDescription
  };
}

// Build loot context for AI
export function buildStoriedLootContext(): string {
  return `## STORIED LOOT - ITEMS WITH MEANING

When players find, receive, or loot items, give them STORIES, not just stats.
Every item should answer at least one:
- **Who used this last?** (marks of wear, personal touches, lingering presence)
- **Why is it here?** (journey, loss, deliberate placement)
- **What does it cost to keep?** (attention, danger, moral weight)

EXAMPLES:
• "A ring with the inside worn smooth. Someone kept taking it off. Someone kept putting it back on."
• "A knife with a notch in the blade. Deliberate. A count of something."
• "A book with one page torn out. The missing page is referenced everywhere else."
• "A key to a lock that's been destroyed. So what does it open now?"

ITEM DESCRIPTION RULES:
- Lead with the evocative detail, not the function
- Physical wear tells stories without words
- Mysteries are better than answers
- Items can create plot hooks ("Someone will recognize this")
- Let players ask questions you haven't answered
- NOT everything needs a story—save it for meaningful finds

When describing loot, use [STORIED_LOOT:itemName:storyType:narrative] for items with weight.
Story types: previous_owner, origin, journey, cost, secret, connection, wear, memory`;
}

// Detect item category from name
export function detectItemCategory(itemName: string): string {
  const lower = itemName.toLowerCase();
  
  if (/sword|blade|axe|dagger|knife|spear|bow|staff|wand|gun|pistol|rifle/.test(lower)) return 'weapon';
  if (/ring|necklace|bracelet|amulet|pendant|earring|brooch|circlet/.test(lower)) return 'jewelry';
  if (/book|tome|journal|diary|scroll|letter|note|manuscript/.test(lower)) return 'book';
  if (/cloak|robe|armor|shirt|pants|boots|gloves|hat|helm|coat/.test(lower)) return 'clothing';
  if (/box|chest|bag|pouch|case|satchel|backpack|container/.test(lower)) return 'container';
  if (/key|lockpick|keyring/.test(lower)) return 'key';
  
  return 'default';
}
