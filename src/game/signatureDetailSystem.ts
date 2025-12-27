// Signature Detail System - One vivid, consistent detail per location
// Creates instant atmosphere through sensory anchors that persist

export interface SignatureDetail {
  locationId: string;
  detail: string;
  senseType: 'sight' | 'sound' | 'smell' | 'touch' | 'taste' | 'atmosphere';
  intensity: 'subtle' | 'notable' | 'overwhelming';
  createdAt: number;
  usageCount: number;
}

export interface SignatureDetailRegistry {
  details: Record<string, SignatureDetail>;
  lastUpdated: number;
}

// Genre-appropriate signature detail templates
const DETAIL_TEMPLATES: Record<string, { senses: string[]; adjectives: string[] }> = {
  inn: {
    senses: [
      'always smells like {adj} oranges and iron',
      'the floorboards creak in a rhythm like a {adj} heartbeat',
      'candlelight catches on {adj} stains no one will explain',
      'the ale here tastes of {adj} copper, always',
      'a draft from somewhere {adj} that no one can find',
    ],
    adjectives: ['burnt', 'sweet', 'rotting', 'ancient', 'wrong', 'familiar']
  },
  subway: {
    senses: [
      'hums like a dying animal that never quite dies',
      'the tiles are {adj} with something that wont wash off',
      'echoes here arrive before the sounds that made them',
      'smells of {adj} electricity and old newspapers',
      'the wind from the tunnels is always too {adj}',
    ],
    adjectives: ['stained', 'alive', 'warm', 'cold', 'wrong', 'ancient']
  },
  forest: {
    senses: [
      'the floor has too many bones for just deer',
      'trees here lean {adj}, as if listening',
      'birdsong stops exactly at this clearing',
      'the moss grows in {adj} patterns, almost like writing',
      'sunlight here feels {adj}, filtered through too much',
    ],
    adjectives: ['wrong', 'hungry', 'patient', 'familiar', 'arranged', 'alive']
  },
  alley: {
    senses: [
      'a single {adj} flower grows where nothing should',
      'the shadows here fall in the wrong direction',
      'graffiti that seems {adj} each time you look',
      'smells of {adj} rain even when its dry',
      'the walls hum with {adj} electricity from buried cables',
    ],
    adjectives: ['different', 'fresh', 'ancient', 'wrong', 'intentional', 'alive']
  },
  mansion: {
    senses: [
      'portraits eyes follow not you, but something behind you',
      'the {adj} smell of old perfume masks something else',
      'clocks here tick {adj}, never quite in sync',
      'dust motes drift {adj}, against the air currents',
      'the silence has a {adj} texture you can almost feel',
    ],
    adjectives: ['sweet', 'wrong', 'deliberately', 'upward', 'velvet', 'hungry']
  },
  market: {
    senses: [
      'one vendor sells things with no names, only descriptions',
      'the noise here has a {adj} rhythm, almost musical',
      'spices mask something {adj} beneath',
      'coins change temperature in your hand here',
      'shadows pool around one stall that has no owner',
    ],
    adjectives: ['practiced', 'rotting', 'sweet', 'wrong', 'ancient', 'deliberate']
  },
  church: {
    senses: [
      'incense cant quite cover the smell of {adj} earth',
      'candle flames bend toward the altar, always',
      'echoes here sound like {adj} whispers',
      'the stone is {adj} warm, even in winter',
      'stained glass casts colors that dont match the panels',
    ],
    adjectives: ['turned', 'answered', 'wrong', 'faintly', 'deliberately', 'hungry']
  },
  office: {
    senses: [
      'the fluorescent buzz has a {adj} frequency',
      'coffee here always tastes of {adj} static',
      'one plant thrives while all others die',
      'the elevator arrives before you press the button',
      'windows reflect rooms that arent quite this one',
    ],
    adjectives: ['wrong', 'familiar', 'old', 'different', 'hungry', 'patient']
  },
  generic: {
    senses: [
      'something here is {adj}, but you cant name it',
      'the air tastes {adj} at the back of your throat',
      'sounds arrive {adj}, slightly delayed',
      'shadows dont quite match their sources',
      'temperature shifts when you stand in one spot',
    ],
    adjectives: ['wrong', 'off', 'familiar', 'hungry', 'patient', 'watching']
  }
};

// Create empty registry
export function createSignatureDetailRegistry(): SignatureDetailRegistry {
  return {
    details: {},
    lastUpdated: Date.now()
  };
}

// Generate a signature detail for a location
export function generateSignatureDetail(
  locationId: string,
  locationType: string,
  locationName: string
): SignatureDetail {
  // Determine which template to use
  const templateKey = Object.keys(DETAIL_TEMPLATES).find(key => 
    locationType.toLowerCase().includes(key) || 
    locationName.toLowerCase().includes(key)
  ) || 'generic';
  
  const template = DETAIL_TEMPLATES[templateKey];
  
  // Pick random sense and adjective
  const senseTemplate = template.senses[Math.floor(Math.random() * template.senses.length)];
  const adjective = template.adjectives[Math.floor(Math.random() * template.adjectives.length)];
  
  // Fill in the template
  const detail = senseTemplate.replace('{adj}', adjective);
  
  // Determine sense type from content
  let senseType: SignatureDetail['senseType'] = 'atmosphere';
  if (detail.includes('smell') || detail.includes('taste')) senseType = 'smell';
  else if (detail.includes('sound') || detail.includes('hum') || detail.includes('echo')) senseType = 'sound';
  else if (detail.includes('see') || detail.includes('shadow') || detail.includes('light')) senseType = 'sight';
  else if (detail.includes('feel') || detail.includes('touch') || detail.includes('warm') || detail.includes('cold')) senseType = 'touch';
  
  return {
    locationId,
    detail,
    senseType,
    intensity: Math.random() > 0.7 ? 'overwhelming' : Math.random() > 0.4 ? 'notable' : 'subtle',
    createdAt: Date.now(),
    usageCount: 0
  };
}

// Get or create signature detail for a location
export function getSignatureDetail(
  registry: SignatureDetailRegistry,
  locationId: string,
  locationType: string = 'generic',
  locationName: string = ''
): { registry: SignatureDetailRegistry; detail: SignatureDetail } {
  // Return existing detail
  if (registry.details[locationId]) {
    const detail = {
      ...registry.details[locationId],
      usageCount: registry.details[locationId].usageCount + 1
    };
    return {
      registry: {
        ...registry,
        details: { ...registry.details, [locationId]: detail },
        lastUpdated: Date.now()
      },
      detail
    };
  }
  
  // Generate new detail
  const detail = generateSignatureDetail(locationId, locationType, locationName);
  return {
    registry: {
      ...registry,
      details: { ...registry.details, [locationId]: detail },
      lastUpdated: Date.now()
    },
    detail
  };
}

// Format detail for narrative injection
export function formatSignatureDetailForNarrative(detail: SignatureDetail, isReturn: boolean): string {
  const prefix = isReturn 
    ? "As always here, " 
    : detail.usageCount === 0 
      ? "You notice " 
      : "The familiar sense returns: ";
  
  const intensityMod = detail.intensity === 'overwhelming' 
    ? "Inescapably, " 
    : detail.intensity === 'notable' 
      ? "" 
      : "Faintly, ";
  
  return `${intensityMod}${prefix}${detail.detail}.`;
}

// Build context for AI prompt
export function buildSignatureDetailContext(
  registry: SignatureDetailRegistry,
  currentLocationId: string,
  previousLocationIds: string[] = []
): string {
  const lines: string[] = ['## SIGNATURE DETAILS (Atmosphere Hooks)'];
  
  const currentDetail = registry.details[currentLocationId];
  if (currentDetail) {
    lines.push('');
    lines.push('**Current Location Signature:**');
    lines.push(`- "${currentDetail.detail}"`);
    lines.push(`- Sense: ${currentDetail.senseType}, Intensity: ${currentDetail.intensity}`);
    lines.push(`- Times referenced: ${currentDetail.usageCount}`);
    if (currentDetail.usageCount > 0) {
      lines.push('- IMPORTANT: Reference this detail naturally - the player knows it');
    }
  }
  
  // Include details from recently visited locations
  const recentDetails = previousLocationIds
    .filter(id => registry.details[id])
    .slice(0, 3)
    .map(id => registry.details[id]);
  
  if (recentDetails.length > 0) {
    lines.push('');
    lines.push('**Recent Location Signatures (for contrast/memory):**');
    recentDetails.forEach(d => {
      lines.push(`- ${d.locationId}: "${d.detail}"`);
    });
  }
  
  lines.push('');
  lines.push('**RULES:**');
  lines.push('- When describing this location, weave in its signature detail');
  lines.push('- Use phrasing like "as always" or "that familiar..." for return visits');
  lines.push('- The detail is constant - never contradict or change it');
  lines.push('- One sensory hook creates more atmosphere than a paragraph');
  
  return lines.join('\n');
}

// Serialization
export function serializeSignatureDetails(registry: SignatureDetailRegistry): string {
  return JSON.stringify(registry);
}

export function deserializeSignatureDetails(data: string): SignatureDetailRegistry {
  try {
    return JSON.parse(data);
  } catch {
    return createSignatureDetailRegistry();
  }
}
