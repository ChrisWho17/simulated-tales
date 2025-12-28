import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, AlertCircle, Play, Loader2, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Comprehensive sound definitions covering all genres and environments
const SOUND_DEFINITIONS = [
  // ═══════════════════════════════════════════════════════════
  // WEATHER - RAIN (Indoor & Outdoor variants)
  // ═══════════════════════════════════════════════════════════
  { category: 'weather_rain', filename: 'rain_light_loop', prompt: 'Light gentle rain falling softly, ambient loop, peaceful drizzle, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_medium_loop', prompt: 'Medium steady rain falling, ambient rain loop, moderate rainfall, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_heavy_loop', prompt: 'Heavy intense rain pouring down, storm rain ambient loop, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_on_roof', prompt: 'Rain falling on a roof, indoor rain sound, pitter patter on rooftop, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_on_window', prompt: 'Rain hitting window glass, indoor cozy rain, water on glass, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_on_metal', prompt: 'Rain hitting metal surface, tin roof rain, industrial rain sound, 5 seconds' },
  { category: 'weather_rain', filename: 'rain_on_leaves', prompt: 'Rain falling on leaves in forest, nature rain, leafy rain ambient, 5 seconds' },
  
  // WEATHER - THUNDER
  { category: 'weather_thunder', filename: 'thunder_distant_1', prompt: 'Distant thunder rumble, far away thunderstorm, low rolling thunder, 3 seconds' },
  { category: 'weather_thunder', filename: 'thunder_distant_2', prompt: 'Distant thunder crack and rumble, faraway storm thunder, 3 seconds' },
  { category: 'weather_thunder', filename: 'thunder_distant_3', prompt: 'Very far distant thunder, subtle rumble on horizon, 4 seconds' },
  { category: 'weather_thunder', filename: 'thunder_close_1', prompt: 'Close loud thunder clap, nearby lightning strike thunder, powerful boom, 2 seconds' },
  { category: 'weather_thunder', filename: 'thunder_close_2', prompt: 'Very close thunder crack, intense lightning strike sound, startling thunder boom, 2 seconds' },
  { category: 'weather_thunder', filename: 'thunder_rolling', prompt: 'Long rolling thunder, continuous thunder rumble, storm passing, 5 seconds' },
  
  // WEATHER - WIND
  { category: 'weather_wind', filename: 'wind_light_loop', prompt: 'Light gentle breeze blowing, soft wind ambient loop, peaceful wind, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_medium_loop', prompt: 'Medium wind blowing steadily, moderate wind ambient loop, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_strong_loop', prompt: 'Strong powerful wind howling, intense wind ambient loop, gusty wind, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_howl_loop', prompt: 'Howling wind through mountains, eerie wind howl, spooky wind, 5 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_1', prompt: 'Sudden wind gust, quick burst of strong wind, 2 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_2', prompt: 'Wind gust swooshing by, sudden strong breeze, 2 seconds' },
  { category: 'weather_wind', filename: 'wind_gust_3', prompt: 'Powerful wind gust rushing past, intense momentary wind, 2 seconds' },
  { category: 'weather_wind', filename: 'wind_indoor_draft', prompt: 'Indoor wind draft, wind through cracks, creepy indoor wind, 3 seconds' },
  
  // WEATHER - SNOW & FOG
  { category: 'weather_snow', filename: 'snow_ambient_loop', prompt: 'Quiet snowy landscape ambient, muffled winter silence, soft snow falling, 5 seconds' },
  { category: 'weather_snow', filename: 'snow_crunch_footsteps', prompt: 'Footsteps crunching in snow, walking through snow, 2 seconds' },
  { category: 'weather_snow', filename: 'blizzard_wind_loop', prompt: 'Blizzard wind howling, intense snowstorm, harsh winter wind, 5 seconds' },
  { category: 'weather_fog', filename: 'fog_ambient_loop', prompt: 'Eerie foggy ambient atmosphere, misty silence, mysterious fog, 5 seconds' },
  { category: 'weather_fog', filename: 'fog_horn', prompt: 'Distant fog horn, maritime warning horn, harbor fog signal, 3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // EXPLOSIONS
  // ═══════════════════════════════════════════════════════════
  { category: 'explosion_large', filename: 'explosion_large_1', prompt: 'Massive explosion boom, large bomb explosion, powerful blast, 3 seconds' },
  { category: 'explosion_large', filename: 'explosion_large_2', prompt: 'Huge explosion with debris, building explosion, devastating blast, 3 seconds' },
  { category: 'explosion_small', filename: 'explosion_small_1', prompt: 'Small explosion, minor blast, grenade-sized explosion, 1.5 seconds' },
  { category: 'explosion_small', filename: 'explosion_small_2', prompt: 'Small fiery explosion, car bomb, compact explosion, 2 seconds' },
  { category: 'explosion_grenade', filename: 'grenade_1', prompt: 'Hand grenade explosion, military grenade blast, sharp explosion, 2 seconds' },
  { category: 'explosion_grenade', filename: 'grenade_2', prompt: 'Flashbang grenade, stun grenade explosion, bright flash sound, 1 second' },
  { category: 'explosion_debris', filename: 'debris_fall_1', prompt: 'Debris falling after explosion, rubble crashing down, destruction aftermath, 3 seconds' },
  { category: 'explosion_debris', filename: 'debris_fall_2', prompt: 'Building debris collapsing, structural collapse sound, 3 seconds' },
  { category: 'explosion_distant', filename: 'explosion_distant_1', prompt: 'Distant explosion boom, far away blast, muffled explosion, 2 seconds' },
  { category: 'explosion_distant', filename: 'explosion_distant_2', prompt: 'Multiple distant explosions, war zone distant blasts, 3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // MAGIC & FANTASY
  // ═══════════════════════════════════════════════════════════
  { category: 'magic_spell', filename: 'spell_cast_1', prompt: 'Magic spell casting, mystical energy release, wizard casting spell, 2 seconds' },
  { category: 'magic_spell', filename: 'spell_cast_2', prompt: 'Powerful spell incantation, magical energy surge, sorcerer magic, 2 seconds' },
  { category: 'magic_spell', filename: 'spell_fail', prompt: 'Spell fizzle and fail, magic backfire, failed enchantment, 1 second' },
  { category: 'magic_heal', filename: 'heal_spell_1', prompt: 'Healing magic sound, restorative spell, holy healing glow, 2 seconds' },
  { category: 'magic_heal', filename: 'heal_spell_2', prompt: 'Divine healing light, angelic restoration, blessed healing, 2 seconds' },
  { category: 'magic_portal', filename: 'portal_open_1', prompt: 'Magical portal opening, dimensional rift opening, mystical gateway, 3 seconds' },
  { category: 'magic_portal', filename: 'portal_close_1', prompt: 'Portal closing and vanishing, dimensional rift sealing, 2 seconds' },
  { category: 'magic_portal', filename: 'portal_ambient', prompt: 'Active portal humming, swirling dimensional energy, portal loop, 5 seconds' },
  { category: 'magic_fire', filename: 'fireball_cast', prompt: 'Fireball spell casting, fire magic whoosh, flame projectile, 1.5 seconds' },
  { category: 'magic_fire', filename: 'fire_explosion', prompt: 'Magical fire explosion, pyromancy blast, fire magic impact, 2 seconds' },
  { category: 'magic_ice', filename: 'ice_spell_cast', prompt: 'Ice magic casting, frost spell, freezing magic sound, 2 seconds' },
  { category: 'magic_ice', filename: 'ice_shatter', prompt: 'Ice shattering, frozen object breaking, crystalline destruction, 1 second' },
  { category: 'magic_lightning', filename: 'lightning_spell', prompt: 'Lightning magic strike, electrical spell zap, thunder magic, 1 second' },
  { category: 'magic_dark', filename: 'dark_magic_1', prompt: 'Dark sinister magic, shadow spell, evil enchantment, 2 seconds' },
  { category: 'magic_dark', filename: 'curse_cast', prompt: 'Curse being cast, hex magic, malevolent spell, 2 seconds' },
  { category: 'magic_summon', filename: 'summon_creature', prompt: 'Summoning ritual complete, creature conjured, magical summoning, 3 seconds' },
  { category: 'magic_enchant', filename: 'enchantment_1', prompt: 'Item being enchanted, magical imbue, weapon enchantment, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // CREATURES - ANIMALS
  // ═══════════════════════════════════════════════════════════
  { category: 'creature_wolf', filename: 'wolf_howl_1', prompt: 'Wolf howling at night, lone wolf howl, wilderness wolf cry, 3 seconds' },
  { category: 'creature_wolf', filename: 'wolf_howl_2', prompt: 'Pack of wolves howling, multiple wolves, wolf pack call, 4 seconds' },
  { category: 'creature_wolf', filename: 'wolf_growl', prompt: 'Aggressive wolf growling, threatening wolf snarl, 2 seconds' },
  { category: 'creature_dog', filename: 'dog_bark_1', prompt: 'Dog barking, alert dog bark, guard dog sound, 1 second' },
  { category: 'creature_dog', filename: 'dog_bark_distant', prompt: 'Distant dogs barking, neighborhood dogs, far away barking, 2 seconds' },
  { category: 'creature_dog', filename: 'dog_growl', prompt: 'Dog growling, threatening dog snarl, aggressive dog, 2 seconds' },
  { category: 'creature_horse', filename: 'horse_whinny_1', prompt: 'Horse neighing, horse whinny, equine sound, 2 seconds' },
  { category: 'creature_horse', filename: 'horse_gallop', prompt: 'Horse galloping, running horse hooves, fast horse, 3 seconds' },
  { category: 'creature_horse', filename: 'horse_walk', prompt: 'Horse walking slowly, horse hooves on ground, 2 seconds' },
  { category: 'creature_bear', filename: 'bear_roar', prompt: 'Bear roaring, aggressive bear growl, large bear attack, 2 seconds' },
  { category: 'creature_cat', filename: 'cat_meow', prompt: 'Cat meowing, domestic cat sound, feline call, 1 second' },
  { category: 'creature_cat', filename: 'cat_hiss', prompt: 'Cat hissing, angry cat, threatened cat sound, 1 second' },
  { category: 'creature_crow', filename: 'crow_caw', prompt: 'Crow cawing, raven call, ominous bird, 1.5 seconds' },
  { category: 'creature_owl', filename: 'owl_hoot', prompt: 'Owl hooting at night, nocturnal owl call, 2 seconds' },
  
  // CREATURES - MONSTERS & FANTASY
  { category: 'creature_dragon', filename: 'dragon_roar', prompt: 'Dragon roaring, massive dragon roar, fearsome beast, 3 seconds' },
  { category: 'creature_dragon', filename: 'dragon_fire_breath', prompt: 'Dragon breathing fire, fire breath attack, 3 seconds' },
  { category: 'creature_dragon', filename: 'dragon_wings', prompt: 'Dragon wings flapping, large leathery wings, 2 seconds' },
  { category: 'creature_monster', filename: 'monster_growl_1', prompt: 'Monster growling, beast snarl, creature threat, 2 seconds' },
  { category: 'creature_monster', filename: 'monster_roar_1', prompt: 'Monster roaring, beast attack roar, creature screech, 2 seconds' },
  { category: 'creature_zombie', filename: 'zombie_groan_1', prompt: 'Zombie groaning, undead moan, shuffling dead, 2 seconds' },
  { category: 'creature_zombie', filename: 'zombie_attack', prompt: 'Zombie attacking, undead snarl and bite, 1.5 seconds' },
  { category: 'creature_ghost', filename: 'ghost_whisper', prompt: 'Ghostly whisper, spectral voice, eerie phantom sound, 3 seconds' },
  { category: 'creature_ghost', filename: 'ghost_wail', prompt: 'Ghost wailing, spectral scream, haunting cry, 3 seconds' },
  { category: 'creature_demon', filename: 'demon_growl', prompt: 'Demon growling, hellish creature sound, infernal beast, 2 seconds' },
  { category: 'creature_demon', filename: 'demon_roar', prompt: 'Demon roaring, hellish scream, demonic attack, 2 seconds' },
  { category: 'creature_insect', filename: 'insects_swarm', prompt: 'Insect swarm buzzing, flies and bugs, swarming insects, 3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // VEHICLES - GROUND
  // ═══════════════════════════════════════════════════════════
  { category: 'vehicle_car_engine', filename: 'car_start', prompt: 'Car engine starting, vehicle ignition, engine turning over, 2 seconds' },
  { category: 'vehicle_car_engine', filename: 'car_idle_loop', prompt: 'Car engine idling, vehicle running idle, 5 seconds' },
  { category: 'vehicle_car_engine', filename: 'car_drive_loop', prompt: 'Car driving steady, vehicle on road, engine cruising, 5 seconds' },
  { category: 'vehicle_car_engine', filename: 'car_rev', prompt: 'Car engine revving, acceleration sound, engine roar, 2 seconds' },
  { category: 'vehicle_car', filename: 'car_horn', prompt: 'Car horn honking, vehicle horn beep, 1 second' },
  { category: 'vehicle_car', filename: 'car_screech', prompt: 'Car tires screeching, brake screech, tire squeal, 1.5 seconds' },
  { category: 'vehicle_car_crash', filename: 'car_crash_1', prompt: 'Car crash impact, vehicle collision, metal crashing, 2 seconds' },
  { category: 'vehicle_car_crash', filename: 'car_crash_2', prompt: 'Major car accident, multiple cars crashing, big collision, 3 seconds' },
  { category: 'vehicle_car', filename: 'car_door_open', prompt: 'Car door opening, vehicle door, 0.5 seconds' },
  { category: 'vehicle_car', filename: 'car_door_close', prompt: 'Car door closing, vehicle door slam, 0.5 seconds' },
  { category: 'vehicle_motorcycle', filename: 'motorcycle_engine', prompt: 'Motorcycle engine revving, bike engine roar, 2 seconds' },
  { category: 'vehicle_motorcycle', filename: 'motorcycle_pass', prompt: 'Motorcycle passing by, bike driving past, 2 seconds' },
  { category: 'vehicle_truck', filename: 'truck_engine', prompt: 'Large truck engine, semi truck rumble, diesel engine, 3 seconds' },
  { category: 'vehicle_truck', filename: 'truck_horn', prompt: 'Truck air horn, loud truck horn blast, 2 seconds' },
  
  // VEHICLES - SHIPS & BOATS
  { category: 'vehicle_ship', filename: 'ship_horn', prompt: 'Ship horn blowing, maritime horn, ocean liner horn, 3 seconds' },
  { category: 'vehicle_ship', filename: 'ship_creaking', prompt: 'Wooden ship creaking, sailing ship sounds, boat wood stress, 4 seconds' },
  { category: 'vehicle_ship', filename: 'ship_waves', prompt: 'Waves hitting ship hull, boat on ocean, water against boat, 5 seconds' },
  { category: 'vehicle_ship', filename: 'cannon_fire', prompt: 'Ship cannon firing, naval cannon blast, pirate cannon, 2 seconds' },
  { category: 'vehicle_boat', filename: 'rowboat_oars', prompt: 'Rowing boat oars, paddles in water, boat rowing, 3 seconds' },
  
  // VEHICLES - AIRCRAFT
  { category: 'vehicle_aircraft', filename: 'helicopter_loop', prompt: 'Helicopter flying overhead, chopper rotors, helicopter loop, 5 seconds' },
  { category: 'vehicle_aircraft', filename: 'jet_flyby', prompt: 'Fighter jet flying past, jet engine roar, aircraft flyby, 3 seconds' },
  { category: 'vehicle_aircraft', filename: 'propeller_plane', prompt: 'Propeller airplane flying, small aircraft engine, 4 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // SCI-FI SOUNDS
  // ═══════════════════════════════════════════════════════════
  { category: 'scifi_laser', filename: 'laser_shot_1', prompt: 'Sci-fi laser gun shot, blaster fire, energy weapon, 0.5 seconds' },
  { category: 'scifi_laser', filename: 'laser_shot_2', prompt: 'Heavy laser cannon, sci-fi plasma weapon, 0.5 seconds' },
  { category: 'scifi_laser', filename: 'laser_charge', prompt: 'Laser weapon charging up, energy building, 2 seconds' },
  { category: 'scifi_teleport', filename: 'teleport_1', prompt: 'Teleportation sound, matter transport, beam up effect, 2 seconds' },
  { category: 'scifi_teleport', filename: 'teleport_2', prompt: 'Sci-fi teleport arrival, materializing sound, 1.5 seconds' },
  { category: 'scifi_door', filename: 'door_scifi_open', prompt: 'Sci-fi automatic door opening, futuristic door whoosh, 1 second' },
  { category: 'scifi_door', filename: 'door_scifi_close', prompt: 'Sci-fi door closing, futuristic door seal, 1 second' },
  { category: 'scifi_ambient', filename: 'spaceship_ambient', prompt: 'Spaceship interior ambient, humming engines, sci-fi ship loop, 5 seconds' },
  { category: 'scifi_ambient', filename: 'computer_beeps', prompt: 'Sci-fi computer beeping, futuristic terminal, 3 seconds' },
  { category: 'scifi_ambient', filename: 'hologram_activate', prompt: 'Hologram activating, holographic display appearing, 1.5 seconds' },
  { category: 'scifi_energy', filename: 'energy_shield', prompt: 'Energy shield activating, force field up, protective barrier, 2 seconds' },
  { category: 'scifi_energy', filename: 'power_down', prompt: 'System powering down, electronics failing, power loss, 2 seconds' },
  { category: 'scifi_robot', filename: 'robot_voice', prompt: 'Robot voice beeping, mechanical voice, AI speaking, 2 seconds' },
  { category: 'scifi_robot', filename: 'robot_movement', prompt: 'Robot moving, mechanical servo sounds, android walking, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // HORROR SOUNDS
  // ═══════════════════════════════════════════════════════════
  { category: 'horror_ambient', filename: 'horror_ambient_1', prompt: 'Creepy horror ambient, unsettling atmosphere, dread ambient, 5 seconds' },
  { category: 'horror_ambient', filename: 'horror_drone', prompt: 'Dark droning horror sound, ominous low frequency, 5 seconds' },
  { category: 'horror_jump', filename: 'jump_scare_1', prompt: 'Jump scare sound, sudden horror stinger, scary burst, 1 second' },
  { category: 'horror_jump', filename: 'jump_scare_2', prompt: 'Sharp jump scare, horror stab, frightening sudden sound, 0.5 seconds' },
  { category: 'horror_creepy', filename: 'child_laughter', prompt: 'Creepy child laughing, eerie childish giggle, horror laugh, 2 seconds' },
  { category: 'horror_creepy', filename: 'music_box', prompt: 'Creepy music box playing, distorted lullaby, horror music box, 4 seconds' },
  { category: 'horror_creepy', filename: 'whispers', prompt: 'Creepy whispers, unintelligible whispers, eerie voices, 3 seconds' },
  { category: 'horror_gore', filename: 'flesh_tear', prompt: 'Flesh tearing, gory ripping sound, visceral horror, 1 second' },
  { category: 'horror_gore', filename: 'bone_crack', prompt: 'Bone cracking, skeletal snap, gruesome bone break, 0.5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // CYBERPUNK SOUNDS
  // ═══════════════════════════════════════════════════════════
  { category: 'cyberpunk_ambient', filename: 'neon_hum', prompt: 'Neon signs buzzing, electric neon hum, cyberpunk atmosphere, 5 seconds' },
  { category: 'cyberpunk_ambient', filename: 'city_night_cyber', prompt: 'Cyberpunk city night, dystopian urban ambient, neon city, 5 seconds' },
  { category: 'cyberpunk_tech', filename: 'hacking_sounds', prompt: 'Computer hacking sounds, digital intrusion, cyber attack, 3 seconds' },
  { category: 'cyberpunk_tech', filename: 'neural_interface', prompt: 'Neural interface connecting, brain jack plugging in, 1.5 seconds' },
  { category: 'cyberpunk_tech', filename: 'glitch_1', prompt: 'Digital glitch sound, data corruption, electronic distortion, 1 second' },
  { category: 'cyberpunk_weapon', filename: 'energy_blade', prompt: 'Energy blade activating, plasma sword ignite, 1 second' },
  
  // ═══════════════════════════════════════════════════════════
  // WAR & MILITARY
  // ═══════════════════════════════════════════════════════════
  { category: 'war_battle', filename: 'battle_ambient', prompt: 'Distant battlefield ambient, war sounds far away, battle chaos, 5 seconds' },
  { category: 'war_battle', filename: 'war_siren', prompt: 'Air raid siren, war alert siren, emergency siren, 4 seconds' },
  { category: 'war_artillery', filename: 'artillery_fire', prompt: 'Artillery cannon firing, heavy artillery shot, 2 seconds' },
  { category: 'war_artillery', filename: 'artillery_impact', prompt: 'Artillery shell impact, explosion in distance, shell landing, 2 seconds' },
  { category: 'war_machinegun', filename: 'machinegun_burst', prompt: 'Machine gun firing burst, automatic weapon fire, 2 seconds' },
  { category: 'war_machinegun', filename: 'machinegun_distant', prompt: 'Distant machine gun fire, faraway automatic weapons, 3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // WESTERN
  // ═══════════════════════════════════════════════════════════
  { category: 'western_ambient', filename: 'saloon_ambient', prompt: 'Old west saloon ambient, piano and chatter, western bar, 5 seconds' },
  { category: 'western_ambient', filename: 'desert_wind', prompt: 'Desert wind blowing, dusty western wind, frontier wind, 5 seconds' },
  { category: 'western', filename: 'spur_jingle', prompt: 'Cowboy spurs jingling, boot spurs walking, 1.5 seconds' },
  { category: 'western', filename: 'whip_crack', prompt: 'Whip cracking, leather whip snap, 0.5 seconds' },
  { category: 'western', filename: 'saloon_doors', prompt: 'Saloon doors swinging, western bar doors, 1.5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // PIRATE & NAUTICAL  
  // ═══════════════════════════════════════════════════════════
  { category: 'pirate_ambient', filename: 'ocean_waves_loop', prompt: 'Ocean waves ambient, sea waves rolling, maritime ambient, 5 seconds' },
  { category: 'pirate_ambient', filename: 'seagulls', prompt: 'Seagulls calling, coastal birds, harbor seagulls, 3 seconds' },
  { category: 'pirate', filename: 'anchor_drop', prompt: 'Anchor dropping into water, heavy chain splash, 2 seconds' },
  { category: 'pirate', filename: 'sword_cutlass', prompt: 'Cutlass sword slash, pirate sword swing, 0.5 seconds' },
  { category: 'pirate', filename: 'treasure_chest', prompt: 'Treasure chest opening, pirate treasure, gold coins reveal, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // COMBAT - GUNS (expanded)
  // ═══════════════════════════════════════════════════════════
  { category: 'gun_pistol', filename: 'gun_pistol_1', prompt: 'Pistol gunshot, handgun firing single shot, sharp crack, 1 second' },
  { category: 'gun_pistol', filename: 'gun_pistol_2', prompt: 'Revolver gunshot, pistol firing, crisp gunshot sound, 1 second' },
  { category: 'gun_pistol', filename: 'gun_pistol_indoor', prompt: 'Pistol shot indoors, indoor gunshot echo, confined gunfire, 1 second' },
  { category: 'gun_rifle', filename: 'gun_rifle_1', prompt: 'Rifle gunshot, loud rifle firing single shot, powerful crack, 1 second' },
  { category: 'gun_rifle', filename: 'gun_rifle_2', prompt: 'Assault rifle single shot, loud rifle gunshot, 1 second' },
  { category: 'gun_rifle', filename: 'gun_rifle_indoor', prompt: 'Rifle shot indoors, indoor rifle echo, loud enclosed gunfire, 1 second' },
  { category: 'gun_shotgun', filename: 'gun_shotgun_1', prompt: 'Shotgun blast, loud shotgun firing, powerful boom, 1 second' },
  { category: 'gun_shotgun', filename: 'gun_shotgun_pump', prompt: 'Shotgun pump action, racking shotgun, 0.5 seconds' },
  { category: 'gun_distant', filename: 'gun_distant_1', prompt: 'Distant gunshot, faraway gunfire, muffled shot, 1 second' },
  { category: 'gun_distant', filename: 'gun_distant_2', prompt: 'Distant rifle shot, far away gunfire echo, 1 second' },
  { category: 'gun_distant', filename: 'gun_distant_3', prompt: 'Multiple distant gunshots, faraway firefight, 2 seconds' },
  { category: 'gun_reload', filename: 'gun_reload_pistol', prompt: 'Pistol magazine reload, handgun reloading, 1 second' },
  { category: 'gun_reload', filename: 'gun_reload_rifle', prompt: 'Rifle magazine reload, assault rifle reloading, 1.5 seconds' },
  { category: 'bullet_impact', filename: 'bullet_impact_1', prompt: 'Bullet hitting surface, bullet impact, projectile hit, 0.3 seconds' },
  { category: 'bullet_impact', filename: 'bullet_ricochet', prompt: 'Bullet ricochet, bullet bouncing off metal, 0.5 seconds' },
  { category: 'bullet_whiz', filename: 'bullet_whiz_1', prompt: 'Bullet whizzing past, near miss bullet, 0.3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // COMBAT - MELEE (expanded)
  // ═══════════════════════════════════════════════════════════
  { category: 'combat_punch', filename: 'punch_1', prompt: 'Punch hitting face, fist impact on body, melee hit sound, 0.5 seconds' },
  { category: 'combat_punch', filename: 'punch_2', prompt: 'Hard punch landing, heavy fist impact, fighting sound, 0.5 seconds' },
  { category: 'combat_punch', filename: 'punch_3', prompt: 'Quick jab punch, fast punch hit, 0.3 seconds' },
  { category: 'combat_kick', filename: 'kick_1', prompt: 'Powerful kick impact, leg kick hit, martial arts kick, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_swing_1', prompt: 'Sword swinging through air, blade whoosh, metal swing, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_swing_2', prompt: 'Heavy sword swing, greatsword whoosh, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_clash_1', prompt: 'Swords clashing together, metal on metal impact, blade clash, 0.5 seconds' },
  { category: 'combat_sword', filename: 'sword_clash_2', prompt: 'Multiple sword clashes, sword fight, 1 second' },
  { category: 'combat_sword', filename: 'sword_draw', prompt: 'Sword being drawn from sheath, blade unsheathing, 0.5 seconds' },
  { category: 'combat_axe', filename: 'axe_swing', prompt: 'Battle axe swinging, heavy axe whoosh, 0.5 seconds' },
  { category: 'combat_axe', filename: 'axe_impact', prompt: 'Axe hitting target, heavy blade impact, 0.5 seconds' },
  { category: 'combat_mace', filename: 'mace_swing', prompt: 'Mace swinging, blunt weapon whoosh, 0.5 seconds' },
  { category: 'combat_mace', filename: 'mace_impact', prompt: 'Mace hitting armor, blunt impact on metal, 0.5 seconds' },
  { category: 'combat_bow', filename: 'bow_draw', prompt: 'Bow string being drawn, arrow nocking, 1 second' },
  { category: 'combat_bow', filename: 'bow_release', prompt: 'Arrow released from bow, arrow flying, 0.5 seconds' },
  { category: 'combat_bow', filename: 'arrow_impact', prompt: 'Arrow hitting target, arrow thud, 0.3 seconds' },
  { category: 'combat_dagger', filename: 'knife_stab', prompt: 'Knife stabbing, dagger thrust, blade piercing, 0.3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // DOORS (indoor/outdoor variants)
  // ═══════════════════════════════════════════════════════════
  { category: 'door_wooden', filename: 'door_open_1', prompt: 'Wooden door opening, door creak and open, 1 second' },
  { category: 'door_wooden', filename: 'door_close_1', prompt: 'Wooden door closing, door shutting firmly, 1 second' },
  { category: 'door_wooden', filename: 'door_open_slow', prompt: 'Door opening slowly, cautious door open, 2 seconds' },
  { category: 'door_creaky', filename: 'door_creak_1', prompt: 'Creaky door opening slowly, spooky door creak, horror door, 2 seconds' },
  { category: 'door_creaky', filename: 'door_creak_2', prompt: 'Old rusty door creaking, haunted house door, 2 seconds' },
  { category: 'door_metal', filename: 'door_metal_open', prompt: 'Heavy metal door opening, industrial door sound, 1 second' },
  { category: 'door_metal', filename: 'door_metal_close', prompt: 'Metal door slamming shut, steel door bang, 1 second' },
  { category: 'door_heavy', filename: 'door_slam_1', prompt: 'Door slamming shut loudly, heavy door slam, 0.5 seconds' },
  { category: 'door_heavy', filename: 'door_break', prompt: 'Door being kicked in, door breaking, forced entry, 1 second' },
  { category: 'door_lock', filename: 'door_lock', prompt: 'Door locking, key turning in lock, deadbolt locking, 1 second' },
  { category: 'door_lock', filename: 'door_unlock', prompt: 'Door unlocking, key in lock, unlocking sound, 1 second' },
  { category: 'door_knock', filename: 'door_knock_1', prompt: 'Knocking on door, someone at door, three knocks, 1.5 seconds' },
  { category: 'door_knock', filename: 'door_knock_urgent', prompt: 'Urgent loud door knocking, frantic door pounding, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // HUMAN SOUNDS (expanded)
  // ═══════════════════════════════════════════════════════════
  { category: 'human_scream', filename: 'scream_1', prompt: 'Person screaming in fear, terrified scream, horror scream, 2 seconds' },
  { category: 'human_scream', filename: 'scream_2', prompt: 'Frightened scream, surprised scream of terror, 1.5 seconds' },
  { category: 'human_scream', filename: 'scream_male', prompt: 'Male scream of pain, man screaming, 1.5 seconds' },
  { category: 'human_scream', filename: 'scream_female', prompt: 'Female scream of fear, woman screaming, 1.5 seconds' },
  { category: 'human_gasp', filename: 'gasp_1', prompt: 'Person gasping in surprise, shocked gasp, sudden intake of breath, 0.5 seconds' },
  { category: 'human_gasp', filename: 'gasp_shock', prompt: 'Gasp of shock, surprised breath, 0.5 seconds' },
  { category: 'human_cry', filename: 'sobbing_1', prompt: 'Person crying and sobbing, emotional crying, sad sobbing, 3 seconds' },
  { category: 'human_cry', filename: 'crying_soft', prompt: 'Soft quiet crying, gentle weeping, 3 seconds' },
  { category: 'human_laugh', filename: 'laugh_1', prompt: 'Person laughing heartily, genuine laughter, happy laugh, 2 seconds' },
  { category: 'human_laugh', filename: 'laugh_evil', prompt: 'Evil villain laugh, maniacal laughter, sinister laugh, 3 seconds' },
  { category: 'human_grunt', filename: 'grunt_1', prompt: 'Male grunt of effort, exertion grunt, physical strain sound, 0.5 seconds' },
  { category: 'human_grunt', filename: 'grunt_pain', prompt: 'Grunt of pain, hurt grunt, injured sound, 0.5 seconds' },
  { category: 'human_breath', filename: 'breath_heavy', prompt: 'Heavy breathing, exhausted breathing, tired panting, 3 seconds' },
  { category: 'human_breath', filename: 'breath_scared', prompt: 'Scared breathing, fearful shallow breaths, 2 seconds' },
  { category: 'human_heartbeat', filename: 'heartbeat_loop', prompt: 'Human heartbeat pounding, heart beating rhythm, tense heartbeat loop, 5 seconds' },
  { category: 'human_heartbeat', filename: 'heartbeat_fast', prompt: 'Fast racing heartbeat, panicked heart rhythm, rapid heartbeat, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // AMBIENCE - LOCATIONS (indoor/outdoor)
  // ═══════════════════════════════════════════════════════════
  { category: 'ambience_tavern', filename: 'bar_ambient_loop', prompt: 'Busy bar tavern ambient, people talking murmur, glasses clinking, pub atmosphere, 5 seconds' },
  { category: 'ambience_tavern', filename: 'inn_ambient', prompt: 'Cozy inn ambient, warm fireplace, quiet tavern, 5 seconds' },
  { category: 'ambience_city_day', filename: 'city_traffic_loop', prompt: 'City street ambient, traffic sounds, urban city atmosphere, cars and people, 5 seconds' },
  { category: 'ambience_city_night', filename: 'city_night_loop', prompt: 'City night ambient, quiet streets, distant traffic, nighttime urban, 5 seconds' },
  { category: 'ambience_forest', filename: 'forest_ambient_loop', prompt: 'Forest ambient sounds, birds chirping, leaves rustling, peaceful forest, 5 seconds' },
  { category: 'ambience_forest', filename: 'forest_night', prompt: 'Forest at night, owls hooting, crickets, nocturnal forest, 5 seconds' },
  { category: 'ambience_cave', filename: 'cave_drips_loop', prompt: 'Cave ambient sounds, water dripping in cave, echoing cave atmosphere, 5 seconds' },
  { category: 'ambience_dungeon', filename: 'dungeon_ambient', prompt: 'Dark dungeon ambient, dripping water, chains rattling, prison atmosphere, 5 seconds' },
  { category: 'ambience_market', filename: 'market_ambient', prompt: 'Busy marketplace, vendors calling, crowd noise, bazaar atmosphere, 5 seconds' },
  { category: 'ambience_plaza', filename: 'plaza_ambient', prompt: 'Town plaza ambient, fountain, people walking, public square, 5 seconds' },
  { category: 'ambience_castle', filename: 'castle_ambient', prompt: 'Castle interior ambient, stone halls, echoing footsteps, 5 seconds' },
  { category: 'ambience_throne_room', filename: 'throne_room_ambient', prompt: 'Grand throne room ambient, royal court, regal atmosphere, 5 seconds' },
  { category: 'ambience_campsite', filename: 'campfire_ambient', prompt: 'Campsite at night, crackling fire, crickets, outdoor camp, 5 seconds' },
  { category: 'ambience_riverside', filename: 'river_ambient', prompt: 'River flowing ambient, water rushing, peaceful stream, 5 seconds' },
  { category: 'ambience_ocean', filename: 'ocean_ambient', prompt: 'Ocean shore ambient, waves crashing, beach sounds, 5 seconds' },
  { category: 'ambience_church', filename: 'church_ambient', prompt: 'Church interior ambient, reverent silence, echo, sacred space, 5 seconds' },
  { category: 'ambience_library', filename: 'library_ambient', prompt: 'Quiet library ambient, pages turning, soft atmosphere, 5 seconds' },
  { category: 'ambience_hospital', filename: 'hospital_ambient', prompt: 'Hospital ambient, medical beeps, clinical atmosphere, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // ELEMENTS
  // ═══════════════════════════════════════════════════════════
  { category: 'element_fire', filename: 'fire_crackle_loop', prompt: 'Fire crackling, campfire burning, flames flickering ambient, 5 seconds' },
  { category: 'element_fire', filename: 'fire_large', prompt: 'Large fire roaring, bonfire, big flames, 5 seconds' },
  { category: 'element_fire', filename: 'fire_torch', prompt: 'Torch burning, flickering torch flame, 3 seconds' },
  { category: 'element_water', filename: 'stream_loop', prompt: 'Water stream flowing, babbling brook, gentle river sounds, 5 seconds' },
  { category: 'element_water', filename: 'waterfall', prompt: 'Waterfall cascading, rushing water, falling water, 5 seconds' },
  { category: 'element_water', filename: 'splash_large', prompt: 'Large water splash, something falling in water, 1 second' },
  { category: 'element_water', filename: 'splash_small', prompt: 'Small water splash, drip splash, 0.5 seconds' },
  { category: 'element_ice', filename: 'ice_cracking', prompt: 'Ice cracking, frozen surface breaking, glacier cracking, 2 seconds' },
  { category: 'element_electricity', filename: 'electric_zap', prompt: 'Electric zap, electrical shock, sparking electricity, 0.5 seconds' },
  { category: 'element_electricity', filename: 'electric_hum', prompt: 'Electrical humming, power lines buzzing, electric ambient, 3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // OBJECTS
  // ═══════════════════════════════════════════════════════════
  { category: 'glass_break', filename: 'glass_break_1', prompt: 'Glass shattering, window breaking, glass smash impact, 1 second' },
  { category: 'glass_break', filename: 'glass_shatter', prompt: 'Large glass shattering, big window break, 1.5 seconds' },
  { category: 'glass_clink', filename: 'glass_clink_1', prompt: 'Glasses clinking together, toast sound, champagne glasses, 0.5 seconds' },
  { category: 'coins_jingle', filename: 'coins_jingle', prompt: 'Coins jingling, money rattling, pouch of coins sound, 1 second' },
  { category: 'coins_drop', filename: 'coin_drop_1', prompt: 'Coins dropping on table, money falling, coins landing, 1 second' },
  { category: 'keys_jingle', filename: 'key_jingle_1', prompt: 'Keys jingling, keyring rattling, bunch of keys sound, 1 second' },
  { category: 'chest_open', filename: 'chest_open_1', prompt: 'Treasure chest opening, wooden chest lid opening, fantasy chest sound, 1 second' },
  { category: 'chains_rattle', filename: 'chains_rattle', prompt: 'Metal chains rattling, heavy chains clanking, 2 seconds' },
  { category: 'lever_mechanical', filename: 'lever_pull', prompt: 'Mechanical lever being pulled, gear mechanism, 1 second' },
  
  // ═══════════════════════════════════════════════════════════
  // FOOTSTEPS
  // ═══════════════════════════════════════════════════════════
  { category: 'footsteps_stone', filename: 'footsteps_walk_1', prompt: 'Footsteps walking on stone floor, shoes on hard ground, 2 seconds' },
  { category: 'footsteps_stone', filename: 'footsteps_run_stone', prompt: 'Running on stone floor, fast footsteps, 2 seconds' },
  { category: 'footsteps_wood', filename: 'footsteps_wood_1', prompt: 'Footsteps walking on wooden floor, creaky wood footsteps, 2 seconds' },
  { category: 'footsteps_grass', filename: 'footsteps_grass_1', prompt: 'Footsteps walking on grass, soft footsteps in nature, 2 seconds' },
  { category: 'footsteps_gravel', filename: 'footsteps_gravel_1', prompt: 'Footsteps on gravel, crunching gravel walk, 2 seconds' },
  { category: 'footsteps_metal', filename: 'footsteps_metal_1', prompt: 'Footsteps on metal floor, industrial metal footsteps, 2 seconds' },
  { category: 'footsteps_water', filename: 'footsteps_water_1', prompt: 'Footsteps splashing in water, wading through shallow water, 2 seconds' },
  { category: 'action_stealth', filename: 'footsteps_sneak', prompt: 'Sneaking footsteps, quiet careful walking, stealthy movement, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // UI SOUNDS
  // ═══════════════════════════════════════════════════════════
  { category: 'ui_click', filename: 'ui_click', prompt: 'UI button click, clean interface click, menu select sound, 0.2 seconds' },
  { category: 'ui_notification', filename: 'ui_notification', prompt: 'Notification sound, soft pleasant chime, alert tone, 0.5 seconds' },
  { category: 'ui_success', filename: 'ui_success', prompt: 'Success sound, achievement unlocked, positive confirmation tone, 1 second' },
  { category: 'ui_error', filename: 'ui_error', prompt: 'Error sound, negative feedback buzz, wrong action sound, 0.5 seconds' },
  { category: 'ui_hover', filename: 'ui_hover', prompt: 'UI hover sound, subtle interface hover, 0.1 seconds' },
  { category: 'ui_open', filename: 'ui_menu_open', prompt: 'Menu opening sound, interface panel open, 0.3 seconds' },
  { category: 'ui_close', filename: 'ui_menu_close', prompt: 'Menu closing sound, interface panel close, 0.3 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // NATURE SOUNDS (from locationAmbientManager)
  // ═══════════════════════════════════════════════════════════
  { category: 'nature', filename: 'forest_peaceful', prompt: 'Peaceful forest ambient, birds singing, gentle breeze through trees, nature sounds, 5 seconds' },
  { category: 'nature', filename: 'forest_night', prompt: 'Night forest ambient, crickets chirping, owls hooting, nocturnal wildlife, 5 seconds' },
  { category: 'nature', filename: 'jungle_ambiance', prompt: 'Dense jungle ambient, tropical birds, insect chorus, humid rainforest, 5 seconds' },
  { category: 'nature', filename: 'swamp_ambiance', prompt: 'Murky swamp ambient, frogs croaking, bubbling water, eerie marsh sounds, 5 seconds' },
  { category: 'nature', filename: 'cave_ambiance', prompt: 'Dark cave ambient, water dripping, echoing silence, underground atmosphere, 5 seconds' },
  { category: 'nature', filename: 'mountain_wind', prompt: 'Mountain peak wind, high altitude gusts, cold whistling wind, alpine atmosphere, 5 seconds' },
  { category: 'nature', filename: 'ocean_waves', prompt: 'Ocean waves ambient, waves crashing on shore, beach sounds, coastal atmosphere, 5 seconds' },
  { category: 'nature', filename: 'river_stream', prompt: 'River flowing ambient, babbling brook, rushing water stream, peaceful river, 5 seconds' },
  { category: 'nature', filename: 'waterfall', prompt: 'Waterfall cascading, powerful rushing water, mist and spray sounds, 5 seconds' },
  { category: 'nature', filename: 'campfire', prompt: 'Campfire crackling, wood popping, warm fire ambient, outdoor camping, 5 seconds' },
  { category: 'nature', filename: 'rain_light_drizzle', prompt: 'Light rain drizzle, gentle rain falling, soft peaceful rain, 5 seconds' },
  { category: 'nature', filename: 'rain_heavy_outside', prompt: 'Heavy rain outdoors, intense rainfall, pouring rain, 5 seconds' },
  { category: 'nature', filename: 'thunderstorm', prompt: 'Thunderstorm ambient, thunder rumbles, heavy rain, storm atmosphere, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // URBAN SOUNDS (from locationAmbientManager)
  // ═══════════════════════════════════════════════════════════
  { category: 'urban', filename: 'city_street_busy', prompt: 'Busy city street, traffic noise, car horns, pedestrians, urban daytime, 5 seconds' },
  { category: 'urban', filename: 'subway_station', prompt: 'Subway station ambient, train announcements, echoing footsteps, underground metro, 5 seconds' },
  { category: 'urban', filename: 'airport_terminal', prompt: 'Airport terminal ambient, flight announcements, rolling luggage, busy travelers, 5 seconds' },
  { category: 'urban', filename: 'shopping_mall', prompt: 'Shopping mall ambient, muzak, crowd chatter, escalators, retail atmosphere, 5 seconds' },
  { category: 'urban', filename: 'coffee_shop', prompt: 'Coffee shop ambient, espresso machine, quiet chatter, cafe atmosphere, 5 seconds' },
  { category: 'urban', filename: 'construction_site', prompt: 'Construction site ambient, jackhammer, machinery, workers shouting, building sounds, 5 seconds' },
  { category: 'urban', filename: 'office_ambiance', prompt: 'Office ambient, keyboard typing, phone ringing, quiet workplace, 5 seconds' },
  { category: 'urban', filename: 'hospital_corridor', prompt: 'Hospital corridor ambient, PA announcements, rolling carts, clinical atmosphere, 5 seconds' },
  { category: 'urban', filename: 'elevator_ding', prompt: 'Elevator arrival ding, electronic chime, doors opening, 1 second' },
  { category: 'urban', filename: 'police_siren_modern', prompt: 'Police siren wailing, modern cop car siren, emergency vehicle, 3 seconds' },
  { category: 'urban', filename: 'ambulance_siren', prompt: 'Ambulance siren blaring, medical emergency siren, urgent wailing, 3 seconds' },
  { category: 'urban', filename: 'car_horn', prompt: 'Car horn honking, impatient horn blast, traffic horn, 1 second' },
  
  // ═══════════════════════════════════════════════════════════
  // INDOOR WEATHER VARIANTS (from weatherSoundManager)
  // ═══════════════════════════════════════════════════════════
  { category: 'weather', filename: 'rain_on_window_inside', prompt: 'Rain on window from inside, cozy indoor rain, water droplets on glass, 5 seconds' },
  { category: 'weather', filename: 'rain_on_metal_roof', prompt: 'Rain on metal roof, tin roof rain sound, indoor during rainstorm, 5 seconds' },
  { category: 'weather', filename: 'rain_on_tent', prompt: 'Rain falling on tent, camping in rain, fabric tent rain sounds, 5 seconds' },
  { category: 'weather', filename: 'rain_on_umbrella', prompt: 'Rain hitting umbrella, droplets on umbrella fabric, walking in rain, 3 seconds' },
  { category: 'weather', filename: 'wind_outside_window', prompt: 'Wind howling outside window, indoor draft, wind through cracks, 5 seconds' },
  { category: 'weather', filename: 'wind_strong_outside', prompt: 'Strong wind blowing outdoors, powerful gusts, blustery weather, 5 seconds' },
  { category: 'weather', filename: 'thunder_distant', prompt: 'Distant thunder rolling, faraway thunderstorm, rumbling thunder, 3 seconds' },
  { category: 'weather', filename: 'thunder_close', prompt: 'Close thunder crack, nearby lightning strike, loud thunder boom, 2 seconds' },
  { category: 'weather', filename: 'snow_falling', prompt: 'Quiet snow falling ambient, muffled winter silence, peaceful snowfall, 5 seconds' },
  { category: 'weather', filename: 'snow_footsteps', prompt: 'Walking through snow, crunching footsteps in snow, winter walking, 2 seconds' },
  { category: 'weather', filename: 'hailstorm', prompt: 'Hailstorm hitting ground, ice pellets falling, hail on roof, severe weather, 5 seconds' },
  { category: 'weather', filename: 'arctic_blizzard', prompt: 'Arctic blizzard, intense snowstorm, howling freezing wind, whiteout conditions, 5 seconds' },
  { category: 'weather', filename: 'fog_horn', prompt: 'Fog horn sounding, maritime warning horn, harbor fog signal, 3 seconds' },
  { category: 'weather', filename: 'tornado_siren', prompt: 'Tornado warning siren, civil defense siren, emergency alert, 4 seconds' },
  { category: 'weather', filename: 'hurricane_storm', prompt: 'Hurricane winds, extreme storm, violent wind and rain, tropical storm, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // ADDITIONAL AMBIENCE (from locationAmbientManager)
  // ═══════════════════════════════════════════════════════════
  { category: 'ambience_inn', filename: 'inn_ambient', prompt: 'Cozy inn ambient, warm fireplace, quiet conversation, comfortable tavern, 5 seconds' },
  { category: 'ambience_wilderness', filename: 'wilderness_ambient', prompt: 'Open wilderness ambient, distant birds, wind through grass, vast outdoor space, 5 seconds' },
  { category: 'ambience_temple', filename: 'temple_ambient', prompt: 'Ancient temple ambient, echoing chamber, sacred atmosphere, mysterious, 5 seconds' },
  { category: 'ambience_shrine', filename: 'shrine_ambient', prompt: 'Peaceful shrine ambient, wind chimes, spiritual calm, sacred space, 5 seconds' },
  { category: 'ambience_ship', filename: 'ship_ambient', prompt: 'Ship at sea ambient, creaking wood, waves against hull, sailing sounds, 5 seconds' },
  { category: 'ambience_harbor', filename: 'harbor_ambient', prompt: 'Harbor ambient, seagulls, boat bells, dockside atmosphere, maritime, 5 seconds' },
  { category: 'ambience_battlefield', filename: 'battlefield_ambient', prompt: 'Distant battlefield ambient, far off explosions, war sounds, tension, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // CROWD SOUNDS (from location systems)
  // ═══════════════════════════════════════════════════════════
  { category: 'crowd_busy', filename: 'crowd_busy', prompt: 'Busy crowd ambient, many people talking, bustling crowd noise, 5 seconds' },
  { category: 'crowd_murmur', filename: 'crowd_murmur', prompt: 'Quiet crowd murmur, low conversation, background chatter, 5 seconds' },
  { category: 'crowd_battle', filename: 'crowd_battle', prompt: 'Battle crowd sounds, warriors shouting, combat chaos, melee crowd, 5 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // CREATURE SOUNDS (from storySoundTrigger)
  // ═══════════════════════════════════════════════════════════
  { category: 'creature_bird', filename: 'birds_chirping', prompt: 'Birds chirping, songbirds singing, forest birds, morning birdsong, 3 seconds' },
  { category: 'creature_owl', filename: 'owl_hooting', prompt: 'Owl hooting at night, nocturnal owl call, mysterious hoot, 2 seconds' },
  { category: 'creature_frog', filename: 'frogs_croaking', prompt: 'Frogs croaking, swamp frogs, pond frog chorus, 3 seconds' },
  { category: 'creature_insect', filename: 'insects_buzzing', prompt: 'Insects buzzing, cicadas and crickets, summer insect sounds, 5 seconds' },
  { category: 'creature_seagull', filename: 'seagulls_calling', prompt: 'Seagulls calling, coastal birds, harbor seagulls, beach birds, 3 seconds' },
  { category: 'creature_rat', filename: 'rats_scurrying', prompt: 'Rats scurrying, rodent sounds, scratching and squeaking, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // ACTION SOUNDS (from storySoundTrigger)
  // ═══════════════════════════════════════════════════════════
  { category: 'action_chase', filename: 'chase_running', prompt: 'Frantic running footsteps, chase sequence, urgent running, 3 seconds' },
  { category: 'action_climbing', filename: 'climbing_sounds', prompt: 'Climbing sounds, grunting effort, grabbing handholds, scaling wall, 3 seconds' },
  { category: 'action_swimming', filename: 'swimming_sounds', prompt: 'Swimming sounds, splashing water, person swimming, water movement, 3 seconds' },
  { category: 'action_investigation', filename: 'paper_rustling', prompt: 'Paper rustling, searching through documents, investigation sounds, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // SCI-FI SOUNDS (expanded from storySoundTrigger)
  // ═══════════════════════════════════════════════════════════
  { category: 'scifi_engine', filename: 'spaceship_engine', prompt: 'Spaceship engine hum, sci-fi ship propulsion, space vessel engine, 5 seconds' },
  { category: 'scifi_tech', filename: 'tech_beeps', prompt: 'Sci-fi technology beeps, futuristic computer sounds, electronic interface, 3 seconds' },
  { category: 'hydraulics_machinery', filename: 'hydraulics_hiss', prompt: 'Hydraulic machinery, pneumatic hiss, industrial robot sounds, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // ACOUSTIC ENVIRONMENT VARIANTS (from acousticEnvironmentSystem)
  // ═══════════════════════════════════════════════════════════
  { category: 'acoustic_indoor_gunshot', filename: 'gunshot_indoor_reverb', prompt: 'Gunshot in enclosed space, indoor gun echo, reverberating shot, 2 seconds' },
  { category: 'acoustic_outdoor_gunshot', filename: 'gunshot_outdoor_echo', prompt: 'Gunshot outdoors, open air gunfire, distant echo, 2 seconds' },
  
  // ═══════════════════════════════════════════════════════════
  // VEHICLE SOUNDS (expanded)
  // ═══════════════════════════════════════════════════════════
  { category: 'vehicle_car_start', filename: 'car_engine_start', prompt: 'Car engine starting, ignition turning over, engine coming to life, 2 seconds' },
  { category: 'vehicle_car_idle', filename: 'car_engine_idle', prompt: 'Car engine idling, stationary vehicle, engine running low, 5 seconds' },
  { category: 'vehicle_car_pass', filename: 'car_passing', prompt: 'Car passing by, vehicle driving past, traffic sound, 3 seconds' },
  { category: 'vehicle_car_horn', filename: 'car_horn_honk', prompt: 'Car horn honking, vehicle horn blast, impatient honk, 1 second' },
  
  // ═══════════════════════════════════════════════════════════  
  // MAGIC SOUNDS (expanded from storySoundTrigger)
  // ═══════════════════════════════════════════════════════════
  { category: 'magic_cast', filename: 'magic_casting', prompt: 'Magic spell being cast, mystical energy gathering, enchantment sound, 2 seconds' },
];

interface GenerationResult {
  filename: string;
  status: 'pending' | 'generating' | 'success' | 'error';
  error?: string;
}

export function SoundSeeder() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentSound, setCurrentSound] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [testAudio, setTestAudio] = useState<HTMLAudioElement | null>(null);

  const checkExistingSounds = async () => {
    const { data, error } = await supabase
      .from('generated_sounds')
      .select('filename');
    
    if (!error && data) {
      setExistingCount(data.length);
      return new Set(data.map(s => s.filename));
    }
    return new Set<string>();
  };

  const generateSound = async (def: typeof SOUND_DEFINITIONS[0]): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await supabase.functions.invoke('generate-sfx', {
        body: {
          prompt: def.prompt,
          category: def.category,
          filename: def.filename,
          duration: 5,
          promptInfluence: 0.3
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Generation failed' };
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    setProgress(0);
    
    // Check what already exists
    const existingFiles = await checkExistingSounds();
    
    // Filter to only generate missing sounds (database stores as category/filename)
    const toGenerate = SOUND_DEFINITIONS.filter(def => {
      const storagePath = `${def.category}/${def.filename}`;
      return !existingFiles.has(storagePath);
    });
    
    if (toGenerate.length === 0) {
      setResults([{ filename: 'All sounds already exist!', status: 'success' }]);
      setIsGenerating(false);
      return;
    }

    // Initialize results
    const initialResults: GenerationResult[] = toGenerate.map(def => ({
      filename: def.filename,
      status: 'pending'
    }));
    setResults(initialResults);

    // Generate sounds one by one (to avoid rate limits)
    for (let i = 0; i < toGenerate.length; i++) {
      const def = toGenerate[i];
      setCurrentSound(def.filename);
      
      // Update status to generating
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'generating' } : r
      ));

      const result = await generateSound(def);
      
      // Update status
      setResults(prev => prev.map((r, idx) => 
        idx === i ? { 
          ...r, 
          status: result.success ? 'success' : 'error',
          error: result.error 
        } : r
      ));

      setProgress(((i + 1) / toGenerate.length) * 100);
      
      // Small delay between generations to avoid rate limiting
      if (i < toGenerate.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    setCurrentSound('');
    setIsGenerating(false);
    
    // Refresh existing count
    await checkExistingSounds();
  };

  const playTestSound = async (url: string) => {
    if (testAudio) {
      testAudio.pause();
    }
    const audio = new Audio(url);
    setTestAudio(audio);
    await audio.play();
  };

  React.useEffect(() => {
    checkExistingSounds();
  }, []);

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-display">Sound Seeder</h1>
        <p className="text-muted-foreground">
          Generate essential game sounds using ElevenLabs
        </p>
        <div className="text-sm text-muted-foreground">
          {existingCount} sounds in database | {SOUND_DEFINITIONS.length} defined
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <Button
          onClick={startGeneration}
          disabled={isGenerating}
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Generate Missing Sounds
            </>
          )}
        </Button>
      </div>

      {isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Generating: {currentSound}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <div className="flex gap-4 text-sm">
            <span className="text-green-500">✓ {successCount} success</span>
            <span className="text-red-500">✗ {errorCount} errors</span>
          </div>
          
          <ScrollArea className="h-64 rounded-lg border border-border/50 bg-background/50">
            <div className="p-3 space-y-1">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 text-sm py-1"
                >
                  {result.status === 'pending' && (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  {result.status === 'generating' && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  )}
                  {result.status === 'success' && (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={result.status === 'error' ? 'text-red-400' : ''}>
                    {result.filename}
                  </span>
                  {result.error && (
                    <span className="text-xs text-red-400 ml-auto">
                      {result.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>Sounds are generated via ElevenLabs and stored in Supabase storage.</p>
        <p>This may take several minutes depending on the number of sounds.</p>
      </div>
    </div>
  );
}
