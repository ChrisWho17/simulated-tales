// Data Wipe Modal - Complete reset of all game data
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
import { AlertTriangle, Trash2, Cloud, HardDrive, Trophy, Loader2 } from 'lucide-react';
import { wipeAllGameData, getStorageUsageInfo } from '@/lib/gameDataWipe';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DataWipeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWipeComplete?: () => void;
}

export function DataWipeModal({ open, onOpenChange, onWipeComplete }: DataWipeModalProps) {
  const { isAuthenticated } = useAuth();
  const [wipeLocal, setWipeLocal] = useState(true);
  const [wipeCloudSaves, setWipeCloudSaves] = useState(true);
  const [wipeCloudStats, setWipeCloudStats] = useState(true);
  const [wipeAchievements, setWipeAchievements] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [isWiping, setIsWiping] = useState(false);
  
  const storageInfo = getStorageUsageInfo();
  const confirmRequired = 'WIPE ALL';
  const isConfirmed = confirmText === confirmRequired;

  const handleWipe = async () => {
    if (!isConfirmed) return;
    
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
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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

          {/* Confirmation */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Type <span className="font-mono font-bold text-destructive">{confirmRequired}</span> to confirm:
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isWiping}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleWipe}
            disabled={!isConfirmed || isWiping || (!wipeLocal && !wipeCloudSaves && !wipeCloudStats && !wipeAchievements)}
            className="gap-2"
          >
            {isWiping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wiping...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Wipe Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
