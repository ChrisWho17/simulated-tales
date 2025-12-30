/**
 * OPENING NARRATIVE GENERATOR
 * 
 * Creates immersive, character-aware opening narratives when AI calls fail.
 * Uses character class, background, appearance, scenario, and mood to craft
 * compelling story beginnings that feel tailored rather than generic.
 */

import { RPGCharacter } from '@/types/rpgCharacter';
import { GameGenre } from '@/types/genreData';
import { GENRE_CLASSES, getGenreClasses } from './storyInventoryBridge';

// ============================================================================
// CHARACTER CONTEXT EXTRACTION
// ============================================================================

interface CharacterContext {
  name: string;
  classId: string;
  className: string;
  classDescription: string;
  backgroundId: string;
  traits: string[];
  primaryTrait: string;
  highestStat: string;
  lowestStat: string;
  inventory: string[];
  primaryWeapon?: string;
  gold: number;
  appearance?: {
    gender?: string;
    hairColor?: string;
    hairStyle?: string;
    eyeColor?: string;
    skinTone?: string;
    build?: string;
  };
}

function extractCharacterContext(character: RPGCharacter, genre: GameGenre): CharacterContext {
  const charAny = character as any;
  
  // Find class info
  const genreClasses = getGenreClasses(genre);
  const classInfo = genreClasses.find(c => c.id === character.classId) 
    || genreClasses.find(c => c.id === 'default')
    || { id: 'default', name: 'Adventurer', description: 'A wanderer seeking purpose' };
  
  // Find highest and lowest stats
  const stats = character.stats;
  const statEntries = Object.entries(stats) as [string, number][];
  const sorted = statEntries.sort((a, b) => b[1] - a[1]);
  const highestStat = sorted[0][0];
  const lowestStat = sorted[sorted.length - 1][0];
  
  // Find primary weapon in inventory
  const weaponKeywords = ['sword', 'blade', 'dagger', 'axe', 'mace', 'staff', 'bow', 'gun', 'pistol', 'rifle', 'knife'];
  const primaryWeapon = character.inventory.find(item => 
    weaponKeywords.some(kw => item.name.toLowerCase().includes(kw))
  )?.name;
  
  return {
    name: character.name,
    classId: character.classId,
    className: classInfo.name,
    classDescription: classInfo.description,
    backgroundId: character.backgroundId,
    traits: character.traits || [],
    primaryTrait: character.traits?.[0] || 'determined',
    highestStat,
    lowestStat,
    inventory: character.inventory.map(i => i.name),
    primaryWeapon,
    gold: character.gold,
    appearance: {
      gender: charAny.gender,
      hairColor: charAny.hairColor,
      hairStyle: charAny.hairStyle,
      eyeColor: charAny.eyeColor,
      skinTone: charAny.skinTone,
      build: charAny.build,
    },
  };
}

// ============================================================================
// STAT-BASED DESCRIPTORS
// ============================================================================

const STAT_DESCRIPTORS: Record<string, { high: string; low: string }> = {
  strength: { high: 'muscular frame', low: 'slight frame' },
  dexterity: { high: 'graceful movements', low: 'careful, deliberate movements' },
  constitution: { high: 'robust constitution', low: 'delicate constitution' },
  intelligence: { high: 'sharp, calculating eyes', low: 'simple, honest expression' },
  wisdom: { high: 'knowing gaze', low: 'youthful naivety' },
  charisma: { high: 'magnetic presence', low: 'unassuming demeanor' },
};

// ============================================================================
// TRAIT MODIFIERS
// ============================================================================

const TRAIT_ACTIONS: Record<string, string[]> = {
  brave: ['squared their shoulders', 'lifted their chin', 'met the unknown with a steady gaze'],
  cautious: ['scanned the surroundings carefully', 'kept one hand near their weapon', 'moved with deliberate caution'],
  cunning: ['noted every exit', 'calculated the angles', 'wore a knowing half-smile'],
  honest: ['took a deep breath', 'prepared to face whatever came', 'stood with quiet dignity'],
  mysterious: ['let shadows pool around them', 'kept their true thoughts hidden', 'watched with unreadable eyes'],
  'hot-headed': ['felt the familiar fire rising', 'clenched their fists', 'was ready to act first'],
  calm: ['found their center', 'breathed slowly', 'maintained perfect composure'],
  curious: ['looked around with keen interest', 'noticed every detail', 'wondered what secrets awaited'],
  loyal: ['thought of those depending on them', 'steeled their resolve', 'would not fail those who trusted them'],
  ambitious: ['saw opportunity everywhere', 'knew this was just the beginning', 'hungered for more'],
  compassionate: ['felt the weight of others\' struggles', 'noticed those in need', 'carried empathy like a torch'],
  ruthless: ['felt no hesitation', 'would do what must be done', 'weakness was not an option'],
  witty: ['found dark humor in the situation', 'suppressed a sardonic smile', 'quipped silently to themselves'],
  stoic: ['betrayed no emotion', 'remained impassive', 'endured as they always had'],
  optimistic: ['found hope in small things', 'smiled despite everything', 'knew better days would come'],
  paranoid: ['checked over their shoulder for the third time', 'trusted nothing at face value', 'saw threats in every shadow'],
  reckless: ['felt the rush of adrenaline building', 'lived for the chaos ahead', 'grinned at the danger'],
  cynical: ['expected the worst—and was rarely disappointed', 'saw through the pretenses', 'kept expectations low'],
  idealistic: ['believed in something greater', 'held fast to principles', 'refused to let darkness win'],
  vengeful: ['remembered every slight', 'tasted bitter resolve', 'would see debts paid in full'],
  calculating: ['weighed every variable', 'played the long game', 'emotion was a liability they couldn\'t afford'],
  proud: ['would not be seen as weak', 'held their head high', 'dignity was non-negotiable'],
  haunted: ['felt the ghosts of the past close', 'carried memories like scars', 'some wounds never heal'],
  determined: ['set their jaw', 'nothing would stop them', 'failure was not an option'],
  desperate: ['had nothing left to lose', 'backed into a corner', 'survival instinct screamed'],
};

// ============================================================================
// ACCENT MODIFIERS (for NPC flavor in openings)
// ============================================================================

const ACCENT_MODIFIERS: Record<string, { greeting: string; flavor: string; verbal_tic: string }> = {
  southern: { 
    greeting: "Well now, stranger", 
    flavor: "drawled with a honeyed cadence",
    verbal_tic: "y'all" 
  },
  brooklyn: { 
    greeting: "Hey, pal", 
    flavor: "spoke in sharp, clipped tones",
    verbal_tic: "fuggedaboutit" 
  },
  british_posh: { 
    greeting: "I say, good day", 
    flavor: "enunciated with precise diction",
    verbal_tic: "quite so" 
  },
  cockney: { 
    greeting: "Oi, mate", 
    flavor: "spoke with rough London charm",
    verbal_tic: "right then" 
  },
  irish: { 
    greeting: "Top of the mornin'", 
    flavor: "lilted with musical rhythm",
    verbal_tic: "to be sure" 
  },
  scottish: { 
    greeting: "Ach, well met", 
    flavor: "rolled their Rs with highland pride",
    verbal_tic: "aye" 
  },
  texan: { 
    greeting: "Howdy, partner", 
    flavor: "drawled slow and deliberate",
    verbal_tic: "reckon" 
  },
  russian: { 
    greeting: "Comrade", 
    flavor: "spoke with hard consonants",
    verbal_tic: "da" 
  },
  french: { 
    greeting: "Bonjour, mon ami", 
    flavor: "purred with continental elegance",
    verbal_tic: "mais oui" 
  },
  german: { 
    greeting: "Guten tag", 
    flavor: "spoke with precise efficiency",
    verbal_tic: "ja" 
  },
  japanese: { 
    greeting: "Greetings, honored one", 
    flavor: "spoke with formal courtesy",
    verbal_tic: "hai" 
  },
  jamaican: { 
    greeting: "Wha gwaan", 
    flavor: "lilted with island rhythm",
    verbal_tic: "ya know" 
  },
  new_york: { 
    greeting: "Hey, how you doin'", 
    flavor: "talked fast and direct",
    verbal_tic: "you know what I'm sayin'" 
  },
  australian: { 
    greeting: "G'day mate", 
    flavor: "spoke with laid-back inflection",
    verbal_tic: "no worries" 
  },
  midwest: { 
    greeting: "Oh, hey there", 
    flavor: "spoke with friendly warmth",
    verbal_tic: "ope" 
  },
};

// ============================================================================
// GENRE-SPECIFIC ATMOSPHERE TEMPLATES
// ============================================================================

interface GenreAtmosphere {
  timeDescriptions: string[];
  locationStarters: string[];
  sensoryDetails: string[];
  immediateHooks: string[];
  classIntros: Record<string, string[]>;
}

const GENRE_ATMOSPHERES: Record<string, GenreAtmosphere> = {
  fantasy: {
    timeDescriptions: [
      'The dawn sun cast golden light across the ancient stones',
      'Twilight painted the sky in shades of amber and violet',
      'A full moon hung heavy over the sleeping world',
      'Morning mist still clung to the ground like spirits reluctant to depart',
    ],
    locationStarters: [
      'at the crossroads where three kingdoms met',
      'before the gates of a city older than memory',
      'in the shadow of mountains that scraped the heavens',
      'on a road worn smooth by countless travelers before',
    ],
    sensoryDetails: [
      'The air hummed with ancient magic, barely perceptible',
      'A raven watched from a gnarled oak, its eyes knowing too much',
      'The wind carried whispers of prophecy',
      'Something old stirred in the depths of the earth',
    ],
    immediateHooks: [
      'A village burned on the horizon. Someone would answer for this.',
      'The quest that brought them here had already cost too much.',
      'The sealed letter in their pack felt heavier than iron.',
      'Destiny had a cruel sense of timing.',
    ],
    classIntros: {
      warrior: ['Their sword was an extension of their will', 'Years of training had led to this moment'],
      mage: ['Power crackled at their fingertips', 'The arcane arts demanded a terrible price'],
      rogue: ['Shadows welcomed them like an old friend', 'Trust was a luxury they couldn\'t afford'],
      cleric: ['Faith was their shield and purpose', 'The divine called, and they answered'],
      ranger: ['The wild places had shaped them', 'Nature\'s lessons were written in their scars'],
      default: ['Adventure called to their restless soul', 'Every legend had a beginning'],
    },
  },
  scifi: {
    timeDescriptions: [
      'Station lights cycled to artificial dawn, 0600 hours',
      'The stars wheeled slowly outside the viewport',
      'Emergency lighting bathed everything in red',
      'The chrono displayed a time that meant nothing this far from Earth',
    ],
    locationStarters: [
      'aboard a vessel drifting through the void between stars',
      'on a station that had seen better centuries',
      'in a colony dome on a world that humanity was still learning to survive',
      'at the edge of known space, where maps turned to speculation',
    ],
    sensoryDetails: [
      'Systems hummed their electronic mantras in the walls',
      'Recycled air carried the faint tang of ozone and old metal',
      'The ship\'s AI observed in patient silence',
      'Gravity felt wrong here, a fraction off true',
    ],
    immediateHooks: [
      'The distress signal had been broadcasting for forty-seven years.',
      'Corporate doesn\'t send people this far out for nothing.',
      'Something moved on the sensors that shouldn\'t exist.',
      'The cryo-sleep dreams still clung like cobwebs.',
    ],
    classIntros: {
      marine: ['Their combat suit was a second skin', 'They\'d survived worse odds'],
      scientist: ['Data never lied, but it often concealed', 'The unknown was their natural habitat'],
      pilot: ['The ship responded to their touch like a living thing', 'Empty space held no fear'],
      engineer: ['Every system had a weakness; they knew them all', 'Machines were honest in their dysfunction'],
      default: ['The frontier called to those who couldn\'t stay still', 'Space was vast, and so was opportunity'],
    },
  },
  horror: {
    timeDescriptions: [
      'Night pressed against the windows like something hungry',
      'The witching hour had come and refused to leave',
      'Darkness swallowed the last of the daylight with eager finality',
      'The clock struck an hour that shouldn\'t exist',
    ],
    locationStarters: [
      'in a place where hope went to die',
      'at the threshold of something that should have stayed buried',
      'in a building that breathed with malevolent patience',
      'somewhere that existed in the cracks between maps',
    ],
    sensoryDetails: [
      'The silence was wrong—too complete, too deliberate',
      'Shadows moved in peripheral vision, still when observed directly',
      'The temperature dropped for no earthly reason',
      'Something watched from the darkness with patient hunger',
    ],
    immediateHooks: [
      'They should never have come here. But leaving wasn\'t an option anymore.',
      'The others had gone quiet. Too quiet.',
      'What had seemed like paranoia now felt like insufficient caution.',
      'Reality itself felt thin here, stretched over something vast.',
    ],
    classIntros: {
      survivor: ['Survival instincts screamed warnings', 'Fear was useful; panic was death'],
      investigator: ['Some truths extracted a terrible price', 'Knowledge was a weapon they couldn\'t set down'],
      occultist: ['The old texts had warned of this', 'Power and madness walked hand in hand'],
      default: ['They were in over their head', 'But there was no way out except through'],
    },
  },
  cyberpunk: {
    timeDescriptions: [
      'Neon bled into the perpetual rain, painting the night in fever dreams',
      'The city never slept, just shifted between different kinds of predators',
      'Advertisement holos screamed silent promises over the crowd',
      'Somewhere above the smog, stars existed. Nobody remembered anymore.',
    ],
    locationStarters: [
      'in the shadows between megacorp towers that blotted out the sky',
      'on streets that had forgotten what sunlight looked like',
      'in a coffin hotel room smaller than a grave and twice as cold',
      'at a meet spot that would exist for exactly twelve more minutes',
    ],
    sensoryDetails: [
      'The Net whispered temptations through their neural link',
      'Chrome gleamed where flesh used to be',
      'The air tasted like industry and broken dreams',
      'Data streams pulsed like electronic blood through the city\'s veins',
    ],
    immediateHooks: [
      'The job was supposed to be simple. They always were.',
      'Someone with very deep pockets wanted them dead. Or worse, employed.',
      'The encrypted file in their headware was worth more than their life.',
      'Corpo assassins don\'t miss. So why were they still breathing?',
    ],
    classIntros: {
      netrunner: ['The digital world was more real than meat-space', 'Black ICE was just another predator to outwit'],
      solo: ['Their body was a weapon, upgraded and lethal', 'Violence was just another business transaction'],
      techie: ['Every system had a backdoor', 'Hardware never betrayed you like people did'],
      fixer: ['Information was the only currency that mattered', 'Everyone owed them, or would soon'],
      default: ['The street had rules; learn them or die', 'Another day, another chance to get killed'],
    },
  },
  western: {
    timeDescriptions: [
      'The sun beat down mercilessly on the parched earth',
      'Dust devils danced on the horizon where the land met the burning sky',
      'Evening shadows stretched long across the desert floor',
      'A lonely wind carried the scent of sage and distant rain',
    ],
    locationStarters: [
      'in a town too stubborn to die and too mean to live easy',
      'on a trail that led to either fortune or a shallow grave',
      'at the edge of civilization, where law was just a suggestion',
      'in a land that broke the weak and tested the strong',
    ],
    sensoryDetails: [
      'The creak of leather and jingle of spurs marked their passage',
      'Heat shimmered off the ground in waves',
      'Somewhere, a vulture circled with patient interest',
      'The weight of iron on their hip was a familiar comfort',
    ],
    immediateHooks: [
      'The wanted poster had their face on it. The resemblance was unfortunate.',
      'Three men had tried to cheat them at cards. Two would recover.',
      'Revenge is a dish best served at gunpoint.',
      'The railroad was coming. Nothing would ever be the same.',
    ],
    classIntros: {
      gunslinger: ['Their hand never strayed far from their holster', 'Speed and accuracy—the only law that mattered'],
      sheriff: ['The badge weighed heavy, but the duty weighed heavier', 'Justice was in short supply out here'],
      outlaw: ['Freedom tasted like gunsmoke and regret', 'Every man had a price; they intended to collect'],
      default: ['The West was won by those too stubborn to quit', 'Another sunrise, another chance to make history'],
    },
  },
  war: {
    timeDescriptions: [
      'Artillery rumbled in the distance like an approaching storm',
      'Dawn broke gray and unwelcoming over the battlefield',
      'Night offered no comfort, only different dangers',
      'Time lost meaning between attacks; only survival mattered',
    ],
    locationStarters: [
      'in a foxhole that felt more like a grave each passing hour',
      'on ground that had been fought over so many times it forgot what peace meant',
      'behind lines that existed only on maps and in hope',
      'in a world reduced to mud, blood, and desperation',
    ],
    sensoryDetails: [
      'Smoke stung their eyes and coated their throat',
      'The ground trembled with distant impacts',
      'Letters from home felt like artifacts from another life',
      'The weight of duty pressed down like physical force',
    ],
    immediateHooks: [
      'Command wanted the impossible. As usual.',
      'The squad was down to half strength. Still had to push forward.',
      'Intelligence was wrong. They were always wrong.',
      'Survival felt like betrayal of those who hadn\'t.',
    ],
    classIntros: {
      medic: ['Every life saved was a victory against the darkness', 'Their hands had held too many dying soldiers'],
      sniper: ['Patience and precision—the sniper\'s creed', 'One shot, one life changed forever'],
      officer: ['Leadership was a weight that never lifted', 'Their decisions wrote history in blood'],
      default: ['They were a soldier. That was enough. That had to be enough.'],
    },
  },
  mystery: {
    timeDescriptions: [
      'Rain streaked the windows of the cramped office',
      'The city\'s nightlife hummed with secrets waiting to be uncovered',
      'Morning fog blurred the lines between truth and deception',
      'The clock ticked away seconds in a case running cold',
    ],
    locationStarters: [
      'in a city where everyone had something to hide',
      'at the scene of a crime that made less sense the longer they looked',
      'in a world of shadows and half-truths',
      'following a trail of breadcrumbs left by someone who wanted to be found',
    ],
    sensoryDetails: [
      'The scent of old bourbon and older mistakes hung in the air',
      'Evidence whispered contradictions',
      'Every alibi had holes; finding them was the job',
      'The truth was out there, buried under layers of lies',
    ],
    immediateHooks: [
      'The client was lying. They always were.',
      'Someone didn\'t want this case solved. That made it personal.',
      'The pieces didn\'t fit. Yet.',
      'A body had turned up in an impossible place.',
    ],
    classIntros: {
      journalist: ['The story was everything', 'Truth was a weapon they wielded without mercy'],
      enforcer: ['Some questions required physical punctuation', 'They got answers others couldn\'t'],
      default: ['Questions were their profession; answers their obsession', 'The game was afoot'],
    },
  },
  postapoc: {
    timeDescriptions: [
      'The sun rose red through the permanent haze',
      'Another day in the wasteland. Survival was victory.',
      'The rad-counter ticked its ominous rhythm',
      'Dusk brought new dangers; day brought different ones',
    ],
    locationStarters: [
      'in the ruins of a world that had forgotten its own name',
      'on roads that led to places that no longer existed',
      'in the skeleton of civilization, where survivors built new hope',
      'at the edge of a dead zone that marked the old world\'s grave',
    ],
    sensoryDetails: [
      'Rust and ash flavored every breath',
      'The wind carried whispers of the world that was',
      'Scavenged gear was worth more than gold',
      'Every sound could mean salvation or death',
    ],
    immediateHooks: [
      'Clean water was three days behind them. Something had to give.',
      'Raiders had taken the settlement. Only survivors could take it back.',
      'The old bunker\'s signal meant either sanctuary or trap.',
      'The mutation was spreading. Time was running out.',
    ],
    classIntros: {
      scavenger: ['Trash was treasure if you knew where to look', 'Every ruin held possibilities'],
      wastelander: ['The old world was stories; this one was survival', 'Hardship had forged them into something new'],
      trader: ['Goods meant power; routes meant life', 'Trust was rare but necessary'],
      default: ['Every sunrise was borrowed time', 'The wasteland had rules, written in blood'],
    },
  },
  pirate: {
    timeDescriptions: [
      'Salt spray kissed their face as the ship crested another wave',
      'The horizon burned with the promise of treasure and treachery',
      'Stars wheeled overhead, the only map that never lied',
      'Storm clouds gathered on the edge of the world',
    ],
    locationStarters: [
      'on a ship that had seen more ports than any map showed',
      'in waters where legends drowned and fortunes were made',
      'at anchor in a bay that official charts didn\'t acknowledge',
      'between the devil and the deep blue sea',
    ],
    sensoryDetails: [
      'The creak of rigging sang its eternal song',
      'Salt and tar and adventure perfumed the air',
      'The deck rolled beneath their feet like a living thing',
      'Canvas snapped in the wind, hungry for horizon',
    ],
    immediateHooks: [
      'The map in their possession had cost three lives already.',
      'The navy was hunting them. The navy was always hunting them.',
      'Treasure awaited, but so did a curse.',
      'Mutiny whispered through the crew like a disease.',
    ],
    classIntros: {
      captain: ['The sea was their kingdom, the ship their throne', 'Command required steel wrapped in charisma'],
      swashbuckler: ['Grace and steel danced together', 'Every duel was a conversation'],
      gunner: ['Powder and shot spoke louder than words', 'The cannons were their instruments'],
      default: ['Freedom was worth any price', 'The sea called to those who couldn\'t be tamed'],
    },
  },
  cosmic_horror: {
    timeDescriptions: [
      'Time felt wrong here, stretched and compressed simultaneously',
      'The stars were not quite where they should be',
      'Reality itself seemed to hold its breath',
      'The hour was late in more ways than one',
    ],
    locationStarters: [
      'at the threshold of knowledge better left undiscovered',
      'in a place that existed between what is and what should not be',
      'where the thin veneer of reality showed cracks',
      'in a town that had traded its soul for something worse',
    ],
    sensoryDetails: [
      'Geometry refused to behave properly in peripheral vision',
      'The air carried whispers in languages older than humanity',
      'Something vast and patient watched from beyond',
      'Sanity felt like a candle in a hurricane',
    ],
    immediateHooks: [
      'The dreams had shown them what slumbered beneath. Now they had to unsee it.',
      'The cult\'s ritual had been interrupted. Not stopped.',
      'Something had followed them from that place.',
      'The book\'s pages turned on their own, eager to share secrets.',
    ],
    classIntros: {
      investigator: ['Some mysteries should stay unsolved', 'Knowledge and madness walked hand in hand'],
      professor: ['Academic detachment was crumbling', 'Theory and terror merged into one'],
      cultist: ['They had escaped the cult but not the truth', 'Some doors cannot be closed once opened'],
      default: ['Ignorance had been bliss', 'Now only understanding—and survival—remained'],
    },
  },
  modern_life: {
    timeDescriptions: [
      'Morning traffic hummed its familiar symphony',
      'The city\'s rhythm pulsed with a million lives in motion',
      'Coffee steam curled in the early light',
      'Another day, another chance to build something real',
    ],
    locationStarters: [
      'in a city that never stopped moving',
      'at a crossroads between the life they had and the life they wanted',
      'in a world of opportunity and overwhelming choice',
      'where dreams and reality negotiated constantly',
    ],
    sensoryDetails: [
      'The city hummed with possibility and pressure',
      'Phone notifications created a digital heartbeat',
      'Success and struggle walked side by side',
      'Every stranger was a potential connection',
    ],
    immediateHooks: [
      'The opportunity they\'d been waiting for had finally arrived.',
      'Everything was about to change—for better or worse.',
      'A phone call would redefine everything they thought they knew.',
      'Sometimes the smallest decisions have the biggest consequences.',
    ],
    classIntros: {
      professional: ['Ambition and ability—their twin engines', 'The corporate ladder was just another mountain to climb'],
      student: ['The future was unwritten', 'Learning was a journey, not a destination'],
      artist: ['Creativity demanded sacrifice', 'Their vision was their currency'],
      default: ['Life was what they made of it', 'Today was the first day of something new'],
    },
  },
  steampunk: {
    timeDescriptions: [
      'Steam hissed from brass valves as the great clock struck the hour',
      'Copper-tinted smog filtered the gaslight into amber dreams',
      'Gears ground their eternal symphony in the factory district',
      'The airship docks bustled with the commerce of empires',
    ],
    locationStarters: [
      'in a city of iron and ambition where progress never rested',
      'among the clanking machinery of the Industrial Revolution\'s apex',
      'in the shadow of great clockwork towers that scraped the sooty sky',
      'on cobblestones worn smooth by generations of brass automatons',
    ],
    sensoryDetails: [
      'The scent of coal smoke and machine oil perfumed every breath',
      'Pneumatic tubes whistled overhead, carrying messages across districts',
      'Steam-powered carriages rumbled past, their pistons a mechanical heartbeat',
      'Brass and copper gleamed through the perpetual haze',
    ],
    immediateHooks: [
      'The mechanical heart in their chest ticked slightly faster—danger was near.',
      'The encrypted punch cards had been worth killing for. Someone had.',
      'The Artificers Guild wanted answers. Or silence. Whichever came first.',
      'An automaton uprising was brewing in the lower factories.',
    ],
    classIntros: {
      inventor: ['Gears and imagination—their only true currency', 'Every problem had a mechanical solution waiting to be discovered'],
      aristocrat: ['Breeding and influence opened doors that money couldn\'t', 'The game of society was played with sharper blades than steel'],
      airship_captain: ['The sky was their ocean, the clouds their domain', 'Freedom had an altitude requirement'],
      mechanist: ['Metal spoke to them in ways flesh never could', 'Every machine had a soul, if you knew where to look'],
      default: ['The age of steam waited for no one', 'Progress ground forward, and they with it'],
    },
  },
  noir: {
    timeDescriptions: [
      'Rain streaked the neon signs into bleeding watercolors of vice',
      'The city at 3 AM belonged to the desperate and the damned',
      'Shadows stretched long under the single working streetlamp',
      'Night had a way of revealing what daylight kept hidden',
    ],
    locationStarters: [
      'in a city that had seen better decades and worse crimes',
      'on streets that ran with rainwater and old sins',
      'in the kind of neighborhood where questions got you hurt',
      'at the edge of respectability, where the real business happened',
    ],
    sensoryDetails: [
      'Cigarette smoke curled like accusations in the still air',
      'Jazz leaked from a basement club, mournful and knowing',
      'The click of heels on wet pavement echoed off empty windows',
      'Cheap whiskey and expensive regrets—the cologne of the district',
    ],
    immediateHooks: [
      'The dame walked in with legs up to here and a lie on her lips.',
      'The corpse was still warm. So was the trail.',
      'Someone was setting them up. The question was who, and more importantly, why.',
      'The photograph showed something that should have stayed hidden.',
    ],
    classIntros: {
      private_eye: ['Truth was their business, and business was lousy', 'Everyone lied; it was just a matter of finding the lie that mattered'],
      femme_fatale: ['Beauty was a weapon; so was intellect', 'They\'d learned early that the world wasn\'t kind to the powerless'],
      cop: ['The badge meant something once. Maybe it still could.', 'Justice and the law weren\'t always the same thing'],
      default: ['The city had chewed up better people than them', 'But they were still standing. That counted for something.'],
    },
  },
  survival: {
    timeDescriptions: [
      'The sun was merciless, baking the cracked earth without sympathy',
      'Night brought cold that seeped into bones already exhausted',
      'Storm clouds gathered on the horizon, promising violence',
      'Dawn broke gray and uncertain over hostile terrain',
    ],
    locationStarters: [
      'in a wilderness that didn\'t care if they lived or died',
      'far from civilization, where nature wrote the only laws',
      'on terrain that tested every skill they\'d ever learned',
      'where the wrong decision meant a slow death',
    ],
    sensoryDetails: [
      'Hunger was a constant companion, gnawing at reason',
      'Every sound could mean predator or prey—vital to know which',
      'Water sources were worth more than gold here',
      'The body screamed protests that the mind had to override',
    ],
    immediateHooks: [
      'The supplies were running low. Something had to change.',
      'Tracks in the mud—something was hunting them.',
      'Shelter was three hours away. The storm would arrive in two.',
      'The signal fire had been spotted. Whether by rescuers or worse was yet unknown.',
    ],
    classIntros: {
      survivalist: ['Nature was a harsh teacher, but fair', 'Every skill had been earned through suffering'],
      hunter: ['The land provided, if you knew how to ask', 'Patience and precision kept bellies full'],
      medic: ['Keeping people alive was harder without walls and supplies', 'Improvisation was as vital as any medical training'],
      default: ['Survival wasn\'t about thriving—just one more day', 'The wild tested, and they would not be found wanting'],
    },
  },
};

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export interface OpeningGeneratorOptions {
  character: RPGCharacter;
  genre: GameGenre;
  scenario: string;
  mood?: string;  // Optional mood from emotion picker
  secondaryGenres?: Array<{ genreId: string; blendStrength: number }>;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatAppearanceSnippet(appearance: CharacterContext['appearance']): string {
  if (!appearance) return '';
  
  const parts: string[] = [];
  
  if (appearance.build) {
    const buildDescriptors: Record<string, string> = {
      slim: 'lean and wiry',
      average: 'of average build',
      athletic: 'athletic and fit',
      muscular: 'powerfully built',
      heavy: 'broad and solid',
    };
    parts.push(buildDescriptors[appearance.build] || '');
  }
  
  if (appearance.hairColor && appearance.hairStyle) {
    parts.push(`${appearance.hairColor} hair worn ${appearance.hairStyle}`);
  } else if (appearance.hairColor) {
    parts.push(`${appearance.hairColor} hair`);
  }
  
  if (appearance.eyeColor) {
    parts.push(`${appearance.eyeColor} eyes`);
  }
  
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return '';
  if (filtered.length === 1) return filtered[0];
  if (filtered.length === 2) return `${filtered[0]} with ${filtered[1]}`;
  return `${filtered.slice(0, -1).join(', ')}, and ${filtered[filtered.length - 1]}`;
}

function getMoodInfluence(mood?: string): { internal: string; external: string } {
  const moodEffects: Record<string, { internal: string; external: string }> = {
    happy: { internal: 'A warmth settled in their chest', external: 'their expression light despite everything' },
    sad: { internal: 'A familiar heaviness weighed on them', external: 'something melancholy in their gaze' },
    mad: { internal: 'Anger simmered just beneath the surface', external: 'jaw tight with controlled fury' },
    anxious: { internal: 'Unease coiled in their stomach', external: 'hands that couldn\'t quite stay still' },
    confident: { internal: 'Self-assurance flowed through their veins', external: 'standing tall with earned pride' },
    neutral: { internal: 'Their thoughts remained steady', external: 'face a mask of calm focus' },
    focused: { internal: 'Every sense sharpened to a point', external: 'eyes that missed nothing' },
    tired: { internal: 'Exhaustion tugged at every muscle', external: 'the weight of too many sleepless nights' },
  };
  
  return moodEffects[mood || 'neutral'] || moodEffects.neutral;
}

export function generateImmersiveOpening(options: OpeningGeneratorOptions): string {
  const { character, genre, scenario, mood, secondaryGenres } = options;
  
  // Extract character context
  const charContext = extractCharacterContext(character, genre);
  
  // Get genre atmosphere
  const atmosphere = GENRE_ATMOSPHERES[genre] || GENRE_ATMOSPHERES.fantasy;
  
  // Get mood influence
  const moodInfluence = getMoodInfluence(mood);
  
  // Get class intro
  const classIntros = atmosphere.classIntros[charContext.classId] || atmosphere.classIntros.default || ['They were ready for what came next'];
  
  // Get trait action
  const traitAction = TRAIT_ACTIONS[charContext.primaryTrait.toLowerCase()]?.[0] 
    || 'steadied themselves for what lay ahead';
  
  // Build appearance description
  const appearanceSnippet = formatAppearanceSnippet(charContext.appearance);
  
  // Get stat-based descriptor
  const statDescriptor = STAT_DESCRIPTORS[charContext.highestStat]?.high || '';
  
  // Pick random atmospheric elements
  const timeDesc = pickRandom(atmosphere.timeDescriptions);
  const locationStart = pickRandom(atmosphere.locationStarters);
  const sensoryDetail = pickRandom(atmosphere.sensoryDetails);
  const immediateHook = pickRandom(atmosphere.immediateHooks);
  const classIntro = pickRandom(classIntros);
  
  // Build the opening narrative
  const paragraphs: string[] = [];
  
  // Paragraph 1: Setting and character introduction
  let intro = `${timeDesc}. ${charContext.name}`;
  if (appearanceSnippet) {
    intro += `, ${appearanceSnippet},`;
  }
  intro += ` stood ${locationStart}. ${sensoryDetail}.`;
  paragraphs.push(intro);
  
  // Paragraph 2: Character identity and mood
  let characterPara = `${classIntro}. `;
  if (statDescriptor) {
    characterPara += `Their ${statDescriptor} spoke of ${charContext.className.toLowerCase()}'s discipline. `;
  }
  characterPara += `${moodInfluence.internal}, ${moodInfluence.external}. ${charContext.name} ${traitAction}.`;
  paragraphs.push(characterPara);
  
  // Paragraph 3: Equipment and hook
  let equipPara = '';
  if (charContext.primaryWeapon) {
    equipPara += `The familiar weight of their ${charContext.primaryWeapon} offered some comfort. `;
  }
  if (charContext.inventory.length > 3) {
    const otherItems = charContext.inventory.filter(i => i !== charContext.primaryWeapon).slice(0, 2);
    equipPara += `A ${otherItems.join(' and ')} completed their essential gear. `;
  }
  equipPara += immediateHook;
  paragraphs.push(equipPara);
  
  // Paragraph 4: Scenario hook integration (parse key words from scenario)
  const scenarioWords = scenario.toLowerCase();
  let scenarioHook = '';
  
  if (scenarioWords.includes('war') || scenarioWords.includes('battle') || scenarioWords.includes('army')) {
    scenarioHook = 'The conflict that had torn apart so many lives now demanded their attention. There was no turning back.';
  } else if (scenarioWords.includes('mystery') || scenarioWords.includes('disappear') || scenarioWords.includes('murder')) {
    scenarioHook = 'Questions hung in the air, unanswered and urgent. The truth was out there, waiting to be found.';
  } else if (scenarioWords.includes('treasure') || scenarioWords.includes('quest') || scenarioWords.includes('find')) {
    scenarioHook = 'The prize they sought had eluded others before them. Perhaps they would be different.';
  } else if (scenarioWords.includes('escape') || scenarioWords.includes('survive') || scenarioWords.includes('danger')) {
    scenarioHook = 'Survival demanded action. Every moment of hesitation was a gamble with death.';
  } else if (scenarioWords.includes('love') || scenarioWords.includes('heart') || scenarioWords.includes('romance')) {
    scenarioHook = 'The heart wanted what it wanted. Logic had little say in the matter.';
  } else if (scenarioWords.includes('revenge') || scenarioWords.includes('vengeance') || scenarioWords.includes('justice')) {
    scenarioHook = 'The path of vengeance stretched before them, paved with both purpose and peril.';
  } else if (scenarioWords.includes('heist') || scenarioWords.includes('steal') || scenarioWords.includes('rob')) {
    scenarioHook = 'The plan was set. All that remained was execution—and escape.';
  } else if (scenarioWords.includes('monster') || scenarioWords.includes('creature') || scenarioWords.includes('beast')) {
    scenarioHook = 'Something unnatural had taken notice. Hunter and hunted were about to meet.';
  } else if (scenarioWords.includes('betray') || scenarioWords.includes('trust') || scenarioWords.includes('ally')) {
    scenarioHook = 'Trust had been broken. The question was whether it could be rebuilt—or revenged.';
  } else if (scenarioWords.includes('politic') || scenarioWords.includes('power') || scenarioWords.includes('throne')) {
    scenarioHook = 'The game of power had new pieces on the board. The stakes were everything.';
  } else if (scenarioWords.includes('curse') || scenarioWords.includes('magic') || scenarioWords.includes('spell')) {
    scenarioHook = 'Ancient forces were at play, and they cared nothing for mortal concerns.';
  } else if (scenarioWords.includes('rescue') || scenarioWords.includes('save') || scenarioWords.includes('protect')) {
    scenarioHook = 'Someone needed saving. Failure was not an option they could live with.';
  } else if (scenarioWords.includes('explore') || scenarioWords.includes('discover') || scenarioWords.includes('unknown')) {
    scenarioHook = 'The unexplored beckoned with promises of wonder and peril in equal measure.';
  } else if (scenarioWords.includes('trade') || scenarioWords.includes('merchant') || scenarioWords.includes('deal')) {
    scenarioHook = 'Business was about to be conducted. Whether fairly remained to be seen.';
  } else {
    scenarioHook = 'Whatever came next, they would face it. They had come too far to stop now.';
  }
  paragraphs.push(scenarioHook);
  
  // Optional: Add NPC flavor with accent if scenario hints at a meeting
  if (scenarioWords.includes('meet') || scenarioWords.includes('contact') || scenarioWords.includes('informant') || scenarioWords.includes('stranger')) {
    const accentKeys = Object.keys(ACCENT_MODIFIERS);
    const randomAccent = accentKeys[Math.floor(Math.random() * accentKeys.length)];
    const accent = ACCENT_MODIFIERS[randomAccent];
    paragraphs.push(`A figure emerged from the shadows. "${accent.greeting}," they ${accent.flavor}. Someone who might have answers—or might bring more trouble.`);
  }
  
  // Final paragraph: Ready for player input
  paragraphs.push('The moment stretched, pregnant with possibility. What happened next was up to them.');
  
  return paragraphs.join('\n\n');
}

// ============================================================================
// QUICK FALLBACK (for when we need something fast)
// ============================================================================

export function getQuickGenreFallback(genre: GameGenre, characterName: string): string {
  const atmosphere = GENRE_ATMOSPHERES[genre] || GENRE_ATMOSPHERES.fantasy;
  const timeDesc = pickRandom(atmosphere.timeDescriptions);
  const locationStart = pickRandom(atmosphere.locationStarters);
  const sensoryDetail = pickRandom(atmosphere.sensoryDetails);
  const hook = pickRandom(atmosphere.immediateHooks);
  
  return `${timeDesc}. ${characterName} found themselves ${locationStart}. ${sensoryDetail}.\n\n${hook}\n\nWhat happens next is up to you.`;
}
