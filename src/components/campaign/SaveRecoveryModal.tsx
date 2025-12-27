// ============================================================================
// SAVE RECOVERY MODAL
// UI for staged save recovery with diff preview and export
// ============================================================================

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Wrench, 
  Shield, 
  Trash2,
  ChevronDown,
  ChevronRight,
  FileWarning,
  RefreshCw
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  FailureSnapshot,
  RecoveryModeState,
  RecoverySuggestion,
  RecoveryOp,
  DiffEntry,
  RecoveryResult,
} from '@/lib/saveRecovery/types';
import {
  initializeRecoveryMode,
  applyRecoveryOps,
  exportFailureReport,
  logRecoveryAction,
  restoreFromBackup,
} from '@/lib/saveRecovery/pipeline';

// ============================================================================
// TYPES
// ============================================================================

interface SaveRecoveryModalProps {
  open: boolean;
  snapshot: FailureSnapshot | null;
  onClose: () => void;
  onRecovered: (save: unknown) => void;
  onAbort: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function StageBadge({ stage }: { stage: 'A' | 'B' | 'C' }) {
  const config = {
    A: { label: 'Safe', variant: 'default' as const, className: 'bg-green-600 hover:bg-green-700' },
    B: { label: 'Assisted', variant: 'secondary' as const, className: 'bg-amber-600 hover:bg-amber-700' },
    C: { label: 'Lossy', variant: 'destructive' as const, className: 'bg-destructive hover:bg-destructive/90' },
  };
  const { label, className } = config[stage];
  return <Badge className={cn('text-xs', className)}>{label}</Badge>;
}

function DiffSummaryItem({ diff }: { diff: DiffEntry }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-border/50 rounded-md p-2 text-sm bg-muted/30">
      <div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Badge variant="outline" className="text-xs font-mono">{diff.op}</Badge>
        <span className="font-mono text-xs text-muted-foreground truncate flex-1">
          {diff.path}
        </span>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1 pl-5">
          <p className="text-xs text-muted-foreground">{diff.reason}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-red-500/10 p-1 rounded">
              <span className="text-red-400">Before:</span>
              <pre className="text-red-300 truncate">{JSON.stringify(diff.before, null, 0).slice(0, 100)}</pre>
            </div>
            <div className="bg-green-500/10 p-1 rounded">
              <span className="text-green-400">After:</span>
              <pre className="text-green-300 truncate">{JSON.stringify(diff.after, null, 0).slice(0, 100)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RecoverySuggestionCard({
  suggestion,
  selected,
  onToggle,
  disabled,
}: {
  suggestion: RecoverySuggestion;
  selected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div 
      className={cn(
        "border rounded-lg p-3 transition-colors cursor-pointer",
        selected ? "border-primary bg-primary/10" : "border-border/50 hover:border-border",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onToggle()}
    >
      <div className="flex items-start gap-3">
        <Checkbox 
          checked={selected} 
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{suggestion.label}</span>
            <StageBadge stage={suggestion.stage} />
            {suggestion.isLossy && (
              <Badge variant="destructive" className="text-xs">Data Loss</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{suggestion.description}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {suggestion.ops.length} operation(s)
          </p>
        </div>
      </div>
    </div>
  );
}

function ViolationsList({ violations }: { violations: { path: string; message: string; severity: string }[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? violations : violations.slice(0, 3);
  
  return (
    <div className="space-y-1">
      {shown.map((v, i) => (
        <div 
          key={i}
          className={cn(
            "text-xs p-2 rounded flex items-start gap-2",
            v.severity === 'error' ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"
          )}
        >
          {v.severity === 'error' ? <XCircle className="h-3 w-3 mt-0.5 shrink-0" /> : <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />}
          <div>
            <span className="font-mono">{v.path}</span>
            <span className="text-muted-foreground ml-1">{v.message}</span>
          </div>
        </div>
      ))}
      {violations.length > 3 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs h-6"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : `+${violations.length - 3} more`}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SaveRecoveryModal({
  open,
  snapshot,
  onClose,
  onRecovered,
  onAbort,
}: SaveRecoveryModalProps) {
  // State
  const [recoveryState, setRecoveryState] = useState<RecoveryModeState | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [stageCConfirmed, setStageCConfirmed] = useState(false);
  const [applyResult, setApplyResult] = useState<RecoveryResult | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'stageB' | 'stageC' | 'result'>('overview');

  // Initialize recovery state when snapshot changes
  React.useEffect(() => {
    if (snapshot && open) {
      const state = initializeRecoveryMode(snapshot);
      setRecoveryState(state);
      setSelectedSuggestions(new Set());
      setStageCConfirmed(false);
      setApplyResult(null);
      setCurrentView('overview');
    }
  }, [snapshot, open]);

  // Computed values
  const stageACanFix = recoveryState?.stageAResult?.wouldSucceed ?? false;
  const stageAOps = recoveryState?.stageAResult?.proposedOps ?? [];
  const stageADiffs = recoveryState?.stageAResult?.diffSummary ?? [];

  const selectedBOps = useMemo(() => {
    if (!recoveryState) return [];
    return recoveryState.stageBSuggestions
      .filter(s => selectedSuggestions.has(s.id))
      .flatMap(s => s.ops);
  }, [recoveryState, selectedSuggestions]);

  const selectedCOps = useMemo(() => {
    if (!recoveryState) return [];
    return recoveryState.stageCOptions
      .filter(s => selectedSuggestions.has(s.id))
      .flatMap(s => s.ops);
  }, [recoveryState, selectedSuggestions]);

  // Handlers
  const handleApplyStageA = async () => {
    if (!snapshot || !recoveryState?.stageAResult) return;
    
    setIsApplying(true);
    try {
      const result = applyRecoveryOps(snapshot, stageAOps, 'Auto-repair (Stage A)');
      setApplyResult(result);
      setCurrentView('result');
      
      logRecoveryAction({
        timestamp: Date.now(),
        signature: snapshot.signature,
        campaignId: snapshot.campaignId,
        action: 'auto-repair',
        opsApplied: stageAOps.length,
        success: result.success,
        lossyOps: false,
      });
      
      if (result.success) {
        const save = JSON.parse(snapshot.originalSave);
        onRecovered(save);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplySelected = async () => {
    if (!snapshot) return;
    
    const allOps = [...selectedBOps, ...selectedCOps];
    if (allOps.length === 0) return;
    
    const hasLossy = selectedCOps.length > 0;
    if (hasLossy && !stageCConfirmed) return;
    
    setIsApplying(true);
    try {
      const result = applyRecoveryOps(
        snapshot, 
        allOps, 
        hasLossy ? 'Manual repair (Stage B+C)' : 'Assisted repair (Stage B)'
      );
      setApplyResult(result);
      setCurrentView('result');
      
      logRecoveryAction({
        timestamp: Date.now(),
        signature: snapshot.signature,
        campaignId: snapshot.campaignId,
        action: hasLossy ? 'salvage' : 'manual-repair',
        opsApplied: allOps.length,
        success: result.success,
        lossyOps: hasLossy,
      });
      
      if (result.success) {
        const save = JSON.parse(snapshot.originalSave);
        onRecovered(save);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleExport = () => {
    if (!snapshot) return;
    
    const report = exportFailureReport(snapshot);
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `save-recovery-${snapshot.campaignId}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    logRecoveryAction({
      timestamp: Date.now(),
      signature: snapshot.signature,
      campaignId: snapshot.campaignId,
      action: 'export',
      opsApplied: 0,
      success: true,
      lossyOps: false,
    });
  };

  const handleAbort = () => {
    if (snapshot) {
      logRecoveryAction({
        timestamp: Date.now(),
        signature: snapshot.signature,
        campaignId: snapshot.campaignId,
        action: 'abort',
        opsApplied: 0,
        success: false,
        lossyOps: false,
      });
    }
    onAbort();
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (!snapshot || !recoveryState) return null;

  // Parse violations from snapshot
  const violations = snapshot.brokenPaths.map(bp => {
    const [path, ...msgParts] = bp.split(': ');
    return { path, message: msgParts.join(': ') || 'Invalid', severity: 'error' as const };
  });

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-amber-500" />
            Save Recovery Mode
          </DialogTitle>
          <DialogDescription>
            Your save file has issues that need to be fixed before loading.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {currentView === 'overview' && (
            <div className="space-y-4">
              {/* Error Summary */}
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">
                    {violations.length} Issue(s) Detected
                  </span>
                </div>
                <ViolationsList violations={violations} />
              </div>

              {/* Stage A: Auto Repair */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  <ChevronDown className="h-4 w-4" />
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Stage A: Safe Auto-Repair</span>
                  <StageBadge stage="A" />
                  {stageACanFix && (
                    <Badge variant="outline" className="ml-auto text-green-500 border-green-500">
                      Can Fix All
                    </Badge>
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 pl-6 space-y-2">
                  {stageAOps.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No safe auto-repairs available.</p>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mb-2">
                        {stageAOps.length} safe operation(s) will be applied automatically:
                      </p>
                      {stageADiffs.map((diff, i) => (
                        <DiffSummaryItem key={i} diff={diff} />
                      ))}
                      <Button 
                        className="mt-2" 
                        onClick={handleApplyStageA}
                        disabled={isApplying}
                      >
                        <Wrench className="h-4 w-4 mr-2" />
                        {isApplying ? 'Applying...' : 'Apply Safe Repairs'}
                      </Button>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Stage B: Assisted Repair */}
              {recoveryState.stageBSuggestions.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    <ChevronDown className="h-4 w-4" />
                    <Wrench className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Stage B: Assisted Repair</span>
                    <StageBadge stage="B" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pl-6 space-y-2">
                    <p className="text-sm text-muted-foreground mb-2">
                      Select repairs that require your confirmation:
                    </p>
                    {recoveryState.stageBSuggestions.map(suggestion => (
                      <RecoverySuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        selected={selectedSuggestions.has(suggestion.id)}
                        onToggle={() => toggleSuggestion(suggestion.id)}
                      />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Stage C: Lossy Salvage */}
              {recoveryState.stageCOptions.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                    <ChevronDown className="h-4 w-4" />
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Stage C: Lossy Salvage</span>
                    <StageBadge stage="C" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 pl-6 space-y-2">
                    <div className="bg-destructive/10 border border-destructive/30 rounded p-2 text-xs text-destructive mb-2">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Warning: These operations will permanently delete data.
                    </div>
                    {recoveryState.stageCOptions.map(option => (
                      <RecoverySuggestionCard
                        key={option.id}
                        suggestion={option}
                        selected={selectedSuggestions.has(option.id)}
                        onToggle={() => toggleSuggestion(option.id)}
                      />
                    ))}
                    {selectedCOps.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 p-2 bg-destructive/20 rounded">
                        <Checkbox 
                          id="confirm-loss"
                          checked={stageCConfirmed}
                          onCheckedChange={(c) => setStageCConfirmed(!!c)}
                        />
                        <label htmlFor="confirm-loss" className="text-xs text-destructive cursor-pointer">
                          I understand this will permanently delete data
                        </label>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Apply Selected */}
              {(selectedBOps.length > 0 || selectedCOps.length > 0) && (
                <div className="border-t border-border pt-4">
                  <Button 
                    onClick={handleApplySelected}
                    disabled={isApplying || (selectedCOps.length > 0 && !stageCConfirmed)}
                    className="w-full"
                    variant={selectedCOps.length > 0 ? "destructive" : "default"}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Apply {selectedBOps.length + selectedCOps.length} Selected Operation(s)
                  </Button>
                </div>
              )}
            </div>
          )}

          {currentView === 'result' && applyResult && (
            <div className="space-y-4">
              {/* Result Header */}
              <div className={cn(
                "rounded-lg p-4 flex items-center gap-3",
                applyResult.success ? "bg-green-500/10 border border-green-500/30" : "bg-destructive/10 border border-destructive/30"
              )}>
                {applyResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <div>
                  <p className="font-medium">
                    {applyResult.success ? 'Recovery Successful!' : 'Recovery Failed'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {applyResult.appliedOps.length} operation(s) applied
                  </p>
                </div>
              </div>

              {/* Applied Operations */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Applied Changes:</h4>
                {applyResult.diffSummary.map((diff, i) => (
                  <DiffSummaryItem key={i} diff={diff} />
                ))}
              </div>

              {/* Post-invariant Status */}
              {applyResult.postInvariantStatus && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Validation Status:</h4>
                  {applyResult.postInvariantStatus.valid ? (
                    <div className="bg-green-500/10 p-2 rounded text-sm text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      All checks passed
                    </div>
                  ) : (
                    <ViolationsList violations={applyResult.postInvariantStatus.violations} />
                  )}
                </div>
              )}

              {/* Errors */}
              {applyResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-destructive">Errors:</h4>
                  {applyResult.errors.map((err, i) => (
                    <div key={i} className="bg-destructive/10 p-2 rounded text-xs text-destructive">
                      {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <Separator className="my-2" />

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleAbort}>
              Abort
            </Button>
            {currentView === 'result' && applyResult?.success && (
              <Button onClick={onClose}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Continue
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
