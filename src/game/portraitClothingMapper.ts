// Portrait Clothing Mapper - Maps AI-detected clothing from portraits to inventory items
// Analyzes prompt text and detected keywords to precisely match visual clothing style

import { ClothingItem, ClothingSlot, CLOTHING_DATABASE, getClothingById } from './clothingItemSystem';
import { BASIC_CLOTHING } from './starterClothingSystem';
import { DetectedClothingItem } from '@/services/fluxImageGeneration';

export interface MappedClothingSet {
  items: Partial<Record<ClothingSlot, ClothingItem>>;
  description: string;
  source: 'portrait_detected' | 'genre_fallback';
}

// ============================================================================
// COMPREHENSIVE CLOTHING MATCHING DATABASE
// Maps detected keywords/tags to actual inventory item IDs with priority scoring
// ============================================================================
interface ClothingMatch {
  itemId: string;
  keywords: string[];
  tags: string[];
  genres?: string[];
  priority: number; // Higher = better match
}

const CLOTHING_MATCHES: ClothingMatch[] = [
  // ============== TORSO - Fantasy/Medieval ==============
  { itemId: 'leather_armor', keywords: ['leather armor', 'leather chest', 'light armor', 'leather breastplate', 'leather cuirass'], tags: ['leather', 'armor', 'light'], genres: ['fantasy', 'medieval', 'dark_fantasy'], priority: 10 },
  { itemId: 'ranger_leather', keywords: ['ranger', 'scout armor', 'forest armor', 'woodsman'], tags: ['ranger', 'scout', 'forest'], genres: ['fantasy'], priority: 12 },
  { itemId: 'studded_leather', keywords: ['studded leather', 'reinforced leather', 'studded armor'], tags: ['studded', 'reinforced'], genres: ['fantasy', 'medieval'], priority: 11 },
  { itemId: 'chainmail_shirt', keywords: ['chainmail', 'chain mail', 'mail shirt', 'ring mail', 'chain armor'], tags: ['chainmail', 'mail', 'metal'], genres: ['fantasy', 'medieval'], priority: 13 },
  { itemId: 'scale_mail', keywords: ['scale mail', 'scale armor', 'scales'], tags: ['scale', 'scales'], genres: ['fantasy', 'medieval'], priority: 14 },
  { itemId: 'plate_armor', keywords: ['plate armor', 'full plate', 'plate mail', 'heavy armor', 'knight armor'], tags: ['plate', 'heavy', 'knight'], genres: ['fantasy', 'medieval'], priority: 15 },
  { itemId: 'breastplate', keywords: ['breastplate', 'chest plate', 'steel plate'], tags: ['breastplate', 'steel'], genres: ['fantasy', 'medieval', 'war'], priority: 14 },
  { itemId: 'mage_robes', keywords: ['mage robes', 'wizard robes', 'arcane robes', 'magical robes', 'sorcerer'], tags: ['mage', 'wizard', 'arcane', 'magical', 'robes'], genres: ['fantasy', 'high_fantasy'], priority: 12 },
  { itemId: 'druid_robes', keywords: ['druid', 'nature robes', 'forest robes'], tags: ['druid', 'nature', 'forest'], genres: ['fantasy'], priority: 11 },
  { itemId: 'travel_cloak', keywords: ['cloak', 'travel cloak', 'hooded cloak', 'traveler'], tags: ['cloak', 'travel', 'hooded'], genres: ['fantasy', 'medieval'], priority: 8 },
  { itemId: 'gambeson', keywords: ['gambeson', 'padded armor', 'quilted', 'padded jacket'], tags: ['gambeson', 'padded', 'quilted'], genres: ['fantasy', 'medieval'], priority: 10 },
  { itemId: 'brigandine', keywords: ['brigandine', 'riveted armor'], tags: ['brigandine', 'riveted'], genres: ['fantasy', 'medieval'], priority: 13 },
  { itemId: 'jerkin', keywords: ['jerkin', 'leather vest', 'sleeveless'], tags: ['jerkin', 'vest'], genres: ['fantasy', 'medieval'], priority: 7 },
  { itemId: 'leather_corset', keywords: ['corset', 'leather corset', 'fitted'], tags: ['corset', 'fitted'], genres: ['fantasy', 'steampunk', 'victorian'], priority: 9 },
  { itemId: 'bikini_armor', keywords: ['revealing armor', 'decorative armor', 'ornate armor', 'battle attire', 'minimal armor'], tags: ['revealing', 'decorative', 'ornate', 'minimal'], genres: ['fantasy'], priority: 8 },
  { itemId: 'assassin_garb', keywords: ['assassin', 'rogue', 'thief', 'dark clothes', 'shadow'], tags: ['assassin', 'rogue', 'thief', 'shadow'], genres: ['fantasy', 'dark_fantasy'], priority: 12 },
  { itemId: 'noble_doublet', keywords: ['doublet', 'noble', 'aristocrat', 'silk shirt'], tags: ['doublet', 'noble', 'aristocrat'], genres: ['fantasy', 'medieval', 'victorian'], priority: 10 },
  { itemId: 'hunters_vest', keywords: ['hunter', 'hunting vest'], tags: ['hunter', 'hunting'], genres: ['fantasy', 'western'], priority: 8 },
  { itemId: 'fur_vest', keywords: ['fur', 'fur-lined', 'fur vest', 'barbarian'], tags: ['fur', 'barbarian'], genres: ['fantasy', 'medieval'], priority: 7 },
  { itemId: 'cloth_wrap_top', keywords: ['cloth wrap', 'bandages', 'wrapped', 'monk'], tags: ['wrap', 'bandages', 'monk'], genres: ['fantasy'], priority: 5 },
  { itemId: 'linen_shirt', keywords: ['linen', 'simple shirt', 'peasant shirt'], tags: ['linen', 'simple', 'peasant'], genres: ['fantasy', 'medieval'], priority: 4 },
  
  // ============== TORSO - Modern/Casual ==============
  { itemId: 'plain_tshirt', keywords: ['t-shirt', 'tshirt', 'tee', 'casual shirt'], tags: ['casual', 'tshirt', 'modern'], genres: ['modern', 'horror', 'urban_fantasy'], priority: 5 },
  { itemId: 'hoodie', keywords: ['hoodie', 'hooded sweatshirt', 'sweatshirt'], tags: ['hoodie', 'casual', 'streetwear'], genres: ['modern', 'cyberpunk', 'urban_fantasy'], priority: 7 },
  { itemId: 'tank_top', keywords: ['tank top', 'sleeveless', 'muscle shirt'], tags: ['tank', 'sleeveless', 'athletic'], genres: ['modern'], priority: 5 },
  { itemId: 'crop_top', keywords: ['crop top', 'cropped', 'midriff'], tags: ['crop', 'midriff'], genres: ['modern', 'cyberpunk'], priority: 6 },
  { itemId: 'leather_jacket', keywords: ['leather jacket', 'biker jacket', 'motorcycle'], tags: ['leather', 'biker', 'jacket'], genres: ['modern', 'noir', 'cyberpunk'], priority: 10 },
  
  // ============== TORSO - Cyberpunk/Sci-Fi ==============
  { itemId: 'cyber_jacket', keywords: ['neon', 'led', 'cyber jacket', 'tech jacket', 'synth'], tags: ['neon', 'cyber', 'tech', 'synth'], genres: ['cyberpunk', 'scifi'], priority: 12 },
  { itemId: 'tactical_vest', keywords: ['tactical vest', 'combat vest', 'ballistic'], tags: ['tactical', 'combat', 'military'], genres: ['war', 'cyberpunk', 'modern'], priority: 11 },
  { itemId: 'heavy_plate_carrier', keywords: ['plate carrier', 'body armor', 'ballistic vest'], tags: ['plate carrier', 'ballistic'], genres: ['war', 'modern'], priority: 13 },
  
  // ============== TORSO - Western/Historical ==============
  { itemId: 'duster_coat', keywords: ['duster', 'long coat', 'western coat', 'trench'], tags: ['duster', 'western', 'coat'], genres: ['western', 'postapoc', 'noir'], priority: 10 },
  { itemId: 'pirate_coat', keywords: ['pirate coat', 'captain coat', 'naval coat', 'frock'], tags: ['pirate', 'captain', 'naval'], genres: ['pirate'], priority: 11 },
  
  // ============== LEGS - Fantasy/Medieval ==============
  { itemId: 'leather_pants', keywords: ['leather pants', 'leather trousers', 'leather leggings'], tags: ['leather', 'pants'], genres: ['fantasy', 'medieval'], priority: 8 },
  { itemId: 'wool_breeches', keywords: ['breeches', 'wool', 'woolen pants'], tags: ['breeches', 'wool'], genres: ['fantasy', 'medieval', 'pirate'], priority: 7 },
  { itemId: 'ranger_leggings', keywords: ['ranger', 'scout', 'reinforced leggings'], tags: ['ranger', 'scout'], genres: ['fantasy'], priority: 10 },
  { itemId: 'chainmail_leggings', keywords: ['chainmail leggings', 'mail leggings'], tags: ['chainmail', 'mail'], genres: ['fantasy', 'medieval'], priority: 11 },
  { itemId: 'plate_greaves', keywords: ['plate legs', 'greaves', 'leg armor'], tags: ['plate', 'greaves'], genres: ['fantasy', 'medieval'], priority: 12 },
  { itemId: 'leather_tassets', keywords: ['tassets', 'armored skirt', 'battle skirt'], tags: ['tassets', 'armored'], genres: ['fantasy', 'medieval'], priority: 9 },
  { itemId: 'battle_skirt', keywords: ['battle skirt', 'warrior skirt', 'armored skirt'], tags: ['battle', 'warrior', 'armored'], genres: ['fantasy'], priority: 9 },
  { itemId: 'cloth_pants', keywords: ['cloth pants', 'simple pants', 'peasant pants'], tags: ['cloth', 'simple', 'peasant'], genres: ['fantasy', 'medieval'], priority: 4 },
  { itemId: 'skirt', keywords: ['skirt', 'simple skirt'], tags: ['skirt'], genres: ['fantasy', 'modern'], priority: 5 },
  { itemId: 'flowing_skirt', keywords: ['long skirt', 'flowing', 'elegant skirt'], tags: ['flowing', 'elegant', 'long'], genres: ['fantasy', 'victorian'], priority: 7 },
  { itemId: 'loincloth', keywords: ['loincloth', 'barbarian', 'tribal'], tags: ['loincloth', 'tribal', 'barbarian'], genres: ['fantasy'], priority: 3 },
  { itemId: 'leggings', keywords: ['leggings', 'tights', 'fitted'], tags: ['leggings', 'tights', 'fitted'], genres: ['fantasy', 'modern'], priority: 6 },
  
  // ============== LEGS - Modern ==============
  { itemId: 'worn_jeans', keywords: ['jeans', 'denim', 'casual pants'], tags: ['jeans', 'denim', 'casual'], genres: ['modern', 'horror', 'western'], priority: 6 },
  { itemId: 'cargo_pants', keywords: ['cargo', 'tactical pants', 'military pants'], tags: ['cargo', 'tactical', 'military'], genres: ['war', 'modern', 'cyberpunk'], priority: 9 },
  { itemId: 'dress_pants', keywords: ['dress pants', 'slacks', 'formal pants', 'suit pants'], tags: ['dress', 'formal', 'suit'], genres: ['modern', 'noir'], priority: 8 },
  { itemId: 'cyber_pants', keywords: ['tech pants', 'cyber pants', 'data pants'], tags: ['tech', 'cyber', 'data'], genres: ['cyberpunk', 'scifi'], priority: 10 },
  { itemId: 'shorts', keywords: ['shorts', 'short pants'], tags: ['shorts'], genres: ['modern'], priority: 5 },
  
  // ============== FEET - Fantasy/Medieval ==============
  { itemId: 'leather_boots', keywords: ['leather boots', 'travel boots', 'walking boots', 'sturdy boots'], tags: ['leather', 'travel', 'sturdy'], genres: ['fantasy', 'medieval', 'western'], priority: 8 },
  { itemId: 'high_boots', keywords: ['high boots', 'knee boots', 'tall boots', 'knee-high'], tags: ['high', 'knee', 'tall'], genres: ['fantasy', 'pirate', 'western'], priority: 9 },
  { itemId: 'soft_boots', keywords: ['soft boots', 'quiet boots', 'stealth boots'], tags: ['soft', 'quiet', 'stealth'], genres: ['fantasy'], priority: 8 },
  { itemId: 'elven_boots', keywords: ['elven', 'elvish', 'silent boots'], tags: ['elven', 'elvish', 'silent'], genres: ['fantasy', 'high_fantasy'], priority: 12 },
  { itemId: 'plate_boots', keywords: ['plate boots', 'sabatons', 'armored boots', 'metal boots'], tags: ['plate', 'sabaton', 'armored', 'metal'], genres: ['fantasy', 'medieval'], priority: 11 },
  { itemId: 'fur_boots', keywords: ['fur boots', 'fur-lined boots', 'winter boots'], tags: ['fur', 'winter'], genres: ['fantasy'], priority: 7 },
  { itemId: 'sandals', keywords: ['sandals', 'open shoes'], tags: ['sandals', 'open'], genres: ['fantasy'], priority: 4 },
  { itemId: 'barefoot', keywords: ['barefoot', 'no shoes', 'bare feet'], tags: ['barefoot', 'bare'], priority: 2 },
  { itemId: 'thigh_high_boots', keywords: ['thigh-high', 'thigh boots', 'over-knee'], tags: ['thigh-high', 'over-knee'], genres: ['fantasy', 'cyberpunk'], priority: 10 },
  { itemId: 'heeled_boots', keywords: ['heeled', 'heels', 'high-heeled boots'], tags: ['heeled', 'heels'], genres: ['fantasy', 'modern', 'noir'], priority: 8 },
  
  // ============== FEET - Modern/Military ==============
  { itemId: 'sneakers', keywords: ['sneakers', 'trainers', 'running shoes', 'athletic shoes'], tags: ['sneakers', 'trainers', 'athletic'], genres: ['modern', 'horror'], priority: 7 },
  { itemId: 'combat_boots', keywords: ['combat boots', 'military boots', 'tactical boots', 'army boots'], tags: ['combat', 'military', 'tactical', 'army'], genres: ['war', 'modern', 'cyberpunk', 'postapoc'], priority: 10 },
  { itemId: 'heavy_armored_boots', keywords: ['armored boots', 'heavy boots', 'reinforced boots'], tags: ['armored', 'heavy', 'reinforced'], genres: ['war', 'cyberpunk'], priority: 11 },
  { itemId: 'dress_shoes', keywords: ['dress shoes', 'oxfords', 'formal shoes', 'loafers'], tags: ['dress', 'formal', 'oxford'], genres: ['modern', 'noir'], priority: 8 },
  
  // ============== HEAD ==============
  { itemId: 'leather_hood', keywords: ['hood', 'leather hood', 'hooded'], tags: ['hood', 'hooded'], genres: ['fantasy', 'dark_fantasy'], priority: 7 },
  { itemId: 'ranger_hood', keywords: ['ranger hood', 'scout hood', 'forest hood'], tags: ['ranger', 'scout', 'forest'], genres: ['fantasy'], priority: 9 },
  { itemId: 'wizard_hat', keywords: ['wizard hat', 'pointed hat', 'mage hat', 'witch hat'], tags: ['wizard', 'mage', 'witch', 'pointed'], genres: ['fantasy'], priority: 10 },
  { itemId: 'iron_helm', keywords: ['iron helm', 'iron helmet', 'open helm'], tags: ['iron', 'helm'], genres: ['fantasy', 'medieval'], priority: 9 },
  { itemId: 'steel_helm', keywords: ['steel helm', 'knight helm', 'visor helm', 'great helm'], tags: ['steel', 'knight', 'visor'], genres: ['fantasy', 'medieval'], priority: 11 },
  { itemId: 'elven_circlet', keywords: ['circlet', 'elven', 'tiara', 'crown'], tags: ['circlet', 'elven', 'tiara'], genres: ['fantasy', 'high_fantasy'], priority: 10 },
  { itemId: 'cowboy_hat', keywords: ['cowboy hat', 'western hat', 'stetson'], tags: ['cowboy', 'western', 'stetson'], genres: ['western'], priority: 12 },
  { itemId: 'tricorn_hat', keywords: ['tricorn', 'pirate hat', 'three-cornered'], tags: ['tricorn', 'pirate'], genres: ['pirate'], priority: 11 },
  { itemId: 'fedora_noir', keywords: ['fedora', 'detective hat', 'trilby'], tags: ['fedora', 'detective'], genres: ['noir'], priority: 11 },
  { itemId: 'cyber_visor', keywords: ['visor', 'cyber visor', 'ar visor', 'hud'], tags: ['visor', 'cyber', 'ar', 'hud'], genres: ['cyberpunk', 'scifi'], priority: 10 },
  { itemId: 'tactical_helmet', keywords: ['tactical helmet', 'combat helmet', 'military helmet'], tags: ['tactical', 'combat', 'military'], genres: ['war', 'modern'], priority: 10 },
  { itemId: 'bandana', keywords: ['bandana', 'headband'], tags: ['bandana', 'headband'], genres: ['western', 'postapoc'], priority: 6 },
  { itemId: 'worn_cap', keywords: ['cap', 'baseball cap', 'hat'], tags: ['cap', 'baseball'], genres: ['modern'], priority: 5 },
  { itemId: 'flower_crown', keywords: ['flower crown', 'floral', 'wreath'], tags: ['flower', 'floral', 'wreath'], genres: ['fantasy'], priority: 7 },
  { itemId: 'beret', keywords: ['beret'], tags: ['beret'], genres: ['modern'], priority: 6 },
  
  // ============== HANDS ==============
  { itemId: 'leather_gloves', keywords: ['leather gloves', 'work gloves'], tags: ['leather', 'work'], genres: ['fantasy', 'medieval', 'western'], priority: 6 },
  { itemId: 'leather_bracers', keywords: ['bracers', 'leather bracers', 'forearm guards', 'arm guards'], tags: ['bracers', 'forearm'], genres: ['fantasy', 'medieval'], priority: 8 },
  { itemId: 'metal_bracers', keywords: ['metal bracers', 'steel bracers', 'armored bracers'], tags: ['metal', 'steel', 'armored'], genres: ['fantasy', 'medieval'], priority: 10 },
  { itemId: 'plate_gauntlets', keywords: ['gauntlets', 'plate gauntlets', 'armored gloves', 'metal gloves'], tags: ['gauntlets', 'plate', 'armored'], genres: ['fantasy', 'medieval'], priority: 11 },
  { itemId: 'archer_gloves', keywords: ['archer', 'bowman', 'archery gloves'], tags: ['archer', 'archery'], genres: ['fantasy'], priority: 8 },
  { itemId: 'ornate_bracers', keywords: ['ornate', 'decorative bracers', 'fancy bracers'], tags: ['ornate', 'decorative', 'fancy'], genres: ['fantasy'], priority: 9 },
  { itemId: 'fingerless_gloves', keywords: ['fingerless', 'half gloves'], tags: ['fingerless'], genres: ['modern', 'cyberpunk', 'postapoc'], priority: 7 },
  { itemId: 'tactical_gloves', keywords: ['tactical gloves', 'combat gloves'], tags: ['tactical', 'combat'], genres: ['war', 'modern', 'cyberpunk'], priority: 9 },
  { itemId: 'cloth_wraps', keywords: ['hand wraps', 'cloth wraps', 'bandaged hands'], tags: ['wraps', 'bandaged'], genres: ['fantasy'], priority: 4 },
  
  // ============== ACCESSORIES ==============
  { itemId: 'leather_belt', keywords: ['belt', 'leather belt'], tags: ['belt', 'leather'], priority: 5 },
  { itemId: 'adventurer_belt', keywords: ['adventurer belt', 'utility belt', 'pouches'], tags: ['adventurer', 'utility', 'pouches'], genres: ['fantasy'], priority: 7 },
  { itemId: 'quiver', keywords: ['quiver', 'arrow quiver', 'arrows'], tags: ['quiver', 'arrows'], genres: ['fantasy'], priority: 9 },
  { itemId: 'shoulder_cape', keywords: ['cape', 'shoulder cape', 'short cape', 'cloak', 'shawl'], tags: ['cape', 'shoulder', 'shawl'], genres: ['fantasy', 'medieval'], priority: 8 },
  { itemId: 'shoulder_armor', keywords: ['pauldrons', 'shoulder armor', 'shoulder guards', 'spaulders'], tags: ['pauldrons', 'shoulder'], genres: ['fantasy', 'medieval'], priority: 9 },
  { itemId: 'pendant', keywords: ['pendant', 'necklace'], tags: ['pendant', 'necklace'], priority: 5 },
  { itemId: 'amulet', keywords: ['amulet', 'talisman', 'charm'], tags: ['amulet', 'talisman', 'charm'], genres: ['fantasy'], priority: 7 },
  { itemId: 'bandolier', keywords: ['bandolier', 'ammo belt', 'bullet belt'], tags: ['bandolier', 'ammo'], genres: ['western', 'war', 'postapoc'], priority: 8 },
  { itemId: 'sash', keywords: ['sash', 'waist sash'], tags: ['sash'], genres: ['fantasy', 'pirate'], priority: 6 },
  { itemId: 'scarf', keywords: ['scarf', 'neck scarf'], tags: ['scarf'], priority: 5 },
  { itemId: 'choker', keywords: ['choker', 'collar'], tags: ['choker', 'collar'], genres: ['cyberpunk', 'punk'], priority: 6 },
  { itemId: 'dog_tags', keywords: ['dog tags', 'military tags'], tags: ['dog tags', 'military'], genres: ['war', 'modern'], priority: 7 },
];

// ============================================================================
// GENRE-SPECIFIC FALLBACK ITEMS
// ============================================================================
const GENRE_FALLBACK_ITEMS: Record<string, Partial<Record<ClothingSlot, string[]>>> = {
  fantasy: {
    torso: ['leather_armor', 'travel_cloak', 'gambeson', 'linen_shirt'],
    legs: ['leather_pants', 'wool_breeches', 'cloth_pants'],
    feet: ['leather_boots', 'soft_boots'],
    hands: ['leather_bracers', 'leather_gloves'],
    accessory: ['adventurer_belt', 'shoulder_cape'],
  },
  dark_fantasy: {
    torso: ['leather_armor', 'assassin_garb', 'studded_leather'],
    legs: ['leather_pants', 'ranger_leggings'],
    feet: ['leather_boots', 'high_boots'],
    hands: ['leather_bracers', 'metal_bracers'],
  },
  medieval: {
    torso: ['chainmail_shirt', 'gambeson', 'plate_armor'],
    legs: ['wool_breeches', 'chainmail_leggings'],
    feet: ['leather_boots', 'plate_boots'],
    hands: ['plate_gauntlets', 'metal_bracers'],
  },
  high_fantasy: {
    torso: ['mage_robes', 'leather_armor', 'noble_doublet'],
    legs: ['flowing_skirt', 'leather_pants', 'cloth_pants'],
    feet: ['elven_boots', 'soft_boots'],
    hands: ['ornate_bracers'],
    head: ['elven_circlet', 'wizard_hat'],
  },
  cyberpunk: {
    torso: ['cyber_jacket', 'leather_jacket', 'hoodie'],
    legs: ['cyber_pants', 'cargo_pants'],
    feet: ['combat_boots', 'thigh_high_boots'],
    hands: ['fingerless_gloves', 'tactical_gloves'],
    head: ['cyber_visor'],
  },
  scifi: {
    torso: ['tactical_vest', 'cyber_jacket'],
    legs: ['cargo_pants', 'cyber_pants'],
    feet: ['combat_boots'],
    hands: ['tactical_gloves'],
  },
  western: {
    torso: ['duster_coat', 'leather_jacket', 'hunters_vest'],
    legs: ['worn_jeans', 'leather_pants'],
    feet: ['leather_boots', 'high_boots'],
    hands: ['leather_gloves'],
    head: ['cowboy_hat', 'bandana'],
    accessory: ['bandolier'],
  },
  modern: {
    torso: ['plain_tshirt', 'hoodie', 'leather_jacket'],
    legs: ['worn_jeans', 'cargo_pants', 'dress_pants'],
    feet: ['sneakers', 'dress_shoes'],
  },
  horror: {
    torso: ['plain_tshirt', 'hoodie'],
    legs: ['worn_jeans'],
    feet: ['sneakers'],
  },
  noir: {
    torso: ['leather_jacket', 'silk_suit'],
    legs: ['dress_pants'],
    feet: ['dress_shoes'],
    head: ['fedora_noir'],
  },
  war: {
    torso: ['tactical_vest', 'heavy_plate_carrier'],
    legs: ['cargo_pants'],
    feet: ['combat_boots', 'heavy_armored_boots'],
    hands: ['tactical_gloves'],
    head: ['tactical_helmet'],
    accessory: ['dog_tags', 'bandolier'],
  },
  postapoc: {
    torso: ['leather_jacket', 'duster_coat'],
    legs: ['cargo_pants', 'leather_pants'],
    feet: ['combat_boots'],
    hands: ['fingerless_gloves'],
    head: ['bandana'],
    accessory: ['bandolier'],
  },
  steampunk: {
    torso: ['leather_corset', 'noble_doublet', 'travel_cloak'],
    legs: ['dress_pants', 'leather_pants'],
    feet: ['leather_boots', 'heeled_boots'],
  },
  pirate: {
    torso: ['pirate_coat', 'linen_shirt'],
    legs: ['wool_breeches'],
    feet: ['high_boots'],
    head: ['tricorn_hat'],
    accessory: ['sash', 'bandolier'],
  },
  victorian: {
    torso: ['noble_doublet', 'leather_corset'],
    legs: ['dress_pants', 'flowing_skirt'],
    feet: ['heeled_boots', 'dress_shoes'],
  },
};

/**
 * Score how well an item matches the detected clothing based on keywords and tags
 */
function scoreItemMatch(match: ClothingMatch, detected: DetectedClothingItem, genre: string): number {
  let score = 0;
  const detectedLower = detected.item.toLowerCase();
  const detectedTags = (detected.tags || []).map(t => t.toLowerCase());
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]+/g, '_');
  
  // Check keyword matches (highest priority)
  for (const keyword of match.keywords) {
    if (detectedLower.includes(keyword) || keyword.includes(detectedLower)) {
      score += 20;
    }
    // Partial word match
    const words = keyword.split(' ');
    for (const word of words) {
      if (word.length > 3 && detectedLower.includes(word)) {
        score += 5;
      }
    }
  }
  
  // Check tag matches
  for (const tag of match.tags) {
    if (detectedTags.includes(tag)) {
      score += 10;
    }
    // Check if detected item name contains the tag
    if (detectedLower.includes(tag)) {
      score += 3;
    }
  }
  
  // Genre bonus
  if (match.genres && match.genres.includes(normalizedGenre)) {
    score += 15;
  }
  
  // Add base priority
  score += match.priority;
  
  return score;
}

/**
 * Find the best matching inventory item for a detected clothing piece
 */
function findBestMatch(detected: DetectedClothingItem, genre: string): ClothingItem | undefined {
  const slot = detected.slot as ClothingSlot;
  
  // Filter matches by slot
  const slotMatches = CLOTHING_MATCHES.filter(m => {
    const item = getClothingById(m.itemId) || BASIC_CLOTHING[m.itemId];
    return item && item.slot === slot;
  });
  
  if (slotMatches.length === 0) return undefined;
  
  // Score all matches
  const scored = slotMatches.map(match => ({
    match,
    score: scoreItemMatch(match, detected, genre),
  })).filter(s => s.score > 0);
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  if (scored.length === 0) return undefined;
  
  // Get the best match
  const bestMatch = scored[0];
  const item = getClothingById(bestMatch.match.itemId) || BASIC_CLOTHING[bestMatch.match.itemId];
  
  console.log(`Matched "${detected.item}" (${slot}) -> "${item?.name}" (score: ${bestMatch.score})`);
  
  return item;
}

/**
 * Get default clothing for a slot based on genre
 */
function getGenreFallback(slot: ClothingSlot, genre: string): ClothingItem | undefined {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]+/g, '_');
  const genreFallbacks = GENRE_FALLBACK_ITEMS[normalizedGenre] || GENRE_FALLBACK_ITEMS.fantasy;
  const itemIds = genreFallbacks[slot];
  
  if (itemIds && itemIds.length > 0) {
    for (const itemId of itemIds) {
      const item = getClothingById(itemId) || BASIC_CLOTHING[itemId];
      if (item) return item;
    }
  }
  
  // Ultimate fallbacks
  switch (slot) {
    case 'torso': return BASIC_CLOTHING.basic_shirt || getClothingById('plain_tshirt');
    case 'legs': return BASIC_CLOTHING.basic_pants || getClothingById('worn_jeans');
    case 'feet': return BASIC_CLOTHING.basic_shoes || getClothingById('leather_boots');
    default: return undefined;
  }
}

/**
 * Map detected clothing items from portrait to actual inventory items
 */
export function mapPortraitClothingToInventory(
  detectedItems: DetectedClothingItem[],
  genre: string
): MappedClothingSet {
  const normalizedGenre = genre.toLowerCase().replace(/[\s-]+/g, '_');
  const items: Partial<Record<ClothingSlot, ClothingItem>> = {};
  const descriptions: string[] = [];
  
  console.log(`Mapping ${detectedItems.length} detected items for genre: ${normalizedGenre}`);
  
  // Process each detected item
  for (const detected of detectedItems) {
    const slot = detected.slot as ClothingSlot;
    
    // Skip if we already have an item for this slot
    if (items[slot]) continue;
    
    // Try to find the best matching item
    const matchedItem = findBestMatch(detected, normalizedGenre);
    
    if (matchedItem) {
      items[slot] = matchedItem;
      descriptions.push(matchedItem.name);
    }
  }
  
  // Ensure minimum coverage (torso, legs, feet)
  const requiredSlots: ClothingSlot[] = ['torso', 'legs', 'feet'];
  for (const slot of requiredSlots) {
    if (!items[slot]) {
      const fallbackItem = getGenreFallback(slot, normalizedGenre);
      if (fallbackItem) {
        items[slot] = fallbackItem;
        descriptions.push(fallbackItem.name);
        console.log(`Using genre fallback for ${slot}: ${fallbackItem.name}`);
      }
    }
  }
  
  const hasDetectedItems = detectedItems.length > 0 && 
    Object.keys(items).some(slot => {
      const detected = detectedItems.find(d => d.slot === slot);
      return detected !== undefined;
    });
  
  return {
    items,
    description: descriptions.length > 0 
      ? `wearing ${descriptions.join(', ')}`
      : 'wearing basic clothing',
    source: hasDetectedItems ? 'portrait_detected' : 'genre_fallback',
  };
}

/**
 * Build a clothing description from mapped items for AI context
 */
export function buildClothingDescriptionFromMapped(mappedSet: MappedClothingSet): string {
  const parts: string[] = [];
  
  const slotOrder: ClothingSlot[] = ['head', 'torso', 'legs', 'feet', 'hands', 'accessory'];
  
  for (const slot of slotOrder) {
    const item = mappedSet.items[slot];
    if (item) {
      parts.push(item.name);
    }
  }
  
  // Check for outfit (replaces torso+legs)
  const outfit = mappedSet.items.outfit;
  if (outfit) {
    return `wearing ${outfit.name}`;
  }
  
  return parts.length > 0 ? `wearing ${parts.join(', ')}` : 'wearing basic clothing';
}

/**
 * Convert mapped clothing set to wardrobe-compatible format
 */
export function convertMappedToWardrobe(mappedSet: MappedClothingSet): {
  equippedItems: { itemId: string; slot: ClothingSlot }[];
  ownedItems: ClothingItem[];
} {
  const equippedItems: { itemId: string; slot: ClothingSlot }[] = [];
  const ownedItems: ClothingItem[] = [];
  
  for (const [slot, item] of Object.entries(mappedSet.items)) {
    if (item) {
      equippedItems.push({ itemId: item.id, slot: slot as ClothingSlot });
      ownedItems.push(item);
    }
  }
  
  return { equippedItems, ownedItems };
}

// Export for testing
export { CLOTHING_MATCHES, GENRE_FALLBACK_ITEMS };
