// Save Slot Preview Component with rich information display
import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, MapPin, User, Scroll, Heart, 
  Trash2, Download, ChevronRight, Sparkles
} from 'lucide-react';
import { GameSave } from '@/lib/saveSystem';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SaveSlotPreviewProps {
  save: GameSave;
  onLoad: () => void;
  onDelete: () => void;
  isConfirmingDelete?: boolean;
  className?: string;
}

// Helper to safely extract nested data from gameData
function extractGameData(save: GameSave) {
  const gameData = save.gameData as Record<string, any> | undefined;
  if (!gameData) {
    return {
      characterName: save.characterName || 'Unknown Hero',
      characterClass: 'Adventurer',
      characterLevel: 1,
      location: 'Unknown',
      genre: 'Adventure',
      narrativeHistory: [],
      hp: undefined,
      maxHp: 100,
      turnCount: 0,
    };
  }
  
  const character = gameData.character || {};
  const narrativeHistory = gameData.narrativeHistory || [];
  
  return {
    characterName: character.name || save.characterName || 'Unknown Hero',
    characterClass: character.class || 'Adventurer',
    characterLevel: character.level || 1,
    location: gameData.currentLocation || gameData.location || 'Unknown',
    genre: gameData.genre || 'Adventure',
    narrativeHistory,
    hp: character.stats?.hp || character.hp,
    maxHp: character.stats?.maxHp || character.maxHp || 100,
    turnCount: gameData.turnCount || narrativeHistory.length || 0,
  };
}

export function SaveSlotPreview({ 
  save, 
  onLoad, 
  onDelete,
  isConfirmingDelete = false,
  className 
}: SaveSlotPreviewProps) {
  // Extract preview data from save
  const data = extractGameData(save);
  const { characterName, characterClass, characterLevel, location, genre, narrativeHistory, hp, maxHp, turnCount } = data;
  
  // Get last narrative entry for story preview
  const lastEntry = narrativeHistory[narrativeHistory.length - 1];
  const storyPreview = lastEntry?.text 
    ? lastEntry.text.substring(0, 120) + (lastEntry.text.length > 120 ? '...' : '')
    : 'No story yet...';
  
  // Format timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isAutoSave = save.id.startsWith('auto-');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "group relative rounded-xl border overflow-hidden transition-all hover:border-primary/40",
        isAutoSave ? "border-border/30 bg-card/40" : "border-primary/20 bg-card/60",
        className
      )}
    >
      {/* Main content - clickable to load */}
      <div 
        className="p-4 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={onLoad}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Character info */}
          <div className="flex items-center gap-3">
            {/* Avatar placeholder */}
            <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            
            <div>
              <h4 className="font-semibold text-sm">{characterName}</h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary/80">Lv.{characterLevel}</span>
                <span>•</span>
                <span>{characterClass}</span>
              </div>
            </div>
          </div>

          {/* Timestamp and type */}
          <div className="text-right shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatDate(save.timestamp)}</span>
            </div>
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
              isAutoSave 
                ? "bg-muted/50 text-muted-foreground" 
                : "bg-primary/20 text-primary"
            )}>
              {isAutoSave ? 'AUTO' : 'MANUAL'}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mb-3 text-xs">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-amber-500" />
            <span className="truncate max-w-[120px]">{location}</span>
          </div>
          
          {/* Genre */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>{genre}</span>
          </div>

          {/* Turn count */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scroll className="h-3.5 w-3.5 text-blue-400" />
            <span>{turnCount} turns</span>
          </div>
          
          {/* HP if available */}
          {hp !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className={cn("h-3.5 w-3.5", hp > maxHp * 0.5 ? "text-green-500" : hp > maxHp * 0.25 ? "text-amber-500" : "text-red-500")} />
              <span>{hp}/{maxHp}</span>
            </div>
          )}
        </div>

        {/* Story preview */}
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/30">
          <p className="text-xs text-muted-foreground italic line-clamp-2">
            "{storyPreview}"
          </p>
        </div>

        {/* Load indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* Action buttons - visible on hover */}
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-card/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          title="Load save"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 bg-card/80 backdrop-blur-sm",
            isConfirmingDelete && "bg-destructive/20 text-destructive"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title={isConfirmingDelete ? "Click again to confirm" : "Delete save"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Delete confirmation overlay */}
      {isConfirmingDelete && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-destructive/10 backdrop-blur-[2px] flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-sm font-medium text-destructive mb-2">Delete this save?</p>
            <p className="text-xs text-muted-foreground">Click delete again to confirm</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact version for dropdown menus
export function SaveSlotPreviewCompact({ 
  save, 
  onLoad, 
  onDelete,
  isConfirmingDelete = false,
}: SaveSlotPreviewProps) {
  const data = extractGameData(save);
  const characterName = data.characterName || 'Unknown';
  const location = data.location || 'Unknown';
  const isAutoSave = save.id.startsWith('auto-');
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 1) return 'Recent';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all hover:bg-muted/30",
        isConfirmingDelete 
          ? "border-destructive/50 bg-destructive/5" 
          : "border-border/30 hover:border-border/50"
      )}
      onClick={onLoad}
    >
      {/* Icon */}
      <div className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
        isAutoSave ? "bg-muted/50" : "bg-primary/10"
      )}>
        {isAutoSave ? (
          <Clock className="h-4 w-4 text-muted-foreground" />
        ) : (
          <User className="h-4 w-4 text-primary" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{characterName}</span>
          <span className={cn(
            "text-[9px] px-1 py-0.5 rounded font-medium shrink-0",
            isAutoSave ? "bg-muted/50 text-muted-foreground" : "bg-primary/20 text-primary"
          )}>
            {isAutoSave ? 'AUTO' : 'SAVE'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{location}</span>
          <span>•</span>
          <span className="shrink-0">{formatDate(save.timestamp)}</span>
        </div>
      </div>

      {/* Delete button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 shrink-0",
          isConfirmingDelete && "text-destructive"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default SaveSlotPreview;
