import { useState } from 'react';
import { NPC } from '@/types/game';
import { CharacterProfileModal } from './CharacterProfileModal';
import { cn } from '@/lib/utils';

interface CharacterNameLinkProps {
  npc: NPC;
  className?: string;
  onStartConversation?: (npc: NPC) => void;
  playerLocation?: string;
}

export function CharacterNameLink({ 
  npc, 
  className,
  onStartConversation,
  playerLocation
}: CharacterNameLinkProps) {
  const [showProfile, setShowProfile] = useState(false);

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
        className={cn('character-name-link', className)}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View ${npc.meta.name}'s profile`}
      >
        {npc.meta.name}
      </span>

      {showProfile && (
        <CharacterProfileModal
          npc={npc}
          onClose={() => setShowProfile(false)}
          onStartConversation={onStartConversation}
          playerLocation={playerLocation}
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
}

export function ParsedTextWithCharacterLinks({ 
  text, 
  npcs, 
  onStartConversation,
  playerLocation 
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
