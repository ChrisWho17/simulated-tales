// Data Wipe Modal - Complete reset of all game data with multi-step confirmation
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Trash2, Cloud, HardDrive, Trophy, Loader2, ShieldAlert, Skull, XCircle, FileArchive } from 'lucide-react';
import { wipeAllGameData, getStorageUsageInfo } from '@/lib/gameDataWipe';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { BackupRestoreModal } from './BackupRestoreModal';

interface DataWipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWipeComplete?: () => void;
}

type WipeStep = 'options' | 'warning' | 'final';

export function DataWipeModal({ open, onOpenChange, onWipeComplete }: DataWipeModalProps) {
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<WipeStep>('options');
  const [wipeLocal, setWipeLocal] = useState(true);
  const [wipeCloudSaves, setWipeCloudSaves] = useState(true);
  const [wipeCloudStats, setWipeCloudStats] = useState(true);
  const [wipeAchievements, setWipeAchievements] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [finalConfirmText, setFinalConfirmText] = useState('');
  const [acknowledgeNoRecovery, setAcknowledgeNoRecovery] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  
  const storageInfo = getStorageUsageInfo();
  const confirmRequired = 'WIPE ALL';
  const finalConfirmRequired = 'DELETE FOREVER';
  
  const isStep1Valid = confirmText === confirmRequired;
  const isStep2Valid = acknowledgeNoRecovery;
  const isStep3Valid = finalConfirmText === finalConfirmRequired;

  const resetState = () => {
    setStep('options');
    setConfirmText('');
    setFinalConfirmText('');
    setAcknowledgeNoRecovery(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetState();
    }
    onOpenChange(isOpen);
  };

  const handleWipe = async () => {
    if (!isStep3Valid) return;
    
    setIsWiping(true);
    
    try {
      const result = await wipeAllGameData({
        wipeLocal,
        wipeCloudSaves,
        wipeCloudStats,
        wipeAchievements,
      });
      
      if (result.success) {
        toast.success('All game data wiped successfully!', {
          description: `Removed ${result.localKeysRemoved} local items${result.cloudSavesDeleted > 0 ? `, ${result.cloudSavesDeleted} cloud saves` : ''}`,
        });
        handleClose(false);
        onWipeComplete?.();
        
        // Reload the page after a short delay for clean state
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error('Some errors occurred during wipe', {
          description: result.errors.join(', '),
        });
      }
    } catch (e) {
      toast.error('Failed to wipe data', {
        description: String(e),
      });
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Step 1: Options Selection */}
        {step === 'options' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Wipe All Game Data
              </DialogTitle>
              <DialogDescription>
                This will permanently delete all your game data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Backup Suggestion */}
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <FileArchive className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-500">Recommended: Create a Backup First</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Download a backup of your data before wiping. You can restore it later if needed.
                </p>
                <BackupRestoreModal />
              </div>

              {/* Storage Info */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="text-sm text-muted-foreground">Current local storage usage:</div>
                <div className="text-lg font-medium">{storageInfo.formattedSize}</div>
                <div className="text-xs text-muted-foreground">{storageInfo.gameKeys.length} items</div>
              </div>

              {/* Wipe Options */}
              <div className="space-y-3">
                <div className="text-sm font-medium">What to delete:</div>
                
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                  <Checkbox 
                    checked={wipeLocal} 
                    onCheckedChange={(c) => setWipeLocal(c === true)}
                  />
                  <HardDrive className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm">Local Saves & Settings</div>
                    <div className="text-xs text-muted-foreground">All campaigns, settings, preferences</div>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                  <Checkbox 
                    checked={wipeAchievements} 
                    onCheckedChange={(c) => setWipeAchievements(c === true)}
                  />
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-sm">Lifetime Stats & Achievements</div>
                    <div className="text-xs text-muted-foreground">All-time progress and badges</div>
                  </div>
                </label>
                
                {isAuthenticated && (
                  <>
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                      <Checkbox 
                        checked={wipeCloudSaves} 
                        onCheckedChange={(c) => setWipeCloudSaves(c === true)}
                      />
                      <Cloud className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm">Cloud Saves</div>
                        <div className="text-xs text-muted-foreground">All synced campaigns</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                      <Checkbox 
                        checked={wipeCloudStats} 
                        onCheckedChange={(c) => setWipeCloudStats(c === true)}
                      />
                      <Cloud className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="text-sm">Cloud Statistics</div>
                        <div className="text-xs text-muted-foreground">Synced lifetime stats</div>
                      </div>
                    </label>
                  </>
                )}
              </div>

              {/* First Confirmation */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Type <span className="font-mono font-bold text-destructive">{confirmRequired}</span> to continue:
                </div>
                <Input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type WIPE ALL"
                  className="font-mono"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setStep('warning')}
                disabled={!isStep1Valid || (!wipeLocal && !wipeCloudSaves && !wipeCloudStats && !wipeAchievements)}
                className="gap-2"
              >
                <AlertTriangle className="w-4 h-4" />
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Serious Warning */}
        {step === 'warning' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                ⚠️ CRITICAL WARNING ⚠️
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Danger Zone */}
              <div className="p-4 rounded-lg bg-destructive/10 border-2 border-destructive/50">
                <div className="flex items-center gap-2 mb-3">
                  <Skull className="w-5 h-5 text-destructive" />
                  <span className="font-bold text-destructive">POINT OF NO RETURN</span>
                </div>
                
                <div className="space-y-3 text-sm">
                  <p className="text-foreground">
                    You are about to <strong>permanently destroy</strong> the following:
                  </p>
                  
                  <ul className="space-y-1 pl-4">
                    {wipeLocal && (
                      <li className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <span>All local campaigns and saves</span>
                      </li>
                    )}
                    {wipeAchievements && (
                      <li className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <span>All lifetime stats and achievements</span>
                      </li>
                    )}
                    {isAuthenticated && wipeCloudSaves && (
                      <li className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <span>All cloud-synced campaigns</span>
                      </li>
                    )}
                    {isAuthenticated && wipeCloudStats && (
                      <li className="flex items-center gap-2">
                        <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                        <span>All cloud-synced statistics</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* No Recovery Warning */}
              <div className="p-4 rounded-lg bg-background border border-border">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    ❌ NOTHING WILL BE SALVAGEABLE
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Once you proceed, there is <strong>absolutely no way</strong> to recover your data. 
                    No support ticket, no backup recovery, no "undo" button. Your hours of gameplay, 
                    all your achievements, every campaign story - gone forever.
                  </p>
                  
                  <label className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 cursor-pointer mt-3">
                    <Checkbox 
                      checked={acknowledgeNoRecovery} 
                      onCheckedChange={(c) => setAcknowledgeNoRecovery(c === true)}
                      className="mt-0.5"
                    />
                    <div className="text-sm">
                      <strong>I understand and accept</strong> that all my data will be permanently 
                      destroyed and cannot be recovered by any means. I have either made a backup 
                      or I don't care about losing everything.
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('options')}>
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setStep('final')}
                disabled={!isStep2Valid}
                className="gap-2"
              >
                <Skull className="w-4 h-4" />
                I Understand, Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Final Confirmation */}
        {step === 'final' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Final Confirmation
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="p-4 rounded-lg bg-destructive/20 border-2 border-destructive text-center">
                <Skull className="w-12 h-12 mx-auto mb-3 text-destructive" />
                <p className="font-bold text-lg text-destructive mb-2">
                  THIS IS YOUR LAST CHANCE
                </p>
                <p className="text-sm text-muted-foreground">
                  After this, there is no going back.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground text-center">
                  Type <span className="font-mono font-bold text-destructive">{finalConfirmRequired}</span> to permanently delete everything:
                </div>
                <Input
                  value={finalConfirmText}
                  onChange={(e) => setFinalConfirmText(e.target.value.toUpperCase())}
                  placeholder="Type DELETE FOREVER"
                  className="font-mono text-center text-lg"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep('warning')}>
                Go Back
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleWipe}
                disabled={!isStep3Valid || isWiping}
                className="gap-2"
              >
                {isWiping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Destroying Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    DELETE EVERYTHING
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
