// ============================================================================
// GENRE LOADOUT SYSTEM - Starting gear selection by genre
// ============================================================================

import { InventoryItem } from '@/types/rpgCharacter';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadoutItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ItemCategory;
  stats: Record<string, number | boolean | string>;
  cost: number;
  portraitPrompt?: string;
  portraitPosition?: PortraitPosition;
  requires?: Record<string, string | boolean>;
  fromGenre?: string;
  isCustom?: boolean;
}

export interface ItemCategoryDef {
  label: string;
  required: boolean;
  maxSlots: number;
  icon: string;
  portraitTag: PortraitPosition;
  options: LoadoutItem[];
}

export interface LoadoutPreset {
  id: string;
  name: string;
  description: string;
  items: string[];
  cost: number;
}

export interface GenreLoadout {
  name: string;
  currency: string;
  currencyIcon: string;
  startingCurrency: number;
  categories: Record<string, ItemCategoryDef>;
  presets: LoadoutPreset[];
}

export type ItemCategory = 
  | 'weapons' 
  | 'armor' 
  | 'clothing' 
  | 'accessories' 
  | 'tech' 
  | 'tools' 
  | 'supplies' 
  | 'consumables'
  | 'light'
  | 'survival'
  | 'misc';

export type PortraitPosition = 'head' | 'body' | 'hand' | 'accessory' | 'none';

// ============================================================================
// ITEM CATEGORY DEFINITIONS
// ============================================================================

export const ITEM_CATEGORIES: Record<ItemCategory, { label: string; icon: string; color: string; defaultStats: Record<string, number>; portraitPosition: PortraitPosition }> = {
  weapons: { label: 'Weapon', icon: '⚔️', color: 'hsl(0 84% 60%)', defaultStats: { damage: 10, accuracy: 60 }, portraitPosition: 'hand' },
  armor: { label: 'Armor', icon: '🛡️', color: 'hsl(217 91% 60%)', defaultStats: { defense: 10 }, portraitPosition: 'body' },
  clothing: { label: 'Clothing', icon: '👕', color: 'hsl(271 91% 65%)', defaultStats: { style: 5 }, portraitPosition: 'body' },
  accessories: { label: 'Accessory', icon: '💍', color: 'hsl(38 92% 50%)', defaultStats: {}, portraitPosition: 'accessory' },
  tech: { label: 'Tech', icon: '💻', color: 'hsl(199 89% 48%)', defaultStats: {}, portraitPosition: 'hand' },
  tools: { label: 'Tool', icon: '🔧', color: 'hsl(220 9% 46%)', defaultStats: {}, portraitPosition: 'hand' },
  supplies: { label: 'Supplies', icon: '🎒', color: 'hsl(25 95% 53%)', defaultStats: {}, portraitPosition: 'none' },
  consumables: { label: 'Consumable', icon: '🧪', color: 'hsl(330 81% 60%)', defaultStats: { uses: 1 }, portraitPosition: 'none' },
  light: { label: 'Light Source', icon: '🔦', color: 'hsl(48 96% 53%)', defaultStats: {}, portraitPosition: 'hand' },
  survival: { label: 'Survival', icon: '🏕️', color: 'hsl(142 71% 45%)', defaultStats: {}, portraitPosition: 'none' },
  misc: { label: 'Miscellaneous', icon: '📦', color: 'hsl(215 16% 47%)', defaultStats: {}, portraitPosition: 'none' },
};

// ============================================================================
// CYBERPUNK LOADOUT
// ============================================================================

const CYBERPUNK_LOADOUT: GenreLoadout = {
  name: 'Cyberpunk',
  currency: 'credits',
  currencyIcon: '₵',
  startingCurrency: 500,
  categories: {
    weapons: {
      label: 'Weapon',
      required: false,
      maxSlots: 2,
      icon: '🔫',
      portraitTag: 'hand',
      options: [
        { id: 'cb_pistol', name: 'Compact Sidearm', description: 'Standard-issue 9mm pistol with smart targeting', icon: '🔫', category: 'weapons', stats: { damage: 15, accuracy: 70, concealable: true }, cost: 0, portraitPrompt: 'holding a compact futuristic pistol' },
        { id: 'cb_smg', name: 'Street Sweeper SMG', description: 'High fire rate, low accuracy spray weapon', icon: '🔫', category: 'weapons', stats: { damage: 10, accuracy: 40, rateOfFire: 'high' }, cost: 100, portraitPrompt: 'carrying a sleek submachine gun' },
        { id: 'cb_katana', name: 'Mono-Edge Katana', description: 'Molecularly sharpened blade for silent kills', icon: '⚔️', category: 'weapons', stats: { damage: 35, accuracy: 85, silent: true }, cost: 150, portraitPrompt: 'with a glowing mono-katana on back' },
        { id: 'cb_none', name: 'Unarmed', description: 'Start with no weapon (more starting credits)', icon: '✋', category: 'weapons', stats: {}, cost: -50, portraitPrompt: '' },
      ],
    },
    armor: {
      label: 'Protection',
      required: false,
      maxSlots: 1,
      icon: '🛡️',
      portraitTag: 'body',
      options: [
        { id: 'cb_jacket', name: 'Sleek Armored Jacket', description: 'Armor with glowing trim', icon: '🧥', category: 'armor', stats: { defense: 10, style: 5, concealable: true }, cost: 0, portraitPrompt: 'wearing a sleek armored jacket with glowing trim' },
        { id: 'cb_vest', name: 'Tactical Vest', description: 'Military-grade protection, obvious to observers', icon: '🦺', category: 'armor', stats: { defense: 25, style: -10, concealable: false }, cost: 100, portraitPrompt: 'wearing heavy tactical combat vest with pouches' },
        { id: 'cb_subdermal', name: 'Subdermal Plating', description: 'Under-skin armor implants', icon: '💠', category: 'armor', stats: { defense: 15, style: 0, concealable: true }, cost: 200, portraitPrompt: 'with visible subdermal armor patterns under skin' },
      ],
    },
    clothing: {
      label: 'Clothing',
      required: true,
      maxSlots: 1,
      icon: '👕',
      portraitTag: 'body',
      options: [
        { id: 'cb_streetwear', name: 'Street Fashion', description: 'Neon-accented urban wear', icon: '👕', category: 'clothing', stats: { style: 15, blend: 'street' }, cost: 0, portraitPrompt: 'wearing neon-trimmed streetwear with holographic patches' },
        { id: 'cb_corporate', name: 'Corporate Suit', description: 'High-end business attire with hidden tech', icon: '🕴️', category: 'clothing', stats: { style: 20, blend: 'corporate' }, cost: 50, portraitPrompt: 'wearing a sharp corporate suit with subtle tech integration' },
        { id: 'cb_nomad', name: 'Nomad Gear', description: 'Rugged wasteland survival outfit', icon: '🧥', category: 'clothing', stats: { style: 5, survival: 20 }, cost: 30, portraitPrompt: 'wearing dusty nomad gear with goggles and scarf' },
      ],
    },
    tech: {
      label: 'Tech Gear',
      required: false,
      maxSlots: 2,
      icon: '💻',
      portraitTag: 'accessory',
      options: [
        { id: 'cb_phone', name: 'Burner Comm', description: 'Untraceable communication device', icon: '📱', category: 'tech', stats: { hacking: 0, traceable: false }, cost: 0, portraitPrompt: '' },
        { id: 'cb_deck', name: 'Cyberdeck', description: 'Portable hacking terminal', icon: '💻', category: 'tech', stats: { hacking: 30, intrusion: true }, cost: 150, portraitPrompt: 'with cyberdeck interface cables visible' },
        { id: 'cb_scanner', name: 'Bio-Scanner', description: 'Detects cybernetics and vital signs', icon: '📡', category: 'tech', stats: { perception: 20, detectCyber: true }, cost: 75, portraitPrompt: 'with handheld scanner device' },
        { id: 'cb_medkit', name: 'Trauma Kit', description: 'Emergency medical supplies', icon: '🩹', category: 'tech', stats: { healing: 50, uses: 3 }, cost: 50, portraitPrompt: '' },
      ],
    },
    accessories: {
      label: 'Accessories',
      required: false,
      maxSlots: 2,
      icon: '🕶️',
      portraitTag: 'accessory',
      options: [
        { id: 'cb_shades', name: 'Mirrored Shades', description: 'Recording HUD built-in', icon: '🕶️', category: 'accessories', stats: { style: 10, recording: true, hudEnabled: true }, cost: 0, portraitPrompt: 'wearing mirrored cyberpunk sunglasses with HUD' },
        { id: 'cb_credstick', name: 'Credstick', description: 'Anonymous credit storage', icon: '💳', category: 'accessories', stats: { anonymous: true }, cost: 0, portraitPrompt: '' },
        { id: 'cb_cigs', name: 'Synth-Cigs', description: 'Stress relief, social lubricant', icon: '🚬', category: 'accessories', stats: { stress: -5, social: 5 }, cost: 10, portraitPrompt: 'with synth-cigarette' },
        { id: 'cb_arm', name: 'Cybernetic Arm', description: 'Chrome replacement arm with hidden tools', icon: '🦾', category: 'accessories', stats: { strength: 15, hiddenCompartment: true }, cost: 200, portraitPrompt: 'with a chrome cybernetic arm with visible circuitry' },
      ],
    },
  },
  presets: [
    { id: 'street_samurai', name: 'Street Samurai', description: 'Combat-focused with blade and armor', items: ['cb_katana', 'cb_vest', 'cb_streetwear', 'cb_medkit', 'cb_shades'], cost: 275 },
    { id: 'netrunner', name: 'NetRunner', description: 'Hacking specialist with minimal combat gear', items: ['cb_pistol', 'cb_jacket', 'cb_streetwear', 'cb_deck', 'cb_scanner', 'cb_phone'], cost: 225 },
    { id: 'ghost', name: 'Ghost', description: 'Stealth operative, hard to detect', items: ['cb_none', 'cb_subdermal', 'cb_corporate', 'cb_phone', 'cb_scanner'], cost: 275 },
  ],
};

// ============================================================================
// FANTASY LOADOUT
// ============================================================================

const FANTASY_LOADOUT: GenreLoadout = {
  name: 'Fantasy',
  currency: 'gold',
  currencyIcon: '🪙',
  startingCurrency: 100,
  categories: {
    weapons: {
      label: 'Weapon',
      required: false,
      maxSlots: 2,
      icon: '⚔️',
      portraitTag: 'hand',
      options: [
        { id: 'fan_sword', name: 'Longsword', description: 'Standard steel blade, reliable and versatile', icon: '⚔️', category: 'weapons', stats: { damage: 20, accuracy: 75 }, cost: 0, portraitPrompt: 'holding a gleaming longsword' },
        { id: 'fan_bow', name: 'Hunting Bow', description: 'Ranged weapon with quiver of 20 arrows', icon: '🏹', category: 'weapons', stats: { damage: 15, range: 'long', ammo: 20 }, cost: 0, portraitPrompt: 'with a wooden bow and quiver of arrows on back' },
        { id: 'fan_staff', name: 'Arcane Focus Staff', description: 'Enhances magical abilities', icon: '🪄', category: 'weapons', stats: { magicBonus: 15, damage: 5 }, cost: 50, requires: { archetype: 'mage' }, portraitPrompt: 'holding a glowing arcane staff with crystal focus' },
        { id: 'fan_dagger', name: 'Twin Daggers', description: 'Fast, concealable, good for backstabs', icon: '🗡️', category: 'weapons', stats: { damage: 12, accuracy: 85, backstab: 2.0 }, cost: 0, portraitPrompt: 'with twin daggers at belt' },
      ],
    },
    armor: {
      label: 'Armor',
      required: false,
      maxSlots: 1,
      icon: '🛡️',
      portraitTag: 'body',
      options: [
        { id: 'fan_leather', name: 'Leather Armor', description: 'Light, quiet, good mobility', icon: '🥋', category: 'armor', stats: { defense: 10, stealth: 0, mobility: 'full' }, cost: 0, portraitPrompt: 'wearing supple brown leather armor' },
        { id: 'fan_chain', name: 'Chainmail', description: 'Medium protection, some noise', icon: '⛓️', category: 'armor', stats: { defense: 20, stealth: -10, mobility: 'reduced' }, cost: 50, portraitPrompt: 'wearing gleaming chainmail hauberk' },
        { id: 'fan_plate', name: 'Plate Armor', description: 'Heavy protection, very loud', icon: '🛡️', category: 'armor', stats: { defense: 35, stealth: -30, mobility: 'slow' }, cost: 100, portraitPrompt: 'clad in full plate armor with detailed engravings' },
        { id: 'fan_robes', name: 'Enchanted Robes', description: 'Magic resistance, no physical protection', icon: '🧙', category: 'armor', stats: { defense: 5, magicResist: 25 }, cost: 75, portraitPrompt: 'wearing flowing enchanted robes with arcane symbols' },
      ],
    },
    clothing: {
      label: 'Clothing',
      required: true,
      maxSlots: 1,
      icon: '👕',
      portraitTag: 'body',
      options: [
        { id: 'fan_common', name: 'Common Clothes', description: 'Simple peasant garb', icon: '👕', category: 'clothing', stats: { style: 0, blend: 'common' }, cost: 0, portraitPrompt: 'wearing simple medieval commoner clothes' },
        { id: 'fan_noble', name: 'Noble Attire', description: 'Fine clothes befitting nobility', icon: '👔', category: 'clothing', stats: { style: 25, blend: 'noble' }, cost: 40, portraitPrompt: 'wearing fine noble attire with embroidered details' },
        { id: 'fan_traveler', name: "Traveler's Garb", description: 'Practical clothes for the road', icon: '🧥', category: 'clothing', stats: { style: 5, survival: 10 }, cost: 10, portraitPrompt: 'wearing practical traveler clothes with hooded cloak' },
      ],
    },
    supplies: {
      label: 'Supplies',
      required: false,
      maxSlots: 4,
      icon: '🎒',
      portraitTag: 'none',
      options: [
        { id: 'fan_potion', name: 'Health Potion (x3)', description: 'Restores 30 health each', icon: '🧪', category: 'supplies', stats: { healing: 30, uses: 3 }, cost: 30, portraitPrompt: 'with potion vials at belt' },
        { id: 'fan_rations', name: 'Trail Rations (7 days)', description: 'Food for a week of travel', icon: '🍖', category: 'supplies', stats: { food: 7 }, cost: 10, portraitPrompt: '' },
        { id: 'fan_rope', name: 'Rope (50ft)', description: 'Hemp rope, many uses', icon: '🪢', category: 'supplies', stats: { utility: true }, cost: 5, portraitPrompt: 'with coiled rope at hip' },
        { id: 'fan_torches', name: 'Torches (x5)', description: 'Light source, burns for 1 hour each', icon: '🔦', category: 'supplies', stats: { light: true, uses: 5 }, cost: 5, portraitPrompt: '' },
        { id: 'fan_lockpicks', name: "Thieves' Tools", description: 'Lockpicks and bypass tools', icon: '🔐', category: 'supplies', stats: { lockpicking: 20 }, cost: 25, portraitPrompt: '' },
      ],
    },
    accessories: {
      label: 'Accessories',
      required: false,
      maxSlots: 2,
      icon: '💍',
      portraitTag: 'accessory',
      options: [
        { id: 'fan_amulet', name: 'Protective Amulet', description: 'Wards against evil', icon: '📿', category: 'accessories', stats: { magicResist: 10 }, cost: 30, portraitPrompt: 'wearing a glowing protective amulet' },
        { id: 'fan_ring', name: 'Signet Ring', description: 'Mark of your house', icon: '💍', category: 'accessories', stats: { social: 10, identity: true }, cost: 20, portraitPrompt: 'with ornate signet ring' },
        { id: 'fan_cloak', name: 'Hooded Cloak', description: 'Conceals identity, weather protection', icon: '🧥', category: 'accessories', stats: { stealth: 10, weather: true }, cost: 15, portraitPrompt: 'wearing a mysterious hooded cloak' },
        { id: 'fan_familiar', name: 'Familiar (Owl)', description: 'Bonded creature that can scout', icon: '🦉', category: 'accessories', stats: { scouting: true, perception: 15 }, cost: 50, requires: { archetype: 'mage' }, portraitPrompt: 'with an owl familiar perched on shoulder' },
        { id: 'fan_heirloom', name: 'Family Heirloom', description: 'Mysterious item from your past', icon: '📿', category: 'accessories', stats: { mystery: true }, cost: 0, portraitPrompt: 'clutching a mysterious family heirloom' },
      ],
    },
  },
  presets: [
    { id: 'knight', name: 'Knight', description: 'Heavy armor, sword and shield', items: ['fan_sword', 'fan_plate', 'fan_common', 'fan_potion', 'fan_rations'], cost: 140 },
    { id: 'ranger', name: 'Ranger', description: 'Mobile archer with survival gear', items: ['fan_bow', 'fan_dagger', 'fan_leather', 'fan_traveler', 'fan_rations', 'fan_rope', 'fan_cloak'], cost: 30 },
    { id: 'wizard', name: 'Wizard', description: 'Arcane caster with magical equipment', items: ['fan_staff', 'fan_robes', 'fan_common', 'fan_familiar', 'fan_potion', 'fan_amulet'], cost: 185 },
  ],
};

// ============================================================================
// NOIR LOADOUT
// ============================================================================

const NOIR_LOADOUT: GenreLoadout = {
  name: 'Noir',
  currency: 'dollars',
  currencyIcon: '$',
  startingCurrency: 200,
  categories: {
    weapons: {
      label: 'Piece',
      required: false,
      maxSlots: 1,
      icon: '🔫',
      portraitTag: 'hand',
      options: [
        { id: 'noir_revolver', name: '.38 Revolver', description: 'Reliable six-shooter, detective standard', icon: '🔫', category: 'weapons', stats: { damage: 20, accuracy: 75, ammo: 6 }, cost: 0, portraitPrompt: 'with a .38 revolver in shoulder holster' },
        { id: 'noir_auto', name: '.45 Automatic', description: 'More firepower, louder report', icon: '🔫', category: 'weapons', stats: { damage: 25, accuracy: 65, ammo: 7 }, cost: 25, portraitPrompt: 'with a .45 automatic pistol' },
        { id: 'noir_blackjack', name: 'Blackjack', description: 'Leather sap for quiet takedowns', icon: '🏏', category: 'weapons', stats: { damage: 10, silent: true }, cost: 0, portraitPrompt: '' },
      ],
    },
    clothing: {
      label: 'Attire',
      required: true,
      maxSlots: 1,
      icon: '🕴️',
      portraitTag: 'body',
      options: [
        { id: 'noir_suit', name: 'Worn Suit', description: 'Seen better days, but still respectable', icon: '🕴️', category: 'clothing', stats: { style: 5, pockets: 2 }, cost: 0, portraitPrompt: 'wearing a worn but respectable suit' },
        { id: 'noir_trench', name: 'Trench Coat', description: 'The classic look, many hidden pockets', icon: '🧥', category: 'clothing', stats: { style: 15, pockets: 5, weather: true }, cost: 15, portraitPrompt: 'wearing a classic trench coat with collar turned up' },
      ],
    },
    tools: {
      label: 'Tools of the Trade',
      required: false,
      maxSlots: 3,
      icon: '🔧',
      portraitTag: 'accessory',
      options: [
        { id: 'noir_camera', name: 'Speed Graphic Camera', description: 'For surveillance and evidence', icon: '📷', category: 'tools', stats: { investigation: 15, evidence: true }, cost: 30, portraitPrompt: 'with a press camera hanging from neck' },
        { id: 'noir_flask', name: 'Hip Flask', description: 'Liquid courage (or bribery)', icon: '🥃', category: 'tools', stats: { stress: -10, social: 5 }, cost: 5, portraitPrompt: '' },
        { id: 'noir_notepad', name: 'Notepad & Pencil', description: 'For taking notes on cases', icon: '📝', category: 'tools', stats: { investigation: 5, memory: true }, cost: 0, portraitPrompt: '' },
        { id: 'noir_lockpicks', name: 'Lock Picks', description: 'For those locked doors', icon: '🔐', category: 'tools', stats: { lockpicking: 25 }, cost: 20, portraitPrompt: '' },
        { id: 'noir_bribe', name: 'Bribe Money', description: 'Extra cash for greasing palms', icon: '💵', category: 'tools', stats: { bribe: 50 }, cost: 50, portraitPrompt: '' },
      ],
    },
    accessories: {
      label: 'Accessories',
      required: false,
      maxSlots: 2,
      icon: '🎩',
      portraitTag: 'accessory',
      options: [
        { id: 'noir_hat', name: 'Fedora', description: 'The classic look, brim shadowing eyes', icon: '🎩', category: 'accessories', stats: { style: 10, recognition: -5 }, cost: 5, portraitPrompt: 'wearing a classic fedora hat' },
        { id: 'noir_cigs', name: 'Lucky Strikes', description: 'Everyone smokes in this town', icon: '🚬', category: 'accessories', stats: { stress: -5, social: 5 }, cost: 2, portraitPrompt: 'with a cigarette' },
        { id: 'noir_watch', name: 'Pocket Watch', description: 'Keeps you punctual', icon: '⌚', category: 'accessories', stats: { style: 5, timeAware: true }, cost: 10, portraitPrompt: 'with a pocket watch chain visible' },
      ],
    },
  },
  presets: [
    { id: 'private_eye', name: 'Private Eye', description: 'Classic detective setup', items: ['noir_revolver', 'noir_trench', 'noir_camera', 'noir_notepad', 'noir_hat', 'noir_cigs'], cost: 52 },
    { id: 'gumshoe', name: 'Gumshoe', description: 'Minimalist, relies on wits', items: ['noir_blackjack', 'noir_suit', 'noir_notepad', 'noir_lockpicks', 'noir_flask'], cost: 25 },
  ],
};

// ============================================================================
// HORROR LOADOUT
// ============================================================================

const HORROR_LOADOUT: GenreLoadout = {
  name: 'Horror',
  currency: 'dollars',
  currencyIcon: '$',
  startingCurrency: 150,
  categories: {
    weapons: {
      label: 'Defense',
      required: false,
      maxSlots: 1,
      icon: '🔪',
      portraitTag: 'hand',
      options: [
        { id: 'hor_knife', name: 'Kitchen Knife', description: 'Better than nothing', icon: '🔪', category: 'weapons', stats: { damage: 10, accuracy: 70 }, cost: 0, portraitPrompt: 'gripping a kitchen knife defensively' },
        { id: 'hor_bat', name: 'Baseball Bat', description: 'Good reach, solid swing', icon: '🏏', category: 'weapons', stats: { damage: 15, accuracy: 65 }, cost: 0, portraitPrompt: 'holding a baseball bat' },
        { id: 'hor_none', name: 'Nothing', description: 'Rely on your wits alone', icon: '✋', category: 'weapons', stats: {}, cost: -20, portraitPrompt: '' },
      ],
    },
    clothing: {
      label: 'Clothing',
      required: true,
      maxSlots: 1,
      icon: '👕',
      portraitTag: 'body',
      options: [
        { id: 'hor_casual', name: 'Casual Clothes', description: 'Just regular clothes', icon: '👕', category: 'clothing', stats: { style: 0 }, cost: 0, portraitPrompt: 'wearing casual everyday clothes' },
        { id: 'hor_outdoor', name: 'Outdoor Gear', description: 'Ready for rough terrain', icon: '🧥', category: 'clothing', stats: { survival: 15 }, cost: 20, portraitPrompt: 'wearing rugged outdoor hiking gear' },
      ],
    },
    light: {
      label: 'Light Source',
      required: true,
      maxSlots: 1,
      icon: '🔦',
      portraitTag: 'hand',
      options: [
        { id: 'hor_flashlight', name: 'Flashlight', description: 'Reliable beam, batteries included', icon: '🔦', category: 'light', stats: { light: 30, battery: 100 }, cost: 0, portraitPrompt: 'holding a flashlight, beam cutting through darkness' },
        { id: 'hor_phone', name: 'Smartphone', description: 'Weak light, but can call for help', icon: '📱', category: 'light', stats: { light: 10, communication: true, battery: 50 }, cost: 0, portraitPrompt: 'holding up smartphone for light' },
        { id: 'hor_lighter', name: 'Lighter', description: 'Minimal light, but can start fires', icon: '🔥', category: 'light', stats: { light: 5, fire: true }, cost: 0, portraitPrompt: 'with flickering lighter flame' },
      ],
    },
    supplies: {
      label: 'Supplies',
      required: false,
      maxSlots: 3,
      icon: '🩹',
      portraitTag: 'none',
      options: [
        { id: 'hor_firstaid', name: 'First Aid Kit', description: 'Basic medical supplies', icon: '🩹', category: 'supplies', stats: { healing: 40, uses: 2 }, cost: 20, portraitPrompt: '' },
        { id: 'hor_batteries', name: 'Extra Batteries', description: 'Keep the lights on', icon: '🔋', category: 'supplies', stats: { batteryRestore: 100, uses: 2 }, cost: 10, portraitPrompt: '' },
        { id: 'hor_snacks', name: 'Snacks', description: 'Keep your energy up', icon: '🍫', category: 'supplies', stats: { stamina: 20, uses: 3 }, cost: 5, portraitPrompt: '' },
        { id: 'hor_keys', name: 'Car Keys', description: 'Potential escape route', icon: '🔑', category: 'supplies', stats: { hasVehicle: true }, cost: 0, portraitPrompt: '' },
      ],
    },
  },
  presets: [
    { id: 'survivor', name: 'Survivor', description: 'Prepared for the worst', items: ['hor_bat', 'hor_outdoor', 'hor_flashlight', 'hor_firstaid', 'hor_batteries', 'hor_keys'], cost: 50 },
    { id: 'unprepared', name: 'Unprepared', description: 'Just your phone and wits', items: ['hor_none', 'hor_casual', 'hor_phone', 'hor_snacks'], cost: -15 },
  ],
};

// ============================================================================
// POST-APOCALYPTIC LOADOUT
// ============================================================================

const POSTAPOC_LOADOUT: GenreLoadout = {
  name: 'Post-Apocalyptic',
  currency: 'caps',
  currencyIcon: '🔘',
  startingCurrency: 50,
  categories: {
    weapons: {
      label: 'Weapon',
      required: false,
      maxSlots: 2,
      icon: '🔫',
      portraitTag: 'hand',
      options: [
        { id: 'pa_pipe', name: 'Pipe Rifle', description: 'Crude but functional', icon: '🔫', category: 'weapons', stats: { damage: 15, accuracy: 50, condition: 60 }, cost: 0, portraitPrompt: 'carrying a makeshift pipe rifle' },
        { id: 'pa_machete', name: 'Rusty Machete', description: 'Seen some use, still cuts', icon: '🔪', category: 'weapons', stats: { damage: 20, accuracy: 70, condition: 50 }, cost: 0, portraitPrompt: 'with a worn machete at hip' },
        { id: 'pa_crossbow', name: 'Makeshift Crossbow', description: 'Silent, reusable bolts', icon: '🏹', category: 'weapons', stats: { damage: 18, accuracy: 65, silent: true, ammo: 8 }, cost: 10, portraitPrompt: 'with a cobbled-together crossbow' },
      ],
    },
    armor: {
      label: 'Protection',
      required: false,
      maxSlots: 1,
      icon: '🛡️',
      portraitTag: 'body',
      options: [
        { id: 'pa_leather', name: 'Scrap Leather', description: 'Pieced together protection', icon: '🥋', category: 'armor', stats: { defense: 10, condition: 70 }, cost: 0, portraitPrompt: 'wearing patched scrap leather armor' },
        { id: 'pa_tire', name: 'Tire Armor', description: 'Heavy but effective', icon: '⚫', category: 'armor', stats: { defense: 20, mobility: -10, condition: 80 }, cost: 15, portraitPrompt: 'wearing heavy armor made from tires and scrap metal' },
        { id: 'pa_gasmask', name: 'Gas Mask', description: 'Essential for toxic zones', icon: '😷', category: 'armor', stats: { defense: 5, toxicResist: 90, condition: 50 }, cost: 20, portraitPrompt: 'wearing a weathered gas mask' },
      ],
    },
    clothing: {
      label: 'Clothing',
      required: true,
      maxSlots: 1,
      icon: '👕',
      portraitTag: 'body',
      options: [
        { id: 'pa_rags', name: 'Wasteland Rags', description: 'Better than nothing', icon: '👕', category: 'clothing', stats: { style: 0 }, cost: 0, portraitPrompt: 'wearing tattered wasteland rags' },
        { id: 'pa_duster', name: 'Road Duster', description: 'Classic wasteland look', icon: '🧥', category: 'clothing', stats: { style: 10 }, cost: 10, portraitPrompt: 'wearing a weathered duster coat' },
      ],
    },
    survival: {
      label: 'Survival Gear',
      required: false,
      maxSlots: 4,
      icon: '🏕️',
      portraitTag: 'none',
      options: [
        { id: 'pa_water', name: 'Water Canteen', description: 'Purified water, 3 days worth', icon: '🫗', category: 'survival', stats: { water: 3 }, cost: 10, portraitPrompt: 'with canteen at belt' },
        { id: 'pa_food', name: 'Canned Food (x5)', description: 'Pre-war preserved food', icon: '🥫', category: 'survival', stats: { food: 5 }, cost: 15, portraitPrompt: '' },
        { id: 'pa_rads', name: 'Anti-Rad Pills', description: 'Reduces radiation', icon: '💊', category: 'survival', stats: { radResist: 50, uses: 3 }, cost: 20, portraitPrompt: '' },
        { id: 'pa_toolkit', name: 'Repair Kit', description: 'Fix weapons and armor', icon: '🔧', category: 'survival', stats: { repair: 30, uses: 3 }, cost: 15, portraitPrompt: '' },
        { id: 'pa_map', name: 'Area Map', description: 'Shows nearby locations', icon: '🗺️', category: 'survival', stats: { navigation: true }, cost: 5, portraitPrompt: '' },
      ],
    },
  },
  presets: [
    { id: 'wastelander', name: 'Wastelander', description: 'Balanced survival setup', items: ['pa_pipe', 'pa_machete', 'pa_leather', 'pa_duster', 'pa_water', 'pa_food', 'pa_map'], cost: 40 },
    { id: 'scavenger', name: 'Scavenger', description: 'Light and mobile', items: ['pa_crossbow', 'pa_rags', 'pa_toolkit', 'pa_water', 'pa_map'], cost: 40 },
  ],
};

// ============================================================================
// MODERN LIFE LOADOUT
// ============================================================================

const MODERN_LIFE_LOADOUT: GenreLoadout = {
  name: 'Modern Life',
  currency: 'dollars',
  currencyIcon: '$',
  startingCurrency: 500,
  categories: {
    housing: {
      label: 'Housing',
      required: true,
      maxSlots: 1,
      icon: '🏠',
      portraitTag: 'none',
      options: [
        { id: 'ml_studio', name: 'Studio Apartment', description: 'Compact city living, affordable but cramped', icon: '🏢', category: 'misc', stats: { comfort: 30, space: 20, rent: 800 }, cost: 0, portraitPrompt: '' },
        { id: 'ml_1br', name: '1-Bedroom Apartment', description: 'Decent space in a mid-rise building', icon: '🏠', category: 'misc', stats: { comfort: 50, space: 40, rent: 1200 }, cost: 100, portraitPrompt: '' },
        { id: 'ml_shared', name: 'Shared House', description: 'Room in a house with roommates', icon: '🏡', category: 'misc', stats: { comfort: 40, space: 30, social: 15, rent: 600 }, cost: 0, portraitPrompt: '' },
        { id: 'ml_loft', name: 'Downtown Loft', description: 'Trendy open-plan living in the city center', icon: '🌆', category: 'misc', stats: { comfort: 70, space: 60, style: 20, rent: 2000 }, cost: 200, portraitPrompt: '' },
      ],
    },
    clothing: {
      label: 'Wardrobe',
      required: true,
      maxSlots: 1,
      icon: '👔',
      portraitTag: 'body',
      options: [
        { id: 'ml_casual', name: 'Casual Basics', description: 'Jeans, t-shirts, comfortable everyday wear', icon: '👕', category: 'clothing', stats: { style: 20, comfort: 30 }, cost: 0, portraitPrompt: 'wearing casual modern clothes like jeans and a comfortable t-shirt' },
        { id: 'ml_business', name: 'Business Casual', description: 'Smart clothes suitable for office work', icon: '👔', category: 'clothing', stats: { style: 40, professional: 30 }, cost: 50, portraitPrompt: 'wearing smart business casual attire' },
        { id: 'ml_trendy', name: 'Trendy Fashion', description: 'Current season styles, Instagram-worthy', icon: '✨', category: 'clothing', stats: { style: 60, social: 20 }, cost: 100, portraitPrompt: 'wearing trendy, fashionable modern clothing' },
        { id: 'ml_athletic', name: 'Athleisure', description: 'Sporty and comfortable activewear', icon: '🏃', category: 'clothing', stats: { style: 30, fitness: 20, comfort: 40 }, cost: 50, portraitPrompt: 'wearing stylish athleisure activewear' },
      ],
    },
    tech: {
      label: 'Tech & Gadgets',
      required: false,
      maxSlots: 3,
      icon: '📱',
      portraitTag: 'hand',
      options: [
        { id: 'ml_phone', name: 'Smartphone', description: 'Your lifeline to the world', icon: '📱', category: 'tech', stats: { social: 30, productivity: 20, entertainment: 30 }, cost: 0, portraitPrompt: 'with smartphone in hand' },
        { id: 'ml_laptop', name: 'Laptop', description: 'Essential for work and entertainment', icon: '💻', category: 'tech', stats: { productivity: 50, entertainment: 40, workFromHome: true }, cost: 50, portraitPrompt: 'with laptop bag' },
        { id: 'ml_earbuds', name: 'Wireless Earbuds', description: 'Music on the go, calls in privacy', icon: '🎧', category: 'tech', stats: { entertainment: 20, social: 10 }, cost: 25, portraitPrompt: 'wearing wireless earbuds' },
        { id: 'ml_watch', name: 'Smart Watch', description: 'Fitness tracking and notifications', icon: '⌚', category: 'tech', stats: { fitness: 15, productivity: 10, style: 10 }, cost: 50, portraitPrompt: 'wearing a smart watch' },
      ],
    },
    transport: {
      label: 'Transportation',
      required: false,
      maxSlots: 1,
      icon: '🚗',
      portraitTag: 'none',
      options: [
        { id: 'ml_transit', name: 'Transit Pass', description: 'Monthly public transportation pass', icon: '🚇', category: 'misc', stats: { mobility: 60, cost: 100 }, cost: 0, portraitPrompt: '' },
        { id: 'ml_bike', name: 'City Bike', description: 'Eco-friendly and good exercise', icon: '🚲', category: 'misc', stats: { mobility: 50, fitness: 20, eco: 30 }, cost: 50, portraitPrompt: '' },
        { id: 'ml_scooter', name: 'Electric Scooter', description: 'Quick urban transportation', icon: '🛴', category: 'misc', stats: { mobility: 55, style: 15 }, cost: 75, portraitPrompt: '' },
        { id: 'ml_car', name: 'Used Car', description: 'Freedom to go anywhere, parking not included', icon: '🚗', category: 'misc', stats: { mobility: 90, maintenance: 200, insurance: 150 }, cost: 200, portraitPrompt: '' },
      ],
    },
    lifestyle: {
      label: 'Lifestyle Items',
      required: false,
      maxSlots: 4,
      icon: '☕',
      portraitTag: 'accessory',
      options: [
        { id: 'ml_coffee', name: 'Coffee Maker', description: 'Essential morning fuel station', icon: '☕', category: 'misc', stats: { energy: 20, savings: 30 }, cost: 25, portraitPrompt: 'holding a coffee cup' },
        { id: 'ml_gym', name: 'Gym Membership', description: 'Monthly access to fitness facilities', icon: '💪', category: 'misc', stats: { fitness: 40, social: 15 }, cost: 50, portraitPrompt: '' },
        { id: 'ml_streaming', name: 'Streaming Subscriptions', description: 'Netflix, Spotify, all the essentials', icon: '📺', category: 'misc', stats: { entertainment: 50, social: 10 }, cost: 25, portraitPrompt: '' },
        { id: 'ml_pet', name: 'Pet (Cat or Dog)', description: 'Furry companion for emotional support', icon: '🐕', category: 'misc', stats: { happiness: 40, social: 20, responsibility: 30 }, cost: 100, portraitPrompt: 'with a cute pet companion' },
        { id: 'ml_plants', name: 'Houseplants Collection', description: 'Bring life and color to your space', icon: '🌿', category: 'misc', stats: { comfort: 15, style: 10, happiness: 10 }, cost: 25, portraitPrompt: '' },
      ],
    },
    career: {
      label: 'Career Starter',
      required: false,
      maxSlots: 1,
      icon: '💼',
      portraitTag: 'none',
      options: [
        { id: 'ml_resume', name: 'Professional Resume', description: 'Polished CV ready to impress', icon: '📄', category: 'misc', stats: { jobSearch: 30 }, cost: 0, portraitPrompt: '' },
        { id: 'ml_portfolio', name: 'Online Portfolio', description: 'Showcase your work and skills', icon: '🌐', category: 'misc', stats: { jobSearch: 40, creativity: 20 }, cost: 50, portraitPrompt: '' },
        { id: 'ml_network', name: 'Professional Network', description: 'Connections in your industry', icon: '🤝', category: 'misc', stats: { jobSearch: 50, social: 30 }, cost: 75, portraitPrompt: '' },
        { id: 'ml_savings', name: 'Emergency Savings', description: 'Three months of expenses saved up', icon: '💰', category: 'misc', stats: { security: 50, stress: -20 }, cost: 150, portraitPrompt: '' },
      ],
    },
    social: {
      label: 'Social Life',
      required: false,
      maxSlots: 2,
      icon: '👥',
      portraitTag: 'none',
      options: [
        { id: 'ml_hobby', name: 'Active Hobby', description: 'Sports team, dance class, or outdoor activity', icon: '⚽', category: 'misc', stats: { social: 30, fitness: 20, fun: 40 }, cost: 50, portraitPrompt: '' },
        { id: 'ml_creative', name: 'Creative Hobby', description: 'Art, music, writing, or crafting', icon: '🎨', category: 'misc', stats: { creativity: 40, stress: -20, fun: 30 }, cost: 50, portraitPrompt: '' },
        { id: 'ml_dating', name: 'Dating App Premium', description: 'Boost your romantic prospects', icon: '❤️', category: 'misc', stats: { romance: 30, social: 20 }, cost: 25, portraitPrompt: '' },
        { id: 'ml_club', name: 'Club Membership', description: 'Book club, gaming group, or social club', icon: '📚', category: 'misc', stats: { social: 40, fun: 25, networking: 20 }, cost: 25, portraitPrompt: '' },
      ],
    },
  },
  presets: [
    { id: 'fresh_grad', name: 'Fresh Graduate', description: 'Just starting out with basics', items: ['ml_shared', 'ml_casual', 'ml_phone', 'ml_laptop', 'ml_transit', 'ml_resume', 'ml_coffee'], cost: 75 },
    { id: 'young_pro', name: 'Young Professional', description: 'Career-focused with comfort', items: ['ml_1br', 'ml_business', 'ml_phone', 'ml_laptop', 'ml_watch', 'ml_gym', 'ml_network'], cost: 325 },
    { id: 'creative', name: 'Creative Type', description: 'Artistic lifestyle with flexibility', items: ['ml_studio', 'ml_trendy', 'ml_phone', 'ml_laptop', 'ml_earbuds', 'ml_creative', 'ml_plants', 'ml_streaming'], cost: 275 },
    { id: 'social_butterfly', name: 'Social Butterfly', description: 'All about connections and experiences', items: ['ml_shared', 'ml_trendy', 'ml_phone', 'ml_earbuds', 'ml_hobby', 'ml_dating', 'ml_club', 'ml_streaming'], cost: 225 },
  ],
};

// ============================================================================
// GENRE LOADOUT MAP
// ============================================================================

export const GENRE_LOADOUTS: Record<string, GenreLoadout> = {
  cyberpunk: CYBERPUNK_LOADOUT,
  fantasy: FANTASY_LOADOUT,
  noir: NOIR_LOADOUT,
  horror: HORROR_LOADOUT,
  postapoc: POSTAPOC_LOADOUT,
  'post-apocalyptic': POSTAPOC_LOADOUT,
  scifi: CYBERPUNK_LOADOUT, // Fallback to cyberpunk for sci-fi
  western: FANTASY_LOADOUT, // Fallback to fantasy for western (similar item types)
  modern: NOIR_LOADOUT, // Fallback to noir for modern
  modern_life: MODERN_LIFE_LOADOUT,
  'modern-life': MODERN_LIFE_LOADOUT,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get loadout for a genre (or merge multiple genres)
 */
export function getLoadoutForGenres(selectedGenres: string[]): GenreLoadout {
  if (!selectedGenres || selectedGenres.length === 0) {
    return GENRE_LOADOUTS.fantasy;
  }

  if (selectedGenres.length === 1) {
    return GENRE_LOADOUTS[selectedGenres[0].toLowerCase()] || GENRE_LOADOUTS.fantasy;
  }

  // Merge multiple genres
  const primary = GENRE_LOADOUTS[selectedGenres[0].toLowerCase()] || GENRE_LOADOUTS.fantasy;
  
  const merged: GenreLoadout = {
    name: selectedGenres.map(g => GENRE_LOADOUTS[g.toLowerCase()]?.name || g).join(' × '),
    currency: primary.currency,
    currencyIcon: primary.currencyIcon,
    startingCurrency: primary.startingCurrency,
    categories: JSON.parse(JSON.stringify(primary.categories)),
    presets: [...primary.presets],
  };

  // Add unique items from secondary genres
  for (const genre of selectedGenres.slice(1)) {
    const secondary = GENRE_LOADOUTS[genre.toLowerCase()];
    if (!secondary) continue;

    for (const [catKey, cat] of Object.entries(secondary.categories)) {
      if (!merged.categories[catKey]) {
        merged.categories[catKey] = JSON.parse(JSON.stringify(cat));
      } else {
        for (const option of cat.options) {
          if (!merged.categories[catKey].options.find(o => o.id === option.id)) {
            merged.categories[catKey].options.push({
              ...option,
              fromGenre: genre,
            });
          }
        }
      }
    }
  }

  return merged;
}

/**
 * Get currency icon for a currency type
 */
export function getCurrencyIcon(currency: string): string {
  const icons: Record<string, string> = {
    credits: '₵',
    gold: '🪙',
    dollars: '$',
    caps: '🔘',
  };
  return icons[currency] || '$';
}

/**
 * Convert loadout items to inventory items
 */
export function loadoutToInventory(selectedItems: LoadoutItem[]): InventoryItem[] {
  return selectedItems.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    quantity: 1,
    type: categoryToInventoryType(item.category),
    effects: Object.keys(item.stats).length > 0 ? {
      stat: 'strength' as keyof import('@/types/rpgCharacter').CharacterStats,
      modifier: 0,
    } : undefined,
  }));
}

function categoryToInventoryType(category: ItemCategory): InventoryItem['type'] {
  switch (category) {
    case 'weapons': return 'weapon';
    case 'armor': return 'armor';
    case 'consumables':
    case 'supplies': return 'consumable';
    case 'tools':
    case 'tech': return 'tool';
    default: return 'treasure';
  }
}

/**
 * Calculate total cost of selected items
 */
export function calculateLoadoutCost(selectedItems: LoadoutItem[]): number {
  return selectedItems.reduce((total, item) => total + (item.cost || 0), 0);
}

/**
 * Build portrait prompts from selected items
 */
export function buildPortraitDataFromLoadout(selectedItems: LoadoutItem[]): Array<{ prompt: string; category: ItemCategory; position: PortraitPosition }> {
  return selectedItems
    .filter(item => item.portraitPrompt)
    .map(item => ({
      prompt: item.portraitPrompt!,
      category: item.category,
      position: item.portraitPosition || ITEM_CATEGORIES[item.category]?.portraitPosition || 'none',
    }));
}
