// ============================================================================
// FASHION REPUTATION SYSTEM
// Tracks how consistently players dress well and unlocks dialogue options
// ============================================================================

import { ClothingReaction, evaluateClothingConflict, ClothingContext } from './clothingReactionSystem';
import { eventBus } from './eventBus';
import { GameGenre } from '@/types/genreData';

// ============================================================================
// TYPES
// ============================================================================

export interface FashionReputation {
  score: number; // -100 to 100
  level: FashionLevel;
  streak: number; // Consecutive positive interactions
  history: FashionInteraction[];
  unlockedPerks: string[];
  genreScores: Partial<Record<GameGenre, number>>;
}

export type FashionLevel = 
  | 'fashion_disaster'   // -100 to -50
  | 'poorly_dressed'     // -49 to -20
  | 'unremarkable'       // -19 to 19
  | 'well_dressed'       // 20 to 49
  | 'fashionable'        // 50 to 79
  | 'fashion_icon';      // 80 to 100

export interface FashionInteraction {
  timestamp: number;
  npcName?: string;
  reaction: ClothingReaction['severity'];
  scoreChange: number;
  genre: string;
}

export interface FashionPerk {
  id: string;
  name: string;
  description: string;
  requiredLevel: FashionLevel;
  requiredScore?: number;
  effect: FashionPerkEffect;
}

export interface FashionPerkEffect {
  type: 'dialogue' | 'discount' | 'access' | 'stat' | 'special';
  dialogueOptions?: string[];
  discountPercent?: number;
  accessLocations?: string[];
  statBonus?: Record<string, number>;
  specialEffect?: string;
}

// ============================================================================
// PERKS DATABASE
// ============================================================================

export const FASHION_PERKS: FashionPerk[] = [
  {
    id: 'small_talk',
    name: 'Fashion Small Talk',
    description: 'Unlock casual dialogue about clothing and style.',
    requiredLevel: 'well_dressed',
    effect: {
      type: 'dialogue',
      dialogueOptions: [
        '\"I notice you have good taste in clothing.\"',
        '\"Your style is quite refined for these parts.\"'
      ]
    }
  },
  {
    id: 'merchant_discount',
    name: "Merchant's Favor",
    description: 'Get 10% off at clothing shops due to your reputation.',
    requiredLevel: 'well_dressed',
    effect: {
      type: 'discount',
      discountPercent: 10
    }
  },
  {
    id: 'noble_notice',
    name: 'Noticed by Nobility',
    description: 'Nobles and high society members treat you as an equal.',
    requiredLevel: 'fashionable',
    effect: {
      type: 'dialogue',
      dialogueOptions: [
        '\"Ah, finally someone who understands proper attire.\"',
        '\"You must join us at the next gathering. We need more people with your sensibilities.\"'
      ]
    }
  },
  {
    id: 'exclusive_access',
    name: 'VIP Access',
    description: 'Gain entry to exclusive venues based on appearance alone.',
    requiredLevel: 'fashionable',
    effect: {
      type: 'access',
      accessLocations: ['noble_district', 'exclusive_club', 'high_society_party']
    }
  },
  {
    id: 'fashion_consultant',
    name: 'Fashion Consultant',
    description: 'NPCs ask for your fashion advice, opening unique interactions.',
    requiredLevel: 'fashion_icon',
    effect: {
      type: 'special',
      specialEffect: 'NPCs may approach asking for style advice'
    }
  },
  {
    id: 'intimidating_presence',
    name: 'Intimidating Presence',
    description: 'Your confident style adds +3 to intimidation checks.',
    requiredLevel: 'fashionable',
    effect: {
      type: 'stat',
      statBonus: { intimidation: 3 }
    }
  },
  {
    id: 'charismatic_aura',
    name: 'Charismatic Aura',
    description: 'Being a fashion icon adds +5 to charisma in social encounters.',
    requiredLevel: 'fashion_icon',
    effect: {
      type: 'stat',
      statBonus: { charisma: 5, persuasion: 3 }
    }
  },
  {
    id: 'brand_ambassador',
    name: 'Brand Ambassador',
    description: 'Merchants offer you 25% discount and may give free samples.',
    requiredLevel: 'fashion_icon',
    effect: {
      type: 'discount',
      discountPercent: 25
    }
  }
];

// ============================================================================
// FASHION REPUTATION MANAGER
// ============================================================================

class FashionReputationManagerClass {
  private state: FashionReputation;
  private currentGenre: GameGenre = 'fantasy';
  private listeners: ((state: FashionReputation) => void)[] = [];

  constructor() {
    this.state = this.createDefaultState();
  }

  private createDefaultState(): FashionReputation {
    return {
      score: 0,
      level: 'unremarkable',
      streak: 0,
      history: [],
      unlockedPerks: [],
      genreScores: {}
    };
  }

  // ========== CORE FUNCTIONALITY ==========
  
  initialize(genre: GameGenre): void {
    this.currentGenre = genre;
    this.checkAndUnlockPerks();
  }

  setGenre(genre: GameGenre): void {
    this.currentGenre = genre;
  }

  recordInteraction(
    reaction: ClothingReaction,
    npcName?: string
  ): void {
    let scoreChange = 0;
    
    switch (reaction.severity) {
      case 'positive':
        scoreChange = 5 + Math.min(10, this.state.streak);
        this.state.streak++;
        break;
      case 'none':
        scoreChange = 1;
        // Maintain streak on neutral
        break;
      case 'mild':
        scoreChange = -2;
        this.state.streak = Math.max(0, this.state.streak - 1);
        break;
      case 'moderate':
        scoreChange = -5;
        this.state.streak = 0;
        break;
      case 'severe':
        scoreChange = -10;
        this.state.streak = 0;
        break;
    }
    
    // Apply change
    this.state.score = Math.max(-100, Math.min(100, this.state.score + scoreChange));
    
    // Update genre-specific score
    const genreScore = this.state.genreScores[this.currentGenre] || 0;
    this.state.genreScores[this.currentGenre] = Math.max(-100, Math.min(100, genreScore + scoreChange));
    
    // Record history
    this.state.history.push({
      timestamp: Date.now(),
      npcName,
      reaction: reaction.severity,
      scoreChange,
      genre: this.currentGenre
    });
    
    // Keep history manageable
    if (this.state.history.length > 100) {
      this.state.history = this.state.history.slice(-100);
    }
    
    // Update level
    this.updateLevel();
    this.checkAndUnlockPerks();
    this.notifyListeners();
    
    // Emit event for significant changes
    if (Math.abs(scoreChange) >= 5) {
      eventBus.emit('fashion:reputation_change', {
        change: scoreChange,
        newScore: this.state.score,
        newLevel: this.state.level
      });
    }
  }

  private updateLevel(): void {
    const score = this.state.score;
    let newLevel: FashionLevel;
    
    if (score <= -50) newLevel = 'fashion_disaster';
    else if (score <= -20) newLevel = 'poorly_dressed';
    else if (score <= 19) newLevel = 'unremarkable';
    else if (score <= 49) newLevel = 'well_dressed';
    else if (score <= 79) newLevel = 'fashionable';
    else newLevel = 'fashion_icon';
    
    if (newLevel !== this.state.level) {
      const oldLevel = this.state.level;
      this.state.level = newLevel;
      
      eventBus.emit('fashion:level_change', {
        oldLevel,
        newLevel
      });
    }
  }

  private checkAndUnlockPerks(): void {
    const levelOrder: FashionLevel[] = [
      'fashion_disaster', 'poorly_dressed', 'unremarkable',
      'well_dressed', 'fashionable', 'fashion_icon'
    ];
    
    const currentIndex = levelOrder.indexOf(this.state.level);
    
    for (const perk of FASHION_PERKS) {
      if (this.state.unlockedPerks.includes(perk.id)) continue;
      
      const requiredIndex = levelOrder.indexOf(perk.requiredLevel);
      if (currentIndex >= requiredIndex) {
        if (!perk.requiredScore || this.state.score >= perk.requiredScore) {
          this.state.unlockedPerks.push(perk.id);
          
          eventBus.emit('fashion:perk_unlocked', {
            perkId: perk.id,
            perkName: perk.name
          });
        }
      }
    }
  }

  // ========== GETTERS ==========
  
  getState(): FashionReputation {
    return { ...this.state };
  }

  getScore(): number {
    return this.state.score;
  }

  getLevel(): FashionLevel {
    return this.state.level;
  }

  getStreak(): number {
    return this.state.streak;
  }

  getUnlockedPerks(): FashionPerk[] {
    return FASHION_PERKS.filter(p => this.state.unlockedPerks.includes(p.id));
  }

  getLockedPerks(): FashionPerk[] {
    return FASHION_PERKS.filter(p => !this.state.unlockedPerks.includes(p.id));
  }

  getTotalStatBonuses(): Record<string, number> {
    const bonuses: Record<string, number> = {};
    
    for (const perk of this.getUnlockedPerks()) {
      if (perk.effect.type === 'stat' && perk.effect.statBonus) {
        for (const [stat, value] of Object.entries(perk.effect.statBonus)) {
          bonuses[stat] = (bonuses[stat] || 0) + value;
        }
      }
    }
    
    return bonuses;
  }

  getDiscount(): number {
    let maxDiscount = 0;
    
    for (const perk of this.getUnlockedPerks()) {
      if (perk.effect.type === 'discount' && perk.effect.discountPercent) {
        maxDiscount = Math.max(maxDiscount, perk.effect.discountPercent);
      }
    }
    
    return maxDiscount;
  }

  hasAccess(location: string): boolean {
    for (const perk of this.getUnlockedPerks()) {
      if (perk.effect.type === 'access' && perk.effect.accessLocations?.includes(location)) {
        return true;
      }
    }
    return false;
  }

  getAvailableDialogueOptions(): string[] {
    const options: string[] = [];
    
    for (const perk of this.getUnlockedPerks()) {
      if (perk.effect.type === 'dialogue' && perk.effect.dialogueOptions) {
        options.push(...perk.effect.dialogueOptions);
      }
    }
    
    return options;
  }

  getLevelInfo(): { label: string; description: string; icon: string; color: string } {
    const levelInfo: Record<FashionLevel, { label: string; description: string; icon: string; color: string }> = {
      fashion_disaster: {
        label: 'Fashion Disaster',
        description: 'Your clothing choices regularly offend NPCs',
        icon: '💀',
        color: 'text-destructive'
      },
      poorly_dressed: {
        label: 'Poorly Dressed',
        description: 'You often draw negative attention for your attire',
        icon: '😬',
        color: 'text-orange-500'
      },
      unremarkable: {
        label: 'Unremarkable',
        description: 'Your clothing neither impresses nor offends',
        icon: '😐',
        color: 'text-muted-foreground'
      },
      well_dressed: {
        label: 'Well Dressed',
        description: 'You consistently make good fashion choices',
        icon: '😊',
        color: 'text-success'
      },
      fashionable: {
        label: 'Fashionable',
        description: 'Your style is noticed and admired',
        icon: '✨',
        color: 'text-primary'
      },
      fashion_icon: {
        label: 'Fashion Icon',
        description: 'Your legendary style opens doors everywhere',
        icon: '👑',
        color: 'text-warning'
      }
    };
    
    return levelInfo[this.state.level];
  }

  // ========== SERIALIZATION ==========
  
  serialize(): string {
    return JSON.stringify(this.state);
  }

  deserialize(data: string): void {
    try {
      this.state = JSON.parse(data);
      this.notifyListeners();
    } catch (e) {
      console.error('[FASHION] Failed to deserialize:', e);
    }
  }

  // ========== LISTENERS ==========
  
  subscribe(callback: (state: FashionReputation) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const fashionReputationManager = new FashionReputationManagerClass();

// ============================================================================
// AI CONTEXT BUILDER
// ============================================================================

export function buildFashionReputationContext(): string {
  const state = fashionReputationManager.getState();
  const levelInfo = fashionReputationManager.getLevelInfo();
  
  if (state.level === 'unremarkable') {
    return ''; // No special context needed
  }
  
  const lines: string[] = [
    '### FASHION REPUTATION',
    `Player is known as: ${levelInfo.label} (${levelInfo.description})`,
    `Reputation Score: ${state.score}/100`,
  ];
  
  if (state.streak > 3) {
    lines.push(`Currently on a ${state.streak}-interaction positive streak`);
  }
  
  const perks = fashionReputationManager.getUnlockedPerks();
  if (perks.length > 0) {
    lines.push('');
    lines.push('**Unlocked Fashion Perks:**');
    for (const perk of perks) {
      lines.push(`- ${perk.name}: ${perk.description}`);
    }
  }
  
  // Guidance for AI
  lines.push('');
  if (state.score >= 50) {
    lines.push('**Guidance:** NPCs should treat player with more respect due to their reputation as a stylish individual. Some may ask for fashion advice or mention hearing about them.');
  } else if (state.score <= -30) {
    lines.push('**Guidance:** NPCs may make snide remarks about player\'s reputation for poor fashion choices. Some might refuse service or treat them with disdain.');
  }
  
  return lines.join('\n');
}
