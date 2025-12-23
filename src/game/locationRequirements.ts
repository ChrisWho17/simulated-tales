// Location requirements for life sim actions

export interface LocationRequirement {
  requiredLocations: string[];
  errorMessage: string;
}

export const actionLocationRequirements: Record<string, LocationRequirement> = {
  sleep: {
    requiredLocations: ['home', 'inn', 'camp'],
    errorMessage: "You need to be at home, an inn, or a camp to sleep."
  },
  bathe: {
    requiredLocations: ['home', 'river', 'lake', 'bathhouse', 'inn'],
    errorMessage: "You need to be near water (river, lake, bathhouse) or at home/inn to bathe."
  },
  eat: {
    requiredLocations: ['home', 'tavern', 'inn', 'market', 'restaurant', 'camp'],
    errorMessage: "You need to be at a tavern, inn, market, restaurant, or home to eat."
  },
  drink: {
    requiredLocations: ['home', 'tavern', 'inn', 'well', 'river', 'lake', 'market'],
    errorMessage: "You need to be at a tavern, inn, well, or near water to drink."
  }
};

export function canPerformActionAtLocation(
  action: string,
  currentLocationId: string,
  locationTags: string[] = []
): { allowed: boolean; errorMessage?: string } {
  const requirement = actionLocationRequirements[action];
  
  if (!requirement) {
    return { allowed: true };
  }
  
  // Check if current location ID matches any required location
  const locationIdMatch = requirement.requiredLocations.some(
    loc => currentLocationId.toLowerCase().includes(loc.toLowerCase())
  );
  
  // Check if any location tags match required locations
  const tagMatch = requirement.requiredLocations.some(
    reqLoc => locationTags.some(tag => tag.toLowerCase().includes(reqLoc.toLowerCase()))
  );
  
  if (locationIdMatch || tagMatch) {
    return { allowed: true };
  }
  
  return { allowed: false, errorMessage: requirement.errorMessage };
}

// Helper to get location tags from a location
export function getLocationTags(locationId: string): string[] {
  const locationTagMap: Record<string, string[]> = {
    'town_square': ['market', 'well'],
    'marketplace': ['market', 'tavern'],
    'village': ['home', 'tavern', 'well'],
    'forest': ['river', 'camp'],
    'riverside': ['river', 'water'],
    'lakeside': ['lake', 'water'],
    'player_home': ['home'],
    'inn': ['inn', 'tavern'],
    'tavern': ['tavern'],
    'bathhouse': ['bathhouse', 'water'],
    'wilderness': ['camp'],
    'city': ['market', 'tavern', 'inn', 'bathhouse'],
    'starting_location': ['home', 'village', 'well'] // Allow basic actions at start
  };
  
  return locationTagMap[locationId] || [];
}
