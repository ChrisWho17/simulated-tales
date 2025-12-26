// ============================================================================
// CHECKPOINT MANAGER - Manual save point management
// ============================================================================

import { useState, useCallback } from 'react';
import { useCampaign } from '@/contexts/CampaignContext';
import { CampaignCheckpoint } from '@/types/campaign';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  Save,
  RotateCcw,
  Trash2,
  Clock,
  Bookmark,
  BookmarkPlus,
  AlertTriangle,
} from 'lucide-react';

interface CheckpointManagerProps {
  variant?: 'button' | 'sheet';
}

export function CheckpointManager({ variant = 'button' }: CheckpointManagerProps) {
  const { activeCampaign, createCheckpoint, restoreCheckpoint, deleteCheckpoint } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [restoreConfirm, setRestoreConfirm] = useState<CampaignCheckpoint | null>(null);
  
  if (!activeCampaign) return null;
  
  const checkpoints = activeCampaign.checkpoints;
  
  const handleCreate = useCallback(() => {
    if (!newLabel.trim()) {
      toast.error('Please enter a checkpoint label');
      return;
    }
    
    const checkpoint = createCheckpoint(newLabel.trim());
    if (checkpoint) {
      toast.success(`Checkpoint "${newLabel.trim()}" created`);
      setNewLabel('');
    } else {
      toast.error('Failed to create checkpoint');
    }
  }, [newLabel, createCheckpoint]);
  
  const handleRestore = useCallback(() => {
    if (!restoreConfirm) return;
    
    const success = restoreCheckpoint(restoreConfirm.id);
    if (success) {
      toast.success(`Restored to "${restoreConfirm.label}"`);
      setRestoreConfirm(null);
    } else {
      toast.error('Failed to restore checkpoint');
    }
  }, [restoreConfirm, restoreCheckpoint]);
  
  const handleDelete = useCallback((checkpointId: string, label: string) => {
    deleteCheckpoint(checkpointId);
    toast.success(`Deleted "${label}"`);
  }, [deleteCheckpoint]);
  
  const content = (
    <div className="space-y-4">
      {/* Create New Checkpoint */}
      <Card className="p-4 bg-card/50 backdrop-blur border-border/50">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <BookmarkPlus className="h-4 w-4 text-primary" />
          Create Checkpoint
        </h4>
        <div className="flex gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Checkpoint name..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <Button onClick={handleCreate} size="sm" className="gap-1">
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </Card>
      
      {/* Checkpoint List */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bookmark className="h-4 w-4" />
          Saved Checkpoints ({checkpoints.length}/5)
        </h4>
        
        {checkpoints.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No checkpoints yet. Create one to save your progress!
          </p>
        ) : (
          <div className="space-y-2">
            {checkpoints.map((checkpoint) => (
              <CheckpointItem
                key={checkpoint.id}
                checkpoint={checkpoint}
                onRestore={() => setRestoreConfirm(checkpoint)}
                onDelete={() => handleDelete(checkpoint.id, checkpoint.label)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Restore Confirmation Dialog */}
      <Dialog open={!!restoreConfirm} onOpenChange={() => setRestoreConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Restore Checkpoint?
            </DialogTitle>
            <DialogDescription>
              Restoring to "{restoreConfirm?.label}" will revert your character and story to that point.
              Your current progress will be auto-saved as a checkpoint before restoring.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={handleRestore}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  if (variant === 'sheet') {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Checkpoints
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Checkpoints</SheetTitle>
            <SheetDescription>
              Save your progress at key moments and restore anytime
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bookmark className="h-4 w-4" />
          Checkpoints
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checkpoints</DialogTitle>
          <DialogDescription>
            Save your progress at key moments and restore anytime
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CHECKPOINT ITEM
// ============================================================================

interface CheckpointItemProps {
  checkpoint: CampaignCheckpoint;
  onRestore: () => void;
  onDelete: () => void;
}

function CheckpointItem({ checkpoint, onRestore, onDelete }: CheckpointItemProps) {
  const date = new Date(checkpoint.createdAt);
  
  return (
    <Card className="p-3 bg-card/30 backdrop-blur border-border/30 hover:border-border/50 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-foreground truncate">
            {checkpoint.label}
          </h5>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onRestore}
            title="Restore"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
