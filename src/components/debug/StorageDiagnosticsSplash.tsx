import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, HardDrive, Trash2, X, RefreshCw, Download, Search, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface StorageKey {
  key: string;
  size: number;
  prefix: string;
  value: string;
}

interface StorageDiagnosticsSplashProps {
  isOpen: boolean;
  onClose: () => void;
}

// Known prefixes used by the game
const KNOWN_PREFIXES = [
  { prefix: 'lwe_', label: 'Legacy World Engine', color: 'bg-amber-500' },
  { prefix: 'untold_', label: 'Untold Engine', color: 'bg-blue-500' },
  { prefix: 'guest_local_', label: 'Guest Saves', color: 'bg-green-500' },
  { prefix: 'game_settings', label: 'Game Settings', color: 'bg-purple-500' },
  { prefix: 'narrator_', label: 'Narrator', color: 'bg-pink-500' },
  { prefix: 'lifetime_', label: 'Lifetime Stats', color: 'bg-cyan-500' },
  { prefix: 'achievements', label: 'Achievements', color: 'bg-yellow-500' },
  { prefix: 'audio_', label: 'Audio', color: 'bg-indigo-500' },
  { prefix: 'bookmark', label: 'Bookmarks', color: 'bg-rose-500' },
  { prefix: 'onboarding', label: 'Onboarding', color: 'bg-teal-500' },
  { prefix: 'color_theme', label: 'Theme', color: 'bg-violet-500' },
  { prefix: 'recovery_', label: 'Recovery', color: 'bg-orange-500' },
  { prefix: 'checkpoint_', label: 'Checkpoints', color: 'bg-lime-500' },
  { prefix: 'campaign_', label: 'Campaign', color: 'bg-emerald-500' },
];

function getPrefix(key: string): { prefix: string; label: string; color: string } {
  for (const p of KNOWN_PREFIXES) {
    if (key.startsWith(p.prefix) || key.includes(p.prefix)) {
      return p;
    }
  }
  return { prefix: 'other', label: 'Other', color: 'bg-gray-500' };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function StorageDiagnosticsSplash({ isOpen, onClose }: StorageDiagnosticsSplashProps) {
  const [keys, setKeys] = useState<StorageKey[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [groupByPrefix, setGroupByPrefix] = useState(true);

  const scanStorage = useCallback(() => {
    const allKeys: StorageKey[] = [];
    let total = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        const size = new Blob([value]).size;
        total += size;
        const prefixInfo = getPrefix(key);
        allKeys.push({
          key,
          size,
          prefix: prefixInfo.label,
          value,
        });
      }
    }

    // Sort by size descending
    allKeys.sort((a, b) => b.size - a.size);
    setKeys(allKeys);
    setTotalSize(total);
  }, []);

  useEffect(() => {
    if (isOpen) {
      scanStorage();
    }
  }, [isOpen, scanStorage]);

  const filteredKeys = keys.filter(k => 
    k.key.toLowerCase().includes(filter.toLowerCase()) ||
    k.prefix.toLowerCase().includes(filter.toLowerCase())
  );

  const groupedKeys = groupByPrefix 
    ? filteredKeys.reduce((acc, key) => {
        if (!acc[key.prefix]) acc[key.prefix] = [];
        acc[key.prefix].push(key);
        return acc;
      }, {} as Record<string, StorageKey[]>)
    : { 'All Keys': filteredKeys };

  const handleDeleteKey = (key: string) => {
    if (confirm(`Delete "${key}"? This cannot be undone.`)) {
      localStorage.removeItem(key);
      scanStorage();
      setSelectedKey(null);
    }
  };

  const handleExportAll = () => {
    const data: Record<string, string> = {};
    keys.forEach(k => {
      data[k.key] = k.value;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-dump-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedKeyData = keys.find(k => k.key === selectedKey);

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
          {/* Main panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
            className="relative z-20 w-full max-w-4xl max-h-[85vh] bg-card border border-border rounded-lg shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Storage Diagnostics</h1>
                  <p className="text-xs text-muted-foreground">
                    {keys.length} keys • {formatBytes(totalSize)} total
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={scanStorage} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportAll} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  Export
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter bar */}
            <div className="p-3 border-b border-border bg-background/50 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Filter keys..."
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  className="pl-9 h-8 text-sm"
                />
              </div>
              <Button
                variant={groupByPrefix ? 'default' : 'outline'}
                size="sm"
                onClick={() => setGroupByPrefix(!groupByPrefix)}
                className="text-xs"
              >
                Group by Type
              </Button>
            </div>

            {/* Content */}
            <div className="flex h-[calc(85vh-180px)]">
              {/* Keys list */}
              <ScrollArea className="flex-1 border-r border-border">
                <div className="p-2">
                  {Object.entries(groupedKeys).map(([group, groupKeys]) => (
                    <div key={group} className="mb-4">
                      {groupByPrefix && (
                        <div className="flex items-center gap-2 px-2 py-1.5 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {group}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {groupKeys.length} keys • {formatBytes(groupKeys.reduce((sum, k) => sum + k.size, 0))}
                          </span>
                        </div>
                      )}
                      {groupKeys.map(k => {
                        const prefixInfo = getPrefix(k.key);
                        return (
                          <button
                            key={k.key}
                            onClick={() => setSelectedKey(k.key)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2 ${
                              selectedKey === k.key
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-muted/50 text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className={`w-2 h-2 rounded-full ${prefixInfo.color} shrink-0`} />
                              <span className="truncate font-mono text-xs">{k.key}</span>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatBytes(k.size)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  
                  {filteredKeys.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <HardDrive className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">No keys found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Detail panel */}
              <div className="w-[45%] flex flex-col bg-muted/10">
                {selectedKeyData ? (
                  <>
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-foreground truncate">{selectedKeyData.key}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatBytes(selectedKeyData.size)} • {selectedKeyData.prefix}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteKey(selectedKeyData.key)}
                        className="gap-1.5 shrink-0 ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                    <ScrollArea className="flex-1 p-3">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
                        {(() => {
                          try {
                            return JSON.stringify(JSON.parse(selectedKeyData.value), null, 2);
                          } catch {
                            return selectedKeyData.value;
                          }
                        })()}
                      </pre>
                    </ScrollArea>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
                    <Database className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm text-center">Select a key to view its contents</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  {keys.filter(k => k.prefix !== 'Other').length} recognized
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
                  {keys.filter(k => k.prefix === 'Other').length} unknown
                </span>
              </div>
              <span>Press ESC to close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for command detection
export function useStorageDiagnosticsCommand() {
  const [isOpen, setIsOpen] = useState(false);

  const checkCommand = useCallback((input: string): boolean => {
    if (input.trim().toLowerCase() === '/storagediag') {
      setIsOpen(true);
      return true; // Command was handled
    }
    return false;
  }, []);

  return {
    isOpen,
    setIsOpen,
    checkCommand,
  };
}
