// Comprehensive Romance and Relationship Visualization System
import { NPC, Relationship } from '@/types/game';

// Extended relationship structure with romance
export interface ExtendedRelationship extends Relationship {
  familiarity?: number;  // 0-100
  attraction?: number;   // -100 to 100
  intimacy?: number;     // 0-100
  romance?: number;      // -100 to 100
}

export type RelationshipColorType = 
  | 'hatred' | 'hostile' | 'disliked' | 'neutral' 
  | 'friendly' | 'warm' | 'beloved'
  | 'attracted' | 'crushing' | 'romantic' | 'in_love' | 'soulmate';

export type RomanceLevel = 'none' | 'potential' | 'flirting' | 'dating' | 'committed' | 'soulmate';

export type RelationshipStatus = 
  | 'enemy' | 'hostile' | 'disliked' | 'neutral' | 'acquaintance' 
  | 'friendly' | 'friend' | 'close_friend' 
  | 'romantic_interest' | 'lover' | 'partner';

export interface RelationshipColors {
  primary: string;
  secondary: string;
  glow: string;
  gradient: string;
}

export interface RelationshipDisplayData {
  overall: number;
  baseColor: RelationshipColorType;
  displayColor: RelationshipColorType;
  romanceUnlocked: boolean;
  romanceLevel: RomanceLevel;
  trust: number;
  respect: number;
  fear: number;
  familiarity: number;
  attraction: number;
  intimacy: number;
  romance: number;
  status: RelationshipStatus;
  colors: RelationshipColors;
}

// Color definitions for each relationship state
export const RELATIONSHIP_COLORS: Record<RelationshipColorType, RelationshipColors> = {
  // Red spectrum (hatred to dislike)
  hatred: {
    primary: '#991b1b',
    secondary: '#dc2626',
    glow: 'rgba(153, 27, 27, 0.5)',
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)'
  },
  hostile: {
    primary: '#dc2626',
    secondary: '#ef4444',
    glow: 'rgba(220, 38, 38, 0.5)',
    gradient: 'linear-gradient(135deg, #b91c1c 0%, #ef4444 100%)'
  },
  disliked: {
    primary: '#ea580c',
    secondary: '#f97316',
    glow: 'rgba(234, 88, 12, 0.5)',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #f97316 100%)'
  },
  
  // Neutral
  neutral: {
    primary: '#64748b',
    secondary: '#94a3b8',
    glow: 'rgba(100, 116, 139, 0.3)',
    gradient: 'linear-gradient(135deg, #475569 0%, #94a3b8 100%)'
  },
  
  // Green spectrum (friendly to beloved)
  friendly: {
    primary: '#65a30d',
    secondary: '#84cc16',
    glow: 'rgba(101, 163, 13, 0.5)',
    gradient: 'linear-gradient(135deg, #4d7c0f 0%, #84cc16 100%)'
  },
  warm: {
    primary: '#16a34a',
    secondary: '#22c55e',
    glow: 'rgba(22, 163, 74, 0.5)',
    gradient: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
  },
  beloved: {
    primary: '#059669',
    secondary: '#10b981',
    glow: 'rgba(5, 150, 105, 0.5)',
    gradient: 'linear-gradient(135deg, #047857 0%, #10b981 100%)'
  },
  
  // Pink spectrum (romance)
  attracted: {
    primary: '#f472b6',
    secondary: '#f9a8d4',
    glow: 'rgba(244, 114, 182, 0.4)',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #f9a8d4 100%)'
  },
  crushing: {
    primary: '#ec4899',
    secondary: '#f472b6',
    glow: 'rgba(236, 72, 153, 0.5)',
    gradient: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)'
  },
  romantic: {
    primary: '#db2777',
    secondary: '#ec4899',
    glow: 'rgba(219, 39, 119, 0.5)',
    gradient: 'linear-gradient(135deg, #be185d 0%, #ec4899 100%)'
  },
  in_love: {
    primary: '#be185d',
    secondary: '#db2777',
    glow: 'rgba(190, 24, 93, 0.6)',
    gradient: 'linear-gradient(135deg, #9d174d 0%, #db2777 100%)'
  },
  soulmate: {
    primary: '#9d174d',
    secondary: '#be185d',
    glow: 'rgba(157, 23, 77, 0.7)',
    gradient: 'linear-gradient(135deg, #831843 0%, #be185d 100%)'
  }
};

// Check if romance is possible with this NPC
export function checkRomanceThreshold(npc: NPC, rel: ExtendedRelationship): boolean {
  // Check if NPC is romanceable (default to true if not specified)
  const isRomanceable = (npc as any).isRomanceable !== false;
  if (!isRomanceable) return false;
  
  // Romance requires sufficient trust (> 20)
  if ((rel.trust || 0) < 20) return false;
  
  // Romance requires sufficient familiarity (> 30)
  if ((rel.familiarity || 0) < 30) return false;
  
  // Romance requires some attraction (> 10)
  if ((rel.attraction || 0) < 10) return false;
  
  return true;
}

// Get romance level from romance value
export function getRomanceLevel(rel: ExtendedRelationship): RomanceLevel {
  const romance = rel.romance || 0;
  if (romance < 10) return 'none';
  if (romance < 25) return 'potential';
  if (romance < 45) return 'flirting';
  if (romance < 65) return 'dating';
  if (romance < 85) return 'committed';
  return 'soulmate';
}

// Get relationship status
export function getRelationshipStatus(rel: ExtendedRelationship): RelationshipStatus {
  const overall = ((rel.trust || 0) * 0.4) + ((rel.respect || 0) * 0.3) + ((rel.familiarity || 0) * 0.2) - ((rel.fear || 0) * 0.1);
  const romance = rel.romance || 0;
  
  // Romance statuses take priority if active
  if (romance >= 80) return 'partner';
  if (romance >= 50) return 'lover';
  if (romance >= 25) return 'romantic_interest';
  
  // Otherwise use overall feeling
  if (overall <= -60) return 'enemy';
  if (overall <= -30) return 'hostile';
  if (overall <= -10) return 'disliked';
  if (overall <= 10) return 'neutral';
  if (overall <= 25) return 'acquaintance';
  if (overall <= 45) return 'friendly';
  if (overall <= 65) return 'friend';
  return 'close_friend';
}

// Get relationship status label
export function getRelationshipStatusLabel(status: RelationshipStatus): string {
  const labels: Record<RelationshipStatus, string> = {
    enemy: 'Enemy',
    hostile: 'Hostile',
    disliked: 'Disliked',
    neutral: 'Neutral',
    acquaintance: 'Acquaintance',
    friendly: 'Friendly',
    friend: 'Friend',
    close_friend: 'Close Friend',
    romantic_interest: 'Romantic Interest',
    lover: 'Lover',
    partner: 'Partner'
  };
  return labels[status] || 'Unknown';
}

// Get romance level label
export function getRomanceLevelLabel(level: RomanceLevel): string {
  const labels: Record<RomanceLevel, string> = {
    none: '',
    potential: 'Potential',
    flirting: 'Flirting',
    dating: 'Dating',
    committed: 'Committed',
    soulmate: 'Soulmate'
  };
  return labels[level] || '';
}

// Get relationship display label
export function getRelationshipLabel(colorType: RelationshipColorType): string {
  const labels: Record<RelationshipColorType, string> = {
    hatred: 'Hated',
    hostile: 'Hostile',
    disliked: 'Disliked',
    neutral: 'Neutral',
    friendly: 'Friendly',
    warm: 'Warm',
    beloved: 'Beloved',
    attracted: 'Attracted',
    crushing: 'Crushing',
    romantic: 'Romantic',
    in_love: 'In Love',
    soulmate: 'Soulmate'
  };
  return labels[colorType] || 'Unknown';
}

// Get short emoji indicator for sidebar
export function getShortRelLabel(relData: RelationshipDisplayData): string {
  // Romance indicators take priority
  if (relData.romanceLevel === 'soulmate') return '💕';
  if (relData.romanceLevel === 'committed') return '💗';
  if (relData.romanceLevel === 'dating') return '💖';
  if (relData.romanceLevel === 'flirting') return '💓';
  if (relData.romanceUnlocked && relData.romance > 10) return '💗';
  
  // Non-romance indicators
  if (relData.overall <= -50) return '⚔️';
  if (relData.overall <= -20) return '😠';
  if (relData.overall <= 10) return '😐';
  if (relData.overall <= 40) return '🙂';
  if (relData.overall <= 70) return '😊';
  return '😄';
}

// Main calculation function
export function calculateRelationshipDisplay(npc: NPC): RelationshipDisplayData {
  const rel = (npc.relationships?.player || { affection: 0, trust: 0, fear: 0, respect: 0 }) as ExtendedRelationship;
  
  // Get values with defaults
  const trust = rel.trust || 0;
  const respect = rel.respect || 0;
  const fear = rel.fear || 0;
  const affection = rel.affection || 0;
  const familiarity = rel.familiarity ?? Math.max(0, (trust + affection) / 4 + 20); // Estimate if not set
  const attraction = rel.attraction ?? Math.max(-100, Math.min(100, affection * 0.5)); // Estimate from affection
  const intimacy = rel.intimacy ?? Math.max(0, Math.min(100, (trust + affection) / 4));
  const romance = rel.romance ?? (affection > 30 && trust > 20 ? affection * 0.3 : 0);
  
  // Calculate overall feeling (-100 to 100)
  const overall = Math.round(
    (trust * 0.4) + 
    (respect * 0.3) + 
    (familiarity * 0.2) - 
    (fear * 0.1)
  );
  
  // Determine base color (red to green spectrum)
  let baseColor: RelationshipColorType;
  if (overall <= -60) baseColor = 'hatred';
  else if (overall <= -30) baseColor = 'hostile';
  else if (overall <= -10) baseColor = 'disliked';
  else if (overall <= 10) baseColor = 'neutral';
  else if (overall <= 30) baseColor = 'friendly';
  else if (overall <= 60) baseColor = 'warm';
  else baseColor = 'beloved';
  
  // Check romance threshold
  const extendedRel: ExtendedRelationship = { ...rel, familiarity, attraction, intimacy, romance };
  const romanceUnlocked = checkRomanceThreshold(npc, extendedRel);
  const romanceLevel = getRomanceLevel(extendedRel);
  
  // If romance is active, override with pink spectrum
  let displayColor: RelationshipColorType = baseColor;
  if (romanceUnlocked && romance > 0) {
    if (romance >= 80) displayColor = 'soulmate';
    else if (romance >= 60) displayColor = 'in_love';
    else if (romance >= 40) displayColor = 'romantic';
    else if (romance >= 20) displayColor = 'crushing';
    else displayColor = 'attracted';
  }
  
  const status = getRelationshipStatus(extendedRel);
  const colors = RELATIONSHIP_COLORS[displayColor];
  
  return {
    overall,
    baseColor,
    displayColor,
    romanceUnlocked,
    romanceLevel,
    trust,
    respect,
    fear,
    familiarity,
    attraction,
    intimacy,
    romance,
    status,
    colors
  };
}
