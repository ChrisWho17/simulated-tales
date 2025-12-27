// ============================================================================
// ASK AI HELP MODAL
// UI for AI-assisted fix proposals with proof mode display
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Copy,
  Sparkles,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  Star,
  Eye,
  ThumbsUp,
  FileWarning,
  RefreshCw,
  Loader2,
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
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  FailureSnapshot,
  FixProposal,
  GateResult,
  ProofDisplay,
  ApprovedRecipe,
  VerificationResult,
  GateId,
} from '@/lib/saveRecovery/types';
import {
  generateSupportPacket,
  generatePromptContext,
  parseAIProposal,
} from '@/lib/saveRecovery/supportPacket';
import {
  addToInbox,
  getApprovedRecipe,
  promoteToApproved,
  generateProofDisplay,
  findAutoApplyableRecipe,
  getInboxProposalsForSignature,
  recordRecipeApplication,
} from '@/lib/saveRecovery/twoTierCache';
import { verifyProposal } from '@/lib/saveRecovery/verificationGates';
import { applyRecoveryOps, logRecoveryAction } from '@/lib/saveRecovery/pipeline';

// ============================================================================
// TYPES
// ============================================================================

interface AskAIHelpModalProps {
  open: boolean;
  snapshot: FailureSnapshot | null;
  onClose: () => void;
  onRecovered: (save: unknown) => void;
  onSwitchToRecovery: () => void;
}

interface ProposalReview {
  proposal: FixProposal;
  verification: VerificationResult;
  proof: ProofDisplay;
  existingRecipe: ApprovedRecipe | null;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function GateStatusBadge({ result }: { result: GateResult }) {
  const gateLabels: Record<GateId, string> = {
    A: 'Determinism',
    B: 'Diff Sanity',
    C: 'Invariants',
    D: 'Smoke Tests',
    E: 'Generalization',
  };

  return (
    <div className={cn(
      'flex items-center gap-2 px-2 py-1 rounded text-xs',
      result.passed
        ? 'bg-green-500/10 text-green-400'
        : 'bg-destructive/10 text-destructive'
    )}>
      {result.passed ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <XCircle className="h-3 w-3" />
      )}
      <span className="font-medium">Gate {result.gate}</span>
      <span className="text-muted-foreground">{gateLabels[result.gate]}</span>
    </div>
  );
}

function TrustScoreDisplay({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const getColor = () => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-destructive';
  };

  return (
    <div className="flex items-center gap-2">
      <Star className={cn('h-4 w-4', getColor())} />
      {showLabel && <span className="text-xs text-muted-foreground">Trust:</span>}
      <span className={cn('font-bold', getColor())}>{score}</span>
      <Progress value={score} className="w-16 h-1.5" />
    </div>
  );
}

function RiskBadge({ risk }: { risk: 'low' | 'medium' | 'high' }) {
  const config = {
    low: { label: 'Low Risk', className: 'bg-green-600 hover:bg-green-700' },
    medium: { label: 'Medium Risk', className: 'bg-amber-600 hover:bg-amber-700' },
    high: { label: 'High Risk', className: 'bg-destructive hover:bg-destructive/90' },
  };
  const { label, className } = config[risk];
  return <Badge className={cn('text-xs', className)}>{label}</Badge>;
}

function ProofModePanel({ proof, proposal }: { proof: ProofDisplay; proposal: FixProposal }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-border/50 rounded-lg p-3 bg-muted/20">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <Eye className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">Proof Mode</span>
        {proof.isAutoApplyable && (
          <Badge variant="outline" className="ml-auto text-green-400 border-green-500 text-xs">
            Auto-Applyable
          </Badge>
        )}
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 pl-6">
          {/* Trust Score */}
          <div className="flex items-center justify-between">
            <TrustScoreDisplay score={proof.trustScore} />
            <RiskBadge risk={proof.risk} />
          </div>

          {/* Seen Before */}
          <div className="flex items-center gap-2 text-sm">
            <RefreshCw className={cn('h-4 w-4', proof.seenBefore ? 'text-primary' : 'text-muted-foreground')} />
            <span className={proof.seenBefore ? 'text-primary' : 'text-muted-foreground'}>
              {proof.seenBefore ? 'Seen before - existing recipe found' : 'New fix - not seen before'}
            </span>
          </div>

          {/* Fixed Invariants */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-green-400">
              <CheckCircle2 className="h-3 w-3" />
              <span className="font-medium">Fixes {proof.fixedInvariants.length} invariant(s):</span>
            </div>
            {proof.fixedInvariants.length > 0 ? (
              <div className="pl-5 space-y-0.5">
                {proof.fixedInvariants.slice(0, 5).map((path, i) => (
                  <div key={i} className="text-xs font-mono text-green-300/70">{path}</div>
                ))}
                {proof.fixedInvariants.length > 5 && (
                  <div className="text-xs text-muted-foreground">
                    +{proof.fixedInvariants.length - 5} more
                  </div>
                )}
              </div>
            ) : (
              <div className="pl-5 text-xs text-muted-foreground italic">
                Run verification to see fixed paths
              </div>
            )}
          </div>

          {/* Changed Paths */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="font-medium">Changes {proof.changedPaths.length} path(s):</span>
            </div>
            <div className="pl-5 space-y-0.5">
              {proof.changedPaths.slice(0, 5).map((path, i) => (
                <div key={i} className="text-xs font-mono text-amber-300/70">{path}</div>
              ))}
              {proof.changedPaths.length > 5 && (
                <div className="text-xs text-muted-foreground">
                  +{proof.changedPaths.length - 5} more
                </div>
              )}
            </div>
          </div>

          {/* Gate Results */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground font-medium mb-1">Verification Gates:</div>
            <div className="grid grid-cols-2 gap-1">
              {proof.gateResults.map((gate) => (
                <GateStatusBadge key={gate.gate} result={gate} />
              ))}
            </div>
          </div>

          {/* Reasoning */}
          <div className="bg-muted/40 rounded p-2">
            <div className="text-xs text-muted-foreground font-medium mb-1">AI Reasoning:</div>
            <p className="text-xs text-foreground">{proposal.reasoningSummary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SupportPacketDisplay({ packetContext }: { packetContext: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(packetContext);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [packetContext]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Support Packet</span>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      <pre className="bg-muted/50 rounded p-2 text-xs font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
        {packetContext}
      </pre>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AskAIHelpModal({
  open,
  snapshot,
  onClose,
  onRecovered,
  onSwitchToRecovery,
}: AskAIHelpModalProps) {
  // State
  const [view, setView] = useState<'packet' | 'paste' | 'review' | 'applying'>('packet');
  const [aiResponse, setAIResponse] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [proposalReview, setProposalReview] = useState<ProposalReview | null>(null);
  const [approveForFuture, setApproveForFuture] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [inboxProposals, setInboxProposals] = useState<FixProposal[]>([]);

  // Generate support packet
  const packetContext = useMemo(() => {
    if (!snapshot) return '';
    const packet = generateSupportPacket(snapshot, null, false);
    return generatePromptContext(packet);
  }, [snapshot]);

  // Check for existing proposals when modal opens
  React.useEffect(() => {
    if (snapshot && open) {
      const existing = getInboxProposalsForSignature(snapshot.signature);
      setInboxProposals(existing);
      setView('packet');
      setAIResponse('');
      setParseErrors([]);
      setProposalReview(null);
      setApproveForFuture(false);
    }
  }, [snapshot, open]);

  // Handlers
  const handleParseResponse = useCallback(() => {
    if (!snapshot || !aiResponse.trim()) {
      setParseErrors(['Please paste the AI response']);
      return;
    }

    const result = parseAIProposal(aiResponse, snapshot.signature);
    if (!result.success || !result.proposal) {
      setParseErrors(result.errors);
      return;
    }

    const proposal = result.proposal;
    const save = JSON.parse(snapshot.originalSave);
    const existingRecipe = getApprovedRecipe(snapshot.signature);
    const verification = verifyProposal(proposal, save, { generalizationThreshold: 2 });
    const proof = generateProofDisplay(proposal, verification, existingRecipe);

    setProposalReview({ proposal, verification, proof, existingRecipe });
    setParseErrors([]);
    setView('review');

    // Add to inbox
    addToInbox(proposal);
  }, [snapshot, aiResponse]);

  const handleApplyProposal = useCallback(async () => {
    if (!snapshot || !proposalReview) return;

    setIsApplying(true);
    setView('applying');

    try {
      const { proposal, verification } = proposalReview;

      // If user wants to approve for future, try to promote
      if (approveForFuture && verification.canApprove) {
        const save = JSON.parse(snapshot.originalSave);
        promoteToApproved(proposal, save, { approvalSource: 'user' });
      }

      // Apply the fix
      const result = applyRecoveryOps(snapshot, proposal.ops, `AI Fix (${proposal.stage})`);

      // Record application
      recordRecipeApplication(
        snapshot.signature,
        result.success,
        snapshot.campaignId
      );

      // Log action
      logRecoveryAction({
        timestamp: Date.now(),
        signature: snapshot.signature,
        campaignId: snapshot.campaignId,
        action: 'ai-assisted',
        opsApplied: proposal.ops.length,
        success: result.success,
        lossyOps: proposal.ops.some(op => op.type === 'delete' || op.type === 'truncate'),
      });

      if (result.success) {
        const save = JSON.parse(snapshot.originalSave);
        onRecovered(save);
        onClose();
      } else {
        setParseErrors(['Fix application failed: ' + result.errors.join(', ')]);
        setView('review');
      }
    } finally {
      setIsApplying(false);
    }
  }, [snapshot, proposalReview, approveForFuture, onRecovered, onClose]);

  const handleSelectInboxProposal = useCallback((proposal: FixProposal) => {
    if (!snapshot) return;

    const save = JSON.parse(snapshot.originalSave);
    const existingRecipe = getApprovedRecipe(snapshot.signature);
    const verification = verifyProposal(proposal, save, { generalizationThreshold: 2 });
    const proof = generateProofDisplay(proposal, verification, existingRecipe);

    setProposalReview({ proposal, verification, proof, existingRecipe });
    setView('review');
  }, [snapshot]);

  if (!snapshot) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Ask AI for Help
          </DialogTitle>
          <DialogDescription>
            Get an AI-generated fix proposal for your corrupted save.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          {/* Inbox Proposals */}
          {inboxProposals.length > 0 && view === 'packet' && (
            <div className="mb-4">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left mb-2">
                  <ChevronDown className="h-4 w-4" />
                  <FileWarning className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">
                    {inboxProposals.length} Pending Proposal(s) in Inbox
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2">
                  {inboxProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="border border-border/50 rounded-lg p-3 hover:border-primary/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectInboxProposal(proposal)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          Stage {proposal.stage}
                        </Badge>
                        <RiskBadge risk={proposal.risk} />
                      </div>
                      <p className="text-sm">{proposal.reasoningSummary}</p>
                      <div className="text-xs text-muted-foreground mt-1">
                        {proposal.ops.length} operation(s) • {proposal.source} •{' '}
                        {new Date(proposal.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
              <Separator className="my-3" />
            </div>
          )}

          {view === 'packet' && (
            <div className="space-y-4">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">How it works</span>
                </div>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copy the support packet below</li>
                  <li>Paste it into your AI assistant (Claude, GPT, etc.)</li>
                  <li>Get a structured FixProposal response</li>
                  <li>Paste the response here for verification</li>
                </ol>
              </div>

              <SupportPacketDisplay packetContext={packetContext} />

              <Button onClick={() => setView('paste')} className="w-full">
                <Bot className="h-4 w-4 mr-2" />
                I have an AI response to paste
              </Button>
            </div>
          )}

          {view === 'paste' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Paste AI Response:</label>
                <textarea
                  className="w-full h-48 bg-muted/50 rounded-lg p-3 text-sm font-mono resize-none border border-border focus:border-primary focus:outline-none"
                  placeholder='Paste the JSON FixProposal from the AI here...&#10;&#10;{"stage": "A", "ops": [...], "risk": "low", ...}'
                  value={aiResponse}
                  onChange={(e) => setAIResponse(e.target.value)}
                />
              </div>

              {parseErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded p-2 space-y-1">
                  {parseErrors.map((err, i) => (
                    <div key={i} className="text-xs text-destructive flex items-center gap-2">
                      <XCircle className="h-3 w-3" />
                      {err}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setView('packet')}>
                  Back
                </Button>
                <Button onClick={handleParseResponse} className="flex-1">
                  <Shield className="h-4 w-4 mr-2" />
                  Verify & Review
                </Button>
              </div>
            </div>
          )}

          {view === 'review' && proposalReview && (
            <div className="space-y-4">
              {/* Verification Status */}
              <div className={cn(
                'rounded-lg p-3 flex items-center gap-3',
                proposalReview.verification.canApprove
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-amber-500/10 border border-amber-500/30'
              )}>
                {proposalReview.verification.canApprove ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                )}
                <div>
                  <p className="font-medium text-sm">
                    {proposalReview.verification.canApprove
                      ? 'All verification gates passed'
                      : `${proposalReview.verification.blockingGates.length} gate(s) failed`}
                  </p>
                  {proposalReview.verification.warnings.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {proposalReview.verification.warnings.length} warning(s)
                    </p>
                  )}
                </div>
              </div>

              {/* Proof Mode Panel */}
              <ProofModePanel
                proof={proposalReview.proof}
                proposal={proposalReview.proposal}
              />

              {/* Operations Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">
                  Operations ({proposalReview.proposal.ops.length}):
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {proposalReview.proposal.ops.map((op, i) => (
                    <div key={i} className="text-xs bg-muted/30 rounded p-2">
                      <Badge variant="outline" className="text-xs font-mono mr-2">
                        {op.type}
                      </Badge>
                      <span className="font-mono text-muted-foreground">{op.path}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approve for Future */}
              {proposalReview.verification.canApprove && (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded">
                  <Checkbox
                    id="approve-future"
                    checked={approveForFuture}
                    onCheckedChange={(c) => setApproveForFuture(!!c)}
                  />
                  <label htmlFor="approve-future" className="text-xs cursor-pointer">
                    <ThumbsUp className="h-3 w-3 inline mr-1" />
                    Approve this fix for future use (adds to trusted cache)
                  </label>
                </div>
              )}

              {/* Warnings */}
              {proposalReview.verification.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 space-y-1">
                  {proposalReview.verification.warnings.map((w, i) => (
                    <div key={i} className="text-xs text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" />
                      {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'applying' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Applying fix...</p>
            </div>
          )}
        </ScrollArea>

        <Separator className="my-2" />

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={onSwitchToRecovery}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Manual Recovery
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {view === 'review' && proposalReview && (
              <Button
                onClick={handleApplyProposal}
                disabled={isApplying}
                variant={proposalReview.proposal.stage === 'C' ? 'destructive' : 'default'}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply Fix
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
