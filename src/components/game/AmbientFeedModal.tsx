// Mobile Ambient Feed Modal - Full screen splash for social/world events on mobile
import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Sparkles, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlayOverlayShell } from '@/components/game/PlayOverlayShell';
import { AmbientEntry } from './AmbientFeed';

interface AmbientFeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: AmbientEntry[];
  onClearEntries?: () => void;
}

export function AmbientFeedModal({ 
  isOpen, 
  onClose, 
  entries,
  onClearEntries 
}: AmbientFeedModalProps) {
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <PlayOverlayShell
      open={isOpen}
      onClose={onClose}
      title="World Events"
      subtitle={entries.length > 0 ? `${entries.length} recorded` : undefined}
      icon={<Globe className="w-5 h-5" />}
      size="lg"
      footer={
        entries.length > 0 && onClearEntries ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClearEntries();
              onClose();
            }}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Clear All Events
          </Button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-3">
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Globe className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-sm">
              No world events yet.
            </p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Events from the living world will appear here.
            </p>
          </div>
        ) : (
          sortedEntries.map((entry) => (
            <AmbientModalEntry key={entry.id} entry={entry} />
          ))
        )}
      </div>
    </PlayOverlayShell>
  );
}

function AmbientModalEntry({ entry }: { entry: AmbientEntry }) {
  const isChatter = entry.type === 'chatter';
  const timeAgo = getTimeAgo(entry.timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-lg p-4 border',
        isChatter
          ? 'bg-primary/5 border-primary/20'
          : 'bg-secondary/5 border-secondary/20'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isChatter ? (
            <MessageCircle className="h-4 w-4 text-primary/70" />
          ) : (
            <Sparkles className="h-4 w-4 text-secondary/70" />
          )}
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {isChatter ? 'Social' : entry.category || 'World'}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50">
          {timeAgo}
        </span>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed">
        {entry.text}
      </p>

      {isChatter && entry.involvedNPCs && entry.involvedNPCs.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <span className="text-xs text-muted-foreground/60 italic">
            — {entry.involvedNPCs.join(' & ')}
          </span>
        </div>
      )}

      {!isChatter && entry.containsHook && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <p className="text-xs text-primary/70 italic flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Something to investigate...
          </p>
        </div>
      )}
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 120) return '1m ago';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 7200) return '1h ago';
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return 'Earlier';
}

export default AmbientFeedModal;
