// Sound Preloader - Loads cached sounds from Supabase storage on game start
import { supabase } from '@/integrations/supabase/client';
import { audioEngine } from './audioEngine';

export interface CachedSound {
  id: string;
  category: string;
  filename: string;
  public_url: string;
  prompt: string;
  duration_seconds: number | null;
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
    // Combat & action sounds - load first
    'combat', 'gun', 'explosion',
    // UI & feedback sounds
    'ui', 'notification',
    // Common ambient
    'footsteps', 'door',
    // Environment
    'weather', 'ambience'
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
   */
  getSoundKey(sound: CachedSound | { category: string; filename: string }): string {
    return `${sound.category}/${sound.filename}`;
  }

  /**
   * Get a random sound from a category
   */
  getRandomFromCategory(category: string): CachedSound | null {
    const matches = Array.from(this.loadedSounds.values())
      .filter(s => s.category === category || s.category.startsWith(category));
    
    if (matches.length === 0) return null;
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
   * Play a sound by category (picks random variation)
   */
  async playFromCategory(
    category: string, 
    options?: { volume?: number; pitch?: number }
  ): Promise<boolean> {
    const sound = this.getRandomFromCategory(category);
    if (!sound) {
      console.warn(`[SoundPreloader] No sounds found for category: ${category}`);
      return false;
    }

    const soundKey = this.getSoundKey(sound);
    
    try {
      await audioEngine.playSound(soundKey, {
        channel: 'effects',
        volume: options?.volume ?? 1,
        pitch: options?.pitch ?? 1
      });
      return true;
    } catch (error) {
      console.warn(`[SoundPreloader] Failed to play ${soundKey}:`, error);
      return false;
    }
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
