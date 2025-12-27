// ============================================================================
// SOUND SYSTEM TESTS
// Tests for audio engine, story sound triggers, and sound preloading
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';

// ============================================================================
// MOCK AUDIO CONTEXT
// ============================================================================

class MockGainNode {
  gain = { value: 1, linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
}

class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null;
  playbackRate = { value: 1 };
  loop = false;
  onended: (() => void) | null = null;
  connect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
}

class MockStereoPanner {
  pan = { value: 0 };
  connect = vi.fn();
}

class MockBiquadFilter {
  type: BiquadFilterType = 'lowpass';
  frequency = { value: 350 };
  connect = vi.fn();
}

class MockDelayNode {
  delayTime = { value: 0 };
  connect = vi.fn();
}

// ============================================================================
// AUDIO ENGINE TESTS
// ============================================================================

interface AudioVolumes {
  master: number;
  ambience: number;
  effects: number;
  music: number;
  ui: number;
}

type AudioChannel = 'ambience' | 'effects' | 'music' | 'ui';

// Simplified audio engine for testing
class TestableAudioEngine {
  public initialized = false;
  public muted = false;
  public volumes: AudioVolumes = {
    master: 0.8,
    ambience: 0.6,
    effects: 0.9,
    music: 0.4,
    ui: 0.5
  };
  
  private bufferCache: Map<string, { duration: number }> = new Map();
  private activeLoops: Map<string, { volume: number }> = new Map();
  private activeSources: Map<string, { soundKey: string }> = new Map();
  
  async initialize(): Promise<boolean> {
    this.initialized = true;
    return true;
  }
  
  isLoaded(soundKey: string): boolean {
    return this.bufferCache.has(soundKey);
  }
  
  loadSound(soundKey: string, duration: number = 1): void {
    this.bufferCache.set(soundKey, { duration });
  }
  
  async playSound(
    soundKey: string,
    options: { channel?: AudioChannel; volume?: number } = {}
  ): Promise<{ id: string } | null> {
    if (!this.initialized || this.muted) return null;
    if (!this.bufferCache.has(soundKey)) return null;
    
    const id = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.activeSources.set(id, { soundKey });
    return { id };
  }
  
  async playLoop(
    soundKey: string,
    options: { id?: string; volume?: number } = {}
  ): Promise<{ id: string } | null> {
    if (!this.initialized || this.muted) return null;
    if (!this.bufferCache.has(soundKey)) return null;
    
    const id = options.id || soundKey;
    this.activeLoops.set(id, { volume: options.volume || 1 });
    return { id };
  }
  
  async stopLoop(id: string): Promise<void> {
    this.activeLoops.delete(id);
  }
  
  isLoopPlaying(id: string): boolean {
    return this.activeLoops.has(id);
  }
  
  getActiveLoopCount(): number {
    return this.activeLoops.size;
  }
  
  setMasterVolume(volume: number): void {
    this.volumes.master = volume;
  }
  
  setChannelVolume(channel: AudioChannel, volume: number): void {
    this.volumes[channel] = volume;
  }
  
  mute(): void {
    this.muted = true;
  }
  
  unmute(): void {
    this.muted = false;
  }
  
  stopAll(): void {
    this.activeSources.clear();
    this.activeLoops.clear();
  }
}

describe('Audio Engine', () => {
  let engine: TestableAudioEngine;
  
  beforeEach(() => {
    engine = new TestableAudioEngine();
  });
  
  describe('initialization', () => {
    it('should start uninitialized', () => {
      expect(engine.initialized).toBe(false);
    });
    
    it('should initialize successfully', async () => {
      const result = await engine.initialize();
      expect(result).toBe(true);
      expect(engine.initialized).toBe(true);
    });
    
    it('should have default volume settings', () => {
      expect(engine.volumes.master).toBe(0.8);
      expect(engine.volumes.effects).toBe(0.9);
      expect(engine.volumes.ambience).toBe(0.6);
      expect(engine.volumes.music).toBe(0.4);
      expect(engine.volumes.ui).toBe(0.5);
    });
  });
  
  describe('sound loading', () => {
    it('should track loaded sounds', () => {
      expect(engine.isLoaded('gunshot')).toBe(false);
      engine.loadSound('gunshot', 0.5);
      expect(engine.isLoaded('gunshot')).toBe(true);
    });
    
    it('should not find unloaded sounds', () => {
      expect(engine.isLoaded('explosion')).toBe(false);
    });
  });
  
  describe('sound playback', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.loadSound('gunshot');
      engine.loadSound('footstep');
    });
    
    it('should return null when not initialized', async () => {
      const uninitEngine = new TestableAudioEngine();
      uninitEngine.loadSound('test');
      const result = await uninitEngine.playSound('test');
      expect(result).toBeNull();
    });
    
    it('should return null when muted', async () => {
      engine.mute();
      const result = await engine.playSound('gunshot');
      expect(result).toBeNull();
    });
    
    it('should return null for unloaded sounds', async () => {
      const result = await engine.playSound('nonexistent');
      expect(result).toBeNull();
    });
    
    it('should play loaded sounds', async () => {
      const result = await engine.playSound('gunshot');
      expect(result).not.toBeNull();
      expect(result?.id).toContain('sound_');
    });
  });
  
  describe('loop playback', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.loadSound('ambience_forest');
      engine.loadSound('ambience_city');
    });
    
    it('should start loops', async () => {
      const result = await engine.playLoop('ambience_forest', { id: 'forest_loop' });
      expect(result).not.toBeNull();
      expect(engine.isLoopPlaying('forest_loop')).toBe(true);
    });
    
    it('should stop loops', async () => {
      await engine.playLoop('ambience_forest', { id: 'forest_loop' });
      await engine.stopLoop('forest_loop');
      expect(engine.isLoopPlaying('forest_loop')).toBe(false);
    });
    
    it('should track multiple loops', async () => {
      await engine.playLoop('ambience_forest', { id: 'loop1' });
      await engine.playLoop('ambience_city', { id: 'loop2' });
      expect(engine.getActiveLoopCount()).toBe(2);
    });
  });
  
  describe('volume control', () => {
    beforeEach(async () => {
      await engine.initialize();
    });
    
    it('should update master volume', () => {
      engine.setMasterVolume(0.5);
      expect(engine.volumes.master).toBe(0.5);
    });
    
    it('should update channel volumes', () => {
      engine.setChannelVolume('effects', 0.7);
      expect(engine.volumes.effects).toBe(0.7);
    });
    
    it('should mute and unmute', () => {
      expect(engine.muted).toBe(false);
      engine.mute();
      expect(engine.muted).toBe(true);
      engine.unmute();
      expect(engine.muted).toBe(false);
    });
  });
  
  describe('cleanup', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.loadSound('test');
    });
    
    it('should stop all sounds and loops', async () => {
      await engine.playSound('test');
      await engine.playLoop('test', { id: 'loop1' });
      expect(engine.getActiveLoopCount()).toBe(1);
      
      engine.stopAll();
      expect(engine.getActiveLoopCount()).toBe(0);
    });
  });
});

// ============================================================================
// STORY SOUND TRIGGER TESTS
// ============================================================================

interface TextPattern {
  patterns: RegExp[];
  sound: string;
  cooldown: number;
}

// Simplified story sound trigger for testing
class TestableSoundTrigger {
  private lastPlayedTimes: Map<string, number> = new Map();
  
  private textPatterns: TextPattern[] = [
    {
      patterns: [
        /\b(fires?|shoots?|shot|fired)\b.*\b(gun|pistol|revolver)\b/i,
        /\bgunshot\b/i,
        /\bpulls?\s+the\s+trigger\b/i
      ],
      sound: 'combat.gunshot_pistol',
      cooldown: 500
    },
    {
      patterns: [
        /\b(door)\b.*\b(opens?|opening)\b/i,
        /\bopens?\s+the\s+door\b/i
      ],
      sound: 'doors.door_open',
      cooldown: 1000
    },
    {
      patterns: [
        /\bfootsteps?\b/i,
        /\b(walks?|walking)\b.*\b(toward|away|across)\b/i
      ],
      sound: 'movement.footsteps_walk',
      cooldown: 2000
    },
    {
      patterns: [
        /\bexplosion\b/i,
        /\bexplodes?\b/i,
        /\bblast\b/i
      ],
      sound: 'effects.explosion',
      cooldown: 1000
    },
    {
      patterns: [
        /\bscreams?\b/i,
        /\bshrieks?\b/i
      ],
      sound: 'dramatic.scream',
      cooldown: 3000
    }
  ];
  
  detectSoundsFromText(text: string, currentTime: number = Date.now()): string[] {
    const triggeredSounds: string[] = [];
    
    for (const pattern of this.textPatterns) {
      for (const regex of pattern.patterns) {
        if (regex.test(text)) {
          const lastPlayed = this.lastPlayedTimes.get(pattern.sound) || 0;
          if (currentTime - lastPlayed > pattern.cooldown) {
            triggeredSounds.push(pattern.sound);
            this.lastPlayedTimes.set(pattern.sound, currentTime);
            break; // Only trigger once per pattern group
          }
        }
      }
    }
    
    return triggeredSounds;
  }
  
  resetCooldowns(): void {
    this.lastPlayedTimes.clear();
  }
}

describe('Story Sound Trigger', () => {
  let trigger: TestableSoundTrigger;
  
  beforeEach(() => {
    trigger = new TestableSoundTrigger();
  });
  
  describe('text pattern detection', () => {
    it('should detect gunshot sounds', () => {
      const sounds = trigger.detectSoundsFromText('He fires his pistol at the target.');
      expect(sounds).toContain('combat.gunshot_pistol');
    });
    
    it('should detect door sounds', () => {
      const sounds = trigger.detectSoundsFromText('She opens the door slowly.');
      expect(sounds).toContain('doors.door_open');
    });
    
    it('should detect footstep sounds', () => {
      const sounds = trigger.detectSoundsFromText('Footsteps echo in the corridor.');
      expect(sounds).toContain('movement.footsteps_walk');
    });
    
    it('should detect explosion sounds', () => {
      const sounds = trigger.detectSoundsFromText('The building explodes in a massive fireball.');
      expect(sounds).toContain('effects.explosion');
    });
    
    it('should detect scream sounds', () => {
      const sounds = trigger.detectSoundsFromText('A terrifying scream pierces the night.');
      expect(sounds).toContain('dramatic.scream');
    });
    
    it('should detect multiple sounds in one text', () => {
      const sounds = trigger.detectSoundsFromText(
        'The door opens and footsteps approach. A gunshot rings out!'
      );
      expect(sounds.length).toBe(3);
      expect(sounds).toContain('doors.door_open');
      expect(sounds).toContain('movement.footsteps_walk');
      expect(sounds).toContain('combat.gunshot_pistol');
    });
    
    it('should return empty array for text without triggers', () => {
      const sounds = trigger.detectSoundsFromText('The sun set over the quiet town.');
      expect(sounds).toEqual([]);
    });
  });
  
  describe('cooldown management', () => {
    it('should respect cooldown periods', () => {
      const time1 = 1000;
      const sounds1 = trigger.detectSoundsFromText('Gunshot!', time1);
      expect(sounds1).toContain('combat.gunshot_pistol');
      
      // Too soon (within 500ms cooldown)
      const sounds2 = trigger.detectSoundsFromText('Another gunshot!', time1 + 200);
      expect(sounds2).not.toContain('combat.gunshot_pistol');
      
      // After cooldown
      const sounds3 = trigger.detectSoundsFromText('A third gunshot!', time1 + 600);
      expect(sounds3).toContain('combat.gunshot_pistol');
    });
    
    it('should track cooldowns independently per sound', () => {
      const time = 1000;
      
      trigger.detectSoundsFromText('Gunshot!', time);
      trigger.detectSoundsFromText('Door opens.', time + 100);
      
      // Gunshot still on cooldown, door still on cooldown
      const sounds = trigger.detectSoundsFromText(
        'Another gunshot and door.', 
        time + 300
      );
      expect(sounds).not.toContain('combat.gunshot_pistol');
      expect(sounds).not.toContain('doors.door_open');
      
      // Gunshot cooldown passed, door still on cooldown
      const sounds2 = trigger.detectSoundsFromText(
        'Another gunshot and door.',
        time + 600
      );
      expect(sounds2).toContain('combat.gunshot_pistol');
      expect(sounds2).not.toContain('doors.door_open');
    });
    
    it('should allow resetting cooldowns', () => {
      trigger.detectSoundsFromText('Gunshot!', 1000);
      trigger.resetCooldowns();
      
      const sounds = trigger.detectSoundsFromText('Another gunshot!', 1100);
      expect(sounds).toContain('combat.gunshot_pistol');
    });
  });
  
  describe('case insensitivity', () => {
    it('should match regardless of case', () => {
      expect(trigger.detectSoundsFromText('GUNSHOT!')).toContain('combat.gunshot_pistol');
      expect(trigger.detectSoundsFromText('Gunshot!')).toContain('combat.gunshot_pistol');
      expect(trigger.detectSoundsFromText('gunshot!')).toContain('combat.gunshot_pistol');
    });
  });
  
  describe('complex narrative matching', () => {
    it('should match compound actions', () => {
      const sounds = trigger.detectSoundsFromText(
        'Marcus pulls the trigger, and the bullet finds its mark.'
      );
      expect(sounds).toContain('combat.gunshot_pistol');
    });
    
    it('should match walking patterns', () => {
      const sounds = trigger.detectSoundsFromText(
        'She walks toward the window, her heels clicking.'
      );
      expect(sounds).toContain('movement.footsteps_walk');
    });
  });
});

// ============================================================================
// SOUND PRELOADER TESTS
// ============================================================================

interface SoundCategory {
  sounds: string[];
  priority: 'high' | 'medium' | 'low';
}

class TestableSoundPreloader {
  private categories: Map<string, SoundCategory> = new Map();
  private loadedSounds: Set<string> = new Set();
  private loadQueue: string[] = [];
  
  registerCategory(categoryId: string, sounds: string[], priority: 'high' | 'medium' | 'low'): void {
    this.categories.set(categoryId, { sounds, priority });
  }
  
  async preloadCategory(categoryId: string): Promise<number> {
    const category = this.categories.get(categoryId);
    if (!category) return 0;
    
    let loaded = 0;
    for (const sound of category.sounds) {
      if (!this.loadedSounds.has(sound)) {
        this.loadedSounds.add(sound);
        loaded++;
      }
    }
    return loaded;
  }
  
  async preloadByPriority(priority: 'high' | 'medium' | 'low'): Promise<number> {
    let totalLoaded = 0;
    for (const [categoryId, category] of this.categories) {
      if (category.priority === priority) {
        totalLoaded += await this.preloadCategory(categoryId);
      }
    }
    return totalLoaded;
  }
  
  isLoaded(soundId: string): boolean {
    return this.loadedSounds.has(soundId);
  }
  
  getCategoryCount(): number {
    return this.categories.size;
  }
  
  getLoadedCount(): number {
    return this.loadedSounds.size;
  }
  
  clearCache(): void {
    this.loadedSounds.clear();
  }
}

describe('Sound Preloader', () => {
  let preloader: TestableSoundPreloader;
  
  beforeEach(() => {
    preloader = new TestableSoundPreloader();
    
    // Register test categories
    preloader.registerCategory('combat', ['gunshot_1', 'gunshot_2', 'punch_1'], 'high');
    preloader.registerCategory('ambience', ['forest_loop', 'city_loop'], 'medium');
    preloader.registerCategory('ui', ['click', 'success'], 'low');
  });
  
  describe('category registration', () => {
    it('should register categories', () => {
      expect(preloader.getCategoryCount()).toBe(3);
    });
    
    it('should track unloaded sounds initially', () => {
      expect(preloader.isLoaded('gunshot_1')).toBe(false);
    });
  });
  
  describe('preloading', () => {
    it('should preload a category', async () => {
      const loaded = await preloader.preloadCategory('combat');
      expect(loaded).toBe(3);
      expect(preloader.isLoaded('gunshot_1')).toBe(true);
      expect(preloader.isLoaded('gunshot_2')).toBe(true);
      expect(preloader.isLoaded('punch_1')).toBe(true);
    });
    
    it('should not double-load sounds', async () => {
      await preloader.preloadCategory('combat');
      const secondLoad = await preloader.preloadCategory('combat');
      expect(secondLoad).toBe(0);
    });
    
    it('should preload by priority', async () => {
      const highLoaded = await preloader.preloadByPriority('high');
      expect(highLoaded).toBe(3);
      expect(preloader.isLoaded('gunshot_1')).toBe(true);
      expect(preloader.isLoaded('forest_loop')).toBe(false);
    });
    
    it('should return 0 for unknown category', async () => {
      const loaded = await preloader.preloadCategory('unknown');
      expect(loaded).toBe(0);
    });
  });
  
  describe('cache management', () => {
    it('should track total loaded sounds', async () => {
      await preloader.preloadCategory('combat');
      await preloader.preloadCategory('ui');
      expect(preloader.getLoadedCount()).toBe(5);
    });
    
    it('should clear cache', async () => {
      await preloader.preloadCategory('combat');
      expect(preloader.getLoadedCount()).toBe(3);
      
      preloader.clearCache();
      expect(preloader.getLoadedCount()).toBe(0);
      expect(preloader.isLoaded('gunshot_1')).toBe(false);
    });
  });
});

// ============================================================================
// ACOUSTIC ENVIRONMENT TESTS
// ============================================================================

interface AcousticProfile {
  reverbLevel: number;
  echoDelay: number;
  echoDecay: number;
  lowpassFreq: number | null;
  roomSize: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'outdoor';
}

class TestableAcousticEnvironment {
  private profiles: Map<string, AcousticProfile> = new Map([
    ['indoor_small', { 
      reverbLevel: 0.3, 
      echoDelay: 0.1, 
      echoDecay: 0.2, 
      lowpassFreq: null, 
      roomSize: 'small' 
    }],
    ['indoor_large', { 
      reverbLevel: 0.6, 
      echoDelay: 0.4, 
      echoDecay: 0.5, 
      lowpassFreq: null, 
      roomSize: 'large' 
    }],
    ['outdoor', { 
      reverbLevel: 0.1, 
      echoDelay: 0.8, 
      echoDecay: 0.3, 
      lowpassFreq: null, 
      roomSize: 'outdoor' 
    }],
    ['cave', { 
      reverbLevel: 0.8, 
      echoDelay: 0.6, 
      echoDecay: 0.7, 
      lowpassFreq: 2000, 
      roomSize: 'huge' 
    }],
    ['underwater', { 
      reverbLevel: 0.5, 
      echoDelay: 0.2, 
      echoDecay: 0.4, 
      lowpassFreq: 800, 
      roomSize: 'medium' 
    }]
  ]);
  
  private currentProfile: string = 'indoor_small';
  
  setEnvironment(environmentId: string): boolean {
    if (this.profiles.has(environmentId)) {
      this.currentProfile = environmentId;
      return true;
    }
    return false;
  }
  
  getCurrentProfile(): AcousticProfile | undefined {
    return this.profiles.get(this.currentProfile);
  }
  
  getEnvironmentId(): string {
    return this.currentProfile;
  }
  
  getReverbLevel(): number {
    return this.getCurrentProfile()?.reverbLevel || 0;
  }
  
  getEchoSettings(): { delay: number; decay: number } {
    const profile = this.getCurrentProfile();
    return {
      delay: profile?.echoDelay || 0,
      decay: profile?.echoDecay || 0
    };
  }
  
  getLowpassFreq(): number | null {
    return this.getCurrentProfile()?.lowpassFreq || null;
  }
}

describe('Acoustic Environment System', () => {
  let acoustics: TestableAcousticEnvironment;
  
  beforeEach(() => {
    acoustics = new TestableAcousticEnvironment();
  });
  
  describe('environment switching', () => {
    it('should default to indoor_small', () => {
      expect(acoustics.getEnvironmentId()).toBe('indoor_small');
    });
    
    it('should switch to valid environments', () => {
      expect(acoustics.setEnvironment('cave')).toBe(true);
      expect(acoustics.getEnvironmentId()).toBe('cave');
    });
    
    it('should reject invalid environments', () => {
      expect(acoustics.setEnvironment('invalid')).toBe(false);
      expect(acoustics.getEnvironmentId()).toBe('indoor_small');
    });
  });
  
  describe('acoustic properties', () => {
    it('should return correct reverb levels', () => {
      acoustics.setEnvironment('cave');
      expect(acoustics.getReverbLevel()).toBe(0.8);
      
      acoustics.setEnvironment('outdoor');
      expect(acoustics.getReverbLevel()).toBe(0.1);
    });
    
    it('should return correct echo settings', () => {
      acoustics.setEnvironment('indoor_large');
      const echo = acoustics.getEchoSettings();
      expect(echo.delay).toBe(0.4);
      expect(echo.decay).toBe(0.5);
    });
    
    it('should return lowpass for muffled environments', () => {
      acoustics.setEnvironment('underwater');
      expect(acoustics.getLowpassFreq()).toBe(800);
      
      acoustics.setEnvironment('outdoor');
      expect(acoustics.getLowpassFreq()).toBeNull();
    });
  });
  
  describe('gameplay scenarios', () => {
    it('scenario: entering a cave should change acoustics', () => {
      // Player is outdoors
      acoustics.setEnvironment('outdoor');
      expect(acoustics.getReverbLevel()).toBeLessThan(0.2);
      
      // Player enters cave
      acoustics.setEnvironment('cave');
      expect(acoustics.getReverbLevel()).toBeGreaterThan(0.7);
      expect(acoustics.getEchoSettings().decay).toBeGreaterThan(0.5);
    });
    
    it('scenario: gunshot should sound different in different environments', () => {
      // Gunshot in small room - short echo
      acoustics.setEnvironment('indoor_small');
      const smallRoomEcho = acoustics.getEchoSettings();
      
      // Gunshot in large hall - longer echo
      acoustics.setEnvironment('indoor_large');
      const largeRoomEcho = acoustics.getEchoSettings();
      
      expect(largeRoomEcho.delay).toBeGreaterThan(smallRoomEcho.delay);
      expect(largeRoomEcho.decay).toBeGreaterThan(smallRoomEcho.decay);
    });
  });
});
