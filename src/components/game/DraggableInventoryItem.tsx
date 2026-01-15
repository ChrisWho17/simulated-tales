// Draggable Inventory Item Component with story integration
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Package, Check, X, Trash2, Hand, Gift, MoreHorizontal } from 'lucide-react';
import { InventoryItem, CATEGORIES } from '@/game/inventorySystem';
import { cn } from '@/lib/utils';

interface DraggableInventoryItemProps {
  item: InventoryItem;
  isEquipped?: boolean;
  isNew?: boolean;
  onUse: () => void;
  onDrop: () => void;
  onEquip?: () => void;
  onGive?: () => void;
  onDetails: () => void;
  onDismissNew?: () => void;
  dragEnabled?: boolean;
}

export function DraggableInventoryItem({
  item,
  isEquipped = false,
  isNew = false,
  onUse,
  onDrop,
  onEquip,
  onGive,
  onDetails,
  onDismissNew,
  dragEnabled = true,
}: DraggableInventoryItemProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
  const [showActions, setShowActions] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const categoryColor = CATEGORIES[item.category.toUpperCase() as keyof typeof CATEGORIES]?.color || '#888';

  const handleDragEnd = (_: any, info: PanInfo) => {
    setIsDragging(false);
    
    if (!dragEnabled) {
      setDragDirection(null);
      return;
    }
    
    const threshold = 80;
    
    if (info.offset.x < -threshold) {
      // Swipe left = drop item
      onDrop();
    } else if (info.offset.x > threshold) {
      // Swipe right = use/equip item
      if (item.consumable) {
        onUse();
      } else if (onEquip && !isEquipped) {
        onEquip();
      }
    }
    
    setDragDirection(null);
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (!dragEnabled) return;
    
    if (info.offset.x < -40) {
      setDragDirection('left');
    } else if (info.offset.x > 40) {
      setDragDirection('right');
    } else {
      setDragDirection(null);
    }
  };

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Background action hints */}
      <AnimatePresence>
        {dragDirection === 'left' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-destructive/20 flex items-center justify-end pr-4"
          >
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span className="text-sm font-medium">Drop</span>
            </div>
          </motion.div>
        )}
        {dragDirection === 'right' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary/20 flex items-center pl-4"
          >
            <div className="flex items-center gap-2 text-primary">
              {item.consumable ? (
                <>
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Use</span>
                </>
              ) : !isEquipped ? (
                <>
                  <Hand className="h-5 w-5" />
                  <span className="text-sm font-medium">Equip</span>
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  <span className="text-sm font-medium">Equipped</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main item card */}
      <motion.div
        drag={dragEnabled ? 'x' : false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.02, zIndex: 10 }}
        className={cn(
          "relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing",
          isNew && "border-green-500/50 bg-green-500/5",
          isEquipped && "border-cyan-500/50 bg-cyan-500/5",
          !isNew && !isEquipped && "border-border/40 bg-card/60",
          isDragging && "shadow-lg"
        )}
        onClick={() => !isDragging && setShowActions(!showActions)}
      >
        {/* Item icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 border"
          style={{
            background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}05)`,
            borderColor: `${categoryColor}40`,
          }}
        >
          {item.icon || <Package className="h-5 w-5 opacity-50" />}
        </div>

        {/* Item info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium text-sm truncate",
              isEquipped && "text-cyan-400",
              isNew && "text-green-400"
            )}>
              {item.name}
            </span>
            {isNew && (
              <span 
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissNew?.();
                }}
                className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white font-bold cursor-pointer hover:bg-green-600 transition-colors"
              >
                NEW
              </span>
            )}
            {isEquipped && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500 text-white font-bold">
                E
              </span>
            )}
            {item.quantity > 1 && (
              <span className="text-xs text-muted-foreground">×{item.quantity}</span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
          )}
        </div>

        {/* Weight */}
        {(item.weight ?? 0) > 0 && (
          <span className="text-xs text-muted-foreground shrink-0">
            {((item.weight ?? 0) * item.quantity).toFixed(1)} lbs
          </span>
        )}

        {/* Quick action button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-1.5 rounded-md hover:bg-muted/50 transition-colors shrink-0"
        >
          <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
        </button>
      </motion.div>

      {/* Expanded actions panel */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 p-2 pt-0">
              {item.consumable && (
                <button
                  onClick={() => { onUse(); setShowActions(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                  Use
                </button>
              )}
              {onEquip && !isEquipped && !item.consumable && (
                <button
                  onClick={() => { onEquip(); setShowActions(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-medium transition-colors"
                >
                  <Hand className="h-3.5 w-3.5" />
                  Equip
                </button>
              )}
              {onGive && (
                <button
                  onClick={() => { onGive(); setShowActions(false); }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-medium transition-colors"
                >
                  <Gift className="h-3.5 w-3.5" />
                  Give
                </button>
              )}
              <button
                onClick={() => { onDetails(); setShowActions(false); }}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground text-xs font-medium transition-colors"
              >
                Details
              </button>
              <button
                onClick={() => { onDrop(); setShowActions(false); }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-medium transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag hint for first-time users */}
      {dragEnabled && !isDragging && !showActions && (
        <div className="absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
            className="text-xs text-muted-foreground whitespace-nowrap"
          >
            ← Swipe →
          </motion.div>
        </div>
      )}
    </div>
  );
}
