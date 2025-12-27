// Story Sound Trigger System - Automatic narrative text detection and event-based sounds
import { audioEngine, AudioChannel } from './audioEngine';
import { acousticEnvironmentSystem, LocationAcoustics } from './acousticEnvironmentSystem';

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
  // Sound effect definitions organized by category
  private soundEffects: Record<string, Record<string, SoundEffectConfig>> = {
    // ═══════════════════════════════════════════════════════════
    // COMBAT SOUNDS
    // ═══════════════════════════════════════════════════════════
    combat: {
      gunshot_pistol: {
        sounds: ['gun_pistol_1', 'gun_pistol_2'],
        echo: true,
        echoDelay: 0.4,
        echoDecay: 0.5,
        volume: 0.9
      },
      gunshot_rifle: {
        sounds: ['gun_rifle_1', 'gun_rifle_2'],
        echo: true,
        echoDelay: 0.5,
        echoDecay: 0.6,
        volume: 1.0
      },
      gunshot_shotgun: {
        sounds: ['gun_shotgun_1'],
        echo: true,
        echoDelay: 0.6,
        echoDecay: 0.7,
        volume: 1.0
      },
      gunshot_distant: {
        sounds: ['gun_distant_1', 'gun_distant_2', 'gun_distant_3'],
        volume: 0.4,
        lowpass: 1200
      },
      gunshot_silenced: {
        sounds: ['gun_silenced_1'],
        volume: 0.3,
        echo: false
      },
      bullet_impact: {
        sounds: ['bullet_impact_1', 'bullet_impact_2', 'bullet_ricochet'],
        volume: 0.5,
        delay: 0.1
      },
      bullet_whiz: {
        sounds: ['bullet_whiz_1', 'bullet_whiz_2'],
        volume: 0.6,
        pan: () => Math.random() * 2 - 1
      },
      punch: {
        sounds: ['punch_1', 'punch_2', 'punch_3'],
        volume: 0.7
      },
      kick: {
        sounds: ['kick_1', 'kick_2'],
        volume: 0.7
      },
      body_fall: {
        sounds: ['body_fall_1', 'body_fall_2'],
        volume: 0.6
      },
      sword_swing: {
        sounds: ['sword_swing_1', 'sword_swing_2'],
        volume: 0.6
      },
      sword_clash: {
        sounds: ['sword_clash_1', 'sword_clash_2', 'sword_clash_3'],
        volume: 0.8
      },
      sword_draw: {
        sounds: ['sword_draw_1'],
        volume: 0.5
      },
      knife_stab: {
        sounds: ['knife_stab_1', 'knife_stab_2'],
        volume: 0.6
      },
      pain_male: {
        sounds: ['pain_male_1', 'pain_male_2', 'pain_male_3'],
        volume: 0.7
      },
      pain_female: {
        sounds: ['pain_female_1', 'pain_female_2'],
        volume: 0.7
      },
      death_male: {
        sounds: ['death_male_1', 'death_male_2'],
        volume: 0.6
      },
      death_female: {
        sounds: ['death_female_1', 'death_female_2'],
        volume: 0.6
      }
    },

    // ═══════════════════════════════════════════════════════════
    // MOVEMENT & ENVIRONMENT
    // ═══════════════════════════════════════════════════════════
    movement: {
      footsteps_walk: {
        sounds: ['step_walk_1', 'step_walk_2', 'step_walk_3', 'step_walk_4'],
        volume: 0.3
      },
      footsteps_run: {
        sounds: ['step_run_1', 'step_run_2', 'step_run_3'],
        volume: 0.5
      },
      footsteps_sneak: {
        sounds: ['step_sneak_1', 'step_sneak_2'],
        volume: 0.15
      }
    },

    // ═══════════════════════════════════════════════════════════
    // DOORS
    // ═══════════════════════════════════════════════════════════
    doors: {
      door_open: {
        sounds: ['door_open_1', 'door_open_2'],
        volume: 0.5
      },
      door_close: {
        sounds: ['door_close_1', 'door_close_2'],
        volume: 0.5
      },
      door_slam: {
        sounds: ['door_slam_1'],
        volume: 0.8
      },
      door_creak: {
        sounds: ['door_creak_1', 'door_creak_2'],
        volume: 0.4
      },
      door_knock: {
        sounds: ['door_knock_1', 'door_knock_2'],
        volume: 0.6
      },
      door_break: {
        sounds: ['door_break_1'],
        volume: 0.9
      }
    },

    // ═══════════════════════════════════════════════════════════
    // OBJECTS & INTERACTIONS
    // ═══════════════════════════════════════════════════════════
    objects: {
      glass_break: {
        sounds: ['glass_break_1', 'glass_break_2', 'glass_shatter'],
        volume: 0.8
      },
      glass_clink: {
        sounds: ['glass_clink_1', 'glass_clink_2'],
        volume: 0.3
      },
      metal_clang: {
        sounds: ['metal_clang_1', 'metal_clang_2'],
        volume: 0.7
      },
      paper_rustle: {
        sounds: ['paper_rustle_1', 'paper_rustle_2'],
        volume: 0.25
      },
      coin_drop: {
        sounds: ['coin_drop_1', 'coin_drop_2', 'coin_jingle'],
        volume: 0.4
      },
      key_jingle: {
        sounds: ['key_jingle_1', 'key_jingle_2'],
        volume: 0.35
      }
    },

    // ═══════════════════════════════════════════════════════════
    // VEHICLES
    // ═══════════════════════════════════════════════════════════
    vehicles: {
      car_start: {
        sounds: ['car_start_1', 'car_start_2'],
        volume: 0.7
      },
      car_idle: {
        sounds: ['car_idle_loop'],
        loop: true,
        volume: 0.4
      },
      car_horn: {
        sounds: ['car_horn_1', 'car_horn_2'],
        volume: 0.7
      },
      car_crash: {
        sounds: ['car_crash_1', 'car_crash_2'],
        volume: 1.0,
        echo: true
      }
    },

    // ═══════════════════════════════════════════════════════════
    // EMOTIONAL / DRAMATIC
    // ═══════════════════════════════════════════════════════════
    dramatic: {
      heartbeat: {
        sounds: ['heartbeat_loop'],
        loop: true,
        volume: 0.5,
        channel: 'effects'
      },
      heartbeat_fast: {
        sounds: ['heartbeat_fast_loop'],
        loop: true,
        volume: 0.6,
        channel: 'effects'
      },
      gasp: {
        sounds: ['gasp_1', 'gasp_2', 'gasp_surprise'],
        volume: 0.5
      },
      scream: {
        sounds: ['scream_1', 'scream_2'],
        volume: 0.8
      },
      laughter: {
        sounds: ['laugh_1', 'laugh_2', 'chuckle'],
        volume: 0.5
      },
      crying: {
        sounds: ['crying_1', 'sobbing_1'],
        volume: 0.5
      },
      sigh: {
        sounds: ['sigh_1', 'sigh_relief'],
        volume: 0.4
      }
    },

    // ═══════════════════════════════════════════════════════════
    // AMBIENT / LOCATION
    // ═══════════════════════════════════════════════════════════
    ambient: {
      crowd_murmur: {
        sounds: ['crowd_murmur_loop'],
        loop: true,
        volume: 0.4
      },
      bar_ambience: {
        sounds: ['bar_ambient_loop'],
        loop: true,
        volume: 0.4
      },
      city_traffic: {
        sounds: ['city_traffic_loop'],
        loop: true,
        volume: 0.35
      },
      forest_ambient: {
        sounds: ['forest_ambient_loop'],
        loop: true,
        volume: 0.4
      },
      cave_drips: {
        sounds: ['cave_drips_loop'],
        loop: true,
        volume: 0.3
      },
      fire_crackling: {
        sounds: ['fire_crackle_loop'],
        loop: true,
        volume: 0.5
      },
      water_stream: {
        sounds: ['stream_loop'],
        loop: true,
        volume: 0.4
      }
    },

    // ═══════════════════════════════════════════════════════════
    // UI SOUNDS
    // ═══════════════════════════════════════════════════════════
    ui: {
      notification: {
        sounds: ['ui_notification'],
        volume: 0.4,
        channel: 'ui'
      },
      click: {
        sounds: ['ui_click'],
        volume: 0.3,
        channel: 'ui'
      },
      success: {
        sounds: ['ui_success'],
        volume: 0.5,
        channel: 'ui'
      },
      error: {
        sounds: ['ui_error'],
        volume: 0.4,
        channel: 'ui'
      },
      level_up: {
        sounds: ['ui_levelup'],
        volume: 0.6,
        channel: 'ui'
      },
      item_acquired: {
        sounds: ['ui_item_get'],
        volume: 0.5,
        channel: 'ui'
      }
    }
  };

  // Text patterns for auto-triggering sounds
  private textPatterns: TextPattern[] = [
    // Gunshots
    {
      patterns: [
        /\b(fires?|shoots?|shot|fired)\b.*\b(gun|pistol|revolver|handgun)\b/i,
        /\bgunshot\b/i,
        /\bpulls?\s+the\s+trigger\b/i
      ],
      sound: 'combat.gunshot_pistol',
      cooldown: 500
    },
    {
      patterns: [
        /\b(fires?|shoots?)\b.*\b(rifle|carbine|AR|AK)\b/i
      ],
      sound: 'combat.gunshot_rifle',
      cooldown: 500
    },
    {
      patterns: [
        /\b(fires?|shoots?)\b.*\bshotgun\b/i,
        /\bblast\b.*\bshotgun\b/i
      ],
      sound: 'combat.gunshot_shotgun',
      cooldown: 500
    },
    {
      patterns: [
        /\bgunfire\b.*\bdistance\b/i,
        /\bdistant\b.*\b(shots?|gunfire)\b/i,
        /\bhear\b.*\b(shots?|gunfire)\b/i
      ],
      sound: 'combat.gunshot_distant',
      cooldown: 1000
    },

    // Melee combat
    {
      patterns: [
        /\b(punche?s?|punched|punching)\b/i,
        /\bfist\b.*\b(connects?|lands?|hits?)\b/i
      ],
      sound: 'combat.punch',
      cooldown: 300
    },
    {
      patterns: [/\b(kicks?)\b/i],
      sound: 'combat.kick',
      cooldown: 300
    },
    {
      patterns: [
        /\b(stabs?|stabbed|stabbing)\b/i,
        /\bknife\b.*\b(plunges?|sinks?)\b/i,
        /\bblade\b.*\b(enters?|pierces?)\b/i
      ],
      sound: 'combat.knife_stab',
      cooldown: 500
    },
    {
      patterns: [
        /\bswords?\b.*\b(clash|clang|ring)\b/i,
        /\bblades?\b.*\b(meet)\b/i,
        /\bparr(y|ies|ied)\b/i
      ],
      sound: 'combat.sword_clash',
      cooldown: 400
    },
    {
      patterns: [
        /\b(swings?|slashes?)\b.*\bsword\b/i,
        /\bsword\b.*\b(swings?|arcs?)\b/i
      ],
      sound: 'combat.sword_swing',
      cooldown: 400
    },
    {
      patterns: [
        /\bdraws?\b.*\b(sword|blade|weapon)\b/i,
        /\b(unsheathes?|pulls?)\b.*\bsword\b/i
      ],
      sound: 'combat.sword_draw',
      cooldown: 1000
    },

    // Falls and impacts
    {
      patterns: [
        /\b(falls?|collapses?|drops?)\b.*\b(ground|floor|dead)\b/i,
        /\bbody\b.*\b(hits?|falls?|crumples?)\b/i,
        /\bslumps?\s+(to|onto)\b/i
      ],
      sound: 'combat.body_fall',
      cooldown: 1000
    },

    // Doors
    {
      patterns: [
        /\b(opens?|opening)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(opens?|swings?\s+open)\b/i
      ],
      sound: 'doors.door_open',
      cooldown: 500
    },
    {
      patterns: [
        /\b(closes?|closing|shuts?)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(closes?|shuts?)\b/i
      ],
      sound: 'doors.door_close',
      cooldown: 500
    },
    {
      patterns: [
        /\bslams?\b.*\bdoor\b/i,
        /\bdoor\b.*\bslams?\b/i
      ],
      sound: 'doors.door_slam',
      cooldown: 500
    },
    {
      patterns: [
        /\bknocks?\b.*\bdoor\b/i,
        /\bdoor\b.*\bknock\b/i
      ],
      sound: 'doors.door_knock',
      cooldown: 500
    },
    {
      patterns: [
        /\b(kicks?\s+in|breaks?\s+down|bursts?\s+through)\b.*\bdoor\b/i,
        /\bdoor\b.*\b(splinters?|crashes?|breaks?)\b/i
      ],
      sound: 'doors.door_break',
      cooldown: 1000
    },

    // Glass
    {
      patterns: [
        /\bglass\b.*\b(shatters?|breaks?|smashes?)\b/i,
        /\bwindow\b.*\b(shatters?|breaks?|smashes?)\b/i,
        /\bcrash\b.*\bthrough\b.*\bwindow\b/i
      ],
      sound: 'objects.glass_break',
      cooldown: 500
    },

    // Vehicles
    {
      patterns: [
        /\b(starts?|fires?\s+up)\b.*\b(car|engine|vehicle)\b/i,
        /\bengine\b.*\b(roars?|rumbles?)\s+to\s+life\b/i
      ],
      sound: 'vehicles.car_start',
      cooldown: 2000
    },
    {
      patterns: [
        /\bcar\b.*\b(crashes?|collides?|slams?)\b/i,
        /\b(collision|crash|impact)\b.*\bvehicle\b/i
      ],
      sound: 'vehicles.car_crash',
      cooldown: 2000
    },
    {
      patterns: [
        /\b(honks?|horn\s+blares?)\b/i
      ],
      sound: 'vehicles.car_horn',
      cooldown: 1000
    },

    // Emotional
    {
      patterns: [
        /\bgasps?\b/i,
        /\bsharp\s+intake\s+of\s+breath\b/i
      ],
      sound: 'dramatic.gasp',
      cooldown: 1000
    },
    {
      patterns: [
        /\b(screams?|shrieks?)\b/i
      ],
      sound: 'dramatic.scream',
      cooldown: 2000
    },
    {
      patterns: [
        /\b(laughs?|chuckles?|giggles?)\b/i
      ],
      sound: 'dramatic.laughter',
      cooldown: 1500
    },
    {
      patterns: [
        /\b(cries?|crying|sobbing|weeps?)\b/i,
        /\btears\b.*\b(stream|fall|roll)\b/i
      ],
      sound: 'dramatic.crying',
      cooldown: 3000
    },
    {
      patterns: [/\bsighs?\b/i],
      sound: 'dramatic.sigh',
      cooldown: 2000
    }
  ];

  // Track cooldowns to prevent spam
  private lastPlayed: Map<string, number> = new Map();

  // Active location ambience
  private currentLocationAmbience: string | null = null;

  // Heartbeat tracking
  private heartbeatActive = false;

  // ═══════════════════════════════════════════════════════════
  // SOUND PLAYBACK WITH ACOUSTIC ENVIRONMENT
  // ═══════════════════════════════════════════════════════════

  async play(soundPath: string, overrideOptions: Partial<SoundEffectConfig> = {}): Promise<void> {
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
    const acousticCategories = ['combat', 'vehicles', 'dramatic', 'doors'];
    if (acousticCategories.includes(category)) return true;

    // Apply to specific loud sounds
    const loudSounds = ['gunshot', 'explosion', 'crash', 'break', 'slam', 'scream'];
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
