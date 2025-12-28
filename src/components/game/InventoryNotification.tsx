import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Minus } from 'lucide-react';

export interface InventoryChange {
  id: string;
  itemName: string;
  type: 'add' | 'remove';
  quantity?: number;
  icon?: string;
}

interface InventoryNotificationProps {
  changes: InventoryChange[];
  onChangeProcessed?: (id: string) => void;
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
}

// Item icon helper
function getItemEmoji(itemName: string): string {
  const name = itemName.toLowerCase();
  if (name.includes('rifle') || name.includes('gun') || name.includes('pistol')) return '🔫';
  if (name.includes('sword') || name.includes('blade') || name.includes('dagger')) return '⚔️';
  if (name.includes('key')) return '🗝️';
  if (name.includes('potion') || name.includes('flask')) return '🧪';
  if (name.includes('gem') || name.includes('jewel')) return '💎';
  if (name.includes('scroll') || name.includes('book')) return '📜';
  if (name.includes('ring') || name.includes('amulet')) return '💍';
  if (name.includes('coin') || name.includes('gold')) return '🪙';
  if (name.includes('armor') || name.includes('shield')) return '🛡️';
  if (name.includes('food') || name.includes('bread')) return '🍖';
  if (name.includes('ammo') || name.includes('bullet')) return '🎯';
  if (name.includes('medkit') || name.includes('bandage')) return '🩹';
  return '✨';
}

export function InventoryNotification({ 
  changes, 
  onChangeProcessed,
  position = 'bottom-right' 
}: InventoryNotificationProps) {
  const [activeChanges, setActiveChanges] = useState<InventoryChange[]>([]);

  // Process new changes
  useEffect(() => {
    if (changes.length === 0) return;
    
    // Add new changes to active list
    setActiveChanges(prev => {
      const newChanges = changes.filter(c => !prev.some(p => p.id === c.id));
      return [...prev, ...newChanges];
    });
  }, [changes]);

  // Auto-remove after animation
  const handleAnimationComplete = useCallback((id: string) => {
    setTimeout(() => {
      setActiveChanges(prev => prev.filter(c => c.id !== id));
      onChangeProcessed?.(id);
    }, 2500);
  }, [onChangeProcessed]);

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 pointer-events-none`}>
      <AnimatePresence mode="popLayout">
        {activeChanges.slice(-3).map((change) => (
          <motion.div
            key={change.id}
            initial={{ opacity: 0, scale: 0.8, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 50 }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 25 
            }}
            onAnimationComplete={() => handleAnimationComplete(change.id)}
            className="mb-2"
          >
            <div className={`
              relative overflow-hidden rounded-lg px-3 py-2
              backdrop-blur-md border
              ${change.type === 'add' 
                ? 'bg-emerald-500/10 border-emerald-500/30' 
                : 'bg-amber-500/10 border-amber-500/30'
              }
            `}>
              {/* Animated color splash background */}
              <motion.div
                initial={{ scale: 0, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`
                  absolute inset-0 rounded-full
                  ${change.type === 'add' 
                    ? 'bg-emerald-400/40' 
                    : 'bg-amber-400/40'
                  }
                `}
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                }}
              />
              
              {/* Shimmer effect */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={`
                  absolute inset-0 
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  skew-x-12
                `}
              />

              {/* Content */}
              <div className="relative flex items-center gap-2">
                {/* Icon with pulse */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ 
                    duration: 0.4,
                    times: [0, 0.5, 1],
                  }}
                  className={`
                    flex items-center justify-center w-7 h-7 rounded-full text-sm
                    ${change.type === 'add' 
                      ? 'bg-emerald-500/20' 
                      : 'bg-amber-500/20'
                    }
                  `}
                >
                  {change.icon || getItemEmoji(change.itemName)}
                </motion.div>

                {/* Item name */}
                <div className="flex flex-col min-w-0">
                  <span className={`
                    text-xs font-medium truncate max-w-[140px]
                    ${change.type === 'add' 
                      ? 'text-emerald-200' 
                      : 'text-amber-200'
                    }
                  `}>
                    {change.itemName}
                  </span>
                  <span className={`
                    text-[10px] opacity-70
                    ${change.type === 'add' 
                      ? 'text-emerald-300' 
                      : 'text-amber-300'
                    }
                  `}>
                    {change.type === 'add' ? 'Added to inventory' : 'Removed'}
                  </span>
                </div>

                {/* Type indicator */}
                <motion.div
                  initial={{ rotate: 0 }}
                  animate={{ rotate: change.type === 'add' ? 0 : 180 }}
                  className={`
                    ml-auto p-1 rounded-full
                    ${change.type === 'add' 
                      ? 'bg-emerald-500/30 text-emerald-300' 
                      : 'bg-amber-500/30 text-amber-300'
                    }
                  `}
                >
                  {change.type === 'add' ? (
                    <Plus className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                </motion.div>
              </div>

              {/* Progress bar for auto-dismiss */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 2.5, ease: "linear" }}
                className={`
                  absolute bottom-0 left-0 right-0 h-0.5 origin-left
                  ${change.type === 'add' 
                    ? 'bg-emerald-400/50' 
                    : 'bg-amber-400/50'
                  }
                `}
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook to manage inventory notifications
export function useInventoryNotifications() {
  const [changes, setChanges] = useState<InventoryChange[]>([]);

  const addItem = useCallback((itemName: string, quantity = 1, icon?: string) => {
    const id = `add_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setChanges(prev => [...prev, { id, itemName, type: 'add', quantity, icon }]);
  }, []);

  const removeItem = useCallback((itemName: string, quantity = 1, icon?: string) => {
    const id = `remove_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setChanges(prev => [...prev, { id, itemName, type: 'remove', quantity, icon }]);
  }, []);

  const handleProcessed = useCallback((id: string) => {
    setChanges(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    changes,
    addItem,
    removeItem,
    handleProcessed,
  };
}
