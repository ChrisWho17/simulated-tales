import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Shirt, Scissors, Palette, Sparkles, Syringe, Crown, Heart, Flame, Zap, Wand2, Sword, Skull, Rocket, Eye, Moon, Shield, User, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  TieredAppearance,
  PIERCING_OPTIONS, TATTOO_OPTIONS, TATTOO_STYLE_OPTIONS,
  CLOTHING_STYLE_OPTIONS, CLOTHING_DETAIL_OPTIONS,
  SCAR_OPTIONS, PROSTHETIC_OPTIONS, IMPLANT_OPTIONS, MUTATION_OPTIONS,
} from '@/types/characterCreation';

// Favorites storage key
const SLASH_FAVORITES_KEY = 'untold_slash_favorites';

// Get favorites from localStorage
const getFavorites = (): string[] => {
  try {
    const stored = localStorage.getItem(SLASH_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save favorites to localStorage
const saveFavorites = (favorites: string[]) => {
  localStorage.setItem(SLASH_FAVORITES_KEY, JSON.stringify(favorites));
};

// Slash command definitions - categories of presets
export interface SlashCommand {
  command: string;
  label: string;
  category: 'personality' | 'genre' | 'clothing' | 'armor' | 'stance' | 'pose' | 'style';
  keywords: string;
  description: string;
  color: string;
  icon: typeof Crown;
}

// All slash commands organized by category
export const SLASH_COMMANDS: SlashCommand[] = [
  // ===== PERSONALITY PRESETS =====
  { command: 'goddess', label: 'Goddess', category: 'personality', keywords: 'regal, divine, elegant, flowing robes, ethereal glow, majestic, graceful posture, radiant, celestial beauty', description: 'Divine elegance', color: 'from-amber-500 to-yellow-400', icon: Crown },
  { command: 'modest', label: 'Modest', category: 'personality', keywords: 'modest, conservative, covered, reserved, professional, dignified, proper posture, respectable, traditional', description: 'Reserved dignity', color: 'from-blue-400 to-cyan-400', icon: Heart },
  { command: 'neutral', label: 'Neutral', category: 'personality', keywords: 'natural, casual, relaxed, comfortable, everyday, practical, neutral posture, balanced', description: 'Everyday look', color: 'from-gray-400 to-slate-400', icon: Zap },
  { command: 'flirty', label: 'Flirty', category: 'personality', keywords: 'playful, charming, confident, stylish, form-fitting, flattering, coy smile, alluring eyes, fashionable', description: 'Playful charm', color: 'from-pink-400 to-rose-400', icon: Sparkles },
  { command: 'provocative', label: 'Provocative', category: 'personality', keywords: 'bold, daring, confident, striking, dramatic, attention-grabbing, fierce pose, intense gaze, powerful', description: 'Bold presence', color: 'from-orange-500 to-red-500', icon: Flame },
  { command: 'alluring', label: 'Alluring', category: 'personality', keywords: 'captivating, magnetic, enticing, sultry gaze, confident pose, passionate, enchanting presence', description: 'Magnetic aura', color: 'from-purple-500 to-pink-500', icon: Flame },
  { command: 'mysterious', label: 'Mysterious', category: 'personality', keywords: 'enigmatic, hooded, obscured features, cryptic smile, shadowy presence, hidden depths, secretive aura', description: 'Enigmatic soul', color: 'from-indigo-600 to-purple-800', icon: Eye },
  { command: 'fierce', label: 'Fierce', category: 'personality', keywords: 'intense gaze, battle-hardened, scarred warrior, unyielding determination, predatory presence, dangerous beauty', description: 'Untamed power', color: 'from-red-700 to-orange-600', icon: Flame },
  { command: 'regal', label: 'Regal', category: 'personality', keywords: 'noble bearing, commanding presence, aristocratic elegance, imperious, authoritative stance, royal dignity', description: 'Noble authority', color: 'from-yellow-600 to-amber-500', icon: Crown },
  { command: 'stoic', label: 'Stoic', category: 'personality', keywords: 'composed, unreadable expression, disciplined, emotionally controlled, calm under pressure, resolute', description: 'Unshakable calm', color: 'from-slate-500 to-gray-600', icon: Shield },
  { command: 'wild', label: 'Wild', category: 'personality', keywords: 'untamed, feral beauty, primal energy, windswept, nature-touched, savage grace, animalistic', description: 'Primal nature', color: 'from-green-600 to-emerald-700', icon: Flame },
  { command: 'haunted', label: 'Haunted', category: 'personality', keywords: 'melancholic, hollow eyes, weary, battle-worn, traumatized expression, distant gaze, ghostly pallor', description: 'Troubled soul', color: 'from-gray-600 to-slate-700', icon: Moon },
  { command: 'serene', label: 'Serene', category: 'personality', keywords: 'peaceful, tranquil expression, inner calm, meditative, gentle wisdom, quiet strength, harmonious', description: 'Inner peace', color: 'from-cyan-400 to-blue-400', icon: Heart },
  { command: 'cunning', label: 'Cunning', category: 'personality', keywords: 'calculating gaze, sly smile, shrewd intelligence, scheming, clever expression, knowing look', description: 'Sharp wit', color: 'from-emerald-600 to-teal-600', icon: Eye },
  
  // ===== GENRE PRESETS =====
  { command: 'fantasy', label: 'Fantasy', category: 'genre', keywords: 'mystical, enchanted, medieval fantasy, arcane details, magical aura, flowing cape, elven inspired, ornate jewelry', description: 'High fantasy style', color: 'from-purple-600 to-indigo-500', icon: Wand2 },
  { command: 'cyberpunk', label: 'Cyberpunk', category: 'genre', keywords: 'neon accents, chrome implants, cybernetic enhancements, techwear, holographic details, urban dystopian, LED highlights', description: 'Neon future', color: 'from-cyan-500 to-purple-600', icon: Zap },
  { command: 'noir', label: 'Noir', category: 'genre', keywords: 'mysterious, shadowy, dramatic lighting, vintage glamour, smoky atmosphere, classic elegance, dark sophistication', description: 'Dark mystery', color: 'from-gray-700 to-gray-900', icon: Skull },
  { command: 'scifi', label: 'Sci-Fi', category: 'genre', keywords: 'futuristic uniform, sleek design, space-age materials, clean lines, holographic badges, practical elegance', description: 'Space age', color: 'from-blue-500 to-cyan-400', icon: Rocket },
  { command: 'western', label: 'Western', category: 'genre', keywords: 'rugged, frontier style, leather accents, dusty worn look, cowboy aesthetic, weathered details, sun-kissed', description: 'Frontier style', color: 'from-amber-600 to-orange-500', icon: Sword },
  { command: 'horror', label: 'Horror', category: 'genre', keywords: 'eerie, unsettling beauty, pale complexion, dark circles, haunting gaze, gothic elements, supernatural aura', description: 'Haunting beauty', color: 'from-red-900 to-gray-900', icon: Skull },
  { command: 'steampunk', label: 'Steampunk', category: 'genre', keywords: 'brass gears, copper accents, Victorian industrial, goggles, clockwork details, leather straps, steam-powered', description: 'Victorian tech', color: 'from-amber-700 to-stone-600', icon: Wand2 },
  
  // ===== CLOTHING STYLE PRESETS =====
  { command: 'elegant', label: 'Elegant', category: 'clothing', keywords: 'elegant gown, flowing fabric, luxurious silk, refined tailoring, graceful draping, sophisticated style', description: 'Refined elegance', color: 'from-rose-400 to-purple-400', icon: Shirt },
  { command: 'casual', label: 'Casual', category: 'clothing', keywords: 'casual wear, comfortable clothing, relaxed fit, everyday style, simple but stylish, natural look', description: 'Relaxed style', color: 'from-green-400 to-teal-400', icon: Shirt },
  { command: 'formal', label: 'Formal', category: 'clothing', keywords: 'formal attire, business professional, sharp tailoring, pressed suit, polished appearance, executive style', description: 'Professional look', color: 'from-gray-600 to-slate-700', icon: Shirt },
  { command: 'revealing', label: 'Revealing', category: 'clothing', keywords: 'revealing outfit, form-fitting, low-cut, bare midriff, tight clothing, showing skin, daring neckline', description: 'Daring style', color: 'from-red-500 to-pink-500', icon: Sparkles },
  { command: 'tactical', label: 'Tactical', category: 'clothing', keywords: 'tactical gear, military style, utility vest, cargo pockets, combat boots, practical equipment', description: 'Combat ready', color: 'from-green-700 to-stone-600', icon: Sword },
  { command: 'royal', label: 'Royal', category: 'clothing', keywords: 'royal garments, crown, regal cape, velvet robes, gold trim, jeweled accessories, throne-worthy', description: 'Regal attire', color: 'from-amber-400 to-yellow-300', icon: Crown },
  { command: 'skimpy', label: 'Skimpy', category: 'clothing', keywords: 'minimal coverage, bikini armor, strappy design, exposed skin, decorative only, maximum skin visibility', description: 'Minimal attire', color: 'from-pink-500 to-rose-500', icon: Sparkles },
  { command: 'robe', label: 'Robed', category: 'clothing', keywords: 'flowing robes, monk attire, wizard robe, hooded cloak, mystical garments, loose draping fabric', description: 'Mystic robes', color: 'from-indigo-500 to-purple-600', icon: Wand2 },
  
  // ===== ARMOR PRESETS =====
  { command: 'lightarmor', label: 'Light Armor', category: 'armor', keywords: 'leather armor, agile protection, scout gear, flexible padding, ranger outfit, mobile warrior, minimal metal', description: 'Agile protection', color: 'from-amber-500 to-yellow-600', icon: Shield },
  { command: 'chainmail', label: 'Chainmail', category: 'armor', keywords: 'chain armor, mail shirt, medieval soldier, linked metal rings, gambeson, practical protection', description: 'Classic mail', color: 'from-gray-400 to-slate-500', icon: Shield },
  { command: 'platearmor', label: 'Plate Armor', category: 'armor', keywords: 'full plate armor, knight in shining armor, polished steel, articulated plates, gorget, gauntlets, greaves, pauldrons', description: 'Knight plate', color: 'from-slate-400 to-gray-500', icon: Shield },
  { command: 'heavyarmor', label: 'Heavy Armor', category: 'armor', keywords: 'massive plate armor, full body coverage, thick steel plates, imposing silhouette, reinforced joints, helmet with visor, no exposed skin, tank-like protection', description: 'Tank protection', color: 'from-gray-600 to-slate-700', icon: Shield },
  { command: 'juggernaut', label: 'Juggernaut', category: 'armor', keywords: 'walking fortress, massive hulking armor, fully enclosed suit, impenetrable plates, towering presence, unstoppable tank, siege armor, no visible skin whatsoever, mechanical joints, walking weapon', description: 'Living fortress', color: 'from-slate-700 to-gray-800', icon: Shield },
  { command: 'powerarmor', label: 'Power Armor', category: 'armor', keywords: 'exosuit, powered exoskeleton, futuristic heavy armor, hydraulic joints, fully sealed suit, HUD visor, bulky mechanical frame, enhanced strength', description: 'Mech suit', color: 'from-blue-700 to-cyan-600', icon: Shield },
  { command: 'darkknight', label: 'Dark Knight', category: 'armor', keywords: 'black plate armor, intimidating, spiked pauldrons, demonic aesthetics, corrupted metal, evil knight, menacing helmet, dark steel, villain armor', description: 'Evil knight', color: 'from-gray-900 to-purple-900', icon: Sword },
  { command: 'paladin', label: 'Paladin', category: 'armor', keywords: 'holy armor, white and gold plate, divine symbols, radiant, blessed steel, crusader, ornate engravings, sacred warrior, full coverage, glowing runes', description: 'Holy warrior', color: 'from-yellow-400 to-amber-300', icon: Shield },
  { command: 'dreadnought', label: 'Dreadnought', category: 'armor', keywords: 'oversized armor plating, walking tank, massive shoulder guards, completely encased, industrial war machine, zero mobility zero exposure, fortress body', description: 'War machine', color: 'from-stone-700 to-gray-900', icon: Shield },
  
  // ===== STANCE PRESETS =====
  { command: 'standing', label: 'Standing', category: 'stance', keywords: 'upright stance, feet planted, standing tall, vertical posture, balanced weight, grounded position', description: 'Upright pose', color: 'from-blue-500 to-indigo-500', icon: User },
  { command: 'sitting', label: 'Sitting', category: 'stance', keywords: 'seated pose, sitting down, relaxed sitting, chair pose, bench seated, weight resting', description: 'Seated pose', color: 'from-teal-500 to-cyan-500', icon: User },
  { command: 'kneeling', label: 'Kneeling', category: 'stance', keywords: 'both knees down, kneeling position, prayer stance, genuflecting, humble posture, lowered stance', description: 'Both knees down', color: 'from-purple-500 to-violet-500', icon: User },
  { command: 'oneknee', label: 'One Knee', category: 'stance', keywords: 'one knee down, proposing stance, knight kneeling, heroic kneel, reverent pose, tactical kneel', description: 'Single knee', color: 'from-amber-500 to-orange-500', icon: User },
  { command: 'laying', label: 'Laying Down', category: 'stance', keywords: 'lying down, reclined position, horizontal pose, resting, sprawled, lounging, supine', description: 'Reclined pose', color: 'from-rose-500 to-pink-500', icon: User },
  { command: 'crouching', label: 'Crouching', category: 'stance', keywords: 'crouched low, squatting, ready to spring, coiled stance, low profile, stealth crouch', description: 'Low crouch', color: 'from-green-600 to-emerald-600', icon: User },
  { command: 'leaning', label: 'Leaning', category: 'stance', keywords: 'leaning against wall, casual lean, weight shifted, relaxed lean, slouched against surface, nonchalant', description: 'Casual lean', color: 'from-slate-500 to-gray-500', icon: User },
  
  // ===== POSE PRESETS =====
  { command: 'confident', label: 'Confident', category: 'pose', keywords: 'confident stance, hands on hips, head held high, powerful pose, assertive posture, commanding presence', description: 'Power pose', color: 'from-orange-400 to-amber-400', icon: Zap },
  { command: 'relaxed', label: 'Relaxed', category: 'pose', keywords: 'relaxed pose, leaning casually, easy smile, comfortable stance, laid-back posture, at ease', description: 'Easy stance', color: 'from-teal-400 to-cyan-400', icon: Heart },
  { command: 'action', label: 'Action', category: 'pose', keywords: 'dynamic pose, mid-action, battle stance, movement blur, intense focus, ready to strike', description: 'Dynamic action', color: 'from-red-500 to-orange-500', icon: Sword },
  { command: 'dramatic', label: 'Dramatic', category: 'pose', keywords: 'dramatic pose, theatrical, grand gesture, sweeping movement, intense emotion, storytelling pose', description: 'Theatrical', color: 'from-purple-600 to-red-600', icon: Flame },
  
  // ===== BLENDED STYLE PRESETS =====
  { command: 'darkfantasy', label: 'Dark Fantasy', category: 'style', keywords: 'dark fantasy, corrupted elegance, shadowy magic, twisted beauty, ominous glow, cursed aesthetic', description: 'Corrupted magic', color: 'from-purple-900 to-gray-900', icon: Skull },
  { command: 'techfantasy', label: 'Tech Fantasy', category: 'style', keywords: 'magitech, arcane circuits, glowing runes on chrome, magical cybernetics, enchanted technology', description: 'Magic meets tech', color: 'from-cyan-500 to-purple-500', icon: Wand2 },
  { command: 'postapoc', label: 'Post-Apocalyptic', category: 'style', keywords: 'wasteland survivor, scavenged gear, weathered look, survival aesthetic, rugged and worn, makeshift repairs', description: 'Wasteland style', color: 'from-stone-600 to-amber-700', icon: Skull },
  { command: 'gothic', label: 'Gothic', category: 'style', keywords: 'gothic beauty, dark romantic, Victorian elegance, lace and velvet, pale complexion, dramatic dark makeup', description: 'Dark romance', color: 'from-purple-800 to-gray-900', icon: Heart },
  { command: 'grimdark', label: 'Grimdark', category: 'style', keywords: 'grimdark aesthetic, brutal world, hopeless beauty, war-torn, gritty realism, harsh lighting, survival horror', description: 'Brutal reality', color: 'from-gray-800 to-red-900', icon: Skull },
];
// Genre-specific keyword enhancements that modify presets based on current genre
export const GENRE_KEYWORD_ENHANCEMENTS: Record<string, Record<string, string>> = {
  fantasy: {
    goddess: 'divine elven queen, mystical crown, ethereal glow, flowing enchanted robes, magical aura',
    fierce: 'battle-hardened warrior, arcane scars, enchanted blade wielder, glowing war paint',
    regal: 'high elf nobility, ornate magical jewelry, ancient bloodline elegance, throne of the fae',
    mysterious: 'hooded mage, arcane secrets, cryptic runic tattoos, shadowy familiar',
    elegant: 'silk elven gown, moonlight threads, starlit fabric, enchanted jewelry',
    tactical: 'ranger leather armor, elven scout gear, forest camouflage, quiver and bow',
    heavyarmor: 'dwarven forged plate, runic engravings, mithril reinforcement, ancestral crest',
    juggernaut: 'golem-like enchanted armor, rune-covered plates, magical fortress, impenetrable ward',
    paladin: 'holy crusader plate, divine light emanating, blessed steel, angelic motifs',
    darkknight: 'cursed black armor, soul-draining aura, demonic helmet, shadow magic infused',
  },
  cyberpunk: {
    goddess: 'chrome goddess, holographic crown, neon halo effect, synthetic divine beauty',
    fierce: 'street samurai, combat cyberware, LED-lit scars, targeting implant glowing',
    regal: 'corporate elite, designer cyberware, platinum chrome accents, executive power suit',
    mysterious: 'masked netrunner, encrypted identity, holographic disguise, shadow operative',
    elegant: 'haute couture techwear, fiber optic dress, LED jewelry, designer implants',
    tactical: 'military-grade cyberware, urban combat gear, smart weapon interface',
    heavyarmor: 'industrial exoframe, corporate security rig, ballistic plating, servo motors',
    juggernaut: 'full-body combat chassis, tank-class exoskeleton, integrated weapon systems',
    powerarmor: 'militech power suit, neural-linked exoframe, HUD visor, hydraulic limbs',
    darkknight: 'blackout stealth armor, EMP-shielded, menacing LED eyes, shadow corporation',
  },
  scifi: {
    goddess: 'space empress, zero-gravity flowing gown, stellar crown, cosmic radiance',
    fierce: 'battle-scarred starship captain, plasma burn marks, commanding presence',
    regal: 'galactic royalty, anti-gravity throne, quantum-threaded regalia',
    mysterious: 'enigmatic alien hybrid, unknown species traits, psychic aura',
    elegant: 'diplomatic formal wear, crystalline accessories, space-age fashion',
    tactical: 'federation uniform, utility belt, phaser holster, communicator badge',
    heavyarmor: 'planetary assault armor, void-sealed, magnetic boots, oxygen recycler',
    juggernaut: 'siege mech pilot suit, fully integrated life support, walking battleship',
    powerarmor: 'EVA combat frame, thruster pack, energy shield generator',
  },
  western: {
    goddess: 'frontier legend, dusty elegance, sun-weathered grace, mythic gunslinger',
    fierce: 'scarred outlaw, ruthless eyes, quick-draw stance, wanted poster face',
    regal: 'wealthy rancher, embroidered vest, silver spurs, cattle baron dignity',
    mysterious: 'drifter with hidden past, pulled-low hat, unseen eyes, stranger in town',
    elegant: 'saloon owner finest, Victorian frontier dress, pearl jewelry',
    tactical: 'trail rider gear, saddlebags, rope coiled, survival kit',
    heavyarmor: 'iron-plated lawman, reinforced duster, steel chest plate',
    juggernaut: 'walking iron fortress, improvised tank armor, gatling gun carrier',
  },
  noir: {
    goddess: 'femme fatale divine, smoky elegance, dangerous beauty, mysterious allure',
    fierce: 'hardboiled detective, shadowy scars, intense gaze, seen too much',
    regal: 'crime boss sophistication, expensive suit, power and menace',
    mysterious: 'shadow-dwelling informant, face half-hidden, secrets for sale',
    elegant: 'vintage glamour, silk evening gown, art deco jewelry',
    tactical: 'private eye trenchcoat, concealed weapons, observant stance',
  },
  horror: {
    goddess: 'dark goddess, otherworldly horror beauty, eldritch elegance, cursed divinity',
    fierce: 'survivor of nightmares, trauma-hardened, monster-killing scars',
    regal: 'vampire nobility, ancient aristocratic terror, blood-red elegance',
    mysterious: 'cult leader aura, forbidden knowledge, unsettling calm',
    elegant: 'gothic mourning dress, Victorian funeral chic, death-touched beauty',
    haunted: 'possession survivor, hollow eyes, spectral pallor, death-touched',
    darkknight: 'death knight armor, skull motifs, necrotic corruption, fear aura',
  },
  steampunk: {
    goddess: 'clockwork divinity, brass and copper elegance, steam-powered grace',
    fierce: 'airship pirate captain, brass prosthetics, goggle-scarred face',
    regal: 'industrial magnate, gear-emblazoned regalia, mechanical throne',
    mysterious: 'masked inventor, hidden contraptions, steam-shrouded',
    elegant: 'Victorian haute couture, brass clockwork accessories, corset with gears',
    tactical: 'explorer gear, multi-tool belt, pneumatic grapple, adventure ready',
    heavyarmor: 'steam-powered iron suit, coal-fired protection, piston-driven joints',
    juggernaut: 'walking steamtank, boiler-powered armor, chimney stack exhaust',
  },
  'post-apocalyptic': {
    goddess: 'wasteland queen, scavenged crown, radiation-touched beauty, tribal divinity',
    fierce: 'raider warlord, survival scars, kill trophies, predator presence',
    regal: 'settlement leader, earned respect, weathered authority',
    mysterious: 'wandering stranger, unknown origin, possibly dangerous',
    elegant: 'pre-war finery preserved, salvaged luxury, memory of civilization',
    tactical: 'scavenger loadout, jury-rigged gear, survival pack',
    heavyarmor: 'car door plates, tire shoulder pads, improvised tank',
    juggernaut: 'walking scrap fortress, welded metal cocoon, unstoppable wasteland',
  },
};

// Get genre-enhanced keywords for a command
export const getGenreEnhancedKeywords = (cmd: SlashCommand, genre: string): string => {
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z-]/g, '');
  const enhancements = GENRE_KEYWORD_ENHANCEMENTS[normalizedGenre];
  if (enhancements && enhancements[cmd.command]) {
    return enhancements[cmd.command];
  }
  return cmd.keywords;
};

// Commands that are especially relevant for each genre
export const GENRE_SUGGESTED_COMMANDS: Record<string, string[]> = {
  fantasy: ['fantasy', 'goddess', 'paladin', 'darkfantasy', 'robe', 'platearmor', 'mysterious', 'regal'],
  cyberpunk: ['cyberpunk', 'powerarmor', 'fierce', 'techfantasy', 'tactical', 'cunning'],
  scifi: ['scifi', 'powerarmor', 'tactical', 'futuristic', 'elegant', 'stoic'],
  western: ['western', 'stoic', 'fierce', 'lightarmor', 'casual', 'haunted'],
  noir: ['noir', 'mysterious', 'cunning', 'formal', 'gothic', 'haunted'],
  horror: ['horror', 'haunted', 'darkknight', 'grimdark', 'mysterious', 'gothic'],
  steampunk: ['steampunk', 'regal', 'elegant', 'tactical', 'heavyarmor', 'cunning'],
  'post-apocalyptic': ['postapoc', 'grimdark', 'fierce', 'tactical', 'juggernaut', 'wild'],
};

// Piercing style options that affect NPC reactions
export const PIERCING_STYLE_OPTIONS = [
  { value: 'minimal', label: 'Minimal', description: 'Subtle, tasteful jewelry', reputation: 'professional' },
  { value: 'elegant', label: 'Elegant', description: 'High-end, refined pieces', reputation: 'sophisticated' },
  { value: 'edgy', label: 'Edgy/Alternative', description: 'Punk, industrial style', reputation: 'rebellious' },
  { value: 'tribal', label: 'Tribal/Cultural', description: 'Traditional, meaningful', reputation: 'spiritual' },
  { value: 'extreme', label: 'Extreme/Heavy', description: 'Many, large, statement pieces', reputation: 'intimidating' },
  { value: 'cybernetic', label: 'Cybernetic', description: 'Tech-integrated jewelry', reputation: 'futuristic' },
];

type AccordionSection = 'clothing' | 'piercings' | 'tattoos' | 'modifications' | null;

interface AppearanceAccordionsProps {
  appearance: TieredAppearance;
  onUpdateAppearance: (tier: 'simple' | 'detailed' | 'full', field: string, value: any) => void;
  genre: string;
}

export function AppearanceAccordions({ appearance, onUpdateAppearance, genre }: AppearanceAccordionsProps) {
  const [openSection, setOpenSection] = useState<AccordionSection>(null);
  const [appliedCommands, setAppliedCommands] = useState<string[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [holdTimeout, setHoldTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [holdingCommand, setHoldingCommand] = useState<string | null>(null);
  const [editingCommand, setEditingCommand] = useState<string | null>(null);
  const [editedKeywords, setEditedKeywords] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleSection = useCallback((section: AccordionSection) => {
    setOpenSection(prev => prev === section ? null : section);
  }, []);

  // Normalize genre for matching
  const normalizedGenre = genre.toLowerCase().replace(/[^a-z-]/g, '');
  const genreSuggestions = GENRE_SUGGESTED_COMMANDS[normalizedGenre] || [];

  // Filter commands based on current input
  const filteredCommands = SLASH_COMMANDS.filter(cmd => 
    cmd.command.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    cmd.category.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Check if a command is genre-suggested
  const isGenreSuggested = useCallback((cmd: SlashCommand) => {
    return genreSuggestions.includes(cmd.command);
  }, [genreSuggestions]);

  const categoryLabels: Record<string, string> = {
    favorites: '⭐ Favorites',
    suggested: `🎯 ${genre || 'Genre'} Suggestions`,
    personality: '🎭 Personality',
    genre: '🌍 Genre',
    clothing: '👗 Clothing',
    armor: '🛡️ Armor',
    stance: '🧍 Stance',
    pose: '💪 Pose',
    style: '✨ Style Blend',
  };

  // Toggle favorite with hold gesture
  const handlePointerDown = useCallback((cmd: SlashCommand) => {
    setHoldingCommand(cmd.command);
    const timeout = setTimeout(() => {
      setFavorites(prev => {
        const newFavorites = prev.includes(cmd.command)
          ? prev.filter(c => c !== cmd.command)
          : [...prev, cmd.command];
        saveFavorites(newFavorites);
        return newFavorites;
      });
      setHoldingCommand(null);
    }, 600);
    setHoldTimeout(timeout);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
      setHoldTimeout(null);
    }
    setHoldingCommand(null);
  }, [holdTimeout]);

  // Group commands by category with favorites first, then genre suggestions
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    // Add to favorites category if favorited
    if (favorites.includes(cmd.command)) {
      if (!acc['favorites']) acc['favorites'] = [];
      acc['favorites'].push(cmd);
    }
    // Add to suggested category if genre-relevant (but not if already favorited to avoid duplication at top)
    if (isGenreSuggested(cmd) && !favorites.includes(cmd.command)) {
      if (!acc['suggested']) acc['suggested'] = [];
      acc['suggested'].push(cmd);
    }
    // Also add to regular category
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, SlashCommand[]>);

  const applySlashCommand = useCallback((cmd: SlashCommand, customKeywords?: string) => {
    const currentDetails = appearance.full?.intimateDetails || '';
    
    // Remove the slash command text from input
    const cleanedDetails = currentDetails.replace(/\/\w*$/, '').trim();
    // Use custom keywords, or genre-enhanced keywords, or default keywords
    const genreKeywords = getGenreEnhancedKeywords(cmd, genre);
    const keywordsToUse = customKeywords || genreKeywords;
    
    // Check if already applied - toggle off
    if (appliedCommands.includes(cmd.command)) {
      const keywordsToRemove = keywordsToUse.split(', ');
      let newDetails = cleanedDetails;
      keywordsToRemove.forEach(keyword => {
        newDetails = newDetails.replace(new RegExp(`\\b${keyword}\\b,?\\s*`, 'gi'), '');
      });
      newDetails = newDetails.replace(/,\s*,/g, ', ').replace(/^,\s*|,\s*$/g, '').trim();
      onUpdateAppearance('full', 'intimateDetails', newDetails);
      setAppliedCommands(prev => prev.filter(c => c !== cmd.command));
    } else {
      // Apply the command
      const newDetails = cleanedDetails 
        ? `${cleanedDetails}, ${keywordsToUse}` 
        : keywordsToUse;
      onUpdateAppearance('full', 'intimateDetails', newDetails.slice(0, 500));
      setAppliedCommands(prev => [...prev, cmd.command]);
    }
    
    setShowSlashMenu(false);
    setSlashFilter('');
    setEditingCommand(null);
  }, [appearance.full?.intimateDetails, onUpdateAppearance, appliedCommands, genre]);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onUpdateAppearance('full', 'intimateDetails', value);
    
    // Check for slash command trigger
    const slashMatch = value.match(/\/(\w*)$/);
    if (slashMatch) {
      setSlashFilter(slashMatch[1]);
      setShowSlashMenu(true);
      
      // Calculate menu position
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 4, left: rect.left });
      }
    } else {
      setShowSlashMenu(false);
      setSlashFilter('');
    }
    
    // Update applied commands tracking
    const newApplied = SLASH_COMMANDS.filter(cmd => {
      const firstKeyword = cmd.keywords.split(', ')[0];
      return value.toLowerCase().includes(firstKeyword.toLowerCase());
    }).map(cmd => cmd.command);
    setAppliedCommands(newApplied);
  }, [onUpdateAppearance]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setShowSlashMenu(false);
    if (showSlashMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showSlashMenu]);

  const toggleArrayItem = useCallback((field: string, item: string) => {
    const current = (appearance.full as any)?.[field] || [];
    if (current.includes(item)) {
      onUpdateAppearance('full', field, current.filter((i: string) => i !== item));
    } else {
      onUpdateAppearance('full', field, [...current, item]);
    }
  }, [appearance.full, onUpdateAppearance]);

  const renderAccordionHeader = (
    section: AccordionSection, 
    icon: React.ReactNode, 
    title: string, 
    count?: number
  ) => (
    <button
      onClick={() => toggleSection(section)}
      className={cn(
        "w-full flex items-center justify-between p-3 rounded-lg transition-all",
        "border bg-background/50 hover:bg-background/80",
        openSection === section 
          ? "border-primary/50 bg-primary/10" 
          : "border-border/30 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      <ChevronDown className={cn(
        "w-4 h-4 transition-transform",
        openSection === section && "rotate-180"
      )} />
    </button>
  );

  const piercingCount = appearance.full?.piercings?.length || 0;
  const tattooCount = appearance.full?.tattoos?.length || 0;
  const modCount = (appearance.full?.scars?.length || 0) + 
                   (appearance.full?.prosthetics?.length || 0) + 
                   (appearance.full?.implants?.length || 0) + 
                   (appearance.full?.mutations?.length || 0);
  // Clothing style removed - use Additional Description instead

  return (
    <div className="space-y-2">
      {/* Clothing Style removed - use Additional Description instead */}

      {/* Piercings Accordion */}
      {renderAccordionHeader('piercings', <Scissors className="w-4 h-4 text-accent" />, 'Piercings', piercingCount)}
      {openSection === 'piercings' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Piercing Style</label>
            <p className="text-xs text-muted-foreground/70 mb-2">
              ⚡ Style affects NPC reactions & reputation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PIERCING_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateAppearance('full', 'piercingStyle', opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs transition-all text-left",
                    (appearance.full as any)?.piercingStyle === opt.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 border border-border/30 hover:border-accent/50"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.reputation}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Piercing Locations</label>
            {Object.entries(
              PIERCING_OPTIONS.reduce((acc, opt) => {
                if (!acc[opt.category]) acc[opt.category] = [];
                acc[opt.category].push(opt);
                return acc;
              }, {} as Record<string, typeof PIERCING_OPTIONS>)
            ).map(([category, options]) => (
              <div key={category} className="mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleArrayItem('piercings', opt.value)}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-all",
                        appearance.full?.piercings?.includes(opt.value)
                          ? "bg-accent text-accent-foreground"
                          : "bg-background/50 border border-border/30 hover:border-accent/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tattoos Accordion */}
      {renderAccordionHeader('tattoos', <Palette className="w-4 h-4 text-destructive" />, 'Tattoos', tattooCount)}
      {openSection === 'tattoos' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tattoo Style</label>
            <p className="text-xs text-muted-foreground/70 mb-2">
              ⚡ Style affects NPC reactions & reputation
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {TATTOO_STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onUpdateAppearance('full', 'tattooStyle', opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded text-xs transition-all text-left",
                    appearance.full?.tattooStyle === opt.value
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-background/50 border border-border/30 hover:border-destructive/50"
                  )}
                >
                  <div className="font-medium">{opt.label}</div>
                  <div className="text-[10px] opacity-70">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Tattoo Placements</label>
            {Object.entries(
              TATTOO_OPTIONS.reduce((acc, opt) => {
                if (!acc[opt.category]) acc[opt.category] = [];
                acc[opt.category].push(opt);
                return acc;
              }, {} as Record<string, typeof TATTOO_OPTIONS>)
            ).map(([category, options]) => (
              <div key={category} className="mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{category}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {options.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleArrayItem('tattoos', opt.value)}
                      className={cn(
                        "px-2 py-1 rounded text-xs transition-all",
                        appearance.full?.tattoos?.includes(opt.value)
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-background/50 border border-border/30 hover:border-destructive/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body Modifications Accordion */}
      {renderAccordionHeader('modifications', <Syringe className="w-4 h-4 text-muted-foreground" />, 'Scars & Augments', modCount)}
      {openSection === 'modifications' && (
        <div className="p-3 border border-border/30 rounded-lg bg-background/30 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {/* Scars */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Scars & Wounds</label>
            <div className="flex flex-wrap gap-1">
              {SCAR_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('scars', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.scars?.includes(opt.value)
                      ? "bg-muted-foreground text-background"
                      : "bg-background/50 border border-border/30 hover:border-muted-foreground/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prosthetics */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prosthetics</label>
            <div className="flex flex-wrap gap-1">
              {PROSTHETIC_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('prosthetics', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.prosthetics?.includes(opt.value)
                      ? "bg-primary text-primary-foreground"
                      : "bg-background/50 border border-border/30 hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Implants */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Implants & Cybernetics</label>
            <div className="flex flex-wrap gap-1">
              {IMPLANT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('implants', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.implants?.includes(opt.value)
                      ? "bg-accent text-accent-foreground"
                      : "bg-background/50 border border-border/30 hover:border-accent/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mutations */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mutations</label>
            <div className="flex flex-wrap gap-1">
              {MUTATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleArrayItem('mutations', opt.value)}
                  className={cn(
                    "px-2 py-1 rounded text-xs transition-all",
                    appearance.full?.mutations?.includes(opt.value)
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-background/50 border border-border/30 hover:border-destructive/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Enhancement Priority Field - After accordions */}
      <div className="border border-primary/30 rounded-lg p-3 bg-primary/5 mt-4 relative">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <label className="text-sm font-medium text-primary">Additional Details</label>
        </div>
        
        {/* Applied Commands Tags */}
        {appliedCommands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {appliedCommands.map(cmdName => {
              const cmd = SLASH_COMMANDS.find(c => c.command === cmdName);
              if (!cmd) return null;
              const IconComponent = cmd.icon;
              return (
                <button
                  key={cmd.command}
                  type="button"
                  onClick={() => applySlashCommand(cmd)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    "bg-gradient-to-r text-white transition-all hover:scale-105",
                    cmd.color
                  )}
                  title={`Click to remove /${cmd.command}`}
                >
                  <IconComponent className="w-3 h-3" />
                  /{cmd.command}
                  <span className="ml-1 opacity-70">×</span>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-xs text-muted-foreground mb-2">
          ✨ Type <code className="bg-muted px-1 rounded">/</code> for style presets
          {genre && <span className="text-primary"> • Genre-tuned for <strong>{genre}</strong></span>}
          <span className="text-amber-400 ml-1">• Hold to ⭐ favorite</span>
        </p>
        
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={appearance.full?.intimateDetails || ''}
            onChange={handleTextareaChange}
            onKeyDown={(e) => {
              if (showSlashMenu && e.key === 'Escape') {
                setShowSlashMenu(false);
                setSlashFilter('');
              }
            }}
            placeholder="Type / to see presets, or describe: rose gold jewelry, sleeve tattoo, chrome cybernetic arm..."
            className="w-full p-2 rounded-lg bg-background border border-border/50 text-sm min-h-[60px] resize-none"
            maxLength={500}
          />
          
          {/* Slash Command Autocomplete Menu */}
          {showSlashMenu && filteredCommands.length > 0 && (
            <div 
              className="absolute z-50 left-0 right-0 bottom-full mb-1 max-h-64 overflow-y-auto rounded-lg border border-primary/30 bg-background shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 border-b border-border/30 bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Type to filter • {filteredCommands.length} commands available
                </p>
              </div>
              {Object.entries(groupedCommands)
                .sort(([a], [b]) => {
                  const order = ['favorites', 'suggested', 'personality', 'genre', 'clothing', 'armor', 'stance', 'pose', 'style'];
                  return order.indexOf(a) - order.indexOf(b);
                })
                .map(([category, commands]) => (
                <div key={category}>
                  <div className={cn(
                    "px-2 py-1 text-xs font-semibold sticky top-0",
                    category === 'favorites' ? "bg-amber-500/20 text-amber-400" :
                    category === 'suggested' ? "bg-primary/20 text-primary" :
                    "bg-muted/20 text-muted-foreground"
                  )}>
                    {categoryLabels[category] || category}
                  </div>
                  {commands.map(cmd => {
                    const IconComponent = cmd.icon;
                    const isApplied = appliedCommands.includes(cmd.command);
                    const isFavorite = favorites.includes(cmd.command);
                    const isHolding = holdingCommand === cmd.command;
                    const isEditing = editingCommand === cmd.command;
                    const isSuggested = isGenreSuggested(cmd);
                    const genreKeywords = getGenreEnhancedKeywords(cmd, genre);
                    const hasGenreEnhancement = genreKeywords !== cmd.keywords;
                    
                    return (
                      <div key={`${category}-${cmd.command}`} className="relative">
                        {isEditing ? (
                          <div className="p-2 bg-muted/30 border-l-2 border-primary">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm text-primary">/{cmd.command}</span>
                              <span className="text-xs text-muted-foreground">Edit keywords for {genre || 'your'} genre:</span>
                            </div>
                            <input
                              type="text"
                              value={editedKeywords}
                              onChange={(e) => setEditedKeywords(e.target.value)}
                              className="w-full p-2 rounded text-xs bg-background border border-border/50 mb-2"
                              placeholder={genreKeywords}
                              autoFocus
                            />
                            {hasGenreEnhancement && (
                              <p className="text-[10px] text-primary/70 mb-2 flex items-center gap-1">
                                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                                Genre-optimized for {genre}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  applySlashCommand(cmd, editedKeywords || genreKeywords);
                                }}
                                className="px-3 py-1 rounded text-xs bg-primary text-primary-foreground"
                              >
                                Apply
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommand(null);
                                  setEditedKeywords('');
                                }}
                                className="px-3 py-1 rounded text-xs bg-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCommand(cmd.command);
                              setEditedKeywords(genreKeywords);
                            }}
                            onPointerDown={() => handlePointerDown(cmd)}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-left transition-all",
                              "hover:bg-primary/10",
                              isApplied && "bg-primary/20",
                              isHolding && "bg-amber-500/20",
                              isSuggested && !isFavorite && category !== 'suggested' && "ring-1 ring-primary/30"
                            )}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded flex items-center justify-center bg-gradient-to-br relative",
                              cmd.color
                            )}>
                              <IconComponent className="w-3.5 h-3.5 text-white" />
                              {isFavorite && (
                                <Star className="w-2.5 h-2.5 absolute -top-1 -right-1 text-amber-400 fill-amber-400 animate-pulse" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-primary">/{cmd.command}</span>
                                <span className="text-xs text-muted-foreground truncate">{cmd.description}</span>
                                {hasGenreEnhancement && (
                                  <span className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary font-medium">
                                    {genre}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground/60 truncate">
                                {hasGenreEnhancement ? genreKeywords.slice(0, 50) : cmd.keywords.slice(0, 50)}...
                              </div>
                            </div>
                            {isFavorite && (
                              <span className={cn(
                                "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
                                "bg-gradient-to-r from-amber-400/30 to-yellow-400/30 text-amber-300",
                                "animate-shimmer bg-[length:200%_100%]"
                              )}>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              </span>
                            )}
                            {isApplied && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                Active
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {(appearance.full?.intimateDetails || '').length}/500
        </p>
      </div>
    </div>
  );
}
