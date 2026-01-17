/**
 * Item Prompt Command System
 * Provides pre-made descriptions for custom items via slash commands
 * Commands are case-insensitive: /RIFLE works the same as /rifle
 * 
 * Categories:
 * - Weapons (firearms, melee)
 * - Armor & Clothing
 */

// ============= WEAPON PROMPTS =============

export interface ItemPrompt {
  command: string;
  name: string;
  category: 'firearm' | 'melee' | 'armor' | 'clothing';
  description: string;
  visualDetails: string;
  suggestedStats?: Record<string, number>;
}

// Firearms
export const FIREARM_PROMPTS: ItemPrompt[] = [
  // Rifles
  {
    command: '/rifle',
    name: 'Standard Rifle',
    category: 'firearm',
    description: 'A semi-automatic rifle with wooden furniture and iron sights. Well-balanced for general use.',
    visualDetails: 'wooden stock, blued steel barrel, iron sights, leather sling',
    suggestedStats: { damage: 45, accuracy: 75, range: 300 },
  },
  {
    command: '/assaultrifle',
    name: 'Assault Rifle',
    category: 'firearm',
    description: 'A select-fire assault rifle with polymer furniture. Designed for modern combat.',
    visualDetails: 'black polymer stock, picatinny rails, collapsible stock, 30-round magazine',
    suggestedStats: { damage: 40, accuracy: 70, range: 400, rateOfFire: 700 },
  },
  {
    command: '/battlerifle',
    name: 'Battle Rifle',
    category: 'firearm',
    description: 'A full-power battle rifle chambered in 7.62mm. Heavy hitting at long range.',
    visualDetails: 'wooden or polymer stock, 20-round magazine, heavy barrel, bipod mount',
    suggestedStats: { damage: 55, accuracy: 80, range: 600 },
  },
  {
    command: '/boltaction',
    name: 'Bolt-Action Rifle',
    category: 'firearm',
    description: 'A precision bolt-action rifle with a wooden stock. Reliable and accurate.',
    visualDetails: 'walnut stock, blued barrel, scope rings, 5-round internal magazine',
    suggestedStats: { damage: 65, accuracy: 90, range: 800 },
  },
  {
    command: '/huntingrifle',
    name: 'Hunting Rifle',
    category: 'firearm',
    description: 'A sporting rifle designed for hunting. Lightweight and accurate.',
    visualDetails: 'checkered wooden stock, stainless barrel, scope mounted, leather sling',
    suggestedStats: { damage: 55, accuracy: 85, range: 500 },
  },
  {
    command: '/sniperrifle',
    name: 'Sniper Rifle',
    category: 'firearm',
    description: 'A precision long-range rifle with a heavy barrel and adjustable stock.',
    visualDetails: 'tactical chassis, free-floating barrel, high-power scope, bipod, suppressor-ready',
    suggestedStats: { damage: 75, accuracy: 95, range: 1200 },
  },
  {
    command: '/dmr',
    name: 'Designated Marksman Rifle',
    category: 'firearm',
    description: 'A semi-automatic precision rifle bridging assault rifles and sniper rifles.',
    visualDetails: 'modular chassis, 20-round magazine, variable optic, match barrel',
    suggestedStats: { damage: 50, accuracy: 85, range: 700 },
  },
  
  // Shotguns
  {
    command: '/shotgun',
    name: 'Standard Shotgun',
    category: 'firearm',
    description: 'A pump-action shotgun with a wooden stock. Devastating at close range.',
    visualDetails: 'wooden stock and forend, blued barrel, bead sight, 5-round tube magazine',
    suggestedStats: { damage: 80, accuracy: 50, range: 50 },
  },
  {
    command: '/combatshotgun',
    name: 'Combat Shotgun',
    category: 'firearm',
    description: 'A tactical shotgun with extended magazine and ghost ring sights.',
    visualDetails: 'polymer furniture, extended magazine tube, ghost ring sights, rail mount',
    suggestedStats: { damage: 75, accuracy: 55, range: 60 },
  },
  {
    command: '/doubleshotgun',
    name: 'Double-Barrel Shotgun',
    category: 'firearm',
    description: 'A classic side-by-side or over-under shotgun. Two quick shots.',
    visualDetails: 'walnut stock, twin barrels, brass bead sight, break-action',
    suggestedStats: { damage: 90, accuracy: 45, range: 40 },
  },
  {
    command: '/autoshotgun',
    name: 'Automatic Shotgun',
    category: 'firearm',
    description: 'A semi-automatic shotgun with a box magazine. Fast follow-up shots.',
    visualDetails: 'polymer stock, detachable box magazine, rail system, adjustable stock',
    suggestedStats: { damage: 70, accuracy: 50, range: 55 },
  },
  
  // Pistols
  {
    command: '/pistol',
    name: 'Standard Pistol',
    category: 'firearm',
    description: 'A semi-automatic pistol with a polymer frame. Reliable sidearm.',
    visualDetails: 'polymer frame, steel slide, iron sights, 15-round magazine',
    suggestedStats: { damage: 25, accuracy: 65, range: 50 },
  },
  {
    command: '/revolver',
    name: 'Revolver',
    category: 'firearm',
    description: 'A double-action revolver with a heavy barrel. Powerful and reliable.',
    visualDetails: 'stainless steel frame, 6-inch barrel, wooden grips, 6-round cylinder',
    suggestedStats: { damage: 40, accuracy: 70, range: 60 },
  },
  {
    command: '/magnum',
    name: 'Magnum Revolver',
    category: 'firearm',
    description: 'A large-frame revolver chambered in a magnum caliber. Extreme stopping power.',
    visualDetails: 'stainless frame, 8-inch barrel, rubber grips, ported barrel, scope mount',
    suggestedStats: { damage: 60, accuracy: 65, range: 80 },
  },
  {
    command: '/compactpistol',
    name: 'Compact Pistol',
    category: 'firearm',
    description: 'A subcompact pistol designed for concealment. Easy to hide.',
    visualDetails: 'polymer frame, short barrel, minimal sights, 8-round magazine',
    suggestedStats: { damage: 20, accuracy: 55, range: 30 },
  },
  {
    command: '/targetpistol',
    name: 'Target Pistol',
    category: 'firearm',
    description: 'A competition pistol with a match-grade barrel and adjustable sights.',
    visualDetails: 'steel frame, long barrel, adjustable sights, match trigger, extended mag',
    suggestedStats: { damage: 25, accuracy: 85, range: 60 },
  },
  
  // SMGs
  {
    command: '/smg',
    name: 'Submachine Gun',
    category: 'firearm',
    description: 'A compact automatic weapon firing pistol caliber rounds.',
    visualDetails: 'polymer body, folding stock, 30-round magazine, red dot mount',
    suggestedStats: { damage: 22, accuracy: 60, range: 100, rateOfFire: 900 },
  },
  {
    command: '/pdw',
    name: 'Personal Defense Weapon',
    category: 'firearm',
    description: 'A compact weapon bridging SMGs and rifles. Armor-piercing capability.',
    visualDetails: 'bullpup design, 50-round magazine, integrated optic, folding foregrip',
    suggestedStats: { damage: 28, accuracy: 65, range: 150, rateOfFire: 850 },
  },
  
  // Machine Guns
  {
    command: '/lmg',
    name: 'Light Machine Gun',
    category: 'firearm',
    description: 'A belt-fed automatic weapon for sustained fire. Suppressive fire role.',
    visualDetails: 'polymer stock, carrying handle, bipod, 100-round belt box',
    suggestedStats: { damage: 42, accuracy: 55, range: 500, rateOfFire: 750 },
  },
  {
    command: '/hmg',
    name: 'Heavy Machine Gun',
    category: 'firearm',
    description: 'A crew-served weapon of massive destructive capability.',
    visualDetails: 'tripod mounted, spade grips, heavy barrel, belt-fed, anti-materiel',
    suggestedStats: { damage: 85, accuracy: 50, range: 1800, rateOfFire: 550 },
  },
  
  // Special
  {
    command: '/launcher',
    name: 'Grenade Launcher',
    category: 'firearm',
    description: 'A single-shot or revolving launcher for explosive projectiles.',
    visualDetails: 'break-action or revolving cylinder, large bore, ladder sight',
    suggestedStats: { damage: 150, accuracy: 40, range: 300 },
  },
  {
    command: '/flamethrower',
    name: 'Flamethrower',
    category: 'firearm',
    description: 'A weapon projecting a stream of ignited fuel. Terrifying.',
    visualDetails: 'fuel tank backpack, igniter nozzle, metal wand, pressure gauge',
    suggestedStats: { damage: 60, accuracy: 30, range: 20 },
  },
];

// Melee Weapons
export const MELEE_PROMPTS: ItemPrompt[] = [
  // Blades
  {
    command: '/sword',
    name: 'Sword',
    category: 'melee',
    description: 'A straight-bladed sword suitable for slashing and thrusting.',
    visualDetails: 'steel blade, leather-wrapped hilt, crossguard, pommel',
    suggestedStats: { damage: 35, speed: 60 },
  },
  {
    command: '/longsword',
    name: 'Longsword',
    category: 'melee',
    description: 'A two-handed sword with excellent reach and versatility.',
    visualDetails: 'long steel blade, two-handed grip, cruciform guard, weighted pommel',
    suggestedStats: { damage: 45, speed: 50 },
  },
  {
    command: '/katana',
    name: 'Katana',
    category: 'melee',
    description: 'A curved Japanese sword known for its sharpness and speed.',
    visualDetails: 'curved single-edge blade, tsuba guard, ray-skin handle, silk wrap',
    suggestedStats: { damage: 40, speed: 70 },
  },
  {
    command: '/machete',
    name: 'Machete',
    category: 'melee',
    description: 'A heavy-bladed knife designed for chopping. Utility and weapon.',
    visualDetails: 'wide blade, plastic or wooden handle, lanyard hole, belt sheath',
    suggestedStats: { damage: 30, speed: 65 },
  },
  {
    command: '/knife',
    name: 'Combat Knife',
    category: 'melee',
    description: 'A fixed-blade knife designed for combat and utility.',
    visualDetails: 'steel blade, rubberized grip, serrated spine, nylon sheath',
    suggestedStats: { damage: 20, speed: 85 },
  },
  {
    command: '/dagger',
    name: 'Dagger',
    category: 'melee',
    description: 'A double-edged blade designed for quick stabbing attacks.',
    visualDetails: 'narrow steel blade, ornate guard, leather grip, boot sheath',
    suggestedStats: { damage: 18, speed: 90 },
  },
  {
    command: '/bayonet',
    name: 'Bayonet',
    category: 'melee',
    description: 'A knife designed to attach to a rifle muzzle for close combat.',
    visualDetails: 'blade with mounting lug, fuller groove, ring mount, scabbard',
    suggestedStats: { damage: 22, speed: 80 },
  },
  
  // Axes & Hammers
  {
    command: '/axe',
    name: 'Axe',
    category: 'melee',
    description: 'A single-headed axe with a wooden handle. Heavy chopping power.',
    visualDetails: 'steel head, wooden haft, leather grip wrap, loop lanyard',
    suggestedStats: { damage: 40, speed: 45 },
  },
  {
    command: '/hatchet',
    name: 'Hatchet',
    category: 'melee',
    description: 'A small one-handed axe. Quick and versatile.',
    visualDetails: 'compact steel head, short wooden handle, belt loop sheath',
    suggestedStats: { damage: 28, speed: 70 },
  },
  {
    command: '/sledgehammer',
    name: 'Sledgehammer',
    category: 'melee',
    description: 'A massive two-handed hammer. Devastating impact.',
    visualDetails: 'heavy steel head, fiberglass handle, rubber grip, shock absorbing',
    suggestedStats: { damage: 60, speed: 25 },
  },
  {
    command: '/warhammer',
    name: 'Warhammer',
    category: 'melee',
    description: 'A one-handed hammer designed for armor-penetrating combat.',
    visualDetails: 'steel head with spike, wooden shaft, leather wrap, lanyard',
    suggestedStats: { damage: 45, speed: 50 },
  },
  
  // Blunt
  {
    command: '/bat',
    name: 'Baseball Bat',
    category: 'melee',
    description: 'A wooden or aluminum bat. Simple but effective.',
    visualDetails: 'wooden or aluminum, tape-wrapped grip, dented from use',
    suggestedStats: { damage: 25, speed: 60 },
  },
  {
    command: '/pipe',
    name: 'Lead Pipe',
    category: 'melee',
    description: 'A heavy metal pipe. Improvised but dangerous.',
    visualDetails: 'corroded metal, bent at one end, wrapped handle, blood stains',
    suggestedStats: { damage: 22, speed: 55 },
  },
  {
    command: '/crowbar',
    name: 'Crowbar',
    category: 'melee',
    description: 'A prying tool that doubles as a devastating weapon.',
    visualDetails: 'forged steel, curved end, chipped paint, utility and weapon',
    suggestedStats: { damage: 28, speed: 50 },
  },
  {
    command: '/baton',
    name: 'Baton',
    category: 'melee',
    description: 'A law enforcement baton. Designed to incapacitate.',
    visualDetails: 'black polymer or steel, expandable, wrist strap, belt holster',
    suggestedStats: { damage: 15, speed: 80 },
  },
  
  // Polearms
  {
    command: '/spear',
    name: 'Spear',
    category: 'melee',
    description: 'A pole weapon with a pointed tip. Excellent reach.',
    visualDetails: 'steel point, wooden shaft, leather grip section, balanced',
    suggestedStats: { damage: 35, speed: 55 },
  },
  {
    command: '/staff',
    name: 'Staff',
    category: 'melee',
    description: 'A simple but effective wooden staff. Defensive and offensive.',
    visualDetails: 'hardwood, metal-capped ends, worn grip area, travel-ready',
    suggestedStats: { damage: 20, speed: 70 },
  },
];

// Armor & Clothing
export const ARMOR_PROMPTS: ItemPrompt[] = [
  // Modern Body Armor
  {
    command: '/vest',
    name: 'Tactical Vest',
    category: 'armor',
    description: 'A modular tactical vest with MOLLE webbing for attachments.',
    visualDetails: 'olive drab or black, MOLLE webbing, magazine pouches, radio pocket',
    suggestedStats: { defense: 15, mobility: 90 },
  },
  {
    command: '/platecarrier',
    name: 'Plate Carrier',
    category: 'armor',
    description: 'A vest designed to hold ballistic plates. Front and back protection.',
    visualDetails: 'coyote tan, front/back plate pockets, side straps, quick-release',
    suggestedStats: { defense: 45, mobility: 70 },
  },
  {
    command: '/kevlar',
    name: 'Kevlar Vest',
    category: 'armor',
    description: 'A soft body armor vest providing protection against pistol rounds.',
    visualDetails: 'concealed wear, black or white, velcro closures, lightweight',
    suggestedStats: { defense: 25, mobility: 85 },
  },
  {
    command: '/riotarmor',
    name: 'Riot Armor',
    category: 'armor',
    description: 'Full body armor designed for crowd control. Heavy protection.',
    visualDetails: 'black polycarbonate, arm/leg guards, riot shield mount, padding',
    suggestedStats: { defense: 55, mobility: 50 },
  },
  
  // Fantasy/Medieval Armor
  {
    command: '/chainmail',
    name: 'Chainmail',
    category: 'armor',
    description: 'Interlocking metal rings forming flexible armor.',
    visualDetails: 'steel rings, leather backing, reaches mid-thigh, split for riding',
    suggestedStats: { defense: 30, mobility: 75 },
  },
  {
    command: '/platearmor',
    name: 'Plate Armor',
    category: 'armor',
    description: 'Full plate armor providing maximum medieval protection.',
    visualDetails: 'polished steel, articulated joints, full coverage, heraldry optional',
    suggestedStats: { defense: 70, mobility: 40 },
  },
  {
    command: '/leatherarmor',
    name: 'Leather Armor',
    category: 'armor',
    description: 'Hardened leather providing basic protection with mobility.',
    visualDetails: 'brown cured leather, metal studs, shoulder guards, laced sides',
    suggestedStats: { defense: 15, mobility: 95 },
  },
  {
    command: '/brigandine',
    name: 'Brigandine',
    category: 'armor',
    description: 'Metal plates riveted inside a cloth or leather garment.',
    visualDetails: 'cloth exterior, visible rivets, vest-style, metal plates inside',
    suggestedStats: { defense: 40, mobility: 70 },
  },
  
  // Helmets
  {
    command: '/helmet',
    name: 'Combat Helmet',
    category: 'armor',
    description: 'A modern ballistic helmet with mount points.',
    visualDetails: 'kevlar shell, NVG mount, rail system, adjustable straps, padding',
    suggestedStats: { defense: 20, mobility: 95 },
  },
  {
    command: '/medievalhelm',
    name: 'Medieval Helmet',
    category: 'armor',
    description: 'A steel helmet with face protection.',
    visualDetails: 'steel construction, visor, breathing holes, chain mail aventail',
    suggestedStats: { defense: 25, mobility: 85 },
  },
  
  // Specialty
  {
    command: '/hazmatsuit',
    name: 'Hazmat Suit',
    category: 'armor',
    description: 'A full-body suit protecting against chemical and biological hazards.',
    visualDetails: 'yellow or white, full enclosure, respirator, sealed gloves/boots',
    suggestedStats: { defense: 5, mobility: 60 },
  },
  {
    command: '/spacesuit',
    name: 'Space Suit',
    category: 'armor',
    description: 'A pressurized suit for hostile environments.',
    visualDetails: 'white or orange, helmet with visor, life support pack, tethers',
    suggestedStats: { defense: 10, mobility: 50 },
  },
  {
    command: '/exosuit',
    name: 'Exo-Suit',
    category: 'armor',
    description: 'A powered exoskeleton enhancing strength and protection.',
    visualDetails: 'metal frame, servo motors, power supply, HUD display, armor plating',
    suggestedStats: { defense: 60, mobility: 80 },
  },
];

// Clothing
export const CLOTHING_PROMPTS: ItemPrompt[] = [
  // Tops
  {
    command: '/jacket',
    name: 'Jacket',
    category: 'clothing',
    description: 'A casual jacket providing light protection from the elements.',
    visualDetails: 'leather or canvas, zipper front, collar, pockets, worn-in look',
  },
  {
    command: '/hoodie',
    name: 'Hoodie',
    category: 'clothing',
    description: 'A hooded sweatshirt for warmth and anonymity.',
    visualDetails: 'cotton blend, drawstring hood, front pouch pocket, ribbed cuffs',
  },
  {
    command: '/coat',
    name: 'Coat',
    category: 'clothing',
    description: 'A long coat for protection against weather.',
    visualDetails: 'heavy fabric, double-breasted, deep pockets, knee-length',
  },
  {
    command: '/duster',
    name: 'Duster',
    category: 'clothing',
    description: 'A long leather or canvas coat. Classic western style.',
    visualDetails: 'oiled canvas or leather, ankle-length, split back, rain-resistant',
  },
  {
    command: '/trenchcoat',
    name: 'Trench Coat',
    category: 'clothing',
    description: 'A classic trench coat with belted waist.',
    visualDetails: 'tan or black, double-breasted, belted, epaulettes, storm flap',
  },
  
  // Bottoms
  {
    command: '/cargopants',
    name: 'Cargo Pants',
    category: 'clothing',
    description: 'Practical pants with multiple pockets.',
    visualDetails: 'ripstop fabric, thigh pockets, reinforced knees, belt loops',
  },
  {
    command: '/jeans',
    name: 'Jeans',
    category: 'clothing',
    description: 'Classic denim pants. Durable and versatile.',
    visualDetails: 'blue denim, five-pocket style, boot cut or straight leg',
  },
  {
    command: '/tacticalpants',
    name: 'Tactical Pants',
    category: 'clothing',
    description: 'Military-style pants with reinforced construction.',
    visualDetails: 'ripstop nylon, cargo pockets, knee pad inserts, gusseted crotch',
  },
  
  // Footwear
  {
    command: '/combatboots',
    name: 'Combat Boots',
    category: 'clothing',
    description: 'Military boots with ankle support and rugged soles.',
    visualDetails: 'black leather, steel toe, speed laces, lug sole, ankle support',
  },
  {
    command: '/hikingboots',
    name: 'Hiking Boots',
    category: 'clothing',
    description: 'Rugged boots for rough terrain.',
    visualDetails: 'leather and nylon, waterproof, vibram sole, ankle support',
  },
  {
    command: '/sneakers',
    name: 'Sneakers',
    category: 'clothing',
    description: 'Athletic shoes for speed and agility.',
    visualDetails: 'mesh and synthetic, cushioned sole, lace-up, breathable',
  },
  
  // Accessories
  {
    command: '/gloves',
    name: 'Tactical Gloves',
    category: 'clothing',
    description: 'Protective gloves with reinforced knuckles.',
    visualDetails: 'leather palm, nylon back, hard knuckle guards, touchscreen tips',
  },
  {
    command: '/goggles',
    name: 'Tactical Goggles',
    category: 'clothing',
    description: 'Protective eyewear for harsh conditions.',
    visualDetails: 'polycarbonate lens, anti-fog, adjustable strap, interchangeable lenses',
  },
  {
    command: '/mask',
    name: 'Face Mask',
    category: 'clothing',
    description: 'A face covering for protection or anonymity.',
    visualDetails: 'fabric or polymer, covers nose and mouth, adjustable straps',
  },
  {
    command: '/balaclava',
    name: 'Balaclava',
    category: 'clothing',
    description: 'A full head covering with eye opening.',
    visualDetails: 'stretchy fabric, single or three-hole design, moisture-wicking',
  },
  {
    command: '/bandana',
    name: 'Bandana',
    category: 'clothing',
    description: 'A versatile cloth for face covering or headwear.',
    visualDetails: 'cotton, paisley or solid pattern, faded, sweat-stained',
  },
  {
    command: '/backpack',
    name: 'Backpack',
    category: 'clothing',
    description: 'A tactical or hiking backpack for carrying gear.',
    visualDetails: 'MOLLE webbing, hydration compatible, multiple compartments, padded straps',
  },
];

// ============= ALL PROMPTS COMBINED =============

export const ALL_ITEM_PROMPTS: ItemPrompt[] = [
  ...FIREARM_PROMPTS,
  ...MELEE_PROMPTS,
  ...ARMOR_PROMPTS,
  ...CLOTHING_PROMPTS,
];

// ============= COMMAND PARSER =============

/**
 * Check if a command is an item prompt command
 * Returns the matching prompt or null
 * Commands are case-insensitive
 */
export function parseItemPromptCommand(input: string): ItemPrompt | null {
  const trimmed = input.trim().toLowerCase();
  
  // Must start with /
  if (!trimmed.startsWith('/')) {
    return null;
  }
  
  // Find matching prompt
  return ALL_ITEM_PROMPTS.find(p => p.command === trimmed) || null;
}

/**
 * Get all commands for a specific category
 */
export function getCommandsByCategory(category: ItemPrompt['category']): ItemPrompt[] {
  return ALL_ITEM_PROMPTS.filter(p => p.category === category);
}

/**
 * Get commands grouped by category for help display
 */
export function getCommandsGrouped(): Record<string, ItemPrompt[]> {
  return {
    'Firearms': FIREARM_PROMPTS,
    'Melee Weapons': MELEE_PROMPTS,
    'Armor': ARMOR_PROMPTS,
    'Clothing': CLOTHING_PROMPTS,
  };
}

/**
 * Build a full item description from a prompt
 * Used when creating custom items
 */
export function buildItemDescriptionFromPrompt(prompt: ItemPrompt): string {
  const lines: string[] = [
    prompt.description,
    '',
    `Visual Details: ${prompt.visualDetails}`,
  ];
  
  if (prompt.suggestedStats && Object.keys(prompt.suggestedStats).length > 0) {
    lines.push('');
    lines.push('Suggested Stats:');
    for (const [stat, value] of Object.entries(prompt.suggestedStats)) {
      lines.push(`  - ${stat}: ${value}`);
    }
  }
  
  return lines.join('\n');
}

/**
 * Get a list of all available item commands for help display
 */
export function getAllItemCommands(): string[] {
  return ALL_ITEM_PROMPTS.map(p => p.command);
}

/**
 * Check if input starts with an item command prefix
 */
export function isItemCommand(input: string): boolean {
  const trimmed = input.trim().toLowerCase();
  return ALL_ITEM_PROMPTS.some(p => trimmed.startsWith(p.command));
}
