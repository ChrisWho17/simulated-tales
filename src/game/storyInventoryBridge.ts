// ============================================================================
// STORY-INVENTORY BRIDGE - Connects narrative with inventory system
// Fixes: Story mentions items but inventory is empty
// ============================================================================

import { GameGenre } from '@/types/genreData';
import { 
  detectItemType, 
  GeneratedItem,
  WeaponType,
  ApparelType,
} from './itemCategorySystem';
import { 
  BASE_WEAPON_STATS, 
  COMPATIBLE_SLOTS_BY_TYPE, 
  EQUIP_SLOTS_BY_WEAPON_TYPE, 
  DEFAULT_CALIBERS 
} from './weaponModsSystem';
import { InventoryItem, InventoryState, EquippedState } from './inventorySystem';

// ============================================================================
// STARTING GEAR DEFINITIONS BY GENRE
// ============================================================================

export interface StartingGearItem {
  name: string;
  category: 'weapons' | 'apparel' | 'aid' | 'ammo' | 'keyItems' | 'misc';
  weaponType?: WeaponType;
  apparelType?: ApparelType;
  description?: string;
  quantity?: number;
  autoEquip?: string; // Slot to auto-equip to
}

export interface GenreStartingGear {
  default: StartingGearItem[];
  [characterClass: string]: StartingGearItem[];
}

export const STARTING_GEAR: Record<string, GenreStartingGear> = {
  // ============================================================================
  // FANTASY QUEST
  // Role: Aspiring adventurer (young knight/warrior chosen by prophecy)
  // ============================================================================
  fantasy: {
    default: [
      { name: 'Longsword', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A well-balanced steel longsword, faithful companion of any aspiring adventurer.' },
      { name: 'Wooden Shield', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'A sturdy wooden shield for defense in melee combat.' },
      { name: 'Dagger', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'A small backup blade for utility or close quarters.' },
      { name: 'Chainmail Shirt', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Interlocking metal rings providing solid body protection.' },
      { name: 'Travel Clothes', category: 'apparel', apparelType: 'legs', autoEquip: 'legs', description: 'Simple but durable clothing worn beneath armor.' },
      { name: 'Leather Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Sturdy boots for long journeys on foot.' },
      { name: 'Adventurer\'s Backpack', category: 'misc', description: 'A reliable pack holding your essential gear.' },
      { name: 'Rope (50 ft)', category: 'misc', description: 'Fifty feet of hempen rope for climbing or binding.' },
      { name: 'Torches', category: 'misc', quantity: 3, description: 'Oil-soaked torches for lighting dark places.' },
      { name: 'Flint and Steel', category: 'misc', description: 'For starting fires in the wilderness.' },
      { name: 'Rations', category: 'aid', quantity: 5, description: 'Dried meat and hardtack for sustenance on the road.' },
      { name: 'Waterskin', category: 'aid', description: 'Leather waterskin, currently full.' },
      { name: 'Health Potion', category: 'aid', quantity: 2, description: 'A ruby-red elixir that restores vitality.' },
      { name: 'Prophecy Map', category: 'keyItems', description: 'An ancient map tied to the prophecy that set you on this path.' },
      { name: 'Coin Purse', category: 'misc', description: 'Contains a modest amount of gold coins.' },
    ],
    warrior: [
      { name: 'Bastard Sword', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A heavy two-handed sword.' },
      { name: 'Chain Mail', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Interlocking metal rings for protection.' },
      { name: 'Steel Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'A sturdy steel helmet.' },
      { name: 'Health Potion', category: 'aid', quantity: 3, description: 'Restores vitality when consumed.' },
    ],
    mage: [
      { name: 'Staff of Power', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A wooden staff imbued with arcane energy.' },
      { name: 'Robes of the Arcane', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Enchanted robes that enhance magical ability.' },
      { name: 'Mana Potion', category: 'aid', quantity: 3, description: 'Restores magical energy.' },
      { name: 'Spellbook', category: 'keyItems', description: 'Your personal grimoire of spells.' },
    ],
    rogue: [
      { name: 'Daggers', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A matched pair of throwing daggers.' },
      { name: 'Leather Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Silent, dark leather for stealth.' },
      { name: 'Lockpicks', category: 'misc', description: 'A set of quality lockpicks.' },
      { name: 'Health Potion', category: 'aid', quantity: 2, description: 'Restores vitality when consumed.' },
    ],
  },
  
  // ============================================================================
  // SPACE EXPLORER (Sci-Fi)
  // Role: Starship crew member (scout/science officer on exploration vessel)
  // ============================================================================
  scifi: {
    default: [
      { name: 'Energy Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'High-powered laser sidearm with rechargeable power cell.' },
      { name: 'Spare Battery Pack', category: 'ammo', quantity: 2, description: 'Replacement power cells for energy weapons.' },
      { name: 'Utility Knife', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Compact multitool knife for emergencies and repairs.' },
      { name: 'EVA Spacesuit', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Standard issue spacesuit rated for EVA, provides life support and radiation protection.' },
      { name: 'EVA Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Sealed helmet with HUD display and integrated flashlight.' },
      { name: 'EVA Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Pressurized gloves maintaining dexterity in vacuum.' },
      { name: 'Mag Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Magnetic boots for zero-G maneuvering.' },
      { name: 'Handheld Scanner', category: 'misc', description: 'Tricorder-style device for environmental analysis and lifeform detection.' },
      { name: 'Communicator', category: 'misc', description: 'Wrist-mounted radio for ship contact.' },
      { name: 'First Aid Medkit', category: 'aid', description: 'Standard medical supplies for treating injuries in the field.' },
      { name: 'Grappling Tether', category: 'misc', description: 'Emergency tether for zero-G maneuvering and rescue.' },
      { name: 'MediGel', category: 'aid', quantity: 2, description: 'Quick-healing medical gel application.' },
    ],
  },
  
  // ============================================================================
  // DETECTIVE MYSTERY (Noir)
  // Role: Hard-boiled private investigator
  // ============================================================================
  mystery: {
    default: [
      { name: 'Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'A trusty six-shot revolver carried in a shoulder holster.' },
      { name: 'Snub-nose Backup', category: 'weapons', weaponType: 'revolver', autoEquip: 'sidearm', description: 'A small backup pistol tucked in an ankle holster.' },
      { name: '.38 Special Rounds', category: 'ammo', quantity: 24, description: 'Ammunition for your revolvers.' },
      { name: 'Trench Coat', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'A heavy trench coat that conceals your weapon and shields from the rain.' },
      { name: 'Fedora', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'A classic felt fedora, signature of the trade.' },
      { name: 'Notepad', category: 'keyItems', description: 'For recording clues, witness statements, and observations.' },
      { name: 'Pen', category: 'misc', description: 'A reliable ballpoint for taking notes.' },
      { name: 'Pocket Flashlight', category: 'misc', description: 'For snooping in dark alleys and crime scenes.' },
      { name: 'Camera', category: 'misc', description: 'Period-appropriate camera for clandestine evidence photos.' },
      { name: 'Lockpick Set', category: 'misc', description: 'For surreptitious entry when the law isn\'t watching.' },
      { name: 'Handcuffs', category: 'misc', description: 'Standard restraints for apprehending suspects.' },
      { name: 'Detective Badge', category: 'keyItems', description: 'Your professional credentials.' },
      { name: 'Business Cards', category: 'misc', description: 'Your contact information for clients.' },
    ],
    detective: [
      { name: 'Service Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'Police-issue .38 special.' },
      { name: 'Detective Badge', category: 'keyItems', description: 'Your official credentials.' },
      { name: 'Notepad', category: 'keyItems', description: 'Case notes and observations.' },
      { name: 'Handcuffs', category: 'misc', description: 'Standard issue restraints.' },
      { name: '.38 Rounds', category: 'ammo', quantity: 18, description: 'Revolver ammunition.' },
    ],
  },
  noir: {
    default: [
      { name: 'Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'A trusty six-shot revolver carried in a shoulder holster.' },
      { name: 'Switchblade', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'A concealed blade for emergencies.' },
      { name: '.38 Special Rounds', category: 'ammo', quantity: 24, description: 'Ammunition for your revolver.' },
      { name: 'Trench Coat', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'A heavy trench coat, essential for the streets.' },
      { name: 'Fedora', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'A classic felt fedora.' },
      { name: 'Notepad', category: 'keyItems', description: 'For recording clues and observations.' },
      { name: 'Pocket Flashlight', category: 'misc', description: 'For snooping in dark alleys.' },
      { name: 'Lockpick Set', category: 'misc', description: 'For when doors won\'t open on their own.' },
    ],
  },
  
  // ============================================================================
  // SURVIVAL HORROR
  // Role: Lone survivor (security guard/researcher in abandoned facility)
  // ============================================================================
  horror: {
    default: [
      { name: 'Handgun', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'A basic pistol with limited ammunition - use wisely.' },
      { name: '9mm Rounds', category: 'ammo', quantity: 15, description: 'Precious ammunition. Every shot counts.' },
      { name: 'Crowbar', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'A heavy metal crowbar - weapon and tool for prying doors.' },
      { name: 'Security Uniform', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Standard facility uniform, minimal protection.' },
      { name: 'Work Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Sturdy boots for treading carefully.' },
      { name: 'Flashlight', category: 'misc', description: 'Your lifeline in the darkness. Don\'t let the batteries die.' },
      { name: 'Spare Batteries', category: 'misc', quantity: 2, description: 'Extra batteries for the flashlight.' },
      { name: 'First Aid Kit', category: 'aid', description: 'Bandages and antiseptic for treating wounds.' },
      { name: 'Walkie-Talkie', category: 'misc', description: 'Communication device - mostly static and ominous sounds.' },
      { name: 'Staff Keycard', category: 'keyItems', description: 'Your facility access card. Security Level 2.' },
    ],
  },
  
  // ============================================================================
  // HIGH SEAS ADVENTURE (Pirate)
  // Role: Pirate captain on a treasure hunt
  // ============================================================================
  pirate: {
    default: [
      { name: 'Cutlass', category: 'weapons', weaponType: 'melee', autoEquip: 'primaryWeapon', description: 'A trusty curved sword ideal for close-quarters duels on deck.' },
      { name: 'Flintlock Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'sidearm', description: 'Single-shot black powder pistol for ranged attacks.' },
      { name: 'Boot Dagger', category: 'weapons', weaponType: 'melee', description: 'A small blade tucked in your boot as backup.' },
      { name: 'Black Powder', category: 'ammo', quantity: 10, description: 'Gunpowder and shot for your flintlock.' },
      { name: 'Leather Coat', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'A thick leather coat offering weather protection and style.' },
      { name: 'Tricorn Hat', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'A classic captain\'s tricorn, battered but proud.' },
      { name: 'Leather Bracers', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Simple leather bracers for minor protection.' },
      { name: 'Sea Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Salt-stained boots with good grip on wet decks.' },
      { name: 'Compass', category: 'misc', description: 'For navigation across the open sea.' },
      { name: 'Spyglass', category: 'misc', description: 'A brass telescope for spotting distant ships or islands.' },
      { name: 'Treasure Map', category: 'keyItems', description: 'An old chart marking X where the treasure lies. Guard it well.' },
      { name: 'Rope Coil', category: 'misc', description: 'Useful for boarding actions or securing prisoners.' },
      { name: 'Coin Pouch', category: 'misc', description: 'Pieces of eight for bribes and tavern visits.' },
      { name: 'Bottle of Rum', category: 'aid', description: 'For medicinal purposes, of course.' },
      { name: 'Ship\'s Logbook', category: 'keyItems', description: 'Your record of the voyage and crew manifest.' },
    ],
  },
  
  // ============================================================================
  // NEON DYSTOPIA (Cyberpunk)
  // Role: Street mercenary (edgerunner blending hacking and combat)
  // ============================================================================
  cyberpunk: {
    default: [
      { name: 'Heavy Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'Chrome-plated high-caliber handgun with smart-targeting link.' },
      { name: 'Tactical Katana', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Mono-edge blade for silent takedowns. A street samurai\'s signature.' },
      { name: '12mm Rounds', category: 'ammo', quantity: 30, description: 'Heavy pistol ammunition.' },
      { name: 'Armored Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Kevlar-lined trench coat fitting the neon-noir aesthetic.' },
      { name: 'Ballistic Weave Pants', category: 'apparel', apparelType: 'legs', autoEquip: 'legs', description: 'Armored pants with hidden plating.' },
      { name: 'Combat Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Steel-toed boots with grip soles.' },
      { name: 'Tactical Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Smart-linked gloves for weapon interface.' },
      { name: 'Cyberdeck', category: 'misc', description: 'Portable netrunning rig for jacking into the Net and bypassing security.' },
      { name: 'Agent', category: 'misc', description: 'High-tech smartphone for comms and data access.' },
      { name: 'Electronic Lockpick', category: 'misc', description: 'Bypass tool for cracking maglocks and security panels.' },
      { name: 'Stim Injector', category: 'aid', quantity: 2, description: 'Combat stim for emergency healing and reflex boost.' },
      { name: 'Credstick', category: 'misc', description: 'Digital currency storage with your eurodollars.' },
    ],
    netrunner: [
      { name: 'Compact Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'primaryWeapon', description: 'Concealable smart pistol.' },
      { name: 'Neural Interface Deck', category: 'misc', description: 'Your personal hacking interface.' },
      { name: 'Light Armor Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Low-profile armored clothing.' },
      { name: 'Neural Stim', category: 'aid', quantity: 3, description: 'Boosts neural processing.' },
      { name: 'Credstick', category: 'misc', description: 'Digital currency storage.' },
    ],
  },
  
  // ============================================================================
  // THEATER OF WAR (Military)
  // Role: Frontline infantry soldier
  // ============================================================================
  war: {
    default: [
      { name: 'Assault Rifle', category: 'weapons', weaponType: 'assaultRifle', autoEquip: 'primaryWeapon', description: 'Standard issue service rifle with full-auto capability.' },
      { name: 'Service Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'sidearm', description: '9mm sidearm as backup weapon.' },
      { name: 'Combat Knife', category: 'weapons', weaponType: 'melee', description: 'Bayonet-style knife for close combat and utility.' },
      { name: '5.56 NATO Rounds', category: 'ammo', quantity: 90, description: 'Standard rifle ammunition in three magazines.' },
      { name: '9mm Rounds', category: 'ammo', quantity: 30, description: 'Pistol ammunition.' },
      { name: 'Frag Grenades', category: 'ammo', quantity: 2, description: 'M67 fragmentation grenades.' },
      { name: 'Ballistic Vest', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Improved Outer Tactical Vest with ceramic plates.' },
      { name: 'Kevlar Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Standard issue combat helmet with NVG mount.' },
      { name: 'Tactical Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Reinforced tactical gloves.' },
      { name: 'Combat Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Steel-toed military boots.' },
      { name: 'Field Radio', category: 'misc', description: 'Walkie-talkie for squad and command communication.' },
      { name: 'IFAK', category: 'aid', description: 'Individual First Aid Kit with bandages, tourniquets, and morphine.' },
      { name: 'Canteen', category: 'aid', description: 'Military canteen with fresh water.' },
      { name: 'MRE', category: 'aid', quantity: 2, description: 'Meal Ready to Eat - combat rations.' },
      { name: 'Entrenching Tool', category: 'misc', description: 'Folding shovel for digging foxholes.' },
      { name: 'Binoculars', category: 'misc', description: 'For scouting enemy positions.' },
    ],
    soldier: [
      { name: 'M4 Carbine', category: 'weapons', weaponType: 'assaultRifle', autoEquip: 'primaryWeapon', description: 'Reliable assault rifle, fully automatic capable.' },
      { name: 'M9 Pistol', category: 'weapons', weaponType: 'pistol', autoEquip: 'sidearm', description: 'Standard sidearm, 9mm.' },
      { name: 'Body Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Full ballistic protection.' },
      { name: 'Combat Helmet', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Advanced combat helmet with NVG mount.' },
      { name: 'Tactical Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Reinforced tactical gloves.' },
      { name: 'Combat Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Steel-toed military boots.' },
      { name: 'First Aid Kit', category: 'aid', quantity: 3, description: 'Military-grade medical supplies.' },
      { name: '5.56 NATO Rounds', category: 'ammo', quantity: 90, description: 'Standard assault rifle ammunition.' },
      { name: '9mm Rounds', category: 'ammo', quantity: 30, description: 'Pistol ammunition.' },
    ],
  },
  
  // ============================================================================
  // FRONTIER JUSTICE (Western)
  // Role: Gunslinger (drifting cowboy or local sheriff)
  // ============================================================================
  western: {
    default: [
      { name: 'Colt Peacemaker', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'The iconic Colt Single Action Army - a .45 caliber six-shooter.' },
      { name: 'Winchester Repeater', category: 'weapons', weaponType: 'rifle', autoEquip: 'sidearm', description: 'Lever-action rifle for longer range engagements.' },
      { name: 'Bowie Knife', category: 'weapons', weaponType: 'melee', description: 'Large hunting knife for utility and close combat.' },
      { name: '.45 Colt Rounds', category: 'ammo', quantity: 36, description: 'Revolver ammunition.' },
      { name: '.44-40 Rounds', category: 'ammo', quantity: 20, description: 'Rifle ammunition.' },
      { name: 'Cowboy Hat', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Wide-brimmed felt hat against sun and dust.' },
      { name: 'Duster Coat', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Long leather duster for trail protection.' },
      { name: 'Leather Gloves', category: 'apparel', apparelType: 'hands', autoEquip: 'hands', description: 'Work gloves for riding and shooting.' },
      { name: 'Cowboy Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Heeled boots with spurs for riding.' },
      { name: 'Lariat Rope', category: 'misc', description: 'A lasso for catching horses, cattle, or outlaws.' },
      { name: 'Canteen', category: 'aid', description: 'Water for long rides across the prairie.' },
      { name: 'Tinderbox', category: 'misc', description: 'Matches for starting campfires.' },
      { name: 'Dried Jerky', category: 'aid', quantity: 3, description: 'Trail provisions.' },
      { name: 'Bedroll', category: 'misc', description: 'For camping under the stars.' },
      { name: 'Deck of Cards', category: 'misc', description: 'For passing time in saloons.' },
    ],
    gunslinger: [
      { name: 'Peacemaker', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'Legendary Colt single-action revolver.' },
      { name: 'Backup Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'sidearm', description: 'A second revolver for emergencies.' },
      { name: 'Leather Vest', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Gunfighter\'s vest with quick-draw holster.' },
      { name: 'Cowboy Boots', category: 'apparel', apparelType: 'feet', autoEquip: 'feet', description: 'Spurred riding boots.' },
      { name: '.45 Rounds', category: 'ammo', quantity: 48, description: 'Revolver ammunition.' },
    ],
  },
  
  // ============================================================================
  // MODERN LIFE (Slice of Life)
  // Role: Everyday urban character (professional/student)
  // ============================================================================
  modern_life: {
    default: [
      { name: 'Smartphone', category: 'misc', description: 'Your connection to the world - communication, camera, maps, flashlight, and more.' },
      { name: 'Wallet', category: 'misc', description: 'Contains ID, credit cards, and some cash.' },
      { name: 'Keys', category: 'keyItems', description: 'House keys, apartment keys, and car or office keys.' },
      { name: 'Laptop', category: 'misc', description: 'For work and personal use, carried in your bag.' },
      { name: 'Backpack', category: 'misc', description: 'Everyday carry bag for your essentials.' },
      { name: 'Notebook', category: 'misc', description: 'For jotting down thoughts and notes.' },
      { name: 'Pen', category: 'misc', description: 'A reliable ballpoint.' },
      { name: 'Transit Card', category: 'misc', description: 'Public transportation pass.' },
      { name: 'Water Bottle', category: 'aid', description: 'Reusable water bottle for hydration.' },
      { name: 'Coffee Thermos', category: 'aid', description: 'Hot coffee for energy throughout the day.' },
      { name: 'Pepper Spray', category: 'misc', description: 'A small canister for personal safety (hopefully never needed).' },
    ],
  },
  
  // ============================================================================
  // POST-APOCALYPTIC
  // Role: Wasteland survivor
  // ============================================================================
  postapoc: {
    default: [
      { name: 'Hunting Rifle', category: 'weapons', weaponType: 'rifle', autoEquip: 'primaryWeapon', description: 'Well-worn but reliable hunting rifle.' },
      { name: 'Machete', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Trusted blade for survival.' },
      { name: 'Leather Jacket', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Worn leather jacket, patched many times.' },
      { name: 'Bandages', category: 'aid', quantity: 3, description: 'Makeshift medical bandages.' },
      { name: 'Canned Food', category: 'aid', quantity: 2, description: 'Pre-war canned goods.' },
      { name: 'Scavenged Ammo', category: 'ammo', quantity: 20, description: 'Mixed rifle ammunition.' },
    ],
    survivor: [
      { name: 'Shotgun', category: 'weapons', weaponType: 'shotgun', autoEquip: 'primaryWeapon', description: 'Sawed-off pump-action shotgun.' },
      { name: 'Pipe Wrench', category: 'weapons', weaponType: 'melee', autoEquip: 'sidearm', description: 'Heavy tool, doubles as a weapon.' },
      { name: 'Scrap Armor', category: 'apparel', apparelType: 'torso', autoEquip: 'torso', description: 'Jury-rigged metal plate armor.' },
      { name: 'Gas Mask', category: 'apparel', apparelType: 'headwear', autoEquip: 'head', description: 'Filter mask for toxic areas.' },
      { name: 'Med-X', category: 'aid', quantity: 2, description: 'Pre-war painkillers.' },
      { name: 'Shotgun Shells', category: 'ammo', quantity: 24, description: '12 gauge buckshot.' },
    ],
  },
  
  // ============================================================================
  // COSMIC HORROR
  // Role: Investigator of the unknown
  // ============================================================================
  cosmic_horror: {
    default: [
      { name: 'Revolver', category: 'weapons', weaponType: 'revolver', autoEquip: 'primaryWeapon', description: 'A small-caliber revolver. Whether it can stop what lurks in the dark is uncertain.' },
      { name: '.32 Rounds', category: 'ammo', quantity: 18, description: 'Revolver ammunition.' },
      { name: 'Oil Lantern', category: 'misc', description: 'An old oil lantern against the encroaching darkness.' },
      { name: 'Lantern Oil', category: 'misc', quantity: 2, description: 'Fuel for the lantern.' },
      { name: 'Journal', category: 'keyItems', description: 'Your personal journal documenting strange occurrences and creeping madness.' },
      { name: 'Pen', category: 'misc', description: 'For recording your findings... while you still can.' },
      { name: 'Laudanum', category: 'aid', quantity: 1, description: 'To calm the nerves... and quiet the visions.' },
      { name: 'Old Tome', category: 'keyItems', description: 'A weathered book of forbidden knowledge that started this nightmare.' },
    ],
  },
};

// ============================================================================
// GENERATE FULL ITEM FROM BASE DATA
// ============================================================================

export function generateFullItem(baseItem: StartingGearItem): InventoryItem {
  const timestamp = Date.now();
  const detection = detectItemType(baseItem.name, baseItem.description || '');
  
  const item: InventoryItem = {
    id: `item-${baseItem.name.toLowerCase().replace(/\s+/g, '_')}-${timestamp}`,
    instanceId: `inst-${timestamp}-${Math.random().toString(36).substr(2, 6)}`,
    name: baseItem.name,
    description: baseItem.description || `${baseItem.name} - part of your equipment.`,
    category: baseItem.category || detection.category,
    type: detection.type,
    quantity: baseItem.quantity || 1,
    stackable: detection.stackable ?? ['aid', 'ammo'].includes(baseItem.category),
    consumable: detection.consumable ?? baseItem.category === 'aid',
    weight: 1,
    value: 10,
  };
  
  // WEAPONS: Add full stats, slots, condition
  if (baseItem.category === 'weapons') {
    const wType = baseItem.weaponType || 'rifle';
    
    item.type = 'weapon';
    item.weaponType = wType;
    item.caliber = DEFAULT_CALIBERS[wType] || '9mm';
    item.weight = getWeaponWeight(wType);
    item.value = getWeaponValue(wType);
    item.equipSlots = EQUIP_SLOTS_BY_WEAPON_TYPE[wType] || ['primaryWeapon', 'sidearm'];
    item.compatibleSlots = COMPATIBLE_SLOTS_BY_TYPE[wType] || ['optic', 'muzzle', 'grip'];
    item.stats = { ...(BASE_WEAPON_STATS[wType] || {
      damage: 50, accuracy: 50, fireRate: 50, range: 50, stability: 50, handling: 50,
    })};
    item.mods = {};
    item.condition = {
      barrelWear: 0,
      carbonBuildup: 0,
      springFatigue: 0,
      riflingWear: 0,
      roundsFired: 0,
      lastMaintenance: Date.now(),
    };
  }
  
  // APPAREL: Add equip slots
  if (baseItem.category === 'apparel') {
    const aType = baseItem.apparelType || 'torso';
    const slotMap: Record<string, string[]> = { 
      headwear: ['head'], torso: ['torso'], hands: ['hands'], legs: ['legs'], feet: ['feet'] 
    };
    item.type = aType;
    item.equipSlots = slotMap[aType] || ['torso'];
    item.weight = getApparelWeight(aType);
    item.value = getApparelValue(aType);
  }
  
  // MISC: Can be equipped as accessory
  if (baseItem.category === 'misc') {
    item.equipSlots = ['accessory1', 'accessory2'];
    item.weight = 0.5;
  }
  
  // AID: Consumable items
  if (baseItem.category === 'aid') {
    item.weight = 0.2;
    item.value = 25;
  }
  
  // AMMO
  if (baseItem.category === 'ammo') {
    item.weight = 0.01;
    item.value = 1;
  }
  
  // KEY ITEMS
  if (baseItem.category === 'keyItems') {
    item.weight = 0.1;
    item.value = 0;
    item.stackable = false;
    item.consumable = false;
  }
  
  return item;
}

// Weight/value helpers
function getWeaponWeight(type: WeaponType): number {
  const weights: Record<WeaponType, number> = {
    pistol: 1.5, revolver: 2, smg: 3, rifle: 4.5,
    assaultRifle: 4, shotgun: 4, sniper: 6, lmg: 10, melee: 1,
  };
  return weights[type] || 3;
}

function getWeaponValue(type: WeaponType): number {
  const values: Record<WeaponType, number> = {
    pistol: 150, revolver: 200, smg: 300, rifle: 400,
    assaultRifle: 450, shotgun: 350, sniper: 600, lmg: 700, melee: 75,
  };
  return values[type] || 200;
}

function getApparelWeight(type: ApparelType): number {
  const weights: Record<ApparelType, number> = { 
    headwear: 1, torso: 3, hands: 0.3, legs: 1.5, feet: 1.2 
  };
  return weights[type] || 1;
}

function getApparelValue(type: ApparelType): number {
  const values: Record<ApparelType, number> = { 
    headwear: 50, torso: 100, hands: 30, legs: 60, feet: 50 
  };
  return values[type] || 50;
}

// ============================================================================
// INITIALIZE STARTING GEAR
// ============================================================================

export interface InventoryDispatcher {
  dispatch: (action: { type: string; payload?: any }) => void;
}

export function initializeStartingGear(
  inventory: InventoryDispatcher,
  genre: string,
  characterClass: string = 'default'
): { items: InventoryItem[]; equipped: Partial<EquippedState> } {
  // Map genre aliases
  const genreMap: Record<string, string> = {
    'modern': 'war',
    'military': 'war',
    'scifi': 'scifi',
    'sci-fi': 'scifi',
    'post-apocalyptic': 'postapoc',
    'post_apocalyptic': 'postapoc',
    'post-apoc': 'postapoc',
    'medieval': 'fantasy',
    'dark_fantasy': 'fantasy',
    'lovecraftian': 'cosmic_horror',
    'slice_of_life': 'modern_life',
    'noir': 'mystery',
  };
  
  const normalizedGenre = genreMap[genre.toLowerCase()] || genre.toLowerCase();
  const genreGear = STARTING_GEAR[normalizedGenre] || STARTING_GEAR.fantasy;
  const gearList = genreGear[characterClass.toLowerCase()] || genreGear.default;
  
  console.log(`[StartingGear] Initializing for genre: ${normalizedGenre}, class: ${characterClass}`);
  console.log(`[StartingGear] Adding ${gearList.length} items`);
  
  const addedItems: InventoryItem[] = [];
  const equippedSlots: Partial<EquippedState> = {};
  
  gearList.forEach(baseItem => {
    const fullItem = generateFullItem(baseItem);
    addedItems.push(fullItem);
    
    // Add to inventory
    inventory.dispatch({ 
      type: 'ADD_ITEM', 
      payload: { item: fullItem, quantity: baseItem.quantity || 1 } 
    });
    
    // Auto-equip if specified
    if (baseItem.autoEquip && fullItem.instanceId) {
      inventory.dispatch({
        type: 'EQUIP_ITEM',
        payload: { instanceId: fullItem.instanceId, slot: baseItem.autoEquip }
      });
      equippedSlots[baseItem.autoEquip as keyof EquippedState] = fullItem.instanceId;
    }
    
    console.log(`[StartingGear] Added: ${fullItem.name} (${fullItem.category})${baseItem.autoEquip ? ` → equipped to ${baseItem.autoEquip}` : ''}`);
  });
  
  return { items: addedItems, equipped: equippedSlots };
}

// ============================================================================
// STORY TEXT PARSING FOR ITEMS
// ============================================================================

const PICKUP_PATTERNS = [
  /(?:you\s+)?(?:pick(?:ed)?\s+up|grab(?:bed)?|found|take[sn]?|collect(?:ed)?|acquire[ds]?|obtain(?:ed)?|receive[ds]?)\s+(?:a\s+|an\s+|the\s+|some\s+|your\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
  /(?:you\s+)?(?:loot(?:ed)?|scavenge[ds]?)\s+(?:a\s+|an\s+|the\s+|some\s+)?([^.,!?]+?)(?:\s+from|\.|,|!|\?|$)/gi,
  /(?:hands?\s+you|gives?\s+you|offers?\s+you)\s+(?:a\s+|an\s+|the\s+|some\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
];

const DROP_PATTERNS = [
  /(?:you\s+)?(?:drop(?:ped)?|discard(?:ed)?|left\s+behind|threw\s+away|gave\s+away|sold)\s+(?:the\s+|your\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
  /(?:you\s+)?(?:use[ds]?\s+up|consumed?|ate|drank)\s+(?:the\s+|your\s+|a\s+)?([^.,!?]+?)(?:\.|,|!|\?|$)/gi,
];

// Words to filter out (not actual items)
const FILTER_WORDS = [
  'it', 'them', 'this', 'that', 'something', 'anything', 'nothing',
  'him', 'her', 'me', 'us', 'breath', 'step', 'moment', 'chance',
  'opportunity', 'time', 'look', 'glance', 'aim', 'shot', 'cover',
  'position', 'advantage', 'ground', 'stance', 'action', 'decision',
];

export function parseStoryForItems(storyText: string): string[] {
  const items: string[] = [];
  
  PICKUP_PATTERNS.forEach(pattern => {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(storyText)) !== null) {
      let itemName = match[1].trim();
      
      // Clean up the item name
      itemName = itemName
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the|some|your)\s+/i, '')
        .trim();
      
      // Validate
      if (
        itemName.length > 2 && 
        itemName.length < 50 &&
        !FILTER_WORDS.includes(itemName.toLowerCase()) &&
        !/^\d+$/.test(itemName) // Not just a number
      ) {
        items.push(itemName);
      }
    }
  });
  
  return [...new Set(items)]; // Remove duplicates
}

export function parseStoryForDroppedItems(storyText: string): string[] {
  const items: string[] = [];
  
  DROP_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(storyText)) !== null) {
      let itemName = match[1].trim()
        .replace(/\s+/g, ' ')
        .replace(/^(a|an|the|some|your)\s+/i, '')
        .trim();
      
      if (
        itemName.length > 2 && 
        itemName.length < 50 &&
        !FILTER_WORDS.includes(itemName.toLowerCase())
      ) {
        items.push(itemName);
      }
    }
  });
  
  return [...new Set(items)];
}

// ============================================================================
// STORY-INVENTORY SYNC PROCESSOR
// ============================================================================

export interface InventorySyncResult {
  added: Array<{ name: string; category: string }>;
  dropped: string[];
}

export function processStoryInventorySync(
  newStoryText: string,
  inventory: InventoryDispatcher
): InventorySyncResult {
  const result: InventorySyncResult = { added: [], dropped: [] };
  
  // Parse for new items
  const pickedUp = parseStoryForItems(newStoryText);
  pickedUp.forEach(itemName => {
    const detection = detectItemType(itemName);
    const item = generateFullItem({
      name: itemName,
      category: detection.category as any,
      weaponType: detection.weaponType,
      apparelType: detection.type as ApparelType,
    });
    
    inventory.dispatch({ type: 'ADD_ITEM', payload: { item, quantity: 1 } });
    result.added.push({ name: itemName, category: detection.category });
    console.log(`[STORY→INV] Added: ${itemName} (${detection.category})`);
  });
  
  // Parse for dropped items
  const dropped = parseStoryForDroppedItems(newStoryText);
  dropped.forEach(itemName => {
    // Note: We don't automatically remove items - that's too aggressive
    // Just log for now. The game mechanics system handles actual removal.
    result.dropped.push(itemName);
    console.log(`[STORY→INV] Noted drop: ${itemName} (requires explicit removal)`);
  });
  
  return result;
}

// ============================================================================
// BUILD INVENTORY CONTEXT FOR AI
// ============================================================================

export function buildInventoryContextForAI(state: InventoryState): string {
  if (!state.items || state.items.length === 0) {
    return `PLAYER INVENTORY: Empty - the player has no items yet.`;
  }
  
  const byCategory: Record<string, string[]> = {};
  
  for (const item of state.items) {
    const cat = item.category || 'misc';
    if (!byCategory[cat]) byCategory[cat] = [];
    
    let itemStr = item.name;
    if (item.quantity > 1) itemStr += ` (x${item.quantity})`;
    if (item.weaponType) itemStr += ` [${item.weaponType}]`;
    
    byCategory[cat].push(itemStr);
  }
  
  const lines: string[] = ['PLAYER INVENTORY:'];
  
  // Order categories
  const categoryOrder = ['weapons', 'apparel', 'aid', 'ammo', 'keyItems', 'misc'];
  for (const cat of categoryOrder) {
    if (byCategory[cat] && byCategory[cat].length > 0) {
      lines.push(`  ${cat.toUpperCase()}: ${byCategory[cat].join(', ')}`);
    }
  }
  
  // Add equipped info
  const equipped: string[] = [];
  if (state.equipped.primaryWeapon) {
    const item = state.items.find(i => i.instanceId === state.equipped.primaryWeapon);
    if (item) equipped.push(`Primary: ${item.name}`);
  }
  if (state.equipped.sidearm) {
    const item = state.items.find(i => i.instanceId === state.equipped.sidearm);
    if (item) equipped.push(`Sidearm: ${item.name}`);
  }
  if (state.equipped.torso) {
    const item = state.items.find(i => i.instanceId === state.equipped.torso);
    if (item) equipped.push(`Armor: ${item.name}`);
  }
  
  if (equipped.length > 0) {
    lines.push(`EQUIPPED: ${equipped.join(', ')}`);
  }
  
  lines.push('');
  lines.push('INVENTORY RULES FOR AI:');
  lines.push('- Only reference items the player actually has in inventory above');
  lines.push('- When player picks up new items, clearly state: "You pick up the [Item Name]"');
  lines.push('- When player uses consumables, state: "You use the [Item Name]"');
  lines.push('- The player can reach for equipped weapons at any time');
  
  return lines.join('\n');
}

// ============================================================================
// CHECK IF GEAR NEEDS INITIALIZATION
// ============================================================================

export function needsStartingGear(state: InventoryState): boolean {
  return !state.items || state.items.length === 0;
}

// Export for debugging
if (typeof window !== 'undefined') {
  (window as any).debugInventoryBridge = {
    STARTING_GEAR,
    parseStoryForItems,
    parseStoryForDroppedItems,
    generateFullItem,
  };
}
