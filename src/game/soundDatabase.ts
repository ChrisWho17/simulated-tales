// Sound Database v2.0 - Complete sound definitions with normalized volumes, cooldowns, priorities

import type { AudioChannel } from './audioEngine';

export interface SoundDefinition {
  sounds: string[];
  volume: number;
  channel: AudioChannel;
  cooldown?: number;
  priority?: number;
  maxPerMinute?: number;
  echo?: boolean;
  echoDelay?: number;
  echoDecay?: number;
  duckOthers?: boolean;
  duckAmount?: number;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  lowpass?: number | null;
  triggerShake?: boolean;
  triggerFlash?: boolean;
  sequential?: boolean;
}

export interface SoundCategory {
  [soundId: string]: SoundDefinition;
}

export interface SoundDatabaseType {
  combat: SoundCategory;
  pain: SoundCategory;
  dramatic: SoundCategory;
  movement: SoundCategory;
  doors: SoundCategory;
  objects: SoundCategory;
  vehicles: SoundCategory;
  weather: SoundCategory;
  ambient: SoundCategory;
  ui: SoundCategory;
  animals: SoundCategory;
  magic: SoundCategory;
}

export const SoundDatabase: SoundDatabaseType = {
  // ═══════════════════════════════════════════════════════════
  // COMBAT - FIREARMS
  // ═══════════════════════════════════════════════════════════
  combat: {
    // Pistols
    gunshot_pistol: {
      sounds: ['gun_pistol_1', 'gun_pistol_2', 'gun_pistol_3'],
      volume: 0.85,
      channel: 'effects',
      echo: true,
      echoDelay: 0.35,
      echoDecay: 0.4,
      duckOthers: true,
      duckAmount: 0.3,
      cooldown: 150,
      priority: 8
    },
    gunshot_pistol_indoor: {
      sounds: ['gun_pistol_indoor_1', 'gun_pistol_indoor_2'],
      volume: 0.90,
      channel: 'effects',
      echo: true,
      echoDelay: 0.15,
      echoDecay: 0.6,
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 150,
      priority: 8
    },
    gunshot_rifle: {
      sounds: ['gun_rifle_1', 'gun_rifle_2'],
      volume: 0.95,
      channel: 'effects',
      echo: true,
      echoDelay: 0.5,
      echoDecay: 0.5,
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 200,
      priority: 8
    },
    gunshot_shotgun: {
      sounds: ['gun_shotgun_1', 'gun_shotgun_2'],
      volume: 1.0,
      channel: 'effects',
      echo: true,
      echoDelay: 0.6,
      echoDecay: 0.55,
      duckOthers: true,
      duckAmount: 0.5,
      cooldown: 400,
      priority: 9
    },
    gunshot_distant: {
      sounds: ['gun_distant_1', 'gun_distant_2', 'gun_distant_3'],
      volume: 0.35,
      channel: 'effects',
      echo: true,
      echoDelay: 0.8,
      echoDecay: 0.35,
      lowpass: 1500,
      cooldown: 500,
      priority: 5
    },
    gunshot_silenced: {
      sounds: ['gun_silenced_1', 'gun_silenced_2'],
      volume: 0.30,
      channel: 'effects',
      cooldown: 150,
      priority: 5
    },
    reload_pistol: {
      sounds: ['reload_pistol_1', 'reload_pistol_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 800,
      priority: 4
    },
    reload_shotgun: {
      sounds: ['reload_shotgun_1', 'reload_shotgun_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 1000,
      priority: 4
    },
    bullet_impact: {
      sounds: ['bullet_impact_1', 'bullet_impact_2', 'bullet_impact_3'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 50,
      priority: 5
    },
    bullet_whiz: {
      sounds: ['bullet_whiz_1', 'bullet_whiz_2', 'bullet_whiz_3'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 100,
      priority: 6
    },
    // Melee
    punch: {
      sounds: ['punch_1', 'punch_2', 'punch_3'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 200,
      priority: 5
    },
    punch_heavy: {
      sounds: ['punch_heavy_1', 'punch_heavy_2'],
      volume: 0.75,
      channel: 'effects',
      cooldown: 300,
      priority: 6
    },
    kick: {
      sounds: ['kick_1', 'kick_2'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 300,
      priority: 5
    },
    slap: {
      sounds: ['slap_1', 'slap_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    body_fall: {
      sounds: ['body_fall_1', 'body_fall_2', 'body_fall_3'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 500,
      priority: 5
    },
    body_hit_ground: {
      sounds: ['body_hit_1', 'body_hit_2'],
      volume: 0.60,
      channel: 'effects',
      cooldown: 500,
      priority: 5
    },
    // Bladed Weapons
    sword_swing: {
      sounds: ['sword_swing_1', 'sword_swing_2', 'sword_swing_3'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 150,
      priority: 5
    },
    sword_clash: {
      sounds: ['sword_clash_1', 'sword_clash_2', 'sword_clash_3'],
      volume: 0.75,
      channel: 'effects',
      echo: true,
      echoDelay: 0.2,
      echoDecay: 0.3,
      cooldown: 200,
      priority: 6
    },
    sword_draw: {
      sounds: ['sword_draw_1', 'sword_draw_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    sword_sheathe: {
      sounds: ['sword_sheathe_1', 'sword_sheathe_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 500,
      priority: 3
    },
    knife_stab: {
      sounds: ['knife_stab_1', 'knife_stab_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 200,
      priority: 5
    },
    knife_slash: {
      sounds: ['knife_slash_1', 'knife_slash_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 150,
      priority: 4
    },
    // Explosions
    explosion_small: {
      sounds: ['explosion_small_1', 'explosion_small_2'],
      volume: 0.80,
      channel: 'effects',
      echo: true,
      echoDelay: 0.4,
      echoDecay: 0.5,
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 500,
      priority: 8,
      triggerShake: true
    },
    explosion_large: {
      sounds: ['explosion_large_1', 'explosion_large_2'],
      volume: 1.0,
      channel: 'effects',
      echo: true,
      echoDelay: 0.6,
      echoDecay: 0.6,
      duckOthers: true,
      duckAmount: 0.6,
      cooldown: 1000,
      priority: 10,
      triggerShake: true
    },
    explosion_distant: {
      sounds: ['explosion_distant_1', 'explosion_distant_2'],
      volume: 0.45,
      channel: 'effects',
      echo: true,
      echoDelay: 1.0,
      echoDecay: 0.4,
      lowpass: 1000,
      cooldown: 1500,
      priority: 6
    }
  },

  // ═══════════════════════════════════════════════════════════
  // PAIN / INJURY SOUNDS
  // ═══════════════════════════════════════════════════════════
  pain: {
    pain_male_light: {
      sounds: ['pain_male_light_1', 'pain_male_light_2', 'pain_male_light_3'],
      volume: 0.50,
      channel: 'dramatic',
      cooldown: 1500,
      maxPerMinute: 6,
      priority: 6
    },
    pain_male_medium: {
      sounds: ['pain_male_medium_1', 'pain_male_medium_2'],
      volume: 0.60,
      channel: 'dramatic',
      cooldown: 2000,
      maxPerMinute: 4,
      priority: 7
    },
    pain_male_heavy: {
      sounds: ['pain_male_heavy_1', 'pain_male_heavy_2'],
      volume: 0.70,
      channel: 'dramatic',
      cooldown: 3000,
      maxPerMinute: 3,
      priority: 8
    },
    pain_female_light: {
      sounds: ['pain_female_light_1', 'pain_female_light_2', 'pain_female_light_3'],
      volume: 0.50,
      channel: 'dramatic',
      cooldown: 1500,
      maxPerMinute: 6,
      priority: 6
    },
    pain_female_medium: {
      sounds: ['pain_female_medium_1', 'pain_female_medium_2'],
      volume: 0.60,
      channel: 'dramatic',
      cooldown: 2000,
      maxPerMinute: 4,
      priority: 7
    },
    pain_female_heavy: {
      sounds: ['pain_female_heavy_1', 'pain_female_heavy_2'],
      volume: 0.70,
      channel: 'dramatic',
      cooldown: 3000,
      maxPerMinute: 3,
      priority: 8
    },
    death_male: {
      sounds: ['death_male_1', 'death_male_2', 'death_male_3'],
      volume: 0.65,
      channel: 'dramatic',
      cooldown: 5000,
      maxPerMinute: 2,
      priority: 9
    },
    death_female: {
      sounds: ['death_female_1', 'death_female_2'],
      volume: 0.65,
      channel: 'dramatic',
      cooldown: 5000,
      maxPerMinute: 2,
      priority: 9
    },
    grunt_effort: {
      sounds: ['grunt_effort_1', 'grunt_effort_2', 'grunt_effort_3'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    breath_heavy: {
      sounds: ['breath_heavy_1', 'breath_heavy_2'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 2000,
      priority: 3
    }
  },

  // ═══════════════════════════════════════════════════════════
  // DRAMATIC / EMOTIONAL SOUNDS
  // ═══════════════════════════════════════════════════════════
  dramatic: {
    scream_terror: {
      sounds: ['scream_terror_1', 'scream_terror_2'],
      volume: 0.80,
      channel: 'dramatic',
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 5000,
      maxPerMinute: 2,
      priority: 9
    },
    scream_pain: {
      sounds: ['scream_pain_1', 'scream_pain_2'],
      volume: 0.75,
      channel: 'dramatic',
      duckOthers: true,
      duckAmount: 0.3,
      cooldown: 4000,
      maxPerMinute: 3,
      priority: 8
    },
    scream_surprise: {
      sounds: ['scream_surprise_1', 'scream_surprise_2'],
      volume: 0.60,
      channel: 'dramatic',
      cooldown: 3000,
      maxPerMinute: 4,
      priority: 7
    },
    gasp: {
      sounds: ['gasp_1', 'gasp_2', 'gasp_3'],
      volume: 0.45,
      channel: 'dramatic',
      cooldown: 2000,
      priority: 5
    },
    gasp_horror: {
      sounds: ['gasp_horror_1', 'gasp_horror_2'],
      volume: 0.55,
      channel: 'dramatic',
      cooldown: 3000,
      priority: 6
    },
    sigh_relief: {
      sounds: ['sigh_relief_1', 'sigh_relief_2'],
      volume: 0.35,
      channel: 'dramatic',
      cooldown: 3000,
      priority: 3
    },
    sigh_frustrated: {
      sounds: ['sigh_frustrated_1', 'sigh_frustrated_2'],
      volume: 0.40,
      channel: 'dramatic',
      cooldown: 3000,
      priority: 3
    },
    laugh_nervous: {
      sounds: ['laugh_nervous_1', 'laugh_nervous_2'],
      volume: 0.45,
      channel: 'dramatic',
      cooldown: 4000,
      priority: 4
    },
    laugh_evil: {
      sounds: ['laugh_evil_1', 'laugh_evil_2'],
      volume: 0.60,
      channel: 'dramatic',
      cooldown: 5000,
      priority: 6
    },
    crying_soft: {
      sounds: ['crying_soft_1', 'crying_soft_2'],
      volume: 0.40,
      channel: 'dramatic',
      cooldown: 5000,
      priority: 4
    },
    crying_heavy: {
      sounds: ['crying_heavy_1'],
      volume: 0.55,
      channel: 'dramatic',
      cooldown: 8000,
      priority: 5
    },
    sobbing: {
      sounds: ['sobbing_loop'],
      volume: 0.50,
      channel: 'dramatic',
      loop: true,
      fadeIn: 2,
      priority: 5
    },
    heartbeat_slow: {
      sounds: ['heartbeat_slow_loop'],
      volume: 0.40,
      channel: 'dramatic',
      loop: true,
      fadeIn: 2,
      priority: 6
    },
    heartbeat_fast: {
      sounds: ['heartbeat_fast_loop'],
      volume: 0.50,
      channel: 'dramatic',
      loop: true,
      fadeIn: 1,
      priority: 7
    },
    heartbeat_pounding: {
      sounds: ['heartbeat_pounding_loop'],
      volume: 0.60,
      channel: 'dramatic',
      loop: true,
      fadeIn: 0.5,
      priority: 8,
      duckOthers: true,
      duckAmount: 0.2
    },
    tension_sting: {
      sounds: ['tension_sting_1', 'tension_sting_2'],
      volume: 0.55,
      channel: 'dramatic',
      duckOthers: true,
      duckAmount: 0.3,
      cooldown: 5000,
      priority: 7
    },
    tension_hit: {
      sounds: ['tension_hit_1', 'tension_hit_2'],
      volume: 0.65,
      channel: 'dramatic',
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 3000,
      priority: 8
    },
    tension_drone: {
      sounds: ['tension_drone_loop'],
      volume: 0.45,
      channel: 'dramatic',
      loop: true,
      fadeIn: 4,
      priority: 5
    }
  },

  // ═══════════════════════════════════════════════════════════
  // MOVEMENT
  // ═══════════════════════════════════════════════════════════
  movement: {
    footsteps_walk: {
      sounds: ['step_walk_1', 'step_walk_2', 'step_walk_3', 'step_walk_4'],
      volume: 0.25,
      channel: 'effects',
      cooldown: 50,
      priority: 2,
      sequential: true
    },
    footsteps_run: {
      sounds: ['step_run_1', 'step_run_2', 'step_run_3', 'step_run_4'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 30,
      priority: 3,
      sequential: true
    },
    footsteps_sneak: {
      sounds: ['step_sneak_1', 'step_sneak_2', 'step_sneak_3'],
      volume: 0.12,
      channel: 'effects',
      cooldown: 100,
      priority: 1
    },
    footsteps_gravel: {
      sounds: ['step_gravel_1', 'step_gravel_2', 'step_gravel_3', 'step_gravel_4'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 50,
      priority: 2
    },
    footsteps_wood: {
      sounds: ['step_wood_1', 'step_wood_2', 'step_wood_3', 'step_wood_4'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 50,
      priority: 2
    },
    footsteps_metal: {
      sounds: ['step_metal_1', 'step_metal_2', 'step_metal_3'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 50,
      priority: 3
    },
    footsteps_water: {
      sounds: ['step_water_1', 'step_water_2', 'step_water_3', 'step_water_4'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 50,
      priority: 2
    },
    footsteps_snow: {
      sounds: ['step_snow_1', 'step_snow_2', 'step_snow_3'],
      volume: 0.30,
      channel: 'effects',
      cooldown: 50,
      priority: 2
    },
    footsteps_grass: {
      sounds: ['step_grass_1', 'step_grass_2', 'step_grass_3'],
      volume: 0.25,
      channel: 'effects',
      cooldown: 50,
      priority: 2
    },
    jump: {
      sounds: ['jump_1', 'jump_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 400,
      priority: 4
    },
    land_light: {
      sounds: ['land_light_1', 'land_light_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    land_heavy: {
      sounds: ['land_heavy_1', 'land_heavy_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 400,
      priority: 5
    },
    splash_small: {
      sounds: ['splash_small_1', 'splash_small_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    splash_large: {
      sounds: ['splash_large_1', 'splash_large_2'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 500,
      priority: 5
    },
    swimming: {
      sounds: ['swimming_loop'],
      volume: 0.45,
      channel: 'effects',
      loop: true,
      fadeIn: 1,
      priority: 3
    }
  },

  // ═══════════════════════════════════════════════════════════
  // DOORS
  // ═══════════════════════════════════════════════════════════
  doors: {
    door_open_wood: {
      sounds: ['door_open_wood_1', 'door_open_wood_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    door_close_wood: {
      sounds: ['door_close_wood_1', 'door_close_wood_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    door_slam: {
      sounds: ['door_slam_1', 'door_slam_2'],
      volume: 0.70,
      channel: 'effects',
      cooldown: 800,
      priority: 6
    },
    door_open_metal: {
      sounds: ['door_open_metal_1', 'door_open_metal_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    door_close_metal: {
      sounds: ['door_close_metal_1', 'door_close_metal_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    door_creak: {
      sounds: ['door_creak_1', 'door_creak_2', 'door_creak_3'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    door_knock: {
      sounds: ['door_knock_1', 'door_knock_2', 'door_knock_3'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 300,
      priority: 5
    },
    door_break: {
      sounds: ['door_break_1', 'door_break_2'],
      volume: 0.80,
      channel: 'effects',
      cooldown: 1000,
      priority: 7
    },
    door_lock: {
      sounds: ['door_lock_1', 'door_lock_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 500,
      priority: 3
    },
    door_unlock: {
      sounds: ['door_unlock_1', 'door_unlock_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 500,
      priority: 3
    }
  },

  // ═══════════════════════════════════════════════════════════
  // OBJECTS
  // ═══════════════════════════════════════════════════════════
  objects: {
    glass_break: {
      sounds: ['glass_break_1', 'glass_break_2', 'glass_break_3'],
      volume: 0.75,
      channel: 'effects',
      cooldown: 300,
      priority: 6
    },
    glass_shatter: {
      sounds: ['glass_shatter_1', 'glass_shatter_2'],
      volume: 0.85,
      channel: 'effects',
      cooldown: 500,
      priority: 7
    },
    glass_clink: {
      sounds: ['glass_clink_1', 'glass_clink_2'],
      volume: 0.30,
      channel: 'effects',
      cooldown: 200,
      priority: 2
    },
    metal_clang: {
      sounds: ['metal_clang_1', 'metal_clang_2', 'metal_clang_3'],
      volume: 0.65,
      channel: 'effects',
      echo: true,
      echoDelay: 0.3,
      echoDecay: 0.3,
      cooldown: 300,
      priority: 5
    },
    metal_drop: {
      sounds: ['metal_drop_1', 'metal_drop_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    paper_rustle: {
      sounds: ['paper_rustle_1', 'paper_rustle_2', 'paper_rustle_3'],
      volume: 0.20,
      channel: 'effects',
      cooldown: 100,
      priority: 1
    },
    paper_crumple: {
      sounds: ['paper_crumple_1', 'paper_crumple_2'],
      volume: 0.25,
      channel: 'effects',
      cooldown: 200,
      priority: 2
    },
    coin_drop: {
      sounds: ['coin_drop_1', 'coin_drop_2', 'coin_jingle'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 200,
      priority: 3
    },
    key_jingle: {
      sounds: ['key_jingle_1', 'key_jingle_2'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 300,
      priority: 3
    },
    chain_rattle: {
      sounds: ['chain_rattle_1', 'chain_rattle_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 300,
      priority: 4
    },
    lever_pull: {
      sounds: ['lever_pull_1', 'lever_pull_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 500,
      priority: 4
    },
    switch_click: {
      sounds: ['switch_click_1', 'switch_click_2'],
      volume: 0.35,
      channel: 'effects',
      cooldown: 200,
      priority: 3
    },
    typing: {
      sounds: ['typing_loop'],
      volume: 0.25,
      channel: 'effects',
      loop: true,
      fadeIn: 0.5,
      priority: 2
    },
    phone_ring: {
      sounds: ['phone_ring_1', 'phone_ring_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 2000,
      priority: 5
    },
    phone_vibrate: {
      sounds: ['phone_vibrate_1'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 1000,
      priority: 4
    }
  },

  // ═══════════════════════════════════════════════════════════
  // VEHICLES
  // ═══════════════════════════════════════════════════════════
  vehicles: {
    car_start: {
      sounds: ['car_start_1', 'car_start_2'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 2000,
      priority: 5
    },
    car_idle: {
      sounds: ['car_idle_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 1,
      priority: 3
    },
    car_drive: {
      sounds: ['car_drive_loop'],
      volume: 0.50,
      channel: 'ambience',
      loop: true,
      fadeIn: 1,
      priority: 4
    },
    car_horn: {
      sounds: ['car_horn_1', 'car_horn_2'],
      volume: 0.70,
      channel: 'effects',
      cooldown: 1000,
      priority: 6
    },
    car_crash: {
      sounds: ['car_crash_1', 'car_crash_2'],
      volume: 0.90,
      channel: 'effects',
      echo: true,
      echoDelay: 0.4,
      echoDecay: 0.4,
      duckOthers: true,
      duckAmount: 0.4,
      cooldown: 2000,
      priority: 8
    },
    car_pass_by: {
      sounds: ['car_pass_1', 'car_pass_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 3000,
      priority: 4
    },
    motorcycle_idle: {
      sounds: ['motorcycle_idle_loop'],
      volume: 0.50,
      channel: 'ambience',
      loop: true,
      fadeIn: 1,
      priority: 4
    },
    siren_police: {
      sounds: ['siren_police_loop'],
      volume: 0.65,
      channel: 'effects',
      loop: true,
      fadeIn: 2,
      priority: 6
    },
    siren_ambulance: {
      sounds: ['siren_ambulance_loop'],
      volume: 0.65,
      channel: 'effects',
      loop: true,
      fadeIn: 2,
      priority: 6
    },
    horse_gallop: {
      sounds: ['horse_gallop_loop'],
      volume: 0.55,
      channel: 'effects',
      loop: true,
      fadeIn: 1,
      priority: 4
    },
    horse_neigh: {
      sounds: ['horse_neigh_1', 'horse_neigh_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 3000,
      priority: 4
    }
  },

  // ═══════════════════════════════════════════════════════════
  // WEATHER
  // ═══════════════════════════════════════════════════════════
  weather: {
    rain_light: {
      sounds: ['rain_light_loop'],
      volume: 0.40,
      channel: 'weather',
      loop: true,
      fadeIn: 3,
      fadeOut: 3,
      priority: 2
    },
    rain_medium: {
      sounds: ['rain_medium_loop'],
      volume: 0.55,
      channel: 'weather',
      loop: true,
      fadeIn: 2,
      fadeOut: 3,
      priority: 3
    },
    rain_heavy: {
      sounds: ['rain_heavy_loop'],
      volume: 0.70,
      channel: 'weather',
      loop: true,
      fadeIn: 2,
      fadeOut: 3,
      priority: 4
    },
    rain_torrential: {
      sounds: ['rain_torrential_loop'],
      volume: 0.80,
      channel: 'weather',
      loop: true,
      fadeIn: 1.5,
      fadeOut: 3,
      priority: 5
    },
    rain_on_roof: {
      sounds: ['rain_on_roof_loop'],
      volume: 0.35,
      channel: 'weather',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    rain_on_window: {
      sounds: ['rain_on_window_loop'],
      volume: 0.30,
      channel: 'weather',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    thunder_distant: {
      sounds: ['thunder_distant_1', 'thunder_distant_2', 'thunder_distant_3'],
      volume: 0.50,
      channel: 'weather',
      echo: true,
      echoDelay: 0.8,
      echoDecay: 0.35,
      cooldown: 8000,
      priority: 6
    },
    thunder_medium: {
      sounds: ['thunder_medium_1', 'thunder_medium_2'],
      volume: 0.70,
      channel: 'weather',
      echo: true,
      echoDelay: 0.5,
      echoDecay: 0.4,
      cooldown: 10000,
      priority: 7,
      duckOthers: true,
      duckAmount: 0.3
    },
    thunder_close: {
      sounds: ['thunder_close_1', 'thunder_close_2'],
      volume: 0.90,
      channel: 'weather',
      echo: true,
      echoDelay: 0.3,
      echoDecay: 0.5,
      cooldown: 15000,
      priority: 8,
      duckOthers: true,
      duckAmount: 0.5,
      triggerShake: true,
      triggerFlash: true
    },
    thunder_crack: {
      sounds: ['thunder_crack_1', 'thunder_crack_2'],
      volume: 0.95,
      channel: 'weather',
      echo: true,
      echoDelay: 0.2,
      echoDecay: 0.55,
      cooldown: 20000,
      priority: 9,
      duckOthers: true,
      duckAmount: 0.6,
      triggerShake: true,
      triggerFlash: true
    },
    wind_light: {
      sounds: ['wind_light_loop'],
      volume: 0.30,
      channel: 'weather',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    wind_medium: {
      sounds: ['wind_medium_loop'],
      volume: 0.45,
      channel: 'weather',
      loop: true,
      fadeIn: 3,
      priority: 3
    },
    wind_strong: {
      sounds: ['wind_strong_loop'],
      volume: 0.60,
      channel: 'weather',
      loop: true,
      fadeIn: 2,
      priority: 4
    },
    wind_howl: {
      sounds: ['wind_howl_loop'],
      volume: 0.50,
      channel: 'weather',
      loop: true,
      fadeIn: 3,
      priority: 4
    },
    snow_ambient: {
      sounds: ['snow_ambient_loop'],
      volume: 0.25,
      channel: 'weather',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    blizzard: {
      sounds: ['blizzard_loop'],
      volume: 0.55,
      channel: 'weather',
      loop: true,
      fadeIn: 3,
      priority: 4
    },
    fog_ambient: {
      sounds: ['fog_ambient_loop'],
      volume: 0.20,
      channel: 'weather',
      loop: true,
      lowpass: 800,
      fadeIn: 5,
      priority: 2
    }
  },

  // ═══════════════════════════════════════════════════════════
  // AMBIENT / LOCATION
  // ═══════════════════════════════════════════════════════════
  ambient: {
    // Time of day
    ambience_day: {
      sounds: ['amb_day_birds_loop', 'amb_day_nature_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    ambience_night: {
      sounds: ['amb_night_crickets_loop', 'amb_night_nature_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    ambience_dawn: {
      sounds: ['amb_dawn_birds_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    // Indoor locations
    bar_ambience: {
      sounds: ['bar_ambient_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    bar_busy: {
      sounds: ['bar_busy_loop'],
      volume: 0.50,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 4
    },
    tavern_ambience: {
      sounds: ['tavern_ambient_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    restaurant_ambience: {
      sounds: ['restaurant_ambient_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    office_ambience: {
      sounds: ['office_ambient_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    hospital_ambience: {
      sounds: ['hospital_ambient_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    warehouse_ambience: {
      sounds: ['warehouse_ambient_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    factory_ambience: {
      sounds: ['factory_ambient_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    library_ambience: {
      sounds: ['library_ambient_loop'],
      volume: 0.15,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 1
    },
    church_ambience: {
      sounds: ['church_ambient_loop'],
      volume: 0.20,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    // Outdoor - Urban
    city_traffic: {
      sounds: ['city_traffic_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 3
    },
    city_busy: {
      sounds: ['city_busy_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 4
    },
    city_night: {
      sounds: ['city_night_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    city_alley: {
      sounds: ['city_alley_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    city_distant: {
      sounds: ['city_distant_loop'],
      volume: 0.20,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    // Nature
    forest_day: {
      sounds: ['forest_day_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    forest_night: {
      sounds: ['forest_night_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    jungle: {
      sounds: ['jungle_ambient_loop'],
      volume: 0.50,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    swamp_ambient: {
      sounds: ['swamp_ambient_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    desert_ambient: {
      sounds: ['desert_ambient_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    mountain_ambient: {
      sounds: ['mountain_ambient_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    beach_ambience: {
      sounds: ['beach_ambient_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    ocean_waves: {
      sounds: ['ocean_waves_loop'],
      volume: 0.50,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    river_flow: {
      sounds: ['river_flow_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 3
    },
    waterfall: {
      sounds: ['waterfall_loop'],
      volume: 0.55,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 4
    },
    // Underground
    cave_ambient: {
      sounds: ['cave_ambient_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    cave_drips: {
      sounds: ['cave_drips_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    sewer_ambient: {
      sounds: ['sewer_ambient_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    dungeon_ambient: {
      sounds: ['dungeon_ambient_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 3
    },
    // Crowds
    crowd_murmur: {
      sounds: ['crowd_murmur_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    crowd_busy: {
      sounds: ['crowd_busy_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 4
    },
    crowd_cheer: {
      sounds: ['crowd_cheer_1', 'crowd_cheer_2'],
      volume: 0.60,
      channel: 'effects',
      cooldown: 3000,
      priority: 5
    },
    crowd_panic: {
      sounds: ['crowd_panic_loop'],
      volume: 0.60,
      channel: 'ambience',
      loop: true,
      fadeIn: 1,
      priority: 5
    },
    // Creepy / Horror
    creepy_ambient: {
      sounds: ['creepy_ambient_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    haunted_ambient: {
      sounds: ['haunted_ambient_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 3
    },
    graveyard_ambient: {
      sounds: ['graveyard_ambient_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 4,
      priority: 2
    },
    // Fire
    fire_crackling: {
      sounds: ['fire_crackle_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 1,
      priority: 3
    },
    fireplace: {
      sounds: ['fireplace_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    campfire: {
      sounds: ['campfire_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    // Mechanical
    machinery_light: {
      sounds: ['machinery_light_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    },
    machinery_heavy: {
      sounds: ['machinery_heavy_loop'],
      volume: 0.45,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 3
    },
    electrical_hum: {
      sounds: ['electrical_hum_loop'],
      volume: 0.20,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 1
    },
    ventilation: {
      sounds: ['ventilation_loop'],
      volume: 0.20,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 1
    },
    air_conditioning: {
      sounds: ['air_conditioning_loop'],
      volume: 0.25,
      channel: 'ambience',
      loop: true,
      fadeIn: 2,
      priority: 2
    }
  },

  // ═══════════════════════════════════════════════════════════
  // UI SOUNDS
  // ═══════════════════════════════════════════════════════════
  ui: {
    click: {
      sounds: ['ui_click_1'],
      volume: 0.35,
      channel: 'ui',
      cooldown: 50,
      priority: 5
    },
    hover: {
      sounds: ['ui_hover_1'],
      volume: 0.15,
      channel: 'ui',
      cooldown: 30,
      priority: 3
    },
    select: {
      sounds: ['ui_select_1'],
      volume: 0.40,
      channel: 'ui',
      cooldown: 100,
      priority: 5
    },
    confirm: {
      sounds: ['ui_confirm_1'],
      volume: 0.45,
      channel: 'ui',
      cooldown: 200,
      priority: 5
    },
    cancel: {
      sounds: ['ui_cancel_1'],
      volume: 0.40,
      channel: 'ui',
      cooldown: 200,
      priority: 5
    },
    notification: {
      sounds: ['ui_notification_1'],
      volume: 0.50,
      channel: 'ui',
      cooldown: 1000,
      priority: 6
    },
    notification_urgent: {
      sounds: ['ui_notification_urgent_1'],
      volume: 0.60,
      channel: 'ui',
      cooldown: 1500,
      priority: 7
    },
    success: {
      sounds: ['ui_success_1'],
      volume: 0.50,
      channel: 'ui',
      cooldown: 500,
      priority: 6
    },
    error: {
      sounds: ['ui_error_1'],
      volume: 0.45,
      channel: 'ui',
      cooldown: 500,
      priority: 6
    },
    level_up: {
      sounds: ['ui_levelup_1'],
      volume: 0.60,
      channel: 'ui',
      cooldown: 2000,
      priority: 7
    },
    xp_gain: {
      sounds: ['ui_xp_gain_1', 'ui_xp_gain_2'],
      volume: 0.35,
      channel: 'ui',
      cooldown: 200,
      priority: 4
    },
    quest_start: {
      sounds: ['ui_quest_start_1'],
      volume: 0.50,
      channel: 'ui',
      cooldown: 2000,
      priority: 6
    },
    quest_complete: {
      sounds: ['ui_quest_complete_1'],
      volume: 0.55,
      channel: 'ui',
      cooldown: 2000,
      priority: 6
    },
    item_acquired: {
      sounds: ['ui_item_get_1'],
      volume: 0.45,
      channel: 'ui',
      cooldown: 500,
      priority: 5
    },
    achievement: {
      sounds: ['ui_achievement_1'],
      volume: 0.55,
      channel: 'ui',
      cooldown: 3000,
      priority: 7
    }
  },

  // ═══════════════════════════════════════════════════════════
  // ANIMALS
  // ═══════════════════════════════════════════════════════════
  animals: {
    birds_chirping: {
      sounds: ['birds_chirping_loop'],
      volume: 0.30,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    owl_hoot: {
      sounds: ['owl_hoot_1', 'owl_hoot_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 8000,
      priority: 3
    },
    wolf_howl: {
      sounds: ['wolf_howl_1', 'wolf_howl_2'],
      volume: 0.55,
      channel: 'effects',
      cooldown: 15000,
      priority: 5
    },
    dog_bark: {
      sounds: ['dog_bark_1', 'dog_bark_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 2000,
      priority: 4
    },
    dog_growl: {
      sounds: ['dog_growl_1', 'dog_growl_2'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 3000,
      priority: 4
    },
    cat_meow: {
      sounds: ['cat_meow_1', 'cat_meow_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 3000,
      priority: 3
    },
    cat_hiss: {
      sounds: ['cat_hiss_1'],
      volume: 0.45,
      channel: 'effects',
      cooldown: 3000,
      priority: 4
    },
    rats_scurrying: {
      sounds: ['rats_scurrying_1', 'rats_scurrying_2'],
      volume: 0.30,
      channel: 'effects',
      cooldown: 4000,
      priority: 3
    },
    crickets: {
      sounds: ['crickets_loop'],
      volume: 0.35,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    frogs: {
      sounds: ['frogs_loop'],
      volume: 0.40,
      channel: 'ambience',
      loop: true,
      fadeIn: 3,
      priority: 2
    },
    crows_cawing: {
      sounds: ['crows_cawing_1', 'crows_cawing_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 5000,
      priority: 3
    },
    seagulls: {
      sounds: ['seagulls_1', 'seagulls_2'],
      volume: 0.40,
      channel: 'effects',
      cooldown: 4000,
      priority: 3
    }
  },

  // ═══════════════════════════════════════════════════════════
  // MAGIC
  // ═══════════════════════════════════════════════════════════
  magic: {
    spell_cast: {
      sounds: ['spell_cast_1', 'spell_cast_2'],
      volume: 0.60,
      channel: 'effects',
      cooldown: 500,
      priority: 6
    },
    spell_fire: {
      sounds: ['spell_fire_1', 'spell_fire_2'],
      volume: 0.70,
      channel: 'effects',
      cooldown: 500,
      priority: 6
    },
    spell_ice: {
      sounds: ['spell_ice_1', 'spell_ice_2'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 500,
      priority: 6
    },
    spell_lightning: {
      sounds: ['spell_lightning_1', 'spell_lightning_2'],
      volume: 0.75,
      channel: 'effects',
      cooldown: 500,
      priority: 7
    },
    spell_heal: {
      sounds: ['spell_heal_1', 'spell_heal_2'],
      volume: 0.50,
      channel: 'effects',
      cooldown: 500,
      priority: 5
    },
    portal_open: {
      sounds: ['portal_open_1'],
      volume: 0.65,
      channel: 'effects',
      cooldown: 2000,
      priority: 6
    },
    portal_hum: {
      sounds: ['portal_hum_loop'],
      volume: 0.45,
      channel: 'effects',
      loop: true,
      fadeIn: 1,
      priority: 5
    }
  }
};

// Helper function to get a sound definition
export function getSoundDef(soundPath: string): SoundDefinition | null {
  const [category, soundId] = soundPath.split('.');
  return (SoundDatabase as any)[category]?.[soundId] || null;
}

// Get all sound keys in a category
export function getCategorySoundKeys(category: keyof SoundDatabaseType): string[] {
  const cat = SoundDatabase[category];
  if (!cat) return [];
  return Object.keys(cat).map(k => `${category}.${k}`);
}

// Get all categories
export function getCategories(): (keyof SoundDatabaseType)[] {
  return Object.keys(SoundDatabase) as (keyof SoundDatabaseType)[];
}
