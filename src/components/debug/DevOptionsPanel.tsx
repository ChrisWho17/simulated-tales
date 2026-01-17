import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, X, Database, HardDrive, Wand2, RefreshCw, Download, 
  Trash2, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
  Archive, Clock, Server, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { IndexedDBCache } from '@/lib/indexedDBCache';

interface DevOptionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenStorageDiag?: () => void;
  onOpenCheatMode?: () => void;
}

interface CacheDiagnostics {
  isAvailable: boolean;
  saveCount: number;
  backupCount: number;
  latestBackupDate: string | null;
  totalSize: number;
}

interface LocalStorageStats {
  totalKeys: number;
  totalSize: number;
  gameKeys: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(isoString: string | null): string {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  return date.toLocaleString();
}

export function DevOptionsPanel({ 
  isOpen, 
  onClose,
  onOpenStorageDiag,
  onOpenCheatMode 
}: DevOptionsPanelProps) {
  const [cacheDiag, setCacheDiag] = useState<CacheDiagnostics | null>(null);
  const [localStorageStats, setLocalStorageStats] = useState<LocalStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    cache: true,
    localStorage: true,
    tools: true,
  });

  const scanDiagnostics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Get IndexedDB cache diagnostics
      const diag = await IndexedDBCache.getDiagnostics();
      setCacheDiag(diag);
      
      // Get localStorage stats
      let totalSize = 0;
      let gameKeys = 0;
      const gameKeyPrefixes = [
        'lwe_', 'untold_', 'guest_local_', 'game_settings', 'narrator_',
        'lifetime_', 'achievements', 'bookmark', 'campaign_', 'checkpoint_',
        'recovery_', 'living-world', 'color_theme', 'onboarding', 'audio_'
      ];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalSize += new Blob([value]).size;
          
          if (gameKeyPrefixes.some(prefix => key.includes(prefix))) {
            gameKeys++;
          }
        }
      }
      
      setLocalStorageStats({
        totalKeys: localStorage.length,
        totalSize,
        gameKeys,
      });
    } catch (e) {
      console.error('[DevOptions] Scan failed:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scanDiagnostics();
    }
  }, [isOpen, scanDiagnostics]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      const success = await IndexedDBCache.createBackup();
      if (success) {
        toast.success('Backup created successfully');
        scanDiagnostics();
      } else {
        toast.error('Failed to create backup');
      }
    } catch (e) {
      toast.error('Backup creation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear all IndexedDB cache data? This cannot be undone.')) return;
    
    setIsLoading(true);
    try {
      const success = await IndexedDBCache.clearAll();
      if (success) {
        toast.success('Cache cleared');
        scanDiagnostics();
      } else {
        toast.error('Failed to clear cache');
      }
    } catch (e) {
      toast.error('Clear cache failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncToCache = async () => {
    setIsLoading(true);
    try {
      const synced = await IndexedDBCache.syncFromLocalStorage(
        'guest_local_',
        (data) => {
          // Simple checksum
          let hash = 0;
          for (let i = 0; i < Math.min(data.length, 1000); i++) {
            hash = ((hash << 5) - hash) + data.charCodeAt(i);
            hash = hash & hash;
          }
          return hash.toString(16);
        }
      );
      toast.success(`Synced ${synced} saves to cache`);
      scanDiagnostics();
    } catch (e) {
      toast.error('Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 w-full max-w-lg max-h-[85vh] bg-card border border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Settings className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                    Developer Options
                    <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                      Debug
                    </Badge>
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Cache diagnostics & developer tools
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={scanDiagnostics}
                  disabled={isLoading}
                  className="gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[calc(85vh-100px)]">
              <div className="p-4 space-y-4">
                
                {/* IndexedDB Cache Section */}
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('cache')}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-cyan-400" />
                      <span className="font-medium text-sm">IndexedDB Cache</span>
                      {cacheDiag?.isAvailable ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                      )}
                    </div>
                    {expandedSections.cache ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.cache && (
                    <div className="p-4 space-y-4">
                      {/* Status */}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={cacheDiag?.isAvailable ? 'default' : 'destructive'}>
                          {cacheDiag?.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                      
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Archive className="w-3.5 h-3.5" />
                            Cached Saves
                          </div>
                          <p className="text-xl font-semibold text-foreground">
                            {cacheDiag?.saveCount ?? 0}
                          </p>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Server className="w-3.5 h-3.5" />
                            Backups
                          </div>
                          <p className="text-xl font-semibold text-foreground">
                            {cacheDiag?.backupCount ?? 0}
                          </p>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            Last Backup
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {formatDate(cacheDiag?.latestBackupDate ?? null)}
                          </p>
                        </div>
                        
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <HardDrive className="w-3.5 h-3.5" />
                            Cache Size
                          </div>
                          <p className="text-xl font-semibold text-foreground">
                            {formatBytes(cacheDiag?.totalSize ?? 0)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCreateBackup}
                          disabled={isLoading}
                          className="gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Create Backup
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSyncToCache}
                          disabled={isLoading}
                          className="gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Sync to Cache
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleClearCache}
                          disabled={isLoading}
                          className="gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear Cache
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* LocalStorage Section */}
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('localStorage')}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span className="font-medium text-sm">LocalStorage</span>
                    </div>
                    {expandedSections.localStorage ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.localStorage && (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="text-xs text-muted-foreground">Total Keys</div>
                          <p className="text-xl font-semibold text-foreground">
                            {localStorageStats?.totalKeys ?? 0}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="text-xs text-muted-foreground">Game Keys</div>
                          <p className="text-xl font-semibold text-foreground">
                            {localStorageStats?.gameKeys ?? 0}
                          </p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                          <div className="text-xs text-muted-foreground">Total Size</div>
                          <p className="text-lg font-semibold text-foreground">
                            {formatBytes(localStorageStats?.totalSize ?? 0)}
                          </p>
                        </div>
                      </div>
                      
                      {onOpenStorageDiag && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            onClose();
                            setTimeout(() => onOpenStorageDiag(), 100);
                          }}
                          className="gap-1.5 w-full"
                        >
                          <Database className="w-3.5 h-3.5" />
                          Open Full Storage Diagnostics
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Developer Tools Section */}
                <div className="border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => toggleSection('tools')}
                    className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-amber-400" />
                      <span className="font-medium text-sm">Developer Tools</span>
                    </div>
                    {expandedSections.tools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {expandedSections.tools && (
                    <div className="p-4 space-y-3">
                      {onOpenCheatMode && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            onClose();
                            setTimeout(() => onOpenCheatMode(), 100);
                          }}
                          className="gap-1.5 w-full justify-start border-amber-500/30 hover:bg-amber-500/10"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Cheat Mode</span>
                          <span className="text-xs text-muted-foreground ml-auto">Edit character stats</span>
                        </Button>
                      )}
                      
                      {onOpenStorageDiag && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            onClose();
                            setTimeout(() => onOpenStorageDiag(), 100);
                          }}
                          className="gap-1.5 w-full justify-start border-purple-500/30 hover:bg-purple-500/10"
                        >
                          <Database className="w-3.5 h-3.5 text-purple-400" />
                          <span>Storage Diagnostics</span>
                          <span className="text-xs text-muted-foreground ml-auto">View all localStorage</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-3 border-t border-border/50 bg-muted/30 text-xs text-muted-foreground text-center">
              Press ESC to close • Type <code className="bg-muted px-1 rounded">/DevOptions</code> to open
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for command detection
export function useDevOptionsCommand() {
  const [isOpen, setIsOpen] = useState(false);

  const checkCommand = useCallback((input: string): boolean => {
    if (input.trim().toLowerCase() === '/devoptions') {
      setIsOpen(true);
      return true;
    }
    return false;
  }, []);

  return {
    isOpen,
    setIsOpen,
    checkCommand,
  };
}
