import { useState, useMemo } from 'react';
import { NPC } from '@/types/game';
import { CharacterProfileModal } from './CharacterProfileModal';
import { cn } from '@/lib/utils';
import { 
  PlayerKnowledgeStore, 
  getOrCreateKnowledge, 
  getDisplayName,
  NPCKnowledgeEntry
} from '@/lib/knowledgeSystem';

interface CharacterNameLinkProps {
  npc: NPC;
  className?: string;
  onStartConversation?: (npc: NPC) => void;
  playerLocation?: string;
  knowledgeStore?: PlayerKnowledgeStore;
}

export function CharacterNameLink({ 
  npc, 
  className,
  onStartConversation,
  playerLocation,
  knowledgeStore
}: CharacterNameLinkProps) {
  const [showProfile, setShowProfile] = useState(false);

  // Get knowledge entry for this NPC
  const knowledge = useMemo((): NPCKnowledgeEntry | undefined => {
    if (!knowledgeStore) return undefined;
    return getOrCreateKnowledge(knowledgeStore, npc);
  }, [knowledgeStore, npc]);

  // Get display name based on knowledge
  const displayName = useMemo(() => {
    if (!knowledge) {
      return npc.meta.name; // Fallback to real name if no knowledge system
    }
    return getDisplayName(knowledge, npc);
  }, [knowledge, npc]);

  // Check if name is known for styling
  const isNameKnown = knowledge?.knowsName ?? true;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowProfile(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowProfile(true);
    }
  };

  return (
    <>
      <span
        className={cn(
          'character-name-link',
          !isNameKnown && 'character-name-unknown',
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={isNameKnown ? `View ${npc.meta.name}'s profile` : `View unknown character's profile`}
      >
        {displayName}
      </span>

      {showProfile && (
        <CharacterProfileModal
          npc={npc}
          onClose={() => setShowProfile(false)}
          onStartConversation={onStartConversation}
          playerLocation={playerLocation}
          knowledge={knowledge}
        />
      )}
    </>
  );
}

// Parse text and replace character names with clickable links
interface ParsedTextProps {
  text: string;
  npcs: NPC[];
  onStartConversation?: (npc: NPC) => void;
  playerLocation?: string;
  knowledgeStore?: PlayerKnowledgeStore;
}

export function ParsedTextWithCharacterLinks({ 
  text, 
  npcs, 
  onStartConversation,
  playerLocation,
  knowledgeStore
}: ParsedTextProps) {
  // Sort by name length (longest first) to avoid partial matches
  const sortedNpcs = [...npcs].sort(
    (a, b) => b.meta.name.length - a.meta.name.length
  );

  // Build regex pattern for all NPC names
  const namePattern = sortedNpcs
    .map(npc => escapeRegex(npc.meta.name))
    .join('|');

  if (!namePattern) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`\\b(${namePattern})\\b`, 'g');
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Find the matching NPC
    const matchedName = match[1];
    const matchedNpc = sortedNpcs.find(
      npc => npc.meta.name.toLowerCase() === matchedName.toLowerCase()
    );

    if (matchedNpc) {
      parts.push(
        <CharacterNameLink
          key={`${matchedNpc.id}-${match.index}`}
          npc={matchedNpc}
          onStartConversation={onStartConversation}
          playerLocation={playerLocation}
          knowledgeStore={knowledgeStore}
        />
      );
    } else {
      parts.push(matchedName);
    }

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
