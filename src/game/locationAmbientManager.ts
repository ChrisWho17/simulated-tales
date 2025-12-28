// Location Ambient Manager - 40+ location presets with layered soundscapes
// Genre-aware location filtering, auto-detection from narrative, detail layers with variation

import { audioEngine, AudioChannel } from './audioEngine';
import { soundPreloader } from './soundPreloader';

type GenreType = 'modern' | 'medieval' | 'cyberpunk' | 'western' | 'horror' | 'fantasy' | 'post_apocalyptic' | 'scifi';

interface SoundLayer {
  sound: string;
  volume: number;
  chance?: number;
  cooldown?: number;
  loop?: boolean;
}

interface LocationDefinition {
  name: string;
  genres: GenreType[];
  baseLayers: SoundLayer[];
  detailLayers?: SoundLayer[];
  isIndoors?: boolean;
}

interface ActiveLayer {
  id: string;
  setVolume?: (vol: number, duration?: number) => void;
  stop?: (fadeOut?: number) => void;
}

interface LocationChangeEvent {
  type: 'location_changed';
  previous: string | null;
  current: string;
  location: LocationDefinition;
}

class LocationAmbientManagerClass {
  // State
  private currentLocation: string | null = null;
  private activeLayers: Map<string, ActiveLayer> = new Map();
  private detailIntervals: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isTransitioning = false;
  private currentGenre: GenreType = 'modern';
  private listeners: Array<(event: LocationChangeEvent) => void> = [];

  // ═══════════════════════════════════════════════════════════
  // LOCATION DEFINITIONS (40+ locations)
  // ═══════════════════════════════════════════════════════════
  
  private locations: Record<string, LocationDefinition> = {
    // === URBAN - OUTDOOR ===
    city_street: {
      name: 'City Street',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_city_day', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.25, chance: 0.5 },
        { sound: 'vehicle_car_pass', volume: 0.3, chance: 0.3, cooldown: 8000 }
      ]
    },
    city_street_busy: {
      name: 'Busy City Street',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_city_day', volume: 0.45 },
        { sound: 'crowd_busy', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'vehicle_car_horn', volume: 0.25, chance: 0.3, cooldown: 12000 }
      ]
    },
    city_alley: {
      name: 'City Alley',
      genres: ['modern', 'cyberpunk', 'horror'],
      baseLayers: [
        { sound: 'ambience_city_night', volume: 0.25 }
      ],
      detailLayers: [
        { sound: 'creature_rat', volume: 0.2, chance: 0.3, cooldown: 15000 }
      ],
      isIndoors: false
    },
    city_park: {
      name: 'City Park',
      genres: ['modern'],
      baseLayers: [
        { sound: 'ambience_forest', volume: 0.35 },
        { sound: 'ambience_city_day', volume: 0.2 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.25, chance: 0.6 }
      ]
    },
    rooftop: {
      name: 'Rooftop',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_city_day', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.25, chance: 0.4 }
      ]
    },
    parking_lot: {
      name: 'Parking Lot',
      genres: ['modern'],
      baseLayers: [
        { sound: 'ambience_city_day', volume: 0.25 }
      ],
      detailLayers: []
    },

    // === COMMERCIAL / HOSPITALITY ===
    bar: {
      name: 'Bar',
      genres: ['modern', 'western', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_tavern', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.3, chance: 0.5 },
        { sound: 'glass_clink', volume: 0.2, chance: 0.3, cooldown: 10000 }
      ],
      isIndoors: true
    },
    bar_busy: {
      name: 'Busy Bar',
      genres: ['modern', 'western', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_tavern', volume: 0.5 },
        { sound: 'crowd_busy', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'glass_clink', volume: 0.25, chance: 0.4, cooldown: 8000 }
      ],
      isIndoors: true
    },
    tavern: {
      name: 'Tavern',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_tavern', volume: 0.4 },
        { sound: 'element_fire', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.3, chance: 0.5 }
      ],
      isIndoors: true
    },
    restaurant: {
      name: 'Restaurant',
      genres: ['modern'],
      baseLayers: [
        { sound: 'ambience_inn', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.25, chance: 0.4 }
      ],
      isIndoors: true
    },
    cafe: {
      name: 'Café',
      genres: ['modern'],
      baseLayers: [
        { sound: 'ambience_inn', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.2, chance: 0.4 }
      ],
      isIndoors: true
    },
    nightclub: {
      name: 'Nightclub',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_plaza', volume: 0.55 }
      ],
      detailLayers: [],
      isIndoors: true
    },

    // === PROFESSIONAL / INSTITUTIONAL ===
    office: {
      name: 'Office',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_castle', volume: 0.25 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    office_busy: {
      name: 'Busy Office',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'ambience_castle', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    hospital: {
      name: 'Hospital',
      genres: ['modern', 'horror'],
      baseLayers: [
        { sound: 'ambience_castle', volume: 0.25 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    warehouse: {
      name: 'Warehouse',
      genres: ['modern', 'cyberpunk', 'horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.3 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    factory: {
      name: 'Factory',
      genres: ['modern', 'cyberpunk'],
      baseLayers: [
        { sound: 'hydraulics_machinery', volume: 0.4 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    library: {
      name: 'Library',
      genres: ['modern', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_castle', volume: 0.15 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    prison: {
      name: 'Prison',
      genres: ['modern', 'horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'chains_rattle', volume: 0.2, chance: 0.3, cooldown: 15000 }
      ],
      isIndoors: true
    },

    // === NATURE - FORESTS ===
    forest: {
      name: 'Forest',
      genres: ['medieval', 'fantasy', 'horror', 'western'],
      baseLayers: [
        { sound: 'ambience_forest', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.25, chance: 0.5 }
      ]
    },
    forest_day: {
      name: 'Forest (Day)',
      genres: ['medieval', 'fantasy', 'western'],
      baseLayers: [
        { sound: 'ambience_forest', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.3, chance: 0.6 }
      ]
    },
    forest_night: {
      name: 'Forest (Night)',
      genres: ['medieval', 'fantasy', 'horror'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'creature_owl', volume: 0.25, chance: 0.4, cooldown: 20000 },
        { sound: 'creature_wolf', volume: 0.3, chance: 0.2, cooldown: 30000 }
      ]
    },
    forest_dense: {
      name: 'Dense Forest',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_forest', volume: 0.45 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.25, chance: 0.5 }
      ]
    },
    jungle: {
      name: 'Jungle',
      genres: ['fantasy'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.5 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.3, chance: 0.6 }
      ]
    },
    swamp: {
      name: 'Swamp',
      genres: ['fantasy', 'horror'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.45 },
        { sound: 'element_water', volume: 0.25 }
      ],
      detailLayers: [
        { sound: 'creature_frog', volume: 0.25, chance: 0.5 }
      ]
    },
    meadow: {
      name: 'Meadow',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_forest', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'creature_bird', volume: 0.25, chance: 0.6 }
      ]
    },

    // === NATURE - WATER ===
    beach: {
      name: 'Beach',
      genres: ['modern', 'fantasy'],
      baseLayers: [
        { sound: 'element_water', volume: 0.5 },
        { sound: 'ambience_harbor', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'creature_seagull', volume: 0.3, chance: 0.4, cooldown: 10000 }
      ]
    },
    river: {
      name: 'Riverside',
      genres: ['medieval', 'fantasy', 'western'],
      baseLayers: [
        { sound: 'element_water', volume: 0.45 }
      ],
      detailLayers: []
    },
    waterfall: {
      name: 'Waterfall',
      genres: ['fantasy', 'medieval'],
      baseLayers: [
        { sound: 'element_water', volume: 0.55 }
      ],
      detailLayers: []
    },
    harbor: {
      name: 'Harbor',
      genres: ['modern', 'medieval'],
      baseLayers: [
        { sound: 'ambience_harbor', volume: 0.4 }
      ],
      detailLayers: [
        { sound: 'creature_seagull', volume: 0.3, chance: 0.5, cooldown: 8000 }
      ]
    },
    underwater: {
      name: 'Underwater',
      genres: ['fantasy'],
      baseLayers: [
        { sound: 'element_water', volume: 0.4 }
      ],
      detailLayers: []
    },

    // === NATURE - OTHER ===
    desert: {
      name: 'Desert',
      genres: ['western', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.25 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.2, chance: 0.4 }
      ]
    },
    mountain: {
      name: 'Mountain',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.35, chance: 0.5 }
      ]
    },
    canyon: {
      name: 'Canyon',
      genres: ['western', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.25, chance: 0.4 }
      ]
    },

    // === UNDERGROUND ===
    cave: {
      name: 'Cave',
      genres: ['medieval', 'fantasy', 'horror'],
      baseLayers: [
        { sound: 'ambience_cave', volume: 0.3 },
        { sound: 'element_water', volume: 0.2 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    cave_deep: {
      name: 'Deep Cave',
      genres: ['medieval', 'fantasy', 'horror'],
      baseLayers: [
        { sound: 'ambience_cave', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.2, chance: 0.4 }
      ],
      isIndoors: true
    },
    sewer: {
      name: 'Sewer',
      genres: ['modern', 'cyberpunk', 'horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.35 },
        { sound: 'element_water', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'creature_rat', volume: 0.25, chance: 0.3, cooldown: 12000 }
      ],
      isIndoors: true
    },
    mine: {
      name: 'Mine',
      genres: ['western', 'medieval'],
      baseLayers: [
        { sound: 'ambience_cave', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    dungeon: {
      name: 'Dungeon',
      genres: ['medieval', 'fantasy', 'horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'element_water', volume: 0.2, chance: 0.5 }
      ],
      isIndoors: true
    },
    catacomb: {
      name: 'Catacombs',
      genres: ['medieval', 'horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.3 }
      ],
      detailLayers: [],
      isIndoors: true
    },

    // === SPECIAL LOCATIONS ===
    graveyard: {
      name: 'Graveyard',
      genres: ['modern', 'medieval', 'horror'],
      baseLayers: [
        { sound: 'ambience_wilderness', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.25, chance: 0.5 },
        { sound: 'creature_crow', volume: 0.3, chance: 0.3, cooldown: 20000 }
      ]
    },
    haunted: {
      name: 'Haunted Location',
      genres: ['horror'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'creature_ghost', volume: 0.2, chance: 0.4, cooldown: 15000 }
      ],
      isIndoors: true
    },
    campfire: {
      name: 'Campfire',
      genres: ['western', 'medieval', 'fantasy'],
      baseLayers: [
        { sound: 'element_fire', volume: 0.45 },
        { sound: 'ambience_campsite', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'creature_cricket', volume: 0.25, chance: 0.5 }
      ]
    },
    abandoned_building: {
      name: 'Abandoned Building',
      genres: ['modern', 'horror', 'post_apocalyptic'],
      baseLayers: [
        { sound: 'ambience_dungeon', volume: 0.3 }
      ],
      detailLayers: [
        { sound: 'weather_wind', volume: 0.25, chance: 0.5 },
        { sound: 'door_creaky', volume: 0.25, chance: 0.3, cooldown: 15000 }
      ],
      isIndoors: true
    },

    // === MEDIEVAL / FANTASY SPECIFIC ===
    castle: {
      name: 'Castle',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_castle', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    throne_room: {
      name: 'Throne Room',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_throne_room', volume: 0.4 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    marketplace: {
      name: 'Marketplace',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_market', volume: 0.45 }
      ],
      detailLayers: [
        { sound: 'crowd_busy', volume: 0.3, chance: 0.5 }
      ]
    },
    temple: {
      name: 'Temple',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_temple', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    shrine: {
      name: 'Shrine',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_shrine', volume: 0.3 }
      ],
      detailLayers: [],
      isIndoors: true
    },
    battlefield: {
      name: 'Battlefield',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_battlefield', volume: 0.5 }
      ],
      detailLayers: [
        { sound: 'crowd_battle', volume: 0.4, chance: 0.5 }
      ]
    },

    // === SCI-FI / CYBERPUNK ===
    spaceship: {
      name: 'Spaceship',
      genres: ['scifi'],
      baseLayers: [
        { sound: 'scifi_engine', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'scifi_tech', volume: 0.2, chance: 0.4, cooldown: 10000 }
      ],
      isIndoors: true
    },
    space_station: {
      name: 'Space Station',
      genres: ['scifi'],
      baseLayers: [
        { sound: 'scifi_tech', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    },

    // === SHIP / NAUTICAL ===
    ship_deck: {
      name: 'Ship Deck',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_ship', volume: 0.4 },
        { sound: 'element_water', volume: 0.35 }
      ],
      detailLayers: [
        { sound: 'creature_seagull', volume: 0.25, chance: 0.4, cooldown: 12000 }
      ]
    },
    ship_cabin: {
      name: 'Ship Cabin',
      genres: ['medieval', 'fantasy'],
      baseLayers: [
        { sound: 'ambience_ship', volume: 0.35 }
      ],
      detailLayers: [],
      isIndoors: true
    }
  };

  // ═══════════════════════════════════════════════════════════
  // LOCATION CONTROL
  // ═══════════════════════════════════════════════════════════

  async setLocation(
    locationId: string,
    options: { transitionTime?: number; force?: boolean } = {}
  ): Promise<void> {
    const { transitionTime = 2, force = false } = options;

    if (this.currentLocation === locationId && !force) return;

    const location = this.locations[locationId];
    if (!location) {
      console.warn(`[LocationAmbientManager] Unknown location: ${locationId}`);
      return;
    }

    // Check genre compatibility (warn but allow)
    if (!location.genres.includes(this.currentGenre)) {
      console.warn(`[LocationAmbientManager] Location "${locationId}" not typical for genre "${this.currentGenre}"`);
    }

    const previousLocation = this.currentLocation;
    this.currentLocation = locationId;

    // Transition to new layers
    await this.transitionToLocation(location, transitionTime);

    // Notify listeners
    this.notifyListeners({
      type: 'location_changed',
      previous: previousLocation,
      current: locationId,
      location
    });

    console.log(`[LocationAmbientManager] Set location to: ${location.name}`);
  }

  private async transitionToLocation(
    location: LocationDefinition,
    duration: number
  ): Promise<void> {
    this.isTransitioning = true;

    // Stop detail layer intervals
    for (const interval of this.detailIntervals.values()) {
      clearTimeout(interval);
    }
    this.detailIntervals.clear();

    // Stop current layers
    for (const [id, layer] of this.activeLayers) {
      layer.stop?.(duration);
    }
    this.activeLayers.clear();

    // Wait for fade out
    await new Promise(r => setTimeout(r, duration * 500));

    // Start base layers
    for (const layer of location.baseLayers) {
      await this.startLayer(layer, `loc_base_${layer.sound}`, duration);
    }

    // Start detail layers based on chance
    for (const layer of location.detailLayers || []) {
      if (Math.random() <= (layer.chance || 1)) {
        if (layer.cooldown) {
          // Schedule recurring detail sounds
          this.scheduleDetailLayer(layer);
        } else {
          // Play as loop
          await this.startLayer({ ...layer, loop: true }, `loc_detail_${layer.sound}`, duration + 1);
        }
      }
    }

    this.isTransitioning = false;
  }

  private async startLayer(
    layer: SoundLayer,
    id: string,
    fadeIn: number
  ): Promise<void> {
    // Try to find a preloaded sound matching the layer sound key
    const sounds = soundPreloader.findSounds(layer.sound);
    if (sounds.length === 0) {
      console.warn(`[LocationAmbientManager] No sounds found for: ${layer.sound}`);
      return;
    }

    // Pick the first matching sound - use category/filename as key
    const soundKey = `${sounds[0].category}/${sounds[0].filename}`;

    const loop = await audioEngine.playLoop(soundKey, {
      id,
      channel: 'ambience',
      volume: layer.volume,
      fadeIn
    });

    if (loop) {
      this.activeLayers.set(id, {
        id,
        setVolume: loop.setVolume,
        stop: loop.stop
      });
    }
  }

  private scheduleDetailLayer(layer: SoundLayer): void {
    const scheduleNext = () => {
      const cooldown = layer.cooldown || 10000;
      const delay = cooldown + Math.random() * cooldown;

      const interval = setTimeout(async () => {
        // Check chance each time
        if (Math.random() <= (layer.chance || 1)) {
          await this.playDetailSound(layer);
        }
        scheduleNext();
      }, delay);

      this.detailIntervals.set(layer.sound, interval);
    };

    // First play after a short delay
    setTimeout(() => {
      this.playDetailSound(layer);
      scheduleNext();
    }, 2000 + Math.random() * 3000);
  }

  private async playDetailSound(layer: SoundLayer): Promise<void> {
    const sounds = soundPreloader.findSounds(layer.sound);
    if (sounds.length === 0) return;

    // Pick random sound from matches
    const sound = sounds[Math.floor(Math.random() * sounds.length)];

    await soundPreloader.playFromCategory(
      sound.category,
      { volume: layer.volume }
    );
  }

  // ═══════════════════════════════════════════════════════════
  // GENRE MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  setGenre(genre: GenreType): void {
    this.currentGenre = genre;
    console.log(`[LocationAmbientManager] Genre set to: ${genre}`);
  }

  getGenre(): GenreType {
    return this.currentGenre;
  }

  getAvailableLocations(): Array<{ id: string; name: string }> {
    const available: Array<{ id: string; name: string }> = [];
    
    for (const [id, loc] of Object.entries(this.locations)) {
      if (loc.genres.includes(this.currentGenre)) {
        available.push({ id, name: loc.name });
      }
    }
    
    return available;
  }

  // ═══════════════════════════════════════════════════════════
  // AUTO-DETECTION FROM NARRATIVE
  // ═══════════════════════════════════════════════════════════

  private locationPatterns: Array<{ patterns: RegExp[]; location: string }> = [
    { patterns: [/\benters?\s+(the\s+)?bar\b/i, /\bsteps?\s+into\s+(the\s+)?bar\b/i], location: 'bar' },
    { patterns: [/\benters?\s+(the\s+)?tavern\b/i, /\bsteps?\s+into\s+(the\s+)?tavern\b/i], location: 'tavern' },
    { patterns: [/\benters?\s+(the\s+)?restaurant\b/i], location: 'restaurant' },
    { patterns: [/\benters?\s+(the\s+)?office\b/i, /\barrives?\s+at\s+(the\s+)?office\b/i], location: 'office' },
    { patterns: [/\benters?\s+(the\s+)?hospital\b/i, /\barrives?\s+at\s+(the\s+)?hospital\b/i], location: 'hospital' },
    { patterns: [/\benters?\s+(the\s+)?warehouse\b/i], location: 'warehouse' },
    { patterns: [/\benters?\s+(the\s+)?factory\b/i], location: 'factory' },
    { patterns: [/\benters?\s+(the\s+)?forest\b/i, /\bwalks?\s+into\s+(the\s+)?forest\b/i], location: 'forest_day' },
    { patterns: [/\benters?\s+(the\s+)?cave\b/i], location: 'cave' },
    { patterns: [/\bsteps?\s+outside\b/i, /\bwalks?\s+onto\s+(the\s+)?street\b/i], location: 'city_street' },
    { patterns: [/\benters?\s+(the\s+)?alley\b/i, /\bsteps?\s+into\s+(the\s+)?alley\b/i], location: 'city_alley' },
    { patterns: [/\benters?\s+(the\s+)?sewer\b/i, /\bclimbs?\s+into\s+(the\s+)?sewer\b/i], location: 'sewer' },
    { patterns: [/\breaches?\s+(the\s+)?beach\b/i, /\barrives?\s+at\s+(the\s+)?beach\b/i], location: 'beach' },
    { patterns: [/\benters?\s+(the\s+)?graveyard\b/i, /\bwalks?\s+into\s+(the\s+)?cemetery\b/i], location: 'graveyard' },
    { patterns: [/\benters?\s+(the\s+)?castle\b/i, /\barrives?\s+at\s+(the\s+)?castle\b/i], location: 'castle' },
    { patterns: [/\benters?\s+(the\s+)?temple\b/i], location: 'temple' },
    { patterns: [/\benters?\s+(the\s+)?marketplace\b/i, /\barrives?\s+at\s+(the\s+)?market\b/i], location: 'marketplace' },
    { patterns: [/\benters?\s+(the\s+)?dungeon\b/i], location: 'dungeon' },
    { patterns: [/\benters?\s+(the\s+)?ship\b/i, /\bboards?\s+(the\s+)?ship\b/i], location: 'ship_deck' },
    { patterns: [/\benters?\s+(the\s+)?mine\b/i], location: 'mine' },
    { patterns: [/\barrives?\s+at\s+(the\s+)?campfire\b/i, /\bsits?\s+by\s+(the\s+)?fire\b/i], location: 'campfire' }
  ];

  detectLocation(text: string): string | null {
    for (const { patterns, location } of this.locationPatterns) {
      if (patterns.some(p => p.test(text))) {
        return location;
      }
    }
    return null;
  }

  async processNarrativeText(
    text: string,
    options: { transitionTime?: number } = {}
  ): Promise<string | null> {
    const locationId = this.detectLocation(text);
    if (locationId && locationId !== this.currentLocation) {
      await this.setLocation(locationId, options);
      return locationId;
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // CLEANUP & STATE
  // ═══════════════════════════════════════════════════════════

  async clearLocation(fadeOut = 2): Promise<void> {
    // Stop detail intervals
    for (const interval of this.detailIntervals.values()) {
      clearTimeout(interval);
    }
    this.detailIntervals.clear();

    // Stop all layers
    for (const [id, layer] of this.activeLayers) {
      layer.stop?.(fadeOut);
    }
    this.activeLayers.clear();
    this.currentLocation = null;
  }

  getCurrentLocation(): string | null {
    return this.currentLocation;
  }

  getLocationInfo(locationId: string): LocationDefinition | null {
    return this.locations[locationId] || null;
  }

  isIndoors(): boolean {
    if (!this.currentLocation) return false;
    return this.locations[this.currentLocation]?.isIndoors || false;
  }

  getState() {
    return {
      currentLocation: this.currentLocation,
      currentGenre: this.currentGenre,
      activeLayers: Array.from(this.activeLayers.keys()),
      isTransitioning: this.isTransitioning
    };
  }

  // ═══════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════

  addEventListener(callback: (event: LocationChangeEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const idx = this.listeners.indexOf(callback);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private notifyListeners(event: LocationChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (e) {
        console.error('[LocationAmbientManager] Listener error:', e);
      }
    }
  }
}

// Singleton export
export const locationAmbientManager = new LocationAmbientManagerClass();
