// Complete Game State Backup & Restore System
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Download, Upload, FileArchive, CheckCircle2, AlertCircle, 
  Loader2, HardDrive, Clock, User, Scroll
} from 'lucide-react';
import { toast } from 'sonner';
import LZString from 'lz-string';
import { loadCampaignIndex, loadCampaign, saveCampaign, saveCampaignIndex } from '@/lib/campaignStorage';
import { loadLifetimeStats, saveLifetimeStats, LifetimeStatistics } from '@/lib/lifetimeStats';
import { loadLifetimeAchievementState, saveLifetimeAchievementState } from '@/lib/lifetimeAchievements';
import { CampaignData, CampaignMetadata } from '@/types/campaign';

interface BackupData {
  version: number;
  createdAt: number;
  deviceInfo: string;
  campaigns: CampaignData[];
  campaignIndex: CampaignMetadata[];
  lifetimeStats: LifetimeStatistics;
  lifetimeAchievements: { unlockedIds: string[]; lastChecked: number };
  settings: Record<string, unknown>;
}

const BACKUP_VERSION = 1;

function gatherAllGameData(): BackupData {
  // Gather all campaigns
  const campaignIndex = loadCampaignIndex();
  const campaigns: CampaignData[] = [];
  
  for (const meta of campaignIndex) {
    const campaign = loadCampaign(meta.id);
    if (campaign) {
      campaigns.push(campaign);
    }
  }
  
  // Gather lifetime stats
  const lifetimeStats = loadLifetimeStats();
  
  // Gather achievements
  const lifetimeAchievements = loadLifetimeAchievementState();
  
  // Gather settings from localStorage
  const settings: Record<string, unknown> = {};
  const settingsKeys = ['game_settings', 'narrator_settings', 'audio_settings', 'onboarding_completed'];
  for (const key of settingsKeys) {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        settings[key] = JSON.parse(value);
      } catch {
        settings[key] = value;
      }
    }
  }
  
  return {
    version: BACKUP_VERSION,
    createdAt: Date.now(),
    deviceInfo: navigator.userAgent,
    campaigns,
    campaignIndex,
    lifetimeStats,
    lifetimeAchievements,
    settings,
  };
}

function restoreGameData(backup: BackupData): { success: boolean; errors: string[]; restored: { campaigns: number; settings: number } } {
  const errors: string[] = [];
  let campaignsRestored = 0;
  let settingsRestored = 0;
  
  try {
    // Restore lifetime stats
    if (backup.lifetimeStats) {
      saveLifetimeStats(backup.lifetimeStats);
    }
    
    // Restore achievements
    if (backup.lifetimeAchievements) {
      saveLifetimeAchievementState(backup.lifetimeAchievements);
    }
    
    // Restore campaigns
    if (backup.campaigns && backup.campaigns.length > 0) {
      // saveCampaign and saveCampaignIndex are imported statically at top of file
      
      // Restore each campaign
      for (const campaign of backup.campaigns) {
        try {
          saveCampaign(campaign, false); // Don't auto-sync to cloud during restore
          campaignsRestored++;
        } catch (e) {
          errors.push(`Failed to restore campaign: ${campaign.meta?.name || 'Unknown'}`);
        }
      }
      
      // Update campaign index
      if (backup.campaignIndex) {
        saveCampaignIndex(backup.campaignIndex);
      }
    }
    
    // Restore settings
    if (backup.settings) {
      for (const [key, value] of Object.entries(backup.settings)) {
        try {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          settingsRestored++;
        } catch (e) {
          errors.push(`Failed to restore setting: ${key}`);
        }
      }
    }
    
    return {
      success: errors.length === 0,
      errors,
      restored: { campaigns: campaignsRestored, settings: settingsRestored },
    };
  } catch (e) {
    errors.push(`Critical restore error: ${e}`);
    return { success: false, errors, restored: { campaigns: campaignsRestored, settings: settingsRestored } };
  }
}

export function BackupRestoreModal() {
  const [open, setOpen] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restorePreview, setRestorePreview] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    setIsBackingUp(true);
    
    try {
      const data = gatherAllGameData();
      
      // Compress the data
      const jsonString = JSON.stringify(data);
      const compressed = LZString.compressToBase64(jsonString);
      
      // Create downloadable file
      const blob = new Blob([compressed], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `untold-backup-${new Date().toISOString().split('T')[0]}.untold`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Backup created!', {
        description: `${data.campaigns.length} campaigns saved`,
      });
    } catch (e) {
      toast.error('Backup failed', { description: String(e) });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const compressed = e.target?.result as string;
        const jsonString = LZString.decompressFromBase64(compressed);
        
        if (!jsonString) {
          toast.error('Invalid backup file', { description: 'Could not decompress data' });
          return;
        }
        
        const data = JSON.parse(jsonString) as BackupData;
        
        // Validate backup structure
        if (!data.version || !data.createdAt) {
          toast.error('Invalid backup file', { description: 'Missing required fields' });
          return;
        }
        
        setRestorePreview(data);
      } catch (e) {
        toast.error('Failed to read backup', { description: String(e) });
      }
    };
    reader.readAsText(file);
    
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const handleRestore = async () => {
    if (!restorePreview) return;
    
    setIsRestoring(true);
    
    try {
      const result = restoreGameData(restorePreview);
      
      if (result.success) {
        toast.success('Restore complete!', {
          description: `Restored ${result.restored.campaigns} campaigns`,
        });
        setRestorePreview(null);
        setOpen(false);
        
        // Reload page to apply changes
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.warning('Restore completed with errors', {
          description: result.errors.join(', '),
        });
      }
    } catch (e) {
      toast.error('Restore failed', { description: String(e) });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <FileArchive className="w-4 h-4" />
          <span>Backup / Restore</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-primary" />
            Backup & Restore
          </DialogTitle>
          <DialogDescription>
            Download a complete backup of all your game data or restore from a previous backup.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Backup Section */}
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              <span className="font-medium">Create Backup</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Download a compressed file containing all campaigns, stats, achievements, and settings.
            </p>
            <Button 
              onClick={handleBackup} 
              disabled={isBackingUp}
              className="w-full gap-2"
            >
              {isBackingUp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Backup
                </>
              )}
            </Button>
          </div>

          {/* Restore Section */}
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-500" />
              <span className="font-medium">Restore from Backup</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Load a backup file to restore your game data. This will merge with existing data.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".untold"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Backup File
            </Button>
          </div>

          {/* Restore Preview */}
          {restorePreview && (
            <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">Backup Loaded</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Created: {formatDate(restorePreview.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Scroll className="w-3.5 h-3.5" />
                  Campaigns: {restorePreview.campaigns?.length || 0}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <HardDrive className="w-3.5 h-3.5" />
                  Version: {restorePreview.version}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setRestorePreview(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  size="sm"
                  onClick={handleRestore}
                  disabled={isRestoring}
                  className="flex-1 gap-2"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Restore
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
