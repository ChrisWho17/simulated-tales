// ============================================================================
// SAVE SYSTEM DIAGNOSTICS OVERLAY - Debug panel for storage operations
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Bug, Database, Activity, Settings, TestTube, Download, Upload, Trash2, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SaveSystem, SaveOperation, StorageInfo } from '@/systems/SaveSystem';
import { runAllTests, TestSuiteResult, getTestCategories, getTestCount } from '@/systems/SaveSystemTests';

interface DiagnosticsProps {
  isOpen: boolean;
  onClose: () => void;
  currentStateHash?: string;
  lastSavedStateHash?: string;
  mountCount?: number;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}

export function SaveSystemDiagnostics({
  isOpen,
  onClose,
  currentStateHash,
  lastSavedStateHash,
  mountCount = 1,
}: DiagnosticsProps) {
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [operations, setOperations] = useState<SaveOperation[]>([]);
  const [gameKeys, setGameKeys] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<TestSuiteResult | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [keyPreview, setKeyPreview] = useState<string>('');
  const [verifyResult, setVerifyResult] = useState<{ key: string; valid: boolean; error?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const refresh = useCallback(() => {
    setStorageInfo(SaveSystem.getStorageInfo());
    setOperations(SaveSystem.getOperationLog());
    setGameKeys(SaveSystem.getGameKeys());
  }, []);
  
  useEffect(() => {
    if (isOpen) {
      refresh();
      const interval = setInterval(refresh, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, refresh]);
  
  useEffect(() => {
    if (selectedKey) {
      setKeyPreview(SaveSystem.getKeyPreview(selectedKey, 500));
      setVerifyResult(null);
    }
  }, [selectedKey]);
  
  const handleExportAll = () => {
    const data = SaveSystem.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-saves-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = SaveSystem.importAll(json);
      if (success) {
        refresh();
        alert('Import successful!');
      } else {
        alert('Import failed. Check console for details.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
  
  const handleClearAll = () => {
    if (confirm('This will DELETE ALL game saves. Are you sure?\n\nType "DELETE" to confirm.')) {
      const count = SaveSystem.clearAllGameData();
      refresh();
      alert(`Cleared ${count} game keys.`);
    }
  };
  
  const handleTestWriteRead = async () => {
    const result = await SaveSystem.testWriteReadCycle();
    alert(result.success 
      ? `Write/Read test passed in ${result.duration}ms` 
      : `Write/Read test failed: ${result.error}`);
  };
  
  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await runAllTests();
      setTestResults(results);
    } finally {
      setIsRunningTests(false);
    }
  };
  
  const handleVerifyKey = (key: string) => {
    const result = SaveSystem.verify(key);
    setVerifyResult({ key, ...result });
  };
  
  const handleForceSave = async () => {
    await SaveSystem.flushPendingSaves();
    alert('All pending saves flushed.');
    refresh();
  };
  
  if (!isOpen) return null;
  
  const isInSync = currentStateHash === lastSavedStateHash;
  
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-background/95 backdrop-blur-sm border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bug className="w-5 h-5 text-primary" />
          <span className="font-semibold">Save System Diagnostics</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <Tabs defaultValue="storage" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="storage" className="text-xs">Storage</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">Ops Log</TabsTrigger>
          <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
          <TabsTrigger value="tests" className="text-xs">Tests</TabsTrigger>
        </TabsList>
        
        {/* Storage Status Tab */}
        <TabsContent value="storage" className="flex-1 p-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Storage Status
            </h3>
            
            {storageInfo && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Backend</div>
                  <div className="font-mono">{storageInfo.backend}</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Session ID</div>
                  <div className="font-mono truncate">{SaveSystem.getSessionId()}</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Used</div>
                  <div className="font-mono">{formatBytes(storageInfo.used)}</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Available</div>
                  <div className="font-mono">{formatBytes(storageInfo.available)}</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Total Keys</div>
                  <div className="font-mono">{SaveSystem.getAllKeys().length}</div>
                </div>
                <div className="p-2 rounded bg-muted">
                  <div className="text-muted-foreground">Game Keys</div>
                  <div className="font-mono">{gameKeys.length}</div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              React State Monitor
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted">
                <div className="text-muted-foreground">Current Hash</div>
                <div className="font-mono truncate">{currentStateHash || 'N/A'}</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-muted-foreground">Saved Hash</div>
                <div className="font-mono truncate">{lastSavedStateHash || 'N/A'}</div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-muted-foreground">Sync Status</div>
                <div className={`font-medium ${isInSync ? 'text-green-500' : 'text-yellow-500'}`}>
                  {isInSync ? '✓ In Sync' : '⚠ Out of Sync'}
                </div>
              </div>
              <div className="p-2 rounded bg-muted">
                <div className="text-muted-foreground">Mount Count</div>
                <div className="font-mono">{mountCount}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manual Controls
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={handleExportAll}>
                <Download className="w-3 h-3 mr-1" />
                Export All
              </Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-3 h-3 mr-1" />
                Import
              </Button>
              <Button size="sm" variant="outline" onClick={handleForceSave}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Force Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleTestWriteRead}>
                <TestTube className="w-3 h-3 mr-1" />
                Test R/W
              </Button>
              <Button size="sm" variant="destructive" onClick={handleClearAll} className="col-span-2">
                <Trash2 className="w-3 h-3 mr-1" />
                Clear All Saves
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
        </TabsContent>
        
        {/* Operations Log Tab */}
        <TabsContent value="operations" className="flex-1 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Recent Operations</h3>
            <Button size="sm" variant="ghost" onClick={refresh}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="space-y-1">
              {operations.map((op, i) => (
                <div
                  key={i}
                  className={`p-2 rounded text-xs ${
                    op.success ? 'bg-muted' : 'bg-destructive/10 border border-destructive/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={op.type === 'save' ? 'default' : op.type === 'load' ? 'secondary' : 'destructive'}>
                        {op.type.toUpperCase()}
                      </Badge>
                      <span className="font-mono truncate max-w-[120px]">{op.key}</span>
                    </div>
                    {op.success ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-destructive" />
                    )}
                  </div>
                  <div className="flex justify-between text-muted-foreground mt-1">
                    <span>{formatTime(op.timestamp)}</span>
                    <span>{op.size ? formatBytes(op.size) : ''} {op.duration}ms</span>
                  </div>
                  {op.error && (
                    <div className="text-destructive mt-1">{op.error}</div>
                  )}
                </div>
              ))}
              {operations.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No operations logged yet
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Data Tab */}
        <TabsContent value="data" className="flex-1 p-4">
          <h3 className="text-sm font-medium mb-2">Saved Data Keys</h3>
          <ScrollArea className="h-[200px] mb-4">
            <div className="space-y-1">
              {gameKeys.map(key => (
                <div
                  key={key}
                  className={`p-2 rounded text-xs cursor-pointer hover:bg-muted/80 ${
                    selectedKey === key ? 'bg-primary/20 border border-primary' : 'bg-muted'
                  }`}
                  onClick={() => setSelectedKey(key)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono truncate">{key}</span>
                    <span className="text-muted-foreground">{formatBytes(SaveSystem.getKeySize(key))}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          {selectedKey && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Preview: {selectedKey}</h4>
                <Button size="sm" variant="outline" onClick={() => handleVerifyKey(selectedKey)}>
                  Verify
                </Button>
              </div>
              
              {verifyResult && verifyResult.key === selectedKey && (
                <div className={`p-2 rounded text-xs ${verifyResult.valid ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
                  {verifyResult.valid ? (
                    <span className="text-green-500">✓ Data integrity verified</span>
                  ) : (
                    <span className="text-destructive">✗ {verifyResult.error}</span>
                  )}
                </div>
              )}
              
              <ScrollArea className="h-[200px] border rounded p-2">
                <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                  {keyPreview}
                </pre>
              </ScrollArea>
            </div>
          )}
        </TabsContent>
        
        {/* Tests Tab */}
        <TabsContent value="tests" className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Test Suite ({getTestCount()} tests)</h3>
            <Button size="sm" onClick={handleRunTests} disabled={isRunningTests}>
              {isRunningTests ? 'Running...' : 'Run All Tests'}
            </Button>
          </div>
          
          {testResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 rounded bg-muted text-center">
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-bold">{testResults.total}</div>
                </div>
                <div className="p-2 rounded bg-green-500/10 text-center">
                  <div className="text-green-500">Passed</div>
                  <div className="font-bold text-green-500">{testResults.passed}</div>
                </div>
                <div className="p-2 rounded bg-destructive/10 text-center">
                  <div className="text-destructive">Failed</div>
                  <div className="font-bold text-destructive">{testResults.failed}</div>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                Completed in {testResults.duration}ms
              </div>
              
              <ScrollArea className="h-[calc(100vh-350px)]">
                <div className="space-y-1">
                  {testResults.results.map((result, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded text-xs ${
                        result.passed ? 'bg-muted' : 'bg-destructive/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.passed ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <XCircle className="w-3 h-3 text-destructive" />
                          )}
                          <span>{result.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.category}
                        </Badge>
                      </div>
                      {result.error && (
                        <div className="text-destructive mt-1 ml-5">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {!testResults && !isRunningTests && (
            <div className="text-center text-muted-foreground py-8">
              <TestTube className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Click "Run All Tests" to verify save system integrity</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Keyboard shortcut hook
export function useDiagnosticsShortcut() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return { isOpen, setIsOpen };
}

export default SaveSystemDiagnostics;
