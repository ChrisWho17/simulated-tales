// Era System - Defines historical/futuristic periods for visual generation

export type EraId = 
  | 'ancient' | 'medieval' | 'renaissance' | 'victorian' | 'wildwest'
  | 'earlymodern' | 'modern' | 'nearfuture' | 'farfuture' 
  | 'postapocalyptic' | 'cyberpunk' | 'steampunk';

export type RoleId = 
  | 'soldier' | 'merchant' | 'healer' | 'scholar' | 'criminal' 
  | 'entertainer' | 'laborer' | 'noble' | 'religious' | 'commoner';

export interface EraProfile {
  period: string;
  years: string;
  clothing: {
    common: string;
    wealthy: string;
    military: string;
    worker: string;
    religious?: string;
    scholar?: string;
    upper_class?: string;
    outlaw?: string;
    inventor?: string;
    street?: string;
  };
  architecture: string;
  technology: string;
  lighting: string;
  materials: string;
}

export interface EraOption {
  id: EraId;
  name: string;
  desc: string;
  icon: string;
}

export const ERA_PROFILES: Record<EraId, EraProfile> = {
  ancient: {
    period: "Ancient/Classical",
    years: "3000 BCE - 500 CE",
    clothing: {
      common: "togas, robes, tunics, sandals, leather wraps",
      wealthy: "dyed silks, gold jewelry, laurel wreaths",
      military: "bronze cuirass, red cloak, plumed helmet, spear and shield",
      worker: "simple linen, bare feet, rough cloth"
    },
    architecture: "marble columns, temples, amphitheaters, aqueducts",
    technology: "scrolls, oil lamps, chariots, bronze tools",
    lighting: "torch light, oil lamp glow, Mediterranean sun",
    materials: "bronze, marble, linen, leather, clay"
  },
  
  medieval: {
    period: "Medieval/Dark Ages",
    years: "500 - 1400 CE",
    clothing: {
      common: "wool tunics, leather boots, cloth hoods, simple dresses",
      wealthy: "velvet robes, fur trim, gold chains, noble crests",
      military: "full plate armor, surcoat with heraldry, longsword, kite shield",
      worker: "rough spun cloth, aprons, wooden clogs",
      religious: "monk robes, nun habits, priest vestments"
    },
    architecture: "stone castles, thatched cottages, cathedrals, cobblestone streets",
    technology: "candles, horses, blacksmith forges, quills and parchment",
    lighting: "candlelight, fireplace glow, torches, overcast skies",
    materials: "iron, stone, wool, leather, wood"
  },
  
  renaissance: {
    period: "Renaissance",
    years: "1400 - 1600 CE",
    clothing: {
      common: "doublets, breeches, corsets, flowing sleeves",
      wealthy: "elaborate gowns, ruffs, jeweled accessories, feathered hats",
      military: "ornate half-plate, plumed morion, rapier and musket",
      worker: "practical garments, leather aprons",
      scholar: "academic robes, berets, ink-stained fingers"
    },
    architecture: "grand palaces, domed cathedrals, ornate fountains",
    technology: "printing press, early firearms, telescopes, oil paintings",
    lighting: "warm golden light, dramatic chiaroscuro",
    materials: "steel, silk, velvet, marble, oil paints"
  },
  
  victorian: {
    period: "Victorian/Industrial",
    years: "1837 - 1901 CE",
    clothing: {
      common: "waistcoats, top hats, long dresses, bonnets, cravats",
      wealthy: "tailored suits, elaborate gowns, pocket watches, monocles",
      military: "red military coat, brass buttons, pith helmet, rifle",
      worker: "flat caps, suspenders, work boots, soot-stained clothes",
      upper_class: "morning coats, evening gowns, white gloves"
    },
    architecture: "brick townhouses, gas lamps, iron bridges, factories with smokestacks",
    technology: "steam engines, telegraphs, gas lighting, early photography",
    lighting: "gas lamp glow, foggy atmosphere, industrial haze",
    materials: "brass, iron, coal, cotton, leather"
  },
  
  wildwest: {
    period: "Wild West",
    years: "1865 - 1895 CE",
    clothing: {
      common: "cowboy hats, dusters, boots with spurs, bandanas",
      wealthy: "bolo ties, silver buckles, fine leather",
      military: "cavalry uniforms, campaign hats, cavalry sabers",
      worker: "overalls, work shirts, worn leather",
      outlaw: "weathered clothes, gun belts, wanted poster aesthetic"
    },
    architecture: "wooden saloons, dusty main streets, ranch houses",
    technology: "revolvers, lever-action rifles, horse and wagon, telegraph",
    lighting: "harsh desert sun, dusty golden hour, saloon lamplight",
    materials: "leather, wood, iron, rope, canvas"
  },
  
  earlymodern: {
    period: "Early 20th Century",
    years: "1900 - 1945 CE",
    clothing: {
      common: "suits, fedoras, flapper dresses, suspenders",
      wealthy: "tailored three-piece suits, fur coats, pearls",
      military: "WWI/WWII uniforms, trench coats, steel helmets, dog tags",
      worker: "coveralls, newsboy caps, work boots"
    },
    architecture: "art deco buildings, brownstones, early skyscrapers",
    technology: "automobiles, telephones, radios, early aircraft",
    lighting: "electric bulbs, noir shadows, smoky rooms",
    materials: "steel, glass, bakelite, cotton, wool"
  },
  
  modern: {
    period: "Modern Day",
    years: "1990 - Present",
    clothing: {
      common: "jeans, t-shirts, sneakers, hoodies, casual wear",
      wealthy: "designer brands, luxury watches, tailored fashion",
      military: "BDUs, combat boots, tactical vests, kevlar helmets, dog tags",
      worker: "uniforms, safety gear, hi-vis vests"
    },
    architecture: "glass skyscrapers, suburban homes, strip malls",
    technology: "smartphones, computers, modern vehicles, internet",
    lighting: "fluorescent, LED, screen glow, urban light pollution",
    materials: "plastic, aluminum, synthetic fabrics, glass"
  },
  
  nearfuture: {
    period: "Near Future",
    years: "2050 - 2150 CE",
    clothing: {
      common: "smart fabrics, minimalist designs, subtle tech integration",
      wealthy: "designer augments, holographic accessories, nano-weave suits",
      military: "exoskeletons, smart armor, HUD helmets, energy weapons",
      worker: "utility jumpsuits, AR glasses, tool harnesses"
    },
    architecture: "arcologies, vertical farms, mag-lev rails, solar panels everywhere",
    technology: "AR/VR, drones, AI assistants, clean energy, biotech",
    lighting: "holographic displays, clean white LED, neon accents",
    materials: "carbon fiber, smart glass, nano-materials, recycled composites"
  },
  
  farfuture: {
    period: "Far Future/Space Age",
    years: "2200+ CE",
    clothing: {
      common: "jumpsuits, utility wear, magnetic boots",
      wealthy: "exotic alien materials, energy-field fashion, status implants",
      military: "power armor, energy shields, plasma weapons, neural interfaces",
      worker: "EVA suits, engineering rigs, tool drones"
    },
    architecture: "space stations, colony domes, megastructures, alien ruins",
    technology: "FTL travel, energy weapons, terraforming, AI consciousness",
    lighting: "starlight, bioluminescence, holographic, alien suns",
    materials: "exotic alloys, energy fields, alien materials, synthetics"
  },
  
  postapocalyptic: {
    period: "Post-Apocalyptic",
    years: "After collapse",
    clothing: {
      common: "scavenged layers, patched clothing, improvised protection",
      wealthy: "pre-war salvage in good condition, clean clothes (rare)",
      military: "scrap metal armor, makeshift helmet, pipe weapons, gas masks",
      worker: "practical salvage, tool belts, weathered everything"
    },
    architecture: "ruins, shanty towns, fortified settlements, overgrown cities",
    technology: "salvaged pre-war tech, improvised weapons, ham radios",
    lighting: "harsh sun, firelight, rare electricity, dust-filtered light",
    materials: "rust, scrap metal, duct tape, salvage, bones"
  },
  
  cyberpunk: {
    period: "Cyberpunk",
    years: "Dystopian future",
    clothing: {
      common: "street fashion, LED accents, techwear, mirrorshades",
      wealthy: "corp suits, subtle augments, designer chrome",
      military: "corporate security gear, black ops suits, chrome limbs",
      worker: "utilitarian jumpsuits, visible cheap augments, branded uniforms",
      street: "punk aesthetic, visible cyberware, neon hair, leather and chrome"
    },
    architecture: "mega-towers, neon-lit streets, corporate arcologies, slums",
    technology: "cyberware, neural links, hacking decks, drones, megacorps",
    lighting: "neon glow, rain-slicked reflections, holographic ads, dark shadows",
    materials: "chrome, plastic, synthetic leather, circuitry, neon"
  },
  
  steampunk: {
    period: "Steampunk",
    years: "Alt-Victorian",
    clothing: {
      common: "Victorian base with brass goggles, gears, leather straps",
      wealthy: "elaborate clockwork accessories, fine brass augments",
      military: "steam-powered armor, brass weapons, airship crews",
      worker: "leather aprons, welding goggles, tool-heavy belts",
      inventor: "goggles, leather coats, clockwork gadgets everywhere"
    },
    architecture: "brass and copper pipes, clockwork mechanisms, airship docks",
    technology: "steam engines, clockwork, airships, mechanical computers",
    lighting: "warm gas lamps, furnace glow, amber tones, steam clouds",
    materials: "brass, copper, leather, wood, glass, gears"
  }
};

// Role-based clothing by era
export const ROLE_TO_CLOTHING: Record<RoleId, Partial<Record<EraId, string>>> = {
  soldier: {
    ancient: "bronze cuirass, red cloak, plumed helmet, spear and shield",
    medieval: "full plate armor, surcoat with heraldry, longsword, kite shield",
    renaissance: "ornate half-plate, plumed morion, rapier and musket",
    victorian: "red military coat, brass buttons, pith helmet, rifle",
    earlymodern: "olive drab uniform, steel helmet, leather boots, rifle",
    modern: "digital camo BDUs, tactical vest, combat helmet, assault rifle",
    nearfuture: "smart armor with HUD helmet, energy rifle, exo-assist frame",
    farfuture: "powered exosuit, energy shields, plasma rifle, neural helm",
    cyberpunk: "corporate security armor, chrome augments, smart gun",
    steampunk: "brass-plated armor, steam pack, clockwork rifle",
    postapocalyptic: "scrap metal armor, makeshift helmet, pipe weapons"
  },
  
  merchant: {
    ancient: "fine dyed robes, gold rings, merchant scales",
    medieval: "fur-trimmed coat, coin purse, guild badge",
    renaissance: "velvet doublet, feathered cap, ledger book",
    victorian: "waistcoat, pocket watch, top hat, cane",
    earlymodern: "three-piece suit, briefcase, spectacles",
    modern: "business casual, tablet, bluetooth earpiece",
    nearfuture: "smart-fabric suit, holographic display cuff",
    farfuture: "sleek corp attire, floating data screens",
    cyberpunk: "corp suit with subtle augments, credstick",
    steampunk: "brass-buttoned coat, mechanical calculator",
    postapocalyptic: "weathered trader clothes, barter goods visible"
  },
  
  healer: {
    ancient: "white robes, herb pouch, sacred symbols",
    medieval: "monk robes or wise woman dress, herb satchel, healing kit",
    renaissance: "physician robes, plague mask (optional), medical bag",
    victorian: "doctor's coat, stethoscope, medical bag",
    earlymodern: "white coat, nurse cap, medical instruments",
    modern: "scrubs, lab coat, stethoscope, ID badge",
    nearfuture: "smart medical suit, diagnostic AR glasses",
    farfuture: "medical jumpsuit, nanite injector, bio-scanner",
    cyberpunk: "street doc gear, chrome surgical tools, black market augments",
    steampunk: "leather apron, brass medical tools, clockwork prosthetics",
    postapocalyptic: "salvaged medical gear, precious antibiotics visible"
  },
  
  scholar: {
    ancient: "philosopher robes, scroll case, writing implements",
    medieval: "monk robes, illuminated manuscripts, quill",
    renaissance: "academic gown, beret, books and instruments",
    victorian: "tweed suit, spectacles, leather-bound books",
    earlymodern: "professor attire, wire-rim glasses, briefcase",
    modern: "smart casual, laptop, university lanyard",
    nearfuture: "minimalist wear, AR research glasses, data pad",
    farfuture: "knowledge-caste attire, neural research link",
    cyberpunk: "netrunner gear, data cables, hacking deck",
    steampunk: "inventor coat, brass goggles, clockwork calculator",
    postapocalyptic: "scavenged books, precious paper, ink-stained hands"
  },
  
  criminal: {
    ancient: "dark cloak, hidden blades, shadows",
    medieval: "hooded cloak, lockpicks, daggers",
    renaissance: "dark doublet, hidden blades, poison vials",
    victorian: "dark coat, flat cap, cosh, lockpicks",
    earlymodern: "pinstripe suit, tommy gun, fedora",
    modern: "street clothes, concealed weapon, burner phone",
    nearfuture: "stealth suit, hacking tools, scrambler",
    farfuture: "cloaking device, energy blade, identity scrubber",
    cyberpunk: "street samurai gear, illegal chrome, black ICE",
    steampunk: "dark leather, clockwork lockpicks, steam-powered gadgets",
    postapocalyptic: "raider gear, skull motifs, makeshift weapons"
  },
  
  entertainer: {
    ancient: "colorful robes, lyre or flute, theatrical mask",
    medieval: "jester motley, lute, colorful patches",
    renaissance: "theatrical costume, musical instruments, dramatic flair",
    victorian: "stage costume, top hat, cane, dramatic makeup",
    earlymodern: "showbiz attire, microphone, glamorous dress",
    modern: "casual trendy clothes, instrument, stage presence",
    nearfuture: "smart-fabric costume, holographic effects",
    farfuture: "morphic performance suit, mood-reactive clothing",
    cyberpunk: "chrome-punk style, implanted instruments, neon hair",
    steampunk: "elaborate clockwork costume, mechanical instruments",
    postapocalyptic: "colorful scavenged outfit, maintained instrument (precious)"
  },
  
  laborer: {
    ancient: "simple loincloth or tunic, calloused hands, tools",
    medieval: "rough wool tunic, leather apron, work tools",
    renaissance: "practical work clothes, guild tools, muscled arms",
    victorian: "work shirt, suspenders, flat cap, soot-stained",
    earlymodern: "coveralls, work boots, lunch pail",
    modern: "work uniform, safety gear, ID badge",
    nearfuture: "exo-assist frame, utility jumpsuit",
    farfuture: "labor-caste uniform, drone assist units",
    cyberpunk: "corp labor jumpsuit, cheap visible augments",
    steampunk: "leather apron, goggles, wrench, grease-stained",
    postapocalyptic: "patched work clothes, improvised tools"
  },
  
  noble: {
    ancient: "purple toga, gold laurel, attendants",
    medieval: "velvet robes, ermine trim, crown or coronet, signet ring",
    renaissance: "elaborate gown or doublet, jewels, family crest",
    victorian: "finest tailored suit or gown, top hat, walking cane",
    earlymodern: "high society fashion, expensive jewelry",
    modern: "designer everything, subtle but obvious wealth",
    nearfuture: "elite fashion, visible high-end augments, entourage",
    farfuture: "exotic materials, gravity-defying fashion, status implants",
    cyberpunk: "corp elite suit, discreet military-grade chrome",
    steampunk: "elaborate brass accessories, clockwork servants",
    postapocalyptic: "pre-war pristine clothes (incredibly rare), guards"
  },
  
  religious: {
    ancient: "priest robes, sacred symbols, ritual objects",
    medieval: "monk/nun habits, priest vestments, holy symbols, prayer beads",
    renaissance: "elaborate religious vestments, ceremonial objects",
    victorian: "clerical collar, religious attire, prayer book",
    earlymodern: "appropriate religious dress, sacred objects",
    modern: "religious attire appropriate to faith",
    nearfuture: "tech-integrated religious symbols, faith-tech hybrid",
    farfuture: "cult-specific attire, alien religious symbols",
    cyberpunk: "street preacher attire, faith vs chrome aesthetic",
    steampunk: "clockwork religious symbols, steam-powered ritual items",
    postapocalyptic: "scavenged religious symbols, faith as survival"
  },
  
  commoner: {
    ancient: "simple tunic or robes, sandals",
    medieval: "rough wool clothing, practical boots",
    renaissance: "simple but clean clothes, working class attire",
    victorian: "modest dress, practical clothing",
    earlymodern: "everyday clothes of the era",
    modern: "jeans and t-shirt, casual wear",
    nearfuture: "smart casual, minimalist tech",
    farfuture: "standard citizen attire",
    cyberpunk: "street fashion, some tech accessories",
    steampunk: "victorian casual with goggles",
    postapocalyptic: "scavenged but maintained clothing"
  }
};

export const ERA_OPTIONS: EraOption[] = [
  { id: 'ancient', name: 'Ancient World', desc: 'Classical antiquity, togas and temples', icon: '🏛️' },
  { id: 'medieval', name: 'Medieval', desc: 'Knights, castles, and feudal society', icon: '⚔️' },
  { id: 'renaissance', name: 'Renaissance', desc: 'Art, invention, and intrigue', icon: '🎨' },
  { id: 'victorian', name: 'Victorian', desc: 'Industrial revolution and empire', icon: '🎩' },
  { id: 'wildwest', name: 'Wild West', desc: 'Frontier justice and outlaws', icon: '🤠' },
  { id: 'earlymodern', name: 'Early Modern', desc: 'World wars and noir', icon: '🎬' },
  { id: 'modern', name: 'Modern Day', desc: 'Contemporary setting', icon: '🏙️' },
  { id: 'nearfuture', name: 'Near Future', desc: "Tomorrow's technology", icon: '🔮' },
  { id: 'farfuture', name: 'Far Future', desc: 'Space age and beyond', icon: '🚀' },
  { id: 'postapocalyptic', name: 'Post-Apocalyptic', desc: 'After the fall', icon: '☢️' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'High tech, low life', icon: '🌃' },
  { id: 'steampunk', name: 'Steampunk', desc: 'Victorian science fantasy', icon: '⚙️' }
];

// Genre to suggested era mapping
export const GENRE_TO_DEFAULT_ERA: Record<string, EraId> = {
  fantasy: 'medieval',
  scifi: 'farfuture',
  horror: 'victorian',
  mystery: 'earlymodern',
  western: 'wildwest',
  modern: 'modern',
  cyberpunk: 'cyberpunk',
  steampunk: 'steampunk',
  postapoc: 'postapocalyptic',
  historical: 'renaissance'
};
