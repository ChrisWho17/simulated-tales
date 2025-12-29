// Core Audio Engine using Web Audio API for rich, layered sound

export interface AudioEngineState {
  initialized: boolean;
  muted: boolean;
  volumes: AudioVolumes;
  unlocked: boolean;
}

export interface AudioVolumes {
  master: number;
  ambience: number;
  weather: number;
  effects: number;
  voice: number;
  dramatic: number;
  music: number;
  ui: number;
}

export type AudioChannel = keyof Omit<AudioVolumes, 'master'>;

interface LoopReference {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  targetVolume: number;
  setVolume?: (vol: number, duration?: number) => void;
  stop?: (fadeOut?: number) => void;
}

interface PlaybackResult {
  id: string;
  source?: AudioBufferSourceNode;
  setVolume?: (vol: number, duration?: number) => void;
  stop?: (fadeOut?: number) => void;
}

class GameAudioEngine {
  // Audio context (created on first user interaction)
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Channel gains for mixing (7-channel system with ducking behavior)
  private channels: Record<AudioChannel, GainNode | null> = {
    ambience: null,
    weather: null,
    effects: null,
    voice: null,
    dramatic: null,
    music: null,
    ui: null
  };
  
  // Volume settings (0-1) with proper gain staging
  // All channels set to subtle levels - noticeable but not intrusive
  public volumes: AudioVolumes = {
    master: 0.5,
    ambience: 0.20,
    weather: 0.25,
    effects: 0.25,
    voice: 0.40,
    dramatic: 0.20,
    music: 0.20,
    ui: 0.25
  };
  
  // Active audio sources
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private activeLoops: Map<string, LoopReference> = new Map();
  
  // Loaded audio buffers (cache)
  private bufferCache: Map<string, AudioBuffer> = new Map();
  
  // State
  public initialized = false;
  public muted = false;
  public unlocked = false; // Track if audio is unlocked by user interaction
  
  // Listeners for state changes
  private listeners: Array<(state: AudioEngineState) => void> = [];
  
  // Pending sounds to play after unlock
  private pendingUnlockCallbacks: Array<() => void> = [];
  
  constructor() {
    this.setupUnlockListeners();
  }
  
  // ═══════════════════════════════════════════════════════════
  // AUTOPLAY UNLOCK - Critical for Chrome/Safari
  // ═══════════════════════════════════════════════════════════
  
  private setupUnlockListeners(): void {
    if (typeof window === 'undefined') return;
    
    const unlock = async () => {
      if (this.unlocked) return;
      
      try {
        // Initialize if not already done
        if (!this.initialized) {
          await this.initialize();
        }
        
        // Resume context if suspended
        if (this.context?.state === 'suspended') {
          await this.context.resume();
        }
        
        // Play a silent buffer to fully unlock
        if (this.context) {
          const silentBuffer = this.context.createBuffer(1, 1, 22050);
          const source = this.context.createBufferSource();
          source.buffer = silentBuffer;
          source.connect(this.context.destination);
          source.start(0);
        }
        
        this.unlocked = true;
        console.log('🔊 Audio unlocked!');
        this.notifyListeners();
        
        // Execute any pending callbacks
        for (const callback of this.pendingUnlockCallbacks) {
          try {
            callback();
          } catch (e) {
            console.error('Pending audio callback error:', e);
          }
        }
        this.pendingUnlockCallbacks = [];
        
        // Remove listeners after unlock
        document.removeEventListener('click', unlock);
        document.removeEventListener('touchstart', unlock);
        document.removeEventListener('touchend', unlock);
        document.removeEventListener('keydown', unlock);
        document.removeEventListener('mousedown', unlock);
      } catch (e) {
        console.warn('Audio unlock failed:', e);
      }
    };
    
    // Add multiple event listeners for unlock
    document.addEventListener('click', unlock, { once: false, passive: true });
    document.addEventListener('touchstart', unlock, { once: false, passive: true });
    document.addEventListener('touchend', unlock, { once: false, passive: true });
    document.addEventListener('keydown', unlock, { once: false, passive: true });
    document.addEventListener('mousedown', unlock, { once: false, passive: true });
    
    console.log('🔇 Audio engine waiting for user interaction to unlock');
  }
  
  // Queue a callback to run after audio is unlocked
  onUnlock(callback: () => void): void {
    if (this.unlocked) {
      callback();
    } else {
      this.pendingUnlockCallbacks.push(callback);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Create audio context
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.volumes.master;
      this.masterGain.connect(this.context.destination);

      // Create channel gains
      for (const channel of Object.keys(this.channels) as AudioChannel[]) {
        const gain = this.context.createGain();
        gain.gain.value = this.volumes[channel];
        gain.connect(this.masterGain);
        this.channels[channel] = gain;
      }

      // Resume context if suspended (browser autoplay policy)
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }

      this.initialized = true;
      console.log('Audio engine initialized');
      this.notifyListeners();

      return true;
    } catch (e) {
      console.error('Failed to initialize audio engine:', e);
      return false;
    }
  }

  // Ensure context is running (call on user interaction)
  async ensureContext(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AUDIO LOADING
  // ═══════════════════════════════════════════════════════════

  async loadAudio(url: string, cacheKey: string | null = null): Promise<AudioBuffer | null> {
    const key = cacheKey || url;

    // Check cache first
    if (this.bufferCache.has(key)) {
      return this.bufferCache.get(key)!;
    }

    // Ensure context exists
    if (!this.context) {
      await this.initialize();
    }

    if (!this.context) {
      console.error('[AudioEngine] No audio context available');
      return null;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.error(`[AudioEngine] Failed to fetch audio: ${url} (${response.status})`);
        return null;
      }
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      // Cache the buffer
      this.bufferCache.set(key, audioBuffer);

      return audioBuffer;
    } catch (e) {
      console.error(`[AudioEngine] Failed to load audio: ${url}`, e);
      return null;
    }
  }

  // Preload multiple audio files
  async preloadSounds(soundMap: Record<string, string>): Promise<void> {
    const promises: Promise<AudioBuffer | null>[] = [];

    for (const [key, url] of Object.entries(soundMap)) {
      promises.push(this.loadAudio(url, key));
    }

    await Promise.all(promises);
    console.log(`Preloaded ${promises.length} sounds`);
  }

  // Check if a sound is loaded
  isLoaded(soundKey: string): boolean {
    return this.bufferCache.has(soundKey);
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYBACK - ONE SHOTS
  // ═══════════════════════════════════════════════════════════

  async playSound(
    soundKey: string,
    options: {
      channel?: AudioChannel;
      volume?: number;
      pitch?: number;
      pan?: number;
      delay?: number;
      echo?: boolean;
      echoDelay?: number;
      echoDecay?: number;
      reverb?: boolean;
      reverbDuration?: number;
      lowpass?: number | null;
      highpass?: number | null;
      onEnded?: () => void;
    } = {}
  ): Promise<PlaybackResult | null> {
    if (!this.initialized || this.muted || !this.context) return null;
    
    // Check if audio is unlocked
    if (!this.unlocked) {
      console.warn('Audio not unlocked yet - waiting for user interaction');
      return null;
    }

    const {
      channel = 'effects',
      volume = 1,
      pitch = 1,
      pan = 0,
      delay = 0,
      echo = false,
      echoDelay = 0.3,
      echoDecay = 0.4,
      lowpass = null,
      highpass = null,
      onEnded = null
    } = options;

    // Get buffer
    let buffer = this.bufferCache.get(soundKey);
    if (!buffer) {
      // Don't spam console - just return null for missing sounds
      // This is expected during preload or for sounds that don't exist
      return null;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;

    // Build audio chain
    let currentNode: AudioNode = source;

    // Gain node for volume
    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // Panner for stereo positioning
    if (pan !== 0) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = pan;
      currentNode.connect(panner);
      currentNode = panner;
    }

    // Lowpass filter (muffled/distant sounds)
    if (lowpass) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      currentNode.connect(filter);
      currentNode = filter;
    }

    // Highpass filter
    if (highpass) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = highpass;
      currentNode.connect(filter);
      currentNode = filter;
    }

    // Echo effect
    if (echo) {
      const delayNode = this.context.createDelay(2);
      delayNode.delayTime.value = echoDelay;

      const feedbackGain = this.context.createGain();
      feedbackGain.gain.value = echoDecay;

      // Connect echo loop
      currentNode.connect(delayNode);
      delayNode.connect(feedbackGain);
      feedbackGain.connect(delayNode);
      delayNode.connect(this.channels[channel]!);
    }

    // Connect to channel
    currentNode.connect(this.channels[channel]!);

    // Track the source
    const sourceId = `sound_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    this.activeSources.set(sourceId, source);

    // Cleanup on end
    source.onended = () => {
      this.activeSources.delete(sourceId);
      onEnded?.();
    };

    // Start playback
    source.start(this.context.currentTime + delay);

    return {
      id: sourceId,
      source
    };
  }

  // ═══════════════════════════════════════════════════════════
  // PLAYBACK - LOOPS
  // ═══════════════════════════════════════════════════════════

  async playLoop(
    soundKey: string,
    options: {
      channel?: AudioChannel;
      volume?: number;
      fadeIn?: number;
      pan?: number;
      lowpass?: number | null;
      id?: string;
    } = {}
  ): Promise<PlaybackResult | null> {
    if (!this.initialized || this.muted || !this.context) return null;
    
    // Check if audio is unlocked
    if (!this.unlocked) {
      console.warn('Audio not unlocked yet - waiting for user interaction');
      return null;
    }

    const {
      channel = 'ambience',
      volume = 1,
      fadeIn = 2,
      pan = 0,
      lowpass = null,
      id = soundKey
    } = options;

    // Stop existing loop with same ID
    if (this.activeLoops.has(id)) {
      await this.stopLoop(id, { fadeOut: 0.5 });
    }

    const buffer = this.bufferCache.get(soundKey);
    if (!buffer) {
      // Silent return - sound may not be preloaded yet
      return null;
    }

    // Create source
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Create gain for fade control
    const gainNode = this.context.createGain();
    gainNode.gain.value = 0; // Start silent for fade in

    // Build chain
    let currentNode: AudioNode = source;
    currentNode.connect(gainNode);
    currentNode = gainNode;

    // Panner
    if (pan !== 0) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = pan;
      currentNode.connect(panner);
      currentNode = panner;
    }

    // Lowpass
    if (lowpass) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass;
      currentNode.connect(filter);
      currentNode = filter;
    }

    // Connect to channel
    currentNode.connect(this.channels[channel]!);

    const loopRef: LoopReference = {
      source,
      gainNode,
      targetVolume: volume
    };

    // Store loop reference
    this.activeLoops.set(id, loopRef);

    // Start and fade in
    source.start();
    gainNode.gain.linearRampToValueAtTime(volume, this.context.currentTime + fadeIn);

    return {
      id,
      setVolume: (vol: number, duration = 1) => {
        const loop = this.activeLoops.get(id);
        if (loop && this.context) {
          loop.targetVolume = vol;
          loop.gainNode.gain.linearRampToValueAtTime(vol, this.context.currentTime + duration);
        }
      },
      stop: (fadeOut = 2) => this.stopLoop(id, { fadeOut })
    };
  }

  // Stop a loop with fade out
  async stopLoop(id: string, options: { fadeOut?: number } = {}): Promise<void> {
    const { fadeOut = 2 } = options;

    const loop = this.activeLoops.get(id);
    if (!loop || !this.context) return;

    // Fade out
    loop.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeOut);

    // Stop after fade
    setTimeout(() => {
      try {
        loop.source.stop();
      } catch (e) {
        // Already stopped
      }
      this.activeLoops.delete(id);
    }, fadeOut * 1000);
  }

  // Stop all loops
  async stopAllLoops(fadeOut = 2): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const id of this.activeLoops.keys()) {
      promises.push(this.stopLoop(id, { fadeOut }));
    }
    await Promise.all(promises);
  }

  // ═══════════════════════════════════════════════════════════
  // VOLUME CONTROL
  // ═══════════════════════════════════════════════════════════

  setMasterVolume(volume: number, duration = 0.5): void {
    this.volumes.master = volume;
    if (this.masterGain && this.context) {
      this.masterGain.gain.linearRampToValueAtTime(volume, this.context.currentTime + duration);
    }
    this.notifyListeners();
  }

  setChannelVolume(channel: AudioChannel, volume: number, duration = 0.5): void {
    this.volumes[channel] = volume;
    if (this.channels[channel] && this.context) {
      this.channels[channel]!.gain.linearRampToValueAtTime(volume, this.context.currentTime + duration);
    }
    this.notifyListeners();
  }

  mute(): void {
    this.muted = true;
    this.setMasterVolume(0, 0.3);
  }

  unmute(): void {
    this.muted = false;
    this.setMasterVolume(this.volumes.master, 0.3);
  }

  toggleMute(): boolean {
    if (this.muted) {
      this.unmute();
    } else {
      this.mute();
    }
    return this.muted;
  }

  // ═══════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  getState(): AudioEngineState {
    return {
      initialized: this.initialized,
      muted: this.muted,
      volumes: { ...this.volumes },
      unlocked: this.unlocked
    };
  }

  subscribe(callback: (state: AudioEngineState) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (e) {
        console.error('Audio listener error:', e);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════════

  stopAll(): void {
    // Stop all one-shots
    for (const [, source] of this.activeSources) {
      try {
        source.stop();
      } catch (e) {
        // Already stopped
      }
    }
    this.activeSources.clear();

    // Stop all loops immediately
    for (const [, loop] of this.activeLoops) {
      try {
        loop.source.stop();
      } catch (e) {
        // Already stopped
      }
    }
    this.activeLoops.clear();
  }

  // Check if a loop is playing
  isLoopPlaying(id: string): boolean {
    return this.activeLoops.has(id);
  }

  // Get active loop IDs
  getActiveLoops(): string[] {
    return Array.from(this.activeLoops.keys());
  }
}

// Singleton instance
export const audioEngine = new GameAudioEngine();
