import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// STYLE LOCK - Semi-realistic digital art style
// ============================================================================
const STYLE_LOCK = `SEMI-REALISTIC digital portrait, high-quality digital painting style, detailed and polished artwork, realistic proportions and anatomy with artistic rendering, smooth skin with subtle texture, professional digital art quality, soft directional lighting, medium depth of field, painterly background, enhanced colors and contrast, detailed eyes with realistic catchlights, natural hair flow with artistic rendering, cinematic color grading, detailed fabric and material textures, game concept art quality, artstation trending, detailed character portrait, realistic lighting on semi-stylized features, NO CARTOON NO ANIME NO CEL-SHADING NO EXAGGERATED FEATURES - maintain believable human proportions with artistic polish`;

// ============================================================================
// PROMPT PRIORITY - Genre-specific semi-realism
// ============================================================================
const PROMPT_RULES = `Generate a SEMI-REALISTIC digital art portrait of this character. The subject should have realistic human proportions and anatomy but rendered in a polished digital painting style - like high-end game concept art or book cover illustration. All features (skin, body, face, hair, clothing) should be detailed and realistic but with the polish and enhancement of professional digital art. The character's setting, clothing, and accessories must match their specified GENRE exactly - fantasy uses medieval/magical elements, modern uses contemporary fashion, western uses frontier clothing, horror uses dark atmospheric settings, etc. DO NOT add futuristic, cyberpunk, neon, or tech elements unless the genre explicitly requires them. Follow ALL character details exactly as specified.`;

// ============================================================================
// CREATIVE FREEDOM - Expanded vocabulary for unrealistic features
// ============================================================================
const CREATIVE_FREEDOM = {
  extraLimbs: ['extra arms', 'multiple arms like deity', 'spider legs from back', 'mantis arms', 'tentacle arms', 'wing arms', 'mechanical extra limbs', 'ethereal ghost arms', 'shadow limbs'],
  insectFeatures: ['mantis claws', 'compound eyes', 'antennae', 'chitinous armor plating', 'insect wings', 'mandibles', 'exoskeleton sections', 'beetle horn', 'moth antennae', 'dragonfly wings'],
  alienAnatomy: ['elongated skull', 'no nose just slits', 'gill slits on neck', 'bioluminescent patches', 'crystalline growths', 'translucent skin sections', 'extra eyes', 'alien skin patterns', 'non-human skin colors'],
  mythicalFeatures: ['dragon horns', 'demon horns', 'angel wings', 'devil tail', 'forked tongue', 'snake lower body', 'centaur body', 'mermaid tail', 'faun legs', 'satyr horns', 'elven ears extreme', 'vampire fangs prominent'],
  impossibleProportions: ['impossibly long legs', 'extremely exaggerated curves', 'giant hands', 'tiny waist extreme', 'massive muscular build', 'ethereally thin', 'towering height implied', 'impossibly long hair'],
  fantasyElements: ['floating hair defying gravity', 'glowing from within', 'partially transparent', 'made of crystal', 'fire for hair', 'water body parts', 'plant growing from skin', 'starfield in eyes', 'galaxy pattern skin'],
  bodyHorror: ['stitched together parts', 'visible bones aesthetic', 'cracked porcelain skin', 'doll joints visible', 'clockwork visible under skin', 'vines growing through', 'coral growths', 'fungal patches'],
  mechanicalExtreme: ['full robot arm', 'mechanical spine visible', 'gear joints', 'steam vents in skin', 'hydraulic limbs', 'screen face', 'cable hair', 'industrial body parts'],
};

// ============================================================================
// SOFT GUIDANCE - Only prevents unwanted additions, not requested features  
// ============================================================================
const SOFT_GUIDANCE = `only avoid adding elements the user did not request - if they describe something, include it no matter how fantastical`;

// ============================================================================
// ANATOMY & MODIFICATION VOCABULARY - Comprehensive AI knowledge base
// ============================================================================

// Facial anatomy vocabulary for precise generation
const FACIAL_FEATURES = {
  eyeShapes: ['almond eyes', 'round eyes', 'hooded eyes', 'monolid eyes', 'upturned eyes', 'downturned eyes', 'deep-set eyes', 'wide-set eyes', 'close-set eyes'],
  noseShapes: ['straight nose', 'roman nose', 'button nose', 'aquiline nose', 'snub nose', 'wide nose', 'narrow nose', 'upturned nose'],
  lipShapes: ['full lips', 'thin lips', 'bow-shaped lips', 'wide lips', 'heart-shaped lips', 'asymmetrical lips'],
  jawlines: ['sharp jawline', 'soft jawline', 'square jaw', 'rounded jaw', 'angular jaw', 'v-shaped jaw', 'prominent chin', 'cleft chin'],
  cheekbones: ['high cheekbones', 'flat cheekbones', 'prominent cheekbones', 'subtle cheekbones', 'hollow cheeks'],
  brows: ['arched brows', 'straight brows', 'thick brows', 'thin brows', 'feathered brows', 'angular brows', 'soft brows'],
};

// Body proportion vocabulary
const BODY_ANATOMY = {
  builds: ['slim', 'athletic', 'muscular', 'curvy', 'petite', 'tall and lean', 'broad-shouldered', 'hourglass', 'pear-shaped', 'inverted triangle', 'rectangle build'],
  muscleDefinition: ['toned muscles', 'defined abs', 'visible muscle definition', 'soft physique', 'bodybuilder physique', 'swimmer build', 'dancer physique', 'martial artist build'],
  skinTextures: ['smooth skin', 'freckled skin', 'sun-kissed skin', 'weathered skin', 'porcelain skin', 'skin with beauty marks', 'vitiligo patches'],
};

// Accessory vocabulary for AI understanding
const ACCESSORIES_VOCAB = {
  eyewear: ['round glasses', 'aviator sunglasses', 'cat-eye glasses', 'rectangular frames', 'rimless glasses', 'cybernetic visor', 'AR glasses', 'monocle', 'welding goggles', 'tactical goggles'],
  headwear: ['beanie', 'fedora', 'beret', 'bandana', 'headband', 'hair clips', 'hair pins', 'tiara', 'circlet', 'hood', 'helmet'],
  neckwear: ['choker', 'pendant necklace', 'layered chains', 'collar', 'scarf', 'bandana', 'dog tags', 'statement necklace', 'pearl necklace'],
  earAccessories: ['stud earrings', 'hoop earrings', 'dangle earrings', 'ear cuffs', 'industrial bar', 'multiple ear piercings', 'gauge earrings', 'climber earrings'],
  handAccessories: ['rings on multiple fingers', 'statement ring', 'bracelet stack', 'cuff bracelet', 'watch', 'fingerless gloves', 'hand tattoos', 'henna patterns'],
};

// Cosmetic surgery and enhancements vocabulary
const COSMETIC_ENHANCEMENTS = {
  facialSurgery: ['refined nose', 'subtle lip fillers', 'defined cheekbone implants', 'chin augmentation', 'brow lift appearance', 'cat-eye lift'],
  bodyEnhancements: ['enhanced curves', 'sculpted physique', 'subtle augmentation', 'athletic enhancement'],
  skinTreatments: ['flawless skin', 'glass skin effect', 'dewy skin', 'matte skin finish', 'luminous complexion'],
};

// Cybernetic and augmentation vocabulary
const AUGMENTATIONS = {
  cyberneticLimbs: ['chrome cybernetic arm', 'matte black prosthetic leg', 'skeletal mechanical hand', 'sleek bionic arm with visible servos', 'military-grade prosthetic', 'elegant chrome fingers'],
  cyberneticEyes: ['glowing cybernetic eyes', 'red optical implant', 'camera-lens eye', 'multi-spectrum cyber eyes', 'targeting reticle in iris'],
  neuralImplants: ['visible neural port on temple', 'data jack behind ear', 'glowing circuitry under skin', 'cranial interface plate'],
  bodyAugments: ['subdermal armor plating', 'visible spine reinforcement', 'enhanced musculature with visible tech', 'breathing apparatus integration'],
};

// Piercing vocabulary with specific placements
const PIERCING_VOCAB = {
  facial: ['septum ring', 'nostril stud', 'bridge piercing', 'eyebrow piercing', 'lip ring', 'labret', 'medusa piercing', 'snake bites', 'monroe piercing'],
  ear: ['helix piercing', 'tragus', 'conch', 'daith', 'rook', 'industrial bar', 'forward helix', 'anti-tragus', 'stretched lobes'],
  body: ['navel piercing', 'surface piercings', 'dermal anchors', 'nipple piercings (implied/covered)'],
  materials: ['gold jewelry', 'silver jewelry', 'titanium jewelry', 'black metal jewelry', 'rose gold jewelry', 'gemstone studs', 'minimalist jewelry'],
};

// Tattoo vocabulary with styles and placements
const TATTOO_VOCAB = {
  styles: ['fine-line tattoos', 'blackwork tattoos', 'traditional tattoos', 'neo-traditional', 'watercolor tattoos', 'geometric tattoos', 'tribal patterns', 'Japanese irezumi', 'dotwork', 'realistic portrait tattoos', 'minimalist tattoos', 'ornamental tattoos'],
  placements: ['neck tattoo', 'hand tattoos', 'finger tattoos', 'forearm sleeve', 'full sleeve', 'chest piece', 'back piece', 'shoulder tattoo', 'collarbone tattoo', 'behind ear tattoo', 'face tattoo'],
  subjects: ['floral tattoos', 'skull imagery', 'animal tattoos', 'script lettering', 'symbolic tattoos', 'abstract patterns', 'celestial designs', 'botanical illustrations'],
};

// Scar vocabulary
const SCAR_VOCAB = {
  types: ['thin scar line', 'raised keloid scar', 'burn scar texture', 'surgical scar', 'battle scar', 'healed wound scar', 'scattered small scars', 'dramatic facial scar'],
  placements: ['scar across eyebrow', 'cheek scar', 'lip scar', 'neck scar', 'hand scars', 'forearm scars', 'knuckle scars'],
};

// Mutation vocabulary for fantasy/sci-fi
const MUTATION_VOCAB = {
  subtle: ['heterochromia', 'unusually colored eyes', 'pointed ears', 'elongated canines', 'unnaturally colored hair', 'bioluminescent markings'],
  moderate: ['scaled patches of skin', 'feathered accents', 'small horns', 'tail (visible)', 'clawed fingertips', 'patterned skin like animal'],
  dramatic: ['full body scales', 'large horns', 'wings (folded)', 'multiple eyes', 'inhuman skin color', 'ethereal glow'],
};

// Function to get relevant vocabulary hints based on user input
function getAnatomyHints(body: any): string[] {
  const hints: string[] = [];
  
  // Add facial structure hints
  if (body.faceShape) hints.push(`${body.faceShape} face`);
  
  // Add accessory-specific vocabulary
  if (body.accessories?.length) {
    body.accessories.forEach((acc: string) => {
      const lowerAcc = acc.toLowerCase();
      if (lowerAcc.includes('glass') || lowerAcc.includes('sunglass')) hints.push('wearing eyewear');
      if (lowerAcc.includes('earring') || lowerAcc.includes('ear')) hints.push('decorative ear jewelry');
      if (lowerAcc.includes('necklace') || lowerAcc.includes('chain')) hints.push('neckwear jewelry');
      if (lowerAcc.includes('ring') || lowerAcc.includes('bracelet')) hints.push('hand jewelry');
    });
  }
  
  // Add muscle definition hints
  if (body.muscleDefinition) {
    const muscle = body.muscleDefinition.toLowerCase();
    if (muscle.includes('athletic') || muscle.includes('toned')) hints.push('visible muscle definition');
    if (muscle.includes('muscular') || muscle.includes('built')) hints.push('pronounced muscular physique');
  }
  
  return hints;
}

// ============================================================================
// GENDER CUT OPTIONS - Tailored silhouettes by gender (genre-universal)
// ============================================================================
const CUT_OPTIONS: Record<string, string> = {
  female: 'tailored silhouette with fitted waist options, structured shoulders, layered genre-appropriate garments, coverage is functional not revealing, clothing style matches the specified genre',
  male: 'tailored silhouette with structured shoulders, fitted or relaxed cuts, layered genre-appropriate garments, coverage is functional not revealing, clothing style matches the specified genre',
  other: 'tailored silhouette with structured shoulders, versatile fitted cuts, layered genre-appropriate garments, coverage is functional not revealing, clothing style matches the specified genre',
};

// ============================================================================
// GENRE STYLING MODULES - Immersive genre-specific details (EXPANDED 3x)
// ============================================================================
interface GenreStyle {
  background: string;
  clothing: string;
  accessories: string;
  jewelry: string;
  footwear: string;
  hairStyling: string;
  makeup: string;
  tattooStyle: string;
  weathering: string;
  props: string;
}

const GENRE_STYLES: Record<string, GenreStyle> = {
  // ============================================================================
  // 🏰 FANTASY (Main + Sub-genres)
  // ============================================================================
  fantasy: {
    background: 'ancient forest clearing with mystical fog, standing stones, bioluminescent fungi, dappled sunlight through canopy, moss-covered ruins',
    clothing: 'layered travel wear: gambeson or jerkin with quilted stitching, cloaklet or shawl with embroidered hem, belt pouches in aged leather, bracers with tooled patterns, worn leather and undyed wool, visible hand stitching, linen undertunic, wrapped leg bindings',
    accessories: 'leather satchel with brass clasps, belt knife in decorated sheath, herb pouch, waterskin, rope coil, wax-sealed scroll case, traveler staff',
    jewelry: 'artisan hammered silver jewelry, small rough-cut gem studs, subtle chain from helix to lobe, twisted wire rings, bone or antler toggles, carved wooden pendant',
    footwear: 'worn leather boots with visible wear patterns, wrapped cloth leg bindings, turned-down boot cuffs, brass buckles',
    hairStyling: 'practical braids with leather wraps, loose natural waves, decorative hair beads, small braided sections, windswept appearance',
    makeup: 'minimal and weathered, soft kohl around eyes, wind-chapped lips, natural flush on cheeks, freckles from sun exposure, dirt smudges',
    tattooStyle: 'old-world ink language: knotwork patterns, runic script, botanical sigils, charcoal-faded, aged appearance, tribal patterns, moon phases',
    weathering: 'dust on clothing hems, minor tears mended with visible stitching, leather darkened from use, fabric fading from sun',
    props: 'none held, ambient magical particles, glowing runes on nearby stones',
  },
  medieval: {
    background: 'torch-lit stone castle halls with tapestries, heraldic banners, arrow-slit windows, worn flagstone floors, iron chandeliers with candles',
    clothing: 'layered court wear: brocade surcoat over linen chemise, fitted sleeves with decorative cuffs, wide leather belt with ornate buckle, wool hose, fur-trimmed collar, embroidered hem details',
    accessories: 'coin purse on belt, small eating knife, signet ring, prayer beads, folded parchment, quill case',
    jewelry: 'hammered gold or silver with heraldic motifs, small gem studs, chain of office, brooch with family crest, pearl drops',
    footwear: 'pointed leather shoes with buckles, turned-down boot cuffs, poulaine toe style, velvet slippers',
    hairStyling: 'elaborate braided updos, hair nets with pearl accents, flowing with circlet, coiled styles, hennin-compatible',
    makeup: 'pale complexion ideal, subtle rose lip tint, minimal kohl, natural brows, refined and noble appearance',
    tattooStyle: 'rare and hidden, old-world knotwork if visible, pilgrimage marks, charcoal-faded monastery ink',
    weathering: 'rich fabrics show careful maintenance, minor dust from stone halls, candlewax drops',
    props: 'none held, background shows candelabras, shield on wall',
  },
  dark_fantasy: {
    background: 'cursed gothic realm with twisted black spires, blood-red sky with unnatural aurora, dead trees with hanging moss, crumbling stone architecture, perpetual twilight',
    clothing: 'layered dark armored travel wear: reinforced black gambeson with silver clasps, hooded cloak with tattered hem, belt with skull motifs, spiked bracers with leather straps, dark leather and charcoal wool, bone toggles, asymmetric layering',
    accessories: 'black leather satchel with iron hardware, ritual dagger in ornate sheath, vial collection on belt, raven feather tokens, dried herb bundles, occult tome',
    jewelry: 'oxidized silver jewelry with occult motifs, small onyx studs, thorn-shaped chain details, raven skull pendants, black pearl drops, serpent rings',
    footwear: 'heavy leather boots with iron-capped toes, buckled straps up calf, worn soles, dark material',
    hairStyling: 'wild and dramatic, stark white streaks, elaborate dark updos, asymmetric cuts, partially obscuring face',
    makeup: 'moody and dramatic, smoky eyes with dark pigment, deeper black-cherry lip stain, pallor undertone, visible veins at temples, shadowed under-eyes',
    tattooStyle: 'old-world occult ink: sigils, thorns, death moths, occult geometry, elegant linework, curse marks, blood magic symbols',
    weathering: 'clothing appears aged and distressed, subtle bloodstains on edges, tears from battle, ash and soot',
    props: 'none held, ambient dark particles, ravens in background, bones scattered',
  },
  high_fantasy: {
    background: 'crystalline magical citadel floating among clouds, rainbow light refracting through crystal spires, floating islands with waterfalls, aurora in sky, magical energy visible',
    clothing: 'magnificent enchanted robes with subtle glowing sigils, elven-crafted layered garments of impossible fabrics, royal magical vestments, practical but elegant design, starlight-woven threads, gossamer layers, mithril threading',
    accessories: 'floating magical focus, enchanted quiver, spell component pouch with rune embroidery, magical familiar companion, arcane focus crystal, grimoire with glowing pages',
    jewelry: 'enchanted silver and mithril jewelry with inner light, small crystalline studs that glow softly, delicate arcane chains with floating charms, circlet with focusing gem, living metal rings',
    footwear: 'elegant soft leather boots with elven craftsmanship, pointed toes, silver threading, leaves and vines motif',
    hairStyling: 'flowing ethereal styles, hair moves as if underwater, starlight caught in strands, braids with magical flowers, crystalline hair ornaments',
    makeup: 'ethereal and luminous, subtle shimmer on skin, soft natural colors enhanced by inner glow, glittering accents, otherworldly beauty',
    tattooStyle: 'magical ink that shifts and moves: arcane runes, starlight patterns, glowing sigils, mystical symbols, constellation maps on skin',
    weathering: 'immaculately maintained by magic, subtle dust of starlight, pristine condition',
    props: 'none held, ambient magical particles, floating light motes, arcane diagrams in air',
  },
  sword_and_sorcery: {
    background: 'ancient temple ruins in jungle, massive stone idol, treasure scattered, torchlight and shadows, mysterious glyphs glowing',
    clothing: 'minimal practical combat wear: leather harness, arm wraps, loincloth or short kilt, fur cloak, bare midriff with toned muscle visible, gladiator-style strapping',
    accessories: 'jeweled armband stolen from temple, belt with pouches, rope, torch holder, key ring with ancient keys',
    jewelry: 'gold armbands with serpent motifs, crude gem-set rings, tooth necklace, tribal ear weights, stolen royal jewelry',
    footwear: 'wrapped leather sandals, bare feet with calluses, ankle wraps, simple boots',
    hairStyling: 'wild and untamed, long flowing mane, warrior braids, decorated with bones or feathers',
    makeup: 'war paint in tribal patterns, natural weathered skin, scars visible, fierce expression',
    tattooStyle: 'tribal warrior ink: bold black patterns, ritual scarification marks, conquest symbols, crude but powerful designs',
    weathering: 'heavily weathered, sweat-sheened, dust and dried blood, battle-worn',
    props: 'none held, background shows treasure piles, ancient weapons',
  },
  fairy_tale: {
    background: 'enchanted cottage in magical forest, talking flowers, friendly woodland creatures, rainbow lighting, candy-colored mushrooms, glittering path',
    clothing: 'storybook attire: flowing dress with corseted bodice, puffed sleeves, ribbon details, peasant blouse with embroidery, charming apron, fairy godmother approved aesthetic',
    accessories: 'wicker basket with contents, flower crown materials, magical wand subtle, letter with wax seal, golden key, enchanted mirror',
    jewelry: 'delicate silver or gold, heart-shaped lockets, charm bracelets with story symbols, glass slipper motifs, tiny crowns',
    footwear: 'dainty slippers with bows, ballet-flat style, glass-like shoes, embroidered fabric shoes',
    hairStyling: 'long flowing locks with natural waves, adorned with flowers, braided crown, ribbon interwoven, golden highlights',
    makeup: 'rosy cheeks, dewy skin, natural pink lips, bright eyes, innocent and wholesome beauty',
    tattooStyle: 'hidden or none, if present: tiny roses, stars, butterflies, extremely delicate and whimsical',
    weathering: 'pristine and fresh, morning dew drops, flower petals caught in clothing',
    props: 'none held, butterflies and birds nearby, sparkles in air',
  },

  // ============================================================================
  // 🚀 SCI-FI (Main + Sub-genres)
  // ============================================================================
  scifi: {
    background: 'sleek starship bridge with holographic displays, viewport to stars and nebula, blue ambient lighting, clean white surfaces, floating data readouts',
    clothing: 'clean utility suit or jumpsuit with rank insignia, modular panels for equipment attachment, magnetic seam closures, smart-fabric texture with subtle circuitry, compact harness straps for zero-g, geometric cut lines, color-coded department stripes',
    accessories: 'wrist-mounted communicator, data tablet, security badge with holographic display, portable scanner, utility tool on hip, earpiece communicator',
    jewelry: 'ceramic and titanium minimal jewelry, micro-LED pinpoints extremely subtle, rank pins, commemorative badges, neural interface visible at temple',
    footwear: 'magnetic-soled boots, streamlined design, ankle support for ship work, color-matched to uniform',
    hairStyling: 'practical and regulation, neat ponytails, short efficient cuts, subtle futuristic highlights, maintained appearance',
    makeup: 'future clean: matte finish foundation, precise liner, subtle highlight, sharp grooming, minimal but polished',
    tattooStyle: 'crisp data-geometry: hex-grid fades, circuit filigree, barcode-like linework, crew memorial marks, no readable text',
    weathering: 'immaculately maintained uniform, slight wear on high-contact areas, coffee stain on sleeve if casual',
    props: 'none held, floating holographic displays in background, control panels',
  },
  sci_fi: {
    background: 'advanced space station with panoramic view of nebula, curved corridors, plant integration, observation deck with stars',
    clothing: 'form-fitting flight suit with reinforced joints, modular armor attachment points, temperature-regulating fabric, pilot insignia, mission patches',
    accessories: 'pilot helmet nearby, flight gloves, navigation computer on wrist, survival kit on belt, oxygen monitor',
    jewelry: 'squadron commemorative pins, subtle ear studs, wedding band if applicable, neural jack port visible',
    footwear: 'flight boots with ankle support, magnetic treads, fire-resistant material',
    hairStyling: 'helmet-compatible styles, braided close to head, buzz cuts, practical ponytails',
    makeup: 'minimal for practicality, clear skin, natural appearance, health-optimized',
    tattooStyle: 'squadron symbols, star maps, memorial dates, circuit-inspired patterns, ship silhouettes',
    weathering: 'slight wear from EVA suits, pressure marks on skin, pilot tan lines',
    props: 'none held, cockpit displays visible, star charts',
  },
  space_opera: {
    background: 'grand imperial starship throne room with galactic map hologram, ornate columns, dramatic lighting, massive viewport showing fleet',
    clothing: 'dramatic flowing cape over fitted space uniform with gold trim, ceremonial jumpsuit with medals and honors, regal cosmic attire with modular panels, high collar, epaulettes, sash of office',
    accessories: 'ceremonial sidearm holster, command cylinder, diplomatic credentials, personal shield generator, servant droids nearby',
    jewelry: 'polished titanium with precious gem inlays, status insignia pins, rank chains of gold, family crest, crown or coronet for royalty',
    footwear: 'polished knee-high boots with metallic trim, ceremonial design, impeccable condition',
    hairStyling: 'elaborate formal styles, swept back with authority, silver streaks of distinction, crown-compatible, regal bearing',
    makeup: 'refined and commanding: defined features, subtle power highlight, flawless complexion, authority presence',
    tattooStyle: 'cosmic nobility ink: constellation maps, nebula patterns, galactic symbols, metallic ink accents, dynasty marks',
    weathering: 'absolutely pristine, immaculate presentation, no wear visible',
    props: 'none held, throne or command chair visible, honor guard in background',
  },
  cyberpunk: {
    background: 'rain-soaked neon megacity with holographic advertisements, towering corporate skyscrapers, street-level market stalls, steam vents, flying vehicles overhead, mixed languages on signs',
    clothing: 'techwear layers: modular tactical vest with glowing accents, strapped harnesses, matte polymer armor plates, subtle neon accent seams, hooded rain-resistant jacket, cargo pants with tech pockets, urban survival gear',
    accessories: 'retractable cable on wrist, hacking deck in bag, smart-lenses, AR overlay glasses, encrypted commlink, electronic lockpicks, credstick holder',
    jewelry: 'industrial titanium and chrome jewelry, geometric shapes with LED accents, micro LEDs extremely subtle, data-chip earrings, subdermal LED patterns visible',
    footwear: 'heavy platform boots with shock absorption, integrated display on heel, magnetic soles, weatherproof material',
    hairStyling: 'bold colors with neon highlights, undercuts, asymmetric styles, fiber-optic hair extensions, holographic hair dye',
    makeup: 'sharper and edgier: metallic liner, defined brows, glossy highlight, chrome lip, subdermal glow, beauty marks as data ports',
    tattooStyle: 'high-contrast blackwork with geometric florals, circuitry framing, corporate barcode on neck, gang territory marks, animated smart-ink',
    weathering: 'rain-soaked, neon reflections on wet surfaces, urban grime on boots, slight rust on chrome',
    props: 'none held, neon signs reflected in puddles, holographic ads floating',
  },
  hard_scifi: {
    background: 'realistic spacecraft interior with exposed pipes, practical design, cramped quarters, safety warnings, tool racks, dim emergency lighting',
    clothing: 'practical engineering jumpsuit with tool loops, thermal underlayer visible at collar, radiation badge, company logo, safety harness attachment points, heavy-duty fabric',
    accessories: 'multi-tool on belt, safety tether clip, dosimeter, work gloves clipped, headlamp, communication badge',
    jewelry: 'wedding band only, medical alert bracelet, ID tags on chain',
    footwear: 'steel-toed magnetic boots, worn treads, scuff marks, safety yellow accents',
    hairStyling: 'extremely practical, short buzz cuts, tight ponytails, contained styles for safety',
    makeup: 'none, natural skin with visible pores, realistic complexion, stress lines',
    tattooStyle: 'personal memorial ink, measurement tattoos on arm, union symbols, minimalist',
    weathering: 'grease stains, minor burns, callused hands, tired appearance, sweat marks',
    props: 'none held, tools scattered in background, safety notices visible',
  },
  alien_world: {
    background: 'bizarre extraterrestrial landscape with twin suns, purple vegetation, floating rocks, unknown creatures in distance, unfamiliar constellations',
    clothing: 'xenobiology field suit with environmental sensors, adaptive camouflage patches, specimen collection pouches, breathing apparatus ready, first-contact symbols on shoulder',
    accessories: 'universal translator device, specimen containers, field scanner, emergency beacon, diplomatic gift pouch',
    jewelry: 'bio-monitoring implants visible, cultural exchange gifts worn, neutral universal symbols',
    footwear: 'terrain-adaptive boots, sealed against unknown pathogens, thick soles for strange ground',
    hairStyling: 'contained in suit-compatible styles, short practical cuts, sealed when needed',
    makeup: 'none, natural appearance, slight alien pollen on skin, wonder expression',
    tattooStyle: 'star charts of explored systems, first-contact commemorative marks, species identification symbols',
    weathering: 'dust from alien world, minor tears from exploration, specimen stains',
    props: 'none held, alien creatures in background, unfamiliar plants',
  },

  // ============================================================================
  // 💀 HORROR (Main + Sub-genres)
  // ============================================================================
  horror: {
    background: 'abandoned asylum corridor with flickering fluorescent lights, peeling wallpaper, wheelchair abandoned, shadows moving unnaturally, fog seeping under doors',
    clothing: 'long coat or layered dark outfit with distressed textures, asymmetric layering, rain sheen on fabric, heavy fabric drape, frayed edges, clothing that conceals, muted earth and black tones',
    accessories: 'flashlight in pocket, crumpled notes, old key ring, protective charm hidden, matches, small blade',
    jewelry: 'oxidized metal jewelry with subtle thorn motifs, subtle protective chains, cross or occult symbol depending on character, worn pieces',
    footwear: 'heavy boots suitable for running, worn soles, laced tightly, practical and quiet',
    hairStyling: 'disheveled from stress, escaping from practical style, wet from rain or sweat, obscuring face partially',
    makeup: 'moody: smoky eyes with running makeup, deeper lip stain smudged, under-eye shadows, pallor tone, visible stress',
    tattooStyle: 'fine occult sigils, moths, thorns, protection symbols, elegant linework not messy, hidden meanings',
    weathering: 'rain-soaked, torn clothing, dried blood on edges, mud splattered, desperate wear',
    props: 'none held, shadows with wrong shapes, something moving in distance',
  },
  gothic_horror: {
    background: 'crumbling Victorian manor at night, lightning flashing, gargoyles on roof, dead garden with gnarled trees, mist rising from graves, candles in windows',
    clothing: 'Victorian mourning attire: high-collared black dress or coat with jet buttons, lace details yellowed with age, bustle or tailcoat, black crepe fabric, widow weeds',
    accessories: 'mourning jewelry box, black-edged handkerchief, faded photograph, wilted flowers, silver hand mirror, skeleton key',
    jewelry: 'jet mourning jewelry, hair jewelry from deceased, cameo of lost loved one, black pearls, silver locket',
    footwear: 'buttoned Victorian boots, pointed toes, worn heels, black fabric',
    hairStyling: 'severe center part, tight bun or flowing in wind, black ribbons, grey streaks from fear',
    makeup: 'deathly pale, dark circles, bitten lips, tear tracks through powder',
    tattooStyle: 'memento mori symbols, skulls with roses, mourning imagery, Victorian death culture',
    weathering: 'dusty from old manor, cobwebs on clothing, candle wax drips, aged fabric',
    props: 'none held, gravestones visible, lightning illuminating',
  },
  vampire: {
    background: 'opulent Victorian manor with velvet drapes, candlelit shadows, mirrors avoided, blood-red accents, ornate furniture, centuries of collected art',
    clothing: 'aristocratic gothic layered outfit: high collar concealing neck, ornate waistcoat with silver threading, antique formal wear, cape with red lining, corset with boning, period-perfect eternal elegance',
    accessories: 'antique walking cane with hidden blade, pocket watch that never advances, love letters from centuries ago, vintage opera glasses',
    jewelry: 'antique silver with blood-red gems, delicate filigree work, cameo pieces of lost loves, signet ring with family crest, choker concealing bite marks',
    footwear: 'polished period boots, clicking heels, immaculate despite age, dancing shoes',
    hairStyling: 'elaborate period styles, perfectly maintained despite years, dramatic sweeping styles, severe elegance',
    makeup: 'pale ethereal: porcelain finish, dramatic smoky eyes with red accents, deep rich blood-red lips, inhuman beauty',
    tattooStyle: 'Victorian occult: roses with thorns, memento mori symbols, lovers marks, elegant concealed linework',
    weathering: 'clothes pristine but centuries old, slight dust of tomb, candlelit sheen',
    props: 'none held, candles dripping, portrait on wall shows younger version',
  },
  zombie: {
    background: 'barricaded safe house with boarded windows, emergency supplies scattered, bloody handprints on glass, shadows of horde outside, makeshift weapons ready',
    clothing: 'post-outbreak tactical layers: cargo pants with full pockets, combat boots laced tight, improvised protective gear, practical survivalist outfit, layers for bite protection, blood-stained',
    accessories: 'empty magazine pouches, water purification tablets, first aid supplies, walkie-talkie, ration bars, photos of lost family',
    jewelry: 'minimal functional pieces, worn dog tags of fallen friend, simple studs that wont snag, wedding ring despite loss',
    footwear: 'sturdy combat boots, reinforced toes, worn but maintained, blood-splattered',
    hairStyling: 'practical survival cut, buzz or tight ponytail, grown out from stress, unwashed appearance',
    makeup: 'survival weathered: dirt smudges, stress lines, dehydration visible, minimal effort, bite-check scars',
    tattooStyle: 'faded pre-outbreak ink, worn over time, cracked appearance, new tally marks for days survived',
    weathering: 'heavily worn, blood stains both old and fresh, sweat, dirt, survival desperation visible',
    props: 'none held, barricade visible, emergency lighting',
  },
  cosmic_horror: {
    background: 'impossible geometry chamber, non-Euclidean architecture, stars visible through solid walls, sanity-breaking vistas, colors that shouldnt exist',
    clothing: 'disheveled academic wear: rumpled suit, loose tie, shirt untucked, coat thrown on, clothing from before the revelation, paper notes stuffed in pockets',
    accessories: 'ancient tome with unreadable text, brass instruments of measurement, sketches of impossible things, empty laudanum bottles',
    jewelry: 'strange artifact found at site, protective symbol that does nothing, ring that feels wrong, pendant thats always cold',
    footwear: 'formal shoes inappropriate for fleeing, scuffed and dirty, one lace broken',
    hairStyling: 'wild and unkempt, pulled at in distress, grey appearing overnight, standing on end',
    makeup: 'none intentional, pallor of shock, wide unblinking eyes, nosebleed dried, hollow appearance',
    tattooStyle: 'symbols appearing unbidden on skin, mathematical formulae, elder signs drawn in desperation',
    weathering: 'ink stains on hands, paper cuts, clothes slept in, trembling visible',
    props: 'none held, geometry warping in background, stars moving wrong',
  },
  slasher: {
    background: 'abandoned summer camp at night, lake reflecting moon, cabin windows dark, trees hiding shapes, path disappearing into fog',
    clothing: 'typical teen wear now torn: jeans with rips, tank top or t-shirt, hoodie tied at waist, practical shoes for running, blood not their own',
    accessories: 'car keys clutched, dead phone, found flashlight, improvised weapon nearby',
    jewelry: 'friendship bracelet from victim, simple earrings, class ring',
    footwear: 'running shoes, one missing if dramatic, mud-covered',
    hairStyling: 'messy from running, escaping ponytail, wet and clinging, twigs caught in it',
    makeup: 'mascara running from tears, sweat-smeared, natural fear expression',
    tattooStyle: 'small hidden tattoos if any, friendship symbols, minimal',
    weathering: 'torn clothing, sweat-soaked, branch scratches, desperate state',
    props: 'none held, shadows between trees, light source behind them',
  },

  // ============================================================================
  // 🕵️ MYSTERY/NOIR (Main + Sub-genres)
  // ============================================================================
  mystery: {
    background: 'rain-slicked city alley at night with neon reflections in puddles, fire escape ladders, steam from grates, distant police sirens, shadowy doorways',
    clothing: 'tailored trench coat with upturned collar, turtleneck or blouse underneath, leather gloves, wool and tweed accents, practical yet stylish layers, neutral professional tones',
    accessories: 'notepad in pocket, magnifying glass, discrete camera, lock pick set hidden, cigarette case, business cards',
    jewelry: 'refined minimal metal jewelry, small hoops and studs, vintage watch, signet ring, simple chain',
    footwear: 'practical leather shoes with low heel, suitable for chasing or stakeouts, polished but worn',
    hairStyling: 'practical elegance, swept back, fedora-compatible if applicable, rain-resistant styles, controlled waves',
    makeup: 'classic noir: clean defined brows, subtle contour, muted lip, sharp grooming, fatigue visible',
    tattooStyle: 'mostly concealed, visible parts fine-line and tasteful, clean black ink, personal meaning',
    weathering: 'rain-dampened, slight wear from long hours, collar turned up, cigarette smell',
    props: 'none held, shadow of figure in distance, rain falling',
  },
  noir: {
    background: 'smoke-filled 1940s detective office with venetian blind shadows, desk lamp as only light, whiskey bottle, case files scattered, typewriter, fedora on hook',
    clothing: 'classic noir attire: double-breasted suit or pencil dress, suspenders visible, loosened tie, white shirt with rolled sleeves, skirt suit with seams, period-accurate tailoring',
    accessories: 'cigarette holder, flask, revolver in drawer nearby, case notes, vintage telephone, fountain pen',
    jewelry: 'Art Deco pieces, small geometric studs, chain watch, wedding band possibly removed',
    footwear: 'two-tone oxfords, T-strap heels, polished but showing miles walked',
    hairStyling: 'period-perfect waves, finger curls, Veronica Lake sweep, brilliantine shine, fedora-compatible',
    makeup: 'classic Hollywood: defined brows, subtle contour, red lipstick, porcelain powder, glamorous despite fatigue',
    tattooStyle: 'era-inappropriate so concealed or none, military tattoo if veteran, simple and hidden',
    weathering: 'whiskey-stained reports, cigarette burns on desk, late-night exhaustion visible',
    props: 'none held, venetian blind shadows falling across scene, smoke curling',
  },
  detective: {
    background: 'modern police precinct, evidence boards with photos and string, coffee cups everywhere, harsh fluorescent lighting, case files stacked',
    clothing: 'rumpled professional attire: blazer over button-up, badge on belt, comfortable pants, practical layers for long shifts',
    accessories: 'police badge, handcuffs visible on belt, radio, notebook, coffee cup (probably cold), evidence bags',
    jewelry: 'minimal, service watch, wedding ring or tan line where it was',
    footwear: 'comfortable professional shoes, worn from chasing suspects',
    hairStyling: 'quick morning style, practical, showing late nights',
    makeup: 'minimal, exhaustion visible, professional but tired',
    tattooStyle: 'hidden under sleeves, personal meaning, possibly memorial for fallen partner',
    weathering: 'coffee stains, wrinkled from sleeping at desk, badge worn bright from handling',
    props: 'none held, murder board visible in background',
  },
  spy: {
    background: 'Monte Carlo casino with crystal chandeliers, high-stakes atmosphere, elegant patrons, tuxedos and gowns, dangerous glamour',
    clothing: 'immaculately tailored formal wear: custom suit or evening gown, concealed tactical elements under elegance, subtle bulletproof lining, quick-release seams, luxury accessories',
    accessories: 'hidden earpiece, watch with gadgets, wallet with false identities, cigarette case with camera, cufflinks with tools',
    jewelry: 'luxury pieces that double as weapons, elegant watch, diamond studs, cufflinks with hidden compartments',
    footwear: 'formal shoes with hidden blades in heel, dancing capable, running capable, custom made',
    hairStyling: 'sophisticated formal styles, helmet of perfection, not a hair out of place, transformable for disguise',
    makeup: 'flawless polished, sophisticated, commanding, makeup kit for disguise changes',
    tattooStyle: 'completely concealed or none, identity must be deniable',
    weathering: 'absolutely pristine, perfect presentation, deadly underneath',
    props: 'none held, roulette wheel spinning, target across room',
  },
  cozy_mystery: {
    background: 'charming small-town bookshop or bakery, cat sleeping in window, rain outside, tea service ready, clues hidden in decor',
    clothing: 'comfortable professional attire: cardigan over blouse, practical skirt or trousers, cozy layers, reading glasses on chain',
    accessories: 'tea cup, mystery novel, knitting needles, cat treats, magnifying glass for reading',
    jewelry: 'vintage pieces inherited, charm bracelet with meaningful tokens, readers glasses',
    footwear: 'comfortable flats, house slippers, sensible walking shoes',
    hairStyling: 'soft natural styles, grey embraced beautifully, comfortable and practical',
    makeup: 'natural and minimal, soft colors, approachable warmth',
    tattooStyle: 'small hidden sentimental piece if any, grandmother would approve',
    weathering: 'flour dusting if baker, book dust, ink-stained fingers',
    props: 'none held, cat nearby, steam from tea',
  },
  thriller: {
    background: 'anonymous city intersection, surveillance cameras visible, everyone a suspect, phone in hand, looking over shoulder',
    clothing: 'nondescript modern layers: jacket that blends in, practical pants, running shoes, forgettable by design, hidden pockets',
    accessories: 'burner phone, cash in various currencies, multiple passports nearby, go-bag ready',
    jewelry: 'none that identifies, nothing memorable, completely anonymous',
    footwear: 'running shoes, broken in, ready to flee',
    hairStyling: 'could be anyone, changeable, unremarkable by choice',
    makeup: 'enough to look different, contouring to change face shape, forgettable',
    tattooStyle: 'none visible, identity is fluid',
    weathering: 'showing signs of constant alertness, paranoia visible, always watching exits',
    props: 'none held, reflection in window shows follower',
  },

  // ============================================================================
  // 🏴‍☠️ PIRATE (Main + Sub-genres)
  // ============================================================================
  pirate: {
    background: 'deck of a galleon at sea with sails billowing, golden sunset through rigging, ocean spray, wooden railings worn smooth, ropes and pulleys',
    clothing: 'sea-worn linen shirt with wide collar, waistcoat with brass buttons, wide sash belt in bold color, worn buckles, crossed leather straps, salt-stained breeches, weathered naval coat, head scarf',
    accessories: 'navigation tools in pocket, compass on chain, telescope, coin pouch, wanted poster folded, ship in bottle',
    jewelry: 'gold hoop earrings, nautical motif jewelry, coin charm on cord, rope-knot shaped pieces, stolen noble jewelry',
    footwear: 'tall bucket boots suitable for deck work, turned down cuffs, sea-stained leather, bare feet optional',
    hairStyling: 'wild sea-swept styles, bandana or tricorn-compatible, beaded braids, sun-bleached highlights, dreadlocks with shells',
    makeup: 'sun-worn minimal, salt-and-wind weathering effects, natural deep tan, cracked lips from sea air',
    tattooStyle: 'sailor ink language: swallows for miles sailed, compass rose for navigation, waves and ships, daggers through hearts, aged faded ink',
    weathering: 'heavily salt-stained, sun-bleached patches, rope burns on hands, deep tan with sun damage',
    props: 'none held, ship rigging visible, ocean on horizon',
  },
  naval_officer: {
    background: 'officers quarters on ship of the line, maps on table, sextant and charts, window showing fleet, polished wood and brass',
    clothing: 'formal naval uniform of era: blue coat with gold trim, white breeches, bicorn hat nearby, military precision, brass buttons polished, epaulettes',
    accessories: 'naval sword at hip, commission papers, spyglass, pocket watch, seal for orders',
    jewelry: 'minimal per regulations, signet ring of family, uniform buttons as decoration',
    footwear: 'polished black boots, naval regulation, white-topped for formal',
    hairStyling: 'powdered wig or regulation queue, tied back with ribbon, naval precision',
    makeup: 'clean military grooming, formal presentation, commanding presence',
    tattooStyle: 'concealed sailor traditions, private meanings, not visible in uniform',
    weathering: 'pristine formal wear, salt spray on coat edges, sword worn from use',
    props: 'none held, navigation charts visible, ship model on desk',
  },
  treasure_hunter: {
    background: 'hidden cave with treasure glinting, ancient mechanisms, torch light on gold, skeleton of previous seeker, map leading here',
    clothing: 'practical adventure wear: leather vest over loose shirt, utility belt with many pouches, bandoliers, machete sheath, rope coiled, hat for sun',
    accessories: 'tattered treasure map, lockpicks, ancient key found, torch, satchel for finds, brush for artifacts',
    jewelry: 'found treasures worn, mismatched ancient pieces, lucky charms accumulated',
    footwear: 'well-worn boots with ankle support, climbing grip, jungle-tested',
    hairStyling: 'practical under hat, tied back, showing adventures in wear',
    makeup: 'dirt and sweat, tomb dust, excitement visible',
    tattooStyle: 'map fragments, coordinates of finds, adventurer marks',
    weathering: 'extremely weathered, torn, patched, well-used gear',
    props: 'none held, treasure visible, ancient mechanism in background',
  },

  // ============================================================================
  // 🤠 WESTERN (Main + Sub-genres)
  // ============================================================================
  western: {
    background: 'dusty frontier town at high noon, saloon with swinging doors, hitching posts with horses, tumbleweed, sun-bleached wooden buildings, water trough',
    clothing: 'duster coat or fitted riding jacket, cotton work shirt, leather belt with tooled design, bandana at neck, suede textures, dust on hems, brass rivets, chaps optional',
    accessories: 'leather gun belt (no visible weapon), lasso coiled, tobacco pouch, pocket watch, worn playing cards, harmonica',
    jewelry: 'simple studs and hoops, matte metal jewelry, bolo tie, belt buckle as main statement, cattle brand pendant',
    footwear: 'worn cowboy boots with pointed toes, riding heels, spurs optional, dust-covered',
    hairStyling: 'practical and sun-protected, under hat or bandana, dusty and unkempt, sun-bleached tips',
    makeup: 'practical sun-kissed and weathered, natural rugged appearance, wind-chapped lips, dust in creases',
    tattooStyle: 'Americana linework: roses, horseshoes, barbed wire, cattle brands, faded simple ink',
    weathering: 'extremely dusty, sweat-stained, sun-bleached, working wear',
    props: 'none held, horse nearby, saloon doors visible',
  },
  gunslinger: {
    background: 'empty main street at high noon, shadows short, townsfolk hiding, clock tower showing noon, dust devils, showdown imminent',
    clothing: 'all black attire: long duster, black shirt, leather vest, dark trousers, intimidating and deadly, silver accents only',
    accessories: 'dual gun belt (holsters visible, no weapons), cigar, silver flask, wanted posters of self',
    jewelry: 'single silver ring, bullet casings on cord, simple and deadly',
    footwear: 'black cowboy boots, silent approach, deadly spurs',
    hairStyling: 'shadowed under black hat, long and wild, or severely slicked',
    makeup: 'weathered and dangerous, scars visible, hard eyes, death-dealing presence',
    tattooStyle: 'tally marks, skull imagery, playing card symbols, outlaw marks',
    weathering: 'battle-worn, bullet holes patched in coat, blood that isnt theirs',
    props: 'none held, shadows dramatic, church bell tower visible',
  },
  frontier: {
    background: 'homestead on prairie, log cabin, garden growing, wilderness beyond fence, mountains in distance, dawn light',
    clothing: 'practical pioneer wear: homespun dress or work shirt, apron with pockets, suspenders, cotton and canvas, hand-sewn repairs, bonnet for women',
    accessories: 'gardening tools, rifle for protection nearby, butter churn, seeds in pocket, family bible',
    jewelry: 'wedding ring, locket with family portrait, inherited simple pieces',
    footwear: 'practical work boots, moccasins, hand-made shoes',
    hairStyling: 'practical braids, bonnets, simple and functional, showing hard work',
    makeup: 'none, natural sun-weathered, hard-working appearance, healthy rugged beauty',
    tattooStyle: 'rare and personal, family symbols, minimal and hidden',
    weathering: 'work-worn, honest dirt, mending visible, sunburn',
    props: 'none held, homestead visible, livestock in background',
  },
  outlaw: {
    background: 'hideout canyon with rock formations, wanted posters on rocks, stolen goods, campfire smoke, horses tied nearby',
    clothing: 'mismatched stolen finery over practical wear: stolen waistcoat, bandana mask down, leather chaps, spurs, intimidating layers',
    accessories: 'stolen pocket watches, gold coins, bandana for mask, lockpicks, stolen jewelry',
    jewelry: 'stolen pieces worn proudly, gold teeth, excessive rings, taken trophies',
    footwear: 'boots with hidden knife, spurs for speed, trail-worn',
    hairStyling: 'wild and unkempt, havent seen town in months, intimidating',
    makeup: 'rough and scarred, intimidating features, wanted poster face',
    tattooStyle: 'prison ink, gang marks, outlaw symbols, rough homemade style',
    weathering: 'dusty from escape, blood from jobs, desperate survival',
    props: 'none held, wanted posters visible, loot bags',
  },

  // ============================================================================
  // ☢️ POST-APOCALYPTIC (Main + Sub-genres)
  // ============================================================================
  postapoc: {
    background: 'nuclear wasteland with rusted vehicles, collapsed overpasses, irradiated sky, dead trees, scavenger camps in distance, radiation warning signs',
    clothing: 'scavenged layered protection: patchwork armor plates, stitched repairs from multiple sources, grime and dust, improvised padding, believable materials, gas mask straps',
    accessories: 'Geiger counter, water purification tablets, canned food, radiation pills, tattered maps, jury-rigged radio',
    jewelry: 'mismatched scavenged pieces, worn bottle caps, bullet casings, nothing precious survives',
    footwear: 'reinforced scavenged boots, wrapped in cloth for extra protection, mismatched pair, worn through',
    hairStyling: 'practical survival cuts, self-maintained, covered for protection, growing out wild',
    makeup: 'minimal survival only: dirt smudges, sunburn from radiation, glare-reduction kohl, cracked lips from dehydration',
    tattooStyle: 'faded pre-war ink, cracked and weathered, new marks counting days or losses',
    weathering: 'extreme wear, radiation burns healing, dust everywhere, patched constantly',
    props: 'none held, rusted car nearby, dead tree',
  },
  post_apocalyptic: {
    background: 'overgrown city ruins reclaimed by nature, collapsed buildings with vines, deer in street, nature winning, beautiful desolation',
    clothing: 'scavenged layered protection with nature adaptation: patched with leaves and vines, camouflage for new world, fur from hunted animals',
    accessories: 'bow and arrows, foraging bag, herbal medicines, water skin, animal traps',
    jewelry: 'natural materials now, bone and antler, feathers, seed beads, survivor marks',
    footwear: 'handmade leather boots, worn silent for hunting, naturalized',
    hairStyling: 'long and natural, braided with found items, wild child appearance',
    makeup: 'ritual paint for tribe, natural dyes, camouflage patterns',
    tattooStyle: 'new tribal marks, plant and animal guides, natural ink from berries, survival story told in skin',
    weathering: 'natural wear, green stains from plants, honest outdoor living',
    props: 'none held, deer in background, overgrown building',
  },
  wasteland: {
    background: 'endless desert of blasted sand, sun-bleached bones of buildings, shanty town on horizon, heat shimmer, vultures circling',
    clothing: 'desert survival layers: flowing robes over armor, face covering for sand, multiple water containers, sun protection paramount',
    accessories: 'water collection still, sand goggles, compass, anti-venom, salt tablets',
    jewelry: 'nothing that shines to attract raiders, practical hidden pieces only',
    footwear: 'wrapped desert boots, sand-proof, worn smooth',
    hairStyling: 'completely covered or shaved for heat, wrapped in fabric',
    makeup: 'sun protection paste, cracked and peeling, surviving',
    tattooStyle: 'water source maps, survival marks, tribe identification',
    weathering: 'sand-blasted everything, sun-bleached, dehydration lines',
    props: 'none held, endless desert, skull in sand',
  },
  apocalypse_survivor: {
    background: 'fortified survivor compound, walls made of scrap, guard towers, community garden visible, hope amid ruin',
    clothing: 'community-issued practical wear: uniform elements for defense duty, personal touches showing individuality, maintained but limited resources',
    accessories: 'community badge, assigned tools, ration card, personal photo kept safe',
    jewelry: 'pre-war jewelry saved for meaning, wedding rings, lockets with lost ones',
    footwear: 'assigned boots, shared resources, maintained by community',
    hairStyling: 'community-practical, showing social role, maintained with care',
    makeup: 'returning normalcy, salvaged cosmetics used for morale',
    tattooStyle: 'community belonging marks, memorial for lost, hope symbols',
    weathering: 'maintained as much as possible, showing care despite limits',
    props: 'none held, community visible, garden growing',
  },

  // ============================================================================
  // ⚔️ WAR/MILITARY (Main + Sub-genres)
  // ============================================================================
  war: {
    background: 'forward operating base with military equipment, tactical vehicles, sand barriers, comm antennas, maps on boards, operational environment',
    clothing: 'muted tactical uniform elements: plate-carrier style vest, utility belt with pouches, reinforced seams, combat gloves, no logos or flags or text, practical military layers',
    accessories: 'tactical radio, first aid kit on belt, magazine pouches (empty), combat knife, tactical glasses',
    jewelry: 'low-profile matte studs if any, dog tags under shirt, wedding band taped',
    footwear: 'broken-in combat boots, desert or jungle pattern, ankle support',
    hairStyling: 'regulation military cut, practical for helmet, neat and maintained',
    makeup: 'almost none, functional anti-glare smudge under eyes, clean practical grooming, camouflage if needed',
    tattooStyle: 'realistic service-style imagery, abstract military motifs, no unit text visible, memorial ink for fallen, muted tones',
    weathering: 'operational dust, sweat lines, salt stains, well-used but maintained gear',
    props: 'none held, military equipment in background, maps visible',
  },
  ww2: {
    background: 'war-torn European battlefield with trenches, smoke from artillery, destroyed building, period-accurate vehicles, grey sky',
    clothing: 'authentic WWII era military uniform: wool coat, webbing with pouches, helmet at hip or worn, period-accurate boots, insignia correct but generic',
    accessories: 'canteen, entrenching tool, gas mask bag, cigarettes, letters from home, period compass',
    jewelry: 'minimal hidden, dog tags of era, wedding ring, sweetheart locket',
    footwear: 'period-accurate military boots, worn from marching, leather and canvas',
    hairStyling: 'regulation of era, longer than modern military, pomade if available',
    makeup: 'battle-worn, mud and smoke, stubble, exhausted but determined',
    tattooStyle: 'period-appropriate military ink: classic sailor style, pin-up if hidden, simple symbols, aged appearance',
    weathering: 'mud-caked, torn from combat, exhausted appearance, thousand-yard stare',
    props: 'none held, tank destroyer in background, trenches visible',
  },
  special_forces: {
    background: 'night operation environment with green night-vision hue, helicopter in distance, urban combat zone, precision mission',
    clothing: 'elite tactical kit: advanced plate carrier, integrated communication, night vision mount on helmet, suppressed weapon sling points visible, black or multicam',
    accessories: 'night vision device, tactical radio with throat mic, breaching tools, flex cuffs, IR markers',
    jewelry: 'nothing that reflects or jingles, mission-only mindset',
    footwear: 'advanced tactical boots, silent soles, ankle knife sheath',
    hairStyling: 'operator beard allowed, practical cut, helmet-compatible',
    makeup: 'face paint in tactical pattern, complete coverage, professional application',
    tattooStyle: 'team symbols, memorial for fallen operators, skulls and reapers, hidden under sleeves',
    weathering: 'operational use, maintained but used hard, sweat under gear',
    props: 'none held, night operation feel, helicopter lights in distance',
  },
  resistance_fighter: {
    background: 'occupied city with propaganda posters, curfew atmosphere, hidden weapons cache, graffiti resistance symbols, danger everywhere',
    clothing: 'civilian clothes hiding fighter: practical layers, hidden weapon spots, running shoes, blend with population, resistance symbol hidden',
    accessories: 'forged papers, hidden radio, resistance pamphlets, coded messages, civilian cover items',
    jewelry: 'civilian normal but resistance symbol hidden, recognition signals',
    footwear: 'running capable civilian shoes, nothing military that would draw attention',
    hairStyling: 'civilian blend, nothing memorable, changeable',
    makeup: 'civilian blend, perhaps disguise elements, forgettable',
    tattooStyle: 'resistance symbols hidden, memorial for fallen, must be concealable',
    weathering: 'civilian wear with hard use, running from patrols visible, tension in posture',
    props: 'none held, propaganda poster behind, shadows of patrol',
  },
  mercenary: {
    background: 'contractor compound with mixed equipment, different flags, money changing hands, loyalty for sale, professional but amoral',
    clothing: 'mixed contractor kit: high-end tactical pants, civilian shirt under plate carrier, customized personal setup, expensive private gear',
    accessories: 'expensive watch, satellite phone, multiple weapons attachment points, cash in various currencies',
    jewelry: 'expensive watch only jewelry needed, wedding ring left at home',
    footwear: 'personal preference high-end boots, customized for comfort',
    hairStyling: 'no regulations here, personal preference, operator beard',
    makeup: 'none, professional appearance, money talks attitude',
    tattooStyle: 'personal choices, gang history possibly, unit tattoos from past service',
    weathering: 'used but top-quality gear, money shows in equipment quality',
    props: 'none held, money visible in background, contracts on table',
  },

  // ============================================================================
  // 🏙️ MODERN LIFE (Main + Sub-genres)
  // ============================================================================
  modern: {
    background: 'sleek modern city with glass skyscrapers, clean streets, coffee shops, contemporary urban aesthetic, sunset golden hour light',
    clothing: 'contemporary street fashion: clean layered outfit, neutral palette with accent colors, tasteful accessories, quality fabrics, current trends, personally styled',
    accessories: 'smartphone, designer bag or backpack, sunglasses, wireless earbuds, coffee cup, keys with designer keychain',
    jewelry: 'trendy minimal metal jewelry, dainty layered necklaces, small hoops, statement rings, smart watch',
    footwear: 'designer sneakers or ankle boots, current style, maintained well',
    hairStyling: 'current trend styles, balayage highlights, intentional effortless look, regularly maintained',
    makeup: 'natural everyday: clean skin focus, subtle enhancement, groomed brows, current technique trends, no-makeup makeup look',
    tattooStyle: 'modern fine-line minimalism, abstract lines, small geometric accents, meaningful small pieces, currently trendy placements',
    weathering: 'pristine modern life, well-maintained everything, success visible',
    props: 'none held, coffee shop visible, city life buzz',
  },
  modern_life: {
    background: 'trendy urban cafe with exposed brick, stylish apartment interior with plants, modern comfortable living, personality in decor',
    clothing: 'contemporary casual chic: quality basics, jeans that fit perfectly, soft sweater or crisp shirt, personal style expression',
    accessories: 'vintage camera, journal, reusable coffee cup, tote bag with personality, reading glasses',
    jewelry: 'mix of personal meaning and trend, inherited pieces with modern, layered comfortable',
    footwear: 'comfortable but stylish, slip-ons, clean sneakers, maintained',
    hairStyling: 'natural texture embraced, current cut, personality showing',
    makeup: 'natural everyday, skin focus, healthy glow, minimal enhancement',
    tattooStyle: 'meaningful personal pieces, fine-line work, hidden or small visible, story in ink',
    weathering: 'lived-in comfortable, real life wear, authentic',
    props: 'none held, houseplants visible, books stacked',
  },
  contemporary: {
    background: 'fashionable city district with modern architecture, boutiques, brunch spots, cultural institutions, sophisticated urban life',
    clothing: 'fashion-forward contemporary: designer pieces mixed with high street, intentional outfit building, texture mixing, current silhouettes',
    accessories: 'designer tote, fashion sunglasses, curated bag contents, luxury phone case, art gallery catalog',
    jewelry: 'statement contemporary pieces, art jewelry, designer collaborations, meaningful and beautiful',
    footwear: 'current designer boots or heels, statement sneakers, fashion-forward',
    hairStyling: 'salon-maintained, trending style, personal but current',
    makeup: 'editorial influenced, current techniques, enhanced natural, photoshoot ready',
    tattooStyle: 'art-inspired pieces, single-needle work, gallery-worthy ink, curated placement',
    weathering: 'pristine, fashion-maintained, perfect for photography',
    props: 'none held, architecture visible, sophisticated setting',
  },
  slice_of_life: {
    background: 'warm cozy home interior with personal touches, morning light through windows, comfort and safety, real lived-in space',
    clothing: 'comfortable authentic casual: favorite worn jeans, softest sweater, loungewear elegance, personality in comfort choices',
    accessories: 'warm beverage, well-loved book, cozy blanket nearby, pet hair possibly, comfort items',
    jewelry: 'everyday personal pieces, never removed rings, sentimental always worn',
    footwear: 'cozy slippers, bare feet, house shoes, comfort first',
    hairStyling: 'natural and relaxed, bedhead acceptable, comfortable with self',
    makeup: 'natural bare face, authentic skin, freckles visible, unfiltered beauty',
    tattooStyle: 'deeply personal pieces, comfort reminders, hidden meaningful ink',
    weathering: 'loved and worn in comfort, real life visible, authentic living',
    props: 'none held, pet nearby, steaming mug',
  },
  romance: {
    background: 'sunset rooftop terrace with city lights, fairy lights, champagne ready, romantic ambiance, golden hour magic',
    clothing: 'stunning date night attire: elegant tailored outfit, flattering cut, subtle sensuality, sophisticated and alluring, memorable impression',
    accessories: 'clutch or small elegant bag, champagne glass nearby, subtle perfume implied, rose nearby',
    jewelry: 'elegant refined pieces, subtle sparkle, attention-drawing, romantic style',
    footwear: 'elegant heels or polished dress shoes, date-worthy, dancing capable',
    hairStyling: 'carefully styled for occasion, elegant waves, sophisticated updo, touchable',
    makeup: 'polished romantic: enhanced eyes, soft lip, glowing skin, candlelight optimized',
    tattooStyle: 'elegant fine-line, romantic motifs, tasteful placement, intimate reveals',
    weathering: 'pristine for the occasion, effort clearly made, anticipation visible',
    props: 'none held, candles visible, sunset colors',
  },
  business: {
    background: 'high-rise office with panoramic city view, power desk, awards on wall, success environment, morning meeting light',
    clothing: 'power professional attire: tailored suit in premium fabric, designer tie or elegant blouse, authority and success in every stitch',
    accessories: 'luxury watch, expensive pen, leather portfolio, designer glasses, executive accessories',
    jewelry: 'subtle power pieces, luxury watch as statement, success signals, refined taste',
    footwear: 'designer leather shoes, polished perfection, power stance ready',
    hairStyling: 'executive perfection, salon-maintained, powerful presentation',
    makeup: 'power grooming: polished professional, commanding presence, camera-ready',
    tattooStyle: 'completely concealed, boardroom appropriate, hidden if present',
    weathering: 'immaculate presentation, success visible, no weakness shown',
    props: 'none held, cityscape visible, office power symbols',
  },

  // ============================================================================
  // 🦸 SUPERHERO (Main + Sub-genres)
  // ============================================================================
  superhero: {
    background: 'dramatic city rooftop with lightning storm, cape billowing, city lights below, heroic atmosphere, dramatic clouds',
    clothing: 'iconic hero costume: bold colors representing ideals, cape elements flowing, emblem design on chest, powerful heroic silhouette, practical and symbolic design',
    accessories: 'utility belt with gadget pouches, insignia communicator, grappling hook at hip, signature weapon sheathed',
    jewelry: 'hero insignia pieces, power source jewelry, symbol accessories',
    footwear: 'hero boots matching costume, practical for combat and flight, iconic design',
    hairStyling: 'dramatic and iconic, flowing in wind, mask-compatible, memorable',
    makeup: 'dramatic and iconic: mask-enhanced features, bold choices, symbolic colors possible',
    tattooStyle: 'power symbols, origin story marks, hero motifs, bold iconic designs',
    weathering: 'battle-worn costume, repair patches with pride, heroic wear',
    props: 'none held, lightning in sky, city below',
  },
  vigilante: {
    background: 'dark alley with crime tape, gritty urban night, justice outside law, dangerous territory, red and blue police lights distant',
    clothing: 'dark tactical costume: armored suit in shadows, practical over flashy, intimidating silhouette, utility over symbol',
    accessories: 'grapple gun holster, smoke bombs on belt, flex cuffs, night vision in cowl, evidence bags',
    jewelry: 'none that identifies, completely anonymous, function only',
    footwear: 'silent combat boots, climbing capable, armored',
    hairStyling: 'hidden under cowl or practical, never identifiable',
    makeup: 'dark around eyes to disappear, intimidation factor, shadow-embracing',
    tattooStyle: 'hidden completely, identity protection paramount',
    weathering: 'battle damage repaired, blood not theirs, operational wear',
    props: 'none held, criminal tied up in background, bat-signal in sky',
  },
  villain: {
    background: 'villainous lair with world map showing targets, henchmen in background, elaborate scheme visible, threatening atmosphere',
    clothing: 'dramatic villain attire: cape optional, power silhouette, threatening elegance, theatrical menace, personal symbols of power',
    accessories: 'signature weapon nearby, control device, captured hero element, evil scheme materials',
    jewelry: 'power symbols worn, stolen treasures displayed, intimidation pieces',
    footwear: 'dramatic boots of power, platform for presence, intimidating',
    hairStyling: 'dramatic villain styling, memorable silhouette, striking and threatening',
    makeup: 'dramatic villain styling: sharp features enhanced, threatening beauty, theatrical',
    tattooStyle: 'power marks, conquest symbols, threatening imagery',
    weathering: 'maintained by minions, pristine villainy, power presentation',
    props: 'none held, world domination map visible, henchmen shadows',
  },

  // ============================================================================
  // 🔮 URBAN FANTASY (Main + Sub-genres)
  // ============================================================================
  urban_fantasy: {
    background: 'modern city alley with magical graffiti glowing softly, hidden magic in mundane world, portal shimmer in shadow, supernatural and normal colliding',
    clothing: 'street clothes with hidden magical elements: enchanted accessories subtle, tattoos that shimmer with power, modern witch aesthetic, magic disguised as fashion',
    accessories: 'enchanted phone, magical focus disguised as jewelry, spell components in modern containers, grimoire as tablet',
    jewelry: 'enchanted modern jewelry, crystals set in silver, hidden magical pieces, power disguised as fashion',
    footwear: 'modern boots with protective enchantments, stylish and magical, ready for both worlds',
    hairStyling: 'modern style with subtle magical elements, color-changing tips, flowing with unseen wind',
    makeup: 'modern with subtle magical shimmer, glamour-enhanced, supernatural beauty barely hidden',
    tattooStyle: 'magical modern ink: glowing sigil accents, contemporary with mystical elements, power visible when activated',
    weathering: 'modern urban wear, magical patina, both worlds showing',
    props: 'none held, magical graffiti glowing, normal people walking by oblivious',
  },
  supernatural: {
    background: 'roadside motel room with salt lines on windows, anti-possession symbols, hunting equipment spread out, monster research on wall',
    clothing: 'practical hunter wear: leather jacket, flannel shirts, jeans with hidden weapon sheaths, boots for running from or to trouble',
    accessories: 'flask of holy water, silver knife, shotgun nearby, demon traps drawn, hex bags, fake FBI credentials',
    jewelry: 'protective amulets, anti-possession tattoo, silver jewelry always, iron accessories',
    footwear: 'sturdy boots for hunting, comfortable for running, reinforced toes',
    hairStyling: 'practical no-nonsense, grown out from not caring, windswept from car travel',
    makeup: 'none usually, blood and dirt more common, hard-living visible',
    tattooStyle: 'protective symbols, anti-possession, warding marks, hunter identification',
    weathering: 'road-worn, monster blood dried, hard hunting life visible',
    props: 'none held, motel room details, case files visible',
  },
  paranormal: {
    background: 'haunted Victorian house with ghost orbs visible, medium equipment, candles and seance setup, veil between worlds thin',
    clothing: 'modern medium attire: flowing fabrics that move with unseen forces, crystals and protective symbols incorporated, spirit-attractive colors',
    accessories: 'ghost detection equipment, spirit box, protective crystals, communication board nearby, candles',
    jewelry: 'spiritually significant pieces, crystal pendants, protection rings, spirit communication aids',
    footwear: 'quiet soft shoes for not disturbing spirits, comfortable for long sessions',
    hairStyling: 'flowing ethereal styles, moving slightly from spirit presence, other-worldly touch',
    makeup: 'ethereal pale, otherworldly appearance, touched by spirits',
    tattooStyle: 'spiritual symbols, third eye representations, ghost guide marks',
    weathering: 'touched by cold spots, spiritual wear, other-worldly patina',
    props: 'none held, ghost orbs visible, spirit movement in background',
  },

  // ============================================================================
  // ⚙️ STEAMPUNK (Main + Sub-genres)
  // ============================================================================
  steampunk: {
    background: 'brass-and-copper workshop filled with whirring clockwork machines, steam pipes, gears everywhere, Victorian industrial aesthetic, oil lamps and gas jets',
    clothing: 'leather corset or vest with brass buckles, aviator goggles on forehead, mechanical accessories, pocket watch chains visible, cog-adorned elements, layered Victorian with industrial',
    accessories: 'functioning pocket watch with exposed gears, brass telescope, clockwork companion on shoulder, inventor tools, goggles with multiple lenses',
    jewelry: 'brass and copper gear motifs, clock parts incorporated, chain details, mechanical aesthetic jewelry, tiny working mechanisms',
    footwear: 'Victorian boots with brass fittings, button-up or buckled, reinforced for workshop',
    hairStyling: 'Victorian elaborate with industrial elements, gears in hair, practical yet ornate, aviator-friendly',
    makeup: 'Victorian industrial: oil smudges accepted, period-inspired with edge, copper eyeshadow',
    tattooStyle: 'clockwork designs, gear patterns, Victorian industrial motifs, brass-colored ink',
    weathering: 'oil stains on fingers, brass polish residue, work-worn Victorian, inventor lifestyle',
    props: 'none held, clockwork automaton visible, steam hissing',
  },
  dieselpunk: {
    background: '1940s retro-futuristic hangar with propeller planes, art deco and industrial mix, zeppelin through window, radio playing',
    clothing: 'retrofuturistic 1940s military-inspired: bomber jacket with tech modifications, high-waisted trousers, aviator style, diesel and chrome aesthetic',
    accessories: 'diesel-powered gadgets, radio equipment, flight maps, goggles with art deco frames, riveted accessories',
    jewelry: 'chrome and steel art deco, propeller motifs, streamlined designs, power aesthetic',
    footwear: 'military boots of era with retrofuturistic modification, chrome buckles, sturdy',
    hairStyling: 'victory rolls or pompadour, era-appropriate with edge, oil and wind styled',
    makeup: 'period red lip, strong brows, war effort glamour, resilience showing',
    tattooStyle: 'retro military ink, propeller imagery, art deco patterns, nose art style',
    weathering: 'engine oil stains, hangar dust, working hero appearance',
    props: 'none held, propeller plane visible, propaganda posters in background',
  },
  clockwork: {
    background: 'grand clocktower interior with massive gears turning, moonlight through clock face, time itself visible, eternal mechanism',
    clothing: 'clock-keeper attire: precise Victorian tailoring, gear motifs throughout, timepiece chains layered, guardian of time aesthetic',
    accessories: 'multiple pocket watches, gear ring of keys, clockwork tools, time diagrams, maintenance equipment',
    jewelry: 'clock face jewelry, gear earrings, pendulum necklaces, time-themed throughout',
    footwear: 'soft-soled boots for moving through machinery, Victorian style, practical for climbing gears',
    hairStyling: 'precise and maintained, clock-hand hair pins, mechanical precision in styling',
    makeup: 'precise and mechanical, clock-inspired accents, gear-shaped beauty marks',
    tattooStyle: 'clock mechanism designs, time symbolism, precision linework, gear incorporated',
    weathering: 'clock oil, brass filings, eternal maintenance wear',
    props: 'none held, massive gears turning behind, moonlight through clock face',
  },

  // ============================================================================
  // 🎭 VICTORIAN (Main + Sub-genres)
  // ============================================================================
  victorian: {
    background: 'fog-shrouded London street with gas lamps, cobblestones glistening, horse-drawn carriage passing, chimney smoke, period atmosphere',
    clothing: 'impeccable Victorian formal layered wear: tailored coat or dress with bustle, cravat or high collar, walking cane implied, period-perfect attire, structured silhouette',
    accessories: 'calling card case, ladies fan or gentleman gloves, parasol or walking stick, pocket watch, reticule or top hat',
    jewelry: 'antique filigree work, cameos of loved ones, mourning jewelry if appropriate, jet and pearls, brooch as statement',
    footwear: 'period-perfect button boots, pointed toes, appropriate heel height, immaculate care',
    hairStyling: 'elaborate period styles, pomade or pin curls, hat-compatible, social-status indicating',
    makeup: 'period-appropriate subtle only, natural Victorian aesthetic, possible rice powder, barely there enhancement',
    tattooStyle: 'hidden completely, would be scandalous if discovered, sailor or criminal association',
    weathering: 'pristine formal presentation, fog dampness on hem only, proper appearance paramount',
    props: 'none held, gas lamp illumination, carriage passing',
  },
  edwardian: {
    background: 'garden party in English manor grounds, parasols and petticoats, afternoon tea, roses blooming, Titanic era elegance',
    clothing: 'elegant Edwardian fashion: high-waisted hobble skirt or tailored suit, massive hats for ladies, less restricting than Victorian, lace and softness',
    accessories: 'elaborate parasol, calling cards, opera glasses, fan with secret language, tiny watch pinned',
    jewelry: 'lavalliere necklaces, bar brooches, Edwardian diamond work, delicate platinum pieces',
    footwear: 'elegant period boots or shoes, Louis heels, softer than Victorian',
    hairStyling: 'Gibson Girl pompadour, soft romantic waves, elaborate but softer than Victorian',
    makeup: 'natural beauty ideal, subtle enhancement only, healthy glow preferred',
    tattooStyle: 'completely inappropriate, would never, hidden scandal if present',
    weathering: 'pristine garden party ready, sunlight on fabric, perfection maintained',
    props: 'none held, garden party visible, croquet game in background',
  },
  gaslight: {
    background: 'Victorian London at night, gas lamps creating pools of light, fog rolling in, Jack the Ripper era atmosphere, dangerous romance',
    clothing: 'evening Victorian wear: opera coat, evening dress with dramatic décolletage, mysterious elegance, dangerous beauty',
    accessories: 'opera glasses, mysterious letter, vial of unknown substance, skeleton key, calling card from secret admirer',
    jewelry: 'dramatic evening pieces, blood-red rubies, mysterious locket, possibly poisoned ring',
    footwear: 'evening boots or slippers, dark materials, silent step',
    hairStyling: 'dramatic evening style, jeweled combs, mysterious and alluring',
    makeup: 'evening drama, dangerous beauty, femme fatale aesthetic, enhanced for gaslight',
    tattooStyle: 'hidden scandal, secret society marks possibly, never revealed',
    weathering: 'fog-kissed, gaslight glow, mystery in shadows',
    props: 'none held, gas lamp nearby, fog swirling',
  },
  crime: {
    background: 'gritty inner-city street corner at night with graffiti walls, expensive car nearby, intimidating territory, power visible, neon signs',
    clothing: 'expensive streetwear layers: designer elements mixed with intimidating street style, gold accents, power dressing for the streets, statement pieces',
    accessories: 'expensive phone, money clip visible, designer sunglasses at night, keys to expensive vehicle',
    jewelry: 'gold chains layered, statement rings on multiple fingers, status pieces throughout, diamond studs, gold teeth possible',
    footwear: 'designer sneakers or boots, expensive and recognized, status symbol',
    hairStyling: 'maintained with expensive products, braids or fresh fade, barbershop perfect',
    makeup: 'sharp and intimidating, power presence, immaculate grooming',
    tattooStyle: 'bold statement ink, gang-neutral but intimidating, money symbols, abstract power patterns, neck and hand visible',
    weathering: 'pristine expensive items, respect visible in maintenance, power projection',
    props: 'none held, expensive car visible, intimidated bystanders',
  },
};

// ============================================================================
// ROLE STYLING BY GENRE - Specific character roles within each genre
// ============================================================================
interface RoleStyle {
  description: string;
  clothing: string;
  accessories: string;
  techDetails: string;
}

const ROLE_STYLES: Record<string, Record<string, RoleStyle>> = {
  // Cyberpunk roles
  cyberpunk: {
    netrunner: {
      description: 'elite hacker, cyberdeck expert, virtual infiltrator, data thief, corporate spy',
      clothing: 'neural-interface headset with visible cables, lightweight tactical jacket with cable ports, form-fitting smart-fabric undersuit, fingerless gloves with haptic feedback pads, data-cable harness across chest',
      accessories: 'cyberdeck mounted on thigh or back, multiple data cables, AR visor or smart-lens glasses, encrypted commlink earpiece, neural interface plugs visible at temples',
      techDetails: 'subdermal circuitry glowing softly under skin, neural port at base of skull, data-jack behind ear, holographic interface projected near hand, matrix-code reflections in eyes',
    },
    solo: {
      description: 'combat specialist, mercenary, bodyguard, street enforcer, corporate wetwork operator',
      clothing: 'heavy tactical vest with ballistic plating, combat harness with magazine pouches, armored jacket with reinforced shoulders, tactical pants with integrated knee pads, military-grade webbing',
      accessories: 'targeting monocle or cyber-optic, tactical earpiece, ammo bandolier, combat knife sheath, trauma kit pouch',
      techDetails: 'combat augmented limbs, targeting reticle visible in eye, dermal armor plating, reinforced bone structure visible at joints, combat-grade muscle enhancement',
    },
    fixer: {
      description: 'dealmaker, information broker, black market contact, underworld connector, middleman',
      clothing: 'expensive tailored suit with subtle tech integration, designer jacket with hidden pockets, high-end street fashion with corporate edge, statement accessories showing wealth and connections',
      accessories: 'multiple encrypted phones, credstick holder, expensive watch with hidden scanner, designer AR glasses, discrete earpiece',
      techDetails: 'subtle facial recognition implant, enhanced hearing, encrypted neural-phone, social enhancement augmentations, voice modulator',
    },
    techie: {
      description: 'hardware specialist, cybernetics installer, gadget inventor, tech expert, ripperdoc assistant',
      clothing: 'work apron over tech-casual clothes, tool harness with many pockets, anti-static coat, magnification visor pushed up on forehead, utility belt loaded with tools',
      accessories: 'soldering equipment, diagnostic scanner, spare parts pouches, magnifying loupe, circuit tester, cybernetic maintenance kit',
      techDetails: 'precision-enhanced fingers, zoom-capable eyes, steady-hand implants, diagnostic overlays in vision, neural interface for machines',
    },
    rockerboy: {
      description: 'rebel artist, street performer, revolutionary voice, anti-corporate activist, underground celebrity',
      clothing: 'flashy stage outfit with LED elements, custom leather jacket covered in patches and art, ripped designer clothes, statement fashion pushing boundaries, provocative anti-establishment style',
      accessories: 'cybernetic instrument mods, throat-mounted vocal enhancer, glowing body art, fan merchandise of self, encrypted broadcast equipment',
      techDetails: 'enhanced vocal cords, audio-jack ports, stage lighting skin implants, recording eye implant, charisma-enhancing pheromone system',
    },
    media: {
      description: 'combat journalist, truth-seeker, war correspondent, underground broadcaster, investigative reporter',
      clothing: 'tactical journalist vest with recording equipment, practical street clothes for quick escapes, camera-integrated eyewear, press credentials both real and fake, armored journalist coat',
      accessories: 'multi-spectrum camera drone, recording implants, editing deck, broadcast equipment, encrypted storage, fake IDs',
      techDetails: 'recording eye with zoom and lowlight, enhanced hearing for interviews, data storage in skull, secure uplink for live broadcasts, facial recognition blocker',
    },
    nomad: {
      description: 'road warrior, convoy driver, wasteland survivor, family-pack member, motorhead',
      clothing: 'road-worn leather jacket with pack emblems, practical layers for desert and cold, vehicle-themed accessories, welding goggles, protective riding gear with patches',
      accessories: 'vehicle repair tools, fuel canister, road maps, family pack tokens, salvage collection, vehicle keys on chain',
      techDetails: 'vehicle-interface implants, dust-filter lungs, UV-resistant eyes, waste-processing kidneys, extended endurance modifications',
    },
    corpo: {
      description: 'corporate executive, company operative, suit, wage-slave turned player, corporate spy',
      clothing: 'immaculate corporate suit with hidden tech, designer clothing with subtle company branding, expensive minimalist style, perfectly tailored with secret pockets, power-dressing to intimidate',
      accessories: 'corporate ID badge, encrypted datapad, designer briefcase, executive commlink, corporate credit chips, loyalty monitoring device',
      techDetails: 'behavioral monitoring implant, corporate neural-link, loyalty-verified brain chip, expensive cosmetic surgery, stress-management implant',
    },
  },
  
  // Sci-fi roles
  scifi: {
    captain: {
      description: 'starship commander, fleet officer, crew leader, exploration pioneer',
      clothing: 'command uniform with rank insignia, reinforced duty jacket, tactical command vest, utility belt with communicator',
      accessories: 'command insignia, communicator badge, datapad, sidearm holster, command key chip',
      techDetails: 'neural command interface, strategic overlay implant, crew-monitoring link, translation implant',
    },
    pilot: {
      description: 'ace flyer, starfighter jockey, shuttle operator, racing champion',
      clothing: 'flight suit with life support connections, pressurized undersuit, pilot jacket with squadron patches, anti-g webbing',
      accessories: 'flight helmet with HUD, breathing mask, ejection harness, flight recorder, lucky charm',
      techDetails: 'enhanced reflexes, spatial awareness augmentation, g-force tolerance mods, neural flight interface',
    },
    engineer: {
      description: 'ship mechanic, systems specialist, tech genius, problem solver',
      clothing: 'engineering jumpsuit with tool loops, protective work gear, heavy gloves, scanner goggles on forehead',
      accessories: 'multi-tool, diagnostic scanner, spare parts pouches, reactor key, repair drone',
      techDetails: 'enhanced precision hands, technical database implant, radiation resistance, diagnostic vision',
    },
    scientist: {
      description: 'researcher, xenobiologist, theoretical physicist, lab specialist',
      clothing: 'lab coat or research uniform, protective eyewear, clean-suit elements, data-recording badge',
      accessories: 'research datapad, specimen containers, analysis equipment, holographic display projector',
      techDetails: 'enhanced memory, analytical processing implant, microscopic vision, data recording corneal implant',
    },
  },
  
  // Fantasy roles
  fantasy: {
    warrior: {
      description: 'battle-hardened fighter, shield-bearer, sword master, defender',
      clothing: 'well-maintained chainmail or plate armor, warrior tabard, sword belt, cloak for travel',
      accessories: 'shield on back, sword sheath, dagger, waterskin, campaign medals',
      techDetails: 'battle scars showing experience, calloused sword hands, military posture, weathered face',
    },
    mage: {
      description: 'arcane spellcaster, wizard, sorcerer, magic wielder',
      clothing: 'flowing robes with arcane symbols, enchanted cloak, comfortable spell-casting attire, mystical accessories',
      accessories: 'spell component pouch, arcane focus crystal, tome of spells, runic jewelry, magical familiar nearby',
      techDetails: 'glowing arcane markings on skin, mystical energy visible around hands, ancient eyes, otherworldly aura',
    },
    rogue: {
      description: 'thief, assassin, spy, infiltrator, shadow walker',
      clothing: 'dark leather armor, hood and mask options, silent movement gear, many hidden pockets',
      accessories: 'lockpicks, throwing knives, grappling hook, poison vials, stolen trinkets',
      techDetails: 'nimble fingers, sharp observant eyes, light-footed stance, calculating expression',
    },
    ranger: {
      description: 'wilderness expert, hunter, tracker, nature guardian',
      clothing: 'forest green and brown leathers, camouflage cloak, practical outdoor gear, weather-ready',
      accessories: 'bow and quiver, hunting knife, animal companion nearby, herb pouches, tracking tools',
      techDetails: 'keen eyes, weathered outdoor skin, animal-like awareness, connection to nature visible',
    },
    cleric: {
      description: 'divine servant, healer, holy warrior, temple representative',
      clothing: 'religious vestments, holy symbols, armored robes for combat clerics, devotional accessories',
      accessories: 'holy symbol prominent, prayer beads, sacred text, healing kit, divine focus',
      techDetails: 'divine light in eyes, peaceful aura, blessed markings, serene but powerful presence',
    },
  },
  
  // Horror roles
  horror: {
    survivor: {
      description: 'final girl, last one standing, resourceful victim, trauma survivor',
      clothing: 'torn and bloodied everyday clothes, improvised protection, practical shoes for running',
      accessories: 'improvised weapon, flashlight, first aid supplies, keys clutched tight',
      techDetails: 'wide terrified eyes, adrenaline-fueled alertness, survival determination, traumatic stress visible',
    },
    hunter: {
      description: 'monster hunter, supernatural investigator, slayer, occult expert',
      clothing: 'reinforced leather coat, tactical gear with holy symbols, monster-hunting utility belt, protected neck',
      accessories: 'silver weapons, holy water vials, religious symbols, monster identification journal, specialized ammunition',
      techDetails: 'scarred from previous hunts, experienced calculating eyes, supernatural awareness, grim determination',
    },
    investigator: {
      description: 'occult researcher, paranormal detective, truth-seeker in darkness',
      clothing: 'practical professional attire, protective charms woven in, comfortable for long investigations',
      accessories: 'research journal, camera for evidence, protective talismans, recording equipment, ancient texts',
      techDetails: 'dark circles from sleepless research, haunted eyes from what theyve seen, obsessive attention to detail',
    },
  },
  
  // Western roles
  western: {
    sheriff: {
      description: 'lawman, town protector, justice bringer, badge wearer',
      clothing: 'worn but maintained law-enforcement attire, star badge prominent, practical hat, gun belt',
      accessories: 'sheriff badge, handcuffs, wanted posters, law book, keys to jail',
      techDetails: 'commanding presence, justice in eyes, authority posture, protective stance',
    },
    outlaw: {
      description: 'criminal, bank robber, train thief, wanted fugitive',
      clothing: 'road-worn layers, bandana for face-covering, dusty trail clothes, intimidating appearance',
      accessories: 'wanted poster of self, lockpicks, stolen valuables, bandana, spurs',
      techDetails: 'dangerous eyes, quick-draw stance, outlaw swagger, survival instincts visible',
    },
    bounty_hunter: {
      description: 'manhunter, tracker, collector of rewards, hunter of outlaws',
      clothing: 'practical hunting gear, reinforced coat, many weapons visible, trail-ready attire',
      accessories: 'bounty notices, restraints, tracking tools, multiple weapons, trophy collection',
      techDetails: 'predator eyes, patient hunter stance, scars from captures, relentless determination',
    },
  },
  
  // Military/War roles
  war: {
    soldier: {
      description: 'infantry fighter, enlisted personnel, frontline combatant, ground trooper',
      clothing: 'full combat uniform, body armor, helmet, load-bearing equipment, tactical gear',
      accessories: 'rifle nearby, ammunition pouches, first aid kit, radio, grenades',
      techDetails: 'thousand-yard stare option, combat alertness, military bearing, fatigue and determination',
    },
    officer: {
      description: 'military commander, tactical leader, unit commander, strategic mind',
      clothing: 'officer uniform with rank insignia, command accessories, practical but distinguished',
      accessories: 'command radio, tactical map, sidearm, unit insignia, planning tools',
      techDetails: 'command presence, strategic thinking visible, burden of leadership, respect-demanding posture',
    },
    medic: {
      description: 'combat medic, field surgeon, life-saver, doc',
      clothing: 'medical-marked combat gear, accessible medical pouches, practical uniform, blood-stained from work',
      accessories: 'medical kit prominent, stethoscope, bandages ready, stretcher nearby, dog tags of lost',
      techDetails: 'compassionate but hardened eyes, steady healer hands, exhaustion from saves, determined to help',
    },
    sniper: {
      description: 'marksman, long-range specialist, overwatch, silent killer',
      clothing: 'camouflage appropriate to terrain, ghillie suit elements, minimal equipment, silent gear',
      accessories: 'rifle scope, spotting equipment, range finder, camouflage netting, patience supplies',
      techDetails: 'patient calculating eyes, utter stillness capability, breath control, extreme focus',
    },
  },
};

// ============================================================================
// GENRE NORMALIZATION - Maps genre strings to GENRE_STYLES keys
// ============================================================================

// Genre aliases and sub-genre mappings for flexible matching
const GENRE_ALIASES: Record<string, string> = {
  // Main genres with variations
  'scifi': 'scifi',
  'sci-fi': 'scifi',
  'sci_fi': 'sci_fi',
  'science fiction': 'scifi',
  'sciencefiction': 'scifi',
  
  // Fantasy variations
  'fantasy': 'fantasy',
  'high fantasy': 'high_fantasy',
  'highfantasy': 'high_fantasy',
  'dark fantasy': 'dark_fantasy',
  'darkfantasy': 'dark_fantasy',
  'epic fantasy': 'high_fantasy',
  'sword and sorcery': 'sword_and_sorcery',
  'swordandsorcery': 'sword_and_sorcery',
  'fairy tale': 'fairy_tale',
  'fairytale': 'fairy_tale',
  
  // Cyberpunk
  'cyberpunk': 'cyberpunk',
  'cyber punk': 'cyberpunk',
  'netrunner': 'cyberpunk',
  
  // Horror variations
  'horror': 'horror',
  'gothic horror': 'gothic_horror',
  'gothichorror': 'gothic_horror',
  'gothic': 'gothic_horror',
  'cosmic horror': 'cosmic_horror',
  'cosmichorror': 'cosmic_horror',
  'lovecraftian': 'cosmic_horror',
  'slasher': 'slasher',
  'zombie': 'zombie',
  'zombies': 'zombie',
  
  // Mystery/Noir
  'mystery': 'mystery',
  'noir': 'noir',
  'detective': 'detective',
  'crime': 'crime',
  'thriller': 'thriller',
  'spy': 'spy',
  'espionage': 'spy',
  'cozy mystery': 'cozy_mystery',
  'cozymystery': 'cozy_mystery',
  
  // Post-apocalyptic
  'postapoc': 'postapoc',
  'post-apocalyptic': 'post_apocalyptic',
  'post apocalyptic': 'post_apocalyptic',
  'postapocalyptic': 'post_apocalyptic',
  'apocalypse': 'apocalypse_survivor',
  'wasteland': 'wasteland',
  'fallout': 'wasteland',
  
  // Western
  'western': 'western',
  'wild west': 'western',
  'cowboy': 'western',
  'gunslinger': 'gunslinger',
  'frontier': 'frontier',
  'outlaw': 'outlaw',
  
  // Pirate
  'pirate': 'pirate',
  'pirates': 'pirate',
  'nautical': 'pirate',
  'naval': 'naval_officer',
  'treasure hunter': 'treasure_hunter',
  'treasurehunter': 'treasure_hunter',
  
  // War/Military
  'war': 'war',
  'military': 'war',
  'ww2': 'ww2',
  'wwii': 'ww2',
  'world war 2': 'ww2',
  'special forces': 'special_forces',
  'specialforces': 'special_forces',
  'mercenary': 'mercenary',
  'resistance': 'resistance_fighter',
  
  // Modern
  'modern': 'modern',
  'modern life': 'modern_life',
  'modernlife': 'modern_life',
  'contemporary': 'contemporary',
  'slice of life': 'slice_of_life',
  'sliceoflife': 'slice_of_life',
  'romance': 'romance',
  'business': 'business',
  
  // Steampunk
  'steampunk': 'steampunk',
  'steam punk': 'steampunk',
  'dieselpunk': 'dieselpunk',
  'diesel punk': 'dieselpunk',
  'clockwork': 'clockwork',
  'clockpunk': 'clockwork',
  
  // Victorian
  'victorian': 'victorian',
  'edwardian': 'edwardian',
  'gaslight': 'gaslight',
  'gaslamp': 'gaslight',
  
  // Space Opera
  'space opera': 'space_opera',
  'spaceopera': 'space_opera',
  'star wars': 'space_opera',
  'hard scifi': 'hard_scifi',
  'hardscifi': 'hard_scifi',
  'alien': 'alien_world',
  'alien world': 'alien_world',
  
  // Superhero
  'superhero': 'superhero',
  'super hero': 'superhero',
  'vigilante': 'vigilante',
  'villain': 'villain',
  'supervillain': 'villain',
  
  // Urban Fantasy
  'urban fantasy': 'urban_fantasy',
  'urbanfantasy': 'urban_fantasy',
  'supernatural': 'supernatural',
  'paranormal': 'paranormal',
};

// Fallback genre parents - if specific sub-genre not found, try parent
const GENRE_FALLBACKS: Record<string, string> = {
  'high_fantasy': 'fantasy',
  'dark_fantasy': 'fantasy',
  'sword_and_sorcery': 'fantasy',
  'fairy_tale': 'fantasy',
  'medieval': 'fantasy',
  
  'space_opera': 'scifi',
  'hard_scifi': 'scifi',
  'alien_world': 'scifi',
  'sci_fi': 'scifi',
  
  'gothic_horror': 'horror',
  'cosmic_horror': 'horror',
  'slasher': 'horror',
  'zombie': 'horror',
  'body_horror': 'horror',
  
  'noir': 'mystery',
  'detective': 'mystery',
  'cozy_mystery': 'mystery',
  'thriller': 'mystery',
  'spy': 'mystery',
  
  'wasteland': 'postapoc',
  'post_apocalyptic': 'postapoc',
  'apocalypse_survivor': 'postapoc',
  
  'gunslinger': 'western',
  'frontier': 'western',
  'outlaw': 'western',
  
  'naval_officer': 'pirate',
  'treasure_hunter': 'pirate',
  
  'ww2': 'war',
  'special_forces': 'war',
  'resistance_fighter': 'war',
  'mercenary': 'war',
  
  'modern_life': 'modern',
  'contemporary': 'modern',
  'slice_of_life': 'modern',
  'romance': 'modern',
  'business': 'modern',
  
  'dieselpunk': 'steampunk',
  'clockwork': 'steampunk',
  
  'edwardian': 'victorian',
  'gaslight': 'victorian',
  
  'vigilante': 'superhero',
  'villain': 'superhero',
  
  'supernatural': 'urban_fantasy',
  'paranormal': 'urban_fantasy',
};

function normalizeGenre(rawGenre: string): string {
  // Normalize the input
  const normalized = rawGenre
    .toLowerCase()
    .trim()
    .replace(/[-\s]+/g, '_')  // Replace spaces and hyphens with underscores
    .replace(/_+/g, '_');      // Remove duplicate underscores
  
  // First, check if it's a direct alias
  if (GENRE_ALIASES[rawGenre.toLowerCase()]) {
    const aliased = GENRE_ALIASES[rawGenre.toLowerCase()];
    // Check if the aliased genre exists in GENRE_STYLES
    if (GENRE_STYLES[aliased]) {
      return aliased;
    }
    // If not, try fallback
    if (GENRE_FALLBACKS[aliased] && GENRE_STYLES[GENRE_FALLBACKS[aliased]]) {
      return GENRE_FALLBACKS[aliased];
    }
  }
  
  // Check if normalized version is directly in GENRE_STYLES
  if (GENRE_STYLES[normalized]) {
    return normalized;
  }
  
  // Try fallback for the normalized version
  if (GENRE_FALLBACKS[normalized] && GENRE_STYLES[GENRE_FALLBACKS[normalized]]) {
    return GENRE_FALLBACKS[normalized];
  }
  
  // Partial matching - find genres that contain the search term
  const genreKeys = Object.keys(GENRE_STYLES);
  for (const key of genreKeys) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return key;
    }
  }
  
  // Final fallback to modern
  return 'modern';
}

// ============================================================================
// BUILD PROMPT FUNCTION
// ============================================================================
function buildPrompt(body: any): { prompt: string; negative: string } {
  const {
    name, gender, age, build, skinTone, height,
    hairColor, hairStyle, eyeColor, faceShape,
    additionalDetails, characterAdditionals, customDescription,
    characterClass, genre, nationality, ethnicity, origin,
    tattoos, tattooStyle, piercings, piercingStyle, scars, implants, prosthetics, mutations,
    bustSize, hipWidth, muscleDefinition, bodyHair,
    clothingStyle, clothingDetails, distinguishingFeatures, accessories,
    // Gear override for cheat mode
    hasEquippedGear, currentGearDescription,
  } = body;

  // ========== GENRE DETECTION FIRST - Everything flows from this ==========
  const rawGenre = (genre || 'modern').toLowerCase().trim();
  const genreKey = normalizeGenre(rawGenre);
  const style = GENRE_STYLES[genreKey] || GENRE_STYLES.modern;
  
  console.log(`Genre matching: "${rawGenre}" -> "${genreKey}"`);

  // ========== BODY PROPORTION AMPLIFIERS ==========
  // These descriptors are amplified to create more noticeable differences
  const BUST_AMPLIFIER: Record<string, string> = {
    'small': 'small, modest bust with subtle curves',
    'medium': 'medium bust with feminine curves',
    'large': 'large, prominent bust with voluptuous curves, noticeably full-figured chest',
    'very large': 'very large, exceptionally prominent bust with dramatic voluptuous curves, extremely full-figured chest, eye-catching proportions',
  };
  
  const HIP_AMPLIFIER: Record<string, string> = {
    'narrow': 'narrow, slim hips with straight silhouette',
    'average': 'average hips with balanced proportions',
    'wide': 'wide, curvy hips with prominent hourglass figure, noticeably shapely lower body',
    'very wide': 'very wide, dramatically curvy hips with exaggerated hourglass figure, exceptionally shapely lower body, striking proportions',
  };

  const BUILD_AMPLIFIER: Record<string, string> = {
    'slim': 'slim, slender physique',
    'average': 'average, healthy build',
    'athletic': 'athletic, toned physique with visible fitness',
    'muscular': 'muscular, powerful physique with defined muscles',
    'heavyset': 'heavyset, larger frame with substantial build',
    'curvy': 'curvy, shapely figure with pronounced curves',
  };

  // ========== CHARACTER IDENTITY ==========
  const charAge = age || 25;
  const eth = ethnicity || nationality || origin || '';
  const genderWord = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';
  
  const identityParts: string[] = [];
  
  // Core identity
  identityParts.push(`${charAge} year old ${eth} ${genderWord}`.trim());
  
  // Physical attributes
  if (height) identityParts.push(`${height} height`);
  if (build) identityParts.push(BUILD_AMPLIFIER[build] || `${build} build`);
  if (skinTone) identityParts.push(`${skinTone} skin tone with realistic texture`);
  
  // Face
  if (faceShape) identityParts.push(`${faceShape} face shape`);
  if (eyeColor) identityParts.push(`${eyeColor} eyes`);
  if (hairColor || hairStyle) {
    identityParts.push(`${hairColor || ''} ${hairStyle || ''} hair`.trim());
  }
  
  // Body proportions with AMPLIFIED descriptors
  if (gender === 'female' || gender === 'other') {
    if (bustSize) {
      identityParts.push(BUST_AMPLIFIER[bustSize] || `${bustSize} bust`);
    }
    if (hipWidth) {
      identityParts.push(HIP_AMPLIFIER[hipWidth] || `${hipWidth} hips`);
    }
  }
  if (muscleDefinition && muscleDefinition !== 'none') {
    identityParts.push(`${muscleDefinition} muscle definition`);
  }
  
  // Distinguishing features
  if (distinguishingFeatures?.length) {
    identityParts.push(`distinguishing features: ${distinguishingFeatures.join(', ')}`);
  }
  
  // Accessories (genre-neutral, user-selected)
  if (accessories?.length) {
    identityParts.push(`wearing accessories: ${accessories.join(', ')}`);
  }

  // ========== BODY MODIFICATIONS ==========
  const modParts: string[] = [];
  
  if (scars?.length) {
    const scarList = Array.isArray(scars) ? scars : [];
    const scarDesc = scarList.map((s: any) => {
      const location = typeof s === 'string' ? s : s.location;
      return `healed scar at ${location}`;
    }).join(', ');
    if (scarDesc) modParts.push(scarDesc);
  }
  
  if (piercings?.length) {
    const piercingList = Array.isArray(piercings) ? piercings : [];
    const styleDesc = piercingStyle ? `${piercingStyle} style ` : '';
    const piercingDesc = piercingList.map((p: any) => {
      const location = typeof p === 'string' ? p : p.location;
      return `${location} piercing`;
    }).join(', ');
    if (piercingDesc) modParts.push(`${styleDesc}piercings: ${piercingDesc}`);
  }
  
  if (tattoos?.length) {
    const tattooList = Array.isArray(tattoos) ? tattoos : [];
    const styleDesc = tattooStyle && tattooStyle.trim() !== '' ? `${tattooStyle} style ` : '';
    const tattooDesc = tattooList.map((t: any) => {
      const location = typeof t === 'string' ? t : t.location;
      return `${location} tattoo`;
    }).join(', ');
    if (tattooDesc) modParts.push(styleDesc ? `${styleDesc}tattoos: ${tattooDesc}` : `tattoos at: ${tattooDesc}`);
  }
  
  // Genre-appropriate modifications
  if (implants?.length) {
    const implantList = Array.isArray(implants) ? implants : [];
    const implantDesc = implantList.map((i: any) => {
      const type = typeof i === 'string' ? i : i.type || i.location;
      // Only add tech aesthetic if genre supports it
      const isTechGenre = ['cyberpunk', 'scifi', 'space_opera', 'post_apocalyptic'].includes(genreKey);
      return isTechGenre ? `visible ${type} cybernetic implant` : `visible ${type} implant`;
    }).join(', ');
    if (implantDesc) modParts.push(implantDesc);
  }
  
  if (prosthetics?.length) {
    const prostheticList = Array.isArray(prosthetics) ? prosthetics : [];
    const prostheticDesc = prostheticList.map((p: any) => {
      const type = typeof p === 'string' ? p : p.type || p.location;
      return `${type} prosthetic`;
    }).join(', ');
    if (prostheticDesc) modParts.push(prostheticDesc);
  }
  
  if (mutations?.length) {
    const mutationList = Array.isArray(mutations) ? mutations : [];
    const mutationDesc = mutationList.map((m: any) => {
      const type = typeof m === 'string' ? m : m.type;
      return `${type} mutation`;
    }).join(', ');
    if (mutationDesc) modParts.push(mutationDesc);
  }

  // ========== CLOTHING - STRICT GENRE ADHERENCE ==========
  let clothingDesc = '';
  
  if (hasEquippedGear === false) {
    // No gear - tasteful underwear
    clothingDesc = gender === 'female' 
      ? 'wearing simple tasteful undergarments, sports bra and shorts style, clean and modest'
      : gender === 'male'
      ? 'wearing simple boxer briefs, clean and modest'
      : 'wearing simple tasteful undergarments, clean and modest';
  } else if (currentGearDescription) {
    clothingDesc = `wearing: ${currentGearDescription}`;
  } else if (clothingStyle && clothingStyle !== 'genre_default') {
    clothingDesc = `wearing ${clothingStyle} style clothing`;
    if (clothingDetails?.length) {
      clothingDesc += `, specifically: ${clothingDetails.join(', ')}`;
    }
  } else {
    // Use genre-specific clothing ONLY
    clothingDesc = `CLOTHING: ${style.clothing}`;
  }

  // ========== ROLE/CLASS - ONLY USE IF MATCHES GENRE ==========
  let roleDesc = '';
  const normalizedRole = (characterClass || '').toLowerCase().trim().replace(/[\s-]+/g, '_');
  
  if (normalizedRole) {
    const genreRoles = ROLE_STYLES[genreKey] || {};
    let roleStyle = genreRoles[normalizedRole];
    
    // Try parent genre
    if (!roleStyle && GENRE_FALLBACKS[genreKey]) {
      const parentGenre = GENRE_FALLBACKS[genreKey];
      const parentRoles = ROLE_STYLES[parentGenre] || {};
      roleStyle = parentRoles[normalizedRole];
    }
    
    if (roleStyle) {
      roleDesc = `ROLE: ${roleStyle.description}, ${roleStyle.clothing}`;
    } else {
      // Generic role mention without style bleeding
      roleDesc = `occupation: ${characterClass}`;
    }
  }

  // ========== USER CUSTOM DETAILS - HIGHEST PRIORITY ==========
  const userDesc = additionalDetails || characterAdditionals || customDescription || '';

  // ========== GENRE ISOLATION RULES ==========
  const genreIsolation: Record<string, string> = {
    'fantasy': 'STRICT GENRE RULES: Medieval fantasy setting ONLY. NO modern technology, NO electricity, NO cybernetics, NO neon lights, NO futuristic elements. Use torches, candles, magic, swords, leather, cloth, medieval architecture.',
    'dark_fantasy': 'STRICT GENRE RULES: Dark medieval fantasy ONLY. Gothic, supernatural, cursed. NO modern tech, NO cybernetics, NO neon. Use dark magic, gothic architecture, candlelight, ancient evil.',
    'medieval': 'STRICT GENRE RULES: Historical medieval ONLY. NO modern elements whatsoever. Castles, knights, peasants, torchlight, stone walls.',
    'cyberpunk': 'STRICT GENRE RULES: Cyberpunk ONLY. Neon lights, chrome, cybernetics, megacities, rain-slicked streets, holographic ads, high-tech low-life.',
    'scifi': 'STRICT GENRE RULES: Science fiction ONLY. Spaceships, advanced tech, clean futuristic environments, space stations, alien worlds.',
    'space_opera': 'STRICT GENRE RULES: Space opera ONLY. Epic space settings, starships, exotic aliens, grand scale.',
    'modern': 'STRICT GENRE RULES: Modern day realistic ONLY. Contemporary fashion, real-world settings, current technology only.',
    'modern_life': 'STRICT GENRE RULES: Slice of life, modern realistic ONLY. Everyday contemporary settings, casual fashion.',
    'western': 'STRICT GENRE RULES: Wild West ONLY. Dusty frontier towns, saloons, horses, cowboy attire, 1800s American frontier.',
    'noir': 'STRICT GENRE RULES: Film noir ONLY. 1940s-50s detective aesthetic, fedoras, trench coats, smoky bars, black and white mood.',
    'horror': 'STRICT GENRE RULES: Horror genre ONLY. Creepy, unsettling, dark shadows, abandoned places, dread atmosphere.',
    'post_apocalyptic': 'STRICT GENRE RULES: Post-apocalyptic ONLY. Ruined civilization, scavenged gear, wasteland, survival aesthetic.',
    'steampunk': 'STRICT GENRE RULES: Steampunk ONLY. Victorian era with steam-powered tech, brass, gears, goggles, airships.',
    'victorian': 'STRICT GENRE RULES: Victorian era ONLY. 1800s fashion, gaslight, carriages, formal attire.',
    'superhero': 'STRICT GENRE RULES: Superhero genre ONLY. Comic book aesthetic, costumes, powers, heroic poses.',
    'urban_fantasy': 'STRICT GENRE RULES: Urban fantasy ONLY. Modern city with hidden magic, supernatural in mundane settings.',
    'war': 'STRICT GENRE RULES: Military/war ONLY. Appropriate era military uniforms, weapons, battlefield settings.',
    'spy': 'STRICT GENRE RULES: Espionage ONLY. Sleek suits, gadgets, intrigue, sophisticated settings.',
    'survival': 'STRICT GENRE RULES: Survival genre ONLY. Wilderness, practical gear, nature settings.',
    'romance': 'STRICT GENRE RULES: Romance genre. Soft lighting, intimate settings, emotional atmosphere.',
  };

  const genreRule = genreIsolation[genreKey] || genreIsolation['modern'];

  // ========== ASSEMBLE FINAL PROMPT ==========
  const promptSections: string[] = [];
  
  // 1. Genre isolation rule FIRST
  promptSections.push(genreRule);
  
  // 2. Core prompt rules
  promptSections.push(PROMPT_RULES);
  
  // 3. Framing
  promptSections.push(`FRAMING: Portrait from waist up, medium close-up, centered composition, facing camera, natural confident pose`);
  
  // 4. Character identity
  promptSections.push(`CHARACTER: ${identityParts.join(', ')}`);
  
  // 5. Body modifications (if any)
  if (modParts.length > 0) {
    promptSections.push(`BODY MODIFICATIONS: ${modParts.join(', ')}`);
  }
  
  // 6. Clothing
  promptSections.push(clothingDesc);
  
  // 7. Role (if specified)
  if (roleDesc) {
    promptSections.push(roleDesc);
  }
  
  // 8. Genre-specific styling
  promptSections.push(`SCENE/BACKGROUND: ${style.background}`);
  promptSections.push(`JEWELRY/ACCESSORIES: ${style.jewelry}`);
  promptSections.push(`MAKEUP/GROOMING: ${style.makeup}`);
  
  // 9. User custom details - PRIORITY
  if (userDesc) {
    promptSections.push(`[USER PRIORITY - MUST FOLLOW: ${userDesc}]`);
  }
  
  // 10. Art style
  promptSections.push(`ART STYLE: ${STYLE_LOCK}`);
  
  const prompt = promptSections.join('. ');
  
  // Genre-specific negative prompts to prevent bleeding
  const genreNegatives: Record<string, string> = {
    'fantasy': 'cyberpunk, neon lights, modern technology, computers, cars, electricity, LED lights, chrome, futuristic',
    'dark_fantasy': 'cyberpunk, neon lights, modern technology, bright colors, happy atmosphere, futuristic',
    'medieval': 'modern, futuristic, technology, cyberpunk, neon, electricity, cars',
    'cyberpunk': 'medieval, fantasy, magic wands, swords, horses, castles, nature settings',
    'modern': 'fantasy, medieval, futuristic, cyberpunk, magic, supernatural',
    'modern_life': 'fantasy, medieval, futuristic, cyberpunk, magic, supernatural, costumes',
    'western': 'modern technology, cyberpunk, futuristic, neon lights, cars, electricity',
  };
  
  const genreNegative = genreNegatives[genreKey] || '';
  const baseNegative = 'blurry, out of focus, watermark, text, low quality, amateur, poorly drawn, cartoon, anime, illustration, painting style';
  
  console.log('Portrait prompt:', prompt);
  
  return {
    prompt,
    negative: genreNegative ? `${baseNegative}, ${genreNegative}` : baseNegative,
  };
}

// ============================================================================
// IMAGE GENERATION - Lovable AI with Gemini
// ============================================================================
async function generateImage(prompt: string, _negative: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

  console.log("Generating photorealistic portrait with Lovable AI");
  console.log("Prompt length:", prompt.length);

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      modalities: ["image", "text"]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Lovable AI error:", response.status, error);
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    if (response.status === 402) {
      throw new Error("Payment required, please add credits to your workspace");
    }
    throw new Error(`Generation failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log("Lovable AI response received");

  // Extract image from response
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    console.error("No image in response:", JSON.stringify(data).substring(0, 500));
    throw new Error("No image returned from Lovable AI");
  }

  console.log("Portrait generated successfully (base64 length:", imageUrl.length, ")");
  return imageUrl;
}

// ============================================================================
// SERVER
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Custom prompt mode
    if (body.customPrompt && !body.gender) {
      const imageUrl = await generateImage(body.customPrompt, '');
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, negative } = buildPrompt(body);
    const imageUrl = await generateImage(prompt, negative);

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
