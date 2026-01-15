// Ambient Audio System
// Genre-appropriate background music and UI sound effects

import { GameGenre } from '@/types/genreData';

export type SoundCategory = 'ui' | 'ambient' | 'effect' | 'music';
export type UISoundType = 'click' | 'hover' | 'success' | 'error' | 'notification' | 'dice_roll' | 'level_up' | 'item_pickup' | 'save';

interface AudioTrack {
  id: string;
  url: string;
  category: SoundCategory;
  volume: number;
  loop: boolean;
}

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  ambientVolume: number;
  enabled: boolean;
}

const DEFAULT_SETTINGS: AudioSettings = {
  masterVolume: 0.7,
  musicVolume: 0.5,
  sfxVolume: 0.8,
  ambientVolume: 0.6,
  enabled: true,
};

const SETTINGS_KEY = 'untold-audio-settings';

// Genre-specific ambient descriptions (for future CDN integration)
const GENRE_AMBIENCE: Record<GameGenre, { mood: string; sounds: string[] }> = {
  fantasy: { mood: 'mystical', sounds: ['tavern', 'forest', 'castle', 'cave'] },
  scifi: { mood: 'electronic', sounds: ['spaceship', 'city', 'lab', 'void'] },
  horror: { mood: 'tense', sounds: ['wind', 'creaking', 'whispers', 'storm'] },
  mystery: { mood: 'suspenseful', sounds: ['clock', 'footsteps', 'papers', 'rain'] },
  pirate: { mood: 'adventurous', sounds: ['waves', 'ship_creak', 'seagulls', 'storm'] },
  western: { mood: 'frontier', sounds: ['desert_wind', 'saloon', 'horses', 'campfire'] },
  cyberpunk: { mood: 'synth', sounds: ['neon_hum', 'traffic', 'club', 'rain'] },
  postapoc: { mood: 'desolate', sounds: ['wind', 'debris', 'distant_thunder', 'silence'] },
  war: { mood: 'tactical', sounds: ['radio', 'vehicles', 'nature', 'base'] },
  modern_life: { mood: 'urban', sounds: ['city', 'traffic', 'cafe', 'rain'] },
  custom: { mood: 'adaptive', sounds: ['ambient', 'nature', 'interior', 'weather'] },
};

class AudioSystem {
  private context: AudioContext | null = null;
  private settings: AudioSettings = DEFAULT_SETTINGS;
  private activeTracks: Map<string, { source: AudioBufferSourceNode; gainNode: GainNode }> = new Map();
  private loadedBuffers: Map<string, AudioBuffer> = new Map();
  private initialized = false;

  constructor() {
    this.loadSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = DEFAULT_SETTINGS;
    }
  }

  saveSettings(settings: Partial<AudioSettings>): void {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // Initialize audio context (must be called after user interaction)
  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.initialized = true;
      return true;
    } catch (error) {
      console.warn('[Audio] Failed to initialize AudioContext:', error);
      return false;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Calculate final volume for a category
  private getCategoryVolume(category: SoundCategory): number {
    if (!this.settings.enabled) return 0;
    
    const master = this.settings.masterVolume;
    switch (category) {
      case 'music':
        return master * this.settings.musicVolume;
      case 'ambient':
        return master * this.settings.ambientVolume;
      case 'ui':
      case 'effect':
        return master * this.settings.sfxVolume;
      default:
        return master;
    }
  }

  // Play a one-shot sound effect
  async playSound(type: UISoundType): Promise<void> {
    if (!this.settings.enabled || !this.initialized) return;
    
    // For now, we'll use the Web Audio API to generate simple tones
    // In production, this would load actual sound files
    await this.playGeneratedSound(type);
  }

  private async playGeneratedSound(type: UISoundType): Promise<void> {
    if (!this.context) return;
    
    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);
    
    const volume = this.getCategoryVolume('ui');
    const now = this.context.currentTime;
    
    // Configure based on sound type
    switch (type) {
      case 'click':
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
        
      case 'hover':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        oscillator.start(now);
        oscillator.stop(now + 0.03);
        break;
        
      case 'success':
        oscillator.frequency.setValueAtTime(523, now); // C5
        oscillator.frequency.setValueAtTime(659, now + 0.1); // E5
        oscillator.frequency.setValueAtTime(784, now + 0.2); // G5
        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(volume * 0.4, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        oscillator.start(now);
        oscillator.stop(now + 0.4);
        break;
        
      case 'error':
        oscillator.frequency.value = 200;
        oscillator.type = 'sawtooth';
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
        
      case 'notification':
        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.setValueAtTime(1100, now + 0.1);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        oscillator.start(now);
        oscillator.stop(now + 0.25);
        break;
        
      case 'dice_roll':
        // Multiple quick tones to simulate dice
        for (let i = 0; i < 5; i++) {
          const osc = this.context.createOscillator();
          const gain = this.context.createGain();
          osc.connect(gain);
          gain.connect(this.context.destination);
          
          osc.frequency.value = 300 + Math.random() * 400;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(volume * 0.2, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.04);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.04);
        }
        return; // Early return since we handled this differently
        
      case 'level_up':
        // Ascending arpeggio
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const osc = this.context!.createOscillator();
          const gain = this.context!.createGain();
          osc.connect(gain);
          gain.connect(this.context!.destination);
          
          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(volume * 0.4, now + i * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.3);
        });
        return;
        
      case 'item_pickup':
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        oscillator.start(now);
        oscillator.stop(now + 0.15);
        break;
        
      case 'save':
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(volume * 0.2, now);
        gainNode.gain.setValueAtTime(volume * 0.2, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
    }
  }

  // Get ambient description for a genre
  getGenreAmbience(genre: GameGenre): { mood: string; sounds: string[] } {
    return GENRE_AMBIENCE[genre] || GENRE_AMBIENCE.custom;
  }

  // Stop all audio
  stopAll(): void {
    this.activeTracks.forEach((track, id) => {
      try {
        track.source.stop();
        track.gainNode.disconnect();
      } catch {
        // Ignore if already stopped
      }
    });
    this.activeTracks.clear();
  }

  // Cleanup
  destroy(): void {
    this.stopAll();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.initialized = false;
  }
}

// Singleton instance
export const audioSystem = new AudioSystem();

// React hook for audio
import { useEffect, useCallback, useState } from 'react';

export function useAudio() {
  const [isInitialized, setIsInitialized] = useState(audioSystem.isInitialized());
  const [settings, setSettings] = useState(audioSystem.getSettings());

  // Initialize on first user interaction
  const initialize = useCallback(async () => {
    const success = await audioSystem.initialize();
    setIsInitialized(success);
    return success;
  }, []);

  const playSound = useCallback((type: UISoundType) => {
    audioSystem.playSound(type);
  }, []);

  const updateSettings = useCallback((newSettings: Partial<AudioSettings>) => {
    audioSystem.saveSettings(newSettings);
    setSettings(audioSystem.getSettings());
  }, []);

  // Auto-initialize on user interaction
  useEffect(() => {
    const handleInteraction = async () => {
      if (!audioSystem.isInitialized()) {
        await initialize();
        // Remove listeners after initialization
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('keydown', handleInteraction);
      }
    };

    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('keydown', handleInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [initialize]);

  return {
    isInitialized,
    settings,
    playSound,
    updateSettings,
    initialize,
  };
}
