// ============================================================================
// CLOUD CONFLICT MODAL - Resolve sync conflicts between local and cloud saves
// ============================================================================

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CloudSyncService, SyncConflict } from '@/services/cloudSyncService';
import { loadCampaign } from '@/lib/campaignStorage';
import { formatLastPlayed } from '@/lib/campaignStorage';
import { AlertTriangle, Cloud, Monitor, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CloudConflictModalProps {
  open: boolean;
  conflicts: SyncConflict[];
  onResolved: () => void;
  onClose: () => void;
}

export function CloudConflictModal({ 
  open, 
  conflicts, 
  onResolved, 
  onClose 
}: CloudConflictModalProps) {
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());

  const handleResolve = async (conflict: SyncConflict, resolution: 'local' | 'cloud') => {
    setResolving(conflict.campaignId);
    
    const result = await CloudSyncService.resolveConflict(conflict.campaignId, resolution);
    
    if (result.success) {
      setResolved(prev => new Set([...prev, conflict.campaignId]));
      toast.success(`Conflict resolved using ${resolution} version`);
    } else {
      toast.error(result.error || 'Failed to resolve conflict');
    }
    
    setResolving(null);
  };

  const handleClose = () => {
    if (resolved.size === conflicts.length) {
      onResolved();
    } else {
      onClose();
    }
    setResolved(new Set());
  };

  const allResolved = resolved.size === conflicts.length;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Sync Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            These campaigns have different versions locally and in the cloud. Choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {conflicts.map(conflict => {
            const isResolved = resolved.has(conflict.campaignId);
            const isResolving = resolving === conflict.campaignId;
            const localCampaign = loadCampaign(conflict.campaignId);

            return (
              <Card key={conflict.campaignId} className={isResolved ? 'opacity-50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium truncate">
                      {localCampaign?.meta.name || 'Unknown Campaign'}
                    </h4>
                    {isResolved && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 rounded bg-muted">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Monitor className="h-3 w-3" />
                        Local Version
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatLastPlayed(conflict.localUpdatedAt)}
                      </p>
                    </div>
                    <div className="p-2 rounded bg-muted">
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Cloud className="h-3 w-3" />
                        Cloud Version
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatLastPlayed(new Date(conflict.cloudUpdatedAt).getTime())}
                      </p>
                    </div>
                  </div>

                  {!isResolved && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleResolve(conflict, 'local')}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Monitor className="h-4 w-4 mr-1" />
                            Keep Local
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleResolve(conflict, 'cloud')}
                        disabled={isResolving}
                      >
                        {isResolving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Cloud className="h-4 w-4 mr-1" />
                            Keep Cloud
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={handleClose} variant={allResolved ? 'default' : 'outline'}>
            {allResolved ? 'Done' : 'Close'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
