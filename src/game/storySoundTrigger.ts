// Story Sound Trigger System - Automatic narrative text detection and event-based sounds
import { audioEngine, AudioChannel } from './audioEngine';
import { acousticEnvironmentSystem, LocationAcoustics } from './acousticEnvironmentSystem';
import { soundPreloader, CachedSound } from './soundPreloader';

interface SoundEffectConfig {
  sounds: string[];
  channel?: AudioChannel;
  volume?: number;
  echo?: boolean;
  echoDelay?: number;
  echoDecay?: number;
  lowpass?: number | null;
  pan?: number | (() => number);
  delay?: number;
  loop?: boolean;
}

interface TextPattern {
  patterns: RegExp[];
  sound: string;
  cooldown: number;
}

class StorySoundTrigger {
  // Mapping from internal sound IDs to preloader categories
  private preloaderCategoryMap: Record<string, string[]> = {
    // Combat sounds
    'combat.gunshot_pistol': ['gun_pistol', 'combat_gunshot_pistol'],
    'combat.gunshot_rifle': ['gun_rifle', 'combat_gunshot_rifle'],
    'combat.gunshot_shotgun': ['gun_shotgun', 'combat_gunshot_shotgun'],
    'combat.gunshot_distant': ['gun_distant', 'acoustic_outdoor_gunshot'],
    'combat.gunshot_silenced': ['gun_silenced'],
    'combat.bullet_impact': ['bullet_impact', 'bullet_ricochet'],
    'combat.bullet_whiz': ['bullet_whiz'],
    'combat.punch': ['combat_punch', 'action_combat_punch'],
    'combat.kick': ['combat_kick', 'action_combat_kick'],
    'combat.body_fall': ['human_grunt', 'action_combat'],
    'combat.sword_swing': ['combat_sword', 'action_combat_sword'],
    'combat.sword_clash': ['combat_sword', 'action_combat_sword'],
    'combat.sword_draw': ['combat_sword'],
    'combat.knife_stab': ['combat_dagger', 'action_combat_knife'],
    'combat.pain_male': ['human_grunt', 'human_scream'],
    'combat.pain_female': ['human_scream'],
    'combat.death_male': ['human_scream', 'human_grunt'],
    'combat.death_female': ['human_scream'],
    
    // Movement
    'movement.footsteps_walk': ['footsteps_stone', 'footsteps_wood', 'footsteps_grass'],
    'movement.footsteps_run': ['footsteps_stone', 'footsteps_wood'],
    'movement.footsteps_sneak': ['action_stealth', 'footsteps_stone'],
    
    // Doors
    'doors.door_open': ['door_wooden', 'door_metal', 'door_creaky'],
    'doors.door_close': ['door_wooden', 'door_metal'],
    'doors.door_slam': ['door_heavy', 'door_metal'],
    'doors.door_creak': ['door_creaky'],
    'doors.door_knock': ['door_wooden'],
    'doors.door_break': ['door_heavy', 'explosion_debris'],
    
    // Objects
    'objects.glass_break': ['glass_break', 'glass_shatter'],
    'objects.glass_clink': ['glass_clink'],
    'objects.metal_clang': ['chains_rattle', 'lever_mechanical'],
    'objects.paper_rustle': ['action_investigation'],
    'objects.coin_drop': ['coins_jingle', 'coins_drop'],
    'objects.key_jingle': ['keys_jingle', 'keys_ring'],
    
    // Vehicles
    'vehicles.car_start': ['vehicle_car_engine', 'vehicle_car_start'],
    'vehicles.car_idle': ['vehicle_car_idle', 'vehicle_car_engine'],
    'vehicles.car_horn': ['vehicle_car_horn'],
    'vehicles.car_crash': ['vehicle_car_crash', 'explosion_debris'],
    
    // Dramatic - SCREAM REMOVED to reduce chaos
    'dramatic.heartbeat': ['human_heartbeat'],
    'dramatic.heartbeat_fast': ['human_heartbeat'],
    'dramatic.gasp': ['human_gasp'],
    // 'dramatic.scream' - DISABLED: causes chaos
    'dramatic.laughter': ['human_laugh'],
    'dramatic.crying': ['human_cry'],
    'dramatic.sigh': ['human_breath'],
    
    // Ambient - location based
    'ambient.crowd_murmur': ['ambience_market', 'ambience_plaza', 'crowd_busy'],
    'ambient.bar_ambience': ['ambience_tavern', 'ambience_inn'],
    'ambient.city_traffic': ['ambience_city_day', 'ambience_city_night'],
    'ambient.forest_ambient': ['ambience_forest', 'ambience_wilderness'],
    'ambient.cave_drips': ['ambience_cave', 'ambience_dungeon'],
    'ambient.fire_crackling': ['element_fire', 'ambience_campsite'],
    'ambient.water_stream': ['element_water', 'ambience_riverside'],
    
    // UI - Generated sounds from database
    'ui.notification': ['ui_notification'],
    'ui.click': ['ui_buttons/click_soft'],
    'ui.click_soft': ['ui_buttons/click_soft'],
    'ui.toggle_on': ['ui_buttons/click_toggle_on'],
    'ui.toggle_off': ['ui_buttons/click_toggle_off'],
    'ui.success': ['ui_success'],
    'ui.error': ['ui_error'],
    'ui.level_up': ['magic_heal', 'ui_success'],
    'ui.item_acquired': ['ui_resources/coins_pickup', 'chest_open'],
    'ui.coins_pickup': ['ui_resources/coins_pickup'],
    'ui.coins_drop': ['ui_resources/coins_drop'],
    'ui.coins_count': ['ui_resources/coins_count'],
    'ui.bag_open': ['ui_inventory/bag_open'],
    'ui.bag_close': ['ui_inventory/bag_close'],
    'ui.item_drop': ['ui_inventory/item_drop'],
    'ui.equip_accessory': ['ui_equip/equip_accessory'],
    'ui.equip_clothing': ['ui_equip/equip_clothing'],
    'ui.equip_helmet': ['ui_equip/equip_helmet'],
    'ui.unequip_weapon': ['ui_equip/unequip_weapon']
  };
  
  // ═══════════════════════════════════════════════════════════
  // EXTENDED NARRATIVE KEYWORDS → PRELOADER CATEGORIES
  // WHERE: Maps detected narrative text patterns to sound categories
  // WHEN: Processed in analyzeText() during story generation
  // HOW: Regex matches trigger playFromCategories() with matched sounds
  // ═══════════════════════════════════════════════════════════
  private narrativeKeywordMap: Record<string, string[]> = {
    // ═══════════════════════════════════════════════════════════
    // WEAPONS - Combat narrative triggers
    // ═══════════════════════════════════════════════════════════
    'pistol|handgun|revolver': ['gun_pistol', 'acoustic_indoor_gunshot', 'acoustic_outdoor_gunshot'],
    'rifle|carbine|sniper': ['gun_rifle'],
    'shotgun': ['gun_shotgun'],
    'machinegun|automatic': ['gun_machinegun'],
    'explosion|explode|blast|detonate': ['explosion_large', 'explosion_small', 'explosion_debris'],
    'grenade': ['explosion_grenade'],
    
    // ═══════════════════════════════════════════════════════════
    // MELEE WEAPONS
    // ═══════════════════════════════════════════════════════════
    'sword|blade': ['combat_sword'],
    'axe|cleave': ['combat_axe'],
    'mace|hammer|bludgeon': ['combat_mace'],
    'bow|arrow': ['combat_bow'],
    'dagger|knife|stab': ['combat_dagger'],
    
    // ═══════════════════════════════════════════════════════════
    // CREATURES - Animal and monster sounds
    // ═══════════════════════════════════════════════════════════
    'wolf|howl': ['creature_wolf'],
    'dog|bark': ['creature_dog'],
    'horse|gallop|neigh': ['creature_horse'],
    'bear|growl': ['creature_bear'],
    'dragon|roar': ['creature_dragon'],
    'monster|beast': ['creature_monster'],
    'zombie|undead': ['creature_zombie'],
    'ghost|specter|phantom': ['creature_ghost'],
    'demon|devil': ['creature_demon'],
    
    // ═══════════════════════════════════════════════════════════
    // WEATHER - New expanded weather keywords with indoor/outdoor variants
    // ═══════════════════════════════════════════════════════════
    'thunder|lightning|thunderstorm': ['weather_thunder', 'weather/thunder_close', 'weather/thunder_distant', 'nature/thunderstorm'],
    'rain|downpour|drizzle|raining': ['weather_rain', 'nature/rain_light_drizzle', 'nature/rain_heavy_outside'],
    'rain.*window|window.*rain|inside.*rain': ['weather/rain_on_window_inside'],
    'rain.*roof|roof.*rain|patter.*roof': ['weather/rain_on_metal_roof'],
    'rain.*tent|tent.*rain|camping.*rain': ['weather/rain_on_tent'],
    'umbrella.*rain|rain.*umbrella': ['weather/rain_on_umbrella'],
    'wind|gust|breeze|blustery': ['weather_wind', 'nature/mountain_wind', 'weather/wind_strong_outside'],
    'wind.*window|window.*wind|draft': ['weather/wind_outside_window'],
    'hail|hailstorm|hailstones': ['weather/hailstorm'],
    'blizzard|snowstorm|whiteout': ['weather/arctic_blizzard'],
    'snow|snowfall|snowing': ['weather_snow', 'weather/snow_falling'],
    'fog|mist|foggy|misty': ['weather_fog', 'weather/fog_horn'],
    'tornado|cyclone|twister': ['weather/tornado_siren'],
    'hurricane|typhoon': ['weather/hurricane_storm'],
    
    // ═══════════════════════════════════════════════════════════
    // ELEMENTS
    // ═══════════════════════════════════════════════════════════
    'fire|flame|burning|campfire': ['element_fire', 'nature/campfire'],
    'water|splash|river|stream': ['element_water', 'nature/river_stream'],
    'waterfall|cascade|falls': ['nature/waterfall'],
    'ocean|waves|sea|beach': ['nature/ocean_waves', 'ambience_ocean'],
    'ice|freeze|frozen': ['element_ice'],
    'electricity|shock|zap': ['element_electricity'],
    
    // ═══════════════════════════════════════════════════════════
    // MAGIC
    // ═══════════════════════════════════════════════════════════
    'spell|cast|magic': ['magic_spell', 'magic_cast'],
    'portal|dimension': ['magic_portal', 'scifi_teleport'],
    'heal|healing|restore': ['magic_heal'],
    
    // ═══════════════════════════════════════════════════════════
    // NATURE LOCATIONS - New expanded nature keywords
    // ═══════════════════════════════════════════════════════════
    'forest|woods|wilderness|glade': ['ambience_forest', 'ambience_wilderness', 'nature/forest_peaceful', 'nature/forest_night'],
    'jungle|rainforest|tropics': ['nature/jungle_ambiance', 'ambience_wilderness'],
    'swamp|marsh|bog|bayou': ['nature/swamp_ambiance'],
    'cave|cavern|underground|grotto': ['ambience_cave', 'ambience_dungeon', 'nature/cave_ambiance'],
    'mountain|peak|summit|highlands': ['nature/mountain_wind', 'ambience_wilderness'],
    
    // ═══════════════════════════════════════════════════════════
    // URBAN LOCATIONS - New expanded urban keywords
    // ═══════════════════════════════════════════════════════════
    'city|town|street|urban': ['ambience_city_day', 'ambience_city_night', 'urban/city_street_busy'],
    'subway|metro|underground train': ['urban/subway_station'],
    'office|cubicle|corporate': ['urban/office_ambiance'],
    'coffee shop|cafe|starbucks': ['urban/coffee_shop'],
    'mall|shopping center': ['urban/shopping_mall'],
    'airport|terminal|departures': ['urban/airport_terminal'],
    'hospital|medical|emergency room': ['urban/hospital_corridor'],
    'construction|building site': ['urban/construction_site'],
    'siren|police|ambulance': ['urban/police_siren_modern', 'urban/ambulance_siren'],
    'car horn|honk|traffic': ['urban/car_horn'],
    'elevator|lift': ['urban/elevator_ding'],
    
    // ═══════════════════════════════════════════════════════════
    // MEDIEVAL/FANTASY LOCATIONS
    // ═══════════════════════════════════════════════════════════
    'tavern|inn|bar': ['ambience_tavern', 'ambience_inn'],
    'market|bazaar|plaza': ['ambience_market', 'ambience_plaza'],
    'castle|throne|palace': ['ambience_castle', 'ambience_throne_room'],
    'church|temple|shrine': ['ambience_temple', 'ambience_shrine'],
    'ship|boat|deck': ['ambience_ship', 'ambience_harbor'],
    'battlefield|war|siege': ['ambience_battlefield', 'crowd_battle'],
    
    // ═══════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════
    'sneak|stealth|creep': ['action_stealth', 'footsteps_stone'],
    'chase|pursuit|run': ['action_chase', 'footsteps_stone'],
    'climb|scale': ['action_climbing'],
    'swim|swimming': ['element_water', 'action_swimming'],
    'search|investigate': ['action_investigation'],
    
    // ═══════════════════════════════════════════════════════════
    // SCI-FI
    // ═══════════════════════════════════════════════════════════
    'laser|blaster': ['scifi_laser'],
    'spaceship|starship': ['scifi_engine', 'scifi_tech'],
    'teleport|warp': ['scifi_teleport'],
    'robot|android|mech': ['scifi_tech', 'hydraulics_machinery']
  };

  // Sound effect definitions organized by category
  private soundEffects: Record<string, Record<string, SoundEffectConfig>> = {
    // ═══════════════════════════════════════════════════════════
    // COMBAT SOUNDS - Loud: gunshots, artillery, tank. Others: background level
    // Echo: single, fast decay for immersion without chaos
    // ═══════════════════════════════════════════════════════════
    combat: {
      gunshot_pistol: {
        sounds: ['gun_pistol_1', 'gun_pistol_2'],
        echo: true,
        echoDelay: 0.15,
        echoDecay: 0.15,
        volume: 0.6
      },
      gunshot_rifle: {
        sounds: ['gun_rifle_1', 'gun_rifle_2'],
        echo: true,
        echoDelay: 0.15,
        echoDecay: 0.15,
        volume: 0.65
      },
      gunshot_shotgun: {
        sounds: ['gun_shotgun_1'],
        echo: true,
        echoDelay: 0.15,
        echoDecay: 0.15,
        volume: 0.65
      },
      gunshot_distant: {
        sounds: ['gun_distant_1', 'gun_distant_2', 'gun_distant_3'],
        volume: 0.25,
        lowpass: 1200
      },
      gunshot_silenced: {
        sounds: ['gun_silenced_1'],
        volume: 0.2,
        echo: false
      },
      bullet_impact: {
        sounds: ['bullet_impact_1', 'bullet_impact_2', 'bullet_ricochet'],
        volume: 0.2,
        delay: 0.1
      },
      bullet_whiz: {
        sounds: ['bullet_whiz_1', 'bullet_whiz_2'],
        volume: 0.2,
        pan: () => Math.random() * 2 - 1
      },
      punch: {
        sounds: ['punch_1', 'punch_2', 'punch_3'],
        volume: 0.2
      },
      kick: {
        sounds: ['kick_1', 'kick_2'],
        volume: 0.2
      },
      body_fall: {
        sounds: ['body_fall_1', 'body_fall_2'],
        volume: 0.2
      },
      sword_swing: {
        sounds: ['sword_swing_1', 'sword_swing_2'],
        volume: 0.2
      },
      sword_clash: {
        sounds: ['sword_clash_1', 'sword_clash_2', 'sword_clash_3'],
        volume: 0.25
      },
      sword_draw: {
        sounds: ['sword_draw_1'],
        volume: 0.15
      },
      knife_stab: {
        sounds: ['knife_stab_1', 'knife_stab_2'],
        volume: 0.2
      },
      pain_male: {
        sounds: ['pain_male_1', 'pain_male_2', 'pain_male_3'],
        volume: 0.2
      },
      pain_female: {
        sounds: ['pain_female_1', 'pain_female_2'],
        volume: 0.2
      },
      death_male: {
        sounds: ['death_male_1', 'death_male_2'],
        volume: 0.2
      },
      death_female: {
        sounds: ['death_female_1', 'death_female_2'],
        volume: 0.2
      }
    },

    // ═══════════════════════════════════════════════════════════
    // MOVEMENT & ENVIRONMENT - Very quiet background
    // ═══════════════════════════════════════════════════════════
    movement: {
      footsteps_walk: {
        sounds: ['step_walk_1', 'step_walk_2', 'step_walk_3', 'step_walk_4'],
        volume: 0.1
      },
      footsteps_run: {
        sounds: ['step_run_1', 'step_run_2', 'step_run_3'],
        volume: 0.15
      },
      footsteps_sneak: {
        sounds: ['step_sneak_1', 'step_sneak_2'],
        volume: 0.08
      }
    },

    // ═══════════════════════════════════════════════════════════
    // DOORS - Quiet background
    // ═══════════════════════════════════════════════════════════
    doors: {
      door_open: {
        sounds: ['door_open_1', 'door_open_2'],
        volume: 0.15
      },
      door_close: {
        sounds: ['door_close_1', 'door_close_2'],
        volume: 0.15
      },
      door_slam: {
        sounds: ['door_slam_1'],
        volume: 0.25
      },
      door_creak: {
        sounds: ['door_creak_1', 'door_creak_2'],
        volume: 0.12
      },
      door_knock: {
        sounds: ['door_knock_1', 'door_knock_2'],
        volume: 0.2
      },
      door_break: {
        sounds: ['door_break_1'],
        volume: 0.3
      }
    },

    // ═══════════════════════════════════════════════════════════
    // OBJECTS & INTERACTIONS - Quiet background
    // ═══════════════════════════════════════════════════════════
    objects: {
      glass_break: {
        sounds: ['glass_break_1', 'glass_break_2', 'glass_shatter'],
        volume: 0.25
      },
      glass_clink: {
        sounds: ['glass_clink_1', 'glass_clink_2'],
        volume: 0.1
      },
      metal_clang: {
        sounds: ['metal_clang_1', 'metal_clang_2'],
        volume: 0.2
      },
      paper_rustle: {
        sounds: ['paper_rustle_1', 'paper_rustle_2'],
        volume: 0.08
      },
      coin_drop: {
        sounds: ['coin_drop_1', 'coin_drop_2', 'coin_jingle'],
        volume: 0.12
      },
      key_jingle: {
        sounds: ['key_jingle_1', 'key_jingle_2'],
        volume: 0.1
      }
    },

    // ═══════════════════════════════════════════════════════════
    // VEHICLES - Quiet background except crashes
    // ═══════════════════════════════════════════════════════════
    vehicles: {
      car_start: {
        sounds: ['car_start_1', 'car_start_2'],
        volume: 0.2
      },
      car_idle: {
        sounds: ['car_idle_loop'],
        loop: true,
        volume: 0.12
      },
      car_horn: {
        sounds: ['car_horn_1', 'car_horn_2'],
        volume: 0.2
      },
      car_crash: {
        sounds: ['car_crash_1', 'car_crash_2'],
        volume: 0.4,
        echo: true,
        echoDelay: 0.15,
        echoDecay: 0.15
      }
    },

    // ═══════════════════════════════════════════════════════════
    // EMOTIONAL / DRAMATIC - Quiet, no screaming (removed chaos sounds)
    // ═══════════════════════════════════════════════════════════
    dramatic: {
      heartbeat: {
        sounds: ['heartbeat_loop'],
        loop: true,
        volume: 0.2,
        channel: 'effects'
      },
      heartbeat_fast: {
        sounds: ['heartbeat_fast_loop'],
        loop: true,
        volume: 0.25,
        channel: 'effects'
      },
      gasp: {
        sounds: ['gasp_1', 'gasp_2', 'gasp_surprise'],
        volume: 0.15
      },
      // Scream disabled - causes chaos, replaced with silent placeholder
      scream: {
        sounds: [],
        volume: 0
      },
      laughter: {
        sounds: ['laugh_1', 'laugh_2', 'chuckle'],
        volume: 0.15
      },
      crying: {
        sounds: ['crying_1', 'sobbing_1'],
        volume: 0.15
      },
      sigh: {
        sounds: ['sigh_1', 'sigh_relief'],
        volume: 0.1
      }
    },

    // ═══════════════════════════════════════════════════════════
    // AMBIENT / LOCATION - Very quiet background noise
    // ═══════════════════════════════════════════════════════════
    ambient: {
      crowd_murmur: {
        sounds: ['crowd_murmur_loop'],
        loop: true,
        volume: 0.12
      },
      bar_ambience: {
        sounds: ['bar_ambient_loop'],
        loop: true,
        volume: 0.12
      },
      city_traffic: {
        sounds: ['city_traffic_loop'],
        loop: true,
        volume: 0.1
      },
      forest_ambient: {
        sounds: ['forest_ambient_loop'],
        loop: true,
        volume: 0.12
      },
      cave_drips: {
        sounds: ['cave_drips_loop'],
        loop: true,
        volume: 0.1
      },
      fire_crackling: {
        sounds: ['fire_crackle_loop'],
        loop: true,
        volume: 0.15
      },
      water_stream: {
        sounds: ['stream_loop'],
        loop: true,
        volume: 0.12
      }
    },

    // ═══════════════════════════════════════════════════════════
    // UI SOUNDS - Quiet feedback
    // ═══════════════════════════════════════════════════════════
    ui: {
      notification: {
        sounds: ['ui_notification'],
        volume: 0.2,
        channel: 'ui'
      },
      click: {
        sounds: ['ui_click'],
        volume: 0.15,
        channel: 'ui'
      },
      success: {
        sounds: ['ui_success'],
        volume: 0.25,
        channel: 'ui'
      },
      error: {
        sounds: ['ui_error'],
        volume: 0.2,
        channel: 'ui'
      },
      level_up: {
        sounds: ['ui_levelup'],
        volume: 0.3,
        channel: 'ui'
      },
      item_acquired: {
        sounds: ['ui_item_get'],
        volume: 0.25,
        channel: 'ui'
      }
    }
  };

  // Text patterns for auto-triggering sounds - LONGER COOLDOWNS to prevent spam
  private textPatterns: TextPattern[] = [
    // Gunshots - loud sounds, moderate cooldown
    {
      patterns: [
        /\b(fires?|shoots?|shot|fired)\b.*\b(gun|pistol|revolver|handgun)\b/i,
        /\bgunshot\b/i,
        /\bpulls?\s+the\s+trigger\b/i
      ],
      sound: 'combat.gunshot_pistol',
      cooldown: 3000
    },
    {
      patterns: [
        /\b(fires?|shoots?)\b.*\b(rifle|carbine|AR|AK)\b/i
      ],
      sound: 'combat.gunshot_rifle',
      cooldown: 3000
    },
    {
      patterns: [
        /\b(fires?|shoots?)\b.*\bshotgun\b/i,
        /\bblast\b.*\bshotgun\b/i
      ],
      sound: 'combat.gunshot_shotgun',
      cooldown: 3000
    },
    {
      patterns: [
        /\bgunfire\b.*\bdistance\b/i,
        /\bdistant\b.*\b(shots?|gunfire)\b/i,
        /\bhear\b.*\b(shots?|gunfire)\b/i
      ],
      sound: 'combat.gunshot_distant',
      cooldown: 5000
    },

    // Melee combat - long cooldowns
    {
      patterns: [
        /\b(punche?s?|punched|punching)\b/i,
        /\bfist\b.*\b(connects?|lands?|hits?)\b/i
      ],
      sound: 'combat.punch',
      cooldown: 4000
    },
    {
      patterns: [/\b(kicks?)\b/i],
      sound: 'combat.kick',
      cooldown: 4000
    },
    {
      patterns: [
        /\b(stabs?|stabbed|stabbing)\b/i,
        /\bknife\b.*\b(plunges?|sinks?)\b/i,
        /\bblade\b.*\b(enters?|pierces?)\b/i
      ],
      sound: 'combat.knife_stab',
      cooldown: 5000
    },
    {
      patterns: [
        /\bswords?\b.*\b(clash|clang|ring)\b/i,
        /\bblades?\b.*\b(meet)\b/i,
        /\bparr(y|ies|ied)\b/i
      ],
      sound: 'combat.sword_clash',
      cooldown: 4000
    },
    {
      patterns: [
        /\b(swings?|slashes?)\b.*\bsword\b/i,
        /\bsword\b.*\b(swings?|arcs?)\b/i
      ],
      sound: 'combat.sword_swing',
      cooldown: 4000
    },
    {
      patterns: [
        /\bdraws?\b.*\b(sword|blade|weapon)\b/i,
        /\b(unsheathes?|pulls?)\b.*\bsword\b/i
      ],
      sound: 'combat.sword_draw',
      cooldown: 8000
    },

    // Falls and impacts - long cooldowns
    {
      patterns: [
        /\b(falls?|collapses?|drops?)\b.*\b(ground|floor|dead)\b/i,
        /\bbody\b.*\b(hits?|falls?|crumples?)\b/i,
        /\bslumps?\s+(to|onto)\b/i
      ],
      sound: 'combat.body_fall',
      cooldown: 8000
    },

    // Doors - long cooldowns
    {
      patterns: [
        /\b(opens?|opening)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(opens?|swings?\s+open)\b/i
      ],
      sound: 'doors.door_open',
      cooldown: 5000
    },
    {
      patterns: [
        /\b(closes?|closing|shuts?)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(closes?|shuts?)\b/i
      ],
      sound: 'doors.door_close',
      cooldown: 5000
    },
    {
      patterns: [
        /\bslams?\b.*\bdoor\b/i,
        /\bdoor\b.*\bslams?\b/i
      ],
      sound: 'doors.door_slam',
      cooldown: 5000
    },
    {
      patterns: [
        /\bknocks?\b.*\bdoor\b/i,
        /\bdoor\b.*\bknock\b/i
      ],
      sound: 'doors.door_knock',
      cooldown: 5000
    },
    {
      patterns: [
        /\b(kicks?\s+in|breaks?\s+down|bursts?\s+through)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(splinters?|crashes?|breaks?)\b/i
      ],
      sound: 'doors.door_break',
      cooldown: 8000
    },

    // Glass - long cooldowns
    {
      patterns: [
        /\bglass\b.*\b(shatters?|breaks?|smashes?)\b/i,
        /\bwindow\b.*\b(shatters?|breaks?|smashes?)\b/i,
        /\bcrash\b.*\bthrough\b.*\bwindow\b/i
      ],
      sound: 'objects.glass_break',
      cooldown: 6000
    },

    // Vehicles - long cooldowns
    {
      patterns: [
        /\b(starts?|fires?\s+up)\b.*\b(car|engine|vehicle)\b/i,
        /\bengine\b.*\b(roars?|rumbles?)\s+to\s+life\b/i
      ],
      sound: 'vehicles.car_start',
      cooldown: 10000
    },
    {
      patterns: [
        /\bcar\b.*\b(crashes?|collides?|slams?)\b/i,
        /\b(collision|crash|impact)\b.*\bvehicle\b/i
      ],
      sound: 'vehicles.car_crash',
      cooldown: 10000
    },
    {
      patterns: [
        /\b(honks?|horn\s+blares?)\b/i
      ],
      sound: 'vehicles.car_horn',
      cooldown: 8000
    },

    // Emotional - REMOVED SCREAMING, kept others with long cooldowns
    {
      patterns: [
        /\bgasps?\b/i,
        /\bsharp\s+intake\s+of\s+breath\b/i
      ],
      sound: 'dramatic.gasp',
      cooldown: 8000
    },
    // SCREAMING PATTERN REMOVED - causes chaos
    {
      patterns: [
        /\b(laughs?|chuckles?|giggles?)\b/i
      ],
      sound: 'dramatic.laughter',
      cooldown: 10000
    },
    {
      patterns: [
        /\b(cries?|crying|sobbing|weeps?)\b/i,
        /\btears\b.*\b(stream|fall|roll)\b/i
      ],
      sound: 'dramatic.crying',
      cooldown: 15000
    },
    {
      patterns: [/\bsighs?\b/i],
      sound: 'dramatic.sigh',
      cooldown: 10000
    }
  ];

  // Track cooldowns to prevent spam
  private lastPlayed: Map<string, number> = new Map();

  // Active location ambience
  private currentLocationAmbience: string | null = null;

  // Heartbeat tracking
  private heartbeatActive = false;

  // ═══════════════════════════════════════════════════════════
  // PRELOADER INTEGRATION
  // ═══════════════════════════════════════════════════════════

  /**
   * Try to play a sound from preloaded library first, fall back to static definitions
   */
  private async tryPlayFromPreloader(soundPath: string): Promise<boolean> {
    // Check if preloader is ready
    if (!soundPreloader.isReady()) return false;

    // Get mapped categories for this sound path
    const mappedCategories = this.preloaderCategoryMap[soundPath];
    if (!mappedCategories || mappedCategories.length === 0) return false;

    // Try each category until we find a match
    for (const category of mappedCategories) {
      const sound = soundPreloader.getRandomFromCategory(category);
      if (sound) {
        const acousticEffects = acousticEnvironmentSystem.getAudioEffects();
        const isIndoors = acousticEnvironmentSystem.isIndoors();
        const [cat, soundId] = soundPath.split('.');
        const shouldApplyAcoustics = this.shouldApplyAcousticEffects(cat, soundId);

        // Determine acoustic effects
        const echo = shouldApplyAcoustics 
          ? (isIndoors ? acousticEffects.reverb : acousticEffects.echo)
          : false;
        
        const echoDelay = shouldApplyAcoustics
          ? (isIndoors ? 0.1 + acousticEffects.reverbDuration * 0.1 : acousticEffects.echoDelay)
          : 0.3;
        
        const echoDecay = shouldApplyAcoustics
          ? (isIndoors ? 0.6 + acousticEffects.reverbDuration * 0.2 : acousticEffects.echoDecay)
          : 0.4;

        const soundKey = soundPreloader.getSoundKey(sound);
        
        try {
          await audioEngine.playSound(soundKey, {
            channel: 'effects',
            volume: 1,
            echo,
            echoDelay,
            echoDecay,
            lowpass: acousticEffects.lowpass || undefined,
            highpass: acousticEffects.highpass || undefined
          });
          console.log(`[StorySoundTrigger] Played preloaded sound: ${soundKey}`);
          return true;
        } catch (error) {
          console.warn(`[StorySoundTrigger] Failed to play preloaded sound: ${soundKey}`, error);
        }
      }
    }

    return false;
  }

  /**
   * Find and play sounds matching narrative keywords from preloaded library
   */
  private async playNarrativeKeywordSounds(text: string): Promise<string[]> {
    if (!soundPreloader.isReady()) return [];

    const playedSounds: string[] = [];
    const now = Date.now();
    const textLower = text.toLowerCase();

    for (const [keywordPattern, categories] of Object.entries(this.narrativeKeywordMap)) {
      // Check cooldown using pattern as key
      const lastTime = this.lastPlayed.get(`keyword:${keywordPattern}`) || 0;
      if (now - lastTime < 1000) continue; // 1 second cooldown per keyword group

      // Check if any keyword matches
      const keywords = keywordPattern.split('|');
      const matches = keywords.some(kw => textLower.includes(kw));

      if (matches) {
        // Try to play from each category
        for (const category of categories) {
          const sound = soundPreloader.getRandomFromCategory(category);
          if (sound) {
            this.lastPlayed.set(`keyword:${keywordPattern}`, now);
            
            const acousticEffects = acousticEnvironmentSystem.getAudioEffects();
            const isIndoors = acousticEnvironmentSystem.isIndoors();
            const shouldApplyAcoustics = this.shouldApplyAcousticEffects('narrative', category);

            const echo = shouldApplyAcoustics 
              ? (isIndoors ? acousticEffects.reverb : acousticEffects.echo)
              : false;
            
            const echoDelay = shouldApplyAcoustics
              ? (isIndoors ? 0.1 + acousticEffects.reverbDuration * 0.1 : acousticEffects.echoDelay)
              : 0.3;
            
            const echoDecay = shouldApplyAcoustics
              ? (isIndoors ? 0.6 + acousticEffects.reverbDuration * 0.2 : acousticEffects.echoDecay)
              : 0.4;

            const soundKey = soundPreloader.getSoundKey(sound);
            
            try {
              await audioEngine.playSound(soundKey, {
                channel: 'effects',
                volume: 0.8,
                echo,
                echoDelay,
                echoDecay,
                lowpass: acousticEffects.lowpass || undefined,
                highpass: acousticEffects.highpass || undefined
              });
              playedSounds.push(soundKey);
              console.log(`[StorySoundTrigger] Played keyword sound: ${soundKey} for "${keywords.find(k => textLower.includes(k))}"`);
            } catch (error) {
              console.warn(`[StorySoundTrigger] Failed to play keyword sound: ${soundKey}`, error);
            }
            
            break; // Only play one sound per keyword group
          }
        }
      }
    }

    return playedSounds;
  }

  // ═══════════════════════════════════════════════════════════
  // SOUND PLAYBACK WITH ACOUSTIC ENVIRONMENT
  // ═══════════════════════════════════════════════════════════

  async play(soundPath: string, overrideOptions: Partial<SoundEffectConfig> = {}): Promise<void> {
    // First, try to play from preloaded sounds
    const playedFromPreloader = await this.tryPlayFromPreloader(soundPath);
    if (playedFromPreloader) return;

    // Fall back to static sound definitions
    const [category, soundId] = soundPath.split('.');
    const soundDef = this.soundEffects[category]?.[soundId];

    if (!soundDef) {
      console.warn(`Sound not found: ${soundPath}`);
      return;
    }

    // Pick random sound from list
    const soundKey = soundDef.sounds[
      Math.floor(Math.random() * soundDef.sounds.length)
    ];

    // Get acoustic environment effects
    const acousticEffects = acousticEnvironmentSystem.getAudioEffects();
    const isIndoors = acousticEnvironmentSystem.isIndoors();

    // Build options - merge sound definition with acoustic environment
    const pan = typeof soundDef.pan === 'function' ? soundDef.pan() : (soundDef.pan || 0);
    
    // Determine echo/reverb based on sound type and environment
    const shouldApplyAcoustics = this.shouldApplyAcousticEffects(category, soundId);
    
    // Handle loops vs one-shots
    if (soundDef.loop) {
      await audioEngine.playLoop(soundKey, {
        id: soundPath,
        channel: soundDef.channel || 'effects' as AudioChannel,
        volume: soundDef.volume || 1,
        pan,
        lowpass: acousticEffects.lowpass || soundDef.lowpass || undefined
      });
    } else {
      // Apply acoustic environment to non-looping sounds
      const echo = shouldApplyAcoustics 
        ? (isIndoors ? acousticEffects.reverb : acousticEffects.echo)
        : (soundDef.echo || false);
      
      const echoDelay = shouldApplyAcoustics
        ? (isIndoors ? 0.1 + acousticEffects.reverbDuration * 0.1 : acousticEffects.echoDelay)
        : (soundDef.echoDelay || 0.3);
      
      const echoDecay = shouldApplyAcoustics
        ? (isIndoors ? 0.6 + acousticEffects.reverbDuration * 0.2 : acousticEffects.echoDecay)
        : (soundDef.echoDecay || 0.4);

      await audioEngine.playSound(soundKey, {
        channel: soundDef.channel || 'effects' as AudioChannel,
        volume: soundDef.volume || 1,
        echo,
        echoDelay,
        echoDecay,
        lowpass: acousticEffects.lowpass || soundDef.lowpass || undefined,
        highpass: acousticEffects.highpass || undefined,
        pan,
        delay: soundDef.delay || 0
      });
    }
  }

  // Determine if acoustic effects should be applied to a sound
  private shouldApplyAcousticEffects(category: string, soundId: string): boolean {
    // Apply acoustics to combat, vehicles, and dramatic sounds
    const acousticCategories = ['combat', 'vehicles', 'dramatic', 'doors', 'narrative'];
    if (acousticCategories.includes(category)) return true;

    // Apply to specific loud sounds
    const loudSounds = ['gunshot', 'explosion', 'crash', 'break', 'slam', 'scream', 'gun_', 'combat_', 'creature_'];
    if (loudSounds.some(s => soundId.includes(s))) return true;

    return false;
  }

  // Set location and update acoustic environment
  setAcousticLocation(locationType: string): void {
    acousticEnvironmentSystem.setLocation(locationType);
  }

  // Get current acoustic space
  getAcousticSpace(): string {
    return acousticEnvironmentSystem.getAcousticSpace();
  }

  // Check if indoors
  isIndoors(): boolean {
    return acousticEnvironmentSystem.isIndoors();
  }

  // Stop a looping sound
  async stop(soundPath: string, fadeOut = 1): Promise<void> {
    await audioEngine.stopLoop(soundPath, { fadeOut });
  }

  // ═══════════════════════════════════════════════════════════
  // AUTOMATIC TEXT DETECTION WITH ACOUSTIC AWARENESS
  // ═══════════════════════════════════════════════════════════

  processNarrativeText(text: string): string[] {
    const triggeredSounds: string[] = [];
    const now = Date.now();

    // First, detect and update location from text
    const detectedLocation = acousticEnvironmentSystem.detectLocationFromText(text);
    if (detectedLocation) {
      acousticEnvironmentSystem.setLocation(detectedLocation);
      // Also update ambience for the location
      this.setLocationAmbience(detectedLocation);
    }

    // Try to play keyword-matched sounds from preloader
    this.playNarrativeKeywordSounds(text).then(keywordSounds => {
      if (keywordSounds.length > 0) {
        console.log(`[StorySoundTrigger] Keyword sounds triggered: ${keywordSounds.join(', ')}`);
      }
    });

    // Also check static text patterns
    for (const pattern of this.textPatterns) {
      // Check cooldown
      const lastTime = this.lastPlayed.get(pattern.sound) || 0;
      if (now - lastTime < pattern.cooldown) continue;

      // Check if any pattern matches
      const matches = pattern.patterns.some(regex => regex.test(text));

      if (matches) {
        this.lastPlayed.set(pattern.sound, now);
        triggeredSounds.push(pattern.sound);
        this.play(pattern.sound);
      }
    }

    return triggeredSounds;
  }

  // ═══════════════════════════════════════════════════════════
  // LOCATION AMBIENCE WITH ACOUSTIC INTEGRATION
  // ═══════════════════════════════════════════════════════════

  async setLocationAmbience(locationType: string): Promise<void> {
    // Update acoustic environment
    acousticEnvironmentSystem.setLocation(locationType);
    
    // Stop current ambience
    if (this.currentLocationAmbience) {
      await this.stop(this.currentLocationAmbience);
    }

    // Location to ambience mapping
    const locationAmbience: Record<string, string> = {
      bar: 'ambient.bar_ambience',
      tavern: 'ambient.bar_ambience',
      pub: 'ambient.bar_ambience',
      city: 'ambient.city_traffic',
      street: 'ambient.city_traffic',
      market: 'ambient.crowd_murmur',
      forest: 'ambient.forest_ambient',
      woods: 'ambient.forest_ambient',
      cave: 'ambient.cave_drips',
      campfire: 'ambient.fire_crackling',
      fireplace: 'ambient.fire_crackling',
      river: 'ambient.water_stream',
      stream: 'ambient.water_stream',
      // Extended location ambiences
      dungeon: 'ambient.cave_drips',
      crypt: 'ambient.cave_drips',
      church: 'ambient.cave_drips', // Echoey
      cathedral: 'ambient.cave_drips',
      warehouse: 'ambient.cave_drips',
      swamp: 'ambient.forest_ambient',
      battlefield: 'ambient.city_traffic', // Distant sounds
    };

    const ambienceKey = locationAmbience[locationType.toLowerCase()];

    if (ambienceKey) {
      await this.play(ambienceKey);
      this.currentLocationAmbience = ambienceKey;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HEARTBEAT SYSTEM (for tension/adrenaline)
  // ═══════════════════════════════════════════════════════════

  async setHeartbeat(level: number): Promise<void> {
    if (level >= 80 && !this.heartbeatActive) {
      await this.play('dramatic.heartbeat_fast');
      this.heartbeatActive = true;
    } else if (level >= 60 && !this.heartbeatActive) {
      await this.play('dramatic.heartbeat');
      this.heartbeatActive = true;
    } else if (level < 50 && this.heartbeatActive) {
      await this.stop('dramatic.heartbeat');
      await this.stop('dramatic.heartbeat_fast');
      this.heartbeatActive = false;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // UI SOUNDS
  // ═══════════════════════════════════════════════════════════

  playUISound(sound: 'click' | 'notification' | 'success' | 'error' | 'level_up' | 'item_acquired'): void {
    this.play(`ui.${sound}`);
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════

  stopAll(): void {
    if (this.currentLocationAmbience) {
      this.stop(this.currentLocationAmbience, 0.5);
      this.currentLocationAmbience = null;
    }

    if (this.heartbeatActive) {
      this.stop('dramatic.heartbeat', 0.5);
      this.stop('dramatic.heartbeat_fast', 0.5);
      this.heartbeatActive = false;
    }
  }
}

// Singleton instance
export const storySoundTrigger = new StorySoundTrigger();
