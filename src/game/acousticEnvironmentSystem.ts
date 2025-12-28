// Acoustic Environment System - Automatically selects indoor reverb vs outdoor echo variants
// Based on current location context in the story

export type AcousticSpace = 'indoor' | 'outdoor' | 'underground' | 'underwater';

export interface LocationAcoustics {
  space: AcousticSpace;
  reverbLevel: number;      // 0-1: Amount of reverb (higher = more enclosed)
  echoLevel: number;        // 0-1: Amount of echo (higher = more open)
  lowpassFilter: number | null;  // Frequency cutoff for muffled sounds
  highpassFilter: number | null; // Frequency cutoff for thin sounds
}

// Location type to acoustic profile mapping
const LOCATION_ACOUSTICS: Record<string, LocationAcoustics> = {
  // === INDOOR LOCATIONS (reverb) ===
  tavern: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  bar: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  pub: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  inn: { space: 'indoor', reverbLevel: 0.5, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  house: { space: 'indoor', reverbLevel: 0.3, echoLevel: 0.05, lowpassFilter: null, highpassFilter: null },
  apartment: { space: 'indoor', reverbLevel: 0.3, echoLevel: 0.05, lowpassFilter: null, highpassFilter: null },
  office: { space: 'indoor', reverbLevel: 0.35, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  warehouse: { space: 'indoor', reverbLevel: 0.7, echoLevel: 0.2, lowpassFilter: null, highpassFilter: null },
  factory: { space: 'indoor', reverbLevel: 0.6, echoLevel: 0.2, lowpassFilter: null, highpassFilter: null },
  hangar: { space: 'indoor', reverbLevel: 0.8, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  church: { space: 'indoor', reverbLevel: 0.9, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  cathedral: { space: 'indoor', reverbLevel: 1.0, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  temple: { space: 'indoor', reverbLevel: 0.85, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  castle: { space: 'indoor', reverbLevel: 0.75, echoLevel: 0.25, lowpassFilter: null, highpassFilter: null },
  throne_room: { space: 'indoor', reverbLevel: 0.85, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  great_hall: { space: 'indoor', reverbLevel: 0.9, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  corridor: { space: 'indoor', reverbLevel: 0.6, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  hallway: { space: 'indoor', reverbLevel: 0.6, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  tunnel: { space: 'indoor', reverbLevel: 0.7, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  bathroom: { space: 'indoor', reverbLevel: 0.5, echoLevel: 0.15, lowpassFilter: null, highpassFilter: null },
  kitchen: { space: 'indoor', reverbLevel: 0.35, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  bedroom: { space: 'indoor', reverbLevel: 0.2, echoLevel: 0.05, lowpassFilter: null, highpassFilter: null },
  basement: { space: 'indoor', reverbLevel: 0.5, echoLevel: 0.15, lowpassFilter: 8000, highpassFilter: null },
  attic: { space: 'indoor', reverbLevel: 0.3, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  library: { space: 'indoor', reverbLevel: 0.25, echoLevel: 0.05, lowpassFilter: null, highpassFilter: null },
  laboratory: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.15, lowpassFilter: null, highpassFilter: null },
  hospital: { space: 'indoor', reverbLevel: 0.5, echoLevel: 0.2, lowpassFilter: null, highpassFilter: null },
  prison: { space: 'indoor', reverbLevel: 0.65, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  cell: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.2, lowpassFilter: null, highpassFilter: null },
  bunker: { space: 'indoor', reverbLevel: 0.55, echoLevel: 0.2, lowpassFilter: 6000, highpassFilter: null },
  spaceship: { space: 'indoor', reverbLevel: 0.3, echoLevel: 0.1, lowpassFilter: null, highpassFilter: 200 },
  space_station: { space: 'indoor', reverbLevel: 0.45, echoLevel: 0.15, lowpassFilter: null, highpassFilter: 150 },
  cockpit: { space: 'indoor', reverbLevel: 0.2, echoLevel: 0.05, lowpassFilter: null, highpassFilter: null },
  ship_cabin: { space: 'indoor', reverbLevel: 0.35, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  ship_hold: { space: 'indoor', reverbLevel: 0.6, echoLevel: 0.2, lowpassFilter: null, highpassFilter: null },
  
  // === UNDERGROUND LOCATIONS (heavy reverb) ===
  cave: { space: 'underground', reverbLevel: 0.8, echoLevel: 0.5, lowpassFilter: 4000, highpassFilter: null },
  cavern: { space: 'underground', reverbLevel: 0.95, echoLevel: 0.6, lowpassFilter: 3500, highpassFilter: null },
  dungeon: { space: 'underground', reverbLevel: 0.7, echoLevel: 0.4, lowpassFilter: 5000, highpassFilter: null },
  crypt: { space: 'underground', reverbLevel: 0.65, echoLevel: 0.35, lowpassFilter: 5000, highpassFilter: null },
  tomb: { space: 'underground', reverbLevel: 0.6, echoLevel: 0.3, lowpassFilter: 5500, highpassFilter: null },
  mine: { space: 'underground', reverbLevel: 0.75, echoLevel: 0.45, lowpassFilter: 4500, highpassFilter: null },
  sewer: { space: 'underground', reverbLevel: 0.7, echoLevel: 0.4, lowpassFilter: 4000, highpassFilter: null },
  subway: { space: 'underground', reverbLevel: 0.65, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  underground: { space: 'underground', reverbLevel: 0.7, echoLevel: 0.4, lowpassFilter: 4500, highpassFilter: null },
  
  // === OUTDOOR LOCATIONS (echo, no reverb) ===
  forest: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  woods: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  jungle: { space: 'outdoor', reverbLevel: 0.15, echoLevel: 0.25, lowpassFilter: null, highpassFilter: null },
  meadow: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  field: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  plains: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.6, lowpassFilter: null, highpassFilter: null },
  desert: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.7, lowpassFilter: null, highpassFilter: null },
  beach: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  coast: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  mountain: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.9, lowpassFilter: null, highpassFilter: null },
  canyon: { space: 'outdoor', reverbLevel: 0.2, echoLevel: 1.0, lowpassFilter: null, highpassFilter: null },
  valley: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.7, lowpassFilter: null, highpassFilter: null },
  cliff: { space: 'outdoor', reverbLevel: 0.15, echoLevel: 0.85, lowpassFilter: null, highpassFilter: null },
  city: { space: 'outdoor', reverbLevel: 0.2, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  street: { space: 'outdoor', reverbLevel: 0.25, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  alley: { space: 'outdoor', reverbLevel: 0.35, echoLevel: 0.45, lowpassFilter: null, highpassFilter: null },
  marketplace: { space: 'outdoor', reverbLevel: 0.15, echoLevel: 0.3, lowpassFilter: null, highpassFilter: null },
  plaza: { space: 'outdoor', reverbLevel: 0.2, echoLevel: 0.4, lowpassFilter: null, highpassFilter: null },
  courtyard: { space: 'outdoor', reverbLevel: 0.3, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  garden: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.25, lowpassFilter: null, highpassFilter: null },
  rooftop: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.6, lowpassFilter: null, highpassFilter: null },
  dock: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.45, lowpassFilter: null, highpassFilter: null },
  harbor: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.45, lowpassFilter: null, highpassFilter: null },
  pier: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  swamp: { space: 'outdoor', reverbLevel: 0.15, echoLevel: 0.2, lowpassFilter: 6000, highpassFilter: null },
  bog: { space: 'outdoor', reverbLevel: 0.15, echoLevel: 0.2, lowpassFilter: 6000, highpassFilter: null },
  graveyard: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  cemetery: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.35, lowpassFilter: null, highpassFilter: null },
  battlefield: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.6, lowpassFilter: null, highpassFilter: null },
  arena: { space: 'outdoor', reverbLevel: 0.3, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  arctic: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.8, lowpassFilter: null, highpassFilter: null },
  tundra: { space: 'outdoor', reverbLevel: 0.05, echoLevel: 0.75, lowpassFilter: null, highpassFilter: null },
  
  // === UNDERWATER (muffled) ===
  underwater: { space: 'underwater', reverbLevel: 0.3, echoLevel: 0.1, lowpassFilter: 800, highpassFilter: 200 },
  ocean_floor: { space: 'underwater', reverbLevel: 0.25, echoLevel: 0.1, lowpassFilter: 600, highpassFilter: 250 },
  lake_bottom: { space: 'underwater', reverbLevel: 0.2, echoLevel: 0.1, lowpassFilter: 900, highpassFilter: 180 },
};

// Default acoustic profiles
const DEFAULT_ACOUSTICS: Record<AcousticSpace, LocationAcoustics> = {
  indoor: { space: 'indoor', reverbLevel: 0.4, echoLevel: 0.1, lowpassFilter: null, highpassFilter: null },
  outdoor: { space: 'outdoor', reverbLevel: 0.1, echoLevel: 0.5, lowpassFilter: null, highpassFilter: null },
  underground: { space: 'underground', reverbLevel: 0.7, echoLevel: 0.4, lowpassFilter: 4500, highpassFilter: null },
  underwater: { space: 'underwater', reverbLevel: 0.3, echoLevel: 0.1, lowpassFilter: 800, highpassFilter: 200 },
};

// Sound categories that have acoustic variants - SCREAM REMOVED
const ACOUSTIC_VARIANT_SOUNDS = [
  'gunshot', 'explosion', 'voice', 'combat', 'shout', 'yell',
  'sword_clash', 'punch', 'kick', 'impact'
];

class AcousticEnvironmentSystem {
  private currentLocation: string = 'outdoor';
  private currentAcoustics: LocationAcoustics = DEFAULT_ACOUSTICS.outdoor;
  private listeners: Array<(acoustics: LocationAcoustics) => void> = [];

  // Get current acoustic space
  getAcousticSpace(): AcousticSpace {
    return this.currentAcoustics.space;
  }

  // Get current location
  getCurrentLocation(): string {
    return this.currentLocation;
  }

  // Get full acoustic profile
  getAcoustics(): LocationAcoustics {
    return { ...this.currentAcoustics };
  }

  // Set location and update acoustics
  setLocation(locationType: string): void {
    this.currentLocation = locationType.toLowerCase().replace(/\s+/g, '_');
    
    // Look up specific location acoustics
    if (LOCATION_ACOUSTICS[this.currentLocation]) {
      this.currentAcoustics = { ...LOCATION_ACOUSTICS[this.currentLocation] };
    } else {
      // Try to infer from location name
      const inferredSpace = this.inferAcousticSpace(this.currentLocation);
      this.currentAcoustics = { ...DEFAULT_ACOUSTICS[inferredSpace] };
    }

    console.log(`Acoustic environment set to: ${this.currentLocation} (${this.currentAcoustics.space})`);
    this.notifyListeners();
  }

  // Infer acoustic space from location name keywords
  private inferAcousticSpace(location: string): AcousticSpace {
    const loc = location.toLowerCase();
    
    // Underwater keywords
    if (loc.includes('underwater') || loc.includes('submerged') || loc.includes('beneath the water')) {
      return 'underwater';
    }
    
    // Underground keywords
    if (loc.includes('cave') || loc.includes('tunnel') || loc.includes('underground') ||
        loc.includes('dungeon') || loc.includes('crypt') || loc.includes('mine') ||
        loc.includes('sewer') || loc.includes('catacomb') || loc.includes('basement') ||
        loc.includes('cellar') || loc.includes('tomb') || loc.includes('cavern')) {
      return 'underground';
    }
    
    // Indoor keywords
    if (loc.includes('room') || loc.includes('building') || loc.includes('house') ||
        loc.includes('office') || loc.includes('hall') || loc.includes('chamber') ||
        loc.includes('inside') || loc.includes('interior') || loc.includes('indoor') ||
        loc.includes('tavern') || loc.includes('bar') || loc.includes('inn') ||
        loc.includes('shop') || loc.includes('store') || loc.includes('castle') ||
        loc.includes('palace') || loc.includes('church') || loc.includes('temple') ||
        loc.includes('hospital') || loc.includes('prison') || loc.includes('jail') ||
        loc.includes('ship') || loc.includes('cabin') || loc.includes('cockpit')) {
      return 'indoor';
    }
    
    // Default to outdoor
    return 'outdoor';
  }

  // Determine if a sound should use an acoustic variant
  shouldUseAcousticVariant(soundType: string): boolean {
    const normalizedType = soundType.toLowerCase();
    return ACOUSTIC_VARIANT_SOUNDS.some(variant => normalizedType.includes(variant));
  }

  // Get the appropriate acoustic variant key for a sound
  getAcousticVariantKey(baseSoundKey: string): string {
    const space = this.currentAcoustics.space;
    
    // Map space to acoustic prefix
    const acousticPrefix = space === 'indoor' || space === 'underground' 
      ? 'acoustic_indoor' 
      : 'acoustic_outdoor';
    
    // Try to match sound type to variant
    const soundType = this.extractSoundType(baseSoundKey);
    if (soundType) {
      return `${acousticPrefix}_${soundType}`;
    }
    
    return baseSoundKey; // Return original if no variant
  }

  // Extract sound type from key for variant matching
  private extractSoundType(soundKey: string): string | null {
    const key = soundKey.toLowerCase();
    
    if (key.includes('gunshot') || key.includes('gun_') || key.includes('pistol') || 
        key.includes('rifle') || key.includes('shotgun')) {
      return 'gunshot';
    }
    if (key.includes('explosion') || key.includes('grenade') || key.includes('blast')) {
      return 'explosion';
    }
    if (key.includes('voice') || key.includes('speak') || key.includes('talk') ||
        key.includes('shout') || key.includes('yell') || key.includes('scream')) {
      return 'voice';
    }
    if (key.includes('combat') || key.includes('sword') || key.includes('punch') ||
        key.includes('kick') || key.includes('fight')) {
      return 'combat';
    }
    
    return null;
  }

  // Get audio effect parameters based on current acoustics
  // REDUCED: Single echo with fast decay, minimal reverb
  getAudioEffects(): {
    echo: boolean;
    echoDelay: number;
    echoDecay: number;
    reverb: boolean;
    reverbDuration: number;
    lowpass: number | null;
    highpass: number | null;
  } {
    const { space, reverbLevel, echoLevel, lowpassFilter, highpassFilter } = this.currentAcoustics;
    
    return {
      // Use minimal reverb for indoor/underground - fast decay
      reverb: space === 'indoor' || space === 'underground',
      reverbDuration: Math.min(reverbLevel * 0.3, 0.3), // Max 0.3s, dies quickly
      
      // Single echo for outdoor, very fast decay
      echo: echoLevel > 0.3,
      echoDelay: 0.15, // Single quick echo
      echoDecay: 0.1, // Dies very fast
      
      // Filters
      lowpass: lowpassFilter,
      highpass: highpassFilter,
    };
  }

  // Check if currently indoors (for simpler checks)
  isIndoors(): boolean {
    return this.currentAcoustics.space === 'indoor' || this.currentAcoustics.space === 'underground';
  }

  // Subscribe to acoustic changes
  subscribe(callback: (acoustics: LocationAcoustics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx > -1) this.listeners.splice(idx, 1);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentAcoustics);
      } catch (e) {
        console.error('Acoustic listener error:', e);
      }
    }
  }

  // Parse location from narrative text
  detectLocationFromText(text: string): string | null {
    const locationPatterns = [
      // Entering locations
      /\b(?:enter|entering|step into|walk into|go into|arrive at|reach|inside)\s+(?:the\s+)?(\w+(?:\s+\w+)?)/i,
      // At locations  
      /\b(?:in the|at the|inside the|within the)\s+(\w+(?:\s+\w+)?)/i,
      // Location descriptions
      /\bthe\s+(\w+)\s+(?:is|looks|feels|smells|sounds)/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const potentialLocation = match[1].toLowerCase().replace(/\s+/g, '_');
        // Only return if it's a known location type
        if (LOCATION_ACOUSTICS[potentialLocation] || this.inferAcousticSpace(potentialLocation) !== 'outdoor') {
          return potentialLocation;
        }
      }
    }
    
    // Check for explicit location keywords
    for (const locationKey of Object.keys(LOCATION_ACOUSTICS)) {
      if (text.toLowerCase().includes(locationKey.replace(/_/g, ' '))) {
        return locationKey;
      }
    }
    
    return null;
  }
}

// Singleton instance
export const acousticEnvironmentSystem = new AcousticEnvironmentSystem();
