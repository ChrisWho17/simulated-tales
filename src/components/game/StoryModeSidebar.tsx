import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  Heart, User, Package, Users, Sparkles, Activity,
  Frown, Meh, Smile, Laugh, Brain, Zap, Shield,
  Eye, Swords, MessageCircle, Droplet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GameState, NPC, Relationship } from '@/types/game';
import { Wound } from '@/game/diceSystem';
import { BodyInjury } from '@/types/lifeSim';

// ============================================================================
// TYPES
// ============================================================================

interface StoryModeSidebarProps {
  gameState: GameState;
  isOpen: boolean;
  onToggle: () => void;
  portrait?: string;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface SidebarSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  badge?: number;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({ 
  title, icon, children, collapsible = false, defaultCollapsed = false, badge 
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  
  return (
    <div className="space-y-2">
      <div 
        className={cn(
          "flex items-center gap-2 text-xs font-medium text-[var(--accent-secondary)]",
          collapsible && "cursor-pointer hover:text-[var(--accent-primary)] transition-colors"
        )}
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        {icon}
        <span className="uppercase tracking-wider flex-1">{title}</span>
        {badge !== undefined && badge > 0 && (
          <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] rounded-full">
            {badge}
          </span>
        )}
        {collapsible && (
          <span className="text-muted-foreground">
            {collapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </span>
        )}
      </div>
      {!collapsed && <div className="space-y-2">{children}</div>}
    </div>
  );
};

interface StatBarProps {
  label: string;
  current: number;
  max: number;
  color: string;
  icon?: React.ReactNode;
  showValue?: boolean;
}

const StatBar: React.FC<StatBarProps> = ({ 
  label, current, max, color, icon, showValue = true 
}) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  const isCritical = percentage < 25;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span>{label}</span>
        </div>
        {showValue && (
          <span className="text-foreground font-medium text-[11px]">{Math.round(current)}/{max}</span>
        )}
      </div>
      <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
            isCritical && "animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const MoodIcon: React.FC<{ mood: number }> = ({ mood }) => {
  if (mood >= 80) return <Laugh className="w-4 h-4 text-emerald-400" />;
  if (mood >= 60) return <Smile className="w-4 h-4 text-green-400" />;
  if (mood >= 40) return <Meh className="w-4 h-4 text-yellow-400" />;
  if (mood >= 20) return <Frown className="w-4 h-4 text-orange-400" />;
  return <Frown className="w-4 h-4 text-red-400" />;
};

const getMoodText = (mood: number): string => {
  if (mood >= 80) return 'Excellent';
  if (mood >= 60) return 'Good';
  if (mood >= 40) return 'Okay';
  if (mood >= 20) return 'Low';
  return 'Critical';
};

interface BuffDebuffTagProps {
  type: 'buff' | 'debuff';
  name: string;
  description?: string;
}

const BuffDebuffTag: React.FC<BuffDebuffTagProps> = ({ type, name, description }) => (
  <div 
    className={cn(
      "px-2 py-1 rounded text-xs border flex items-center gap-1.5",
      type === 'buff' 
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" 
        : "border-red-500/40 bg-red-500/10 text-red-300"
    )}
    title={description}
  >
    <span>{type === 'buff' ? '↑' : '↓'}</span>
    <span>{name}</span>
  </div>
);

interface WoundTagProps {
  wound: Wound;
}

const WoundTag: React.FC<WoundTagProps> = ({ wound }) => {
  const severityColors: Record<number, string> = {
    1: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-200',
    2: 'border-orange-500/50 bg-orange-500/10 text-orange-200',
    3: 'border-red-500/50 bg-red-500/10 text-red-200',
    4: 'border-red-700/50 bg-red-700/10 text-red-100'
  };
  
  return (
    <div className={cn(
      "px-2 py-1 rounded text-xs border",
      severityColors[wound.severity] || severityColors[1],
      wound.treated && "opacity-60"
    )}>
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3" />
        <span className="font-medium">{wound.type}</span>
        {wound.treated && <span className="text-[10px]">(treated)</span>}
      </div>
      <span className="text-[10px] opacity-70">({wound.location})</span>
    </div>
  );
};

interface RelationshipCardProps {
  npc: NPC;
  relationship: Relationship;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({ npc, relationship }) => {
  const getRelationshipLevel = (r: Relationship): { label: string; color: string } => {
    const total = r.affection + r.trust + r.respect - r.fear;
    if (total >= 150) return { label: 'Close Friend', color: 'text-emerald-400' };
    if (total >= 75) return { label: 'Friend', color: 'text-green-400' };
    if (total >= 25) return { label: 'Acquaintance', color: 'text-blue-400' };
    if (total >= -25) return { label: 'Neutral', color: 'text-muted-foreground' };
    if (total >= -75) return { label: 'Disliked', color: 'text-orange-400' };
    return { label: 'Enemy', color: 'text-red-400' };
  };
  
  const level = getRelationshipLevel(relationship);
  
  return (
    <div className="p-2 rounded-lg bg-black/20 border border-border/30 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{npc.meta.name}</span>
        <span className={cn("text-[10px]", level.color)}>{level.label}</span>
      </div>
      <div className="text-[10px] text-muted-foreground">{npc.meta.occupation}</div>
      <div className="grid grid-cols-4 gap-1 text-[9px]">
        <div className="text-center">
          <div className="text-pink-400">♥</div>
          <div>{relationship.affection}</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400">⚡</div>
          <div>{relationship.trust}</div>
        </div>
        <div className="text-center">
          <div className="text-amber-400">★</div>
          <div>{relationship.respect}</div>
        </div>
        <div className="text-center">
          <div className="text-red-400">!</div>
          <div>{relationship.fear}</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StoryModeSidebar: React.FC<StoryModeSidebarProps> = ({
  gameState,
  isOpen,
  onToggle,
  portrait
}) => {
  const player = gameState.player;
  const lifeSim = gameState.lifeSim;
  
  // Convert body injuries to wounds for display
  const wounds: Wound[] = useMemo(() => {
    if (!lifeSim?.body?.injuries) return [];
    return lifeSim.body.injuries.map((injury: BodyInjury, index: number) => ({
      id: `injury_${index}`,
      type: injury.description || 'Injury',
      location: injury.location,
      severity: Math.ceil(injury.severity / 25), // Convert 0-100 to 1-4
      treated: injury.age > 24, // Assume treated if more than a day old
      healingProgress: Math.max(0, 100 - injury.severity),
    }));
  }, [lifeSim?.body?.injuries]);
  
  // Calculate buffs and debuffs from various sources - memoized for reactivity
  const buffsDebuffs = useMemo(() => {
    const effects: { type: 'buff' | 'debuff'; name: string; description: string }[] = [];
    
    if (lifeSim) {
      // Physical needs effects
      if (lifeSim.needs.physical.hunger > 70) {
        effects.push({ type: 'debuff', name: 'Hungry', description: 'Hunger is affecting your focus' });
      }
      if (lifeSim.needs.physical.thirst > 70) {
        effects.push({ type: 'debuff', name: 'Thirsty', description: 'Dehydration is setting in' });
      }
      if (lifeSim.needs.physical.energy < 30) {
        effects.push({ type: 'debuff', name: 'Exhausted', description: 'Low energy reduces effectiveness' });
      }
      if (lifeSim.needs.physical.hygiene < 30) {
        effects.push({ type: 'debuff', name: 'Dirty', description: 'Poor hygiene affects social interactions' });
      }
      if (lifeSim.needs.physical.health < 50) {
        effects.push({ type: 'debuff', name: 'Injured', description: 'Poor health affects all activities' });
      }
      
      // Psychological effects
      if (lifeSim.needs.psychological.stress > 70) {
        effects.push({ type: 'debuff', name: 'Stressed', description: 'High stress impairs decision making' });
      }
      if (lifeSim.needs.psychological.tension > 70) {
        effects.push({ type: 'debuff', name: 'Tense', description: 'High tension is distracting' });
      }
      if (lifeSim.needs.psychological.social < 30) {
        effects.push({ type: 'debuff', name: 'Lonely', description: 'Lack of social interaction' });
      }
      if (lifeSim.needs.psychological.comfort > 80) {
        effects.push({ type: 'buff', name: 'Comfortable', description: 'Feeling safe and relaxed' });
      }
      if (lifeSim.needs.psychological.fulfillment > 70) {
        effects.push({ type: 'buff', name: 'Fulfilled', description: 'Sense of purpose boosts morale' });
      }
      
      // Body condition effects
      if (lifeSim.body?.fitness && lifeSim.body.fitness > 70) {
        effects.push({ type: 'buff', name: 'Fit', description: 'Physical fitness improves stamina' });
      }
      if (lifeSim.body?.attractiveness && lifeSim.body.attractiveness > 70) {
        effects.push({ type: 'buff', name: 'Charming', description: 'Natural charm aids social encounters' });
      }
      if (lifeSim.body?.grooming && lifeSim.body.grooming > 80) {
        effects.push({ type: 'buff', name: 'Well-groomed', description: 'Good grooming improves impressions' });
      }
      if (lifeSim.body?.visibleFatigue) {
        effects.push({ type: 'debuff', name: 'Visibly Tired', description: 'Others can see you\'re exhausted' });
      }
      if (lifeSim.body?.visibleDistress) {
        effects.push({ type: 'debuff', name: 'Distressed', description: 'Your distress is visible to others' });
      }
      
      // Scars as permanent marks
      if (lifeSim.body?.scars && lifeSim.body.scars.length > 0) {
        effects.push({ type: 'debuff', name: `Scarred (${lifeSim.body.scars.length})`, description: lifeSim.body.scars.map(s => s.description).join(', ') });
      }
    }
    
    // Wound effects
    wounds.forEach(wound => {
      if (!wound.treated) {
        effects.push({ type: 'debuff', name: `${wound.type}`, description: `Untreated wound on ${wound.location}` });
      }
    });
    
    return effects;
  }, [lifeSim, wounds]);
  
  // Get known NPCs with relationships - memoized
  const knownNPCs = useMemo(() => {
    const npcs: { npc: NPC; relationship: Relationship }[] = [];
    
    Object.values(gameState.npcs).forEach(npc => {
      const playerRel = npc.relationships.player;
      if (playerRel && (playerRel.affection !== 0 || playerRel.trust !== 0 || playerRel.respect !== 0 || playerRel.fear !== 0)) {
        npcs.push({ npc, relationship: playerRel });
      }
    });
    
    // Sort by total relationship strength
    return npcs.sort((a, b) => {
      const totalA = Math.abs(a.relationship.affection) + Math.abs(a.relationship.trust) + Math.abs(a.relationship.respect);
      const totalB = Math.abs(b.relationship.affection) + Math.abs(b.relationship.trust) + Math.abs(b.relationship.respect);
      return totalB - totalA;
    });
  }, [gameState.npcs]);
  
  // Get inventory items
  const inventoryItems = player.inventory || [];
  
  // Calculate stats - these will update whenever gameState changes
  const health = lifeSim?.needs.physical.health ?? player.stats.health;
  const maxHealth = 100;
  const energy = lifeSim?.needs.physical.energy ?? player.stats.energy;
  const mood = player.stats.mood;
  const gold = player.stats.gold ?? 0;
  
  // Location and time info
  const currentLocation = gameState.locations[player.currentLocation];
  const locationName = currentLocation?.name ?? 'Unknown Location';
  const { hour, day, season } = gameState.time;
  const timeOfDay = hour < 6 ? 'Night' : hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const timeDisplay = `Day ${day}, ${String(hour).padStart(2, '0')}:00 (${timeOfDay})`;
  
  return (
    <>
      {/* Toggle Button - Always visible */}
      <button 
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-30 w-6 h-16 rounded-r-lg bg-background/95 border border-l-0 border-border flex items-center justify-center hover:bg-muted transition-all duration-300 backdrop-blur-sm",
          isOpen ? "left-72" : "left-0"
        )}
        onClick={onToggle}
        title={isOpen ? "Close sidebar" : "Open character panel"}
      >
        {isOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
      
      {/* Sidebar Panel */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-20 transition-transform duration-300 ease-in-out",
        "w-72 bg-background/95 backdrop-blur-md border-r border-border shadow-xl",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header with Portrait */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-b from-muted/30 to-transparent">
          <div className="flex items-start gap-3">
            {/* Portrait Frame */}
            <div className="relative shrink-0">
              <div 
                className="w-16 h-20 rounded-lg border-2 border-primary/50 overflow-hidden flex items-center justify-center bg-black/30"
                style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.2)' }}
              >
                {portrait ? (
                  <img src={portrait} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              
              {/* Health overlay on portrait */}
              <div 
                className="absolute inset-0 rounded-lg bg-gradient-to-t from-red-900/70 to-transparent pointer-events-none transition-all duration-500"
                style={{ 
                  height: `${100 - (health / maxHealth) * 100}%`,
                  top: 'auto',
                  bottom: 0 
                }}
              />
              
              {/* Wound count badge */}
              {wounds.length > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">{wounds.length}</span>
                </div>
              )}
            </div>
            
            {/* Name and Mood */}
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-foreground truncate text-lg">{player.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <MoodIcon mood={mood} />
                <span className="text-sm text-muted-foreground">{getMoodText(mood)}</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-amber-400 text-sm">
                <span>💰</span>
                <span>{gold} gold</span>
              </div>
            </div>
          </div>
          
          {/* Location and Time Bar */}
          <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">📍</span>
              <span className="text-foreground font-medium truncate">{locationName}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>🕐</span>
              <span>{timeDisplay}</span>
              <span className="capitalize">• {season}</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <ScrollArea className="h-[calc(100%-180px)]">
          <div className="p-4 space-y-5">
            
            {/* Health & Vitals */}
            <SidebarSection title="Health" icon={<Heart size={12} />}>
              <StatBar 
                label="Health" 
                current={health} 
                max={maxHealth} 
                color="bg-gradient-to-r from-emerald-500 to-teal-400"
                icon={<span className="text-[10px]">❤️</span>}
              />
              <StatBar 
                label="Energy" 
                current={energy} 
                max={100} 
                color="bg-gradient-to-r from-yellow-500 to-orange-400"
                icon={<span className="text-[10px]">⚡</span>}
              />
              {lifeSim && (
                <>
                  <StatBar 
                    label="Hunger" 
                    current={100 - lifeSim.needs.physical.hunger} 
                    max={100} 
                    color="bg-gradient-to-r from-amber-500 to-orange-400"
                    icon={<span className="text-[10px]">🍖</span>}
                  />
                  <StatBar 
                    label="Thirst" 
                    current={100 - lifeSim.needs.physical.thirst} 
                    max={100} 
                    color="bg-gradient-to-r from-blue-500 to-cyan-400"
                    icon={<span className="text-[10px]">💧</span>}
                  />
                </>
              )}
            </SidebarSection>
            
            {/* Injuries */}
            {wounds.length > 0 && (
              <SidebarSection title="Injuries" icon={<Activity size={12} />} badge={wounds.length}>
                <div className="flex flex-wrap gap-1.5">
                  {wounds.map((wound, i) => (
                    <WoundTag key={wound.id || i} wound={wound} />
                  ))}
                </div>
              </SidebarSection>
            )}
            
            {/* Buffs & Debuffs */}
            {buffsDebuffs.length > 0 && (
              <SidebarSection 
                title="Effects" 
                icon={<Sparkles size={12} />} 
                collapsible 
                badge={buffsDebuffs.length}
              >
                <div className="flex flex-wrap gap-1.5">
                  {buffsDebuffs.map((effect, i) => (
                    <BuffDebuffTag 
                      key={i} 
                      type={effect.type} 
                      name={effect.name}
                      description={effect.description}
                    />
                  ))}
                </div>
              </SidebarSection>
            )}
            
            {/* Mood Details */}
            {lifeSim && (
              <SidebarSection title="Mental State" icon={<Brain size={12} />} collapsible>
                <StatBar 
                  label="Stress" 
                  current={100 - lifeSim.needs.psychological.stress} 
                  max={100} 
                  color="bg-gradient-to-r from-purple-500 to-pink-400"
                  icon={<span className="text-[10px]">😰</span>}
                />
                <StatBar 
                  label="Comfort" 
                  current={lifeSim.needs.psychological.comfort} 
                  max={100} 
                  color="bg-gradient-to-r from-indigo-500 to-purple-400"
                  icon={<span className="text-[10px]">🛋️</span>}
                />
                <StatBar 
                  label="Social" 
                  current={lifeSim.needs.psychological.social} 
                  max={100} 
                  color="bg-gradient-to-r from-pink-500 to-rose-400"
                  icon={<span className="text-[10px]">👥</span>}
                />
              </SidebarSection>
            )}
            
            {/* Inventory */}
            <SidebarSection 
              title="Inventory" 
              icon={<Package size={12} />} 
              collapsible 
              badge={inventoryItems.length}
            >
              {inventoryItems.length > 0 ? (
                <div className="space-y-1">
                  {inventoryItems.slice(0, 8).map((item, i) => (
                    <div 
                      key={item.id || i} 
                      className="flex items-center gap-2 px-2 py-1.5 rounded bg-black/20 border border-border/30 text-xs"
                    >
                      <span className="text-muted-foreground">
                        {item.type === 'weapon' && '⚔️'}
                        {item.type === 'consumable' && '🧪'}
                        {item.type === 'key' && '🔑'}
                        {item.type === 'valuable' && '💎'}
                        {item.type === 'misc' && '📦'}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                      {item.value > 0 && (
                        <span className="text-amber-400 text-[10px]">{item.value}g</span>
                      )}
                    </div>
                  ))}
                  {inventoryItems.length > 8 && (
                    <div className="text-center text-[10px] text-muted-foreground pt-1">
                      +{inventoryItems.length - 8} more items
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No items
                </div>
              )}
            </SidebarSection>
            
            {/* People I Know */}
            <SidebarSection 
              title="People I Know" 
              icon={<Users size={12} />} 
              collapsible 
              defaultCollapsed
              badge={knownNPCs.length}
            >
              {knownNPCs.length > 0 ? (
                <div className="space-y-2">
                  {knownNPCs.slice(0, 5).map(({ npc, relationship }) => (
                    <RelationshipCard key={npc.id} npc={npc} relationship={relationship} />
                  ))}
                  {knownNPCs.length > 5 && (
                    <div className="text-center text-[10px] text-muted-foreground pt-1">
                      +{knownNPCs.length - 5} more people
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No known relationships yet
                </div>
              )}
            </SidebarSection>
            
          </div>
        </ScrollArea>
      </aside>
    </>
  );
};

export default StoryModeSidebar;
