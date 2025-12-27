import { useState, useEffect } from 'react';
import { NPC, EmotionalState } from '@/types/game';
import { X, Heart, Shield, Eye, Award, MessageCircle, Loader2, User, Sparkles, HelpCircle, Pencil, Check, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  calculateRelationshipDisplay,
  getRelationshipStatusLabel,
  getRomanceLevelLabel,
  getRelationshipLabel,
  RelationshipDisplayData,
  RELATIONSHIP_COLORS,
} from '@/lib/relationshipSystem';
import {
  NPCKnowledgeEntry,
  KnowledgeLevel,
  formatStatValue,
  getDisplayName,
} from '@/lib/knowledgeSystem';
import { isAdultContentEnabled } from '@/lib/gameSettings';
import { 
  getRegisteredNPC, 
  setPlayerNickname, 
  getNPCDisplayName,
  getNPCAliases,
  NPCAliases,
  NPCCharacterStats,
  resolveNPCId,
} from '@/game/npcIdentityRegistry';
import { getStatModifier } from '@/types/rpgCharacter';

interface CharacterProfileModalProps {
  npc: NPC;
  onClose: () => void;
  onStartConversation?: (npc: NPC) => void;
  playerLocation?: string;
  knowledge?: NPCKnowledgeEntry;
}

function getEmotionLabel(emotion: EmotionalState): string {
  const labels: Record<string, string> = {
    calm: '😐 Calm',
    anxious: '😰 Anxious',
    angry: '😠 Angry',
    fearful: '😨 Fearful',
    happy: '😊 Happy',
    sad: '😢 Sad',
    hopeful: '🙏 Hopeful',
    desperate: '😫 Desperate',
    numb: '😶 Numb',
    vigilant: '👀 Vigilant',
    content: '😌 Content',
    bitter: '😤 Bitter',
    nostalgic: '🥺 Nostalgic',
    suspicious: '🤨 Suspicious'
  };
  return labels[emotion] || emotion;
}

function ProfileStat({ label, value, knowledgeLevel }: { label: string; value: string | number; knowledgeLevel?: KnowledgeLevel }) {
  const isUnknown = knowledgeLevel === 'unknown';
  const isEstimated = knowledgeLevel === 'estimated';
  
  return (
    <div className={cn('profile-stat', isUnknown && 'stat-unknown', isEstimated && 'stat-estimated')}>
      <span className="label">{label}</span>
      <span className={cn('value', isUnknown && 'mystery-text', isEstimated && 'estimated-text')}>
        {isUnknown ? '???' : isEstimated ? `~${value}` : value}
      </span>
    </div>
  );
}

// Enhanced relationship bar with gradient and glow
function RelationshipBar({ 
  label, 
  value, 
  min = -100,
  max = 100,
  color, 
  icon,
  inverted = false,
  special = false
}: { 
  label: string; 
  value: number;
  min?: number;
  max?: number;
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'pink' | 'rose' | 'magenta';
  icon: string;
  inverted?: boolean;
  special?: boolean;
}) {
  const range = max - min;
  const normalized = ((value - min) / range) * 100;
  const displayValue = Math.round(value);
  
  const colorClasses: Record<string, { gradient: string; glow: string }> = {
    emerald: { gradient: 'linear-gradient(90deg, #059669, #10b981)', glow: 'rgba(16, 185, 129, 0.4)' },
    blue: { gradient: 'linear-gradient(90deg, #2563eb, #3b82f6)', glow: 'rgba(59, 130, 246, 0.4)' },
    amber: { gradient: 'linear-gradient(90deg, #d97706, #f59e0b)', glow: 'rgba(245, 158, 11, 0.4)' },
    red: { gradient: 'linear-gradient(90deg, #dc2626, #ef4444)', glow: 'rgba(239, 68, 68, 0.4)' },
    pink: { gradient: 'linear-gradient(90deg, #db2777, #ec4899)', glow: 'rgba(236, 72, 153, 0.4)' },
    rose: { gradient: 'linear-gradient(90deg, #e11d48, #f43f5e)', glow: 'rgba(244, 63, 94, 0.4)' },
    magenta: { gradient: 'linear-gradient(90deg, #a21caf, #d946ef)', glow: 'rgba(217, 70, 239, 0.5)' }
  };
  
  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className={cn('rel-bar-container', inverted && 'inverted', special && 'special')}>
      <div className="rel-bar-header">
        <span className="rel-bar-icon">{icon}</span>
        <span className="rel-bar-label">{label}</span>
        <span className="rel-bar-value">{displayValue}</span>
      </div>
      <div className="rel-bar-track">
        <div 
          className={cn('rel-bar-fill', special && 'special-glow')}
          style={{ 
            width: `${Math.max(0, Math.min(100, normalized))}%`,
            background: colors.gradient,
            boxShadow: `0 0 8px ${colors.glow}`
          }}
        />
        {min < 0 && <div className="rel-bar-center-mark" />}
      </div>
    </div>
  );
}

// Relationship spectrum visualization
function RelationshipSpectrum({ relData, npc }: { relData: RelationshipDisplayData; npc: NPC }) {
  const markerPosition = Math.max(5, Math.min(95, ((relData.overall + 100) / 200) * 100));
  const isRomanceable = (npc as any).isRomanceable !== false;
  
  return (
    <div className="relationship-spectrum">
      <div className="spectrum-labels">
        <span className="spectrum-label hatred">Hatred</span>
        <span className="spectrum-label neutral">Neutral</span>
        <span className="spectrum-label beloved">Beloved</span>
      </div>
      
      <div className="spectrum-bar">
        {/* Gradient background */}
        <div className="spectrum-gradient">
          <div className="grad-hatred" />
          <div className="grad-dislike" />
          <div className="grad-neutral" />
          <div className="grad-friendly" />
          <div className="grad-beloved" />
        </div>
        
        {/* Pink overlay for romance */}
        {relData.romanceUnlocked && (
          <div 
            className="romance-overlay"
            style={{
              opacity: Math.min(1, relData.romance / 100),
            }}
          />
        )}
        
        {/* Position marker */}
        <div 
          className="spectrum-marker"
          style={{
            left: `${markerPosition}%`,
            background: relData.colors.gradient,
            boxShadow: `0 0 12px ${relData.colors.glow}`
          }}
        >
          {relData.romanceUnlocked && relData.romance > 30 && (
            <Heart className="marker-heart h-3 w-3" />
          )}
        </div>
      </div>
      
      {/* Romance threshold indicator */}
      {isRomanceable && (
        <div className="romance-threshold-indicator">
          <div className={cn('threshold-line', relData.romanceUnlocked ? 'unlocked' : 'locked')} />
          <span className={cn('threshold-label', relData.romanceUnlocked ? 'unlocked' : 'locked')}>
            {relData.romanceUnlocked ? '💕 Romance Available' : '🔒 Romance Locked'}
          </span>
        </div>
      )}
    </div>
  );
}

// Character Stats Display Component
function CharacterStatsDisplay({ stats }: { stats: NPCCharacterStats }) {
  const statList: { key: keyof typeof stats.stats; label: string; icon: string }[] = [
    { key: 'strength', label: 'STR', icon: '💪' },
    { key: 'dexterity', label: 'DEX', icon: '🏃' },
    { key: 'constitution', label: 'CON', icon: '❤️' },
    { key: 'intelligence', label: 'INT', icon: '🧠' },
    { key: 'wisdom', label: 'WIS', icon: '👁️' },
    { key: 'charisma', label: 'CHA', icon: '✨' },
  ];

  return (
    <div className="character-stats-grid">
      {statList.map(({ key, label, icon }) => {
        const value = stats.stats[key];
        const mod = getStatModifier(value);
        return (
          <div key={key} className="stat-box">
            <span className="stat-icon">{icon}</span>
            <span className="stat-label">{label}</span>
            <span className="stat-value">{value}</span>
            <span className={cn('stat-mod', mod >= 0 ? 'positive' : 'negative')}>
              {mod >= 0 ? '+' : ''}{mod}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function CharacterProfileModal({
  npc,
  onClose,
  onStartConversation,
  playerLocation,
  knowledge
}: CharacterProfileModalProps) {
  const [portrait, setPortrait] = useState<string | null>(npc.portrait || null);
  const [isLoading, setIsLoading] = useState(!npc.portrait);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');

  const relData = calculateRelationshipDisplay(npc);
  const isHere = npc.currentLocation === playerLocation;
  const isAdultEnabled = isAdultContentEnabled();
  
  // Get registry data for this NPC
  const npcId = resolveNPCId(npc.meta.name, { occupation: npc.meta.occupation });
  const registeredNpc = getRegisteredNPC(npcId);
  const aliases = registeredNpc?.permanent.aliases;
  const characterStats = registeredNpc?.permanent.characterStats;
  
  // Get display name based on knowledge
  const displayName = aliases?.playerNickname || (knowledge ? getDisplayName(knowledge, npc) : npc.meta.name);
  const knowsName = knowledge?.knowsName ?? true;
  const familiarity = knowledge?.familiarity ?? 100;

  // Initialize nickname input with current player nickname
  useEffect(() => {
    if (aliases?.playerNickname) {
      setNicknameInput(aliases.playerNickname);
    }
  }, [aliases?.playerNickname]);

  const handleSaveNickname = () => {
    const trimmed = nicknameInput.trim();
    setPlayerNickname(npcId, trimmed || undefined);
    setIsEditingNickname(false);
  };

  // Load portrait if not available
  useEffect(() => {
    if (!npc.portrait) {
      const generatePortrait = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-npc-portrait`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ npc }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
              setPortrait(data.imageUrl);
            }
          }
        } catch (error) {
          console.error('Failed to generate portrait:', error);
        } finally {
          setIsLoading(false);
        }
      };

      generatePortrait();
    }
  }, [npc]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="profile-overlay" onClick={handleBackdropClick}>
      <div 
        className={cn('profile-modal animate-scale-in', relData.displayColor)}
        onClick={e => e.stopPropagation()}
        style={{
          '--sheet-rel-primary': relData.colors.primary,
          '--sheet-rel-secondary': relData.colors.secondary,
          '--sheet-rel-glow': relData.colors.glow,
          '--sheet-rel-gradient': relData.colors.gradient
        } as React.CSSProperties}
      >
        {/* Close button */}
        <button className="profile-close" onClick={onClose} aria-label="Close profile">
          <X className="h-5 w-5" />
        </button>

        {/* Portrait Section */}
        <div className="profile-portrait-section">
          {/* Top accent bar */}
          <div 
            className="sheet-top-accent"
            style={{ background: relData.colors.gradient }}
          />
          
          <div 
            className={cn(
              'profile-portrait-frame',
              relData.romanceUnlocked && 'romance-active'
            )}
            style={{
              borderColor: relData.colors.primary,
              boxShadow: `0 0 30px ${relData.colors.glow}, 0 10px 40px rgba(0,0,0,0.5)`
            }}
          >
            {isLoading ? (
              <div className="portrait-loading">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Generating...</span>
              </div>
            ) : portrait ? (
              <>
                <img
                  src={portrait}
                  alt={npc.meta.name}
                  className="profile-portrait-image"
                />
                {/* Romance sparkles */}
                {relData.romance >= 60 && (
                  <div className="romance-sparkles">
                    <span className="sparkle">✨</span>
                    <span className="sparkle">✨</span>
                    <span className="sparkle">✨</span>
                  </div>
                )}
              </>
            ) : (
              <div className="portrait-loading">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Romance badge */}
          {relData.romanceUnlocked && relData.romance > 0 && (
            <div 
              className={cn('romance-badge', relData.romanceLevel)}
              style={{ 
                background: relData.colors.gradient,
                boxShadow: `0 0 15px ${relData.colors.glow}`
              }}
            >
              <Heart className="h-4 w-4" />
              <span>{getRomanceLevelLabel(relData.romanceLevel)}</span>
            </div>
          )}

          {/* Mood indicator */}
          <div className={cn('profile-mood', `mood-${npc.emotionalState.current}`)}>
            {getEmotionLabel(npc.emotionalState.current)}
          </div>
        </div>

        {/* Info Section */}
        <div className="profile-info-section">
          {/* Header with nickname editor */}
          <div className="profile-header">
            <div className="profile-name-row">
              {isEditingNickname ? (
                <div className="nickname-editor">
                  <Input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    placeholder="Enter nickname..."
                    className="nickname-input"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveNickname();
                      if (e.key === 'Escape') setIsEditingNickname(false);
                    }}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="nickname-save-btn"
                    onClick={handleSaveNickname}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h2 
                    className="profile-name"
                    style={{ textShadow: `0 0 20px ${relData.colors.glow}` }}
                  >
                    {displayName}
                    {aliases?.playerNickname && (
                      <span className="real-name-hint"> ({npc.meta.name})</span>
                    )}
                    {!knowsName && !aliases?.playerNickname && (
                      <span className="name-unknown-hint"> (name unknown)</span>
                    )}
                  </h2>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="nickname-edit-btn"
                    onClick={() => {
                      setNicknameInput(aliases?.playerNickname || '');
                      setIsEditingNickname(true);
                    }}
                    title="Set nickname"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Show aliases if any */}
            {aliases && (aliases.callsign || aliases.nickname || aliases.title) && (
              <div className="aliases-row">
                {aliases.title && <span className="alias-tag title">{aliases.title}</span>}
                {aliases.callsign && <span className="alias-tag callsign">"{aliases.callsign}"</span>}
                {aliases.nickname && !aliases.playerNickname && (
                  <span className="alias-tag nickname">aka {aliases.nickname}</span>
                )}
              </div>
            )}
            
            <span className="profile-title">
              {knowledge?.background.occupation === 'known' ? npc.meta.occupation : 
               knowledge?.background.occupation === 'estimated' ? `~${npc.meta.occupation}` : 
               familiarity > 15 ? npc.meta.occupation : '???'}
            </span>
          </div>

          {/* RELATIONSHIP SECTION */}
          <div className="profile-section relationship-section">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Heart className="h-4 w-4" style={{ color: relData.colors.primary }} />
              Relationship
            </h3>
            
            {/* Visual relationship spectrum */}
            <RelationshipSpectrum relData={relData} npc={npc} />
            
            {/* Relationship bars */}
            <div className="relationship-bars">
              <RelationshipBar 
                label="Trust" 
                value={relData.trust} 
                color="emerald"
                icon="🤝"
              />
              <RelationshipBar 
                label="Respect" 
                value={relData.respect} 
                color="blue"
                icon="👑"
              />
              <RelationshipBar 
                label="Familiarity" 
                value={relData.familiarity} 
                min={0}
                max={100}
                color="amber"
                icon="👁️"
              />
              
              {/* Fear bar (only if significant) */}
              {relData.fear > 10 && (
                <RelationshipBar 
                  label="Fear" 
                  value={relData.fear} 
                  min={0}
                  max={100}
                  color="red"
                  icon="😨"
                  inverted
                />
              )}
              
              {/* Romance bars - only if romance unlocked AND adult content enabled */}
              {relData.romanceUnlocked && isAdultEnabled && (
                <>
                  <div className="romance-bars-divider">
                    <span>💕 Romance</span>
                  </div>
                  
                  <RelationshipBar 
                    label="Attraction" 
                    value={relData.attraction} 
                    color="pink"
                    icon="✨"
                  />
                  <RelationshipBar 
                    label="Intimacy" 
                    value={relData.intimacy} 
                    min={0}
                    max={100}
                    color="rose"
                    icon="💗"
                  />
                  <RelationshipBar 
                    label="Romance" 
                    value={relData.romance} 
                    min={0}
                    max={100}
                    color="magenta"
                    icon="💕"
                    special={relData.romanceLevel === 'soulmate'}
                  />
                </>
              )}
            </div>
            
            {/* Relationship status */}
            <div className="relationship-status-display">
              <span className="status-label">Status:</span>
              <span 
                className={cn('status-value', relData.displayColor)}
                style={{ color: relData.colors.primary }}
              >
                {getRelationshipStatusLabel(relData.status)}
              </span>
            </div>
          </div>

          {/* Character Stats Section - Same system as player */}
          {characterStats && familiarity >= 30 && (
            <div className="profile-section">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Swords className="h-4 w-4 text-primary" />
                Attributes
                <span className="text-xs text-muted-foreground ml-auto">
                  Lv.{characterStats.level}
                </span>
              </h3>
              <CharacterStatsDisplay stats={characterStats} />
              <div className="health-display mt-2">
                <span className="health-label">HP:</span>
                <span className="health-value">
                  {characterStats.currentHealth}/{characterStats.maxHealth}
                </span>
              </div>
            </div>
          )}

          {/* Basic Info */}
          <div className="profile-section">
            <h3>Basic Info</h3>
            <div className="profile-stats">
              <ProfileStat 
                label="Age" 
                value={npc.meta.age} 
                knowledgeLevel={familiarity > 10 ? 'known' : 'estimated'}
              />
              <ProfileStat 
                label="Location" 
                value={npc.currentLocation.replace(/_/g, ' ')} 
              />
            </div>
            <p className="profile-activity">
              Currently: <span className="italic">{npc.currentActivity}</span>
            </p>
          </div>
          
          {/* Familiarity indicator */}
          {knowledge && (
            <div className="profile-section">
              <h3>
                <Eye className="inline h-4 w-4 mr-2" />
                Familiarity
              </h3>
              <div className="familiarity-bar">
                <div className="bar-track">
                  <div 
                    className="bar-fill"
                    style={{ 
                      width: `${familiarity}%`,
                      background: 'var(--accent-gradient)',
                      boxShadow: '0 0 10px var(--accent-glow)'
                    }}
                  />
                </div>
                <span className="familiarity-value">{familiarity}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {familiarity < 20 ? 'You barely know this person.' :
                 familiarity < 40 ? 'You have a passing acquaintance.' :
                 familiarity < 60 ? 'You know them fairly well.' :
                 familiarity < 80 ? 'You know them quite well.' :
                 'You know them intimately.'}
              </p>
            </div>
          )}

          {/* Description */}
          <div className="profile-section">
            <h3>Description</h3>
            <p className="profile-description">{npc.meta.description}</p>
          </div>

          {/* Personality */}
          <div className="profile-section">
            <h3>Personality</h3>
            <div className="profile-traits">
              {npc.meta.traits.map(trait => (
                <span key={trait} className="trait-tag">{trait}</span>
              ))}
            </div>
          </div>

          {/* Expandable Details */}
          <div className="profile-section">
            <button
              className="expand-details-btn"
              onClick={() => setDetailsExpanded(!detailsExpanded)}
            >
              {detailsExpanded ? '▼ Hide Details' : '▶ Show More Details'}
            </button>

            {detailsExpanded && (
              <div className="expanded-details animate-fade-in">
                <div className="detail-group">
                  <h4>Current State</h4>
                  <div className="profile-stats">
                    <ProfileStat label="Emotion" value={npc.emotionalState.current} />
                    <ProfileStat label="Baseline" value={npc.emotionalState.baseline} />
                    <ProfileStat label="Stress" value={`${npc.stressLevel}/100`} />
                  </div>
                </div>

                {npc.knownFacts && npc.knownFacts.length > 0 && (
                  <div className="detail-group">
                    <h4>What You Know</h4>
                    <ul className="known-facts">
                      {npc.knownFacts.slice(0, 5).map((fact, i) => (
                        <li key={i} className={`fact-${fact.reliability}`}>
                          {fact.fact}
                          {fact.reliability !== 'witnessed' && (
                            <span className="reliability-tag">({fact.reliability})</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-group">
                  <h4>Identity</h4>
                  <p className="text-sm text-muted-foreground">{npc.identity.selfStory}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="profile-actions">
          {isHere && onStartConversation && (
            <Button
              className="profile-action-btn glow-button"
              onClick={() => {
                onStartConversation(npc);
                onClose();
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Talk
            </Button>
          )}
          
          {/* Romance action button */}
          {relData.romanceUnlocked && relData.romance > 20 && isHere && (
            <Button
              className="profile-action-btn romance-button"
              style={{ 
                background: relData.colors.gradient,
                boxShadow: `0 0 15px ${relData.colors.glow}`
              }}
              onClick={() => {
                // Could trigger flirt action
                onClose();
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Flirt
            </Button>
          )}
          
          <Button
            variant="secondary"
            className="profile-action-btn"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
