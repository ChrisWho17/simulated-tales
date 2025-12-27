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

// Story sound effects with 6 variations each - comprehensive genre coverage
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
  combat_axe: [
    'Battle axe swinging through air, heavy blade whoosh',
    'Axe chopping into wood or flesh, heavy cleaving impact',
    'Viking axe swing, powerful weapon arc, brutal sound',
    'Throwing axe spinning through air, rotating blade',
    'Double axe swing combo, rapid heavy weapon attacks',
    'Axe hitting shield, metal on wood impact, blocked attack',
  ],
  combat_mace: [
    'Heavy mace swing, weighted weapon whooshing through air',
    'Mace crushing impact, blunt force trauma, bone-breaking',
    'Spiked mace hitting armor, metal crushing metal',
    'Morning star swing, chain weapon whooshing',
    'War hammer smashing impact, devastating blow',
    'Mace blocked by shield, heavy thud, absorbed impact',
  ],
  combat_dagger: [
    'Quick dagger stab, swift blade thrust, assassination',
    'Dagger slashing rapidly, multiple quick cuts',
    'Knife being drawn from sheath, metal sliding',
    'Throwing knife whizzing through air, spinning blade',
    'Dagger parry, small blade blocking, quick defense',
    'Dual daggers slashing, rapid paired attacks',
  ],
  combat_bow: [
    'Bow string being drawn back, tension building, archery',
    'Arrow firing from bow, string release, projectile launch',
    'Arrow whistling through air, fast projectile whoosh',
    'Arrow hitting target with thud, successful strike',
    'Quiver of arrows rattling, archer movement',
    'Multiple arrows firing in volley, rapid archery',
  ],

  // FIREARMS
  gun_pistol: [
    'Single pistol gunshot, sharp crack, handgun firing',
    'Revolver shot, powerful handgun blast, six-shooter',
    'Semi-automatic pistol firing, quick shots, modern handgun',
    'Silenced pistol shot, muffled suppressed gunfire, stealth',
    'Pistol dry fire click, out of ammo, trigger pull',
    'Double tap pistol shots, two quick rounds, combat shooting',
  ],
  gun_rifle: [
    'Rifle gunshot, loud crack echoing, hunting rifle',
    'Assault rifle burst fire, military three-round burst',
    'Sniper rifle shot, suppressed crack, precision shot',
    'Bolt action rifle cycling, chamber round, reload',
    'Rifle bullet ricochet, whizzing deflection, miss',
    'Hunting rifle shot in forest, echoing through trees',
  ],
  gun_shotgun: [
    'Shotgun blast, deep booming discharge, powerful spread',
    'Pump action shotgun cycling, shell ejecting, reload',
    'Double barrel shotgun both barrels, devastating blast',
    'Shotgun hitting wood, pellets impacting, spread damage',
    'Combat shotgun rapid fire, tactical shooting',
    'Sawed-off shotgun blast, short barrel, loud boom',
  ],
  gun_machinegun: [
    'Machine gun sustained fire, rapid automatic bursts',
    'Heavy machine gun, deep powerful automatic fire',
    'Submachine gun spray, rapid compact automatic',
    'Mounted machine gun, steady sustained suppression',
    'Machine gun belt feeding, ammunition chain sound',
    'Machine gun overheat, barrel sizzling, cooldown',
  ],
  gun_reload: [
    'Magazine being ejected from gun, metal click',
    'Fresh magazine inserted, reload complete, click',
    'Shotgun shells being loaded, one by one insert',
    'Revolver cylinder opening, shells falling out',
    'Pistol slide racking, chambering round, ready',
    'Speed reload, quick magazine swap, tactical',
  ],
  gun_bullet_impact: [
    'Bullet hitting metal, spark and ricochet, deflection',
    'Bullet hitting flesh, impact sound, wound',
    'Bullets hitting concrete, chips flying, wall damage',
    'Bullet through glass, shattering, penetration',
    'Bullet hitting water, splash, liquid impact',
    'Bullet hitting wood, splintering, penetration',
  ],

  // EXPLOSIONS & HEAVY WEAPONS
  explosion_grenade: [
    'Hand grenade exploding, sharp blast with debris',
    'Frag grenade detonation, shrapnel flying, deadly',
    'Flashbang grenade, bright flash, disorienting bang',
    'Smoke grenade popping, hissing gas release',
    'Grenade bounce and roll before explosion',
    'Multiple grenades exploding in sequence, chaos',
  ],
  explosion_tank: [
    'Tank main cannon firing, massive boom, armored',
    'Tank shell explosion on impact, devastating blast',
    'Tank engine rumbling, heavy armored vehicle idle',
    'Tank treads grinding on ground, metal on earth',
    'Tank turret rotating, mechanical movement',
    'Tank shell whizzing past, near miss, deadly',
  ],
  explosion_artillery: [
    'Artillery cannon firing, deep thunderous boom',
    'Mortar launching with thump, projectile away',
    'Artillery shell incoming whistle, danger approaching',
    'Artillery impact explosion, devastating bombardment',
    'Howitzer firing, massive military cannon blast',
    'Rocket artillery salvo, multiple launches, devastation',
  ],
  explosion_rocket: [
    'Rocket launcher firing, whooshing ignition, projectile',
    'RPG rocket flying, propelled grenade whoosh',
    'Rocket impact explosion, fiery blast, destruction',
    'Missile launch, powerful ignition, tracking weapon',
    'Anti-tank rocket hitting vehicle, explosion',
    'Shoulder-fired rocket, backblast, launch sound',
  ],
  explosion_generic: [
    'Large explosion, fiery blast, destruction debris',
    'Car explosion, vehicle bursting into flames, chaos',
    'Building explosion, structural collapse, devastating',
    'Fuel tank explosion, massive fireball, ignition',
    'Distant explosion rumbling, far away blast, war',
    'Small explosion, minor blast, debris scattering',
  ],

  // VEHICLES - GROUND
  vehicle_car_engine: [
    'Car engine starting up, ignition turning over, motor',
    'Car engine idling smoothly, rumbling motor at rest',
    'Car accelerating hard, engine revving, speeding away',
    'Sports car engine roar, high performance, powerful',
    'Old car engine sputtering, unreliable vehicle',
    'Car engine turning off, motor dying down, parked',
  ],
  vehicle_car_movement: [
    'Car driving past at speed, doppler effect whoosh',
    'Car tires on pavement, steady driving sound',
    'Car tires screeching to stop, rubber on asphalt',
    'Car driving on gravel, crunching stones, rural',
    'Car driving through puddles, water splashing',
    'Car chase, high speed driving, dangerous pursuit',
  ],
  vehicle_car_misc: [
    'Car horn honking, single beep, traffic warning',
    'Car door opening and closing, vehicle entry',
    'Car window rolling down, electric motor, glass',
    'Car trunk opening, hatch lifting, storage',
    'Car alarm going off, security system, warning',
    'Car crash impact, metal crumpling, collision',
  ],
  vehicle_motorcycle: [
    'Motorcycle engine starting, powerful bike ignition',
    'Motorcycle engine revving, powerful rumble, acceleration',
    'Motorcycle speeding past, loud engine doppler effect',
    'Harley Davidson rumble, deep powerful cruiser',
    'Sport bike high RPM, screaming engine, fast',
    'Motorcycle braking, engine downshifting, stopping',
  ],
  vehicle_bicycle: [
    'Bicycle wheels spinning, chain clicking, pedaling',
    'Bicycle bell ringing, ding ding, path warning',
    'Bicycle braking, brake pads on rim, stopping',
    'Bicycle going over bump, frame rattling',
    'Bicycle gears shifting, chain moving, click',
    'Bicycle riding fast, wind rushing, speed',
  ],
  vehicle_bus: [
    'Large bus engine rumbling, diesel motor, transit',
    'Bus air brakes releasing with hiss, stopping',
    'Bus doors opening, hydraulic whoosh, passenger entry',
    'School bus engine, yellow bus sounds, children',
    'Bus pulling away from stop, acceleration',
    'Bus horn, deep honk, large vehicle warning',
  ],
  vehicle_truck: [
    'Heavy truck engine rumbling, big rig diesel',
    'Semi truck air horn blaring, loud warning',
    'Truck jake brake, engine braking, downhill',
    'Truck reversing beep, backup warning sound',
    'Garbage truck compacting, hydraulic crushing',
    'Dump truck unloading, bed raising, material falling',
  ],
  vehicle_tank_military: [
    'Military tank engine rumbling, heavy armored vehicle',
    'Tank treads clanking on road, metal on pavement',
    'Tank moving through mud, heavy vehicle terrain',
    'Tank hatch opening, metal clang, crew movement',
    'Armored personnel carrier engine, military transport',
    'Tank turret traversing, motor whirring, aiming',
  ],
  vehicle_hydraulics: [
    'Hydraulic lift operating, pressurized raising',
    'Hydraulic pressure release, hissing air, system',
    'Hydraulic car lowrider bouncing, suspension play',
    'Hydraulic door opening, heavy machinery',
    'Hydraulic press crushing, powerful compression',
    'Forklift hydraulics, lifting mechanism, warehouse',
  ],

  // VEHICLES - AIR
  vehicle_helicopter: [
    'Helicopter hovering overhead, rotor blades chopping',
    'Helicopter flying past, doppler rotor sound',
    'Helicopter taking off, rotor speed increasing',
    'Helicopter landing, rotor wash, descent',
    'Military helicopter gunship, aggressive approach',
    'Helicopter interior, cabin noise, rotors muffled',
  ],
  vehicle_airplane: [
    'Military jet flying overhead, loud engine roar',
    'Propeller airplane flying, buzzing engine sound',
    'Commercial airliner passing overhead, high altitude',
    'Fighter jet afterburner, sonic boom approach',
    'Small Cessna airplane, light aircraft engine',
    'Plane taking off from runway, acceleration, lift',
  ],
  vehicle_drone: [
    'Small drone hovering, electric motors buzzing',
    'Drone flying past, quadcopter whoosh',
    'Drone taking off, propellers spinning up',
    'Military drone overhead, surveillance sound',
    'Drone camera zooming, mechanical lens movement',
    'Drone landing, propellers slowing down',
  ],

  // CREATURES - ANIMALS
  creature_wolf: [
    'Wolf howling at night, lone wolf cry, wilderness',
    'Wolf growling aggressively, threatening snarl',
    'Wolf pack howling together, multiple wolves, eerie',
    'Wolf barking, alert warning, wild canine',
    'Wolf whimpering, injured or submissive, soft',
    'Wolf panting, running, breathing heavily',
  ],
  creature_dog: [
    'Dog barking alertly, guard dog warning, domestic',
    'Dog growling threateningly, warning sound',
    'Dog whining, wanting attention, pleading sound',
    'Dog panting happily, friendly dog breath',
    'Small dog yapping, high pitched barking',
    'Large dog deep bark, big breed warning',
  ],
  creature_cat: [
    'Cat meowing, domestic cat vocalization, calling',
    'Cat hissing aggressively, angry feline threat',
    'Cat purring contentedly, happy relaxed cat',
    'Cat yowling, nighttime cat fight, territorial',
    'Cat growling low, warning before attack',
    'Kitten meowing, small cute cat sound, young',
  ],
  creature_horse: [
    'Horse neighing loudly, equine vocalization',
    'Horse hooves galloping on dirt, running steed',
    'Horse snorting, breathing, equine sounds',
    'Horse walking on cobblestone, clip clop hooves',
    'Horse whinnying, excited equine sound',
    'Horse eating, chewing hay, stable sounds',
  ],
  creature_bear: [
    'Bear roaring aggressively, large predator threat',
    'Bear growling low, warning before attack',
    'Bear grunting, foraging sounds, searching',
    'Bear running, heavy footfalls, charge',
    'Bear cubs playing, small bear sounds',
    'Bear breathing heavily, close encounter, danger',
  ],
  creature_snake: [
    'Snake hissing warning, reptile threat sound',
    'Rattlesnake rattle, warning sound, danger',
    'Snake slithering through grass, scales on ground',
    'Large snake constricting, squeezing coils',
    'Cobra hood spreading, threatening display',
    'Snake striking, quick attack, fangs',
  ],
  creature_bird: [
    'Crow cawing, black bird call, ominous',
    'Owl hooting at night, nocturnal bird call',
    'Eagle screeching, majestic bird of prey',
    'Raven croaking, deep bird call, foreboding',
    'Hawk screaming, hunting bird cry',
    'Vulture hissing, scavenger bird sound',
  ],
  creature_insect: [
    'Swarm of insects buzzing, flies or bees, many',
    'Single bee buzzing, flying insect sound',
    'Mosquito whine near ear, annoying buzz',
    'Cicadas buzzing loudly, summer insects',
    'Flies buzzing around, pest insects',
    'Beetle crawling, hard shell insect movement',
  ],

  // CREATURES - FANTASY/HORROR
  creature_dragon: [
    'Massive dragon roaring, deep thunderous beast',
    'Dragon breathing fire, whooshing flame breath',
    'Dragon wings flapping, huge leathery wings',
    'Dragon growling low, reptilian threat, ancient',
    'Dragon landing heavily, ground shaking impact',
    'Dragon sleeping, deep rumbling breathing',
  ],
  creature_monster: [
    'Large monster growling menacingly, creature threat',
    'Monster roaring, terrifying beast sound',
    'Monster footsteps, heavy creature walking',
    'Monster breathing, large creature respiration',
    'Monster eating, tearing flesh, gruesome',
    'Monster sniffing, hunting, searching for prey',
  ],
  creature_demon: [
    'Demonic creature screeching, hellish otherworldly',
    'Demon growling, supernatural evil, deep resonant',
    'Demon laughing, sinister cackling, evil',
    'Demon whispering, creepy voices, possession',
    'Demon roaring, powerful unholy beast',
    'Demonic portal, hellish energy, summoning',
  ],
  creature_zombie: [
    'Zombie groaning and shambling, undead moan',
    'Zombie growling, hungry undead, aggressive',
    'Zombie horde moaning, multiple undead, mass',
    'Zombie eating flesh, gruesome feeding sounds',
    'Zombie footsteps, shuffling dragging walk',
    'Zombie breaking through barrier, undead force',
  ],
  creature_ghost: [
    'Ghostly wailing, ethereal spirit moaning',
    'Ghost whisper, supernatural voice, creepy',
    'Poltergeist activity, objects moving, haunting',
    'Spirit passing through, whooshing apparition',
    'Ghost cackling, evil spirit laughter',
    'Ghostly presence, cold wind, supernatural chill',
  ],
  creature_werewolf: [
    'Werewolf howling, bestial creature cry, moonlit',
    'Werewolf growling, human-wolf hybrid threat',
    'Werewolf transformation, bones cracking, changing',
    'Werewolf snarling, ready to attack, aggressive',
    'Werewolf running, fast predator pursuit',
    'Werewolf claws scraping, sharp nails on surface',
  ],

  // HUMAN SOUNDS
  human_laugh_male: [
    'Man laughing genuinely, male chuckle, happy',
    'Deep male belly laugh, hearty laughter',
    'Man chuckling, light male laughter, amused',
    'Evil male laugh, sinister cackling, villain',
    'Nervous male laugh, uncomfortable chuckle',
    'Male group laughing together, friends, social',
  ],
  human_laugh_female: [
    'Woman laughing genuinely, female giggle, joyful',
    'Female giggling, light feminine laughter',
    'Woman cackling, witchy laugh, creepy',
    'Woman laughing nervously, uncomfortable female',
    'Female group laughing, friends together, social',
    'Child laughing, innocent young laughter, play',
  ],
  human_scream: [
    'Man screaming in fear, male terror yell',
    'Woman screaming in fear, female terror shriek',
    'Scream of pain, injured person, agony',
    'Startled scream, surprised shout, sudden fear',
    'Battle cry scream, aggressive attack yell',
    'Child screaming, young person fear or play',
  ],
  human_breath: [
    'Heavy breathing, exhausted panting, out of breath',
    'Calm breathing, relaxed respiration, peaceful',
    'Nervous breathing, anxious quick breaths, fear',
    'Holding breath then exhale, tension release',
    'Breathing through mask, muffled respiration',
    'Cold breath in winter, visible exhale, icy',
  ],
  human_cough: [
    'Single cough, throat clearing, minor',
    'Coughing fit, multiple coughs, sick',
    'Choking cough, something stuck, struggle',
    'Suppressed cough, trying to be quiet',
    'Wet cough, phlegm, illness sound',
    'Dry cough, irritated throat, hacking',
  ],
  human_cry: [
    'Person crying and sobbing, emotional tears',
    'Soft weeping, quiet crying, sadness',
    'Hysterical crying, overwhelming emotion',
    'Sniffling after crying, tears subsiding',
    'Child crying, young person upset',
    'Crying in despair, grief, loss',
  ],
  human_grunt: [
    'Person grunting with physical effort, exertion',
    'Pain grunt, taking damage, hurt',
    'Lifting grunt, heavy object strain',
    'Combat grunt, attack effort sound',
    'Frustrated grunt, annoyed expression',
    'Acknowledgment grunt, male confirmation',
  ],
  human_gasp: [
    'Gasping in surprise, shocked inhale',
    'Gasp for air, coming up from water',
    'Horror gasp, seeing something terrifying',
    'Gasp of wonder, amazement breath',
    'Gasp of pain, sudden injury reaction',
    'Last gasp, dying breath, final exhale',
  ],
  human_heartbeat: [
    'Human heartbeat thumping, pulse sound, tension',
    'Rapid heartbeat, anxious fast pulse, fear',
    'Slow heartbeat, calm relaxed pulse',
    'Heartbeat in ears, blood pumping, stress',
    'Heartbeat accelerating, increasing tension',
    'Heartbeat slowing down, calming, relief',
  ],

  // CROWD SOUNDS
  crowd_cheer: [
    'Crowd cheering excitedly, stadium celebration',
    'Small crowd cheering, group celebration',
    'Massive crowd roar, overwhelming cheer, sports',
    'Audience applause turning to cheers, performance',
    'Victory cheers, celebration, winning',
    'Rally crowd cheering, enthusiastic gathering',
  ],
  crowd_applause: [
    'Audience clapping and applauding, appreciation',
    'Slow clap building, sarcastic or genuine',
    'Standing ovation, enthusiastic long applause',
    'Golf clap, polite minimal applause',
    'Thunderous applause, overwhelming clapping',
    'Applause dying down, end of performance',
  ],
  crowd_boo: [
    'Crowd booing disapprovingly, audience displeasure',
    'Angry crowd booing, hostile reaction',
    'Mixed boos and cheers, divided opinion',
    'Booing villain, theatrical disapproval',
    'Sustained booing, continuous displeasure',
    'Booing fading out, disappointment subsiding',
  ],
  crowd_murmur: [
    'Crowd murmuring quietly, background chatter',
    'Audience anticipation murmur, waiting buzz',
    'Crowd gasping in unison, collective surprise',
    'Stadium ambient crowd, general noise',
    'Church congregation murmur, quiet gathering',
    'Bar crowd noise, social drinking atmosphere',
  ],

  // FOOTSTEPS
  footstep_stone: [
    'Footsteps on stone floor, hard sole on marble',
    'Walking on cobblestone, medieval street footsteps',
    'Running on stone, quick hard footsteps, chase',
    'Slow cautious steps on stone, sneaking',
    'Heavy boots on stone floor, armored walking',
    'Light footsteps on marble, elegant walking',
  ],
  footstep_wood: [
    'Footsteps on wooden floor, creaking boards',
    'Walking on wooden deck, ship or dock sounds',
    'Running on wooden floor, quick creaking steps',
    'Slow steps on old wooden floor, squeaky boards',
    'Heavy boots on wooden planks, solid steps',
    'Light footsteps on hardwood, soft indoor',
  ],
  footstep_grass: [
    'Footsteps in grass, soft outdoor walking, field',
    'Walking through tall grass, brushing vegetation',
    'Running through meadow, quick grass footsteps',
    'Slow careful steps in grass, quiet outdoor',
    'Heavy footsteps crushing grass, trudging',
    'Light footsteps on lawn, gentle walking',
  ],
  footstep_gravel: [
    'Footsteps on gravel, crunching stones, path',
    'Walking on loose gravel, shifting pebbles',
    'Running on gravel, rapid crunching sounds',
    'Slow steps on gravel, careful crunching',
    'Heavy boots on gravel path, loud crushing',
    'Light footsteps on pebbles, gentle gravel',
  ],
  footstep_water: [
    'Footsteps splashing in shallow water, wet walking',
    'Walking through puddles, water splashing',
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
    'Heavy boots on metal plate, loud industrial',
    'Light footsteps on thin metal, delicate clang',
  ],
  footstep_snow: [
    'Footsteps crunching in snow, winter walking',
    'Walking through deep snow, powder crunching',
    'Running on snow, rapid crunching sounds',
    'Slow trudging through snow, heavy effort',
    'Ice crackling under feet, frozen ground',
    'Footsteps on packed snow, compressed ice',
  ],

  // DOORS
  door_wood_open: [
    'Wooden door opening, creaking hinges, entry',
    'Old wooden door slowly opening, loud creak',
    'Heavy oak door opening, solid wood movement',
    'Light wooden door swinging open, quick',
    'Damaged wooden door opening, grinding creak',
    'Well-oiled wooden door opening, smooth quiet',
  ],
  door_wood_close: [
    'Wooden door closing, solid thud, entry sealed',
    'Wooden door slamming shut, loud bang, angry',
    'Gentle wooden door close, soft click, quiet',
    'Heavy wooden door closing slowly, deep thud',
    'Old wooden door closing with creak, aged',
    'Light wooden door clicking shut, casual close',
  ],
  door_metal_open: [
    'Metal door opening, heavy grinding, industrial',
    'Steel door swinging open, metallic scraping',
    'Iron dungeon door opening, ancient metal creak',
    'Modern metal door opening, clean mechanical',
    'Rusty metal door forced open, grinding resist',
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
    'Old rusty lock turning, difficult mechanism',
    'Modern deadbolt locking, clean mechanical',
  ],

  // CONTAINERS & OBJECTS
  object_chest: [
    'Treasure chest opening, creaking wood and metal',
    'Old wooden chest unlocking, hinges creaking',
    'Large chest lid lifting, heavy wooden opening',
    'Chest slamming shut, loud wooden close',
    'Metal-bound chest opening, clasps releasing',
    'Ancient chest opening slowly, aged wood sound',
  ],
  object_coins: [
    'Coins jingling, gold and silver clinking, treasure',
    'Coins being counted, metal on metal, currency',
    'Coins dropping on table, metallic scatter',
    'Large pile of coins shifting, treasure sound',
    'Single coin spinning on surface, metallic spin',
    'Coins in pocket jingling, walking money sound',
  ],
  object_keys: [
    'Keys jingling, metal keys on ring, jangling',
    'Key being inserted in lock, metal on metal',
    'Key ring being picked up, multiple keys',
    'Keys dropped on table, metallic clatter',
    'Single key turning, lock mechanism sound',
    'Keys sorting through, finding right key',
  ],
  object_glass_break: [
    'Glass shattering, breaking impact, shards falling',
    'Window breaking, glass explosion, loud crash',
    'Small glass breaking, delicate shatter',
    'Large glass pane shattering, dramatic break',
    'Glass bottle breaking, liquid spill, crash',
    'Crystal goblet breaking, high pitched shatter',
  ],
  object_chain: [
    'Chains rattling, metal links clinking, dungeon',
    'Heavy chain dragging, metal on stone, prison',
    'Chain being pulled, taut metal sound',
    'Chain dropping, metal links clattering',
    'Chain swinging, metal moving through air',
    'Shackles and chains, prisoner sounds',
  ],
  object_lever: [
    'Lever being pulled, mechanical mechanism click',
    'Heavy lever activation, gears turning, ancient',
    'Quick lever pull, simple mechanism sound',
    'Rusty lever forced, grinding resistance',
    'Lever resetting, spring mechanism returning',
    'Multiple levers activating, complex mechanism',
  ],

  // ENVIRONMENT & ELEMENTS
  element_fire: [
    'Fire crackling and popping, campfire or fireplace',
    'Large fire roaring, building fire or bonfire',
    'Torch flame burning, crackling fire light',
    'Fire starting, kindling catching, flames growing',
    'Fire dying down, embers crackling, fading',
    'Inferno blazing, massive fire, overwhelming',
  ],
  element_water: [
    'Water dripping slowly, leaky faucet or cave',
    'Water splashing, entering pool or lake',
    'Water pouring into glass or container',
    'Waterfall rushing, powerful water flow',
    'Stream flowing, gentle river sounds',
    'Waves lapping at shore, ocean water',
  ],
  element_electricity: [
    'Electric spark zapping, electrical discharge',
    'Electrical humming, power lines or transformer',
    'Electric shock buzz, high voltage danger',
    'Power surge, electrical overload, sparks',
    'Tesla coil arcing, electrical discharge',
    'Fuse box sparking, electrical failure',
  ],
  element_ice: [
    'Ice cracking and breaking, frozen surface stress',
    'Icicle breaking, frozen spike snapping',
    'Ice forming, freezing crystallization sound',
    'Frozen lake creaking, thin ice warning',
    'Ice cubes clinking in glass, cold drink',
    'Glacier calving, massive ice breaking off',
  ],
  element_earthquake: [
    'Earthquake rumbling, ground shaking, seismic',
    'Ground cracking, earth splitting open',
    'Building shaking, structure stress, quake',
    'Debris falling during earthquake, collapse',
    'Deep earth groan, tectonic movement',
    'Earthquake subsiding, rumbling fading, relief',
  ],

  // MAGIC & SCI-FI
  magic_spell: [
    'Magic spell being cast, mystical energy whoosh',
    'Spell charging up, magical energy gathering',
    'Magic dissipating, spell ending, energy fading',
    'Powerful magic surge, overwhelming arcane force',
    'Subtle magic use, quiet spell, enchantment',
    'Magic backfire, spell gone wrong, explosion',
  ],
  magic_heal: [
    'Healing spell casting, warm magical glow',
    'Gentle healing magic, soothing restoration',
    'Powerful healing burst, magical health restore',
    'Divine healing, holy restoration, blessed',
    'Quick heal spell, rapid magical recovery',
    'Healing complete chime, restoration finished',
  ],
  magic_portal: [
    'Magical portal opening, dimensional gateway',
    'Portal humming, active dimensional rift',
    'Stepping through portal, transport whoosh',
    'Portal closing, gateway sealing, energy fade',
    'Unstable portal, flickering dimensional tear',
    'Portal explosion, gateway failure, violent',
  ],
  scifi_laser: [
    'Laser gun firing, pew pew energy weapon',
    'Laser beam continuous, sustained energy fire',
    'Laser charging up, building energy power',
    'Laser ricochet, energy deflection, bounce',
    'Heavy laser cannon, powerful energy blast',
    'Laser hitting target, energy impact, sizzle',
  ],
  scifi_tech: [
    'Futuristic computer beeping, sci-fi interface',
    'Robot servo motors moving, mechanical joints',
    'Spaceship engine humming, starship ambient',
    'Warp drive engaging, faster than light whoosh',
    'Force field activating, energy barrier hum',
    'Technology malfunction, sparks and errors',
  ],
  scifi_teleport: [
    'Teleportation sound, matter transport whoosh',
    'Beaming in, materialization sparkle sound',
    'Beaming out, dematerialization fade',
    'Blink teleport, instant quick transport',
    'Teleport failure, partial transport error',
    'Group teleport, multiple people transport',
  ],

  // MUSIC & INSTRUMENTS
  music_drum: [
    'Single drum hit, snare or bass drum impact',
    'Drum roll, building tension, percussion',
    'War drum beating, tribal battle drums',
    'Timpani boom, orchestral dramatic drums',
    'Drum kit crash, cymbal and drums together',
    'Heartbeat drum rhythm, primal beat',
  ],
  music_horn: [
    'Trumpet fanfare, royal announcement brass',
    'War horn blowing, battle signal, medieval',
    'French horn melodic, orchestral brass',
    'Hunting horn signal, chase beginning',
    'Viking horn blast, Norse war signal',
    'Taps trumpet, solemn military melody',
  ],
  music_bell: [
    'Church bell ringing, deep resonant toll',
    'Small bell chiming, notification ding',
    'Ship bell ringing, nautical signal',
    'Alarm bell ringing, urgent warning',
    'Wind chimes tinkling, gentle melody',
    'Door bell chiming, visitor arrival',
  ],
  music_strings: [
    'Dramatic violin stinger, tension building',
    'Harp glissando sweep, magical dreamy',
    'Cello deep note, somber emotional tone',
    'Guitar strum, acoustic chord sound',
    'Orchestra strings swell, emotional rise',
    'Pizzicato pluck, playful string sound',
  ],

  // === ACOUSTIC ENVIRONMENTS - INDOOR (reverb) ===
  acoustic_indoor_gunshot: [
    'Gunshot fired indoors, loud reverberating echo in enclosed space, concrete walls',
    'Pistol shot in warehouse, metallic reverb, indoor gunfire echo',
    'Rifle shot inside building, deafening indoor reverb, enclosed space',
    'Shotgun blast indoors, massive reverberating boom, room echo',
    'Gunfire in hallway, echoing down corridor, indoor acoustics',
    'Suppressed gunshot indoors, muffled reverb, quiet indoor shot',
  ],
  acoustic_indoor_explosion: [
    'Explosion inside building, reverberating blast, walls shaking',
    'Grenade detonation indoors, enclosed explosion reverb, debris',
    'Indoor blast with glass shattering, reverberating destruction',
    'Explosion in tunnel, echoing blast down corridor, confined space',
    'Small explosion in room, reverberating boom, indoor acoustics',
    'Large indoor explosion, overwhelming reverb, structure damage',
  ],
  acoustic_indoor_voice: [
    'Voice echoing in large hall, cathedral-like reverb, spacious',
    'Shouting in warehouse, industrial reverb, echoing voice',
    'Whisper in stone room, slight reverb, quiet indoor voice',
    'Scream in enclosed space, reverberating terror, indoor shriek',
    'Footsteps and voice in corridor, hallway reverb, approaching',
    'Crowd murmur in large indoor space, reverberating chatter',
  ],
  acoustic_indoor_combat: [
    'Sword fight indoors, metal clashing with reverb, stone walls',
    'Hand to hand combat in room, impacts with indoor echo',
    'Arrow hitting stone wall indoors, reverberating impact',
    'Shield block echoing in hall, metallic reverb, defensive',
    'Axe chopping wood indoors, echoing chop, workshop',
    'Chain rattling in dungeon, metallic reverb, prison echo',
  ],

  // === ACOUSTIC ENVIRONMENTS - OUTDOOR (echo/open) ===
  acoustic_outdoor_gunshot: [
    'Gunshot outdoors, sharp crack echoing across open field, distance',
    'Rifle shot in mountains, echoing off cliffs, outdoor gunfire',
    'Pistol shot in forest, muffled by trees, outdoor woodland',
    'Shotgun blast outside, open air boom, no reverb, clean',
    'Distant outdoor gunfire, echoes fading, far away shots',
    'Multiple outdoor gunshots, open field, rolling echoes',
  ],
  acoustic_outdoor_explosion: [
    'Outdoor explosion, open air blast, echoing across landscape',
    'Explosion in field, no reverb, clean blast, distant echo',
    'Artillery explosion outdoors, thundering boom, rolling echo',
    'Car explosion outside, open air fireball, echoing debris',
    'Distant outdoor explosion, rumbling echo, far away blast',
    'Multiple explosions outdoors, battlefield, rolling thunder',
  ],
  acoustic_outdoor_voice: [
    'Shouting across open field, voice carrying, outdoor call',
    'Voice echoing in canyon, natural reverb, outdoor acoustics',
    'Crowd cheering outdoors, open air celebration, no reverb',
    'Scream in open area, voice carrying, outdoor terror',
    'Distant voices outdoors, conversation carrying on wind',
    'Battle cries outdoors, warriors yelling, open field combat',
  ],
  acoustic_outdoor_combat: [
    'Sword fight outdoors, clean metal clashes, open air duel',
    'Battle sounds in open field, combat without reverb, clear',
    'Arrow whistling through open air, outdoor archery',
    'Horse hooves and combat outdoors, cavalry in field',
    'Shield wall clash outdoors, armies meeting, open battle',
    'Outdoor melee combat, multiple fighters, field battle',
  ],

  // === LOCATION AMBIENCES ===
  ambience_tavern: [
    'Busy medieval tavern, crowd chatter, glasses clinking, fireplace',
    'Quiet tavern at night, few patrons murmuring, fire crackling',
    'Rowdy tavern celebration, loud laughter, music, drinking',
    'Tavern kitchen sounds, pots clanking, cooking, busy staff',
    'Tavern with bard playing, lute music, appreciative crowd',
    'Tense tavern atmosphere, quiet talking, nervous energy',
  ],
  ambience_forest: [
    'Deep forest ambience, birds singing, leaves rustling, peaceful',
    'Dark forest at night, owls hooting, insects, mysterious',
    'Forest with stream, water babbling, nature sounds, serene',
    'Windy forest, trees creaking, leaves blowing, atmospheric',
    'Rainforest ambience, tropical birds, rain on canopy, humid',
    'Autumn forest, dry leaves crunching, wind, seasonal',
  ],
  ambience_city: [
    'Medieval city street, crowd noise, carts, merchants calling',
    'Modern city traffic, cars passing, honking, urban bustle',
    'City at night, distant traffic, occasional voices, quiet streets',
    'Busy marketplace, vendors shouting, crowds, commerce',
    'Industrial city, factories humming, machinery, urban noise',
    'City during rain, traffic on wet roads, urban storm',
  ],
  ambience_dungeon: [
    'Dark dungeon ambience, water dripping, distant chains, eerie',
    'Dungeon with prisoners, moaning, chains rattling, suffering',
    'Empty dungeon corridor, wind howling, torches flickering',
    'Dungeon with creatures, distant growls, scratching, danger',
    'Flooded dungeon, water echoing, splashing, wet stone',
    'Ancient dungeon, crumbling stone, dust falling, decay',
  ],
  ambience_castle: [
    'Castle great hall, echoing footsteps, distant voices, grand',
    'Castle courtyard, guards patrolling, birds, outdoor castle',
    'Castle during feast, celebration, music, crowd in hall',
    'Quiet castle night, wind outside, creaking, peaceful',
    'Castle under siege, distant battle, tension, war sounds',
    'Abandoned castle, wind through halls, decay, haunting',
  ],
  ambience_cave: [
    'Deep cave ambience, water dripping, echoes, underground',
    'Cave with bats, wings fluttering, squeaking, colony',
    'Underground river in cave, rushing water, cave acoustics',
    'Crystal cave, ethereal resonance, magical atmosphere',
    'Cave entrance, wind blowing in, daylight sounds mixing',
    'Lava cave, bubbling magma, heat, volcanic underground',
  ],
  ambience_ship: [
    'Sailing ship at sea, waves against hull, creaking wood, sails',
    'Ship during storm, violent rocking, thunder, crew shouting',
    'Ship below deck, muffled waves, creaking, sailor activity',
    'Pirate ship battle, cannons firing, chaos, naval combat',
    'Calm ship at anchor, gentle waves, birds, peaceful harbor',
    'Ghost ship ambience, creaking abandoned vessel, eerie wind',
  ],
  ambience_spaceship: [
    'Spaceship bridge, computer beeps, engine hum, sci-fi ambient',
    'Spaceship engine room, loud machinery, power systems',
    'Spaceship in hyperspace, warp drive hum, travel sounds',
    'Damaged spaceship, alarms, sparking, emergency sounds',
    'Spaceship cargo bay, echoing metal, crates, industrial',
    'Quiet spaceship corridor, life support hum, footsteps echo',
  ],
  ambience_battlefield: [
    'Active battlefield, gunfire, explosions, chaos, war zone',
    'Battlefield aftermath, fires burning, wind, distant sounds',
    'Medieval battlefield, swords clashing, war cries, combat',
    'Trench warfare ambience, distant artillery, mud, tension',
    'Aerial battle, planes roaring, explosions, dogfight',
    'Naval battle, ship cannons, water splashing, combat at sea',
  ],
  ambience_hospital: [
    'Hospital corridor, machines beeping, quiet footsteps, clinical',
    'Emergency room, urgent activity, monitors, medical chaos',
    'Hospital at night, quiet beeping, distant footsteps, calm',
    'Field hospital, wounded moaning, medical activity, war',
    'Mental asylum ambience, distant screams, unsettling, creepy',
    'Abandoned hospital, wind through broken windows, decay',
  ],
  ambience_laboratory: [
    'Science laboratory, bubbling beakers, electrical hum, research',
    'Mad scientist lab, tesla coils, ominous machinery, danger',
    'Clean room laboratory, air filtration, quiet precision',
    'Alchemist workshop, mortar grinding, fire, magical brewing',
    'Abandoned lab, dripping chemicals, broken equipment, decay',
    'High tech lab, computers humming, futuristic research',
  ],
  ambience_church: [
    'Church interior, organ playing, choir singing, reverent',
    'Empty church, footsteps echoing, peaceful silence, sacred',
    'Church bells ringing, congregation murmuring, service',
    'Abandoned church, wind through broken windows, decay',
    'Dark ritual in church, chanting, ominous, corrupted sacred',
    'Church during funeral, somber organ, weeping, mourning',
  ],
  ambience_prison: [
    'Prison block, inmates talking, guards walking, incarceration',
    'Prison riot, chaos, shouting, alarms, violence',
    'Solitary confinement, silence, distant sounds, isolation',
    'Prison cafeteria, crowd noise, trays, institutional dining',
    'Prison yard, outdoor prisoners, guards watching, exercise',
    'Prison at night, snoring, occasional sounds, lights out',
  ],
  ambience_swamp: [
    'Murky swamp, frogs croaking, insects buzzing, humid',
    'Swamp at night, eerie sounds, splashing, mysterious',
    'Swamp with alligators, low growls, water movement, danger',
    'Foggy swamp, muffled sounds, dripping, atmospheric',
    'Swamp village, stilted houses, water lapping, community',
    'Haunted swamp, ghostly sounds, will-o-wisps, supernatural',
  ],
  ambience_desert: [
    'Desert wind, sand blowing, dry heat, desolate',
    'Desert at night, cold wind, distant coyotes, stars',
    'Desert oasis, water sounds, birds, relief in wasteland',
    'Sandstorm approaching, wind building, dangerous weather',
    'Desert ruins, wind through ancient stones, mysterious',
    'Desert caravan, camels, traders talking, journey',
  ],
  ambience_arctic: [
    'Arctic wind, howling cold, ice creaking, frozen',
    'Blizzard sounds, whiteout conditions, extreme cold',
    'Arctic silence, pristine snow, distant wind, peaceful cold',
    'Ice cave, dripping, crystalline sounds, frozen underground',
    'Arctic wildlife, seals, penguins, polar environment',
    'Ship in arctic ice, creaking hull, ice pressure, trapped',
  ],

  // === ACTION CONTEXT SOUNDS ===
  action_stealth: [
    'Quiet sneaking footsteps, careful movement, stealth approach',
    'Lock picking sounds, metal tools, delicate clicks, breaking in',
    'Hiding breathing, trying to stay quiet, tension, concealment',
    'Stealth takedown, quick quiet attack, body falling softly',
    'Creeping through shadows, cloth rustling, careful movement',
    'Guard almost detecting, held breath, close call, tension',
  ],
  action_chase: [
    'Running chase, rapid footsteps, heavy breathing, pursuit',
    'Car chase, engines revving, tires screeching, dangerous driving',
    'Chase through market, crashing stalls, people yelling, chaos',
    'Rooftop chase, jumping, landing, urban parkour pursuit',
    'Forest chase, branches breaking, running through woods',
    'Chase ending, exhausted breathing, capture or escape',
  ],
  action_discovery: [
    'Discovery moment, surprised gasp, wonder, finding something',
    'Opening secret door, stone grinding, hidden passage revealed',
    'Finding treasure, coins shifting, valuable discovery',
    'Uncovering clue, paper rustling, investigation success',
    'Shocking discovery, horror gasp, terrible finding',
    'Ancient artifact discovery, magical resonance, important find',
  ],
  action_ritual: [
    'Dark ritual chanting, ominous voices, forbidden magic',
    'Holy ritual, sacred words, divine energy, blessing',
    'Summoning ritual, building energy, portal opening, calling',
    'Healing ritual, gentle chanting, restorative magic',
    'Sacrifice ritual, dark atmosphere, terrible ceremony',
    'Protective ritual, warding magic, barrier creation',
  ],
  action_death: [
    'Character death, final breath, dramatic end, tragedy',
    'Monster death, creature cry ending, defeated beast',
    'Execution sound, final moment, grim ending',
    'Peaceful death, quiet last breath, natural end',
    'Violent death, impact and silence, sudden end',
    'Undead rising, death reversing, resurrection horror',
  ],
  action_victory: [
    'Victory fanfare, triumphant music, celebration, success',
    'Battle won, cheering, relief, hard-fought victory',
    'Quest complete, satisfying resolution, achievement',
    'Boss defeated, epic victory, major accomplishment',
    'Crowd celebrating victory, cheers, applause, triumph',
    'Personal victory, internal satisfaction, quiet success',
  ],
};

interface GenerationResult {
  prompt: string;
  filename: string;
  status: 'pending' | 'generating' | 'success' | 'error' | 'cached';
  audioUrl?: string;
  error?: string;
  audioBlob?: Blob;
  cached?: boolean;
}

type SoundCategory = 'weather' | 'story';

export const SoundGenerator: React.FC = () => {
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentCategory, setCurrentCategory] = useState('');
  const [activeTab, setActiveTab] = useState<SoundCategory>('weather');
  const [cachedCount, setCachedCount] = useState(0);

  const getSoundPrompts = (category: SoundCategory) => {
    return category === 'weather' ? WEATHER_SOUND_PROMPTS : STORY_SOUND_PROMPTS;
  };

  const getDuration = (category: SoundCategory, soundKey: string) => {
    // Weather sounds - longer for ambient looping
    if (category === 'weather') return 15;
    
    // === VERY SHORT (1-2 seconds) - instant impacts ===
    if (soundKey.startsWith('gun_pistol') || soundKey.startsWith('gun_rifle') ||
        soundKey.startsWith('gun_shotgun') || soundKey.startsWith('gun_bullet')) return 2;
    if (soundKey.startsWith('combat_punch') || soundKey.startsWith('combat_kick') ||
        soundKey.startsWith('combat_dagger')) return 2;
    if (soundKey.startsWith('human_gasp') || soundKey.startsWith('human_cough') ||
        soundKey.startsWith('human_grunt')) return 2;
    if (soundKey.startsWith('object_glass_break')) return 2;
    if (soundKey.startsWith('music_drum') || soundKey.startsWith('music_bell')) return 2;
    
    // === SHORT (3-4 seconds) - quick actions ===
    if (soundKey.startsWith('combat_sword') || soundKey.startsWith('combat_axe') ||
        soundKey.startsWith('combat_mace') || soundKey.startsWith('combat_bow')) return 3;
    if (soundKey.startsWith('gun_reload') || soundKey.startsWith('gun_machinegun')) return 4;
    if (soundKey.startsWith('footstep_')) return 3;
    if (soundKey.startsWith('door_')) return 3;
    if (soundKey.startsWith('object_keys') || soundKey.startsWith('object_coins') ||
        soundKey.startsWith('object_lever') || soundKey.startsWith('object_chain')) return 3;
    if (soundKey.startsWith('human_scream') || soundKey.startsWith('human_laugh')) return 4;
    if (soundKey.startsWith('magic_spell') || soundKey.startsWith('magic_heal') ||
        soundKey.startsWith('scifi_laser') || soundKey.startsWith('scifi_teleport')) return 3;
    if (soundKey.startsWith('music_horn') || soundKey.startsWith('music_strings')) return 4;
    
    // === ACOUSTIC VARIANTS (3-5 seconds) - indoor reverb / outdoor echo ===
    if (soundKey.startsWith('acoustic_indoor_gunshot') || 
        soundKey.startsWith('acoustic_outdoor_gunshot')) return 4;
    if (soundKey.startsWith('acoustic_indoor_explosion') || 
        soundKey.startsWith('acoustic_outdoor_explosion')) return 5;
    if (soundKey.startsWith('acoustic_indoor_voice') || 
        soundKey.startsWith('acoustic_outdoor_voice')) return 4;
    if (soundKey.startsWith('acoustic_indoor_combat') || 
        soundKey.startsWith('acoustic_outdoor_combat')) return 4;
    
    // === MEDIUM (5-6 seconds) - events with buildup ===
    if (soundKey.startsWith('explosion_')) return 5;
    if (soundKey.startsWith('creature_wolf') || soundKey.startsWith('creature_dog') ||
        soundKey.startsWith('creature_cat') || soundKey.startsWith('creature_bird') ||
        soundKey.startsWith('creature_snake') || soundKey.startsWith('creature_insect')) return 5;
    if (soundKey.startsWith('creature_dragon') || soundKey.startsWith('creature_monster') ||
        soundKey.startsWith('creature_demon') || soundKey.startsWith('creature_zombie') ||
        soundKey.startsWith('creature_ghost') || soundKey.startsWith('creature_werewolf')) return 6;
    if (soundKey.startsWith('creature_horse') || soundKey.startsWith('creature_bear')) return 5;
    if (soundKey.startsWith('object_chest')) return 4;
    if (soundKey.startsWith('human_cry') || soundKey.startsWith('human_breath') ||
        soundKey.startsWith('human_heartbeat')) return 6;
    if (soundKey.startsWith('element_fire') || soundKey.startsWith('element_water') ||
        soundKey.startsWith('element_electricity') || soundKey.startsWith('element_ice')) return 6;
    if (soundKey.startsWith('magic_portal') || soundKey.startsWith('scifi_tech')) return 5;
    
    // === ACTION CONTEXT SOUNDS (4-8 seconds) ===
    if (soundKey.startsWith('action_stealth')) return 5;
    if (soundKey.startsWith('action_chase')) return 8;
    if (soundKey.startsWith('action_discovery')) return 4;
    if (soundKey.startsWith('action_ritual')) return 10;
    if (soundKey.startsWith('action_death')) return 5;
    if (soundKey.startsWith('action_victory')) return 6;
    
    // === LONGER (8-10 seconds) - sustained sounds ===
    if (soundKey.startsWith('vehicle_car') || soundKey.startsWith('vehicle_motorcycle') ||
        soundKey.startsWith('vehicle_truck') || soundKey.startsWith('vehicle_bus')) return 8;
    if (soundKey.startsWith('vehicle_tank') || soundKey.startsWith('vehicle_helicopter') ||
        soundKey.startsWith('vehicle_airplane') || soundKey.startsWith('vehicle_drone')) return 10;
    if (soundKey.startsWith('vehicle_bicycle') || soundKey.startsWith('vehicle_hydraulics')) return 6;
    if (soundKey.startsWith('crowd_')) return 8;
    if (soundKey.startsWith('element_earthquake')) return 10;
    
    // === LOCATION AMBIENCES (12-15 seconds) - for looping backgrounds ===
    if (soundKey.startsWith('ambience_')) return 15;
    
    // Default fallback
    return 5;
  };

  const generateSound = async (
    prompt: string, 
    filename: string, 
    duration: number,
    category: string
  ): Promise<{ success: boolean; audioUrl?: string; audioBlob?: Blob; error?: string; cached?: boolean }> => {
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
            filename,
            category, // Pass category for storage organization
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      const data = await response.json();
      
      // If cached, we get a publicUrl directly
      if (data.cached) {
        return { success: true, audioUrl: data.publicUrl, cached: true };
      }
      
      // If newly generated, convert base64 to blob for local playback
      if (data.audioContent) {
        const byteCharacters = atob(data.audioContent);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mpeg' });
        return { success: true, audioBlob, audioUrl: data.publicUrl, cached: false };
      }

      return { success: true, audioUrl: data.publicUrl, cached: false };
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
    let cached = 0;
    for (let i = 0; i < soundsToGenerate.length; i++) {
      const sound = soundsToGenerate[i];
      setCurrentCategory(sound.category);
      
      // Update status to generating
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));

      const result = await generateSound(sound.prompt, sound.filename, sound.duration, sound.category);
      
      if (result.cached) cached++;
      
      // Update with result
      setResults(prev => prev.map((r, idx) => 
        idx === i ? {
          ...r,
          status: result.cached ? 'cached' : (result.success ? 'success' : 'error'),
          audioBlob: result.audioBlob,
          audioUrl: result.audioUrl || (result.audioBlob ? URL.createObjectURL(result.audioBlob) : undefined),
          error: result.error,
          cached: result.cached,
        } : r
      ));

      setProgress(((i + 1) / soundsToGenerate.length) * 100);
      setCachedCount(cached);

      // Only delay for newly generated sounds (cached ones are instant)
      if (!result.cached && i < soundsToGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else if (i < soundsToGenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100)); // Brief delay for cached
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
  const cachedResultCount = results.filter(r => r.status === 'cached').length;
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
          
          {(successCount > 0 || cachedResultCount > 0) && (
            <Button 
              onClick={downloadAllSounds}
              variant="outline"
              disabled={isGenerating}
            >
              <Download className="h-4 w-4 mr-2" />
              Download All ({successCount + cachedResultCount})
            </Button>
          )}
        </div>

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing: {currentCategory}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
            {cachedCount > 0 && (
              <div className="text-xs text-blue-500">
                ⚡ {cachedCount} sounds loaded from cache (saving API calls!)
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {results.length > 0 && (
          <div className="flex gap-4 text-sm flex-wrap">
            <span className="text-green-500">✓ Generated: {successCount}</span>
            <span className="text-blue-500">⚡ Cached: {cachedResultCount}</span>
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
                    result.status === 'cached' ? 'bg-blue-500/10 border-blue-500/20' :
                    result.status === 'error' ? 'bg-red-500/10 border-red-500/20' :
                    result.status === 'generating' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {result.status === 'cached' && <CheckCircle className="h-5 w-5 text-blue-500" />}
                    {result.status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
                    {result.status === 'generating' && <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />}
                    {result.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium truncate">
                      {result.filename}
                      {result.status === 'cached' && <span className="ml-2 text-xs text-blue-500">(cached)</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{result.prompt}</div>
                    {result.error && <div className="text-xs text-red-500">{result.error}</div>}
                  </div>
                  
                  {(result.status === 'success' || result.status === 'cached') && result.audioUrl && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => playSound(result.audioUrl!)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      {result.audioBlob && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => downloadSound(result.audioBlob!, result.filename)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
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
