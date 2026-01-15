// Fashion Reputation System - Tracks player's fashion consistency and unlocks perks

export type FashionLevel = 
  | 'fashion_disaster'
  | 'poorly_dressed'
  | 'average'
  | 'well_dressed'
  | 'fashionable'
  | 'fashion_icon';

export interface FashionPerk {
  id: string;
  name: string;
  description: string;
  requiredLevel: FashionLevel;
  type: 'dialogue' | 'discount' | 'access' | 'stat_bonus';
  effect?: {
    stat?: string;
    value?: number;
    dialogueTag?: string;
    discountPercent?: number;
  };
}

export interface FashionInteraction {
  timestamp: Date;
  npcId: string;
  wasPositive: boolean;
  scoreChange: number;
  context?: string;
}

export interface FashionReputation {
  score: number;
  level: FashionLevel;
  streak: number;
  history: FashionInteraction[];
  unlockedPerks: string[];
  genreScores: Record<string, number>;
}

// Level thresholds
export const FASHION_LEVELS: { level: FashionLevel; minScore: number; label: string; description: string; icon: string; color: string }[] = [
  { level: 'fashion_disaster', minScore: -100, label: 'Fashion Disaster', description: 'Your outfit choices are... memorable for the wrong reasons.', icon: '💀', color: 'text-destructive' },
  { level: 'poorly_dressed', minScore: -25, label: 'Poorly Dressed', description: 'You could use some wardrobe advice.', icon: '😬', color: 'text-orange-500' },
  { level: 'average', minScore: 0, label: 'Average', description: 'Your clothing is unremarkable but acceptable.', icon: '😐', color: 'text-muted-foreground' },
  { level: 'well_dressed', minScore: 25, label: 'Well Dressed', description: 'People notice your good fashion sense.', icon: '😊', color: 'text-success' },
  { level: 'fashionable', minScore: 75, label: 'Fashionable', description: 'Your style turns heads and opens doors.', icon: '✨', color: 'text-primary' },
  { level: 'fashion_icon', minScore: 150, label: 'Fashion Icon', description: 'Your legendary sense of style precedes you.', icon: '👑', color: 'text-warning' },
];

// Available perks
export const FASHION_PERKS: FashionPerk[] = [
  {
    id: 'first_impressions',
    name: 'First Impressions',
    description: 'NPCs start with a slightly better opinion of you.',
    requiredLevel: 'well_dressed',
    type: 'stat_bonus',
    effect: { stat: 'charisma', value: 1 },
  },
  {
    id: 'shop_discount',
    name: 'Fashion Insider',
    description: 'Clothing shops offer you 10% discount.',
    requiredLevel: 'well_dressed',
    type: 'discount',
    effect: { discountPercent: 10 },
  },
  {
    id: 'vip_access',
    name: 'VIP Access',
    description: 'Exclusive venues and events are more likely to let you in.',
    requiredLevel: 'fashionable',
    type: 'access',
    effect: { dialogueTag: 'vip_fashion' },
  },
  {
    id: 'fashion_dialogue',
    name: 'Style Influence',
    description: 'Unlock special dialogue options related to fashion and status.',
    requiredLevel: 'fashionable',
    type: 'dialogue',
    effect: { dialogueTag: 'fashion_expert' },
  },
  {
    id: 'elite_discount',
    name: 'Elite Customer',
    description: 'All shops offer you 20% discount.',
    requiredLevel: 'fashion_icon',
    type: 'discount',
    effect: { discountPercent: 20 },
  },
  {
    id: 'commanding_presence',
    name: 'Commanding Presence',
    description: 'Your presence alone can sway opinions. +3 to all social checks.',
    requiredLevel: 'fashion_icon',
    type: 'stat_bonus',
    effect: { stat: 'charisma', value: 3 },
  },
  {
    id: 'fashion_immunity',
    name: 'Above Reproach',
    description: 'Your fashion is so impeccable that minor social faux pas are forgiven.',
    requiredLevel: 'fashion_icon',
    type: 'dialogue',
    effect: { dialogueTag: 'fashion_immunity' },
  },
];

type FashionListener = (state: FashionReputation) => void;

const FASHION_STORAGE_KEY = 'fashion_reputation';

class FashionReputationManagerClass {
  private state: FashionReputation;
  private listeners: Set<FashionListener> = new Set();

  constructor() {
    this.state = this.loadState();
  }

  private loadState(): FashionReputation {
    try {
      const saved = localStorage.getItem(FASHION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          history: parsed.history.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp),
          })),
        };
      }
    } catch (e) {
      console.error('Failed to load fashion reputation:', e);
    }

    return this.getDefaultState();
  }

  private getDefaultState(): FashionReputation {
    return {
      score: 0,
      level: 'average',
      streak: 0,
      history: [],
      unlockedPerks: [],
      genreScores: {},
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(FASHION_STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save fashion reputation:', e);
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  subscribe(listener: FashionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): FashionReputation {
    return { ...this.state };
  }

  recordInteraction(npcId: string, wasPositive: boolean, context?: string): void {
    const baseChange = wasPositive ? 5 : -3;
    const streakBonus = wasPositive && this.state.streak > 0 ? Math.min(this.state.streak, 5) : 0;
    const scoreChange = baseChange + streakBonus;

    const interaction: FashionInteraction = {
      timestamp: new Date(),
      npcId,
      wasPositive,
      scoreChange,
      context,
    };

    this.state.history.push(interaction);
    
    // Keep only last 50 interactions
    if (this.state.history.length > 50) {
      this.state.history = this.state.history.slice(-50);
    }

    this.state.score += scoreChange;
    
    // Update streak
    if (wasPositive) {
      this.state.streak++;
    } else {
      this.state.streak = 0;
    }

    this.updateLevel();
    this.checkPerkUnlocks();
    this.saveState();
    this.notify();
  }

  private updateLevel(): void {
    let newLevel: FashionLevel = 'fashion_disaster';
    
    for (const levelDef of FASHION_LEVELS) {
      if (this.state.score >= levelDef.minScore) {
        newLevel = levelDef.level;
      }
    }

    this.state.level = newLevel;
  }

  private checkPerkUnlocks(): void {
    const levelIndex = FASHION_LEVELS.findIndex(l => l.level === this.state.level);
    
    for (const perk of FASHION_PERKS) {
      if (this.state.unlockedPerks.includes(perk.id)) continue;
      
      const requiredIndex = FASHION_LEVELS.findIndex(l => l.level === perk.requiredLevel);
      if (levelIndex >= requiredIndex) {
        this.state.unlockedPerks.push(perk.id);
      }
    }
  }

  getLevelInfo(): { level: FashionLevel; label: string; description: string; icon: string; color: string } {
    const levelDef = FASHION_LEVELS.find(l => l.level === this.state.level);
    return levelDef || FASHION_LEVELS[2]; // Default to 'average'
  }

  getUnlockedPerks(): FashionPerk[] {
    return FASHION_PERKS.filter(p => this.state.unlockedPerks.includes(p.id));
  }

  getLockedPerks(): FashionPerk[] {
    return FASHION_PERKS.filter(p => !this.state.unlockedPerks.includes(p.id));
  }

  hasPerk(perkId: string): boolean {
    return this.state.unlockedPerks.includes(perkId);
  }

  getDiscount(): number {
    let totalDiscount = 0;
    for (const perkId of this.state.unlockedPerks) {
      const perk = FASHION_PERKS.find(p => p.id === perkId);
      if (perk?.type === 'discount' && perk.effect?.discountPercent) {
        totalDiscount = Math.max(totalDiscount, perk.effect.discountPercent);
      }
    }
    return totalDiscount;
  }

  getStatBonuses(): Record<string, number> {
    const bonuses: Record<string, number> = {};
    
    for (const perkId of this.state.unlockedPerks) {
      const perk = FASHION_PERKS.find(p => p.id === perkId);
      if (perk?.type === 'stat_bonus' && perk.effect?.stat && perk.effect?.value) {
        bonuses[perk.effect.stat] = (bonuses[perk.effect.stat] || 0) + perk.effect.value;
      }
    }
    
    return bonuses;
  }

  getDialogueTags(): string[] {
    const tags: string[] = [];
    
    for (const perkId of this.state.unlockedPerks) {
      const perk = FASHION_PERKS.find(p => p.id === perkId);
      if ((perk?.type === 'dialogue' || perk?.type === 'access') && perk.effect?.dialogueTag) {
        tags.push(perk.effect.dialogueTag);
      }
    }
    
    return tags;
  }

  // For AI context
  buildFashionContext(): string {
    const levelInfo = this.getLevelInfo();
    const lines: string[] = [
      `Fashion Reputation: ${levelInfo.label} (${this.state.score} points)`,
      levelInfo.description,
    ];

    if (this.state.streak > 2) {
      lines.push(`Currently on a ${this.state.streak}-interaction positive streak!`);
    }

    const perks = this.getUnlockedPerks();
    if (perks.length > 0) {
      lines.push('\nActive fashion perks:');
      for (const perk of perks) {
        lines.push(`- ${perk.name}: ${perk.description}`);
      }
    }

    return lines.join('\n');
  }

  reset(): void {
    this.state = this.getDefaultState();
    this.saveState();
    this.notify();
  }
}

export const fashionReputationManager = new FashionReputationManagerClass();
