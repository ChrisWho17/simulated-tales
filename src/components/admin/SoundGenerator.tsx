import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Play, Loader2, CheckCircle, XCircle, Volume2, Swords, Cloud } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Weather sound definitions with 6 variations each
const WEATHER_SOUND_PROMPTS = {
  // RAIN SOUNDS
  rain_light: [
    'Light gentle rain falling on leaves and grass, soft pattering, peaceful ambient loop',
    'Soft drizzle on a window pane, gentle rain sounds, relaxing ambient',
    'Light spring rain in a garden, birds occasionally chirping, gentle patter',
    'Misty light rain on cobblestones, urban gentle precipitation',
    'Soft rain on a tent canvas, camping ambient, gentle drips',
    'Light rain in a forest, water droplets on foliage, serene nature',
  ],
  rain_medium: [
    'Steady moderate rain falling, consistent patter, ambient weather loop',
    'Medium rainfall on rooftops, urban rain ambience, steady precipitation',
    'Persistent rain in a city, puddles forming, moderate intensity',
    'Continuous rainfall on pavement, cars passing occasionally in distance',
    'Medium rain shower on windows, indoor perspective, cozy ambient',
    'Steady rain in the woods, water on leaves and branches',
  ],
  rain_heavy: [
    'Heavy torrential downpour, intense rain, powerful storm ambient',
    'Driving rain storm, heavy precipitation beating down, dramatic weather',
    'Monsoon-like heavy rain, flooding sounds, intense water',
    'Powerful rainstorm with heavy drops, water rushing, storm ambient',
    'Intense heavy rain on metal roof, loud pounding precipitation',
    'Torrential rain in the city, overwhelming water sounds, dramatic storm',
  ],
  rain_on_roof: [
    'Rain on tin roof, metallic patter, cozy indoor ambient',
    'Heavy rain on metal roofing, rhythmic drumming sound',
    'Raindrops on corrugated iron roof, rural ambient',
    'Storm rain on a shed roof, loud metallic pinging',
    'Light rain on slate tiles, gentle roof ambient',
    'Rain pattering on wooden cabin roof, cozy shelter sounds',
  ],
  rain_on_leaves: [
    'Rain falling on forest leaves, natural dripping, jungle ambient',
    'Raindrops on thick foliage, tropical rain forest sounds',
    'Water dripping from leaves to leaves, lush vegetation',
    'Rain in dense woods, drops on ferns and bushes',
    'Garden rain on large leaves, organic dripping sounds',
    'Rainforest precipitation, multiple layers of leaf sounds',
  ],

  // THUNDER SOUNDS
  thunder_distant: [
    'Distant rumbling thunder, far away storm, low rolling sound',
    'Thunder rolling across distant mountains, faraway storm',
    'Subtle distant thunder boom, storm on the horizon',
    'Low rumbling thunder in the distance, atmospheric',
    'Far away thunder crack and roll, distant storm approaching',
    'Horizon thunder, very distant storm sounds, atmospheric rumble',
  ],
  thunder_close: [
    'Close loud thunder crack, powerful boom, nearby lightning strike',
    'Explosive close thunder, sharp crack followed by rumble',
    'Very close lightning strike thunder, intense boom, frightening',
    'Overhead thunderclap, loud crashing sound, immediate storm',
    'Powerful thunder directly above, house-shaking boom',
    'Close lightning and thunder, sharp crack and deep rumble',
  ],

  // WIND SOUNDS
  wind_light: [
    'Gentle breeze through trees, soft wind, peaceful rustling',
    'Light wind in tall grass, meadow ambient, soft whooshing',
    'Soft breeze through leaves, subtle wind sounds',
    'Gentle wind across open field, quiet whooshing',
    'Light coastal breeze, soft wind from the sea',
    'Mild wind through garden, gentle movement of plants',
  ],
  wind_medium: [
    'Moderate wind blowing, steady gusts, tree movement',
    'Medium strength wind, consistent blowing, outdoor ambient',
    'Sustained wind through forest, branches swaying',
    'Steady wind across plains, constant airflow sound',
    'Medium wind around buildings, urban wind tunnel',
    'Persistent moderate wind, flags flapping, leaves blowing',
  ],
  wind_strong: [
    'Strong howling wind, powerful gusts, storm force',
    'Intense wind storm, aggressive blowing, dramatic weather',
    'Gale force wind, loud howling, dangerous conditions',
    'Powerful wind battering against structures, intense gusts',
    'Strong wind through narrow passages, whistling and howling',
    'Hurricane-like wind sounds, overwhelming force of nature',
  ],
  wind_howl: [
    'Eerie wind howling through mountains, spooky atmosphere',
    'Ghost-like wind howl, haunting atmospheric sound',
    'Wind whistling through abandoned building, creepy ambient',
    'Howling winter wind, desolate cold atmosphere',
    'Mournful wind sound, lonely howling in the night',
    'Supernatural wind howl, ethereal and unsettling',
  ],
  wind_gust: [
    'Sudden wind gust, brief powerful burst of air',
    'Sharp wind gust hitting, quick intense blast',
    'Unexpected gust of wind, sudden whoosh',
    'Quick powerful wind burst, things blowing around',
    'Strong sudden gust, papers flying sound',
    'Brief intense wind blast, surprising force',
  ],

  // STORM SOUNDS
  storm_wind: [
    'Violent storm wind, extreme weather, chaotic atmosphere',
    'Storm with heavy wind, turbulent conditions',
    'Fierce storm wind howling, trees bending, intense',
    'Full storm wind sounds, powerful and relentless',
    'Dramatic storm gusts, dangerous wind conditions',
    'Tempest wind sounds, overwhelming storm force',
  ],
  storm_rain: [
    'Storm rain with wind, heavy precipitation in chaos',
    'Rainstorm at peak intensity, wind and rain combined',
    'Violent rain during storm, splashing and rushing',
    'Full storm with driving rain, intense weather',
    'Storm downpour, rain being blown sideways',
    'Extreme storm rainfall, overwhelming precipitation',
  ],
  storm_ambient: [
    'Complete storm ambience, thunder rain wind combined',
    'Full thunderstorm atmosphere, all elements present',
    'Intense storm environment, immersive weather sounds',
    'Peak storm with all effects, dramatic atmosphere',
    'Comprehensive storm soundscape, powerful weather',
    'Ultimate storm ambient, nature at its most powerful',
  ],

  // SNOW SOUNDS
  snow_ambient: [
    'Quiet snowy atmosphere, muffled winter silence, peaceful cold',
    'Snow falling silently, winter quiet, serene atmosphere',
    'Still snowy night, quiet winter ambient, peaceful',
    'Hushed snowy landscape, winter calm, muted sounds',
    'Gentle snowfall atmosphere, quiet winter scene',
    'Peaceful snow ambient, soft winter stillness',
  ],
  snow_crunch: [
    'Footsteps crunching in deep snow, walking in winter',
    'Snow crunching underfoot, stepping through fresh powder',
    'Walking on icy snow, crisp crunching sounds',
    'Footfalls in thick snow, satisfying crunch',
    'Trudging through snow, deep crunching steps',
    'Fresh snow footstep crunch, winter walking sounds',
  ],

  // FOG SOUNDS
  fog_ambient: [
    'Eerie fog atmosphere, muffled distant sounds, mysterious ambient',
    'Dense fog soundscape, hushed and mysterious',
    'Foggy morning ambient, muted sounds, ethereal',
    'Thick mist atmosphere, sounds dampened, spooky quiet',
    'Fog-shrouded environment, muffled and haunting',
    'Mysterious foggy ambient, limited visibility sounds',
  ],

  // AMBIENCE - TIME OF DAY
  amb_birds_light: [
    'Daytime birds singing, cheerful chirping, sunny day ambient',
    'Various birds calling in the morning, nature sounds',
    'Light bird songs in a park, pleasant day ambient',
    'Songbirds in spring, melodic chirping, peaceful',
    'Birds singing in garden, relaxing nature sounds',
    'Cheerful bird chorus, sunny outdoor ambient',
  ],
  amb_breeze_light: [
    'Light daytime breeze, gentle outdoor wind, sunny ambient',
    'Soft air movement, pleasant breeze, calm day',
    'Gentle wind in sunshine, light and airy',
    'Mild breeze on a warm day, comfortable weather',
    'Soft outdoor breeze, trees gently moving',
    'Pleasant light wind, perfect weather ambient',
  ],
  amb_crickets: [
    'Night crickets chirping, summer evening ambient, peaceful',
    'Cricket chorus at night, warm evening sounds',
    'Crickets in the grass, nighttime nature ambient',
    'Summer night crickets, relaxing evening sounds',
    'Cricket sounds under stars, peaceful night ambient',
    'Warm night with crickets, outdoor evening atmosphere',
  ],
  amb_night_breeze: [
    'Cool night breeze, gentle evening wind, peaceful dark',
    'Soft wind at night, darkness ambient, quiet',
    'Nighttime gentle wind, calm evening atmosphere',
    'Cool evening breeze, quiet night ambient',
    'Night air moving softly, peaceful darkness',
    'Gentle night wind, serene evening sounds',
  ],
  amb_birds_dawn: [
    'Dawn chorus birds, early morning singing, sunrise ambient',
    'Birds waking at sunrise, beautiful morning sounds',
    'Early morning bird songs, dawn breaking',
    'Sunrise birds calling, new day beginning',
    'Dawn bird chorus, first light ambient',
    'Morning birds at daybreak, peaceful sunrise',
  ],
  amb_morning_breeze: [
    'Fresh morning breeze, dawn wind, crisp air ambient',
    'Early morning wind, cool and fresh, new day',
    'Sunrise breeze, morning freshness, awakening',
    'Dawn wind gently blowing, morning atmosphere',
    'Cool morning air movement, early day ambient',
    'Fresh breeze at sunrise, invigorating morning',
  ],
  amb_evening_birds: [
    'Evening birds settling, dusk calls, sunset ambient',
    'Twilight bird sounds, day ending, peaceful evening',
    'Birds at dusk, settling for night, sunset calls',
    'Evening bird chorus, day winding down',
    'Sunset bird songs, peaceful evening transition',
    'Dusk birds calling, nightfall approaching',
  ],
  amb_evening_breeze: [
    'Evening breeze, warm dusk wind, sunset ambient',
    'Twilight wind, cooling evening air, peaceful',
    'Dusk breeze blowing gently, day ending',
    'Warm evening wind, sunset atmosphere',
    'End of day breeze, relaxing twilight ambient',
    'Peaceful evening wind, warm and gentle',
  ],

  // HEAT WAVE
  heat_ambient: [
    'Hot summer day, cicadas buzzing, intense heat ambient',
    'Scorching heat waves, insects droning, oppressive warmth',
    'Sweltering heat sounds, buzzing insects, hot day',
    'Extreme heat ambient, cicadas and stillness',
    'Hot afternoon sounds, heat shimmer ambient',
    'Blazing hot day, insects buzzing in the heat',
  ],
};

// Story sound effects with 6 variations each
const STORY_SOUND_PROMPTS = {
  // COMBAT - MELEE
  combat_sword_swing: [
    'Sword swinging through air, sharp whoosh, blade cutting wind',
    'Fast sword slice sound, metal cutting air, quick swing',
    'Heavy sword swing, powerful whoosh, two-handed weapon',
    'Quick rapier thrust and swing, light blade through air',
    'Dual sword swings, rapid blade movements, swift attacks',
    'Longsword arc through air, medium weight blade swing',
  ],
  combat_sword_clash: [
    'Metal swords clashing together, loud impact, steel on steel',
    'Sword parry and clash, blade meeting blade, combat sound',
    'Multiple sword clashes in rapid succession, intense duel',
    'Heavy sword block, powerful metal impact, strong clash',
    'Light sword clash and slide, blades scraping together',
    'Epic sword clash with reverb, dramatic combat moment',
  ],
  combat_sword_hit: [
    'Sword cutting flesh, blade impact with body, combat hit',
    'Sword slash connecting, sharp impact, wound sound',
    'Blade piercing armor and flesh, sword thrust hit',
    'Quick sword cut landing, sharp slicing impact',
    'Heavy sword hit on target, powerful slash impact',
    'Sword strike hitting, blade connecting with enemy',
  ],
  combat_punch: [
    'Powerful punch landing, fist hitting body, impact sound',
    'Quick jab punch, fast fist impact, boxing sound',
    'Heavy haymaker punch, knockout blow, strong impact',
    'Multiple quick punches landing, rapid fist impacts',
    'Punch to face, fist on jaw, fighting impact',
    'Body punch landing, fist hitting torso, deep impact',
  ],
  combat_kick: [
    'Strong kick landing, foot hitting body, martial arts impact',
    'High kick connecting, leg sweep, powerful foot strike',
    'Low kick to legs, sweeping attack, tripping impact',
    'Spinning kick landing, dynamic martial arts move',
    'Front kick to chest, pushing impact, powerful foot strike',
    'Roundhouse kick connecting, swift leg strike, strong impact',
  ],
  combat_block: [
    'Shield blocking attack, metal impact, defensive sound',
    'Arm block deflecting blow, blocking sound, defense',
    'Wooden shield taking hit, blocking impact, thud',
    'Metal armor blocking strike, defensive clang',
    'Quick parry block, deflecting attack, skilled defense',
    'Heavy shield block, absorbing powerful blow',
  ],
  combat_bow_draw: [
    'Bow string being drawn back, tension building, archery',
    'Longbow draw, creaking wood, string stretching',
    'Quick bow draw and aim, rapid archery preparation',
    'Heavy war bow being drawn, powerful string tension',
    'Recurve bow drawing, smooth string pull, archer ready',
    'Bow string tightening, aiming sound, arrow ready',
  ],
  combat_arrow_fire: [
    'Arrow being fired from bow, string release, whoosh',
    'Quick arrow shot, bow release, projectile flying',
    'Multiple arrows firing rapidly, volley of shots',
    'Heavy arrow launch, powerful bow shot, deep thwang',
    'Arrow whistling through air, fast projectile sound',
    'Bow string release, arrow flying toward target',
  ],
  combat_arrow_hit: [
    'Arrow hitting target, thud impact, arrow embedding',
    'Arrow piercing flesh, sharp impact, successful hit',
    'Arrow hitting wooden shield, blocking impact',
    'Arrow striking stone wall, ricochet and clatter',
    'Multiple arrows hitting target, rapid impacts',
    'Arrow hitting armor with clang, deflection sound',
  ],

  // COMBAT - MAGIC
  combat_magic_fire: [
    'Fireball casting, flames whooshing, magical fire spell',
    'Fire magic explosion, flames erupting, magical blast',
    'Flame spell casting, crackling fire, magic activation',
    'Fire stream spell, continuous flames, burning magic',
    'Small fire spell, flame burst, quick fire magic',
    'Massive fireball explosion, devastating flame spell',
  ],
  combat_magic_ice: [
    'Ice spell casting, freezing sound, frost magic',
    'Ice shard projectile, frozen missile, sharp ice',
    'Freezing blast spell, ice crackling, cold magic',
    'Ice explosion, shattering frozen shards, frost burst',
    'Subtle ice magic, gentle freezing, frost forming',
    'Blizzard spell sounds, swirling ice and snow',
  ],
  combat_magic_lightning: [
    'Lightning bolt spell, electric crack, thunder magic',
    'Electric shock spell, zapping sound, lightning strike',
    'Chain lightning, multiple electric arcs, spreading shock',
    'Thunder spell, electric boom, powerful lightning',
    'Small electric spark, minor shock spell, zap',
    'Massive lightning strike, devastating thunder magic',
  ],
  combat_magic_heal: [
    'Healing spell casting, warm magical glow, restoration',
    'Gentle healing magic, soothing restoration sound',
    'Powerful healing burst, magical health restoration',
    'Subtle healing spell, quiet recovery magic',
    'Divine healing, holy restoration, blessed sound',
    'Quick heal spell, rapid magical recovery',
  ],
  combat_magic_generic: [
    'Generic magic casting, mystical energy, spell activation',
    'Magical energy release, arcane power, spell effect',
    'Spell charging up, magical energy gathering',
    'Magic dissipating, spell ending, energy fading',
    'Subtle magic use, quiet spell, minor enchantment',
    'Powerful magic surge, overwhelming arcane force',
  ],

  // FOOTSTEPS
  footstep_stone: [
    'Footsteps on stone floor, hard walking, dungeon sounds',
    'Walking on cobblestone, medieval street footsteps',
    'Running on stone, quick hard footsteps, castle floor',
    'Slow cautious steps on stone, creeping footsteps',
    'Heavy boots on stone floor, armored walking',
    'Light footsteps on marble, elegant walking sound',
  ],
  footstep_wood: [
    'Footsteps on wooden floor, creaking boards, indoor walking',
    'Walking on wooden deck, ship or dock sounds',
    'Running on wooden floor, quick footsteps, boards creaking',
    'Slow steps on old wooden floor, creaky boards',
    'Heavy boots on wooden planks, solid steps',
    'Light footsteps on hardwood, soft indoor walking',
  ],
  footstep_grass: [
    'Footsteps in grass, soft outdoor walking, field sounds',
    'Walking through tall grass, brushing vegetation',
    'Running through meadow, quick grass footsteps',
    'Slow careful steps in grass, quiet outdoor walking',
    'Heavy footsteps crushing grass, outdoor trudging',
    'Light footsteps on lawn, gentle grass walking',
  ],
  footstep_dirt: [
    'Footsteps on dirt path, outdoor trail walking',
    'Walking on dusty road, dirt crunching underfoot',
    'Running on dirt, quick earthy footsteps',
    'Slow steps on soft earth, careful ground walking',
    'Heavy boots on dirt, trudging through terrain',
    'Light footsteps on packed earth, trail walking',
  ],
  footstep_gravel: [
    'Footsteps on gravel, crunching stones, path walking',
    'Walking on loose gravel, shifting pebbles underfoot',
    'Running on gravel, rapid crunching stones',
    'Slow careful steps on gravel, quiet crunching',
    'Heavy boots on gravel path, loud stone crushing',
    'Light footsteps on pebbles, gentle gravel walking',
  ],
  footstep_water: [
    'Footsteps splashing in shallow water, wet walking',
    'Walking through puddles, water splashing underfoot',
    'Running through water, rapid splashing sounds',
    'Slow wading through water, careful wet steps',
    'Heavy splashing in deep water, trudging through',
    'Light water splashing, gentle wet footsteps',
  ],
  footstep_metal: [
    'Footsteps on metal grating, industrial walking',
    'Walking on metal floor, mechanical clang steps',
    'Running on metal, rapid metallic footsteps',
    'Slow steps on metal surface, careful clanging',
    'Heavy boots on metal plate, loud industrial steps',
    'Light footsteps on thin metal, delicate clanging',
  ],
  footstep_carpet: [
    'Footsteps on thick carpet, muffled indoor walking',
    'Walking on soft rug, quiet cushioned steps',
    'Running on carpet, rapid muffled footsteps',
    'Slow steps on plush carpet, luxurious quiet walking',
    'Heavy footsteps on carpet, dampened thuds',
    'Light footsteps on thin carpet, soft indoor walking',
  ],

  // DOORS
  door_wood_open: [
    'Wooden door opening, creaking hinges, entry sound',
    'Old wooden door slowly opening, loud creaking',
    'Heavy oak door opening, solid wood movement',
    'Light wooden door swinging open, quick open',
    'Damaged wooden door opening, grinding and creaking',
    'Well-oiled wooden door opening, smooth quiet open',
  ],
  door_wood_close: [
    'Wooden door closing, solid thud, entry sealed',
    'Wooden door slamming shut, loud bang, angry close',
    'Gentle wooden door close, soft click, quiet close',
    'Heavy wooden door closing slowly, deep thud',
    'Old wooden door closing with creak, aged close',
    'Light wooden door clicking shut, casual close',
  ],
  door_metal_open: [
    'Metal door opening, heavy grinding, industrial sound',
    'Steel door swinging open, metallic scraping',
    'Iron dungeon door opening, ancient metal creaking',
    'Modern metal door opening, clean mechanical sound',
    'Rusty metal door forced open, grinding resistance',
    'Light metal door opening, quick metallic swing',
  ],
  door_metal_close: [
    'Metal door slamming, loud clang, heavy impact',
    'Steel door closing with clunk, secure locking',
    'Iron door closing slowly, heavy metal settling',
    'Metal door shutting with echo, dungeon sound',
    'Light metal door closing, quick clang',
    'Rusty metal door grinding shut, aged close',
  ],
  door_lock: [
    'Door being locked, key turning, lock clicking',
    'Heavy bolt sliding into place, secure locking',
    'Multiple locks engaging, high security sound',
    'Simple lock clicking shut, quick locking',
    'Old rusty lock turning, difficult locking',
    'Modern deadbolt locking, clean mechanical sound',
  ],
  door_unlock: [
    'Door being unlocked, key turning, lock opening',
    'Heavy bolt sliding open, lock disengaging',
    'Multiple locks opening, security disengaged',
    'Simple lock clicking open, quick unlocking',
    'Old lock turning with effort, rusty mechanism',
    'Modern lock clicking open, smooth unlocking',
  ],
  door_knock: [
    'Knocking on door, three solid knocks, visitor',
    'Urgent door knocking, rapid insistent knocks',
    'Gentle door tap, quiet polite knock',
    'Heavy pounding on door, aggressive knocking',
    'Light rhythmic knock, friendly arrival',
    'Single loud knock, authoritative visitor',
  ],

  // OBJECTS - CONTAINERS
  object_chest_open: [
    'Treasure chest opening, creaking wood and metal',
    'Old wooden chest unlocking and opening, hinges creaking',
    'Large chest lid lifting, heavy wooden opening',
    'Small chest clicking open, quick treasure reveal',
    'Ancient chest opening slowly, aged wood sound',
    'Metal-bound chest opening, clasps releasing',
  ],
  object_chest_close: [
    'Treasure chest closing, lid dropping, latch clicking',
    'Chest slamming shut, loud wooden close',
    'Gentle chest closing, careful lid lowering',
    'Heavy chest lid falling, deep wooden thud',
    'Metal clasps engaging, chest securing',
    'Old chest closing with creak, aged hinges',
  ],
  object_drawer_open: [
    'Drawer sliding open, wood on wood, furniture sound',
    'Old drawer opening, sticky wood, effort sound',
    'Smooth drawer slide open, modern furniture',
    'Heavy drawer pulling open, desk furniture',
    'Small drawer opening, light furniture sound',
    'Rusty drawer opening with resistance, aged furniture',
  ],
  object_drawer_close: [
    'Drawer sliding shut, wood on wood, closing sound',
    'Drawer pushed closed, solid thud',
    'Gentle drawer closing, soft furniture sound',
    'Heavy drawer slamming, loud close',
    'Drawer clicking shut, clean close',
    'Old drawer grinding closed, aged wood',
  ],

  // OBJECTS - ITEMS
  object_coins: [
    'Coins jingling, gold and silver clinking, treasure',
    'Coins being counted, metal on metal, currency',
    'Coin purse being picked up, money sounds',
    'Coins dropping on table, metallic scatter',
    'Large pile of coins shifting, treasure sound',
    'Single coin spinning on surface, metallic spin',
  ],
  object_keys: [
    'Keys jingling, metal keys on ring, jangling',
    'Key being inserted in lock, metal on metal',
    'Key ring being picked up, multiple keys sound',
    'Keys dropped on table, metallic clatter',
    'Single key turning, lock mechanism sound',
    'Keys sorting through, finding right key',
  ],
  object_paper: [
    'Paper rustling, pages turning, reading sounds',
    'Letter being unfolded, paper crackling',
    'Scroll being unrolled, parchment sound',
    'Book pages flipping, paper turning rapidly',
    'Paper being crumpled, wadded up sound',
    'Documents shuffling, papers organizing',
  ],
  object_glass_break: [
    'Glass shattering, breaking impact, shards falling',
    'Window breaking, glass explosion, loud crash',
    'Small glass breaking, delicate shatter',
    'Large glass pane shattering, dramatic break',
    'Glass bottle breaking, liquid spill, crash',
    'Crystal goblet breaking, high pitched shatter',
  ],
  object_potion: [
    'Potion bottle opening, cork pop, magical drink',
    'Potion being consumed, drinking magical liquid',
    'Potion bubbling, magical liquid sounds',
    'Potion bottle clinking, glass container sound',
    'Potion being poured, magical liquid transfer',
    'Multiple potion bottles, glass clinking',
  ],
  object_book: [
    'Book being opened, pages spreading, reading',
    'Heavy tome dropping on table, large book sound',
    'Book pages turning rapidly, speed reading',
    'Old book opening, ancient pages crackling',
    'Book closing with thud, reading finished',
    'Book being placed on shelf, library sound',
  ],
  object_chain: [
    'Chains rattling, metal links clinking, dungeon',
    'Heavy chain dragging, metal on stone, prison',
    'Chain being pulled, taut metal sound',
    'Chain dropping, metal links clattering',
    'Chain swinging, metal moving through air',
    'Shackles and chains, prisoner sounds',
  ],
  object_rope: [
    'Rope being pulled taut, fiber stretching',
    'Rope being tied, knot making sounds',
    'Rope ladder being climbed, rope on rope',
    'Rope being cut, fibers snapping',
    'Rope swinging, whooshing through air',
    'Rope coiling on ground, landing sound',
  ],

  // OBJECTS - ENVIRONMENT
  object_lever: [
    'Lever being pulled, mechanical mechanism, stone scraping',
    'Heavy lever activation, gears turning, ancient mechanism',
    'Quick lever pull, simple mechanism, click',
    'Rusty lever forced, grinding resistance',
    'Lever resetting, spring mechanism, returning',
    'Multiple levers activating, complex mechanism',
  ],
  object_button: [
    'Stone button being pressed, click and mechanism',
    'Large button activation, heavy click, mechanism start',
    'Small button press, quick click sound',
    'Ancient button pressing, stone grinding',
    'Button releasing, spring return sound',
    'Multiple buttons pressing in sequence',
  ],
  object_trap: [
    'Trap triggering, mechanical snap, danger sound',
    'Spike trap activating, deadly mechanism',
    'Pit trap opening, floor giving way',
    'Arrow trap firing, projectiles launching',
    'Net trap springing, rope and weight',
    'Poison dart trap, quick deadly sounds',
  ],
  object_campfire: [
    'Campfire crackling, wood burning, outdoor fire',
    'Campfire starting, kindling catching, flames growing',
    'Large campfire roaring, intense burning',
    'Campfire dying down, embers crackling',
    'Wood being added to fire, flames rising',
    'Campfire in wind, flames flickering, outdoor night',
  ],
  object_torch: [
    'Torch flame burning, crackling fire, light source',
    'Torch being lit, flames igniting, fire starting',
    'Torch whooshing in movement, flame in air',
    'Torch extinguishing, fire dying, smoke',
    'Multiple torches burning, dungeon ambiance',
    'Torch dropped on ground, flames on floor',
  ],
};

interface GenerationResult {
  prompt: string;
  filename: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  audioUrl?: string;
  error?: string;
  audioBlob?: Blob;
}

type SoundCategory = 'weather' | 'story';

export const SoundGenerator: React.FC = () => {
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [activeTab, setActiveTab] = useState<SoundCategory>('weather');

  const getSoundPrompts = (category: SoundCategory) => {
    return category === 'weather' ? WEATHER_SOUND_PROMPTS : STORY_SOUND_PROMPTS;
  };

  const getDuration = (category: SoundCategory, soundKey: string) => {
    // Weather sounds are longer for looping, story sounds are shorter
    if (category === 'weather') return 15;
    // Combat and footsteps are very short
    if (soundKey.startsWith('combat_') || soundKey.startsWith('footstep_')) return 3;
    // Doors and objects are medium
    return 5;
  };

  const generateSound = async (
    prompt: string, 
    filename: string, 
    duration: number
  ): Promise<{ success: boolean; audioBlob?: Blob; error?: string }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sfx`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            prompt, 
            duration,
            promptInfluence: 0.4,
            filename 
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      
      // Convert base64 to blob
      const byteCharacters = atob(data.audioContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });

      return { success: true, audioBlob };
    } catch (error) {
      console.error('Generation error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const generateAllSounds = async (category: SoundCategory) => {
    setIsGenerating(true);
    setProgress(0);
    
    const soundPrompts = getSoundPrompts(category);
    
    // Build the full list of sounds to generate
    const soundsToGenerate: { category: string; filename: string; prompt: string; duration: number }[] = [];
    
    for (const [soundKey, prompts] of Object.entries(soundPrompts)) {
      prompts.forEach((prompt, index) => {
        soundsToGenerate.push({
          category: soundKey,
          filename: `${soundKey}_${index + 1}`,
          prompt,
          duration: getDuration(category, soundKey),
        });
      });
    }

    // Initialize results
    setResults(soundsToGenerate.map(s => ({
      prompt: s.prompt,
      filename: s.filename,
      status: 'pending',
    })));

    // Generate sounds sequentially to avoid rate limiting
    for (let i = 0; i < soundsToGenerate.length; i++) {
      const sound = soundsToGenerate[i];
      setCurrentCategory(sound.category);
      
      // Update status to generating
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));

      const result = await generateSound(sound.prompt, sound.filename, sound.duration);
      
      // Update with result
      setResults(prev => prev.map((r, idx) => 
        idx === i ? {
          ...r,
          status: result.success ? 'success' : 'error',
          audioBlob: result.audioBlob,
          audioUrl: result.audioBlob ? URL.createObjectURL(result.audioBlob) : undefined,
          error: result.error,
        } : r
      ));

      setProgress(((i + 1) / soundsToGenerate.length) * 100);

      // Small delay between requests to avoid rate limiting
      if (i < soundsToGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    setIsGenerating(false);
    setCurrentCategory('');
  };

  const playSound = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.play();
  };

  const downloadSound = (audioBlob: Blob, filename: string) => {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllSounds = async () => {
    const successfulResults = results.filter(r => r.status === 'success' && r.audioBlob);
    
    for (const result of successfulResults) {
      if (result.audioBlob) {
        downloadSound(result.audioBlob, result.filename);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const weatherCount = Object.values(WEATHER_SOUND_PROMPTS).flat().length;
  const storyCount = Object.values(STORY_SOUND_PROMPTS).flat().length;

  const renderSoundPanel = (category: SoundCategory) => {
    const soundPrompts = getSoundPrompts(category);
    const totalCount = category === 'weather' ? weatherCount : storyCount;
    const categoryLabel = category === 'weather' ? 'Weather' : 'Story';
    const Icon = category === 'weather' ? Cloud : Swords;

    return (
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex gap-4 items-center flex-wrap">
          <Button 
            onClick={() => generateAllSounds(category)} 
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                Generate All {categoryLabel} Sounds ({totalCount})
              </>
            )}
          </Button>
          
          {successCount > 0 && (
            <Button 
              onClick={downloadAllSounds}
              variant="outline"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All ({successCount})
            </Button>
          )}
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating: {currentCategory}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        {/* Stats */}
        {results.length > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-green-500">✓ Success: {successCount}</span>
            <span className="text-red-500">✗ Errors: {errorCount}</span>
            <span className="text-muted-foreground">Pending: {results.filter(r => r.status === 'pending').length}</span>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <div className="space-y-2">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.status === 'success' ? 'bg-green-500/10 border-green-500/20' :
                    result.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                    result.status === 'generating' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {result.status === 'generating' && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
                    {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{result.filename}</div>
                    <div className="text-xs text-muted-foreground truncate">{result.prompt}</div>
                    {result.error && <div className="text-xs text-red-500">{result.error}</div>}
                  </div>
                  
                  {result.status === 'success' && result.audioUrl && result.audioBlob && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => playSound(result.audioUrl!)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => downloadSound(result.audioBlob!, result.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Category breakdown */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h4 className="font-medium mb-2">
              {categoryLabel} Categories ({Object.keys(soundPrompts).length} categories, 6 variations each)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              {Object.keys(soundPrompts).map(cat => (
                <div key={cat} className="font-mono text-muted-foreground text-xs">{cat}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Sound Effects Generator
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Generate {weatherCount + storyCount} sounds using ElevenLabs SFX API (6 variations per category)
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as SoundCategory); setResults([]); }}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="weather" className="flex items-center gap-2">
                <Cloud className="h-4 w-4" />
                Weather Sounds ({weatherCount})
              </TabsTrigger>
              <TabsTrigger value="story" className="flex items-center gap-2">
                <Swords className="h-4 w-4" />
                Story Sounds ({storyCount})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="weather">
              {renderSoundPanel('weather')}
            </TabsContent>
            <TabsContent value="story">
              {renderSoundPanel('story')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoundGenerator;
