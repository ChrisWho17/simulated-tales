// Pre-Migration Comprehensive Backup Modal
// Use this BEFORE any save system changes to ensure zero data loss

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Cloud,
  HardDrive,
  Clock,
  Users,
  FileArchive,
  AlertTriangle,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createComprehensiveBackup,
  verifyBackup,
  compressBackup,
  getBackupFilename,
  formatPlayTime,
  BackupProgress,
  ComprehensiveBackup,
} from '@/services/comprehensiveBackupService';

interface PreMigrationBackupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBackupComplete?: (backup: ComprehensiveBackup) => void;
}

export function PreMigrationBackupModal({
  open,
  onOpenChange,
  onBackupComplete,
}: PreMigrationBackupModalProps) {
  const [phase, setPhase] = useState<'ready' | 'backing-up' | 'verifying' | 'complete' | 'error'>('ready');
  const [progress, setProgress] = useState<BackupProgress | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);
  const [backup, setBackup] = useState<ComprehensiveBackup | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const handleProgress = useCallback((p: BackupProgress) => {
    setProgress(p);
    
    // Calculate overall progress
    const phaseWeights: Record<string, { start: number; weight: number }> = {
      init: { start: 0, weight: 5 },
      local: { start: 5, weight: 25 },
      cloud: { start: 30, weight: 25 },
      guest: { start: 55, weight: 10 },
      legacy: { start: 65, weight: 10 },
      settings: { start: 75, weight: 10 },
      finalize: { start: 85, weight: 15 },
    };
    
    const phaseInfo = phaseWeights[p.phase] || { start: 0, weight: 10 };
    const phaseProgress = p.total > 0 ? (p.current / p.total) * phaseInfo.weight : phaseInfo.weight;
    setProgressPercent(Math.min(100, phaseInfo.start + phaseProgress));
  }, []);

  const handleBackup = async () => {
    setPhase('backing-up');
    setErrors([]);
    setWarnings([]);
    setProgressPercent(0);
    
    try {
      // Create backup
      const result = await createComprehensiveBackup(handleProgress);
      
      if (!result.backup) {
        setPhase('error');
        setErrors(result.errors);
        return;
      }
      
      setWarnings(result.warnings);
      
      // Verify backup
      setPhase('verifying');
      setProgressPercent(95);
      const verification = await verifyBackup(result.backup);
      
      if (!verification.valid) {
        setErrors([...result.errors, ...verification.issues]);
        setPhase('error');
        return;
      }
      
      setBackup(result.backup);
      setErrors(result.errors);
      setProgressPercent(100);
      setPhase('complete');
      
      toast.success('Backup created successfully!', {
        description: `${result.backup.manifest.summary.totalCampaigns} campaigns backed up`,
      });
      
      onBackupComplete?.(result.backup);
    } catch (e) {
      setPhase('error');
      setErrors([`Backup failed: ${e}`]);
    }
  };

  const handleDownload = () => {
    if (!backup) return;
    
    try {
      const compressed = compressBackup(backup);
      const blob = new Blob([compressed], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = getBackupFilename();
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Backup downloaded!', {
        description: 'Keep this file safe before proceeding',
      });
    } catch (e) {
      toast.error('Download failed', { description: String(e) });
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Pre-Migration Backup
          </DialogTitle>
          <DialogDescription>
            Create a comprehensive backup of ALL your game data before the save system overhaul.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Ready State */}
          {phase === 'ready' && (
            <>
              <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">Important</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This backup captures <strong>all</strong> your data from multiple sources:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li className="flex items-center gap-2">
                    <HardDrive className="w-3.5 h-3.5" /> Local campaigns
                  </li>
                  <li className="flex items-center gap-2">
                    <Cloud className="w-3.5 h-3.5" /> Cloud campaigns (if logged in)
                  </li>
                  <li className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" /> Legacy save data
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Lifetime stats & achievements
                  </li>
                </ul>
              </div>

              <Button onClick={handleBackup} className="w-full gap-2">
                <FileArchive className="w-4 h-4" />
                Create Comprehensive Backup
              </Button>
            </>
          )}

          {/* Backing Up State */}
          {(phase === 'backing-up' || phase === 'verifying') && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <div className="flex-1">
                  <p className="font-medium">
                    {phase === 'verifying' ? 'Verifying backup...' : 'Creating backup...'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {progress?.message || 'Initializing...'}
                  </p>
                </div>
              </div>
              
              <Progress value={progressPercent} className="h-2" />
              
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progressPercent)}% complete
              </p>
            </div>
          )}

          {/* Complete State */}
          {phase === 'complete' && backup && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-green-500/30 bg-green-500/10 space-y-3">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Backup Complete!</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    <span>{backup.manifest.summary.totalCampaigns} campaigns</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{backup.manifest.summary.cloudCampaigns} cloud</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>{backup.manifest.summary.localCampaigns} local</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatPlayTime(backup.manifest.summary.totalPlayTimeSeconds)}</span>
                  </div>
                </div>

                {backup.manifest.summary.oldestCampaign && (
                  <p className="text-xs text-muted-foreground">
                    Campaigns from {formatDate(backup.manifest.summary.oldestCampaign)} to {formatDate(backup.manifest.summary.newestCampaign)}
                  </p>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                  <p className="text-sm text-amber-400 font-medium mb-1">Warnings:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {errors.length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                  <p className="text-sm text-red-400 font-medium mb-1">Errors (non-critical):</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={handleDownload} className="w-full gap-2">
                <Download className="w-4 h-4" />
                Download Backup File
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Checksum: <code className="bg-muted px-1 rounded">{backup.manifest.checksums.overall.slice(0, 16)}...</code>
              </p>
            </div>
          )}

          {/* Error State */}
          {phase === 'error' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 space-y-2">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Backup Failed</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {errors.map((e, i) => (
                    <li key={i}>• {e}</li>
                  ))}
                </ul>
              </div>

              <Button onClick={() => setPhase('ready')} variant="outline" className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
