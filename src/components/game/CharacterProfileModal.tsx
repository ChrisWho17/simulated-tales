import { useState, useEffect } from 'react';
import { NPC, Relationship, EmotionalState } from '@/types/game';
import { X, Heart, Shield, Eye, Award, MessageCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CharacterProfileModalProps {
  npc: NPC;
  onClose: () => void;
  onStartConversation?: (npc: NPC) => void;
  playerLocation?: string;
}

// Helper functions
function getRelationshipTier(npc: NPC): string {
  const rel = npc.relationships.player;
  if (!rel) return 'stranger';

  const trust = rel.trust || 0;
  const affection = rel.affection || 0;

  if (affection > 60 && trust > 50) return 'close_friend';
  if (affection > 30) return 'friend';
  if (trust > 10) return 'acquaintance';
  if (trust < -30) return 'enemy';
  if (trust < -10) return 'disliked';
  return 'stranger';
}

function getRelationshipLabel(npc: NPC): string {
  const tier = getRelationshipTier(npc);
  const labels: Record<string, string> = {
    'stranger': 'Stranger',
    'acquaintance': 'Acquaintance',
    'friend': 'Friend',
    'close_friend': 'Close Friend',
    'disliked': 'Disliked',
    'enemy': 'Enemy'
  };
  return labels[tier] || 'Unknown';
}

function getRelationshipClass(npc: NPC): string {
  const tier = getRelationshipTier(npc);
  const classes: Record<string, string> = {
    'stranger': 'rel-neutral',
    'acquaintance': 'rel-neutral',
    'friend': 'rel-friendly',
    'close_friend': 'rel-friendly',
    'disliked': 'rel-hostile',
    'enemy': 'rel-hostile'
  };
  return classes[tier] || 'rel-neutral';
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

function ProfileStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="profile-stat">
      <span className="label">{label}</span>
      <span className="value">{value}</span>
    </div>
  );
}

function RelationshipBar({ 
  label, 
  value, 
  color, 
  icon: Icon 
}: { 
  label: string; 
  value: number; 
  color: string;
  icon: React.ElementType;
}) {
  // Value ranges from -100 to 100, normalize to 0-100 for display
  const normalizedValue = Math.max(0, Math.min(100, value + 50));

  return (
    <div className="relationship-bar">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="label">{label}</span>
      <div className="bar-track">
        <div
          className={`bar-fill ${color}`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      <span className="bar-value">{value}</span>
    </div>
  );
}

export function CharacterProfileModal({
  npc,
  onClose,
  onStartConversation,
  playerLocation
}: CharacterProfileModalProps) {
  const [portrait, setPortrait] = useState<string | null>(npc.portrait || null);
  const [isLoading, setIsLoading] = useState(!npc.portrait);
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const relationship = npc.relationships.player || { affection: 0, trust: 0, fear: 0, respect: 0 };
  const isHere = npc.currentLocation === playerLocation;

  // Load portrait if not available
  useEffect(() => {
    if (!npc.portrait) {
      // Generate portrait
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

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
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
      <div className="profile-modal animate-scale-in" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button className="profile-close" onClick={onClose} aria-label="Close profile">
          <X className="h-5 w-5" />
        </button>

        {/* Portrait Section */}
        <div className="profile-portrait-section">
          <div className={cn('profile-portrait-frame', getRelationshipClass(npc))}>
            {isLoading ? (
              <div className="portrait-loading">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span>Generating...</span>
              </div>
            ) : portrait ? (
              <img
                src={portrait}
                alt={npc.meta.name}
                className="profile-portrait-image"
              />
            ) : (
              <div className="portrait-loading">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Mood indicator */}
          <div className={cn('profile-mood', `mood-${npc.emotionalState.current}`)}>
            {getEmotionLabel(npc.emotionalState.current)}
          </div>
        </div>

        {/* Info Section */}
        <div className="profile-info-section">
          {/* Header */}
          <div className="profile-header">
            <h2 className="profile-name">{npc.meta.name}</h2>
            <span className="profile-title">{npc.meta.occupation}</span>
          </div>

          {/* Basic Info */}
          <div className="profile-section">
            <h3>Basic Info</h3>
            <div className="profile-stats">
              <ProfileStat label="Age" value={npc.meta.age} />
              <ProfileStat label="Location" value={npc.currentLocation.replace(/_/g, ' ')} />
            </div>
            <p className="profile-activity">
              Currently: <span className="italic">{npc.currentActivity}</span>
            </p>
          </div>

          {/* Description */}
          <div className="profile-section">
            <h3>Description</h3>
            <p className="profile-description">
              {npc.meta.description}
            </p>
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

          {/* Relationship with Player */}
          <div className="profile-section">
            <h3>Relationship</h3>
            <div className="relationship-bars">
              <RelationshipBar 
                label="Affection" 
                value={relationship.affection} 
                color="rose" 
                icon={Heart}
              />
              <RelationshipBar 
                label="Trust" 
                value={relationship.trust} 
                color="emerald" 
                icon={Shield}
              />
              <RelationshipBar 
                label="Fear" 
                value={relationship.fear} 
                color="amber" 
                icon={Eye}
              />
              <RelationshipBar 
                label="Respect" 
                value={relationship.respect} 
                color="blue" 
                icon={Award}
              />
            </div>
            <div className="relationship-status">
              Status: <span className={`status-${getRelationshipTier(npc)}`}>
                {getRelationshipLabel(npc)}
              </span>
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
                {/* Current State */}
                <div className="detail-group">
                  <h4>Current State</h4>
                  <div className="profile-stats">
                    <ProfileStat label="Emotion" value={npc.emotionalState.current} />
                    <ProfileStat label="Baseline" value={npc.emotionalState.baseline} />
                    <ProfileStat label="Stress" value={`${npc.stressLevel}/100`} />
                  </div>
                </div>

                {/* Known Facts */}
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

                {/* Identity */}
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
