// ============================================================================
// STORAGE CLEANUP WIZARD - Help users free up storage space
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Trash2,
  Clock,
  HardDrive,
  AlertTriangle,
  Sparkles,
  Calendar,
  User,
  FileText,
  Download,
} from 'lucide-react';
import { CampaignMetadata } from '@/types/campaign';
import { UnifiedSaveService } from '@/services/unifiedSaveService';
import { StorageHealthMonitor } from '@/systems/StorageHealthMonitor';
import { cn } from '@/lib/utils';
import LZString from 'lz-string';

interface StorageCleanupWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CampaignWithSize extends CampaignMetadata {
  sizeBytes: number;
  sizeFormatted: string;
  daysSinceLastPlayed: number;
  isStale: boolean;
}

const GUEST_PREFIX = 'guest_local_';
const STALE_DAYS_THRESHOLD = 30; // Campaigns not played in 30+ days

export const StorageCleanupWizard: React.FC<StorageCleanupWizardProps> = ({
  isOpen,
  onClose,
}) => {
  const [campaigns, setCampaigns] = useState<CampaignWithSize[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ used: 0, total: 0, percent: 0 });

  // Load campaigns and calculate sizes
  useEffect(() => {
    if (!isOpen) return;

    const loadCampaigns = async () => {
      setIsLoading(true);
      try {
        const metadata = await UnifiedSaveService.listCampaigns();
        
        const campaignsWithSize: CampaignWithSize[] = metadata.map(meta => {
          // Get raw size from localStorage
          let sizeBytes = 0;
          try {
            const key = `${GUEST_PREFIX}${meta.id}`;
            const data = localStorage.getItem(key);
            if (data) {
              sizeBytes = data.length * 2; // UTF-16 encoding
            }
          } catch {
            // Ignore
          }

          const daysSinceLastPlayed = Math.floor(
            (Date.now() - meta.updatedAt) / (1000 * 60 * 60 * 24)
          );

          return {
            ...meta,
            sizeBytes,
            sizeFormatted: formatBytes(sizeBytes),
            daysSinceLastPlayed,
            isStale: daysSinceLastPlayed > STALE_DAYS_THRESHOLD,
          };
        });

        // Sort by last played (oldest first)
        campaignsWithSize.sort((a, b) => a.updatedAt - b.updatedAt);

        setCampaigns(campaignsWithSize);

        // Get quota info
        const health = StorageHealthMonitor.getHealth();
        if (health) {
          setQuotaInfo({
            used: health.quotaUsedBytes,
            total: health.quotaTotalBytes,
            percent: health.quotaUsedPercent,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [isOpen]);

  // Calculate selected size
  const selectedStats = useMemo(() => {
    let totalSize = 0;
    let count = 0;
    for (const campaign of campaigns) {
      if (selectedIds.has(campaign.id)) {
        totalSize += campaign.sizeBytes;
        count++;
      }
    }
    return { totalSize, count, formatted: formatBytes(totalSize) };
  }, [selectedIds, campaigns]);

  // Calculate total recoverable space (stale campaigns)
  const staleStats = useMemo(() => {
    const staleCampaigns = campaigns.filter(c => c.isStale);
    const totalSize = staleCampaigns.reduce((sum, c) => sum + c.sizeBytes, 0);
    return {
      count: staleCampaigns.length,
      totalSize,
      formatted: formatBytes(totalSize),
    };
  }, [campaigns]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectStale = () => {
    const staleIds = campaigns.filter(c => c.isStale).map(c => c.id);
    setSelectedIds(new Set(staleIds));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleExportSelected = async () => {
    // Export selected campaigns before deleting
    for (const id of selectedIds) {
      const campaign = campaigns.find(c => c.id === id);
      if (campaign) {
        try {
          const data = await UnifiedSaveService.loadCampaign(id);
          if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (e) {
          console.error(`Failed to export ${campaign.name}:`, e);
        }
      }
    }
  };

  const handleDeleteConfirmed = async () => {
    setIsDeleting(true);
    setShowConfirmDelete(false);

    try {
      for (const id of selectedIds) {
        await UnifiedSaveService.deleteCampaign(id);
      }

      // Refresh the list
      setCampaigns(prev => prev.filter(c => !selectedIds.has(c.id)));
      setSelectedIds(new Set());

      // Trigger backup after cleanup
      await StorageHealthMonitor.triggerManualBackup();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Storage Cleanup Wizard
            </DialogTitle>
            <DialogDescription>
              Free up storage space by removing old or unused campaigns.
            </DialogDescription>
          </DialogHeader>

          {/* Quota Overview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm">
                <HardDrive className="h-4 w-4" />
                Storage Usage
              </span>
              <span className={cn(
                'font-medium',
                quotaInfo.percent >= 80 ? 'text-destructive' : 'text-primary'
              )}>
                {quotaInfo.percent}%
              </span>
            </div>
            <Progress value={quotaInfo.percent} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBytes(quotaInfo.used)} used</span>
              <span>{formatBytes(quotaInfo.total)} total</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {staleStats.count > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectStale}
                className="gap-1.5"
              >
                <Clock className="h-4 w-4 text-amber-500" />
                Select Stale ({staleStats.count})
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectNone}
              disabled={selectedIds.size === 0}
            >
              Clear Selection
            </Button>
            {selectedIds.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportSelected}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                Export Selected
              </Button>
            )}
          </div>

          {/* Campaign List */}
          <ScrollArea className="flex-1 min-h-[200px] max-h-[300px] border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                Loading campaigns...
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No campaigns found
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer',
                      selectedIds.has(campaign.id)
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-card hover:bg-muted/50 border-transparent'
                    )}
                    onClick={() => handleToggle(campaign.id)}
                  >
                    <Checkbox
                      checked={selectedIds.has(campaign.id)}
                      onCheckedChange={() => handleToggle(campaign.id)}
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{campaign.name}</span>
                        {campaign.isStale && (
                          <Badge variant="outline" className="text-amber-500 border-amber-500/30 shrink-0">
                            <Clock className="h-3 w-3 mr-1" />
                            Stale
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {campaign.characterName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {campaign.daysSinceLastPlayed === 0
                            ? 'Today'
                            : campaign.daysSinceLastPlayed === 1
                            ? 'Yesterday'
                            : `${campaign.daysSinceLastPlayed}d ago`}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {campaign.chapterCount} chapters
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={cn(
                        'text-sm font-medium',
                        campaign.sizeBytes > 500000 ? 'text-amber-500' : 'text-muted-foreground'
                      )}>
                        {campaign.sizeFormatted}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Selection Summary */}
          {selectedIds.size > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">
                  <strong>{selectedStats.count}</strong> campaign{selectedStats.count !== 1 ? 's' : ''} selected
                </span>
                <span className="text-sm font-medium text-destructive">
                  {selectedStats.formatted} will be freed
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowConfirmDelete(true)}
              disabled={selectedIds.size === 0 || isDeleting}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting...' : `Delete ${selectedIds.size} Campaign${selectedIds.size !== 1 ? 's' : ''}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Campaigns Permanently?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to permanently delete <strong>{selectedStats.count}</strong> campaign
                {selectedStats.count !== 1 ? 's' : ''}. This action cannot be undone!
              </p>
              <p className="text-destructive font-medium">
                This will free up {selectedStats.formatted} of storage space.
              </p>
              <p className="text-sm">
                Tip: Use "Export Selected" first to create backups before deleting.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default StorageCleanupWizard;
