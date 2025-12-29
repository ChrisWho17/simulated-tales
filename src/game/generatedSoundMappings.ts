// Generated Sound Mappings - Maps database sounds to game sound system
// All volumes are kept subtle (0.15-0.35 range) so sounds are noticeable but not intrusive

import type { AudioChannel } from './audioEngine';

export interface GeneratedSoundMapping {
  // Database category (e.g., 'weather_rain', 'ui_buttons')
  dbCategory: string;
  // Database filename pattern to match
  filenamePattern: string;
  // Game sound system mapping
  gameCategory: string;
  gameSoundId: string;
  // Audio settings
  volume: number;
  channel: AudioChannel;
  loop?: boolean;
  fadeIn?: number;
  fadeOut?: number;
  cooldown?: number;
  priority?: number;
  echo?: boolean;
  echoDelay?: number;
  echoDecay?: number;
  lowpass?: number;
}

// Weather sound mappings - subtle ambient volumes
export const WEATHER_SOUND_MAPPINGS: GeneratedSoundMapping[] = [
  // Clear weather
  { dbCategory: 'weather_clear', filenamePattern: 'clear_breeze_light', gameCategory: 'weather', gameSoundId: 'clear_breeze', volume: 0.15, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_clear', filenamePattern: 'clear_day_birds_1', gameCategory: 'ambient', gameSoundId: 'birds_day_1', volume: 0.18, channel: 'ambience', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_clear', filenamePattern: 'clear_day_birds_2', gameCategory: 'ambient', gameSoundId: 'birds_day_2', volume: 0.18, channel: 'ambience', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_clear', filenamePattern: 'clear_day_cicadas', gameCategory: 'ambient', gameSoundId: 'cicadas_summer', volume: 0.20, channel: 'ambience', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_clear', filenamePattern: 'clear_night_crickets', gameCategory: 'ambient', gameSoundId: 'crickets_night', volume: 0.20, channel: 'ambience', loop: true, fadeIn: 3 },
  
  // Fog
  { dbCategory: 'weather_fog', filenamePattern: 'fog_ambient', gameCategory: 'weather', gameSoundId: 'fog_ambient', volume: 0.12, channel: 'weather', loop: true, fadeIn: 4, lowpass: 800 },
  { dbCategory: 'weather_fog', filenamePattern: 'fog_eerie', gameCategory: 'weather', gameSoundId: 'fog_eerie', volume: 0.15, channel: 'weather', loop: true, fadeIn: 4, lowpass: 600 },
  { dbCategory: 'weather_fog', filenamePattern: 'fog_dripping', gameCategory: 'weather', gameSoundId: 'fog_drips', volume: 0.18, channel: 'weather', loop: true, fadeIn: 3 },
  
  // Hail
  { dbCategory: 'weather_hail', filenamePattern: 'hail_heavy', gameCategory: 'weather', gameSoundId: 'hail_heavy', volume: 0.30, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_hail', filenamePattern: 'hail_light', gameCategory: 'weather', gameSoundId: 'hail_light', volume: 0.20, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_hail', filenamePattern: 'hail_on_roof', gameCategory: 'weather', gameSoundId: 'hail_roof', volume: 0.25, channel: 'weather', loop: true, fadeIn: 2 },
  
  // Rain
  { dbCategory: 'weather_rain', filenamePattern: 'rain_drizzle', gameCategory: 'weather', gameSoundId: 'rain_drizzle', volume: 0.18, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_heavy', gameCategory: 'weather', gameSoundId: 'rain_heavy', volume: 0.30, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_light', gameCategory: 'weather', gameSoundId: 'rain_light', volume: 0.20, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_medium', gameCategory: 'weather', gameSoundId: 'rain_medium', volume: 0.25, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_on_leaves', gameCategory: 'weather', gameSoundId: 'rain_leaves', volume: 0.18, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_on_metal', gameCategory: 'weather', gameSoundId: 'rain_metal', volume: 0.22, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_on_tent', gameCategory: 'weather', gameSoundId: 'rain_tent', volume: 0.20, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_on_umbrella', gameCategory: 'weather', gameSoundId: 'rain_umbrella', volume: 0.18, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_on_window', gameCategory: 'weather', gameSoundId: 'rain_window', volume: 0.15, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_puddle', gameCategory: 'weather', gameSoundId: 'rain_puddles', volume: 0.15, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_rain', filenamePattern: 'rain_torrential', gameCategory: 'weather', gameSoundId: 'rain_torrential', volume: 0.35, channel: 'weather', loop: true, fadeIn: 2 },
  
  // Snow
  { dbCategory: 'weather_snow', filenamePattern: 'blizzard', gameCategory: 'weather', gameSoundId: 'blizzard', volume: 0.28, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_snow', filenamePattern: 'snow_crunching', gameCategory: 'weather', gameSoundId: 'snow_crunch', volume: 0.20, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_snow', filenamePattern: 'snow_falling', gameCategory: 'weather', gameSoundId: 'snow_falling', volume: 0.12, channel: 'weather', loop: true, fadeIn: 4 },
  { dbCategory: 'weather_snow', filenamePattern: 'snow_wind', gameCategory: 'weather', gameSoundId: 'snow_wind', volume: 0.22, channel: 'weather', loop: true, fadeIn: 3 },
  
  // Storm  
  { dbCategory: 'weather_storm', filenamePattern: 'storm_ambient', gameCategory: 'weather', gameSoundId: 'storm_ambient', volume: 0.30, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_storm', filenamePattern: 'storm_rain', gameCategory: 'weather', gameSoundId: 'storm_rain', volume: 0.32, channel: 'weather', loop: true, fadeIn: 2 },
  { dbCategory: 'weather_storm', filenamePattern: 'thunder_close', gameCategory: 'weather', gameSoundId: 'thunder_close', volume: 0.35, channel: 'weather', cooldown: 8000, priority: 8, echo: true, echoDelay: 0.3, echoDecay: 0.5 },
  { dbCategory: 'weather_storm', filenamePattern: 'thunder_distant', gameCategory: 'weather', gameSoundId: 'thunder_distant', volume: 0.22, channel: 'weather', cooldown: 10000, priority: 6, echo: true, echoDelay: 0.8, echoDecay: 0.35 },
  { dbCategory: 'weather_storm', filenamePattern: 'thunder_rumble', gameCategory: 'weather', gameSoundId: 'thunder_rumble', volume: 0.28, channel: 'weather', cooldown: 12000, priority: 7, echo: true, echoDelay: 0.6, echoDecay: 0.4 },
  
  // Wind
  { dbCategory: 'weather_wind', filenamePattern: 'wind_gust', gameCategory: 'weather', gameSoundId: 'wind_gust', volume: 0.25, channel: 'weather', cooldown: 5000, priority: 4 },
  { dbCategory: 'weather_wind', filenamePattern: 'wind_howl', gameCategory: 'weather', gameSoundId: 'wind_howl', volume: 0.22, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_wind', filenamePattern: 'wind_light_loop', gameCategory: 'weather', gameSoundId: 'wind_light', volume: 0.15, channel: 'weather', loop: true, fadeIn: 4 },
  { dbCategory: 'weather_wind', filenamePattern: 'wind_medium_loop', gameCategory: 'weather', gameSoundId: 'wind_medium', volume: 0.20, channel: 'weather', loop: true, fadeIn: 3 },
  { dbCategory: 'weather_wind', filenamePattern: 'wind_strong_loop', gameCategory: 'weather', gameSoundId: 'wind_strong', volume: 0.28, channel: 'weather', loop: true, fadeIn: 2 },
];

// UI sound mappings - very subtle feedback sounds
export const UI_SOUND_MAPPINGS: GeneratedSoundMapping[] = [
  // Buttons
  { dbCategory: 'ui_buttons', filenamePattern: 'click_soft', gameCategory: 'ui', gameSoundId: 'click_soft', volume: 0.18, channel: 'ui', cooldown: 50, priority: 5 },
  { dbCategory: 'ui_buttons', filenamePattern: 'click_toggle_off', gameCategory: 'ui', gameSoundId: 'toggle_off', volume: 0.20, channel: 'ui', cooldown: 100, priority: 5 },
  { dbCategory: 'ui_buttons', filenamePattern: 'click_toggle_on', gameCategory: 'ui', gameSoundId: 'toggle_on', volume: 0.20, channel: 'ui', cooldown: 100, priority: 5 },
  
  // Equip
  { dbCategory: 'ui_equip', filenamePattern: 'equip_accessory', gameCategory: 'ui', gameSoundId: 'equip_accessory', volume: 0.22, channel: 'ui', cooldown: 200, priority: 4 },
  { dbCategory: 'ui_equip', filenamePattern: 'equip_clothing', gameCategory: 'ui', gameSoundId: 'equip_clothing', volume: 0.20, channel: 'ui', cooldown: 200, priority: 4 },
  { dbCategory: 'ui_equip', filenamePattern: 'equip_helmet', gameCategory: 'ui', gameSoundId: 'equip_helmet', volume: 0.22, channel: 'ui', cooldown: 200, priority: 4 },
  { dbCategory: 'ui_equip', filenamePattern: 'unequip_weapon', gameCategory: 'ui', gameSoundId: 'unequip_weapon', volume: 0.22, channel: 'ui', cooldown: 200, priority: 4 },
  
  // Inventory
  { dbCategory: 'ui_inventory', filenamePattern: 'bag_close', gameCategory: 'ui', gameSoundId: 'bag_close', volume: 0.22, channel: 'ui', cooldown: 300, priority: 4 },
  { dbCategory: 'ui_inventory', filenamePattern: 'bag_open', gameCategory: 'ui', gameSoundId: 'bag_open', volume: 0.22, channel: 'ui', cooldown: 300, priority: 4 },
  { dbCategory: 'ui_inventory', filenamePattern: 'item_drop', gameCategory: 'ui', gameSoundId: 'item_drop', volume: 0.25, channel: 'ui', cooldown: 200, priority: 5 },
  
  // Resources
  { dbCategory: 'ui_resources', filenamePattern: 'coins_count', gameCategory: 'ui', gameSoundId: 'coins_count', volume: 0.18, channel: 'ui', cooldown: 500, priority: 4 },
  { dbCategory: 'ui_resources', filenamePattern: 'coins_drop', gameCategory: 'ui', gameSoundId: 'coins_drop', volume: 0.22, channel: 'ui', cooldown: 300, priority: 4 },
  { dbCategory: 'ui_resources', filenamePattern: 'coins_pickup', gameCategory: 'ui', gameSoundId: 'coins_pickup', volume: 0.25, channel: 'ui', cooldown: 200, priority: 5 },
];

// All mappings combined
export const ALL_SOUND_MAPPINGS = [...WEATHER_SOUND_MAPPINGS, ...UI_SOUND_MAPPINGS];

/**
 * Find the mapping for a database sound
 */
export function findMappingForSound(category: string, filename: string): GeneratedSoundMapping | null {
  // Extract just the filename without path
  const cleanFilename = filename.includes('/') ? filename.split('/').pop() || filename : filename;
  
  return ALL_SOUND_MAPPINGS.find(m => 
    m.dbCategory === category && cleanFilename.includes(m.filenamePattern)
  ) || null;
}

/**
 * Get the sound key for playing through audioEngine
 * Returns the database path format: category/filename
 */
export function getDbSoundKey(category: string, filename: string): string {
  if (filename.includes('/')) {
    return filename;
  }
  return `${category}/${filename}`;
}

/**
 * Weather condition to sound mappings
 */
export const WEATHER_CONDITION_SOUNDS: Record<string, string[]> = {
  clear: ['weather_clear/clear_breeze_light', 'weather_clear/clear_day_birds_1'],
  sunny: ['weather_clear/clear_day_birds_1', 'weather_clear/clear_day_cicadas'],
  cloudy: ['weather_clear/clear_breeze_light'],
  overcast: ['weather_fog/fog_ambient_1'],
  fog: ['weather_fog/fog_ambient_1', 'weather_fog/fog_eerie_1'],
  mist: ['weather_fog/fog_ambient_1'],
  drizzle: ['weather_rain/rain_drizzle_loop'],
  rain: ['weather_rain/rain_medium_loop'],
  light_rain: ['weather_rain/rain_light_loop'],
  heavy_rain: ['weather_rain/rain_heavy_loop'],
  storm: ['weather_storm/storm_ambient_loop', 'weather_storm/storm_rain_loop'],
  thunderstorm: ['weather_storm/storm_ambient_loop'],
  snow: ['weather_snow/snow_falling_loop'],
  blizzard: ['weather_snow/blizzard_loop'],
  hail: ['weather_hail/hail_light_loop'],
  wind: ['weather_wind/wind_medium_loop'],
  windy: ['weather_wind/wind_medium_loop'],
};

/**
 * Time of day ambient sounds
 */
export const TIME_OF_DAY_SOUNDS: Record<string, string[]> = {
  dawn: ['weather_clear/clear_day_birds_1'],
  morning: ['weather_clear/clear_day_birds_2', 'weather_clear/clear_breeze_light'],
  afternoon: ['weather_clear/clear_day_cicadas'],
  evening: ['weather_clear/clear_breeze_light'],
  night: ['weather_clear/clear_night_crickets'],
};
