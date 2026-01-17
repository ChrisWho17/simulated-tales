// ============================================================================
// CONFLICT RESOLUTION MODAL - User choice for sync conflicts
// Phase 2: Enhanced conflict resolution UI
// ============================================================================

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { 
  Cloud, 
  HardDrive, 
  AlertTriangle, 
  Clock, 
  BookOpen, 
  Timer,
  Check,
  ArrowRight
} from 'lucide-react';
import { SaveConflict, UnifiedSaveArchitecture } from '@/services/unifiedSaveArchitecture';
import { toast } from 'sonner';
import { formatPlayTime } from '@/lib/campaignStorage';

interface ConflictResolutionModalProps {
  open: boolean;
  conflicts: SaveConflict[];
  onResolved: () => void;
  onClose: () => void;
}

export function ConflictResolutionModal({
  open,
  conflicts,
  onResolved,
  onClose,
}: ConflictResolutionModalProps) {
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolved, setResolved] = useState<Set<string>>(new Set());
  
  const handleResolve = async (campaignId: string, resolution: 'local' | 'cloud') => {
    setResolvingId(campaignId);
    
    try {
      const success = await UnifiedSaveArchitecture.resolveConflict(campaignId, resolution);
      
      if (success) {
        setResolved(prev => new Set([...prev, campaignId]));
        toast.success(`Conflict resolved - kept ${resolution === 'local' ? 'local' : 'cloud'} version`);
      } else {
        toast.error('Failed to resolve conflict');
      }
    } catch (error) {
      toast.error('Error resolving conflict');
    } finally {
      setResolvingId(null);
    }
  };
  
  const allResolved = conflicts.length > 0 && conflicts.every(c => resolved.has(c.campaignId));
  
  const handleClose = () => {
    if (allResolved) {
      onResolved();
    }
    setResolved(new Set());
    onClose();
  };
  
  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };
  
  return (
    <Dialog open={open} onOpenChange={() => handleClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Sync Conflicts Detected
          </DialogTitle>
          <DialogDescription>
            Your local saves have diverged from the cloud. Choose which version to keep for each campaign.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {conflicts.map((conflict) => {
              const isResolved = resolved.has(conflict.campaignId);
              const isResolving = resolvingId === conflict.campaignId;
              
              return (
                <Card key={conflict.campaignId} className={`p-4 ${isResolved ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{conflict.campaignName}</h4>
                      {isResolved && (
                        <Badge variant="secondary" className="mt-1">
                          <Check className="w-3 h-3 mr-1" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Local Version */}
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-blue-500" />
                        <span className="font-medium text-blue-500">Local Version</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(conflict.localVersion.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{conflict.localVersion.chapterCount} chapters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          <span>{formatPlayTime(conflict.localVersion.playTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cloud Version */}
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Cloud className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-green-500">Cloud Version</span>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(conflict.cloudVersion.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{conflict.cloudVersion.chapterCount} chapters</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          <span>{formatPlayTime(conflict.cloudVersion.playTime)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!isResolved && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-blue-500/50 hover:bg-blue-500/10"
                        onClick={() => handleResolve(conflict.campaignId, 'local')}
                        disabled={isResolving}
                      >
                        <HardDrive className="w-4 h-4 mr-2" />
                        Keep Local
                        <ArrowRight className="w-4 h-4 ml-2" />
                        <Cloud className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-green-500/50 hover:bg-green-500/10"
                        onClick={() => handleResolve(conflict.campaignId, 'cloud')}
                        disabled={isResolving}
                      >
                        <Cloud className="w-4 h-4 mr-2" />
                        Keep Cloud
                        <ArrowRight className="w-4 h-4 ml-2" />
                        <HardDrive className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
        
        {conflicts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No conflicts to resolve</p>
          </div>
        )}
        
        <Separator />
        
        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            {allResolved ? 'Done' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
