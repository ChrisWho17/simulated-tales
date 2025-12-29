// Sound Preloader - Loads cached sounds from Supabase storage on game start
import { supabase } from '@/integrations/supabase/client';
import { audioEngine } from './audioEngine';
import { findMappingForSound, type GeneratedSoundMapping } from './generatedSoundMappings';

export interface CachedSound {
  id: string;
  category: string;
  filename: string;
  public_url: string;
  prompt: string;
  duration_seconds: number | null;
  // Mapped audio settings from generatedSoundMappings
  mapping?: GeneratedSoundMapping;
}

export interface PreloadProgress {
  total: number;
  loaded: number;
  failed: number;
  currentCategory: string;
  isComplete: boolean;
}

type ProgressCallback = (progress: PreloadProgress) => void;

class SoundPreloader {
  private loadedSounds: Map<string, CachedSound> = new Map();
  private isLoading = false;
  private isPreloaded = false;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private priorityCategories = [
    // Weather sounds - load first for atmosphere
    'weather_clear', 'weather_rain', 'weather_storm', 'weather_wind', 'weather_snow', 'weather_fog', 'weather_hail',
    // UI & feedback sounds
    'ui_buttons', 'ui_equip', 'ui_inventory', 'ui_resources',
    // Fallback to generic categories
    'weather', 'ui', 'ambience'
  ];

  /**
   * Fetch all available sounds from Supabase
   */
  async fetchAvailableSounds(): Promise<CachedSound[]> {
    const { data, error } = await supabase
      .from('generated_sounds')
      .select('id, category, filename, public_url, prompt, duration_seconds')
      .order('category');

    if (error) {
      console.error('[SoundPreloader] Failed to fetch sounds:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get sounds organized by category
   */
  async getSoundsByCategory(): Promise<Record<string, CachedSound[]>> {
    const sounds = await this.fetchAvailableSounds();
    const byCategory: Record<string, CachedSound[]> = {};

    for (const sound of sounds) {
      if (!byCategory[sound.category]) {
        byCategory[sound.category] = [];
      }
      byCategory[sound.category].push(sound);
    }

    return byCategory;
  }

  /**
   * Subscribe to preload progress updates
   */
  onProgress(callback: ProgressCallback): () => void {
    this.progressCallbacks.add(callback);
    return () => this.progressCallbacks.delete(callback);
  }

  private notifyProgress(progress: PreloadProgress) {
    this.progressCallbacks.forEach(cb => cb(progress));
  }

  /**
   * Preload all sounds from storage into the audio engine
   */
  async preloadAll(options?: { 
    priorityOnly?: boolean;
    categories?: string[];
    maxConcurrent?: number;
  }): Promise<{ loaded: number; failed: number }> {
    if (this.isLoading) {
      console.warn('[SoundPreloader] Already loading sounds');
      return { loaded: 0, failed: 0 };
    }

    this.isLoading = true;
    const maxConcurrent = options?.maxConcurrent || 5;
    
    try {
      const allSounds = await this.fetchAvailableSounds();
      
      // Filter by categories if specified
      let soundsToLoad = allSounds;
      if (options?.categories) {
        soundsToLoad = allSounds.filter(s => 
          options.categories!.some(cat => s.category.includes(cat))
        );
      } else if (options?.priorityOnly) {
        soundsToLoad = allSounds.filter(s =>
          this.priorityCategories.some(cat => s.category.includes(cat))
        );
      }

      console.log(`[SoundPreloader] Loading ${soundsToLoad.length} sounds...`);

      let loaded = 0;
      let failed = 0;
      
      // Process in batches for better performance
      for (let i = 0; i < soundsToLoad.length; i += maxConcurrent) {
        const batch = soundsToLoad.slice(i, i + maxConcurrent);
        const currentCategory = batch[0]?.category || 'unknown';
        
        this.notifyProgress({
          total: soundsToLoad.length,
          loaded,
          failed,
          currentCategory,
          isComplete: false
        });

        const results = await Promise.allSettled(
          batch.map(sound => this.loadSound(sound))
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value) {
            loaded++;
          } else {
            failed++;
          }
        }
      }

      this.isPreloaded = true;
      
      this.notifyProgress({
        total: soundsToLoad.length,
        loaded,
        failed,
        currentCategory: 'complete',
        isComplete: true
      });

      console.log(`[SoundPreloader] Complete: ${loaded} loaded, ${failed} failed`);
      return { loaded, failed };

    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load a single sound into the audio engine
   */
  private async loadSound(sound: CachedSound): Promise<boolean> {
    try {
      // Create a unique key for this sound
      const soundKey = this.getSoundKey(sound);
      
      // Skip if already loaded
      if (audioEngine.isLoaded(soundKey)) {
        this.loadedSounds.set(soundKey, sound);
        return true;
      }

      // Find and attach the mapping for this sound
      const mapping = findMappingForSound(sound.category, sound.filename);
      if (mapping) {
        sound.mapping = mapping;
      }

      // Load into audio engine
      await audioEngine.loadAudio(sound.public_url, soundKey);
      this.loadedSounds.set(soundKey, sound);
      
      return true;
    } catch (error) {
      console.warn(`[SoundPreloader] Failed to load ${sound.filename}:`, error);
      return false;
    }
  }

  /**
   * Generate a consistent key for a sound
   * The filename already contains the path (e.g., "weather_rain/rain_light_loop")
   * so we just use filename directly as the key
   */
  getSoundKey(sound: CachedSound | { category: string; filename: string }): string {
    // If filename already contains a path separator, use it directly
    if (sound.filename.includes('/')) {
      return sound.filename;
    }
    // Otherwise construct from category/filename
    return `${sound.category}/${sound.filename}`;
  }

  /**
   * Get a random sound from a category
   */
  getRandomFromCategory(category: string): CachedSound | null {
    const matches = Array.from(this.loadedSounds.values())
      .filter(s => s.category === category || s.category.startsWith(category) || category.startsWith(s.category));
    
    if (matches.length === 0) {
      return null;
    }
    
    return matches[Math.floor(Math.random() * matches.length)];
  }

  /**
   * Find sounds matching a search term
   */
  findSounds(searchTerm: string): CachedSound[] {
    const term = searchTerm.toLowerCase();
    return Array.from(this.loadedSounds.values())
      .filter(s => 
        s.category.toLowerCase().includes(term) ||
        s.filename.toLowerCase().includes(term) ||
        s.prompt.toLowerCase().includes(term)
      );
  }

  /**
   * Get all loaded sound categories
   */
  getLoadedCategories(): string[] {
    const categories = new Set<string>();
    this.loadedSounds.forEach(s => categories.add(s.category));
    return Array.from(categories).sort();
  }

  /**
   * Check if sounds have been preloaded
   */
  isReady(): boolean {
    return this.isPreloaded;
  }

  /**
   * Get count of loaded sounds
   */
  getLoadedCount(): number {
    return this.loadedSounds.size;
  }

  /**
   * Get a sound by its key
   */
  getSound(soundKey: string): CachedSound | null {
    return this.loadedSounds.get(soundKey) || null;
  }

  /**
   * Get all loaded sounds
   */
  getAllSounds(): CachedSound[] {
    return Array.from(this.loadedSounds.values());
  }

  /**
   * Play a sound by category (picks random variation) with proper mapping volumes
   */
  async playFromCategory(
    category: string, 
    options?: { volume?: number; pitch?: number }
  ): Promise<boolean> {
    const sound = this.getRandomFromCategory(category);
    if (!sound) {
      return false;
    }

    const soundKey = this.getSoundKey(sound);
    const mapping = sound.mapping;
    
    // Use mapping volume if available, otherwise use subtle default (0.2)
    const baseVolume = mapping?.volume ?? 0.2;
    const finalVolume = (options?.volume ?? 1) * baseVolume;
    
    try {
      await audioEngine.playSound(soundKey, {
        channel: mapping?.channel ?? 'effects',
        volume: finalVolume,
        pitch: options?.pitch ?? 1,
        echo: mapping?.echo,
        echoDelay: mapping?.echoDelay,
        echoDecay: mapping?.echoDecay,
        lowpass: mapping?.lowpass
      });
      return true;
    } catch (error) {
      console.warn(`[SoundPreloader] Failed to play ${soundKey}:`, error);
      return false;
    }
  }

  /**
   * Play a specific sound by its key with proper mapping volumes
   */
  async playSound(
    soundKey: string,
    options?: { volume?: number; pitch?: number }
  ): Promise<boolean> {
    const sound = this.loadedSounds.get(soundKey);
    if (!sound) {
      return false;
    }

    const mapping = sound.mapping;
    
    // Use mapping volume if available, otherwise use subtle default (0.2)
    const baseVolume = mapping?.volume ?? 0.2;
    const finalVolume = (options?.volume ?? 1) * baseVolume;
    
    try {
      if (mapping?.loop) {
        await audioEngine.playLoop(soundKey, {
          channel: mapping.channel,
          volume: finalVolume,
          fadeIn: mapping.fadeIn ?? 2,
          lowpass: mapping.lowpass
        });
      } else {
        await audioEngine.playSound(soundKey, {
          channel: mapping?.channel ?? 'effects',
          volume: finalVolume,
          pitch: options?.pitch ?? 1,
          echo: mapping?.echo,
          echoDelay: mapping?.echoDelay,
          echoDecay: mapping?.echoDecay,
          lowpass: mapping?.lowpass
        });
      }
      return true;
    } catch (error) {
      console.warn(`[SoundPreloader] Failed to play ${soundKey}:`, error);
      return false;
    }
  }

  /**
   * Play a weather sound based on condition
   */
  async playWeatherSound(condition: string): Promise<boolean> {
    const sounds = this.findSounds(condition);
    if (sounds.length === 0) {
      // Try partial match
      const partialMatches = Array.from(this.loadedSounds.values())
        .filter(s => s.category.startsWith('weather_'));
      
      if (partialMatches.length === 0) return false;
      
      const sound = partialMatches[Math.floor(Math.random() * partialMatches.length)];
      return this.playSound(this.getSoundKey(sound));
    }
    
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    return this.playSound(this.getSoundKey(sound));
  }

  /**
   * Clear all preloaded sounds
   */
  clear() {
    this.loadedSounds.clear();
    this.isPreloaded = false;
  }
}

// Singleton instance
export const soundPreloader = new SoundPreloader();
